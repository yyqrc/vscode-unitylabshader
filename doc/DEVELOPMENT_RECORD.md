# Unity Shader 语言支持插件 - 开发历史记录

> 📁 **测试目录**: `/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/`
>
> 每个阶段完成后都在该目录中进行验收测试。

## 📊 开发阶段概览

| 阶段 | 内容 | 预计工作量 | 实际工作量 | 状态 | 开始日期 | 完成日期 |
|------|------|-----------|------------|------|----------|----------|
| Phase 1 | 基础配置改造 | 1-2h | ~1.5h | ✅ 已完成 | 2025-01-09 | 2025-01-09 |
| Phase 2 | 语法高亮 | 2-4h | ~3h | ✅ 已完成 | 2025-01-09 | 2025-01-09 |
| Phase 3 | 代码补全 | 3-4h | ~3.5h | ✅ 已完成 | 2025-01-09 | 2025-01-09 |
| Phase 4 | 悬停提示 | 2-3h | ~2h | ✅ 已完成 | 2025-01-09 | 2025-01-09 |
| Phase 5 | 符号与导航 | 2-3h | ~2.5h | ✅ 已完成 | 2025-01-09 | 2025-01-09 |
| Phase 6 | 代码片段 | 1-2h | ~1h | ✅ 已完成 | 2025-01-09 | 2025-01-09 |
| Phase 7 | URP 支持 | 2-3h | ~2h | ✅ 已完成 | 2025-01-09 | 2025-01-09 |
| Phase 8 | 优化与发布 | 1-2h | ~1.5h | ✅ 已完成 | 2025-01-09 | 2025-01-09 |

**总计**: 14-20h 预计，~15h 实际完成

## 📝 Phase 1: 基础配置改造 (已完成 ✅)

### ✅ 1.1 修改 package.json
**修改内容**:
- 插件名称: `unrealshader` → `unityshader`
- 显示名称: "Unreal Shader" → "Unity Shader"
- 描述信息: 更新为 Unity Shader 语言支持描述
- 语言 ID: `unrealshader` → `unityshader`
- 支持的文件扩展名:
  - `.shader` (Unity ShaderLab)
  - `.cginc` (CG include)
  - `.hlsl` (HLSL)
  - `.hlsli` (HLSL include)
  - `.compute` (Compute Shader)
  - `.cg` (CG 文件)
- 配置项前缀: `hlsl.` → `unityshader.`
- 更新关键字、分类、图标等

**验收标准**:
✓ 在 VS Code 中打开测试目录的 .shader/.hlsl/.cginc/.compute 文件
✓ 文件右下角显示语言类型为 "Unity Shader"
✓ 插件成功激活（无错误）

**测试文件**:
- `/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/BuiltIn/Internal-Flare.shader`
- `/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/CODM/Colors.hlsl`
- `/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/Includes/HLSLSupport.cginc`
- `/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/CODM/ComputeShader/UpdateVRSAttachment.compute`

### ✅ 1.2 修改 extension.ts
**修改内容**:
- 更新语言 ID 引用
- 更新 documentSelector
- 确保激活条件正确
- 清理 Unreal 相关引用

**验收标准**:
✓ 打开任意支持的文件类型，插件正常激活
✓ 控制台无错误输出

### ✅ 1.3 修改 language-configuration.json
**修改内容**:
- 确保注释配置正确（`//` 和 `/* */`）
- 确保括号匹配正确
- 添加 ShaderLab 特有的括号配置

**验收标准**:
✓ 输入 `//` 可以正常注释
✓ 选中代码按 Cmd+/ 可以切换注释
✓ 括号自动配对正常

## 📝 Phase 2: 语法高亮 (已完成 ✅)

### ✅ 2.1 创建/修改 ShaderLab 语法高亮
**修改内容**:
- 重命名 `unrealshader.tmLanguage.json` → `unityshader.tmLanguage.json`
- 添加 ShaderLab 结构关键字高亮
- 添加 ShaderLab 代码块高亮（CGPROGRAM/ENDCG 等）
- 添加属性类型高亮（2D、Color、Float 等）
- 添加渲染状态关键字高亮（Blend、Cull、ZWrite 等）
- 添加 Tags 高亮（Tags、RenderType、Queue 等）
- 添加其他关键字高亮（LOD、FallBack、UsePass 等）

**验收标准**:
✓ 打开 .shader 文件，ShaderLab 关键字有颜色高亮
✓ Properties 块中的属性类型有正确高亮
✓ CGPROGRAM/ENDCG 块有正确高亮
✓ Tags 块内容有正确高亮

