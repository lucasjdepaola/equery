export const log = (...param: any[]) => {
    const error = new Error();
    const stack = error.stack?.split('\n');
    // The line number is typically in the third line of the stack trace
    if(stack) {
        const callerLine = stack[2].match(/\(.*:(\d+):\d+\)/);
        if(callerLine) {
            const info = callerLine[0].slice(callerLine[0].lastIndexOf("/"));
            console.log(`(${info} ${param}`);
        }
    }
}

const zip = <T extends readonly unknown[][]>(...arrays: [...T]): Array<Array<T[number][number]>> => {
    /* result is an array of tuples */
    const result: Array<Array<T[number][number]>> = [];

    /* get the minimum length (if we want full tuples) */
    const minLength = Math.min(...arrays.map(e => e.length));

    /* iterate over each array to the min length, if the element[j][i] exists, push it */
    for(let i = 0; i < arrays.length; i++) {
        result[i] = [];
        for(let j = 0; j < minLength; j++) {
            arrays[j][i] && result[i].push(arrays[j][i]);
        }
    }
    return result;
}