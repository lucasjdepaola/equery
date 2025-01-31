/* 
  now that we've lexed and parsed, we need to interpret the AST. Assuming that we have a proper
  AST, we can interpret things like expressions properly and get a value
  NOTE: this is where type checking the original schematic would come into play.
  both are finally interoperable within this interpretation
*/

import { errors, QueryError } from "./errors";
import { log, printJson } from "./global/console";
import { JsonData, JsonObject, JsonValue } from "./jsoncraft";
import { ExpressionNode, FunctionNode, LiteralNode, LiteralType, Operator, PropertyNode, QueryNode } from "./parse";
import { AggregateFunction, functions, FunctionWrapper, QueryFunction } from "./queryfunctions";

// fn.name, property.name
type FunctionName = string;
type PropertyName = string;
const aggregateKey = (k: [FunctionName, PropertyName]): string => `${k[0]}_${k[1]}`;
const aggregateCache = {

} satisfies {[key: string]: LiteralNode};

export const literal = (value: LiteralType): LiteralNode => {
    return {
        type: "Literal",
        value: value
    }
}

export const interpretFunction = (fn: FunctionNode, data: JsonValue, fullData: JsonValue[]): LiteralNode | QueryError => {
    const args: (LiteralNode | QueryError)[] = fn.arguments.map((expression: ExpressionNode) => {
        if(expression.type === "Function") {
            const subfn = interpretFunction(expression, data, fullData);
            return subfn;
        }
        else if(expression.type == "BinaryOp") {
            return interpretExpression(expression, data, fullData);
        }
        else if(expression.type === "Literal") {
            return expression;
        }
        else if(expression.type === "Property") {
            const value = findPropertyValue(expression, data);
            if(value.type === "array" || value.type === "object") {
                throw new Error("cannot perform expressions on arrays or objects");
            }
            // so we need to confine it down to singular values, not arrays
            const literalNode: LiteralNode = {
                type: "Literal",
                value: value.value
            }
            return literalNode;
        }
        const error = errors[3];
        error.additional = "line 29, expression isn't a function, binaryop, or literal, does not conform with logic";
        // error.additional += " the type is " + expression.type;
        return error;
    })
    if(args.some(v => "error" in v)) {
        const error = errors[4];
        error.additional = "arguments are here: " + args.reduce((p, c) => {
            if("error" in c) {
                return p + ", error: " + c.message;
            }
            return p + "nonerror: " + c.value
        }, "");
        return error;
    }
    if(fn.name in functions) {
        try {
            const [func, type] = functions[fn.name] as FunctionWrapper;
            if(type === "query") {
                if(args.some(a => "error" in a)) throw new Error("err");
                const value = (func as QueryFunction)(data, args as LiteralNode[]); // perform the function
                return value;
            } else {
                const aggregateArg = fn.arguments[0] as PropertyNode
                const key = aggregateKey([fn.name, JSON.stringify(aggregateArg)]);
                if(key in aggregateCache) {
                    // we already have the value cached
                    return aggregateCache[key];
                } else {
                    // calculate the function
                    const value = (func as AggregateFunction)(fullData, aggregateArg);
                    if(!("error" in value)) {
                        console.log(`aggregate function ${fn.name} return value: ${value.value}`);
                        aggregateCache[key] = value;
                        return value;
                    }
                }
            }
        } catch(e) {
            console.log("An error has occured calling the function");
            console.log(e);
            throw new Error("stop");
        }
    }
    return {
        type: "Literal",
        value: 1 // change this
    }
}

const findPropertyValue = (propertyPath: PropertyNode, data: JsonValue): JsonValue => {
    const property = findProperty(propertyPath, data);
    return property;
}

const findProperty = (path: PropertyNode, data: JsonValue): JsonValue => {
    let value: JsonValue | undefined = data;
    for(const propertyName of path.path) {
        if(data.type === "object" && data.value !== undefined) {
            if(value !== undefined && value.value !== undefined && value.type === "object") {
                value = value.value.find(v => v.name === propertyName)?.property;
                if(value === undefined) {
                    return {
                        type: "boolean",
                        value: false
                    }
                }
            } else {
                log("We cannot find the property, defaulting to false");
                return {
                    type: "boolean",
                    value: false // return false for properties not found
                }
            }
        }
    }
    if(value && value.value !== undefined) {
        return value;
    }
    return {
        type: "boolean",
        value: false
    }
}

export type NativeType = "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";

