/**
 * 通用工具函数模块
 * 提取重复的解析逻辑、符号查找逻辑等
 */

import * as vscode from 'vscode';
import { execSync } from 'child_process';
import { join } from 'path';
import { PathUtils } from './RegexCache';
import { WorkspaceIgnore } from './WorkspaceIgnore';

/**
 * Ripgrep 搜索选项
 */
export interface RipgrepSearchOptions {
    /** 搜索模式 */
    pattern: string;
    /** 根路径 */
    rootPath: string;
    /** 文件扩展名过滤 */
    extensions?: string[];
    /** 是否使用正则表达式 */
    useRegex?: boolean;
    /** 最大缓冲区大小 */
    maxBuffer?: number;
    /** 额外的ripgrep参数 */
    extraArgs?: string[];
}

/**
 * Ripgrep 搜索结果
 */
export interface RipgrepMatch {
    /** 文件路径 */
    filePath: string;
    /** 行号（从0开始） */
    line: number;
    /** 列号（从0开始） */
    column: number;
    /** 匹配的文本 */
    text: string;
    /** 匹配的单词 */
    word?: string;
}

/**
 * Ripgrep 工具类
 * 统一的ripgrep搜索接口，避免重复代码
 */
export class RipgrepUtils {
    private static rgPath: string | null = null;

    /**
     * 设置ripgrep路径
     */
    static setRgPath(path: string): void {
        this.rgPath = path;
    }

    /**
     * 获取ripgrep路径
     */
    static getRgPath(): string {
        if (!this.rgPath) {
            throw new Error('Ripgrep path not set. Call setRgPath() first.');
        }
        return this.rgPath;
    }

    /**
     * 执行ripgrep搜索
     */
    static search(options: RipgrepSearchOptions): RipgrepMatch[] {
        const results: RipgrepMatch[] = [];

        try {
            // 构建ripgrep命令
            const rgPath = this.getRgPath();
            const args: string[] = [];

            // 添加扩展名过滤
            if (options.extensions && options.extensions.length > 0) {
                for (const ext of options.extensions) {
                    args.push(`-g *${ext}`);
                }
            }

            // 添加额外参数（默认参数）
            args.push('--case-sensitive', '-H', '--line-number', '--column', '--hidden');
            
            // 添加额外参数
            if (options.extraArgs) {
                args.push(...options.extraArgs);
            }

            // 添加搜索模式
            args.push('-e', `"${options.pattern}"`);
            args.push('.');

            // 构建完整命令
            const fullCommand = `"${rgPath}" ${args.join(' ')}`;

            // 执行搜索
            const output = execSync(fullCommand, {
                cwd: options.rootPath,
                maxBuffer: options.maxBuffer || 1024 * 1024,
                encoding: 'utf-8',
            });

            // 解析输出
            const lines = output.split('\n').filter(line => line.trim());
            for (const line of lines) {
                const match = this.parseRipgrepLine(line, options.rootPath);
                if (match && !WorkspaceIgnore.isIgnored(options.rootPath, match.filePath)) {
                    results.push(match);
                }
            }
        } catch (error: any) {
            // ripgrep返回非0退出码时会抛出异常，但可能仍有部分结果
            if (error.stdout) {
                const lines = error.stdout.toString().split('\n').filter((l: string) => l.trim());
                for (const line of lines) {
                    const match = this.parseRipgrepLine(line, options.rootPath);
                    if (match && !WorkspaceIgnore.isIgnored(options.rootPath, match.filePath)) {
                        results.push(match);
                    }
                }
            }
        }

        return results;
    }

    /**
     * 解析ripgrep输出行
     */
    private static parseRipgrepLine(line: string, rootPath: string): RipgrepMatch | null {
        // 格式: file:line:column:text
        const lineMatch = /^(?:((?:[a-zA-Z]:)?[^:]*):)?(\d+):(\d+):(.+)/.exec(line);
        if (!lineMatch) {
            return null;
        }

        const filePath = join(rootPath, lineMatch[1]);
        const lineNum = parseInt(lineMatch[2]) - 1; // 转换为0-based
        const column = parseInt(lineMatch[3]) - 1;
        const text = lineMatch[4];

        return {
            filePath,
            line: lineNum,
            column,
            text,
        };
    }

