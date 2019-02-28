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
 * @fileoverview Code to dynamically generate CKEditor widgets for the rich
 * text components.
 */

oppia.run([
  '$timeout', '$compile', '$rootScope', '$uibModal', 'RteHelperService',
  'HtmlEscaperService',
  function($timeout, $compile, $rootScope, $uibModal, RteHelperService,
      HtmlEscaperService) {
    var _RICH_TEXT_COMPONENTS = RteHelperService.getRichTextComponents();
    _RICH_TEXT_COMPONENTS.forEach(function(componentDefn) {
      // The name of the CKEditor widget corresponding to this component.
      var ckName = 'oppia' + componentDefn.id;

      // Check to ensure that a plugin is not registered more than once.
      if (CKEDITOR.plugins.registered[ckName] !== undefined) {
        return;
      }
      var tagName = 'oppia-noninteractive-' + componentDefn.id;
      var customizationArgSpecs = componentDefn.customizationArgSpecs;
      var isInline = RteHelperService.isInlineComponent(componentDefn.id);

      // Inline components will be wrapped in a span, while block components
      // will be wrapped in a div.
      if (isInline) {
        var componentTemplate = '<span type="' + tagName + '">' +
                                '<' + tagName + '></' + tagName + '>' +
                                '</span>';
      } else {
        var componentTemplate = '<div class="oppia-rte-component-container" ' +
                                'type="' + tagName + '">' +
                                '<' + tagName + '></' + tagName + '>' +
                                '<div class="component-overlay"></div>' +
                                '</div>';
      }
      CKEDITOR.plugins.add(ckName, {
        init: function(editor) {
          // Create the widget itself.
          editor.widgets.add(ckName, {
            button: componentDefn.tooltip,
            inline: isInline,
            template: componentTemplate,
            draggable: false,
            edit: function(event) {
              editor.fire('lockSnapshot', {
                dontUpdate: true
              });
              // Prevent default action since we are using our own edit modal.
              event.cancel();
              // Save this for creating the widget later.
              var container = this.wrapper.getParent(true);
              var that = this;
              var customizationArgs = {};
              customizationArgSpecs.forEach(function(spec) {
                customizationArgs[spec.name] = that.data[spec.name] ||
                                               spec.default_value;
              });

              RteHelperService._openCustomizationModal(
                customizationArgSpecs,
                customizationArgs,
                function(customizationArgsDict) {
                  for (var arg in customizationArgsDict) {
                    if (customizationArgsDict.hasOwnProperty(arg)) {
                      that.setData(arg, customizationArgsDict[arg]);
                    }
                  }
                  /**
                  * This checks whether the widget has already been inited
                  * and set up before (if we are editing a widget that
                  * has already been inserted into the RTE, we do not
                  * need to finalizeCreation again).
                  */
                  if (!that.isReady()) {
                    // Actually create the widget, if we have not already.
                    editor.widgets.finalizeCreation(container);
                  }

                  /**
                   * Need to manually $compile so the directive renders.
                   * Note that.element.$ is the native DOM object
                   * represented by that.element. See:
                   * http://docs.ckeditor.com/#!/api/CKEDITOR.dom.element
                   */
                  $compile($(that.element.$).contents())($rootScope);
                  // $timeout ensures we do not take the undo snapshot until
                  // after angular finishes its changes to the component tags.
                  $timeout(function() {
                    // For inline widgets, place the caret after the
                    // widget so the user can continue typing immediately.
                    if (isInline) {
                      var range = editor.createRange();
                      var widgetContainer = that.element.getParent();
                      range.moveToPosition(
                        widgetContainer, CKEDITOR.POSITION_AFTER_END);
                      editor.getSelection().selectRanges([range]);
                      // Another timeout needed so the undo snapshot is
                      // not taken until the caret is in the right place.
                      $timeout(function() {
                        editor.fire('unlockSnapshot');
                        editor.fire('saveSnapshot');
                      });
                    } else {
                      editor.fire('unlockSnapshot');
                      editor.fire('saveSnapshot');
                    }
                  });
                },
                function() {},
                function() {});
            },
            /**
             * This is how the widget will be represented in the outputs source,
             * so it is called when we call editor.getData().
             */
            downcast: function(element) {
              // Clear the angular rendering content, which we don't
              // want in the output.
              element.children[0].setHtml('');
              // Return just the rich text component, without its wrapper.
              return element.children[0];
            },
            /**
             * This is how a widget is recognized by CKEditor, for example
             * when we first load data in. Returns a boolean,
             * true iff "element" is an instance of this widget.
             */
            upcast: function(element) {
              return (element.name !== 'p' &&
                      element.children.length > 0 &&
                      element.children[0].name === tagName);
            },
            data: function() {
              var that = this;
              // Set attributes of component according to data values.
              customizationArgSpecs.forEach(function(spec) {
                that.element.getChild(0).setAttribute(
                  spec.name + '-with-value',
                  HtmlEscaperService.objToEscapedJson(
                    that.data[spec.name] || ''));
              });
            },
            init: function() {
              editor.fire('lockSnapshot', {
                dontUpdate: true
              });
              var that = this;
              var isMissingAttributes = false;
              // On init, read values from component attributes and save them.
              customizationArgSpecs.forEach(function(spec) {
                var value = that.element.getChild(0).getAttribute(
                  spec.name + '-with-value');
                if (value) {
                  that.setData(
                    spec.name, HtmlEscaperService.escapedJsonToObj(value));
                } else {
                  isMissingAttributes = true;
                }
              });

              if (!isMissingAttributes) {
                // Need to manually $compile so the directive renders.
                $compile($(this.element.$).contents())($rootScope);
              }
              $timeout(function() {
                editor.fire('unlockSnapshot');
                editor.fire('saveSnapshot');
              });
            }
          });
        }
      });
    });
  }
]);
