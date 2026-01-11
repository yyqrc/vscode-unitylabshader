# Change Log

All notable changes to the "Unity Shader" extension will be documented in this file.

## [0.1.3] - 2026-01-11

### Added
- **跨文件重命名功能**：支持在整个工作区范围内重命名 HLSL/Shader 符号
  - 自动查找所有文件中的引用
  - 智能符号类型检测（宏、函数、变量、结构体）
  - 重命名前显示预览界面，展示影响范围
  - 支持批量编辑多个文件
  - 基于 ripgrep 的高性能搜索
- 添加详细的测试指南文档 (`doc/CROSS_FILE_RENAME_GUIDE.md`)

### Changed
- 重命名提供器从同步改为异步实现，提升性能
- 增强符号验证机制（关键字和内置函数保护）

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
- 从 Unreal Shader 改造为 Unity Shader 插件
- 支持的文件类型: `.shader`, `.cginc`, `.hlsl`, `.hlsli`, `.compute`, `.cg`
- 更新语言 ID 为 `unityshader`
- 更新配置项前缀为 `unityshader.`

### Added
- Unity Shader 基础语言支持
- HLSL/CG 语法高亮
- 代码补全功能
- 悬停提示功能
- 符号导航功能
