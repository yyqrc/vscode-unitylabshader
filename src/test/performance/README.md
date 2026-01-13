# 性能测试框架

本目录包含用于测量和优化代码性能的基准测试框架。

## 目录结构

```
performance/
├── PerformanceTimer.ts      # 性能计时工具类
├── BenchmarkSuite.ts         # 基准测试套件
├── fixtures/                 # 测试用的 Shader 文件
│   ├── small-shader.hlsl    # 小型测试文件 (~200行)
│   ├── medium-shader.hlsl   # 中型测试文件 (~1000行)
│   └── large-shader.hlsl    # 大型测试文件 (~3000行)
├── results/                  # 测试结果输出目录
│   ├── baseline.json        # 基线性能数据
│   └── benchmark-*.json     # 历史测试结果
└── README.md                # 本文档
```

## 快速开始

### 1. 运行基准测试

```typescript
import { runBenchmarks } from './BenchmarkSuite';

// 运行所有基准测试
await runBenchmarks();
```

### 2. 使用性能计时器

```typescript
import { PerformanceTimer } from './PerformanceTimer';

const timer = new PerformanceTimer();

// 方式 1: 手动计时
timer.start('myOperation');
// ... 执行操作 ...
const duration = timer.end('myOperation');
console.log(`Operation took ${duration}ms`);

// 方式 2: 自动计时同步函数
const { result, duration } = timer.measure('myOperation', () => {
    // ... 执行操作 ...
    return someValue;
});

// 方式 3: 自动计时异步函数
const { result, duration } = await timer.measureAsync('myOperation', async () => {
    // ... 执行异步操作 ...
    return someValue;
});

// 查看统计信息
timer.printReport('myOperation');

// 比较两次测试
timer.printComparison('before', 'after');
```

### 3. 创建自定义基准测试

```typescript
import { BenchmarkSuite, BenchmarkConfig } from './BenchmarkSuite';

const suite = new BenchmarkSuite();

const config: BenchmarkConfig = {
    name: 'My Custom Test',
    filePath: '/path/to/test/file.hlsl',
    iterations: 100,
    warmupIterations: 10
};

await suite.runShaderParsingBenchmark(config);
```

## 测试场景

### 1. Shader 解析性能测试

测量解析不同大小 Shader 文件的性能：

- **小型文件** (~200行): 基础性能测试
- **中型文件** (~1000行): 典型项目文件大小
- **大型文件** (~3000行): 压力测试

**测试指标**:
- 平均解析时间
- 最小/最大解析时间
- P95/P99 百分位数
- 标准差

### 2. 符号查找性能测试

测量符号查找操作的性能：

- **单次查找**: 查找单个符号的耗时
- **批量查找**: 连续查找多个符号的耗时

**测试指标**:
- 查找操作平均耗时
- 查找成功率
- 缓存命中率（如适用）

### 3. 缓存操作性能测试

测量缓存读写操作的性能：

- 缓存构建时间
- 缓存序列化时间
- 缓存反序列化时间
- 增量更新时间

## 性能目标

根据需求文档，优化后应达到以下性能指标：

| 指标 | 优化前 | 目标 | 改进幅度 |
|------|--------|------|----------|
| Shader 分析时间 | 基线 | -30~40% | 30-40% |
| 符号查找速度 | 基线 | +30~40% | 30-40% |
| 插件启动时间 | 基线 | -20~30% | 20-30% |
| 语法解析速度 | 基线 | +25~35% | 25-35% |
| 文件操作耗时 | 基线 | -30% | 30% |

## 使用建议

### 建立基线

在开始优化前，先运行基准测试建立性能基线：

```bash
npm run benchmark
```

这会在 `results/baseline.json` 中保存基线数据。

### 验证优化效果

每次优化后，重新运行基准测试并与基线比较：

```typescript
const suite = new BenchmarkSuite();
await suite.runAllBenchmarks();
await suite.compareWithBaseline('./results/baseline.json');
```

### 持续监控

- 每次提交代码前运行基准测试
- 确保性能不会退化
- 记录每次优化的效果

## 注意事项

1. **环境一致性**: 在相同的硬件和系统环境下运行测试
2. **预热**: 测试前进行预热，避免 JIT 编译影响
3. **多次测量**: 运行足够多的迭代次数以获得稳定结果
4. **隔离测试**: 关闭其他应用程序，减少干扰
5. **统计分析**: 关注平均值、中位数和百分位数，而非单次结果

## 输出示例

```
=== Performance Report ===

Label: Small Shader (200 lines)_parsing
  Count:  100
  Min:    12.34 ms
  Max:    45.67 ms
  Mean:   23.45 ms
  Median: 22.10 ms
  StdDev: 5.67 ms
  P95:    34.56 ms
  P99:    42.34 ms
  Total:  2345.00 ms

=== Performance Comparison ===

Before (baseline):
  Mean: 35.67 ms
  Median: 34.20 ms

After (optimized):
  Mean: 23.45 ms
  Median: 22.10 ms

Improvement: 34.25%
Faster: optimized
```

## 扩展测试

可以根据需要添加更多测试场景：

- 不同类型的 Shader（顶点、片段、计算）
- 不同的语法特性（宏、模板、继承）
- 并发解析性能
- 内存使用情况
- 缓存命中率

## 相关文档

- [需求文档](../../../.codebuddy/plan/code-optimization/requirements.md)
- [任务清单](../../../.codebuddy/plan/code-optimization/task-item.md)
