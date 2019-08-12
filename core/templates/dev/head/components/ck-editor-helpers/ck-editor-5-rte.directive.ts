// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for CK Editor 5.
 */

require('services/ContextService.ts');
require('services/RteHelperService.ts');

const ClassicEditor = require(
  '@ckeditor/ckeditor5-build-classic/build/ckeditor.js');

angular.module('oppia').directive('ckEditor5Rte', [
  'ContextService', 'RteHelperService', 'PAGE_CONTEXT',
  function(ContextService, RteHelperService, PAGE_CONTEXT) {
    return {
      restrict: 'E',
      scope: {
        uiConfig: '&'
      },
      // This is the temmplate to which the CKE5 should be initalized.
      // The first <div> is the container for CKE5, the second <div>
      // is for the editor tools bar, all the needed css for toolbar
      // should be applied in the second div. The contenteditable <div>
      // is the editor text-area.
      template: '<div>' +
                '  <div></div>' +
                '  <div contenteditable="true" class="oppia-rte"></div>' +
                '</div>',
      require: '^ngModel',

      link: function(scope: ICustomScope, elem, attrs, ngModel) {
        var _RICH_TEXT_COMPONENTS = RteHelperService.getRichTextComponents();
        var names = [];
        var icons = [];
        var canUseFs = (
          ContextService.getPageContext() === PAGE_CONTEXT.EXPLORATION_EDITOR ||
          ContextService.getPageContext() === PAGE_CONTEXT.TOPIC_EDITOR ||
          ContextService.getPageContext() === PAGE_CONTEXT.STORY_EDITOR ||
          ContextService.getPageContext() === PAGE_CONTEXT.SKILL_EDITOR);
        _RICH_TEXT_COMPONENTS.forEach(function(componentDefn) {
          var componentRequiresFsButFsCannotBeUsed = (
            !canUseFs && componentDefn.requiresFs);
          if (!((scope.uiConfig() &&
            scope.uiConfig().hide_complex_extensions &&
            componentDefn.isComplex) || componentRequiresFsButFsCannotBeUsed)) {
            names.push(componentDefn.id);
            icons.push(componentDefn.iconDataUrl);
          }
        });

        // Create rules to whitelist all the rich text components and their
        // wrappers and overlays. See format of filtering
        // rules here: http://docs.ckeditor.com/#!/guide/dev_allowed_content_rules
        // Whitelist the component tags with any attributes and classes.
        var componentRule = names.map(function(name) {
          return 'oppia-noninteractive-' + name;
        }).join(' ') + '(*)[*];';
        // Whitelist the inline component wrapper, which is a
        // span with a "type" attribute.
        var inlineWrapperRule = ' span[type];';
        // Whitelist the block component wrapper, which is a div
        // with a "type" attribute and a CSS class.
        var blockWrapperRule = ' div(oppia-rte-component-container)[type];';
        // Whitelist the transparent block component overlay, which is
        // a div with a CSS class.
        var blockOverlayRule = ' div(oppia-rte-component-overlay);';
        // Put all the rules together.
        var extraAllowedContentRules = (
          componentRule +
          inlineWrapperRule + blockWrapperRule + blockOverlayRule);

        var startupFocusEnabled = true;
        if (
          scope.uiConfig() &&
          scope.uiConfig().startupFocusEnabled !== undefined) {
          startupFocusEnabled = scope.uiConfig().startupFocusEnabled;
        }
        // A RegExp for matching rich text components.
        var componentRegExp = (
          /(<(oppia-noninteractive-(.+?))\b[^>]*>)[\s\S]*?<\/\2>/g
        );
        var wrapComponents = function(html) {
          if (html === undefined) {
            return html;
          }
          // This wraps the custom RTE components in regular spans/divs,
          // as they are allowed wrap tags in CKEditor. This avoids data
          // loss while setting data to ckeditor.
          // See https://ckeditor.com/docs/ckeditor5/latest/builds/guides/faq.html
          // for more details (
          // under the section "Why does the editor filter out my ...").
          return html.replace(componentRegExp, function(match, p1, p2, p3) {
            if (RteHelperService.isInlineComponent(p3)) {
              return '<span type="oppia-noninteractive-' + p3 + '">' +
                    match + '</span>';
            } else {
              return '<div type="oppia-noninteractive-' + p3 + '"' +
                     'class="oppia-rte-component-container">' + match +
                     '</div>';
            }
          });
        };
        // CkEditor5 is initalized to the editable element which is passed
        // through the create api. el[0] is the ck-editor-5-rte and
        // el[0].children[0].children[1] is the contenteditable div which
        // is defined in the template above.
        ClassicEditor.create(<HTMLElement>(
          elem[0].children[0].children[1])).then(ck => {
          // This sets the CKEditor-5 data from the model view.
          ck.setData(wrapComponents(ngModel.$viewValue));

          // This tracks the data change in CKEDitor-5 and updates the view if
          // any data change is observed.
          ck.model.document.on('change', function() {
            var elt = $('<div>' + ck.getData() + '</div>');
            // The data from CKEditor5 will be in CK-format it needs to
            // be refined for need html format.
            // read more here: https://github.com/oppia/oppia/issues/5400.
            var textElements = elt[0].childNodes;
            for (var i = textElements.length; i > 0; i--) {
              for (var j = textElements[i - 1].childNodes.length; j > 0; j--) {
                var tagName = textElements[i - 1].childNodes[j - 1];
                if (tagName.nodeName === 'BR' ||
                  (tagName.nodeName === '#text' &&
                    tagName.nodeValue.trim() === '')) {
                  tagName.remove();
                } else {
                  break;
                }
              }
              if (textElements[i - 1].childNodes.length === 0) {
                if (textElements[i - 1].nodeName === 'BR' ||
                  (textElements[i - 1].nodeName === '#text' &&
                    textElements[i - 1].nodeValue.trim() === '') ||
                    textElements[i - 1].nodeName === 'P') {
                  textElements[i - 1].remove();
                  continue;
                }
              } else {
                break;
              }
            }
            ngModel.$setViewValue(elt.html());
          });

          scope.$on('$destroy', function() {
            // Clean up CKEditor instance when directive is removed.
            ck.destroy();
          });
        });
      }
    };
  }
]);
