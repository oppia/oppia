// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for a topic tile.
 */

require('domain/utilities/url-interpolation.service.ts');

angular.module('oppia').directive('topicSummaryTile', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getTopicSummary: '&topicSummary'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/summary-tile/topic-summary-tile.directive.html'),
      controllerAs: '$ctrl',
      controller: ['TOPIC_VIEWER_URL_TEMPLATE',
        function(TOPIC_VIEWER_URL_TEMPLATE) {
          var ctrl = this;
          ctrl.getTopicLink = function() {
            return UrlInterpolationService.interpolateUrl(
              TOPIC_VIEWER_URL_TEMPLATE, {
                topic_name: ctrl.getTopicSummary().getName()
              });
          };

          ctrl.getStaticImageUrl = function(imagePath) {
            return UrlInterpolationService.getStaticImageUrl(imagePath);
          };
        }
      ]
    };
  }]);
