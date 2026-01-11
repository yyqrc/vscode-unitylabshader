# Phase 10: Unreal Shader 支持 - 测试指南

## 测试环境

- **Unreal Shader 测试目录**: `/Users/ashiqi/Documents/UGit/EngineSource/Engine/Shaders`
- **扩展版本**: 0.1.2
- **完成日期**: 2026-01-11

## 已完成功能

### ✅ 10.1 文件类型扩展

**功能说明**:
- 添加了 `.usf` 和 `.ush` 文件类型支持
- 创建了引擎检测器 (`engineDetector.ts`)
- 支持自动检测 Unity/Unreal 引擎类型

**测试步骤**:
1. 打开 Unreal Shader 文件（如 `/Users/ashiqi/Documents/UGit/EngineSource/Engine/Shaders/Private/Common.ush`）
2. 检查 VS Code 状态栏右下角是否显示语言类型为 "Unity/Unreal Shader"
3. 检查状态栏是否显示引擎类型图标（Unity 或 Unreal）

**预期结果**:
- ✓ `.usf` 和 `.ush` 文件被识别为 shader 文件
- ✓ 语法高亮正常工作
- ✓ 状态栏显示正确的引擎类型

---

### ✅ 10.4 上下文智能切换

**功能说明**:
- 创建了引擎上下文管理器 (`engineContext.ts`)
- 支持自动检测和手动切换引擎类型
- 确保 Unity 和 Unreal 补全不会相互干扰

**测试步骤**:

#### 测试 1: 自动检测
1. 打开 Unity Shader 文件（如 `*.shader`）
   - 状态栏应显示 "Unity" 图标
2. 打开 Unreal Shader 文件（如 `*.usf`）
   - 状态栏应显示 "Unreal" 图标

#### 测试 2: 手动切换
1. 点击状态栏的引擎类型图标
2. 选择 "Auto Detect"、"Unity" 或 "Unreal"
3. 检查补全内容是否相应更新

#### 测试 3: 补全隔离
1. 在 Unity 模式下，输入 "UnityObject"
   - 应显示 `UnityObjectToClipPos` 等 Unity 函数
   - 不应显示 Unreal 特有函数
2. 在 Unreal 模式下，输入 "Texture2D"
   - 应显示 `Texture2DSample` 等 Unreal 函数
   - 不应显示 Unity 特有函数
3. 在两种模式下，输入 "lerp"
   - 都应显示 HLSL 基础函数

**预期结果**:
- ✓ 自动检测准确识别引擎类型
- ✓ 手动切换立即生效
- ✓ Unity 和 Unreal 补全相互隔离
- ✓ HLSL 基础函数在两种模式下都可用

---

### ✅ 10.2 Unreal 材质函数库

**功能说明**:
- 创建了 Unreal 材质函数库 (`unrealGlobals.ts`)
- 添加了 50+ 个常用 Unreal 材质函数
- 添加了 Unreal 内置变量和宏

**测试步骤**:

#### 测试 1: 纹理采样函数
1. 在 Unreal Shader 文件中输入 "Texture2D"
2. 检查补全列表是否包含:
   - `Texture2DSample`
   - `Texture2DSampleLevel`
   - `Texture2DSampleBias`
   - `Texture2DSampleGrad`
   - `TextureCubeSample`
   - `TextureCubeSampleLevel`

#### 测试 2: View 变量
1. 输入 "View."
2. 检查补全列表是否包含:
   - `View.ViewToClip`
   - `View.WorldToClip`
   - `View.ViewOrigin`
   - `View.ViewForward`
   - `View.GameTime`
   - `View.RealTime`

#### 测试 3: Parameters 变量
1. 输入 "Parameters."
2. 检查补全列表是否包含:
   - `Parameters.WorldPosition`
   - `Parameters.CameraVector`
   - `Parameters.LightVector`
   - `Parameters.VertexColor`

#### 测试 4: 材质函数
1. 输入 "GetMaterial"
2. 检查补全列表是否包含:
   - `GetMaterialEmissive`
   - `GetMaterialBaseColor`
   - `GetMaterialMetallic`
   - `GetMaterialSpecular`
   - `GetMaterialRoughness`

#### 测试 5: 悬停提示
1. 将鼠标悬停在 Unreal 函数上（如 `Texture2DSample`）
2. 检查是否显示:
   - 函数签名
   - 参数列表
   - 中英文描述
   - 示例代码

**预期结果**:
- ✓ 所有 Unreal 函数都有补全
- ✓ 补全项按相关性排序
- ✓ 悬停提示显示完整信息
- ✓ 中英文描述清晰准确

---

### ✅ 跳转功能验证

