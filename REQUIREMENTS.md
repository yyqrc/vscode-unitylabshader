# Unity Shader 语言支持插件 - 需求文档

## 📋 项目概述

将现有的 Unreal Shader 语言支持插件（unrealshader）改造为 **Unity Shader 语言支持插件**，为 VS Code 中编写 Unity Shader 提供完整的语言支持功能。

---

## 🎯 目标文件格式

| 文件扩展名 | 说明 |
|-----------|------|
| `.shader` | Unity ShaderLab 主文件 |
| `.cginc` | CG/HLSL 包含文件 |
| `.hlsl` | HLSL 着色器文件 |
| `.hlsli` | HLSL 包含文件 |
| `.compute` | 计算着色器文件 |
| `.cg` | CG 着色器文件（旧版） |
| `.glslinc` | GLSL 包含文件 |

---

## ✅ 现有功能（需保留并适配）

### 1. 代码补全（Code Completion）
- [x] 内置数据类型补全（float、half、int、uint 等）
- [x] 向量类型补全（float2、float3、float4、half3 等）
- [x] 矩阵类型补全（float4x4、half3x3 等）
- [x] 内置函数补全（mul、lerp、saturate、tex2D 等）
- [x] 语义补全（POSITION、TEXCOORD、COLOR、SV_Target 等）
- [x] 预处理器指令补全（#define、#include、#pragma 等）
- [x] 关键字补全（struct、cbuffer、return、if 等）
- [x] 当前文档自定义函数补全

### 2. 悬停提示（Hover）
- [x] 内置函数签名和说明
- [x] 数据类型说明
- [x] 语义说明
- [x] 关键字说明
- [x] 预处理器指令说明
- [x] 在线文档链接支持

### 3. 函数签名帮助（Signature Help）
- [x] 输入函数参数时显示参数提示
- [x] 当前参数高亮

### 4. 符号功能（Symbols）
- [x] 文档符号大纲（Document Symbols）
- [x] 工作区符号搜索（Workspace Symbols）
- [x] 函数定义识别
- [x] 结构体/cbuffer 识别
- [x] 采样器/纹理变量识别

### 5. 导航功能
- [x] 转到定义（Go to Definition）
- [x] 查找引用（Find References）

### 6. 语法高亮（Syntax Highlighting）
- [x] 基于 TextMate 语法的高亮规则
- [x] 注释高亮
- [x] 字符串高亮
- [x] 数字高亮
- [x] 关键字高亮
- [x] 类型高亮
- [x] 函数调用高亮
- [x] 预处理器高亮

---

## 🆕 需要新增/修改的功能

### 1. Unity ShaderLab 语法支持 ⭐重要

Unity Shader 文件（`.shader`）使用 ShaderLab 语法包装 HLSL/CG 代码，需要新增：

```shaderlab
Shader "Custom/MyShader" {
    Properties {
        _MainTex ("Texture", 2D) = "white" {}
        _Color ("Color", Color) = (1,1,1,1)
        _Metallic ("Metallic", Range(0,1)) = 0.0
    }
    SubShader {
        Tags { "RenderType"="Opaque" }
        LOD 200
        
        Pass {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            // HLSL/CG 代码
            ENDCG
        }
    }
    FallBack "Diffuse"
}
```

#### 需要支持的 ShaderLab 关键字：
| 类别 | 关键字 |
|------|--------|
| 结构块 | `Shader`, `Properties`, `SubShader`, `Pass`, `Category`, `Stencil` |
| 代码块 | `CGPROGRAM`, `ENDCG`, `CGINCLUDE`, `HLSLPROGRAM`, `ENDHLSL`, `HLSLINCLUDE` |
| 属性类型 | `2D`, `3D`, `Cube`, `2DArray`, `CubeArray`, `Color`, `Vector`, `Float`, `Int`, `Range` |
| 渲染状态 | `Blend`, `BlendOp`, `Cull`, `ZWrite`, `ZTest`, `ColorMask`, `Offset`, `AlphaToMask` |
| 标签 | `Tags`, `RenderType`, `Queue`, `LightMode`, `PassFlags`, `RequireOptions` |
| 其他 | `LOD`, `FallBack`, `CustomEditor`, `Dependency`, `UsePass`, `GrabPass` |

### 2. Unity 特有的内置变量和函数

#### Unity 内置变量（需添加到补全和悬停提示）：

