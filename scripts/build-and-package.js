#!/usr/bin/env node

const { execSync, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function printUsage() {
  console.log(`
用法:
  node scripts/build-and-package.js [patch|minor|major] [options]

options 会透传给 bump-version.js（例如 --changed/--fixed/--notes-file）。

示例:
  npm run build -- --changed "修复：注释中不再触发悬停/分析"
`);
}

// 解析参数：允许直接 `node scripts/build-and-package.js --help`
const rawArgs = process.argv.slice(2);
const knownVersionTypes = new Set(['patch', 'minor', 'major']);
const versionType = rawArgs.length > 0 && knownVersionTypes.has(rawArgs[0]) ? rawArgs[0] : 'patch';
const bumpExtraArgs = rawArgs.length > 0 && knownVersionTypes.has(rawArgs[0]) ? rawArgs.slice(1) : rawArgs;

if (bumpExtraArgs.includes('-h') || bumpExtraArgs.includes('--help')) {
  printUsage();
  process.exit(0);
}

console.log(`\n🚀 Starting build and package process...\n`);

try {
  // 1. 增加版本号
  console.log('📝 Step 1: Bumping version...');
  execFileSync('node', [path.join(__dirname, 'bump-version.js'), versionType, ...bumpExtraArgs], { stdio: 'inherit' });

  // 读取新版本号
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const newVersion = packageJson.version;

  // 2. 运行类型检查
  console.log('\n🔍 Step 2: Type checking...');
  execSync('npm run check-types', { stdio: 'inherit' });

  // 3. 编译代码
  console.log('\n🔨 Step 3: Building...');
  execSync('npm run package', { stdio: 'inherit' });

  // 4. 删除旧的 VSIX 文件
  console.log('\n🗑️  Step 4: Cleaning old packages...');
  const vsixFiles = fs.readdirSync(__dirname + '/..')
    .filter(file => file.endsWith('.vsix'));
  vsixFiles.forEach(file => {
    fs.unlinkSync(path.join(__dirname, '..', file));
    console.log(`   Removed: ${file}`);
  });

  // 5. 打包 VSIX
  console.log('\n📦 Step 5: Packaging VSIX...');
  execSync('npx @vscode/vsce package', { stdio: 'inherit' });

  // 6. 显示结果
  const vsixFile = `unityshader-${newVersion}.vsix`;
  const stats = fs.statSync(path.join(__dirname, '..', vsixFile));
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

  console.log('\n✅ Build and package completed successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📦 Package: ${vsixFile}`);
  console.log(`📊 Size: ${sizeMB} MB`);
  console.log(`🏷️  Version: ${newVersion}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('💡 To install locally:');
  console.log(`   code --install-extension ${vsixFile}\n`);

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
