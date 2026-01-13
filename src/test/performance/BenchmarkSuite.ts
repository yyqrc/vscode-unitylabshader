/**
 * 性能基准测试套件
 * 用于测量和比较代码优化前后的性能
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { PerformanceTimer } from './PerformanceTimer';
import { SymbolParser } from '../../cache/symbolParser';

/**
 * 基准测试配置
 */
export interface BenchmarkConfig {
    /** 测试名称 */
    name: string;
    /** 测试文件路径 */
    filePath: string;
    /** 运行次数 */
    iterations: number;
    /** 预热次数（不计入统计） */
    warmupIterations: number;
}

/**
 * 基准测试结果
 */
export interface BenchmarkResult {
    config: BenchmarkConfig;
    timer: PerformanceTimer;
    timestamp: Date;
}

/**
 * 基准测试套件
 */
export class BenchmarkSuite {
    private timer: PerformanceTimer;
    private results: Map<string, BenchmarkResult> = new Map();

    constructor() {
        this.timer = new PerformanceTimer();
    }

    /**
     * 运行 Shader 解析性能测试
     */
    async runShaderParsingBenchmark(config: BenchmarkConfig): Promise<void> {
        console.log(`\n=== Running Benchmark: ${config.name} ===`);
        console.log(`File: ${config.filePath}`);
        console.log(`Iterations: ${config.iterations} (+ ${config.warmupIterations} warmup)`);

        // 读取文件内容
        const content = await fs.readFile(config.filePath, 'utf-8');

        // 预热
        console.log('Warming up...');
        for (let i = 0; i < config.warmupIterations; i++) {
            SymbolParser.parseFile(config.filePath, content);
        }

        // 正式测试
        console.log('Running benchmark...');
        const label = `${config.name}_parsing`;
        
        for (let i = 0; i < config.iterations; i++) {
            this.timer.start(label);
            SymbolParser.parseFile(config.filePath, content);
            const duration = this.timer.end(label);
            
            if ((i + 1) % 10 === 0) {
                console.log(`  Progress: ${i + 1}/${config.iterations} (last: ${duration.toFixed(2)}ms)`);
            }
        }

        // 保存结果
        this.results.set(config.name, {
            config,
            timer: this.timer,
            timestamp: new Date()
        });

        // 打印统计
        this.timer.printReport(label);
    }

    /**
     * 运行符号查找性能测试
     */
    async runSymbolLookupBenchmark(config: BenchmarkConfig): Promise<void> {
        console.log(`\n=== Running Benchmark: ${config.name} ===`);
        console.log(`File: ${config.filePath}`);

        // 读取文件并解析
        const content = await fs.readFile(config.filePath, 'utf-8');
        const symbols = SymbolParser.parseFile(config.filePath, content);

        if (symbols.length === 0) {
            console.log('Warning: No symbols found in file');
            return;
        }

        // 提取符号名称用于查找测试
        const symbolNames = symbols.map((s: any) => s.name);
        console.log(`Found ${symbolNames.length} symbols`);

        // 预热
        console.log('Warming up...');
        for (let i = 0; i < config.warmupIterations; i++) {
            const randomName = symbolNames[Math.floor(Math.random() * symbolNames.length)];
            symbols.find((s: any) => s.name === randomName);
        }

        // 单次查找测试
        console.log('Running single lookup benchmark...');
        const singleLabel = `${config.name}_single_lookup`;
        
        for (let i = 0; i < config.iterations; i++) {
            const randomName = symbolNames[Math.floor(Math.random() * symbolNames.length)];
            
            this.timer.start(singleLabel);
            symbols.find((s: any) => s.name === randomName);
            this.timer.end(singleLabel);
        }

        // 批量查找测试
        console.log('Running batch lookup benchmark...');
        const batchLabel = `${config.name}_batch_lookup`;
        const batchSize = Math.min(10, symbolNames.length);
        
        for (let i = 0; i < config.iterations; i++) {
            const searchNames = [];
            for (let j = 0; j < batchSize; j++) {
                searchNames.push(symbolNames[Math.floor(Math.random() * symbolNames.length)]);
            }
            
            this.timer.start(batchLabel);
            for (const name of searchNames) {
                symbols.find((s: any) => s.name === name);
            }
            this.timer.end(batchLabel);
        }

        // 保存结果
        this.results.set(config.name, {
            config,
            timer: this.timer,
            timestamp: new Date()
        });

        // 打印统计
        this.timer.printReport(singleLabel);
        this.timer.printReport(batchLabel);
    }

