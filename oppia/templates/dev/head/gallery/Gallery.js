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

function Gallery($scope, $http, warningsData) {
  $scope.currentUrl = document.URL;
  $scope.root = location.protocol + '//' + location.host;
  $scope.galleryUrl = '/gallery/data/';

  // Retrieves gallery data from the server.
  $http.get($scope.galleryUrl).success(function(galleryData) {
    $scope.categories = galleryData.categories;
  });

  /**
   * Returns whether the current URL corresponds to the demo playground server.
   */
  $scope.isDemoServer = function() {
    return location.host == 'oppiaserver.appspot.com';
  };

  /******************************************
  * Methods controlling the modal dialogs.
  ******************************************/

  /**
   * Displays a modal explaining how to embed the exploration.
   * @param {string} id The id of the exploration to be embedded.
   */
  $scope.showEmbedModal = function(explorationId) {
    $scope.currentId = explorationId;
    $('#embedModal').modal();
  };

  $scope.openNewExplorationModal = function() {
    $scope.newExplorationTitle = '';
    $scope.newExplorationCategory = '';
    $scope.customExplorationCategory = '';
    $scope.includeYamlFile = false;
    $('#newExplorationModal').modal();
  };

  $scope.closeNewExplorationModal = function() {
    $('#newExplorationModal').modal('hide');
    warningsData.clear();
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

  $scope.getCategoryName = function(category) {
    return category === '?' ? 'Add New Category...' : category;
  };

  /***************************************************
  * Methods representing 'create' and 'copy' actions.
  ***************************************************/
  $scope.createNewExploration = function() {
    if (!$scope.newExplorationTitle) {
      warningsData.addWarning('Please specify an exploration title.');
      return;
    }

    if (!$scope.newExplorationCategory ||
        ($scope.newExplorationCategory === '?' && !$scope.customExplorationCategory)) {
      warningsData.addWarning('Please specify a category for this exploration.');
      return;
    }

    var title = $scope.newExplorationTitle;
    var category = $scope.newExplorationCategory === '?' ?
                   $scope.customExplorationCategory :
                   $scope.newExplorationCategory;

    if (!$scope.isValidEntityName(category, true)) {
      return;
    }

    if ($scope.file && $scope.includeYamlFile) {
      // A yaml file was uploaded.
      var form = new FormData();
      form.append('yaml', $scope.file);
      form.append('category', category || '');
      form.append('title', title || '');

      $.ajax({
          url: '/create_new',
          data: form,
          processData: false,
          contentType: false,
          type: 'POST',
          success: function(data) {
            $scope.newExplorationTitle = '';
            $scope.newExplorationCategory = '';
            $scope.newExplorationYaml = '';
            window.location = '/create/' + JSON.parse(data).explorationId;
          },
          error: function(data) {
            warningsData.addWarning(
                JSON.parse(data.responseText).error ||
                'Error communicating with server.');
            $scope.$apply();
          }
      });
      return;
    } else {
      $http.post(
          '/create_new',
          $scope.createRequest({title: title || '', category: category || ''}),
          {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
              success(function(data) {
                $scope.newExplorationTitle = '';
                $scope.newExplorationCategory = '';
                $scope.newExplorationYaml = '';
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

  // Whether to show just explorations the user can edit, or all explorations.
  $scope.showMyExplorations = false;

  $scope.toggleExplorationView = function() {
    $scope.showMyExplorations = !$scope.showMyExplorations;
  };

  $scope.getToggleText = function() {
    return $scope.showMyExplorations ?
        '◂ Show all explorations' : 'Show editable explorations ▸';
  };

  $scope.getHeadingText = function() {
    return $scope.showMyExplorations ? 'Explorations you can edit' :
        'All Explorations';
  };

  $scope.canViewExploration = function(exploration) {
    return !$scope.showMyExplorations || exploration.is_owner || exploration.can_edit;
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
Gallery.$inject = ['$scope', '$http', 'warningsData'];
