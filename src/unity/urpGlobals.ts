import { l10n } from 'vscode';
/**
 * URP (Universal Render Pipeline) 内置定义
 * 包含 URP 特有的变量、函数、宏定义用于代码补全和悬停提示
 */

import { CompletionItem, CompletionItemKind, MarkdownString } from 'vscode';

// ============================================================================
// URP 内置变量定义
// ============================================================================

export interface URPVariable {
    name: string;
    type: string;
    description: string;
    category: string;
}

export const urpBuiltinVariables: URPVariable[] = [
    // 主光源
    { name: '_MainLightPosition', type: 'half4', description: l10n.t('Main light direction (xyz) and type flag (w)'), category: l10n.t('MainLight') },
    { name: '_MainLightColor', type: 'half4', description: l10n.t('Main light color'), category: l10n.t('MainLight') },
    { name: '_MainLightOcclusionProbes', type: 'half4', description: l10n.t('Main light occlusion probes'), category: l10n.t('MainLight') },
    { name: '_MainLightLayerMask', type: 'uint', description: l10n.t('Main light rendering layer mask'), category: l10n.t('MainLight') },

    // 附加光源
    { name: '_AdditionalLightsCount', type: 'half4', description: l10n.t('Additional light count and parameters'), category: l10n.t('AdditionalLights') },
    { name: '_AdditionalLightsPosition', type: 'float4[]', description: l10n.t('Additional light position array'), category: l10n.t('AdditionalLights') },
    { name: '_AdditionalLightsColor', type: 'half4[]', description: l10n.t('Additional light color array'), category: l10n.t('AdditionalLights') },
    { name: '_AdditionalLightsAttenuation', type: 'half4[]', description: l10n.t('Additional light attenuation array'), category: l10n.t('AdditionalLights') },
    { name: '_AdditionalLightsSpotDir', type: 'half4[]', description: l10n.t('Additional spotlight direction array'), category: l10n.t('AdditionalLights') },
    { name: '_AdditionalLightsOcclusionProbes', type: 'half4[]', description: l10n.t('Additional light occlusion probe array'), category: l10n.t('AdditionalLights') },
    { name: '_AdditionalLightsLayerMasks', type: 'float[]', description: l10n.t('Additional light layer mask array'), category: l10n.t('AdditionalLights') },

    // 阴影
    { name: '_MainLightWorldToShadow', type: 'float4x4[5]', description: l10n.t('Main light world-to-shadow matrix'), category: l10n.t('Shadow') },
    { name: '_CascadeShadowSplitSpheres0', type: 'float4', description: l10n.t('Cascade shadow split sphere 0'), category: l10n.t('Shadow') },
    { name: '_CascadeShadowSplitSpheres1', type: 'float4', description: l10n.t('Cascade shadow split sphere 1'), category: l10n.t('Shadow') },
    { name: '_CascadeShadowSplitSpheres2', type: 'float4', description: l10n.t('Cascade shadow split sphere 2'), category: l10n.t('Shadow') },
    { name: '_CascadeShadowSplitSpheres3', type: 'float4', description: l10n.t('Cascade shadow split sphere 3'), category: l10n.t('Shadow') },
    { name: '_MainLightShadowParams', type: 'float4', description: l10n.t('Main light shadow parameters'), category: l10n.t('Shadow') },

    // 全局光照
    { name: 'unity_ProbesOcclusion', type: 'half4', description: l10n.t('Probe occlusion data'), category: l10n.t('GI') },
    { name: 'unity_SpecCube0', type: 'TextureCube', description: l10n.t('Reflection probe cube map'), category: l10n.t('GI') },
    { name: 'unity_SpecCube0_HDR', type: 'half4', description: l10n.t('Reflection probe HDR decoding parameters'), category: l10n.t('GI') },

    // 相机和渲染目标
    { name: '_ScaledScreenParams', type: 'float4', description: l10n.t('Scaled screen parameters'), category: l10n.t('Camera') },
    { name: '_CameraDepthTexture', type: 'Texture2D', description: l10n.t('Camera depth texture'), category: l10n.t('Camera') },
    { name: '_CameraOpaqueTexture', type: 'Texture2D', description: l10n.t('Camera opaque texture'), category: l10n.t('Camera') },
    { name: '_CameraColorTexture', type: 'Texture2D', description: l10n.t('Camera color texture'), category: l10n.t('Camera') },
];

// ============================================================================
// URP 内置函数定义
// ============================================================================

