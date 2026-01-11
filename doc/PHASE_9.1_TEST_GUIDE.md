# Phase 9.1 智能代码分析 - 测试指南

> 📅 **完成日期**: 2026-01-11  
> 📝 **功能**: 语义分析（变量类型推断、未使用变量检测）+ Shader 变体分析

---

## 📋 功能概述

### 9.1.1 语义分析 ✅

#### 实现功能
1. **变量类型推断**
   - 自动识别变量声明
   - 推断变量类型
   - 悬停显示推断的类型

2. **未使用变量检测**
   - 检测已声明但未使用的变量
   - 检测已声明但未使用的函数
   - 显示灰色下划线提示（Hint级别）

3. **作用域分析**
   - 支持全局变量
   - 支持函数内局部变量
   - 支持函数参数

#### 实现文件
- `src/analysis/semanticAnalyzer.ts` - 语义分析器核心实现
- `src/hlsl/hoverProvider.ts` - 集成类型推断悬停提示
- `src/extension.ts` - 注册分析器和事件监听

---

### 9.1.2 Shader 变体分析 ✅

#### 实现功能
1. **变体数量统计**
   - 分析 `#pragma multi_compile` 指令
   - 分析 `#pragma shader_feature` 指令
   - 计算总变体数量

2. **变体数量显示**
   - 在 pragma 行末尾显示变体数量
   - 根据数量显示不同颜色（灰色/橙色/红色）

3. **变体警告**
   - 超过 256 个变体显示警告
   - 超过 512 个变体显示错误
   - 提供优化建议

4. **变体详情悬停**
   - 悬停在 pragma 行显示详细信息
   - 列出所有变体选项
   - 显示总变体数和优化建议

#### 实现文件
- `src/analysis/variantAnalyzer.ts` - 变体分析器核心实现
- `src/hlsl/hoverProvider.ts` - 集成变体详情悬停提示
- `src/extension.ts` - 注册分析器和事件监听

---

## 🧪 测试步骤

### 测试环境准备

1. **编译插件**
   ```bash
   cd /Users/ashiqi/Documents/vscode-unitylabshader
   npm run compile
   ```

2. **启动调试**
   - 按 F5 启动扩展开发主机
   - 或在 VS Code 中选择 "Run > Start Debugging"

3. **打开测试文件**
   - 测试目录：`/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/`
   - 或创建新的 `.shader` 文件进行测试

---

### 测试用例 1: 变量类型推断

**测试代码**:
```hlsl
Shader "Test/SemanticAnalysis"
{
    SubShader
    {
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            
            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
            };
            
            struct v2f
            {
                float2 uv : TEXCOORD0;
                float4 vertex : SV_POSITION;
            };
            
            v2f vert(appdata v)
            {
                v2f o;
                o.vertex = UnityObjectToClipPos(v.vertex);
                o.uv = v.uv;
                return o;
            }
            
            fixed4 frag(v2f i) : SV_Target
            {
                float3 color = float3(1, 0, 0);  // 声明变量
                float alpha = 1.0;                // 声明变量
                
                return fixed4(color, alpha);      // 使用变量
            }
            ENDCG
        }
    }
}
```

**测试步骤**:
1. 将鼠标悬停在 `color` 变量上
2. 将鼠标悬停在 `alpha` 变量上
3. 将鼠标悬停在 `o` 变量上

**预期结果**:
- ✅ 悬停在 `color` 显示：`(variable) float3 color` + "类型推断 (Type Inference)"
- ✅ 悬停在 `alpha` 显示：`(variable) float alpha` + "类型推断 (Type Inference)"
- ✅ 悬停在 `o` 显示：`(variable) v2f o` + "类型推断 (Type Inference)"

---

### 测试用例 2: 未使用变量检测

**测试代码**:
```hlsl
Shader "Test/UnusedVariables"
{
    SubShader
    {
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            
            struct v2f
            {
                float4 vertex : SV_POSITION;
            };
            
            v2f vert(float4 vertex : POSITION)
            {
                v2f o;
                o.vertex = UnityObjectToClipPos(vertex);
                
                // 未使用的变量
                float unusedVar = 1.0;
                float3 unusedColor = float3(1, 0, 0);
                
                return o;
            }
            
            fixed4 frag(v2f i) : SV_Target
            {
                // 未使用的变量
                float unusedAlpha = 0.5;
                
                return fixed4(1, 1, 1, 1);
            }
            
            // 未使用的函数
            float unusedFunction(float x)
            {
                return x * 2.0;
            }
            
            ENDCG
        }
    }
}
```

