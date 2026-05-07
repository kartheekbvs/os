/**
 * Shell Tokenizer (Lexical Analyzer)
 * 
 * Handles:
 * - Single and Double Quotes
 * - Escape characters (\)
 * - Shell Operators (|, >, >>, <, &&, ||, ;, &, (, ))
 * - Variable expansion detection
 */

export class Tokenizer {
  constructor(input) {
    this.input = input.trim();
    this.pos = 0;
    this.tokens = [];
  }

  tokenize() {
    while (this.pos < this.input.length) {
      const char = this.input[this.pos];

      if (this.isWhitespace(char)) {
        this.pos++;
        continue;
      }

      if (this.isOperatorChar(char)) {
        this.tokens.push(this.readOperator());
        continue;
      }

      this.tokens.push(this.readWord());
    }
    return this.tokens;
  }

  isWhitespace(char) {
    return /\s/.test(char);
  }

  isOperatorChar(char) {
    return /[|&;><()]/.test(char);
  }

  readOperator() {
    let char = this.input[this.pos];
    let next = this.input[this.pos + 1];

    // Check for double-char operators
    const doubleOps = ['&&', '||', '>>', '<<', '2>', '&>'];
    const op2 = char + next;

    if (doubleOps.includes(op2)) {
      this.pos += 2;
      return { type: 'OPERATOR', value: op2 };
    }

    // Special case for 2>
    if (char === '2' && next === '>') {
        this.pos += 2;
        return { type: 'OPERATOR', value: '2>' };
    }

    this.pos++;
    return { type: 'OPERATOR', value: char };
  }

  readWord() {
    let word = '';
    let inSingle = false;
    let inDouble = false;
    let escaped = false;

    while (this.pos < this.input.length) {
      const char = this.input[this.pos];

      if (escaped) {
        word += char;
        escaped = false;
        this.pos++;
        continue;
      }

      if (char === '\\' && !inSingle) {
        escaped = true;
        this.pos++;
        continue;
      }

      if (char === "'" && !inDouble) {
        inSingle = !inSingle;
        this.pos++;
        continue;
      }

      if (char === '"' && !inSingle) {
        inDouble = !inDouble;
        this.pos++;
        continue;
      }

      if (!inSingle && !inDouble && (this.isWhitespace(char) || this.isOperatorChar(char))) {
        break;
      }

      word += char;
      this.pos++;
    }

    return { type: 'WORD', value: word };
  }
}
