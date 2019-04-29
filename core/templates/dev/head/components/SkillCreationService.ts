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

oppia.factory('SkillCreationService', [
  '$http', '$rootScope', '$timeout', '$window', 'AlertsService',
  'UrlInterpolationService',
  function(
      $http, $rootScope, $timeout, $window, AlertsService,
      UrlInterpolationService) {
    var CREATE_NEW_SKILL_URL_TEMPLATE = (
      '/skill_editor/<skill_id>');
    var skillCreationInProgress = false;

    return {
      createNewSkill: function(description, linkedTopicIds) {
        if (skillCreationInProgress) {
          return;
        }
        skillCreationInProgress = true;
        AlertsService.clearWarnings();
        $rootScope.loadingMessage = 'Creating skill';
        $http.post('/skill_editor_handler/create_new', {
          description: description,
          linked_topic_ids: linkedTopicIds
        }).then(function(response) {
          $timeout(function() {
            $window.location = UrlInterpolationService.interpolateUrl(
              CREATE_NEW_SKILL_URL_TEMPLATE, {
                skill_id: response.data.skillId
              });
          }, 150);
        }, function() {
          $rootScope.loadingMessage = '';
        });
      }
    };
  }
]);
