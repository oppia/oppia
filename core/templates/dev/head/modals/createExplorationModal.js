// Copyright 2013 Google Inc. All Rights Reserved.
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
 * @fileoverview Controller for the exploration creation modal.
 *
 * @author sll@google.com (Sean Lip)
 */

function CreateExplorationModal($scope, $http, $rootScope, $modal, warningsData, oppiaRequestCreator) {

  $scope.showCreateExplorationModal = function(categoryList) {
    warningsData.clear();

    var modalInstance = $modal.open({
      templateUrl: 'modals/galleryCreate',
      backdrop: 'static',
      resolve: {
        categoryList: function() {
          return categoryList;
        }
      },
      controller: [
        '$scope', '$modalInstance', 'categoryList',
        function($scope, $modalInstance, categoryList) {
          $scope.categoryList = categoryList;

          $scope.newExplorationTitle = '';
          $scope.newExplorationCategory = '';
          $scope.includeYamlFile = false;

          $scope.create = function(title, newCategory) {
            if (!title) {
              warningsData.addWarning('Please specify an exploration title.');
              return;
            }

            if (!newCategory) {
              warningsData.addWarning('Please specify a category for this exploration.');
              return;
            }

            $modalInstance.close({
              title: title,
              category: newCategory,
              includeYamlFile: $scope.includeYamlFile,
              yamlFile: $scope.file
            });
          };

          $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
            warningsData.clear();
          };
        }
      ]
    });

    modalInstance.result.then(function(result) {
      var title = result.title;
      var category = $scope.normalizeWhitespace(result.category);
      var includeYamlFile = result.includeYamlFile;
      var yamlFile = result.yamlFile;

      if (!$scope.isValidEntityName(category, true)) {
        return;
      }

      $rootScope.loadingMessage = 'Creating exploration';

      if (yamlFile && includeYamlFile) {
        // A yaml file was uploaded.
        var form = new FormData();
        form.append('yaml', yamlFile);
        form.append('category', category);
        form.append('title', title);

        $.ajax({
          url: '/create_new',
          data: form,
          processData: false,
          contentType: false,
          type: 'POST',
          success: function(data) {
            window.location = '/create/' + JSON.parse(data).explorationId;
          },
          error: function(data) {
            warningsData.addWarning(
              JSON.parse(data.responseText).error ||
              'Error communicating with server.');
            $rootScope.loadingMessage = '';
          }
        });
      } else {
        $http.post(
          '/create_new',
          oppiaRequestCreator.createRequest({title: title, category: category}),
          {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              window.location = '/create/' + data.explorationId;
            }).error(function(data) {
              warningsData.addWarning(data.error ? data.error :
                'Error: Could not add new exploration.');
              $rootScope.loadingMessage = '';
            });
      }
    });
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
CreateExplorationModal.$inject = ['$scope', '$http', '$rootScope', '$modal', 'warningsData', 'oppiaRequestCreator'];
