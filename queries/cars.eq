@Car {
  name: string;
  brand: @Brand; // if we want
  cost: number; // in usd standard
  year: number; // don't make this a utc
  new: boolean;
  class: "sports" | "sedan" | "suv"; // etc
}


// note: we could also have conversion functions like currency("btc", 126) dollars to btc

//

.name: .cost = max(.cost) // find the most expensive car

.new & year > 2000 & class = "sedan" & brand.name = "bmw" // see how you can find whatever you want.

.class = "sports" ~ orderby(.cost) desc limit(100)
