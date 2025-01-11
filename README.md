# Equery

Equery is the most intuitive way to query typed json patterns

## Syntax

The syntax for this language is extremely simplistic, meant for human language -> language models -> equery pipeline.

assume an object with the structure as follows

```
@Person {
  age: number;
  name: string;
  isMarried: boolean;
  spouse: @Person; // can reference recursively
}
```

We can now query this data in an intuitive and flexible way using equery, assuming we have a lot of people inside our list.

Equery has 3 basic phases: the scope phase, the condition phase, and the ordering phase.
```
.name: .age > 25 ~ orderby(.age) desc // find all people by name over age 25
```

```
.age = max(.age) // find the oldest person object
```
Notice we have aggregate functions, and we can also omit any phase without any problems.

```
orderby(.spouse.age)
```
Notice we can also reference potentially nonexistent objects, this is by design.

The basic pattern to equery is
scope phase - .properties, .in, .a, .comma.separated, .list:
condition phase - .someproperty = "someliteral" | .someproperty > average(.someproperty)
ordering phase - orderby(.someproperty) asc or desc limit(number)

After this, it all boils down to native functions that are implemented for the users to query data easier.
For example, dates are UTC standardized, so one might use the native function:
```
length(.tweet) < 250 & .date < utc("5-23-2009")
```

## Purpose

The purpose of this language is to provide an easy way to query declarative data in a modular manner. Think about setting up a database, the process typically takes a few hours to properly set up, create tables, and manage data. Would you use this database to manage notes? Manage data science related data? Probably not. Databases by design are for industrial corporate purposes, with SQL not exactly friendly way to query such data. This language is complimentary with an interface/app to build or insert the data in a type-safe fashion. This way, we have a large list of type-following data, in a declarative and modular fashion, which can be queried using equery, or natural language which can translate to equery.

