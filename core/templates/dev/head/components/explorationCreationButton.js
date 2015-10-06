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
 * @fileoverview Modal and functionality for the create exploration button.
 *
 * @author sll@google.com (Sean Lip)
 */


// Service for the create/upload exploration buttons and modals.
oppia.factory('createExplorationButtonService', [
    '$filter', '$http', '$modal', '$timeout', '$rootScope', 'validatorsService', 'warningsData', 'focusService',
    function($filter, $http, $modal, $timeout, $rootScope, validatorsService, warningsData, focusService) {
  var createExplorationButtonService = {
    _getCreateModalInstance: function(categoryList, isUploadModal) {
      var modalInstance = $modal.open({
        templateUrl: 'modals/galleryCreateNew',
        backdrop: true,
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
          },
          isUploadModal: function() {
            return isUploadModal;
          }
        },
        controller: [
          '$scope', '$modalInstance', 'categoriesForDropdown', 'isUploadModal',
          function($scope, $modalInstance, categoriesForDropdown, isUploadModal) {
            $scope.categoriesForDropdown = categoriesForDropdown;
            $scope.newExplorationTitle = '';
            $scope.newExplorationCategory = '';
            $scope.newExplorationObjective = '';
            $scope.newExplorationLanguageCode = GLOBALS.DEFAULT_LANGUAGE_CODE;
            $scope.isUploadModal = isUploadModal;
            $scope.changedAtLeastOnce = false;

            $scope.getAllLanguageCodes = function() {
              return GLOBALS.ALL_LANGUAGE_CODES;
            }

            $scope.save = function(title, newCategory, objective, languageCode) {
              if (!$scope.isTitleValid(title)) {
                return;
              }

              if (!newCategory) {
                warningsData.addWarning('Please specify a category for this exploration.');
                return;
              }

              var returnObj = {
                title: title,
                category: newCategory,
              };

              if ($scope.isUploadModal) {
                var file = document.getElementById('newFileInput').files[0];
                if (!file || !file.size) {
                  warningsData.addWarning('Empty file detected.');
                  return;
                }
                returnObj.yamlFile = file;
              } else {
                returnObj.objective = objective;
                returnObj.languageCode = languageCode;
              }

              $modalInstance.close(returnObj);
            };

            // Checks the validity of exploration title.
            $scope.isTitleValid = function(title, changedAtLeastOnce) {

              if (changedAtLeastOnce) {
                $scope.changedAtLeastOnce = true;
              }

              if (!title) {
                $scope.warningText = 'Please enter an exploration title.';
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
              warningsData.clear();
            };
          }
        ]
      });

      modalInstance.opened.then(function(data) {
        // The $timeout seems to be needed in order to give the modal time to
        // render.
        $timeout(function() {
          focusService.setFocus('newExplorationModalOpened');
        });
      });

      return modalInstance;
    },
    showCreateExplorationModal: function(categoryList) {
      warningsData.clear();

      createExplorationButtonService._getCreateModalInstance(
          categoryList, false).result.then(function(result) {
        var category = $filter('normalizeWhitespace')(result.category);
        if (!validatorsService.isValidEntityName(category, true)) {
          return;
        }

        $rootScope.loadingMessage = 'Creating exploration';
        $http.post('/contributehandler/create_new', {
          title: result.title,
          category: category,
          objective: $filter('normalizeWhitespace')(result.objective),
          language_code: result.languageCode
        }).success(function(data) {
          window.location = '/create/' + data.explorationId;
        }).error(function(data) {
          $rootScope.loadingMessage = '';
        });
      });
    },
    showUploadExplorationModal: function(categoryList) {
      warningsData.clear();

      createExplorationButtonService._getCreateModalInstance(
          categoryList, true).result.then(function(result) {
        var title = result.title;
        var category = $filter('normalizeWhitespace')(result.category);
        var yamlFile = result.yamlFile;

        if (!validatorsService.isValidEntityName(category, true)) {
          return;
        }

        $rootScope.loadingMessage = 'Creating exploration';

        var form = new FormData();
        form.append('yaml_file', yamlFile);
        form.append(
          'payload', JSON.stringify({category: category, title: title}));
        form.append('csrf_token', GLOBALS.csrf_token);

        $.ajax({
          url: 'contributehandler/upload',
          data: form,
          processData: false,
          contentType: false,
          type: 'POST',
          dataFilter: function(data, type) {
            // Remove the XSSI prefix.
            return JSON.parse(data.substring(5));
          },
          dataType: 'text'
        }).done(function(data) {
          window.location = '/create/' + data.explorationId;
        }).fail(function(data) {
          var transformedData = data.responseText.substring(5);
          var parsedResponse = JSON.parse(transformedData);
          warningsData.addWarning(
            parsedResponse.error || 'Error communicating with server.');
          $rootScope.loadingMessage = '';
          $scope.$apply();
        });
      });
    }
  };
  return createExplorationButtonService;
}]);
