/**
 * 移动平台优化 - 全局定义
 * 包含移动端 Shader 开发的特性检测、优化建议等
 */

/**
 * 平台类型枚举
 */
export enum MobilePlatform {
    ES30 = 'ES3.0',      // OpenGL ES 3.0
    ES31 = 'ES3.1',      // OpenGL ES 3.1
    Metal = 'Metal',     // Apple Metal
    Vulkan = 'Vulkan',   // Vulkan
}

/**
 * 平台特性支持情况
 */
export interface PlatformFeatureSupport {
    es30: boolean;
    es31: boolean;
    metal: boolean;
    vulkan: boolean;
}

/**
 * 不支持的特性定义
 */
export interface UnsupportedFeature {
    name: string;                      // 特性名称
    pattern: RegExp;                   // 匹配模式
    support: PlatformFeatureSupport;   // 平台支持情况
    message: string;                   // 警告消息
    alternative?: string;              // 替代方案
    severity: 'error' | 'warning' | 'info';  // 严重程度
}

/**
 * half 精度优化建议
 */
export interface PrecisionSuggestion {
    pattern: RegExp;           // 匹配模式
    message: string;           // 建议消息
    replacement?: string;      // 替换建议
}

/**
 * 纹理优化建议
 */
export interface TextureOptimization {
    pattern: RegExp;           // 匹配模式
    message: string;           // 优化建议
    severity: 'warning' | 'info';
}

/**
 * 复杂度评分等级
 */
export enum ComplexityLevel {
    Low = 'low',
    Medium = 'medium',
    High = 'high',
    VeryHigh = 'veryHigh'
}

/**
 * 复杂度评分结果
 */
export interface ComplexityScore {
    level: ComplexityLevel;
    score: number;
    details: {
        textureOps: number;      // 纹理操作数
        mathOps: number;         // 数学运算数
        branches: number;        // 分支数
        loops: number;           // 循环数
        registers: number;       // 估算寄存器数
    };
    suggestions: string[];
}

// ============================================================================
// 不支持的特性列表（仅针对 ES3.0/3.1/Metal/Vulkan）
// ============================================================================

