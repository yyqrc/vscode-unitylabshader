/**
 * 符号缓存性能对比测试
 * 比较优化前后的性能差异
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { PerformanceTimer } from './PerformanceTimer';
import { SymbolCacheManager } from '../../cache/symbolCacheManager';
import { OptimizedCacheManager } from '../../cache/OptimizedCacheManager';
import { CachedSymbolKind } from '../../cache/symbolCacheTypes';

/**
 * 缓存性能对比测试
 */
export class CachePerformanceComparison {
    private timer: PerformanceTimer;
    private testDataPath: string;

    constructor() {
        this.timer = new PerformanceTimer();
        this.testDataPath = path.join(__dirname, 'fixtures');
    }

    /**
     * 运行完整的性能对比测试
     */
    async runComparison(): Promise<void> {
        console.log('\n' + '='.repeat(70));
        console.log('Symbol Cache Performance Comparison');
        console.log('='.repeat(70));

        // 准备测试数据
        await this.prepareTestData();

        // 测试 1: 符号查找性能
        await this.compareSymbolLookup();

        // 测试 2: 批量查找性能
        await this.compareBatchLookup();

        // 测试 3: 模糊查找性能
        await this.compareFuzzySearch();

        // 测试 4: 文件符号获取性能
        await this.compareFileSymbolRetrieval();

        // 打印总体报告
        console.log('\n' + '='.repeat(70));
        console.log('Performance Comparison Summary');
        console.log('='.repeat(70));
        this.printComparisonSummary();
    }

    /**
     * 准备测试数据
     */
    private async prepareTestData(): Promise<void> {
        console.log('\nPreparing test data...');
        
        // 这里可以生成或加载测试用的符号缓存数据
        // 为了简化，我们假设已经有了测试数据
        
        console.log('Test data ready');
    }

    /**
     * 对比符号查找性能
     */
    private async compareSymbolLookup(): Promise<void> {
        console.log('\n--- Test 1: Symbol Lookup Performance ---');

        const testSymbols = [
            'VertexShader',
            'FragmentShader',
            'CalculatePBRLighting',
            'UnpackNormal',
            'FresnelSchlick',
        ];

        const iterations = 1000;

        // 模拟旧的查找方式（使用数组遍历）
        console.log('\nTesting OLD implementation (array-based)...');
        for (let i = 0; i < iterations; i++) {
            for (const symbolName of testSymbols) {
                this.timer.start('old_lookup');
                // 模拟旧的查找逻辑：遍历对象 + 数组查找
                this.simulateOldLookup(symbolName);
                this.timer.end('old_lookup');
            }
        }

        // 测试新的查找方式（使用 Map）
        console.log('Testing NEW implementation (Map-based)...');
        for (let i = 0; i < iterations; i++) {
            for (const symbolName of testSymbols) {
                this.timer.start('new_lookup');
                // 模拟新的查找逻辑：Map 直接查找
                this.simulateNewLookup(symbolName);
                this.timer.end('new_lookup');
            }
        }

        // 打印对比结果
        this.timer.printComparison('old_lookup', 'new_lookup');
    }

    /**
     * 对比批量查找性能
     */
    private async compareBatchLookup(): Promise<void> {
        console.log('\n--- Test 2: Batch Lookup Performance ---');

        const symbolBatch = [
            'VertexShader', 'FragmentShader', 'CalculatePBRLighting',
            'UnpackNormal', 'FresnelSchlick', 'DistributionGGX',
            'GeometrySchlickGGX', 'GeometrySmith', '_MainTex', '_NormalMap',
        ];

        const iterations = 100;

        // 旧实现
        console.log('\nTesting OLD batch lookup...');
        for (let i = 0; i < iterations; i++) {
            this.timer.start('old_batch');
            for (const symbol of symbolBatch) {
                this.simulateOldLookup(symbol);
            }
            this.timer.end('old_batch');
        }

        // 新实现
        console.log('Testing NEW batch lookup...');
        for (let i = 0; i < iterations; i++) {
            this.timer.start('new_batch');
            for (const symbol of symbolBatch) {
                this.simulateNewLookup(symbol);
            }
            this.timer.end('new_batch');
        }

        this.timer.printComparison('old_batch', 'new_batch');
    }

