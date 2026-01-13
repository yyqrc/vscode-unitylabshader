# Unity Shader 语言支持插件 - 功能文档

> **版本**: 1.0.0  
> **状态**: 核心功能完成，持续优化中

---

## 📋 功能概览

| 功能模块 | 状态 | 说明 |
|----------|------|------|
| 语法高亮 | ✅ | ShaderLab + HLSL/CG 语法高亮 |
| 代码补全 | ✅ | Unity/URP 内置函数和变量 |
| 悬停提示 | ✅ | 中英双语函数文档 |
| 符号导航 | ✅ | 大纲、定义跳转、引用查找 |
| 代码片段 | ✅ | Shader 模板、结构体模板 |
| 智能分析 | ✅ | 语义分析、变体分析 |
| 代码重构 | ✅ | 重命名、格式化 |
| 跨文件重命名 | ✅ | 项目级符号重命名 |
| 符号缓存 | ✅ | 高性能持久化缓存 |
| Unreal 支持 | ✅ | .usf/.ush 文件支持 |
| 移动平台优化 | ✅ | 移动端特性检测和优化建议 |

---

## 🎯 支持的文件类型

| 扩展名 | 说明 | 引擎 |
|--------|------|------|
| `.shader` | Unity ShaderLab 文件 | Unity |
| `.cginc` | CG Include 文件 | Unity |
| `.hlsl` | HLSL 着色器文件 | 通用 |
| `.hlsli` | HLSL Include 文件 | 通用 |
| `.compute` | 计算着色器文件 | Unity |
| `.cg` | CG 着色器文件 | Unity |
| `.usf` | Unreal Shader 文件 | Unreal |
| `.ush` | Unreal Shader Header | Unreal |

---

## 🔧 核心功能详解

### 1. 语法高亮
- **ShaderLab 关键字**: `Shader`, `Properties`, `SubShader`, `Pass`, `Tags`, `LOD`
- **渲染状态**: `Blend`, `Cull`, `ZWrite`, `ZTest`, `ColorMask`
- **代码块**: `CGPROGRAM/ENDCG`, `HLSLPROGRAM/ENDHLSL`
- **预处理器**: `#include`, `#define`, `#pragma`, `#if/#endif`

### 2. 代码补全
- **HLSL 内置函数**: 160+ 个函数（`lerp`, `mul`, `saturate`, `tex2D` 等）
- **Unity 内置变量**: `UNITY_MATRIX_MVP`, `_Time`, `_WorldSpaceCameraPos` 等
- **Unity 内置函数**: `UnityObjectToClipPos`, `UnityWorldSpaceViewDir` 等
- **URP 函数**: `TransformObjectToHClip`, `GetMainLight`, `SampleSH` 等
- **Unreal 函数**: `MaterialFloat`, `Texture2DSample`, `View.*` 等

### 3. 悬停提示
- 中英双语函数文档
- 参数说明和返回值类型
- 使用示例

### 4. 符号导航
- **大纲视图**: 显示 Shader 结构、函数、结构体
- **转到定义**: F12 或 Ctrl+点击，支持跨文件
- **查找引用**: 查找符号在项目中的所有使用
- **#include 跳转**: 支持跳转到 include 文件
- **FallBack 跳转**: 支持跳转到降级 Shader

### 5. 智能分析
- **语义分析**: 变量类型推断、未使用变量检测
- **变体分析**: 统计 multi_compile/shader_feature 变体数量，超过阈值警告

### 6. 代码重构
- **重命名**: F2 重命名符号，支持跨文件
- **格式化**: Shift+Alt+F 格式化文档

### 7. 移动平台优化 (新增)
- **特性检测**: 检测移动端不支持的特性（ES3.0/3.1/Metal/Vulkan）
- **精度建议**: 建议使用 half 精度提升性能
- **纹理优化**: 检测依赖纹理读取等性能问题
- **复杂度评分**: 实时评估 Shader 复杂度

