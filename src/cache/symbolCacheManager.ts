import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Worker } from 'worker_threads';
import {
    WorkspaceSymbolCache,
    FileSymbolCache,
    CachedSymbol,
    SymbolLocation,
    FileChangeEvent,
    SymbolMoveDetection,
    CacheBuildProgress,
    WorkerMessage,
    ParseFileRequest,
    ParseFileResult,
} from './symbolCacheTypes';
import { FileHasher } from './fileHasher';
import { SymbolParser } from './symbolParser';

/**
 * 符号缓存管理器
 * 负责符号的持久化存储、增量更新、跨文件移动检测
 */
export class SymbolCacheManager {
    private static readonly CACHE_VERSION = '1.0.0';
    private static readonly CACHE_FILE_NAME = 'symbol-cache.json';
    private static readonly MAX_WORKER_THREADS = 4; // 最大 Worker 线程数

    private cache: WorkspaceSymbolCache | null = null;
    private cacheFilePath: string = '';
    private workspacePath: string = '';
    private context: vscode.ExtensionContext;
    
    // 文件监听器
    private fileWatcher: vscode.FileSystemWatcher | null = null;
    
    // 防抖定时器
    private saveDebounceTimer: NodeJS.Timeout | null = null;
    private readonly SAVE_DEBOUNCE_DELAY = 500; // 500ms 防抖延迟

    // 待处理的文件变更队列
    private pendingChanges: Map<string, FileChangeEvent> = new Map();
    private processingChanges = false;

    // 符号移动检测缓存（符号标识符 -> 符号信息）
    private symbolIdentifierMap: Map<string, CachedSymbol[]> = new Map();

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * 初始化缓存管理器
     */
    async initialize(workspacePath: string): Promise<void> {
        this.workspacePath = workspacePath;
        
        // 生成缓存文件路径
        const workspaceHash = FileHasher.hashWorkspacePath(workspacePath);
        const cacheDir = path.join(this.context.globalStorageUri.fsPath, 'symbol-cache');
        
        // 确保缓存目录存在
        await fs.promises.mkdir(cacheDir, { recursive: true });
        
        this.cacheFilePath = path.join(cacheDir, `${workspaceHash}-${SymbolCacheManager.CACHE_FILE_NAME}`);

        // 加载缓存
        await this.loadCache();

        // 如果缓存不存在或版本不匹配，构建新缓存
        if (!this.cache || this.cache.version !== SymbolCacheManager.CACHE_VERSION) {
            await this.buildCache();
        } else {
            // 验证缓存完整性
            await this.validateCache();
        }

        // 启动文件监听
        this.startFileWatcher();

        console.log(`Symbol cache initialized for workspace: ${workspacePath}`);
    }

    /**
     * 加载缓存
     */
    private async loadCache(): Promise<void> {
        try {
            if (fs.existsSync(this.cacheFilePath)) {
                const content = await fs.promises.readFile(this.cacheFilePath, 'utf-8');
                const data = JSON.parse(content);
                
                // 转换 files 对象为 Map（如果需要）
                this.cache = {
                    ...data,
                    files: data.files || {},
                    symbolIndex: data.symbolIndex || {},
                };

                // 构建符号标识符映射（用于跨文件移动检测）
                this.buildSymbolIdentifierMap();

                console.log(`Loaded cache from ${this.cacheFilePath}`);
                if (this.cache) {
                    console.log(`Cache contains ${Object.keys(this.cache.files).length} files`);
                }
            }
        } catch (error) {
            console.error('Failed to load cache:', error);
            this.cache = null;
        }
    }

    /**
     * 保存缓存（带防抖）
     */
    private async saveCache(): Promise<void> {
        // 清除之前的定时器
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
        }

