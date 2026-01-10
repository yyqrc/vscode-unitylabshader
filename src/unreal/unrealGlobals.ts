import { CompletionItem, CompletionItemKind, MarkdownString } from 'vscode';

/**
 * Unreal 内置变量定义
 */
export interface UnrealVariable {
    name: string;
    type: string;
    description: string;
    descriptionCN: string;
}

/**
 * Unreal 内置函数定义
 */
export interface UnrealFunction {
    name: string;
    returnType: string;
    parameters: string[];
    description: string;
    descriptionCN: string;
    example?: string;
}

/**
 * Unreal 内置宏定义
 */
export interface UnrealMacro {
    name: string;
    description: string;
    descriptionCN: string;
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
        description: 'Sample a 2D texture',
        descriptionCN: '采样 2D 纹理',
        example: 'float4 color = Texture2DSample(MyTexture, MyTextureSampler, UV);'
    },
    {
        name: 'Texture2DSampleLevel',
        returnType: 'float4',
        parameters: ['Texture2D Tex', 'SamplerState Sampler', 'float2 UV', 'float MipLevel'],
        description: 'Sample a 2D texture at a specific mip level',
        descriptionCN: '在指定 Mip 级别采样 2D 纹理',
        example: 'float4 color = Texture2DSampleLevel(MyTexture, MyTextureSampler, UV, 0);'
    },
    {
        name: 'Texture2DSampleBias',
        returnType: 'float4',
        parameters: ['Texture2D Tex', 'SamplerState Sampler', 'float2 UV', 'float MipBias'],
        description: 'Sample a 2D texture with mip bias',
        descriptionCN: '使用 Mip 偏移采样 2D 纹理',
        example: 'float4 color = Texture2DSampleBias(MyTexture, MyTextureSampler, UV, -1.0);'
    },
    {
        name: 'Texture2DSampleGrad',
        returnType: 'float4',
        parameters: ['Texture2D Tex', 'SamplerState Sampler', 'float2 UV', 'float2 DDX', 'float2 DDY'],
        description: 'Sample a 2D texture with explicit gradients',
        descriptionCN: '使用显式梯度采样 2D 纹理',
        example: 'float4 color = Texture2DSampleGrad(MyTexture, MyTextureSampler, UV, ddx(UV), ddy(UV));'
    },
    {
        name: 'TextureCubeSample',
        returnType: 'float4',
        parameters: ['TextureCube Tex', 'SamplerState Sampler', 'float3 Direction'],
        description: 'Sample a cube texture',
        descriptionCN: '采样立方体纹理',
        example: 'float4 color = TextureCubeSample(MyCubeMap, MyCubeMapSampler, ReflectionVector);'
    },
    {
        name: 'TextureCubeSampleLevel',
        returnType: 'float4',
        parameters: ['TextureCube Tex', 'SamplerState Sampler', 'float3 Direction', 'float MipLevel'],
        description: 'Sample a cube texture at a specific mip level',
        descriptionCN: '在指定 Mip 级别采样立方体纹理',
        example: 'float4 color = TextureCubeSampleLevel(MyCubeMap, MyCubeMapSampler, ReflectionVector, 0);'
    },

    // 数学运算函数
    {
        name: 'Add',
        returnType: 'float',
        parameters: ['float A', 'float B'],
        description: 'Add two values',
        descriptionCN: '两个值相加',
        example: 'float result = Add(A, B);'
    },
    {
        name: 'Subtract',
        returnType: 'float',
        parameters: ['float A', 'float B'],
        description: 'Subtract B from A',
        descriptionCN: 'A 减去 B',
        example: 'float result = Subtract(A, B);'
    },
    {
        name: 'Multiply',
        returnType: 'float',
        parameters: ['float A', 'float B'],
        description: 'Multiply two values',
        descriptionCN: '两个值相乘',
        example: 'float result = Multiply(A, B);'
    },
    {
        name: 'Divide',
        returnType: 'float',
        parameters: ['float A', 'float B'],
        description: 'Divide A by B',
        descriptionCN: 'A 除以 B',
        example: 'float result = Divide(A, B);'
    },
    {
        name: 'Power',
        returnType: 'float',
        parameters: ['float Base', 'float Exponent'],
        description: 'Raise Base to the power of Exponent',
        descriptionCN: 'Base 的 Exponent 次方',
        example: 'float result = Power(Base, 2.0);'
    },
    {
        name: 'SquareRoot',
        returnType: 'float',
        parameters: ['float Value'],
        description: 'Calculate square root',
        descriptionCN: '计算平方根',
        example: 'float result = SquareRoot(Value);'
    },

    // 插值函数
    {
        name: 'Lerp',
        returnType: 'float',
        parameters: ['float A', 'float B', 'float Alpha'],
        description: 'Linear interpolation between A and B',
        descriptionCN: 'A 和 B 之间的线性插值',
        example: 'float result = Lerp(A, B, 0.5);'
    },
    {
        name: 'Clamp',
        returnType: 'float',
        parameters: ['float Value', 'float Min', 'float Max'],
        description: 'Clamp value between Min and Max',
        descriptionCN: '将值限制在 Min 和 Max 之间',
        example: 'float result = Clamp(Value, 0.0, 1.0);'
    },
    {
        name: 'Saturate',
        returnType: 'float',
        parameters: ['float Value'],
        description: 'Clamp value between 0 and 1',
        descriptionCN: '将值限制在 0 和 1 之间',
        example: 'float result = Saturate(Value);'
    },

    // 向量运算函数
    {
        name: 'DotProduct',
        returnType: 'float',
        parameters: ['float3 A', 'float3 B'],
        description: 'Calculate dot product of two vectors',
        descriptionCN: '计算两个向量的点积',
        example: 'float result = DotProduct(A, B);'
    },
    {
        name: 'CrossProduct',
        returnType: 'float3',
        parameters: ['float3 A', 'float3 B'],
        description: 'Calculate cross product of two vectors',
        descriptionCN: '计算两个向量的叉积',
        example: 'float3 result = CrossProduct(A, B);'
    },
    {
        name: 'Normalize',
        returnType: 'float3',
        parameters: ['float3 Vector'],
        description: 'Normalize a vector',
        descriptionCN: '归一化向量',
        example: 'float3 result = Normalize(Vector);'
    },
    {
        name: 'Length',
        returnType: 'float',
        parameters: ['float3 Vector'],
        description: 'Calculate length of a vector',
        descriptionCN: '计算向量长度',
        example: 'float result = Length(Vector);'
    },
    {
        name: 'Distance',
        returnType: 'float',
        parameters: ['float3 A', 'float3 B'],
        description: 'Calculate distance between two points',
        descriptionCN: '计算两点之间的距离',
        example: 'float result = Distance(A, B);'
    },

    // 坐标转换函数
    {
        name: 'TransformPosition',
        returnType: 'float3',
        parameters: ['float4x4 Matrix', 'float3 Position'],
        description: 'Transform position by matrix',
        descriptionCN: '通过矩阵变换位置',
        example: 'float3 worldPos = TransformPosition(LocalToWorld, localPos);'
    },
    {
        name: 'TransformVector',
        returnType: 'float3',
        parameters: ['float4x4 Matrix', 'float3 Vector'],
        description: 'Transform vector by matrix',
        descriptionCN: '通过矩阵变换向量',
        example: 'float3 worldNormal = TransformVector(LocalToWorld, localNormal);'
    },

    // 光照函数
    {
        name: 'GetMaterialEmissive',
        returnType: 'float3',
        parameters: [],
        description: 'Get material emissive color',
        descriptionCN: '获取材质自发光颜色',
        example: 'float3 emissive = GetMaterialEmissive();'
    },
    {
        name: 'GetMaterialBaseColor',
        returnType: 'float3',
        parameters: [],
        description: 'Get material base color',
        descriptionCN: '获取材质基础颜色',
        example: 'float3 baseColor = GetMaterialBaseColor();'
    },
    {
        name: 'GetMaterialMetallic',
        returnType: 'float',
        parameters: [],
        description: 'Get material metallic value',
        descriptionCN: '获取材质金属度',
        example: 'float metallic = GetMaterialMetallic();'
    },
    {
        name: 'GetMaterialSpecular',
        returnType: 'float',
        parameters: [],
        description: 'Get material specular value',
        descriptionCN: '获取材质高光值',
        example: 'float specular = GetMaterialSpecular();'
    },
    {
        name: 'GetMaterialRoughness',
        returnType: 'float',
        parameters: [],
        description: 'Get material roughness value',
        descriptionCN: '获取材质粗糙度',
        example: 'float roughness = GetMaterialRoughness();'
    },

    // 时间函数
    {
        name: 'Time',
        returnType: 'float',
        parameters: [],
        description: 'Get current time in seconds',
        descriptionCN: '获取当前时间（秒）',
        example: 'float time = Time();'
    },
    {
        name: 'Sine',
        returnType: 'float',
        parameters: ['float Value'],
        description: 'Calculate sine',
        descriptionCN: '计算正弦值',
        example: 'float result = Sine(Value);'
    },
    {
        name: 'Cosine',
        returnType: 'float',
        parameters: ['float Value'],
        description: 'Calculate cosine',
        descriptionCN: '计算余弦值',
        example: 'float result = Cosine(Value);'
    },

    // 噪声函数
    {
        name: 'Noise',
        returnType: 'float',
        parameters: ['float2 Position'],
        description: 'Generate noise',
        descriptionCN: '生成噪声',
        example: 'float noise = Noise(Position);'
    },
    {
        name: 'VoronoiNoise',
        returnType: 'float',
        parameters: ['float2 Position', 'float Scale'],
        description: 'Generate Voronoi noise',
        descriptionCN: '生成 Voronoi 噪声',
        example: 'float noise = VoronoiNoise(Position, 5.0);'
    },

    // 颜色函数
    {
        name: 'Desaturation',
        returnType: 'float3',
        parameters: ['float3 Color', 'float Amount'],
        description: 'Desaturate color',
        descriptionCN: '降低颜色饱和度',
        example: 'float3 result = Desaturation(Color, 0.5);'
    },
    {
        name: 'HSVToRGB',
        returnType: 'float3',
        parameters: ['float3 HSV'],
        description: 'Convert HSV to RGB',
        descriptionCN: '将 HSV 转换为 RGB',
        example: 'float3 rgb = HSVToRGB(hsv);'
    },
    {
        name: 'RGBToHSV',
        returnType: 'float3',
        parameters: ['float3 RGB'],
        description: 'Convert RGB to HSV',
        descriptionCN: '将 RGB 转换为 HSV',
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
        description: 'View to clip space transformation matrix',
        descriptionCN: '视图空间到裁剪空间的变换矩阵'
    },
    {
        name: 'View.ClipToView',
        type: 'float4x4',
        description: 'Clip to view space transformation matrix',
        descriptionCN: '裁剪空间到视图空间的变换矩阵'
    },
    {
        name: 'View.WorldToClip',
        type: 'float4x4',
        description: 'World to clip space transformation matrix',
        descriptionCN: '世界空间到裁剪空间的变换矩阵'
    },
    {
        name: 'View.ClipToWorld',
        type: 'float4x4',
        description: 'Clip to world space transformation matrix',
        descriptionCN: '裁剪空间到世界空间的变换矩阵'
    },
    {
        name: 'View.ViewOrigin',
        type: 'float3',
        description: 'Camera position in world space',
        descriptionCN: '相机在世界空间中的位置'
    },
    {
        name: 'View.ViewForward',
        type: 'float3',
        description: 'Camera forward direction',
        descriptionCN: '相机前向方向'
    },
    {
        name: 'View.ViewUp',
        type: 'float3',
        description: 'Camera up direction',
        descriptionCN: '相机上方向'
    },
    {
        name: 'View.ViewRight',
        type: 'float3',
        description: 'Camera right direction',
        descriptionCN: '相机右方向'
    },
    {
        name: 'View.GameTime',
        type: 'float',
        description: 'Game time in seconds',
        descriptionCN: '游戏时间（秒）'
    },
    {
        name: 'View.RealTime',
        type: 'float',
        description: 'Real time in seconds',
        descriptionCN: '真实时间（秒）'
    },
    {
        name: 'View.DeltaTime',
        type: 'float',
        description: 'Delta time since last frame',
        descriptionCN: '距离上一帧的时间差'
    },

    // Parameters 相关变量（材质参数）
    {
        name: 'Parameters.WorldPosition',
        type: 'float3',
        description: 'World space position',
        descriptionCN: '世界空间位置'
    },
    {
        name: 'Parameters.CameraVector',
        type: 'float3',
        description: 'Vector from pixel to camera',
        descriptionCN: '从像素到相机的向量'
    },
    {
        name: 'Parameters.LightVector',
        type: 'float3',
        description: 'Light direction vector',
        descriptionCN: '光照方向向量'
    },
    {
        name: 'Parameters.TwoSidedSign',
        type: 'float',
        description: 'Sign indicating front or back face (1 or -1)',
        descriptionCN: '表示正面或背面的符号（1 或 -1）'
    },
    {
        name: 'Parameters.VertexColor',
        type: 'float4',
        description: 'Vertex color',
        descriptionCN: '顶点颜色'
    },

    // ResolvedView 相关变量
    {
        name: 'ResolvedView.WorldCameraOrigin',
        type: 'float3',
        description: 'Camera origin in world space',
        descriptionCN: '相机在世界空间中的原点'
    },
    {
        name: 'ResolvedView.ViewForward',
        type: 'float3',
        description: 'View forward direction',
        descriptionCN: '视图前向方向'
    },
    {
        name: 'ResolvedView.DirectionalLightColor',
        type: 'float3',
        description: 'Directional light color',
        descriptionCN: '方向光颜色'
    },
    {
        name: 'ResolvedView.DirectionalLightDirection',
        type: 'float3',
        description: 'Directional light direction',
        descriptionCN: '方向光方向'
    },

    // Primitive 相关变量
    {
        name: 'Primitive.LocalToWorld',
        type: 'float4x4',
        description: 'Local to world transformation matrix',
        descriptionCN: '本地空间到世界空间的变换矩阵'
    },
    {
        name: 'Primitive.WorldToLocal',
        type: 'float4x4',
        description: 'World to local transformation matrix',
        descriptionCN: '世界空间到本地空间的变换矩阵'
    },
    {
        name: 'Primitive.ObjectWorldPositionAndRadius',
        type: 'float4',
        description: 'Object world position (xyz) and bounding sphere radius (w)',
        descriptionCN: '对象世界位置（xyz）和包围球半径（w）'
    },
    {
        name: 'Primitive.ObjectBounds',
        type: 'float3',
        description: 'Object bounding box extents',
        descriptionCN: '对象包围盒范围'
    }
];