export interface URPFunction {
    name: string;
    signature: string;
    description: string;
    parameters: { name: string; type: string; description: string }[];
    returnType: string;
    category: string;
}

export const urpBuiltinFunctions: URPFunction[] = [
    // 空间变换函数
    {
        name: 'TransformObjectToHClip',
        signature: 'float4 TransformObjectToHClip(float3 positionOS)',
        description: l10n.t('Transform a vertex from object space to homogeneous clip space'),
        parameters: [{ name: 'positionOS', type: 'float3', description: l10n.t('Vertex position in object space') }],
        returnType: 'float4',
        category: l10n.t('Transform')
    },
    {
        name: 'TransformObjectToWorld',
        signature: 'float3 TransformObjectToWorld(float3 positionOS)',
        description: l10n.t('Transform a vertex from object space to world space'),
        parameters: [{ name: 'positionOS', type: 'float3', description: l10n.t('Vertex position in object space') }],
        returnType: 'float3',
        category: l10n.t('Transform')
    },
    {
        name: 'TransformWorldToHClip',
        signature: 'float4 TransformWorldToHClip(float3 positionWS)',
        description: l10n.t('Transform a vertex from world space to homogeneous clip space'),
        parameters: [{ name: 'positionWS', type: 'float3', description: l10n.t('Vertex position in world space') }],
        returnType: 'float4',
        category: l10n.t('Transform')
    },
    {
        name: 'TransformWorldToView',
        signature: 'float3 TransformWorldToView(float3 positionWS)',
        description: l10n.t('Transform a vertex from world space to view space'),
        parameters: [{ name: 'positionWS', type: 'float3', description: l10n.t('Vertex position in world space') }],
        returnType: 'float3',
        category: l10n.t('Transform')
    },
    {
        name: 'TransformObjectToWorldNormal',
        signature: 'float3 TransformObjectToWorldNormal(float3 normalOS)',
        description: l10n.t('Transform a normal from object space to world space'),
        parameters: [{ name: 'normalOS', type: 'float3', description: l10n.t('Normal in object space') }],
        returnType: 'float3',
        category: l10n.t('Transform')
    },
    {
        name: 'TransformObjectToWorldDir',
        signature: 'float3 TransformObjectToWorldDir(float3 dirOS)',
        description: l10n.t('Transform a direction from object space to world space'),
        parameters: [{ name: 'dirOS', type: 'float3', description: l10n.t('Direction in object space') }],
        returnType: 'float3',
        category: l10n.t('Transform')
    },
    {
        name: 'TransformWorldToObjectDir',
        signature: 'float3 TransformWorldToObjectDir(float3 dirWS)',
        description: l10n.t('Transform a direction from world space to object space'),
        parameters: [{ name: 'dirWS', type: 'float3', description: l10n.t('Direction in world space') }],
        returnType: 'float3',
        category: l10n.t('Transform')
    },
    {
        name: 'TransformTangentToWorld',
        signature: 'real3 TransformTangentToWorld(real3 dirTS, real3x3 tangentToWorld)',
        description: l10n.t('Transform a direction from tangent space to world space'),
        parameters: [
            { name: 'dirTS', type: 'real3', description: l10n.t('Direction in tangent space') },
            { name: 'tangentToWorld', type: 'real3x3', description: l10n.t('Tangent-to-world transformation matrix') }
        ],
        returnType: 'real3',
        category: l10n.t('Transform')
    },
    {
        name: 'GetVertexPositionInputs',
        signature: 'VertexPositionInputs GetVertexPositionInputs(float3 positionOS)',
        description: l10n.t('Get vertex position inputs (including positions in each space)'),
        parameters: [{ name: 'positionOS', type: 'float3', description: l10n.t('Vertex position in object space') }],
        returnType: 'VertexPositionInputs',
        category: l10n.t('Transform')
    },
    {
        name: 'GetVertexNormalInputs',
        signature: 'VertexNormalInputs GetVertexNormalInputs(float3 normalOS, float4 tangentOS)',
        description: l10n.t('Get vertex normal inputs'),
        parameters: [
            { name: 'normalOS', type: 'float3', description: l10n.t('Normal in object space') },
            { name: 'tangentOS', type: 'float4', description: l10n.t('Tangent in object space') }
        ],
        returnType: 'VertexNormalInputs',
        category: l10n.t('Transform')
    },

    // 光照函数
    {
        name: 'GetMainLight',
        signature: 'Light GetMainLight()',
        description: l10n.t('Get main light information'),
        parameters: [],
        returnType: 'Light',
        category: l10n.t('Lighting')
    },
    {
        name: 'GetMainLight',
        signature: 'Light GetMainLight(float4 shadowCoord)',
        description: l10n.t('Get main light information (with shadows)'),
        parameters: [{ name: 'shadowCoord', type: 'float4', description: l10n.t('Shadow coordinates') }],
        returnType: 'Light',
        category: l10n.t('Lighting')
    },
    {
        name: 'GetAdditionalLightsCount',
        signature: 'int GetAdditionalLightsCount()',
        description: l10n.t('Get the additional light count'),
        parameters: [],
        returnType: 'int',
        category: l10n.t('Lighting')
    },
    {
        name: 'GetAdditionalLight',
        signature: 'Light GetAdditionalLight(uint i, float3 positionWS)',
        description: l10n.t('Get an additional light by index'),
        parameters: [
            { name: 'i', type: 'uint', description: l10n.t('Light index') },
            { name: 'positionWS', type: 'float3', description: l10n.t('Position in world space') }
        ],
        returnType: 'Light',
        category: l10n.t('Lighting')
    },
    {
        name: 'LightingLambert',
        signature: 'half3 LightingLambert(half3 lightColor, half3 lightDir, half3 normal)',
        description: l10n.t('Compute Lambert diffuse lighting'),
        parameters: [
            { name: 'lightColor', type: 'half3', description: l10n.t('Light color') },
            { name: 'lightDir', type: 'half3', description: l10n.t('Light direction') },
            { name: 'normal', type: 'half3', description: l10n.t('Surface normal') }
        ],
        returnType: 'half3',
        category: l10n.t('Lighting')
    },
    {
        name: 'LightingSpecular',
        signature: 'half3 LightingSpecular(half3 lightColor, half3 lightDir, half3 normal, half3 viewDir, half4 specular, half smoothness)',
        description: l10n.t('Compute Blinn-Phong specular lighting'),
        parameters: [
            { name: 'lightColor', type: 'half3', description: l10n.t('Light color') },
            { name: 'lightDir', type: 'half3', description: l10n.t('Light direction') },
            { name: 'normal', type: 'half3', description: l10n.t('Surface normal') },
            { name: 'viewDir', type: 'half3', description: l10n.t('View direction') },
            { name: 'specular', type: 'half4', description: l10n.t('Specular color') },
            { name: 'smoothness', type: 'half', description: l10n.t('Smoothness') }
        ],
        returnType: 'half3',
        category: l10n.t('Lighting')
    },
    {
        name: 'UniversalFragmentPBR',
        signature: 'half4 UniversalFragmentPBR(InputData inputData, SurfaceData surfaceData)',
        description: l10n.t('Compute URP PBR lighting'),
        parameters: [
            { name: 'inputData', type: 'InputData', description: l10n.t('Input data structure') },
            { name: 'surfaceData', type: 'SurfaceData', description: l10n.t('Surface data structure') }
        ],
        returnType: 'half4',
        category: l10n.t('Lighting')
    },
    {
        name: 'UniversalFragmentBlinnPhong',
        signature: 'half4 UniversalFragmentBlinnPhong(InputData inputData, SurfaceData surfaceData)',
        description: l10n.t('Compute URP Blinn-Phong lighting'),
        parameters: [
            { name: 'inputData', type: 'InputData', description: l10n.t('Input data structure') },
            { name: 'surfaceData', type: 'SurfaceData', description: l10n.t('Surface data structure') }
        ],
        returnType: 'half4',
        category: l10n.t('Lighting')
    },

    // 阴影函数
    {
        name: 'GetShadowCoord',
        signature: 'float4 GetShadowCoord(VertexPositionInputs vertexInput)',
        description: l10n.t('Get shadow coordinates'),
        parameters: [{ name: 'vertexInput', type: 'VertexPositionInputs', description: l10n.t('Vertex position inputs') }],
        returnType: 'float4',
        category: l10n.t('Shadow')
    },
    {
        name: 'TransformWorldToShadowCoord',
        signature: 'float4 TransformWorldToShadowCoord(float3 positionWS)',
        description: l10n.t('Transform a world-space position to shadow coordinates'),
        parameters: [{ name: 'positionWS', type: 'float3', description: l10n.t('Position in world space') }],
        returnType: 'float4',
        category: l10n.t('Shadow')
    },
    {
        name: 'MainLightRealtimeShadow',
        signature: 'half MainLightRealtimeShadow(float4 shadowCoord)',
        description: l10n.t('Compute main light realtime shadow attenuation'),
        parameters: [{ name: 'shadowCoord', type: 'float4', description: l10n.t('Shadow coordinates') }],
        returnType: 'half',
        category: l10n.t('Shadow')
    },
    {
        name: 'AdditionalLightRealtimeShadow',
        signature: 'half AdditionalLightRealtimeShadow(int lightIndex, float3 positionWS)',
        description: l10n.t('Compute additional light realtime shadow attenuation'),
        parameters: [
            { name: 'lightIndex', type: 'int', description: l10n.t('Light index') },
            { name: 'positionWS', type: 'float3', description: l10n.t('Position in world space') }
        ],
        returnType: 'half',
        category: l10n.t('Shadow')
    },

    // GI 函数
    {
        name: 'SampleSH',
        signature: 'half3 SampleSH(half3 normalWS)',
        description: l10n.t('Sample spherical harmonics lighting'),
        parameters: [{ name: 'normalWS', type: 'half3', description: l10n.t('World-space normal') }],
        returnType: 'half3',
        category: l10n.t('GI')
    },
    {
        name: 'GlossyEnvironmentReflection',
        signature: 'half3 GlossyEnvironmentReflection(half3 reflectVector, half perceptualRoughness, half occlusion)',
        description: l10n.t('Sample glossy environment reflections'),
        parameters: [
            { name: 'reflectVector', type: 'half3', description: l10n.t('Reflection vector') },
            { name: 'perceptualRoughness', type: 'half', description: l10n.t('Perceptual roughness') },
            { name: 'occlusion', type: 'half', description: l10n.t('Occlusion value') }
        ],
        returnType: 'half3',
        category: l10n.t('GI')
    },
    {
        name: 'SampleLightmap',
        signature: 'half3 SampleLightmap(float2 lightmapUV, half3 normalWS)',
        description: l10n.t('Sample a lightmap'),
        parameters: [
            { name: 'lightmapUV', type: 'float2', description: l10n.t('Lightmap UV coordinates') },
            { name: 'normalWS', type: 'half3', description: l10n.t('World-space normal') }
        ],
        returnType: 'half3',
        category: l10n.t('GI')
    },

    // 深度函数
    {
        name: 'LinearEyeDepth',
        signature: 'real LinearEyeDepth(real depth, float4 zBufferParam)',
        description: l10n.t('Convert a depth-buffer value to linear view-space depth'),
        parameters: [
            { name: 'depth', type: 'real', description: l10n.t('Depth-buffer value') },
            { name: 'zBufferParam', type: 'float4', description: l10n.t('Z-buffer parameters') }
        ],
        returnType: 'real',
        category: l10n.t('Depth')
    },
    {
        name: 'Linear01Depth',
        signature: 'real Linear01Depth(real depth, float4 zBufferParam)',
        description: l10n.t('Convert a depth-buffer value to linear depth in the 0-1 range'),
        parameters: [
            { name: 'depth', type: 'real', description: l10n.t('Depth-buffer value') },
            { name: 'zBufferParam', type: 'float4', description: l10n.t('Z-buffer parameters') }
        ],
        returnType: 'real',
        category: l10n.t('Depth')
    },

    // 法线函数
    {
        name: 'UnpackNormal',
        signature: 'real3 UnpackNormal(real4 packedNormal)',
        description: l10n.t('Unpack a normal from a normal map'),
        parameters: [{ name: 'packedNormal', type: 'real4', description: l10n.t('Packed normal data') }],
        returnType: 'real3',
        category: l10n.t('Normal')
    },
    {
        name: 'UnpackNormalScale',
        signature: 'real3 UnpackNormalScale(real4 packedNormal, real scale)',
        description: l10n.t('Unpack and scale a normal from a normal map'),
        parameters: [
            { name: 'packedNormal', type: 'real4', description: l10n.t('Packed normal data') },
            { name: 'scale', type: 'real', description: l10n.t('Normal strength scale') }
        ],
        returnType: 'real3',
        category: l10n.t('Normal')
    },
    {
        name: 'NormalizeNormalPerPixel',
        signature: 'half3 NormalizeNormalPerPixel(half3 normalWS)',
        description: l10n.t('Normalize a normal per pixel'),
        parameters: [{ name: 'normalWS', type: 'half3', description: l10n.t('World-space normal') }],
        returnType: 'half3',
        category: l10n.t('Normal')
    },

    // 雾效函数
    {
        name: 'ComputeFogFactor',
        signature: 'real ComputeFogFactor(float z)',
        description: l10n.t('Compute the fog factor'),
        parameters: [{ name: 'z', type: 'float', description: l10n.t('Clip-space Z coordinate') }],
        returnType: 'real',
        category: l10n.t('Fog')
    },
    {
        name: 'MixFog',
        signature: 'half3 MixFog(half3 fragColor, half fogFactor)',
        description: l10n.t('Blend the fog color'),
        parameters: [
            { name: 'fragColor', type: 'half3', description: l10n.t('Fragment color') },
            { name: 'fogFactor', type: 'half', description: l10n.t('Fog factor') }
        ],
        returnType: 'half3',
        category: l10n.t('Fog')
    },
];

