// for type implementation
export type JsonPrimitive = 
{value: string, type: "string"}
| {value: number, type: "number"}
| {value: boolean, type: "boolean"}
export type JsonArray = {value: JsonValue[], type: "array"};
export type JsonObject = {value: JsonData[], name: string, type: "object"};
export type JsonValue = JsonPrimitive | JsonObject | JsonArray
export interface JsonData {
    name: string;
    property: JsonValue;
}

export type JsonTypeNames = "string" | "number" | "boolean" | "object" | "array";
// for type checking
export type TypePrimitive = {type: "string"} | {type: "number"} | {type: "boolean"};
export type TypeArray = {type: "array", of: TypeAbstract};
export type TypeObject = {type: "object", of: TypeData[]};
export type TypeAbstract = TypePrimitive | TypeArray | TypeObject;
export interface TypeData {
    name: string;
    abstract: TypeAbstract;
    required: boolean;
}

export type TypedJson = {type: JsonSchematic, data: JsonData[]};

export interface JsonSchematic {
    title: string;
    properties: TypeData[]; // do we really need a value? or just types
}

export const dataFollowsSchema = (data: JsonData, schema: JsonSchematic): boolean => {
    if(data.property.type !== "object") {
        return false;
    }
    return true;
}

export const isInsertionValid = (insertion: JsonData, schema: JsonSchematic): boolean => {
    if(insertion.property.type !== "object") {
        return false;
    }
    if(insertion.property.value.length !== schema.properties.length) {
        return false;
    } // check that properties are same length (or should they be)
    for(let i = 0; i < insertion.property.value.length; i++) {
        const property = insertion.property.value[i];
        // if the property is in the schema and the values match, remove it from the queue
    }
    return false;
}

export const objtojsondata = (obj: {}): JsonData[] | undefined => {
    const getKeyValue = (value: any, key: string): JsonData | undefined => {
        if(typeof value === "boolean") {
            // todo fix
            return {
                name: key,
                property: {
                    type: "boolean",
                    value
                }
            }
        }
        else if(typeof value === "number") {
            return {
                name: key,
                property: {
                    type: "number",
                    value
                }
            }
        }
        else if(typeof value === "string") {
            return {
                name: key,
                property: {
                    type: "string",
                    value
                }
            }
        }
        else if(Array.isArray(value)) {
            return {
                name: key,
                property: {
                    type: "array",
                    value
                }
            }
        }
        else if(typeof value === "object") {
            // we do this recursively
            // return objtojsondata(value);
            // change
        }
        return undefined;
    }
    const data: JsonData[] = []
    for(const key in obj) {
        const value = obj[key];
        const v = getKeyValue(value, key);
        v && data.push(v);
    }
    return data;
}