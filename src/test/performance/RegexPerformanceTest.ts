/**
 * 正则表达式和字符串处理性能测试
 * 测试任务4和任务5的优化效果
 */

import { RegexCache, PathUtils, StringBuilder } from '../../utils/RegexCache';
import { PerformanceTimer } from './PerformanceTimer';

/**
 * 正则表达式性能测试
 */
export class RegexPerformanceTest {
    private timer: PerformanceTimer;
    
    constructor() {
        this.timer = new PerformanceTimer();
    }
    
    /**
     * 运行所有测试
     */
    async runAll(): Promise<void> {
        console.log('\n========================================');
        console.log('正则表达式和字符串处理性能测试');
        console.log('========================================\n');
        
        // 测试1: 正则表达式缓存性能
        await this.testRegexCache();
        
        // 测试2: 字符串拼接性能
        await this.testStringBuilding();
        
        // 测试3: 路径处理性能（跨平台）
        await this.testPathUtils();
        
        // 测试4: 正则表达式编译开销
        await this.testRegexCompilation();
        
        console.log('\n========================================');
        console.log('测试完成');
        console.log('========================================\n');
    }
    
    /**
     * 测试1: 正则表达式缓存性能
     */
    private async testRegexCache(): Promise<void> {
        console.log('Test 1: 正则表达式缓存性能');
        console.log('----------------------------------------');
        
        const patterns = [
            { pattern: '\\bfunction\\b', flags: 'g' },
            { pattern: '\\bvariable\\b', flags: 'g' },
            { pattern: '^struct\\s+(\\w+)', flags: '' },
            { pattern: '\\b(\\w+)\\s*\\(', flags: 'g' },
        ];
        
        const testText = 'function test() { variable x = 10; struct MyStruct { }; }';
        const iterations = 10000;
        
        // 场景1: 不使用缓存（每次创建新的RegExp）
        console.log('\n场景1: 不使用缓存');
        this.timer.start('no-cache');
        
        for (let i = 0; i < iterations; i++) {
            for (const { pattern, flags } of patterns) {
                const regex = new RegExp(pattern, flags);
                regex.test(testText);
            }
        }
        
        const noCacheTime = this.timer.end('no-cache');
        console.log(`  ${iterations}次迭代: ${noCacheTime.toFixed(2)}ms`);
        console.log(`  平均每次: ${(noCacheTime / iterations).toFixed(4)}ms`);
        
        // 场景2: 使用缓存
        console.log('\n场景2: 使用RegexCache');
        this.timer.start('with-cache');
        
        for (let i = 0; i < iterations; i++) {
            for (const { pattern, flags } of patterns) {
                const regex = RegexCache.get(pattern, flags);
                regex.test(testText);
            }
        }
        
        const withCacheTime = this.timer.end('with-cache');
        console.log(`  ${iterations}次迭代: ${withCacheTime.toFixed(2)}ms`);
        console.log(`  平均每次: ${(withCacheTime / iterations).toFixed(4)}ms`);
        
        // 性能对比
        const improvement = ((noCacheTime - withCacheTime) / noCacheTime * 100);
        console.log(`\n性能提升: ${improvement.toFixed(1)}%`);
        console.log(`缓存统计: ${JSON.stringify(RegexCache.getStats(), null, 2)}`);
        
        if (improvement > 20) {
            console.log('✅ 正则表达式缓存性能提升显著 (>20%)');
        } else {
            console.log('⚠️ 正则表达式缓存性能提升较小 (<20%)');
        }
        
        console.log('\n✅ 正则表达式缓存测试完成\n');
    }
    
