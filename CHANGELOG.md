# Change Log

All notable changes to the "Unity Shader" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.0.6] - 2026-01-16

### Added
- 

### Changed
- 

### Fixed
- 

## [1.0.5] - 2026-01-16

### Added
- 

### Changed
- 

### Fixed
- 

## [1.0.4] - 2026-01-16

### Added
- 

### Changed
- 

### Fixed
- 

## [1.0.1] - 2026-01-14

### Added
- **Complete HLSL/CG Language Support**: Full syntax highlighting and IntelliSense for Unity and Unreal Engine shaders
- **Intelligent Code Completion**: Context-aware suggestions for HLSL keywords, Unity built-in variables/functions, and URP-specific APIs
- **Hover Documentation**: Instant documentation display for functions, variables, and shader properties
- **Symbol Navigation**: Go to definition, find all references, and peek definition support
- **Cross-File Rename**: Rename symbols across entire workspace with preview and batch editing
- **Semantic Analysis**: Variable type inference, unused variable detection, and shader variant analysis
- **Mobile Optimization Analysis**: Performance suggestions and compatibility checks for mobile platforms
- **Multi-Engine Support**: Auto-detection and support for both Unity and Unreal Engine shader files
- **Rich Snippets**: Pre-built code templates for common shader patterns and structures
- **Configurable Features**: Extensive settings to customize language features and analysis behavior

### Changed
- Improved symbol provider performance with async implementation
- Enhanced fuzzy matching algorithm for better completion suggestions
- Optimized cross-file search using ripgrep for faster rename operations

### Fixed
- Symbol validation to prevent renaming of keywords and built-in functions
- Type inference accuracy for complex shader variable declarations

## [0.1.3] - 2026-01-11

### Added
- **Cross-file Rename Feature**: Supports renaming HLSL/Shader symbols across the entire workspace
  - Automatically finds references in all files
  - Intelligent symbol type detection (macros, functions, variables, structures)
  - Preview interface before renaming to show the scope of impact
  - Supports batch editing of multiple files
  - High-performance search based on ripgrep
- Added detailed test guide document (`doc/CROSS_FILE_RENAME_GUIDE.md`)

### Changed
- Renaming provider changed from synchronous to asynchronous implementation, improving performance
- Enhanced symbol validation mechanism (protection for keywords and built-in functions)

### Fixed
- 

## [0.1.2] - 2026-01-10

### Added
- 

### Changed
- 

### Fixed
- 

## [0.1.1] - 2026-01-10

### Added
- 

### Changed
- 

### Fixed
- 

## [0.1.0] - 2025-01-09

### Changed
- Transformed from Unreal Shader to Unity Shader plugin
- Supported file types: `.shader`, `.cginc`, `.hlsl`, `.hlsli`, `.compute`, `.cg`
- Updated language ID to `unityshader`
- Updated configuration item prefix to `unityshader.`

### Added
- Basic language support for Unity Shader
- HLSL/CG syntax highlighting
- Code completion feature
- Hover tooltip feature
- Symbol navigation feature