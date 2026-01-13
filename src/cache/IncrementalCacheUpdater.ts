/**
 * 增量缓存更新器
 * 实现高效的增量缓存更新和持久化机制
 */

import * as fs from 'fs';
import * as path from 'path';
import {
    WorkspaceSymbolCache,
    FileSymbolCache,
    CachedSymbol,
    FileChangeEvent,
} from './symbolCacheTypes';
import { FileHasher } from './fileHasher';
import { SymbolParser } from './symbolParser';

/**
 * 缓存差异信息
 */
export interface CacheDiff {
    /** 新增的文件 */
    added: Map<string, FileSymbolCache>;
    /** 修改的文件 */
    modified: Map<string, FileSymbolCache>;
    /** 删除的文件 */
    deleted: Set<string>;
    /** 差异统计 */
    stats: {
        addedFiles: number;
        modifiedFiles: number;
        deletedFiles: number;
        addedSymbols: number;
        modifiedSymbols: number;
        deletedSymbols: number;
        totalChanges: number;
    };
}

/**
 * 文件变更信息
 */
export interface FileChangeInfo {
    filePath: string;
    oldHash: string;
    newHash: string;
    oldSize: number;
    newSize: number;
    oldModified: number;
    newModified: number;
}

/**
 * 增量更新选项
 */
export interface IncrementalUpdateOptions {
    /** 是否使用流式写入 */
    useStreaming?: boolean;
    /** 批量更新大小 */
    batchSize?: number;
    /** 是否压缩输出 */
    compress?: boolean;
    /** 是否验证更新 */
    validate?: boolean;
}

/**
 * 增量缓存更新器
 */
export class IncrementalCacheUpdater {
    private workspacePath: string;
    private cacheFilePath: string;
    
    // 变更检测缓存
    private fileHashCache: Map<string, string> = new Map();
    private fileSizeCache: Map<string, number> = new Map();
    private fileModifiedCache: Map<string, number> = new Map();
    
    // 性能统计
    private stats = {
        totalUpdates: 0,
        incrementalUpdates: 0,
        fullRebuild: 0,
        totalSaveTime: 0,
        totalLoadTime: 0,
        bytesWritten: 0,
        bytesRead: 0,
    };
    
    constructor(workspacePath: string, cacheFilePath: string) {
        this.workspacePath = workspacePath;
        this.cacheFilePath = cacheFilePath;
    }
    
    /**
     * 初始化文件变更检测缓存
     */
    initializeChangeDetection(cache: WorkspaceSymbolCache): void {
        const startTime = performance.now();
        
        this.fileHashCache.clear();
        this.fileSizeCache.clear();
        this.fileModifiedCache.clear();
        
        for (const [filePath, fileCache] of Object.entries(cache.files)) {
            this.fileHashCache.set(filePath, fileCache.fileHash);
            this.fileSizeCache.set(filePath, fileCache.fileSize);
            this.fileModifiedCache.set(filePath, fileCache.lastModified);
        }
        
        const initTime = performance.now() - startTime;
        console.log(`[IncrementalUpdater] Initialized change detection in ${initTime.toFixed(2)}ms`);
        console.log(`[IncrementalUpdater] Tracking ${this.fileHashCache.size} files`);
    }
    
    /**
     * 检测文件是否发生变更
     */
    async detectFileChange(filePath: string): Promise<FileChangeInfo | null> {
        try {
            const absolutePath = path.join(this.workspacePath, filePath);
            
            // 检查文件是否存在
            if (!fs.existsSync(absolutePath)) {
                // 文件已删除
                if (this.fileHashCache.has(filePath)) {
                    return {
                        filePath,
                        oldHash: this.fileHashCache.get(filePath)!,
                        newHash: '',
                        oldSize: this.fileSizeCache.get(filePath) || 0,
                        newSize: 0,
                        oldModified: this.fileModifiedCache.get(filePath) || 0,
                        newModified: 0,
                    };
                }
                return null;
            }
            
            // 获取文件统计信息
            const stats = await fs.promises.stat(absolutePath);
            const oldModified = this.fileModifiedCache.get(filePath) || 0;
            const oldSize = this.fileSizeCache.get(filePath) || 0;
            
            // 快速检查：文件大小和修改时间
            if (stats.size === oldSize && stats.mtimeMs === oldModified) {
                // 文件未变更
                return null;
            }
            
            // 读取文件内容并计算哈希
            const content = await fs.promises.readFile(absolutePath, 'utf-8');
            const newHash = FileHasher.hashString(content);
            const oldHash = this.fileHashCache.get(filePath) || '';
            
            // 比较哈希值
            if (newHash === oldHash) {
                // 哈希相同，文件内容未变更（可能只是时间戳变化）
                return null;
            }
            
            // 文件已变更
            return {
                filePath,
                oldHash,
                newHash,
                oldSize,
                newSize: stats.size,
                oldModified,
                newModified: stats.mtimeMs,
            };
        } catch (error) {
            console.error(`[IncrementalUpdater] Failed to detect change for ${filePath}:`, error);
            return null;
        }
    }
    
