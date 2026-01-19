# Unity Shader Language Support

[![Version](https://img.shields.io/badge/Version-1.0.8-blue.svg)](https://marketplace.visualstudio.com/items?itemName=your-publisher.UnityShader)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.md)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.87.0+-blue.svg)](https://code.visualstudio.com/)

> 🎨 Professional Unity and Unreal Engine Shader development support for Visual Studio Code

[English](README.md) | Simplified Chinese

Provides complete Unity and Unreal Engine Shader language support for VS Code, including syntax highlighting, intelligent completion, symbol navigation, semantic analysis, and more. Supports file types such as `.shader`, `.cginc`, `.hlsl`, `.compute`, `.usf`, `.ush`.

---

## ✨ Main Features

- ✨ **Syntax Highlighting** - Support for ShaderLab and HLSL/CG syntax highlighting
- 💡 **Intelligent Completion** - Built-in HLSL functions, Unity/URP built-in variables and function completion
- 📝 **Hover Documentation** - Displays function signatures and documentation (supports both Chinese and English)
- 🔍 **Symbol Navigation** - Outline view, go to definition, find references (supports cross-file)
- ⚡ **Semantic Analysis** - Variable type inference, unused variable detection, Shader variant analysis
- 📱 **Mobile Optimization** - Detection of mobile platform features, half precision suggestions, complexity scoring
- 🔧 **Code Refactoring** - Rename symbols, code formatting (supports cross-file)
- 📁 **Code Folding** - Supports `{}` brackets, preprocessor, code block folding
- 🎮 **Unreal Support** - Supports `.usf`/`.ush` files and Unreal function completion

---

## 📸 Feature Showcase

### Intelligent Code Completion
![Code Completion](https://raw.githubusercontent.com/yyqrc/vscode-unitylabshader/master/images/completion.png)

### Hover Documentation Tips
![Hover Tips](https://raw.githubusercontent.com/yyqrc/vscode-unitylabshader/master/images/hover.png)

### Go to Workspace Symbol
![Go to Workspace Symbol](https://raw.githubusercontent.com/yyqrc/vscode-unitylabshader/master/images/goto-symbol.png)

### Go to Definition
![Before Go to Definition](https://raw.githubusercontent.com/yyqrc/vscode-unitylabshader/master/images/find-define1.png)
![After Go to Definition](https://raw.githubusercontent.com/yyqrc/vscode-unitylabshader/master/images/find-define2.png)

### Find All References
![Find All References](https://raw.githubusercontent.com/yyqrc/vscode-unitylabshader/master/images/find-all-refs.png)
---

## 🚀 Quick Start

### Installation

**Method 1: Install from VS Code Marketplace (Recommended)**

1. Open VS Code
2. Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac) to open the extensions view
3. Search for "Unity Shader"
4. Click "Install"

**Method 2: Install from VSIX file**

```bash
code --install-extension UnityShader-1.0.1.vsix
```

### Usage

1. **Open a Shader File**  
   Open any `.shader`, `.cginc`, `.hlsl`, or `.compute` file, and the plugin will activate automatically.

2. **Start Coding**  
   - Type HLSL function names (e.g., `lerp`) to see intelligent completion
   - Hover over functions to view documentation
   - Hold `Ctrl/Cmd` and click symbols to jump to definitions
   - Right-click and select "Rename Symbol" to rename across files

---

## 💡 Feature Details

### Intelligent Code Completion

Relevant suggestions are automatically displayed while typing code:

- **Built-in HLSL Functions**: Over 200 functions such as `lerp`, `saturate`, `dot`, `cross`, etc.
- **Unity Built-in Variables**: `_Time`, `_WorldSpaceCameraPos`, `unity_ObjectToWorld`, etc.
- **Unity Built-in Functions**: `UnityObjectToClipPos`, `UNITY_MATRIX_MVP`, etc.
- **URP Functions**: `TransformObjectToHClip`, `GetMainLight`, etc.
- **Semantic Tags**: `POSITION`, `TEXCOORD0`, `SV_Target`, etc.

```hlsl
// Example: Type "lerp" to trigger completion
fixed4 result = lerp(colorA, colorB, t);
```

### Hover Documentation Tips

Hover the mouse over functions or variables to view detailed documentation:

- Function signatures and parameter descriptions
- Return value types
- Usage examples
- Supports documentation in both Chinese and English

### Symbol Navigation

#### Go to Definition
- Hold `Ctrl/Cmd` and click the symbol to jump to its definition
- Supports cross-file jumps (to `.cginc` files)
- Supports macro definition jumps
- Supports `#include` file jumps
- Supports `FallBack` Shader jumps

#### Find All References
- Right-click and select "Find All References"
- Displays all usage locations of the symbol in the project
- Supports cross-file searches

#### Rename Symbol
- Right-click and select "Rename Symbol"
- Supports bulk renaming across files
- Shows preview and allows undo

### Semantic Analysis

- **Variable Type Inference**: Automatically infers variable types
- **Unused Variable Detection**: Marks unused variables
- **Shader Variant Analysis**: Analyzes `#pragma multi_compile` variants

### Mobile Optimization Analysis

- **Performance Suggestions**: Detects performance issues and provides optimization recommendations
- **Precision Suggestions**: Recommends using `half` instead of `float` for better mobile performance
- **Compatibility Checks**: Detects unsupported features on mobile platforms
- **Complexity Scoring**: Evaluates Shader complexity

---

## 📁 Supported File Types

| Extension | Language | Description |
|-----------|----------|-------------|
| `.shader` | ShaderLab | Unity ShaderLab file |
| `.cginc` | HLSL/CG | CG include file |
| `.hlsl` | HLSL | HLSL shader file |
| `.hlsli` | HLSL | HLSL include file |
| `.compute` | HLSL | Compute shader file |
| `.cg` | CG | CG shader file |
| `.usf` | HLSL | Unreal Shader file |
| `.ush` | HLSL | Unreal Shader Header |

---

## ⚙️ Configuration Options

Search for `unityshader` in VS Code settings to find all configuration items.

### Code Completion Settings

| Configuration | Default Value | Description |
|----------------|---------------|-------------|
| `unityshader.suggest.basic` | `true` | Enable/disable HLSL basic function completion |
| `unityshader.suggest.unity` | `true` | Enable/disable Unity built-in variable and function completion |
| `unityshader.suggest.urp` | `true` | Enable/disable URP (Universal Render Pipeline) completion |

### Analysis Settings

| Configuration | Default Value | Description |
|----------------|---------------|-------------|
| `unityshader.analysis.semanticAnalysis` | `true` | Enable/disable semantic analysis (type inference, unused variable detection) |
| `unityshader.mobile.enabled` | `true` | Enable/disable mobile optimization analysis |

### Example Configuration

Add the following to `settings.json`:

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

## 🛠️ Development

### Environment Requirements

- Node.js >= 14.x
- npm >= 6.x
- VS Code >= 1.87.0

### Build and Package

This project provides automatic version management and packaging scripts:

```bash
# Daily fix packaging (patch version: 1.0.0 → 1.0.1)
npm run build

# New feature release (minor version: 1.0.0 → 1.1.0)
npm run build:minor

# Major update (major version: 1.0.0 → 2.0.0)
npm run build:major
```

For details, please refer to [BUILD_GUIDE.md](./BUILD_GUIDE.md)

### Development Scripts

```bash
# Install dependencies
npm install

# Development mode (watch for file changes and auto-compile)
npm run watch

# Compile TypeScript
npm run compile

# Type checking
npm run check-types

# Code checking and auto-fix
npm run lint
npm run lint -- --fix
```

### Project Structure

```
vscode-unitylabshader/
├── src/                    # TypeScript source code
│   ├── hlsl/              # HLSL language support
│   │   ├── completionProvider.ts
│   │   ├── hoverProvider.ts
│   │   ├── definitionProvider.ts
│   │   └── ...
│   ├── data/              # Data files (function definitions, documentation, etc.)
│   └── extension.ts       # Plugin entry point
├── syntaxes/              # Syntax highlighting definitions
├── snippets/              # Code snippets
├── out/                   # Compilation output
└── package.json           # Plugin configuration
```

---

## 📚 Documentation

- [Feature Documentation](./doc/FEATURES.md) - Complete feature descriptions and usage examples
- [Technical Specification](./doc/TECHNICAL_SPEC.md) - Architecture design and technical details
- [Build Guide](./BUILD_GUIDE.md) - Build and packaging instructions
- [Change Log](./CHANGELOG.md) - Version history and change records
- [Task List](./TODO.md) - Development progress and plans

---

## 🤝 Contribution

Contributions, bug reports, and suggestions are welcome!

### Reporting Issues

If you find a bug or have a feature suggestion, please submit it to [GitHub Issues](https://github.com/yyqrc/vscode-unitylabshader/issues).

### Contributing Code

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see [LICENSE.md](LICENSE.md) for details.

---

## 🙏 Acknowledgments

Thanks to the following projects and resources:

- [Visual Studio Code](https://code.visualstudio.com/) - Excellent code editor
- [HLSL Tools for Visual Studio](https://github.com/tgjones/HlslTools) - HLSL language support reference
- [Unity Documentation](https://docs.unity3d.com/) - Unity Shader documentation
- [Unreal Engine Documentation](https://docs.unrealengine.com/) - Unreal Shader documentation

---

## 📮 Contact

- **Issue Feedback**: [GitHub Issues](https://github.com/yyqrc/vscode-unitylabshader/issues)
- **Feature Suggestions**: [GitHub Discussions](https://github.com/yyqrc/vscode-unitylabshader/discussions)

---

<div align="center">

**If this plugin is helpful to you, please give it a ⭐️ Star!**

Made with ❤️ for Unity and Unreal Engine developers

</div>