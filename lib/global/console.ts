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