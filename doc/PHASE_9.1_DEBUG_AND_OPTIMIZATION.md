# Phase 9.1 调试日志添加与后续优化计划

> 📅 **日期**: 2026-01-11  
> 🎯 **目标**: 添加调试日志排查问题 + 规划后续优化

---

## 📝 问题描述

用户报告测试代码中变量类型推断不工作：

```hlsl
fixed4 frag(v2f i) : SV_Target
{
    float3 color = float3(1, 0, 0);  // 函数调用初始化
    float alpha = 1.0;                // 简单初始化
    v2f o;                            // 无初始化
    Texture2D<float4> tex;            // 泛型类型
    
    return fixed4(color, alpha);
}
```

**问题表现**：
- ✅ `color` 显示：`(semantic) color` - 这是 HLSL 语义，不是类型推断
- ❌ `alpha`、`o`、`tex` 没有任何悬停提示

---

## 🔧 添加的调试日志

### 1. semanticAnalyzer.ts

#### analyzeDocument 方法
```typescript
public analyzeDocument(document: vscode.TextDocument): void {
    console.log('[SemanticAnalyzer] 开始分析文档:', document.uri.fsPath);
    // ... 清理代码 ...
    console.log('[SemanticAnalyzer] 文档总行数:', lines.length);
    
    this.collectDefinitions(lines, document);
    console.log('[SemanticAnalyzer] 收集到的变量数量:', this.variables.size);
    console.log('[SemanticAnalyzer] 收集到的变量:', Array.from(this.variables.keys()));
    for (const [name, infos] of this.variables) {
        console.log(`[SemanticAnalyzer]   - ${name}:`, infos.map(v => `${v.type} (line ${v.line})`));
    }
    // ... 其他代码 ...
}
```

