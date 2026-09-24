/**
 * A simple Fraction class to handle arithmetic and string representation.
 */
export class Fraction {
  numerator: number;
  denominator: number;

  constructor(numerator: number, denominator: number) {
    if (denominator === 0) {
      throw new Error("Denominator cannot be zero");
    }
    this.numerator = numerator;
    this.denominator = denominator;
    this.simplify();
  }

  // Greatest Common Divisor
  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  // Simplify the fraction
  private simplify() {
    const common = this.gcd(Math.abs(this.numerator), Math.abs(this.denominator));
    this.numerator /= common;
    this.denominator /= common;
    
    // Ensure negative sign is on numerator
    if (this.denominator < 0) {
      this.numerator = -this.numerator;
      this.denominator = -this.denominator;
    }
  }

  add(other: Fraction): Fraction {
    return new Fraction(
      this.numerator * other.denominator + other.numerator * this.denominator,
      this.denominator * other.denominator
    );
  }

  subtract(other: Fraction): Fraction {
    return new Fraction(
      this.numerator * other.denominator - other.numerator * this.denominator,
      this.denominator * other.denominator
    );
  }

  multiply(other: Fraction): Fraction {
    return new Fraction(
      this.numerator * other.numerator,
      this.denominator * other.denominator
    );
  }

  divide(other: Fraction): Fraction {
    if (other.numerator === 0) {
      throw new Error("Cannot divide by zero fraction");
    }
    return new Fraction(
      this.numerator * other.denominator,
      this.denominator * other.numerator
    );
  }

  // Check if result is an integer
  isInteger(): boolean {
    return this.denominator === 1;
  }

  toLatex(): string {
     if (this.denominator === 1) return `${this.numerator}`;
     return `\\frac{${this.numerator}}{${this.denominator}}`;
  }

  toString(): string {
    if (this.denominator === 1) return `${this.numerator}`;
    return `${this.numerator}/${this.denominator}`;
  }
}
