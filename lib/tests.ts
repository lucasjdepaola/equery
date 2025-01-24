// testing the lexer

import { tweetdata } from "./data/testjson";
import { log } from "./global/console";
import { interpret } from "./interpret";
import { JsonData, JsonSchematic, JsonValue, objtojsondata, objtojsondataarr } from "./jsoncraft";
import { lex, Token } from "./lex";
import { parse } from "./parse";

// const data = tweetdata.map(d => objtojsondata(d, "tweet")); // isn't quite correct either, close though
const data: JsonData = objtojsondata(tweetdata, "tweet");
// clear up ambiguity
console.log(data);

const tests = (line: string) => {
    const tokens = lex(line);
    tokens.forEach((t: Token) => console.log(t.type + ", " + t.value))
    console.log("line");
    console.log(line);
    const query = parse(tokens);
    console.log(data.property.value);
    if(query && data && data.property.type === "array") {
        const dt = interpret(query, data.property.value); // we need to figure this out.
        console.log(dt);
        if(dt && !("error" in dt)) {
            log(JSON.stringify(dt));
        }
        console.log("is the data");
    } else {
        console.log("interpreting failed, ");
            console.log(data.property.value);
    }
}

export const query = (statement: string, schema: JsonSchematic, data: JsonValue[]): JsonValue[]|void => {
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

tests('.username = "lucas"')
tests('.username = "lucas" & .likes > 5')
tests('.username = "lucas" & .likes > 5 & .retweets > 9')
tests('.name: length(.username) > 2 & .likes > 1')
tests('.name: .likes < 100 | .likes = 1')
tests('.name: .name = lowercase("LUCAS")')

// what do we want to do today?
// we want to be able to figure out functions once and for all

// and we can only build functions that conform to our strict function's type