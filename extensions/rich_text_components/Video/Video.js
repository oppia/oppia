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
 * Directive for the Video rich-text component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
oppia.directive('oppiaNoninteractiveVideo', [
  '$sce', 'oppiaHtmlEscaper', function($sce, oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'richTextComponent/Video',
      controller: ['$scope', '$attrs', 'explorationContextService', '$element',
        'PAGE_CONTEXT',
        function($scope, $attrs, explorationContextService, $element) {
          var start = oppiaHtmlEscaper.escapedJsonToObj($attrs.startWithValue);
          var end = oppiaHtmlEscaper.escapedJsonToObj($attrs.endWithValue);

          $scope.videoId = oppiaHtmlEscaper.escapedJsonToObj(
            $attrs.videoIdWithValue);
          $scope.timingParams = '&start=' + start + '&end=' + end;

          // This code helps in checking whether video is for upcoming content.
          // This is totally dependent of parent div of video container
          // If in future that parent div changes then this code will be
          // required to change accordingly.
          var isVisible = true;
          var videoVisibilty = angular.element($element).prop('offsetParent');
          if(videoVisibilty) {
            var isVisible = (videoVisibilty.getAttribute('angular-html-bind')
                              !== 'upcomingContentHtml' ? true : false);
          }

          // If user in learner context then only autoplay videos.
          if (explorationContextService.getPageContext() === PAGE_CONTEXT.LEARNER) {
            // If video has been already played or if it is not visible for now
            // then dont autoplay it.
            if (explorationContextService.getFromPlayedList($scope.videoId) || !(isVisible)) {
                $scope.autoplaySuffix = '&autoplay=0';
            }
            else {
              $scope.autoplaySuffix = '&autoplay=1';
            }
          }
          else {
            // If not in learner context then use default value,
            $scope.autoplaySuffix = (oppiaHtmlEscaper.escapedJsonToObj(
            $attrs.autoplayWithValue) ? '&autoplay=1' : '&autoplay=0');
          }

          $scope.videoUrl = $sce.trustAsResourceUrl(
            'https://www.youtube.com/embed/' + $scope.videoId + '?rel=0' +
            $scope.timingParams + $scope.autoplaySuffix);

          // This following check disbales the video in Editor being caught
          // by tabbing while in Exploration Editor mode.
          if (explorationContextService.isInExplorationEditorMode()) {
            $scope.tabIndexVal = -1;
          }
        }]
    };
  }
]);