    /**
     * 运行所有基准测试
     */
    async runAllBenchmarks(): Promise<void> {
        const fixturesDir = path.join(__dirname, 'fixtures');

        // 小型文件测试
        const smallConfig: BenchmarkConfig = {
            name: 'Small Shader (200 lines)',
            filePath: path.join(fixturesDir, 'small-shader.hlsl'),
            iterations: 100,
            warmupIterations: 10
        };

        try {
            await this.runShaderParsingBenchmark(smallConfig);
            await this.runSymbolLookupBenchmark(smallConfig);
        } catch (error) {
            console.error(`Error running benchmark ${smallConfig.name}:`, error);
        }

        // 打印总体报告
        console.log('\n=== Overall Performance Report ===');
        this.timer.printReport();

        // 保存结果到文件
        await this.saveResults();
    }

    /**
     * 比较两次基准测试结果
     */
    async compareWithBaseline(baselineFile: string): Promise<void> {
        console.log('\n=== Comparing with Baseline ===');

        try {
            const baselineContent = await fs.readFile(baselineFile, 'utf-8');
            const baseline = JSON.parse(baselineContent);

            // 比较每个测试项
            for (const [name, result] of this.results.entries()) {
                if (baseline[name]) {
                    console.log(`\nComparing: ${name}`);
                    
                    const currentStats = this.timer.getStats(`${name}_parsing`);
                    const baselineStats = baseline[name].parsing;

                    if (currentStats && baselineStats) {
                        const improvement = ((baselineStats.mean - currentStats.mean) / baselineStats.mean) * 100;
                        
                        console.log(`  Baseline Mean: ${baselineStats.mean.toFixed(2)} ms`);
                        console.log(`  Current Mean:  ${currentStats.mean.toFixed(2)} ms`);
                        console.log(`  Improvement:   ${improvement > 0 ? '+' : ''}${improvement.toFixed(2)}%`);
                        
                        if (improvement > 0) {
                            console.log(`  ✅ Performance improved!`);
                        } else if (improvement < -5) {
                            console.log(`  ⚠️  Performance degraded!`);
                        } else {
                            console.log(`  ➡️  Performance similar`);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error comparing with baseline:', error);
        }
    }

    /**
     * 保存测试结果
     */
    async saveResults(): Promise<void> {
        const resultsDir = path.join(__dirname, 'results');
        
        // 确保结果目录存在
        try {
            await fs.mkdir(resultsDir, { recursive: true });
        } catch (error) {
            // 目录已存在
        }

        // 生成文件名（包含时间戳）
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `benchmark-${timestamp}.json`;
        const filepath = path.join(resultsDir, filename);

        // 构建结果数据
        const data: any = {
            timestamp: new Date().toISOString(),
            results: {}
        };

        for (const [name, result] of this.results.entries()) {
            const parsingStats = this.timer.getStats(`${name}_parsing`);
            const singleLookupStats = this.timer.getStats(`${name}_single_lookup`);
            const batchLookupStats = this.timer.getStats(`${name}_batch_lookup`);

            data.results[name] = {
                config: result.config,
                parsing: parsingStats,
                singleLookup: singleLookupStats,
                batchLookup: batchLookupStats
            };
        }

        // 保存到文件
        await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`\nResults saved to: ${filepath}`);

        // 同时保存为 baseline.json（用于后续比较）
        const baselinePath = path.join(resultsDir, 'baseline.json');
        await fs.writeFile(baselinePath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`Baseline saved to: ${baselinePath}`);
    }

    /**
     * 获取性能计时器
     */
    getTimer(): PerformanceTimer {
        return this.timer;
    }

    /**
     * 清除所有结果
     */
    clear(): void {
        this.timer.clearAll();
        this.results.clear();
    }
}

/**
 * 运行基准测试的主函数
 */
export async function runBenchmarks(): Promise<void> {
    const suite = new BenchmarkSuite();
    
    console.log('='.repeat(60));
    console.log('Performance Benchmark Suite');
    console.log('='.repeat(60));
    
    await suite.runAllBenchmarks();
    
    console.log('\n' + '='.repeat(60));
    console.log('Benchmark Complete');
    console.log('='.repeat(60));
}

// 如果直接运行此文件，执行基准测试
if (require.main === module) {
    runBenchmarks().catch(console.error);
}
