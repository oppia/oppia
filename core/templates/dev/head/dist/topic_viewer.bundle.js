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
/******/ 		"topic_viewer": 0
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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/topic-viewer-page/topic-viewer-page.scripts.ts","vendors~about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboar~7856c05a","about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboard~donate~e06a4a17","collection_editor~topic_viewer"]);
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

/***/ "./core/templates/dev/head/components/concept-card/concept-card.directive.ts":
/*!***********************************************************************************!*\
  !*** ./core/templates/dev/head/components/concept-card/concept-card.directive.ts ***!
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
 * @fileoverview Directive for the concept cards viewer.
 */
__webpack_require__(/*! domain/skill/ConceptCardBackendApiService.ts */ "./core/templates/dev/head/domain/skill/ConceptCardBackendApiService.ts");
__webpack_require__(/*! domain/skill/ConceptCardObjectFactory.ts */ "./core/templates/dev/head/domain/skill/ConceptCardObjectFactory.ts");
__webpack_require__(/*! filters/format-rte-preview.filter.ts */ "./core/templates/dev/head/filters/format-rte-preview.filter.ts");
angular.module('oppia').directive('conceptCard', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                getSkillIds: '&skillIds',
                index: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/concept-card/concept-card.template.html'),
            controllerAs: '$ctrl',
            controller: [
                '$scope', '$filter', '$rootScope',
                'ConceptCardBackendApiService', 'ConceptCardObjectFactory',
                function ($scope, $filter, $rootScope, ConceptCardBackendApiService, ConceptCardObjectFactory) {
                    var ctrl = this;
                    ctrl.conceptCards = [];
                    var currentConceptCard = null;
                    var numberOfWorkedExamplesShown = 0;
                    ctrl.loadingMessage = 'Loading';
                    ConceptCardBackendApiService.loadConceptCards(ctrl.getSkillIds()).then(function (conceptCardBackendDicts) {
                        conceptCardBackendDicts.forEach(function (conceptCardBackendDict) {
                            ctrl.conceptCards.push(ConceptCardObjectFactory.createFromBackendDict(conceptCardBackendDict));
                        });
                        ctrl.loadingMessage = '';
                        currentConceptCard = ctrl.conceptCards[ctrl.index];
                    });
                    ctrl.getSkillExplanation = function () {
                        return $filter('formatRtePreview')(currentConceptCard.getExplanation().getHtml());
                    };
                    ctrl.isLastWorkedExample = function () {
                        return numberOfWorkedExamplesShown ===
                            currentConceptCard.getWorkedExamples().length;
                    };
                    ctrl.showMoreWorkedExamples = function () {
                        numberOfWorkedExamplesShown++;
                    };
                    ctrl.showWorkedExamples = function () {
                        var workedExamplesShown = [];
                        for (var i = 0; i < numberOfWorkedExamplesShown; i++) {
                            workedExamplesShown.push($filter('formatRtePreview')(currentConceptCard.getWorkedExamples()[i].getHtml()));
                        }
                        return workedExamplesShown;
                    };
                    $scope.$watch('$ctrl.index', function (newIndex) {
                        currentConceptCard = ctrl.conceptCards[newIndex];
                        numberOfWorkedExamplesShown = 0;
                    });
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/skills-mastery-list/skills-mastery-list.constants.ajs.ts":
/*!*****************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/skills-mastery-list/skills-mastery-list.constants.ajs.ts ***!
  \*****************************************************************************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Constants for the skills mastery list.
 */
var skills_mastery_list_constants_1 = __webpack_require__(/*! components/skills-mastery-list/skills-mastery-list.constants */ "./core/templates/dev/head/components/skills-mastery-list/skills-mastery-list.constants.ts");
angular.module('oppia').constant('MASTERY_CUTOFF', skills_mastery_list_constants_1.SkillMasteryListConstants.MASTERY_CUTOFF);
angular.module('oppia').constant('MASTERY_COLORS', skills_mastery_list_constants_1.SkillMasteryListConstants.MASTERY_COLORS);


/***/ }),

/***/ "./core/templates/dev/head/components/skills-mastery-list/skills-mastery-list.constants.ts":
/*!*************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/skills-mastery-list/skills-mastery-list.constants.ts ***!
  \*************************************************************************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Constants for the skills mastery list.
 */
var SkillMasteryListConstants = /** @class */ (function () {
    function SkillMasteryListConstants() {
    }
    SkillMasteryListConstants.MASTERY_CUTOFF = {
        GOOD_CUTOFF: 0.7,
        MEDIUM_CUTOFF: 0.4
    };
    SkillMasteryListConstants.MASTERY_COLORS = {
        // color green
        GOOD_MASTERY_COLOR: 'rgb(0, 150, 136)',
        // color orange
        MEDIUM_MASTERY_COLOR: 'rgb(217, 92, 12)',
        // color red
        BAD_MASTERY_COLOR: 'rgb(201, 80, 66)'
    };
    return SkillMasteryListConstants;
}());
exports.SkillMasteryListConstants = SkillMasteryListConstants;


/***/ }),

/***/ "./core/templates/dev/head/components/skills-mastery-list/skills-mastery-list.directive.ts":
/*!*************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/skills-mastery-list/skills-mastery-list.directive.ts ***!
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
 * @fileoverview Directive for the skills mastery list.
 */
