/**
 * 增量缓存更新性能测试
 * 测试增量更新机制的性能提升
 */

import * as fs from 'fs';
import * as path from 'path';
import { IncrementalCacheUpdater, CacheDiff, FileChangeInfo } from '../../cache/IncrementalCacheUpdater';
import { WorkspaceSymbolCache, FileSymbolCache, CachedSymbol, CachedSymbolKind } from '../../cache/symbolCacheTypes';
import { PerformanceTimer } from './PerformanceTimer';

/**
 * 增量更新性能测试
 */
export class IncrementalUpdatePerformanceTest {
    private workspacePath: string;
    private cacheFilePath: string;
    private updater: IncrementalCacheUpdater;
    private timer: PerformanceTimer;
    
    constructor() {
        this.workspacePath = path.join(__dirname, '../../../test-workspace');
        this.cacheFilePath = path.join(__dirname, '../../../out/test/cache/test-cache.json');
        this.updater = new IncrementalCacheUpdater(this.workspacePath, this.cacheFilePath);
        this.timer = new PerformanceTimer();
    }
    
    /**
     * 运行所有测试
     */
    async runAll(): Promise<void> {
        console.log('\n========================================');
        console.log('增量缓存更新性能测试');
        console.log('========================================\n');
        
        // 准备测试环境
        await this.setupTestEnvironment();
        
        // 测试1: 文件变更检测性能
        await this.testChangeDetection();
        
        // 测试2: 增量更新 vs 全量更新
        await this.testIncrementalVsFull();
        
        // 测试3: 流式写入性能
        await this.testStreamingWrite();
        
        // 测试4: 批量变更处理
        await this.testBatchChanges();
        
        // 清理测试环境
        await this.cleanupTestEnvironment();
        
        console.log('\n========================================');
        console.log('测试完成');
        console.log('========================================\n');
    }
    
    /**
     * 测试1: 文件变更检测性能
     */
    private async testChangeDetection(): Promise<void> {
        console.log('Test 1: 文件变更检测性能');
        console.log('----------------------------------------');
        
        const cache = this.createTestCache(100);
        this.updater.initializeChangeDetection(cache);
        
        // 测试场景1: 检测未变更的文件（快速路径）
        console.log('\n场景1: 检测未变更的文件');
        this.timer.start('unchanged-detection');
        
        for (let i = 0; i < 100; i++) {
            const filePath = `shaders/test-${i}.hlsl`;
            await this.updater.detectFileChange(filePath);
        }
        
        const unchangedTime = this.timer.end('unchanged-detection');
        console.log(`  检测100个未变更文件: ${unchangedTime.toFixed(2)}ms`);
        console.log(`  平均每个文件: ${(unchangedTime / 100).toFixed(3)}ms`);
        
        // 测试场景2: 检测已变更的文件
        console.log('\n场景2: 检测已变更的文件');
        
        // 模拟文件变更
        const changedFiles = ['shaders/test-0.hlsl', 'shaders/test-1.hlsl', 'shaders/test-2.hlsl'];
        for (const filePath of changedFiles) {
            await this.modifyTestFile(filePath);
        }
        
        this.timer.start('changed-detection');
        
        const changes = await this.updater.detectChanges(changedFiles);
        
        const changedTime = this.timer.end('changed-detection');
        console.log(`  检测${changedFiles.length}个已变更文件: ${changedTime.toFixed(2)}ms`);
        console.log(`  平均每个文件: ${(changedTime / changedFiles.length).toFixed(3)}ms`);
        console.log(`  检测到${changes.size}个变更`);
        
        // 测试场景3: 批量检测（混合场景）
        console.log('\n场景3: 批量检测（90%未变更 + 10%已变更）');
        
        const allFiles = Array.from({ length: 100 }, (_, i) => `shaders/test-${i}.hlsl`);
        
        this.timer.start('batch-detection');
        
        const batchChanges = await this.updater.detectChanges(allFiles);
        
        const batchTime = this.timer.end('batch-detection');
        console.log(`  批量检测100个文件: ${batchTime.toFixed(2)}ms`);
        console.log(`  平均每个文件: ${(batchTime / 100).toFixed(3)}ms`);
        console.log(`  检测到${batchChanges.size}个变更`);
        
        console.log('\n✅ 文件变更检测测试完成\n');
    }
    
