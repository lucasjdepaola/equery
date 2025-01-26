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
            // printJson(dt);
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

tests('.screen_name, .text: length(.text) < 100 & contains(.text, "china") ~ limit(10)')