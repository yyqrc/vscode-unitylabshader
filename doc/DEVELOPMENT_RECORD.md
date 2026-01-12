# Unity Shader 语言支持插件 - 开发历史记录

> 📁 **测试目录**: `/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/`
>
> 每个阶段完成后都在该目录中进行验收测试。

## � 开发阶段概览

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 1 | 基础配置改造 | ✅ 已完成 |
| Phase 2 | 语法高亮 | ✅ 已完成 |
| Phase 3 | 代码补全 | ✅ 已完成 |
| Phase 4 | 悬停提示 | ✅ 已完成 |
| Phase 5 | 符号与导航 | ✅ 已完成 |
| Phase 6 | 代码片段 | ✅ 已完成 |
| Phase 7 | URP 支持 | ✅ 已完成 |
| Phase 8 | 优化与发布 | ✅ 已完成 |

**所有基础功能开发完成**

## Phase 1: 基础配置改造 (已完成)

### 1.1 修改 package.json
- 插件名称更新: `unrealshader` → `unityshader`
- 支持的文件扩展名: `.shader`, `.cginc`, `.hlsl`, `.hlsli`, `.compute`, `.cg`
- 配置项前缀更新: `hlsl.` → `unityshader.`
- 更新描述和分类

### 1.2 修改 extension.ts
- 更新语言ID引用
- 更新文档选择器
- 清理Unreal相关引用

### 1.3 修改 language-configuration.json
- 配置注释支持 (`//` 和 `/* */`)
- 括号匹配配置
- ShaderLab特有配置

## Phase 2: 语法高亮支持 (已完成)

### 2.1 ShaderLab语法支持
- 语法高亮文件重命名: `unrealshader.tmLanguage.json` → `unityshader.tmLanguage.json`
- 添加ShaderLab结构关键字高亮: Shader、Properties、SubShader、Pass等
- 添加ShaderLab代码块高亮: CGPROGRAM/ENDCG、HLSLPROGRAM/ENDHLSL等
- 添加属性类型高亮: 2D、Color、Float、Range、Int等
- 添加渲染状态高亮: Blend、Cull、ZWrite、ZTest等
- 添加Tags高亮: Tags、RenderType、Queue、LightMode等
- 添加其他关键字高亮: LOD、FallBack、UsePass、GrabPass等

### 2.2 HLSL/CG语法保持
- 保留原有的HLSL类型高亮: float、half、int、uint等
- 保留HLSL关键字高亮: struct、cbuffer、return、if、for等
- 预处理器高亮: #include、#define、#pragma等
- 函数调用、数字、字符串、注释高亮保持

### 2.3 语法配置更新
- 更新package.json中的语法配置
- 确保所有支持文件类型(.shader, .hlsl, .cginc, .compute, .cg)都能正确识别和高亮

## Phase 3: 代码补全 (已完成)

### 3.1 Unity内置变量补全
- 添加变换矩阵变量: UNITY_MATRIX_MVP, UNITY_MATRIX_M, UNITY_MATRIX_V, UNITY_MATRIX_P, UNITY_MATRIX_VP等
- 添加相机参数: _WorldSpaceCameraPos, _ProjectionParams等
- 添加时间变量: _Time, _SinTime, _CosTime, unity_DeltaTime等
- 添加光照变量: _WorldSpaceLightPos0, _LightColor0等
- 添加雾效变量: unity_FogColor, unity_FogParams等
- 添加环境光/SH变量: unity_AmbientSky, unity_SHCoefficients等

### 3.2 Unity内置函数补全
- 空间转换函数: UnityObjectToClipPos, UnityObjectToWorldNormal等
- 纹理采样函数: tex2D, SAMPLE_TEXTURE2D, SAMPLE_TEXTURE2D_LOD等
- 光照计算函数: UnityWorldSpaceLightDir, Shade4PointLights等
- 阴影相关宏: SHADOW_COORDS, TRANSFER_SHADOW, SHADOW_ATTENUATION等
- 雾效相关宏: UNITY_FOG_COORDS, UNITY_TRANSFER_FOG, UNITY_APPLY_FOG等
- 工具函数: DecodeFloatRGBA, LinearToGammaSpace等

