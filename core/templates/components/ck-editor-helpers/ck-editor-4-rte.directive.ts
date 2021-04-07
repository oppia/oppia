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
 * @fileoverview Directive for CK Editor.
 */

require('third-party-imports/ckeditor.import.ts');

require('components/ck-editor-helpers/ck-editor-copy-content-service.ts');
require('services/context.service.ts');
require('services/rte-helper.service.ts');

interface UiConfig {
  (): UiConfig;
  'hide_complex_extensions': boolean;
  'startupFocusEnabled'?: boolean;
  'language'?: string;
  'languageDirection'?: string;
}

interface CkeditorCustomScope extends ng.IScope {
  uiConfig: UiConfig;
}

angular.module('oppia').directive('ckEditor4Rte', [
  'CkEditorCopyContentService', 'ContextService', 'RteHelperService',
  'VALID_RTE_COMPONENTS_FOR_ANDROID',
  function(
      CkEditorCopyContentService, ContextService, RteHelperService,
      VALID_RTE_COMPONENTS_FOR_ANDROID) {
    /**
     * Creates a CKEditor configuration.
     * @param config CKEditor config to add to
     * @param uiConfig Parameters to add to CKEditor config
     * @param pluginNames Comma separated list of plugin names
     * @param buttonNames Array of button names for RTE components
     * @param extraAllowedContentRules Additional allowed content rules for
     * CKEDITOR.editor.filter
     * @param sharedSpaces IDs of the page elements that will store the editor
     * UI elements
     */
    const _createCKEditorConfig = function(
        uiConfig: UiConfig,
        pluginNames: string,
        buttonNames: string[],
        extraAllowedContentRules: string,
        sharedSpaces: CKEDITOR.sharedSpace
    ): CKEDITOR.config {
      // Language configs use default language when undefined.
      const ckConfig: CKEDITOR.config = {
        extraPlugins: 'pre,sharedspace,' + pluginNames,
        startupFocus: true,
        removePlugins: 'indentblock',
        title: false,
        floatSpaceDockedOffsetY: 15,
        extraAllowedContent: extraAllowedContentRules,
        sharedSpaces: sharedSpaces,
        skin: (
          'bootstrapck,' +
          '/third_party/static/ckeditor-bootstrapck-1.0.0/skins/bootstrapck/'
        ),
        toolbar: [
          {
            name: 'basicstyles',
            items: ['Bold', '-', 'Italic']
          },
          {
            name: 'paragraph',
            items: [
              'NumberedList', '-',
              'BulletedList', '-',
              'Pre', '-',
              'Blockquote', '-',
              'Indent', '-',
              'Outdent'
            ]
          },
          {
            name: 'rtecomponents',
            items: buttonNames
          },
          {
            name: 'document',
            items: ['Source']
          }
        ]
      };

      if (!uiConfig) {
        return ckConfig;
      }

      if (uiConfig.language) {
        ckConfig.language = uiConfig.language;
        ckConfig.contentsLanguage = uiConfig.language;
      }
      if (uiConfig.languageDirection) {
        ckConfig.contentsLangDirection = (
          uiConfig.languageDirection);
      }
      if (uiConfig.startupFocusEnabled !== undefined) {
        ckConfig.startupFocus = uiConfig.startupFocusEnabled;
      }

      return ckConfig;
    };

    return {
      restrict: 'E',
      scope: {
        uiConfig: '&'
      },
      template: '<div><div></div>' +
                '<div contenteditable="true" ' +
                'class="oppia-rte-resizer oppia-rte">' +
                '</div></div>',
      require: '?ngModel',

      link: function(scope: CkeditorCustomScope, el, attr, ngModel) {
        var _RICH_TEXT_COMPONENTS = RteHelperService.getRichTextComponents();
        var names = [];
        var icons = [];

        _RICH_TEXT_COMPONENTS.forEach(function(componentDefn) {
          var hideComplexExtensionFlag = (
            scope.uiConfig() &&
            scope.uiConfig().hide_complex_extensions &&
            componentDefn.isComplex);
          var notSupportedOnAndroidFlag = (
            ContextService.isExplorationLinkedToStory() &&
            VALID_RTE_COMPONENTS_FOR_ANDROID.indexOf(componentDefn.id) === -1);
          if (!(hideComplexExtensionFlag || notSupportedOnAndroidFlag)) {
            names.push(componentDefn.id);
            icons.push(componentDefn.iconDataUrl);
          }
        });

        var editable = document.querySelectorAll('.oppia-rte-resizer');
        var resize = function() {
          $('.oppia-rte-resizer').css({
            width: '100%'
          });
        };
        for (var i in editable) {
          (<HTMLElement>editable[i]).onchange = function() {
            resize();
          };
          (<HTMLElement>editable[i]).onclick = function() {
            resize();
          };
        }

        /**
         * Create rules to whitelist all the rich text components and
         * their wrappers and overlays.
         * See format of filtering rules here:
         * http://docs.ckeditor.com/#!/guide/dev_allowed_content_rules
         */
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
        var extraAllowedContentRules = componentRule +
                                       inlineWrapperRule +
                                       blockWrapperRule +
                                       blockOverlayRule;
        var pluginNames = names.map(function(name) {
          return 'oppia' + name;
        }).join(',');
        var buttonNames = [];
        if (ContextService.canAddOrEditComponents()) {
          names.forEach(function(name) {
            buttonNames.push('Oppia' + name);
            buttonNames.push('-');
          });
        }
        buttonNames.pop();

        // Add external plugins.
        CKEDITOR.plugins.addExternal(
          'sharedspace',
          '/third_party/static/ckeditor-4.12.1/plugins/sharedspace/',
          'plugin.js');
        // Pre plugin is not available for 4.12.1 version of CKEditor. This is
        // a self created plugin (other plugins are provided by CKEditor).
        CKEDITOR.plugins.addExternal(
          'pre', '/extensions/ckeditor_plugins/pre/', 'plugin.js');

        const sharedSpaces = {
          top: <HTMLElement>el[0].children[0].children[0]
        };

        const ckConfig = _createCKEditorConfig(
          scope.uiConfig(), pluginNames, buttonNames, extraAllowedContentRules,
          sharedSpaces);

        // Initialize CKEditor.
        var ck = CKEDITOR.inline(
          <HTMLElement>(el[0].children[0].children[1]), ckConfig);

        // A RegExp for matching rich text components.
        var componentRe = (
          /(<(oppia-noninteractive-(.+?))\b[^>]*>)[\s\S]*?<\/\2>/g
        );

        /**
         * Before data is loaded into CKEditor, we need to wrap every rte
         * component in a span (inline) or div (block).
         * For block elements, we add an overlay div as well.
         */
        var wrapComponents = function(html) {
          if (html === undefined) {
            return html;
          }
          return html.replace(componentRe, function(match, p1, p2, p3) {
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

        ck.on('instanceReady', function() {
          // Set the css and icons for each toolbar button.
          names.forEach(function(name, index) {
            var icon = icons[index];
            $('.cke_button__oppia' + name)
              .css('background-image', 'url("/extensions' + icon + '")')
              .css('background-position', 'center')
              .css('background-repeat', 'no-repeat')
              .css('height', '24px')
              .css('width', '24px')
              .css('padding', '0px 0px');
          });

          $('.cke_toolbar_separator')
            .css('height', '22px');

          $('.cke_button_icon')
            .css('height', '24px')
            .css('width', '24px');
          ck.setData(wrapComponents(ngModel.$viewValue));
        });

        // Angular rendering of components confuses CKEditor's undo system, so
        // we hide all of that stuff away from CKEditor.
        ck.on('getSnapshot', function(event) {
          if (event.data === undefined) {
            return;
          }
          event.data = event.data.replace(componentRe, function(match, p1, p2) {
            return p1 + '</' + p2 + '>';
          });
        }, null, null, 20);

        ck.on('change', function() {
          var elt = $('<div>' + ck.getData() + '</div>');
          var textElt = elt[0].childNodes;
          for (var i = textElt.length; i > 0; i--) {
            for (var j = textElt[i - 1].childNodes.length; j > 0; j--) {
              if (textElt[i - 1].childNodes[j - 1].nodeName === 'BR' ||
                (textElt[i - 1].childNodes[j - 1].nodeName === '#text' &&
                  textElt[i - 1].childNodes[j - 1].nodeValue.trim() === '')) {
                textElt[i - 1].childNodes[j - 1].remove();
              } else {
                break;
              }
            }
            if (textElt[i - 1].childNodes.length === 0) {
              if (textElt[i - 1].nodeName === 'BR' ||
                (textElt[i - 1].nodeName === '#text' &&
                  textElt[i - 1].nodeValue.trim() === '') ||
                  textElt[i - 1].nodeName === 'P') {
                textElt[i - 1].remove();
                continue;
              }
            } else {
              break;
            }
          }
          ngModel.$setViewValue(elt.html());
        });

        ngModel.$render = function() {
          ck.setData(ngModel.$viewValue);
        };

        scope.$on('$destroy', function() {
          // Clean up CKEditor instance when directive is removed.
          ck.destroy();
        });

        CkEditorCopyContentService.bindPasteHandler(ck);
      }
    };
  }
]);
