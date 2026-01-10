import * as vscode from 'vscode';

/**
 * HLSL 重命名提供器
 * 支持函数和变量的重命名，自动更新所有引用
 */
export default class HLSLRenameProvider implements vscode.RenameProvider {
    
    /**
     * 准备重命名：验证符号是否可以重命名
     */
    public prepareRename(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Range | { range: vscode.Range; placeholder: string }> {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            throw new Error('无法重命名：未选中有效的符号');
        }

        const word = document.getText(wordRange);
        
        // 检查是否是关键字（不能重命名）
        if (this.isKeyword(word)) {
            throw new Error(`无法重命名关键字: ${word}`);
        }

        // 检查是否是内置函数（不能重命名）
        if (this.isBuiltInFunction(word)) {
            throw new Error(`无法重命名内置函数: ${word}`);
        }

        return {
            range: wordRange,
            placeholder: word
        };
    }

    /**
     * 执行重命名：查找所有引用并创建编辑操作
     */
    public provideRenameEdits(
        document: vscode.TextDocument,
        position: vscode.Position,
        newName: string,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.WorkspaceEdit> {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return null;
        }

        const oldName = document.getText(wordRange);
        
        // 验证新名称
        if (!this.isValidIdentifier(newName)) {
            vscode.window.showErrorMessage(`无效的标识符名称: ${newName}`);
            return null;
        }

        // 查找所有引用
        const references = this.findAllReferences(document, oldName, position);
        
        if (references.length === 0) {
            vscode.window.showWarningMessage(`未找到符号 "${oldName}" 的引用`);
            return null;
        }

        // 创建工作区编辑
        const edit = new vscode.WorkspaceEdit();
        
        for (const ref of references) {
            edit.replace(document.uri, ref, newName);
        }

        return edit;
    }

    /**
     * 查找符号的所有引用
     */
    private findAllReferences(
        document: vscode.TextDocument,
        symbolName: string,
        position: vscode.Position
    ): vscode.Range[] {
        const references: vscode.Range[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        // 确定符号的作用域
        const scope = this.determineScope(document, position);

        // 使用正则表达式查找所有匹配项
        const regex = new RegExp(`\\b${this.escapeRegExp(symbolName)}\\b`, 'g');

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            let match: RegExpExecArray | null;

            while ((match = regex.exec(line)) !== null) {
                const matchPosition = new vscode.Position(lineIndex, match.index);
                
                // 检查是否在作用域内
                if (this.isInScope(matchPosition, scope)) {
                    const range = new vscode.Range(
                        lineIndex,
                        match.index,
                        lineIndex,
                        match.index + symbolName.length
                    );
                    references.push(range);
                }
            }
        }

        return references;
    }

    /**
     * 确定符号的作用域
     */
    private determineScope(
        document: vscode.TextDocument,
        position: vscode.Position
    ): { start: number; end: number; type: 'global' | 'function' | 'struct' } {
        const text = document.getText();
        const lines = text.split('\n');
        let braceDepth = 0;
        let scopeStart = 0;
        let scopeEnd = lines.length - 1;
        let scopeType: 'global' | 'function' | 'struct' = 'global';

        // 向上查找作用域开始
        for (let i = position.line; i >= 0; i--) {
            const line = lines[i];
            
            // 检查是否在函数内
            if (/{/.test(line) && /\w+\s*\([^)]*\)\s*(?::\s*\w+)?\s*{/.test(line)) {
                scopeStart = i;
                scopeType = 'function';
                break;
            }
            
            // 检查是否在结构体内
            if (/{/.test(line) && /struct\s+\w+/.test(line)) {
                scopeStart = i;
                scopeType = 'struct';
                break;
            }
        }

        // 向下查找作用域结束
        if (scopeType !== 'global') {
            braceDepth = 0;
            for (let i = scopeStart; i < lines.length; i++) {
                const line = lines[i];
                
                for (const char of line) {
                    if (char === '{') braceDepth++;
                    if (char === '}') braceDepth--;
                    
                    if (braceDepth === 0 && i > scopeStart) {
                        scopeEnd = i;
                        return { start: scopeStart, end: scopeEnd, type: scopeType };
                    }
                }
            }
        }

        return { start: scopeStart, end: scopeEnd, type: scopeType };
    }

    /**
     * 检查位置是否在作用域内
     */
    private isInScope(
        position: vscode.Position,
        scope: { start: number; end: number; type: string }
    ): boolean {
        return position.line >= scope.start && position.line <= scope.end;
    }

    /**
     * 检查是否是关键字
     */
    private isKeyword(word: string): boolean {
        const keywords = [
            'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
            'break', 'continue', 'return', 'discard',
            'struct', 'cbuffer', 'tbuffer',
            'void', 'bool', 'int', 'uint', 'float', 'double',
            'float2', 'float3', 'float4', 'float2x2', 'float3x3', 'float4x4',
            'int2', 'int3', 'int4', 'uint2', 'uint3', 'uint4',
            'bool2', 'bool3', 'bool4',
            'half', 'half2', 'half3', 'half4',
            'fixed', 'fixed2', 'fixed3', 'fixed4',
            'sampler', 'sampler1D', 'sampler2D', 'sampler3D', 'samplerCUBE',
            'Texture2D', 'Texture3D', 'TextureCube',
            'in', 'out', 'inout', 'uniform', 'const', 'static',
            'Shader', 'Properties', 'SubShader', 'Pass', 'Tags',
            'CGPROGRAM', 'ENDCG', 'HLSLPROGRAM', 'ENDHLSL'
        ];
        return keywords.includes(word);
    }

    /**
     * 检查是否是内置函数
     */
    private isBuiltInFunction(word: string): boolean {
        const builtInFunctions = [
            'abs', 'acos', 'all', 'any', 'asin', 'atan', 'atan2',
            'ceil', 'clamp', 'cos', 'cosh', 'cross',
            'ddx', 'ddy', 'degrees', 'determinant', 'distance', 'dot',
            'exp', 'exp2', 'faceforward', 'floor', 'fmod', 'frac',
            'length', 'lerp', 'log', 'log2', 'log10',
            'max', 'min', 'mul', 'normalize',
            'pow', 'radians', 'reflect', 'refract', 'round', 'rsqrt',
            'saturate', 'sign', 'sin', 'sinh', 'smoothstep', 'sqrt', 'step',
            'tan', 'tanh', 'tex2D', 'tex2Dproj', 'transpose', 'trunc',
            'UnityObjectToClipPos', 'UnityObjectToWorldNormal', 'UnityWorldToClipPos'
        ];
        return builtInFunctions.includes(word);
    }

    /**
     * 验证标识符是否有效
     */
    private isValidIdentifier(name: string): boolean {
        // 标识符必须以字母或下划线开头，后面可以跟字母、数字或下划线
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
    }

    /**
     * 转义正则表达式特殊字符
     */
    private escapeRegExp(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
