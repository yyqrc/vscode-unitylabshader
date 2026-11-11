import { l10n } from 'vscode';
import { CompletionItem, CompletionItemKind, MarkdownString } from 'vscode';

/**
 * Unreal 内置变量定义
 */
export interface UnrealVariable {
    name: string;
    type: string;
    description: string;
}

/**
 * Unreal 内置函数定义
 */
export interface UnrealFunction {
    name: string;
    returnType: string;
    parameters: string[];
    description: string;
    example?: string;
}

/**
 * Unreal 内置宏定义
 */
export interface UnrealMacro {
    name: string;
    description: string;
    example?: string;
}

// ============================================================================
// Unreal 材质函数
// ============================================================================

export const unrealMaterialFunctions: UnrealFunction[] = [
    // 纹理采样函数
    {
        name: 'Texture2DSample',
        returnType: 'float4',
        parameters: ['Texture2D Tex', 'SamplerState Sampler', 'float2 UV'],
        description: l10n.t('Sample a 2D texture'),
        example: 'float4 color = Texture2DSample(MyTexture, MyTextureSampler, UV);'
    },
    {
        name: 'Texture2DSampleLevel',
        returnType: 'float4',
        parameters: ['Texture2D Tex', 'SamplerState Sampler', 'float2 UV', 'float MipLevel'],
        description: l10n.t('Sample a 2D texture at a specific mip level'),
        example: 'float4 color = Texture2DSampleLevel(MyTexture, MyTextureSampler, UV, 0);'
    },
    {
        name: 'Texture2DSampleBias',
        returnType: 'float4',
        parameters: ['Texture2D Tex', 'SamplerState Sampler', 'float2 UV', 'float MipBias'],
        description: l10n.t('Sample a 2D texture with mip bias'),
        example: 'float4 color = Texture2DSampleBias(MyTexture, MyTextureSampler, UV, -1.0);'
    },
    {
        name: 'Texture2DSampleGrad',
        returnType: 'float4',
        parameters: ['Texture2D Tex', 'SamplerState Sampler', 'float2 UV', 'float2 DDX', 'float2 DDY'],
        description: l10n.t('Sample a 2D texture with explicit gradients'),
        example: 'float4 color = Texture2DSampleGrad(MyTexture, MyTextureSampler, UV, ddx(UV), ddy(UV));'
    },
    {
        name: 'TextureCubeSample',
        returnType: 'float4',
        parameters: ['TextureCube Tex', 'SamplerState Sampler', 'float3 Direction'],
        description: l10n.t('Sample a cube texture'),
        example: 'float4 color = TextureCubeSample(MyCubeMap, MyCubeMapSampler, ReflectionVector);'
    },
    {
        name: 'TextureCubeSampleLevel',
        returnType: 'float4',
        parameters: ['TextureCube Tex', 'SamplerState Sampler', 'float3 Direction', 'float MipLevel'],
        description: l10n.t('Sample a cube texture at a specific mip level'),
        example: 'float4 color = TextureCubeSampleLevel(MyCubeMap, MyCubeMapSampler, ReflectionVector, 0);'
    },

    // 数学运算函数
    {
        name: 'Add',
        returnType: 'float',
        parameters: ['float A', 'float B'],
        description: l10n.t('Add two values'),
        example: 'float result = Add(A, B);'
    },
    {
        name: 'Subtract',
        returnType: 'float',
        parameters: ['float A', 'float B'],
        description: l10n.t('Subtract B from A'),
        example: 'float result = Subtract(A, B);'
    },
    {
        name: 'Multiply',
        returnType: 'float',
        parameters: ['float A', 'float B'],
        description: l10n.t('Multiply two values'),
        example: 'float result = Multiply(A, B);'
    },
    {
        name: 'Divide',
        returnType: 'float',
        parameters: ['float A', 'float B'],
        description: l10n.t('Divide A by B'),
        example: 'float result = Divide(A, B);'
    },
    {
        name: 'Power',
        returnType: 'float',
        parameters: ['float Base', 'float Exponent'],
        description: l10n.t('Raise Base to the power of Exponent'),
        example: 'float result = Power(Base, 2.0);'
    },
    {
        name: 'SquareRoot',
        returnType: 'float',
        parameters: ['float Value'],
        description: l10n.t('Calculate square root'),
        example: 'float result = SquareRoot(Value);'
    },

    // 插值函数
    {
        name: 'Lerp',
        returnType: 'float',
        parameters: ['float A', 'float B', 'float Alpha'],
        description: l10n.t('Linear interpolation between A and B'),
        example: 'float result = Lerp(A, B, 0.5);'
    },
    {
        name: 'Clamp',
        returnType: 'float',
        parameters: ['float Value', 'float Min', 'float Max'],
        description: l10n.t('Clamp value between Min and Max'),
        example: 'float result = Clamp(Value, 0.0, 1.0);'
    },
    {
        name: 'Saturate',
        returnType: 'float',
        parameters: ['float Value'],
        description: l10n.t('Clamp value between 0 and 1'),
        example: 'float result = Saturate(Value);'
    },

    // 向量运算函数
    {
        name: 'DotProduct',
        returnType: 'float',
        parameters: ['float3 A', 'float3 B'],
        description: l10n.t('Calculate dot product of two vectors'),
        example: 'float result = DotProduct(A, B);'
    },
    {
        name: 'CrossProduct',
        returnType: 'float3',
        parameters: ['float3 A', 'float3 B'],
        description: l10n.t('Calculate cross product of two vectors'),
        example: 'float3 result = CrossProduct(A, B);'
    },
    {
        name: 'Normalize',
        returnType: 'float3',
        parameters: ['float3 Vector'],
        description: l10n.t('Normalize a vector'),
        example: 'float3 result = Normalize(Vector);'
    },
    {
        name: 'Length',
        returnType: 'float',
        parameters: ['float3 Vector'],
        description: l10n.t('Calculate length of a vector'),
        example: 'float result = Length(Vector);'
    },
    {
        name: 'Distance',
        returnType: 'float',
        parameters: ['float3 A', 'float3 B'],
        description: l10n.t('Calculate distance between two points'),
        example: 'float result = Distance(A, B);'
    },

    // 坐标转换函数
    {
        name: 'TransformPosition',
        returnType: 'float3',
        parameters: ['float4x4 Matrix', 'float3 Position'],
        description: l10n.t('Transform position by matrix'),
        example: 'float3 worldPos = TransformPosition(LocalToWorld, localPos);'
    },
    {
        name: 'TransformVector',
        returnType: 'float3',
        parameters: ['float4x4 Matrix', 'float3 Vector'],
        description: l10n.t('Transform vector by matrix'),
        example: 'float3 worldNormal = TransformVector(LocalToWorld, localNormal);'
    },

    // 光照函数
    {
        name: 'GetMaterialEmissive',
        returnType: 'float3',
        parameters: [],
        description: l10n.t('Get material emissive color'),
        example: 'float3 emissive = GetMaterialEmissive();'
    },
    {
        name: 'GetMaterialBaseColor',
        returnType: 'float3',
        parameters: [],
        description: l10n.t('Get material base color'),
        example: 'float3 baseColor = GetMaterialBaseColor();'
    },
    {
        name: 'GetMaterialMetallic',
        returnType: 'float',
        parameters: [],
        description: l10n.t('Get material metallic value'),
        example: 'float metallic = GetMaterialMetallic();'
    },
    {
        name: 'GetMaterialSpecular',
        returnType: 'float',
        parameters: [],
        description: l10n.t('Get material specular value'),
        example: 'float specular = GetMaterialSpecular();'
    },
    {
        name: 'GetMaterialRoughness',
        returnType: 'float',
        parameters: [],
        description: l10n.t('Get material roughness value'),
        example: 'float roughness = GetMaterialRoughness();'
    },

    // 时间函数
    {
        name: 'Time',
        returnType: 'float',
        parameters: [],
        description: l10n.t('Get current time in seconds'),
        example: 'float time = Time();'
    },
    {
        name: 'Sine',
        returnType: 'float',
        parameters: ['float Value'],
        description: l10n.t('Calculate sine'),
        example: 'float result = Sine(Value);'
    },
    {
        name: 'Cosine',
        returnType: 'float',
        parameters: ['float Value'],
        description: l10n.t('Calculate cosine'),
        example: 'float result = Cosine(Value);'
    },

    // 噪声函数
    {
        name: 'Noise',
        returnType: 'float',
        parameters: ['float2 Position'],
        description: l10n.t('Generate noise'),
        example: 'float noise = Noise(Position);'
    },
    {
        name: 'VoronoiNoise',
        returnType: 'float',
        parameters: ['float2 Position', 'float Scale'],
        description: l10n.t('Generate Voronoi noise'),
        example: 'float noise = VoronoiNoise(Position, 5.0);'
    },

    // 颜色函数
    {
        name: 'Desaturation',
        returnType: 'float3',
        parameters: ['float3 Color', 'float Amount'],
        description: l10n.t('Desaturate color'),
        example: 'float3 result = Desaturation(Color, 0.5);'
    },
    {
        name: 'HSVToRGB',
        returnType: 'float3',
        parameters: ['float3 HSV'],
        description: l10n.t('Convert HSV to RGB'),
        example: 'float3 rgb = HSVToRGB(hsv);'
    },
    {
        name: 'RGBToHSV',
        returnType: 'float3',
        parameters: ['float3 RGB'],
        description: l10n.t('Convert RGB to HSV'),
        example: 'float3 hsv = RGBToHSV(rgb);'
    }
];

