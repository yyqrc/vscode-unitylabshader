# 跨文件重命名功能测试指南

## 功能概述

跨文件重命名功能允许您在整个工作区范围内重命名 HLSL/Shader 符号，并自动更新所有引用。该功能包含：

- ✅ **全工作区搜索**：自动查找所有文件中的引用
- ✅ **智能符号检测**：自动识别宏、函数、变量、结构体
- ✅ **预览界面**：重命名前显示影响范围
- ✅ **批量编辑**：一次性更新所有文件

## 支持的符号类型

### 1. 宏定义 (Macro)
```hlsl
#define MY_CONSTANT 1.0

float result = MY_CONSTANT * 2.0;  // 引用
```

### 2. 函数 (Function)
```hlsl
float4 MyFunction(float2 uv) {      // 定义
    return float4(uv, 0, 1);
}

void main() {
    color = MyFunction(texCoord);    // 调用
}
```

### 3. 结构体 (Struct)
```hlsl
struct MyStruct {                    // 定义
    float3 position;
    float2 uv;
};

MyStruct data;                       // 使用
```

### 4. 变量 (Variable)
```hlsl
float myVariable = 1.0;              // 定义

float result = myVariable * 2.0;     // 引用
```

## 使用方法

### 方式 1：快捷键
1. 将光标放在要重命名的符号上
2. 按 `F2` 键（或 `Fn + F2`）
3. 输入新名称
4. 在预览界面中查看影响范围
5. 选择"确认重命名"或按 `Enter` 执行

### 方式 2：右键菜单
1. 右键点击符号
2. 选择"重命名符号"
3. 输入新名称
4. 查看预览并确认

### 方式 3：命令面板
1. `Cmd+Shift+P` (macOS) 或 `Ctrl+Shift+P` (Windows/Linux)
2. 输入 "Rename Symbol"
3. 按照提示操作

## 预览界面说明

重命名预览界面会显示：

```
┌─ 重命名预览 ─────────────────────────────┐
│ $(info) 重命名摘要                       │
│ oldName → newName                        │
│ 影响 3 个文件，共 12 处引用              │
├──────────────────────────────────────────┤
│ $(file) shader.hlsl              5 处    │
│   $(symbol-misc) Line 10                 │
│   float4 oldName(...)                    │
│   $(symbol-misc) Line 45                 │
│   result = oldName(pos);                 │
│   ...还有 3 处                           │
│                                          │
│ $(file) common.hlsli            4 处     │
│   $(symbol-misc) Line 4                  │
│   float4 oldName(...);                   │
│   ...还有 3 处                           │
├──────────────────────────────────────────┤
│ $(check) 确认重命名 - 按 Enter 继续     │
│ $(close) 取消 - 按 Esc 取消             │
└──────────────────────────────────────────┘
```

**界面元素说明**：
- **重命名摘要**：显示旧名称→新名称，以及总影响统计
- **文件列表**：按文件分组显示所有引用
- **代码预览**：每个文件显示前 3 处引用的代码行
- **操作按钮**：确认或取消重命名

## 测试场景

### 场景 1：单文件重命名

**测试文件**：`test_single.hlsl`
```hlsl
float myFunc(float x) {
    return x * 2.0;
}

float result = myFunc(1.0);
```

**操作**：
1. 光标放在第 1 行的 `myFunc` 上
2. 按 `F2`
3. 输入 `newFunc`
4. 确认预览（应显示 1 个文件，2 处引用）
5. 确认重命名

**预期结果**：
```hlsl
float newFunc(float x) {
    return x * 2.0;
}

float result = newFunc(1.0);
```

### 场景 2：跨文件重命名

**测试文件 1**：`common.hlsli`
```hlsl
float4 CalculateColor(float2 uv);  // 声明
```

**测试文件 2**：`shader.hlsl`
```hlsl
#include "common.hlsli"

float4 CalculateColor(float2 uv) {  // 定义
    return float4(uv, 0, 1);
}

void main() {
    color = CalculateColor(texCoord);  // 调用
}
```

**操作**：
1. 在任一文件中，光标放在 `CalculateColor` 上
2. 按 `F2`
3. 输入 `ComputeColor`
4. 确认预览（应显示 2 个文件，3 处引用）
5. 确认重命名

