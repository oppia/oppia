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
 * @fileoverview Data and controllers for the Oppia contributors' gallery page.
 *
 * @author sll@google.com (Sean Lip)
 */

function ContributeGallery($scope, $http, $rootScope, $modal, warningsData, oppiaRequestCreator) {
  $scope.contributeGalleryDataUrl = '/contributehandler/data';
  $scope.cloneExplorationUrl = '/contributehandler/clone';
  $scope.categoryList = [];

  $rootScope.loadingMessage = 'Loading';

  // Retrieves gallery data from the server.
  $http.get($scope.contributeGalleryDataUrl).success(function(data) {
    $scope.categories = data.categories;

    // Put the category names in a list.
    for (var category in $scope.categories) {
      $scope.categoryList.push(category);
    }

    $rootScope.loadingMessage = '';
  }).error(function(data) {
    warningsData.addWarning(data.error || 'Error communicating with server.');
  });

  $scope.cloneExploration = function(explorationId) {
    $rootScope.loadingMessage = 'Cloning exploration';
    $http.post(
      $scope.cloneExplorationUrl,
      oppiaRequestCreator.createRequest({exploration_id: explorationId}),
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
        success(function(data) {
          window.location = '/create/' + data.explorationId;
        }).error(function(data) {
          warningsData.addWarning(data.error ? data.error :
            'Error: Could not add new exploration.');
          $rootScope.loadingMessage = '';
        });
  };

  $scope.showCreateExplorationModal = function(categoryList) {
    warningsData.clear();

    var modalInstance = $modal.open({
      templateUrl: 'modals/galleryCreateNew',
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
              category: newCategory
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
      if (!$scope.isValidEntityName(category, true)) {
        return;
      }

      $rootScope.loadingMessage = 'Creating exploration';
      $http.post(
        '/contributehandler/create_new',
        oppiaRequestCreator.createRequest({title: title, category: category}),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
          success(function(data) {
            window.location = '/create/' + data.explorationId;
          }).error(function(data) {
            warningsData.addWarning(data.error ? data.error :
              'Error: Could not add new exploration.');
            $rootScope.loadingMessage = '';
          });
    });
  };

  $scope.showUploadExplorationModal = function(categoryList) {
    warningsData.clear();

    var modalInstance = $modal.open({
      templateUrl: 'modals/galleryUpload',
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

          $scope.upload = function(title, newCategory) {
            if (!title) {
              warningsData.addWarning('Please specify an exploration title.');
              return;
            }
            if (!newCategory) {
              warningsData.addWarning('Please specify a category for this exploration.');
              return;
            }

            var file = document.getElementById('newFileInput').files[0];
            if (!file || !file.size) {
              warningsData.addWarning('Empty file detected.');
              return;
            }

            $modalInstance.close({
              title: title,
              category: newCategory,
              yamlFile: file
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
      var yamlFile = result.yamlFile;

      if (!$scope.isValidEntityName(category, true)) {
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
          var transformedData = data.substring(5);
          return JSON.parse(transformedData);
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
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
ContributeGallery.$inject = ['$scope', '$http', '$rootScope', '$modal', 'warningsData', 'oppiaRequestCreator'];
