# FallBack 跳转功能测试指南

## 🎯 测试目标

验证 FallBack 跳转功能是否正确工作，特别是：
1. ✅ 能否跳转到包含 `/` 字符的 Shader 名称
2. ✅ 日志输出是否简洁清晰
3. ✅ 是否避免了无关的函数/宏搜索

---

## 📋 测试前准备

### 1. 重新编译插件
```bash
cd /Users/ashiqi/Documents/vscode-unitylabshader
npm run compile
```

### 2. 重新加载 VS Code
- 按 `Cmd+Shift+P`（Mac）或 `Ctrl+Shift+P`（Windows）
- 输入 "Reload Window"
- 回车

### 3. 打开开发者工具
- 菜单：`Help > Toggle Developer Tools`
- 切换到 `Console` 标签页
- 清空控制台（点击 🚫 图标）

---

## 🧪 测试用例

### 测试 1: 简单 Shader 名称
**文件**: 任意 `.shader` 文件  
**代码**: `FallBack "Diffuse"`

**操作**:
1. 将光标放在 `"Diffuse"` 上
2. 按 `F12` 或 `Cmd/Ctrl + 点击`

**预期结果**:
- ✅ 跳转到 Diffuse Shader 定义
- 日志输出：
  ```
  [FallBack] Searching: "Diffuse"
  [FallBack] ✓ Found: path/to/Diffuse.shader:X
  [FallBack] ✓ Jump to: /full/path/to/Diffuse.shader
  ```

---

### 测试 2: 带单级路径的 Shader 名称（关键测试）
**文件**: `Mobile-Diffuse.shader`  
**代码**: `Fallback "Mobile/VertexLit"`

**操作**:
1. 打开文件：`/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/BuiltIn/Mobile/Mobile-Diffuse.shader`
2. 找到 `Fallback "Mobile/VertexLit"` 这一行
3. 将光标放在 `"Mobile/VertexLit"` 上
4. 按 `F12`

**预期结果**:
- ✅ 跳转到 `Mobile-VertexLit.shader` 文件的第 8 行
- 日志输出：
  ```
  [FallBack] Searching: "Mobile/VertexLit"
  [FallBack] ✓ Found: BuiltIn/Mobile/Mobile-VertexLit.shader:8
  [FallBack] ✓ Jump to: /Users/ashiqi/Documents/UGit/.../Mobile-VertexLit.shader
  ```
- ❌ **不应该**看到任何函数搜索日志（如 "Error searching function definitions"）

---

### 测试 3: 带多级路径的 Shader 名称
**文件**: 任意 `.shader` 文件  
**代码**: `FallBack "CODM/Standard/Base"`

**操作**:
1. 将光标放在 `"CODM/Standard/Base"` 上
2. 按 `F12`

**预期结果**:
- ✅ 跳转到对应的 CODM Shader（如果存在）
- 日志输出：
  ```
  [FallBack] Searching: "CODM/Standard/Base"
  [FallBack] ✓ Found: CODM/Standard/Base.shader:X
  [FallBack] ✓ Jump to: /full/path/to/Base.shader
  ```

---

### 测试 4: 不存在的 Shader
**文件**: 任意 `.shader` 文件  
**代码**: `FallBack "NonExistentShader"`

**操作**:
1. 将光标放在 `"NonExistentShader"` 上
2. 按 `F12`

**预期结果**:
- ❌ 无跳转
- 日志输出：
  ```
  [FallBack] Searching: "NonExistentShader"
  [FallBack] ✗ Not found
  ```
- ❌ **不应该**看到任何函数搜索日志

---

### 测试 5: 大小写不敏感
**文件**: 任意 `.shader` 文件  
**代码**: `Fallback "Mobile/VertexLit"`（注意 `Fallback` 首字母大写）

**操作**:
1. 将光标放在 `"Mobile/VertexLit"` 上
2. 按 `F12`

**预期结果**:
- ✅ 跳转到 `Mobile-VertexLit.shader`
- 日志输出正常

---

## ✅ 验收标准

### 功能验收
- [ ] 测试 1 通过：简单名称可以跳转
- [ ] 测试 2 通过：带 `/` 的名称可以跳转（**关键**）
- [ ] 测试 3 通过：多级路径可以跳转
- [ ] 测试 4 通过：不存在的 Shader 不跳转，日志清晰
- [ ] 测试 5 通过：支持大小写不敏感

### 日志验收
- [ ] 每次 FallBack 跳转只产生 3-4 条日志
- [ ] 日志格式清晰：`[FallBack] Searching: "xxx"`
- [ ] 成功时显示：`[FallBack] ✓ Found: ...` 和 `[FallBack] ✓ Jump to: ...`
- [ ] 失败时显示：`[FallBack] ✗ Not found`
- [ ] **不应该**看到函数/宏/结构体搜索的日志

### 性能验收
- [ ] 跳转响应速度快（< 1 秒）
- [ ] 不会触发无关的文件搜索

---

## 🐛 常见问题排查

### 问题 1: 仍然无法跳转到 `Mobile/VertexLit`
**排查步骤**:
1. 检查是否重新编译：`npm run compile`
2. 检查是否重新加载窗口：`Reload Window`
3. 查看控制台日志，确认搜索命令是否正确
4. 手动测试 ripgrep 命令：
   ```bash
   cd /Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders
   rg -g "*.shader" --case-sensitive -H --line-number --hidden -e '^\s*Shader\s+"Mobile\/VertexLit"' .
   ```

### 问题 2: 日志中仍然有大量函数搜索信息
**原因**: FallBack 跳转失败后触发了符号搜索  
**排查步骤**:
1. 确认光标是否在 Shader 名称上（引号内）
2. 确认 FallBack 语句格式是否正确
3. 检查代码中是否正确添加了 `reject()` 返回

### 问题 3: 日志显示 "Error: ..."
**排查步骤**:
1. 查看完整的错误信息
2. 检查 ripgrep 路径是否正确
3. 检查工作区路径是否正确
4. 检查文件权限

---

## 📊 测试报告模板

```markdown
## FallBack 跳转功能测试报告

**测试日期**: 2026-01-11  
**测试人员**: [你的名字]  
**插件版本**: 0.1.1

### 测试结果

| 测试用例 | 状态 | 备注 |
|---------|------|------|
| 测试 1: 简单名称 | ✅ / ❌ | |
| 测试 2: 单级路径 | ✅ / ❌ | |
| 测试 3: 多级路径 | ✅ / ❌ | |
| 测试 4: 不存在 | ✅ / ❌ | |
| 测试 5: 大小写 | ✅ / ❌ | |

### 日志示例

**成功跳转**:
```
[粘贴实际日志]
```

**失败情况**:
```
[粘贴实际日志]
```

### 问题记录

[记录遇到的问题]

### 总结

[测试总结]
```

---

**文档版本**: v1.0  
**创建日期**: 2026-01-11
