import { l10n } from 'vscode';
/**
 * Unity Shader 内置全局定义
 * 包含 Unity 内置变量、函数、宏的定义用于代码补全和悬停提示
 */

import { CompletionItem, CompletionItemKind, MarkdownString } from 'vscode';

// ============================================================================
// Unity 内置变量定义
// ============================================================================

export interface UnityVariable {
    name: string;
    type: string;
    description: string;
    category: string;
}

export const unityBuiltinVariables: UnityVariable[] = [
    // 变换矩阵
    { name: 'UNITY_MATRIX_MVP', type: 'float4x4', description: l10n.t('Current model-view-projection matrix'), category: l10n.t('Matrix') },
    { name: 'UNITY_MATRIX_MV', type: 'float4x4', description: l10n.t('Current model-view matrix'), category: l10n.t('Matrix') },
    { name: 'UNITY_MATRIX_V', type: 'float4x4', description: l10n.t('Current view matrix'), category: l10n.t('Matrix') },
    { name: 'UNITY_MATRIX_P', type: 'float4x4', description: l10n.t('Current projection matrix'), category: l10n.t('Matrix') },
    { name: 'UNITY_MATRIX_VP', type: 'float4x4', description: l10n.t('Current view-projection matrix'), category: l10n.t('Matrix') },
    { name: 'UNITY_MATRIX_T_MV', type: 'float4x4', description: l10n.t('Transpose of the model-view matrix'), category: l10n.t('Matrix') },
    { name: 'UNITY_MATRIX_IT_MV', type: 'float4x4', description: l10n.t('Inverse transpose of the model-view matrix (for transforming normals)'), category: l10n.t('Matrix') },
    { name: 'UNITY_MATRIX_M', type: 'float4x4', description: l10n.t('Current model matrix'), category: l10n.t('Matrix') },
    { name: 'UNITY_MATRIX_I_M', type: 'float4x4', description: l10n.t('Inverse of the current model matrix'), category: l10n.t('Matrix') },
    { name: 'UNITY_MATRIX_I_V', type: 'float4x4', description: l10n.t('Inverse of the current view matrix'), category: l10n.t('Matrix') },
    { name: 'unity_ObjectToWorld', type: 'float4x4', description: l10n.t('Object-to-world transformation matrix'), category: l10n.t('Matrix') },
    { name: 'unity_WorldToObject', type: 'float4x4', description: l10n.t('World-to-object transformation matrix'), category: l10n.t('Matrix') },
    { name: 'unity_MatrixVP', type: 'float4x4', description: l10n.t('View-projection matrix'), category: l10n.t('Matrix') },
    { name: 'unity_MatrixV', type: 'float4x4', description: l10n.t('View matrix'), category: l10n.t('Matrix') },
    { name: 'unity_MatrixInvV', type: 'float4x4', description: l10n.t('Inverse view matrix'), category: l10n.t('Matrix') },

    // 相机参数
    { name: '_WorldSpaceCameraPos', type: 'float3', description: l10n.t('Camera position in world space'), category: l10n.t('Camera') },
    { name: '_ProjectionParams', type: 'float4', description: l10n.t('Projection parameters: x=1.0/-1.0, y=near, z=far, w=1/far'), category: l10n.t('Camera') },
    { name: '_ScreenParams', type: 'float4', description: l10n.t('Screen parameters: x=width, y=height, z=1+1/width, w=1+1/height'), category: l10n.t('Camera') },
    { name: '_ZBufferParams', type: 'float4', description: l10n.t('Z-buffer parameters for linearizing depth'), category: l10n.t('Camera') },
    { name: 'unity_OrthoParams', type: 'float4', description: l10n.t('Orthographic camera parameters: x=width, y=height, z=unused, w=1 (orthographic)/0 (perspective)'), category: l10n.t('Camera') },
    { name: 'unity_CameraProjection', type: 'float4x4', description: l10n.t('Camera projection matrix'), category: l10n.t('Camera') },
    { name: 'unity_CameraInvProjection', type: 'float4x4', description: l10n.t('Inverse camera projection matrix'), category: l10n.t('Camera') },
    { name: 'unity_CameraWorldClipPlanes', type: 'float4[6]', description: l10n.t('Camera clipping planes in world space'), category: l10n.t('Camera') },

    // 时间变量
    { name: '_Time', type: 'float4', description: l10n.t('Time: (t/20, t, t*2, t*3)'), category: l10n.t('Time') },
    { name: '_SinTime', type: 'float4', description: l10n.t('Sine of time: (t/8, t/4, t/2, t)'), category: l10n.t('Time') },
    { name: '_CosTime', type: 'float4', description: l10n.t('Cosine of time: (t/8, t/4, t/2, t)'), category: l10n.t('Time') },
    { name: 'unity_DeltaTime', type: 'float4', description: l10n.t('Delta time: (dt, 1/dt, smoothDt, 1/smoothDt)'), category: l10n.t('Time') },

    // 光照变量
    { name: '_WorldSpaceLightPos0', type: 'float4', description: l10n.t('Main light position/direction in world space (w=0 for directional lights, w=1 for point lights)'), category: l10n.t('Lighting') },
    { name: '_LightPositionRange', type: 'float4', description: l10n.t('Light position and range'), category: l10n.t('Lighting') },
    { name: '_LightColor0', type: 'fixed4', description: l10n.t('Main light color'), category: l10n.t('Lighting') },
    { name: 'unity_4LightPosX0', type: 'float4', description: l10n.t('X coordinates of the first four non-important point lights'), category: l10n.t('Lighting') },
    { name: 'unity_4LightPosY0', type: 'float4', description: l10n.t('Y coordinates of the first four non-important point lights'), category: l10n.t('Lighting') },
    { name: 'unity_4LightPosZ0', type: 'float4', description: l10n.t('Z coordinates of the first four non-important point lights'), category: l10n.t('Lighting') },
    { name: 'unity_4LightAtten0', type: 'float4', description: l10n.t('Attenuation of the first four non-important point lights'), category: l10n.t('Lighting') },
    { name: 'unity_LightColor', type: 'half4[4]', description: l10n.t('Colors of the first four non-important point lights'), category: l10n.t('Lighting') },
    { name: 'unity_WorldToShadow', type: 'float4x4[4]', description: l10n.t('World-to-shadow transformation matrix'), category: l10n.t('Lighting') },
    { name: '_LightShadowData', type: 'float4', description: l10n.t('Shadow data'), category: l10n.t('Lighting') },
    { name: 'unity_ShadowFadeCenterAndType', type: 'float4', description: l10n.t('Shadow fade center and type'), category: l10n.t('Lighting') },

    // 环境光/球谐
    { name: 'unity_AmbientSky', type: 'fixed4', description: l10n.t('Sky ambient color'), category: l10n.t('Ambient') },
    { name: 'unity_AmbientEquator', type: 'fixed4', description: l10n.t('Equator ambient color'), category: l10n.t('Ambient') },
    { name: 'unity_AmbientGround', type: 'fixed4', description: l10n.t('Ground ambient color'), category: l10n.t('Ambient') },
    { name: 'UNITY_LIGHTMODEL_AMBIENT', type: 'fixed4', description: l10n.t('Ambient light color (legacy)'), category: l10n.t('Ambient') },
    { name: 'unity_SHAr', type: 'half4', description: l10n.t('Spherical harmonics coefficients Ar'), category: l10n.t('Ambient') },
    { name: 'unity_SHAg', type: 'half4', description: l10n.t('Spherical harmonics coefficients Ag'), category: l10n.t('Ambient') },
    { name: 'unity_SHAb', type: 'half4', description: l10n.t('Spherical harmonics coefficients Ab'), category: l10n.t('Ambient') },
    { name: 'unity_SHBr', type: 'half4', description: l10n.t('Spherical harmonics coefficients Br'), category: l10n.t('Ambient') },
    { name: 'unity_SHBg', type: 'half4', description: l10n.t('Spherical harmonics coefficients Bg'), category: l10n.t('Ambient') },
    { name: 'unity_SHBb', type: 'half4', description: l10n.t('Spherical harmonics coefficients Bb'), category: l10n.t('Ambient') },
    { name: 'unity_SHC', type: 'half4', description: l10n.t('Spherical harmonics coefficients C'), category: l10n.t('Ambient') },

    // 雾效
    { name: 'unity_FogColor', type: 'fixed4', description: l10n.t('Fog color'), category: l10n.t('Fog') },
    { name: 'unity_FogParams', type: 'float4', description: l10n.t('Fog parameters: (density/sqrt(ln(2)), density/ln(2), -1/(end-start), end/(end-start))'), category: l10n.t('Fog') },

    // 光照贴图
    { name: 'unity_Lightmap', type: 'sampler2D', description: l10n.t('Lightmap'), category: l10n.t('Lightmap') },
    { name: 'unity_LightmapST', type: 'float4', description: l10n.t('Lightmap scale and offset'), category: l10n.t('Lightmap') },
    { name: 'unity_DynamicLightmap', type: 'sampler2D', description: l10n.t('Dynamic lightmap'), category: l10n.t('Lightmap') },
    { name: 'unity_DynamicLightmapST', type: 'float4', description: l10n.t('Dynamic lightmap scale and offset'), category: l10n.t('Lightmap') },
];

