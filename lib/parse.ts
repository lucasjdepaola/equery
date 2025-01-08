import { lex, operators, Token, TokenType } from "./lex";

// we have three different stages:
// object selection (.prop1, .prop2: )
// conditioning, .prop1 > 2 & .prop2 > max(.prop1)
// ordering, ~ orderby(.age) or orderby(length(.name))
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
    value: string | number | boolean
}

interface BinaryOpNode extends BaseNode {
    type: "BinaryOp";
    operator: string;
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

// static parse utility functions
const parseFunction = (token: Token): FunctionNode => {
    // we assume the token is a function already checked
    // name(expression, expression, ..., expression)
    const fn: string = token.value;
    const name = fn.slice(0, fn.indexOf("(")); // from the name to the start of the function
    const contents = fn.slice(fn.indexOf("("), fn.lastIndexOf(")")); // get contents of inner parens
    const args = contents.split(",")!; // split by comma values, unless we use recursion, which we may need
    return {
        type: "Function",
        name: name, // fix below
        arguments: args.map((arg) => parseExpression(arg)!)
    }
}
const parseProperty = (token: Token): PropertyNode => {
    const path = token.value.slice(1).split(".");
    return {
        type : "Property",
        path: path
    }
}

const expression = () => {

}
const term = () => {

}
const factor = () => {

}

const operatorPrecedence = {
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

type Operator = "+" | "-" | "*" | "/" | "&" | "|" | ">" | "<" | "=";


const parseExpression = (arg: string): ExpressionNode | void => {
    let i: number = 0;
    const parseValue = (): ExpressionNode => {
        const token = tokens[i++];
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
        throw new Error(`Unexpected token: ${token.value}`);
    };
    // property, or function, or literal, or binary op
    // we need to re-lex this data, or fix how we lexed in the first place
    const tokens = lex(arg) // get the data re-lexed
    const expressions: ExpressionNode[] = [];
    let left: ExpressionNode = parseValue();
    while(i < tokens.length) {
        let token = tokens[i];
        if(!isOperator(token)) break;
        i++;
        const right = parseValue();
        left = {
            type: "BinaryOp",
            operator: token.value,
            left,
            right
        }
        // this is native and left, we need a recursive descent solution
        // 1 + 1 = 2 & .age = 1 | .one > max(.one)
        // ((1 + 1) = 2) & (.age = 1) | (.one > max(.one))
    }
    return left;
    // now that you've accumulated expressions, try to shorten them down now.
    // 1 + 1 = 2 & .age = 1 | .one > max(.one)
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
    // .name, .age: .age < 10 ~ orderby(.age) desc
    const matchAndRemove = (expected: TokenType): Token | undefined => {
        return tokens[0].type === expected ? tokens.shift() : undefined;
    }

    const peek = (): Token | null => {
        return tokens[1] || null;
    }

    const scopePhase = (): ExpressionNode[] | void => {
        // we want either no statements or a list of tokentype.property comma tokentype.property ...
        let canContinue = true;
        const expressions: ExpressionNode[] = [];
        while(canContinue) {
            // we might not be able to match and remove quite yet.
            const property = matchAndRemove(TokenType.property);
            const comma = matchAndRemove(TokenType.comma);
            if(peek()?.type !== TokenType.property && (tokens[2].type !== TokenType.comma && tokens[2].type !== TokenType.colon)) {
                console.log("this isn't conforming with the scope");
                return; // we aren't parsing a proper statement
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
        }
        return expressions;
    }
    const conditionPhase = (): ExpressionNode | void => {
        // we expect .property|function condition .property|function or maybe a math expression or number or string
        let canContinue = true;
        const expressions: ExpressionNode[] = [];
        while(canContinue) {
            let token = tokens[0]; // get the first token
            // expression operator expression
            // .age = .one so we need a sign of some sort
            // can incorporate parenthesis later
            let expression: ExpressionNode;
            // build expressions here
            if(isOperator(token)) {
                const operator = matchAndRemove(token.type);
                // probably not right
            }
            else if(token.type === TokenType.property) {
                const property = matchAndRemove(TokenType.property);
            }
            else if(isLiteral(token)) {
                const litearl = parseLiteral(token);
            }
            else if(token.type === TokenType.function) {
                const fn = parseFunction(token);
            }
             else {
                canContinue = false;
            }
        }
    }
    const orderPhase = (bypassTilda: boolean): OrderByNode | void => {
        const tilda = matchAndRemove(TokenType.tilda);
        if(!tilda && !bypassTilda) return;
        let ascOrDesc = matchAndRemove(TokenType.word);
        let ascendingString: "asc" | "desc" = "asc"
        if(ascOrDesc) {
            ascendingString = ascOrDesc.value === "asc"? "asc" : "desc";
        }
        // this is optional
        const limit = matchAndRemove(TokenType.function);
        if(!limit) {
            // return the entire collection, do we want to do it here? or in the interpreting stage.
        }
        const orderFunction = matchAndRemove(TokenType.function);
        if(orderFunction) {
            const functionNode = parseFunction(orderFunction);
            return {
                type: "OrderBy",
                function: functionNode!, // change this, it could be undefined
                direction: ascendingString
            }
        }
        return { // why do we need an expression?
            type: "OrderBy",
            direction: ascendingString
        }
    }

    // this is per line
    const scope = scopePhase()||undefined;
    const cond = conditionPhase()||undefined;
    const order = orderPhase(!scope && !cond ? true : false)||undefined; // if we have no scope or condition phase, we don't need a tilda
    return {
        type: "Query",
        scope,
        conditions: cond,
        orderBy: order
    }
    // matchAndRemove(TokenType.newline) /// this should exist if we want more lines
}