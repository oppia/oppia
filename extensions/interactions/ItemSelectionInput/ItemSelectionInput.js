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
 * Directive for the ItemSelectionInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
 oppia.directive('oppiaInteractiveItemSelectionInput', [
   'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
     return {
       restrict: 'E',
       scope: {},
       templateUrl: 'interaction/ItemSelectionInput',
       controller: ['$scope', '$attrs', function($scope, $attrs) {
       $scope.items = oppiaHtmlEscaper.escapedJsonToObj($attrs.itemsWithValue);
       $scope.answer = [];

       $scope.toggleSelection = function toggleSelection(item) {
           var index = $scope.answer.indexOf(item);
           if(index > -1) {
               $scope.answer.splice(index, 1)
           } else {
               $scope.answer.push(item);
           }
         };

       $scope.submitAnswer = function(answer) {
         var answer = $scope.answer;
         $scope.$parent.$parent.submitAnswer(answer, 'submit');
        };
       }]
     };
   }
 ]);

 oppia.directive('oppiaResponseItemSelectionInput', [
   'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
     return {
       restrict: 'E',
       scope: {},
       templateUrl: 'response/ItemSelectionInput',
       controller: ['$scope', '$attrs', function($scope, $attrs) {
         $scope.answer = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);
         $scope.response = $scope.items[$scope.answer];
       }]
     };
   }
 ]);
