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
 * @fileoverview Validator service for the interaction.
 */

oppia.factory('ImageClickInputValidationService', [
  '$filter', 'WARNING_TYPES', 'baseInteractionValidationService',
  function($filter, WARNING_TYPES, baseInteractionValidationService) {
    return {
      getCustomizationArgsWarnings: function(customizationArgs) {
        baseInteractionValidationService.requireCustomizationArguments(
          customizationArgs, ['imageAndRegions']);

        var warningsList = [];

        var imgAndRegionArgValue = customizationArgs.imageAndRegions.value;
        if (!imgAndRegionArgValue.imagePath) {
          warningsList.push({
            type: WARNING_TYPES.CRITICAL,
            message: 'Please add an image for the learner to click on.'
          });
          // If there is no image specified, further warnings don't really
          // apply.
          return warningsList;
        }

        var areAnyRegionStringsEmpty = false;
        var areAnyRegionStringsNonAlphaNumeric = false;
        var areAnyRegionStringsDuplicated = false;
        var seenRegionStrings = [];
        if (imgAndRegionArgValue.labeledRegions.length === 0) {
          warningsList.push({
            type: WARNING_TYPES.ERROR,
            message: 'Please specify at least one region in the image.'
          });
        }

        for (var i = 0; i < imgAndRegionArgValue.labeledRegions.length; i++) {
          var regionLabel = (
            imgAndRegionArgValue.labeledRegions[i].label);

          var ALPHANUMERIC_REGEX = /^[A-Za-z0-9]+$/;
          if (regionLabel.trim().length === 0) {
            areAnyRegionStringsEmpty = true;
          } else if (!ALPHANUMERIC_REGEX.test(regionLabel)) {
            areAnyRegionStringsNonAlphaNumeric = true;
          } else if (seenRegionStrings.indexOf(regionLabel) !== -1) {
            areAnyRegionStringsDuplicated = true;
          } else {
            seenRegionStrings.push(regionLabel);
          }
        }

        if (areAnyRegionStringsEmpty) {
          warningsList.push({
            type: WARNING_TYPES.CRITICAL,
            message: 'Please ensure the region labels are nonempty.'
          });
        }
        if (areAnyRegionStringsNonAlphaNumeric) {
          warningsList.push({
            type: WARNING_TYPES.CRITICAL,
            message: (
              'The region labels should consist of alphanumeric characters.')
          });
        }
        if (areAnyRegionStringsDuplicated) {
          warningsList.push({
            type: WARNING_TYPES.CRITICAL,
            message: 'Please ensure the region labels are unique.'
          });
        }
        return warningsList;
      },
      getAllWarnings: function(
          stateName, customizationArgs, answerGroups, defaultOutcome) {
        var warningsList = [];

        warningsList = warningsList.concat(
          this.getCustomizationArgsWarnings(customizationArgs));

        warningsList = warningsList.concat(
          baseInteractionValidationService.getAnswerGroupWarnings(
            answerGroups, stateName));

        var imgAndRegionArgValue = customizationArgs.imageAndRegions.value;
        var seenRegionStrings = imgAndRegionArgValue.labeledRegions.map(
          function(region) {
            return region.label;
          });

        // Check that each rule refers to a valid region string.
        for (var i = 0; i < answerGroups.length; i++) {
          var rules = answerGroups[i].rules;
          for (var j = 0; j < rules.length; j++) {
            if (rules[j].type === 'IsInRegion') {
              var label = rules[j].inputs.x;
              if (seenRegionStrings.indexOf(label) === -1) {
                warningsList.push({
                  type: WARNING_TYPES.CRITICAL,
                  message: (
                    'The region label \'' + label + '\' in rule ' +
                    String(j + 1) + ' in group ' + String(i + 1) +
                    ' is invalid.')
                });
              }
            }
          }
        }

        if (!defaultOutcome || defaultOutcome.isConfusing(stateName)) {
          warningsList.push({
            type: WARNING_TYPES.ERROR,
            message: (
              'Please add a rule to cover what should happen if none of the ' +
              'given regions are clicked.')
          });
        }

        return warningsList;
      }
    };
  }]);
