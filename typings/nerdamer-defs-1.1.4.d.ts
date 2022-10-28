// Code - https://github.com/jiggzson/nerdamer/blob/master/nerdamer.core.js

declare namespace nerdamer {
  interface Expression {
    // Expands the Expression.
    expand: () => Expression;
  }
}
