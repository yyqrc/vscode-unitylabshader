import * as vscode from 'vscode';
import { EngineDetector, EngineType } from './engineDetector';

// 导出 EngineType 供其他模块使用
export { EngineType };

/**
 * 引擎上下文管理器
 * 管理当前活动文档的引擎类型，并提供状态栏显示和切换功能
 */
export class EngineContextManager {
    private static instance: EngineContextManager;
    private currentEngine: EngineType = EngineType.Unknown;
    private statusBarItem: vscode.StatusBarItem;
    private onEngineChangeEmitter = new vscode.EventEmitter<EngineType>();
    
    /**
     * 引擎类型变化事件
     */
    public readonly onEngineChange = this.onEngineChangeEmitter.event;
    
    private constructor() {
        // 创建状态栏项
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.command = 'unityshader.switchEngine';
        this.statusBarItem.tooltip = 'Click to switch shader engine type';
    }
    
    /**
     * 获取单例实例
     */
    public static getInstance(): EngineContextManager {
        if (!EngineContextManager.instance) {
            EngineContextManager.instance = new EngineContextManager();
        }
        return EngineContextManager.instance;
    }
    
    /**
     * 初始化上下文管理器
     */
    public initialize(context: vscode.ExtensionContext): void {
        // 注册状态栏项
        context.subscriptions.push(this.statusBarItem);
        
        // 注册切换引擎命令
        context.subscriptions.push(
            vscode.commands.registerCommand('unityshader.switchEngine', () => {
                this.showEngineQuickPick();
            })
        );
        
        // 监听活动编辑器变化
        context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor(editor => {
                this.updateContext(editor);
            })
        );
        
        // 监听配置变化
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('unityshader.engineType')) {
                    this.updateContext(vscode.window.activeTextEditor);
                }
            })
        );
        
        // 初始化当前编辑器
        this.updateContext(vscode.window.activeTextEditor);
    }
    
    /**
     * 更新上下文
     */
    private updateContext(editor: vscode.TextEditor | undefined): void {
        if (!editor) {
            this.statusBarItem.hide();
            this.currentEngine = EngineType.Unknown;
            return;
        }
        
        const document = editor.document;
        
        // 只处理 shader 相关文件
        if (document.languageId !== 'unityshader') {
            this.statusBarItem.hide();
            this.currentEngine = EngineType.Unknown;
            return;
        }
        
        // 检测引擎类型
        const newEngine = EngineDetector.detectEngine(document);
        
        // 如果引擎类型发生变化，触发事件
        if (newEngine !== this.currentEngine) {
            this.currentEngine = newEngine;
            this.onEngineChangeEmitter.fire(newEngine);
        }
        
        // 更新状态栏
        this.updateStatusBar();
    }
    
    /**
     * 更新状态栏显示
     */
    private updateStatusBar(): void {
        if (this.currentEngine === EngineType.Unknown) {
            this.statusBarItem.hide();
            return;
        }
        
        const displayName = EngineDetector.getEngineDisplayName(this.currentEngine);
        // Unity: 使用游戏手柄图标 $(game)
        // Unreal: 使用齿轮图标 $(settings-gear)
        const icon = this.currentEngine === EngineType.Unity ? '$(game)' : '$(settings-gear)';
        
        this.statusBarItem.text = `${icon} ${displayName}`;
        this.statusBarItem.show();
    }
    
    /**
     * 显示引擎选择快速选择器
     */
    private async showEngineQuickPick(): Promise<void> {
        const items: vscode.QuickPickItem[] = [
            {
                label: '$(symbol-misc) Auto Detect',
                description: 'Automatically detect engine type',
                detail: 'Detect based on file path, extension and content'
            },
            {
                label: '$(game) Unity',
                description: 'Force Unity Engine mode',
                detail: 'Show Unity-specific functions and variables'
            },
            {
                label: '$(settings-gear) Unreal',
                description: 'Force Unreal Engine mode',
                detail: 'Show Unreal-specific functions and variables'
            }
        ];
        
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select shader engine type'
        });
        
        if (!selected) {
            return;
        }
        
        let engineType: string;
        if (selected.label.includes('Auto')) {
            engineType = 'auto';
        } else if (selected.label.includes('Unity')) {
            engineType = 'unity';
        } else {
            engineType = 'unreal';
        }
        
        // 更新配置
        const config = vscode.workspace.getConfiguration('unityshader');
        await config.update('engineType', engineType, vscode.ConfigurationTarget.Global);
        
        // 立即更新上下文
        this.updateContext(vscode.window.activeTextEditor);
    }
    
    /**
     * 获取当前引擎类型
     */
    public getCurrentEngine(): EngineType {
        return this.currentEngine;
    }
    
    /**
     * 检查是否为 Unity 模式
     */
    public isUnityMode(): boolean {
        return this.currentEngine === EngineType.Unity;
    }
    
    /**
     * 检查是否为 Unreal 模式
     */
    public isUnrealMode(): boolean {
        return this.currentEngine === EngineType.Unreal;
    }
    
    /**
     * 释放资源
     */
    public dispose(): void {
        this.statusBarItem.dispose();
        this.onEngineChangeEmitter.dispose();
    }
}
