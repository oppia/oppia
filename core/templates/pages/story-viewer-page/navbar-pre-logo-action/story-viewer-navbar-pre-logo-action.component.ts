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
require('domain/story_viewer/story-viewer-backend-api.service.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').component('storyViewerNavbarPreLogoAction', {
  template: require('./story-viewer-navbar-pre-logo-action.component.html'),
  controller: [
    'StoryViewerBackendApiService', 'UrlInterpolationService',
    'UrlService', 'TOPIC_VIEWER_STORY_URL_TEMPLATE', function(
        StoryViewerBackendApiService, UrlInterpolationService,
        UrlService, TOPIC_VIEWER_STORY_URL_TEMPLATE) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      ctrl.getTopicUrl = function() {
        return UrlInterpolationService.interpolateUrl(
          TOPIC_VIEWER_STORY_URL_TEMPLATE, {
            topic_url_fragment: (
              UrlService.getTopicUrlFragmentFromLearnerUrl()),
            classroom_url_fragment: (
              UrlService.getClassroomUrlFragmentFromLearnerUrl())
          });
      };

      ctrl.$onInit = function() {
        ctrl.directiveSubscriptions.add(
          StoryViewerBackendApiService.onSendStoryData.subscribe((data) => {
            ctrl.topicName = data.topicName;
          })
        );
      };
      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }]
});
