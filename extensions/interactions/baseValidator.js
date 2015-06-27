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
 * @fileoverview Base validation service for interactions.
 */

oppia.factory('baseInteractionValidationService', [
    '$filter', 'WARNING_TYPES', function($filter, WARNING_TYPES) {

  return {
    // Fields is an array of qualified strings used to verify the structure of
    // customizationArguments. For instance, fields may have 'choices' and
    // 'choices.value'. Warnings will be returned if choices or choices.value
    // are not defined within customization arguments.
    validateCustomizationArguments: function(customizationArguments, fields) {
      var warningsList = [];

      // Build a structure which customizationArguments should match.
      var validationStructure = {};
      for (var i = 0; i < fields.length; i++) {
        var propertyNames = fields[i].split('.');
        var substructure = validationStructure;
        for (var j = 0; j < propertyNames.length; j++) {
          var propertyName = propertyNames[j];
          if (!substructure[propertyName]) {
            substructure[propertyName] = {};
          }
          substructure = substructure[propertyName];
        }
      }

      // Now validate the customizationArguments tree top-down.
      var upcomingStructures = [{
        'structure': customizationArguments,
        'expectedStructure': validationStructure
      }];
      var upcomingDescriptorStrings = [''];

      while (upcomingStructures.length > 0) {
        var nextValidation = upcomingStructures.pop();
        var nextDescriptor = upcomingDescriptorStrings.pop();
        var substructure = nextValidation.structure;
        var expectedStructure = nextValidation.expectedStructure;
        var expectedChildren = Object.keys(expectedStructure);

        for (var i = 0; i < expectedChildren.length; i++) {
          var expectedChild = expectedChildren[i];
          var childDescriptor = expectedChild;
          if (nextDescriptor.length > 0) {
            childDescriptor = nextDescriptor + '.' + childDescriptor;
          }

          if (substructure instanceof Object &&
              expectedChild in substructure) {
            upcomingStructures.push({
              'structure': substructure[expectedChild],
              'expectedStructure': expectedStructure[expectedChild]
            });
            upcomingDescriptorStrings.push(childDescriptor);
          } else {
            warningsList.push({
              type: WARNING_TYPES.CRITICAL,
              message: 'Expected customization arguments to have property: ' +
                childDescriptor
            });
          }
        }
      }

      return warningsList;
    },
    getAnswerGroupWarnings: function(answerGroups, stateName) {
      var partialWarningsList = [];

      // This does not check the default outcome.
      for (var i = 0; i < answerGroups.length; i++) {
        if ($filter('isOutcomeConfusing')(answerGroups[i].outcome, stateName)) {
          partialWarningsList.push({
            type: WARNING_TYPES.ERROR,
            message: (
              'please specify what Oppia should do in answer group ' +
              String(i + 1) + '.')
          });
        }
      }
      return partialWarningsList;
    },
    getDefaultOutcomeWarnings: function(defaultOutcome, stateName) {
      var partialWarningsList = [];
      if (defaultOutcome &&
          $filter('isOutcomeConfusing')(defaultOutcome, stateName)) {
        partialWarningsList.push({
          type: WARNING_TYPES.ERROR,
          message: (
            'please add feedback for the user if they are to return to the ' +
            'same state again.')
        });
      }
      return partialWarningsList;
    },
    getAllOutcomeWarnings: function(answerGroups, defaultOutcome, stateName) {
      return (
        this.getAnswerGroupWarnings(answerGroups, stateName).concat(
          this.getDefaultOutcomeWarnings(defaultOutcome, stateName)));
    }
  }
}]);
