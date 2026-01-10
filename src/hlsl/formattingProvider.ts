import * as vscode from 'vscode';

/**
 * HLSL 代码格式化提供器
 * 支持整个文档和选区的代码格式化
 */
export default class HLSLFormattingProvider implements vscode.DocumentFormattingEditProvider, vscode.DocumentRangeFormattingEditProvider {
    
    /**
     * 格式化整个文档
     */
    public provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.TextEdit[]> {
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
        );
        
        return this.formatRange(document, fullRange, options);
    }

    /**
     * 格式化选区
     */
    public provideDocumentRangeFormattingEdits(
        document: vscode.TextDocument,
        range: vscode.Range,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.TextEdit[]> {
        return this.formatRange(document, range, options);
    }

    /**
     * 格式化指定范围的代码
     */
    private formatRange(
        document: vscode.TextDocument,
        range: vscode.Range,
        options: vscode.FormattingOptions
    ): vscode.TextEdit[] {
        const text = document.getText(range);
        const lines = text.split('\n');
        const formattedLines: string[] = [];
        
        let indentLevel = this.getInitialIndentLevel(document, range.start);
        let inMultiLineComment = false;
        let inShaderLabBlock = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // 跳过空行
            if (trimmedLine === '') {
                formattedLines.push('');
                continue;
            }
            
            // 检查是否在多行注释中
            if (trimmedLine.startsWith('/*')) {
                inMultiLineComment = true;
            }
            if (inMultiLineComment) {
                formattedLines.push(line); // 保持注释原样
                if (trimmedLine.endsWith('*/')) {
                    inMultiLineComment = false;
                }
                continue;
            }
            
            // 检查是否是 ShaderLab 块
            if (this.isShaderLabKeyword(trimmedLine)) {
                inShaderLabBlock = true;
            }
            
            // 处理缩进减少（右大括号）
            if (trimmedLine.startsWith('}')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
            
            // 处理 ShaderLab 特殊语法
            if (inShaderLabBlock && this.isShaderLabProperty(trimmedLine)) {
                // ShaderLab 属性保持特定格式
                const formatted = this.formatShaderLabProperty(trimmedLine, indentLevel, options);
                formattedLines.push(formatted);
            } else {
                // 应用缩进
                const indent = this.createIndent(indentLevel, options);
                const formatted = indent + trimmedLine;
                formattedLines.push(formatted);
            }
            
            // 处理缩进增加（左大括号）
            if (trimmedLine.endsWith('{')) {
                indentLevel++;
            }
            
            // 检查是否离开 ShaderLab 块
            if (trimmedLine === 'CGPROGRAM' || trimmedLine === 'HLSLPROGRAM') {
                inShaderLabBlock = false;
            }
        }
        
        const formattedText = formattedLines.join('\n');
        
        return [vscode.TextEdit.replace(range, formattedText)];
    }

    /**
     * 获取初始缩进级别
     */
    private getInitialIndentLevel(document: vscode.TextDocument, position: vscode.Position): number {
        let level = 0;
        
        // 向上扫描，计算大括号深度
        for (let i = 0; i < position.line; i++) {
            const line = document.lineAt(i).text;
            for (const char of line) {
                if (char === '{') level++;
                if (char === '}') level--;
            }
        }
        
        return Math.max(0, level);
    }

    /**
     * 创建缩进字符串
     */
    private createIndent(level: number, options: vscode.FormattingOptions): string {
        const indentChar = options.insertSpaces ? ' ' : '\t';
        const indentSize = options.insertSpaces ? options.tabSize : 1;
        return indentChar.repeat(level * indentSize);
    }

    /**
     * 检查是否是 ShaderLab 关键字
     */
    private isShaderLabKeyword(line: string): boolean {
        const keywords = [
            'Shader', 'Properties', 'SubShader', 'Pass', 'Category',
            'Tags', 'LOD', 'Cull', 'ZWrite', 'ZTest', 'Blend', 'BlendOp',
            'ColorMask', 'Offset', 'Stencil', 'Fog', 'Lighting',
            'Material', 'SeparateSpecular', 'Color', 'SetTexture',
            'AlphaTest', 'AlphaToMask', 'Conservative', 'GrabPass',
            'UsePass', 'Fallback', 'CustomEditor', 'Dependency'
        ];
        
        return keywords.some(keyword => line.startsWith(keyword));
    }

    /**
     * 检查是否是 ShaderLab 属性
     */
    private isShaderLabProperty(line: string): boolean {
        // 属性格式: _PropertyName ("Display Name", Type) = DefaultValue
        return /^_\w+\s*\(/.test(line);
    }

    /**
     * 格式化 ShaderLab 属性
     */
    private formatShaderLabProperty(line: string, indentLevel: number, options: vscode.FormattingOptions): string {
        const indent = this.createIndent(indentLevel, options);
        
        // 尝试解析属性格式
        const match = line.match(/^(_\w+)\s*\(\s*"([^"]+)"\s*,\s*(\w+(?:\([^)]+\))?)\s*\)\s*=\s*(.+)$/);
        
        if (match) {
            const [, name, displayName, type, defaultValue] = match;
            return `${indent}${name} ("${displayName}", ${type}) = ${defaultValue}`;
        }
        
        // 如果解析失败，返回原样
        return indent + line;
    }

    /**
     * 格式化运算符周围的空格
     */
    private formatOperators(line: string): string {
        // 在运算符周围添加空格
        let formatted = line;
        
        // 二元运算符
        const binaryOps = ['=', '+', '-', '*', '/', '%', '==', '!=', '<', '>', '<=', '>=', '&&', '||', '&', '|', '^'];
        for (const op of binaryOps) {
            const regex = new RegExp(`\\s*${this.escapeRegExp(op)}\\s*`, 'g');
            formatted = formatted.replace(regex, ` ${op} `);
        }
        
        // 清理多余空格
        formatted = formatted.replace(/\s+/g, ' ');
        
        return formatted;
    }

    /**
     * 转义正则表达式特殊字符
     */
    private escapeRegExp(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
