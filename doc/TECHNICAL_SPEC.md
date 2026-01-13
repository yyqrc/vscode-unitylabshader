# Unity Shader 插件 - 技术规格

## 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    VS Code Extension                     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ Completion  │  │   Hover     │  │    Symbol       │ │
│  │  Provider   │  │  Provider   │  │   Provider      │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ Definition  │  │  Reference  │  │    Rename       │ │
│  │  Provider   │  │  Provider   │  │   Provider      │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │ Symbol Cache    │  │ Analysis (Semantic/Variant) │  │
│  │ (Multi-thread)  │  │                             │  │
│  └─────────────────┘  └─────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   Unity     │  │   Unreal    │  │    Mobile       │ │
│  │  Globals    │  │  Globals    │  │   Analyzer      │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 核心模块

### 1. 符号缓存系统

**特性**:
- 持久化存储到本地文件系统
- 多线程并行解析（最多 4 个 Worker）
- 增量更新，避免重复扫描
- 跨文件符号移动检测

**性能指标**:
| 操作 | 时间 |
|------|------|
| 首次构建 | 2-10秒（取决于项目大小） |
| 后续启动 | <100ms |
| 符号查找 | <10ms |
| 单文件更新 | <50ms |

### 2. 语义分析器

**功能**:
- 变量类型推断
- 未使用变量/函数检测
- 作用域分析
- 实时分析，无需手动触发

### 3. 变体分析器

**功能**:
- 统计 `multi_compile`/`shader_feature` 变体数量
- 超过阈值警告（默认 256 警告，512 错误）
- 优化建议

### 4. 移动平台分析器

**功能**:
- 平台特性检测（ES3.0/3.1/Metal/Vulkan）
- half 精度优化建议
- 纹理采样优化
- Shader 复杂度评分

**检测内容**:
- 不支持的特性（double、Geometry Shader 等）
- 不推荐的函数（discard、ddx/ddy 等）
- 依赖纹理读取

### 5. 引擎检测

**识别逻辑**:
1. 文件扩展名：`.usf`/`.ush` → Unreal
2. 文件内容：`CGPROGRAM`/`UNITY_` → Unity
3. 文件路径：包含 `Engine/Shaders` → Unreal
4. 默认：Unity

---

## 关键技术点

### ripgrep 集成
使用 `@vscode/ripgrep` 进行快速跨文件搜索：

```typescript
// 函数定义搜索
const funcPattern = `^(?:inline|static|extern)?\\s*\\w+\\s+${name}\\s*\\(`;

// 宏定义搜索
const macroPattern = `^\\s*#define\\s+${name}\\b`;
```

### 符号签名生成
用于跨文件移动检测：

```typescript
// 签名格式: {returnType} {functionName}({params})
// 示例: float4 MyFunction(float3 pos, float intensity)
```

### 优先级排序
补全列表按匹配度排序：
1. 完全匹配（大小写一致）
2. 完全匹配（忽略大小写）
3. 前缀匹配
4. 驼峰匹配
5. 包含匹配

---

## 数据结构

### 符号缓存格式

```typescript
interface SymbolCache {
    version: string;
    workspacePath: string;
    files: {
        [filePath: string]: {
            fileHash: string;
            symbols: SymbolInfo[];
        }
    };
    symbolIndex: {
        [symbolName: string]: SymbolReference[];
    };
}
```

### 复杂度评分

```typescript
interface ComplexityScore {
    level: 'low' | 'medium' | 'high' | 'veryHigh';
    score: number;
    details: {
        textureOps: number;
        mathOps: number;
        branches: number;
        loops: number;
    };
}
```

---

## 配置架构

所有配置项统一在 `unityshader.*` 命名空间下：

- `unityshader.suggest.*` - 补全相关
- `unityshader.analysis.*` - 分析相关
- `unityshader.mobile.*` - 移动端相关
