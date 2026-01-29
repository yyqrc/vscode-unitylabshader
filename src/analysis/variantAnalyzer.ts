import * as vscode from 'vscode';
import { maskCommentsPreserveLayout } from '../utils/commentMask';

/**
 * 变体关键字信息
 */
interface VariantKeyword {
    keyword: string;
    options: string[];
    line: number;
}

/**
 * 变体分析结果
 */
interface VariantAnalysisResult {
    totalVariants: number;
    keywords: VariantKeyword[];
    hasWarning: boolean;
    warningMessage?: string;
}

/**
 * Shader 变体分析器
 * 分析 #pragma multi_compile 和 shader_feature 生成的变体数量
 */
export class VariantAnalyzer {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private decorationType: vscode.TextEditorDecorationType;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('unityshader-variants');
        
        // 创建装饰类型用于显示变体数量
        this.decorationType = vscode.window.createTextEditorDecorationType({
            after: {
                margin: '0 0 0 1em',
                textDecoration: 'none'
            }
        });
    }

    /**
     * 获取配置的阈值
     */
    private getThresholds(): { warning: number; error: number } {
        const config = vscode.workspace.getConfiguration('unityshader');
        return {
            warning: config.get<number>('analysis.maxVariantsWarning', 256),
            error: config.get<number>('analysis.maxVariantsError', 512)
        };
    }

    /**
     * 分析文档中的变体
     */
    public analyzeDocument(document: vscode.TextDocument, editor?: vscode.TextEditor): VariantAnalysisResult {
        const rawText = document.getText();
        const analysisText = maskCommentsPreserveLayout(rawText);
        const rawLines = rawText.split('\n');
        const lines = analysisText.split('\n');
        
        const keywords: VariantKeyword[] = [];
        const diagnostics: vscode.Diagnostic[] = [];
        const decorations: vscode.DecorationOptions[] = [];
        const seenPragmas = new Set<string>(); // 用于去重

        let inCGProgram = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // 检测 CGPROGRAM/HLSLPROGRAM 块
            if (line.match(/^\s*(CG|HLSL)PROGRAM/)) {
                inCGProgram = true;
                seenPragmas.clear(); // 每个新的CG/HLSL块重置去重集合
                continue;
            }
            if (line.match(/^\s*END(CG|HLSL)/)) {
                inCGProgram = false;
                continue;
            }

            if (!inCGProgram) {
                continue;
            }

            // 匹配 #pragma multi_compile 或 #pragma shader_feature
            const pragmaMatch = line.match(/^\s*#pragma\s+(multi_compile|shader_feature)(_local)?\s+(.+)/);
            if (pragmaMatch) {
                const pragmaType = pragmaMatch[1];
                const optionsStr = pragmaMatch[3].trim();
                
                // 创建唯一标识符用于去重
                const pragmaKey = `${pragmaType}:${optionsStr}`;
                
                // 如果已经见过这个pragma，跳过
                if (seenPragmas.has(pragmaKey)) {
                    continue;
                }
                seenPragmas.add(pragmaKey);
                
                // 解析选项
                const options = this.parseOptions(optionsStr);
                
                keywords.push({
                    keyword: pragmaType,
                    options,
                    line: i
                });
            }
        }

        // 计算总变体数
        const totalVariants = this.calculateTotalVariants(keywords);
        const thresholds = this.getThresholds();

        // 为每个 pragma 行添加装饰和诊断
        for (const keyword of keywords) {
            const line = keyword.line;
            const lineText = rawLines[line];
            const optionCount = keyword.options.length;

            // 添加装饰（显示变体数量）
            if (editor) {
                const decoration: vscode.DecorationOptions = {
                    range: new vscode.Range(line, lineText.length, line, lineText.length),
                    renderOptions: {
                        after: {
                            contentText: ` → ${optionCount} variants`,
                            color: this.getVariantCountColor(totalVariants, thresholds),
                            fontStyle: 'italic'
                        }
                    }
                };
                decorations.push(decoration);
            }
        }

        // 应用装饰
        if (editor) {
            editor.setDecorations(this.decorationType, decorations);
        }

        // 生成警告或错误
        if (totalVariants > thresholds.error) {
            const range = new vscode.Range(0, 0, 0, 0);
            const diagnostic = new vscode.Diagnostic(
                range,
                `Shader 变体数量过多: ${totalVariants} 个变体（建议 < ${thresholds.warning}，最大 ${thresholds.error}）\n` +
                `Too many shader variants: ${totalVariants} variants (recommended < ${thresholds.warning}, max ${thresholds.error})`,
                vscode.DiagnosticSeverity.Error
            );
            diagnostics.push(diagnostic);
        } else if (totalVariants > thresholds.warning) {
            const range = new vscode.Range(0, 0, 0, 0);
            const diagnostic = new vscode.Diagnostic(
                range,
                `Shader 变体数量较多: ${totalVariants} 个变体（建议 < ${thresholds.warning}）\n` +
                `Many shader variants: ${totalVariants} variants (recommended < ${thresholds.warning})`,
                vscode.DiagnosticSeverity.Warning
            );
            diagnostics.push(diagnostic);
        }

        this.diagnosticCollection.set(document.uri, diagnostics);

        return {
            totalVariants,
            keywords,
            hasWarning: totalVariants > thresholds.warning,
            warningMessage: totalVariants > thresholds.warning 
                ? `变体数量: ${totalVariants}` 
                : undefined
        };
    }

    /**
     * 解析 pragma 选项
     */
    private parseOptions(optionsStr: string): string[] {
        // 移除注释（支持 // 和 /* */ 两种注释）
        let withoutComment = optionsStr;
        
        // 移除行注释 //
        const lineCommentIndex = withoutComment.indexOf('//');
        if (lineCommentIndex >= 0) {
            withoutComment = withoutComment.substring(0, lineCommentIndex);
        }
        
        // 移除块注释 /* */
        withoutComment = withoutComment.replace(/\/\*.*?\*\//g, '');
        
        // 分割选项并过滤空字符串
        const options = withoutComment.trim().split(/\s+/).filter(opt => opt.length > 0);
        
        return options;
    }
    /**
     * 计算总变体数
     */
    private calculateTotalVariants(keywords: VariantKeyword[]): number {
        if (keywords.length === 0) {
            return 1;
        }

        let total = 1;
        for (const keyword of keywords) {
            total *= keyword.options.length;
        }

        return total;
    }

    /**
     * 获取变体数量的颜色
     */
    private getVariantCountColor(totalVariants: number, thresholds: { warning: number; error: number }): string {
        if (totalVariants > thresholds.error) {
            return '#ff0000'; // 红色
        } else if (totalVariants > thresholds.warning) {
            return '#ffa500'; // 橙色
        } else {
            return '#808080'; // 灰色
        }
    }

    /**
     * 获取变体详细信息（用于悬停提示）
     */
    public getVariantDetails(document: vscode.TextDocument, line: number): string | undefined {
        const text = document.getText();
        const lines = text.split('\n');
        
        if (line < 0 || line >= lines.length) {
            return undefined;
        }

        const lineText = lines[line];
        const pragmaMatch = lineText.match(/^\s*#pragma\s+(multi_compile|shader_feature)(_local)?\s+(.+)/);
        
        if (!pragmaMatch) {
            return undefined;
        }

        const pragmaType = pragmaMatch[1];
        const optionsStr = pragmaMatch[3].trim();
        const options = this.parseOptions(optionsStr); // 使用 parseOptions 方法来正确移除注释

        // 构建详细信息
        let details = `**${pragmaType}** 变体关键字\n\n`;
        details += `**选项数量**: ${options.length}\n\n`;
        details += `**所有选项**:\n`;
        
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            if (option === '__' || option === '_') {
                details += `  ${i + 1}. \`${option}\` (无定义)\n`;
            } else {
                details += `  ${i + 1}. \`${option}\`\n`;
            }
        }

        // 计算当前文档的总变体数
        const result = this.analyzeDocument(document);
        details += `\n**当前 Shader 总变体数**: ${result.totalVariants}\n`;

        if (result.hasWarning) {
            details += `\n⚠️ **警告**: 变体数量较多，可能影响编译时间和包体大小\n`;
            details += `\n**优化建议**:\n`;
            
            // 根据当前pragma类型给出不同建议
            if (pragmaType === 'multi_compile') {
                details += `- 使用 \`shader_feature\` 替代 \`multi_compile\`（如果可能）\n`;
                details += `- 考虑使用 \`multi_compile_local\` 限制变体范围\n`;
            } else {
                details += `- 考虑使用 \`shader_feature_local\` 限制变体范围\n`;
            }
            details += `- 减少不必要的变体组合\n`;
            details += `- 将相关变体合并为一个pragma\n`;
        }

        return details;
    }

    /**
     * 获取变体组合列表
     */
    public getVariantCombinations(keywords: VariantKeyword[]): string[][] {
        if (keywords.length === 0) {
            return [[]];
        }

        const combinations: string[][] = [[]];

        for (const keyword of keywords) {
            const newCombinations: string[][] = [];
            
            for (const combination of combinations) {
                for (const option of keyword.options) {
                    newCombinations.push([...combination, option]);
                }
            }

            combinations.length = 0;
            combinations.push(...newCombinations);
        }

        return combinations;
    }

    /**
     * 清理资源
     */
    public dispose(): void {
        this.diagnosticCollection.dispose();
        this.decorationType.dispose();
    }
}
