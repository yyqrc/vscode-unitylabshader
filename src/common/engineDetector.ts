import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 引擎类型枚举
 */
export enum EngineType {
    Unity = 'unity',
    Unreal = 'unreal',
    Unknown = 'unknown'
}

/**
 * 引擎检测器
 * 根据文件路径、文件扩展名和文件内容自动检测引擎类型
 */
export class EngineDetector {
    
    /**
     * Unity 特有的文件扩展名
     */
    private static readonly UNITY_EXTENSIONS = ['.shader', '.cginc', '.compute', '.cg'];
    
    /**
     * Unreal 特有的文件扩展名
     */
    private static readonly UNREAL_EXTENSIONS = ['.usf', '.ush'];
    
    /**
     * 通用的文件扩展名（需要进一步检测）
     */
    private static readonly COMMON_EXTENSIONS = ['.hlsl', '.hlsli'];
    
    /**
     * Unity 特有的关键字（用于内容检测）
     */
    private static readonly UNITY_KEYWORDS = [
        'Shader "',
        'SubShader',
        'CGPROGRAM',
        'ENDCG',
        'HLSLPROGRAM',
        'ENDHLSL',
        'UnityObjectToClipPos',
        'UnityObjectToWorldNormal',
        'UNITY_MATRIX_',
        '_Time',
        '_SinTime',
        '_CosTime',
        'unity_',
        'UNITY_'
    ];
    
    /**
     * Unreal 特有的关键字（用于内容检测）
     */
    private static readonly UNREAL_KEYWORDS = [
        'MaterialFloat',
        'MaterialFloat2',
        'MaterialFloat3',
        'MaterialFloat4',
        'Texture2DSample',
        'TextureCubeSample',
        'Parameters.',
        'View.',
        'ResolvedView.',
        'GetMaterialEmissive',
        'GetMaterialBaseColor',
        'MATERIAL_',
        'ENGINE_',
        '/Engine/Private/',
        '/Engine/Public/'
    ];
    
    /**
     * Unity 项目的标识文件/目录
     */
    private static readonly UNITY_PROJECT_MARKERS = [
        'Assets',
        'ProjectSettings',
        'Library',
        'Packages/manifest.json'
    ];
    
    /**
     * Unreal 项目的标识文件/目录
     */
    private static readonly UNREAL_PROJECT_MARKERS = [
        'Engine/Shaders',
        'Engine/Source',
        'Content',
        '.uproject'
    ];
    
    /**
     * 检测文件的引擎类型
     * @param document 文档对象
     * @returns 引擎类型
     */
    public static detectEngine(document: vscode.TextDocument): EngineType {
        const filePath = document.uri.fsPath;
        const ext = path.extname(filePath).toLowerCase();
        
        // 1. 首先检查用户配置
        const config = vscode.workspace.getConfiguration('unityshader');
        const engineType = config.get<string>('engineType', 'auto');
        
        if (engineType === 'unity') {
            return EngineType.Unity;
        } else if (engineType === 'unreal') {
            return EngineType.Unreal;
        }
        
        // 2. 根据文件扩展名判断
        if (this.UNITY_EXTENSIONS.includes(ext)) {
            return EngineType.Unity;
        }
        
        if (this.UNREAL_EXTENSIONS.includes(ext)) {
            return EngineType.Unreal;
        }
        
        // 3. 对于通用扩展名（.hlsl, .hlsli），需要进一步检测
        if (this.COMMON_EXTENSIONS.includes(ext)) {
            // 3.1 检查文件路径
            const pathEngine = this.detectByPath(filePath);
            if (pathEngine !== EngineType.Unknown) {
                return pathEngine;
            }
            
            // 3.2 检查文件内容
            const contentEngine = this.detectByContent(document.getText());
            if (contentEngine !== EngineType.Unknown) {
                return contentEngine;
            }
            
            // 3.3 检查项目结构
            const projectEngine = this.detectByProjectStructure(filePath);
            if (projectEngine !== EngineType.Unknown) {
                return projectEngine;
            }
        }
        
        return EngineType.Unknown;
    }
    
    /**
     * 根据文件路径检测引擎类型
     */
    private static detectByPath(filePath: string): EngineType {
        const normalizedPath = filePath.replace(/\\/g, '/');
        
        // 检查是否包含 Unity 特征路径
        if (normalizedPath.includes('/Assets/') || 
            normalizedPath.includes('/Packages/') ||
            normalizedPath.includes('/Library/')) {
            return EngineType.Unity;
        }
        
        // 检查是否包含 Unreal 特征路径
        if (normalizedPath.includes('/Engine/Shaders/') ||
            normalizedPath.includes('/Engine/Source/') ||
            normalizedPath.includes('/Shaders/Private/') ||
            normalizedPath.includes('/Shaders/Public/')) {
            return EngineType.Unreal;
        }
        
        return EngineType.Unknown;
    }
    
    /**
     * 根据文件内容检测引擎类型
     */
    private static detectByContent(content: string): EngineType {
        // 只检查前 1000 行或前 50KB 内容
        const sampleContent = content.substring(0, Math.min(content.length, 50000));
        
        let unityScore = 0;
        let unrealScore = 0;
        
        // 统计 Unity 关键字出现次数
        for (const keyword of this.UNITY_KEYWORDS) {
            if (sampleContent.includes(keyword)) {
                unityScore++;
            }
        }
        
        // 统计 Unreal 关键字出现次数
        for (const keyword of this.UNREAL_KEYWORDS) {
            if (sampleContent.includes(keyword)) {
                unrealScore++;
            }
        }
        
        // 根据得分判断
        if (unityScore > unrealScore && unityScore >= 2) {
            return EngineType.Unity;
        } else if (unrealScore > unityScore && unrealScore >= 2) {
            return EngineType.Unreal;
        }
        
        return EngineType.Unknown;
    }
    
    /**
     * 根据项目结构检测引擎类型
     */
    private static detectByProjectStructure(filePath: string): EngineType {
        let currentDir = path.dirname(filePath);
        const maxDepth = 10; // 最多向上查找 10 层
        
        for (let i = 0; i < maxDepth; i++) {
            // 检查 Unity 项目标识
            for (const marker of this.UNITY_PROJECT_MARKERS) {
                const markerPath = path.join(currentDir, marker);
                if (fs.existsSync(markerPath)) {
                    return EngineType.Unity;
                }
            }
            
            // 检查 Unreal 项目标识
            for (const marker of this.UNREAL_PROJECT_MARKERS) {
                const markerPath = path.join(currentDir, marker);
                if (fs.existsSync(markerPath)) {
                    return EngineType.Unreal;
                }
            }
            
            // 向上一级目录
            const parentDir = path.dirname(currentDir);
            if (parentDir === currentDir) {
                break; // 已到达根目录
            }
            currentDir = parentDir;
        }
        
        return EngineType.Unknown;
    }
    
    /**
     * 获取引擎类型的显示名称
     */
    public static getEngineDisplayName(engineType: EngineType): string {
        switch (engineType) {
            case EngineType.Unity:
                return 'Unity';
            case EngineType.Unreal:
                return 'Unreal';
            default:
                return 'Unknown';
        }
    }
}
