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
 * @fileoverview Component for a canonical story tile.
 */

require('domain/utilities/url-interpolation.service.ts');
require('domain/topic_viewer/topic-viewer-domain.constants.ajs.ts');

angular.module('oppia').directive('storySummaryTile', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getStoryId: '&storyId',
        getStoryTitle: '&title',
        getStoryDescription: '&description',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/summary-tile/story-summary-tile.directive.html'),
      controllerAs: '$ctrl',
      controller: ['STORY_VIEWER_URL_TEMPLATE',
        function(STORY_VIEWER_URL_TEMPLATE) {
          var ctrl = this;
          ctrl.getStoryLink = function() {
            return UrlInterpolationService.interpolateUrl(
              STORY_VIEWER_URL_TEMPLATE, {
                story_id: ctrl.getStoryId()
              });
          };

          ctrl.getStaticImageUrl = function(imagePath) {
            return UrlInterpolationService.getStaticImageUrl(imagePath);
          };
        }
      ]
    };
  }]);
