// Copyright 2012 Google Inc. All Rights Reserved.
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

oppia.filter('spacesToUnderscores', function() {
  return function(input) {
    return input.trim().replace(' ', '_');
  };
});

// Filter that truncates long descriptors.
// TODO(sll): Strip out HTML tags before truncating.
oppia.filter('truncate', function() {
  return function(input, length, suffix) {
    if (!input)
      return '';
    if (isNaN(length))
      length = 70;
    if (suffix === undefined)
      suffix = '...';
    if (input.length <= length || input.length - suffix.length <= length)
      return input;
    else
      return String(input).substring(0, length - suffix.length) + suffix;
  };
});

// Filter that changes {{...}} tags into INPUT indicators.
oppia.filter('bracesToText', function() {
  return function(input) {
    if (!input) {
      return '';
    }
    var pattern = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/g;
    return input.replace(pattern, '<code>INPUT</code>');
  };
});

// Filter that changes {{...}} tags into input fields.
// Uses a multiple-choice selector if the input is multiple-choice.
oppia.filter('bracesToInput', function() {
  return function(input, choices) {
    if (!input) {
      return '';
    }
    var pattern = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/;
    var index = 0;

    var isMultipleChoice = false;
    if (choices) {
      isMultipleChoice = true;
    }

    while (true) {
      if (!input.match(pattern)) {
        break;
      }
      var varName = input.match(pattern)[1];
      var tail = '>';
      if (index === 0) {
        tail = ' autofocus>';
      }

      var replacementHtml = '<input type="text" required ng-model="addRuleActionInputs.' +
          varName + '"' + tail;
      if (isMultipleChoice) {
        replacementHtml =
          '<select ng-model="addRuleActionInputs.' + varName +
          '" ng-options="choice.id as choice.val for choice in getExtendedChoiceArray(interactiveWidget.params.choices)"' +
          tail + '</select>';
      }

      input = input.replace(pattern, replacementHtml);
      index++;
    }
    return input;
  };
});

// Filter that changes {{...}} tags into the corresponding parameter input values.
oppia.filter('parameterizeRule', function() {
  return function(input, choices) {
    if (!input) {
      return '';
    }
    var rule = input.rule;
    var inputs = input.inputs;

    var isMultipleChoice = false;
    if (choices) {
      isMultipleChoice = true;
    }

    var finalRule = rule;

    var pattern = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/;
    while (true) {
      if (!rule.match(pattern)) {
        break;
      }
      var varName = rule.match(pattern)[1];
      var replacementText = inputs[varName];
      if (isMultipleChoice) {
        replacementText = "'" + choices[inputs[varName]] + "'";
      }
      rule = rule.replace(pattern, ' ');
      finalRule = finalRule.replace(pattern, replacementText);
    }
    return finalRule;
  };
});
