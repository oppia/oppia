// Copyright 2012 Google Inc. All Rights Reserved.
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
 * @fileoverview Data and controllers for the Oppia gallery page.
 *
 * @author sll@google.com (Sean Lip)
 */

function Gallery($scope, $http, $modal, warningsData) {
  $scope.currentUrl = document.URL;
  $scope.root = location.protocol + '//' + location.host;
  $scope.galleryUrl = '/gallery/data/';

  // Retrieves gallery data from the server.
  $http.get($scope.galleryUrl).success(function(galleryData) {
    $scope.categories = galleryData.categories;
  });

  /******************************************
  * Methods controlling the modal dialogs.
  ******************************************/

  /**
   * Displays a modal explaining how to embed the exploration.
   * @param {string} id The id of the exploration to be embedded.
   */
  $scope.showEmbedModal = function(explorationId) {
    warningsData.clear();

    $modal.open({
      templateUrl: 'modals/galleryEmbed',
      backdrop: 'static',
      resolve: {
        currentId: function() {
          return explorationId;
        },
        root: function() {
          return $scope.root;
        },
        isDemoServer: $scope.isDemoServer
      },
      controller: function($scope, $modalInstance, currentId, root, isDemoServer) {
        $scope.isDemoServer = isDemoServer;
        $scope.root = root;
        $scope.currentId = currentId;

        $scope.cancel = function () {
          $modalInstance.dismiss('cancel');
          warningsData.clear();
        };
      }
    });
  };

  $scope.showCreateModal = function() {
    warningsData.clear();

    var modalInstance = $modal.open({
      templateUrl: 'modals/galleryCreate',
      backdrop: 'static',
      resolve: {
        categories: function() {
          return $scope.getCategoryList();
        }
      },
      controller: function($scope, $modalInstance, categories) {
        $scope.newExplorationTitle = '';
        $scope.newExplorationCategory = '';
        $scope.customExplorationCategory = '';
        $scope.includeYamlFile = false;

        $scope.categories = categories;

        $scope.getCategoryName = function(category) {
          return category === '?' ? 'Add New Category...' : category;
        };

        $scope.create = function(title, newCategory, customCategory) {
          if (!title) {
            warningsData.addWarning('Please specify an exploration title.');
            return;
          }

          if (newCategory === '?') {
            newCategory = customCategory;
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
    });

    modalInstance.result.then(function(result) {
      $scope.createNewExploration(
        result.title,
        result.category,
        result.includeYamlFile,
        result.yamlFile
      );
    }, function () {
      console.log('Create modal dismissed.');
    });
  };

  /*************************************
  * Methods for handling categories.
  *************************************/
  $scope.getCategoryList = function() {
    var categoryList = [];
    for (var category in $scope.categories) {
      categoryList.push(category);
    }
    categoryList.push('?');
    return categoryList;
  };

  /***************************************************
  * Methods representing 'create' and 'copy' actions.
  ***************************************************/
  $scope.createNewExploration = function(title, category, includeYamlFile, yamlFile) {
    category = $scope.normalizeWhitespace(category);
    if (!$scope.isValidEntityName(category, true)) {
      return;
    }

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
          }
      });
    } else {
      $http.post(
          '/create_new',
          $scope.createRequest({title: title, category: category}),
          {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
              success(function(data) {
                window.location = '/create/' + data.explorationId;
              }).error(function(data) {
                warningsData.addWarning(data.error ? data.error :
                    'Error: Could not add new exploration.');
              });
    }
  };

  $scope.forkExploration = function(explorationId) {
    $http.post(
        '/fork',
        $scope.createRequest({exploration_id: explorationId}),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              window.location = '/create/' + data.explorationId;
            }).error(function(data) {
              warningsData.addWarning(data.error ? data.error :
                  'Error: Could not add new exploration.');
            });
  };


  /*********************************************************************
  * Variables and methods for storing and applying user preferences.
  *********************************************************************/
  $scope.canViewExploration = function(exploration) {
    return !$scope.showMyExplorations || exploration.is_owner || exploration.can_edit;
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
Gallery.$inject = ['$scope', '$http', '$modal', 'warningsData'];
