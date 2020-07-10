// Code - https://github.com/jiggzson/nerdamer/blob/master/nerdamer.core.js

namespace nerdamer {
  interface Expression {
    // Returns all variables in the given Expression.
    variables: () => string[];

    // Returns the text representation of the Expression.
    text: (option: string, n: string) => string;

    // Evaluates the Expression into the simplest form.
    evaluate: () => Expression;

    // Returns the numerator of the polynomial.
    numerator: () => Expression;

    // Returns the denominator of the polynomial.
    denominator: () => Expression;

    // Adds two Expressions.
    add: (x: string) => Expression;

    // Subtracts two Expressions.
    subtract: (x: string) => Expression;

    // Multiplies two Expressions.
    multiply: (x: string) => Expression;

    // Divides two Expressions.
    divide: (x: string) => Expression;

    // Raises one Expression to another.
    pow: (x: string) => Expression;

    // Checks for equality of two Expressions.
    eq: (x: string) => boolean;

    // Checks if one Expression is less than other.
    lt: (x: string) => boolean;

    // Checks if one Expression is greater than other.
    gt: (x: string) => boolean;

    // Checks if one Expression is less than, or equal to, other.
    lte: (x: string) => boolean;

    // Checks if one Expression is greater than, or equal to, other.
    gte: (x: string) => boolean;

    // Expands the Expression.
    expand: () => Expression;
  }
}
