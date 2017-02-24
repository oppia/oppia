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
 * @fileoverview Service for managing the sidebar items
 * highlighting.
 */

oppia.factory('SidebarHighlightingService', [
  'QuestionIdService',
  function(QuestionIdService) {
    var ERROR_CLASS = 'error';
    // Any file using this service has access to both
    // errorHighlight and undoErrorHighlight functions.
    return {
      // Highlights the sidebar item with error status
      errorHighlight: function(id) {
          if (!angular.isDefined(id)) {
            return;
          } else {
            var elm = angular.element(document.getElementById(id));
            // Append the id to the icon so that we can uniquely identify
            // the icon tag.
            var ICON_ELM = '<i id="icon_elm_' + id +
            '" class="material-icons error-outline-icon"' +
            '>&#xE001;</i>';
            elm.append(ICON_ELM);
            elm.addClass(ERROR_CLASS);
          }
        },
      // Returns the sidebar item to safe state(original state)
      undoErrorHighlight: function(id) {
          if (!angular.isDefined(id)) {
            return;
          } else {
            var elm = angular.element(document.getElementById(id));
            var ICON_ID = 'icon_elm_' + id;
            // Get the icon unique id.
            var iconElm = angular.element(document.getElementById(ICON_ID));
            elm.removeClass(ERROR_CLASS);
            iconElm.remove();
          }
        }
    };
  }
]);