**测试文件**:
- `/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/BuiltIn/Mobile/Mobile-Diffuse.shader`

### ✅ 2.2 保留并优化 HLSL/CG 语法高亮
**修改内容**:
- 确保 HLSL 类型高亮正常（float、half、int、uint 等）
- 确保 HLSL 关键字高亮正常（struct、cbuffer、return 等）
- 确保预处理器高亮正常（#include、#define、#pragma 等）
- 确保函数调用高亮正常
- 确保数字、字符串高亮正常
- 确保注释高亮正常（单行/多行）

**验收标准**:
✓ 打开 .hlsl 文件，所有 HLSL 语法元素有正确高亮
✓ 打开 .cginc 文件，所有 CG 语法元素有正确高亮
✓ .shader 文件中 CGPROGRAM 块内的 HLSL 代码有正确高亮

**测试文件**:
- `/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/CODM/Colors.hlsl`
- `/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/Includes/HLSLSupport.cginc`

### ✅ 2.3 更新 package.json 中的语法配置
**修改内容**:
- 更新 grammars 配置指向新的语法文件
- 确保 scopeName 正确
- 确保文件关联正确

**验收标准**:
✓ 所有支持的文件类型都有正确的语法高亮
✓ 嵌入的 HLSL 代码块有正确高亮

## 📝 Phase 3: 代码补全 (已完成 ✅)

### ✅ 3.1 添加 Unity 内置变量定义
**实现内容**:
- 创建 `src/unity/unityGlobals.ts` 文件
- 添加变换矩阵变量（UNITY_MATRIX_MVP、UNITY_MATRIX_M 等）
- 添加相机参数（_WorldSpaceCameraPos、_ProjectionParams 等）
- 添加时间变量（_Time、_SinTime、_CosTime 等）
- 添加光照变量（_WorldSpaceLightPos0、_LightColor0 等）
- 添加雾效变量（unity_FogColor、unity_FogParams 等）
- 添加环境光/SH 变量

**验收标准**:
✓ 在 CGPROGRAM 块内输入 "UNITY_" 显示矩阵变量补全
✓ 在 CGPROGRAM 块内输入 "_Time" 显示时间变量补全
✓ 补全项包含变量类型和说明

### ✅ 3.2 添加 Unity 内置函数定义
**实现内容**:
- 添加空间转换函数（UnityObjectToWorldNormal、UnityObjectToClipPos 等）
- 添加纹理采样宏/函数（tex2D、SAMPLE_TEXTURE2D 等）
- 添加光照计算函数（UnityWorldSpaceLightDir、Shade4PointLights 等）
- 添加阴影相关宏（SHADOW_COORDS、TRANSFER_SHADOW 等）
- 添加雾效相关宏（UNITY_FOG_COORDS、UNITY_TRANSFER_FOG 等）
- 添加工具函数（DecodeFloatRGBA、LinearToGammaSpace 等）

**验收标准**:
✓ 输入 "UnityObject" 显示空间转换函数补全
✓ 输入 "tex2D" 显示纹理采样函数补全
✓ 输入 "SHADOW_" 显示阴影相关宏补全
✓ 补全项包含函数签名和参数说明

### ✅ 3.3 添加 ShaderLab 补全
**实现内容**:
- 添加 ShaderLab 结构关键字补全（Shader、Properties、SubShader、Pass 等）
- 添加属性类型补全（2D、Color、Float、Int、Range 等）
- 添加渲染状态补全（Blend、BlendOp、Cull、ZWrite 等）
- 添加 Tags 补全（Tags、RenderType、Queue、LightMode 等）
- 添加 pragma 指令补全（#pragma vertex、#pragma fragment 等）

**验收标准**:
✓ 在 Properties 块内输入属性类型有补全
✓ 在 Pass 块内输入 "Blend" 有补全
✓ 输入 "#pragma " 有指令补全

### ✅ 3.4 修改 completionProvider.ts
**实现内容**:
- 引入 Unity 全局定义
- 实现 ShaderLab 上下文检测（判断当前在 CGPROGRAM 内还是外）
- 根据上下文提供不同的补全项
- 确保保留原有 HLSL 基础补全

**验收标准**:
✓ 在 ShaderLab 区域和 HLSL 代码区域分别提供正确的补全
✓ 所有补全项按相关性排序
✓ 补全速度流畅，无明显延迟

## 📝 Phase 4: 悬停提示 (已完成 ✅)

### ✅ 4.1 添加 Unity 函数/变量悬停提示
**实现内容**:
- 为 Unity 内置变量添加悬停提示（类型 + 说明）
- 为 Unity 内置函数添加悬停提示（签名 + 参数说明 + 返回值）
- 添加 Unity 官方文档链接

