import { jsondatatoobj, objtojsondata } from "../jsoncraft";
import { query } from "../query";

export {}
declare global {
    interface Array<T> {
        equery(q: string): Array<T>
    }
}

Array.prototype.equery = function(q: string) {
    // equery chain function here
    // clean up query process before calling it here
    // process is relatively clean enough to perform queries on
    const val = objtojsondata(this, "foo").property;
    if(val.type === "array") {
        const result = query(q, val.value);
        return jsondatatoobj({
            name: "foo",
            property: {type: "array", value: result}
        });
    }
    // very redundant, but this can work. we'll make it more concise later on
    return this;
}