// ============================================================================
// Unity 内置函数定义
// ============================================================================

export interface UnityFunction {
    name: string;
    signature: string;
    description: string;
    parameters: { name: string; type: string; description: string }[];
    returnType: string;
    category: string;
}

export const unityBuiltinFunctions: UnityFunction[] = [
    // 空间变换函数
    {
        name: 'UnityObjectToClipPos',
        signature: 'float4 UnityObjectToClipPos(float3 pos)',
        description: l10n.t('Transform a vertex from object space to clip space'),
        parameters: [{ name: 'pos', type: 'float3', description: l10n.t('Vertex position in object space') }],
        returnType: 'float4',
        category: l10n.t('Transform')
    },
    {
        name: 'UnityObjectToViewPos',
        signature: 'float3 UnityObjectToViewPos(float3 pos)',
        description: l10n.t('Transform a vertex from object space to view space'),
        parameters: [{ name: 'pos', type: 'float3', description: l10n.t('Vertex position in object space') }],
        returnType: 'float3',
        category: l10n.t('Transform')
    },
    {
        name: 'UnityWorldToClipPos',
        signature: 'float4 UnityWorldToClipPos(float3 pos)',
        description: l10n.t('Transform a vertex from world space to clip space'),
        parameters: [{ name: 'pos', type: 'float3', description: l10n.t('Vertex position in world space') }],
        returnType: 'float4',
        category: l10n.t('Transform')
    },
    {
        name: 'UnityViewToClipPos',
        signature: 'float4 UnityViewToClipPos(float3 pos)',
        description: l10n.t('Transform a vertex from view space to clip space'),
        parameters: [{ name: 'pos', type: 'float3', description: l10n.t('Vertex position in view space') }],
        returnType: 'float4',
        category: l10n.t('Transform')
    },
    {
        name: 'UnityObjectToWorldNormal',
        signature: 'float3 UnityObjectToWorldNormal(float3 norm)',
        description: l10n.t('Transform a normal from object space to world space'),
        parameters: [{ name: 'norm', type: 'float3', description: l10n.t('Normal in object space') }],
        returnType: 'float3',
        category: l10n.t('Transform')
    },
    {
        name: 'UnityObjectToWorldDir',
        signature: 'float3 UnityObjectToWorldDir(float3 dir)',
        description: l10n.t('Transform a direction from object space to world space'),
        parameters: [{ name: 'dir', type: 'float3', description: l10n.t('Direction in object space') }],
        returnType: 'float3',
        category: l10n.t('Transform')
    },
    {
        name: 'UnityWorldToObjectDir',
        signature: 'float3 UnityWorldToObjectDir(float3 dir)',
        description: l10n.t('Transform a direction from world space to object space'),
        parameters: [{ name: 'dir', type: 'float3', description: l10n.t('Direction in world space') }],
        returnType: 'float3',
        category: l10n.t('Transform')
    },
    {
        name: 'UnityWorldSpaceViewDir',
        signature: 'float3 UnityWorldSpaceViewDir(float4 worldPos)',
        description: l10n.t('Compute the world-space direction from a vertex to the camera (not normalized)'),
        parameters: [{ name: 'worldPos', type: 'float4', description: l10n.t('Vertex position in world space') }],
        returnType: 'float3',
        category: l10n.t('Transform')
    },
    {
        name: 'UnityWorldSpaceLightDir',
        signature: 'float3 UnityWorldSpaceLightDir(float4 worldPos)',
        description: l10n.t('Compute the world-space direction from a vertex to the light (not normalized)'),
        parameters: [{ name: 'worldPos', type: 'float4', description: l10n.t('Vertex position in world space') }],
        returnType: 'float3',
        category: l10n.t('Transform')
    },
    {
        name: 'ObjSpaceViewDir',
        signature: 'float3 ObjSpaceViewDir(float4 v)',
        description: l10n.t('Compute the object-space direction from a vertex to the camera'),
        parameters: [{ name: 'v', type: 'float4', description: l10n.t('Vertex position in object space') }],
        returnType: 'float3',
        category: l10n.t('Transform')
    },
    {
        name: 'ObjSpaceLightDir',
        signature: 'float3 ObjSpaceLightDir(float4 v)',
        description: l10n.t('Compute the object-space direction from a vertex to the light'),
        parameters: [{ name: 'v', type: 'float4', description: l10n.t('Vertex position in object space') }],
        returnType: 'float3',
        category: l10n.t('Transform')
    },

    // 屏幕坐标函数
    {
        name: 'ComputeScreenPos',
        signature: 'float4 ComputeScreenPos(float4 pos)',
        description: l10n.t('Compute screen-space position (for screen-space effects)'),
        parameters: [{ name: 'pos', type: 'float4', description: l10n.t('Position in clip space') }],
        returnType: 'float4',
        category: l10n.t('Screen')
    },
    {
        name: 'ComputeGrabScreenPos',
        signature: 'float4 ComputeGrabScreenPos(float4 pos)',
        description: l10n.t('Compute screen coordinates for the grab texture'),
        parameters: [{ name: 'pos', type: 'float4', description: l10n.t('Position in clip space') }],
        returnType: 'float4',
        category: l10n.t('Screen')
    },

    // 深度函数
    {
        name: 'LinearEyeDepth',
        signature: 'float LinearEyeDepth(float z)',
        description: l10n.t('Convert a depth-buffer value to linear view-space depth'),
        parameters: [{ name: 'z', type: 'float', description: l10n.t('Depth-buffer value') }],
        returnType: 'float',
        category: l10n.t('Depth')
    },
    {
        name: 'Linear01Depth',
        signature: 'float Linear01Depth(float z)',
        description: l10n.t('Convert a depth-buffer value to linear depth in the 0-1 range'),
        parameters: [{ name: 'z', type: 'float', description: l10n.t('Depth-buffer value') }],
        returnType: 'float',
        category: l10n.t('Depth')
    },
    {
        name: 'COMPUTE_EYEDEPTH',
        signature: 'float COMPUTE_EYEDEPTH(float4 pos)',
        description: l10n.t('Compute view-space depth (macro)'),
        parameters: [{ name: 'pos', type: 'float4', description: l10n.t('Position in view space') }],
        returnType: 'float',
        category: l10n.t('Depth')
    },
    {
        name: 'DECODE_EYEDEPTH',
        signature: 'float DECODE_EYEDEPTH(float z)',
        description: l10n.t('Decode view-space depth (macro)'),
        parameters: [{ name: 'z', type: 'float', description: l10n.t('Depth-buffer value') }],
        returnType: 'float',
        category: l10n.t('Depth')
    },

    // 光照函数
    {
        name: 'Shade4PointLights',
        signature: 'float3 Shade4PointLights(...)',
        description: l10n.t('Compute lighting from four point lights'),
        parameters: [],
        returnType: 'float3',
        category: l10n.t('Lighting')
    },
    {
        name: 'ShadeSH9',
        signature: 'half3 ShadeSH9(half4 normal)',
        description: l10n.t('Compute ambient lighting using spherical harmonics'),
        parameters: [{ name: 'normal', type: 'half4', description: l10n.t('World-space normal (w=1)') }],
        returnType: 'half3',
        category: l10n.t('Lighting')
    },
    {
        name: 'ShadeSH3Order',
        signature: 'half3 ShadeSH3Order(half4 normal)',
        description: l10n.t('Compute ambient lighting using third-order spherical harmonics'),
        parameters: [{ name: 'normal', type: 'half4', description: l10n.t('World-space normal (w=1)') }],
        returnType: 'half3',
        category: l10n.t('Lighting')
    },
    {
        name: 'ShadeVertexLights',
        signature: 'float3 ShadeVertexLights(float4 vertex, float3 normal)',
        description: l10n.t('Compute vertex lighting in the vertex shader'),
        parameters: [
            { name: 'vertex', type: 'float4', description: l10n.t('Vertex position in object space') },
            { name: 'normal', type: 'float3', description: l10n.t('Normal in object space') }
        ],
        returnType: 'float3',
        category: l10n.t('Lighting')
    },

    // 纹理采样函数
    {
        name: 'tex2D',
        signature: 'half4 tex2D(sampler2D s, float2 uv)',
        description: l10n.t('Sample a 2D texture'),
        parameters: [
            { name: 's', type: 'sampler2D', description: l10n.t('Texture sampler') },
            { name: 'uv', type: 'float2', description: l10n.t('Texture coordinates') }
        ],
        returnType: 'half4',
        category: l10n.t('Texture')
    },
    {
        name: 'tex2Dlod',
        signature: 'half4 tex2Dlod(sampler2D s, float4 uv)',
        description: l10n.t('Sample a 2D texture at the specified LOD'),
        parameters: [
            { name: 's', type: 'sampler2D', description: l10n.t('Texture sampler') },
            { name: 'uv', type: 'float4', description: l10n.t('Texture coordinates (xy=uv, w=lod)') }
        ],
        returnType: 'half4',
        category: l10n.t('Texture')
    },
    {
        name: 'tex2Dproj',
        signature: 'half4 tex2Dproj(sampler2D s, float4 uv)',
        description: l10n.t('Sample a 2D texture with projection'),
        parameters: [
            { name: 's', type: 'sampler2D', description: l10n.t('Texture sampler') },
            { name: 'uv', type: 'float4', description: l10n.t('Projective texture coordinates') }
        ],
        returnType: 'half4',
        category: l10n.t('Texture')
    },
    {
        name: 'texCUBE',
        signature: 'half4 texCUBE(samplerCUBE s, float3 dir)',
        description: l10n.t('Sample a cube texture'),
        parameters: [
            { name: 's', type: 'samplerCUBE', description: l10n.t('Cube texture sampler') },
            { name: 'dir', type: 'float3', description: l10n.t('Sampling direction') }
        ],
        returnType: 'half4',
        category: l10n.t('Texture')
    },

    // 颜色空间转换
    {
        name: 'GammaToLinearSpace',
        signature: 'half3 GammaToLinearSpace(half3 sRGB)',
        description: l10n.t('Convert a color from gamma space to linear space'),
        parameters: [{ name: 'sRGB', type: 'half3', description: l10n.t('Gamma-space color') }],
        returnType: 'half3',
        category: l10n.t('Color')
    },
    {
        name: 'LinearToGammaSpace',
        signature: 'half3 LinearToGammaSpace(half3 linRGB)',
        description: l10n.t('Convert a color from linear space to gamma space'),
        parameters: [{ name: 'linRGB', type: 'half3', description: l10n.t('Linear-space color') }],
        returnType: 'half3',
        category: l10n.t('Color')
    },

    // 法线解码
    {
        name: 'UnpackNormal',
        signature: 'half3 UnpackNormal(half4 packednormal)',
        description: l10n.t('Decode a normal from a normal map'),
        parameters: [{ name: 'packednormal', type: 'half4', description: l10n.t('Packed normal data') }],
        returnType: 'half3',
        category: l10n.t('Normal')
    },
    {
        name: 'UnpackNormalWithScale',
        signature: 'half3 UnpackNormalWithScale(half4 packednormal, half scale)',
        description: l10n.t('Decode and scale a normal from a normal map'),
        parameters: [
            { name: 'packednormal', type: 'half4', description: l10n.t('Packed normal data') },
            { name: 'scale', type: 'half', description: l10n.t('Normal strength scale') }
        ],
        returnType: 'half3',
        category: l10n.t('Normal')
    },

    // HDR编码/解码
    {
        name: 'DecodeHDR',
        signature: 'half3 DecodeHDR(half4 data, half4 decodeInstructions)',
        description: l10n.t('Decode HDR color data'),
        parameters: [
            { name: 'data', type: 'half4', description: l10n.t('Encoded HDR data') },
            { name: 'decodeInstructions', type: 'half4', description: l10n.t('Decoding instructions') }
        ],
        returnType: 'half3',
        category: l10n.t('Color')
    },
    {
        name: 'EncodeFloatRGBA',
        signature: 'float4 EncodeFloatRGBA(float v)',
        description: l10n.t('Encode a floating-point value as RGBA'),
        parameters: [{ name: 'v', type: 'float', description: l10n.t('Floating-point value to encode') }],
        returnType: 'float4',
        category: l10n.t('Color')
    },
    {
        name: 'DecodeFloatRGBA',
        signature: 'float DecodeFloatRGBA(float4 enc)',
        description: l10n.t('Decode a floating-point value from RGBA'),
        parameters: [{ name: 'enc', type: 'float4', description: l10n.t('Encoded RGBA data') }],
        returnType: 'float',
        category: l10n.t('Color')
    },
    {
        name: 'DecodeFloatRG',
        signature: 'float DecodeFloatRG(float2 enc)',
        description: l10n.t('Decode a floating-point value from RG'),
        parameters: [{ name: 'enc', type: 'float2', description: l10n.t('Encoded RG data') }],
        returnType: 'float',
        category: l10n.t('Color')
    },
    {
        name: 'EncodeFloatRG',
        signature: 'float2 EncodeFloatRG(float v)',
        description: l10n.t('Encode a floating-point value as RG'),
        parameters: [{ name: 'v', type: 'float', description: l10n.t('Floating-point value to encode') }],
        returnType: 'float2',
        category: l10n.t('Color')
    },
];

