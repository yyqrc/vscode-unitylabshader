# 自动版本打包使用指南

## 🚀 快速开始

### 方式一：使用 npm 脚本（推荐）

```bash
# 日常修复打包（patch 版本：0.1.0 → 0.1.1）
npm run build

# 新功能发布（minor 版本：0.1.0 → 0.2.0）
npm run build:minor

# 重大更新（major 版本：0.1.0 → 1.0.0）
npm run build:major
```

### 方式二：直接运行脚本

```bash
# patch 版本
node scripts/build-and-package.js patch

# minor 版本
node scripts/build-and-package.js minor

# major 版本
node scripts/build-and-package.js major
```

## 📋 完整流程

执行 `npm run build` 后，脚本会自动完成以下步骤：

1. **📝 增加版本号**
   - 自动更新 `package.json` 中的版本号
   - 在 `CHANGELOG.md` 中插入新版本模板

2. **🔍 类型检查**
   - 运行 TypeScript 类型检查

3. **🔨 编译打包**
   - 使用 esbuild 编译和压缩代码

4. **🗑️ 清理旧文件**
   - 删除之前的 `.vsix` 文件

5. **📦 生成 VSIX**
   - 打包生成新的 `.vsix` 安装包

6. **✅ 显示结果**
   - 显示包名、大小、版本等信息

## 📝 版本号规则

遵循[语义化版本](https://semver.org/lang/zh-CN/)规范：

- **PATCH**（0.1.0 → 0.1.1）：Bug 修复、小改进
- **MINOR**（0.1.0 → 0.2.0）：新功能、向下兼容
- **MAJOR**（0.1.0 → 1.0.0）：重大更新、不兼容变更

## 📖 使用示例

### 示例 1：修复 Bug

```bash
# 1. 修复代码后，运行打包
npm run build

# 输出：
# ✓ Version bumped: 0.1.0 → 0.1.1
# ✓ CHANGELOG.md updated with version 0.1.1
# ...
# ✅ Build and package completed successfully!
# 📦 Package: unityshader-0.1.1.vsix

# 2. 编辑 CHANGELOG.md，填写变更内容
# 3. 提交代码
git add .
git commit -m "fix: 修复语法高亮问题"
git tag v0.1.1
git push && git push --tags
```

### 示例 2：添加新功能

```bash
# 1. 开发新功能后，运行打包
npm run build:minor

# 输出：
# ✓ Version bumped: 0.1.0 → 0.2.0
# ...

# 2. 更新 CHANGELOG.md
# 3. 提交代码
git add .
git commit -m "feat: 添加代码折叠功能"
git tag v0.2.0
git push && git push --tags
```

### 示例 3：仅更新版本号（不打包）

```bash
# 如果只想更新版本号，不打包
npm run version:bump minor

# 或
node scripts/bump-version.js minor
```

## 📄 CHANGELOG 更新

脚本会自动在 `CHANGELOG.md` 中插入新版本模板：

```markdown
## [0.1.1] - 2026-01-10

### Added
- 

### Changed
- 

### Fixed
- 
```

**记得填写具体的变更内容！**

## 🔧 故障排除

### 问题：脚本无法执行

**解决方案：**
```bash
# 添加执行权限
chmod +x scripts/*.js
```

### 问题：打包失败

**检查清单：**
1. 确保已安装所有依赖：`npm install`
2. 确保 TypeScript 编译通过：`npm run check-types`
3. 查看错误信息，修复代码问题

### 问题：版本号没有更新

**检查：**
- 确保 `package.json` 文件可写
- 检查是否有语法错误

## 💡 最佳实践

1. **每次发布前**：
   - 运行 `npm run lint` 检查代码质量
   - 测试插件功能是否正常
   - 更新 CHANGELOG.md

2. **版本号选择**：
   - 日常 Bug 修复：使用 `patch`
   - 新功能添加：使用 `minor`
   - 重大更新：使用 `major`

3. **Git 工作流**：
   ```bash
   # 开发完成后
   npm run build          # 打包
   # 编辑 CHANGELOG.md
   git add .
   git commit -m "chore: bump version to x.x.x"
   git tag vx.x.x
   git push && git push --tags
   ```

4. **本地测试**：
   ```bash
   # 打包后先本地测试
   code --install-extension unityshader-x.x.x.vsix
   # 测试通过后再发布
   ```

## 📚 相关文档

- [scripts/README.md](./scripts/README.md) - 脚本详细说明
- [CHANGELOG.md](./CHANGELOG.md) - 版本变更记录
- [语义化版本规范](https://semver.org/lang/zh-CN/)
