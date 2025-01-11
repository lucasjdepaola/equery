@HistoricalEvent {
  title: string;
  date: number; // utc date
  significance: 1-5; // 1-5 rating (could make simpler)
  description: string; // we'll parse long text containing new lines as markdown
  coordinates: [number, number] // if we get this far, use the coordinates like this, if not, don't bother
}

.coordinates: .significance > 4;

month(.date) = thismonth() & day(.date) = thisday() // can change
today(.date) // trivializing it
// could do it with birthdays as well, really nice for "what happened today"
