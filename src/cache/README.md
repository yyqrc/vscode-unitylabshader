# 符号缓存系统 (Symbol Cache System)

## 概述

符号缓存系统是一个高性能的持久化缓存解决方案，用于加速 HLSL/Shader 文件的符号查找和定义跳转。

## 核心特性

### ✅ Phase 1 已实现

1. **持久化存储**
   - 符号缓存保存到本地文件系统
   - 每次扩展激活时自动加载缓存
   - 支持增量更新，无需重新扫描整个工作区

2. **多线程构建**
   - 使用 Worker 线程并行解析文件
   - 最多支持 4 个并发线程
   - 大幅提升初始缓存构建速度

3. **跨文件移动检测**
   - 通过符号签名（函数名+参数）追踪符号
   - 自动检测函数从一个文件移动到另一个文件
   - 智能清理旧位置的缓存

4. **智能增量更新**
   - 文件变更时只更新对应文件的缓存
   - 使用文件哈希快速检测变更
   - 防抖机制避免频繁写入

5. **多种符号类型支持**
   - 函数 (Function)
   - 宏定义 (Macro)
   - 结构体 (Struct)
   - 类 (Class)
   - 全局变量 (Variable)
   - Typedef

### ✅ Phase 2 已实现

1. **文件监听和自动更新**
   - 实时监听文件创建、修改、删除事件
   - 自动触发增量更新
   - 防抖机制避免频繁更新

2. **缓存管理命令**
   - `Unity Shader: Build Symbol Cache` - 重建符号缓存
   - `Unity Shader: Clear Symbol Cache` - 清除符号缓存

3. **路径标准化**
   - 所有符号路径统一使用相对路径存储
   - 确保跨平台兼容性
   - 修复跳转路径错误问题

4. **FallBack 搜索增强**
   - 支持所有 shader 文件类型（.shader, .hlsl, .cginc, .compute, .usf, .ush）
   - 不再局限于 .shader 文件
   - 更准确的 Shader 定义查找

## 架构设计

```
src/cache/
├── symbolCacheTypes.ts      # 数据结构定义
├── symbolCacheManager.ts    # 核心缓存管理器
├── symbolParser.ts          # 符号解析器
├── symbolParserWorker.ts    # Worker 线程脚本
├── fileHasher.ts            # 文件哈希工具
└── index.ts                 # 模块导出
```

### 数据流

```
文件变更 → 文件监听器 → 增量更新队列 → 符号解析 → 更新缓存 → 持久化存储
                                                    ↓
                                            符号索引重建
                                                    ↓
                                          跨文件移动检测
```

## 使用方法

### 初始化

```typescript
import { SymbolCacheManager } from './cache';

// 在 extension.ts 中初始化
const symbolCacheManager = new SymbolCacheManager(context);
await symbolCacheManager.initialize(workspacePath);
```

### 查找符号

```typescript
// 查找符号定义
const symbols = symbolCacheManager.findSymbol('MyFunction');

// 获取文件的所有符号
const fileSymbols = symbolCacheManager.getFileSymbols(filePath);
```

### 集成到 Provider

```typescript
// 在 DefinitionProvider 中使用
class HLSLDefinitionProvider {
    constructor(private symbolCacheManager: SymbolCacheManager) {}
    
    async provideDefinition(document, position) {
        const word = document.getText(wordRange);
        
        // 优先从缓存查找
        const cachedSymbols = this.symbolCacheManager.findSymbol(word);
        if (cachedSymbols.length > 0) {
            return this.convertToLocations(cachedSymbols);
        }
        
        // 缓存未命中，使用 ripgrep 搜索
        // ...
    }
}
```

## 性能指标

### 预期性能

| 操作 | 时间 | 说明 |
|------|------|------|
| 首次构建缓存 | 2-10秒 | 取决于项目大小和文件数量 |
| 后续启动加载 | <100ms | 直接从磁盘加载缓存 |
| 符号查找 | <10ms | 从内存索引直接返回 |
| 单文件更新 | <50ms | 只重新解析变更的文件 |

### 内存占用

- 小型项目（<100文件）：~5MB
- 中型项目（100-500文件）：~10-30MB
- 大型项目（>500文件）：~30-100MB

## 缓存文件位置

