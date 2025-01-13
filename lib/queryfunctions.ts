// below are the listed functions that equery supports
// max(.num) min(.num), utc(.date) average(.num) sum(.num) lowercase(.string) uppercase(.string)
// count(.any) orderby(.any, desc|asc)
// these are supposed to be majorly the native static functions, not the live implementation of the language itself.

import { errors, QueryError } from "./errors";
import { JsonData } from "./jsoncraft";
import { FunctionNode, LiteralNode } from "./parse";

interface EqueryFunction {
    type: "aggregate" | "default";
    // [key: string]: QueryFunction
}

type QueryFunction = (data: JsonData[], args?: LiteralNode[]) => LiteralNode | void;

type AggregateFunction = (data: JsonData, property: FunctionNode | LiteralNode) => void; // change to proper aggregate pattern
// orderby is arguably an aggregate

// the arguments should be changed to [literalnode] because all expressions return literal nodes

export const containsError = (data: JsonData | QueryError): boolean => {
    return "error" in data;
}

export const max = (values: number[]): number => {
    return Math.max(...values);
}

export const min = (values: number[]): number => {
    return Math.min(...values)
}

export const average = (values: number[]): number => {
    return sum(values) / values.length;
}

export const sum = (values: number[]): number => {
    return values.reduce((prev: number, current: number) => prev + current);
}

export const count = (values: any[]): number => {
    return values.length;
}


export const lowercase = (value: string): string => {
    return value.toLowerCase();
}

export const uppercase = (value: string): string => {
    return value.toUpperCase();
}

export const toUTC = (date: string): number => {
    return 1;
}

// string functions
export const contains = (expression: string, value: string) => {
    const regex: RegExp = new RegExp(expression);
    return regex.test(value);
}
// we could find a way to leverage the functions native to javascript

// more to add below
// yearsfromdate(.number), senator is yearsfromdate(.birthdate) years old
// .name: yearstoday(.birthday)
// ft(.sizeinmm)
// if it's not in mm then do mmfromft(.size) then convert back
// file name is .eq

// conversions

export const ft = (inft: number) => {
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

export const years = (utc: number) => {
    // return the number of years from a utc date which is a native integer
    return new Date(utc).getFullYear(); // this should return something like 2024/2023, etc
}

export const today = (): number => {
    return Date.now(); // return the date in utc
}
export const ytoday = (): number => {
    return new Date().getFullYear(); // get todays date in years
}

export const parseDate = (date: string, fmt?: string): Date => {
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