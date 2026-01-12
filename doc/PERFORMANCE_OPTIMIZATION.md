# 符号跳转性能优化文档

## 优化日期
2026-01-12

## 问题分析

### 原始问题
在 `stdpassmeta.cginc` 第 143 行尝试跳转到 `LinearToGammaSpaceFull` 函数时，从日志中发现效率很低：

```
[Symbol] Searching Function
[Symbol] ✓ Found 1069 Function symbols
[Symbol] Searching Struct
[Symbol] ✓ Found 111 Struct symbols
[Symbol] Searching Module
[Symbol] Retry 1/4
[Symbol] Retry 2/4
[Symbol] Retry 3/4
[Symbol] Retry 4/4
[Symbol] Trying fallback pattern...
[Symbol] ✗ Fallback failed
[Macro] Searching: "LinearToGammaSpaceFull"
[Macro] ✗ Not found
[Function] Searching: "LinearToGammaSpaceFull"
[Function] ✓ Found: .\Includes\UnityPostProcessCommon.cginc:382
[Struct] Searching: "LinearToGammaSpaceFull"
[Struct] ✗ Not found
```

### 核心问题

1. **Symbol Provider 效率低下**
   - 每次都要扫描整个工作区（1069个函数 + 111个结构体）
   - 没有缓存机制
   - Module 搜索失败后重试 4 次，浪费时间

2. **重复搜索**
   - 先调用 Symbol Provider（慢）
   - 然后无论是否找到都再用 ripgrep 搜索一遍（快）
   - 导致做了两次工作

3. **搜索顺序不合理**
   - Symbol Provider 返回所有符号后再过滤
   - ripgrep 直接搜索更快更准确，但被放在第二步

## 优化方案

### 综合优化方案（已实施）

#### 1. 调整搜索顺序（definitionProvider.ts）

**优化前：**
```typescript
// 1. 先用 Symbol Provider（慢）
let symbols = await commands.executeCommand('vscode.executeWorkspaceSymbolProvider', name);
// 2. 再用 ripgrep（快）
const funcResults = await this.searchFunctionDefinitions(name, rootPath);
```

**优化后：**
```typescript
// 1. 优先使用 ripgrep 直接搜索（最快最准确）
const funcResults = await this.searchFunctionDefinitions(name, rootPath);
// 2. 只有在 ripgrep 未找到时才使用 Symbol Provider 作为后备
if (results.length === 0) {
    let symbols = await commands.executeCommand('vscode.executeWorkspaceSymbolProvider', name);
}
```

**预期效果：**
- 大多数情况下只需要 ripgrep 搜索（快速）
- 避免重复搜索
- 减少 90% 的搜索时间

#### 2. 添加符号缓存机制（symbolProvider.ts）

**新增功能：**
```typescript
// 缓存配置
private symbolCache: Map<string, { symbols: SymbolInformation[], timestamp: number }> = new Map();
private readonly CACHE_TTL = 30000; // 30秒缓存有效期

// 文件变化时自动清除缓存
workspace.onDidChangeTextDocument(e => {
    if (this.isHLSLFile(e.document.fileName)) {
        this.invalidateCache();
    }
});
```

**预期效果：**
- 30秒内重复搜索直接使用缓存
- 文件修改时自动更新缓存
- 减少重复扫描工作区

#### 3. 减少 Module 搜索重试次数（symbolProvider.ts）

**优化前：**
```typescript
const maxRetries = 3; // 所有类型都重试3次
```

**优化后：**
```typescript
const maxRetries = (kind === SymbolKind.Module) ? 0 : 2; 
// Module 不重试，其他类型最多重试2次
```

**预期效果：**
- Module 搜索失败时不再浪费时间重试
- 减少 4 次无效搜索
- 节省约 1-2 秒

#### 4. 添加性能监控（两个文件）

