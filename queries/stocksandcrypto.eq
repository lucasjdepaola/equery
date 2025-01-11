@Commodity {
  name: string;
  price: string; // link, we need this to be something like @"https://" to ensure it's really a link to an api
  ticker: string;
}

so say we do it like this
price: "https://coingecko.com/xrp"

then we find the type

.price: .name = "bitcoin"
