# 符号跳转性能优化测试

## 优化内容

### 1. 智能类型判断
- 根据上下文自动判断符号类型（函数/宏/结构体）
- 只搜索相关类型，避免无效搜索

### 2. 提前终止
- 找到结果后立即返回，不再继续搜索
- 预期：从 558ms 降到 172ms（减少 70%）

### 3. 并行搜索
- 未知类型时并行搜索所有类型
- 使用 Promise.all 提升效率

### 4. 搜索顺序优化
- 优先使用 ripgrep（快速精确）
- 只在失败时才使用 Symbol Provider

## 测试步骤

1. **启动开发模式**
   ```
   按 F5 运行扩展
   ```

2. **测试函数跳转**
   - 打开 `stdpassmeta.cginc` 第 143 行
   - 光标放在 `LinearToGammaSpaceFull` 上
   - 按 F12 跳转

3. **查看日志**
   - 在"调试控制台"查看性能日志
   - 关注 `[Performance]` 和 `[Search]` 日志

## 预期结果

### 优化前（旧日志）
```
[Performance] Total ripgrep time: 557ms
[Performance] Total time: 558ms
```
- 搜索了 Macro（210ms）、Function（172ms）、Struct（175ms）
- 即使找到也继续搜索

### 优化后（预期）
```
[Search] Guessed type: function
[Performance] Function search: 172ms
[Search] Found 1 results, early termination
[Performance] Total time: 172ms
```
- 只搜索 Function（172ms）
- 找到后立即返回
- **性能提升 70%**

## 测试场景

| 场景 | 符号 | 预期类型 | 预期耗时 |
|------|------|----------|----------|
| 函数调用 | `LinearToGammaSpaceFull(...)` | function | ~170ms |
| 宏定义 | `UNITY_MATRIX_MVP` | macro | ~210ms |
| 结构体 | `struct MyStruct` | type | ~175ms |
| 未知类型 | `SomeSymbol` | unknown | ~250ms (并行) |

## 验证要点

✅ 日志中出现 `[Search] Guessed type: xxx`  
✅ 日志中出现 `[Search] Found X results, early termination`  
✅ 总耗时显著降低（减少 50-70%）  
✅ 跳转功能正常工作

## 问题排查

如果性能没有提升：
1. 检查是否在开发模式下运行（F5）
2. 确认日志中有 `[Performance]` 输出
3. 检查是否正确识别了符号类型
4. 查看是否有错误日志
