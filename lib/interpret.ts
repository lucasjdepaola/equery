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
import { functions, FunctionWrapper, QueryFunction } from "./queryfunctions";

export const literal = (value: LiteralType): LiteralNode => {
    return {
        type: "Literal",
        value: value
    }
}

// we can change it to another type of node that would account for some other values
export const interpretFunction = (fn: FunctionNode, data: JsonValue): LiteralNode | QueryError => {
    const args: (LiteralNode | QueryError)[] = fn.arguments.map((expression: ExpressionNode) => {
        // we need interpretExpression as well
        /// we should handle the expression with interpretexpression()
        if(expression.type === "Function") {
            const subfn = interpretFunction(expression, data);
            return subfn;
        }
        else if(expression.type == "BinaryOp") {
            return interpretExpression(expression, data);
        }
        else if(expression.type === "Literal") {
            return expression;
        }
        else if(expression.type === "Property") {
            // handle property
            const value = findPropertyValue(expression, data);
            if(value.type === "array" || value.type === "object") {
                // we cannot do this
                throw new Error("cannot perform expressions on arrays or objects");
            }
            // we need to know that we can't do expressions on certain types
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
    if(fn.name in functions) { // these are the lists of functions
        // perhaps precalculate all aggregates that are used before performing loop
        // would be a cache optimization
        try {
            const [func, type] = functions[fn.name] as FunctionWrapper;
            if(type === "query") {
                if(args.some(a => "error" in a)) throw new Error("err");
                const value = (func as QueryFunction)(data, args as LiteralNode[]); // perform the function
                console.log("we called function: " + fn.name + " and got a valid result");
                printJson(value);
                return value;
            } else {
                // aggregate, so pick from the already cached list
            }
        } catch(e) {
            // return an error since the function does not exist
            console.log("An error has occured calling the function");
            console.log(e);
        }
    }
    return {
        type: "Literal",
        value: 1 // change this
    }
}

const findPropertyValue = (propertyPath: PropertyNode, data: JsonValue): JsonValue => {
    // change to findproperty().value below
    const property = findProperty(propertyPath, data);
    return property;
}

const findProperty = (path: PropertyNode, data: JsonValue): JsonValue => {
    let value: JsonValue | undefined = data;
    for(const propertyName of path.path) {
        if(data.type === "object" && data.value !== undefined) {
            if(value !== undefined && value.value !== undefined && value.type === "object") {
                value = value.value.find(v => v.name === propertyName)?.property;
                if(value === undefined) throw new Error("no");
            } else {
                log("We cannot find the property, defaulting to false");
                return {
                    type: "boolean",
                    value: false
                }
            }
        }
    }
    if(value && value.value !== undefined) {
        return value;
    }
    // return false when we know this function is correct.
    throw new Error(errors[1].message);
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

const groupby = (expression: ExpressionNode, data: JsonData[]) => { // not a trivial problem, but can be done
    // we need this to have one property involved.
    // so if it's length(.property) then you'd base it on a property
    // i guess it doesn't really need to be property based, but yeah.
}
export const groupBy = (arr: any[], key: any) =>{
    // now let's change it to property based
    // we calulate the property or expression, and get the answer
    // we should go from jsondata[] and return jsondata[] except it's keys
    // of the trait we want (i.e): 1: {} // objects
    // going to be very challenging, likely a day problem
    return arr.reduce((pv, cv) => (
        {
            ...pv,
            [cv[key]]: [...pv[cv[key]]||[], cv]
            // || [] // we may not need this line
        }
    ), {});
}

export const interpretExpression = (expression: ExpressionNode, data: JsonValue):LiteralNode | QueryError => {
    // expressions 
    // expressions are a superset to regular function() interpretation, yet, a function() can contain an expression.
    if(expression.type === "BinaryOp") {
        const left = interpretExpression(expression.left, data); // might be inefficient to ref a lot
        const right = interpretExpression(expression.right, data);
        if("error" in left || "error" in right) {
            return errors[3];
        }
        const operator = expression.operator;
        return shallowExpression(left, operator, right);
    }
    else if(expression.type === "Function") {
        return interpretFunction(expression, data);
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

    // throw error here
    throw new Error("this should not happen." + JSON.stringify(expression));
    return {
        type: "Literal",
        value: -1
    }
}

export const interpret = (ast: QueryNode, data: JsonValue[]): JsonValue[] | QueryError | void => {
    console.log("STARTING THE INTERPRETER --------");
    // condition -> order/sort -> scope
    // so basically, map() -> filter() -> sort(), but we do it in lossless order
    if(ast.conditions) {
        const conditions = ast.conditions;
        data = data.filter((value: JsonValue) => {
            const answer = interpretExpression(conditions, value);
            if("error" in answer) {
                console.log("error");
            }
            else if(answer.value === true) {
                return true;
            }
            return false; // this is naive, needs more thorough reasoning
        })
    }

    // now that we have a filtered down list, we can order the function
    if(ast.orderBy) {
        const ordering = ast.orderBy;
        const isAscending: boolean = ordering.direction === "asc";
        const orderby = ordering.function;
        if(orderby) {
            // we can just extract the expressions and see
            // its not a real function
            data = data.sort((a: JsonValue, b: JsonValue) => {
                const one = interpretFunction(orderby, a);
                // change to a simple getproperty
                const two = interpretFunction(orderby, b);
                if("error" in one) {
                    log('f');
                    log(one.code);
                    log(one.message);
                    log(one.additional);
                    throw new Error("cannot do this");
                }
                if("error" in two) {
                    log(two.code);
                    log(two.message);
                    log(two.additional);
                    log("F");
                    throw new Error("cannot do this");
                }
                if(typeof one.value === "number" && typeof two.value === "number") {
                    if(isAscending) {
                        return one.value - two.value;
                    } else {
                        return two.value - one.value;
                    }
                }
                return 0;
            });
        }
            // this is the function which should contain the name "orderby", if not, throw err.
            // functions should consist of some form of property or a functionn operation on a property
            // valid statements: orderby(.age), orderby(length(.name)), orderby(length(.object.name))
        if(ordering.limit) {
            data = data.slice(0, ordering.limit);
        }
    }

    const properties: PropertyNode[] = [];
    if(ast.scope) {
        const scope = ast.scope;
        data = data.map((value: JsonValue) => {
            const values: JsonObject = {
                name: "",
                value: [],
                type: "object"
            }
            scope.map((e: ExpressionNode) => {
                if(e.type === "Property") {
                    // this is the most common case. a reference such as .age, .name
                    properties.push(e);
                    const property = findProperty(e, value);
                    if(!("error" in property)) {
                        values.value.push({
                            name: "foo",
                            property: property,
                        })
                        // not fully proper scope, only shallow
                    }
                    // find the proper scope
                }
                else if(e.type === "Literal") {
                    throw new Error("Cannot use literal values in scope phase");
                }
                else if(e.type === "Function") {
                    // this is a more advanced usecase, for things like aggregate,
                    throw new Error("Cannot use functions in the scope phase for now.");
                }
            });
            return values;
        })
        // recursive filter properties that only include certain names involved in the scope relative to their level
    }
    return data; // return the data
}