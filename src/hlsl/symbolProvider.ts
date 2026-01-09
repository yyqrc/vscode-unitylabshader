'use strict';

import { DocumentSymbolProvider, WorkspaceSymbolProvider, SymbolKind, SymbolInformation, CancellationToken, TextDocument, Position, Range, Location, Uri, Disposable, window, workspace, extensions } from 'vscode';
import { hlslExtensions } from '../common';
import { execSync } from 'child_process';
import { join } from 'path';

import { rgPath } from '@vscode/ripgrep';

interface ISymbolPattern { kind: SymbolKind, pattern: string }

const searchPatterns: ISymbolPattern[] = [
    { kind: SymbolKind.Function, pattern: /^\w+\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9:_\x7f-\xff]*)\s*\(/.source },
    { kind: SymbolKind.Struct, pattern: /^(?:struct|cbuffer|tbuffer)\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9:_\x7f-\xff]*)/.source },
    { kind: SymbolKind.Variable, pattern: /^(?:sampler|sampler1D|sampler2D|sampler3D|samplerCUBE|samplerRECT|sampler_state|SamplerState)\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9:_\x7f-\xff]*)/.source },
    { kind: SymbolKind.Field, pattern: /^(?:texture|texture2D|textureCUBE|Texture1D|Texture1DArray|Texture2D|Texture2DArray|Texture2DMS|Texture2DMSArray|Texture3D|TextureCube|TextureCubeArray|RWTexture1D|RWTexture1DArray|RWTexture2D|RWTexture2DArray|RWTexture3D)(?:\s*<(?:[a-zA-Z_\x7f-\xff][a-zA-Z0-9,_\x7f-\xff]*)>)?\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9\[\]_\x7f-\xff]*)/.source },
    { kind: SymbolKind.Field, pattern: /^(?:AppendStructuredBuffer|Buffer|ByteAddressBuffer|ConsumeStructuredBuffer|RWBuffer|RWByteAddressBuffer|RWStructuredBuffer|StructuredBuffer)(?:\s*<(?:[a-zA-Z_\x7f-\xff][a-zA-Z0-9,_\x7f-\xff]*)>)?\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9\[\]_\x7f-\xff]*)/.source },
];


const wsSearchPatterns: ISymbolPattern[] = [
    { kind: SymbolKind.Function, pattern: /^\w+\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9:_\x7f-\xff]*)\s*\(/.source },
    { kind: SymbolKind.Struct, pattern: /^(?:struct|cbuffer|tbuffer)\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9:_\x7f-\xff]*)/.source }
];

export interface ISymbolCache { [path: string]: SymbolInformation[]; }

export default class HLSLDocumentSymbolProvider implements DocumentSymbolProvider, WorkspaceSymbolProvider {

    private _disposables: Disposable[] = [];

    private _hlslPattern = ['.hlsl','.hlsli','.fx','.fxh','.vsh','.psh','.cginc','.compute', '.ush', '.usf'];
    
    constructor() {
        const extention = extensions.getExtension('vscode.hlsl');
        if (extention && extention.packageJSON 
            && extention.packageJSON.contributes
            && extention.packageJSON.contributes.languages) {
            let hlsllang: any[] = extention.packageJSON.contributes.languages.filter((l: { id: string; }) => l.id === 'hlsl');
            if (hlsllang.length && hlsllang[0].extensions) {
                this._hlslPattern = this._hlslPattern.concat(hlsllang[0].extensions.slice());
            }
        }

        this._hlslPattern = this._hlslPattern.concat(hlslExtensions);
        
        // Keep only unique entries
        this._hlslPattern = [...new Set(this._hlslPattern)];
    }

    public dispose(){
        if (this._disposables.length > 0) {
            this._disposables.forEach(d => d.dispose());
            this._disposables = [];
        }
    }

    private getDocumentSymbols(uri: Uri): Promise<SymbolInformation[]> {
        return new Promise<SymbolInformation[]>((resolve, reject) => {
            let result: SymbolInformation[] = [];

            let document: TextDocument | null = null;
            for (let d of workspace.textDocuments) {
                if (d.uri.toString() === uri.toString()) {
                    document = d;
                    break;
                }
            }

            if (document === null) {
                resolve([]);
                return;
            }

            let text = document.getText();

            function fetchSymbol(entry: ISymbolPattern) {
                const kind = entry.kind;
                const pattern = entry.pattern;

                if (document === null)
                {
                    return;
                } 
                let regex = new RegExp(pattern, "gm");
                let match: RegExpExecArray | null;

                while (match = regex.exec(text)) 
                {
                    let line = document.positionAt(match.index).line;
                    let range = document.lineAt(line).range;
                    let word = match[1];

                    let lastChar =  kind === SymbolKind.Function ? ')' :
                                    kind === SymbolKind.Struct ? '}' :
                                    kind === SymbolKind.Variable ? ';' :
                                    kind === SymbolKind.Field ? ';' :
                                    '';

                    if (lastChar) {
                        let end = text.indexOf(lastChar, match.index) + 1;
                        range = new Range(range.start, document.positionAt(end));
                    }
                    result.push(new SymbolInformation(word, kind, '', new Location(document.uri, range)));
                }
            }

            for (let entry of searchPatterns) {
                fetchSymbol(entry);
            }

            resolve(result);

        });
    }

