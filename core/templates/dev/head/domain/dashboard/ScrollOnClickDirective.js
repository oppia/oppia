// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for scrolling to an exploration tile in the
 * dashboard when the tile is clicked.
 */

oppia.directive('scrollOnClick', function() {
  return {
    restrict: 'A',
    scope: {
      isDropdownOpen: '=isDropdownOpen',
      isPrivate: '=isPrivate'
    },
    link: function(scope, element) {
      var isDisabled;
      // This value is roughly equal to the height of the topbar, so that the
      // content is not hidden behind it when the scrolltop is set.
      var SCROLLTOP_ADDED_OFFSET = 60;
      scope.$watch('isDropdownOpen', function() {
        isDisabled = scope.isDropdownOpen || scope.isPrivate;
      });
      element.on('click', function() {
        if (!isDisabled) {
          $('html, body').animate({
            scrollTop: element.offset().top - SCROLLTOP_ADDED_OFFSET
          }, 'slow');
        }
      });

      scope.$on('$destroy', function() {
        // De-register all event handlers.
        element.off();
      });
    }
  };
});
