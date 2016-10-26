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
 * @fileoverview Directive for title section of an exploration.
 */

// This directive selectively sets the title of the exploration. If the
// exploration is private it wraps the title inside a `a` tag to make the title
// section a link. If the exploration is not private it simply sets the title
// section of the exploration.

oppia.directive('explorationTitleSection', ['$compile', function($compile) {
  return {
    restrict: 'E',
    scope: {
      getExploration: '&exploration',
      activeExplorationId: '=activeExplorationId'
    },
    link: function(scope, element) {
      scope.exploration = scope.getExploration();
      var titleSection = (
        (scope.exploration.status === 'private') ?
         ('<a ng-href="/create/<[exploration.id]>">' +
          element.html() + '</a>') : element.html());

      element.replaceWith($compile(titleSection)(scope));
    }
  };
}]);