    /**
     * 搜索函数定义
     */
    static searchFunctionDefinitions(name: string, rootPath: string, extensions: string[]): RipgrepMatch[] {
        // 使用与definitionProvider相同的模式
        const pattern = `^[a-zA-Z_][a-zA-Z0-9_<>,\\s]*\\s+${name}\\s*\\(`;
        return this.search({
            pattern,
            rootPath,
            extensions,
            useRegex: true,
        });
    }

    /**
     * 搜索宏定义
     */
    static searchMacroDefinitions(name: string, rootPath: string, extensions: string[]): RipgrepMatch[] {
        // 使用与definitionProvider相同的模式
        const pattern = `^\\s*#define\\s+${name}\\b`;
        return this.search({
            pattern,
            rootPath,
            extensions,
            useRegex: true,
        });
    }

    /**
     * 搜索结构体定义
     */
    static searchStructDefinitions(name: string, rootPath: string, extensions: string[]): RipgrepMatch[] {
        // 使用与definitionProvider相同的模式
        const pattern = `^(?:struct|cbuffer|tbuffer)\\s+${name}\\b`;
        return this.search({
            pattern,
            rootPath,
            extensions,
            useRegex: true,
        });
    }

    /**
     * 搜索符号引用（通用方法）
     * @param pattern 搜索模式
     * @param rootPath 根路径
     * @param extensions 文件扩展名
     */
    static searchReferences(pattern: string, rootPath: string, extensions: string[]): RipgrepMatch[] {
        return this.search({
            pattern,
            rootPath,
            extensions,
            useRegex: true,
        });
    }

    /**
     * 带重试和fallback的搜索方法（用于symbolProvider）
     * @param options 搜索选项
     * @param maxRetries 最大重试次数
     * @param fallbackPattern 失败时的fallback模式（可选）
     */
    static searchWithRetry(
        options: RipgrepSearchOptions,
        maxRetries: number = 2,
        fallbackPattern?: string
    ): RipgrepMatch[] {
        let retryCount = 0;
        let lastError: any = null;

        // 尝试正常搜索（带重试）
        while (retryCount <= maxRetries) {
            try {
                return this.search(options);
            } catch (error: any) {
                lastError = error;
                retryCount++;
                
                // 如果还有重试机会，继续
                if (retryCount <= maxRetries) {
                    continue;
                }
            }
        }

        // 如果提供了fallback模式，尝试使用fallback
        if (fallbackPattern) {
            try {
                return this.search({
                    ...options,
                    pattern: fallbackPattern,
                });
            } catch (fallbackError: any) {
                // fallback也失败了，返回空数组
                return [];
            }
        }

        // 没有fallback或fallback失败，返回空数组
        return [];
    }

