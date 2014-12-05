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

// Service for expression evaluation.
oppia.factory('expressionEvaluatorService', ['$log', 'expressionParserService',
    function($log, expressionParserService) {

  // Exceptions that can be thrown from the evaluation of expressions.
  var ExpressionError = function() {
  };
  ExpressionError.prototype = new Error();
  ExpressionError.prototype.constructor = ExpressionError;

  var ExprUndefinedVarError = function(varname, envs) {
    this.varname = varname;
    this.envs = envs;
  };
  ExprUndefinedVarError.prototype = new ExpressionError();
  ExprUndefinedVarError.prototype.constructor = ExprUndefinedVarError;
  ExprUndefinedVarError.prototype.name = 'ExprUndefinedVarError';
  ExprUndefinedVarError.prototype.toString = function() {
    return this.name + ': ' + this.varname + ' not found in ' + this.envs;
  };

  var ExprWrongNumArgsError = function(args, expectedMin, expectedMax) {
    this.args = args;
    this.expectedMin = expectedMin;
    this.expectedMax = expectedMax;
  };
  ExprWrongNumArgsError.prototype = new ExpressionError();
  ExprWrongNumArgsError.prototype.constructor = ExprWrongNumArgsError;
  ExprWrongNumArgsError.prototype.name = 'ExprWrongNumArgsError';
  ExprWrongNumArgsError.prototype.toString = function() {
    return this.name + ': {' + this.args + '} not in range [' + this.expectedMin +
      ',' + this.expectedMax + ']';
  };

  var ExprWrongArgTypeError = function(arg, actualType, expectedType) {
    this.arg = arg;
    this.actualType = actualType;
    this.expectedType = expectedType;
  };
  ExprWrongArgTypeError.prototype = new ExpressionError();
  ExprWrongArgTypeError.prototype.constructor = ExprWrongArgTypeError;
  ExprWrongArgTypeError.prototype.name = 'ExprWrongArgTypeError';
  ExprWrongArgTypeError.prototype.toString = function() {
    return this.name + ': ' + this.arg + ' has type ' + this.actualType +
      ' which does not match expected type ' + this.expectedType;
  };


  var evaluateExpression = function(expression, envs) {
    return evaluateParseTree(expressionParserService.parse(expression), envs);
  };

  var evaluateParseTree = function(parsed, envs) {
    return evaluate(parsed, envs.concat(system));
  };

  /**
  * @param {*} Parse output from the parser. See parser.pegjs for the data
  *     structure.
  * @param {!Array.<!Object>} envs Represents a nested name space environment to
  *     look up the name in. The first element is looked up first (i.e. has
  *     higher precedence).
  */
  var evaluate = function(parsed, envs) {
    // The intermediate nodes of the parse tree are arrays. The terminal nodes are
    // JavaScript primitives (as described in the "Parser output" section of
    // parser.pegjs).
    if (parsed instanceof Array) {
      if (parsed.length == 0) {
        throw 'Parser generated an intermediate node with zero children';
      }

      // Now the first element should be a function name.
      var op = lookupEnvs(parsed[0], envs);

      // Evaluate rest of the elements, i.e. the arguments.
      var args = parsed.slice(1).map(function(item) {
        return evaluate(item, envs);
      });
      return op(args, envs);
    }

    // This should be a terminal node with the actual value.
    return parsed;
  };

  var validateExpression = function(expression, envs) {
    try {
      return validate(expressionParserService.parse(expression),
          envs.concat(system));
    } catch(err) {
      return false;
    }
  };

  /**
  * @param {*} Parse output from the parser. See parser.pegjs for the data
  *     structure.
  * @param {!Array.<!Object>} envs Represents a nested name space environment to
  *     look up the name in. The first element is looked up first (i.e. has
  *     higher precedence).
  * @return True when validation succeeds.
  */
  var validate = function(parsed, envs) {
    if (!(parsed instanceof Array)) {
      return true;
    }

    if (parsed.length == 0) {
      // This should not happen.
      return false;
    }

    // Make sure we can find the operator.
    lookupEnvs(parsed[0], envs);

    // Evaluate rest of the elements, i.e. the arguments.
    var args = parsed.slice(1).map(function(item) {
      return validate(item, envs);
    });

    // If it is a name look up, make sure the name exists.
    // TODO: Validate args for other operators.
    if (parsed[0] == '#') {
      lookupEnvs(parsed[1], envs);
    }

    return true;
  };

  /**
  * Looks up a variable of the given name in the env. Here the variable can be
  * system or user defined functions and parameters, as well as system operators.
  * @param {string} name The name to look up.
  * @param {!Array.<!Object>} envs Represents a nested name space environment to
  *     look up the name in. The first element is looked up first (i.e. has
  *     higher precedence).
  * @throws {ExprUndefinedVarError} The named variable was not found in the given
  *     environment.
  */
  var lookupEnvs = function(name, envs) {
    // Parameter value look up.
    var value;
    if (envs.some(function(env) {
      if (env.hasOwnProperty(name)) {
        value = env[name];
        return true;
      }
      return false;
    })) {
      return value;
    }

    throw new ExprUndefinedVarError(name, envs)
  };

  // Checks if the args array has the expectedNum number of elements and throws
  // an error if not. If optional expectedMax is specified, it verifies the number
  // of args is in [expectedNum, expectedMax] range inclusive.
  var verifyNumArgs = function(args, expectedNum, expectedMax) {
    if (expectedMax === undefined) {
      expectedMax = expectedNum;
    }
    if (args.length >= expectedNum && args.length <= expectedMax) {
      return;
    }
    throw new ExprWrongNumArgsError(args, expectedNum, expectedMax);
  };

  // Coerces the argument to a Number, and throws an error if the result
  // is NaN.
  var _coerceToNumber = function(originalValue) {
    var coercedValue = (+originalValue);
    if (!isNaN(coercedValue)) {
      return coercedValue;
    }
    throw new ExprWrongArgTypeError(
      originalValue, typeof originalValue, 'Number');
  };

  // Coerces all values in the given argument array to Number, and throws
  // an error if the result is NaN.
  var _coerceAllArgsToNumber = function(args) {
    for (var i = 0; i < args.length; i++) {
      args[i] = _coerceToNumber(args[i]);
    }
    return args;
  };

  // TODO(kashida): Document all operators input and output contracts.
  var system = {
    '#': function(args, envs) {
      return lookupEnvs(args[0] + '', envs);
    },
    '+': function(args, envs) {
      verifyNumArgs(args, 1, 2);
      var numericArgs = _coerceAllArgsToNumber(args);
      return numericArgs.length == 1 ? numericArgs[0] :
        numericArgs[0] + numericArgs[1];
    },
    '-': function(args, envs) {
      verifyNumArgs(args, 1, 2);
      var numericArgs = _coerceAllArgsToNumber(args);
      return numericArgs.length == 1 ? -numericArgs[0] :
        numericArgs[0] - numericArgs[1];
    },
    '*': function(args, envs) {
      verifyNumArgs(args, 2);
      var numericArgs = _coerceAllArgsToNumber(args);
      return numericArgs[0] * numericArgs[1];
    },
    '/': function(args, envs) {
      verifyNumArgs(args, 2);
      var numericArgs = _coerceAllArgsToNumber(args);
      return numericArgs[0] / numericArgs[1];
    },
    '%': function(args, envs) {
      verifyNumArgs(args, 2);
      var numericArgs = _coerceAllArgsToNumber(args);
      return numericArgs[0] % numericArgs[1];
    },
    '<=': function(args, envs) {
      verifyNumArgs(args, 2);
      var numericArgs = _coerceAllArgsToNumber(args);
      return numericArgs[0] <= numericArgs[1];
    },
    '>=': function(args, envs) {
      verifyNumArgs(args, 2);
      var numericArgs = _coerceAllArgsToNumber(args);
      return numericArgs[0] >= numericArgs[1];
    },
    '<': function(args, envs) {
      verifyNumArgs(args, 2);
      var numericArgs = _coerceAllArgsToNumber(args);
      return numericArgs[0] < numericArgs[1];
    },
    '>': function(args, envs) {
      verifyNumArgs(args, 2);
      var numericArgs = _coerceAllArgsToNumber(args);
      return numericArgs[0] > numericArgs[1];
    },
    '!': function(args, envs) {
      verifyNumArgs(args, 1);
      return !args[0];
    },
    '==': function(args, envs) {
      verifyNumArgs(args, 2);
      return args[0] == args[1];
    },
    '!=': function(args, envs) {
      verifyNumArgs(args, 2);
      return args[0] != args[1];
    },
    '&&': function(args, envs) {
      // TODO(kashida): Make this short-circuit.
      verifyNumArgs(args, 2);
      return args[0] && args[1];
    },
    '||': function(args, envs) {
      // TODO(kashida): Make this short-circuit.
      verifyNumArgs(args, 2);
      return args[0] || args[1];
    },
    '?': function(args, envs) {
      // TODO(kashida): Make this short-circuit.
      verifyNumArgs(args, 3);
      return args[0] ? args[1] : args[2];
    },
    'floor': function(args, envs) {
      verifyNumArgs(args, 1);
      var numericArgs = _coerceAllArgsToNumber(args);
      return Math.floor(numericArgs[0]);
    }
  };

  return {
    'ExpressionError': ExpressionError,
    'ExprUndefinedVarError': ExprUndefinedVarError,
    'ExprWrongNumArgsError': ExprWrongNumArgsError,
    'ExprWrongArgTypeError': ExprWrongArgTypeError,
    'evaluate': evaluate,
    'evaluateExpression': evaluateExpression,
    'evaluateParseTree': evaluateParseTree,
    'validate': validate,
    'validateExpression': validateExpression,
  };
}]);