**测试步骤**:
1. 观察 `unusedVar`、`unusedColor`、`unusedAlpha` 变量
2. 观察 `unusedFunction` 函数

**预期结果**:
- ✅ `unusedVar` 有灰色下划线，悬停显示："变量 'unusedVar' 已声明但未使用"
- ✅ `unusedColor` 有灰色下划线，悬停显示："变量 'unusedColor' 已声明但未使用"
- ✅ `unusedAlpha` 有灰色下划线，悬停显示："变量 'unusedAlpha' 已声明但未使用"
- ✅ `unusedFunction` 有灰色下划线，悬停显示："函数 'unusedFunction' 已声明但未使用"

**注意**: 以下划线开头的变量（如 `_unusedVar`）不会被标记为未使用

---

### 测试用例 3: Shader 变体分析

**测试代码**:
```hlsl
Shader "Test/VariantAnalysis"
{
    SubShader
    {
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            
            // 2 个变体
            #pragma multi_compile _ USE_TEXTURE
            
            // 3 个变体
            #pragma multi_compile LOW_QUALITY MEDIUM_QUALITY HIGH_QUALITY
            
            // 2 个变体
            #pragma shader_feature _ USE_NORMAL_MAP
            
            // 总变体数: 2 * 3 * 2 = 12
            
            struct v2f
            {
                float4 vertex : SV_POSITION;
            };
            
            v2f vert(float4 vertex : POSITION)
            {
                v2f o;
                o.vertex = UnityObjectToClipPos(vertex);
                return o;
            }
            
            fixed4 frag(v2f i) : SV_Target
            {
                return fixed4(1, 1, 1, 1);
            }
            
            ENDCG
        }
    }
}
```

**测试步骤**:
1. 观察每个 `#pragma multi_compile` 和 `#pragma shader_feature` 行
2. 将鼠标悬停在这些行上

**预期结果**:
- ✅ 第一个 pragma 行末尾显示：`→ 2 variants`（灰色）
- ✅ 第二个 pragma 行末尾显示：`→ 3 variants`（灰色）
- ✅ 第三个 pragma 行末尾显示：`→ 2 variants`（灰色）
- ✅ 悬停在任意 pragma 行显示详细信息：
  - 变体关键字类型
  - 选项数量
  - 所有选项列表
  - 当前 Shader 总变体数：12

---

### 测试用例 4: 变体数量警告

**测试代码**:
```hlsl
Shader "Test/VariantWarning"
{
    SubShader
    {
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            
            // 创建大量变体
            #pragma multi_compile A B C D E F G H  // 8 variants
            #pragma multi_compile I J K L M N O P  // 8 variants
            #pragma multi_compile Q R S T U V W X  // 8 variants
            // 总变体数: 8 * 8 * 8 = 512
            
            struct v2f
            {
                float4 vertex : SV_POSITION;
            };
            
            v2f vert(float4 vertex : POSITION)
            {
                v2f o;
                o.vertex = UnityObjectToClipPos(vertex);
                return o;
            }
            
            fixed4 frag(v2f i) : SV_Target
            {
                return fixed4(1, 1, 1, 1);
            }
            
            ENDCG
        }
    }
}
```

**测试步骤**:
1. 观察 pragma 行的颜色
2. 查看问题面板（Problems Panel）
3. 将鼠标悬停在 pragma 行上

**预期结果**:
- ✅ pragma 行末尾的变体数量显示为**红色**（因为总数 = 512 > 512）
- ✅ 问题面板显示错误："Shader 变体数量过多: 512 个变体"
- ✅ 悬停显示警告信息和优化建议：
  - 使用 `shader_feature` 替代 `multi_compile`
  - 减少不必要的变体组合
  - 考虑使用 `multi_compile_local`

**变体数量颜色规则**:
- 灰色：< 256（正常）
- 橙色：256-512（警告）
- 红色：> 512（错误）

---

## 📊 功能验收标准

### 9.1.1 语义分析