缓存文件保存在 VS Code 的全局存储目录：

```
Windows: %APPDATA%\Code\User\globalStorage\<extension-id>\symbol-cache\
macOS: ~/Library/Application Support/Code/User/globalStorage/<extension-id>/symbol-cache/
Linux: ~/.config/Code/User/globalStorage/<extension-id>/symbol-cache/
```

文件命名格式：`{workspaceHash}-symbol-cache.json`

## 跨文件移动检测

### 工作原理

1. **符号标识符生成**
   - 为每个符号生成唯一标识符（基于签名哈希）
   - 例如：`float4 MyFunction(float3 pos)` → `abc123de`

2. **移动检测流程**
   ```
   文件A修改 → 解析新符号 → 对比旧符号
                              ↓
                    发现符号消失 → 在其他文件中查找相同签名
                              ↓
                    找到匹配 → 记录移动事件
   ```

3. **自动清理**
   - 删除旧文件中的符号缓存
   - 更新符号索引
   - 保持缓存一致性

### 示例

```hlsl
// 文件A.hlsl (修改前)
float4 MyFunction(float3 pos) {
    return float4(pos, 1.0);
}

// 文件B.hlsl (修改后)
float4 MyFunction(float3 pos) {  // 函数移动到这里
    return float4(pos, 1.0);
}
```

系统会自动检测到 `MyFunction` 从文件A移动到文件B，并更新缓存。

## 配置选项

未来可以添加以下配置：

```json
{
    "unityshader.cache.enabled": true,
    "unityshader.cache.maxWorkers": 4,
    "unityshader.cache.ttl": 30000,
    "unityshader.cache.autoRebuild": true
}
```

## 故障排除

### 缓存损坏

如果缓存出现问题，可以使用以下方法清除：

**方法 1：使用命令（推荐）**
1. 打开命令面板 (Ctrl+Shift+P / Cmd+Shift+P)
2. 运行 `Unity Shader: Clear Symbol Cache`
3. 重新加载窗口或等待自动重建

**方法 2：手动删除**
1. 打开命令面板 (Ctrl+Shift+P / Cmd+Shift+P)
2. 运行 "Developer: Open Global Storage"
3. 删除 `symbol-cache` 目录
4. 重新加载窗口

### 重建缓存

如果需要完全重建缓存：

1. 打开命令面板 (Ctrl+Shift+P / Cmd+Shift+P)
2. 运行 `Unity Shader: Build Symbol Cache`
3. 等待构建完成

### 性能问题

如果缓存构建过慢：

1. 检查项目中是否有大量文件
2. 考虑排除不必要的目录（如 `node_modules`）
3. 减少 Worker 线程数量

## 未来计划

### ✅ Phase 2 - 已完成
- [x] 文件监听和自动更新
- [x] 缓存管理命令
- [x] 路径标准化
- [x] FallBack 搜索增强

### Phase 3 - 高级特性（计划中）
- [ ] 缓存压缩（gzip）
- [ ] 分片存储（大型项目）
- [ ] 增量索引优化
- [ ] 缓存统计和诊断
- [ ] 跨工作区符号共享
- [ ] 远程缓存同步
- [ ] 智能预加载
- [ ] 性能分析工具

## 技术细节

### 文件哈希

使用 MD5 算法计算文件内容哈希：
- 快速检测文件变更
- 避免重复解析未修改的文件

### 符号签名

函数签名格式：`{returnType} {functionName}({params})`

示例：
```
float4 MyFunction(float3 pos, float intensity)
```

### 缓存数据结构

```typescript
{
    version: "1.0.0",
    workspacePath: "/path/to/workspace",
    workspaceHash: "abc123",
    files: {
        "path/to/file.hlsl": {
            filePath: "path/to/file.hlsl",
            fileHash: "def456",
            lastModified: 1234567890,
            symbols: [
                {
                    name: "MyFunction",
                    kind: "function",
                    line: 10,
                    column: 0,
                    signature: "float4 MyFunction(float3 pos)",
                    contentHash: "ghi789"
                }
            ]
        }
    },
    symbolIndex: {
        "MyFunction": [
            { filePath: "path/to/file.hlsl", symbolIndex: 0 }
        ]
    }
}
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT
