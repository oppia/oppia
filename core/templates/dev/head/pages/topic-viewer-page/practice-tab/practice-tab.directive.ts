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
 * @fileoverview Directive for the stories list.
 */

require('components/summary-tile/story-summary-tile.directive.ts');
require('pages/practice-session-page/practice-session-page.constants.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('services/contextual/WindowDimensionsService.ts');

var oppia = require('AppInit.ts').module;

oppia.directive('practiceTab', [
  '$http', '$window', 'UrlInterpolationService',
  'PRACTICE_SESSIONS_URL',
  function(
      $http, $window, UrlInterpolationService,
      PRACTICE_SESSIONS_URL) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getTopicName: '&topicName',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic-viewer-page/practice-tab/practice-tab.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope',
        function(
            $scope) {
          var ctrl = this;

          ctrl.newPracticeSession = function() {
            var practiceSessionsUrl = UrlInterpolationService.interpolateUrl(
              PRACTICE_SESSIONS_URL, {
                topic_name: ctrl.getTopicName()
              });
            $window.location.href = practiceSessionsUrl;
          };
        }
      ]
    };
  }]);
