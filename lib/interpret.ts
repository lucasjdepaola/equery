/* 
  now that we've lexed and parsed, we need to interpret the AST. Assuming that we have a proper
  AST, we can interpret things like expressions properly and get a value
  NOTE: this is where type checking the original schematic would come into play.
  both are finally interoperable within this interpretation
*/

import { errors, QueryError } from "./errors";
import { JsonData, JsonObject, JsonValue } from "./jsoncraft";
import { ExpressionNode, FunctionNode, LiteralNode, Operator, PropertyNode, QueryNode } from "./parse";
import * as fns from "./queryfunctions"

// we can change it to another type of node that would account for some other values
export const interpretFunction = (fn: FunctionNode, data: JsonData): LiteralNode => {
    const args: LiteralNode[] = fn.arguments.map((expression: ExpressionNode) => {
        // we need interpretExpression as well
        /// we should handle the expression with interpretexpression()
        if(expression.type === "Function") {
            const subfn = interpretFunction(fn, data);
        }
        else if(expression.type == "BinaryOp") {

        }
        else if(expression.type === "Literal") {
            return expression;
        }
        return { // placeholder
            type: "Literal",
            value: 1
        }
    })
    if(fn.name in fns) { // these are the lists of functions
        try {
            const value = fns[fn.name](...args); // perform the function
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
    let value: JsonValue = data.property;
    for(const propertyName of propertyPath.path) {
        if(data.property.type === "object" && data.property.value) {
            if(value.value) {
                value = value.value[propertyName];
            } else {
                return errors[1];
            }
        }
    }
    if(value) {
        return value;
    }
    return errors[1];
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
                return errors[1];
            }
        }
    }
    if(value) {
        return value;
    }
    return errors[1];
}

export type NativeType = "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";

const shallowExpression = (left: LiteralNode, operator: Operator, right: LiteralNode): LiteralNode => {
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
        case "-": value = Number(left.value) - Number(right.value);
        case "*": value = Number(left.value) * Number(right.value);
        case "/": value = Number(left.value) / Number(right.value);
        case "=": value = left.value === right.value; // this is fine, precise comparison
        case ">": value = left.value && right.value && left.value > right.value;
        case "<": value = left.value < right.value;
        case "&": value = Boolean(left.value) && Boolean(right.value);
        case "|": value = Boolean(left.value) || Boolean(right.value);
        default: value = -1; // return an error in this case
    }
    return {type: "Literal", value: value};
}

export const interpretExpression = (expression: ExpressionNode, data: JsonData):LiteralNode => {
    // expressions 
    // expressions are a superset to regular function() interpretation, yet, a function() can contain an expression.
    if(expression.type === "BinaryOp") {
        const left = interpretExpression(expression.left, data); // might be inefficient to ref a lot
        const right = interpretExpression(expression.right, data);
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

export const interpret = (ast: QueryNode, data: JsonData[]): JsonData | QueryError | void => {
    // condition -> order/sort -> scope
    // so basically, map() -> filter() -> sort(), but we do it in lossless order
    if(ast.conditions) {
        const conditions = ast.conditions;
        data.filter((value: JsonData) => {
            const answer = interpretExpression(conditions, value);
            console.log("answer is " + answer); // do we need to recalculate every time?
            if(answer.value) {
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
                    // accumulate values
                    // figure out from here
                    const property = findProperty(e, value);
                    // values[e.path]
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
                }
                else if(e.type === "Function") {
                    // this is a more advanced usecase, for things like aggregate,
                    // i.e: max(.age): conds
                    // do or don't implement.
                }
            });
            return {
                name: "foo",
                property: values
            }
        })
        // recursive filter properties that only include certain names involved in the scope relative to their level
    }
    // else if()
}