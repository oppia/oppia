// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Service for expression evaluation.
 *
 * This file defines the evaluation engine that walks the parse tree. System
 * operators and functions are registered on `ExpressionSyntaxTreeService`. The
 * evaluator takes the output of the parser (a parse tree) as defined in
 * parser.pegjs and produces a JavaScript primitive value if successful.
 *
 * There are 2 scenarios where an exception is thrown:
 * -   ExprUndefinedVarError: Variable look-up ('#' operator) failed.
 * -   ExprWrongNumArgsError: Wrong number of arguments provided to an operator.
 *
 * Both errors are children of ExpressionError, so callers can catch
 * ExpressionError to identify issues in the evaluator.
 *
 * An expression is evaluated in a context. The context consists of predefined
 * system variables, system operators, and system functions.
 *
 * Operators are a predefined set of characters using infix, prefix, or ternary
 * format for its values. There are currently no postfix operators.
 *
 * Functions are written like they would in JavaScript (e.g. "abs(10)"). The
 * parse tree treat operators and functions equivalently.
 *
 * User-defined parameters may override the meaning of system variables and
 * functions, but not operators.
 *
 * Users also can define parameters with new names. Trying to reference a
 * variable which has not been defined as a system variable, system function, or
 * user parameter will throw an ExprUndefinedVarError.
 *
 * All system operators and functions are defined in the `system` environment
 * on `ExpressionSyntaxTreeService` (appended when evaluating via
 * `applyFunctionToParseTree`).
 *
 * ## Overview of operators and functions
 *
 * Operators and functions are invoked with an array of arguments that are
 * already fully evaluated. For example, in `1 + 2 * 3`, the `+` operator
 * receives `1` and `6` (not `1` and `2`), because `2 * 3` is evaluated first.
 * Unary and ternary forms work the same way: each child subtree is evaluated
 * before the operator or function runs.
 *
 * Common examples:
 * -   Infix arithmetic: `3 - 1` passes `[3, 1]` into `-` (after evaluation).
 * -   Functions: `abs(-5)` passes `[-5]` into `abs` after the unary `-`
 *     sub-expression is evaluated.
 *
 * On success, an operator or function may return any valid JavaScript value
 * (see each entry's `eval` implementation in `expression-syntax-tree.service.ts`
 * for concrete return types).
 *
 * ## Steps to define a new operator or function
 *
 * 1. Add an entry to the `system` map in `expression-syntax-tree.service.ts`
 *    with an `eval` function that receives the evaluated argument array (and
 *    extend `parser.pegjs` if the expression language needs new syntax).
 * 2. Ensure the argument array has the required length; throw if the caller
 *    passed the wrong number of arguments.
 * 3. Coerce or validate each argument to the expected types; throw if an
 *    argument has the wrong type. You may still validate semantic constraints
 *    (e.g. reject a negative index) after type checks.
 * 4. Return the computed result, or throw if the inputs are invalid for your
 *    domain rules.
 * 5. Document argument count, types, value constraints, and the return type
 *    (or possible return types) in the operator or function definition so
 *    other contributors can use it correctly.
 */

import {Injectable} from '@angular/core';

import {ExpressionParserService} from 'expressions/expression-parser.service';
import {
  EnvDict,
  Expr,
  ExpressionSyntaxTreeService,
  SystemEnv,
} from 'expressions/expression-syntax-tree.service';

@Injectable({
  providedIn: 'root',
})
export class ExpressionEvaluatorService {
  constructor(
    private expressionParserService: ExpressionParserService,
    private expressionSyntaxTreeService: ExpressionSyntaxTreeService
  ) {}

  evaluateExpression(expression: string, envs: EnvDict[]): Expr {
    return this.expressionSyntaxTreeService.applyFunctionToParseTree(
      this.expressionParserService.parse(expression),
      envs,
      (parsed, envs) => this.evaluate(parsed, envs)
    );
  }

  /**
   * @param parsed Parse output from the parser. See parser.pegjs for the data
   *     structure.
   * @param envs Represents a nested name space environment to look up the name
   *     in. The first element is looked up first (i.e. has higher precedence).
   */
  evaluate(parsed: Expr | Expr[], envs: EnvDict[]): Expr {
    // The intermediate nodes of the parse tree are arrays. The terminal nodes
    // are JavaScript primitives (as described in the "Parser output" section of
    // parser.pegjs).
    if (parsed instanceof Array) {
      if (parsed.length === 0) {
        throw new Error(
          'Parser generated an intermediate node with zero children'
        );
      }

      if (parsed[0] === '#') {
        const varName = parsed[1] as string;
        return this.expressionSyntaxTreeService.lookupEnvs(
          varName,
          envs
        ) as Expr;
      }

      // Otherwise, this must be a function/operator expression.
      const funcName = parsed[0] as string;
      const funcArgs = parsed.slice(1).map(item => this.evaluate(item, envs));
      const funcEnvs = this.expressionSyntaxTreeService.lookupEnvs(
        funcName,
        envs
      ) as SystemEnv;
      return funcEnvs.eval(funcArgs as string[]);
    }

    // This should be a terminal node with an actual value.
    return parsed;
  }
}
