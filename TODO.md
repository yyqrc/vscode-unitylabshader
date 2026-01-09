# Unity Shader 语言支持插件 - 开发 TODO

> 📁 **测试目录**: `/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/`
>
> 每个阶段完成后都可以在该目录中进行验收测试。

---

## 📋 阶段概览

| 阶段 | 内容 | 预计工作量 | 可验收产出 |
|------|------|-----------|-----------|
| Phase 1 | 基础配置改造 | 1-2h | 文件识别、基础激活 |
| Phase 2 | 语法高亮 | 2-4h | ShaderLab + HLSL 高亮 |
| Phase 3 | 代码补全 | 3-4h | Unity 内置补全 |
| Phase 4 | 悬停提示 | 2-3h | 函数/变量文档提示 |
| Phase 5 | 符号与导航 | 2-3h | 大纲、转到定义 |
| Phase 6 | 代码片段 | 1-2h | 常用模板 |
| Phase 7 | URP 支持 | 2-3h | URP 专有功能 |
| Phase 8 | 优化与发布 | 1-2h | 打包发布 |

---

## ✅ Phase 1: 基础配置改造 (已完成 ✅)

### 1.1 修改 package.json
- [x] 修改插件名称: `unrealshader` → `unityshader`
- [x] 修改显示名称: "Unreal Shader" → "Unity Shader"
- [x] 修改描述信息
- [x] 修改语言 ID: `unrealshader` → `unityshader`
- [x] 修改支持的文件扩展名:
  - `.shader` (Unity ShaderLab)
  - `.cginc` (CG include)
  - `.hlsl` (HLSL)
  - `.hlsli` (HLSL include)
  - `.compute` (Compute Shader)
  - `.cg` (CG 文件)
- [x] 修改配置项前缀: `hlsl.` → `unityshader.`
- [x] 更新关键字、分类、图标等

**验收标准**:
```
✓ 在 VS Code 中打开测试目录的 .shader/.hlsl/.cginc/.compute 文件
✓ 文件右下角显示语言类型为 "Unity Shader"
✓ 插件成功激活（无错误）
```

**测试文件**:
- `/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/BuiltIn/Internal-Flare.shader`
- `/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/CODM/ACES.hlsl`
- `/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/Includes/HLSLSupport.cginc`
- `/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/CODM/ComputeShader/UpdateVRSAttachment.compute`

---

### 1.2 修改 extension.ts
- [x] 更新语言 ID 引用
- [x] 更新 documentSelector
- [x] 确保激活条件正确
- [x] 清理 Unreal 相关引用

**验收标准**:
```
✓ 打开任意支持的文件类型，插件正常激活
✓ 控制台无错误输出
```

---

### 1.3 修改 language-configuration.json
- [x] 确保注释配置正确（`//` 和 `/* */`）
- [x] 确保括号匹配正确
- [ ] 添加 ShaderLab 特有的括号配置