// ============================================================================
// URP 常用宏定义
// ============================================================================

export interface URPMacro {
    name: string;
    description: string;
    usage?: string;
    category: string;
}

export const urpBuiltinMacros: URPMacro[] = [
    // 关键字宏
    { name: '_MAIN_LIGHT_SHADOWS', description: l10n.t('Enable main light shadows'), category: l10n.t('Keyword') },
    { name: '_MAIN_LIGHT_SHADOWS_CASCADE', description: l10n.t('Enable cascaded shadows'), category: l10n.t('Keyword') },
    { name: '_MAIN_LIGHT_SHADOWS_SCREEN', description: l10n.t('Enable screen-space shadows'), category: l10n.t('Keyword') },
    { name: '_ADDITIONAL_LIGHTS', description: l10n.t('Enable additional lights'), category: l10n.t('Keyword') },
    { name: '_ADDITIONAL_LIGHTS_VERTEX', description: l10n.t('Enable per-vertex additional lighting'), category: l10n.t('Keyword') },
    { name: '_ADDITIONAL_LIGHT_SHADOWS', description: l10n.t('Enable additional light shadows'), category: l10n.t('Keyword') },
    { name: '_SHADOWS_SOFT', description: l10n.t('Enable soft shadows'), category: l10n.t('Keyword') },
    { name: '_MIXED_LIGHTING_SUBTRACTIVE', description: l10n.t('Subtractive mixed lighting mode'), category: l10n.t('Keyword') },
    { name: '_SCREEN_SPACE_OCCLUSION', description: l10n.t('Enable screen-space occlusion'), category: l10n.t('Keyword') },
    { name: '_NORMALMAP', description: l10n.t('Enable normal mapping'), category: l10n.t('Keyword') },
    { name: '_EMISSION', description: l10n.t('Enable emission'), category: l10n.t('Keyword') },
    { name: '_SPECULAR_SETUP', description: l10n.t('Use the specular workflow'), category: l10n.t('Keyword') },

    // 纹理宏
    { name: 'TEXTURE2D', description: l10n.t('Declare a 2D texture'), usage: 'TEXTURE2D(_MainTex)', category: l10n.t('Texture') },
    { name: 'TEXTURECUBE', description: l10n.t('Declare a cube texture'), usage: 'TEXTURECUBE(_CubeMap)', category: l10n.t('Texture') },
    { name: 'TEXTURE3D', description: l10n.t('Declare a 3D texture'), usage: 'TEXTURE3D(_Volume)', category: l10n.t('Texture') },
    { name: 'TEXTURE2D_ARRAY', description: l10n.t('Declare a 2D texture array'), usage: 'TEXTURE2D_ARRAY(_TexArray)', category: l10n.t('Texture') },
    { name: 'SAMPLER', description: l10n.t('Declare a sampler'), usage: 'SAMPLER(sampler_MainTex)', category: l10n.t('Texture') },
    { name: 'SAMPLE_TEXTURE2D', description: l10n.t('Sample a 2D texture'), usage: 'SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, uv)', category: l10n.t('Texture') },
    { name: 'SAMPLE_TEXTURE2D_LOD', description: l10n.t('Sample a 2D texture at the specified LOD'), usage: 'SAMPLE_TEXTURE2D_LOD(_MainTex, sampler_MainTex, uv, lod)', category: l10n.t('Texture') },
    { name: 'SAMPLE_TEXTURECUBE', description: l10n.t('Sample a cube texture'), usage: 'SAMPLE_TEXTURECUBE(_CubeMap, sampler_CubeMap, dir)', category: l10n.t('Texture') },
    { name: 'SAMPLE_TEXTURECUBE_LOD', description: l10n.t('Sample a cube texture at the specified LOD'), usage: 'SAMPLE_TEXTURECUBE_LOD(_CubeMap, sampler_CubeMap, dir, lod)', category: l10n.t('Texture') },

    // CBuffer 宏
    { name: 'CBUFFER_START', description: l10n.t('Begin a constant buffer'), usage: 'CBUFFER_START(UnityPerMaterial)', category: l10n.t('CBuffer') },
    { name: 'CBUFFER_END', description: l10n.t('End a constant buffer'), usage: 'CBUFFER_END', category: l10n.t('CBuffer') },

    // 变换宏
    { name: 'TRANSFORM_TEX', description: l10n.t('Apply texture scale and offset'), usage: 'TRANSFORM_TEX(uv, _MainTex)', category: l10n.t('Transform') },

    // 实例化宏
    { name: 'UNITY_SETUP_INSTANCE_ID', description: l10n.t('Set up the instance ID'), usage: 'UNITY_SETUP_INSTANCE_ID(input)', category: l10n.t('Instancing') },
    { name: 'UNITY_TRANSFER_INSTANCE_ID', description: l10n.t('Transfer the instance ID'), usage: 'UNITY_TRANSFER_INSTANCE_ID(input, output)', category: l10n.t('Instancing') },
    { name: 'UNITY_VERTEX_INPUT_INSTANCE_ID', description: l10n.t('Declare a vertex input instance ID'), category: l10n.t('Instancing') },

    // 立体渲染宏
    { name: 'UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO', description: l10n.t('Initialize stereo rendering output'), usage: 'UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(output)', category: l10n.t('Stereo') },
    { name: 'UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX', description: l10n.t('Set up the stereo eye index'), usage: 'UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(input)', category: l10n.t('Stereo') },
];