    /**
     * 测试2: 字符串拼接性能
     */
    private async testStringBuilding(): Promise<void> {
        console.log('Test 2: 字符串拼接性能');
        console.log('----------------------------------------');
        
        const parts = Array.from({ length: 1000 }, (_, i) => `line ${i}\n`);
        const iterations = 1000;
        
        // 场景1: 使用 += 拼接
        console.log('\n场景1: 使用 += 拼接');
        this.timer.start('concat-operator');
        
        for (let i = 0; i < iterations; i++) {
            let result = '';
            for (const part of parts) {
                result += part;
            }
        }
        
        const concatTime = this.timer.end('concat-operator');
        console.log(`  ${iterations}次迭代: ${concatTime.toFixed(2)}ms`);
        console.log(`  平均每次: ${(concatTime / iterations).toFixed(4)}ms`);
        
        // 场景2: 使用数组 join
        console.log('\n场景2: 使用数组 join');
        this.timer.start('array-join');
        
        for (let i = 0; i < iterations; i++) {
            const result = parts.join('');
        }
        
        const joinTime = this.timer.end('array-join');
        console.log(`  ${iterations}次迭代: ${joinTime.toFixed(2)}ms`);
        console.log(`  平均每次: ${(joinTime / iterations).toFixed(4)}ms`);
        
        // 场景3: 使用 StringBuilder
        console.log('\n场景3: 使用 StringBuilder');
        this.timer.start('string-builder');
        
        for (let i = 0; i < iterations; i++) {
            const builder = new StringBuilder();
            for (const part of parts) {
                builder.append(part);
            }
            const result = builder.toString();
        }
        
        const builderTime = this.timer.end('string-builder');
        console.log(`  ${iterations}次迭代: ${builderTime.toFixed(2)}ms`);
        console.log(`  平均每次: ${(builderTime / iterations).toFixed(4)}ms`);
        
        // 性能对比
        const improvement1 = ((concatTime - joinTime) / concatTime * 100);
        const improvement2 = ((concatTime - builderTime) / concatTime * 100);
        
        console.log(`\n性能对比:`);
        console.log(`  += vs join: ${improvement1.toFixed(1)}% 提升`);
        console.log(`  += vs StringBuilder: ${improvement2.toFixed(1)}% 提升`);
        
        if (improvement1 > 50) {
            console.log('✅ 数组join性能提升显著 (>50%)');
        }
        
        console.log('\n✅ 字符串拼接测试完成\n');
    }
    
    /**
     * 测试3: 路径处理性能（跨平台）
     */
    private async testPathUtils(): Promise<void> {
        console.log('Test 3: 路径处理性能（跨平台）');
        console.log('----------------------------------------');
        console.log(`当前平台: ${process.platform}`);
        
        const windowsPaths = [
            'C:\\Users\\test\\file.txt',
            'C:\\Program Files\\app\\data.json',
            'D:\\workspace\\project\\src\\main.ts',
        ];
        
        const unixPaths = [
            '/Users/test/file.txt',
            '/usr/local/bin/app',
            '/home/user/workspace/project/src/main.ts',
        ];
        
        const iterations = 10000;
        
        // 测试路径标准化
        console.log('\n场景1: 路径标准化');
        this.timer.start('path-normalize');
        
        for (let i = 0; i < iterations; i++) {
            for (const path of windowsPaths) {
                PathUtils.normalize(path);
            }
            for (const path of unixPaths) {
                PathUtils.normalize(path);
            }
        }
        
        const normalizeTime = this.timer.end('path-normalize');
        console.log(`  ${iterations}次迭代: ${normalizeTime.toFixed(2)}ms`);
        console.log(`  平均每个路径: ${(normalizeTime / (iterations * 6)).toFixed(4)}ms`);
        
        // 测试路径比较
        console.log('\n场景2: 路径比较');
        this.timer.start('path-equals');
        
        for (let i = 0; i < iterations; i++) {
            PathUtils.equals('C:\\Users\\test\\file.txt', 'C:/Users/test/file.txt');
            PathUtils.equals('/Users/test/file.txt', '/users/test/file.txt');
        }
        
        const equalsTime = this.timer.end('path-equals');
        console.log(`  ${iterations}次迭代: ${equalsTime.toFixed(2)}ms`);
        console.log(`  平均每次: ${(equalsTime / iterations).toFixed(4)}ms`);
        
        // 测试正则转义
        console.log('\n场景3: 正则表达式转义');
        const specialChars = [
            'file.txt',
            'path[0].json',
            'data(1).xml',
            'test$var.ts',
        ];
        
        this.timer.start('regex-escape');
        
        for (let i = 0; i < iterations; i++) {
            for (const str of specialChars) {
                PathUtils.escapeRegex(str);
            }
        }
        
        const escapeTime = this.timer.end('regex-escape');
        console.log(`  ${iterations}次迭代: ${escapeTime.toFixed(2)}ms`);
        console.log(`  平均每个字符串: ${(escapeTime / (iterations * 4)).toFixed(4)}ms`);
        
        console.log('\n✅ 路径处理测试完成\n');
    }
    