| 类别 | 变量示例 |
|------|----------|
| 变换矩阵 | `UNITY_MATRIX_MVP`, `UNITY_MATRIX_M`, `UNITY_MATRIX_V`, `UNITY_MATRIX_P`, `UNITY_MATRIX_VP`, `UNITY_MATRIX_MV`, `UNITY_MATRIX_IT_MV`, `unity_ObjectToWorld`, `unity_WorldToObject` |
| 相机参数 | `_WorldSpaceCameraPos`, `_ProjectionParams`, `_ScreenParams`, `_ZBufferParams`, `unity_OrthoParams` |
| 时间变量 | `_Time`, `_SinTime`, `_CosTime`, `unity_DeltaTime` |
| 光照变量 | `_WorldSpaceLightPos0`, `_LightColor0`, `unity_LightAtten`, `unity_4LightPosX0`, `unity_4LightPosY0`, `unity_4LightPosZ0`, `unity_4LightAtten0` |
| 雾效变量 | `unity_FogColor`, `unity_FogParams` |
| 环境光 | `unity_AmbientSky`, `unity_AmbientEquator`, `unity_AmbientGround`, `UNITY_LIGHTMODEL_AMBIENT` |
| SH 光照 | `unity_SHAr`, `unity_SHAg`, `unity_SHAb`, `unity_SHBr`, `unity_SHBg`, `unity_SHBb`, `unity_SHC` |
| GPU Instancing | `unity_InstanceID`, `UNITY_VERTEX_INPUT_INSTANCE_ID`, `UNITY_INSTANCING_BUFFER_START`, `UNITY_INSTANCING_BUFFER_END` |

#### Unity 内置函数（需添加）：

| 类别 | 函数示例 |
|------|----------|
| 空间转换 | `UnityObjectToWorldNormal`, `UnityObjectToWorldDir`, `UnityWorldToObjectDir`, `UnityObjectToClipPos`, `UnityWorldToClipPos`, `ComputeScreenPos`, `ComputeGrabScreenPos` |
| 纹理采样 | `SAMPLE_TEXTURE2D`, `SAMPLE_TEXTURE2D_LOD`, `SAMPLE_TEXTURE3D`, `SAMPLE_TEXTURECUBE`, `SAMPLE_TEXTURE2D_ARRAY`, `LOAD_TEXTURE2D` |
| 光照计算 | `UnityWorldSpaceLightDir`, `UnityWorldSpaceViewDir`, `Shade4PointLights`, `ShadeSH9`, `ShadeSH3Order` |
| 阴影 | `SHADOW_COORDS`, `TRANSFER_SHADOW`, `SHADOW_ATTENUATION`, `UNITY_SHADOW_COORDS`, `UNITY_TRANSFER_SHADOW` |
| 雾效 | `UNITY_FOG_COORDS`, `UNITY_TRANSFER_FOG`, `UNITY_APPLY_FOG` |
| 工具函数 | `UnityEncodeCubeShadowDepth`, `DecodeFloatRGBA`, `EncodeFloatRGBA`, `DecodeHDR`, `LinearToGammaSpace`, `GammaToLinearSpace` |

### 3. Unity URP/HDRP 支持 ⭐重要

#### URP (Universal Render Pipeline) 特有内容：

```hlsl
// URP 常用宏和函数
#include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
#include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

// URP 关键字
_MAIN_LIGHT_SHADOWS
_ADDITIONAL_LIGHTS
_ADDITIONAL_LIGHT_SHADOWS
_SHADOWS_SOFT

// URP 函数
GetMainLight(), GetAdditionalLight(), TransformObjectToHClip(), TransformObjectToWorld()
```

#### HDRP (High Definition Render Pipeline) 特有内容：

```hlsl
// HDRP 常用包含
#include "Packages/com.unity.render-pipelines.high-definition/Runtime/ShaderLibrary/ShaderVariables.hlsl"

// HDRP 关键字和函数（按需添加）
```

### 4. 代码片段（Snippets）⭐推荐新增

| 片段名称 | 说明 |
|----------|------|
| `shader` | 创建基础 Shader 模板 |
| `surfshader` | 创建 Surface Shader 模板 |
| `urpshader` | 创建 URP Unlit Shader 模板 |
| `urplit` | 创建 URP Lit Shader 模板 |
| `computeshader` | 创建 Compute Shader 模板 |
| `struct` | 创建结构体模板 |
| `pass` | 创建 Pass 块模板 |
| `properties` | 创建 Properties 块模板 |
| `cgprogram` | 创建 CGPROGRAM 块 |
| `hlslprogram` | 创建 HLSLPROGRAM 块 |
| `pragma` | 常用 pragma 指令 |

### 5. 诊断功能（Diagnostics）⭐推荐新增

- [ ] 基础语法错误检测
- [ ] 未使用变量警告
- [ ] 缺少 pragma 指令提示
- [ ] 属性名称与变量名不匹配警告

### 6. 格式化功能（Formatting）⭐推荐新增

- [ ] 自动缩进
- [ ] 代码格式化命令
- [ ] 保存时自动格式化（可配置）

### 7. 重命名功能（Rename）⭐推荐新增

- [ ] 变量重命名
- [ ] 函数重命名
- [ ] 结构体重命名

---

## 🔧 配置项需求

```json
{
  "unityshader.suggest.basic": {
    "type": "boolean",
    "default": true,
    "description": "是否启用基础代码建议"
  },
  "unityshader.suggest.unity": {
    "type": "boolean", 
    "default": true,
    "description": "是否启用 Unity 特有的代码建议"
  },
  "unityshader.suggest.urp": {
    "type": "boolean",
    "default": true,
    "description": "是否启用 URP 相关代码建议"
  },
  "unityshader.suggest.hdrp": {
    "type": "boolean",
    "default": false,
    "description": "是否启用 HDRP 相关代码建议"
  },
  "unityshader.format.enable": {
    "type": "boolean",
    "default": false,
    "description": "是否启用代码格式化"
  },
  "unityshader.diagnostics.enable": {
    "type": "boolean",
    "default": false,
    "description": "是否启用诊断功能"
  }
}
```

