export function maskCommentsPreserveLayout(content: string): string {
    const chars = content.split('');

    let inLineComment = false;
    let inBlockComment = false;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let escaped = false;

    for (let i = 0; i < chars.length; i++) {
        const ch = content[i];
        const next = i + 1 < content.length ? content[i + 1] : '';

        if (inLineComment) {
            if (ch === '\n') {
                inLineComment = false;
                continue;
            }
            if (ch !== '\r') {
                chars[i] = ' ';
            }
            continue;
        }

        if (inBlockComment) {
            if (ch === '*' && next === '/') {
                chars[i] = ' ';
                chars[i + 1] = ' ';
                inBlockComment = false;
                i++;
                continue;
            }
            if (ch !== '\n' && ch !== '\r') {
                chars[i] = ' ';
            }
            continue;
        }

        if (inSingleQuote) {
            if (escaped) {
                escaped = false;
                continue;
            }
            if (ch === '\\') {
                escaped = true;
                continue;
            }
            if (ch === '\'') {
                inSingleQuote = false;
            }
            continue;
        }

        if (inDoubleQuote) {
            if (escaped) {
                escaped = false;
                continue;
            }
            if (ch === '\\') {
                escaped = true;
                continue;
            }
            if (ch === '"') {
                inDoubleQuote = false;
            }
            continue;
        }

        // normal state
        if (ch === '/' && next === '/') {
            chars[i] = ' ';
            chars[i + 1] = ' ';
            inLineComment = true;
            i++;
            continue;
        }
        if (ch === '/' && next === '*') {
            chars[i] = ' ';
            chars[i + 1] = ' ';
            inBlockComment = true;
            i++;
            continue;
        }
        if (ch === '\'') {
            inSingleQuote = true;
            continue;
        }
        if (ch === '"') {
            inDoubleQuote = true;
            continue;
        }
    }

    return chars.join('');
}

export function isInCommentOrStringAtOffset(content: string, offset: number): boolean {
    const end = Math.max(0, Math.min(offset, content.length));

    let inLineComment = false;
    let inBlockComment = false;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let escaped = false;

    for (let i = 0; i < end; i++) {
        const ch = content[i];
        const next = i + 1 < end ? content[i + 1] : '';

        if (inLineComment) {
            if (ch === '\n') {
                inLineComment = false;
            }
            continue;
        }

        if (inBlockComment) {
            if (ch === '*' && next === '/') {
                inBlockComment = false;
                i++;
            }
            continue;
        }

        if (inSingleQuote) {
            if (escaped) {
                escaped = false;
                continue;
            }
            if (ch === '\\') {
                escaped = true;
                continue;
            }
            if (ch === '\'') {
                inSingleQuote = false;
            }
            continue;
        }

        if (inDoubleQuote) {
            if (escaped) {
                escaped = false;
                continue;
            }
            if (ch === '\\') {
                escaped = true;
                continue;
            }
            if (ch === '"') {
                inDoubleQuote = false;
            }
            continue;
        }

        // normal state
        if (ch === '/' && next === '/') {
            inLineComment = true;
            i++;
            continue;
        }
        if (ch === '/' && next === '*') {
            inBlockComment = true;
            i++;
            continue;
        }
        if (ch === '\'') {
            inSingleQuote = true;
            continue;
        }
        if (ch === '"') {
            inDoubleQuote = true;
            continue;
        }
    }

    return inLineComment || inBlockComment || inSingleQuote || inDoubleQuote;
}
