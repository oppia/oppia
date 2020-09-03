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
 * @fileoverview MathjaxBind Directive (not associated with reusable
 * components.)
 * NB: Reusable component directives should go in the components/ folder.
 */

require('mathjaxConfig.ts');

angular.module('oppia').directive('mathjaxBind', [function() {
  return {
    restrict: 'E',
    controller: [
      '$attrs', '$element', '$scope', function($attrs, $element, $scope) {
        var ctrl = this;
        ctrl.$onInit = function() {
          $scope.$watch($attrs.mathjaxData, function(value) {
            // TODO(#10197): Upgrade to MathJax 3, after proper investigation
            // and testing. MathJax 3 provides a faster and more cleaner way to
            // convert a LaTeX string to an SVG.
            var $script = angular.element(
              '<script type="math/tex">'
            ).html(value === undefined ? '' : value);
            $element.html('');
            $element.append($script);
            MathJax.Hub.Queue(['Reprocess', MathJax.Hub, $element[0]]);
          });
        };
      }
    ]
  };
}]);
