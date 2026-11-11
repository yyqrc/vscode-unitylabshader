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

## 本地化维护与验证

扩展文案跟随 VS Code 界面语言，英文为源文案，简体中文资源使用 `zh-cn`。其他语言或缺少译文时回退到英文。设置和命令标题在 `package.nls*.json`，运行时文案使用 `vscode.l10n.t()` 或从 `vscode` 导入的 `l10n.t()`，译文在 `l10n/bundle.l10n.zh-cn.json`。

新增或修改用户可见文案后，执行：

```bash
npm run l10n:export
# 补齐 package.nls.zh-cn.json 和 l10n/bundle.l10n.zh-cn.json
npm run l10n:check
npm run compile
npm run test:l10n
```

`l10n:check` 检查清单资源引用、源文案基准是否过期、英中资源的缺键/空值/多余键和占位符，以及源码中遗漏迁移的中文字符串。英文硬编码仍需要在新增通知、诊断、补全和悬停时检查；仅提取已标记的调用无法发现这些遗漏。打包会自动执行本地化检查。

代码片段的英文资源为 `snippets/unityshader.json`，中文资源为 `snippets/unityshader.zh-cn.json`，由清单中的 `%snippets.path%` 选择。两份文件只允许描述不同，名称、前缀、代码和其他字段必须一致，检查脚本会核对这些内容。选项处理使用稳定字段或选项对象，不根据翻译后的文字判断行为。

`test:l10n` 启动隔离的 VS Code 扩展测试宿主，分别断言实际语言为 `en` 和 `zh-cn`，检查设置、命令、片段路径、HLSL/Unity/URP/Unreal 文档、签名帮助及诊断。结果和日志位于 `.temp/localization/`。默认使用 Windows 上已安装的 VS Code；其他安装位置可通过 `VSCODE_EXECUTABLE` 指定。中文界面需要已安装的简体中文语言包；非默认配置可通过 `VSCODE_LANGUAGE_PACK_CONFIG` 指定语言包索引 `languagepacks.json`。

```bash
# 仅运行指定语言
npm run test:l10n -- --locale zh-cn
# 用 VS Code 原生选择框命令验证重命名取消、Esc 取消和跨文件确认
npm run test:l10n -- --rename
# 保留重命名选择框，供人工操作上述三个流程
npm run test:l10n -- --locale zh-cn --rename-ui
# 使用最低支持版本；没有指定 VSCODE_EXECUTABLE 时自动下载
npm run test:l10n -- --version 1.87.0
# 自动检查后保留窗口，供人工检查界面
npm run test:l10n -- --locale en --ui
```

`--ui` 模式检查完毕后，在对应结果目录创建 `ui-complete` 文件，测试宿主便会正常退出。验证解包后的 VSIX 时，把 `LOCALIZATION_EXTENSION_PATH` 指向包内的 `extension` 目录。

`--rename` 使用真实重命名提供器和选择框，调用 VS Code 原生的下一项、接受和 Esc 取消命令。每种语言检查两份文件中的三处引用：两个取消流程要求内存和磁盘内容保持不变，确认流程要求全部替换并保存。`--rename-ui` 改由操作者依次选择取消、按 Esc、选择确认；当前阶段写在对应结果目录的 `ui-ready` 文件中。

```bash
npm run l10n:pseudo
```

上述命令生成开发用的 `qps-ploc` 资源，保留片段文件路径。配合 VS Code 的 Pseudo Language Language Pack，可查找尚未接入本地化的显示文字。伪本地化资源不会打入发布包。
