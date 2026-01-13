/**
 * 性能计时工具类
 * 用于测量代码执行时间并提供统计分析
 */
export class PerformanceTimer {
    private measurements: Map<string, number[]> = new Map();
    private startTimes: Map<string, number> = new Map();

    /**
     * 开始计时
     * @param label 计时标签
     */
    start(label: string): void {
        this.startTimes.set(label, performance.now());
    }

    /**
     * 结束计时并记录结果
     * @param label 计时标签
     * @returns 本次测量的耗时（毫秒）
     */
    end(label: string): number {
        const startTime = this.startTimes.get(label);
        if (startTime === undefined) {
            throw new Error(`No start time found for label: ${label}`);
        }

        const duration = performance.now() - startTime;
        this.startTimes.delete(label);

        // 记录测量结果
        if (!this.measurements.has(label)) {
            this.measurements.set(label, []);
        }
        this.measurements.get(label)!.push(duration);

        return duration;
    }

    /**
     * 测量异步函数的执行时间
     * @param label 计时标签
     * @param fn 要测量的异步函数
     * @returns 函数执行结果和耗时
     */
    async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
        this.start(label);
        const result = await fn();
        const duration = this.end(label);
        return { result, duration };
    }

    /**
     * 测量同步函数的执行时间
     * @param label 计时标签
     * @param fn 要测量的同步函数
     * @returns 函数执行结果和耗时
     */
    measure<T>(label: string, fn: () => T): { result: T; duration: number } {
        this.start(label);
        const result = fn();
        const duration = this.end(label);
        return { result, duration };
    }

    /**
     * 获取指定标签的所有测量结果
     * @param label 计时标签
     * @returns 测量结果数组
     */
    getMeasurements(label: string): number[] {
        return this.measurements.get(label) || [];
    }

    /**
     * 获取统计信息
     * @param label 计时标签
     * @returns 统计信息对象
     */
    getStats(label: string): PerformanceStats | null {
        const measurements = this.measurements.get(label);
        if (!measurements || measurements.length === 0) {
            return null;
        }

        const sorted = [...measurements].sort((a, b) => a - b);
        const sum = sorted.reduce((acc, val) => acc + val, 0);
        const mean = sum / sorted.length;

        // 计算标准差
        const variance = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / sorted.length;
        const stdDev = Math.sqrt(variance);

        // 计算中位数
        const mid = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 === 0 
            ? (sorted[mid - 1] + sorted[mid]) / 2 
            : sorted[mid];

        // 计算百分位数
        const p95Index = Math.floor(sorted.length * 0.95);
        const p99Index = Math.floor(sorted.length * 0.99);

        return {
            label,
            count: sorted.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            mean,
            median,
            stdDev,
            p95: sorted[p95Index],
            p99: sorted[p99Index],
            total: sum
        };
    }

    /**
     * 获取所有标签的统计信息
     * @returns 所有统计信息的映射
     */
    getAllStats(): Map<string, PerformanceStats> {
        const allStats = new Map<string, PerformanceStats>();
        for (const label of Array.from(this.measurements.keys())) {
            const stats = this.getStats(label);
            if (stats) {
                allStats.set(label, stats);
            }
        }
        return allStats;
    }

    /**
     * 打印统计报告
     * @param label 可选的标签，如果不提供则打印所有标签的统计
     */
    printReport(label?: string): void {
        if (label) {
            const stats = this.getStats(label);
            if (stats) {
                this.printStats(stats);
            } else {
                console.log(`No measurements found for label: ${label}`);
            }
        } else {
            const allStats = this.getAllStats();
            if (allStats.size === 0) {
                console.log('No measurements recorded');
                return;
            }

            console.log('\n=== Performance Report ===\n');
            for (const stats of Array.from(allStats.values())) {
                this.printStats(stats);
                console.log('');
            }
        }
    }

    /**
     * 打印单个统计信息
     */
    private printStats(stats: PerformanceStats): void {
        console.log(`Label: ${stats.label}`);
        console.log(`  Count:  ${stats.count}`);
        console.log(`  Min:    ${stats.min.toFixed(2)} ms`);
        console.log(`  Max:    ${stats.max.toFixed(2)} ms`);
        console.log(`  Mean:   ${stats.mean.toFixed(2)} ms`);
        console.log(`  Median: ${stats.median.toFixed(2)} ms`);
        console.log(`  StdDev: ${stats.stdDev.toFixed(2)} ms`);
        console.log(`  P95:    ${stats.p95.toFixed(2)} ms`);
        console.log(`  P99:    ${stats.p99.toFixed(2)} ms`);
        console.log(`  Total:  ${stats.total.toFixed(2)} ms`);
    }

    /**
     * 比较两个标签的性能
     * @param label1 第一个标签
     * @param label2 第二个标签
     * @returns 比较结果
     */
    compare(label1: string, label2: string): PerformanceComparison | null {
        const stats1 = this.getStats(label1);
        const stats2 = this.getStats(label2);

        if (!stats1 || !stats2) {
            return null;
        }

        const improvement = ((stats1.mean - stats2.mean) / stats1.mean) * 100;

        return {
            label1,
            label2,
            stats1,
            stats2,
            improvement,
            faster: improvement > 0 ? label2 : label1
        };
    }

    /**
     * 打印比较报告
     * @param label1 第一个标签（通常是优化前）
     * @param label2 第二个标签（通常是优化后）
     */
    printComparison(label1: string, label2: string): void {
        const comparison = this.compare(label1, label2);
        if (!comparison) {
            console.log('Cannot compare: missing measurements');
            return;
        }

        console.log('\n=== Performance Comparison ===\n');
        console.log(`Before (${label1}):`);
        console.log(`  Mean: ${comparison.stats1.mean.toFixed(2)} ms`);
        console.log(`  Median: ${comparison.stats1.median.toFixed(2)} ms`);
        console.log('');
        console.log(`After (${label2}):`);
        console.log(`  Mean: ${comparison.stats2.mean.toFixed(2)} ms`);
        console.log(`  Median: ${comparison.stats2.median.toFixed(2)} ms`);
        console.log('');
        console.log(`Improvement: ${Math.abs(comparison.improvement).toFixed(2)}%`);
        console.log(`Faster: ${comparison.faster}`);
    }

    /**
     * 清除指定标签的测量结果
     * @param label 计时标签
     */
    clear(label: string): void {
        this.measurements.delete(label);
        this.startTimes.delete(label);
    }

    /**
     * 清除所有测量结果
     */
    clearAll(): void {
        this.measurements.clear();
        this.startTimes.clear();
    }

    /**
     * 导出测量结果为 JSON
     * @returns JSON 字符串
     */
    exportJSON(): string {
        const data: any = {};
        for (const [label, measurements] of Array.from(this.measurements.entries())) {
            data[label] = {
                measurements,
                stats: this.getStats(label)
            };
        }
        return JSON.stringify(data, null, 2);
    }

    /**
     * 保存测量结果到文件
     * @param filepath 文件路径
     */
    async saveToFile(filepath: string): Promise<void> {
        const fs = await import('fs/promises');
        const json = this.exportJSON();
        await fs.writeFile(filepath, json, 'utf-8');
    }
}

/**
 * 性能统计信息接口
 */
export interface PerformanceStats {
    label: string;
    count: number;
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev: number;
    p95: number;
    p99: number;
    total: number;
}

/**
 * 性能比较结果接口
 */
export interface PerformanceComparison {
    label1: string;
    label2: string;
    stats1: PerformanceStats;
    stats2: PerformanceStats;
    improvement: number;
    faster: string;
}