// ============================================================================
// URP Include 路径
// ============================================================================

export const urpIncludePaths: string[] = [
    'Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl',
    'Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl',
    'Packages/com.unity.render-pipelines.universal/ShaderLibrary/Shadows.hlsl',
    'Packages/com.unity.render-pipelines.universal/ShaderLibrary/Input.hlsl',
    'Packages/com.unity.render-pipelines.universal/ShaderLibrary/SurfaceInput.hlsl',
    'Packages/com.unity.render-pipelines.universal/ShaderLibrary/DeclareDepthTexture.hlsl',
    'Packages/com.unity.render-pipelines.universal/ShaderLibrary/DeclareOpaqueTexture.hlsl',
    'Packages/com.unity.render-pipelines.core/ShaderLibrary/Common.hlsl',
    'Packages/com.unity.render-pipelines.core/ShaderLibrary/Color.hlsl',
    'Packages/com.unity.render-pipelines.core/ShaderLibrary/Packing.hlsl',
];

// ============================================================================
// 辅助函数：生成 CompletionItem
// ============================================================================

export function createURPVariableCompletionItem(v: URPVariable): CompletionItem {
    const item = new CompletionItem(v.name, CompletionItemKind.Variable);
    item.detail = `(URP ${v.category}) ${v.type}`;
    item.documentation = new MarkdownString(l10n.t('**{0}** (URP)\n\n{1}\n\n- **Type**: `{2}`\n- **Category**: {3}', v.name, v.description, v.type, v.category));
    return item;
}

