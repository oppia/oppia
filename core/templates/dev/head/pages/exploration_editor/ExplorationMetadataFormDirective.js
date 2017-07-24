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
 * @fileoverview Directive for the exploration metadata form.
 */
oppia.directive('explorationMetadataForm', [
 'UrlInterpolationService',
 function(UrlInterpolationService) {
   return {
     restrict: 'E',
     scope: {
       settingsTab: '@',
       pStyle: '@',
       formStyle: '@',
       title: '@',
       objective: '@',
       category: '@',
       language: '@',
       tags: '@'
     },
     templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
      '/pages/exploration_editor/' +
      'exploration_metadata_form_directive.html'),
     controller: [
      '$scope', '$rootScope', 'explorationObjectiveService',
      'explorationTitleService', 'explorationCategoryService',
      'explorationStatesService', 'ALL_CATEGORIES',
      'explorationInitStateNameService', 'explorationLanguageCodeService',
      'explorationTagsService', 'EXPLORATION_TITLE_INPUT_FOCUS_LABEL',
      function($scope, $rootScope, explorationObjectiveService,
       explorationTitleService, explorationCategoryService,
       explorationStatesService, ALL_CATEGORIES,
       explorationInitStateNameService, explorationLanguageCodeService,
       explorationTagsService, EXPLORATION_TITLE_INPUT_FOCUS_LABEL) {
        $scope.stateNames = explorationStatesService.getStateNames();
        $scope.TAG_REGEX = GLOBALS.TAG_REGEX;
        $scope.EXPLORATION_TITLE_INPUT_FOCUS_LABEL =
         EXPLORATION_TITLE_INPUT_FOCUS_LABEL;
        $scope.CATEGORY_LIST_FOR_SELECT2 = [];
        $scope.explorationTitleService = explorationTitleService;
        $scope.explorationObjectiveService =
         explorationObjectiveService;
        $scope.explorationCategoryService =
         explorationCategoryService;
        $scope.explorationLanguageCodeService = (
         explorationLanguageCodeService);
        $scope.explorationTagsService = explorationTagsService;

        $scope.objectiveHasBeenPreviouslyEdited = (
         explorationObjectiveService.savedMemento.length > 0);

        $scope.requireTitleToBeSpecified = (
         !explorationTitleService.savedMemento);
        $scope.requireObjectiveToBeSpecified = (
         explorationObjectiveService.savedMemento.length < 15);
        $scope.requireCategoryToBeSpecified = (
         !explorationCategoryService.savedMemento);
        $scope.askForLanguageCheck = (
         explorationLanguageCodeService.savedMemento ===
         constants.DEFAULT_LANGUAGE_CODE);
        $scope.askForTags = (
         explorationTagsService.savedMemento.length === 0);


        for (var i = 0; i < ALL_CATEGORIES.length; i++) {
          $scope.CATEGORY_LIST_FOR_SELECT2.push({
            id: ALL_CATEGORIES[i],
            text: ALL_CATEGORIES[i]
          });
        }

        if (explorationStatesService.isInitialized()) {
          var categoryIsInSelect2 = $scope.CATEGORY_LIST_FOR_SELECT2
            .some(
              function(categoryItem) {
                return categoryItem.id ===
                 explorationCategoryService.savedMemento;
              }
            );

          // If the current category is not in the dropdown, add it
          // as the first option.
          if (!categoryIsInSelect2 &&
           explorationCategoryService.savedMemento) {
            $scope.CATEGORY_LIST_FOR_SELECT2.unshift({
              id: explorationCategoryService.savedMemento,
              text: explorationCategoryService.savedMemento
            });
          }
        }
        if ($scope.settingsTab) {
          $scope.explorationInitStateNameService =
           explorationInitStateNameService;

          $scope.saveExplorationTitle = function() {
            explorationTitleService.saveDisplayedValue();
          };

          $scope.saveExplorationCategory = function() {
            explorationCategoryService.saveDisplayedValue();
          };

          $scope.saveExplorationObjective = function() {
            explorationObjectiveService.saveDisplayedValue();
          };

          $scope.saveExplorationLanguageCode = function() {
            explorationLanguageCodeService.saveDisplayedValue();
          };

          $scope.saveExplorationTags = function() {
            explorationTagsService.saveDisplayedValue();
          };

          $scope.saveExplorationInitStateName = function() {
            var newInitStateName = explorationInitStateNameService.displayed;

            if (!explorationStatesService.getState(newInitStateName)) {
              alertsService.addWarning(
               'Invalid initial state name: ' + newInitStateName);
              explorationInitStateNameService.restoreFromMemento();
              return;
            }

            explorationInitStateNameService.saveDisplayedValue();

            $rootScope.$broadcast('refreshGraph');
          };
        }
      }
     ]
   }
 }
])
