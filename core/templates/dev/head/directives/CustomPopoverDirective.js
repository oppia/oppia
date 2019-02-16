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
 * @fileoverview CustomPopover Directive (not associated with reusable
 * components.)
 * NB: Reusable component directives should go in the components/ folder.
 */

// A popover that is shown when its label is hovered or clicked upon, and
// disappears when focus moves away from its label.
oppia.directive('customPopover', [
  'UrlInterpolationService', '$sce', function(UrlInterpolationService, $sce) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/custom_popover_directive.html'),
      link: function(scope, elt, attrs) {
        scope.label = attrs.popoverLabel;
        $(elt).popover({
          trigger: 'hover',
          html: true,
          content: $sce.getTrustedHtml(
            '<pre class="oppia-pre-wrapped-text">' + attrs.popoverText +
            '</pre>'),
          placement: attrs.popoverPlacement
        });
      },
      controller: ['$scope', '$element', function($scope, $element) {
        $scope.isShown = false;

        $element.on('shown.bs.popover', function() {
          $scope.isShown = true;
        });
        $element.on('hidden.bs.popover', function() {
          $scope.isShown = false;
        });

        $scope.showPopover = function() {
          if (!$scope.isShown) {
            $element.popover('show');
          }
        };
      }]
    };
  }
]);
