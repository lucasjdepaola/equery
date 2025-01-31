// testing the lexer

import { nfldata, tweetdata } from "./data/testjson";
import { log, printJson } from "./global/console";
import { interpret } from "./interpret";
import { JsonData, jsondatatoobj, JsonSchematic, JsonValue, objtojsondata, objtojsondataarr } from "./jsoncraft";
import { lex, Token } from "./lex";
import { parse } from "./parse";
import "./global/prototype"

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
            return dt;
        }
    }
    throw new Error("error in the data");
}

// tests('.screen_name, .text: contains(.text, "warren") ~ limit(10)')
// tests('.screen_name: length(.screen_name) < 5')
const d = tweetdata.equery('.screen_name, .text: contains(.text, "china") ~ limit(10)');
printJson(d);

// let q = '.name_first, .name_last, .rank: length(.name_first) > 5 ~ orderby(.rank) asc'
// const nf = nfldata.equery(q).equery(".rank = 2");
// console.log(`query: ${q}`)
// printJson(nf);