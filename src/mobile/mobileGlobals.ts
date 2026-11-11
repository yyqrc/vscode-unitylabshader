import { l10n } from 'vscode';
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

export const complexityLevelLabels: Record<ComplexityLevel, string> = {
    [ComplexityLevel.Low]: l10n.t('Low'),
    [ComplexityLevel.Medium]: l10n.t('Medium'),
    [ComplexityLevel.High]: l10n.t('High'),
    [ComplexityLevel.VeryHigh]: l10n.t('Very High')
};

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
        message: l10n.t('imageLoad is not supported on ES3.0; ES3.1+ is required'),
        alternative: l10n.t('Use texelFetch instead, or target ES3.1+'),
        severity: 'warning'
    },
    {
        name: 'imageStore',
        pattern: /\bimageStore\s*\(/g,
        support: { es30: false, es31: true, metal: true, vulkan: true },
        message: l10n.t('imageStore is not supported on ES3.0; ES3.1+ is required'),
        alternative: l10n.t('Use RenderTexture instead, or target ES3.1+'),
        severity: 'warning'
    },
    {
        name: 'imageAtomicAdd',
        pattern: /\bimageAtomic\w+\s*\(/g,
        support: { es30: false, es31: true, metal: true, vulkan: true },
        message: l10n.t('Image atomic operations are not supported on ES3.0; ES3.1+ is required'),
        severity: 'warning'
    },
    
    // Geometry Shader（移动端普遍不支持或性能差）
    {
        name: 'geometry shader',
        pattern: /\[maxvertexcount\s*\(\d+\)\]/g,
        support: { es30: false, es31: false, metal: false, vulkan: true },
        message: l10n.t('Geometry shaders are slow or unsupported on mobile platforms'),
        alternative: l10n.t('Use vertex shader instancing or GPU skinning instead'),
        severity: 'warning'
    },
    
    // Tessellation（移动端支持有限）
    {
        name: 'tessellation',
        pattern: /\bdomain\s*=\s*["']?(tri|quad|isoline)["']?/g,
        support: { es30: false, es31: false, metal: true, vulkan: true },
        message: l10n.t('Tessellation is not supported on most mobile devices'),
        alternative: l10n.t('Use an LOD system or pre-tessellated meshes instead'),
        severity: 'warning'
    },
    
    // 双精度浮点（移动端不支持）
    {
        name: 'double precision',
        pattern: /\bdouble\b/g,
        support: { es30: false, es31: false, metal: false, vulkan: false },
        message: l10n.t('Double-precision floating point (double) is not supported on mobile platforms'),
        alternative: l10n.t('Use float instead, or emulate double precision when necessary'),
        severity: 'error'
    },
    
    // 64位整数（移动端支持有限）
    {
        name: '64-bit integer',
        pattern: /\b(int64|uint64|long)\b/g,
        support: { es30: false, es31: false, metal: true, vulkan: true },
        message: l10n.t('64-bit integers are not supported on most mobile devices'),
        alternative: l10n.t('Emulate using two 32-bit integers'),
        severity: 'warning'
    },
    
    // 3D 纹理写入（ES3.0 不支持）
    {
        name: 'texture3D write',
        pattern: /\bRWTexture3D\b/g,
        support: { es30: false, es31: true, metal: true, vulkan: true },
        message: l10n.t('3D texture writes are not supported on ES3.0'),
        alternative: l10n.t('Use layered 2D textures instead'),
        severity: 'warning'
    },
    
    // 多重渲染目标数量限制
    {
        name: 'MRT > 4',
        pattern: /SV_Target([5-9]|[1-9]\d+)/g,
        support: { es30: false, es31: false, metal: true, vulkan: true },
        message: l10n.t('Mobile platforms typically support only four render targets (SV_Target0-3)'),
        alternative: l10n.t('Reduce the MRT count or use multiple rendering passes'),
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
        message: l10n.t('Consider half precision for colors to improve mobile performance'),
        replacement: 'half$1 $2'
    },
    {
        // UV 坐标建议使用 half（如果精度足够）
        pattern: /\bfloat2\s+(\w*[uU][vV]\w*)\b/g,
        message: l10n.t('UV coordinates can use half2 precision in most cases'),
        replacement: 'half2 $1'
    },
    {
        // 法线建议使用 half
        pattern: /\bfloat([34])?\s+(\w*[nN]ormal\w*)\b/g,
        message: l10n.t('Consider half precision for normal vectors'),
        replacement: 'half$1 $2'
    },
    {
        // 临时计算变量建议使用 half
        pattern: /\bfloat\s+(temp\w*|tmp\w*)\b/gi,
        message: l10n.t('Consider half precision for temporary variables to reduce register pressure'),
        replacement: 'half $1'
    },
    {
        // 光照计算中的中间值
        pattern: /\bfloat\s+(\w*[dD]iffuse\w*|\w*[sS]pecular\w*|\w*[lL]ight\w*)\b/g,
        message: l10n.t('Consider half precision for intermediate lighting values'),
    },
    {
        // alpha 值
        pattern: /\bfloat\s+(\w*[aA]lpha\w*)\b/g,
        message: l10n.t('Consider half precision for alpha values'),
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
        message: l10n.t('Check whether mipmaps are enabled; missing mipmaps may waste bandwidth'),
        severity: 'info'
    },
    {
        // 依赖纹理读取检测（在 fragment shader 中计算 UV）
        pattern: /tex2D\s*\([^,]+,\s*[^)]*[\+\-\*\/][^)]*\)/g,
        message: l10n.t('Dependent texture read detected (computed UVs); this may reduce mobile performance'),
        severity: 'warning'
    },
    {
        // 过多的纹理采样
        pattern: /\b(tex2D|texture|sample)\s*\(/g,
        message: l10n.t('Texture sampling operation'),  // 用于统计
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
        message: l10n.t('discard/clip is expensive on mobile and can prevent Early-Z optimization'),
        alternative: l10n.t('Use alpha blending or alpha testing with a threshold')
    },
    {
        name: 'ddx/ddy',
        pattern: /\b(ddx|ddy|fwidth)\s*\(/g,
        message: l10n.t('Derivative functions are expensive on mobile'),
        alternative: l10n.t('Precompute gradients or use an approximation')
    },
    {
        name: 'noise',
        pattern: /\bnoise\s*\(/g,
        message: l10n.t('noise is often unsupported or slow on mobile'),
        alternative: l10n.t('Use a precomputed noise texture')
    },
    {
        name: 'GetDimensions',
        pattern: /\bGetDimensions\s*\(/g,
        message: l10n.t('GetDimensions is expensive on some mobile devices'),
        alternative: l10n.t('Pass texture dimensions through a uniform')
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
    l10n.t('💡 Prefer half precision over float to improve mobile performance'),
    l10n.t('💡 Avoid branches in fragment shaders'),
    l10n.t('💡 Reduce texture samples and consider packing texture channels'),
    l10n.t('💡 Avoid discard/clip, which can prevent Early-Z optimization'),
    l10n.t('💡 Precompute expensive math using lookup table (LUT) textures'),
    l10n.t('💡 Use SV_Target0-3; mobile platforms typically support only four MRTs'),
    l10n.t('💡 Avoid dependent texture reads and precompute UV offsets'),
    l10n.t('💡 Use texture compression (ASTC, ETC2) to reduce bandwidth'),
];