**预期结果**：
- `common.hlsli` 和 `shader.hlsl` 中的所有 `CalculateColor` 都被替换为 `ComputeColor`

### 场景 3：宏重命名

**测试文件 1**：`defines.hlsli`
```hlsl
#define MAX_LIGHTS 8
```

**测试文件 2**：`lighting.hlsl`
```hlsl
#include "defines.hlsli"

for (int i = 0; i < MAX_LIGHTS; i++) {
    // ...
}
```

**操作**：
1. 光标放在 `MAX_LIGHTS` 上
2. 重命名为 `LIGHT_COUNT`
3. 确认预览
4. 确认重命名

**预期结果**：
- 两个文件中的 `MAX_LIGHTS` 都被替换为 `LIGHT_COUNT`

### 场景 4：结构体重命名

**测试文件**：`structs.hlsl`
```hlsl
struct VertexInput {
    float3 position : POSITION;
    float2 uv : TEXCOORD0;
};

VertexInput vert(VertexInput input) {
    return input;
}
```

**操作**：
1. 重命名 `VertexInput` 为 `VSInput`
2. 确认预览（应显示 3 处引用）
3. 确认重命名

**预期结果**：
```hlsl
struct VSInput {
    float3 position : POSITION;
    float2 uv : TEXCOORD0;
};

VSInput vert(VSInput input) {
    return input;
}
```

## 边界情况测试

### 1. 关键字保护
尝试重命名 `float`、`struct` 等关键字应该失败：
- **预期**：显示错误提示"无法重命名关键字"

### 2. 内置函数保护
尝试重命名 `normalize`、`dot` 等内置函数应该失败：
- **预期**：显示错误提示"无法重命名内置函数"

### 3. 无效标识符
尝试重命名为 `123abc`、`my-var` 等无效标识符应该失败：
- **预期**：显示错误提示"无效的标识符名称"

### 4. 无引用情况
重命名一个没有任何引用的符号：
- **预期**：显示警告"未找到符号的引用"

### 5. 取消操作
在预览界面选择"取消"或按 `Esc`：
- **预期**：不执行任何修改

## 已知限制

1. **注释中的匹配**：当前会匹配注释中的符号（未来可能优化）
2. **字符串中的匹配**：当前会匹配字符串字面量中的符号（未来可能优化）
3. **作用域检测**：当前为全局搜索，不区分作用域（适用于 HLSL 的全局特性）

## 性能说明

- **小型项目** (<100 文件)：重命名几乎即时完成
- **中型项目** (100-500 文件)：搜索可能需要 1-3 秒
- **大型项目** (>500 文件)：可能需要 3-10 秒

使用 ripgrep 进行快速搜索，性能优于传统的文本搜索方法。

## 故障排除

### 问题 1：重命名没有找到所有引用
**可能原因**：
- 符号名称包含特殊字符
- 文件不在工作区范围内

**解决方法**：
1. 确保所有相关文件都在工作区中
2. 检查符号名称是否正确

### 问题 2：预览界面显示错误
**可能原因**：
- 文件编码问题
- 文件过大

**解决方法**：
1. 确保文件使用 UTF-8 编码
2. 尝试关闭然后重新打开文件

### 问题 3：重命名后撤销失败
**解决方法**：
- 使用 `Cmd+Z` (macOS) 或 `Ctrl+Z` (Windows/Linux) 逐文件撤销
- 或使用版本控制（Git）恢复

## 开发模式日志

在开发环境中，重命名操作会输出详细日志：

```
[Rename] Starting rename: oldName → newName
[Rename] Symbol type: function
[Rename] Searching in: /path/to/workspace
[Rename] Found 12 references
[Rename] User cancelled rename (或)
[Rename] Rename edit created successfully
```

**启用方法**：
- 通过 "Run Extension" 或 "Debug Extension" 启动
- 查看 Debug Console 输出

## 反馈和建议

如果发现问题或有改进建议，请：
1. 使用 `/reportbug` 命令报告问题
2. 提供具体的测试场景和预期结果
3. 包含相关的代码示例

## 版本历史

- **v0.1.3+** - 添加跨文件重命名功能
  - 支持全工作区搜索
  - 添加预览界面
  - 智能符号类型检测
