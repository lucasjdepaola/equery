// testing the lexer

import { tweetdata } from "./data/testjson";
import { log, printJson } from "./global/console";
import { interpret } from "./interpret";
import { JsonData, JsonSchematic, JsonValue, objtojsondata, objtojsondataarr } from "./jsoncraft";
import { lex, Token } from "./lex";
import { parse } from "./parse";

// const data = tweetdata.map(d => objtojsondata(d, "tweet")); // isn't quite correct either, close though
const data: JsonData = objtojsondata(tweetdata, "tweet");
// console.log("DATA");
// console.log(data);
// clear up ambiguity

const tests = (line: string) => {
    const tokens = lex(line);
    tokens.forEach((t: Token) => console.log(t.type + ", " + t.value))
    console.log(line);
    const query = parse(tokens);
    if(query && data && data.property.type === "array") {
        const dt = interpret(query, data.property.value); // we need to figure this out.
        if(dt && !("error" in dt)) {
            console.log("RESULT -+++++++")
            printJson(dt);
            console.log("+++++++");
            console.log(`result length: ${dt.length}`);
        }
    } else {
        console.log("interpreting failed, ");
            console.log(data.property.value);
    }
}

export const query = (statement: string, data: JsonValue[], schema?: JsonSchematic): JsonValue[] => {
    // move this out of the tests file
    const tokens = lex(statement);
    const query = parse(tokens);
    if(query && data) {
        const dt = interpret(query, data);
        if(dt && !("error" in dt)) {
            printJson(dt);
            return dt;
        }
    }
    throw new Error("error in the data");
}

// tests('.username = "lucas"')
// tests('.username = "lucas" & .likes > 5')
// tests('.username = "lucas" & .likes > 5 & .retweets > 9')
// tests('.name: length(.username) > 2 & .likes > 1')
// tests('.name: .likes < 100 | .likes = 1')
// tests('.likes > 5');
// tests('.username = "lucas"');
// tests('.username: .likes < 100 & "lucas" = .username')
// tests('length(.text) > 100') // works
// tests('.username = lowercase("LUCAS") & .retweets > 9') // works
// tests('.username: .username = "lucas" ~ orderby(.age) desc')
// tests('.username = "lucas" ~ orderby(.likes) asc')
// tests('.username, .likes: .likes < max(.likes)')
tests('.name, .text: length(.text) > 100 ~ orderby(length(.text)) desc')
    // id: number;
    // lang: string;
    // text: string;
    // name: string;
    // source: string;
    // created_at: string;
// groupby should come before orderby if anything
// lets work on aggregates now

// and we can only build functions that conform to our strict function's type