**新增日志：**
```typescript
const startTime = Date.now();
this.devLog(`[Performance] ========== Definition Search Started ==========`);
// ... 搜索逻辑 ...
this.devLog(`[Performance] Macro search: ${Date.now() - macroStart}ms`);
this.devLog(`[Performance] Function search: ${Date.now() - funcStart}ms`);
this.devLog(`[Performance] Total time: ${Date.now() - startTime}ms`);
```

**预期效果：**
- 清晰了解每个步骤的耗时
- 便于后续进一步优化
- 帮助定位性能瓶颈

## 优化效果预测

### 场景 1：常规函数跳转（如 LinearToGammaSpaceFull）

**优化前：**
```
Symbol Provider: 2000-3000ms (扫描1069个函数)
Ripgrep 搜索: 100-200ms
总计: 2100-3200ms
```

**优化后：**
```
Ripgrep 搜索: 100-200ms
总计: 100-200ms
```

**提升：约 90-95% 的性能提升**

### 场景 2：重复搜索（30秒内）

**优化前：**
```
每次都是 2100-3200ms
```

**优化后：**
```
第一次: 100-200ms
后续: <10ms (缓存命中)
```

**提升：约 99% 的性能提升**

### 场景 3：Module 搜索失败

**优化前：**
```
初始搜索: 500ms
重试 1: 500ms
重试 2: 500ms
重试 3: 500ms
重试 4: 500ms
Fallback: 500ms
总计: 3000ms
```

**优化后：**
```
初始搜索: 500ms
总计: 500ms
```

**提升：约 83% 的性能提升**

## 测试方法

### 1. 开发环境测试

在开发模式下（Run Extension），控制台会输出详细的性能日志：

```
[Performance] ========== Definition Search Started ==========
[Search] Looking for: "LinearToGammaSpaceFull"
[Performance] Starting ripgrep search...
[Function] Searching: "LinearToGammaSpaceFull"
[Function] ✓ Found: .\Includes\UnityPostProcessCommon.cginc:382
[Performance] Function search: 150ms
[Performance] Total ripgrep time: 180ms
[Search] Ripgrep found 1 results, skipping symbol provider
[Performance] ========== Total time: 185ms, Found: 1 ==========
```

### 2. 对比测试

1. 在 `stdpassmeta.cginc` 第 143 行，将光标放在 `LinearToGammaSpaceFull` 上
2. 按 F12 跳转到定义
3. 查看控制台输出的性能日志
4. 对比优化前后的耗时

### 3. 缓存测试

1. 第一次跳转：记录耗时
2. 30秒内再次跳转：应该看到 `[Cache] Hit` 日志
3. 修改文件后跳转：应该看到 `[Cache] Invalidating` 日志

## 后续优化建议

### 短期优化（1-2周）

1. **智能符号类型判断**
   - 根据上下文判断符号类型（函数调用、类型声明等）
   - 只搜索相关类型，避免搜索所有类型

2. **并行搜索**
   - 宏、函数、结构体搜索可以并行执行
   - 使用 Promise.all 提升效率

### 中期优化（1-2月）

1. **增量索引**
   - 只索引变更的文件
   - 维护持久化的符号索引

2. **预加载常用符号**
   - 后台预加载 Unity 内置函数
   - 减少首次搜索时间

### 长期优化（3-6月）

1. **Language Server Protocol (LSP)**
   - 实现完整的 LSP 服务器
   - 提供更强大的代码智能功能

2. **分布式索引**
   - 支持大型项目的分布式索引
   - 提升超大工作区的性能

## 相关文件

- `src/hlsl/definitionProvider.ts` - 定义跳转提供者
- `src/hlsl/symbolProvider.ts` - 符号提供者
- `doc/PERFORMANCE_OPTIMIZATION.md` - 本文档

## 版本历史

- **v1.0** (2026-01-12): 初始优化方案实施
  - 调整搜索顺序
  - 添加符号缓存
  - 减少重试次数
  - 添加性能监控