### 8. 符号缓存系统
- **持久化存储**: 符号缓存保存到本地，加速启动
- **多线程构建**: 并行解析文件，提升性能
- **增量更新**: 文件变更时只更新对应缓存
- **跨文件移动检测**: 自动追踪符号移动

---

## ⚙️ 配置项

### 基础配置
| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `unityshader.suggest.basic` | `true` | HLSL 基础补全 |
| `unityshader.suggest.unity` | `true` | Unity 内置补全 |
| `unityshader.suggest.urp` | `true` | URP 补全 |

### 分析配置
| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `unityshader.analysis.semanticAnalysis` | `true` | 语义分析 |
| `unityshader.analysis.variantAnalysis` | `true` | 变体分析 |
| `unityshader.analysis.variantWarningThreshold` | `256` | 变体警告阈值 |
| `unityshader.analysis.maxVariantsError` | `512` | 变体错误阈值 |

### 移动端配置
| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `unityshader.mobile.enabled` | `true` | 移动端分析总开关 |
| `unityshader.mobile.checkUnsupportedFeatures` | `true` | 检测不支持的特性 |
| `unityshader.mobile.suggestHalfPrecision` | `true` | half 精度建议 |
| `unityshader.mobile.checkTextureOptimization` | `true` | 纹理优化建议 |
| `unityshader.mobile.checkDiscouragedFunctions` | `true` | 不推荐函数检测 |
| `unityshader.mobile.calculateComplexity` | `true` | 复杂度评分 |
| `unityshader.mobile.targetPlatform` | `ES3.0` | 目标平台 |

---

## 📁 项目结构

```
src/
├── extension.ts              # 插件入口
├── hlsl/                     # HLSL 语言功能
│   ├── completionProvider.ts # 代码补全
│   ├── hoverProvider.ts      # 悬停提示
│   ├── symbolProvider.ts     # 符号识别
│   ├── definitionProvider.ts # 定义跳转
│   ├── referenceProvider.ts  # 引用查找
│   ├── renameProvider.ts     # 重命名
│   ├── formattingProvider.ts # 格式化
│   ├── foldingProvider.ts    # 代码折叠
│   ├── signatureProvider.ts  # 函数签名
│   └── hlslGlobals.ts        # HLSL 内置定义
├── unity/                    # Unity 特有功能
│   ├── unityGlobals.ts       # Unity 内置定义
│   └── urpGlobals.ts         # URP 内置定义
├── unreal/                   # Unreal 支持
│   └── unrealGlobals.ts      # Unreal 内置定义
├── common/                   # 通用功能
│   ├── engineDetector.ts     # 引擎检测
│   └── engineContext.ts      # 引擎上下文
├── analysis/                 # 智能分析
│   ├── semanticAnalyzer.ts   # 语义分析
│   └── variantAnalyzer.ts    # 变体分析
├── cache/                    # 符号缓存
│   ├── symbolCacheManager.ts # 缓存管理器
│   ├── symbolParser.ts       # 符号解析器
│   └── fileHasher.ts         # 文件哈希
├── mobile/                   # 移动平台优化
│   ├── mobileGlobals.ts      # 移动端定义
│   └── mobileAnalyzer.ts     # 移动端分析器
└── refactor/                 # 重构功能
    └── crossFileRename.ts    # 跨文件重命名
```

---

## 🚀 后续计划

### 高优先级
- [ ] 编译错误解析 - 智能解析和一键修复
- [ ] 自动化测试 - 建立完整测试体系

### 中优先级
- [ ] HDRP/URP 2.0 支持 - 最新 Unity 渲染管线
- [ ] 性能优化 - 大文件增量分析

### 低优先级
- [ ] 实时 Shader 预览
- [ ] Niagara 支持 (Unreal)

---

## 📝 版本历史

参见 [CHANGELOG.md](../CHANGELOG.md)
