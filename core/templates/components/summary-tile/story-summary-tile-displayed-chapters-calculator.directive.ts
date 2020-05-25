// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component to be used in the story summary tile to calculate
 * number of chapters displayed initially.
 */
 
 /* eslint-disable angular/directive-restrict */
 angular.module('oppia').directive('displayedChaptersCalculator', function() {
   return {
     restrict: 'A',
     scope: {
       chaptersDisplayed: '=',
       getReferenceHeight: '&referenceHeight',
       showButton: '='
     },
     link: function(scope, elem) {
       var initialChapterCount = scope.chaptersDisplayed;
       var disableWatcher = scope.$watch(function() {
         return elem[0].offsetHeight;
       }, function(newVal, oldVal) {
         if (newVal > scope.getReferenceHeight()) {
           scope.chaptersDisplayed--;
         } else if (newVal === scope.getReferenceHeight()) {
           if (initialChapterCount !== scope.chaptersDisplayed) {
             scope.showButton = true;
             disableWatcher();
           }
         }
       });
     }
   };
 });
 /* eslint-enable angular/directive-restrict */
