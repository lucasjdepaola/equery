import { log } from "./global/console";
import { lex, operators, Token, TokenType } from "./lex";

type NodeType = "Query" | "Property" | "Function" | "BinaryOp" | "Literal" | "OrderBy" | "Program"

interface BaseNode {
    type: NodeType;
}

export interface PropertyNode extends BaseNode {
    type: "Property";
    path: string[]; // reference path
}

export interface FunctionNode extends BaseNode {
    type: "Function";
    name: string;
    arguments: ExpressionNode[];
}

export interface LiteralNode extends BaseNode {
    type: "Literal";
    value: string | number | boolean;
}

interface BinaryOpNode extends BaseNode {
    type: "BinaryOp";
    operator: Operator;
    left: ExpressionNode;
    right: ExpressionNode;
}

interface OrderByNode extends BaseNode {
    type: "OrderBy";
    // expression: ExpressionNode;
    function?: FunctionNode; // this could potentially contain a property
    limit?: number;
    direction: "asc" | "desc";
}

export interface QueryNode extends BaseNode {
    type: "Query";
    scope?: ExpressionNode[];
    conditions?: ExpressionNode; // we have multiple conditions, yet they're contained by &/| as one expression
    orderBy?: OrderByNode;
}

export type ExpressionNode = PropertyNode | FunctionNode | LiteralNode | BinaryOpNode;

const parseFunction = (token: Token): FunctionNode => {
    // we assume the token is a function already checked
    // name(expression, expression, ..., expression)
    const fn: string = token.value;
    const name = fn.slice(0, fn.indexOf("(")); // from the name to the start of the function
    const contents = fn.slice(fn.indexOf("(")+1, fn.lastIndexOf(")")); // get contents of inner parens
    let args = contents.split(","); // split by comma values, unless we use recursion, which we may need
    if(contents.length > 0 && !contents.includes(",")) {
        args = [contents];
    }
    return {
        type: "Function",
        name: name, // fix below
        arguments: args.map((arg) => parseExpression(lex(arg))[0]!)
    }
}
const parseProperty = (token: Token): PropertyNode => {
    const path = token.value.slice(1).split(".");
    return {
        type : "Property",
        path: path
    }
}

const operatorPrecedence: {[key: string]: {precedence: number, associativity: string}} = {
    '+': { precedence: 1, associativity: 'left' },
    '-': { precedence: 1, associativity: 'left' },
    '*': { precedence: 2, associativity: 'left' },
    '/': { precedence: 2, associativity: 'left' },
    '&': { precedence: 0, associativity: 'left' },
    '|': { precedence: 0, associativity: 'left' },
    '>': { precedence: 1, associativity: 'left' },
    '<': { precedence: 1, associativity: 'left' },
    '=': { precedence: 1, associativity: 'left' },
} as const;

export type Operator = "+" | "-" | "*" | "/" | "&" | "|" | ">" | "<" | "=";

const parseExpression = (tokens: Token[], minPrecedence?: number): [ExpressionNode | undefined, Token[]] => { // return the tokens back that are mutated
    const minPresedenceLocal: number = minPrecedence || 0;
    const parseValue = (token: Token): ExpressionNode | undefined => {
        if (!token) throw new Error("Unexpected end of input");
        if(isLiteral(token)) {
            return parseLiteral(token);
        }
        else if(token.type === TokenType.function) {
            return parseFunction(token);
        }
        else if(token.type === TokenType.property) {
            return parseProperty(token);
        }
        else if(token.type === TokenType.lparen) {
            const [expression, tkns] = parseExpression(tokens.slice(1));
            tokens = tkns;
            const nextToken = tokens.shift(); // remove rparen
            if(!nextToken || nextToken.type !== TokenType.rparen) {
                throw new Error("Expected closing parenthesis");
            }
            return expression;
        }
        return undefined;
    };

    let token: Token = tokens[0];
    let left: ExpressionNode | undefined = token? parseValue(token) : undefined;
    if(!left) return [undefined, tokens];
    tokens.shift();
    while(tokens.length !== 0) {
        token = tokens[0];
        if(!isOperator(token) || token.type === TokenType.newline) break;
        const precedence = operatorPrecedence[token.value].precedence;
        log("precedence is " + precedence + " with operator " + token.value);
        // if(!precedence) throw new Error("Precedence error");
        if(precedence < minPresedenceLocal) break;

        const operator = tokens.shift() as Token & {value: Operator};
        const [right, remainingTokens] = parseExpression(tokens, precedence+1);
        if(!right) break;
        left = {
            type: "BinaryOp",
            operator: operator.value,
            left,
            right
        }
        tokens = remainingTokens;
    }
    return [left, tokens];
}
const parseLiteral = (token: Token): LiteralNode => {
    if(token.type === TokenType.number) {
        // number case
        return {
            type: "Literal",
            value: parseFloat(token.value)
        }
    }
    if(token.type === TokenType.string) {
        // string case
        return {
            type: "Literal",
            value: token.value
        }
    }
    if(token.type === TokenType.word && (token.value === "true" || token.value === "false")) {
        return {
            type: "Literal",
            value: Boolean(token.value)
        }
    }
    return {
        type: "Literal",
        value: -1
    }
}

