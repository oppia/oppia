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
/******/ 		"story_viewer": 0
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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/story-viewer-page/story-viewer-page.scripts.ts","vendors~about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboar~7856c05a","about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboard~donate~e06a4a17","collection_player~creator_dashboard~learner_dashboard~library~profile~story_viewer","collection_player~learner_dashboard~library~profile~story_viewer"]);
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

/***/ "./core/templates/dev/head/components/common-layout-directives/common-elements/attribution-guide.directive.ts":
/*!********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/common-elements/attribution-guide.directive.ts ***!
  \********************************************************************************************************************/
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
 * @fileoverview Directive for the attribution guide.
 */
__webpack_require__(/*! domain/utilities/BrowserCheckerService.ts */ "./core/templates/dev/head/domain/utilities/BrowserCheckerService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('attributionGuide', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/common-layout-directives/common-elements/' +
                'attribution-guide.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                'BrowserCheckerService', 'UrlService', function (BrowserCheckerService, UrlService) {
                    var ctrl = this;
                    ctrl.isMobileDevice = BrowserCheckerService.isMobileDevice();
                    ctrl.iframed = UrlService.isIframed();
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

/***/ "./core/templates/dev/head/domain/story_viewer/ReadOnlyStoryNodeObjectFactory.ts":
/*!***************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/story_viewer/ReadOnlyStoryNodeObjectFactory.ts ***!
  \***************************************************************************************/
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
 * @fileoverview Factory for storing frontend story node domain objects in the
 * story viewer.
 */
angular.module('oppia').factory('ReadOnlyStoryNodeObjectFactory', [function () {
        var StoryNode = function (id, title, destinationNodeIds, prerequisiteSkillIds, acquiredSkillIds, outline, outlineIsFinalized, explorationId, explorationSummary, completed) {
            this._id = id;
            this._title = title;
            this._destinationNodeIds = destinationNodeIds;
            this._prerequisiteSkillIds = prerequisiteSkillIds;
            this._acquiredSkillIds = acquiredSkillIds;
            this._outline = outline;
            this._outlineIsFinalized = outlineIsFinalized;
            this._explorationId = explorationId;
            this._explorationSummaryObject = explorationSummary;
            this._completed = completed;
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
        StoryNode.prototype.isCompleted = function () {
            return this._completed;
        };
        StoryNode.prototype.getExplorationSummaryObject = function () {
            return this._explorationSummaryObject;
        };
        StoryNode.prototype.getOutline = function () {
            return this._outline;
        };
        StoryNode.prototype.getOutlineStatus = function () {
            return this._outlineIsFinalized;
        };
        // Static class methods. Note that "this" is not available in static
        // contexts. This function takes a JSON object which represents a backend
        // story python dict.
        // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        StoryNode['createFromBackendDict'] = function (storyNodeBackendObject) {
            /* eslint-enable dot-notation */
            return new StoryNode(storyNodeBackendObject.id, storyNodeBackendObject.title, storyNodeBackendObject.destination_node_ids, storyNodeBackendObject.prerequisite_skill_ids, storyNodeBackendObject.acquired_skill_ids, storyNodeBackendObject.outline, storyNodeBackendObject.outline_is_finalized, storyNodeBackendObject.exploration_id, storyNodeBackendObject.exp_summary_dict, storyNodeBackendObject.completed);
        };
        return StoryNode;
    }]);


/***/ }),

/***/ "./core/templates/dev/head/domain/story_viewer/StoryPlaythroughObjectFactory.ts":
/*!**************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/story_viewer/StoryPlaythroughObjectFactory.ts ***!
  \**************************************************************************************/
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
 * @fileoverview Factory for creating and mutating instances of frontend
 * story playthrough domain objects.
 */
