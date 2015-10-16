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

// Service for expression evaluation.
oppia.factory('expressionTypeParserService', ['$log', 'expressionParserService',
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

  var getParamsUsedInExpression = function(expression) {
    var _findParams = function(parseTree) {
      var paramsFound = [];

      if (parseTree instanceof Array) {
        if (parseTree[0] === '#') {
          paramsFound.push(parseTree[1]);
        } else {
          for (var i = 1; i < parseTree.length; i++) {
            paramsFound = paramsFound.concat(_findParams(parseTree[i]));
          }
        }
      }

      var uniqueParams = [];
      for (var i = 0; i < paramsFound.length; i++) {
        if (uniqueParams.indexOf(paramsFound[i]) === -1) {
          uniqueParams.push(paramsFound[i]);
        }
      }

      return uniqueParams.sort();
    }

    var parsed = expressionParserService.parse(expression);
    return _findParams(parsed);
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

      if (parsed[0] == '#') {
        return op(parsed[1], envs);
      }


      // Evaluate rest of the elements, i.e. the arguments.
      var args = parsed.slice(1).map(function(item) {
        return evaluate(item, envs);
      });
      return op(args, envs);
    }

    // This should be a terminal node with the actual value.
    return _coerceToNumber(parsed);
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
      return 'Real';
    }
    return 'UnicodeString';
  };

  // Coerces all values in the given argument array to Number, and throws
  // an error if the result is NaN.
  var _coerceAllArgsToNumber = function(args) {
    for (var i = 0; i < args.length; i++) {
      args[i] = _coerceToNumber(args[i]);
    }
    return args;
  };

  var _verifyArgsHaveType = function(args, type) {
     for (var i = 0; i < args.length; i++) { 
       if (args[i] != type) {
         throw new ExprWrongArgTypeError(
           originalValue, typeof originalValue, 'Number');
       }
     }
     return true;
  }

  var system = {
    '#': function(args, envs) {
      return lookupEnvs(args + '', envs);
    },
    '+': function(args, envs) {
      verifyNumArgs(args, 1, 2);
      _verifyArgsHaveType(args, 'Real');
      return 'Real';
    },
    '-': function(args, envs) {
      verifyNumArgs(args, 1, 2);
      _verifyArgsHaveType(args, 'Real');
      return 'Real';
    },
    '*': function(args, envs) {
      verifyNumArgs(args, 2);
      _verifyArgsHaveType(args, 'Real');
      return 'Real';
    },
    '/': function(args, envs) {
      verifyNumArgs(args, 2);
      _verifyArgsHaveType(args, 'Real');
      return 'Real';
    },
    '%': function(args, envs) {
      verifyNumArgs(args, 2);
      _verifyArgsHaveType(args, 'Real');
      return 'Real';
    },
    '<=': function(args, envs) {
      verifyNumArgs(args, 2);
      _verifyArgsHaveType(args, 'Real');
      return 'UnicodeString';
    },
    '>=': function(args, envs) {
      verifyNumArgs(args, 2);
      _verifyArgsHaveType(args, 'Real');
      return 'UnicodeString';
    },
    '<': function(args, envs) {
      verifyNumArgs(args, 2);
      _verifyArgsHaveType(args, 'Real');
      return 'UnicodeString';
    },
    '>': function(args, envs) {
      verifyNumArgs(args, 2);
      _verifyArgsHaveType(args, 'Real');
      return 'UnicodeString';
    },
    '!': function(args, envs) {
      verifyNumArgs(args, 1);
      _verifyArgsHaveType(args, 'UnicodeString');
      return 'UnicodeString';
    },
    '==': function(args, envs) {
      verifyNumArgs(args, 2);
      return 'UnicodeString';
    },
    '!=': function(args, envs) {
      verifyNumArgs(args, 2);
      return 'UnicodeString';
    },
    '&&': function(args, envs) {
      verifyNumArgs(args, 2);
      _verifyArgsHaveType(args, 'UnicodeString');
      return 'UnicodeString';
    },
    '||': function(args, envs) {
      verifyNumArgs(args, 2);
      _verifyArgsHaveType(args, 'UnicodeString');
      return 'UnicodeString';
    },
    'if': function(args, envs) {
      verifyNumArgs(args, 3);
      _verifyArgsHaveType([args[0]], 'UnicodeString');
      _verifyArgsHaveType([args[2]], args[1]);
      return args[1];
    },
    'floor': function(args, envs) {
      verifyNumArgs(args, 1);
      _verifyArgsHaveType(args, 'Real');
      return 'Real';
    },
    'pow': function(args, envs) {
      verifyNumArgs(args, 2);
      _verifyArgsHaveType(args, 'Real');
      return 'Real';
    },
    'log': function(args, envs) {
      verifyNumArgs(args, 2);
      _verifyArgsHaveType(args, 'Real');
      return 'Real';
    },
    'abs': function(args, envs) {
      verifyNumArgs(args, 1);
      _verifyArgsHaveType(args, 'Real');
      return 'Real';
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
    'getParamsUsedInExpression': getParamsUsedInExpression,
    'validate': validate,
    'validateExpression': validateExpression,
  };
}]);
