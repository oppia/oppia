// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to validate the consistency of a collection. These
 * checks are performable in the frontend to avoid sending a potentially invalid
 * collection to the backend, which performs similar validation checks to these
 * in collection_domain.Collection and subsequent domain objects.
 */

oppia.factory('SkillValidationService', [
  'ValidatorsService',
  function(
      ValidatorsService) {
    var _isValidDescription = function(description) {
      var allowDescriptionToBeBlank = false;
      var showWarnings = true;
      return ValidatorsService.isValidEntityName(description,
        showWarnings, allowDescriptionToBeBlank);
    };

    var _validateSkill = function(skill) {
      var issues = [];
      if (skill.getConceptCard().getExplanation() === '') {
        issues.push(
          'There should be review material in the concept card.');
      }
      return issues;
    };

    return {
      isValidDescription: function(description) {
        return _isValidDescription(description);
      },

      findValidationIssues: function(skill) {
        return _validateSkill(skill);
      }
    };
  }
]);