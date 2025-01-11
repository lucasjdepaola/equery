@Jet {
  maxspeed: number; // mph is the standard
  name: string;
  datecreated: @Date; // utc, might be hard to do this, maybe we create a @Date enumerable. might be worthwhile
  maxaltitude: number; // ft
  country: string; // hmm
  location: [number, number] ;// this would be cooler, then we could do country(.location)
}

orderby(.maxspeed) desc limit(10) // top 10 fastest jets
orderby(.maxaltitude) desc limit(10) // top 10 highest jets

// mix of both??
orderby(average(.maxspeed) - .maxspeed + average(.maxaltitude) - .maxaltitude) // need to calculate this cleverly
