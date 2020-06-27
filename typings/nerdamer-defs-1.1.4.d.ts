// Code - https://github.com/jiggzson/nerdamer/blob/master/nerdamer.core.js

interface MathExpr {
    // Returns all variables in the given MathExpr.
    variables: () => string[];

    // Returns the text representation of the MathExpr.
    text: (option: string, n: string) => string;

    // Evaluates the MathExpr into the simplest form.
    evaluate: () => MathExpr;

    // Returns the numerator of the polynomial.
    numerator: () => MathExpr;

    // Returns the denominator of the polynomial.
    denominator: () => MathExpr;

    // Adds two MathExprs.
    add: (x: string) => MathExpr;

    // Subtracts two MathExprs.
    subtract: (x: string) => MathExpr;

    // Multiplies two MathExprs.
    multiply: (x: string) => MathExpr;
    
    // Divides two MathExprs.
    divides: (x: string) => MathExpr;

    // Raises one MathExpr to another.
    pow: (x: string) => MathExpr;

    // Checks for equality of two MathExprs.
    eq: (x: string) => boolean;

    // Checks if one MathExpr is less than other.
    lt: (x: string) => boolean;

    // Checks if one MathExpr is greater than other.
    gt: (x: string) => boolean;

    // Checks if one MathExpr is less than, or equal to, other.
    lte: (x: string) => boolean;

    // Checks if one MathExpr is greater than, or equal to, other.
    gte: (x: string) => boolean;
}
