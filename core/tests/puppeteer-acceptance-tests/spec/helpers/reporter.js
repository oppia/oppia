const util = require('util');

let specCount,
  executableSpecCount,
  failureCount,
  failedSpecs = [],
  pendingSpecs = [],
  failedSuites = [],
  ansi = {
    green: '\x1B[32m',
    red: '\x1B[31m',
    yellow: '\x1B[33m',
    cyan: '\x1b[36m',
    none: '\x1B[0m'
  };

function print() {
  process.stdout.write(util.format.apply(this, arguments));
}

function colored(color, str) {
  return (ansi[color] + str + ansi.none);
}

function printNewline() {
  print('\n');
}

function indent(str, spaces) {
  const lines = (str || '').split('\n');
  const newArr = [];
  for (let i = 0; i < lines.length; i++) {
    newArr.push(repeat(' ', spaces).join('') + lines[i]);
  }
  return newArr.join('\n');
}

function repeat(thing, times) {
  const arr = [];
  for (let i = 0; i < times; i++) {
    arr.push(thing);
  }
  return arr;
}

function stackFilter(stack) {
  if (!stack) {
    return '';
  }
}

function plural(str, count) {
  return count == 1 ? str : str + 's';
}

function pendingSpecDetails(result, pendingSpecNumber) {
  printNewline();
  print(pendingSpecNumber + ') ');
  print(result.fullName);
  printNewline();
  let pendingReason = 'No reason given';
  if (result.pendingReason && result.pendingReason !== '') {
    pendingReason = result.pendingReason;
  }
  print(indent('Message:', 2));
  printNewline();
  print(indent(colored('yellow', pendingReason), 4));
  printNewline();
}

function specFailureDetails(result, failedSpecNumber) {
  printNewline();
  print(failedSpecNumber + ') ');
  print(result.fullName);
  printFailedExpectations(result);

  if (result.trace) {
    printNewline();
    print(indent('Trace:', 2));
    printNewline();

    for (const entry of result.trace) {
      print(indent(`${entry.timestamp}ms: ${entry.message}`, 4));
      printNewline();
    }
  }
}

function suiteFailureDetails(result) {
  printNewline();
  print('Suite error: ' + result.fullName);
  printFailedExpectations(result);
}

function printFailedExpectations(result) {
  for (let i = 0; i < result.failedExpectations.length; i++) {
    const failedExpectation = result.failedExpectations[i];
    printNewline();
    print(indent('Message:', 2));
    printNewline();
    print(colored('red', indent(failedExpectation.message, 4)));
    printNewline();
    print(indent('Stack:', 2));
    printNewline();
    print(indent(stackFilter(failedExpectation.stack), 4));
  }

  if (result.failedExpectations.length === 0 &&
    result.passedExpectations.length === 0) {
    printNewline();
    print(indent('Message:', 2));
    printNewline();
    print(colored('red', indent('Spec has no expectations', 4)));
  }

  printNewline();
}

const Reporter = {
  jasmineStarted: function(suiteInfo) {
    specCount = 0;
    executableSpecCount = 0;
    failureCount = 0;
    print('Running suite with ' + suiteInfo.totalSpecsDefined + ' specs.');
    printNewline();
  },

  suiteStarted: function(result) {
    printNewline();
    print('Suite started: ' + result.description);
    printNewline();
  },

  specStarted: function(result) {
    printNewline();
    print(indent('Spec started : ' + result.fullName, 4));
    printNewline();
  },

  specDone: function(result) {
    specCount++;
    const seconds = result ? result.duration / 1000 : 0;

    if (result.status === 'pending') {
      pendingSpecs.push(result);
      executableSpecCount++;
      print(indent(colored(
        'yellow', '-> Pending [ Took ' + seconds + ' ' + plural(
          'second', seconds) + ']'), 4));
      printNewline();
      return;
    }

    if (result.status === 'passed') {
      executableSpecCount++;
      print(indent(colored(
        'green', '-> Passed [ Took ' + seconds + ' ' + plural(
          'second', seconds) + ']'), 4));
      printNewline();
      return;
    }

    if (result.status === 'failed') {
      failureCount++;
      failedSpecs.push(result);
      executableSpecCount++;
      print(indent(colored(
        'red', '-> Failed [ Took ' + seconds + ' ' + plural(
          'second', seconds) + ']'), 4));
      printNewline();
      return;
    }

    print(indent(colored(
      'cyan', '-> Skipped [ Took ' + seconds + ' ' + plural(
        'second', seconds) + ']'), 4));
    printNewline();
  },

  suiteDone: function(result) {
    if (result.failedExpectations && result.failedExpectations.length > 0) {
      failureCount++;
      failedSuites.push(result);
    }
  },

  jasmineDone: function(result) {
    printNewline();
    printNewline();
    if (failedSpecs.length > 0) {
      print('Failures:');
    }
    for (let i = 0; i < failedSpecs.length; i++) {
      specFailureDetails(failedSpecs[i], i + 1);
    }

    for (let i = 0; i < failedSuites.length; i++) {
      suiteFailureDetails(failedSuites[i]);
    }

    if (result && result.failedExpectations &&
      result.failedExpectations.length > 0) {
      suiteFailureDetails({ fullName: 'top suite', ...result });
    }

    if (pendingSpecs.length > 0) {
      print('Pending:');
    }
    for (i = 0; i < pendingSpecs.length; i++) {
      pendingSpecDetails(pendingSpecs[i], i + 1);
    }

    if (specCount > 0) {
      printNewline();

      if (executableSpecCount !== specCount) {
        print('Ran ' + executableSpecCount + ' of ' + specCount + plural(
          ' spec', specCount));
        printNewline();
      }

      let specCounts = executableSpecCount + ' ' + plural(
        'spec', executableSpecCount) + ', ' + failureCount +
        ' ' + plural('failure', failureCount);

      if (pendingSpecs.length) {
        specCounts += ', ' + pendingSpecs.length + ' pending ' + plural(
          'spec', pendingSpecs.length);
      }

      print(specCounts);
    } else {
      print('No specs found');
    }

    printNewline();
    const seconds = result ? result.totalTime / 1000 : 0;
    print('Finished in ' + seconds + ' ' + plural('second', seconds));
    printNewline();

    if (result && result.overallStatus === 'incomplete') {
      print('Incomplete: ' + result.incompleteReason);
      printNewline();
    }
  }
};

jasmine.getEnv().clearReporters();
jasmine.getEnv().addReporter(Reporter);