// ============================================================================
// Unity 常用宏定义
// ============================================================================

export interface UnityMacro {
    name: string;
    description: string;
    usage?: string;
    category: string;
}

export const unityBuiltinMacros: UnityMacro[] = [
    // 纹理采样宏
    { name: 'TRANSFORM_TEX', description: l10n.t('Apply texture scale and offset'), usage: 'TRANSFORM_TEX(uv, _MainTex)', category: l10n.t('Texture') },
    { name: 'SAMPLE_TEXTURE2D', description: l10n.t('SRP-compatible 2D texture sampling'), usage: 'SAMPLE_TEXTURE2D(tex, sampler, uv)', category: l10n.t('Texture') },
    { name: 'SAMPLE_TEXTURE2D_LOD', description: l10n.t('SRP-compatible 2D texture sampling at a specified LOD'), usage: 'SAMPLE_TEXTURE2D_LOD(tex, sampler, uv, lod)', category: l10n.t('Texture') },
    { name: 'SAMPLE_TEXTURECUBE', description: l10n.t('SRP-compatible cube texture sampling'), usage: 'SAMPLE_TEXTURECUBE(tex, sampler, dir)', category: l10n.t('Texture') },
    { name: 'SAMPLE_TEXTURE3D', description: l10n.t('SRP-compatible 3D texture sampling'), usage: 'SAMPLE_TEXTURE3D(tex, sampler, uvw)', category: l10n.t('Texture') },
    
    // 纹理声明宏
    { name: 'UNITY_DECLARE_TEX2D', description: l10n.t('Declare a 2D texture'), usage: 'UNITY_DECLARE_TEX2D(_MainTex)', category: l10n.t('Texture') },
    { name: 'UNITY_DECLARE_TEX2D_NOSAMPLER', description: l10n.t('Declare a 2D texture without a sampler'), usage: 'UNITY_DECLARE_TEX2D_NOSAMPLER(_MainTex)', category: l10n.t('Texture') },
    { name: 'UNITY_DECLARE_TEXCUBE', description: l10n.t('Declare a cube texture'), usage: 'UNITY_DECLARE_TEXCUBE(_CubeMap)', category: l10n.t('Texture') },
    { name: 'UNITY_SAMPLE_TEX2D', description: l10n.t('Unity-compatible 2D texture sampling'), usage: 'UNITY_SAMPLE_TEX2D(_MainTex, uv)', category: l10n.t('Texture') },
    { name: 'UNITY_SAMPLE_TEX2D_SAMPLER', description: l10n.t('Sample a 2D texture with the specified sampler'), usage: 'UNITY_SAMPLE_TEX2D_SAMPLER(_MainTex, sampler_MainTex, uv)', category: l10n.t('Texture') },

    // 雾效宏
    { name: 'UNITY_FOG_COORDS', description: l10n.t('Declare fog coordinates'), usage: 'UNITY_FOG_COORDS(1)', category: l10n.t('Fog') },
    { name: 'UNITY_TRANSFER_FOG', description: l10n.t('Transfer fog data'), usage: 'UNITY_TRANSFER_FOG(o, o.vertex)', category: l10n.t('Fog') },
    { name: 'UNITY_APPLY_FOG', description: l10n.t('Apply fog'), usage: 'UNITY_APPLY_FOG(i.fogCoord, col)', category: l10n.t('Fog') },

    // 阴影宏
    { name: 'SHADOW_COORDS', description: l10n.t('Declare shadow coordinates'), usage: 'SHADOW_COORDS(1)', category: l10n.t('Shadow') },
    { name: 'TRANSFER_SHADOW', description: l10n.t('Transfer shadow data'), usage: 'TRANSFER_SHADOW(o)', category: l10n.t('Shadow') },
    { name: 'SHADOW_ATTENUATION', description: l10n.t('Get shadow attenuation'), usage: 'SHADOW_ATTENUATION(i)', category: l10n.t('Shadow') },
    { name: 'UNITY_SHADOW_COORDS', description: l10n.t('Declare Unity shadow coordinates'), usage: 'UNITY_SHADOW_COORDS(1)', category: l10n.t('Shadow') },
    { name: 'UNITY_TRANSFER_SHADOW', description: l10n.t('Transfer Unity shadow data'), usage: 'UNITY_TRANSFER_SHADOW(o, v.texcoord)', category: l10n.t('Shadow') },
    { name: 'UNITY_SHADOW_ATTENUATION', description: l10n.t('Get Unity shadow attenuation'), usage: 'UNITY_SHADOW_ATTENUATION(i, worldPos)', category: l10n.t('Shadow') },
    { name: 'UNITY_LIGHT_ATTENUATION', description: l10n.t('Get light attenuation (including shadows)'), usage: 'UNITY_LIGHT_ATTENUATION(atten, i, worldPos)', category: l10n.t('Shadow') },

    // 实例化宏
    { name: 'UNITY_VERTEX_INPUT_INSTANCE_ID', description: l10n.t('Declare a vertex instance ID'), usage: 'UNITY_VERTEX_INPUT_INSTANCE_ID', category: l10n.t('Instancing') },
    { name: 'UNITY_VERTEX_OUTPUT_STEREO', description: l10n.t('Declare stereo rendering output'), usage: 'UNITY_VERTEX_OUTPUT_STEREO', category: l10n.t('Instancing') },
    { name: 'UNITY_SETUP_INSTANCE_ID', description: l10n.t('Set up the instance ID'), usage: 'UNITY_SETUP_INSTANCE_ID(v)', category: l10n.t('Instancing') },
    { name: 'UNITY_TRANSFER_INSTANCE_ID', description: l10n.t('Transfer the instance ID'), usage: 'UNITY_TRANSFER_INSTANCE_ID(v, o)', category: l10n.t('Instancing') },
    { name: 'UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX', description: l10n.t('Set up the stereo eye index'), usage: 'UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(i)', category: l10n.t('Instancing') },
    { name: 'UNITY_INITIALIZE_OUTPUT', description: l10n.t('Initialize the output structure'), usage: 'UNITY_INITIALIZE_OUTPUT(v2f, o)', category: l10n.t('Instancing') },
    { name: 'UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO', description: l10n.t('Initialize stereo rendering output'), usage: 'UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o)', category: l10n.t('Instancing') },
];

