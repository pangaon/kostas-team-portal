// Central sport registry — terminology, periods, roster size, positions,
// playing surface, and formation layouts. Drives the whole app.

export type PeriodType = "Half" | "Quarter" | "Period" | "Inning" | "Set";
export type Surface = "pitch" | "court" | "rink" | "diamond";
export type Slot = { pos: string; x: number; y: number };

export type SportConfig = {
  id: string; label: string; emoji: string;
  noun: "game" | "match";
  scoreTerm: string; scoreEmoji: string;
  onField: number;
  periodType: PeriodType; periodCount: number; defaultPeriodMin: number; timed: boolean;
  positions: string[];
  surface: Surface;
  formations: Record<string, Slot[]>;
};

const F_SOCCER8: Record<string, Slot[]> = {
  "3-3-1": [{pos:"GK",x:50,y:92},{pos:"DEF",x:22,y:72},{pos:"DEF",x:50,y:75},{pos:"DEF",x:78,y:72},{pos:"MID",x:22,y:46},{pos:"MID",x:50,y:48},{pos:"MID",x:78,y:46},{pos:"FWD",x:50,y:18}],
  "2-3-2": [{pos:"GK",x:50,y:92},{pos:"DEF",x:34,y:74},{pos:"DEF",x:66,y:74},{pos:"MID",x:20,y:48},{pos:"MID",x:50,y:50},{pos:"MID",x:80,y:48},{pos:"FWD",x:36,y:20},{pos:"FWD",x:64,y:20}],
  "2-4-1": [{pos:"GK",x:50,y:92},{pos:"DEF",x:34,y:74},{pos:"DEF",x:66,y:74},{pos:"MID",x:18,y:48},{pos:"MID",x:40,y:50},{pos:"MID",x:60,y:50},{pos:"MID",x:82,y:48},{pos:"FWD",x:50,y:18}],
  "3-2-2": [{pos:"GK",x:50,y:92},{pos:"DEF",x:22,y:74},{pos:"DEF",x:50,y:76},{pos:"DEF",x:78,y:74},{pos:"MID",x:36,y:50},{pos:"MID",x:64,y:50},{pos:"FWD",x:36,y:20},{pos:"FWD",x:64,y:20}],
  "3-1-3": [{pos:"GK",x:50,y:92},{pos:"DEF",x:22,y:74},{pos:"DEF",x:50,y:76},{pos:"DEF",x:78,y:74},{pos:"MID",x:50,y:52},{pos:"FWD",x:22,y:22},{pos:"FWD",x:50,y:18},{pos:"FWD",x:78,y:22}],
};
const F_SOCCER11: Record<string, Slot[]> = {
  "4-4-2": [{pos:"GK",x:50,y:93},{pos:"DEF",x:18,y:76},{pos:"DEF",x:39,y:78},{pos:"DEF",x:61,y:78},{pos:"DEF",x:82,y:76},{pos:"MID",x:18,y:50},{pos:"MID",x:39,y:52},{pos:"MID",x:61,y:52},{pos:"MID",x:82,y:50},{pos:"FWD",x:38,y:22},{pos:"FWD",x:62,y:22}],
  "4-3-3": [{pos:"GK",x:50,y:93},{pos:"DEF",x:18,y:76},{pos:"DEF",x:39,y:78},{pos:"DEF",x:61,y:78},{pos:"DEF",x:82,y:76},{pos:"MID",x:30,y:52},{pos:"MID",x:50,y:55},{pos:"MID",x:70,y:52},{pos:"FWD",x:22,y:24},{pos:"FWD",x:50,y:20},{pos:"FWD",x:78,y:24}],
};
const F_BASKETBALL: Record<string, Slot[]> = {
  "Standard": [{pos:"PG",x:50,y:78},{pos:"SG",x:18,y:58},{pos:"SF",x:82,y:58},{pos:"PF",x:30,y:30},{pos:"C",x:55,y:20}],
  "Small ball": [{pos:"PG",x:38,y:76},{pos:"SG",x:62,y:76},{pos:"SF",x:20,y:46},{pos:"PF",x:80,y:46},{pos:"C",x:50,y:22}],
};
const F_HOCKEY: Record<string, Slot[]> = {
  "Even strength": [{pos:"G",x:50,y:92},{pos:"D",x:35,y:72},{pos:"D",x:65,y:72},{pos:"LW",x:24,y:34},{pos:"C",x:50,y:26},{pos:"RW",x:76,y:34}],
};
const F_BASEBALL: Record<string, Slot[]> = {
  "Standard": [{pos:"P",x:50,y:58},{pos:"C",x:50,y:86},{pos:"1B",x:70,y:54},{pos:"2B",x:60,y:40},{pos:"SS",x:40,y:40},{pos:"3B",x:30,y:54},{pos:"LF",x:24,y:20},{pos:"CF",x:50,y:12},{pos:"RF",x:76,y:20}],
};
const F_VOLLEY: Record<string, Slot[]> = {
  "Rotation": [{pos:"OH",x:25,y:30},{pos:"MB",x:50,y:24},{pos:"OPP",x:75,y:30},{pos:"OH",x:25,y:62},{pos:"L",x:50,y:70},{pos:"S",x:75,y:62}],
};