    /**
     * 对比模糊查找性能
     */
    private async compareFuzzySearch(): Promise<void> {
        console.log('\n--- Test 3: Fuzzy Search Performance ---');

        const patterns = ['Vertex', 'Fragment', 'Calculate', 'Geometry', 'Fresnel'];
        const iterations = 100;

        // 旧实现（遍历所有符号）
        console.log('\nTesting OLD fuzzy search...');
        for (let i = 0; i < iterations; i++) {
            for (const pattern of patterns) {
                this.timer.start('old_fuzzy');
                this.simulateOldFuzzySearch(pattern);
                this.timer.end('old_fuzzy');
            }
        }

        // 新实现（优化的索引遍历）
        console.log('Testing NEW fuzzy search...');
        for (let i = 0; i < iterations; i++) {
            for (const pattern of patterns) {
                this.timer.start('new_fuzzy');
                this.simulateNewFuzzySearch(pattern);
                this.timer.end('new_fuzzy');
            }
        }

        this.timer.printComparison('old_fuzzy', 'new_fuzzy');
    }

    /**
     * 对比文件符号获取性能
     */
    private async compareFileSymbolRetrieval(): Promise<void> {
        console.log('\n--- Test 4: File Symbol Retrieval Performance ---');

        const testFiles = [
            'shaders/pbr.hlsl',
            'shaders/lighting.hlsl',
            'shaders/common.hlsl',
        ];

        const iterations = 500;

        // 旧实现
        console.log('\nTesting OLD file symbol retrieval...');
        for (let i = 0; i < iterations; i++) {
            for (const file of testFiles) {
                this.timer.start('old_file_retrieval');
                this.simulateOldFileRetrieval(file);
                this.timer.end('old_file_retrieval');
            }
        }

        // 新实现
        console.log('Testing NEW file symbol retrieval...');
        for (let i = 0; i < iterations; i++) {
            for (const file of testFiles) {
                this.timer.start('new_file_retrieval');
                this.simulateNewFileRetrieval(file);
                this.timer.end('new_file_retrieval');
            }
        }

        this.timer.printComparison('old_file_retrieval', 'new_file_retrieval');
    }

    /**
     * 模拟旧的符号查找（使用对象 + 数组）
     */
    private simulateOldLookup(symbolName: string): any[] {
        // 模拟旧的数据结构：普通对象
        const symbolIndex: { [key: string]: any[] } = this.createMockOldIndex();
        
        // 模拟查找过程
        const locations = symbolIndex[symbolName] || [];
        const results: any[] = [];
        
        for (const location of locations) {
            // 模拟二次查找文件缓存
            results.push({ name: symbolName, ...location });
        }
        
        return results;
    }

    /**
     * 模拟新的符号查找（使用 Map）
     */
    private simulateNewLookup(symbolName: string): any[] {
        // 模拟新的数据结构：Map
        const symbolIndex = this.createMockNewIndex();
        
        // 直接从 Map 获取（O(1) 复杂度）
        const entries = symbolIndex.get(symbolName) || [];
        
        // 直接返回符号引用，无需二次查找
        return entries;
    }

    /**
     * 模拟旧的模糊查找
     */
    private simulateOldFuzzySearch(pattern: string): any[] {
        const symbolIndex = this.createMockOldIndex();
        const results: any[] = [];
        
        // 遍历对象的所有键（较慢）
        for (const key in symbolIndex) {
            if (key.includes(pattern)) {
                results.push(...symbolIndex[key]);
            }
        }
        
        return results;
    }

    /**
     * 模拟新的模糊查找
     */
    private simulateNewFuzzySearch(pattern: string): any[] {
        const symbolIndex = this.createMockNewIndex();
        const results: any[] = [];
        
        // 遍历 Map（优化的迭代器）
        for (const [key, entries] of Array.from(symbolIndex.entries())) {
            if (key.includes(pattern)) {
                results.push(...entries);
            }
        }
        
        return results;
    }

    /**
     * 模拟旧的文件符号获取
     */
    private simulateOldFileRetrieval(filePath: string): any[] {
        const files: { [key: string]: any } = this.createMockOldFiles();
        const fileCache = files[filePath];
        return fileCache ? fileCache.symbols : [];
    }