// ============================================================================
// Unreal 内置宏
// ============================================================================

export const unrealBuiltinMacros: UnrealMacro[] = [
    {
        name: 'MATERIAL_TWOSIDED',
        description: 'Defined if material is two-sided',
        descriptionCN: '如果材质是双面的则定义此宏'
    },
    {
        name: 'MATERIAL_TANGENTSPACENORMAL',
        description: 'Defined if material uses tangent space normals',
        descriptionCN: '如果材质使用切线空间法线则定义此宏'
    },
    {
        name: 'MATERIAL_FULLY_ROUGH',
        description: 'Defined if material is fully rough',
        descriptionCN: '如果材质完全粗糙则定义此宏'
    },
    {
        name: 'MATERIAL_NONMETAL',
        description: 'Defined if material is non-metallic',
        descriptionCN: '如果材质是非金属的则定义此宏'
    },
    {
        name: 'ENGINE_MAJOR_VERSION',
        description: 'Unreal Engine major version number',
        descriptionCN: 'Unreal Engine 主版本号'
    },
    {
        name: 'ENGINE_MINOR_VERSION',
        description: 'Unreal Engine minor version number',
        descriptionCN: 'Unreal Engine 次版本号'
    },
    {
        name: 'COMPILER_HLSL',
        description: 'Defined when compiling with HLSL compiler',
        descriptionCN: '使用 HLSL 编译器编译时定义此宏'
    },
    {
        name: 'COMPILER_GLSL',
        description: 'Defined when compiling with GLSL compiler',
        descriptionCN: '使用 GLSL 编译器编译时定义此宏'
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
        `${variable.description}\n\n` +
        `${variable.descriptionCN}`
    );
    item.sortText = `1_${variable.name}`;
    return item;
}