export const SPORTS: Record<string, SportConfig> = {
  soccer8: { id:"soccer8", label:"Soccer (8v8)", emoji:"⚽", noun:"game", scoreTerm:"Goal", scoreEmoji:"⚽", onField:8, periodType:"Half", periodCount:2, defaultPeriodMin:25, timed:true, positions:["GK","DEF","MID","FWD"], surface:"pitch", formations:F_SOCCER8 },
  soccer11:{ id:"soccer11", label:"Soccer (11v11)", emoji:"⚽", noun:"match", scoreTerm:"Goal", scoreEmoji:"⚽", onField:11, periodType:"Half", periodCount:2, defaultPeriodMin:45, timed:true, positions:["GK","DEF","MID","FWD"], surface:"pitch", formations:F_SOCCER11 },
  basketball:{ id:"basketball", label:"Basketball", emoji:"🏀", noun:"game", scoreTerm:"Basket", scoreEmoji:"🏀", onField:5, periodType:"Quarter", periodCount:4, defaultPeriodMin:10, timed:true, positions:["PG","SG","SF","PF","C"], surface:"court", formations:F_BASKETBALL },
  hockey:{ id:"hockey", label:"Hockey", emoji:"🏒", noun:"game", scoreTerm:"Goal", scoreEmoji:"🥅", onField:6, periodType:"Period", periodCount:3, defaultPeriodMin:20, timed:true, positions:["G","D","LW","C","RW"], surface:"rink", formations:F_HOCKEY },
  baseball:{ id:"baseball", label:"Baseball / Softball", emoji:"⚾", noun:"game", scoreTerm:"Run", scoreEmoji:"⚾", onField:9, periodType:"Inning", periodCount:7, defaultPeriodMin:0, timed:false, positions:["P","C","1B","2B","3B","SS","LF","CF","RF"], surface:"diamond", formations:F_BASEBALL },
  volleyball:{ id:"volleyball", label:"Volleyball", emoji:"🏐", noun:"match", scoreTerm:"Point", scoreEmoji:"🏐", onField:6, periodType:"Set", periodCount:5, defaultPeriodMin:0, timed:false, positions:["S","OH","MB","OPP","L"], surface:"court", formations:F_VOLLEY },
};

export const SPORT_OPTIONS = Object.values(SPORTS).map((s) => ({ value: s.label, label: `${s.emoji} ${s.label}`, id: s.id }));

export function sportFromString(sport?: string | null): SportConfig {
  const t = (sport ?? "").toLowerCase();
  if (t.includes("11")) return SPORTS.soccer11;
  if (t.includes("basket")) return SPORTS.basketball;
  if (t.includes("hock")) return SPORTS.hockey;
  if (t.includes("base") || t.includes("soft")) return SPORTS.baseball;
  if (t.includes("volley")) return SPORTS.volleyball;
  return SPORTS.soccer8;
}
export function ordinal(n: number): string { const s=["th","st","nd","rd"],v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); }
