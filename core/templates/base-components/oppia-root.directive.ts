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
 * @fileoverview The root directive of the oppia ajs application.
 */

// In case of doubts over what is done here, please look at the description of
// the PR #9479. https://github.com/oppia/oppia/pull/9479#issue-432536289

angular.module('oppia').directive('oppiaRoot', [
  function() {
    return {
      template: require('./oppia-root.directive.html'),
      scope: {},
      transclude: true,
      controllerAs: '$ctrl',
      controller: ['$scope',
        function($scope) {
          $scope.initialized = false;

          $scope.onInit = function() {
            // The next line allows the transcluded content to start executing.
            $scope.initialized = true;
          };
        }]
    };
  }
]);
