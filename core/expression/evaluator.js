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
  envs.some(function(env) {
    if (env.hasOwnProperty(name)) {
      value = env[name];
      return true;
    }
    return false;
  });
  // If the value wasn't found, returning undefined here.
  return value;
};

// TODO(kashida): Validate number of arguments.
var system = {
  '#': function(args, envs) {
    return lookupEnvs(args[0] + '', envs);
  },
  '+': function(args, envs) {
    return args.length == 1 ? args[0] : args[0] + args[1];
  },
  '-': function(args, envs) {
    return args.length == 1 ? -args[0] : args[0] - args[1];
  },
  '!': function(args, envs) {
    return !args[0];
  },
  '*': function(args, envs) {
    return args[0] * args[1];
  },
  '/': function(args, envs) {
    return args[0] / args[1];
  },
  '%': function(args, envs) {
    return args[0] % args[1];
  },
  '<=': function(args, envs) {
    return args[0] <= args[1];
  },
  '>=': function(args, envs) {
    return args[0] >= args[1];
  },
  '<': function(args, envs) {
    return args[0] < args[1];
  },
  '>': function(args, envs) {
    return args[0] > args[1];
  },
  '==': function(args, envs) {
    return args[0] == args[1];
  },
  '!=': function(args, envs) {
    return args[0] != args[1];
  },
  '&&': function(args, envs) {
    // TODO(kashida): Make this short-circuit.
    return args[0] && args[1];
  },
  '||': function(args, envs) {
    // TODO(kashida): Make this short-circuit.
    return args[0] || args[1];
  },
  '?': function(args, envs) {
    // TODO(kashida): Make this short-circuit.
    return args[0] ? args[1] : args[2];
  },
};

