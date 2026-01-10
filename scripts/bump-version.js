#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 获取版本类型参数，默认为 patch
const versionType = process.argv[2] || 'patch';

// 读取 package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// 解析当前版本号
const currentVersion = packageJson.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

// 根据类型增加版本号
let newVersion;
switch (versionType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
  default:
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

// 更新 package.json
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

console.log(`✓ Version bumped: ${currentVersion} → ${newVersion}`);

// 更新 CHANGELOG.md
const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
if (fs.existsSync(changelogPath)) {
  const changelog = fs.readFileSync(changelogPath, 'utf8');
  const today = new Date().toISOString().split('T')[0];
  
  // 在第一个 ## 之前插入新版本
  const lines = changelog.split('\n');
  const insertIndex = lines.findIndex(line => line.startsWith('## ['));
  
  if (insertIndex !== -1) {
    const newEntry = [
      `## [${newVersion}] - ${today}`,
      '',
      '### Added',
      '- ',
      '',
      '### Changed',
      '- ',
      '',
      '### Fixed',
      '- ',
      ''
    ];
    
    lines.splice(insertIndex, 0, ...newEntry);
    fs.writeFileSync(changelogPath, lines.join('\n'), 'utf8');
    console.log(`✓ CHANGELOG.md updated with version ${newVersion}`);
  }
}

process.exit(0);
