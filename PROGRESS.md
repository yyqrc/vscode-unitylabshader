# Unity Shader 语言支持插件 - 开发进度记录

> 📅 **最后更新**: 2026-01-10  
> 📁 **测试目录**: `/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/`

---

## 📊 当前状态总览

| 阶段 | 状态 | 完成度 |
|------|------|--------|
| Phase 1: 基础配置改造 | ✅ 已完成 | 100% |
| Phase 2: 语法高亮 | ✅ 已完成 | 100% |
| Phase 3: 代码补全 | ✅ 已完成 | 100% |
| Phase 4: 悬停提示 | ✅ 已完成 | 100% |
| Phase 5: 符号与导航 | ✅ 已完成 | 100% |
| Phase 6: 代码片段 | ✅ 已完成 | 100% |
| Phase 7: URP 支持 | ✅ 已完成 | 100% |
| Phase 8: 优化与发布 | ✅ 已完成 | 100% |

**总体进度**: ✅ 核心功能已完成

---

## 🔧 最新修复记录 (2026-01-10)

### 1. 新增 #include 文件跳转功能
- **功能**: 支持在 `#include "xxx.cginc"` 上按 F12 或 Cmd+点击跳转到对应文件
- **实现策略**:
  1. 优先尝试相对于当前文件的路径
  2. 尝试相对于工作区根目录的路径
  3. 使用 ripgrep 搜索文件名
- **影响文件**: `src/hlsl/definitionProvider.ts`
- **状态**: ✅ 已完成

### 2. 新增 FallBack Shader 跳转功能
- **功能**: 支持在 `FallBack "Diffuse"` 上按 F12 或 Cmd+点击跳转到对应的 Shader 定义
- **实现策略**:
  1. 使用 ripgrep 搜索工作区中所有 .shader 文件
  2. 查找匹配的 `Shader "xxx"` 定义
  3. 支持多个匹配结果（如有多个同名 Shader）
- **影响文件**: `src/hlsl/definitionProvider.ts`
- **状态**: ✅ 已完成

### 3. HLSL 函数描述中英文换行显示
- **问题**: 中英文描述在同一行显示，不易阅读
- **解决**: 将所有函数描述中的 `\n` 改为 `\n\n`，实现中英文分行显示
- **影响文件**: `src/hlsl/hlslGlobals.ts`
- **状态**: ✅ 已完成（173 个函数全部修复）

### 2. 补充高级 HLSL 函数
- **新增内容**:
  - Wave 系列函数（Shader Model 6.0+）：WaveActiveAllEqual、WaveActiveBitAnd 等
  - Quad 系列函数：QuadReadLaneAt、QuadReadAcrossX 等
  - 细分着色器函数：Process2DQuadTessFactors、ProcessTriTessFactors 等
  - 其他高级函数：NonUniformResourceIndex
- **影响文件**: `src/hlsl/hlslGlobals.ts`
- **状态**: ✅ 已完成

### 3. 跨文件函数定义跳转
- **问题**: 带 `inline`/`static`/`extern` 修饰符的函数无法跳转
- **解决**: 修改正则表达式支持可选修饰符 `^(?:inline|static|extern)?\s*\w+\s+函数名\s*\(`
- **影响文件**: `src/hlsl/definitionProvider.ts`
- **测试通过**:
  - ✅ `LinearToGammaSpaceExactHalf` 函数可跳转
  - ✅ `CalcScatterInput` 跨文件函数可跳转
  - ✅ `ALPHA_FUNC` 宏定义可跳转（支持多个定义）
- **状态**: ✅ 已完成并通过自检

---

## 🎯 核心功能清单

### ✅ 已实现功能

#### 1. 文件类型支持
- `.shader` - Unity ShaderLab
- `.cginc` - CG Include
- `.hlsl` - HLSL
- `.hlsli` - HLSL Include
- `.compute` - Compute Shader
- `.cg` - CG 文件

#### 2. 语法高亮
- ShaderLab 关键字（Shader, Properties, SubShader, Pass）
- HLSL/CG 类型和关键字
- 预处理器指令（#include, #define, #pragma, #if）
- 注释、字符串、数字

#### 3. 代码补全
- Unity 内置变量（UNITY_MATRIX_*, _Time, _WorldSpaceCameraPos 等）
- Unity 内置函数（UnityObjectToClipPos, tex2D 等）
- URP 函数（TransformObjectToHClip, GetMainLight 等）
- ShaderLab 关键字和渲染状态
- HLSL 基础类型和函数（160+ 个）