// ============================================================================
// ShaderLab 关键字定义
// ============================================================================

export interface ShaderLabKeyword {
    name: string;
    description: string;
    snippet?: string;
    category: string;
}

export const shaderLabKeywords: ShaderLabKeyword[] = [
    // 结构关键字
    { name: 'Shader', description: l10n.t('Shader declaration'), snippet: 'Shader "${1:Custom/MyShader}" {\n\t$0\n}', category: l10n.t('Structure') },
    { name: 'Properties', description: l10n.t('Properties block'), snippet: 'Properties {\n\t$0\n}', category: l10n.t('Structure') },
    { name: 'SubShader', description: l10n.t('Subshader'), snippet: 'SubShader {\n\tTags { ${1:"RenderType"="Opaque"} }\n\t$0\n}', category: l10n.t('Structure') },
    { name: 'Pass', description: l10n.t('Rendering pass'), snippet: 'Pass {\n\t$0\n}', category: l10n.t('Structure') },
    { name: 'Category', description: l10n.t('Category'), snippet: 'Category {\n\t$0\n}', category: l10n.t('Structure') },
    { name: 'CGPROGRAM', description: l10n.t('Start a CG program block'), snippet: 'CGPROGRAM\n$0\nENDCG', category: l10n.t('Structure') },
    { name: 'ENDCG', description: l10n.t('End a CG program block'), category: l10n.t('Structure') },
    { name: 'CGINCLUDE', description: l10n.t('Start a CG include block'), snippet: 'CGINCLUDE\n$0\nENDCG', category: l10n.t('Structure') },
    { name: 'HLSLPROGRAM', description: l10n.t('Start an HLSL program block'), snippet: 'HLSLPROGRAM\n$0\nENDHLSL', category: l10n.t('Structure') },
    { name: 'ENDHLSL', description: l10n.t('End an HLSL program block'), category: l10n.t('Structure') },
    { name: 'HLSLINCLUDE', description: l10n.t('Start an HLSL include block'), snippet: 'HLSLINCLUDE\n$0\nENDHLSL', category: l10n.t('Structure') },
    
    // 渲染状态
    { name: 'Blend', description: l10n.t('Blend mode'), snippet: 'Blend ${1:SrcAlpha} ${2:OneMinusSrcAlpha}', category: l10n.t('RenderState') },
    { name: 'BlendOp', description: l10n.t('Blend operation'), snippet: 'BlendOp ${1:Add}', category: l10n.t('RenderState') },
    { name: 'Cull', description: l10n.t('Culling mode'), snippet: 'Cull ${1|Off,Front,Back|}', category: l10n.t('RenderState') },
    { name: 'ZWrite', description: l10n.t('Depth write'), snippet: 'ZWrite ${1|On,Off|}', category: l10n.t('RenderState') },
    { name: 'ZTest', description: l10n.t('Depth test'), snippet: 'ZTest ${1|LEqual,Less,Greater,GEqual,Equal,NotEqual,Always|}', category: l10n.t('RenderState') },
    { name: 'ColorMask', description: l10n.t('Color mask'), snippet: 'ColorMask ${1|RGBA,RGB,A,0|}', category: l10n.t('RenderState') },
    { name: 'Offset', description: l10n.t('Depth offset'), snippet: 'Offset ${1:-1}, ${2:-1}', category: l10n.t('RenderState') },
    { name: 'Stencil', description: l10n.t('Stencil test'), snippet: 'Stencil {\n\tRef ${1:1}\n\tComp ${2:Always}\n\tPass ${3:Replace}\n}', category: l10n.t('RenderState') },

    // Tags
    { name: 'Tags', description: l10n.t('Tags block'), snippet: 'Tags { ${1:"RenderType"="${2:Opaque}"} }', category: l10n.t('Tags') },
    { name: 'LOD', description: l10n.t('Level of detail'), snippet: 'LOD ${1:200}', category: l10n.t('Tags') },
    { name: 'FallBack', description: l10n.t('Fallback shader'), snippet: 'FallBack "${1:Diffuse}"', category: l10n.t('Tags') },
    { name: 'CustomEditor', description: l10n.t('Custom editor'), snippet: 'CustomEditor "${1:MyShaderEditor}"', category: l10n.t('Tags') },
    { name: 'UsePass', description: l10n.t('Use a pass from another shader'), snippet: 'UsePass "${1:Legacy Shaders/VertexLit/SHADOWCASTER}"', category: l10n.t('Tags') },
    { name: 'GrabPass', description: l10n.t('Grab screen contents'), snippet: 'GrabPass { "${1:_GrabTexture}" }', category: l10n.t('Tags') },
];

