import { log } from "./global/console";

export interface QueryError {
    error: "error"
    code: number;
    message: string;
    line?: string;
    additional?: string;
}

export const errors: QueryError[] = [
    {
        error: "error",
        code: 0,
        message: "Cannot order by types other than number or string. Please ensure orderby(.value) is either number or text."
    },
    {
        error: "error",
        code: 1,
        message: "Property error, cannot find property. Ensure property exists."
    },
    {
        error: "error",
        code: 2,
        message: "data provided is not an array of objects."
    },
    {
        error: "error",
        code: 3,
        message: "incompatible expression, cannot perform operation"
    },
    {
        error: "error",
        code: 4,
        message: "cannot interpret function, incompatible expressions, arguments contain errors."
    },
    {
        error: "error",
        code: 5,
        message: "Error in orderby phase."
    },
    {
        error: "error",
        code: 6,
        message: "Cannot get length of datatype. Ensure the datatype is a string or array."
    },
    {
        error: "error",
        code: 7,
        message: "max() error, we can only accept properties that result in a number, like max(length(.name))"
    },
]

export const displayError = (e: QueryError) => {
    console.log("::::")
    log("line information");
    console.log("ERROR LOG")
    console.log(`error code: ${e.code}`)
    console.log(`message: ${e.message}`)
    console.log(e.additional)
    console.log(":::");
}