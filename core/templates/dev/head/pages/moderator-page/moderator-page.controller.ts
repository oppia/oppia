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

require('base-components/base-content.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-editor.directive.ts');

require('services/alerts.service.ts');
require('services/date-time-format.service.ts');

angular.module('oppia').directive('moderatorPage', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/moderator-page/moderator-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$http', '$rootScope', 'AlertsService', 'DateTimeFormatService',
        function($http, $rootScope, AlertsService, DateTimeFormatService) {
          var ctrl = this;
          $rootScope.loadingMessage = 'Loading';
          ctrl.getDatetimeAsString = function(millisSinceEpoch) {
            return DateTimeFormatService.getLocaleAbbreviatedDatetimeString(
              millisSinceEpoch);
          };

          ctrl.getExplorationCreateUrl = function(explorationId) {
            return '/create/' + explorationId;
          };

          ctrl.getActivityCreateUrl = function(reference) {
            return (
              (reference.type === (
                'exploration' ? '/create' : '/create_collection')) +
              '/' + reference.id);
          };

          ctrl.allCommits = [];
          ctrl.allFeedbackMessages = [];
          // Map of exploration ids to objects containing a single key: title.
          ctrl.explorationData = {};

          ctrl.displayedFeaturedActivityReferences = [];
          ctrl.lastSavedFeaturedActivityReferences = [];
          ctrl.FEATURED_ACTIVITY_REFERENCES_SCHEMA = {
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
              if (!ctrl.explorationData.hasOwnProperty(expId)) {
                ctrl.explorationData[expId] = (
                  explorationIdsToExplorationData[expId]);
              }
            }
            ctrl.allCommits = data.results;
            $rootScope.loadingMessage = '';
          });

          $http.get('/recent_feedback_messages').then(function(response) {
            ctrl.allFeedbackMessages = response.data.results;
          });

          $http.get('/moderatorhandler/featured').then(function(response) {
            ctrl.displayedFeaturedActivityReferences = (
              response.data.featured_activity_references);
            ctrl.lastSavedFeaturedActivityReferences = angular.copy(
              ctrl.displayedFeaturedActivityReferences);
          });

          ctrl.isSaveFeaturedActivitiesButtonDisabled = function() {
            return angular.equals(
              ctrl.displayedFeaturedActivityReferences,
              ctrl.lastSavedFeaturedActivityReferences);
          };

          ctrl.saveFeaturedActivityReferences = function() {
            AlertsService.clearWarnings();

            var activityReferencesToSave = angular.copy(
              ctrl.displayedFeaturedActivityReferences);
            $http.post('/moderatorhandler/featured', {
              featured_activity_reference_dicts: activityReferencesToSave
            }).then(function() {
              ctrl.lastSavedFeaturedActivityReferences = (
                activityReferencesToSave);
              AlertsService.addSuccessMessage('Featured activities saved.');
            });
          };
        }
      ]
    };
  }]);