// ============================================================================
// Unreal 内置变量
// ============================================================================

export const unrealBuiltinVariables: UnrealVariable[] = [
    // View 相关变量
    {
        name: 'View.ViewToClip',
        type: 'float4x4',
        description: l10n.t('View to clip space transformation matrix'),
    },
    {
        name: 'View.ClipToView',
        type: 'float4x4',
        description: l10n.t('Clip to view space transformation matrix'),
    },
    {
        name: 'View.WorldToClip',
        type: 'float4x4',
        description: l10n.t('World to clip space transformation matrix'),
    },
    {
        name: 'View.ClipToWorld',
        type: 'float4x4',
        description: l10n.t('Clip to world space transformation matrix'),
    },
    {
        name: 'View.ViewOrigin',
        type: 'float3',
        description: l10n.t('Camera position in world space'),
    },
    {
        name: 'View.ViewForward',
        type: 'float3',
        description: l10n.t('Camera forward direction'),
    },
    {
        name: 'View.ViewUp',
        type: 'float3',
        description: l10n.t('Camera up direction'),
    },
    {
        name: 'View.ViewRight',
        type: 'float3',
        description: l10n.t('Camera right direction'),
    },
    {
        name: 'View.GameTime',
        type: 'float',
        description: l10n.t('Game time in seconds'),
    },
    {
        name: 'View.RealTime',
        type: 'float',
        description: l10n.t('Real time in seconds'),
    },
    {
        name: 'View.DeltaTime',
        type: 'float',
        description: l10n.t('Delta time since last frame'),
    },

    // Parameters 相关变量（材质参数）
    {
        name: 'Parameters.WorldPosition',
        type: 'float3',
        description: l10n.t('World space position'),
    },
    {
        name: 'Parameters.CameraVector',
        type: 'float3',
        description: l10n.t('Vector from pixel to camera'),
    },
    {
        name: 'Parameters.LightVector',
        type: 'float3',
        description: l10n.t('Light direction vector'),
    },
    {
        name: 'Parameters.TwoSidedSign',
        type: 'float',
        description: l10n.t('Sign indicating front or back face (1 or -1)'),
    },
    {
        name: 'Parameters.VertexColor',
        type: 'float4',
        description: l10n.t('Vertex color'),
    },

    // ResolvedView 相关变量
    {
        name: 'ResolvedView.WorldCameraOrigin',
        type: 'float3',
        description: l10n.t('Camera origin in world space'),
    },
    {
        name: 'ResolvedView.ViewForward',
        type: 'float3',
        description: l10n.t('View forward direction'),
    },
    {
        name: 'ResolvedView.DirectionalLightColor',
        type: 'float3',
        description: l10n.t('Directional light color'),
    },
    {
        name: 'ResolvedView.DirectionalLightDirection',
        type: 'float3',
        description: l10n.t('Directional light direction'),
    },

    // Primitive 相关变量
    {
        name: 'Primitive.LocalToWorld',
        type: 'float4x4',
        description: l10n.t('Local to world transformation matrix'),
    },
    {
        name: 'Primitive.WorldToLocal',
        type: 'float4x4',
        description: l10n.t('World to local transformation matrix'),
    },
    {
        name: 'Primitive.ObjectWorldPositionAndRadius',
        type: 'float4',
        description: l10n.t('Object world position (xyz) and bounding sphere radius (w)'),
    },
    {
        name: 'Primitive.ObjectBounds',
        type: 'float3',
        description: l10n.t('Object bounding box extents'),
    }
];

