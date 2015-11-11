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
      controller: ['$scope', '$attrs', '$element', '$window', '$timeout',
                  function($scope, $attrs, $element, $window, $timeout) {
        var start = oppiaHtmlEscaper.escapedJsonToObj($attrs.startWithValue),
            end = oppiaHtmlEscaper.escapedJsonToObj($attrs.endWithValue);
        $scope.autoplaySuffix = (oppiaHtmlEscaper.escapedJsonToObj($attrs.autoplayWithValue) ? '&autoplay=1' : '&autoplay=0');
        $scope.videoId = oppiaHtmlEscaper.escapedJsonToObj($attrs.videoIdWithValue);
        $scope.timingParams = '&start=' + start + '&end=' + end;
        $scope.videoUrl = $sce.trustAsResourceUrl(
          'https://www.youtube.com/embed/' + $scope.videoId + '?rel=0' +
          $scope.timingParams + $scope.autoplaySuffix);

        $scope.videoWidth = 560;
        $scope.videoHeight = 315;

        var aspectRatio = $scope.videoHeight / $scope.videoWidth;

        var tutorCard = $(".conversation-skin-main-tutor-card");
        tutorCard.addClass('contains-video');

        var outerPadding = 60;

        var resizeVideo = function() {
          var newWidth = tutorCard.width() - outerPadding;

          $scope.videoWidth = newWidth;
          $scope.videoHeight = newWidth * aspectRatio;
        }

        angular.element($window).bind('resize', resizeVideo);
        $timeout(function() {
          resizeVideo();
        }, 200);

        $element.on('$destroy', function() {
          tutorCard.removeClass('contains-video');
        });

      }]
    };
  }
]);
