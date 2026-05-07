/**
 * Shell Parser (Syntactic Analyzer)
 * 
 * Generates an AST from tokens.
 * Supports:
 * - Commands with arguments
 * - Pipelines (|)
 * - Logical chains (&&, ||)
 * - Sequential execution (;, \n)
 * - Redirections (>, >>, <, 2>, &>)
 * - Subshells ( (cmd) )
 */

export class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() {
    return this.tokens[this.pos];
  }

  consume() {
    return this.tokens[this.pos++];
  }

  expect(value) {
    const token = this.peek();
    if (!token || token.value !== value) {
      throw new Error(`Syntax Error: Expected '${value}' but found '${token ? token.value : 'EOF'}'`);
    }
    return this.consume();
  }

  parse() {
    if (this.tokens.length === 0) return null;
    return this.parseChain();
  }

  /**
   * Chain: Pipeline { (&& | || | ;) Pipeline }
   */
  parseChain() {
    let node = this.parsePipeline();

    while (this.pos < this.tokens.length) {
      const token = this.peek();
      if (token.type === 'OPERATOR' && ['&&', '||', ';'].includes(token.value)) {
        const op = this.consume().value;
        const right = this.parsePipeline();
        node = {
          type: 'ChainNode',
          operator: op,
          left: node,
          right: right
        };
      } else {
        break;
      }
    }

    return node;
  }

  /**
   * Pipeline: Command { | Command }
   */
  parsePipeline() {
    let node = this.parseCommand();

    while (this.pos < this.tokens.length) {
      const token = this.peek();
      if (token.type === 'OPERATOR' && token.value === '|') {
        this.consume();
        const right = this.parseCommand();
        node = {
          type: 'PipelineNode',
          left: node,
          right: right
        };
      } else {
        break;
      }
    }

    return node;
  }

  /**
   * Command: Subshell | SimpleCommand
   */
  parseCommand() {
    const token = this.peek();
    if (token && token.type === 'OPERATOR' && token.value === '(') {
      return this.parseSubshell();
    }
    return this.parseSimpleCommand();
  }

  /**
   * Subshell: ( Chain ) { Redirection }
   */
  parseSubshell() {
    this.expect('(');
    const body = this.parseChain();
    this.expect(')');
    
    const node = {
      type: 'SubshellNode',
      body: body,
      redirects: []
    };

    // Subshells can have redirects
    while (this.pos < this.tokens.length) {
      const next = this.peek();
      if (next && next.type === 'OPERATOR' && ['>', '>>', '<', '2>', '&>'].includes(next.value)) {
        node.redirects.push(this.parseRedirection());
      } else {
        break;
      }
    }

    return node;
  }

  /**
   * SimpleCommand: { WORD } { Redirection }
   */
  parseSimpleCommand() {
    const args = [];
    const redirects = [];

    while (this.pos < this.tokens.length) {
      const token = this.peek();
      
      if (token.type === 'WORD') {
        args.push(this.consume().value);
      } else if (token.type === 'OPERATOR' && ['>', '>>', '<', '2>', '&>'].includes(token.value)) {
        redirects.push(this.parseRedirection());
      } else {
        break;
      }
    }

    if (args.length === 0 && redirects.length === 0) {
        // Handle case where it might be empty or a token we didn't expect
        const t = this.peek();
        throw new Error(`Syntax Error: Unexpected token '${t ? t.value : 'EOF'}'`);
    }

    return {
      type: 'CommandNode',
      name: args[0],
      args: args.slice(1),
      redirects: redirects
    };
  }

  parseRedirection() {
    const op = this.consume().value;
    const target = this.consume();
    if (!target || target.type !== 'WORD') {
      throw new Error(`Syntax Error: Expected filename after redirection operator '${op}'`);
    }
    return {
      type: 'RedirectNode',
      operator: op,
      file: target.value
    };
  }
}