    /**
     * 测试4: 正则表达式编译开销
     */
    private async testRegexCompilation(): Promise<void> {
        console.log('Test 4: 正则表达式编译开销');
        console.log('----------------------------------------');
        
        const complexPatterns = [
            '^\\s*(?:inline\\s+)?(?:static\\s+)?(?:const\\s+)?(\\w+(?:\\s*<[^>]+>)?)\\s+(\\w+)\\s*\\(([^)]*)\\)\\s*(?::\\s*\\w+\\s*)?(?:\\{|;)',
            '^\\s*#define\\s+(\\w+)(?:\\s*\\(([^)]*)\\))?\\s*(.*?)(?:\\\\\\s*$)?',
            '^\\s*(?:typedef\\s+)?struct\\s+(\\w+)\\s*(?:\\{|;)',
            '^\\s*(?:static\\s+)?(?:const\\s+)?(?:uniform\\s+)?(\\w+(?:\\s*<[^>]+>)?)\\s+(\\w+)\\s*(?:=\\s*[^;]+)?\\s*;',
        ];
        
        const iterations = 1000;
        
        // 场景1: 每次编译
        console.log('\n场景1: 每次编译正则表达式');
        this.timer.start('compile-each-time');
        
        for (let i = 0; i < iterations; i++) {
            for (const pattern of complexPatterns) {
                const regex = new RegExp(pattern, 'gm');
                regex.test('float3 test() { }');
            }
        }
        
        const compileTime = this.timer.end('compile-each-time');
        console.log(`  ${iterations}次迭代: ${compileTime.toFixed(2)}ms`);
        console.log(`  平均每次: ${(compileTime / iterations).toFixed(4)}ms`);
        
        // 场景2: 预编译（静态）
        console.log('\n场景2: 预编译正则表达式（静态）');
        const precompiledRegexes = complexPatterns.map(p => new RegExp(p, 'gm'));
        
        this.timer.start('precompiled');
        
        for (let i = 0; i < iterations; i++) {
            for (const regex of precompiledRegexes) {
                regex.lastIndex = 0; // 重置
                regex.test('float3 test() { }');
            }
        }
        
        const precompiledTime = this.timer.end('precompiled');
        console.log(`  ${iterations}次迭代: ${precompiledTime.toFixed(2)}ms`);
        console.log(`  平均每次: ${(precompiledTime / iterations).toFixed(4)}ms`);
        
        // 场景3: 使用缓存
        console.log('\n场景3: 使用RegexCache');
        RegexCache.clear();
        
        this.timer.start('cached');
        
        for (let i = 0; i < iterations; i++) {
            for (const pattern of complexPatterns) {
                const regex = RegexCache.get(pattern, 'gm');
                regex.test('float3 test() { }');
            }
        }
        
        const cachedTime = this.timer.end('cached');
        console.log(`  ${iterations}次迭代: ${cachedTime.toFixed(2)}ms`);
        console.log(`  平均每次: ${(cachedTime / iterations).toFixed(4)}ms`);
        
        // 性能对比
        const improvement1 = ((compileTime - precompiledTime) / compileTime * 100);
        const improvement2 = ((compileTime - cachedTime) / compileTime * 100);
        
        console.log(`\n性能对比:`);
        console.log(`  动态编译 vs 预编译: ${improvement1.toFixed(1)}% 提升`);
        console.log(`  动态编译 vs 缓存: ${improvement2.toFixed(1)}% 提升`);
        console.log(`缓存统计: ${JSON.stringify(RegexCache.getStats(), null, 2)}`);
        
        if (improvement2 > 60) {
            console.log('✅ 正则表达式缓存性能提升显著 (>60%)');
        }
        
        console.log('\n✅ 正则表达式编译测试完成\n');
    }
}

// 运行测试
if (require.main === module) {
    const test = new RegexPerformanceTest();
    test.runAll().catch(console.error);
}
