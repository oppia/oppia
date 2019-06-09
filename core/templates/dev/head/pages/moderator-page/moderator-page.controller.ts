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
 * @fileoverview Data and controllers for the Oppia moderator page.
 */

// TODO(vojtechjelinek): this block of requires should be removed after we
// introduce webpack for /extensions
require('filters/convert-unicode-with-params-to-html.filter.ts');
require('filters/convert-html-to-unicode.filter.ts');
require('filters/convert-unicode-to-html.filter.ts');
require('components/forms/validators/is-at-least.filter.ts');
require('components/forms/validators/is-at-most.filter.ts');
require('components/forms/validators/is-float.filter.ts');
require('components/forms/validators/is-integer.filter.ts');
require('components/forms/validators/is-nonempty.filter.ts');
require(
  'components/forms/custom-forms-directives/apply-validation.directive.ts');
require(
  'components/forms/custom-forms-directives/require-is-float.directive.ts');
require('filters/string-utility-filters/underscores-to-camel-case.filter.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-choices-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-dict-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-list-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-unicode-editor.directive.ts');
// ^^^ this block of requires should be removed ^^^

require('services/AlertsService.ts');
require('services/DateTimeFormatService.ts');

oppia.controller('Moderator', [
  '$http', '$rootScope', '$scope', 'AlertsService', 'DateTimeFormatService',
  function($http, $rootScope, $scope, AlertsService, DateTimeFormatService) {
    $rootScope.loadingMessage = 'Loading';
    $scope.getDatetimeAsString = function(millisSinceEpoch) {
      return DateTimeFormatService.getLocaleAbbreviatedDatetimeString(
        millisSinceEpoch);
    };

    $scope.getExplorationCreateUrl = function(explorationId) {
      return '/create/' + explorationId;
    };

    $scope.getActivityCreateUrl = function(reference) {
      return (
        (reference.type === 'exploration' ? '/create' : '/create_collection') +
        '/' + reference.id);
    };

    $scope.allCommits = [];
    $scope.allFeedbackMessages = [];
    // Map of exploration ids to objects containing a single key: title.
    $scope.explorationData = {};

    $scope.displayedFeaturedActivityReferences = [];
    $scope.lastSavedFeaturedActivityReferences = [];
    $scope.FEATURED_ACTIVITY_REFERENCES_SCHEMA = {
      type: 'list',
      items: {
        type: 'dict',
        properties: [{
          name: 'type',
          schema: {
            type: 'unicode',
            choices: ['exploration', 'collection']
          }
        }, {
          name: 'id',
          schema: {
            type: 'unicode'
          }
        }]
      }
    };

    var RECENT_COMMITS_URL = (
      '/recentcommitshandler/recent_commits' +
      '?query_type=all_non_private_commits');
    // TODO(sll): Update this to also support collections.
    $http.get(RECENT_COMMITS_URL).then(function(response) {
      // Update the explorationData object with information about newly-
      // discovered explorations.
      var data = response.data;
      var explorationIdsToExplorationData = data.exp_ids_to_exp_data;
      for (var expId in explorationIdsToExplorationData) {
        if (!$scope.explorationData.hasOwnProperty(expId)) {
          $scope.explorationData[expId] = (
            explorationIdsToExplorationData[expId]);
        }
      }
      $scope.allCommits = data.results;
      $rootScope.loadingMessage = '';
    });

    $http.get('/recent_feedback_messages').then(function(response) {
      $scope.allFeedbackMessages = response.data.results;
    });

    $http.get('/moderatorhandler/featured').then(function(response) {
      $scope.displayedFeaturedActivityReferences = (
        response.data.featured_activity_references);
      $scope.lastSavedFeaturedActivityReferences = angular.copy(
        $scope.displayedFeaturedActivityReferences);
    });

    $scope.isSaveFeaturedActivitiesButtonDisabled = function() {
      return angular.equals(
        $scope.displayedFeaturedActivityReferences,
        $scope.lastSavedFeaturedActivityReferences);
    };

    $scope.saveFeaturedActivityReferences = function() {
      AlertsService.clearWarnings();

      var activityReferencesToSave = angular.copy(
        $scope.displayedFeaturedActivityReferences);
      $http.post('/moderatorhandler/featured', {
        featured_activity_reference_dicts: activityReferencesToSave
      }).then(function() {
        $scope.lastSavedFeaturedActivityReferences = activityReferencesToSave;
        AlertsService.addSuccessMessage('Featured activities saved.');
      });
    };
  }
]);
