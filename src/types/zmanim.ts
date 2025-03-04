export interface ZmanimTime {
  [date: string]: string;
}

export interface ZmanimData {
  times: {
    [key: string]: ZmanimTime;
  };
  date: {
    start: string;
    end: string;
  };
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
}

export interface ZmanOption {
  id: string;
  label: string;
  category: 'morning' | 'afternoon' | 'evening' | 'night';
}

export const ZMANIM_OPTIONS: ZmanOption[] = [
  { id: "alotHaShachar", label: "Alot HaShachar", category: 'morning' },
  { id: "misheyakir", label: "Misheyakir", category: 'morning' },
  { id: "sunrise", label: "Sunrise", category: 'morning' },
  { id: "sofZmanShma", label: "Sof Zman Shma", category: 'morning' },
  { id: "sofZmanTfilla", label: "Sof Zman Tfilla", category: 'morning' },
  { id: "chatzot", label: "Chatzot", category: 'afternoon' },
  { id: "minchaGedola", label: "Mincha Gedola", category: 'afternoon' },
  { id: "minchaKetana", label: "Mincha Ketana", category: 'afternoon' },
  { id: "plagHaMincha", label: "Plag HaMincha", category: 'afternoon' },
  { id: "sunset", label: "Sunset", category: 'evening' },
  { id: "tzeit42min", label: "Tzeit 42 min", category: 'night' },
  { id: "tzeit72min", label: "Tzeit 72 min", category: 'night' }
];