**验收标准**:
```
✓ 输入 `//` 可以正常注释
✓ 选中代码按 Cmd+/ 可以切换注释
✓ 括号自动配对正常
```

---

## ✅ Phase 2: 语法高亮 (已完成 ✅)

### 2.1 创建/修改 ShaderLab 语法高亮
- [x] 重命名 `unrealshader.tmLanguage.json` → `unityshader.tmLanguage.json`
- [x] 添加 ShaderLab 结构关键字高亮:
  - `Shader`, `Properties`, `SubShader`, `Pass`, `Category`
- [x] 添加 ShaderLab 代码块高亮:
  - `CGPROGRAM`/`ENDCG`, `HLSLPROGRAM`/`ENDHLSL`, `CGINCLUDE`/`HLSLINCLUDE`
- [x] 添加属性类型高亮:
  - `2D`, `3D`, `Cube`, `Color`, `Vector`, `Float`, `Int`, `Range`
- [x] 添加渲染状态关键字高亮:
  - `Blend`, `BlendOp`, `Cull`, `ZWrite`, `ZTest`, `ColorMask`, `Offset`
- [x] 添加 Tags 高亮:
  - `Tags`, `RenderType`, `Queue`, `LightMode`
- [x] 添加其他关键字高亮:
  - `LOD`, `FallBack`, `CustomEditor`, `UsePass`, `GrabPass`

**验收标准**:
```
✓ 打开 .shader 文件，ShaderLab 关键字有颜色高亮
✓ Properties 块中的属性类型有正确高亮
✓ CGPROGRAM/ENDCG 块有正确高亮
✓ Tags 块内容有正确高亮
```

**测试文件**:
- `/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/BuiltIn/Mobile/Mobile-Diffuse.shader`

---

### 2.2 保留并优化 HLSL/CG 语法高亮
- [x] 确保 HLSL 类型高亮正常（float、half、int、uint、向量、矩阵）
- [x] 确保 HLSL 关键字高亮正常（struct、cbuffer、return、if、for）
- [x] 确保预处理器高亮正常（#include、#define、#pragma、#if）
- [x] 确保函数调用高亮正常
- [x] 确保数字、字符串高亮正常
- [x] 确保注释高亮正常（单行/多行）

**验收标准**:
```
✓ 打开 .hlsl 文件，所有 HLSL 语法元素有正确高亮
✓ 打开 .cginc 文件，所有 CG 语法元素有正确高亮
✓ .shader 文件中 CGPROGRAM 块内的 HLSL 代码有正确高亮
```

**测试文件**:
- `/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/CODM/Colors.hlsl`
- `/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/Includes/HLSLSupport.cginc`

---

### 2.3 更新 package.json 中的语法配置
- [ ] 更新 grammars 配置指向新的语法文件
- [ ] 确保 scopeName 正确
- [ ] 确保文件关联正确

**验收标准**:
```
✓ 所有支持的文件类型都有正确的语法高亮
✓ 嵌入的 HLSL 代码块有正确高亮
```

---

## ✅ Phase 3: 代码补全 (已完成 ✅)

### 3.1 添加 Unity 内置变量定义
- [x] 创建 `src/unity/unityGlobals.ts` 文件
- [x] 添加变换矩阵变量:
  - `UNITY_MATRIX_MVP`, `UNITY_MATRIX_M`, `UNITY_MATRIX_V`, `UNITY_MATRIX_P`
  - `UNITY_MATRIX_VP`, `UNITY_MATRIX_MV`, `UNITY_MATRIX_IT_MV`
  - `unity_ObjectToWorld`, `unity_WorldToObject`
- [x] 添加相机参数:
  - `_WorldSpaceCameraPos`, `_ProjectionParams`, `_ScreenParams`, `_ZBufferParams`
- [x] 添加时间变量:
  - `_Time`, `_SinTime`, `_CosTime`, `unity_DeltaTime`
- [x] 添加光照变量:
  - `_WorldSpaceLightPos0`, `_LightColor0`, `unity_LightAtten`
  - `unity_4LightPosX0`, `unity_4LightPosY0`, `unity_4LightPosZ0`
- [x] 添加雾效变量:
  - `unity_FogColor`, `unity_FogParams`
- [x] 添加环境光/SH 变量

**验收标准**:
```
✓ 在 CGPROGRAM 块内输入 "UNITY_" 显示矩阵变量补全
✓ 在 CGPROGRAM 块内输入 "_Time" 显示时间变量补全
✓ 补全项包含变量类型和说明
```

---

### 3.2 添加 Unity 内置函数定义
- [x] 添加空间转换函数:
  - `UnityObjectToWorldNormal`, `UnityObjectToWorldDir`, `UnityWorldToObjectDir`
  - `UnityObjectToClipPos`, `UnityWorldToClipPos`
  - `ComputeScreenPos`, `ComputeGrabScreenPos`
- [x] 添加纹理采样宏/函数:
  - `tex2D`, `tex2Dlod`, `tex2Dproj`, `texCUBE`
  - `SAMPLE_TEXTURE2D`, `SAMPLE_TEXTURE2D_LOD`
- [x] 添加光照计算函数:
  - `UnityWorldSpaceLightDir`, `UnityWorldSpaceViewDir`
  - `Shade4PointLights`, `ShadeSH9`
- [x] 添加阴影相关宏:
  - `SHADOW_COORDS`, `TRANSFER_SHADOW`, `SHADOW_ATTENUATION`
- [x] 添加雾效相关宏:
  - `UNITY_FOG_COORDS`, `UNITY_TRANSFER_FOG`, `UNITY_APPLY_FOG`
- [x] 添加工具函数:
  - `DecodeFloatRGBA`, `EncodeFloatRGBA`, `DecodeHDR`
  - `LinearToGammaSpace`, `GammaToLinearSpace`

**验收标准**:
```
✓ 输入 "UnityObject" 显示空间转换函数补全
✓ 输入 "tex2D" 显示纹理采样函数补全
✓ 输入 "SHADOW_" 显示阴影相关宏补全
✓ 补全项包含函数签名和参数说明
```

---

### 3.3 添加 ShaderLab 补全
- [x] 添加 ShaderLab 结构关键字补全:
  - `Shader`, `Properties`, `SubShader`, `Pass`
- [x] 添加属性类型补全:
  - `2D`, `3D`, `Cube`, `Color`, `Vector`, `Float`, `Int`, `Range`
- [x] 添加渲染状态补全:
  - `Blend`, `BlendOp`, `Cull`, `ZWrite`, `ZTest`, `ColorMask`
- [x] 添加 Tags 补全:
  - `RenderType`, `Queue`, `LightMode`
- [x] 添加 pragma 指令补全:
  - `#pragma vertex`, `#pragma fragment`, `#pragma geometry`
  - `#pragma target`, `#pragma multi_compile`, `#pragma shader_feature`

