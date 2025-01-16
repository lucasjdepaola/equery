export interface QueryError {
    error: "error"
    code: number;
    message: string;
    line?: string;
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
    }

]