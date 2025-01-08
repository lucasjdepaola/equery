// testing the lexer

import { lex, Token } from "./lex";
import { parse } from "./parse";

const tests = (line: string) => {
    const tokens = lex(line);
    tokens.forEach((t: Token) => console.log(t.type + ", " + t.value))
    console.log("line");
    console.log(line);
    parse(tokens);
}

const statements = `
.name: .name = "lucas" & .age > 20\n

length(.name) > 5 | .height > ft(10)\n

.married & .spouse.age > 20 ~ orderby(.age) desc\n

.name: orderby(.age)\n

.name: .age = max(.age)\n

.name: .age > average(.age)\n
`
// statements.split("\n").forEach((statement: string) => tests(statement));
tests(statements);