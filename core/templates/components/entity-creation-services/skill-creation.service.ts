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

angular.module('oppia').factory('SkillCreationService', [
  '$rootScope', '$timeout', '$window', 'AlertsService',
  'SkillCreationBackendApiService', 'UrlInterpolationService',
  function(
      $rootScope, $timeout, $window, AlertsService,
      SkillCreationBackendApiService, UrlInterpolationService) {
    var CREATE_NEW_SKILL_URL_TEMPLATE = (
      '/skill_editor/<skill_id>');
    var skillCreationInProgress = false;

    return {
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
        $rootScope.loadingMessage = 'Creating skill';
        SkillCreationBackendApiService.createSkill(
          description, rubrics, explanation, linkedTopicIds)
          .then(function(response) {
            $timeout(function() {
              $window.location = UrlInterpolationService.interpolateUrl(
                CREATE_NEW_SKILL_URL_TEMPLATE, {
                  skill_id: response.skillId
                });
            }, 150);
          }, function() {
            $rootScope.loadingMessage = '';
          });
      }
    };
  }
]);
