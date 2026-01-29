/**
 * 移动平台分析器
 * 负责检测移动端不支持的特性、提供优化建议、计算复杂度评分
 */

import * as vscode from 'vscode';
import {
    MobilePlatform,
    ComplexityLevel,
    ComplexityScore,
    unsupportedFeatures,
    precisionSuggestions,
    textureOptimizations,
    complexOperations,
    discouragedFunctions,
    complexityThresholds,
    mobileOptimizationTips,
} from './mobileGlobals';
import { maskCommentsPreserveLayout } from '../utils/commentMask';

/**
 * 诊断来源标识
 */
const DIAGNOSTIC_SOURCE = 'unityshader-mobile';

/**
 * 移动平台分析器配置
 */
export interface MobileAnalyzerConfig {
    enabled: boolean;                    // 总开关
    checkUnsupportedFeatures: boolean;   // 检测不支持的特性
    suggestHalfPrecision: boolean;       // half 精度建议
    checkTextureOptimization: boolean;   // 纹理优化建议
    checkDiscouragedFunctions: boolean;  // 检测不推荐的函数
    calculateComplexity: boolean;        // 计算复杂度评分
    targetPlatform: MobilePlatform;      // 目标平台
}

/**
 * 默认配置
 */
const defaultConfig: MobileAnalyzerConfig = {
    enabled: true,
    checkUnsupportedFeatures: true,
    suggestHalfPrecision: true,
    checkTextureOptimization: true,
    checkDiscouragedFunctions: true,
    calculateComplexity: true,
    targetPlatform: MobilePlatform.ES30,
};

/**
 * 移动平台分析器
 */
