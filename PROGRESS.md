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
| Phase 10: Unreal Shader 支持 | ✅ 已完成 | 100% |
| Phase 9.1: 智能代码分析 | ✅ 已完成 | 100% |
| Phase 9.2: 代码重构功能 | ✅ 已完成 | 100% |

**总体进度**: ✅ 核心功能已完成（Unity + Unreal + 智能分析 + 代码重构）

---

### 5. Phase 9.1: 智能代码分析完成
- **实现目标**: 提供语义分析和 Shader 变体分析功能
- **核心功能**:
  1. **语义分析**: 变量类型推断、未使用变量/函数检测
  2. **Shader 变体分析**: 变体数量统计、警告和优化建议
- **实现细节**:
  - 创建 `src/analysis/semanticAnalyzer.ts` - 语义分析器（350+ 行）
  - 创建 `src/analysis/variantAnalyzer.ts` - 变体分析器（250+ 行）
  - 修改 `src/hlsl/hoverProvider.ts` - 集成类型推断和变体详情
  - 修改 `src/extension.ts` - 注册分析器和事件监听
- **语义分析功能**:
  - 变量类型推断：悬停显示推断的类型
  - 未使用变量检测：灰色下划线提示
  - 未使用函数检测：灰色下划线提示
  - 作用域分析：支持全局/局部/参数变量
  - 智能排除：入口函数（vert/frag）和下划线变量不标记
- **变体分析功能**:
  - 变体数量统计：分析 multi_compile 和 shader_feature
  - 变体数量显示：pragma 行末尾显示数量和颜色
  - 变体警告：超过 256 显示警告，超过 512 显示错误
  - 详情悬停：显示所有选项、总数和优化建议
  - 颜色编码：灰色（正常）、橙色（警告）、红色（错误）
- **用户体验提升**:
  - ✅ 实时分析，无需手动触发
  - ✅ 非侵入式提示（Hint 级别）
  - ✅ 中英双语提示信息
  - ✅ 智能排除常见误报
- **Bug 修复记录**:
  - ✅ 修复了 color 悬停显示语义而非类型的问题
  - ✅ 修复了变体分析将注释计入选项的问题
  - ✅ 修复了纯 HLSL 代码不被分析的问题
  - ✅ 添加了详细的调试日志辅助排查
- **配置选项**:
  - `unityshader.analysis.semanticAnalysis.enabled` - 启用/禁用语义分析
  - `unityshader.analysis.variantAnalysis.enabled` - 启用/禁用变体分析
  - `unityshader.analysis.variantWarningThreshold` - 变体警告阈值（默认 256）
  - `unityshader.analysis.variantErrorThreshold` - 变体错误阈值（默认 512）
- **后续优化计划** (低优先级):
  - 性能优化：大文件增量分析、分析结果缓存
  - 功能增强：类型不匹配检测、参数数量错误检测
  - 功能增强：嵌套作用域支持、跨文件变体分析
  - 配置增强：可配置的分析范围和警告级别
- **影响文件**: 
  - `src/analysis/semanticAnalyzer.ts` (新建)
  - `src/analysis/variantAnalyzer.ts` (新建)
  - `src/hlsl/hoverProvider.ts` (修改)
  - `src/extension.ts` (修改)
  - `package.json` (添加配置项)
- **状态**: ✅ 已完成
- **详细说明**: 参见 [PHASE_9.1_TEST_GUIDE.md](PHASE_9.1_TEST_GUIDE.md)

---

### 6. Phase 9.2: 代码重构功能完成
- **实施日期**: 2026-01-11
- **实现目标**: 提供重命名符号和代码格式化功能
- **核心功能**:
  1. **重命名符号**: 智能重命名函数和变量，自动更新所有引用
  2. **代码格式化**: 整个文档和选区的代码格式化
- **实现细节**:
  - 创建 `src/hlsl/renameProvider.ts` - 重命名提供器（250+ 行）
  - 创建 `src/hlsl/formattingProvider.ts` - 格式化提供器（200+ 行）
  - 修改 `src/extension.ts` - 注册新功能
- **重命名功能**:
  - 符号验证：检查关键字和内置函数
  - 作用域分析：自动检测符号作用域（全局/函数/结构体）
  - 引用查找：使用正则表达式查找所有引用
  - 用户体验：F2 快捷键、重命名预览、错误提示
- **格式化功能**:
  - 缩进管理：自动计算大括号深度
  - ShaderLab 支持：识别 ShaderLab 关键字和属性
  - 注释保护：保持多行注释原样
  - 格式化选项：支持整个文档和选区格式化
- **快捷键**:
  - 重命名：F2
  - 格式化文档：Shift + Alt + F (Windows/Linux) / Shift + Option + F (macOS)
  - 格式化选区：Ctrl+K Ctrl+F (Windows/Linux) / Cmd+K Cmd+F (macOS)
