// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Frontend validator for customization args and rules of
 * the interaction.
 */

oppia.factory('LabelingInputValidationService', [
    '$filter', 'WARNING_TYPES', 'baseInteractionValidationService',
    function($filter, WARNING_TYPES, baseInteractionValidationService) {
  // Returns a list of warnings.
  return {
    getCustomizationArgsWarnings: function(customizationArgs) {
      var warningsList = [];
      baseInteractionValidationService.requireCustomizationArguments(
      customizationArgs, ['imageAndLabels']);

      if (!customizationArgs.imageAndLabels.value.imagePath) {
        warningsList.push({
          type: WARNING_TYPES.CRITICAL,
          message: 'Please add an image for the learner to click on.'
        });
      }

      var areAnyRegionStringsEmpty = false;
      var areAnyRegionStringsDuplicated = false;
      var seenRegionStrings = [];
      if (customizationArgs.imageAndLabels.value.labeledRegions.length === 0) {
        warningsList.push({
          type: WARNING_TYPES.ERROR,
          message: 'Please specify at least one image region to click on.'
        });
      }

      for (var i = 0;
           i < customizationArgs.imageAndLabels.value.labeledRegions.length;
           i++) {
        var regionLabel = (
          customizationArgs.imageAndLabels.value.labeledRegions[i].label);

        var ALPHANUMERIC_REGEX = /^[A-Za-z0-9\s]+$/;
        if (regionLabel.trim().length === 0) {
          areAnyRegionStringsEmpty = true;
        } else if (!ALPHANUMERIC_REGEX.test(regionLabel)) {
          warningsList.push({
            type: WARNING_TYPES.CRITICAL,
            message: (
              'The image region strings should consist of characters from ' +
              '[A-Za-z0-9] and spaces.')
          });
        } else if (seenRegionStrings.indexOf(regionLabel) !== -1) {
          areAnyRegionStringsDuplicated = true;
        } else {
          seenRegionStrings.push(regionLabel);
        }
      }

      if (areAnyRegionStringsEmpty) {
        warningsList.push({
          type: WARNING_TYPES.CRITICAL,
          message: 'Please ensure the image region strings are nonempty.'
        });
      }
      if (areAnyRegionStringsDuplicated) {
        warningsList.push({
          type: WARNING_TYPES.CRITICAL,
          message: 'Please ensure the image region strings are unique.'
        });
      }
      return warningsList;
    },
    getAllWarnings: function(stateName, customizationArgs, answerGroups, defaultOutcome) {
    var warningsList = [];

    warningsList = warningsList.concat(
      this.getCustomizationArgsWarnings(customizationArgs));

    warningsList = warningsList.concat(
      baseInteractionValidationService.getAnswerGroupWarnings(
        answerGroups, stateName));

    var imgAndRegionArgValue = customizationArgs.imageAndLabels.value;
    var seenRegionStrings = imgAndRegionArgValue.labeledRegions.map(
      function(region) {
        return region.label;
      });

    // Check that each rule refers to a valid region string.
    for (var i = 0; i < answerGroups.length; i++) {
      var rules = answerGroups[i].rules;
      for (var j = 0; j < rules.length; j++) {
        if (rules[j].type === 'Misses') {
          var label = rules[j].inputs.x;
          if (seenRegionStrings.indexOf(label) === -1) {
            warningsList.push({
              type: WARNING_TYPES.CRITICAL,
              message: (
                'The region label \'' + label + '\' in rule ' + String(j + 1) +
                ' in group ' + String(i + 1) + ' is invalid.')
            });
          }
        }
      }
    }

    for (var i = 0; i < answerGroups.length; i++) {
      var rules = answerGroups[i].rules;
      for (var j = 0; j < rules.length; j++) {
        if (rules[j].type === 'HasMultipleMisses') {
          var label = rules[j].inputs.x;
          if (!label){
            break;
          }
          if (label < 2){
            warningsList.push({
              type: WARNING_TYPES.CRITICAL,
              message: (
                'Must check at least 2 misses!')
            });
          }
          if (label > seenRegionStrings.length){
            warningsList.push({
              type: WARNING_TYPES.CRITICAL,
              message: (
                'Must check a number of regions no more than the total number of regions!')
            });
          }
        }
      }
    }

    if (!defaultOutcome ||
        $filter('isOutcomeConfusing')(defaultOutcome, stateName)) {
      warningsList.push({
        type: WARNING_TYPES.ERROR,
        message: (
          'Please add a rule to cover what should happen if none of the ' +
          'given regions are clicked.')
      });
    }

    return warningsList;
  }
}
}]);
