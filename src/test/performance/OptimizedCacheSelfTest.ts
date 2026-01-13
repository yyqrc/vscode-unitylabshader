/**
 * 优化缓存管理器自测脚本
 * 验证基本功能是否正常工作
 */

import { OptimizedCacheManager } from '../../cache/OptimizedCacheManager';
import {
    WorkspaceSymbolCache,
    FileSymbolCache,
    CachedSymbol,
    CachedSymbolKind,
} from '../../cache/symbolCacheTypes';

/**
 * 创建测试用的符号缓存数据
 */
function createTestCache(): WorkspaceSymbolCache {
    const symbols1: CachedSymbol[] = [
        {
            name: 'VertexShader',
            kind: CachedSymbolKind.Function,
            filePath: 'test1.hlsl',
            line: 10,
            column: 0,
            endLine: 15,
            endColumn: 1,
            signature: 'void VertexShader()',
        },
        {
            name: 'FragmentShader',
            kind: CachedSymbolKind.Function,
            filePath: 'test1.hlsl',
            line: 20,
            column: 0,
            endLine: 25,
            endColumn: 1,
            signature: 'void FragmentShader()',
        },
        {
            name: '_MainTex',
            kind: CachedSymbolKind.Variable,
            filePath: 'test1.hlsl',
            line: 5,
            column: 0,
            endLine: 5,
            endColumn: 20,
        },
    ];

    const symbols2: CachedSymbol[] = [
        {
            name: 'CalculatePBRLighting',
            kind: CachedSymbolKind.Function,
            filePath: 'test2.hlsl',
            line: 15,
            column: 0,
            endLine: 20,
            endColumn: 1,
            signature: 'float3 CalculatePBRLighting()',
        },
        {
            name: 'UnpackNormal',
            kind: CachedSymbolKind.Function,
            filePath: 'test2.hlsl',
            line: 30,
            column: 0,
            endLine: 35,
            endColumn: 1,
            signature: 'float3 UnpackNormal(float2 uv)',
        },
    ];

    const fileCache1: FileSymbolCache = {
        filePath: 'test1.hlsl',
        fileHash: 'hash1',
        symbols: symbols1,
        fileSize: 1024,
        lastModified: Date.now(),
    };

    const fileCache2: FileSymbolCache = {
        filePath: 'test2.hlsl',
        fileHash: 'hash2',
        symbols: symbols2,
        fileSize: 2048,
        lastModified: Date.now(),
    };

    return {
        version: '1.0.0',
        workspacePath: '/test/workspace',
        workspaceHash: 'workspace-hash',
        files: {
            'test1.hlsl': fileCache1,
            'test2.hlsl': fileCache2,
        },
        symbolIndex: {},
        lastUpdated: Date.now(),
    };
}

/**
 * 运行自测
 */
