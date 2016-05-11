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
 * @fileoverview Modal and functionality for the create collection button.
 */

// TODO(bhenning): Refactor this to match the frontend design spec and reduce
// duplicated code between CollectionCreationButtonService and
// ExplorationCreationButtonService.

oppia.factory('CollectionCreationButtonService', [
  '$filter', '$http', '$modal', '$timeout', '$rootScope',
  'validatorsService', 'alertsService', 'focusService',
  function(
      $filter, $http, $modal, $timeout, $rootScope,
      validatorsService, alertsService, focusService) {
    var getModalInstance = function(categoryList) {
      var modalInstance = $modal.open({
        backdrop: true,
        templateUrl: 'modals/createNewActivity',
        resolve: {
          categoriesForDropdown: function() {
            var result = [];
            var sortedCategories = categoryList.sort();
            for (var i = 0; i < sortedCategories.length; i++) {
              result.push({
                id: sortedCategories[i],
                text: sortedCategories[i]
              });
            }
            return result;
          }
        },
        controller: [
          '$scope', '$modalInstance', 'categoriesForDropdown',
          function(
              $scope, $modalInstance, categoriesForDropdown) {
            $scope.createNewTitle = 'Create New Collection';
            $scope.activityName = 'collection';
            $scope.categoriesForDropdown = categoriesForDropdown;
            $scope.newActivityTitle = '';
            $scope.newActivityCategory = '';
            $scope.newActivityObjective = '';
            $scope.newActivityLanguageCode = GLOBALS.DEFAULT_LANGUAGE_CODE;
            $scope.isUploadModal = false;
            $scope.changedAtLeastOnce = false;

            $scope.getAllLanguageCodes = function() {
              return GLOBALS.ALL_LANGUAGE_CODES;
            };

            $scope.save = function(title, category, objective, languageCode) {
              if (!$scope.isTitleValid(title)) {
                return;
              }

              if (!category) {
                alertsService.addWarning(
                  'Please specify a category for this collection.');
                return;
              }

              $modalInstance.close({
                category: category,
                title: title,
                objective: objective,
                languageCode: languageCode
              });
            };

            // Checks the validity of the colleciton title.
            $scope.isTitleValid = function(title, changedAtLeastOnce) {
              if (changedAtLeastOnce) {
                $scope.changedAtLeastOnce = true;
              }

              if (!title) {
                $scope.warningText = 'Please enter a collection title.';
                return false;
              }

              if (!validatorsService.isValidEntityName(title, false)) {
                $scope.warningText = 'Please use ' +
                  'letters, numbers, hyphens and spaces only.';
                return false;
              }

              $scope.warningText = '';
              return true;
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              alertsService.clearWarnings();
            };
          }
        ]
      });

      modalInstance.opened.then(function() {
        // The $timeout seems to be needed in order to give the modal time to
        // render.
        $timeout(function() {
          focusService.setFocus('newActivityModalOpened');
        }, 300);
      });

      return modalInstance;
    };

    return {
      showCreateCollectionModal: function(categoryList) {
        alertsService.clearWarnings();

        getModalInstance(categoryList, false).result.then(function(result) {
          var category = $filter('normalizeWhitespace')(result.category);
          if (!validatorsService.isValidEntityName(category, true)) {
            return;
          }

          $rootScope.loadingMessage = 'Creating collection';
          $http.post('/collection_editor_handler/create_new', {
            category: category,
            language_code: result.languageCode,
            objective: $filter('normalizeWhitespace')(result.objective),
            title: result.title
          }).then(function(response) {
            var data = response.data;
            window.location = '/collection_editor/create/' + data.collectionId;
          }, function() {
            $rootScope.loadingMessage = '';
          });
        });
      }
    };
  }
]);
