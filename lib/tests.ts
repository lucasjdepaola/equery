// testing the lexer

import { log } from "./global/console";
import { interpret } from "./interpret";
import { lex, Token } from "./lex";
import { parse } from "./parse";

const tests = (line: string) => {
    const tokens = lex(line);
    tokens.forEach((t: Token) => console.log(t.type + ", " + t.value))
    console.log("line");
    console.log(line);
    const query = parse(tokens);
}

const statements = `
.name: .name = "lucas" & .age > 20\n

length(.name) > 5 | .height > ft(10)

.married & .spouse.age > 20 ~ orderby(.age) desc\n

.name: orderby(.age)\n

.name: .age = max(.age)\n

.name: .age > average(.age)\n
`
// statements.split("\n").forEach((statement: string) => tests(statement));
tests(statements);
tests("length(.name) > 5 | .height > ft(10)");
tests(".married & .spouse.age > 20 ~ orderby(.age) desc");
tests(".name: orderby(.age)");
tests(".name: .age = max(.age)");
tests(".name: length(.name) > max(length(.name)) ~ orderby(.age)")

// log("hello world");