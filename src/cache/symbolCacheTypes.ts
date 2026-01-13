/**
 * 简单的位置范围接口（替代 vscode.Range）
 */
export interface SimpleRange {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}

/**
 * 符号类型枚举
 */
export enum CachedSymbolKind {
    Function = 'function',
    Macro = 'macro',
    Struct = 'struct',
    Variable = 'variable',
    Constant = 'constant',
    Typedef = 'typedef',
    Class = 'class',
    Interface = 'interface',
    Shader = 'shader',  // Unity Shader 定义
}

/**
 * 缓存的符号信息
 */
export interface CachedSymbol {
    /** 符号名称 */
    name: string;
    
    /** 符号类型 */
    kind: CachedSymbolKind;
    
    /** 文件路径（相对于工作区） */
    filePath: string;
    
    /** 起始行号（0-based） */
    line: number;
    
    /** 起始列号（0-based） */
    column: number;
    
    /** 结束行号（0-based） */
    endLine: number;
    
    /** 结束列号（0-based） */
    endColumn: number;
    
    /** 函数签名或宏定义（用于跨文件移动检测） */
    signature?: string;
    
    /** 符号内容的哈希值（用于检测符号是否被修改） */
    contentHash?: string;
    
    /** 符号所在的作用域（如命名空间、类名等） */
    scope?: string;
    
    /** 符号的完整定义文本（可选，用于精确匹配） */
    definitionText?: string;
}

/**
 * 文件符号缓存
 */
export interface FileSymbolCache {
    /** 文件路径（相对于工作区） */
    filePath: string;
    
    /** 文件内容的哈希值 */
    fileHash: string;
    
    /** 最后修改时间戳 */
    lastModified: number;
    
    /** 文件大小（字节） */
    fileSize: number;
    
    /** 该文件的所有符号 */
    symbols: CachedSymbol[];
}

/**
 * 工作区符号缓存
 */
export interface WorkspaceSymbolCache {
    /** 缓存版本号 */
    version: string;
    
    /** 工作区路径 */
    workspacePath: string;
    
    /** 工作区路径的哈希值（用于标识缓存文件） */
    workspaceHash: string;
    
    /** 文件路径 -> 符号缓存的映射 */
    files: { [filePath: string]: FileSymbolCache };
    
    /** 符号名称 -> 符号位置列表的索引（加速查找） */
    symbolIndex: { [symbolName: string]: SymbolLocation[] };
    
    /** 最后更新时间戳 */
    lastUpdated: number;
}

/**
 * 符号位置信息（用于索引）
 */
export interface SymbolLocation {
    /** 文件路径 */
    filePath: string;
    
    /** 符号在文件中的索引位置 */
    symbolIndex: number;
    
    /** 符号签名（用于跨文件移动检测） */
    signature?: string;
}

/**
 * 文件变更事件
 */
export interface FileChangeEvent {
    /** 文件路径 */
    filePath: string;
    
    /** 变更类型 */
    type: 'created' | 'modified' | 'deleted';
    
    /** 变更时间戳 */
    timestamp: number;
}

/**
 * 符号移动检测结果
 */
export interface SymbolMoveDetection {
    /** 符号名称 */
    symbolName: string;
    
    /** 符号签名 */
    signature: string;
    
    /** 原文件路径 */
    oldFilePath: string;
    
    /** 新文件路径 */
    newFilePath: string;
    
    /** 原位置 */
    oldLocation: SimpleRange;
    
    /** 新位置 */
    newLocation: SimpleRange;
}

/**
 * 缓存构建进度
 */
export interface CacheBuildProgress {
    /** 总文件数 */
    totalFiles: number;
    
    /** 已处理文件数 */
    processedFiles: number;
    
    /** 当前处理的文件 */
    currentFile: string;
    
    /** 已发现的符号数 */
    symbolCount: number;
    
    /** 是否完成 */
    completed: boolean;
    
    /** 错误信息 */
    errors?: string[];
}

/**
 * Worker 线程消息类型
 */
export interface WorkerMessage {
    type: 'parse' | 'result' | 'error' | 'progress';
    data?: any;
}

/**
 * 文件解析请求
 */
export interface ParseFileRequest {
    filePath: string;
    content: string;
    workspacePath: string;
}

/**
 * 文件解析结果
 */
export interface ParseFileResult {
    filePath: string;
    fileHash: string;
    symbols: CachedSymbol[];
    parseTime: number;
}

/**
 * 优化的符号索引条目（直接存储符号引用，避免二次查找）
 */
export interface OptimizedSymbolIndexEntry {
    /** 符号引用（直接指向符号对象） */
    symbol: CachedSymbol;
    
    /** 文件路径（用于快速定位） */
    filePath: string;
    
    /** 符号签名（用于精确匹配） */
    signature?: string;
}

/**
 * 优化的工作区符号缓存（运行时使用）
 * 使用 Map 数据结构提升查找性能
 */
export interface OptimizedWorkspaceCache {
    /** 缓存版本号 */
    version: string;
    
    /** 工作区路径 */
    workspacePath: string;
    
    /** 工作区路径的哈希值 */
    workspaceHash: string;
    
    /** 文件路径 -> 符号缓存的映射（使用 Map） */
    files: Map<string, FileSymbolCache>;
    
    /** 符号名称 -> 符号列表的索引（使用 Map，直接存储符号引用） */
    symbolIndex: Map<string, OptimizedSymbolIndexEntry[]>;
    
    /** 符号标识符 -> 符号列表的映射（用于跨文件移动检测） */
    symbolIdentifierMap: Map<string, CachedSymbol[]>;
    
    /** 最后更新时间戳 */
    lastUpdated: number;
}

/**
 * 符号查找选项
 */
export interface SymbolSearchOptions {
    /** 是否精确匹配（默认 true） */
    exactMatch?: boolean;
    
    /** 是否区分大小写（默认 true） */
    caseSensitive?: boolean;
    
    /** 限制返回结果数量 */
    limit?: number;
    
    /** 过滤符号类型 */
    kindFilter?: CachedSymbolKind[];
    
    /** 过滤文件路径（支持通配符） */
    filePathFilter?: string;
}

/**
 * 符号查找结果（带性能统计）
 */
export interface SymbolSearchResult {
    /** 找到的符号列表 */
    symbols: CachedSymbol[];
    
    /** 查找耗时（毫秒） */
    searchTime: number;
    
    /** 是否使用了缓存 */
    fromCache: boolean;
    
    /** 匹配的文件数量 */
    fileCount: number;
}