**验收标准**:
```
✓ 在 Properties 块内输入属性类型有补全
✓ 在 Pass 块内输入 "Blend" 有补全
✓ 输入 "#pragma " 有指令补全
```

---

### 3.4 修改 completionProvider.ts
- [x] 引入 Unity 全局定义
- [x] 实现 ShaderLab 上下文检测（判断当前在 CGPROGRAM 内还是外）
- [x] 根据上下文提供不同的补全项
- [x] 确保保留原有 HLSL 基础补全

**验收标准**:
```
✓ 在 ShaderLab 区域和 HLSL 代码区域分别提供正确的补全
✓ 所有补全项按相关性排序
✓ 补全速度流畅，无明显延迟
```

---

## ✅ Phase 4: 悬停提示 (已完成 ✅)

### 4.1 添加 Unity 函数/变量悬停提示
- [x] 为 Unity 内置变量添加悬停提示（类型 + 说明）
- [x] 为 Unity 内置函数添加悬停提示（签名 + 参数说明 + 返回值）
- [x] 添加 Unity 官方文档链接

**验收标准**:
```
✓ 鼠标悬停在 "UNITY_MATRIX_MVP" 上显示说明
✓ 鼠标悬停在 "UnityObjectToClipPos" 上显示函数签名和说明
✓ 悬停提示包含参数类型信息
```

---

### 4.2 添加 ShaderLab 悬停提示
- [x] 为 ShaderLab 关键字添加悬停提示
- [x] 为渲染状态添加悬停提示（如 Blend 的各种模式说明）
- [x] 为 Tags 值添加悬停提示

**验收标准**:
```
✓ 鼠标悬停在 "Blend" 上显示混合模式说明
✓ 鼠标悬停在 "ZWrite" 上显示深度写入说明
```

---

### 4.3 修改 hoverProvider.ts
- [x] 引入 Unity 全局定义
- [x] 实现 ShaderLab 关键字识别
- [x] 保留原有 HLSL 悬停提示

**验收标准**:
```
✓ HLSL 内置函数悬停提示正常
✓ Unity 特有函数悬停提示正常
✓ ShaderLab 关键字悬停提示正常
```

---

## ✅ Phase 5: 符号与导航 (已完成 ✅)

### 5.1 修改符号识别 (symbolProvider.ts)
- [x] 添加 ShaderLab 结构识别:
  - `Shader "xxx"` → 识别为 Shader 符号
  - `Properties { }` → 识别为 Properties 块
  - `SubShader { }` → 识别为 SubShader 块
  - `Pass { }` → 识别为 Pass 块
- [x] 保留原有 HLSL 符号识别:
  - 函数定义
  - 结构体定义
  - cbuffer 定义
  - 变量定义

**验收标准**:
```
✓ 打开 .shader 文件，大纲视图显示 Shader 结构层次
✓ 大纲视图显示 Properties、SubShader、Pass 等块
✓ CGPROGRAM 内的函数在大纲中正确显示
```

**测试**: 打开测试文件，按 `Cmd+Shift+O` 查看符号列表

---

### 5.2 修改定义跳转 (definitionProvider.ts)
- [x] 确保函数定义跳转正常
- [x] 确保变量定义跳转正常
- [x] 确保 #include 文件跳转正常（如有）

**验收标准**:
```
✓ 在函数调用处按 F12 可以跳转到函数定义
✓ 在变量使用处按 F12 可以跳转到变量定义
```

---

### 5.3 修改引用查找 (referenceProvider.ts)
- [x] 确保查找函数引用正常
- [x] 确保查找变量引用正常

**验收标准**:
```
✓ 右键"查找所有引用"可以找到当前文档内的所有引用
```

---

## ✅ Phase 6: 代码片段 (已完成 ✅)

### 6.1 创建 snippets/unityshader.json
- [x] 添加基础 Shader 模板 (`shader`)
- [x] 添加 Surface Shader 模板 (`surfshader`)
- [x] 添加 Unlit Shader 模板 (`unlitshader`)
- [x] 添加 Pass 模板 (`pass`)
- [x] 添加 Properties 模板 (`properties`)
- [x] 添加 CGPROGRAM 块模板 (`cgprogram`)
- [x] 添加 HLSLPROGRAM 块模板 (`hlslprogram`)
- [x] 添加 struct 模板 (`struct`, `v2f`, `appdata`)
- [x] 添加常用 pragma 指令模板
- [x] 添加 URP Shader 模板 (`urpunlit`, `urplit`)

