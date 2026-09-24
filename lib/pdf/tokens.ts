/**
 * Structured pieces of a printed question/answer. Problem types build these
 * directly, so the PDF never has to parse strings back into math.
 */
export type Token =
  | { t: "num"; v: string }
  | { t: "op"; v: string }
  | { t: "frac"; n: number; d: number }
  | { t: "blank"; style: "line" | "paren"; suffix?: string }
  | { t: "text"; v: string };

export const num = (v: number | string): Token => ({ t: "num", v: String(v) });
export const op = (v: string): Token => ({ t: "op", v });
export const text = (v: string): Token => ({ t: "text", v });
export const line = (suffix?: string): Token => ({ t: "blank", style: "line", suffix });
export const paren = (): Token => ({ t: "blank", style: "paren" });

/** Fraction token; whole numbers (d = 1) render as plain numbers */
export const frac = (n: number, d: number): Token => (d === 1 ? num(n) : { t: "frac", n, d });

/** Answer lists like "4, 5, 6" */
export const list = (values: (number | string)[]): Token[] =>
  values.map((v, i) => num(i < values.length - 1 ? `${v},` : v));

export function plainText(tokens: Token[]): string {
  return tokens
    .map((tk) => {
      switch (tk.t) {
        case "frac":
          return `${tk.n}/${tk.d}`;
        case "blank":
          return (tk.style === "paren" ? "(      )" : "______") + (tk.suffix ?? "");
        default:
          return tk.v;
      }
    })
    .join(" ");
}
