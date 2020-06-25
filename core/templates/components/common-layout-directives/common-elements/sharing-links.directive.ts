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
 * @fileoverview Directive for the Social Sharing Links.
 */

require('components/button-directives/exploration-embed-button.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/html-escaper.service.ts');
require('services/site-analytics.service.ts');

angular.module('oppia').directive('sharingLinks', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        layoutType: '@',
        layoutAlignType: '@',
        shareType: '@',
        getExplorationId: '&explorationId',
        getCollectionId: '&collectionId'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/common-layout-directives/common-elements/' +
        'sharing-links.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$window', 'HtmlEscaperService',
        'ExplorationEmbedButtonService', 'SiteAnalyticsService',
        'DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR',
        function(
            $window, HtmlEscaperService,
            ExplorationEmbedButtonService, SiteAnalyticsService,
            DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR) {
          var ctrl = this;
          ctrl.$onInit = function() {
            ctrl.registerShareEvent = null;

            if (ctrl.shareType === 'exploration') {
              ctrl.explorationId = ctrl.getExplorationId();

              ctrl.activityType = 'explore';
              ctrl.activityId = ctrl.explorationId;

              ctrl.registerShareEvent = function(network) {
                SiteAnalyticsService.registerShareExplorationEvent(network);
              };

              ctrl.showEmbedExplorationModal = function(expId) {
                ExplorationEmbedButtonService.showModal(expId);
              };
            } else if (ctrl.shareType === 'collection') {
              ctrl.collectionId = ctrl.getCollectionId();

              ctrl.activityType = 'collection';
              ctrl.activityId = ctrl.collectionId;

              ctrl.registerShareEvent = function(network) {
                SiteAnalyticsService.registerShareCollectionEvent(network);
              };
            } else {
              throw new Error(
                'SharingLinks directive can only be used either in the' +
                'collection player or the exploration player');
            }

            ctrl.getStaticImageUrl = function(imagePath) {
              return UrlInterpolationService.getStaticImageUrl(imagePath);
            };

            ctrl.serverName = (
              $window.location.protocol + '//' + $window.location.host);

            ctrl.escapedTwitterText = (
              HtmlEscaperService.unescapedStrToEscapedStr(
                DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR));

            ctrl.classroomUrl = UrlInterpolationService.getStaticImageUrl(
              '/general/classroom.webp');
          };
        }
      ]
    };
  }]);
