/**
 * 模糊匹配结果
 */
export interface FuzzyMatchResult {
    /** 是否匹配 */
    matched: boolean;
    /** 匹配得分（0-1，越高越好） */
    score: number;
    /** 匹配的字符位置索引 */
    matchedIndices: number[];
}

/**
 * 模糊匹配工具类
 * 实现子序列匹配算法，支持大小写不敏感匹配
 */
export class FuzzyMatcher {
    /**
     * 执行模糊匹配
     * @param query 查询字符串
     * @param target 目标字符串
     * @param caseSensitive 是否大小写敏感，默认false
     * @returns 匹配结果
     */
    static match(query: string, target: string, caseSensitive: boolean = false): FuzzyMatchResult {
        if (!query || query.trim() === '') {
            return {
                matched: true,
                score: 1.0,
                matchedIndices: []
            };
        }

        if (!target) {
            return {
                matched: false,
                score: 0,
                matchedIndices: []
            };
        }

        // 转换大小写
        const q = caseSensitive ? query : query.toLowerCase();
        const t = caseSensitive ? target : target.toLowerCase();

        // 子序列匹配
        const matchedIndices: number[] = [];
        let queryIndex = 0;
        let targetIndex = 0;

        while (queryIndex < q.length && targetIndex < t.length) {
            if (q[queryIndex] === t[targetIndex]) {
                matchedIndices.push(targetIndex);
                queryIndex++;
            }
            targetIndex++;
        }

        // 如果没有匹配完所有查询字符，则匹配失败
        if (queryIndex < q.length) {
            return {
                matched: false,
                score: 0,
                matchedIndices: []
            };
        }

        // 计算匹配得分
        const score = this.calculateScore(query, target, matchedIndices);

        return {
            matched: true,
            score,
            matchedIndices
        };
    }

    /**
     * 计算匹配得分
     * 考虑因素：
     * 1. 匹配字符的连续性（连续匹配得分更高）
     * 2. 匹配位置（越靠前得分越高）
     * 3. 匹配长度占比（匹配字符占目标字符串的比例）
     * 4. 首字母匹配（首字母匹配得分更高）
     */
    private static calculateScore(query: string, target: string, matchedIndices: number[]): number {
        if (matchedIndices.length === 0) {
            return 0;
        }

        let score = 0;
        const queryLen = query.length;
        const targetLen = target.length;

        // 1. 基础得分：匹配长度占比 (0-0.3)
        const lengthRatio = queryLen / targetLen;
        score += lengthRatio * 0.3;

        // 2. 连续性得分 (0-0.4)
        let consecutiveCount = 0;
        let maxConsecutive = 0;
        for (let i = 1; i < matchedIndices.length; i++) {
            if (matchedIndices[i] === matchedIndices[i - 1] + 1) {
                consecutiveCount++;
                maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
            } else {
                consecutiveCount = 0;
            }
        }
        const consecutiveRatio = maxConsecutive / queryLen;
        score += consecutiveRatio * 0.4;

        // 3. 位置得分 (0-0.2)
        // 越靠前的匹配得分越高
        const avgPosition = matchedIndices.reduce((sum, idx) => sum + idx, 0) / matchedIndices.length;
        const positionScore = 1 - (avgPosition / targetLen);
        score += positionScore * 0.2;

        // 4. 首字母匹配加分 (0-0.1)
        if (matchedIndices[0] === 0) {
            score += 0.1;
        }

        // 5. 完全匹配加分
        if (query.toLowerCase() === target.toLowerCase()) {
            score = 1.0;
        }

        return Math.min(score, 1.0);
    }

    /**
     * 批量匹配并排序
     * @param query 查询字符串
     * @param targets 目标字符串数组
     * @param caseSensitive 是否大小写敏感
     * @returns 匹配的目标字符串，按得分降序排序
     */
    static matchAndSort<T>(
        query: string,
        targets: T[],
        getText: (item: T) => string,
        caseSensitive: boolean = false
    ): Array<{ item: T; result: FuzzyMatchResult }> {
        const results: Array<{ item: T; result: FuzzyMatchResult }> = [];

        for (const item of targets) {
            const text = getText(item);
            const result = this.match(query, text, caseSensitive);
            
            if (result.matched) {
                results.push({ item, result });
            }
        }

        // 按得分降序排序
        results.sort((a, b) => b.result.score - a.result.score);

        return results;
    }

    /**
     * 简单的包含匹配（不计算得分）
     * @param query 查询字符串
     * @param target 目标字符串
     * @param caseSensitive 是否大小写敏感
     * @returns 是否包含
     */
    static contains(query: string, target: string, caseSensitive: boolean = false): boolean {
        if (!query || query.trim() === '') {
            return true;
        }

        if (!target) {
            return false;
        }

        const q = caseSensitive ? query : query.toLowerCase();
        const t = caseSensitive ? target : target.toLowerCase();

        return t.includes(q);
    }

    /**
     * 高亮匹配的字符
     * @param target 目标字符串
     * @param matchedIndices 匹配的字符位置
     * @param highlightStart 高亮开始标记，默认 '<mark>'
     * @param highlightEnd 高亮结束标记，默认 '</mark>'
     * @returns 高亮后的字符串
     */
    static highlight(
        target: string,
        matchedIndices: number[],
        highlightStart: string = '<mark>',
        highlightEnd: string = '</mark>'
    ): string {
        if (matchedIndices.length === 0) {
            return target;
        }

        let result = '';
        let lastIndex = 0;
        let inHighlight = false;

        for (let i = 0; i < target.length; i++) {
            const isMatched = matchedIndices.includes(i);

            if (isMatched && !inHighlight) {
                result += target.substring(lastIndex, i);
                result += highlightStart;
                lastIndex = i;
                inHighlight = true;
            } else if (!isMatched && inHighlight) {
                result += target.substring(lastIndex, i);
                result += highlightEnd;
                lastIndex = i;
                inHighlight = false;
            }
        }

        // 添加剩余部分
        result += target.substring(lastIndex);
        if (inHighlight) {
            result += highlightEnd;
        }

        return result;
    }
}
