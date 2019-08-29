(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["admin~creator_dashboard~exploration_editor~exploration_player~moderator~practice_session~review_test~d3595155"],{

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

/***/ "./extensions/interactions/codemirrorRequires.ts":
/*!*******************************************************!*\
  !*** ./extensions/interactions/codemirrorRequires.ts ***!
  \*******************************************************/
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
 * @fileoverview Loads scripts needed for ui-codemirror.
 */
var CodeMirror = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'static/code-mirror-5.17.0/lib/codemirror.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
Object.defineProperty(window, 'CodeMirror', {
    value: CodeMirror,
    writable: false
});
__webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'static/code-mirror-5.17.0/mode/javascript/javascript.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
__webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'static/code-mirror-5.17.0/mode/python/python.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
__webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'static/code-mirror-5.17.0/mode/yaml/yaml.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
__webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'static/ui-codemirror-5d04fa/src/ui-codemirror.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
__webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'static/diff-match-patch-1.0.0/diff_match_patch.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2NrLWVkaXRvci1oZWxwZXJzL2NrLWVkaXRvci00LXJ0ZS5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jay1lZGl0b3ItaGVscGVycy9jay1lZGl0b3ItNC13aWRnZXRzLmluaXRpYWxpemVyLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9vYmplY3RzL29iamVjdHMtZG9tYWluLmNvbnN0YW50cy50cyIsIndlYnBhY2s6Ly8vLi9leHRlbnNpb25zL2ludGVyYWN0aW9ucy9jb2RlbWlycm9yUmVxdWlyZXMudHMiLCJ3ZWJwYWNrOi8vLy4vZXh0ZW5zaW9ucy9pbnRlcmFjdGlvbnMvaW50ZXJhY3Rpb25zLWV4dGVuc2lvbi5jb25zdGFudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLHdGQUE0QjtBQUNwQyxtQkFBTyxDQUFDLDRGQUE4QjtBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQixzQkFBc0I7QUFDdkM7QUFDQTtBQUNBLHFEQUFxRDtBQUNyRDtBQUNBO0FBQ0Esa0ZBQWtGO0FBQ2xGO0FBQ0E7QUFDQSwwRUFBMEU7QUFDMUU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxnREFBZ0QsT0FBTztBQUN2RCxzRUFBc0UsT0FBTztBQUM3RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDL05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDJIQUFvRDtBQUM1RCxtQkFBTyxDQUFDLGdHQUFnQztBQUN4QyxtQkFBTyxDQUFDLDRGQUE4QjtBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUNBQXlDO0FBQ3pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUM7QUFDakMsNkJBQTZCLGVBQWUsRUFBRSxlQUFlLEVBQUU7QUFDL0QseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBLGFBQWE7QUFDYixTQUFTO0FBQ1Q7QUFDQTs7Ozs7Ozs7Ozs7O0FDOUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQThDLGNBQWM7QUFDNUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEOzs7Ozs7Ozs7Ozs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUIsbUJBQU8sQ0FBQyxxS0FBNkM7QUFDdEU7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNELG1CQUFPLENBQUMsaUxBQXlEO0FBQ2pFLG1CQUFPLENBQUMseUtBQWlEO0FBQ3pELG1CQUFPLENBQUMscUtBQTZDO0FBQ3JELG1CQUFPLENBQUMsMEtBQWtEO0FBQzFELG1CQUFPLENBQUMsMktBQW1EOzs7Ozs7Ozs7Ozs7QUN6QjNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQThDLGNBQWM7QUFDNUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCIsImZpbGUiOiJhZG1pbn5jcmVhdG9yX2Rhc2hib2FyZH5leHBsb3JhdGlvbl9lZGl0b3J+ZXhwbG9yYXRpb25fcGxheWVyfm1vZGVyYXRvcn5wcmFjdGljZV9zZXNzaW9ufnJldmlld190ZXN0fmQzNTk1MTU1LmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBDSyBFZGl0b3IuXG4gKi9cbnJlcXVpcmUoJ3NlcnZpY2VzL0NvbnRleHRTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9SdGVIZWxwZXJTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2NrRWRpdG9yNFJ0ZScsIFtcbiAgICAnQ29udGV4dFNlcnZpY2UnLCAnUnRlSGVscGVyU2VydmljZScsICdQQUdFX0NPTlRFWFQnLFxuICAgIGZ1bmN0aW9uIChDb250ZXh0U2VydmljZSwgUnRlSGVscGVyU2VydmljZSwgUEFHRV9DT05URVhUKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICB1aUNvbmZpZzogJyYnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGU6ICc8ZGl2PjxkaXY+PC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY29udGVudGVkaXRhYmxlPVwidHJ1ZVwiIGNsYXNzPVwib3BwaWEtcnRlXCI+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2PjwvZGl2PicsXG4gICAgICAgICAgICByZXF1aXJlOiAnP25nTW9kZWwnLFxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbCwgYXR0ciwgbmdNb2RlbCkge1xuICAgICAgICAgICAgICAgIHZhciBfUklDSF9URVhUX0NPTVBPTkVOVFMgPSBSdGVIZWxwZXJTZXJ2aWNlLmdldFJpY2hUZXh0Q29tcG9uZW50cygpO1xuICAgICAgICAgICAgICAgIHZhciBuYW1lcyA9IFtdO1xuICAgICAgICAgICAgICAgIHZhciBpY29ucyA9IFtdO1xuICAgICAgICAgICAgICAgIHZhciBjYW5Vc2VGcyA9IChDb250ZXh0U2VydmljZS5nZXRQYWdlQ29udGV4dCgpID09PSBQQUdFX0NPTlRFWFQuRVhQTE9SQVRJT05fRURJVE9SIHx8XG4gICAgICAgICAgICAgICAgICAgIENvbnRleHRTZXJ2aWNlLmdldFBhZ2VDb250ZXh0KCkgPT09IFBBR0VfQ09OVEVYVC5UT1BJQ19FRElUT1IgfHxcbiAgICAgICAgICAgICAgICAgICAgQ29udGV4dFNlcnZpY2UuZ2V0UGFnZUNvbnRleHQoKSA9PT0gUEFHRV9DT05URVhULlNUT1JZX0VESVRPUiB8fFxuICAgICAgICAgICAgICAgICAgICBDb250ZXh0U2VydmljZS5nZXRQYWdlQ29udGV4dCgpID09PSBQQUdFX0NPTlRFWFQuU0tJTExfRURJVE9SKTtcbiAgICAgICAgICAgICAgICBfUklDSF9URVhUX0NPTVBPTkVOVFMuZm9yRWFjaChmdW5jdGlvbiAoY29tcG9uZW50RGVmbikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoISgoc2NvcGUudWlDb25maWcoKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUudWlDb25maWcoKS5oaWRlX2NvbXBsZXhfZXh0ZW5zaW9ucyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50RGVmbi5pc0NvbXBsZXgpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAoIWNhblVzZUZzICYmIGNvbXBvbmVudERlZm4ucmVxdWlyZXNGcykpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lcy5wdXNoKGNvbXBvbmVudERlZm4uaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWNvbnMucHVzaChjb21wb25lbnREZWZuLmljb25EYXRhVXJsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIENyZWF0ZSBydWxlcyB0byB3aGl0ZWxpc3QgYWxsIHRoZSByaWNoIHRleHQgY29tcG9uZW50cyBhbmRcbiAgICAgICAgICAgICAgICAgKiB0aGVpciB3cmFwcGVycyBhbmQgb3ZlcmxheXMuXG4gICAgICAgICAgICAgICAgICogU2VlIGZvcm1hdCBvZiBmaWx0ZXJpbmcgcnVsZXMgaGVyZTpcbiAgICAgICAgICAgICAgICAgKiBodHRwOi8vZG9jcy5ja2VkaXRvci5jb20vIyEvZ3VpZGUvZGV2X2FsbG93ZWRfY29udGVudF9ydWxlc1xuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIC8vIFdoaXRlbGlzdCB0aGUgY29tcG9uZW50IHRhZ3Mgd2l0aCBhbnkgYXR0cmlidXRlcyBhbmQgY2xhc3Nlcy5cbiAgICAgICAgICAgICAgICB2YXIgY29tcG9uZW50UnVsZSA9IG5hbWVzLm1hcChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ29wcGlhLW5vbmludGVyYWN0aXZlLScgKyBuYW1lO1xuICAgICAgICAgICAgICAgIH0pLmpvaW4oJyAnKSArICcoKilbKl07JztcbiAgICAgICAgICAgICAgICAvLyBXaGl0ZWxpc3QgdGhlIGlubGluZSBjb21wb25lbnQgd3JhcHBlciwgd2hpY2ggaXMgYVxuICAgICAgICAgICAgICAgIC8vIHNwYW4gd2l0aCBhIFwidHlwZVwiIGF0dHJpYnV0ZS5cbiAgICAgICAgICAgICAgICB2YXIgaW5saW5lV3JhcHBlclJ1bGUgPSAnIHNwYW5bdHlwZV07JztcbiAgICAgICAgICAgICAgICAvLyBXaGl0ZWxpc3QgdGhlIGJsb2NrIGNvbXBvbmVudCB3cmFwcGVyLCB3aGljaCBpcyBhIGRpdlxuICAgICAgICAgICAgICAgIC8vIHdpdGggYSBcInR5cGVcIiBhdHRyaWJ1dGUgYW5kIGEgQ1NTIGNsYXNzLlxuICAgICAgICAgICAgICAgIHZhciBibG9ja1dyYXBwZXJSdWxlID0gJyBkaXYob3BwaWEtcnRlLWNvbXBvbmVudC1jb250YWluZXIpW3R5cGVdOyc7XG4gICAgICAgICAgICAgICAgLy8gV2hpdGVsaXN0IHRoZSB0cmFuc3BhcmVudCBibG9jayBjb21wb25lbnQgb3ZlcmxheSwgd2hpY2ggaXNcbiAgICAgICAgICAgICAgICAvLyBhIGRpdiB3aXRoIGEgQ1NTIGNsYXNzLlxuICAgICAgICAgICAgICAgIHZhciBibG9ja092ZXJsYXlSdWxlID0gJyBkaXYob3BwaWEtcnRlLWNvbXBvbmVudC1vdmVybGF5KTsnO1xuICAgICAgICAgICAgICAgIC8vIFB1dCBhbGwgdGhlIHJ1bGVzIHRvZ2V0aGVyLlxuICAgICAgICAgICAgICAgIHZhciBleHRyYUFsbG93ZWRDb250ZW50UnVsZXMgPSBjb21wb25lbnRSdWxlICtcbiAgICAgICAgICAgICAgICAgICAgaW5saW5lV3JhcHBlclJ1bGUgK1xuICAgICAgICAgICAgICAgICAgICBibG9ja1dyYXBwZXJSdWxlICtcbiAgICAgICAgICAgICAgICAgICAgYmxvY2tPdmVybGF5UnVsZTtcbiAgICAgICAgICAgICAgICB2YXIgcGx1Z2luTmFtZXMgPSBuYW1lcy5tYXAoZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdvcHBpYScgKyBuYW1lO1xuICAgICAgICAgICAgICAgIH0pLmpvaW4oJywnKTtcbiAgICAgICAgICAgICAgICB2YXIgYnV0dG9uTmFtZXMgPSBbXTtcbiAgICAgICAgICAgICAgICBuYW1lcy5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbk5hbWVzLnB1c2goJ09wcGlhJyArIG5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBidXR0b25OYW1lcy5wdXNoKCctJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnV0dG9uTmFtZXMucG9wKCk7XG4gICAgICAgICAgICAgICAgLy8gQWxsIGljb25zIG9uIHRoZSB0b29sYmFyIGV4Y2VwdCB0aGUgUmljaCBUZXh0IGNvbXBvbmVudHMuXG4gICAgICAgICAgICAgICAgdmFyIGFsbEljb25zID0gWyd1bmRvJywgJ3JlZG8nLCAnYm9sZCcsICdJdGFsaWMnLCAnbnVtYmVyZWRMaXN0JyxcbiAgICAgICAgICAgICAgICAgICAgJ2J1bGxldGVkTGlzdCcsICdwcmUnLCAnaW5kZW50JywgJ291dGRlbnQnXTtcbiAgICAgICAgICAgICAgICAvLyBBZGQgZXh0ZXJuYWwgcGx1Z2lucy5cbiAgICAgICAgICAgICAgICBDS0VESVRPUi5wbHVnaW5zLmFkZEV4dGVybmFsKCdzaGFyZWRzcGFjZScsICcvdGhpcmRfcGFydHkvc3RhdGljL2NrZWRpdG9yLXNoYXJlZHNwYWNlLTQuOS4yLycsICdwbHVnaW4uanMnKTtcbiAgICAgICAgICAgICAgICAvLyBQcmUgcGx1Z2luIGlzIG5vdCBhdmFpbGFibGUgZm9yIDQuOS4yIHZlcnNpb24gb2YgQ0tFZGl0b3IuIFRoaXMgaXNcbiAgICAgICAgICAgICAgICAvLyBhIHNlbGYgY3JlYXRlZCBwbHVnaW4gKG90aGVyIHBsdWdpbnMgYXJlIHByb3ZpZGVkIGJ5IENLRWRpdG9yKS5cbiAgICAgICAgICAgICAgICBDS0VESVRPUi5wbHVnaW5zLmFkZEV4dGVybmFsKCdwcmUnLCAnL2V4dGVuc2lvbnMvY2tlZGl0b3JfcGx1Z2lucy9wcmUvJywgJ3BsdWdpbi5qcycpO1xuICAgICAgICAgICAgICAgIHZhciBzdGFydHVwRm9jdXNFbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAoc2NvcGUudWlDb25maWcoKSAmJlxuICAgICAgICAgICAgICAgICAgICBzY29wZS51aUNvbmZpZygpLnN0YXJ0dXBGb2N1c0VuYWJsZWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBzdGFydHVwRm9jdXNFbmFibGVkID0gc2NvcGUudWlDb25maWcoKS5zdGFydHVwRm9jdXNFbmFibGVkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBJbml0aWFsaXplIENLRWRpdG9yLlxuICAgICAgICAgICAgICAgIHZhciBjayA9IENLRURJVE9SLmlubGluZSgoZWxbMF0uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMV0pLCB7XG4gICAgICAgICAgICAgICAgICAgIGV4dHJhUGx1Z2luczogJ3ByZSxzaGFyZWRzcGFjZSwnICsgcGx1Z2luTmFtZXMsXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0dXBGb2N1czogc3RhcnR1cEZvY3VzRW5hYmxlZCxcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlUGx1Z2luczogJ2luZGVudGJsb2NrJyxcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBmbG9hdFNwYWNlRG9ja2VkT2Zmc2V0WTogMTUsXG4gICAgICAgICAgICAgICAgICAgIGV4dHJhQWxsb3dlZENvbnRlbnQ6IGV4dHJhQWxsb3dlZENvbnRlbnRSdWxlcyxcbiAgICAgICAgICAgICAgICAgICAgc2hhcmVkU3BhY2VzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b3A6IGVsWzBdLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHNraW46ICdib290c3RyYXBjaywvdGhpcmRfcGFydHkvc3RhdGljL2NrZWRpdG9yLWJvb3RzdHJhcGNrLTEuMC8nLFxuICAgICAgICAgICAgICAgICAgICB0b29sYmFyOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2Jhc2ljc3R5bGVzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtczogWydCb2xkJywgJy0nLCAnSXRhbGljJ11cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3BhcmFncmFwaCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ051bWJlcmVkTGlzdCcsICctJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0J1bGxldGVkTGlzdCcsICctJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1ByZScsICctJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0Jsb2NrcXVvdGUnLCAnLScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdJbmRlbnQnLCAnLScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdPdXRkZW50J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3J0ZWNvbXBvbmVudHMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiBidXR0b25OYW1lc1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnZG9jdW1lbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiBbJ1NvdXJjZSddXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAvLyBBIFJlZ0V4cCBmb3IgbWF0Y2hpbmcgcmljaCB0ZXh0IGNvbXBvbmVudHMuXG4gICAgICAgICAgICAgICAgdmFyIGNvbXBvbmVudFJlID0gKC8oPChvcHBpYS1ub25pbnRlcmFjdGl2ZS0oLis/KSlcXGJbXj5dKj4pW1xcc1xcU10qPzxcXC9cXDI+L2cpO1xuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEJlZm9yZSBkYXRhIGlzIGxvYWRlZCBpbnRvIENLRWRpdG9yLCB3ZSBuZWVkIHRvIHdyYXAgZXZlcnkgcnRlXG4gICAgICAgICAgICAgICAgICogY29tcG9uZW50IGluIGEgc3BhbiAoaW5saW5lKSBvciBkaXYgKGJsb2NrKS5cbiAgICAgICAgICAgICAgICAgKiBGb3IgYmxvY2sgZWxlbWVudHMsIHdlIGFkZCBhbiBvdmVybGF5IGRpdiBhcyB3ZWxsLlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHZhciB3cmFwQ29tcG9uZW50cyA9IGZ1bmN0aW9uIChodG1sKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChodG1sID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBodG1sO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBodG1sLnJlcGxhY2UoY29tcG9uZW50UmUsIGZ1bmN0aW9uIChtYXRjaCwgcDEsIHAyLCBwMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFJ0ZUhlbHBlclNlcnZpY2UuaXNJbmxpbmVDb21wb25lbnQocDMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICc8c3BhbiB0eXBlPVwib3BwaWEtbm9uaW50ZXJhY3RpdmUtJyArIHAzICsgJ1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaCArICc8L3NwYW4+JztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnPGRpdiB0eXBlPVwib3BwaWEtbm9uaW50ZXJhY3RpdmUtJyArIHAzICsgJ1wiJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdjbGFzcz1cIm9wcGlhLXJ0ZS1jb21wb25lbnQtY29udGFpbmVyXCI+JyArIG1hdGNoICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2Pic7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgY2sub24oJ2luc3RhbmNlUmVhZHknLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgY3NzIGFuZCBpY29ucyBmb3IgZWFjaCB0b29sYmFyIGJ1dHRvbi5cbiAgICAgICAgICAgICAgICAgICAgbmFtZXMuZm9yRWFjaChmdW5jdGlvbiAobmFtZSwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpY29uID0gaWNvbnNbaW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHVwcGVyQ2FzZWROYW1lID0gbmFtZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIG5hbWUuc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcuY2tlX2J1dHRvbl9fb3BwaWEnICsgbmFtZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY3NzKCdiYWNrZ3JvdW5kLWltYWdlJywgJ3VybChcIi9leHRlbnNpb25zJyArIGljb24gKyAnXCIpJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY3NzKCdiYWNrZ3JvdW5kLXBvc2l0aW9uJywgJ2NlbnRlcicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNzcygnYmFja2dyb3VuZC1yZXBlYXQnLCAnbm8tcmVwZWF0JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY3NzKCdoZWlnaHQnLCAnMjRweCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNzcygnd2lkdGgnLCAnMjRweCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNzcygncGFkZGluZycsICcwcHggMHB4Jyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAkKCcuY2tlX3Rvb2xiYXJfc2VwYXJhdG9yJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jc3MoJ2hlaWdodCcsICcyMnB4Jyk7XG4gICAgICAgICAgICAgICAgICAgICQoJy5ja2VfYnV0dG9uX2ljb24nKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNzcygnaGVpZ2h0JywgJzI0cHgnKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNzcygnd2lkdGgnLCAnMjRweCcpO1xuICAgICAgICAgICAgICAgICAgICBjay5zZXREYXRhKHdyYXBDb21wb25lbnRzKG5nTW9kZWwuJHZpZXdWYWx1ZSkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIC8vIEFuZ3VsYXIgcmVuZGVyaW5nIG9mIGNvbXBvbmVudHMgY29uZnVzZXMgQ0tFZGl0b3IncyB1bmRvIHN5c3RlbSwgc29cbiAgICAgICAgICAgICAgICAvLyB3ZSBoaWRlIGFsbCBvZiB0aGF0IHN0dWZmIGF3YXkgZnJvbSBDS0VkaXRvci5cbiAgICAgICAgICAgICAgICBjay5vbignZ2V0U25hcHNob3QnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LmRhdGEgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LmRhdGEgPSBldmVudC5kYXRhLnJlcGxhY2UoY29tcG9uZW50UmUsIGZ1bmN0aW9uIChtYXRjaCwgcDEsIHAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcDEgKyAnPC8nICsgcDIgKyAnPic7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sIG51bGwsIG51bGwsIDIwKTtcbiAgICAgICAgICAgICAgICBjay5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZWx0ID0gJCgnPGRpdj4nICsgY2suZ2V0RGF0YSgpICsgJzwvZGl2PicpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdGV4dEVsdCA9IGVsdFswXS5jaGlsZE5vZGVzO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gdGV4dEVsdC5sZW5ndGg7IGkgPiAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSB0ZXh0RWx0W2kgLSAxXS5jaGlsZE5vZGVzLmxlbmd0aDsgaiA+IDA7IGotLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0ZXh0RWx0W2kgLSAxXS5jaGlsZE5vZGVzW2ogLSAxXS5ub2RlTmFtZSA9PT0gJ0JSJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAodGV4dEVsdFtpIC0gMV0uY2hpbGROb2Rlc1tqIC0gMV0ubm9kZU5hbWUgPT09ICcjdGV4dCcgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRFbHRbaSAtIDFdLmNoaWxkTm9kZXNbaiAtIDFdLm5vZGVWYWx1ZS50cmltKCkgPT09ICcnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0RWx0W2kgLSAxXS5jaGlsZE5vZGVzW2ogLSAxXS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0ZXh0RWx0W2kgLSAxXS5jaGlsZE5vZGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0ZXh0RWx0W2kgLSAxXS5ub2RlTmFtZSA9PT0gJ0JSJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAodGV4dEVsdFtpIC0gMV0ubm9kZU5hbWUgPT09ICcjdGV4dCcgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRFbHRbaSAtIDFdLm5vZGVWYWx1ZS50cmltKCkgPT09ICcnKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0RWx0W2kgLSAxXS5ub2RlTmFtZSA9PT0gJ1AnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRFbHRbaSAtIDFdLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBuZ01vZGVsLiRzZXRWaWV3VmFsdWUoZWx0Lmh0bWwoKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbmdNb2RlbC4kcmVuZGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjay5zZXREYXRhKG5nTW9kZWwuJHZpZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBDbGVhbiB1cCBDS0VkaXRvciBpbnN0YW5jZSB3aGVuIGRpcmVjdGl2ZSBpcyByZW1vdmVkLlxuICAgICAgICAgICAgICAgICAgICBjay5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvZGUgdG8gZHluYW1pY2FsbHkgZ2VuZXJhdGUgQ0tFZGl0b3Igd2lkZ2V0cyBmb3IgdGhlIHJpY2hcbiAqIHRleHQgY29tcG9uZW50cy5cbiAqL1xucmVxdWlyZSgncmljaF90ZXh0X2NvbXBvbmVudHMvcmljaFRleHRDb21wb25lbnRzUmVxdWlyZXMudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0h0bWxFc2NhcGVyU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvUnRlSGVscGVyU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykucnVuKFtcbiAgICAnJHRpbWVvdXQnLCAnJGNvbXBpbGUnLCAnJHJvb3RTY29wZScsICdSdGVIZWxwZXJTZXJ2aWNlJyxcbiAgICAnSHRtbEVzY2FwZXJTZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoJHRpbWVvdXQsICRjb21waWxlLCAkcm9vdFNjb3BlLCBSdGVIZWxwZXJTZXJ2aWNlLCBIdG1sRXNjYXBlclNlcnZpY2UpIHtcbiAgICAgICAgdmFyIF9SSUNIX1RFWFRfQ09NUE9ORU5UUyA9IFJ0ZUhlbHBlclNlcnZpY2UuZ2V0UmljaFRleHRDb21wb25lbnRzKCk7XG4gICAgICAgIF9SSUNIX1RFWFRfQ09NUE9ORU5UUy5mb3JFYWNoKGZ1bmN0aW9uIChjb21wb25lbnREZWZuKSB7XG4gICAgICAgICAgICAvLyBUaGUgbmFtZSBvZiB0aGUgQ0tFZGl0b3Igd2lkZ2V0IGNvcnJlc3BvbmRpbmcgdG8gdGhpcyBjb21wb25lbnQuXG4gICAgICAgICAgICB2YXIgY2tOYW1lID0gJ29wcGlhJyArIGNvbXBvbmVudERlZm4uaWQ7XG4gICAgICAgICAgICAvLyBDaGVjayB0byBlbnN1cmUgdGhhdCBhIHBsdWdpbiBpcyBub3QgcmVnaXN0ZXJlZCBtb3JlIHRoYW4gb25jZS5cbiAgICAgICAgICAgIGlmIChDS0VESVRPUi5wbHVnaW5zLnJlZ2lzdGVyZWRbY2tOYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHRhZ05hbWUgPSAnb3BwaWEtbm9uaW50ZXJhY3RpdmUtJyArIGNvbXBvbmVudERlZm4uaWQ7XG4gICAgICAgICAgICB2YXIgY3VzdG9taXphdGlvbkFyZ1NwZWNzID0gY29tcG9uZW50RGVmbi5jdXN0b21pemF0aW9uQXJnU3BlY3M7XG4gICAgICAgICAgICB2YXIgaXNJbmxpbmUgPSBSdGVIZWxwZXJTZXJ2aWNlLmlzSW5saW5lQ29tcG9uZW50KGNvbXBvbmVudERlZm4uaWQpO1xuICAgICAgICAgICAgLy8gSW5saW5lIGNvbXBvbmVudHMgd2lsbCBiZSB3cmFwcGVkIGluIGEgc3Bhbiwgd2hpbGUgYmxvY2sgY29tcG9uZW50c1xuICAgICAgICAgICAgLy8gd2lsbCBiZSB3cmFwcGVkIGluIGEgZGl2LlxuICAgICAgICAgICAgaWYgKGlzSW5saW5lKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbXBvbmVudFRlbXBsYXRlID0gJzxzcGFuIHR5cGU9XCInICsgdGFnTmFtZSArICdcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwnICsgdGFnTmFtZSArICc+PC8nICsgdGFnTmFtZSArICc+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L3NwYW4+JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBjb21wb25lbnRUZW1wbGF0ZSA9ICc8ZGl2IGNsYXNzPVwib3BwaWEtcnRlLWNvbXBvbmVudC1jb250YWluZXJcIiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ3R5cGU9XCInICsgdGFnTmFtZSArICdcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwnICsgdGFnTmFtZSArICc+PC8nICsgdGFnTmFtZSArICc+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29tcG9uZW50LW92ZXJsYXlcIj48L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2Pic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBDS0VESVRPUi5wbHVnaW5zLmFkZChja05hbWUsIHtcbiAgICAgICAgICAgICAgICBpbml0OiBmdW5jdGlvbiAoZWRpdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZSB0aGUgd2lkZ2V0IGl0c2VsZi5cbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLndpZGdldHMuYWRkKGNrTmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnV0dG9uOiBjb21wb25lbnREZWZuLnRvb2x0aXAsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmxpbmU6IGlzSW5saW5lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGU6IGNvbXBvbmVudFRlbXBsYXRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZHJhZ2dhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZmlyZSgnbG9ja1NuYXBzaG90Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb250VXBkYXRlOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2F2ZSB0aGlzIGZvciBjcmVhdGluZyB0aGUgd2lkZ2V0IGxhdGVyLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb250YWluZXIgPSB0aGlzLndyYXBwZXIuZ2V0UGFyZW50KHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3VzdG9taXphdGlvbkFyZ3MgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21pemF0aW9uQXJnU3BlY3MuZm9yRWFjaChmdW5jdGlvbiAoc3BlYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21pemF0aW9uQXJnc1tzcGVjLm5hbWVdID0gdGhhdC5kYXRhW3NwZWMubmFtZV0gfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwZWMuZGVmYXVsdF92YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSdGVIZWxwZXJTZXJ2aWNlLl9vcGVuQ3VzdG9taXphdGlvbk1vZGFsKGN1c3RvbWl6YXRpb25BcmdTcGVjcywgY3VzdG9taXphdGlvbkFyZ3MsIGZ1bmN0aW9uIChjdXN0b21pemF0aW9uQXJnc0RpY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgYXJnIGluIGN1c3RvbWl6YXRpb25BcmdzRGljdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1c3RvbWl6YXRpb25BcmdzRGljdC5oYXNPd25Qcm9wZXJ0eShhcmcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zZXREYXRhKGFyZywgY3VzdG9taXphdGlvbkFyZ3NEaWN0W2FyZ10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIFRoaXMgY2hlY2tzIHdoZXRoZXIgdGhlIHdpZGdldCBoYXMgYWxyZWFkeSBiZWVuIGluaXRlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIGFuZCBzZXQgdXAgYmVmb3JlIChpZiB3ZSBhcmUgZWRpdGluZyBhIHdpZGdldCB0aGF0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogaGFzIGFscmVhZHkgYmVlbiBpbnNlcnRlZCBpbnRvIHRoZSBSVEUsIHdlIGRvIG5vdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIG5lZWQgdG8gZmluYWxpemVDcmVhdGlvbiBhZ2FpbikuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhhdC5pc1JlYWR5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFjdHVhbGx5IGNyZWF0ZSB0aGUgd2lkZ2V0LCBpZiB3ZSBoYXZlIG5vdCBhbHJlYWR5LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLndpZGdldHMuZmluYWxpemVDcmVhdGlvbihjb250YWluZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBOZWVkIHRvIG1hbnVhbGx5ICRjb21waWxlIHNvIHRoZSBkaXJlY3RpdmUgcmVuZGVycy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogTm90ZSB0aGF0LmVsZW1lbnQuJCBpcyB0aGUgbmF0aXZlIERPTSBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogcmVwcmVzZW50ZWQgYnkgdGhhdC5lbGVtZW50LiBTZWU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIGh0dHA6Ly9kb2NzLmNrZWRpdG9yLmNvbS8jIS9hcGkvQ0tFRElUT1IuZG9tLmVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRjb21waWxlKCQodGhhdC5lbGVtZW50LiQpLmNvbnRlbnRzKCkpKCRyb290U2NvcGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAkdGltZW91dCBlbnN1cmVzIHdlIGRvIG5vdCB0YWtlIHRoZSB1bmRvIHNuYXBzaG90IHVudGlsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFmdGVyIGFuZ3VsYXIgZmluaXNoZXMgaXRzIGNoYW5nZXMgdG8gdGhlIGNvbXBvbmVudCB0YWdzLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3IgaW5saW5lIHdpZGdldHMsIHBsYWNlIHRoZSBjYXJldCBhZnRlciB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdpZGdldCBzbyB0aGUgdXNlciBjYW4gY29udGludWUgdHlwaW5nIGltbWVkaWF0ZWx5LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzSW5saW5lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJhbmdlID0gZWRpdG9yLmNyZWF0ZVJhbmdlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHdpZGdldENvbnRhaW5lciA9IHRoYXQuZWxlbWVudC5nZXRQYXJlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByYW5nZS5tb3ZlVG9Qb3NpdGlvbih3aWRnZXRDb250YWluZXIsIENLRURJVE9SLlBPU0lUSU9OX0FGVEVSX0VORCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmdldFNlbGVjdGlvbigpLnNlbGVjdFJhbmdlcyhbcmFuZ2VdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBbm90aGVyIHRpbWVvdXQgbmVlZGVkIHNvIHRoZSB1bmRvIHNuYXBzaG90IGlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm90IHRha2VuIHVudGlsIHRoZSBjYXJldCBpcyBpbiB0aGUgcmlnaHQgcGxhY2UuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZmlyZSgndW5sb2NrU25hcHNob3QnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmZpcmUoJ3NhdmVTbmFwc2hvdCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmZpcmUoJ3VubG9ja1NuYXBzaG90Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmZpcmUoJ3NhdmVTbmFwc2hvdCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoKSB7IH0sIGZ1bmN0aW9uICgpIHsgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBUaGlzIGlzIGhvdyB0aGUgd2lkZ2V0IHdpbGwgYmUgcmVwcmVzZW50ZWQgaW4gdGhlIG91dHB1dHMgc291cmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICogc28gaXQgaXMgY2FsbGVkIHdoZW4gd2UgY2FsbCBlZGl0b3IuZ2V0RGF0YSgpLlxuICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICBkb3duY2FzdDogZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDbGVhciB0aGUgYW5ndWxhciByZW5kZXJpbmcgY29udGVudCwgd2hpY2ggd2UgZG9uJ3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3YW50IGluIHRoZSBvdXRwdXQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jaGlsZHJlblswXS5zZXRIdG1sKCcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXR1cm4ganVzdCB0aGUgcmljaCB0ZXh0IGNvbXBvbmVudCwgd2l0aG91dCBpdHMgd3JhcHBlci5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWxlbWVudC5jaGlsZHJlblswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIFRoaXMgaXMgaG93IGEgd2lkZ2V0IGlzIHJlY29nbml6ZWQgYnkgQ0tFZGl0b3IsIGZvciBleGFtcGxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiB3aGVuIHdlIGZpcnN0IGxvYWQgZGF0YSBpbi4gUmV0dXJucyBhIGJvb2xlYW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiB0cnVlIGlmZiBcImVsZW1lbnRcIiBpcyBhbiBpbnN0YW5jZSBvZiB0aGlzIHdpZGdldC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdXBjYXN0OiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoZWxlbWVudC5uYW1lICE9PSAncCcgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jaGlsZHJlbi5sZW5ndGggPiAwICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuY2hpbGRyZW5bMF0ubmFtZSA9PT0gdGFnTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgYXR0cmlidXRlcyBvZiBjb21wb25lbnQgYWNjb3JkaW5nIHRvIGRhdGEgdmFsdWVzLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbWl6YXRpb25BcmdTcGVjcy5mb3JFYWNoKGZ1bmN0aW9uIChzcGVjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuZWxlbWVudC5nZXRDaGlsZCgwKS5zZXRBdHRyaWJ1dGUoc3BlYy5uYW1lICsgJy13aXRoLXZhbHVlJywgSHRtbEVzY2FwZXJTZXJ2aWNlLm9ialRvRXNjYXBlZEpzb24odGhhdC5kYXRhW3NwZWMubmFtZV0gfHwgJycpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmZpcmUoJ2xvY2tTbmFwc2hvdCcsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9udFVwZGF0ZTogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXNNaXNzaW5nQXR0cmlidXRlcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9uIGluaXQsIHJlYWQgdmFsdWVzIGZyb20gY29tcG9uZW50IGF0dHJpYnV0ZXMgYW5kIHNhdmUgdGhlbS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21pemF0aW9uQXJnU3BlY3MuZm9yRWFjaChmdW5jdGlvbiAoc3BlYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSB0aGF0LmVsZW1lbnQuZ2V0Q2hpbGQoMCkuZ2V0QXR0cmlidXRlKHNwZWMubmFtZSArICctd2l0aC12YWx1ZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2V0RGF0YShzcGVjLm5hbWUsIEh0bWxFc2NhcGVyU2VydmljZS5lc2NhcGVkSnNvblRvT2JqKHZhbHVlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc01pc3NpbmdBdHRyaWJ1dGVzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNNaXNzaW5nQXR0cmlidXRlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOZWVkIHRvIG1hbnVhbGx5ICRjb21waWxlIHNvIHRoZSBkaXJlY3RpdmUgcmVuZGVycy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGNvbXBpbGUoJCh0aGlzLmVsZW1lbnQuJCkuY29udGVudHMoKSkoJHJvb3RTY29wZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmZpcmUoJ3VubG9ja1NuYXBzaG90Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5maXJlKCdzYXZlU25hcHNob3QnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBDb25zdGFudHMgZm9yIG9iamVjdHMgZG9tYWluLlxuICovXG52YXIgT2JqZWN0c0RvbWFpbkNvbnN0YW50cyA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBPYmplY3RzRG9tYWluQ29uc3RhbnRzKCkge1xuICAgIH1cbiAgICBPYmplY3RzRG9tYWluQ29uc3RhbnRzLkZSQUNUSU9OX1BBUlNJTkdfRVJST1JTID0ge1xuICAgICAgICBJTlZBTElEX0NIQVJTOiAnUGxlYXNlIG9ubHkgdXNlIG51bWVyaWNhbCBkaWdpdHMsIHNwYWNlcyBvciBmb3J3YXJkIHNsYXNoZXMgKC8pJyxcbiAgICAgICAgSU5WQUxJRF9GT1JNQVQ6ICdQbGVhc2UgZW50ZXIgYSB2YWxpZCBmcmFjdGlvbiAoZS5nLiwgNS8zIG9yIDEgMi8zKScsXG4gICAgICAgIERJVklTSU9OX0JZX1pFUk86ICdQbGVhc2UgZG8gbm90IHB1dCAwIGluIHRoZSBkZW5vbWluYXRvcidcbiAgICB9O1xuICAgIE9iamVjdHNEb21haW5Db25zdGFudHMuTlVNQkVSX1dJVEhfVU5JVFNfUEFSU0lOR19FUlJPUlMgPSB7XG4gICAgICAgIElOVkFMSURfVkFMVUU6ICdQbGVhc2UgZW5zdXJlIHRoYXQgdmFsdWUgaXMgZWl0aGVyIGEgZnJhY3Rpb24gb3IgYSBudW1iZXInLFxuICAgICAgICBJTlZBTElEX0NVUlJFTkNZOiAnUGxlYXNlIGVudGVyIGEgdmFsaWQgY3VycmVuY3kgKGUuZy4sICQ1IG9yIFJzIDUpJyxcbiAgICAgICAgSU5WQUxJRF9DVVJSRU5DWV9GT1JNQVQ6ICdQbGVhc2Ugd3JpdGUgY3VycmVuY3kgdW5pdHMgYXQgdGhlIGJlZ2lubmluZycsXG4gICAgICAgIElOVkFMSURfVU5JVF9DSEFSUzogJ1BsZWFzZSBlbnN1cmUgdGhhdCB1bml0IG9ubHkgY29udGFpbnMgbnVtYmVycywgYWxwaGFiZXRzLCAoLCApLCAqLCBeLCAnICtcbiAgICAgICAgICAgICcvLCAtJ1xuICAgIH07XG4gICAgT2JqZWN0c0RvbWFpbkNvbnN0YW50cy5DVVJSRU5DWV9VTklUUyA9IHtcbiAgICAgICAgZG9sbGFyOiB7XG4gICAgICAgICAgICBuYW1lOiAnZG9sbGFyJyxcbiAgICAgICAgICAgIGFsaWFzZXM6IFsnJCcsICdkb2xsYXJzJywgJ0RvbGxhcnMnLCAnRG9sbGFyJywgJ1VTRCddLFxuICAgICAgICAgICAgZnJvbnRfdW5pdHM6IFsnJCddLFxuICAgICAgICAgICAgYmFzZV91bml0OiBudWxsXG4gICAgICAgIH0sXG4gICAgICAgIHJ1cGVlOiB7XG4gICAgICAgICAgICBuYW1lOiAncnVwZWUnLFxuICAgICAgICAgICAgYWxpYXNlczogWydScycsICdydXBlZXMnLCAn4oK5JywgJ1J1cGVlcycsICdSdXBlZSddLFxuICAgICAgICAgICAgZnJvbnRfdW5pdHM6IFsnUnMgJywgJ+KCuSddLFxuICAgICAgICAgICAgYmFzZV91bml0OiBudWxsXG4gICAgICAgIH0sXG4gICAgICAgIGNlbnQ6IHtcbiAgICAgICAgICAgIG5hbWU6ICdjZW50JyxcbiAgICAgICAgICAgIGFsaWFzZXM6IFsnY2VudHMnLCAnQ2VudHMnLCAnQ2VudCddLFxuICAgICAgICAgICAgZnJvbnRfdW5pdHM6IFtdLFxuICAgICAgICAgICAgYmFzZV91bml0OiAnMC4wMSBkb2xsYXInXG4gICAgICAgIH0sXG4gICAgICAgIHBhaXNlOiB7XG4gICAgICAgICAgICBuYW1lOiAncGFpc2UnLFxuICAgICAgICAgICAgYWxpYXNlczogWydwYWlzYScsICdQYWlzZScsICdQYWlzYSddLFxuICAgICAgICAgICAgZnJvbnRfdW5pdHM6IFtdLFxuICAgICAgICAgICAgYmFzZV91bml0OiAnMC4wMSBydXBlZSdcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIE9iamVjdHNEb21haW5Db25zdGFudHM7XG59KCkpO1xuZXhwb3J0cy5PYmplY3RzRG9tYWluQ29uc3RhbnRzID0gT2JqZWN0c0RvbWFpbkNvbnN0YW50cztcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTG9hZHMgc2NyaXB0cyBuZWVkZWQgZm9yIHVpLWNvZGVtaXJyb3IuXG4gKi9cbnZhciBDb2RlTWlycm9yID0gcmVxdWlyZSgnc3RhdGljL2NvZGUtbWlycm9yLTUuMTcuMC9saWIvY29kZW1pcnJvci5qcycpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KHdpbmRvdywgJ0NvZGVNaXJyb3InLCB7XG4gICAgdmFsdWU6IENvZGVNaXJyb3IsXG4gICAgd3JpdGFibGU6IGZhbHNlXG59KTtcbnJlcXVpcmUoJ3N0YXRpYy9jb2RlLW1pcnJvci01LjE3LjAvbW9kZS9qYXZhc2NyaXB0L2phdmFzY3JpcHQuanMnKTtcbnJlcXVpcmUoJ3N0YXRpYy9jb2RlLW1pcnJvci01LjE3LjAvbW9kZS9weXRob24vcHl0aG9uLmpzJyk7XG5yZXF1aXJlKCdzdGF0aWMvY29kZS1taXJyb3ItNS4xNy4wL21vZGUveWFtbC95YW1sLmpzJyk7XG5yZXF1aXJlKCdzdGF0aWMvdWktY29kZW1pcnJvci01ZDA0ZmEvc3JjL3VpLWNvZGVtaXJyb3IuanMnKTtcbnJlcXVpcmUoJ3N0YXRpYy9kaWZmLW1hdGNoLXBhdGNoLTEuMC4wL2RpZmZfbWF0Y2hfcGF0Y2guanMnKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uc3RhbnRzIGZvciBpbnRlcmFjdGlvbnMgZXh0ZW5zaW9ucy5cbiAqL1xudmFyIEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cygpIHtcbiAgICB9XG4gICAgLy8gTWluaW11bSBjb25maWRlbmNlIHJlcXVpcmVkIGZvciBhIHByZWRpY3RlZCBhbnN3ZXIgZ3JvdXAgdG8gYmUgc2hvd24gdG9cbiAgICAvLyB1c2VyLiBHZW5lcmFsbHkgYSB0aHJlc2hvbGQgb2YgMC43LTAuOCBpcyBhc3N1bWVkIHRvIGJlIGEgZ29vZCBvbmUgaW5cbiAgICAvLyBwcmFjdGljZSwgaG93ZXZlciB2YWx1ZSBuZWVkIG5vdCBiZSBpbiB0aG9zZSBib3VuZHMuXG4gICAgSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cy5DT0RFX1JFUExfUFJFRElDVElPTl9TRVJWSUNFX1RIUkVTSE9MRCA9IDAuNztcbiAgICBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzLkdSQVBIX0lOUFVUX0xFRlRfTUFSR0lOID0gMTIwO1xuICAgIC8vIEdpdmVzIHRoZSBzdGFmZi1saW5lcyBodW1hbiByZWFkYWJsZSB2YWx1ZXMuXG4gICAgSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cy5OT1RFX05BTUVTX1RPX01JRElfVkFMVUVTID0ge1xuICAgICAgICBBNTogODEsXG4gICAgICAgIEc1OiA3OSxcbiAgICAgICAgRjU6IDc3LFxuICAgICAgICBFNTogNzYsXG4gICAgICAgIEQ1OiA3NCxcbiAgICAgICAgQzU6IDcyLFxuICAgICAgICBCNDogNzEsXG4gICAgICAgIEE0OiA2OSxcbiAgICAgICAgRzQ6IDY3LFxuICAgICAgICBGNDogNjUsXG4gICAgICAgIEU0OiA2NCxcbiAgICAgICAgRDQ6IDYyLFxuICAgICAgICBDNDogNjBcbiAgICB9O1xuICAgIC8vIE1pbmltdW0gY29uZmlkZW5jZSByZXF1aXJlZCBmb3IgYSBwcmVkaWN0ZWQgYW5zd2VyIGdyb3VwIHRvIGJlIHNob3duIHRvXG4gICAgLy8gdXNlci4gR2VuZXJhbGx5IGEgdGhyZXNob2xkIG9mIDAuNy0wLjggaXMgYXNzdW1lZCB0byBiZSBhIGdvb2Qgb25lIGluXG4gICAgLy8gcHJhY3RpY2UsIGhvd2V2ZXIgdmFsdWUgbmVlZCBub3QgYmUgaW4gdGhvc2UgYm91bmRzLlxuICAgIEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMuVEVYVF9JTlBVVF9QUkVESUNUSU9OX1NFUlZJQ0VfVEhSRVNIT0xEID0gMC43O1xuICAgIHJldHVybiBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzO1xufSgpKTtcbmV4cG9ydHMuSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cyA9IEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHM7XG4iXSwic291cmNlUm9vdCI6IiJ9