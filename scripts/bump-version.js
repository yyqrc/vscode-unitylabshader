#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function printUsage() {
  console.log(`
用法:
  node scripts/bump-version.js [patch|minor|major] [options]

options:
  --added <text>        追加到 Added（可重复）
  --changed <text>      追加到 Changed（可重复）
  --fixed <text>        追加到 Fixed（可重复）
  --notes-file <path>   读取文件内容，按行拆分后追加到 Changed
  -h, --help            显示帮助

示例:
  node scripts/bump-version.js patch --fixed "修复跳转定义在注释里触发"
  node scripts/bump-version.js minor --added "新增符号缓存" --changed "优化 hover"
  npm run build -- --changed "更新 CHANGELOG 自动填充"
`);
}

// 解析参数：允许直接 `node scripts/bump-version.js --help`（不传 versionType）
const rawArgs = process.argv.slice(2);
const knownVersionTypes = new Set(['patch', 'minor', 'major']);
const versionType = rawArgs.length > 0 && knownVersionTypes.has(rawArgs[0]) ? rawArgs[0] : 'patch';
const extraArgs = rawArgs.length > 0 && knownVersionTypes.has(rawArgs[0]) ? rawArgs.slice(1) : rawArgs;

if (extraArgs.includes('-h') || extraArgs.includes('--help')) {
  printUsage();
  process.exit(0);
}

function normalizeNoteLines(text) {
  return text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .filter(l => !l.startsWith('#'))
    .map(l => l.replace(/^-+\s*/, '').trim())
    .filter(l => l.length > 0);
}

function parseChangelogArgs(argv) {
  const result = { added: [], changed: [], fixed: [], notesFile: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--added') {
      const v = argv[i + 1];
      if (v) {result.added.push(v); i++;}
      continue;
    }
    if (arg === '--changed' || arg === '--changelog') {
      const v = argv[i + 1];
      if (v) {result.changed.push(v); i++;}
      continue;
    }
    if (arg === '--fixed') {
      const v = argv[i + 1];
      if (v) {result.fixed.push(v); i++;}
      continue;
    }
    if (arg === '--notes-file') {
      const v = argv[i + 1];
      if (v) {result.notesFile = v; i++;}
      continue;
    }
  }
  return result;
}

function buildSection(title, items) {
  const lines = [];
  lines.push(`### ${title}`);
  if (items.length === 0) {
    lines.push('- ');
  } else {
    for (const item of items) {
      lines.push(`- ${item}`);
    }
  }
  lines.push('');
  return lines;
}

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

  const parsed = parseChangelogArgs(extraArgs);
  const addedItems = [...parsed.added];
  const changedItems = [...parsed.changed];
  const fixedItems = [...parsed.fixed];

  if (parsed.notesFile) {
    const notesFilePath = path.isAbsolute(parsed.notesFile)
      ? parsed.notesFile
      : path.join(process.cwd(), parsed.notesFile);
    if (fs.existsSync(notesFilePath)) {
      const notesText = fs.readFileSync(notesFilePath, 'utf8');
      changedItems.push(...normalizeNoteLines(notesText));
    } else {
      console.warn(`⚠️  notes-file not found: ${notesFilePath}`);
    }
  }
  
  // 在第一个 ## 之前插入新版本
  const lines = changelog.split('\n');
  const insertIndex = lines.findIndex(line => line.startsWith('## ['));
  
  if (insertIndex !== -1) {
    const alreadyExists = lines.some(line => line.startsWith(`## [${newVersion}]`));
    if (alreadyExists) {
      console.warn(`⚠️  CHANGELOG.md already contains version ${newVersion}, skip inserting a duplicate entry.`);
      process.exit(0);
    }

    const newEntry = [
      `## [${newVersion}] - ${today}`,
      '',
      ...buildSection('Added', addedItems),
      ...buildSection('Changed', changedItems),
      ...buildSection('Fixed', fixedItems),
      ''
    ];
    
    lines.splice(insertIndex, 0, ...newEntry);
    fs.writeFileSync(changelogPath, lines.join('\n'), 'utf8');
    console.log(`✓ CHANGELOG.md updated with version ${newVersion}`);
  }
}

process.exit(0);
