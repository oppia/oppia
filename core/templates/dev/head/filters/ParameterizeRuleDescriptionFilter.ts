// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview ParameterizeRuleDescription filter for Oppia.
 */

// Filter that changes {{...}} tags into the corresponding parameter input
// values. Note that this returns an HTML string to accommodate the case of
// multiple-choice input and image-click input.
oppia.filter('parameterizeRuleDescription', [
  '$filter', 'INTERACTION_SPECS', 'FractionObjectFactory',
  'NumberWithUnitsObjectFactory', function( $filter, INTERACTION_SPECS,
      FractionObjectFactory, NumberWithUnitsObjectFactory) {
    return function(rule, interactionId, choices) {
      if (!rule) {
        return '';
      }

      if (!INTERACTION_SPECS.hasOwnProperty(interactionId)) {
        console.error('Cannot find interaction with id ' + interactionId);
        return '';
      }
      var description = INTERACTION_SPECS[interactionId].rule_descriptions[
        rule.type];
      if (!description) {
        console.error(
          'Cannot find description for rule ' + rule.type +
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
              replacementText += $filter('formatRtePreview')(key[i]);
              if (i < key.length - 1) {
                replacementText += ',';
              }
            }
            replacementText += ']';
          } else if (varType === 'ListOfSetsOfHtmlStrings') {
            replacementText = '[';
            var key = inputs[varName];
            for (var i = 0; i < key.length; i++) {
              replacementText += '[';
              for (var j = 0; j < key[i].length; j++) {
                replacementText += $filter('formatRtePreview')(key[i][j]);
                if (j < key[i].length - 1) {
                  replacementText += ',';
                }
              }
              replacementText += ']';
              if (i < key.length - 1) {
                replacementText += ',';
              }
            }
            replacementText += ']';
          } else if (varType === 'DragAndDropPositiveInt') {
            replacementText = inputs[varName] + '';
          } else {
            // The following case is for MultipleChoiceInput and
            // DragAndDropHtmlString.
            for (var i = 0; i < choices.length; i++) {
              if (choices[i].val === inputs[varName]) {
                var filteredLabelText =
                  $filter('formatRtePreview')(choices[i].label);
                replacementText = '\'' + filteredLabelText + '\'';
              }
            }
          }
          // TODO(sll): Generalize this to use the inline string representation
          // of an object type.
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
        } else if (varType === 'Fraction') {
          replacementText = FractionObjectFactory
            .fromDict(inputs[varName]).toString();
        } else if (varType === 'NumberWithUnits') {
          replacementText = NumberWithUnitsObjectFactory
            .fromDict(inputs[varName]).toString();
        } else if (
          varType === 'SetOfUnicodeString' ||
          varType === 'SetOfNormalizedString') {
          replacementText = '[';
          for (var i = 0; i < inputs[varName].length; i++) {
            if (i !== 0) {
              replacementText += ', ';
            }
            replacementText += inputs[varName][i];
          }
          replacementText += ']';
        } else if (
          varType === 'Real' || varType === 'NonnegativeInt' ||
          varType === 'Int') {
          replacementText = inputs[varName] + '';
        } else if (
          varType === 'CodeString' || varType === 'UnicodeString' ||
          varType === 'LogicErrorCategory' || varType === 'NormalizedString') {
          replacementText = inputs[varName];
        } else if (varType === 'ListOfCodeEvaluation') {
          replacementText = '[';
          for (var i = 0; i < inputs[varName].length; i++) {
            if (i !== 0) {
              replacementText += ', ';
            }
            replacementText += inputs[varName][i].code;
          }
          replacementText += ']';
        } else {
          throw Error('Unknown variable type in rule description');
        }

        // Replaces all occurances of $ with $$.
        // This makes sure that the next regex matching will yield
        // the same $ sign pattern as the input.
        replacementText = replacementText.split('$').join('$$');

        description = description.replace(PATTERN, ' ');
        finalDescription = finalDescription.replace(PATTERN, replacementText);
      }
      return finalDescription;
    };
  }
]);
