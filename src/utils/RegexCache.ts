/**
 * 正则表达式缓存工具
 * 避免重复编译正则表达式，提升性能
 */
export class RegexCache {
    private static cache: Map<string, RegExp> = new Map();
    private static stats = {
        hits: 0,
        misses: 0,
        totalCreated: 0,
    };

    /**
     * 获取或创建正则表达式
     * @param pattern 正则表达式模式
     * @param flags 正则表达式标志（g, i, m, u, y）
     * @returns 缓存的或新创建的正则表达式对象
     */
    static get(pattern: string, flags?: string): RegExp {
        const key = `${pattern}::${flags || ''}`;
        
        let regex = this.cache.get(key);
        if (regex) {
            this.stats.hits++;
            // 重置 lastIndex 以确保正则表达式可以重复使用
            regex.lastIndex = 0;
            return regex;
        }

        // 缓存未命中，创建新的正则表达式
        this.stats.misses++;
        this.stats.totalCreated++;
        regex = new RegExp(pattern, flags);
        this.cache.set(key, regex);
        
        return regex;
    }

    /**
     * 预编译常用的正则表达式
     */
    static precompile(patterns: Array<{ pattern: string; flags?: string }>): void {
        for (const { pattern, flags } of patterns) {
            this.get(pattern, flags);
        }
    }

    /**
     * 清除缓存
     */
    static clear(): void {
        this.cache.clear();
        this.stats = {
            hits: 0,
            misses: 0,
            totalCreated: 0,
        };
    }

    /**
     * 获取缓存统计信息
     */
    static getStats() {
        return {
            ...this.stats,
            cacheSize: this.cache.size,
            hitRate: this.stats.hits + this.stats.misses > 0
                ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) + '%'
                : '0%',
        };
    }

    /**
     * 获取缓存大小
     */
    static size(): number {
        return this.cache.size;
    }
}

/**
 * 跨平台路径工具
 * 处理 Windows 和 macOS/Linux 之间的路径差异
 */
export class PathUtils {
    /**
     * 标准化路径分隔符为正斜杠（跨平台）
     * Windows: C:\Users\... -> C:/Users/...
     * macOS/Linux: /Users/... -> /Users/...
     */
    static normalize(filePath: string): string {
        return filePath.replace(/\\/g, '/');
    }

    /**
     * 转换为平台特定的路径分隔符
     * 用于文件系统操作
     */
    static toPlatform(filePath: string): string {
        if (process.platform === 'win32') {
            return filePath.replace(/\//g, '\\');
        }
        return filePath;
    }

    /**
     * 比较两个路径是否相等（忽略分隔符差异）
     */
    static equals(path1: string, path2: string): boolean {
        return this.normalize(path1).toLowerCase() === this.normalize(path2).toLowerCase();
    }

    /**
     * 检查路径是否为绝对路径（跨平台）
     */
    static isAbsolute(filePath: string): boolean {
        // Windows: C:\ 或 \\
        if (process.platform === 'win32') {
            return /^[a-zA-Z]:[\\\/]/.test(filePath) || /^\\\\/.test(filePath);
        }
        // macOS/Linux: /
        return filePath.startsWith('/');
    }

    /**
     * 转义正则表达式特殊字符
     */
    static escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * 为 Shell 命令转义字符串（跨平台）
     */
    static escapeForShell(str: string): string {
        if (process.platform === 'win32') {
            // Windows: 转义双引号和特殊字符
            return str
                .replace(/"/g, '\\"')
                .replace(/\$/g, '\\$')
                .replace(/`/g, '\\`')
                .replace(/!/g, '\\!');
        } else {
            // macOS/Linux: 转义单引号
            return str.replace(/'/g, "'\\''");
        }
    }

    /**
     * 构建跨平台的正则表达式模式（用于 ripgrep 等工具）
     */
    static buildRegexPattern(pattern: string, escapedName: string): { pattern: string; command: string } {
        const isWindows = process.platform === 'win32';
        
        if (isWindows) {
            // Windows: 使用双引号包裹，内部双引号转义
            const finalPattern = pattern.replace(/ESCAPED_NAME/g, escapedName);
            return {
                pattern: finalPattern,
                command: `"${finalPattern}"`,
            };
        } else {
            // macOS/Linux: 使用单引号包裹
            const finalPattern = pattern.replace(/ESCAPED_NAME/g, escapedName);
            return {
                pattern: finalPattern,
                command: `'${finalPattern}'`,
            };
        }
    }
}

/**
 * 字符串构建器
 * 优化字符串拼接性能
 */
export class StringBuilder {
    private parts: string[] = [];

    /**
     * 添加字符串
     */
    append(str: string): this {
        this.parts.push(str);
        return this;
    }

    /**
     * 添加字符串并换行
     */
    appendLine(str: string = ''): this {
        this.parts.push(str);
        this.parts.push('\n');
        return this;
    }

    /**
     * 添加多个字符串
     */
    appendAll(strings: string[]): this {
        this.parts.push(...strings);
        return this;
    }

    /**
     * 构建最终字符串
     */
    toString(separator: string = ''): string {
        return this.parts.join(separator);
    }

    /**
     * 清空构建器
     */
    clear(): void {
        this.parts = [];
    }

    /**
     * 获取当前长度
     */
    length(): number {
        return this.parts.reduce((sum, part) => sum + part.length, 0);
    }
}
