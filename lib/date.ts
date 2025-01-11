/*
handle all date parsing within equery.
needs to be abstract enough to handle all formats of dates.
*/

enum DateTypes {
    mmddyyyy, ddmmyyyy, yyyy, yyyymmdd
}
type Month = number;
type Day = number;
type Year = number;
interface QuasiDate {
    month: Month; // have a correct date check to ensure that the date is correct
    day: Day;
    year: Year;
}

const mmddyystr = (mmddyy: string): DateTypes => {
    /// "mmddyyyy" "mdy" "dmy" "ymd" "mm/yy/dd", etc
    const m = mmddyy.indexOf("m");
    const d = mmddyy.indexOf("d");
    const y = mmddyy.indexOf("y");
    if(m < d && d < y) {
        return DateTypes.mmddyyyy;
    }
    if(d < m && m < y) {
        return DateTypes.ddmmyyyy;
    }
    if(y < m && m < d) {
        return DateTypes.yyyymmdd;
    }
    return DateTypes.ddmmyyyy;// default case if wrong
}

const parseFrom = (date: string, format: DateTypes): QuasiDate|void => {
    const piecedDate = date.split("-"); // for now
    if(format === DateTypes.mmddyyyy) {
        // split in either 07-22-1998 07/22/1998
        const [smonth, sday, syear] = piecedDate;
        const [month, day, year] = [parseInt(smonth), parseInt(sday), parseInt(syear)];
        return {
            month, day, year
        }
    }
}

export const parseDate = (date: string): number => { // return a number in utc formatting
    return -1;
}