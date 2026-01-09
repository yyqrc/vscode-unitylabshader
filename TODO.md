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

## ✅ Phase 3: 代码补全

### 3.1 添加 Unity 内置变量定义
- [ ] 创建 `src/unity/unityGlobals.ts` 文件
- [ ] 添加变换矩阵变量:
  - `UNITY_MATRIX_MVP`, `UNITY_MATRIX_M`, `UNITY_MATRIX_V`, `UNITY_MATRIX_P`
  - `UNITY_MATRIX_VP`, `UNITY_MATRIX_MV`, `UNITY_MATRIX_IT_MV`
  - `unity_ObjectToWorld`, `unity_WorldToObject`
- [ ] 添加相机参数:
  - `_WorldSpaceCameraPos`, `_ProjectionParams`, `_ScreenParams`, `_ZBufferParams`
- [ ] 添加时间变量:
  - `_Time`, `_SinTime`, `_CosTime`, `unity_DeltaTime`
- [ ] 添加光照变量:
  - `_WorldSpaceLightPos0`, `_LightColor0`, `unity_LightAtten`
  - `unity_4LightPosX0`, `unity_4LightPosY0`, `unity_4LightPosZ0`
- [ ] 添加雾效变量:
  - `unity_FogColor`, `unity_FogParams`
- [ ] 添加环境光/SH 变量

**验收标准**:
```
✓ 在 CGPROGRAM 块内输入 "UNITY_" 显示矩阵变量补全
✓ 在 CGPROGRAM 块内输入 "_Time" 显示时间变量补全
✓ 补全项包含变量类型和说明
```

---

### 3.2 添加 Unity 内置函数定义
- [ ] 添加空间转换函数:
  - `UnityObjectToWorldNormal`, `UnityObjectToWorldDir`, `UnityWorldToObjectDir`
  - `UnityObjectToClipPos`, `UnityWorldToClipPos`
  - `ComputeScreenPos`, `ComputeGrabScreenPos`
- [ ] 添加纹理采样宏/函数:
  - `tex2D`, `tex2Dlod`, `tex2Dproj`, `texCUBE`
  - `SAMPLE_TEXTURE2D`, `SAMPLE_TEXTURE2D_LOD`
- [ ] 添加光照计算函数:
  - `UnityWorldSpaceLightDir`, `UnityWorldSpaceViewDir`
  - `Shade4PointLights`, `ShadeSH9`
- [ ] 添加阴影相关宏:
  - `SHADOW_COORDS`, `TRANSFER_SHADOW`, `SHADOW_ATTENUATION`
- [ ] 添加雾效相关宏:
  - `UNITY_FOG_COORDS`, `UNITY_TRANSFER_FOG`, `UNITY_APPLY_FOG`
- [ ] 添加工具函数:
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
- [ ] 添加 ShaderLab 结构关键字补全:
  - `Shader`, `Properties`, `SubShader`, `Pass`
- [ ] 添加属性类型补全:
  - `2D`, `3D`, `Cube`, `Color`, `Vector`, `Float`, `Int`, `Range`
- [ ] 添加渲染状态补全:
  - `Blend`, `BlendOp`, `Cull`, `ZWrite`, `ZTest`, `ColorMask`
- [ ] 添加 Tags 补全:
  - `RenderType`, `Queue`, `LightMode`
- [ ] 添加 pragma 指令补全:
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
- [ ] 引入 Unity 全局定义
- [ ] 实现 ShaderLab 上下文检测（判断当前在 CGPROGRAM 内还是外）
- [ ] 根据上下文提供不同的补全项
- [ ] 确保保留原有 HLSL 基础补全

**验收标准**:
```
✓ 在 ShaderLab 区域和 HLSL 代码区域分别提供正确的补全
✓ 所有补全项按相关性排序
✓ 补全速度流畅，无明显延迟
```

---

## ✅ Phase 4: 悬停提示

### 4.1 添加 Unity 函数/变量悬停提示
- [ ] 为 Unity 内置变量添加悬停提示（类型 + 说明）
- [ ] 为 Unity 内置函数添加悬停提示（签名 + 参数说明 + 返回值）
- [ ] 添加 Unity 官方文档链接

**验收标准**:
```
✓ 鼠标悬停在 "UNITY_MATRIX_MVP" 上显示说明
✓ 鼠标悬停在 "UnityObjectToClipPos" 上显示函数签名和说明
✓ 悬停提示包含参数类型信息
```

---

### 4.2 添加 ShaderLab 悬停提示
- [ ] 为 ShaderLab 关键字添加悬停提示
- [ ] 为渲染状态添加悬停提示（如 Blend 的各种模式说明）
- [ ] 为 Tags 值添加悬停提示

**验收标准**:
```
✓ 鼠标悬停在 "Blend" 上显示混合模式说明
✓ 鼠标悬停在 "ZWrite" 上显示深度写入说明
```

---

### 4.3 修改 hoverProvider.ts
- [ ] 引入 Unity 全局定义
- [ ] 实现 ShaderLab 关键字识别
- [ ] 保留原有 HLSL 悬停提示

**验收标准**:
```
✓ HLSL 内置函数悬停提示正常
✓ Unity 特有函数悬停提示正常
✓ ShaderLab 关键字悬停提示正常
```

