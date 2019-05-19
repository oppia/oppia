/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	function webpackJsonpCallback(data) {
/******/ 		var chunkIds = data[0];
/******/ 		var moreModules = data[1];
/******/ 		var executeModules = data[2];
/******/
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, resolves = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(installedChunks[chunkId]) {
/******/ 				resolves.push(installedChunks[chunkId][0]);
/******/ 			}
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				modules[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(data);
/******/
/******/ 		while(resolves.length) {
/******/ 			resolves.shift()();
/******/ 		}
/******/
/******/ 		// add entry modules from loaded chunk to deferred list
/******/ 		deferredModules.push.apply(deferredModules, executeModules || []);
/******/
/******/ 		// run deferred modules when all chunks ready
/******/ 		return checkDeferredModules();
/******/ 	};
/******/ 	function checkDeferredModules() {
/******/ 		var result;
/******/ 		for(var i = 0; i < deferredModules.length; i++) {
/******/ 			var deferredModule = deferredModules[i];
/******/ 			var fulfilled = true;
/******/ 			for(var j = 1; j < deferredModule.length; j++) {
/******/ 				var depId = deferredModule[j];
/******/ 				if(installedChunks[depId] !== 0) fulfilled = false;
/******/ 			}
/******/ 			if(fulfilled) {
/******/ 				deferredModules.splice(i--, 1);
/******/ 				result = __webpack_require__(__webpack_require__.s = deferredModule[0]);
/******/ 			}
/******/ 		}
/******/ 		return result;
/******/ 	}
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 	// Promise = chunk loading, 0 = chunk loaded
/******/ 	var installedChunks = {
/******/ 		"story_editor": 0
/******/ 	};
/******/
/******/ 	var deferredModules = [];
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	var jsonpArray = window["webpackJsonp"] = window["webpackJsonp"] || [];
/******/ 	var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
/******/ 	jsonpArray.push = webpackJsonpCallback;
/******/ 	jsonpArray = jsonpArray.slice();
/******/ 	for(var i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i]);
/******/ 	var parentJsonpFunction = oldJsonpFunction;
/******/
/******/
/******/ 	// add entry module to deferred list
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/story-editor-page/story-editor-page.controller.ts","about~admin~app~collection_editor~collection_player~contact~creator_dashboard~donate~email_dashboard~c1e50cc0","admin~app~collection_editor~creator_dashboard~exploration_editor~exploration_player~skill_editor~sto~7c5e036a","admin~creator_dashboard~exploration_editor~exploration_player~moderator~skill_editor~story_editor~to~3f6ef738","creator_dashboard~exploration_editor~exploration_player~skill_editor~story_editor~topic_editor","collection_editor~skill_editor~story_editor~topic_editor"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./core/templates/dev/head/components/ck-editor-helpers/ck-editor-rte/ck-editor-rte.directive.ts":
/*!*******************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/ck-editor-helpers/ck-editor-rte/ck-editor-rte.directive.ts ***!
  \*******************************************************************************************************/
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
 * @fileoverview Modal and functionality for the create story button.
 */
__webpack_require__(/*! services/ContextService.ts */ "./core/templates/dev/head/services/ContextService.ts");
__webpack_require__(/*! services/RteHelperService.ts */ "./core/templates/dev/head/services/RteHelperService.ts");
angular.module('ckEditorRteModule').directive('ckEditorRte', [
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
                var canUseFs = ContextService.getPageContext() ===
                    PAGE_CONTEXT.EXPLORATION_EDITOR;
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

/***/ "./core/templates/dev/head/components/ck-editor-helpers/ck-editor-widgets/ck-editor-widgets.initializer.ts":
/*!*****************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/ck-editor-helpers/ck-editor-widgets/ck-editor-widgets.initializer.ts ***!
  \*****************************************************************************************************************/
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
__webpack_require__(/*! services/HtmlEscaperService.ts */ "./core/templates/dev/head/services/HtmlEscaperService.ts");
__webpack_require__(/*! services/RteHelperService.ts */ "./core/templates/dev/head/services/RteHelperService.ts");
angular.module('ckEditorWidgetsModule').run([
    '$timeout', '$compile', '$rootScope', '$uibModal', 'RteHelperService',
    'HtmlEscaperService',
    function ($timeout, $compile, $rootScope, $uibModal, RteHelperService, HtmlEscaperService) {
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

/***/ "./core/templates/dev/head/components/common-layout-directives/loading-dots/loading-dots.directive.ts":
/*!************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/loading-dots/loading-dots.directive.ts ***!
  \************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Directive for displaying animated loading dots.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('loadingDotsModule').directive('loadingDots', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/common-layout-directives/loading-dots/' +
                'loading-dots.directive.html'),
            controllerAs: '$ctrl',
            controller: [function () { }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/editor/undo_redo/QuestionUndoRedoService.ts":
/*!************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/editor/undo_redo/QuestionUndoRedoService.ts ***!
  \************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Service which maintains a stack of changes to a Question
 * domain object.
 */
oppia.factory('QuestionUndoRedoService', [
    'BaseUndoRedoService', function (BaseUndoRedoService) {
        var child = Object.create(BaseUndoRedoService);
        child.init();
        return child;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/story/EditableStoryBackendApiService.ts":
/*!********************************************************************************!*\
  !*** ./core/templates/dev/head/domain/story/EditableStoryBackendApiService.ts ***!
  \********************************************************************************/
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
 * @fileoverview Service to send changes to a story to the backend.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
oppia.constant('EDITABLE_STORY_DATA_URL_TEMPLATE', '/story_editor_handler/data/<topic_id>/<story_id>');
oppia.factory('EditableStoryBackendApiService', [
    '$http', '$q', 'UrlInterpolationService',
    'EDITABLE_STORY_DATA_URL_TEMPLATE',
    function ($http, $q, UrlInterpolationService, EDITABLE_STORY_DATA_URL_TEMPLATE) {
        var _fetchStory = function (topicId, storyId, successCallback, errorCallback) {
            var storyDataUrl = UrlInterpolationService.interpolateUrl(EDITABLE_STORY_DATA_URL_TEMPLATE, {
                topic_id: topicId,
                story_id: storyId
            });
            $http.get(storyDataUrl).then(function (response) {
                var story = angular.copy(response.data.story);
                var topicName = angular.copy(response.data.topic_name);
                if (successCallback) {
                    successCallback({
                        story: story,
                        topicName: topicName
                    });
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _updateStory = function (topicId, storyId, storyVersion, commitMessage, changeList, successCallback, errorCallback) {
            var editableStoryDataUrl = UrlInterpolationService.interpolateUrl(EDITABLE_STORY_DATA_URL_TEMPLATE, {
                topic_id: topicId,
                story_id: storyId
            });
            var putData = {
                version: storyVersion,
                commit_message: commitMessage,
                change_dicts: changeList
            };
            $http.put(editableStoryDataUrl, putData).then(function (response) {
                // The returned data is an updated story dict.
                var story = angular.copy(response.data.story);
                if (successCallback) {
                    successCallback(story);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _deleteStory = function (topicId, storyId, successCallback, errorCallback) {
            var storyDataUrl = UrlInterpolationService.interpolateUrl(EDITABLE_STORY_DATA_URL_TEMPLATE, {
                topic_id: topicId,
                story_id: storyId
            });
            $http['delete'](storyDataUrl).then(function (response) {
                if (successCallback) {
                    successCallback(response.status);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        return {
            fetchStory: function (topicId, storyId) {
                return $q(function (resolve, reject) {
                    _fetchStory(topicId, storyId, resolve, reject);
                });
            },
            /**
             * Updates a story in the backend with the provided story ID.
             * The changes only apply to the story of the given version and the
             * request to update the story will fail if the provided story
             * version is older than the current version stored in the backend. Both
             * the changes and the message to associate with those changes are used
             * to commit a change to the story. The new story is passed to
             * the success callback, if one is provided to the returned promise
             * object. Errors are passed to the error callback, if one is provided.
             */
            updateStory: function (topicId, storyId, storyVersion, commitMessage, changeList) {
                return $q(function (resolve, reject) {
                    _updateStory(topicId, storyId, storyVersion, commitMessage, changeList, resolve, reject);
                });
            },
            deleteStory: function (topicId, storyId) {
                return $q(function (resolve, reject) {
                    _deleteStory(topicId, storyId, resolve, reject);
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/story/StoryContentsObjectFactory.ts":
/*!****************************************************************************!*\
  !*** ./core/templates/dev/head/domain/story/StoryContentsObjectFactory.ts ***!
  \****************************************************************************/
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
 * @fileoverview Factory for creating and mutating instances of frontend
 * story contents domain objects.
 */
__webpack_require__(/*! domain/story/StoryNodeObjectFactory.ts */ "./core/templates/dev/head/domain/story/StoryNodeObjectFactory.ts");
__webpack_require__(/*! pages/story-editor-page/story-editor-page.controller.ts */ "./core/templates/dev/head/pages/story-editor-page/story-editor-page.controller.ts");
oppia.factory('StoryContentsObjectFactory', [
    'StoryNodeObjectFactory', 'NODE_ID_PREFIX',
    function (StoryNodeObjectFactory, NODE_ID_PREFIX) {
        var _disconnectedNodeIds = [];
        var StoryContents = function (initialNodeId, nodes, nextNodeId) {
            this._initialNodeId = initialNodeId;
            this._nodes = nodes;
            this._nextNodeId = nextNodeId;
        };
        var getIncrementedNodeId = function (nodeId) {
            var index = parseInt(nodeId.replace(NODE_ID_PREFIX, ''));
            ++index;
            return NODE_ID_PREFIX + index;
        };
        // Instance methods
        StoryContents.prototype.getInitialNodeId = function () {
            return this._initialNodeId;
        };
        StoryContents.prototype.getDisconnectedNodeIds = function () {
            return _disconnectedNodeIds;
        };
        StoryContents.prototype.getNextNodeId = function () {
            return this._nextNodeId;
        };
        StoryContents.prototype.getNodes = function () {
            return this._nodes;
        };
        StoryContents.prototype.getNodeIdCorrespondingToTitle = function (title) {
            var nodes = this._nodes;
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].getTitle() === title) {
                    return nodes[i].getId();
                }
            }
            return null;
        };
        StoryContents.prototype.getNodeIdsToTitleMap = function (nodeIds) {
            var nodes = this._nodes;
            var nodeTitles = {};
            for (var i = 0; i < nodes.length; i++) {
                if (nodeIds.indexOf(nodes[i].getId()) !== -1) {
                    nodeTitles[nodes[i].getId()] = nodes[i].getTitle();
                }
            }
            if (Object.keys(nodeTitles).length !== nodeIds.length) {
                for (var i = 0; i < nodeIds.length; i++) {
                    if (!nodeTitles.hasOwnProperty(nodeIds[i])) {
                        throw Error('The node with id ' + nodeIds[i] + ' is invalid');
                    }
                }
            }
            return nodeTitles;
        };
        StoryContents.prototype.getNodeIds = function () {
            return this._nodes.map(function (node) {
                return node.getId();
            });
        };
        StoryContents.prototype.validate = function () {
            _disconnectedNodeIds = [];
            var issues = [];
            var nodes = this._nodes;
            for (var i = 0; i < nodes.length; i++) {
                var nodeIssues = nodes[i].validate();
                issues = issues.concat(nodeIssues);
            }
            if (issues.length > 0) {
                return issues;
            }
            // Provided the nodes list is valid and each node in it is valid, the
            // preliminary checks are done to see if the story node graph obtained is
            // valid.
            var nodeIds = nodes.map(function (node) {
                return node.getId();
            });
            var nodeTitles = nodes.map(function (node) {
                return node.getTitle();
            });
            for (var i = 0; i < nodeIds.length; i++) {
                var nodeId = nodeIds[i];
                if (nodeIds.indexOf(nodeId) < nodeIds.lastIndexOf(nodeId)) {
                    throw Error('The node with id ' + nodeId + ' is duplicated in the story');
                }
            }
            var nextNodeIdNumber = parseInt(this._nextNodeId.replace(NODE_ID_PREFIX, ''));
            var initialNodeIsPresent = false;
            for (var i = 0; i < nodes.length; i++) {
                var nodeIdNumber = parseInt(nodes[i].getId().replace(NODE_ID_PREFIX, ''));
                if (nodes[i].getId() === this._initialNodeId) {
                    initialNodeIsPresent = true;
                }
                if (nodeIdNumber > nextNodeIdNumber) {
                    throw Error('Node id out of bounds for node with id ' + nodes[i].getId());
                }
                for (var j = 0; j < nodes[i].getDestinationNodeIds().length; j++) {
                    if (nodeIds.indexOf(nodes[i].getDestinationNodeIds()[j]) === -1) {
                        issues.push('The node with id ' + nodes[i].getDestinationNodeIds()[j] +
                            ' doesn\'t exist');
                    }
                }
            }
            if (nodes.length > 0) {
                if (!initialNodeIsPresent) {
                    throw Error('Initial node - ' + this._initialNodeId +
                        ' - is not present in the story');
                }
                // All the validations above should be successfully completed before
                // going to validating the story node graph.
                if (issues.length > 0) {
                    return issues;
                }
                // nodesQueue stores the pending nodes to visit in a queue form.
                var nodesQueue = [];
                var nodeIsVisited = new Array(nodeIds.length).fill(false);
                var startingNode = nodes[this.getNodeIndex(this._initialNodeId)];
                nodesQueue.push(startingNode.getId());
                // The user is assumed to have all the prerequisite skills of the
                // starting node before starting the story. Also, this list models the
                // skill IDs acquired by a learner as they progress through the story.
                var simulatedSkillIds = new Set(startingNode.getPrerequisiteSkillIds());
                // The following loop employs a Breadth First Search from the given
                // starting node and makes sure that the user has acquired all the
                // prerequisite skills required by the destination nodes 'unlocked' by
                // visiting a particular node by the time that node is finished.
                while (nodesQueue.length > 0) {
                    var currentNodeIndex = this.getNodeIndex(nodesQueue.shift());
                    nodeIsVisited[currentNodeIndex] = true;
                    var currentNode = nodes[currentNodeIndex];
                    startingNode.getAcquiredSkillIds().forEach(function (skillId) {
                        simulatedSkillIds.add(skillId);
                    });
                    for (var i = 0; i < currentNode.getDestinationNodeIds().length; i++) {
                        var nodeId = currentNode.getDestinationNodeIds()[i];
                        var nodeIndex = this.getNodeIndex(nodeId);
                        // The following condition checks whether the destination node
                        // for a particular node, has already been visited, in which case
                        // the story would have loops, which are not allowed.
                        if (nodeIsVisited[nodeIndex]) {
                            issues.push('Loops are not allowed in the node graph');
                            // If a loop is encountered, then all further checks are halted,
                            // since it can lead to same error being reported again.
                            return issues;
                        }
                        var destinationNode = nodes[nodeIndex];
                        destinationNode.getPrerequisiteSkillIds().forEach(function (skillId) {
                            if (!simulatedSkillIds.has(skillId)) {
                                issues.push('The prerequisite skill with id ' + skillId +
                                    ' was not completed before node with id ' + nodeId +
                                    ' was unlocked');
                            }
                        });
                        nodesQueue.push(nodeId);
                    }
                }
                for (var i = 0; i < nodeIsVisited.length; i++) {
                    if (!nodeIsVisited[i]) {
                        _disconnectedNodeIds.push(nodeIds[i]);
                        issues.push('There is no way to get to the chapter with title ' +
                            nodeTitles[i] + ' from any other chapter');
                    }
                }
            }
            return issues;
        };
        StoryContents.prototype.setInitialNodeId = function (nodeId) {
            if (this.getNodeIndex(nodeId) === -1) {
                throw Error('The node with given id doesn\'t exist');
            }
            return this._initialNodeId = nodeId;
        };
        StoryContents.prototype.addNode = function (title) {
            this._nodes.push(StoryNodeObjectFactory.createFromIdAndTitle(this._nextNodeId, title));
            if (this._initialNodeId === null) {
                this._initialNodeId = this._nextNodeId;
            }
            this._nextNodeId = getIncrementedNodeId(this._nextNodeId);
        };
        StoryContents.prototype.getNodeIndex = function (nodeId) {
            for (var i = 0; i < this._nodes.length; i++) {
                if (this._nodes[i].getId() === nodeId) {
                    return i;
                }
            }
            return -1;
        };
        StoryContents.prototype.deleteNode = function (nodeId) {
            if (this.getNodeIndex(nodeId) === -1) {
                throw Error('The node does not exist');
            }
            if (nodeId === this._initialNodeId) {
                if (this._nodes.length === 1) {
                    this._initialNodeId = null;
                }
                else {
                    throw Error('Cannot delete initial story node');
                }
            }
            for (var i = 0; i < this._nodes.length; i++) {
                if (this._nodes[i].getDestinationNodeIds().indexOf(nodeId) !== -1) {
                    this._nodes[i].removeDestinationNodeId(nodeId);
                }
            }
            this._nodes.splice(this.getNodeIndex(nodeId), 1);
        };
        StoryContents.prototype.setNodeOutline = function (nodeId, outline) {
            var index = this.getNodeIndex(nodeId);
            if (index === -1) {
                throw Error('The node with given id doesn\'t exist');
            }
            this._nodes[index].setOutline(outline);
        };
        StoryContents.prototype.setNodeTitle = function (nodeId, title) {
            var index = this.getNodeIndex(nodeId);
            if (index === -1) {
                throw Error('The node with given id doesn\'t exist');
            }
            this._nodes[index].setTitle(title);
        };
        StoryContents.prototype.setNodeExplorationId = function (nodeId, explorationId) {
            var index = this.getNodeIndex(nodeId);
            if (index === -1) {
                throw Error('The node with given id doesn\'t exist');
            }
            else if (explorationId !== null || explorationId !== '') {
                for (var i = 0; i < this._nodes.length; i++) {
                    if ((this._nodes[i].getExplorationId() === explorationId) && (i !== index)) {
                        throw Error('The given exploration already exists in the story.');
                    }
                }
                this._nodes[index].setExplorationId(explorationId);
            }
        };
        StoryContents.prototype.markNodeOutlineAsFinalized = function (nodeId) {
            var index = this.getNodeIndex(nodeId);
            if (index === -1) {
                throw Error('The node with given id doesn\'t exist');
            }
            this._nodes[index].markOutlineAsFinalized();
        };
        StoryContents.prototype.markNodeOutlineAsNotFinalized = function (nodeId) {
            var index = this.getNodeIndex(nodeId);
            if (index === -1) {
                throw Error('The node with given id doesn\'t exist');
            }
            this._nodes[index].markOutlineAsNotFinalized();
        };
        StoryContents.prototype.addPrerequisiteSkillIdToNode = function (nodeId, skillId) {
            var index = this.getNodeIndex(nodeId);
            if (index === -1) {
                throw Error('The node with given id doesn\'t exist');
            }
            this._nodes[index].addPrerequisiteSkillId(skillId);
        };
        StoryContents.prototype.removePrerequisiteSkillIdFromNode = function (nodeId, skillId) {
            var index = this.getNodeIndex(nodeId);
            if (index === -1) {
                throw Error('The node with given id doesn\'t exist');
            }
            this._nodes[index].removePrerequisiteSkillId(skillId);
        };
        StoryContents.prototype.addAcquiredSkillIdToNode = function (nodeId, skillId) {
            var index = this.getNodeIndex(nodeId);
            if (index === -1) {
                throw Error('The node with given id doesn\'t exist');
            }
            this._nodes[index].addAcquiredSkillId(skillId);
        };
        StoryContents.prototype.removeAcquiredSkillIdFromNode = function (nodeId, skillId) {
            var index = this.getNodeIndex(nodeId);
            if (index === -1) {
                throw Error('The node with given id doesn\'t exist');
            }
            this._nodes[index].removeAcquiredSkillId(skillId);
        };
        StoryContents.prototype.addDestinationNodeIdToNode = function (nodeId, destinationNodeId) {
            var index = this.getNodeIndex(nodeId);
            if (index === -1) {
                throw Error('The node with given id doesn\'t exist');
            }
            if (this.getNodeIndex(destinationNodeId) === -1) {
                throw Error('The destination node with given id doesn\'t exist');
            }
            this._nodes[index].addDestinationNodeId(destinationNodeId);
        };
        StoryContents.prototype.removeDestinationNodeIdFromNode = function (nodeId, destinationNodeId) {
            var index = this.getNodeIndex(nodeId);
            if (index === -1) {
                throw Error('The node with given id doesn\'t exist');
            }
            this._nodes[index].removeDestinationNodeId(destinationNodeId);
        };
        // Static class methods. Note that "this" is not available in static
        // contexts. This function takes a JSON object which represents a backend
        // story python dict.
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        StoryContents['createFromBackendDict'] = function (
        /* eslint-enable dot-notation */
        storyContentsBackendObject) {
            var nodes = [];
            for (var i = 0; i < storyContentsBackendObject.nodes.length; i++) {
                nodes.push(StoryNodeObjectFactory.createFromBackendDict(storyContentsBackendObject.nodes[i]));
            }
            return new StoryContents(storyContentsBackendObject.initial_node_id, nodes, storyContentsBackendObject.next_node_id);
        };
        return StoryContents;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/story/StoryNodeObjectFactory.ts":
/*!************************************************************************!*\
  !*** ./core/templates/dev/head/domain/story/StoryNodeObjectFactory.ts ***!
  \************************************************************************/
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
 * @fileoverview Factory for creating and mutating instances of frontend
 * story node domain objects.
 */
__webpack_require__(/*! pages/story-editor-page/story-editor-page.controller.ts */ "./core/templates/dev/head/pages/story-editor-page/story-editor-page.controller.ts");
oppia.factory('StoryNodeObjectFactory', ['NODE_ID_PREFIX',
    function (NODE_ID_PREFIX) {
        var StoryNode = function (id, title, destinationNodeIds, prerequisiteSkillIds, acquiredSkillIds, outline, outlineIsFinalized, explorationId) {
            this._id = id;
            this._title = title;
            this._destinationNodeIds = destinationNodeIds;
            this._prerequisiteSkillIds = prerequisiteSkillIds;
            this._acquiredSkillIds = acquiredSkillIds;
            this._outline = outline;
            this._outlineIsFinalized = outlineIsFinalized;
            this._explorationId = explorationId;
        };
        var _checkValidNodeId = function (nodeId) {
            if (typeof nodeId !== 'string') {
                return false;
            }
            var nodeIdPattern = new RegExp(NODE_ID_PREFIX + '[0-9]+', 'g');
            if (!nodeId.match(nodeIdPattern)) {
                return false;
            }
            return true;
        };
        // Instance methods
        StoryNode.prototype.getId = function () {
            return this._id;
        };
        StoryNode.prototype.getTitle = function () {
            return this._title;
        };
        StoryNode.prototype.getExplorationId = function () {
            return this._explorationId;
        };
        StoryNode.prototype.setExplorationId = function (explorationId) {
            this._explorationId = explorationId;
        };
        StoryNode.prototype.getOutline = function () {
            return this._outline;
        };
        StoryNode.prototype.setOutline = function (outline) {
            this._outline = outline;
        };
        StoryNode.prototype.setTitle = function (title) {
            this._title = title;
        };
        StoryNode.prototype.getOutlineStatus = function () {
            return this._outlineIsFinalized;
        };
        StoryNode.prototype.markOutlineAsFinalized = function () {
            this._outlineIsFinalized = true;
        };
        StoryNode.prototype.markOutlineAsNotFinalized = function () {
            this._outlineIsFinalized = false;
        };
        StoryNode.prototype.validate = function () {
            var issues = [];
            if (!_checkValidNodeId(this._id)) {
                throw Error('The node id ' + this._id + ' is invalid.');
            }
            var prerequisiteSkillIds = this._prerequisiteSkillIds;
            var acquiredSkillIds = this._acquiredSkillIds;
            var destinationNodeIds = this._destinationNodeIds;
            for (var i = 0; i < prerequisiteSkillIds.length; i++) {
                var skillId = prerequisiteSkillIds[i];
                if (prerequisiteSkillIds.indexOf(skillId) <
                    prerequisiteSkillIds.lastIndexOf(skillId)) {
                    issues.push('The prerequisite skill with id ' + skillId + ' is duplicated in' +
                        ' node with id ' + this._id);
                }
            }
            for (var i = 0; i < acquiredSkillIds.length; i++) {
                var skillId = acquiredSkillIds[i];
                if (acquiredSkillIds.indexOf(skillId) <
                    acquiredSkillIds.lastIndexOf(skillId)) {
                    issues.push('The acquired skill with id ' + skillId + ' is duplicated in' +
                        ' node with id ' + this._id);
                }
            }
            for (var i = 0; i < prerequisiteSkillIds.length; i++) {
                if (acquiredSkillIds.indexOf(prerequisiteSkillIds[i]) !== -1) {
                    issues.push('The skill with id ' + prerequisiteSkillIds[i] + ' is common ' +
                        'to both the acquired and prerequisite skill id list in node with' +
                        ' id ' + this._id);
                }
            }
            for (var i = 0; i < destinationNodeIds.length; i++) {
                if (!_checkValidNodeId(destinationNodeIds[i])) {
                    throw Error('The destination node id ' + destinationNodeIds[i] + ' is ' +
                        'invalid in node with id ' + this._id);
                }
            }
            var currentNodeId = this._id;
            if (destinationNodeIds.some(function (nodeId) {
                return nodeId === currentNodeId;
            })) {
                issues.push('The destination node id of node with id ' + this._id +
                    ' points to itself.');
            }
            for (var i = 0; i < destinationNodeIds.length; i++) {
                var nodeId = destinationNodeIds[i];
                if (destinationNodeIds.indexOf(nodeId) <
                    destinationNodeIds.lastIndexOf(nodeId)) {
                    issues.push('The destination node with id ' + nodeId + ' is duplicated in' +
                        ' node with id ' + this._id);
                }
            }
            return issues;
        };
        StoryNode.prototype.getDestinationNodeIds = function () {
            return this._destinationNodeIds.slice();
        };
        StoryNode.prototype.addDestinationNodeId = function (destinationNodeid) {
            if (this._destinationNodeIds.indexOf(destinationNodeid) !== -1) {
                throw Error('The given node is already a destination node.');
            }
            this._destinationNodeIds.push(destinationNodeid);
        };
        StoryNode.prototype.removeDestinationNodeId = function (destinationNodeid) {
            var index = this._destinationNodeIds.indexOf(destinationNodeid);
            if (index === -1) {
                throw Error('The given node is not a destination node.');
            }
            this._destinationNodeIds.splice(index, 1);
        };
        StoryNode.prototype.getAcquiredSkillIds = function () {
            return this._acquiredSkillIds.slice();
        };
        StoryNode.prototype.addAcquiredSkillId = function (acquiredSkillid) {
            if (this._acquiredSkillIds.indexOf(acquiredSkillid) !== -1) {
                throw Error('The given skill is already an acquired skill.');
            }
            this._acquiredSkillIds.push(acquiredSkillid);
        };
        StoryNode.prototype.removeAcquiredSkillId = function (skillId) {
            var index = this._acquiredSkillIds.indexOf(skillId);
            if (index === -1) {
                throw Error('The given skill is not an acquired skill.');
            }
            this._acquiredSkillIds.splice(index, 1);
        };
        StoryNode.prototype.getPrerequisiteSkillIds = function () {
            return this._prerequisiteSkillIds.slice();
        };
        StoryNode.prototype.addPrerequisiteSkillId = function (skillId) {
            if (this._prerequisiteSkillIds.indexOf(skillId) !== -1) {
                throw Error('The given skill id is already a prerequisite skill.');
            }
            this._prerequisiteSkillIds.push(skillId);
        };
        StoryNode.prototype.removePrerequisiteSkillId = function (skillId) {
            var index = this._prerequisiteSkillIds.indexOf(skillId);
            if (index === -1) {
                throw Error('The given skill id is not a prerequisite skill.');
            }
            this._prerequisiteSkillIds.splice(index, 1);
        };
        // Static class methods. Note that "this" is not available in static
        // contexts. This function takes a JSON object which represents a backend
        // story python dict.
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        StoryNode['createFromBackendDict'] = function (storyNodeBackendObject) {
            /* eslint-enable dot-notation */
            return new StoryNode(storyNodeBackendObject.id, storyNodeBackendObject.title, storyNodeBackendObject.destination_node_ids, storyNodeBackendObject.prerequisite_skill_ids, storyNodeBackendObject.acquired_skill_ids, storyNodeBackendObject.outline, storyNodeBackendObject.outline_is_finalized, storyNodeBackendObject.exploration_id);
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        StoryNode['createFromIdAndTitle'] = function (nodeId, title) {
            /* eslint-enable dot-notation */
            return new StoryNode(nodeId, title, [], [], [], '', false, null);
        };
        return StoryNode;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/story/StoryObjectFactory.ts":
/*!********************************************************************!*\
  !*** ./core/templates/dev/head/domain/story/StoryObjectFactory.ts ***!
  \********************************************************************/
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
 * @fileoverview Factory for creating and mutating instances of frontend
 * story domain objects.
 */
__webpack_require__(/*! domain/story/StoryContentsObjectFactory.ts */ "./core/templates/dev/head/domain/story/StoryContentsObjectFactory.ts");
oppia.factory('StoryObjectFactory', ['StoryContentsObjectFactory',
    function (StoryContentsObjectFactory) {
        var Story = function (id, title, description, notes, storyContents, languageCode, version) {
            this._id = id;
            this._title = title;
            this._description = description;
            this._notes = notes;
            this._storyContents = storyContents;
            this._languageCode = languageCode;
            this._version = version;
        };
        // Instance methods
        Story.prototype.getId = function () {
            return this._id;
        };
        Story.prototype.getTitle = function () {
            return this._title;
        };
        Story.prototype.setTitle = function (title) {
            this._title = title;
        };
        Story.prototype.getDescription = function () {
            return this._description;
        };
        Story.prototype.setDescription = function (description) {
            this._description = description;
        };
        Story.prototype.getNotes = function () {
            return this._notes;
        };
        Story.prototype.setNotes = function (notes) {
            this._notes = notes;
        };
        Story.prototype.getLanguageCode = function () {
            return this._languageCode;
        };
        Story.prototype.setLanguageCode = function (languageCode) {
            this._languageCode = languageCode;
        };
        Story.prototype.getVersion = function () {
            return this._version;
        };
        Story.prototype.getStoryContents = function () {
            return this._storyContents;
        };
        Story.prototype.validate = function () {
            var issues = [];
            if (this._title === '') {
                issues.push('Story title should not be empty');
            }
            issues = issues.concat(this._storyContents.validate());
            return issues;
        };
        // Reassigns all values within this story to match the existing
        // story. This is performed as a deep copy such that none of the
        // internal, bindable objects are changed within this story.
        Story.prototype.copyFromStory = function (otherStory) {
            this._id = otherStory.getId();
            this.setTitle(otherStory.getTitle());
            this.setDescription(otherStory.getDescription());
            this.setNotes(otherStory.getNotes());
            this.setLanguageCode(otherStory.getLanguageCode());
            this._version = otherStory.getVersion();
            this._storyContents = otherStory.getStoryContents();
        };
        // Static class methods. Note that "this" is not available in static
        // contexts. This function takes a JSON object which represents a backend
        // story python dict.
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Story['createFromBackendDict'] = function (storyBackendDict) {
            /* eslint-enable dot-notation */
            return new Story(storyBackendDict.id, storyBackendDict.title, storyBackendDict.description, storyBackendDict.notes, StoryContentsObjectFactory.createFromBackendDict(storyBackendDict.story_contents), storyBackendDict.language_code, storyBackendDict.version);
        };
        // Create an interstitial story that would be displayed in the editor until
        // the actual story is fetched from the backend.
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Story['createInterstitialStory'] = function () {
            /* eslint-enable dot-notation */
            return new Story(null, 'Story title loading', 'Story description loading', 'Story notes loading', null, 'en', 1);
        };
        return Story;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/story/StoryUpdateService.ts":
/*!********************************************************************!*\
  !*** ./core/templates/dev/head/domain/story/StoryUpdateService.ts ***!
  \********************************************************************/
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
 * @fileoverview Service to build changes to a story. These changes may
 * then be used by other services, such as a backend API service to update the
 * story in the backend. This service also registers all changes with the
 * undo/redo service.
 */
__webpack_require__(/*! domain/editor/undo_redo/ChangeObjectFactory.ts */ "./core/templates/dev/head/domain/editor/undo_redo/ChangeObjectFactory.ts");
__webpack_require__(/*! domain/editor/undo_redo/UndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts");
// These should match the constants defined in core.domain.story_domain.
oppia.constant('CMD_ADD_STORY_NODE', 'add_story_node');
oppia.constant('CMD_DELETE_STORY_NODE', 'delete_story_node');
oppia.constant('CMD_UPDATE_STORY_NODE_OUTLINE_STATUS', 'update_story_node_outline_status');
oppia.constant('CMD_UPDATE_STORY_PROPERTY', 'update_story_property');
oppia.constant('CMD_UPDATE_STORY_NODE_PROPERTY', 'update_story_node_property');
oppia.constant('CMD_UPDATE_STORY_CONTENTS_PROPERTY', 'update_story_contents_property');
oppia.constant('STORY_PROPERTY_TITLE', 'title');
oppia.constant('STORY_PROPERTY_DESCRIPTION', 'description');
oppia.constant('STORY_PROPERTY_NOTES', 'notes');
oppia.constant('STORY_PROPERTY_LANGUAGE_CODE', 'language_code');
oppia.constant('INITIAL_NODE_ID', 'initial_node_id');
oppia.constant('STORY_NODE_PROPERTY_TITLE', 'title');
oppia.constant('STORY_NODE_PROPERTY_OUTLINE', 'outline');
oppia.constant('STORY_NODE_PROPERTY_EXPLORATION_ID', 'exploration_id');
oppia.constant('STORY_NODE_PROPERTY_DESTINATION_NODE_IDS', 'destination_node_ids');
oppia.constant('STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS', 'acquired_skill_ids');
oppia.constant('STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS', 'prerequisite_skill_ids');
oppia.factory('StoryUpdateService', [
    'ChangeObjectFactory', 'UndoRedoService',
    'CMD_ADD_STORY_NODE', 'CMD_DELETE_STORY_NODE',
    'CMD_UPDATE_STORY_CONTENTS_PROPERTY', 'CMD_UPDATE_STORY_NODE_OUTLINE_STATUS',
    'CMD_UPDATE_STORY_NODE_PROPERTY', 'CMD_UPDATE_STORY_PROPERTY',
    'INITIAL_NODE_ID', 'STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS',
    'STORY_NODE_PROPERTY_DESTINATION_NODE_IDS',
    'STORY_NODE_PROPERTY_EXPLORATION_ID',
    'STORY_NODE_PROPERTY_OUTLINE', 'STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS',
    'STORY_NODE_PROPERTY_TITLE', 'STORY_PROPERTY_DESCRIPTION',
    'STORY_PROPERTY_LANGUAGE_CODE', 'STORY_PROPERTY_NOTES',
    'STORY_PROPERTY_TITLE', function (ChangeObjectFactory, UndoRedoService, CMD_ADD_STORY_NODE, CMD_DELETE_STORY_NODE, CMD_UPDATE_STORY_CONTENTS_PROPERTY, CMD_UPDATE_STORY_NODE_OUTLINE_STATUS, CMD_UPDATE_STORY_NODE_PROPERTY, CMD_UPDATE_STORY_PROPERTY, INITIAL_NODE_ID, STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS, STORY_NODE_PROPERTY_DESTINATION_NODE_IDS, STORY_NODE_PROPERTY_EXPLORATION_ID, STORY_NODE_PROPERTY_OUTLINE, STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS, STORY_NODE_PROPERTY_TITLE, STORY_PROPERTY_DESCRIPTION, STORY_PROPERTY_LANGUAGE_CODE, STORY_PROPERTY_NOTES, STORY_PROPERTY_TITLE) {
        // Creates a change using an apply function, reverse function, a change
        // command and related parameters. The change is applied to a given
        // story.
        var _applyChange = function (story, command, params, apply, reverse) {
            var changeDict = angular.copy(params);
            changeDict.cmd = command;
            var changeObj = ChangeObjectFactory.create(changeDict, apply, reverse);
            UndoRedoService.applyChange(changeObj, story);
        };
        var _getParameterFromChangeDict = function (changeDict, paramName) {
            return changeDict[paramName];
        };
        var _getNodeIdFromChangeDict = function (changeDict) {
            return _getParameterFromChangeDict(changeDict, 'node_id');
        };
        var _getStoryNode = function (storyContents, nodeId) {
            var storyNodeIndex = storyContents.getNodeIndex(nodeId);
            if (storyNodeIndex === -1) {
                throw Error('The given node doesn\'t exist');
            }
            return storyContents.getNodes()[storyNodeIndex];
        };
        // Applies a story property change, specifically. See _applyChange()
        // for details on the other behavior of this function.
        var _applyStoryPropertyChange = function (story, propertyName, oldValue, newValue, apply, reverse) {
            _applyChange(story, CMD_UPDATE_STORY_PROPERTY, {
                property_name: propertyName,
                new_value: angular.copy(newValue),
                old_value: angular.copy(oldValue)
            }, apply, reverse);
        };
        var _applyStoryContentsPropertyChange = function (story, propertyName, oldValue, newValue, apply, reverse) {
            _applyChange(story, CMD_UPDATE_STORY_CONTENTS_PROPERTY, {
                property_name: propertyName,
                new_value: angular.copy(newValue),
                old_value: angular.copy(oldValue)
            }, apply, reverse);
        };
        var _applyStoryNodePropertyChange = function (story, propertyName, nodeId, oldValue, newValue, apply, reverse) {
            _applyChange(story, CMD_UPDATE_STORY_NODE_PROPERTY, {
                node_id: nodeId,
                property_name: propertyName,
                new_value: angular.copy(newValue),
                old_value: angular.copy(oldValue)
            }, apply, reverse);
        };
        var _getNewPropertyValueFromChangeDict = function (changeDict) {
            return _getParameterFromChangeDict(changeDict, 'new_value');
        };
        // These functions are associated with updates available in
        // core.domain.story_services.apply_change_list.
        return {
            /**
             * Changes the title of a story and records the change in the
             * undo/redo service.
             */
            setStoryTitle: function (story, title) {
                var oldTitle = angular.copy(story.getTitle());
                _applyStoryPropertyChange(story, STORY_PROPERTY_TITLE, oldTitle, title, function (changeDict, story) {
                    // Apply
                    var title = _getNewPropertyValueFromChangeDict(changeDict);
                    story.setTitle(title);
                }, function (changeDict, story) {
                    // Undo.
                    story.setTitle(oldTitle);
                });
            },
            /**
             * Changes the description of a story and records the change in the
             * undo/redo service.
             */
            setStoryDescription: function (story, description) {
                var oldDescription = angular.copy(story.getDescription());
                _applyStoryPropertyChange(story, STORY_PROPERTY_DESCRIPTION, oldDescription, description, function (changeDict, story) {
                    // Apply
                    var description = _getNewPropertyValueFromChangeDict(changeDict);
                    story.setDescription(description);
                }, function (changeDict, story) {
                    // Undo.
                    story.setDescription(oldDescription);
                });
            },
            /**
             * Changes the notes for a story and records the change in the
             * undo/redo service.
             */
            setStoryNotes: function (story, notes) {
                var oldNotes = angular.copy(story.getNotes());
                _applyStoryPropertyChange(story, STORY_PROPERTY_NOTES, oldNotes, notes, function (changeDict, story) {
                    // Apply
                    var notes = _getNewPropertyValueFromChangeDict(changeDict);
                    story.setNotes(notes);
                }, function (changeDict, story) {
                    // Undo.
                    story.setNotes(oldNotes);
                });
            },
            /**
             * Changes the language code of a story and records the change in
             * the undo/redo service.
             */
            setStoryLanguageCode: function (story, languageCode) {
                var oldLanguageCode = angular.copy(story.getLanguageCode());
                _applyStoryPropertyChange(story, STORY_PROPERTY_LANGUAGE_CODE, oldLanguageCode, languageCode, function (changeDict, story) {
                    // Apply.
                    var languageCode = _getNewPropertyValueFromChangeDict(changeDict);
                    story.setLanguageCode(languageCode);
                }, function (changeDict, story) {
                    // Undo.
                    story.setLanguageCode(oldLanguageCode);
                });
            },
            /**
             * Sets the initial node of the story and records the change in
             * the undo/redo service.
             */
            setInitialNodeId: function (story, newInitialNodeId) {
                var oldInitialNodeId = angular.copy(story.getStoryContents().getInitialNodeId());
                _applyStoryContentsPropertyChange(story, INITIAL_NODE_ID, oldInitialNodeId, newInitialNodeId, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().setInitialNodeId(newInitialNodeId);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().setInitialNodeId(oldInitialNodeId);
                });
            },
            /**
             * Creates a story node, adds it to the story and records the change in
             * the undo/redo service.
             */
            addStoryNode: function (story, nodeTitle) {
                var nextNodeId = story.getStoryContents().getNextNodeId();
                _applyChange(story, CMD_ADD_STORY_NODE, {
                    node_id: nextNodeId,
                    title: nodeTitle
                }, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().addNode(nodeTitle);
                }, function (changeDict, story) {
                    // Undo.
                    var nodeId = _getNodeIdFromChangeDict(changeDict);
                    story.getStoryContents().deleteNode(nodeId);
                });
            },
            /**
             * Removes a story node, and records the change in the undo/redo service.
             */
            deleteStoryNode: function (story, nodeId) {
                var nodeIndex = story.getStoryContents().getNodeIndex(nodeId);
                _applyChange(story, CMD_DELETE_STORY_NODE, {
                    node_id: nodeId
                }, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().deleteNode(nodeId);
                }, function (changeDict, story) {
                    // Undo.
                    throw Error('A deleted story node cannot be restored.');
                });
            },
            /**
             * Marks the node outline of a node as finalized and records the change
             * in the undo/redo service.
             */
            finalizeStoryNodeOutline: function (story, nodeId) {
                var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
                if (storyNode.getOutlineStatus()) {
                    throw Error('Node outline is already finalized.');
                }
                _applyChange(story, CMD_UPDATE_STORY_NODE_OUTLINE_STATUS, {
                    node_id: nodeId,
                    old_value: false,
                    new_value: true
                }, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().markNodeOutlineAsFinalized(nodeId);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().markNodeOutlineAsNotFinalized(nodeId);
                });
            },
            /**
             * Marks the node outline of a node as not finalized and records the
             * change in the undo/redo service.
             */
            unfinalizeStoryNodeOutline: function (story, nodeId) {
                var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
                if (!storyNode.getOutlineStatus()) {
                    throw Error('Node outline is already not finalized.');
                }
                _applyChange(story, CMD_UPDATE_STORY_NODE_OUTLINE_STATUS, {
                    node_id: nodeId,
                    old_value: true,
                    new_value: false
                }, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().markNodeOutlineAsNotFinalized(nodeId);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().markNodeOutlineAsFinalized(nodeId);
                });
            },
            /**
             * Sets the outline of a node of the story and records the change
             * in the undo/redo service.
             */
            setStoryNodeOutline: function (story, nodeId, newOutline) {
                var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
                var oldOutline = storyNode.getOutline();
                _applyStoryNodePropertyChange(story, STORY_NODE_PROPERTY_OUTLINE, nodeId, oldOutline, newOutline, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().setNodeOutline(nodeId, newOutline);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().setNodeOutline(nodeId, oldOutline);
                });
            },
            /**
             * Sets the title of a node of the story and records the change
             * in the undo/redo service.
             */
            setStoryNodeTitle: function (story, nodeId, newTitle) {
                var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
                var oldTitle = storyNode.getTitle();
                _applyStoryNodePropertyChange(story, STORY_NODE_PROPERTY_TITLE, nodeId, oldTitle, newTitle, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().setNodeTitle(nodeId, newTitle);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().setNodeTitle(nodeId, oldTitle);
                });
            },
            /**
             * Sets the id of the exploration that of a node of the story is linked
             * to and records the change in the undo/redo service.
             */
            setStoryNodeExplorationId: function (story, nodeId, newExplorationId) {
                var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
                var oldExplorationId = storyNode.getExplorationId();
                _applyStoryNodePropertyChange(story, STORY_NODE_PROPERTY_EXPLORATION_ID, nodeId, oldExplorationId, newExplorationId, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().setNodeExplorationId(nodeId, newExplorationId);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().setNodeExplorationId(nodeId, oldExplorationId);
                });
            },
            /**
             * Adds a destination node id to a node of a story and records the change
             * in the undo/redo service.
             */
            addDestinationNodeIdToNode: function (story, nodeId, destinationNodeId) {
                var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
                var oldDestinationNodeIds = angular.copy(storyNode.getDestinationNodeIds());
                var newDestinationNodeIds = angular.copy(oldDestinationNodeIds);
                newDestinationNodeIds.push(destinationNodeId);
                _applyStoryNodePropertyChange(story, STORY_NODE_PROPERTY_DESTINATION_NODE_IDS, nodeId, oldDestinationNodeIds, newDestinationNodeIds, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().addDestinationNodeIdToNode(nodeId, destinationNodeId);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().removeDestinationNodeIdFromNode(nodeId, destinationNodeId);
                });
            },
            /**
             * Removes a destination node id from a node of a story and records the
             * change in the undo/redo service.
             */
            removeDestinationNodeIdFromNode: function (story, nodeId, destinationNodeId) {
                var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
                var oldDestinationNodeIds = angular.copy(storyNode.getDestinationNodeIds());
                var newDestinationNodeIds = angular.copy(oldDestinationNodeIds);
                var index = newDestinationNodeIds.indexOf(destinationNodeId);
                if (index === -1) {
                    throw Error('The given destination node is not part of the node');
                }
                newDestinationNodeIds.splice(index, 1);
                _applyStoryNodePropertyChange(story, STORY_NODE_PROPERTY_DESTINATION_NODE_IDS, nodeId, oldDestinationNodeIds, newDestinationNodeIds, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().removeDestinationNodeIdFromNode(nodeId, destinationNodeId);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().addDestinationNodeIdToNode(nodeId, destinationNodeId);
                });
            },
            /**
             * Adds a prerequisite skill id to a node of a story and records the
             * change in the undo/redo service.
             */
            addPrerequisiteSkillIdToNode: function (story, nodeId, skillId) {
                var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
                var oldPrerequisiteSkillIds = angular.copy(storyNode.getPrerequisiteSkillIds());
                var newPrerequisiteSkillIds = angular.copy(oldPrerequisiteSkillIds);
                newPrerequisiteSkillIds.push(skillId);
                _applyStoryNodePropertyChange(story, STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS, nodeId, oldPrerequisiteSkillIds, newPrerequisiteSkillIds, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().addPrerequisiteSkillIdToNode(nodeId, skillId);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().removePrerequisiteSkillIdFromNode(nodeId, skillId);
                });
            },
            /**
             * Removes a prerequisite skill id from a node of a story and records the
             * change in the undo/redo service.
             */
            removePrerequisiteSkillIdFromNode: function (story, nodeId, skillId) {
                var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
                var oldPrerequisiteSkillIds = angular.copy(storyNode.getPrerequisiteSkillIds());
                var newPrerequisiteSkillIds = angular.copy(oldPrerequisiteSkillIds);
                var index = newPrerequisiteSkillIds.indexOf(skillId);
                if (index === -1) {
                    throw Error('The given prerequisite skill is not part of the node');
                }
                newPrerequisiteSkillIds.splice(index, 1);
                _applyStoryNodePropertyChange(story, STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS, nodeId, oldPrerequisiteSkillIds, newPrerequisiteSkillIds, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().removePrerequisiteSkillIdFromNode(nodeId, skillId);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().addPrerequisiteSkillIdToNode(nodeId, skillId);
                });
            },
            /**
             * Adds an acquired skill id to a node of a story and records the change
             * in the undo/redo service.
             */
            addAcquiredSkillIdToNode: function (story, nodeId, skillId) {
                var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
                var oldAcquiredSkillIds = angular.copy(storyNode.getAcquiredSkillIds());
                var newAcquiredSkillIds = angular.copy(oldAcquiredSkillIds);
                newAcquiredSkillIds.push(skillId);
                _applyStoryNodePropertyChange(story, STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS, nodeId, oldAcquiredSkillIds, newAcquiredSkillIds, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().addAcquiredSkillIdToNode(nodeId, skillId);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().removeAcquiredSkillIdFromNode(nodeId, skillId);
                });
            },
            /**
             * Removes an acquired skill id from a node of a story and records the
             * change in the undo/redo service.
             */
            removeAcquiredSkillIdFromNode: function (story, nodeId, skillId) {
                var storyNode = _getStoryNode(story.getStoryContents(), nodeId);
                var oldAcquiredSkillIds = angular.copy(storyNode.getAcquiredSkillIds());
                var newAcquiredSkillIds = angular.copy(oldAcquiredSkillIds);
                var index = newAcquiredSkillIds.indexOf(skillId);
                if (index === -1) {
                    throw Error('The given acquired skill id is not part of the node');
                }
                newAcquiredSkillIds.splice(index, 1);
                _applyStoryNodePropertyChange(story, STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS, nodeId, oldAcquiredSkillIds, newAcquiredSkillIds, function (changeDict, story) {
                    // Apply.
                    story.getStoryContents().removeAcquiredSkillIdFromNode(nodeId, skillId);
                }, function (changeDict, story) {
                    // Undo.
                    story.getStoryContents().addAcquiredSkillIdToNode(nodeId, skillId);
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/story-editor-page/main-story-editor/main-story-editor.directive.ts":
/*!**********************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-editor-page/main-story-editor/main-story-editor.directive.ts ***!
  \**********************************************************************************************************/
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
 * @fileoverview Controller for the main story editor.
 */
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-editor.directive.ts");
__webpack_require__(/*! directives/AngularHtmlBindDirective.ts */ "./core/templates/dev/head/directives/AngularHtmlBindDirective.ts");
__webpack_require__(/*! pages/story-editor-page/main-story-editor/story-node-editor/story-node-editor.directive.ts */ "./core/templates/dev/head/pages/story-editor-page/main-story-editor/story-node-editor/story-node-editor.directive.ts");
__webpack_require__(/*! domain/editor/undo_redo/UndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts");
__webpack_require__(/*! domain/story/StoryUpdateService.ts */ "./core/templates/dev/head/domain/story/StoryUpdateService.ts");
__webpack_require__(/*! pages/story-editor-page/story-editor-services/story-editor-state/story-editor-state.service.ts */ "./core/templates/dev/head/pages/story-editor-page/story-editor-services/story-editor-state/story-editor-state.service.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('mainStoryEditorModule').directive('storyEditor', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-editor-page/main-story-editor/' +
                'main-story-editor.directive.html'),
            controller: [
                '$scope', 'StoryEditorStateService', 'StoryUpdateService',
                'UndoRedoService', 'EVENT_VIEW_STORY_NODE_EDITOR', '$uibModal',
                'EVENT_STORY_INITIALIZED', 'EVENT_STORY_REINITIALIZED', 'AlertsService',
                function ($scope, StoryEditorStateService, StoryUpdateService, UndoRedoService, EVENT_VIEW_STORY_NODE_EDITOR, $uibModal, EVENT_STORY_INITIALIZED, EVENT_STORY_REINITIALIZED, AlertsService) {
                    var _init = function () {
                        $scope.story = StoryEditorStateService.getStory();
                        $scope.storyContents = $scope.story.getStoryContents();
                        if ($scope.storyContents) {
                            $scope.setNodeToEdit($scope.storyContents.getInitialNodeId());
                        }
                        _initEditor();
                    };
                    var _initEditor = function () {
                        $scope.story = StoryEditorStateService.getStory();
                        $scope.storyContents = $scope.story.getStoryContents();
                        $scope.disconnectedNodeIds = [];
                        if ($scope.storyContents) {
                            $scope.nodes = $scope.storyContents.getNodes();
                            $scope.disconnectedNodeIds =
                                $scope.storyContents.getDisconnectedNodeIds();
                        }
                        $scope.notesEditorIsShown = false;
                        $scope.storyTitleEditorIsShown = false;
                        $scope.editableTitle = $scope.story.getTitle();
                        $scope.editableNotes = $scope.story.getNotes();
                        $scope.editableDescription = $scope.story.getDescription();
                        $scope.editableDescriptionIsEmpty = ($scope.editableDescription === '');
                        $scope.storyDescriptionChanged = false;
                    };
                    $scope.setNodeToEdit = function (nodeId) {
                        $scope.idOfNodeToEdit = nodeId;
                    };
                    $scope.openNotesEditor = function () {
                        $scope.notesEditorIsShown = true;
                    };
                    $scope.closeNotesEditor = function () {
                        $scope.notesEditorIsShown = false;
                    };
                    $scope.isInitialNode = function (nodeId) {
                        return ($scope.story.getStoryContents().getInitialNodeId() === nodeId);
                    };
                    $scope.markAsInitialNode = function (nodeId) {
                        if ($scope.isInitialNode(nodeId)) {
                            return;
                        }
                        StoryUpdateService.setInitialNodeId($scope.story, nodeId);
                        _initEditor();
                    };
                    $scope.deleteNode = function (nodeId) {
                        if ($scope.isInitialNode(nodeId)) {
                            AlertsService.addInfoMessage('Cannot delete the first chapter of a story.', 3000);
                            return;
                        }
                        var modalInstance = $uibModal.open({
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-editor-page/story-editor-templates/' +
                                'delete-chapter-modal.template.html'),
                            backdrop: true,
                            controller: [
                                '$scope', '$uibModalInstance',
                                function ($scope, $uibModalInstance) {
                                    $scope.confirmDeletion = function () {
                                        $uibModalInstance.close();
                                    };
                                    $scope.cancel = function () {
                                        $uibModalInstance.dismiss('cancel');
                                    };
                                }
                            ]
                        });
                        modalInstance.result.then(function (title) {
                            StoryUpdateService.deleteStoryNode($scope.story, nodeId);
                        });
                    };
                    $scope.createNode = function () {
                        var nodeTitles = $scope.nodes.map(function (node) {
                            return node.getTitle();
                        });
                        var modalInstance = $uibModal.open({
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-editor-page/story-editor-templates/' +
                                'new-chapter-title-modal.template.html'),
                            backdrop: true,
                            controller: [
                                '$scope', '$uibModalInstance',
                                function ($scope, $uibModalInstance) {
                                    $scope.nodeTitle = '';
                                    $scope.nodeTitles = nodeTitles;
                                    $scope.errorMsg = null;
                                    $scope.resetErrorMsg = function () {
                                        $scope.errorMsg = null;
                                    };
                                    $scope.isNodeTitleEmpty = function (nodeTitle) {
                                        return (nodeTitle === '');
                                    };
                                    $scope.save = function (title) {
                                        if ($scope.nodeTitles.indexOf(title) !== -1) {
                                            $scope.errorMsg =
                                                'A chapter with this title already exists';
                                            return;
                                        }
                                        $uibModalInstance.close(title);
                                    };
                                    $scope.cancel = function () {
                                        $uibModalInstance.dismiss('cancel');
                                    };
                                }
                            ]
                        });
                        modalInstance.result.then(function (title) {
                            StoryUpdateService.addStoryNode($scope.story, title);
                            _initEditor();
                            // If the first node is added, open it just after creation.
                            if ($scope.story.getStoryContents().getNodes().length === 1) {
                                $scope.setNodeToEdit($scope.story.getStoryContents().getInitialNodeId());
                            }
                        });
                    };
                    $scope.NOTES_SCHEMA = {
                        type: 'html',
                        ui_config: {
                            startupFocusEnabled: false
                        }
                    };
                    $scope.updateNotes = function (newNotes) {
                        if (newNotes === $scope.story.getNotes()) {
                            return;
                        }
                        StoryUpdateService.setStoryNotes($scope.story, newNotes);
                        _initEditor();
                    };
                    $scope.updateStoryDescriptionStatus = function (description) {
                        $scope.editableDescriptionIsEmpty = (description === '');
                        $scope.storyDescriptionChanged = true;
                    };
                    $scope.updateStoryTitle = function (newTitle) {
                        if (newTitle === $scope.story.getTitle()) {
                            return;
                        }
                        StoryUpdateService.setStoryTitle($scope.story, newTitle);
                    };
                    $scope.updateStoryDescription = function (newDescription) {
                        if (newDescription !== $scope.story.getDescription()) {
                            StoryUpdateService.setStoryDescription($scope.story, newDescription);
                        }
                    };
                    $scope.$on(EVENT_VIEW_STORY_NODE_EDITOR, function (evt, nodeId) {
                        $scope.setNodeToEdit(nodeId);
                    });
                    $scope.$on('storyGraphUpdated', function (evt, storyContents) {
                        _initEditor();
                    });
                    $scope.$on(EVENT_STORY_INITIALIZED, _init);
                    $scope.$on(EVENT_STORY_REINITIALIZED, _initEditor);
                    _init();
                    _initEditor();
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/story-editor-page/main-story-editor/story-node-editor/story-node-editor.directive.ts":
/*!****************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-editor-page/main-story-editor/story-node-editor/story-node-editor.directive.ts ***!
  \****************************************************************************************************************************/
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
 * @fileoverview Controller for the story node editor.
 */
__webpack_require__(/*! domain/editor/undo_redo/UndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts");
__webpack_require__(/*! domain/story/StoryUpdateService.ts */ "./core/templates/dev/head/domain/story/StoryUpdateService.ts");
__webpack_require__(/*! pages/story-editor-page/story-editor-services/story-editor-state/story-editor-state.service.ts */ "./core/templates/dev/head/pages/story-editor-page/story-editor-services/story-editor-state/story-editor-state.service.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('storyNodeEditorModule').directive('storyNodeEditor', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {
                getId: '&nodeId',
                getOutline: '&outline',
                getExplorationId: '&explorationId',
                isOutlineFinalized: '&outlineFinalized',
                getDestinationNodeIds: '&destinationNodeIds',
                getPrerequisiteSkillIds: '&prerequisiteSkillIds',
                getAcquiredSkillIds: '&acquiredSkillIds'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-editor-page/main-story-editor/story-node-editor/' +
                'story-node-editor.directive.html'),
            controller: [
                '$scope', '$rootScope', '$uibModal', 'StoryEditorStateService',
                'StoryUpdateService', 'UndoRedoService', 'EVENT_STORY_INITIALIZED',
                'EVENT_STORY_REINITIALIZED', 'EVENT_VIEW_STORY_NODE_EDITOR',
                'AlertsService',
                function ($scope, $rootScope, $uibModal, StoryEditorStateService, StoryUpdateService, UndoRedoService, EVENT_STORY_INITIALIZED, EVENT_STORY_REINITIALIZED, EVENT_VIEW_STORY_NODE_EDITOR, AlertsService) {
                    var _recalculateAvailableNodes = function () {
                        $scope.newNodeId = null;
                        $scope.availableNodes = [];
                        for (var i = 0; i < $scope.storyNodeIds.length; i++) {
                            if ($scope.storyNodeIds[i] === $scope.getId()) {
                                continue;
                            }
                            if ($scope.getDestinationNodeIds().indexOf($scope.storyNodeIds[i]) !== -1) {
                                continue;
                            }
                            $scope.availableNodes.push({
                                id: $scope.storyNodeIds[i],
                                text: $scope.nodeIdToTitleMap[$scope.storyNodeIds[i]]
                            });
                        }
                    };
                    var _init = function () {
                        $scope.story = StoryEditorStateService.getStory();
                        $scope.storyNodeIds = $scope.story.getStoryContents().getNodeIds();
                        $scope.nodeIdToTitleMap =
                            $scope.story.getStoryContents().getNodeIdsToTitleMap($scope.storyNodeIds);
                        _recalculateAvailableNodes();
                        $scope.currentTitle = $scope.nodeIdToTitleMap[$scope.getId()];
                        $scope.editableTitle = $scope.currentTitle;
                        $scope.oldOutline = $scope.getOutline();
                        $scope.editableOutline = $scope.getOutline();
                        $scope.explorationId = $scope.getExplorationId();
                        $scope.currentExplorationId = $scope.explorationId;
                        $scope.nodeTitleEditorIsShown = false;
                        $scope.OUTLINE_SCHEMA = {
                            type: 'html',
                            ui_config: {
                                rows: 100
                            }
                        };
                    };
                    $scope.getSkillEditorUrl = function (skillId) {
                        return '/skill_editor/' + skillId;
                    };
                    // Regex pattern for exploration id, EXPLORATION_AND_SKILL_ID_PATTERN
                    // is not being used here, as the chapter of the story can be saved
                    // with empty exploration id.
                    $scope.explorationIdPattern = /^[a-zA-Z0-9_-]*$/;
                    $scope.canSaveExpId = true;
                    $scope.checkCanSaveExpId = function () {
                        $scope.canSaveExpId = $scope.explorationIdPattern.test($scope.explorationId);
                    };
                    $scope.updateTitle = function (newTitle) {
                        if (newTitle === $scope.currentTitle) {
                            return;
                        }
                        StoryUpdateService.setStoryNodeTitle($scope.story, $scope.getId(), newTitle);
                        $scope.currentTitle = newTitle;
                    };
                    $scope.viewNodeEditor = function (nodeId) {
                        $rootScope.$broadcast(EVENT_VIEW_STORY_NODE_EDITOR, nodeId);
                    };
                    $scope.finalizeOutline = function () {
                        StoryUpdateService.finalizeStoryNodeOutline($scope.story, $scope.getId());
                    };
                    $scope.updateExplorationId = function (explorationId) {
                        StoryUpdateService.setStoryNodeExplorationId($scope.story, $scope.getId(), explorationId);
                        $scope.currentExplorationId = explorationId;
                    };
                    $scope.addPrerequisiteSkillId = function (skillId) {
                        if (!skillId) {
                            return;
                        }
                        try {
                            StoryUpdateService.addPrerequisiteSkillIdToNode($scope.story, $scope.getId(), skillId);
                        }
                        catch (err) {
                            AlertsService.addWarning('Given skill is already a prerequisite skill');
                        }
                        $scope.prerequisiteSkillId = null;
                    };
                    $scope.removePrerequisiteSkillId = function (skillId) {
                        StoryUpdateService.removePrerequisiteSkillIdFromNode($scope.story, $scope.getId(), skillId);
                    };
                    $scope.addAcquiredSkillId = function (skillId) {
                        if (!skillId) {
                            return;
                        }
                        try {
                            StoryUpdateService.addAcquiredSkillIdToNode($scope.story, $scope.getId(), skillId);
                        }
                        catch (err) {
                            AlertsService.addWarning('Given skill is already an acquired skill');
                        }
                        $scope.acquiredSkillId = null;
                    };
                    $scope.removeAcquiredSkillId = function (skillId) {
                        StoryUpdateService.removeAcquiredSkillIdFromNode($scope.story, $scope.getId(), skillId);
                    };
                    $scope.unfinalizeOutline = function () {
                        StoryUpdateService.unfinalizeStoryNodeOutline($scope.story, $scope.getId());
                    };
                    $scope.addNewDestinationNode = function () {
                        var nodeTitles = $scope.story.getStoryContents().getNodes().map(function (node) {
                            return node.getTitle();
                        });
                        var modalInstance = $uibModal.open({
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-editor-page/story-editor-templates/' +
                                'new-chapter-title-modal.template.html'),
                            backdrop: true,
                            controller: [
                                '$scope', '$uibModalInstance',
                                function ($scope, $uibModalInstance) {
                                    $scope.nodeTitle = '';
                                    $scope.nodeTitles = nodeTitles;
                                    $scope.errorMsg = null;
                                    $scope.resetErrorMsg = function () {
                                        $scope.errorMsg = null;
                                    };
                                    $scope.isNodeTitleEmpty = function (nodeTitle) {
                                        return (nodeTitle === '');
                                    };
                                    $scope.save = function (title) {
                                        if ($scope.nodeTitles.indexOf(title) !== -1) {
                                            $scope.errorMsg =
                                                'A chapter with this title already exists';
                                            return;
                                        }
                                        $uibModalInstance.close(title);
                                    };
                                    $scope.cancel = function () {
                                        $uibModalInstance.dismiss('cancel');
                                    };
                                }
                            ]
                        });
                        modalInstance.result.then(function (title) {
                            var nextNodeId = $scope.story.getStoryContents().getNextNodeId();
                            StoryUpdateService.addStoryNode($scope.story, title);
                            StoryUpdateService.addDestinationNodeIdToNode($scope.story, $scope.getId(), nextNodeId);
                            _init();
                            _recalculateAvailableNodes();
                        });
                    };
                    $scope.addDestinationNode = function (nodeId) {
                        if (!nodeId) {
                            return;
                        }
                        if (nodeId === $scope.getId()) {
                            AlertsService.addInfoMessage('A chapter cannot lead to itself.', 3000);
                            return;
                        }
                        try {
                            StoryUpdateService.addDestinationNodeIdToNode($scope.story, $scope.getId(), nodeId);
                        }
                        catch (error) {
                            AlertsService.addInfoMessage('The given chapter is already a destination for current ' +
                                'chapter', 3000);
                            return;
                        }
                        $rootScope.$broadcast('storyGraphUpdated', $scope.story.getStoryContents());
                        _recalculateAvailableNodes();
                    };
                    $scope.removeDestinationNodeId = function (nodeId) {
                        StoryUpdateService.removeDestinationNodeIdFromNode($scope.story, $scope.getId(), nodeId);
                        $rootScope.$broadcast('storyGraphUpdated', $scope.story.getStoryContents());
                        _recalculateAvailableNodes();
                    };
                    $scope.openNodeTitleEditor = function () {
                        $scope.nodeTitleEditorIsShown = true;
                    };
                    $scope.closeNodeTitleEditor = function () {
                        $scope.nodeTitleEditorIsShown = false;
                    };
                    $scope.isOutlineModified = function (outline) {
                        return ($scope.oldOutline !== outline);
                    };
                    $scope.updateOutline = function (newOutline) {
                        if (!$scope.isOutlineModified(newOutline)) {
                            return;
                        }
                        StoryUpdateService.setStoryNodeOutline($scope.story, $scope.getId(), newOutline);
                        $scope.oldOutline = newOutline;
                    };
                    $scope.$on(EVENT_STORY_INITIALIZED, _init);
                    $scope.$on(EVENT_STORY_REINITIALIZED, _init);
                    _init();
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/story-editor-page/story-editor-navbar-breadcrumb/story-editor-navbar-breadcrumb.directive.ts":
/*!************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-editor-page/story-editor-navbar-breadcrumb/story-editor-navbar-breadcrumb.directive.ts ***!
  \************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Controller for the navbar breadcrumb of the story editor.
 */
__webpack_require__(/*! domain/editor/undo_redo/UndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/story-editor-page/story-editor-services/story-editor-state/story-editor-state.service.ts */ "./core/templates/dev/head/pages/story-editor-page/story-editor-services/story-editor-state/story-editor-state.service.ts");
__webpack_require__(/*! pages/story-editor-page/main-story-editor/main-story-editor.directive.ts */ "./core/templates/dev/head/pages/story-editor-page/main-story-editor/main-story-editor.directive.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
angular.module('storyEditorNavbarBreadcrumbModule').directive('storyEditorNavbarBreadcrumb', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-editor-page/story-editor-navbar-breadcrumb/' +
                'story-editor-navbar-breadcrumb.directive.html'),
            controller: [
                '$scope', '$uibModal', '$window', 'UrlService',
                'UrlInterpolationService', 'UndoRedoService',
                'StoryEditorStateService', 'EVENT_STORY_INITIALIZED',
                function ($scope, $uibModal, $window, UrlService, UrlInterpolationService, UndoRedoService, StoryEditorStateService, EVENT_STORY_INITIALIZED) {
                    $scope.story = StoryEditorStateService.getStory();
                    var TOPIC_EDITOR_URL_TEMPLATE = '/topic_editor/<topicId>';
                    var topicId = UrlService.getTopicIdFromUrl();
                    $scope.$on(EVENT_STORY_INITIALIZED, function () {
                        $scope.topicName = StoryEditorStateService.getTopicName();
                    });
                    $scope.returnToTopicEditorPage = function () {
                        if (UndoRedoService.getChangeCount() > 0) {
                            var modalInstance = $uibModal.open({
                                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-editor-page/story-editor-templates/' +
                                    'save-pending-changes-modal.template.html'),
                                backdrop: true,
                                controller: [
                                    '$scope', '$uibModalInstance',
                                    function ($scope, $uibModalInstance) {
                                        $scope.cancel = function () {
                                            $uibModalInstance.dismiss('cancel');
                                        };
                                    }
                                ]
                            });
                        }
                        else {
                            $window.open(UrlInterpolationService.interpolateUrl(TOPIC_EDITOR_URL_TEMPLATE, {
                                topicId: topicId
                            }), '_self');
                        }
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/story-editor-page/story-editor-navbar/story-editor-navbar.directive.ts":
/*!**************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-editor-page/story-editor-navbar/story-editor-navbar.directive.ts ***!
  \**************************************************************************************************************/
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
 * @fileoverview Directive for the navbar of the story editor.
 */
__webpack_require__(/*! domain/editor/undo_redo/BaseUndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/BaseUndoRedoService.ts");
__webpack_require__(/*! domain/editor/undo_redo/UndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/story-editor-page/story-editor-services/story-editor-state/story-editor-state.service.ts */ "./core/templates/dev/head/pages/story-editor-page/story-editor-services/story-editor-state/story-editor-state.service.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
angular.module('storyEditorNavbarModule').directive('storyEditorNavbar', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-editor-page/story-editor-navbar/' +
                'story-editor-navbar.directive.html'),
            controller: [
                '$scope', '$rootScope', '$uibModal', 'AlertsService',
                'UndoRedoService', 'StoryEditorStateService', 'UrlService',
                'EVENT_STORY_INITIALIZED', 'EVENT_STORY_REINITIALIZED',
                'EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED',
                function ($scope, $rootScope, $uibModal, AlertsService, UndoRedoService, StoryEditorStateService, UrlService, EVENT_STORY_INITIALIZED, EVENT_STORY_REINITIALIZED, EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED) {
                    var topicId = UrlService.getTopicIdFromUrl();
                    $scope.story = StoryEditorStateService.getStory();
                    $scope.isSaveInProgress = StoryEditorStateService.isSavingStory;
                    $scope.validationIssues = [];
                    $scope.getChangeListLength = function () {
                        return UndoRedoService.getChangeCount();
                    };
                    $scope.getWarningsCount = function () {
                        return $scope.validationIssues.length;
                    };
                    $scope.isStorySaveable = function () {
                        return ($scope.getChangeListLength() > 0 &&
                            $scope.getWarningsCount() === 0);
                    };
                    $scope.discardChanges = function () {
                        UndoRedoService.clearChanges();
                        StoryEditorStateService.loadStory(topicId, $scope.story.getId());
                    };
                    var _validateStory = function () {
                        $scope.validationIssues = $scope.story.validate();
                    };
                    $scope.saveChanges = function () {
                        var modalInstance = $uibModal.open({
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-editor-page/story-editor-templates/' +
                                'story-editor-save-modal.template.html'),
                            backdrop: true,
                            controller: [
                                '$scope', '$uibModalInstance',
                                function ($scope, $uibModalInstance) {
                                    $scope.save = function (commitMessage) {
                                        $uibModalInstance.close(commitMessage);
                                    };
                                    $scope.cancel = function () {
                                        $uibModalInstance.dismiss('cancel');
                                    };
                                }
                            ]
                        });
                        modalInstance.result.then(function (commitMessage) {
                            StoryEditorStateService.saveStory(topicId, commitMessage);
                        });
                    };
                    $scope.$on(EVENT_STORY_INITIALIZED, _validateStory);
                    $scope.$on(EVENT_STORY_REINITIALIZED, _validateStory);
                    $scope.$on(EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED, _validateStory);
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/story-editor-page/story-editor-page.controller.ts":
/*!*****************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-editor-page/story-editor-page.controller.ts ***!
  \*****************************************************************************************/
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
 * @fileoverview Primary controller for the story editor page.
 */
// TODO(vojtechjelinek): this block of requires should be removed after we
// introduce webpack for /extensions
__webpack_require__(/*! components/ck-editor-helpers/ck-editor-rte/ck-editor-rte.directive.ts */ "./core/templates/dev/head/components/ck-editor-helpers/ck-editor-rte/ck-editor-rte.directive.ts");
__webpack_require__(/*! components/ck-editor-helpers/ck-editor-widgets/ck-editor-widgets.initializer.ts */ "./core/templates/dev/head/components/ck-editor-helpers/ck-editor-widgets/ck-editor-widgets.initializer.ts");
__webpack_require__(/*! components/forms/forms-unicode-filters/convert-unicode-with-params-to-html.filter.ts */ "./core/templates/dev/head/components/forms/forms-unicode-filters/convert-unicode-with-params-to-html.filter.ts");
__webpack_require__(/*! components/forms/forms-unicode-filters/convert-html-to-unicode.filter.ts */ "./core/templates/dev/head/components/forms/forms-unicode-filters/convert-html-to-unicode.filter.ts");
__webpack_require__(/*! components/forms/forms-unicode-filters/convert-unicode-to-html.filter.ts */ "./core/templates/dev/head/components/forms/forms-unicode-filters/convert-unicode-to-html.filter.ts");
__webpack_require__(/*! components/forms/forms-validators/is-at-least.filter.ts */ "./core/templates/dev/head/components/forms/forms-validators/is-at-least.filter.ts");
__webpack_require__(/*! components/forms/forms-validators/is-at-most.filter.ts */ "./core/templates/dev/head/components/forms/forms-validators/is-at-most.filter.ts");
__webpack_require__(/*! components/forms/forms-validators/is-float.filter.ts */ "./core/templates/dev/head/components/forms/forms-validators/is-float.filter.ts");
__webpack_require__(/*! components/forms/forms-validators/is-integer.filter.ts */ "./core/templates/dev/head/components/forms/forms-validators/is-integer.filter.ts");
__webpack_require__(/*! components/forms/forms-validators/is-nonempty.filter.ts */ "./core/templates/dev/head/components/forms/forms-validators/is-nonempty.filter.ts");
__webpack_require__(/*! components/forms/forms-directives/apply-validation/apply-validation.directive.ts */ "./core/templates/dev/head/components/forms/forms-directives/apply-validation/apply-validation.directive.ts");
__webpack_require__(/*! components/forms/forms-directives/require-is-float/require-is-float.directive.ts */ "./core/templates/dev/head/components/forms/forms-directives/require-is-float/require-is-float.directive.ts");
__webpack_require__(/*! directives/AngularHtmlBindDirective.ts */ "./core/templates/dev/head/directives/AngularHtmlBindDirective.ts");
__webpack_require__(/*! directives/MathjaxBindDirective.ts */ "./core/templates/dev/head/directives/MathjaxBindDirective.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-custom-editor/schema-based-custom-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-custom-editor/schema-based-custom-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-dict-editor/schema-based-dict-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-dict-editor/schema-based-dict-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-expression-editor/schema-based-expression-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-expression-editor/schema-based-expression-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-float-editor/schema-based-float-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-float-editor/schema-based-float-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-html-editor/schema-based-html-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-html-editor/schema-based-html-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-int-editor/schema-based-int-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-int-editor/schema-based-int-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-list-editor/schema-based-list-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-list-editor/schema-based-list-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-unicode-editor/schema-based-unicode-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-unicode-editor/schema-based-unicode-editor.directive.ts");
__webpack_require__(/*! components/forms/schema_viewers/SchemaBasedCustomViewerDirective.ts */ "./core/templates/dev/head/components/forms/schema_viewers/SchemaBasedCustomViewerDirective.ts");
__webpack_require__(/*! components/forms/schema_viewers/SchemaBasedDictViewerDirective.ts */ "./core/templates/dev/head/components/forms/schema_viewers/SchemaBasedDictViewerDirective.ts");
__webpack_require__(/*! components/forms/schema_viewers/SchemaBasedHtmlViewerDirective.ts */ "./core/templates/dev/head/components/forms/schema_viewers/SchemaBasedHtmlViewerDirective.ts");
__webpack_require__(/*! components/forms/schema_viewers/SchemaBasedListViewerDirective.ts */ "./core/templates/dev/head/components/forms/schema_viewers/SchemaBasedListViewerDirective.ts");
__webpack_require__(/*! components/forms/schema_viewers/SchemaBasedPrimitiveViewerDirective.ts */ "./core/templates/dev/head/components/forms/schema_viewers/SchemaBasedPrimitiveViewerDirective.ts");
__webpack_require__(/*! components/forms/schema_viewers/SchemaBasedUnicodeViewerDirective.ts */ "./core/templates/dev/head/components/forms/schema_viewers/SchemaBasedUnicodeViewerDirective.ts");
__webpack_require__(/*! components/forms/schema_viewers/SchemaBasedViewerDirective.ts */ "./core/templates/dev/head/components/forms/schema_viewers/SchemaBasedViewerDirective.ts");
__webpack_require__(/*! services/HtmlEscaperService.ts */ "./core/templates/dev/head/services/HtmlEscaperService.ts");
__webpack_require__(/*! services/IdGenerationService.ts */ "./core/templates/dev/head/services/IdGenerationService.ts");
__webpack_require__(/*! services/RteHelperService.ts */ "./core/templates/dev/head/services/RteHelperService.ts");
__webpack_require__(/*! services/SchemaDefaultValueService.ts */ "./core/templates/dev/head/services/SchemaDefaultValueService.ts");
__webpack_require__(/*! services/SchemaUndefinedLastElementService.ts */ "./core/templates/dev/head/services/SchemaUndefinedLastElementService.ts");
__webpack_require__(/*! services/NestedDirectivesRecursionTimeoutPreventionService.ts */ "./core/templates/dev/head/services/NestedDirectivesRecursionTimeoutPreventionService.ts");
__webpack_require__(/*! services/GenerateContentIdService.ts */ "./core/templates/dev/head/services/GenerateContentIdService.ts");
__webpack_require__(/*! components/common-layout-directives/loading-dots/loading-dots.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/loading-dots/loading-dots.directive.ts");
__webpack_require__(/*! domain/editor/undo_redo/ChangeObjectFactory.ts */ "./core/templates/dev/head/domain/editor/undo_redo/ChangeObjectFactory.ts");
__webpack_require__(/*! domain/editor/undo_redo/UndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts");
__webpack_require__(/*! domain/editor/undo_redo/QuestionUndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/QuestionUndoRedoService.ts");
__webpack_require__(/*! domain/editor/undo_redo/BaseUndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/BaseUndoRedoService.ts");
__webpack_require__(/*! domain/story/EditableStoryBackendApiService.ts */ "./core/templates/dev/head/domain/story/EditableStoryBackendApiService.ts");
__webpack_require__(/*! domain/story/StoryObjectFactory.ts */ "./core/templates/dev/head/domain/story/StoryObjectFactory.ts");
__webpack_require__(/*! domain/story/StoryContentsObjectFactory.ts */ "./core/templates/dev/head/domain/story/StoryContentsObjectFactory.ts");
__webpack_require__(/*! domain/story/StoryNodeObjectFactory.ts */ "./core/templates/dev/head/domain/story/StoryNodeObjectFactory.ts");
__webpack_require__(/*! domain/story/StoryUpdateService.ts */ "./core/templates/dev/head/domain/story/StoryUpdateService.ts");
// ^^^ this block of requires should be removed ^^^
__webpack_require__(/*! pages/story-editor-page/story-editor-navbar-breadcrumb/story-editor-navbar-breadcrumb.directive.ts */ "./core/templates/dev/head/pages/story-editor-page/story-editor-navbar-breadcrumb/story-editor-navbar-breadcrumb.directive.ts");
__webpack_require__(/*! pages/story-editor-page/story-editor-navbar/story-editor-navbar.directive.ts */ "./core/templates/dev/head/pages/story-editor-page/story-editor-navbar/story-editor-navbar.directive.ts");
__webpack_require__(/*! pages/story-editor-page/main-story-editor/main-story-editor.directive.ts */ "./core/templates/dev/head/pages/story-editor-page/main-story-editor/main-story-editor.directive.ts");
__webpack_require__(/*! domain/editor/undo_redo/UndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/story-editor-page/story-editor-services/story-editor-state/story-editor-state.service.ts */ "./core/templates/dev/head/pages/story-editor-page/story-editor-services/story-editor-state/story-editor-state.service.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
angular.module('storyEditorModule').controller('StoryEditor', [
    '$scope', '$uibModal', '$window', 'StoryEditorStateService',
    'UndoRedoService',
    'UrlInterpolationService', 'UrlService',
    function ($scope, $uibModal, $window, StoryEditorStateService, UndoRedoService, UrlInterpolationService, UrlService) {
        var TOPIC_EDITOR_URL_TEMPLATE = '/topic_editor/<topicId>';
        var topicId = UrlService.getTopicIdFromUrl();
        StoryEditorStateService.loadStory(topicId, UrlService.getStoryIdFromUrl());
        $scope.returnToTopicEditorPage = function () {
            if (UndoRedoService.getChangeCount() > 0) {
                var modalInstance = $uibModal.open({
                    templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-editor-page/story-editor-templates/' +
                        'save-pending-changes-modal.template.html'),
                    backdrop: true,
                    controller: [
                        '$scope', '$uibModalInstance',
                        function ($scope, $uibModalInstance) {
                            $scope.cancel = function () {
                                $uibModalInstance.dismiss('cancel');
                            };
                        }
                    ]
                });
            }
            else {
                $window.open(UrlInterpolationService.interpolateUrl(TOPIC_EDITOR_URL_TEMPLATE, {
                    topicId: topicId
                }), '_self');
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/story-editor-page/story-editor-services/story-editor-state/story-editor-state.service.ts":
/*!********************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-editor-page/story-editor-services/story-editor-state/story-editor-state.service.ts ***!
  \********************************************************************************************************************************/
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
 * @fileoverview Service to maintain the state of a single story shared
 * throughout the story editor. This service provides functionality for
 * retrieving the story, saving it, and listening for changes.
 */
__webpack_require__(/*! domain/editor/undo_redo/UndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts");
__webpack_require__(/*! domain/story/EditableStoryBackendApiService.ts */ "./core/templates/dev/head/domain/story/EditableStoryBackendApiService.ts");
__webpack_require__(/*! domain/story/StoryObjectFactory.ts */ "./core/templates/dev/head/domain/story/StoryObjectFactory.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('storyEditorModule').factory('StoryEditorStateService', [
    '$rootScope', 'AlertsService', 'EditableStoryBackendApiService',
    'StoryObjectFactory', 'UndoRedoService',
    'EVENT_STORY_INITIALIZED', 'EVENT_STORY_REINITIALIZED',
    function ($rootScope, AlertsService, EditableStoryBackendApiService, StoryObjectFactory, UndoRedoService, EVENT_STORY_INITIALIZED, EVENT_STORY_REINITIALIZED) {
        var _story = StoryObjectFactory.createInterstitialStory();
        var _storyIsInitialized = false;
        var _storyIsLoading = false;
        var _storyIsBeingSaved = false;
        var _topicName = null;
        var _setStory = function (story) {
            _story.copyFromStory(story);
            if (_storyIsInitialized) {
                $rootScope.$broadcast(EVENT_STORY_REINITIALIZED);
            }
            else {
                $rootScope.$broadcast(EVENT_STORY_INITIALIZED);
                _storyIsInitialized = true;
            }
        };
        var _setTopicName = function (topicName) {
            _topicName = topicName;
        };
        var _updateStory = function (newBackendStoryObject) {
            _setStory(StoryObjectFactory.createFromBackendDict(newBackendStoryObject));
        };
        return {
            /**
             * Loads, or reloads, the story stored by this service given a
             * specified story ID. See setStory() for more information on
             * additional behavior of this function.
             */
            loadStory: function (topicId, storyId) {
                _storyIsLoading = true;
                EditableStoryBackendApiService.fetchStory(topicId, storyId).then(function (newBackendStoryObject) {
                    _setTopicName(newBackendStoryObject.topicName);
                    _updateStory(newBackendStoryObject.story);
                    _storyIsLoading = false;
                }, function (error) {
                    AlertsService.addWarning(error || 'There was an error when loading the story.');
                    _storyIsLoading = false;
                });
            },
            /**
             * Returns whether this service is currently attempting to load the
             * story maintained by this service.
             */
            isLoadingStory: function () {
                return _storyIsLoading;
            },
            /**
             * Returns whether a story has yet been loaded using either
             * loadStory() or setStory().
             */
            hasLoadedStory: function () {
                return _storyIsInitialized;
            },
            /**
             * Returns the current story to be shared among the story
             * editor. Please note any changes to this story will be propogated
             * to all bindings to it. This story object will be retained for the
             * lifetime of the editor. This function never returns null, though it may
             * return an empty story object if the story has not yet been
             * loaded for this editor instance.
             */
            getStory: function () {
                return _story;
            },
            /**
             * Sets the story stored within this service, propogating changes to
             * all bindings to the story returned by getStory(). The first
             * time this is called it will fire a global event based on the
             * EVENT_STORY_INITIALIZED constant. All subsequent
             * calls will similarly fire a EVENT_STORY_REINITIALIZED event.
             */
            setStory: function (story) {
                _setStory(story);
            },
            getTopicName: function () {
                return _topicName;
            },
            /**
             * Attempts to save the current story given a commit message. This
             * function cannot be called until after a story has been initialized
             * in this service. Returns false if a save is not performed due to no
             * changes pending, or true if otherwise. This function, upon success,
             * will clear the UndoRedoService of pending changes. This function also
             * shares behavior with setStory(), when it succeeds.
             */
            saveStory: function (topicId, commitMessage, successCallback) {
                if (!_storyIsInitialized) {
                    AlertsService.fatalWarning('Cannot save a story before one is loaded.');
                }
                // Don't attempt to save the story if there are no changes pending.
                if (!UndoRedoService.hasChanges()) {
                    return false;
                }
                _storyIsBeingSaved = true;
                EditableStoryBackendApiService.updateStory(topicId, _story.getId(), _story.getVersion(), commitMessage, UndoRedoService.getCommittableChangeList()).then(function (storyBackendObject) {
                    _updateStory(storyBackendObject);
                    UndoRedoService.clearChanges();
                    _storyIsBeingSaved = false;
                    if (successCallback) {
                        successCallback();
                    }
                }, function (error) {
                    AlertsService.addWarning(error || 'There was an error when saving the story.');
                    _storyIsBeingSaved = false;
                });
                return true;
            },
            /**
             * Returns whether this service is currently attempting to save the
             * story maintained by this service.
             */
            isSavingStory: function () {
                return _storyIsBeingSaved;
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/GenerateContentIdService.ts":
/*!**********************************************************************!*\
  !*** ./core/templates/dev/head/services/GenerateContentIdService.ts ***!
  \**********************************************************************/
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
/**
 * @fileoverview A service for generating random and unique content_id for
 * SubtitledHtml domain objects.
 */
oppia.factory('GenerateContentIdService', [
    'COMPONENT_NAME_FEEDBACK', 'COMPONENT_NAME_HINT',
    'COMPONENT_NAME_WORKED_EXAMPLE', function (COMPONENT_NAME_FEEDBACK, COMPONENT_NAME_HINT, COMPONENT_NAME_WORKED_EXAMPLE) {
        var generateIdForComponent = function (existingComponentIds, componentName) {
            var contentIdList = angular.copy(existingComponentIds);
            var searchKey = componentName + '_';
            var count = 0;
            for (var contentId in contentIdList) {
                if (contentIdList[contentId].indexOf(searchKey) === 0) {
                    var splitContentId = contentIdList[contentId].split('_');
                    var tempCount = parseInt(splitContentId[splitContentId.length - 1]);
                    if (tempCount > count) {
                        count = tempCount;
                    }
                }
            }
            return (searchKey + String(count + 1));
        };
        var _getNextId = function (existingComponentIds, componentName) {
            if (componentName === COMPONENT_NAME_FEEDBACK ||
                componentName === COMPONENT_NAME_HINT ||
                componentName === COMPONENT_NAME_WORKED_EXAMPLE) {
                return generateIdForComponent(existingComponentIds, componentName);
            }
            else {
                throw Error('Unknown component name provided.');
            }
        };
        return {
            getNextId: function (existingComponentIds, componentName) {
                return _getNextId(existingComponentIds, componentName);
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/RteHelperService.ts":
/*!**************************************************************!*\
  !*** ./core/templates/dev/head/services/RteHelperService.ts ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview A helper service for the Rich text editor(RTE).
 */
oppia.constant('RTE_COMPONENT_SPECS', richTextComponents);
oppia.factory('RteHelperService', [
    '$document', '$filter', '$interpolate', '$log', '$uibModal',
    'ContextService', 'FocusManagerService', 'HtmlEscaperService',
    'UrlInterpolationService', 'RTE_COMPONENT_SPECS',
    function ($document, $filter, $interpolate, $log, $uibModal, ContextService, FocusManagerService, HtmlEscaperService, UrlInterpolationService, RTE_COMPONENT_SPECS) {
        var _RICH_TEXT_COMPONENTS = [];
        Object.keys(RTE_COMPONENT_SPECS).sort().forEach(function (componentId) {
            _RICH_TEXT_COMPONENTS.push({
                backendId: RTE_COMPONENT_SPECS[componentId].backend_id,
                customizationArgSpecs: angular.copy(RTE_COMPONENT_SPECS[componentId].customization_arg_specs),
                id: RTE_COMPONENT_SPECS[componentId].frontend_id,
                iconDataUrl: RTE_COMPONENT_SPECS[componentId].icon_data_url,
                isComplex: RTE_COMPONENT_SPECS[componentId].is_complex,
                isBlockElement: RTE_COMPONENT_SPECS[componentId].is_block_element,
                requiresFs: RTE_COMPONENT_SPECS[componentId].requires_fs,
                tooltip: RTE_COMPONENT_SPECS[componentId].tooltip
            });
        });
        var _createCustomizationArgDictFromAttrs = function (attrs) {
            var customizationArgsDict = {};
            for (var i = 0; i < attrs.length; i++) {
                var attr = attrs[i];
                if (attr.name === 'class' || attr.name === 'src' ||
                    attr.name === '_moz_resizing') {
                    continue;
                }
                var separatorLocation = attr.name.indexOf('-with-value');
                if (separatorLocation === -1) {
                    $log.error('RTE Error: invalid customization attribute ' + attr.name);
                    continue;
                }
                var argName = attr.name.substring(0, separatorLocation);
                customizationArgsDict[argName] = HtmlEscaperService.escapedJsonToObj(attr.value);
            }
            return customizationArgsDict;
        };
        return {
            createCustomizationArgDictFromAttrs: function (attrs) {
                return _createCustomizationArgDictFromAttrs(attrs);
            },
            getRichTextComponents: function () {
                return angular.copy(_RICH_TEXT_COMPONENTS);
            },
            isInlineComponent: function (richTextComponent) {
                var inlineComponents = ['link', 'math'];
                return inlineComponents.indexOf(richTextComponent) !== -1;
            },
            // The refocusFn arg is a function that restores focus to the text editor
            // after exiting the modal, and moves the cursor back to where it was
            // before the modal was opened.
            _openCustomizationModal: function (customizationArgSpecs, attrsCustomizationArgsDict, onSubmitCallback, onDismissCallback, refocusFn) {
                $document[0].execCommand('enableObjectResizing', false, false);
                var modalDialog = $uibModal.open({
                    templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/forms-templates/' +
                        'customize-rte-component-modal.template.html'),
                    backdrop: 'static',
                    resolve: {},
                    controller: [
                        '$scope', '$uibModalInstance', '$timeout',
                        function ($scope, $uibModalInstance, $timeout) {
                            $scope.customizationArgSpecs = customizationArgSpecs;
                            // Without this code, the focus will remain in the background RTE
                            // even after the modal loads. This switches the focus to a
                            // temporary field in the modal which is then removed from the
                            // DOM.
                            // TODO(sll): Make this switch to the first input field in the
                            // modal instead.
                            $scope.modalIsLoading = true;
                            FocusManagerService.setFocus('tmpFocusPoint');
                            $timeout(function () {
                                $scope.modalIsLoading = false;
                            });
                            $scope.tmpCustomizationArgs = [];
                            for (var i = 0; i < customizationArgSpecs.length; i++) {
                                var caName = customizationArgSpecs[i].name;
                                $scope.tmpCustomizationArgs.push({
                                    name: caName,
                                    value: (attrsCustomizationArgsDict.hasOwnProperty(caName) ?
                                        angular.copy(attrsCustomizationArgsDict[caName]) :
                                        customizationArgSpecs[i].default_value)
                                });
                            }
                            $scope.cancel = function () {
                                $uibModalInstance.dismiss('cancel');
                            };
                            $scope.save = function () {
                                $scope.$broadcast('externalSave');
                                var customizationArgsDict = {};
                                for (var i = 0; i < $scope.tmpCustomizationArgs.length; i++) {
                                    var caName = $scope.tmpCustomizationArgs[i].name;
                                    customizationArgsDict[caName] = ($scope.tmpCustomizationArgs[i].value);
                                }
                                $uibModalInstance.close(customizationArgsDict);
                            };
                        }
                    ]
                });
                modalDialog.result.then(onSubmitCallback, onDismissCallback);
                // 'finally' is a JS keyword. If it is just used in its ".finally" form,
                // the minification process throws an error.
                modalDialog.result['finally'](refocusFn);
            }
        };
    }
]);


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jay1lZGl0b3ItaGVscGVycy9jay1lZGl0b3ItcnRlL2NrLWVkaXRvci1ydGUuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvY2stZWRpdG9yLWhlbHBlcnMvY2stZWRpdG9yLXdpZGdldHMvY2stZWRpdG9yLXdpZGdldHMuaW5pdGlhbGl6ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvbG9hZGluZy1kb3RzL2xvYWRpbmctZG90cy5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2VkaXRvci91bmRvX3JlZG8vUXVlc3Rpb25VbmRvUmVkb1NlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3N0b3J5L0VkaXRhYmxlU3RvcnlCYWNrZW5kQXBpU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vc3RvcnkvU3RvcnlDb250ZW50c09iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3N0b3J5L1N0b3J5Tm9kZU9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3N0b3J5L1N0b3J5T2JqZWN0RmFjdG9yeS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vc3RvcnkvU3RvcnlVcGRhdGVTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL21haW4tc3RvcnktZWRpdG9yL21haW4tc3RvcnktZWRpdG9yLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9zdG9yeS1lZGl0b3ItcGFnZS9tYWluLXN0b3J5LWVkaXRvci9zdG9yeS1ub2RlLWVkaXRvci9zdG9yeS1ub2RlLWVkaXRvci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvc3RvcnktZWRpdG9yLXBhZ2Uvc3RvcnktZWRpdG9yLW5hdmJhci1icmVhZGNydW1iL3N0b3J5LWVkaXRvci1uYXZiYXItYnJlYWRjcnVtYi5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvc3RvcnktZWRpdG9yLXBhZ2Uvc3RvcnktZWRpdG9yLW5hdmJhci9zdG9yeS1lZGl0b3ItbmF2YmFyLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9zdG9yeS1lZGl0b3ItcGFnZS9zdG9yeS1lZGl0b3ItcGFnZS5jb250cm9sbGVyLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL3N0b3J5LWVkaXRvci1zZXJ2aWNlcy9zdG9yeS1lZGl0b3Itc3RhdGUvc3RvcnktZWRpdG9yLXN0YXRlLnNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvR2VuZXJhdGVDb250ZW50SWRTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL1J0ZUhlbHBlclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0JBQVEsb0JBQW9CO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQWlCLDRCQUE0QjtBQUM3QztBQUNBO0FBQ0EsMEJBQWtCLDJCQUEyQjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxrREFBMEMsZ0NBQWdDO0FBQzFFO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0VBQXdELGtCQUFrQjtBQUMxRTtBQUNBLHlEQUFpRCxjQUFjO0FBQy9EOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpREFBeUMsaUNBQWlDO0FBQzFFLHdIQUFnSCxtQkFBbUIsRUFBRTtBQUNySTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1DQUEyQiwwQkFBMEIsRUFBRTtBQUN2RCx5Q0FBaUMsZUFBZTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4REFBc0QsK0RBQStEOztBQUVySDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQWdCLHVCQUF1QjtBQUN2Qzs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsd0ZBQTRCO0FBQ3BDLG1CQUFPLENBQUMsNEZBQThCO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUIsc0JBQXNCO0FBQ3ZDO0FBQ0E7QUFDQSxxREFBcUQ7QUFDckQ7QUFDQTtBQUNBLGtGQUFrRjtBQUNsRjtBQUNBO0FBQ0EsMEVBQTBFO0FBQzFFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQixpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0EsZ0RBQWdELE9BQU87QUFDdkQsc0VBQXNFLE9BQU87QUFDN0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQzdOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxnR0FBZ0M7QUFDeEMsbUJBQU8sQ0FBQyw0RkFBOEI7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlDQUF5QztBQUN6QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUNBQWlDO0FBQ2pDLDZCQUE2QixlQUFlLEVBQUUsZUFBZSxFQUFFO0FBQy9ELHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3Qix5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQSxxQkFBcUI7QUFDckI7QUFDQSxhQUFhO0FBQ2IsU0FBUztBQUNUO0FBQ0E7Ozs7Ozs7Ozs7OztBQzdLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQSxzQ0FBc0MsRUFBRTtBQUN4QztBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsZ0hBQXdDO0FBQ2hELG1CQUFPLENBQUMsa0pBQzZCO0FBQ3JDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkIsa0JBQWtCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQixrQkFBa0I7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtCQUErQixvQkFBb0I7QUFDbkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQixrQkFBa0I7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiLDJCQUEyQixvQkFBb0I7QUFDL0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkIsa0JBQWtCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0JBQStCLDZDQUE2QztBQUM1RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLG1DQUFtQyxnREFBZ0Q7QUFDbkY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBLCtCQUErQiwwQkFBMEI7QUFDekQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQix3QkFBd0I7QUFDbkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLHdCQUF3QjtBQUNuRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0JBQStCLHdCQUF3QjtBQUN2RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkIsNkNBQTZDO0FBQ3hFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUN2VUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsa0pBQXlEO0FBQ2pFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLGlDQUFpQztBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQiw2QkFBNkI7QUFDeEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkIsaUNBQWlDO0FBQzVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQiwrQkFBK0I7QUFDMUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSwyQkFBMkIsK0JBQStCO0FBQzFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDOUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLHdIQUE0QztBQUNwRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxnSUFBZ0Q7QUFDeEQsbUJBQU8sQ0FBQyx3SEFBNEM7QUFDcEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUM3WkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLHdOQUM4QjtBQUN0QyxtQkFBTyxDQUFDLGdIQUF3QztBQUNoRCxtQkFBTyxDQUFDLHdOQUM0QjtBQUNwQyxtQkFBTyxDQUFDLHdIQUE0QztBQUNwRCxtQkFBTyxDQUFDLHdHQUFvQztBQUM1QyxtQkFBTyxDQUFDLGdPQUMyQjtBQUNuQyxtQkFBTyxDQUFDLHNGQUEyQjtBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyx3SEFBNEM7QUFDcEQsbUJBQU8sQ0FBQyx3R0FBb0M7QUFDNUMsbUJBQU8sQ0FBQyxnT0FDMkI7QUFDbkMsbUJBQU8sQ0FBQyxzRkFBMkI7QUFDbkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBdUMsZ0NBQWdDO0FBQ3ZFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNwT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLHdIQUE0QztBQUNwRCxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRCxtQkFBTyxDQUFDLGdPQUMyQjtBQUNuQyxtQkFBTyxDQUFDLG9MQUM0QjtBQUNwQyxtQkFBTyxDQUFDLHNHQUFtQztBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxnSUFBZ0Q7QUFDeEQsbUJBQU8sQ0FBQyx3SEFBNEM7QUFDcEQsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQsbUJBQU8sQ0FBQyxnT0FDMkI7QUFDbkMsbUJBQU8sQ0FBQyxzRkFBMkI7QUFDbkMsbUJBQU8sQ0FBQyxzR0FBbUM7QUFDM0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDhLQUF1RTtBQUMvRSxtQkFBTyxDQUFDLGtNQUM4QjtBQUN0QyxtQkFBTyxDQUFDLDRNQUMyQztBQUNuRCxtQkFBTyxDQUFDLG9MQUEwRTtBQUNsRixtQkFBTyxDQUFDLG9MQUEwRTtBQUNsRixtQkFBTyxDQUFDLGtKQUF5RDtBQUNqRSxtQkFBTyxDQUFDLGdKQUF3RDtBQUNoRSxtQkFBTyxDQUFDLDRJQUFzRDtBQUM5RCxtQkFBTyxDQUFDLGdKQUF3RDtBQUNoRSxtQkFBTyxDQUFDLGtKQUF5RDtBQUNqRSxtQkFBTyxDQUFDLG9NQUMyQjtBQUNuQyxtQkFBTyxDQUFDLG9NQUMyQjtBQUNuQyxtQkFBTyxDQUFDLGdIQUF3QztBQUNoRCxtQkFBTyxDQUFDLHdHQUFvQztBQUM1QyxtQkFBTyxDQUFDLDRSQUNnRTtBQUN4RSxtQkFBTyxDQUFDLG9SQUM0RDtBQUNwRSxtQkFBTyxDQUFDLHdOQUM4QjtBQUN0QyxtQkFBTyxDQUFDLG9RQUN5QztBQUNqRCxtQkFBTyxDQUFDLHdSQUM4RDtBQUN0RSxtQkFBTyxDQUFDLG9SQUM0RDtBQUNwRSxtQkFBTyxDQUFDLGdSQUMwRDtBQUNsRSxtQkFBTyxDQUFDLG9SQUM0RDtBQUNwRSxtQkFBTyxDQUFDLGdTQUNrRTtBQUMxRSxtQkFBTyxDQUFDLDBLQUFxRTtBQUM3RSxtQkFBTyxDQUFDLHNLQUFtRTtBQUMzRSxtQkFBTyxDQUFDLHNLQUFtRTtBQUMzRSxtQkFBTyxDQUFDLHNLQUFtRTtBQUMzRSxtQkFBTyxDQUFDLGdMQUF3RTtBQUNoRixtQkFBTyxDQUFDLDRLQUFzRTtBQUM5RSxtQkFBTyxDQUFDLDhKQUErRDtBQUN2RSxtQkFBTyxDQUFDLGdHQUFnQztBQUN4QyxtQkFBTyxDQUFDLGtHQUFpQztBQUN6QyxtQkFBTyxDQUFDLDRGQUE4QjtBQUN0QyxtQkFBTyxDQUFDLDhHQUF1QztBQUMvQyxtQkFBTyxDQUFDLDhIQUErQztBQUN2RCxtQkFBTyxDQUFDLDhKQUErRDtBQUN2RSxtQkFBTyxDQUFDLDRHQUFzQztBQUM5QyxtQkFBTyxDQUFDLHdMQUN1QjtBQUMvQixtQkFBTyxDQUFDLGdJQUFnRDtBQUN4RCxtQkFBTyxDQUFDLHdIQUE0QztBQUNwRCxtQkFBTyxDQUFDLHdJQUFvRDtBQUM1RCxtQkFBTyxDQUFDLGdJQUFnRDtBQUN4RCxtQkFBTyxDQUFDLGdJQUFnRDtBQUN4RCxtQkFBTyxDQUFDLHdHQUFvQztBQUM1QyxtQkFBTyxDQUFDLHdIQUE0QztBQUNwRCxtQkFBTyxDQUFDLGdIQUF3QztBQUNoRCxtQkFBTyxDQUFDLHdHQUFvQztBQUM1QztBQUNBLG1CQUFPLENBQUMsd09BQ3lDO0FBQ2pELG1CQUFPLENBQUMsNExBQzhCO0FBQ3RDLG1CQUFPLENBQUMsb0xBQzRCO0FBQ3BDLG1CQUFPLENBQUMsd0hBQTRDO0FBQ3BELG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JELG1CQUFPLENBQUMsZ09BQzJCO0FBQ25DLG1CQUFPLENBQUMsc0dBQW1DO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUMxSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyx3SEFBNEM7QUFDcEQsbUJBQU8sQ0FBQyxnSUFBZ0Q7QUFDeEQsbUJBQU8sQ0FBQyx3R0FBb0M7QUFDNUMsbUJBQU8sQ0FBQyxzRkFBMkI7QUFDbkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUM5SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsU0FBUztBQUNUO0FBQ0E7QUFDQSwyQkFBMkIsa0JBQWtCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0I7QUFDL0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBLDJDQUEyQyxrQ0FBa0M7QUFDN0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUNBQWlDO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0NBQStDLHdDQUF3QztBQUN2RjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InN0b3J5X2VkaXRvci5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBpbnN0YWxsIGEgSlNPTlAgY2FsbGJhY2sgZm9yIGNodW5rIGxvYWRpbmdcbiBcdGZ1bmN0aW9uIHdlYnBhY2tKc29ucENhbGxiYWNrKGRhdGEpIHtcbiBcdFx0dmFyIGNodW5rSWRzID0gZGF0YVswXTtcbiBcdFx0dmFyIG1vcmVNb2R1bGVzID0gZGF0YVsxXTtcbiBcdFx0dmFyIGV4ZWN1dGVNb2R1bGVzID0gZGF0YVsyXTtcblxuIFx0XHQvLyBhZGQgXCJtb3JlTW9kdWxlc1wiIHRvIHRoZSBtb2R1bGVzIG9iamVjdCxcbiBcdFx0Ly8gdGhlbiBmbGFnIGFsbCBcImNodW5rSWRzXCIgYXMgbG9hZGVkIGFuZCBmaXJlIGNhbGxiYWNrXG4gXHRcdHZhciBtb2R1bGVJZCwgY2h1bmtJZCwgaSA9IDAsIHJlc29sdmVzID0gW107XG4gXHRcdGZvcig7aSA8IGNodW5rSWRzLmxlbmd0aDsgaSsrKSB7XG4gXHRcdFx0Y2h1bmtJZCA9IGNodW5rSWRzW2ldO1xuIFx0XHRcdGlmKGluc3RhbGxlZENodW5rc1tjaHVua0lkXSkge1xuIFx0XHRcdFx0cmVzb2x2ZXMucHVzaChpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF1bMF0pO1xuIFx0XHRcdH1cbiBcdFx0XHRpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0gPSAwO1xuIFx0XHR9XG4gXHRcdGZvcihtb2R1bGVJZCBpbiBtb3JlTW9kdWxlcykge1xuIFx0XHRcdGlmKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtb3JlTW9kdWxlcywgbW9kdWxlSWQpKSB7XG4gXHRcdFx0XHRtb2R1bGVzW21vZHVsZUlkXSA9IG1vcmVNb2R1bGVzW21vZHVsZUlkXTtcbiBcdFx0XHR9XG4gXHRcdH1cbiBcdFx0aWYocGFyZW50SnNvbnBGdW5jdGlvbikgcGFyZW50SnNvbnBGdW5jdGlvbihkYXRhKTtcblxuIFx0XHR3aGlsZShyZXNvbHZlcy5sZW5ndGgpIHtcbiBcdFx0XHRyZXNvbHZlcy5zaGlmdCgpKCk7XG4gXHRcdH1cblxuIFx0XHQvLyBhZGQgZW50cnkgbW9kdWxlcyBmcm9tIGxvYWRlZCBjaHVuayB0byBkZWZlcnJlZCBsaXN0XG4gXHRcdGRlZmVycmVkTW9kdWxlcy5wdXNoLmFwcGx5KGRlZmVycmVkTW9kdWxlcywgZXhlY3V0ZU1vZHVsZXMgfHwgW10pO1xuXG4gXHRcdC8vIHJ1biBkZWZlcnJlZCBtb2R1bGVzIHdoZW4gYWxsIGNodW5rcyByZWFkeVxuIFx0XHRyZXR1cm4gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKTtcbiBcdH07XG4gXHRmdW5jdGlvbiBjaGVja0RlZmVycmVkTW9kdWxlcygpIHtcbiBcdFx0dmFyIHJlc3VsdDtcbiBcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGRlZmVycmVkTW9kdWxlcy5sZW5ndGg7IGkrKykge1xuIFx0XHRcdHZhciBkZWZlcnJlZE1vZHVsZSA9IGRlZmVycmVkTW9kdWxlc1tpXTtcbiBcdFx0XHR2YXIgZnVsZmlsbGVkID0gdHJ1ZTtcbiBcdFx0XHRmb3IodmFyIGogPSAxOyBqIDwgZGVmZXJyZWRNb2R1bGUubGVuZ3RoOyBqKyspIHtcbiBcdFx0XHRcdHZhciBkZXBJZCA9IGRlZmVycmVkTW9kdWxlW2pdO1xuIFx0XHRcdFx0aWYoaW5zdGFsbGVkQ2h1bmtzW2RlcElkXSAhPT0gMCkgZnVsZmlsbGVkID0gZmFsc2U7XG4gXHRcdFx0fVxuIFx0XHRcdGlmKGZ1bGZpbGxlZCkge1xuIFx0XHRcdFx0ZGVmZXJyZWRNb2R1bGVzLnNwbGljZShpLS0sIDEpO1xuIFx0XHRcdFx0cmVzdWx0ID0gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSBkZWZlcnJlZE1vZHVsZVswXSk7XG4gXHRcdFx0fVxuIFx0XHR9XG4gXHRcdHJldHVybiByZXN1bHQ7XG4gXHR9XG5cbiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIG9iamVjdCB0byBzdG9yZSBsb2FkZWQgYW5kIGxvYWRpbmcgY2h1bmtzXG4gXHQvLyB1bmRlZmluZWQgPSBjaHVuayBub3QgbG9hZGVkLCBudWxsID0gY2h1bmsgcHJlbG9hZGVkL3ByZWZldGNoZWRcbiBcdC8vIFByb21pc2UgPSBjaHVuayBsb2FkaW5nLCAwID0gY2h1bmsgbG9hZGVkXG4gXHR2YXIgaW5zdGFsbGVkQ2h1bmtzID0ge1xuIFx0XHRcInN0b3J5X2VkaXRvclwiOiAwXG4gXHR9O1xuXG4gXHR2YXIgZGVmZXJyZWRNb2R1bGVzID0gW107XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGdldHRlciB9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuIFx0XHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbiBcdFx0fVxuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuIFx0fTtcblxuIFx0Ly8gY3JlYXRlIGEgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XG4gXHQvLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbiBcdC8vIG1vZGUgJiAyOiBtZXJnZSBhbGwgcHJvcGVydGllcyBvZiB2YWx1ZSBpbnRvIHRoZSBuc1xuIFx0Ly8gbW9kZSAmIDQ6IHJldHVybiB2YWx1ZSB3aGVuIGFscmVhZHkgbnMgb2JqZWN0XG4gXHQvLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnQgPSBmdW5jdGlvbih2YWx1ZSwgbW9kZSkge1xuIFx0XHRpZihtb2RlICYgMSkgdmFsdWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKHZhbHVlKTtcbiBcdFx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcbiBcdFx0aWYoKG1vZGUgJiA0KSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmIHZhbHVlLl9fZXNNb2R1bGUpIHJldHVybiB2YWx1ZTtcbiBcdFx0dmFyIG5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG5zLCAnZGVmYXVsdCcsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHZhbHVlIH0pO1xuIFx0XHRpZihtb2RlICYgMiAmJiB0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIGZvcih2YXIga2V5IGluIHZhbHVlKSBfX3dlYnBhY2tfcmVxdWlyZV9fLmQobnMsIGtleSwgZnVuY3Rpb24oa2V5KSB7IHJldHVybiB2YWx1ZVtrZXldOyB9LmJpbmQobnVsbCwga2V5KSk7XG4gXHRcdHJldHVybiBucztcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdHZhciBqc29ucEFycmF5ID0gd2luZG93W1wid2VicGFja0pzb25wXCJdID0gd2luZG93W1wid2VicGFja0pzb25wXCJdIHx8IFtdO1xuIFx0dmFyIG9sZEpzb25wRnVuY3Rpb24gPSBqc29ucEFycmF5LnB1c2guYmluZChqc29ucEFycmF5KTtcbiBcdGpzb25wQXJyYXkucHVzaCA9IHdlYnBhY2tKc29ucENhbGxiYWNrO1xuIFx0anNvbnBBcnJheSA9IGpzb25wQXJyYXkuc2xpY2UoKTtcbiBcdGZvcih2YXIgaSA9IDA7IGkgPCBqc29ucEFycmF5Lmxlbmd0aDsgaSsrKSB3ZWJwYWNrSnNvbnBDYWxsYmFjayhqc29ucEFycmF5W2ldKTtcbiBcdHZhciBwYXJlbnRKc29ucEZ1bmN0aW9uID0gb2xkSnNvbnBGdW5jdGlvbjtcblxuXG4gXHQvLyBhZGQgZW50cnkgbW9kdWxlIHRvIGRlZmVycmVkIGxpc3RcbiBcdGRlZmVycmVkTW9kdWxlcy5wdXNoKFtcIi4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvc3RvcnktZWRpdG9yLXBhZ2Uvc3RvcnktZWRpdG9yLXBhZ2UuY29udHJvbGxlci50c1wiLFwiYWJvdXR+YWRtaW5+YXBwfmNvbGxlY3Rpb25fZWRpdG9yfmNvbGxlY3Rpb25fcGxheWVyfmNvbnRhY3R+Y3JlYXRvcl9kYXNoYm9hcmR+ZG9uYXRlfmVtYWlsX2Rhc2hib2FyZH5jMWU1MGNjMFwiLFwiYWRtaW5+YXBwfmNvbGxlY3Rpb25fZWRpdG9yfmNyZWF0b3JfZGFzaGJvYXJkfmV4cGxvcmF0aW9uX2VkaXRvcn5leHBsb3JhdGlvbl9wbGF5ZXJ+c2tpbGxfZWRpdG9yfnN0b343YzVlMDM2YVwiLFwiYWRtaW5+Y3JlYXRvcl9kYXNoYm9hcmR+ZXhwbG9yYXRpb25fZWRpdG9yfmV4cGxvcmF0aW9uX3BsYXllcn5tb2RlcmF0b3J+c2tpbGxfZWRpdG9yfnN0b3J5X2VkaXRvcn50b34zZjZlZjczOFwiLFwiY3JlYXRvcl9kYXNoYm9hcmR+ZXhwbG9yYXRpb25fZWRpdG9yfmV4cGxvcmF0aW9uX3BsYXllcn5za2lsbF9lZGl0b3J+c3RvcnlfZWRpdG9yfnRvcGljX2VkaXRvclwiLFwiY29sbGVjdGlvbl9lZGl0b3J+c2tpbGxfZWRpdG9yfnN0b3J5X2VkaXRvcn50b3BpY19lZGl0b3JcIl0pO1xuIFx0Ly8gcnVuIGRlZmVycmVkIG1vZHVsZXMgd2hlbiByZWFkeVxuIFx0cmV0dXJuIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZGFsIGFuZCBmdW5jdGlvbmFsaXR5IGZvciB0aGUgY3JlYXRlIHN0b3J5IGJ1dHRvbi5cbiAqL1xucmVxdWlyZSgnc2VydmljZXMvQ29udGV4dFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1J0ZUhlbHBlclNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdja0VkaXRvclJ0ZU1vZHVsZScpLmRpcmVjdGl2ZSgnY2tFZGl0b3JSdGUnLCBbXG4gICAgJ0NvbnRleHRTZXJ2aWNlJywgJ1J0ZUhlbHBlclNlcnZpY2UnLCAnUEFHRV9DT05URVhUJyxcbiAgICBmdW5jdGlvbiAoQ29udGV4dFNlcnZpY2UsIFJ0ZUhlbHBlclNlcnZpY2UsIFBBR0VfQ09OVEVYVCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgdWlDb25maWc6ICcmJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlOiAnPGRpdj48ZGl2PjwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNvbnRlbnRlZGl0YWJsZT1cInRydWVcIiBjbGFzcz1cIm9wcGlhLXJ0ZVwiPicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj48L2Rpdj4nLFxuICAgICAgICAgICAgcmVxdWlyZTogJz9uZ01vZGVsJyxcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWwsIGF0dHIsIG5nTW9kZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgX1JJQ0hfVEVYVF9DT01QT05FTlRTID0gUnRlSGVscGVyU2VydmljZS5nZXRSaWNoVGV4dENvbXBvbmVudHMoKTtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZXMgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgaWNvbnMgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgY2FuVXNlRnMgPSBDb250ZXh0U2VydmljZS5nZXRQYWdlQ29udGV4dCgpID09PVxuICAgICAgICAgICAgICAgICAgICBQQUdFX0NPTlRFWFQuRVhQTE9SQVRJT05fRURJVE9SO1xuICAgICAgICAgICAgICAgIF9SSUNIX1RFWFRfQ09NUE9ORU5UUy5mb3JFYWNoKGZ1bmN0aW9uIChjb21wb25lbnREZWZuKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghKChzY29wZS51aUNvbmZpZygpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS51aUNvbmZpZygpLmhpZGVfY29tcGxleF9leHRlbnNpb25zICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnREZWZuLmlzQ29tcGxleCkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICghY2FuVXNlRnMgJiYgY29tcG9uZW50RGVmbi5yZXF1aXJlc0ZzKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVzLnB1c2goY29tcG9uZW50RGVmbi5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpY29ucy5wdXNoKGNvbXBvbmVudERlZm4uaWNvbkRhdGFVcmwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQ3JlYXRlIHJ1bGVzIHRvIHdoaXRlbGlzdCBhbGwgdGhlIHJpY2ggdGV4dCBjb21wb25lbnRzIGFuZFxuICAgICAgICAgICAgICAgICAqIHRoZWlyIHdyYXBwZXJzIGFuZCBvdmVybGF5cy5cbiAgICAgICAgICAgICAgICAgKiBTZWUgZm9ybWF0IG9mIGZpbHRlcmluZyBydWxlcyBoZXJlOlxuICAgICAgICAgICAgICAgICAqIGh0dHA6Ly9kb2NzLmNrZWRpdG9yLmNvbS8jIS9ndWlkZS9kZXZfYWxsb3dlZF9jb250ZW50X3J1bGVzXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgLy8gV2hpdGVsaXN0IHRoZSBjb21wb25lbnQgdGFncyB3aXRoIGFueSBhdHRyaWJ1dGVzIGFuZCBjbGFzc2VzLlxuICAgICAgICAgICAgICAgIHZhciBjb21wb25lbnRSdWxlID0gbmFtZXMubWFwKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnb3BwaWEtbm9uaW50ZXJhY3RpdmUtJyArIG5hbWU7XG4gICAgICAgICAgICAgICAgfSkuam9pbignICcpICsgJygqKVsqXTsnO1xuICAgICAgICAgICAgICAgIC8vIFdoaXRlbGlzdCB0aGUgaW5saW5lIGNvbXBvbmVudCB3cmFwcGVyLCB3aGljaCBpcyBhXG4gICAgICAgICAgICAgICAgLy8gc3BhbiB3aXRoIGEgXCJ0eXBlXCIgYXR0cmlidXRlLlxuICAgICAgICAgICAgICAgIHZhciBpbmxpbmVXcmFwcGVyUnVsZSA9ICcgc3Bhblt0eXBlXTsnO1xuICAgICAgICAgICAgICAgIC8vIFdoaXRlbGlzdCB0aGUgYmxvY2sgY29tcG9uZW50IHdyYXBwZXIsIHdoaWNoIGlzIGEgZGl2XG4gICAgICAgICAgICAgICAgLy8gd2l0aCBhIFwidHlwZVwiIGF0dHJpYnV0ZSBhbmQgYSBDU1MgY2xhc3MuXG4gICAgICAgICAgICAgICAgdmFyIGJsb2NrV3JhcHBlclJ1bGUgPSAnIGRpdihvcHBpYS1ydGUtY29tcG9uZW50LWNvbnRhaW5lcilbdHlwZV07JztcbiAgICAgICAgICAgICAgICAvLyBXaGl0ZWxpc3QgdGhlIHRyYW5zcGFyZW50IGJsb2NrIGNvbXBvbmVudCBvdmVybGF5LCB3aGljaCBpc1xuICAgICAgICAgICAgICAgIC8vIGEgZGl2IHdpdGggYSBDU1MgY2xhc3MuXG4gICAgICAgICAgICAgICAgdmFyIGJsb2NrT3ZlcmxheVJ1bGUgPSAnIGRpdihvcHBpYS1ydGUtY29tcG9uZW50LW92ZXJsYXkpOyc7XG4gICAgICAgICAgICAgICAgLy8gUHV0IGFsbCB0aGUgcnVsZXMgdG9nZXRoZXIuXG4gICAgICAgICAgICAgICAgdmFyIGV4dHJhQWxsb3dlZENvbnRlbnRSdWxlcyA9IGNvbXBvbmVudFJ1bGUgK1xuICAgICAgICAgICAgICAgICAgICBpbmxpbmVXcmFwcGVyUnVsZSArXG4gICAgICAgICAgICAgICAgICAgIGJsb2NrV3JhcHBlclJ1bGUgK1xuICAgICAgICAgICAgICAgICAgICBibG9ja092ZXJsYXlSdWxlO1xuICAgICAgICAgICAgICAgIHZhciBwbHVnaW5OYW1lcyA9IG5hbWVzLm1hcChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ29wcGlhJyArIG5hbWU7XG4gICAgICAgICAgICAgICAgfSkuam9pbignLCcpO1xuICAgICAgICAgICAgICAgIHZhciBidXR0b25OYW1lcyA9IFtdO1xuICAgICAgICAgICAgICAgIG5hbWVzLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uTmFtZXMucHVzaCgnT3BwaWEnICsgbmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbk5hbWVzLnB1c2goJy0nKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBidXR0b25OYW1lcy5wb3AoKTtcbiAgICAgICAgICAgICAgICAvLyBBbGwgaWNvbnMgb24gdGhlIHRvb2xiYXIgZXhjZXB0IHRoZSBSaWNoIFRleHQgY29tcG9uZW50cy5cbiAgICAgICAgICAgICAgICB2YXIgYWxsSWNvbnMgPSBbJ3VuZG8nLCAncmVkbycsICdib2xkJywgJ0l0YWxpYycsICdudW1iZXJlZExpc3QnLFxuICAgICAgICAgICAgICAgICAgICAnYnVsbGV0ZWRMaXN0JywgJ3ByZScsICdpbmRlbnQnLCAnb3V0ZGVudCddO1xuICAgICAgICAgICAgICAgIC8vIEFkZCBleHRlcm5hbCBwbHVnaW5zLlxuICAgICAgICAgICAgICAgIENLRURJVE9SLnBsdWdpbnMuYWRkRXh0ZXJuYWwoJ3NoYXJlZHNwYWNlJywgJy90aGlyZF9wYXJ0eS9zdGF0aWMvY2tlZGl0b3Itc2hhcmVkc3BhY2UtNC45LjIvJywgJ3BsdWdpbi5qcycpO1xuICAgICAgICAgICAgICAgIC8vIFByZSBwbHVnaW4gaXMgbm90IGF2YWlsYWJsZSBmb3IgNC45LjIgdmVyc2lvbiBvZiBDS0VkaXRvci4gVGhpcyBpc1xuICAgICAgICAgICAgICAgIC8vIGEgc2VsZiBjcmVhdGVkIHBsdWdpbiAob3RoZXIgcGx1Z2lucyBhcmUgcHJvdmlkZWQgYnkgQ0tFZGl0b3IpLlxuICAgICAgICAgICAgICAgIENLRURJVE9SLnBsdWdpbnMuYWRkRXh0ZXJuYWwoJ3ByZScsICcvZXh0ZW5zaW9ucy9ja2VkaXRvcl9wbHVnaW5zL3ByZS8nLCAncGx1Z2luLmpzJyk7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0dXBGb2N1c0VuYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlmIChzY29wZS51aUNvbmZpZygpICYmXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVpQ29uZmlnKCkuc3RhcnR1cEZvY3VzRW5hYmxlZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0dXBGb2N1c0VuYWJsZWQgPSBzY29wZS51aUNvbmZpZygpLnN0YXJ0dXBGb2N1c0VuYWJsZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEluaXRpYWxpemUgQ0tFZGl0b3IuXG4gICAgICAgICAgICAgICAgdmFyIGNrID0gQ0tFRElUT1IuaW5saW5lKChlbFswXS5jaGlsZHJlblswXS5jaGlsZHJlblsxXSksIHtcbiAgICAgICAgICAgICAgICAgICAgZXh0cmFQbHVnaW5zOiAncHJlLHNoYXJlZHNwYWNlLCcgKyBwbHVnaW5OYW1lcyxcbiAgICAgICAgICAgICAgICAgICAgc3RhcnR1cEZvY3VzOiBzdGFydHVwRm9jdXNFbmFibGVkLFxuICAgICAgICAgICAgICAgICAgICByZW1vdmVQbHVnaW5zOiAnaW5kZW50YmxvY2snLFxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGZsb2F0U3BhY2VEb2NrZWRPZmZzZXRZOiAxNSxcbiAgICAgICAgICAgICAgICAgICAgZXh0cmFBbGxvd2VkQ29udGVudDogZXh0cmFBbGxvd2VkQ29udGVudFJ1bGVzLFxuICAgICAgICAgICAgICAgICAgICBzaGFyZWRTcGFjZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogZWxbMF0uY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgc2tpbjogJ2Jvb3RzdHJhcGNrLC90aGlyZF9wYXJ0eS9zdGF0aWMvY2tlZGl0b3ItYm9vdHN0cmFwY2stMS4wLycsXG4gICAgICAgICAgICAgICAgICAgIHRvb2xiYXI6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnYmFzaWNzdHlsZXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiBbJ0JvbGQnLCAnLScsICdJdGFsaWMnXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAncGFyYWdyYXBoJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtczogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnTnVtYmVyZWRMaXN0JywgJy0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnQnVsbGV0ZWRMaXN0JywgJy0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnUHJlJywgJy0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnQmxvY2txdW90ZScsICctJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0luZGVudCcsICctJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ091dGRlbnQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAncnRlY29tcG9uZW50cycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IGJ1dHRvbk5hbWVzXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdkb2N1bWVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IFsnU291cmNlJ11cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIC8vIEEgUmVnRXhwIGZvciBtYXRjaGluZyByaWNoIHRleHQgY29tcG9uZW50cy5cbiAgICAgICAgICAgICAgICB2YXIgY29tcG9uZW50UmUgPSAoLyg8KG9wcGlhLW5vbmludGVyYWN0aXZlLSguKz8pKVxcYltePl0qPilbXFxzXFxTXSo/PFxcL1xcMj4vZyk7XG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogQmVmb3JlIGRhdGEgaXMgbG9hZGVkIGludG8gQ0tFZGl0b3IsIHdlIG5lZWQgdG8gd3JhcCBldmVyeSBydGVcbiAgICAgICAgICAgICAgICAgKiBjb21wb25lbnQgaW4gYSBzcGFuIChpbmxpbmUpIG9yIGRpdiAoYmxvY2spLlxuICAgICAgICAgICAgICAgICAqIEZvciBibG9jayBlbGVtZW50cywgd2UgYWRkIGFuIG92ZXJsYXkgZGl2IGFzIHdlbGwuXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgdmFyIHdyYXBDb21wb25lbnRzID0gZnVuY3Rpb24gKGh0bWwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGh0bWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGh0bWwucmVwbGFjZShjb21wb25lbnRSZSwgZnVuY3Rpb24gKG1hdGNoLCBwMSwgcDIsIHAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoUnRlSGVscGVyU2VydmljZS5pc0lubGluZUNvbXBvbmVudChwMykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJzxzcGFuIHR5cGU9XCJvcHBpYS1ub25pbnRlcmFjdGl2ZS0nICsgcDMgKyAnXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoICsgJzwvc3Bhbj4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICc8ZGl2IHR5cGU9XCJvcHBpYS1ub25pbnRlcmFjdGl2ZS0nICsgcDMgKyAnXCInICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2NsYXNzPVwib3BwaWEtcnRlLWNvbXBvbmVudC1jb250YWluZXJcIj4nICsgbWF0Y2ggK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBjay5vbignaW5zdGFuY2VSZWFkeScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gU2V0IHRoZSBjc3MgYW5kIGljb25zIGZvciBlYWNoIHRvb2xiYXIgYnV0dG9uLlxuICAgICAgICAgICAgICAgICAgICBuYW1lcy5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lLCBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGljb24gPSBpY29uc1tpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdXBwZXJDYXNlZE5hbWUgPSBuYW1lLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgbmFtZS5zbGljZSgxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJy5ja2VfYnV0dG9uX19vcHBpYScgKyBuYW1lKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jc3MoJ2JhY2tncm91bmQtaW1hZ2UnLCAndXJsKFwiL2V4dGVuc2lvbnMnICsgaWNvbiArICdcIiknKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jc3MoJ2JhY2tncm91bmQtcG9zaXRpb24nLCAnY2VudGVyJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY3NzKCdiYWNrZ3JvdW5kLXJlcGVhdCcsICduby1yZXBlYXQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jc3MoJ2hlaWdodCcsICcyNHB4JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY3NzKCd3aWR0aCcsICcyNHB4JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY3NzKCdwYWRkaW5nJywgJzBweCAwcHgnKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICQoJy5ja2VfdG9vbGJhcl9zZXBhcmF0b3InKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNzcygnaGVpZ2h0JywgJzIycHgnKTtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmNrZV9idXR0b25faWNvbicpXG4gICAgICAgICAgICAgICAgICAgICAgICAuY3NzKCdoZWlnaHQnLCAnMjRweCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAuY3NzKCd3aWR0aCcsICcyNHB4Jyk7XG4gICAgICAgICAgICAgICAgICAgIGNrLnNldERhdGEod3JhcENvbXBvbmVudHMobmdNb2RlbC4kdmlld1ZhbHVlKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgLy8gQW5ndWxhciByZW5kZXJpbmcgb2YgY29tcG9uZW50cyBjb25mdXNlcyBDS0VkaXRvcidzIHVuZG8gc3lzdGVtLCBzb1xuICAgICAgICAgICAgICAgIC8vIHdlIGhpZGUgYWxsIG9mIHRoYXQgc3R1ZmYgYXdheSBmcm9tIENLRWRpdG9yLlxuICAgICAgICAgICAgICAgIGNrLm9uKCdnZXRTbmFwc2hvdCcsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQuZGF0YSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuZGF0YSA9IGV2ZW50LmRhdGEucmVwbGFjZShjb21wb25lbnRSZSwgZnVuY3Rpb24gKG1hdGNoLCBwMSwgcDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwMSArICc8LycgKyBwMiArICc+JztcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSwgbnVsbCwgbnVsbCwgMjApO1xuICAgICAgICAgICAgICAgIGNrLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBlbHQgPSAkKCc8ZGl2PicgKyBjay5nZXREYXRhKCkgKyAnPC9kaXY+Jyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZXh0RWx0ID0gZWx0WzBdLmNoaWxkTm9kZXM7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSB0ZXh0RWx0Lmxlbmd0aDsgaSA+IDA7IGktLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IHRleHRFbHRbaSAtIDFdLmNoaWxkTm9kZXMubGVuZ3RoOyBqID4gMDsgai0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRleHRFbHRbaSAtIDFdLmNoaWxkTm9kZXNbaiAtIDFdLm5vZGVOYW1lID09PSAnQlInIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh0ZXh0RWx0W2kgLSAxXS5jaGlsZE5vZGVzW2ogLSAxXS5ub2RlTmFtZSA9PT0gJyN0ZXh0JyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dEVsdFtpIC0gMV0uY2hpbGROb2Rlc1tqIC0gMV0ubm9kZVZhbHVlLnRyaW0oKSA9PT0gJycpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRFbHRbaSAtIDFdLmNoaWxkTm9kZXNbaiAtIDFdLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRleHRFbHRbaSAtIDFdLmNoaWxkTm9kZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRleHRFbHRbaSAtIDFdLm5vZGVOYW1lID09PSAnQlInIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh0ZXh0RWx0W2kgLSAxXS5ub2RlTmFtZSA9PT0gJyN0ZXh0JyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dEVsdFtpIC0gMV0ubm9kZVZhbHVlLnRyaW0oKSA9PT0gJycpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRFbHRbaSAtIDFdLm5vZGVOYW1lID09PSAnUCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dEVsdFtpIC0gMV0ucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG5nTW9kZWwuJHNldFZpZXdWYWx1ZShlbHQuaHRtbCgpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBuZ01vZGVsLiRyZW5kZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNrLnNldERhdGEobmdNb2RlbC4kdmlld1ZhbHVlKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIENsZWFuIHVwIENLRWRpdG9yIGluc3RhbmNlIHdoZW4gZGlyZWN0aXZlIGlzIHJlbW92ZWQuXG4gICAgICAgICAgICAgICAgICAgIGNrLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29kZSB0byBkeW5hbWljYWxseSBnZW5lcmF0ZSBDS0VkaXRvciB3aWRnZXRzIGZvciB0aGUgcmljaFxuICogdGV4dCBjb21wb25lbnRzLlxuICovXG5yZXF1aXJlKCdzZXJ2aWNlcy9IdG1sRXNjYXBlclNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1J0ZUhlbHBlclNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdja0VkaXRvcldpZGdldHNNb2R1bGUnKS5ydW4oW1xuICAgICckdGltZW91dCcsICckY29tcGlsZScsICckcm9vdFNjb3BlJywgJyR1aWJNb2RhbCcsICdSdGVIZWxwZXJTZXJ2aWNlJyxcbiAgICAnSHRtbEVzY2FwZXJTZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoJHRpbWVvdXQsICRjb21waWxlLCAkcm9vdFNjb3BlLCAkdWliTW9kYWwsIFJ0ZUhlbHBlclNlcnZpY2UsIEh0bWxFc2NhcGVyU2VydmljZSkge1xuICAgICAgICB2YXIgX1JJQ0hfVEVYVF9DT01QT05FTlRTID0gUnRlSGVscGVyU2VydmljZS5nZXRSaWNoVGV4dENvbXBvbmVudHMoKTtcbiAgICAgICAgX1JJQ0hfVEVYVF9DT01QT05FTlRTLmZvckVhY2goZnVuY3Rpb24gKGNvbXBvbmVudERlZm4pIHtcbiAgICAgICAgICAgIC8vIFRoZSBuYW1lIG9mIHRoZSBDS0VkaXRvciB3aWRnZXQgY29ycmVzcG9uZGluZyB0byB0aGlzIGNvbXBvbmVudC5cbiAgICAgICAgICAgIHZhciBja05hbWUgPSAnb3BwaWEnICsgY29tcG9uZW50RGVmbi5pZDtcbiAgICAgICAgICAgIC8vIENoZWNrIHRvIGVuc3VyZSB0aGF0IGEgcGx1Z2luIGlzIG5vdCByZWdpc3RlcmVkIG1vcmUgdGhhbiBvbmNlLlxuICAgICAgICAgICAgaWYgKENLRURJVE9SLnBsdWdpbnMucmVnaXN0ZXJlZFtja05hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdGFnTmFtZSA9ICdvcHBpYS1ub25pbnRlcmFjdGl2ZS0nICsgY29tcG9uZW50RGVmbi5pZDtcbiAgICAgICAgICAgIHZhciBjdXN0b21pemF0aW9uQXJnU3BlY3MgPSBjb21wb25lbnREZWZuLmN1c3RvbWl6YXRpb25BcmdTcGVjcztcbiAgICAgICAgICAgIHZhciBpc0lubGluZSA9IFJ0ZUhlbHBlclNlcnZpY2UuaXNJbmxpbmVDb21wb25lbnQoY29tcG9uZW50RGVmbi5pZCk7XG4gICAgICAgICAgICAvLyBJbmxpbmUgY29tcG9uZW50cyB3aWxsIGJlIHdyYXBwZWQgaW4gYSBzcGFuLCB3aGlsZSBibG9jayBjb21wb25lbnRzXG4gICAgICAgICAgICAvLyB3aWxsIGJlIHdyYXBwZWQgaW4gYSBkaXYuXG4gICAgICAgICAgICBpZiAoaXNJbmxpbmUpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29tcG9uZW50VGVtcGxhdGUgPSAnPHNwYW4gdHlwZT1cIicgKyB0YWdOYW1lICsgJ1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPCcgKyB0YWdOYW1lICsgJz48LycgKyB0YWdOYW1lICsgJz4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvc3Bhbj4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbXBvbmVudFRlbXBsYXRlID0gJzxkaXYgY2xhc3M9XCJvcHBpYS1ydGUtY29tcG9uZW50LWNvbnRhaW5lclwiICcgK1xuICAgICAgICAgICAgICAgICAgICAndHlwZT1cIicgKyB0YWdOYW1lICsgJ1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPCcgKyB0YWdOYW1lICsgJz48LycgKyB0YWdOYW1lICsgJz4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb21wb25lbnQtb3ZlcmxheVwiPjwvZGl2PicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIENLRURJVE9SLnBsdWdpbnMuYWRkKGNrTmFtZSwge1xuICAgICAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uIChlZGl0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHRoZSB3aWRnZXQgaXRzZWxmLlxuICAgICAgICAgICAgICAgICAgICBlZGl0b3Iud2lkZ2V0cy5hZGQoY2tOYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBidXR0b246IGNvbXBvbmVudERlZm4udG9vbHRpcCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlubGluZTogaXNJbmxpbmUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogY29tcG9uZW50VGVtcGxhdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBkcmFnZ2FibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZWRpdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5maXJlKCdsb2NrU25hcHNob3QnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbnRVcGRhdGU6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTYXZlIHRoaXMgZm9yIGNyZWF0aW5nIHRoZSB3aWRnZXQgbGF0ZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IHRoaXMud3JhcHBlci5nZXRQYXJlbnQodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXN0b21pemF0aW9uQXJncyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbWl6YXRpb25BcmdTcGVjcy5mb3JFYWNoKGZ1bmN0aW9uIChzcGVjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbWl6YXRpb25BcmdzW3NwZWMubmFtZV0gPSB0aGF0LmRhdGFbc3BlYy5uYW1lXSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BlYy5kZWZhdWx0X3ZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJ0ZUhlbHBlclNlcnZpY2UuX29wZW5DdXN0b21pemF0aW9uTW9kYWwoY3VzdG9taXphdGlvbkFyZ1NwZWNzLCBjdXN0b21pemF0aW9uQXJncywgZnVuY3Rpb24gKGN1c3RvbWl6YXRpb25BcmdzRGljdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBhcmcgaW4gY3VzdG9taXphdGlvbkFyZ3NEaWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VzdG9taXphdGlvbkFyZ3NEaWN0Lmhhc093blByb3BlcnR5KGFyZykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnNldERhdGEoYXJnLCBjdXN0b21pemF0aW9uQXJnc0RpY3RbYXJnXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogVGhpcyBjaGVja3Mgd2hldGhlciB0aGUgd2lkZ2V0IGhhcyBhbHJlYWR5IGJlZW4gaW5pdGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogYW5kIHNldCB1cCBiZWZvcmUgKGlmIHdlIGFyZSBlZGl0aW5nIGEgd2lkZ2V0IHRoYXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBoYXMgYWxyZWFkeSBiZWVuIGluc2VydGVkIGludG8gdGhlIFJURSwgd2UgZG8gbm90XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogbmVlZCB0byBmaW5hbGl6ZUNyZWF0aW9uIGFnYWluKS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGF0LmlzUmVhZHkoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWN0dWFsbHkgY3JlYXRlIHRoZSB3aWRnZXQsIGlmIHdlIGhhdmUgbm90IGFscmVhZHkuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3Iud2lkZ2V0cy5maW5hbGl6ZUNyZWF0aW9uKGNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIE5lZWQgdG8gbWFudWFsbHkgJGNvbXBpbGUgc28gdGhlIGRpcmVjdGl2ZSByZW5kZXJzLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBOb3RlIHRoYXQuZWxlbWVudC4kIGlzIHRoZSBuYXRpdmUgRE9NIG9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiByZXByZXNlbnRlZCBieSB0aGF0LmVsZW1lbnQuIFNlZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogaHR0cDovL2RvY3MuY2tlZGl0b3IuY29tLyMhL2FwaS9DS0VESVRPUi5kb20uZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGNvbXBpbGUoJCh0aGF0LmVsZW1lbnQuJCkuY29udGVudHMoKSkoJHJvb3RTY29wZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICR0aW1lb3V0IGVuc3VyZXMgd2UgZG8gbm90IHRha2UgdGhlIHVuZG8gc25hcHNob3QgdW50aWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWZ0ZXIgYW5ndWxhciBmaW5pc2hlcyBpdHMgY2hhbmdlcyB0byB0aGUgY29tcG9uZW50IHRhZ3MuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvciBpbmxpbmUgd2lkZ2V0cywgcGxhY2UgdGhlIGNhcmV0IGFmdGVyIHRoZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2lkZ2V0IHNvIHRoZSB1c2VyIGNhbiBjb250aW51ZSB0eXBpbmcgaW1tZWRpYXRlbHkuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNJbmxpbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmFuZ2UgPSBlZGl0b3IuY3JlYXRlUmFuZ2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgd2lkZ2V0Q29udGFpbmVyID0gdGhhdC5lbGVtZW50LmdldFBhcmVudCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlLm1vdmVUb1Bvc2l0aW9uKHdpZGdldENvbnRhaW5lciwgQ0tFRElUT1IuUE9TSVRJT05fQUZURVJfRU5EKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZ2V0U2VsZWN0aW9uKCkuc2VsZWN0UmFuZ2VzKFtyYW5nZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFub3RoZXIgdGltZW91dCBuZWVkZWQgc28gdGhlIHVuZG8gc25hcHNob3QgaXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBub3QgdGFrZW4gdW50aWwgdGhlIGNhcmV0IGlzIGluIHRoZSByaWdodCBwbGFjZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5maXJlKCd1bmxvY2tTbmFwc2hvdCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZmlyZSgnc2F2ZVNuYXBzaG90Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZmlyZSgndW5sb2NrU25hcHNob3QnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZmlyZSgnc2F2ZVNuYXBzaG90Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHsgfSwgZnVuY3Rpb24gKCkgeyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIFRoaXMgaXMgaG93IHRoZSB3aWRnZXQgd2lsbCBiZSByZXByZXNlbnRlZCBpbiB0aGUgb3V0cHV0cyBzb3VyY2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBzbyBpdCBpcyBjYWxsZWQgd2hlbiB3ZSBjYWxsIGVkaXRvci5nZXREYXRhKCkuXG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGRvd25jYXN0OiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENsZWFyIHRoZSBhbmd1bGFyIHJlbmRlcmluZyBjb250ZW50LCB3aGljaCB3ZSBkb24ndFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdhbnQgaW4gdGhlIG91dHB1dC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmNoaWxkcmVuWzBdLnNldEh0bWwoJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJldHVybiBqdXN0IHRoZSByaWNoIHRleHQgY29tcG9uZW50LCB3aXRob3V0IGl0cyB3cmFwcGVyLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlbGVtZW50LmNoaWxkcmVuWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgICAgICogVGhpcyBpcyBob3cgYSB3aWRnZXQgaXMgcmVjb2duaXplZCBieSBDS0VkaXRvciwgZm9yIGV4YW1wbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIHdoZW4gd2UgZmlyc3QgbG9hZCBkYXRhIGluLiBSZXR1cm5zIGEgYm9vbGVhbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIHRydWUgaWZmIFwiZWxlbWVudFwiIGlzIGFuIGluc3RhbmNlIG9mIHRoaXMgd2lkZ2V0LlxuICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICB1cGNhc3Q6IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChlbGVtZW50Lm5hbWUgIT09ICdwJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmNoaWxkcmVuLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jaGlsZHJlblswXS5uYW1lID09PSB0YWdOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCBhdHRyaWJ1dGVzIG9mIGNvbXBvbmVudCBhY2NvcmRpbmcgdG8gZGF0YSB2YWx1ZXMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9taXphdGlvbkFyZ1NwZWNzLmZvckVhY2goZnVuY3Rpb24gKHNwZWMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5lbGVtZW50LmdldENoaWxkKDApLnNldEF0dHJpYnV0ZShzcGVjLm5hbWUgKyAnLXdpdGgtdmFsdWUnLCBIdG1sRXNjYXBlclNlcnZpY2Uub2JqVG9Fc2NhcGVkSnNvbih0aGF0LmRhdGFbc3BlYy5uYW1lXSB8fCAnJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZmlyZSgnbG9ja1NuYXBzaG90Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb250VXBkYXRlOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpc01pc3NpbmdBdHRyaWJ1dGVzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT24gaW5pdCwgcmVhZCB2YWx1ZXMgZnJvbSBjb21wb25lbnQgYXR0cmlidXRlcyBhbmQgc2F2ZSB0aGVtLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbWl6YXRpb25BcmdTcGVjcy5mb3JFYWNoKGZ1bmN0aW9uIChzcGVjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHRoYXQuZWxlbWVudC5nZXRDaGlsZCgwKS5nZXRBdHRyaWJ1dGUoc3BlYy5uYW1lICsgJy13aXRoLXZhbHVlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zZXREYXRhKHNwZWMubmFtZSwgSHRtbEVzY2FwZXJTZXJ2aWNlLmVzY2FwZWRKc29uVG9PYmoodmFsdWUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzTWlzc2luZ0F0dHJpYnV0ZXMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc01pc3NpbmdBdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5lZWQgdG8gbWFudWFsbHkgJGNvbXBpbGUgc28gdGhlIGRpcmVjdGl2ZSByZW5kZXJzLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkY29tcGlsZSgkKHRoaXMuZWxlbWVudC4kKS5jb250ZW50cygpKSgkcm9vdFNjb3BlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZmlyZSgndW5sb2NrU25hcHNob3QnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmZpcmUoJ3NhdmVTbmFwc2hvdCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgZGlzcGxheWluZyBhbmltYXRlZCBsb2FkaW5nIGRvdHMuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdsb2FkaW5nRG90c01vZHVsZScpLmRpcmVjdGl2ZSgnbG9hZGluZ0RvdHMnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9sb2FkaW5nLWRvdHMvJyArXG4gICAgICAgICAgICAgICAgJ2xvYWRpbmctZG90cy5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW2Z1bmN0aW9uICgpIHsgfV1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB3aGljaCBtYWludGFpbnMgYSBzdGFjayBvZiBjaGFuZ2VzIHRvIGEgUXVlc3Rpb25cbiAqIGRvbWFpbiBvYmplY3QuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ1F1ZXN0aW9uVW5kb1JlZG9TZXJ2aWNlJywgW1xuICAgICdCYXNlVW5kb1JlZG9TZXJ2aWNlJywgZnVuY3Rpb24gKEJhc2VVbmRvUmVkb1NlcnZpY2UpIHtcbiAgICAgICAgdmFyIGNoaWxkID0gT2JqZWN0LmNyZWF0ZShCYXNlVW5kb1JlZG9TZXJ2aWNlKTtcbiAgICAgICAgY2hpbGQuaW5pdCgpO1xuICAgICAgICByZXR1cm4gY2hpbGQ7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdG8gc2VuZCBjaGFuZ2VzIHRvIGEgc3RvcnkgdG8gdGhlIGJhY2tlbmQuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbm9wcGlhLmNvbnN0YW50KCdFRElUQUJMRV9TVE9SWV9EQVRBX1VSTF9URU1QTEFURScsICcvc3RvcnlfZWRpdG9yX2hhbmRsZXIvZGF0YS88dG9waWNfaWQ+LzxzdG9yeV9pZD4nKTtcbm9wcGlhLmZhY3RvcnkoJ0VkaXRhYmxlU3RvcnlCYWNrZW5kQXBpU2VydmljZScsIFtcbiAgICAnJGh0dHAnLCAnJHEnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgICdFRElUQUJMRV9TVE9SWV9EQVRBX1VSTF9URU1QTEFURScsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkcSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIEVESVRBQkxFX1NUT1JZX0RBVEFfVVJMX1RFTVBMQVRFKSB7XG4gICAgICAgIHZhciBfZmV0Y2hTdG9yeSA9IGZ1bmN0aW9uICh0b3BpY0lkLCBzdG9yeUlkLCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBzdG9yeURhdGFVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChFRElUQUJMRV9TVE9SWV9EQVRBX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgIHRvcGljX2lkOiB0b3BpY0lkLFxuICAgICAgICAgICAgICAgIHN0b3J5X2lkOiBzdG9yeUlkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICRodHRwLmdldChzdG9yeURhdGFVcmwpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0b3J5ID0gYW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEuc3RvcnkpO1xuICAgICAgICAgICAgICAgIHZhciB0b3BpY05hbWUgPSBhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YS50b3BpY19uYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdG9yeTogc3RvcnksXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3BpY05hbWU6IHRvcGljTmFtZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3JSZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF91cGRhdGVTdG9yeSA9IGZ1bmN0aW9uICh0b3BpY0lkLCBzdG9yeUlkLCBzdG9yeVZlcnNpb24sIGNvbW1pdE1lc3NhZ2UsIGNoYW5nZUxpc3QsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIGVkaXRhYmxlU3RvcnlEYXRhVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoRURJVEFCTEVfU1RPUllfREFUQV9VUkxfVEVNUExBVEUsIHtcbiAgICAgICAgICAgICAgICB0b3BpY19pZDogdG9waWNJZCxcbiAgICAgICAgICAgICAgICBzdG9yeV9pZDogc3RvcnlJZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgcHV0RGF0YSA9IHtcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiBzdG9yeVZlcnNpb24sXG4gICAgICAgICAgICAgICAgY29tbWl0X21lc3NhZ2U6IGNvbW1pdE1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgY2hhbmdlX2RpY3RzOiBjaGFuZ2VMaXN0XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgJGh0dHAucHV0KGVkaXRhYmxlU3RvcnlEYXRhVXJsLCBwdXREYXRhKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIC8vIFRoZSByZXR1cm5lZCBkYXRhIGlzIGFuIHVwZGF0ZWQgc3RvcnkgZGljdC5cbiAgICAgICAgICAgICAgICB2YXIgc3RvcnkgPSBhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YS5zdG9yeSk7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soc3RvcnkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvclJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2RlbGV0ZVN0b3J5ID0gZnVuY3Rpb24gKHRvcGljSWQsIHN0b3J5SWQsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIHN0b3J5RGF0YVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKEVESVRBQkxFX1NUT1JZX0RBVEFfVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgdG9waWNfaWQ6IHRvcGljSWQsXG4gICAgICAgICAgICAgICAgc3RvcnlfaWQ6IHN0b3J5SWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGh0dHBbJ2RlbGV0ZSddKHN0b3J5RGF0YVVybCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZS5zdGF0dXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvclJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmV0Y2hTdG9yeTogZnVuY3Rpb24gKHRvcGljSWQsIHN0b3J5SWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfZmV0Y2hTdG9yeSh0b3BpY0lkLCBzdG9yeUlkLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogVXBkYXRlcyBhIHN0b3J5IGluIHRoZSBiYWNrZW5kIHdpdGggdGhlIHByb3ZpZGVkIHN0b3J5IElELlxuICAgICAgICAgICAgICogVGhlIGNoYW5nZXMgb25seSBhcHBseSB0byB0aGUgc3Rvcnkgb2YgdGhlIGdpdmVuIHZlcnNpb24gYW5kIHRoZVxuICAgICAgICAgICAgICogcmVxdWVzdCB0byB1cGRhdGUgdGhlIHN0b3J5IHdpbGwgZmFpbCBpZiB0aGUgcHJvdmlkZWQgc3RvcnlcbiAgICAgICAgICAgICAqIHZlcnNpb24gaXMgb2xkZXIgdGhhbiB0aGUgY3VycmVudCB2ZXJzaW9uIHN0b3JlZCBpbiB0aGUgYmFja2VuZC4gQm90aFxuICAgICAgICAgICAgICogdGhlIGNoYW5nZXMgYW5kIHRoZSBtZXNzYWdlIHRvIGFzc29jaWF0ZSB3aXRoIHRob3NlIGNoYW5nZXMgYXJlIHVzZWRcbiAgICAgICAgICAgICAqIHRvIGNvbW1pdCBhIGNoYW5nZSB0byB0aGUgc3RvcnkuIFRoZSBuZXcgc3RvcnkgaXMgcGFzc2VkIHRvXG4gICAgICAgICAgICAgKiB0aGUgc3VjY2VzcyBjYWxsYmFjaywgaWYgb25lIGlzIHByb3ZpZGVkIHRvIHRoZSByZXR1cm5lZCBwcm9taXNlXG4gICAgICAgICAgICAgKiBvYmplY3QuIEVycm9ycyBhcmUgcGFzc2VkIHRvIHRoZSBlcnJvciBjYWxsYmFjaywgaWYgb25lIGlzIHByb3ZpZGVkLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB1cGRhdGVTdG9yeTogZnVuY3Rpb24gKHRvcGljSWQsIHN0b3J5SWQsIHN0b3J5VmVyc2lvbiwgY29tbWl0TWVzc2FnZSwgY2hhbmdlTGlzdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF91cGRhdGVTdG9yeSh0b3BpY0lkLCBzdG9yeUlkLCBzdG9yeVZlcnNpb24sIGNvbW1pdE1lc3NhZ2UsIGNoYW5nZUxpc3QsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVsZXRlU3Rvcnk6IGZ1bmN0aW9uICh0b3BpY0lkLCBzdG9yeUlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgX2RlbGV0ZVN0b3J5KHRvcGljSWQsIHN0b3J5SWQsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIGFuZCBtdXRhdGluZyBpbnN0YW5jZXMgb2YgZnJvbnRlbmRcbiAqIHN0b3J5IGNvbnRlbnRzIGRvbWFpbiBvYmplY3RzLlxuICovXG5yZXF1aXJlKCdkb21haW4vc3RvcnkvU3RvcnlOb2RlT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgncGFnZXMvc3RvcnktZWRpdG9yLXBhZ2UvJyArXG4gICAgJ3N0b3J5LWVkaXRvci1wYWdlLmNvbnRyb2xsZXIudHMnKTtcbm9wcGlhLmZhY3RvcnkoJ1N0b3J5Q29udGVudHNPYmplY3RGYWN0b3J5JywgW1xuICAgICdTdG9yeU5vZGVPYmplY3RGYWN0b3J5JywgJ05PREVfSURfUFJFRklYJyxcbiAgICBmdW5jdGlvbiAoU3RvcnlOb2RlT2JqZWN0RmFjdG9yeSwgTk9ERV9JRF9QUkVGSVgpIHtcbiAgICAgICAgdmFyIF9kaXNjb25uZWN0ZWROb2RlSWRzID0gW107XG4gICAgICAgIHZhciBTdG9yeUNvbnRlbnRzID0gZnVuY3Rpb24gKGluaXRpYWxOb2RlSWQsIG5vZGVzLCBuZXh0Tm9kZUlkKSB7XG4gICAgICAgICAgICB0aGlzLl9pbml0aWFsTm9kZUlkID0gaW5pdGlhbE5vZGVJZDtcbiAgICAgICAgICAgIHRoaXMuX25vZGVzID0gbm9kZXM7XG4gICAgICAgICAgICB0aGlzLl9uZXh0Tm9kZUlkID0gbmV4dE5vZGVJZDtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGdldEluY3JlbWVudGVkTm9kZUlkID0gZnVuY3Rpb24gKG5vZGVJZCkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gcGFyc2VJbnQobm9kZUlkLnJlcGxhY2UoTk9ERV9JRF9QUkVGSVgsICcnKSk7XG4gICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgcmV0dXJuIE5PREVfSURfUFJFRklYICsgaW5kZXg7XG4gICAgICAgIH07XG4gICAgICAgIC8vIEluc3RhbmNlIG1ldGhvZHNcbiAgICAgICAgU3RvcnlDb250ZW50cy5wcm90b3R5cGUuZ2V0SW5pdGlhbE5vZGVJZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pbml0aWFsTm9kZUlkO1xuICAgICAgICB9O1xuICAgICAgICBTdG9yeUNvbnRlbnRzLnByb3RvdHlwZS5nZXREaXNjb25uZWN0ZWROb2RlSWRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIF9kaXNjb25uZWN0ZWROb2RlSWRzO1xuICAgICAgICB9O1xuICAgICAgICBTdG9yeUNvbnRlbnRzLnByb3RvdHlwZS5nZXROZXh0Tm9kZUlkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX25leHROb2RlSWQ7XG4gICAgICAgIH07XG4gICAgICAgIFN0b3J5Q29udGVudHMucHJvdG90eXBlLmdldE5vZGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX25vZGVzO1xuICAgICAgICB9O1xuICAgICAgICBTdG9yeUNvbnRlbnRzLnByb3RvdHlwZS5nZXROb2RlSWRDb3JyZXNwb25kaW5nVG9UaXRsZSA9IGZ1bmN0aW9uICh0aXRsZSkge1xuICAgICAgICAgICAgdmFyIG5vZGVzID0gdGhpcy5fbm9kZXM7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGVzW2ldLmdldFRpdGxlKCkgPT09IHRpdGxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBub2Rlc1tpXS5nZXRJZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9O1xuICAgICAgICBTdG9yeUNvbnRlbnRzLnByb3RvdHlwZS5nZXROb2RlSWRzVG9UaXRsZU1hcCA9IGZ1bmN0aW9uIChub2RlSWRzKSB7XG4gICAgICAgICAgICB2YXIgbm9kZXMgPSB0aGlzLl9ub2RlcztcbiAgICAgICAgICAgIHZhciBub2RlVGl0bGVzID0ge307XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGVJZHMuaW5kZXhPZihub2Rlc1tpXS5nZXRJZCgpKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZVRpdGxlc1tub2Rlc1tpXS5nZXRJZCgpXSA9IG5vZGVzW2ldLmdldFRpdGxlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKG5vZGVUaXRsZXMpLmxlbmd0aCAhPT0gbm9kZUlkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVJZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFub2RlVGl0bGVzLmhhc093blByb3BlcnR5KG5vZGVJZHNbaV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignVGhlIG5vZGUgd2l0aCBpZCAnICsgbm9kZUlkc1tpXSArICcgaXMgaW52YWxpZCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5vZGVUaXRsZXM7XG4gICAgICAgIH07XG4gICAgICAgIFN0b3J5Q29udGVudHMucHJvdG90eXBlLmdldE5vZGVJZHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbm9kZXMubWFwKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUuZ2V0SWQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBTdG9yeUNvbnRlbnRzLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF9kaXNjb25uZWN0ZWROb2RlSWRzID0gW107XG4gICAgICAgICAgICB2YXIgaXNzdWVzID0gW107XG4gICAgICAgICAgICB2YXIgbm9kZXMgPSB0aGlzLl9ub2RlcztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZUlzc3VlcyA9IG5vZGVzW2ldLnZhbGlkYXRlKCk7XG4gICAgICAgICAgICAgICAgaXNzdWVzID0gaXNzdWVzLmNvbmNhdChub2RlSXNzdWVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc3N1ZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpc3N1ZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBQcm92aWRlZCB0aGUgbm9kZXMgbGlzdCBpcyB2YWxpZCBhbmQgZWFjaCBub2RlIGluIGl0IGlzIHZhbGlkLCB0aGVcbiAgICAgICAgICAgIC8vIHByZWxpbWluYXJ5IGNoZWNrcyBhcmUgZG9uZSB0byBzZWUgaWYgdGhlIHN0b3J5IG5vZGUgZ3JhcGggb2J0YWluZWQgaXNcbiAgICAgICAgICAgIC8vIHZhbGlkLlxuICAgICAgICAgICAgdmFyIG5vZGVJZHMgPSBub2Rlcy5tYXAoZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbm9kZS5nZXRJZCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgbm9kZVRpdGxlcyA9IG5vZGVzLm1hcChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBub2RlLmdldFRpdGxlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZUlkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBub2RlSWQgPSBub2RlSWRzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChub2RlSWRzLmluZGV4T2Yobm9kZUlkKSA8IG5vZGVJZHMubGFzdEluZGV4T2Yobm9kZUlkKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignVGhlIG5vZGUgd2l0aCBpZCAnICsgbm9kZUlkICsgJyBpcyBkdXBsaWNhdGVkIGluIHRoZSBzdG9yeScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBuZXh0Tm9kZUlkTnVtYmVyID0gcGFyc2VJbnQodGhpcy5fbmV4dE5vZGVJZC5yZXBsYWNlKE5PREVfSURfUFJFRklYLCAnJykpO1xuICAgICAgICAgICAgdmFyIGluaXRpYWxOb2RlSXNQcmVzZW50ID0gZmFsc2U7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGVJZE51bWJlciA9IHBhcnNlSW50KG5vZGVzW2ldLmdldElkKCkucmVwbGFjZShOT0RFX0lEX1BSRUZJWCwgJycpKTtcbiAgICAgICAgICAgICAgICBpZiAobm9kZXNbaV0uZ2V0SWQoKSA9PT0gdGhpcy5faW5pdGlhbE5vZGVJZCkge1xuICAgICAgICAgICAgICAgICAgICBpbml0aWFsTm9kZUlzUHJlc2VudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChub2RlSWROdW1iZXIgPiBuZXh0Tm9kZUlkTnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdOb2RlIGlkIG91dCBvZiBib3VuZHMgZm9yIG5vZGUgd2l0aCBpZCAnICsgbm9kZXNbaV0uZ2V0SWQoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbm9kZXNbaV0uZ2V0RGVzdGluYXRpb25Ob2RlSWRzKCkubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGVJZHMuaW5kZXhPZihub2Rlc1tpXS5nZXREZXN0aW5hdGlvbk5vZGVJZHMoKVtqXSkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc3N1ZXMucHVzaCgnVGhlIG5vZGUgd2l0aCBpZCAnICsgbm9kZXNbaV0uZ2V0RGVzdGluYXRpb25Ob2RlSWRzKClbal0gK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgZG9lc25cXCd0IGV4aXN0Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm9kZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGlmICghaW5pdGlhbE5vZGVJc1ByZXNlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0luaXRpYWwgbm9kZSAtICcgKyB0aGlzLl9pbml0aWFsTm9kZUlkICtcbiAgICAgICAgICAgICAgICAgICAgICAgICcgLSBpcyBub3QgcHJlc2VudCBpbiB0aGUgc3RvcnknKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gQWxsIHRoZSB2YWxpZGF0aW9ucyBhYm92ZSBzaG91bGQgYmUgc3VjY2Vzc2Z1bGx5IGNvbXBsZXRlZCBiZWZvcmVcbiAgICAgICAgICAgICAgICAvLyBnb2luZyB0byB2YWxpZGF0aW5nIHRoZSBzdG9yeSBub2RlIGdyYXBoLlxuICAgICAgICAgICAgICAgIGlmIChpc3N1ZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNzdWVzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBub2Rlc1F1ZXVlIHN0b3JlcyB0aGUgcGVuZGluZyBub2RlcyB0byB2aXNpdCBpbiBhIHF1ZXVlIGZvcm0uXG4gICAgICAgICAgICAgICAgdmFyIG5vZGVzUXVldWUgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZUlzVmlzaXRlZCA9IG5ldyBBcnJheShub2RlSWRzLmxlbmd0aCkuZmlsbChmYWxzZSk7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0aW5nTm9kZSA9IG5vZGVzW3RoaXMuZ2V0Tm9kZUluZGV4KHRoaXMuX2luaXRpYWxOb2RlSWQpXTtcbiAgICAgICAgICAgICAgICBub2Rlc1F1ZXVlLnB1c2goc3RhcnRpbmdOb2RlLmdldElkKCkpO1xuICAgICAgICAgICAgICAgIC8vIFRoZSB1c2VyIGlzIGFzc3VtZWQgdG8gaGF2ZSBhbGwgdGhlIHByZXJlcXVpc2l0ZSBza2lsbHMgb2YgdGhlXG4gICAgICAgICAgICAgICAgLy8gc3RhcnRpbmcgbm9kZSBiZWZvcmUgc3RhcnRpbmcgdGhlIHN0b3J5LiBBbHNvLCB0aGlzIGxpc3QgbW9kZWxzIHRoZVxuICAgICAgICAgICAgICAgIC8vIHNraWxsIElEcyBhY3F1aXJlZCBieSBhIGxlYXJuZXIgYXMgdGhleSBwcm9ncmVzcyB0aHJvdWdoIHRoZSBzdG9yeS5cbiAgICAgICAgICAgICAgICB2YXIgc2ltdWxhdGVkU2tpbGxJZHMgPSBuZXcgU2V0KHN0YXJ0aW5nTm9kZS5nZXRQcmVyZXF1aXNpdGVTa2lsbElkcygpKTtcbiAgICAgICAgICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGxvb3AgZW1wbG95cyBhIEJyZWFkdGggRmlyc3QgU2VhcmNoIGZyb20gdGhlIGdpdmVuXG4gICAgICAgICAgICAgICAgLy8gc3RhcnRpbmcgbm9kZSBhbmQgbWFrZXMgc3VyZSB0aGF0IHRoZSB1c2VyIGhhcyBhY3F1aXJlZCBhbGwgdGhlXG4gICAgICAgICAgICAgICAgLy8gcHJlcmVxdWlzaXRlIHNraWxscyByZXF1aXJlZCBieSB0aGUgZGVzdGluYXRpb24gbm9kZXMgJ3VubG9ja2VkJyBieVxuICAgICAgICAgICAgICAgIC8vIHZpc2l0aW5nIGEgcGFydGljdWxhciBub2RlIGJ5IHRoZSB0aW1lIHRoYXQgbm9kZSBpcyBmaW5pc2hlZC5cbiAgICAgICAgICAgICAgICB3aGlsZSAobm9kZXNRdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50Tm9kZUluZGV4ID0gdGhpcy5nZXROb2RlSW5kZXgobm9kZXNRdWV1ZS5zaGlmdCgpKTtcbiAgICAgICAgICAgICAgICAgICAgbm9kZUlzVmlzaXRlZFtjdXJyZW50Tm9kZUluZGV4XSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50Tm9kZSA9IG5vZGVzW2N1cnJlbnROb2RlSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICBzdGFydGluZ05vZGUuZ2V0QWNxdWlyZWRTa2lsbElkcygpLmZvckVhY2goZnVuY3Rpb24gKHNraWxsSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpbXVsYXRlZFNraWxsSWRzLmFkZChza2lsbElkKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY3VycmVudE5vZGUuZ2V0RGVzdGluYXRpb25Ob2RlSWRzKCkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBub2RlSWQgPSBjdXJyZW50Tm9kZS5nZXREZXN0aW5hdGlvbk5vZGVJZHMoKVtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBub2RlSW5kZXggPSB0aGlzLmdldE5vZGVJbmRleChub2RlSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBjb25kaXRpb24gY2hlY2tzIHdoZXRoZXIgdGhlIGRlc3RpbmF0aW9uIG5vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZvciBhIHBhcnRpY3VsYXIgbm9kZSwgaGFzIGFscmVhZHkgYmVlbiB2aXNpdGVkLCBpbiB3aGljaCBjYXNlXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGUgc3Rvcnkgd291bGQgaGF2ZSBsb29wcywgd2hpY2ggYXJlIG5vdCBhbGxvd2VkLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGVJc1Zpc2l0ZWRbbm9kZUluZGV4XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzc3Vlcy5wdXNoKCdMb29wcyBhcmUgbm90IGFsbG93ZWQgaW4gdGhlIG5vZGUgZ3JhcGgnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBhIGxvb3AgaXMgZW5jb3VudGVyZWQsIHRoZW4gYWxsIGZ1cnRoZXIgY2hlY2tzIGFyZSBoYWx0ZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2luY2UgaXQgY2FuIGxlYWQgdG8gc2FtZSBlcnJvciBiZWluZyByZXBvcnRlZCBhZ2Fpbi5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNzdWVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRlc3RpbmF0aW9uTm9kZSA9IG5vZGVzW25vZGVJbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvbk5vZGUuZ2V0UHJlcmVxdWlzaXRlU2tpbGxJZHMoKS5mb3JFYWNoKGZ1bmN0aW9uIChza2lsbElkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzaW11bGF0ZWRTa2lsbElkcy5oYXMoc2tpbGxJZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNzdWVzLnB1c2goJ1RoZSBwcmVyZXF1aXNpdGUgc2tpbGwgd2l0aCBpZCAnICsgc2tpbGxJZCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnIHdhcyBub3QgY29tcGxldGVkIGJlZm9yZSBub2RlIHdpdGggaWQgJyArIG5vZGVJZCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnIHdhcyB1bmxvY2tlZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZXNRdWV1ZS5wdXNoKG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlSXNWaXNpdGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghbm9kZUlzVmlzaXRlZFtpXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX2Rpc2Nvbm5lY3RlZE5vZGVJZHMucHVzaChub2RlSWRzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzc3Vlcy5wdXNoKCdUaGVyZSBpcyBubyB3YXkgdG8gZ2V0IHRvIHRoZSBjaGFwdGVyIHdpdGggdGl0bGUgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVRpdGxlc1tpXSArICcgZnJvbSBhbnkgb3RoZXIgY2hhcHRlcicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGlzc3VlcztcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnlDb250ZW50cy5wcm90b3R5cGUuc2V0SW5pdGlhbE5vZGVJZCA9IGZ1bmN0aW9uIChub2RlSWQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmdldE5vZGVJbmRleChub2RlSWQpID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgbm9kZSB3aXRoIGdpdmVuIGlkIGRvZXNuXFwndCBleGlzdCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2luaXRpYWxOb2RlSWQgPSBub2RlSWQ7XG4gICAgICAgIH07XG4gICAgICAgIFN0b3J5Q29udGVudHMucHJvdG90eXBlLmFkZE5vZGUgPSBmdW5jdGlvbiAodGl0bGUpIHtcbiAgICAgICAgICAgIHRoaXMuX25vZGVzLnB1c2goU3RvcnlOb2RlT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tSWRBbmRUaXRsZSh0aGlzLl9uZXh0Tm9kZUlkLCB0aXRsZSkpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2luaXRpYWxOb2RlSWQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9pbml0aWFsTm9kZUlkID0gdGhpcy5fbmV4dE5vZGVJZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX25leHROb2RlSWQgPSBnZXRJbmNyZW1lbnRlZE5vZGVJZCh0aGlzLl9uZXh0Tm9kZUlkKTtcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnlDb250ZW50cy5wcm90b3R5cGUuZ2V0Tm9kZUluZGV4ID0gZnVuY3Rpb24gKG5vZGVJZCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9ub2Rlc1tpXS5nZXRJZCgpID09PSBub2RlSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9O1xuICAgICAgICBTdG9yeUNvbnRlbnRzLnByb3RvdHlwZS5kZWxldGVOb2RlID0gZnVuY3Rpb24gKG5vZGVJZCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZ2V0Tm9kZUluZGV4KG5vZGVJZCkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RoZSBub2RlIGRvZXMgbm90IGV4aXN0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm9kZUlkID09PSB0aGlzLl9pbml0aWFsTm9kZUlkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX25vZGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbml0aWFsTm9kZUlkID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdDYW5ub3QgZGVsZXRlIGluaXRpYWwgc3Rvcnkgbm9kZScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbm9kZXNbaV0uZ2V0RGVzdGluYXRpb25Ob2RlSWRzKCkuaW5kZXhPZihub2RlSWQpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ub2Rlc1tpXS5yZW1vdmVEZXN0aW5hdGlvbk5vZGVJZChub2RlSWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX25vZGVzLnNwbGljZSh0aGlzLmdldE5vZGVJbmRleChub2RlSWQpLCAxKTtcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnlDb250ZW50cy5wcm90b3R5cGUuc2V0Tm9kZU91dGxpbmUgPSBmdW5jdGlvbiAobm9kZUlkLCBvdXRsaW5lKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmdldE5vZGVJbmRleChub2RlSWQpO1xuICAgICAgICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgbm9kZSB3aXRoIGdpdmVuIGlkIGRvZXNuXFwndCBleGlzdCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fbm9kZXNbaW5kZXhdLnNldE91dGxpbmUob3V0bGluZSk7XG4gICAgICAgIH07XG4gICAgICAgIFN0b3J5Q29udGVudHMucHJvdG90eXBlLnNldE5vZGVUaXRsZSA9IGZ1bmN0aW9uIChub2RlSWQsIHRpdGxlKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmdldE5vZGVJbmRleChub2RlSWQpO1xuICAgICAgICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgbm9kZSB3aXRoIGdpdmVuIGlkIGRvZXNuXFwndCBleGlzdCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fbm9kZXNbaW5kZXhdLnNldFRpdGxlKHRpdGxlKTtcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnlDb250ZW50cy5wcm90b3R5cGUuc2V0Tm9kZUV4cGxvcmF0aW9uSWQgPSBmdW5jdGlvbiAobm9kZUlkLCBleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmdldE5vZGVJbmRleChub2RlSWQpO1xuICAgICAgICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgbm9kZSB3aXRoIGdpdmVuIGlkIGRvZXNuXFwndCBleGlzdCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoZXhwbG9yYXRpb25JZCAhPT0gbnVsbCB8fCBleHBsb3JhdGlvbklkICE9PSAnJykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCh0aGlzLl9ub2Rlc1tpXS5nZXRFeHBsb3JhdGlvbklkKCkgPT09IGV4cGxvcmF0aW9uSWQpICYmIChpICE9PSBpbmRleCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgZ2l2ZW4gZXhwbG9yYXRpb24gYWxyZWFkeSBleGlzdHMgaW4gdGhlIHN0b3J5LicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX25vZGVzW2luZGV4XS5zZXRFeHBsb3JhdGlvbklkKGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBTdG9yeUNvbnRlbnRzLnByb3RvdHlwZS5tYXJrTm9kZU91dGxpbmVBc0ZpbmFsaXplZCA9IGZ1bmN0aW9uIChub2RlSWQpIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuZ2V0Tm9kZUluZGV4KG5vZGVJZCk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RoZSBub2RlIHdpdGggZ2l2ZW4gaWQgZG9lc25cXCd0IGV4aXN0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9ub2Rlc1tpbmRleF0ubWFya091dGxpbmVBc0ZpbmFsaXplZCgpO1xuICAgICAgICB9O1xuICAgICAgICBTdG9yeUNvbnRlbnRzLnByb3RvdHlwZS5tYXJrTm9kZU91dGxpbmVBc05vdEZpbmFsaXplZCA9IGZ1bmN0aW9uIChub2RlSWQpIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuZ2V0Tm9kZUluZGV4KG5vZGVJZCk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RoZSBub2RlIHdpdGggZ2l2ZW4gaWQgZG9lc25cXCd0IGV4aXN0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9ub2Rlc1tpbmRleF0ubWFya091dGxpbmVBc05vdEZpbmFsaXplZCgpO1xuICAgICAgICB9O1xuICAgICAgICBTdG9yeUNvbnRlbnRzLnByb3RvdHlwZS5hZGRQcmVyZXF1aXNpdGVTa2lsbElkVG9Ob2RlID0gZnVuY3Rpb24gKG5vZGVJZCwgc2tpbGxJZCkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5nZXROb2RlSW5kZXgobm9kZUlkKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignVGhlIG5vZGUgd2l0aCBnaXZlbiBpZCBkb2VzblxcJ3QgZXhpc3QnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX25vZGVzW2luZGV4XS5hZGRQcmVyZXF1aXNpdGVTa2lsbElkKHNraWxsSWQpO1xuICAgICAgICB9O1xuICAgICAgICBTdG9yeUNvbnRlbnRzLnByb3RvdHlwZS5yZW1vdmVQcmVyZXF1aXNpdGVTa2lsbElkRnJvbU5vZGUgPSBmdW5jdGlvbiAobm9kZUlkLCBza2lsbElkKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmdldE5vZGVJbmRleChub2RlSWQpO1xuICAgICAgICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgbm9kZSB3aXRoIGdpdmVuIGlkIGRvZXNuXFwndCBleGlzdCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fbm9kZXNbaW5kZXhdLnJlbW92ZVByZXJlcXVpc2l0ZVNraWxsSWQoc2tpbGxJZCk7XG4gICAgICAgIH07XG4gICAgICAgIFN0b3J5Q29udGVudHMucHJvdG90eXBlLmFkZEFjcXVpcmVkU2tpbGxJZFRvTm9kZSA9IGZ1bmN0aW9uIChub2RlSWQsIHNraWxsSWQpIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuZ2V0Tm9kZUluZGV4KG5vZGVJZCk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RoZSBub2RlIHdpdGggZ2l2ZW4gaWQgZG9lc25cXCd0IGV4aXN0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9ub2Rlc1tpbmRleF0uYWRkQWNxdWlyZWRTa2lsbElkKHNraWxsSWQpO1xuICAgICAgICB9O1xuICAgICAgICBTdG9yeUNvbnRlbnRzLnByb3RvdHlwZS5yZW1vdmVBY3F1aXJlZFNraWxsSWRGcm9tTm9kZSA9IGZ1bmN0aW9uIChub2RlSWQsIHNraWxsSWQpIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuZ2V0Tm9kZUluZGV4KG5vZGVJZCk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RoZSBub2RlIHdpdGggZ2l2ZW4gaWQgZG9lc25cXCd0IGV4aXN0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9ub2Rlc1tpbmRleF0ucmVtb3ZlQWNxdWlyZWRTa2lsbElkKHNraWxsSWQpO1xuICAgICAgICB9O1xuICAgICAgICBTdG9yeUNvbnRlbnRzLnByb3RvdHlwZS5hZGREZXN0aW5hdGlvbk5vZGVJZFRvTm9kZSA9IGZ1bmN0aW9uIChub2RlSWQsIGRlc3RpbmF0aW9uTm9kZUlkKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmdldE5vZGVJbmRleChub2RlSWQpO1xuICAgICAgICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgbm9kZSB3aXRoIGdpdmVuIGlkIGRvZXNuXFwndCBleGlzdCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuZ2V0Tm9kZUluZGV4KGRlc3RpbmF0aW9uTm9kZUlkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignVGhlIGRlc3RpbmF0aW9uIG5vZGUgd2l0aCBnaXZlbiBpZCBkb2VzblxcJ3QgZXhpc3QnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX25vZGVzW2luZGV4XS5hZGREZXN0aW5hdGlvbk5vZGVJZChkZXN0aW5hdGlvbk5vZGVJZCk7XG4gICAgICAgIH07XG4gICAgICAgIFN0b3J5Q29udGVudHMucHJvdG90eXBlLnJlbW92ZURlc3RpbmF0aW9uTm9kZUlkRnJvbU5vZGUgPSBmdW5jdGlvbiAobm9kZUlkLCBkZXN0aW5hdGlvbk5vZGVJZCkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5nZXROb2RlSW5kZXgobm9kZUlkKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignVGhlIG5vZGUgd2l0aCBnaXZlbiBpZCBkb2VzblxcJ3QgZXhpc3QnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX25vZGVzW2luZGV4XS5yZW1vdmVEZXN0aW5hdGlvbk5vZGVJZChkZXN0aW5hdGlvbk5vZGVJZCk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFN0YXRpYyBjbGFzcyBtZXRob2RzLiBOb3RlIHRoYXQgXCJ0aGlzXCIgaXMgbm90IGF2YWlsYWJsZSBpbiBzdGF0aWNcbiAgICAgICAgLy8gY29udGV4dHMuIFRoaXMgZnVuY3Rpb24gdGFrZXMgYSBKU09OIG9iamVjdCB3aGljaCByZXByZXNlbnRzIGEgYmFja2VuZFxuICAgICAgICAvLyBzdG9yeSBweXRob24gZGljdC5cbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgU3RvcnlDb250ZW50c1snY3JlYXRlRnJvbUJhY2tlbmREaWN0J10gPSBmdW5jdGlvbiAoXG4gICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIHN0b3J5Q29udGVudHNCYWNrZW5kT2JqZWN0KSB7XG4gICAgICAgICAgICB2YXIgbm9kZXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RvcnlDb250ZW50c0JhY2tlbmRPYmplY3Qubm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBub2Rlcy5wdXNoKFN0b3J5Tm9kZU9iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUJhY2tlbmREaWN0KHN0b3J5Q29udGVudHNCYWNrZW5kT2JqZWN0Lm5vZGVzW2ldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3IFN0b3J5Q29udGVudHMoc3RvcnlDb250ZW50c0JhY2tlbmRPYmplY3QuaW5pdGlhbF9ub2RlX2lkLCBub2Rlcywgc3RvcnlDb250ZW50c0JhY2tlbmRPYmplY3QubmV4dF9ub2RlX2lkKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIFN0b3J5Q29udGVudHM7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIGFuZCBtdXRhdGluZyBpbnN0YW5jZXMgb2YgZnJvbnRlbmRcbiAqIHN0b3J5IG5vZGUgZG9tYWluIG9iamVjdHMuXG4gKi9cbnJlcXVpcmUoJ3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL3N0b3J5LWVkaXRvci1wYWdlLmNvbnRyb2xsZXIudHMnKTtcbm9wcGlhLmZhY3RvcnkoJ1N0b3J5Tm9kZU9iamVjdEZhY3RvcnknLCBbJ05PREVfSURfUFJFRklYJyxcbiAgICBmdW5jdGlvbiAoTk9ERV9JRF9QUkVGSVgpIHtcbiAgICAgICAgdmFyIFN0b3J5Tm9kZSA9IGZ1bmN0aW9uIChpZCwgdGl0bGUsIGRlc3RpbmF0aW9uTm9kZUlkcywgcHJlcmVxdWlzaXRlU2tpbGxJZHMsIGFjcXVpcmVkU2tpbGxJZHMsIG91dGxpbmUsIG91dGxpbmVJc0ZpbmFsaXplZCwgZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgdGhpcy5faWQgPSBpZDtcbiAgICAgICAgICAgIHRoaXMuX3RpdGxlID0gdGl0bGU7XG4gICAgICAgICAgICB0aGlzLl9kZXN0aW5hdGlvbk5vZGVJZHMgPSBkZXN0aW5hdGlvbk5vZGVJZHM7XG4gICAgICAgICAgICB0aGlzLl9wcmVyZXF1aXNpdGVTa2lsbElkcyA9IHByZXJlcXVpc2l0ZVNraWxsSWRzO1xuICAgICAgICAgICAgdGhpcy5fYWNxdWlyZWRTa2lsbElkcyA9IGFjcXVpcmVkU2tpbGxJZHM7XG4gICAgICAgICAgICB0aGlzLl9vdXRsaW5lID0gb3V0bGluZTtcbiAgICAgICAgICAgIHRoaXMuX291dGxpbmVJc0ZpbmFsaXplZCA9IG91dGxpbmVJc0ZpbmFsaXplZDtcbiAgICAgICAgICAgIHRoaXMuX2V4cGxvcmF0aW9uSWQgPSBleHBsb3JhdGlvbklkO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2NoZWNrVmFsaWROb2RlSWQgPSBmdW5jdGlvbiAobm9kZUlkKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG5vZGVJZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbm9kZUlkUGF0dGVybiA9IG5ldyBSZWdFeHAoTk9ERV9JRF9QUkVGSVggKyAnWzAtOV0rJywgJ2cnKTtcbiAgICAgICAgICAgIGlmICghbm9kZUlkLm1hdGNoKG5vZGVJZFBhdHRlcm4pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH07XG4gICAgICAgIC8vIEluc3RhbmNlIG1ldGhvZHNcbiAgICAgICAgU3RvcnlOb2RlLnByb3RvdHlwZS5nZXRJZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pZDtcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnlOb2RlLnByb3RvdHlwZS5nZXRUaXRsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl90aXRsZTtcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnlOb2RlLnByb3RvdHlwZS5nZXRFeHBsb3JhdGlvbklkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2V4cGxvcmF0aW9uSWQ7XG4gICAgICAgIH07XG4gICAgICAgIFN0b3J5Tm9kZS5wcm90b3R5cGUuc2V0RXhwbG9yYXRpb25JZCA9IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICB0aGlzLl9leHBsb3JhdGlvbklkID0gZXhwbG9yYXRpb25JZDtcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnlOb2RlLnByb3RvdHlwZS5nZXRPdXRsaW5lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX291dGxpbmU7XG4gICAgICAgIH07XG4gICAgICAgIFN0b3J5Tm9kZS5wcm90b3R5cGUuc2V0T3V0bGluZSA9IGZ1bmN0aW9uIChvdXRsaW5lKSB7XG4gICAgICAgICAgICB0aGlzLl9vdXRsaW5lID0gb3V0bGluZTtcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnlOb2RlLnByb3RvdHlwZS5zZXRUaXRsZSA9IGZ1bmN0aW9uICh0aXRsZSkge1xuICAgICAgICAgICAgdGhpcy5fdGl0bGUgPSB0aXRsZTtcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnlOb2RlLnByb3RvdHlwZS5nZXRPdXRsaW5lU3RhdHVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX291dGxpbmVJc0ZpbmFsaXplZDtcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnlOb2RlLnByb3RvdHlwZS5tYXJrT3V0bGluZUFzRmluYWxpemVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5fb3V0bGluZUlzRmluYWxpemVkID0gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnlOb2RlLnByb3RvdHlwZS5tYXJrT3V0bGluZUFzTm90RmluYWxpemVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5fb3V0bGluZUlzRmluYWxpemVkID0gZmFsc2U7XG4gICAgICAgIH07XG4gICAgICAgIFN0b3J5Tm9kZS5wcm90b3R5cGUudmFsaWRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaXNzdWVzID0gW107XG4gICAgICAgICAgICBpZiAoIV9jaGVja1ZhbGlkTm9kZUlkKHRoaXMuX2lkKSkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgbm9kZSBpZCAnICsgdGhpcy5faWQgKyAnIGlzIGludmFsaWQuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcHJlcmVxdWlzaXRlU2tpbGxJZHMgPSB0aGlzLl9wcmVyZXF1aXNpdGVTa2lsbElkcztcbiAgICAgICAgICAgIHZhciBhY3F1aXJlZFNraWxsSWRzID0gdGhpcy5fYWNxdWlyZWRTa2lsbElkcztcbiAgICAgICAgICAgIHZhciBkZXN0aW5hdGlvbk5vZGVJZHMgPSB0aGlzLl9kZXN0aW5hdGlvbk5vZGVJZHM7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByZXJlcXVpc2l0ZVNraWxsSWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNraWxsSWQgPSBwcmVyZXF1aXNpdGVTa2lsbElkc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAocHJlcmVxdWlzaXRlU2tpbGxJZHMuaW5kZXhPZihza2lsbElkKSA8XG4gICAgICAgICAgICAgICAgICAgIHByZXJlcXVpc2l0ZVNraWxsSWRzLmxhc3RJbmRleE9mKHNraWxsSWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzc3Vlcy5wdXNoKCdUaGUgcHJlcmVxdWlzaXRlIHNraWxsIHdpdGggaWQgJyArIHNraWxsSWQgKyAnIGlzIGR1cGxpY2F0ZWQgaW4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICcgbm9kZSB3aXRoIGlkICcgKyB0aGlzLl9pZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY3F1aXJlZFNraWxsSWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNraWxsSWQgPSBhY3F1aXJlZFNraWxsSWRzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChhY3F1aXJlZFNraWxsSWRzLmluZGV4T2Yoc2tpbGxJZCkgPFxuICAgICAgICAgICAgICAgICAgICBhY3F1aXJlZFNraWxsSWRzLmxhc3RJbmRleE9mKHNraWxsSWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzc3Vlcy5wdXNoKCdUaGUgYWNxdWlyZWQgc2tpbGwgd2l0aCBpZCAnICsgc2tpbGxJZCArICcgaXMgZHVwbGljYXRlZCBpbicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJyBub2RlIHdpdGggaWQgJyArIHRoaXMuX2lkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByZXJlcXVpc2l0ZVNraWxsSWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFjcXVpcmVkU2tpbGxJZHMuaW5kZXhPZihwcmVyZXF1aXNpdGVTa2lsbElkc1tpXSkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzc3Vlcy5wdXNoKCdUaGUgc2tpbGwgd2l0aCBpZCAnICsgcHJlcmVxdWlzaXRlU2tpbGxJZHNbaV0gKyAnIGlzIGNvbW1vbiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICd0byBib3RoIHRoZSBhY3F1aXJlZCBhbmQgcHJlcmVxdWlzaXRlIHNraWxsIGlkIGxpc3QgaW4gbm9kZSB3aXRoJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnIGlkICcgKyB0aGlzLl9pZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZXN0aW5hdGlvbk5vZGVJZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoIV9jaGVja1ZhbGlkTm9kZUlkKGRlc3RpbmF0aW9uTm9kZUlkc1tpXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RoZSBkZXN0aW5hdGlvbiBub2RlIGlkICcgKyBkZXN0aW5hdGlvbk5vZGVJZHNbaV0gKyAnIGlzICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2ludmFsaWQgaW4gbm9kZSB3aXRoIGlkICcgKyB0aGlzLl9pZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGN1cnJlbnROb2RlSWQgPSB0aGlzLl9pZDtcbiAgICAgICAgICAgIGlmIChkZXN0aW5hdGlvbk5vZGVJZHMuc29tZShmdW5jdGlvbiAobm9kZUlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGVJZCA9PT0gY3VycmVudE5vZGVJZDtcbiAgICAgICAgICAgIH0pKSB7XG4gICAgICAgICAgICAgICAgaXNzdWVzLnB1c2goJ1RoZSBkZXN0aW5hdGlvbiBub2RlIGlkIG9mIG5vZGUgd2l0aCBpZCAnICsgdGhpcy5faWQgK1xuICAgICAgICAgICAgICAgICAgICAnIHBvaW50cyB0byBpdHNlbGYuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlc3RpbmF0aW9uTm9kZUlkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBub2RlSWQgPSBkZXN0aW5hdGlvbk5vZGVJZHNbaV07XG4gICAgICAgICAgICAgICAgaWYgKGRlc3RpbmF0aW9uTm9kZUlkcy5pbmRleE9mKG5vZGVJZCkgPFxuICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvbk5vZGVJZHMubGFzdEluZGV4T2Yobm9kZUlkKSkge1xuICAgICAgICAgICAgICAgICAgICBpc3N1ZXMucHVzaCgnVGhlIGRlc3RpbmF0aW9uIG5vZGUgd2l0aCBpZCAnICsgbm9kZUlkICsgJyBpcyBkdXBsaWNhdGVkIGluJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnIG5vZGUgd2l0aCBpZCAnICsgdGhpcy5faWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBpc3N1ZXM7XG4gICAgICAgIH07XG4gICAgICAgIFN0b3J5Tm9kZS5wcm90b3R5cGUuZ2V0RGVzdGluYXRpb25Ob2RlSWRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Rlc3RpbmF0aW9uTm9kZUlkcy5zbGljZSgpO1xuICAgICAgICB9O1xuICAgICAgICBTdG9yeU5vZGUucHJvdG90eXBlLmFkZERlc3RpbmF0aW9uTm9kZUlkID0gZnVuY3Rpb24gKGRlc3RpbmF0aW9uTm9kZWlkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fZGVzdGluYXRpb25Ob2RlSWRzLmluZGV4T2YoZGVzdGluYXRpb25Ob2RlaWQpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgZ2l2ZW4gbm9kZSBpcyBhbHJlYWR5IGEgZGVzdGluYXRpb24gbm9kZS4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2Rlc3RpbmF0aW9uTm9kZUlkcy5wdXNoKGRlc3RpbmF0aW9uTm9kZWlkKTtcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnlOb2RlLnByb3RvdHlwZS5yZW1vdmVEZXN0aW5hdGlvbk5vZGVJZCA9IGZ1bmN0aW9uIChkZXN0aW5hdGlvbk5vZGVpZCkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5fZGVzdGluYXRpb25Ob2RlSWRzLmluZGV4T2YoZGVzdGluYXRpb25Ob2RlaWQpO1xuICAgICAgICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgZ2l2ZW4gbm9kZSBpcyBub3QgYSBkZXN0aW5hdGlvbiBub2RlLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fZGVzdGluYXRpb25Ob2RlSWRzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH07XG4gICAgICAgIFN0b3J5Tm9kZS5wcm90b3R5cGUuZ2V0QWNxdWlyZWRTa2lsbElkcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9hY3F1aXJlZFNraWxsSWRzLnNsaWNlKCk7XG4gICAgICAgIH07XG4gICAgICAgIFN0b3J5Tm9kZS5wcm90b3R5cGUuYWRkQWNxdWlyZWRTa2lsbElkID0gZnVuY3Rpb24gKGFjcXVpcmVkU2tpbGxpZCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2FjcXVpcmVkU2tpbGxJZHMuaW5kZXhPZihhY3F1aXJlZFNraWxsaWQpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgZ2l2ZW4gc2tpbGwgaXMgYWxyZWFkeSBhbiBhY3F1aXJlZCBza2lsbC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2FjcXVpcmVkU2tpbGxJZHMucHVzaChhY3F1aXJlZFNraWxsaWQpO1xuICAgICAgICB9O1xuICAgICAgICBTdG9yeU5vZGUucHJvdG90eXBlLnJlbW92ZUFjcXVpcmVkU2tpbGxJZCA9IGZ1bmN0aW9uIChza2lsbElkKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLl9hY3F1aXJlZFNraWxsSWRzLmluZGV4T2Yoc2tpbGxJZCk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RoZSBnaXZlbiBza2lsbCBpcyBub3QgYW4gYWNxdWlyZWQgc2tpbGwuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9hY3F1aXJlZFNraWxsSWRzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH07XG4gICAgICAgIFN0b3J5Tm9kZS5wcm90b3R5cGUuZ2V0UHJlcmVxdWlzaXRlU2tpbGxJZHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcHJlcmVxdWlzaXRlU2tpbGxJZHMuc2xpY2UoKTtcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnlOb2RlLnByb3RvdHlwZS5hZGRQcmVyZXF1aXNpdGVTa2lsbElkID0gZnVuY3Rpb24gKHNraWxsSWQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9wcmVyZXF1aXNpdGVTa2lsbElkcy5pbmRleE9mKHNraWxsSWQpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgZ2l2ZW4gc2tpbGwgaWQgaXMgYWxyZWFkeSBhIHByZXJlcXVpc2l0ZSBza2lsbC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3ByZXJlcXVpc2l0ZVNraWxsSWRzLnB1c2goc2tpbGxJZCk7XG4gICAgICAgIH07XG4gICAgICAgIFN0b3J5Tm9kZS5wcm90b3R5cGUucmVtb3ZlUHJlcmVxdWlzaXRlU2tpbGxJZCA9IGZ1bmN0aW9uIChza2lsbElkKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLl9wcmVyZXF1aXNpdGVTa2lsbElkcy5pbmRleE9mKHNraWxsSWQpO1xuICAgICAgICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgZ2l2ZW4gc2tpbGwgaWQgaXMgbm90IGEgcHJlcmVxdWlzaXRlIHNraWxsLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fcHJlcmVxdWlzaXRlU2tpbGxJZHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gU3RhdGljIGNsYXNzIG1ldGhvZHMuIE5vdGUgdGhhdCBcInRoaXNcIiBpcyBub3QgYXZhaWxhYmxlIGluIHN0YXRpY1xuICAgICAgICAvLyBjb250ZXh0cy4gVGhpcyBmdW5jdGlvbiB0YWtlcyBhIEpTT04gb2JqZWN0IHdoaWNoIHJlcHJlc2VudHMgYSBiYWNrZW5kXG4gICAgICAgIC8vIHN0b3J5IHB5dGhvbiBkaWN0LlxuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBTdG9yeU5vZGVbJ2NyZWF0ZUZyb21CYWNrZW5kRGljdCddID0gZnVuY3Rpb24gKHN0b3J5Tm9kZUJhY2tlbmRPYmplY3QpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICByZXR1cm4gbmV3IFN0b3J5Tm9kZShzdG9yeU5vZGVCYWNrZW5kT2JqZWN0LmlkLCBzdG9yeU5vZGVCYWNrZW5kT2JqZWN0LnRpdGxlLCBzdG9yeU5vZGVCYWNrZW5kT2JqZWN0LmRlc3RpbmF0aW9uX25vZGVfaWRzLCBzdG9yeU5vZGVCYWNrZW5kT2JqZWN0LnByZXJlcXVpc2l0ZV9za2lsbF9pZHMsIHN0b3J5Tm9kZUJhY2tlbmRPYmplY3QuYWNxdWlyZWRfc2tpbGxfaWRzLCBzdG9yeU5vZGVCYWNrZW5kT2JqZWN0Lm91dGxpbmUsIHN0b3J5Tm9kZUJhY2tlbmRPYmplY3Qub3V0bGluZV9pc19maW5hbGl6ZWQsIHN0b3J5Tm9kZUJhY2tlbmRPYmplY3QuZXhwbG9yYXRpb25faWQpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBTdG9yeU5vZGVbJ2NyZWF0ZUZyb21JZEFuZFRpdGxlJ10gPSBmdW5jdGlvbiAobm9kZUlkLCB0aXRsZSkge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIHJldHVybiBuZXcgU3RvcnlOb2RlKG5vZGVJZCwgdGl0bGUsIFtdLCBbXSwgW10sICcnLCBmYWxzZSwgbnVsbCk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBTdG9yeU5vZGU7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIGFuZCBtdXRhdGluZyBpbnN0YW5jZXMgb2YgZnJvbnRlbmRcbiAqIHN0b3J5IGRvbWFpbiBvYmplY3RzLlxuICovXG5yZXF1aXJlKCdkb21haW4vc3RvcnkvU3RvcnlDb250ZW50c09iamVjdEZhY3RvcnkudHMnKTtcbm9wcGlhLmZhY3RvcnkoJ1N0b3J5T2JqZWN0RmFjdG9yeScsIFsnU3RvcnlDb250ZW50c09iamVjdEZhY3RvcnknLFxuICAgIGZ1bmN0aW9uIChTdG9yeUNvbnRlbnRzT2JqZWN0RmFjdG9yeSkge1xuICAgICAgICB2YXIgU3RvcnkgPSBmdW5jdGlvbiAoaWQsIHRpdGxlLCBkZXNjcmlwdGlvbiwgbm90ZXMsIHN0b3J5Q29udGVudHMsIGxhbmd1YWdlQ29kZSwgdmVyc2lvbikge1xuICAgICAgICAgICAgdGhpcy5faWQgPSBpZDtcbiAgICAgICAgICAgIHRoaXMuX3RpdGxlID0gdGl0bGU7XG4gICAgICAgICAgICB0aGlzLl9kZXNjcmlwdGlvbiA9IGRlc2NyaXB0aW9uO1xuICAgICAgICAgICAgdGhpcy5fbm90ZXMgPSBub3RlcztcbiAgICAgICAgICAgIHRoaXMuX3N0b3J5Q29udGVudHMgPSBzdG9yeUNvbnRlbnRzO1xuICAgICAgICAgICAgdGhpcy5fbGFuZ3VhZ2VDb2RlID0gbGFuZ3VhZ2VDb2RlO1xuICAgICAgICAgICAgdGhpcy5fdmVyc2lvbiA9IHZlcnNpb247XG4gICAgICAgIH07XG4gICAgICAgIC8vIEluc3RhbmNlIG1ldGhvZHNcbiAgICAgICAgU3RvcnkucHJvdG90eXBlLmdldElkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lkO1xuICAgICAgICB9O1xuICAgICAgICBTdG9yeS5wcm90b3R5cGUuZ2V0VGl0bGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdGl0bGU7XG4gICAgICAgIH07XG4gICAgICAgIFN0b3J5LnByb3RvdHlwZS5zZXRUaXRsZSA9IGZ1bmN0aW9uICh0aXRsZSkge1xuICAgICAgICAgICAgdGhpcy5fdGl0bGUgPSB0aXRsZTtcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnkucHJvdG90eXBlLmdldERlc2NyaXB0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Rlc2NyaXB0aW9uO1xuICAgICAgICB9O1xuICAgICAgICBTdG9yeS5wcm90b3R5cGUuc2V0RGVzY3JpcHRpb24gPSBmdW5jdGlvbiAoZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuX2Rlc2NyaXB0aW9uID0gZGVzY3JpcHRpb247XG4gICAgICAgIH07XG4gICAgICAgIFN0b3J5LnByb3RvdHlwZS5nZXROb3RlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9ub3RlcztcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnkucHJvdG90eXBlLnNldE5vdGVzID0gZnVuY3Rpb24gKG5vdGVzKSB7XG4gICAgICAgICAgICB0aGlzLl9ub3RlcyA9IG5vdGVzO1xuICAgICAgICB9O1xuICAgICAgICBTdG9yeS5wcm90b3R5cGUuZ2V0TGFuZ3VhZ2VDb2RlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xhbmd1YWdlQ29kZTtcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnkucHJvdG90eXBlLnNldExhbmd1YWdlQ29kZSA9IGZ1bmN0aW9uIChsYW5ndWFnZUNvZGUpIHtcbiAgICAgICAgICAgIHRoaXMuX2xhbmd1YWdlQ29kZSA9IGxhbmd1YWdlQ29kZTtcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnkucHJvdG90eXBlLmdldFZlcnNpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdmVyc2lvbjtcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnkucHJvdG90eXBlLmdldFN0b3J5Q29udGVudHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fc3RvcnlDb250ZW50cztcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnkucHJvdG90eXBlLnZhbGlkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGlzc3VlcyA9IFtdO1xuICAgICAgICAgICAgaWYgKHRoaXMuX3RpdGxlID09PSAnJykge1xuICAgICAgICAgICAgICAgIGlzc3Vlcy5wdXNoKCdTdG9yeSB0aXRsZSBzaG91bGQgbm90IGJlIGVtcHR5Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpc3N1ZXMgPSBpc3N1ZXMuY29uY2F0KHRoaXMuX3N0b3J5Q29udGVudHMudmFsaWRhdGUoKSk7XG4gICAgICAgICAgICByZXR1cm4gaXNzdWVzO1xuICAgICAgICB9O1xuICAgICAgICAvLyBSZWFzc2lnbnMgYWxsIHZhbHVlcyB3aXRoaW4gdGhpcyBzdG9yeSB0byBtYXRjaCB0aGUgZXhpc3RpbmdcbiAgICAgICAgLy8gc3RvcnkuIFRoaXMgaXMgcGVyZm9ybWVkIGFzIGEgZGVlcCBjb3B5IHN1Y2ggdGhhdCBub25lIG9mIHRoZVxuICAgICAgICAvLyBpbnRlcm5hbCwgYmluZGFibGUgb2JqZWN0cyBhcmUgY2hhbmdlZCB3aXRoaW4gdGhpcyBzdG9yeS5cbiAgICAgICAgU3RvcnkucHJvdG90eXBlLmNvcHlGcm9tU3RvcnkgPSBmdW5jdGlvbiAob3RoZXJTdG9yeSkge1xuICAgICAgICAgICAgdGhpcy5faWQgPSBvdGhlclN0b3J5LmdldElkKCk7XG4gICAgICAgICAgICB0aGlzLnNldFRpdGxlKG90aGVyU3RvcnkuZ2V0VGl0bGUoKSk7XG4gICAgICAgICAgICB0aGlzLnNldERlc2NyaXB0aW9uKG90aGVyU3RvcnkuZ2V0RGVzY3JpcHRpb24oKSk7XG4gICAgICAgICAgICB0aGlzLnNldE5vdGVzKG90aGVyU3RvcnkuZ2V0Tm90ZXMoKSk7XG4gICAgICAgICAgICB0aGlzLnNldExhbmd1YWdlQ29kZShvdGhlclN0b3J5LmdldExhbmd1YWdlQ29kZSgpKTtcbiAgICAgICAgICAgIHRoaXMuX3ZlcnNpb24gPSBvdGhlclN0b3J5LmdldFZlcnNpb24oKTtcbiAgICAgICAgICAgIHRoaXMuX3N0b3J5Q29udGVudHMgPSBvdGhlclN0b3J5LmdldFN0b3J5Q29udGVudHMoKTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gU3RhdGljIGNsYXNzIG1ldGhvZHMuIE5vdGUgdGhhdCBcInRoaXNcIiBpcyBub3QgYXZhaWxhYmxlIGluIHN0YXRpY1xuICAgICAgICAvLyBjb250ZXh0cy4gVGhpcyBmdW5jdGlvbiB0YWtlcyBhIEpTT04gb2JqZWN0IHdoaWNoIHJlcHJlc2VudHMgYSBiYWNrZW5kXG4gICAgICAgIC8vIHN0b3J5IHB5dGhvbiBkaWN0LlxuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBTdG9yeVsnY3JlYXRlRnJvbUJhY2tlbmREaWN0J10gPSBmdW5jdGlvbiAoc3RvcnlCYWNrZW5kRGljdCkge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIHJldHVybiBuZXcgU3Rvcnkoc3RvcnlCYWNrZW5kRGljdC5pZCwgc3RvcnlCYWNrZW5kRGljdC50aXRsZSwgc3RvcnlCYWNrZW5kRGljdC5kZXNjcmlwdGlvbiwgc3RvcnlCYWNrZW5kRGljdC5ub3RlcywgU3RvcnlDb250ZW50c09iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUJhY2tlbmREaWN0KHN0b3J5QmFja2VuZERpY3Quc3RvcnlfY29udGVudHMpLCBzdG9yeUJhY2tlbmREaWN0Lmxhbmd1YWdlX2NvZGUsIHN0b3J5QmFja2VuZERpY3QudmVyc2lvbik7XG4gICAgICAgIH07XG4gICAgICAgIC8vIENyZWF0ZSBhbiBpbnRlcnN0aXRpYWwgc3RvcnkgdGhhdCB3b3VsZCBiZSBkaXNwbGF5ZWQgaW4gdGhlIGVkaXRvciB1bnRpbFxuICAgICAgICAvLyB0aGUgYWN0dWFsIHN0b3J5IGlzIGZldGNoZWQgZnJvbSB0aGUgYmFja2VuZC5cbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgU3RvcnlbJ2NyZWF0ZUludGVyc3RpdGlhbFN0b3J5J10gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBTdG9yeShudWxsLCAnU3RvcnkgdGl0bGUgbG9hZGluZycsICdTdG9yeSBkZXNjcmlwdGlvbiBsb2FkaW5nJywgJ1N0b3J5IG5vdGVzIGxvYWRpbmcnLCBudWxsLCAnZW4nLCAxKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIFN0b3J5O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIGJ1aWxkIGNoYW5nZXMgdG8gYSBzdG9yeS4gVGhlc2UgY2hhbmdlcyBtYXlcbiAqIHRoZW4gYmUgdXNlZCBieSBvdGhlciBzZXJ2aWNlcywgc3VjaCBhcyBhIGJhY2tlbmQgQVBJIHNlcnZpY2UgdG8gdXBkYXRlIHRoZVxuICogc3RvcnkgaW4gdGhlIGJhY2tlbmQuIFRoaXMgc2VydmljZSBhbHNvIHJlZ2lzdGVycyBhbGwgY2hhbmdlcyB3aXRoIHRoZVxuICogdW5kby9yZWRvIHNlcnZpY2UuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9lZGl0b3IvdW5kb19yZWRvL0NoYW5nZU9iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9lZGl0b3IvdW5kb19yZWRvL1VuZG9SZWRvU2VydmljZS50cycpO1xuLy8gVGhlc2Ugc2hvdWxkIG1hdGNoIHRoZSBjb25zdGFudHMgZGVmaW5lZCBpbiBjb3JlLmRvbWFpbi5zdG9yeV9kb21haW4uXG5vcHBpYS5jb25zdGFudCgnQ01EX0FERF9TVE9SWV9OT0RFJywgJ2FkZF9zdG9yeV9ub2RlJyk7XG5vcHBpYS5jb25zdGFudCgnQ01EX0RFTEVURV9TVE9SWV9OT0RFJywgJ2RlbGV0ZV9zdG9yeV9ub2RlJyk7XG5vcHBpYS5jb25zdGFudCgnQ01EX1VQREFURV9TVE9SWV9OT0RFX09VVExJTkVfU1RBVFVTJywgJ3VwZGF0ZV9zdG9yeV9ub2RlX291dGxpbmVfc3RhdHVzJyk7XG5vcHBpYS5jb25zdGFudCgnQ01EX1VQREFURV9TVE9SWV9QUk9QRVJUWScsICd1cGRhdGVfc3RvcnlfcHJvcGVydHknKTtcbm9wcGlhLmNvbnN0YW50KCdDTURfVVBEQVRFX1NUT1JZX05PREVfUFJPUEVSVFknLCAndXBkYXRlX3N0b3J5X25vZGVfcHJvcGVydHknKTtcbm9wcGlhLmNvbnN0YW50KCdDTURfVVBEQVRFX1NUT1JZX0NPTlRFTlRTX1BST1BFUlRZJywgJ3VwZGF0ZV9zdG9yeV9jb250ZW50c19wcm9wZXJ0eScpO1xub3BwaWEuY29uc3RhbnQoJ1NUT1JZX1BST1BFUlRZX1RJVExFJywgJ3RpdGxlJyk7XG5vcHBpYS5jb25zdGFudCgnU1RPUllfUFJPUEVSVFlfREVTQ1JJUFRJT04nLCAnZGVzY3JpcHRpb24nKTtcbm9wcGlhLmNvbnN0YW50KCdTVE9SWV9QUk9QRVJUWV9OT1RFUycsICdub3RlcycpO1xub3BwaWEuY29uc3RhbnQoJ1NUT1JZX1BST1BFUlRZX0xBTkdVQUdFX0NPREUnLCAnbGFuZ3VhZ2VfY29kZScpO1xub3BwaWEuY29uc3RhbnQoJ0lOSVRJQUxfTk9ERV9JRCcsICdpbml0aWFsX25vZGVfaWQnKTtcbm9wcGlhLmNvbnN0YW50KCdTVE9SWV9OT0RFX1BST1BFUlRZX1RJVExFJywgJ3RpdGxlJyk7XG5vcHBpYS5jb25zdGFudCgnU1RPUllfTk9ERV9QUk9QRVJUWV9PVVRMSU5FJywgJ291dGxpbmUnKTtcbm9wcGlhLmNvbnN0YW50KCdTVE9SWV9OT0RFX1BST1BFUlRZX0VYUExPUkFUSU9OX0lEJywgJ2V4cGxvcmF0aW9uX2lkJyk7XG5vcHBpYS5jb25zdGFudCgnU1RPUllfTk9ERV9QUk9QRVJUWV9ERVNUSU5BVElPTl9OT0RFX0lEUycsICdkZXN0aW5hdGlvbl9ub2RlX2lkcycpO1xub3BwaWEuY29uc3RhbnQoJ1NUT1JZX05PREVfUFJPUEVSVFlfQUNRVUlSRURfU0tJTExfSURTJywgJ2FjcXVpcmVkX3NraWxsX2lkcycpO1xub3BwaWEuY29uc3RhbnQoJ1NUT1JZX05PREVfUFJPUEVSVFlfUFJFUkVRVUlTSVRFX1NLSUxMX0lEUycsICdwcmVyZXF1aXNpdGVfc2tpbGxfaWRzJyk7XG5vcHBpYS5mYWN0b3J5KCdTdG9yeVVwZGF0ZVNlcnZpY2UnLCBbXG4gICAgJ0NoYW5nZU9iamVjdEZhY3RvcnknLCAnVW5kb1JlZG9TZXJ2aWNlJyxcbiAgICAnQ01EX0FERF9TVE9SWV9OT0RFJywgJ0NNRF9ERUxFVEVfU1RPUllfTk9ERScsXG4gICAgJ0NNRF9VUERBVEVfU1RPUllfQ09OVEVOVFNfUFJPUEVSVFknLCAnQ01EX1VQREFURV9TVE9SWV9OT0RFX09VVExJTkVfU1RBVFVTJyxcbiAgICAnQ01EX1VQREFURV9TVE9SWV9OT0RFX1BST1BFUlRZJywgJ0NNRF9VUERBVEVfU1RPUllfUFJPUEVSVFknLFxuICAgICdJTklUSUFMX05PREVfSUQnLCAnU1RPUllfTk9ERV9QUk9QRVJUWV9BQ1FVSVJFRF9TS0lMTF9JRFMnLFxuICAgICdTVE9SWV9OT0RFX1BST1BFUlRZX0RFU1RJTkFUSU9OX05PREVfSURTJyxcbiAgICAnU1RPUllfTk9ERV9QUk9QRVJUWV9FWFBMT1JBVElPTl9JRCcsXG4gICAgJ1NUT1JZX05PREVfUFJPUEVSVFlfT1VUTElORScsICdTVE9SWV9OT0RFX1BST1BFUlRZX1BSRVJFUVVJU0lURV9TS0lMTF9JRFMnLFxuICAgICdTVE9SWV9OT0RFX1BST1BFUlRZX1RJVExFJywgJ1NUT1JZX1BST1BFUlRZX0RFU0NSSVBUSU9OJyxcbiAgICAnU1RPUllfUFJPUEVSVFlfTEFOR1VBR0VfQ09ERScsICdTVE9SWV9QUk9QRVJUWV9OT1RFUycsXG4gICAgJ1NUT1JZX1BST1BFUlRZX1RJVExFJywgZnVuY3Rpb24gKENoYW5nZU9iamVjdEZhY3RvcnksIFVuZG9SZWRvU2VydmljZSwgQ01EX0FERF9TVE9SWV9OT0RFLCBDTURfREVMRVRFX1NUT1JZX05PREUsIENNRF9VUERBVEVfU1RPUllfQ09OVEVOVFNfUFJPUEVSVFksIENNRF9VUERBVEVfU1RPUllfTk9ERV9PVVRMSU5FX1NUQVRVUywgQ01EX1VQREFURV9TVE9SWV9OT0RFX1BST1BFUlRZLCBDTURfVVBEQVRFX1NUT1JZX1BST1BFUlRZLCBJTklUSUFMX05PREVfSUQsIFNUT1JZX05PREVfUFJPUEVSVFlfQUNRVUlSRURfU0tJTExfSURTLCBTVE9SWV9OT0RFX1BST1BFUlRZX0RFU1RJTkFUSU9OX05PREVfSURTLCBTVE9SWV9OT0RFX1BST1BFUlRZX0VYUExPUkFUSU9OX0lELCBTVE9SWV9OT0RFX1BST1BFUlRZX09VVExJTkUsIFNUT1JZX05PREVfUFJPUEVSVFlfUFJFUkVRVUlTSVRFX1NLSUxMX0lEUywgU1RPUllfTk9ERV9QUk9QRVJUWV9USVRMRSwgU1RPUllfUFJPUEVSVFlfREVTQ1JJUFRJT04sIFNUT1JZX1BST1BFUlRZX0xBTkdVQUdFX0NPREUsIFNUT1JZX1BST1BFUlRZX05PVEVTLCBTVE9SWV9QUk9QRVJUWV9USVRMRSkge1xuICAgICAgICAvLyBDcmVhdGVzIGEgY2hhbmdlIHVzaW5nIGFuIGFwcGx5IGZ1bmN0aW9uLCByZXZlcnNlIGZ1bmN0aW9uLCBhIGNoYW5nZVxuICAgICAgICAvLyBjb21tYW5kIGFuZCByZWxhdGVkIHBhcmFtZXRlcnMuIFRoZSBjaGFuZ2UgaXMgYXBwbGllZCB0byBhIGdpdmVuXG4gICAgICAgIC8vIHN0b3J5LlxuICAgICAgICB2YXIgX2FwcGx5Q2hhbmdlID0gZnVuY3Rpb24gKHN0b3J5LCBjb21tYW5kLCBwYXJhbXMsIGFwcGx5LCByZXZlcnNlKSB7XG4gICAgICAgICAgICB2YXIgY2hhbmdlRGljdCA9IGFuZ3VsYXIuY29weShwYXJhbXMpO1xuICAgICAgICAgICAgY2hhbmdlRGljdC5jbWQgPSBjb21tYW5kO1xuICAgICAgICAgICAgdmFyIGNoYW5nZU9iaiA9IENoYW5nZU9iamVjdEZhY3RvcnkuY3JlYXRlKGNoYW5nZURpY3QsIGFwcGx5LCByZXZlcnNlKTtcbiAgICAgICAgICAgIFVuZG9SZWRvU2VydmljZS5hcHBseUNoYW5nZShjaGFuZ2VPYmosIHN0b3J5KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9nZXRQYXJhbWV0ZXJGcm9tQ2hhbmdlRGljdCA9IGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBwYXJhbU5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBjaGFuZ2VEaWN0W3BhcmFtTmFtZV07XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfZ2V0Tm9kZUlkRnJvbUNoYW5nZURpY3QgPSBmdW5jdGlvbiAoY2hhbmdlRGljdCkge1xuICAgICAgICAgICAgcmV0dXJuIF9nZXRQYXJhbWV0ZXJGcm9tQ2hhbmdlRGljdChjaGFuZ2VEaWN0LCAnbm9kZV9pZCcpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2dldFN0b3J5Tm9kZSA9IGZ1bmN0aW9uIChzdG9yeUNvbnRlbnRzLCBub2RlSWQpIHtcbiAgICAgICAgICAgIHZhciBzdG9yeU5vZGVJbmRleCA9IHN0b3J5Q29udGVudHMuZ2V0Tm9kZUluZGV4KG5vZGVJZCk7XG4gICAgICAgICAgICBpZiAoc3RvcnlOb2RlSW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RoZSBnaXZlbiBub2RlIGRvZXNuXFwndCBleGlzdCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0b3J5Q29udGVudHMuZ2V0Tm9kZXMoKVtzdG9yeU5vZGVJbmRleF07XG4gICAgICAgIH07XG4gICAgICAgIC8vIEFwcGxpZXMgYSBzdG9yeSBwcm9wZXJ0eSBjaGFuZ2UsIHNwZWNpZmljYWxseS4gU2VlIF9hcHBseUNoYW5nZSgpXG4gICAgICAgIC8vIGZvciBkZXRhaWxzIG9uIHRoZSBvdGhlciBiZWhhdmlvciBvZiB0aGlzIGZ1bmN0aW9uLlxuICAgICAgICB2YXIgX2FwcGx5U3RvcnlQcm9wZXJ0eUNoYW5nZSA9IGZ1bmN0aW9uIChzdG9yeSwgcHJvcGVydHlOYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUsIGFwcGx5LCByZXZlcnNlKSB7XG4gICAgICAgICAgICBfYXBwbHlDaGFuZ2Uoc3RvcnksIENNRF9VUERBVEVfU1RPUllfUFJPUEVSVFksIHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eV9uYW1lOiBwcm9wZXJ0eU5hbWUsXG4gICAgICAgICAgICAgICAgbmV3X3ZhbHVlOiBhbmd1bGFyLmNvcHkobmV3VmFsdWUpLFxuICAgICAgICAgICAgICAgIG9sZF92YWx1ZTogYW5ndWxhci5jb3B5KG9sZFZhbHVlKVxuICAgICAgICAgICAgfSwgYXBwbHksIHJldmVyc2UpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2FwcGx5U3RvcnlDb250ZW50c1Byb3BlcnR5Q2hhbmdlID0gZnVuY3Rpb24gKHN0b3J5LCBwcm9wZXJ0eU5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSwgYXBwbHksIHJldmVyc2UpIHtcbiAgICAgICAgICAgIF9hcHBseUNoYW5nZShzdG9yeSwgQ01EX1VQREFURV9TVE9SWV9DT05URU5UU19QUk9QRVJUWSwge1xuICAgICAgICAgICAgICAgIHByb3BlcnR5X25hbWU6IHByb3BlcnR5TmFtZSxcbiAgICAgICAgICAgICAgICBuZXdfdmFsdWU6IGFuZ3VsYXIuY29weShuZXdWYWx1ZSksXG4gICAgICAgICAgICAgICAgb2xkX3ZhbHVlOiBhbmd1bGFyLmNvcHkob2xkVmFsdWUpXG4gICAgICAgICAgICB9LCBhcHBseSwgcmV2ZXJzZSk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfYXBwbHlTdG9yeU5vZGVQcm9wZXJ0eUNoYW5nZSA9IGZ1bmN0aW9uIChzdG9yeSwgcHJvcGVydHlOYW1lLCBub2RlSWQsIG9sZFZhbHVlLCBuZXdWYWx1ZSwgYXBwbHksIHJldmVyc2UpIHtcbiAgICAgICAgICAgIF9hcHBseUNoYW5nZShzdG9yeSwgQ01EX1VQREFURV9TVE9SWV9OT0RFX1BST1BFUlRZLCB7XG4gICAgICAgICAgICAgICAgbm9kZV9pZDogbm9kZUlkLFxuICAgICAgICAgICAgICAgIHByb3BlcnR5X25hbWU6IHByb3BlcnR5TmFtZSxcbiAgICAgICAgICAgICAgICBuZXdfdmFsdWU6IGFuZ3VsYXIuY29weShuZXdWYWx1ZSksXG4gICAgICAgICAgICAgICAgb2xkX3ZhbHVlOiBhbmd1bGFyLmNvcHkob2xkVmFsdWUpXG4gICAgICAgICAgICB9LCBhcHBseSwgcmV2ZXJzZSk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfZ2V0TmV3UHJvcGVydHlWYWx1ZUZyb21DaGFuZ2VEaWN0ID0gZnVuY3Rpb24gKGNoYW5nZURpY3QpIHtcbiAgICAgICAgICAgIHJldHVybiBfZ2V0UGFyYW1ldGVyRnJvbUNoYW5nZURpY3QoY2hhbmdlRGljdCwgJ25ld192YWx1ZScpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUaGVzZSBmdW5jdGlvbnMgYXJlIGFzc29jaWF0ZWQgd2l0aCB1cGRhdGVzIGF2YWlsYWJsZSBpblxuICAgICAgICAvLyBjb3JlLmRvbWFpbi5zdG9yeV9zZXJ2aWNlcy5hcHBseV9jaGFuZ2VfbGlzdC5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2hhbmdlcyB0aGUgdGl0bGUgb2YgYSBzdG9yeSBhbmQgcmVjb3JkcyB0aGUgY2hhbmdlIGluIHRoZVxuICAgICAgICAgICAgICogdW5kby9yZWRvIHNlcnZpY2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNldFN0b3J5VGl0bGU6IGZ1bmN0aW9uIChzdG9yeSwgdGl0bGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgb2xkVGl0bGUgPSBhbmd1bGFyLmNvcHkoc3RvcnkuZ2V0VGl0bGUoKSk7XG4gICAgICAgICAgICAgICAgX2FwcGx5U3RvcnlQcm9wZXJ0eUNoYW5nZShzdG9yeSwgU1RPUllfUFJPUEVSVFlfVElUTEUsIG9sZFRpdGxlLCB0aXRsZSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFwcGx5XG4gICAgICAgICAgICAgICAgICAgIHZhciB0aXRsZSA9IF9nZXROZXdQcm9wZXJ0eVZhbHVlRnJvbUNoYW5nZURpY3QoY2hhbmdlRGljdCk7XG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LnNldFRpdGxlKHRpdGxlKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5kby5cbiAgICAgICAgICAgICAgICAgICAgc3Rvcnkuc2V0VGl0bGUob2xkVGl0bGUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2hhbmdlcyB0aGUgZGVzY3JpcHRpb24gb2YgYSBzdG9yeSBhbmQgcmVjb3JkcyB0aGUgY2hhbmdlIGluIHRoZVxuICAgICAgICAgICAgICogdW5kby9yZWRvIHNlcnZpY2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNldFN0b3J5RGVzY3JpcHRpb246IGZ1bmN0aW9uIChzdG9yeSwgZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgICAgICB2YXIgb2xkRGVzY3JpcHRpb24gPSBhbmd1bGFyLmNvcHkoc3RvcnkuZ2V0RGVzY3JpcHRpb24oKSk7XG4gICAgICAgICAgICAgICAgX2FwcGx5U3RvcnlQcm9wZXJ0eUNoYW5nZShzdG9yeSwgU1RPUllfUFJPUEVSVFlfREVTQ1JJUFRJT04sIG9sZERlc2NyaXB0aW9uLCBkZXNjcmlwdGlvbiwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFwcGx5XG4gICAgICAgICAgICAgICAgICAgIHZhciBkZXNjcmlwdGlvbiA9IF9nZXROZXdQcm9wZXJ0eVZhbHVlRnJvbUNoYW5nZURpY3QoY2hhbmdlRGljdCk7XG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LnNldERlc2NyaXB0aW9uKGRlc2NyaXB0aW9uKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5kby5cbiAgICAgICAgICAgICAgICAgICAgc3Rvcnkuc2V0RGVzY3JpcHRpb24ob2xkRGVzY3JpcHRpb24pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2hhbmdlcyB0aGUgbm90ZXMgZm9yIGEgc3RvcnkgYW5kIHJlY29yZHMgdGhlIGNoYW5nZSBpbiB0aGVcbiAgICAgICAgICAgICAqIHVuZG8vcmVkbyBzZXJ2aWNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzZXRTdG9yeU5vdGVzOiBmdW5jdGlvbiAoc3RvcnksIG5vdGVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9sZE5vdGVzID0gYW5ndWxhci5jb3B5KHN0b3J5LmdldE5vdGVzKCkpO1xuICAgICAgICAgICAgICAgIF9hcHBseVN0b3J5UHJvcGVydHlDaGFuZ2Uoc3RvcnksIFNUT1JZX1BST1BFUlRZX05PVEVTLCBvbGROb3Rlcywgbm90ZXMsIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBcHBseVxuICAgICAgICAgICAgICAgICAgICB2YXIgbm90ZXMgPSBfZ2V0TmV3UHJvcGVydHlWYWx1ZUZyb21DaGFuZ2VEaWN0KGNoYW5nZURpY3QpO1xuICAgICAgICAgICAgICAgICAgICBzdG9yeS5zZXROb3Rlcyhub3Rlcyk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZG8uXG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LnNldE5vdGVzKG9sZE5vdGVzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENoYW5nZXMgdGhlIGxhbmd1YWdlIGNvZGUgb2YgYSBzdG9yeSBhbmQgcmVjb3JkcyB0aGUgY2hhbmdlIGluXG4gICAgICAgICAgICAgKiB0aGUgdW5kby9yZWRvIHNlcnZpY2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNldFN0b3J5TGFuZ3VhZ2VDb2RlOiBmdW5jdGlvbiAoc3RvcnksIGxhbmd1YWdlQ29kZSkge1xuICAgICAgICAgICAgICAgIHZhciBvbGRMYW5ndWFnZUNvZGUgPSBhbmd1bGFyLmNvcHkoc3RvcnkuZ2V0TGFuZ3VhZ2VDb2RlKCkpO1xuICAgICAgICAgICAgICAgIF9hcHBseVN0b3J5UHJvcGVydHlDaGFuZ2Uoc3RvcnksIFNUT1JZX1BST1BFUlRZX0xBTkdVQUdFX0NPREUsIG9sZExhbmd1YWdlQ29kZSwgbGFuZ3VhZ2VDb2RlLCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwbHkuXG4gICAgICAgICAgICAgICAgICAgIHZhciBsYW5ndWFnZUNvZGUgPSBfZ2V0TmV3UHJvcGVydHlWYWx1ZUZyb21DaGFuZ2VEaWN0KGNoYW5nZURpY3QpO1xuICAgICAgICAgICAgICAgICAgICBzdG9yeS5zZXRMYW5ndWFnZUNvZGUobGFuZ3VhZ2VDb2RlKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5kby5cbiAgICAgICAgICAgICAgICAgICAgc3Rvcnkuc2V0TGFuZ3VhZ2VDb2RlKG9sZExhbmd1YWdlQ29kZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTZXRzIHRoZSBpbml0aWFsIG5vZGUgb2YgdGhlIHN0b3J5IGFuZCByZWNvcmRzIHRoZSBjaGFuZ2UgaW5cbiAgICAgICAgICAgICAqIHRoZSB1bmRvL3JlZG8gc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2V0SW5pdGlhbE5vZGVJZDogZnVuY3Rpb24gKHN0b3J5LCBuZXdJbml0aWFsTm9kZUlkKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9sZEluaXRpYWxOb2RlSWQgPSBhbmd1bGFyLmNvcHkoc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLmdldEluaXRpYWxOb2RlSWQoKSk7XG4gICAgICAgICAgICAgICAgX2FwcGx5U3RvcnlDb250ZW50c1Byb3BlcnR5Q2hhbmdlKHN0b3J5LCBJTklUSUFMX05PREVfSUQsIG9sZEluaXRpYWxOb2RlSWQsIG5ld0luaXRpYWxOb2RlSWQsIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBcHBseS5cbiAgICAgICAgICAgICAgICAgICAgc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLnNldEluaXRpYWxOb2RlSWQobmV3SW5pdGlhbE5vZGVJZCk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZG8uXG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5zZXRJbml0aWFsTm9kZUlkKG9sZEluaXRpYWxOb2RlSWQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ3JlYXRlcyBhIHN0b3J5IG5vZGUsIGFkZHMgaXQgdG8gdGhlIHN0b3J5IGFuZCByZWNvcmRzIHRoZSBjaGFuZ2UgaW5cbiAgICAgICAgICAgICAqIHRoZSB1bmRvL3JlZG8gc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgYWRkU3RvcnlOb2RlOiBmdW5jdGlvbiAoc3RvcnksIG5vZGVUaXRsZSkge1xuICAgICAgICAgICAgICAgIHZhciBuZXh0Tm9kZUlkID0gc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLmdldE5leHROb2RlSWQoKTtcbiAgICAgICAgICAgICAgICBfYXBwbHlDaGFuZ2Uoc3RvcnksIENNRF9BRERfU1RPUllfTk9ERSwge1xuICAgICAgICAgICAgICAgICAgICBub2RlX2lkOiBuZXh0Tm9kZUlkLFxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogbm9kZVRpdGxlXG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFwcGx5LlxuICAgICAgICAgICAgICAgICAgICBzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCkuYWRkTm9kZShub2RlVGl0bGUpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBVbmRvLlxuICAgICAgICAgICAgICAgICAgICB2YXIgbm9kZUlkID0gX2dldE5vZGVJZEZyb21DaGFuZ2VEaWN0KGNoYW5nZURpY3QpO1xuICAgICAgICAgICAgICAgICAgICBzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCkuZGVsZXRlTm9kZShub2RlSWQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmVtb3ZlcyBhIHN0b3J5IG5vZGUsIGFuZCByZWNvcmRzIHRoZSBjaGFuZ2UgaW4gdGhlIHVuZG8vcmVkbyBzZXJ2aWNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBkZWxldGVTdG9yeU5vZGU6IGZ1bmN0aW9uIChzdG9yeSwgbm9kZUlkKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGVJbmRleCA9IHN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5nZXROb2RlSW5kZXgobm9kZUlkKTtcbiAgICAgICAgICAgICAgICBfYXBwbHlDaGFuZ2Uoc3RvcnksIENNRF9ERUxFVEVfU1RPUllfTk9ERSwge1xuICAgICAgICAgICAgICAgICAgICBub2RlX2lkOiBub2RlSWRcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwbHkuXG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5kZWxldGVOb2RlKG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZG8uXG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdBIGRlbGV0ZWQgc3Rvcnkgbm9kZSBjYW5ub3QgYmUgcmVzdG9yZWQuJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBNYXJrcyB0aGUgbm9kZSBvdXRsaW5lIG9mIGEgbm9kZSBhcyBmaW5hbGl6ZWQgYW5kIHJlY29yZHMgdGhlIGNoYW5nZVxuICAgICAgICAgICAgICogaW4gdGhlIHVuZG8vcmVkbyBzZXJ2aWNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBmaW5hbGl6ZVN0b3J5Tm9kZU91dGxpbmU6IGZ1bmN0aW9uIChzdG9yeSwgbm9kZUlkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0b3J5Tm9kZSA9IF9nZXRTdG9yeU5vZGUoc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLCBub2RlSWQpO1xuICAgICAgICAgICAgICAgIGlmIChzdG9yeU5vZGUuZ2V0T3V0bGluZVN0YXR1cygpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdOb2RlIG91dGxpbmUgaXMgYWxyZWFkeSBmaW5hbGl6ZWQuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF9hcHBseUNoYW5nZShzdG9yeSwgQ01EX1VQREFURV9TVE9SWV9OT0RFX09VVExJTkVfU1RBVFVTLCB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVfaWQ6IG5vZGVJZCxcbiAgICAgICAgICAgICAgICAgICAgb2xkX3ZhbHVlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgbmV3X3ZhbHVlOiB0cnVlXG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFwcGx5LlxuICAgICAgICAgICAgICAgICAgICBzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCkubWFya05vZGVPdXRsaW5lQXNGaW5hbGl6ZWQobm9kZUlkKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5kby5cbiAgICAgICAgICAgICAgICAgICAgc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLm1hcmtOb2RlT3V0bGluZUFzTm90RmluYWxpemVkKG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBNYXJrcyB0aGUgbm9kZSBvdXRsaW5lIG9mIGEgbm9kZSBhcyBub3QgZmluYWxpemVkIGFuZCByZWNvcmRzIHRoZVxuICAgICAgICAgICAgICogY2hhbmdlIGluIHRoZSB1bmRvL3JlZG8gc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdW5maW5hbGl6ZVN0b3J5Tm9kZU91dGxpbmU6IGZ1bmN0aW9uIChzdG9yeSwgbm9kZUlkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0b3J5Tm9kZSA9IF9nZXRTdG9yeU5vZGUoc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLCBub2RlSWQpO1xuICAgICAgICAgICAgICAgIGlmICghc3RvcnlOb2RlLmdldE91dGxpbmVTdGF0dXMoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignTm9kZSBvdXRsaW5lIGlzIGFscmVhZHkgbm90IGZpbmFsaXplZC4nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX2FwcGx5Q2hhbmdlKHN0b3J5LCBDTURfVVBEQVRFX1NUT1JZX05PREVfT1VUTElORV9TVEFUVVMsIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZV9pZDogbm9kZUlkLFxuICAgICAgICAgICAgICAgICAgICBvbGRfdmFsdWU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG5ld192YWx1ZTogZmFsc2VcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwbHkuXG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5tYXJrTm9kZU91dGxpbmVBc05vdEZpbmFsaXplZChub2RlSWQpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBVbmRvLlxuICAgICAgICAgICAgICAgICAgICBzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCkubWFya05vZGVPdXRsaW5lQXNGaW5hbGl6ZWQobm9kZUlkKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNldHMgdGhlIG91dGxpbmUgb2YgYSBub2RlIG9mIHRoZSBzdG9yeSBhbmQgcmVjb3JkcyB0aGUgY2hhbmdlXG4gICAgICAgICAgICAgKiBpbiB0aGUgdW5kby9yZWRvIHNlcnZpY2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNldFN0b3J5Tm9kZU91dGxpbmU6IGZ1bmN0aW9uIChzdG9yeSwgbm9kZUlkLCBuZXdPdXRsaW5lKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0b3J5Tm9kZSA9IF9nZXRTdG9yeU5vZGUoc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLCBub2RlSWQpO1xuICAgICAgICAgICAgICAgIHZhciBvbGRPdXRsaW5lID0gc3RvcnlOb2RlLmdldE91dGxpbmUoKTtcbiAgICAgICAgICAgICAgICBfYXBwbHlTdG9yeU5vZGVQcm9wZXJ0eUNoYW5nZShzdG9yeSwgU1RPUllfTk9ERV9QUk9QRVJUWV9PVVRMSU5FLCBub2RlSWQsIG9sZE91dGxpbmUsIG5ld091dGxpbmUsIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBcHBseS5cbiAgICAgICAgICAgICAgICAgICAgc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLnNldE5vZGVPdXRsaW5lKG5vZGVJZCwgbmV3T3V0bGluZSk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZG8uXG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5zZXROb2RlT3V0bGluZShub2RlSWQsIG9sZE91dGxpbmUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2V0cyB0aGUgdGl0bGUgb2YgYSBub2RlIG9mIHRoZSBzdG9yeSBhbmQgcmVjb3JkcyB0aGUgY2hhbmdlXG4gICAgICAgICAgICAgKiBpbiB0aGUgdW5kby9yZWRvIHNlcnZpY2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNldFN0b3J5Tm9kZVRpdGxlOiBmdW5jdGlvbiAoc3RvcnksIG5vZGVJZCwgbmV3VGl0bGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RvcnlOb2RlID0gX2dldFN0b3J5Tm9kZShzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCksIG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgdmFyIG9sZFRpdGxlID0gc3RvcnlOb2RlLmdldFRpdGxlKCk7XG4gICAgICAgICAgICAgICAgX2FwcGx5U3RvcnlOb2RlUHJvcGVydHlDaGFuZ2Uoc3RvcnksIFNUT1JZX05PREVfUFJPUEVSVFlfVElUTEUsIG5vZGVJZCwgb2xkVGl0bGUsIG5ld1RpdGxlLCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwbHkuXG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5zZXROb2RlVGl0bGUobm9kZUlkLCBuZXdUaXRsZSk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZG8uXG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5zZXROb2RlVGl0bGUobm9kZUlkLCBvbGRUaXRsZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTZXRzIHRoZSBpZCBvZiB0aGUgZXhwbG9yYXRpb24gdGhhdCBvZiBhIG5vZGUgb2YgdGhlIHN0b3J5IGlzIGxpbmtlZFxuICAgICAgICAgICAgICogdG8gYW5kIHJlY29yZHMgdGhlIGNoYW5nZSBpbiB0aGUgdW5kby9yZWRvIHNlcnZpY2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNldFN0b3J5Tm9kZUV4cGxvcmF0aW9uSWQ6IGZ1bmN0aW9uIChzdG9yeSwgbm9kZUlkLCBuZXdFeHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0b3J5Tm9kZSA9IF9nZXRTdG9yeU5vZGUoc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLCBub2RlSWQpO1xuICAgICAgICAgICAgICAgIHZhciBvbGRFeHBsb3JhdGlvbklkID0gc3RvcnlOb2RlLmdldEV4cGxvcmF0aW9uSWQoKTtcbiAgICAgICAgICAgICAgICBfYXBwbHlTdG9yeU5vZGVQcm9wZXJ0eUNoYW5nZShzdG9yeSwgU1RPUllfTk9ERV9QUk9QRVJUWV9FWFBMT1JBVElPTl9JRCwgbm9kZUlkLCBvbGRFeHBsb3JhdGlvbklkLCBuZXdFeHBsb3JhdGlvbklkLCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwbHkuXG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5zZXROb2RlRXhwbG9yYXRpb25JZChub2RlSWQsIG5ld0V4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBVbmRvLlxuICAgICAgICAgICAgICAgICAgICBzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCkuc2V0Tm9kZUV4cGxvcmF0aW9uSWQobm9kZUlkLCBvbGRFeHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEFkZHMgYSBkZXN0aW5hdGlvbiBub2RlIGlkIHRvIGEgbm9kZSBvZiBhIHN0b3J5IGFuZCByZWNvcmRzIHRoZSBjaGFuZ2VcbiAgICAgICAgICAgICAqIGluIHRoZSB1bmRvL3JlZG8gc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgYWRkRGVzdGluYXRpb25Ob2RlSWRUb05vZGU6IGZ1bmN0aW9uIChzdG9yeSwgbm9kZUlkLCBkZXN0aW5hdGlvbk5vZGVJZCkge1xuICAgICAgICAgICAgICAgIHZhciBzdG9yeU5vZGUgPSBfZ2V0U3RvcnlOb2RlKHN0b3J5LmdldFN0b3J5Q29udGVudHMoKSwgbm9kZUlkKTtcbiAgICAgICAgICAgICAgICB2YXIgb2xkRGVzdGluYXRpb25Ob2RlSWRzID0gYW5ndWxhci5jb3B5KHN0b3J5Tm9kZS5nZXREZXN0aW5hdGlvbk5vZGVJZHMoKSk7XG4gICAgICAgICAgICAgICAgdmFyIG5ld0Rlc3RpbmF0aW9uTm9kZUlkcyA9IGFuZ3VsYXIuY29weShvbGREZXN0aW5hdGlvbk5vZGVJZHMpO1xuICAgICAgICAgICAgICAgIG5ld0Rlc3RpbmF0aW9uTm9kZUlkcy5wdXNoKGRlc3RpbmF0aW9uTm9kZUlkKTtcbiAgICAgICAgICAgICAgICBfYXBwbHlTdG9yeU5vZGVQcm9wZXJ0eUNoYW5nZShzdG9yeSwgU1RPUllfTk9ERV9QUk9QRVJUWV9ERVNUSU5BVElPTl9OT0RFX0lEUywgbm9kZUlkLCBvbGREZXN0aW5hdGlvbk5vZGVJZHMsIG5ld0Rlc3RpbmF0aW9uTm9kZUlkcywgZnVuY3Rpb24gKGNoYW5nZURpY3QsIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFwcGx5LlxuICAgICAgICAgICAgICAgICAgICBzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCkuYWRkRGVzdGluYXRpb25Ob2RlSWRUb05vZGUobm9kZUlkLCBkZXN0aW5hdGlvbk5vZGVJZCk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZG8uXG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5yZW1vdmVEZXN0aW5hdGlvbk5vZGVJZEZyb21Ob2RlKG5vZGVJZCwgZGVzdGluYXRpb25Ob2RlSWQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmVtb3ZlcyBhIGRlc3RpbmF0aW9uIG5vZGUgaWQgZnJvbSBhIG5vZGUgb2YgYSBzdG9yeSBhbmQgcmVjb3JkcyB0aGVcbiAgICAgICAgICAgICAqIGNoYW5nZSBpbiB0aGUgdW5kby9yZWRvIHNlcnZpY2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHJlbW92ZURlc3RpbmF0aW9uTm9kZUlkRnJvbU5vZGU6IGZ1bmN0aW9uIChzdG9yeSwgbm9kZUlkLCBkZXN0aW5hdGlvbk5vZGVJZCkge1xuICAgICAgICAgICAgICAgIHZhciBzdG9yeU5vZGUgPSBfZ2V0U3RvcnlOb2RlKHN0b3J5LmdldFN0b3J5Q29udGVudHMoKSwgbm9kZUlkKTtcbiAgICAgICAgICAgICAgICB2YXIgb2xkRGVzdGluYXRpb25Ob2RlSWRzID0gYW5ndWxhci5jb3B5KHN0b3J5Tm9kZS5nZXREZXN0aW5hdGlvbk5vZGVJZHMoKSk7XG4gICAgICAgICAgICAgICAgdmFyIG5ld0Rlc3RpbmF0aW9uTm9kZUlkcyA9IGFuZ3VsYXIuY29weShvbGREZXN0aW5hdGlvbk5vZGVJZHMpO1xuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IG5ld0Rlc3RpbmF0aW9uTm9kZUlkcy5pbmRleE9mKGRlc3RpbmF0aW9uTm9kZUlkKTtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgZ2l2ZW4gZGVzdGluYXRpb24gbm9kZSBpcyBub3QgcGFydCBvZiB0aGUgbm9kZScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBuZXdEZXN0aW5hdGlvbk5vZGVJZHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICBfYXBwbHlTdG9yeU5vZGVQcm9wZXJ0eUNoYW5nZShzdG9yeSwgU1RPUllfTk9ERV9QUk9QRVJUWV9ERVNUSU5BVElPTl9OT0RFX0lEUywgbm9kZUlkLCBvbGREZXN0aW5hdGlvbk5vZGVJZHMsIG5ld0Rlc3RpbmF0aW9uTm9kZUlkcywgZnVuY3Rpb24gKGNoYW5nZURpY3QsIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFwcGx5LlxuICAgICAgICAgICAgICAgICAgICBzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCkucmVtb3ZlRGVzdGluYXRpb25Ob2RlSWRGcm9tTm9kZShub2RlSWQsIGRlc3RpbmF0aW9uTm9kZUlkKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5kby5cbiAgICAgICAgICAgICAgICAgICAgc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLmFkZERlc3RpbmF0aW9uTm9kZUlkVG9Ob2RlKG5vZGVJZCwgZGVzdGluYXRpb25Ob2RlSWQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQWRkcyBhIHByZXJlcXVpc2l0ZSBza2lsbCBpZCB0byBhIG5vZGUgb2YgYSBzdG9yeSBhbmQgcmVjb3JkcyB0aGVcbiAgICAgICAgICAgICAqIGNoYW5nZSBpbiB0aGUgdW5kby9yZWRvIHNlcnZpY2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGFkZFByZXJlcXVpc2l0ZVNraWxsSWRUb05vZGU6IGZ1bmN0aW9uIChzdG9yeSwgbm9kZUlkLCBza2lsbElkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0b3J5Tm9kZSA9IF9nZXRTdG9yeU5vZGUoc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLCBub2RlSWQpO1xuICAgICAgICAgICAgICAgIHZhciBvbGRQcmVyZXF1aXNpdGVTa2lsbElkcyA9IGFuZ3VsYXIuY29weShzdG9yeU5vZGUuZ2V0UHJlcmVxdWlzaXRlU2tpbGxJZHMoKSk7XG4gICAgICAgICAgICAgICAgdmFyIG5ld1ByZXJlcXVpc2l0ZVNraWxsSWRzID0gYW5ndWxhci5jb3B5KG9sZFByZXJlcXVpc2l0ZVNraWxsSWRzKTtcbiAgICAgICAgICAgICAgICBuZXdQcmVyZXF1aXNpdGVTa2lsbElkcy5wdXNoKHNraWxsSWQpO1xuICAgICAgICAgICAgICAgIF9hcHBseVN0b3J5Tm9kZVByb3BlcnR5Q2hhbmdlKHN0b3J5LCBTVE9SWV9OT0RFX1BST1BFUlRZX1BSRVJFUVVJU0lURV9TS0lMTF9JRFMsIG5vZGVJZCwgb2xkUHJlcmVxdWlzaXRlU2tpbGxJZHMsIG5ld1ByZXJlcXVpc2l0ZVNraWxsSWRzLCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwbHkuXG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5hZGRQcmVyZXF1aXNpdGVTa2lsbElkVG9Ob2RlKG5vZGVJZCwgc2tpbGxJZCk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZG8uXG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5yZW1vdmVQcmVyZXF1aXNpdGVTa2lsbElkRnJvbU5vZGUobm9kZUlkLCBza2lsbElkKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJlbW92ZXMgYSBwcmVyZXF1aXNpdGUgc2tpbGwgaWQgZnJvbSBhIG5vZGUgb2YgYSBzdG9yeSBhbmQgcmVjb3JkcyB0aGVcbiAgICAgICAgICAgICAqIGNoYW5nZSBpbiB0aGUgdW5kby9yZWRvIHNlcnZpY2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHJlbW92ZVByZXJlcXVpc2l0ZVNraWxsSWRGcm9tTm9kZTogZnVuY3Rpb24gKHN0b3J5LCBub2RlSWQsIHNraWxsSWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RvcnlOb2RlID0gX2dldFN0b3J5Tm9kZShzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCksIG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgdmFyIG9sZFByZXJlcXVpc2l0ZVNraWxsSWRzID0gYW5ndWxhci5jb3B5KHN0b3J5Tm9kZS5nZXRQcmVyZXF1aXNpdGVTa2lsbElkcygpKTtcbiAgICAgICAgICAgICAgICB2YXIgbmV3UHJlcmVxdWlzaXRlU2tpbGxJZHMgPSBhbmd1bGFyLmNvcHkob2xkUHJlcmVxdWlzaXRlU2tpbGxJZHMpO1xuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IG5ld1ByZXJlcXVpc2l0ZVNraWxsSWRzLmluZGV4T2Yoc2tpbGxJZCk7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignVGhlIGdpdmVuIHByZXJlcXVpc2l0ZSBza2lsbCBpcyBub3QgcGFydCBvZiB0aGUgbm9kZScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBuZXdQcmVyZXF1aXNpdGVTa2lsbElkcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIF9hcHBseVN0b3J5Tm9kZVByb3BlcnR5Q2hhbmdlKHN0b3J5LCBTVE9SWV9OT0RFX1BST1BFUlRZX1BSRVJFUVVJU0lURV9TS0lMTF9JRFMsIG5vZGVJZCwgb2xkUHJlcmVxdWlzaXRlU2tpbGxJZHMsIG5ld1ByZXJlcXVpc2l0ZVNraWxsSWRzLCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwbHkuXG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5yZW1vdmVQcmVyZXF1aXNpdGVTa2lsbElkRnJvbU5vZGUobm9kZUlkLCBza2lsbElkKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5kby5cbiAgICAgICAgICAgICAgICAgICAgc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLmFkZFByZXJlcXVpc2l0ZVNraWxsSWRUb05vZGUobm9kZUlkLCBza2lsbElkKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEFkZHMgYW4gYWNxdWlyZWQgc2tpbGwgaWQgdG8gYSBub2RlIG9mIGEgc3RvcnkgYW5kIHJlY29yZHMgdGhlIGNoYW5nZVxuICAgICAgICAgICAgICogaW4gdGhlIHVuZG8vcmVkbyBzZXJ2aWNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhZGRBY3F1aXJlZFNraWxsSWRUb05vZGU6IGZ1bmN0aW9uIChzdG9yeSwgbm9kZUlkLCBza2lsbElkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0b3J5Tm9kZSA9IF9nZXRTdG9yeU5vZGUoc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLCBub2RlSWQpO1xuICAgICAgICAgICAgICAgIHZhciBvbGRBY3F1aXJlZFNraWxsSWRzID0gYW5ndWxhci5jb3B5KHN0b3J5Tm9kZS5nZXRBY3F1aXJlZFNraWxsSWRzKCkpO1xuICAgICAgICAgICAgICAgIHZhciBuZXdBY3F1aXJlZFNraWxsSWRzID0gYW5ndWxhci5jb3B5KG9sZEFjcXVpcmVkU2tpbGxJZHMpO1xuICAgICAgICAgICAgICAgIG5ld0FjcXVpcmVkU2tpbGxJZHMucHVzaChza2lsbElkKTtcbiAgICAgICAgICAgICAgICBfYXBwbHlTdG9yeU5vZGVQcm9wZXJ0eUNoYW5nZShzdG9yeSwgU1RPUllfTk9ERV9QUk9QRVJUWV9BQ1FVSVJFRF9TS0lMTF9JRFMsIG5vZGVJZCwgb2xkQWNxdWlyZWRTa2lsbElkcywgbmV3QWNxdWlyZWRTa2lsbElkcywgZnVuY3Rpb24gKGNoYW5nZURpY3QsIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFwcGx5LlxuICAgICAgICAgICAgICAgICAgICBzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCkuYWRkQWNxdWlyZWRTa2lsbElkVG9Ob2RlKG5vZGVJZCwgc2tpbGxJZCk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZG8uXG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5yZW1vdmVBY3F1aXJlZFNraWxsSWRGcm9tTm9kZShub2RlSWQsIHNraWxsSWQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmVtb3ZlcyBhbiBhY3F1aXJlZCBza2lsbCBpZCBmcm9tIGEgbm9kZSBvZiBhIHN0b3J5IGFuZCByZWNvcmRzIHRoZVxuICAgICAgICAgICAgICogY2hhbmdlIGluIHRoZSB1bmRvL3JlZG8gc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcmVtb3ZlQWNxdWlyZWRTa2lsbElkRnJvbU5vZGU6IGZ1bmN0aW9uIChzdG9yeSwgbm9kZUlkLCBza2lsbElkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0b3J5Tm9kZSA9IF9nZXRTdG9yeU5vZGUoc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLCBub2RlSWQpO1xuICAgICAgICAgICAgICAgIHZhciBvbGRBY3F1aXJlZFNraWxsSWRzID0gYW5ndWxhci5jb3B5KHN0b3J5Tm9kZS5nZXRBY3F1aXJlZFNraWxsSWRzKCkpO1xuICAgICAgICAgICAgICAgIHZhciBuZXdBY3F1aXJlZFNraWxsSWRzID0gYW5ndWxhci5jb3B5KG9sZEFjcXVpcmVkU2tpbGxJZHMpO1xuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IG5ld0FjcXVpcmVkU2tpbGxJZHMuaW5kZXhPZihza2lsbElkKTtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdUaGUgZ2l2ZW4gYWNxdWlyZWQgc2tpbGwgaWQgaXMgbm90IHBhcnQgb2YgdGhlIG5vZGUnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbmV3QWNxdWlyZWRTa2lsbElkcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIF9hcHBseVN0b3J5Tm9kZVByb3BlcnR5Q2hhbmdlKHN0b3J5LCBTVE9SWV9OT0RFX1BST1BFUlRZX0FDUVVJUkVEX1NLSUxMX0lEUywgbm9kZUlkLCBvbGRBY3F1aXJlZFNraWxsSWRzLCBuZXdBY3F1aXJlZFNraWxsSWRzLCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwbHkuXG4gICAgICAgICAgICAgICAgICAgIHN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5yZW1vdmVBY3F1aXJlZFNraWxsSWRGcm9tTm9kZShub2RlSWQsIHNraWxsSWQpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBVbmRvLlxuICAgICAgICAgICAgICAgICAgICBzdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCkuYWRkQWNxdWlyZWRTa2lsbElkVG9Ob2RlKG5vZGVJZCwgc2tpbGxJZCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnRyb2xsZXIgZm9yIHRoZSBtYWluIHN0b3J5IGVkaXRvci5cbiAqL1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLycgK1xuICAgICdzY2hlbWEtYmFzZWQtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZGlyZWN0aXZlcy9Bbmd1bGFySHRtbEJpbmREaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL21haW4tc3RvcnktZWRpdG9yL3N0b3J5LW5vZGUtZWRpdG9yLycgK1xuICAgICdzdG9yeS1ub2RlLWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9lZGl0b3IvdW5kb19yZWRvL1VuZG9SZWRvU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3N0b3J5L1N0b3J5VXBkYXRlU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvc3RvcnktZWRpdG9yLXBhZ2Uvc3RvcnktZWRpdG9yLXNlcnZpY2VzL3N0b3J5LWVkaXRvci1zdGF0ZS8nICtcbiAgICAnc3RvcnktZWRpdG9yLXN0YXRlLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdtYWluU3RvcnlFZGl0b3JNb2R1bGUnKS5kaXJlY3RpdmUoJ3N0b3J5RWRpdG9yJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL21haW4tc3RvcnktZWRpdG9yLycgK1xuICAgICAgICAgICAgICAgICdtYWluLXN0b3J5LWVkaXRvci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckc2NvcGUnLCAnU3RvcnlFZGl0b3JTdGF0ZVNlcnZpY2UnLCAnU3RvcnlVcGRhdGVTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnVW5kb1JlZG9TZXJ2aWNlJywgJ0VWRU5UX1ZJRVdfU1RPUllfTk9ERV9FRElUT1InLCAnJHVpYk1vZGFsJyxcbiAgICAgICAgICAgICAgICAnRVZFTlRfU1RPUllfSU5JVElBTElaRUQnLCAnRVZFTlRfU1RPUllfUkVJTklUSUFMSVpFRCcsICdBbGVydHNTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCBTdG9yeUVkaXRvclN0YXRlU2VydmljZSwgU3RvcnlVcGRhdGVTZXJ2aWNlLCBVbmRvUmVkb1NlcnZpY2UsIEVWRU5UX1ZJRVdfU1RPUllfTk9ERV9FRElUT1IsICR1aWJNb2RhbCwgRVZFTlRfU1RPUllfSU5JVElBTElaRUQsIEVWRU5UX1NUT1JZX1JFSU5JVElBTElaRUQsIEFsZXJ0c1NlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIF9pbml0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN0b3J5ID0gU3RvcnlFZGl0b3JTdGF0ZVNlcnZpY2UuZ2V0U3RvcnkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zdG9yeUNvbnRlbnRzID0gJHNjb3BlLnN0b3J5LmdldFN0b3J5Q29udGVudHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuc3RvcnlDb250ZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zZXROb2RlVG9FZGl0KCRzY29wZS5zdG9yeUNvbnRlbnRzLmdldEluaXRpYWxOb2RlSWQoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBfaW5pdEVkaXRvcigpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB2YXIgX2luaXRFZGl0b3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc3RvcnkgPSBTdG9yeUVkaXRvclN0YXRlU2VydmljZS5nZXRTdG9yeSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN0b3J5Q29udGVudHMgPSAkc2NvcGUuc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRpc2Nvbm5lY3RlZE5vZGVJZHMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuc3RvcnlDb250ZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5ub2RlcyA9ICRzY29wZS5zdG9yeUNvbnRlbnRzLmdldE5vZGVzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRpc2Nvbm5lY3RlZE5vZGVJZHMgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc3RvcnlDb250ZW50cy5nZXREaXNjb25uZWN0ZWROb2RlSWRzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubm90ZXNFZGl0b3JJc1Nob3duID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc3RvcnlUaXRsZUVkaXRvcklzU2hvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5lZGl0YWJsZVRpdGxlID0gJHNjb3BlLnN0b3J5LmdldFRpdGxlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZWRpdGFibGVOb3RlcyA9ICRzY29wZS5zdG9yeS5nZXROb3RlcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmVkaXRhYmxlRGVzY3JpcHRpb24gPSAkc2NvcGUuc3RvcnkuZ2V0RGVzY3JpcHRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5lZGl0YWJsZURlc2NyaXB0aW9uSXNFbXB0eSA9ICgkc2NvcGUuZWRpdGFibGVEZXNjcmlwdGlvbiA9PT0gJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN0b3J5RGVzY3JpcHRpb25DaGFuZ2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zZXROb2RlVG9FZGl0ID0gZnVuY3Rpb24gKG5vZGVJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlkT2ZOb2RlVG9FZGl0ID0gbm9kZUlkO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUub3Blbk5vdGVzRWRpdG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm5vdGVzRWRpdG9ySXNTaG93biA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5jbG9zZU5vdGVzRWRpdG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm5vdGVzRWRpdG9ySXNTaG93biA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNJbml0aWFsTm9kZSA9IGZ1bmN0aW9uIChub2RlSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoJHNjb3BlLnN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5nZXRJbml0aWFsTm9kZUlkKCkgPT09IG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5tYXJrQXNJbml0aWFsTm9kZSA9IGZ1bmN0aW9uIChub2RlSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaXNJbml0aWFsTm9kZShub2RlSWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgU3RvcnlVcGRhdGVTZXJ2aWNlLnNldEluaXRpYWxOb2RlSWQoJHNjb3BlLnN0b3J5LCBub2RlSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgX2luaXRFZGl0b3IoKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRlbGV0ZU5vZGUgPSBmdW5jdGlvbiAobm9kZUlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmlzSW5pdGlhbE5vZGUobm9kZUlkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkSW5mb01lc3NhZ2UoJ0Nhbm5vdCBkZWxldGUgdGhlIGZpcnN0IGNoYXB0ZXIgb2YgYSBzdG9yeS4nLCAzMDAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbW9kYWxJbnN0YW5jZSA9ICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9zdG9yeS1lZGl0b3ItcGFnZS9zdG9yeS1lZGl0b3ItdGVtcGxhdGVzLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGVsZXRlLWNoYXB0ZXItbW9kYWwudGVtcGxhdGUuaHRtbCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tkcm9wOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlybURlbGV0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNhbmNlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5kaXNtaXNzKCdjYW5jZWwnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGFsSW5zdGFuY2UucmVzdWx0LnRoZW4oZnVuY3Rpb24gKHRpdGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgU3RvcnlVcGRhdGVTZXJ2aWNlLmRlbGV0ZVN0b3J5Tm9kZSgkc2NvcGUuc3RvcnksIG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNyZWF0ZU5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbm9kZVRpdGxlcyA9ICRzY29wZS5ub2Rlcy5tYXAoZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbm9kZS5nZXRUaXRsZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbW9kYWxJbnN0YW5jZSA9ICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9zdG9yeS1lZGl0b3ItcGFnZS9zdG9yeS1lZGl0b3ItdGVtcGxhdGVzLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmV3LWNoYXB0ZXItdGl0bGUtbW9kYWwudGVtcGxhdGUuaHRtbCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tkcm9wOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubm9kZVRpdGxlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubm9kZVRpdGxlcyA9IG5vZGVUaXRsZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZXJyb3JNc2cgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlc2V0RXJyb3JNc2cgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmVycm9yTXNnID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNOb2RlVGl0bGVFbXB0eSA9IGZ1bmN0aW9uIChub2RlVGl0bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKG5vZGVUaXRsZSA9PT0gJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zYXZlID0gZnVuY3Rpb24gKHRpdGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5ub2RlVGl0bGVzLmluZGV4T2YodGl0bGUpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZXJyb3JNc2cgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0EgY2hhcHRlciB3aXRoIHRoaXMgdGl0bGUgYWxyZWFkeSBleGlzdHMnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmNsb3NlKHRpdGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbW9kYWxJbnN0YW5jZS5yZXN1bHQudGhlbihmdW5jdGlvbiAodGl0bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdG9yeVVwZGF0ZVNlcnZpY2UuYWRkU3RvcnlOb2RlKCRzY29wZS5zdG9yeSwgdGl0bGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9pbml0RWRpdG9yKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGZpcnN0IG5vZGUgaXMgYWRkZWQsIG9wZW4gaXQganVzdCBhZnRlciBjcmVhdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLnN0b3J5LmdldFN0b3J5Q29udGVudHMoKS5nZXROb2RlcygpLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0Tm9kZVRvRWRpdCgkc2NvcGUuc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLmdldEluaXRpYWxOb2RlSWQoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5OT1RFU19TQ0hFTUEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnaHRtbCcsXG4gICAgICAgICAgICAgICAgICAgICAgICB1aV9jb25maWc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydHVwRm9jdXNFbmFibGVkOiBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudXBkYXRlTm90ZXMgPSBmdW5jdGlvbiAobmV3Tm90ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXdOb3RlcyA9PT0gJHNjb3BlLnN0b3J5LmdldE5vdGVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBTdG9yeVVwZGF0ZVNlcnZpY2Uuc2V0U3RvcnlOb3Rlcygkc2NvcGUuc3RvcnksIG5ld05vdGVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9pbml0RWRpdG9yKCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS51cGRhdGVTdG9yeURlc2NyaXB0aW9uU3RhdHVzID0gZnVuY3Rpb24gKGRlc2NyaXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZWRpdGFibGVEZXNjcmlwdGlvbklzRW1wdHkgPSAoZGVzY3JpcHRpb24gPT09ICcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zdG9yeURlc2NyaXB0aW9uQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS51cGRhdGVTdG9yeVRpdGxlID0gZnVuY3Rpb24gKG5ld1RpdGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV3VGl0bGUgPT09ICRzY29wZS5zdG9yeS5nZXRUaXRsZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgU3RvcnlVcGRhdGVTZXJ2aWNlLnNldFN0b3J5VGl0bGUoJHNjb3BlLnN0b3J5LCBuZXdUaXRsZSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS51cGRhdGVTdG9yeURlc2NyaXB0aW9uID0gZnVuY3Rpb24gKG5ld0Rlc2NyaXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV3RGVzY3JpcHRpb24gIT09ICRzY29wZS5zdG9yeS5nZXREZXNjcmlwdGlvbigpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgU3RvcnlVcGRhdGVTZXJ2aWNlLnNldFN0b3J5RGVzY3JpcHRpb24oJHNjb3BlLnN0b3J5LCBuZXdEZXNjcmlwdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kb24oRVZFTlRfVklFV19TVE9SWV9OT0RFX0VESVRPUiwgZnVuY3Rpb24gKGV2dCwgbm9kZUlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2V0Tm9kZVRvRWRpdChub2RlSWQpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRvbignc3RvcnlHcmFwaFVwZGF0ZWQnLCBmdW5jdGlvbiAoZXZ0LCBzdG9yeUNvbnRlbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfaW5pdEVkaXRvcigpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRvbihFVkVOVF9TVE9SWV9JTklUSUFMSVpFRCwgX2luaXQpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKEVWRU5UX1NUT1JZX1JFSU5JVElBTElaRUQsIF9pbml0RWRpdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgX2luaXQoKTtcbiAgICAgICAgICAgICAgICAgICAgX2luaXRFZGl0b3IoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnRyb2xsZXIgZm9yIHRoZSBzdG9yeSBub2RlIGVkaXRvci5cbiAqL1xucmVxdWlyZSgnZG9tYWluL2VkaXRvci91bmRvX3JlZG8vVW5kb1JlZG9TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vc3RvcnkvU3RvcnlVcGRhdGVTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9zdG9yeS1lZGl0b3ItcGFnZS9zdG9yeS1lZGl0b3Itc2VydmljZXMvc3RvcnktZWRpdG9yLXN0YXRlLycgK1xuICAgICdzdG9yeS1lZGl0b3Itc3RhdGUuc2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ3N0b3J5Tm9kZUVkaXRvck1vZHVsZScpLmRpcmVjdGl2ZSgnc3RvcnlOb2RlRWRpdG9yJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgZ2V0SWQ6ICcmbm9kZUlkJyxcbiAgICAgICAgICAgICAgICBnZXRPdXRsaW5lOiAnJm91dGxpbmUnLFxuICAgICAgICAgICAgICAgIGdldEV4cGxvcmF0aW9uSWQ6ICcmZXhwbG9yYXRpb25JZCcsXG4gICAgICAgICAgICAgICAgaXNPdXRsaW5lRmluYWxpemVkOiAnJm91dGxpbmVGaW5hbGl6ZWQnLFxuICAgICAgICAgICAgICAgIGdldERlc3RpbmF0aW9uTm9kZUlkczogJyZkZXN0aW5hdGlvbk5vZGVJZHMnLFxuICAgICAgICAgICAgICAgIGdldFByZXJlcXVpc2l0ZVNraWxsSWRzOiAnJnByZXJlcXVpc2l0ZVNraWxsSWRzJyxcbiAgICAgICAgICAgICAgICBnZXRBY3F1aXJlZFNraWxsSWRzOiAnJmFjcXVpcmVkU2tpbGxJZHMnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvc3RvcnktZWRpdG9yLXBhZ2UvbWFpbi1zdG9yeS1lZGl0b3Ivc3Rvcnktbm9kZS1lZGl0b3IvJyArXG4gICAgICAgICAgICAgICAgJ3N0b3J5LW5vZGUtZWRpdG9yLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRzY29wZScsICckcm9vdFNjb3BlJywgJyR1aWJNb2RhbCcsICdTdG9yeUVkaXRvclN0YXRlU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ1N0b3J5VXBkYXRlU2VydmljZScsICdVbmRvUmVkb1NlcnZpY2UnLCAnRVZFTlRfU1RPUllfSU5JVElBTElaRUQnLFxuICAgICAgICAgICAgICAgICdFVkVOVF9TVE9SWV9SRUlOSVRJQUxJWkVEJywgJ0VWRU5UX1ZJRVdfU1RPUllfTk9ERV9FRElUT1InLFxuICAgICAgICAgICAgICAgICdBbGVydHNTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkcm9vdFNjb3BlLCAkdWliTW9kYWwsIFN0b3J5RWRpdG9yU3RhdGVTZXJ2aWNlLCBTdG9yeVVwZGF0ZVNlcnZpY2UsIFVuZG9SZWRvU2VydmljZSwgRVZFTlRfU1RPUllfSU5JVElBTElaRUQsIEVWRU5UX1NUT1JZX1JFSU5JVElBTElaRUQsIEVWRU5UX1ZJRVdfU1RPUllfTk9ERV9FRElUT1IsIEFsZXJ0c1NlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIF9yZWNhbGN1bGF0ZUF2YWlsYWJsZU5vZGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm5ld05vZGVJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYXZhaWxhYmxlTm9kZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJHNjb3BlLnN0b3J5Tm9kZUlkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuc3RvcnlOb2RlSWRzW2ldID09PSAkc2NvcGUuZ2V0SWQoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5nZXREZXN0aW5hdGlvbk5vZGVJZHMoKS5pbmRleE9mKCRzY29wZS5zdG9yeU5vZGVJZHNbaV0pICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmF2YWlsYWJsZU5vZGVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogJHNjb3BlLnN0b3J5Tm9kZUlkc1tpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJHNjb3BlLm5vZGVJZFRvVGl0bGVNYXBbJHNjb3BlLnN0b3J5Tm9kZUlkc1tpXV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIF9pbml0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN0b3J5ID0gU3RvcnlFZGl0b3JTdGF0ZVNlcnZpY2UuZ2V0U3RvcnkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zdG9yeU5vZGVJZHMgPSAkc2NvcGUuc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLmdldE5vZGVJZHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5ub2RlSWRUb1RpdGxlTWFwID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc3RvcnkuZ2V0U3RvcnlDb250ZW50cygpLmdldE5vZGVJZHNUb1RpdGxlTWFwKCRzY29wZS5zdG9yeU5vZGVJZHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgX3JlY2FsY3VsYXRlQXZhaWxhYmxlTm9kZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jdXJyZW50VGl0bGUgPSAkc2NvcGUubm9kZUlkVG9UaXRsZU1hcFskc2NvcGUuZ2V0SWQoKV07XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZWRpdGFibGVUaXRsZSA9ICRzY29wZS5jdXJyZW50VGl0bGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUub2xkT3V0bGluZSA9ICRzY29wZS5nZXRPdXRsaW5lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZWRpdGFibGVPdXRsaW5lID0gJHNjb3BlLmdldE91dGxpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5leHBsb3JhdGlvbklkID0gJHNjb3BlLmdldEV4cGxvcmF0aW9uSWQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jdXJyZW50RXhwbG9yYXRpb25JZCA9ICRzY29wZS5leHBsb3JhdGlvbklkO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm5vZGVUaXRsZUVkaXRvcklzU2hvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5PVVRMSU5FX1NDSEVNQSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnaHRtbCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdWlfY29uZmlnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvd3M6IDEwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5nZXRTa2lsbEVkaXRvclVybCA9IGZ1bmN0aW9uIChza2lsbElkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJy9za2lsbF9lZGl0b3IvJyArIHNraWxsSWQ7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIC8vIFJlZ2V4IHBhdHRlcm4gZm9yIGV4cGxvcmF0aW9uIGlkLCBFWFBMT1JBVElPTl9BTkRfU0tJTExfSURfUEFUVEVSTlxuICAgICAgICAgICAgICAgICAgICAvLyBpcyBub3QgYmVpbmcgdXNlZCBoZXJlLCBhcyB0aGUgY2hhcHRlciBvZiB0aGUgc3RvcnkgY2FuIGJlIHNhdmVkXG4gICAgICAgICAgICAgICAgICAgIC8vIHdpdGggZW1wdHkgZXhwbG9yYXRpb24gaWQuXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5leHBsb3JhdGlvbklkUGF0dGVybiA9IC9eW2EtekEtWjAtOV8tXSokLztcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNhblNhdmVFeHBJZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5jaGVja0NhblNhdmVFeHBJZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jYW5TYXZlRXhwSWQgPSAkc2NvcGUuZXhwbG9yYXRpb25JZFBhdHRlcm4udGVzdCgkc2NvcGUuZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS51cGRhdGVUaXRsZSA9IGZ1bmN0aW9uIChuZXdUaXRsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5ld1RpdGxlID09PSAkc2NvcGUuY3VycmVudFRpdGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgU3RvcnlVcGRhdGVTZXJ2aWNlLnNldFN0b3J5Tm9kZVRpdGxlKCRzY29wZS5zdG9yeSwgJHNjb3BlLmdldElkKCksIG5ld1RpdGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jdXJyZW50VGl0bGUgPSBuZXdUaXRsZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnZpZXdOb2RlRWRpdG9yID0gZnVuY3Rpb24gKG5vZGVJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEVWRU5UX1ZJRVdfU1RPUllfTk9ERV9FRElUT1IsIG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5maW5hbGl6ZU91dGxpbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTdG9yeVVwZGF0ZVNlcnZpY2UuZmluYWxpemVTdG9yeU5vZGVPdXRsaW5lKCRzY29wZS5zdG9yeSwgJHNjb3BlLmdldElkKCkpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudXBkYXRlRXhwbG9yYXRpb25JZCA9IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTdG9yeVVwZGF0ZVNlcnZpY2Uuc2V0U3RvcnlOb2RlRXhwbG9yYXRpb25JZCgkc2NvcGUuc3RvcnksICRzY29wZS5nZXRJZCgpLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jdXJyZW50RXhwbG9yYXRpb25JZCA9IGV4cGxvcmF0aW9uSWQ7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5hZGRQcmVyZXF1aXNpdGVTa2lsbElkID0gZnVuY3Rpb24gKHNraWxsSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc2tpbGxJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgU3RvcnlVcGRhdGVTZXJ2aWNlLmFkZFByZXJlcXVpc2l0ZVNraWxsSWRUb05vZGUoJHNjb3BlLnN0b3J5LCAkc2NvcGUuZ2V0SWQoKSwgc2tpbGxJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKCdHaXZlbiBza2lsbCBpcyBhbHJlYWR5IGEgcHJlcmVxdWlzaXRlIHNraWxsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUucHJlcmVxdWlzaXRlU2tpbGxJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5yZW1vdmVQcmVyZXF1aXNpdGVTa2lsbElkID0gZnVuY3Rpb24gKHNraWxsSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFN0b3J5VXBkYXRlU2VydmljZS5yZW1vdmVQcmVyZXF1aXNpdGVTa2lsbElkRnJvbU5vZGUoJHNjb3BlLnN0b3J5LCAkc2NvcGUuZ2V0SWQoKSwgc2tpbGxJZCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5hZGRBY3F1aXJlZFNraWxsSWQgPSBmdW5jdGlvbiAoc2tpbGxJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFza2lsbElkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdG9yeVVwZGF0ZVNlcnZpY2UuYWRkQWNxdWlyZWRTa2lsbElkVG9Ob2RlKCRzY29wZS5zdG9yeSwgJHNjb3BlLmdldElkKCksIHNraWxsSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZygnR2l2ZW4gc2tpbGwgaXMgYWxyZWFkeSBhbiBhY3F1aXJlZCBza2lsbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmFjcXVpcmVkU2tpbGxJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5yZW1vdmVBY3F1aXJlZFNraWxsSWQgPSBmdW5jdGlvbiAoc2tpbGxJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgU3RvcnlVcGRhdGVTZXJ2aWNlLnJlbW92ZUFjcXVpcmVkU2tpbGxJZEZyb21Ob2RlKCRzY29wZS5zdG9yeSwgJHNjb3BlLmdldElkKCksIHNraWxsSWQpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudW5maW5hbGl6ZU91dGxpbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTdG9yeVVwZGF0ZVNlcnZpY2UudW5maW5hbGl6ZVN0b3J5Tm9kZU91dGxpbmUoJHNjb3BlLnN0b3J5LCAkc2NvcGUuZ2V0SWQoKSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5hZGROZXdEZXN0aW5hdGlvbk5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbm9kZVRpdGxlcyA9ICRzY29wZS5zdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCkuZ2V0Tm9kZXMoKS5tYXAoZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbm9kZS5nZXRUaXRsZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbW9kYWxJbnN0YW5jZSA9ICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9zdG9yeS1lZGl0b3ItcGFnZS9zdG9yeS1lZGl0b3ItdGVtcGxhdGVzLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmV3LWNoYXB0ZXItdGl0bGUtbW9kYWwudGVtcGxhdGUuaHRtbCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tkcm9wOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubm9kZVRpdGxlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubm9kZVRpdGxlcyA9IG5vZGVUaXRsZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZXJyb3JNc2cgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlc2V0RXJyb3JNc2cgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmVycm9yTXNnID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNOb2RlVGl0bGVFbXB0eSA9IGZ1bmN0aW9uIChub2RlVGl0bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKG5vZGVUaXRsZSA9PT0gJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zYXZlID0gZnVuY3Rpb24gKHRpdGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5ub2RlVGl0bGVzLmluZGV4T2YodGl0bGUpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZXJyb3JNc2cgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0EgY2hhcHRlciB3aXRoIHRoaXMgdGl0bGUgYWxyZWFkeSBleGlzdHMnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmNsb3NlKHRpdGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbW9kYWxJbnN0YW5jZS5yZXN1bHQudGhlbihmdW5jdGlvbiAodGl0bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV4dE5vZGVJZCA9ICRzY29wZS5zdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCkuZ2V0TmV4dE5vZGVJZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFN0b3J5VXBkYXRlU2VydmljZS5hZGRTdG9yeU5vZGUoJHNjb3BlLnN0b3J5LCB0aXRsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgU3RvcnlVcGRhdGVTZXJ2aWNlLmFkZERlc3RpbmF0aW9uTm9kZUlkVG9Ob2RlKCRzY29wZS5zdG9yeSwgJHNjb3BlLmdldElkKCksIG5leHROb2RlSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9pbml0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3JlY2FsY3VsYXRlQXZhaWxhYmxlTm9kZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYWRkRGVzdGluYXRpb25Ob2RlID0gZnVuY3Rpb24gKG5vZGVJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFub2RlSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm9kZUlkID09PSAkc2NvcGUuZ2V0SWQoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkSW5mb01lc3NhZ2UoJ0EgY2hhcHRlciBjYW5ub3QgbGVhZCB0byBpdHNlbGYuJywgMzAwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdG9yeVVwZGF0ZVNlcnZpY2UuYWRkRGVzdGluYXRpb25Ob2RlSWRUb05vZGUoJHNjb3BlLnN0b3J5LCAkc2NvcGUuZ2V0SWQoKSwgbm9kZUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkSW5mb01lc3NhZ2UoJ1RoZSBnaXZlbiBjaGFwdGVyIGlzIGFscmVhZHkgYSBkZXN0aW5hdGlvbiBmb3IgY3VycmVudCAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2NoYXB0ZXInLCAzMDAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3N0b3J5R3JhcGhVcGRhdGVkJywgJHNjb3BlLnN0b3J5LmdldFN0b3J5Q29udGVudHMoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBfcmVjYWxjdWxhdGVBdmFpbGFibGVOb2RlcygpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUucmVtb3ZlRGVzdGluYXRpb25Ob2RlSWQgPSBmdW5jdGlvbiAobm9kZUlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTdG9yeVVwZGF0ZVNlcnZpY2UucmVtb3ZlRGVzdGluYXRpb25Ob2RlSWRGcm9tTm9kZSgkc2NvcGUuc3RvcnksICRzY29wZS5nZXRJZCgpLCBub2RlSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzdG9yeUdyYXBoVXBkYXRlZCcsICRzY29wZS5zdG9yeS5nZXRTdG9yeUNvbnRlbnRzKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgX3JlY2FsY3VsYXRlQXZhaWxhYmxlTm9kZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm9wZW5Ob2RlVGl0bGVFZGl0b3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubm9kZVRpdGxlRWRpdG9ySXNTaG93biA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5jbG9zZU5vZGVUaXRsZUVkaXRvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5ub2RlVGl0bGVFZGl0b3JJc1Nob3duID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pc091dGxpbmVNb2RpZmllZCA9IGZ1bmN0aW9uIChvdXRsaW5lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKCRzY29wZS5vbGRPdXRsaW5lICE9PSBvdXRsaW5lKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZU91dGxpbmUgPSBmdW5jdGlvbiAobmV3T3V0bGluZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkc2NvcGUuaXNPdXRsaW5lTW9kaWZpZWQobmV3T3V0bGluZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBTdG9yeVVwZGF0ZVNlcnZpY2Uuc2V0U3RvcnlOb2RlT3V0bGluZSgkc2NvcGUuc3RvcnksICRzY29wZS5nZXRJZCgpLCBuZXdPdXRsaW5lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5vbGRPdXRsaW5lID0gbmV3T3V0bGluZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRvbihFVkVOVF9TVE9SWV9JTklUSUFMSVpFRCwgX2luaXQpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKEVWRU5UX1NUT1JZX1JFSU5JVElBTElaRUQsIF9pbml0KTtcbiAgICAgICAgICAgICAgICAgICAgX2luaXQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnRyb2xsZXIgZm9yIHRoZSBuYXZiYXIgYnJlYWRjcnVtYiBvZiB0aGUgc3RvcnkgZWRpdG9yLlxuICovXG5yZXF1aXJlKCdkb21haW4vZWRpdG9yL3VuZG9fcmVkby9VbmRvUmVkb1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL3N0b3J5LWVkaXRvci1zZXJ2aWNlcy9zdG9yeS1lZGl0b3Itc3RhdGUvJyArXG4gICAgJ3N0b3J5LWVkaXRvci1zdGF0ZS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9zdG9yeS1lZGl0b3ItcGFnZS9tYWluLXN0b3J5LWVkaXRvci8nICtcbiAgICAnbWFpbi1zdG9yeS1lZGl0b3IuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdzdG9yeUVkaXRvck5hdmJhckJyZWFkY3J1bWJNb2R1bGUnKS5kaXJlY3RpdmUoJ3N0b3J5RWRpdG9yTmF2YmFyQnJlYWRjcnVtYicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9zdG9yeS1lZGl0b3ItcGFnZS9zdG9yeS1lZGl0b3ItbmF2YmFyLWJyZWFkY3J1bWIvJyArXG4gICAgICAgICAgICAgICAgJ3N0b3J5LWVkaXRvci1uYXZiYXItYnJlYWRjcnVtYi5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJHVpYk1vZGFsJywgJyR3aW5kb3cnLCAnVXJsU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgJ1VuZG9SZWRvU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ1N0b3J5RWRpdG9yU3RhdGVTZXJ2aWNlJywgJ0VWRU5UX1NUT1JZX0lOSVRJQUxJWkVEJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkdWliTW9kYWwsICR3aW5kb3csIFVybFNlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlLCBVbmRvUmVkb1NlcnZpY2UsIFN0b3J5RWRpdG9yU3RhdGVTZXJ2aWNlLCBFVkVOVF9TVE9SWV9JTklUSUFMSVpFRCkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc3RvcnkgPSBTdG9yeUVkaXRvclN0YXRlU2VydmljZS5nZXRTdG9yeSgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgVE9QSUNfRURJVE9SX1VSTF9URU1QTEFURSA9ICcvdG9waWNfZWRpdG9yLzx0b3BpY0lkPic7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0b3BpY0lkID0gVXJsU2VydmljZS5nZXRUb3BpY0lkRnJvbVVybCgpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKEVWRU5UX1NUT1JZX0lOSVRJQUxJWkVELCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUudG9waWNOYW1lID0gU3RvcnlFZGl0b3JTdGF0ZVNlcnZpY2UuZ2V0VG9waWNOYW1lKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUucmV0dXJuVG9Ub3BpY0VkaXRvclBhZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoVW5kb1JlZG9TZXJ2aWNlLmdldENoYW5nZUNvdW50KCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1vZGFsSW5zdGFuY2UgPSAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL3N0b3J5LWVkaXRvci10ZW1wbGF0ZXMvJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnc2F2ZS1wZW5kaW5nLWNoYW5nZXMtbW9kYWwudGVtcGxhdGUuaHRtbCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkdWliTW9kYWxJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR3aW5kb3cub3BlbihVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChUT1BJQ19FRElUT1JfVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcGljSWQ6IHRvcGljSWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSwgJ19zZWxmJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBuYXZiYXIgb2YgdGhlIHN0b3J5IGVkaXRvci5cbiAqL1xucmVxdWlyZSgnZG9tYWluL2VkaXRvci91bmRvX3JlZG8vQmFzZVVuZG9SZWRvU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL2VkaXRvci91bmRvX3JlZG8vVW5kb1JlZG9TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9zdG9yeS1lZGl0b3ItcGFnZS9zdG9yeS1lZGl0b3Itc2VydmljZXMvc3RvcnktZWRpdG9yLXN0YXRlLycgK1xuICAgICdzdG9yeS1lZGl0b3Itc3RhdGUuc2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvY29udGV4dHVhbC9VcmxTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnc3RvcnlFZGl0b3JOYXZiYXJNb2R1bGUnKS5kaXJlY3RpdmUoJ3N0b3J5RWRpdG9yTmF2YmFyJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL3N0b3J5LWVkaXRvci1uYXZiYXIvJyArXG4gICAgICAgICAgICAgICAgJ3N0b3J5LWVkaXRvci1uYXZiYXIuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyRyb290U2NvcGUnLCAnJHVpYk1vZGFsJywgJ0FsZXJ0c1NlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdVbmRvUmVkb1NlcnZpY2UnLCAnU3RvcnlFZGl0b3JTdGF0ZVNlcnZpY2UnLCAnVXJsU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ0VWRU5UX1NUT1JZX0lOSVRJQUxJWkVEJywgJ0VWRU5UX1NUT1JZX1JFSU5JVElBTElaRUQnLFxuICAgICAgICAgICAgICAgICdFVkVOVF9VTkRPX1JFRE9fU0VSVklDRV9DSEFOR0VfQVBQTElFRCcsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJHJvb3RTY29wZSwgJHVpYk1vZGFsLCBBbGVydHNTZXJ2aWNlLCBVbmRvUmVkb1NlcnZpY2UsIFN0b3J5RWRpdG9yU3RhdGVTZXJ2aWNlLCBVcmxTZXJ2aWNlLCBFVkVOVF9TVE9SWV9JTklUSUFMSVpFRCwgRVZFTlRfU1RPUllfUkVJTklUSUFMSVpFRCwgRVZFTlRfVU5ET19SRURPX1NFUlZJQ0VfQ0hBTkdFX0FQUExJRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRvcGljSWQgPSBVcmxTZXJ2aWNlLmdldFRvcGljSWRGcm9tVXJsKCk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zdG9yeSA9IFN0b3J5RWRpdG9yU3RhdGVTZXJ2aWNlLmdldFN0b3J5KCk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1NhdmVJblByb2dyZXNzID0gU3RvcnlFZGl0b3JTdGF0ZVNlcnZpY2UuaXNTYXZpbmdTdG9yeTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnZhbGlkYXRpb25Jc3N1ZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmdldENoYW5nZUxpc3RMZW5ndGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gVW5kb1JlZG9TZXJ2aWNlLmdldENoYW5nZUNvdW50KCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5nZXRXYXJuaW5nc0NvdW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRzY29wZS52YWxpZGF0aW9uSXNzdWVzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzU3RvcnlTYXZlYWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoJHNjb3BlLmdldENoYW5nZUxpc3RMZW5ndGgoKSA+IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZ2V0V2FybmluZ3NDb3VudCgpID09PSAwKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRpc2NhcmRDaGFuZ2VzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgVW5kb1JlZG9TZXJ2aWNlLmNsZWFyQ2hhbmdlcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgU3RvcnlFZGl0b3JTdGF0ZVNlcnZpY2UubG9hZFN0b3J5KHRvcGljSWQsICRzY29wZS5zdG9yeS5nZXRJZCgpKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIF92YWxpZGF0ZVN0b3J5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnZhbGlkYXRpb25Jc3N1ZXMgPSAkc2NvcGUuc3RvcnkudmFsaWRhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNhdmVDaGFuZ2VzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1vZGFsSW5zdGFuY2UgPSAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvc3RvcnktZWRpdG9yLXBhZ2Uvc3RvcnktZWRpdG9yLXRlbXBsYXRlcy8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3N0b3J5LWVkaXRvci1zYXZlLW1vZGFsLnRlbXBsYXRlLmh0bWwnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJHVpYk1vZGFsSW5zdGFuY2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkdWliTW9kYWxJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNhdmUgPSBmdW5jdGlvbiAoY29tbWl0TWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmNsb3NlKGNvbW1pdE1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RhbEluc3RhbmNlLnJlc3VsdC50aGVuKGZ1bmN0aW9uIChjb21taXRNZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgU3RvcnlFZGl0b3JTdGF0ZVNlcnZpY2Uuc2F2ZVN0b3J5KHRvcGljSWQsIGNvbW1pdE1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kb24oRVZFTlRfU1RPUllfSU5JVElBTElaRUQsIF92YWxpZGF0ZVN0b3J5KTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRvbihFVkVOVF9TVE9SWV9SRUlOSVRJQUxJWkVELCBfdmFsaWRhdGVTdG9yeSk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kb24oRVZFTlRfVU5ET19SRURPX1NFUlZJQ0VfQ0hBTkdFX0FQUExJRUQsIF92YWxpZGF0ZVN0b3J5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFByaW1hcnkgY29udHJvbGxlciBmb3IgdGhlIHN0b3J5IGVkaXRvciBwYWdlLlxuICovXG4vLyBUT0RPKHZvanRlY2hqZWxpbmVrKTogdGhpcyBibG9jayBvZiByZXF1aXJlcyBzaG91bGQgYmUgcmVtb3ZlZCBhZnRlciB3ZVxuLy8gaW50cm9kdWNlIHdlYnBhY2sgZm9yIC9leHRlbnNpb25zXG5yZXF1aXJlKCdjb21wb25lbnRzL2NrLWVkaXRvci1oZWxwZXJzL2NrLWVkaXRvci1ydGUvY2stZWRpdG9yLXJ0ZS5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvY2stZWRpdG9yLWhlbHBlcnMvY2stZWRpdG9yLXdpZGdldHMvJyArXG4gICAgJ2NrLWVkaXRvci13aWRnZXRzLmluaXRpYWxpemVyLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXVuaWNvZGUtZmlsdGVycy8nICtcbiAgICAnY29udmVydC11bmljb2RlLXdpdGgtcGFyYW1zLXRvLWh0bWwuZmlsdGVyLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXVuaWNvZGUtZmlsdGVycy9jb252ZXJ0LWh0bWwtdG8tdW5pY29kZS5maWx0ZXIudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtdW5pY29kZS1maWx0ZXJzL2NvbnZlcnQtdW5pY29kZS10by1odG1sLmZpbHRlci50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy12YWxpZGF0b3JzL2lzLWF0LWxlYXN0LmZpbHRlci50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy12YWxpZGF0b3JzL2lzLWF0LW1vc3QuZmlsdGVyLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXZhbGlkYXRvcnMvaXMtZmxvYXQuZmlsdGVyLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXZhbGlkYXRvcnMvaXMtaW50ZWdlci5maWx0ZXIudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtdmFsaWRhdG9ycy9pcy1ub25lbXB0eS5maWx0ZXIudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtZGlyZWN0aXZlcy9hcHBseS12YWxpZGF0aW9uLycgK1xuICAgICdhcHBseS12YWxpZGF0aW9uLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1kaXJlY3RpdmVzL3JlcXVpcmUtaXMtZmxvYXQvJyArXG4gICAgJ3JlcXVpcmUtaXMtZmxvYXQuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkaXJlY3RpdmVzL0FuZ3VsYXJIdG1sQmluZERpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZGlyZWN0aXZlcy9NYXRoamF4QmluZERpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLycgK1xuICAgICdzY2hlbWEtYmFzZWQtY3VzdG9tLWVkaXRvci9zY2hlbWEtYmFzZWQtY3VzdG9tLWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci8nICtcbiAgICAnc2NoZW1hLWJhc2VkLWRpY3QtZWRpdG9yL3NjaGVtYS1iYXNlZC1kaWN0LWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci8nICtcbiAgICAnc2NoZW1hLWJhc2VkLWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWV4cHJlc3Npb24tZWRpdG9yLycgK1xuICAgICdzY2hlbWEtYmFzZWQtZXhwcmVzc2lvbi1lZGl0b3IuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3IvJyArXG4gICAgJ3NjaGVtYS1iYXNlZC1mbG9hdC1lZGl0b3Ivc2NoZW1hLWJhc2VkLWZsb2F0LWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci8nICtcbiAgICAnc2NoZW1hLWJhc2VkLWh0bWwtZWRpdG9yL3NjaGVtYS1iYXNlZC1odG1sLWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci8nICtcbiAgICAnc2NoZW1hLWJhc2VkLWludC1lZGl0b3Ivc2NoZW1hLWJhc2VkLWludC1lZGl0b3IuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3IvJyArXG4gICAgJ3NjaGVtYS1iYXNlZC1saXN0LWVkaXRvci9zY2hlbWEtYmFzZWQtbGlzdC1lZGl0b3IuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3IvJyArXG4gICAgJ3NjaGVtYS1iYXNlZC11bmljb2RlLWVkaXRvci9zY2hlbWEtYmFzZWQtdW5pY29kZS1lZGl0b3IuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL3NjaGVtYV92aWV3ZXJzL1NjaGVtYUJhc2VkQ3VzdG9tVmlld2VyRGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL3NjaGVtYV92aWV3ZXJzL1NjaGVtYUJhc2VkRGljdFZpZXdlckRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9zY2hlbWFfdmlld2Vycy9TY2hlbWFCYXNlZEh0bWxWaWV3ZXJEaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hX3ZpZXdlcnMvU2NoZW1hQmFzZWRMaXN0Vmlld2VyRGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL3NjaGVtYV92aWV3ZXJzL1NjaGVtYUJhc2VkUHJpbWl0aXZlVmlld2VyRGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL3NjaGVtYV92aWV3ZXJzL1NjaGVtYUJhc2VkVW5pY29kZVZpZXdlckRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9zY2hlbWFfdmlld2Vycy9TY2hlbWFCYXNlZFZpZXdlckRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvSHRtbEVzY2FwZXJTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9JZEdlbmVyYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9SdGVIZWxwZXJTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9TY2hlbWFEZWZhdWx0VmFsdWVTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9TY2hlbWFVbmRlZmluZWRMYXN0RWxlbWVudFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL05lc3RlZERpcmVjdGl2ZXNSZWN1cnNpb25UaW1lb3V0UHJldmVudGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0dlbmVyYXRlQ29udGVudElkU2VydmljZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvbG9hZGluZy1kb3RzLycgK1xuICAgICdsb2FkaW5nLWRvdHMuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vZWRpdG9yL3VuZG9fcmVkby9DaGFuZ2VPYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdkb21haW4vZWRpdG9yL3VuZG9fcmVkby9VbmRvUmVkb1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9lZGl0b3IvdW5kb19yZWRvL1F1ZXN0aW9uVW5kb1JlZG9TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vZWRpdG9yL3VuZG9fcmVkby9CYXNlVW5kb1JlZG9TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vc3RvcnkvRWRpdGFibGVTdG9yeUJhY2tlbmRBcGlTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vc3RvcnkvU3RvcnlPYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdkb21haW4vc3RvcnkvU3RvcnlDb250ZW50c09iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9zdG9yeS9TdG9yeU5vZGVPYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdkb21haW4vc3RvcnkvU3RvcnlVcGRhdGVTZXJ2aWNlLnRzJyk7XG4vLyBeXl4gdGhpcyBibG9jayBvZiByZXF1aXJlcyBzaG91bGQgYmUgcmVtb3ZlZCBeXl5cbnJlcXVpcmUoJ3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL3N0b3J5LWVkaXRvci1uYXZiYXItYnJlYWRjcnVtYi8nICtcbiAgICAnc3RvcnktZWRpdG9yLW5hdmJhci1icmVhZGNydW1iLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvc3RvcnktZWRpdG9yLXBhZ2Uvc3RvcnktZWRpdG9yLW5hdmJhci8nICtcbiAgICAnc3RvcnktZWRpdG9yLW5hdmJhci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL21haW4tc3RvcnktZWRpdG9yLycgK1xuICAgICdtYWluLXN0b3J5LWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9lZGl0b3IvdW5kb19yZWRvL1VuZG9SZWRvU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvc3RvcnktZWRpdG9yLXBhZ2Uvc3RvcnktZWRpdG9yLXNlcnZpY2VzL3N0b3J5LWVkaXRvci1zdGF0ZS8nICtcbiAgICAnc3RvcnktZWRpdG9yLXN0YXRlLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvVXJsU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ3N0b3J5RWRpdG9yTW9kdWxlJykuY29udHJvbGxlcignU3RvcnlFZGl0b3InLCBbXG4gICAgJyRzY29wZScsICckdWliTW9kYWwnLCAnJHdpbmRvdycsICdTdG9yeUVkaXRvclN0YXRlU2VydmljZScsXG4gICAgJ1VuZG9SZWRvU2VydmljZScsXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgJ1VybFNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbCwgJHdpbmRvdywgU3RvcnlFZGl0b3JTdGF0ZVNlcnZpY2UsIFVuZG9SZWRvU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIFVybFNlcnZpY2UpIHtcbiAgICAgICAgdmFyIFRPUElDX0VESVRPUl9VUkxfVEVNUExBVEUgPSAnL3RvcGljX2VkaXRvci88dG9waWNJZD4nO1xuICAgICAgICB2YXIgdG9waWNJZCA9IFVybFNlcnZpY2UuZ2V0VG9waWNJZEZyb21VcmwoKTtcbiAgICAgICAgU3RvcnlFZGl0b3JTdGF0ZVNlcnZpY2UubG9hZFN0b3J5KHRvcGljSWQsIFVybFNlcnZpY2UuZ2V0U3RvcnlJZEZyb21VcmwoKSk7XG4gICAgICAgICRzY29wZS5yZXR1cm5Ub1RvcGljRWRpdG9yUGFnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChVbmRvUmVkb1NlcnZpY2UuZ2V0Q2hhbmdlQ291bnQoKSA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgbW9kYWxJbnN0YW5jZSA9ICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvc3RvcnktZWRpdG9yLXBhZ2Uvc3RvcnktZWRpdG9yLXRlbXBsYXRlcy8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdzYXZlLXBlbmRpbmctY2hhbmdlcy1tb2RhbC50ZW1wbGF0ZS5odG1sJyksXG4gICAgICAgICAgICAgICAgICAgIGJhY2tkcm9wOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyR1aWJNb2RhbEluc3RhbmNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNhbmNlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgJHdpbmRvdy5vcGVuKFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKFRPUElDX0VESVRPUl9VUkxfVEVNUExBVEUsIHtcbiAgICAgICAgICAgICAgICAgICAgdG9waWNJZDogdG9waWNJZFxuICAgICAgICAgICAgICAgIH0pLCAnX3NlbGYnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0byBtYWludGFpbiB0aGUgc3RhdGUgb2YgYSBzaW5nbGUgc3Rvcnkgc2hhcmVkXG4gKiB0aHJvdWdob3V0IHRoZSBzdG9yeSBlZGl0b3IuIFRoaXMgc2VydmljZSBwcm92aWRlcyBmdW5jdGlvbmFsaXR5IGZvclxuICogcmV0cmlldmluZyB0aGUgc3RvcnksIHNhdmluZyBpdCwgYW5kIGxpc3RlbmluZyBmb3IgY2hhbmdlcy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL2VkaXRvci91bmRvX3JlZG8vVW5kb1JlZG9TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vc3RvcnkvRWRpdGFibGVTdG9yeUJhY2tlbmRBcGlTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vc3RvcnkvU3RvcnlPYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnc3RvcnlFZGl0b3JNb2R1bGUnKS5mYWN0b3J5KCdTdG9yeUVkaXRvclN0YXRlU2VydmljZScsIFtcbiAgICAnJHJvb3RTY29wZScsICdBbGVydHNTZXJ2aWNlJywgJ0VkaXRhYmxlU3RvcnlCYWNrZW5kQXBpU2VydmljZScsXG4gICAgJ1N0b3J5T2JqZWN0RmFjdG9yeScsICdVbmRvUmVkb1NlcnZpY2UnLFxuICAgICdFVkVOVF9TVE9SWV9JTklUSUFMSVpFRCcsICdFVkVOVF9TVE9SWV9SRUlOSVRJQUxJWkVEJyxcbiAgICBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQWxlcnRzU2VydmljZSwgRWRpdGFibGVTdG9yeUJhY2tlbmRBcGlTZXJ2aWNlLCBTdG9yeU9iamVjdEZhY3RvcnksIFVuZG9SZWRvU2VydmljZSwgRVZFTlRfU1RPUllfSU5JVElBTElaRUQsIEVWRU5UX1NUT1JZX1JFSU5JVElBTElaRUQpIHtcbiAgICAgICAgdmFyIF9zdG9yeSA9IFN0b3J5T2JqZWN0RmFjdG9yeS5jcmVhdGVJbnRlcnN0aXRpYWxTdG9yeSgpO1xuICAgICAgICB2YXIgX3N0b3J5SXNJbml0aWFsaXplZCA9IGZhbHNlO1xuICAgICAgICB2YXIgX3N0b3J5SXNMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIHZhciBfc3RvcnlJc0JlaW5nU2F2ZWQgPSBmYWxzZTtcbiAgICAgICAgdmFyIF90b3BpY05hbWUgPSBudWxsO1xuICAgICAgICB2YXIgX3NldFN0b3J5ID0gZnVuY3Rpb24gKHN0b3J5KSB7XG4gICAgICAgICAgICBfc3RvcnkuY29weUZyb21TdG9yeShzdG9yeSk7XG4gICAgICAgICAgICBpZiAoX3N0b3J5SXNJbml0aWFsaXplZCkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChFVkVOVF9TVE9SWV9SRUlOSVRJQUxJWkVEKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChFVkVOVF9TVE9SWV9JTklUSUFMSVpFRCk7XG4gICAgICAgICAgICAgICAgX3N0b3J5SXNJbml0aWFsaXplZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfc2V0VG9waWNOYW1lID0gZnVuY3Rpb24gKHRvcGljTmFtZSkge1xuICAgICAgICAgICAgX3RvcGljTmFtZSA9IHRvcGljTmFtZTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF91cGRhdGVTdG9yeSA9IGZ1bmN0aW9uIChuZXdCYWNrZW5kU3RvcnlPYmplY3QpIHtcbiAgICAgICAgICAgIF9zZXRTdG9yeShTdG9yeU9iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUJhY2tlbmREaWN0KG5ld0JhY2tlbmRTdG9yeU9iamVjdCkpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBMb2Fkcywgb3IgcmVsb2FkcywgdGhlIHN0b3J5IHN0b3JlZCBieSB0aGlzIHNlcnZpY2UgZ2l2ZW4gYVxuICAgICAgICAgICAgICogc3BlY2lmaWVkIHN0b3J5IElELiBTZWUgc2V0U3RvcnkoKSBmb3IgbW9yZSBpbmZvcm1hdGlvbiBvblxuICAgICAgICAgICAgICogYWRkaXRpb25hbCBiZWhhdmlvciBvZiB0aGlzIGZ1bmN0aW9uLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBsb2FkU3Rvcnk6IGZ1bmN0aW9uICh0b3BpY0lkLCBzdG9yeUlkKSB7XG4gICAgICAgICAgICAgICAgX3N0b3J5SXNMb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBFZGl0YWJsZVN0b3J5QmFja2VuZEFwaVNlcnZpY2UuZmV0Y2hTdG9yeSh0b3BpY0lkLCBzdG9yeUlkKS50aGVuKGZ1bmN0aW9uIChuZXdCYWNrZW5kU3RvcnlPYmplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgX3NldFRvcGljTmFtZShuZXdCYWNrZW5kU3RvcnlPYmplY3QudG9waWNOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgX3VwZGF0ZVN0b3J5KG5ld0JhY2tlbmRTdG9yeU9iamVjdC5zdG9yeSk7XG4gICAgICAgICAgICAgICAgICAgIF9zdG9yeUlzTG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoZXJyb3IgfHwgJ1RoZXJlIHdhcyBhbiBlcnJvciB3aGVuIGxvYWRpbmcgdGhlIHN0b3J5LicpO1xuICAgICAgICAgICAgICAgICAgICBfc3RvcnlJc0xvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHVybnMgd2hldGhlciB0aGlzIHNlcnZpY2UgaXMgY3VycmVudGx5IGF0dGVtcHRpbmcgdG8gbG9hZCB0aGVcbiAgICAgICAgICAgICAqIHN0b3J5IG1haW50YWluZWQgYnkgdGhpcyBzZXJ2aWNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpc0xvYWRpbmdTdG9yeTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfc3RvcnlJc0xvYWRpbmc7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXR1cm5zIHdoZXRoZXIgYSBzdG9yeSBoYXMgeWV0IGJlZW4gbG9hZGVkIHVzaW5nIGVpdGhlclxuICAgICAgICAgICAgICogbG9hZFN0b3J5KCkgb3Igc2V0U3RvcnkoKS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaGFzTG9hZGVkU3Rvcnk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3N0b3J5SXNJbml0aWFsaXplZDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgc3RvcnkgdG8gYmUgc2hhcmVkIGFtb25nIHRoZSBzdG9yeVxuICAgICAgICAgICAgICogZWRpdG9yLiBQbGVhc2Ugbm90ZSBhbnkgY2hhbmdlcyB0byB0aGlzIHN0b3J5IHdpbGwgYmUgcHJvcG9nYXRlZFxuICAgICAgICAgICAgICogdG8gYWxsIGJpbmRpbmdzIHRvIGl0LiBUaGlzIHN0b3J5IG9iamVjdCB3aWxsIGJlIHJldGFpbmVkIGZvciB0aGVcbiAgICAgICAgICAgICAqIGxpZmV0aW1lIG9mIHRoZSBlZGl0b3IuIFRoaXMgZnVuY3Rpb24gbmV2ZXIgcmV0dXJucyBudWxsLCB0aG91Z2ggaXQgbWF5XG4gICAgICAgICAgICAgKiByZXR1cm4gYW4gZW1wdHkgc3Rvcnkgb2JqZWN0IGlmIHRoZSBzdG9yeSBoYXMgbm90IHlldCBiZWVuXG4gICAgICAgICAgICAgKiBsb2FkZWQgZm9yIHRoaXMgZWRpdG9yIGluc3RhbmNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRTdG9yeTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfc3Rvcnk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTZXRzIHRoZSBzdG9yeSBzdG9yZWQgd2l0aGluIHRoaXMgc2VydmljZSwgcHJvcG9nYXRpbmcgY2hhbmdlcyB0b1xuICAgICAgICAgICAgICogYWxsIGJpbmRpbmdzIHRvIHRoZSBzdG9yeSByZXR1cm5lZCBieSBnZXRTdG9yeSgpLiBUaGUgZmlyc3RcbiAgICAgICAgICAgICAqIHRpbWUgdGhpcyBpcyBjYWxsZWQgaXQgd2lsbCBmaXJlIGEgZ2xvYmFsIGV2ZW50IGJhc2VkIG9uIHRoZVxuICAgICAgICAgICAgICogRVZFTlRfU1RPUllfSU5JVElBTElaRUQgY29uc3RhbnQuIEFsbCBzdWJzZXF1ZW50XG4gICAgICAgICAgICAgKiBjYWxscyB3aWxsIHNpbWlsYXJseSBmaXJlIGEgRVZFTlRfU1RPUllfUkVJTklUSUFMSVpFRCBldmVudC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2V0U3Rvcnk6IGZ1bmN0aW9uIChzdG9yeSkge1xuICAgICAgICAgICAgICAgIF9zZXRTdG9yeShzdG9yeSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0VG9waWNOYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90b3BpY05hbWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBBdHRlbXB0cyB0byBzYXZlIHRoZSBjdXJyZW50IHN0b3J5IGdpdmVuIGEgY29tbWl0IG1lc3NhZ2UuIFRoaXNcbiAgICAgICAgICAgICAqIGZ1bmN0aW9uIGNhbm5vdCBiZSBjYWxsZWQgdW50aWwgYWZ0ZXIgYSBzdG9yeSBoYXMgYmVlbiBpbml0aWFsaXplZFxuICAgICAgICAgICAgICogaW4gdGhpcyBzZXJ2aWNlLiBSZXR1cm5zIGZhbHNlIGlmIGEgc2F2ZSBpcyBub3QgcGVyZm9ybWVkIGR1ZSB0byBub1xuICAgICAgICAgICAgICogY2hhbmdlcyBwZW5kaW5nLCBvciB0cnVlIGlmIG90aGVyd2lzZS4gVGhpcyBmdW5jdGlvbiwgdXBvbiBzdWNjZXNzLFxuICAgICAgICAgICAgICogd2lsbCBjbGVhciB0aGUgVW5kb1JlZG9TZXJ2aWNlIG9mIHBlbmRpbmcgY2hhbmdlcy4gVGhpcyBmdW5jdGlvbiBhbHNvXG4gICAgICAgICAgICAgKiBzaGFyZXMgYmVoYXZpb3Igd2l0aCBzZXRTdG9yeSgpLCB3aGVuIGl0IHN1Y2NlZWRzLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzYXZlU3Rvcnk6IGZ1bmN0aW9uICh0b3BpY0lkLCBjb21taXRNZXNzYWdlLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoIV9zdG9yeUlzSW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5mYXRhbFdhcm5pbmcoJ0Nhbm5vdCBzYXZlIGEgc3RvcnkgYmVmb3JlIG9uZSBpcyBsb2FkZWQuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIERvbid0IGF0dGVtcHQgdG8gc2F2ZSB0aGUgc3RvcnkgaWYgdGhlcmUgYXJlIG5vIGNoYW5nZXMgcGVuZGluZy5cbiAgICAgICAgICAgICAgICBpZiAoIVVuZG9SZWRvU2VydmljZS5oYXNDaGFuZ2VzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfc3RvcnlJc0JlaW5nU2F2ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIEVkaXRhYmxlU3RvcnlCYWNrZW5kQXBpU2VydmljZS51cGRhdGVTdG9yeSh0b3BpY0lkLCBfc3RvcnkuZ2V0SWQoKSwgX3N0b3J5LmdldFZlcnNpb24oKSwgY29tbWl0TWVzc2FnZSwgVW5kb1JlZG9TZXJ2aWNlLmdldENvbW1pdHRhYmxlQ2hhbmdlTGlzdCgpKS50aGVuKGZ1bmN0aW9uIChzdG9yeUJhY2tlbmRPYmplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgX3VwZGF0ZVN0b3J5KHN0b3J5QmFja2VuZE9iamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIFVuZG9SZWRvU2VydmljZS5jbGVhckNoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgX3N0b3J5SXNCZWluZ1NhdmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZyhlcnJvciB8fCAnVGhlcmUgd2FzIGFuIGVycm9yIHdoZW4gc2F2aW5nIHRoZSBzdG9yeS4nKTtcbiAgICAgICAgICAgICAgICAgICAgX3N0b3J5SXNCZWluZ1NhdmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhpcyBzZXJ2aWNlIGlzIGN1cnJlbnRseSBhdHRlbXB0aW5nIHRvIHNhdmUgdGhlXG4gICAgICAgICAgICAgKiBzdG9yeSBtYWludGFpbmVkIGJ5IHRoaXMgc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaXNTYXZpbmdTdG9yeTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfc3RvcnlJc0JlaW5nU2F2ZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEEgc2VydmljZSBmb3IgZ2VuZXJhdGluZyByYW5kb20gYW5kIHVuaXF1ZSBjb250ZW50X2lkIGZvclxuICogU3VidGl0bGVkSHRtbCBkb21haW4gb2JqZWN0cy5cbiAqL1xub3BwaWEuZmFjdG9yeSgnR2VuZXJhdGVDb250ZW50SWRTZXJ2aWNlJywgW1xuICAgICdDT01QT05FTlRfTkFNRV9GRUVEQkFDSycsICdDT01QT05FTlRfTkFNRV9ISU5UJyxcbiAgICAnQ09NUE9ORU5UX05BTUVfV09SS0VEX0VYQU1QTEUnLCBmdW5jdGlvbiAoQ09NUE9ORU5UX05BTUVfRkVFREJBQ0ssIENPTVBPTkVOVF9OQU1FX0hJTlQsIENPTVBPTkVOVF9OQU1FX1dPUktFRF9FWEFNUExFKSB7XG4gICAgICAgIHZhciBnZW5lcmF0ZUlkRm9yQ29tcG9uZW50ID0gZnVuY3Rpb24gKGV4aXN0aW5nQ29tcG9uZW50SWRzLCBjb21wb25lbnROYW1lKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudElkTGlzdCA9IGFuZ3VsYXIuY29weShleGlzdGluZ0NvbXBvbmVudElkcyk7XG4gICAgICAgICAgICB2YXIgc2VhcmNoS2V5ID0gY29tcG9uZW50TmFtZSArICdfJztcbiAgICAgICAgICAgIHZhciBjb3VudCA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBjb250ZW50SWQgaW4gY29udGVudElkTGlzdCkge1xuICAgICAgICAgICAgICAgIGlmIChjb250ZW50SWRMaXN0W2NvbnRlbnRJZF0uaW5kZXhPZihzZWFyY2hLZXkpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzcGxpdENvbnRlbnRJZCA9IGNvbnRlbnRJZExpc3RbY29udGVudElkXS5zcGxpdCgnXycpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdGVtcENvdW50ID0gcGFyc2VJbnQoc3BsaXRDb250ZW50SWRbc3BsaXRDb250ZW50SWQubGVuZ3RoIC0gMV0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGVtcENvdW50ID4gY291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ID0gdGVtcENvdW50O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIChzZWFyY2hLZXkgKyBTdHJpbmcoY291bnQgKyAxKSk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfZ2V0TmV4dElkID0gZnVuY3Rpb24gKGV4aXN0aW5nQ29tcG9uZW50SWRzLCBjb21wb25lbnROYW1lKSB7XG4gICAgICAgICAgICBpZiAoY29tcG9uZW50TmFtZSA9PT0gQ09NUE9ORU5UX05BTUVfRkVFREJBQ0sgfHxcbiAgICAgICAgICAgICAgICBjb21wb25lbnROYW1lID09PSBDT01QT05FTlRfTkFNRV9ISU5UIHx8XG4gICAgICAgICAgICAgICAgY29tcG9uZW50TmFtZSA9PT0gQ09NUE9ORU5UX05BTUVfV09SS0VEX0VYQU1QTEUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2VuZXJhdGVJZEZvckNvbXBvbmVudChleGlzdGluZ0NvbXBvbmVudElkcywgY29tcG9uZW50TmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignVW5rbm93biBjb21wb25lbnQgbmFtZSBwcm92aWRlZC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGdldE5leHRJZDogZnVuY3Rpb24gKGV4aXN0aW5nQ29tcG9uZW50SWRzLCBjb21wb25lbnROYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9nZXROZXh0SWQoZXhpc3RpbmdDb21wb25lbnRJZHMsIGNvbXBvbmVudE5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBBIGhlbHBlciBzZXJ2aWNlIGZvciB0aGUgUmljaCB0ZXh0IGVkaXRvcihSVEUpLlxuICovXG5vcHBpYS5jb25zdGFudCgnUlRFX0NPTVBPTkVOVF9TUEVDUycsIHJpY2hUZXh0Q29tcG9uZW50cyk7XG5vcHBpYS5mYWN0b3J5KCdSdGVIZWxwZXJTZXJ2aWNlJywgW1xuICAgICckZG9jdW1lbnQnLCAnJGZpbHRlcicsICckaW50ZXJwb2xhdGUnLCAnJGxvZycsICckdWliTW9kYWwnLFxuICAgICdDb250ZXh0U2VydmljZScsICdGb2N1c01hbmFnZXJTZXJ2aWNlJywgJ0h0bWxFc2NhcGVyU2VydmljZScsXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgJ1JURV9DT01QT05FTlRfU1BFQ1MnLFxuICAgIGZ1bmN0aW9uICgkZG9jdW1lbnQsICRmaWx0ZXIsICRpbnRlcnBvbGF0ZSwgJGxvZywgJHVpYk1vZGFsLCBDb250ZXh0U2VydmljZSwgRm9jdXNNYW5hZ2VyU2VydmljZSwgSHRtbEVzY2FwZXJTZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgUlRFX0NPTVBPTkVOVF9TUEVDUykge1xuICAgICAgICB2YXIgX1JJQ0hfVEVYVF9DT01QT05FTlRTID0gW107XG4gICAgICAgIE9iamVjdC5rZXlzKFJURV9DT01QT05FTlRfU1BFQ1MpLnNvcnQoKS5mb3JFYWNoKGZ1bmN0aW9uIChjb21wb25lbnRJZCkge1xuICAgICAgICAgICAgX1JJQ0hfVEVYVF9DT01QT05FTlRTLnB1c2goe1xuICAgICAgICAgICAgICAgIGJhY2tlbmRJZDogUlRFX0NPTVBPTkVOVF9TUEVDU1tjb21wb25lbnRJZF0uYmFja2VuZF9pZCxcbiAgICAgICAgICAgICAgICBjdXN0b21pemF0aW9uQXJnU3BlY3M6IGFuZ3VsYXIuY29weShSVEVfQ09NUE9ORU5UX1NQRUNTW2NvbXBvbmVudElkXS5jdXN0b21pemF0aW9uX2FyZ19zcGVjcyksXG4gICAgICAgICAgICAgICAgaWQ6IFJURV9DT01QT05FTlRfU1BFQ1NbY29tcG9uZW50SWRdLmZyb250ZW5kX2lkLFxuICAgICAgICAgICAgICAgIGljb25EYXRhVXJsOiBSVEVfQ09NUE9ORU5UX1NQRUNTW2NvbXBvbmVudElkXS5pY29uX2RhdGFfdXJsLFxuICAgICAgICAgICAgICAgIGlzQ29tcGxleDogUlRFX0NPTVBPTkVOVF9TUEVDU1tjb21wb25lbnRJZF0uaXNfY29tcGxleCxcbiAgICAgICAgICAgICAgICBpc0Jsb2NrRWxlbWVudDogUlRFX0NPTVBPTkVOVF9TUEVDU1tjb21wb25lbnRJZF0uaXNfYmxvY2tfZWxlbWVudCxcbiAgICAgICAgICAgICAgICByZXF1aXJlc0ZzOiBSVEVfQ09NUE9ORU5UX1NQRUNTW2NvbXBvbmVudElkXS5yZXF1aXJlc19mcyxcbiAgICAgICAgICAgICAgICB0b29sdGlwOiBSVEVfQ09NUE9ORU5UX1NQRUNTW2NvbXBvbmVudElkXS50b29sdGlwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBfY3JlYXRlQ3VzdG9taXphdGlvbkFyZ0RpY3RGcm9tQXR0cnMgPSBmdW5jdGlvbiAoYXR0cnMpIHtcbiAgICAgICAgICAgIHZhciBjdXN0b21pemF0aW9uQXJnc0RpY3QgPSB7fTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgYXR0ciA9IGF0dHJzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChhdHRyLm5hbWUgPT09ICdjbGFzcycgfHwgYXR0ci5uYW1lID09PSAnc3JjJyB8fFxuICAgICAgICAgICAgICAgICAgICBhdHRyLm5hbWUgPT09ICdfbW96X3Jlc2l6aW5nJykge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHNlcGFyYXRvckxvY2F0aW9uID0gYXR0ci5uYW1lLmluZGV4T2YoJy13aXRoLXZhbHVlJyk7XG4gICAgICAgICAgICAgICAgaWYgKHNlcGFyYXRvckxvY2F0aW9uID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAkbG9nLmVycm9yKCdSVEUgRXJyb3I6IGludmFsaWQgY3VzdG9taXphdGlvbiBhdHRyaWJ1dGUgJyArIGF0dHIubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgYXJnTmFtZSA9IGF0dHIubmFtZS5zdWJzdHJpbmcoMCwgc2VwYXJhdG9yTG9jYXRpb24pO1xuICAgICAgICAgICAgICAgIGN1c3RvbWl6YXRpb25BcmdzRGljdFthcmdOYW1lXSA9IEh0bWxFc2NhcGVyU2VydmljZS5lc2NhcGVkSnNvblRvT2JqKGF0dHIudmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGN1c3RvbWl6YXRpb25BcmdzRGljdDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNyZWF0ZUN1c3RvbWl6YXRpb25BcmdEaWN0RnJvbUF0dHJzOiBmdW5jdGlvbiAoYXR0cnMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2NyZWF0ZUN1c3RvbWl6YXRpb25BcmdEaWN0RnJvbUF0dHJzKGF0dHJzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRSaWNoVGV4dENvbXBvbmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYW5ndWxhci5jb3B5KF9SSUNIX1RFWFRfQ09NUE9ORU5UUyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNJbmxpbmVDb21wb25lbnQ6IGZ1bmN0aW9uIChyaWNoVGV4dENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIHZhciBpbmxpbmVDb21wb25lbnRzID0gWydsaW5rJywgJ21hdGgnXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5saW5lQ29tcG9uZW50cy5pbmRleE9mKHJpY2hUZXh0Q29tcG9uZW50KSAhPT0gLTE7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gVGhlIHJlZm9jdXNGbiBhcmcgaXMgYSBmdW5jdGlvbiB0aGF0IHJlc3RvcmVzIGZvY3VzIHRvIHRoZSB0ZXh0IGVkaXRvclxuICAgICAgICAgICAgLy8gYWZ0ZXIgZXhpdGluZyB0aGUgbW9kYWwsIGFuZCBtb3ZlcyB0aGUgY3Vyc29yIGJhY2sgdG8gd2hlcmUgaXQgd2FzXG4gICAgICAgICAgICAvLyBiZWZvcmUgdGhlIG1vZGFsIHdhcyBvcGVuZWQuXG4gICAgICAgICAgICBfb3BlbkN1c3RvbWl6YXRpb25Nb2RhbDogZnVuY3Rpb24gKGN1c3RvbWl6YXRpb25BcmdTcGVjcywgYXR0cnNDdXN0b21pemF0aW9uQXJnc0RpY3QsIG9uU3VibWl0Q2FsbGJhY2ssIG9uRGlzbWlzc0NhbGxiYWNrLCByZWZvY3VzRm4pIHtcbiAgICAgICAgICAgICAgICAkZG9jdW1lbnRbMF0uZXhlY0NvbW1hbmQoJ2VuYWJsZU9iamVjdFJlc2l6aW5nJywgZmFsc2UsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB2YXIgbW9kYWxEaWFsb2cgPSAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtdGVtcGxhdGVzLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2N1c3RvbWl6ZS1ydGUtY29tcG9uZW50LW1vZGFsLnRlbXBsYXRlLmh0bWwnKSxcbiAgICAgICAgICAgICAgICAgICAgYmFja2Ryb3A6ICdzdGF0aWMnLFxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlOiB7fSxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsICckdGltZW91dCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkdWliTW9kYWxJbnN0YW5jZSwgJHRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY3VzdG9taXphdGlvbkFyZ1NwZWNzID0gY3VzdG9taXphdGlvbkFyZ1NwZWNzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdpdGhvdXQgdGhpcyBjb2RlLCB0aGUgZm9jdXMgd2lsbCByZW1haW4gaW4gdGhlIGJhY2tncm91bmQgUlRFXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXZlbiBhZnRlciB0aGUgbW9kYWwgbG9hZHMuIFRoaXMgc3dpdGNoZXMgdGhlIGZvY3VzIHRvIGFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0ZW1wb3JhcnkgZmllbGQgaW4gdGhlIG1vZGFsIHdoaWNoIGlzIHRoZW4gcmVtb3ZlZCBmcm9tIHRoZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIERPTS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPKHNsbCk6IE1ha2UgdGhpcyBzd2l0Y2ggdG8gdGhlIGZpcnN0IGlucHV0IGZpZWxkIGluIHRoZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG1vZGFsIGluc3RlYWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm1vZGFsSXNMb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBGb2N1c01hbmFnZXJTZXJ2aWNlLnNldEZvY3VzKCd0bXBGb2N1c1BvaW50Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubW9kYWxJc0xvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUudG1wQ3VzdG9taXphdGlvbkFyZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGN1c3RvbWl6YXRpb25BcmdTcGVjcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2FOYW1lID0gY3VzdG9taXphdGlvbkFyZ1NwZWNzW2ldLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS50bXBDdXN0b21pemF0aW9uQXJncy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGNhTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiAoYXR0cnNDdXN0b21pemF0aW9uQXJnc0RpY3QuaGFzT3duUHJvcGVydHkoY2FOYW1lKSA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5jb3B5KGF0dHJzQ3VzdG9taXphdGlvbkFyZ3NEaWN0W2NhTmFtZV0pIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21pemF0aW9uQXJnU3BlY3NbaV0uZGVmYXVsdF92YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNhdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdleHRlcm5hbFNhdmUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1c3RvbWl6YXRpb25BcmdzRGljdCA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRzY29wZS50bXBDdXN0b21pemF0aW9uQXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNhTmFtZSA9ICRzY29wZS50bXBDdXN0b21pemF0aW9uQXJnc1tpXS5uYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9taXphdGlvbkFyZ3NEaWN0W2NhTmFtZV0gPSAoJHNjb3BlLnRtcEN1c3RvbWl6YXRpb25BcmdzW2ldLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5jbG9zZShjdXN0b21pemF0aW9uQXJnc0RpY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBtb2RhbERpYWxvZy5yZXN1bHQudGhlbihvblN1Ym1pdENhbGxiYWNrLCBvbkRpc21pc3NDYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgLy8gJ2ZpbmFsbHknIGlzIGEgSlMga2V5d29yZC4gSWYgaXQgaXMganVzdCB1c2VkIGluIGl0cyBcIi5maW5hbGx5XCIgZm9ybSxcbiAgICAgICAgICAgICAgICAvLyB0aGUgbWluaWZpY2F0aW9uIHByb2Nlc3MgdGhyb3dzIGFuIGVycm9yLlxuICAgICAgICAgICAgICAgIG1vZGFsRGlhbG9nLnJlc3VsdFsnZmluYWxseSddKHJlZm9jdXNGbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iXSwic291cmNlUm9vdCI6IiJ9