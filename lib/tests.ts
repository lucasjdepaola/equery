// testing the lexer

import { tweetdata } from "./data/testjson";
import { log } from "./global/console";
import { interpret } from "./interpret";
import { JsonData, JsonSchematic, objtojsondata } from "./jsoncraft";
import { lex, Token } from "./lex";
import { parse } from "./parse";

const data = objtojsondata(tweetdata, "tweets");

const tests = (line: string) => {
    const tokens = lex(line);
    tokens.forEach((t: Token) => console.log(t.type + ", " + t.value))
    console.log("line");
    console.log(line);
    const query = parse(tokens);
    if(query && data) {
        if(data.property.type === "object") { // this isn't correct logic
            const dt = interpret(query, data.property.value);
            console.log(dt);
            if(dt && !("error" in dt)) {
                log(JSON.stringify(dt));
            }
            console.log("is the data");
        }
    }
}

export const query = (statement: string, schema: JsonSchematic, data: JsonData[]): JsonData[]|void => {
    // move this out of the tests file
    const tokens = lex(statement);
    const query = parse(tokens);
    if(query && data) {
        const dt = interpret(query, data);
        if(dt && !("error" in dt)) {
            // return the data back
            return dt;
        }
    }
}

const statements = `
.name: .name = "lucas" & .age > 20\n

length(.name) > 5 | .height > ft(10)

.married & .spouse.age > 20 ~ orderby(.age) desc\n

.name: orderby(.age)\n

.name: .age = max(.age)\n

.name: .age > average(.age)\n
` // some example statements
// statements.split("\n").forEach((statement: string) => tests(statement));
// tests(statements);
// tests("length(.name) > 5 | .height > ft(10)");
// tests(".married & .spouse.age > 20 ~ orderby(.age) desc");
// tests(".name: orderby(.age)");
// tests(".name: .age = max(.age)");
// tests(".name: length(.name) > max(length(.name)) ~ orderby(.age)")
tests('.username = "lucas"')
tests('.username = "lucas" & .likes > 5')
tests('.username = "lucas" & .likes > 5 & .retweets > 9')
tests('.name: length(.username) > 2 & .likes > 1')
tests('.name: .likes < 100 | .likes = 1')
// figure out why we can't do nested functions yet
// it's because we don't have working functions yet.
// console.log(JSON.stringify(data));

// we need an abstract query("statement") similar to how we do with the test