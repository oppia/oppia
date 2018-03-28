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
 * @fileoverview Directive for a schema-based editor for HTML.
 */

oppia.directive('schemaBasedHtmlEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      scope: {
        localValue: '=',
        isDisabled: '&',
        labelForFocusTarget: '&',
        uiConfig: '&',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/forms/schema_editors/' +
        'schema_based_html_editor_directive.html'),
      restrict: 'E',
      link: function(scope, element, attrs) {
        // A mutation observer to detect changes in the RTE Editor
        var observer = new MutationObserver(function(mutations) {
          // A condition to detect if mutation involves addition of node by
          // drag and drop method.
          if (mutations[mutations.length - 1].addedNodes[0]) {
            // This condition checks if added node is image type.
            if (mutations[mutations.length - 1]
              .addedNodes[0].nodeName === 'IMG'){
              // Gets the added image node
              var addedImgNode = mutations[mutations.length - 1]
                                      .addedNodes[0];
              addedImgNode.classList.add('oppia-noninteractive-image');
              addedImgNode.classList.add('block-element');
              addedImgNode.click();
            }
          }
        });

        observer.observe(element[0], {
          childList: true,
          subtree: true
        });
      }
    };
  }]);
