# Unity Shader 语言支持

[![版本](https://img.shields.io/badge/版本-1.0.8-blue.svg)](https://marketplace.visualstudio.com/items?itemName=your-publisher.UnityShader)
[![许可证](https://img.shields.io/badge/许可证-MIT-green.svg)](LICENSE.md)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.87.0+-blue.svg)](https://code.visualstudio.com/)

> 🎨 为 Visual Studio Code 提供专业的 Unity 和 Unreal Engine Shader 开发支持

[English](README.md) | 简体中文

为 VS Code 提供完整的 Unity 和 Unreal Engine Shader 语言支持，包括语法高亮、智能补全、符号导航、语义分析等功能。支持 `.shader`, `.cginc`, `.hlsl`, `.compute`, `.usf`, `.ush` 等文件类型。

---

## ✨ 主要功能

- ✨ **语法高亮** - 支持 ShaderLab 和 HLSL/CG 语法高亮
- 💡 **智能补全** - HLSL 内置函数、Unity/URP 内置变量和函数补全
- 📝 **悬停提示** - 显示函数签名和文档说明（支持中英文）
- 🔍 **符号导航** - 大纲视图、转到定义、查找引用（支持跨文件）
- ⚡ **语义分析** - 变量类型推断、未使用变量检测、Shader 变体分析
- 📱 **移动端优化** - 移动平台特性检测、half 精度建议、复杂度评分
- 🔧 **代码重构** - 重命名符号、代码格式化（支持跨文件）
- 📁 **代码折叠** - 支持 `{}` 括号、预处理器、代码块折叠
- 🎮 **Unreal 支持** - 支持 `.usf`/`.ush` 文件和 Unreal 函数补全

---

## 📸 功能展示



### 智能代码补全
![代码补全](https://raw.githubusercontent.com/yyqrc/vscode-unitylabshader/master/images/completion.png)

### 悬停文档提示
![悬停提示](https://raw.githubusercontent.com/yyqrc/vscode-unitylabshader/master/images/hover.png)

### 转到工作区符号
![转到工作区符号](https://raw.githubusercontent.com/yyqrc/vscode-unitylabshader/master/images/goto-symbol.png)

### 转到定义
![转到定义前](https://raw.githubusercontent.com/yyqrc/vscode-unitylabshader/master/images/find-define1.png)
![转到定义后](https://raw.githubusercontent.com/yyqrc/vscode-unitylabshader/master/images/find-define2.png)

### 查找所有引用
![转到工作区符号](https://raw.githubusercontent.com/yyqrc/vscode-unitylabshader/master/images/find-all-refs.png)
---

## 🚀 快速开始

### 安装

**方法 1: 从 VS Code Marketplace 安装（推荐）**

1. 打开 VS Code
2. 按 `Ctrl+Shift+X` (Windows/Linux) 或 `Cmd+Shift+X` (Mac) 打开扩展视图
3. 搜索 "Unity Shader"
4. 点击 "安装"

**方法 2: 从 VSIX 文件安装**

```bash
code --install-extension UnityShader-1.0.1.vsix
```

### 使用

1. **打开 Shader 文件**  
   打开任意 `.shader`、`.cginc`、`.hlsl` 或 `.compute` 文件，插件会自动激活

2. **开始编码**  
   - 输入 HLSL 函数名（如 `lerp`）查看智能补全
   - 悬停在函数上查看文档说明
   - 按住 `Ctrl/Cmd` 点击符号跳转到定义
   - 右键选择"重命名符号"进行跨文件重命名

---

## 💡 功能详解

### 智能代码补全

输入代码时自动显示相关建议：

- **HLSL 内置函数**: `lerp`, `saturate`, `dot`, `cross` 等 200+ 函数
- **Unity 内置变量**: `_Time`, `_WorldSpaceCameraPos`, `unity_ObjectToWorld` 等
- **Unity 内置函数**: `UnityObjectToClipPos`, `UNITY_MATRIX_MVP` 等
- **URP 函数**: `TransformObjectToHClip`, `GetMainLight` 等
- **语义标签**: `POSITION`, `TEXCOORD0`, `SV_Target` 等

```hlsl
// 示例：输入 "lerp" 触发补全
fixed4 result = lerp(colorA, colorB, t);
```

### 悬停文档提示

将鼠标悬停在函数或变量上，查看详细文档：

- 函数签名和参数说明
- 返回值类型
- 使用示例
- 支持中英文文档

### 符号导航

#### 跳转到定义 (Go to Definition)
- 按住 `Ctrl/Cmd` 点击符号跳转到定义
- 支持跨文件跳转（`.cginc` 文件）
- 支持宏定义跳转
- 支持 `#include` 文件跳转
- 支持 `FallBack` Shader 跳转

#### 查找所有引用 (Find All References)
- 右键选择"查找所有引用"
- 显示符号在项目中的所有使用位置
- 支持跨文件搜索

#### 重命名符号 (Rename Symbol)
- 右键选择"重命名符号"
- 支持跨文件批量重命名
- 显示预览并可撤销

### 语义分析

- **变量类型推断**: 自动推断变量类型
- **未使用变量检测**: 标记未使用的变量
- **Shader 变体分析**: 分析 `#pragma multi_compile` 变体

### 移动端优化分析

- **性能建议**: 检测性能问题并提供优化建议
- **精度建议**: 建议使用 `half` 代替 `float` 以提升移动端性能
- **兼容性检查**: 检测移动平台不支持的特性
- **复杂度评分**: 评估 Shader 复杂度

---

## 📁 支持的文件类型

| 扩展名 | 语言 | 说明 |
|--------|------|------|
| `.shader` | ShaderLab | Unity ShaderLab 文件 |
| `.cginc` | HLSL/CG | CG include 文件 |
| `.hlsl` | HLSL | HLSL 着色器文件 |
| `.hlsli` | HLSL | HLSL include 文件 |
| `.compute` | HLSL | 计算着色器文件 |
| `.cg` | CG | CG 着色器文件 |
| `.usf` | HLSL | Unreal Shader 文件 |
| `.ush` | HLSL | Unreal Shader Header |

---

## ⚙️ 配置选项

在 VS Code 设置中搜索 `unityshader` 可以找到所有配置项。

### 代码补全设置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `unityshader.suggest.basic` | `true` | 启用/禁用 HLSL 基础函数补全 |
| `unityshader.suggest.unity` | `true` | 启用/禁用 Unity 内置变量和函数补全 |
| `unityshader.suggest.urp` | `true` | 启用/禁用 URP (Universal Render Pipeline) 补全 |

### 分析设置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `unityshader.analysis.semanticAnalysis` | `true` | 启用/禁用语义分析（类型推断、未使用变量检测） |
| `unityshader.mobile.enabled` | `true` | 启用/禁用移动端优化分析 |

### 示例配置

在 `settings.json` 中添加：

```json
{
  "unityshader.suggest.basic": true,
  "unityshader.suggest.unity": true,
  "unityshader.suggest.urp": true,
  "unityshader.mobile.enabled": true,
  "unityshader.analysis.semanticAnalysis": true
}
```

---

## 🛠️ 开发

### 环境要求

- Node.js >= 14.x
- npm >= 6.x
- VS Code >= 1.87.0

### 构建和打包

本项目提供自动版本管理和打包脚本：

```bash
# 日常修复打包（patch 版本：1.0.0 → 1.0.1）
npm run build

# 新功能发布（minor 版本：1.0.0 → 1.1.0）
npm run build:minor

# 重大更新（major 版本：1.0.0 → 2.0.0）
npm run build:major
```

详细说明请查看 [BUILD_GUIDE.md](./BUILD_GUIDE.md)

### 开发脚本

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化，自动编译）
npm run watch

# 编译 TypeScript
npm run compile

# 类型检查
npm run check-types

# 代码检查和自动修复
npm run lint
npm run lint -- --fix
```

### 项目结构

```
vscode-unitylabshader/
├── src/                    # TypeScript 源代码
│   ├── hlsl/              # HLSL 语言支持
│   │   ├── completionProvider.ts
│   │   ├── hoverProvider.ts
│   │   ├── definitionProvider.ts
│   │   └── ...
│   ├── data/              # 数据文件（函数定义、文档等）
│   └── extension.ts       # 插件入口
├── syntaxes/              # 语法高亮定义
├── snippets/              # 代码片段
├── out/                   # 编译输出
└── package.json           # 插件配置
```

---

## 📚 文档

- [功能文档](./doc/FEATURES.md) - 完整功能说明和使用示例
- [技术规格](./doc/TECHNICAL_SPEC.md) - 架构设计和技术细节
- [构建指南](./BUILD_GUIDE.md) - 构建和打包说明
- [更新日志](./CHANGELOG.md) - 版本历史和变更记录
- [任务清单](./TODO.md) - 开发进度和计划

---

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

### 报告问题

如果您发现 bug 或有功能建议，请在 [GitHub Issues](https://github.com/yyqrc/vscode-unitylabshader/issues) 中提交。

### 贡献代码

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

---

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE.md](LICENSE.md) 了解详情。

---

## 🙏 致谢

感谢以下项目和资源：

- [Visual Studio Code](https://code.visualstudio.com/) - 优秀的代码编辑器
- [HLSL Tools for Visual Studio](https://github.com/tgjones/HlslTools) - HLSL 语言支持参考
- [Unity Documentation](https://docs.unity3d.com/) - Unity Shader 文档
- [Unreal Engine Documentation](https://docs.unrealengine.com/) - Unreal Shader 文档

---

## 📮 联系方式

- **问题反馈**: [GitHub Issues](https://github.com/yyqrc/vscode-unitylabshader/issues)
- **功能建议**: [GitHub Discussions](https://github.com/yyqrc/vscode-unitylabshader/discussions)

---

<div align="center">

**如果这个插件对您有帮助，请给个 ⭐️ Star！**

Made with ❤️ for Unity and Unreal Engine developers

</div>
