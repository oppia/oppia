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
 * @fileoverview Directive for the navbar breadcrumb of the topic viewer.
 */
oppia.directive('topicsViewerNavbarBreadcrumb', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getTopicName: '@topicName',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic_viewer/topic_viewer_navbar_breadcrumb_directive.html'),
      controller: [
        function() {}
      ]
    };
  }]);
