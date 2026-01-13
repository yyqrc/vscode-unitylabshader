import * as vscode from 'vscode';
import { RegexCache } from '../utils/RegexCache';

/**
 * 变量信息接口
 */
interface VariableInfo {
    name: string;
    type: string;
    line: number;
    character: number;
    isUsed: boolean;
    isParameter: boolean;
    scope: string; // 'global' | 'function' | 'struct'
}

/**
 * 函数信息接口
 */
interface FunctionInfo {
    name: string;
    returnType: string;
    parameters: Array<{ name: string; type: string }>;
    line: number;
    isUsed: boolean;
}

/**
 * 语义分析器类
 * 负责变量类型推断、未使用变量检测等
 */
export class SemanticAnalyzer {
    private variables: Map<string, VariableInfo[]> = new Map();
    private functions: Map<string, FunctionInfo> = new Map();
    private diagnosticCollection: vscode.DiagnosticCollection;

    // 预编译常用正则表达式
    private static readonly REGEX_PATTERNS = {
        CG_HLSL_PROGRAM: /^(CG|HLSL)PROGRAM/,
        END_CG_HLSL: /^END(CG|HLSL)/,
        SHADERLAB_KEYWORDS: /^(Shader|Properties|SubShader|Pass|Tags|Name|LOD|Cull|ZWrite|ZTest|Blend|ColorMask|Stencil|Offset|AlphaToMask|Conservative|Fallback|CustomEditor|Category|UsePass|GrabPass)\b/i,
        STRUCT_DEF: /^struct\s+(\w+)/,
        FUNCTION_DEF: /^(\w+)\s+(\w+)\s*\([^)]*\)\s*{?/,
        PARAM_EXTRACT: /\(([^)]*)\)/,
        VAR_DECL: /^(\w+(?:\d+)?(?:<[^>]+>)?)\s+(\w+)(?:\s*=|\s*;|\s*\[|\s*\()/,
        MULTI_VAR_DECL: /^(\w+(?:\d+)?(?:<[^>]+>)?)\s+([\w\s,]+);/,
        BRACE_OPEN: /{/g,
        BRACE_CLOSE: /}/g,
    };

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('unityshader-semantic');
    }

    /**
     * 分析文档
     */
    public analyzeDocument(document: vscode.TextDocument): void {
        this.variables.clear();
        this.functions.clear();

        const text = document.getText();
        const lines = text.split('\n');

        // 第一遍：收集所有变量和函数定义
        this.collectDefinitions(lines, document);

        // 第二遍：检查变量使用情况
        this.checkUsage(lines, document);

        // 生成诊断信息
        this.generateDiagnostics(document);
    }

    /**
     * 收集变量和函数定义
     */
    private collectDefinitions(lines: string[], document: vscode.TextDocument): void {
        let currentFunction = '';
        let braceDepth = 0;
        let inCGProgram = false;
        let inStruct = false;
        let currentStruct = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();

            // 检测 CGPROGRAM/HLSLPROGRAM 块
            if (trimmedLine.match(/^(CG|HLSL)PROGRAM/)) {
                inCGProgram = true;
                continue;
            }
            if (trimmedLine.match(/^END(CG|HLSL)/)) {
                inCGProgram = false;
                continue;
            }

            // 跳过 ShaderLab 属性块和其他非代码行
            // 但允许分析纯 HLSL 文件（没有 CGPROGRAM/HLSLPROGRAM 标记）
            if (!inCGProgram) {
                // 如果是 ShaderLab 关键字开头的行，跳过
                if (trimmedLine.match(/^(Shader|Properties|SubShader|Pass|Tags|Name|LOD|Cull|ZWrite|ZTest|Blend|ColorMask|Stencil|Offset|AlphaToMask|Conservative|Fallback|CustomEditor|Category|UsePass|GrabPass)\b/i)) {
                    continue;
                }
                // 如果是空行或注释，跳过
                if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
                    continue;
                }
                // 其他情况，假设是纯 HLSL 代码，继续分析
            }

            // 跟踪大括号深度
            braceDepth += (trimmedLine.match(/{/g) || []).length;
            braceDepth -= (trimmedLine.match(/}/g) || []).length;

            // 检测结构体
            const structMatch = trimmedLine.match(/^struct\s+(\w+)/);
            if (structMatch) {
                inStruct = true;
                currentStruct = structMatch[1];
                continue;
            }

            if (inStruct && trimmedLine.includes('}')) {
                inStruct = false;
                currentStruct = '';
            }