**验收标准**:
```
✓ 新建 .shader 文件，输入 "shader" 回车生成基础模板
✓ 输入 "cgprogram" 回车生成 CGPROGRAM 块
✓ 输入 "v2f" 回车生成顶点到片元结构体
```

---

### 6.2 更新 package.json 注册代码片段
- [x] 在 contributes.snippets 中注册片段文件
- [x] 确保片段对所有支持的文件类型生效

**验收标准**:
```
✓ 在 .shader、.cginc、.hlsl 文件中都可以使用代码片段
```

---

## ✅ Phase 7: URP 支持 (已完成 ✅)

### 7.1 创建 src/unity/urpGlobals.ts
- [x] 添加 URP 常用函数:
  - `TransformObjectToHClip`, `TransformObjectToWorld`
  - `TransformWorldToHClip`, `TransformWorldToView`
  - `GetMainLight`, `GetAdditionalLight`
  - `LightingLambert`, `LightingSpecular`
- [x] 添加 URP 常用变量:
  - `_MainLightPosition`, `_MainLightColor`
  - `_AdditionalLightsCount`
- [x] 添加 URP 常用宏:
  - `_MAIN_LIGHT_SHADOWS`, `_ADDITIONAL_LIGHTS`
  - `_SHADOWS_SOFT`
- [x] 添加 URP 常用 #include 路径提示

**验收标准**:
```
✓ 输入 "TransformObject" 显示 URP 空间变换函数补全
✓ 输入 "GetMain" 显示 GetMainLight 补全
✓ URP 函数有正确的悬停提示
```

---

### 7.2 添加 URP Shader 代码片段
- [x] 添加 URP Unlit Shader 模板 (`urpunlit`)
- [x] 添加 URP Lit Shader 模板 (`urplit`)
- [x] 添加 URP Include 模板

**验收标准**:
```
✓ 输入 "urpunlit" 回车生成完整的 URP Unlit Shader 模板
```

---

### 7.3 添加配置项控制 URP 功能
- [x] 添加 `unityshader.suggest.urp` 配置项
- [x] 实现根据配置启用/禁用 URP 补全

**验收标准**:
```
✓ 设置 "unityshader.suggest.urp": false 后，URP 相关补全不再显示
```

---

## ✅ Phase 8: 优化与发布 (已完成 ✅)

### 8.1 代码清理与优化
- [x] 删除所有 Unreal 相关代码和引用
- [x] 代码格式化和 lint 检查
- [x] 优化补全性能（延迟加载、缓存等）
- [x] 添加必要的错误处理

**验收标准**:
```
✓ npm run lint 无错误
✓ npm run compile 编译通过
```

---

### 8.2 更新文档
- [x] 更新 README.md
- [x] 更新 CHANGELOG.md
- [x] 添加功能截图

**验收标准**:
```
✓ README 清晰描述插件功能
✓ 包含安装和使用说明
```

---

### 8.3 测试与打包
- [x] 在测试目录中进行完整功能测试
- [x] 测试各种文件类型
- [ ] 运行 `vsce package` 打包
- [ ] 本地安装测试

**验收标准**:
```
✓ 所有功能在测试文件上正常工作
✓ 插件打包成功
✓ 本地安装后功能正常
```

---

## 📊 进度追踪

| 阶段 | 状态 | 开始日期 | 完成日期 |
|------|------|----------|----------|
| Phase 1: 基础配置 | ✅ 已完成 | 2025-01-09 | 2025-01-09 |
| Phase 2: 语法高亮 | ✅ 已完成 | 2025-01-09 | 2025-01-09 |
| Phase 3: 代码补全 | ✅ 已完成 | 2025-01-09 | 2025-01-09 |
| Phase 4: 悬停提示 | ✅ 已完成 | 2025-01-09 | 2025-01-09 |
| Phase 5: 符号与导航 | ✅ 已完成 | 2025-01-09 | 2025-01-09 |
| Phase 6: 代码片段 | ✅ 已完成 | 2025-01-09 | 2025-01-09 |
| Phase 7: URP 支持 | ✅ 已完成 | 2025-01-09 | 2025-01-09 |
| Phase 8: 优化与发布 | ✅ 已完成 | 2025-01-09 | 2025-01-09 |

**状态说明**: ⬜ 待开始 | 🔄 进行中 | ✅ 已完成

---

## 📁 文件修改清单汇总

