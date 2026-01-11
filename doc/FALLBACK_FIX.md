# FallBack 跳转功能修复说明

## 📋 问题分析

### 问题：无法跳转到包含 `/` 的 Shader
1. **`FallBack "StdOutline"`** ✅ 可以正常跳转
2. **`FallBack "Mobile/VertexLit"`** ❌ 无法跳转

**错误信息**：
```
regex parse error:
    ^\s*Shader\s+"Mobile\/VertexLit"
                        ^^
error: unrecognized escape sequence
```

**根本原因**：
- 代码中错误地将 `/` 转义为 `\/`
- 但在 ripgrep 的正则表达式中，**`/` 不是特殊字符，不需要转义**
- ripgrep 不认识 `\/` 这个转义序列，导致报错

**关键知识点**：
- 在 JavaScript 正则表达式中，`/` 用于分隔正则表达式（如 `/pattern/`），所以需要转义
- 但在 ripgrep 的正则表达式字符串中，`/` 只是普通字符，**不需要转义**
- ripgrep 正则表达式中需要转义的特殊字符是：`. * + ? ^ $ { } ( ) | [ ] \`

---

## 🔧 修复方案

### 核心修复：正确处理正则表达式转义

**错误代码**（第一次尝试）：
```typescript
// ❌ 错误：/ 在 ripgrep 正则表达式中不需要转义
const escapedShaderName = shaderName.replace(/\//g, '\\/');
const pattern = `^\\s*Shader\\s+"${escapedShaderName}"`;
// 结果：^\s*Shader\s+"Mobile\/VertexLit"
// ripgrep 报错：unrecognized escape sequence
```

**正确代码**：
```typescript
// ✅ 正确：只转义正则表达式的特殊字符，/ 不是特殊字符
const escapedShaderName = shaderName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pattern = `^\\s*Shader\\s+"${escapedShaderName}"`;
// 结果：^\s*Shader\s+"Mobile/VertexLit"
// ripgrep 正确识别
```

**关键点**：
1. **`/` 不需要转义** - 在 ripgrep 正则表达式中，`/` 只是普通字符
2. **需要转义的字符** - `. * + ? ^ $ { } ( ) | [ ] \` 这些才是正则表达式的特殊字符
3. **使用单引号** - Shell 命令中使用单引号 `'${pattern}'` 避免 shell 解析

### 其他改进

1. **简化日志输出**：
```typescript
console.log(`[FallBack] Searching: "${shaderName}"`);
console.log(`[FallBack] ✓ Found: ${relativePath}:${lineNum + 1}`);
console.log(`[FallBack] ✓ Jump to: ${results[0].uri.fsPath}`);
console.log(`[FallBack] ✗ Not found`);
```

2. **避免触发无关搜索**：
```typescript
// FallBack 未找到时直接返回，不继续搜索符号
if (locations.length > 0) {
    resolve(locations);
    return;
}
reject();  // 不触发 getDefinitionLocations
return;
```

---
## ✅ 修复后的代码

```typescript
/**
 * 搜索 FallBack Shader
 * 支持搜索 Shader "ShaderName" 定义，例如：
 * - FallBack "Diffuse" -> 搜索 Shader "Diffuse"
 * - FallBack "Mobile/VertexLit" -> 搜索 Shader "Mobile/VertexLit"
 */
private async searchFallBackShader(shaderName: string, rootPath: string): Promise<Location[]> {
    const results: Location[] = [];
    const rgPath = getRgPath();
    
    console.log(`[FallBack] Searching: "${shaderName}"`);
    
    try {
        // 注意：/ 字符在 ripgrep 正则表达式中不是特殊字符，不需要转义
        // 只需要转义正则表达式的特殊字符：. * + ? ^ $ { } ( ) | [ ] \
        const escapedShaderName = shaderName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // 构建搜索模式：匹配 Shader "ShaderName" 行
        const pattern = `^\\s*Shader\\s+"${escapedShaderName}"`;
        
        // 执行 ripgrep 搜索（使用单引号避免 shell 解析转义字符）
        const execOpts = { cwd: rootPath, maxBuffer: 1024 * 1024 };
        const cmd = `"${rgPath}" -g "*.shader" --case-sensitive -H --line-number --hidden -e '${pattern}' .`;
        
        const output = execSync(cmd, execOpts);
        
        // 解析搜索结果
        const lines = output.toString().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
            // 解析 ripgrep 输出格式：filepath:lineNum:lineText
            const match = /^([^:]+):(\d+):(.+)$/.exec(line);
            if (!match) continue;
            
            const [, relativePath, lineNumStr, lineText] = match;
            const filepath = join(rootPath, relativePath);
            const lineNum = parseInt(lineNumStr) - 1;
            
            // 在行文本中查找 Shader 名称的精确位置
            const nameMatch = new RegExp(`Shader\\s+"([^"]+)"`, 'i').exec(lineText);
            if (nameMatch && nameMatch[1] === shaderName) {
                const startCol = lineText.indexOf(nameMatch[1]);
                const endCol = startCol + shaderName.length;
                const range = new Range(
                    new Position(lineNum, startCol),
                    new Position(lineNum, endCol)
                );
                results.push(new Location(Uri.file(filepath), range));
                console.log(`[FallBack] ✓ Found: ${relativePath}:${lineNum + 1}`);
            }
        }
        
        if (results.length === 0) {
            console.log(`[FallBack] ✗ Not found`);
        } else {
            console.log(`[FallBack] ✓ Jump to: ${results[0].uri.fsPath}`);
        }
    } catch (error: any) {
        // ripgrep 返回 status 1 表示没有找到匹配
        if (error.status === 1) {
            console.log(`[FallBack] ✗ Not found`);
        } else {
            console.error(`[FallBack] Error: ${error.message}`);
        }
    }
    
    return results;
}
```

**关键改进点**：
1. ✅ 使用单引号 `'${pattern}'` 包裹正则表达式
2. ✅ 简化日志输出（3-4 条关键信息）
3. ✅ 修复输出格式解析（移除列号匹配）
4. ✅ 添加跳转成功提示

---

## 🧪 测试验证

### 测试步骤
1. 重新加载 VS Code 窗口（`Cmd+Shift+P` -> "Reload Window"）
2. 打开测试文件：`Mobile-Diffuse.shader`
3. 找到这一行：`Fallback "Mobile/VertexLit"`
4. 将光标放在 `"Mobile/VertexLit"` 上
5. 按 `F12` 或 `Cmd/Ctrl + 点击`

### 预期结果
✅ 应该跳转到 `Mobile-VertexLit.shader` 文件的第 8 行

### 查看日志
打开开发者工具（`Help > Toggle Developer Tools`），在 Console 中应该看到：

**成功跳转**：
```
[FallBack] Searching: "Mobile/VertexLit"
[FallBack] ✓ Found: BuiltIn/Mobile/Mobile-VertexLit.shader:8
[FallBack] ✓ Jump to: /path/to/Mobile-VertexLit.shader
```

**未找到**：
```
[FallBack] Searching: "NonExistent"
[FallBack] ✗ Not found
```

### 其他测试用例

| 测试用例 | FallBack 语句 | 预期结果 |
|---------|--------------|---------|
| 简单名称 | `FallBack "Diffuse"` | ✅ 跳转到 Diffuse Shader |
| 单级路径 | `FallBack "Mobile/VertexLit"` | ✅ 跳转到 Mobile/VertexLit Shader |
| 多级路径 | `FallBack "CODM/Standard/Base"` | ✅ 跳转到对应 Shader |
| 不存在 | `FallBack "NonExistent"` | ❌ 无跳转，日志显示 "Not found" |
| 大小写 | `Fallback "Mobile/VertexLit"` | ✅ 支持不区分大小写 |

---

## 📊 修复对比

| 方面 | 修复前 | 修复后 |
|------|--------|--------|
| **功能** | ❌ 无法跳转带 `/` 的 Shader | ✅ 正确跳转所有 Shader |
| **日志数量** | 5-7 条 | 3-4 条 |
| **日志清晰度** | 混乱（包含路径、匹配数等） | 简洁（只显示关键信息） |
| **无关搜索** | ❌ 触发函数/宏搜索 | ✅ 不触发无关搜索 |
| **Shell 兼容性** | ❌ 双引号导致转义问题 | ✅ 单引号避免转义问题 |

---

## 🎯 关键改进点

1. ✅ **修复 Shell 命令** - 使用单引号包裹正则表达式
2. ✅ **简化日志输出** - 只显示：搜索什么、找到了吗、跳转了吗
3. ✅ **避免无关搜索** - FallBack 失败时直接返回，不触发符号搜索
4. ✅ **修复输出解析** - 正确解析 ripgrep 输出格式
5. ✅ **支持大小写** - FallBack/Fallback 都支持

---

## 📝 相关文件

- **修改文件**: `src/hlsl/definitionProvider.ts`
- **测试目录**: `/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders`
- **文档文件**: `FALLBACK_FIX.md`, `PROGRESS.md`

---

**修复版本**: v2.0  
**修复日期**: 2026-01-11