export const unsupportedFeatures: UnsupportedFeature[] = [
    // Compute Shader 相关（ES3.0 不支持，ES3.1+ 支持）
    {
        name: 'imageLoad',
        pattern: /\bimageLoad\s*\(/g,
        support: { es30: false, es31: true, metal: true, vulkan: true },
        message: 'imageLoad 在 ES3.0 上不支持，需要 ES3.1+',
        alternative: '使用 texelFetch 替代，或限制目标平台为 ES3.1+',
        severity: 'warning'
    },
    {
        name: 'imageStore',
        pattern: /\bimageStore\s*\(/g,
        support: { es30: false, es31: true, metal: true, vulkan: true },
        message: 'imageStore 在 ES3.0 上不支持，需要 ES3.1+',
        alternative: '使用 RenderTexture 替代，或限制目标平台为 ES3.1+',
        severity: 'warning'
    },
    {
        name: 'imageAtomicAdd',
        pattern: /\bimageAtomic\w+\s*\(/g,
        support: { es30: false, es31: true, metal: true, vulkan: true },
        message: '图像原子操作在 ES3.0 上不支持，需要 ES3.1+',
        severity: 'warning'
    },
    
    // Geometry Shader（移动端普遍不支持或性能差）
    {
        name: 'geometry shader',
        pattern: /\[maxvertexcount\s*\(\d+\)\]/g,
        support: { es30: false, es31: false, metal: false, vulkan: true },
        message: 'Geometry Shader 在移动平台上性能很差或不支持',
        alternative: '使用顶点着色器实例化或 GPU Skinning 替代',
        severity: 'warning'
    },
    
    // Tessellation（移动端支持有限）
    {
        name: 'tessellation',
        pattern: /\bdomain\s*=\s*["']?(tri|quad|isoline)["']?/g,
        support: { es30: false, es31: false, metal: true, vulkan: true },
        message: 'Tessellation 在大多数移动设备上不支持',
        alternative: '使用 LOD 系统或预分割网格替代',
        severity: 'warning'
    },
    
    // 双精度浮点（移动端不支持）
    {
        name: 'double precision',
        pattern: /\bdouble\b/g,
        support: { es30: false, es31: false, metal: false, vulkan: false },
        message: '双精度浮点 (double) 在移动平台上不支持',
        alternative: '使用 float 替代，必要时使用 emulated double',
        severity: 'error'
    },
    
    // 64位整数（移动端支持有限）
    {
        name: '64-bit integer',
        pattern: /\b(int64|uint64|long)\b/g,
        support: { es30: false, es31: false, metal: true, vulkan: true },
        message: '64位整数在大多数移动设备上不支持',
        alternative: '使用两个 32 位整数模拟',
        severity: 'warning'
    },
    
    // 3D 纹理写入（ES3.0 不支持）
    {
        name: 'texture3D write',
        pattern: /\bRWTexture3D\b/g,
        support: { es30: false, es31: true, metal: true, vulkan: true },
        message: '3D 纹理写入在 ES3.0 上不支持',
        alternative: '使用多层 2D 纹理替代',
        severity: 'warning'
    },
    
    // 多重渲染目标数量限制
    {
        name: 'MRT > 4',
        pattern: /SV_Target([5-9]|[1-9]\d+)/g,
        support: { es30: false, es31: false, metal: true, vulkan: true },
        message: '移动平台通常只支持 4 个渲染目标 (SV_Target0-3)',
        alternative: '减少 MRT 数量或使用多 Pass 渲染',
        severity: 'warning'
    },
];

// ============================================================================
// half 精度优化建议
// ============================================================================

export const precisionSuggestions: PrecisionSuggestion[] = [
    {
        // 颜色值建议使用 half
        pattern: /\bfloat([234])?\s+(\w*[cC]olor\w*)\b/g,
        message: '颜色值建议使用 half 精度以提升移动端性能',
        replacement: 'half$1 $2'
    },
    {
        // UV 坐标建议使用 half（如果精度足够）
        pattern: /\bfloat2\s+(\w*[uU][vV]\w*)\b/g,
        message: 'UV 坐标在大多数情况下可以使用 half2 精度',
        replacement: 'half2 $1'
    },
    {
        // 法线建议使用 half
        pattern: /\bfloat([34])?\s+(\w*[nN]ormal\w*)\b/g,
        message: '法线向量建议使用 half 精度',
        replacement: 'half$1 $2'
    },
    {
        // 临时计算变量建议使用 half
        pattern: /\bfloat\s+(temp\w*|tmp\w*)\b/gi,
        message: '临时变量建议使用 half 精度以减少寄存器压力',
        replacement: 'half $1'
    },
    {
        // 光照计算中的中间值
        pattern: /\bfloat\s+(\w*[dD]iffuse\w*|\w*[sS]pecular\w*|\w*[lL]ight\w*)\b/g,
        message: '光照计算的中间值建议使用 half 精度',
    },
    {
        // alpha 值
        pattern: /\bfloat\s+(\w*[aA]lpha\w*)\b/g,
        message: 'Alpha 值建议使用 half 精度',
        replacement: 'half $1'
    },
];

// ============================================================================
// 纹理优化建议
// ============================================================================

export const textureOptimizations: TextureOptimization[] = [
    {
        // 没有使用 mipmap 的纹理采样（可能导致性能问题）
        pattern: /tex2D(Lod|Grad)?\s*\([^,]+,\s*[^,]+\)/g,
        message: '建议检查纹理是否启用了 Mipmap，未启用 Mipmap 可能导致带宽浪费',
        severity: 'info'
    },
    {
        // 依赖纹理读取检测（在 fragment shader 中计算 UV）
        pattern: /tex2D\s*\([^,]+,\s*[^)]*[\+\-\*\/][^)]*\)/g,
        message: '检测到依赖纹理读取（计算后的 UV），这在移动端可能造成性能损失',
        severity: 'warning'
    },
    {
        // 过多的纹理采样
        pattern: /\b(tex2D|texture|sample)\s*\(/g,
        message: '纹理采样操作',  // 用于统计
        severity: 'info'
    },
];

// ============================================================================
// 复杂操作检测（用于复杂度计算）
// ============================================================================

export const complexOperations = {
    // 高开销数学函数
    expensiveMath: [
        /\bpow\s*\(/g,
        /\bexp\s*\(/g,
        /\bexp2\s*\(/g,
        /\blog\s*\(/g,
        /\blog2\s*\(/g,
        /\bsqrt\s*\(/g,
        /\brsqrt\s*\(/g,
        /\bsin\s*\(/g,
        /\bcos\s*\(/g,
        /\btan\s*\(/g,
        /\basin\s*\(/g,
        /\bacos\s*\(/g,
        /\batan\s*\(/g,
        /\batan2\s*\(/g,
    ],
    
    // 纹理操作
    textureOps: [
        /\btex2D\s*\(/g,
        /\btex2Dproj\s*\(/g,
        /\btex2Dlod\s*\(/g,
        /\btex2Dgrad\s*\(/g,
        /\btex2Dbias\s*\(/g,
        /\btexCUBE\s*\(/g,
        /\btexCUBElod\s*\(/g,
        /\btex3D\s*\(/g,
        /\bSAMPLE_TEXTURE2D\s*\(/g,
        /\bSAMPLE_TEXTURECUBE\s*\(/g,
        /\bsample\s*\(/g,
        /\bSampleLevel\s*\(/g,
        /\bSampleGrad\s*\(/g,
    ],
    
    // 分支语句
    branches: [
        /\bif\s*\(/g,
        /\belse\b/g,
        /\b\?\s*[^:]+\s*:/g,  // 三元运算符
    ],
    
    // 循环语句
    loops: [
        /\bfor\s*\(/g,
        /\bwhile\s*\(/g,
        /\bdo\s*{/g,
    ],
    
    // discard 操作（移动端开销大）
    discard: [
        /\bdiscard\b/g,
        /\bclip\s*\(/g,
    ],
};

// ============================================================================
// 移动端不推荐的函数
// ============================================================================

export const discouragedFunctions: Array<{
    name: string;
    pattern: RegExp;
    message: string;
    alternative?: string;
}> = [
    {
        name: 'discard/clip',
        pattern: /\b(discard|clip)\b/g,
        message: 'discard/clip 在移动端开销较大，会破坏 Early-Z 优化',
        alternative: '使用 alpha blend 或 alpha test with threshold'
    },
    {
        name: 'ddx/ddy',
        pattern: /\b(ddx|ddy|fwidth)\s*\(/g,
        message: '偏导数函数在移动端开销较大',
        alternative: '预计算梯度值或使用近似方法'
    },
    {
        name: 'noise',
        pattern: /\bnoise\s*\(/g,
        message: 'noise 函数在移动端通常不支持或性能差',
        alternative: '使用预计算的噪声纹理'
    },
    {
        name: 'GetDimensions',
        pattern: /\bGetDimensions\s*\(/g,
        message: 'GetDimensions 在某些移动设备上开销较大',
        alternative: '通过 uniform 传递纹理尺寸'
    },
];

// ============================================================================
// 复杂度阈值配置
// ============================================================================

export const complexityThresholds = {
    // 纹理操作数阈值
    textureOps: {
        low: 4,
        medium: 8,
        high: 16,
    },
    // 数学运算数阈值
    mathOps: {
        low: 20,
        medium: 50,
        high: 100,
    },
    // 分支数阈值
    branches: {
        low: 3,
        medium: 6,
        high: 10,
    },
    // 循环数阈值
    loops: {
        low: 1,
        medium: 2,
        high: 4,
    },
    // 综合评分阈值
    overall: {
        low: 30,
        medium: 60,
        high: 100,
    },
};

// ============================================================================
// 移动端优化最佳实践提示
// ============================================================================

export const mobileOptimizationTips: string[] = [
    '💡 尽量使用 half 精度代替 float，可显著提升移动端性能',
    '💡 避免在 Fragment Shader 中使用分支语句',
    '💡 减少纹理采样次数，考虑合并纹理通道',
    '💡 避免使用 discard/clip，它会破坏 Early-Z 优化',
    '💡 预计算复杂数学运算，使用查找表（LUT）纹理',
    '💡 使用 SV_Target0-3，移动端通常只支持 4 个 MRT',
    '💡 避免依赖纹理读取，预计算 UV 偏移',
    '💡 使用纹理压缩格式（ASTC、ETC2）减少带宽',
];
