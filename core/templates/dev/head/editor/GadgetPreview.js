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
 * @fileoverview Directives for gadget preview.
 *
 * @author vjoisar@google.com (Vishal Joisar)
 */

 oppia.directive('oppiaGadgetPreview', function() {
  return {
    restrict: 'E',
    scope: {
      gadgetType: '&',
      gadgetName: '&',
      gadgetCustomizationArgs: '&',
      visibleInStates: '&'
    },
    templateUrl: 'editor/gadgetPreview',
    controller: [
        '$scope', '$filter', 'extensionTagAssemblerService',
        function($scope, $filter, extensionTagAssemblerService) {
      var _generateHtml = function() {
        var gadgetNameElem = $('<div>').text($scope.gadgetName());
        gadgetNameElem.addClass('oppia-gadget-name');

        var el = $(
          '<oppia-gadget-' + $filter('camelCaseToHyphens')($scope.gadgetType()) + '>');
        el = extensionTagAssemblerService.formatCustomizationArgAttributesForElement(
          el, $scope.gadgetCustomizationArgs());
        var gadgetContent = $('<div>').addClass('oppia-gadget-content');
        gadgetContent.append(el)

        return ($('<div>').append(gadgetNameElem).append(gadgetContent)).html();
      };

      $scope.gadgetHtml = _generateHtml();

      $scope.$watchCollection('gadgetCustomizationArgs()', function(newVal, oldVal) {
        if(newVal !== oldVal) {
          $scope.gadgetHtml = _generateHtml();
        }
      }, true);
    }]
  };
});