    public provideDocumentSymbols(document: TextDocument, token: CancellationToken): Thenable<SymbolInformation[]> {
        // window.showInformationMessage('provideDocumentSymbols');

        return this.getDocumentSymbols(document.uri);
    }

    public provideWorkspaceSymbols(query: string, token: CancellationToken): Thenable<SymbolInformation[]> {

        // window.showInformationMessage('provideWorkspaceSymbols', query);

        return new Promise<SymbolInformation[]>((resolve, reject) => {
            let results: SymbolInformation[] = [];

            if (workspace.workspaceFolders) {
                for (const folder of workspace.workspaceFolders) {

                    const rootPath = folder.uri.fsPath;
                    const execOpts = {
                        cwd: rootPath,
                        maxBuffer: 1024 * 1024
                    };

                    let includePattern = '-g *' + this._hlslPattern.join(' -g *');

                    let currentWsDir = process.cwd();
                    console.log('Current working directory:', currentWsDir);

                    if (query.startsWith(':')) {
                        let searchPattern = query.slice(3, query.length);
                        try {
                            let output = execSync(`"${rgPath}" ${includePattern} -o --case-sensitive -H --line-number --column --hidden -e "${searchPattern}" .`, execOpts);
                            let kind = SymbolKind.Function;
                            if (query[1] === 'm') {
                                kind = SymbolKind.Constant;
                            }

                            let lines = output.toString().split('\n');
                            for (let line of lines) {
                                let lineMatch = /^(?:((?:[a-zA-Z]:)?[^:]*):)?(\d+):(\d):(.+)/.exec(line);
                                if (lineMatch) {
                                    let position: Position = new Position(parseInt(lineMatch[2]) - 1, parseInt(lineMatch[3]) - 1);
                                    let range = new Range(position, position);
                                    let filepath = join(rootPath, lineMatch[1]);
                                    let regex = new RegExp(searchPattern);
                                    let word = '?????';
                                    let symbolMatch = regex.exec(lineMatch[4].toString());
                                    if (symbolMatch) {
                                        word = symbolMatch[1];
                                        position = position.with({ character: symbolMatch[0].indexOf(word) });
                                        range = new Range(position, position.translate(0, word.length));
                                    }

                                    let containerName = `${lineMatch[2]}`;
                                    results.push(new SymbolInformation(word, kind, containerName, new Location(Uri.file(filepath), range)));
                                }
                            }
                        } catch (error:any) {
                            console.error(`Error searching in ${folder.name}:`, error.message);
                        }

                    }

                    for (let entry of wsSearchPatterns) {
                        try {
                            const kind = entry.kind;
                            const searchPattern = entry.pattern;

                            let output = execSync(`"${rgPath}" ${includePattern} -o --case-sensitive -H --line-number --column --hidden -e "${searchPattern}" .`, execOpts);

                            let lines = output.toString().split('\n');
                            for (let line of lines) {
                                let lineMatch = /^(?:((?:[a-zA-Z]:)?[^:]*):)?(\d+):(\d):(.+)/.exec(line);
                                if (lineMatch) {
                                    let position: Position = new Position(parseInt(lineMatch[2]) - 1, parseInt(lineMatch[3]) - 1);
                                    let range = new Range(position, position);
                                    let filepath = join(rootPath, lineMatch[1]);
                                    let regex = new RegExp(searchPattern);
                                    let word = '?????';
                                    let symbolMatch = regex.exec(lineMatch[4].toString());
                                    if (symbolMatch) {
                                        word = symbolMatch[1];
                                        position = position.with({ character: symbolMatch[0].indexOf(word) });
                                        range = new Range(position, position.translate(0, word.length));
                                    }

                                    let containerName = `${lineMatch[2]} : ${lineMatch[4].split(' ')[0]}`;
                                    results.push(new SymbolInformation(word, kind, containerName, new Location(Uri.file(filepath), range)));
                                }
                            }
                        }
                        catch (err: any) {
                            console.error(`Error searching in ${folder.name}:`, err.message);
                        }
                    }
                }

            }

            resolve(results);
        });

    }

}
