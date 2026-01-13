import { CachedSymbol, CachedSymbolKind } from './symbolCacheTypes';
import { FileHasher } from './fileHasher';

/**
 * 简单的位置接口（替代 vscode.Position）
 */
interface Position {
    line: number;
    character: number;
}

/**
 * HLSL 符号解析器
 * 负责从文件内容中提取函数、宏、结构体等符号
 */
export class SymbolParser {
    // 函数定义正则表达式
    private static readonly FUNCTION_REGEX = /^\s*(?:inline\s+)?(?:static\s+)?(?:const\s+)?(\w+(?:\s*<[^>]+>)?)\s+(\w+)\s*\(([^)]*)\)\s*(?::\s*\w+\s*)?(?:\{|;)/gm;
    
    // 宏定义正则表达式
    private static readonly MACRO_REGEX = /^\s*#define\s+(\w+)(?:\s*\(([^)]*)\))?\s*(.*?)(?:\\\s*$)?/gm;
    
    // 结构体定义正则表达式
    private static readonly STRUCT_REGEX = /^\s*(?:typedef\s+)?struct\s+(\w+)\s*(?:\{|;)/gm;
    
    // 类定义正则表达式
    private static readonly CLASS_REGEX = /^\s*class\s+(\w+)\s*(?::\s*[^{]+)?\s*\{/gm;
    
    // 全局变量定义正则表达式
    private static readonly VARIABLE_REGEX = /^\s*(?:static\s+)?(?:const\s+)?(?:uniform\s+)?(\w+(?:\s*<[^>]+>)?)\s+(\w+)\s*(?:=\s*[^;]+)?\s*;/gm;
    
    // typedef 定义正则表达式
    private static readonly TYPEDEF_REGEX = /^\s*typedef\s+(.+?)\s+(\w+)\s*;/gm;
    
    // Unity Shader 定义正则表达式: Shader "Name/Path"
    private static readonly SHADER_REGEX = /^\s*Shader\s+"([^"]+)"/gm;

    /**
     * 解析文件内容，提取所有符号
     */
    static parseFile(filePath: string, content: string): CachedSymbol[] {
        const symbols: CachedSymbol[] = [];
        const lines = content.split('\n');

        // 解析函数
        symbols.push(...this.parseFunctions(content, lines, filePath));

        // 解析宏定义
        symbols.push(...this.parseMacros(content, lines, filePath));

        // 解析结构体
        symbols.push(...this.parseStructs(content, lines, filePath));

        // 解析类
        symbols.push(...this.parseClasses(content, lines, filePath));

        // 解析全局变量
        symbols.push(...this.parseVariables(content, lines, filePath));

        // 解析 typedef
        symbols.push(...this.parseTypedefs(content, lines, filePath));

        // 解析 Unity Shader 定义（仅 .shader 文件）
        if (filePath.endsWith('.shader')) {
            symbols.push(...this.parseShaders(content, lines, filePath));
        }

        return symbols;
    }

    /**
     * 解析函数定义
     */
    private static parseFunctions(content: string, lines: string[], filePath: string): CachedSymbol[] {
        const symbols: CachedSymbol[] = [];
        const regex = new RegExp(this.FUNCTION_REGEX);
        let match: RegExpExecArray | null;

        while ((match = regex.exec(content)) !== null) {
            const returnType = match[1].trim();
            const functionName = match[2].trim();
            const params = match[3].trim();

            // 跳过一些常见的非函数模式
            if (this.shouldSkipFunction(functionName, returnType)) {
                continue;
            }

            const position = this.getPosition(content, match.index, lines);
            const endPosition = this.findFunctionEnd(content, match.index, lines);

            // 生成函数签名（用于跨文件移动检测）
            const signature = `${returnType} ${functionName}(${params})`;
            const definitionText = content.substring(match.index, match.index + match[0].length);

            symbols.push({
                name: functionName,
                kind: CachedSymbolKind.Function,
                filePath,
                line: position.line,
                column: position.character,
                endLine: endPosition.line,
                endColumn: endPosition.character,
                signature,
                contentHash: FileHasher.hashString(signature),
                definitionText,
            });
        }

        return symbols;
    }

    /**
     * 解析宏定义
     */
    private static parseMacros(content: string, lines: string[], filePath: string): CachedSymbol[] {
        const symbols: CachedSymbol[] = [];
        const regex = new RegExp(this.MACRO_REGEX);
        let match: RegExpExecArray | null;

        while ((match = regex.exec(content)) !== null) {
            const macroName = match[1].trim();
            const params = match[2] ? match[2].trim() : '';
            
            // 计算宏定义的实际开始位置（跳过前面的空白和换行符）
            const defineStart = match[0].indexOf('#define');
            if (defineStart === -1) {
                continue; // 不应该发生，但安全起见
            }
            
            const macroStartIndex = match.index + defineStart;
            const position = this.getPosition(content, macroStartIndex, lines);
            const endPosition = this.findMacroEnd(content, macroStartIndex, lines);

            // 生成宏签名
            const signature = params ? `#define ${macroName}(${params})` : `#define ${macroName}`;
            
            // 获取完整的定义文本（从宏定义开始到结束位置）
            const fullDefinitionText = this.getTextBetweenPositions(content, position, endPosition);
            
            // 计算体内容：从定义文本中移除宏签名部分
            const body = this.extractMacroBody(fullDefinitionText, macroName, params);

            symbols.push({
                name: macroName,
                kind: CachedSymbolKind.Macro,
                filePath,
                line: position.line,
                column: position.character,
                endLine: endPosition.line,
                endColumn: endPosition.character,
                signature,
                contentHash: FileHasher.hashString(signature + body),
                definitionText: fullDefinitionText,
            });
        }

        return symbols;
    }

    /**
     * 根据起始位置和结束位置获取文本内容
     */
    private static getTextBetweenPositions(content: string, startPos: Position, endPos: Position): string {
        const lines = content.split('\n');
        
        // 处理Windows换行符：计算索引时需要考虑\r字符
        let startIndex = 0;
        for (let i = 0; i < startPos.line; i++) {
            // 每行的实际长度 = 行内容长度 + 换行符长度
            const lineContent = lines[i];
            let newlineLength = 1; // 默认是\n
            // 检查当前行在原始内容中的换行符类型
            const lineStartInContent = startIndex;
            const expectedLineEnd = lineStartInContent + lineContent.length;
            if (expectedLineEnd < content.length && content[expectedLineEnd] === '\r') {
                newlineLength = 2; // \r\n
            }
            startIndex += lineContent.length + newlineLength;
        }
        startIndex += startPos.character;
        
        // 计算结束位置对应的字符索引
        let endIndex = 0;
        for (let i = 0; i < endPos.line; i++) {
            const lineContent = lines[i];
            let newlineLength = 1;
            
            const lineStartInContent = endIndex;
            const expectedLineEnd = lineStartInContent + lineContent.length;
            if (expectedLineEnd < content.length && content[expectedLineEnd] === '\r') {
                newlineLength = 2;
            }
            endIndex += lineContent.length + newlineLength;
        }
        endIndex += endPos.character;
        
        return content.substring(startIndex, endIndex).trim();
    }
    
    /**
     * 从宏定义文本中提取体内容
     */
    private static extractMacroBody(definitionText: string, macroName: string, params: string): string {
        // 构建宏签名
        const signature = params ? `#define ${macroName}(${params})` : `#define ${macroName}`;
        
        // 找到签名在定义文本中的位置
        const signatureIndex = definitionText.indexOf(signature);
        if (signatureIndex === -1) {
            return '';
        }
        
        // 体内容从签名之后开始
        const bodyStart = signatureIndex + signature.length;
        return definitionText.substring(bodyStart).trim();
    }

    /**
     * 解析结构体定义
     */
    private static parseStructs(content: string, lines: string[], filePath: string): CachedSymbol[] {
        const symbols: CachedSymbol[] = [];
        const regex = new RegExp(this.STRUCT_REGEX);
        let match: RegExpExecArray | null;

        while ((match = regex.exec(content)) !== null) {
            const structName = match[1].trim();
            const position = this.getPosition(content, match.index, lines);
            const endPosition = this.findBlockEnd(content, match.index, lines);

            const signature = `struct ${structName}`;
            const definitionText = match[0];

            symbols.push({
                name: structName,
                kind: CachedSymbolKind.Struct,
                filePath,
                line: position.line,
                column: position.character,
                endLine: endPosition.line,
                endColumn: endPosition.character,
                signature,
                contentHash: FileHasher.hashString(signature),
                definitionText,
            });
        }

        return symbols;
    }

    /**
     * 解析类定义
     */
    private static parseClasses(content: string, lines: string[], filePath: string): CachedSymbol[] {
        const symbols: CachedSymbol[] = [];
        const regex = new RegExp(this.CLASS_REGEX);
        let match: RegExpExecArray | null;

        while ((match = regex.exec(content)) !== null) {
            const className = match[1].trim();
            const position = this.getPosition(content, match.index, lines);
            const endPosition = this.findBlockEnd(content, match.index, lines);

            const signature = `class ${className}`;
            const definitionText = match[0];

            symbols.push({
                name: className,
                kind: CachedSymbolKind.Class,
                filePath,
                line: position.line,
                column: position.character,
                endLine: endPosition.line,
                endColumn: endPosition.character,
                signature,
                contentHash: FileHasher.hashString(signature),
                definitionText,
            });
        }

        return symbols;
    }

    /**
     * 解析全局变量
     */
    private static parseVariables(content: string, lines: string[], filePath: string): CachedSymbol[] {
        const symbols: CachedSymbol[] = [];
        const regex = new RegExp(this.VARIABLE_REGEX);
        let match: RegExpExecArray | null;

        while ((match = regex.exec(content)) !== null) {
            const varType = match[1].trim();
            const varName = match[2].trim();

            // 跳过函数调用和其他非变量定义
            if (this.shouldSkipVariable(varName, varType)) {
                continue;
            }

            const position = this.getPosition(content, match.index, lines);
            const endPosition = this.getPosition(content, match.index + match[0].length, lines);

            const signature = `${varType} ${varName}`;
            const definitionText = match[0];

            symbols.push({
                name: varName,
                kind: CachedSymbolKind.Variable,
                filePath,
                line: position.line,
                column: position.character,
                endLine: endPosition.line,
                endColumn: endPosition.character,
                signature,
                contentHash: FileHasher.hashString(signature),
                definitionText,
            });
        }

        return symbols;
    }

    /**
     * 解析 typedef 定义
     */
    private static parseTypedefs(content: string, lines: string[], filePath: string): CachedSymbol[] {
        const symbols: CachedSymbol[] = [];
        const regex = new RegExp(this.TYPEDEF_REGEX);
        let match: RegExpExecArray | null;

        while ((match = regex.exec(content)) !== null) {
            const originalType = match[1].trim();
            const aliasName = match[2].trim();

            const position = this.getPosition(content, match.index, lines);
            const endPosition = this.getPosition(content, match.index + match[0].length, lines);

            const signature = `typedef ${originalType} ${aliasName}`;
            const definitionText = match[0];

            symbols.push({
                name: aliasName,
                kind: CachedSymbolKind.Typedef,
                filePath,
                line: position.line,
                column: position.character,
                endLine: endPosition.line,
                endColumn: endPosition.character,
                signature,
                contentHash: FileHasher.hashString(signature),
                definitionText,
            });
        }

        return symbols;
    }

    /**
     * 获取字符索引在文件中的位置
     */
    private static getPosition(content: string, index: number, lines: string[]): Position {
        let currentIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            // 处理Windows换行符：行长度 + 换行符长度（\n或\r\n）
            let newlineLength = 1; // 默认是\n
            const actualLineEnd = currentIndex + lines[i].length;
            if (actualLineEnd < content.length && content[actualLineEnd] === '\r') {
                // Windows换行符\r\n，换行符长度为2
                newlineLength = 2;
            }
            const lineLength = lines[i].length + newlineLength;
            
            if (currentIndex + lineLength > index) {
                return { line: i, character: index - currentIndex };
            }
            currentIndex += lineLength;
        }
        return { line: lines.length - 1, character: lines[lines.length - 1].length };
    }

    /**
     * 查找函数定义的结束位置
     */
    private static findFunctionEnd(content: string, startIndex: number, lines: string[]): Position {
        // 查找函数体的结束大括号
        let braceCount = 0;
        let inFunction = false;
        
        for (let i = startIndex; i < content.length; i++) {
            const char = content[i];
            
            if (char === '{') {
                braceCount++;
                inFunction = true;
            } else if (char === '}') {
                braceCount--;
                if (inFunction && braceCount === 0) {
                    return this.getPosition(content, i + 1, lines);
                }
            } else if (char === ';' && !inFunction) {
                // 函数声明（没有函数体）
                return this.getPosition(content, i + 1, lines);
            }
        }

        // 如果没找到结束位置，返回起始位置
        return this.getPosition(content, startIndex, lines);
    }

    /**
     * 查找宏定义的结束位置（处理多行宏）
     */
    private static findMacroEnd(content: string, startIndex: number, lines: string[]): Position {
        let currentIndex = startIndex;
        
        // 查找宏定义的结束（处理反斜杠续行）
        while (currentIndex < content.length) {
            const lineEnd = content.indexOf('\n', currentIndex);
            if (lineEnd === -1) {
                return this.getPosition(content, content.length, lines);
            }

            // 检查行尾是否有反斜杠，处理Windows换行符
            const lineContent = content.substring(currentIndex, lineEnd).trimEnd();
            // 移除行尾的\r字符（Windows换行符\r\n中的\r）
            const cleanedLineContent = lineContent.replace(/\r\$/, '');
            if (!cleanedLineContent.endsWith('\\')) {                return this.getPosition(content, lineEnd, lines);
            }

            currentIndex = lineEnd + 1;
        }

        return this.getPosition(content, content.length, lines);
    }

    /**
     * 查找代码块的结束位置
     */
    private static findBlockEnd(content: string, startIndex: number, lines: string[]): Position {
        let braceCount = 0;
        let foundStart = false;

        for (let i = startIndex; i < content.length; i++) {
            const char = content[i];

            if (char === '{') {
                braceCount++;
                foundStart = true;
            } else if (char === '}') {
                braceCount--;
                if (foundStart && braceCount === 0) {
                    return this.getPosition(content, i + 1, lines);
                }
            } else if (char === ';' && !foundStart) {
                // 前向声明
                return this.getPosition(content, i + 1, lines);
            }
        }

        return this.getPosition(content, startIndex, lines);
    }

    /**
     * 判断是否应该跳过该函数
     */
    private static shouldSkipFunction(functionName: string, returnType: string): boolean {
        // 跳过一些常见的非函数模式
        const skipKeywords = ['if', 'for', 'while', 'switch', 'return'];
        return skipKeywords.includes(functionName.toLowerCase()) ||
               skipKeywords.includes(returnType.toLowerCase());
    }

    /**
     * 判断是否应该跳过该变量
     */
    private static shouldSkipVariable(varName: string, varType: string): boolean {
        // 跳过一些常见的非变量模式
        const skipKeywords = ['if', 'for', 'while', 'switch', 'return'];
        return skipKeywords.includes(varName.toLowerCase()) ||
               skipKeywords.includes(varType.toLowerCase());
    }

    /**
     * 解析 Unity Shader 定义
     */
    private static parseShaders(content: string, lines: string[], filePath: string): CachedSymbol[] {
        const symbols: CachedSymbol[] = [];
        const regex = new RegExp(this.SHADER_REGEX);
        let match: RegExpExecArray | null;

        while ((match = regex.exec(content)) !== null) {
            const shaderName = match[1].trim();
            const position = this.getPosition(content, match.index, lines);
            
            // 查找 Shader 名称在行中的精确位置
            const lineText = lines[position.line];
            const nameStartIndex = lineText.indexOf(`"${shaderName}"`);
            const nameColumn = nameStartIndex !== -1 ? nameStartIndex + 1 : position.character; // +1 跳过引号
            const nameEndColumn = nameColumn + shaderName.length;

            const signature = `Shader "${shaderName}"`;
            const definitionText = match[0];

            symbols.push({
                name: shaderName,
                kind: CachedSymbolKind.Shader,
                filePath,
                line: position.line,
                column: nameColumn,
                endLine: position.line,
                endColumn: nameEndColumn,
                signature,
                contentHash: FileHasher.hashString(signature),
                definitionText,
            });
        }

        return symbols;
    }

    /**
     * 比较两个符号是否相同（用于跨文件移动检测）
     */
    static areSymbolsEqual(symbol1: CachedSymbol, symbol2: CachedSymbol): boolean {
        // 首先比较名称和类型
        if (symbol1.name !== symbol2.name || symbol1.kind !== symbol2.kind) {
            return false;
        }

        // 如果有签名，比较签名
        if (symbol1.signature && symbol2.signature) {
            return symbol1.signature === symbol2.signature;
        }

        // 如果有内容哈希，比较哈希
        if (symbol1.contentHash && symbol2.contentHash) {
            return symbol1.contentHash === symbol2.contentHash;
        }

        // 否则只比较名称
        return true;
    }

    /**
     * 生成符号的唯一标识符（用于跨文件移动检测）
     */
    static getSymbolIdentifier(symbol: CachedSymbol): string {
        if (symbol.signature) {
            return FileHasher.hashSignature(symbol.signature);
        }
        return `${symbol.kind}:${symbol.name}`;
    }
}
