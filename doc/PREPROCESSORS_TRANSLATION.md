# Preprocessors 中英双文翻译更新

## 📝 更新说明

将 `hlslGlobals.ts` 文件中的 `preprocessors` 对象的所有描述翻译成中英双文格式，与 `intrinsicfunctions` 保持一致的风格。

## 🔄 更新内容

### 格式说明

**更新前**（仅英文）：
```typescript
DEFINE: {
    description: 'Preprocessor directive that defines a constant or a macro.',
},
```

**更新后**（中英双文）：
```typescript
DEFINE: {
    description: 'Preprocessor directive that defines a constant or a macro.\n\n预处理器指令，用于定义常量或宏。',
},
```

### 翻译列表

| 指令 | 英文描述 | 中文翻译 |
|------|---------|---------|
| **DEFINE** | Preprocessor directive that defines a constant or a macro. | 预处理器指令，用于定义常量或宏。 |
| **ERROR** | Preprocessor directive that produces compiler-time error messages. | 预处理器指令，用于生成编译时错误消息。 |
| **IF** | Preprocessor directives that control compilation of portions of a source file. | 预处理器指令，用于控制源文件部分内容的编译。 |
| **ELIF** | Preprocessor directives that control compilation of portions of a source file. | 预处理器指令，用于控制源文件部分内容的编译。 |
| **ELSE** | Preprocessor directives that control compilation of portions of a source file. | 预处理器指令，用于控制源文件部分内容的编译。 |
| **ENDIF** | Preprocessor directives that control compilation of portions of a source file. | 预处理器指令，用于控制源文件部分内容的编译。 |
| **IFDEF** | Preprocessor directives that determine whether a specific preprocessor constant or macro is defined. | 预处理器指令，用于判断特定的预处理器常量或宏是否已定义。 |
| **IFNDEF** | Preprocessor directives that determine whether a specific preprocessor constant or macro is defined. | 预处理器指令，用于判断特定的预处理器常量或宏是否未定义。 |
| **INCLUDE** | Preprocessor directive that inserts the contents of the specified file into the source program at the point where the directive appears. | 预处理器指令，用于在指令出现的位置将指定文件的内容插入到源程序中。 |
| **LINE** | Preprocessor directive that sets the compiler's internally-stored line number and filename to the specified values. | 预处理器指令，用于将编译器内部存储的行号和文件名设置为指定值。 |
| **PRAGMA** | Preprocessor directive that provides machine-specific or operating system-specific features while retaining overall compatibility with the C and C++ languages. | 预处理器指令，用于提供特定于机器或操作系统的功能，同时保持与 C 和 C++ 语言的整体兼容性。 |
| **UNDEF** | Preprocessor directive that removes the current definition of a constant or macro that was previously defined using the #define directive. | 预处理器指令，用于移除之前使用 #define 指令定义的常量或宏的当前定义。 |

## 📊 更新统计

- **更新文件**: `src/hlsl/hlslGlobals.ts`
- **更新项数**: 12 个预处理器指令
- **格式**: 中英双文（English\n\n中文）
- **文件大小变化**: 88.4 KB → 89.4 KB (+1 KB)

## ✅ 验证结果

- ✅ 编译通过（`npm run compile`）
- ✅ 格式与 `intrinsicfunctions` 一致
- ✅ 所有描述都包含中英双文
- ✅ 使用 `\n\n` 分隔英文和中文

## 🎯 用户体验提升

现在当用户在编辑器中悬停在预处理器指令上时，将看到：

```
#define

Preprocessor directive that defines a constant or a macro.

预处理器指令，用于定义常量或宏。
```

这样中英文用户都能更好地理解预处理器指令的含义。

## 📝 相关文件

- `src/hlsl/hlslGlobals.ts` - 主要修改文件
- `PREPROCESSORS_TRANSLATION.md` - 本文档

---

**更新日期**: 2026-01-11  
**Commit ID**: 10da02009673f3f12288c268279fbb6ded2ff95e
