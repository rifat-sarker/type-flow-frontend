export const WORD_BANK: string[] = [
  "time","people","year","way","day","thing","man","world","life","hand","part","child","eye",
  "woman","place","work","week","case","point","government","company","number","group","problem",
  "fact","water","room","mother","area","money","story","month","book","result","night","air",
  "fire","earth","student","program","question","state","system","family","idea","head","house",
  "service","friend","father","power","hour","game","line","end","member","law","car","city","name",
  "team","minute","word","face","level","door","history","party","change","morning","reason",
  "research","girl","guy","moment","teacher","force","education","order","truth","voice","art",
  "sample","effect","past","information","policy","matter","market","music","letter","present",
  "wall","effort","value","condition","street","picture","piece","code","light","paper","space",
  "ground","form","event","source","chance","action","stage","record","garden","language","practice",
  "glass","board","forest","river","cloud","stone","bridge","island","mountain","valley","desert",
  "ocean","planet","rocket","engine","signal","pattern","rhythm","circuit","memory","design","future",
  "origin","shadow","mirror","spark","flame","breeze","canvas","current","fabric","gravity","harmony",
  "journey","liberty","meadow","nectar","orbit","pulse","quartz","ripple","serene","tundra","umbrella",
  "velvet","whisper","yonder","zenith",
];

export const QUOTES: string[] = [
  "The quiet hours before dawn often hold the clearest thinking of the entire day.",
  "A well built habit weighs less than the willpower it once took to start it.",
  "Every keyboard shortcut was once a slow and deliberate sequence someone decided to practice.",
  "Good design hides its effort so completely that it looks like it was never hard.",
  "Small consistent steps carry a project further than one enormous burst of energy.",
  "The best tools disappear into the work and let the person focus on the goal.",
  "Curiosity is a renewable resource that grows stronger the more you spend it.",
  "Progress rarely announces itself loudly, it simply shows up one quiet rep at a time.",
];

const PUNCT_MARKS = [",", ".", "!", "?", ";", ":"];

function randWord(): string {
  return WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
}

function decorate(word: string, numbers: boolean, punctuation: boolean): string {
  if (numbers && Math.random() < 0.12) {
    return String(Math.floor(Math.random() * 9000) + 100);
  }
  let w = word;
  if (punctuation) {
    if (Math.random() < 0.14) w = w[0].toUpperCase() + w.slice(1);
    if (Math.random() < 0.16) w += PUNCT_MARKS[Math.floor(Math.random() * PUNCT_MARKS.length)];
  }
  return w;
}

export function generateWords(count: number, numbers = false, punctuation = false): string[] {
  const arr: string[] = [];
  for (let i = 0; i < count; i++) arr.push(decorate(randWord(), numbers, punctuation));
  return arr;
}

export function randomQuoteWords(): string[] {
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  return q.split(" ");
}