const shallowExpression = (left: LiteralNode, operator: Operator, right: LiteralNode): LiteralNode | QueryError => {
    let value: string | boolean | number = false;
    switch (operator) {
        case "+": {
            if(typeof left.value !== "boolean" && typeof right.value !== "boolean") {
                if(typeof left.value !== typeof right.value) {
                    // change this
                    value = left.value.toString() + right.value.toString() + "";
                } else {
                    value = Number(left.value) + Number(right.value);
                }
            }
        }
        break;
        case "-": value = Number(left.value) - Number(right.value);
        break;
        case "*": value = Number(left.value) * Number(right.value);
        break;
        case "/": value = Number(left.value) / Number(right.value);
        break;
        case "=": value = left.value === right.value; // this is fine, precise comparison
        break;
        case ">": value = left.value && right.value && left.value > right.value;
        break;
        case "<": value = left.value < right.value;
        break;
        case "&": value = Boolean(left.value) && Boolean(right.value);
        break;
        case "|": value = Boolean(left.value) || Boolean(right.value);
        break;
        default: {
            log(`'${operator}' is the erroring operator`);
            return errors[3];
        }
    }
    return {type: "Literal", value: value};
}

const groupby = (expression: ExpressionNode, data: JsonValue[]) => { // not a trivial problem, but can be done
    const gb = data.reduce((pv, cv) => {
        const exp = interpretExpression(expression, cv, data) as LiteralNode;
        return {
            ...pv,
            [exp.value.toString()]: [...pv[exp.value.toString()]||[],cv]
        } // slightly inefficient, but we can go back to this later
    }, {});
    return gb;
}

export const interpretExpression = (expression: ExpressionNode, data: JsonValue, fullData: JsonValue[]):LiteralNode | QueryError => {
    // expressions are a superset to regular function() interpretation, yet, a function() can contain an expression.
    if(expression.type === "BinaryOp") {
        const left = interpretExpression(expression.left, data, fullData); // might be inefficient to ref a lot
        const right = interpretExpression(expression.right, data, fullData);
        if("error" in left || "error" in right) {
            return errors[3];
        }
        const operator = expression.operator;
        return shallowExpression(left, operator, right);
    }
    else if(expression.type === "Function") {
        return interpretFunction(expression, data, fullData);
    }
    else if(expression.type === "Property") {
        // complicated, because we need to leave it nonaggregated before traversing
        const property: JsonValue = findPropertyValue(expression, data);
        if(property.type !== "object" && property.type !== "array") {
            return {
                type: "Literal",
                value: property.value
            };
        }
        throw new Error(property.type)
    }
    else if(expression.type === "Literal") {
        return expression;
    }
    throw new Error("this should not happen." + JSON.stringify(expression));
}

const conditionphase = (expression: ExpressionNode, data: JsonValue[]): JsonValue[] => {
    const conditions = expression;
    return data.filter((value: JsonValue) => {
        const answer = interpretExpression(conditions, value, data);
        if("error" in answer) {
            console.log("error");
        }
        else if(answer.value === true) {
            return true;
        }
        return false; // this is naive, needs more thorough reasoning
    })
}

export const interpret = (ast: QueryNode, data: JsonValue[]): JsonValue[] | QueryError | void => {
    console.log("STARTING THE INTERPRETER --------");
    // condition -> order/sort -> scope to remain lossless
    if(ast.conditions) {
        data = conditionphase(ast.conditions, data);
    }

    if(ast.orderBy) { // ordering
        const ordering = ast.orderBy;
        const isAscending: boolean = ordering.direction === "asc";
        const orderby = ordering.function;
        if(orderby) {
            data = data.sort((a: JsonValue, b: JsonValue) => {
                const one = interpretExpression(orderby.arguments[0], a, data);
                const two = interpretExpression(orderby.arguments[0], b, data);
                if("error" in one) {
                    throw new Error("cannot do this");
                }
                if("error" in two) {
                    throw new Error("cannot do this");
                }
                if(typeof one.value === "number" && typeof two.value === "number") {
                    if(isAscending) {
                        return one.value - two.value;
                    } else {
                        return two.value - one.value;
                    }
                }
                return 0; // don't modify the ordering if we have no case
            });
        }
        if(ordering.limit !== undefined && ordering.limit < data.length) {
            data = data.slice(0, ordering.limit);
        }
    }

    const properties: PropertyNode[] = [];
    if(ast.scope) {
        const scope = ast.scope;
        data = data.map((value: JsonValue) => {
            if(value.type !== "object") throw new Error("data should be an array of objects");
            const values: JsonObject = {
                name: value.name,
                value: [],
                type: "object"
            }
            scope.map((e: ExpressionNode) => {
                if(e.type === "Property") {
                    properties.push(e);
                    const property = findProperty(e, value);
                    if(!("error" in property)) {
                        if(property.type === "object") {
                            values.value.push({
                                name: property.name,
                                property: property
                            });
                        } else {
                            values.value.push({
                                name: e.path[0], // change to deeper TODO
                                property: property,
                            });
                        }
                    }
                }
                else if(e.type === "Literal") {
                    throw new Error("Cannot use literal values in scope phase");
                }
                else if(e.type === "Function") {
                    throw new Error("Cannot use functions in the scope phase for now.");
                }
            });
            return values;
        })
    }
    return data;
}
