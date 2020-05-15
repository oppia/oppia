// Code - https://github.com/jiggzson/nerdamer/blob/master/nerdamer.core.js

interface Expression {
    // Returns all variables in the given expression.
    variables: () => string[];

    // Returns the text representation of the expression.
    text: (option: string, n: string) => string;

    // Evaluates the expression into the simplest form.
    evaluate: () => Expression;

    // Returns the numerator of the polynomial.
    numerator: () => Expression;

    // Returns the denominator of the polynomial.
    denominator: () => Expression;

    // Adds two expressions.
    add: (x: string) => Expression;

    // Subtracts two expressions.
    subtract: (x: string) => Expression;

    // Multiplies two expressions.
    multiply: (x: string) => Expression;
    
    // Divides two expressions.
    divides: (x: string) => Expression;

    // Raises one expression to another.
    pow: (x: string) => Expression;

    // Checks for equality of two expressions.
    eq: (x: string) => boolean;

    // Checks if one expression is less than other.
    lt: (x: string) => boolean;

    // Checks if one expression is greater than other.
    gt: (x: string) => boolean;

    // Checks if one expression is less than, or equal to, other.
    lte: (x: string) => boolean;

    // Checks if one expression is greater than, or equal to, other.
    gte: (x: string) => boolean;
}
