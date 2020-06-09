// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for CreateNewSkillModal.
 */

require('domain/utilities/url-interpolation.service.ts');
require('services/context.service.ts');
require('services/image-local-storage.service.ts');

angular.module('oppia').controller('CreateNewSkillModalController', [
  '$scope', '$uibModalInstance', 'ContextService', 'ImageLocalStorageService',
  'RubricObjectFactory', 'SkillCreationService', 'SkillObjectFactory',
  'MAX_CHARS_IN_SKILL_DESCRIPTION', 'SKILL_DESCRIPTION_STATUS_VALUES',
  'SKILL_DIFFICULTIES',
  function($scope, $uibModalInstance, ContextService, ImageLocalStorageService,
      RubricObjectFactory, SkillCreationService, SkillObjectFactory,
      MAX_CHARS_IN_SKILL_DESCRIPTION, SKILL_DESCRIPTION_STATUS_VALUES,
      SKILL_DIFFICULTIES) {
    var rubrics = [
      RubricObjectFactory.create(SKILL_DIFFICULTIES[0], []),
      RubricObjectFactory.create(SKILL_DIFFICULTIES[1], ['']),
      RubricObjectFactory.create(SKILL_DIFFICULTIES[2], [])];
    ContextService.setImageSaveDestinationToLocalStorage();
    $scope.newSkillDescription = '';
    $scope.rubrics = rubrics;
    $scope.errorMsg = '';
    $scope.bindableDict = {
      displayedConceptCardExplanation: ''
    };
    $scope.MAX_CHARS_IN_SKILL_DESCRIPTION = (
      MAX_CHARS_IN_SKILL_DESCRIPTION);
    var newExplanationObject = null;

    $scope.$watch('newSkillDescription', function() {
      if (
        SkillCreationService.getSkillDescriptionStatus() !==
          SKILL_DESCRIPTION_STATUS_VALUES.STATUS_DISABLED) {
        var initParagraph = document.createElement('p');
        var explanations = $scope.rubrics[1].getExplanations();
        var newExplanation = document.createTextNode(
          $scope.newSkillDescription);
        initParagraph.appendChild(newExplanation);
        explanations[0] = initParagraph.outerHTML;
        $scope.rubrics[1].setExplanations(explanations);
        SkillCreationService.markChangeInSkillDescription();
      }
    });

    $scope.onSaveExplanation = function(explanationObject) {
      newExplanationObject = explanationObject.toBackendDict();
      $scope.bindableDict.displayedConceptCardExplanation = (
        explanationObject.getHtml());
    };

    $scope.onSaveRubric = function(difficulty, explanations) {
      for (var idx in $scope.rubrics) {
        if ($scope.rubrics[idx].getDifficulty() === difficulty) {
          $scope.rubrics[idx].setExplanations(explanations);
        }
      }
    };

    $scope.resetErrorMsg = function() {
      $scope.errorMsg = '';
    };

    $scope.createNewSkill = function() {
      if (
        !SkillObjectFactory.hasValidDescription(
          $scope.newSkillDescription)) {
        $scope.errorMsg = (
          'Please use a non-empty description consisting of ' +
          'alphanumeric characters, spaces and/or hyphens.');
        return;
      }
      $uibModalInstance.close({
        description: $scope.newSkillDescription,
        rubrics: $scope.rubrics,
        explanation: newExplanationObject
      });
    };

    $scope.cancel = function() {
      ImageLocalStorageService.flushStoredImagesData();
      SkillCreationService.resetSkillDescriptionStatusMarker();
      $uibModalInstance.dismiss('cancel');
    };
  }
]);
