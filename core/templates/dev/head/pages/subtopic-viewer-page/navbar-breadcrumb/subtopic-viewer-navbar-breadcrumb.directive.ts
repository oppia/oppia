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
 * @fileoverview Directive for the navbar breadcrumb of the subtopic viewer.
 */

require('domain/utilities/url-interpolation.service.ts');
require('services/contextual/url.service.ts');

angular.module('oppia').directive('subtopicViewerNavbarBreadcrumb', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/subtopic-viewer-page/navbar-breadcrumb/' +
        'subtopic-viewer-navbar-breadcrumb.directive.html'),
      controller: [
        '$scope', 'SubtopicViewerBackendApiService', 'UrlService',
        'TOPIC_VIEWER_URL_TEMPLATE', function(
            $scope, SubtopicViewerBackendApiService, UrlService,
            TOPIC_VIEWER_URL_TEMPLATE) {
          $scope.topicName = UrlService.getTopicNameFromLearnerUrl();
          $scope.getTopicUrl = function() {
            return UrlInterpolationService.interpolateUrl(
              TOPIC_VIEWER_URL_TEMPLATE, {
                topic_name: $scope.topicName
              });
          };
          SubtopicViewerBackendApiService.fetchSubtopicData(
            $scope.topicName, UrlService.getSubtopicIdFromUrl()).then(
            function(subtopicDataObject) {
              $scope.subtopicTitle = subtopicDataObject.getSubtopicTitle();
            });
        }
      ]
    };
  }]);
