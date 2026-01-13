/**
 * 性能测试运行脚本
 * 用于快速运行基准测试
 */

import { runBenchmarks } from './BenchmarkSuite';

async function main() {
    try {
        console.log('Starting performance benchmarks...\n');
        await runBenchmarks();
        console.log('\n✅ Benchmarks completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Benchmark failed:', error);
        process.exit(1);
    }
}

main();