    /**
     * 测试2: 增量更新 vs 全量更新
     */
    private async testIncrementalVsFull(): Promise<void> {
        console.log('Test 2: 增量更新 vs 全量更新');
        console.log('----------------------------------------');
        
        const fileCount = 500;
        const changeCount = 50; // 10% 变更率
        
        // 创建大型缓存
        const cache = this.createTestCache(fileCount);
        
        // 模拟文件变更
        const changes = new Map<string, FileChangeInfo>();
        for (let i = 0; i < changeCount; i++) {
            const filePath = `shaders/test-${i}.hlsl`;
            changes.set(filePath, {
                filePath,
                oldHash: 'old-hash-' + i,
                newHash: 'new-hash-' + i,
                oldSize: 1000,
                newSize: 1100,
                oldModified: Date.now() - 1000,
                newModified: Date.now(),
            });
        }
        
        // 测试增量更新
        console.log(`\n场景: ${fileCount}个文件，${changeCount}个变更 (${(changeCount / fileCount * 100).toFixed(1)}%)`);
        
        this.timer.start('incremental-update');
        
        const diff = await this.updater.computeCacheDiff(cache, changes);
        const updatedCache = this.updater.applyCacheDiff(cache, diff);
        await this.updater.saveIncremental(updatedCache, diff, { useStreaming: false });
        
        const incrementalTime = this.timer.end('incremental-update');
        
        console.log(`\n增量更新:`);
        console.log(`  总耗时: ${incrementalTime.toFixed(2)}ms`);
        console.log(`  变更统计: +${diff.stats.addedFiles} ~${diff.stats.modifiedFiles} -${diff.stats.deletedFiles} 文件`);
        
        // 测试全量更新（作为对比）
        this.timer.start('full-update');
        
        const fullCacheContent = JSON.stringify(cache, null, 2);
        await fs.promises.writeFile(this.cacheFilePath, fullCacheContent, 'utf-8');
        
        const fullTime = this.timer.end('full-update');
        
        console.log(`\n全量更新:`);
        console.log(`  总耗时: ${fullTime.toFixed(2)}ms`);
        console.log(`  文件大小: ${(fullCacheContent.length / 1024).toFixed(2)} KB`);
        
        // 性能对比
        const improvement = ((fullTime - incrementalTime) / fullTime * 100);
        console.log(`\n性能提升: ${improvement.toFixed(1)}%`);
        
        if (improvement > 30) {
            console.log('✅ 增量更新性能提升显著 (>30%)');
        } else if (improvement > 0) {
            console.log('⚠️ 增量更新性能提升较小 (<30%)');
        } else {
            console.log('❌ 增量更新性能未提升');
        }
        
        console.log('\n✅ 增量更新测试完成\n');
    }
    
    /**
     * 测试3: 流式写入性能
     */
    private async testStreamingWrite(): Promise<void> {
        console.log('Test 3: 流式写入性能');
        console.log('----------------------------------------');
        
        const fileCounts = [100, 500, 1000];
        
        for (const fileCount of fileCounts) {
            console.log(`\n测试规模: ${fileCount}个文件`);
            
            const cache = this.createTestCache(fileCount);
            const diff = this.createEmptyDiff();
            
            // 测试普通写入
            this.timer.start(`normal-write-${fileCount}`);
            await this.updater.saveIncremental(cache, diff, { useStreaming: false });
            const normalTime = this.timer.end(`normal-write-${fileCount}`);
            
            // 测试流式写入
            this.timer.start(`streaming-write-${fileCount}`);
            await this.updater.saveIncremental(cache, diff, { useStreaming: true, batchSize: 50 });
            const streamingTime = this.timer.end(`streaming-write-${fileCount}`);
            
            console.log(`  普通写入: ${normalTime.toFixed(2)}ms`);
            console.log(`  流式写入: ${streamingTime.toFixed(2)}ms`);
            
            const improvement = ((normalTime - streamingTime) / normalTime * 100);
            console.log(`  性能差异: ${improvement.toFixed(1)}%`);
        }
        
        console.log('\n✅ 流式写入测试完成\n');
    }
    
