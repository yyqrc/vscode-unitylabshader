// Small Shader Test File (~200 lines)
// 用于性能基准测试

// 常量定义
#define MAX_LIGHTS 4
#define PI 3.14159265359
#define EPSILON 0.0001

// 结构体定义
struct VertexInput {
    float4 position : POSITION;
    float3 normal : NORMAL;
    float2 uv : TEXCOORD0;
    float4 tangent : TANGENT;
};

struct VertexOutput {
    float4 position : SV_POSITION;
    float3 worldPos : TEXCOORD0;
    float3 normal : TEXCOORD1;
    float2 uv : TEXCOORD2;
    float3 tangent : TEXCOORD3;
    float3 bitangent : TEXCOORD4;
};

struct Light {
    float3 position;
    float3 color;
    float intensity;
    float range;
};

// 全局变量
float4x4 _WorldMatrix;
float4x4 _ViewMatrix;
float4x4 _ProjectionMatrix;
float4x4 _MVP;

// 材质属性
float4 _BaseColor;
sampler2D _MainTex;
sampler2D _NormalMap;
sampler2D _MetallicMap;
sampler2D _RoughnessMap;

float _Metallic;
float _Roughness;
float _AO;

// 光照属性
Light _Lights[MAX_LIGHTS];
int _LightCount;
float3 _AmbientColor;

// 工具函数
float3 UnpackNormal(float4 packedNormal) {
    float3 normal;
    normal.xy = packedNormal.xy * 2.0 - 1.0;
    normal.z = sqrt(1.0 - saturate(dot(normal.xy, normal.xy)));
    return normal;
}

float3 FresnelSchlick(float cosTheta, float3 F0) {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

float DistributionGGX(float3 N, float3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;
    
    float nom = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;
    
    return nom / max(denom, EPSILON);
}

float GeometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;
    
    float nom = NdotV;
    float denom = NdotV * (1.0 - k) + k;
    
    return nom / max(denom, EPSILON);
}

float GeometrySmith(float3 N, float3 V, float3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);
    
    return ggx1 * ggx2;
}

float3 CalculatePBRLighting(float3 N, float3 V, float3 L, float3 albedo, 
                            float metallic, float roughness, float3 lightColor) {
    float3 H = normalize(V + L);
    
    // Cook-Torrance BRDF
    float3 F0 = float3(0.04, 0.04, 0.04);
    F0 = lerp(F0, albedo, metallic);
    
    float3 F = FresnelSchlick(max(dot(H, V), 0.0), F0);
    float NDF = DistributionGGX(N, H, roughness);
    float G = GeometrySmith(N, V, L, roughness);
    
    float3 numerator = NDF * G * F;
    float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0);
    float3 specular = numerator / max(denominator, EPSILON);
    
    float3 kS = F;
    float3 kD = float3(1.0, 1.0, 1.0) - kS;
    kD *= 1.0 - metallic;
    
    float NdotL = max(dot(N, L), 0.0);
    return (kD * albedo / PI + specular) * lightColor * NdotL;
}

// 顶点着色器
VertexOutput VertexShader(VertexInput input) {
    VertexOutput output;
    
    // 变换位置
    output.position = mul(_MVP, input.position);
    output.worldPos = mul(_WorldMatrix, input.position).xyz;
    
    // 变换法线
    output.normal = normalize(mul((float3x3)_WorldMatrix, input.normal));
    
    // 计算切线空间
    output.tangent = normalize(mul((float3x3)_WorldMatrix, input.tangent.xyz));
    output.bitangent = cross(output.normal, output.tangent) * input.tangent.w;
    
    // 传递 UV
    output.uv = input.uv;
    
    return output;
}

// 片段着色器
float4 FragmentShader(VertexOutput input) : SV_Target {
    // 采样纹理
    float4 albedoSample = tex2D(_MainTex, input.uv);
    float3 albedo = albedoSample.rgb * _BaseColor.rgb;
    
    // 采样法线贴图
    float3 tangentNormal = UnpackNormal(tex2D(_NormalMap, input.uv));
    float3x3 TBN = float3x3(input.tangent, input.bitangent, input.normal);
    float3 N = normalize(mul(tangentNormal, TBN));
    
    // 采样材质属性
    float metallic = tex2D(_MetallicMap, input.uv).r * _Metallic;
    float roughness = tex2D(_RoughnessMap, input.uv).r * _Roughness;
    
    // 计算视线方向
    float3 V = normalize(_WorldSpaceCameraPos - input.worldPos);
    
    // 累积光照
    float3 Lo = float3(0.0, 0.0, 0.0);
    
    for (int i = 0; i < _LightCount; ++i) {
        Light light = _Lights[i];
        
        // 计算光照方向和衰减
        float3 L = light.position - input.worldPos;
        float distance = length(L);
        L = normalize(L);
        
        float attenuation = 1.0 / (distance * distance);
        attenuation *= saturate(1.0 - (distance / light.range));
        
        float3 radiance = light.color * light.intensity * attenuation;
        
        // 计算 PBR 光照
        Lo += CalculatePBRLighting(N, V, L, albedo, metallic, roughness, radiance);
    }
    
    // 添加环境光
    float3 ambient = _AmbientColor * albedo * _AO;
    float3 color = ambient + Lo;
    
    // HDR 色调映射
    color = color / (color + float3(1.0, 1.0, 1.0));
    
    // Gamma 校正
    color = pow(color, float3(1.0/2.2, 1.0/2.2, 1.0/2.2));
    
    return float4(color, albedoSample.a);
}
