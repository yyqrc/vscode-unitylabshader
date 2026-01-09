import {
    FoldingRangeProvider,
    FoldingRange,
    FoldingRangeKind,
    TextDocument,
    CancellationToken,
    ProviderResult,
    Position
} from 'vscode';

/**
 * 自定义折叠提供器
 * 实现 #if/#else/#elif/#endif 的分段折叠
 * 每个条件块（#if到#else，#else到#endif）可以独立折叠
 */
export default class HLSLFoldingRangeProvider implements FoldingRangeProvider {

    provideFoldingRanges(
        document: TextDocument,
        token: CancellationToken
    ): ProviderResult<FoldingRange[]> {
        
        const ranges: FoldingRange[] = [];
        const text = document.getText();
        const lines = text.split('\n');
        
        // 用于跟踪 #if/#elif/#else/#endif 块的栈
        interface ConditionalBlock {
            startLine: number;
            type: 'if' | 'elif' | 'else';
        }
        
        const conditionalStack: ConditionalBlock[][] = []; // 嵌套栈
        
        // 用于跟踪 {} 括号的栈
        const braceStack: number[] = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // 处理 {} 括号折叠
            for (let j = 0; j < lines[i].length; j++) {
                const char = lines[i][j];
                
                // 跳过字符串和注释中的括号
                const beforeChar = lines[i].substring(0, j);
                const inString = (beforeChar.match(/"/g) || []).length % 2 === 1 ||
                                (beforeChar.match(/'/g) || []).length % 2 === 1;
                const inComment = beforeChar.includes('//') || 
                                 (text.substring(0, document.offsetAt(new Position(i, j))).lastIndexOf('/*') > 
                                  text.substring(0, document.offsetAt(new Position(i, j))).lastIndexOf('*/'));
                
                if (!inString && !inComment) {
                    if (char === '{') {
                        braceStack.push(i);
                    } else if (char === '}') {
                        if (braceStack.length > 0) {
                            const startLine = braceStack.pop()!;
                            // 只有当开始和结束不在同一行时才创建折叠区域
                            if (i > startLine) {
                                ranges.push(new FoldingRange(
                                    startLine,
                                    i,
                                    FoldingRangeKind.Region
                                ));
                            }
                        }
                    }
                }
            }
            
            // 匹配 #if, #ifdef, #ifndef
            if (/^#\s*(if|ifdef|ifndef)\b/.test(line)) {
                // 开始一个新的条件块组
                conditionalStack.push([{ startLine: i, type: 'if' }]);
            }
            // 匹配 #elif
            else if (/^#\s*elif\b/.test(line)) {
                if (conditionalStack.length > 0) {
                    const currentGroup = conditionalStack[conditionalStack.length - 1];
                    if (currentGroup.length > 0) {
                        // 结束前一个块
                        const prevBlock = currentGroup[currentGroup.length - 1];
                        if (i - 1 > prevBlock.startLine) {
                            ranges.push(new FoldingRange(
                                prevBlock.startLine,
                                i - 1,
                                FoldingRangeKind.Region
                            ));
                        }
                        // 开始新的 elif 块
                        currentGroup.push({ startLine: i, type: 'elif' });
                    }
                }
            }
            // 匹配 #else
            else if (/^#\s*else\b/.test(line)) {
                if (conditionalStack.length > 0) {
                    const currentGroup = conditionalStack[conditionalStack.length - 1];
                    if (currentGroup.length > 0) {
                        // 结束前一个块
                        const prevBlock = currentGroup[currentGroup.length - 1];
                        if (i - 1 > prevBlock.startLine) {
                            ranges.push(new FoldingRange(
                                prevBlock.startLine,
                                i - 1,
                                FoldingRangeKind.Region
                            ));
                        }
                        // 开始新的 else 块
                        currentGroup.push({ startLine: i, type: 'else' });
                    }
                }
            }
            // 匹配 #endif
            else if (/^#\s*endif\b/.test(line)) {
                if (conditionalStack.length > 0) {
                    const currentGroup = conditionalStack.pop()!;
                    if (currentGroup.length > 0) {
                        // 结束最后一个块
                        const lastBlock = currentGroup[currentGroup.length - 1];
                        if (i - 1 > lastBlock.startLine) {
                            ranges.push(new FoldingRange(
                                lastBlock.startLine,
                                i - 1,
                                FoldingRangeKind.Region
                            ));
                        }
                    }
                }
            }
            // 匹配 #region
            else if (/^\/\/\s*#region\b/.test(line)) {
                conditionalStack.push([{ startLine: i, type: 'if' }]);
            }
            // 匹配 #endregion
            else if (/^\/\/\s*#endregion\b/.test(line)) {
                if (conditionalStack.length > 0) {
                    const currentGroup = conditionalStack.pop()!;
                    if (currentGroup.length > 0) {
                        const lastBlock = currentGroup[currentGroup.length - 1];
                        if (i - 1 > lastBlock.startLine) {
                            ranges.push(new FoldingRange(
                                lastBlock.startLine,
                                i - 1,
                                FoldingRangeKind.Region
                            ));
                        }
                    }
                }
            }
            // 匹配 CGPROGRAM/ENDCG, HLSLPROGRAM/ENDHLSL 等代码块
            else if (/^(CGPROGRAM|HLSLPROGRAM|CGINCLUDE|HLSLINCLUDE)\b/.test(line)) {
                conditionalStack.push([{ startLine: i, type: 'if' }]);
            }
            else if (/^(ENDCG|ENDHLSL)\b/.test(line)) {
                if (conditionalStack.length > 0) {
                    const currentGroup = conditionalStack.pop()!;
                    if (currentGroup.length > 0) {
                        const lastBlock = currentGroup[currentGroup.length - 1];
                        if (i - 1 > lastBlock.startLine) {
                            ranges.push(new FoldingRange(
                                lastBlock.startLine,
                                i - 1,
                                FoldingRangeKind.Region
                            ));
                        }
                    }
                }
            }
        }
        
        return ranges;
    }
}