// ============================================================================
// ShaderLab 属性类型
// ============================================================================

export interface ShaderLabPropertyType {
    name: string;
    description: string;
    defaultValue: string;
    example: string;
}

export const shaderLabPropertyTypes: ShaderLabPropertyType[] = [
    { name: '2D', description: l10n.t('2D texture'), defaultValue: '"white" {}', example: '_MainTex ("Texture", 2D) = "white" {}' },
    { name: '3D', description: l10n.t('3D texture'), defaultValue: '"" {}', example: '_Volume ("Volume", 3D) = "" {}' },
    { name: 'Cube', description: l10n.t('Cube map'), defaultValue: '"_Skybox" {}', example: '_Cube ("Cubemap", Cube) = "_Skybox" {}' },
    { name: 'CubeArray', description: l10n.t('Cube map array'), defaultValue: '"" {}', example: '_CubeArray ("Cube Array", CubeArray) = "" {}' },
    { name: '2DArray', description: l10n.t('2D texture array'), defaultValue: '"" {}', example: '_TexArray ("Texture Array", 2DArray) = "" {}' },
    { name: 'Color', description: l10n.t('Color'), defaultValue: '(1,1,1,1)', example: '_Color ("Color", Color) = (1,1,1,1)' },
    { name: 'Vector', description: l10n.t('Vector'), defaultValue: '(0,0,0,0)', example: '_Vector ("Vector", Vector) = (0,0,0,0)' },
    { name: 'Float', description: l10n.t('Floating-point number'), defaultValue: '1.0', example: '_Float ("Float", Float) = 1.0' },
    { name: 'Int', description: l10n.t('Integer'), defaultValue: '1', example: '_Int ("Int", Int) = 1' },
    { name: 'Integer', description: l10n.t('Integer (new syntax)'), defaultValue: '1', example: '_Integer ("Integer", Integer) = 1' },
    { name: 'Range', description: l10n.t('Range slider'), defaultValue: '0.5', example: '_Range ("Range", Range(0, 1)) = 0.5' },
];

