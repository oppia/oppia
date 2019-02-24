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
 * @fileoverview FocusOn Directive (not associated with reusable
 * components.)
 * NB: Reusable component directives should go in the components/ folder.
 */

// When set as an attr of an <input> element, moves focus to that element
// when a 'focusOn' event is broadcast.
oppia.directive('focusOn', [
  'LABEL_FOR_CLEARING_FOCUS', function(LABEL_FOR_CLEARING_FOCUS) {
    return function(scope, elt, attrs) {
      scope.$on('focusOn', function(e, name) {
        if (name === attrs.focusOn) {
          elt[0].focus();
        }

        // If the purpose of the focus switch was to clear focus, blur the
        // element.
        if (name === LABEL_FOR_CLEARING_FOCUS) {
          elt[0].blur();
        }
      });
    };
  }
]);
