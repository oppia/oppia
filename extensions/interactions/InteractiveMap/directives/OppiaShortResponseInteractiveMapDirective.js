// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * Directive for the InteractiveMap short response.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

oppia.directive('oppiaShortResponseInteractiveMap', [
  'HtmlEscaperService', 'UrlInterpolationService',
  function(HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/InteractiveMap/directives/' +
        'interactive_map_short_response_directive.html'),
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        var _answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);
        $scope.formattedCoords = Math.abs(_answer[0]).toFixed(3) + '° ';
        $scope.formattedCoords += (_answer[0] >= 0 ? 'N' : 'S');
        $scope.formattedCoords += ', ';
        $scope.formattedCoords += Math.abs(_answer[1]).toFixed(3) + '° ';
        $scope.formattedCoords += (_answer[1] >= 0 ? 'E' : 'W');
      }]
    };
  }
]);
