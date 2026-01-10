# Unity Shader 语言支持插件

为 VS Code 提供 Unity Shader 语言支持，包括 `.shader`, `.cginc`, `.hlsl`, `.compute` 等文件类型。

## 主要功能

- ✨ **语法高亮** - 支持 ShaderLab 和 HLSL/CG 语法高亮
- 💡 **代码补全** - HLSL 内置函数、Unity 内置变量和函数补全
- 📝 **悬停提示** - 显示函数签名和文档说明（支持中英文）
- 🔍 **符号导航** - 大纲视图、转到定义、查找引用（支持跨文件）
- ⚡ **函数签名帮助** - 输入函数参数时显示提示
- 📁 **代码折叠** - 支持 `{}` 括号、预处理器、代码块折叠
- 🔎 **宏定义跳转** - 支持宏定义和函数式宏的定义跳转

## 快速开始

### 1. 安装插件

在 VS Code 中打开扩展视图 (`Cmd+Shift+X` / `Ctrl+Shift+X`)，搜索 "Unity Shader"，点击安装。

或者从 VSIX 文件安装：
```bash
code --install-extension unityshader-x.x.x.vsix
```

### 2. 打开 Shader 文件

打开任意 `.shader`、`.cginc`、`.hlsl` 或 `.compute` 文件，插件会自动激活。

### 3. 使用功能

#### 代码补全
输入 HLSL 函数名或 Unity 内置变量，会自动显示补全列表：
- 输入 `lerp` - 显示 lerp 函数补全
- 输入 `_Time` - 显示 Unity 内置时间变量
- 输入 `UNITY_` - 显示所有 Unity 宏定义

#### 悬停提示
将鼠标悬停在函数名上，查看函数签名和说明文档（中英文）。

#### 跳转到定义
- 按住 `Cmd/Ctrl` 点击函数名跳转到定义
- 支持跨文件跳转（如 `.cginc` 文件中的函数）
- 支持宏定义跳转（如 `ALPHA_FUNC`）
- 支持带修饰符的函数（如 `inline`、`static`）

#### 代码折叠
点击行号左侧的折叠箭头，折叠代码块：
- `Properties { ... }`
- `SubShader { ... }`
- `Pass { ... }`
- `CGPROGRAM ... ENDCG`
- `#if ... #endif`

#### 查找引用
右键点击符号，选择"查找所有引用"，查看该符号在项目中的所有使用位置。

## 支持的文件类型

| 扩展名 | 说明 |
|--------|------|
| `.shader` | Unity ShaderLab 文件 |
| `.cginc` | CG include 文件 |
| `.hlsl` | HLSL 着色器文件 |
| `.hlsli` | HLSL include 文件 |
| `.compute` | 计算着色器文件 |
| `.cg` | CG 着色器文件 |

## 安装

1. 在 VS Code 中打开扩展视图 (`Cmd+Shift+X`)
2. 搜索 "Unity Shader"
3. 点击安装

或者从 VSIX 文件安装：
```bash
code --install-extension unityshader-x.x.x.vsix
```

## 配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `unityshader.suggest.basic` | `true` | 启用/禁用 HLSL 基础补全 |
| `unityshader.suggest.unity` | `true` | 启用/禁用 Unity 内置补全 |
| `unityshader.suggest.urp` | `true` | 启用/禁用 URP 补全 |
| `unityshader.openDocOnSide` | `true` | 在侧边打开文档链接 |

## 致谢

* [Visual Studio Code](https://code.visualstudio.com/)
* [HLSL Tools for Visual Studio](https://github.com/tgjones/HlslTools)

## 许可证

MIT License
