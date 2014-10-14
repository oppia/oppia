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

/**
 * @fileoverview Filters for Oppia.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.filter('spacesToUnderscores', [function() {
  return function(input) {
    return input.trim().replace(/ /g, '_');
  };
}]);

oppia.filter('underscoresToCamelCase', [function() {
  return function(input) {
    return input.replace(/_+(.)/g, function(match, group1) {
      return group1.toUpperCase();
    });
  };
}]);

oppia.filter('camelCaseToHyphens', [function() {
  return function(input) {
    var result = input.replace(/([a-z])?([A-Z])/g, '$1-$2').toLowerCase();
    if (result[0] == '-') {
      result = result.substring(1);
    }
    return result;
  };
}]);

// Filter that truncates long descriptors.
// TODO(sll): Strip out HTML tags before truncating.
oppia.filter('truncate', [function() {
  return function(input, length, suffix) {
    if (!input)
      return '';
    if (isNaN(length))
      length = 70;
    if (suffix === undefined)
      suffix = '...';
    if (!angular.isString(input))
      input = String(input);
    return (input.length <= length ? input
            : input.substring(0, length - suffix.length) + suffix);
  };
}]);

// Filter that rounds a number to 1 decimal place.
oppia.filter('round1', [function() {
  return function(input) {
    return Math.round(input * 10) / 10;
  };
}]);

// Filter that replaces all {{...}} in a string with '...'.
oppia.filter('replaceInputsWithEllipses', [function() {
  var pattern = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/g;
  return function(input) {
    return input ? input.replace(pattern, '...') : '';
  };
}]);

// Filter that truncates a string at the first {{...}}.
oppia.filter('truncateAtFirstInput', [function() {
  var pattern = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/g;
  return function(input) {
    if (!input) {
      return '';
    }
    var matchLocation = input.search(pattern);
    return matchLocation === -1 ? input : (input.substring(0, matchLocation));
  };
}]);

// Filter that changes {{...}} tags into the corresponding parameter input values.
oppia.filter('parameterizeRuleDescription', ['$filter', function($filter) {
  return function(input, choices) {
    if (!input || !(input.description)) {
      return '';
    }
    var description = input.description;
    if (description == 'Default') {
      return description;
    }
    // TODO(sll): Generalize this to allow Boolean combinations of rules.
    var inputs = input.definition.inputs;

    var finalRule = description;

    var pattern = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/;
    var iter = 0;
    while (true) {
      if (!description.match(pattern) || iter == 100) {
        break;
      }
      iter++;

      var varName = description.match(pattern)[1];
      var varType = description.match(pattern)[2];
      if (varType) {
        varType = varType.substring(1);
      }

      var replacementText = inputs[varName];
      if (choices) {
        replacementText = $filter(
          'convertRuleChoiceToPlainText')(choices[inputs[varName]]);
        if (replacementText.length > 100) {
          replacementText = replacementText.substring(0, 97) + '...';
        }
        replacementText = '\'' + replacementText + '\'';
      }
      // TODO(sll): Generalize this to use the inline string representation of
      // an object type.
      if (varType === 'MusicPhrase') {
        replacementText = '[';
        for (var i = 0; i < inputs[varName].length; i++) {
          if (i !== 0) {
            replacementText += ', ';
          }
          replacementText += inputs[varName][i].readableNoteName;
        }
        replacementText += ']';
      } else if (varType === 'NormalizedString') {
        replacementText = '"' + replacementText + '"';
      }

      description = description.replace(pattern, ' ');
      finalRule = finalRule.replace(pattern, replacementText);
    }
    return 'the answer ' + finalRule;
  };
}]);

// Filter that removes whitespace from the beginning and end of a string, and
// replaces interior whitespace with a single space character.
oppia.filter('normalizeWhitespace', [function() {
  return function(input) {
    if (typeof input == 'string' || input instanceof String) {
      // Remove whitespace from the beginning and end of the string, and
      // replace interior whitespace with a single space character.
      input = input.trim();
      input = input.replace(/\s{2,}/g, ' ');
      return input;
    } else {
      return input;
    }
  };
}]);

oppia.filter('convertRuleChoiceToPlainText', [function() {
  return function(input) {
    return input.replace(/(<([^>]+)>)/ig, '');
  };
}]);
