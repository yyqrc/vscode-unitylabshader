# Unity Shader 语言支持插件

为 VS Code 提供 Unity Shader 语言支持，包括 `.shader`, `.cginc`, `.hlsl`, `.compute` 等文件类型。

## 主要功能

- ✨ **语法高亮** - 支持 ShaderLab 和 HLSL/CG 语法高亮
- 💡 **代码补全** - HLSL 内置函数、Unity 内置变量和函数补全
- 📝 **悬停提示** - 显示函数签名和文档说明
- 🔍 **符号导航** - 大纲视图、转到定义、查找引用
- ⚡ **函数签名帮助** - 输入函数参数时显示提示

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
