# 日志输出优化说明

## 📋 优化目标

1. **简化日志输出** - 清理冗余信息，只保留关键信息
2. **开发环境专用** - 日志只在开发模式下输出，打包后不输出

---

## 🔧 实现方案

### 1. 开发环境判断

添加了 `isDevelopment()` 和 `devLog()` 方法：

```typescript
/**
 * 判断是否为开发环境
 * 开发环境：通过 "Run Extension" 或 "Debug Extension" 启动
 * 生产环境：通过 VSIX 安装后运行
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

### 2. 配置开发环境标识

在 `.vscode/launch.json` 中添加环境变量：

```json
{
    "name": "Run Extension",
    "type": "extensionHost",
    "request": "launch",
    "env": {
        "VSCODE_DEBUG_MODE": "true"
    }
}
```

3. **统一日志格式**

所有搜索功能使用统一的日志格式：

#### 宏定义搜索
```
[Macro] Searching: "MACRO_NAME"
[Macro] ✓ Found: path/to/file.hlsl:10
[Macro] ✗ Not found
```

#### 函数定义搜索
```
[Function] Searching: "functionName"
[Function] ✓ Found: path/to/file.hlsl:25
[Function] ✗ Not found
```

#### 结构体定义搜索
```
[Struct] Searching: "StructName"
[Struct] ✓ Found: path/to/file.hlsl:15
[Struct] ✗ Not found
```

#### Include 文件搜索
```
[Include] Error: File not found
```

#### FallBack Shader 搜索
```
[FallBack] Searching: "Mobile/VertexLit"
[FallBack] ✓ Found: BuiltIn/Mobile/Mobile-VertexLit.shader:8
[FallBack] ✓ Jump to: /path/to/Mobile-VertexLit.shader
[FallBack] ✗ Not found
```

#### 符号搜索（Symbol Provider）
```
[Symbol] Searching Function
[Symbol] ✓ Found 15 Function symbols
[Symbol] Searching custom pattern: pattern_name
[Symbol] Found 5 custom matches
[Symbol] Retry 1/4
[Symbol] Trying fallback pattern...
[Symbol] ✓ Found 3 symbols (fallback)
[Symbol] ✗ Fallback failed
[Symbol] Error: error message
```
---

## ✅ 优化效果

### 优化前
- ❌ 大量冗余日志信息
- ❌ 函数名、文件路径等无关信息
- ❌ 生产环境也输出日志
- ❌ 日志格式不统一

### 优化后
- ✅ 简洁清晰的日志信息
- ✅ 只显示关键信息：搜索内容、找到位置、是否成功
- ✅ 生产环境不输出日志（性能更好）
- ✅ 统一的日志格式，易于调试

---

## 🧪 测试方法

### 开发环境测试（应该有日志）

1. 在 VS Code 中按 `F5` 启动调试
2. 打开开发者工具：`Help` -> `Toggle Developer Tools`
3. 在 Console 中应该能看到日志输出
4. 测试各种跳转功能：
   - 宏定义跳转
   - 函数定义跳转
   - 结构体定义跳转
   - Include 文件跳转
   - FallBack Shader 跳转

### 生产环境测试（不应该有日志）

1. 打包插件：`npm run package`
2. 安装 VSIX 文件
3. 重新加载 VS Code
4. 打开开发者工具
5. 测试跳转功能，Console 中**不应该**看到任何日志输出

---

## 📝 相关文件

- `src/hlsl/definitionProvider.ts` - 定义跳转功能的日志优化
- `src/hlsl/symbolProvider.ts` - 符号搜索功能的日志优化
- `.vscode/launch.json` - 添加开发环境标识
- `FALLBACK_FIX.md` - FallBack 功能修复说明
- `PROGRESS.md` - 开发进度记录

---

## 🎯 后续改进建议

1. 可以考虑添加日志级别配置（INFO、DEBUG、ERROR）
2. 可以添加配置项让用户选择是否启用日志
3. 可以将日志输出到专用的 Output Channel，而不是 Console
