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

require('base_components/BaseContentDirective.ts');

require('services/AlertsService.ts');
require('services/DateTimeFormatService.ts');

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
