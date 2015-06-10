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
 * @fileoverview Frontend validator for customization args and rules of
 * the interaction.
 */

oppia.filter('oppiaInteractiveImageClickInputValidator', [
    '$filter', 'WARNING_TYPES', 'baseInteractionValidationService',
    function($filter, WARNING_TYPES, baseInteractionValidationService) {
  // Returns a list of warnings.
  return function(stateName, customizationArgs, ruleSpecs) {
    var warningsList = [];

    if (!customizationArgs.imageAndRegions.value.imagePath) {
      warningsList.push({
        type: WARNING_TYPES.CRITICAL,
        message: 'please add an image for the learner to click on.'
      });
    }

    if (customizationArgs.imageAndRegions.value.labeledRegions.length === 0) {
      warningsList.push({
        type: WARNING_TYPES.ERROR,
        message: 'please specify at least one image region to click on.'
      });
    }

    var areAnyRegionStringsEmpty = false;
    var areAnyRegionStringsDuplicated = false;
    var seenRegionStrings = [];
    for (var i = 0; i < customizationArgs.imageAndRegions.value.labeledRegions.length; i++) {
      var regionLabel = customizationArgs.imageAndRegions.value.labeledRegions[i].label;

      if (regionLabel.trim().length === 0) {
        areAnyRegionStringsEmpty = true;
      }
      var ALPHANUMERIC_REGEX = /^[A-Za-z0-9]+$/;
      if (!ALPHANUMERIC_REGEX.test(regionLabel)) {
        warningsList.push({
          type: WARNING_TYPES.CRITICAL,
          message: 'the image region strings should consist of characters from [A-Za-z0-9].'
        });
      }
      if (seenRegionStrings.indexOf(regionLabel) !== -1) {
        areAnyRegionStringsDuplicated = true;
      }
      seenRegionStrings.push(regionLabel);
    }

    if (areAnyRegionStringsEmpty) {
      warningsList.push({
        type: WARNING_TYPES.CRITICAL,
        message: 'please ensure the image region strings are nonempty.'
      });
    }
    if (areAnyRegionStringsDuplicated) {
      warningsList.push({
        type: WARNING_TYPES.CRITICAL,
        message: 'please ensure the image region strings are unique.'
      });
    }

    warningsList = warningsList.concat(
      baseInteractionValidationService.getNonDefaultRuleSpecsWarnings(
        ruleSpecs, stateName));

    // Check that each rule refers to a valid region string.
    for (var i = 0; i < ruleSpecs.length - 1; i++) {
      if (ruleSpecs[i].definition.name === 'IsInRegion') {
        var label = ruleSpecs[i].definition.inputs.x;
        if (seenRegionStrings.indexOf(label) === -1) {
          warningsList.push({
          type: WARNING_TYPES.CRITICAL,
          message: (
            'the region label \'' + label + '\' in rule ' + String(i + 1) + ' is invalid.')
          });
        }
      }
    }

    var lastRuleSpec = ruleSpecs[ruleSpecs.length - 1];
    if ($filter('isRuleSpecConfusing')(lastRuleSpec, stateName)) {
      warningsList.push({
        type: WARNING_TYPES.ERROR,
        message: (
          'please add a rule to cover what should happen if none of the ' +
          'given regions are clicked.')
      });
    }

    return warningsList;
  };
}]);