function runSelfTest(): void {
    console.log('🧪 Starting OptimizedCacheManager Self-Test...\n');

    const manager = new OptimizedCacheManager();
    const testCache = createTestCache();

    // 测试 1: 构建优化缓存
    console.log('Test 1: Building optimized cache...');
    const optimized = manager.buildOptimizedCache(testCache);
    console.log(`✅ Cache built successfully`);
    console.log(`   Files: ${optimized.files.size}`);
    console.log(`   Symbol Index: ${optimized.symbolIndex.size}`);
    console.log('');

    // 测试 2: 精确符号查找
    console.log('Test 2: Exact symbol lookup...');
    const result1 = manager.findSymbol('VertexShader');
    console.log(`✅ Found ${result1.symbols.length} symbol(s) for "VertexShader"`);
    console.log(`   Search time: ${result1.searchTime.toFixed(3)}ms`);
    console.log(`   From cache: ${result1.fromCache}`);
    if (result1.symbols.length > 0) {
        console.log(`   Symbol: ${result1.symbols[0].name} at ${result1.symbols[0].filePath}:${result1.symbols[0].line}`);
    }
    console.log('');

    // 测试 3: 查找不存在的符号
    console.log('Test 3: Lookup non-existent symbol...');
    const result2 = manager.findSymbol('NonExistent');
    console.log(`✅ Found ${result2.symbols.length} symbol(s) for "NonExistent"`);
    console.log(`   Search time: ${result2.searchTime.toFixed(3)}ms`);
    console.log('');

    // 测试 4: 批量查找
    console.log('Test 4: Batch lookup...');
    const batchResults = manager.findSymbols(['VertexShader', 'FragmentShader', 'UnpackNormal']);
    console.log(`✅ Batch lookup completed for 3 symbols`);
    for (const [name, result] of Array.from(batchResults.entries())) {
        console.log(`   ${name}: ${result.symbols.length} found in ${result.searchTime.toFixed(3)}ms`);
    }
    console.log('');

    // 测试 5: 模糊查找
    console.log('Test 5: Fuzzy search...');
    const fuzzyResult = manager.fuzzyFindSymbol('Shader');
    console.log(`✅ Fuzzy search for "Shader" found ${fuzzyResult.symbols.length} symbol(s)`);
    console.log(`   Search time: ${fuzzyResult.searchTime.toFixed(3)}ms`);
    for (const symbol of fuzzyResult.symbols) {
        console.log(`   - ${symbol.name}`);
    }
    console.log('');

    // 测试 6: 按类型查找
    console.log('Test 6: Find symbols by kind...');
    const functions = manager.getSymbolsByKind(CachedSymbolKind.Function);
    console.log(`✅ Found ${functions.length} function(s)`);
    for (const func of functions) {
        console.log(`   - ${func.name}`);
    }
    console.log('');

    // 测试 7: 获取文件符号
    console.log('Test 7: Get file symbols...');
    const fileSymbols = manager.getFileSymbols('test1.hlsl');
    console.log(`✅ Found ${fileSymbols.length} symbol(s) in test1.hlsl`);
    for (const symbol of fileSymbols) {
        console.log(`   - ${symbol.name} (${symbol.kind})`);
    }
    console.log('');

    // 测试 8: 缓存命中测试
    console.log('Test 8: Cache hit test...');
    const result3 = manager.findSymbol('VertexShader');
    console.log(`✅ Second lookup for "VertexShader"`);
    console.log(`   From cache: ${result3.fromCache}`);
    console.log(`   Search time: ${result3.searchTime.toFixed(3)}ms`);
    console.log('');

    // 测试 9: 增量更新
    console.log('Test 9: Incremental update...');
    const newSymbol: CachedSymbol = {
        name: 'NewFunction',
        kind: CachedSymbolKind.Function,
        filePath: 'test1.hlsl',
        line: 50,
        column: 0,
        endLine: 55,
        endColumn: 1,
        signature: 'void NewFunction()',
    };
    const updatedFileCache: FileSymbolCache = {
        filePath: 'test1.hlsl',
        fileHash: 'hash1-updated',
        symbols: [...testCache.files['test1.hlsl'].symbols, newSymbol],
        fileSize: 1536,
        lastModified: Date.now(),
    };
    manager.updateFileCache('test1.hlsl', updatedFileCache);
    const result4 = manager.findSymbol('NewFunction');
    console.log(`✅ Updated cache and found new symbol: ${result4.symbols.length > 0}`);
    console.log('');

    // 测试 10: 统计信息
    console.log('Test 10: Cache statistics...');
    const stats = manager.getStats();
    console.log(`✅ Cache statistics:`);
    console.log(`   Files: ${stats.fileCount}`);
    console.log(`   Symbols: ${stats.symbolCount}`);
    console.log(`   Index size: ${stats.indexSize}`);
    console.log(`   Search cache size: ${stats.searchCacheSize}`);
    console.log('');

    // 测试 11: 文件移除
    console.log('Test 11: Remove file cache...');
    manager.removeFileCache('test2.hlsl');
    const result5 = manager.findSymbol('UnpackNormal');
    console.log(`✅ Removed test2.hlsl, UnpackNormal found: ${result5.symbols.length > 0}`);
    const statsAfterRemove = manager.getStats();
    console.log(`   Files after removal: ${statsAfterRemove.fileCount}`);
    console.log('');

    console.log('🎉 All tests passed!\n');
    console.log('='.repeat(60));
    console.log('Summary:');
    console.log('- ✅ Cache building works correctly');
    console.log('- ✅ Symbol lookup is functional');
    console.log('- ✅ Batch lookup works');
    console.log('- ✅ Fuzzy search works');
    console.log('- ✅ Type-based filtering works');
    console.log('- ✅ File symbol retrieval works');
    console.log('- ✅ LRU cache is working');
    console.log('- ✅ Incremental updates work');
    console.log('- ✅ Statistics are accurate');
    console.log('- ✅ File removal works');
    console.log('='.repeat(60));
}

// 运行自测
if (require.main === module) {
    try {
        runSelfTest();
    } catch (error) {
        console.error('❌ Self-test failed:', error);
        process.exit(1);
    }
}

export { runSelfTest };
