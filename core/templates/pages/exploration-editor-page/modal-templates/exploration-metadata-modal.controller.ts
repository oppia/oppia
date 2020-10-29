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
 * @fileoverview Controller for exploration metadata modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require(
  'pages/exploration-editor-page/services/exploration-category.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-language-code.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-objective.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require('pages/exploration-editor-page/services/exploration-tags.service.ts');
require(
  'pages/exploration-editor-page/exploration-title-editor/' +
  'exploration-title-editor.component.ts');
require(
  'pages/exploration-editor-page/exploration-objective-editor/' +
  'exploration-objective-editor.component.ts');
require('pages/exploration-editor-page/services/exploration-title.service.ts');
require('services/alerts.service.ts');

angular.module('oppia').controller('ExplorationMetadataModalController', [
  '$controller', '$scope', '$timeout', '$uibModalInstance',
  'AlertsService', 'ExplorationCategoryService',
  'ExplorationLanguageCodeService', 'ExplorationObjectiveService',
  'ExplorationStatesService', 'ExplorationTagsService',
  'ExplorationTitleService', 'ALL_CATEGORIES', 'DEFAULT_LANGUAGE_CODE',
  'TAG_REGEX',
  function(
      $controller, $scope, $timeout, $uibModalInstance,
      AlertsService, ExplorationCategoryService,
      ExplorationLanguageCodeService, ExplorationObjectiveService,
      ExplorationStatesService, ExplorationTagsService,
      ExplorationTitleService, ALL_CATEGORIES, DEFAULT_LANGUAGE_CODE,
      TAG_REGEX) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });

    var areRequiredFieldsFilled = function() {
      if (!ExplorationTitleService.displayed) {
        AlertsService.addWarning('Please specify a title');
        return false;
      }
      if (!ExplorationObjectiveService.displayed) {
        AlertsService.addWarning('Please specify an objective');
        return false;
      }
      if (!ExplorationCategoryService.displayed) {
        AlertsService.addWarning('Please specify a category');
        return false;
      }

      return true;
    };

    $scope.explorationTitleService = ExplorationTitleService;
    $scope.explorationObjectiveService =
      ExplorationObjectiveService;
    $scope.explorationCategoryService =
      ExplorationCategoryService;
    $scope.explorationLanguageCodeService = (
      ExplorationLanguageCodeService);
    $scope.explorationTagsService = ExplorationTagsService;

    $scope.objectiveHasBeenPreviouslyEdited = (
      ExplorationObjectiveService.savedMemento.length > 0);

    $scope.requireTitleToBeSpecified = (
      !ExplorationTitleService.savedMemento);
    $scope.requireObjectiveToBeSpecified = (
      ExplorationObjectiveService.savedMemento.length < 15);
    $scope.requireCategoryToBeSpecified = (
      !ExplorationCategoryService.savedMemento);
    $scope.askForLanguageCheck = (
      ExplorationLanguageCodeService.savedMemento ===
      DEFAULT_LANGUAGE_CODE);
    $scope.askForTags = (
      ExplorationTagsService.savedMemento.length === 0);

    $scope.TAG_REGEX = TAG_REGEX;

    $scope.CATEGORY_LIST_FOR_SELECT2 = [];

    for (var i = 0; i < ALL_CATEGORIES.length; i++) {
      $scope.CATEGORY_LIST_FOR_SELECT2.push({
        id: ALL_CATEGORIES[i],
        text: ALL_CATEGORIES[i]
      });
    }

    if (ExplorationStatesService.isInitialized()) {
      var categoryIsInSelect2 = $scope.CATEGORY_LIST_FOR_SELECT2
        .some(
          function(categoryItem) {
            return categoryItem.id ===
          ExplorationCategoryService.savedMemento;
          }
        );

      // If the current category is not in the dropdown, add it
      // as the first option.
      if (!categoryIsInSelect2 &&
          ExplorationCategoryService.savedMemento) {
        $scope.CATEGORY_LIST_FOR_SELECT2.unshift({
          id: ExplorationCategoryService.savedMemento,
          text: ExplorationCategoryService.savedMemento
        });
      }
    }

    $scope.isSavingAllowed = function() {
      return Boolean(
        ExplorationTitleService.displayed &&
        ExplorationObjectiveService.displayed &&
        ExplorationObjectiveService.displayed.length >= 15 &&
        ExplorationCategoryService.displayed &&
        ExplorationLanguageCodeService.displayed);
    };

    $scope.save = function() {
      if (!areRequiredFieldsFilled()) {
        return;
      }

      // Record any fields that have changed.
      var metadataList = [];
      if (ExplorationTitleService.hasChanged()) {
        metadataList.push('title');
      }
      if (ExplorationObjectiveService.hasChanged()) {
        metadataList.push('objective');
      }
      if (ExplorationCategoryService.hasChanged()) {
        metadataList.push('category');
      }
      if (ExplorationLanguageCodeService.hasChanged()) {
        metadataList.push('language');
      }
      if (ExplorationTagsService.hasChanged()) {
        metadataList.push('tags');
      }

      // Save all the displayed values.
      ExplorationTitleService.saveDisplayedValue();
      ExplorationObjectiveService.saveDisplayedValue();
      ExplorationCategoryService.saveDisplayedValue();
      ExplorationLanguageCodeService.saveDisplayedValue();
      ExplorationTagsService.saveDisplayedValue();

      // TODO(sll): Get rid of the $timeout here.
      // It's currently used because there is a race condition: the
      // saveDisplayedValue() calls above result in autosave calls.
      // These race with the discardDraft() call that
      // will be called when the draft changes entered here
      // are properly saved to the backend.
      $timeout(function() {
        $uibModalInstance.close(metadataList);
      }, 500);
    };
  }
]);
