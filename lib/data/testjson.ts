import { JsonData, JsonSchematic, TypedJson } from "../jsoncraft"
import data from "../datasets/tidy.json"
import tweets from "../datasets/congress.json"
import nfl from "../datasets/nfl.json"

// we want some sort of way to auto complete things like this for the user experience
// just make the value : JSON and type it, we don't have to build a json parser for this

interface TweetDataset {
    id: string;
    screen_name: string;
    time: string;
    link: string;
    text: string;
    source: string;
    user_id: string;
}

interface NflDataset {
    season: number;
    season_type: string;
    game_week: string;
    team_abb: string;
    player_id: number;
    name_short: string;
    rank: number;
    qbr_total: number;
    pts_added: number;
    qb_plays: number;
    epa_total: number;
    pass: number;
    run: number;
    exp_sack: number;
    penalty: number;
    qbr_raw: number;
    sack: number
    name_first: string;
    name_last: string;
    name_display: string;
    headshot_href: string;
    team: string;
    qualified: string;
}

// export const tweetdata: ScrapedTweet[] = data;
export const tweetdata: TweetDataset[] = tweets;
export const nfldata: NflDataset[] | {}[] = nfl;