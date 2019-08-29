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
/******/
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
/******/ 		"preferences": 0
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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/preferences-page/preferences-page.scripts.ts","vendors~about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboar~7856c05a","about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboard~donate~e06a4a17","community_dashboard~library~preferences"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./core/templates/dev/head/base_components/BaseContentDirective.ts":
/*!*************************************************************************!*\
  !*** ./core/templates/dev/head/base_components/BaseContentDirective.ts ***!
  \*************************************************************************/
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
 * @fileoverview Directive for the Base Transclusion Component.
 */
__webpack_require__(/*! base_components/WarningLoaderDirective.ts */ "./core/templates/dev/head/base_components/WarningLoaderDirective.ts");
__webpack_require__(/*! pages/OppiaFooterDirective.ts */ "./core/templates/dev/head/pages/OppiaFooterDirective.ts");
__webpack_require__(/*! domain/sidebar/SidebarStatusService.ts */ "./core/templates/dev/head/domain/sidebar/SidebarStatusService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
__webpack_require__(/*! services/stateful/BackgroundMaskService.ts */ "./core/templates/dev/head/services/stateful/BackgroundMaskService.ts");
angular.module('oppia').directive('baseContent', [
    'UrlInterpolationService',
    function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            transclude: {
                breadcrumb: '?navbarBreadcrumb',
                content: 'content',
                footer: '?pageFooter',
                navOptions: '?navOptions',
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/base_components/base_content_directive.html'),
            controllerAs: '$ctrl',
            controller: ['$rootScope', 'BackgroundMaskService',
                'SidebarStatusService', 'UrlService', 'SITE_FEEDBACK_FORM_URL',
                function ($rootScope, BackgroundMaskService, SidebarStatusService, UrlService, SITE_FEEDBACK_FORM_URL) {
                    var ctrl = this;
                    ctrl.iframed = UrlService.isIframed();
                    ctrl.siteFeedbackFormUrl = SITE_FEEDBACK_FORM_URL;
                    ctrl.isSidebarShown = SidebarStatusService.isSidebarShown;
                    ctrl.closeSidebarOnSwipe = SidebarStatusService.closeSidebar;
                    ctrl.isBackgroundMaskActive = BackgroundMaskService.isMaskActive;
                    ctrl.DEV_MODE = $rootScope.DEV_MODE;
                    ctrl.skipToMainContent = function () {
                        var mainContentElement = document.getElementById('oppia-main-content');
                        if (!mainContentElement) {
                            throw Error('Variable mainContentElement is undefined.');
                        }
                        mainContentElement.tabIndex = -1;
                        mainContentElement.scrollIntoView();
                        mainContentElement.focus();
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/base_components/WarningLoaderDirective.ts":
/*!***************************************************************************!*\
  !*** ./core/templates/dev/head/base_components/WarningLoaderDirective.ts ***!
  \***************************************************************************/
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
 * @fileoverview Directive for warning_loader.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('oppia').directive('warningLoader', [
    'UrlInterpolationService',
    function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/base_components/warning_loader_directive.html'),
            controllerAs: '$ctrl',
            controller: ['AlertsService',
                function (AlertsService) {
                    var ctrl = this;
                    ctrl.AlertsService = AlertsService;
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/common-layout-directives/common-elements/background-banner.directive.ts":
/*!********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/common-elements/background-banner.directive.ts ***!
  \********************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the background banner.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('backgroundBanner', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/common-layout-directives/common-elements/' +
                'background-banner.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                function () {
                    var ctrl = this;
                    var possibleBannerFilenames = [
                        'bannerA.svg', 'bannerB.svg', 'bannerC.svg', 'bannerD.svg'
                    ];
                    var bannerImageFilename = possibleBannerFilenames[Math.floor(Math.random() * possibleBannerFilenames.length)];
                    ctrl.bannerImageFileUrl = UrlInterpolationService.getStaticImageUrl('/background/' + bannerImageFilename);
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/custom-forms-directives/image-uploader.directive.ts":
/*!******************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/custom-forms-directives/image-uploader.directive.ts ***!
  \******************************************************************************************************/
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
 * @fileoverview Directive for uploading images.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/IdGenerationService.ts */ "./core/templates/dev/head/services/IdGenerationService.ts");
angular.module('oppia').directive('imageUploader', [
    'IdGenerationService', 'UrlInterpolationService',
    function (IdGenerationService, UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {
                height: '@',
                onFileChanged: '=',
                errorMessage: '@',
                width: '@'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/custom-forms-directives/' +
                'image-uploader.directive.html'),
            link: function (scope, elt) {
                var onDragEnd = function (e) {
                    e.preventDefault();
                    $('.image-uploader-drop-area').removeClass('image-uploader-is-active');
                };
                var validateUploadedFile = function (file, filename) {
                    if (!file || !file.size || !file.type.match('image.*')) {
                        return 'This file is not recognized as an image.';
                    }
                    if (!file.type.match('image.jpeg') &&
                        !file.type.match('image.gif') &&
                        !file.type.match('image.jpg') &&
                        !file.type.match('image.png')) {
                        return 'This image format is not supported.';
                    }
                    if ((file.type.match(/jp(e?)g$/) && !file.name.match(/\.jp(e?)g$/)) ||
                        (file.type.match(/gif$/) && !file.name.match(/\.gif$/)) ||
                        (file.type.match(/png$/) && !file.name.match(/\.png$/))) {
                        return 'This image format does not match the filename extension.';
                    }
                    var ONE_MB_IN_BYTES = 1048576;
                    if (file.size > ONE_MB_IN_BYTES) {
                        var currentSize = (file.size / ONE_MB_IN_BYTES).toFixed(1) + ' MB';
                        return 'The maximum allowed file size is 1 MB' +
                            ' (' + currentSize + ' given).';
                    }
                    return null;
                };
                $(elt).bind('drop', function (e) {
                    onDragEnd(e);
                    var file = e.originalEvent.dataTransfer.files[0];
                    scope.errorMessage = validateUploadedFile(file, file.name);
                    if (!scope.errorMessage) {
                        // Only fire this event if validations pass.
                        scope.onFileChanged(file, file.name);
                    }
                    scope.$apply();
                });
                $(elt).bind('dragover', function (e) {
                    e.preventDefault();
                    $('.image-uploader-drop-area').addClass('image-uploader-is-active');
                });
                $(elt).bind('dragleave', onDragEnd);
                // If the user accidentally drops an image outside of the image-uploader
                // we want to prevent the browser from applying normal drag-and-drop
                // logic, which is to load the image in the browser tab.
                $(window).bind('dragover', function (e) {
                    e.preventDefault();
                });
                $(window).bind('drop', function (e) {
                    e.preventDefault();
                });
                // We generate a random class name to distinguish this input from
                // others in the DOM.
                scope.fileInputClassName = ('image-uploader-file-input' + IdGenerationService.generateNewId());
                angular.element(document).on('change', '.' + scope.fileInputClassName, function (evt) {
                    var file = evt.currentTarget.files[0];
                    var filename = evt.target.value.split(/(\\|\/)/g).pop();
                    scope.errorMessage = validateUploadedFile(file, filename);
                    if (!scope.errorMessage) {
                        // Only fire this event if validations pass.
                        scope.onFileChanged(file, filename);
                    }
                    scope.$apply();
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/custom-forms-directives/select2-dropdown.directive.ts":
/*!********************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/custom-forms-directives/select2-dropdown.directive.ts ***!
  \********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Directive for the select2 autocomplete component.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('select2Dropdown', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        // Directive for incorporating select2 dropdowns.
        return {
            restrict: 'E',
            scope: {
                // Whether to allow multiple choices. In order to do so, the value of
                // this attribute must be the exact string 'true'.
                allowMultipleChoices: '@',
                choices: '=',
                // An additional CSS class to add to the select2 dropdown. May be
                // undefined.
                dropdownCssClass: '@',
                // A function that formats a new selection. May be undefined.
                formatNewSelection: '=',
                // The message shown when an invalid search term is entered. May be
                // undefined, in which case this defaults to 'No matches found'.
                invalidSearchTermMessage: '@',
                item: '=',
                // The regex used to validate newly-entered choices that do not
                // already exist. If it is undefined then all new choices are rejected.
                newChoiceRegex: '@',
                onSelectionChange: '&',
                placeholder: '@',
                width: '@'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/custom-forms-directives/' +
                'select2-dropdown.directive.html'),
            controller: ['$scope', '$element', function ($scope, $element) {
                    $scope.newChoiceValidator = new RegExp($scope.newChoiceRegex);
                    var select2Options = {
                        allowClear: false,
                        data: $scope.choices,
                        multiple: $scope.allowMultipleChoices === 'true',
                        tags: $scope.newChoiceRegex !== undefined,
                        placeholder: $scope.placeholder,
                        width: $scope.width || '250px',
                        dropdownCssClass: null,
                        createTag: function (params) {
                            return params.term.match($scope.newChoiceValidator) ? {
                                id: params.term,
                                text: params.term
                            } : null;
                        },
                        templateResult: function (queryResult) {
                            var doesChoiceMatchText = function (choice) {
                                return choice.id === queryResult.text;
                            };
                            if ($scope.choices && $scope.choices.some(doesChoiceMatchText)) {
                                return queryResult.text;
                            }
                            else {
                                if ($scope.formatNewSelection) {
                                    return $scope.formatNewSelection(queryResult.text);
                                }
                                else {
                                    return queryResult.text;
                                }
                            }
                        },
                        language: {
                            noResults: function () {
                                if ($scope.invalidSearchTermMessage) {
                                    return $scope.invalidSearchTermMessage;
                                }
                                else {
                                    return 'No matches found';
                                }
                            }
                        }
                    };
                    if ($scope.dropdownCssClass) {
                        select2Options.dropdownCssClass = $scope.dropdownCssClass;
                    }
                    var select2Node = $element[0].firstChild;
                    // Initialize the dropdown.
                    $(select2Node).select2(select2Options);
                    $(select2Node).val($scope.item).trigger('change');
                    // Update $scope.item when the selection changes.
                    $(select2Node).on('change', function () {
                        $scope.item = $(select2Node).val();
                        $scope.$apply();
                        $scope.onSelectionChange();
                    });
                    // Respond to external changes in $scope.item
                    $scope.$watch('item', function (newValue) {
                        $(select2Node).val(newValue);
                    });
                }]
        };
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

/***/ "./core/templates/dev/head/filters/string-utility-filters/convert-to-plain-text.filter.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/filters/string-utility-filters/convert-to-plain-text.filter.ts ***!
  \************************************************************************************************/
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
 * @fileoverview ConvertToPlainText filter for Oppia.
 */
angular.module('oppia').filter('convertToPlainText', [function () {
        return function (input) {
            var strippedText = input.replace(/(<([^>]+)>)/ig, '');
            strippedText = strippedText.replace(/&nbsp;/ig, ' ');
            strippedText = strippedText.replace(/&quot;/ig, '');
            var trimmedText = strippedText.trim();
            if (trimmedText.length === 0) {
                return strippedText;
            }
            else {
                return trimmedText;
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/filters/string-utility-filters/truncate.filter.ts":
/*!***********************************************************************************!*\
  !*** ./core/templates/dev/head/filters/string-utility-filters/truncate.filter.ts ***!
  \***********************************************************************************/
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
 * @fileoverview Truncate filter for Oppia.
 */
__webpack_require__(/*! filters/string-utility-filters/convert-to-plain-text.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/convert-to-plain-text.filter.ts");
// Filter that truncates long descriptors.
angular.module('oppia').filter('truncate', ['$filter', function ($filter) {
        return function (input, length, suffix) {
            if (!input) {
                return '';
            }
            if (isNaN(length)) {
                length = 70;
            }
            if (suffix === undefined) {
                suffix = '...';
            }
            if (!angular.isString(input)) {
                input = String(input);
            }
            input = $filter('convertToPlainText')(input);
            return (input.length <= length ? input : (input.substring(0, length - suffix.length) + suffix));
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/pages/OppiaFooterDirective.ts":
/*!***************************************************************!*\
  !*** ./core/templates/dev/head/pages/OppiaFooterDirective.ts ***!
  \***************************************************************/
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
 * @fileoverview Directive for the footer.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('oppiaFooter', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/oppia_footer_directive.html'),
            controllerAs: '$ctrl',
            controller: [
                function () { }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/preferences-page/preferences-page.controller.ts":
/*!***************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/preferences-page/preferences-page.controller.ts ***!
  \***************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Data and controllers for the Oppia 'edit preferences' page.
 */
__webpack_require__(/*! base_components/BaseContentDirective.ts */ "./core/templates/dev/head/base_components/BaseContentDirective.ts");
__webpack_require__(/*! components/forms/custom-forms-directives/select2-dropdown.directive.ts */ "./core/templates/dev/head/components/forms/custom-forms-directives/select2-dropdown.directive.ts");
__webpack_require__(/*! components/forms/custom-forms-directives/image-uploader.directive.ts */ "./core/templates/dev/head/components/forms/custom-forms-directives/image-uploader.directive.ts");
__webpack_require__(/*! components/common-layout-directives/common-elements/background-banner.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/common-elements/background-banner.directive.ts");
__webpack_require__(/*! filters/string-utility-filters/truncate.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/truncate.filter.ts");
__webpack_require__(/*! domain/utilities/LanguageUtilService.ts */ "./core/templates/dev/head/domain/utilities/LanguageUtilService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
__webpack_require__(/*! services/UtilsService.ts */ "./core/templates/dev/head/services/UtilsService.ts");
angular.module('oppia').directive('preferencesPage', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                subjectInterests: '=',
                preferredLanguageCodes: '=',
                preferredSiteLanguageCode: '=',
                preferredAudioLanguageCode: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/preferences-page/preferences-page.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$http', '$q', '$rootScope', '$scope', '$timeout', '$translate',
                '$window', '$uibModal', 'AlertsService', 'LanguageUtilService',
                'UrlInterpolationService', 'UserService', 'UtilsService',
                'DASHBOARD_TYPE_CREATOR', 'DASHBOARD_TYPE_LEARNER',
                'SUPPORTED_AUDIO_LANGUAGES', 'SUPPORTED_SITE_LANGUAGES',
                function ($http, $q, $rootScope, $scope, $timeout, $translate, $window, $uibModal, AlertsService, LanguageUtilService, UrlInterpolationService, UserService, UtilsService, DASHBOARD_TYPE_CREATOR, DASHBOARD_TYPE_LEARNER, SUPPORTED_AUDIO_LANGUAGES, SUPPORTED_SITE_LANGUAGES) {
                    var ctrl = this;
                    var _PREFERENCES_DATA_URL = '/preferenceshandler/data';
                    ctrl.profilePictureDataUrl = '';
                    ctrl.DASHBOARD_TYPE_CREATOR = DASHBOARD_TYPE_CREATOR;
                    ctrl.DASHBOARD_TYPE_LEARNER = DASHBOARD_TYPE_LEARNER;
                    ctrl.username = '';
                    $rootScope.loadingMessage = 'Loading';
                    var userInfoPromise = UserService.getUserInfoAsync();
                    userInfoPromise.then(function (userInfo) {
                        ctrl.username = userInfo.getUsername();
                        ctrl.email = userInfo.getEmail();
                    });
                    ctrl.hasPageLoaded = false;
                    var preferencesPromise = $http.get(_PREFERENCES_DATA_URL);
                    preferencesPromise.then(function (response) {
                        var data = response.data;
                        ctrl.userBio = data.user_bio;
                        ctrl.subjectInterests = data.subject_interests;
                        ctrl.preferredLanguageCodes = data.preferred_language_codes;
                        ctrl.profilePictureDataUrl = data.profile_picture_data_url;
                        ctrl.defaultDashboard = data.default_dashboard;
                        ctrl.canReceiveEmailUpdates = data.can_receive_email_updates;
                        ctrl.canReceiveEditorRoleEmail = data.can_receive_editor_role_email;
                        ctrl.canReceiveSubscriptionEmail =
                            data.can_receive_subscription_email;
                        ctrl.canReceiveFeedbackMessageEmail = (data.can_receive_feedback_message_email);
                        ctrl.preferredSiteLanguageCode = data.preferred_site_language_code;
                        ctrl.preferredAudioLanguageCode =
                            data.preferred_audio_language_code;
                        ctrl.subscriptionList = data.subscription_list;
                        ctrl.hasPageLoaded = true;
                        _forceSelect2Refresh();
                    });
                    $q.all([userInfoPromise, preferencesPromise]).then(function () {
                        $rootScope.loadingMessage = '';
                    });
                    ctrl.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;
                    var _saveDataItem = function (updateType, data) {
                        $http.put(_PREFERENCES_DATA_URL, {
                            update_type: updateType,
                            data: data
                        });
                    };
                    // Select2 dropdown cannot automatically refresh its display
                    // after being translated.
                    // Use ctrl.select2DropdownIsShown in its ng-if attribute
                    // and this function to force it to reload
                    var _forceSelect2Refresh = function () {
                        ctrl.select2DropdownIsShown = false;
                        $timeout(function () {
                            ctrl.select2DropdownIsShown = true;
                        }, 100);
                    };
                    ctrl.saveUserBio = function (userBio) {
                        _saveDataItem('user_bio', userBio);
                    };
                    ctrl.subjectInterestsChangedAtLeastOnce = false;
                    ctrl.subjectInterestsWarningText = null;
                    ctrl.TAG_REGEX_STRING = '^[a-z ]+$';
                    ctrl.updateSubjectInterestsWarning = function (subjectInterests) {
                        var TAG_REGEX = new RegExp(ctrl.TAG_REGEX_STRING);
                        if (subjectInterests instanceof Array) {
                            for (var i = 0; i < subjectInterests.length; i++) {
                                if (UtilsService.isString(subjectInterests[i])) {
                                    if (!TAG_REGEX.test(subjectInterests[i])) {
                                        ctrl.subjectInterestsWarningText = ('Subject interests should use only lowercase letters.');
                                    }
                                }
                                else {
                                    console.error('Error: received bad value for a subject interest.' +
                                        ' Expected a string, got ', subjectInterests[i]);
                                    throw Error('Error: received bad value for a subject interest.');
                                }
                            }
                        }
                        else {
                            console.error('Error: received bad value for subject interests. Expected' +
                                ' list of strings, got ', subjectInterests);
                            throw Error('Error: received bad value for subject interests.');
                        }
                    };
                    ctrl.onSubjectInterestsSelectionChange = function (subjectInterests) {
                        AlertsService.clearWarnings();
                        ctrl.subjectInterestsChangedAtLeastOnce = true;
                        ctrl.subjectInterestsWarningText = null;
                        ctrl.updateSubjectInterestsWarning(subjectInterests);
                        if (ctrl.subjectInterestsWarningText === null) {
                            _saveDataItem('subject_interests', subjectInterests);
                        }
                    };
                    ctrl.savePreferredSiteLanguageCodes = function (preferredSiteLanguageCode) {
                        $translate.use(preferredSiteLanguageCode);
                        _forceSelect2Refresh();
                        _saveDataItem('preferred_site_language_code', preferredSiteLanguageCode);
                    };
                    ctrl.savePreferredAudioLanguageCode = function (preferredAudioLanguageCode) {
                        _saveDataItem('preferred_audio_language_code', preferredAudioLanguageCode);
                    };
                    ctrl.showUsernamePopover = function (creatorUsername) {
                        // The popover on the subscription card is only shown if the length
                        // of the creator username is greater than 10 and the user hovers
                        // over the truncated username.
                        if (creatorUsername.length > 10) {
                            return 'mouseenter';
                        }
                        else {
                            return 'none';
                        }
                    };
                    ctrl.saveEmailPreferences = function (canReceiveEmailUpdates, canReceiveEditorRoleEmail, canReceiveFeedbackMessageEmail, canReceiveSubscriptionEmail) {
                        var data = {
                            can_receive_email_updates: canReceiveEmailUpdates,
                            can_receive_editor_role_email: canReceiveEditorRoleEmail,
                            can_receive_feedback_message_email: (canReceiveFeedbackMessageEmail),
                            can_receive_subscription_email: canReceiveSubscriptionEmail
                        };
                        _saveDataItem('email_preferences', data);
                    };
                    ctrl.savePreferredLanguageCodes = function (preferredLanguageCodes) {
                        _saveDataItem('preferred_language_codes', preferredLanguageCodes);
                    };
                    ctrl.saveDefaultDashboard = function (defaultDashboard) {
                        _saveDataItem('default_dashboard', defaultDashboard);
                    };
                    ctrl.showEditProfilePictureModal = function () {
                        $uibModal.open({
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/preferences-page/modal-templates/' +
                                'edit-profile-picture-modal.directive.html'),
                            backdrop: true,
                            controller: [
                                '$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                                    $scope.uploadedImage = null;
                                    $scope.croppedImageDataUrl = '';
                                    $scope.invalidImageWarningIsShown = false;
                                    $scope.onFileChanged = function (file) {
                                        $('.oppia-profile-image-uploader').fadeOut(function () {
                                            $scope.invalidImageWarningIsShown = false;
                                            var reader = new FileReader();
                                            reader.onload = function (e) {
                                                $scope.$apply(function () {
                                                    $scope.uploadedImage = e.target.result;
                                                });
                                            };
                                            reader.readAsDataURL(file);
                                            $timeout(function () {
                                                $('.oppia-profile-image-uploader').fadeIn();
                                            }, 100);
                                        });
                                    };
                                    $scope.reset = function () {
                                        $scope.uploadedImage = null;
                                        $scope.croppedImageDataUrl = '';
                                    };
                                    $scope.onInvalidImageLoaded = function () {
                                        $scope.uploadedImage = null;
                                        $scope.croppedImageDataUrl = '';
                                        $scope.invalidImageWarningIsShown = true;
                                    };
                                    $scope.confirm = function () {
                                        $uibModalInstance.close($scope.croppedImageDataUrl);
                                    };
                                    $scope.cancel = function () {
                                        $uibModalInstance.dismiss('cancel');
                                    };
                                }
                            ]
                        }).result.then(function (newProfilePictureDataUrl) {
                            UserService.setProfileImageDataUrlAsync(newProfilePictureDataUrl)
                                .then(function () {
                                // The reload is needed in order to update the profile picture
                                // in the top-right corner.
                                $window.location.reload();
                            });
                        });
                    };
                    ctrl.LANGUAGE_CHOICES = LanguageUtilService.getLanguageIdsAndTexts();
                    ctrl.SITE_LANGUAGE_CHOICES = SUPPORTED_SITE_LANGUAGES;
                    ctrl.AUDIO_LANGUAGE_CHOICES = SUPPORTED_AUDIO_LANGUAGES.map(function (languageItem) {
                        return {
                            id: languageItem.id,
                            text: languageItem.description
                        };
                    });
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/preferences-page/preferences-page.module.ts":
/*!***********************************************************************************!*\
  !*** ./core/templates/dev/head/pages/preferences-page/preferences-page.module.ts ***!
  \***********************************************************************************/
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Module for the preferences page.
 */
__webpack_require__(/*! core-js/es7/reflect */ "./node_modules/core-js/es7/reflect.js");
__webpack_require__(/*! zone.js */ "./node_modules/zone.js/dist/zone.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var platform_browser_1 = __webpack_require__(/*! @angular/platform-browser */ "./node_modules/@angular/platform-browser/fesm5/platform-browser.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var http_1 = __webpack_require__(/*! @angular/common/http */ "./node_modules/@angular/common/fesm5/http.js");
// This component is needed to force-bootstrap Angular at the beginning of the
// app.
var ServiceBootstrapComponent = /** @class */ (function () {
    function ServiceBootstrapComponent() {
    }
    ServiceBootstrapComponent = __decorate([
        core_1.Component({
            selector: 'service-bootstrap',
            template: ''
        })
    ], ServiceBootstrapComponent);
    return ServiceBootstrapComponent;
}());
exports.ServiceBootstrapComponent = ServiceBootstrapComponent;
var app_constants_1 = __webpack_require__(/*! app.constants */ "./core/templates/dev/head/app.constants.ts");
var interactions_extension_constants_1 = __webpack_require__(/*! interactions/interactions-extension.constants */ "./extensions/interactions/interactions-extension.constants.ts");
var objects_domain_constants_1 = __webpack_require__(/*! domain/objects/objects-domain.constants */ "./core/templates/dev/head/domain/objects/objects-domain.constants.ts");
var PreferencesPageModule = /** @class */ (function () {
    function PreferencesPageModule() {
    }
    // Empty placeholder method to satisfy the `Compiler`.
    PreferencesPageModule.prototype.ngDoBootstrap = function () { };
    PreferencesPageModule = __decorate([
        core_1.NgModule({
            imports: [
                platform_browser_1.BrowserModule,
                http_1.HttpClientModule
            ],
            declarations: [
                ServiceBootstrapComponent
            ],
            entryComponents: [
                ServiceBootstrapComponent
            ],
            providers: [
                app_constants_1.AppConstants,
                interactions_extension_constants_1.InteractionsExtensionsConstants,
                objects_domain_constants_1.ObjectsDomainConstants,
            ]
        })
    ], PreferencesPageModule);
    return PreferencesPageModule;
}());
var platform_browser_dynamic_1 = __webpack_require__(/*! @angular/platform-browser-dynamic */ "./node_modules/@angular/platform-browser-dynamic/fesm5/platform-browser-dynamic.js");
var static_2 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var bootstrapFn = function (extraProviders) {
    var platformRef = platform_browser_dynamic_1.platformBrowserDynamic(extraProviders);
    return platformRef.bootstrapModule(PreferencesPageModule);
};
var downgradedModule = static_2.downgradeModule(bootstrapFn);
angular.module('oppia', [
    'dndLists', 'headroom', 'infinite-scroll', 'ngAnimate',
    'ngAudio', 'ngCookies', 'ngImgCrop', 'ngJoyRide', 'ngMaterial',
    'ngResource', 'ngSanitize', 'ngTouch', 'pascalprecht.translate',
    'toastr', 'ui.bootstrap', 'ui.sortable', 'ui.tree', 'ui.validate',
    downgradedModule
])
    // This directive is the downgraded version of the Angular component to
    // bootstrap the Angular 8.
    .directive('serviceBootstrap', static_1.downgradeComponent({
    component: ServiceBootstrapComponent
}));


/***/ }),

/***/ "./core/templates/dev/head/pages/preferences-page/preferences-page.scripts.ts":
/*!************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/preferences-page/preferences-page.scripts.ts ***!
  \************************************************************************************/
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
 * @fileoverview Scripts for the Oppia 'edit preferences' page.
 */
// The module needs to be loaded before everything else since it defines the
// main module the elements are attached to.
__webpack_require__(/*! pages/preferences-page/preferences-page.module.ts */ "./core/templates/dev/head/pages/preferences-page/preferences-page.module.ts");
__webpack_require__(/*! App.ts */ "./core/templates/dev/head/App.ts");
__webpack_require__(/*! pages/OppiaFooterDirective.ts */ "./core/templates/dev/head/pages/OppiaFooterDirective.ts");
__webpack_require__(/*! pages/preferences-page/preferences-page.controller.ts */ "./core/templates/dev/head/pages/preferences-page/preferences-page.controller.ts");


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

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvYmFzZV9jb21wb25lbnRzL0Jhc2VDb250ZW50RGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2Jhc2VfY29tcG9uZW50cy9XYXJuaW5nTG9hZGVyRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2NvbW1vbi1lbGVtZW50cy9iYWNrZ3JvdW5kLWJhbm5lci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9jdXN0b20tZm9ybXMtZGlyZWN0aXZlcy9pbWFnZS11cGxvYWRlci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9jdXN0b20tZm9ybXMtZGlyZWN0aXZlcy9zZWxlY3QyLWRyb3Bkb3duLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vb2JqZWN0cy9vYmplY3RzLWRvbWFpbi5jb25zdGFudHMudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL2NvbnZlcnQtdG8tcGxhaW4tdGV4dC5maWx0ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL3RydW5jYXRlLmZpbHRlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9PcHBpYUZvb3RlckRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9wcmVmZXJlbmNlcy1wYWdlL3ByZWZlcmVuY2VzLXBhZ2UuY29udHJvbGxlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9wcmVmZXJlbmNlcy1wYWdlL3ByZWZlcmVuY2VzLXBhZ2UubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3ByZWZlcmVuY2VzLXBhZ2UvcHJlZmVyZW5jZXMtcGFnZS5zY3JpcHRzLnRzIiwid2VicGFjazovLy8uL2V4dGVuc2lvbnMvaW50ZXJhY3Rpb25zL2ludGVyYWN0aW9ucy1leHRlbnNpb24uY29uc3RhbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGdCQUFRLG9CQUFvQjtBQUM1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUFpQiw0QkFBNEI7QUFDN0M7QUFDQTtBQUNBLDBCQUFrQiwyQkFBMkI7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGtEQUEwQyxnQ0FBZ0M7QUFDMUU7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxnRUFBd0Qsa0JBQWtCO0FBQzFFO0FBQ0EseURBQWlELGNBQWM7QUFDL0Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlEQUF5QyxpQ0FBaUM7QUFDMUUsd0hBQWdILG1CQUFtQixFQUFFO0FBQ3JJO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUNBQTJCLDBCQUEwQixFQUFFO0FBQ3ZELHlDQUFpQyxlQUFlO0FBQ2hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhEQUFzRCwrREFBK0Q7O0FBRXJIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBZ0IsdUJBQXVCO0FBQ3ZDOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDdkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxzSEFBMkM7QUFDbkQsbUJBQU8sQ0FBQyw4RkFBK0I7QUFDdkMsbUJBQU8sQ0FBQyxnSEFBd0M7QUFDaEQsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQsbUJBQU8sQ0FBQyxzR0FBbUM7QUFDM0MsbUJBQU8sQ0FBQyx3SEFBNEM7QUFDcEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQixnQ0FBZ0M7QUFDaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRCxtQkFBTyxDQUFDLHNGQUEyQjtBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQixnQ0FBZ0M7QUFDaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JELG1CQUFPLENBQUMsa0dBQWlDO0FBQ3pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3Qix5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhDQUE4QyxjQUFjO0FBQzVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDs7Ozs7Ozs7Ozs7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdURBQXVEO0FBQ3ZELHVEQUF1RDtBQUN2RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDN0JMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxnS0FBZ0U7QUFDeEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDbkNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckIsZ0NBQWdDO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxrSEFBeUM7QUFDakQsbUJBQU8sQ0FBQyxnTEFBd0U7QUFDaEYsbUJBQU8sQ0FBQyw0S0FBc0U7QUFDOUUsbUJBQU8sQ0FBQyx3TUFDNEI7QUFDcEMsbUJBQU8sQ0FBQyxzSUFBbUQ7QUFDM0QsbUJBQU8sQ0FBQyxrSEFBeUM7QUFDakQsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQsbUJBQU8sQ0FBQyxzRkFBMkI7QUFDbkMsbUJBQU8sQ0FBQyxrRkFBeUI7QUFDakMsbUJBQU8sQ0FBQyxvRkFBMEI7QUFDbEM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJDQUEyQyw2QkFBNkI7QUFDeEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaURBQWlEO0FBQ2pEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkNBQTZDO0FBQzdDLHlDQUF5QztBQUN6QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3Qix5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUMxT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0Q0FBNEMsUUFBUTtBQUNwRDtBQUNBO0FBQ0EsOENBQThDLGNBQWM7QUFDNUQ7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxrRUFBcUI7QUFDN0IsbUJBQU8sQ0FBQyxvREFBUztBQUNqQixhQUFhLG1CQUFPLENBQUMsaUVBQWU7QUFDcEMseUJBQXlCLG1CQUFPLENBQUMscUdBQTJCO0FBQzVELGVBQWUsbUJBQU8sQ0FBQyw4RkFBeUI7QUFDaEQsYUFBYSxtQkFBTyxDQUFDLDBFQUFzQjtBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBLHNCQUFzQixtQkFBTyxDQUFDLGlFQUFlO0FBQzdDLHlDQUF5QyxtQkFBTyxDQUFDLG9IQUErQztBQUNoRyxpQ0FBaUMsbUJBQU8sQ0FBQyxxSEFBeUM7QUFDbEY7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpRUFBaUU7QUFDakU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsQ0FBQztBQUNELGlDQUFpQyxtQkFBTyxDQUFDLDZIQUFtQztBQUM1RSxlQUFlLG1CQUFPLENBQUMsOEZBQXlCO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQzs7Ozs7Ozs7Ozs7O0FDMUZEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsc0lBQW1EO0FBQzNELG1CQUFPLENBQUMsZ0RBQVE7QUFDaEIsbUJBQU8sQ0FBQyw4RkFBK0I7QUFDdkMsbUJBQU8sQ0FBQyw4SUFBdUQ7Ozs7Ozs7Ozs7OztBQ3JCL0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4Q0FBOEMsY0FBYztBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEIiwiZmlsZSI6InByZWZlcmVuY2VzLmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIGluc3RhbGwgYSBKU09OUCBjYWxsYmFjayBmb3IgY2h1bmsgbG9hZGluZ1xuIFx0ZnVuY3Rpb24gd2VicGFja0pzb25wQ2FsbGJhY2soZGF0YSkge1xuIFx0XHR2YXIgY2h1bmtJZHMgPSBkYXRhWzBdO1xuIFx0XHR2YXIgbW9yZU1vZHVsZXMgPSBkYXRhWzFdO1xuIFx0XHR2YXIgZXhlY3V0ZU1vZHVsZXMgPSBkYXRhWzJdO1xuXG4gXHRcdC8vIGFkZCBcIm1vcmVNb2R1bGVzXCIgdG8gdGhlIG1vZHVsZXMgb2JqZWN0LFxuIFx0XHQvLyB0aGVuIGZsYWcgYWxsIFwiY2h1bmtJZHNcIiBhcyBsb2FkZWQgYW5kIGZpcmUgY2FsbGJhY2tcbiBcdFx0dmFyIG1vZHVsZUlkLCBjaHVua0lkLCBpID0gMCwgcmVzb2x2ZXMgPSBbXTtcbiBcdFx0Zm9yKDtpIDwgY2h1bmtJZHMubGVuZ3RoOyBpKyspIHtcbiBcdFx0XHRjaHVua0lkID0gY2h1bmtJZHNbaV07XG4gXHRcdFx0aWYoaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdKSB7XG4gXHRcdFx0XHRyZXNvbHZlcy5wdXNoKGluc3RhbGxlZENodW5rc1tjaHVua0lkXVswXSk7XG4gXHRcdFx0fVxuIFx0XHRcdGluc3RhbGxlZENodW5rc1tjaHVua0lkXSA9IDA7XG4gXHRcdH1cbiBcdFx0Zm9yKG1vZHVsZUlkIGluIG1vcmVNb2R1bGVzKSB7XG4gXHRcdFx0aWYoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vcmVNb2R1bGVzLCBtb2R1bGVJZCkpIHtcbiBcdFx0XHRcdG1vZHVsZXNbbW9kdWxlSWRdID0gbW9yZU1vZHVsZXNbbW9kdWxlSWRdO1xuIFx0XHRcdH1cbiBcdFx0fVxuIFx0XHRpZihwYXJlbnRKc29ucEZ1bmN0aW9uKSBwYXJlbnRKc29ucEZ1bmN0aW9uKGRhdGEpO1xuXG4gXHRcdHdoaWxlKHJlc29sdmVzLmxlbmd0aCkge1xuIFx0XHRcdHJlc29sdmVzLnNoaWZ0KCkoKTtcbiBcdFx0fVxuXG4gXHRcdC8vIGFkZCBlbnRyeSBtb2R1bGVzIGZyb20gbG9hZGVkIGNodW5rIHRvIGRlZmVycmVkIGxpc3RcbiBcdFx0ZGVmZXJyZWRNb2R1bGVzLnB1c2guYXBwbHkoZGVmZXJyZWRNb2R1bGVzLCBleGVjdXRlTW9kdWxlcyB8fCBbXSk7XG5cbiBcdFx0Ly8gcnVuIGRlZmVycmVkIG1vZHVsZXMgd2hlbiBhbGwgY2h1bmtzIHJlYWR5XG4gXHRcdHJldHVybiBjaGVja0RlZmVycmVkTW9kdWxlcygpO1xuIFx0fTtcbiBcdGZ1bmN0aW9uIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCkge1xuIFx0XHR2YXIgcmVzdWx0O1xuIFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgZGVmZXJyZWRNb2R1bGVzLmxlbmd0aDsgaSsrKSB7XG4gXHRcdFx0dmFyIGRlZmVycmVkTW9kdWxlID0gZGVmZXJyZWRNb2R1bGVzW2ldO1xuIFx0XHRcdHZhciBmdWxmaWxsZWQgPSB0cnVlO1xuIFx0XHRcdGZvcih2YXIgaiA9IDE7IGogPCBkZWZlcnJlZE1vZHVsZS5sZW5ndGg7IGorKykge1xuIFx0XHRcdFx0dmFyIGRlcElkID0gZGVmZXJyZWRNb2R1bGVbal07XG4gXHRcdFx0XHRpZihpbnN0YWxsZWRDaHVua3NbZGVwSWRdICE9PSAwKSBmdWxmaWxsZWQgPSBmYWxzZTtcbiBcdFx0XHR9XG4gXHRcdFx0aWYoZnVsZmlsbGVkKSB7XG4gXHRcdFx0XHRkZWZlcnJlZE1vZHVsZXMuc3BsaWNlKGktLSwgMSk7XG4gXHRcdFx0XHRyZXN1bHQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IGRlZmVycmVkTW9kdWxlWzBdKTtcbiBcdFx0XHR9XG4gXHRcdH1cblxuIFx0XHRyZXR1cm4gcmVzdWx0O1xuIFx0fVxuXG4gXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBvYmplY3QgdG8gc3RvcmUgbG9hZGVkIGFuZCBsb2FkaW5nIGNodW5rc1xuIFx0Ly8gdW5kZWZpbmVkID0gY2h1bmsgbm90IGxvYWRlZCwgbnVsbCA9IGNodW5rIHByZWxvYWRlZC9wcmVmZXRjaGVkXG4gXHQvLyBQcm9taXNlID0gY2h1bmsgbG9hZGluZywgMCA9IGNodW5rIGxvYWRlZFxuIFx0dmFyIGluc3RhbGxlZENodW5rcyA9IHtcbiBcdFx0XCJwcmVmZXJlbmNlc1wiOiAwXG4gXHR9O1xuXG4gXHR2YXIgZGVmZXJyZWRNb2R1bGVzID0gW107XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGdldHRlciB9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuIFx0XHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbiBcdFx0fVxuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuIFx0fTtcblxuIFx0Ly8gY3JlYXRlIGEgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XG4gXHQvLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbiBcdC8vIG1vZGUgJiAyOiBtZXJnZSBhbGwgcHJvcGVydGllcyBvZiB2YWx1ZSBpbnRvIHRoZSBuc1xuIFx0Ly8gbW9kZSAmIDQ6IHJldHVybiB2YWx1ZSB3aGVuIGFscmVhZHkgbnMgb2JqZWN0XG4gXHQvLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnQgPSBmdW5jdGlvbih2YWx1ZSwgbW9kZSkge1xuIFx0XHRpZihtb2RlICYgMSkgdmFsdWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKHZhbHVlKTtcbiBcdFx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcbiBcdFx0aWYoKG1vZGUgJiA0KSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmIHZhbHVlLl9fZXNNb2R1bGUpIHJldHVybiB2YWx1ZTtcbiBcdFx0dmFyIG5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG5zLCAnZGVmYXVsdCcsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHZhbHVlIH0pO1xuIFx0XHRpZihtb2RlICYgMiAmJiB0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIGZvcih2YXIga2V5IGluIHZhbHVlKSBfX3dlYnBhY2tfcmVxdWlyZV9fLmQobnMsIGtleSwgZnVuY3Rpb24oa2V5KSB7IHJldHVybiB2YWx1ZVtrZXldOyB9LmJpbmQobnVsbCwga2V5KSk7XG4gXHRcdHJldHVybiBucztcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdHZhciBqc29ucEFycmF5ID0gd2luZG93W1wid2VicGFja0pzb25wXCJdID0gd2luZG93W1wid2VicGFja0pzb25wXCJdIHx8IFtdO1xuIFx0dmFyIG9sZEpzb25wRnVuY3Rpb24gPSBqc29ucEFycmF5LnB1c2guYmluZChqc29ucEFycmF5KTtcbiBcdGpzb25wQXJyYXkucHVzaCA9IHdlYnBhY2tKc29ucENhbGxiYWNrO1xuIFx0anNvbnBBcnJheSA9IGpzb25wQXJyYXkuc2xpY2UoKTtcbiBcdGZvcih2YXIgaSA9IDA7IGkgPCBqc29ucEFycmF5Lmxlbmd0aDsgaSsrKSB3ZWJwYWNrSnNvbnBDYWxsYmFjayhqc29ucEFycmF5W2ldKTtcbiBcdHZhciBwYXJlbnRKc29ucEZ1bmN0aW9uID0gb2xkSnNvbnBGdW5jdGlvbjtcblxuXG4gXHQvLyBhZGQgZW50cnkgbW9kdWxlIHRvIGRlZmVycmVkIGxpc3RcbiBcdGRlZmVycmVkTW9kdWxlcy5wdXNoKFtcIi4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvcHJlZmVyZW5jZXMtcGFnZS9wcmVmZXJlbmNlcy1wYWdlLnNjcmlwdHMudHNcIixcInZlbmRvcnN+YWJvdXR+YWRtaW5+Y29sbGVjdGlvbl9lZGl0b3J+Y29sbGVjdGlvbl9wbGF5ZXJ+Y29tbXVuaXR5X2Rhc2hib2FyZH5jb250YWN0fmNyZWF0b3JfZGFzaGJvYXJ+Nzg1NmMwNWFcIixcImFib3V0fmFkbWlufmNvbGxlY3Rpb25fZWRpdG9yfmNvbGxlY3Rpb25fcGxheWVyfmNvbW11bml0eV9kYXNoYm9hcmR+Y29udGFjdH5jcmVhdG9yX2Rhc2hib2FyZH5kb25hdGV+ZTA2YTRhMTdcIixcImNvbW11bml0eV9kYXNoYm9hcmR+bGlicmFyeX5wcmVmZXJlbmNlc1wiXSk7XG4gXHQvLyBydW4gZGVmZXJyZWQgbW9kdWxlcyB3aGVuIHJlYWR5XG4gXHRyZXR1cm4gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgQmFzZSBUcmFuc2NsdXNpb24gQ29tcG9uZW50LlxuICovXG5yZXF1aXJlKCdiYXNlX2NvbXBvbmVudHMvV2FybmluZ0xvYWRlckRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvT3BwaWFGb290ZXJEaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9zaWRlYmFyL1NpZGViYXJTdGF0dXNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL3N0YXRlZnVsL0JhY2tncm91bmRNYXNrU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdiYXNlQ29udGVudCcsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdHJhbnNjbHVkZToge1xuICAgICAgICAgICAgICAgIGJyZWFkY3J1bWI6ICc/bmF2YmFyQnJlYWRjcnVtYicsXG4gICAgICAgICAgICAgICAgY29udGVudDogJ2NvbnRlbnQnLFxuICAgICAgICAgICAgICAgIGZvb3RlcjogJz9wYWdlRm9vdGVyJyxcbiAgICAgICAgICAgICAgICBuYXZPcHRpb25zOiAnP25hdk9wdGlvbnMnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2Jhc2VfY29tcG9uZW50cy9iYXNlX2NvbnRlbnRfZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHJvb3RTY29wZScsICdCYWNrZ3JvdW5kTWFza1NlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdTaWRlYmFyU3RhdHVzU2VydmljZScsICdVcmxTZXJ2aWNlJywgJ1NJVEVfRkVFREJBQ0tfRk9STV9VUkwnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBCYWNrZ3JvdW5kTWFza1NlcnZpY2UsIFNpZGViYXJTdGF0dXNTZXJ2aWNlLCBVcmxTZXJ2aWNlLCBTSVRFX0ZFRURCQUNLX0ZPUk1fVVJMKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pZnJhbWVkID0gVXJsU2VydmljZS5pc0lmcmFtZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zaXRlRmVlZGJhY2tGb3JtVXJsID0gU0lURV9GRUVEQkFDS19GT1JNX1VSTDtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc1NpZGViYXJTaG93biA9IFNpZGViYXJTdGF0dXNTZXJ2aWNlLmlzU2lkZWJhclNob3duO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNsb3NlU2lkZWJhck9uU3dpcGUgPSBTaWRlYmFyU3RhdHVzU2VydmljZS5jbG9zZVNpZGViYXI7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaXNCYWNrZ3JvdW5kTWFza0FjdGl2ZSA9IEJhY2tncm91bmRNYXNrU2VydmljZS5pc01hc2tBY3RpdmU7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuREVWX01PREUgPSAkcm9vdFNjb3BlLkRFVl9NT0RFO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNraXBUb01haW5Db250ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1haW5Db250ZW50RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdvcHBpYS1tYWluLWNvbnRlbnQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbWFpbkNvbnRlbnRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1ZhcmlhYmxlIG1haW5Db250ZW50RWxlbWVudCBpcyB1bmRlZmluZWQuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBtYWluQ29udGVudEVsZW1lbnQudGFiSW5kZXggPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1haW5Db250ZW50RWxlbWVudC5zY3JvbGxJbnRvVmlldygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFpbkNvbnRlbnRFbGVtZW50LmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHdhcm5pbmdfbG9hZGVyLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3dhcm5pbmdMb2FkZXInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2Jhc2VfY29tcG9uZW50cy93YXJuaW5nX2xvYWRlcl9kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWydBbGVydHNTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoQWxlcnRzU2VydmljZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuQWxlcnRzU2VydmljZSA9IEFsZXJ0c1NlcnZpY2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBiYWNrZ3JvdW5kIGJhbm5lci5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdiYWNrZ3JvdW5kQmFubmVyJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvY29tbW9uLWVsZW1lbnRzLycgK1xuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWJhbm5lci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcG9zc2libGVCYW5uZXJGaWxlbmFtZXMgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAnYmFubmVyQS5zdmcnLCAnYmFubmVyQi5zdmcnLCAnYmFubmVyQy5zdmcnLCAnYmFubmVyRC5zdmcnXG4gICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgIHZhciBiYW5uZXJJbWFnZUZpbGVuYW1lID0gcG9zc2libGVCYW5uZXJGaWxlbmFtZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcG9zc2libGVCYW5uZXJGaWxlbmFtZXMubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuYmFubmVySW1hZ2VGaWxlVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmwoJy9iYWNrZ3JvdW5kLycgKyBiYW5uZXJJbWFnZUZpbGVuYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdXBsb2FkaW5nIGltYWdlcy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvSWRHZW5lcmF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdpbWFnZVVwbG9hZGVyJywgW1xuICAgICdJZEdlbmVyYXRpb25TZXJ2aWNlJywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoSWRHZW5lcmF0aW9uU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIGhlaWdodDogJ0AnLFxuICAgICAgICAgICAgICAgIG9uRmlsZUNoYW5nZWQ6ICc9JyxcbiAgICAgICAgICAgICAgICBlcnJvck1lc3NhZ2U6ICdAJyxcbiAgICAgICAgICAgICAgICB3aWR0aDogJ0AnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9mb3Jtcy9jdXN0b20tZm9ybXMtZGlyZWN0aXZlcy8nICtcbiAgICAgICAgICAgICAgICAnaW1hZ2UtdXBsb2FkZXIuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWx0KSB7XG4gICAgICAgICAgICAgICAgdmFyIG9uRHJhZ0VuZCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmltYWdlLXVwbG9hZGVyLWRyb3AtYXJlYScpLnJlbW92ZUNsYXNzKCdpbWFnZS11cGxvYWRlci1pcy1hY3RpdmUnKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHZhciB2YWxpZGF0ZVVwbG9hZGVkRmlsZSA9IGZ1bmN0aW9uIChmaWxlLCBmaWxlbmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWZpbGUgfHwgIWZpbGUuc2l6ZSB8fCAhZmlsZS50eXBlLm1hdGNoKCdpbWFnZS4qJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnVGhpcyBmaWxlIGlzIG5vdCByZWNvZ25pemVkIGFzIGFuIGltYWdlLic7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmaWxlLnR5cGUubWF0Y2goJ2ltYWdlLmpwZWcnKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgIWZpbGUudHlwZS5tYXRjaCgnaW1hZ2UuZ2lmJykgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICFmaWxlLnR5cGUubWF0Y2goJ2ltYWdlLmpwZycpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAhZmlsZS50eXBlLm1hdGNoKCdpbWFnZS5wbmcnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdUaGlzIGltYWdlIGZvcm1hdCBpcyBub3Qgc3VwcG9ydGVkLic7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKChmaWxlLnR5cGUubWF0Y2goL2pwKGU/KWckLykgJiYgIWZpbGUubmFtZS5tYXRjaCgvXFwuanAoZT8pZyQvKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIChmaWxlLnR5cGUubWF0Y2goL2dpZiQvKSAmJiAhZmlsZS5uYW1lLm1hdGNoKC9cXC5naWYkLykpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAoZmlsZS50eXBlLm1hdGNoKC9wbmckLykgJiYgIWZpbGUubmFtZS5tYXRjaCgvXFwucG5nJC8pKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdUaGlzIGltYWdlIGZvcm1hdCBkb2VzIG5vdCBtYXRjaCB0aGUgZmlsZW5hbWUgZXh0ZW5zaW9uLic7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIE9ORV9NQl9JTl9CWVRFUyA9IDEwNDg1NzY7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWxlLnNpemUgPiBPTkVfTUJfSU5fQllURVMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50U2l6ZSA9IChmaWxlLnNpemUgLyBPTkVfTUJfSU5fQllURVMpLnRvRml4ZWQoMSkgKyAnIE1CJztcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnVGhlIG1heGltdW0gYWxsb3dlZCBmaWxlIHNpemUgaXMgMSBNQicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgKCcgKyBjdXJyZW50U2l6ZSArICcgZ2l2ZW4pLic7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAkKGVsdCkuYmluZCgnZHJvcCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIG9uRHJhZ0VuZChlKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpbGUgPSBlLm9yaWdpbmFsRXZlbnQuZGF0YVRyYW5zZmVyLmZpbGVzWzBdO1xuICAgICAgICAgICAgICAgICAgICBzY29wZS5lcnJvck1lc3NhZ2UgPSB2YWxpZGF0ZVVwbG9hZGVkRmlsZShmaWxlLCBmaWxlLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXNjb3BlLmVycm9yTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gT25seSBmaXJlIHRoaXMgZXZlbnQgaWYgdmFsaWRhdGlvbnMgcGFzcy5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLm9uRmlsZUNoYW5nZWQoZmlsZSwgZmlsZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAkKGVsdCkuYmluZCgnZHJhZ292ZXInLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICQoJy5pbWFnZS11cGxvYWRlci1kcm9wLWFyZWEnKS5hZGRDbGFzcygnaW1hZ2UtdXBsb2FkZXItaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgJChlbHQpLmJpbmQoJ2RyYWdsZWF2ZScsIG9uRHJhZ0VuZCk7XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIHVzZXIgYWNjaWRlbnRhbGx5IGRyb3BzIGFuIGltYWdlIG91dHNpZGUgb2YgdGhlIGltYWdlLXVwbG9hZGVyXG4gICAgICAgICAgICAgICAgLy8gd2Ugd2FudCB0byBwcmV2ZW50IHRoZSBicm93c2VyIGZyb20gYXBwbHlpbmcgbm9ybWFsIGRyYWctYW5kLWRyb3BcbiAgICAgICAgICAgICAgICAvLyBsb2dpYywgd2hpY2ggaXMgdG8gbG9hZCB0aGUgaW1hZ2UgaW4gdGhlIGJyb3dzZXIgdGFiLlxuICAgICAgICAgICAgICAgICQod2luZG93KS5iaW5kKCdkcmFnb3ZlcicsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAkKHdpbmRvdykuYmluZCgnZHJvcCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAvLyBXZSBnZW5lcmF0ZSBhIHJhbmRvbSBjbGFzcyBuYW1lIHRvIGRpc3Rpbmd1aXNoIHRoaXMgaW5wdXQgZnJvbVxuICAgICAgICAgICAgICAgIC8vIG90aGVycyBpbiB0aGUgRE9NLlxuICAgICAgICAgICAgICAgIHNjb3BlLmZpbGVJbnB1dENsYXNzTmFtZSA9ICgnaW1hZ2UtdXBsb2FkZXItZmlsZS1pbnB1dCcgKyBJZEdlbmVyYXRpb25TZXJ2aWNlLmdlbmVyYXRlTmV3SWQoKSk7XG4gICAgICAgICAgICAgICAgYW5ndWxhci5lbGVtZW50KGRvY3VtZW50KS5vbignY2hhbmdlJywgJy4nICsgc2NvcGUuZmlsZUlucHV0Q2xhc3NOYW1lLCBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmaWxlID0gZXZ0LmN1cnJlbnRUYXJnZXQuZmlsZXNbMF07XG4gICAgICAgICAgICAgICAgICAgIHZhciBmaWxlbmFtZSA9IGV2dC50YXJnZXQudmFsdWUuc3BsaXQoLyhcXFxcfFxcLykvZykucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLmVycm9yTWVzc2FnZSA9IHZhbGlkYXRlVXBsb2FkZWRGaWxlKGZpbGUsIGZpbGVuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzY29wZS5lcnJvck1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9ubHkgZmlyZSB0aGlzIGV2ZW50IGlmIHZhbGlkYXRpb25zIHBhc3MuXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5vbkZpbGVDaGFuZ2VkKGZpbGUsIGZpbGVuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgc2VsZWN0MiBhdXRvY29tcGxldGUgY29tcG9uZW50LlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3NlbGVjdDJEcm9wZG93bicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgLy8gRGlyZWN0aXZlIGZvciBpbmNvcnBvcmF0aW5nIHNlbGVjdDIgZHJvcGRvd25zLlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgLy8gV2hldGhlciB0byBhbGxvdyBtdWx0aXBsZSBjaG9pY2VzLiBJbiBvcmRlciB0byBkbyBzbywgdGhlIHZhbHVlIG9mXG4gICAgICAgICAgICAgICAgLy8gdGhpcyBhdHRyaWJ1dGUgbXVzdCBiZSB0aGUgZXhhY3Qgc3RyaW5nICd0cnVlJy5cbiAgICAgICAgICAgICAgICBhbGxvd011bHRpcGxlQ2hvaWNlczogJ0AnLFxuICAgICAgICAgICAgICAgIGNob2ljZXM6ICc9JyxcbiAgICAgICAgICAgICAgICAvLyBBbiBhZGRpdGlvbmFsIENTUyBjbGFzcyB0byBhZGQgdG8gdGhlIHNlbGVjdDIgZHJvcGRvd24uIE1heSBiZVxuICAgICAgICAgICAgICAgIC8vIHVuZGVmaW5lZC5cbiAgICAgICAgICAgICAgICBkcm9wZG93bkNzc0NsYXNzOiAnQCcsXG4gICAgICAgICAgICAgICAgLy8gQSBmdW5jdGlvbiB0aGF0IGZvcm1hdHMgYSBuZXcgc2VsZWN0aW9uLiBNYXkgYmUgdW5kZWZpbmVkLlxuICAgICAgICAgICAgICAgIGZvcm1hdE5ld1NlbGVjdGlvbjogJz0nLFxuICAgICAgICAgICAgICAgIC8vIFRoZSBtZXNzYWdlIHNob3duIHdoZW4gYW4gaW52YWxpZCBzZWFyY2ggdGVybSBpcyBlbnRlcmVkLiBNYXkgYmVcbiAgICAgICAgICAgICAgICAvLyB1bmRlZmluZWQsIGluIHdoaWNoIGNhc2UgdGhpcyBkZWZhdWx0cyB0byAnTm8gbWF0Y2hlcyBmb3VuZCcuXG4gICAgICAgICAgICAgICAgaW52YWxpZFNlYXJjaFRlcm1NZXNzYWdlOiAnQCcsXG4gICAgICAgICAgICAgICAgaXRlbTogJz0nLFxuICAgICAgICAgICAgICAgIC8vIFRoZSByZWdleCB1c2VkIHRvIHZhbGlkYXRlIG5ld2x5LWVudGVyZWQgY2hvaWNlcyB0aGF0IGRvIG5vdFxuICAgICAgICAgICAgICAgIC8vIGFscmVhZHkgZXhpc3QuIElmIGl0IGlzIHVuZGVmaW5lZCB0aGVuIGFsbCBuZXcgY2hvaWNlcyBhcmUgcmVqZWN0ZWQuXG4gICAgICAgICAgICAgICAgbmV3Q2hvaWNlUmVnZXg6ICdAJyxcbiAgICAgICAgICAgICAgICBvblNlbGVjdGlvbkNoYW5nZTogJyYnLFxuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyOiAnQCcsXG4gICAgICAgICAgICAgICAgd2lkdGg6ICdAJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvZm9ybXMvY3VzdG9tLWZvcm1zLWRpcmVjdGl2ZXMvJyArXG4gICAgICAgICAgICAgICAgJ3NlbGVjdDItZHJvcGRvd24uZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyRlbGVtZW50JywgZnVuY3Rpb24gKCRzY29wZSwgJGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm5ld0Nob2ljZVZhbGlkYXRvciA9IG5ldyBSZWdFeHAoJHNjb3BlLm5ld0Nob2ljZVJlZ2V4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGVjdDJPcHRpb25zID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dDbGVhcjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiAkc2NvcGUuY2hvaWNlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpcGxlOiAkc2NvcGUuYWxsb3dNdWx0aXBsZUNob2ljZXMgPT09ICd0cnVlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ3M6ICRzY29wZS5uZXdDaG9pY2VSZWdleCAhPT0gdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI6ICRzY29wZS5wbGFjZWhvbGRlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAkc2NvcGUud2lkdGggfHwgJzI1MHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyb3Bkb3duQ3NzQ2xhc3M6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVUYWc6IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyYW1zLnRlcm0ubWF0Y2goJHNjb3BlLm5ld0Nob2ljZVZhbGlkYXRvcikgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBwYXJhbXMudGVybSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogcGFyYW1zLnRlcm1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IDogbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVJlc3VsdDogZnVuY3Rpb24gKHF1ZXJ5UmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRvZXNDaG9pY2VNYXRjaFRleHQgPSBmdW5jdGlvbiAoY2hvaWNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjaG9pY2UuaWQgPT09IHF1ZXJ5UmVzdWx0LnRleHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmNob2ljZXMgJiYgJHNjb3BlLmNob2ljZXMuc29tZShkb2VzQ2hvaWNlTWF0Y2hUZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcXVlcnlSZXN1bHQudGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuZm9ybWF0TmV3U2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHNjb3BlLmZvcm1hdE5ld1NlbGVjdGlvbihxdWVyeVJlc3VsdC50ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBxdWVyeVJlc3VsdC50ZXh0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhbmd1YWdlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9SZXN1bHRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaW52YWxpZFNlYXJjaFRlcm1NZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHNjb3BlLmludmFsaWRTZWFyY2hUZXJtTWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnTm8gbWF0Y2hlcyBmb3VuZCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuZHJvcGRvd25Dc3NDbGFzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0Mk9wdGlvbnMuZHJvcGRvd25Dc3NDbGFzcyA9ICRzY29wZS5kcm9wZG93bkNzc0NsYXNzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxlY3QyTm9kZSA9ICRlbGVtZW50WzBdLmZpcnN0Q2hpbGQ7XG4gICAgICAgICAgICAgICAgICAgIC8vIEluaXRpYWxpemUgdGhlIGRyb3Bkb3duLlxuICAgICAgICAgICAgICAgICAgICAkKHNlbGVjdDJOb2RlKS5zZWxlY3QyKHNlbGVjdDJPcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgJChzZWxlY3QyTm9kZSkudmFsKCRzY29wZS5pdGVtKS50cmlnZ2VyKCdjaGFuZ2UnKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlICRzY29wZS5pdGVtIHdoZW4gdGhlIHNlbGVjdGlvbiBjaGFuZ2VzLlxuICAgICAgICAgICAgICAgICAgICAkKHNlbGVjdDJOb2RlKS5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLml0ZW0gPSAkKHNlbGVjdDJOb2RlKS52YWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5vblNlbGVjdGlvbkNoYW5nZSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVzcG9uZCB0byBleHRlcm5hbCBjaGFuZ2VzIGluICRzY29wZS5pdGVtXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kd2F0Y2goJ2l0ZW0nLCBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoc2VsZWN0Mk5vZGUpLnZhbChuZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnN0YW50cyBmb3Igb2JqZWN0cyBkb21haW4uXG4gKi9cbnZhciBPYmplY3RzRG9tYWluQ29uc3RhbnRzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE9iamVjdHNEb21haW5Db25zdGFudHMoKSB7XG4gICAgfVxuICAgIE9iamVjdHNEb21haW5Db25zdGFudHMuRlJBQ1RJT05fUEFSU0lOR19FUlJPUlMgPSB7XG4gICAgICAgIElOVkFMSURfQ0hBUlM6ICdQbGVhc2Ugb25seSB1c2UgbnVtZXJpY2FsIGRpZ2l0cywgc3BhY2VzIG9yIGZvcndhcmQgc2xhc2hlcyAoLyknLFxuICAgICAgICBJTlZBTElEX0ZPUk1BVDogJ1BsZWFzZSBlbnRlciBhIHZhbGlkIGZyYWN0aW9uIChlLmcuLCA1LzMgb3IgMSAyLzMpJyxcbiAgICAgICAgRElWSVNJT05fQllfWkVSTzogJ1BsZWFzZSBkbyBub3QgcHV0IDAgaW4gdGhlIGRlbm9taW5hdG9yJ1xuICAgIH07XG4gICAgT2JqZWN0c0RvbWFpbkNvbnN0YW50cy5OVU1CRVJfV0lUSF9VTklUU19QQVJTSU5HX0VSUk9SUyA9IHtcbiAgICAgICAgSU5WQUxJRF9WQUxVRTogJ1BsZWFzZSBlbnN1cmUgdGhhdCB2YWx1ZSBpcyBlaXRoZXIgYSBmcmFjdGlvbiBvciBhIG51bWJlcicsXG4gICAgICAgIElOVkFMSURfQ1VSUkVOQ1k6ICdQbGVhc2UgZW50ZXIgYSB2YWxpZCBjdXJyZW5jeSAoZS5nLiwgJDUgb3IgUnMgNSknLFxuICAgICAgICBJTlZBTElEX0NVUlJFTkNZX0ZPUk1BVDogJ1BsZWFzZSB3cml0ZSBjdXJyZW5jeSB1bml0cyBhdCB0aGUgYmVnaW5uaW5nJyxcbiAgICAgICAgSU5WQUxJRF9VTklUX0NIQVJTOiAnUGxlYXNlIGVuc3VyZSB0aGF0IHVuaXQgb25seSBjb250YWlucyBudW1iZXJzLCBhbHBoYWJldHMsICgsICksICosIF4sICcgK1xuICAgICAgICAgICAgJy8sIC0nXG4gICAgfTtcbiAgICBPYmplY3RzRG9tYWluQ29uc3RhbnRzLkNVUlJFTkNZX1VOSVRTID0ge1xuICAgICAgICBkb2xsYXI6IHtcbiAgICAgICAgICAgIG5hbWU6ICdkb2xsYXInLFxuICAgICAgICAgICAgYWxpYXNlczogWyckJywgJ2RvbGxhcnMnLCAnRG9sbGFycycsICdEb2xsYXInLCAnVVNEJ10sXG4gICAgICAgICAgICBmcm9udF91bml0czogWyckJ10sXG4gICAgICAgICAgICBiYXNlX3VuaXQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgcnVwZWU6IHtcbiAgICAgICAgICAgIG5hbWU6ICdydXBlZScsXG4gICAgICAgICAgICBhbGlhc2VzOiBbJ1JzJywgJ3J1cGVlcycsICfigrknLCAnUnVwZWVzJywgJ1J1cGVlJ10sXG4gICAgICAgICAgICBmcm9udF91bml0czogWydScyAnLCAn4oK5J10sXG4gICAgICAgICAgICBiYXNlX3VuaXQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgY2VudDoge1xuICAgICAgICAgICAgbmFtZTogJ2NlbnQnLFxuICAgICAgICAgICAgYWxpYXNlczogWydjZW50cycsICdDZW50cycsICdDZW50J10sXG4gICAgICAgICAgICBmcm9udF91bml0czogW10sXG4gICAgICAgICAgICBiYXNlX3VuaXQ6ICcwLjAxIGRvbGxhcidcbiAgICAgICAgfSxcbiAgICAgICAgcGFpc2U6IHtcbiAgICAgICAgICAgIG5hbWU6ICdwYWlzZScsXG4gICAgICAgICAgICBhbGlhc2VzOiBbJ3BhaXNhJywgJ1BhaXNlJywgJ1BhaXNhJ10sXG4gICAgICAgICAgICBmcm9udF91bml0czogW10sXG4gICAgICAgICAgICBiYXNlX3VuaXQ6ICcwLjAxIHJ1cGVlJ1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gT2JqZWN0c0RvbWFpbkNvbnN0YW50cztcbn0oKSk7XG5leHBvcnRzLk9iamVjdHNEb21haW5Db25zdGFudHMgPSBPYmplY3RzRG9tYWluQ29uc3RhbnRzO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb252ZXJ0VG9QbGFpblRleHQgZmlsdGVyIGZvciBPcHBpYS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmlsdGVyKCdjb252ZXJ0VG9QbGFpblRleHQnLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgc3RyaXBwZWRUZXh0ID0gaW5wdXQucmVwbGFjZSgvKDwoW14+XSspPikvaWcsICcnKTtcbiAgICAgICAgICAgIHN0cmlwcGVkVGV4dCA9IHN0cmlwcGVkVGV4dC5yZXBsYWNlKC8mbmJzcDsvaWcsICcgJyk7XG4gICAgICAgICAgICBzdHJpcHBlZFRleHQgPSBzdHJpcHBlZFRleHQucmVwbGFjZSgvJnF1b3Q7L2lnLCAnJyk7XG4gICAgICAgICAgICB2YXIgdHJpbW1lZFRleHQgPSBzdHJpcHBlZFRleHQudHJpbSgpO1xuICAgICAgICAgICAgaWYgKHRyaW1tZWRUZXh0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdHJpcHBlZFRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJpbW1lZFRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBUcnVuY2F0ZSBmaWx0ZXIgZm9yIE9wcGlhLlxuICovXG5yZXF1aXJlKCdmaWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvY29udmVydC10by1wbGFpbi10ZXh0LmZpbHRlci50cycpO1xuLy8gRmlsdGVyIHRoYXQgdHJ1bmNhdGVzIGxvbmcgZGVzY3JpcHRvcnMuXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5maWx0ZXIoJ3RydW5jYXRlJywgWyckZmlsdGVyJywgZnVuY3Rpb24gKCRmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChpbnB1dCwgbGVuZ3RoLCBzdWZmaXgpIHtcbiAgICAgICAgICAgIGlmICghaW5wdXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNOYU4obGVuZ3RoKSkge1xuICAgICAgICAgICAgICAgIGxlbmd0aCA9IDcwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHN1ZmZpeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgc3VmZml4ID0gJy4uLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWFuZ3VsYXIuaXNTdHJpbmcoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgaW5wdXQgPSBTdHJpbmcoaW5wdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW5wdXQgPSAkZmlsdGVyKCdjb252ZXJ0VG9QbGFpblRleHQnKShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gKGlucHV0Lmxlbmd0aCA8PSBsZW5ndGggPyBpbnB1dCA6IChpbnB1dC5zdWJzdHJpbmcoMCwgbGVuZ3RoIC0gc3VmZml4Lmxlbmd0aCkgKyBzdWZmaXgpKTtcbiAgICAgICAgfTtcbiAgICB9XSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIGZvb3Rlci5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdvcHBpYUZvb3RlcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL29wcGlhX2Zvb3Rlcl9kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHsgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEYXRhIGFuZCBjb250cm9sbGVycyBmb3IgdGhlIE9wcGlhICdlZGl0IHByZWZlcmVuY2VzJyBwYWdlLlxuICovXG5yZXF1aXJlKCdiYXNlX2NvbXBvbmVudHMvQmFzZUNvbnRlbnREaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvY3VzdG9tLWZvcm1zLWRpcmVjdGl2ZXMvc2VsZWN0Mi1kcm9wZG93bi5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvY3VzdG9tLWZvcm1zLWRpcmVjdGl2ZXMvaW1hZ2UtdXBsb2FkZXIuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9jb21tb24tZWxlbWVudHMvJyArXG4gICAgJ2JhY2tncm91bmQtYmFubmVyLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL3RydW5jYXRlLmZpbHRlci50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9MYW5ndWFnZVV0aWxTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Vc2VyU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvVXRpbHNTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3ByZWZlcmVuY2VzUGFnZScsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7XG4gICAgICAgICAgICAgICAgc3ViamVjdEludGVyZXN0czogJz0nLFxuICAgICAgICAgICAgICAgIHByZWZlcnJlZExhbmd1YWdlQ29kZXM6ICc9JyxcbiAgICAgICAgICAgICAgICBwcmVmZXJyZWRTaXRlTGFuZ3VhZ2VDb2RlOiAnPScsXG4gICAgICAgICAgICAgICAgcHJlZmVycmVkQXVkaW9MYW5ndWFnZUNvZGU6ICc9J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL3ByZWZlcmVuY2VzLXBhZ2UvcHJlZmVyZW5jZXMtcGFnZS5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckaHR0cCcsICckcScsICckcm9vdFNjb3BlJywgJyRzY29wZScsICckdGltZW91dCcsICckdHJhbnNsYXRlJyxcbiAgICAgICAgICAgICAgICAnJHdpbmRvdycsICckdWliTW9kYWwnLCAnQWxlcnRzU2VydmljZScsICdMYW5ndWFnZVV0aWxTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCAnVXNlclNlcnZpY2UnLCAnVXRpbHNTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnREFTSEJPQVJEX1RZUEVfQ1JFQVRPUicsICdEQVNIQk9BUkRfVFlQRV9MRUFSTkVSJyxcbiAgICAgICAgICAgICAgICAnU1VQUE9SVEVEX0FVRElPX0xBTkdVQUdFUycsICdTVVBQT1JURURfU0lURV9MQU5HVUFHRVMnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkaHR0cCwgJHEsICRyb290U2NvcGUsICRzY29wZSwgJHRpbWVvdXQsICR0cmFuc2xhdGUsICR3aW5kb3csICR1aWJNb2RhbCwgQWxlcnRzU2VydmljZSwgTGFuZ3VhZ2VVdGlsU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIFVzZXJTZXJ2aWNlLCBVdGlsc1NlcnZpY2UsIERBU0hCT0FSRF9UWVBFX0NSRUFUT1IsIERBU0hCT0FSRF9UWVBFX0xFQVJORVIsIFNVUFBPUlRFRF9BVURJT19MQU5HVUFHRVMsIFNVUFBPUlRFRF9TSVRFX0xBTkdVQUdFUykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfUFJFRkVSRU5DRVNfREFUQV9VUkwgPSAnL3ByZWZlcmVuY2VzaGFuZGxlci9kYXRhJztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5wcm9maWxlUGljdHVyZURhdGFVcmwgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5EQVNIQk9BUkRfVFlQRV9DUkVBVE9SID0gREFTSEJPQVJEX1RZUEVfQ1JFQVRPUjtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5EQVNIQk9BUkRfVFlQRV9MRUFSTkVSID0gREFTSEJPQVJEX1RZUEVfTEVBUk5FUjtcbiAgICAgICAgICAgICAgICAgICAgY3RybC51c2VybmFtZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdNZXNzYWdlID0gJ0xvYWRpbmcnO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdXNlckluZm9Qcm9taXNlID0gVXNlclNlcnZpY2UuZ2V0VXNlckluZm9Bc3luYygpO1xuICAgICAgICAgICAgICAgICAgICB1c2VySW5mb1Byb21pc2UudGhlbihmdW5jdGlvbiAodXNlckluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudXNlcm5hbWUgPSB1c2VySW5mby5nZXRVc2VybmFtZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5lbWFpbCA9IHVzZXJJbmZvLmdldEVtYWlsKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmhhc1BhZ2VMb2FkZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHByZWZlcmVuY2VzUHJvbWlzZSA9ICRodHRwLmdldChfUFJFRkVSRU5DRVNfREFUQV9VUkwpO1xuICAgICAgICAgICAgICAgICAgICBwcmVmZXJlbmNlc1Byb21pc2UudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudXNlckJpbyA9IGRhdGEudXNlcl9iaW87XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnN1YmplY3RJbnRlcmVzdHMgPSBkYXRhLnN1YmplY3RfaW50ZXJlc3RzO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5wcmVmZXJyZWRMYW5ndWFnZUNvZGVzID0gZGF0YS5wcmVmZXJyZWRfbGFuZ3VhZ2VfY29kZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnByb2ZpbGVQaWN0dXJlRGF0YVVybCA9IGRhdGEucHJvZmlsZV9waWN0dXJlX2RhdGFfdXJsO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5kZWZhdWx0RGFzaGJvYXJkID0gZGF0YS5kZWZhdWx0X2Rhc2hib2FyZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuY2FuUmVjZWl2ZUVtYWlsVXBkYXRlcyA9IGRhdGEuY2FuX3JlY2VpdmVfZW1haWxfdXBkYXRlcztcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuY2FuUmVjZWl2ZUVkaXRvclJvbGVFbWFpbCA9IGRhdGEuY2FuX3JlY2VpdmVfZWRpdG9yX3JvbGVfZW1haWw7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmNhblJlY2VpdmVTdWJzY3JpcHRpb25FbWFpbCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5jYW5fcmVjZWl2ZV9zdWJzY3JpcHRpb25fZW1haWw7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmNhblJlY2VpdmVGZWVkYmFja01lc3NhZ2VFbWFpbCA9IChkYXRhLmNhbl9yZWNlaXZlX2ZlZWRiYWNrX21lc3NhZ2VfZW1haWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5wcmVmZXJyZWRTaXRlTGFuZ3VhZ2VDb2RlID0gZGF0YS5wcmVmZXJyZWRfc2l0ZV9sYW5ndWFnZV9jb2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5wcmVmZXJyZWRBdWRpb0xhbmd1YWdlQ29kZSA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5wcmVmZXJyZWRfYXVkaW9fbGFuZ3VhZ2VfY29kZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc3Vic2NyaXB0aW9uTGlzdCA9IGRhdGEuc3Vic2NyaXB0aW9uX2xpc3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmhhc1BhZ2VMb2FkZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgX2ZvcmNlU2VsZWN0MlJlZnJlc2goKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICRxLmFsbChbdXNlckluZm9Qcm9taXNlLCBwcmVmZXJlbmNlc1Byb21pc2VdKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ01lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0U3RhdGljSW1hZ2VVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRTdGF0aWNJbWFnZVVybDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIF9zYXZlRGF0YUl0ZW0gPSBmdW5jdGlvbiAodXBkYXRlVHlwZSwgZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJGh0dHAucHV0KF9QUkVGRVJFTkNFU19EQVRBX1VSTCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZV90eXBlOiB1cGRhdGVUeXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IGRhdGFcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBTZWxlY3QyIGRyb3Bkb3duIGNhbm5vdCBhdXRvbWF0aWNhbGx5IHJlZnJlc2ggaXRzIGRpc3BsYXlcbiAgICAgICAgICAgICAgICAgICAgLy8gYWZ0ZXIgYmVpbmcgdHJhbnNsYXRlZC5cbiAgICAgICAgICAgICAgICAgICAgLy8gVXNlIGN0cmwuc2VsZWN0MkRyb3Bkb3duSXNTaG93biBpbiBpdHMgbmctaWYgYXR0cmlidXRlXG4gICAgICAgICAgICAgICAgICAgIC8vIGFuZCB0aGlzIGZ1bmN0aW9uIHRvIGZvcmNlIGl0IHRvIHJlbG9hZFxuICAgICAgICAgICAgICAgICAgICB2YXIgX2ZvcmNlU2VsZWN0MlJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNlbGVjdDJEcm9wZG93bklzU2hvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNlbGVjdDJEcm9wZG93bklzU2hvd24gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zYXZlVXNlckJpbyA9IGZ1bmN0aW9uICh1c2VyQmlvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfc2F2ZURhdGFJdGVtKCd1c2VyX2JpbycsIHVzZXJCaW8pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnN1YmplY3RJbnRlcmVzdHNDaGFuZ2VkQXRMZWFzdE9uY2UgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zdWJqZWN0SW50ZXJlc3RzV2FybmluZ1RleHQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLlRBR19SRUdFWF9TVFJJTkcgPSAnXlthLXogXSskJztcbiAgICAgICAgICAgICAgICAgICAgY3RybC51cGRhdGVTdWJqZWN0SW50ZXJlc3RzV2FybmluZyA9IGZ1bmN0aW9uIChzdWJqZWN0SW50ZXJlc3RzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgVEFHX1JFR0VYID0gbmV3IFJlZ0V4cChjdHJsLlRBR19SRUdFWF9TVFJJTkcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN1YmplY3RJbnRlcmVzdHMgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3ViamVjdEludGVyZXN0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoVXRpbHNTZXJ2aWNlLmlzU3RyaW5nKHN1YmplY3RJbnRlcmVzdHNbaV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIVRBR19SRUdFWC50ZXN0KHN1YmplY3RJbnRlcmVzdHNbaV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zdWJqZWN0SW50ZXJlc3RzV2FybmluZ1RleHQgPSAoJ1N1YmplY3QgaW50ZXJlc3RzIHNob3VsZCB1c2Ugb25seSBsb3dlcmNhc2UgbGV0dGVycy4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yOiByZWNlaXZlZCBiYWQgdmFsdWUgZm9yIGEgc3ViamVjdCBpbnRlcmVzdC4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnIEV4cGVjdGVkIGEgc3RyaW5nLCBnb3QgJywgc3ViamVjdEludGVyZXN0c1tpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignRXJyb3I6IHJlY2VpdmVkIGJhZCB2YWx1ZSBmb3IgYSBzdWJqZWN0IGludGVyZXN0LicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3I6IHJlY2VpdmVkIGJhZCB2YWx1ZSBmb3Igc3ViamVjdCBpbnRlcmVzdHMuIEV4cGVjdGVkJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgbGlzdCBvZiBzdHJpbmdzLCBnb3QgJywgc3ViamVjdEludGVyZXN0cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0Vycm9yOiByZWNlaXZlZCBiYWQgdmFsdWUgZm9yIHN1YmplY3QgaW50ZXJlc3RzLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLm9uU3ViamVjdEludGVyZXN0c1NlbGVjdGlvbkNoYW5nZSA9IGZ1bmN0aW9uIChzdWJqZWN0SW50ZXJlc3RzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmNsZWFyV2FybmluZ3MoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc3ViamVjdEludGVyZXN0c0NoYW5nZWRBdExlYXN0T25jZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnN1YmplY3RJbnRlcmVzdHNXYXJuaW5nVGV4dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnVwZGF0ZVN1YmplY3RJbnRlcmVzdHNXYXJuaW5nKHN1YmplY3RJbnRlcmVzdHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN0cmwuc3ViamVjdEludGVyZXN0c1dhcm5pbmdUZXh0ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3NhdmVEYXRhSXRlbSgnc3ViamVjdF9pbnRlcmVzdHMnLCBzdWJqZWN0SW50ZXJlc3RzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zYXZlUHJlZmVycmVkU2l0ZUxhbmd1YWdlQ29kZXMgPSBmdW5jdGlvbiAocHJlZmVycmVkU2l0ZUxhbmd1YWdlQ29kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHRyYW5zbGF0ZS51c2UocHJlZmVycmVkU2l0ZUxhbmd1YWdlQ29kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBfZm9yY2VTZWxlY3QyUmVmcmVzaCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgX3NhdmVEYXRhSXRlbSgncHJlZmVycmVkX3NpdGVfbGFuZ3VhZ2VfY29kZScsIHByZWZlcnJlZFNpdGVMYW5ndWFnZUNvZGUpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNhdmVQcmVmZXJyZWRBdWRpb0xhbmd1YWdlQ29kZSA9IGZ1bmN0aW9uIChwcmVmZXJyZWRBdWRpb0xhbmd1YWdlQ29kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3NhdmVEYXRhSXRlbSgncHJlZmVycmVkX2F1ZGlvX2xhbmd1YWdlX2NvZGUnLCBwcmVmZXJyZWRBdWRpb0xhbmd1YWdlQ29kZSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2hvd1VzZXJuYW1lUG9wb3ZlciA9IGZ1bmN0aW9uIChjcmVhdG9yVXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBwb3BvdmVyIG9uIHRoZSBzdWJzY3JpcHRpb24gY2FyZCBpcyBvbmx5IHNob3duIGlmIHRoZSBsZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9mIHRoZSBjcmVhdG9yIHVzZXJuYW1lIGlzIGdyZWF0ZXIgdGhhbiAxMCBhbmQgdGhlIHVzZXIgaG92ZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBvdmVyIHRoZSB0cnVuY2F0ZWQgdXNlcm5hbWUuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3JlYXRvclVzZXJuYW1lLmxlbmd0aCA+IDEwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdtb3VzZWVudGVyJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnbm9uZSc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2F2ZUVtYWlsUHJlZmVyZW5jZXMgPSBmdW5jdGlvbiAoY2FuUmVjZWl2ZUVtYWlsVXBkYXRlcywgY2FuUmVjZWl2ZUVkaXRvclJvbGVFbWFpbCwgY2FuUmVjZWl2ZUZlZWRiYWNrTWVzc2FnZUVtYWlsLCBjYW5SZWNlaXZlU3Vic2NyaXB0aW9uRW1haWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbl9yZWNlaXZlX2VtYWlsX3VwZGF0ZXM6IGNhblJlY2VpdmVFbWFpbFVwZGF0ZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuX3JlY2VpdmVfZWRpdG9yX3JvbGVfZW1haWw6IGNhblJlY2VpdmVFZGl0b3JSb2xlRW1haWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuX3JlY2VpdmVfZmVlZGJhY2tfbWVzc2FnZV9lbWFpbDogKGNhblJlY2VpdmVGZWVkYmFja01lc3NhZ2VFbWFpbCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuX3JlY2VpdmVfc3Vic2NyaXB0aW9uX2VtYWlsOiBjYW5SZWNlaXZlU3Vic2NyaXB0aW9uRW1haWxcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBfc2F2ZURhdGFJdGVtKCdlbWFpbF9wcmVmZXJlbmNlcycsIGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNhdmVQcmVmZXJyZWRMYW5ndWFnZUNvZGVzID0gZnVuY3Rpb24gKHByZWZlcnJlZExhbmd1YWdlQ29kZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9zYXZlRGF0YUl0ZW0oJ3ByZWZlcnJlZF9sYW5ndWFnZV9jb2RlcycsIHByZWZlcnJlZExhbmd1YWdlQ29kZXMpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNhdmVEZWZhdWx0RGFzaGJvYXJkID0gZnVuY3Rpb24gKGRlZmF1bHREYXNoYm9hcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9zYXZlRGF0YUl0ZW0oJ2RlZmF1bHRfZGFzaGJvYXJkJywgZGVmYXVsdERhc2hib2FyZCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2hvd0VkaXRQcm9maWxlUGljdHVyZU1vZGFsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL3ByZWZlcmVuY2VzLXBhZ2UvbW9kYWwtdGVtcGxhdGVzLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZWRpdC1wcm9maWxlLXBpY3R1cmUtbW9kYWwuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJHVpYk1vZGFsSW5zdGFuY2UnLCBmdW5jdGlvbiAoJHNjb3BlLCAkdWliTW9kYWxJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnVwbG9hZGVkSW1hZ2UgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNyb3BwZWRJbWFnZURhdGFVcmwgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pbnZhbGlkSW1hZ2VXYXJuaW5nSXNTaG93biA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm9uRmlsZUNoYW5nZWQgPSBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJy5vcHBpYS1wcm9maWxlLWltYWdlLXVwbG9hZGVyJykuZmFkZU91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pbnZhbGlkSW1hZ2VXYXJuaW5nSXNTaG93biA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUudXBsb2FkZWRJbWFnZSA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnLm9wcGlhLXByb2ZpbGUtaW1hZ2UtdXBsb2FkZXInKS5mYWRlSW4oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnVwbG9hZGVkSW1hZ2UgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jcm9wcGVkSW1hZ2VEYXRhVXJsID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm9uSW52YWxpZEltYWdlTG9hZGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS51cGxvYWRlZEltYWdlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY3JvcHBlZEltYWdlRGF0YVVybCA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pbnZhbGlkSW1hZ2VXYXJuaW5nSXNTaG93biA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpcm0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuY2xvc2UoJHNjb3BlLmNyb3BwZWRJbWFnZURhdGFVcmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkucmVzdWx0LnRoZW4oZnVuY3Rpb24gKG5ld1Byb2ZpbGVQaWN0dXJlRGF0YVVybCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFVzZXJTZXJ2aWNlLnNldFByb2ZpbGVJbWFnZURhdGFVcmxBc3luYyhuZXdQcm9maWxlUGljdHVyZURhdGFVcmwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIHJlbG9hZCBpcyBuZWVkZWQgaW4gb3JkZXIgdG8gdXBkYXRlIHRoZSBwcm9maWxlIHBpY3R1cmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW4gdGhlIHRvcC1yaWdodCBjb3JuZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5MQU5HVUFHRV9DSE9JQ0VTID0gTGFuZ3VhZ2VVdGlsU2VydmljZS5nZXRMYW5ndWFnZUlkc0FuZFRleHRzKCk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuU0lURV9MQU5HVUFHRV9DSE9JQ0VTID0gU1VQUE9SVEVEX1NJVEVfTEFOR1VBR0VTO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLkFVRElPX0xBTkdVQUdFX0NIT0lDRVMgPSBTVVBQT1JURURfQVVESU9fTEFOR1VBR0VTLm1hcChmdW5jdGlvbiAobGFuZ3VhZ2VJdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBsYW5ndWFnZUl0ZW0uaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogbGFuZ3VhZ2VJdGVtLmRlc2NyaXB0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIHByZWZlcmVuY2VzIHBhZ2UuXG4gKi9cbnJlcXVpcmUoXCJjb3JlLWpzL2VzNy9yZWZsZWN0XCIpO1xucmVxdWlyZShcInpvbmUuanNcIik7XG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgcGxhdGZvcm1fYnJvd3Nlcl8xID0gcmVxdWlyZShcIkBhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXJcIik7XG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgaHR0cF8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvbW1vbi9odHRwXCIpO1xuLy8gVGhpcyBjb21wb25lbnQgaXMgbmVlZGVkIHRvIGZvcmNlLWJvb3RzdHJhcCBBbmd1bGFyIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlXG4vLyBhcHAuXG52YXIgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50KCkge1xuICAgIH1cbiAgICBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50ID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5Db21wb25lbnQoe1xuICAgICAgICAgICAgc2VsZWN0b3I6ICdzZXJ2aWNlLWJvb3RzdHJhcCcsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogJydcbiAgICAgICAgfSlcbiAgICBdLCBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50KTtcbiAgICByZXR1cm4gU2VydmljZUJvb3RzdHJhcENvbXBvbmVudDtcbn0oKSk7XG5leHBvcnRzLlNlcnZpY2VCb290c3RyYXBDb21wb25lbnQgPSBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50O1xudmFyIGFwcF9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJhcHAuY29uc3RhbnRzXCIpO1xudmFyIGludGVyYWN0aW9uc19leHRlbnNpb25fY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiaW50ZXJhY3Rpb25zL2ludGVyYWN0aW9ucy1leHRlbnNpb24uY29uc3RhbnRzXCIpO1xudmFyIG9iamVjdHNfZG9tYWluX2NvbnN0YW50c18xID0gcmVxdWlyZShcImRvbWFpbi9vYmplY3RzL29iamVjdHMtZG9tYWluLmNvbnN0YW50c1wiKTtcbnZhciBQcmVmZXJlbmNlc1BhZ2VNb2R1bGUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUHJlZmVyZW5jZXNQYWdlTW9kdWxlKCkge1xuICAgIH1cbiAgICAvLyBFbXB0eSBwbGFjZWhvbGRlciBtZXRob2QgdG8gc2F0aXNmeSB0aGUgYENvbXBpbGVyYC5cbiAgICBQcmVmZXJlbmNlc1BhZ2VNb2R1bGUucHJvdG90eXBlLm5nRG9Cb290c3RyYXAgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgUHJlZmVyZW5jZXNQYWdlTW9kdWxlID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5OZ01vZHVsZSh7XG4gICAgICAgICAgICBpbXBvcnRzOiBbXG4gICAgICAgICAgICAgICAgcGxhdGZvcm1fYnJvd3Nlcl8xLkJyb3dzZXJNb2R1bGUsXG4gICAgICAgICAgICAgICAgaHR0cF8xLkh0dHBDbGllbnRNb2R1bGVcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBkZWNsYXJhdGlvbnM6IFtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgZW50cnlDb21wb25lbnRzOiBbXG4gICAgICAgICAgICAgICAgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHByb3ZpZGVyczogW1xuICAgICAgICAgICAgICAgIGFwcF9jb25zdGFudHNfMS5BcHBDb25zdGFudHMsXG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb25zX2V4dGVuc2lvbl9jb25zdGFudHNfMS5JbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzLFxuICAgICAgICAgICAgICAgIG9iamVjdHNfZG9tYWluX2NvbnN0YW50c18xLk9iamVjdHNEb21haW5Db25zdGFudHMsXG4gICAgICAgICAgICBdXG4gICAgICAgIH0pXG4gICAgXSwgUHJlZmVyZW5jZXNQYWdlTW9kdWxlKTtcbiAgICByZXR1cm4gUHJlZmVyZW5jZXNQYWdlTW9kdWxlO1xufSgpKTtcbnZhciBwbGF0Zm9ybV9icm93c2VyX2R5bmFtaWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyLWR5bmFtaWNcIik7XG52YXIgc3RhdGljXzIgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgYm9vdHN0cmFwRm4gPSBmdW5jdGlvbiAoZXh0cmFQcm92aWRlcnMpIHtcbiAgICB2YXIgcGxhdGZvcm1SZWYgPSBwbGF0Zm9ybV9icm93c2VyX2R5bmFtaWNfMS5wbGF0Zm9ybUJyb3dzZXJEeW5hbWljKGV4dHJhUHJvdmlkZXJzKTtcbiAgICByZXR1cm4gcGxhdGZvcm1SZWYuYm9vdHN0cmFwTW9kdWxlKFByZWZlcmVuY2VzUGFnZU1vZHVsZSk7XG59O1xudmFyIGRvd25ncmFkZWRNb2R1bGUgPSBzdGF0aWNfMi5kb3duZ3JhZGVNb2R1bGUoYm9vdHN0cmFwRm4pO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJywgW1xuICAgICdkbmRMaXN0cycsICdoZWFkcm9vbScsICdpbmZpbml0ZS1zY3JvbGwnLCAnbmdBbmltYXRlJyxcbiAgICAnbmdBdWRpbycsICduZ0Nvb2tpZXMnLCAnbmdJbWdDcm9wJywgJ25nSm95UmlkZScsICduZ01hdGVyaWFsJyxcbiAgICAnbmdSZXNvdXJjZScsICduZ1Nhbml0aXplJywgJ25nVG91Y2gnLCAncGFzY2FscHJlY2h0LnRyYW5zbGF0ZScsXG4gICAgJ3RvYXN0cicsICd1aS5ib290c3RyYXAnLCAndWkuc29ydGFibGUnLCAndWkudHJlZScsICd1aS52YWxpZGF0ZScsXG4gICAgZG93bmdyYWRlZE1vZHVsZVxuXSlcbiAgICAvLyBUaGlzIGRpcmVjdGl2ZSBpcyB0aGUgZG93bmdyYWRlZCB2ZXJzaW9uIG9mIHRoZSBBbmd1bGFyIGNvbXBvbmVudCB0b1xuICAgIC8vIGJvb3RzdHJhcCB0aGUgQW5ndWxhciA4LlxuICAgIC5kaXJlY3RpdmUoJ3NlcnZpY2VCb290c3RyYXAnLCBzdGF0aWNfMS5kb3duZ3JhZGVDb21wb25lbnQoe1xuICAgIGNvbXBvbmVudDogU2VydmljZUJvb3RzdHJhcENvbXBvbmVudFxufSkpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTY3JpcHRzIGZvciB0aGUgT3BwaWEgJ2VkaXQgcHJlZmVyZW5jZXMnIHBhZ2UuXG4gKi9cbi8vIFRoZSBtb2R1bGUgbmVlZHMgdG8gYmUgbG9hZGVkIGJlZm9yZSBldmVyeXRoaW5nIGVsc2Ugc2luY2UgaXQgZGVmaW5lcyB0aGVcbi8vIG1haW4gbW9kdWxlIHRoZSBlbGVtZW50cyBhcmUgYXR0YWNoZWQgdG8uXG5yZXF1aXJlKCdwYWdlcy9wcmVmZXJlbmNlcy1wYWdlL3ByZWZlcmVuY2VzLXBhZ2UubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdBcHAudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL09wcGlhRm9vdGVyRGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9wcmVmZXJlbmNlcy1wYWdlL3ByZWZlcmVuY2VzLXBhZ2UuY29udHJvbGxlci50cycpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBDb25zdGFudHMgZm9yIGludGVyYWN0aW9ucyBleHRlbnNpb25zLlxuICovXG52YXIgSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cyA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzKCkge1xuICAgIH1cbiAgICAvLyBNaW5pbXVtIGNvbmZpZGVuY2UgcmVxdWlyZWQgZm9yIGEgcHJlZGljdGVkIGFuc3dlciBncm91cCB0byBiZSBzaG93biB0b1xuICAgIC8vIHVzZXIuIEdlbmVyYWxseSBhIHRocmVzaG9sZCBvZiAwLjctMC44IGlzIGFzc3VtZWQgdG8gYmUgYSBnb29kIG9uZSBpblxuICAgIC8vIHByYWN0aWNlLCBob3dldmVyIHZhbHVlIG5lZWQgbm90IGJlIGluIHRob3NlIGJvdW5kcy5cbiAgICBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzLkNPREVfUkVQTF9QUkVESUNUSU9OX1NFUlZJQ0VfVEhSRVNIT0xEID0gMC43O1xuICAgIEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMuR1JBUEhfSU5QVVRfTEVGVF9NQVJHSU4gPSAxMjA7XG4gICAgLy8gR2l2ZXMgdGhlIHN0YWZmLWxpbmVzIGh1bWFuIHJlYWRhYmxlIHZhbHVlcy5cbiAgICBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzLk5PVEVfTkFNRVNfVE9fTUlESV9WQUxVRVMgPSB7XG4gICAgICAgIEE1OiA4MSxcbiAgICAgICAgRzU6IDc5LFxuICAgICAgICBGNTogNzcsXG4gICAgICAgIEU1OiA3NixcbiAgICAgICAgRDU6IDc0LFxuICAgICAgICBDNTogNzIsXG4gICAgICAgIEI0OiA3MSxcbiAgICAgICAgQTQ6IDY5LFxuICAgICAgICBHNDogNjcsXG4gICAgICAgIEY0OiA2NSxcbiAgICAgICAgRTQ6IDY0LFxuICAgICAgICBENDogNjIsXG4gICAgICAgIEM0OiA2MFxuICAgIH07XG4gICAgLy8gTWluaW11bSBjb25maWRlbmNlIHJlcXVpcmVkIGZvciBhIHByZWRpY3RlZCBhbnN3ZXIgZ3JvdXAgdG8gYmUgc2hvd24gdG9cbiAgICAvLyB1c2VyLiBHZW5lcmFsbHkgYSB0aHJlc2hvbGQgb2YgMC43LTAuOCBpcyBhc3N1bWVkIHRvIGJlIGEgZ29vZCBvbmUgaW5cbiAgICAvLyBwcmFjdGljZSwgaG93ZXZlciB2YWx1ZSBuZWVkIG5vdCBiZSBpbiB0aG9zZSBib3VuZHMuXG4gICAgSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cy5URVhUX0lOUFVUX1BSRURJQ1RJT05fU0VSVklDRV9USFJFU0hPTEQgPSAwLjc7XG4gICAgcmV0dXJuIEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHM7XG59KCkpO1xuZXhwb3J0cy5JbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzID0gSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cztcbiJdLCJzb3VyY2VSb290IjoiIn0=