### 3.3 ShaderLab结构补全
- ShaderLab关键字: Shader, Properties, SubShader, Pass等
- 属性类型: 2D, Color, Float, Int, Range等
- 渲染状态: Blend, Cull, ZWrite, ZTest, Offset等
- Tags: RenderType, Queue, LightMode, DisableBatching等
- pragma指令: #pragma vertex, #pragma fragment, #pragma target等

### 3.4 补全上下文识别
- 自动识别当前代码位置（ShaderLab区域还是CGPROGRAM/HLSL代码区域）
- 根据上下文提供不同类型的补全建议
- 保留原生HLSL基础补全（标准函数、类型、关键字等）
- 所有补全项包含类型信息和使用说明

## Phase 4: 悬停提示 (已完成)

### 4.1 Unity内置函数变量说明
- 内置变量悬停: UNITY_MATRIX_MVP, _Time, _WorldSpaceCameraPos等变量显示类型和用途说明
- 内置函数悬停: UnityObjectToClipPos, tex2D等函数显示签名、参数说明和返回值
- 无需网络连接的中英文混合描述（不依赖外部文档链接）

### 4.2 ShaderLab关键字说明
- 渲染状态说明: Blend, Cull, ZWrite, ZTest等状态显示详细功能说明和使用方法
- Tags说明: RenderType, Queue, LightMode等tag显示语义和使用场景
- 属性类型说明: 2D, Color, Float等属性类型显示参数格式和使用方式
- ShaderLab结构说明: Shader, Properties, SubShader, Pass等关键字显示作用和使用方法

### 4.3 悬停上下文识别
- 自动识别符号类型: 自动识别变量、函数、关键字等不同符号类型
- 上下文感知: 在不同代码区域（ShaderLab、CGPROGRAM、HLSL等）显示相应说明
- 支持复杂类型: 结构体、宏定义、预处理指令等都能显示说明信息

## Phase 5: 符号与导航 (已完成)

### 5.1 符号识别和大纲视图
- 识别ShaderLab结构: Shader、Properties、SubShader、Pass等结构在大纲视图中正确显示
- 识别CGPROGRAM块: CGPROGRAM/ENDCG代码块内的函数、结构体、变量等符号
- 识别HLSL代码: 在.hlsl/.cginc文件中识别函数、结构体、cbuffer等符号
- 层次结构显示: 大纲视图显示Shader的完整结构层次（文件→Shader→SubShader→Pass等）
- 支持Cmd/Ctrl+Shift+O打开符号列表，快速跳转

### 5.2 定义跳转
- 函数定义跳转: 在函数调用处按F12跳转到函数定义
- 变量定义跳转: 在变量使用处按F12跳转到变量定义
- #include跳转: 在#include指令处按F12跳转到对应文件，支持相对路径和绝对路径
- FallBack跳转: 在FallBack "ShaderName"处按F12跳转到对应Shader文件定义
- ShaderName跳转: 在"UsePass"指令中支持跳转到Pass定义位置

### 5.3 引用查找
- 查找所有引用: 右键变量/函数名选择"查找所有引用"，找到当前文档内的所有使用位置
- 引用计数显示: 在状态栏显示符号的引用次数
- 支持当前文件内引用查找: 在当前文件内查找变量、函数等的所有引用位置

## Phase 6: 代码片段 (已完成)

### 6.1 代码片段模板库
**基础Shader模板**:
- `shader`: 标准ShaderLab模板
- `surfshader`: Surface Shader模板
- `unlitshader`: Unlit Shader模板

**结构块模板**:
- `properties`: Properties属性块模板
- `cgprogram`: CGPROGRAM代码块模板
- `hlslprogram`: HLSLPROGRAM代码块模板
- `pass`: Pass渲染通道模板

**常用类型模板**:
- `struct`: 结构体定义模板
- `v2f`: 顶点到片元结构体模板
- `appdata`: 顶点输入结构体模板

**渲染管线和指令**:
- URP模板: `urpunlit` (URP无光照Shader), `urplit` (URP光照Shader)
- pragma指令: 常用指令模板

### 6.2 代码片段功能特性
- 所有支持的ShaderLab和HLSL文件类型均可使用代码片段（.shader, .hlsl, .cginc, .compute, .cg）
- 智能光标定位: 生成代码后光标自动定位到关键位置进行编辑
- 占位符系统: 支持${1:label}格式的占位符，方便快速编辑
- 描述系统: 每个代码片段都有简短描述，在代码补全列表中显示
- 触发字符: 输入简短的触发字符（如shader、cgprogram等）即可调用对应模板

