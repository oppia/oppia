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

oppia.factory('GalleryData', function($rootScope, $http, warningsData) {
  var GalleryData = {};
  var galleryUrl = '/gallery/data/';

  GalleryData.getData = function() {
    var obj = this;
    $http.get(galleryUrl).success(function(data) {
      obj.data = data;
      obj.broadcastGalleryData();
    }).error(function(data) {
      warningsData.addWarning('Server error: ' + data.error);
    });
  };

  GalleryData.broadcastGalleryData = function() {
    $rootScope.$broadcast('galleryData');
  };

  GalleryData.getData();

  return GalleryData;
});


function Gallery($scope, $http, warningsData, GalleryData) {
  $scope.currentUrl = document.URL;
  $scope.root = location.protocol + '//' + location.host;

  $scope.$on('galleryData', function() {
    console.log(GalleryData.data.categories);
    $scope.categories = GalleryData.data.categories;
    $scope.$apply();

    if ($('#navTabs a[href="#My_Explorations"]')) {
      $('#navTabs a[href="#My_Explorations"]').tab('show');
    }
  });

  /**
   * Displays a model explaining how to embed the exploration.
   * @param {string} id The id of the exploration to be embedded.
   */
   $scope.showModal = function(id) {
     $scope.currentId = id;
     $('#embedModal').modal();
   };

  $scope.openNewExplorationModal = function() {
    $scope.newExplorationIsBeingAdded = true;
    $scope.includeYamlFile = false;
    $('#newExplorationModal').modal();
  };

  $scope.closeNewExplorationModal = function() {
    $('#newExplorationModal').modal('hide');
    warningsData.clear();
  };

  $scope.forkExploration = function(explorationId) {
    var request = $.param({
      exploration_id: explorationId
    }, true);

    $http.post(
        '/fork',
        request,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              window.location = '/create/' + data.explorationId;
            }).error(function(data) {
              warningsData.addWarning(data.error ? data.error :
                  'Error: Could not add new exploration.');
            });
  };

  $scope.createNewExploration = function() {
    if (!$scope.newExplorationTitle) {
      warningsData.addWarning('Please specify an exploration title.');
      return;
    }

    if (!$scope.newExplorationCategory) {
      warningsData.addWarning('Please specify a category for this exploration.');
      return;
    }

    if ($scope.file && $scope.includeYamlFile) {
      // A yaml file was uploaded.
      var form = new FormData();
      form.append('yaml', $scope.file);
      form.append('category', $scope.newExplorationCategory || '');
      form.append('title', $scope.newExplorationTitle || '');

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
      var requestMap = {
          title: $scope.newExplorationTitle || '',
          category: $scope.newExplorationCategory || ''
      };

      var request = $.param(requestMap, true);

      $http.post(
          '/create_new',
          request,
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

}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
Gallery.$inject = ['$scope', '$http', 'warningsData', 'GalleryData'];
