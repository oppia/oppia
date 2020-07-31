// Code - third_party/static/math-expressions-1.7.0/math-expressions.js

interface Expression {
  derivative: (variable: string) => string;
  equals: (expression: Expression) => boolean;
  toLatex: () => string;
  toString: () => string;
  variables: () => string[];
}

interface MathExpression {
  'fromAst': (ast: boolean | string | string[]) => Expression;
  'fromLatex': (latex: string) => Expression;
  'fromLaTeX': (latex: string) => Expression;
  'fromMml': (mml: string) => Expression;
  'fromTex': (latex: string) => Expression;
  'fromTeX': (latex: string) => Expression;
  'fromText': (text: string) => Expression;
  'parse': (text: string) => Expression;
  'parse_tex': (latex: string) => Expression;
}

declare var MathExpression: MathExpression;
