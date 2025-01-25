// testing the lexer

import { tweetdata } from "./data/testjson";
import { log, printJson } from "./global/console";
import { interpret } from "./interpret";
import { JsonData, jsondatatoobj, JsonSchematic, JsonValue, objtojsondata, objtojsondataarr } from "./jsoncraft";
import { lex, Token } from "./lex";
import { parse } from "./parse";

const data: JsonData = objtojsondata(tweetdata, "tweet");

const tests = (line: string) => {
    const tokens = lex(line);
    tokens.forEach((t: Token) => console.log(t.type + ", " + t.value))
    console.log(line);
    const query = parse(tokens);
    if(query && data && data.property.type === "array") {
        const dt = interpret(query, data.property.value); // we need to figure this out.
        if(dt && !("error" in dt)) {
            console.log("RESULT -+++++++")
            printJson(jsondatatoobj({name: "title", property: {type: "array", value: dt}}));
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

// tests('.name, .text: length(.text) > 100 ~ orderby(length(.text)) desc')
tests('.Username, .Text, .Likes: length(.Username) < 4 ~ orderby(.Likes) desc limit(10)')
    // Tweet_ID: number;
    // Username: string;
    // Text: string;
    // Retweets: number;
    // Likes: number;
    // Timestamp: string;