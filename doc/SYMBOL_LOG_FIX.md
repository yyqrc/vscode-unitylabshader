# Symbol Provider 日志优化修复

## 🐛 问题描述

在函数跳转时，控制台会打印大量的 `[Shaders] Found symbol` 日志，导致：
1. 日志信息冗余，难以阅读
2. 包含大量无用的调试信息（命令输出、模式匹配等）
3. 生产环境也会输出这些日志，影响性能

### 问题日志示例

```
[Shaders] Searching with pattern: ^\w+\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9:_\x7f-\xff]*)\s*\(
[Shaders] Pattern kind: Function
[Shaders] Executing command (attempt 1): "rg" -g *.hlsl ...
[Shaders] Command output: [大量输出]
[Shaders] Found symbol: functionName at /path/to/file.hlsl:25
[Shaders] Found symbol: anotherFunc at /path/to/file.hlsl:30
[Shaders] Found symbol: yetAnotherFunc at /path/to/file.hlsl:35
... (数十条类似日志)
[Shaders] Found 50 matches for pattern
```

---

## 🔍 问题根源

问题出在 `src/hlsl/symbolProvider.ts` 文件中的 `provideWorkspaceSymbols` 方法：

1. **过度详细的日志**：每次搜索都输出模式、命令、输出内容
2. **每个符号都记录**：找到的每个符号都单独输出一条日志
3. **无环境判断**：开发和生产环境都输出日志
4. **重试日志冗余**：重试机制产生大量重复日志

---

## ✅ 修复方案

### 1. 添加开发环境判断

```typescript
/**
 * 判断是否为开发环境
 */
private isDevelopment(): boolean {
    return process.env.VSCODE_DEBUG_MODE === 'true' || 
           process.env.NODE_ENV === 'development';
}

/**
 * 开发环境日志输出
 */
private devLog(message: string): void {
    if (this.isDevelopment()) {
        console.log(message);
    }
}
```

### 2. 简化日志输出

**优化前**（每个符号一条日志）：
```typescript
console.log(`[${folder.name}] Found symbol: ${word} at ${filepath}:${lineMatch[2]}`);
```

**优化后**（汇总输出）：
```typescript
// 只在找到结果时输出总数
if (matchCount > 0) {
    this.devLog(`[Symbol] ✓ Found ${matchCount} ${SymbolKind[kind]} symbols`);
}
```

### 3. 移除冗余日志

移除了以下冗余日志：
- ❌ `Searching with pattern: ...`
- ❌ `Pattern kind: ...`
- ❌ `Executing command (attempt N): ...`
- ❌ `Command output: ...`
- ❌ `Found symbol: ... at ...` (每个符号)
- ❌ `Found N matches for pattern`

保留了关键日志：
- ✅ `[Symbol] Searching Function` - 搜索类型
- ✅ `[Symbol] ✓ Found 15 Function symbols` - 成功结果
- ✅ `[Symbol] Retry 1/4` - 重试信息
- ✅ `[Symbol] Trying fallback pattern...` - 降级策略
- ✅ `[Symbol] ✗ Fallback failed` - 失败信息
- ✅ `[Symbol] Error: message` - 错误信息

### 4. 移除调试用的转义日志

**优化前**：
```typescript
function escapeRegExpForShell(pattern: string): string {
    let escaped = pattern.replace(/"/g, '\\"');
    // ...
    console.log(`Original pattern: ${pattern}`);
    console.log(`Escaped pattern: ${escaped}`);
    return escaped;
}
```

**优化后**：
```typescript
function escapeRegExpForShell(pattern: string): string {
    let escaped = pattern.replace(/"/g, '\\"');
    // ...
    return escaped;  // 移除调试日志
}
```

---

## 📊 优化效果对比

### 优化前
```
[Shaders] Searching with pattern: ^\w+\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9:_\x7f-\xff]*)\s*\(
[Shaders] Pattern kind: Function
[Shaders] Executing command (attempt 1): "rg" -g *.hlsl ...
[Shaders] Command output: [大量输出]
[Shaders] Found symbol: UnityObjectToClipPos at UnityCG.cginc:245
[Shaders] Found symbol: UnityWorldToClipPos at UnityCG.cginc:250
[Shaders] Found symbol: UnityObjectToWorldNormal at UnityCG.cginc:255
... (数十条)
[Shaders] Found 50 matches for pattern
```
**日志数量**：50+ 条

### 优化后
```
[Symbol] Searching Function
[Symbol] ✓ Found 50 Function symbols
```
**日志数量**：2 条

**减少比例**：96%+ 🎉

---

## 🧪 测试验证

### 开发环境测试

1. 按 `F5` 启动调试
2. 打开开发者工具
3. 在 Shader 文件中跳转到函数定义
4. 查看控制台日志

**预期结果**：
```
[Symbol] Searching Function
[Symbol] ✓ Found 15 Function symbols
```

### 生产环境测试

1. 打包插件：`npm run package`
2. 安装 VSIX 文件
3. 测试函数跳转
4. 查看控制台

**预期结果**：无任何日志输出

---

## 📝 修改文件清单

1. **src/hlsl/symbolProvider.ts**
   - 添加 `isDevelopment()` 和 `devLog()` 方法
   - 简化 `provideWorkspaceSymbols()` 中的日志输出
   - 移除 `escapeRegExpForShell()` 中的调试日志
   - 优化重试和降级策略的日志

2. **LOG_OPTIMIZATION.md**
   - 添加 Symbol Provider 的日志格式说明

3. **PROGRESS.md**
   - 更新日志优化记录

---

## 🎯 后续建议

1. 可以考虑添加详细日志级别配置（DEBUG/INFO/ERROR）
2. 可以将日志输出到专用的 Output Channel
3. 可以添加性能统计（搜索耗时等）

---

**修复日期**：2026-01-11  
**相关文档**：[LOG_OPTIMIZATION.md](LOG_OPTIMIZATION.md)