            // 检测函数定义
            const functionMatch = trimmedLine.match(/^(\w+)\s+(\w+)\s*\([^)]*\)\s*{?/);
            if (functionMatch && !inStruct) {
                const returnType = functionMatch[1];
                const functionName = functionMatch[2];
                
                // 排除一些关键字
                if (!this.isKeyword(returnType) && !this.isKeyword(functionName)) {
                    currentFunction = functionName;
                    
                    // 提取参数
                    const paramMatch = trimmedLine.match(/\(([^)]*)\)/);
                    const parameters: Array<{ name: string; type: string }> = [];
                    
                    if (paramMatch && paramMatch[1].trim()) {
                        const params = paramMatch[1].split(',');
                        for (const param of params) {
                            const paramParts = param.trim().split(/\s+/);
                            if (paramParts.length >= 2) {
                                const paramType = paramParts.slice(0, -1).join(' ');
                                const paramName = paramParts[paramParts.length - 1].replace(/[:\[\]]/g, '');
                                parameters.push({ name: paramName, type: paramType });
                                
                                // 将参数作为变量添加（计算实际字符位置）
                                const paramCharPos = line.indexOf(paramName);
                                this.addVariable(paramName, paramType, i, paramCharPos >= 0 ? paramCharPos : 0, true, currentFunction);
                            }
                        }
                    }
                    
                    this.functions.set(functionName, {
                        name: functionName,
                        returnType,
                        parameters,
                        line: i,
                        isUsed: false
                    });
                }
            }

            // 检测变量声明（改进的正则表达式，支持带初始化的声明）
            // 匹配: float3 color = ...; 或 float alpha = ...; 或 v2f o;
            // 注意：不使用 ^ 开头，因为 trimmedLine 已经去除了前导空格
            const varMatch = trimmedLine.match(/^(\w+(?:\d+)?(?:<[^>]+>)?)\s+(\w+)(?:\s*=|\s*;|\s*\[|\s*\()/);
            if (varMatch && !inStruct) {
                const varType = varMatch[1];
                const varName = varMatch[2];
                // console.log(`[SemanticAnalyzer] 第${i}行匹配到变量声明: ${varType} ${varName}`);
                
                // 排除关键字和函数调用
                if (!this.isKeyword(varType) && !this.isKeyword(varName) && !trimmedLine.includes(`${varName}(`)) {
                    const scope = currentFunction || 'global';
                    // 在原始行中查找变量名的位置（考虑缩进）
                    const varCharPos = line.indexOf(varName, line.indexOf(varType));
                    // console.log(`[SemanticAnalyzer]   添加变量: ${varName}, 类型: ${varType}, 作用域: ${scope}`);
                    this.addVariable(varName, varType, i, varCharPos >= 0 ? varCharPos : 0, false, scope);
                } else {
                    // console.log(`[SemanticAnalyzer]   跳过（关键字或函数调用）: isKeyword(${varType})=${this.isKeyword(varType)}, isKeyword(${varName})=${this.isKeyword(varName)}, 包含函数调用=${trimmedLine.includes(`${varName}(`)}`);
                }
            }

            // 检测多变量声明 (如: float a, b, c;)
            const multiVarMatch = trimmedLine.match(/^(\w+(?:\d+)?(?:<[^>]+>)?)\s+([\w\s,]+);/);
            if (multiVarMatch && !inStruct && !trimmedLine.includes('(')) {
                const varType = multiVarMatch[1];
                const varNames = multiVarMatch[2].split(',');
                
                if (!this.isKeyword(varType)) {
                    for (const varName of varNames) {
                        const name = varName.trim();
                        if (name && !this.isKeyword(name)) {
                            const scope = currentFunction || 'global';
                            const varCharPos = line.indexOf(name, line.indexOf(varType));
                            this.addVariable(name, varType, i, varCharPos >= 0 ? varCharPos : 0, false, scope);
                        }
                    }
                }
            }

            // 函数结束时重置
            if (braceDepth === 0 && currentFunction) {
                currentFunction = '';
            }
        }
    }

    /**
     * 检查变量和函数使用情况
     */
    private checkUsage(lines: string[], document: vscode.TextDocument): void {
        let inCGProgram = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();

            // 检测 CGPROGRAM/HLSLPROGRAM 块
            if (trimmedLine.match(/^(CG|HLSL)PROGRAM/)) {
                inCGProgram = true;
                continue;
            }
            if (trimmedLine.match(/^END(CG|HLSL)/)) {
                inCGProgram = false;
                continue;
            }

            // 跳过 ShaderLab 属性块和其他非代码行
            // 但允许分析纯 HLSL 文件（没有 CGPROGRAM/HLSLPROGRAM 标记）
            if (!inCGProgram) {
                // 如果是 ShaderLab 关键字开头的行，跳过
                if (trimmedLine.match(/^(Shader|Properties|SubShader|Pass|Tags|Name|LOD|Cull|ZWrite|ZTest|Blend|ColorMask|Stencil|Offset|AlphaToMask|Conservative|Fallback|CustomEditor|Category|UsePass|GrabPass)\b/i)) {
                    continue;
                }
                // 如果是空行或注释，跳过
                if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
                    continue;
                }
                // 其他情况，假设是纯 HLSL 代码，继续分析
            }

            // 检查变量使用
            for (const [varName, varInfos] of this.variables) {
                const regex = new RegExp(`\\b${varName}\\b`, 'g');
                const matches = line.match(regex);
                
                if (matches) {
                    for (const varInfo of varInfos) {
                        // 如果不是定义行，标记为已使用
                        if (i !== varInfo.line) {
                            varInfo.isUsed = true;
                        } else {
                            // 如果是定义行，检查是否在等号右侧或其他地方使用
                            // 例如: float x = x + 1; 或 return fixed4(color, alpha);
                            const declarationMatch = trimmedLine.match(new RegExp(`^\\w+(?:\\d+)?\\s+${varName}\\s*=`));
                            if (!declarationMatch) {
                                // 不是简单的声明，可能是使用
                                varInfo.isUsed = true;
                            } else {
                                // 检查等号右侧是否使用了该变量
                                const equalSignIndex = line.indexOf('=');
                                if (equalSignIndex >= 0) {
                                    const rightSide = line.substring(equalSignIndex + 1);
                                    if (new RegExp(`\\b${varName}\\b`).test(rightSide)) {
                                        varInfo.isUsed = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 检查函数使用
            for (const [funcName, funcInfo] of this.functions) {
                const regex = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
                if (regex.test(line) && i !== funcInfo.line) {
                    funcInfo.isUsed = true;
                }
            }
        }
    }

    /**
     * 生成诊断信息
     */
    private generateDiagnostics(document: vscode.TextDocument): void {
        const diagnostics: vscode.Diagnostic[] = [];

        // 检查未使用的变量
        for (const [varName, varInfos] of this.variables) {
            for (const varInfo of varInfos) {
                if (!varInfo.isUsed && !varInfo.isParameter) {
                    // 跳过以下划线开头的变量（通常是有意未使用的）
                    if (varName.startsWith('_')) {
                        continue;
                    }

                    const range = new vscode.Range(
                        varInfo.line,
                        varInfo.character,
                        varInfo.line,
                        varInfo.character + varName.length
                    );

                    const diagnostic = new vscode.Diagnostic(
                        range,
                        `变量 '${varName}' 已声明但未使用 (Variable '${varName}' is declared but never used)`,
                        vscode.DiagnosticSeverity.Hint
                    );
                    diagnostic.tags = [vscode.DiagnosticTag.Unnecessary];
                    diagnostics.push(diagnostic);
                }
            }
        }

        // 检查未使用的函数
        for (const [funcName, funcInfo] of this.functions) {
            // 跳过常见的入口函数
            const entryFunctions = ['vert', 'frag', 'surf', 'main', 'vertex', 'fragment'];
            if (entryFunctions.includes(funcName.toLowerCase())) {
                continue;
            }

            if (!funcInfo.isUsed) {
                const range = new vscode.Range(
                    funcInfo.line,
                    0,
                    funcInfo.line,
                    funcName.length
                );

                const diagnostic = new vscode.Diagnostic(
                    range,
                    `函数 '${funcName}' 已声明但未使用 (Function '${funcName}' is declared but never used)`,
                    vscode.DiagnosticSeverity.Hint
                );
                diagnostic.tags = [vscode.DiagnosticTag.Unnecessary];
                diagnostics.push(diagnostic);
            }
        }

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    /**
     * 添加变量
     */
    private addVariable(
        name: string,
        type: string,
        line: number,
        character: number,
        isParameter: boolean,
        scope: string
    ): void {
        const varInfo: VariableInfo = {
            name,
            type,
            line,
            character,
            isUsed: false,
            isParameter,
            scope
        };

        if (!this.variables.has(name)) {
            this.variables.set(name, []);
        }
        this.variables.get(name)!.push(varInfo);
    }

    /**
     * 获取变量类型（用于悬停提示）
     */
    public getVariableType(varName: string, line: number): string | undefined {
        const varInfos = this.variables.get(varName);
        if (!varInfos) {
            return undefined;
        }

        // 找到最近的定义
        let closestVar: VariableInfo | undefined;
        for (const varInfo of varInfos) {
            if (varInfo.line <= line) {
                if (!closestVar || varInfo.line > closestVar.line) {
                    closestVar = varInfo;
                }
            }
        }

        if (closestVar) {
            return closestVar.type;
        } else {
            return undefined;
        }
    }

    /**
     * 获取函数信息
     */
    public getFunctionInfo(funcName: string): FunctionInfo | undefined {
        return this.functions.get(funcName);
    }

    /**
     * 判断是否为关键字
     */
    private isKeyword(word: string): boolean {
        const keywords = [
            'if', 'else', 'for', 'while', 'do', 'return', 'break', 'continue',
            'switch', 'case', 'default', 'struct', 'void', 'const', 'static',
            'uniform', 'in', 'out', 'inout', 'sampler2D', 'sampler3D', 'samplerCUBE',
            'Shader', 'Properties', 'SubShader', 'Pass', 'Tags', 'CGPROGRAM',
            'ENDCG', 'HLSLPROGRAM', 'ENDHLSL', 'pragma', 'include'
        ];
        return keywords.includes(word.toLowerCase());
    }

    /**
     * 清理资源
     */
    public dispose(): void {
        this.diagnosticCollection.dispose();
    }
}
