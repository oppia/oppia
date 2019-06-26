// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the Video rich-text component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require('domain/utilities/UrlInterpolationService.ts');
require('services/AutoplayedVideosService.ts');
require('services/ContextService.ts');
require('services/HtmlEscaperService.ts');

var oppia = require('AppInit.ts').module;

oppia.directive('oppiaNoninteractiveVideo', [
  '$sce', 'HtmlEscaperService', 'UrlInterpolationService',
  function($sce, HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/rich_text_components/Video/directives/video_directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$attrs', 'ContextService', '$element',
        'AutoplayedVideosService', 'PAGE_CONTEXT', '$timeout', '$window',
        function($attrs, ContextService, $element,
            AutoplayedVideosService, PAGE_CONTEXT, $timeout, $window) {
          var ctrl = this;
          var start = (
            HtmlEscaperService.escapedJsonToObj($attrs.startWithValue));
          var end = HtmlEscaperService.escapedJsonToObj($attrs.endWithValue);

          ctrl.videoId = HtmlEscaperService.escapedJsonToObj(
            $attrs.videoIdWithValue);
          ctrl.timingParams = '&start=' + start + '&end=' + end;
          ctrl.autoplaySuffix = '&autoplay=0';

          $timeout(function() {
            // Check whether creator wants to autoplay this video or not
            var autoplayVal = HtmlEscaperService.escapedJsonToObj(
              $attrs.autoplayWithValue);

            // This code helps in visibility of video. It checks whether
            // mid point of video frame is in the view or not.
            var rect = angular.element($element)[0].getBoundingClientRect();
            var clientHeight = $window.innerHeight;
            var clientWidth = $window.innerWidth;
            var isVisible = ((rect.left + rect.right) / 2 < clientWidth &&
              (rect.top + rect.bottom) / 2 < clientHeight) &&
              (rect.left > 0 && rect.right > 0);

            // Autoplay if user is in learner view and creator has specified
            // to autoplay given video.
            if (ContextService.getPageContext() ===
              PAGE_CONTEXT.EXPLORATION_PLAYER && autoplayVal) {
              // If it has been autoplayed then do not autoplay again.
              if (
                !AutoplayedVideosService.hasVideoBeenAutoplayed(
                  ctrl.videoId) && isVisible) {
                ctrl.autoplaySuffix = '&autoplay=1';
                AutoplayedVideosService.addAutoplayedVideo(ctrl.videoId);
              }
            }

            ctrl.videoUrl = $sce.trustAsResourceUrl(
              'https://www.youtube.com/embed/' + ctrl.videoId + '?rel=0' +
              ctrl.timingParams + ctrl.autoplaySuffix);
          }, 900);
          // (^)Here timeout is set to 900ms. This is time it takes to bring the
          // frame to correct point in browser and bring user to the main
          // content. Smaller delay causes checks to be performed even before
          // the player displays the content of the new card.

          // This following check disables the video in Editor being caught
          // by tabbing while in Exploration Editor mode.
          if (ContextService.isInExplorationEditorMode()) {
            ctrl.tabIndexVal = -1;
          }
        }]
    };
  }
]);
