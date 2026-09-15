// Progressive touch-typing course. Each lesson unlocks a few new keys and drills
// them against the keys already learned, which is how typing courses actually
// build muscle memory - random words from the full keyboard don't teach anything.

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  /** Keys introduced by this lesson. */
  newKeys: string[];
  /** Everything typeable in this lesson (new keys + everything before). */
  chars: string[];
  /** Real words drilled once enough letters are known. */
  words?: string[];
}

function lettersOf(...groups: string[][]): string[] {
  return groups.flat();
}

const HOME_LEFT = ["a", "s", "d", "f"];
const HOME_RIGHT = ["j", "k", "l", ";"];
const HOME = lettersOf(HOME_LEFT, HOME_RIGHT);
const HOME_EXT = lettersOf(HOME, ["g", "h"]);
const TOP = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
const BOTTOM = ["z", "x", "c", "v", "b", "n", "m"];
const ALL_LETTERS = lettersOf(HOME_EXT, TOP, BOTTOM).filter((c) => c !== ";");

export const LESSONS: Lesson[] = [
  {
    id: "home-left",
    title: "Home row — left hand",
    subtitle: "a s d f — where your left fingers rest",
    newKeys: HOME_LEFT,
    chars: HOME_LEFT,
  },
  {
    id: "home-right",
    title: "Home row — right hand",
    subtitle: "j k l ; — where your right fingers rest",
    newKeys: HOME_RIGHT,
    chars: HOME_RIGHT,
  },
  {
    id: "home-both",
    title: "Home row — both hands",
    subtitle: "Put all eight fingers together",
    newKeys: [],
    chars: HOME,
    words: ["as", "ask", "all", "fall", "lad", "sad", "dad", "salad", "flask", "alfalfa", "aka", "jak"],
  },
  {
    id: "home-gh",
    title: "Reaching for G and H",
    subtitle: "Index fingers stretch inward",
    newKeys: ["g", "h"],
    chars: HOME_EXT,
    words: ["gash", "half", "glad", "flash", "shall", "haggle", "ghala", "dash", "glass", "shag"],
  },
  {
    id: "top-row",
    title: "Top row",
    subtitle: "q w e r t y u i o p",
    newKeys: TOP,
    chars: lettersOf(HOME_EXT, TOP),
    words: ["there", "quiet", "power", "write", "sport", "type", "quite", "letter", "output", "spirit"],
  },
  {
    id: "bottom-row",
    title: "Bottom row",
    subtitle: "z x c v b n m",
    newKeys: BOTTOM,
    chars: ALL_LETTERS,
    words: ["move", "zebra", "climb", "vacant", "number", "combine", "maximize", "brave", "vomit"],
  },
  {
    id: "all-letters",
    title: "Whole alphabet",
    subtitle: "Every letter, mixed together",
    newKeys: [],
    chars: ALL_LETTERS,
    words: [
      "quick", "brown", "jumps", "lazy", "vexing", "zephyr", "quartz", "rhythm",
      "keyboard", "practice", "muscle", "memory", "accuracy", "steady", "flowing",
    ],
  },
  {
    id: "capitals",
    title: "Capitals & Shift",
    subtitle: "Hold Shift with the opposite hand",
    newKeys: ["Shift"],
    chars: ALL_LETTERS,
    words: [
      "The", "Quick", "Brown", "Fox", "Jumps", "Over", "Lazy", "Dog",
      "Monday", "London", "Sarah", "Kevin", "April", "Friday",
    ],
  },
  {
    id: "punctuation",
    title: "Punctuation",
    subtitle: "Commas, periods and friends",
    newKeys: [",", ".", "?", "!", "'"],
    chars: ALL_LETTERS.concat([",", ".", "?", "!", "'"]),
    words: [
      "yes,", "no.", "why?", "wow!", "don't", "it's", "well,", "stop.", "really?",
      "can't", "sure,", "okay.", "hey!", "won't",
    ],
  },
  {
    id: "numbers",
    title: "Number row",
    subtitle: "1 through 0",
    newKeys: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    chars: ALL_LETTERS.concat("1234567890".split("")),
    words: ["2024", "365", "1990", "42", "108", "7500", "2026", "13", "99", "2048"],
  },
  {
    id: "everything",
    title: "Full keyboard",
    subtitle: "Letters, capitals, punctuation and numbers together",
    newKeys: [],
    chars: ALL_LETTERS.concat("1234567890".split(""), [",", ".", "?", "!", "'"]),
    words: [
      "The", "meeting", "starts", "at", "9:30", "sharp.", "Don't", "be", "late!",
      "In", "2026", "we", "typed", "120", "words", "per", "minute.", "Ready?",
    ],
  },
];

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Drill text for a lesson: random letter groups early on (before enough letters
 * exist to form words), real words once the lesson defines them.
 */
export function generateLessonWords(lesson: Lesson, count = 30): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    // Mix in real words where available so it doesn't stay pure gibberish.
    if (lesson.words && lesson.words.length && Math.random() < 0.65) {
      out.push(randomFrom(lesson.words));
      continue;
    }
    const len = 3 + Math.floor(Math.random() * 3);
    let chunk = "";
    for (let j = 0; j < len; j++) chunk += randomFrom(lesson.chars);
    out.push(chunk);
  }
  return out;
}
