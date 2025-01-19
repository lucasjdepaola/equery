// below are the listed functions that equery supports
// max(.num) min(.num), utc(.date) average(.num) sum(.num) lowercase(.string) uppercase(.string)
// count(.any) orderby(.any, desc|asc)

import { errors, QueryError } from "./errors";
import { JsonData } from "./jsoncraft";
import { FunctionNode, LiteralNode } from "./parse";

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

type AggregateFunction = (data: JsonData[], arg: FunctionNode | LiteralNode) => LiteralNode | QueryError; // change to proper aggregate pattern
// for aggregates, we need the data array to determine it
const isAggregate = (fn: QueryFunction | AggregateFunction) => "length" in fn.arguments[0];

// the hardest case is max(length(.age))
// max(length(today()))
// move to functions/aggregate.ts
const max = (values: number[]): number => {
    return Math.max(...values);
}

const min = (values: number[]): number => {
    return Math.min(...values)
}

const average = (values: number[]): number => {
    return sum(values) / values.length;
}

const sum = (values: number[]): number => {
    return values.reduce((prev: number, current: number) => prev + current);
}

const count = (values: any[]): number => {
    return values.length;
}

export const aggregateFunctions = {
    max, min, average, sum, count
} // this will do, we don't need regular functions, we can simply do ! in aggregate
// might need to change the philosophy behind building functions, we need data types such as object, array, etc
export type AggregateKey = keyof AggregateFunction;


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

const lowercase = (data: JsonData, value: LiteralNode): string | QueryError => {
    if(typeof value.value === "string")
        return value.value.toLowerCase();
    return "";
}

const uppercase = (value: LiteralNode): string => {
    if(typeof value.value === "string") {
        return value.value.toUpperCase();
    }
    return ""; // error change to
}

const toUTC = (date: string): number => {
    return 1;
}

// string functions
export const contains = (expression: string, value: string) => {
    const regex: RegExp = new RegExp(expression);
    // or could do string.includes(), etc
    return regex.test(value);
}
// we could find a way to leverage the functions native to javascript
// yearsfromdate(.number), senator is yearsfromdate(.birthdate) years old
// .name: yearstoday(.birthday)
// ft(.sizeinmm)

// conversions
const ft = (inft: number) => {
    return inft * 100; // change to the proper conversion
}

// date lib
// we go from the utc number, then we compare it to today's date and calculate the proper years.
export const yearsfromdate = (utc: number): number => {
    const today: number = Date.now();
    const timeDifference: number= new Date(today - utc).getFullYear();
    return timeDifference; // we could change it to a regular date, however, a number seems more fitting.
}
// we also need proper conversions from date formats (say mm-dd-yyyy or yyyy-mm-dd)

// TODO, move this to a date file

// below are some statements that are equery compatible, to understand better some of the functions that involve date
// orderby(years(.date))
// valid statement: .date = years(today())
// twitter allows for the best date queries, so it would be better to think in
// twitter advanced terms
// note: we only really need to use years() for simple functions, we don't always need it.
// like this: years(.date) = years(today())

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
    // we can accept a formatting which would include mdy dmy, etc.
    // without this, we would assume that the date would be mm-dd-yyyy
    // valid formats of a user inputted date
    // "02-26-2004"
    // "02/26/2004"
    // "02 26 2004"
    // "2004 02 26"
    // build regular expressions with the correct date
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
export const functions: Functions | any = {
    min, max, sum, average, count, contains, // aggregate functions
    uppercase, lowercase, // string functions
    // number functions
    ft, // metric conversions
    toUTC, today, parseDate, years, yearsfromdate, ytoday, // date functions
    length // multi datatype functions
}