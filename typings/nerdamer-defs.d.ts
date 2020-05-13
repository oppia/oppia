// Code - https://github.com/jiggzson/nerdamer/blob/master/nerdamer.core.js

interface Expression {
    // Returns all variables in the given expression.
    variables: () => String[];

    // Returns the text representation of the expression.
    text: (option: String, n: String) => strings;

    // Evaluates the expression into the simplest form.
    evaluate: () => Expression;

    // Returns the numerator of the polynomial.
    numerator: () => Expression;

    // Returns the denominator of the polynomial.
    denominator: () => Expression;

    // Adds two expressions.
    add: (x: String) => Expression;

    // Subtracts two expressions.
    subtract: (x: String) => Expression;

    // Multiplies two expressions.
    multiply: (x: String) => Expression;
    
    // Divides two expressions.
    divides: (x: String) => Expression;

    // Raises one expression to another.
    pow: (x: String) => Expression;

    // Checks for equality of two expressions.
    eq: (x: String) => Boolean;

    // Checks if one expression is less than other.
    lt: (x: String) => Boolean;

    // Checks if one expression is greater than other.
    gt: (x: String) => Boolean;

    // Checks if one expression is less than, or equal to, other.
    lte: (x: String) => Boolean;

    // Checks if one expression is greater than, or equal to, other.
    gte: (x: String) => Boolean;
}