export function createUnrealFunctionCompletionItem(func: UnrealFunction): CompletionItem {
    const item = new CompletionItem(func.name, CompletionItemKind.Function);
    
    const params = func.parameters.join(', ');
    item.detail = `(${func.returnType}) ${func.name}(${params})`;
    
    let doc = `**${func.name}**\n\n`;
    doc += `**返回类型**: \`${func.returnType}\`\n\n`;
    doc += `**参数**: \`${params}\`\n\n`;
    doc += `${func.description}\n\n`;
    doc += `${func.descriptionCN}`;
    
    if (func.example) {
        doc += `\n\n**示例**:\n\`\`\`hlsl\n${func.example}\n\`\`\``;
    }
    
    item.documentation = new MarkdownString(doc);
    item.sortText = `2_${func.name}`;
    return item;
}

export function createUnrealMacroCompletionItem(macro: UnrealMacro): CompletionItem {
    const item = new CompletionItem(macro.name, CompletionItemKind.Constant);
    item.detail = `(macro) ${macro.name}`;
    
    let doc = `**${macro.name}**\n\n`;
    doc += `${macro.description}\n\n`;
    doc += `${macro.descriptionCN}`;
    
    if (macro.example) {
        doc += `\n\n**示例**:\n\`\`\`hlsl\n${macro.example}\n\`\`\``;
    }
    
    item.documentation = new MarkdownString(doc);
    item.sortText = `3_${macro.name}`;
    return item;
}
