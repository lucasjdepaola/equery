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
}

export const operators = {
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
            stringValue += code[index];
            index++;
        }
        tokens.push({
            type: TokenType.string,
            value: stringValue
        })
        return index + 1;
    }
    // main lexical iteration
    for(let i = 0; i < code.length; i++) {
        let char = code[i];
        if(char === " " || char === "\n") {
            handleWord();
        }
        else if(char in symbols) { // !&+-* etc
            handleWord();
            handleSymbol(char);
        }
        else if(char === '"') {
            let index = handleQuotes(i);
            i = index;
        }
        else { // we map out other cases (should make a regex for all possible word values)
            word.value += char;
        }
    }
    return tokens;
}