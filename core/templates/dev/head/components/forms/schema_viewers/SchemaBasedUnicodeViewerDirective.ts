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
 * @fileoverview Directive for a schema-based viewer for unicode strings.
 */

oppia.directive('schemaBasedUnicodeViewer', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      scope: {
        localValue: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/forms/schema_viewers/' +
        'schema_based_unicode_viewer_directive.html'),
      restrict: 'E',
      controller: [
        '$scope', '$filter', '$sce',
        function($scope, $filter, $sce) {
          $scope.getDisplayedValue = function() {
            return $sce.trustAsHtml($filter('convertUnicodeWithParamsToHtml')(
              $scope.localValue));
          };
        }]
    };
  }]);