    /**
     * 批量检测文件变更
     */
    async detectChanges(filePaths: string[]): Promise<Map<string, FileChangeInfo>> {
        const startTime = performance.now();
        const changes = new Map<string, FileChangeInfo>();
        
        // 并行检测变更
        const detectionPromises = filePaths.map(async (filePath) => {
            const change = await this.detectFileChange(filePath);
            if (change) {
                changes.set(filePath, change);
            }
        });
        
        await Promise.all(detectionPromises);
        
        const detectTime = performance.now() - startTime;
        console.log(`[IncrementalUpdater] Detected ${changes.size} changes in ${detectTime.toFixed(2)}ms`);
        
        return changes;
    }
    
    /**
     * 计算缓存差异
     */
    async computeCacheDiff(
        oldCache: WorkspaceSymbolCache,
        changes: Map<string, FileChangeInfo>
    ): Promise<CacheDiff> {
        const startTime = performance.now();
        
        const diff: CacheDiff = {
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
        
        // 处理每个变更
        for (const [filePath, change] of Array.from(changes.entries())) {
            if (change.newHash === '') {
                // 文件已删除
                diff.deleted.add(filePath);
                diff.stats.deletedFiles++;
                
                const oldFileCache = oldCache.files[filePath];
                if (oldFileCache) {
                    diff.stats.deletedSymbols += oldFileCache.symbols.length;
                }
            } else if (change.oldHash === '') {
                // 新增文件
                const fileCache = await this.parseFile(filePath);
                if (fileCache) {
                    diff.added.set(filePath, fileCache);
                    diff.stats.addedFiles++;
                    diff.stats.addedSymbols += fileCache.symbols.length;
                }
            } else {
                // 文件已修改
                const fileCache = await this.parseFile(filePath);
                if (fileCache) {
                    diff.modified.set(filePath, fileCache);
                    diff.stats.modifiedFiles++;
                    
                    const oldFileCache = oldCache.files[filePath];
                    if (oldFileCache) {
                        diff.stats.deletedSymbols += oldFileCache.symbols.length;
                    }
                    diff.stats.addedSymbols += fileCache.symbols.length;
                }
            }
        }
        
        diff.stats.totalChanges = diff.stats.addedFiles + diff.stats.modifiedFiles + diff.stats.deletedFiles;
        
        const computeTime = performance.now() - startTime;
        console.log(`[IncrementalUpdater] Computed cache diff in ${computeTime.toFixed(2)}ms`);
        console.log(`[IncrementalUpdater] Changes: +${diff.stats.addedFiles} ~${diff.stats.modifiedFiles} -${diff.stats.deletedFiles} files`);
        
        return diff;
    }
    
    /**
     * 应用缓存差异（增量更新）
     */
    applyCacheDiff(cache: WorkspaceSymbolCache, diff: CacheDiff): WorkspaceSymbolCache {
        const startTime = performance.now();
        
        // 删除文件
        for (const filePath of Array.from(diff.deleted)) {
            delete cache.files[filePath];
            
            // 更新变更检测缓存
            this.fileHashCache.delete(filePath);
            this.fileSizeCache.delete(filePath);
            this.fileModifiedCache.delete(filePath);
        }
        
        // 添加新文件
        for (const [filePath, fileCache] of Array.from(diff.added.entries())) {
            cache.files[filePath] = fileCache;
            
            // 更新变更检测缓存
            this.fileHashCache.set(filePath, fileCache.fileHash);
            this.fileSizeCache.set(filePath, fileCache.fileSize);
            this.fileModifiedCache.set(filePath, fileCache.lastModified);
        }
        
        // 更新修改的文件
        for (const [filePath, fileCache] of Array.from(diff.modified.entries())) {
            cache.files[filePath] = fileCache;
            
            // 更新变更检测缓存
            this.fileHashCache.set(filePath, fileCache.fileHash);
            this.fileSizeCache.set(filePath, fileCache.fileSize);
            this.fileModifiedCache.set(filePath, fileCache.lastModified);
        }
        
        // 更新时间戳
        cache.lastUpdated = Date.now();
        
        const applyTime = performance.now() - startTime;
        console.log(`[IncrementalUpdater] Applied cache diff in ${applyTime.toFixed(2)}ms`);
        
        return cache;
    }
    
    /**
     * 增量保存缓存（只写入变更部分）
     */
    async saveIncremental(
        cache: WorkspaceSymbolCache,
        diff: CacheDiff,
        options: IncrementalUpdateOptions = {}
    ): Promise<void> {
        const startTime = performance.now();
        
        // 如果变更太多，使用全量保存
        const changeRatio = diff.stats.totalChanges / Object.keys(cache.files).length;
        if (changeRatio > 0.3) {
            console.log(`[IncrementalUpdater] Change ratio ${(changeRatio * 100).toFixed(1)}% too high, using full save`);
            await this.saveFull(cache, options);
            return;
        }
        
        // 使用流式写入
        if (options.useStreaming) {
            await this.saveWithStreaming(cache, options);
        } else {
            await this.saveFull(cache, options);
        }
        
        const saveTime = performance.now() - startTime;
        this.stats.totalSaveTime += saveTime;
        this.stats.incrementalUpdates++;
        
        console.log(`[IncrementalUpdater] Incremental save completed in ${saveTime.toFixed(2)}ms`);
    }
    
    /**
     * 流式写入缓存（减少内存峰值）
     */
    private async saveWithStreaming(
        cache: WorkspaceSymbolCache,
        options: IncrementalUpdateOptions
    ): Promise<void> {
        const writeStream = fs.createWriteStream(this.cacheFilePath, { encoding: 'utf-8' });
        
        return new Promise((resolve, reject) => {
            writeStream.on('error', reject);
            writeStream.on('finish', resolve);
            
            // 写入缓存头部
            writeStream.write('{\n');
            writeStream.write(`  "version": "${cache.version}",\n`);
            writeStream.write(`  "workspacePath": "${cache.workspacePath}",\n`);
            writeStream.write(`  "workspaceHash": "${cache.workspaceHash}",\n`);
            writeStream.write(`  "lastUpdated": ${cache.lastUpdated},\n`);
            writeStream.write('  "files": {\n');
            
            // 流式写入文件缓存
            const filePaths = Object.keys(cache.files);
            const batchSize = options.batchSize || 50;
            
            for (let i = 0; i < filePaths.length; i += batchSize) {
                const batch = filePaths.slice(i, i + batchSize);
                
                for (let j = 0; j < batch.length; j++) {
                    const filePath = batch[j];
                    const fileCache = cache.files[filePath];
                    const isLast = (i + j === filePaths.length - 1);
                    
                    const fileJson = JSON.stringify(fileCache, null, 4)
                        .split('\n')
                        .map(line => '    ' + line)
                        .join('\n');
                    
                    writeStream.write(`    "${filePath}": ${fileJson}`);
                    if (!isLast) {
                        writeStream.write(',\n');
                    } else {
                        writeStream.write('\n');
                    }
                }
            }
            
            writeStream.write('  },\n');
            writeStream.write('  "symbolIndex": ');
            writeStream.write(JSON.stringify(cache.symbolIndex, null, 2));
            writeStream.write('\n}\n');
            
            writeStream.end();
        });
    }
    
    /**
     * 全量保存缓存
     */
    private async saveFull(
        cache: WorkspaceSymbolCache,
        options: IncrementalUpdateOptions
    ): Promise<void> {
        const content = JSON.stringify(cache, null, 2);
        await fs.promises.writeFile(this.cacheFilePath, content, 'utf-8');
        
        this.stats.bytesWritten += content.length;
        this.stats.fullRebuild++;
    }
    
    /**
     * 解析文件
     */
    private async parseFile(relativePath: string): Promise<FileSymbolCache | null> {
        try {
            const absolutePath = path.join(this.workspacePath, relativePath);
            const content = await fs.promises.readFile(absolutePath, 'utf-8');
            const stats = await fs.promises.stat(absolutePath);
            
            const fileHash = FileHasher.hashString(content);
            const symbols = SymbolParser.parseFile(relativePath, content);
            
            return {
                filePath: relativePath,
                fileHash,
                lastModified: stats.mtimeMs,
                fileSize: stats.size,
                symbols,
            };
        } catch (error) {
            console.error(`[IncrementalUpdater] Failed to parse file ${relativePath}:`, error);
            return null;
        }
    }
    
    /**
     * 验证缓存完整性
     */
    async validateCache(cache: WorkspaceSymbolCache): Promise<boolean> {
        const startTime = performance.now();
        let isValid = true;
        
        // 验证基本结构
        if (!cache.version || !cache.workspacePath || !cache.files) {
            console.error('[IncrementalUpdater] Cache structure is invalid');
            return false;
        }
        
        // 验证文件数量
        const fileCount = Object.keys(cache.files).length;
        if (fileCount === 0) {
            console.warn('[IncrementalUpdater] Cache is empty');
            isValid = false;
        }
        
        // 验证符号索引
        if (!cache.symbolIndex || Object.keys(cache.symbolIndex).length === 0) {
            console.warn('[IncrementalUpdater] Symbol index is empty');
            isValid = false;
        }
        
        const validateTime = performance.now() - startTime;
        console.log(`[IncrementalUpdater] Cache validation completed in ${validateTime.toFixed(2)}ms`);
        console.log(`[IncrementalUpdater] Cache is ${isValid ? 'valid' : 'invalid'}`);
        
        return isValid;
    }
    
    /**
     * 获取性能统计
     */
    getStats() {
        return {
            ...this.stats,
            averageSaveTime: this.stats.totalUpdates > 0 
                ? this.stats.totalSaveTime / this.stats.totalUpdates 
                : 0,
            incrementalRatio: this.stats.totalUpdates > 0
                ? this.stats.incrementalUpdates / this.stats.totalUpdates
                : 0,
        };
    }
    
    /**
     * 重置统计信息
     */
    resetStats(): void {
        this.stats = {
            totalUpdates: 0,
            incrementalUpdates: 0,
            fullRebuild: 0,
            totalSaveTime: 0,
            totalLoadTime: 0,
            bytesWritten: 0,
            bytesRead: 0,
        };
    }
}
