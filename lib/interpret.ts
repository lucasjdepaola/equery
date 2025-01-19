/* 
  now that we've lexed and parsed, we need to interpret the AST. Assuming that we have a proper
  AST, we can interpret things like expressions properly and get a value
  NOTE: this is where type checking the original schematic would come into play.
  both are finally interoperable within this interpretation
*/

import { errors, QueryError } from "./errors";
import { log } from "./global/console";
import { JsonData, JsonObject, JsonValue } from "./jsoncraft";
import { ExpressionNode, FunctionNode, LiteralNode, Operator, PropertyNode, QueryNode } from "./parse";
import { functions } from "./queryfunctions";

// we can change it to another type of node that would account for some other values
export const interpretFunction = (fn: FunctionNode, data: JsonData): LiteralNode | QueryError => {
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
            if("error" in value) {
                return value;
            }
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
        console.log(" we can perform the function "); // change though
        // perhaps precalculate all aggregates that are used before performing loop
        // would be a cache optimization
        try {
            const value = functions[fn.name](data, args); // perform the function
            // TODO change functionsn into interface which return a literal value
            value
        } catch(e) {
            // return an error since the function does not exist
        }
    }
    return {
        type: "Literal",
        value: 1
    }
}

const findPropertyValue = (propertyPath: PropertyNode, data: JsonData): JsonValue|QueryError => {
    // change to findproperty().value below
    // const property = findProperty(propertyPath, data);
    // we dont need the rest
    let value: JsonValue | undefined = data.property;
    for(const propertyName of propertyPath.path) {
        if(data.property.type === "object" && data.property.value) {
            if(value && value.value) {
                // value = value.value[propertyName];
                value = data.property.value.find((d) => d.name === propertyName)?.property;
                console.log("We've found the path specified");
            } else {
                log("WE cannot find the property specified");
                return {
                    type: "boolean", // we return false if we cannot find a property, no need for more than that
                    value: false
                }
            }
        }
    }
    if(value) {
        return value;
    }
    log("Cannot find the property specified");
    return {
        type: "boolean", // we return false if we cannot find a property, no need for more than that
        value: false
    }
}

const findProperty = (path: PropertyNode, data: JsonData): JsonData | QueryError => {
    let value: JsonData = data;
    for(const propertyName of path.path) {
        if(data.property.type === "object" && data.property.value) {
            if(value.property) {
                value = {
                    name: data.property.name,
                    property: data.property.value[propertyName]
                }
            } else {
                // don't return that, return false if you can't find it
                log("We cannot find the property, defaulting to false");
                return {
                    "name": "undefined",
                    property: {
                        type: "boolean",
                        value: false
                    }
                }
            }
        }
    }
    if(value) {
        log("We have found the property (temp)");
        return value;
    }
    return errors[1];
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

export const interpretExpression = (expression: ExpressionNode, data: JsonData):LiteralNode | QueryError => {
    // expressions 
    // expressions are a superset to regular function() interpretation, yet, a function() can contain an expression.
    if(expression.type === "BinaryOp") {
        const left = interpretExpression(expression.left, data); // might be inefficient to ref a lot
        const right = interpretExpression(expression.right, data);
        console.log(left);
        console.log(right);
        console.log("left, right");
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
        const property: JsonValue | QueryError = findPropertyValue(expression, data);
        if("error" in property) {
        } else if(property.type !== "object" && property.type !== "array") {
            return {
                type: "Literal",
                value: property.value
            };
        }
    }
    else if(expression.type === "Literal") {
        return expression;
    }

    return {
        type: "Literal",
        value: -1
    }
}

export const interpret = (ast: QueryNode, data: JsonData[]): JsonData[] | QueryError | void => {
    // condition -> order/sort -> scope
    // so basically, map() -> filter() -> sort(), but we do it in lossless order
    if(ast.conditions) {
        const conditions = ast.conditions;
        data = data.filter((value: JsonData) => {
            const answer = interpretExpression(conditions, value);
            console.log("stringified answer of the condition phase is " + JSON.stringify(answer));
            console.log("NOTE: this is within a data context");
            if("error" in answer) {
                console.log("error");
            }
            else if(answer.value === true) {
                console.log("We've returned true");
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
            data = data.sort((a: JsonData, b: JsonData) => {
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
        data = data.map((value: JsonData) => {
            const values: JsonObject = {
                name: "changeme",
                value: [],
                type: "object"
            }
            scope.map((e: ExpressionNode) => {
                if(e.type === "Property") {
                    // this is the most common case. a reference such as .age, .name
                    properties.push(e);
                    const property = findProperty(e, value);
                    if(!("error" in property)) {
                        // values[e.path[0]] = property;
                        values.value.push({
                            name: property.name,
                            property: property.property,
                        })
                        // not fully proper scope, only shallow
                    }
                    // find the proper scope
                }
                else if(e.type === "Literal") {
                    // this is an error case, throw an error
                    throw new Error("Cannot use literal values in scope phase");
                }
                else if(e.type === "Function") {
                    // this is a more advanced usecase, for things like aggregate,
                    // i.e: max(.age): conds
                    // do or don't implement.
                    throw new Error("Cannot use functions in the scope phase for now.");
                }
            });
            return {
                name: "foo",
                property: values // change to incorporate this into data instead of early return
            }
        })
        // recursive filter properties that only include certain names involved in the scope relative to their level
    }
    // else if()
    return data; // return the data
}