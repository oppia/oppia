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
 * @fileoverview Directives that are not associated with reusable components.
 * NB: Reusable component directives should go in the components/ folder.
 */

// Highlights the text of an input field when it is clicked.
oppia.directive('selectOnClick', [function() {
  return {
    restrict: 'E',
    link: function(scope, elm) {
      elm.bind('click', function() {
        this.select();
      });
    }
  };
}]);
