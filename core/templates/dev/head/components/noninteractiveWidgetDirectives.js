// Copyright 2012 Google Inc. All Rights Reserved.
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
 * @fileoverview Directives supporting non-interactive widgets.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.directive('oppiaNoninteractiveImage', function($compile) {
  return {
    restrict: 'E',
    scope: {},
    template: '<span>IMAGE</span>'
  };
});

oppia.directive('oppiaNoninteractiveVideo', function($sce, oppiaHtmlEscaper) {
  return {
    restrict: 'E',
    scope: {
      video_id: '@'
    },
    templateUrl: '/widgettemplate/noninteractive/Video',
    controller: function($scope, $attrs) {
      $scope.videoId = oppiaHtmlEscaper.escapedJsonToObj($attrs.videoId).value;
      $scope.videoUrl = $sce.trustAsResourceUrl(
          'https://www.youtube.com/embed/' + $scope.videoId + '?rel=0'
      );
    }
  };
});

oppia.directive('oppiaNoninteractiveHints', function(oppiaHtmlEscaper) {
  return {
    restrict: 'E',
    scope: {
      low_hint: '@',
      medium_hint: '@',
      high_hint: '@',
      hint_placholder: '@'
    },
    templateUrl: '/widgettemplate/noninteractive/Hints',
    controller: function($scope, $attrs) {
      $scope.lowHint = oppiaHtmlEscaper.escapedJsonToObj($attrs.lowHint).value;
      $scope.mediumHint = oppiaHtmlEscaper.escapedJsonToObj($attrs.mediumHint).value;
      $scope.highHint = oppiaHtmlEscaper.escapedJsonToObj($attrs.highHint).value;
      $scope.hintPlaceholder = oppiaHtmlEscaper.escapedJsonToObj(
          $attrs.hintPlaceholder).value;
    }
  };
});
