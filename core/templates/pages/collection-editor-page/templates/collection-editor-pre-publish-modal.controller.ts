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
 * @fileoverview Controller for collection editor pre publish modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require('domain/collection/collection-update.service.ts');
require(
  'pages/collection-editor-page/services/collection-editor-state.service.ts');
require('services/alerts.service.ts');

angular.module('oppia').controller(
  'CollectionEditorPrePublishModalController', [
    '$controller', '$scope', '$uibModalInstance', 'AlertsService',
    'CollectionEditorStateService', 'CollectionUpdateService',
    'ALL_CATEGORIES',
    function(
        $controller, $scope, $uibModalInstance, AlertsService,
        CollectionEditorStateService, CollectionUpdateService,
        ALL_CATEGORIES) {
      $controller('ConfirmOrCancelModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance
      });
      var ctrl = this;
      var collection = (
        CollectionEditorStateService.getCollection());
      ctrl.requireTitleToBeSpecified = !collection.getTitle();
      ctrl.requireObjectiveToBeSpecified = (
        !collection.getObjective());
      ctrl.requireCategoryToBeSpecified = (
        !collection.getCategory());

      ctrl.newTitle = collection.getTitle();
      ctrl.newObjective = collection.getObjective();
      ctrl.newCategory = collection.getCategory();

      ctrl.CATEGORY_LIST_FOR_SELECT2 = [];
      for (var i = 0; i < ALL_CATEGORIES.length; i++) {
        ctrl.CATEGORY_LIST_FOR_SELECT2.push({
          id: ALL_CATEGORIES[i],
          text: ALL_CATEGORIES[i]
        });
      }

      ctrl.isSavingAllowed = function() {
        return Boolean(
          ctrl.newTitle && ctrl.newObjective &&
          ctrl.newCategory);
      };

      ctrl.save = function() {
        if (!ctrl.newTitle) {
          AlertsService.addWarning('Please specify a title');
          return;
        }
        if (!ctrl.newObjective) {
          AlertsService.addWarning('Please specify an objective');
          return;
        }
        if (!ctrl.newCategory) {
          AlertsService.addWarning('Please specify a category');
          return;
        }

        // Record any fields that have changed.
        var metadataList = [];
        if (ctrl.newTitle !== collection.getTitle()) {
          metadataList.push('title');
          CollectionUpdateService.setCollectionTitle(
            collection, ctrl.newTitle);
        }
        if (ctrl.newObjective !== collection.getObjective()) {
          metadataList.push('objective');
          CollectionUpdateService.setCollectionObjective(
            collection, ctrl.newObjective);
        }
        if (ctrl.newCategory !== collection.getCategory()) {
          metadataList.push('category');
          CollectionUpdateService.setCollectionCategory(
            collection, ctrl.newCategory);
        }

        $uibModalInstance.close(metadataList);
      };

      ctrl.cancel = $scope.cancel;
    }
  ]);
