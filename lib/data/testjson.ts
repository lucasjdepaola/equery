import { JsonData, JsonSchematic, TypedJson } from "../jsoncraft"

const tweetschema: JsonSchematic = {
    title: "tweet",
    properties: [
        {
            name: "username",
            abstract: {type: "string"},
            required: true
        },
        {
            name: "likes",
            abstract: {type: "number"},
            required: true
        },
        {
            name: "retweets",
            abstract: {type: "number"},
            required: true
        },
        {
            name: "replies",
            abstract: {type: "object", of: []},
            required: true
        },
        {
            name: "date",
            abstract: {type: "number"},
            required: true
        },
        {
            name: "text",
            abstract: {type: "string"},
            required: true
        },
        {
            name: "image",
            abstract: {type: "string"},
            required: false
        },
        {
            name: "video",
            abstract: {type: "string"}, // link
            required: false
        },
    ]
}
// @Tweet {
//     username: string;
//     user: @User;
//     likes: number;
//     retweets: number;
//     replies: @Tweet[];
//     date: number; // or string, or whatever, perhaps not a string for real queries
//     text: string; // tweet text
//     image?: string; // link to image
//     video?: string; // link to video
//   }

const userschema: JsonSchematic = {
    title: "user",
    properties: [
        {
            name: "username",
            abstract: {type: "string"},
            required: true
        },
    ]
}

interface Tweet {
    username: string;
    likes: number;
    retweets: number;
    date: number;
    replies: Tweet[];
    text: string;
    image?: string;
    video?: string;
}

interface Person {
    name: string;
    age: number;
    isMarried: boolean;
    spouse?: Person;
    birthday?: number; // utc, or you could do it as a string, either way
}

// we want some sort of way to auto complete things like this for the user experience
// just make the value : JSON and type it, we don't have to build a json parser for this
const data: Tweet[] | {}[] = [
    { // we'd use the auto generated interface for this
        username: "lucas",
        likes: 10,
        retweets: 10,
        date: new Date("1996-06-06").getUTCDate(),
        replies: [],
        text: "this is a test tweet",
    }
]

// export const tweetExamples: TypedJson = {
//     type: userschema,
//     // data: data
// }