- **已知限制**:
  - 重命名：当前仅支持当前文件内的重命名
  - 格式化：不支持运算符格式化和对齐
- **后续优化计划** (低优先级):
  - 重命名：支持跨文件重命名、宏定义重命名
  - 格式化：添加运算符格式化、变量声明对齐、注释对齐
- **影响文件**: 
  - `src/hlsl/renameProvider.ts` (新建)
  - `src/hlsl/formattingProvider.ts` (新建)
  - `src/extension.ts` (修改)
- **状态**: ✅ 已完成
- **详细说明**: 参见 [PHASE_9.2_IMPLEMENTATION.md](PHASE_9.2_IMPLEMENTATION.md)

---
### 4. Phase 10: UnrealShader 的支持完成- **实现目标**: 在同一插件中兼容支持 Unity 和 Unreal Engine 的 Shader 开发
- **核心功能**:
  1. **文件类型扩展**: 支持 `.usf` 和 `.ush` 文件
  2. **引擎检测**: 自动识别 Unity/Unreal 项目并切换上下文
  3. **Unreal 函数库**: 添加 50+ 个 Unreal 材质函数和变量
  4. **智能补全**: 根据引擎类型动态切换补全内容
  5. **状态栏显示**: 显示当前引擎类型并支持手动切换
- **实现细节**:
  - 创建 `src/common/engineDetector.ts` - 引擎类型检测器
  - 创建 `src/common/engineContext.ts` - 引擎上下文管理器
  - 创建 `src/unreal/unrealGlobals.ts` - Unreal 函数和变量定义
  - 修改 `src/hlsl/completionProvider.ts` - 集成引擎上下文
  - 修改 `src/hlsl/definitionProvider.ts` - 支持 Unreal include 跳转
- **Unreal 函数库内容**:
  - 材质函数: Texture2DSample, MaterialFloat, Parameters 等
  - 视图变量: View.WorldToClip, View.ViewOrigin, View.RealTime 等
  - 光照变量: ResolvedView.DirectionalLightColor 等
  - 内置宏: MATERIAL_*, FEATURE_LEVEL_* 等
- **用户体验提升**:
  - ✅ 自动识别项目类型，无需手动配置
  - ✅ 状态栏显示当前引擎，一目了然
  - ✅ 支持手动切换引擎类型
  - ✅ Unity 和 Unreal 补全互不干扰
- **影响文件**: 
  - `package.json` - 添加 .usf/.ush 文件支持
  - `src/common/engineDetector.ts` (新建)
  - `src/common/engineContext.ts` (新建)
  - `src/unreal/unrealGlobals.ts` (新建)
  - `src/hlsl/completionProvider.ts` - 集成引擎检测
  - `src/hlsl/definitionProvider.ts` - 支持 Unreal include
  - `src/extension.ts` - 注册引擎上下文和状态栏
- **状态**: ✅ 已完成
- **详细说明**: 参见 [UNREAL_SUPPORT.md](UNREAL_SUPPORT.md)
- **测试目录**: `/Users/ashiqi/Documents/UGit/EngineSource/Engine/Shaders`

### 3. 补全列表优先级排序优化
- **优化目标**: 让补全列表按匹配度智能排序，越匹配的越靠前
- **实现方案**:
  1. 完全匹配（大小写一致）→ 优先级最高
  2. 完全匹配（忽略大小写）→ 优先级次高
  3. 前缀匹配（大小写一致）→ 优先级中等
  4. 前缀匹配（忽略大小写）→ 优先级较低
  5. 驼峰匹配 → 优先级低
  6. 包含匹配 → 优先级最低
- **成员访问优化**:
  - 支持大小写不敏感的成员访问（如 `view.` 和 `View.` 都能正确匹配）
  - 只显示对应对象的成员，过滤无关项
  - 成员名匹配度排序
- **影响文件**: `src/hlsl/completionProvider.ts`
- **状态**: ✅ 已完成
- **详细说明**: 参见 [COMPLETION_SORT_FIX.md](COMPLETION_SORT_FIX.md)

### 2. Include 跳转路径解析优化
- **问题**: 以 `/` 开头的绝对路径（如 `#include "/Engine/Public/Platform.ush"`）跳转错误
- **根本原因**: 没有正确处理 Unreal 引擎的绝对路径规则
- **解决方案**:
  1. 识别以 `/` 开头的路径为引擎根目录的绝对路径
  2. 在工作区根目录下搜索对应文件
  3. 支持多个工作区的情况
- **影响文件**: `src/hlsl/definitionProvider.ts`
- **状态**: ✅ 已完成

### 1. Preprocessors 中英双文翻译

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