// ============================================================================
// Unreal 内置宏
// ============================================================================

export const unrealBuiltinMacros: UnrealMacro[] = [
    {
        name: 'MATERIAL_TWOSIDED',
        description: l10n.t('Defined if material is two-sided'),
    },
    {
        name: 'MATERIAL_TANGENTSPACENORMAL',
        description: l10n.t('Defined if material uses tangent space normals'),
    },
    {
        name: 'MATERIAL_FULLY_ROUGH',
        description: l10n.t('Defined if material is fully rough'),
    },
    {
        name: 'MATERIAL_NONMETAL',
        description: l10n.t('Defined if material is non-metallic'),
    },
    {
        name: 'ENGINE_MAJOR_VERSION',
        description: l10n.t('Unreal Engine major version number'),
    },
    {
        name: 'ENGINE_MINOR_VERSION',
        description: l10n.t('Unreal Engine minor version number'),
    },
    {
        name: 'COMPILER_HLSL',
        description: l10n.t('Defined when compiling with HLSL compiler'),
    },
    {
        name: 'COMPILER_GLSL',
        description: l10n.t('Defined when compiling with GLSL compiler'),
    }
];

// ============================================================================
// 创建补全项的辅助函数
// ============================================================================

export function createUnrealVariableCompletionItem(variable: UnrealVariable): CompletionItem {
    const item = new CompletionItem(variable.name, CompletionItemKind.Variable);
    item.detail = `(${variable.type}) ${variable.name}`;
    item.documentation = new MarkdownString(
        `**${variable.name}** \`${variable.type}\`\n\n` +
        `${variable.description}`
    );
    item.sortText = `1_${variable.name}`;
    return item;
}