__webpack_require__(/*! domain/story_viewer/ReadOnlyStoryNodeObjectFactory.ts */ "./core/templates/dev/head/domain/story_viewer/ReadOnlyStoryNodeObjectFactory.ts");
angular.module('oppia').factory('StoryPlaythroughObjectFactory', [
    'ReadOnlyStoryNodeObjectFactory', function (ReadOnlyStoryNodeObjectFactory) {
        // Stores information about a current playthrough of a story for a
        // user.
        var StoryPlaythrough = function (nodes) {
            this._nodes = nodes;
        };
        StoryPlaythrough.prototype.getInitialNode = function () {
            return this._nodes[0];
        };
        StoryPlaythrough.prototype.getStoryNodeCount = function () {
            return this._nodes.length;
        };
        StoryPlaythrough.prototype.getStoryNodes = function () {
            return this._nodes;
        };
        StoryPlaythrough.prototype.hasFinishedStory = function () {
            return this._nodes.slice(-1)[0].isCompleted();
        };
        StoryPlaythrough.prototype.getNextPendingNodeId = function () {
            for (var i = 0; i < this._nodes.length; i++) {
                if (!this._nodes[i].isCompleted()) {
                    return this._nodes[i].getId();
                }
            }
        };
        StoryPlaythrough.prototype.hasStartedStory = function () {
            return this._nodes[0].isCompleted();
        };
        // Static class methods. Note that "this" is not available in static
        // contexts. This function takes a JSON object which represents a backend
        // story playthrough python dict.
        // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        StoryPlaythrough['createFromBackendDict'] = function (
        /* eslint-enable dot-notation */
        storyPlaythroughBackendObject) {
            var nodeObjects = [];
            nodeObjects = storyPlaythroughBackendObject.story_nodes.map(function (node) {
                return ReadOnlyStoryNodeObjectFactory.createFromBackendDict(node);
            });
            return new StoryPlaythrough(nodeObjects);
        };
        return StoryPlaythrough;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/story_viewer/StoryViewerBackendApiService.ts":
/*!*************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/story_viewer/StoryViewerBackendApiService.ts ***!
  \*************************************************************************************/
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
 * @fileoverview Service to get story data.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! domain/story_viewer/story-viewer-domain.constants.ajs.ts */ "./core/templates/dev/head/domain/story_viewer/story-viewer-domain.constants.ajs.ts");
angular.module('oppia').factory('StoryViewerBackendApiService', [
    '$http', '$q', 'UrlInterpolationService', 'STORY_DATA_URL_TEMPLATE',
    'STORY_NODE_COMPLETION_URL_TEMPLATE',
    function ($http, $q, UrlInterpolationService, STORY_DATA_URL_TEMPLATE, STORY_NODE_COMPLETION_URL_TEMPLATE) {
        var storyDataDict = null;
        var _fetchStoryData = function (storyId, successCallback, errorCallback) {
            var storyDataUrl = UrlInterpolationService.interpolateUrl(STORY_DATA_URL_TEMPLATE, {
                story_id: storyId
            });
            $http.get(storyDataUrl).then(function (response) {
                storyDataDict = angular.copy(response.data);
                if (successCallback) {
                    successCallback(storyDataDict);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _recordStoryNodeCompletion = function (storyId, nodeId, successCallback, errorCallback) {
            var storyNodeCompletionUrl = UrlInterpolationService.interpolateUrl(STORY_NODE_COMPLETION_URL_TEMPLATE, {
                story_id: storyId,
                node_id: nodeId
            });
            $http.post(storyNodeCompletionUrl).then(function (response) {
                if (successCallback) {
                    successCallback();
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        return {
            fetchStoryData: function (storyId) {
                return $q(function (resolve, reject) {
                    _fetchStoryData(storyId, resolve, reject);
                });
            },
            recordStoryNodeCompletion: function (storyId, nodeId) {
                return $q(function (resolve, reject) {
                    _recordStoryNodeCompletion(storyId, nodeId, resolve, reject);
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/story_viewer/story-viewer-domain.constants.ajs.ts":
/*!******************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/story_viewer/story-viewer-domain.constants.ajs.ts ***!
  \******************************************************************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Constants for story viewer domain.
 */
// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
var story_viewer_domain_constants_1 = __webpack_require__(/*! domain/story_viewer/story-viewer-domain.constants */ "./core/templates/dev/head/domain/story_viewer/story-viewer-domain.constants.ts");
angular.module('oppia').constant('STORY_DATA_URL_TEMPLATE', story_viewer_domain_constants_1.StoryViewerDomainConstants.STORY_DATA_URL_TEMPLATE);
angular.module('oppia').constant('STORY_NODE_COMPLETION_URL_TEMPLATE', story_viewer_domain_constants_1.StoryViewerDomainConstants.STORY_NODE_COMPLETION_URL_TEMPLATE);


/***/ }),

/***/ "./core/templates/dev/head/domain/story_viewer/story-viewer-domain.constants.ts":
/*!**************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/story_viewer/story-viewer-domain.constants.ts ***!
  \**************************************************************************************/
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
 * @fileoverview Constants for story viewer domain.
 */
var StoryViewerDomainConstants = /** @class */ (function () {
    function StoryViewerDomainConstants() {
    }
    StoryViewerDomainConstants.STORY_DATA_URL_TEMPLATE = '/story_data_handler/<story_id>';
    StoryViewerDomainConstants.STORY_NODE_COMPLETION_URL_TEMPLATE = '/story_node_completion_handler/<story_id>/<node_id>';
    return StoryViewerDomainConstants;
}());
exports.StoryViewerDomainConstants = StoryViewerDomainConstants;


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

/***/ "./core/templates/dev/head/pages/story-viewer-page/chapters-list/story-viewer-chapters-list.directive.ts":
/*!***************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-viewer-page/chapters-list/story-viewer-chapters-list.directive.ts ***!
  \***************************************************************************************************************/
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
 * @fileoverview Directive for the learner's view of a story.
 */
__webpack_require__(/*! components/common-layout-directives/common-elements/attribution-guide.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/common-elements/attribution-guide.directive.ts");
__webpack_require__(/*! components/summary-tile/exploration-summary-tile.directive.ts */ "./core/templates/dev/head/components/summary-tile/exploration-summary-tile.directive.ts");
__webpack_require__(/*! domain/story_viewer/StoryPlaythroughObjectFactory.ts */ "./core/templates/dev/head/domain/story_viewer/StoryPlaythroughObjectFactory.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/PageTitleService.ts */ "./core/templates/dev/head/services/PageTitleService.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
angular.module('oppia').animation('.oppia-story-animate-slide', function () {
    return {
        enter: function (element) {
            element.hide().slideDown();
        },
        leave: function (element) {
            element.slideUp();
        }
    };
});
angular.module('oppia').directive('storyViewerChaptersList', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                getPlaythroughObject: '&playthroughObject'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-viewer-page/chapters-list' +
                '/story-viewer-chapters-list.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$anchorScroll', '$http', '$location', 'AlertsService',
                'PageTitleService', 'StoryPlaythroughObjectFactory',
                'UrlInterpolationService', 'UrlService', 'UserService',
                function ($anchorScroll, $http, $location, AlertsService, PageTitleService, StoryPlaythroughObjectFactory, UrlInterpolationService, UrlService, UserService) {
                    var ctrl = this;
                    ctrl.storyPlaythroughObject = ctrl.getPlaythroughObject();
                    UserService.getUserInfoAsync().then(function (userInfo) {
                        ctrl.isLoggedIn = userInfo.isLoggedIn();
                    });
                    ctrl.explorationCardIsShown = false;
                    ctrl.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;
                    // The pathIconParameters is an array containing the co-ordinates,
                    // background color and icon url for the icons generated on the path.
                    ctrl.pathIconParameters = [];
                    ctrl.activeHighlightedIconIndex = -1;
                    ctrl.MIN_HEIGHT_FOR_PATH_SVG_PX = 220;
                    ctrl.ODD_SVG_HEIGHT_OFFSET_PX = 150;
                    ctrl.EVEN_SVG_HEIGHT_OFFSET_PX = 280;
                    ctrl.ICON_Y_INITIAL_PX = 35;
                    ctrl.ICON_Y_INCREMENT_PX = 110;
                    ctrl.ICON_X_MIDDLE_PX = 225;
                    ctrl.ICON_X_LEFT_PX = 55;
                    ctrl.ICON_X_RIGHT_PX = 395;
                    ctrl.svgHeight = ctrl.MIN_HEIGHT_FOR_PATH_SVG_PX;
                    ctrl.nextExplorationId = null;
                    $anchorScroll.yOffset = -80;
                    ctrl.setIconHighlight = function (index) {
                        ctrl.activeHighlightedIconIndex = index;
                    };
                    ctrl.unsetIconHighlight = function () {
                        ctrl.activeHighlightedIconIndex = -1;
                    };
                    ctrl.togglePreviewCard = function () {
                        ctrl.explorationCardIsShown = !ctrl.explorationCardIsShown;
                    };
                    ctrl.updateExplorationPreview = function (storyNode) {
                        ctrl.explorationCardIsShown = true;
                        ctrl.currentExplorationId = storyNode.getExplorationId();
                        ctrl.summaryToPreview = storyNode.getExplorationSummaryObject();
                        ctrl.completedNode = storyNode.isCompleted();
                        ctrl.isNextPendingNode = (ctrl.storyPlaythroughObject.getNextPendingNodeId() ===
                            storyNode.getId());
                        ctrl.currentNodeId = storyNode.getId();
                    };
                    // Calculates the SVG parameters required to draw the curved path.
                    ctrl.generatePathParameters = function () {
                        // The pathSvgParameters represents the final string of SVG
                        // parameters for the bezier curve to be generated. The default
                        // parameters represent the first curve ie. lesson 1 to lesson 3.
                        ctrl.pathSvgParameters = 'M250 80  C 470 100, 470 280, 250 300';
                        var storyNodeCount = ctrl.storyPlaythroughObject.getStoryNodeCount();
                        // The sParameterExtension represents the co-ordinates following
                        // the 'S' (smooth curve to) command in SVG.
                        var sParameterExtension = '';
                        ctrl.pathIconParameters = ctrl.generatePathIconParameters();
                        if (storyNodeCount === 1) {
                            ctrl.pathSvgParameters = '';
                        }
                        else if (storyNodeCount === 2) {
                            ctrl.pathSvgParameters = 'M250 80  C 470 100, 470 280, 250 300';
                        }
                        else {
                            // The x and y here represent the co-ordinates of the control
                            // points for the bezier curve (path).
                            var y = 500;
                            for (var i = 1; i < Math.floor(storyNodeCount / 2); i++) {
                                var x = (i % 2) ? 30 : 470;
                                sParameterExtension += x + ' ' + y + ', ';
                                y += 20;
                                sParameterExtension += 250 + ' ' + y + ', ';
                                y += 200;
                            }
                            if (sParameterExtension !== '') {
                                ctrl.pathSvgParameters += ' S ' + sParameterExtension;
                            }
                        }
                        if (storyNodeCount % 2 === 0) {
                            if (storyNodeCount === 2) {
                                ctrl.svgHeight = ctrl.MIN_HEIGHT_FOR_PATH_SVG_PX;
                            }
                            else {
                                ctrl.svgHeight = y - ctrl.EVEN_SVG_HEIGHT_OFFSET_PX;
                            }
                        }
                        else {
                            if (storyNodeCount === 1) {
                                ctrl.svgHeight = ctrl.MIN_HEIGHT_FOR_PATH_SVG_PX;
                            }
                            else {
                                ctrl.svgHeight = y - ctrl.ODD_SVG_HEIGHT_OFFSET_PX;
                            }
                        }
                    };
                    ctrl.generatePathIconParameters = function () {
                        var storyNodes = ctrl.storyPlaythroughObject.getStoryNodes();
                        var iconParametersArray = [];
                        iconParametersArray.push({
                            thumbnailIconUrl: storyNodes[0].getExplorationSummaryObject().thumbnail_icon_url.replace('subjects', 'inverted_subjects'),
                            left: '225px',
                            top: '35px',
                            thumbnailBgColor: storyNodes[0].getExplorationSummaryObject().thumbnail_bg_color
                        });
                        // Here x and y represent the co-ordinates for the icons in the
                        // path.
                        var x = ctrl.ICON_X_MIDDLE_PX;
                        var y = ctrl.ICON_Y_INITIAL_PX;
                        var countMiddleIcon = 1;
                        for (var i = 1; i < ctrl.storyPlaythroughObject.getStoryNodeCount(); i++) {
                            if (countMiddleIcon === 0 && x === ctrl.ICON_X_MIDDLE_PX) {
                                x = ctrl.ICON_X_LEFT_PX;
                                y += ctrl.ICON_Y_INCREMENT_PX;
                                countMiddleIcon = 1;
                            }
                            else if (countMiddleIcon === 1 && x === ctrl.ICON_X_MIDDLE_PX) {
                                x = ctrl.ICON_X_RIGHT_PX;
                                y += ctrl.ICON_Y_INCREMENT_PX;
                                countMiddleIcon = 0;
                            }
                            else {
                                x = ctrl.ICON_X_MIDDLE_PX;
                                y += ctrl.ICON_Y_INCREMENT_PX;
                            }
                            iconParametersArray.push({
                                thumbnailIconUrl: storyNodes[i].getExplorationSummaryObject().thumbnail_icon_url.replace('subjects', 'inverted_subjects'),
                                left: x + 'px',
                                top: y + 'px',
                                thumbnailBgColor: storyNodes[i].getExplorationSummaryObject().thumbnail_bg_color
                            });
                        }
                        return iconParametersArray;
                    };
                    ctrl.getExplorationUrl = function (node) {
                        if (!ctrl.isNextPendingNode) {
                            return null;
                        }
                        var result = '/explore/' + node.getExplorationId();
                        result = UrlService.addField(result, 'story_id', UrlService.getStoryIdFromViewerUrl());
                        result = UrlService.addField(result, 'node_id', ctrl.currentNodeId);
                        return result;
                    };
                    ctrl.scrollToLocation = function (id) {
                        $location.hash(id);
                        $anchorScroll();
                    };
                    ctrl.closeOnClickingOutside = function () {
                        ctrl.explorationCardIsShown = false;
                    };
                    ctrl.onClickStopPropagation = function ($evt) {
                        $evt.stopPropagation();
                    };
                    // Touching anywhere outside the mobile preview should hide it.
                    document.addEventListener('touchstart', function () {
                        if (ctrl.explorationCardIsShown === true) {
                            ctrl.explorationCardIsShown = false;
                        }
                    });
                    ctrl.generatePathParameters();
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/story-viewer-page/navbar-breadcrumb/story-viewer-navbar-breadcrumb.directive.ts":
/*!***********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-viewer-page/navbar-breadcrumb/story-viewer-navbar-breadcrumb.directive.ts ***!
  \***********************************************************************************************************************/
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
 * @fileoverview Directive for the navbar breadcrumb of the story viewer.
 */
__webpack_require__(/*! domain/story_viewer/StoryViewerBackendApiService.ts */ "./core/templates/dev/head/domain/story_viewer/StoryViewerBackendApiService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
angular.module('oppia').directive('storyViewerNavbarBreadcrumb', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-viewer-page/navbar-breadcrumb/' +
                'story-viewer-navbar-breadcrumb.directive.html'),
            controllerAs: '$ctrl',
            controller: ['StoryViewerBackendApiService', 'UrlService',
                function (StoryViewerBackendApiService, UrlService) {
                    var ctrl = this;
                    StoryViewerBackendApiService.fetchStoryData(UrlService.getStoryIdFromViewerUrl()).then(function (storyDataDict) {
                        ctrl.storyTitle = storyDataDict.story_title;
                    });
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/story-viewer-page/story-viewer-page.directive.ts":
/*!****************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-viewer-page/story-viewer-page.directive.ts ***!
  \****************************************************************************************/
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
 * @fileoverview Directive for the main page of the story viewer.
 */
__webpack_require__(/*! components/common-layout-directives/common-elements/background-banner.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/common-elements/background-banner.directive.ts");
__webpack_require__(/*! pages/story-viewer-page/navbar-breadcrumb/story-viewer-navbar-breadcrumb.directive.ts */ "./core/templates/dev/head/pages/story-viewer-page/navbar-breadcrumb/story-viewer-navbar-breadcrumb.directive.ts");
__webpack_require__(/*! pages/story-viewer-page/chapters-list/story-viewer-chapters-list.directive.ts */ "./core/templates/dev/head/pages/story-viewer-page/chapters-list/story-viewer-chapters-list.directive.ts");
__webpack_require__(/*! domain/story_viewer/StoryPlaythroughObjectFactory.ts */ "./core/templates/dev/head/domain/story_viewer/StoryPlaythroughObjectFactory.ts");
__webpack_require__(/*! domain/story_viewer/StoryViewerBackendApiService.ts */ "./core/templates/dev/head/domain/story_viewer/StoryViewerBackendApiService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/PageTitleService.ts */ "./core/templates/dev/head/services/PageTitleService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
angular.module('oppia').directive('storyViewerPage', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/story-viewer-page/story-viewer-page.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$rootScope', '$window', 'AlertsService',
                'PageTitleService', 'StoryPlaythroughObjectFactory',
                'StoryViewerBackendApiService', 'UrlService', 'FATAL_ERROR_CODES',
                function ($rootScope, $window, AlertsService, PageTitleService, StoryPlaythroughObjectFactory, StoryViewerBackendApiService, UrlService, FATAL_ERROR_CODES) {
                    var ctrl = this;
                    ctrl.checkMobileView = function () {
                        return ($window.innerWidth < 500);
                    };
                    ctrl.storyIsLoaded = false;
                    $rootScope.loadingMessage = 'Loading';
                    var storyId = UrlService.getStoryIdFromViewerUrl();
                    StoryViewerBackendApiService.fetchStoryData(storyId).then(function (storyDataDict) {
                        ctrl.storyIsLoaded = true;
                        ctrl.storyPlaythroughObject =
                            StoryPlaythroughObjectFactory.createFromBackendDict(storyDataDict);
                        PageTitleService.setPageTitle(storyDataDict.story_title + ' - Oppia');
                        ctrl.storyTitle = storyDataDict.story_title;
                        ctrl.storyDescription = storyDataDict.story_description;
                        $rootScope.loadingMessage = '';
                    }, function (errorResponse) {
                        if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
                            AlertsService.addWarning('Failed to get dashboard data');
                        }
                    });
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/story-viewer-page/story-viewer-page.module.ts":
/*!*************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-viewer-page/story-viewer-page.module.ts ***!
  \*************************************************************************************/
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
 * @fileoverview Module for the story viewer page.
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
var story_viewer_domain_constants_1 = __webpack_require__(/*! domain/story_viewer/story-viewer-domain.constants */ "./core/templates/dev/head/domain/story_viewer/story-viewer-domain.constants.ts");
var StoryViewerPageModule = /** @class */ (function () {
    function StoryViewerPageModule() {
    }
    // Empty placeholder method to satisfy the `Compiler`.
    StoryViewerPageModule.prototype.ngDoBootstrap = function () { };
    StoryViewerPageModule = __decorate([
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
                story_viewer_domain_constants_1.StoryViewerDomainConstants,
            ]
        })
    ], StoryViewerPageModule);
    return StoryViewerPageModule;
}());
var platform_browser_dynamic_1 = __webpack_require__(/*! @angular/platform-browser-dynamic */ "./node_modules/@angular/platform-browser-dynamic/fesm5/platform-browser-dynamic.js");
var static_2 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var bootstrapFn = function (extraProviders) {
    var platformRef = platform_browser_dynamic_1.platformBrowserDynamic(extraProviders);
    return platformRef.bootstrapModule(StoryViewerPageModule);
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

/***/ "./core/templates/dev/head/pages/story-viewer-page/story-viewer-page.scripts.ts":
/*!**************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-viewer-page/story-viewer-page.scripts.ts ***!
  \**************************************************************************************/
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
 * @fileoverview Scripts required in story viewer.
 */
// The module needs to be loaded before everything else since it defines the
// main module the elements are attached to.
__webpack_require__(/*! pages/story-viewer-page/story-viewer-page.module.ts */ "./core/templates/dev/head/pages/story-viewer-page/story-viewer-page.module.ts");
__webpack_require__(/*! App.ts */ "./core/templates/dev/head/App.ts");
__webpack_require__(/*! base_components/BaseContentDirective.ts */ "./core/templates/dev/head/base_components/BaseContentDirective.ts");
__webpack_require__(/*! pages/story-viewer-page/story-viewer-page.directive.ts */ "./core/templates/dev/head/pages/story-viewer-page/story-viewer-page.directive.ts");


/***/ }),

/***/ "./core/templates/dev/head/services/PageTitleService.ts":
/*!**************************************************************!*\
  !*** ./core/templates/dev/head/services/PageTitleService.ts ***!
  \**************************************************************/
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Service to set the title of the page.
 */
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var platform_browser_1 = __webpack_require__(/*! @angular/platform-browser */ "./node_modules/@angular/platform-browser/fesm5/platform-browser.js");
var PageTitleService = /** @class */ (function () {
    function PageTitleService(titleService) {
        this.titleService = titleService;
    }
    PageTitleService.prototype.setPageTitle = function (title) {
        this.titleService.setTitle(title);
    };
    var _a;
    PageTitleService = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        }),
        __metadata("design:paramtypes", [typeof (_a = typeof platform_browser_1.Title !== "undefined" && platform_browser_1.Title) === "function" ? _a : Object])
    ], PageTitleService);
    return PageTitleService;
}());
exports.PageTitleService = PageTitleService;
angular.module('oppia').factory('PageTitleService', static_1.downgradeInjectable(PageTitleService));


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvYmFzZV9jb21wb25lbnRzL0Jhc2VDb250ZW50RGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2Jhc2VfY29tcG9uZW50cy9XYXJuaW5nTG9hZGVyRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2NvbW1vbi1lbGVtZW50cy9hdHRyaWJ1dGlvbi1ndWlkZS5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvY29tbW9uLWVsZW1lbnRzL2JhY2tncm91bmQtYmFubmVyLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vb2JqZWN0cy9vYmplY3RzLWRvbWFpbi5jb25zdGFudHMudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3N0b3J5X3ZpZXdlci9SZWFkT25seVN0b3J5Tm9kZU9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3N0b3J5X3ZpZXdlci9TdG9yeVBsYXl0aHJvdWdoT2JqZWN0RmFjdG9yeS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vc3Rvcnlfdmlld2VyL1N0b3J5Vmlld2VyQmFja2VuZEFwaVNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3N0b3J5X3ZpZXdlci9zdG9yeS12aWV3ZXItZG9tYWluLmNvbnN0YW50cy5hanMudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3N0b3J5X3ZpZXdlci9zdG9yeS12aWV3ZXItZG9tYWluLmNvbnN0YW50cy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9PcHBpYUZvb3RlckRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9zdG9yeS12aWV3ZXItcGFnZS9jaGFwdGVycy1saXN0L3N0b3J5LXZpZXdlci1jaGFwdGVycy1saXN0LmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9zdG9yeS12aWV3ZXItcGFnZS9uYXZiYXItYnJlYWRjcnVtYi9zdG9yeS12aWV3ZXItbmF2YmFyLWJyZWFkY3J1bWIuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3N0b3J5LXZpZXdlci1wYWdlL3N0b3J5LXZpZXdlci1wYWdlLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9zdG9yeS12aWV3ZXItcGFnZS9zdG9yeS12aWV3ZXItcGFnZS5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvc3Rvcnktdmlld2VyLXBhZ2Uvc3Rvcnktdmlld2VyLXBhZ2Uuc2NyaXB0cy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9QYWdlVGl0bGVTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2V4dGVuc2lvbnMvaW50ZXJhY3Rpb25zL2ludGVyYWN0aW9ucy1leHRlbnNpb24uY29uc3RhbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFD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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQThDLGNBQWM7QUFDNUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEOzs7Ozs7Ozs7Ozs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7Ozs7Ozs7Ozs7OztBQzlETDtBQUNB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QTtBQUNBO0FBQ0EsNENBQTRDLFFBQVE7QUFDcEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhDQUE4QyxjQUFjO0FBQzVEO0FBQ0E7QUFDQTtBQUNBLGVBQWUsbUJBQU8sQ0FBQyw4RkFBeUI7QUFDaEQsYUFBYSxtQkFBTyxDQUFDLGlFQUFlO0FBQ3BDLHlCQUF5QixtQkFBTyxDQUFDLHFHQUEyQjtBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBOzs7Ozs7Ozs7Ozs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4Q0FBOEMsY0FBYztBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEIiwiZmlsZSI6InN0b3J5X3ZpZXdlci5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBpbnN0YWxsIGEgSlNPTlAgY2FsbGJhY2sgZm9yIGNodW5rIGxvYWRpbmdcbiBcdGZ1bmN0aW9uIHdlYnBhY2tKc29ucENhbGxiYWNrKGRhdGEpIHtcbiBcdFx0dmFyIGNodW5rSWRzID0gZGF0YVswXTtcbiBcdFx0dmFyIG1vcmVNb2R1bGVzID0gZGF0YVsxXTtcbiBcdFx0dmFyIGV4ZWN1dGVNb2R1bGVzID0gZGF0YVsyXTtcblxuIFx0XHQvLyBhZGQgXCJtb3JlTW9kdWxlc1wiIHRvIHRoZSBtb2R1bGVzIG9iamVjdCxcbiBcdFx0Ly8gdGhlbiBmbGFnIGFsbCBcImNodW5rSWRzXCIgYXMgbG9hZGVkIGFuZCBmaXJlIGNhbGxiYWNrXG4gXHRcdHZhciBtb2R1bGVJZCwgY2h1bmtJZCwgaSA9IDAsIHJlc29sdmVzID0gW107XG4gXHRcdGZvcig7aSA8IGNodW5rSWRzLmxlbmd0aDsgaSsrKSB7XG4gXHRcdFx0Y2h1bmtJZCA9IGNodW5rSWRzW2ldO1xuIFx0XHRcdGlmKGluc3RhbGxlZENodW5rc1tjaHVua0lkXSkge1xuIFx0XHRcdFx0cmVzb2x2ZXMucHVzaChpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF1bMF0pO1xuIFx0XHRcdH1cbiBcdFx0XHRpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0gPSAwO1xuIFx0XHR9XG4gXHRcdGZvcihtb2R1bGVJZCBpbiBtb3JlTW9kdWxlcykge1xuIFx0XHRcdGlmKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtb3JlTW9kdWxlcywgbW9kdWxlSWQpKSB7XG4gXHRcdFx0XHRtb2R1bGVzW21vZHVsZUlkXSA9IG1vcmVNb2R1bGVzW21vZHVsZUlkXTtcbiBcdFx0XHR9XG4gXHRcdH1cbiBcdFx0aWYocGFyZW50SnNvbnBGdW5jdGlvbikgcGFyZW50SnNvbnBGdW5jdGlvbihkYXRhKTtcblxuIFx0XHR3aGlsZShyZXNvbHZlcy5sZW5ndGgpIHtcbiBcdFx0XHRyZXNvbHZlcy5zaGlmdCgpKCk7XG4gXHRcdH1cblxuIFx0XHQvLyBhZGQgZW50cnkgbW9kdWxlcyBmcm9tIGxvYWRlZCBjaHVuayB0byBkZWZlcnJlZCBsaXN0XG4gXHRcdGRlZmVycmVkTW9kdWxlcy5wdXNoLmFwcGx5KGRlZmVycmVkTW9kdWxlcywgZXhlY3V0ZU1vZHVsZXMgfHwgW10pO1xuXG4gXHRcdC8vIHJ1biBkZWZlcnJlZCBtb2R1bGVzIHdoZW4gYWxsIGNodW5rcyByZWFkeVxuIFx0XHRyZXR1cm4gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKTtcbiBcdH07XG4gXHRmdW5jdGlvbiBjaGVja0RlZmVycmVkTW9kdWxlcygpIHtcbiBcdFx0dmFyIHJlc3VsdDtcbiBcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGRlZmVycmVkTW9kdWxlcy5sZW5ndGg7IGkrKykge1xuIFx0XHRcdHZhciBkZWZlcnJlZE1vZHVsZSA9IGRlZmVycmVkTW9kdWxlc1tpXTtcbiBcdFx0XHR2YXIgZnVsZmlsbGVkID0gdHJ1ZTtcbiBcdFx0XHRmb3IodmFyIGogPSAxOyBqIDwgZGVmZXJyZWRNb2R1bGUubGVuZ3RoOyBqKyspIHtcbiBcdFx0XHRcdHZhciBkZXBJZCA9IGRlZmVycmVkTW9kdWxlW2pdO1xuIFx0XHRcdFx0aWYoaW5zdGFsbGVkQ2h1bmtzW2RlcElkXSAhPT0gMCkgZnVsZmlsbGVkID0gZmFsc2U7XG4gXHRcdFx0fVxuIFx0XHRcdGlmKGZ1bGZpbGxlZCkge1xuIFx0XHRcdFx0ZGVmZXJyZWRNb2R1bGVzLnNwbGljZShpLS0sIDEpO1xuIFx0XHRcdFx0cmVzdWx0ID0gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSBkZWZlcnJlZE1vZHVsZVswXSk7XG4gXHRcdFx0fVxuIFx0XHR9XG5cbiBcdFx0cmV0dXJuIHJlc3VsdDtcbiBcdH1cblxuIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gb2JqZWN0IHRvIHN0b3JlIGxvYWRlZCBhbmQgbG9hZGluZyBjaHVua3NcbiBcdC8vIHVuZGVmaW5lZCA9IGNodW5rIG5vdCBsb2FkZWQsIG51bGwgPSBjaHVuayBwcmVsb2FkZWQvcHJlZmV0Y2hlZFxuIFx0Ly8gUHJvbWlzZSA9IGNodW5rIGxvYWRpbmcsIDAgPSBjaHVuayBsb2FkZWRcbiBcdHZhciBpbnN0YWxsZWRDaHVua3MgPSB7XG4gXHRcdFwic3Rvcnlfdmlld2VyXCI6IDBcbiBcdH07XG5cbiBcdHZhciBkZWZlcnJlZE1vZHVsZXMgPSBbXTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0dmFyIGpzb25wQXJyYXkgPSB3aW5kb3dbXCJ3ZWJwYWNrSnNvbnBcIl0gPSB3aW5kb3dbXCJ3ZWJwYWNrSnNvbnBcIl0gfHwgW107XG4gXHR2YXIgb2xkSnNvbnBGdW5jdGlvbiA9IGpzb25wQXJyYXkucHVzaC5iaW5kKGpzb25wQXJyYXkpO1xuIFx0anNvbnBBcnJheS5wdXNoID0gd2VicGFja0pzb25wQ2FsbGJhY2s7XG4gXHRqc29ucEFycmF5ID0ganNvbnBBcnJheS5zbGljZSgpO1xuIFx0Zm9yKHZhciBpID0gMDsgaSA8IGpzb25wQXJyYXkubGVuZ3RoOyBpKyspIHdlYnBhY2tKc29ucENhbGxiYWNrKGpzb25wQXJyYXlbaV0pO1xuIFx0dmFyIHBhcmVudEpzb25wRnVuY3Rpb24gPSBvbGRKc29ucEZ1bmN0aW9uO1xuXG5cbiBcdC8vIGFkZCBlbnRyeSBtb2R1bGUgdG8gZGVmZXJyZWQgbGlzdFxuIFx0ZGVmZXJyZWRNb2R1bGVzLnB1c2goW1wiLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9zdG9yeS12aWV3ZXItcGFnZS9zdG9yeS12aWV3ZXItcGFnZS5zY3JpcHRzLnRzXCIsXCJ2ZW5kb3JzfmFib3V0fmFkbWlufmNvbGxlY3Rpb25fZWRpdG9yfmNvbGxlY3Rpb25fcGxheWVyfmNvbW11bml0eV9kYXNoYm9hcmR+Y29udGFjdH5jcmVhdG9yX2Rhc2hib2Fyfjc4NTZjMDVhXCIsXCJhYm91dH5hZG1pbn5jb2xsZWN0aW9uX2VkaXRvcn5jb2xsZWN0aW9uX3BsYXllcn5jb21tdW5pdHlfZGFzaGJvYXJkfmNvbnRhY3R+Y3JlYXRvcl9kYXNoYm9hcmR+ZG9uYXRlfmUwNmE0YTE3XCIsXCJjb2xsZWN0aW9uX3BsYXllcn5jcmVhdG9yX2Rhc2hib2FyZH5sZWFybmVyX2Rhc2hib2FyZH5saWJyYXJ5fnByb2ZpbGV+c3Rvcnlfdmlld2VyXCIsXCJjb2xsZWN0aW9uX3BsYXllcn5sZWFybmVyX2Rhc2hib2FyZH5saWJyYXJ5fnByb2ZpbGV+c3Rvcnlfdmlld2VyXCJdKTtcbiBcdC8vIHJ1biBkZWZlcnJlZCBtb2R1bGVzIHdoZW4gcmVhZHlcbiBcdHJldHVybiBjaGVja0RlZmVycmVkTW9kdWxlcygpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBCYXNlIFRyYW5zY2x1c2lvbiBDb21wb25lbnQuXG4gKi9cbnJlcXVpcmUoJ2Jhc2VfY29tcG9uZW50cy9XYXJuaW5nTG9hZGVyRGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9PcHBpYUZvb3RlckRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3NpZGViYXIvU2lkZWJhclN0YXR1c1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvVXJsU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvc3RhdGVmdWwvQmFja2dyb3VuZE1hc2tTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2Jhc2VDb250ZW50JywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0cmFuc2NsdWRlOiB7XG4gICAgICAgICAgICAgICAgYnJlYWRjcnVtYjogJz9uYXZiYXJCcmVhZGNydW1iJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiAnY29udGVudCcsXG4gICAgICAgICAgICAgICAgZm9vdGVyOiAnP3BhZ2VGb290ZXInLFxuICAgICAgICAgICAgICAgIG5hdk9wdGlvbnM6ICc/bmF2T3B0aW9ucycsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvYmFzZV9jb21wb25lbnRzL2Jhc2VfY29udGVudF9kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWyckcm9vdFNjb3BlJywgJ0JhY2tncm91bmRNYXNrU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ1NpZGViYXJTdGF0dXNTZXJ2aWNlJywgJ1VybFNlcnZpY2UnLCAnU0lURV9GRUVEQkFDS19GT1JNX1VSTCcsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRyb290U2NvcGUsIEJhY2tncm91bmRNYXNrU2VydmljZSwgU2lkZWJhclN0YXR1c1NlcnZpY2UsIFVybFNlcnZpY2UsIFNJVEVfRkVFREJBQ0tfRk9STV9VUkwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlmcmFtZWQgPSBVcmxTZXJ2aWNlLmlzSWZyYW1lZCgpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNpdGVGZWVkYmFja0Zvcm1VcmwgPSBTSVRFX0ZFRURCQUNLX0ZPUk1fVVJMO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlzU2lkZWJhclNob3duID0gU2lkZWJhclN0YXR1c1NlcnZpY2UuaXNTaWRlYmFyU2hvd247XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY2xvc2VTaWRlYmFyT25Td2lwZSA9IFNpZGViYXJTdGF0dXNTZXJ2aWNlLmNsb3NlU2lkZWJhcjtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc0JhY2tncm91bmRNYXNrQWN0aXZlID0gQmFja2dyb3VuZE1hc2tTZXJ2aWNlLmlzTWFza0FjdGl2ZTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5ERVZfTU9ERSA9ICRyb290U2NvcGUuREVWX01PREU7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2tpcFRvTWFpbkNvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWFpbkNvbnRlbnRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ29wcGlhLW1haW4tY29udGVudCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFtYWluQ29udGVudEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignVmFyaWFibGUgbWFpbkNvbnRlbnRFbGVtZW50IGlzIHVuZGVmaW5lZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG1haW5Db250ZW50RWxlbWVudC50YWJJbmRleCA9IC0xO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFpbkNvbnRlbnRFbGVtZW50LnNjcm9sbEludG9WaWV3KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYWluQ29udGVudEVsZW1lbnQuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3Igd2FybmluZ19sb2FkZXIuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnd2FybmluZ0xvYWRlcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvYmFzZV9jb21wb25lbnRzL3dhcm5pbmdfbG9hZGVyX2RpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJ0FsZXJ0c1NlcnZpY2UnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChBbGVydHNTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5BbGVydHNTZXJ2aWNlID0gQWxlcnRzU2VydmljZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIGF0dHJpYnV0aW9uIGd1aWRlLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL0Jyb3dzZXJDaGVja2VyU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdhdHRyaWJ1dGlvbkd1aWRlJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvY29tbW9uLWVsZW1lbnRzLycgK1xuICAgICAgICAgICAgICAgICdhdHRyaWJ1dGlvbi1ndWlkZS5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICdCcm93c2VyQ2hlY2tlclNlcnZpY2UnLCAnVXJsU2VydmljZScsIGZ1bmN0aW9uIChCcm93c2VyQ2hlY2tlclNlcnZpY2UsIFVybFNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlzTW9iaWxlRGV2aWNlID0gQnJvd3NlckNoZWNrZXJTZXJ2aWNlLmlzTW9iaWxlRGV2aWNlKCk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaWZyYW1lZCA9IFVybFNlcnZpY2UuaXNJZnJhbWVkKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBiYWNrZ3JvdW5kIGJhbm5lci5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdiYWNrZ3JvdW5kQmFubmVyJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvY29tbW9uLWVsZW1lbnRzLycgK1xuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWJhbm5lci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcG9zc2libGVCYW5uZXJGaWxlbmFtZXMgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAnYmFubmVyQS5zdmcnLCAnYmFubmVyQi5zdmcnLCAnYmFubmVyQy5zdmcnLCAnYmFubmVyRC5zdmcnXG4gICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgIHZhciBiYW5uZXJJbWFnZUZpbGVuYW1lID0gcG9zc2libGVCYW5uZXJGaWxlbmFtZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcG9zc2libGVCYW5uZXJGaWxlbmFtZXMubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuYmFubmVySW1hZ2VGaWxlVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmwoJy9iYWNrZ3JvdW5kLycgKyBiYW5uZXJJbWFnZUZpbGVuYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnN0YW50cyBmb3Igb2JqZWN0cyBkb21haW4uXG4gKi9cbnZhciBPYmplY3RzRG9tYWluQ29uc3RhbnRzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE9iamVjdHNEb21haW5Db25zdGFudHMoKSB7XG4gICAgfVxuICAgIE9iamVjdHNEb21haW5Db25zdGFudHMuRlJBQ1RJT05fUEFSU0lOR19FUlJPUlMgPSB7XG4gICAgICAgIElOVkFMSURfQ0hBUlM6ICdQbGVhc2Ugb25seSB1c2UgbnVtZXJpY2FsIGRpZ2l0cywgc3BhY2VzIG9yIGZvcndhcmQgc2xhc2hlcyAoLyknLFxuICAgICAgICBJTlZBTElEX0ZPUk1BVDogJ1BsZWFzZSBlbnRlciBhIHZhbGlkIGZyYWN0aW9uIChlLmcuLCA1LzMgb3IgMSAyLzMpJyxcbiAgICAgICAgRElWSVNJT05fQllfWkVSTzogJ1BsZWFzZSBkbyBub3QgcHV0IDAgaW4gdGhlIGRlbm9taW5hdG9yJ1xuICAgIH07XG4gICAgT2JqZWN0c0RvbWFpbkNvbnN0YW50cy5OVU1CRVJfV0lUSF9VTklUU19QQVJTSU5HX0VSUk9SUyA9IHtcbiAgICAgICAgSU5WQUxJRF9WQUxVRTogJ1BsZWFzZSBlbnN1cmUgdGhhdCB2YWx1ZSBpcyBlaXRoZXIgYSBmcmFjdGlvbiBvciBhIG51bWJlcicsXG4gICAgICAgIElOVkFMSURfQ1VSUkVOQ1k6ICdQbGVhc2UgZW50ZXIgYSB2YWxpZCBjdXJyZW5jeSAoZS5nLiwgJDUgb3IgUnMgNSknLFxuICAgICAgICBJTlZBTElEX0NVUlJFTkNZX0ZPUk1BVDogJ1BsZWFzZSB3cml0ZSBjdXJyZW5jeSB1bml0cyBhdCB0aGUgYmVnaW5uaW5nJyxcbiAgICAgICAgSU5WQUxJRF9VTklUX0NIQVJTOiAnUGxlYXNlIGVuc3VyZSB0aGF0IHVuaXQgb25seSBjb250YWlucyBudW1iZXJzLCBhbHBoYWJldHMsICgsICksICosIF4sICcgK1xuICAgICAgICAgICAgJy8sIC0nXG4gICAgfTtcbiAgICBPYmplY3RzRG9tYWluQ29uc3RhbnRzLkNVUlJFTkNZX1VOSVRTID0ge1xuICAgICAgICBkb2xsYXI6IHtcbiAgICAgICAgICAgIG5hbWU6ICdkb2xsYXInLFxuICAgICAgICAgICAgYWxpYXNlczogWyckJywgJ2RvbGxhcnMnLCAnRG9sbGFycycsICdEb2xsYXInLCAnVVNEJ10sXG4gICAgICAgICAgICBmcm9udF91bml0czogWyckJ10sXG4gICAgICAgICAgICBiYXNlX3VuaXQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgcnVwZWU6IHtcbiAgICAgICAgICAgIG5hbWU6ICdydXBlZScsXG4gICAgICAgICAgICBhbGlhc2VzOiBbJ1JzJywgJ3J1cGVlcycsICfigrknLCAnUnVwZWVzJywgJ1J1cGVlJ10sXG4gICAgICAgICAgICBmcm9udF91bml0czogWydScyAnLCAn4oK5J10sXG4gICAgICAgICAgICBiYXNlX3VuaXQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgY2VudDoge1xuICAgICAgICAgICAgbmFtZTogJ2NlbnQnLFxuICAgICAgICAgICAgYWxpYXNlczogWydjZW50cycsICdDZW50cycsICdDZW50J10sXG4gICAgICAgICAgICBmcm9udF91bml0czogW10sXG4gICAgICAgICAgICBiYXNlX3VuaXQ6ICcwLjAxIGRvbGxhcidcbiAgICAgICAgfSxcbiAgICAgICAgcGFpc2U6IHtcbiAgICAgICAgICAgIG5hbWU6ICdwYWlzZScsXG4gICAgICAgICAgICBhbGlhc2VzOiBbJ3BhaXNhJywgJ1BhaXNlJywgJ1BhaXNhJ10sXG4gICAgICAgICAgICBmcm9udF91bml0czogW10sXG4gICAgICAgICAgICBiYXNlX3VuaXQ6ICcwLjAxIHJ1cGVlJ1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gT2JqZWN0c0RvbWFpbkNvbnN0YW50cztcbn0oKSk7XG5leHBvcnRzLk9iamVjdHNEb21haW5Db25zdGFudHMgPSBPYmplY3RzRG9tYWluQ29uc3RhbnRzO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBzdG9yaW5nIGZyb250ZW5kIHN0b3J5IG5vZGUgZG9tYWluIG9iamVjdHMgaW4gdGhlXG4gKiBzdG9yeSB2aWV3ZXIuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1JlYWRPbmx5U3RvcnlOb2RlT2JqZWN0RmFjdG9yeScsIFtmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBTdG9yeU5vZGUgPSBmdW5jdGlvbiAoaWQsIHRpdGxlLCBkZXN0aW5hdGlvbk5vZGVJZHMsIHByZXJlcXVpc2l0ZVNraWxsSWRzLCBhY3F1aXJlZFNraWxsSWRzLCBvdXRsaW5lLCBvdXRsaW5lSXNGaW5hbGl6ZWQsIGV4cGxvcmF0aW9uSWQsIGV4cGxvcmF0aW9uU3VtbWFyeSwgY29tcGxldGVkKSB7XG4gICAgICAgICAgICB0aGlzLl9pZCA9IGlkO1xuICAgICAgICAgICAgdGhpcy5fdGl0bGUgPSB0aXRsZTtcbiAgICAgICAgICAgIHRoaXMuX2Rlc3RpbmF0aW9uTm9kZUlkcyA9IGRlc3RpbmF0aW9uTm9kZUlkcztcbiAgICAgICAgICAgIHRoaXMuX3ByZXJlcXVpc2l0ZVNraWxsSWRzID0gcHJlcmVxdWlzaXRlU2tpbGxJZHM7XG4gICAgICAgICAgICB0aGlzLl9hY3F1aXJlZFNraWxsSWRzID0gYWNxdWlyZWRTa2lsbElkcztcbiAgICAgICAgICAgIHRoaXMuX291dGxpbmUgPSBvdXRsaW5lO1xuICAgICAgICAgICAgdGhpcy5fb3V0bGluZUlzRmluYWxpemVkID0gb3V0bGluZUlzRmluYWxpemVkO1xuICAgICAgICAgICAgdGhpcy5fZXhwbG9yYXRpb25JZCA9IGV4cGxvcmF0aW9uSWQ7XG4gICAgICAgICAgICB0aGlzLl9leHBsb3JhdGlvblN1bW1hcnlPYmplY3QgPSBleHBsb3JhdGlvblN1bW1hcnk7XG4gICAgICAgICAgICB0aGlzLl9jb21wbGV0ZWQgPSBjb21wbGV0ZWQ7XG4gICAgICAgIH07XG4gICAgICAgIC8vIEluc3RhbmNlIG1ldGhvZHNcbiAgICAgICAgU3RvcnlOb2RlLnByb3RvdHlwZS5nZXRJZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pZDtcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnlOb2RlLnByb3RvdHlwZS5nZXRUaXRsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl90aXRsZTtcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnlOb2RlLnByb3RvdHlwZS5nZXRFeHBsb3JhdGlvbklkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2V4cGxvcmF0aW9uSWQ7XG4gICAgICAgIH07XG4gICAgICAgIFN0b3J5Tm9kZS5wcm90b3R5cGUuaXNDb21wbGV0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29tcGxldGVkO1xuICAgICAgICB9O1xuICAgICAgICBTdG9yeU5vZGUucHJvdG90eXBlLmdldEV4cGxvcmF0aW9uU3VtbWFyeU9iamVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9leHBsb3JhdGlvblN1bW1hcnlPYmplY3Q7XG4gICAgICAgIH07XG4gICAgICAgIFN0b3J5Tm9kZS5wcm90b3R5cGUuZ2V0T3V0bGluZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9vdXRsaW5lO1xuICAgICAgICB9O1xuICAgICAgICBTdG9yeU5vZGUucHJvdG90eXBlLmdldE91dGxpbmVTdGF0dXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fb3V0bGluZUlzRmluYWxpemVkO1xuICAgICAgICB9O1xuICAgICAgICAvLyBTdGF0aWMgY2xhc3MgbWV0aG9kcy4gTm90ZSB0aGF0IFwidGhpc1wiIGlzIG5vdCBhdmFpbGFibGUgaW4gc3RhdGljXG4gICAgICAgIC8vIGNvbnRleHRzLiBUaGlzIGZ1bmN0aW9uIHRha2VzIGEgSlNPTiBvYmplY3Qgd2hpY2ggcmVwcmVzZW50cyBhIGJhY2tlbmRcbiAgICAgICAgLy8gc3RvcnkgcHl0aG9uIGRpY3QuXG4gICAgICAgIC8vIFRPRE8oYW5raXRhMjQwNzk2KTogUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIFN0b3J5Tm9kZVsnY3JlYXRlRnJvbUJhY2tlbmREaWN0J10gPSBmdW5jdGlvbiAoc3RvcnlOb2RlQmFja2VuZE9iamVjdCkge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIHJldHVybiBuZXcgU3RvcnlOb2RlKHN0b3J5Tm9kZUJhY2tlbmRPYmplY3QuaWQsIHN0b3J5Tm9kZUJhY2tlbmRPYmplY3QudGl0bGUsIHN0b3J5Tm9kZUJhY2tlbmRPYmplY3QuZGVzdGluYXRpb25fbm9kZV9pZHMsIHN0b3J5Tm9kZUJhY2tlbmRPYmplY3QucHJlcmVxdWlzaXRlX3NraWxsX2lkcywgc3RvcnlOb2RlQmFja2VuZE9iamVjdC5hY3F1aXJlZF9za2lsbF9pZHMsIHN0b3J5Tm9kZUJhY2tlbmRPYmplY3Qub3V0bGluZSwgc3RvcnlOb2RlQmFja2VuZE9iamVjdC5vdXRsaW5lX2lzX2ZpbmFsaXplZCwgc3RvcnlOb2RlQmFja2VuZE9iamVjdC5leHBsb3JhdGlvbl9pZCwgc3RvcnlOb2RlQmFja2VuZE9iamVjdC5leHBfc3VtbWFyeV9kaWN0LCBzdG9yeU5vZGVCYWNrZW5kT2JqZWN0LmNvbXBsZXRlZCk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBTdG9yeU5vZGU7XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBjcmVhdGluZyBhbmQgbXV0YXRpbmcgaW5zdGFuY2VzIG9mIGZyb250ZW5kXG4gKiBzdG9yeSBwbGF5dGhyb3VnaCBkb21haW4gb2JqZWN0cy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3N0b3J5X3ZpZXdlci9SZWFkT25seVN0b3J5Tm9kZU9iamVjdEZhY3RvcnkudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1N0b3J5UGxheXRocm91Z2hPYmplY3RGYWN0b3J5JywgW1xuICAgICdSZWFkT25seVN0b3J5Tm9kZU9iamVjdEZhY3RvcnknLCBmdW5jdGlvbiAoUmVhZE9ubHlTdG9yeU5vZGVPYmplY3RGYWN0b3J5KSB7XG4gICAgICAgIC8vIFN0b3JlcyBpbmZvcm1hdGlvbiBhYm91dCBhIGN1cnJlbnQgcGxheXRocm91Z2ggb2YgYSBzdG9yeSBmb3IgYVxuICAgICAgICAvLyB1c2VyLlxuICAgICAgICB2YXIgU3RvcnlQbGF5dGhyb3VnaCA9IGZ1bmN0aW9uIChub2Rlcykge1xuICAgICAgICAgICAgdGhpcy5fbm9kZXMgPSBub2RlcztcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnlQbGF5dGhyb3VnaC5wcm90b3R5cGUuZ2V0SW5pdGlhbE5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbm9kZXNbMF07XG4gICAgICAgIH07XG4gICAgICAgIFN0b3J5UGxheXRocm91Z2gucHJvdG90eXBlLmdldFN0b3J5Tm9kZUNvdW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX25vZGVzLmxlbmd0aDtcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnlQbGF5dGhyb3VnaC5wcm90b3R5cGUuZ2V0U3RvcnlOb2RlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9ub2RlcztcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnlQbGF5dGhyb3VnaC5wcm90b3R5cGUuaGFzRmluaXNoZWRTdG9yeSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9ub2Rlcy5zbGljZSgtMSlbMF0uaXNDb21wbGV0ZWQoKTtcbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnlQbGF5dGhyb3VnaC5wcm90b3R5cGUuZ2V0TmV4dFBlbmRpbmdOb2RlSWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX25vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9ub2Rlc1tpXS5pc0NvbXBsZXRlZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9ub2Rlc1tpXS5nZXRJZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgU3RvcnlQbGF5dGhyb3VnaC5wcm90b3R5cGUuaGFzU3RhcnRlZFN0b3J5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX25vZGVzWzBdLmlzQ29tcGxldGVkKCk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFN0YXRpYyBjbGFzcyBtZXRob2RzLiBOb3RlIHRoYXQgXCJ0aGlzXCIgaXMgbm90IGF2YWlsYWJsZSBpbiBzdGF0aWNcbiAgICAgICAgLy8gY29udGV4dHMuIFRoaXMgZnVuY3Rpb24gdGFrZXMgYSBKU09OIG9iamVjdCB3aGljaCByZXByZXNlbnRzIGEgYmFja2VuZFxuICAgICAgICAvLyBzdG9yeSBwbGF5dGhyb3VnaCBweXRob24gZGljdC5cbiAgICAgICAgLy8gVE9ETyhhbmtpdGEyNDA3OTYpOiBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgU3RvcnlQbGF5dGhyb3VnaFsnY3JlYXRlRnJvbUJhY2tlbmREaWN0J10gPSBmdW5jdGlvbiAoXG4gICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIHN0b3J5UGxheXRocm91Z2hCYWNrZW5kT2JqZWN0KSB7XG4gICAgICAgICAgICB2YXIgbm9kZU9iamVjdHMgPSBbXTtcbiAgICAgICAgICAgIG5vZGVPYmplY3RzID0gc3RvcnlQbGF5dGhyb3VnaEJhY2tlbmRPYmplY3Quc3Rvcnlfbm9kZXMubWFwKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFJlYWRPbmx5U3RvcnlOb2RlT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3Qobm9kZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgU3RvcnlQbGF5dGhyb3VnaChub2RlT2JqZWN0cyk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBTdG9yeVBsYXl0aHJvdWdoO1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIGdldCBzdG9yeSBkYXRhLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vc3Rvcnlfdmlld2VyL3N0b3J5LXZpZXdlci1kb21haW4uY29uc3RhbnRzLmFqcy50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnU3RvcnlWaWV3ZXJCYWNrZW5kQXBpU2VydmljZScsIFtcbiAgICAnJGh0dHAnLCAnJHEnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCAnU1RPUllfREFUQV9VUkxfVEVNUExBVEUnLFxuICAgICdTVE9SWV9OT0RFX0NPTVBMRVRJT05fVVJMX1RFTVBMQVRFJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsICRxLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgU1RPUllfREFUQV9VUkxfVEVNUExBVEUsIFNUT1JZX05PREVfQ09NUExFVElPTl9VUkxfVEVNUExBVEUpIHtcbiAgICAgICAgdmFyIHN0b3J5RGF0YURpY3QgPSBudWxsO1xuICAgICAgICB2YXIgX2ZldGNoU3RvcnlEYXRhID0gZnVuY3Rpb24gKHN0b3J5SWQsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIHN0b3J5RGF0YVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKFNUT1JZX0RBVEFfVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgc3RvcnlfaWQ6IHN0b3J5SWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGh0dHAuZ2V0KHN0b3J5RGF0YVVybCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBzdG9yeURhdGFEaWN0ID0gYW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHN0b3J5RGF0YURpY3QpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvclJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX3JlY29yZFN0b3J5Tm9kZUNvbXBsZXRpb24gPSBmdW5jdGlvbiAoc3RvcnlJZCwgbm9kZUlkLCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBzdG9yeU5vZGVDb21wbGV0aW9uVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoU1RPUllfTk9ERV9DT01QTEVUSU9OX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgIHN0b3J5X2lkOiBzdG9yeUlkLFxuICAgICAgICAgICAgICAgIG5vZGVfaWQ6IG5vZGVJZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkaHR0cC5wb3N0KHN0b3J5Tm9kZUNvbXBsZXRpb25VcmwpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3JSZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZldGNoU3RvcnlEYXRhOiBmdW5jdGlvbiAoc3RvcnlJZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF9mZXRjaFN0b3J5RGF0YShzdG9yeUlkLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlY29yZFN0b3J5Tm9kZUNvbXBsZXRpb246IGZ1bmN0aW9uIChzdG9yeUlkLCBub2RlSWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfcmVjb3JkU3RvcnlOb2RlQ29tcGxldGlvbihzdG9yeUlkLCBub2RlSWQsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnN0YW50cyBmb3Igc3Rvcnkgdmlld2VyIGRvbWFpbi5cbiAqL1xuLy8gVE9ETygjNzA5Mik6IERlbGV0ZSB0aGlzIGZpbGUgb25jZSBtaWdyYXRpb24gaXMgY29tcGxldGUgYW5kIHRoZXNlIEFuZ3VsYXJKU1xuLy8gZXF1aXZhbGVudHMgb2YgdGhlIEFuZ3VsYXIgY29uc3RhbnRzIGFyZSBubyBsb25nZXIgbmVlZGVkLlxudmFyIHN0b3J5X3ZpZXdlcl9kb21haW5fY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiZG9tYWluL3N0b3J5X3ZpZXdlci9zdG9yeS12aWV3ZXItZG9tYWluLmNvbnN0YW50c1wiKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdTVE9SWV9EQVRBX1VSTF9URU1QTEFURScsIHN0b3J5X3ZpZXdlcl9kb21haW5fY29uc3RhbnRzXzEuU3RvcnlWaWV3ZXJEb21haW5Db25zdGFudHMuU1RPUllfREFUQV9VUkxfVEVNUExBVEUpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1NUT1JZX05PREVfQ09NUExFVElPTl9VUkxfVEVNUExBVEUnLCBzdG9yeV92aWV3ZXJfZG9tYWluX2NvbnN0YW50c18xLlN0b3J5Vmlld2VyRG9tYWluQ29uc3RhbnRzLlNUT1JZX05PREVfQ09NUExFVElPTl9VUkxfVEVNUExBVEUpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBDb25zdGFudHMgZm9yIHN0b3J5IHZpZXdlciBkb21haW4uXG4gKi9cbnZhciBTdG9yeVZpZXdlckRvbWFpbkNvbnN0YW50cyA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTdG9yeVZpZXdlckRvbWFpbkNvbnN0YW50cygpIHtcbiAgICB9XG4gICAgU3RvcnlWaWV3ZXJEb21haW5Db25zdGFudHMuU1RPUllfREFUQV9VUkxfVEVNUExBVEUgPSAnL3N0b3J5X2RhdGFfaGFuZGxlci88c3RvcnlfaWQ+JztcbiAgICBTdG9yeVZpZXdlckRvbWFpbkNvbnN0YW50cy5TVE9SWV9OT0RFX0NPTVBMRVRJT05fVVJMX1RFTVBMQVRFID0gJy9zdG9yeV9ub2RlX2NvbXBsZXRpb25faGFuZGxlci88c3RvcnlfaWQ+Lzxub2RlX2lkPic7XG4gICAgcmV0dXJuIFN0b3J5Vmlld2VyRG9tYWluQ29uc3RhbnRzO1xufSgpKTtcbmV4cG9ydHMuU3RvcnlWaWV3ZXJEb21haW5Db25zdGFudHMgPSBTdG9yeVZpZXdlckRvbWFpbkNvbnN0YW50cztcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgZm9vdGVyLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ29wcGlhRm9vdGVyJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvb3BwaWFfZm9vdGVyX2RpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkgeyB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIGxlYXJuZXIncyB2aWV3IG9mIGEgc3RvcnkuXG4gKi9cbnJlcXVpcmUoJ2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2NvbW1vbi1lbGVtZW50cy8nICtcbiAgICAnYXR0cmlidXRpb24tZ3VpZGUuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL3N1bW1hcnktdGlsZS9leHBsb3JhdGlvbi1zdW1tYXJ5LXRpbGUuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vc3Rvcnlfdmlld2VyL1N0b3J5UGxheXRocm91Z2hPYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9QYWdlVGl0bGVTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Vc2VyU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvY29udGV4dHVhbC9VcmxTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5hbmltYXRpb24oJy5vcHBpYS1zdG9yeS1hbmltYXRlLXNsaWRlJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGVudGVyOiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgZWxlbWVudC5oaWRlKCkuc2xpZGVEb3duKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGxlYXZlOiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgZWxlbWVudC5zbGlkZVVwKCk7XG4gICAgICAgIH1cbiAgICB9O1xufSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3N0b3J5Vmlld2VyQ2hhcHRlcnNMaXN0JywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHtcbiAgICAgICAgICAgICAgICBnZXRQbGF5dGhyb3VnaE9iamVjdDogJyZwbGF5dGhyb3VnaE9iamVjdCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9zdG9yeS12aWV3ZXItcGFnZS9jaGFwdGVycy1saXN0JyArXG4gICAgICAgICAgICAgICAgJy9zdG9yeS12aWV3ZXItY2hhcHRlcnMtbGlzdC5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckYW5jaG9yU2Nyb2xsJywgJyRodHRwJywgJyRsb2NhdGlvbicsICdBbGVydHNTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnUGFnZVRpdGxlU2VydmljZScsICdTdG9yeVBsYXl0aHJvdWdoT2JqZWN0RmFjdG9yeScsXG4gICAgICAgICAgICAgICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgJ1VybFNlcnZpY2UnLCAnVXNlclNlcnZpY2UnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkYW5jaG9yU2Nyb2xsLCAkaHR0cCwgJGxvY2F0aW9uLCBBbGVydHNTZXJ2aWNlLCBQYWdlVGl0bGVTZXJ2aWNlLCBTdG9yeVBsYXl0aHJvdWdoT2JqZWN0RmFjdG9yeSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIFVybFNlcnZpY2UsIFVzZXJTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zdG9yeVBsYXl0aHJvdWdoT2JqZWN0ID0gY3RybC5nZXRQbGF5dGhyb3VnaE9iamVjdCgpO1xuICAgICAgICAgICAgICAgICAgICBVc2VyU2VydmljZS5nZXRVc2VySW5mb0FzeW5jKCkudGhlbihmdW5jdGlvbiAodXNlckluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuaXNMb2dnZWRJbiA9IHVzZXJJbmZvLmlzTG9nZ2VkSW4oKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZXhwbG9yYXRpb25DYXJkSXNTaG93biA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldFN0YXRpY0ltYWdlVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmw7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBwYXRoSWNvblBhcmFtZXRlcnMgaXMgYW4gYXJyYXkgY29udGFpbmluZyB0aGUgY28tb3JkaW5hdGVzLFxuICAgICAgICAgICAgICAgICAgICAvLyBiYWNrZ3JvdW5kIGNvbG9yIGFuZCBpY29uIHVybCBmb3IgdGhlIGljb25zIGdlbmVyYXRlZCBvbiB0aGUgcGF0aC5cbiAgICAgICAgICAgICAgICAgICAgY3RybC5wYXRoSWNvblBhcmFtZXRlcnMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5hY3RpdmVIaWdobGlnaHRlZEljb25JbmRleCA9IC0xO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLk1JTl9IRUlHSFRfRk9SX1BBVEhfU1ZHX1BYID0gMjIwO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLk9ERF9TVkdfSEVJR0hUX09GRlNFVF9QWCA9IDE1MDtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5FVkVOX1NWR19IRUlHSFRfT0ZGU0VUX1BYID0gMjgwO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLklDT05fWV9JTklUSUFMX1BYID0gMzU7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuSUNPTl9ZX0lOQ1JFTUVOVF9QWCA9IDExMDtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5JQ09OX1hfTUlERExFX1BYID0gMjI1O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLklDT05fWF9MRUZUX1BYID0gNTU7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuSUNPTl9YX1JJR0hUX1BYID0gMzk1O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnN2Z0hlaWdodCA9IGN0cmwuTUlOX0hFSUdIVF9GT1JfUEFUSF9TVkdfUFg7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwubmV4dEV4cGxvcmF0aW9uSWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAkYW5jaG9yU2Nyb2xsLnlPZmZzZXQgPSAtODA7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2V0SWNvbkhpZ2hsaWdodCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5hY3RpdmVIaWdobGlnaHRlZEljb25JbmRleCA9IGluZGV4O1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnVuc2V0SWNvbkhpZ2hsaWdodCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuYWN0aXZlSGlnaGxpZ2h0ZWRJY29uSW5kZXggPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC50b2dnbGVQcmV2aWV3Q2FyZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuZXhwbG9yYXRpb25DYXJkSXNTaG93biA9ICFjdHJsLmV4cGxvcmF0aW9uQ2FyZElzU2hvd247XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwudXBkYXRlRXhwbG9yYXRpb25QcmV2aWV3ID0gZnVuY3Rpb24gKHN0b3J5Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5leHBsb3JhdGlvbkNhcmRJc1Nob3duID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuY3VycmVudEV4cGxvcmF0aW9uSWQgPSBzdG9yeU5vZGUuZ2V0RXhwbG9yYXRpb25JZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zdW1tYXJ5VG9QcmV2aWV3ID0gc3RvcnlOb2RlLmdldEV4cGxvcmF0aW9uU3VtbWFyeU9iamVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jb21wbGV0ZWROb2RlID0gc3RvcnlOb2RlLmlzQ29tcGxldGVkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmlzTmV4dFBlbmRpbmdOb2RlID0gKGN0cmwuc3RvcnlQbGF5dGhyb3VnaE9iamVjdC5nZXROZXh0UGVuZGluZ05vZGVJZCgpID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0b3J5Tm9kZS5nZXRJZCgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuY3VycmVudE5vZGVJZCA9IHN0b3J5Tm9kZS5nZXRJZCgpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBDYWxjdWxhdGVzIHRoZSBTVkcgcGFyYW1ldGVycyByZXF1aXJlZCB0byBkcmF3IHRoZSBjdXJ2ZWQgcGF0aC5cbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZW5lcmF0ZVBhdGhQYXJhbWV0ZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIHBhdGhTdmdQYXJhbWV0ZXJzIHJlcHJlc2VudHMgdGhlIGZpbmFsIHN0cmluZyBvZiBTVkdcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHBhcmFtZXRlcnMgZm9yIHRoZSBiZXppZXIgY3VydmUgdG8gYmUgZ2VuZXJhdGVkLiBUaGUgZGVmYXVsdFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGFyYW1ldGVycyByZXByZXNlbnQgdGhlIGZpcnN0IGN1cnZlIGllLiBsZXNzb24gMSB0byBsZXNzb24gMy5cbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwucGF0aFN2Z1BhcmFtZXRlcnMgPSAnTTI1MCA4MCAgQyA0NzAgMTAwLCA0NzAgMjgwLCAyNTAgMzAwJztcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdG9yeU5vZGVDb3VudCA9IGN0cmwuc3RvcnlQbGF5dGhyb3VnaE9iamVjdC5nZXRTdG9yeU5vZGVDb3VudCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIHNQYXJhbWV0ZXJFeHRlbnNpb24gcmVwcmVzZW50cyB0aGUgY28tb3JkaW5hdGVzIGZvbGxvd2luZ1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlICdTJyAoc21vb3RoIGN1cnZlIHRvKSBjb21tYW5kIGluIFNWRy5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzUGFyYW1ldGVyRXh0ZW5zaW9uID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnBhdGhJY29uUGFyYW1ldGVycyA9IGN0cmwuZ2VuZXJhdGVQYXRoSWNvblBhcmFtZXRlcnMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdG9yeU5vZGVDb3VudCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwucGF0aFN2Z1BhcmFtZXRlcnMgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN0b3J5Tm9kZUNvdW50ID09PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5wYXRoU3ZnUGFyYW1ldGVycyA9ICdNMjUwIDgwICBDIDQ3MCAxMDAsIDQ3MCAyODAsIDI1MCAzMDAnO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIHggYW5kIHkgaGVyZSByZXByZXNlbnQgdGhlIGNvLW9yZGluYXRlcyBvZiB0aGUgY29udHJvbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHBvaW50cyBmb3IgdGhlIGJlemllciBjdXJ2ZSAocGF0aCkuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHkgPSA1MDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBNYXRoLmZsb29yKHN0b3J5Tm9kZUNvdW50IC8gMik7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgeCA9IChpICUgMikgPyAzMCA6IDQ3MDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc1BhcmFtZXRlckV4dGVuc2lvbiArPSB4ICsgJyAnICsgeSArICcsICc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkgKz0gMjA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNQYXJhbWV0ZXJFeHRlbnNpb24gKz0gMjUwICsgJyAnICsgeSArICcsICc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkgKz0gMjAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc1BhcmFtZXRlckV4dGVuc2lvbiAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5wYXRoU3ZnUGFyYW1ldGVycyArPSAnIFMgJyArIHNQYXJhbWV0ZXJFeHRlbnNpb247XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0b3J5Tm9kZUNvdW50ICUgMiA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdG9yeU5vZGVDb3VudCA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnN2Z0hlaWdodCA9IGN0cmwuTUlOX0hFSUdIVF9GT1JfUEFUSF9TVkdfUFg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnN2Z0hlaWdodCA9IHkgLSBjdHJsLkVWRU5fU1ZHX0hFSUdIVF9PRkZTRVRfUFg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0b3J5Tm9kZUNvdW50ID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc3ZnSGVpZ2h0ID0gY3RybC5NSU5fSEVJR0hUX0ZPUl9QQVRIX1NWR19QWDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc3ZnSGVpZ2h0ID0geSAtIGN0cmwuT0REX1NWR19IRUlHSFRfT0ZGU0VUX1BYO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZW5lcmF0ZVBhdGhJY29uUGFyYW1ldGVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdG9yeU5vZGVzID0gY3RybC5zdG9yeVBsYXl0aHJvdWdoT2JqZWN0LmdldFN0b3J5Tm9kZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpY29uUGFyYW1ldGVyc0FycmF5ID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICBpY29uUGFyYW1ldGVyc0FycmF5LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRodW1ibmFpbEljb25Vcmw6IHN0b3J5Tm9kZXNbMF0uZ2V0RXhwbG9yYXRpb25TdW1tYXJ5T2JqZWN0KCkudGh1bWJuYWlsX2ljb25fdXJsLnJlcGxhY2UoJ3N1YmplY3RzJywgJ2ludmVydGVkX3N1YmplY3RzJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogJzIyNXB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3A6ICczNXB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHVtYm5haWxCZ0NvbG9yOiBzdG9yeU5vZGVzWzBdLmdldEV4cGxvcmF0aW9uU3VtbWFyeU9iamVjdCgpLnRodW1ibmFpbF9iZ19jb2xvclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBIZXJlIHggYW5kIHkgcmVwcmVzZW50IHRoZSBjby1vcmRpbmF0ZXMgZm9yIHRoZSBpY29ucyBpbiB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHBhdGguXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgeCA9IGN0cmwuSUNPTl9YX01JRERMRV9QWDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB5ID0gY3RybC5JQ09OX1lfSU5JVElBTF9QWDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb3VudE1pZGRsZUljb24gPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBjdHJsLnN0b3J5UGxheXRocm91Z2hPYmplY3QuZ2V0U3RvcnlOb2RlQ291bnQoKTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvdW50TWlkZGxlSWNvbiA9PT0gMCAmJiB4ID09PSBjdHJsLklDT05fWF9NSURETEVfUFgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeCA9IGN0cmwuSUNPTl9YX0xFRlRfUFg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkgKz0gY3RybC5JQ09OX1lfSU5DUkVNRU5UX1BYO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudE1pZGRsZUljb24gPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChjb3VudE1pZGRsZUljb24gPT09IDEgJiYgeCA9PT0gY3RybC5JQ09OX1hfTUlERExFX1BYKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHggPSBjdHJsLklDT05fWF9SSUdIVF9QWDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeSArPSBjdHJsLklDT05fWV9JTkNSRU1FTlRfUFg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50TWlkZGxlSWNvbiA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4ID0gY3RybC5JQ09OX1hfTUlERExFX1BYO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5ICs9IGN0cmwuSUNPTl9ZX0lOQ1JFTUVOVF9QWDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWNvblBhcmFtZXRlcnNBcnJheS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGh1bWJuYWlsSWNvblVybDogc3RvcnlOb2Rlc1tpXS5nZXRFeHBsb3JhdGlvblN1bW1hcnlPYmplY3QoKS50aHVtYm5haWxfaWNvbl91cmwucmVwbGFjZSgnc3ViamVjdHMnLCAnaW52ZXJ0ZWRfc3ViamVjdHMnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogeCArICdweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogeSArICdweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRodW1ibmFpbEJnQ29sb3I6IHN0b3J5Tm9kZXNbaV0uZ2V0RXhwbG9yYXRpb25TdW1tYXJ5T2JqZWN0KCkudGh1bWJuYWlsX2JnX2NvbG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaWNvblBhcmFtZXRlcnNBcnJheTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRFeHBsb3JhdGlvblVybCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWN0cmwuaXNOZXh0UGVuZGluZ05vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSAnL2V4cGxvcmUvJyArIG5vZGUuZ2V0RXhwbG9yYXRpb25JZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gVXJsU2VydmljZS5hZGRGaWVsZChyZXN1bHQsICdzdG9yeV9pZCcsIFVybFNlcnZpY2UuZ2V0U3RvcnlJZEZyb21WaWV3ZXJVcmwoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBVcmxTZXJ2aWNlLmFkZEZpZWxkKHJlc3VsdCwgJ25vZGVfaWQnLCBjdHJsLmN1cnJlbnROb2RlSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zY3JvbGxUb0xvY2F0aW9uID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkbG9jYXRpb24uaGFzaChpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkYW5jaG9yU2Nyb2xsKCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY2xvc2VPbkNsaWNraW5nT3V0c2lkZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuZXhwbG9yYXRpb25DYXJkSXNTaG93biA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLm9uQ2xpY2tTdG9wUHJvcGFnYXRpb24gPSBmdW5jdGlvbiAoJGV2dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVG91Y2hpbmcgYW55d2hlcmUgb3V0c2lkZSB0aGUgbW9iaWxlIHByZXZpZXcgc2hvdWxkIGhpZGUgaXQuXG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3RybC5leHBsb3JhdGlvbkNhcmRJc1Nob3duID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5leHBsb3JhdGlvbkNhcmRJc1Nob3duID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdlbmVyYXRlUGF0aFBhcmFtZXRlcnMoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIG5hdmJhciBicmVhZGNydW1iIG9mIHRoZSBzdG9yeSB2aWV3ZXIuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9zdG9yeV92aWV3ZXIvU3RvcnlWaWV3ZXJCYWNrZW5kQXBpU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvY29udGV4dHVhbC9VcmxTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3N0b3J5Vmlld2VyTmF2YmFyQnJlYWRjcnVtYicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL3N0b3J5LXZpZXdlci1wYWdlL25hdmJhci1icmVhZGNydW1iLycgK1xuICAgICAgICAgICAgICAgICdzdG9yeS12aWV3ZXItbmF2YmFyLWJyZWFkY3J1bWIuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnU3RvcnlWaWV3ZXJCYWNrZW5kQXBpU2VydmljZScsICdVcmxTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoU3RvcnlWaWV3ZXJCYWNrZW5kQXBpU2VydmljZSwgVXJsU2VydmljZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIFN0b3J5Vmlld2VyQmFja2VuZEFwaVNlcnZpY2UuZmV0Y2hTdG9yeURhdGEoVXJsU2VydmljZS5nZXRTdG9yeUlkRnJvbVZpZXdlclVybCgpKS50aGVuKGZ1bmN0aW9uIChzdG9yeURhdGFEaWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnN0b3J5VGl0bGUgPSBzdG9yeURhdGFEaWN0LnN0b3J5X3RpdGxlO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIG1haW4gcGFnZSBvZiB0aGUgc3Rvcnkgdmlld2VyLlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9jb21tb24tZWxlbWVudHMvJyArXG4gICAgJ2JhY2tncm91bmQtYmFubmVyLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvc3Rvcnktdmlld2VyLXBhZ2UvbmF2YmFyLWJyZWFkY3J1bWIvJyArXG4gICAgJ3N0b3J5LXZpZXdlci1uYXZiYXItYnJlYWRjcnVtYi5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3N0b3J5LXZpZXdlci1wYWdlL2NoYXB0ZXJzLWxpc3QvJyArXG4gICAgJ3N0b3J5LXZpZXdlci1jaGFwdGVycy1saXN0LmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3N0b3J5X3ZpZXdlci9TdG9yeVBsYXl0aHJvdWdoT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL3N0b3J5X3ZpZXdlci9TdG9yeVZpZXdlckJhY2tlbmRBcGlTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9QYWdlVGl0bGVTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnc3RvcnlWaWV3ZXJQYWdlJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvc3Rvcnktdmlld2VyLXBhZ2Uvc3Rvcnktdmlld2VyLXBhZ2UuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHJvb3RTY29wZScsICckd2luZG93JywgJ0FsZXJ0c1NlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdQYWdlVGl0bGVTZXJ2aWNlJywgJ1N0b3J5UGxheXRocm91Z2hPYmplY3RGYWN0b3J5JyxcbiAgICAgICAgICAgICAgICAnU3RvcnlWaWV3ZXJCYWNrZW5kQXBpU2VydmljZScsICdVcmxTZXJ2aWNlJywgJ0ZBVEFMX0VSUk9SX0NPREVTJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHdpbmRvdywgQWxlcnRzU2VydmljZSwgUGFnZVRpdGxlU2VydmljZSwgU3RvcnlQbGF5dGhyb3VnaE9iamVjdEZhY3RvcnksIFN0b3J5Vmlld2VyQmFja2VuZEFwaVNlcnZpY2UsIFVybFNlcnZpY2UsIEZBVEFMX0VSUk9SX0NPREVTKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5jaGVja01vYmlsZVZpZXcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKCR3aW5kb3cuaW5uZXJXaWR0aCA8IDUwMCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc3RvcnlJc0xvYWRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdNZXNzYWdlID0gJ0xvYWRpbmcnO1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3RvcnlJZCA9IFVybFNlcnZpY2UuZ2V0U3RvcnlJZEZyb21WaWV3ZXJVcmwoKTtcbiAgICAgICAgICAgICAgICAgICAgU3RvcnlWaWV3ZXJCYWNrZW5kQXBpU2VydmljZS5mZXRjaFN0b3J5RGF0YShzdG9yeUlkKS50aGVuKGZ1bmN0aW9uIChzdG9yeURhdGFEaWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnN0b3J5SXNMb2FkZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zdG9yeVBsYXl0aHJvdWdoT2JqZWN0ID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdG9yeVBsYXl0aHJvdWdoT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3Qoc3RvcnlEYXRhRGljdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBQYWdlVGl0bGVTZXJ2aWNlLnNldFBhZ2VUaXRsZShzdG9yeURhdGFEaWN0LnN0b3J5X3RpdGxlICsgJyAtIE9wcGlhJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnN0b3J5VGl0bGUgPSBzdG9yeURhdGFEaWN0LnN0b3J5X3RpdGxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zdG9yeURlc2NyaXB0aW9uID0gc3RvcnlEYXRhRGljdC5zdG9yeV9kZXNjcmlwdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ01lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChGQVRBTF9FUlJPUl9DT0RFUy5pbmRleE9mKGVycm9yUmVzcG9uc2Uuc3RhdHVzKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ0ZhaWxlZCB0byBnZXQgZGFzaGJvYXJkIGRhdGEnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBzdG9yeSB2aWV3ZXIgcGFnZS5cbiAqL1xucmVxdWlyZShcImNvcmUtanMvZXM3L3JlZmxlY3RcIik7XG5yZXF1aXJlKFwiem9uZS5qc1wiKTtcbnZhciBjb3JlXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29yZVwiKTtcbnZhciBwbGF0Zm9ybV9icm93c2VyXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3NlclwiKTtcbnZhciBzdGF0aWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBodHRwXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29tbW9uL2h0dHBcIik7XG4vLyBUaGlzIGNvbXBvbmVudCBpcyBuZWVkZWQgdG8gZm9yY2UtYm9vdHN0cmFwIEFuZ3VsYXIgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGVcbi8vIGFwcC5cbnZhciBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFNlcnZpY2VCb290c3RyYXBDb21wb25lbnQoKSB7XG4gICAgfVxuICAgIFNlcnZpY2VCb290c3RyYXBDb21wb25lbnQgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLkNvbXBvbmVudCh7XG4gICAgICAgICAgICBzZWxlY3RvcjogJ3NlcnZpY2UtYm9vdHN0cmFwJyxcbiAgICAgICAgICAgIHRlbXBsYXRlOiAnJ1xuICAgICAgICB9KVxuICAgIF0sIFNlcnZpY2VCb290c3RyYXBDb21wb25lbnQpO1xuICAgIHJldHVybiBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50O1xufSgpKTtcbmV4cG9ydHMuU2VydmljZUJvb3RzdHJhcENvbXBvbmVudCA9IFNlcnZpY2VCb290c3RyYXBDb21wb25lbnQ7XG52YXIgYXBwX2NvbnN0YW50c18xID0gcmVxdWlyZShcImFwcC5jb25zdGFudHNcIik7XG52YXIgaW50ZXJhY3Rpb25zX2V4dGVuc2lvbl9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJpbnRlcmFjdGlvbnMvaW50ZXJhY3Rpb25zLWV4dGVuc2lvbi5jb25zdGFudHNcIik7XG52YXIgb2JqZWN0c19kb21haW5fY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiZG9tYWluL29iamVjdHMvb2JqZWN0cy1kb21haW4uY29uc3RhbnRzXCIpO1xudmFyIHN0b3J5X3ZpZXdlcl9kb21haW5fY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiZG9tYWluL3N0b3J5X3ZpZXdlci9zdG9yeS12aWV3ZXItZG9tYWluLmNvbnN0YW50c1wiKTtcbnZhciBTdG9yeVZpZXdlclBhZ2VNb2R1bGUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU3RvcnlWaWV3ZXJQYWdlTW9kdWxlKCkge1xuICAgIH1cbiAgICAvLyBFbXB0eSBwbGFjZWhvbGRlciBtZXRob2QgdG8gc2F0aXNmeSB0aGUgYENvbXBpbGVyYC5cbiAgICBTdG9yeVZpZXdlclBhZ2VNb2R1bGUucHJvdG90eXBlLm5nRG9Cb290c3RyYXAgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgU3RvcnlWaWV3ZXJQYWdlTW9kdWxlID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5OZ01vZHVsZSh7XG4gICAgICAgICAgICBpbXBvcnRzOiBbXG4gICAgICAgICAgICAgICAgcGxhdGZvcm1fYnJvd3Nlcl8xLkJyb3dzZXJNb2R1bGUsXG4gICAgICAgICAgICAgICAgaHR0cF8xLkh0dHBDbGllbnRNb2R1bGVcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBkZWNsYXJhdGlvbnM6IFtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgZW50cnlDb21wb25lbnRzOiBbXG4gICAgICAgICAgICAgICAgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHByb3ZpZGVyczogW1xuICAgICAgICAgICAgICAgIGFwcF9jb25zdGFudHNfMS5BcHBDb25zdGFudHMsXG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb25zX2V4dGVuc2lvbl9jb25zdGFudHNfMS5JbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzLFxuICAgICAgICAgICAgICAgIG9iamVjdHNfZG9tYWluX2NvbnN0YW50c18xLk9iamVjdHNEb21haW5Db25zdGFudHMsXG4gICAgICAgICAgICAgICAgc3Rvcnlfdmlld2VyX2RvbWFpbl9jb25zdGFudHNfMS5TdG9yeVZpZXdlckRvbWFpbkNvbnN0YW50cyxcbiAgICAgICAgICAgIF1cbiAgICAgICAgfSlcbiAgICBdLCBTdG9yeVZpZXdlclBhZ2VNb2R1bGUpO1xuICAgIHJldHVybiBTdG9yeVZpZXdlclBhZ2VNb2R1bGU7XG59KCkpO1xudmFyIHBsYXRmb3JtX2Jyb3dzZXJfZHluYW1pY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXItZHluYW1pY1wiKTtcbnZhciBzdGF0aWNfMiA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBib290c3RyYXBGbiA9IGZ1bmN0aW9uIChleHRyYVByb3ZpZGVycykge1xuICAgIHZhciBwbGF0Zm9ybVJlZiA9IHBsYXRmb3JtX2Jyb3dzZXJfZHluYW1pY18xLnBsYXRmb3JtQnJvd3NlckR5bmFtaWMoZXh0cmFQcm92aWRlcnMpO1xuICAgIHJldHVybiBwbGF0Zm9ybVJlZi5ib290c3RyYXBNb2R1bGUoU3RvcnlWaWV3ZXJQYWdlTW9kdWxlKTtcbn07XG52YXIgZG93bmdyYWRlZE1vZHVsZSA9IHN0YXRpY18yLmRvd25ncmFkZU1vZHVsZShib290c3RyYXBGbik7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnLCBbXG4gICAgJ2RuZExpc3RzJywgJ2hlYWRyb29tJywgJ2luZmluaXRlLXNjcm9sbCcsICduZ0FuaW1hdGUnLFxuICAgICduZ0F1ZGlvJywgJ25nQ29va2llcycsICduZ0ltZ0Nyb3AnLCAnbmdKb3lSaWRlJywgJ25nTWF0ZXJpYWwnLFxuICAgICduZ1Jlc291cmNlJywgJ25nU2FuaXRpemUnLCAnbmdUb3VjaCcsICdwYXNjYWxwcmVjaHQudHJhbnNsYXRlJyxcbiAgICAndG9hc3RyJywgJ3VpLmJvb3RzdHJhcCcsICd1aS5zb3J0YWJsZScsICd1aS50cmVlJywgJ3VpLnZhbGlkYXRlJyxcbiAgICBkb3duZ3JhZGVkTW9kdWxlXG5dKVxuICAgIC8vIFRoaXMgZGlyZWN0aXZlIGlzIHRoZSBkb3duZ3JhZGVkIHZlcnNpb24gb2YgdGhlIEFuZ3VsYXIgY29tcG9uZW50IHRvXG4gICAgLy8gYm9vdHN0cmFwIHRoZSBBbmd1bGFyIDguXG4gICAgLmRpcmVjdGl2ZSgnc2VydmljZUJvb3RzdHJhcCcsIHN0YXRpY18xLmRvd25ncmFkZUNvbXBvbmVudCh7XG4gICAgY29tcG9uZW50OiBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50XG59KSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNjcmlwdHMgcmVxdWlyZWQgaW4gc3Rvcnkgdmlld2VyLlxuICovXG4vLyBUaGUgbW9kdWxlIG5lZWRzIHRvIGJlIGxvYWRlZCBiZWZvcmUgZXZlcnl0aGluZyBlbHNlIHNpbmNlIGl0IGRlZmluZXMgdGhlXG4vLyBtYWluIG1vZHVsZSB0aGUgZWxlbWVudHMgYXJlIGF0dGFjaGVkIHRvLlxucmVxdWlyZSgncGFnZXMvc3Rvcnktdmlld2VyLXBhZ2Uvc3Rvcnktdmlld2VyLXBhZ2UubW9kdWxlLnRzJyk7XG5yZXF1aXJlKCdBcHAudHMnKTtcbnJlcXVpcmUoJ2Jhc2VfY29tcG9uZW50cy9CYXNlQ29udGVudERpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvc3Rvcnktdmlld2VyLXBhZ2Uvc3Rvcnktdmlld2VyLXBhZ2UuZGlyZWN0aXZlLnRzJyk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xudmFyIF9fbWV0YWRhdGEgPSAodGhpcyAmJiB0aGlzLl9fbWV0YWRhdGEpIHx8IGZ1bmN0aW9uIChrLCB2KSB7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0Lm1ldGFkYXRhID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBSZWZsZWN0Lm1ldGFkYXRhKGssIHYpO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIHNldCB0aGUgdGl0bGUgb2YgdGhlIHBhZ2UuXG4gKi9cbnZhciBzdGF0aWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBjb3JlXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29yZVwiKTtcbnZhciBwbGF0Zm9ybV9icm93c2VyXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3NlclwiKTtcbnZhciBQYWdlVGl0bGVTZXJ2aWNlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBhZ2VUaXRsZVNlcnZpY2UodGl0bGVTZXJ2aWNlKSB7XG4gICAgICAgIHRoaXMudGl0bGVTZXJ2aWNlID0gdGl0bGVTZXJ2aWNlO1xuICAgIH1cbiAgICBQYWdlVGl0bGVTZXJ2aWNlLnByb3RvdHlwZS5zZXRQYWdlVGl0bGUgPSBmdW5jdGlvbiAodGl0bGUpIHtcbiAgICAgICAgdGhpcy50aXRsZVNlcnZpY2Uuc2V0VGl0bGUodGl0bGUpO1xuICAgIH07XG4gICAgdmFyIF9hO1xuICAgIFBhZ2VUaXRsZVNlcnZpY2UgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLkluamVjdGFibGUoe1xuICAgICAgICAgICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG4gICAgICAgIH0pLFxuICAgICAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW3R5cGVvZiAoX2EgPSB0eXBlb2YgcGxhdGZvcm1fYnJvd3Nlcl8xLlRpdGxlICE9PSBcInVuZGVmaW5lZFwiICYmIHBsYXRmb3JtX2Jyb3dzZXJfMS5UaXRsZSkgPT09IFwiZnVuY3Rpb25cIiA/IF9hIDogT2JqZWN0XSlcbiAgICBdLCBQYWdlVGl0bGVTZXJ2aWNlKTtcbiAgICByZXR1cm4gUGFnZVRpdGxlU2VydmljZTtcbn0oKSk7XG5leHBvcnRzLlBhZ2VUaXRsZVNlcnZpY2UgPSBQYWdlVGl0bGVTZXJ2aWNlO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnUGFnZVRpdGxlU2VydmljZScsIHN0YXRpY18xLmRvd25ncmFkZUluamVjdGFibGUoUGFnZVRpdGxlU2VydmljZSkpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBDb25zdGFudHMgZm9yIGludGVyYWN0aW9ucyBleHRlbnNpb25zLlxuICovXG52YXIgSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cyA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzKCkge1xuICAgIH1cbiAgICAvLyBNaW5pbXVtIGNvbmZpZGVuY2UgcmVxdWlyZWQgZm9yIGEgcHJlZGljdGVkIGFuc3dlciBncm91cCB0byBiZSBzaG93biB0b1xuICAgIC8vIHVzZXIuIEdlbmVyYWxseSBhIHRocmVzaG9sZCBvZiAwLjctMC44IGlzIGFzc3VtZWQgdG8gYmUgYSBnb29kIG9uZSBpblxuICAgIC8vIHByYWN0aWNlLCBob3dldmVyIHZhbHVlIG5lZWQgbm90IGJlIGluIHRob3NlIGJvdW5kcy5cbiAgICBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzLkNPREVfUkVQTF9QUkVESUNUSU9OX1NFUlZJQ0VfVEhSRVNIT0xEID0gMC43O1xuICAgIEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMuR1JBUEhfSU5QVVRfTEVGVF9NQVJHSU4gPSAxMjA7XG4gICAgLy8gR2l2ZXMgdGhlIHN0YWZmLWxpbmVzIGh1bWFuIHJlYWRhYmxlIHZhbHVlcy5cbiAgICBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzLk5PVEVfTkFNRVNfVE9fTUlESV9WQUxVRVMgPSB7XG4gICAgICAgIEE1OiA4MSxcbiAgICAgICAgRzU6IDc5LFxuICAgICAgICBGNTogNzcsXG4gICAgICAgIEU1OiA3NixcbiAgICAgICAgRDU6IDc0LFxuICAgICAgICBDNTogNzIsXG4gICAgICAgIEI0OiA3MSxcbiAgICAgICAgQTQ6IDY5LFxuICAgICAgICBHNDogNjcsXG4gICAgICAgIEY0OiA2NSxcbiAgICAgICAgRTQ6IDY0LFxuICAgICAgICBENDogNjIsXG4gICAgICAgIEM0OiA2MFxuICAgIH07XG4gICAgLy8gTWluaW11bSBjb25maWRlbmNlIHJlcXVpcmVkIGZvciBhIHByZWRpY3RlZCBhbnN3ZXIgZ3JvdXAgdG8gYmUgc2hvd24gdG9cbiAgICAvLyB1c2VyLiBHZW5lcmFsbHkgYSB0aHJlc2hvbGQgb2YgMC43LTAuOCBpcyBhc3N1bWVkIHRvIGJlIGEgZ29vZCBvbmUgaW5cbiAgICAvLyBwcmFjdGljZSwgaG93ZXZlciB2YWx1ZSBuZWVkIG5vdCBiZSBpbiB0aG9zZSBib3VuZHMuXG4gICAgSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cy5URVhUX0lOUFVUX1BSRURJQ1RJT05fU0VSVklDRV9USFJFU0hPTEQgPSAwLjc7XG4gICAgcmV0dXJuIEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHM7XG59KCkpO1xuZXhwb3J0cy5JbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzID0gSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cztcbiJdLCJzb3VyY2VSb290IjoiIn0=