---

## ✅ Phase 5: 符号与导航

### 5.1 修改符号识别 (symbolProvider.ts)
- [ ] 添加 ShaderLab 结构识别:
  - `Shader "xxx"` → 识别为 Shader 符号
  - `Properties { }` → 识别为 Properties 块
  - `SubShader { }` → 识别为 SubShader 块
  - `Pass { }` → 识别为 Pass 块
- [ ] 保留原有 HLSL 符号识别:
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
- [ ] 确保函数定义跳转正常
- [ ] 确保变量定义跳转正常
- [ ] 确保 #include 文件跳转正常（如有）

**验收标准**:
```
✓ 在函数调用处按 F12 可以跳转到函数定义
✓ 在变量使用处按 F12 可以跳转到变量定义
```

---

### 5.3 修改引用查找 (referenceProvider.ts)
- [ ] 确保查找函数引用正常
- [ ] 确保查找变量引用正常

**验收标准**:
```
✓ 右键"查找所有引用"可以找到当前文档内的所有引用
```

---

## ✅ Phase 6: 代码片段

### 6.1 创建 snippets/unityshader.json
- [ ] 添加基础 Shader 模板 (`shader`)
- [ ] 添加 Surface Shader 模板 (`surfshader`)
- [ ] 添加 Unlit Shader 模板 (`unlitshader`)
- [ ] 添加 Pass 模板 (`pass`)
- [ ] 添加 Properties 模板 (`properties`)
- [ ] 添加 CGPROGRAM 块模板 (`cgprogram`)
- [ ] 添加 HLSLPROGRAM 块模板 (`hlslprogram`)
- [ ] 添加 struct 模板 (`struct`, `v2f`, `appdata`)
- [ ] 添加常用 pragma 指令模板

**验收标准**:
```
✓ 新建 .shader 文件，输入 "shader" 回车生成基础模板
✓ 输入 "cgprogram" 回车生成 CGPROGRAM 块
✓ 输入 "v2f" 回车生成顶点到片元结构体
```

---

### 6.2 更新 package.json 注册代码片段
- [ ] 在 contributes.snippets 中注册片段文件
- [ ] 确保片段对所有支持的文件类型生效

**验收标准**:
```
✓ 在 .shader、.cginc、.hlsl 文件中都可以使用代码片段
```

---

## ✅ Phase 7: URP 支持

### 7.1 创建 src/unity/urpGlobals.ts
- [ ] 添加 URP 常用函数:
  - `TransformObjectToHClip`, `TransformObjectToWorld`
  - `TransformWorldToHClip`, `TransformWorldToView`
  - `GetMainLight`, `GetAdditionalLight`
  - `LightingLambert`, `LightingSpecular`
- [ ] 添加 URP 常用变量:
  - `_MainLightPosition`, `_MainLightColor`
  - `_AdditionalLightsCount`
- [ ] 添加 URP 常用宏:
  - `_MAIN_LIGHT_SHADOWS`, `_ADDITIONAL_LIGHTS`
  - `_SHADOWS_SOFT`
- [ ] 添加 URP 常用 #include 路径提示

**验收标准**:
```
✓ 输入 "TransformObject" 显示 URP 空间变换函数补全
✓ 输入 "GetMain" 显示 GetMainLight 补全
✓ URP 函数有正确的悬停提示
```

---

### 7.2 添加 URP Shader 代码片段
- [ ] 添加 URP Unlit Shader 模板 (`urpunlit`)
- [ ] 添加 URP Lit Shader 模板 (`urplit`)
- [ ] 添加 URP Include 模板

**验收标准**:
```
✓ 输入 "urpunlit" 回车生成完整的 URP Unlit Shader 模板
```

---

### 7.3 添加配置项控制 URP 功能
- [ ] 添加 `unityshader.suggest.urp` 配置项
- [ ] 实现根据配置启用/禁用 URP 补全

**验收标准**:
```
✓ 设置 "unityshader.suggest.urp": false 后，URP 相关补全不再显示
```

---

## ✅ Phase 8: 优化与发布

### 8.1 代码清理与优化
- [ ] 删除所有 Unreal 相关代码和引用
- [ ] 代码格式化和 lint 检查
- [ ] 优化补全性能（延迟加载、缓存等）
- [ ] 添加必要的错误处理

**验收标准**:
```
✓ npm run lint 无错误
✓ npm run compile 编译通过
```

---

### 8.2 更新文档
- [ ] 更新 README.md
- [ ] 更新 CHANGELOG.md
- [ ] 添加功能截图

**验收标准**:
```
✓ README 清晰描述插件功能
✓ 包含安装和使用说明
```

---

### 8.3 测试与打包
- [ ] 在测试目录中进行完整功能测试
- [ ] 测试各种文件类型
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
| Phase 3: 代码补全 | 🔄 进行中 | 2025-01-09 | - |
| Phase 4: 悬停提示 | ⬜ 待开始 | - | - |
| Phase 5: 符号与导航 | ⬜ 待开始 | - | - |
| Phase 6: 代码片段 | ⬜ 待开始 | - | - |
| Phase 7: URP 支持 | ⬜ 待开始 | - | - |
| Phase 8: 优化与发布 | ⬜ 待开始 | - | - |

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
