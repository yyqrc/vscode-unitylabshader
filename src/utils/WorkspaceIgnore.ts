import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

interface IgnoreRule {
    pattern: string;
    negated: boolean;
    directoryOnly: boolean;
    anchored: boolean;
    hasSlash: boolean;
    regex: RegExp;
}

interface IgnoreMatcher {
    mtimeMs: number;
    rules: IgnoreRule[];
}

/**
 * 根工作区 .gitignore 过滤器。
 * 覆盖符号缓存和兜底搜索需要的常见 gitignore 规则，避免跨文件能力命中隐藏文件。
 */
export class WorkspaceIgnore {
    private static matchers = new Map<string, IgnoreMatcher>();

    static isIgnored(rootPath: string, filePath: string): boolean {
        if (!this.isEnabled()) {
            return false;
        }

        const matcher = this.getMatcher(rootPath);
        if (matcher.rules.length === 0) {
            return false;
        }

        const relativePath = this.normalizeRelativePath(rootPath, filePath);
        if (!relativePath || relativePath.startsWith('..')) {
            return false;
        }

        let ignored = false;
        for (const rule of matcher.rules) {
            if (this.matchesRule(rule, relativePath)) {
                ignored = !rule.negated;
            }
        }

        return ignored;
    }

    static reload(rootPath: string): void {
        this.matchers.delete(this.normalizeRoot(rootPath));
    }

    static isEnabled(): boolean {
        return vscode.workspace
            .getConfiguration('unityshader')
            .get<boolean>('files.useGitignore', true);
    }

    private static getMatcher(rootPath: string): IgnoreMatcher {
        const normalizedRoot = this.normalizeRoot(rootPath);
        const ignorePath = path.join(normalizedRoot, '.gitignore');
        const mtimeMs = this.getMtime(ignorePath);
        const cached = this.matchers.get(normalizedRoot);

        if (cached && cached.mtimeMs === mtimeMs) {
            return cached;
        }

        const matcher: IgnoreMatcher = {
            mtimeMs,
            rules: this.loadRules(ignorePath),
        };
        this.matchers.set(normalizedRoot, matcher);
        return matcher;
    }

    private static loadRules(ignorePath: string): IgnoreRule[] {
        if (!fs.existsSync(ignorePath)) {
            return [];
        }

        const content = fs.readFileSync(ignorePath, 'utf-8');
        return content
            .split(/\r?\n/)
            .map(line => this.parseRule(line))
            .filter((rule): rule is IgnoreRule => rule !== null);
    }

    private static parseRule(rawLine: string): IgnoreRule | null {
        let line = rawLine.replace(/\r$/, '');
        if (!line.trim()) {
            return null;
        }

        line = this.trimUnescapedTrailingSpaces(line);
        if (line.startsWith('#')) {
            return null;
        }

        if (line.startsWith('\\#') || line.startsWith('\\!')) {
            line = line.substring(1);
        }

        let negated = false;
        if (line.startsWith('!')) {
            negated = true;
            line = line.substring(1);
        }

        if (!line) {
            return null;
        }

        const directoryOnly = line.endsWith('/');
        const anchored = line.startsWith('/');
        let pattern = line.replace(/\\/g, '/');

        if (anchored) {
            pattern = pattern.substring(1);
        }
        if (directoryOnly) {
            pattern = pattern.substring(0, pattern.length - 1);
        }

        if (!pattern) {
            return null;
        }

        const hasSlash = pattern.includes('/');

        return {
            pattern,
            negated,
            directoryOnly,
            anchored,
            hasSlash,
            regex: this.globToRegExp(pattern),
        };
    }

    private static matchesRule(rule: IgnoreRule, relativePath: string): boolean {
        const segments = relativePath.split('/');

        if (!rule.hasSlash) {
            if (rule.anchored) {
                return rule.regex.test(segments[0] || '');
            }

            return segments.some(segment => rule.regex.test(segment));
        }

        if (rule.regex.test(relativePath)) {
            return true;
        }

        if (!rule.directoryOnly) {
            return false;
        }

        const prefixes = this.pathPrefixes(relativePath);
        return prefixes.some(prefix => rule.regex.test(prefix));
    }

    private static pathPrefixes(relativePath: string): string[] {
        const segments = relativePath.split('/');
        const prefixes: string[] = [];
        for (let i = 1; i <= segments.length; i++) {
            prefixes.push(segments.slice(0, i).join('/'));
        }
        return prefixes;
    }

    private static normalizeRelativePath(rootPath: string, filePath: string): string {
        const absolutePath = path.isAbsolute(filePath)
            ? filePath
            : path.join(rootPath, filePath);
        return path.relative(this.normalizeRoot(rootPath), absolutePath).replace(/\\/g, '/');
    }

    private static normalizeRoot(rootPath: string): string {
        return path.resolve(rootPath);
    }

    private static getMtime(filePath: string): number {
        try {
            return fs.statSync(filePath).mtimeMs;
        } catch {
            return -1;
        }
    }

    private static trimUnescapedTrailingSpaces(value: string): string {
        let end = value.length;
        while (end > 0 && value[end - 1] === ' ') {
            let backslashCount = 0;
            for (let i = end - 2; i >= 0 && value[i] === '\\'; i--) {
                backslashCount++;
            }
            if (backslashCount % 2 === 1) {
                break;
            }
            end--;
        }
        return value.substring(0, end);
    }

    private static globToRegExp(pattern: string): RegExp {
        let source = '';
        for (let i = 0; i < pattern.length; i++) {
            const char = pattern[i];
            const next = pattern[i + 1];

            if (char === '*') {
                if (next === '*') {
                    source += '.*';
                    i++;
                } else {
                    source += '[^/]*';
                }
                continue;
            }

            if (char === '?') {
                source += '[^/]';
                continue;
            }

            source += this.escapeRegExp(char);
        }

        const flags = process.platform === 'win32' ? 'i' : '';
        return new RegExp(`^${source}$`, flags);
    }

    private static escapeRegExp(value: string): string {
        return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
    }
}
