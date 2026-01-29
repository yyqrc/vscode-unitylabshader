import { Position, TextDocument } from 'vscode';
import { isInCommentOrStringAtOffset } from './commentMask';

export function isInCommentOrString(document: TextDocument, position: Position): boolean {
    // 通过状态机扫描到 offset，避免 lastIndexOf 的误判（例如行注释/字符串里包含 "/*"）
    const offset = document.offsetAt(position);
    return isInCommentOrStringAtOffset(document.getText(), offset);
}