__webpack_require__(/*! components/concept-card/concept-card.directive.ts */ "./core/templates/dev/head/components/concept-card/concept-card.directive.ts");
__webpack_require__(/*! components/skills-mastery-list/skills-mastery-list.constants.ajs.ts */ "./core/templates/dev/head/components/skills-mastery-list/skills-mastery-list.constants.ajs.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
angular.module('oppia').directive('skillsMasteryList', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                getDegreesOfMastery: '&degreesOfMastery',
                getSkillDescriptions: '&skillDescriptions'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/skills-mastery-list/skills-mastery-list.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$scope', '$uibModal', 'UserService',
                'MASTERY_CUTOFF', 'MASTERY_COLORS',
                function ($scope, $uibModal, UserService, MASTERY_CUTOFF, MASTERY_COLORS) {
                    var ctrl = this;
                    ctrl.userIsLoggedIn = null;
                    UserService.getUserInfoAsync().then(function (userInfo) {
                        ctrl.userIsLoggedIn = userInfo.isLoggedIn();
                    });
                    ctrl.sortedSkillIds = [];
                    var degreesOfMastery = ctrl.getDegreesOfMastery();
                    ctrl.skillIdsAndMastery =
                        Object.keys(degreesOfMastery).map(function (skillId) {
                            return {
                                skillId: skillId,
                                mastery: degreesOfMastery[skillId]
                            };
                        });
                    ctrl.getMasteryPercentage = function (degreeOfMastery) {
                        return Math.round(degreeOfMastery * 100);
                    };
                    ctrl.getColorForMastery = function (degreeOfMastery) {
                        if (degreeOfMastery >= MASTERY_CUTOFF.GOOD_CUTOFF) {
                            return MASTERY_COLORS.GOOD_MASTERY_COLOR;
                        }
                        else if (degreeOfMastery >= MASTERY_CUTOFF.MEDIUM_CUTOFF) {
                            return MASTERY_COLORS.MEDIUM_MASTERY_COLOR;
                        }
                        else {
                            return MASTERY_COLORS.BAD_MASTERY_COLOR;
                        }
                    };
                    ctrl.getMasteryBarStyle = function (skillId) {
                        return {
                            width: ctrl.getMasteryPercentage(ctrl.getDegreesOfMastery()[skillId]) + '%',
                            background: ctrl.getColorForMastery(ctrl.getDegreesOfMastery()[skillId])
                        };
                    };
                    ctrl.openConceptCardModal = function (skillId) {
                        var skillDescription = ctrl.getSkillDescriptions()[skillId];
                        $uibModal.open({
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/concept-card/concept-card-modal.template.html'),
                            backdrop: true,
                            controller: [
                                '$scope', '$uibModalInstance',
                                function ($scope, $uibModalInstance) {
                                    $scope.skillIds = [skillId];
                                    $scope.index = 0;
                                    $scope.currentSkill = skillDescription;
                                    $scope.closeModal = function () {
                                        $uibModalInstance.dismiss('cancel');
                                    };
                                }
                            ]
                        });
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/summary-tile/story-summary-tile.directive.ts":
/*!*****************************************************************************************!*\
  !*** ./core/templates/dev/head/components/summary-tile/story-summary-tile.directive.ts ***!
  \*****************************************************************************************/
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
 * @fileoverview Component for a canonical story tile.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('storySummaryTile', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                getStoryId: '&storyId',
                getStoryTitle: '&title',
                getStoryDescription: '&description',
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/summary-tile/story-summary-tile.directive.html'),
            controllerAs: '$ctrl',
            controller: ['STORY_VIEWER_URL_TEMPLATE',
                function (STORY_VIEWER_URL_TEMPLATE) {
                    var ctrl = this;
                    ctrl.getStoryLink = function () {
                        return UrlInterpolationService.interpolateUrl(STORY_VIEWER_URL_TEMPLATE, {
                            story_id: ctrl.getStoryId()
                        });
                    };
                    ctrl.getStaticImageUrl = function (url) {
                        return UrlInterpolationService.getStaticImageUrl(url);
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/summary-tile/subtopic-summary-tile.directive.ts":
/*!********************************************************************************************!*\
  !*** ./core/templates/dev/head/components/summary-tile/subtopic-summary-tile.directive.ts ***!
  \********************************************************************************************/
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
 * @fileoverview Component for a subtopic tile.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('subtopicSummaryTile', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                getSkillCount: '&skillCount',
                getSubtopicId: '&subtopicId',
                getSubtopicTitle: '&subtopicTitle',
                getTopicName: '&topicName'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/summary-tile/subtopic-summary-tile.directive.html'),
            controllerAs: '$ctrl',
            controller: ['SUBTOPIC_VIEWER_URL_TEMPLATE',
                function (SUBTOPIC_VIEWER_URL_TEMPLATE) {
                    var ctrl = this;
                    ctrl.getSubtopicLink = function () {
                        return UrlInterpolationService.interpolateUrl(SUBTOPIC_VIEWER_URL_TEMPLATE, {
                            topic_name: ctrl.getTopicName(),
                            subtopic_id: ctrl.getSubtopicId().toString()
                        });
                    };
                    ctrl.getStaticImageUrl = function (url) {
                        return UrlInterpolationService.getStaticImageUrl(url);
                    };
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

/***/ "./core/templates/dev/head/domain/skill/ConceptCardBackendApiService.ts":
/*!******************************************************************************!*\
  !*** ./core/templates/dev/head/domain/skill/ConceptCardBackendApiService.ts ***!
  \******************************************************************************/
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
 * @fileoverview Service to retrieve read only information
 * about the concept card of a skill from the backend.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! domain/skill/skill-domain.constants.ajs.ts */ "./core/templates/dev/head/domain/skill/skill-domain.constants.ajs.ts");
angular.module('oppia').factory('ConceptCardBackendApiService', [
    '$http', '$q', 'UrlInterpolationService', 'CONCEPT_CARD_DATA_URL_TEMPLATE',
    function ($http, $q, UrlInterpolationService, CONCEPT_CARD_DATA_URL_TEMPLATE) {
        // Maps previously loaded concept cards to their IDs.
        var _conceptCardCache = [];
        var _fetchConceptCards = function (skillIds, successCallback, errorCallback) {
            var conceptCardDataUrl = UrlInterpolationService.interpolateUrl(CONCEPT_CARD_DATA_URL_TEMPLATE, {
                comma_separated_skill_ids: skillIds.join(',')
            });
            $http.get(conceptCardDataUrl).then(function (response) {
                var conceptCards = angular.copy(response.data.concept_card_dicts);
                if (successCallback) {
                    successCallback(conceptCards);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _isCached = function (skillId) {
            return _conceptCardCache.hasOwnProperty(skillId);
        };
        var _getUncachedSkillIds = function (skillIds) {
            var uncachedSkillIds = [];
            skillIds.forEach(function (skillId) {
                if (!_isCached(skillId)) {
                    uncachedSkillIds.push(skillId);
                }
            });
            return uncachedSkillIds;
        };
        return {
            /**
             * This function will fetch concept cards from the backend, as well as
             * attempt to see whether the given concept cards have already been
             * loaded. If they have not yet been loaded, it will fetch the concept
             * cards from the backend. If it successfully retrieves the concept cards
             * from the backend, it will store them in the cache to avoid requests
             * from the backend in further function calls.
             */
            loadConceptCards: function (skillIds) {
                return $q(function (resolve, reject) {
                    var uncachedSkillIds = _getUncachedSkillIds(skillIds);
                    var conceptCards = [];
                    if (uncachedSkillIds.length !== 0) {
                        // Case where only part (or none) of the concept cards are cached
                        // locally.
                        _fetchConceptCards(uncachedSkillIds, function (uncachedConceptCards) {
                            skillIds.forEach(function (skillId) {
                                if (uncachedSkillIds.includes(skillId)) {
                                    conceptCards.push(uncachedConceptCards[uncachedSkillIds.indexOf(skillId)]);
                                    // Save the fetched conceptCards to avoid future fetches.
                                    _conceptCardCache[skillId] = angular.copy(uncachedConceptCards[uncachedSkillIds.indexOf(skillId)]);
                                }
                                else {
                                    conceptCards.push(angular.copy(_conceptCardCache[skillId]));
                                }
                            });
                            if (resolve) {
                                resolve(angular.copy(conceptCards));
                            }
                        }, reject);
                    }
                    else {
                        // Case where all of the concept cards are cached locally.
                        skillIds.forEach(function (skillId) {
                            conceptCards.push(angular.copy(_conceptCardCache[skillId]));
                        });
                        if (resolve) {
                            resolve(conceptCards);
                        }
                    }
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/skill/ConceptCardObjectFactory.ts":
/*!**************************************************************************!*\
  !*** ./core/templates/dev/head/domain/skill/ConceptCardObjectFactory.ts ***!
  \**************************************************************************/
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
 * @fileoverview Object factory for creating a front-end instance of a
 * concept card. In the backend, this is referred to as SkillContents.
 */
__webpack_require__(/*! domain/exploration/RecordedVoiceoversObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/RecordedVoiceoversObjectFactory.ts");
__webpack_require__(/*! domain/exploration/SubtitledHtmlObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/SubtitledHtmlObjectFactory.ts");
angular.module('oppia').factory('ConceptCardObjectFactory', [
    'RecordedVoiceoversObjectFactory', 'SubtitledHtmlObjectFactory',
    'COMPONENT_NAME_EXPLANATION',
    function (RecordedVoiceoversObjectFactory, SubtitledHtmlObjectFactory, COMPONENT_NAME_EXPLANATION) {
        var ConceptCard = function (explanation, workedExamples, recordedVoiceovers) {
            this._explanation = explanation;
            this._workedExamples = workedExamples;
            this._recordedVoiceovers = recordedVoiceovers;
        };
        ConceptCard.prototype.toBackendDict = function () {
            return {
                explanation: this._explanation.toBackendDict(),
                worked_examples: this._workedExamples.map(function (workedExample) {
                    return workedExample.toBackendDict();
                }),
                recorded_voiceovers: this._recordedVoiceovers.toBackendDict()
            };
        };
        var _generateWorkedExamplesFromBackendDict = function (workedExampleDicts) {
            return workedExampleDicts.map(function (workedExampleDict) {
                return SubtitledHtmlObjectFactory.createFromBackendDict(workedExampleDict);
            });
        };
        var _getElementsInFirstSetButNotInSecond = function (setA, setB) {
            var diffList = Array.from(setA).filter(function (element) {
                return !setB.has(element);
            });
            return diffList;
        };
        var _extractAvailableContentIdsFromWorkedExamples = function (workedExamples) {
            var contentIds = new Set();
            workedExamples.forEach(function (workedExample) {
                contentIds.add(workedExample.getContentId());
            });
            return contentIds;
        };
        // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        ConceptCard['createFromBackendDict'] = function (conceptCardBackendDict) {
            /* eslint-enable dot-notation */
            return new ConceptCard(SubtitledHtmlObjectFactory.createFromBackendDict(conceptCardBackendDict.explanation), _generateWorkedExamplesFromBackendDict(conceptCardBackendDict.worked_examples), RecordedVoiceoversObjectFactory.createFromBackendDict(conceptCardBackendDict.recorded_voiceovers));
        };
        ConceptCard.prototype.getExplanation = function () {
            return this._explanation;
        };
        ConceptCard.prototype.setExplanation = function (explanation) {
            this._explanation = explanation;
        };
        ConceptCard.prototype.getWorkedExamples = function () {
            return this._workedExamples.slice();
        };
        ConceptCard.prototype.setWorkedExamples = function (workedExamples) {
            var oldContentIds = _extractAvailableContentIdsFromWorkedExamples(this._workedExamples);
            this._workedExamples = workedExamples.slice();
            var newContentIds = _extractAvailableContentIdsFromWorkedExamples(this._workedExamples);
            var contentIdsToDelete = _getElementsInFirstSetButNotInSecond(oldContentIds, newContentIds);
            var contentIdsToAdd = _getElementsInFirstSetButNotInSecond(newContentIds, oldContentIds);
            for (var i = 0; i < contentIdsToDelete.length; i++) {
                this._recordedVoiceovers.deleteContentId(contentIdsToDelete[i]);
            }
            for (var i = 0; i < contentIdsToAdd.length; i++) {
                this._recordedVoiceovers.addContentId(contentIdsToAdd[i]);
            }
        };
        ConceptCard.prototype.getRecordedVoiceovers = function () {
            return this._recordedVoiceovers;
        };
        // Create an interstitial concept card that would be displayed in the
        // editor until the actual skill is fetched from the backend.
        // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        ConceptCard['createInterstitialConceptCard'] = function () {
            /* eslint-enable dot-notation */
            var recordedVoiceoversDict = {
                voiceovers_mapping: {
                    COMPONENT_NAME_EXPLANATION: {}
                }
            };
            return new ConceptCard(SubtitledHtmlObjectFactory.createDefault('Loading review material', COMPONENT_NAME_EXPLANATION), [], RecordedVoiceoversObjectFactory.createFromBackendDict(recordedVoiceoversDict));
        };
        return ConceptCard;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/skill/skill-domain.constants.ajs.ts":
/*!****************************************************************************!*\
  !*** ./core/templates/dev/head/domain/skill/skill-domain.constants.ajs.ts ***!
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Constants for skill domain.
 */
// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
var skill_domain_constants_1 = __webpack_require__(/*! domain/skill/skill-domain.constants */ "./core/templates/dev/head/domain/skill/skill-domain.constants.ts");
angular.module('oppia').constant('CONCEPT_CARD_DATA_URL_TEMPLATE', skill_domain_constants_1.SkillDomainConstants.CONCEPT_CARD_DATA_URL_TEMPLATE);
angular.module('oppia').constant('EDITABLE_SKILL_DATA_URL_TEMPLATE', skill_domain_constants_1.SkillDomainConstants.EDITABLE_SKILL_DATA_URL_TEMPLATE);
angular.module('oppia').constant('SKILL_DATA_URL_TEMPLATE', skill_domain_constants_1.SkillDomainConstants.SKILL_DATA_URL_TEMPLATE);
angular.module('oppia').constant('SKILL_EDITOR_QUESTION_URL_TEMPLATE', skill_domain_constants_1.SkillDomainConstants.SKILL_EDITOR_QUESTION_URL_TEMPLATE);
angular.module('oppia').constant('SKILL_MASTERY_DATA_URL_TEMPLATE', skill_domain_constants_1.SkillDomainConstants.SKILL_MASTERY_DATA_URL_TEMPLATE);
angular.module('oppia').constant('SKILL_PROPERTY_DESCRIPTION', skill_domain_constants_1.SkillDomainConstants.SKILL_PROPERTY_DESCRIPTION);
angular.module('oppia').constant('SKILL_PROPERTY_LANGUAGE_CODE', skill_domain_constants_1.SkillDomainConstants.SKILL_PROPERTY_LANGUAGE_CODE);
angular.module('oppia').constant('SKILL_CONTENTS_PROPERTY_EXPLANATION', skill_domain_constants_1.SkillDomainConstants.SKILL_CONTENTS_PROPERTY_EXPLANATION);
angular.module('oppia').constant('SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES', skill_domain_constants_1.SkillDomainConstants.SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES);
angular.module('oppia').constant('SKILL_MISCONCEPTIONS_PROPERTY_NAME', skill_domain_constants_1.SkillDomainConstants.SKILL_MISCONCEPTIONS_PROPERTY_NAME);
angular.module('oppia').constant('SKILL_MISCONCEPTIONS_PROPERTY_NOTES', skill_domain_constants_1.SkillDomainConstants.SKILL_MISCONCEPTIONS_PROPERTY_NOTES);
angular.module('oppia').constant('SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK', skill_domain_constants_1.SkillDomainConstants.SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK);
angular.module('oppia').constant('CMD_UPDATE_SKILL_PROPERTY', skill_domain_constants_1.SkillDomainConstants.CMD_UPDATE_SKILL_PROPERTY);
angular.module('oppia').constant('CMD_UPDATE_SKILL_CONTENTS_PROPERTY', skill_domain_constants_1.SkillDomainConstants.CMD_UPDATE_SKILL_CONTENTS_PROPERTY);
angular.module('oppia').constant('CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY', skill_domain_constants_1.SkillDomainConstants.CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY);
angular.module('oppia').constant('CMD_ADD_SKILL_MISCONCEPTION', skill_domain_constants_1.SkillDomainConstants.CMD_ADD_SKILL_MISCONCEPTION);
angular.module('oppia').constant('CMD_DELETE_SKILL_MISCONCEPTION', skill_domain_constants_1.SkillDomainConstants.CMD_DELETE_SKILL_MISCONCEPTION);
angular.module('oppia').constant('CMD_UPDATE_RUBRICS', skill_domain_constants_1.SkillDomainConstants.CMD_UPDATE_RUBRICS);


/***/ }),

/***/ "./core/templates/dev/head/domain/skill/skill-domain.constants.ts":
/*!************************************************************************!*\
  !*** ./core/templates/dev/head/domain/skill/skill-domain.constants.ts ***!
  \************************************************************************/
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
 * @fileoverview Constants for skill domain.
 */
var SkillDomainConstants = /** @class */ (function () {
    function SkillDomainConstants() {
    }
    SkillDomainConstants.CONCEPT_CARD_DATA_URL_TEMPLATE = '/concept_card_handler/<comma_separated_skill_ids>';
    SkillDomainConstants.EDITABLE_SKILL_DATA_URL_TEMPLATE = '/skill_editor_handler/data/<skill_id>';
    SkillDomainConstants.SKILL_DATA_URL_TEMPLATE = '/skill_data_handler/<comma_separated_skill_ids>';
    SkillDomainConstants.SKILL_EDITOR_QUESTION_URL_TEMPLATE = '/skill_editor_question_handler/<skill_id>?cursor=<cursor>';
    SkillDomainConstants.SKILL_MASTERY_DATA_URL_TEMPLATE = '/skill_mastery_handler/data';
    SkillDomainConstants.SKILL_PROPERTY_DESCRIPTION = 'description';
    SkillDomainConstants.SKILL_PROPERTY_LANGUAGE_CODE = 'language_code';
    SkillDomainConstants.SKILL_CONTENTS_PROPERTY_EXPLANATION = 'explanation';
    SkillDomainConstants.SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES = 'worked_examples';
    SkillDomainConstants.SKILL_MISCONCEPTIONS_PROPERTY_NAME = 'name';
    SkillDomainConstants.SKILL_MISCONCEPTIONS_PROPERTY_NOTES = 'notes';
    SkillDomainConstants.SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK = 'feedback';
    SkillDomainConstants.CMD_UPDATE_SKILL_PROPERTY = 'update_skill_property';
    SkillDomainConstants.CMD_UPDATE_SKILL_CONTENTS_PROPERTY = 'update_skill_contents_property';
    SkillDomainConstants.CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY = 'update_skill_misconceptions_property';
    SkillDomainConstants.CMD_ADD_SKILL_MISCONCEPTION = 'add_skill_misconception';
    SkillDomainConstants.CMD_DELETE_SKILL_MISCONCEPTION = 'delete_skill_misconception';
    SkillDomainConstants.CMD_UPDATE_RUBRICS = 'update_rubrics';
    return SkillDomainConstants;
}());
exports.SkillDomainConstants = SkillDomainConstants;


/***/ }),

/***/ "./core/templates/dev/head/domain/topic_viewer/TopicViewerBackendApiService.ts":
/*!*************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/topic_viewer/TopicViewerBackendApiService.ts ***!
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
 * @fileoverview Service to get topic data.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! domain/topic_viewer/topic-viewer-domain.constants.ajs.ts */ "./core/templates/dev/head/domain/topic_viewer/topic-viewer-domain.constants.ajs.ts");
angular.module('oppia').factory('TopicViewerBackendApiService', [
    '$http', '$q', 'UrlInterpolationService', 'TOPIC_DATA_URL_TEMPLATE',
    function ($http, $q, UrlInterpolationService, TOPIC_DATA_URL_TEMPLATE) {
        var topicDataDict = null;
        var _fetchTopicData = function (topicName, successCallback, errorCallback) {
            var topicDataUrl = UrlInterpolationService.interpolateUrl(TOPIC_DATA_URL_TEMPLATE, {
                topic_name: topicName
            });
            $http.get(topicDataUrl).then(function (response) {
                topicDataDict = angular.copy(response.data);
                if (successCallback) {
                    successCallback(topicDataDict);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        return {
            fetchTopicData: function (topicName) {
                return $q(function (resolve, reject) {
                    _fetchTopicData(topicName, resolve, reject);
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/topic_viewer/topic-viewer-domain.constants.ajs.ts":
/*!******************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/topic_viewer/topic-viewer-domain.constants.ajs.ts ***!
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
 * @fileoverview Constants for the topic viewer domain.
 */
// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
var topic_viewer_domain_constants_1 = __webpack_require__(/*! domain/topic_viewer/topic-viewer-domain.constants */ "./core/templates/dev/head/domain/topic_viewer/topic-viewer-domain.constants.ts");
angular.module('oppia').constant('TOPIC_DATA_URL_TEMPLATE', topic_viewer_domain_constants_1.TopicViewerDomainConstants.TOPIC_DATA_URL_TEMPLATE);
angular.module('oppia').constant('STORY_VIEWER_URL_TEMPLATE', topic_viewer_domain_constants_1.TopicViewerDomainConstants.STORY_VIEWER_URL_TEMPLATE);
angular.module('oppia').constant('SUBTOPIC_VIEWER_URL_TEMPLATE', topic_viewer_domain_constants_1.TopicViewerDomainConstants.SUBTOPIC_VIEWER_URL_TEMPLATE);


/***/ }),

/***/ "./core/templates/dev/head/domain/topic_viewer/topic-viewer-domain.constants.ts":
/*!**************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/topic_viewer/topic-viewer-domain.constants.ts ***!
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
 * @fileoverview Constants for the topic viewer domain.
 */
var TopicViewerDomainConstants = /** @class */ (function () {
    function TopicViewerDomainConstants() {
    }
    TopicViewerDomainConstants.TOPIC_DATA_URL_TEMPLATE = '/topic_data_handler/<topic_name>';
    TopicViewerDomainConstants.STORY_VIEWER_URL_TEMPLATE = '/story/<story_id>';
    TopicViewerDomainConstants.SUBTOPIC_VIEWER_URL_TEMPLATE = '/subtopic/<topic_name>/<subtopic_id>';
    return TopicViewerDomainConstants;
}());
exports.TopicViewerDomainConstants = TopicViewerDomainConstants;


/***/ }),

/***/ "./core/templates/dev/head/filters/format-rte-preview.filter.ts":
/*!**********************************************************************!*\
  !*** ./core/templates/dev/head/filters/format-rte-preview.filter.ts ***!
  \**********************************************************************/
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
 * @fileoverview FormatRtePreview filter for Oppia.
 */
/* The following filter replaces each RTE element occurrence in the input html
   by its corresponding name in square brackets and returns a string
   which contains the name in the same location as in the input html.
   eg: <p>Sample1 <oppia-noninteractive-math></oppia-noninteractive-math>
        Sample2 </p>
   will give as output: Sample1 [Math] Sample2 */
angular.module('oppia').filter('formatRtePreview', [
    '$filter', function ($filter) {
        return function (html) {
            html = html.replace(/&nbsp;/ig, ' ');
            html = html.replace(/&quot;/ig, '');
            // Replace all html tags other than <oppia-noninteractive-**> ones to ''.
            html = html.replace(/<(?!oppia-noninteractive\s*?)[^>]+>/g, '');
            var formattedOutput = html.replace(/(<([^>]+)>)/g, function (rteTag) {
                var replaceString = $filter('capitalize')(rteTag.split('-')[2].split(' ')[0]);
                if (replaceString[replaceString.length - 1] === '>') {
                    replaceString = replaceString.slice(0, -1);
                }
                return ' [' + replaceString + '] ';
            });
            return formattedOutput.trim();
        };
    }
]);


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

/***/ "./core/templates/dev/head/pages/practice-session-page/practice-session-page.constants.ajs.ts":
/*!****************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/practice-session-page/practice-session-page.constants.ajs.ts ***!
  \****************************************************************************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Constants for the practice session.
 */
// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
var practice_session_page_constants_1 = __webpack_require__(/*! pages/practice-session-page/practice-session-page.constants */ "./core/templates/dev/head/pages/practice-session-page/practice-session-page.constants.ts");
angular.module('oppia').constant('TOTAL_QUESTIONS', practice_session_page_constants_1.PracticeSessionPageConstants.TOTAL_QUESTIONS);
angular.module('oppia').constant('PRACTICE_SESSIONS_DATA_URL', practice_session_page_constants_1.PracticeSessionPageConstants.PRACTICE_SESSIONS_DATA_URL);
angular.module('oppia').constant('TOPIC_VIEWER_PAGE', practice_session_page_constants_1.PracticeSessionPageConstants.TOPIC_VIEWER_PAGE);
angular.module('oppia').constant('PRACTICE_SESSIONS_URL', practice_session_page_constants_1.PracticeSessionPageConstants.PRACTICE_SESSIONS_URL);


/***/ }),

/***/ "./core/templates/dev/head/pages/practice-session-page/practice-session-page.constants.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/practice-session-page/practice-session-page.constants.ts ***!
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Constants for the practice session.
 */
var PracticeSessionPageConstants = /** @class */ (function () {
    function PracticeSessionPageConstants() {
    }
    PracticeSessionPageConstants.TOTAL_QUESTIONS = 20;
    PracticeSessionPageConstants.PRACTICE_SESSIONS_DATA_URL = '/practice_session/data/<topic_name>';
    PracticeSessionPageConstants.TOPIC_VIEWER_PAGE = '/topic/<topic_name>';
    PracticeSessionPageConstants.PRACTICE_SESSIONS_URL = '/practice_session/<topic_name>';
    return PracticeSessionPageConstants;
}());
exports.PracticeSessionPageConstants = PracticeSessionPageConstants;


/***/ }),

/***/ "./core/templates/dev/head/pages/topic-viewer-page/navbar-breadcrumb/topic-viewer-navbar-breadcrumb.directive.ts":
/*!***********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topic-viewer-page/navbar-breadcrumb/topic-viewer-navbar-breadcrumb.directive.ts ***!
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
 * @fileoverview Directive for the navbar breadcrumb of the topic viewer.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
angular.module('oppia').directive('topicViewerNavbarBreadcrumb', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topic-viewer-page/navbar-breadcrumb/' +
                'topic-viewer-navbar-breadcrumb.directive.html'),
            controller: ['$scope', 'TopicViewerBackendApiService', 'UrlService',
                function ($scope, TopicViewerBackendApiService, UrlService) {
                    TopicViewerBackendApiService.fetchTopicData(UrlService.getTopicNameFromLearnerUrl()).then(function (topicDataDict) {
                        $scope.topicName = topicDataDict.topic_name;
                    });
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/topic-viewer-page/practice-tab/practice-tab.directive.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topic-viewer-page/practice-tab/practice-tab.directive.ts ***!
  \************************************************************************************************/
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
 * @fileoverview Directive for the stories list.
 */
__webpack_require__(/*! components/summary-tile/story-summary-tile.directive.ts */ "./core/templates/dev/head/components/summary-tile/story-summary-tile.directive.ts");
__webpack_require__(/*! pages/practice-session-page/practice-session-page.constants.ajs.ts */ "./core/templates/dev/head/pages/practice-session-page/practice-session-page.constants.ajs.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/contextual/WindowDimensionsService.ts */ "./core/templates/dev/head/services/contextual/WindowDimensionsService.ts");
angular.module('oppia').directive('practiceTab', [
    '$window', 'UrlInterpolationService',
    'PRACTICE_SESSIONS_URL',
    function ($window, UrlInterpolationService, PRACTICE_SESSIONS_URL) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                getTopicName: '&topicName',
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topic-viewer-page/practice-tab/practice-tab.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$scope',
                function ($scope) {
                    var ctrl = this;
                    ctrl.newPracticeSession = function () {
                        var practiceSessionsUrl = UrlInterpolationService.interpolateUrl(PRACTICE_SESSIONS_URL, {
                            topic_name: ctrl.getTopicName()
                        });
                        $window.location.href = practiceSessionsUrl;
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/topic-viewer-page/stories-list/stories-list.directive.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topic-viewer-page/stories-list/stories-list.directive.ts ***!
  \************************************************************************************************/
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
 * @fileoverview Directive for the stories list.
 */
__webpack_require__(/*! components/summary-tile/story-summary-tile.directive.ts */ "./core/templates/dev/head/components/summary-tile/story-summary-tile.directive.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/contextual/WindowDimensionsService.ts */ "./core/templates/dev/head/services/contextual/WindowDimensionsService.ts");
angular.module('oppia').directive('storiesList', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {
                getCanonicalStories: '&canonicalStoriesList',
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topic-viewer-page/stories-list/stories-list.directive.html'),
            controller: ['WindowDimensionsService', '$scope', '$timeout',
                function (WindowDimensionsService, $scope, $timeout) {
                    var STORY_TILE_WIDTH_PX = 360;
                    $scope.leftmostCardIndices = 0;
                    var MAX_NUM_TILES_PER_ROW = 4;
                    $scope.tileDisplayCount = 0;
                    var initCarousels = function () {
                        $scope.canonicalStories = $scope.getCanonicalStories();
                        if (!$scope.canonicalStories) {
                            return;
                        }
                        var windowWidth = $(window).width();
                        $scope.tileDisplayCount = Math.min(Math.floor(windowWidth / (STORY_TILE_WIDTH_PX + 20)), MAX_NUM_TILES_PER_ROW);
                        $('.oppia-topic-viewer-carousel').css({
                            width: ($scope.tileDisplayCount * STORY_TILE_WIDTH_PX) + 'px'
                        });
                        var carouselJQuerySelector = ('.oppia-topic-viewer-carousel');
                        var carouselScrollPositionPx = $(carouselJQuerySelector).scrollLeft();
                        var index = Math.ceil(carouselScrollPositionPx / STORY_TILE_WIDTH_PX);
                        $scope.leftmostCardIndices = index;
                    };
                    var isAnyCarouselCurrentlyScrolling = false;
                    $scope.scroll = function (isLeftScroll) {
                        if (isAnyCarouselCurrentlyScrolling) {
                            return;
                        }
                        var carouselJQuerySelector = ('.oppia-topic-viewer-carousel');
                        var direction = isLeftScroll ? -1 : 1;
                        var carouselScrollPositionPx = $(carouselJQuerySelector).scrollLeft();
                        // Prevent scrolling if there more carousel pixed widths than
                        // there are tile widths.
                        if ($scope.canonicalStories.length <= $scope.tileDisplayCount) {
                            return;
                        }
                        carouselScrollPositionPx = Math.max(0, carouselScrollPositionPx);
                        if (isLeftScroll) {
                            $scope.leftmostCardIndices = Math.max(0, $scope.leftmostCardIndices - $scope.tileDisplayCount);
                        }
                        else {
                            $scope.leftmostCardIndices = Math.min($scope.canonicalStories.length - $scope.tileDisplayCount + 1, $scope.leftmostCardIndices + $scope.tileDisplayCount);
                        }
                        var newScrollPositionPx = carouselScrollPositionPx +
                            ($scope.tileDisplayCount * STORY_TILE_WIDTH_PX * direction);
                        $(carouselJQuerySelector).animate({
                            scrollLeft: newScrollPositionPx
                        }, {
                            duration: 800,
                            queue: false,
                            start: function () {
                                isAnyCarouselCurrentlyScrolling = true;
                            },
                            complete: function () {
                                isAnyCarouselCurrentlyScrolling = false;
                            }
                        });
                    };
                    var topicViewerWindowCutoffPx = 895;
                    $scope.topicViewerWindowIsNarrow = (WindowDimensionsService.getWidth() <= topicViewerWindowCutoffPx);
                    WindowDimensionsService.registerOnResizeHook(function () {
                        $scope.topicViewerWindowIsNarrow = (WindowDimensionsService.getWidth() <= topicViewerWindowCutoffPx);
                        $scope.$apply();
                    });
                    $scope.incrementLeftmostCardIndex = function () {
                        $scope.leftmostCardIndices++;
                    };
                    $scope.decrementLeftmostCardIndex = function () {
                        $scope.leftmostCardIndices--;
                    };
                    $timeout(function () {
                        initCarousels();
                    }, 390);
                    $(window).resize(function () {
                        initCarousels();
                        $scope.$apply();
                    });
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/topic-viewer-page/subtopics-list/subtopics-list.directive.ts":
/*!****************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topic-viewer-page/subtopics-list/subtopics-list.directive.ts ***!
  \****************************************************************************************************/
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
 * @fileoverview Directive for the subtopics list.
 */
__webpack_require__(/*! components/summary-tile/subtopic-summary-tile.directive.ts */ "./core/templates/dev/head/components/summary-tile/subtopic-summary-tile.directive.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/contextual/WindowDimensionsService.ts */ "./core/templates/dev/head/services/contextual/WindowDimensionsService.ts");
angular.module('oppia').directive('subtopicsList', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {
                getSubtopics: '&subtopicsList',
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topic-viewer-page/subtopics-list/' +
                'subtopics-list.directive.html'),
            controller: [
                'WindowDimensionsService', '$scope', '$timeout', 'UrlService',
                function (WindowDimensionsService, $scope, $timeout, UrlService) {
                    var SUBTOPIC_TILE_WIDTH_PX = 310;
                    $scope.leftmostCardIndices = 0;
                    var MAX_NUM_TILES_PER_ROW = 4;
                    $scope.tileDisplayCount = 0;
                    $scope.topicName = UrlService.getTopicNameFromLearnerUrl();
                    var initCarousels = function () {
                        $scope.subtopics = $scope.getSubtopics();
                        if (!$scope.subtopics) {
                            return;
                        }
                        var windowWidth = $(window).width();
                        $scope.tileDisplayCount = Math.min(Math.floor(windowWidth / (SUBTOPIC_TILE_WIDTH_PX + 20)), MAX_NUM_TILES_PER_ROW);
                        $('.oppia-topic-viewer-carousel').css({
                            width: ($scope.tileDisplayCount * SUBTOPIC_TILE_WIDTH_PX) + 'px'
                        });
                        var carouselJQuerySelector = ('.oppia-topic-viewer-carousel');
                        var carouselScrollPositionPx = $(carouselJQuerySelector).scrollLeft();
                        var index = Math.ceil(carouselScrollPositionPx / SUBTOPIC_TILE_WIDTH_PX);
                        $scope.leftmostCardIndices = index;
                    };
                    var isAnyCarouselCurrentlyScrolling = false;
                    $scope.scroll = function (isLeftScroll) {
                        if (isAnyCarouselCurrentlyScrolling) {
                            return;
                        }
                        var carouselJQuerySelector = ('.oppia-topic-viewer-carousel');
                        var direction = isLeftScroll ? -1 : 1;
                        var carouselScrollPositionPx = $(carouselJQuerySelector).scrollLeft();
                        // Prevent scrolling if there more carousel pixed widths than
                        // there are tile widths.
                        if ($scope.subtopics.length <= $scope.tileDisplayCount) {
                            return;
                        }
                        carouselScrollPositionPx = Math.max(0, carouselScrollPositionPx);
                        if (isLeftScroll) {
                            $scope.leftmostCardIndices = Math.max(0, $scope.leftmostCardIndices - $scope.tileDisplayCount);
                        }
                        else {
                            $scope.leftmostCardIndices = Math.min($scope.subtopics.length - $scope.tileDisplayCount + 1, $scope.leftmostCardIndices + $scope.tileDisplayCount);
                        }
                        var newScrollPositionPx = carouselScrollPositionPx +
                            ($scope.tileDisplayCount * SUBTOPIC_TILE_WIDTH_PX * direction);
                        $(carouselJQuerySelector).animate({
                            scrollLeft: newScrollPositionPx
                        }, {
                            duration: 800,
                            queue: false,
                            start: function () {
                                isAnyCarouselCurrentlyScrolling = true;
                            },
                            complete: function () {
                                isAnyCarouselCurrentlyScrolling = false;
                            }
                        });
                    };
                    var topicViewerWindowCutoffPx = 895;
                    $scope.topicViewerWindowIsNarrow = (WindowDimensionsService.getWidth() <= topicViewerWindowCutoffPx);
                    WindowDimensionsService.registerOnResizeHook(function () {
                        $scope.topicViewerWindowIsNarrow = (WindowDimensionsService.getWidth() <= topicViewerWindowCutoffPx);
                        $scope.$apply();
                    });
                    $scope.incrementLeftmostCardIndex = function () {
                        $scope.leftmostCardIndices++;
                    };
                    $scope.decrementLeftmostCardIndex = function () {
                        $scope.leftmostCardIndices--;
                    };
                    $timeout(function () {
                        initCarousels();
                    }, 390);
                    $(window).resize(function () {
                        initCarousels();
                        $scope.$apply();
                    });
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/topic-viewer-page/topic-viewer-page.controller.ts":
/*!*****************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topic-viewer-page/topic-viewer-page.controller.ts ***!
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
 * @fileoverview Directive for the topic viewer.
 */
__webpack_require__(/*! base_components/BaseContentDirective.ts */ "./core/templates/dev/head/base_components/BaseContentDirective.ts");
__webpack_require__(/*! components/common-layout-directives/common-elements/background-banner.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/common-elements/background-banner.directive.ts");
__webpack_require__(/*! components/skills-mastery-list/skills-mastery-list.directive.ts */ "./core/templates/dev/head/components/skills-mastery-list/skills-mastery-list.directive.ts");
__webpack_require__(/*! pages/topic-viewer-page/stories-list/stories-list.directive.ts */ "./core/templates/dev/head/pages/topic-viewer-page/stories-list/stories-list.directive.ts");
__webpack_require__(/*! pages/topic-viewer-page/subtopics-list/subtopics-list.directive.ts */ "./core/templates/dev/head/pages/topic-viewer-page/subtopics-list/subtopics-list.directive.ts");
__webpack_require__(/*! pages/topic-viewer-page/practice-tab/practice-tab.directive.ts */ "./core/templates/dev/head/pages/topic-viewer-page/practice-tab/practice-tab.directive.ts");
__webpack_require__(/*! pages/topic-viewer-page/stories-list/stories-list.directive.ts */ "./core/templates/dev/head/pages/topic-viewer-page/stories-list/stories-list.directive.ts");
__webpack_require__(/*! domain/topic_viewer/TopicViewerBackendApiService.ts */ "./core/templates/dev/head/domain/topic_viewer/TopicViewerBackendApiService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/PageTitleService.ts */ "./core/templates/dev/head/services/PageTitleService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
__webpack_require__(/*! services/contextual/WindowDimensionsService.ts */ "./core/templates/dev/head/services/contextual/WindowDimensionsService.ts");
angular.module('oppia').directive('topicViewerPage', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topic-viewer-page/topic-viewer-page.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$rootScope', '$window', 'AlertsService',
                'PageTitleService', 'TopicViewerBackendApiService',
                'UrlService', 'WindowDimensionsService', 'FATAL_ERROR_CODES',
                function ($rootScope, $window, AlertsService, PageTitleService, TopicViewerBackendApiService, UrlService, WindowDimensionsService, FATAL_ERROR_CODES) {
                    var ctrl = this;
                    ctrl.setActiveTab = function (newActiveTabName) {
                        ctrl.activeTab = newActiveTabName;
                    };
                    ctrl.setActiveTab('story');
                    ctrl.checkMobileView = function () {
                        return (WindowDimensionsService.getWidth() < 500);
                    };
                    ctrl.topicName = UrlService.getTopicNameFromLearnerUrl();
                    PageTitleService.setPageTitle(ctrl.topicName + ' - Oppia');
                    $rootScope.loadingMessage = 'Loading';
                    TopicViewerBackendApiService.fetchTopicData(ctrl.topicName).then(function (topicDataDict) {
                        ctrl.topicId = topicDataDict.topic_id;
                        ctrl.canonicalStoriesList = topicDataDict.canonical_story_dicts;
                        ctrl.degreesOfMastery = topicDataDict.degrees_of_mastery;
                        ctrl.skillDescriptions = topicDataDict.skill_descriptions;
                        ctrl.subtopics = topicDataDict.subtopics;
                        $rootScope.loadingMessage = '';
                        ctrl.topicId = topicDataDict.id;
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

/***/ "./core/templates/dev/head/pages/topic-viewer-page/topic-viewer-page.module.ts":
/*!*************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topic-viewer-page/topic-viewer-page.module.ts ***!
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
var topic_viewer_domain_constants_1 = __webpack_require__(/*! domain/topic_viewer/topic-viewer-domain.constants */ "./core/templates/dev/head/domain/topic_viewer/topic-viewer-domain.constants.ts");
var TopicViewerPageModule = /** @class */ (function () {
    function TopicViewerPageModule() {
    }
    // Empty placeholder method to satisfy the `Compiler`.
    TopicViewerPageModule.prototype.ngDoBootstrap = function () { };
    TopicViewerPageModule = __decorate([
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
                topic_viewer_domain_constants_1.TopicViewerDomainConstants,
            ]
        })
    ], TopicViewerPageModule);
    return TopicViewerPageModule;
}());
var platform_browser_dynamic_1 = __webpack_require__(/*! @angular/platform-browser-dynamic */ "./node_modules/@angular/platform-browser-dynamic/fesm5/platform-browser-dynamic.js");
var static_2 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var bootstrapFn = function (extraProviders) {
    var platformRef = platform_browser_dynamic_1.platformBrowserDynamic(extraProviders);
    return platformRef.bootstrapModule(TopicViewerPageModule);
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

/***/ "./core/templates/dev/head/pages/topic-viewer-page/topic-viewer-page.scripts.ts":
/*!**************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topic-viewer-page/topic-viewer-page.scripts.ts ***!
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
 * @fileoverview Directive scripts for the topic viewer.
 */
// The module needs to be loaded before everything else since it defines the
// main module the elements are attached to.
__webpack_require__(/*! pages/topic-viewer-page/topic-viewer-page.module.ts */ "./core/templates/dev/head/pages/topic-viewer-page/topic-viewer-page.module.ts");
__webpack_require__(/*! App.ts */ "./core/templates/dev/head/App.ts");
__webpack_require__(/*! pages/topic-viewer-page/navbar-breadcrumb/topic-viewer-navbar-breadcrumb.directive.ts */ "./core/templates/dev/head/pages/topic-viewer-page/navbar-breadcrumb/topic-viewer-navbar-breadcrumb.directive.ts");
__webpack_require__(/*! pages/topic-viewer-page/topic-viewer-page.controller.ts */ "./core/templates/dev/head/pages/topic-viewer-page/topic-viewer-page.controller.ts");


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvYmFzZV9jb21wb25lbnRzL0Jhc2VDb250ZW50RGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2Jhc2VfY29tcG9uZW50cy9XYXJuaW5nTG9hZGVyRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2NvbW1vbi1lbGVtZW50cy9iYWNrZ3JvdW5kLWJhbm5lci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb25jZXB0LWNhcmQvY29uY2VwdC1jYXJkLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL3NraWxscy1tYXN0ZXJ5LWxpc3Qvc2tpbGxzLW1hc3RlcnktbGlzdC5jb25zdGFudHMuYWpzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvc2tpbGxzLW1hc3RlcnktbGlzdC9za2lsbHMtbWFzdGVyeS1saXN0LmNvbnN0YW50cy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL3NraWxscy1tYXN0ZXJ5LWxpc3Qvc2tpbGxzLW1hc3RlcnktbGlzdC5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9zdW1tYXJ5LXRpbGUvc3Rvcnktc3VtbWFyeS10aWxlLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL3N1bW1hcnktdGlsZS9zdWJ0b3BpYy1zdW1tYXJ5LXRpbGUuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9vYmplY3RzL29iamVjdHMtZG9tYWluLmNvbnN0YW50cy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vc2tpbGwvQ29uY2VwdENhcmRCYWNrZW5kQXBpU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vc2tpbGwvQ29uY2VwdENhcmRPYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9za2lsbC9za2lsbC1kb21haW4uY29uc3RhbnRzLmFqcy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vc2tpbGwvc2tpbGwtZG9tYWluLmNvbnN0YW50cy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vdG9waWNfdmlld2VyL1RvcGljVmlld2VyQmFja2VuZEFwaVNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3RvcGljX3ZpZXdlci90b3BpYy12aWV3ZXItZG9tYWluLmNvbnN0YW50cy5hanMudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3RvcGljX3ZpZXdlci90b3BpYy12aWV3ZXItZG9tYWluLmNvbnN0YW50cy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9maWx0ZXJzL2Zvcm1hdC1ydGUtcHJldmlldy5maWx0ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvT3BwaWFGb290ZXJEaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvcHJhY3RpY2Utc2Vzc2lvbi1wYWdlL3ByYWN0aWNlLXNlc3Npb24tcGFnZS5jb25zdGFudHMuYWpzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3ByYWN0aWNlLXNlc3Npb24tcGFnZS9wcmFjdGljZS1zZXNzaW9uLXBhZ2UuY29uc3RhbnRzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3RvcGljLXZpZXdlci1wYWdlL25hdmJhci1icmVhZGNydW1iL3RvcGljLXZpZXdlci1uYXZiYXItYnJlYWRjcnVtYi5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvdG9waWMtdmlld2VyLXBhZ2UvcHJhY3RpY2UtdGFiL3ByYWN0aWNlLXRhYi5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvdG9waWMtdmlld2VyLXBhZ2Uvc3Rvcmllcy1saXN0L3N0b3JpZXMtbGlzdC5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvdG9waWMtdmlld2VyLXBhZ2Uvc3VidG9waWNzLWxpc3Qvc3VidG9waWNzLWxpc3QuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3RvcGljLXZpZXdlci1wYWdlL3RvcGljLXZpZXdlci1wYWdlLmNvbnRyb2xsZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvdG9waWMtdmlld2VyLXBhZ2UvdG9waWMtdmlld2VyLXBhZ2UubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3RvcGljLXZpZXdlci1wYWdlL3RvcGljLXZpZXdlci1wYWdlLnNjcmlwdHMudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvUGFnZVRpdGxlU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9leHRlbnNpb25zL2ludGVyYWN0aW9ucy9pbnRlcmFjdGlvbnMtZXh0ZW5zaW9uLmNvbnN0YW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxnQkFBUSxvQkFBb0I7QUFDNUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBaUIsNEJBQTRCO0FBQzdDO0FBQ0E7QUFDQSwwQkFBa0IsMkJBQTJCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxrREFBMEMsZ0NBQWdDO0FBQzFFO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0VBQXdELGtCQUFrQjtBQUMxRTtBQUNBLHlEQUFpRCxjQUFjO0FBQy9EOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpREFBeUMsaUNBQWlDO0FBQzFFLHdIQUFnSCxtQkFBbUIsRUFBRTtBQUNySTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1DQUEyQiwwQkFBMEIsRUFBRTtBQUN2RCx5Q0FBaUMsZUFBZTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFD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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4Q0FBOEMsY0FBYztBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7Ozs7Ozs7Ozs7OztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQsbUJBQU8sQ0FBQyx3SEFBNEM7QUFDcEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFB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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDBJQUFxRDtBQUM3RCxtQkFBTyxDQUFDLGdEQUFRO0FBQ2hCLG1CQUFPLENBQUMsOE1BQ3lDO0FBQ2pELG1CQUFPLENBQUMsa0pBQXlEOzs7Ozs7Ozs7Ozs7QUN0QmpFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNENBQTRDLFFBQVE7QUFDcEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhDQUE4QyxjQUFjO0FBQzVEO0FBQ0E7QUFDQTtBQUNBLGVBQWUsbUJBQU8sQ0FBQyw4RkFBeUI7QUFDaEQsYUFBYSxtQkFBTyxDQUFDLGlFQUFlO0FBQ3BDLHlCQUF5QixtQkFBTyxDQUFDLHFHQUEyQjtBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBOzs7Ozs7Ozs7Ozs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4Q0FBOEMsY0FBYztBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEIiwiZmlsZSI6InRvcGljX3ZpZXdlci5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBpbnN0YWxsIGEgSlNPTlAgY2FsbGJhY2sgZm9yIGNodW5rIGxvYWRpbmdcbiBcdGZ1bmN0aW9uIHdlYnBhY2tKc29ucENhbGxiYWNrKGRhdGEpIHtcbiBcdFx0dmFyIGNodW5rSWRzID0gZGF0YVswXTtcbiBcdFx0dmFyIG1vcmVNb2R1bGVzID0gZGF0YVsxXTtcbiBcdFx0dmFyIGV4ZWN1dGVNb2R1bGVzID0gZGF0YVsyXTtcblxuIFx0XHQvLyBhZGQgXCJtb3JlTW9kdWxlc1wiIHRvIHRoZSBtb2R1bGVzIG9iamVjdCxcbiBcdFx0Ly8gdGhlbiBmbGFnIGFsbCBcImNodW5rSWRzXCIgYXMgbG9hZGVkIGFuZCBmaXJlIGNhbGxiYWNrXG4gXHRcdHZhciBtb2R1bGVJZCwgY2h1bmtJZCwgaSA9IDAsIHJlc29sdmVzID0gW107XG4gXHRcdGZvcig7aSA8IGNodW5rSWRzLmxlbmd0aDsgaSsrKSB7XG4gXHRcdFx0Y2h1bmtJZCA9IGNodW5rSWRzW2ldO1xuIFx0XHRcdGlmKGluc3RhbGxlZENodW5rc1tjaHVua0lkXSkge1xuIFx0XHRcdFx0cmVzb2x2ZXMucHVzaChpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF1bMF0pO1xuIFx0XHRcdH1cbiBcdFx0XHRpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0gPSAwO1xuIFx0XHR9XG4gXHRcdGZvcihtb2R1bGVJZCBpbiBtb3JlTW9kdWxlcykge1xuIFx0XHRcdGlmKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtb3JlTW9kdWxlcywgbW9kdWxlSWQpKSB7XG4gXHRcdFx0XHRtb2R1bGVzW21vZHVsZUlkXSA9IG1vcmVNb2R1bGVzW21vZHVsZUlkXTtcbiBcdFx0XHR9XG4gXHRcdH1cbiBcdFx0aWYocGFyZW50SnNvbnBGdW5jdGlvbikgcGFyZW50SnNvbnBGdW5jdGlvbihkYXRhKTtcblxuIFx0XHR3aGlsZShyZXNvbHZlcy5sZW5ndGgpIHtcbiBcdFx0XHRyZXNvbHZlcy5zaGlmdCgpKCk7XG4gXHRcdH1cblxuIFx0XHQvLyBhZGQgZW50cnkgbW9kdWxlcyBmcm9tIGxvYWRlZCBjaHVuayB0byBkZWZlcnJlZCBsaXN0XG4gXHRcdGRlZmVycmVkTW9kdWxlcy5wdXNoLmFwcGx5KGRlZmVycmVkTW9kdWxlcywgZXhlY3V0ZU1vZHVsZXMgfHwgW10pO1xuXG4gXHRcdC8vIHJ1biBkZWZlcnJlZCBtb2R1bGVzIHdoZW4gYWxsIGNodW5rcyByZWFkeVxuIFx0XHRyZXR1cm4gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKTtcbiBcdH07XG4gXHRmdW5jdGlvbiBjaGVja0RlZmVycmVkTW9kdWxlcygpIHtcbiBcdFx0dmFyIHJlc3VsdDtcbiBcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGRlZmVycmVkTW9kdWxlcy5sZW5ndGg7IGkrKykge1xuIFx0XHRcdHZhciBkZWZlcnJlZE1vZHVsZSA9IGRlZmVycmVkTW9kdWxlc1tpXTtcbiBcdFx0XHR2YXIgZnVsZmlsbGVkID0gdHJ1ZTtcbiBcdFx0XHRmb3IodmFyIGogPSAxOyBqIDwgZGVmZXJyZWRNb2R1bGUubGVuZ3RoOyBqKyspIHtcbiBcdFx0XHRcdHZhciBkZXBJZCA9IGRlZmVycmVkTW9kdWxlW2pdO1xuIFx0XHRcdFx0aWYoaW5zdGFsbGVkQ2h1bmtzW2RlcElkXSAhPT0gMCkgZnVsZmlsbGVkID0gZmFsc2U7XG4gXHRcdFx0fVxuIFx0XHRcdGlmKGZ1bGZpbGxlZCkge1xuIFx0XHRcdFx0ZGVmZXJyZWRNb2R1bGVzLnNwbGljZShpLS0sIDEpO1xuIFx0XHRcdFx0cmVzdWx0ID0gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSBkZWZlcnJlZE1vZHVsZVswXSk7XG4gXHRcdFx0fVxuIFx0XHR9XG5cbiBcdFx0cmV0dXJuIHJlc3VsdDtcbiBcdH1cblxuIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gb2JqZWN0IHRvIHN0b3JlIGxvYWRlZCBhbmQgbG9hZGluZyBjaHVua3NcbiBcdC8vIHVuZGVmaW5lZCA9IGNodW5rIG5vdCBsb2FkZWQsIG51bGwgPSBjaHVuayBwcmVsb2FkZWQvcHJlZmV0Y2hlZFxuIFx0Ly8gUHJvbWlzZSA9IGNodW5rIGxvYWRpbmcsIDAgPSBjaHVuayBsb2FkZWRcbiBcdHZhciBpbnN0YWxsZWRDaHVua3MgPSB7XG4gXHRcdFwidG9waWNfdmlld2VyXCI6IDBcbiBcdH07XG5cbiBcdHZhciBkZWZlcnJlZE1vZHVsZXMgPSBbXTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0dmFyIGpzb25wQXJyYXkgPSB3aW5kb3dbXCJ3ZWJwYWNrSnNvbnBcIl0gPSB3aW5kb3dbXCJ3ZWJwYWNrSnNvbnBcIl0gfHwgW107XG4gXHR2YXIgb2xkSnNvbnBGdW5jdGlvbiA9IGpzb25wQXJyYXkucHVzaC5iaW5kKGpzb25wQXJyYXkpO1xuIFx0anNvbnBBcnJheS5wdXNoID0gd2VicGFja0pzb25wQ2FsbGJhY2s7XG4gXHRqc29ucEFycmF5ID0ganNvbnBBcnJheS5zbGljZSgpO1xuIFx0Zm9yKHZhciBpID0gMDsgaSA8IGpzb25wQXJyYXkubGVuZ3RoOyBpKyspIHdlYnBhY2tKc29ucENhbGxiYWNrKGpzb25wQXJyYXlbaV0pO1xuIFx0dmFyIHBhcmVudEpzb25wRnVuY3Rpb24gPSBvbGRKc29ucEZ1bmN0aW9uO1xuXG5cbiBcdC8vIGFkZCBlbnRyeSBtb2R1bGUgdG8gZGVmZXJyZWQgbGlzdFxuIFx0ZGVmZXJyZWRNb2R1bGVzLnB1c2goW1wiLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy90b3BpYy12aWV3ZXItcGFnZS90b3BpYy12aWV3ZXItcGFnZS5zY3JpcHRzLnRzXCIsXCJ2ZW5kb3JzfmFib3V0fmFkbWlufmNvbGxlY3Rpb25fZWRpdG9yfmNvbGxlY3Rpb25fcGxheWVyfmNvbW11bml0eV9kYXNoYm9hcmR+Y29udGFjdH5jcmVhdG9yX2Rhc2hib2Fyfjc4NTZjMDVhXCIsXCJhYm91dH5hZG1pbn5jb2xsZWN0aW9uX2VkaXRvcn5jb2xsZWN0aW9uX3BsYXllcn5jb21tdW5pdHlfZGFzaGJvYXJkfmNvbnRhY3R+Y3JlYXRvcl9kYXNoYm9hcmR+ZG9uYXRlfmUwNmE0YTE3XCIsXCJjb2xsZWN0aW9uX2VkaXRvcn50b3BpY192aWV3ZXJcIl0pO1xuIFx0Ly8gcnVuIGRlZmVycmVkIG1vZHVsZXMgd2hlbiByZWFkeVxuIFx0cmV0dXJuIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIEJhc2UgVHJhbnNjbHVzaW9uIENvbXBvbmVudC5cbiAqL1xucmVxdWlyZSgnYmFzZV9jb21wb25lbnRzL1dhcm5pbmdMb2FkZXJEaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL09wcGlhRm9vdGVyRGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vc2lkZWJhci9TaWRlYmFyU3RhdHVzU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvY29udGV4dHVhbC9VcmxTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9zdGF0ZWZ1bC9CYWNrZ3JvdW5kTWFza1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnYmFzZUNvbnRlbnQnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRyYW5zY2x1ZGU6IHtcbiAgICAgICAgICAgICAgICBicmVhZGNydW1iOiAnP25hdmJhckJyZWFkY3J1bWInLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6ICdjb250ZW50JyxcbiAgICAgICAgICAgICAgICBmb290ZXI6ICc/cGFnZUZvb3RlcicsXG4gICAgICAgICAgICAgICAgbmF2T3B0aW9uczogJz9uYXZPcHRpb25zJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9iYXNlX2NvbXBvbmVudHMvYmFzZV9jb250ZW50X2RpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJyRyb290U2NvcGUnLCAnQmFja2dyb3VuZE1hc2tTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnU2lkZWJhclN0YXR1c1NlcnZpY2UnLCAnVXJsU2VydmljZScsICdTSVRFX0ZFRURCQUNLX0ZPUk1fVVJMJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQmFja2dyb3VuZE1hc2tTZXJ2aWNlLCBTaWRlYmFyU3RhdHVzU2VydmljZSwgVXJsU2VydmljZSwgU0lURV9GRUVEQkFDS19GT1JNX1VSTCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaWZyYW1lZCA9IFVybFNlcnZpY2UuaXNJZnJhbWVkKCk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2l0ZUZlZWRiYWNrRm9ybVVybCA9IFNJVEVfRkVFREJBQ0tfRk9STV9VUkw7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaXNTaWRlYmFyU2hvd24gPSBTaWRlYmFyU3RhdHVzU2VydmljZS5pc1NpZGViYXJTaG93bjtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5jbG9zZVNpZGViYXJPblN3aXBlID0gU2lkZWJhclN0YXR1c1NlcnZpY2UuY2xvc2VTaWRlYmFyO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlzQmFja2dyb3VuZE1hc2tBY3RpdmUgPSBCYWNrZ3JvdW5kTWFza1NlcnZpY2UuaXNNYXNrQWN0aXZlO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLkRFVl9NT0RFID0gJHJvb3RTY29wZS5ERVZfTU9ERTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5za2lwVG9NYWluQ29udGVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtYWluQ29udGVudEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb3BwaWEtbWFpbi1jb250ZW50Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW1haW5Db250ZW50RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdWYXJpYWJsZSBtYWluQ29udGVudEVsZW1lbnQgaXMgdW5kZWZpbmVkLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbWFpbkNvbnRlbnRFbGVtZW50LnRhYkluZGV4ID0gLTE7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYWluQ29udGVudEVsZW1lbnQuc2Nyb2xsSW50b1ZpZXcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1haW5Db250ZW50RWxlbWVudC5mb2N1cygpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB3YXJuaW5nX2xvYWRlci5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCd3YXJuaW5nTG9hZGVyJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9iYXNlX2NvbXBvbmVudHMvd2FybmluZ19sb2FkZXJfZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnQWxlcnRzU2VydmljZScsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKEFsZXJ0c1NlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLkFsZXJ0c1NlcnZpY2UgPSBBbGVydHNTZXJ2aWNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE1IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgYmFja2dyb3VuZCBiYW5uZXIuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnYmFja2dyb3VuZEJhbm5lcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2NvbW1vbi1lbGVtZW50cy8nICtcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1iYW5uZXIuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvc3NpYmxlQmFubmVyRmlsZW5hbWVzID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2Jhbm5lckEuc3ZnJywgJ2Jhbm5lckIuc3ZnJywgJ2Jhbm5lckMuc3ZnJywgJ2Jhbm5lckQuc3ZnJ1xuICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYmFubmVySW1hZ2VGaWxlbmFtZSA9IHBvc3NpYmxlQmFubmVyRmlsZW5hbWVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHBvc3NpYmxlQmFubmVyRmlsZW5hbWVzLmxlbmd0aCldO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmJhbm5lckltYWdlRmlsZVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldFN0YXRpY0ltYWdlVXJsKCcvYmFja2dyb3VuZC8nICsgYmFubmVySW1hZ2VGaWxlbmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBjb25jZXB0IGNhcmRzIHZpZXdlci5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3NraWxsL0NvbmNlcHRDYXJkQmFja2VuZEFwaVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9za2lsbC9Db25jZXB0Q2FyZE9iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2ZpbHRlcnMvZm9ybWF0LXJ0ZS1wcmV2aWV3LmZpbHRlci50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdjb25jZXB0Q2FyZCcsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7XG4gICAgICAgICAgICAgICAgZ2V0U2tpbGxJZHM6ICcmc2tpbGxJZHMnLFxuICAgICAgICAgICAgICAgIGluZGV4OiAnPSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2NvbmNlcHQtY2FyZC9jb25jZXB0LWNhcmQudGVtcGxhdGUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJGZpbHRlcicsICckcm9vdFNjb3BlJyxcbiAgICAgICAgICAgICAgICAnQ29uY2VwdENhcmRCYWNrZW5kQXBpU2VydmljZScsICdDb25jZXB0Q2FyZE9iamVjdEZhY3RvcnknLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICRmaWx0ZXIsICRyb290U2NvcGUsIENvbmNlcHRDYXJkQmFja2VuZEFwaVNlcnZpY2UsIENvbmNlcHRDYXJkT2JqZWN0RmFjdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY29uY2VwdENhcmRzID0gW107XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50Q29uY2VwdENhcmQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbnVtYmVyT2ZXb3JrZWRFeGFtcGxlc1Nob3duID0gMDtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5sb2FkaW5nTWVzc2FnZSA9ICdMb2FkaW5nJztcbiAgICAgICAgICAgICAgICAgICAgQ29uY2VwdENhcmRCYWNrZW5kQXBpU2VydmljZS5sb2FkQ29uY2VwdENhcmRzKGN0cmwuZ2V0U2tpbGxJZHMoKSkudGhlbihmdW5jdGlvbiAoY29uY2VwdENhcmRCYWNrZW5kRGljdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmNlcHRDYXJkQmFja2VuZERpY3RzLmZvckVhY2goZnVuY3Rpb24gKGNvbmNlcHRDYXJkQmFja2VuZERpY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmNvbmNlcHRDYXJkcy5wdXNoKENvbmNlcHRDYXJkT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3QoY29uY2VwdENhcmRCYWNrZW5kRGljdCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmxvYWRpbmdNZXNzYWdlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Q29uY2VwdENhcmQgPSBjdHJsLmNvbmNlcHRDYXJkc1tjdHJsLmluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0U2tpbGxFeHBsYW5hdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkZmlsdGVyKCdmb3JtYXRSdGVQcmV2aWV3JykoY3VycmVudENvbmNlcHRDYXJkLmdldEV4cGxhbmF0aW9uKCkuZ2V0SHRtbCgpKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc0xhc3RXb3JrZWRFeGFtcGxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bWJlck9mV29ya2VkRXhhbXBsZXNTaG93biA9PT1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Q29uY2VwdENhcmQuZ2V0V29ya2VkRXhhbXBsZXMoKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2hvd01vcmVXb3JrZWRFeGFtcGxlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bWJlck9mV29ya2VkRXhhbXBsZXNTaG93bisrO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNob3dXb3JrZWRFeGFtcGxlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB3b3JrZWRFeGFtcGxlc1Nob3duID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bWJlck9mV29ya2VkRXhhbXBsZXNTaG93bjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd29ya2VkRXhhbXBsZXNTaG93bi5wdXNoKCRmaWx0ZXIoJ2Zvcm1hdFJ0ZVByZXZpZXcnKShjdXJyZW50Q29uY2VwdENhcmQuZ2V0V29ya2VkRXhhbXBsZXMoKVtpXS5nZXRIdG1sKCkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB3b3JrZWRFeGFtcGxlc1Nob3duO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJHdhdGNoKCckY3RybC5pbmRleCcsIGZ1bmN0aW9uIChuZXdJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudENvbmNlcHRDYXJkID0gY3RybC5jb25jZXB0Q2FyZHNbbmV3SW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgbnVtYmVyT2ZXb3JrZWRFeGFtcGxlc1Nob3duID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBDb25zdGFudHMgZm9yIHRoZSBza2lsbHMgbWFzdGVyeSBsaXN0LlxuICovXG52YXIgc2tpbGxzX21hc3RlcnlfbGlzdF9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJjb21wb25lbnRzL3NraWxscy1tYXN0ZXJ5LWxpc3Qvc2tpbGxzLW1hc3RlcnktbGlzdC5jb25zdGFudHNcIik7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnTUFTVEVSWV9DVVRPRkYnLCBza2lsbHNfbWFzdGVyeV9saXN0X2NvbnN0YW50c18xLlNraWxsTWFzdGVyeUxpc3RDb25zdGFudHMuTUFTVEVSWV9DVVRPRkYpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ01BU1RFUllfQ09MT1JTJywgc2tpbGxzX21hc3RlcnlfbGlzdF9jb25zdGFudHNfMS5Ta2lsbE1hc3RlcnlMaXN0Q29uc3RhbnRzLk1BU1RFUllfQ09MT1JTKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uc3RhbnRzIGZvciB0aGUgc2tpbGxzIG1hc3RlcnkgbGlzdC5cbiAqL1xudmFyIFNraWxsTWFzdGVyeUxpc3RDb25zdGFudHMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU2tpbGxNYXN0ZXJ5TGlzdENvbnN0YW50cygpIHtcbiAgICB9XG4gICAgU2tpbGxNYXN0ZXJ5TGlzdENvbnN0YW50cy5NQVNURVJZX0NVVE9GRiA9IHtcbiAgICAgICAgR09PRF9DVVRPRkY6IDAuNyxcbiAgICAgICAgTUVESVVNX0NVVE9GRjogMC40XG4gICAgfTtcbiAgICBTa2lsbE1hc3RlcnlMaXN0Q29uc3RhbnRzLk1BU1RFUllfQ09MT1JTID0ge1xuICAgICAgICAvLyBjb2xvciBncmVlblxuICAgICAgICBHT09EX01BU1RFUllfQ09MT1I6ICdyZ2IoMCwgMTUwLCAxMzYpJyxcbiAgICAgICAgLy8gY29sb3Igb3JhbmdlXG4gICAgICAgIE1FRElVTV9NQVNURVJZX0NPTE9SOiAncmdiKDIxNywgOTIsIDEyKScsXG4gICAgICAgIC8vIGNvbG9yIHJlZFxuICAgICAgICBCQURfTUFTVEVSWV9DT0xPUjogJ3JnYigyMDEsIDgwLCA2NiknXG4gICAgfTtcbiAgICByZXR1cm4gU2tpbGxNYXN0ZXJ5TGlzdENvbnN0YW50cztcbn0oKSk7XG5leHBvcnRzLlNraWxsTWFzdGVyeUxpc3RDb25zdGFudHMgPSBTa2lsbE1hc3RlcnlMaXN0Q29uc3RhbnRzO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBza2lsbHMgbWFzdGVyeSBsaXN0LlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL2NvbmNlcHQtY2FyZC9jb25jZXB0LWNhcmQuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL3NraWxscy1tYXN0ZXJ5LWxpc3Qvc2tpbGxzLW1hc3RlcnktbGlzdC5jb25zdGFudHMuYWpzLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Vc2VyU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdza2lsbHNNYXN0ZXJ5TGlzdCcsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7XG4gICAgICAgICAgICAgICAgZ2V0RGVncmVlc09mTWFzdGVyeTogJyZkZWdyZWVzT2ZNYXN0ZXJ5JyxcbiAgICAgICAgICAgICAgICBnZXRTa2lsbERlc2NyaXB0aW9uczogJyZza2lsbERlc2NyaXB0aW9ucydcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL3NraWxscy1tYXN0ZXJ5LWxpc3Qvc2tpbGxzLW1hc3RlcnktbGlzdC5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJHVpYk1vZGFsJywgJ1VzZXJTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnTUFTVEVSWV9DVVRPRkYnLCAnTUFTVEVSWV9DT0xPUlMnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbCwgVXNlclNlcnZpY2UsIE1BU1RFUllfQ1VUT0ZGLCBNQVNURVJZX0NPTE9SUykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwudXNlcklzTG9nZ2VkSW4gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBVc2VyU2VydmljZS5nZXRVc2VySW5mb0FzeW5jKCkudGhlbihmdW5jdGlvbiAodXNlckluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudXNlcklzTG9nZ2VkSW4gPSB1c2VySW5mby5pc0xvZ2dlZEluKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNvcnRlZFNraWxsSWRzID0gW107XG4gICAgICAgICAgICAgICAgICAgIHZhciBkZWdyZWVzT2ZNYXN0ZXJ5ID0gY3RybC5nZXREZWdyZWVzT2ZNYXN0ZXJ5KCk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2tpbGxJZHNBbmRNYXN0ZXJ5ID1cbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGRlZ3JlZXNPZk1hc3RlcnkpLm1hcChmdW5jdGlvbiAoc2tpbGxJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNraWxsSWQ6IHNraWxsSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hc3Rlcnk6IGRlZ3JlZXNPZk1hc3Rlcnlbc2tpbGxJZF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0TWFzdGVyeVBlcmNlbnRhZ2UgPSBmdW5jdGlvbiAoZGVncmVlT2ZNYXN0ZXJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChkZWdyZWVPZk1hc3RlcnkgKiAxMDApO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldENvbG9yRm9yTWFzdGVyeSA9IGZ1bmN0aW9uIChkZWdyZWVPZk1hc3RlcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkZWdyZWVPZk1hc3RlcnkgPj0gTUFTVEVSWV9DVVRPRkYuR09PRF9DVVRPRkYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gTUFTVEVSWV9DT0xPUlMuR09PRF9NQVNURVJZX0NPTE9SO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZGVncmVlT2ZNYXN0ZXJ5ID49IE1BU1RFUllfQ1VUT0ZGLk1FRElVTV9DVVRPRkYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gTUFTVEVSWV9DT0xPUlMuTUVESVVNX01BU1RFUllfQ09MT1I7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gTUFTVEVSWV9DT0xPUlMuQkFEX01BU1RFUllfQ09MT1I7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0TWFzdGVyeUJhclN0eWxlID0gZnVuY3Rpb24gKHNraWxsSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IGN0cmwuZ2V0TWFzdGVyeVBlcmNlbnRhZ2UoY3RybC5nZXREZWdyZWVzT2ZNYXN0ZXJ5KClbc2tpbGxJZF0pICsgJyUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IGN0cmwuZ2V0Q29sb3JGb3JNYXN0ZXJ5KGN0cmwuZ2V0RGVncmVlc09mTWFzdGVyeSgpW3NraWxsSWRdKVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5vcGVuQ29uY2VwdENhcmRNb2RhbCA9IGZ1bmN0aW9uIChza2lsbElkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2tpbGxEZXNjcmlwdGlvbiA9IGN0cmwuZ2V0U2tpbGxEZXNjcmlwdGlvbnMoKVtza2lsbElkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2NvbmNlcHQtY2FyZC9jb25jZXB0LWNhcmQtbW9kYWwudGVtcGxhdGUuaHRtbCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tkcm9wOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2tpbGxJZHMgPSBbc2tpbGxJZF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaW5kZXggPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmN1cnJlbnRTa2lsbCA9IHNraWxsRGVzY3JpcHRpb247XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2xvc2VNb2RhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5kaXNtaXNzKCdjYW5jZWwnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbXBvbmVudCBmb3IgYSBjYW5vbmljYWwgc3RvcnkgdGlsZS5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdzdG9yeVN1bW1hcnlUaWxlJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHtcbiAgICAgICAgICAgICAgICBnZXRTdG9yeUlkOiAnJnN0b3J5SWQnLFxuICAgICAgICAgICAgICAgIGdldFN0b3J5VGl0bGU6ICcmdGl0bGUnLFxuICAgICAgICAgICAgICAgIGdldFN0b3J5RGVzY3JpcHRpb246ICcmZGVzY3JpcHRpb24nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvc3VtbWFyeS10aWxlL3N0b3J5LXN1bW1hcnktdGlsZS5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWydTVE9SWV9WSUVXRVJfVVJMX1RFTVBMQVRFJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoU1RPUllfVklFV0VSX1VSTF9URU1QTEFURSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0U3RvcnlMaW5rID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKFNUT1JZX1ZJRVdFUl9VUkxfVEVNUExBVEUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdG9yeV9pZDogY3RybC5nZXRTdG9yeUlkKClcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldFN0YXRpY0ltYWdlVXJsID0gZnVuY3Rpb24gKHVybCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldFN0YXRpY0ltYWdlVXJsKHVybCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb21wb25lbnQgZm9yIGEgc3VidG9waWMgdGlsZS5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdzdWJ0b3BpY1N1bW1hcnlUaWxlJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHtcbiAgICAgICAgICAgICAgICBnZXRTa2lsbENvdW50OiAnJnNraWxsQ291bnQnLFxuICAgICAgICAgICAgICAgIGdldFN1YnRvcGljSWQ6ICcmc3VidG9waWNJZCcsXG4gICAgICAgICAgICAgICAgZ2V0U3VidG9waWNUaXRsZTogJyZzdWJ0b3BpY1RpdGxlJyxcbiAgICAgICAgICAgICAgICBnZXRUb3BpY05hbWU6ICcmdG9waWNOYW1lJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvc3VtbWFyeS10aWxlL3N1YnRvcGljLXN1bW1hcnktdGlsZS5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWydTVUJUT1BJQ19WSUVXRVJfVVJMX1RFTVBMQVRFJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoU1VCVE9QSUNfVklFV0VSX1VSTF9URU1QTEFURSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0U3VidG9waWNMaW5rID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKFNVQlRPUElDX1ZJRVdFUl9VUkxfVEVNUExBVEUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3BpY19uYW1lOiBjdHJsLmdldFRvcGljTmFtZSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YnRvcGljX2lkOiBjdHJsLmdldFN1YnRvcGljSWQoKS50b1N0cmluZygpXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRTdGF0aWNJbWFnZVVybCA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRTdGF0aWNJbWFnZVVybCh1cmwpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uc3RhbnRzIGZvciBvYmplY3RzIGRvbWFpbi5cbiAqL1xudmFyIE9iamVjdHNEb21haW5Db25zdGFudHMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gT2JqZWN0c0RvbWFpbkNvbnN0YW50cygpIHtcbiAgICB9XG4gICAgT2JqZWN0c0RvbWFpbkNvbnN0YW50cy5GUkFDVElPTl9QQVJTSU5HX0VSUk9SUyA9IHtcbiAgICAgICAgSU5WQUxJRF9DSEFSUzogJ1BsZWFzZSBvbmx5IHVzZSBudW1lcmljYWwgZGlnaXRzLCBzcGFjZXMgb3IgZm9yd2FyZCBzbGFzaGVzICgvKScsXG4gICAgICAgIElOVkFMSURfRk9STUFUOiAnUGxlYXNlIGVudGVyIGEgdmFsaWQgZnJhY3Rpb24gKGUuZy4sIDUvMyBvciAxIDIvMyknLFxuICAgICAgICBESVZJU0lPTl9CWV9aRVJPOiAnUGxlYXNlIGRvIG5vdCBwdXQgMCBpbiB0aGUgZGVub21pbmF0b3InXG4gICAgfTtcbiAgICBPYmplY3RzRG9tYWluQ29uc3RhbnRzLk5VTUJFUl9XSVRIX1VOSVRTX1BBUlNJTkdfRVJST1JTID0ge1xuICAgICAgICBJTlZBTElEX1ZBTFVFOiAnUGxlYXNlIGVuc3VyZSB0aGF0IHZhbHVlIGlzIGVpdGhlciBhIGZyYWN0aW9uIG9yIGEgbnVtYmVyJyxcbiAgICAgICAgSU5WQUxJRF9DVVJSRU5DWTogJ1BsZWFzZSBlbnRlciBhIHZhbGlkIGN1cnJlbmN5IChlLmcuLCAkNSBvciBScyA1KScsXG4gICAgICAgIElOVkFMSURfQ1VSUkVOQ1lfRk9STUFUOiAnUGxlYXNlIHdyaXRlIGN1cnJlbmN5IHVuaXRzIGF0IHRoZSBiZWdpbm5pbmcnLFxuICAgICAgICBJTlZBTElEX1VOSVRfQ0hBUlM6ICdQbGVhc2UgZW5zdXJlIHRoYXQgdW5pdCBvbmx5IGNvbnRhaW5zIG51bWJlcnMsIGFscGhhYmV0cywgKCwgKSwgKiwgXiwgJyArXG4gICAgICAgICAgICAnLywgLSdcbiAgICB9O1xuICAgIE9iamVjdHNEb21haW5Db25zdGFudHMuQ1VSUkVOQ1lfVU5JVFMgPSB7XG4gICAgICAgIGRvbGxhcjoge1xuICAgICAgICAgICAgbmFtZTogJ2RvbGxhcicsXG4gICAgICAgICAgICBhbGlhc2VzOiBbJyQnLCAnZG9sbGFycycsICdEb2xsYXJzJywgJ0RvbGxhcicsICdVU0QnXSxcbiAgICAgICAgICAgIGZyb250X3VuaXRzOiBbJyQnXSxcbiAgICAgICAgICAgIGJhc2VfdW5pdDogbnVsbFxuICAgICAgICB9LFxuICAgICAgICBydXBlZToge1xuICAgICAgICAgICAgbmFtZTogJ3J1cGVlJyxcbiAgICAgICAgICAgIGFsaWFzZXM6IFsnUnMnLCAncnVwZWVzJywgJ+KCuScsICdSdXBlZXMnLCAnUnVwZWUnXSxcbiAgICAgICAgICAgIGZyb250X3VuaXRzOiBbJ1JzICcsICfigrknXSxcbiAgICAgICAgICAgIGJhc2VfdW5pdDogbnVsbFxuICAgICAgICB9LFxuICAgICAgICBjZW50OiB7XG4gICAgICAgICAgICBuYW1lOiAnY2VudCcsXG4gICAgICAgICAgICBhbGlhc2VzOiBbJ2NlbnRzJywgJ0NlbnRzJywgJ0NlbnQnXSxcbiAgICAgICAgICAgIGZyb250X3VuaXRzOiBbXSxcbiAgICAgICAgICAgIGJhc2VfdW5pdDogJzAuMDEgZG9sbGFyJ1xuICAgICAgICB9LFxuICAgICAgICBwYWlzZToge1xuICAgICAgICAgICAgbmFtZTogJ3BhaXNlJyxcbiAgICAgICAgICAgIGFsaWFzZXM6IFsncGFpc2EnLCAnUGFpc2UnLCAnUGFpc2EnXSxcbiAgICAgICAgICAgIGZyb250X3VuaXRzOiBbXSxcbiAgICAgICAgICAgIGJhc2VfdW5pdDogJzAuMDEgcnVwZWUnXG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBPYmplY3RzRG9tYWluQ29uc3RhbnRzO1xufSgpKTtcbmV4cG9ydHMuT2JqZWN0c0RvbWFpbkNvbnN0YW50cyA9IE9iamVjdHNEb21haW5Db25zdGFudHM7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdG8gcmV0cmlldmUgcmVhZCBvbmx5IGluZm9ybWF0aW9uXG4gKiBhYm91dCB0aGUgY29uY2VwdCBjYXJkIG9mIGEgc2tpbGwgZnJvbSB0aGUgYmFja2VuZC5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3NraWxsL3NraWxsLWRvbWFpbi5jb25zdGFudHMuYWpzLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdDb25jZXB0Q2FyZEJhY2tlbmRBcGlTZXJ2aWNlJywgW1xuICAgICckaHR0cCcsICckcScsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsICdDT05DRVBUX0NBUkRfREFUQV9VUkxfVEVNUExBVEUnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJHEsIFVybEludGVycG9sYXRpb25TZXJ2aWNlLCBDT05DRVBUX0NBUkRfREFUQV9VUkxfVEVNUExBVEUpIHtcbiAgICAgICAgLy8gTWFwcyBwcmV2aW91c2x5IGxvYWRlZCBjb25jZXB0IGNhcmRzIHRvIHRoZWlyIElEcy5cbiAgICAgICAgdmFyIF9jb25jZXB0Q2FyZENhY2hlID0gW107XG4gICAgICAgIHZhciBfZmV0Y2hDb25jZXB0Q2FyZHMgPSBmdW5jdGlvbiAoc2tpbGxJZHMsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIGNvbmNlcHRDYXJkRGF0YVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKENPTkNFUFRfQ0FSRF9EQVRBX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgIGNvbW1hX3NlcGFyYXRlZF9za2lsbF9pZHM6IHNraWxsSWRzLmpvaW4oJywnKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkaHR0cC5nZXQoY29uY2VwdENhcmREYXRhVXJsKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHZhciBjb25jZXB0Q2FyZHMgPSBhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YS5jb25jZXB0X2NhcmRfZGljdHMpO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKGNvbmNlcHRDYXJkcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrKGVycm9yUmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfaXNDYWNoZWQgPSBmdW5jdGlvbiAoc2tpbGxJZCkge1xuICAgICAgICAgICAgcmV0dXJuIF9jb25jZXB0Q2FyZENhY2hlLmhhc093blByb3BlcnR5KHNraWxsSWQpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2dldFVuY2FjaGVkU2tpbGxJZHMgPSBmdW5jdGlvbiAoc2tpbGxJZHMpIHtcbiAgICAgICAgICAgIHZhciB1bmNhY2hlZFNraWxsSWRzID0gW107XG4gICAgICAgICAgICBza2lsbElkcy5mb3JFYWNoKGZ1bmN0aW9uIChza2lsbElkKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFfaXNDYWNoZWQoc2tpbGxJZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdW5jYWNoZWRTa2lsbElkcy5wdXNoKHNraWxsSWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHVuY2FjaGVkU2tpbGxJZHM7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFRoaXMgZnVuY3Rpb24gd2lsbCBmZXRjaCBjb25jZXB0IGNhcmRzIGZyb20gdGhlIGJhY2tlbmQsIGFzIHdlbGwgYXNcbiAgICAgICAgICAgICAqIGF0dGVtcHQgdG8gc2VlIHdoZXRoZXIgdGhlIGdpdmVuIGNvbmNlcHQgY2FyZHMgaGF2ZSBhbHJlYWR5IGJlZW5cbiAgICAgICAgICAgICAqIGxvYWRlZC4gSWYgdGhleSBoYXZlIG5vdCB5ZXQgYmVlbiBsb2FkZWQsIGl0IHdpbGwgZmV0Y2ggdGhlIGNvbmNlcHRcbiAgICAgICAgICAgICAqIGNhcmRzIGZyb20gdGhlIGJhY2tlbmQuIElmIGl0IHN1Y2Nlc3NmdWxseSByZXRyaWV2ZXMgdGhlIGNvbmNlcHQgY2FyZHNcbiAgICAgICAgICAgICAqIGZyb20gdGhlIGJhY2tlbmQsIGl0IHdpbGwgc3RvcmUgdGhlbSBpbiB0aGUgY2FjaGUgdG8gYXZvaWQgcmVxdWVzdHNcbiAgICAgICAgICAgICAqIGZyb20gdGhlIGJhY2tlbmQgaW4gZnVydGhlciBmdW5jdGlvbiBjYWxscy5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgbG9hZENvbmNlcHRDYXJkczogZnVuY3Rpb24gKHNraWxsSWRzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVuY2FjaGVkU2tpbGxJZHMgPSBfZ2V0VW5jYWNoZWRTa2lsbElkcyhza2lsbElkcyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb25jZXB0Q2FyZHMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVuY2FjaGVkU2tpbGxJZHMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDYXNlIHdoZXJlIG9ubHkgcGFydCAob3Igbm9uZSkgb2YgdGhlIGNvbmNlcHQgY2FyZHMgYXJlIGNhY2hlZFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbG9jYWxseS5cbiAgICAgICAgICAgICAgICAgICAgICAgIF9mZXRjaENvbmNlcHRDYXJkcyh1bmNhY2hlZFNraWxsSWRzLCBmdW5jdGlvbiAodW5jYWNoZWRDb25jZXB0Q2FyZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBza2lsbElkcy5mb3JFYWNoKGZ1bmN0aW9uIChza2lsbElkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1bmNhY2hlZFNraWxsSWRzLmluY2x1ZGVzKHNraWxsSWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25jZXB0Q2FyZHMucHVzaCh1bmNhY2hlZENvbmNlcHRDYXJkc1t1bmNhY2hlZFNraWxsSWRzLmluZGV4T2Yoc2tpbGxJZCldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNhdmUgdGhlIGZldGNoZWQgY29uY2VwdENhcmRzIHRvIGF2b2lkIGZ1dHVyZSBmZXRjaGVzLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX2NvbmNlcHRDYXJkQ2FjaGVbc2tpbGxJZF0gPSBhbmd1bGFyLmNvcHkodW5jYWNoZWRDb25jZXB0Q2FyZHNbdW5jYWNoZWRTa2lsbElkcy5pbmRleE9mKHNraWxsSWQpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25jZXB0Q2FyZHMucHVzaChhbmd1bGFyLmNvcHkoX2NvbmNlcHRDYXJkQ2FjaGVbc2tpbGxJZF0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNvbHZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYW5ndWxhci5jb3B5KGNvbmNlcHRDYXJkcykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDYXNlIHdoZXJlIGFsbCBvZiB0aGUgY29uY2VwdCBjYXJkcyBhcmUgY2FjaGVkIGxvY2FsbHkuXG4gICAgICAgICAgICAgICAgICAgICAgICBza2lsbElkcy5mb3JFYWNoKGZ1bmN0aW9uIChza2lsbElkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uY2VwdENhcmRzLnB1c2goYW5ndWxhci5jb3B5KF9jb25jZXB0Q2FyZENhY2hlW3NraWxsSWRdKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNvbHZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShjb25jZXB0Q2FyZHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE9iamVjdCBmYWN0b3J5IGZvciBjcmVhdGluZyBhIGZyb250LWVuZCBpbnN0YW5jZSBvZiBhXG4gKiBjb25jZXB0IGNhcmQuIEluIHRoZSBiYWNrZW5kLCB0aGlzIGlzIHJlZmVycmVkIHRvIGFzIFNraWxsQ29udGVudHMuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9leHBsb3JhdGlvbi9SZWNvcmRlZFZvaWNlb3ZlcnNPYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdkb21haW4vZXhwbG9yYXRpb24vU3VidGl0bGVkSHRtbE9iamVjdEZhY3RvcnkudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0NvbmNlcHRDYXJkT2JqZWN0RmFjdG9yeScsIFtcbiAgICAnUmVjb3JkZWRWb2ljZW92ZXJzT2JqZWN0RmFjdG9yeScsICdTdWJ0aXRsZWRIdG1sT2JqZWN0RmFjdG9yeScsXG4gICAgJ0NPTVBPTkVOVF9OQU1FX0VYUExBTkFUSU9OJyxcbiAgICBmdW5jdGlvbiAoUmVjb3JkZWRWb2ljZW92ZXJzT2JqZWN0RmFjdG9yeSwgU3VidGl0bGVkSHRtbE9iamVjdEZhY3RvcnksIENPTVBPTkVOVF9OQU1FX0VYUExBTkFUSU9OKSB7XG4gICAgICAgIHZhciBDb25jZXB0Q2FyZCA9IGZ1bmN0aW9uIChleHBsYW5hdGlvbiwgd29ya2VkRXhhbXBsZXMsIHJlY29yZGVkVm9pY2VvdmVycykge1xuICAgICAgICAgICAgdGhpcy5fZXhwbGFuYXRpb24gPSBleHBsYW5hdGlvbjtcbiAgICAgICAgICAgIHRoaXMuX3dvcmtlZEV4YW1wbGVzID0gd29ya2VkRXhhbXBsZXM7XG4gICAgICAgICAgICB0aGlzLl9yZWNvcmRlZFZvaWNlb3ZlcnMgPSByZWNvcmRlZFZvaWNlb3ZlcnM7XG4gICAgICAgIH07XG4gICAgICAgIENvbmNlcHRDYXJkLnByb3RvdHlwZS50b0JhY2tlbmREaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBleHBsYW5hdGlvbjogdGhpcy5fZXhwbGFuYXRpb24udG9CYWNrZW5kRGljdCgpLFxuICAgICAgICAgICAgICAgIHdvcmtlZF9leGFtcGxlczogdGhpcy5fd29ya2VkRXhhbXBsZXMubWFwKGZ1bmN0aW9uICh3b3JrZWRFeGFtcGxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB3b3JrZWRFeGFtcGxlLnRvQmFja2VuZERpY3QoKTtcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICByZWNvcmRlZF92b2ljZW92ZXJzOiB0aGlzLl9yZWNvcmRlZFZvaWNlb3ZlcnMudG9CYWNrZW5kRGljdCgpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2dlbmVyYXRlV29ya2VkRXhhbXBsZXNGcm9tQmFja2VuZERpY3QgPSBmdW5jdGlvbiAod29ya2VkRXhhbXBsZURpY3RzKSB7XG4gICAgICAgICAgICByZXR1cm4gd29ya2VkRXhhbXBsZURpY3RzLm1hcChmdW5jdGlvbiAod29ya2VkRXhhbXBsZURpY3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gU3VidGl0bGVkSHRtbE9iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUJhY2tlbmREaWN0KHdvcmtlZEV4YW1wbGVEaWN0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2dldEVsZW1lbnRzSW5GaXJzdFNldEJ1dE5vdEluU2Vjb25kID0gZnVuY3Rpb24gKHNldEEsIHNldEIpIHtcbiAgICAgICAgICAgIHZhciBkaWZmTGlzdCA9IEFycmF5LmZyb20oc2V0QSkuZmlsdGVyKGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFzZXRCLmhhcyhlbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGRpZmZMaXN0O1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2V4dHJhY3RBdmFpbGFibGVDb250ZW50SWRzRnJvbVdvcmtlZEV4YW1wbGVzID0gZnVuY3Rpb24gKHdvcmtlZEV4YW1wbGVzKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudElkcyA9IG5ldyBTZXQoKTtcbiAgICAgICAgICAgIHdvcmtlZEV4YW1wbGVzLmZvckVhY2goZnVuY3Rpb24gKHdvcmtlZEV4YW1wbGUpIHtcbiAgICAgICAgICAgICAgICBjb250ZW50SWRzLmFkZCh3b3JrZWRFeGFtcGxlLmdldENvbnRlbnRJZCgpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnRJZHM7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8oYW5raXRhMjQwNzk2KTogUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIENvbmNlcHRDYXJkWydjcmVhdGVGcm9tQmFja2VuZERpY3QnXSA9IGZ1bmN0aW9uIChjb25jZXB0Q2FyZEJhY2tlbmREaWN0KSB7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBDb25jZXB0Q2FyZChTdWJ0aXRsZWRIdG1sT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3QoY29uY2VwdENhcmRCYWNrZW5kRGljdC5leHBsYW5hdGlvbiksIF9nZW5lcmF0ZVdvcmtlZEV4YW1wbGVzRnJvbUJhY2tlbmREaWN0KGNvbmNlcHRDYXJkQmFja2VuZERpY3Qud29ya2VkX2V4YW1wbGVzKSwgUmVjb3JkZWRWb2ljZW92ZXJzT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3QoY29uY2VwdENhcmRCYWNrZW5kRGljdC5yZWNvcmRlZF92b2ljZW92ZXJzKSk7XG4gICAgICAgIH07XG4gICAgICAgIENvbmNlcHRDYXJkLnByb3RvdHlwZS5nZXRFeHBsYW5hdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9leHBsYW5hdGlvbjtcbiAgICAgICAgfTtcbiAgICAgICAgQ29uY2VwdENhcmQucHJvdG90eXBlLnNldEV4cGxhbmF0aW9uID0gZnVuY3Rpb24gKGV4cGxhbmF0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLl9leHBsYW5hdGlvbiA9IGV4cGxhbmF0aW9uO1xuICAgICAgICB9O1xuICAgICAgICBDb25jZXB0Q2FyZC5wcm90b3R5cGUuZ2V0V29ya2VkRXhhbXBsZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fd29ya2VkRXhhbXBsZXMuc2xpY2UoKTtcbiAgICAgICAgfTtcbiAgICAgICAgQ29uY2VwdENhcmQucHJvdG90eXBlLnNldFdvcmtlZEV4YW1wbGVzID0gZnVuY3Rpb24gKHdvcmtlZEV4YW1wbGVzKSB7XG4gICAgICAgICAgICB2YXIgb2xkQ29udGVudElkcyA9IF9leHRyYWN0QXZhaWxhYmxlQ29udGVudElkc0Zyb21Xb3JrZWRFeGFtcGxlcyh0aGlzLl93b3JrZWRFeGFtcGxlcyk7XG4gICAgICAgICAgICB0aGlzLl93b3JrZWRFeGFtcGxlcyA9IHdvcmtlZEV4YW1wbGVzLnNsaWNlKCk7XG4gICAgICAgICAgICB2YXIgbmV3Q29udGVudElkcyA9IF9leHRyYWN0QXZhaWxhYmxlQ29udGVudElkc0Zyb21Xb3JrZWRFeGFtcGxlcyh0aGlzLl93b3JrZWRFeGFtcGxlcyk7XG4gICAgICAgICAgICB2YXIgY29udGVudElkc1RvRGVsZXRlID0gX2dldEVsZW1lbnRzSW5GaXJzdFNldEJ1dE5vdEluU2Vjb25kKG9sZENvbnRlbnRJZHMsIG5ld0NvbnRlbnRJZHMpO1xuICAgICAgICAgICAgdmFyIGNvbnRlbnRJZHNUb0FkZCA9IF9nZXRFbGVtZW50c0luRmlyc3RTZXRCdXROb3RJblNlY29uZChuZXdDb250ZW50SWRzLCBvbGRDb250ZW50SWRzKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udGVudElkc1RvRGVsZXRlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVjb3JkZWRWb2ljZW92ZXJzLmRlbGV0ZUNvbnRlbnRJZChjb250ZW50SWRzVG9EZWxldGVbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb250ZW50SWRzVG9BZGQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZWNvcmRlZFZvaWNlb3ZlcnMuYWRkQ29udGVudElkKGNvbnRlbnRJZHNUb0FkZFtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIENvbmNlcHRDYXJkLnByb3RvdHlwZS5nZXRSZWNvcmRlZFZvaWNlb3ZlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVjb3JkZWRWb2ljZW92ZXJzO1xuICAgICAgICB9O1xuICAgICAgICAvLyBDcmVhdGUgYW4gaW50ZXJzdGl0aWFsIGNvbmNlcHQgY2FyZCB0aGF0IHdvdWxkIGJlIGRpc3BsYXllZCBpbiB0aGVcbiAgICAgICAgLy8gZWRpdG9yIHVudGlsIHRoZSBhY3R1YWwgc2tpbGwgaXMgZmV0Y2hlZCBmcm9tIHRoZSBiYWNrZW5kLlxuICAgICAgICAvLyBUT0RPKGFua2l0YTI0MDc5Nik6IFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBDb25jZXB0Q2FyZFsnY3JlYXRlSW50ZXJzdGl0aWFsQ29uY2VwdENhcmQnXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICB2YXIgcmVjb3JkZWRWb2ljZW92ZXJzRGljdCA9IHtcbiAgICAgICAgICAgICAgICB2b2ljZW92ZXJzX21hcHBpbmc6IHtcbiAgICAgICAgICAgICAgICAgICAgQ09NUE9ORU5UX05BTUVfRVhQTEFOQVRJT046IHt9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ29uY2VwdENhcmQoU3VidGl0bGVkSHRtbE9iamVjdEZhY3RvcnkuY3JlYXRlRGVmYXVsdCgnTG9hZGluZyByZXZpZXcgbWF0ZXJpYWwnLCBDT01QT05FTlRfTkFNRV9FWFBMQU5BVElPTiksIFtdLCBSZWNvcmRlZFZvaWNlb3ZlcnNPYmplY3RGYWN0b3J5LmNyZWF0ZUZyb21CYWNrZW5kRGljdChyZWNvcmRlZFZvaWNlb3ZlcnNEaWN0KSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBDb25jZXB0Q2FyZDtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uc3RhbnRzIGZvciBza2lsbCBkb21haW4uXG4gKi9cbi8vIFRPRE8oIzcwOTIpOiBEZWxldGUgdGhpcyBmaWxlIG9uY2UgbWlncmF0aW9uIGlzIGNvbXBsZXRlIGFuZCB0aGVzZSBBbmd1bGFySlNcbi8vIGVxdWl2YWxlbnRzIG9mIHRoZSBBbmd1bGFyIGNvbnN0YW50cyBhcmUgbm8gbG9uZ2VyIG5lZWRlZC5cbnZhciBza2lsbF9kb21haW5fY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiZG9tYWluL3NraWxsL3NraWxsLWRvbWFpbi5jb25zdGFudHNcIik7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnQ09OQ0VQVF9DQVJEX0RBVEFfVVJMX1RFTVBMQVRFJywgc2tpbGxfZG9tYWluX2NvbnN0YW50c18xLlNraWxsRG9tYWluQ29uc3RhbnRzLkNPTkNFUFRfQ0FSRF9EQVRBX1VSTF9URU1QTEFURSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnRURJVEFCTEVfU0tJTExfREFUQV9VUkxfVEVNUExBVEUnLCBza2lsbF9kb21haW5fY29uc3RhbnRzXzEuU2tpbGxEb21haW5Db25zdGFudHMuRURJVEFCTEVfU0tJTExfREFUQV9VUkxfVEVNUExBVEUpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1NLSUxMX0RBVEFfVVJMX1RFTVBMQVRFJywgc2tpbGxfZG9tYWluX2NvbnN0YW50c18xLlNraWxsRG9tYWluQ29uc3RhbnRzLlNLSUxMX0RBVEFfVVJMX1RFTVBMQVRFKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdTS0lMTF9FRElUT1JfUVVFU1RJT05fVVJMX1RFTVBMQVRFJywgc2tpbGxfZG9tYWluX2NvbnN0YW50c18xLlNraWxsRG9tYWluQ29uc3RhbnRzLlNLSUxMX0VESVRPUl9RVUVTVElPTl9VUkxfVEVNUExBVEUpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1NLSUxMX01BU1RFUllfREFUQV9VUkxfVEVNUExBVEUnLCBza2lsbF9kb21haW5fY29uc3RhbnRzXzEuU2tpbGxEb21haW5Db25zdGFudHMuU0tJTExfTUFTVEVSWV9EQVRBX1VSTF9URU1QTEFURSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnU0tJTExfUFJPUEVSVFlfREVTQ1JJUFRJT04nLCBza2lsbF9kb21haW5fY29uc3RhbnRzXzEuU2tpbGxEb21haW5Db25zdGFudHMuU0tJTExfUFJPUEVSVFlfREVTQ1JJUFRJT04pO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1NLSUxMX1BST1BFUlRZX0xBTkdVQUdFX0NPREUnLCBza2lsbF9kb21haW5fY29uc3RhbnRzXzEuU2tpbGxEb21haW5Db25zdGFudHMuU0tJTExfUFJPUEVSVFlfTEFOR1VBR0VfQ09ERSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnU0tJTExfQ09OVEVOVFNfUFJPUEVSVFlfRVhQTEFOQVRJT04nLCBza2lsbF9kb21haW5fY29uc3RhbnRzXzEuU2tpbGxEb21haW5Db25zdGFudHMuU0tJTExfQ09OVEVOVFNfUFJPUEVSVFlfRVhQTEFOQVRJT04pO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1NLSUxMX0NPTlRFTlRTX1BST1BFUlRZX1dPUktFRF9FWEFNUExFUycsIHNraWxsX2RvbWFpbl9jb25zdGFudHNfMS5Ta2lsbERvbWFpbkNvbnN0YW50cy5TS0lMTF9DT05URU5UU19QUk9QRVJUWV9XT1JLRURfRVhBTVBMRVMpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1NLSUxMX01JU0NPTkNFUFRJT05TX1BST1BFUlRZX05BTUUnLCBza2lsbF9kb21haW5fY29uc3RhbnRzXzEuU2tpbGxEb21haW5Db25zdGFudHMuU0tJTExfTUlTQ09OQ0VQVElPTlNfUFJPUEVSVFlfTkFNRSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnU0tJTExfTUlTQ09OQ0VQVElPTlNfUFJPUEVSVFlfTk9URVMnLCBza2lsbF9kb21haW5fY29uc3RhbnRzXzEuU2tpbGxEb21haW5Db25zdGFudHMuU0tJTExfTUlTQ09OQ0VQVElPTlNfUFJPUEVSVFlfTk9URVMpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1NLSUxMX01JU0NPTkNFUFRJT05TX1BST1BFUlRZX0ZFRURCQUNLJywgc2tpbGxfZG9tYWluX2NvbnN0YW50c18xLlNraWxsRG9tYWluQ29uc3RhbnRzLlNLSUxMX01JU0NPTkNFUFRJT05TX1BST1BFUlRZX0ZFRURCQUNLKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdDTURfVVBEQVRFX1NLSUxMX1BST1BFUlRZJywgc2tpbGxfZG9tYWluX2NvbnN0YW50c18xLlNraWxsRG9tYWluQ29uc3RhbnRzLkNNRF9VUERBVEVfU0tJTExfUFJPUEVSVFkpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NNRF9VUERBVEVfU0tJTExfQ09OVEVOVFNfUFJPUEVSVFknLCBza2lsbF9kb21haW5fY29uc3RhbnRzXzEuU2tpbGxEb21haW5Db25zdGFudHMuQ01EX1VQREFURV9TS0lMTF9DT05URU5UU19QUk9QRVJUWSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnQ01EX1VQREFURV9TS0lMTF9NSVNDT05DRVBUSU9OU19QUk9QRVJUWScsIHNraWxsX2RvbWFpbl9jb25zdGFudHNfMS5Ta2lsbERvbWFpbkNvbnN0YW50cy5DTURfVVBEQVRFX1NLSUxMX01JU0NPTkNFUFRJT05TX1BST1BFUlRZKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdDTURfQUREX1NLSUxMX01JU0NPTkNFUFRJT04nLCBza2lsbF9kb21haW5fY29uc3RhbnRzXzEuU2tpbGxEb21haW5Db25zdGFudHMuQ01EX0FERF9TS0lMTF9NSVNDT05DRVBUSU9OKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdDTURfREVMRVRFX1NLSUxMX01JU0NPTkNFUFRJT04nLCBza2lsbF9kb21haW5fY29uc3RhbnRzXzEuU2tpbGxEb21haW5Db25zdGFudHMuQ01EX0RFTEVURV9TS0lMTF9NSVNDT05DRVBUSU9OKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdDTURfVVBEQVRFX1JVQlJJQ1MnLCBza2lsbF9kb21haW5fY29uc3RhbnRzXzEuU2tpbGxEb21haW5Db25zdGFudHMuQ01EX1VQREFURV9SVUJSSUNTKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uc3RhbnRzIGZvciBza2lsbCBkb21haW4uXG4gKi9cbnZhciBTa2lsbERvbWFpbkNvbnN0YW50cyA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTa2lsbERvbWFpbkNvbnN0YW50cygpIHtcbiAgICB9XG4gICAgU2tpbGxEb21haW5Db25zdGFudHMuQ09OQ0VQVF9DQVJEX0RBVEFfVVJMX1RFTVBMQVRFID0gJy9jb25jZXB0X2NhcmRfaGFuZGxlci88Y29tbWFfc2VwYXJhdGVkX3NraWxsX2lkcz4nO1xuICAgIFNraWxsRG9tYWluQ29uc3RhbnRzLkVESVRBQkxFX1NLSUxMX0RBVEFfVVJMX1RFTVBMQVRFID0gJy9za2lsbF9lZGl0b3JfaGFuZGxlci9kYXRhLzxza2lsbF9pZD4nO1xuICAgIFNraWxsRG9tYWluQ29uc3RhbnRzLlNLSUxMX0RBVEFfVVJMX1RFTVBMQVRFID0gJy9za2lsbF9kYXRhX2hhbmRsZXIvPGNvbW1hX3NlcGFyYXRlZF9za2lsbF9pZHM+JztcbiAgICBTa2lsbERvbWFpbkNvbnN0YW50cy5TS0lMTF9FRElUT1JfUVVFU1RJT05fVVJMX1RFTVBMQVRFID0gJy9za2lsbF9lZGl0b3JfcXVlc3Rpb25faGFuZGxlci88c2tpbGxfaWQ+P2N1cnNvcj08Y3Vyc29yPic7XG4gICAgU2tpbGxEb21haW5Db25zdGFudHMuU0tJTExfTUFTVEVSWV9EQVRBX1VSTF9URU1QTEFURSA9ICcvc2tpbGxfbWFzdGVyeV9oYW5kbGVyL2RhdGEnO1xuICAgIFNraWxsRG9tYWluQ29uc3RhbnRzLlNLSUxMX1BST1BFUlRZX0RFU0NSSVBUSU9OID0gJ2Rlc2NyaXB0aW9uJztcbiAgICBTa2lsbERvbWFpbkNvbnN0YW50cy5TS0lMTF9QUk9QRVJUWV9MQU5HVUFHRV9DT0RFID0gJ2xhbmd1YWdlX2NvZGUnO1xuICAgIFNraWxsRG9tYWluQ29uc3RhbnRzLlNLSUxMX0NPTlRFTlRTX1BST1BFUlRZX0VYUExBTkFUSU9OID0gJ2V4cGxhbmF0aW9uJztcbiAgICBTa2lsbERvbWFpbkNvbnN0YW50cy5TS0lMTF9DT05URU5UU19QUk9QRVJUWV9XT1JLRURfRVhBTVBMRVMgPSAnd29ya2VkX2V4YW1wbGVzJztcbiAgICBTa2lsbERvbWFpbkNvbnN0YW50cy5TS0lMTF9NSVNDT05DRVBUSU9OU19QUk9QRVJUWV9OQU1FID0gJ25hbWUnO1xuICAgIFNraWxsRG9tYWluQ29uc3RhbnRzLlNLSUxMX01JU0NPTkNFUFRJT05TX1BST1BFUlRZX05PVEVTID0gJ25vdGVzJztcbiAgICBTa2lsbERvbWFpbkNvbnN0YW50cy5TS0lMTF9NSVNDT05DRVBUSU9OU19QUk9QRVJUWV9GRUVEQkFDSyA9ICdmZWVkYmFjayc7XG4gICAgU2tpbGxEb21haW5Db25zdGFudHMuQ01EX1VQREFURV9TS0lMTF9QUk9QRVJUWSA9ICd1cGRhdGVfc2tpbGxfcHJvcGVydHknO1xuICAgIFNraWxsRG9tYWluQ29uc3RhbnRzLkNNRF9VUERBVEVfU0tJTExfQ09OVEVOVFNfUFJPUEVSVFkgPSAndXBkYXRlX3NraWxsX2NvbnRlbnRzX3Byb3BlcnR5JztcbiAgICBTa2lsbERvbWFpbkNvbnN0YW50cy5DTURfVVBEQVRFX1NLSUxMX01JU0NPTkNFUFRJT05TX1BST1BFUlRZID0gJ3VwZGF0ZV9za2lsbF9taXNjb25jZXB0aW9uc19wcm9wZXJ0eSc7XG4gICAgU2tpbGxEb21haW5Db25zdGFudHMuQ01EX0FERF9TS0lMTF9NSVNDT05DRVBUSU9OID0gJ2FkZF9za2lsbF9taXNjb25jZXB0aW9uJztcbiAgICBTa2lsbERvbWFpbkNvbnN0YW50cy5DTURfREVMRVRFX1NLSUxMX01JU0NPTkNFUFRJT04gPSAnZGVsZXRlX3NraWxsX21pc2NvbmNlcHRpb24nO1xuICAgIFNraWxsRG9tYWluQ29uc3RhbnRzLkNNRF9VUERBVEVfUlVCUklDUyA9ICd1cGRhdGVfcnVicmljcyc7XG4gICAgcmV0dXJuIFNraWxsRG9tYWluQ29uc3RhbnRzO1xufSgpKTtcbmV4cG9ydHMuU2tpbGxEb21haW5Db25zdGFudHMgPSBTa2lsbERvbWFpbkNvbnN0YW50cztcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0byBnZXQgdG9waWMgZGF0YS5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3RvcGljX3ZpZXdlci90b3BpYy12aWV3ZXItZG9tYWluLmNvbnN0YW50cy5hanMudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1RvcGljVmlld2VyQmFja2VuZEFwaVNlcnZpY2UnLCBbXG4gICAgJyRodHRwJywgJyRxJywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgJ1RPUElDX0RBVEFfVVJMX1RFTVBMQVRFJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsICRxLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgVE9QSUNfREFUQV9VUkxfVEVNUExBVEUpIHtcbiAgICAgICAgdmFyIHRvcGljRGF0YURpY3QgPSBudWxsO1xuICAgICAgICB2YXIgX2ZldGNoVG9waWNEYXRhID0gZnVuY3Rpb24gKHRvcGljTmFtZSwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgdG9waWNEYXRhVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoVE9QSUNfREFUQV9VUkxfVEVNUExBVEUsIHtcbiAgICAgICAgICAgICAgICB0b3BpY19uYW1lOiB0b3BpY05hbWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGh0dHAuZ2V0KHRvcGljRGF0YVVybCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICB0b3BpY0RhdGFEaWN0ID0gYW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHRvcGljRGF0YURpY3QpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvclJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmV0Y2hUb3BpY0RhdGE6IGZ1bmN0aW9uICh0b3BpY05hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfZmV0Y2hUb3BpY0RhdGEodG9waWNOYW1lLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBDb25zdGFudHMgZm9yIHRoZSB0b3BpYyB2aWV3ZXIgZG9tYWluLlxuICovXG4vLyBUT0RPKCM3MDkyKTogRGVsZXRlIHRoaXMgZmlsZSBvbmNlIG1pZ3JhdGlvbiBpcyBjb21wbGV0ZSBhbmQgdGhlc2UgQW5ndWxhckpTXG4vLyBlcXVpdmFsZW50cyBvZiB0aGUgQW5ndWxhciBjb25zdGFudHMgYXJlIG5vIGxvbmdlciBuZWVkZWQuXG52YXIgdG9waWNfdmlld2VyX2RvbWFpbl9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJkb21haW4vdG9waWNfdmlld2VyL3RvcGljLXZpZXdlci1kb21haW4uY29uc3RhbnRzXCIpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1RPUElDX0RBVEFfVVJMX1RFTVBMQVRFJywgdG9waWNfdmlld2VyX2RvbWFpbl9jb25zdGFudHNfMS5Ub3BpY1ZpZXdlckRvbWFpbkNvbnN0YW50cy5UT1BJQ19EQVRBX1VSTF9URU1QTEFURSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnU1RPUllfVklFV0VSX1VSTF9URU1QTEFURScsIHRvcGljX3ZpZXdlcl9kb21haW5fY29uc3RhbnRzXzEuVG9waWNWaWV3ZXJEb21haW5Db25zdGFudHMuU1RPUllfVklFV0VSX1VSTF9URU1QTEFURSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnU1VCVE9QSUNfVklFV0VSX1VSTF9URU1QTEFURScsIHRvcGljX3ZpZXdlcl9kb21haW5fY29uc3RhbnRzXzEuVG9waWNWaWV3ZXJEb21haW5Db25zdGFudHMuU1VCVE9QSUNfVklFV0VSX1VSTF9URU1QTEFURSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnN0YW50cyBmb3IgdGhlIHRvcGljIHZpZXdlciBkb21haW4uXG4gKi9cbnZhciBUb3BpY1ZpZXdlckRvbWFpbkNvbnN0YW50cyA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBUb3BpY1ZpZXdlckRvbWFpbkNvbnN0YW50cygpIHtcbiAgICB9XG4gICAgVG9waWNWaWV3ZXJEb21haW5Db25zdGFudHMuVE9QSUNfREFUQV9VUkxfVEVNUExBVEUgPSAnL3RvcGljX2RhdGFfaGFuZGxlci88dG9waWNfbmFtZT4nO1xuICAgIFRvcGljVmlld2VyRG9tYWluQ29uc3RhbnRzLlNUT1JZX1ZJRVdFUl9VUkxfVEVNUExBVEUgPSAnL3N0b3J5LzxzdG9yeV9pZD4nO1xuICAgIFRvcGljVmlld2VyRG9tYWluQ29uc3RhbnRzLlNVQlRPUElDX1ZJRVdFUl9VUkxfVEVNUExBVEUgPSAnL3N1YnRvcGljLzx0b3BpY19uYW1lPi88c3VidG9waWNfaWQ+JztcbiAgICByZXR1cm4gVG9waWNWaWV3ZXJEb21haW5Db25zdGFudHM7XG59KCkpO1xuZXhwb3J0cy5Ub3BpY1ZpZXdlckRvbWFpbkNvbnN0YW50cyA9IFRvcGljVmlld2VyRG9tYWluQ29uc3RhbnRzO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGb3JtYXRSdGVQcmV2aWV3IGZpbHRlciBmb3IgT3BwaWEuXG4gKi9cbi8qIFRoZSBmb2xsb3dpbmcgZmlsdGVyIHJlcGxhY2VzIGVhY2ggUlRFIGVsZW1lbnQgb2NjdXJyZW5jZSBpbiB0aGUgaW5wdXQgaHRtbFxuICAgYnkgaXRzIGNvcnJlc3BvbmRpbmcgbmFtZSBpbiBzcXVhcmUgYnJhY2tldHMgYW5kIHJldHVybnMgYSBzdHJpbmdcbiAgIHdoaWNoIGNvbnRhaW5zIHRoZSBuYW1lIGluIHRoZSBzYW1lIGxvY2F0aW9uIGFzIGluIHRoZSBpbnB1dCBodG1sLlxuICAgZWc6IDxwPlNhbXBsZTEgPG9wcGlhLW5vbmludGVyYWN0aXZlLW1hdGg+PC9vcHBpYS1ub25pbnRlcmFjdGl2ZS1tYXRoPlxuICAgICAgICBTYW1wbGUyIDwvcD5cbiAgIHdpbGwgZ2l2ZSBhcyBvdXRwdXQ6IFNhbXBsZTEgW01hdGhdIFNhbXBsZTIgKi9cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZpbHRlcignZm9ybWF0UnRlUHJldmlldycsIFtcbiAgICAnJGZpbHRlcicsIGZ1bmN0aW9uICgkZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoaHRtbCkge1xuICAgICAgICAgICAgaHRtbCA9IGh0bWwucmVwbGFjZSgvJm5ic3A7L2lnLCAnICcpO1xuICAgICAgICAgICAgaHRtbCA9IGh0bWwucmVwbGFjZSgvJnF1b3Q7L2lnLCAnJyk7XG4gICAgICAgICAgICAvLyBSZXBsYWNlIGFsbCBodG1sIHRhZ3Mgb3RoZXIgdGhhbiA8b3BwaWEtbm9uaW50ZXJhY3RpdmUtKio+IG9uZXMgdG8gJycuXG4gICAgICAgICAgICBodG1sID0gaHRtbC5yZXBsYWNlKC88KD8hb3BwaWEtbm9uaW50ZXJhY3RpdmVcXHMqPylbXj5dKz4vZywgJycpO1xuICAgICAgICAgICAgdmFyIGZvcm1hdHRlZE91dHB1dCA9IGh0bWwucmVwbGFjZSgvKDwoW14+XSspPikvZywgZnVuY3Rpb24gKHJ0ZVRhZykge1xuICAgICAgICAgICAgICAgIHZhciByZXBsYWNlU3RyaW5nID0gJGZpbHRlcignY2FwaXRhbGl6ZScpKHJ0ZVRhZy5zcGxpdCgnLScpWzJdLnNwbGl0KCcgJylbMF0pO1xuICAgICAgICAgICAgICAgIGlmIChyZXBsYWNlU3RyaW5nW3JlcGxhY2VTdHJpbmcubGVuZ3RoIC0gMV0gPT09ICc+Jykge1xuICAgICAgICAgICAgICAgICAgICByZXBsYWNlU3RyaW5nID0gcmVwbGFjZVN0cmluZy5zbGljZSgwLCAtMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAnIFsnICsgcmVwbGFjZVN0cmluZyArICddICc7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXR0ZWRPdXRwdXQudHJpbSgpO1xuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBmb290ZXIuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnb3BwaWFGb290ZXInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9vcHBpYV9mb290ZXJfZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7IH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uc3RhbnRzIGZvciB0aGUgcHJhY3RpY2Ugc2Vzc2lvbi5cbiAqL1xuLy8gVE9ETygjNzA5Mik6IERlbGV0ZSB0aGlzIGZpbGUgb25jZSBtaWdyYXRpb24gaXMgY29tcGxldGUgYW5kIHRoZXNlIEFuZ3VsYXJKU1xuLy8gZXF1aXZhbGVudHMgb2YgdGhlIEFuZ3VsYXIgY29uc3RhbnRzIGFyZSBubyBsb25nZXIgbmVlZGVkLlxudmFyIHByYWN0aWNlX3Nlc3Npb25fcGFnZV9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJwYWdlcy9wcmFjdGljZS1zZXNzaW9uLXBhZ2UvcHJhY3RpY2Utc2Vzc2lvbi1wYWdlLmNvbnN0YW50c1wiKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdUT1RBTF9RVUVTVElPTlMnLCBwcmFjdGljZV9zZXNzaW9uX3BhZ2VfY29uc3RhbnRzXzEuUHJhY3RpY2VTZXNzaW9uUGFnZUNvbnN0YW50cy5UT1RBTF9RVUVTVElPTlMpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1BSQUNUSUNFX1NFU1NJT05TX0RBVEFfVVJMJywgcHJhY3RpY2Vfc2Vzc2lvbl9wYWdlX2NvbnN0YW50c18xLlByYWN0aWNlU2Vzc2lvblBhZ2VDb25zdGFudHMuUFJBQ1RJQ0VfU0VTU0lPTlNfREFUQV9VUkwpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1RPUElDX1ZJRVdFUl9QQUdFJywgcHJhY3RpY2Vfc2Vzc2lvbl9wYWdlX2NvbnN0YW50c18xLlByYWN0aWNlU2Vzc2lvblBhZ2VDb25zdGFudHMuVE9QSUNfVklFV0VSX1BBR0UpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1BSQUNUSUNFX1NFU1NJT05TX1VSTCcsIHByYWN0aWNlX3Nlc3Npb25fcGFnZV9jb25zdGFudHNfMS5QcmFjdGljZVNlc3Npb25QYWdlQ29uc3RhbnRzLlBSQUNUSUNFX1NFU1NJT05TX1VSTCk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnN0YW50cyBmb3IgdGhlIHByYWN0aWNlIHNlc3Npb24uXG4gKi9cbnZhciBQcmFjdGljZVNlc3Npb25QYWdlQ29uc3RhbnRzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFByYWN0aWNlU2Vzc2lvblBhZ2VDb25zdGFudHMoKSB7XG4gICAgfVxuICAgIFByYWN0aWNlU2Vzc2lvblBhZ2VDb25zdGFudHMuVE9UQUxfUVVFU1RJT05TID0gMjA7XG4gICAgUHJhY3RpY2VTZXNzaW9uUGFnZUNvbnN0YW50cy5QUkFDVElDRV9TRVNTSU9OU19EQVRBX1VSTCA9ICcvcHJhY3RpY2Vfc2Vzc2lvbi9kYXRhLzx0b3BpY19uYW1lPic7XG4gICAgUHJhY3RpY2VTZXNzaW9uUGFnZUNvbnN0YW50cy5UT1BJQ19WSUVXRVJfUEFHRSA9ICcvdG9waWMvPHRvcGljX25hbWU+JztcbiAgICBQcmFjdGljZVNlc3Npb25QYWdlQ29uc3RhbnRzLlBSQUNUSUNFX1NFU1NJT05TX1VSTCA9ICcvcHJhY3RpY2Vfc2Vzc2lvbi88dG9waWNfbmFtZT4nO1xuICAgIHJldHVybiBQcmFjdGljZVNlc3Npb25QYWdlQ29uc3RhbnRzO1xufSgpKTtcbmV4cG9ydHMuUHJhY3RpY2VTZXNzaW9uUGFnZUNvbnN0YW50cyA9IFByYWN0aWNlU2Vzc2lvblBhZ2VDb25zdGFudHM7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIG5hdmJhciBicmVhZGNydW1iIG9mIHRoZSB0b3BpYyB2aWV3ZXIuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvVXJsU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCd0b3BpY1ZpZXdlck5hdmJhckJyZWFkY3J1bWInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvdG9waWMtdmlld2VyLXBhZ2UvbmF2YmFyLWJyZWFkY3J1bWIvJyArXG4gICAgICAgICAgICAgICAgJ3RvcGljLXZpZXdlci1uYXZiYXItYnJlYWRjcnVtYi5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLCAnVG9waWNWaWV3ZXJCYWNrZW5kQXBpU2VydmljZScsICdVcmxTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCBUb3BpY1ZpZXdlckJhY2tlbmRBcGlTZXJ2aWNlLCBVcmxTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIFRvcGljVmlld2VyQmFja2VuZEFwaVNlcnZpY2UuZmV0Y2hUb3BpY0RhdGEoVXJsU2VydmljZS5nZXRUb3BpY05hbWVGcm9tTGVhcm5lclVybCgpKS50aGVuKGZ1bmN0aW9uICh0b3BpY0RhdGFEaWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUudG9waWNOYW1lID0gdG9waWNEYXRhRGljdC50b3BpY19uYW1lO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIHN0b3JpZXMgbGlzdC5cbiAqL1xucmVxdWlyZSgnY29tcG9uZW50cy9zdW1tYXJ5LXRpbGUvc3Rvcnktc3VtbWFyeS10aWxlLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvcHJhY3RpY2Utc2Vzc2lvbi1wYWdlL3ByYWN0aWNlLXNlc3Npb24tcGFnZS5jb25zdGFudHMuYWpzLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1dpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3ByYWN0aWNlVGFiJywgW1xuICAgICckd2luZG93JywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICAnUFJBQ1RJQ0VfU0VTU0lPTlNfVVJMJyxcbiAgICBmdW5jdGlvbiAoJHdpbmRvdywgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIFBSQUNUSUNFX1NFU1NJT05TX1VSTCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHtcbiAgICAgICAgICAgICAgICBnZXRUb3BpY05hbWU6ICcmdG9waWNOYW1lJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy90b3BpYy12aWV3ZXItcGFnZS9wcmFjdGljZS10YWIvcHJhY3RpY2UtdGFiLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRzY29wZScsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwubmV3UHJhY3RpY2VTZXNzaW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByYWN0aWNlU2Vzc2lvbnNVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChQUkFDVElDRV9TRVNTSU9OU19VUkwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3BpY19uYW1lOiBjdHJsLmdldFRvcGljTmFtZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICR3aW5kb3cubG9jYXRpb24uaHJlZiA9IHByYWN0aWNlU2Vzc2lvbnNVcmw7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBzdG9yaWVzIGxpc3QuXG4gKi9cbnJlcXVpcmUoJ2NvbXBvbmVudHMvc3VtbWFyeS10aWxlL3N0b3J5LXN1bW1hcnktdGlsZS5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvV2luZG93RGltZW5zaW9uc1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnc3Rvcmllc0xpc3QnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBnZXRDYW5vbmljYWxTdG9yaWVzOiAnJmNhbm9uaWNhbFN0b3JpZXNMaXN0JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy90b3BpYy12aWV3ZXItcGFnZS9zdG9yaWVzLWxpc3Qvc3Rvcmllcy1saXN0LmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJ1dpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlJywgJyRzY29wZScsICckdGltZW91dCcsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKFdpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLCAkc2NvcGUsICR0aW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBTVE9SWV9USUxFX1dJRFRIX1BYID0gMzYwO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUubGVmdG1vc3RDYXJkSW5kaWNlcyA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBNQVhfTlVNX1RJTEVTX1BFUl9ST1cgPSA0O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudGlsZURpc3BsYXlDb3VudCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbml0Q2Fyb3VzZWxzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNhbm9uaWNhbFN0b3JpZXMgPSAkc2NvcGUuZ2V0Q2Fub25pY2FsU3RvcmllcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkc2NvcGUuY2Fub25pY2FsU3Rvcmllcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB3aW5kb3dXaWR0aCA9ICQod2luZG93KS53aWR0aCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnRpbGVEaXNwbGF5Q291bnQgPSBNYXRoLm1pbihNYXRoLmZsb29yKHdpbmRvd1dpZHRoIC8gKFNUT1JZX1RJTEVfV0lEVEhfUFggKyAyMCkpLCBNQVhfTlVNX1RJTEVTX1BFUl9ST1cpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJCgnLm9wcGlhLXRvcGljLXZpZXdlci1jYXJvdXNlbCcpLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICgkc2NvcGUudGlsZURpc3BsYXlDb3VudCAqIFNUT1JZX1RJTEVfV0lEVEhfUFgpICsgJ3B4J1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2Fyb3VzZWxKUXVlcnlTZWxlY3RvciA9ICgnLm9wcGlhLXRvcGljLXZpZXdlci1jYXJvdXNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNhcm91c2VsU2Nyb2xsUG9zaXRpb25QeCA9ICQoY2Fyb3VzZWxKUXVlcnlTZWxlY3Rvcikuc2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gTWF0aC5jZWlsKGNhcm91c2VsU2Nyb2xsUG9zaXRpb25QeCAvIFNUT1JZX1RJTEVfV0lEVEhfUFgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxlZnRtb3N0Q2FyZEluZGljZXMgPSBpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlzQW55Q2Fyb3VzZWxDdXJyZW50bHlTY3JvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNjcm9sbCA9IGZ1bmN0aW9uIChpc0xlZnRTY3JvbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0FueUNhcm91c2VsQ3VycmVudGx5U2Nyb2xsaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNhcm91c2VsSlF1ZXJ5U2VsZWN0b3IgPSAoJy5vcHBpYS10b3BpYy12aWV3ZXItY2Fyb3VzZWwnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkaXJlY3Rpb24gPSBpc0xlZnRTY3JvbGwgPyAtMSA6IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2Fyb3VzZWxTY3JvbGxQb3NpdGlvblB4ID0gJChjYXJvdXNlbEpRdWVyeVNlbGVjdG9yKS5zY3JvbGxMZWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBQcmV2ZW50IHNjcm9sbGluZyBpZiB0aGVyZSBtb3JlIGNhcm91c2VsIHBpeGVkIHdpZHRocyB0aGFuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGVyZSBhcmUgdGlsZSB3aWR0aHMuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmNhbm9uaWNhbFN0b3JpZXMubGVuZ3RoIDw9ICRzY29wZS50aWxlRGlzcGxheUNvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2Fyb3VzZWxTY3JvbGxQb3NpdGlvblB4ID0gTWF0aC5tYXgoMCwgY2Fyb3VzZWxTY3JvbGxQb3NpdGlvblB4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0xlZnRTY3JvbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubGVmdG1vc3RDYXJkSW5kaWNlcyA9IE1hdGgubWF4KDAsICRzY29wZS5sZWZ0bW9zdENhcmRJbmRpY2VzIC0gJHNjb3BlLnRpbGVEaXNwbGF5Q291bnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxlZnRtb3N0Q2FyZEluZGljZXMgPSBNYXRoLm1pbigkc2NvcGUuY2Fub25pY2FsU3Rvcmllcy5sZW5ndGggLSAkc2NvcGUudGlsZURpc3BsYXlDb3VudCArIDEsICRzY29wZS5sZWZ0bW9zdENhcmRJbmRpY2VzICsgJHNjb3BlLnRpbGVEaXNwbGF5Q291bnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5ld1Njcm9sbFBvc2l0aW9uUHggPSBjYXJvdXNlbFNjcm9sbFBvc2l0aW9uUHggK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICgkc2NvcGUudGlsZURpc3BsYXlDb3VudCAqIFNUT1JZX1RJTEVfV0lEVEhfUFggKiBkaXJlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgJChjYXJvdXNlbEpRdWVyeVNlbGVjdG9yKS5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxMZWZ0OiBuZXdTY3JvbGxQb3NpdGlvblB4XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246IDgwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNBbnlDYXJvdXNlbEN1cnJlbnRseVNjcm9sbGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0FueUNhcm91c2VsQ3VycmVudGx5U2Nyb2xsaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHZhciB0b3BpY1ZpZXdlcldpbmRvd0N1dG9mZlB4ID0gODk1O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudG9waWNWaWV3ZXJXaW5kb3dJc05hcnJvdyA9IChXaW5kb3dEaW1lbnNpb25zU2VydmljZS5nZXRXaWR0aCgpIDw9IHRvcGljVmlld2VyV2luZG93Q3V0b2ZmUHgpO1xuICAgICAgICAgICAgICAgICAgICBXaW5kb3dEaW1lbnNpb25zU2VydmljZS5yZWdpc3Rlck9uUmVzaXplSG9vayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUudG9waWNWaWV3ZXJXaW5kb3dJc05hcnJvdyA9IChXaW5kb3dEaW1lbnNpb25zU2VydmljZS5nZXRXaWR0aCgpIDw9IHRvcGljVmlld2VyV2luZG93Q3V0b2ZmUHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmluY3JlbWVudExlZnRtb3N0Q2FyZEluZGV4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxlZnRtb3N0Q2FyZEluZGljZXMrKztcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRlY3JlbWVudExlZnRtb3N0Q2FyZEluZGV4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxlZnRtb3N0Q2FyZEluZGljZXMtLTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5pdENhcm91c2VscygpO1xuICAgICAgICAgICAgICAgICAgICB9LCAzOTApO1xuICAgICAgICAgICAgICAgICAgICAkKHdpbmRvdykucmVzaXplKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluaXRDYXJvdXNlbHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBzdWJ0b3BpY3MgbGlzdC5cbiAqL1xucmVxdWlyZSgnY29tcG9uZW50cy9zdW1tYXJ5LXRpbGUvc3VidG9waWMtc3VtbWFyeS10aWxlLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvY29udGV4dHVhbC9XaW5kb3dEaW1lbnNpb25zU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdzdWJ0b3BpY3NMaXN0JywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgZ2V0U3VidG9waWNzOiAnJnN1YnRvcGljc0xpc3QnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL3RvcGljLXZpZXdlci1wYWdlL3N1YnRvcGljcy1saXN0LycgK1xuICAgICAgICAgICAgICAgICdzdWJ0b3BpY3MtbGlzdC5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICdXaW5kb3dEaW1lbnNpb25zU2VydmljZScsICckc2NvcGUnLCAnJHRpbWVvdXQnLCAnVXJsU2VydmljZScsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKFdpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLCAkc2NvcGUsICR0aW1lb3V0LCBVcmxTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBTVUJUT1BJQ19USUxFX1dJRFRIX1BYID0gMzEwO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUubGVmdG1vc3RDYXJkSW5kaWNlcyA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBNQVhfTlVNX1RJTEVTX1BFUl9ST1cgPSA0O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudGlsZURpc3BsYXlDb3VudCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS50b3BpY05hbWUgPSBVcmxTZXJ2aWNlLmdldFRvcGljTmFtZUZyb21MZWFybmVyVXJsKCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbml0Q2Fyb3VzZWxzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN1YnRvcGljcyA9ICRzY29wZS5nZXRTdWJ0b3BpY3MoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghJHNjb3BlLnN1YnRvcGljcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB3aW5kb3dXaWR0aCA9ICQod2luZG93KS53aWR0aCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnRpbGVEaXNwbGF5Q291bnQgPSBNYXRoLm1pbihNYXRoLmZsb29yKHdpbmRvd1dpZHRoIC8gKFNVQlRPUElDX1RJTEVfV0lEVEhfUFggKyAyMCkpLCBNQVhfTlVNX1RJTEVTX1BFUl9ST1cpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJCgnLm9wcGlhLXRvcGljLXZpZXdlci1jYXJvdXNlbCcpLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICgkc2NvcGUudGlsZURpc3BsYXlDb3VudCAqIFNVQlRPUElDX1RJTEVfV0lEVEhfUFgpICsgJ3B4J1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2Fyb3VzZWxKUXVlcnlTZWxlY3RvciA9ICgnLm9wcGlhLXRvcGljLXZpZXdlci1jYXJvdXNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNhcm91c2VsU2Nyb2xsUG9zaXRpb25QeCA9ICQoY2Fyb3VzZWxKUXVlcnlTZWxlY3Rvcikuc2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gTWF0aC5jZWlsKGNhcm91c2VsU2Nyb2xsUG9zaXRpb25QeCAvIFNVQlRPUElDX1RJTEVfV0lEVEhfUFgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxlZnRtb3N0Q2FyZEluZGljZXMgPSBpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlzQW55Q2Fyb3VzZWxDdXJyZW50bHlTY3JvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNjcm9sbCA9IGZ1bmN0aW9uIChpc0xlZnRTY3JvbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0FueUNhcm91c2VsQ3VycmVudGx5U2Nyb2xsaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNhcm91c2VsSlF1ZXJ5U2VsZWN0b3IgPSAoJy5vcHBpYS10b3BpYy12aWV3ZXItY2Fyb3VzZWwnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkaXJlY3Rpb24gPSBpc0xlZnRTY3JvbGwgPyAtMSA6IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2Fyb3VzZWxTY3JvbGxQb3NpdGlvblB4ID0gJChjYXJvdXNlbEpRdWVyeVNlbGVjdG9yKS5zY3JvbGxMZWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBQcmV2ZW50IHNjcm9sbGluZyBpZiB0aGVyZSBtb3JlIGNhcm91c2VsIHBpeGVkIHdpZHRocyB0aGFuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGVyZSBhcmUgdGlsZSB3aWR0aHMuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLnN1YnRvcGljcy5sZW5ndGggPD0gJHNjb3BlLnRpbGVEaXNwbGF5Q291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJvdXNlbFNjcm9sbFBvc2l0aW9uUHggPSBNYXRoLm1heCgwLCBjYXJvdXNlbFNjcm9sbFBvc2l0aW9uUHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzTGVmdFNjcm9sbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5sZWZ0bW9zdENhcmRJbmRpY2VzID0gTWF0aC5tYXgoMCwgJHNjb3BlLmxlZnRtb3N0Q2FyZEluZGljZXMgLSAkc2NvcGUudGlsZURpc3BsYXlDb3VudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubGVmdG1vc3RDYXJkSW5kaWNlcyA9IE1hdGgubWluKCRzY29wZS5zdWJ0b3BpY3MubGVuZ3RoIC0gJHNjb3BlLnRpbGVEaXNwbGF5Q291bnQgKyAxLCAkc2NvcGUubGVmdG1vc3RDYXJkSW5kaWNlcyArICRzY29wZS50aWxlRGlzcGxheUNvdW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdTY3JvbGxQb3NpdGlvblB4ID0gY2Fyb3VzZWxTY3JvbGxQb3NpdGlvblB4ICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoJHNjb3BlLnRpbGVEaXNwbGF5Q291bnQgKiBTVUJUT1BJQ19USUxFX1dJRFRIX1BYICogZGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoY2Fyb3VzZWxKUXVlcnlTZWxlY3RvcikuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsTGVmdDogbmV3U2Nyb2xsUG9zaXRpb25QeFxuICAgICAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uOiA4MDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVldWU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQW55Q2Fyb3VzZWxDdXJyZW50bHlTY3JvbGxpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNBbnlDYXJvdXNlbEN1cnJlbnRseVNjcm9sbGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB2YXIgdG9waWNWaWV3ZXJXaW5kb3dDdXRvZmZQeCA9IDg5NTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnRvcGljVmlld2VyV2luZG93SXNOYXJyb3cgPSAoV2luZG93RGltZW5zaW9uc1NlcnZpY2UuZ2V0V2lkdGgoKSA8PSB0b3BpY1ZpZXdlcldpbmRvd0N1dG9mZlB4KTtcbiAgICAgICAgICAgICAgICAgICAgV2luZG93RGltZW5zaW9uc1NlcnZpY2UucmVnaXN0ZXJPblJlc2l6ZUhvb2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnRvcGljVmlld2VyV2luZG93SXNOYXJyb3cgPSAoV2luZG93RGltZW5zaW9uc1NlcnZpY2UuZ2V0V2lkdGgoKSA8PSB0b3BpY1ZpZXdlcldpbmRvd0N1dG9mZlB4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pbmNyZW1lbnRMZWZ0bW9zdENhcmRJbmRleCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5sZWZ0bW9zdENhcmRJbmRpY2VzKys7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5kZWNyZW1lbnRMZWZ0bW9zdENhcmRJbmRleCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5sZWZ0bW9zdENhcmRJbmRpY2VzLS07XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluaXRDYXJvdXNlbHMoKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMzkwKTtcbiAgICAgICAgICAgICAgICAgICAgJCh3aW5kb3cpLnJlc2l6ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbml0Q2Fyb3VzZWxzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgdG9waWMgdmlld2VyLlxuICovXG5yZXF1aXJlKCdiYXNlX2NvbXBvbmVudHMvQmFzZUNvbnRlbnREaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2NvbW1vbi1lbGVtZW50cy8nICtcbiAgICAnYmFja2dyb3VuZC1iYW5uZXIuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL3NraWxscy1tYXN0ZXJ5LWxpc3Qvc2tpbGxzLW1hc3RlcnktbGlzdC5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3RvcGljLXZpZXdlci1wYWdlL3N0b3JpZXMtbGlzdC9zdG9yaWVzLWxpc3QuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy90b3BpYy12aWV3ZXItcGFnZS9zdWJ0b3BpY3MtbGlzdC9zdWJ0b3BpY3MtbGlzdC5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3RvcGljLXZpZXdlci1wYWdlL3ByYWN0aWNlLXRhYi9wcmFjdGljZS10YWIuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy90b3BpYy12aWV3ZXItcGFnZS9zdG9yaWVzLWxpc3Qvc3Rvcmllcy1saXN0LmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3RvcGljX3ZpZXdlci9Ub3BpY1ZpZXdlckJhY2tlbmRBcGlTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9QYWdlVGl0bGVTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvV2luZG93RGltZW5zaW9uc1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgndG9waWNWaWV3ZXJQYWdlJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvdG9waWMtdmlld2VyLXBhZ2UvdG9waWMtdmlld2VyLXBhZ2UuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHJvb3RTY29wZScsICckd2luZG93JywgJ0FsZXJ0c1NlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdQYWdlVGl0bGVTZXJ2aWNlJywgJ1RvcGljVmlld2VyQmFja2VuZEFwaVNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdVcmxTZXJ2aWNlJywgJ1dpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlJywgJ0ZBVEFMX0VSUk9SX0NPREVTJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHdpbmRvdywgQWxlcnRzU2VydmljZSwgUGFnZVRpdGxlU2VydmljZSwgVG9waWNWaWV3ZXJCYWNrZW5kQXBpU2VydmljZSwgVXJsU2VydmljZSwgV2luZG93RGltZW5zaW9uc1NlcnZpY2UsIEZBVEFMX0VSUk9SX0NPREVTKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRBY3RpdmVUYWIgPSBmdW5jdGlvbiAobmV3QWN0aXZlVGFiTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5hY3RpdmVUYWIgPSBuZXdBY3RpdmVUYWJOYW1lO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNldEFjdGl2ZVRhYignc3RvcnknKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5jaGVja01vYmlsZVZpZXcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFdpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLmdldFdpZHRoKCkgPCA1MDApO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnRvcGljTmFtZSA9IFVybFNlcnZpY2UuZ2V0VG9waWNOYW1lRnJvbUxlYXJuZXJVcmwoKTtcbiAgICAgICAgICAgICAgICAgICAgUGFnZVRpdGxlU2VydmljZS5zZXRQYWdlVGl0bGUoY3RybC50b3BpY05hbWUgKyAnIC0gT3BwaWEnKTtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICdMb2FkaW5nJztcbiAgICAgICAgICAgICAgICAgICAgVG9waWNWaWV3ZXJCYWNrZW5kQXBpU2VydmljZS5mZXRjaFRvcGljRGF0YShjdHJsLnRvcGljTmFtZSkudGhlbihmdW5jdGlvbiAodG9waWNEYXRhRGljdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC50b3BpY0lkID0gdG9waWNEYXRhRGljdC50b3BpY19pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuY2Fub25pY2FsU3Rvcmllc0xpc3QgPSB0b3BpY0RhdGFEaWN0LmNhbm9uaWNhbF9zdG9yeV9kaWN0cztcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuZGVncmVlc09mTWFzdGVyeSA9IHRvcGljRGF0YURpY3QuZGVncmVlc19vZl9tYXN0ZXJ5O1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5za2lsbERlc2NyaXB0aW9ucyA9IHRvcGljRGF0YURpY3Quc2tpbGxfZGVzY3JpcHRpb25zO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5zdWJ0b3BpY3MgPSB0b3BpY0RhdGFEaWN0LnN1YnRvcGljcztcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ01lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudG9waWNJZCA9IHRvcGljRGF0YURpY3QuaWQ7XG4gICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoRkFUQUxfRVJST1JfQ09ERVMuaW5kZXhPZihlcnJvclJlc3BvbnNlLnN0YXR1cykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKCdGYWlsZWQgdG8gZ2V0IGRhc2hib2FyZCBkYXRhJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgc3Rvcnkgdmlld2VyIHBhZ2UuXG4gKi9cbnJlcXVpcmUoXCJjb3JlLWpzL2VzNy9yZWZsZWN0XCIpO1xucmVxdWlyZShcInpvbmUuanNcIik7XG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgcGxhdGZvcm1fYnJvd3Nlcl8xID0gcmVxdWlyZShcIkBhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXJcIik7XG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgaHR0cF8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvbW1vbi9odHRwXCIpO1xuLy8gVGhpcyBjb21wb25lbnQgaXMgbmVlZGVkIHRvIGZvcmNlLWJvb3RzdHJhcCBBbmd1bGFyIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlXG4vLyBhcHAuXG52YXIgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50KCkge1xuICAgIH1cbiAgICBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50ID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5Db21wb25lbnQoe1xuICAgICAgICAgICAgc2VsZWN0b3I6ICdzZXJ2aWNlLWJvb3RzdHJhcCcsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogJydcbiAgICAgICAgfSlcbiAgICBdLCBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50KTtcbiAgICByZXR1cm4gU2VydmljZUJvb3RzdHJhcENvbXBvbmVudDtcbn0oKSk7XG5leHBvcnRzLlNlcnZpY2VCb290c3RyYXBDb21wb25lbnQgPSBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50O1xudmFyIGFwcF9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJhcHAuY29uc3RhbnRzXCIpO1xudmFyIGludGVyYWN0aW9uc19leHRlbnNpb25fY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiaW50ZXJhY3Rpb25zL2ludGVyYWN0aW9ucy1leHRlbnNpb24uY29uc3RhbnRzXCIpO1xudmFyIG9iamVjdHNfZG9tYWluX2NvbnN0YW50c18xID0gcmVxdWlyZShcImRvbWFpbi9vYmplY3RzL29iamVjdHMtZG9tYWluLmNvbnN0YW50c1wiKTtcbnZhciB0b3BpY192aWV3ZXJfZG9tYWluX2NvbnN0YW50c18xID0gcmVxdWlyZShcImRvbWFpbi90b3BpY192aWV3ZXIvdG9waWMtdmlld2VyLWRvbWFpbi5jb25zdGFudHNcIik7XG52YXIgVG9waWNWaWV3ZXJQYWdlTW9kdWxlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFRvcGljVmlld2VyUGFnZU1vZHVsZSgpIHtcbiAgICB9XG4gICAgLy8gRW1wdHkgcGxhY2Vob2xkZXIgbWV0aG9kIHRvIHNhdGlzZnkgdGhlIGBDb21waWxlcmAuXG4gICAgVG9waWNWaWV3ZXJQYWdlTW9kdWxlLnByb3RvdHlwZS5uZ0RvQm9vdHN0cmFwID0gZnVuY3Rpb24gKCkgeyB9O1xuICAgIFRvcGljVmlld2VyUGFnZU1vZHVsZSA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuTmdNb2R1bGUoe1xuICAgICAgICAgICAgaW1wb3J0czogW1xuICAgICAgICAgICAgICAgIHBsYXRmb3JtX2Jyb3dzZXJfMS5Ccm93c2VyTW9kdWxlLFxuICAgICAgICAgICAgICAgIGh0dHBfMS5IdHRwQ2xpZW50TW9kdWxlXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgZGVjbGFyYXRpb25zOiBbXG4gICAgICAgICAgICAgICAgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGVudHJ5Q29tcG9uZW50czogW1xuICAgICAgICAgICAgICAgIFNlcnZpY2VCb290c3RyYXBDb21wb25lbnRcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBwcm92aWRlcnM6IFtcbiAgICAgICAgICAgICAgICBhcHBfY29uc3RhbnRzXzEuQXBwQ29uc3RhbnRzLFxuICAgICAgICAgICAgICAgIGludGVyYWN0aW9uc19leHRlbnNpb25fY29uc3RhbnRzXzEuSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cyxcbiAgICAgICAgICAgICAgICBvYmplY3RzX2RvbWFpbl9jb25zdGFudHNfMS5PYmplY3RzRG9tYWluQ29uc3RhbnRzLFxuICAgICAgICAgICAgICAgIHRvcGljX3ZpZXdlcl9kb21haW5fY29uc3RhbnRzXzEuVG9waWNWaWV3ZXJEb21haW5Db25zdGFudHMsXG4gICAgICAgICAgICBdXG4gICAgICAgIH0pXG4gICAgXSwgVG9waWNWaWV3ZXJQYWdlTW9kdWxlKTtcbiAgICByZXR1cm4gVG9waWNWaWV3ZXJQYWdlTW9kdWxlO1xufSgpKTtcbnZhciBwbGF0Zm9ybV9icm93c2VyX2R5bmFtaWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyLWR5bmFtaWNcIik7XG52YXIgc3RhdGljXzIgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgYm9vdHN0cmFwRm4gPSBmdW5jdGlvbiAoZXh0cmFQcm92aWRlcnMpIHtcbiAgICB2YXIgcGxhdGZvcm1SZWYgPSBwbGF0Zm9ybV9icm93c2VyX2R5bmFtaWNfMS5wbGF0Zm9ybUJyb3dzZXJEeW5hbWljKGV4dHJhUHJvdmlkZXJzKTtcbiAgICByZXR1cm4gcGxhdGZvcm1SZWYuYm9vdHN0cmFwTW9kdWxlKFRvcGljVmlld2VyUGFnZU1vZHVsZSk7XG59O1xudmFyIGRvd25ncmFkZWRNb2R1bGUgPSBzdGF0aWNfMi5kb3duZ3JhZGVNb2R1bGUoYm9vdHN0cmFwRm4pO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJywgW1xuICAgICdkbmRMaXN0cycsICdoZWFkcm9vbScsICdpbmZpbml0ZS1zY3JvbGwnLCAnbmdBbmltYXRlJyxcbiAgICAnbmdBdWRpbycsICduZ0Nvb2tpZXMnLCAnbmdJbWdDcm9wJywgJ25nSm95UmlkZScsICduZ01hdGVyaWFsJyxcbiAgICAnbmdSZXNvdXJjZScsICduZ1Nhbml0aXplJywgJ25nVG91Y2gnLCAncGFzY2FscHJlY2h0LnRyYW5zbGF0ZScsXG4gICAgJ3RvYXN0cicsICd1aS5ib290c3RyYXAnLCAndWkuc29ydGFibGUnLCAndWkudHJlZScsICd1aS52YWxpZGF0ZScsXG4gICAgZG93bmdyYWRlZE1vZHVsZVxuXSlcbiAgICAvLyBUaGlzIGRpcmVjdGl2ZSBpcyB0aGUgZG93bmdyYWRlZCB2ZXJzaW9uIG9mIHRoZSBBbmd1bGFyIGNvbXBvbmVudCB0b1xuICAgIC8vIGJvb3RzdHJhcCB0aGUgQW5ndWxhciA4LlxuICAgIC5kaXJlY3RpdmUoJ3NlcnZpY2VCb290c3RyYXAnLCBzdGF0aWNfMS5kb3duZ3JhZGVDb21wb25lbnQoe1xuICAgIGNvbXBvbmVudDogU2VydmljZUJvb3RzdHJhcENvbXBvbmVudFxufSkpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgc2NyaXB0cyBmb3IgdGhlIHRvcGljIHZpZXdlci5cbiAqL1xuLy8gVGhlIG1vZHVsZSBuZWVkcyB0byBiZSBsb2FkZWQgYmVmb3JlIGV2ZXJ5dGhpbmcgZWxzZSBzaW5jZSBpdCBkZWZpbmVzIHRoZVxuLy8gbWFpbiBtb2R1bGUgdGhlIGVsZW1lbnRzIGFyZSBhdHRhY2hlZCB0by5cbnJlcXVpcmUoJ3BhZ2VzL3RvcGljLXZpZXdlci1wYWdlL3RvcGljLXZpZXdlci1wYWdlLm1vZHVsZS50cycpO1xucmVxdWlyZSgnQXBwLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy90b3BpYy12aWV3ZXItcGFnZS9uYXZiYXItYnJlYWRjcnVtYi8nICtcbiAgICAndG9waWMtdmlld2VyLW5hdmJhci1icmVhZGNydW1iLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvdG9waWMtdmlld2VyLXBhZ2UvdG9waWMtdmlld2VyLXBhZ2UuY29udHJvbGxlci50cycpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbnZhciBfX21ldGFkYXRhID0gKHRoaXMgJiYgdGhpcy5fX21ldGFkYXRhKSB8fCBmdW5jdGlvbiAoaywgdikge1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShrLCB2KTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0byBzZXQgdGhlIHRpdGxlIG9mIHRoZSBwYWdlLlxuICovXG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgcGxhdGZvcm1fYnJvd3Nlcl8xID0gcmVxdWlyZShcIkBhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXJcIik7XG52YXIgUGFnZVRpdGxlU2VydmljZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQYWdlVGl0bGVTZXJ2aWNlKHRpdGxlU2VydmljZSkge1xuICAgICAgICB0aGlzLnRpdGxlU2VydmljZSA9IHRpdGxlU2VydmljZTtcbiAgICB9XG4gICAgUGFnZVRpdGxlU2VydmljZS5wcm90b3R5cGUuc2V0UGFnZVRpdGxlID0gZnVuY3Rpb24gKHRpdGxlKSB7XG4gICAgICAgIHRoaXMudGl0bGVTZXJ2aWNlLnNldFRpdGxlKHRpdGxlKTtcbiAgICB9O1xuICAgIHZhciBfYTtcbiAgICBQYWdlVGl0bGVTZXJ2aWNlID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5JbmplY3RhYmxlKHtcbiAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290J1xuICAgICAgICB9KSxcbiAgICAgICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFt0eXBlb2YgKF9hID0gdHlwZW9mIHBsYXRmb3JtX2Jyb3dzZXJfMS5UaXRsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBwbGF0Zm9ybV9icm93c2VyXzEuVGl0bGUpID09PSBcImZ1bmN0aW9uXCIgPyBfYSA6IE9iamVjdF0pXG4gICAgXSwgUGFnZVRpdGxlU2VydmljZSk7XG4gICAgcmV0dXJuIFBhZ2VUaXRsZVNlcnZpY2U7XG59KCkpO1xuZXhwb3J0cy5QYWdlVGl0bGVTZXJ2aWNlID0gUGFnZVRpdGxlU2VydmljZTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1BhZ2VUaXRsZVNlcnZpY2UnLCBzdGF0aWNfMS5kb3duZ3JhZGVJbmplY3RhYmxlKFBhZ2VUaXRsZVNlcnZpY2UpKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uc3RhbnRzIGZvciBpbnRlcmFjdGlvbnMgZXh0ZW5zaW9ucy5cbiAqL1xudmFyIEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cygpIHtcbiAgICB9XG4gICAgLy8gTWluaW11bSBjb25maWRlbmNlIHJlcXVpcmVkIGZvciBhIHByZWRpY3RlZCBhbnN3ZXIgZ3JvdXAgdG8gYmUgc2hvd24gdG9cbiAgICAvLyB1c2VyLiBHZW5lcmFsbHkgYSB0aHJlc2hvbGQgb2YgMC43LTAuOCBpcyBhc3N1bWVkIHRvIGJlIGEgZ29vZCBvbmUgaW5cbiAgICAvLyBwcmFjdGljZSwgaG93ZXZlciB2YWx1ZSBuZWVkIG5vdCBiZSBpbiB0aG9zZSBib3VuZHMuXG4gICAgSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cy5DT0RFX1JFUExfUFJFRElDVElPTl9TRVJWSUNFX1RIUkVTSE9MRCA9IDAuNztcbiAgICBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzLkdSQVBIX0lOUFVUX0xFRlRfTUFSR0lOID0gMTIwO1xuICAgIC8vIEdpdmVzIHRoZSBzdGFmZi1saW5lcyBodW1hbiByZWFkYWJsZSB2YWx1ZXMuXG4gICAgSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cy5OT1RFX05BTUVTX1RPX01JRElfVkFMVUVTID0ge1xuICAgICAgICBBNTogODEsXG4gICAgICAgIEc1OiA3OSxcbiAgICAgICAgRjU6IDc3LFxuICAgICAgICBFNTogNzYsXG4gICAgICAgIEQ1OiA3NCxcbiAgICAgICAgQzU6IDcyLFxuICAgICAgICBCNDogNzEsXG4gICAgICAgIEE0OiA2OSxcbiAgICAgICAgRzQ6IDY3LFxuICAgICAgICBGNDogNjUsXG4gICAgICAgIEU0OiA2NCxcbiAgICAgICAgRDQ6IDYyLFxuICAgICAgICBDNDogNjBcbiAgICB9O1xuICAgIC8vIE1pbmltdW0gY29uZmlkZW5jZSByZXF1aXJlZCBmb3IgYSBwcmVkaWN0ZWQgYW5zd2VyIGdyb3VwIHRvIGJlIHNob3duIHRvXG4gICAgLy8gdXNlci4gR2VuZXJhbGx5IGEgdGhyZXNob2xkIG9mIDAuNy0wLjggaXMgYXNzdW1lZCB0byBiZSBhIGdvb2Qgb25lIGluXG4gICAgLy8gcHJhY3RpY2UsIGhvd2V2ZXIgdmFsdWUgbmVlZCBub3QgYmUgaW4gdGhvc2UgYm91bmRzLlxuICAgIEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMuVEVYVF9JTlBVVF9QUkVESUNUSU9OX1NFUlZJQ0VfVEhSRVNIT0xEID0gMC43O1xuICAgIHJldHVybiBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzO1xufSgpKTtcbmV4cG9ydHMuSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cyA9IEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHM7XG4iXSwic291cmNlUm9vdCI6IiJ9