## Phase 7: URP 支持 (已完成)

### 7.1 URP 内置功能支持
**空间变换函数**: TransformObjectToHClip, TransformWorldToHClip, TransformWorldToObject, TransformWViewToHClip等
**光照计算函数**: GetMainLight, GetAdditionalLights, MixRealtimeAndBakedGI, AddFog, ApplyFog等
**光照数据变量**: _MainLightPosition, _MainLightColor, _AdditionalLightsCount, _AdditionalLightsBuffer等
**表面着色器数据**: SurfaceData, InputData等结构体支持
**URP 宏定义**: _MAIN_LIGHT_SHADOWS, _MAIN_LIGHT_SHADOWS_CASCADE, _ADDITIONAL_LIGHTS, _ADDITIONAL_LIGHT_SHADOWS等
**URP 头文件**: 支持 #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/..." 路径补全

### 7.2 URP Shader 模板
**URP Unlit Shader**: `urpunlit` 快速生成URP无光照Shader模板，包含顶点着色器和片元着色器，内置URP函数和宏定义
**URP Lit Shader**: `urplit` 快速生成URP光照Shader模板，包含光照Pass设置，内置URP表面着色器函数和数据结构

### 7.3 URP 功能配置
- 配置项: `unityshader.suggest.urp`（布尔值，默认true）
- 控制功能: 当为true时，提供URP函数/变量/宏的代码补全和悬停提示
- 配置场景: 主要用于兼容Built-In管线开发环境，避免不必要的URP补全干扰
- 默认设置: 对大多数URP项目保持开启，对Built-In项目可选择性关闭
## Phase 8: 优化与发布 (已完成)

### 8.1 代码清理与性能优化
**代码清理**: 删除所有Unreal相关的代码残留、注释、配置项和文件引用，确保插件纯Unity相关功能。

**代码质量**: 使用ESLint进行代码格式化、lint检查和代码风格统一，遵循TypeScript/JavaScript编码规范。

**性能优化**: 实现代码补全延迟加载、缓存机制减少重复计算，优化插件启动速度，确保激活时间<2秒。

**错误处理**: 添加必要的try-catch块和异常处理机制，增强插件稳定性。

### 8.2 文档完善
**README.md**: 更新插件功能描述、使用示例、配置选项说明，添加功能截图和演示GIF。

**CHANGELOG.md**: 创建版本变更记录，记录从Unreal到Unity转换的所有功能变更。

**安装和使用指南**: 添加插件安装步骤、基础使用指南、常见问题解答等。

### 8.3 测试验证
**核心功能测试**: 在测试项目目录中，对所有支持的Shader文件类型（.shader, .hlsl, .cginc, .compute, .cg）进行功能验证。

**功能完整性验证**: 确保语法高亮、代码补全、悬停提示、符号导航、定义跳转、代码片段等核心功能在所有文件类型上正常工作。

**插件打包准备**: 准备VS Code插件打包配置（package.json等元数据），完成版本号设置和发布准备。
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

## 功能验收测试

### 核心功能验证
- ✅ 所有支持文件类型(.shader/.hlsl/.cginc/.compute)正确识别为 "Unity Shader"
- ✅ ShaderLab 关键字和结构语法高亮正常
- ✅ HLSL/CG 代码语法高亮和代码补全正常
- ✅ Unity 内置函数/变量悬停提示正常
- ✅ 符号导航和大纲视图功能正常
- ✅ 代码片段生成功能正常
- ✅ URP 函数/变量支持和补全正常

### 主要测试点
- 语法高亮: Shader、Properties、SubShader、Pass、CGPROGRAM/ENDCG、Tags等结构高亮正确
- 代码补全: Unity内置函数、变量、ShaderLab关键字、pragma指令等补全正常
- 悬停提示: 变量说明、函数签名、ShaderLab关键字解释显示正常
- 符号导航: 大纲视图、定义跳转、引用查找、include文件跳转正常
- 代码片段: 主要Shader模板（基础、Surface、Unlit、URP）生成正常