// ============================================================================
// Pragma 指令
// ============================================================================

export interface PragmaDirective {
    name: string;
    description: string;
    example: string;
}

export const pragmaDirectives: PragmaDirective[] = [
    { name: '#pragma vertex', description: l10n.t('Specify the vertex shader function'), example: '#pragma vertex vert' },
    { name: '#pragma fragment', description: l10n.t('Specify the fragment shader function'), example: '#pragma fragment frag' },
    { name: '#pragma geometry', description: l10n.t('Specify the geometry shader function'), example: '#pragma geometry geom' },
    { name: '#pragma hull', description: l10n.t('Specify the hull shader function'), example: '#pragma hull hull' },
    { name: '#pragma domain', description: l10n.t('Specify the domain shader function'), example: '#pragma domain domain' },
    { name: '#pragma surface', description: l10n.t('Specify the surface shader function'), example: '#pragma surface surf Standard fullforwardshadows' },
    { name: '#pragma target', description: l10n.t('Specify the shader target level'), example: '#pragma target 3.0' },
    { name: '#pragma multi_compile', description: l10n.t('Multi-compile variants (global)'), example: '#pragma multi_compile _ _KEYWORD_ON' },
    { name: '#pragma multi_compile_local', description: l10n.t('Multi-compile variants (local)'), example: '#pragma multi_compile_local _ _KEYWORD_ON' },
    { name: '#pragma shader_feature', description: l10n.t('Shader features (global)'), example: '#pragma shader_feature _NORMALMAP' },
    { name: '#pragma shader_feature_local', description: l10n.t('Shader features (local)'), example: '#pragma shader_feature_local _NORMALMAP' },
    { name: '#pragma multi_compile_fog', description: l10n.t('Fog variants'), example: '#pragma multi_compile_fog' },
    { name: '#pragma multi_compile_instancing', description: l10n.t('GPU instancing variants'), example: '#pragma multi_compile_instancing' },
    { name: '#pragma multi_compile_shadowcaster', description: l10n.t('Shadow caster variants'), example: '#pragma multi_compile_shadowcaster' },
    { name: '#pragma multi_compile_fwdbase', description: l10n.t('Forward base lighting variants'), example: '#pragma multi_compile_fwdbase' },
    { name: '#pragma multi_compile_fwdadd', description: l10n.t('Forward additive lighting variants'), example: '#pragma multi_compile_fwdadd' },
    { name: '#pragma multi_compile_fwdadd_fullshadows', description: l10n.t('Forward additive lighting variants (with shadows)'), example: '#pragma multi_compile_fwdadd_fullshadows' },
    { name: '#pragma only_renderers', description: l10n.t('Restrict renderers'), example: '#pragma only_renderers d3d11 vulkan metal' },
    { name: '#pragma exclude_renderers', description: l10n.t('Exclude renderers'), example: '#pragma exclude_renderers gles' },
    { name: '#pragma enable_d3d11_debug_symbols', description: l10n.t('Enable D3D11 debug symbols'), example: '#pragma enable_d3d11_debug_symbols' },
    { name: '#pragma instancing_options', description: l10n.t('GPU instancing options'), example: '#pragma instancing_options assumeuniformscaling' },
];

