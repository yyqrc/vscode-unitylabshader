# 符号缓存系统测试指南

## 测试环境准备

1. 确保工作区包含多个 shader 文件（.shader, .hlsl, .cginc 等）
2. 编译扩展：`npm run compile`
3. 按 F5 启动调试模式

## 功能测试清单

### 1. 初始缓存构建测试

**测试步骤：**
1. 首次打开工作区
2. 观察通知：应显示 "Building symbol cache"
3. 等待构建完成
4. 检查缓存文件是否生成

**验证方法：**
- 打开命令面板 → `Developer: Open Global Storage`
- 进入 `symbol-cache` 目录
- 应该看到 `{hash}-symbol-cache.json` 文件

**预期结果：**
- 缓存文件成功生成
- 文件包含所有 shader 文件的符号信息
- 符号路径为相对路径（不是绝对路径）

---

### 2. 符号跳转测试（缓存命中）

**测试步骤：**
1. 打开任意 shader 文件
2. 找到一个函数调用（如 `NormalizePerPixelNormal`）
3. 按住 Ctrl/Cmd 点击函数名
4. 观察控制台输出

**预期结果：**
- 日志显示：`[PersistentCache] ✓ Hit (time: Xms)`
- 成功跳转到函数定义位置
- 跳转速度 < 10ms

---

### 3. 清除缓存命令测试

**测试步骤：**
1. 打开命令面板 (Ctrl+Shift+P / Cmd+Shift+P)
2. 运行 `Unity Shader: Clear Symbol Cache`
3. 观察通知消息
4. 检查缓存文件是否被删除

**预期结果：**
- 显示成功消息："Symbol cache cleared successfully"
- 缓存文件被删除
- 下次跳转会触发 FallBack 搜索

---

### 4. 重建缓存命令测试

**测试步骤：**
1. 打开命令面板
2. 运行 `Unity Shader: Build Symbol Cache`
3. 观察进度通知
4. 等待完成

**预期结果：**
- 显示进度："Rebuilding symbol cache..."
- 显示成功消息："Symbol cache rebuilt successfully"
- 缓存文件重新生成
- 符号跳转恢复正常

---

### 5. 文件修改自动更新测试

**测试步骤：**
1. 打开一个 shader 文件
2. 添加一个新函数：
   ```hlsl
   float4 TestFunction(float3 pos) {
       return float4(pos, 1.0);
   }
   ```
3. 保存文件
4. 等待 500ms（防抖延迟）
5. 在另一个文件中调用 `TestFunction` 并尝试跳转

**预期结果：**
- 控制台显示：`Processing file change: modified - path/to/file.hlsl`
- 控制台显示：`Updated cache for path/to/file.hlsl, found X symbols`
- 能够成功跳转到新添加的函数

---

### 6. 文件删除自动更新测试

**测试步骤：**
1. 创建一个临时 shader 文件
2. 等待缓存更新
3. 删除该文件
4. 等待 500ms
5. 检查缓存文件

**预期结果：**
- 控制台显示：`Processing file change: deleted - path/to/file.hlsl`
- 控制台显示：`Removed cache for path/to/file.hlsl`
- 缓存中不再包含该文件的符号

---

### 7. 跨文件移动检测测试

**测试步骤：**
1. 在文件 A 中定义一个函数：
   ```hlsl
   float4 MovableFunction(float3 pos) {
       return float4(pos, 1.0);
   }
   ```
2. 保存并等待缓存更新
3. 将该函数剪切到文件 B
4. 保存两个文件
5. 观察控制台输出

**预期结果：**
- 控制台显示：`Detected symbol move: MovableFunction from fileA to fileB`
- 缓存正确更新
- 跳转到新位置

---

### 8. FallBack 搜索测试

**测试步骤：**
1. 打开一个包含 `FallBack "ShaderName"` 的 shader 文件
2. 按住 Ctrl/Cmd 点击 Shader 名称
3. 观察控制台输出

**预期结果：**
- 控制台显示：`[FallBack] Searching: "ShaderName"`
- 控制台显示：`[FallBack] Command: ...` （包含多个文件类型）
- 如果找到：`[FallBack] ✓ Found: path/to/shader:line`
- 如果未找到：`[FallBack] ✗ Not found`

**测试用例：**
- 测试 `FallBack "Diffuse"`
- 测试 `FallBack "Mobile/VertexLit"`
- 测试不存在的 Shader 名称

---

### 9. 路径标准化测试

**测试步骤：**
1. 清除缓存
2. 重建缓存
3. 打开缓存文件 `{hash}-symbol-cache.json`
4. 检查符号的 `filePath` 字段

**预期结果：**
- 所有路径都是相对路径（如 `ShaderOnlineUpdate/Shader/MSParticle_PBR_OnlineUpdate.shader`）
- 没有绝对路径（如 `g:\COD\Client\Assets\...`）
- 路径使用正斜杠 `/` 而非反斜杠 `\`

---

### 10. 性能测试

**测试步骤：**
1. 记录初始缓存构建时间
2. 记录符号查找时间（观察控制台日志）
3. 记录文件更新时间

**预期性能指标：**
- 初始构建：2-10秒（取决于项目大小）
- 缓存命中查找：< 10ms
- 单文件更新：< 50ms
- FallBack 搜索：< 100ms

---

## 常见问题排查

### 问题 1：缓存未命中

**症状：**
- 控制台显示 `[PersistentCache] ✗ Miss`
- 每次跳转都使用 FallBack 搜索

**排查步骤：**
1. 检查缓存文件是否存在
2. 检查符号名称是否正确
3. 运行 `Unity Shader: Build Symbol Cache` 重建缓存

### 问题 2：跳转路径错误

**症状：**
- 跳转时路径重复（如 `workspace/workspace/file.hlsl`）

**排查步骤：**
1. 检查缓存文件中的路径格式
2. 确认是相对路径而非绝对路径
3. 清除并重建缓存

### 问题 3：文件修改未更新

**症状：**
- 修改文件后，跳转到旧位置

**排查步骤：**
1. 检查文件监听器是否正常工作
2. 观察控制台是否有 `Processing file change` 日志
3. 手动运行 `Unity Shader: Build Symbol Cache`

---

## 调试技巧

### 启用详细日志

在 `definitionProvider.ts` 中，`devLog` 方法会输出详细日志到控制台。

### 查看缓存内容

```bash
# Windows
code %APPDATA%\Code\User\globalStorage\<extension-id>\symbol-cache\

# macOS
code ~/Library/Application\ Support/Code/User/globalStorage/<extension-id>/symbol-cache/

# Linux
code ~/.config/Code/User/globalStorage/<extension-id>/symbol-cache/
```

### 监控性能

观察控制台日志中的时间戳：
- `[PersistentCache] ✓ Hit (time: Xms)`
- `[FallBack] ✓ Found (time: Xms)`

---

## 测试报告模板

```
测试日期：____________________
测试人员：____________________
项目规模：____ 个文件

| 测试项 | 状态 | 备注 |
|--------|------|------|
| 初始缓存构建 | ✓/✗ | 耗时：____ |
| 符号跳转（缓存命中） | ✓/✗ | 耗时：____ |
| 清除缓存命令 | ✓/✗ | |
| 重建缓存命令 | ✓/✗ | |
| 文件修改自动更新 | ✓/✗ | |
| 文件删除自动更新 | ✓/✗ | |
| 跨文件移动检测 | ✓/✗ | |
| FallBack 搜索 | ✓/✗ | |
| 路径标准化 | ✓/✗ | |
| 性能测试 | ✓/✗ | |

总体评价：____________________
```