| 功能 | 验收标准 | 状态 |
|------|---------|------|
| 变量类型推断 | 悬停在变量上显示推断的类型 | ✅ |
| 未使用变量检测 | 未使用的变量有灰色下划线提示 | ✅ |
| 未使用函数检测 | 未使用的函数有灰色下划线提示 | ✅ |
| 作用域分析 | 正确识别全局/局部/参数变量 | ✅ |
| 排除入口函数 | vert/frag/surf 等不标记为未使用 | ✅ |
| 排除下划线变量 | _开头的变量不标记为未使用 | ✅ |

### 9.1.2 Shader 变体分析

| 功能 | 验收标准 | 状态 |
|------|---------|------|
| 变体数量统计 | 正确计算 multi_compile 变体数 | ✅ |
| 变体数量显示 | pragma 行末尾显示变体数量 | ✅ |
| 颜色编码 | 根据数量显示不同颜色 | ✅ |
| 变体警告 | 超过 256 显示警告 | ✅ |
| 变体错误 | 超过 512 显示错误 | ✅ |
| 详情悬停 | 悬停显示变体详细信息 | ✅ |
| 优化建议 | 提供变体优化建议 | ✅ |

---

## 🔧 配置选项

目前语义分析和变体分析功能默认启用，无需额外配置。

未来可以添加以下配置项（可选）:
```json
{
  "unityshader.analysis.semanticAnalysis": true,
  "unityshader.analysis.variantAnalysis": true,
  "unityshader.analysis.maxVariantsWarning": 256,
  "unityshader.analysis.maxVariantsError": 512
}
```

---

## 🐛 已知限制

### 语义分析
1. **类型推断限制**
   - 仅支持简单的变量声明（如 `float x = 1.0;`）
   - 不支持复杂的表达式类型推断
   - 不支持函数返回值类型推断

2. **作用域限制**
   - 不支持嵌套作用域（如 if/for 块内的变量）
   - 不支持结构体成员变量

3. **误报情况**
   - 宏定义的变量可能被误报为未使用
   - 在字符串或注释中的变量名会被计为使用

### 变体分析
1. **计算限制**
   - 仅统计 multi_compile 和 shader_feature
   - 不考虑 Unity 内置的变体（如 SHADOWS_SCREEN）
   - 不考虑条件编译（#if/#ifdef）对变体的影响

2. **显示限制**
   - 变体数量装饰仅在活动编辑器中显示
   - 切换文件时需要重新触发分析

---

## 📝 后续优化方向

### 短期优化
1. **性能优化**
   - 添加分析结果缓存
   - 实现增量分析（仅分析修改的部分）
   - 优化大文件的分析性能

2. **功能增强**
   - 支持更复杂的类型推断
   - 支持跨文件的未使用检测
   - 支持结构体成员分析

### 长期优化
1. **高级分析**
   - 数据流分析
   - 控制流分析
   - 死代码检测

2. **智能建议**
   - 自动修复未使用变量
   - 变体优化建议
   - 代码重构建议

---

## 📚 相关文档

- [TODO.md](TODO.md) - Phase 9.1 详细需求
- [PROGRESS.md](PROGRESS.md) - 开发进度记录
- [README.md](README.md) - 插件使用说明

---

## ✅ 完成总结

### 实现成果

1. **语义分析器** (`semanticAnalyzer.ts`)
   - 350+ 行代码
   - 支持变量类型推断
   - 支持未使用变量/函数检测
   - 支持作用域分析

2. **变体分析器** (`variantAnalyzer.ts`)
   - 250+ 行代码
   - 支持变体数量统计
   - 支持变体警告和错误
   - 支持详细信息悬停

3. **集成修改**
   - 修改 `hoverProvider.ts` 集成类型推断和变体详情
   - 修改 `extension.ts` 注册分析器和事件监听
   - 所有代码编译通过，无错误

### 工作量统计

- **预计工作量**: 7-10h
- **实际工作量**: ~3h
- **代码行数**: ~600 行

### 下一步

Phase 9.1 已完成，可以继续实施：
- Phase 9.2: 代码重构功能
- Phase 9.3: 性能优化工具
- Phase 9.4: 调试支持

---

**文档版本**: v1.0  
**创建日期**: 2026-01-11  
**维护者**: Unity Shader Extension Team
