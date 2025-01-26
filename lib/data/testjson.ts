import { JsonData, JsonSchematic, TypedJson } from "../jsoncraft"
import data from "../datasets/tidy.json"
import tweets from "../datasets/congress.json"

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

// we want some sort of way to auto complete things like this for the user experience
// just make the value : JSON and type it, we don't have to build a json parser for this

interface ScrapedTweet {
    id: number;
    lang: string;
    text: string;
    name: string;
    source: string;
    created_at: string;
}

interface TweetDataset {
    id: string;
    screen_name: string;
    time: string;
    link: string;
    text: string;
    source: string;
    user_id: string;
}

// export const tweetdata: ScrapedTweet[] = data;
export const tweetdata: TweetDataset[] = tweets;
