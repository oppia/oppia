// TODO: Wrap this in a angular service.

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

// TODO: Validate number of arguments.
var system = {
  '#': function(args, envs) {
    return lookupEnvs(args[0] + "", envs);
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
    // TODO: Make this short-circuit.
    return args[0] && args[1];
  },
  '||': function(args, envs) {
    // TODO: Make this short-circuit.
    return args[0] || args[1];
  },
  '?': function(args, envs) {
    // TODO: Make this short-circuit.
    return args[0] ? args[1] : args[2];
  },
};