**验收标准**:
✓ 鼠标悬停在 "UNITY_MATRIX_MVP" 上显示说明
✓ 鼠标悬停在 "UnityObjectToClipPos" 上显示函数签名和说明
✓ 悬停提示包含参数类型信息

### ✅ 4.2 添加 ShaderLab 悬停提示
**实现内容**:
- 为 ShaderLab 关键字添加悬停提示
- 为渲染状态添加悬停提示（如 Blend 的各种模式说明）
- 为 Tags 值添加悬停提示

**验收标准**:
✓ 鼠标悬停在 "Blend" 上显示混合模式说明
✓ 鼠标悬停在 "ZWrite" 上显示深度写入说明

### ✅ 4.3 修改 hoverProvider.ts
**实现内容**:
- 引入 Unity 全局定义
- 实现 ShaderLab 关键字识别
- 保留原有 HLSL 悬停提示
- 添加中英双语描述，移除外部文档链接依赖

**验收标准**:
✓ HLSL 内置函数悬停提示正常
✓ Unity 特有函数悬停提示正常
✓ ShaderLab 关键字悬停提示正常

## 📝 Phase 5: 符号与导航 (已完成 ✅)

### ✅ 5.1 修改符号识别 (symbolProvider.ts)
**实现内容**:
- 添加 ShaderLab 结构识别（Shader、Properties、SubShader、Pass 等）
- 保留原有 HLSL 符号识别（函数、结构体、cbuffer、变量等）
- 支持大纲视图显示 Shader 结构层次

**验收标准**:
✓ 打开 .shader 文件，大纲视图显示 Shader 结构层次
✓ 大纲视图显示 Properties、SubShader、Pass 等块
✓ CGPROGRAM 内的函数在大纲中正确显示

**测试**: 打开测试文件，按 `Cmd+Shift+O` 查看符号列表

### ✅ 5.2 修改定义跳转 (definitionProvider.ts)
**实现内容**:
- 确保函数定义跳转正常
- 确保变量定义跳转正常
- 添加 #include 文件跳转支持
- 添加 FallBack Shader 跳转支持

**验收标准**:
✓ 在函数调用处按 F12 可以跳转到函数定义
✓ 在变量使用处按 F12 可以跳转到变量定义
✓ 在 #include "xxx.cginc" 上按 F12 可以跳转到对应文件
✓ 在 FallBack "Diffuse" 上按 F12 可以跳转到对应 Shader

**新增功能说明**:
1. **#include 跳转**:
   - 支持相对路径（相对于当前文件）
   - 支持工作区根目录路径
   - 支持文件名搜索（使用 ripgrep）
   
2. **FallBack 跳转**:
   - 搜索工作区中所有 .shader 文件
   - 查找匹配的 Shader "xxx" 定义
   - 支持多个匹配结果

### ✅ 5.3 修改引用查找 (referenceProvider.ts)
**实现内容**:
- 确保查找函数引用正常
- 确保查找变量引用正常
- 支持当前文档内的引用查找

**验收标准**:
✓ 右键"查找所有引用"可以找到当前文档内的所有引用

## 📝 Phase 6: 代码片段 (已完成 ✅)

### ✅ 6.1 创建 snippets/unityshader.json
**实现内容**:
- 添加基础 Shader 模板 (`shader`)
- 添加 Surface Shader 模板 (`surfshader`)
- 添加 Unlit Shader 模板 (`unlitshader`)
- 添加 Pass 模板 (`pass`)
- 添加 Properties 模板 (`properties`)
- 添加 CGPROGRAM 块模板 (`cgprogram`)
- 添加 HLSLPROGRAM 块模板 (`hlslprogram`)
- 添加 struct 模板 (`struct`, `v2f`, `appdata`)
- 添加常用 pragma 指令模板
- 添加 URP Shader 模板 (`urpunlit`, `urplit`)

**验收标准**:
✓ 新建 .shader 文件，输入 "shader" 回车生成基础模板
✓ 输入 "cgprogram" 回车生成 CGPROGRAM 块
✓ 输入 "v2f" 回车生成顶点到片元结构体

### ✅ 6.2 更新 package.json 注册代码片段
**实现内容**:
- 在 contributes.snippets 中注册片段文件
- 确保片段对所有支持的文件类型生效（.shader, .hlsl, .cginc, .compute）

**验收标准**:
✓ 在 .shader、.cginc、.hlsl、.compute 文件中都可以使用代码片段
✓ 代码片段有正确的描述和占位符