// ============================================================================
// 辅助函数：生成 CompletionItem
// ============================================================================

export function createVariableCompletionItem(v: UnityVariable): CompletionItem {
    const item = new CompletionItem(v.name, CompletionItemKind.Variable);
    item.detail = `(${v.category}) ${v.type}`;
    item.documentation = new MarkdownString(l10n.t('**{0}**\n\n{1}\n\n- **Type**: `{2}`\n- **Category**: {3}', v.name, v.description, v.type, v.category));
    return item;
}

export function createFunctionCompletionItem(f: UnityFunction): CompletionItem {
    const item = new CompletionItem(f.name, CompletionItemKind.Function);
    item.detail = f.signature;
    const paramDocs = f.parameters.map(p => `- \`${p.type}\` **${p.name}**: ${p.description}`).join('\n');
    item.documentation = new MarkdownString(l10n.t('**{0}**\n\n{1}\n\n**Parameters**:\n{2}\n\n**Returns**: `{3}`', f.name, f.description, paramDocs || l10n.t('None'), f.returnType));
    item.insertText = f.name;
    return item;
}

export function createMacroCompletionItem(m: UnityMacro): CompletionItem {
    const item = new CompletionItem(m.name, CompletionItemKind.Constant);
    item.detail = `(${m.category}) Macro`;
    const usageText = m.usage ? l10n.t('\n\n**Usage**: `{0}`', m.usage) : '';
    item.documentation = new MarkdownString(`**${m.name}**\n\n${m.description}${usageText}`);
    return item;
}

export function createKeywordCompletionItem(k: ShaderLabKeyword): CompletionItem {
    const item = new CompletionItem(k.name, CompletionItemKind.Keyword);
    item.detail = `(ShaderLab) ${k.category}`;
    item.documentation = new MarkdownString(`**${k.name}**\n\n${k.description}`);
    if (k.snippet) {
        item.insertText = k.snippet;
    }
    return item;
}
