/**
 * 代码清理分析工具
 * 用于检测未使用的模块、导入和函数
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * 未使用的导入
 */
export interface UnusedImport {
    file: string;
    line: number;
    importName: string;
    from: string;
}

/**
 * 未使用的函数
 */
export interface UnusedFunction {
    file: string;
    line: number;
    functionName: string;
    isPrivate: boolean;
}

/**
 * 代码清理报告
 */
export interface CleanupReport {
    unusedImports: UnusedImport[];
    unusedFunctions: UnusedFunction[];
    unusedFiles: string[];
    totalSavings: {
        files: number;
        lines: number;
        bytes: number;
    };
}

/**
 * 代码清理分析器
 */
export class CodeCleanupAnalyzer {
    private srcPath: string;
    private fileContents: Map<string, string> = new Map();

    constructor(srcPath: string) {
        this.srcPath = srcPath;
    }

    /**
     * 运行完整分析
     */
    async analyze(): Promise<CleanupReport> {
        console.log('Starting code cleanup analysis...\n');

        // 1. 扫描所有TypeScript文件
        const files = await this.scanTypeScriptFiles();
        console.log(`Found ${files.length} TypeScript files\n`);

        // 2. 读取所有文件内容
        await this.loadFileContents(files);

        // 3. 检测未使用的文件
        const unusedFiles = this.detectUnusedFiles(files);
        console.log(`Found ${unusedFiles.length} unused files`);

        // 4. 检测未使用的导入
        const unusedImports = this.detectUnusedImports(files);
        console.log(`Found ${unusedImports.length} unused imports`);

        // 5. 检测未使用的函数
        const unusedFunctions = this.detectUnusedFunctions(files);
        console.log(`Found ${unusedFunctions.length} unused functions`);

        // 6. 计算节省空间
        const totalSavings = this.calculateSavings(unusedFiles, unusedImports, unusedFunctions);

        return {
            unusedImports,
            unusedFunctions,
            unusedFiles,
            totalSavings,
        };
    }

