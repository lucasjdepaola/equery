import { errors, QueryError } from "./errors";

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
const getJsonType = (data: any): JsonTypeNames => {
    if(typeof data === "string") return "string";
    if(typeof data === "number") return "number";
    if(typeof data === "boolean") return "boolean";
    if(Array.isArray(data)) return "array";
    if(typeof data === "object") return "object";
    return "object";
}
// for type checking
export type TypePrimitive = {type: "string"} | {type: "number"} | {type: "boolean"};
export type TypeArray = {type: "array", of: TypeAbstract};
export type TypeObject = {type: "object", of: TypeData[]}; // do we want to change this so we don't have objects manually enumerated?
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

export const objtojsondataarr = (obj: {}[], title: string): JsonData[] => {
    return obj.map(d => objtojsondata(d, title)); // pseudo wrapper, not perfect.
}


const getType = (value: any): TypeAbstract => {
    let type = getJsonType(value);
    if(type === "array") {
        const of = getType(value[0]); // first index for now
        return {
            type, of
        }
    }
    if(type === "object") {
        const of: TypeData[] = Object.keys(value).map((v: string) => {
            return {
                abstract: getType(value[v]),
                "name": v,
                "required": false
            }
        });
        return {
            type, of
        }
    }
    return {
        type,
    }
}

const getProperties = (data: JsonData): TypeData[] | QueryError => {
    const properties: TypeData[] = [];
    if(data.property.type !== "object") {
        return errors[2];
    }
    for(const property of data.property.value) {
        // this doesnt make any sense
        properties.push({
            name: property.name,
            abstract: getType(property),
            required: false,
        })
    }
    return properties;
}

export const compareSchemas = (prev: TypeData[], current: TypeData[]): TypeData[]|void => {

}


type Key = string;
type Val = string;
export const transformValueToNativeJson = (v: JsonValue): [Key, Val] => {
    if(v.type === "object") {
    }
    return ["one", "one"];
}

export const objtojsondata = (obj: {}, title: string): JsonData => {
    const getKeyValue = (value: any, key: string): JsonValue | undefined => {
        if(typeof value === "boolean") {
            return {
                type: "boolean",
                value
            }
        }
        else if(typeof value === "number") {
            return {
                type: "number",
                value
            }
        }
        else if(typeof value === "string") {
            return {
                type: "string",
                value
            }
        }
        else if(Array.isArray(value)) {
            // this is an any type
            return {
                type: "array",
                value: value.map(v => getKeyValue(v, key)!)
                // value
            }
        }
        else if(typeof value === "object") {
            // we do this recursively
            return {
                name: key,
                value: objtojsondata(value, key).property.value as JsonData[],
                type: "object"
            }
        }
        throw new Error("Bad type");
    }
    if(Array.isArray(obj)) {
        return {
            name: title,
            property: getKeyValue(obj, title)!
        }
    } else {
        const data: JsonData[] = []
        for(const key in obj) {
            const value = obj[key];
            const v: JsonData = {
                name: key,
                property: getKeyValue(value, key)!
            }
            v && data.push(v);
        }
        return {
            name: title,
            property: {
                name: title,
                type: "object",
                value: data
            }
        }
    }
}

export const jsondatatoobj = (v: JsonData): any => {
    const getValue = (prop: JsonValue): any => {
        switch (prop.type) {
            case "string":
            case "number":
            case "boolean":
                return prop.value;
            case "array":
                return prop.value.map(item => getValue(item));
            case "object": {
                const obj: { [key: string]: any } = {};
                for (const data of prop.value) {
                    obj[data.name] = getValue(data.property);
                }
                return obj;
            }
            default:
                throw new Error("Unexpected JsonValue type");
        }
    };

    return getValue(v.property);
};


/* schema the program uses -> tyepscript compatible interface */
export const schemaToInterfaceString = (schema: JsonSchematic, spaceLength?: number): string => {
    let schemaInterface = "interface {\n";
    for(const property of schema.properties) {
        schemaInterface += " ".repeat(spaceLength || 4); // spaces not tabs
        schemaInterface += `${property.name}${property.required && "?"}: `;
        // here is where it gets slightly more complex
        if(property.abstract.type === "string" || property.abstract.type === "number" || property.abstract.type === "boolean") {
            schemaInterface += `${property.abstract.type};\n`;
        }
        else if(property.abstract.type === "array") {
            schemaInterface += `${property.abstract.of}[];\n`
        } else { // object case assuming we use object references rather than real {}
            schemaInterface += `${property.name}` // assuming that we have this info already.
            // wait, we can just tie it to another schema, in means of delegation
        }
        // only right for primitives
    }
    schemaInterface += "\n}";
    return "";
}

/* TODO change this */
export const inferSchema = (data: JsonData[]): JsonSchematic|void => {
    // the schema though, is title: string, properties: properties
    // so we're one layer above what it should be.
    // this assumes we're already in the array, it's hard because of how recursive it is
    const schema: JsonSchematic = {
        "title": "title",
        "properties": []
    }
    for(let i = 0; i < data.length; i++) {
        const insertion = data[i];
        if((insertion.property.type === "object")) {
            const properties = getProperties(insertion);
            if(!("error" in properties)) {
                const data: TypeObject = {
                    type: "object",
                    of: properties
                }
                // compare again
                let obj: TypeData = {
                    name: insertion.name,
                    abstract: data,
                    required: false
                }
                // schema.properties = compareSchemas(schema.properties, data.of);
                schema.properties.push();
            }
        } else {
            // maybe throw error, we don't need non objects really
        }
    }
}

// we might want to do this in a separate folder rather than putting all standard functions inside of jsoncraft. schema validation, creation, etc, would be cleaner in a separate file