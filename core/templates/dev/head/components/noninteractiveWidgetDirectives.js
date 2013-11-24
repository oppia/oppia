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
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

oppia.directive('oppiaNoninteractiveImage', function($rootScope, $sce, oppiaHtmlEscaper) {
  return {
    restrict: 'E',
    scope: {
      filepathWithValue: '@'
    },
    templateUrl: '/widgettemplate/noninteractive/Image',
    controller: function($scope, $attrs) {
      $scope.filepath = oppiaHtmlEscaper.escapedJsonToObj($attrs.filepathWithValue);
      $scope.imageUrl = $sce.trustAsResourceUrl(
          '/imagehandler/' + $rootScope.explorationId + '/' +
          encodeURIComponent($scope.filepath)
      );
    }
  };
});

oppia.directive('oppiaNoninteractiveVideo', function($sce, oppiaHtmlEscaper) {
  return {
    restrict: 'E',
    scope: {
      videoIdWithValue: '@'
    },
    templateUrl: '/widgettemplate/noninteractive/Video',
    controller: function($scope, $attrs) {
      $scope.videoId = oppiaHtmlEscaper.escapedJsonToObj($attrs.videoIdWithValue);
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
      lowHintWithValue: '@',
      mediumHintWithValue: '@',
      highHintWithValue: '@',
      hintPlaceholderWithValue: '@'
    },
    templateUrl: '/widgettemplate/noninteractive/Hints',
    controller: function($scope, $attrs) {
      $scope.lowHint = oppiaHtmlEscaper.escapedJsonToObj($attrs.lowHintWithValue);
      $scope.mediumHint = oppiaHtmlEscaper.escapedJsonToObj($attrs.mediumHintWithValue);
      $scope.highHint = oppiaHtmlEscaper.escapedJsonToObj($attrs.highHintWithValue);
      $scope.hintPlaceholder = oppiaHtmlEscaper.escapedJsonToObj(
          $attrs.hintPlaceholderWithValue);
    }
  };
});

oppia.directive('oppiaNoninteractiveLink', function(oppiaHtmlEscaper) {
  return {
    restrict: 'E',
    scope: {
      urlWithValue: '@'
    },
    templateUrl: '/widgettemplate/noninteractive/Link',
    controller: function($scope, $attrs) {
      var untrustedUrl = oppiaHtmlEscaper.escapedJsonToObj($attrs.urlWithValue);
      if (untrustedUrl.indexOf('http://') !== 0 &&
          untrustedUrl.indexOf('https://') !== 0) {
        return;
      }
      $scope.url = untrustedUrl;
    }
  };
});
