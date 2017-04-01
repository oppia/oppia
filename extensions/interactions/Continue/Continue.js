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
 * Directive for the Continue button interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
oppia.directive('oppiaInteractiveContinue', [
  'oppiaHtmlEscaper', 'continueRulesService',
  function(oppiaHtmlEscaper, continueRulesService) {
    return {
      restrict: 'E',
      scope: {
        onSubmit: '&'
      },
      templateUrl: 'interaction/Continue',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.buttonText = oppiaHtmlEscaper.escapedJsonToObj(
          $attrs.buttonTextWithValue);

        $scope.submitAnswer = function() {
          $scope.onSubmit({
            answer: '(' + $scope.buttonText + ')',
            rulesService: continueRulesService
          });
        };
      }]
    };
  }
]);

oppia.directive('oppiaResponseContinue', [function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'response/Continue',
    controller: [
      '$scope', '$attrs', 'oppiaHtmlEscaper',
      function($scope, $attrs, oppiaHtmlEscaper) {
        $scope.answer = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);
      }]
  };
}]);

oppia.directive('oppiaShortResponseContinue', [function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'shortResponse/Continue',
    controller: [
      '$scope', '$attrs', 'oppiaHtmlEscaper',
      function($scope, $attrs, oppiaHtmlEscaper) {
        $scope.answer = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);
      }]
  };
}]);

oppia.factory('continueRulesService', [function() {
  return {};
}]);
