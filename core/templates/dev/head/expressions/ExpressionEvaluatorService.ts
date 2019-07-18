// Copyright 2014 The Oppia Authors. All Rights Reserved.
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

// This file defines the evaluation engine as well as the system operators.
// The evaluator takes the output of the parser (i.e. parse tree) as defined in
// parser.pegjs and produces a javaScript primitive value when the evaluation is
// performed correctly.
// Two cases that can throw an exception (i.e. an Error object):
// - Variable look-up ('#' operator) failure. (ExprUndefinedVarError)
// - Wrong number of arguments in the node for the given operator.
//   (ExprWrongNumArgsError)
// Both errors are children of ExpressionError, so caller can use
// ExpressionError to catch only these expected error cases.
//
// An expression is evaluated in a context consisting of predefined system
// variables, system operators, and system functions. In the input language,
// operators are predefined set of characters in infix, postfix, or ternary
// format (there is currently no postfix operators) while functions have the
// form of function calls (e.g. "abs(10)"). In the parse tree, there is no
// difference between operators and functions. User defined parameters may
// override the meaning of system variables and functions (but not operators).
// Users also can define parameters with new names. Referencing a variable which
// is not defined as a system variable, system function, or user parameter will
// result in ExprUndefinedVarError to be thrown.
//
// All system variables, system operators, and system functions are defined
// as 'system' variable in this file.
//
// TODO(kashida): Split the following section into two:
//     - A general overview of operators (including some concrete examples)
//     - A numbered sequence of steps which a new contributor should follow in
//         order to define a new operator.
// Defining new operators and functions:
// Operators and functions are given an array of arguments which are already all
// evaluated. E.g. for an expression "1 + 2 * 3", the "+" plus operator receives
// values 1 and 6 (i.e. "2 * 3" already evaluated).
// The operators and functions should verify that the argument array
// has the required number of arguments. Operators and functions can coerse the
// input arguments to the desired typed values, or throw an exception if wrong
// type of argument is given.
// type of inputs. This does not prevent operators to eror on wrong parameter
// values (e.g. getting negative number for an index).
// When successful, operators and functions may return any valid JavaScript
// values. In general, an operator always returns the same type of value, but
// there are exceptions (e.g. "+" operator may return a number or a string
// depending on the types of the input arguments).
// Constraints on the input arguments (number, types, and any other
// constraints) as well as the output value and type should be documented.

/**
 * @fileoverview Service for expression evaluation.
 */

require('expressions/ExpressionParserService.js');
require('expressions/ExpressionSyntaxTreeService.ts');

// Service for expression evaluation.
var oppia = require('AppInit.ts').module;

oppia.factory('ExpressionEvaluatorService', [
  '$log', 'ExpressionParserService', 'ExpressionSyntaxTreeService',
  function($log, ExpressionParserService, ExpressionSyntaxTreeService) {
    var evaluateExpression = function(expression, envs) {
      return ExpressionSyntaxTreeService.applyFunctionToParseTree(
        ExpressionParserService.parse(expression), envs, evaluate);
    };

    /**
     * @param {*} parsed Parse output from the parser. See parser.pegjs for
     *     the data structure.
     * @param {!Array.<!Object>} envs Represents a nested name space
     *     environment to look up the name in. The first element is looked up
     *     first (i.e. has higher precedence).
     */
    var evaluate = function(parsed, envs) {
      // The intermediate nodes of the parse tree are arrays. The terminal
      // nodes are JavaScript primitives (as described in the "Parser output"
      // section of parser.pegjs).
      if (parsed instanceof Array) {
        if (parsed.length === 0) {
          throw 'Parser generated an intermediate node with zero children';
        }

        if (parsed[0] === '#') {
          return ExpressionSyntaxTreeService.lookupEnvs(parsed[1], envs);
        }

        // Evaluate rest of the elements, i.e. the arguments.
        var args = parsed.slice(1).map(function(item) {
          return evaluate(item, envs);
        });
        // The first element should be a function name.
        return ExpressionSyntaxTreeService.lookupEnvs(
          parsed[0], envs).eval(args);
      }

      // This should be a terminal node with the actual value.
      return parsed;
    };

    return {
      evaluate: evaluate,
      evaluateExpression: evaluateExpression,
    };
  }
]);
