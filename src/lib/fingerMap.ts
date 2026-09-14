// finger id: L5=left pinky, L4=left ring, L3=left middle, L2=left index, L1=left thumb
// mirrored on the right: R2..R5, R1=right thumb. "THUMB" presses both thumbs (space bar).
export const FINGER_MAP: Record<string, string> = {
  "`": "L5", "1": "L5", q: "L5", a: "L5", z: "L5", tab: "L5", capslock: "L5", shiftleft: "L5",
  "2": "L4", w: "L4", s: "L4", x: "L4",
  "3": "L3", e: "L3", d: "L3", c: "L3",
  "4": "L2", "5": "L2", r: "L2", t: "L2", f: "L2", g: "L2", v: "L2", b: "L2",
  "6": "R2", "7": "R2", y: "R2", u: "R2", h: "R2", j: "R2", n: "R2", m: "R2",
  "8": "R3", i: "R3", k: "R3", ",": "R3",
  "9": "R4", o: "R4", l: "R4", ".": "R4",
  "0": "R5", "-": "R5", "=": "R5", p: "R5", "[": "R5", "]": "R5", "\\": "R5",
  ";": "R5", "'": "R5", "/": "R5", enter: "R5", shiftright: "R5", backspace: "R5",
  " ": "THUMB",
};

export type KeySpec = [label: string, code: string, widthClass?: string];

export const KB_ROWS: KeySpec[][] = [
  [["esc", "esc"], ["`", "`"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["0", "0"], ["-", "-"], ["=", "="], ["delete", "backspace", "w15"]],
  [["tab", "tab", "w15"], ["q", "q"], ["w", "w"], ["e", "e"], ["r", "r"], ["t", "t"], ["y", "y"], ["u", "u"], ["i", "i"], ["o", "o"], ["p", "p"], ["[", "["], ["]", "]"], ["\\", "\\", "w15"]],
  [["caps", "capslock", "w175"], ["a", "a"], ["s", "s"], ["d", "d"], ["f", "f"], ["g", "g"], ["h", "h"], ["j", "j"], ["k", "k"], ["l", "l"], [";", ";"], ["'", "'"], ["enter", "enter", "w225"]],
  [["shift", "shiftleft", "w225"], ["z", "z"], ["x", "x"], ["c", "c"], ["v", "v"], ["b", "b"], ["n", "n"], ["m", "m"], [",", ","], [".", "."], ["/", "/"], ["shift", "shiftright", "w225"]],
  [["ctrl", "control", "w15"], ["opt", "alt", "w15"], ["cmd", "meta", "w15"], ["", "space", "wspace"], ["cmd", "meta", "w15"], ["opt", "alt", "w15"], ["ctrl", "control", "w15"]],
];

export function codeFromKeyboardEvent(e: KeyboardEvent): string {
  if (e.key === " ") return " ";
  if (e.key === "Backspace") return "backspace";
  if (e.key === "Tab") return "tab";
  if (e.key === "Enter") return "enter";
  if (e.key === "CapsLock") return "capslock";
  if (e.key === "Shift") return e.code === "ShiftLeft" ? "shiftleft" : "shiftright";
  if (e.key === "Control") return "control";
  if (e.key === "Alt") return "alt";
  if (e.key === "Meta") return "meta";
  if (e.key === "Escape") return "esc";
  return e.key.toLowerCase();
}
