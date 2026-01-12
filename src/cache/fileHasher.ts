import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 文件哈希计算工具
 */
export class FileHasher {
    /**
     * 计算字符串的 MD5 哈希
     */
    static hashString(content: string): string {
        return crypto.createHash('md5').update(content, 'utf8').digest('hex');
    }

    /**
     * 计算文件的 MD5 哈希
     */
    static async hashFile(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('md5');
            const stream = fs.createReadStream(filePath);

            stream.on('data', (data) => {
                hash.update(data);
            });

            stream.on('end', () => {
                resolve(hash.digest('hex'));
            });

            stream.on('error', (err) => {
                reject(err);
            });
        });
    }

    /**
     * 同步计算文件的 MD5 哈希
     */
    static hashFileSync(filePath: string): string {
        const content = fs.readFileSync(filePath);
        return crypto.createHash('md5').update(content).digest('hex');
    }

    /**
     * 计算工作区路径的哈希（用于生成缓存文件名）
     */
    static hashWorkspacePath(workspacePath: string): string {
        // 规范化路径并计算哈希
        const normalizedPath = path.normalize(workspacePath).toLowerCase();
        return this.hashString(normalizedPath).substring(0, 16);
    }

    /**
     * 计算符号签名的哈希
     */
    static hashSignature(signature: string): string {
        return this.hashString(signature).substring(0, 8);
    }

    /**
     * 批量计算文件哈希
     */
    static async hashFiles(filePaths: string[]): Promise<Map<string, string>> {
        const results = new Map<string, string>();
        
        await Promise.all(
            filePaths.map(async (filePath) => {
                try {
                    const hash = await this.hashFile(filePath);
                    results.set(filePath, hash);
                } catch (error) {
                    console.error(`Failed to hash file ${filePath}:`, error);
                }
            })
        );

        return results;
    }

    /**
     * 检查文件是否被修改（通过哈希对比）
     */
    static async isFileModified(filePath: string, cachedHash: string): Promise<boolean> {
        try {
            const currentHash = await this.hashFile(filePath);
            return currentHash !== cachedHash;
        } catch (error) {
            // 文件不存在或无法读取，视为已修改
            return true;
        }
    }

    /**
     * 快速检查文件是否可能被修改（通过文件大小和修改时间）
     */
    static async quickCheckModified(
        filePath: string,
        cachedSize: number,
        cachedMtime: number
    ): Promise<boolean> {
        try {
            const stats = await fs.promises.stat(filePath);
            // 如果大小或修改时间不同，则文件可能被修改
            return stats.size !== cachedSize || stats.mtimeMs !== cachedMtime;
        } catch (error) {
            return true;
        }
    }
}
