#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 获取版本类型参数，默认为 patch
const versionType = process.argv[2] || 'patch';

console.log(`\n🚀 Starting build and package process...\n`);

try {
  // 1. 增加版本号
  console.log('📝 Step 1: Bumping version...');
  execSync(`node ${path.join(__dirname, 'bump-version.js')} ${versionType}`, { stdio: 'inherit' });

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