    /**
     * 测试4: 批量变更处理
     */
    private async testBatchChanges(): Promise<void> {
        console.log('Test 4: 批量变更处理');
        console.log('----------------------------------------');
        
        const cache = this.createTestCache(1000);
        this.updater.initializeChangeDetection(cache);
        
        // 测试不同变更率
        const changeRates = [0.01, 0.05, 0.1, 0.2, 0.5];
        
        for (const rate of changeRates) {
            const changeCount = Math.floor(1000 * rate);
            console.log(`\n变更率: ${(rate * 100).toFixed(0)}% (${changeCount}个文件)`);
            
            // 创建变更
            const changes = new Map<string, FileChangeInfo>();
            for (let i = 0; i < changeCount; i++) {
                const filePath = `shaders/test-${i}.hlsl`;
                changes.set(filePath, {
                    filePath,
                    oldHash: 'old-hash-' + i,
                    newHash: 'new-hash-' + i,
                    oldSize: 1000,
                    newSize: 1100,
                    oldModified: Date.now() - 1000,
                    newModified: Date.now(),
                });
            }
            
            // 测试处理时间
            this.timer.start(`batch-${rate}`);
            
            const diff = await this.updater.computeCacheDiff(cache, changes);
            const updatedCache = this.updater.applyCacheDiff(cache, diff);
            await this.updater.saveIncremental(updatedCache, diff);
            
            const batchTime = this.timer.end(`batch-${rate}`);
            
            console.log(`  处理时间: ${batchTime.toFixed(2)}ms`);
            console.log(`  平均每个变更: ${(batchTime / changeCount).toFixed(3)}ms`);
        }
        
        console.log('\n✅ 批量变更处理测试完成\n');
    }
    
    /**
     * 创建测试缓存
     */
    private createTestCache(fileCount: number): WorkspaceSymbolCache {
        const cache: WorkspaceSymbolCache = {
            version: '1.0.0',
            workspacePath: this.workspacePath,
            workspaceHash: 'test-hash',
            files: {},
            symbolIndex: {},
            lastUpdated: Date.now(),
        };
        
        for (let i = 0; i < fileCount; i++) {
            const filePath = `shaders/test-${i}.hlsl`;
            const symbols: CachedSymbol[] = [
                {
                    name: `Function${i}`,
                    kind: CachedSymbolKind.Function,
                    filePath,
                    line: 10,
                    column: 0,
                    endLine: 15,
                    endColumn: 1,
                    signature: `void Function${i}()`,
                },
                {
                    name: `Variable${i}`,
                    kind: CachedSymbolKind.Variable,
                    filePath,
                    line: 5,
                    column: 0,
                    endLine: 5,
                    endColumn: 20,
                    signature: `float Variable${i}`,
                },
            ];
            
            cache.files[filePath] = {
                filePath,
                fileHash: `hash-${i}`,
                lastModified: Date.now(),
                fileSize: 1000,
                symbols,
            };
        }
        
        return cache;
    }
    
    /**
     * 创建空差异
     */
    private createEmptyDiff(): CacheDiff {
        return {
            added: new Map(),
            modified: new Map(),
            deleted: new Set(),
            stats: {
                addedFiles: 0,
                modifiedFiles: 0,
                deletedFiles: 0,
                addedSymbols: 0,
                modifiedSymbols: 0,
                deletedSymbols: 0,
                totalChanges: 0,
            },
        };
    }
    
    /**
     * 修改测试文件（模拟）
     */
    private async modifyTestFile(filePath: string): Promise<void> {
        // 在实际测试中，这里会修改真实文件
        // 现在只是模拟
        console.log(`  [模拟] 修改文件: ${filePath}`);
    }
    
    /**
     * 设置测试环境
     */
    private async setupTestEnvironment(): Promise<void> {
        // 创建测试目录
        const cacheDir = path.dirname(this.cacheFilePath);
        await fs.promises.mkdir(cacheDir, { recursive: true });
        
        console.log('测试环境准备完成\n');
    }
    
    /**
     * 清理测试环境
     */
    private async cleanupTestEnvironment(): Promise<void> {
        // 清理测试文件
        try {
            if (fs.existsSync(this.cacheFilePath)) {
                await fs.promises.unlink(this.cacheFilePath);
            }
        } catch (error) {
            console.error('清理测试环境失败:', error);
        }
        
        console.log('测试环境清理完成');
    }
}

// 运行测试
if (require.main === module) {
    const test = new IncrementalUpdatePerformanceTest();
    test.runAll().catch(console.error);
}
