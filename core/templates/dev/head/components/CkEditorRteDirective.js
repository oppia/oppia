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
 * @fileoverview Modal and functionality for the create story button.
 */

oppia.directive('ckEditorRte', [
  'RteHelperService', 'ExplorationContextService', 'PAGE_CONTEXT',
  function(RteHelperService, ExplorationContextService, PAGE_CONTEXT) {
    return {
      restrict: 'E',
      scope: {
        uiConfig: '&'
      },
      template: '<div><div></div>' +
                '<div contenteditable="true" class="oppia-rte">' +
                '</div></div>',
      require: '?ngModel',

      link: function(scope, el, attr, ngModel) {
        var _RICH_TEXT_COMPONENTS = RteHelperService.getRichTextComponents();
        var names = [];
        var icons = [];
        var canUseFs = ExplorationContextService.getPageContext() ===
          PAGE_CONTEXT.EDITOR;
        _RICH_TEXT_COMPONENTS.forEach(function(componentDefn) {
          if (!((scope.uiConfig() &&
            scope.uiConfig().hide_complex_extensions &&
            componentDefn.isComplex) ||
            (!canUseFs && componentDefn.requiresFs))) {
            names.push(componentDefn.id);
            icons.push(componentDefn.iconDataUrl);
          }
        });

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
        names.forEach(function(name) {
          buttonNames.push('Oppia' + name);
          buttonNames.push('-');
        });
        buttonNames.pop();
        // All icons on the toolbar except the Rich Text components.
        var allIcons = ['undo', 'redo', 'bold', 'Italic', 'numberedList',
          'bulletedList', 'pre', 'indent', 'outdent'];

        // Add external plugins.
        CKEDITOR.plugins.addExternal(
          'widget', '/third_party/static/ckeditor-widget-4.9.2/', 'plugin.js');
        CKEDITOR.plugins.addExternal(
          'lineutils',
          '/third_party/static/ckeditor-lineutils-4.9.2/', 'plugin.js');
        CKEDITOR.plugins.addExternal(
          'sharedspace',
          '/third_party/static/ckeditor-sharedspace-4.9.2/', 'plugin.js');
        // Pre plugin is not available for 4.9.2 version of CKEditor. This is
        // a self created plugin (other plugins are provided by CKEditor).
        CKEDITOR.plugins.addExternal(
          'pre', '/extensions/ckeditor_plugins/pre/', 'plugin.js');
        CKEDITOR.plugins.addExternal(
          'indentblock',
          '/third_party/static/ckeditor-indentblock-4.9.2/', 'plugin.js');
        CKEDITOR.plugins.addExternal(
          'blockquote',
          '/third_party/static/ckeditor-blockquote-4.9.2/', 'plugin.js');

        // Initialize CKEditor.
        var ck = CKEDITOR.inline(el[0].children[0].children[1], {
          extraPlugins:
          'indentblock,pre,blockquote,widget,lineutils,sharedspace,' +
          pluginNames,
          startupFocus: true,
          floatSpaceDockedOffsetY: 15,
          extraAllowedContent: extraAllowedContentRules,
          sharedSpaces: {
            top: el[0].children[0].children[0]
          },
          skin: 'bootstrapck,/third_party/static/ckeditor-bootstrapck-1.0/',
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
        });

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
                     '<div class="oppia-rte-component-overlay"></div></div>';
            }
          });
        };

        ck.on('instanceReady', function() {
          // Set the css and icons for each toolbar button.
          names.forEach(function(name, index) {
            var icon = icons[index];
            var upperCasedName = name.charAt(0).toUpperCase() + name.slice(1);
            $('.cke_button__oppia' + name)
              .css('background-image', 'url("/extensions' + icon + '")')
              .css('background-position', 'center')
              .css('background-repeat', 'no-repeat')
              .css('height', '26px')
              .css('width', '26px')
              .css('padding', '0px 0px');
          });

          $('.cke_toolbar_separator')
            .css('height', '22px');

          $('.cke_button_icon')
            .css('opacity', '1.0')
            .css('height', '26px')
            .css('width', '26px');
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
          ngModel.$setViewValue(ck.getData());
        });

        ngModel.$render = function() {
          ck.setData(ngModel.$viewValue);
        };

        scope.$on('$destroy', function() {
          // Clean up CKEditor instance when directive is removed.
          ck.destroy();
        });
      }
    };
  }
]);
