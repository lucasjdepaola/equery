export enum TokenType {
    word, // desc, asc, etc
    string, // "hello"
    function, // max(.age), min(.age) orderby(.age)
    property, // .age .child.age .reference.age
    colon, // :
    comma, // ,
    period, // .
    number, // 1
    and, // &
    or, // |
    not, // !
    tilda, // ~
    plus, // +
    minus, // -
    times, // *
    divide, // /
    lessthan, // <
    greaterthan, // >
    power, // ^
    tag, // #
    at, // @
    equal, // =
    objectReference, // for type creation, {otherobject}
    unknown, // throw error
    lparen, // (
    rparen, // )
    lbrace, // {
    rbrace, // }
    lbracket, // [
    rbracket, // ]
    question, // ?
    semicolon, // ;
    newline, // \n
}
// .prop, .another.one: .prop = 5 & 

export const symbols: {[key: string]: TokenType} = {// we map key -> token if it exists 
    ":": TokenType.colon,
    ",": TokenType.comma,
    // ".": TokenType.period,
    "&": TokenType.and,
    "|": TokenType.or,
    "!": TokenType.not,
    "~": TokenType.tilda,
    "@": TokenType.at,
    "+": TokenType.plus,
    "-": TokenType.minus,
    "*": TokenType.times,
    "/": TokenType.divide,
    "<": TokenType.lessthan,
    ">": TokenType.greaterthan,
    "=": TokenType.equal,
    "^": TokenType.power,
    "#": TokenType.tag,
    "{": TokenType.lbrace,
    "}": TokenType.rbrace,
    "[": TokenType.lbracket,
    "]": TokenType.rbracket,
    "?": TokenType.question,
}

export const operators = { // should we add paren to this?
    "&": TokenType.and,
    "|": TokenType.or,
    "<": TokenType.lessthan,
    ">": TokenType.greaterthan,
    "=": TokenType.equal,
    "+": TokenType.plus,
    "-": TokenType.minus,
}

const lexicalPatterns = {
    function: "\\w+\\(.*\\)",
    property: "\\.(\\w+\\.)*\\w+",
    word: "\\w+",
    number: "-?\\d*\\.?\\d+"
    // map it out
}

export interface Token {
    type: TokenType;
    value: string; // potential value that is given to the token
    // functions have to be recursive, think max(length(.name))
}


const wordToToken = (word: string): Token | null => {
    if(new RegExp(lexicalPatterns.function).test(word)) {
        // we have a function
        return {
            type: TokenType.function,
            value: word
        }
    }
    else if(new RegExp(lexicalPatterns.property).test(word)) {
        return {
            type: TokenType.property,
            value: word
        }
    }
    else if(new RegExp(lexicalPatterns.number).test(word)) {
        return {
            type: TokenType.number,
            value: word
        }
    }
    else if(new RegExp(lexicalPatterns.word).test(word)) {
        return {
            type: TokenType.word,
            value: word
        }
    }
    return null;
}

interface Word {
    value: string;
}

export const lex = (code: string): Token[] => {
    const tokens: Token[] = [];
    let word: Word = {value: ""};
    const handleWord = (): void => {
        const wordToken = wordToToken(word.value);
        wordToken && tokens.push(wordToken);
        word.value = "";
    } 
    const handleSymbol = (char: string) => {
        tokens.push({
            type: symbols[char],
            value: char
        })
    }
    const handleQuotes = (index: number): number => {
        index++;
        let stringValue = "";
        while(code[index] !== '"' && index < code.length) {
            stringValue += code[index++];
        }
        tokens.push({
            type: TokenType.string,
            value: stringValue
        })
        return index + 1;
    }
    const handleParen = (index: number, name: string): number => {
        index++;
        name += "(";
        let count = 1; // we expect there to be one closure, increment if another appears
        while((code[index] !== ")" && count > 0) && index < code.length) {
            if(code[index] === "(") count++;
            name += code[index++];
            // encapsulate all arguments inside the function (which are an array of expressions, which can also include a function)
        }
        tokens.push({
            // push a function token if we come from a function
            type: TokenType.function,
            value: name + ")"
        })
        return index + 1;
    }
    // main lexical iteration
    for(let i = 0; i < code.length; i++) {
        let char = code[i];
        if(char === " " || char === "\n") {
            handleWord(); // we never get the final index returned?
            if(char === "\n") tokens.push({type: TokenType.newline, value: "\n"});
        }
        else if(char in symbols) { // !&+-* etc
            handleWord();
            handleSymbol(char);
        }
        else if(char === '"') {
            let index = handleQuotes(i);
            i = index;
        } // below
        else if(char === "(") {
            // we simply want to encapsulate everything inside the quotes, then we relex later in the parsing stage.
            // do this with handleparen() then you're done
            if(word.value.length > 0) { // if we're already parsing a word (indicating function)
                let index = handleParen(i, word.value);
                i = index;
                word.value = "";
            }
            // otherwise, we should push lparen indicating an expression
        }
        else { // we map out other cases (should make a regex for all possible word values)
            word.value += char;
        }
    }
    console.log(word.value); //desc
    handleWord(); // incase we have any word left
    return tokens;
}