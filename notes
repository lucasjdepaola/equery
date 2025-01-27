typescript/javascript chaining for an array that conforms to a certain interface

example:
interface Person {
  age: number;
  name: string;
  birthday: number; // etc
}

const people: Person[] = getPeople(); // get some arbitrary people data
people.equery('.name = "lucas" & .age > 20'); // returns proper array filtration and ordering

not the main purpose, but would still be a great tool to have

(introduces join type)

join -> variadic object joining if types are similar
join(@Corvids, @Raptors) as @Birds // something like this, though not needed


we should implement set theory and call it say union, instead of join()
for example: union(@corvid, @raptors), or we could assume we implement the parent first, and we do @Corvids = .type = "corvid" as a more abstract way to create these schemas