## 📝 Phase 7: URP 支持 (已完成 ✅)

### ✅ 7.1 创建 src/unity/urpGlobals.ts
**实现内容**:
- 添加 URP 常用函数（TransformObjectToHClip、GetMainLight 等）
- 添加 URP 常用变量（_MainLightPosition、_MainLightColor 等）
- 添加 URP 常用宏（_MAIN_LIGHT_SHADOWS、_ADDITIONAL_LIGHTS 等）
- 添加 URP 常用 #include 路径提示

**验收标准**:
✓ 输入 "TransformObject" 显示 URP 空间变换函数补全
✓ 输入 "GetMain" 显示 GetMainLight 补全
✓ URP 函数有正确的悬停提示

### ✅ 7.2 添加 URP Shader 代码片段
**实现内容**:
- 添加 URP Unlit Shader 模板 (`urpunlit`)
- 添加 URP Lit Shader 模板 (`urplit`)
- 添加 URP Include 模板

**验收标准**:
✓ 输入 "urpunlit" 回车生成完整的 URP Unlit Shader 模板
✓ 输入 "urplit" 回车生成完整的 URP Lit Shader 模板

### ✅ 7.3 添加配置项控制 URP 功能
**实现内容**:
- 添加 `unityshader.suggest.urp` 配置项
- 实现根据配置启用/禁用 URP 补全

**验收标准**:
✓ 设置 "unityshader.suggest.urp": false 后，URP 相关补全不再显示
✓ 设置 "unityshader.suggest.urp": true 后，URP 补全正常显示

## 📝 Phase 8: 优化与发布 (已完成 ✅)

### ✅ 8.1 代码清理与优化
**实现内容**:
- 删除所有 Unreal 相关代码和引用
- 代码格式化和 lint 检查
- 优化补全性能（延迟加载、缓存等）
- 添加必要的错误处理
- 更新文件路径和引用关系

**验收标准**:
✓ npm run lint 无错误
✓ npm run compile 编译通过
✓ 无 Unreal 相关代码残留
✓ 插件激活速度 < 2s

### ✅ 8.2 更新文档
**实现内容**:
- 更新 README.md，清晰描述插件功能
- 更新 CHANGELOG.md，记录版本变化
- 添加功能截图和演示 GIF
- 添加安装和使用说明
- 添加配置项说明

**验收标准**:
✓ README 包含完整的功能列表和使用示例
✓ CHANGELOG 记录所有功能变更
✓ 文档中包含安装步骤
✓ 文档中包含配置选项说明

### ✅ 8.3 测试与打包
**实现内容**:
- 在测试目录中进行完整功能测试
- 测试各种文件类型（.shader, .hlsl, .cginc, .compute）
- 确保所有核心功能在测试文件上正常工作
- 准备插件打包配置文件

**验收标准**:
✓ 所有功能在测试文件上正常工作
✓ 语法高亮、补全、悬停、符号导航等核心功能正常
✓ 插件配置文件准备就绪（package.json, README, CHANGELOG 等）

## 📁 文件修改清单（已完成）

### ✅ 修改的现有文件:
```
package.json                              # 插件配置
src/extension.ts                          # 入口文件
src/hlsl/completionProvider.ts            # 代码补全
src/hlsl/hoverProvider.ts                 # 悬停提示
src/hlsl/symbolProvider.ts                # 符号识别
src/hlsl/definitionProvider.ts           # 定义跳转
src/hlsl/referenceProvider.ts             # 引用查找
src/hlsl/signatureProvider.ts             # 函数签名
src/hlsl/hlslGlobals.ts                   # HLSL 全局定义
language-configuration.json               # 语言配置
syntaxes/unityshader.tmLanguage.json      # 语法高亮（重命名）
```

### ✅ 新增的文件:
```
src/unity/unityGlobals.ts                 # Unity 内置定义
src/unity/urpGlobals.ts                   # URP 内置定义
snippets/unityshader.json                 # 代码片段
syntaxes/unityshader.tmLanguage.json      # 新语法文件
```

### ✅ 删除的文件:
```
所有 Unreal 相关的残留文件和引用已被清理
```

## 🧪 自测总结（2026-01-10）

### 核心功能测试通过:
- **Phase 1**: 文件识别和插件激活正常
- **Phase 2**: ShaderLab 和 HLSL 语法高亮正常
- **Phase 3**: 代码补全功能正常，Unity 内置函数和变量补全正常
- **Phase 4**: 悬停提示功能正常，中英双语描述显示正常
- **Phase 5**: 符号导航功能正常，大纲视图正确显示结构层次
- **Phase 6**: 代码片段功能正常，支持各种 Shader 模板
- **Phase 7**: URP 支持功能正常，URP 函数补全和代码片段可用
- **Phase 8**: 代码清理完成，无 Unreal 相关代码残留

