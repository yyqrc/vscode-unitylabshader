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

## 🔧 最新修复记录 (2026-01-11)

### 1. Preprocessors 中英双文翻译
- **更新目标**: 将预处理器指令的描述翻译成中英双文格式
- **实现方案**:
  1. 将所有 preprocessor 指令的描述更新为中英双文格式
  2. 使用 `\n\n` 分隔英文和中文描述
  3. 与 `intrinsicfunctions` 保持一致的格式风格
- **更新内容**:
  - ✅ DEFINE - 定义常量或宏
  - ✅ ERROR - 生成编译时错误消息
  - ✅ IF/ELIF/ELSE/ENDIF - 控制源文件部分内容的编译
  - ✅ IFDEF/IFNDEF - 判断预处理器常量或宏是否已定义
  - ✅ INCLUDE - 插入指定文件的内容
  - ✅ LINE - 设置编译器内部存储的行号和文件名
  - ✅ PRAGMA - 提供特定于机器或操作系统的功能
  - ✅ UNDEF - 移除常量或宏的定义
- **用户体验提升**:
  - ✅ 中英文用户都能更好地理解预处理器指令
  - ✅ 悬停提示显示双语说明
  - ✅ 格式统一，易于阅读
- **影响文件**: 
  - `src/hlsl/hlslGlobals.ts` - 更新 preprocessors 对象
- **状态**: ✅ 已完成
- **详细说明**: 参见 [PREPROCESSORS_TRANSLATION.md](PREPROCESSORS_TRANSLATION.md)

### 2. 日志输出优化
- **优化目标**: 
  1. 简化日志输出，清理冗余信息
  2. 让日志只在开发环境中生效，打包后不输出
- **实现方案**:
  1. 添加 `isDevelopment()` 方法判断是否为开发环境
  2. 添加 `devLog()` 方法统一管理日志输出
  3. 在 `.vscode/launch.json` 中设置 `VSCODE_DEBUG_MODE=true` 环境变量
  4. 统一所有搜索功能的日志格式
- **日志格式**:
  - `[Macro] Searching: "name"` / `✓ Found` / `✗ Not found`
  - `[Function] Searching: "name"` / `✓ Found` / `✗ Not found`
  - `[Struct] Searching: "name"` / `✓ Found` / `✗ Not found`
  - `[FallBack] Searching: "name"` / `✓ Found` / `✓ Jump to` / `✗ Not found`
  - `[Include] Error: message`
  - `[Symbol] Searching Type` / `✓ Found N symbols` / `Retry` / `Trying fallback` / `✗ Fallback failed`
- **优化效果**:
  - ✅ 日志信息简洁清晰，只显示关键信息
  - ✅ 生产环境不输出日志，性能更好
  - ✅ 统一的日志格式，易于调试
  - ✅ 移除了大量冗余的 "Found symbol" 日志
- **影响文件**: 
  - `src/hlsl/definitionProvider.ts` - 定义跳转功能
  - `src/hlsl/symbolProvider.ts` - 符号搜索功能
  - `.vscode/launch.json` - 开发环境配置
- **状态**: ✅ 已完成
- **详细说明**: 参见 [LOG_OPTIMIZATION.md](LOG_OPTIMIZATION.md)

### 2. 修复 FallBack Shader 跳转功能（最终修复）
- **问题**: 无法跳转到包含 `/` 字符的 Shader 名称（如 `FallBack "Mobile/VertexLit"`）
- **错误信息**: `regex parse error: unrecognized escape sequence`
- **根本原因**: 
  1. 错误地将 `/` 转义为 `\/`
  2. 但在 ripgrep 正则表达式中，`/` 不是特殊字符，不需要转义
  3. ripgrep 不认识 `\/` 这个转义序列，导致报错
- **修复**: 
  1. 使用正确的转义逻辑：`shaderName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`
  2. 只转义正则表达式的特殊字符：`. * + ? ^ $ { } ( ) | [ ] \`
  3. `/` 字符不需要转义，直接使用
- **关键知识点**:
  - JavaScript 正则表达式中 `/` 用于分隔（如 `/pattern/`），需要转义
  - ripgrep 正则表达式字符串中 `/` 只是普通字符，不需要转义
- **影响文件**: `src/hlsl/definitionProvider.ts`
- **状态**: ✅ 已完成并验证
- **详细说明**: 参见 [FALLBACK_FIX.md](FALLBACK_FIX.md)
- **测试指南**: 参见 [FALLBACK_TEST_GUIDE.md](FALLBACK_TEST_GUIDE.md)

---

## 🔧 历史修复记录

### 2026-01-11: FallBack 跳转功能（第二次尝试 - 失败）
- **尝试**: 使用单引号包裹正则表达式，避免 shell 解析
- **问题**: 仍然错误地转义了 `/` 字符
- **结果**: ❌ 失败，ripgrep 报错

### 2026-01-10: FallBack 跳转功能（第一次尝试 - 部分成功）- **问题**: 无法跳转到包含 `/` 字符的 Shader 名称（如 `FallBack "Mobile/VertexLit"`）
- **原因**: 正则表达式中的 `/` 字符没有被正确转义
- **修复**: 
  - 添加正则转义：`shaderName.replace(/\//g, '\\/')`
  - 简化代码逻辑，移除 shell-quote 依赖
  - 精简日志输出，保留关键调试信息
- **影响文件**: `src/hlsl/definitionProvider.ts`
- **状态**: ✅ 已完成
- **详细说明**: 参见 [FALLBACK_FIX.md](FALLBACK_FIX.md)

---

## 🔧 历史修复记录 (2026-01-10)

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