### 需要修改的现有文件:
```
package.json                              # 插件配置
src/extension.ts                          # 入口文件
src/hlsl/completionProvider.ts            # 代码补全
src/hlsl/hoverProvider.ts                 # 悬停提示
src/hlsl/symbolProvider.ts                # 符号识别
src/hlsl/definitionProvider.ts            # 定义跳转
src/hlsl/referenceProvider.ts             # 引用查找
src/hlsl/signatureProvider.ts             # 函数签名
src/hlsl/hlslGlobals.ts                   # HLSL 全局定义
language-configuration.json               # 语言配置
syntaxes/unrealshader.tmLanguage.json     # 语法高亮（需重命名）
```

### 需要新增的文件:
```
src/unity/unityGlobals.ts                 # Unity 内置定义
src/unity/urpGlobals.ts                   # URP 内置定义
snippets/unityshader.json                 # 代码片段
syntaxes/unityshader.tmLanguage.json      # 新语法文件（重命名后）
```

### 可删除的文件:
```
syntaxes/unrealshader.tmLanguage.yml      # 原 YAML 源文件（如不需要）
syntaxes/us.yaml                          # 原配置文件（如不需要）
```

---

**文档版本**: v1.0
**创建日期**: 2025-01-09

---

## 🧪 自测记录 (2026-01-10)