const isLiteral = (token: Token): boolean => {
    return token.type === TokenType.string || token.type === TokenType.number || (token.type === TokenType.word && (token.value === "true" || token.value === "false"));
}

const isOperator = (token: Token): boolean => {
    return token.value in operators;
}

export const parse = (tokens: Token[]): QueryNode | void => {
    // there are three stages we check for, first: property creation, then, condition checking, then ordering
    // scope -> conditioning -> ordering
    log('initial tokens: ' + tokens.length);
    const matchAndRemove = (expected: TokenType): Token | undefined => {
        if(tokens.length === 0) return undefined;
        return tokens[0].type === expected ? tokens.shift() : undefined;
    }

    const peek = (): Token | null => {
        return tokens[1] || null;
    }

    const scopePhase = (): ExpressionNode[] | void => {
        // we want either no statements or a list of tokentype.property comma tokentype.property ...
        if(tokens[1].type !== TokenType.comma && tokens[1].type !== TokenType.colon) {
            return; // we don't have a scope phase.
        }
        let canContinue = true;
        const expressions: ExpressionNode[] = [];
        while(canContinue) {
            // we might not be able to match and remove quite yet.
            const property = matchAndRemove(TokenType.property);
            const comma = matchAndRemove(TokenType.comma);
            if(!property) {
                return;
            }
            if(!property) {
                // this means we're completely done
                canContinue = false;
            }
            else if(!comma) {
                // break the loop
                canContinue = false;
                const prop = parseProperty(property);
                expressions.push(prop);
            } else {
                const prop = parseProperty(property);
                expressions.push(prop);
            }
        }
        const colon = matchAndRemove(TokenType.colon); // end of scope phase
        if(!colon) {
            // syntax error
            // relook this, because we really don't need a scope phase explicitly
            throw new Error("no colon")
        }
        return expressions;
    }
    const conditionPhase = (): ExpressionNode | void => {
        // we expect .property|function|literal condition .property|function or maybe a math expression or number or string
        const [expression, tkns] = parseExpression(tokens); // it's just a very long expression
        tokens = tkns;
        if(expression) return expression;
        return;
    }
    const orderPhase = (bypassTilda: boolean): OrderByNode | void => {
        const tilda = matchAndRemove(TokenType.tilda);
        if(!tilda && !bypassTilda) return;
        const order = matchAndRemove(TokenType.function);
        let ascOrDesc = matchAndRemove(TokenType.word);
        let ascendingString: "asc" | "desc" = "asc"
        if(ascOrDesc) {
            ascendingString = ascOrDesc.value === "asc"? "asc" : "desc";
        }
        let orderby: OrderByNode = {
            type: "OrderBy",
            direction: ascendingString
        }
        // this is optional
        const limit = matchAndRemove(TokenType.function);
        if(order) {
            const functionNode = parseFunction(order);
            orderby.function = functionNode;
        }
        if(limit) {
            const limitNode = parseFunction(limit);
            const number = parseInt(limit.value.slice(limit.value.indexOf("("), limit.value.lastIndexOf(")")));
            orderby.limit = number;
            // resolve here (we need to extract inside paren)
        }
        return orderby;
    }

    // this is per line
    while(matchAndRemove(TokenType.newline) !== undefined); // remove new lines
    const scope = scopePhase()||undefined;
    const cond = conditionPhase()||undefined;
    const order = orderPhase(!scope && !cond ? true : false)||undefined; // if we have no scope or condition phase, we don't need a tilda
    // log(scope);
    console.log(cond || "not here");
    console.log(order);
    log(tokens.length + " tokens left");
    return {
        type: "Query",
        scope,
        conditions: cond,
        orderBy: order
    }
    // matchAndRemove(TokenType.newline) /// this should exist if we want more lines
}