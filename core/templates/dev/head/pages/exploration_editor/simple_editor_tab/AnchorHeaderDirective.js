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
 * @fileoverview Directive used to mark parts of the editor that have a sidebar
 * item associated to it, see ScrollSyncService.js.
 */

oppia.directive('anchorHeader', [function() {
  return {
    restrict: 'E',
    scope: {
      getHeaderId: '&headerId',
      headerText: '@'
    },
    template: '<h3 id="<[getHeaderId()]>"><[headerText]></h3>',
    controller: [
      '$scope', '$element', 'ScrollSyncService',
      function($scope, $element, ScrollSyncService) {
        ScrollSyncService.addTarget($element.children(0));
      }
    ]
  };
}]);
