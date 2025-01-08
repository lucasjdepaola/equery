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
