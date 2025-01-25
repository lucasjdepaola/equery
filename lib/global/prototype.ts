import { objtojsondata } from "../jsoncraft";
import { query } from "../tests";

export {}
declare global {
    interface Array<T> {
        equery(q: string): Array<T>
    }
}

Array.prototype.equery = function(q: string) {
    // equery chain function here
    // clean up query process before calling it here
    
    return [];
}