export function createURPFunctionCompletionItem(f: URPFunction): CompletionItem {
    const item = new CompletionItem(f.name, CompletionItemKind.Function);
    item.detail = `(URP) ${f.signature}`;
    const paramDocs = f.parameters.map(p => `- \`${p.type}\` **${p.name}**: ${p.description}`).join('\n');
    item.documentation = new MarkdownString(l10n.t('**{0}** (URP)\n\n{1}\n\n**Parameters**:\n{2}\n\n**Returns**: `{3}`', f.name, f.description, paramDocs || l10n.t('None'), f.returnType));
    item.insertText = f.name;
    return item;
}

export function createURPMacroCompletionItem(m: URPMacro): CompletionItem {
    const item = new CompletionItem(m.name, CompletionItemKind.Constant);
    item.detail = `(URP ${m.category}) Macro`;
    const usageText = m.usage ? l10n.t('\n\n**Usage**: `{0}`', m.usage) : '';
    item.documentation = new MarkdownString(`**${m.name}** (URP)\n\n${m.description}${usageText}`);
    return item;
}

export function createIncludeCompletionItem(path: string): CompletionItem {
    const item = new CompletionItem(path, CompletionItemKind.File);
    item.detail = 'URP Include';
    item.documentation = new MarkdownString(l10n.t('**URP include path**\n\n`#include "{0}"`', path));
    item.insertText = `#include "${path}"`;
    return item;
}
