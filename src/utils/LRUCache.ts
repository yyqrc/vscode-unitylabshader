/**
 * LRU (Least Recently Used) 缓存实现
 * 支持最大容量限制和过期时间
 */
export class LRUCache<K, V> {
    private cache: Map<K, { value: V; timestamp: number }>;
    private readonly maxSize: number;
    private readonly ttl: number; // Time to live in milliseconds

    /**
     * @param maxSize 最大缓存条目数
     * @param ttl 缓存有效期（毫秒），默认30秒
     */
    constructor(maxSize: number = 50, ttl: number = 30000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl;
    }

    /**
     * 获取缓存值
     * @param key 缓存键
     * @returns 缓存值，如果不存在或已过期则返回 undefined
     */
    get(key: K): V | undefined {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return undefined;
        }

        // 检查是否过期
        const age = Date.now() - entry.timestamp;
        if (age > this.ttl) {
            this.cache.delete(key);
            return undefined;
        }

        // LRU: 将访问的项移到最后（最近使用）
        this.cache.delete(key);
        this.cache.set(key, entry);

        return entry.value;
    }

    /**
     * 设置缓存值
     * @param key 缓存键
     * @param value 缓存值
     */
    set(key: K, value: V): void {
        // 如果已存在，先删除（为了更新顺序）
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }

        // 如果达到最大容量，删除最旧的项（第一个）
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }

        // 添加新项
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    /**
     * 检查缓存中是否存在某个键
     * @param key 缓存键
     * @returns 是否存在且未过期
     */
    has(key: K): boolean {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return false;
        }

        // 检查是否过期
        const age = Date.now() - entry.timestamp;
        if (age > this.ttl) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * 删除缓存项
     * @param key 缓存键
     */
    delete(key: K): boolean {
        return this.cache.delete(key);
    }

    /**
     * 清空所有缓存
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * 清理过期的缓存项
     * @returns 清理的项数
     */
    cleanup(): number {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, entry] of this.cache.entries()) {
            const age = now - entry.timestamp;
            if (age > this.ttl) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }

        return cleanedCount;
    }

    /**
     * 获取当前缓存大小
     */
    get size(): number {
        return this.cache.size;
    }

    /**
     * 获取所有缓存键
     */
    keys(): IterableIterator<K> {
        return this.cache.keys();
    }

    /**
     * 使匹配条件的缓存项失效
     * @param predicate 判断函数
     * @returns 失效的项数
     */
    invalidateWhere(predicate: (key: K, value: V) => boolean): number {
        let invalidatedCount = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (predicate(key, entry.value)) {
                this.cache.delete(key);
                invalidatedCount++;
            }
        }

        return invalidatedCount;
    }
}
