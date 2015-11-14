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
oppia.factory('expressionSyntaxTreeService', ['$log', 'expressionParserService',
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
        return this.name + ': {' + this.args + '} not in range [' +
          this.expectedMin + ',' + this.expectedMax + ']';
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
        };

        var parsed = expressionParserService.parse(expression);
        return _findParams(parsed);
      };

      // Checks if the args array has the expectedNum number of elements an
      // throws an error if not. If optional expectedMax is specified, it
      // verifies the number of args is in [expectedNum, expectedMax] range
      // inclusive.
      var verifyNumArgs = function(args, expectedNum, expectedMax) {
        if (expectedMax === undefined) {
          expectedMax = expectedNum;
        }
        if (args.length >= expectedNum && args.length <= expectedMax) {
          return;
        }
        throw new ExprWrongNumArgsError(args, expectedNum, expectedMax);
      };

      var _verifyArgsHaveType = function(args, type) {
        for (var i = 0; i < args.length; i++) {
          if (args[i] != type) {
            throw new ExprWrongArgTypeError(
              originalValue, typeof originalValue, 'Number');
          }
        }
        return true;
      };

      var evaluateExpression = function(expression, envs, evaluate) {
        return evaluateParseTree(expressionParserService.parse(expression),
          envs, evaluate);
      };

      var evaluateParseTree = function(parsed, envs, evaluate) {
        return evaluate(parsed, envs.concat(system));
      };

      /**
       * Looks up a variable of the given name in the env. Here the variable
       * can be system or user defined functions and parameters, as well as
       * system operators.
       * @param {string} name The name to look up.
       * @param {!Array.<!Object>} envs Represents a nested name space
       *     environment to look up the name in. The first element is looked up
       *     first (i.e. has higher precedence).
       * @throws {ExprUndefinedVarError} The named variable was not found in
       *     the given environment.
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

        throw new ExprUndefinedVarError(name, envs);
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

      // NOTE TO DEVELOPERS: When adding a new reserved word to this object,
      //   please first ensure that existing explorations do not use this
      //   parameter name. Also, to prevent future explorations using it,
      //   modify feconf.INVALID_PARAMETER_NAMES accordingly.
      // TODO(kashida): Document all operators input and output contracts.

      var system = {
    '#': {
      type: function(args, envs) {
        return lookupEnvs(args + '', envs);
      },
      eval: function(args, envs) {
        return lookupEnvs(args[0] + '', envs);
      }
    },
    '+': {
      type: function(args, envs) {
        verifyNumArgs(args, 1, 2);
        _verifyArgsHaveType(args, 'Real');
        return 'Real';
      },
      eval: function(args, envs) {
        verifyNumArgs(args, 1, 2);
        var numericArgs = _coerceAllArgsToNumber(args);
        return numericArgs.length == 1 ? numericArgs[0] :
          numericArgs[0] + numericArgs[1];
      }
    },
    '-': {
      type: function(args, envs) {
        verifyNumArgs(args, 1, 2);
        _verifyArgsHaveType(args, 'Real');
        return 'Real';
      },
      eval: function(args, envs) {
        verifyNumArgs(args, 1, 2);
        var numericArgs = _coerceAllArgsToNumber(args);
        return numericArgs.length == 1 ? -numericArgs[0] :
          numericArgs[0] - numericArgs[1];
      }
    },
    '*': {
      type: function(args, envs) {
        verifyNumArgs(args, 2);
        _verifyArgsHaveType(args, 'Real');
        return 'Real';
      },
      eval: function(args, envs) {
        verifyNumArgs(args, 2);
        var numericArgs = _coerceAllArgsToNumber(args);
        return numericArgs[0] * numericArgs[1];
      }
    },
    '/': {
      type: function(args, envs) {
           verifyNumArgs(args, 2);
           _verifyArgsHaveType(args, 'Real');
           return 'Real';
         },
      eval: function(args, envs) {
           verifyNumArgs(args, 2);
           var numericArgs = _coerceAllArgsToNumber(args);
           return numericArgs[0] / numericArgs[1];
         }
    },
    '%': {
      type: function(args, envs) {
           verifyNumArgs(args, 2);
           _verifyArgsHaveType(args, 'Real');
           return 'Real';
         },
      eval: function(args, envs) {
           verifyNumArgs(args, 2);
           var numericArgs = _coerceAllArgsToNumber(args);
           return numericArgs[0] % numericArgs[1];
         }
    },
    '<=': {
      type: function(args, envs) {
            verifyNumArgs(args, 2);
            _verifyArgsHaveType(args, 'Real');
            return 'UnicodeString';
          },
      eval: function(args, envs) {
            verifyNumArgs(args, 2);
            var numericArgs = _coerceAllArgsToNumber(args);
            return numericArgs[0] <= numericArgs[1];
          }
    },
    '>=': {
      type: function(args, envs) {
            verifyNumArgs(args, 2);
            _verifyArgsHaveType(args, 'Real');
            return 'UnicodeString';
          },
      eval: function(args, envs) {
            verifyNumArgs(args, 2);
            var numericArgs = _coerceAllArgsToNumber(args);
            return numericArgs[0] >= numericArgs[1];
          }
    },
    '<': {
      type: function(args, envs) {
           verifyNumArgs(args, 2);
           _verifyArgsHaveType(args, 'Real');
           return 'UnicodeString';
         },
      eval: function(args, envs) {
           verifyNumArgs(args, 2);
           var numericArgs = _coerceAllArgsToNumber(args);
           return numericArgs[0] < numericArgs[1];
         }
    },
    '>': {
      type: function(args, envs) {
           verifyNumArgs(args, 2);
           _verifyArgsHaveType(args, 'Real');
           return 'UnicodeString';
         },
      eval: function(args, envs) {
           verifyNumArgs(args, 2);
           var numericArgs = _coerceAllArgsToNumber(args);
           return numericArgs[0] > numericArgs[1];
         }
    },
    '!': {
      type: function(args, envs) {
           verifyNumArgs(args, 1);
           _verifyArgsHaveType(args, 'UnicodeString');
           return 'UnicodeString';
         },
      eval: function(args, envs) {
           verifyNumArgs(args, 1);
           return !args[0];
         }
    },
    '==': {
      type: function(args, envs) {
            verifyNumArgs(args, 2);
            return 'UnicodeString';
          },
      eval: function(args, envs) {
            verifyNumArgs(args, 2);
            return args[0] == args[1];
          }
    },
    '!=': {
      type: function(args, envs) {
            verifyNumArgs(args, 2);
            return 'UnicodeString';
          },
      eval: function(args, envs) {
            verifyNumArgs(args, 2);
            return args[0] != args[1];
          }
    },
    '&&': {
      type: function(args, envs) {
            verifyNumArgs(args, 2);
            _verifyArgsHaveType(args, 'UnicodeString');
            return 'UnicodeString';
          },
      eval: function(args, envs) {
            // TODO(kashida): Make this short-circuit.
            verifyNumArgs(args, 2);
            return Boolean(args[0] && args[1]);
          }
    },
    '||': {
      type: function(args, envs) {
            verifyNumArgs(args, 2);
            _verifyArgsHaveType(args, 'UnicodeString');
            return 'UnicodeString';
          },
      eval: function(args, envs) {
            // TODO(kashida): Make this short-circuit.
            verifyNumArgs(args, 2);
            return Boolean(args[0] || args[1]);
          }
    },
    if: {
      type: function(args, envs) {
            verifyNumArgs(args, 3);
            _verifyArgsHaveType([args[0]], 'UnicodeString');
            _verifyArgsHaveType([args[2]], args[1]);
            return args[1];
          },
      eval: function(args, envs) {
            // TODO(kashida): Make this short-circuit.
            verifyNumArgs(args, 3);
            return args[0] ? args[1] : args[2];
          }
    },
    floor: {
      type: function(args, envs) {
               verifyNumArgs(args, 1);
               _verifyArgsHaveType(args, 'Real');
               return 'Real';
             },
      eval: function(args, envs) {
               verifyNumArgs(args, 1);
               var numericArgs = _coerceAllArgsToNumber(args);
               return Math.floor(numericArgs[0]);
             }
    },
    pow: {
      type: function(args, envs) {
             verifyNumArgs(args, 2);
             _verifyArgsHaveType(args, 'Real');
             return 'Real';
           },
      eval: function(args, envs) {
             verifyNumArgs(args, 2);
             var numericArgs = _coerceAllArgsToNumber(args);
             return Math.pow(args[0], args[1]);
           }
    },
    log: {
      type: function(args, envs) {
             verifyNumArgs(args, 2);
             _verifyArgsHaveType(args, 'Real');
             return 'Real';
           },
      eval: function(args, envs) {
             verifyNumArgs(args, 2);
             var numericArgs = _coerceAllArgsToNumber(args);
             return Math.log(numericArgs[0]) / Math.log(numericArgs[1]);
           }
    },
    abs: {
      type: function(args, envs) {
             verifyNumArgs(args, 1);
             _verifyArgsHaveType(args, 'Real');
             return 'Real';
           },
      eval: function(args, envs) {
             verifyNumArgs(args, 1);
             var numericArgs = _coerceAllArgsToNumber(args);
             return Math.abs(numericArgs[0]);
           }
    }
  };

      return {
    ExpressionError: ExpressionError,
    ExprUndefinedVarError: ExprUndefinedVarError,
    ExprWrongNumArgsError: ExprWrongNumArgsError,
    ExprWrongArgTypeError: ExprWrongArgTypeError,
    evaluateExpression: evaluateExpression,
    evaluateParseTree: evaluateParseTree,
    getParamsUsedInExpression: getParamsUsedInExpression,
    lookupEnvs: lookupEnvs
  };
    }]);
