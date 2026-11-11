import { l10n } from 'vscode';
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
                            contentText: l10n.t(' → {0} variants', optionCount),
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
                l10n.t('Too many shader variants: {0} variants (recommended < {1}, max {2})', totalVariants, thresholds.warning, thresholds.error),
                vscode.DiagnosticSeverity.Error
            );
            diagnostics.push(diagnostic);
        } else if (totalVariants > thresholds.warning) {
            const range = new vscode.Range(0, 0, 0, 0);
            const diagnostic = new vscode.Diagnostic(
                range,
                l10n.t('Many shader variants: {0} variants (recommended < {1})', totalVariants, thresholds.warning),
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
                ? l10n.t('Variant count: {0}', totalVariants)
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
        let details = l10n.t('**{0}** variant keywords\n\n', pragmaType);
        details += l10n.t('**Option count**: {0}\n\n', options.length);
        details += l10n.t('**All options**:\n');
        
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            if (option === '__' || option === '_') {
                details += l10n.t('  {0}. `{1}` (not defined)\n', i + 1, option);
            } else {
                details += `  ${i + 1}. \`${option}\`\n`;
            }
        }

        // 计算当前文档的总变体数
        const result = this.analyzeDocument(document);
        details += l10n.t('\n**Total variants in this shader**: {0}\n', result.totalVariants);

        if (result.hasWarning) {
            details += l10n.t('\n⚠️ **Warning**: A high variant count may increase compilation time and build size\n');
            details += l10n.t('\n**Optimization tips**:\n');
            
            // 根据当前pragma类型给出不同建议
            if (pragmaType === 'multi_compile') {
                details += l10n.t('- Use `shader_feature` instead of `multi_compile` when possible\n');
                details += l10n.t('- Consider `multi_compile_local` to limit variant scope\n');
            } else {
                details += l10n.t('- Consider `shader_feature_local` to limit variant scope\n');
            }
            details += l10n.t('- Reduce unnecessary variant combinations\n');
            details += l10n.t('- Combine related variants into a single pragma\n');
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
