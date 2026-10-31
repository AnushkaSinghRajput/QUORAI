const STOPWORDS = new Set(
  (
    "a an and are as at be been being but by can could did do does for from had has have " +
    "he her his how i if in into is it its may might more most must no not of on or our " +
    "out over she should so such than that the their them then there these they this " +
    "those through to too under up us very was we were what when where which while who " +
    "why will with would you your about also any each other only same some just own " +
    "between both after before during against among per via within without across"
  ).split(" "),
);

function stem(word: string) {
  if (word.length > 5 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && word.endsWith("ed")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) {
    return word.slice(0, -1);
  }
  return word;
}

/** Lowercased, stop-word-free, lightly stemmed content tokens. */
export function contentTokens(text: string): string[] {
  const words = text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu) ?? [];
  const tokens: string[] = [];
  for (const raw of words) {
    const word = raw.replace(/['-]+$/g, "");
    if (word.length < 3 && !/^\d+$/.test(word)) continue;
    if (STOPWORDS.has(word)) continue;
    tokens.push(stem(word));
  }
  return tokens;
}

/** Numbers that carry meaning in a claim (years, percentages, amounts). */
export function numericTokens(text: string): string[] {
  return (text.match(/\d+(?:[.,]\d+)?%?/g) ?? [])
    .map((value) => value.replace(/,/g, ""))
    .filter((value) => value.replace(/\D/g, "").length >= 2);
}