### 测试文件验证:
1. `/Assets/Shaders/BuiltIn/Mobile/Mobile-Diffuse.shader` - ShaderLab 语法高亮正常
2. `/Assets/Shaders/CODM/Colors.hlsl` - HLSL 语法高亮正常
3. `/Assets/Shaders/Includes/HLSLSupport.cginc` - CG 语法高亮正常
4. `/Assets/Shaders/CODM/ComputeShader/UpdateVRSAttachment.compute` - Compute Shader 支持正常

### 验收标准达成:
- [x] 所有支持的文件类型正确识别为 "Unity Shader"
- [x] ShaderLab 关键字高亮正常
- [x] HLSL/CG 代码高亮正常
- [x] Unity 内置变量/函数补全正常
- [x] 悬停提示显示函数签名和描述
- [x] 大纲视图显示正确的结构层次
- [x] #include 文件跳转正常
- [x] 代码片段生成正常
- [x] URP 支持功能正常

---

## 📋 关键验收测试用例（简化版）

### 1. 语法高亮测试
```
# 测试文件: Mobile-Diffuse.shader
✓ Shader 关键字高亮
✓ Properties 块高亮
✓ SubShader/Pass 块高亮
✓ CGPROGRAM/ENDCG 块高亮
✓ Tags 块高亮
✓ HLSL 代码高亮
```

### 2. 代码补全测试
```
# 在 CGPROGRAM 块中输入:
✓ 输入 "UNITY_" → 显示矩阵变量补全
✓ 输入 "UnityObject" → 显示空间转换函数补全
✓ 输入 "tex2D" → 显示纹理采样函数补全
✓ 输入 "#pragma " → 显示指令补全

# 在 ShaderLab 区域输入:
✓ 在 Properties 块内输入 "2D" 有补全
✓ 在 Pass 块内输入 "Blend" 有补全
```

### 3. 悬停提示测试
```
# 悬停在各种符号上:
✓ 悬停在 "UNITY_MATRIX_MVP" 上 → 显示说明信息
✓ 悬停在 "UnityObjectToClipPos" 上 → 显示函数签名
✓ 悬停在 "Blend" 上 → 显示混合模式说明
✓ 悬停在 "ZWrite" 上 → 显示深度写入说明
✓ 悬停在 "#pragma vertex" 上 → 显示指令说明
```

### 4. 符号导航测试
```
# 导航功能:
✓ 按 Cmd+Shift+O → 显示 Shader 结构大纲
✓ 在函数调用处按 F12 → 跳转到函数定义
✓ 在 #include 处按 F12 → 跳转到包含文件
✓ 右键 "查找所有引用" → 找到当前文档内的所有引用
```

### 5. 代码片段测试
```
# 在 .shader 文件中:
✓ 输入 "shader" → Tab → 生成完整 Shader 模板
✓ 输入 "properties" → Tab → 生成 Properties 块模板
✓ 输入 "cgprogram" → Tab → 生成 CGPROGRAM 块
✓ 输入 "v2f" → Tab → 生成顶点到片元结构体
✓ 输入 "urpunlit" → Tab → 生成 URP Unlit Shader 模板
```

### 6. URP 支持测试
```
# 在 .shader 文件中:
✓ 输入 "TransformObject" → 显示 URP 函数补全
✓ 输入 "GetMainLight" → 显示 URP 光照函数补全
✓ 输入 "_MainLightPosition" → 显示 URP 变量补全
✓ 悬停在 URP 函数上 → 显示 URP 特有说明
```

### 7. 跨文件功能测试
```
# #include 和 FallBack 跳转:
✓ 在 #include "HLSLSupport.cginc" 上按 F12 → 跳转到对应文件
✓ 在 FallBack "Diffuse" 上按 F12 → 跳转到 Diffuse.shader
✓ 在函数定义上右键 → 显示所有引用位置
✓ 在变量定义上右键 → 显示所有引用位置
```

---

**文档创建时间**: 2026-01-11  
**最后更新**: 2026-01-11  
**版本**: v1.0.0 (基础版)

---

> **注意**: 本文件记录了 Phase 1-8 的完整开发历史，详细的功能规格和验收标准。对于 Phase 9.X 的后续优化计划，请查看 [TECHNICAL_SPEC.md](doc/TECHNICAL_SPEC.md)。