export type LanguageId = "english" | "bangla" | "spanish" | "french" | "german" | "code";

export interface Language {
  id: LanguageId;
  label: string;
  /** Rendered right-to-left? (none of these are, but the flag keeps it honest) */
  words: string[];
}

const ENGLISH_EXTRA: string[] = []; // English uses the main WORD_BANK

const BANGLA = `আমি তুমি সে আমরা তোমরা তারা এই সেই কি কেন কোথায় কখন কেমন ভালো মন্দ বড় ছোট নতুন পুরনো
দিন রাত সকাল বিকাল সন্ধ্যা মানুষ ছেলে মেয়ে বাবা মা ভাই বোন বন্ধু শিক্ষক ছাত্র বাড়ি ঘর দরজা জানালা
পানি আগুন মাটি বাতাস আকাশ মেঘ বৃষ্টি রোদ গাছ ফুল ফল পাখি নদী সাগর পাহাড় রাস্তা শহর গ্রাম দেশ
বই কলম কাগজ চেয়ার টেবিল খাবার ভাত মাছ ডাল চা দুধ কাজ সময় বছর মাস সপ্তাহ টাকা খুশি দুঃখ ভালোবাসা`
  .split(/\s+/)
  .filter(Boolean);

const SPANISH = `el la de que y en un ser se no haber por con su para como estar tener le lo todo pero más
hacer poder decir este ir otro ese si me ya ver porque dar cuando muy sin vez mucho saber qué sobre mi
alguno mismo yo también hasta año dos querer entre así primero desde grande casa tiempo vida mano
día mundo trabajo agua parte hombre mujer país nuevo bueno` .split(/\s+/).filter(Boolean);

const FRENCH = `le de un être et en avoir que pour dans ce il qui ne sur se pas plus pouvoir par je
avec tout faire son mettre autre on mais nous comme prendre leur temps très savoir falloir voir en
vouloir bien où sans tu ou monde jour homme femme enfant chose vie main pays eau maison travail
grand petit bon nouveau premier dernier même autre`.split(/\s+/).filter(Boolean);

const GERMAN = `der die das und in zu den von sie mit nicht ist des sich auf für an dem dass er es ein
ich werden aus haben wie nach bei um noch wenn nur über wir was sein wird man aber mehr also durch
jahr zeit mensch hand tag kind frau mann leben haus stadt land wasser arbeit welt teil auge frage
gut groß klein neu alt lang hoch`.split(/\s+/).filter(Boolean);

// Symbol-heavy drill for developers - the punctuation most people are slowest on.
const CODE = `const let var function return if else for while class import export default async await
try catch throw new this null undefined true false () => {} [] === !== && || ?? ?. <div> </div> props
useState useEffect map filter reduce push length string number boolean interface type extends
public private static void int String List Map null; i++ x=>x arr[0] obj.key "text" 'char' \`tpl\``
  .split(/\s+/)
  .filter(Boolean);

export const LANGUAGES: Language[] = [
  { id: "english", label: "English", words: ENGLISH_EXTRA },
  { id: "bangla", label: "বাংলা", words: BANGLA },
  { id: "spanish", label: "Español", words: SPANISH },
  { id: "french", label: "Français", words: FRENCH },
  { id: "german", label: "Deutsch", words: GERMAN },
  { id: "code", label: "Code", words: CODE },
];

export function getLanguage(id: LanguageId): Language {
  return LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];
}