export class MobileAnalyzer implements vscode.Disposable {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private statusBarItem: vscode.StatusBarItem;
    private config: MobileAnalyzerConfig;
    private lastComplexityScore: ComplexityScore | null = null;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection(DIAGNOSTIC_SOURCE);
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'unityshader.showMobileOptimizationTips';
        this.config = this.loadConfig();
    }

    /**
     * 从 VS Code 配置加载分析器配置
     */
    private loadConfig(): MobileAnalyzerConfig {
        const config = vscode.workspace.getConfiguration('unityshader.mobile');
        return {
            enabled: config.get<boolean>('enabled', defaultConfig.enabled),
            checkUnsupportedFeatures: config.get<boolean>('checkUnsupportedFeatures', defaultConfig.checkUnsupportedFeatures),
            suggestHalfPrecision: config.get<boolean>('suggestHalfPrecision', defaultConfig.suggestHalfPrecision),
            checkTextureOptimization: config.get<boolean>('checkTextureOptimization', defaultConfig.checkTextureOptimization),
            checkDiscouragedFunctions: config.get<boolean>('checkDiscouragedFunctions', defaultConfig.checkDiscouragedFunctions),
            calculateComplexity: config.get<boolean>('calculateComplexity', defaultConfig.calculateComplexity),
            targetPlatform: config.get<MobilePlatform>('targetPlatform', defaultConfig.targetPlatform),
        };
    }

    /**
     * 刷新配置
     */
    public refreshConfig(): void {
        this.config = this.loadConfig();
    }

    /**
     * 分析文档
     */
    public analyzeDocument(document: vscode.TextDocument): void {
        // 检查总开关
        if (!this.config.enabled) {
            this.diagnosticCollection.delete(document.uri);
            this.statusBarItem.hide();
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];
        // 屏蔽注释，避免注释里的代码触发移动端分析提示
        const text = maskCommentsPreserveLayout(document.getText());

        // 1. 检测不支持的特性
        if (this.config.checkUnsupportedFeatures) {
            const featureDiagnostics = this.checkUnsupportedFeatures(document, text);
            diagnostics.push(...featureDiagnostics);
        }

        // 2. half 精度建议
        if (this.config.suggestHalfPrecision) {
            const precisionDiagnostics = this.checkPrecisionSuggestions(document, text);
            diagnostics.push(...precisionDiagnostics);
        }

        // 3. 纹理优化建议
        if (this.config.checkTextureOptimization) {
            const textureDiagnostics = this.checkTextureOptimizations(document, text);
            diagnostics.push(...textureDiagnostics);
        }

        // 4. 检测不推荐的函数
        if (this.config.checkDiscouragedFunctions) {
            const functionDiagnostics = this.checkDiscouragedFunctions(document, text);
            diagnostics.push(...functionDiagnostics);
        }

        // 5. 计算复杂度评分
        if (this.config.calculateComplexity) {
            this.lastComplexityScore = this.calculateComplexity(text);
            this.updateStatusBar(this.lastComplexityScore);
        } else {
            this.statusBarItem.hide();
        }

        // 设置诊断信息
        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    /**
     * 检测不支持的特性
     */
    private checkUnsupportedFeatures(document: vscode.TextDocument, text: string): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];

        for (const feature of unsupportedFeatures) {
            // 检查目标平台是否支持此特性
            let isSupported = true;
            switch (this.config.targetPlatform) {
                case MobilePlatform.ES30:
                    isSupported = feature.support.es30;
                    break;
                case MobilePlatform.ES31:
                    isSupported = feature.support.es31;
                    break;
                case MobilePlatform.Metal:
                    isSupported = feature.support.metal;
                    break;
                case MobilePlatform.Vulkan:
                    isSupported = feature.support.vulkan;
                    break;
            }

            // 如果目标平台不支持，检测代码中是否使用
            if (!isSupported) {
                const matches = text.matchAll(feature.pattern);
                for (const match of matches) {
                    if (match.index !== undefined) {
                        const startPos = document.positionAt(match.index);
                        const endPos = document.positionAt(match.index + match[0].length);
                        const range = new vscode.Range(startPos, endPos);

                        let message = `[移动端] ${feature.message}`;
                        if (feature.alternative) {
                            message += `\n建议: ${feature.alternative}`;
                        }

                        const severity = feature.severity === 'error' 
                            ? vscode.DiagnosticSeverity.Error
                            : feature.severity === 'warning'
                            ? vscode.DiagnosticSeverity.Warning
                            : vscode.DiagnosticSeverity.Information;

                        const diagnostic = new vscode.Diagnostic(range, message, severity);
                        diagnostic.source = DIAGNOSTIC_SOURCE;
                        diagnostic.code = `mobile-unsupported-${feature.name}`;
                        diagnostics.push(diagnostic);
                    }
                }
            }
        }

        return diagnostics;
    }

    /**
     * 检查精度优化建议
     */
    private checkPrecisionSuggestions(document: vscode.TextDocument, text: string): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];

        for (const suggestion of precisionSuggestions) {
            const matches = text.matchAll(suggestion.pattern);
            for (const match of matches) {
                if (match.index !== undefined) {
                    const startPos = document.positionAt(match.index);
                    const endPos = document.positionAt(match.index + match[0].length);
                    const range = new vscode.Range(startPos, endPos);

                    const diagnostic = new vscode.Diagnostic(
                        range,
                        `[移动端优化] ${suggestion.message}`,
                        vscode.DiagnosticSeverity.Hint
                    );
                    diagnostic.source = DIAGNOSTIC_SOURCE;
                    diagnostic.code = 'mobile-precision-hint';
                    
                    // 如果有替换建议，添加到诊断数据中（用于 Quick Fix）
                    if (suggestion.replacement) {
                        diagnostic.tags = [vscode.DiagnosticTag.Unnecessary];
                    }
                    
                    diagnostics.push(diagnostic);
                }
            }
        }

        return diagnostics;
    }

    /**
     * 检查纹理优化建议
     */
    private checkTextureOptimizations(document: vscode.TextDocument, text: string): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];

        // 检测依赖纹理读取
        const dependentReadPattern = /tex2D\s*\([^,]+,\s*[^)]*[\+\-\*\/][^)]*\)/g;
        const dependentMatches = text.matchAll(dependentReadPattern);
        
        for (const match of dependentMatches) {
            if (match.index !== undefined) {
                const startPos = document.positionAt(match.index);
                const endPos = document.positionAt(match.index + match[0].length);
                const range = new vscode.Range(startPos, endPos);

                const diagnostic = new vscode.Diagnostic(
                    range,
                    '[移动端优化] 检测到依赖纹理读取（UV 计算后采样），这在移动端会导致额外的延迟',
                    vscode.DiagnosticSeverity.Warning
                );
                diagnostic.source = DIAGNOSTIC_SOURCE;
                diagnostic.code = 'mobile-dependent-texture-read';
                diagnostics.push(diagnostic);
            }
        }

        return diagnostics;
    }

    /**
     * 检测不推荐的函数
     */
    private checkDiscouragedFunctions(document: vscode.TextDocument, text: string): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];

        for (const func of discouragedFunctions) {
            const matches = text.matchAll(func.pattern);
            for (const match of matches) {
                if (match.index !== undefined) {
                    const startPos = document.positionAt(match.index);
                    const endPos = document.positionAt(match.index + match[0].length);
                    const range = new vscode.Range(startPos, endPos);

                    let message = `[移动端] ${func.message}`;
                    if (func.alternative) {
                        message += `\n建议: ${func.alternative}`;
                    }

                    const diagnostic = new vscode.Diagnostic(
                        range,
                        message,
                        vscode.DiagnosticSeverity.Warning
                    );
                    diagnostic.source = DIAGNOSTIC_SOURCE;
                    diagnostic.code = `mobile-discouraged-${func.name}`;
                    diagnostics.push(diagnostic);
                }
            }
        }

        return diagnostics;
    }

    /**
     * 计算 Shader 复杂度评分
     */
    private calculateComplexity(text: string): ComplexityScore {
        const details = {
            textureOps: 0,
            mathOps: 0,
            branches: 0,
            loops: 0,
            registers: 0,
        };

        // 统计纹理操作
        for (const pattern of complexOperations.textureOps) {
            const matches = text.match(pattern);
            if (matches) {
                details.textureOps += matches.length;
            }
        }

        // 统计高开销数学运算
        for (const pattern of complexOperations.expensiveMath) {
            const matches = text.match(pattern);
            if (matches) {
                details.mathOps += matches.length;
            }
        }

        // 统计分支
        for (const pattern of complexOperations.branches) {
            const matches = text.match(pattern);
            if (matches) {
                details.branches += matches.length;
            }
        }

        // 统计循环
        for (const pattern of complexOperations.loops) {
            const matches = text.match(pattern);
            if (matches) {
                details.loops += matches.length;
            }
        }

        // 统计 discard 操作（额外惩罚）
        for (const pattern of complexOperations.discard) {
            const matches = text.match(pattern);
            if (matches) {
                details.mathOps += matches.length * 5; // discard 有额外权重
            }
        }

        // 估算寄存器数（简化估算）
        const floatVars = (text.match(/\bfloat\d?\b/g) || []).length;
        const halfVars = (text.match(/\bhalf\d?\b/g) || []).length;
        const matrixVars = (text.match(/\b(float|half)(3x3|4x4)\b/g) || []).length;
        details.registers = floatVars + halfVars * 0.5 + matrixVars * 4;

        // 计算综合评分
        const score = 
            details.textureOps * 3 +
            details.mathOps * 1 +
            details.branches * 5 +
            details.loops * 10 +
            details.registers * 0.5;

        // 确定复杂度等级
        let level: ComplexityLevel;
        if (score <= complexityThresholds.overall.low) {
            level = ComplexityLevel.Low;
        } else if (score <= complexityThresholds.overall.medium) {
            level = ComplexityLevel.Medium;
        } else if (score <= complexityThresholds.overall.high) {
            level = ComplexityLevel.High;
        } else {
            level = ComplexityLevel.VeryHigh;
        }

        // 生成优化建议
        const suggestions: string[] = [];
        
        if (details.textureOps > complexityThresholds.textureOps.medium) {
            suggestions.push('纹理采样次数较多，考虑合并纹理通道或减少采样');
        }
        if (details.branches > complexityThresholds.branches.low) {
            suggestions.push('分支语句较多，移动端分支开销大，考虑使用 lerp/step 替代');
        }
        if (details.loops > complexityThresholds.loops.low) {
            suggestions.push('循环语句会增加复杂度，考虑展开循环或减少迭代次数');
        }
        if (details.mathOps > complexityThresholds.mathOps.medium) {
            suggestions.push('高开销数学运算较多，考虑使用查找表（LUT）纹理');
        }

        return {
            level,
            score: Math.round(score),
            details,
            suggestions,
        };
    }

    /**
     * 更新状态栏显示
     */
    private updateStatusBar(score: ComplexityScore): void {
        let icon: string;
        let color: string;
        
        switch (score.level) {
            case ComplexityLevel.Low:
                icon = '$(check)';
                color = '#4CAF50'; // 绿色
                break;
            case ComplexityLevel.Medium:
                icon = '$(info)';
                color = '#FFC107'; // 黄色
                break;
            case ComplexityLevel.High:
                icon = '$(warning)';
                color = '#FF9800'; // 橙色
                break;
            case ComplexityLevel.VeryHigh:
                icon = '$(error)';
                color = '#F44336'; // 红色
                break;
        }

        this.statusBarItem.text = `${icon} Mobile: ${score.level} (${score.score})`;
        this.statusBarItem.tooltip = this.generateTooltip(score);
        this.statusBarItem.backgroundColor = undefined;
        this.statusBarItem.color = color;
        this.statusBarItem.show();
    }

    /**
     * 生成状态栏提示文本
     */
    private generateTooltip(score: ComplexityScore): string {
        const lines = [
            '📊 移动端 Shader 复杂度分析',
            '─'.repeat(30),
            `复杂度等级: ${score.level}`,
            `综合评分: ${score.score}`,
            '',
            '📈 详细统计:',
            `  • 纹理操作: ${score.details.textureOps}`,
            `  • 高开销数学: ${score.details.mathOps}`,
            `  • 分支语句: ${score.details.branches}`,
            `  • 循环语句: ${score.details.loops}`,
            `  • 估算寄存器: ${Math.round(score.details.registers)}`,
        ];

        if (score.suggestions.length > 0) {
            lines.push('', '💡 优化建议:');
            for (const suggestion of score.suggestions) {
                lines.push(`  • ${suggestion}`);
            }
        }

        return lines.join('\n');
    }

    /**
     * 获取最后的复杂度评分
     */
    public getLastComplexityScore(): ComplexityScore | null {
        return this.lastComplexityScore;
    }

    /**
     * 获取移动端优化提示
     */
    public getMobileOptimizationTips(): string[] {
        return mobileOptimizationTips;
    }

    /**
     * 清除诊断
     */
    public clearDiagnostics(uri?: vscode.Uri): void {
        if (uri) {
            this.diagnosticCollection.delete(uri);
        } else {
            this.diagnosticCollection.clear();
        }
    }

    /**
     * 释放资源
     */
    public dispose(): void {
        this.diagnosticCollection.dispose();
        this.statusBarItem.dispose();
    }
}
