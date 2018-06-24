// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Functionality for the create question button.
 */

oppia.factory('QuestionCreationService', [
  '$http', '$timeout', '$rootScope', '$window',
  'AlertsService', 'siteAnalyticsService', 'UrlInterpolationService',
  function(
      $http, $timeout, $rootScope, $window,
      AlertsService, siteAnalyticsService, UrlInterpolationService) {
    var CREATE_NEW_QUESTION_URL_TEMPLATE = '/question_editor/<question_id>';

    var questionCreationInProgress = false;

    return {
      createNewQuestion: function() {
        if (questionCreationInProgress) {
          return;
        }

        questionCreationInProgress = true;
        AlertsService.clearWarnings();
        $rootScope.loadingMessage = 'Creating question';

        $http.post('/questioncreationhandler', {
        }).then(function(response) {
          siteAnalyticsService.registerCreateNewQuestionEvent(
            response.data.questionId);
          $timeout(function() {
            $window.location = UrlInterpolationService.interpolateUrl(
              CREATE_NEW_QUESTION_URL_TEMPLATE, {
                question_id: response.data.questionId
              }
            );
          }, 150);
          return false;
        }, function() {
          $rootScope.loadingMessage = '';
          questionCreationInProgress = false;
        });
      }
    };
  }
]);
