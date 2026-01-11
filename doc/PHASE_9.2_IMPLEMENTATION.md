# Phase 9.2: 代码重构功能 - 实施文档

**实施日期**: 2026-01-11  
**状态**: ✅ 已完成

---

## 📋 实施概览

Phase 9.2 实现了两个核心的代码重构功能：
1. **重命名符号** (RenameProvider) - 支持函数和变量的智能重命名
2. **代码格式化** (FormattingProvider) - 支持整个文档和选区的代码格式化

---

## 🎯 实施内容

### 9.2.1 重命名符号功能 ✅

#### 实现文件
- `src/hlsl/renameProvider.ts` - 重命名提供器核心实现

#### 核心功能
1. **符号验证**
   - 检查是否是关键字（不可重命名）
   - 检查是否是内置函数（不可重命名）
   - 验证新名称是否是有效标识符

2. **作用域分析**
   - 自动检测符号的作用域（全局/函数/结构体）
   - 只在相同作用域内重命名引用
   - 支持函数内局部变量重命名
   - 支持全局变量重命名

3. **引用查找**
   - 使用正则表达式查找所有引用
   - 支持单词边界匹配（避免误匹配）
   - 自动更新所有引用位置

4. **用户体验**
   - 重命名前显示预览
   - 支持 F2 快捷键
   - 提供错误提示和警告

#### 使用方法
```
1. 将光标放在要重命名的符号上
2. 按 F2 键（或右键菜单选择"重命名符号"）
3. 输入新名称
4. 按 Enter 确认
```

#### 限制
- 当前仅支持当前文件内的重命名
- 不支持跨文件重命名（需要工作区扫描）
- 不支持宏定义的重命名

---

### 9.2.2 代码格式化功能 ✅

#### 实现文件
- `src/hlsl/formattingProvider.ts` - 格式化提供器核心实现

#### 核心功能
1. **缩进管理**
   - 自动计算大括号深度
   - 支持 Tab 或空格缩进
   - 遵循 VS Code 编辑器配置

2. **ShaderLab 支持**
   - 识别 ShaderLab 关键字
   - 特殊处理 Properties 属性格式
   - 保持 ShaderLab 结构的可读性

3. **注释保护**
   - 保持多行注释原样
   - 不破坏注释格式

4. **格式化选项**
   - 支持整个文档格式化
   - 支持选区格式化
   - 支持保存时自动格式化（需配置）

#### 使用方法
```
整个文档格式化:
- Windows/Linux: Shift + Alt + F
- macOS: Shift + Option + F

选区格式化:
1. 选中要格式化的代码
2. 右键菜单选择"格式化选区"
3. 或使用快捷键 Ctrl+K Ctrl+F (Windows/Linux) / Cmd+K Cmd+F (macOS)
```

#### 格式化规则
- 左大括号后缩进增加
- 右大括号前缩进减少
- 空行保持不变
- 多行注释保持原样
- ShaderLab 属性保持特定格式

---

## 📁 文件结构

```
src/
├── hlsl/
│   ├── renameProvider.ts          # 重命名提供器（新增）
│   ├── formattingProvider.ts      # 格式化提供器（新增）
│   └── ...
└── extension.ts                    # 注册新功能（已更新）
```

---

## 🧪 测试指南

### 测试文件
创建测试文件：`/Users/ashiqi/Documents/UGit/CGameEditorProject/LookDevProject/Assets/Shaders/RefactorTest.shader`

### 测试用例

#### 1. 重命名测试

**测试代码**:
```hlsl
Shader "Test/Refactor"
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
            };
            
            struct v2f
            {
                float4 pos : SV_POSITION;
            };
            
            v2f vert(appdata v)
            {
                v2f o;
                o.pos = UnityObjectToClipPos(v.vertex);
                return o;
            }
            
            fixed4 frag(v2f i) : SV_Target
            {
                float3 color = float3(1, 0, 0);
                float alpha = 1.0;
                return fixed4(color, alpha);
            }
            ENDCG
        }
    }
}
```

**测试步骤**:
1. 将光标放在 `color` 变量上
2. 按 F2
3. 输入新名称 `finalColor`
4. 按 Enter

**预期结果**:
- ✅ 声明行的 `color` 被重命名为 `finalColor`
- ✅ return 语句中的 `color` 被重命名为 `finalColor`
- ✅ 其他变量（如 `alpha`）不受影响

