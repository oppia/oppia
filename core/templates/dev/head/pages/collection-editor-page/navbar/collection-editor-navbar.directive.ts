// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the navbar of the collection editor.
 */

require(
  'components/forms/custom-forms-directives/select2-dropdown.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'loading-dots.directive.ts');

require('domain/collection/CollectionRightsBackendApiService.ts');
require('domain/collection/CollectionUpdateService.ts');
require('domain/collection/CollectionValidationService.ts');
require('domain/collection/EditableCollectionBackendApiService.ts');
require('domain/editor/undo_redo/UndoRedoService.ts');
require('domain/utilities/UrlInterpolationService.ts');
require(
  'pages/collection-editor-page/services/collection-editor-state.service.ts');
require('pages/exploration-editor-page/services/router.service.ts');
require('services/AlertsService.ts');

var oppia = require('AppInit.ts').module;

oppia.directive('collectionEditorNavbar', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/collection-editor-page/navbar/' +
        'collection-editor-navbar.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$uibModal', 'AlertsService', 'RouterService',
        'UndoRedoService', 'CollectionEditorStateService',
        'CollectionValidationService',
        'CollectionRightsBackendApiService',
        'EditableCollectionBackendApiService',
        'EVENT_COLLECTION_INITIALIZED', 'EVENT_COLLECTION_REINITIALIZED',
        'EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED',
        function(
            $scope, $uibModal, AlertsService, RouterService,
            UndoRedoService, CollectionEditorStateService,
            CollectionValidationService,
            CollectionRightsBackendApiService,
            EditableCollectionBackendApiService,
            EVENT_COLLECTION_INITIALIZED, EVENT_COLLECTION_REINITIALIZED,
            EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED) {
          var ctrl = this;
          ctrl.collectionId = GLOBALS.collectionId;
          ctrl.collection = CollectionEditorStateService.getCollection();
          ctrl.collectionRights = (
            CollectionEditorStateService.getCollectionRights());

          ctrl.isLoadingCollection = (
            CollectionEditorStateService.isLoadingCollection);
          ctrl.validationIssues = [];
          ctrl.isSaveInProgress = (
            CollectionEditorStateService.isSavingCollection);

          ctrl.getActiveTabName = RouterService.getActiveTabName;
          ctrl.selectMainTab = RouterService.navigateToMainTab;
          ctrl.selectPreviewTab = RouterService.navigateToPreviewTab;
          ctrl.selectSettingsTab = RouterService.navigateToSettingsTab;
          ctrl.selectStatsTab = RouterService.navigateToStatsTab;
          ctrl.selectHistoryTab = RouterService.navigateToHistoryTab;

          var _validateCollection = function() {
            if (ctrl.collectionRights.isPrivate()) {
              ctrl.validationIssues = (
                CollectionValidationService
                  .findValidationIssuesForPrivateCollection(
                    ctrl.collection));
            } else {
              ctrl.validationIssues = (
                CollectionValidationService
                  .findValidationIssuesForPublicCollection(
                    ctrl.collection));
            }
          };

          var _publishCollection = function() {
            // TODO(bhenning): This also needs a confirmation of destructive
            // action since it is not reversible.
            CollectionRightsBackendApiService.setCollectionPublic(
              ctrl.collectionId, ctrl.collection.getVersion()).then(
              function() {
                ctrl.collectionRights.setPublic();
                CollectionEditorStateService.setCollectionRights(
                  ctrl.collectionRights);
              });
          };

          $scope.$on(
            EVENT_COLLECTION_INITIALIZED, _validateCollection);
          $scope.$on(EVENT_COLLECTION_REINITIALIZED, _validateCollection);
          $scope.$on(
            EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED, _validateCollection);

          ctrl.getWarningsCount = function() {
            return ctrl.validationIssues.length;
          };

          ctrl.getChangeListCount = function() {
            return UndoRedoService.getChangeCount();
          };

          ctrl.isCollectionSaveable = function() {
            return (
              ctrl.getChangeListCount() > 0 &&
              ctrl.validationIssues.length === 0);
          };

          ctrl.isCollectionPublishable = function() {
            return (
              ctrl.collectionRights.isPrivate() &&
              ctrl.getChangeListCount() === 0 &&
              ctrl.validationIssues.length === 0);
          };

          ctrl.saveChanges = function() {
            var isPrivate = ctrl.collectionRights.isPrivate();
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/collection-editor-page/templates/' +
                'collection-editor-save-modal.directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.isCollectionPrivate = isPrivate;

                  $scope.save = function(commitMessage) {
                    $uibModalInstance.close(commitMessage);
                  };
                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });

            modalInstance.result.then(function(commitMessage) {
              CollectionEditorStateService.saveCollection(commitMessage);
            });
          };

          ctrl.publishCollection = function() {
            var additionalMetadataNeeded = (
              !ctrl.collection.getTitle() ||
              !ctrl.collection.getObjective() ||
              !ctrl.collection.getCategory());

            if (additionalMetadataNeeded) {
              $uibModal.open({
                bindToController: {},
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/pages/collection-editor-page/templates/' +
                  'collection-editor-pre-publish-modal.directive.html'),
                backdrop: true,
                controllerAs: '$ctrl',
                controller: [
                  '$uibModalInstance', 'CollectionEditorStateService',
                  'CollectionUpdateService', 'ALL_CATEGORIES',
                  function(
                      $uibModalInstance, CollectionEditorStateService,
                      CollectionUpdateService, ALL_CATEGORIES) {
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

                    ctrl.cancel = function() {
                      $uibModalInstance.dismiss('cancel');
                    };
                  }
                ]
              }).result.then(function(metadataList) {
                var commitMessage = (
                  'Add metadata: ' + metadataList.join(', ') + '.');
                CollectionEditorStateService.saveCollection(
                  commitMessage, _publishCollection);
              });
            } else {
              _publishCollection();
            }
          };

          // Unpublish the collection. Will only show up if the collection is
          // public and the user has access to the collection.
          ctrl.unpublishCollection = function() {
            CollectionRightsBackendApiService.setCollectionPrivate(
              ctrl.collectionId, ctrl.collection.getVersion()).then(
              function() {
                ctrl.collectionRights.setPrivate();
                CollectionEditorStateService.setCollectionRights(
                  ctrl.collectionRights);
              }, function() {
                AlertsService.addWarning(
                  'There was an error when unpublishing the collection.');
              });
          };
        }
      ]
    };
  }]);