**功能说明**:
- 定义跳转提供器已支持 `.usf` 和 `.ush` 文件
- 支持 `#include` 跳转
- 支持函数定义跳转
- 支持宏定义跳转

**测试步骤**:

#### 测试 1: Include 跳转
1. 打开 `/Users/ashiqi/Documents/UGit/EngineSource/Engine/Shaders/Private/Common.ush`
2. 找到 `#include "/Engine/Public/Platform.ush"` 行
3. 按住 Ctrl（或 Cmd）点击路径
4. 检查是否跳转到对应文件

#### 测试 2: 函数定义跳转
1. 在 Unreal Shader 文件中找到一个函数调用
2. 按住 Ctrl（或 Cmd）点击函数名
3. 检查是否跳转到函数定义

#### 测试 3: 宏定义跳转
1. 在 Unreal Shader 文件中找到一个宏使用
2. 按住 Ctrl（或 Cmd）点击宏名
3. 检查是否跳转到宏定义

**预期结果**:
- ✓ Include 跳转正常工作
- ✓ 函数定义跳转正常工作
- ✓ 宏定义跳转正常工作
- ✓ 跳转到正确的位置

---

## 完整测试流程

### 步骤 1: 环境准备
```bash
# 1. 编译扩展
cd /Users/ashiqi/Documents/vscode-unitylabshader
npm run compile

# 2. 按 F5 启动调试
# 或者打包安装：npm run build
```

### 步骤 2: 打开测试文件
```
打开 Unreal Shader 测试目录：
/Users/ashiqi/Documents/UGit/EngineSource/Engine/Shaders
```

### 步骤 3: 测试文件类型识别
```
1. 打开 Private/Common.ush
2. 检查状态栏显示 "Unity/Unreal Shader"
3. 检查状态栏显示 "Unreal" 图标
```

### 步骤 4: 测试补全功能
```
1. 在文件中输入 "Texture2D"
   预期: 显示 Texture2DSample 等函数
   
2. 输入 "View."
   预期: 显示 View.ViewOrigin 等变量
   
3. 输入 "Parameters."
   预期: 显示 Parameters.WorldPosition 等变量
   
4. 输入 "lerp"
   预期: 显示 HLSL 基础函数 lerp
```

### 步骤 5: 测试悬停提示
```
1. 将鼠标悬停在 "Texture2DSample" 上
   预期: 显示函数签名、参数、描述和示例
   
2. 将鼠标悬停在 "View.ViewOrigin" 上
   预期: 显示变量类型和描述
```

### 步骤 6: 测试跳转功能
```
1. 找到 #include "/Engine/Public/Platform.ush"
2. Ctrl+点击路径
   预期: 跳转到 Platform.ush 文件
   
3. 找到一个函数调用，Ctrl+点击
   预期: 跳转到函数定义
```

### 步骤 7: 测试引擎切换
```
1. 点击状态栏的引擎图标
2. 选择 "Unity"
3. 输入 "UnityObject"
   预期: 显示 UnityObjectToClipPos 等 Unity 函数
   
4. 再次点击状态栏图标
5. 选择 "Unreal"
6. 输入 "Texture2D"
   预期: 显示 Texture2DSample 等 Unreal 函数
```

---

## 已知限制

1. **引擎检测准确性**:
   - 对于 `.hlsl` 文件，需要根据路径和内容判断
   - 如果检测不准确，可以手动切换引擎类型

2. **Include 跳转**:
   - 只支持相对路径和工作区路径
   - 对于 Unreal 的虚拟路径（如 `/Engine/Private/`），需要文件实际存在

3. **补全范围**:
   - 当前只包含最常用的 Unreal 函数（50+ 个）
   - 更多函数可以后续添加

---

## 下一步计划（已移至高级功能）

以下功能已移至 Phase 9（高级功能扩展），优先级降低：

- **10.5 Unreal 代码片段**: 提供常用 Unreal Shader 代码模板
- **10.3 自定义节点支持**: 支持 Unreal 材质编辑器的 Custom 节点
- **10.6 Niagara 支持**: 支持 Niagara 粒子系统的 HLSL 脚本

---

## 总结

✅ **Phase 10 核心功能已完成**:
- 文件类型扩展（.usf, .ush）
- 引擎自动检测和手动切换
- Unreal 材质函数库（50+ 函数）
- 补全功能（函数、变量、宏）
- 跳转功能（include、函数、宏）

🎯 **测试重点**:
1. 打开 Unreal Shader 文件，检查引擎类型识别
2. 测试 Unreal 特有函数补全（Texture2DSample、View.* 等）
3. 测试 Unity/Unreal 补全隔离
4. 测试 include 跳转功能

📝 **反馈**:
如有问题或建议，请记录测试结果并反馈。