    /**
     * 转义正则表达式特殊字符（用于shell命令）
     * @param pattern 需要转义的模式
     */
    static escapeRegExpForShell(pattern: string): string {
        // 首先处理最敏感的字符 - 双引号
        let escaped = pattern.replace(/"/g, '\\"');
        
        // 处理美元符号
        escaped = escaped.replace(/\$/g, '\\$');
        
        // 处理反引号
        escaped = escaped.replace(/`/g, '\\`');
        
        // 处理感叹号（在某些 shell 中有特殊含义）
        escaped = escaped.replace(/!/g, '\\!');
        
        return escaped;
    }

    /**
     * 创建fallback模式（移除所有正则特殊字符）
     * @param pattern 原始模式
     */
    static createFallbackPattern(pattern: string): string {
        return pattern
            .replace(/\^/g, '')
            .replace(/\$/g, '')
            .replace(/\+/g, '')
            .replace(/\*/g, '')
            .replace(/\?/g, '')
            .replace(/\{/g, '')
            .replace(/\}/g, '')
            .replace(/\[/g, '')
            .replace(/\]/g, '')
            .replace(/\(/g, '')
            .replace(/\)/g, '')
            .replace(/\|/g, '')
            .replace(/\\/g, '');
    }

    /**
     * 搜索文件（使用--files模式）
     * @param pattern 文件名模式（支持glob）
     * @param rootPath 根路径
     */
    static searchFiles(pattern: string, rootPath: string): string[] {
        if (!this.rgPath) {
            throw new Error('RipgrepUtils not initialized. Call RipgrepUtils.initialize() first.');
        }

        const command = `"${this.rgPath}" --files --hidden -g "${pattern}" .`;
        
        try {
            const output = execSync(command, {
                cwd: rootPath,
                maxBuffer: 1024 * 1024,
                encoding: 'utf8'
            });
            
            return output.toString()
                .split('\n')
                .filter(f => f.trim())
                .filter(f => !WorkspaceIgnore.isIgnored(rootPath, f));
        } catch (error: any) {
            // 没有找到文件时返回空数组
            if (error.status === 1) {
                return [];
            }
            throw error;
        }
    }

    /**
     * 搜索Shader定义（跨平台兼容）
     * @param shaderName Shader名称
     * @param rootPath 根路径
     * @param extensions 文件扩展名
     */
    static searchShaderDefinition(shaderName: string, rootPath: string, extensions: string[]): RipgrepMatch[] {
        if (!this.rgPath) {
            throw new Error('RipgrepUtils not initialized. Call RipgrepUtils.initialize() first.');
        }

        // 转义Shader名称中的特殊字符
        const escapedShaderName = shaderName.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        
        // 构建glob模式
        const globPattern = extensions.map(ext => `-g "*.${ext}"`).join(' ');
        
        // 根据平台构建不同的命令
        let cmd: string;
        if (process.platform === 'win32') {
            // Windows: 双引号包裹，内部双引号用反斜杠转义
            const pattern = `^\\s*Shader\\s+\\"${escapedShaderName}\\"`;
            cmd = `"${this.rgPath}" ${globPattern} --case-sensitive -H --line-number --hidden -e "${pattern}" .`;
        } else {
            // macOS/Linux: 单引号包裹，内部双引号不需要转义
            const pattern = `^\\s*Shader\\s+"${escapedShaderName}"`;
            cmd = `"${this.rgPath}" ${globPattern} --case-sensitive -H --line-number --hidden -e '${pattern}' .`;
        }
        
        try {
            const output = execSync(cmd, {
                cwd: rootPath,
                maxBuffer: 1024 * 1024,
                encoding: 'utf8'
            });
            
            // 解析搜索结果
            const lines = output.toString().split('\n').filter(line => line.trim());
            const matches: RipgrepMatch[] = [];
            
            for (const line of lines) {
                // 解析 ripgrep 输出格式：filepath:lineNum:lineText
                const match = /^([^:]+):(\d+):(.+)$/.exec(line);
                if (!match) {continue;}
                
                const [, relativePath, lineNumStr, lineText] = match;
                const filepath = join(rootPath, relativePath);
                const lineNum = parseInt(lineNumStr) - 1;
                
                if (WorkspaceIgnore.isIgnored(rootPath, filepath)) {
                    continue;
                }

                matches.push({
                    filePath: filepath,
                    line: lineNum,
                    column: 0,
                    text: lineText
                });
            }
            
            return matches;
        } catch (error: any) {
            // 没有找到结果时返回空数组
            if (error.status === 1) {
                return [];
            }
            throw error;
        }
    }
}

/**
 * 符号查找工具类
 * 统一的符号查找接口
 */
export class SymbolLookupUtils {
    /**
     * 将ripgrep匹配转换为VSCode Location
     */
    static matchesToLocations(matches: RipgrepMatch[]): vscode.Location[] {
        return matches.map(match => {
            const position = new vscode.Position(match.line, match.column);
            const range = new vscode.Range(position, position);
            return new vscode.Location(vscode.Uri.file(match.filePath), range);
        });
    }

    /**
     * 从文档中提取单词
     */
    static getWordAtPosition(document: vscode.TextDocument, position: vscode.Position): string | null {
        const wordRange = document.getWordRangeAtPosition(position, /[\w]+/);
        if (!wordRange) {
            return null;
        }
        return document.getText(wordRange);
    }

    /**
     * 猜测符号类型（基于上下文）
     */
    static guessSymbolType(document: vscode.TextDocument, position: vscode.Position): 'function' | 'macro' | 'struct' | 'variable' | 'unknown' {
        const line = document.lineAt(position.line).text;
        const trimmed = line.trim();

        // 宏定义
        if (trimmed.startsWith('#define')) {
            return 'macro';
        }

        // 结构体
        if (trimmed.includes('struct ')) {
            return 'struct';
        }

        // 函数调用（后面有括号）
        const word = this.getWordAtPosition(document, position);
        if (word) {
            const afterWord = line.substring(position.character + word.length);
            if (afterWord.trim().startsWith('(')) {
                return 'function';
            }
        }

        // 默认为变量
        return 'variable';
    }

    /**
     * 去重Location数组
     */
    static deduplicateLocations(locations: vscode.Location[]): vscode.Location[] {
        const seen = new Set<string>();
        return locations.filter(loc => {
            const key = `${loc.uri.fsPath}:${loc.range.start.line}:${loc.range.start.character}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
}

/**
 * 文件解析工具类
 * 统一的文件解析接口
 */
export class FileParsingUtils {
    /**
     * 检查是否为Shader文件
     */
    static isShaderFile(filePath: string): boolean {
        const ext = filePath.toLowerCase();
        return ext.endsWith('.shader') ||
               ext.endsWith('.hlsl') ||
               ext.endsWith('.cginc') ||
               ext.endsWith('.compute') ||
               ext.endsWith('.usf') ||
               ext.endsWith('.ush');
    }

    /**
     * 检查是否在CGPROGRAM/HLSLPROGRAM块内
     */
    static isInCGBlock(lines: string[], lineIndex: number): boolean {
        let inBlock = false;
        for (let i = 0; i <= lineIndex; i++) {
            const trimmed = lines[i].trim();
            if (/^(CG|HLSL)PROGRAM/.test(trimmed)) {
                inBlock = true;
            } else if (/^END(CG|HLSL)/.test(trimmed)) {
                inBlock = false;
            }
        }
        return inBlock;
    }

    /**
     * 提取函数参数
     */
    static extractFunctionParameters(paramString: string): Array<{ name: string; type: string }> {
        const parameters: Array<{ name: string; type: string }> = [];
        
        if (!paramString || paramString.trim() === '') {
            return parameters;
        }

        const params = paramString.split(',');
        for (const param of params) {
            const trimmed = param.trim();
            if (!trimmed) {
                continue;
            }

            // 匹配: type name 或 type name : semantic
            const match = trimmed.match(/(\w+(?:\s*<[^>]+>)?)\s+(\w+)/);
            if (match) {
                parameters.push({
                    type: match[1],
                    name: match[2],
                });
            }
        }

        return parameters;
    }

    /**
     * 计算大括号深度
     */
    static calculateBraceDepth(line: string): { open: number; close: number } {
        const open = (line.match(/{/g) || []).length;
        const close = (line.match(/}/g) || []).length;
        return { open, close };
    }
}

/**
 * 缓存工具类
 * 统一的缓存管理接口
 */
export class CacheUtils {
    /**
     * 生成缓存键
     */
    static generateCacheKey(prefix: string, ...parts: string[]): string {
        return `${prefix}:${parts.join(':')}`;
    }

    /**
     * 检查缓存是否过期
     */
    static isCacheExpired(timestamp: number, maxAge: number): boolean {
        return Date.now() - timestamp > maxAge;
    }

    /**
     * 清理过期缓存
     */
    static cleanExpiredCache<T extends { timestamp: number }>(
        cache: Map<string, T>,
        maxAge: number
    ): number {
        let cleaned = 0;
        const now = Date.now();
        
        for (const [key, value] of Array.from(cache.entries())) {
            if (now - value.timestamp > maxAge) {
                cache.delete(key);
                cleaned++;
            }
        }
        
        return cleaned;
    }
}
