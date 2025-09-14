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
 * This file defines the evaluation engine as well as the system operators. The
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
 * All system variables, system operators, and system functions are defined in
 * the 'system' variable in this service.
 *
 * TODO(#20339): Split the following section into two:
 * 1.  A general overview of operators (including some concrete examples)
 * 2.  A numbered sequence of steps which a new contributor should follow in
 *     order to define a new operator.
 *
 * Defining new operators and functions:
 *     Operators and functions are given an array of arguments which are already
 *     all evaluated. For example, in the expression "1 + 2 * 3" the "+" plus
 *     operator receives values 1 and 6 (because "2 * 3" has already been
 *     evaluated).
 *
 *     The operators and functions should verify that the argument array has the
 *     required number of arguments. Operators and functions can coerce the
 *     input arguments to the desired typed values, or throw an exception if
 *     wrong type of argument is given. This does not prevent operators to error
 *     on wrong parameter values (e.g. getting negative number for an index).
 *
 *     When successful, operators and functions may return any valid JavaScript
 *     values. In general, an operator always returns the same type of value,
 *     but there are exceptions (e.g. "+" operator may return a number or a
 *     string depending on the types of the input arguments).
 *
 *     Constraints on the input arguments (number, types, and any other
 *     constraints) as well as the output value and type should be documented.
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
