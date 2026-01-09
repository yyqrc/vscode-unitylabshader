
import { DefinitionProvider, ImplementationProvider, TypeDefinitionProvider, SymbolInformation, TextDocument, Position, Location, CancellationToken, Definition, workspace, commands } from 'vscode';

export default class HLSLDefinitionProvider implements DefinitionProvider, ImplementationProvider, TypeDefinitionProvider {

    public getDefinitionLocations(document: TextDocument, position: Position): Thenable<Location[]> {
        
        // vscode.window.showInformationMessage('getDefinitionLocations');

        return new Promise<Location[]>(async (resolve, reject) => {
            
            let enable = workspace.getConfiguration('unityshader').get<boolean>('suggest.basic', true);
            if (!enable) {
                reject();
            }
            
            let wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) {
                reject();
            }
            
            let results: Location[] = [];
            
            let name = document.getText(wordRange);
            
            let symbols = await commands.executeCommand<SymbolInformation[]>('vscode.executeWorkspaceSymbolProvider', name);
                symbols.filter(s => (s.name === name) ).forEach(symbol => {
                    results.push(symbol.location);
                });
            
            resolve(results);
        });
    }

    public provideDefinition(document: TextDocument, position: Position, token: CancellationToken | boolean): Thenable<Definition> {
        return this.getDefinitionLocations(document, position);
    }

    public provideImplementation(document: TextDocument, position: Position, token: CancellationToken): Thenable<Definition> {
        return this.getDefinitionLocations(document, position);
    }

    public provideTypeDefinition(document: TextDocument, position: Position, token: CancellationToken): Thenable<Definition> {
        return this.getDefinitionLocations(document, position);
    }
}