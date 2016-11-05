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
 */

oppia.constant('RULE_SUMMARY_WRAP_CHARACTER_COUNT', 30);

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
    if (result[0] === '-') {
      result = result.substring(1);
    }
    return result;
  };
}]);

// Filter that truncates long descriptors.
oppia.filter('truncate', ['$filter', function($filter) {
  return function(input, length, suffix) {
    if (!input) {
      return '';
    }
    if (isNaN(length)) {
      length = 70;
    }
    if (suffix === undefined) {
      suffix = '...';
    }
    if (!angular.isString(input)) {
      input = String(input);
    }
    input = $filter('convertToPlainText')(input);
    return (
      input.length <= length ? input : (
        input.substring(0, length - suffix.length) + suffix));
  };
}]);

oppia.filter('truncateAtFirstLine', [function() {
  return function(input) {
    if (!input) {
      return input;
    }

    var pattern = /(\r\n|[\n\v\f\r\x85\u2028\u2029])/g;
    // Normalize line endings then split using the normalized delimiter.
    var lines = input.replace(pattern, '\n').split('\n');
    var firstNonemptyLineIndex = -1;
    var otherNonemptyLinesExist = false;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].length > 0) {
        if (firstNonemptyLineIndex === -1) {
          firstNonemptyLineIndex = i;
        } else {
          otherNonemptyLinesExist = true;
          break;
        }
      }
    }
    var suffix = otherNonemptyLinesExist ? '...' : '';
    return (
      firstNonemptyLineIndex !== -1 ?
      lines[firstNonemptyLineIndex] + suffix : '');
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

// Filter that truncates a string at the first '...'.
oppia.filter('truncateAtFirstEllipsis', [function() {
  var pattern = /\.\.\./g;
  return function(input) {
    if (!input) {
      return '';
    }
    var matchLocation = input.search(pattern);
    return matchLocation === -1 ? input : (input.substring(0, matchLocation));
  };
}]);

oppia.filter('wrapTextWithEllipsis', [
  '$filter', 'utilsService', function($filter, utilsService) {
    return function(input, characterCount) {
      if (utilsService.isString(input)) {
        input = $filter('normalizeWhitespace')(input);
        if (input.length <= characterCount || characterCount < 3) {
          // String fits within the criteria; no wrapping is necessary.
          return input;
        }

        // Replace characters counting backwards from character count with an
        // ellipsis, then trim the string.
        return input.substr(0, characterCount - 3).trim() + '...';
      } else {
        return input;
      }
    };
  }
]);

// Filter that returns true iff an outcome has a self-loop and no feedback.
oppia.filter('isOutcomeConfusing', [function() {
  return function(outcome, currentStateName) {
    return (
      outcome.dest === currentStateName &&
      !outcome.feedback.some(function(feedbackItem) {
        return feedbackItem.trim().length > 0;
      })
    );
  };
}]);

// Filter that changes {{...}} tags into the corresponding parameter input
// values. Note that this returns an HTML string to accommodate the case of
// multiple-choice input and image-click input.
oppia.filter('parameterizeRuleDescription', [
    'INTERACTION_SPECS', function(INTERACTION_SPECS) {
  return function(rule, interactionId, choices) {
    if (!rule) {
      return '';
    }

    if (!INTERACTION_SPECS.hasOwnProperty(interactionId)) {
      console.error('Cannot find interaction with id ' + interactionId);
      return '';
    }

    var description = INTERACTION_SPECS[interactionId].rule_descriptions[
      rule.rule_type];
    if (!description) {
      console.error(
        'Cannot find description for rule ' + rule.rule_type +
        ' for interaction ' + interactionId);
      return '';
    }

    var inputs = rule.inputs;
    var finalDescription = description;

    var PATTERN = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/;
    var iter = 0;
    while (true) {
      if (!description.match(PATTERN) || iter === 100) {
        break;
      }
      iter++;

      var varName = description.match(PATTERN)[1];
      var varType = description.match(PATTERN)[2];
      if (varType) {
        varType = varType.substring(1);
      }

      var replacementText = '[INVALID]';
      // Special case for MultipleChoiceInput, ImageClickInput, and
      // ItemSelectionInput.
      if (choices) {
        if (varType === 'SetOfHtmlString') {
          replacementText = '[';
          var key = inputs[varName];
          for (var i = 0; i < key.length; i++) {
            replacementText += key[i];
            if (i < key.length - 1) {
              replacementText += ',';
            }
          }
          replacementText += ']';
        } else {
          // The following case is for MultipleChoiceInput
          for (var i = 0; i < choices.length; i++) {
            if (choices[i].val === inputs[varName]) {
              replacementText = '\'' + choices[i].label + '\'';
            }
          }
        }
        // TODO(sll): Generalize this to use the inline string representation of
        // an object type.
      } else if (varType === 'MusicPhrase') {
        replacementText = '[';
        for (var i = 0; i < inputs[varName].length; i++) {
          if (i !== 0) {
            replacementText += ', ';
          }
          replacementText += inputs[varName][i].readableNoteName;
        }
        replacementText += ']';
      } else if (varType === 'CoordTwoDim') {
        var latitude = inputs[varName][0] || 0.0;
        var longitude = inputs[varName][1] || 0.0;
        replacementText = '(';
        replacementText += (
          inputs[varName][0] >= 0.0 ?
          latitude.toFixed(2) + '°N' :
          -latitude.toFixed(2) + '°S');
        replacementText += ', ';
        replacementText += (
          inputs[varName][1] >= 0.0 ?
          longitude.toFixed(2) + '°E' :
          -longitude.toFixed(2) + '°W');
        replacementText += ')';
      } else if (varType === 'NormalizedString') {
        replacementText = '"' + inputs[varName] + '"';
      } else if (varType === 'Graph') {
        replacementText = '[reference graph]';
      } else {
        replacementText = inputs[varName];
      }

      description = description.replace(PATTERN, ' ');
      finalDescription = finalDescription.replace(PATTERN, replacementText);
    }
    return finalDescription;
  };
}]);

// Filter that removes whitespace from the beginning and end of a string, and
// replaces interior whitespace with a single space character.
oppia.filter('normalizeWhitespace', ['utilsService', function(utilsService) {
  return function(input) {
    if (utilsService.isString(input)) {
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

// Filter that takes a string, trims and normalizes spaces within each
// line, and removes blank lines. Note that any spaces whose removal does not
// result in two alphanumeric "words" being joined together are also removed,
// so "hello ? " becomes "hello?".
oppia.filter('normalizeWhitespacePunctuationAndCase', [function() {
  return function(input) {
    if (typeof input === 'string' || input instanceof String) {
      var isAlphanumeric = function(character) {
        return 'qwertyuiopasdfghjklzxcvbnm0123456789'.indexOf(
          character.toLowerCase()) !== -1;
      };

      input = input.trim();
      var inputLines = input.split('\n');
      var resultLines = [];
      for (var i = 0; i < inputLines.length; i++) {
        var result = '';

        var inputLine = inputLines[i].trim().replace(/\s{2,}/g, ' ');
        for (var j = 0; j < inputLine.length; j++) {
          var currentChar = inputLine.charAt(j).toLowerCase();
          if (currentChar === ' ') {
            if (j > 0 && j < inputLine.length - 1 &&
                isAlphanumeric(inputLine.charAt(j - 1)) &&
                isAlphanumeric(inputLine.charAt(j + 1))) {
              result += currentChar;
            }
          } else {
            result += currentChar;
          }
        }

        if (result) {
          resultLines.push(result);
        }
      }

      return resultLines.join('\n');
    } else {
      return input;
    }
  };
}]);

oppia.filter('convertToPlainText', [function() {
  return function(input) {
    var strippedText = input.replace(/(<([^>]+)>)/ig, '');
    strippedText = strippedText.replace('&nbsp;', ' ');

    var trimmedText = strippedText.trim();
    if (trimmedText.length === 0) {
      return strippedText;
    } else {
      return trimmedText;
    }
  };
}]);

// Filter that summarizes a large number to a decimal followed by
// the appropriate metric prefix (K, M or B). For example, 167656
// becomes 167.7K.
// Users of this filter should ensure that the input is a non-negative number.
oppia.filter('summarizeNonnegativeNumber', [function() {
  return function(input) {
    input = Number(input);
    // Nine zeros for billions (e.g. 146008788788 --> 146.0B).
    // Six zeros for millions (e.g. 146008788 --> 146.0M).
    // Three zeros for thousands (e.g. 146008 --> 146.0K).
    // No change for small numbers (e.g. 12 --> 12).
    return (
      input >= 1.0e+9 ? (input / 1.0e+9).toFixed(1) + 'B' :
      input >= 1.0e+6 ? (input / 1.0e+6).toFixed(1) + 'M' :
      input >= 1.0e+3 ? (input / 1.0e+3).toFixed(1) + 'K' :
      input);
  };
}]);

// Note that this filter does not truncate at the middle of a word.
oppia.filter('truncateAndCapitalize', [function() {
  return function(input, maxNumberOfCharacters) {
    var words = input.trim().match(/\S+/g);

    // Capitalize the first word and add it to the result.
    var result = words[0].charAt(0).toUpperCase() + words[0].slice(1);

    // Add the remaining words to the result until the character limit is
    // reached.
    for (var i = 1; i < words.length; i++) {
      if (!maxNumberOfCharacters ||
          result.length + 1 + words[i].length <= maxNumberOfCharacters) {
        result += ' ';
        result += words[i];
      } else {
        result += '...';
        break;
      }
    }

    return result;
  };
}]);

oppia.filter('removeDuplicatesInArray', [function() {
  return function(input) {
    return input.filter(function(val, pos) {
      return input.indexOf(val) === pos;
    });
  };
}]);

oppia.filter('stripFormatting', [function() {
  return function(html, whitelistedImgClasses) {
    // Oppia RTE adds style attribute to bold and italics tags that
    // must be removed.
    var styleRegex = new RegExp(' style=\"[^\"]+\"', 'gm');
    // Strip out anything between and including <>,
    // unless it is an img whose class includes one of the whitelisted classes
    // or is the bold or italics tags.
    var tagRegex = new RegExp(
      '(?!<img.*class=".*(' + whitelistedImgClasses.join('|') +
      ').*".*>)(?!<b>|<\/b>|<i>|<\/i>)<[^>]+>', 'gm');
    var strippedText = html ? String(html).replace(styleRegex, '') : '';
    strippedText = strippedText ? String(strippedText).replace(
      tagRegex, '') : '';
    return strippedText;
  };
}]);
