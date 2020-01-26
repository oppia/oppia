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
require('services/csrf-token.service.ts');

angular.module('oppia').factory('SkillCreationService', [
  '$rootScope', '$timeout', '$window', 'AlertsService',
  'CsrfTokenService', 'UrlInterpolationService',
  function(
      $rootScope, $timeout, $window, AlertsService,
      CsrfTokenService, UrlInterpolationService) {
    var CREATE_NEW_SKILL_URL_TEMPLATE = (
      '/skill_editor/<skill_id>');
    var CREATE_NEW_SKILL_URL = '/skill_editor_handler/create_new';
    var skillCreationInProgress = false;

    return {
      createNewSkill: function(
          description, rubrics, explanation, linkedTopicIds,
          thumbnailFilename, thumbnailDataUrl) {
        if (skillCreationInProgress) {
          return;
        }
        for (var idx in rubrics) {
          rubrics[idx] = rubrics[idx].toBackendDict();
        }
        skillCreationInProgress = true;
        AlertsService.clearWarnings();
        $rootScope.loadingMessage = 'Creating skill';
        let form = new FormData();
        form.append('image', thumbnailDataUrl);
        form.append('payload', JSON.stringify({
          description: description,
          linked_topic_ids: linkedTopicIds,
          explanation_dict: explanation,
          rubrics: rubrics,
          thumbnail_filename: thumbnailFilename,
        }));
        CsrfTokenService.getTokenAsync().then(function(token) {
          form.append('csrf_token', token);
          $.ajax({
            url: CREATE_NEW_SKILL_URL,
            data: form,
            processData: false,
            contentType: false,
            type: 'POST',
            dataFilter: function(data) {
              // Remove the XSSI prefix.
              var transformedData = data.substring(5);
              return JSON.parse(transformedData);
            },
            dataType: 'text'
          }).done(function(response) {
            $timeout(function() {
              $window.location = UrlInterpolationService.interpolateUrl(
                CREATE_NEW_SKILL_URL_TEMPLATE, {
                  skill_id: response.skillId
                });
            }, 150);
            $rootScope.loadingMessage = '';
          }).fail(function(data) {
            // Remove the XSSI prefix.
            var transformedData = data.responseText.substring(5);
            var parsedResponse = JSON.parse(transformedData);
            $rootScope.loadingMessage = '';
            AlertsService.addWarning(
              parsedResponse.error || 'Error communicating with server.');
          });
        });
      }
    };
  }
]);
