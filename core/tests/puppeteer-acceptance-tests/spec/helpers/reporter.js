// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Custom jasmine reporter for acceptance tests
 */

const util = require('util');

let suiteCount,
  specCount,
  executedSpecCount,
  failureCount,
  failedSpecs = [],
  pendingSpecs = [],
  failedSuites = [],
  ansi = {
    green: '\x1B[32;40m',
    red: '\x1B[31;40m',
    yellow: '\x1B[33;40m',
    cyan: '\x1B[36;40m',
    none: '\x1B[0m'
  };

let print = function() {
  process.stdout.write(util.format.apply(this, arguments));
};

let printNewline = function() {
  print('\n');
};

let colored = function(color, str) {
  return (ansi[color] + str + ansi.none);
};

let printLog = function(result) {
  for (let i = 0; i < result.failedExpectations.length; i++) {
    const failedExpectation = result.failedExpectations[i];
    printNewline();
    print('Message:');
    printNewline();
    print(colored('red', failedExpectation.message));
    printNewline();
    print('Stack:');
    printNewline();
    print(!failedExpectation.stack ? '' : failedExpectation.stack);
  }

  if (result.failedExpectations.length === 0 &&
    result.passedExpectations.length === 0) {
    printNewline();
    print('Message:');
    printNewline();
    print(colored('red', 'Spec has no expectations'));
  }

  printNewline();
};

let pendingSpecTrace = function(result, pendingSpecNumber) {
  printNewline();
  print(pendingSpecNumber + '. ' + result.fullName);
  printNewline();
  let pendingReason = '-';
  if (result.pendingReason && result.pendingReason !== '') {
    pendingReason = result.pendingReason;
  }
  print('Message:');
  printNewline();
  print(colored('yellow', pendingReason));
  printNewline();
};

let specFailureTrace = function(result, failedSpecNumber) {
  printNewline();
  print(failedSpecNumber + '. ' + result.fullName);
  printLog(result);

  if (result.trace) {
    printNewline();
    print('Trace:');
    printNewline();

    for (const entry of result.trace) {
      print(`${entry.timestamp}ms: ${entry.message}`);
      printNewline();
    }
  }
};

let suiteFailureTrace = function(result) {
  printNewline();
  print('Suite error: ' + result.fullName);
  printLog(result);
};

const Reporter = {
  jasmineStarted: function(suiteInfo) {
    suiteCount = 0;
    specCount = 0;
    executedSpecCount = 0;
    failureCount = 0;
    printNewline();
    print('Running suite with ' + suiteInfo.totalSpecsDefined + ' specs.');
    printNewline();
  },

  suiteStarted: function(result) {
    suiteCount++;
    const heading = '. Suite started: ';
    const length = suiteCount.toString().length + heading.length +
      result.description.length + 4;
    let border = '';
    for (let i = 0; i < length; i++) {
      border += '-';
    }
    printNewline();
    print(border);
    printNewline();
    print('| ' + suiteCount + heading + result.description + ' |');
    printNewline();
    print(border);
    printNewline();
  },

  specStarted: function(result) {
    printNewline();
    print('Spec started : ' + result.fullName);
    printNewline();
  },

  specDone: function(result) {
    specCount++;
    const seconds = result ? result.duration / 1000 : 0;

    switch (result.status) {
      case 'pending':
        pendingSpecs.push(result);
        executedSpecCount++;
        print(colored(
          'yellow', '-> Pending [ Took ' + seconds + ' seconds ]'));
        printNewline();
        return;

      case 'passed':
        executedSpecCount++;
        print(colored(
          'green', '-> Passed [ Took ' + seconds + ' seconds ]'));
        printNewline();
        return;

      case 'failed':
        failureCount++;
        failedSpecs.push(result);
        executedSpecCount++;
        print(colored(
          'red', '-> Failed [ Took ' + seconds + ' seconds ]'));
        printNewline();
        return;
    }

    print(colored(
      'cyan', '-> Skipped [ Took ' + seconds + ' seconds ]'));
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
      specFailureTrace(failedSpecs[i], i + 1);
    }

    for (let i = 0; i < failedSuites.length; i++) {
      suiteFailureTrace(failedSuites[i]);
    }

    if (result && result.failedExpectations &&
      result.failedExpectations.length > 0) {
      suiteFailureTrace({ fullName: 'top suite', ...result });
    }

    if (pendingSpecs.length > 0) {
      print('Pending:');
    }
    for (i = 0; i < pendingSpecs.length; i++) {
      pendingSpecTrace(pendingSpecs[i], i + 1);
    }

    if (specCount > 0) {
      printNewline();

      if (executedSpecCount !== specCount) {
        print('Ran ' + executedSpecCount + ' of ' + specCount + ' specs');
        printNewline();
      }

      let specCounts = executedSpecCount + ' specs, ' + failureCount +
        ' failures';

      if (pendingSpecs.length) {
        specCounts += ', ' + pendingSpecs.length + ' pending specs';
      }

      print(specCounts);
    } else {
      print('No specs found');
    }

    printNewline();
    const seconds = result ? result.totalTime / 1000 : 0;
    print('Finished in ' + seconds + ' seconds');
    printNewline();

    if (result && result.overallStatus === 'incomplete') {
      print('Incomplete: ' + result.incompleteReason);
      printNewline();
    }
  }
};

jasmine.getEnv().clearReporters();
jasmine.getEnv().addReporter(Reporter);