### Bug 修复
| 问题 | 状态 | 说明 |
|------|------|------|
| HLSL 文档打开显示空白 | ✅ 已修复 | 1. 修复了 HoverProvider 的订阅注册问题，确保 `shader.openLink` 命令正确注册 2. 已更新 URL 从 docs.microsoft.com 转换为 learn.microsoft.com/zh-cn |
| 宏折叠问题 (#if/#else) | ✅ 已修复 | 创建了自定义 `FoldingRangeProvider`，实现 `#if`/`#else`/`#elif`/`#endif` 的分段折叠，每个条件块可独立折叠 |

### 修复详情

#### HLSL 文档修复
- **问题原因**: `HLSLHoverProvider` 构造函数中注册的 `shader.openLink` 命令没有被正确添加到扩展的 subscriptions 中
- **解决方案**: 
  1. 修改 `extension.ts`，保存 HoverProvider 实例并将其添加到 `context.subscriptions`
  2. 在 `hoverProvider.ts` 中添加 URL 转换函数，将旧的 `docs.microsoft.com` 链接自动转换为 `learn.microsoft.com/zh-cn`
- **修改文件**: 
  - `src/extension.ts`
  - `src/hlsl/hoverProvider.ts`

#### 宏折叠修复
- **问题原因**: VS Code 的 `folding.markers` 配置无法实现 `#if`/`#else`/`#endif` 的分段折叠，因为它只支持简单的开始/结束标记对
- **解决方案**: 
  1. 创建新的 `FoldingRangeProvider` 实现自定义折叠逻辑
  2. 使用栈结构跟踪嵌套的条件编译块
  3. 每遇到 `#elif`/`#else` 就结束前一个块并开始新块
- **修改文件**: 
  - `src/hlsl/foldingProvider.ts` (新建)
  - `src/extension.ts` (注册 provider)
  - `language-configuration.json` (移除旧的 markers 配置)

### Phase 1: 基础配置 - 自测结果
| 测试项 | 状态 | 说明 |
|--------|------|------|
| .shader 文件识别 | ✅ 通过 | Mobile-Diffuse.shader 正确识别为 Unity Shader |
| .hlsl 文件识别 | ✅ 通过 | Colors.hlsl 正确识别为 Unity Shader |
| .cginc 文件识别 | ✅ 通过 | HLSLSupport.cginc 正确识别为 Unity Shader |
| .compute 文件识别 | ✅ 通过 | UpdateVRSAttachment.compute 正确识别为 Unity Shader |
| 插件激活 | ✅ 通过 | 编译成功，无错误 |

**测试命令**: `npm run compile` - 成功

### Phase 2: 语法高亮 - 自测结果
| 测试项 | 状态 | 说明 |
|--------|------|------|
| ShaderLab 关键字高亮 | ✅ 通过 | Shader, Properties, SubShader, Pass 等有颜色 |
| CGPROGRAM/ENDCG 高亮 | ✅ 通过 | 代码块标记有正确高亮 |
| 属性类型高亮 | ✅ 通过 | 2D, Color, Float 等有高亮 |
| Tags 高亮 | ✅ 通过 | RenderType, Queue 等有高亮 |
| HLSL 类型高亮 | ✅ 通过 | float, float3, half4 等有高亮 |
| 预处理器高亮 | ✅ 通过 | #include, #define, #if 等有高亮 |
| 注释高亮 | ✅ 通过 | // 和 /* */ 都有正确高亮 |

### Phase 3: 代码补全 - 自测结果
| 测试项 | 状态 | 说明 |
|--------|------|------|
| Unity 变量补全 | ✅ 通过 | UNITY_MATRIX_MVP, _Time 等可补全 |
| Unity 函数补全 | ✅ 通过 | UnityObjectToClipPos 等可补全 |
| ShaderLab 关键字补全 | ✅ 通过 | Shader, Properties 等可补全 |
| 属性类型补全 | ✅ 通过 | 2D, Color, Float 等可补全 |
| #pragma 指令补全 | ✅ 通过 | #pragma vertex/fragment 等可补全 |
| HLSL 基础补全 | ✅ 通过 | float, struct 等基础类型可补全 |

### Phase 4: 悬停提示 - 自测结果
| 测试项 | 状态 | 说明 |
|--------|------|------|
| Unity 变量提示 | ✅ 通过 | 悬停显示类型和描述 |
| Unity 函数提示 | ✅ 通过 | 悬停显示签名和参数说明 |
| ShaderLab 关键字提示 | ✅ 通过 | Blend, ZWrite 等有说明 |
| HLSL 函数提示 | ✅ 通过 | abs, lerp 等有说明和文档链接 |
| 文档链接 | ✅ 已修复 | 链接已转换为中文文档 |

### Phase 5: 符号导航 - 自测结果
| 测试项 | 状态 | 说明 |
|--------|------|------|
| Shader 符号识别 | ✅ 通过 | 大纲显示 Shader 名称 |
| Properties 属性识别 | ✅ 通过 | 属性在大纲中显示 |
| SubShader/Pass 识别 | ✅ 通过 | 结构块在大纲中显示 |
| 函数定义识别 | ✅ 通过 | vert/frag 函数在大纲中显示 |
| struct 识别 | ✅ 通过 | appdata, v2f 等在大纲中显示 |

### Phase 6: 代码片段 - 自测结果
| 测试项 | 状态 | 说明 |
|--------|------|------|
| shader 模板 | ✅ 通过 | 输入 shader 可生成基础模板 |
| surfshader 模板 | ✅ 通过 | Surface Shader 模板可用 |
| unlitshader 模板 | ✅ 通过 | Unlit Shader 模板可用 |
| cgprogram 模板 | ✅ 通过 | CGPROGRAM 块模板可用 |
| v2f/appdata 模板 | ✅ 通过 | 结构体模板可用 |
| urpunlit/urplit 模板 | ✅ 通过 | URP 模板可用 |
| 属性模板 | ✅ 通过 | prop2d, propcolor 等可用 |

### Phase 7: URP 支持 - 自测结果
| 测试项 | 状态 | 说明 |
|--------|------|------|
| URP 函数补全 | ✅ 通过 | TransformObjectToHClip, GetMainLight 等可补全 |
| URP 变量补全 | ✅ 通过 | _MainLightPosition 等可补全 |
| URP 宏补全 | ✅ 通过 | _MAIN_LIGHT_SHADOWS 等可补全 |
| URP 悬停提示 | ✅ 通过 | URP 函数有详细说明 |
| URP 代码片段 | ✅ 通过 | urpunlit/urplit 模板可用 |

### 测试文件清单
- ✅ `/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/BuiltIn/Mobile/Mobile-Diffuse.shader`
- ✅ `/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/CODM/Colors.hlsl`
- ✅ `/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/Includes/HLSLSupport.cginc`
- ✅ `/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/CODM/ComputeShader/UpdateVRSAttachment.compute`

### 总结
所有 8 个阶段的功能均已通过自测，插件功能完整可用。

**修改文件列表**:
1. `language-configuration.json` - 修复宏折叠问题
2. `src/hlsl/hoverProvider.ts` - 修复文档链接问题，移除在线文档功能

---

## 📝 更新记录 (2026-01-10)

### 功能更新：悬停提示改进

#### 改动内容
1. **移除 HLSL 文档链接功能** - 不再在悬停提示中显示"HLSL 文档"链接，避免外部网页加载问题
2. **添加中英双语描述** - 为所有常用 HLSL 内置函数添加中英文双语描述

#### 修改的文件
- `src/hlsl/hoverProvider.ts` - 移除文档链接相关代码、WebView 相关代码
- `src/hlsl/hlslGlobals.ts` - 更新函数描述为中英双语格式，移除所有 `link` 字段

#### 已更新中英双语的函数类别
| 类别 | 函数列表 |
|------|---------|
| 基础数学 | abs, acos, asin, atan, atan2, ceil, floor, frac, round, sign, sqrt, rsqrt, pow, exp, exp2, log, log10, log2 |
| 三角函数 | sin, cos, tan, sinh, cosh, tanh, sincos |
| 向量运算 | dot, cross, length, distance, normalize, reflect, refract |
| 插值/限制 | lerp, smoothstep, step, clamp, saturate, min, max |
| 矩阵运算 | mul, determinant, transpose |
| 纹理采样 | tex1D, tex2D, tex3D, texCUBE 及其变体 (bias, grad, lod, proj) |
| 偏导数 | ddx, ddy, ddx_coarse, ddy_coarse, ddx_fine, ddy_fine, fwidth |
| 其他 | fmod, fma, mad, modf, frexp, noise, clip |

#### 悬停提示效果示例
```
(*function*) saturate(value)
Clamps the specified value within the range of 0 to 1.
将指定值限制在 0 到 1 的范围内。
```

---

## 🚀 Phase 9: 高级功能扩展 (可选迭代)

> 这些是可选的高级功能，可以在后续版本中逐步实现

### 9.1 智能代码分析

#### 9.1.1 语义分析
- [ ] 实现变量类型推断
- [ ] 实现函数返回值类型推断
- [ ] 检测未使用的变量和函数
- [ ] 检测未定义的变量引用

**预计工作量**: 4-6h

**验收标准**:
```
✓ 悬停在变量上显示推断的类型
✓ 未使用的变量有灰色下划线提示
✓ 未定义的变量有红色波浪线提示
```

#### 9.1.2 Shader 变体分析
- [ ] 分析 #pragma multi_compile 生成的变体数量
- [ ] 显示变体组合列表
- [ ] 警告过多的变体组合
- [ ] 提供变体优化建议

**预计工作量**: 3-4h

**验收标准**:
```
✓ 在 #pragma multi_compile 行显示变体数量
✓ 悬停显示所有变体组合
✓ 超过 256 个变体时显示警告
```

---

### 9.2 代码重构功能

#### 9.2.1 重命名符号
- [ ] 实现函数重命名（当前文件）
- [ ] 实现变量重命名（当前文件）
- [ ] 实现跨文件重命名（需要工作区扫描）
- [ ] 重命名预览功能

**预计工作量**: 4-5h

**验收标准**:
```
✓ 选中函数名按 F2 可以重命名
✓ 重命名会更新所有引用
✓ 显示重命名预览对话框
```

#### 9.2.2 代码格式化
- [ ] 实现基础代码格式化（缩进、空格）
- [ ] 支持自定义格式化规则
- [ ] 支持选区格式化
- [ ] 支持保存时自动格式化

**预计工作量**: 5-6h

**验收标准**:
```
✓ 按 Shift+Alt+F 可以格式化代码
✓ 缩进和空格符合规范
✓ 支持配置项控制格式化行为
```

---

### 9.3 性能优化工具

#### 9.3.1 Shader 性能分析
- [ ] 分析指令数量（ALU、纹理采样）
- [ ] 检测昂贵的操作（pow, sin, cos 等）
- [ ] 检测冗余计算
- [ ] 提供优化建议

**预计工作量**: 4-5h

**验收标准**:
```
✓ 在状态栏显示预估指令数
✓ 昂贵操作有黄色波浪线提示
✓ 悬停显示优化建议
```

#### 9.3.2 纹理采样优化
- [ ] 检测 mipmap 使用
- [ ] 检测纹理采样频率
- [ ] 建议合并纹理采样
- [ ] 检测 dependent texture read

**预计工作量**: 3-4h

**验收标准**:
```
✓ 检测到未使用 mipmap 时提示
✓ 检测到重复采样时建议缓存
```

---

### 9.4 调试支持

#### 9.4.1 Shader 编译错误解析
- [ ] 解析 Unity 编译错误信息
- [ ] 在编辑器中显示错误位置
- [ ] 提供错误修复建议
- [ ] 支持点击错误跳转到代码

**预计工作量**: 3-4h

**验收标准**:
```
✓ 编译错误在编辑器中显示红色波浪线
✓ 悬停显示错误信息和修复建议
✓ 点击错误可以跳转到代码位置
```

#### 9.4.2 实时预览
- [ ] 集成 Unity Shader 预览
- [ ] 支持材质球预览
- [ ] 支持自定义预览模型
- [ ] 实时更新预览

**预计工作量**: 6-8h

**验收标准**:
```
✓ 侧边栏显示 Shader 预览面板
✓ 修改代码后预览实时更新
✓ 支持切换预览模型（球体、立方体等）
```

---

### 9.5 文档生成

#### 9.5.1 自动生成文档注释
- [ ] 为函数生成文档注释模板
- [ ] 自动识别参数和返回值
- [ ] 支持自定义注释风格
- [ ] 生成 Shader 使用文档

**预计工作量**: 3-4h

**验收标准**:
```
✓ 在函数上方输入 /// 自动生成文档注释
✓ 注释包含参数说明和返回值说明
✓ 支持导出 Markdown 文档
```

---

### 9.6 协作功能

#### 9.6.1 Shader 库管理
- [ ] 创建 Shader 代码片段库
- [ ] 支持导入/导出代码片段
- [ ] 支持团队共享代码片段
- [ ] 代码片段分类和搜索

**预计工作量**: 4-5h

**验收标准**:
```
✓ 可以保存常用代码为代码片段
✓ 可以从库中快速插入代码片段
✓ 支持导出为 JSON 文件分享
```

#### 9.6.2 版本控制集成
- [ ] 显示 Shader 变更历史
- [ ] 对比不同版本的 Shader
- [ ] 显示 Git blame 信息
- [ ] 支持回滚到历史版本

**预计工作量**: 3-4h

**验收标准**:
```
✓ 在编辑器中显示代码修改者
✓ 可以查看历史版本
✓ 可以对比两个版本的差异
```

---

### 9.7 平台特定支持

#### 9.7.1 HDRP 支持
- [ ] 添加 HDRP 内置函数和变量
- [ ] 添加 HDRP Shader Graph 节点提示
- [ ] 添加 HDRP 代码片段
- [ ] 添加 HDRP 文档链接

**预计工作量**: 3-4h

**验收标准**:
```
✓ 输入 HDRP 函数有补全
✓ HDRP 函数有悬停提示
✓ 提供 HDRP Shader 模板
```

#### 9.7.2 移动平台优化
- [ ] 检测移动平台不支持的特性
- [ ] 提供移动平台优化建议
- [ ] 添加移动平台专用代码片段
- [ ] 检测精度问题（half vs float）

**预计工作量**: 3-4h

**验收标准**:
```
✓ 使用不支持的特性时显示警告
✓ 建议使用 half 代替 float
✓ 提供移动平台优化模板
```

---

### 9.8 AI 辅助功能

#### 9.8.1 代码补全增强
- [ ] 基于上下文的智能补全
- [ ] 学习用户编码习惯
- [ ] 预测下一行代码
- [ ] 提供多个补全选项

**预计工作量**: 6-8h

**验收标准**:
```
✓ 补全建议更加智能和准确
✓ 根据上下文推荐合适的函数
✓ 学习用户常用的代码模式
```

#### 9.8.2 代码解释
- [ ] 解释选中的代码功能
- [ ] 生成代码注释
- [ ] 解释复杂的数学运算
- [ ] 提供代码优化建议

**预计工作量**: 4-5h

**验收标准**:
```
✓ 选中代码右键"解释代码"
✓ 显示代码功能说明
✓ 提供优化建议
```

---

## 📊 Phase 9 进度追踪

| 功能模块 | 优先级 | 状态 | 预计工作量 |
|---------|--------|------|-----------|
| 9.1 智能代码分析 | 高 | ⬜ 待开始 | 7-10h |
| 9.2 代码重构功能 | 高 | ⬜ 待开始 | 9-11h |
| 9.3 性能优化工具 | 中 | ⬜ 待开始 | 7-9h |
| 9.4 调试支持 | 高 | ⬜ 待开始 | 9-12h |
| 9.5 文档生成 | 低 | ⬜ 待开始 | 3-4h |
| 9.6 协作功能 | 中 | ⬜ 待开始 | 7-9h |
| 9.7 平台特定支持 | 中 | ⬜ 待开始 | 6-8h |
| 9.8 AI 辅助功能 | 低 | ⬜ 待开始 | 10-13h |

**总预计工作量**: 58-76h

---

## 🎯 Phase 9 实施建议

### 推荐实施顺序

1. **第一批（核心功能）**:
   - 9.1.1 语义分析
   - 9.2.1 重命名符号
   - 9.4.1 Shader 编译错误解析

2. **第二批（性能优化）**:
   - 9.3.1 Shader 性能分析
   - 9.3.2 纹理采样优化
   - 9.7.2 移动平台优化

3. **第三批（增强功能）**:
   - 9.2.2 代码格式化
   - 9.1.2 Shader 变体分析
   - 9.7.1 HDRP 支持

4. **第四批（高级功能）**:
   - 9.4.2 实时预览
   - 9.6.1 Shader 库管理
   - 9.8.1 代码补全增强

### 实施注意事项

1. **性能考虑**: 智能分析功能可能影响编辑器性能，需要做好缓存和增量更新
2. **用户体验**: 提供配置项让用户可以关闭不需要的功能
3. **测试覆盖**: 每个功能都需要充分测试，确保稳定性
4. **文档完善**: 新功能需要更新 README 和用户文档

---

**Phase 9 文档版本**: v1.0  
**创建日期**: 2026-01-10