---

## 📦 文件修改清单

### 需要修改的文件：

| 文件 | 修改内容 |
|------|----------|
| `package.json` | 修改插件名称、描述、支持的文件类型、配置项 |
| `src/extension.ts` | 修改激活逻辑，注册语言 |
| `src/hlsl/hlslGlobals.ts` | 添加 Unity 特有的内置变量、函数、关键字 |
| `src/hlsl/completionProvider.ts` | 添加 ShaderLab 和 Unity 补全支持 |
| `src/hlsl/hoverProvider.ts` | 添加 Unity 特有内容的悬停提示 |
| `src/hlsl/symbolProvider.ts` | 添加 ShaderLab 结构识别（Properties、Pass 等） |
| `syntaxes/unrealshader.tmLanguage.json` | 重写为 Unity Shader 语法高亮 |
| `language-configuration.json` | 调整语言配置（括号匹配、注释等） |

### 需要新增的文件：

| 文件 | 内容 |
|------|------|
| `src/unity/unityGlobals.ts` | Unity 特有的内置定义数据 |
| `src/unity/shaderLabProvider.ts` | ShaderLab 语法支持 Provider |
| `src/unity/urpGlobals.ts` | URP 特有的定义数据 |
| `src/unity/hdrpGlobals.ts` | HDRP 特有的定义数据 |
| `snippets/unityshader.json` | Unity Shader 代码片段 |
| `syntaxes/shaderlab.tmLanguage.json` | ShaderLab 语法高亮定义 |

---

## 🔄 功能优先级

### P0 - 核心功能（必须实现）
1. ✅ 支持 `.shader`, `.cginc`, `.hlsl`, `.compute` 文件识别
2. ✅ ShaderLab 语法高亮
3. ✅ HLSL/CG 代码高亮
4. ✅ 基础代码补全
5. ✅ 悬停提示
6. ✅ 转到定义

### P1 - 重要功能（强烈推荐）
1. ⬜ Unity 内置变量/函数补全
2. ⬜ URP 支持
3. ⬜ 代码片段
4. ⬜ 文档符号大纲
5. ⬜ 函数签名帮助

### P2 - 增强功能（可选）
1. ⬜ HDRP 支持
2. ⬜ 诊断功能
3. ⬜ 代码格式化
4. ⬜ 重命名功能
5. ⬜ 在线文档 WebView

---

## 📊 与市面插件对比

| 功能 | ShaderlabVSCode | Unity Shader | 本插件目标 |
|------|-----------------|--------------|-----------|
| ShaderLab 语法高亮 | ✅ | ✅ | ✅ |
| HLSL 语法高亮 | ✅ | ✅ | ✅ |
| 代码补全 | ✅ 基础 | ✅ 基础 | ✅ 增强 |
| Unity 内置补全 | ⬜ | ✅ 部分 | ✅ 完整 |
| URP 支持 | ⬜ | ⬜ | ✅ |
| 悬停提示 | ⬜ | ⬜ | ✅ |
| 转到定义 | ⬜ | ⬜ | ✅ |
| 查找引用 | ⬜ | ⬜ | ✅ |
| 符号大纲 | ⬜ | ⬜ | ✅ |
| 代码片段 | ✅ | ✅ | ✅ |
| 诊断功能 | ⬜ | ⬜ | ⬜ P2 |
| 格式化 | ⬜ | ⬜ | ⬜ P2 |

---

## 🚀 开发计划建议

### Phase 1：基础改造（1-2 周）
- 修改 package.json 和基础配置
- 创建 ShaderLab 语法高亮文件
- 适配文件类型识别

### Phase 2：功能适配（2-3 周）
- 添加 Unity 内置变量和函数
- 修改补全 Provider
- 修改悬停 Provider
- 修改符号 Provider

### Phase 3：增强功能（1-2 周）
- 添加代码片段
- 添加 URP 支持
- 优化和测试

### Phase 4：高级功能（可选）
- 诊断功能
- 格式化功能
- HDRP 支持

---

## 📝 备注

1. 本需求文档基于现有 unrealshader 插件的代码结构分析
2. Unity Shader 语法相较于纯 HLSL 更复杂，因为它包含 ShaderLab 包装层
3. 建议在实现时充分参考 Unity 官方文档：
   - [Unity Shader Reference](https://docs.unity3d.com/Manual/SL-Reference.html)
   - [Unity Built-in Shader Variables](https://docs.unity3d.com/Manual/SL-UnityShaderVariables.html)
   - [URP Shader Documentation](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@latest)

---

**文档版本**: v1.0  
**创建日期**: 2025-01-09  
**作者**: AI Assistant
