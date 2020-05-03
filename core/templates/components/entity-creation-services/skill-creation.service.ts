// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Functionality for creating a new skill.
 */

require('domain/utilities/url-interpolation.service.ts');
require('services/alerts.service.ts');
require('domain/skill/skill-creation-backend-api.service.ts');

require(
  'pages/topics-and-skills-dashboard-page/' +
  'topics-and-skills-dashboard-page.constants.ajs.ts');

angular.module('oppia').factory('SkillCreationService', [
  '$rootScope', '$timeout', '$window', 'AlertsService',
  'SkillCreationBackendApiService', 'UrlInterpolationService',
  'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
  'SKILL_DESCRIPTION_STATUS_VALUES',
  function(
      $rootScope, $timeout, $window, AlertsService,
      SkillCreationBackendApiService, UrlInterpolationService,
      EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED,
      SKILL_DESCRIPTION_STATUS_VALUES) {
    var CREATE_NEW_SKILL_URL_TEMPLATE = (
      '/skill_editor/<skill_id>');
    var skillCreationInProgress = false;
    var skillDescriptionStatusMarker = (
      SKILL_DESCRIPTION_STATUS_VALUES.STATUS_UNCHANGED);

    return {
      markChangeInSkillDescription: function() {
        skillDescriptionStatusMarker = (
          SKILL_DESCRIPTION_STATUS_VALUES.STATUS_CHANGED);
      },

      getSkillDescriptionStatus: function() {
        return skillDescriptionStatusMarker;
      },

      disableSkillDescriptionStatusMarker: function() {
        skillDescriptionStatusMarker = (
          SKILL_DESCRIPTION_STATUS_VALUES.STATUS_DISABLED);
      },

      resetSkillDescriptionStatusMarker: function() {
        skillDescriptionStatusMarker = (
          SKILL_DESCRIPTION_STATUS_VALUES.STATUS_UNCHANGED);
      },

      createNewSkill: function(
          description, rubrics, explanation, linkedTopicIds) {
        if (skillCreationInProgress) {
          return;
        }
        for (var idx in rubrics) {
          rubrics[idx] = rubrics[idx].toBackendDict();
        }
        skillCreationInProgress = true;
        AlertsService.clearWarnings();
        SkillCreationBackendApiService.createSkill(
          description, rubrics, explanation, linkedTopicIds)
          .then(function(response) {
            $timeout(function() {
              $rootScope.$broadcast(
                EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED, true);
              skillCreationInProgress = false;
              $window.open(
                UrlInterpolationService.interpolateUrl(
                  CREATE_NEW_SKILL_URL_TEMPLATE, {
                    skill_id: response.skillId
                  }), '_blank'
              );
            }, 150);
          });
      }
    };
  }
]);
