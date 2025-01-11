@Person {
  birthday: number; // or @Date
  firstname: string;
  middle?: string;
  lastname: string;
  socialmedia?: @SocialMedia
  children?: @Person[]
}
// if a native object changes, we could move it to @Legacy, so @Legacy.date, i dont know

objectname -> [at, word]
objectcontents -> [lbrace, property[], rbrace]
property -> [word, questionmark?, word|objectname, semicolon]

scope -> [[property, comma][], colon]
condition -> [expression]
orderby -> [~?, orderby(expression)?, asc|desc?, limit(number)?]
