import { interpret } from "./interpret";
import { JsonSchematic, JsonValue } from "./jsoncraft";
import { lex } from "./lex";
import { parse } from "./parse";

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

export const queryFunction = (fn: string, data: JsonValue[]) => {

    //this is for functions in relation to components, we might need to do this at a parent level
}

// we'd just use an extension of equery with components, all should be treated as aggregate