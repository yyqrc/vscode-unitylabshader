import { parentPort, workerData } from 'worker_threads';
import * as fs from 'fs';
import * as path from 'path';
import { SymbolParser } from './symbolParser';
import { FileHasher } from './fileHasher';
import { ParseFileRequest, ParseFileResult, WorkerMessage } from './symbolCacheTypes';

/**
 * Worker 线程：并行解析文件符号
 * 用于加速初始缓存构建
 */

if (parentPort) {
    // 监听主线程发送的解析请求
    parentPort.on('message', async (message: WorkerMessage) => {
        if (message.type === 'parse') {
            try {
                const request = message.data as ParseFileRequest;
                const result = await parseFile(request);
                
                // 发送解析结果
                parentPort!.postMessage({
                    type: 'result',
                    data: result,
                } as WorkerMessage);
            } catch (error) {
                // 发送错误信息
                parentPort!.postMessage({
                    type: 'error',
                    data: {
                        filePath: message.data?.filePath,
                        error: error instanceof Error ? error.message : String(error),
                    },
                } as WorkerMessage);
            }
        }
    });
}

/**
 * 解析单个文件
 */
async function parseFile(request: ParseFileRequest): Promise<ParseFileResult> {
    const startTime = Date.now();
    
    // 读取文件内容（如果没有提供）
    let content = request.content;
    if (!content) {
        // 将相对路径转换为绝对路径
        const absolutePath = request.workspacePath 
            ? path.join(request.workspacePath, request.filePath)
            : request.filePath;
        content = await fs.promises.readFile(absolutePath, 'utf-8');
    }

    // 计算文件哈希
    const fileHash = FileHasher.hashString(content);

    // 解析符号（使用相对路径）
    const symbols = SymbolParser.parseFile(request.filePath, content);

    const parseTime = Date.now() - startTime;

    return {
        filePath: request.filePath,
        fileHash,
        symbols,
        parseTime,
    };
}

// 如果直接运行此文件（用于测试）
if (require.main === module) {
    console.log('Symbol parser worker started');
}
