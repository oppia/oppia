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
 * Directive for the MP4 Video rich-text component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
oppia.directive('oppiaNoninteractiveVideoMp4', [
  '$sce', 'oppiaHtmlEscaper',
  function($sce, oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'richTextComponent/VideoMp4',
      controller: [
        '$scope', '$attrs', 'EVENT_ACTIVE_CARD_CHANGED',
        function($scope, $attrs, EVENT_ACTIVE_CARD_CHANGED) {
          $scope.videoUrl = $sce.trustAsResourceUrl(
            oppiaHtmlEscaper.escapedJsonToObj($attrs.videoUrlWithValue));

          // Clearing the video URL src after a card leaves the user's view
          // helps browsers clear memory and release resources. Without this,
          // a bug was observed where resources would freeze for learning
          // experiences that rely heavily on video.
          //
          // See W3C spec 4.7.10.18
          // Ref: https://www.w3.org/TR/html5/embedded-content-0.html
          $scope.$on(EVENT_ACTIVE_CARD_CHANGED, function() {
            $scope.videoUrl = '';
          });
        }]
    };
  }
]);