    /**
     * 扫描所有TypeScript文件
     */
    private async scanTypeScriptFiles(): Promise<string[]> {
        const files: string[] = [];

        const scan = async (dir: string) => {
            const entries = await fs.promises.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    // 跳过node_modules和out目录
                    if (entry.name !== 'node_modules' && entry.name !== 'out') {
                        await scan(fullPath);
                    }
                } else if (entry.isFile() && entry.name.endsWith('.ts')) {
                    files.push(fullPath);
                }
            }
        };

        await scan(this.srcPath);
        return files;
    }

    /**
     * 加载所有文件内容
     */
    private async loadFileContents(files: string[]): Promise<void> {
        for (const file of files) {
            const content = await fs.promises.readFile(file, 'utf-8');
            this.fileContents.set(file, content);
        }
    }

    /**
     * 检测未使用的文件
     */
    private detectUnusedFiles(files: string[]): string[] {
        const unusedFiles: string[] = [];

        for (const file of files) {
            // 跳过特殊文件
            if (file.endsWith('extension.ts') || 
                file.endsWith('index.ts') ||
                file.includes('/test/')) {
                continue;
            }

            // 检查是否被其他文件导入
            const relativePath = path.relative(this.srcPath, file);
            const fileName = path.basename(file, '.ts');
            let isUsed = false;

            for (const [otherFile, content] of this.fileContents) {
                if (otherFile === file) {
                    continue;
                }

                // 检查是否有导入语句引用此文件
                if (content.includes(`from './${fileName}'`) ||
                    content.includes(`from "../${fileName}"`) ||
                    content.includes(relativePath.replace(/\\/g, '/'))) {
                    isUsed = true;
                    break;
                }
            }

            if (!isUsed) {
                unusedFiles.push(file);
            }
        }

        return unusedFiles;
    }

    /**
     * 检测未使用的导入
     */
    private detectUnusedImports(files: string[]): UnusedImport[] {
        const unusedImports: UnusedImport[] = [];

        for (const file of files) {
            const content = this.fileContents.get(file);
            if (!content) {
                continue;
            }

            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                // 匹配导入语句
                const importMatch = /^import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/.exec(line);
                if (!importMatch) {
                    continue;
                }

                const namedImports = importMatch[1];
                const defaultImport = importMatch[2];
                const from = importMatch[3];

                // 检查命名导入
                if (namedImports) {
                    const imports = namedImports.split(',').map(s => s.trim());
                    for (const imp of imports) {
                        // 移除别名
                        const importName = imp.split(' as ')[0].trim();
                        
                        // 检查是否在文件中使用
                        const regex = new RegExp(`\\b${importName}\\b`, 'g');
                        const matches = content.match(regex);
                        
                        // 如果只出现一次（即导入语句本身），则未使用
                        if (!matches || matches.length <= 1) {
                            unusedImports.push({
                                file,
                                line: i + 1,
                                importName,
                                from,
                            });
                        }
                    }
                }

                // 检查默认导入
                if (defaultImport) {
                    const regex = new RegExp(`\\b${defaultImport}\\b`, 'g');
                    const matches = content.match(regex);
                    
                    if (!matches || matches.length <= 1) {
                        unusedImports.push({
                            file,
                            line: i + 1,
                            importName: defaultImport,
                            from,
                        });
                    }
                }
            }
        }

        return unusedImports;
    }

    /**
     * 检测未使用的函数
     */
    private detectUnusedFunctions(files: string[]): UnusedFunction[] {
        const unusedFunctions: UnusedFunction[] = [];

        for (const file of files) {
            const content = this.fileContents.get(file);
            if (!content) {
                continue;
            }

            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                // 匹配函数定义
                const funcMatch = /^\s*(private|public)?\s+(?:static\s+)?(?:async\s+)?(\w+)\s*\([^)]*\)\s*[:{]/.exec(line);
                if (!funcMatch) {
                    continue;
                }

                const isPrivate = funcMatch[1] === 'private';
                const functionName = funcMatch[2];

                // 跳过特殊函数
                if (functionName === 'constructor' ||
                    functionName === 'activate' ||
                    functionName === 'deactivate' ||
                    functionName.startsWith('provide') ||
                    functionName.startsWith('resolve')) {
                    continue;
                }

                // 检查是否在文件中使用
                const regex = new RegExp(`\\b${functionName}\\b`, 'g');
                const matches = content.match(regex);
                
                // 如果只出现一次（即定义本身），则未使用
                if (!matches || matches.length <= 1) {
                    unusedFunctions.push({
                        file,
                        line: i + 1,
                        functionName,
                        isPrivate,
                    });
                }
            }
        }

        return unusedFunctions;
    }

    /**
     * 计算节省空间
     */
    private calculateSavings(
        unusedFiles: string[],
        unusedImports: UnusedImport[],
        unusedFunctions: UnusedFunction[]
    ): { files: number; lines: number; bytes: number } {
        let totalBytes = 0;
        let totalLines = 0;

        // 计算未使用文件的大小
        for (const file of unusedFiles) {
            try {
                const stats = fs.statSync(file);
                totalBytes += stats.size;
                
                const content = this.fileContents.get(file);
                if (content) {
                    totalLines += content.split('\n').length;
                }
            } catch (error) {
                // 忽略错误
            }
        }

        // 估算未使用导入和函数的大小
        totalLines += unusedImports.length; // 每个导入约1行
        totalLines += unusedFunctions.length * 5; // 每个函数约5行
        totalBytes += (unusedImports.length + unusedFunctions.length * 5) * 50; // 每行约50字节

        return {
            files: unusedFiles.length,
            lines: totalLines,
            bytes: totalBytes,
        };
    }

    /**
     * 生成报告
     */
    generateReport(report: CleanupReport): string {
        const lines: string[] = [];

        lines.push('# Code Cleanup Analysis Report');
        lines.push('');
        lines.push(`Generated: ${new Date().toISOString()}`);
        lines.push('');

        // 总结
        lines.push('## Summary');
        lines.push('');
        lines.push(`- Unused Files: ${report.unusedFiles.length}`);
        lines.push(`- Unused Imports: ${report.unusedImports.length}`);
        lines.push(`- Unused Functions: ${report.unusedFunctions.length}`);
        lines.push(`- Total Savings: ${report.totalSavings.lines} lines, ${(report.totalSavings.bytes / 1024).toFixed(2)} KB`);
        lines.push('');

        // 未使用的文件
        if (report.unusedFiles.length > 0) {
            lines.push('## Unused Files');
            lines.push('');
            for (const file of report.unusedFiles) {
                const relativePath = path.relative(this.srcPath, file);
                lines.push(`- ${relativePath}`);
            }
            lines.push('');
        }

        // 未使用的导入
        if (report.unusedImports.length > 0) {
            lines.push('## Unused Imports');
            lines.push('');
            const byFile = new Map<string, UnusedImport[]>();
            for (const imp of report.unusedImports) {
                if (!byFile.has(imp.file)) {
                    byFile.set(imp.file, []);
                }
                byFile.get(imp.file)!.push(imp);
            }

            for (const [file, imports] of byFile) {
                const relativePath = path.relative(this.srcPath, file);
                lines.push(`### ${relativePath}`);
                lines.push('');
                for (const imp of imports) {
                    lines.push(`- Line ${imp.line}: \`${imp.importName}\` from \`${imp.from}\``);
                }
                lines.push('');
            }
        }

        // 未使用的函数
        if (report.unusedFunctions.length > 0) {
            lines.push('## Unused Functions');
            lines.push('');
            const byFile = new Map<string, UnusedFunction[]>();
            for (const func of report.unusedFunctions) {
                if (!byFile.has(func.file)) {
                    byFile.set(func.file, []);
                }
                byFile.get(func.file)!.push(func);
            }

            for (const [file, functions] of byFile) {
                const relativePath = path.relative(this.srcPath, file);
                lines.push(`### ${relativePath}`);
                lines.push('');
                for (const func of functions) {
                    const visibility = func.isPrivate ? 'private' : 'public';
                    lines.push(`- Line ${func.line}: \`${visibility} ${func.functionName}()\``);
                }
                lines.push('');
            }
        }

        return lines.join('\n');
    }
}

// 运行分析
if (require.main === module) {
    const srcPath = path.join(__dirname, '..');
    const analyzer = new CodeCleanupAnalyzer(srcPath);
    
    analyzer.analyze().then(report => {
        const reportText = analyzer.generateReport(report);
        console.log('\n' + reportText);
        
        // 保存报告
        const reportPath = path.join(__dirname, '../../.codebuddy/plan/code-optimization/cleanup-report.md');
        fs.promises.mkdir(path.dirname(reportPath), { recursive: true })
            .then(() => fs.promises.writeFile(reportPath, reportText, 'utf-8'))
            .then(() => console.log(`\nReport saved to: ${reportPath}`))
            .catch(console.error);
    }).catch(console.error);
}
