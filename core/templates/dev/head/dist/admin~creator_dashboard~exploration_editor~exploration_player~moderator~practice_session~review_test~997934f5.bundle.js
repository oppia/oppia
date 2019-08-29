(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["admin~creator_dashboard~exploration_editor~exploration_player~moderator~practice_session~review_test~997934f5"],{

/***/ "./core/templates/dev/head/components/ck-editor-helpers/ck-editor-4-rte.directive.ts":
/*!*******************************************************************************************!*\
  !*** ./core/templates/dev/head/components/ck-editor-helpers/ck-editor-4-rte.directive.ts ***!
  \*******************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
__webpack_require__(/*! services/ContextService.ts */ "./core/templates/dev/head/services/ContextService.ts");
__webpack_require__(/*! services/RteHelperService.ts */ "./core/templates/dev/head/services/RteHelperService.ts");
angular.module('oppia').directive('ckEditor4Rte', [
    'ContextService', 'RteHelperService', 'PAGE_CONTEXT',
    function (ContextService, RteHelperService, PAGE_CONTEXT) {
        return {
            restrict: 'E',
            scope: {
                uiConfig: '&'
            },
            template: '<div><div></div>' +
                '<div contenteditable="true" class="oppia-rte">' +
                '</div></div>',
            require: '?ngModel',
            link: function (scope, el, attr, ngModel) {
                var _RICH_TEXT_COMPONENTS = RteHelperService.getRichTextComponents();
                var names = [];
                var icons = [];
                var canUseFs = (ContextService.getPageContext() === PAGE_CONTEXT.EXPLORATION_EDITOR ||
                    ContextService.getPageContext() === PAGE_CONTEXT.TOPIC_EDITOR ||
                    ContextService.getPageContext() === PAGE_CONTEXT.STORY_EDITOR ||
                    ContextService.getPageContext() === PAGE_CONTEXT.SKILL_EDITOR);
                _RICH_TEXT_COMPONENTS.forEach(function (componentDefn) {
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
                var componentRule = names.map(function (name) {
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
                var pluginNames = names.map(function (name) {
                    return 'oppia' + name;
                }).join(',');
                var buttonNames = [];
                names.forEach(function (name) {
                    buttonNames.push('Oppia' + name);
                    buttonNames.push('-');
                });
                buttonNames.pop();
                // All icons on the toolbar except the Rich Text components.
                var allIcons = ['undo', 'redo', 'bold', 'Italic', 'numberedList',
                    'bulletedList', 'pre', 'indent', 'outdent'];
                // Add external plugins.
                CKEDITOR.plugins.addExternal('sharedspace', '/third_party/static/ckeditor-sharedspace-4.9.2/', 'plugin.js');
                // Pre plugin is not available for 4.9.2 version of CKEditor. This is
                // a self created plugin (other plugins are provided by CKEditor).
                CKEDITOR.plugins.addExternal('pre', '/extensions/ckeditor_plugins/pre/', 'plugin.js');
                var startupFocusEnabled = true;
                if (scope.uiConfig() &&
                    scope.uiConfig().startupFocusEnabled !== undefined) {
                    startupFocusEnabled = scope.uiConfig().startupFocusEnabled;
                }
                // Initialize CKEditor.
                var ck = CKEDITOR.inline((el[0].children[0].children[1]), {
                    extraPlugins: 'pre,sharedspace,' + pluginNames,
                    startupFocus: startupFocusEnabled,
                    removePlugins: 'indentblock',
                    title: false,
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
                var componentRe = (/(<(oppia-noninteractive-(.+?))\b[^>]*>)[\s\S]*?<\/\2>/g);
                /**
                 * Before data is loaded into CKEditor, we need to wrap every rte
                 * component in a span (inline) or div (block).
                 * For block elements, we add an overlay div as well.
                 */
                var wrapComponents = function (html) {
                    if (html === undefined) {
                        return html;
                    }
                    return html.replace(componentRe, function (match, p1, p2, p3) {
                        if (RteHelperService.isInlineComponent(p3)) {
                            return '<span type="oppia-noninteractive-' + p3 + '">' +
                                match + '</span>';
                        }
                        else {
                            return '<div type="oppia-noninteractive-' + p3 + '"' +
                                'class="oppia-rte-component-container">' + match +
                                '</div>';
                        }
                    });
                };
                ck.on('instanceReady', function () {
                    // Set the css and icons for each toolbar button.
                    names.forEach(function (name, index) {
                        var icon = icons[index];
                        var upperCasedName = name.charAt(0).toUpperCase() + name.slice(1);
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
                ck.on('getSnapshot', function (event) {
                    if (event.data === undefined) {
                        return;
                    }
                    event.data = event.data.replace(componentRe, function (match, p1, p2) {
                        return p1 + '</' + p2 + '>';
                    });
                }, null, null, 20);
                ck.on('change', function () {
                    var elt = $('<div>' + ck.getData() + '</div>');
                    var textElt = elt[0].childNodes;
                    for (var i = textElt.length; i > 0; i--) {
                        for (var j = textElt[i - 1].childNodes.length; j > 0; j--) {
                            if (textElt[i - 1].childNodes[j - 1].nodeName === 'BR' ||
                                (textElt[i - 1].childNodes[j - 1].nodeName === '#text' &&
                                    textElt[i - 1].childNodes[j - 1].nodeValue.trim() === '')) {
                                textElt[i - 1].childNodes[j - 1].remove();
                            }
                            else {
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
                        }
                        else {
                            break;
                        }
                    }
                    ngModel.$setViewValue(elt.html());
                });
                ngModel.$render = function () {
                    ck.setData(ngModel.$viewValue);
                };
                scope.$on('$destroy', function () {
                    // Clean up CKEditor instance when directive is removed.
                    ck.destroy();
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/ck-editor-helpers/ck-editor-4-widgets.initializer.ts":
/*!*************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/ck-editor-helpers/ck-editor-4-widgets.initializer.ts ***!
  \*************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
__webpack_require__(/*! rich_text_components/richTextComponentsRequires.ts */ "./extensions/rich_text_components/richTextComponentsRequires.ts");
__webpack_require__(/*! services/HtmlEscaperService.ts */ "./core/templates/dev/head/services/HtmlEscaperService.ts");
__webpack_require__(/*! services/RteHelperService.ts */ "./core/templates/dev/head/services/RteHelperService.ts");
angular.module('oppia').run([
    '$timeout', '$compile', '$rootScope', 'RteHelperService',
    'HtmlEscaperService',
    function ($timeout, $compile, $rootScope, RteHelperService, HtmlEscaperService) {
        var _RICH_TEXT_COMPONENTS = RteHelperService.getRichTextComponents();
        _RICH_TEXT_COMPONENTS.forEach(function (componentDefn) {
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
            }
            else {
                var componentTemplate = '<div class="oppia-rte-component-container" ' +
                    'type="' + tagName + '">' +
                    '<' + tagName + '></' + tagName + '>' +
                    '<div class="component-overlay"></div>' +
                    '</div>';
            }
            CKEDITOR.plugins.add(ckName, {
                init: function (editor) {
                    // Create the widget itself.
                    editor.widgets.add(ckName, {
                        button: componentDefn.tooltip,
                        inline: isInline,
                        template: componentTemplate,
                        draggable: false,
                        edit: function () {
                            editor.fire('lockSnapshot', {
                                dontUpdate: true
                            });
                            // Save this for creating the widget later.
                            var container = this.wrapper.getParent(true);
                            var that = this;
                            var customizationArgs = {};
                            customizationArgSpecs.forEach(function (spec) {
                                customizationArgs[spec.name] = that.data[spec.name] ||
                                    spec.default_value;
                            });
                            RteHelperService._openCustomizationModal(customizationArgSpecs, customizationArgs, function (customizationArgsDict) {
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
                                $timeout(function () {
                                    // For inline widgets, place the caret after the
                                    // widget so the user can continue typing immediately.
                                    if (isInline) {
                                        var range = editor.createRange();
                                        var widgetContainer = that.element.getParent();
                                        range.moveToPosition(widgetContainer, CKEDITOR.POSITION_AFTER_END);
                                        editor.getSelection().selectRanges([range]);
                                        // Another timeout needed so the undo snapshot is
                                        // not taken until the caret is in the right place.
                                        $timeout(function () {
                                            editor.fire('unlockSnapshot');
                                            editor.fire('saveSnapshot');
                                        });
                                    }
                                    else {
                                        editor.fire('unlockSnapshot');
                                        editor.fire('saveSnapshot');
                                    }
                                });
                            }, function () { }, function () { });
                        },
                        /**
                         * This is how the widget will be represented in the outputs source,
                         * so it is called when we call editor.getData().
                         */
                        downcast: function (element) {
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
                        upcast: function (element) {
                            return (element.name !== 'p' &&
                                element.children.length > 0 &&
                                element.children[0].name === tagName);
                        },
                        data: function () {
                            var that = this;
                            // Set attributes of component according to data values.
                            customizationArgSpecs.forEach(function (spec) {
                                that.element.getChild(0).setAttribute(spec.name + '-with-value', HtmlEscaperService.objToEscapedJson(that.data[spec.name] || ''));
                            });
                        },
                        init: function () {
                            editor.fire('lockSnapshot', {
                                dontUpdate: true
                            });
                            var that = this;
                            var isMissingAttributes = false;
                            // On init, read values from component attributes and save them.
                            customizationArgSpecs.forEach(function (spec) {
                                var value = that.element.getChild(0).getAttribute(spec.name + '-with-value');
                                if (value) {
                                    that.setData(spec.name, HtmlEscaperService.escapedJsonToObj(value));
                                }
                                else {
                                    isMissingAttributes = true;
                                }
                            });
                            if (!isMissingAttributes) {
                                // Need to manually $compile so the directive renders.
                                $compile($(this.element.$).contents())($rootScope);
                            }
                            $timeout(function () {
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


/***/ }),

/***/ "./core/templates/dev/head/domain/objects/objects-domain.constants.ts":
/*!****************************************************************************!*\
  !*** ./core/templates/dev/head/domain/objects/objects-domain.constants.ts ***!
  \****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Constants for objects domain.
 */
var ObjectsDomainConstants = /** @class */ (function () {
    function ObjectsDomainConstants() {
    }
    ObjectsDomainConstants.FRACTION_PARSING_ERRORS = {
        INVALID_CHARS: 'Please only use numerical digits, spaces or forward slashes (/)',
        INVALID_FORMAT: 'Please enter a valid fraction (e.g., 5/3 or 1 2/3)',
        DIVISION_BY_ZERO: 'Please do not put 0 in the denominator'
    };
    ObjectsDomainConstants.NUMBER_WITH_UNITS_PARSING_ERRORS = {
        INVALID_VALUE: 'Please ensure that value is either a fraction or a number',
        INVALID_CURRENCY: 'Please enter a valid currency (e.g., $5 or Rs 5)',
        INVALID_CURRENCY_FORMAT: 'Please write currency units at the beginning',
        INVALID_UNIT_CHARS: 'Please ensure that unit only contains numbers, alphabets, (, ), *, ^, ' +
            '/, -'
    };
    ObjectsDomainConstants.CURRENCY_UNITS = {
        dollar: {
            name: 'dollar',
            aliases: ['$', 'dollars', 'Dollars', 'Dollar', 'USD'],
            front_units: ['$'],
            base_unit: null
        },
        rupee: {
            name: 'rupee',
            aliases: ['Rs', 'rupees', '₹', 'Rupees', 'Rupee'],
            front_units: ['Rs ', '₹'],
            base_unit: null
        },
        cent: {
            name: 'cent',
            aliases: ['cents', 'Cents', 'Cent'],
            front_units: [],
            base_unit: '0.01 dollar'
        },
        paise: {
            name: 'paise',
            aliases: ['paisa', 'Paise', 'Paisa'],
            front_units: [],
            base_unit: '0.01 rupee'
        }
    };
    return ObjectsDomainConstants;
}());
exports.ObjectsDomainConstants = ObjectsDomainConstants;


/***/ }),

/***/ "./extensions/interactions/interactions-extension.constants.ts":
/*!*********************************************************************!*\
  !*** ./extensions/interactions/interactions-extension.constants.ts ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Constants for interactions extensions.
 */
var InteractionsExtensionsConstants = /** @class */ (function () {
    function InteractionsExtensionsConstants() {
    }
    // Minimum confidence required for a predicted answer group to be shown to
    // user. Generally a threshold of 0.7-0.8 is assumed to be a good one in
    // practice, however value need not be in those bounds.
    InteractionsExtensionsConstants.CODE_REPL_PREDICTION_SERVICE_THRESHOLD = 0.7;
    InteractionsExtensionsConstants.GRAPH_INPUT_LEFT_MARGIN = 120;
    // Gives the staff-lines human readable values.
    InteractionsExtensionsConstants.NOTE_NAMES_TO_MIDI_VALUES = {
        A5: 81,
        G5: 79,
        F5: 77,
        E5: 76,
        D5: 74,
        C5: 72,
        B4: 71,
        A4: 69,
        G4: 67,
        F4: 65,
        E4: 64,
        D4: 62,
        C4: 60
    };
    // Minimum confidence required for a predicted answer group to be shown to
    // user. Generally a threshold of 0.7-0.8 is assumed to be a good one in
    // practice, however value need not be in those bounds.
    InteractionsExtensionsConstants.TEXT_INPUT_PREDICTION_SERVICE_THRESHOLD = 0.7;
    return InteractionsExtensionsConstants;
}());
exports.InteractionsExtensionsConstants = InteractionsExtensionsConstants;


/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2NrLWVkaXRvci1oZWxwZXJzL2NrLWVkaXRvci00LXJ0ZS5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jay1lZGl0b3ItaGVscGVycy9jay1lZGl0b3ItNC13aWRnZXRzLmluaXRpYWxpemVyLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9vYmplY3RzL29iamVjdHMtZG9tYWluLmNvbnN0YW50cy50cyIsIndlYnBhY2s6Ly8vLi9leHRlbnNpb25zL2ludGVyYWN0aW9ucy9pbnRlcmFjdGlvbnMtZXh0ZW5zaW9uLmNvbnN0YW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsd0ZBQTRCO0FBQ3BDLG1CQUFPLENBQUMsNEZBQThCO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCLHNCQUFzQjtBQUN2QztBQUNBO0FBQ0EscURBQXFEO0FBQ3JEO0FBQ0E7QUFDQSxrRkFBa0Y7QUFDbEY7QUFDQTtBQUNBLDBFQUEwRTtBQUMxRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckIsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBLGdEQUFnRCxPQUFPO0FBQ3ZELHNFQUFzRSxPQUFPO0FBQzdFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUMvTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMkhBQW9EO0FBQzVELG1CQUFPLENBQUMsZ0dBQWdDO0FBQ3hDLG1CQUFPLENBQUMsNEZBQThCO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5Q0FBeUM7QUFDekM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlDQUFpQztBQUNqQyw2QkFBNkIsZUFBZSxFQUFFLGVBQWUsRUFBRTtBQUMvRCx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0IseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0EsYUFBYTtBQUNiLFNBQVM7QUFDVDtBQUNBOzs7Ozs7Ozs7Ozs7QUM5S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4Q0FBOEMsY0FBYztBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7Ozs7Ozs7Ozs7OztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhDQUE4QyxjQUFjO0FBQzVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0QiLCJmaWxlIjoiYWRtaW5+Y3JlYXRvcl9kYXNoYm9hcmR+ZXhwbG9yYXRpb25fZWRpdG9yfmV4cGxvcmF0aW9uX3BsYXllcn5tb2RlcmF0b3J+cHJhY3RpY2Vfc2Vzc2lvbn5yZXZpZXdfdGVzdH45OTc5MzRmNS5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgQ0sgRWRpdG9yLlxuICovXG5yZXF1aXJlKCdzZXJ2aWNlcy9Db250ZXh0U2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvUnRlSGVscGVyU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdja0VkaXRvcjRSdGUnLCBbXG4gICAgJ0NvbnRleHRTZXJ2aWNlJywgJ1J0ZUhlbHBlclNlcnZpY2UnLCAnUEFHRV9DT05URVhUJyxcbiAgICBmdW5jdGlvbiAoQ29udGV4dFNlcnZpY2UsIFJ0ZUhlbHBlclNlcnZpY2UsIFBBR0VfQ09OVEVYVCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgdWlDb25maWc6ICcmJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlOiAnPGRpdj48ZGl2PjwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNvbnRlbnRlZGl0YWJsZT1cInRydWVcIiBjbGFzcz1cIm9wcGlhLXJ0ZVwiPicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj48L2Rpdj4nLFxuICAgICAgICAgICAgcmVxdWlyZTogJz9uZ01vZGVsJyxcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWwsIGF0dHIsIG5nTW9kZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgX1JJQ0hfVEVYVF9DT01QT05FTlRTID0gUnRlSGVscGVyU2VydmljZS5nZXRSaWNoVGV4dENvbXBvbmVudHMoKTtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZXMgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgaWNvbnMgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgY2FuVXNlRnMgPSAoQ29udGV4dFNlcnZpY2UuZ2V0UGFnZUNvbnRleHQoKSA9PT0gUEFHRV9DT05URVhULkVYUExPUkFUSU9OX0VESVRPUiB8fFxuICAgICAgICAgICAgICAgICAgICBDb250ZXh0U2VydmljZS5nZXRQYWdlQ29udGV4dCgpID09PSBQQUdFX0NPTlRFWFQuVE9QSUNfRURJVE9SIHx8XG4gICAgICAgICAgICAgICAgICAgIENvbnRleHRTZXJ2aWNlLmdldFBhZ2VDb250ZXh0KCkgPT09IFBBR0VfQ09OVEVYVC5TVE9SWV9FRElUT1IgfHxcbiAgICAgICAgICAgICAgICAgICAgQ29udGV4dFNlcnZpY2UuZ2V0UGFnZUNvbnRleHQoKSA9PT0gUEFHRV9DT05URVhULlNLSUxMX0VESVRPUik7XG4gICAgICAgICAgICAgICAgX1JJQ0hfVEVYVF9DT01QT05FTlRTLmZvckVhY2goZnVuY3Rpb24gKGNvbXBvbmVudERlZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoKHNjb3BlLnVpQ29uZmlnKCkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLnVpQ29uZmlnKCkuaGlkZV9jb21wbGV4X2V4dGVuc2lvbnMgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudERlZm4uaXNDb21wbGV4KSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKCFjYW5Vc2VGcyAmJiBjb21wb25lbnREZWZuLnJlcXVpcmVzRnMpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZXMucHVzaChjb21wb25lbnREZWZuLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGljb25zLnB1c2goY29tcG9uZW50RGVmbi5pY29uRGF0YVVybCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBDcmVhdGUgcnVsZXMgdG8gd2hpdGVsaXN0IGFsbCB0aGUgcmljaCB0ZXh0IGNvbXBvbmVudHMgYW5kXG4gICAgICAgICAgICAgICAgICogdGhlaXIgd3JhcHBlcnMgYW5kIG92ZXJsYXlzLlxuICAgICAgICAgICAgICAgICAqIFNlZSBmb3JtYXQgb2YgZmlsdGVyaW5nIHJ1bGVzIGhlcmU6XG4gICAgICAgICAgICAgICAgICogaHR0cDovL2RvY3MuY2tlZGl0b3IuY29tLyMhL2d1aWRlL2Rldl9hbGxvd2VkX2NvbnRlbnRfcnVsZXNcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAvLyBXaGl0ZWxpc3QgdGhlIGNvbXBvbmVudCB0YWdzIHdpdGggYW55IGF0dHJpYnV0ZXMgYW5kIGNsYXNzZXMuXG4gICAgICAgICAgICAgICAgdmFyIGNvbXBvbmVudFJ1bGUgPSBuYW1lcy5tYXAoZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdvcHBpYS1ub25pbnRlcmFjdGl2ZS0nICsgbmFtZTtcbiAgICAgICAgICAgICAgICB9KS5qb2luKCcgJykgKyAnKCopWypdOyc7XG4gICAgICAgICAgICAgICAgLy8gV2hpdGVsaXN0IHRoZSBpbmxpbmUgY29tcG9uZW50IHdyYXBwZXIsIHdoaWNoIGlzIGFcbiAgICAgICAgICAgICAgICAvLyBzcGFuIHdpdGggYSBcInR5cGVcIiBhdHRyaWJ1dGUuXG4gICAgICAgICAgICAgICAgdmFyIGlubGluZVdyYXBwZXJSdWxlID0gJyBzcGFuW3R5cGVdOyc7XG4gICAgICAgICAgICAgICAgLy8gV2hpdGVsaXN0IHRoZSBibG9jayBjb21wb25lbnQgd3JhcHBlciwgd2hpY2ggaXMgYSBkaXZcbiAgICAgICAgICAgICAgICAvLyB3aXRoIGEgXCJ0eXBlXCIgYXR0cmlidXRlIGFuZCBhIENTUyBjbGFzcy5cbiAgICAgICAgICAgICAgICB2YXIgYmxvY2tXcmFwcGVyUnVsZSA9ICcgZGl2KG9wcGlhLXJ0ZS1jb21wb25lbnQtY29udGFpbmVyKVt0eXBlXTsnO1xuICAgICAgICAgICAgICAgIC8vIFdoaXRlbGlzdCB0aGUgdHJhbnNwYXJlbnQgYmxvY2sgY29tcG9uZW50IG92ZXJsYXksIHdoaWNoIGlzXG4gICAgICAgICAgICAgICAgLy8gYSBkaXYgd2l0aCBhIENTUyBjbGFzcy5cbiAgICAgICAgICAgICAgICB2YXIgYmxvY2tPdmVybGF5UnVsZSA9ICcgZGl2KG9wcGlhLXJ0ZS1jb21wb25lbnQtb3ZlcmxheSk7JztcbiAgICAgICAgICAgICAgICAvLyBQdXQgYWxsIHRoZSBydWxlcyB0b2dldGhlci5cbiAgICAgICAgICAgICAgICB2YXIgZXh0cmFBbGxvd2VkQ29udGVudFJ1bGVzID0gY29tcG9uZW50UnVsZSArXG4gICAgICAgICAgICAgICAgICAgIGlubGluZVdyYXBwZXJSdWxlICtcbiAgICAgICAgICAgICAgICAgICAgYmxvY2tXcmFwcGVyUnVsZSArXG4gICAgICAgICAgICAgICAgICAgIGJsb2NrT3ZlcmxheVJ1bGU7XG4gICAgICAgICAgICAgICAgdmFyIHBsdWdpbk5hbWVzID0gbmFtZXMubWFwKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnb3BwaWEnICsgbmFtZTtcbiAgICAgICAgICAgICAgICB9KS5qb2luKCcsJyk7XG4gICAgICAgICAgICAgICAgdmFyIGJ1dHRvbk5hbWVzID0gW107XG4gICAgICAgICAgICAgICAgbmFtZXMuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBidXR0b25OYW1lcy5wdXNoKCdPcHBpYScgKyBuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uTmFtZXMucHVzaCgnLScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJ1dHRvbk5hbWVzLnBvcCgpO1xuICAgICAgICAgICAgICAgIC8vIEFsbCBpY29ucyBvbiB0aGUgdG9vbGJhciBleGNlcHQgdGhlIFJpY2ggVGV4dCBjb21wb25lbnRzLlxuICAgICAgICAgICAgICAgIHZhciBhbGxJY29ucyA9IFsndW5kbycsICdyZWRvJywgJ2JvbGQnLCAnSXRhbGljJywgJ251bWJlcmVkTGlzdCcsXG4gICAgICAgICAgICAgICAgICAgICdidWxsZXRlZExpc3QnLCAncHJlJywgJ2luZGVudCcsICdvdXRkZW50J107XG4gICAgICAgICAgICAgICAgLy8gQWRkIGV4dGVybmFsIHBsdWdpbnMuXG4gICAgICAgICAgICAgICAgQ0tFRElUT1IucGx1Z2lucy5hZGRFeHRlcm5hbCgnc2hhcmVkc3BhY2UnLCAnL3RoaXJkX3BhcnR5L3N0YXRpYy9ja2VkaXRvci1zaGFyZWRzcGFjZS00LjkuMi8nLCAncGx1Z2luLmpzJyk7XG4gICAgICAgICAgICAgICAgLy8gUHJlIHBsdWdpbiBpcyBub3QgYXZhaWxhYmxlIGZvciA0LjkuMiB2ZXJzaW9uIG9mIENLRWRpdG9yLiBUaGlzIGlzXG4gICAgICAgICAgICAgICAgLy8gYSBzZWxmIGNyZWF0ZWQgcGx1Z2luIChvdGhlciBwbHVnaW5zIGFyZSBwcm92aWRlZCBieSBDS0VkaXRvcikuXG4gICAgICAgICAgICAgICAgQ0tFRElUT1IucGx1Z2lucy5hZGRFeHRlcm5hbCgncHJlJywgJy9leHRlbnNpb25zL2NrZWRpdG9yX3BsdWdpbnMvcHJlLycsICdwbHVnaW4uanMnKTtcbiAgICAgICAgICAgICAgICB2YXIgc3RhcnR1cEZvY3VzRW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgaWYgKHNjb3BlLnVpQ29uZmlnKCkgJiZcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUudWlDb25maWcoKS5zdGFydHVwRm9jdXNFbmFibGVkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnR1cEZvY3VzRW5hYmxlZCA9IHNjb3BlLnVpQ29uZmlnKCkuc3RhcnR1cEZvY3VzRW5hYmxlZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSBDS0VkaXRvci5cbiAgICAgICAgICAgICAgICB2YXIgY2sgPSBDS0VESVRPUi5pbmxpbmUoKGVsWzBdLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzFdKSwge1xuICAgICAgICAgICAgICAgICAgICBleHRyYVBsdWdpbnM6ICdwcmUsc2hhcmVkc3BhY2UsJyArIHBsdWdpbk5hbWVzLFxuICAgICAgICAgICAgICAgICAgICBzdGFydHVwRm9jdXM6IHN0YXJ0dXBGb2N1c0VuYWJsZWQsXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZVBsdWdpbnM6ICdpbmRlbnRibG9jaycsXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgZmxvYXRTcGFjZURvY2tlZE9mZnNldFk6IDE1LFxuICAgICAgICAgICAgICAgICAgICBleHRyYUFsbG93ZWRDb250ZW50OiBleHRyYUFsbG93ZWRDb250ZW50UnVsZXMsXG4gICAgICAgICAgICAgICAgICAgIHNoYXJlZFNwYWNlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9wOiBlbFswXS5jaGlsZHJlblswXS5jaGlsZHJlblswXVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBza2luOiAnYm9vdHN0cmFwY2ssL3RoaXJkX3BhcnR5L3N0YXRpYy9ja2VkaXRvci1ib290c3RyYXBjay0xLjAvJyxcbiAgICAgICAgICAgICAgICAgICAgdG9vbGJhcjogW1xuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdiYXNpY3N0eWxlcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IFsnQm9sZCcsICctJywgJ0l0YWxpYyddXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdwYXJhZ3JhcGgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdOdW1iZXJlZExpc3QnLCAnLScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdCdWxsZXRlZExpc3QnLCAnLScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdQcmUnLCAnLScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdCbG9ja3F1b3RlJywgJy0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnSW5kZW50JywgJy0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnT3V0ZGVudCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdydGVjb21wb25lbnRzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtczogYnV0dG9uTmFtZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2RvY3VtZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtczogWydTb3VyY2UnXVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgLy8gQSBSZWdFeHAgZm9yIG1hdGNoaW5nIHJpY2ggdGV4dCBjb21wb25lbnRzLlxuICAgICAgICAgICAgICAgIHZhciBjb21wb25lbnRSZSA9ICgvKDwob3BwaWEtbm9uaW50ZXJhY3RpdmUtKC4rPykpXFxiW14+XSo+KVtcXHNcXFNdKj88XFwvXFwyPi9nKTtcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBCZWZvcmUgZGF0YSBpcyBsb2FkZWQgaW50byBDS0VkaXRvciwgd2UgbmVlZCB0byB3cmFwIGV2ZXJ5IHJ0ZVxuICAgICAgICAgICAgICAgICAqIGNvbXBvbmVudCBpbiBhIHNwYW4gKGlubGluZSkgb3IgZGl2IChibG9jaykuXG4gICAgICAgICAgICAgICAgICogRm9yIGJsb2NrIGVsZW1lbnRzLCB3ZSBhZGQgYW4gb3ZlcmxheSBkaXYgYXMgd2VsbC5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICB2YXIgd3JhcENvbXBvbmVudHMgPSBmdW5jdGlvbiAoaHRtbCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaHRtbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaHRtbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaHRtbC5yZXBsYWNlKGNvbXBvbmVudFJlLCBmdW5jdGlvbiAobWF0Y2gsIHAxLCBwMiwgcDMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChSdGVIZWxwZXJTZXJ2aWNlLmlzSW5saW5lQ29tcG9uZW50KHAzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnPHNwYW4gdHlwZT1cIm9wcGlhLW5vbmludGVyYWN0aXZlLScgKyBwMyArICdcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2ggKyAnPC9zcGFuPic7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJzxkaXYgdHlwZT1cIm9wcGlhLW5vbmludGVyYWN0aXZlLScgKyBwMyArICdcIicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnY2xhc3M9XCJvcHBpYS1ydGUtY29tcG9uZW50LWNvbnRhaW5lclwiPicgKyBtYXRjaCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGNrLm9uKCdpbnN0YW5jZVJlYWR5JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIGNzcyBhbmQgaWNvbnMgZm9yIGVhY2ggdG9vbGJhciBidXR0b24uXG4gICAgICAgICAgICAgICAgICAgIG5hbWVzLmZvckVhY2goZnVuY3Rpb24gKG5hbWUsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaWNvbiA9IGljb25zW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB1cHBlckNhc2VkTmFtZSA9IG5hbWUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBuYW1lLnNsaWNlKDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJCgnLmNrZV9idXR0b25fX29wcGlhJyArIG5hbWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNzcygnYmFja2dyb3VuZC1pbWFnZScsICd1cmwoXCIvZXh0ZW5zaW9ucycgKyBpY29uICsgJ1wiKScpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNzcygnYmFja2dyb3VuZC1wb3NpdGlvbicsICdjZW50ZXInKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jc3MoJ2JhY2tncm91bmQtcmVwZWF0JywgJ25vLXJlcGVhdCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNzcygnaGVpZ2h0JywgJzI0cHgnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jc3MoJ3dpZHRoJywgJzI0cHgnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jc3MoJ3BhZGRpbmcnLCAnMHB4IDBweCcpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmNrZV90b29sYmFyX3NlcGFyYXRvcicpXG4gICAgICAgICAgICAgICAgICAgICAgICAuY3NzKCdoZWlnaHQnLCAnMjJweCcpO1xuICAgICAgICAgICAgICAgICAgICAkKCcuY2tlX2J1dHRvbl9pY29uJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jc3MoJ2hlaWdodCcsICcyNHB4JylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jc3MoJ3dpZHRoJywgJzI0cHgnKTtcbiAgICAgICAgICAgICAgICAgICAgY2suc2V0RGF0YSh3cmFwQ29tcG9uZW50cyhuZ01vZGVsLiR2aWV3VmFsdWUpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAvLyBBbmd1bGFyIHJlbmRlcmluZyBvZiBjb21wb25lbnRzIGNvbmZ1c2VzIENLRWRpdG9yJ3MgdW5kbyBzeXN0ZW0sIHNvXG4gICAgICAgICAgICAgICAgLy8gd2UgaGlkZSBhbGwgb2YgdGhhdCBzdHVmZiBhd2F5IGZyb20gQ0tFZGl0b3IuXG4gICAgICAgICAgICAgICAgY2sub24oJ2dldFNuYXBzaG90JywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChldmVudC5kYXRhID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBldmVudC5kYXRhID0gZXZlbnQuZGF0YS5yZXBsYWNlKGNvbXBvbmVudFJlLCBmdW5jdGlvbiAobWF0Y2gsIHAxLCBwMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHAxICsgJzwvJyArIHAyICsgJz4nO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9LCBudWxsLCBudWxsLCAyMCk7XG4gICAgICAgICAgICAgICAgY2sub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVsdCA9ICQoJzxkaXY+JyArIGNrLmdldERhdGEoKSArICc8L2Rpdj4nKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRleHRFbHQgPSBlbHRbMF0uY2hpbGROb2RlcztcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IHRleHRFbHQubGVuZ3RoOyBpID4gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gdGV4dEVsdFtpIC0gMV0uY2hpbGROb2Rlcy5sZW5ndGg7IGogPiAwOyBqLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGV4dEVsdFtpIC0gMV0uY2hpbGROb2Rlc1tqIC0gMV0ubm9kZU5hbWUgPT09ICdCUicgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHRleHRFbHRbaSAtIDFdLmNoaWxkTm9kZXNbaiAtIDFdLm5vZGVOYW1lID09PSAnI3RleHQnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0RWx0W2kgLSAxXS5jaGlsZE5vZGVzW2ogLSAxXS5ub2RlVmFsdWUudHJpbSgpID09PSAnJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dEVsdFtpIC0gMV0uY2hpbGROb2Rlc1tqIC0gMV0ucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGV4dEVsdFtpIC0gMV0uY2hpbGROb2Rlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGV4dEVsdFtpIC0gMV0ubm9kZU5hbWUgPT09ICdCUicgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHRleHRFbHRbaSAtIDFdLm5vZGVOYW1lID09PSAnI3RleHQnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0RWx0W2kgLSAxXS5ub2RlVmFsdWUudHJpbSgpID09PSAnJykgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dEVsdFtpIC0gMV0ubm9kZU5hbWUgPT09ICdQJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0RWx0W2kgLSAxXS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbmdNb2RlbC4kc2V0Vmlld1ZhbHVlKGVsdC5odG1sKCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIG5nTW9kZWwuJHJlbmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgY2suc2V0RGF0YShuZ01vZGVsLiR2aWV3VmFsdWUpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2xlYW4gdXAgQ0tFZGl0b3IgaW5zdGFuY2Ugd2hlbiBkaXJlY3RpdmUgaXMgcmVtb3ZlZC5cbiAgICAgICAgICAgICAgICAgICAgY2suZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb2RlIHRvIGR5bmFtaWNhbGx5IGdlbmVyYXRlIENLRWRpdG9yIHdpZGdldHMgZm9yIHRoZSByaWNoXG4gKiB0ZXh0IGNvbXBvbmVudHMuXG4gKi9cbnJlcXVpcmUoJ3JpY2hfdGV4dF9jb21wb25lbnRzL3JpY2hUZXh0Q29tcG9uZW50c1JlcXVpcmVzLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9IdG1sRXNjYXBlclNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1J0ZUhlbHBlclNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLnJ1bihbXG4gICAgJyR0aW1lb3V0JywgJyRjb21waWxlJywgJyRyb290U2NvcGUnLCAnUnRlSGVscGVyU2VydmljZScsXG4gICAgJ0h0bWxFc2NhcGVyU2VydmljZScsXG4gICAgZnVuY3Rpb24gKCR0aW1lb3V0LCAkY29tcGlsZSwgJHJvb3RTY29wZSwgUnRlSGVscGVyU2VydmljZSwgSHRtbEVzY2FwZXJTZXJ2aWNlKSB7XG4gICAgICAgIHZhciBfUklDSF9URVhUX0NPTVBPTkVOVFMgPSBSdGVIZWxwZXJTZXJ2aWNlLmdldFJpY2hUZXh0Q29tcG9uZW50cygpO1xuICAgICAgICBfUklDSF9URVhUX0NPTVBPTkVOVFMuZm9yRWFjaChmdW5jdGlvbiAoY29tcG9uZW50RGVmbikge1xuICAgICAgICAgICAgLy8gVGhlIG5hbWUgb2YgdGhlIENLRWRpdG9yIHdpZGdldCBjb3JyZXNwb25kaW5nIHRvIHRoaXMgY29tcG9uZW50LlxuICAgICAgICAgICAgdmFyIGNrTmFtZSA9ICdvcHBpYScgKyBjb21wb25lbnREZWZuLmlkO1xuICAgICAgICAgICAgLy8gQ2hlY2sgdG8gZW5zdXJlIHRoYXQgYSBwbHVnaW4gaXMgbm90IHJlZ2lzdGVyZWQgbW9yZSB0aGFuIG9uY2UuXG4gICAgICAgICAgICBpZiAoQ0tFRElUT1IucGx1Z2lucy5yZWdpc3RlcmVkW2NrTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB0YWdOYW1lID0gJ29wcGlhLW5vbmludGVyYWN0aXZlLScgKyBjb21wb25lbnREZWZuLmlkO1xuICAgICAgICAgICAgdmFyIGN1c3RvbWl6YXRpb25BcmdTcGVjcyA9IGNvbXBvbmVudERlZm4uY3VzdG9taXphdGlvbkFyZ1NwZWNzO1xuICAgICAgICAgICAgdmFyIGlzSW5saW5lID0gUnRlSGVscGVyU2VydmljZS5pc0lubGluZUNvbXBvbmVudChjb21wb25lbnREZWZuLmlkKTtcbiAgICAgICAgICAgIC8vIElubGluZSBjb21wb25lbnRzIHdpbGwgYmUgd3JhcHBlZCBpbiBhIHNwYW4sIHdoaWxlIGJsb2NrIGNvbXBvbmVudHNcbiAgICAgICAgICAgIC8vIHdpbGwgYmUgd3JhcHBlZCBpbiBhIGRpdi5cbiAgICAgICAgICAgIGlmIChpc0lubGluZSkge1xuICAgICAgICAgICAgICAgIHZhciBjb21wb25lbnRUZW1wbGF0ZSA9ICc8c3BhbiB0eXBlPVwiJyArIHRhZ05hbWUgKyAnXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8JyArIHRhZ05hbWUgKyAnPjwvJyArIHRhZ05hbWUgKyAnPicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9zcGFuPic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgY29tcG9uZW50VGVtcGxhdGUgPSAnPGRpdiBjbGFzcz1cIm9wcGlhLXJ0ZS1jb21wb25lbnQtY29udGFpbmVyXCIgJyArXG4gICAgICAgICAgICAgICAgICAgICd0eXBlPVwiJyArIHRhZ05hbWUgKyAnXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8JyArIHRhZ05hbWUgKyAnPjwvJyArIHRhZ05hbWUgKyAnPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbXBvbmVudC1vdmVybGF5XCI+PC9kaXY+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQ0tFRElUT1IucGx1Z2lucy5hZGQoY2tOYW1lLCB7XG4gICAgICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24gKGVkaXRvcikge1xuICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgdGhlIHdpZGdldCBpdHNlbGYuXG4gICAgICAgICAgICAgICAgICAgIGVkaXRvci53aWRnZXRzLmFkZChja05hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbjogY29tcG9uZW50RGVmbi50b29sdGlwLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5saW5lOiBpc0lubGluZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlOiBjb21wb25lbnRUZW1wbGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyYWdnYWJsZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBlZGl0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmZpcmUoJ2xvY2tTbmFwc2hvdCcsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9udFVwZGF0ZTogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNhdmUgdGhpcyBmb3IgY3JlYXRpbmcgdGhlIHdpZGdldCBsYXRlci5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyID0gdGhpcy53cmFwcGVyLmdldFBhcmVudCh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1c3RvbWl6YXRpb25BcmdzID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9taXphdGlvbkFyZ1NwZWNzLmZvckVhY2goZnVuY3Rpb24gKHNwZWMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9taXphdGlvbkFyZ3Nbc3BlYy5uYW1lXSA9IHRoYXQuZGF0YVtzcGVjLm5hbWVdIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGVjLmRlZmF1bHRfdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUnRlSGVscGVyU2VydmljZS5fb3BlbkN1c3RvbWl6YXRpb25Nb2RhbChjdXN0b21pemF0aW9uQXJnU3BlY3MsIGN1c3RvbWl6YXRpb25BcmdzLCBmdW5jdGlvbiAoY3VzdG9taXphdGlvbkFyZ3NEaWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGFyZyBpbiBjdXN0b21pemF0aW9uQXJnc0RpY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXN0b21pemF0aW9uQXJnc0RpY3QuaGFzT3duUHJvcGVydHkoYXJnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2V0RGF0YShhcmcsIGN1c3RvbWl6YXRpb25BcmdzRGljdFthcmddKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBUaGlzIGNoZWNrcyB3aGV0aGVyIHRoZSB3aWRnZXQgaGFzIGFscmVhZHkgYmVlbiBpbml0ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBhbmQgc2V0IHVwIGJlZm9yZSAoaWYgd2UgYXJlIGVkaXRpbmcgYSB3aWRnZXQgdGhhdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIGhhcyBhbHJlYWR5IGJlZW4gaW5zZXJ0ZWQgaW50byB0aGUgUlRFLCB3ZSBkbyBub3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBuZWVkIHRvIGZpbmFsaXplQ3JlYXRpb24gYWdhaW4pLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoYXQuaXNSZWFkeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBY3R1YWxseSBjcmVhdGUgdGhlIHdpZGdldCwgaWYgd2UgaGF2ZSBub3QgYWxyZWFkeS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci53aWRnZXRzLmZpbmFsaXplQ3JlYXRpb24oY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogTmVlZCB0byBtYW51YWxseSAkY29tcGlsZSBzbyB0aGUgZGlyZWN0aXZlIHJlbmRlcnMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIE5vdGUgdGhhdC5lbGVtZW50LiQgaXMgdGhlIG5hdGl2ZSBET00gb2JqZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIHJlcHJlc2VudGVkIGJ5IHRoYXQuZWxlbWVudC4gU2VlOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBodHRwOi8vZG9jcy5ja2VkaXRvci5jb20vIyEvYXBpL0NLRURJVE9SLmRvbS5lbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkY29tcGlsZSgkKHRoYXQuZWxlbWVudC4kKS5jb250ZW50cygpKSgkcm9vdFNjb3BlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gJHRpbWVvdXQgZW5zdXJlcyB3ZSBkbyBub3QgdGFrZSB0aGUgdW5kbyBzbmFwc2hvdCB1bnRpbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhZnRlciBhbmd1bGFyIGZpbmlzaGVzIGl0cyBjaGFuZ2VzIHRvIHRoZSBjb21wb25lbnQgdGFncy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yIGlubGluZSB3aWRnZXRzLCBwbGFjZSB0aGUgY2FyZXQgYWZ0ZXIgdGhlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3aWRnZXQgc28gdGhlIHVzZXIgY2FuIGNvbnRpbnVlIHR5cGluZyBpbW1lZGlhdGVseS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0lubGluZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByYW5nZSA9IGVkaXRvci5jcmVhdGVSYW5nZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB3aWRnZXRDb250YWluZXIgPSB0aGF0LmVsZW1lbnQuZ2V0UGFyZW50KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2UubW92ZVRvUG9zaXRpb24od2lkZ2V0Q29udGFpbmVyLCBDS0VESVRPUi5QT1NJVElPTl9BRlRFUl9FTkQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5nZXRTZWxlY3Rpb24oKS5zZWxlY3RSYW5nZXMoW3JhbmdlXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQW5vdGhlciB0aW1lb3V0IG5lZWRlZCBzbyB0aGUgdW5kbyBzbmFwc2hvdCBpc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vdCB0YWtlbiB1bnRpbCB0aGUgY2FyZXQgaXMgaW4gdGhlIHJpZ2h0IHBsYWNlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmZpcmUoJ3VubG9ja1NuYXBzaG90Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5maXJlKCdzYXZlU25hcHNob3QnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5maXJlKCd1bmxvY2tTbmFwc2hvdCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5maXJlKCdzYXZlU25hcHNob3QnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkgeyB9LCBmdW5jdGlvbiAoKSB7IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgICAgICogVGhpcyBpcyBob3cgdGhlIHdpZGdldCB3aWxsIGJlIHJlcHJlc2VudGVkIGluIHRoZSBvdXRwdXRzIHNvdXJjZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIHNvIGl0IGlzIGNhbGxlZCB3aGVuIHdlIGNhbGwgZWRpdG9yLmdldERhdGEoKS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZG93bmNhc3Q6IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2xlYXIgdGhlIGFuZ3VsYXIgcmVuZGVyaW5nIGNvbnRlbnQsIHdoaWNoIHdlIGRvbid0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2FudCBpbiB0aGUgb3V0cHV0LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuY2hpbGRyZW5bMF0uc2V0SHRtbCgnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmV0dXJuIGp1c3QgdGhlIHJpY2ggdGV4dCBjb21wb25lbnQsIHdpdGhvdXQgaXRzIHdyYXBwZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQuY2hpbGRyZW5bMF07XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBUaGlzIGlzIGhvdyBhIHdpZGdldCBpcyByZWNvZ25pemVkIGJ5IENLRWRpdG9yLCBmb3IgZXhhbXBsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICogd2hlbiB3ZSBmaXJzdCBsb2FkIGRhdGEgaW4uIFJldHVybnMgYSBib29sZWFuLFxuICAgICAgICAgICAgICAgICAgICAgICAgICogdHJ1ZSBpZmYgXCJlbGVtZW50XCIgaXMgYW4gaW5zdGFuY2Ugb2YgdGhpcyB3aWRnZXQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHVwY2FzdDogZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKGVsZW1lbnQubmFtZSAhPT0gJ3AnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoID4gMCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmNoaWxkcmVuWzBdLm5hbWUgPT09IHRhZ05hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2V0IGF0dHJpYnV0ZXMgb2YgY29tcG9uZW50IGFjY29yZGluZyB0byBkYXRhIHZhbHVlcy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21pemF0aW9uQXJnU3BlY3MuZm9yRWFjaChmdW5jdGlvbiAoc3BlYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmVsZW1lbnQuZ2V0Q2hpbGQoMCkuc2V0QXR0cmlidXRlKHNwZWMubmFtZSArICctd2l0aC12YWx1ZScsIEh0bWxFc2NhcGVyU2VydmljZS5vYmpUb0VzY2FwZWRKc29uKHRoYXQuZGF0YVtzcGVjLm5hbWVdIHx8ICcnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5maXJlKCdsb2NrU25hcHNob3QnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbnRVcGRhdGU6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlzTWlzc2luZ0F0dHJpYnV0ZXMgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPbiBpbml0LCByZWFkIHZhbHVlcyBmcm9tIGNvbXBvbmVudCBhdHRyaWJ1dGVzIGFuZCBzYXZlIHRoZW0uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9taXphdGlvbkFyZ1NwZWNzLmZvckVhY2goZnVuY3Rpb24gKHNwZWMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gdGhhdC5lbGVtZW50LmdldENoaWxkKDApLmdldEF0dHJpYnV0ZShzcGVjLm5hbWUgKyAnLXdpdGgtdmFsdWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnNldERhdGEoc3BlYy5uYW1lLCBIdG1sRXNjYXBlclNlcnZpY2UuZXNjYXBlZEpzb25Ub09iaih2YWx1ZSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNNaXNzaW5nQXR0cmlidXRlcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzTWlzc2luZ0F0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTmVlZCB0byBtYW51YWxseSAkY29tcGlsZSBzbyB0aGUgZGlyZWN0aXZlIHJlbmRlcnMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRjb21waWxlKCQodGhpcy5lbGVtZW50LiQpLmNvbnRlbnRzKCkpKCRyb290U2NvcGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5maXJlKCd1bmxvY2tTbmFwc2hvdCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZmlyZSgnc2F2ZVNuYXBzaG90Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uc3RhbnRzIGZvciBvYmplY3RzIGRvbWFpbi5cbiAqL1xudmFyIE9iamVjdHNEb21haW5Db25zdGFudHMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gT2JqZWN0c0RvbWFpbkNvbnN0YW50cygpIHtcbiAgICB9XG4gICAgT2JqZWN0c0RvbWFpbkNvbnN0YW50cy5GUkFDVElPTl9QQVJTSU5HX0VSUk9SUyA9IHtcbiAgICAgICAgSU5WQUxJRF9DSEFSUzogJ1BsZWFzZSBvbmx5IHVzZSBudW1lcmljYWwgZGlnaXRzLCBzcGFjZXMgb3IgZm9yd2FyZCBzbGFzaGVzICgvKScsXG4gICAgICAgIElOVkFMSURfRk9STUFUOiAnUGxlYXNlIGVudGVyIGEgdmFsaWQgZnJhY3Rpb24gKGUuZy4sIDUvMyBvciAxIDIvMyknLFxuICAgICAgICBESVZJU0lPTl9CWV9aRVJPOiAnUGxlYXNlIGRvIG5vdCBwdXQgMCBpbiB0aGUgZGVub21pbmF0b3InXG4gICAgfTtcbiAgICBPYmplY3RzRG9tYWluQ29uc3RhbnRzLk5VTUJFUl9XSVRIX1VOSVRTX1BBUlNJTkdfRVJST1JTID0ge1xuICAgICAgICBJTlZBTElEX1ZBTFVFOiAnUGxlYXNlIGVuc3VyZSB0aGF0IHZhbHVlIGlzIGVpdGhlciBhIGZyYWN0aW9uIG9yIGEgbnVtYmVyJyxcbiAgICAgICAgSU5WQUxJRF9DVVJSRU5DWTogJ1BsZWFzZSBlbnRlciBhIHZhbGlkIGN1cnJlbmN5IChlLmcuLCAkNSBvciBScyA1KScsXG4gICAgICAgIElOVkFMSURfQ1VSUkVOQ1lfRk9STUFUOiAnUGxlYXNlIHdyaXRlIGN1cnJlbmN5IHVuaXRzIGF0IHRoZSBiZWdpbm5pbmcnLFxuICAgICAgICBJTlZBTElEX1VOSVRfQ0hBUlM6ICdQbGVhc2UgZW5zdXJlIHRoYXQgdW5pdCBvbmx5IGNvbnRhaW5zIG51bWJlcnMsIGFscGhhYmV0cywgKCwgKSwgKiwgXiwgJyArXG4gICAgICAgICAgICAnLywgLSdcbiAgICB9O1xuICAgIE9iamVjdHNEb21haW5Db25zdGFudHMuQ1VSUkVOQ1lfVU5JVFMgPSB7XG4gICAgICAgIGRvbGxhcjoge1xuICAgICAgICAgICAgbmFtZTogJ2RvbGxhcicsXG4gICAgICAgICAgICBhbGlhc2VzOiBbJyQnLCAnZG9sbGFycycsICdEb2xsYXJzJywgJ0RvbGxhcicsICdVU0QnXSxcbiAgICAgICAgICAgIGZyb250X3VuaXRzOiBbJyQnXSxcbiAgICAgICAgICAgIGJhc2VfdW5pdDogbnVsbFxuICAgICAgICB9LFxuICAgICAgICBydXBlZToge1xuICAgICAgICAgICAgbmFtZTogJ3J1cGVlJyxcbiAgICAgICAgICAgIGFsaWFzZXM6IFsnUnMnLCAncnVwZWVzJywgJ+KCuScsICdSdXBlZXMnLCAnUnVwZWUnXSxcbiAgICAgICAgICAgIGZyb250X3VuaXRzOiBbJ1JzICcsICfigrknXSxcbiAgICAgICAgICAgIGJhc2VfdW5pdDogbnVsbFxuICAgICAgICB9LFxuICAgICAgICBjZW50OiB7XG4gICAgICAgICAgICBuYW1lOiAnY2VudCcsXG4gICAgICAgICAgICBhbGlhc2VzOiBbJ2NlbnRzJywgJ0NlbnRzJywgJ0NlbnQnXSxcbiAgICAgICAgICAgIGZyb250X3VuaXRzOiBbXSxcbiAgICAgICAgICAgIGJhc2VfdW5pdDogJzAuMDEgZG9sbGFyJ1xuICAgICAgICB9LFxuICAgICAgICBwYWlzZToge1xuICAgICAgICAgICAgbmFtZTogJ3BhaXNlJyxcbiAgICAgICAgICAgIGFsaWFzZXM6IFsncGFpc2EnLCAnUGFpc2UnLCAnUGFpc2EnXSxcbiAgICAgICAgICAgIGZyb250X3VuaXRzOiBbXSxcbiAgICAgICAgICAgIGJhc2VfdW5pdDogJzAuMDEgcnVwZWUnXG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBPYmplY3RzRG9tYWluQ29uc3RhbnRzO1xufSgpKTtcbmV4cG9ydHMuT2JqZWN0c0RvbWFpbkNvbnN0YW50cyA9IE9iamVjdHNEb21haW5Db25zdGFudHM7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnN0YW50cyBmb3IgaW50ZXJhY3Rpb25zIGV4dGVuc2lvbnMuXG4gKi9cbnZhciBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMoKSB7XG4gICAgfVxuICAgIC8vIE1pbmltdW0gY29uZmlkZW5jZSByZXF1aXJlZCBmb3IgYSBwcmVkaWN0ZWQgYW5zd2VyIGdyb3VwIHRvIGJlIHNob3duIHRvXG4gICAgLy8gdXNlci4gR2VuZXJhbGx5IGEgdGhyZXNob2xkIG9mIDAuNy0wLjggaXMgYXNzdW1lZCB0byBiZSBhIGdvb2Qgb25lIGluXG4gICAgLy8gcHJhY3RpY2UsIGhvd2V2ZXIgdmFsdWUgbmVlZCBub3QgYmUgaW4gdGhvc2UgYm91bmRzLlxuICAgIEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMuQ09ERV9SRVBMX1BSRURJQ1RJT05fU0VSVklDRV9USFJFU0hPTEQgPSAwLjc7XG4gICAgSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cy5HUkFQSF9JTlBVVF9MRUZUX01BUkdJTiA9IDEyMDtcbiAgICAvLyBHaXZlcyB0aGUgc3RhZmYtbGluZXMgaHVtYW4gcmVhZGFibGUgdmFsdWVzLlxuICAgIEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMuTk9URV9OQU1FU19UT19NSURJX1ZBTFVFUyA9IHtcbiAgICAgICAgQTU6IDgxLFxuICAgICAgICBHNTogNzksXG4gICAgICAgIEY1OiA3NyxcbiAgICAgICAgRTU6IDc2LFxuICAgICAgICBENTogNzQsXG4gICAgICAgIEM1OiA3MixcbiAgICAgICAgQjQ6IDcxLFxuICAgICAgICBBNDogNjksXG4gICAgICAgIEc0OiA2NyxcbiAgICAgICAgRjQ6IDY1LFxuICAgICAgICBFNDogNjQsXG4gICAgICAgIEQ0OiA2MixcbiAgICAgICAgQzQ6IDYwXG4gICAgfTtcbiAgICAvLyBNaW5pbXVtIGNvbmZpZGVuY2UgcmVxdWlyZWQgZm9yIGEgcHJlZGljdGVkIGFuc3dlciBncm91cCB0byBiZSBzaG93biB0b1xuICAgIC8vIHVzZXIuIEdlbmVyYWxseSBhIHRocmVzaG9sZCBvZiAwLjctMC44IGlzIGFzc3VtZWQgdG8gYmUgYSBnb29kIG9uZSBpblxuICAgIC8vIHByYWN0aWNlLCBob3dldmVyIHZhbHVlIG5lZWQgbm90IGJlIGluIHRob3NlIGJvdW5kcy5cbiAgICBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzLlRFWFRfSU5QVVRfUFJFRElDVElPTl9TRVJWSUNFX1RIUkVTSE9MRCA9IDAuNztcbiAgICByZXR1cm4gSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cztcbn0oKSk7XG5leHBvcnRzLkludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMgPSBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==