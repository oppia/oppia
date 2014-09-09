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
// Both errors are children of ExpressionError, so caller can use this error
// to catch only these expected error cases.
//
// Defining new operators:
// Operatos are given an array of arguments which are already all evaluated.
// The operators should verify the argument array has the required number of
// arguments. Operators should coarse the input arguments to the desired
// typed values, and never error on the wrong type of inputs. This does not
// prevent operators to eror on wrong parameter values (e.g. getting negative
// number for an index).
// When successful, operators should return any valid Javascript value. In
// general, one operator should always return a same type of values, but there
// may be exceptions (e.g. "+" operator may return a number or a string
// depending on the types of the input arguments).
// Constraints on the input arguments (number, types, and any other
// constraints) as well as the ouput value and type should be documented.


// TODO(kashida): Wrap this in a angular service.

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


var evaluate = function(parsed, envs) {
  if (parsed instanceof Array) {
    // Evaluate all the elements, including the operator.
    var evaled = parsed.map(function(item) {
      return evaluate(item, envs);
    });
    // Now the first element should be a function.
    var op = evaled[0];
    if (typeof(op) == 'string') {
      op = lookupEnvs(op, envs);
    }
    return op(evaled.slice(1), envs);
  }
  // This should be a terminal node with the actual value.
  return parsed;
};

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
}

var system = {
  '#': function(args, envs) {
    return lookupEnvs(args[0] + '', envs);
  },
  '+': function(args, envs) {
    verifyNumArgs(args, 1, 2);
    return args.length == 1 ? args[0] : args[0] + args[1];
  },
  '-': function(args, envs) {
    verifyNumArgs(args, 1, 2);
    return args.length == 1 ? -args[0] : args[0] - args[1];
  },
  '!': function(args, envs) {
    verifyNumArgs(args, 1);
    return !args[0];
  },
  '*': function(args, envs) {
    verifyNumArgs(args, 2);
    return args[0] * args[1];
  },
  '/': function(args, envs) {
    verifyNumArgs(args, 2);
    return args[0] / args[1];
  },
  '%': function(args, envs) {
    verifyNumArgs(args, 2);
    return args[0] % args[1];
  },
  '<=': function(args, envs) {
    verifyNumArgs(args, 2);
    return args[0] <= args[1];
  },
  '>=': function(args, envs) {
    verifyNumArgs(args, 2);
    return args[0] >= args[1];
  },
  '<': function(args, envs) {
    verifyNumArgs(args, 2);
    return args[0] < args[1];
  },
  '>': function(args, envs) {
    verifyNumArgs(args, 2);
    return args[0] > args[1];
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
};