export function createUnrealFunctionCompletionItem(func: UnrealFunction): CompletionItem {
    const item = new CompletionItem(func.name, CompletionItemKind.Function);
    
    const params = func.parameters.join(', ');
    item.detail = `(${func.returnType}) ${func.name}(${params})`;
    
    let doc = `**${func.name}**\n\n`;
    doc += l10n.t('**Return type**: `{0}`\n\n', func.returnType);
    doc += l10n.t('**Parameters**: `{0}`\n\n', params);
    doc += `${func.description}`;
    
    if (func.example) {
        doc += l10n.t('\n\n**Example**:\n```hlsl\n{0}\n```', func.example);
    }
    
    item.documentation = new MarkdownString(doc);
    item.sortText = `2_${func.name}`;
    return item;
}

export function createUnrealMacroCompletionItem(macro: UnrealMacro): CompletionItem {
    const item = new CompletionItem(macro.name, CompletionItemKind.Constant);
    item.detail = `(macro) ${macro.name}`;
    
    let doc = `**${macro.name}**\n\n`;
    doc += `${macro.description}`;
    
    if (macro.example) {
        doc += l10n.t('\n\n**Example**:\n```hlsl\n{0}\n```', macro.example);
    }
    
    item.documentation = new MarkdownString(doc);
    item.sortText = `3_${macro.name}`;
    return item;
}
