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
 * @fileoverview Directive for the navbar pre-logo-action
 *  of the story viewer.
 */

require('domain/classroom/classroom-domain.constants.ajs.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/contextual/url.service.ts');

angular.module('oppia').component('storyViewerNavbarPreLogoAction', {
  template: require('./story-viewer-navbar-pre-logo-action.component.html'),
  controller: [
    '$rootScope', 'UrlInterpolationService', 'UrlService',
    'TOPIC_VIEWER_STORY_URL_TEMPLATE', function(
        $rootScope, UrlInterpolationService, UrlService,
        TOPIC_VIEWER_STORY_URL_TEMPLATE) {
      var ctrl = this;
      ctrl.getTopicUrl = function() {
        return UrlInterpolationService.interpolateUrl(
          TOPIC_VIEWER_STORY_URL_TEMPLATE, {
            abbrev_topic_name: UrlService.getAbbrevTopicNameFromLearnerUrl(),
            classroom_name: UrlService.getClassroomNameFromLearnerUrl()
          });
      };

      ctrl.$onInit = function() {
        $rootScope.$on('storyData', function(evt, data) {
          ctrl.topicName = data.topicName;
        });
      };
    }]
});