#### collectDefinitions 方法
```typescript
const varMatch = trimmedLine.match(/^(\w+(?:\d+)?(?:<[^>]+>)?)\s+(\w+)(?:\s*=|\s*;|\s*\[|\s*\()/);
if (varMatch && !inStruct) {
    const varType = varMatch[1];
    const varName = varMatch[2];
    console.log(`[SemanticAnalyzer] 第${i}行匹配到变量声明: ${varType} ${varName}`);
    
    if (!this.isKeyword(varType) && !this.isKeyword(varName) && !trimmedLine.includes(`${varName}(`)) {
        const scope = currentFunction || 'global';
        const varCharPos = line.indexOf(varName, line.indexOf(varType));
        console.log(`[SemanticAnalyzer]   添加变量: ${varName}, 类型: ${varType}, 作用域: ${scope}`);
        this.addVariable(varName, varType, i, varCharPos >= 0 ? varCharPos : 0, false, scope);
    } else {
        console.log(`[SemanticAnalyzer]   跳过（关键字或函数调用）: isKeyword(${varType})=${this.isKeyword(varType)}, isKeyword(${varName})=${this.isKeyword(varName)}, 包含函数调用=${trimmedLine.includes(`${varName}(`)}`);
    }
}
```

#### getVariableType 方法
```typescript
public getVariableType(varName: string, line: number): string | undefined {
    console.log(`[SemanticAnalyzer] getVariableType: 查询变量 '${varName}' 在第 ${line} 行`);
    console.log(`[SemanticAnalyzer] 当前存储的所有变量:`, Array.from(this.variables.keys()));
    
    const varInfos = this.variables.get(varName);
    if (!varInfos) {
        console.log(`[SemanticAnalyzer]   未找到变量 '${varName}'`);
        return undefined;
    }

    console.log(`[SemanticAnalyzer]   找到 ${varInfos.length} 个定义:`, varInfos.map(v => `${v.type} (line ${v.line})`));

    // ... 查找最近定义的逻辑 ...

    if (closestVar) {
        console.log(`[SemanticAnalyzer]   返回类型: ${closestVar.type}`);
    } else {
        console.log(`[SemanticAnalyzer]   未找到合适的定义`);
    }

    return closestVar?.type;
}
```

### 2. hoverProvider.ts

#### provideHover 方法
```typescript
// 变量类型推断悬停提示（优先级最高，排除预处理器）
console.log(`[HoverProvider] 悬停在单词 '${name}' 上，行号: ${position.line}, backchar: '${backchar}'`);
if (backchar !== '#') {
    const varType = this.semanticAnalyzer.getVariableType(name, position.line);
    console.log(`[HoverProvider] getVariableType 返回: ${varType}`);
    if (varType) {
        let contents: MarkdownString[] = [];
        const signature = new MarkdownString(`(*variable*) \`${varType}\` **${name}**`);
        contents.push(signature);
        contents.push(new MarkdownString('类型推断 (Type Inference)'));
        console.log(`[HoverProvider] 返回变量类型悬停提示`);
        return new Hover(contents, wordRange);
    } else {
        console.log(`[HoverProvider] 未找到变量类型，继续检查其他悬停提示`);
    }
}
```

---

## 🔍 调试日志的作用

### 1. 追踪分析流程
- 确认 `analyzeDocument` 是否被调用
- 确认文档内容是否正确读取
- 确认变量收集过程是否正常

### 2. 定位问题点
- 查看哪些变量被成功收集
- 查看哪些变量被跳过（以及原因）
- 查看类型推断查询是否成功

### 3. 验证修复效果
- 修复后查看日志确认变量被正确收集
- 确认类型推断返回正确的类型
- 确认悬停提示正确显示

---

## 📋 后续优化计划

### 优先级分类

#### 🔴 高优先级（影响核心功能）
无 - 核心功能已完成

#### 🟡 中优先级（性能和体验优化）

1. **性能优化：大文件增量分析**
   - **问题**: 大文件（>1000行）每次修改都全量分析，性能较差
   - **方案**: 实现增量分析，只分析修改的部分
   - **预计工作量**: 2-3h
   - **优先级**: 中

2. **性能优化：分析结果缓存**
   - **问题**: 频繁切换文件时重复分析
   - **方案**: 缓存分析结果，文件未修改时直接使用缓存
   - **预计工作量**: 1-2h
   - **优先级**: 中

3. **功能增强：类型不匹配检测**
   - **问题**: 无法检测类型不匹配的赋值（如 `float3 a = 1.0;`）
   - **方案**: 添加类型兼容性检查
   - **预计工作量**: 2-3h
   - **优先级**: 中

#### 🟢 低优先级（锦上添花）

4. **功能增强：参数数量错误检测**
   - **问题**: 无法检测函数调用参数数量错误
   - **方案**: 记录函数签名，检查调用时的参数数量
   - **预计工作量**: 2-3h
   - **优先级**: 低

5. **功能增强：嵌套作用域支持**
   - **问题**: 当前只支持全局和函数作用域，不支持 if/for 等嵌套作用域
   - **方案**: 使用栈结构跟踪作用域层级
   - **预计工作量**: 2-3h
   - **优先级**: 低

6. **功能增强：跨文件变体分析**
   - **问题**: 只分析当前文件的变体，无法分析 #include 文件的影响
   - **方案**: 解析 #include 文件，合并变体分析
   - **预计工作量**: 3-4h
   - **优先级**: 低

7. **配置增强：可配置的分析范围**
   - **问题**: 无法选择只分析特定类型的问题
   - **方案**: 添加细粒度配置项（如只检测未使用变量）
   - **预计工作量**: 1h
   - **优先级**: 低

8. **配置增强：可配置的警告级别**
   - **问题**: 无法调整警告的严重程度
   - **方案**: 添加配置项控制 Hint/Warning/Error 级别
   - **预计工作量**: 1h
   - **优先级**: 低

---

## 📊 优化任务汇总

| 任务 | 优先级 | 预计工作量 | 依赖 | 状态 |
|------|--------|-----------|------|------|
| 大文件增量分析 | 中 | 2-3h | 无 | ⬜ 待开始 |
| 分析结果缓存 | 中 | 1-2h | 无 | ⬜ 待开始 |
| 类型不匹配检测 | 中 | 2-3h | 无 | ⬜ 待开始 |
| 参数数量错误检测 | 低 | 2-3h | 无 | ⬜ 待开始 |
| 嵌套作用域支持 | 低 | 2-3h | 无 | ⬜ 待开始 |
| 跨文件变体分析 | 低 | 3-4h | 无 | ⬜ 待开始 |
| 可配置的分析范围 | 低 | 1h | 无 | ⬜ 待开始 |
| 可配置的警告级别 | 低 | 1h | 无 | ⬜ 待开始 |

**总预计工作量**: 14-20h

---

## 🎯 实施建议

### 第一批（性能优化）
如果用户反馈性能问题，优先实施：
1. 大文件增量分析（2-3h）
2. 分析结果缓存（1-2h）

### 第二批（功能增强）
如果用户需要更强的检查能力：
1. 类型不匹配检测（2-3h）
2. 参数数量错误检测（2-3h）

### 第三批（可选功能）
根据用户反馈决定是否实施：
1. 嵌套作用域支持（2-3h）
2. 跨文件变体分析（3-4h）
3. 配置增强（2h）

---

## 📝 实施注意事项

### 1. 性能优化
- 使用 `performance.now()` 测量分析耗时
- 添加性能监控日志
- 设置合理的缓存过期策略

### 2. 功能增强
- 保持非侵入式设计（Hint 级别）
- 提供配置项让用户关闭不需要的检查
- 避免误报，宁可漏报也不要误报

### 3. 用户体验
- 所有新功能都应该有配置项
- 提供清晰的错误信息和修复建议
- 保持中英双语支持

### 4. 测试覆盖
- 每个新功能都需要测试用例
- 测试边界情况和错误情况
- 确保不影响现有功能

---

## 🔗 相关文档

- [PHASE_9.1_FOURTH_FIXES.md](./PHASE_9.1_FOURTH_FIXES.md) - 第四批修复总结
- [PHASE_9.1_TEST_GUIDE.md](./PHASE_9.1_TEST_GUIDE.md) - 测试指南
- [TODO.md](./TODO.md) - 开发任务列表
- [PROGRESS.md](./PROGRESS.md) - 开发进度记录

---

**文档版本**: v1.0  
**创建日期**: 2026-01-11  
**维护者**: Unity Shader Extension Team
