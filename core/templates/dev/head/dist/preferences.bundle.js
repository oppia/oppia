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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/preferences-page/preferences-page.controller.ts","about~admin~app~collection_editor~collection_player~contact~creator_dashboard~donate~email_dashboard~c1e50cc0"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./core/templates/dev/head/components/common-layout-directives/background-banner/background-banner.directive.ts":
/*!**********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/background-banner/background-banner.directive.ts ***!
  \**********************************************************************************************************************/
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
angular.module('backgroundBannerModule').directive('backgroundBanner', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/common-layout-directives/background-banner/' +
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

/***/ "./core/templates/dev/head/components/forms/forms-directives/image-uploader/image-uploader.directive.ts":
/*!**************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-directives/image-uploader/image-uploader.directive.ts ***!
  \**************************************************************************************************************/
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
angular.module('imageUploaderModule').directive('imageUploader', [
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
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/image_uploader_directive.html'),
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

/***/ "./core/templates/dev/head/components/forms/forms-directives/select2-dropdown/select2-dropdown.directive.ts":
/*!******************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-directives/select2-dropdown/select2-dropdown.directive.ts ***!
  \******************************************************************************************************************/
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
angular.module('select2DropdownModule').directive('select2Dropdown', [
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
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/forms-directives/select2-dropdown/' +
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

/***/ "./core/templates/dev/head/domain/utilities/AudioLanguageObjectFactory.ts":
/*!********************************************************************************!*\
  !*** ./core/templates/dev/head/domain/utilities/AudioLanguageObjectFactory.ts ***!
  \********************************************************************************/
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
/**
 * @fileoverview Object factory for creating audio languages.
 */
oppia.factory('AudioLanguageObjectFactory', [
    function () {
        var AudioLanguage = function (id, description, relatedLanguages) {
            this.id = id;
            this.description = description;
            this.relatedLanguages = relatedLanguages;
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        AudioLanguage['createFromDict'] = function (audioLanguageDict) {
            /* eslint-enable dot-notation */
            return new AudioLanguage(audioLanguageDict.id, audioLanguageDict.description, audioLanguageDict.related_languages);
        };
        return AudioLanguage;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/utilities/AutogeneratedAudioLanguageObjectFactory.ts":
/*!*********************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/utilities/AutogeneratedAudioLanguageObjectFactory.ts ***!
  \*********************************************************************************************/
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
/**
 * @fileoverview Object factory for creating autogenerated audio languages.
 */
oppia.factory('AutogeneratedAudioLanguageObjectFactory', [
    function () {
        var AutogeneratedAudioLanguage = function (id, description, explorationLanguage, speechSynthesisCode, speechSynthesisCodeMobile) {
            this.id = id;
            this.description = description;
            this.explorationLanguage = explorationLanguage;
            this.speechSynthesisCode = speechSynthesisCode;
            this.speechSynthesisCodeMobile = speechSynthesisCodeMobile;
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        AutogeneratedAudioLanguage['createFromDict'] = (
        /* eslint-enable dot-notation */
        function (autogeneratedAudioLanguageDict) {
            return new AutogeneratedAudioLanguage(autogeneratedAudioLanguageDict.id, autogeneratedAudioLanguageDict.description, autogeneratedAudioLanguageDict.exploration_language, autogeneratedAudioLanguageDict.speech_synthesis_code, autogeneratedAudioLanguageDict.speech_synthesis_code_mobile);
        });
        return AutogeneratedAudioLanguage;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/utilities/BrowserCheckerService.ts":
/*!***************************************************************************!*\
  !*** ./core/templates/dev/head/domain/utilities/BrowserCheckerService.ts ***!
  \***************************************************************************/
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
/**
 * @fileoverview Utility service for checking web browser type.
 */
oppia.factory('BrowserCheckerService', [
    'AUTOGENERATED_AUDIO_LANGUAGES',
    function (AUTOGENERATED_AUDIO_LANGUAGES) {
        // For details on the reliability of this check, see
        // https://stackoverflow.com/questions/9847580/
        // how-to-detect-safari-chrome-ie-firefox-and-opera-browser#answer-9851769
        var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) {
            return p.toString() === '[object SafariRemoteNotification]';
        })(!window.safari ||
            (typeof window.safari !== 'undefined' && window.safari.pushNotification));
        var _supportsSpeechSynthesis = function () {
            var supportLang = false;
            if (window.hasOwnProperty('speechSynthesis')) {
                speechSynthesis.getVoices().forEach(function (voice) {
                    AUTOGENERATED_AUDIO_LANGUAGES.forEach(function (audioLanguage) {
                        if (voice.lang === audioLanguage.speech_synthesis_code ||
                            (_isMobileDevice() &&
                                voice.lang === audioLanguage.speech_synthesis_code_mobile)) {
                            supportLang = true;
                        }
                    });
                });
            }
            return supportLang;
        };
        var _isMobileDevice = function () {
            var userAgent = navigator.userAgent || navigator.vendor || window.opera;
            return userAgent.match(/iPhone/i) || userAgent.match(/Android/i);
        };
        return {
            supportsSpeechSynthesis: function () {
                return _supportsSpeechSynthesis();
            },
            isMobileDevice: function () {
                return _isMobileDevice();
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/utilities/LanguageUtilService.ts":
/*!*************************************************************************!*\
  !*** ./core/templates/dev/head/domain/utilities/LanguageUtilService.ts ***!
  \*************************************************************************/
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
 * @fileoverview Utility service for language operations.
 */
__webpack_require__(/*! domain/utilities/AudioLanguageObjectFactory.ts */ "./core/templates/dev/head/domain/utilities/AudioLanguageObjectFactory.ts");
__webpack_require__(/*! domain/utilities/AutogeneratedAudioLanguageObjectFactory.ts */ "./core/templates/dev/head/domain/utilities/AutogeneratedAudioLanguageObjectFactory.ts");
__webpack_require__(/*! domain/utilities/BrowserCheckerService.ts */ "./core/templates/dev/head/domain/utilities/BrowserCheckerService.ts");
oppia.factory('LanguageUtilService', [
    'AudioLanguageObjectFactory', 'AutogeneratedAudioLanguageObjectFactory',
    'BrowserCheckerService', 'ALL_LANGUAGE_CODES',
    'AUTOGENERATED_AUDIO_LANGUAGES', 'SUPPORTED_AUDIO_LANGUAGES',
    function (AudioLanguageObjectFactory, AutogeneratedAudioLanguageObjectFactory, BrowserCheckerService, ALL_LANGUAGE_CODES, AUTOGENERATED_AUDIO_LANGUAGES, SUPPORTED_AUDIO_LANGUAGES) {
        var supportedAudioLanguageList = SUPPORTED_AUDIO_LANGUAGES;
        var autogeneratedAudioLanguageList = AUTOGENERATED_AUDIO_LANGUAGES;
        var supportedAudioLanguages = {};
        var autogeneratedAudioLanguagesByExplorationLanguageCode = {};
        var autogeneratedAudioLanguagesByAutogeneratedLanguageCode = {};
        var getShortLanguageDescription = function (fullLanguageDescription) {
            var ind = fullLanguageDescription.indexOf(' (');
            if (ind === -1) {
                return fullLanguageDescription;
            }
            else {
                return fullLanguageDescription.substring(0, ind);
            }
        };
        var languageIdsAndTexts = ALL_LANGUAGE_CODES.map(function (languageItem) {
            return {
                id: languageItem.code,
                text: getShortLanguageDescription(languageItem.description)
            };
        });
        var allAudioLanguageCodes = (supportedAudioLanguageList.map(function (audioLanguage) {
            return audioLanguage.id;
        }));
        supportedAudioLanguageList.forEach(function (audioLanguageDict) {
            supportedAudioLanguages[audioLanguageDict.id] =
                AudioLanguageObjectFactory.createFromDict(audioLanguageDict);
        });
        autogeneratedAudioLanguageList.forEach(function (autogeneratedAudioLanguageDict) {
            var autogeneratedAudioLanguage = AutogeneratedAudioLanguageObjectFactory.createFromDict(autogeneratedAudioLanguageDict);
            autogeneratedAudioLanguagesByExplorationLanguageCode[autogeneratedAudioLanguage.explorationLanguage] =
                autogeneratedAudioLanguage;
            autogeneratedAudioLanguagesByAutogeneratedLanguageCode[autogeneratedAudioLanguage.id] =
                autogeneratedAudioLanguage;
        });
        var audioLanguagesCount = allAudioLanguageCodes.length;
        return {
            getLanguageIdsAndTexts: function () {
                return languageIdsAndTexts;
            },
            getAudioLanguagesCount: function () {
                return audioLanguagesCount;
            },
            getAllVoiceoverLanguageCodes: function () {
                return angular.copy(allAudioLanguageCodes);
            },
            getAudioLanguageDescription: function (audioLanguageCode) {
                return supportedAudioLanguages[audioLanguageCode].description;
            },
            // Given a list of audio language codes, returns the complement list, i.e.
            // the list of audio language codes not in the input list.
            getComplementAudioLanguageCodes: function (audioLanguageCodes) {
                return allAudioLanguageCodes.filter(function (languageCode) {
                    return audioLanguageCodes.indexOf(languageCode) === -1;
                });
            },
            getLanguageCodesRelatedToAudioLanguageCode: function (audioLanguageCode) {
                return supportedAudioLanguages[audioLanguageCode].relatedLanguages;
            },
            supportsAutogeneratedAudio: function (explorationLanguageCode) {
                return (BrowserCheckerService.supportsSpeechSynthesis() &&
                    autogeneratedAudioLanguagesByExplorationLanguageCode
                        .hasOwnProperty(explorationLanguageCode));
            },
            isAutogeneratedAudioLanguage: function (audioLanguageCode) {
                return autogeneratedAudioLanguagesByAutogeneratedLanguageCode
                    .hasOwnProperty(audioLanguageCode);
            },
            getAutogeneratedAudioLanguage: function (explorationLanguageCode) {
                return autogeneratedAudioLanguagesByExplorationLanguageCode[explorationLanguageCode];
            }
        };
    }
]);


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
angular.module('stringUtilityFiltersModule').filter('convertToPlainText', [function () {
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
    }
]);


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
angular.module('stringUtilityFiltersModule').filter('truncate', ['$filter', function ($filter) {
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
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/preferences-page/preferences-page.controller.ts":
/*!***************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/preferences-page/preferences-page.controller.ts ***!
  \***************************************************************************************/
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
 * @fileoverview Data and controllers for the Oppia 'edit preferences' page.
 */
__webpack_require__(/*! components/forms/forms-directives/select2-dropdown/select2-dropdown.directive.ts */ "./core/templates/dev/head/components/forms/forms-directives/select2-dropdown/select2-dropdown.directive.ts");
__webpack_require__(/*! components/forms/forms-directives/image-uploader/image-uploader.directive.ts */ "./core/templates/dev/head/components/forms/forms-directives/image-uploader/image-uploader.directive.ts");
__webpack_require__(/*! components/common-layout-directives/background-banner/background-banner.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/background-banner/background-banner.directive.ts");
__webpack_require__(/*! filters/string-utility-filters/truncate.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/truncate.filter.ts");
__webpack_require__(/*! domain/utilities/LanguageUtilService.ts */ "./core/templates/dev/head/domain/utilities/LanguageUtilService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
__webpack_require__(/*! services/UtilsService.ts */ "./core/templates/dev/head/services/UtilsService.ts");
angular.module('preferencesPageModule').controller('Preferences', [
    '$http', '$q', '$rootScope', '$scope', '$timeout', '$translate', '$uibModal',
    'AlertsService', 'LanguageUtilService', 'UrlInterpolationService',
    'UserService', 'UtilsService', 'DASHBOARD_TYPE_CREATOR',
    'DASHBOARD_TYPE_LEARNER', 'SUPPORTED_AUDIO_LANGUAGES',
    'SUPPORTED_SITE_LANGUAGES',
    function ($http, $q, $rootScope, $scope, $timeout, $translate, $uibModal, AlertsService, LanguageUtilService, UrlInterpolationService, UserService, UtilsService, DASHBOARD_TYPE_CREATOR, DASHBOARD_TYPE_LEARNER, SUPPORTED_AUDIO_LANGUAGES, SUPPORTED_SITE_LANGUAGES) {
        var _PREFERENCES_DATA_URL = '/preferenceshandler/data';
        $scope.profilePictureDataUrl = '';
        $scope.DASHBOARD_TYPE_CREATOR = DASHBOARD_TYPE_CREATOR;
        $scope.DASHBOARD_TYPE_LEARNER = DASHBOARD_TYPE_LEARNER;
        $scope.username = '';
        $rootScope.loadingMessage = 'Loading';
        var userInfoPromise = UserService.getUserInfoAsync();
        userInfoPromise.then(function (userInfo) {
            $scope.username = userInfo.getUsername();
        });
        $scope.hasPageLoaded = false;
        var preferencesPromise = $http.get(_PREFERENCES_DATA_URL);
        preferencesPromise.then(function (response) {
            var data = response.data;
            $scope.userBio = data.user_bio;
            $scope.subjectInterests = data.subject_interests;
            $scope.preferredLanguageCodes = data.preferred_language_codes;
            $scope.profilePictureDataUrl = data.profile_picture_data_url;
            $scope.defaultDashboard = data.default_dashboard;
            $scope.canReceiveEmailUpdates = data.can_receive_email_updates;
            $scope.canReceiveEditorRoleEmail = data.can_receive_editor_role_email;
            $scope.canReceiveSubscriptionEmail = data.can_receive_subscription_email;
            $scope.canReceiveFeedbackMessageEmail = (data.can_receive_feedback_message_email);
            $scope.preferredSiteLanguageCode = data.preferred_site_language_code;
            $scope.preferredAudioLanguageCode = data.preferred_audio_language_code;
            $scope.subscriptionList = data.subscription_list;
            $scope.hasPageLoaded = true;
            _forceSelect2Refresh();
        });
        $q.all([userInfoPromise, preferencesPromise]).then(function () {
            $rootScope.loadingMessage = '';
        });
        $scope.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;
        var _saveDataItem = function (updateType, data) {
            $http.put(_PREFERENCES_DATA_URL, {
                update_type: updateType,
                data: data
            });
        };
        // Select2 dropdown cannot automatically refresh its display
        // after being translated.
        // Use $scope.select2DropdownIsShown in its ng-if attribute
        // and this function to force it to reload
        var _forceSelect2Refresh = function () {
            $scope.select2DropdownIsShown = false;
            $timeout(function () {
                $scope.select2DropdownIsShown = true;
            }, 100);
        };
        $scope.saveUserBio = function (userBio) {
            _saveDataItem('user_bio', userBio);
        };
        $scope.subjectInterestsChangedAtLeastOnce = false;
        $scope.subjectInterestsWarningText = null;
        $scope.TAG_REGEX_STRING = '^[a-z ]+$';
        $scope.updateSubjectInterestsWarning = function (subjectInterests) {
            var TAG_REGEX = new RegExp($scope.TAG_REGEX_STRING);
            if (subjectInterests instanceof Array) {
                for (var i = 0; i < subjectInterests.length; i++) {
                    if (UtilsService.isString(subjectInterests[i])) {
                        if (!TAG_REGEX.test(subjectInterests[i])) {
                            $scope.subjectInterestsWarningText = ('Subject interests should use only lowercase letters.');
                        }
                    }
                    else {
                        console.error('Error: received bad value for a subject interest. Expected a ' +
                            'string, got ', subjectInterests[i]);
                        throw Error('Error: received bad value for a subject interest.');
                    }
                }
            }
            else {
                console.error('Error: received bad value for subject interests. Expected list of ' +
                    'strings, got ', subjectInterests);
                throw Error('Error: received bad value for subject interests.');
            }
        };
        $scope.onSubjectInterestsSelectionChange = function (subjectInterests) {
            AlertsService.clearWarnings();
            $scope.subjectInterestsChangedAtLeastOnce = true;
            $scope.subjectInterestsWarningText = null;
            $scope.updateSubjectInterestsWarning(subjectInterests);
            if ($scope.subjectInterestsWarningText === null) {
                _saveDataItem('subject_interests', subjectInterests);
            }
        };
        $scope.savePreferredSiteLanguageCodes = function (preferredSiteLanguageCode) {
            $translate.use(preferredSiteLanguageCode);
            _forceSelect2Refresh();
            _saveDataItem('preferred_site_language_code', preferredSiteLanguageCode);
        };
        $scope.savePreferredAudioLanguageCode = function (preferredAudioLanguageCode) {
            _saveDataItem('preferred_audio_language_code', preferredAudioLanguageCode);
        };
        $scope.showUsernamePopover = function (creatorUsername) {
            // The popover on the subscription card is only shown if the length of
            // the creator username is greater than 10 and the user hovers over
            // the truncated username.
            if (creatorUsername.length > 10) {
                return 'mouseenter';
            }
            else {
                return 'none';
            }
        };
        $scope.saveEmailPreferences = function (canReceiveEmailUpdates, canReceiveEditorRoleEmail, canReceiveFeedbackMessageEmail, canReceiveSubscriptionEmail) {
            var data = {
                can_receive_email_updates: canReceiveEmailUpdates,
                can_receive_editor_role_email: canReceiveEditorRoleEmail,
                can_receive_feedback_message_email: canReceiveFeedbackMessageEmail,
                can_receive_subscription_email: canReceiveSubscriptionEmail
            };
            _saveDataItem('email_preferences', data);
        };
        $scope.savePreferredLanguageCodes = function (preferredLanguageCodes) {
            _saveDataItem('preferred_language_codes', preferredLanguageCodes);
        };
        $scope.saveDefaultDashboard = function (defaultDashboard) {
            _saveDataItem('default_dashboard', defaultDashboard);
        };
        $scope.showEditProfilePictureModal = function () {
            $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/preferences-page/preferences-page-templates/' +
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
                    // The reload is needed in order to update the profile picture in
                    // the top-right corner.
                    location.reload();
                });
            });
        };
        $scope.LANGUAGE_CHOICES = LanguageUtilService.getLanguageIdsAndTexts();
        $scope.SITE_LANGUAGE_CHOICES = SUPPORTED_SITE_LANGUAGES;
        $scope.AUDIO_LANGUAGE_CHOICES = SUPPORTED_AUDIO_LANGUAGES.map(function (languageItem) {
            return {
                id: languageItem.id,
                text: languageItem.description
            };
        });
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/IdGenerationService.ts":
/*!*****************************************************************!*\
  !*** ./core/templates/dev/head/services/IdGenerationService.ts ***!
  \*****************************************************************/
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
 * @fileoverview Service for generating random IDs.
 */
oppia.factory('IdGenerationService', [function () {
        return {
            generateNewId: function () {
                // Generates random string using the last 10 digits of
                // the string for better entropy.
                var randomString = Math.random().toString(36).slice(2);
                while (randomString.length < 10) {
                    randomString = randomString + '0';
                }
                return randomString.slice(-10);
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/services/UserService.ts":
/*!*********************************************************!*\
  !*** ./core/templates/dev/head/services/UserService.ts ***!
  \*********************************************************/
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
 * @fileoverview Service for user data.
 */
oppia.factory('UserService', [
    '$http', '$q', '$window', 'UrlInterpolationService', 'UserInfoObjectFactory',
    'DEFAULT_PROFILE_IMAGE_PATH',
    function ($http, $q, $window, UrlInterpolationService, UserInfoObjectFactory, DEFAULT_PROFILE_IMAGE_PATH) {
        var PREFERENCES_DATA_URL = '/preferenceshandler/data';
        var userInfo = null;
        var getUserInfoAsync = function () {
            if (GLOBALS.userIsLoggedIn) {
                if (userInfo) {
                    return $q.resolve(userInfo);
                }
                return $http.get('/userinfohandler').then(function (response) {
                    userInfo = UserInfoObjectFactory.createFromBackendDict(response.data);
                    return userInfo;
                });
            }
            else {
                return $q.resolve(UserInfoObjectFactory.createDefault());
            }
        };
        return {
            getProfileImageDataUrlAsync: function () {
                var profilePictureDataUrl = (UrlInterpolationService.getStaticImageUrl(DEFAULT_PROFILE_IMAGE_PATH));
                if (GLOBALS.userIsLoggedIn) {
                    return $http.get('/preferenceshandler/profile_picture').then(function (response) {
                        if (response.data.profile_picture_data_url) {
                            profilePictureDataUrl = response.data.profile_picture_data_url;
                        }
                        return profilePictureDataUrl;
                    });
                }
                else {
                    return $q.resolve(profilePictureDataUrl);
                }
            },
            setProfileImageDataUrlAsync: function (newProfileImageDataUrl) {
                return $http.put(PREFERENCES_DATA_URL, {
                    update_type: 'profile_picture_data_url',
                    data: newProfileImageDataUrl
                });
            },
            getLoginUrlAsync: function () {
                var urlParameters = {
                    current_url: $window.location.href
                };
                return $http.get('/url_handler', { params: urlParameters }).then(function (response) {
                    return response.data.login_url;
                });
            },
            getUserInfoAsync: getUserInfoAsync
        };
    }
]);


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvYmFja2dyb3VuZC1iYW5uZXIvYmFja2dyb3VuZC1iYW5uZXIuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtZGlyZWN0aXZlcy9pbWFnZS11cGxvYWRlci9pbWFnZS11cGxvYWRlci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1kaXJlY3RpdmVzL3NlbGVjdDItZHJvcGRvd24vc2VsZWN0Mi1kcm9wZG93bi5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3V0aWxpdGllcy9BdWRpb0xhbmd1YWdlT2JqZWN0RmFjdG9yeS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vdXRpbGl0aWVzL0F1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlT2JqZWN0RmFjdG9yeS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vdXRpbGl0aWVzL0Jyb3dzZXJDaGVja2VyU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vdXRpbGl0aWVzL0xhbmd1YWdlVXRpbFNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL2NvbnZlcnQtdG8tcGxhaW4tdGV4dC5maWx0ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL3RydW5jYXRlLmZpbHRlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9wcmVmZXJlbmNlcy1wYWdlL3ByZWZlcmVuY2VzLXBhZ2UuY29udHJvbGxlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9JZEdlbmVyYXRpb25TZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL1VzZXJTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGdCQUFRLG9CQUFvQjtBQUM1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUFpQiw0QkFBNEI7QUFDN0M7QUFDQTtBQUNBLDBCQUFrQiwyQkFBMkI7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0Esa0RBQTBDLGdDQUFnQztBQUMxRTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGdFQUF3RCxrQkFBa0I7QUFDMUU7QUFDQSx5REFBaUQsY0FBYztBQUMvRDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaURBQXlDLGlDQUFpQztBQUMxRSx3SEFBZ0gsbUJBQW1CLEVBQUU7QUFDckk7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBMkIsMEJBQTBCLEVBQUU7QUFDdkQseUNBQWlDLGVBQWU7QUFDaEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0EsOERBQXNELCtEQUErRDs7QUFFckg7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUFnQix1QkFBdUI7QUFDdkM7OztBQUdBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUN0SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQixnQ0FBZ0M7QUFDaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JELG1CQUFPLENBQUMsa0dBQWlDO0FBQ3pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDbEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0IseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQixpQkFBaUI7QUFDakI7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsZ0lBQWdEO0FBQ3hELG1CQUFPLENBQUMsMEpBQTZEO0FBQ3JFLG1CQUFPLENBQUMsc0hBQTJDO0FBQ25EO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1REFBdUQ7QUFDdkQsdURBQXVEO0FBQ3ZEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLGdLQUFnRTtBQUN4RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLG9NQUMyQjtBQUNuQyxtQkFBTyxDQUFDLDRMQUN5QjtBQUNqQyxtQkFBTyxDQUFDLDRNQUM0QjtBQUNwQyxtQkFBTyxDQUFDLHNJQUFtRDtBQUMzRCxtQkFBTyxDQUFDLGtIQUF5QztBQUNqRCxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRCxtQkFBTyxDQUFDLHNGQUEyQjtBQUNuQyxtQkFBTyxDQUFDLGtGQUF5QjtBQUNqQyxtQkFBTyxDQUFDLG9GQUEwQjtBQUNsQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtCQUErQiw2QkFBNkI7QUFDNUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUNBQXFDO0FBQ3JDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUNBQWlDO0FBQ2pDLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBOzs7Ozs7Ozs7Ozs7QUN2TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOzs7Ozs7Ozs7Ozs7QUM1Qkw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0RBQWtELHdCQUF3QjtBQUMxRTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoicHJlZmVyZW5jZXMuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gaW5zdGFsbCBhIEpTT05QIGNhbGxiYWNrIGZvciBjaHVuayBsb2FkaW5nXG4gXHRmdW5jdGlvbiB3ZWJwYWNrSnNvbnBDYWxsYmFjayhkYXRhKSB7XG4gXHRcdHZhciBjaHVua0lkcyA9IGRhdGFbMF07XG4gXHRcdHZhciBtb3JlTW9kdWxlcyA9IGRhdGFbMV07XG4gXHRcdHZhciBleGVjdXRlTW9kdWxlcyA9IGRhdGFbMl07XG5cbiBcdFx0Ly8gYWRkIFwibW9yZU1vZHVsZXNcIiB0byB0aGUgbW9kdWxlcyBvYmplY3QsXG4gXHRcdC8vIHRoZW4gZmxhZyBhbGwgXCJjaHVua0lkc1wiIGFzIGxvYWRlZCBhbmQgZmlyZSBjYWxsYmFja1xuIFx0XHR2YXIgbW9kdWxlSWQsIGNodW5rSWQsIGkgPSAwLCByZXNvbHZlcyA9IFtdO1xuIFx0XHRmb3IoO2kgPCBjaHVua0lkcy5sZW5ndGg7IGkrKykge1xuIFx0XHRcdGNodW5rSWQgPSBjaHVua0lkc1tpXTtcbiBcdFx0XHRpZihpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0pIHtcbiBcdFx0XHRcdHJlc29sdmVzLnB1c2goaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdWzBdKTtcbiBcdFx0XHR9XG4gXHRcdFx0aW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdID0gMDtcbiBcdFx0fVxuIFx0XHRmb3IobW9kdWxlSWQgaW4gbW9yZU1vZHVsZXMpIHtcbiBcdFx0XHRpZihPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobW9yZU1vZHVsZXMsIG1vZHVsZUlkKSkge1xuIFx0XHRcdFx0bW9kdWxlc1ttb2R1bGVJZF0gPSBtb3JlTW9kdWxlc1ttb2R1bGVJZF07XG4gXHRcdFx0fVxuIFx0XHR9XG4gXHRcdGlmKHBhcmVudEpzb25wRnVuY3Rpb24pIHBhcmVudEpzb25wRnVuY3Rpb24oZGF0YSk7XG5cbiBcdFx0d2hpbGUocmVzb2x2ZXMubGVuZ3RoKSB7XG4gXHRcdFx0cmVzb2x2ZXMuc2hpZnQoKSgpO1xuIFx0XHR9XG5cbiBcdFx0Ly8gYWRkIGVudHJ5IG1vZHVsZXMgZnJvbSBsb2FkZWQgY2h1bmsgdG8gZGVmZXJyZWQgbGlzdFxuIFx0XHRkZWZlcnJlZE1vZHVsZXMucHVzaC5hcHBseShkZWZlcnJlZE1vZHVsZXMsIGV4ZWN1dGVNb2R1bGVzIHx8IFtdKTtcblxuIFx0XHQvLyBydW4gZGVmZXJyZWQgbW9kdWxlcyB3aGVuIGFsbCBjaHVua3MgcmVhZHlcbiBcdFx0cmV0dXJuIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCk7XG4gXHR9O1xuIFx0ZnVuY3Rpb24gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKSB7XG4gXHRcdHZhciByZXN1bHQ7XG4gXHRcdGZvcih2YXIgaSA9IDA7IGkgPCBkZWZlcnJlZE1vZHVsZXMubGVuZ3RoOyBpKyspIHtcbiBcdFx0XHR2YXIgZGVmZXJyZWRNb2R1bGUgPSBkZWZlcnJlZE1vZHVsZXNbaV07XG4gXHRcdFx0dmFyIGZ1bGZpbGxlZCA9IHRydWU7XG4gXHRcdFx0Zm9yKHZhciBqID0gMTsgaiA8IGRlZmVycmVkTW9kdWxlLmxlbmd0aDsgaisrKSB7XG4gXHRcdFx0XHR2YXIgZGVwSWQgPSBkZWZlcnJlZE1vZHVsZVtqXTtcbiBcdFx0XHRcdGlmKGluc3RhbGxlZENodW5rc1tkZXBJZF0gIT09IDApIGZ1bGZpbGxlZCA9IGZhbHNlO1xuIFx0XHRcdH1cbiBcdFx0XHRpZihmdWxmaWxsZWQpIHtcbiBcdFx0XHRcdGRlZmVycmVkTW9kdWxlcy5zcGxpY2UoaS0tLCAxKTtcbiBcdFx0XHRcdHJlc3VsdCA9IF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gZGVmZXJyZWRNb2R1bGVbMF0pO1xuIFx0XHRcdH1cbiBcdFx0fVxuIFx0XHRyZXR1cm4gcmVzdWx0O1xuIFx0fVxuXG4gXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBvYmplY3QgdG8gc3RvcmUgbG9hZGVkIGFuZCBsb2FkaW5nIGNodW5rc1xuIFx0Ly8gdW5kZWZpbmVkID0gY2h1bmsgbm90IGxvYWRlZCwgbnVsbCA9IGNodW5rIHByZWxvYWRlZC9wcmVmZXRjaGVkXG4gXHQvLyBQcm9taXNlID0gY2h1bmsgbG9hZGluZywgMCA9IGNodW5rIGxvYWRlZFxuIFx0dmFyIGluc3RhbGxlZENodW5rcyA9IHtcbiBcdFx0XCJwcmVmZXJlbmNlc1wiOiAwXG4gXHR9O1xuXG4gXHR2YXIgZGVmZXJyZWRNb2R1bGVzID0gW107XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGdldHRlciB9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuIFx0XHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbiBcdFx0fVxuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuIFx0fTtcblxuIFx0Ly8gY3JlYXRlIGEgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XG4gXHQvLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbiBcdC8vIG1vZGUgJiAyOiBtZXJnZSBhbGwgcHJvcGVydGllcyBvZiB2YWx1ZSBpbnRvIHRoZSBuc1xuIFx0Ly8gbW9kZSAmIDQ6IHJldHVybiB2YWx1ZSB3aGVuIGFscmVhZHkgbnMgb2JqZWN0XG4gXHQvLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnQgPSBmdW5jdGlvbih2YWx1ZSwgbW9kZSkge1xuIFx0XHRpZihtb2RlICYgMSkgdmFsdWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKHZhbHVlKTtcbiBcdFx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcbiBcdFx0aWYoKG1vZGUgJiA0KSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmIHZhbHVlLl9fZXNNb2R1bGUpIHJldHVybiB2YWx1ZTtcbiBcdFx0dmFyIG5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG5zLCAnZGVmYXVsdCcsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHZhbHVlIH0pO1xuIFx0XHRpZihtb2RlICYgMiAmJiB0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIGZvcih2YXIga2V5IGluIHZhbHVlKSBfX3dlYnBhY2tfcmVxdWlyZV9fLmQobnMsIGtleSwgZnVuY3Rpb24oa2V5KSB7IHJldHVybiB2YWx1ZVtrZXldOyB9LmJpbmQobnVsbCwga2V5KSk7XG4gXHRcdHJldHVybiBucztcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdHZhciBqc29ucEFycmF5ID0gd2luZG93W1wid2VicGFja0pzb25wXCJdID0gd2luZG93W1wid2VicGFja0pzb25wXCJdIHx8IFtdO1xuIFx0dmFyIG9sZEpzb25wRnVuY3Rpb24gPSBqc29ucEFycmF5LnB1c2guYmluZChqc29ucEFycmF5KTtcbiBcdGpzb25wQXJyYXkucHVzaCA9IHdlYnBhY2tKc29ucENhbGxiYWNrO1xuIFx0anNvbnBBcnJheSA9IGpzb25wQXJyYXkuc2xpY2UoKTtcbiBcdGZvcih2YXIgaSA9IDA7IGkgPCBqc29ucEFycmF5Lmxlbmd0aDsgaSsrKSB3ZWJwYWNrSnNvbnBDYWxsYmFjayhqc29ucEFycmF5W2ldKTtcbiBcdHZhciBwYXJlbnRKc29ucEZ1bmN0aW9uID0gb2xkSnNvbnBGdW5jdGlvbjtcblxuXG4gXHQvLyBhZGQgZW50cnkgbW9kdWxlIHRvIGRlZmVycmVkIGxpc3RcbiBcdGRlZmVycmVkTW9kdWxlcy5wdXNoKFtcIi4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvcHJlZmVyZW5jZXMtcGFnZS9wcmVmZXJlbmNlcy1wYWdlLmNvbnRyb2xsZXIudHNcIixcImFib3V0fmFkbWlufmFwcH5jb2xsZWN0aW9uX2VkaXRvcn5jb2xsZWN0aW9uX3BsYXllcn5jb250YWN0fmNyZWF0b3JfZGFzaGJvYXJkfmRvbmF0ZX5lbWFpbF9kYXNoYm9hcmR+YzFlNTBjYzBcIl0pO1xuIFx0Ly8gcnVuIGRlZmVycmVkIG1vZHVsZXMgd2hlbiByZWFkeVxuIFx0cmV0dXJuIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIGJhY2tncm91bmQgYmFubmVyLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnYmFja2dyb3VuZEJhbm5lck1vZHVsZScpLmRpcmVjdGl2ZSgnYmFja2dyb3VuZEJhbm5lcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2JhY2tncm91bmQtYmFubmVyLycgK1xuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWJhbm5lci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcG9zc2libGVCYW5uZXJGaWxlbmFtZXMgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAnYmFubmVyQS5zdmcnLCAnYmFubmVyQi5zdmcnLCAnYmFubmVyQy5zdmcnLCAnYmFubmVyRC5zdmcnXG4gICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgIHZhciBiYW5uZXJJbWFnZUZpbGVuYW1lID0gcG9zc2libGVCYW5uZXJGaWxlbmFtZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcG9zc2libGVCYW5uZXJGaWxlbmFtZXMubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuYmFubmVySW1hZ2VGaWxlVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmwoJy9iYWNrZ3JvdW5kLycgKyBiYW5uZXJJbWFnZUZpbGVuYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdXBsb2FkaW5nIGltYWdlcy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvSWRHZW5lcmF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ2ltYWdlVXBsb2FkZXJNb2R1bGUnKS5kaXJlY3RpdmUoJ2ltYWdlVXBsb2FkZXInLCBbXG4gICAgJ0lkR2VuZXJhdGlvblNlcnZpY2UnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChJZEdlbmVyYXRpb25TZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAnQCcsXG4gICAgICAgICAgICAgICAgb25GaWxlQ2hhbmdlZDogJz0nLFxuICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZTogJ0AnLFxuICAgICAgICAgICAgICAgIHdpZHRoOiAnQCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2Zvcm1zL2ltYWdlX3VwbG9hZGVyX2RpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsdCkge1xuICAgICAgICAgICAgICAgIHZhciBvbkRyYWdFbmQgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICQoJy5pbWFnZS11cGxvYWRlci1kcm9wLWFyZWEnKS5yZW1vdmVDbGFzcygnaW1hZ2UtdXBsb2FkZXItaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB2YXIgdmFsaWRhdGVVcGxvYWRlZEZpbGUgPSBmdW5jdGlvbiAoZmlsZSwgZmlsZW5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmaWxlIHx8ICFmaWxlLnNpemUgfHwgIWZpbGUudHlwZS5tYXRjaCgnaW1hZ2UuKicpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1RoaXMgZmlsZSBpcyBub3QgcmVjb2duaXplZCBhcyBhbiBpbWFnZS4nO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghZmlsZS50eXBlLm1hdGNoKCdpbWFnZS5qcGVnJykgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICFmaWxlLnR5cGUubWF0Y2goJ2ltYWdlLmdpZicpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAhZmlsZS50eXBlLm1hdGNoKCdpbWFnZS5qcGcnKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgIWZpbGUudHlwZS5tYXRjaCgnaW1hZ2UucG5nJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnVGhpcyBpbWFnZSBmb3JtYXQgaXMgbm90IHN1cHBvcnRlZC4nO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICgoZmlsZS50eXBlLm1hdGNoKC9qcChlPylnJC8pICYmICFmaWxlLm5hbWUubWF0Y2goL1xcLmpwKGU/KWckLykpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAoZmlsZS50eXBlLm1hdGNoKC9naWYkLykgJiYgIWZpbGUubmFtZS5tYXRjaCgvXFwuZ2lmJC8pKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKGZpbGUudHlwZS5tYXRjaCgvcG5nJC8pICYmICFmaWxlLm5hbWUubWF0Y2goL1xcLnBuZyQvKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnVGhpcyBpbWFnZSBmb3JtYXQgZG9lcyBub3QgbWF0Y2ggdGhlIGZpbGVuYW1lIGV4dGVuc2lvbi4nO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBPTkVfTUJfSU5fQllURVMgPSAxMDQ4NTc2O1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsZS5zaXplID4gT05FX01CX0lOX0JZVEVTKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudFNpemUgPSAoZmlsZS5zaXplIC8gT05FX01CX0lOX0JZVEVTKS50b0ZpeGVkKDEpICsgJyBNQic7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1RoZSBtYXhpbXVtIGFsbG93ZWQgZmlsZSBzaXplIGlzIDEgTUInICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnICgnICsgY3VycmVudFNpemUgKyAnIGdpdmVuKS4nO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgJChlbHQpLmJpbmQoJ2Ryb3AnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICBvbkRyYWdFbmQoZSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmaWxlID0gZS5vcmlnaW5hbEV2ZW50LmRhdGFUcmFuc2Zlci5maWxlc1swXTtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUuZXJyb3JNZXNzYWdlID0gdmFsaWRhdGVVcGxvYWRlZEZpbGUoZmlsZSwgZmlsZS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzY29wZS5lcnJvck1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9ubHkgZmlyZSB0aGlzIGV2ZW50IGlmIHZhbGlkYXRpb25zIHBhc3MuXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5vbkZpbGVDaGFuZ2VkKGZpbGUsIGZpbGUubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgJChlbHQpLmJpbmQoJ2RyYWdvdmVyJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAkKCcuaW1hZ2UtdXBsb2FkZXItZHJvcC1hcmVhJykuYWRkQ2xhc3MoJ2ltYWdlLXVwbG9hZGVyLWlzLWFjdGl2ZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICQoZWx0KS5iaW5kKCdkcmFnbGVhdmUnLCBvbkRyYWdFbmQpO1xuICAgICAgICAgICAgICAgIC8vIElmIHRoZSB1c2VyIGFjY2lkZW50YWxseSBkcm9wcyBhbiBpbWFnZSBvdXRzaWRlIG9mIHRoZSBpbWFnZS11cGxvYWRlclxuICAgICAgICAgICAgICAgIC8vIHdlIHdhbnQgdG8gcHJldmVudCB0aGUgYnJvd3NlciBmcm9tIGFwcGx5aW5nIG5vcm1hbCBkcmFnLWFuZC1kcm9wXG4gICAgICAgICAgICAgICAgLy8gbG9naWMsIHdoaWNoIGlzIHRvIGxvYWQgdGhlIGltYWdlIGluIHRoZSBicm93c2VyIHRhYi5cbiAgICAgICAgICAgICAgICAkKHdpbmRvdykuYmluZCgnZHJhZ292ZXInLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgJCh3aW5kb3cpLmJpbmQoJ2Ryb3AnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgLy8gV2UgZ2VuZXJhdGUgYSByYW5kb20gY2xhc3MgbmFtZSB0byBkaXN0aW5ndWlzaCB0aGlzIGlucHV0IGZyb21cbiAgICAgICAgICAgICAgICAvLyBvdGhlcnMgaW4gdGhlIERPTS5cbiAgICAgICAgICAgICAgICBzY29wZS5maWxlSW5wdXRDbGFzc05hbWUgPSAoJ2ltYWdlLXVwbG9hZGVyLWZpbGUtaW5wdXQnICsgSWRHZW5lcmF0aW9uU2VydmljZS5nZW5lcmF0ZU5ld0lkKCkpO1xuICAgICAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudCkub24oJ2NoYW5nZScsICcuJyArIHNjb3BlLmZpbGVJbnB1dENsYXNzTmFtZSwgZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZmlsZSA9IGV2dC5jdXJyZW50VGFyZ2V0LmZpbGVzWzBdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZmlsZW5hbWUgPSBldnQudGFyZ2V0LnZhbHVlLnNwbGl0KC8oXFxcXHxcXC8pL2cpLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICBzY29wZS5lcnJvck1lc3NhZ2UgPSB2YWxpZGF0ZVVwbG9hZGVkRmlsZShmaWxlLCBmaWxlbmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghc2NvcGUuZXJyb3JNZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBPbmx5IGZpcmUgdGhpcyBldmVudCBpZiB2YWxpZGF0aW9ucyBwYXNzLlxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUub25GaWxlQ2hhbmdlZChmaWxlLCBmaWxlbmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIHNlbGVjdDIgYXV0b2NvbXBsZXRlIGNvbXBvbmVudC5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ3NlbGVjdDJEcm9wZG93bk1vZHVsZScpLmRpcmVjdGl2ZSgnc2VsZWN0MkRyb3Bkb3duJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICAvLyBEaXJlY3RpdmUgZm9yIGluY29ycG9yYXRpbmcgc2VsZWN0MiBkcm9wZG93bnMuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICAvLyBXaGV0aGVyIHRvIGFsbG93IG11bHRpcGxlIGNob2ljZXMuIEluIG9yZGVyIHRvIGRvIHNvLCB0aGUgdmFsdWUgb2ZcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGF0dHJpYnV0ZSBtdXN0IGJlIHRoZSBleGFjdCBzdHJpbmcgJ3RydWUnLlxuICAgICAgICAgICAgICAgIGFsbG93TXVsdGlwbGVDaG9pY2VzOiAnQCcsXG4gICAgICAgICAgICAgICAgY2hvaWNlczogJz0nLFxuICAgICAgICAgICAgICAgIC8vIEFuIGFkZGl0aW9uYWwgQ1NTIGNsYXNzIHRvIGFkZCB0byB0aGUgc2VsZWN0MiBkcm9wZG93bi4gTWF5IGJlXG4gICAgICAgICAgICAgICAgLy8gdW5kZWZpbmVkLlxuICAgICAgICAgICAgICAgIGRyb3Bkb3duQ3NzQ2xhc3M6ICdAJyxcbiAgICAgICAgICAgICAgICAvLyBBIGZ1bmN0aW9uIHRoYXQgZm9ybWF0cyBhIG5ldyBzZWxlY3Rpb24uIE1heSBiZSB1bmRlZmluZWQuXG4gICAgICAgICAgICAgICAgZm9ybWF0TmV3U2VsZWN0aW9uOiAnPScsXG4gICAgICAgICAgICAgICAgLy8gVGhlIG1lc3NhZ2Ugc2hvd24gd2hlbiBhbiBpbnZhbGlkIHNlYXJjaCB0ZXJtIGlzIGVudGVyZWQuIE1heSBiZVxuICAgICAgICAgICAgICAgIC8vIHVuZGVmaW5lZCwgaW4gd2hpY2ggY2FzZSB0aGlzIGRlZmF1bHRzIHRvICdObyBtYXRjaGVzIGZvdW5kJy5cbiAgICAgICAgICAgICAgICBpbnZhbGlkU2VhcmNoVGVybU1lc3NhZ2U6ICdAJyxcbiAgICAgICAgICAgICAgICBpdGVtOiAnPScsXG4gICAgICAgICAgICAgICAgLy8gVGhlIHJlZ2V4IHVzZWQgdG8gdmFsaWRhdGUgbmV3bHktZW50ZXJlZCBjaG9pY2VzIHRoYXQgZG8gbm90XG4gICAgICAgICAgICAgICAgLy8gYWxyZWFkeSBleGlzdC4gSWYgaXQgaXMgdW5kZWZpbmVkIHRoZW4gYWxsIG5ldyBjaG9pY2VzIGFyZSByZWplY3RlZC5cbiAgICAgICAgICAgICAgICBuZXdDaG9pY2VSZWdleDogJ0AnLFxuICAgICAgICAgICAgICAgIG9uU2VsZWN0aW9uQ2hhbmdlOiAnJicsXG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI6ICdAJyxcbiAgICAgICAgICAgICAgICB3aWR0aDogJ0AnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1kaXJlY3RpdmVzL3NlbGVjdDItZHJvcGRvd24vJyArXG4gICAgICAgICAgICAgICAgJ3NlbGVjdDItZHJvcGRvd24uZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyRlbGVtZW50JywgZnVuY3Rpb24gKCRzY29wZSwgJGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm5ld0Nob2ljZVZhbGlkYXRvciA9IG5ldyBSZWdFeHAoJHNjb3BlLm5ld0Nob2ljZVJlZ2V4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGVjdDJPcHRpb25zID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dDbGVhcjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiAkc2NvcGUuY2hvaWNlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpcGxlOiAkc2NvcGUuYWxsb3dNdWx0aXBsZUNob2ljZXMgPT09ICd0cnVlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ3M6ICRzY29wZS5uZXdDaG9pY2VSZWdleCAhPT0gdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI6ICRzY29wZS5wbGFjZWhvbGRlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAkc2NvcGUud2lkdGggfHwgJzI1MHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyb3Bkb3duQ3NzQ2xhc3M6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVUYWc6IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyYW1zLnRlcm0ubWF0Y2goJHNjb3BlLm5ld0Nob2ljZVZhbGlkYXRvcikgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBwYXJhbXMudGVybSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogcGFyYW1zLnRlcm1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IDogbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVJlc3VsdDogZnVuY3Rpb24gKHF1ZXJ5UmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRvZXNDaG9pY2VNYXRjaFRleHQgPSBmdW5jdGlvbiAoY2hvaWNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjaG9pY2UuaWQgPT09IHF1ZXJ5UmVzdWx0LnRleHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmNob2ljZXMgJiYgJHNjb3BlLmNob2ljZXMuc29tZShkb2VzQ2hvaWNlTWF0Y2hUZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcXVlcnlSZXN1bHQudGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuZm9ybWF0TmV3U2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHNjb3BlLmZvcm1hdE5ld1NlbGVjdGlvbihxdWVyeVJlc3VsdC50ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBxdWVyeVJlc3VsdC50ZXh0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhbmd1YWdlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9SZXN1bHRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaW52YWxpZFNlYXJjaFRlcm1NZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHNjb3BlLmludmFsaWRTZWFyY2hUZXJtTWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnTm8gbWF0Y2hlcyBmb3VuZCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuZHJvcGRvd25Dc3NDbGFzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0Mk9wdGlvbnMuZHJvcGRvd25Dc3NDbGFzcyA9ICRzY29wZS5kcm9wZG93bkNzc0NsYXNzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxlY3QyTm9kZSA9ICRlbGVtZW50WzBdLmZpcnN0Q2hpbGQ7XG4gICAgICAgICAgICAgICAgICAgIC8vIEluaXRpYWxpemUgdGhlIGRyb3Bkb3duLlxuICAgICAgICAgICAgICAgICAgICAkKHNlbGVjdDJOb2RlKS5zZWxlY3QyKHNlbGVjdDJPcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgJChzZWxlY3QyTm9kZSkudmFsKCRzY29wZS5pdGVtKS50cmlnZ2VyKCdjaGFuZ2UnKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlICRzY29wZS5pdGVtIHdoZW4gdGhlIHNlbGVjdGlvbiBjaGFuZ2VzLlxuICAgICAgICAgICAgICAgICAgICAkKHNlbGVjdDJOb2RlKS5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLml0ZW0gPSAkKHNlbGVjdDJOb2RlKS52YWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5vblNlbGVjdGlvbkNoYW5nZSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVzcG9uZCB0byBleHRlcm5hbCBjaGFuZ2VzIGluICRzY29wZS5pdGVtXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kd2F0Y2goJ2l0ZW0nLCBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoc2VsZWN0Mk5vZGUpLnZhbChuZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE9iamVjdCBmYWN0b3J5IGZvciBjcmVhdGluZyBhdWRpbyBsYW5ndWFnZXMuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ0F1ZGlvTGFuZ3VhZ2VPYmplY3RGYWN0b3J5JywgW1xuICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIEF1ZGlvTGFuZ3VhZ2UgPSBmdW5jdGlvbiAoaWQsIGRlc2NyaXB0aW9uLCByZWxhdGVkTGFuZ3VhZ2VzKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gZGVzY3JpcHRpb247XG4gICAgICAgICAgICB0aGlzLnJlbGF0ZWRMYW5ndWFnZXMgPSByZWxhdGVkTGFuZ3VhZ2VzO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBBdWRpb0xhbmd1YWdlWydjcmVhdGVGcm9tRGljdCddID0gZnVuY3Rpb24gKGF1ZGlvTGFuZ3VhZ2VEaWN0KSB7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBBdWRpb0xhbmd1YWdlKGF1ZGlvTGFuZ3VhZ2VEaWN0LmlkLCBhdWRpb0xhbmd1YWdlRGljdC5kZXNjcmlwdGlvbiwgYXVkaW9MYW5ndWFnZURpY3QucmVsYXRlZF9sYW5ndWFnZXMpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gQXVkaW9MYW5ndWFnZTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgT2JqZWN0IGZhY3RvcnkgZm9yIGNyZWF0aW5nIGF1dG9nZW5lcmF0ZWQgYXVkaW8gbGFuZ3VhZ2VzLlxuICovXG5vcHBpYS5mYWN0b3J5KCdBdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZU9iamVjdEZhY3RvcnknLCBbXG4gICAgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgQXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2UgPSBmdW5jdGlvbiAoaWQsIGRlc2NyaXB0aW9uLCBleHBsb3JhdGlvbkxhbmd1YWdlLCBzcGVlY2hTeW50aGVzaXNDb2RlLCBzcGVlY2hTeW50aGVzaXNDb2RlTW9iaWxlKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gZGVzY3JpcHRpb247XG4gICAgICAgICAgICB0aGlzLmV4cGxvcmF0aW9uTGFuZ3VhZ2UgPSBleHBsb3JhdGlvbkxhbmd1YWdlO1xuICAgICAgICAgICAgdGhpcy5zcGVlY2hTeW50aGVzaXNDb2RlID0gc3BlZWNoU3ludGhlc2lzQ29kZTtcbiAgICAgICAgICAgIHRoaXMuc3BlZWNoU3ludGhlc2lzQ29kZU1vYmlsZSA9IHNwZWVjaFN5bnRoZXNpc0NvZGVNb2JpbGU7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIEF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlWydjcmVhdGVGcm9tRGljdCddID0gKFxuICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBmdW5jdGlvbiAoYXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VEaWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlKGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlRGljdC5pZCwgYXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VEaWN0LmRlc2NyaXB0aW9uLCBhdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZURpY3QuZXhwbG9yYXRpb25fbGFuZ3VhZ2UsIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlRGljdC5zcGVlY2hfc3ludGhlc2lzX2NvZGUsIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlRGljdC5zcGVlY2hfc3ludGhlc2lzX2NvZGVfbW9iaWxlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBBdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVXRpbGl0eSBzZXJ2aWNlIGZvciBjaGVja2luZyB3ZWIgYnJvd3NlciB0eXBlLlxuICovXG5vcHBpYS5mYWN0b3J5KCdCcm93c2VyQ2hlY2tlclNlcnZpY2UnLCBbXG4gICAgJ0FVVE9HRU5FUkFURURfQVVESU9fTEFOR1VBR0VTJyxcbiAgICBmdW5jdGlvbiAoQVVUT0dFTkVSQVRFRF9BVURJT19MQU5HVUFHRVMpIHtcbiAgICAgICAgLy8gRm9yIGRldGFpbHMgb24gdGhlIHJlbGlhYmlsaXR5IG9mIHRoaXMgY2hlY2ssIHNlZVxuICAgICAgICAvLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy85ODQ3NTgwL1xuICAgICAgICAvLyBob3ctdG8tZGV0ZWN0LXNhZmFyaS1jaHJvbWUtaWUtZmlyZWZveC1hbmQtb3BlcmEtYnJvd3NlciNhbnN3ZXItOTg1MTc2OVxuICAgICAgICB2YXIgaXNTYWZhcmkgPSAvY29uc3RydWN0b3IvaS50ZXN0KHdpbmRvdy5IVE1MRWxlbWVudCkgfHwgKGZ1bmN0aW9uIChwKSB7XG4gICAgICAgICAgICByZXR1cm4gcC50b1N0cmluZygpID09PSAnW29iamVjdCBTYWZhcmlSZW1vdGVOb3RpZmljYXRpb25dJztcbiAgICAgICAgfSkoIXdpbmRvdy5zYWZhcmkgfHxcbiAgICAgICAgICAgICh0eXBlb2Ygd2luZG93LnNhZmFyaSAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LnNhZmFyaS5wdXNoTm90aWZpY2F0aW9uKSk7XG4gICAgICAgIHZhciBfc3VwcG9ydHNTcGVlY2hTeW50aGVzaXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgc3VwcG9ydExhbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmICh3aW5kb3cuaGFzT3duUHJvcGVydHkoJ3NwZWVjaFN5bnRoZXNpcycpKSB7XG4gICAgICAgICAgICAgICAgc3BlZWNoU3ludGhlc2lzLmdldFZvaWNlcygpLmZvckVhY2goZnVuY3Rpb24gKHZvaWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIEFVVE9HRU5FUkFURURfQVVESU9fTEFOR1VBR0VTLmZvckVhY2goZnVuY3Rpb24gKGF1ZGlvTGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2b2ljZS5sYW5nID09PSBhdWRpb0xhbmd1YWdlLnNwZWVjaF9zeW50aGVzaXNfY29kZSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChfaXNNb2JpbGVEZXZpY2UoKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2b2ljZS5sYW5nID09PSBhdWRpb0xhbmd1YWdlLnNwZWVjaF9zeW50aGVzaXNfY29kZV9tb2JpbGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VwcG9ydExhbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdXBwb3J0TGFuZztcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9pc01vYmlsZURldmljZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB1c2VyQWdlbnQgPSBuYXZpZ2F0b3IudXNlckFnZW50IHx8IG5hdmlnYXRvci52ZW5kb3IgfHwgd2luZG93Lm9wZXJhO1xuICAgICAgICAgICAgcmV0dXJuIHVzZXJBZ2VudC5tYXRjaCgvaVBob25lL2kpIHx8IHVzZXJBZ2VudC5tYXRjaCgvQW5kcm9pZC9pKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1cHBvcnRzU3BlZWNoU3ludGhlc2lzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9zdXBwb3J0c1NwZWVjaFN5bnRoZXNpcygpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzTW9iaWxlRGV2aWNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9pc01vYmlsZURldmljZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBVdGlsaXR5IHNlcnZpY2UgZm9yIGxhbmd1YWdlIG9wZXJhdGlvbnMuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvQXVkaW9MYW5ndWFnZU9iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvQXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VPYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL0Jyb3dzZXJDaGVja2VyU2VydmljZS50cycpO1xub3BwaWEuZmFjdG9yeSgnTGFuZ3VhZ2VVdGlsU2VydmljZScsIFtcbiAgICAnQXVkaW9MYW5ndWFnZU9iamVjdEZhY3RvcnknLCAnQXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VPYmplY3RGYWN0b3J5JyxcbiAgICAnQnJvd3NlckNoZWNrZXJTZXJ2aWNlJywgJ0FMTF9MQU5HVUFHRV9DT0RFUycsXG4gICAgJ0FVVE9HRU5FUkFURURfQVVESU9fTEFOR1VBR0VTJywgJ1NVUFBPUlRFRF9BVURJT19MQU5HVUFHRVMnLFxuICAgIGZ1bmN0aW9uIChBdWRpb0xhbmd1YWdlT2JqZWN0RmFjdG9yeSwgQXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VPYmplY3RGYWN0b3J5LCBCcm93c2VyQ2hlY2tlclNlcnZpY2UsIEFMTF9MQU5HVUFHRV9DT0RFUywgQVVUT0dFTkVSQVRFRF9BVURJT19MQU5HVUFHRVMsIFNVUFBPUlRFRF9BVURJT19MQU5HVUFHRVMpIHtcbiAgICAgICAgdmFyIHN1cHBvcnRlZEF1ZGlvTGFuZ3VhZ2VMaXN0ID0gU1VQUE9SVEVEX0FVRElPX0xBTkdVQUdFUztcbiAgICAgICAgdmFyIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlTGlzdCA9IEFVVE9HRU5FUkFURURfQVVESU9fTEFOR1VBR0VTO1xuICAgICAgICB2YXIgc3VwcG9ydGVkQXVkaW9MYW5ndWFnZXMgPSB7fTtcbiAgICAgICAgdmFyIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlc0J5RXhwbG9yYXRpb25MYW5ndWFnZUNvZGUgPSB7fTtcbiAgICAgICAgdmFyIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlc0J5QXV0b2dlbmVyYXRlZExhbmd1YWdlQ29kZSA9IHt9O1xuICAgICAgICB2YXIgZ2V0U2hvcnRMYW5ndWFnZURlc2NyaXB0aW9uID0gZnVuY3Rpb24gKGZ1bGxMYW5ndWFnZURlc2NyaXB0aW9uKSB7XG4gICAgICAgICAgICB2YXIgaW5kID0gZnVsbExhbmd1YWdlRGVzY3JpcHRpb24uaW5kZXhPZignICgnKTtcbiAgICAgICAgICAgIGlmIChpbmQgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bGxMYW5ndWFnZURlc2NyaXB0aW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bGxMYW5ndWFnZURlc2NyaXB0aW9uLnN1YnN0cmluZygwLCBpbmQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgbGFuZ3VhZ2VJZHNBbmRUZXh0cyA9IEFMTF9MQU5HVUFHRV9DT0RFUy5tYXAoZnVuY3Rpb24gKGxhbmd1YWdlSXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpZDogbGFuZ3VhZ2VJdGVtLmNvZGUsXG4gICAgICAgICAgICAgICAgdGV4dDogZ2V0U2hvcnRMYW5ndWFnZURlc2NyaXB0aW9uKGxhbmd1YWdlSXRlbS5kZXNjcmlwdGlvbilcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgYWxsQXVkaW9MYW5ndWFnZUNvZGVzID0gKHN1cHBvcnRlZEF1ZGlvTGFuZ3VhZ2VMaXN0Lm1hcChmdW5jdGlvbiAoYXVkaW9MYW5ndWFnZSkge1xuICAgICAgICAgICAgcmV0dXJuIGF1ZGlvTGFuZ3VhZ2UuaWQ7XG4gICAgICAgIH0pKTtcbiAgICAgICAgc3VwcG9ydGVkQXVkaW9MYW5ndWFnZUxpc3QuZm9yRWFjaChmdW5jdGlvbiAoYXVkaW9MYW5ndWFnZURpY3QpIHtcbiAgICAgICAgICAgIHN1cHBvcnRlZEF1ZGlvTGFuZ3VhZ2VzW2F1ZGlvTGFuZ3VhZ2VEaWN0LmlkXSA9XG4gICAgICAgICAgICAgICAgQXVkaW9MYW5ndWFnZU9iamVjdEZhY3RvcnkuY3JlYXRlRnJvbURpY3QoYXVkaW9MYW5ndWFnZURpY3QpO1xuICAgICAgICB9KTtcbiAgICAgICAgYXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VMaXN0LmZvckVhY2goZnVuY3Rpb24gKGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlRGljdCkge1xuICAgICAgICAgICAgdmFyIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlID0gQXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VPYmplY3RGYWN0b3J5LmNyZWF0ZUZyb21EaWN0KGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlRGljdCk7XG4gICAgICAgICAgICBhdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZXNCeUV4cGxvcmF0aW9uTGFuZ3VhZ2VDb2RlW2F1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlLmV4cGxvcmF0aW9uTGFuZ3VhZ2VdID1cbiAgICAgICAgICAgICAgICBhdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZTtcbiAgICAgICAgICAgIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlc0J5QXV0b2dlbmVyYXRlZExhbmd1YWdlQ29kZVthdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZS5pZF0gPVxuICAgICAgICAgICAgICAgIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlO1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIGF1ZGlvTGFuZ3VhZ2VzQ291bnQgPSBhbGxBdWRpb0xhbmd1YWdlQ29kZXMubGVuZ3RoO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ2V0TGFuZ3VhZ2VJZHNBbmRUZXh0czogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsYW5ndWFnZUlkc0FuZFRleHRzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEF1ZGlvTGFuZ3VhZ2VzQ291bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXVkaW9MYW5ndWFnZXNDb3VudDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRBbGxWb2ljZW92ZXJMYW5ndWFnZUNvZGVzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFuZ3VsYXIuY29weShhbGxBdWRpb0xhbmd1YWdlQ29kZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEF1ZGlvTGFuZ3VhZ2VEZXNjcmlwdGlvbjogZnVuY3Rpb24gKGF1ZGlvTGFuZ3VhZ2VDb2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1cHBvcnRlZEF1ZGlvTGFuZ3VhZ2VzW2F1ZGlvTGFuZ3VhZ2VDb2RlXS5kZXNjcmlwdGlvbjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBHaXZlbiBhIGxpc3Qgb2YgYXVkaW8gbGFuZ3VhZ2UgY29kZXMsIHJldHVybnMgdGhlIGNvbXBsZW1lbnQgbGlzdCwgaS5lLlxuICAgICAgICAgICAgLy8gdGhlIGxpc3Qgb2YgYXVkaW8gbGFuZ3VhZ2UgY29kZXMgbm90IGluIHRoZSBpbnB1dCBsaXN0LlxuICAgICAgICAgICAgZ2V0Q29tcGxlbWVudEF1ZGlvTGFuZ3VhZ2VDb2RlczogZnVuY3Rpb24gKGF1ZGlvTGFuZ3VhZ2VDb2Rlcykge1xuICAgICAgICAgICAgICAgIHJldHVybiBhbGxBdWRpb0xhbmd1YWdlQ29kZXMuZmlsdGVyKGZ1bmN0aW9uIChsYW5ndWFnZUNvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGF1ZGlvTGFuZ3VhZ2VDb2Rlcy5pbmRleE9mKGxhbmd1YWdlQ29kZSkgPT09IC0xO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldExhbmd1YWdlQ29kZXNSZWxhdGVkVG9BdWRpb0xhbmd1YWdlQ29kZTogZnVuY3Rpb24gKGF1ZGlvTGFuZ3VhZ2VDb2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1cHBvcnRlZEF1ZGlvTGFuZ3VhZ2VzW2F1ZGlvTGFuZ3VhZ2VDb2RlXS5yZWxhdGVkTGFuZ3VhZ2VzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN1cHBvcnRzQXV0b2dlbmVyYXRlZEF1ZGlvOiBmdW5jdGlvbiAoZXhwbG9yYXRpb25MYW5ndWFnZUNvZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKEJyb3dzZXJDaGVja2VyU2VydmljZS5zdXBwb3J0c1NwZWVjaFN5bnRoZXNpcygpICYmXG4gICAgICAgICAgICAgICAgICAgIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlc0J5RXhwbG9yYXRpb25MYW5ndWFnZUNvZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC5oYXNPd25Qcm9wZXJ0eShleHBsb3JhdGlvbkxhbmd1YWdlQ29kZSkpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzQXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2U6IGZ1bmN0aW9uIChhdWRpb0xhbmd1YWdlQ29kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZXNCeUF1dG9nZW5lcmF0ZWRMYW5ndWFnZUNvZGVcbiAgICAgICAgICAgICAgICAgICAgLmhhc093blByb3BlcnR5KGF1ZGlvTGFuZ3VhZ2VDb2RlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRBdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZTogZnVuY3Rpb24gKGV4cGxvcmF0aW9uTGFuZ3VhZ2VDb2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlc0J5RXhwbG9yYXRpb25MYW5ndWFnZUNvZGVbZXhwbG9yYXRpb25MYW5ndWFnZUNvZGVdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb252ZXJ0VG9QbGFpblRleHQgZmlsdGVyIGZvciBPcHBpYS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3N0cmluZ1V0aWxpdHlGaWx0ZXJzTW9kdWxlJykuZmlsdGVyKCdjb252ZXJ0VG9QbGFpblRleHQnLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgc3RyaXBwZWRUZXh0ID0gaW5wdXQucmVwbGFjZSgvKDwoW14+XSspPikvaWcsICcnKTtcbiAgICAgICAgICAgIHN0cmlwcGVkVGV4dCA9IHN0cmlwcGVkVGV4dC5yZXBsYWNlKC8mbmJzcDsvaWcsICcgJyk7XG4gICAgICAgICAgICBzdHJpcHBlZFRleHQgPSBzdHJpcHBlZFRleHQucmVwbGFjZSgvJnF1b3Q7L2lnLCAnJyk7XG4gICAgICAgICAgICB2YXIgdHJpbW1lZFRleHQgPSBzdHJpcHBlZFRleHQudHJpbSgpO1xuICAgICAgICAgICAgaWYgKHRyaW1tZWRUZXh0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdHJpcHBlZFRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJpbW1lZFRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFRydW5jYXRlIGZpbHRlciBmb3IgT3BwaWEuXG4gKi9cbnJlcXVpcmUoJ2ZpbHRlcnMvc3RyaW5nLXV0aWxpdHktZmlsdGVycy9jb252ZXJ0LXRvLXBsYWluLXRleHQuZmlsdGVyLnRzJyk7XG4vLyBGaWx0ZXIgdGhhdCB0cnVuY2F0ZXMgbG9uZyBkZXNjcmlwdG9ycy5cbmFuZ3VsYXIubW9kdWxlKCdzdHJpbmdVdGlsaXR5RmlsdGVyc01vZHVsZScpLmZpbHRlcigndHJ1bmNhdGUnLCBbJyRmaWx0ZXInLCBmdW5jdGlvbiAoJGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGlucHV0LCBsZW5ndGgsIHN1ZmZpeCkge1xuICAgICAgICAgICAgaWYgKCFpbnB1dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc05hTihsZW5ndGgpKSB7XG4gICAgICAgICAgICAgICAgbGVuZ3RoID0gNzA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3VmZml4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBzdWZmaXggPSAnLi4uJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghYW5ndWxhci5pc1N0cmluZyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBpbnB1dCA9IFN0cmluZyhpbnB1dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbnB1dCA9ICRmaWx0ZXIoJ2NvbnZlcnRUb1BsYWluVGV4dCcpKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiAoaW5wdXQubGVuZ3RoIDw9IGxlbmd0aCA/IGlucHV0IDogKGlucHV0LnN1YnN0cmluZygwLCBsZW5ndGggLSBzdWZmaXgubGVuZ3RoKSArIHN1ZmZpeCkpO1xuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEYXRhIGFuZCBjb250cm9sbGVycyBmb3IgdGhlIE9wcGlhICdlZGl0IHByZWZlcmVuY2VzJyBwYWdlLlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLWRpcmVjdGl2ZXMvc2VsZWN0Mi1kcm9wZG93bi8nICtcbiAgICAnc2VsZWN0Mi1kcm9wZG93bi5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtZGlyZWN0aXZlcy9pbWFnZS11cGxvYWRlci8nICtcbiAgICAnaW1hZ2UtdXBsb2FkZXIuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9iYWNrZ3JvdW5kLWJhbm5lci8nICtcbiAgICAnYmFja2dyb3VuZC1iYW5uZXIuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdmaWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvdHJ1bmNhdGUuZmlsdGVyLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL0xhbmd1YWdlVXRpbFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1VzZXJTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9VdGlsc1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdwcmVmZXJlbmNlc1BhZ2VNb2R1bGUnKS5jb250cm9sbGVyKCdQcmVmZXJlbmNlcycsIFtcbiAgICAnJGh0dHAnLCAnJHEnLCAnJHJvb3RTY29wZScsICckc2NvcGUnLCAnJHRpbWVvdXQnLCAnJHRyYW5zbGF0ZScsICckdWliTW9kYWwnLFxuICAgICdBbGVydHNTZXJ2aWNlJywgJ0xhbmd1YWdlVXRpbFNlcnZpY2UnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgICdVc2VyU2VydmljZScsICdVdGlsc1NlcnZpY2UnLCAnREFTSEJPQVJEX1RZUEVfQ1JFQVRPUicsXG4gICAgJ0RBU0hCT0FSRF9UWVBFX0xFQVJORVInLCAnU1VQUE9SVEVEX0FVRElPX0xBTkdVQUdFUycsXG4gICAgJ1NVUFBPUlRFRF9TSVRFX0xBTkdVQUdFUycsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkcSwgJHJvb3RTY29wZSwgJHNjb3BlLCAkdGltZW91dCwgJHRyYW5zbGF0ZSwgJHVpYk1vZGFsLCBBbGVydHNTZXJ2aWNlLCBMYW5ndWFnZVV0aWxTZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgVXNlclNlcnZpY2UsIFV0aWxzU2VydmljZSwgREFTSEJPQVJEX1RZUEVfQ1JFQVRPUiwgREFTSEJPQVJEX1RZUEVfTEVBUk5FUiwgU1VQUE9SVEVEX0FVRElPX0xBTkdVQUdFUywgU1VQUE9SVEVEX1NJVEVfTEFOR1VBR0VTKSB7XG4gICAgICAgIHZhciBfUFJFRkVSRU5DRVNfREFUQV9VUkwgPSAnL3ByZWZlcmVuY2VzaGFuZGxlci9kYXRhJztcbiAgICAgICAgJHNjb3BlLnByb2ZpbGVQaWN0dXJlRGF0YVVybCA9ICcnO1xuICAgICAgICAkc2NvcGUuREFTSEJPQVJEX1RZUEVfQ1JFQVRPUiA9IERBU0hCT0FSRF9UWVBFX0NSRUFUT1I7XG4gICAgICAgICRzY29wZS5EQVNIQk9BUkRfVFlQRV9MRUFSTkVSID0gREFTSEJPQVJEX1RZUEVfTEVBUk5FUjtcbiAgICAgICAgJHNjb3BlLnVzZXJuYW1lID0gJyc7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ01lc3NhZ2UgPSAnTG9hZGluZyc7XG4gICAgICAgIHZhciB1c2VySW5mb1Byb21pc2UgPSBVc2VyU2VydmljZS5nZXRVc2VySW5mb0FzeW5jKCk7XG4gICAgICAgIHVzZXJJbmZvUHJvbWlzZS50aGVuKGZ1bmN0aW9uICh1c2VySW5mbykge1xuICAgICAgICAgICAgJHNjb3BlLnVzZXJuYW1lID0gdXNlckluZm8uZ2V0VXNlcm5hbWUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgICRzY29wZS5oYXNQYWdlTG9hZGVkID0gZmFsc2U7XG4gICAgICAgIHZhciBwcmVmZXJlbmNlc1Byb21pc2UgPSAkaHR0cC5nZXQoX1BSRUZFUkVOQ0VTX0RBVEFfVVJMKTtcbiAgICAgICAgcHJlZmVyZW5jZXNQcm9taXNlLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAkc2NvcGUudXNlckJpbyA9IGRhdGEudXNlcl9iaW87XG4gICAgICAgICAgICAkc2NvcGUuc3ViamVjdEludGVyZXN0cyA9IGRhdGEuc3ViamVjdF9pbnRlcmVzdHM7XG4gICAgICAgICAgICAkc2NvcGUucHJlZmVycmVkTGFuZ3VhZ2VDb2RlcyA9IGRhdGEucHJlZmVycmVkX2xhbmd1YWdlX2NvZGVzO1xuICAgICAgICAgICAgJHNjb3BlLnByb2ZpbGVQaWN0dXJlRGF0YVVybCA9IGRhdGEucHJvZmlsZV9waWN0dXJlX2RhdGFfdXJsO1xuICAgICAgICAgICAgJHNjb3BlLmRlZmF1bHREYXNoYm9hcmQgPSBkYXRhLmRlZmF1bHRfZGFzaGJvYXJkO1xuICAgICAgICAgICAgJHNjb3BlLmNhblJlY2VpdmVFbWFpbFVwZGF0ZXMgPSBkYXRhLmNhbl9yZWNlaXZlX2VtYWlsX3VwZGF0ZXM7XG4gICAgICAgICAgICAkc2NvcGUuY2FuUmVjZWl2ZUVkaXRvclJvbGVFbWFpbCA9IGRhdGEuY2FuX3JlY2VpdmVfZWRpdG9yX3JvbGVfZW1haWw7XG4gICAgICAgICAgICAkc2NvcGUuY2FuUmVjZWl2ZVN1YnNjcmlwdGlvbkVtYWlsID0gZGF0YS5jYW5fcmVjZWl2ZV9zdWJzY3JpcHRpb25fZW1haWw7XG4gICAgICAgICAgICAkc2NvcGUuY2FuUmVjZWl2ZUZlZWRiYWNrTWVzc2FnZUVtYWlsID0gKGRhdGEuY2FuX3JlY2VpdmVfZmVlZGJhY2tfbWVzc2FnZV9lbWFpbCk7XG4gICAgICAgICAgICAkc2NvcGUucHJlZmVycmVkU2l0ZUxhbmd1YWdlQ29kZSA9IGRhdGEucHJlZmVycmVkX3NpdGVfbGFuZ3VhZ2VfY29kZTtcbiAgICAgICAgICAgICRzY29wZS5wcmVmZXJyZWRBdWRpb0xhbmd1YWdlQ29kZSA9IGRhdGEucHJlZmVycmVkX2F1ZGlvX2xhbmd1YWdlX2NvZGU7XG4gICAgICAgICAgICAkc2NvcGUuc3Vic2NyaXB0aW9uTGlzdCA9IGRhdGEuc3Vic2NyaXB0aW9uX2xpc3Q7XG4gICAgICAgICAgICAkc2NvcGUuaGFzUGFnZUxvYWRlZCA9IHRydWU7XG4gICAgICAgICAgICBfZm9yY2VTZWxlY3QyUmVmcmVzaCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgJHEuYWxsKFt1c2VySW5mb1Byb21pc2UsIHByZWZlcmVuY2VzUHJvbWlzZV0pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICcnO1xuICAgICAgICB9KTtcbiAgICAgICAgJHNjb3BlLmdldFN0YXRpY0ltYWdlVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmw7XG4gICAgICAgIHZhciBfc2F2ZURhdGFJdGVtID0gZnVuY3Rpb24gKHVwZGF0ZVR5cGUsIGRhdGEpIHtcbiAgICAgICAgICAgICRodHRwLnB1dChfUFJFRkVSRU5DRVNfREFUQV9VUkwsIHtcbiAgICAgICAgICAgICAgICB1cGRhdGVfdHlwZTogdXBkYXRlVHlwZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gU2VsZWN0MiBkcm9wZG93biBjYW5ub3QgYXV0b21hdGljYWxseSByZWZyZXNoIGl0cyBkaXNwbGF5XG4gICAgICAgIC8vIGFmdGVyIGJlaW5nIHRyYW5zbGF0ZWQuXG4gICAgICAgIC8vIFVzZSAkc2NvcGUuc2VsZWN0MkRyb3Bkb3duSXNTaG93biBpbiBpdHMgbmctaWYgYXR0cmlidXRlXG4gICAgICAgIC8vIGFuZCB0aGlzIGZ1bmN0aW9uIHRvIGZvcmNlIGl0IHRvIHJlbG9hZFxuICAgICAgICB2YXIgX2ZvcmNlU2VsZWN0MlJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc2VsZWN0MkRyb3Bkb3duSXNTaG93biA9IGZhbHNlO1xuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3QyRHJvcGRvd25Jc1Nob3duID0gdHJ1ZTtcbiAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5zYXZlVXNlckJpbyA9IGZ1bmN0aW9uICh1c2VyQmlvKSB7XG4gICAgICAgICAgICBfc2F2ZURhdGFJdGVtKCd1c2VyX2JpbycsIHVzZXJCaW8pO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuc3ViamVjdEludGVyZXN0c0NoYW5nZWRBdExlYXN0T25jZSA9IGZhbHNlO1xuICAgICAgICAkc2NvcGUuc3ViamVjdEludGVyZXN0c1dhcm5pbmdUZXh0ID0gbnVsbDtcbiAgICAgICAgJHNjb3BlLlRBR19SRUdFWF9TVFJJTkcgPSAnXlthLXogXSskJztcbiAgICAgICAgJHNjb3BlLnVwZGF0ZVN1YmplY3RJbnRlcmVzdHNXYXJuaW5nID0gZnVuY3Rpb24gKHN1YmplY3RJbnRlcmVzdHMpIHtcbiAgICAgICAgICAgIHZhciBUQUdfUkVHRVggPSBuZXcgUmVnRXhwKCRzY29wZS5UQUdfUkVHRVhfU1RSSU5HKTtcbiAgICAgICAgICAgIGlmIChzdWJqZWN0SW50ZXJlc3RzIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1YmplY3RJbnRlcmVzdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFV0aWxzU2VydmljZS5pc1N0cmluZyhzdWJqZWN0SW50ZXJlc3RzW2ldKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFUQUdfUkVHRVgudGVzdChzdWJqZWN0SW50ZXJlc3RzW2ldKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zdWJqZWN0SW50ZXJlc3RzV2FybmluZ1RleHQgPSAoJ1N1YmplY3QgaW50ZXJlc3RzIHNob3VsZCB1c2Ugb25seSBsb3dlcmNhc2UgbGV0dGVycy4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yOiByZWNlaXZlZCBiYWQgdmFsdWUgZm9yIGEgc3ViamVjdCBpbnRlcmVzdC4gRXhwZWN0ZWQgYSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnc3RyaW5nLCBnb3QgJywgc3ViamVjdEludGVyZXN0c1tpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignRXJyb3I6IHJlY2VpdmVkIGJhZCB2YWx1ZSBmb3IgYSBzdWJqZWN0IGludGVyZXN0LicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3I6IHJlY2VpdmVkIGJhZCB2YWx1ZSBmb3Igc3ViamVjdCBpbnRlcmVzdHMuIEV4cGVjdGVkIGxpc3Qgb2YgJyArXG4gICAgICAgICAgICAgICAgICAgICdzdHJpbmdzLCBnb3QgJywgc3ViamVjdEludGVyZXN0cyk7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0Vycm9yOiByZWNlaXZlZCBiYWQgdmFsdWUgZm9yIHN1YmplY3QgaW50ZXJlc3RzLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUub25TdWJqZWN0SW50ZXJlc3RzU2VsZWN0aW9uQ2hhbmdlID0gZnVuY3Rpb24gKHN1YmplY3RJbnRlcmVzdHMpIHtcbiAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuY2xlYXJXYXJuaW5ncygpO1xuICAgICAgICAgICAgJHNjb3BlLnN1YmplY3RJbnRlcmVzdHNDaGFuZ2VkQXRMZWFzdE9uY2UgPSB0cnVlO1xuICAgICAgICAgICAgJHNjb3BlLnN1YmplY3RJbnRlcmVzdHNXYXJuaW5nVGV4dCA9IG51bGw7XG4gICAgICAgICAgICAkc2NvcGUudXBkYXRlU3ViamVjdEludGVyZXN0c1dhcm5pbmcoc3ViamVjdEludGVyZXN0cyk7XG4gICAgICAgICAgICBpZiAoJHNjb3BlLnN1YmplY3RJbnRlcmVzdHNXYXJuaW5nVGV4dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIF9zYXZlRGF0YUl0ZW0oJ3N1YmplY3RfaW50ZXJlc3RzJywgc3ViamVjdEludGVyZXN0cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5zYXZlUHJlZmVycmVkU2l0ZUxhbmd1YWdlQ29kZXMgPSBmdW5jdGlvbiAocHJlZmVycmVkU2l0ZUxhbmd1YWdlQ29kZSkge1xuICAgICAgICAgICAgJHRyYW5zbGF0ZS51c2UocHJlZmVycmVkU2l0ZUxhbmd1YWdlQ29kZSk7XG4gICAgICAgICAgICBfZm9yY2VTZWxlY3QyUmVmcmVzaCgpO1xuICAgICAgICAgICAgX3NhdmVEYXRhSXRlbSgncHJlZmVycmVkX3NpdGVfbGFuZ3VhZ2VfY29kZScsIHByZWZlcnJlZFNpdGVMYW5ndWFnZUNvZGUpO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuc2F2ZVByZWZlcnJlZEF1ZGlvTGFuZ3VhZ2VDb2RlID0gZnVuY3Rpb24gKHByZWZlcnJlZEF1ZGlvTGFuZ3VhZ2VDb2RlKSB7XG4gICAgICAgICAgICBfc2F2ZURhdGFJdGVtKCdwcmVmZXJyZWRfYXVkaW9fbGFuZ3VhZ2VfY29kZScsIHByZWZlcnJlZEF1ZGlvTGFuZ3VhZ2VDb2RlKTtcbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLnNob3dVc2VybmFtZVBvcG92ZXIgPSBmdW5jdGlvbiAoY3JlYXRvclVzZXJuYW1lKSB7XG4gICAgICAgICAgICAvLyBUaGUgcG9wb3ZlciBvbiB0aGUgc3Vic2NyaXB0aW9uIGNhcmQgaXMgb25seSBzaG93biBpZiB0aGUgbGVuZ3RoIG9mXG4gICAgICAgICAgICAvLyB0aGUgY3JlYXRvciB1c2VybmFtZSBpcyBncmVhdGVyIHRoYW4gMTAgYW5kIHRoZSB1c2VyIGhvdmVycyBvdmVyXG4gICAgICAgICAgICAvLyB0aGUgdHJ1bmNhdGVkIHVzZXJuYW1lLlxuICAgICAgICAgICAgaWYgKGNyZWF0b3JVc2VybmFtZS5sZW5ndGggPiAxMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnbW91c2VlbnRlcic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ25vbmUnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuc2F2ZUVtYWlsUHJlZmVyZW5jZXMgPSBmdW5jdGlvbiAoY2FuUmVjZWl2ZUVtYWlsVXBkYXRlcywgY2FuUmVjZWl2ZUVkaXRvclJvbGVFbWFpbCwgY2FuUmVjZWl2ZUZlZWRiYWNrTWVzc2FnZUVtYWlsLCBjYW5SZWNlaXZlU3Vic2NyaXB0aW9uRW1haWwpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgICAgIGNhbl9yZWNlaXZlX2VtYWlsX3VwZGF0ZXM6IGNhblJlY2VpdmVFbWFpbFVwZGF0ZXMsXG4gICAgICAgICAgICAgICAgY2FuX3JlY2VpdmVfZWRpdG9yX3JvbGVfZW1haWw6IGNhblJlY2VpdmVFZGl0b3JSb2xlRW1haWwsXG4gICAgICAgICAgICAgICAgY2FuX3JlY2VpdmVfZmVlZGJhY2tfbWVzc2FnZV9lbWFpbDogY2FuUmVjZWl2ZUZlZWRiYWNrTWVzc2FnZUVtYWlsLFxuICAgICAgICAgICAgICAgIGNhbl9yZWNlaXZlX3N1YnNjcmlwdGlvbl9lbWFpbDogY2FuUmVjZWl2ZVN1YnNjcmlwdGlvbkVtYWlsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgX3NhdmVEYXRhSXRlbSgnZW1haWxfcHJlZmVyZW5jZXMnLCBkYXRhKTtcbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLnNhdmVQcmVmZXJyZWRMYW5ndWFnZUNvZGVzID0gZnVuY3Rpb24gKHByZWZlcnJlZExhbmd1YWdlQ29kZXMpIHtcbiAgICAgICAgICAgIF9zYXZlRGF0YUl0ZW0oJ3ByZWZlcnJlZF9sYW5ndWFnZV9jb2RlcycsIHByZWZlcnJlZExhbmd1YWdlQ29kZXMpO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuc2F2ZURlZmF1bHREYXNoYm9hcmQgPSBmdW5jdGlvbiAoZGVmYXVsdERhc2hib2FyZCkge1xuICAgICAgICAgICAgX3NhdmVEYXRhSXRlbSgnZGVmYXVsdF9kYXNoYm9hcmQnLCBkZWZhdWx0RGFzaGJvYXJkKTtcbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLnNob3dFZGl0UHJvZmlsZVBpY3R1cmVNb2RhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9wcmVmZXJlbmNlcy1wYWdlL3ByZWZlcmVuY2VzLXBhZ2UtdGVtcGxhdGVzLycgK1xuICAgICAgICAgICAgICAgICAgICAnZWRpdC1wcm9maWxlLXBpY3R1cmUtbW9kYWwuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgICAgICBiYWNrZHJvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJHVpYk1vZGFsSW5zdGFuY2UnLCBmdW5jdGlvbiAoJHNjb3BlLCAkdWliTW9kYWxJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnVwbG9hZGVkSW1hZ2UgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNyb3BwZWRJbWFnZURhdGFVcmwgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pbnZhbGlkSW1hZ2VXYXJuaW5nSXNTaG93biA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm9uRmlsZUNoYW5nZWQgPSBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJy5vcHBpYS1wcm9maWxlLWltYWdlLXVwbG9hZGVyJykuZmFkZU91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pbnZhbGlkSW1hZ2VXYXJuaW5nSXNTaG93biA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUudXBsb2FkZWRJbWFnZSA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnLm9wcGlhLXByb2ZpbGUtaW1hZ2UtdXBsb2FkZXInKS5mYWRlSW4oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnVwbG9hZGVkSW1hZ2UgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jcm9wcGVkSW1hZ2VEYXRhVXJsID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm9uSW52YWxpZEltYWdlTG9hZGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS51cGxvYWRlZEltYWdlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY3JvcHBlZEltYWdlRGF0YVVybCA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pbnZhbGlkSW1hZ2VXYXJuaW5nSXNTaG93biA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpcm0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuY2xvc2UoJHNjb3BlLmNyb3BwZWRJbWFnZURhdGFVcmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSkucmVzdWx0LnRoZW4oZnVuY3Rpb24gKG5ld1Byb2ZpbGVQaWN0dXJlRGF0YVVybCkge1xuICAgICAgICAgICAgICAgIFVzZXJTZXJ2aWNlLnNldFByb2ZpbGVJbWFnZURhdGFVcmxBc3luYyhuZXdQcm9maWxlUGljdHVyZURhdGFVcmwpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIHJlbG9hZCBpcyBuZWVkZWQgaW4gb3JkZXIgdG8gdXBkYXRlIHRoZSBwcm9maWxlIHBpY3R1cmUgaW5cbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIHRvcC1yaWdodCBjb3JuZXIuXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uLnJlbG9hZCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5MQU5HVUFHRV9DSE9JQ0VTID0gTGFuZ3VhZ2VVdGlsU2VydmljZS5nZXRMYW5ndWFnZUlkc0FuZFRleHRzKCk7XG4gICAgICAgICRzY29wZS5TSVRFX0xBTkdVQUdFX0NIT0lDRVMgPSBTVVBQT1JURURfU0lURV9MQU5HVUFHRVM7XG4gICAgICAgICRzY29wZS5BVURJT19MQU5HVUFHRV9DSE9JQ0VTID0gU1VQUE9SVEVEX0FVRElPX0xBTkdVQUdFUy5tYXAoZnVuY3Rpb24gKGxhbmd1YWdlSXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpZDogbGFuZ3VhZ2VJdGVtLmlkLFxuICAgICAgICAgICAgICAgIHRleHQ6IGxhbmd1YWdlSXRlbS5kZXNjcmlwdGlvblxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgZm9yIGdlbmVyYXRpbmcgcmFuZG9tIElEcy5cbiAqL1xub3BwaWEuZmFjdG9yeSgnSWRHZW5lcmF0aW9uU2VydmljZScsIFtmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBnZW5lcmF0ZU5ld0lkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gR2VuZXJhdGVzIHJhbmRvbSBzdHJpbmcgdXNpbmcgdGhlIGxhc3QgMTAgZGlnaXRzIG9mXG4gICAgICAgICAgICAgICAgLy8gdGhlIHN0cmluZyBmb3IgYmV0dGVyIGVudHJvcHkuXG4gICAgICAgICAgICAgICAgdmFyIHJhbmRvbVN0cmluZyA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIpO1xuICAgICAgICAgICAgICAgIHdoaWxlIChyYW5kb21TdHJpbmcubGVuZ3RoIDwgMTApIHtcbiAgICAgICAgICAgICAgICAgICAgcmFuZG9tU3RyaW5nID0gcmFuZG9tU3RyaW5nICsgJzAnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmFuZG9tU3RyaW5nLnNsaWNlKC0xMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciB1c2VyIGRhdGEuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ1VzZXJTZXJ2aWNlJywgW1xuICAgICckaHR0cCcsICckcScsICckd2luZG93JywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgJ1VzZXJJbmZvT2JqZWN0RmFjdG9yeScsXG4gICAgJ0RFRkFVTFRfUFJPRklMRV9JTUFHRV9QQVRIJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsICRxLCAkd2luZG93LCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgVXNlckluZm9PYmplY3RGYWN0b3J5LCBERUZBVUxUX1BST0ZJTEVfSU1BR0VfUEFUSCkge1xuICAgICAgICB2YXIgUFJFRkVSRU5DRVNfREFUQV9VUkwgPSAnL3ByZWZlcmVuY2VzaGFuZGxlci9kYXRhJztcbiAgICAgICAgdmFyIHVzZXJJbmZvID0gbnVsbDtcbiAgICAgICAgdmFyIGdldFVzZXJJbmZvQXN5bmMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoR0xPQkFMUy51c2VySXNMb2dnZWRJbikge1xuICAgICAgICAgICAgICAgIGlmICh1c2VySW5mbykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVzb2x2ZSh1c2VySW5mbyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy91c2VyaW5mb2hhbmRsZXInKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICB1c2VySW5mbyA9IFVzZXJJbmZvT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3QocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1c2VySW5mbztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZXNvbHZlKFVzZXJJbmZvT2JqZWN0RmFjdG9yeS5jcmVhdGVEZWZhdWx0KCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ2V0UHJvZmlsZUltYWdlRGF0YVVybEFzeW5jOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHByb2ZpbGVQaWN0dXJlRGF0YVVybCA9IChVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRTdGF0aWNJbWFnZVVybChERUZBVUxUX1BST0ZJTEVfSU1BR0VfUEFUSCkpO1xuICAgICAgICAgICAgICAgIGlmIChHTE9CQUxTLnVzZXJJc0xvZ2dlZEluKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9wcmVmZXJlbmNlc2hhbmRsZXIvcHJvZmlsZV9waWN0dXJlJykudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5kYXRhLnByb2ZpbGVfcGljdHVyZV9kYXRhX3VybCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVQaWN0dXJlRGF0YVVybCA9IHJlc3BvbnNlLmRhdGEucHJvZmlsZV9waWN0dXJlX2RhdGFfdXJsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb2ZpbGVQaWN0dXJlRGF0YVVybDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVzb2x2ZShwcm9maWxlUGljdHVyZURhdGFVcmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXRQcm9maWxlSW1hZ2VEYXRhVXJsQXN5bmM6IGZ1bmN0aW9uIChuZXdQcm9maWxlSW1hZ2VEYXRhVXJsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwLnB1dChQUkVGRVJFTkNFU19EQVRBX1VSTCwge1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVfdHlwZTogJ3Byb2ZpbGVfcGljdHVyZV9kYXRhX3VybCcsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IG5ld1Byb2ZpbGVJbWFnZURhdGFVcmxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRMb2dpblVybEFzeW5jOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHVybFBhcmFtZXRlcnMgPSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfdXJsOiAkd2luZG93LmxvY2F0aW9uLmhyZWZcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy91cmxfaGFuZGxlcicsIHsgcGFyYW1zOiB1cmxQYXJhbWV0ZXJzIH0pLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhLmxvZ2luX3VybDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRVc2VySW5mb0FzeW5jOiBnZXRVc2VySW5mb0FzeW5jXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iXSwic291cmNlUm9vdCI6IiJ9