        // 设置新的定时器
        this.saveDebounceTimer = setTimeout(async () => {
            await this.saveCacheImmediate();
        }, this.SAVE_DEBOUNCE_DELAY);
    }

    /**
     * 立即保存缓存
     */
    private async saveCacheImmediate(): Promise<void> {
        if (!this.cache) {
            return;
        }

        try {
            this.cache.lastUpdated = Date.now();
            const content = JSON.stringify(this.cache, null, 2);
            await fs.promises.writeFile(this.cacheFilePath, content, 'utf-8');
            console.log(`Cache saved to ${this.cacheFilePath}`);
        } catch (error) {
            console.error('Failed to save cache:', error);
        }
    }

    /**
     * 构建缓存（使用多线程）
     */
    private async buildCache(): Promise<void> {
        console.log('Building symbol cache...');

        // 初始化缓存结构
        this.cache = {
            version: SymbolCacheManager.CACHE_VERSION,
            workspacePath: this.workspacePath,
            workspaceHash: FileHasher.hashWorkspacePath(this.workspacePath),
            files: {},
            symbolIndex: {},
            lastUpdated: Date.now(),
        };

        // 查找所有 HLSL 文件
        const files = await this.findAllHLSLFiles();
        console.log(`Found ${files.length} HLSL files`);

        // 使用进度通知
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Building symbol cache',
                cancellable: false,
            },
            async (progress) => {
                // 使用多线程解析文件
                await this.parseFilesWithWorkers(files, progress);
            }
        );

        // 构建符号索引
        this.buildSymbolIndex();

        // 构建符号标识符映射
        this.buildSymbolIdentifierMap();

        // 保存缓存
        await this.saveCacheImmediate();

        console.log('Symbol cache built successfully');
    }

    /**
     * 使用 Worker 线程并行解析文件
     */
    private async parseFilesWithWorkers(
        files: string[],
        progress: vscode.Progress<{ message?: string; increment?: number }>
    ): Promise<void> {
        const workerCount = Math.min(SymbolCacheManager.MAX_WORKER_THREADS, files.length);
        const workers: Worker[] = [];
        const workerPath = path.join(__dirname, 'cache', 'symbolParserWorker.js');

        // 创建 Worker 线程
        for (let i = 0; i < workerCount; i++) {
            try {
                const worker = new Worker(workerPath);
                workers.push(worker);
            } catch (error) {
                console.error('Failed to create worker:', error);
            }
        }

        // 如果无法创建 Worker，回退到单线程
        if (workers.length === 0) {
            console.log('Falling back to single-threaded parsing');
            await this.parseFilesSingleThreaded(files, progress);
            return;
        }

        console.log(`Using ${workers.length} worker threads`);

        let processedFiles = 0;
        const totalFiles = files.length;
        
        // 使用文件队列模式：每个 Worker 独立处理自己队列中的文件
        const fileQueue = [...files]; // 复制文件列表作为队列
        let queueIndex = 0; // 当前队列索引

        // 为每个 Worker 创建处理 Promise
        const workerPromises = workers.map((worker, workerIndex) => {
            return new Promise<void>((resolveWorker) => {
                const processNext = () => {
                    // 从队列获取下一个文件
                    if (queueIndex >= fileQueue.length) {
                        // 队列已空，Worker 完成
                        resolveWorker();
                        return;
                    }
                    
                    const filePath = fileQueue[queueIndex++];
                    
                    // 发送解析请求
                    worker.postMessage({
                        type: 'parse',
                        data: {
                            filePath,
                            workspacePath: this.workspacePath,
                        } as ParseFileRequest,
                    } as WorkerMessage);
                };

                // 监听 Worker 消息
                worker.on('message', (message: WorkerMessage) => {
                    if (message.type === 'result') {
                        const result = message.data as ParseFileResult;
                        this.addFileToCache(result);
                        
                        processedFiles++;
                        progress.report({
                            message: `${processedFiles}/${totalFiles} files`,
                            increment: (1 / totalFiles) * 100,
                        });

                        // 处理下一个文件
                        processNext();
                    } else if (message.type === 'error') {
                        const errorData = message.data as { filePath?: string; error?: string };
                        console.error(`Worker ${workerIndex} error:`, errorData.error);
                        
                        processedFiles++;
                        progress.report({
                            message: `${processedFiles}/${totalFiles} files`,
                            increment: (1 / totalFiles) * 100,
                        });

                        // 继续处理下一个文件
                        processNext();
                    }
                });

                // 启动第一个文件处理
                processNext();
            });
        });

        // 等待所有 Worker 完成
        await Promise.all(workerPromises);

        // 终止所有 Worker
        for (const worker of workers) {
            await worker.terminate();
        }
    }

    /**
     * 单线程解析文件（回退方案）
     */
    private async parseFilesSingleThreaded(
        files: string[],
        progress: vscode.Progress<{ message?: string; increment?: number }>
    ): Promise<void> {
        let processedFiles = 0;
        const totalFiles = files.length;

        for (const filePath of files) {
            try {
                const content = await fs.promises.readFile(filePath, 'utf-8');
                const fileHash = FileHasher.hashString(content);
                const symbols = SymbolParser.parseFile(filePath, content);

                this.addFileToCache({
                    filePath,
                    fileHash,
                    symbols,
                    parseTime: 0,
                });

                processedFiles++;
                progress.report({
                    message: `${processedFiles}/${totalFiles} files`,
                    increment: (1 / totalFiles) * 100,
                });
            } catch (error) {
                console.error(`Failed to parse file ${filePath}:`, error);
            }
        }
    }

    /**
     * 将文件解析结果添加到缓存
     */
    private addFileToCache(result: ParseFileResult): void {
        if (!this.cache) {
            return;
        }

        const relativePath = this.getRelativePath(result.filePath);
        
        // 将每个符号的 filePath 也转换为相对路径
        const symbolsWithRelativePath = result.symbols.map(symbol => ({
            ...symbol,
            filePath: relativePath,  // 使用已计算的相对路径
        }));
        
        this.cache.files[relativePath] = {
            filePath: relativePath,
            fileHash: result.fileHash,
            lastModified: Date.now(),
            fileSize: 0, // 将在后续更新
            symbols: symbolsWithRelativePath,
        };
    }

    /**
     * 查找所有 HLSL 文件
     */
    private async findAllHLSLFiles(): Promise<string[]> {
        const files: string[] = [];
        const extensions = ['.hlsl', '.shader', '.cginc', '.glsl', '.fx', '.fxh', '.usf', '.ush'];

        const uris = await vscode.workspace.findFiles(
            `**/*{${extensions.join(',')}}`,
            '**/node_modules/**'
        );

        for (const uri of uris) {
            files.push(uri.fsPath);
        }

        return files;
    }

    /**
     * 构建符号索引
     */
    private buildSymbolIndex(): void {
        if (!this.cache) {
            return;
        }

        this.cache.symbolIndex = {};

        for (const [filePath, fileCache] of Object.entries(this.cache.files)) {
            fileCache.symbols.forEach((symbol, index) => {
                if (!this.cache!.symbolIndex[symbol.name]) {
                    this.cache!.symbolIndex[symbol.name] = [];
                }

                this.cache!.symbolIndex[symbol.name].push({
                    filePath,
                    symbolIndex: index,
                    signature: symbol.signature,
                });
            });
        }
    }

    /**
     * 构建符号标识符映射（用于跨文件移动检测）
     */
    private buildSymbolIdentifierMap(): void {
        if (!this.cache) {
            return;
        }

        this.symbolIdentifierMap.clear();

        for (const fileCache of Object.values(this.cache.files)) {
            for (const symbol of fileCache.symbols) {
                const identifier = SymbolParser.getSymbolIdentifier(symbol);
                
                if (!this.symbolIdentifierMap.has(identifier)) {
                    this.symbolIdentifierMap.set(identifier, []);
                }

                this.symbolIdentifierMap.get(identifier)!.push(symbol);
            }
        }
    }

    /**
     * 启动文件监听
     */
    private startFileWatcher(): void {
        const extensions = ['.hlsl', '.shader', '.cginc', '.glsl', '.fx', '.fxh', '.usf', '.ush'];
        const pattern = `**/*{${extensions.join(',')}}`;

        this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

        // 文件创建
        this.fileWatcher.onDidCreate((uri) => {
            this.queueFileChange(uri.fsPath, 'created');
        });

        // 文件修改
        this.fileWatcher.onDidChange((uri) => {
            this.queueFileChange(uri.fsPath, 'modified');
        });

        // 文件删除
        this.fileWatcher.onDidDelete((uri) => {
            this.queueFileChange(uri.fsPath, 'deleted');
        });
    }

    /**
     * 将文件变更加入队列
     */
    private queueFileChange(filePath: string, type: 'created' | 'modified' | 'deleted'): void {
        const relativePath = this.getRelativePath(filePath);
        
        this.pendingChanges.set(relativePath, {
            filePath: relativePath,
            type,
            timestamp: Date.now(),
        });

        // 延迟处理变更（防抖）
        setTimeout(() => {
            this.processFileChanges();
        }, this.SAVE_DEBOUNCE_DELAY);
    }

    /**
     * 处理文件变更
     */
    private async processFileChanges(): Promise<void> {
        if (this.processingChanges || this.pendingChanges.size === 0) {
            return;
        }

        this.processingChanges = true;

        try {
            const changes = Array.from(this.pendingChanges.values());
            this.pendingChanges.clear();

            for (const change of changes) {
                await this.handleFileChange(change);
            }

            // 重建符号索引
            this.buildSymbolIndex();
            this.buildSymbolIdentifierMap();

            // 保存缓存
            await this.saveCache();
        } finally {
            this.processingChanges = false;
        }
    }

    /**
     * 处理单个文件变更
     */
    private async handleFileChange(change: FileChangeEvent): Promise<void> {
        if (!this.cache) {
            return;
        }

        console.log(`Processing file change: ${change.type} - ${change.filePath}`);

        switch (change.type) {
            case 'created':
            case 'modified':
                await this.updateFileCache(change.filePath);
                break;
            case 'deleted':
                await this.removeFileCache(change.filePath);
                break;
        }
    }

    /**
     * 更新文件缓存（检测跨文件移动）
     */
    private async updateFileCache(relativePath: string): Promise<void> {
        if (!this.cache) {
            return;
        }

        try {
            const absolutePath = this.getAbsolutePath(relativePath);
            const content = await fs.promises.readFile(absolutePath, 'utf-8');
            const fileHash = FileHasher.hashString(content);

            // 检查文件是否真的被修改
            const existingCache = this.cache.files[relativePath];
            if (existingCache && existingCache.fileHash === fileHash) {
                console.log(`File ${relativePath} not modified (hash unchanged)`);
                return;
            }

            // 解析新的符号
            const newSymbols = SymbolParser.parseFile(relativePath, content);

            // 检测跨文件移动
            if (existingCache) {
                await this.detectSymbolMoves(existingCache.symbols, newSymbols, relativePath);
            }

            // 更新缓存
            const stats = await fs.promises.stat(absolutePath);
            this.cache.files[relativePath] = {
                filePath: relativePath,
                fileHash,
                lastModified: stats.mtimeMs,
                fileSize: stats.size,
                symbols: newSymbols,
            };

            console.log(`Updated cache for ${relativePath}, found ${newSymbols.length} symbols`);
        } catch (error) {
            console.error(`Failed to update file cache for ${relativePath}:`, error);
        }
    }

    /**
     * 检测符号跨文件移动
     */
    private async detectSymbolMoves(
        oldSymbols: CachedSymbol[],
        newSymbols: CachedSymbol[],
        currentFilePath: string
    ): Promise<void> {
        // 构建新符号的标识符集合
        const newSymbolIds = new Set(newSymbols.map(s => SymbolParser.getSymbolIdentifier(s)));

        // 查找消失的符号
        for (const oldSymbol of oldSymbols) {
            const identifier = SymbolParser.getSymbolIdentifier(oldSymbol);
            
            // 如果符号在新文件中不存在，检查是否移动到其他文件
            if (!newSymbolIds.has(identifier)) {
                const movedTo = this.findSymbolInOtherFiles(oldSymbol, currentFilePath);
                
                if (movedTo) {
                    console.log(
                        `Detected symbol move: ${oldSymbol.name} from ${currentFilePath} to ${movedTo.filePath}`
                    );
                    
                    // 这里可以触发事件或通知，用于更新引用等
                    // 目前只是记录日志
                }
            }
        }
    }

    /**
     * 在其他文件中查找符号
     */
    private findSymbolInOtherFiles(symbol: CachedSymbol, excludeFilePath: string): CachedSymbol | null {
        const identifier = SymbolParser.getSymbolIdentifier(symbol);
        const candidates = this.symbolIdentifierMap.get(identifier);

        if (!candidates) {
            return null;
        }

        // 查找不在当前文件中的符号
        for (const candidate of candidates) {
            if (candidate.filePath !== excludeFilePath &&
                SymbolParser.areSymbolsEqual(symbol, candidate)) {
                return candidate;
            }
        }

        return null;
    }

    /**
     * 移除文件缓存
     */
    private async removeFileCache(relativePath: string): Promise<void> {
        if (!this.cache) {
            return;
        }

        delete this.cache.files[relativePath];
        console.log(`Removed cache for ${relativePath}`);
    }

    /**
     * 验证缓存完整性
     */
    private async validateCache(): Promise<void> {
        if (!this.cache) {
            return;
        }

        console.log('Validating cache...');

        const invalidFiles: string[] = [];

        for (const [filePath, fileCache] of Object.entries(this.cache.files)) {
            try {
                const absolutePath = this.getAbsolutePath(filePath);
                
                // 检查文件是否存在
                if (!fs.existsSync(absolutePath)) {
                    invalidFiles.push(filePath);
                    continue;
                }

                // 快速检查文件是否被修改
                const stats = await fs.promises.stat(absolutePath);
                if (stats.size !== fileCache.fileSize || stats.mtimeMs !== fileCache.lastModified) {
                    // 文件可能被修改，重新解析
                    await this.updateFileCache(filePath);
                }
            } catch (error) {
                console.error(`Failed to validate ${filePath}:`, error);
                invalidFiles.push(filePath);
            }
        }

        // 移除无效文件
        for (const filePath of invalidFiles) {
            delete this.cache.files[filePath];
        }

        if (invalidFiles.length > 0) {
            console.log(`Removed ${invalidFiles.length} invalid files from cache`);
            await this.saveCache();
        }

        console.log('Cache validation completed');
    }

    /**
     * 查找符号定义
     */
    findSymbol(symbolName: string): CachedSymbol[] {
        if (!this.cache) {
            return [];
        }

        const locations = this.cache.symbolIndex[symbolName];
        if (!locations) {
            return [];
        }

        const symbols: CachedSymbol[] = [];

        for (const location of locations) {
            const fileCache = this.cache.files[location.filePath];
            if (fileCache && fileCache.symbols[location.symbolIndex]) {
                symbols.push(fileCache.symbols[location.symbolIndex]);
            }
        }

        return symbols;
    }

    /**
     * 存储符号到缓存（用于 ripgrep 搜索结果）
     * @param symbol 要存储的符号
     */
    storeSymbol(symbol: CachedSymbol): void {
        if (!this.cache) {
            return;
        }

        // 确保路径是相对路径（如果传入绝对路径则转换）
        const relativePath = this.ensureRelativePath(symbol.filePath);
        
        // 确保文件缓存存在
        if (!this.cache.files[relativePath]) {
            this.cache.files[relativePath] = {
                filePath: relativePath,
                fileHash: '',
                lastModified: Date.now(),
                fileSize: 0,
                symbols: [],
            };
        }

        const fileCache = this.cache.files[relativePath];
        
        // 检查符号是否已存在（避免重复）
        const existingIndex = fileCache.symbols.findIndex(
            s => s.name === symbol.name && s.line === symbol.line && s.column === symbol.column
        );

        if (existingIndex === -1) {
            // 添加新符号，确保符号的 filePath 也是相对路径
            const symbolToStore = { ...symbol, filePath: relativePath };
            const newIndex = fileCache.symbols.length;
            fileCache.symbols.push(symbolToStore);

            // 更新符号索引
            if (!this.cache.symbolIndex[symbol.name]) {
                this.cache.symbolIndex[symbol.name] = [];
            }

            this.cache.symbolIndex[symbol.name].push({
                filePath: relativePath,
                symbolIndex: newIndex,
                signature: symbol.signature,
            });

            console.log(`[PersistentCache] Stored symbol: ${symbol.name} at ${relativePath}:${symbol.line + 1}`);
            
            // 保存缓存（带防抖）
            this.saveCache();
        }
    }

    /**
     * 批量存储符号到缓存
     * @param symbols 要存储的符号数组
     */
    storeSymbols(symbols: CachedSymbol[]): void {
        for (const symbol of symbols) {
            this.storeSymbol(symbol);
        }
    }

    /**
     * 获取文件的所有符号
     */
    getFileSymbols(filePath: string): CachedSymbol[] {
        if (!this.cache) {
            return [];
        }

        const relativePath = this.getRelativePath(filePath);
        const fileCache = this.cache.files[relativePath];

        return fileCache ? fileCache.symbols : [];
    }

    /**
     * 获取相对路径
     */
    private getRelativePath(absolutePath: string): string {
        return path.relative(this.workspacePath, absolutePath).replace(/\\/g, '/');
    }

    /**
     * 获取绝对路径
     */
    private getAbsolutePath(relativePath: string): string {
        return path.join(this.workspacePath, relativePath);
    }

    /**
     * 确保路径是相对路径
     * 如果传入绝对路径则转换为相对路径，如果已经是相对路径则直接返回
     */
    private ensureRelativePath(filePath: string): string {
        // 判断是否是绝对路径
        if (path.isAbsolute(filePath)) {
            return this.getRelativePath(filePath);
        }
        // 已经是相对路径，标准化分隔符
        return filePath.replace(/\\/g, '/');
    }

    /**
     * 清除缓存文件
     */
    async clearCache(): Promise<void> {
        try {
            // 删除缓存文件
            if (fs.existsSync(this.cacheFilePath)) {
                await fs.promises.unlink(this.cacheFilePath);
                console.log(`Cache file deleted: ${this.cacheFilePath}`);
            }

            // 清空内存中的缓存
            this.cache = null;
            this.symbolIdentifierMap.clear();
            this.pendingChanges.clear();

            console.log('Symbol cache cleared successfully');
        } catch (error) {
            console.error('Failed to clear cache:', error);
            throw error;
        }
    }

    /**
     * 重建缓存（清除后重新构建）
     */
    async rebuildCache(): Promise<void> {
        await this.clearCache();
        await this.buildCache();
    }

    /**
     * 清理资源
     */
    dispose(): void {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }

        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
        }

        // 立即保存缓存
        if (this.cache) {
            this.saveCacheImmediate();
        }
    }
}
