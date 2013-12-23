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

oppia.directive('oppiaNoninteractiveImage', [
  '$rootScope', '$sce', 'oppiaHtmlEscaper', function($rootScope, $sce, oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: '/widgettemplate/noninteractive/Image',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.filepath = oppiaHtmlEscaper.escapedJsonToObj($attrs.filepathWithValue);
        $scope.imageUrl = $sce.trustAsResourceUrl(
            '/imagehandler/' + $rootScope.explorationId + '/' +
            encodeURIComponent($scope.filepath)
        );
      }]
    };
  }
]);

oppia.directive('oppiaNoninteractiveMath', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: '/widgettemplate/noninteractive/Math',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.rawLatex = oppiaHtmlEscaper.escapedJsonToObj($attrs.rawLatexWithValue);
      }]
    };
  }
]);

oppia.directive('oppiaNoninteractiveVideo', [
  '$sce', 'oppiaHtmlEscaper', function($sce, oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: '/widgettemplate/noninteractive/Video',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.videoId = oppiaHtmlEscaper.escapedJsonToObj($attrs.videoIdWithValue);
        $scope.videoUrl = $sce.trustAsResourceUrl(
            'https://www.youtube.com/embed/' + $scope.videoId + '?rel=0'
        );
      }]
    };
  }
]);

oppia.directive('oppiaNoninteractiveTabs', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: '/widgettemplate/noninteractive/Tabs',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.tabContents = oppiaHtmlEscaper.escapedJsonToObj($attrs.tabContentsWithValue);
      }]
    };
  }
]);

oppia.directive('oppiaNoninteractiveLink', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: '/widgettemplate/noninteractive/Link',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        var untrustedUrl = oppiaHtmlEscaper.escapedJsonToObj($attrs.urlWithValue);
        if (untrustedUrl.indexOf('http://') !== 0 &&
            untrustedUrl.indexOf('https://') !== 0) {
          return;
        }
        $scope.url = untrustedUrl;
      }]
    };
  }
]);
