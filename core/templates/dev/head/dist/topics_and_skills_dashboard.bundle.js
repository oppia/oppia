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
/******/ 		"topics_and_skills_dashboard": 0
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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.scripts.ts","vendors~about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboar~7856c05a","about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboard~donate~e06a4a17","admin~creator_dashboard~exploration_editor~exploration_player~moderator~practice_session~review_test~b9580ed0","admin~creator_dashboard~exploration_editor~exploration_player~moderator~practice_session~review_test~d3595155","admin~exploration_editor~exploration_player~moderator~practice_session~review_test~skill_editor~stor~7734cddb","story_editor~topics_and_skills_dashboard"]);
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

/***/ "./core/templates/dev/head/components/entity-creation-services/skill-creation.service.ts":
/*!***********************************************************************************************!*\
  !*** ./core/templates/dev/head/components/entity-creation-services/skill-creation.service.ts ***!
  \***********************************************************************************************/
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
 * @fileoverview Functionality for creating a new skill.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('oppia').factory('SkillCreationService', [
    '$http', '$rootScope', '$timeout', '$window', 'AlertsService',
    'UrlInterpolationService',
    function ($http, $rootScope, $timeout, $window, AlertsService, UrlInterpolationService) {
        var CREATE_NEW_SKILL_URL_TEMPLATE = ('/skill_editor/<skill_id>');
        var skillCreationInProgress = false;
        return {
            createNewSkill: function (description, rubrics, linkedTopicIds) {
                if (skillCreationInProgress) {
                    return;
                }
                for (var idx in rubrics) {
                    rubrics[idx] = rubrics[idx].toBackendDict();
                }
                skillCreationInProgress = true;
                AlertsService.clearWarnings();
                $rootScope.loadingMessage = 'Creating skill';
                $http.post('/skill_editor_handler/create_new', {
                    description: description,
                    linked_topic_ids: linkedTopicIds,
                    rubrics: rubrics
                }).then(function (response) {
                    $timeout(function () {
                        $window.location = UrlInterpolationService.interpolateUrl(CREATE_NEW_SKILL_URL_TEMPLATE, {
                            skill_id: response.data.skillId
                        });
                    }, 150);
                }, function () {
                    $rootScope.loadingMessage = '';
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/entity-creation-services/topic-creation.service.ts.ts":
/*!**************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/entity-creation-services/topic-creation.service.ts.ts ***!
  \**************************************************************************************************/
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
 * @fileoverview Modal and functionality for the create topic button.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('oppia').factory('TopicCreationService', [
    '$http', '$rootScope', '$timeout', '$uibModal', '$window', 'AlertsService',
    'UrlInterpolationService',
    function ($http, $rootScope, $timeout, $uibModal, $window, AlertsService, UrlInterpolationService) {
        var TOPIC_EDITOR_URL_TEMPLATE = '/topic_editor/<topic_id>';
        var topicCreationInProgress = false;
        return {
            createNewTopic: function () {
                if (topicCreationInProgress) {
                    return;
                }
                var modalInstance = $uibModal.open({
                    templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topics-and-skills-dashboard-page/templates/' +
                        'new-topic-name-editor.template.html'),
                    backdrop: true,
                    controller: [
                        '$scope', '$uibModalInstance',
                        function ($scope, $uibModalInstance) {
                            $scope.topicName = '';
                            $scope.isTopicNameEmpty = function (topicName) {
                                return (topicName === '');
                            };
                            $scope.save = function (topicName) {
                                $uibModalInstance.close(topicName);
                            };
                            $scope.cancel = function () {
                                $uibModalInstance.dismiss('cancel');
                            };
                        }
                    ]
                });
                modalInstance.result.then(function (topicName) {
                    if (topicName === '') {
                        throw Error('Topic name cannot be empty');
                    }
                    topicCreationInProgress = true;
                    AlertsService.clearWarnings();
                    $rootScope.loadingMessage = 'Creating topic';
                    $http.post('/topic_editor_handler/create_new', { name: topicName })
                        .then(function (response) {
                        $timeout(function () {
                            $window.location = UrlInterpolationService.interpolateUrl(TOPIC_EDITOR_URL_TEMPLATE, {
                                topic_id: response.data.topicId
                            });
                        }, 150);
                    }, function () {
                        $rootScope.loadingMessage = '';
                    });
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/rubrics-editor/rubrics-editor.directive.ts":
/*!***************************************************************************************!*\
  !*** ./core/templates/dev/head/components/rubrics-editor/rubrics-editor.directive.ts ***!
  \***************************************************************************************/
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
 * @fileoverview Directive for the rubric editor for skills.
 */
__webpack_require__(/*! components/forms/schema-based-editors/schema-based-editor.directive.ts */ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-editor.directive.ts");
__webpack_require__(/*! domain/skill/RubricObjectFactory.ts */ "./core/templates/dev/head/domain/skill/RubricObjectFactory.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! components/ck-editor-helpers/ck-editor-4-rte.directive.ts */ "./core/templates/dev/head/components/ck-editor-helpers/ck-editor-4-rte.directive.ts");
__webpack_require__(/*! components/ck-editor-helpers/ck-editor-4-widgets.initializer.ts */ "./core/templates/dev/head/components/ck-editor-helpers/ck-editor-4-widgets.initializer.ts");
__webpack_require__(/*! components/forms/custom-forms-directives/image-uploader.directive.ts */ "./core/templates/dev/head/components/forms/custom-forms-directives/image-uploader.directive.ts");
__webpack_require__(/*! directives/mathjax-bind.directive.ts */ "./core/templates/dev/head/directives/mathjax-bind.directive.ts");
__webpack_require__(/*! filters/string-utility-filters/normalize-whitespace.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/normalize-whitespace.filter.ts");
__webpack_require__(/*! objects/objectComponentsRequires.ts */ "./extensions/objects/objectComponentsRequires.ts");
__webpack_require__(/*! directives/angular-html-bind.directive.ts */ "./core/templates/dev/head/directives/angular-html-bind.directive.ts");
__webpack_require__(/*! pages/skill-editor-page/skill-editor-page.constants.ajs.ts */ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-page.constants.ajs.ts");
angular.module('oppia').directive('rubricsEditor', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            // The rubrics parameter passed in should have the 3 difficulties
            // initialized.
            bindToController: {
                getRubrics: '&rubrics',
                onSaveRubric: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/rubrics-editor/rubrics-editor.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$scope', '$filter', '$uibModal', '$rootScope',
                'RubricObjectFactory', 'EVENT_SKILL_REINITIALIZED',
                function ($scope, $filter, $uibModal, $rootScope, RubricObjectFactory, EVENT_SKILL_REINITIALIZED) {
                    var ctrl = this;
                    ctrl.activeRubricIndex = 0;
                    ctrl.explanationEditorIsOpen = false;
                    var explanationMemento = null;
                    ctrl.isEditable = function () {
                        return true;
                    };
                    ctrl.setActiveDifficultyIndex = function (index) {
                        ctrl.activeRubricIndex = index;
                    };
                    ctrl.openExplanationEditor = function () {
                        explanationMemento = angular.copy(ctrl.getRubrics()[ctrl.activeRubricIndex].getExplanation());
                        ctrl.editableExplanation = explanationMemento;
                        ctrl.explanationEditorIsOpen = true;
                    };
                    ctrl.EXPLANATION_FORM_SCHEMA = {
                        type: 'html',
                        ui_config: {}
                    };
                    ctrl.saveExplanation = function () {
                        ctrl.explanationEditorIsOpen = false;
                        var explanationHasChanged = (ctrl.editableExplanation !==
                            ctrl.getRubrics()[ctrl.activeRubricIndex].getExplanation());
                        if (explanationHasChanged) {
                            ctrl.onSaveRubric(ctrl.getRubrics()[ctrl.activeRubricIndex].getDifficulty(), ctrl.editableExplanation);
                            explanationMemento = ctrl.editableExplanation;
                        }
                    };
                    ctrl.cancelEditExplanation = function () {
                        ctrl.editableExplanation = explanationMemento;
                        ctrl.explanationEditorIsOpen = false;
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/skill/EditableSkillBackendApiService.ts":
/*!********************************************************************************!*\
  !*** ./core/templates/dev/head/domain/skill/EditableSkillBackendApiService.ts ***!
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
 * @fileoverview Service to send changes to a skill to the backend.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! domain/skill/skill-domain.constants.ajs.ts */ "./core/templates/dev/head/domain/skill/skill-domain.constants.ajs.ts");
angular.module('oppia').factory('EditableSkillBackendApiService', [
    '$http', '$q', 'UrlInterpolationService',
    'EDITABLE_SKILL_DATA_URL_TEMPLATE', 'SKILL_DATA_URL_TEMPLATE',
    function ($http, $q, UrlInterpolationService, EDITABLE_SKILL_DATA_URL_TEMPLATE, SKILL_DATA_URL_TEMPLATE) {
        var _fetchSkill = function (skillId, successCallback, errorCallback) {
            var skillDataUrl = UrlInterpolationService.interpolateUrl(EDITABLE_SKILL_DATA_URL_TEMPLATE, {
                skill_id: skillId
            });
            $http.get(skillDataUrl).then(function (response) {
                var skill = angular.copy(response.data.skill);
                if (successCallback) {
                    successCallback(skill);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _fetchMultiSkills = function (skillIds, successCallback, errorCallback) {
            var skillDataUrl = UrlInterpolationService.interpolateUrl(SKILL_DATA_URL_TEMPLATE, {
                comma_separated_skill_ids: skillIds.join(',')
            });
            $http.get(skillDataUrl).then(function (response) {
                var skills = angular.copy(response.data.skills);
                if (successCallback) {
                    successCallback(skills);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _updateSkill = function (skillId, skillVersion, commitMessage, changeList, successCallback, errorCallback) {
            var editableSkillDataUrl = UrlInterpolationService.interpolateUrl(EDITABLE_SKILL_DATA_URL_TEMPLATE, {
                skill_id: skillId
            });
            var putData = {
                version: skillVersion,
                commit_message: commitMessage,
                change_dicts: changeList
            };
            $http.put(editableSkillDataUrl, putData).then(function (response) {
                // The returned data is an updated skill dict.
                var skill = angular.copy(response.data.skill);
                if (successCallback) {
                    successCallback(skill);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _deleteSkill = function (skillId, successCallback, errorCallback) {
            var skillDataUrl = UrlInterpolationService.interpolateUrl(EDITABLE_SKILL_DATA_URL_TEMPLATE, {
                skill_id: skillId
            });
            $http['delete'](skillDataUrl).then(function (response) {
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
            fetchSkill: function (skillId) {
                return $q(function (resolve, reject) {
                    _fetchSkill(skillId, resolve, reject);
                });
            },
            fetchMultiSkills: function (skillIds) {
                return $q(function (resolve, reject) {
                    _fetchMultiSkills(skillIds, resolve, reject);
                });
            },
            updateSkill: function (skillId, skillVersion, commitMessage, changeList) {
                return $q(function (resolve, reject) {
                    _updateSkill(skillId, skillVersion, commitMessage, changeList, resolve, reject);
                });
            },
            deleteSkill: function (skillId) {
                return $q(function (resolve, reject) {
                    _deleteSkill(skillId, resolve, reject);
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/skill/RubricObjectFactory.ts":
/*!*********************************************************************!*\
  !*** ./core/templates/dev/head/domain/skill/RubricObjectFactory.ts ***!
  \*********************************************************************/
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Object factory for creating frontend instances of
 * rubrics.
 */
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var Rubric = /** @class */ (function () {
    function Rubric(difficulty, explanation) {
        this._difficulty = difficulty;
        this._explanation = explanation;
    }
    Rubric.prototype.toBackendDict = function () {
        return {
            difficulty: this._difficulty,
            explanation: this._explanation
        };
    };
    Rubric.prototype.getDifficulty = function () {
        return this._difficulty;
    };
    Rubric.prototype.getExplanation = function () {
        return this._explanation;
    };
    Rubric.prototype.setExplanation = function (newExplanation) {
        this._explanation = newExplanation;
    };
    return Rubric;
}());
exports.Rubric = Rubric;
var RubricObjectFactory = /** @class */ (function () {
    function RubricObjectFactory() {
    }
    RubricObjectFactory.prototype.createFromBackendDict = function (rubricBackendDict) {
        return new Rubric(rubricBackendDict.difficulty, rubricBackendDict.explanation);
    };
    RubricObjectFactory.prototype.create = function (difficulty, explanation) {
        return new Rubric(difficulty, explanation);
    };
    RubricObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], RubricObjectFactory);
    return RubricObjectFactory;
}());
exports.RubricObjectFactory = RubricObjectFactory;
angular.module('oppia').factory('RubricObjectFactory', static_1.downgradeInjectable(RubricObjectFactory));


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

/***/ "./core/templates/dev/head/domain/topic/EditableTopicBackendApiService.ts":
/*!********************************************************************************!*\
  !*** ./core/templates/dev/head/domain/topic/EditableTopicBackendApiService.ts ***!
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
 * @fileoverview Service to send changes to a topic to the backend.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! domain/topic/topic-domain.constants.ajs.ts */ "./core/templates/dev/head/domain/topic/topic-domain.constants.ajs.ts");
angular.module('oppia').factory('EditableTopicBackendApiService', [
    '$http', '$q', 'UrlInterpolationService',
    'EDITABLE_TOPIC_DATA_URL_TEMPLATE', 'SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE',
    'TOPIC_EDITOR_STORY_URL_TEMPLATE',
    function ($http, $q, UrlInterpolationService, EDITABLE_TOPIC_DATA_URL_TEMPLATE, SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE, TOPIC_EDITOR_STORY_URL_TEMPLATE) {
        var _fetchTopic = function (topicId, successCallback, errorCallback) {
            var topicDataUrl = UrlInterpolationService.interpolateUrl(EDITABLE_TOPIC_DATA_URL_TEMPLATE, {
                topic_id: topicId
            });
            $http.get(topicDataUrl).then(function (response) {
                if (successCallback) {
                    // The response is passed as a dict with 2 fields and not as 2
                    // parameters, because the successCallback is called as the resolve
                    // callback function in $q in fetchTopic(), and according to its
                    // documentation (https://docs.angularjs.org/api/ng/service/$q),
                    // resolve or reject can have only a single parameter.
                    successCallback({
                        topicDict: angular.copy(response.data.topic_dict),
                        skillIdToDescriptionDict: angular.copy(response.data.skill_id_to_description_dict)
                    });
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _fetchStories = function (topicId, successCallback, errorCallback) {
            var storiesDataUrl = UrlInterpolationService.interpolateUrl(TOPIC_EDITOR_STORY_URL_TEMPLATE, {
                topic_id: topicId
            });
            $http.get(storiesDataUrl).then(function (response) {
                var canonicalStorySummaries = angular.copy(response.data.canonical_story_summary_dicts);
                if (successCallback) {
                    successCallback(canonicalStorySummaries);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _fetchSubtopicPage = function (topicId, subtopicId, successCallback, errorCallback) {
            var subtopicPageDataUrl = UrlInterpolationService.interpolateUrl(SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE, {
                topic_id: topicId,
                subtopic_id: subtopicId.toString()
            });
            $http.get(subtopicPageDataUrl).then(function (response) {
                var topic = angular.copy(response.data.subtopic_page);
                if (successCallback) {
                    successCallback(topic);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _deleteTopic = function (topicId, successCallback, errorCallback) {
            var topicDataUrl = UrlInterpolationService.interpolateUrl(EDITABLE_TOPIC_DATA_URL_TEMPLATE, {
                topic_id: topicId
            });
            $http['delete'](topicDataUrl).then(function (response) {
                if (successCallback) {
                    successCallback(response.status);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _updateTopic = function (topicId, topicVersion, commitMessage, changeList, successCallback, errorCallback) {
            var editableTopicDataUrl = UrlInterpolationService.interpolateUrl(EDITABLE_TOPIC_DATA_URL_TEMPLATE, {
                topic_id: topicId
            });
            var putData = {
                version: topicVersion,
                commit_message: commitMessage,
                topic_and_subtopic_page_change_dicts: changeList
            };
            $http.put(editableTopicDataUrl, putData).then(function (response) {
                if (successCallback) {
                    // Here also, a dict with 2 fields are passed instead of just 2
                    // parameters, due to the same reason as written for _fetchTopic().
                    successCallback({
                        topicDict: angular.copy(response.data.topic_dict),
                        skillIdToDescriptionDict: angular.copy(response.data.skill_id_to_description_dict)
                    });
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        return {
            fetchTopic: function (topicId) {
                return $q(function (resolve, reject) {
                    _fetchTopic(topicId, resolve, reject);
                });
            },
            fetchStories: function (topicId) {
                return $q(function (resolve, reject) {
                    _fetchStories(topicId, resolve, reject);
                });
            },
            fetchSubtopicPage: function (topicId, subtopicId) {
                return $q(function (resolve, reject) {
                    _fetchSubtopicPage(topicId, subtopicId, resolve, reject);
                });
            },
            /**
             * Updates a topic in the backend with the provided topic ID.
             * The changes only apply to the topic of the given version and the
             * request to update the topic will fail if the provided topic
             * version is older than the current version stored in the backend. Both
             * the changes and the message to associate with those changes are used
             * to commit a change to the topic. The new topic is passed to
             * the success callback, if one is provided to the returned promise
             * object. Errors are passed to the error callback, if one is provided.
             */
            updateTopic: function (topicId, topicVersion, commitMessage, changeList) {
                return $q(function (resolve, reject) {
                    _updateTopic(topicId, topicVersion, commitMessage, changeList, resolve, reject);
                });
            },
            deleteTopic: function (topicId) {
                return $q(function (resolve, reject) {
                    _deleteTopic(topicId, resolve, reject);
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/topic/topic-domain.constants.ajs.ts":
/*!****************************************************************************!*\
  !*** ./core/templates/dev/head/domain/topic/topic-domain.constants.ajs.ts ***!
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
 * @fileoverview Constants for topic domain.
 */
// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
var topic_domain_constants_1 = __webpack_require__(/*! domain/topic/topic-domain.constants */ "./core/templates/dev/head/domain/topic/topic-domain.constants.ts");
angular.module('oppia').constant('TOPIC_EDITOR_STORY_URL_TEMPLATE', topic_domain_constants_1.TopicDomainConstants.TOPIC_EDITOR_STORY_URL_TEMPLATE);
angular.module('oppia').constant('TOPIC_EDITOR_QUESTION_URL_TEMPLATE', topic_domain_constants_1.TopicDomainConstants.TOPIC_EDITOR_QUESTION_URL_TEMPLATE);
angular.module('oppia').constant('TOPIC_MANAGER_RIGHTS_URL_TEMPLATE', topic_domain_constants_1.TopicDomainConstants.TOPIC_MANAGER_RIGHTS_URL_TEMPLATE);
angular.module('oppia').constant('TOPIC_RIGHTS_URL_TEMPLATE', topic_domain_constants_1.TopicDomainConstants.TOPIC_RIGHTS_URL_TEMPLATE);
// These should match the constants defined in core.domain.topic_domain.
angular.module('oppia').constant('CMD_ADD_SUBTOPIC', topic_domain_constants_1.TopicDomainConstants.CMD_ADD_SUBTOPIC);
angular.module('oppia').constant('CMD_DELETE_ADDITIONAL_STORY', topic_domain_constants_1.TopicDomainConstants.CMD_DELETE_ADDITIONAL_STORY);
angular.module('oppia').constant('CMD_DELETE_CANONICAL_STORY', topic_domain_constants_1.TopicDomainConstants.CMD_DELETE_CANONICAL_STORY);
angular.module('oppia').constant('CMD_DELETE_SUBTOPIC', topic_domain_constants_1.TopicDomainConstants.CMD_DELETE_SUBTOPIC);
angular.module('oppia').constant('CMD_ADD_UNCATEGORIZED_SKILL_ID', topic_domain_constants_1.TopicDomainConstants.CMD_ADD_UNCATEGORIZED_SKILL_ID);
angular.module('oppia').constant('CMD_REMOVE_UNCATEGORIZED_SKILL_ID', topic_domain_constants_1.TopicDomainConstants.CMD_REMOVE_UNCATEGORIZED_SKILL_ID);
angular.module('oppia').constant('CMD_MOVE_SKILL_ID_TO_SUBTOPIC', topic_domain_constants_1.TopicDomainConstants.CMD_MOVE_SKILL_ID_TO_SUBTOPIC);
angular.module('oppia').constant('CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC', topic_domain_constants_1.TopicDomainConstants.CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC);
angular.module('oppia').constant('CMD_UPDATE_TOPIC_PROPERTY', topic_domain_constants_1.TopicDomainConstants.CMD_UPDATE_TOPIC_PROPERTY);
angular.module('oppia').constant('CMD_UPDATE_SUBTOPIC_PROPERTY', topic_domain_constants_1.TopicDomainConstants.CMD_UPDATE_SUBTOPIC_PROPERTY);
angular.module('oppia').constant('CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY', topic_domain_constants_1.TopicDomainConstants.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY);
angular.module('oppia').constant('TOPIC_PROPERTY_NAME', topic_domain_constants_1.TopicDomainConstants.TOPIC_PROPERTY_NAME);
angular.module('oppia').constant('TOPIC_PROPERTY_DESCRIPTION', topic_domain_constants_1.TopicDomainConstants.TOPIC_PROPERTY_DESCRIPTION);
angular.module('oppia').constant('TOPIC_PROPERTY_LANGUAGE_CODE', topic_domain_constants_1.TopicDomainConstants.TOPIC_PROPERTY_LANGUAGE_CODE);
angular.module('oppia').constant('SUBTOPIC_PROPERTY_TITLE', topic_domain_constants_1.TopicDomainConstants.SUBTOPIC_PROPERTY_TITLE);
angular.module('oppia').constant('SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML', topic_domain_constants_1.TopicDomainConstants.SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML);
angular.module('oppia').constant('SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_AUDIO', topic_domain_constants_1.TopicDomainConstants.SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_AUDIO);


/***/ }),

/***/ "./core/templates/dev/head/domain/topic/topic-domain.constants.ts":
/*!************************************************************************!*\
  !*** ./core/templates/dev/head/domain/topic/topic-domain.constants.ts ***!
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
 * @fileoverview Constants for topic domain.
 */
var TopicDomainConstants = /** @class */ (function () {
    function TopicDomainConstants() {
    }
    TopicDomainConstants.TOPIC_EDITOR_STORY_URL_TEMPLATE = '/topic_editor_story_handler/<topic_id>';
    TopicDomainConstants.TOPIC_EDITOR_QUESTION_URL_TEMPLATE = '/topic_editor_question_handler/<topic_id>?cursor=<cursor>';
    TopicDomainConstants.TOPIC_MANAGER_RIGHTS_URL_TEMPLATE = '/rightshandler/assign_topic_manager/<topic_id>/<assignee_id>';
    TopicDomainConstants.TOPIC_RIGHTS_URL_TEMPLATE = '/rightshandler/get_topic_rights/<topic_id>';
    // These should match the constants defined in core.domain.topic_domain.
    TopicDomainConstants.CMD_ADD_SUBTOPIC = 'add_subtopic';
    TopicDomainConstants.CMD_DELETE_ADDITIONAL_STORY = 'delete_additional_story';
    TopicDomainConstants.CMD_DELETE_CANONICAL_STORY = 'delete_canonical_story';
    TopicDomainConstants.CMD_DELETE_SUBTOPIC = 'delete_subtopic';
    TopicDomainConstants.CMD_ADD_UNCATEGORIZED_SKILL_ID = 'add_uncategorized_skill_id';
    TopicDomainConstants.CMD_REMOVE_UNCATEGORIZED_SKILL_ID = 'remove_uncategorized_skill_id';
    TopicDomainConstants.CMD_MOVE_SKILL_ID_TO_SUBTOPIC = 'move_skill_id_to_subtopic';
    TopicDomainConstants.CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC = 'remove_skill_id_from_subtopic';
    TopicDomainConstants.CMD_UPDATE_TOPIC_PROPERTY = 'update_topic_property';
    TopicDomainConstants.CMD_UPDATE_SUBTOPIC_PROPERTY = 'update_subtopic_property';
    TopicDomainConstants.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY = 'update_subtopic_page_property';
    TopicDomainConstants.TOPIC_PROPERTY_NAME = 'name';
    TopicDomainConstants.TOPIC_PROPERTY_DESCRIPTION = 'description';
    TopicDomainConstants.TOPIC_PROPERTY_LANGUAGE_CODE = 'language_code';
    TopicDomainConstants.SUBTOPIC_PROPERTY_TITLE = 'title';
    TopicDomainConstants.SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML = 'page_contents_html';
    TopicDomainConstants.SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_AUDIO = 'page_contents_audio';
    return TopicDomainConstants;
}());
exports.TopicDomainConstants = TopicDomainConstants;


/***/ }),

/***/ "./core/templates/dev/head/domain/topics_and_skills_dashboard/TopicsAndSkillsDashboardBackendApiService.ts":
/*!*****************************************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/topics_and_skills_dashboard/TopicsAndSkillsDashboardBackendApiService.ts ***!
  \*****************************************************************************************************************/
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
 * @fileoverview Service to retrieve information of topics and skills dashboard
  from the backend and to merge skills from the dashboard.
 */
__webpack_require__(/*! domain/topics_and_skills_dashboard/topics-and-skills-dashboard-domain.constants.ajs.ts */ "./core/templates/dev/head/domain/topics_and_skills_dashboard/topics-and-skills-dashboard-domain.constants.ajs.ts");
angular.module('oppia').factory('TopicsAndSkillsDashboardBackendApiService', [
    '$http', 'MERGE_SKILLS_URL', function ($http, MERGE_SKILLS_URL) {
        var _fetchDashboardData = function () {
            return $http.get('/topics_and_skills_dashboard/data');
        };
        var _mergeSkills = function (oldSkillId, newSkillId) {
            var mergeSkillsData = {
                old_skill_id: oldSkillId,
                new_skill_id: newSkillId
            };
            return $http.post(MERGE_SKILLS_URL, mergeSkillsData);
        };
        return {
            fetchDashboardData: _fetchDashboardData,
            mergeSkills: _mergeSkills
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/topics_and_skills_dashboard/topics-and-skills-dashboard-domain.constants.ajs.ts":
/*!************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/topics_and_skills_dashboard/topics-and-skills-dashboard-domain.constants.ajs.ts ***!
  \************************************************************************************************************************/
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
 * @fileoverview Constants for topics and skills dashboard domain.
 */
/* eslint-disable max-len */
// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
var topics_and_skills_dashboard_domain_constants_1 = __webpack_require__(/*! domain/topics_and_skills_dashboard/topics-and-skills-dashboard-domain.constants */ "./core/templates/dev/head/domain/topics_and_skills_dashboard/topics-and-skills-dashboard-domain.constants.ts");
/* eslint-enable max-len */
angular.module('oppia').constant('MERGE_SKILLS_URL', topics_and_skills_dashboard_domain_constants_1.TopicsAndSkillsDashboardDomainConstants.MERGE_SKILLS_URL);


/***/ }),

/***/ "./core/templates/dev/head/domain/topics_and_skills_dashboard/topics-and-skills-dashboard-domain.constants.ts":
/*!********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/topics_and_skills_dashboard/topics-and-skills-dashboard-domain.constants.ts ***!
  \********************************************************************************************************************/
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
 * @fileoverview Constants for topics and skills dashboard domain.
 */
var TopicsAndSkillsDashboardDomainConstants = /** @class */ (function () {
    function TopicsAndSkillsDashboardDomainConstants() {
    }
    TopicsAndSkillsDashboardDomainConstants.MERGE_SKILLS_URL = '/merge_skills_handler';
    return TopicsAndSkillsDashboardDomainConstants;
}());
exports.TopicsAndSkillsDashboardDomainConstants = TopicsAndSkillsDashboardDomainConstants;


/***/ }),

/***/ "./core/templates/dev/head/filters/string-utility-filters/normalize-whitespace.filter.ts":
/*!***********************************************************************************************!*\
  !*** ./core/templates/dev/head/filters/string-utility-filters/normalize-whitespace.filter.ts ***!
  \***********************************************************************************************/
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
 * @fileoverview NormalizeWhitespace filter for Oppia.
 */
__webpack_require__(/*! services/UtilsService.ts */ "./core/templates/dev/head/services/UtilsService.ts");
// Filter that removes whitespace from the beginning and end of a string, and
// replaces interior whitespace with a single space character.
angular.module('oppia').filter('normalizeWhitespace', [
    'UtilsService', function (UtilsService) {
        return function (input) {
            if (UtilsService.isString(input)) {
                // Remove whitespace from the beginning and end of the string, and
                // replace interior whitespace with a single space character.
                input = input.trim();
                input = input.replace(/\s{2,}/g, ' ');
                return input;
            }
            else {
                return input;
            }
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

/***/ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-page.constants.ajs.ts":
/*!********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/skill-editor-page/skill-editor-page.constants.ajs.ts ***!
  \********************************************************************************************/
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
 * @fileoverview Constants for the skill editor page.
 */
// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
var skill_editor_page_constants_1 = __webpack_require__(/*! pages/skill-editor-page/skill-editor-page.constants */ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-page.constants.ts");
angular.module('oppia').constant('SKILL_RIGHTS_URL_TEMPLATE', skill_editor_page_constants_1.SkillEditorPageConstants.SKILL_RIGHTS_URL_TEMPLATE);
angular.module('oppia').constant('SKILL_PUBLISH_URL_TEMPLATE', skill_editor_page_constants_1.SkillEditorPageConstants.SKILL_PUBLISH_URL_TEMPLATE);
angular.module('oppia').constant('EVENT_SKILL_INITIALIZED', skill_editor_page_constants_1.SkillEditorPageConstants.EVENT_SKILL_INITIALIZED);
angular.module('oppia').constant('EVENT_SKILL_REINITIALIZED', skill_editor_page_constants_1.SkillEditorPageConstants.EVENT_SKILL_REINITIALIZED);


/***/ }),

/***/ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-page.constants.ts":
/*!****************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/skill-editor-page/skill-editor-page.constants.ts ***!
  \****************************************************************************************/
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
 * @fileoverview Constants for the skill editor page.
 */
var SkillEditorPageConstants = /** @class */ (function () {
    function SkillEditorPageConstants() {
    }
    SkillEditorPageConstants.SKILL_RIGHTS_URL_TEMPLATE = '/skill_editor_handler/rights/<skill_id>';
    SkillEditorPageConstants.SKILL_PUBLISH_URL_TEMPLATE = '/skill_editor_handler/publish_skill/<skill_id>';
    SkillEditorPageConstants.EVENT_SKILL_INITIALIZED = 'skillInitialized';
    SkillEditorPageConstants.EVENT_SKILL_REINITIALIZED = 'skillReinitialized';
    return SkillEditorPageConstants;
}());
exports.SkillEditorPageConstants = SkillEditorPageConstants;


/***/ }),

/***/ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/navbar/topics-and-skills-dashboard-navbar-breadcrumb.directive.ts":
/*!******************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topics-and-skills-dashboard-page/navbar/topics-and-skills-dashboard-navbar-breadcrumb.directive.ts ***!
  \******************************************************************************************************************************************/
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
 * @fileoverview Controller for the navbar breadcrumb of the collection editor.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('topicsAndSkillsDashboardNavbarBreadcrumb', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topics-and-skills-dashboard-page/navbar/' +
                'topics-and-skills-dashboard-navbar-breadcrumb.directive.html'),
            controller: [
                function () { }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/navbar/topics-and-skills-dashboard-navbar.directive.ts":
/*!*******************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topics-and-skills-dashboard-page/navbar/topics-and-skills-dashboard-navbar.directive.ts ***!
  \*******************************************************************************************************************************/
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
 * @fileoverview Directive for the navbar of the collection editor.
 */
__webpack_require__(/*! components/entity-creation-services/skill-creation.service.ts */ "./core/templates/dev/head/components/entity-creation-services/skill-creation.service.ts");
__webpack_require__(/*! components/entity-creation-services/topic-creation.service.ts.ts */ "./core/templates/dev/head/components/entity-creation-services/topic-creation.service.ts.ts");
__webpack_require__(/*! domain/topic/EditableTopicBackendApiService.ts */ "./core/templates/dev/head/domain/topic/EditableTopicBackendApiService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants.ajs.ts */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants.ajs.ts");
angular.module('oppia').directive('topicsAndSkillsDashboardNavbar', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topics-and-skills-dashboard-page/navbar/' +
                'topics-and-skills-dashboard-navbar.directive.html'),
            controller: [
                '$scope', '$rootScope', '$uibModal', 'TopicCreationService',
                'RubricObjectFactory', 'SkillCreationService',
                'EVENT_TYPE_TOPIC_CREATION_ENABLED',
                'EVENT_TYPE_SKILL_CREATION_ENABLED', 'EditableTopicBackendApiService',
                'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
                'SKILL_DIFFICULTIES',
                function ($scope, $rootScope, $uibModal, TopicCreationService, RubricObjectFactory, SkillCreationService, EVENT_TYPE_TOPIC_CREATION_ENABLED, EVENT_TYPE_SKILL_CREATION_ENABLED, EditableTopicBackendApiService, EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED, SKILL_DIFFICULTIES) {
                    $scope.createTopic = function () {
                        TopicCreationService.createNewTopic();
                    };
                    $scope.createSkill = function () {
                        var rubrics = [];
                        for (var idx in SKILL_DIFFICULTIES) {
                            rubrics.push(RubricObjectFactory.create(SKILL_DIFFICULTIES[idx], ''));
                        }
                        $uibModal.open({
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topics-and-skills-dashboard-page/templates/' +
                                'create-new-skill-modal.template.html'),
                            backdrop: 'static',
                            controller: [
                                '$scope', '$uibModalInstance',
                                function ($scope, $uibModalInstance) {
                                    $scope.newSkillDescription = '';
                                    $scope.rubrics = rubrics;
                                    $scope.allRubricsAdded = false;
                                    var areAllRubricsPresent = function () {
                                        for (var idx in $scope.rubrics) {
                                            if ($scope.rubrics[idx].getExplanation() === '') {
                                                $scope.allRubricsAdded = false;
                                                return;
                                            }
                                        }
                                        $scope.allRubricsAdded = true;
                                    };
                                    $scope.onSaveRubric = function (difficulty, explanation) {
                                        for (var idx in $scope.rubrics) {
                                            if ($scope.rubrics[idx].getDifficulty() === difficulty) {
                                                $scope.rubrics[idx].setExplanation(explanation);
                                            }
                                        }
                                        areAllRubricsPresent();
                                    };
                                    $scope.createNewSkill = function () {
                                        $uibModalInstance.close({
                                            description: $scope.newSkillDescription,
                                            rubrics: $scope.rubrics
                                        });
                                    };
                                    $scope.cancel = function () {
                                        $uibModalInstance.dismiss('cancel');
                                    };
                                }
                            ]
                        }).result.then(function (result) {
                            SkillCreationService.createNewSkill(result.description, result.rubrics, []);
                        });
                    };
                    $rootScope.$on(EVENT_TYPE_TOPIC_CREATION_ENABLED, function (evt, canCreateTopic) {
                        $scope.userCanCreateTopic = canCreateTopic;
                    });
                    $rootScope.$on(EVENT_TYPE_SKILL_CREATION_ENABLED, function (evt, canCreateSkill) {
                        $scope.userCanCreateSkill = canCreateSkill;
                    });
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/skills-list/skills-list.directive.ts":
/*!*************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topics-and-skills-dashboard-page/skills-list/skills-list.directive.ts ***!
  \*************************************************************************************************************/
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
 * @fileoverview Controller for the skills list viewer.
 */
__webpack_require__(/*! pages/topics-and-skills-dashboard-page/topic-selector/topic-selector.directive.ts */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topic-selector/topic-selector.directive.ts");
__webpack_require__(/*! domain/skill/EditableSkillBackendApiService.ts */ "./core/templates/dev/head/domain/skill/EditableSkillBackendApiService.ts");
__webpack_require__(/*! domain/topic/EditableTopicBackendApiService.ts */ "./core/templates/dev/head/domain/topic/EditableTopicBackendApiService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants.ajs.ts */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants.ajs.ts");
angular.module('oppia').directive('skillsList', [
    'AlertsService', 'UrlInterpolationService',
    function (AlertsService, UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {
                getSkillSummaries: '&skillSummaries',
                getEditableTopicSummaries: '&editableTopicSummaries',
                isInModal: '&inModal',
                getMergeableSkillSummaries: '&mergeableSkillSummaries',
                selectedSkill: '=',
                canDeleteSkill: '&userCanDeleteSkill',
                canCreateSkill: '&userCanCreateSkill',
                isUnpublishedSkill: '&unpublishedSkill'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topics-and-skills-dashboard-page/skills-list/' +
                'skills-list.directive.html'),
            controller: [
                '$scope', '$uibModal', '$rootScope', 'EditableTopicBackendApiService',
                'EditableSkillBackendApiService',
                'TopicsAndSkillsDashboardBackendApiService',
                'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
                function ($scope, $uibModal, $rootScope, EditableTopicBackendApiService, EditableSkillBackendApiService, TopicsAndSkillsDashboardBackendApiService, EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED) {
                    $scope.SKILL_HEADINGS = [
                        'description', 'worked_examples_count', 'misconception_count'
                    ];
                    $scope.highlightedIndex = null;
                    $scope.highlightColumns = function (index) {
                        $scope.highlightedIndex = index;
                    };
                    $scope.unhighlightColumns = function () {
                        $scope.highlightedIndex = null;
                    };
                    $scope.getSkillEditorUrl = function (skillId) {
                        return '/skill_editor/' + skillId;
                    };
                    $scope.deleteSkill = function (skillId) {
                        var modalInstance = $uibModal.open({
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topics-and-skills-dashboard-page/templates/' +
                                'delete-skill-modal.template.html'),
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
                        modalInstance.result.then(function () {
                            EditableSkillBackendApiService.deleteSkill(skillId).then(function (status) {
                                $rootScope.$broadcast(EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED);
                            });
                        }).then(function () {
                            var successToast = 'The skill has been deleted.';
                            AlertsService.addSuccessMessage(successToast, 1000);
                        });
                    };
                    $scope.assignSkillToTopic = function (skillId) {
                        var topicSummaries = $scope.getEditableTopicSummaries();
                        var modalInstance = $uibModal.open({
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topics-and-skills-dashboard-page/templates/' +
                                'assign-skill-to-topic-modal.template.html'),
                            backdrop: true,
                            controller: [
                                '$scope', '$uibModalInstance',
                                function ($scope, $uibModalInstance) {
                                    $scope.topicSummaries = topicSummaries;
                                    $scope.selectedTopicIds = [];
                                    $scope.done = function () {
                                        $uibModalInstance.close($scope.selectedTopicIds);
                                    };
                                    $scope.cancel = function () {
                                        $uibModalInstance.dismiss('cancel');
                                    };
                                }
                            ]
                        });
                        modalInstance.result.then(function (topicIds) {
                            var changeList = [{
                                    cmd: 'add_uncategorized_skill_id',
                                    new_uncategorized_skill_id: skillId
                                }];
                            var topicSummaries = $scope.getEditableTopicSummaries();
                            for (var i = 0; i < topicIds.length; i++) {
                                var version = null;
                                for (var j = 0; j < topicSummaries.length; j++) {
                                    if (topicSummaries[j].id === topicIds[i]) {
                                        EditableTopicBackendApiService.updateTopic(topicIds[i], topicSummaries[j].version, 'Added skill with id ' + skillId + ' to topic.', changeList).then(function () {
                                            $rootScope.$broadcast(EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED);
                                        }).then(function () {
                                            var successToast = ('The skill has been assigned to the topic.');
                                            AlertsService.addSuccessMessage(successToast, 1000);
                                        });
                                    }
                                }
                            }
                        });
                    };
                    $scope.selectSkill = function (skill) {
                        $scope.selectedSkill = skill;
                    };
                    $scope.mergeSkill = function (skill) {
                        var skillSummaries = $scope.getMergeableSkillSummaries();
                        var modalInstance = $uibModal.open({
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topics-and-skills-dashboard-page/templates/' +
                                'merge-skill-modal.template.html'),
                            backdrop: true,
                            controller: [
                                '$scope', '$uibModalInstance',
                                function ($scope, $uibModalInstance) {
                                    $scope.skillSummaries = skillSummaries;
                                    $scope.selectedSkill = {};
                                    $scope.done = function () {
                                        $uibModalInstance.close({ skill: skill,
                                            supersedingSkillId: $scope.selectedSkill.id
                                        });
                                    };
                                    $scope.cancel = function () {
                                        $uibModalInstance.dismiss('cancel');
                                    };
                                }
                            ]
                        });
                        modalInstance.result.then(function (result) {
                            var skill = result.skill;
                            var supersedingSkillId = result.supersedingSkillId;
                            // Transfer questions from the old skill to the new skill.
                            TopicsAndSkillsDashboardBackendApiService.mergeSkills(skill.id, supersedingSkillId).then(function () {
                                // Broadcast will update the skills list in the dashboard so
                                // that the merged skills are not shown anymore.
                                $rootScope.$broadcast(EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED);
                            });
                        });
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topic-selector/topic-selector.directive.ts":
/*!*******************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topic-selector/topic-selector.directive.ts ***!
  \*******************************************************************************************************************/
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
 * @fileoverview Controller for the select topics viewer.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('selectTopics', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {
                getTopicSummaries: '&topicSummaries',
                selectedTopicIds: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topics-and-skills-dashboard-page/topic-selector/' +
                'topic-selector.directive.html'),
            controller: [
                '$scope', '$uibModal', '$rootScope',
                function ($scope, $uibModal, $rootScope) {
                    $scope.topicSummaries = $scope.getTopicSummaries();
                    $scope.selectOrDeselectTopic = function (topicId, index) {
                        if (!$scope.topicSummaries[index].isSelected) {
                            $scope.selectedTopicIds.push(topicId);
                            $scope.topicSummaries[index].isSelected = true;
                        }
                        else {
                            var idIndex = $scope.selectedTopicIds.indexOf(topicId);
                            $scope.selectedTopicIds.splice(idIndex, 1);
                            $scope.topicSummaries[index].isSelected = false;
                        }
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants.ajs.ts":
/*!**************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants.ajs.ts ***!
  \**************************************************************************************************************************/
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
 * @fileoverview Constants for the topics and skills dashboard.
 */
/* eslint-disable max-len */
// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
var topics_and_skills_dashboard_page_constants_1 = __webpack_require__(/*! pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants.ts");
/* eslint-enable max-len */
angular.module('oppia').constant('EVENT_TYPE_TOPIC_CREATION_ENABLED', topics_and_skills_dashboard_page_constants_1.TopicsAndSkillsDashboardPageConstants.EVENT_TYPE_TOPIC_CREATION_ENABLED);
angular.module('oppia').constant('EVENT_TYPE_SKILL_CREATION_ENABLED', topics_and_skills_dashboard_page_constants_1.TopicsAndSkillsDashboardPageConstants.EVENT_TYPE_SKILL_CREATION_ENABLED);
angular.module('oppia').constant('EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED', topics_and_skills_dashboard_page_constants_1.TopicsAndSkillsDashboardPageConstants
    .EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED);


/***/ }),

/***/ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants.ts":
/*!**********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants.ts ***!
  \**********************************************************************************************************************/
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
 * @fileoverview Constants for the topics and skills dashboard.
 */
var TopicsAndSkillsDashboardPageConstants = /** @class */ (function () {
    function TopicsAndSkillsDashboardPageConstants() {
    }
    TopicsAndSkillsDashboardPageConstants.EVENT_TYPE_TOPIC_CREATION_ENABLED = 'topicCreationEnabled';
    TopicsAndSkillsDashboardPageConstants.EVENT_TYPE_SKILL_CREATION_ENABLED = 'skillCreationEnabled';
    TopicsAndSkillsDashboardPageConstants.EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED = 'topicsAndSkillsDashboardReinitialized';
    return TopicsAndSkillsDashboardPageConstants;
}());
exports.TopicsAndSkillsDashboardPageConstants = TopicsAndSkillsDashboardPageConstants;


/***/ }),

/***/ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.controller.ts":
/*!***********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.controller.ts ***!
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
 * @fileoverview Controllers for the topics and skills dashboard.
 */
__webpack_require__(/*! base_components/BaseContentDirective.ts */ "./core/templates/dev/head/base_components/BaseContentDirective.ts");
__webpack_require__(/*! components/common-layout-directives/common-elements/background-banner.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/common-elements/background-banner.directive.ts");
__webpack_require__(/*! pages/topics-and-skills-dashboard-page/skills-list/skills-list.directive.ts */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/skills-list/skills-list.directive.ts");
__webpack_require__(/*! pages/topics-and-skills-dashboard-page/topics-list/topics-list.directive.ts */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-list/topics-list.directive.ts");
__webpack_require__(/*! components/entity-creation-services/skill-creation.service.ts */ "./core/templates/dev/head/components/entity-creation-services/skill-creation.service.ts");
__webpack_require__(/*! components/entity-creation-services/topic-creation.service.ts.ts */ "./core/templates/dev/head/components/entity-creation-services/topic-creation.service.ts.ts");
__webpack_require__(/*! components/rubrics-editor/rubrics-editor.directive.ts */ "./core/templates/dev/head/components/rubrics-editor/rubrics-editor.directive.ts");
__webpack_require__(/*! domain/skill/RubricObjectFactory.ts */ "./core/templates/dev/head/domain/skill/RubricObjectFactory.ts");
__webpack_require__(/*! domain/topics_and_skills_dashboard/TopicsAndSkillsDashboardBackendApiService.ts */ "./core/templates/dev/head/domain/topics_and_skills_dashboard/TopicsAndSkillsDashboardBackendApiService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants.ajs.ts */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants.ajs.ts");
angular.module('oppia').directive('topicsAndSkillsDashboardPage', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topics-and-skills-dashboard-page/' +
                'topics-and-skills-dashboard-page.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$http', '$rootScope', '$scope', '$uibModal', '$window',
                'AlertsService', 'RubricObjectFactory', 'SkillCreationService',
                'TopicCreationService', 'TopicsAndSkillsDashboardBackendApiService',
                'UrlInterpolationService',
                'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
                'EVENT_TYPE_SKILL_CREATION_ENABLED',
                'EVENT_TYPE_TOPIC_CREATION_ENABLED',
                'FATAL_ERROR_CODES', 'SKILL_DIFFICULTIES',
                function ($http, $rootScope, $scope, $uibModal, $window, AlertsService, RubricObjectFactory, SkillCreationService, TopicCreationService, TopicsAndSkillsDashboardBackendApiService, UrlInterpolationService, EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED, EVENT_TYPE_SKILL_CREATION_ENABLED, EVENT_TYPE_TOPIC_CREATION_ENABLED, FATAL_ERROR_CODES, SKILL_DIFFICULTIES) {
                    var ctrl = this;
                    ctrl.TAB_NAME_TOPICS = 'topics';
                    ctrl.TAB_NAME_UNTRIAGED_SKILLS = 'untriagedSkills';
                    ctrl.TAB_NAME_UNPUBLISHED_SKILLS = 'unpublishedSkills';
                    var _initDashboard = function () {
                        TopicsAndSkillsDashboardBackendApiService.fetchDashboardData().then(function (response) {
                            ctrl.topicSummaries = response.data.topic_summary_dicts;
                            ctrl.editableTopicSummaries = ctrl.topicSummaries.filter(function (summary) {
                                return summary.can_edit_topic === true;
                            });
                            ctrl.untriagedSkillSummaries =
                                response.data.untriaged_skill_summary_dicts;
                            ctrl.mergeableSkillSummaries =
                                response.data.mergeable_skill_summary_dicts;
                            ctrl.unpublishedSkillSummaries =
                                response.data.unpublished_skill_summary_dicts;
                            ctrl.activeTab = ctrl.TAB_NAME_TOPICS;
                            ctrl.userCanCreateTopic = response.data.can_create_topic;
                            ctrl.userCanCreateSkill = response.data.can_create_skill;
                            $rootScope.$broadcast(EVENT_TYPE_TOPIC_CREATION_ENABLED, ctrl.userCanCreateTopic);
                            $rootScope.$broadcast(EVENT_TYPE_SKILL_CREATION_ENABLED, ctrl.userCanCreateSkill);
                            ctrl.userCanDeleteTopic = response.data.can_delete_topic;
                            ctrl.userCanDeleteSkill = response.data.can_delete_skill;
                            if (ctrl.topicSummaries.length === 0 &&
                                ctrl.untriagedSkillSummaries.length !== 0) {
                                ctrl.activeTab = ctrl.TAB_NAME_UNTRIAGED_SKILLS;
                            }
                            else if (ctrl.topicSummaries.length === 0 &&
                                ctrl.unpublishedSkillSummaries.length !== 0) {
                                ctrl.activeTab = ctrl.TAB_NAME_UNPUBLISHED_SKILLS;
                            }
                        }, function (errorResponse) {
                            if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
                                AlertsService.addWarning('Failed to get dashboard data');
                            }
                            else {
                                AlertsService.addWarning('Unexpected error code from the server.');
                            }
                        });
                    };
                    ctrl.isTopicTabHelpTextVisible = function () {
                        return ((ctrl.topicSummaries.length === 0) &&
                            (ctrl.untriagedSkillSummaries.length > 0 ||
                                ctrl.unpublishedSkillSummaries.length > 0));
                    };
                    ctrl.isSkillsTabHelpTextVisible = function () {
                        return ((ctrl.untriagedSkillSummaries.length === 0) &&
                            (ctrl.topicSummaries.length > 0) &&
                            (ctrl.unpublishedSkillSummaries.length === 0));
                    };
                    ctrl.setActiveTab = function (tabName) {
                        ctrl.activeTab = tabName;
                    };
                    ctrl.createTopic = function () {
                        TopicCreationService.createNewTopic();
                    };
                    ctrl.createSkill = function () {
                        var rubrics = [];
                        for (var idx in SKILL_DIFFICULTIES) {
                            rubrics.push(RubricObjectFactory.create(SKILL_DIFFICULTIES[idx], ''));
                        }
                        $uibModal.open({
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topics-and-skills-dashboard-page/templates/' +
                                'create-new-skill-modal.template.html'),
                            backdrop: 'static',
                            controller: [
                                '$scope', '$uibModalInstance',
                                function ($scope, $uibModalInstance) {
                                    $scope.newSkillDescription = '';
                                    $scope.rubrics = rubrics;
                                    $scope.allRubricsAdded = false;
                                    var areAllRubricsPresent = function () {
                                        for (var idx in $scope.rubrics) {
                                            if ($scope.rubrics[idx].getExplanation() === '') {
                                                $scope.allRubricsAdded = false;
                                                return;
                                            }
                                        }
                                        $scope.allRubricsAdded = true;
                                    };
                                    $scope.onSaveRubric = function (difficulty, explanation) {
                                        for (var idx in $scope.rubrics) {
                                            if ($scope.rubrics[idx].getDifficulty() === difficulty) {
                                                $scope.rubrics[idx].setExplanation(explanation);
                                            }
                                        }
                                        areAllRubricsPresent();
                                    };
                                    $scope.createNewSkill = function () {
                                        $uibModalInstance.close({
                                            description: $scope.newSkillDescription,
                                            rubrics: $scope.rubrics
                                        });
                                    };
                                    $scope.cancel = function () {
                                        $uibModalInstance.dismiss('cancel');
                                    };
                                }
                            ]
                        }).result.then(function (result) {
                            SkillCreationService.createNewSkill(result.description, result.rubrics, []);
                        });
                    };
                    _initDashboard();
                    $scope.$on(EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED, _initDashboard);
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.module.ts":
/*!*******************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.module.ts ***!
  \*******************************************************************************************************************/
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
var services_constants_1 = __webpack_require__(/*! services/services.constants */ "./core/templates/dev/head/services/services.constants.ts");
var skill_domain_constants_1 = __webpack_require__(/*! domain/skill/skill-domain.constants */ "./core/templates/dev/head/domain/skill/skill-domain.constants.ts");
var topic_domain_constants_1 = __webpack_require__(/*! domain/topic/topic-domain.constants */ "./core/templates/dev/head/domain/topic/topic-domain.constants.ts");
/* eslint-disable max-len */
var topics_and_skills_dashboard_domain_constants_1 = __webpack_require__(/*! domain/topics_and_skills_dashboard/topics-and-skills-dashboard-domain.constants */ "./core/templates/dev/head/domain/topics_and_skills_dashboard/topics-and-skills-dashboard-domain.constants.ts");
var topics_and_skills_dashboard_page_constants_1 = __webpack_require__(/*! pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants.ts");
/* eslint-enable max-len */
var TopicsAndSkillsDashboardPageModule = /** @class */ (function () {
    function TopicsAndSkillsDashboardPageModule() {
    }
    // Empty placeholder method to satisfy the `Compiler`.
    TopicsAndSkillsDashboardPageModule.prototype.ngDoBootstrap = function () { };
    TopicsAndSkillsDashboardPageModule = __decorate([
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
                services_constants_1.ServicesConstants,
                skill_domain_constants_1.SkillDomainConstants,
                topic_domain_constants_1.TopicDomainConstants,
                topics_and_skills_dashboard_domain_constants_1.TopicsAndSkillsDashboardDomainConstants,
                topics_and_skills_dashboard_page_constants_1.TopicsAndSkillsDashboardPageConstants
            ]
        })
    ], TopicsAndSkillsDashboardPageModule);
    return TopicsAndSkillsDashboardPageModule;
}());
var platform_browser_dynamic_1 = __webpack_require__(/*! @angular/platform-browser-dynamic */ "./node_modules/@angular/platform-browser-dynamic/fesm5/platform-browser-dynamic.js");
var static_2 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var bootstrapFn = function (extraProviders) {
    var platformRef = platform_browser_dynamic_1.platformBrowserDynamic(extraProviders);
    return platformRef.bootstrapModule(TopicsAndSkillsDashboardPageModule);
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

/***/ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.scripts.ts":
/*!********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.scripts.ts ***!
  \********************************************************************************************************************/
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
 * @fileoverview Directive scripts for the topics and skills dashboard.
 */
// The module needs to be loaded before everything else since it defines the
// main module the elements are attached to.
__webpack_require__(/*! pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.module.ts */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.module.ts");
__webpack_require__(/*! App.ts */ "./core/templates/dev/head/App.ts");
__webpack_require__(/*! pages/topics-and-skills-dashboard-page/navbar/topics-and-skills-dashboard-navbar-breadcrumb.directive.ts */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/navbar/topics-and-skills-dashboard-navbar-breadcrumb.directive.ts");
__webpack_require__(/*! pages/topics-and-skills-dashboard-page/navbar/topics-and-skills-dashboard-navbar.directive.ts */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/navbar/topics-and-skills-dashboard-navbar.directive.ts");
__webpack_require__(/*! pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.controller.ts */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.controller.ts");


/***/ }),

/***/ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-list/topics-list.directive.ts":
/*!*************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-list/topics-list.directive.ts ***!
  \*************************************************************************************************************/
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
 * @fileoverview Controller for the topics list viewer.
 */
__webpack_require__(/*! domain/topic/EditableTopicBackendApiService.ts */ "./core/templates/dev/head/domain/topic/EditableTopicBackendApiService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants.ajs.ts */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants.ajs.ts");
angular.module('oppia').directive('topicsList', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {
                getTopicSummaries: '&topicSummaries',
                canDeleteTopic: '&userCanDeleteTopic',
                selectedTopicIds: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topics-and-skills-dashboard-page/topics-list/' +
                'topics-list.directive.html'),
            controller: [
                '$scope', '$uibModal', '$rootScope', 'EditableTopicBackendApiService',
                'AlertsService', 'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
                function ($scope, $uibModal, $rootScope, EditableTopicBackendApiService, AlertsService, EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED) {
                    // As additional stories are not supported initially, it's not
                    // being shown, for now.
                    $scope.TOPIC_HEADINGS = [
                        'name', 'subtopic_count', 'skill_count',
                        'canonical_story_count', 'topic_status'
                    ];
                    $scope.getTopicEditorUrl = function (topicId) {
                        return '/topic_editor/' + topicId;
                    };
                    $scope.selectTopic = function (topicId) {
                        if ($scope.selectedTopicIds) {
                            if ($scope.selectedTopicIds.indexOf(topicId) === -1) {
                                $scope.selectedTopicIds.push(topicId);
                            }
                        }
                    };
                    $scope.deleteTopic = function (topicId) {
                        var modalInstance = $uibModal.open({
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topics-and-skills-dashboard-page/templates/' +
                                'delete-topic-modal.template.html'),
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
                        modalInstance.result.then(function () {
                            EditableTopicBackendApiService.deleteTopic(topicId).then(function (status) {
                                $rootScope.$broadcast(EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED);
                            }, function (error) {
                                AlertsService.addWarning(error || 'There was an error when deleting the topic.');
                            });
                        });
                    };
                }
            ]
        };
    }
]);


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvYmFzZV9jb21wb25lbnRzL0Jhc2VDb250ZW50RGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2Jhc2VfY29tcG9uZW50cy9XYXJuaW5nTG9hZGVyRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2NvbW1vbi1lbGVtZW50cy9iYWNrZ3JvdW5kLWJhbm5lci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9lbnRpdHktY3JlYXRpb24tc2VydmljZXMvc2tpbGwtY3JlYXRpb24uc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2VudGl0eS1jcmVhdGlvbi1zZXJ2aWNlcy90b3BpYy1jcmVhdGlvbi5zZXJ2aWNlLnRzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvcnVicmljcy1lZGl0b3IvcnVicmljcy1lZGl0b3IuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9za2lsbC9FZGl0YWJsZVNraWxsQmFja2VuZEFwaVNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3NraWxsL1J1YnJpY09iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3NraWxsL3NraWxsLWRvbWFpbi5jb25zdGFudHMuYWpzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9za2lsbC9za2lsbC1kb21haW4uY29uc3RhbnRzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi90b3BpYy9FZGl0YWJsZVRvcGljQmFja2VuZEFwaVNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3RvcGljL3RvcGljLWRvbWFpbi5jb25zdGFudHMuYWpzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi90b3BpYy90b3BpYy1kb21haW4uY29uc3RhbnRzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi90b3BpY3NfYW5kX3NraWxsc19kYXNoYm9hcmQvVG9waWNzQW5kU2tpbGxzRGFzaGJvYXJkQmFja2VuZEFwaVNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3RvcGljc19hbmRfc2tpbGxzX2Rhc2hib2FyZC90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtZG9tYWluLmNvbnN0YW50cy5hanMudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3RvcGljc19hbmRfc2tpbGxzX2Rhc2hib2FyZC90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtZG9tYWluLmNvbnN0YW50cy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9maWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvbm9ybWFsaXplLXdoaXRlc3BhY2UuZmlsdGVyLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL09wcGlhRm9vdGVyRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3NraWxsLWVkaXRvci1wYWdlL3NraWxsLWVkaXRvci1wYWdlLmNvbnN0YW50cy5hanMudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvc2tpbGwtZWRpdG9yLXBhZ2Uvc2tpbGwtZWRpdG9yLXBhZ2UuY29uc3RhbnRzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlL25hdmJhci90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtbmF2YmFyLWJyZWFkY3J1bWIuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlL25hdmJhci90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtbmF2YmFyLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS9za2lsbHMtbGlzdC9za2lsbHMtbGlzdC5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvdG9waWMtc2VsZWN0b3IvdG9waWMtc2VsZWN0b3IuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLmNvbnN0YW50cy5hanMudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UuY29uc3RhbnRzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLmNvbnRyb2xsZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLnNjcmlwdHMudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvdG9waWNzLWxpc3QvdG9waWNzLWxpc3QuZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGdCQUFRLG9CQUFvQjtBQUM1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUFpQiw0QkFBNEI7QUFDN0M7QUFDQTtBQUNBLDBCQUFrQiwyQkFBMkI7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7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ImZpbGUiOiJ0b3BpY3NfYW5kX3NraWxsc19kYXNoYm9hcmQuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gaW5zdGFsbCBhIEpTT05QIGNhbGxiYWNrIGZvciBjaHVuayBsb2FkaW5nXG4gXHRmdW5jdGlvbiB3ZWJwYWNrSnNvbnBDYWxsYmFjayhkYXRhKSB7XG4gXHRcdHZhciBjaHVua0lkcyA9IGRhdGFbMF07XG4gXHRcdHZhciBtb3JlTW9kdWxlcyA9IGRhdGFbMV07XG4gXHRcdHZhciBleGVjdXRlTW9kdWxlcyA9IGRhdGFbMl07XG5cbiBcdFx0Ly8gYWRkIFwibW9yZU1vZHVsZXNcIiB0byB0aGUgbW9kdWxlcyBvYmplY3QsXG4gXHRcdC8vIHRoZW4gZmxhZyBhbGwgXCJjaHVua0lkc1wiIGFzIGxvYWRlZCBhbmQgZmlyZSBjYWxsYmFja1xuIFx0XHR2YXIgbW9kdWxlSWQsIGNodW5rSWQsIGkgPSAwLCByZXNvbHZlcyA9IFtdO1xuIFx0XHRmb3IoO2kgPCBjaHVua0lkcy5sZW5ndGg7IGkrKykge1xuIFx0XHRcdGNodW5rSWQgPSBjaHVua0lkc1tpXTtcbiBcdFx0XHRpZihpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0pIHtcbiBcdFx0XHRcdHJlc29sdmVzLnB1c2goaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdWzBdKTtcbiBcdFx0XHR9XG4gXHRcdFx0aW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdID0gMDtcbiBcdFx0fVxuIFx0XHRmb3IobW9kdWxlSWQgaW4gbW9yZU1vZHVsZXMpIHtcbiBcdFx0XHRpZihPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobW9yZU1vZHVsZXMsIG1vZHVsZUlkKSkge1xuIFx0XHRcdFx0bW9kdWxlc1ttb2R1bGVJZF0gPSBtb3JlTW9kdWxlc1ttb2R1bGVJZF07XG4gXHRcdFx0fVxuIFx0XHR9XG4gXHRcdGlmKHBhcmVudEpzb25wRnVuY3Rpb24pIHBhcmVudEpzb25wRnVuY3Rpb24oZGF0YSk7XG5cbiBcdFx0d2hpbGUocmVzb2x2ZXMubGVuZ3RoKSB7XG4gXHRcdFx0cmVzb2x2ZXMuc2hpZnQoKSgpO1xuIFx0XHR9XG5cbiBcdFx0Ly8gYWRkIGVudHJ5IG1vZHVsZXMgZnJvbSBsb2FkZWQgY2h1bmsgdG8gZGVmZXJyZWQgbGlzdFxuIFx0XHRkZWZlcnJlZE1vZHVsZXMucHVzaC5hcHBseShkZWZlcnJlZE1vZHVsZXMsIGV4ZWN1dGVNb2R1bGVzIHx8IFtdKTtcblxuIFx0XHQvLyBydW4gZGVmZXJyZWQgbW9kdWxlcyB3aGVuIGFsbCBjaHVua3MgcmVhZHlcbiBcdFx0cmV0dXJuIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCk7XG4gXHR9O1xuIFx0ZnVuY3Rpb24gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKSB7XG4gXHRcdHZhciByZXN1bHQ7XG4gXHRcdGZvcih2YXIgaSA9IDA7IGkgPCBkZWZlcnJlZE1vZHVsZXMubGVuZ3RoOyBpKyspIHtcbiBcdFx0XHR2YXIgZGVmZXJyZWRNb2R1bGUgPSBkZWZlcnJlZE1vZHVsZXNbaV07XG4gXHRcdFx0dmFyIGZ1bGZpbGxlZCA9IHRydWU7XG4gXHRcdFx0Zm9yKHZhciBqID0gMTsgaiA8IGRlZmVycmVkTW9kdWxlLmxlbmd0aDsgaisrKSB7XG4gXHRcdFx0XHR2YXIgZGVwSWQgPSBkZWZlcnJlZE1vZHVsZVtqXTtcbiBcdFx0XHRcdGlmKGluc3RhbGxlZENodW5rc1tkZXBJZF0gIT09IDApIGZ1bGZpbGxlZCA9IGZhbHNlO1xuIFx0XHRcdH1cbiBcdFx0XHRpZihmdWxmaWxsZWQpIHtcbiBcdFx0XHRcdGRlZmVycmVkTW9kdWxlcy5zcGxpY2UoaS0tLCAxKTtcbiBcdFx0XHRcdHJlc3VsdCA9IF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gZGVmZXJyZWRNb2R1bGVbMF0pO1xuIFx0XHRcdH1cbiBcdFx0fVxuXG4gXHRcdHJldHVybiByZXN1bHQ7XG4gXHR9XG5cbiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIG9iamVjdCB0byBzdG9yZSBsb2FkZWQgYW5kIGxvYWRpbmcgY2h1bmtzXG4gXHQvLyB1bmRlZmluZWQgPSBjaHVuayBub3QgbG9hZGVkLCBudWxsID0gY2h1bmsgcHJlbG9hZGVkL3ByZWZldGNoZWRcbiBcdC8vIFByb21pc2UgPSBjaHVuayBsb2FkaW5nLCAwID0gY2h1bmsgbG9hZGVkXG4gXHR2YXIgaW5zdGFsbGVkQ2h1bmtzID0ge1xuIFx0XHRcInRvcGljc19hbmRfc2tpbGxzX2Rhc2hib2FyZFwiOiAwXG4gXHR9O1xuXG4gXHR2YXIgZGVmZXJyZWRNb2R1bGVzID0gW107XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGdldHRlciB9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuIFx0XHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbiBcdFx0fVxuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuIFx0fTtcblxuIFx0Ly8gY3JlYXRlIGEgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XG4gXHQvLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbiBcdC8vIG1vZGUgJiAyOiBtZXJnZSBhbGwgcHJvcGVydGllcyBvZiB2YWx1ZSBpbnRvIHRoZSBuc1xuIFx0Ly8gbW9kZSAmIDQ6IHJldHVybiB2YWx1ZSB3aGVuIGFscmVhZHkgbnMgb2JqZWN0XG4gXHQvLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnQgPSBmdW5jdGlvbih2YWx1ZSwgbW9kZSkge1xuIFx0XHRpZihtb2RlICYgMSkgdmFsdWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKHZhbHVlKTtcbiBcdFx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcbiBcdFx0aWYoKG1vZGUgJiA0KSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmIHZhbHVlLl9fZXNNb2R1bGUpIHJldHVybiB2YWx1ZTtcbiBcdFx0dmFyIG5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG5zLCAnZGVmYXVsdCcsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHZhbHVlIH0pO1xuIFx0XHRpZihtb2RlICYgMiAmJiB0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIGZvcih2YXIga2V5IGluIHZhbHVlKSBfX3dlYnBhY2tfcmVxdWlyZV9fLmQobnMsIGtleSwgZnVuY3Rpb24oa2V5KSB7IHJldHVybiB2YWx1ZVtrZXldOyB9LmJpbmQobnVsbCwga2V5KSk7XG4gXHRcdHJldHVybiBucztcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdHZhciBqc29ucEFycmF5ID0gd2luZG93W1wid2VicGFja0pzb25wXCJdID0gd2luZG93W1wid2VicGFja0pzb25wXCJdIHx8IFtdO1xuIFx0dmFyIG9sZEpzb25wRnVuY3Rpb24gPSBqc29ucEFycmF5LnB1c2guYmluZChqc29ucEFycmF5KTtcbiBcdGpzb25wQXJyYXkucHVzaCA9IHdlYnBhY2tKc29ucENhbGxiYWNrO1xuIFx0anNvbnBBcnJheSA9IGpzb25wQXJyYXkuc2xpY2UoKTtcbiBcdGZvcih2YXIgaSA9IDA7IGkgPCBqc29ucEFycmF5Lmxlbmd0aDsgaSsrKSB3ZWJwYWNrSnNvbnBDYWxsYmFjayhqc29ucEFycmF5W2ldKTtcbiBcdHZhciBwYXJlbnRKc29ucEZ1bmN0aW9uID0gb2xkSnNvbnBGdW5jdGlvbjtcblxuXG4gXHQvLyBhZGQgZW50cnkgbW9kdWxlIHRvIGRlZmVycmVkIGxpc3RcbiBcdGRlZmVycmVkTW9kdWxlcy5wdXNoKFtcIi4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2Uuc2NyaXB0cy50c1wiLFwidmVuZG9yc35hYm91dH5hZG1pbn5jb2xsZWN0aW9uX2VkaXRvcn5jb2xsZWN0aW9uX3BsYXllcn5jb21tdW5pdHlfZGFzaGJvYXJkfmNvbnRhY3R+Y3JlYXRvcl9kYXNoYm9hcn43ODU2YzA1YVwiLFwiYWJvdXR+YWRtaW5+Y29sbGVjdGlvbl9lZGl0b3J+Y29sbGVjdGlvbl9wbGF5ZXJ+Y29tbXVuaXR5X2Rhc2hib2FyZH5jb250YWN0fmNyZWF0b3JfZGFzaGJvYXJkfmRvbmF0ZX5lMDZhNGExN1wiLFwiYWRtaW5+Y3JlYXRvcl9kYXNoYm9hcmR+ZXhwbG9yYXRpb25fZWRpdG9yfmV4cGxvcmF0aW9uX3BsYXllcn5tb2RlcmF0b3J+cHJhY3RpY2Vfc2Vzc2lvbn5yZXZpZXdfdGVzdH5iOTU4MGVkMFwiLFwiYWRtaW5+Y3JlYXRvcl9kYXNoYm9hcmR+ZXhwbG9yYXRpb25fZWRpdG9yfmV4cGxvcmF0aW9uX3BsYXllcn5tb2RlcmF0b3J+cHJhY3RpY2Vfc2Vzc2lvbn5yZXZpZXdfdGVzdH5kMzU5NTE1NVwiLFwiYWRtaW5+ZXhwbG9yYXRpb25fZWRpdG9yfmV4cGxvcmF0aW9uX3BsYXllcn5tb2RlcmF0b3J+cHJhY3RpY2Vfc2Vzc2lvbn5yZXZpZXdfdGVzdH5za2lsbF9lZGl0b3J+c3Rvcn43NzM0Y2RkYlwiLFwic3RvcnlfZWRpdG9yfnRvcGljc19hbmRfc2tpbGxzX2Rhc2hib2FyZFwiXSk7XG4gXHQvLyBydW4gZGVmZXJyZWQgbW9kdWxlcyB3aGVuIHJlYWR5XG4gXHRyZXR1cm4gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgQmFzZSBUcmFuc2NsdXNpb24gQ29tcG9uZW50LlxuICovXG5yZXF1aXJlKCdiYXNlX2NvbXBvbmVudHMvV2FybmluZ0xvYWRlckRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvT3BwaWFGb290ZXJEaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9zaWRlYmFyL1NpZGViYXJTdGF0dXNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL3N0YXRlZnVsL0JhY2tncm91bmRNYXNrU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdiYXNlQ29udGVudCcsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdHJhbnNjbHVkZToge1xuICAgICAgICAgICAgICAgIGJyZWFkY3J1bWI6ICc/bmF2YmFyQnJlYWRjcnVtYicsXG4gICAgICAgICAgICAgICAgY29udGVudDogJ2NvbnRlbnQnLFxuICAgICAgICAgICAgICAgIGZvb3RlcjogJz9wYWdlRm9vdGVyJyxcbiAgICAgICAgICAgICAgICBuYXZPcHRpb25zOiAnP25hdk9wdGlvbnMnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2Jhc2VfY29tcG9uZW50cy9iYXNlX2NvbnRlbnRfZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHJvb3RTY29wZScsICdCYWNrZ3JvdW5kTWFza1NlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdTaWRlYmFyU3RhdHVzU2VydmljZScsICdVcmxTZXJ2aWNlJywgJ1NJVEVfRkVFREJBQ0tfRk9STV9VUkwnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBCYWNrZ3JvdW5kTWFza1NlcnZpY2UsIFNpZGViYXJTdGF0dXNTZXJ2aWNlLCBVcmxTZXJ2aWNlLCBTSVRFX0ZFRURCQUNLX0ZPUk1fVVJMKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pZnJhbWVkID0gVXJsU2VydmljZS5pc0lmcmFtZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zaXRlRmVlZGJhY2tGb3JtVXJsID0gU0lURV9GRUVEQkFDS19GT1JNX1VSTDtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc1NpZGViYXJTaG93biA9IFNpZGViYXJTdGF0dXNTZXJ2aWNlLmlzU2lkZWJhclNob3duO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNsb3NlU2lkZWJhck9uU3dpcGUgPSBTaWRlYmFyU3RhdHVzU2VydmljZS5jbG9zZVNpZGViYXI7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaXNCYWNrZ3JvdW5kTWFza0FjdGl2ZSA9IEJhY2tncm91bmRNYXNrU2VydmljZS5pc01hc2tBY3RpdmU7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuREVWX01PREUgPSAkcm9vdFNjb3BlLkRFVl9NT0RFO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNraXBUb01haW5Db250ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1haW5Db250ZW50RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdvcHBpYS1tYWluLWNvbnRlbnQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbWFpbkNvbnRlbnRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1ZhcmlhYmxlIG1haW5Db250ZW50RWxlbWVudCBpcyB1bmRlZmluZWQuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBtYWluQ29udGVudEVsZW1lbnQudGFiSW5kZXggPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1haW5Db250ZW50RWxlbWVudC5zY3JvbGxJbnRvVmlldygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFpbkNvbnRlbnRFbGVtZW50LmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHdhcm5pbmdfbG9hZGVyLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3dhcm5pbmdMb2FkZXInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2Jhc2VfY29tcG9uZW50cy93YXJuaW5nX2xvYWRlcl9kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWydBbGVydHNTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoQWxlcnRzU2VydmljZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuQWxlcnRzU2VydmljZSA9IEFsZXJ0c1NlcnZpY2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBiYWNrZ3JvdW5kIGJhbm5lci5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdiYWNrZ3JvdW5kQmFubmVyJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvY29tbW9uLWVsZW1lbnRzLycgK1xuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWJhbm5lci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcG9zc2libGVCYW5uZXJGaWxlbmFtZXMgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAnYmFubmVyQS5zdmcnLCAnYmFubmVyQi5zdmcnLCAnYmFubmVyQy5zdmcnLCAnYmFubmVyRC5zdmcnXG4gICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgIHZhciBiYW5uZXJJbWFnZUZpbGVuYW1lID0gcG9zc2libGVCYW5uZXJGaWxlbmFtZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcG9zc2libGVCYW5uZXJGaWxlbmFtZXMubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuYmFubmVySW1hZ2VGaWxlVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmwoJy9iYWNrZ3JvdW5kLycgKyBiYW5uZXJJbWFnZUZpbGVuYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZ1bmN0aW9uYWxpdHkgZm9yIGNyZWF0aW5nIGEgbmV3IHNraWxsLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdTa2lsbENyZWF0aW9uU2VydmljZScsIFtcbiAgICAnJGh0dHAnLCAnJHJvb3RTY29wZScsICckdGltZW91dCcsICckd2luZG93JywgJ0FsZXJ0c1NlcnZpY2UnLFxuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkcm9vdFNjb3BlLCAkdGltZW91dCwgJHdpbmRvdywgQWxlcnRzU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgdmFyIENSRUFURV9ORVdfU0tJTExfVVJMX1RFTVBMQVRFID0gKCcvc2tpbGxfZWRpdG9yLzxza2lsbF9pZD4nKTtcbiAgICAgICAgdmFyIHNraWxsQ3JlYXRpb25JblByb2dyZXNzID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjcmVhdGVOZXdTa2lsbDogZnVuY3Rpb24gKGRlc2NyaXB0aW9uLCBydWJyaWNzLCBsaW5rZWRUb3BpY0lkcykge1xuICAgICAgICAgICAgICAgIGlmIChza2lsbENyZWF0aW9uSW5Qcm9ncmVzcykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGlkeCBpbiBydWJyaWNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1YnJpY3NbaWR4XSA9IHJ1YnJpY3NbaWR4XS50b0JhY2tlbmREaWN0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNraWxsQ3JlYXRpb25JblByb2dyZXNzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmNsZWFyV2FybmluZ3MoKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdNZXNzYWdlID0gJ0NyZWF0aW5nIHNraWxsJztcbiAgICAgICAgICAgICAgICAkaHR0cC5wb3N0KCcvc2tpbGxfZWRpdG9yX2hhbmRsZXIvY3JlYXRlX25ldycsIHtcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgICAgICBsaW5rZWRfdG9waWNfaWRzOiBsaW5rZWRUb3BpY0lkcyxcbiAgICAgICAgICAgICAgICAgICAgcnVicmljczogcnVicmljc1xuICAgICAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICR3aW5kb3cubG9jYXRpb24gPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChDUkVBVEVfTkVXX1NLSUxMX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNraWxsX2lkOiByZXNwb25zZS5kYXRhLnNraWxsSWRcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9LCAxNTApO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2RhbCBhbmQgZnVuY3Rpb25hbGl0eSBmb3IgdGhlIGNyZWF0ZSB0b3BpYyBidXR0b24uXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1RvcGljQ3JlYXRpb25TZXJ2aWNlJywgW1xuICAgICckaHR0cCcsICckcm9vdFNjb3BlJywgJyR0aW1lb3V0JywgJyR1aWJNb2RhbCcsICckd2luZG93JywgJ0FsZXJ0c1NlcnZpY2UnLFxuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkcm9vdFNjb3BlLCAkdGltZW91dCwgJHVpYk1vZGFsLCAkd2luZG93LCBBbGVydHNTZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICB2YXIgVE9QSUNfRURJVE9SX1VSTF9URU1QTEFURSA9ICcvdG9waWNfZWRpdG9yLzx0b3BpY19pZD4nO1xuICAgICAgICB2YXIgdG9waWNDcmVhdGlvbkluUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNyZWF0ZU5ld1RvcGljOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRvcGljQ3JlYXRpb25JblByb2dyZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIG1vZGFsSW5zdGFuY2UgPSAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlL3RlbXBsYXRlcy8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICduZXctdG9waWMtbmFtZS1lZGl0b3IudGVtcGxhdGUuaHRtbCcpLFxuICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkdWliTW9kYWxJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS50b3BpY05hbWUgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNUb3BpY05hbWVFbXB0eSA9IGZ1bmN0aW9uICh0b3BpY05hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICh0b3BpY05hbWUgPT09ICcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zYXZlID0gZnVuY3Rpb24gKHRvcGljTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5jbG9zZSh0b3BpY05hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNhbmNlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIG1vZGFsSW5zdGFuY2UucmVzdWx0LnRoZW4oZnVuY3Rpb24gKHRvcGljTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodG9waWNOYW1lID09PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RvcGljIG5hbWUgY2Fubm90IGJlIGVtcHR5Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdG9waWNDcmVhdGlvbkluUHJvZ3Jlc3MgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmNsZWFyV2FybmluZ3MoKTtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICdDcmVhdGluZyB0b3BpYyc7XG4gICAgICAgICAgICAgICAgICAgICRodHRwLnBvc3QoJy90b3BpY19lZGl0b3JfaGFuZGxlci9jcmVhdGVfbmV3JywgeyBuYW1lOiB0b3BpY05hbWUgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR3aW5kb3cubG9jYXRpb24gPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChUT1BJQ19FRElUT1JfVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcGljX2lkOiByZXNwb25zZS5kYXRhLnRvcGljSWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIDE1MCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ01lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIHJ1YnJpYyBlZGl0b3IgZm9yIHNraWxscy5cbiAqL1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9zY2hlbWEtYmFzZWQtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3NraWxsL1J1YnJpY09iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvY2stZWRpdG9yLWhlbHBlcnMvY2stZWRpdG9yLTQtcnRlLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9jay1lZGl0b3ItaGVscGVycy9jay1lZGl0b3ItNC13aWRnZXRzLmluaXRpYWxpemVyLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2N1c3RvbS1mb3Jtcy1kaXJlY3RpdmVzL2ltYWdlLXVwbG9hZGVyLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZGlyZWN0aXZlcy9tYXRoamF4LWJpbmQuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdmaWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvbm9ybWFsaXplLXdoaXRlc3BhY2UuZmlsdGVyLnRzJyk7XG5yZXF1aXJlKCdvYmplY3RzL29iamVjdENvbXBvbmVudHNSZXF1aXJlcy50cycpO1xucmVxdWlyZSgnZGlyZWN0aXZlcy9hbmd1bGFyLWh0bWwtYmluZC5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3NraWxsLWVkaXRvci1wYWdlL3NraWxsLWVkaXRvci1wYWdlLmNvbnN0YW50cy5hanMudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgncnVicmljc0VkaXRvcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICAvLyBUaGUgcnVicmljcyBwYXJhbWV0ZXIgcGFzc2VkIGluIHNob3VsZCBoYXZlIHRoZSAzIGRpZmZpY3VsdGllc1xuICAgICAgICAgICAgLy8gaW5pdGlhbGl6ZWQuXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7XG4gICAgICAgICAgICAgICAgZ2V0UnVicmljczogJyZydWJyaWNzJyxcbiAgICAgICAgICAgICAgICBvblNhdmVSdWJyaWM6ICc9J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvcnVicmljcy1lZGl0b3IvcnVicmljcy1lZGl0b3IuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyRmaWx0ZXInLCAnJHVpYk1vZGFsJywgJyRyb290U2NvcGUnLFxuICAgICAgICAgICAgICAgICdSdWJyaWNPYmplY3RGYWN0b3J5JywgJ0VWRU5UX1NLSUxMX1JFSU5JVElBTElaRUQnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICRmaWx0ZXIsICR1aWJNb2RhbCwgJHJvb3RTY29wZSwgUnVicmljT2JqZWN0RmFjdG9yeSwgRVZFTlRfU0tJTExfUkVJTklUSUFMSVpFRCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuYWN0aXZlUnVicmljSW5kZXggPSAwO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmV4cGxhbmF0aW9uRWRpdG9ySXNPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHZhciBleHBsYW5hdGlvbk1lbWVudG8gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlzRWRpdGFibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zZXRBY3RpdmVEaWZmaWN1bHR5SW5kZXggPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuYWN0aXZlUnVicmljSW5kZXggPSBpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5vcGVuRXhwbGFuYXRpb25FZGl0b3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBleHBsYW5hdGlvbk1lbWVudG8gPSBhbmd1bGFyLmNvcHkoY3RybC5nZXRSdWJyaWNzKClbY3RybC5hY3RpdmVSdWJyaWNJbmRleF0uZ2V0RXhwbGFuYXRpb24oKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmVkaXRhYmxlRXhwbGFuYXRpb24gPSBleHBsYW5hdGlvbk1lbWVudG87XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmV4cGxhbmF0aW9uRWRpdG9ySXNPcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5FWFBMQU5BVElPTl9GT1JNX1NDSEVNQSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdodG1sJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVpX2NvbmZpZzoge31cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zYXZlRXhwbGFuYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmV4cGxhbmF0aW9uRWRpdG9ySXNPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXhwbGFuYXRpb25IYXNDaGFuZ2VkID0gKGN0cmwuZWRpdGFibGVFeHBsYW5hdGlvbiAhPT1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmdldFJ1YnJpY3MoKVtjdHJsLmFjdGl2ZVJ1YnJpY0luZGV4XS5nZXRFeHBsYW5hdGlvbigpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleHBsYW5hdGlvbkhhc0NoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLm9uU2F2ZVJ1YnJpYyhjdHJsLmdldFJ1YnJpY3MoKVtjdHJsLmFjdGl2ZVJ1YnJpY0luZGV4XS5nZXREaWZmaWN1bHR5KCksIGN0cmwuZWRpdGFibGVFeHBsYW5hdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwbGFuYXRpb25NZW1lbnRvID0gY3RybC5lZGl0YWJsZUV4cGxhbmF0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNhbmNlbEVkaXRFeHBsYW5hdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuZWRpdGFibGVFeHBsYW5hdGlvbiA9IGV4cGxhbmF0aW9uTWVtZW50bztcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuZXhwbGFuYXRpb25FZGl0b3JJc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdG8gc2VuZCBjaGFuZ2VzIHRvIGEgc2tpbGwgdG8gdGhlIGJhY2tlbmQuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9za2lsbC9za2lsbC1kb21haW4uY29uc3RhbnRzLmFqcy50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnRWRpdGFibGVTa2lsbEJhY2tlbmRBcGlTZXJ2aWNlJywgW1xuICAgICckaHR0cCcsICckcScsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgJ0VESVRBQkxFX1NLSUxMX0RBVEFfVVJMX1RFTVBMQVRFJywgJ1NLSUxMX0RBVEFfVVJMX1RFTVBMQVRFJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsICRxLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgRURJVEFCTEVfU0tJTExfREFUQV9VUkxfVEVNUExBVEUsIFNLSUxMX0RBVEFfVVJMX1RFTVBMQVRFKSB7XG4gICAgICAgIHZhciBfZmV0Y2hTa2lsbCA9IGZ1bmN0aW9uIChza2lsbElkLCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBza2lsbERhdGFVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChFRElUQUJMRV9TS0lMTF9EQVRBX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgIHNraWxsX2lkOiBza2lsbElkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICRodHRwLmdldChza2lsbERhdGFVcmwpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNraWxsID0gYW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEuc2tpbGwpO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHNraWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3JSZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9mZXRjaE11bHRpU2tpbGxzID0gZnVuY3Rpb24gKHNraWxsSWRzLCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBza2lsbERhdGFVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChTS0lMTF9EQVRBX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgIGNvbW1hX3NlcGFyYXRlZF9za2lsbF9pZHM6IHNraWxsSWRzLmpvaW4oJywnKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkaHR0cC5nZXQoc2tpbGxEYXRhVXJsKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHZhciBza2lsbHMgPSBhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YS5za2lsbHMpO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHNraWxscyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrKGVycm9yUmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfdXBkYXRlU2tpbGwgPSBmdW5jdGlvbiAoc2tpbGxJZCwgc2tpbGxWZXJzaW9uLCBjb21taXRNZXNzYWdlLCBjaGFuZ2VMaXN0LCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBlZGl0YWJsZVNraWxsRGF0YVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKEVESVRBQkxFX1NLSUxMX0RBVEFfVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgc2tpbGxfaWQ6IHNraWxsSWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIHB1dERhdGEgPSB7XG4gICAgICAgICAgICAgICAgdmVyc2lvbjogc2tpbGxWZXJzaW9uLFxuICAgICAgICAgICAgICAgIGNvbW1pdF9tZXNzYWdlOiBjb21taXRNZXNzYWdlLFxuICAgICAgICAgICAgICAgIGNoYW5nZV9kaWN0czogY2hhbmdlTGlzdFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICRodHRwLnB1dChlZGl0YWJsZVNraWxsRGF0YVVybCwgcHV0RGF0YSkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGUgcmV0dXJuZWQgZGF0YSBpcyBhbiB1cGRhdGVkIHNraWxsIGRpY3QuXG4gICAgICAgICAgICAgICAgdmFyIHNraWxsID0gYW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEuc2tpbGwpO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHNraWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3JSZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9kZWxldGVTa2lsbCA9IGZ1bmN0aW9uIChza2lsbElkLCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBza2lsbERhdGFVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChFRElUQUJMRV9TS0lMTF9EQVRBX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgIHNraWxsX2lkOiBza2lsbElkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICRodHRwWydkZWxldGUnXShza2lsbERhdGFVcmwpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2Uuc3RhdHVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3JSZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZldGNoU2tpbGw6IGZ1bmN0aW9uIChza2lsbElkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgX2ZldGNoU2tpbGwoc2tpbGxJZCwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZXRjaE11bHRpU2tpbGxzOiBmdW5jdGlvbiAoc2tpbGxJZHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfZmV0Y2hNdWx0aVNraWxscyhza2lsbElkcywgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1cGRhdGVTa2lsbDogZnVuY3Rpb24gKHNraWxsSWQsIHNraWxsVmVyc2lvbiwgY29tbWl0TWVzc2FnZSwgY2hhbmdlTGlzdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF91cGRhdGVTa2lsbChza2lsbElkLCBza2lsbFZlcnNpb24sIGNvbW1pdE1lc3NhZ2UsIGNoYW5nZUxpc3QsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVsZXRlU2tpbGw6IGZ1bmN0aW9uIChza2lsbElkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgX2RlbGV0ZVNraWxsKHNraWxsSWQsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE9iamVjdCBmYWN0b3J5IGZvciBjcmVhdGluZyBmcm9udGVuZCBpbnN0YW5jZXMgb2ZcbiAqIHJ1YnJpY3MuXG4gKi9cbnZhciBjb3JlXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29yZVwiKTtcbnZhciBzdGF0aWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBSdWJyaWMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUnVicmljKGRpZmZpY3VsdHksIGV4cGxhbmF0aW9uKSB7XG4gICAgICAgIHRoaXMuX2RpZmZpY3VsdHkgPSBkaWZmaWN1bHR5O1xuICAgICAgICB0aGlzLl9leHBsYW5hdGlvbiA9IGV4cGxhbmF0aW9uO1xuICAgIH1cbiAgICBSdWJyaWMucHJvdG90eXBlLnRvQmFja2VuZERpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkaWZmaWN1bHR5OiB0aGlzLl9kaWZmaWN1bHR5LFxuICAgICAgICAgICAgZXhwbGFuYXRpb246IHRoaXMuX2V4cGxhbmF0aW9uXG4gICAgICAgIH07XG4gICAgfTtcbiAgICBSdWJyaWMucHJvdG90eXBlLmdldERpZmZpY3VsdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kaWZmaWN1bHR5O1xuICAgIH07XG4gICAgUnVicmljLnByb3RvdHlwZS5nZXRFeHBsYW5hdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2V4cGxhbmF0aW9uO1xuICAgIH07XG4gICAgUnVicmljLnByb3RvdHlwZS5zZXRFeHBsYW5hdGlvbiA9IGZ1bmN0aW9uIChuZXdFeHBsYW5hdGlvbikge1xuICAgICAgICB0aGlzLl9leHBsYW5hdGlvbiA9IG5ld0V4cGxhbmF0aW9uO1xuICAgIH07XG4gICAgcmV0dXJuIFJ1YnJpYztcbn0oKSk7XG5leHBvcnRzLlJ1YnJpYyA9IFJ1YnJpYztcbnZhciBSdWJyaWNPYmplY3RGYWN0b3J5ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFJ1YnJpY09iamVjdEZhY3RvcnkoKSB7XG4gICAgfVxuICAgIFJ1YnJpY09iamVjdEZhY3RvcnkucHJvdG90eXBlLmNyZWF0ZUZyb21CYWNrZW5kRGljdCA9IGZ1bmN0aW9uIChydWJyaWNCYWNrZW5kRGljdCkge1xuICAgICAgICByZXR1cm4gbmV3IFJ1YnJpYyhydWJyaWNCYWNrZW5kRGljdC5kaWZmaWN1bHR5LCBydWJyaWNCYWNrZW5kRGljdC5leHBsYW5hdGlvbik7XG4gICAgfTtcbiAgICBSdWJyaWNPYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiAoZGlmZmljdWx0eSwgZXhwbGFuYXRpb24pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSdWJyaWMoZGlmZmljdWx0eSwgZXhwbGFuYXRpb24pO1xuICAgIH07XG4gICAgUnVicmljT2JqZWN0RmFjdG9yeSA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuSW5qZWN0YWJsZSh7XG4gICAgICAgICAgICBwcm92aWRlZEluOiAncm9vdCdcbiAgICAgICAgfSlcbiAgICBdLCBSdWJyaWNPYmplY3RGYWN0b3J5KTtcbiAgICByZXR1cm4gUnVicmljT2JqZWN0RmFjdG9yeTtcbn0oKSk7XG5leHBvcnRzLlJ1YnJpY09iamVjdEZhY3RvcnkgPSBSdWJyaWNPYmplY3RGYWN0b3J5O1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnUnVicmljT2JqZWN0RmFjdG9yeScsIHN0YXRpY18xLmRvd25ncmFkZUluamVjdGFibGUoUnVicmljT2JqZWN0RmFjdG9yeSkpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBDb25zdGFudHMgZm9yIHNraWxsIGRvbWFpbi5cbiAqL1xuLy8gVE9ETygjNzA5Mik6IERlbGV0ZSB0aGlzIGZpbGUgb25jZSBtaWdyYXRpb24gaXMgY29tcGxldGUgYW5kIHRoZXNlIEFuZ3VsYXJKU1xuLy8gZXF1aXZhbGVudHMgb2YgdGhlIEFuZ3VsYXIgY29uc3RhbnRzIGFyZSBubyBsb25nZXIgbmVlZGVkLlxudmFyIHNraWxsX2RvbWFpbl9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJkb21haW4vc2tpbGwvc2tpbGwtZG9tYWluLmNvbnN0YW50c1wiKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdDT05DRVBUX0NBUkRfREFUQV9VUkxfVEVNUExBVEUnLCBza2lsbF9kb21haW5fY29uc3RhbnRzXzEuU2tpbGxEb21haW5Db25zdGFudHMuQ09OQ0VQVF9DQVJEX0RBVEFfVVJMX1RFTVBMQVRFKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdFRElUQUJMRV9TS0lMTF9EQVRBX1VSTF9URU1QTEFURScsIHNraWxsX2RvbWFpbl9jb25zdGFudHNfMS5Ta2lsbERvbWFpbkNvbnN0YW50cy5FRElUQUJMRV9TS0lMTF9EQVRBX1VSTF9URU1QTEFURSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnU0tJTExfREFUQV9VUkxfVEVNUExBVEUnLCBza2lsbF9kb21haW5fY29uc3RhbnRzXzEuU2tpbGxEb21haW5Db25zdGFudHMuU0tJTExfREFUQV9VUkxfVEVNUExBVEUpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1NLSUxMX0VESVRPUl9RVUVTVElPTl9VUkxfVEVNUExBVEUnLCBza2lsbF9kb21haW5fY29uc3RhbnRzXzEuU2tpbGxEb21haW5Db25zdGFudHMuU0tJTExfRURJVE9SX1FVRVNUSU9OX1VSTF9URU1QTEFURSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnU0tJTExfTUFTVEVSWV9EQVRBX1VSTF9URU1QTEFURScsIHNraWxsX2RvbWFpbl9jb25zdGFudHNfMS5Ta2lsbERvbWFpbkNvbnN0YW50cy5TS0lMTF9NQVNURVJZX0RBVEFfVVJMX1RFTVBMQVRFKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdTS0lMTF9QUk9QRVJUWV9ERVNDUklQVElPTicsIHNraWxsX2RvbWFpbl9jb25zdGFudHNfMS5Ta2lsbERvbWFpbkNvbnN0YW50cy5TS0lMTF9QUk9QRVJUWV9ERVNDUklQVElPTik7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnU0tJTExfUFJPUEVSVFlfTEFOR1VBR0VfQ09ERScsIHNraWxsX2RvbWFpbl9jb25zdGFudHNfMS5Ta2lsbERvbWFpbkNvbnN0YW50cy5TS0lMTF9QUk9QRVJUWV9MQU5HVUFHRV9DT0RFKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdTS0lMTF9DT05URU5UU19QUk9QRVJUWV9FWFBMQU5BVElPTicsIHNraWxsX2RvbWFpbl9jb25zdGFudHNfMS5Ta2lsbERvbWFpbkNvbnN0YW50cy5TS0lMTF9DT05URU5UU19QUk9QRVJUWV9FWFBMQU5BVElPTik7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnU0tJTExfQ09OVEVOVFNfUFJPUEVSVFlfV09SS0VEX0VYQU1QTEVTJywgc2tpbGxfZG9tYWluX2NvbnN0YW50c18xLlNraWxsRG9tYWluQ29uc3RhbnRzLlNLSUxMX0NPTlRFTlRTX1BST1BFUlRZX1dPUktFRF9FWEFNUExFUyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnU0tJTExfTUlTQ09OQ0VQVElPTlNfUFJPUEVSVFlfTkFNRScsIHNraWxsX2RvbWFpbl9jb25zdGFudHNfMS5Ta2lsbERvbWFpbkNvbnN0YW50cy5TS0lMTF9NSVNDT05DRVBUSU9OU19QUk9QRVJUWV9OQU1FKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdTS0lMTF9NSVNDT05DRVBUSU9OU19QUk9QRVJUWV9OT1RFUycsIHNraWxsX2RvbWFpbl9jb25zdGFudHNfMS5Ta2lsbERvbWFpbkNvbnN0YW50cy5TS0lMTF9NSVNDT05DRVBUSU9OU19QUk9QRVJUWV9OT1RFUyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnU0tJTExfTUlTQ09OQ0VQVElPTlNfUFJPUEVSVFlfRkVFREJBQ0snLCBza2lsbF9kb21haW5fY29uc3RhbnRzXzEuU2tpbGxEb21haW5Db25zdGFudHMuU0tJTExfTUlTQ09OQ0VQVElPTlNfUFJPUEVSVFlfRkVFREJBQ0spO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NNRF9VUERBVEVfU0tJTExfUFJPUEVSVFknLCBza2lsbF9kb21haW5fY29uc3RhbnRzXzEuU2tpbGxEb21haW5Db25zdGFudHMuQ01EX1VQREFURV9TS0lMTF9QUk9QRVJUWSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnQ01EX1VQREFURV9TS0lMTF9DT05URU5UU19QUk9QRVJUWScsIHNraWxsX2RvbWFpbl9jb25zdGFudHNfMS5Ta2lsbERvbWFpbkNvbnN0YW50cy5DTURfVVBEQVRFX1NLSUxMX0NPTlRFTlRTX1BST1BFUlRZKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdDTURfVVBEQVRFX1NLSUxMX01JU0NPTkNFUFRJT05TX1BST1BFUlRZJywgc2tpbGxfZG9tYWluX2NvbnN0YW50c18xLlNraWxsRG9tYWluQ29uc3RhbnRzLkNNRF9VUERBVEVfU0tJTExfTUlTQ09OQ0VQVElPTlNfUFJPUEVSVFkpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NNRF9BRERfU0tJTExfTUlTQ09OQ0VQVElPTicsIHNraWxsX2RvbWFpbl9jb25zdGFudHNfMS5Ta2lsbERvbWFpbkNvbnN0YW50cy5DTURfQUREX1NLSUxMX01JU0NPTkNFUFRJT04pO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NNRF9ERUxFVEVfU0tJTExfTUlTQ09OQ0VQVElPTicsIHNraWxsX2RvbWFpbl9jb25zdGFudHNfMS5Ta2lsbERvbWFpbkNvbnN0YW50cy5DTURfREVMRVRFX1NLSUxMX01JU0NPTkNFUFRJT04pO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NNRF9VUERBVEVfUlVCUklDUycsIHNraWxsX2RvbWFpbl9jb25zdGFudHNfMS5Ta2lsbERvbWFpbkNvbnN0YW50cy5DTURfVVBEQVRFX1JVQlJJQ1MpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBDb25zdGFudHMgZm9yIHNraWxsIGRvbWFpbi5cbiAqL1xudmFyIFNraWxsRG9tYWluQ29uc3RhbnRzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFNraWxsRG9tYWluQ29uc3RhbnRzKCkge1xuICAgIH1cbiAgICBTa2lsbERvbWFpbkNvbnN0YW50cy5DT05DRVBUX0NBUkRfREFUQV9VUkxfVEVNUExBVEUgPSAnL2NvbmNlcHRfY2FyZF9oYW5kbGVyLzxjb21tYV9zZXBhcmF0ZWRfc2tpbGxfaWRzPic7XG4gICAgU2tpbGxEb21haW5Db25zdGFudHMuRURJVEFCTEVfU0tJTExfREFUQV9VUkxfVEVNUExBVEUgPSAnL3NraWxsX2VkaXRvcl9oYW5kbGVyL2RhdGEvPHNraWxsX2lkPic7XG4gICAgU2tpbGxEb21haW5Db25zdGFudHMuU0tJTExfREFUQV9VUkxfVEVNUExBVEUgPSAnL3NraWxsX2RhdGFfaGFuZGxlci88Y29tbWFfc2VwYXJhdGVkX3NraWxsX2lkcz4nO1xuICAgIFNraWxsRG9tYWluQ29uc3RhbnRzLlNLSUxMX0VESVRPUl9RVUVTVElPTl9VUkxfVEVNUExBVEUgPSAnL3NraWxsX2VkaXRvcl9xdWVzdGlvbl9oYW5kbGVyLzxza2lsbF9pZD4/Y3Vyc29yPTxjdXJzb3I+JztcbiAgICBTa2lsbERvbWFpbkNvbnN0YW50cy5TS0lMTF9NQVNURVJZX0RBVEFfVVJMX1RFTVBMQVRFID0gJy9za2lsbF9tYXN0ZXJ5X2hhbmRsZXIvZGF0YSc7XG4gICAgU2tpbGxEb21haW5Db25zdGFudHMuU0tJTExfUFJPUEVSVFlfREVTQ1JJUFRJT04gPSAnZGVzY3JpcHRpb24nO1xuICAgIFNraWxsRG9tYWluQ29uc3RhbnRzLlNLSUxMX1BST1BFUlRZX0xBTkdVQUdFX0NPREUgPSAnbGFuZ3VhZ2VfY29kZSc7XG4gICAgU2tpbGxEb21haW5Db25zdGFudHMuU0tJTExfQ09OVEVOVFNfUFJPUEVSVFlfRVhQTEFOQVRJT04gPSAnZXhwbGFuYXRpb24nO1xuICAgIFNraWxsRG9tYWluQ29uc3RhbnRzLlNLSUxMX0NPTlRFTlRTX1BST1BFUlRZX1dPUktFRF9FWEFNUExFUyA9ICd3b3JrZWRfZXhhbXBsZXMnO1xuICAgIFNraWxsRG9tYWluQ29uc3RhbnRzLlNLSUxMX01JU0NPTkNFUFRJT05TX1BST1BFUlRZX05BTUUgPSAnbmFtZSc7XG4gICAgU2tpbGxEb21haW5Db25zdGFudHMuU0tJTExfTUlTQ09OQ0VQVElPTlNfUFJPUEVSVFlfTk9URVMgPSAnbm90ZXMnO1xuICAgIFNraWxsRG9tYWluQ29uc3RhbnRzLlNLSUxMX01JU0NPTkNFUFRJT05TX1BST1BFUlRZX0ZFRURCQUNLID0gJ2ZlZWRiYWNrJztcbiAgICBTa2lsbERvbWFpbkNvbnN0YW50cy5DTURfVVBEQVRFX1NLSUxMX1BST1BFUlRZID0gJ3VwZGF0ZV9za2lsbF9wcm9wZXJ0eSc7XG4gICAgU2tpbGxEb21haW5Db25zdGFudHMuQ01EX1VQREFURV9TS0lMTF9DT05URU5UU19QUk9QRVJUWSA9ICd1cGRhdGVfc2tpbGxfY29udGVudHNfcHJvcGVydHknO1xuICAgIFNraWxsRG9tYWluQ29uc3RhbnRzLkNNRF9VUERBVEVfU0tJTExfTUlTQ09OQ0VQVElPTlNfUFJPUEVSVFkgPSAndXBkYXRlX3NraWxsX21pc2NvbmNlcHRpb25zX3Byb3BlcnR5JztcbiAgICBTa2lsbERvbWFpbkNvbnN0YW50cy5DTURfQUREX1NLSUxMX01JU0NPTkNFUFRJT04gPSAnYWRkX3NraWxsX21pc2NvbmNlcHRpb24nO1xuICAgIFNraWxsRG9tYWluQ29uc3RhbnRzLkNNRF9ERUxFVEVfU0tJTExfTUlTQ09OQ0VQVElPTiA9ICdkZWxldGVfc2tpbGxfbWlzY29uY2VwdGlvbic7XG4gICAgU2tpbGxEb21haW5Db25zdGFudHMuQ01EX1VQREFURV9SVUJSSUNTID0gJ3VwZGF0ZV9ydWJyaWNzJztcbiAgICByZXR1cm4gU2tpbGxEb21haW5Db25zdGFudHM7XG59KCkpO1xuZXhwb3J0cy5Ta2lsbERvbWFpbkNvbnN0YW50cyA9IFNraWxsRG9tYWluQ29uc3RhbnRzO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIHNlbmQgY2hhbmdlcyB0byBhIHRvcGljIHRvIHRoZSBiYWNrZW5kLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdG9waWMvdG9waWMtZG9tYWluLmNvbnN0YW50cy5hanMudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0VkaXRhYmxlVG9waWNCYWNrZW5kQXBpU2VydmljZScsIFtcbiAgICAnJGh0dHAnLCAnJHEnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgICdFRElUQUJMRV9UT1BJQ19EQVRBX1VSTF9URU1QTEFURScsICdTVUJUT1BJQ19QQUdFX0VESVRPUl9EQVRBX1VSTF9URU1QTEFURScsXG4gICAgJ1RPUElDX0VESVRPUl9TVE9SWV9VUkxfVEVNUExBVEUnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJHEsIFVybEludGVycG9sYXRpb25TZXJ2aWNlLCBFRElUQUJMRV9UT1BJQ19EQVRBX1VSTF9URU1QTEFURSwgU1VCVE9QSUNfUEFHRV9FRElUT1JfREFUQV9VUkxfVEVNUExBVEUsIFRPUElDX0VESVRPUl9TVE9SWV9VUkxfVEVNUExBVEUpIHtcbiAgICAgICAgdmFyIF9mZXRjaFRvcGljID0gZnVuY3Rpb24gKHRvcGljSWQsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIHRvcGljRGF0YVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKEVESVRBQkxFX1RPUElDX0RBVEFfVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgdG9waWNfaWQ6IHRvcGljSWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGh0dHAuZ2V0KHRvcGljRGF0YVVybCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSByZXNwb25zZSBpcyBwYXNzZWQgYXMgYSBkaWN0IHdpdGggMiBmaWVsZHMgYW5kIG5vdCBhcyAyXG4gICAgICAgICAgICAgICAgICAgIC8vIHBhcmFtZXRlcnMsIGJlY2F1c2UgdGhlIHN1Y2Nlc3NDYWxsYmFjayBpcyBjYWxsZWQgYXMgdGhlIHJlc29sdmVcbiAgICAgICAgICAgICAgICAgICAgLy8gY2FsbGJhY2sgZnVuY3Rpb24gaW4gJHEgaW4gZmV0Y2hUb3BpYygpLCBhbmQgYWNjb3JkaW5nIHRvIGl0c1xuICAgICAgICAgICAgICAgICAgICAvLyBkb2N1bWVudGF0aW9uIChodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmcvc2VydmljZS8kcSksXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlc29sdmUgb3IgcmVqZWN0IGNhbiBoYXZlIG9ubHkgYSBzaW5nbGUgcGFyYW1ldGVyLlxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soe1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9waWNEaWN0OiBhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YS50b3BpY19kaWN0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNraWxsSWRUb0Rlc2NyaXB0aW9uRGljdDogYW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEuc2tpbGxfaWRfdG9fZGVzY3JpcHRpb25fZGljdClcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrKGVycm9yUmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfZmV0Y2hTdG9yaWVzID0gZnVuY3Rpb24gKHRvcGljSWQsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIHN0b3JpZXNEYXRhVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoVE9QSUNfRURJVE9SX1NUT1JZX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgIHRvcGljX2lkOiB0b3BpY0lkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICRodHRwLmdldChzdG9yaWVzRGF0YVVybCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2Fub25pY2FsU3RvcnlTdW1tYXJpZXMgPSBhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YS5jYW5vbmljYWxfc3Rvcnlfc3VtbWFyeV9kaWN0cyk7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soY2Fub25pY2FsU3RvcnlTdW1tYXJpZXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvclJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2ZldGNoU3VidG9waWNQYWdlID0gZnVuY3Rpb24gKHRvcGljSWQsIHN1YnRvcGljSWQsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIHN1YnRvcGljUGFnZURhdGFVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChTVUJUT1BJQ19QQUdFX0VESVRPUl9EQVRBX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgIHRvcGljX2lkOiB0b3BpY0lkLFxuICAgICAgICAgICAgICAgIHN1YnRvcGljX2lkOiBzdWJ0b3BpY0lkLnRvU3RyaW5nKClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGh0dHAuZ2V0KHN1YnRvcGljUGFnZURhdGFVcmwpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRvcGljID0gYW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEuc3VidG9waWNfcGFnZSk7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2sodG9waWMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvclJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2RlbGV0ZVRvcGljID0gZnVuY3Rpb24gKHRvcGljSWQsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIHRvcGljRGF0YVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKEVESVRBQkxFX1RPUElDX0RBVEFfVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgdG9waWNfaWQ6IHRvcGljSWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGh0dHBbJ2RlbGV0ZSddKHRvcGljRGF0YVVybCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZS5zdGF0dXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvclJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX3VwZGF0ZVRvcGljID0gZnVuY3Rpb24gKHRvcGljSWQsIHRvcGljVmVyc2lvbiwgY29tbWl0TWVzc2FnZSwgY2hhbmdlTGlzdCwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgZWRpdGFibGVUb3BpY0RhdGFVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChFRElUQUJMRV9UT1BJQ19EQVRBX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgIHRvcGljX2lkOiB0b3BpY0lkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBwdXREYXRhID0ge1xuICAgICAgICAgICAgICAgIHZlcnNpb246IHRvcGljVmVyc2lvbixcbiAgICAgICAgICAgICAgICBjb21taXRfbWVzc2FnZTogY29tbWl0TWVzc2FnZSxcbiAgICAgICAgICAgICAgICB0b3BpY19hbmRfc3VidG9waWNfcGFnZV9jaGFuZ2VfZGljdHM6IGNoYW5nZUxpc3RcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAkaHR0cC5wdXQoZWRpdGFibGVUb3BpY0RhdGFVcmwsIHB1dERhdGEpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAvLyBIZXJlIGFsc28sIGEgZGljdCB3aXRoIDIgZmllbGRzIGFyZSBwYXNzZWQgaW5zdGVhZCBvZiBqdXN0IDJcbiAgICAgICAgICAgICAgICAgICAgLy8gcGFyYW1ldGVycywgZHVlIHRvIHRoZSBzYW1lIHJlYXNvbiBhcyB3cml0dGVuIGZvciBfZmV0Y2hUb3BpYygpLlxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soe1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9waWNEaWN0OiBhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YS50b3BpY19kaWN0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNraWxsSWRUb0Rlc2NyaXB0aW9uRGljdDogYW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEuc2tpbGxfaWRfdG9fZGVzY3JpcHRpb25fZGljdClcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrKGVycm9yUmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmZXRjaFRvcGljOiBmdW5jdGlvbiAodG9waWNJZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF9mZXRjaFRvcGljKHRvcGljSWQsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmV0Y2hTdG9yaWVzOiBmdW5jdGlvbiAodG9waWNJZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF9mZXRjaFN0b3JpZXModG9waWNJZCwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZXRjaFN1YnRvcGljUGFnZTogZnVuY3Rpb24gKHRvcGljSWQsIHN1YnRvcGljSWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfZmV0Y2hTdWJ0b3BpY1BhZ2UodG9waWNJZCwgc3VidG9waWNJZCwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFVwZGF0ZXMgYSB0b3BpYyBpbiB0aGUgYmFja2VuZCB3aXRoIHRoZSBwcm92aWRlZCB0b3BpYyBJRC5cbiAgICAgICAgICAgICAqIFRoZSBjaGFuZ2VzIG9ubHkgYXBwbHkgdG8gdGhlIHRvcGljIG9mIHRoZSBnaXZlbiB2ZXJzaW9uIGFuZCB0aGVcbiAgICAgICAgICAgICAqIHJlcXVlc3QgdG8gdXBkYXRlIHRoZSB0b3BpYyB3aWxsIGZhaWwgaWYgdGhlIHByb3ZpZGVkIHRvcGljXG4gICAgICAgICAgICAgKiB2ZXJzaW9uIGlzIG9sZGVyIHRoYW4gdGhlIGN1cnJlbnQgdmVyc2lvbiBzdG9yZWQgaW4gdGhlIGJhY2tlbmQuIEJvdGhcbiAgICAgICAgICAgICAqIHRoZSBjaGFuZ2VzIGFuZCB0aGUgbWVzc2FnZSB0byBhc3NvY2lhdGUgd2l0aCB0aG9zZSBjaGFuZ2VzIGFyZSB1c2VkXG4gICAgICAgICAgICAgKiB0byBjb21taXQgYSBjaGFuZ2UgdG8gdGhlIHRvcGljLiBUaGUgbmV3IHRvcGljIGlzIHBhc3NlZCB0b1xuICAgICAgICAgICAgICogdGhlIHN1Y2Nlc3MgY2FsbGJhY2ssIGlmIG9uZSBpcyBwcm92aWRlZCB0byB0aGUgcmV0dXJuZWQgcHJvbWlzZVxuICAgICAgICAgICAgICogb2JqZWN0LiBFcnJvcnMgYXJlIHBhc3NlZCB0byB0aGUgZXJyb3IgY2FsbGJhY2ssIGlmIG9uZSBpcyBwcm92aWRlZC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdXBkYXRlVG9waWM6IGZ1bmN0aW9uICh0b3BpY0lkLCB0b3BpY1ZlcnNpb24sIGNvbW1pdE1lc3NhZ2UsIGNoYW5nZUxpc3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfdXBkYXRlVG9waWModG9waWNJZCwgdG9waWNWZXJzaW9uLCBjb21taXRNZXNzYWdlLCBjaGFuZ2VMaXN0LCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRlbGV0ZVRvcGljOiBmdW5jdGlvbiAodG9waWNJZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF9kZWxldGVUb3BpYyh0b3BpY0lkLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBDb25zdGFudHMgZm9yIHRvcGljIGRvbWFpbi5cbiAqL1xuLy8gVE9ETygjNzA5Mik6IERlbGV0ZSB0aGlzIGZpbGUgb25jZSBtaWdyYXRpb24gaXMgY29tcGxldGUgYW5kIHRoZXNlIEFuZ3VsYXJKU1xuLy8gZXF1aXZhbGVudHMgb2YgdGhlIEFuZ3VsYXIgY29uc3RhbnRzIGFyZSBubyBsb25nZXIgbmVlZGVkLlxudmFyIHRvcGljX2RvbWFpbl9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJkb21haW4vdG9waWMvdG9waWMtZG9tYWluLmNvbnN0YW50c1wiKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdUT1BJQ19FRElUT1JfU1RPUllfVVJMX1RFTVBMQVRFJywgdG9waWNfZG9tYWluX2NvbnN0YW50c18xLlRvcGljRG9tYWluQ29uc3RhbnRzLlRPUElDX0VESVRPUl9TVE9SWV9VUkxfVEVNUExBVEUpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1RPUElDX0VESVRPUl9RVUVTVElPTl9VUkxfVEVNUExBVEUnLCB0b3BpY19kb21haW5fY29uc3RhbnRzXzEuVG9waWNEb21haW5Db25zdGFudHMuVE9QSUNfRURJVE9SX1FVRVNUSU9OX1VSTF9URU1QTEFURSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnVE9QSUNfTUFOQUdFUl9SSUdIVFNfVVJMX1RFTVBMQVRFJywgdG9waWNfZG9tYWluX2NvbnN0YW50c18xLlRvcGljRG9tYWluQ29uc3RhbnRzLlRPUElDX01BTkFHRVJfUklHSFRTX1VSTF9URU1QTEFURSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnVE9QSUNfUklHSFRTX1VSTF9URU1QTEFURScsIHRvcGljX2RvbWFpbl9jb25zdGFudHNfMS5Ub3BpY0RvbWFpbkNvbnN0YW50cy5UT1BJQ19SSUdIVFNfVVJMX1RFTVBMQVRFKTtcbi8vIFRoZXNlIHNob3VsZCBtYXRjaCB0aGUgY29uc3RhbnRzIGRlZmluZWQgaW4gY29yZS5kb21haW4udG9waWNfZG9tYWluLlxuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NNRF9BRERfU1VCVE9QSUMnLCB0b3BpY19kb21haW5fY29uc3RhbnRzXzEuVG9waWNEb21haW5Db25zdGFudHMuQ01EX0FERF9TVUJUT1BJQyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnQ01EX0RFTEVURV9BRERJVElPTkFMX1NUT1JZJywgdG9waWNfZG9tYWluX2NvbnN0YW50c18xLlRvcGljRG9tYWluQ29uc3RhbnRzLkNNRF9ERUxFVEVfQURESVRJT05BTF9TVE9SWSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnQ01EX0RFTEVURV9DQU5PTklDQUxfU1RPUlknLCB0b3BpY19kb21haW5fY29uc3RhbnRzXzEuVG9waWNEb21haW5Db25zdGFudHMuQ01EX0RFTEVURV9DQU5PTklDQUxfU1RPUlkpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NNRF9ERUxFVEVfU1VCVE9QSUMnLCB0b3BpY19kb21haW5fY29uc3RhbnRzXzEuVG9waWNEb21haW5Db25zdGFudHMuQ01EX0RFTEVURV9TVUJUT1BJQyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnQ01EX0FERF9VTkNBVEVHT1JJWkVEX1NLSUxMX0lEJywgdG9waWNfZG9tYWluX2NvbnN0YW50c18xLlRvcGljRG9tYWluQ29uc3RhbnRzLkNNRF9BRERfVU5DQVRFR09SSVpFRF9TS0lMTF9JRCk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnQ01EX1JFTU9WRV9VTkNBVEVHT1JJWkVEX1NLSUxMX0lEJywgdG9waWNfZG9tYWluX2NvbnN0YW50c18xLlRvcGljRG9tYWluQ29uc3RhbnRzLkNNRF9SRU1PVkVfVU5DQVRFR09SSVpFRF9TS0lMTF9JRCk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnQ01EX01PVkVfU0tJTExfSURfVE9fU1VCVE9QSUMnLCB0b3BpY19kb21haW5fY29uc3RhbnRzXzEuVG9waWNEb21haW5Db25zdGFudHMuQ01EX01PVkVfU0tJTExfSURfVE9fU1VCVE9QSUMpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NNRF9SRU1PVkVfU0tJTExfSURfRlJPTV9TVUJUT1BJQycsIHRvcGljX2RvbWFpbl9jb25zdGFudHNfMS5Ub3BpY0RvbWFpbkNvbnN0YW50cy5DTURfUkVNT1ZFX1NLSUxMX0lEX0ZST01fU1VCVE9QSUMpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NNRF9VUERBVEVfVE9QSUNfUFJPUEVSVFknLCB0b3BpY19kb21haW5fY29uc3RhbnRzXzEuVG9waWNEb21haW5Db25zdGFudHMuQ01EX1VQREFURV9UT1BJQ19QUk9QRVJUWSk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnQ01EX1VQREFURV9TVUJUT1BJQ19QUk9QRVJUWScsIHRvcGljX2RvbWFpbl9jb25zdGFudHNfMS5Ub3BpY0RvbWFpbkNvbnN0YW50cy5DTURfVVBEQVRFX1NVQlRPUElDX1BST1BFUlRZKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdDTURfVVBEQVRFX1NVQlRPUElDX1BBR0VfUFJPUEVSVFknLCB0b3BpY19kb21haW5fY29uc3RhbnRzXzEuVG9waWNEb21haW5Db25zdGFudHMuQ01EX1VQREFURV9TVUJUT1BJQ19QQUdFX1BST1BFUlRZKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdUT1BJQ19QUk9QRVJUWV9OQU1FJywgdG9waWNfZG9tYWluX2NvbnN0YW50c18xLlRvcGljRG9tYWluQ29uc3RhbnRzLlRPUElDX1BST1BFUlRZX05BTUUpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1RPUElDX1BST1BFUlRZX0RFU0NSSVBUSU9OJywgdG9waWNfZG9tYWluX2NvbnN0YW50c18xLlRvcGljRG9tYWluQ29uc3RhbnRzLlRPUElDX1BST1BFUlRZX0RFU0NSSVBUSU9OKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdUT1BJQ19QUk9QRVJUWV9MQU5HVUFHRV9DT0RFJywgdG9waWNfZG9tYWluX2NvbnN0YW50c18xLlRvcGljRG9tYWluQ29uc3RhbnRzLlRPUElDX1BST1BFUlRZX0xBTkdVQUdFX0NPREUpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1NVQlRPUElDX1BST1BFUlRZX1RJVExFJywgdG9waWNfZG9tYWluX2NvbnN0YW50c18xLlRvcGljRG9tYWluQ29uc3RhbnRzLlNVQlRPUElDX1BST1BFUlRZX1RJVExFKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdTVUJUT1BJQ19QQUdFX1BST1BFUlRZX1BBR0VfQ09OVEVOVFNfSFRNTCcsIHRvcGljX2RvbWFpbl9jb25zdGFudHNfMS5Ub3BpY0RvbWFpbkNvbnN0YW50cy5TVUJUT1BJQ19QQUdFX1BST1BFUlRZX1BBR0VfQ09OVEVOVFNfSFRNTCk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnU1VCVE9QSUNfUEFHRV9QUk9QRVJUWV9QQUdFX0NPTlRFTlRTX0FVRElPJywgdG9waWNfZG9tYWluX2NvbnN0YW50c18xLlRvcGljRG9tYWluQ29uc3RhbnRzLlNVQlRPUElDX1BBR0VfUFJPUEVSVFlfUEFHRV9DT05URU5UU19BVURJTyk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnN0YW50cyBmb3IgdG9waWMgZG9tYWluLlxuICovXG52YXIgVG9waWNEb21haW5Db25zdGFudHMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVG9waWNEb21haW5Db25zdGFudHMoKSB7XG4gICAgfVxuICAgIFRvcGljRG9tYWluQ29uc3RhbnRzLlRPUElDX0VESVRPUl9TVE9SWV9VUkxfVEVNUExBVEUgPSAnL3RvcGljX2VkaXRvcl9zdG9yeV9oYW5kbGVyLzx0b3BpY19pZD4nO1xuICAgIFRvcGljRG9tYWluQ29uc3RhbnRzLlRPUElDX0VESVRPUl9RVUVTVElPTl9VUkxfVEVNUExBVEUgPSAnL3RvcGljX2VkaXRvcl9xdWVzdGlvbl9oYW5kbGVyLzx0b3BpY19pZD4/Y3Vyc29yPTxjdXJzb3I+JztcbiAgICBUb3BpY0RvbWFpbkNvbnN0YW50cy5UT1BJQ19NQU5BR0VSX1JJR0hUU19VUkxfVEVNUExBVEUgPSAnL3JpZ2h0c2hhbmRsZXIvYXNzaWduX3RvcGljX21hbmFnZXIvPHRvcGljX2lkPi88YXNzaWduZWVfaWQ+JztcbiAgICBUb3BpY0RvbWFpbkNvbnN0YW50cy5UT1BJQ19SSUdIVFNfVVJMX1RFTVBMQVRFID0gJy9yaWdodHNoYW5kbGVyL2dldF90b3BpY19yaWdodHMvPHRvcGljX2lkPic7XG4gICAgLy8gVGhlc2Ugc2hvdWxkIG1hdGNoIHRoZSBjb25zdGFudHMgZGVmaW5lZCBpbiBjb3JlLmRvbWFpbi50b3BpY19kb21haW4uXG4gICAgVG9waWNEb21haW5Db25zdGFudHMuQ01EX0FERF9TVUJUT1BJQyA9ICdhZGRfc3VidG9waWMnO1xuICAgIFRvcGljRG9tYWluQ29uc3RhbnRzLkNNRF9ERUxFVEVfQURESVRJT05BTF9TVE9SWSA9ICdkZWxldGVfYWRkaXRpb25hbF9zdG9yeSc7XG4gICAgVG9waWNEb21haW5Db25zdGFudHMuQ01EX0RFTEVURV9DQU5PTklDQUxfU1RPUlkgPSAnZGVsZXRlX2Nhbm9uaWNhbF9zdG9yeSc7XG4gICAgVG9waWNEb21haW5Db25zdGFudHMuQ01EX0RFTEVURV9TVUJUT1BJQyA9ICdkZWxldGVfc3VidG9waWMnO1xuICAgIFRvcGljRG9tYWluQ29uc3RhbnRzLkNNRF9BRERfVU5DQVRFR09SSVpFRF9TS0lMTF9JRCA9ICdhZGRfdW5jYXRlZ29yaXplZF9za2lsbF9pZCc7XG4gICAgVG9waWNEb21haW5Db25zdGFudHMuQ01EX1JFTU9WRV9VTkNBVEVHT1JJWkVEX1NLSUxMX0lEID0gJ3JlbW92ZV91bmNhdGVnb3JpemVkX3NraWxsX2lkJztcbiAgICBUb3BpY0RvbWFpbkNvbnN0YW50cy5DTURfTU9WRV9TS0lMTF9JRF9UT19TVUJUT1BJQyA9ICdtb3ZlX3NraWxsX2lkX3RvX3N1YnRvcGljJztcbiAgICBUb3BpY0RvbWFpbkNvbnN0YW50cy5DTURfUkVNT1ZFX1NLSUxMX0lEX0ZST01fU1VCVE9QSUMgPSAncmVtb3ZlX3NraWxsX2lkX2Zyb21fc3VidG9waWMnO1xuICAgIFRvcGljRG9tYWluQ29uc3RhbnRzLkNNRF9VUERBVEVfVE9QSUNfUFJPUEVSVFkgPSAndXBkYXRlX3RvcGljX3Byb3BlcnR5JztcbiAgICBUb3BpY0RvbWFpbkNvbnN0YW50cy5DTURfVVBEQVRFX1NVQlRPUElDX1BST1BFUlRZID0gJ3VwZGF0ZV9zdWJ0b3BpY19wcm9wZXJ0eSc7XG4gICAgVG9waWNEb21haW5Db25zdGFudHMuQ01EX1VQREFURV9TVUJUT1BJQ19QQUdFX1BST1BFUlRZID0gJ3VwZGF0ZV9zdWJ0b3BpY19wYWdlX3Byb3BlcnR5JztcbiAgICBUb3BpY0RvbWFpbkNvbnN0YW50cy5UT1BJQ19QUk9QRVJUWV9OQU1FID0gJ25hbWUnO1xuICAgIFRvcGljRG9tYWluQ29uc3RhbnRzLlRPUElDX1BST1BFUlRZX0RFU0NSSVBUSU9OID0gJ2Rlc2NyaXB0aW9uJztcbiAgICBUb3BpY0RvbWFpbkNvbnN0YW50cy5UT1BJQ19QUk9QRVJUWV9MQU5HVUFHRV9DT0RFID0gJ2xhbmd1YWdlX2NvZGUnO1xuICAgIFRvcGljRG9tYWluQ29uc3RhbnRzLlNVQlRPUElDX1BST1BFUlRZX1RJVExFID0gJ3RpdGxlJztcbiAgICBUb3BpY0RvbWFpbkNvbnN0YW50cy5TVUJUT1BJQ19QQUdFX1BST1BFUlRZX1BBR0VfQ09OVEVOVFNfSFRNTCA9ICdwYWdlX2NvbnRlbnRzX2h0bWwnO1xuICAgIFRvcGljRG9tYWluQ29uc3RhbnRzLlNVQlRPUElDX1BBR0VfUFJPUEVSVFlfUEFHRV9DT05URU5UU19BVURJTyA9ICdwYWdlX2NvbnRlbnRzX2F1ZGlvJztcbiAgICByZXR1cm4gVG9waWNEb21haW5Db25zdGFudHM7XG59KCkpO1xuZXhwb3J0cy5Ub3BpY0RvbWFpbkNvbnN0YW50cyA9IFRvcGljRG9tYWluQ29uc3RhbnRzO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIHJldHJpZXZlIGluZm9ybWF0aW9uIG9mIHRvcGljcyBhbmQgc2tpbGxzIGRhc2hib2FyZFxuICBmcm9tIHRoZSBiYWNrZW5kIGFuZCB0byBtZXJnZSBza2lsbHMgZnJvbSB0aGUgZGFzaGJvYXJkLlxuICovXG5yZXF1aXJlKCdkb21haW4vdG9waWNzX2FuZF9za2lsbHNfZGFzaGJvYXJkLycgK1xuICAgICd0b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtZG9tYWluLmNvbnN0YW50cy5hanMudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1RvcGljc0FuZFNraWxsc0Rhc2hib2FyZEJhY2tlbmRBcGlTZXJ2aWNlJywgW1xuICAgICckaHR0cCcsICdNRVJHRV9TS0lMTFNfVVJMJywgZnVuY3Rpb24gKCRodHRwLCBNRVJHRV9TS0lMTFNfVVJMKSB7XG4gICAgICAgIHZhciBfZmV0Y2hEYXNoYm9hcmREYXRhID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3RvcGljc19hbmRfc2tpbGxzX2Rhc2hib2FyZC9kYXRhJyk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfbWVyZ2VTa2lsbHMgPSBmdW5jdGlvbiAob2xkU2tpbGxJZCwgbmV3U2tpbGxJZCkge1xuICAgICAgICAgICAgdmFyIG1lcmdlU2tpbGxzRGF0YSA9IHtcbiAgICAgICAgICAgICAgICBvbGRfc2tpbGxfaWQ6IG9sZFNraWxsSWQsXG4gICAgICAgICAgICAgICAgbmV3X3NraWxsX2lkOiBuZXdTa2lsbElkXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoTUVSR0VfU0tJTExTX1VSTCwgbWVyZ2VTa2lsbHNEYXRhKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZldGNoRGFzaGJvYXJkRGF0YTogX2ZldGNoRGFzaGJvYXJkRGF0YSxcbiAgICAgICAgICAgIG1lcmdlU2tpbGxzOiBfbWVyZ2VTa2lsbHNcbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uc3RhbnRzIGZvciB0b3BpY3MgYW5kIHNraWxscyBkYXNoYm9hcmQgZG9tYWluLlxuICovXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4vLyBUT0RPKCM3MDkyKTogRGVsZXRlIHRoaXMgZmlsZSBvbmNlIG1pZ3JhdGlvbiBpcyBjb21wbGV0ZSBhbmQgdGhlc2UgQW5ndWxhckpTXG4vLyBlcXVpdmFsZW50cyBvZiB0aGUgQW5ndWxhciBjb25zdGFudHMgYXJlIG5vIGxvbmdlciBuZWVkZWQuXG52YXIgdG9waWNzX2FuZF9za2lsbHNfZGFzaGJvYXJkX2RvbWFpbl9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJkb21haW4vdG9waWNzX2FuZF9za2lsbHNfZGFzaGJvYXJkL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1kb21haW4uY29uc3RhbnRzXCIpO1xuLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnTUVSR0VfU0tJTExTX1VSTCcsIHRvcGljc19hbmRfc2tpbGxzX2Rhc2hib2FyZF9kb21haW5fY29uc3RhbnRzXzEuVG9waWNzQW5kU2tpbGxzRGFzaGJvYXJkRG9tYWluQ29uc3RhbnRzLk1FUkdFX1NLSUxMU19VUkwpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBDb25zdGFudHMgZm9yIHRvcGljcyBhbmQgc2tpbGxzIGRhc2hib2FyZCBkb21haW4uXG4gKi9cbnZhciBUb3BpY3NBbmRTa2lsbHNEYXNoYm9hcmREb21haW5Db25zdGFudHMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVG9waWNzQW5kU2tpbGxzRGFzaGJvYXJkRG9tYWluQ29uc3RhbnRzKCkge1xuICAgIH1cbiAgICBUb3BpY3NBbmRTa2lsbHNEYXNoYm9hcmREb21haW5Db25zdGFudHMuTUVSR0VfU0tJTExTX1VSTCA9ICcvbWVyZ2Vfc2tpbGxzX2hhbmRsZXInO1xuICAgIHJldHVybiBUb3BpY3NBbmRTa2lsbHNEYXNoYm9hcmREb21haW5Db25zdGFudHM7XG59KCkpO1xuZXhwb3J0cy5Ub3BpY3NBbmRTa2lsbHNEYXNoYm9hcmREb21haW5Db25zdGFudHMgPSBUb3BpY3NBbmRTa2lsbHNEYXNoYm9hcmREb21haW5Db25zdGFudHM7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE5vcm1hbGl6ZVdoaXRlc3BhY2UgZmlsdGVyIGZvciBPcHBpYS5cbiAqL1xucmVxdWlyZSgnc2VydmljZXMvVXRpbHNTZXJ2aWNlLnRzJyk7XG4vLyBGaWx0ZXIgdGhhdCByZW1vdmVzIHdoaXRlc3BhY2UgZnJvbSB0aGUgYmVnaW5uaW5nIGFuZCBlbmQgb2YgYSBzdHJpbmcsIGFuZFxuLy8gcmVwbGFjZXMgaW50ZXJpb3Igd2hpdGVzcGFjZSB3aXRoIGEgc2luZ2xlIHNwYWNlIGNoYXJhY3Rlci5cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZpbHRlcignbm9ybWFsaXplV2hpdGVzcGFjZScsIFtcbiAgICAnVXRpbHNTZXJ2aWNlJywgZnVuY3Rpb24gKFV0aWxzU2VydmljZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICBpZiAoVXRpbHNTZXJ2aWNlLmlzU3RyaW5nKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSB3aGl0ZXNwYWNlIGZyb20gdGhlIGJlZ2lubmluZyBhbmQgZW5kIG9mIHRoZSBzdHJpbmcsIGFuZFxuICAgICAgICAgICAgICAgIC8vIHJlcGxhY2UgaW50ZXJpb3Igd2hpdGVzcGFjZSB3aXRoIGEgc2luZ2xlIHNwYWNlIGNoYXJhY3Rlci5cbiAgICAgICAgICAgICAgICBpbnB1dCA9IGlucHV0LnRyaW0oKTtcbiAgICAgICAgICAgICAgICBpbnB1dCA9IGlucHV0LnJlcGxhY2UoL1xcc3syLH0vZywgJyAnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIGZvb3Rlci5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdvcHBpYUZvb3RlcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL29wcGlhX2Zvb3Rlcl9kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHsgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBDb25zdGFudHMgZm9yIHRoZSBza2lsbCBlZGl0b3IgcGFnZS5cbiAqL1xuLy8gVE9ETygjNzA5Mik6IERlbGV0ZSB0aGlzIGZpbGUgb25jZSBtaWdyYXRpb24gaXMgY29tcGxldGUgYW5kIHRoZXNlIEFuZ3VsYXJKU1xuLy8gZXF1aXZhbGVudHMgb2YgdGhlIEFuZ3VsYXIgY29uc3RhbnRzIGFyZSBubyBsb25nZXIgbmVlZGVkLlxudmFyIHNraWxsX2VkaXRvcl9wYWdlX2NvbnN0YW50c18xID0gcmVxdWlyZShcInBhZ2VzL3NraWxsLWVkaXRvci1wYWdlL3NraWxsLWVkaXRvci1wYWdlLmNvbnN0YW50c1wiKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdTS0lMTF9SSUdIVFNfVVJMX1RFTVBMQVRFJywgc2tpbGxfZWRpdG9yX3BhZ2VfY29uc3RhbnRzXzEuU2tpbGxFZGl0b3JQYWdlQ29uc3RhbnRzLlNLSUxMX1JJR0hUU19VUkxfVEVNUExBVEUpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1NLSUxMX1BVQkxJU0hfVVJMX1RFTVBMQVRFJywgc2tpbGxfZWRpdG9yX3BhZ2VfY29uc3RhbnRzXzEuU2tpbGxFZGl0b3JQYWdlQ29uc3RhbnRzLlNLSUxMX1BVQkxJU0hfVVJMX1RFTVBMQVRFKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdFVkVOVF9TS0lMTF9JTklUSUFMSVpFRCcsIHNraWxsX2VkaXRvcl9wYWdlX2NvbnN0YW50c18xLlNraWxsRWRpdG9yUGFnZUNvbnN0YW50cy5FVkVOVF9TS0lMTF9JTklUSUFMSVpFRCk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnRVZFTlRfU0tJTExfUkVJTklUSUFMSVpFRCcsIHNraWxsX2VkaXRvcl9wYWdlX2NvbnN0YW50c18xLlNraWxsRWRpdG9yUGFnZUNvbnN0YW50cy5FVkVOVF9TS0lMTF9SRUlOSVRJQUxJWkVEKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uc3RhbnRzIGZvciB0aGUgc2tpbGwgZWRpdG9yIHBhZ2UuXG4gKi9cbnZhciBTa2lsbEVkaXRvclBhZ2VDb25zdGFudHMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU2tpbGxFZGl0b3JQYWdlQ29uc3RhbnRzKCkge1xuICAgIH1cbiAgICBTa2lsbEVkaXRvclBhZ2VDb25zdGFudHMuU0tJTExfUklHSFRTX1VSTF9URU1QTEFURSA9ICcvc2tpbGxfZWRpdG9yX2hhbmRsZXIvcmlnaHRzLzxza2lsbF9pZD4nO1xuICAgIFNraWxsRWRpdG9yUGFnZUNvbnN0YW50cy5TS0lMTF9QVUJMSVNIX1VSTF9URU1QTEFURSA9ICcvc2tpbGxfZWRpdG9yX2hhbmRsZXIvcHVibGlzaF9za2lsbC88c2tpbGxfaWQ+JztcbiAgICBTa2lsbEVkaXRvclBhZ2VDb25zdGFudHMuRVZFTlRfU0tJTExfSU5JVElBTElaRUQgPSAnc2tpbGxJbml0aWFsaXplZCc7XG4gICAgU2tpbGxFZGl0b3JQYWdlQ29uc3RhbnRzLkVWRU5UX1NLSUxMX1JFSU5JVElBTElaRUQgPSAnc2tpbGxSZWluaXRpYWxpemVkJztcbiAgICByZXR1cm4gU2tpbGxFZGl0b3JQYWdlQ29uc3RhbnRzO1xufSgpKTtcbmV4cG9ydHMuU2tpbGxFZGl0b3JQYWdlQ29uc3RhbnRzID0gU2tpbGxFZGl0b3JQYWdlQ29uc3RhbnRzO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb250cm9sbGVyIGZvciB0aGUgbmF2YmFyIGJyZWFkY3J1bWIgb2YgdGhlIGNvbGxlY3Rpb24gZWRpdG9yLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3RvcGljc0FuZFNraWxsc0Rhc2hib2FyZE5hdmJhckJyZWFkY3J1bWInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvbmF2YmFyLycgK1xuICAgICAgICAgICAgICAgICd0b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtbmF2YmFyLWJyZWFkY3J1bWIuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7IH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgbmF2YmFyIG9mIHRoZSBjb2xsZWN0aW9uIGVkaXRvci5cbiAqL1xucmVxdWlyZSgnY29tcG9uZW50cy9lbnRpdHktY3JlYXRpb24tc2VydmljZXMvc2tpbGwtY3JlYXRpb24uc2VydmljZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9lbnRpdHktY3JlYXRpb24tc2VydmljZXMvdG9waWMtY3JlYXRpb24uc2VydmljZS50cy50cycpO1xucmVxdWlyZSgnZG9tYWluL3RvcGljL0VkaXRhYmxlVG9waWNCYWNrZW5kQXBpU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvJyArXG4gICAgJ3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLmNvbnN0YW50cy5hanMudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgndG9waWNzQW5kU2tpbGxzRGFzaGJvYXJkTmF2YmFyJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlL25hdmJhci8nICtcbiAgICAgICAgICAgICAgICAndG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLW5hdmJhci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJHJvb3RTY29wZScsICckdWliTW9kYWwnLCAnVG9waWNDcmVhdGlvblNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdSdWJyaWNPYmplY3RGYWN0b3J5JywgJ1NraWxsQ3JlYXRpb25TZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnRVZFTlRfVFlQRV9UT1BJQ19DUkVBVElPTl9FTkFCTEVEJyxcbiAgICAgICAgICAgICAgICAnRVZFTlRfVFlQRV9TS0lMTF9DUkVBVElPTl9FTkFCTEVEJywgJ0VkaXRhYmxlVG9waWNCYWNrZW5kQXBpU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ0VWRU5UX1RPUElDU19BTkRfU0tJTExTX0RBU0hCT0FSRF9SRUlOSVRJQUxJWkVEJyxcbiAgICAgICAgICAgICAgICAnU0tJTExfRElGRklDVUxUSUVTJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkcm9vdFNjb3BlLCAkdWliTW9kYWwsIFRvcGljQ3JlYXRpb25TZXJ2aWNlLCBSdWJyaWNPYmplY3RGYWN0b3J5LCBTa2lsbENyZWF0aW9uU2VydmljZSwgRVZFTlRfVFlQRV9UT1BJQ19DUkVBVElPTl9FTkFCTEVELCBFVkVOVF9UWVBFX1NLSUxMX0NSRUFUSU9OX0VOQUJMRUQsIEVkaXRhYmxlVG9waWNCYWNrZW5kQXBpU2VydmljZSwgRVZFTlRfVE9QSUNTX0FORF9TS0lMTFNfREFTSEJPQVJEX1JFSU5JVElBTElaRUQsIFNLSUxMX0RJRkZJQ1VMVElFUykge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY3JlYXRlVG9waWMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBUb3BpY0NyZWF0aW9uU2VydmljZS5jcmVhdGVOZXdUb3BpYygpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY3JlYXRlU2tpbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcnVicmljcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaWR4IGluIFNLSUxMX0RJRkZJQ1VMVElFUykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1YnJpY3MucHVzaChSdWJyaWNPYmplY3RGYWN0b3J5LmNyZWF0ZShTS0lMTF9ESUZGSUNVTFRJRVNbaWR4XSwgJycpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS90ZW1wbGF0ZXMvJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdjcmVhdGUtbmV3LXNraWxsLW1vZGFsLnRlbXBsYXRlLmh0bWwnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcDogJ3N0YXRpYycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyR1aWJNb2RhbEluc3RhbmNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJHVpYk1vZGFsSW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5uZXdTa2lsbERlc2NyaXB0aW9uID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUucnVicmljcyA9IHJ1YnJpY3M7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYWxsUnVicmljc0FkZGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXJlQWxsUnVicmljc1ByZXNlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaWR4IGluICRzY29wZS5ydWJyaWNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUucnVicmljc1tpZHhdLmdldEV4cGxhbmF0aW9uKCkgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYWxsUnVicmljc0FkZGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmFsbFJ1YnJpY3NBZGRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm9uU2F2ZVJ1YnJpYyA9IGZ1bmN0aW9uIChkaWZmaWN1bHR5LCBleHBsYW5hdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGlkeCBpbiAkc2NvcGUucnVicmljcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLnJ1YnJpY3NbaWR4XS5nZXREaWZmaWN1bHR5KCkgPT09IGRpZmZpY3VsdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5ydWJyaWNzW2lkeF0uc2V0RXhwbGFuYXRpb24oZXhwbGFuYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZUFsbFJ1YnJpY3NQcmVzZW50KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNyZWF0ZU5ld1NraWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmNsb3NlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICRzY29wZS5uZXdTa2lsbERlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBydWJyaWNzOiAkc2NvcGUucnVicmljc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkucmVzdWx0LnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNraWxsQ3JlYXRpb25TZXJ2aWNlLmNyZWF0ZU5ld1NraWxsKHJlc3VsdC5kZXNjcmlwdGlvbiwgcmVzdWx0LnJ1YnJpY3MsIFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihFVkVOVF9UWVBFX1RPUElDX0NSRUFUSU9OX0VOQUJMRUQsIGZ1bmN0aW9uIChldnQsIGNhbkNyZWF0ZVRvcGljKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUudXNlckNhbkNyZWF0ZVRvcGljID0gY2FuQ3JlYXRlVG9waWM7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihFVkVOVF9UWVBFX1NLSUxMX0NSRUFUSU9OX0VOQUJMRUQsIGZ1bmN0aW9uIChldnQsIGNhbkNyZWF0ZVNraWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUudXNlckNhbkNyZWF0ZVNraWxsID0gY2FuQ3JlYXRlU2tpbGw7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29udHJvbGxlciBmb3IgdGhlIHNraWxscyBsaXN0IHZpZXdlci5cbiAqL1xucmVxdWlyZSgncGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvdG9waWMtc2VsZWN0b3IvJyArXG4gICAgJ3RvcGljLXNlbGVjdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3NraWxsL0VkaXRhYmxlU2tpbGxCYWNrZW5kQXBpU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3RvcGljL0VkaXRhYmxlVG9waWNCYWNrZW5kQXBpU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvJyArXG4gICAgJ3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLmNvbnN0YW50cy5hanMudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnc2tpbGxzTGlzdCcsIFtcbiAgICAnQWxlcnRzU2VydmljZScsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKEFsZXJ0c1NlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBnZXRTa2lsbFN1bW1hcmllczogJyZza2lsbFN1bW1hcmllcycsXG4gICAgICAgICAgICAgICAgZ2V0RWRpdGFibGVUb3BpY1N1bW1hcmllczogJyZlZGl0YWJsZVRvcGljU3VtbWFyaWVzJyxcbiAgICAgICAgICAgICAgICBpc0luTW9kYWw6ICcmaW5Nb2RhbCcsXG4gICAgICAgICAgICAgICAgZ2V0TWVyZ2VhYmxlU2tpbGxTdW1tYXJpZXM6ICcmbWVyZ2VhYmxlU2tpbGxTdW1tYXJpZXMnLFxuICAgICAgICAgICAgICAgIHNlbGVjdGVkU2tpbGw6ICc9JyxcbiAgICAgICAgICAgICAgICBjYW5EZWxldGVTa2lsbDogJyZ1c2VyQ2FuRGVsZXRlU2tpbGwnLFxuICAgICAgICAgICAgICAgIGNhbkNyZWF0ZVNraWxsOiAnJnVzZXJDYW5DcmVhdGVTa2lsbCcsXG4gICAgICAgICAgICAgICAgaXNVbnB1Ymxpc2hlZFNraWxsOiAnJnVucHVibGlzaGVkU2tpbGwnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2Uvc2tpbGxzLWxpc3QvJyArXG4gICAgICAgICAgICAgICAgJ3NraWxscy1saXN0LmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWwnLCAnJHJvb3RTY29wZScsICdFZGl0YWJsZVRvcGljQmFja2VuZEFwaVNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdFZGl0YWJsZVNraWxsQmFja2VuZEFwaVNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdUb3BpY3NBbmRTa2lsbHNEYXNoYm9hcmRCYWNrZW5kQXBpU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ0VWRU5UX1RPUElDU19BTkRfU0tJTExTX0RBU0hCT0FSRF9SRUlOSVRJQUxJWkVEJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkdWliTW9kYWwsICRyb290U2NvcGUsIEVkaXRhYmxlVG9waWNCYWNrZW5kQXBpU2VydmljZSwgRWRpdGFibGVTa2lsbEJhY2tlbmRBcGlTZXJ2aWNlLCBUb3BpY3NBbmRTa2lsbHNEYXNoYm9hcmRCYWNrZW5kQXBpU2VydmljZSwgRVZFTlRfVE9QSUNTX0FORF9TS0lMTFNfREFTSEJPQVJEX1JFSU5JVElBTElaRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLlNLSUxMX0hFQURJTkdTID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2Rlc2NyaXB0aW9uJywgJ3dvcmtlZF9leGFtcGxlc19jb3VudCcsICdtaXNjb25jZXB0aW9uX2NvdW50J1xuICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaGlnaGxpZ2h0ZWRJbmRleCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5oaWdobGlnaHRDb2x1bW5zID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaGlnaGxpZ2h0ZWRJbmRleCA9IGluZGV4O1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudW5oaWdobGlnaHRDb2x1bW5zID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmhpZ2hsaWdodGVkSW5kZXggPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZ2V0U2tpbGxFZGl0b3JVcmwgPSBmdW5jdGlvbiAoc2tpbGxJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcvc2tpbGxfZWRpdG9yLycgKyBza2lsbElkO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZGVsZXRlU2tpbGwgPSBmdW5jdGlvbiAoc2tpbGxJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1vZGFsSW5zdGFuY2UgPSAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvdGVtcGxhdGVzLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGVsZXRlLXNraWxsLW1vZGFsLnRlbXBsYXRlLmh0bWwnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJHVpYk1vZGFsSW5zdGFuY2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkdWliTW9kYWxJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpcm1EZWxldGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RhbEluc3RhbmNlLnJlc3VsdC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBFZGl0YWJsZVNraWxsQmFja2VuZEFwaVNlcnZpY2UuZGVsZXRlU2tpbGwoc2tpbGxJZCkudGhlbihmdW5jdGlvbiAoc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChFVkVOVF9UT1BJQ1NfQU5EX1NLSUxMU19EQVNIQk9BUkRfUkVJTklUSUFMSVpFRCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3VjY2Vzc1RvYXN0ID0gJ1RoZSBza2lsbCBoYXMgYmVlbiBkZWxldGVkLic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRTdWNjZXNzTWVzc2FnZShzdWNjZXNzVG9hc3QsIDEwMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5hc3NpZ25Ta2lsbFRvVG9waWMgPSBmdW5jdGlvbiAoc2tpbGxJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRvcGljU3VtbWFyaWVzID0gJHNjb3BlLmdldEVkaXRhYmxlVG9waWNTdW1tYXJpZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtb2RhbEluc3RhbmNlID0gJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlL3RlbXBsYXRlcy8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2Fzc2lnbi1za2lsbC10by10b3BpYy1tb2RhbC50ZW1wbGF0ZS5odG1sJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2Ryb3A6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyR1aWJNb2RhbEluc3RhbmNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJHVpYk1vZGFsSW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS50b3BpY1N1bW1hcmllcyA9IHRvcGljU3VtbWFyaWVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkVG9waWNJZHMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5kb25lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmNsb3NlKCRzY29wZS5zZWxlY3RlZFRvcGljSWRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbW9kYWxJbnN0YW5jZS5yZXN1bHQudGhlbihmdW5jdGlvbiAodG9waWNJZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2hhbmdlTGlzdCA9IFt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbWQ6ICdhZGRfdW5jYXRlZ29yaXplZF9za2lsbF9pZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdfdW5jYXRlZ29yaXplZF9za2lsbF9pZDogc2tpbGxJZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdG9waWNTdW1tYXJpZXMgPSAkc2NvcGUuZ2V0RWRpdGFibGVUb3BpY1N1bW1hcmllcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdG9waWNJZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZlcnNpb24gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRvcGljU3VtbWFyaWVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodG9waWNTdW1tYXJpZXNbal0uaWQgPT09IHRvcGljSWRzW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRWRpdGFibGVUb3BpY0JhY2tlbmRBcGlTZXJ2aWNlLnVwZGF0ZVRvcGljKHRvcGljSWRzW2ldLCB0b3BpY1N1bW1hcmllc1tqXS52ZXJzaW9uLCAnQWRkZWQgc2tpbGwgd2l0aCBpZCAnICsgc2tpbGxJZCArICcgdG8gdG9waWMuJywgY2hhbmdlTGlzdCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChFVkVOVF9UT1BJQ1NfQU5EX1NLSUxMU19EQVNIQk9BUkRfUkVJTklUSUFMSVpFRCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdWNjZXNzVG9hc3QgPSAoJ1RoZSBza2lsbCBoYXMgYmVlbiBhc3NpZ25lZCB0byB0aGUgdG9waWMuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkU3VjY2Vzc01lc3NhZ2Uoc3VjY2Vzc1RvYXN0LCAxMDAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0U2tpbGwgPSBmdW5jdGlvbiAoc2tpbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZFNraWxsID0gc2tpbGw7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5tZXJnZVNraWxsID0gZnVuY3Rpb24gKHNraWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2tpbGxTdW1tYXJpZXMgPSAkc2NvcGUuZ2V0TWVyZ2VhYmxlU2tpbGxTdW1tYXJpZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtb2RhbEluc3RhbmNlID0gJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlL3RlbXBsYXRlcy8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ21lcmdlLXNraWxsLW1vZGFsLnRlbXBsYXRlLmh0bWwnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJHVpYk1vZGFsSW5zdGFuY2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkdWliTW9kYWxJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNraWxsU3VtbWFyaWVzID0gc2tpbGxTdW1tYXJpZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0ZWRTa2lsbCA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRvbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuY2xvc2UoeyBza2lsbDogc2tpbGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1cGVyc2VkaW5nU2tpbGxJZDogJHNjb3BlLnNlbGVjdGVkU2tpbGwuaWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbW9kYWxJbnN0YW5jZS5yZXN1bHQudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNraWxsID0gcmVzdWx0LnNraWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdXBlcnNlZGluZ1NraWxsSWQgPSByZXN1bHQuc3VwZXJzZWRpbmdTa2lsbElkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRyYW5zZmVyIHF1ZXN0aW9ucyBmcm9tIHRoZSBvbGQgc2tpbGwgdG8gdGhlIG5ldyBza2lsbC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBUb3BpY3NBbmRTa2lsbHNEYXNoYm9hcmRCYWNrZW5kQXBpU2VydmljZS5tZXJnZVNraWxscyhza2lsbC5pZCwgc3VwZXJzZWRpbmdTa2lsbElkKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQnJvYWRjYXN0IHdpbGwgdXBkYXRlIHRoZSBza2lsbHMgbGlzdCBpbiB0aGUgZGFzaGJvYXJkIHNvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoYXQgdGhlIG1lcmdlZCBza2lsbHMgYXJlIG5vdCBzaG93biBhbnltb3JlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoRVZFTlRfVE9QSUNTX0FORF9TS0lMTFNfREFTSEJPQVJEX1JFSU5JVElBTElaRUQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb250cm9sbGVyIGZvciB0aGUgc2VsZWN0IHRvcGljcyB2aWV3ZXIuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnc2VsZWN0VG9waWNzJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgZ2V0VG9waWNTdW1tYXJpZXM6ICcmdG9waWNTdW1tYXJpZXMnLFxuICAgICAgICAgICAgICAgIHNlbGVjdGVkVG9waWNJZHM6ICc9J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlL3RvcGljLXNlbGVjdG9yLycgK1xuICAgICAgICAgICAgICAgICd0b3BpYy1zZWxlY3Rvci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJHVpYk1vZGFsJywgJyRyb290U2NvcGUnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbCwgJHJvb3RTY29wZSkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudG9waWNTdW1tYXJpZXMgPSAkc2NvcGUuZ2V0VG9waWNTdW1tYXJpZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdE9yRGVzZWxlY3RUb3BpYyA9IGZ1bmN0aW9uICh0b3BpY0lkLCBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkc2NvcGUudG9waWNTdW1tYXJpZXNbaW5kZXhdLmlzU2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0ZWRUb3BpY0lkcy5wdXNoKHRvcGljSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS50b3BpY1N1bW1hcmllc1tpbmRleF0uaXNTZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaWRJbmRleCA9ICRzY29wZS5zZWxlY3RlZFRvcGljSWRzLmluZGV4T2YodG9waWNJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkVG9waWNJZHMuc3BsaWNlKGlkSW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS50b3BpY1N1bW1hcmllc1tpbmRleF0uaXNTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uc3RhbnRzIGZvciB0aGUgdG9waWNzIGFuZCBza2lsbHMgZGFzaGJvYXJkLlxuICovXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4vLyBUT0RPKCM3MDkyKTogRGVsZXRlIHRoaXMgZmlsZSBvbmNlIG1pZ3JhdGlvbiBpcyBjb21wbGV0ZSBhbmQgdGhlc2UgQW5ndWxhckpTXG4vLyBlcXVpdmFsZW50cyBvZiB0aGUgQW5ndWxhciBjb25zdGFudHMgYXJlIG5vIGxvbmdlciBuZWVkZWQuXG52YXIgdG9waWNzX2FuZF9za2lsbHNfZGFzaGJvYXJkX3BhZ2VfY29uc3RhbnRzXzEgPSByZXF1aXJlKFwicGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UuY29uc3RhbnRzXCIpO1xuLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnRVZFTlRfVFlQRV9UT1BJQ19DUkVBVElPTl9FTkFCTEVEJywgdG9waWNzX2FuZF9za2lsbHNfZGFzaGJvYXJkX3BhZ2VfY29uc3RhbnRzXzEuVG9waWNzQW5kU2tpbGxzRGFzaGJvYXJkUGFnZUNvbnN0YW50cy5FVkVOVF9UWVBFX1RPUElDX0NSRUFUSU9OX0VOQUJMRUQpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0VWRU5UX1RZUEVfU0tJTExfQ1JFQVRJT05fRU5BQkxFRCcsIHRvcGljc19hbmRfc2tpbGxzX2Rhc2hib2FyZF9wYWdlX2NvbnN0YW50c18xLlRvcGljc0FuZFNraWxsc0Rhc2hib2FyZFBhZ2VDb25zdGFudHMuRVZFTlRfVFlQRV9TS0lMTF9DUkVBVElPTl9FTkFCTEVEKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdFVkVOVF9UT1BJQ1NfQU5EX1NLSUxMU19EQVNIQk9BUkRfUkVJTklUSUFMSVpFRCcsIHRvcGljc19hbmRfc2tpbGxzX2Rhc2hib2FyZF9wYWdlX2NvbnN0YW50c18xLlRvcGljc0FuZFNraWxsc0Rhc2hib2FyZFBhZ2VDb25zdGFudHNcbiAgICAuRVZFTlRfVE9QSUNTX0FORF9TS0lMTFNfREFTSEJPQVJEX1JFSU5JVElBTElaRUQpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBDb25zdGFudHMgZm9yIHRoZSB0b3BpY3MgYW5kIHNraWxscyBkYXNoYm9hcmQuXG4gKi9cbnZhciBUb3BpY3NBbmRTa2lsbHNEYXNoYm9hcmRQYWdlQ29uc3RhbnRzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFRvcGljc0FuZFNraWxsc0Rhc2hib2FyZFBhZ2VDb25zdGFudHMoKSB7XG4gICAgfVxuICAgIFRvcGljc0FuZFNraWxsc0Rhc2hib2FyZFBhZ2VDb25zdGFudHMuRVZFTlRfVFlQRV9UT1BJQ19DUkVBVElPTl9FTkFCTEVEID0gJ3RvcGljQ3JlYXRpb25FbmFibGVkJztcbiAgICBUb3BpY3NBbmRTa2lsbHNEYXNoYm9hcmRQYWdlQ29uc3RhbnRzLkVWRU5UX1RZUEVfU0tJTExfQ1JFQVRJT05fRU5BQkxFRCA9ICdza2lsbENyZWF0aW9uRW5hYmxlZCc7XG4gICAgVG9waWNzQW5kU2tpbGxzRGFzaGJvYXJkUGFnZUNvbnN0YW50cy5FVkVOVF9UT1BJQ1NfQU5EX1NLSUxMU19EQVNIQk9BUkRfUkVJTklUSUFMSVpFRCA9ICd0b3BpY3NBbmRTa2lsbHNEYXNoYm9hcmRSZWluaXRpYWxpemVkJztcbiAgICByZXR1cm4gVG9waWNzQW5kU2tpbGxzRGFzaGJvYXJkUGFnZUNvbnN0YW50cztcbn0oKSk7XG5leHBvcnRzLlRvcGljc0FuZFNraWxsc0Rhc2hib2FyZFBhZ2VDb25zdGFudHMgPSBUb3BpY3NBbmRTa2lsbHNEYXNoYm9hcmRQYWdlQ29uc3RhbnRzO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb250cm9sbGVycyBmb3IgdGhlIHRvcGljcyBhbmQgc2tpbGxzIGRhc2hib2FyZC5cbiAqL1xucmVxdWlyZSgnYmFzZV9jb21wb25lbnRzL0Jhc2VDb250ZW50RGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9jb21tb24tZWxlbWVudHMvJyArXG4gICAgJ2JhY2tncm91bmQtYmFubmVyLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2Uvc2tpbGxzLWxpc3QvJyArXG4gICAgJ3NraWxscy1saXN0LmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvdG9waWNzLWxpc3QvJyArXG4gICAgJ3RvcGljcy1saXN0LmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9lbnRpdHktY3JlYXRpb24tc2VydmljZXMvc2tpbGwtY3JlYXRpb24uc2VydmljZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9lbnRpdHktY3JlYXRpb24tc2VydmljZXMvdG9waWMtY3JlYXRpb24uc2VydmljZS50cy50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9ydWJyaWNzLWVkaXRvci9ydWJyaWNzLWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9za2lsbC9SdWJyaWNPYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdG9waWNzX2FuZF9za2lsbHNfZGFzaGJvYXJkLycgK1xuICAgICdUb3BpY3NBbmRTa2lsbHNEYXNoYm9hcmRCYWNrZW5kQXBpU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvJyArXG4gICAgJ3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLmNvbnN0YW50cy5hanMudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgndG9waWNzQW5kU2tpbGxzRGFzaGJvYXJkUGFnZScsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLycgK1xuICAgICAgICAgICAgICAgICd0b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckaHR0cCcsICckcm9vdFNjb3BlJywgJyRzY29wZScsICckdWliTW9kYWwnLCAnJHdpbmRvdycsXG4gICAgICAgICAgICAgICAgJ0FsZXJ0c1NlcnZpY2UnLCAnUnVicmljT2JqZWN0RmFjdG9yeScsICdTa2lsbENyZWF0aW9uU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ1RvcGljQ3JlYXRpb25TZXJ2aWNlJywgJ1RvcGljc0FuZFNraWxsc0Rhc2hib2FyZEJhY2tlbmRBcGlTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdFVkVOVF9UT1BJQ1NfQU5EX1NLSUxMU19EQVNIQk9BUkRfUkVJTklUSUFMSVpFRCcsXG4gICAgICAgICAgICAgICAgJ0VWRU5UX1RZUEVfU0tJTExfQ1JFQVRJT05fRU5BQkxFRCcsXG4gICAgICAgICAgICAgICAgJ0VWRU5UX1RZUEVfVE9QSUNfQ1JFQVRJT05fRU5BQkxFRCcsXG4gICAgICAgICAgICAgICAgJ0ZBVEFMX0VSUk9SX0NPREVTJywgJ1NLSUxMX0RJRkZJQ1VMVElFUycsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRodHRwLCAkcm9vdFNjb3BlLCAkc2NvcGUsICR1aWJNb2RhbCwgJHdpbmRvdywgQWxlcnRzU2VydmljZSwgUnVicmljT2JqZWN0RmFjdG9yeSwgU2tpbGxDcmVhdGlvblNlcnZpY2UsIFRvcGljQ3JlYXRpb25TZXJ2aWNlLCBUb3BpY3NBbmRTa2lsbHNEYXNoYm9hcmRCYWNrZW5kQXBpU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIEVWRU5UX1RPUElDU19BTkRfU0tJTExTX0RBU0hCT0FSRF9SRUlOSVRJQUxJWkVELCBFVkVOVF9UWVBFX1NLSUxMX0NSRUFUSU9OX0VOQUJMRUQsIEVWRU5UX1RZUEVfVE9QSUNfQ1JFQVRJT05fRU5BQkxFRCwgRkFUQUxfRVJST1JfQ09ERVMsIFNLSUxMX0RJRkZJQ1VMVElFUykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuVEFCX05BTUVfVE9QSUNTID0gJ3RvcGljcyc7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuVEFCX05BTUVfVU5UUklBR0VEX1NLSUxMUyA9ICd1bnRyaWFnZWRTa2lsbHMnO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLlRBQl9OQU1FX1VOUFVCTElTSEVEX1NLSUxMUyA9ICd1bnB1Ymxpc2hlZFNraWxscyc7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfaW5pdERhc2hib2FyZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFRvcGljc0FuZFNraWxsc0Rhc2hib2FyZEJhY2tlbmRBcGlTZXJ2aWNlLmZldGNoRGFzaGJvYXJkRGF0YSgpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC50b3BpY1N1bW1hcmllcyA9IHJlc3BvbnNlLmRhdGEudG9waWNfc3VtbWFyeV9kaWN0cztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmVkaXRhYmxlVG9waWNTdW1tYXJpZXMgPSBjdHJsLnRvcGljU3VtbWFyaWVzLmZpbHRlcihmdW5jdGlvbiAoc3VtbWFyeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3VtbWFyeS5jYW5fZWRpdF90b3BpYyA9PT0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnVudHJpYWdlZFNraWxsU3VtbWFyaWVzID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS51bnRyaWFnZWRfc2tpbGxfc3VtbWFyeV9kaWN0cztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLm1lcmdlYWJsZVNraWxsU3VtbWFyaWVzID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5tZXJnZWFibGVfc2tpbGxfc3VtbWFyeV9kaWN0cztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnVucHVibGlzaGVkU2tpbGxTdW1tYXJpZXMgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnVucHVibGlzaGVkX3NraWxsX3N1bW1hcnlfZGljdHM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5hY3RpdmVUYWIgPSBjdHJsLlRBQl9OQU1FX1RPUElDUztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnVzZXJDYW5DcmVhdGVUb3BpYyA9IHJlc3BvbnNlLmRhdGEuY2FuX2NyZWF0ZV90b3BpYztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnVzZXJDYW5DcmVhdGVTa2lsbCA9IHJlc3BvbnNlLmRhdGEuY2FuX2NyZWF0ZV9za2lsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoRVZFTlRfVFlQRV9UT1BJQ19DUkVBVElPTl9FTkFCTEVELCBjdHJsLnVzZXJDYW5DcmVhdGVUb3BpYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEVWRU5UX1RZUEVfU0tJTExfQ1JFQVRJT05fRU5BQkxFRCwgY3RybC51c2VyQ2FuQ3JlYXRlU2tpbGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudXNlckNhbkRlbGV0ZVRvcGljID0gcmVzcG9uc2UuZGF0YS5jYW5fZGVsZXRlX3RvcGljO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudXNlckNhbkRlbGV0ZVNraWxsID0gcmVzcG9uc2UuZGF0YS5jYW5fZGVsZXRlX3NraWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdHJsLnRvcGljU3VtbWFyaWVzLmxlbmd0aCA9PT0gMCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnVudHJpYWdlZFNraWxsU3VtbWFyaWVzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmFjdGl2ZVRhYiA9IGN0cmwuVEFCX05BTUVfVU5UUklBR0VEX1NLSUxMUztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoY3RybC50b3BpY1N1bW1hcmllcy5sZW5ndGggPT09IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC51bnB1Ymxpc2hlZFNraWxsU3VtbWFyaWVzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmFjdGl2ZVRhYiA9IGN0cmwuVEFCX05BTUVfVU5QVUJMSVNIRURfU0tJTExTO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKEZBVEFMX0VSUk9SX0NPREVTLmluZGV4T2YoZXJyb3JSZXNwb25zZS5zdGF0dXMpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ0ZhaWxlZCB0byBnZXQgZGFzaGJvYXJkIGRhdGEnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZygnVW5leHBlY3RlZCBlcnJvciBjb2RlIGZyb20gdGhlIHNlcnZlci4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc1RvcGljVGFiSGVscFRleHRWaXNpYmxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICgoY3RybC50b3BpY1N1bW1hcmllcy5sZW5ndGggPT09IDApICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGN0cmwudW50cmlhZ2VkU2tpbGxTdW1tYXJpZXMubGVuZ3RoID4gMCB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnVucHVibGlzaGVkU2tpbGxTdW1tYXJpZXMubGVuZ3RoID4gMCkpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlzU2tpbGxzVGFiSGVscFRleHRWaXNpYmxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICgoY3RybC51bnRyaWFnZWRTa2lsbFN1bW1hcmllcy5sZW5ndGggPT09IDApICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGN0cmwudG9waWNTdW1tYXJpZXMubGVuZ3RoID4gMCkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoY3RybC51bnB1Ymxpc2hlZFNraWxsU3VtbWFyaWVzLmxlbmd0aCA9PT0gMCkpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNldEFjdGl2ZVRhYiA9IGZ1bmN0aW9uICh0YWJOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmFjdGl2ZVRhYiA9IHRhYk5hbWU7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY3JlYXRlVG9waWMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBUb3BpY0NyZWF0aW9uU2VydmljZS5jcmVhdGVOZXdUb3BpYygpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNyZWF0ZVNraWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJ1YnJpY3MgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGlkeCBpbiBTS0lMTF9ESUZGSUNVTFRJRVMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBydWJyaWNzLnB1c2goUnVicmljT2JqZWN0RmFjdG9yeS5jcmVhdGUoU0tJTExfRElGRklDVUxUSUVTW2lkeF0sICcnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvdGVtcGxhdGVzLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnY3JlYXRlLW5ldy1za2lsbC1tb2RhbC50ZW1wbGF0ZS5odG1sJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2Ryb3A6ICdzdGF0aWMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubmV3U2tpbGxEZXNjcmlwdGlvbiA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJ1YnJpY3MgPSBydWJyaWNzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmFsbFJ1YnJpY3NBZGRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFyZUFsbFJ1YnJpY3NQcmVzZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGlkeCBpbiAkc2NvcGUucnVicmljcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLnJ1YnJpY3NbaWR4XS5nZXRFeHBsYW5hdGlvbigpID09PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmFsbFJ1YnJpY3NBZGRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5hbGxSdWJyaWNzQWRkZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5vblNhdmVSdWJyaWMgPSBmdW5jdGlvbiAoZGlmZmljdWx0eSwgZXhwbGFuYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpZHggaW4gJHNjb3BlLnJ1YnJpY3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5ydWJyaWNzW2lkeF0uZ2V0RGlmZmljdWx0eSgpID09PSBkaWZmaWN1bHR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUucnVicmljc1tpZHhdLnNldEV4cGxhbmF0aW9uKGV4cGxhbmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmVBbGxSdWJyaWNzUHJlc2VudCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jcmVhdGVOZXdTa2lsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5jbG9zZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAkc2NvcGUubmV3U2tpbGxEZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnVicmljczogJHNjb3BlLnJ1YnJpY3NcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLnJlc3VsdC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTa2lsbENyZWF0aW9uU2VydmljZS5jcmVhdGVOZXdTa2lsbChyZXN1bHQuZGVzY3JpcHRpb24sIHJlc3VsdC5ydWJyaWNzLCBbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgX2luaXREYXNoYm9hcmQoKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRvbihFVkVOVF9UT1BJQ1NfQU5EX1NLSUxMU19EQVNIQk9BUkRfUkVJTklUSUFMSVpFRCwgX2luaXREYXNoYm9hcmQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgc3Rvcnkgdmlld2VyIHBhZ2UuXG4gKi9cbnJlcXVpcmUoXCJjb3JlLWpzL2VzNy9yZWZsZWN0XCIpO1xucmVxdWlyZShcInpvbmUuanNcIik7XG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgcGxhdGZvcm1fYnJvd3Nlcl8xID0gcmVxdWlyZShcIkBhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXJcIik7XG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgaHR0cF8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvbW1vbi9odHRwXCIpO1xuLy8gVGhpcyBjb21wb25lbnQgaXMgbmVlZGVkIHRvIGZvcmNlLWJvb3RzdHJhcCBBbmd1bGFyIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlXG4vLyBhcHAuXG52YXIgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50KCkge1xuICAgIH1cbiAgICBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50ID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5Db21wb25lbnQoe1xuICAgICAgICAgICAgc2VsZWN0b3I6ICdzZXJ2aWNlLWJvb3RzdHJhcCcsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogJydcbiAgICAgICAgfSlcbiAgICBdLCBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50KTtcbiAgICByZXR1cm4gU2VydmljZUJvb3RzdHJhcENvbXBvbmVudDtcbn0oKSk7XG5leHBvcnRzLlNlcnZpY2VCb290c3RyYXBDb21wb25lbnQgPSBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50O1xudmFyIGFwcF9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJhcHAuY29uc3RhbnRzXCIpO1xudmFyIGludGVyYWN0aW9uc19leHRlbnNpb25fY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiaW50ZXJhY3Rpb25zL2ludGVyYWN0aW9ucy1leHRlbnNpb24uY29uc3RhbnRzXCIpO1xudmFyIG9iamVjdHNfZG9tYWluX2NvbnN0YW50c18xID0gcmVxdWlyZShcImRvbWFpbi9vYmplY3RzL29iamVjdHMtZG9tYWluLmNvbnN0YW50c1wiKTtcbnZhciBzZXJ2aWNlc19jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJzZXJ2aWNlcy9zZXJ2aWNlcy5jb25zdGFudHNcIik7XG52YXIgc2tpbGxfZG9tYWluX2NvbnN0YW50c18xID0gcmVxdWlyZShcImRvbWFpbi9za2lsbC9za2lsbC1kb21haW4uY29uc3RhbnRzXCIpO1xudmFyIHRvcGljX2RvbWFpbl9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJkb21haW4vdG9waWMvdG9waWMtZG9tYWluLmNvbnN0YW50c1wiKTtcbi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbnZhciB0b3BpY3NfYW5kX3NraWxsc19kYXNoYm9hcmRfZG9tYWluX2NvbnN0YW50c18xID0gcmVxdWlyZShcImRvbWFpbi90b3BpY3NfYW5kX3NraWxsc19kYXNoYm9hcmQvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLWRvbWFpbi5jb25zdGFudHNcIik7XG52YXIgdG9waWNzX2FuZF9za2lsbHNfZGFzaGJvYXJkX3BhZ2VfY29uc3RhbnRzXzEgPSByZXF1aXJlKFwicGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UuY29uc3RhbnRzXCIpO1xuLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG52YXIgVG9waWNzQW5kU2tpbGxzRGFzaGJvYXJkUGFnZU1vZHVsZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBUb3BpY3NBbmRTa2lsbHNEYXNoYm9hcmRQYWdlTW9kdWxlKCkge1xuICAgIH1cbiAgICAvLyBFbXB0eSBwbGFjZWhvbGRlciBtZXRob2QgdG8gc2F0aXNmeSB0aGUgYENvbXBpbGVyYC5cbiAgICBUb3BpY3NBbmRTa2lsbHNEYXNoYm9hcmRQYWdlTW9kdWxlLnByb3RvdHlwZS5uZ0RvQm9vdHN0cmFwID0gZnVuY3Rpb24gKCkgeyB9O1xuICAgIFRvcGljc0FuZFNraWxsc0Rhc2hib2FyZFBhZ2VNb2R1bGUgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLk5nTW9kdWxlKHtcbiAgICAgICAgICAgIGltcG9ydHM6IFtcbiAgICAgICAgICAgICAgICBwbGF0Zm9ybV9icm93c2VyXzEuQnJvd3Nlck1vZHVsZSxcbiAgICAgICAgICAgICAgICBodHRwXzEuSHR0cENsaWVudE1vZHVsZVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGRlY2xhcmF0aW9uczogW1xuICAgICAgICAgICAgICAgIFNlcnZpY2VCb290c3RyYXBDb21wb25lbnRcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBlbnRyeUNvbXBvbmVudHM6IFtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcHJvdmlkZXJzOiBbXG4gICAgICAgICAgICAgICAgYXBwX2NvbnN0YW50c18xLkFwcENvbnN0YW50cyxcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbnNfZXh0ZW5zaW9uX2NvbnN0YW50c18xLkludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMsXG4gICAgICAgICAgICAgICAgb2JqZWN0c19kb21haW5fY29uc3RhbnRzXzEuT2JqZWN0c0RvbWFpbkNvbnN0YW50cyxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlc19jb25zdGFudHNfMS5TZXJ2aWNlc0NvbnN0YW50cyxcbiAgICAgICAgICAgICAgICBza2lsbF9kb21haW5fY29uc3RhbnRzXzEuU2tpbGxEb21haW5Db25zdGFudHMsXG4gICAgICAgICAgICAgICAgdG9waWNfZG9tYWluX2NvbnN0YW50c18xLlRvcGljRG9tYWluQ29uc3RhbnRzLFxuICAgICAgICAgICAgICAgIHRvcGljc19hbmRfc2tpbGxzX2Rhc2hib2FyZF9kb21haW5fY29uc3RhbnRzXzEuVG9waWNzQW5kU2tpbGxzRGFzaGJvYXJkRG9tYWluQ29uc3RhbnRzLFxuICAgICAgICAgICAgICAgIHRvcGljc19hbmRfc2tpbGxzX2Rhc2hib2FyZF9wYWdlX2NvbnN0YW50c18xLlRvcGljc0FuZFNraWxsc0Rhc2hib2FyZFBhZ2VDb25zdGFudHNcbiAgICAgICAgICAgIF1cbiAgICAgICAgfSlcbiAgICBdLCBUb3BpY3NBbmRTa2lsbHNEYXNoYm9hcmRQYWdlTW9kdWxlKTtcbiAgICByZXR1cm4gVG9waWNzQW5kU2tpbGxzRGFzaGJvYXJkUGFnZU1vZHVsZTtcbn0oKSk7XG52YXIgcGxhdGZvcm1fYnJvd3Nlcl9keW5hbWljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3Nlci1keW5hbWljXCIpO1xudmFyIHN0YXRpY18yID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIGJvb3RzdHJhcEZuID0gZnVuY3Rpb24gKGV4dHJhUHJvdmlkZXJzKSB7XG4gICAgdmFyIHBsYXRmb3JtUmVmID0gcGxhdGZvcm1fYnJvd3Nlcl9keW5hbWljXzEucGxhdGZvcm1Ccm93c2VyRHluYW1pYyhleHRyYVByb3ZpZGVycyk7XG4gICAgcmV0dXJuIHBsYXRmb3JtUmVmLmJvb3RzdHJhcE1vZHVsZShUb3BpY3NBbmRTa2lsbHNEYXNoYm9hcmRQYWdlTW9kdWxlKTtcbn07XG52YXIgZG93bmdyYWRlZE1vZHVsZSA9IHN0YXRpY18yLmRvd25ncmFkZU1vZHVsZShib290c3RyYXBGbik7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnLCBbXG4gICAgJ2RuZExpc3RzJywgJ2hlYWRyb29tJywgJ2luZmluaXRlLXNjcm9sbCcsICduZ0FuaW1hdGUnLFxuICAgICduZ0F1ZGlvJywgJ25nQ29va2llcycsICduZ0ltZ0Nyb3AnLCAnbmdKb3lSaWRlJywgJ25nTWF0ZXJpYWwnLFxuICAgICduZ1Jlc291cmNlJywgJ25nU2FuaXRpemUnLCAnbmdUb3VjaCcsICdwYXNjYWxwcmVjaHQudHJhbnNsYXRlJyxcbiAgICAndG9hc3RyJywgJ3VpLmJvb3RzdHJhcCcsICd1aS5zb3J0YWJsZScsICd1aS50cmVlJywgJ3VpLnZhbGlkYXRlJyxcbiAgICBkb3duZ3JhZGVkTW9kdWxlXG5dKVxuICAgIC8vIFRoaXMgZGlyZWN0aXZlIGlzIHRoZSBkb3duZ3JhZGVkIHZlcnNpb24gb2YgdGhlIEFuZ3VsYXIgY29tcG9uZW50IHRvXG4gICAgLy8gYm9vdHN0cmFwIHRoZSBBbmd1bGFyIDguXG4gICAgLmRpcmVjdGl2ZSgnc2VydmljZUJvb3RzdHJhcCcsIHN0YXRpY18xLmRvd25ncmFkZUNvbXBvbmVudCh7XG4gICAgY29tcG9uZW50OiBTZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50XG59KSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBzY3JpcHRzIGZvciB0aGUgdG9waWNzIGFuZCBza2lsbHMgZGFzaGJvYXJkLlxuICovXG4vLyBUaGUgbW9kdWxlIG5lZWRzIHRvIGJlIGxvYWRlZCBiZWZvcmUgZXZlcnl0aGluZyBlbHNlIHNpbmNlIGl0IGRlZmluZXMgdGhlXG4vLyBtYWluIG1vZHVsZSB0aGUgZWxlbWVudHMgYXJlIGF0dGFjaGVkIHRvLlxucmVxdWlyZSgncGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvJyArXG4gICAgJ3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLm1vZHVsZS50cycpO1xucmVxdWlyZSgnQXBwLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS9uYXZiYXIvJyArXG4gICAgJ3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1uYXZiYXItYnJlYWRjcnVtYi5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlL25hdmJhci8nICtcbiAgICAndG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLW5hdmJhci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLycgK1xuICAgICd0b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS5jb250cm9sbGVyLnRzJyk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnRyb2xsZXIgZm9yIHRoZSB0b3BpY3MgbGlzdCB2aWV3ZXIuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi90b3BpYy9FZGl0YWJsZVRvcGljQmFja2VuZEFwaVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLycgK1xuICAgICd0b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS5jb25zdGFudHMuYWpzLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3RvcGljc0xpc3QnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBnZXRUb3BpY1N1bW1hcmllczogJyZ0b3BpY1N1bW1hcmllcycsXG4gICAgICAgICAgICAgICAgY2FuRGVsZXRlVG9waWM6ICcmdXNlckNhbkRlbGV0ZVRvcGljJyxcbiAgICAgICAgICAgICAgICBzZWxlY3RlZFRvcGljSWRzOiAnPSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS90b3BpY3MtbGlzdC8nICtcbiAgICAgICAgICAgICAgICAndG9waWNzLWxpc3QuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyR1aWJNb2RhbCcsICckcm9vdFNjb3BlJywgJ0VkaXRhYmxlVG9waWNCYWNrZW5kQXBpU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ0FsZXJ0c1NlcnZpY2UnLCAnRVZFTlRfVE9QSUNTX0FORF9TS0lMTFNfREFTSEJPQVJEX1JFSU5JVElBTElaRUQnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbCwgJHJvb3RTY29wZSwgRWRpdGFibGVUb3BpY0JhY2tlbmRBcGlTZXJ2aWNlLCBBbGVydHNTZXJ2aWNlLCBFVkVOVF9UT1BJQ1NfQU5EX1NLSUxMU19EQVNIQk9BUkRfUkVJTklUSUFMSVpFRCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBcyBhZGRpdGlvbmFsIHN0b3JpZXMgYXJlIG5vdCBzdXBwb3J0ZWQgaW5pdGlhbGx5LCBpdCdzIG5vdFxuICAgICAgICAgICAgICAgICAgICAvLyBiZWluZyBzaG93biwgZm9yIG5vdy5cbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLlRPUElDX0hFQURJTkdTID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgJ25hbWUnLCAnc3VidG9waWNfY291bnQnLCAnc2tpbGxfY291bnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2Nhbm9uaWNhbF9zdG9yeV9jb3VudCcsICd0b3BpY19zdGF0dXMnXG4gICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5nZXRUb3BpY0VkaXRvclVybCA9IGZ1bmN0aW9uICh0b3BpY0lkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJy90b3BpY19lZGl0b3IvJyArIHRvcGljSWQ7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RUb3BpYyA9IGZ1bmN0aW9uICh0b3BpY0lkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLnNlbGVjdGVkVG9waWNJZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLnNlbGVjdGVkVG9waWNJZHMuaW5kZXhPZih0b3BpY0lkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkVG9waWNJZHMucHVzaCh0b3BpY0lkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5kZWxldGVUb3BpYyA9IGZ1bmN0aW9uICh0b3BpY0lkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbW9kYWxJbnN0YW5jZSA9ICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS90ZW1wbGF0ZXMvJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkZWxldGUtdG9waWMtbW9kYWwudGVtcGxhdGUuaHRtbCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tkcm9wOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29uZmlybURlbGV0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNhbmNlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5kaXNtaXNzKCdjYW5jZWwnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGFsSW5zdGFuY2UucmVzdWx0LnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRhYmxlVG9waWNCYWNrZW5kQXBpU2VydmljZS5kZWxldGVUb3BpYyh0b3BpY0lkKS50aGVuKGZ1bmN0aW9uIChzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEVWRU5UX1RPUElDU19BTkRfU0tJTExTX0RBU0hCT0FSRF9SRUlOSVRJQUxJWkVEKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKGVycm9yIHx8ICdUaGVyZSB3YXMgYW4gZXJyb3Igd2hlbiBkZWxldGluZyB0aGUgdG9waWMuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iXSwic291cmNlUm9vdCI6IiJ9