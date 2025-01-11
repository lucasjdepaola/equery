@Tweet {
  username: string;
  user: @User;
  likes: number;
  retweets: number;
  replies: @Tweet[];
  date: number; // or string, or whatever, perhaps not a string for real queries
  text: string; // tweet text
  image?: string; // link to image
  video?: string; // link to video
}

@User {
  username: string;
  bio: string;
  pfp: string; // we don't really need this, but we'll add
  location?: string;
  followers: @User[];
  following: @User[];
  tweets: @Tweet[]; // introduces foreign key concept (but not really)
  replies: @Tweet[]; // or we could change to @Reply, but doesn't really matter
  joined: number; // joined date utc
}

// find a user's most liked tweet (this introduces a new querying concept)
// we need to find a way to query child properties of one singular person
@Tweet: orderby(.likes) desc limit(1)

// or
.username = "jack" ~ orderby(.likes) desc limit(1) // if we know the user in mind

// find the oldest tweet to exist
orderby(.date) asc limit(1)

// find tweets containing certain content

contains(.tweet, "hello" & "world") // could this work?
// there's more to this than you realize.

// get a random username using an aggregate property
.username: username = random(.username) // we query a random property with the random function (can use for random things)

length(.username) < 4 // find short usernames list

// first time elon musk mentioned the word tesla on twitter
.username = "elonmusk" & contains(.tweet, "tesla") ~ orderby(.date) desc limit(10)

// find the longest ever tweet
length(.tweet) = max(length(.tweet)) ~ limit(10) // do we want no orderby function?

max(length(.tweet)) // this should also work (we need plain types that aren't explicitly objects)

.username = min(length(.username))

// we can always keep the queries saved too, which helps a lot
// if we scraped twitter data, the queries would likely be @User based
// if we really wanted, we could create property queries like @Tweet[] => .username = this.username

// find the most liked tweets containing your name
contains(.tweet, "lucas") ~ orderby(.likes) desc limit(10)

