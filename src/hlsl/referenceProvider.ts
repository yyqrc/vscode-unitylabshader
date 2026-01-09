
import { ReferenceProvider, CancellationToken, TextDocument, Position, Location, ReferenceContext, SymbolInformation, commands, workspace } from 'vscode';
import * as vscode from 'vscode';

export default class HLSLReferenceProvider implements ReferenceProvider {

    public provideReferences(document: TextDocument, position: Position, context: ReferenceContext, token: CancellationToken): Thenable<Location[]>{
    // public provideReferences(document: TextDocument, position: Position, options: { includeDeclaration: boolean }, token: CancellationToken): Thenable<Location[]> {
        
        return new Promise<Location[]>( async (resolve, reject) => {
            let results: Location[] = [];

            let enable = workspace.getConfiguration('unityshader').get<boolean>('suggest.basic', true);
            let wordRange = document.getWordRangeAtPosition(position);
            if (enable && wordRange) 
            {
                let name = document.getText(wordRange);

                const text = document.getText();
                
                const regex = new RegExp(`\\b${name}\\b`, 'gm');
                let match: RegExpExecArray;
                while (match = regex.exec(text) as RegExpExecArray) {
                    let refPosition = document.positionAt(match.index);
                    let range = document.getWordRangeAtPosition(refPosition);
                    if (range !== undefined)
                    {
                        results.push(new Location(document.uri, range));
                    }
                }
                

                // 获取所在行的内容
                const lineText = document.lineAt(position).text;

                // 判断是个宏
                let reuslt = lineText.match(/^\s*(?:#define|#if|#elif)\s+!*([a-zA-Z_\x7f-\xff][a-zA-Z0-9:_\x7f-\xff]*)\s*/);
                
                if (reuslt && reuslt.length > 0) {

                    let query = `:m ${/^\s*(?:#define|#if|#elif)\s+!*(marcoName)\s*/.source}`.replace('marcoName', name);
                    let symbols = await commands.executeCommand<SymbolInformation[]>('vscode.executeWorkspaceSymbolProvider', query);
                    symbols.filter(s => (s.name === name && s.location.uri.toString() !== document.uri.toString())).forEach(symbol => {
                        results.push(symbol.location);
                    });

                } else {

                    // 查找函数调用匹配
                    let query = `:f ${/^\s*(?:\w+\s*\.)?(functionName)\s*\(/.source}`.replace('functionName', name);
                    let symbols = await commands.executeCommand<SymbolInformation[]>('vscode.executeWorkspaceSymbolProvider', query);
                    symbols.filter(s => (s.name === name && s.location.uri.toString() !== document.uri.toString())).forEach(symbol => {
                        results.push(symbol.location);
                    });

                }

                // // 判断是个函数定义 则查找引用信息
                // reuslt = lineText.match(/^\w+\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9:_\x7f-\xff]*)\s*\(/);
                // if (reuslt && reuslt.length > 0)
                // {
                //     // 查找函数调用匹配
                //     let query = `:${/(?:\w+\s*\.)?functionName\s*\(/.source}`.replace('functionName', name);
                //     let symbols = await commands.executeCommand<SymbolInformation[]>('vscode.executeWorkspaceSymbolProvider', query);
                //     symbols.filter(s => (s.name === name && s.location.uri.toString() !== document.uri.toString()) ).forEach(symbol => {
                //         results.push(symbol.location);
                // });
                // }
                
            }

            resolve(results);
        });
    }
}
