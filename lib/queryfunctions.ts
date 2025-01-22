// below are the listed functions that equery supports
// max(.num) min(.num), utc(.date) average(.num) sum(.num) lowercase(.string) uppercase(.string)
// count(.any) orderby(.any, desc|asc)

import { errors, QueryError } from "./errors";
import { interpretExpression, literal } from "./interpret";
import { JsonData } from "./jsoncraft";
import { ExpressionNode, FunctionNode, LiteralNode } from "./parse";

interface Functions {
    max: AggregateFunction;
    min: AggregateFunction;
    average: AggregateFunction;
    sum: AggregateFunction;
    count: AggregateFunction;
    contains: AggregateFunction;
    lowercase: QueryFunction;
    uppercase: QueryFunction;
    ft: QueryFunction;
    toUTC: QueryFunction;
    today: QueryFunction;
    parseDate: QueryFunction;
    years: QueryFunction;
    yearsfromdate: QueryFunction;
    ytoday: QueryFunction;
    length: QueryFunction;
}
/* how we'd do it is:
if(fn.name in functions) {
const nativefn = functions[fn.name];
if(nativefn.type === "aggregate") {
// handle differently and cache answer
}
}
*/

type QueryFunction = (data: JsonData, args?: LiteralNode[]) => LiteralNode | QueryError;
// so far, we only need a single instance of data for the query function
// we want literal nodes to also contain array or object values

type AggregateFunction = (data: JsonData[], arg: ExpressionNode) => LiteralNode | QueryError; // change to proper aggregate pattern
// for aggregates, we need the data array to determine it
const isAggregate = (fn: QueryFunction | AggregateFunction) => "length" in fn.arguments[0];

const dataToNumber = (data: JsonData[], arg: ExpressionNode): number[] => {
    const values: LiteralNode[] = data.map((d) => interpretExpression(arg, d)).filter(d => !("error" in d)) as LiteralNode[];
    if(values.some((v) => typeof v.value !== "number")) {
        // return errors[7];
        throw new Error(JSON.stringify(errors[7]));
    }
    const strictValues = values.map(v => v.value) as number[];
    return strictValues;
}

// the hardest case is max(length(.age))
// max(length(today()))
// move to functions/aggregate.ts
const max = (data: JsonData[], arg: ExpressionNode): LiteralNode | QueryError => {
    const values = dataToNumber(data, arg);
    return literal(Math.max(...values));
} // this is how aggregate functions should look

const min = (data: JsonData[], arg: ExpressionNode): LiteralNode | QueryError => {
    const values = dataToNumber(data, arg);
    return literal(Math.min(...values));
}

const average = (data: JsonData[], arg: ExpressionNode): LiteralNode => {
    const len = data.length;
    const values = dataToNumber(data, arg);
    const sumof = sum(data, arg);
    if(typeof sumof.value !== "number") {
        throw new Error("bad type");
    }
    return literal(sumof.value / len);
}

const sum = (data: JsonData[], arg: ExpressionNode): LiteralNode => {
    const values = dataToNumber(data, arg);
    return literal(values.reduce((prev: number, current: number) => prev + current));
}

const count = (data: JsonData[], arg: ExpressionNode): LiteralNode => {
    return literal(data.length);
}

export const aggregateFunctions = {
    max, min, average, sum, count // aggregate functions are tidy now
} as const satisfies {[key: string]: AggregateFunction};


const length: QueryFunction = (data: JsonData, args?: LiteralNode[]): LiteralNode | QueryError => {
    // length(.name) for strings, numbers, or whatever really
    // we shouldn't do it like this
    if(args) {
        let value = args[0]; // we want the first argument
        if(typeof value.value === "string") {
            return {
                type: "Literal",
                value: value.value.length // this is not concise
            }
        }
        if(Array.isArray(value.value)) {
            return {
                type: "Literal",
                value: value.value.length
            }
        }
    }
    return errors[6];
}

const rank = () => {
    // our first mix of both aggregate and non aggregate, tricky
}

const irank = () => {
    // inverse rank, for things that need lower value (like price being low)
}

const lowercase = (data: JsonData, args?: LiteralNode[]): LiteralNode | QueryError => {
    if(!args) throw new Error("lowercase needs arguments");
    const value = args[0];
    if(typeof value.value === "string")
        return literal(value.value.toLowerCase());
    throw new Error("cannot convert to lowercase, ensure that your argument 1 is a string")
}

const uppercase = (data: JsonData, args?: LiteralNode[]): LiteralNode | QueryError => {
    if(!args) throw new Error("lowercase needs arguments");
    const value = args[0];
    if(typeof value.value === "string") {
        return literal(value.value.toUpperCase());
    }
    throw new Error("cannot convert to uppercase, ensure that arg1 contains a string");
}

const toUTC = (date: string): number => {
    return 1;
}

// string functions
export const contains = (data: JsonData, args?: LiteralNode[]): LiteralNode => {
    if(!args) throw new Error("contains needs arguments");
    // value, contains contains(.property, "string")
    const [property, str] = args;
    if(typeof property.value !== "string" && typeof str.value !== "string") {
        throw new Error("wrong arguments in contains");
    }
    const regex: RegExp = new RegExp(str.value as string);
    // or could do string.includes(), etc
    return literal(regex.test(property.value as string));
}
// we could find a way to leverage the functions native to javascript
// yearsfromdate(.number), senator is yearsfromdate(.birthdate) years old
// ft(.sizeinmm)

// conversions
const ft = (inft: number) => {
    return inft * 100; // change to the proper conversion
}

// date lib
export const yearsfromdate = (utc: number): number => {
    const today: number = Date.now();
    const timeDifference: number= new Date(today - utc).getFullYear();
    return timeDifference; // we could change it to a regular date, however, a number seems more fitting.
}
const years = (utc: number) => {
    // return the number of years from a utc date which is a native integer
    return new Date(utc).getFullYear(); // this should return something like 2024/2023, etc
}

const today = (): number => {
    return Date.now(); // return the date in utc
}
const ytoday = (): number => {
    return new Date().getFullYear(); // get todays date in years
}

const parseDate = (date: string, fmt?: string): Date => {
    if(date.includes("/")) {
        // slash case
        const numbers = date.split("/");
    }
    else if(date.includes("-")) {
        // dash case
    }
    else if(date.includes(" ")) {
        // space case
    }
    return new Date();
}
export const functions = {
    min, max, sum, average, count, contains, // aggregate functions
    uppercase, lowercase, // string functions
    // number functions
    // ft, // metric conversions
    // toUTC, today, parseDate, years, yearsfromdate, ytoday, // date functions
    // omit these for now since we haven't even implemented them
    length // multi datatype functions
} as const satisfies {[key: string]: QueryFunction | AggregateFunction}