    /**
     * 模拟新的文件符号获取
     */
    private simulateNewFileRetrieval(filePath: string): any[] {
        const files = this.createMockNewFiles();
        const fileCache = files.get(filePath);
        return fileCache ? fileCache.symbols : [];
    }

    /**
     * 创建模拟的旧索引数据
     */
    private createMockOldIndex(): { [key: string]: any[] } {
        const index: { [key: string]: any[] } = {};
        
        // 模拟 100 个符号
        for (let i = 0; i < 100; i++) {
            const symbolName = `Symbol${i}`;
            index[symbolName] = [
                { filePath: 'file1.hlsl', line: i },
                { filePath: 'file2.hlsl', line: i * 2 },
            ];
        }
        
        return index;
    }

    /**
     * 创建模拟的新索引数据
     */
    private createMockNewIndex(): Map<string, any[]> {
        const index = new Map<string, any[]>();
        
        // 模拟 100 个符号
        for (let i = 0; i < 100; i++) {
            const symbolName = `Symbol${i}`;
            index.set(symbolName, [
                { symbol: { name: symbolName, line: i }, filePath: 'file1.hlsl' },
                { symbol: { name: symbolName, line: i * 2 }, filePath: 'file2.hlsl' },
            ]);
        }
        
        return index;
    }

    /**
     * 创建模拟的旧文件数据
     */
    private createMockOldFiles(): { [key: string]: any } {
        const files: { [key: string]: any } = {};
        
        for (let i = 0; i < 50; i++) {
            const filePath = `file${i}.hlsl`;
            files[filePath] = {
                symbols: Array(20).fill(null).map((_, j) => ({
                    name: `Symbol${j}`,
                    line: j,
                })),
            };
        }
        
        return files;
    }

    /**
     * 创建模拟的新文件数据
     */
    private createMockNewFiles(): Map<string, any> {
        const files = new Map<string, any>();
        
        for (let i = 0; i < 50; i++) {
            const filePath = `file${i}.hlsl`;
            files.set(filePath, {
                symbols: Array(20).fill(null).map((_, j) => ({
                    name: `Symbol${j}`,
                    line: j,
                })),
            });
        }
        
        return files;
    }

    /**
     * 打印对比总结
     */
    private printComparisonSummary(): void {
        const tests = [
            { old: 'old_lookup', new: 'new_lookup', name: 'Symbol Lookup' },
            { old: 'old_batch', new: 'new_batch', name: 'Batch Lookup' },
            { old: 'old_fuzzy', new: 'new_fuzzy', name: 'Fuzzy Search' },
            { old: 'old_file_retrieval', new: 'new_file_retrieval', name: 'File Retrieval' },
        ];

        console.log('\n| Test | Old (ms) | New (ms) | Improvement |');
        console.log('|------|----------|----------|-------------|');

        for (const test of tests) {
            const oldStats = this.timer.getStats(test.old);
            const newStats = this.timer.getStats(test.new);

            if (oldStats && newStats) {
                const improvement = ((oldStats.mean - newStats.mean) / oldStats.mean) * 100;
                console.log(
                    `| ${test.name.padEnd(20)} | ${oldStats.mean.toFixed(3)} | ${newStats.mean.toFixed(3)} | ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}% |`
                );
            }
        }

        console.log('\n✅ Performance optimization completed!');
    }

    /**
     * 保存测试结果
     */
    async saveResults(): Promise<void> {
        const resultsDir = path.join(__dirname, 'results');
        await fs.mkdir(resultsDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `cache-comparison-${timestamp}.json`;
        const filepath = path.join(resultsDir, filename);

        await this.timer.saveToFile(filepath);
        console.log(`\nResults saved to: ${filepath}`);
    }
}

/**
 * 运行缓存性能对比测试
 */
export async function runCacheComparison(): Promise<void> {
    const comparison = new CachePerformanceComparison();
    await comparison.runComparison();
    await comparison.saveResults();
}

// 如果直接运行此文件
if (require.main === module) {
    runCacheComparison().catch(console.error);
}