#### 2. 格式化测试

**测试代码（格式混乱）**:
```hlsl
Shader "Test/Format"
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
float4 pos : SV_POSITION;
};

v2f vert(float4 vertex : POSITION)
{
v2f o;
o.pos=UnityObjectToClipPos(vertex);
return o;
}

fixed4 frag(v2f i):SV_Target
{
return fixed4(1,0,0,1);
}
ENDCG
}
}
}
```

**测试步骤**:
1. 按 Shift + Alt + F (Windows/Linux) 或 Shift + Option + F (macOS)

**预期结果**:
- ✅ 所有大括号正确缩进
- ✅ 函数体内容正确缩进
- ✅ ShaderLab 结构保持清晰
- ✅ 代码可读性提升

#### 3. 作用域测试

**测试代码**:
```hlsl
float globalVar = 1.0;  // 全局变量

float4 func1()
{
    float localVar = 2.0;  // func1 的局部变量
    return float4(localVar, 0, 0, 1);
}

float4 func2()
{
    float localVar = 3.0;  // func2 的局部变量（同名）
    return float4(localVar, 0, 0, 1);
}
```

**测试步骤**:
1. 在 func1 中重命名 `localVar` 为 `value1`

**预期结果**:
- ✅ 只有 func1 中的 `localVar` 被重命名
- ✅ func2 中的 `localVar` 不受影响
- ✅ 全局变量 `globalVar` 不受影响

---

## ⚠️ 已知限制

### 重命名功能
1. **不支持跨文件重命名**
   - 当前只能重命名当前文件内的符号
   - 如果符号在其他文件中被引用，不会被更新

2. **不支持宏定义重命名**
   - #define 定义的宏无法重命名
   - 预处理器指令不在重命名范围内

3. **作用域检测限制**
   - 复杂的嵌套作用域可能检测不准确
   - 建议在简单的函数作用域内使用

### 格式化功能
1. **不支持运算符格式化**
   - 当前不会在运算符周围添加空格
   - 需要手动调整运算符格式

2. **ShaderLab 格式化有限**
   - 只支持基本的 ShaderLab 结构
   - 复杂的 ShaderLab 语法可能格式化不理想

3. **不支持对齐**
   - 不会对齐变量声明
   - 不会对齐注释

---

## 🔄 后续优化计划

### 重命名功能增强
- [ ] 支持跨文件重命名（需要工作区扫描）
- [ ] 支持宏定义重命名
- [ ] 改进作用域检测（支持复杂嵌套）
- [ ] 添加重命名预览面板
- [ ] 支持批量重命名

### 格式化功能增强
- [ ] 添加运算符格式化
- [ ] 支持变量声明对齐
- [ ] 支持注释对齐
- [ ] 添加更多格式化选项
- [ ] 支持自定义格式化规则
- [ ] 改进 ShaderLab 格式化

**预计工作量**: 6-8h

---

## 📊 实施统计

| 任务 | 预计工作量 | 实际工作量 | 状态 |
|------|-----------|-----------|------|
| 9.2.1 重命名符号 | 4-5h | ~2h | ✅ 完成 |
| 9.2.2 代码格式化 | 5-6h | ~2h | ✅ 完成 |
| **总计** | **9-11h** | **~4h** | **✅ 完成** |

---

## ✅ 验收标准

### 重命名功能
- ✅ 选中函数名按 F2 可以重命名
- ✅ 重命名会更新所有引用
- ✅ 关键字和内置函数无法重命名
- ✅ 显示错误提示

### 格式化功能
- ✅ 按 Shift+Alt+F 可以格式化代码
- ✅ 缩进和空格符合规范
- ✅ 支持选区格式化
- ✅ ShaderLab 结构保持清晰

---

## 🎉 总结

Phase 9.2 成功实现了代码重构的两个核心功能：
1. **重命名符号** - 提供了智能的符号重命名功能，支持作用域分析
2. **代码格式化** - 提供了基础的代码格式化功能，支持 ShaderLab 和 HLSL

这些功能显著提升了代码编辑体验，为后续的高级功能奠定了基础。

**下一步**: 可以考虑实施 Phase 9.3（性能优化工具）或 Phase 9.4（调试支持）