#### 4. 悬停提示
- HLSL 内置函数（中英双语描述）
- Unity 内置函数和变量
- URP 函数和变量
- ShaderLab 关键字

#### 5. 符号导航
- Shader 结构识别（Shader, Properties, SubShader, Pass）
- 函数定义识别
- 结构体识别
- 变量定义识别
- 大纲视图支持

#### 6. 定义跳转
- 函数定义跳转（支持 inline/static/extern 修饰符）
- 变量定义跳转
- 宏定义跳转（支持多个定义）
- 跨文件跳转
- 优先级排序（已打开文件优先）
- **#include 文件跳转**（支持相对路径、工作区路径、文件名搜索）
- **FallBack Shader 跳转**（支持跳转到降级 Shader 定义）

#### 7. 代码片段
- 基础 Shader 模板（shader, unlitshader, surfshader）
- URP Shader 模板（urpunlit, urplit）
- 代码块模板（cgprogram, hlslprogram, pass）
- 结构体模板（v2f, appdata, struct）
- 属性模板（prop2d, propcolor, propfloat 等）

#### 8. 代码折叠
- 自定义折叠提供器
- 支持 #if/#elif/#else/#endif 分段折叠
- 支持嵌套条件编译块

---

## 📁 关键文件说明

### 核心功能文件
```
src/extension.ts                    # 插件入口，注册所有 Provider
src/hlsl/completionProvider.ts      # 代码补全提供器
src/hlsl/hoverProvider.ts           # 悬停提示提供器
src/hlsl/symbolProvider.ts          # 符号识别提供器
src/hlsl/definitionProvider.ts      # 定义跳转提供器（最新修复）
src/hlsl/referenceProvider.ts       # 引用查找提供器
src/hlsl/foldingProvider.ts         # 代码折叠提供器
src/hlsl/signatureProvider.ts       # 函数签名提供器
```

### 数据定义文件
```
src/hlsl/hlslGlobals.ts             # HLSL 内置函数定义（173 个函数，中英双语）
src/unity/unityGlobals.ts           # Unity 内置变量和函数定义
src/unity/urpGlobals.ts             # URP 内置函数和变量定义
```

### 配置文件
```
package.json                        # 插件配置
language-configuration.json         # 语言配置（注释、括号等）
syntaxes/unityshader.tmLanguage.json # 语法高亮规则
snippets/unityshader.json           # 代码片段定义
```

---

## 🧪 测试验证

### 测试文件路径
```
/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/
├── BuiltIn/Mobile/Mobile-Diffuse.shader
├── CODM/Colors.hlsl
├── CODM/Standard/StdUtilsColorSpace.cginc
├── CODM/Standard/StdPassForwardFrag.cginc
├── CODM/Standard/StdAtmospheric.cginc
├── Includes/HLSLSupport.cginc
└── CODM/ComputeShader/UpdateVRSAttachment.compute
```

### 测试用例
1. **LinearToGammaSpaceExactHalf** - inline 函数跨文件跳转
2. **CalcScatterInput** - 跨文件函数定义跳转
3. **ALPHA_FUNC** - 宏定义多个定义跳转

---

## 🔍 已知问题

目前无已知问题。

---

## 📝 开发笔记

### 重要技术点

1. **ripgrep 集成**
   - 使用 `@vscode/ripgrep` 进行快速文件搜索
   - 正则表达式需要转义特殊字符
   - 支持多种文件类型过滤

2. **函数定义搜索正则**
   ```typescript
   // 支持可选修饰符的函数定义
   const funcPattern = `^(?:inline|static|extern)?\s*\w+\s+${name}\s*\(`;
   ```

3. **宏定义搜索正则**
   ```typescript
   // 匹配 #define 宏定义
   const macroPattern = `^\s*#define\s+${name}\b`;
   ```

4. **优先级排序**
   - 已打开文件优先显示
   - 其他文件按文件名字母顺序排序

5. **中英双语格式**
   ```typescript
   description: "English description.\n\n中文描述。"
   ```

---

## 🚀 下一步计划

参考 `TODO.md` 中的 "Phase 9: 高级功能扩展" 部分。

---

**文档版本**: v1.0  
**创建日期**: 2026-01-10  
**维护者**: Unity Shader Extension Team
