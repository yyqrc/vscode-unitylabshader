# 自动版本打包脚本

本目录包含用于自动增加版本号和打包插件的脚本。

## 脚本说明

### 1. bump-version.js
自动增加版本号并更新 CHANGELOG.md

**用法：**
```bash
node scripts/bump-version.js [patch|minor|major] [options]
```

**参数：**
- `patch`（默认）：增加修订版本号（0.1.0 → 0.1.1）
- `minor`：增加次版本号（0.1.0 → 0.2.0）
- `major`：增加主版本号（0.1.0 → 1.0.0）

**options（可选）：**
- `--added <text>`：写入到 `### Added`（可重复）
- `--changed <text>`：写入到 `### Changed`（可重复）
- `--fixed <text>`：写入到 `### Fixed`（可重复）
- `--notes-file <path>`：读取文件内容，按行拆分后追加到 `### Changed`

**功能：**
- 自动更新 package.json 中的版本号
- 在 CHANGELOG.md 中插入新版本条目模板
- 显示版本变更信息

### 2. build-and-package.js
完整的构建和打包流程

**用法：**
```bash
node scripts/build-and-package.js [patch|minor|major] [options]
```

**流程：**
1. 📝 增加版本号
2. 🔍 TypeScript 类型检查
3. 🔨 编译和打包代码
4. 🗑️ 清理旧的 VSIX 文件
5. 📦 生成新的 VSIX 包
6. ✅ 显示打包结果

## NPM 脚本

在 package.json 中已配置以下快捷命令：

```bash
# 打包并增加 patch 版本（推荐日常使用）
npm run build

# 打包并增加 minor 版本（新功能发布）
npm run build:minor

# 打包并增加 major 版本（重大更新）
npm run build:major

# 仅增加版本号（不打包）
npm run version:bump [patch|minor|major]
```

## 使用示例

### 日常修复打包
```bash
npm run build
# 版本：0.1.0 → 0.1.1
```

### 打包时同时填入 CHANGELOG
```bash
npm run build -- --changed "修复：注释中不再触发跳转/悬停/分析" --fixed "符号缓存漏解析部分函数"
```

### 新功能发布
```bash
npm run build:minor
# 版本：0.1.0 → 0.2.0
```

### 重大版本更新
```bash
npm run build:major
# 版本：0.1.0 → 1.0.0
```

### 仅更新版本号
```bash
npm run version:bump patch
# 或
node scripts/bump-version.js minor
```

## 输出示例

```
🚀 Starting build and package process...

📝 Step 1: Bumping version...
✓ Version bumped: 0.1.0 → 0.1.1
✓ CHANGELOG.md updated with version 0.1.1

🔍 Step 2: Type checking...
[TypeScript 类型检查输出]

🔨 Step 3: Building...
[esbuild 编译输出]

🗑️  Step 4: Cleaning old packages...
   Removed: unityshader-0.1.0.vsix

📦 Step 5: Packaging VSIX...
[vsce 打包输出]

✅ Build and package completed successfully!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Package: unityshader-0.1.1.vsix
📊 Size: 1.86 MB
🏷️  Version: 0.1.1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 To install locally:
   code --install-extension unityshader-0.1.1.vsix
```

## 注意事项

1. **版本号规范**：遵循语义化版本（Semantic Versioning）
   - MAJOR：不兼容的 API 修改
   - MINOR：向下兼容的功能性新增
   - PATCH：向下兼容的问题修正

2. **CHANGELOG 更新**：脚本会自动在 CHANGELOG.md 中插入新版本模板，记得填写具体的变更内容

3. **Git 提交**：打包后记得提交版本变更：
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore: bump version to x.x.x"
   git tag vx.x.x
   git push && git push --tags
   ```

4. **脚本权限**：如果脚本无法执行，需要添加执行权限：
   ```bash
   chmod +x scripts/*.js
   ```
