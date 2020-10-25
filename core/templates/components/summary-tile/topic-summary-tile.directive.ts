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

require('domain/classroom/classroom-domain.constants.ajs.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/assets-backend-api.service.ts');

angular.module('oppia').directive('topicSummaryTile', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getTopicSummary: '&topicSummary',
        getClassroomUrlFragment: '&classroomUrlFragment',
        isPublished: '&published'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/summary-tile/topic-summary-tile.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        'AssetsBackendApiService', 'ENTITY_TYPE',
        'TOPIC_VIEWER_URL_TEMPLATE',
        function(
            AssetsBackendApiService, ENTITY_TYPE,
            TOPIC_VIEWER_URL_TEMPLATE) {
          var ctrl = this;
          ctrl.getTopicPageUrl = function() {
            return UrlInterpolationService.interpolateUrl(
              TOPIC_VIEWER_URL_TEMPLATE, {
                topic_url_fragment: ctrl.getTopicSummary().getUrlFragment(),
                classroom_url_fragment: ctrl.getClassroomUrlFragment()
              });
          };

          var getColorValueInHexForm = function(colorValue) {
            colorValue = (colorValue < 0) ? 0 : colorValue;
            var colorValueString = colorValue.toString(16);
            return (
              (colorValueString.length === 1) ?
              '0' + colorValueString : colorValueString);
          };

          ctrl.getDarkerThumbnailBgColor = function() {
            var bgColor = ctrl.getTopicSummary().getThumbnailBgColor();
            // Remove the '#' from the first position.
            bgColor = bgColor.slice(1);

            // Get RGB values of new darker color.
            var newRValue = getColorValueInHexForm(
              parseInt(bgColor.substring(0, 2), 16) - 100);
            var newGValue = getColorValueInHexForm(
              parseInt(bgColor.substring(2, 4), 16) - 100);
            var newBValue = getColorValueInHexForm(
              parseInt(bgColor.substring(4, 6), 16) - 100);

            return '#' + newRValue + newGValue + newBValue;
          };

          ctrl.$onInit = function() {
            if (ctrl.getTopicSummary().getThumbnailFilename()) {
              ctrl.thumbnailUrl = (
                AssetsBackendApiService.getThumbnailUrlForPreview(
                  ENTITY_TYPE.TOPIC, ctrl.getTopicSummary().getId(),
                  ctrl.getTopicSummary().getThumbnailFilename()));
            } else {
              ctrl.thumbnailUrl = null;
            }
          };
        }
      ]
    };
  }]);
