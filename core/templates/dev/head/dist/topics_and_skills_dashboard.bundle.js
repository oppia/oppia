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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.controller.ts","about~admin~app~collection_editor~collection_player~contact~creator_dashboard~donate~email_dashboard~c1e50cc0"]);
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

/***/ "./core/templates/dev/head/components/entity-creation-services/skill-creation/skill-creation.service.ts":
/*!**************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/entity-creation-services/skill-creation/skill-creation.service.ts ***!
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
 * @fileoverview Functionality for creating a new skill.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('entityCreationServicesModule').factory('SkillCreationService', [
    '$http', '$rootScope', '$timeout', '$window', 'AlertsService',
    'UrlInterpolationService',
    function ($http, $rootScope, $timeout, $window, AlertsService, UrlInterpolationService) {
        var CREATE_NEW_SKILL_URL_TEMPLATE = ('/skill_editor/<skill_id>');
        var skillCreationInProgress = false;
        return {
            createNewSkill: function (description, linkedTopicIds) {
                if (skillCreationInProgress) {
                    return;
                }
                skillCreationInProgress = true;
                AlertsService.clearWarnings();
                $rootScope.loadingMessage = 'Creating skill';
                $http.post('/skill_editor_handler/create_new', {
                    description: description,
                    linked_topic_ids: linkedTopicIds
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

/***/ "./core/templates/dev/head/components/entity-creation-services/topic-creation/topic-creation.service.ts":
/*!**************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/entity-creation-services/topic-creation/topic-creation.service.ts ***!
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
 * @fileoverview Modal and functionality for the create topic button.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('entityCreationServicesModule').factory('TopicCreationService', [
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
                    templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topics-and-skills-dashboard-page/' +
                        'topics-and-skills-dashboard-page-templates/' +
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
oppia.constant('EDITABLE_SKILL_DATA_URL_TEMPLATE', '/skill_editor_handler/data/<skill_id>');
oppia.constant('SKILL_EDITOR_QUESTION_URL_TEMPLATE', '/skill_editor_question_handler/<skill_id>?cursor=<cursor>');
oppia.factory('EditableSkillBackendApiService', [
    '$http', '$q', 'UrlInterpolationService',
    'EDITABLE_SKILL_DATA_URL_TEMPLATE', 'SKILL_EDITOR_QUESTION_URL_TEMPLATE',
    function ($http, $q, UrlInterpolationService, EDITABLE_SKILL_DATA_URL_TEMPLATE, SKILL_EDITOR_QUESTION_URL_TEMPLATE) {
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
        var _fetchQuestions = function (skillId, cursor, successCallback, errorCallback) {
            var questionsDataUrl = UrlInterpolationService.interpolateUrl(SKILL_EDITOR_QUESTION_URL_TEMPLATE, {
                skill_id: skillId,
                cursor: cursor ? cursor : ''
            });
            $http.get(questionsDataUrl).then(function (response) {
                var questionSummaries = angular.copy(response.data.question_summary_dicts);
                var nextCursor = response.data.next_start_cursor;
                if (successCallback) {
                    successCallback({
                        questionSummaries: questionSummaries,
                        nextCursor: nextCursor
                    });
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
            updateSkill: function (skillId, skillVersion, commitMessage, changeList) {
                return $q(function (resolve, reject) {
                    _updateSkill(skillId, skillVersion, commitMessage, changeList, resolve, reject);
                });
            },
            fetchQuestions: function (skillId, cursor) {
                return $q(function (resolve, reject) {
                    _fetchQuestions(skillId, cursor, resolve, reject);
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
oppia.constant('TOPIC_EDITOR_STORY_URL_TEMPLATE', '/topic_editor_story_handler/<topic_id>');
oppia.constant('TOPIC_EDITOR_QUESTION_URL_TEMPLATE', '/topic_editor_question_handler/<topic_id>?cursor=<cursor>');
oppia.factory('EditableTopicBackendApiService', [
    '$http', '$q', 'UrlInterpolationService',
    'EDITABLE_TOPIC_DATA_URL_TEMPLATE', 'SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE',
    'TOPIC_EDITOR_QUESTION_URL_TEMPLATE', 'TOPIC_EDITOR_STORY_URL_TEMPLATE',
    function ($http, $q, UrlInterpolationService, EDITABLE_TOPIC_DATA_URL_TEMPLATE, SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE, TOPIC_EDITOR_QUESTION_URL_TEMPLATE, TOPIC_EDITOR_STORY_URL_TEMPLATE) {
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
        var _fetchQuestions = function (topicId, cursor, successCallback, errorCallback) {
            var questionsDataUrl = UrlInterpolationService.interpolateUrl(TOPIC_EDITOR_QUESTION_URL_TEMPLATE, {
                topic_id: topicId,
                cursor: cursor ? cursor : ''
            });
            $http.get(questionsDataUrl).then(function (response) {
                var questionSummaries = angular.copy(response.data.question_summary_dicts);
                var nextCursor = response.data.next_start_cursor;
                if (successCallback) {
                    successCallback({
                        questionSummaries: questionSummaries,
                        nextCursor: nextCursor
                    });
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
            fetchQuestions: function (topicId, cursor) {
                return $q(function (resolve, reject) {
                    _fetchQuestions(topicId, cursor, resolve, reject);
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

/***/ "./core/templates/dev/head/domain/topics_and_skills_dashboard/TopicsAndSkillsDashboardBackendApiService.ts":
/*!*****************************************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/topics_and_skills_dashboard/TopicsAndSkillsDashboardBackendApiService.ts ***!
  \*****************************************************************************************************************/
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
 * @fileoverview Service to retrieve information of topics and skills dashboard
  from the backend and to merge skills from the dashboard.
 */
oppia.constant('MERGE_SKILLS_URL', '/merge_skills_handler');
oppia.factory('TopicsAndSkillsDashboardBackendApiService', [
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

/***/ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/select-topics/select-topics.directive.ts":
/*!*****************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topics-and-skills-dashboard-page/select-topics/select-topics.directive.ts ***!
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
 * @fileoverview Directive for the select topics viewer.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('selectTopicsModule').directive('selectTopics', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {
                getTopicSummaries: '&topicSummaries',
                selectedTopicIds: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topics-and-skills-dashboard-page/select-topics/' +
                'select-topics.directive.html'),
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
 * @fileoverview Directive for the skills list viewer.
 */
__webpack_require__(/*! pages/topics-and-skills-dashboard-page/select-topics/select-topics.directive.ts */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/select-topics/select-topics.directive.ts");
__webpack_require__(/*! domain/skill/EditableSkillBackendApiService.ts */ "./core/templates/dev/head/domain/skill/EditableSkillBackendApiService.ts");
__webpack_require__(/*! domain/topic/EditableTopicBackendApiService.ts */ "./core/templates/dev/head/domain/topic/EditableTopicBackendApiService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('skillsListModule').directive('skillsList', [
    '$http', 'AlertsService', 'UrlInterpolationService',
    function ($http, AlertsService, UrlInterpolationService) {
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
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topics-and-skills-dashboard-page/' +
                                'topics-and-skills-dashboard-page-templates/' +
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
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topics-and-skills-dashboard-page/' +
                                'topics-and-skills-dashboard-page-templates/' +
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
                                    new_uncategorized_skill_id: skillId,
                                    change_affects_subtopic_page: false
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
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topics-and-skills-dashboard-page/' +
                                'topics-and-skills-dashboard-page-templates/' +
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

/***/ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page-navbar-breadcrumb/topics-and-skills-dashboard-page-navbar-breadcrumb.directive.ts":
/*!*******************************************************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page-navbar-breadcrumb/topics-and-skills-dashboard-page-navbar-breadcrumb.directive.ts ***!
  \*******************************************************************************************************************************************************************************************/
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
angular.module('topicsAndSkillsDashboardNavbarBreadcrumbModule').directive('topicsAndSkillsDashboardNavbarBreadcrumb', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topics-and-skills-dashboard-page/' +
                'topics-and-skills-dashboard-page-navbar-breadcrumb/' +
                'topics-and-skills-dashboard-page-navbar-breadcrumb.directive.html'),
            controller: [
                function () { }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page-navbar/topics-and-skills-dashboard-page-navbar.directive.ts":
/*!*********************************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page-navbar/topics-and-skills-dashboard-page-navbar.directive.ts ***!
  \*********************************************************************************************************************************************************************/
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
__webpack_require__(/*! components/entity-creation-services/skill-creation/skill-creation.service.ts */ "./core/templates/dev/head/components/entity-creation-services/skill-creation/skill-creation.service.ts");
__webpack_require__(/*! components/entity-creation-services/topic-creation/topic-creation.service.ts */ "./core/templates/dev/head/components/entity-creation-services/topic-creation/topic-creation.service.ts");
__webpack_require__(/*! domain/topic/EditableTopicBackendApiService.ts */ "./core/templates/dev/head/domain/topic/EditableTopicBackendApiService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('topicsAndSkillsDashboardNavbarModule').directive('topicsAndSkillsDashboardNavbar', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topics-and-skills-dashboard-page/' +
                'topics-and-skills-dashboard-page-navbar/' +
                'topics-and-skills-dashboard-page-navbar.directive.html'),
            controller: [
                '$scope', '$rootScope', '$uibModal', 'TopicCreationService',
                'SkillCreationService', 'EVENT_TYPE_TOPIC_CREATION_ENABLED',
                'EVENT_TYPE_SKILL_CREATION_ENABLED', 'EditableTopicBackendApiService',
                'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
                function ($scope, $rootScope, $uibModal, TopicCreationService, SkillCreationService, EVENT_TYPE_TOPIC_CREATION_ENABLED, EVENT_TYPE_SKILL_CREATION_ENABLED, EditableTopicBackendApiService, EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED) {
                    $scope.createTopic = function () {
                        TopicCreationService.createNewTopic();
                    };
                    $scope.createSkill = function () {
                        $uibModal.open({
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topics-and-skills-dashboard-page/' +
                                'topics-and-skills-dashboard-page-templates/' +
                                'create-new-skill-modal.template.html'),
                            backdrop: 'static',
                            controller: [
                                '$scope', '$uibModalInstance',
                                function ($scope, $uibModalInstance) {
                                    $scope.newSkillDescription = '';
                                    $scope.createNewSkill = function () {
                                        $uibModalInstance.close({
                                            description: $scope.newSkillDescription
                                        });
                                    };
                                    $scope.cancel = function () {
                                        $uibModalInstance.dismiss('cancel');
                                    };
                                }
                            ]
                        }).result.then(function (result) {
                            SkillCreationService.createNewSkill(result.description, []);
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
__webpack_require__(/*! components/common-layout-directives/background-banner/background-banner.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/background-banner/background-banner.directive.ts");
__webpack_require__(/*! pages/topics-and-skills-dashboard-page/skills-list/skills-list.directive.ts */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/skills-list/skills-list.directive.ts");
__webpack_require__(/*! pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page-navbar-breadcrumb/topics-and-skills-dashboard-page-navbar-breadcrumb.directive.ts */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page-navbar-breadcrumb/topics-and-skills-dashboard-page-navbar-breadcrumb.directive.ts");
__webpack_require__(/*! pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page-navbar/topics-and-skills-dashboard-page-navbar.directive.ts */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page-navbar/topics-and-skills-dashboard-page-navbar.directive.ts");
__webpack_require__(/*! pages/topics-and-skills-dashboard-page/topics-list/topics-list.directive.ts */ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-list/topics-list.directive.ts");
__webpack_require__(/*! components/entity-creation-services/skill-creation/skill-creation.service.ts */ "./core/templates/dev/head/components/entity-creation-services/skill-creation/skill-creation.service.ts");
__webpack_require__(/*! components/entity-creation-services/topic-creation/topic-creation.service.ts */ "./core/templates/dev/head/components/entity-creation-services/topic-creation/topic-creation.service.ts");
__webpack_require__(/*! domain/topics_and_skills_dashboard/TopicsAndSkillsDashboardBackendApiService.ts */ "./core/templates/dev/head/domain/topics_and_skills_dashboard/TopicsAndSkillsDashboardBackendApiService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('topicsAndSkillsDashboardModule').controller('TopicsAndSkillsDashboard', [
    '$http', '$rootScope', '$scope', '$uibModal', '$window',
    'AlertsService', 'SkillCreationService',
    'TopicCreationService', 'TopicsAndSkillsDashboardBackendApiService',
    'UrlInterpolationService',
    'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
    'EVENT_TYPE_SKILL_CREATION_ENABLED',
    'EVENT_TYPE_TOPIC_CREATION_ENABLED',
    'FATAL_ERROR_CODES',
    function ($http, $rootScope, $scope, $uibModal, $window, AlertsService, SkillCreationService, TopicCreationService, TopicsAndSkillsDashboardBackendApiService, UrlInterpolationService, EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED, EVENT_TYPE_SKILL_CREATION_ENABLED, EVENT_TYPE_TOPIC_CREATION_ENABLED, FATAL_ERROR_CODES) {
        $scope.TAB_NAME_TOPICS = 'topics';
        $scope.TAB_NAME_UNTRIAGED_SKILLS = 'untriagedSkills';
        $scope.TAB_NAME_UNPUBLISHED_SKILLS = 'unpublishedSkills';
        var _initDashboard = function () {
            TopicsAndSkillsDashboardBackendApiService.fetchDashboardData().then(function (response) {
                $scope.topicSummaries = response.data.topic_summary_dicts;
                $scope.editableTopicSummaries = $scope.topicSummaries.filter(function (summary) {
                    return summary.can_edit_topic === true;
                });
                $scope.untriagedSkillSummaries =
                    response.data.untriaged_skill_summary_dicts;
                $scope.mergeableSkillSummaries =
                    response.data.mergeable_skill_summary_dicts;
                $scope.unpublishedSkillSummaries =
                    response.data.unpublished_skill_summary_dicts;
                $scope.activeTab = $scope.TAB_NAME_TOPICS;
                $scope.userCanCreateTopic = response.data.can_create_topic;
                $scope.userCanCreateSkill = response.data.can_create_skill;
                $rootScope.$broadcast(EVENT_TYPE_TOPIC_CREATION_ENABLED, $scope.userCanCreateTopic);
                $rootScope.$broadcast(EVENT_TYPE_SKILL_CREATION_ENABLED, $scope.userCanCreateSkill);
                $scope.userCanDeleteTopic = response.data.can_delete_topic;
                $scope.userCanDeleteSkill = response.data.can_delete_skill;
                if ($scope.topicSummaries.length === 0 &&
                    $scope.untriagedSkillSummaries.length !== 0) {
                    $scope.activeTab = $scope.TAB_NAME_UNTRIAGED_SKILLS;
                }
                else if ($scope.topicSummaries.length === 0 &&
                    $scope.unpublishedSkillSummaries.length !== 0) {
                    $scope.activeTab = $scope.TAB_NAME_UNPUBLISHED_SKILLS;
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
        $scope.isTopicTabHelpTextVisible = function () {
            return (($scope.topicSummaries.length === 0) &&
                ($scope.untriagedSkillSummaries.length > 0 ||
                    $scope.unpublishedSkillSummaries.length > 0));
        };
        $scope.isSkillsTabHelpTextVisible = function () {
            return (($scope.untriagedSkillSummaries.length === 0) &&
                ($scope.topicSummaries.length > 0) &&
                ($scope.unpublishedSkillSummaries.length === 0));
        };
        $scope.setActiveTab = function (tabName) {
            $scope.activeTab = tabName;
        };
        $scope.createTopic = function () {
            TopicCreationService.createNewTopic();
        };
        $scope.createSkill = function () {
            $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topics-and-skills-dashboard-page/' +
                    'topics-and-skills-dashboard-page-templates/' +
                    'create-new-skill-modal.template.html'),
                backdrop: 'static',
                controller: [
                    '$scope', '$uibModalInstance',
                    function ($scope, $uibModalInstance) {
                        $scope.newSkillDescription = '';
                        $scope.createNewSkill = function () {
                            $uibModalInstance.close({
                                description: $scope.newSkillDescription
                            });
                        };
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss('cancel');
                        };
                    }
                ]
            }).result.then(function (result) {
                SkillCreationService.createNewSkill(result.description);
            });
        };
        _initDashboard();
        $scope.$on(EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED, _initDashboard);
    }
]);


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
 * @fileoverview Directive for the topics list viewer.
 */
__webpack_require__(/*! domain/topic/EditableTopicBackendApiService.ts */ "./core/templates/dev/head/domain/topic/EditableTopicBackendApiService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('topicsListModule').directive('topicsList', [
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
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/topics-and-skills-dashboard-page/' +
                                'topics-and-skills-dashboard-page-templates/' +
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvYmFja2dyb3VuZC1iYW5uZXIvYmFja2dyb3VuZC1iYW5uZXIuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZW50aXR5LWNyZWF0aW9uLXNlcnZpY2VzL3NraWxsLWNyZWF0aW9uL3NraWxsLWNyZWF0aW9uLnNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9lbnRpdHktY3JlYXRpb24tc2VydmljZXMvdG9waWMtY3JlYXRpb24vdG9waWMtY3JlYXRpb24uc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vc2tpbGwvRWRpdGFibGVTa2lsbEJhY2tlbmRBcGlTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi90b3BpYy9FZGl0YWJsZVRvcGljQmFja2VuZEFwaVNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3RvcGljc19hbmRfc2tpbGxzX2Rhc2hib2FyZC9Ub3BpY3NBbmRTa2lsbHNEYXNoYm9hcmRCYWNrZW5kQXBpU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS9zZWxlY3QtdG9waWNzL3NlbGVjdC10b3BpY3MuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlL3NraWxscy1saXN0L3NraWxscy1saXN0LmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS1uYXZiYXItYnJlYWRjcnVtYi90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS1uYXZiYXItYnJlYWRjcnVtYi5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UtbmF2YmFyL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLW5hdmJhci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UuY29udHJvbGxlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS90b3BpY3MtbGlzdC90b3BpY3MtbGlzdC5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0JBQVEsb0JBQW9CO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQWlCLDRCQUE0QjtBQUM3QztBQUNBO0FBQ0EsMEJBQWtCLDJCQUEyQjtBQUM3QztBQUNBO0FB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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2xMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxnSUFBZ0Q7QUFDeEQsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQsbUJBQU8sQ0FBQyxzRkFBMkI7QUFDbkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCO0FBQ0EsNkJBQTZCO0FBQzdCLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoidG9waWNzX2FuZF9za2lsbHNfZGFzaGJvYXJkLmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIGluc3RhbGwgYSBKU09OUCBjYWxsYmFjayBmb3IgY2h1bmsgbG9hZGluZ1xuIFx0ZnVuY3Rpb24gd2VicGFja0pzb25wQ2FsbGJhY2soZGF0YSkge1xuIFx0XHR2YXIgY2h1bmtJZHMgPSBkYXRhWzBdO1xuIFx0XHR2YXIgbW9yZU1vZHVsZXMgPSBkYXRhWzFdO1xuIFx0XHR2YXIgZXhlY3V0ZU1vZHVsZXMgPSBkYXRhWzJdO1xuXG4gXHRcdC8vIGFkZCBcIm1vcmVNb2R1bGVzXCIgdG8gdGhlIG1vZHVsZXMgb2JqZWN0LFxuIFx0XHQvLyB0aGVuIGZsYWcgYWxsIFwiY2h1bmtJZHNcIiBhcyBsb2FkZWQgYW5kIGZpcmUgY2FsbGJhY2tcbiBcdFx0dmFyIG1vZHVsZUlkLCBjaHVua0lkLCBpID0gMCwgcmVzb2x2ZXMgPSBbXTtcbiBcdFx0Zm9yKDtpIDwgY2h1bmtJZHMubGVuZ3RoOyBpKyspIHtcbiBcdFx0XHRjaHVua0lkID0gY2h1bmtJZHNbaV07XG4gXHRcdFx0aWYoaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdKSB7XG4gXHRcdFx0XHRyZXNvbHZlcy5wdXNoKGluc3RhbGxlZENodW5rc1tjaHVua0lkXVswXSk7XG4gXHRcdFx0fVxuIFx0XHRcdGluc3RhbGxlZENodW5rc1tjaHVua0lkXSA9IDA7XG4gXHRcdH1cbiBcdFx0Zm9yKG1vZHVsZUlkIGluIG1vcmVNb2R1bGVzKSB7XG4gXHRcdFx0aWYoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vcmVNb2R1bGVzLCBtb2R1bGVJZCkpIHtcbiBcdFx0XHRcdG1vZHVsZXNbbW9kdWxlSWRdID0gbW9yZU1vZHVsZXNbbW9kdWxlSWRdO1xuIFx0XHRcdH1cbiBcdFx0fVxuIFx0XHRpZihwYXJlbnRKc29ucEZ1bmN0aW9uKSBwYXJlbnRKc29ucEZ1bmN0aW9uKGRhdGEpO1xuXG4gXHRcdHdoaWxlKHJlc29sdmVzLmxlbmd0aCkge1xuIFx0XHRcdHJlc29sdmVzLnNoaWZ0KCkoKTtcbiBcdFx0fVxuXG4gXHRcdC8vIGFkZCBlbnRyeSBtb2R1bGVzIGZyb20gbG9hZGVkIGNodW5rIHRvIGRlZmVycmVkIGxpc3RcbiBcdFx0ZGVmZXJyZWRNb2R1bGVzLnB1c2guYXBwbHkoZGVmZXJyZWRNb2R1bGVzLCBleGVjdXRlTW9kdWxlcyB8fCBbXSk7XG5cbiBcdFx0Ly8gcnVuIGRlZmVycmVkIG1vZHVsZXMgd2hlbiBhbGwgY2h1bmtzIHJlYWR5XG4gXHRcdHJldHVybiBjaGVja0RlZmVycmVkTW9kdWxlcygpO1xuIFx0fTtcbiBcdGZ1bmN0aW9uIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCkge1xuIFx0XHR2YXIgcmVzdWx0O1xuIFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgZGVmZXJyZWRNb2R1bGVzLmxlbmd0aDsgaSsrKSB7XG4gXHRcdFx0dmFyIGRlZmVycmVkTW9kdWxlID0gZGVmZXJyZWRNb2R1bGVzW2ldO1xuIFx0XHRcdHZhciBmdWxmaWxsZWQgPSB0cnVlO1xuIFx0XHRcdGZvcih2YXIgaiA9IDE7IGogPCBkZWZlcnJlZE1vZHVsZS5sZW5ndGg7IGorKykge1xuIFx0XHRcdFx0dmFyIGRlcElkID0gZGVmZXJyZWRNb2R1bGVbal07XG4gXHRcdFx0XHRpZihpbnN0YWxsZWRDaHVua3NbZGVwSWRdICE9PSAwKSBmdWxmaWxsZWQgPSBmYWxzZTtcbiBcdFx0XHR9XG4gXHRcdFx0aWYoZnVsZmlsbGVkKSB7XG4gXHRcdFx0XHRkZWZlcnJlZE1vZHVsZXMuc3BsaWNlKGktLSwgMSk7XG4gXHRcdFx0XHRyZXN1bHQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IGRlZmVycmVkTW9kdWxlWzBdKTtcbiBcdFx0XHR9XG4gXHRcdH1cbiBcdFx0cmV0dXJuIHJlc3VsdDtcbiBcdH1cblxuIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gb2JqZWN0IHRvIHN0b3JlIGxvYWRlZCBhbmQgbG9hZGluZyBjaHVua3NcbiBcdC8vIHVuZGVmaW5lZCA9IGNodW5rIG5vdCBsb2FkZWQsIG51bGwgPSBjaHVuayBwcmVsb2FkZWQvcHJlZmV0Y2hlZFxuIFx0Ly8gUHJvbWlzZSA9IGNodW5rIGxvYWRpbmcsIDAgPSBjaHVuayBsb2FkZWRcbiBcdHZhciBpbnN0YWxsZWRDaHVua3MgPSB7XG4gXHRcdFwidG9waWNzX2FuZF9za2lsbHNfZGFzaGJvYXJkXCI6IDBcbiBcdH07XG5cbiBcdHZhciBkZWZlcnJlZE1vZHVsZXMgPSBbXTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0dmFyIGpzb25wQXJyYXkgPSB3aW5kb3dbXCJ3ZWJwYWNrSnNvbnBcIl0gPSB3aW5kb3dbXCJ3ZWJwYWNrSnNvbnBcIl0gfHwgW107XG4gXHR2YXIgb2xkSnNvbnBGdW5jdGlvbiA9IGpzb25wQXJyYXkucHVzaC5iaW5kKGpzb25wQXJyYXkpO1xuIFx0anNvbnBBcnJheS5wdXNoID0gd2VicGFja0pzb25wQ2FsbGJhY2s7XG4gXHRqc29ucEFycmF5ID0ganNvbnBBcnJheS5zbGljZSgpO1xuIFx0Zm9yKHZhciBpID0gMDsgaSA8IGpzb25wQXJyYXkubGVuZ3RoOyBpKyspIHdlYnBhY2tKc29ucENhbGxiYWNrKGpzb25wQXJyYXlbaV0pO1xuIFx0dmFyIHBhcmVudEpzb25wRnVuY3Rpb24gPSBvbGRKc29ucEZ1bmN0aW9uO1xuXG5cbiBcdC8vIGFkZCBlbnRyeSBtb2R1bGUgdG8gZGVmZXJyZWQgbGlzdFxuIFx0ZGVmZXJyZWRNb2R1bGVzLnB1c2goW1wiLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS5jb250cm9sbGVyLnRzXCIsXCJhYm91dH5hZG1pbn5hcHB+Y29sbGVjdGlvbl9lZGl0b3J+Y29sbGVjdGlvbl9wbGF5ZXJ+Y29udGFjdH5jcmVhdG9yX2Rhc2hib2FyZH5kb25hdGV+ZW1haWxfZGFzaGJvYXJkfmMxZTUwY2MwXCJdKTtcbiBcdC8vIHJ1biBkZWZlcnJlZCBtb2R1bGVzIHdoZW4gcmVhZHlcbiBcdHJldHVybiBjaGVja0RlZmVycmVkTW9kdWxlcygpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBiYWNrZ3JvdW5kIGJhbm5lci5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ2JhY2tncm91bmRCYW5uZXJNb2R1bGUnKS5kaXJlY3RpdmUoJ2JhY2tncm91bmRCYW5uZXInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9iYWNrZ3JvdW5kLWJhbm5lci8nICtcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1iYW5uZXIuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvc3NpYmxlQmFubmVyRmlsZW5hbWVzID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2Jhbm5lckEuc3ZnJywgJ2Jhbm5lckIuc3ZnJywgJ2Jhbm5lckMuc3ZnJywgJ2Jhbm5lckQuc3ZnJ1xuICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYmFubmVySW1hZ2VGaWxlbmFtZSA9IHBvc3NpYmxlQmFubmVyRmlsZW5hbWVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHBvc3NpYmxlQmFubmVyRmlsZW5hbWVzLmxlbmd0aCldO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmJhbm5lckltYWdlRmlsZVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldFN0YXRpY0ltYWdlVXJsKCcvYmFja2dyb3VuZC8nICsgYmFubmVySW1hZ2VGaWxlbmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGdW5jdGlvbmFsaXR5IGZvciBjcmVhdGluZyBhIG5ldyBza2lsbC5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ2VudGl0eUNyZWF0aW9uU2VydmljZXNNb2R1bGUnKS5mYWN0b3J5KCdTa2lsbENyZWF0aW9uU2VydmljZScsIFtcbiAgICAnJGh0dHAnLCAnJHJvb3RTY29wZScsICckdGltZW91dCcsICckd2luZG93JywgJ0FsZXJ0c1NlcnZpY2UnLFxuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkcm9vdFNjb3BlLCAkdGltZW91dCwgJHdpbmRvdywgQWxlcnRzU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgdmFyIENSRUFURV9ORVdfU0tJTExfVVJMX1RFTVBMQVRFID0gKCcvc2tpbGxfZWRpdG9yLzxza2lsbF9pZD4nKTtcbiAgICAgICAgdmFyIHNraWxsQ3JlYXRpb25JblByb2dyZXNzID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjcmVhdGVOZXdTa2lsbDogZnVuY3Rpb24gKGRlc2NyaXB0aW9uLCBsaW5rZWRUb3BpY0lkcykge1xuICAgICAgICAgICAgICAgIGlmIChza2lsbENyZWF0aW9uSW5Qcm9ncmVzcykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNraWxsQ3JlYXRpb25JblByb2dyZXNzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmNsZWFyV2FybmluZ3MoKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdNZXNzYWdlID0gJ0NyZWF0aW5nIHNraWxsJztcbiAgICAgICAgICAgICAgICAkaHR0cC5wb3N0KCcvc2tpbGxfZWRpdG9yX2hhbmRsZXIvY3JlYXRlX25ldycsIHtcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgICAgICBsaW5rZWRfdG9waWNfaWRzOiBsaW5rZWRUb3BpY0lkc1xuICAgICAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICR3aW5kb3cubG9jYXRpb24gPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChDUkVBVEVfTkVXX1NLSUxMX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNraWxsX2lkOiByZXNwb25zZS5kYXRhLnNraWxsSWRcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9LCAxNTApO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2RhbCBhbmQgZnVuY3Rpb25hbGl0eSBmb3IgdGhlIGNyZWF0ZSB0b3BpYyBidXR0b24uXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdlbnRpdHlDcmVhdGlvblNlcnZpY2VzTW9kdWxlJykuZmFjdG9yeSgnVG9waWNDcmVhdGlvblNlcnZpY2UnLCBbXG4gICAgJyRodHRwJywgJyRyb290U2NvcGUnLCAnJHRpbWVvdXQnLCAnJHVpYk1vZGFsJywgJyR3aW5kb3cnLCAnQWxlcnRzU2VydmljZScsXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsICRyb290U2NvcGUsICR0aW1lb3V0LCAkdWliTW9kYWwsICR3aW5kb3csIEFsZXJ0c1NlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHZhciBUT1BJQ19FRElUT1JfVVJMX1RFTVBMQVRFID0gJy90b3BpY19lZGl0b3IvPHRvcGljX2lkPic7XG4gICAgICAgIHZhciB0b3BpY0NyZWF0aW9uSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY3JlYXRlTmV3VG9waWM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAodG9waWNDcmVhdGlvbkluUHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgbW9kYWxJbnN0YW5jZSA9ICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAndG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UtdGVtcGxhdGVzLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ25ldy10b3BpYy1uYW1lLWVkaXRvci50ZW1wbGF0ZS5odG1sJyksXG4gICAgICAgICAgICAgICAgICAgIGJhY2tkcm9wOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyR1aWJNb2RhbEluc3RhbmNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnRvcGljTmFtZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1RvcGljTmFtZUVtcHR5ID0gZnVuY3Rpb24gKHRvcGljTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKHRvcGljTmFtZSA9PT0gJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNhdmUgPSBmdW5jdGlvbiAodG9waWNOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmNsb3NlKHRvcGljTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5kaXNtaXNzKCdjYW5jZWwnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbW9kYWxJbnN0YW5jZS5yZXN1bHQudGhlbihmdW5jdGlvbiAodG9waWNOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0b3BpY05hbWUgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignVG9waWMgbmFtZSBjYW5ub3QgYmUgZW1wdHknKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0b3BpY0NyZWF0aW9uSW5Qcm9ncmVzcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuY2xlYXJXYXJuaW5ncygpO1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdNZXNzYWdlID0gJ0NyZWF0aW5nIHRvcGljJztcbiAgICAgICAgICAgICAgICAgICAgJGh0dHAucG9zdCgnL3RvcGljX2VkaXRvcl9oYW5kbGVyL2NyZWF0ZV9uZXcnLCB7IG5hbWU6IHRvcGljTmFtZSB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHdpbmRvdy5sb2NhdGlvbiA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKFRPUElDX0VESVRPUl9VUkxfVEVNUExBVEUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9waWNfaWQ6IHJlc3BvbnNlLmRhdGEudG9waWNJZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgMTUwKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0byBzZW5kIGNoYW5nZXMgdG8gYSBza2lsbCB0byB0aGUgYmFja2VuZC5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xub3BwaWEuY29uc3RhbnQoJ0VESVRBQkxFX1NLSUxMX0RBVEFfVVJMX1RFTVBMQVRFJywgJy9za2lsbF9lZGl0b3JfaGFuZGxlci9kYXRhLzxza2lsbF9pZD4nKTtcbm9wcGlhLmNvbnN0YW50KCdTS0lMTF9FRElUT1JfUVVFU1RJT05fVVJMX1RFTVBMQVRFJywgJy9za2lsbF9lZGl0b3JfcXVlc3Rpb25faGFuZGxlci88c2tpbGxfaWQ+P2N1cnNvcj08Y3Vyc29yPicpO1xub3BwaWEuZmFjdG9yeSgnRWRpdGFibGVTa2lsbEJhY2tlbmRBcGlTZXJ2aWNlJywgW1xuICAgICckaHR0cCcsICckcScsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgJ0VESVRBQkxFX1NLSUxMX0RBVEFfVVJMX1RFTVBMQVRFJywgJ1NLSUxMX0VESVRPUl9RVUVTVElPTl9VUkxfVEVNUExBVEUnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJHEsIFVybEludGVycG9sYXRpb25TZXJ2aWNlLCBFRElUQUJMRV9TS0lMTF9EQVRBX1VSTF9URU1QTEFURSwgU0tJTExfRURJVE9SX1FVRVNUSU9OX1VSTF9URU1QTEFURSkge1xuICAgICAgICB2YXIgX2ZldGNoU2tpbGwgPSBmdW5jdGlvbiAoc2tpbGxJZCwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgc2tpbGxEYXRhVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoRURJVEFCTEVfU0tJTExfREFUQV9VUkxfVEVNUExBVEUsIHtcbiAgICAgICAgICAgICAgICBza2lsbF9pZDogc2tpbGxJZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkaHR0cC5nZXQoc2tpbGxEYXRhVXJsKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHZhciBza2lsbCA9IGFuZ3VsYXIuY29weShyZXNwb25zZS5kYXRhLnNraWxsKTtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhza2lsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrKGVycm9yUmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfdXBkYXRlU2tpbGwgPSBmdW5jdGlvbiAoc2tpbGxJZCwgc2tpbGxWZXJzaW9uLCBjb21taXRNZXNzYWdlLCBjaGFuZ2VMaXN0LCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBlZGl0YWJsZVNraWxsRGF0YVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKEVESVRBQkxFX1NLSUxMX0RBVEFfVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgc2tpbGxfaWQ6IHNraWxsSWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIHB1dERhdGEgPSB7XG4gICAgICAgICAgICAgICAgdmVyc2lvbjogc2tpbGxWZXJzaW9uLFxuICAgICAgICAgICAgICAgIGNvbW1pdF9tZXNzYWdlOiBjb21taXRNZXNzYWdlLFxuICAgICAgICAgICAgICAgIGNoYW5nZV9kaWN0czogY2hhbmdlTGlzdFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICRodHRwLnB1dChlZGl0YWJsZVNraWxsRGF0YVVybCwgcHV0RGF0YSkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGUgcmV0dXJuZWQgZGF0YSBpcyBhbiB1cGRhdGVkIHNraWxsIGRpY3QuXG4gICAgICAgICAgICAgICAgdmFyIHNraWxsID0gYW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEuc2tpbGwpO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHNraWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3JSZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9mZXRjaFF1ZXN0aW9ucyA9IGZ1bmN0aW9uIChza2lsbElkLCBjdXJzb3IsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIHF1ZXN0aW9uc0RhdGFVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChTS0lMTF9FRElUT1JfUVVFU1RJT05fVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgc2tpbGxfaWQ6IHNraWxsSWQsXG4gICAgICAgICAgICAgICAgY3Vyc29yOiBjdXJzb3IgPyBjdXJzb3IgOiAnJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkaHR0cC5nZXQocXVlc3Rpb25zRGF0YVVybCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgcXVlc3Rpb25TdW1tYXJpZXMgPSBhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YS5xdWVzdGlvbl9zdW1tYXJ5X2RpY3RzKTtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dEN1cnNvciA9IHJlc3BvbnNlLmRhdGEubmV4dF9zdGFydF9jdXJzb3I7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soe1xuICAgICAgICAgICAgICAgICAgICAgICAgcXVlc3Rpb25TdW1tYXJpZXM6IHF1ZXN0aW9uU3VtbWFyaWVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dEN1cnNvcjogbmV4dEN1cnNvclxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3JSZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9kZWxldGVTa2lsbCA9IGZ1bmN0aW9uIChza2lsbElkLCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBza2lsbERhdGFVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChFRElUQUJMRV9TS0lMTF9EQVRBX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgIHNraWxsX2lkOiBza2lsbElkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICRodHRwWydkZWxldGUnXShza2lsbERhdGFVcmwpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2Uuc3RhdHVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3JSZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZldGNoU2tpbGw6IGZ1bmN0aW9uIChza2lsbElkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgX2ZldGNoU2tpbGwoc2tpbGxJZCwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1cGRhdGVTa2lsbDogZnVuY3Rpb24gKHNraWxsSWQsIHNraWxsVmVyc2lvbiwgY29tbWl0TWVzc2FnZSwgY2hhbmdlTGlzdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF91cGRhdGVTa2lsbChza2lsbElkLCBza2lsbFZlcnNpb24sIGNvbW1pdE1lc3NhZ2UsIGNoYW5nZUxpc3QsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmV0Y2hRdWVzdGlvbnM6IGZ1bmN0aW9uIChza2lsbElkLCBjdXJzb3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfZmV0Y2hRdWVzdGlvbnMoc2tpbGxJZCwgY3Vyc29yLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRlbGV0ZVNraWxsOiBmdW5jdGlvbiAoc2tpbGxJZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF9kZWxldGVTa2lsbChza2lsbElkLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIHNlbmQgY2hhbmdlcyB0byBhIHRvcGljIHRvIHRoZSBiYWNrZW5kLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5vcHBpYS5jb25zdGFudCgnVE9QSUNfRURJVE9SX1NUT1JZX1VSTF9URU1QTEFURScsICcvdG9waWNfZWRpdG9yX3N0b3J5X2hhbmRsZXIvPHRvcGljX2lkPicpO1xub3BwaWEuY29uc3RhbnQoJ1RPUElDX0VESVRPUl9RVUVTVElPTl9VUkxfVEVNUExBVEUnLCAnL3RvcGljX2VkaXRvcl9xdWVzdGlvbl9oYW5kbGVyLzx0b3BpY19pZD4/Y3Vyc29yPTxjdXJzb3I+Jyk7XG5vcHBpYS5mYWN0b3J5KCdFZGl0YWJsZVRvcGljQmFja2VuZEFwaVNlcnZpY2UnLCBbXG4gICAgJyRodHRwJywgJyRxJywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICAnRURJVEFCTEVfVE9QSUNfREFUQV9VUkxfVEVNUExBVEUnLCAnU1VCVE9QSUNfUEFHRV9FRElUT1JfREFUQV9VUkxfVEVNUExBVEUnLFxuICAgICdUT1BJQ19FRElUT1JfUVVFU1RJT05fVVJMX1RFTVBMQVRFJywgJ1RPUElDX0VESVRPUl9TVE9SWV9VUkxfVEVNUExBVEUnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJHEsIFVybEludGVycG9sYXRpb25TZXJ2aWNlLCBFRElUQUJMRV9UT1BJQ19EQVRBX1VSTF9URU1QTEFURSwgU1VCVE9QSUNfUEFHRV9FRElUT1JfREFUQV9VUkxfVEVNUExBVEUsIFRPUElDX0VESVRPUl9RVUVTVElPTl9VUkxfVEVNUExBVEUsIFRPUElDX0VESVRPUl9TVE9SWV9VUkxfVEVNUExBVEUpIHtcbiAgICAgICAgdmFyIF9mZXRjaFRvcGljID0gZnVuY3Rpb24gKHRvcGljSWQsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIHRvcGljRGF0YVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKEVESVRBQkxFX1RPUElDX0RBVEFfVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgdG9waWNfaWQ6IHRvcGljSWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGh0dHAuZ2V0KHRvcGljRGF0YVVybCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSByZXNwb25zZSBpcyBwYXNzZWQgYXMgYSBkaWN0IHdpdGggMiBmaWVsZHMgYW5kIG5vdCBhcyAyXG4gICAgICAgICAgICAgICAgICAgIC8vIHBhcmFtZXRlcnMsIGJlY2F1c2UgdGhlIHN1Y2Nlc3NDYWxsYmFjayBpcyBjYWxsZWQgYXMgdGhlIHJlc29sdmVcbiAgICAgICAgICAgICAgICAgICAgLy8gY2FsbGJhY2sgZnVuY3Rpb24gaW4gJHEgaW4gZmV0Y2hUb3BpYygpLCBhbmQgYWNjb3JkaW5nIHRvIGl0c1xuICAgICAgICAgICAgICAgICAgICAvLyBkb2N1bWVudGF0aW9uIChodHRwczovL2RvY3MuYW5ndWxhcmpzLm9yZy9hcGkvbmcvc2VydmljZS8kcSksXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlc29sdmUgb3IgcmVqZWN0IGNhbiBoYXZlIG9ubHkgYSBzaW5nbGUgcGFyYW1ldGVyLlxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soe1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9waWNEaWN0OiBhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YS50b3BpY19kaWN0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNraWxsSWRUb0Rlc2NyaXB0aW9uRGljdDogYW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEuc2tpbGxfaWRfdG9fZGVzY3JpcHRpb25fZGljdClcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrKGVycm9yUmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfZmV0Y2hTdG9yaWVzID0gZnVuY3Rpb24gKHRvcGljSWQsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIHN0b3JpZXNEYXRhVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoVE9QSUNfRURJVE9SX1NUT1JZX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgIHRvcGljX2lkOiB0b3BpY0lkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICRodHRwLmdldChzdG9yaWVzRGF0YVVybCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2Fub25pY2FsU3RvcnlTdW1tYXJpZXMgPSBhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YS5jYW5vbmljYWxfc3Rvcnlfc3VtbWFyeV9kaWN0cyk7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soY2Fub25pY2FsU3RvcnlTdW1tYXJpZXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvclJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2ZldGNoUXVlc3Rpb25zID0gZnVuY3Rpb24gKHRvcGljSWQsIGN1cnNvciwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgcXVlc3Rpb25zRGF0YVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKFRPUElDX0VESVRPUl9RVUVTVElPTl9VUkxfVEVNUExBVEUsIHtcbiAgICAgICAgICAgICAgICB0b3BpY19pZDogdG9waWNJZCxcbiAgICAgICAgICAgICAgICBjdXJzb3I6IGN1cnNvciA/IGN1cnNvciA6ICcnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICRodHRwLmdldChxdWVzdGlvbnNEYXRhVXJsKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHZhciBxdWVzdGlvblN1bW1hcmllcyA9IGFuZ3VsYXIuY29weShyZXNwb25zZS5kYXRhLnF1ZXN0aW9uX3N1bW1hcnlfZGljdHMpO1xuICAgICAgICAgICAgICAgIHZhciBuZXh0Q3Vyc29yID0gcmVzcG9uc2UuZGF0YS5uZXh0X3N0YXJ0X2N1cnNvcjtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayh7XG4gICAgICAgICAgICAgICAgICAgICAgICBxdWVzdGlvblN1bW1hcmllczogcXVlc3Rpb25TdW1tYXJpZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0Q3Vyc29yOiBuZXh0Q3Vyc29yXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvclJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2ZldGNoU3VidG9waWNQYWdlID0gZnVuY3Rpb24gKHRvcGljSWQsIHN1YnRvcGljSWQsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIHN1YnRvcGljUGFnZURhdGFVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChTVUJUT1BJQ19QQUdFX0VESVRPUl9EQVRBX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgIHRvcGljX2lkOiB0b3BpY0lkLFxuICAgICAgICAgICAgICAgIHN1YnRvcGljX2lkOiBzdWJ0b3BpY0lkLnRvU3RyaW5nKClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGh0dHAuZ2V0KHN1YnRvcGljUGFnZURhdGFVcmwpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRvcGljID0gYW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEuc3VidG9waWNfcGFnZSk7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2sodG9waWMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvclJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2RlbGV0ZVRvcGljID0gZnVuY3Rpb24gKHRvcGljSWQsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIHRvcGljRGF0YVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKEVESVRBQkxFX1RPUElDX0RBVEFfVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgdG9waWNfaWQ6IHRvcGljSWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGh0dHBbJ2RlbGV0ZSddKHRvcGljRGF0YVVybCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZS5zdGF0dXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvclJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX3VwZGF0ZVRvcGljID0gZnVuY3Rpb24gKHRvcGljSWQsIHRvcGljVmVyc2lvbiwgY29tbWl0TWVzc2FnZSwgY2hhbmdlTGlzdCwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgZWRpdGFibGVUb3BpY0RhdGFVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChFRElUQUJMRV9UT1BJQ19EQVRBX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgIHRvcGljX2lkOiB0b3BpY0lkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBwdXREYXRhID0ge1xuICAgICAgICAgICAgICAgIHZlcnNpb246IHRvcGljVmVyc2lvbixcbiAgICAgICAgICAgICAgICBjb21taXRfbWVzc2FnZTogY29tbWl0TWVzc2FnZSxcbiAgICAgICAgICAgICAgICB0b3BpY19hbmRfc3VidG9waWNfcGFnZV9jaGFuZ2VfZGljdHM6IGNoYW5nZUxpc3RcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAkaHR0cC5wdXQoZWRpdGFibGVUb3BpY0RhdGFVcmwsIHB1dERhdGEpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAvLyBIZXJlIGFsc28sIGEgZGljdCB3aXRoIDIgZmllbGRzIGFyZSBwYXNzZWQgaW5zdGVhZCBvZiBqdXN0IDJcbiAgICAgICAgICAgICAgICAgICAgLy8gcGFyYW1ldGVycywgZHVlIHRvIHRoZSBzYW1lIHJlYXNvbiBhcyB3cml0dGVuIGZvciBfZmV0Y2hUb3BpYygpLlxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soe1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9waWNEaWN0OiBhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YS50b3BpY19kaWN0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNraWxsSWRUb0Rlc2NyaXB0aW9uRGljdDogYW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEuc2tpbGxfaWRfdG9fZGVzY3JpcHRpb25fZGljdClcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrKGVycm9yUmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmZXRjaFRvcGljOiBmdW5jdGlvbiAodG9waWNJZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF9mZXRjaFRvcGljKHRvcGljSWQsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmV0Y2hTdG9yaWVzOiBmdW5jdGlvbiAodG9waWNJZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF9mZXRjaFN0b3JpZXModG9waWNJZCwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZXRjaFF1ZXN0aW9uczogZnVuY3Rpb24gKHRvcGljSWQsIGN1cnNvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF9mZXRjaFF1ZXN0aW9ucyh0b3BpY0lkLCBjdXJzb3IsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmV0Y2hTdWJ0b3BpY1BhZ2U6IGZ1bmN0aW9uICh0b3BpY0lkLCBzdWJ0b3BpY0lkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgX2ZldGNoU3VidG9waWNQYWdlKHRvcGljSWQsIHN1YnRvcGljSWQsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBVcGRhdGVzIGEgdG9waWMgaW4gdGhlIGJhY2tlbmQgd2l0aCB0aGUgcHJvdmlkZWQgdG9waWMgSUQuXG4gICAgICAgICAgICAgKiBUaGUgY2hhbmdlcyBvbmx5IGFwcGx5IHRvIHRoZSB0b3BpYyBvZiB0aGUgZ2l2ZW4gdmVyc2lvbiBhbmQgdGhlXG4gICAgICAgICAgICAgKiByZXF1ZXN0IHRvIHVwZGF0ZSB0aGUgdG9waWMgd2lsbCBmYWlsIGlmIHRoZSBwcm92aWRlZCB0b3BpY1xuICAgICAgICAgICAgICogdmVyc2lvbiBpcyBvbGRlciB0aGFuIHRoZSBjdXJyZW50IHZlcnNpb24gc3RvcmVkIGluIHRoZSBiYWNrZW5kLiBCb3RoXG4gICAgICAgICAgICAgKiB0aGUgY2hhbmdlcyBhbmQgdGhlIG1lc3NhZ2UgdG8gYXNzb2NpYXRlIHdpdGggdGhvc2UgY2hhbmdlcyBhcmUgdXNlZFxuICAgICAgICAgICAgICogdG8gY29tbWl0IGEgY2hhbmdlIHRvIHRoZSB0b3BpYy4gVGhlIG5ldyB0b3BpYyBpcyBwYXNzZWQgdG9cbiAgICAgICAgICAgICAqIHRoZSBzdWNjZXNzIGNhbGxiYWNrLCBpZiBvbmUgaXMgcHJvdmlkZWQgdG8gdGhlIHJldHVybmVkIHByb21pc2VcbiAgICAgICAgICAgICAqIG9iamVjdC4gRXJyb3JzIGFyZSBwYXNzZWQgdG8gdGhlIGVycm9yIGNhbGxiYWNrLCBpZiBvbmUgaXMgcHJvdmlkZWQuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHVwZGF0ZVRvcGljOiBmdW5jdGlvbiAodG9waWNJZCwgdG9waWNWZXJzaW9uLCBjb21taXRNZXNzYWdlLCBjaGFuZ2VMaXN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgX3VwZGF0ZVRvcGljKHRvcGljSWQsIHRvcGljVmVyc2lvbiwgY29tbWl0TWVzc2FnZSwgY2hhbmdlTGlzdCwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZWxldGVUb3BpYzogZnVuY3Rpb24gKHRvcGljSWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfZGVsZXRlVG9waWModG9waWNJZCwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0byByZXRyaWV2ZSBpbmZvcm1hdGlvbiBvZiB0b3BpY3MgYW5kIHNraWxscyBkYXNoYm9hcmRcbiAgZnJvbSB0aGUgYmFja2VuZCBhbmQgdG8gbWVyZ2Ugc2tpbGxzIGZyb20gdGhlIGRhc2hib2FyZC5cbiAqL1xub3BwaWEuY29uc3RhbnQoJ01FUkdFX1NLSUxMU19VUkwnLCAnL21lcmdlX3NraWxsc19oYW5kbGVyJyk7XG5vcHBpYS5mYWN0b3J5KCdUb3BpY3NBbmRTa2lsbHNEYXNoYm9hcmRCYWNrZW5kQXBpU2VydmljZScsIFtcbiAgICAnJGh0dHAnLCAnTUVSR0VfU0tJTExTX1VSTCcsIGZ1bmN0aW9uICgkaHR0cCwgTUVSR0VfU0tJTExTX1VSTCkge1xuICAgICAgICB2YXIgX2ZldGNoRGFzaGJvYXJkRGF0YSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy90b3BpY3NfYW5kX3NraWxsc19kYXNoYm9hcmQvZGF0YScpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX21lcmdlU2tpbGxzID0gZnVuY3Rpb24gKG9sZFNraWxsSWQsIG5ld1NraWxsSWQpIHtcbiAgICAgICAgICAgIHZhciBtZXJnZVNraWxsc0RhdGEgPSB7XG4gICAgICAgICAgICAgICAgb2xkX3NraWxsX2lkOiBvbGRTa2lsbElkLFxuICAgICAgICAgICAgICAgIG5ld19za2lsbF9pZDogbmV3U2tpbGxJZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KE1FUkdFX1NLSUxMU19VUkwsIG1lcmdlU2tpbGxzRGF0YSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmZXRjaERhc2hib2FyZERhdGE6IF9mZXRjaERhc2hib2FyZERhdGEsXG4gICAgICAgICAgICBtZXJnZVNraWxsczogX21lcmdlU2tpbGxzXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIHNlbGVjdCB0b3BpY3Mgdmlld2VyLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnc2VsZWN0VG9waWNzTW9kdWxlJykuZGlyZWN0aXZlKCdzZWxlY3RUb3BpY3MnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBnZXRUb3BpY1N1bW1hcmllczogJyZ0b3BpY1N1bW1hcmllcycsXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRUb3BpY0lkczogJz0nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2Uvc2VsZWN0LXRvcGljcy8nICtcbiAgICAgICAgICAgICAgICAnc2VsZWN0LXRvcGljcy5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJHVpYk1vZGFsJywgJyRyb290U2NvcGUnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbCwgJHJvb3RTY29wZSkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudG9waWNTdW1tYXJpZXMgPSAkc2NvcGUuZ2V0VG9waWNTdW1tYXJpZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdE9yRGVzZWxlY3RUb3BpYyA9IGZ1bmN0aW9uICh0b3BpY0lkLCBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkc2NvcGUudG9waWNTdW1tYXJpZXNbaW5kZXhdLmlzU2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0ZWRUb3BpY0lkcy5wdXNoKHRvcGljSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS50b3BpY1N1bW1hcmllc1tpbmRleF0uaXNTZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaWRJbmRleCA9ICRzY29wZS5zZWxlY3RlZFRvcGljSWRzLmluZGV4T2YodG9waWNJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkVG9waWNJZHMuc3BsaWNlKGlkSW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS50b3BpY1N1bW1hcmllc1tpbmRleF0uaXNTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgc2tpbGxzIGxpc3Qgdmlld2VyLlxuICovXG5yZXF1aXJlKCdwYWdlcy90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS9zZWxlY3QtdG9waWNzLycgK1xuICAgICdzZWxlY3QtdG9waWNzLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3NraWxsL0VkaXRhYmxlU2tpbGxCYWNrZW5kQXBpU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3RvcGljL0VkaXRhYmxlVG9waWNCYWNrZW5kQXBpU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ3NraWxsc0xpc3RNb2R1bGUnKS5kaXJlY3RpdmUoJ3NraWxsc0xpc3QnLCBbXG4gICAgJyRodHRwJywgJ0FsZXJ0c1NlcnZpY2UnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgQWxlcnRzU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIGdldFNraWxsU3VtbWFyaWVzOiAnJnNraWxsU3VtbWFyaWVzJyxcbiAgICAgICAgICAgICAgICBnZXRFZGl0YWJsZVRvcGljU3VtbWFyaWVzOiAnJmVkaXRhYmxlVG9waWNTdW1tYXJpZXMnLFxuICAgICAgICAgICAgICAgIGlzSW5Nb2RhbDogJyZpbk1vZGFsJyxcbiAgICAgICAgICAgICAgICBnZXRNZXJnZWFibGVTa2lsbFN1bW1hcmllczogJyZtZXJnZWFibGVTa2lsbFN1bW1hcmllcycsXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRTa2lsbDogJz0nLFxuICAgICAgICAgICAgICAgIGNhbkRlbGV0ZVNraWxsOiAnJnVzZXJDYW5EZWxldGVTa2lsbCcsXG4gICAgICAgICAgICAgICAgY2FuQ3JlYXRlU2tpbGw6ICcmdXNlckNhbkNyZWF0ZVNraWxsJyxcbiAgICAgICAgICAgICAgICBpc1VucHVibGlzaGVkU2tpbGw6ICcmdW5wdWJsaXNoZWRTa2lsbCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS9za2lsbHMtbGlzdC8nICtcbiAgICAgICAgICAgICAgICAnc2tpbGxzLWxpc3QuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyR1aWJNb2RhbCcsICckcm9vdFNjb3BlJywgJ0VkaXRhYmxlVG9waWNCYWNrZW5kQXBpU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ0VkaXRhYmxlU2tpbGxCYWNrZW5kQXBpU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ1RvcGljc0FuZFNraWxsc0Rhc2hib2FyZEJhY2tlbmRBcGlTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnRVZFTlRfVE9QSUNTX0FORF9TS0lMTFNfREFTSEJPQVJEX1JFSU5JVElBTElaRUQnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbCwgJHJvb3RTY29wZSwgRWRpdGFibGVUb3BpY0JhY2tlbmRBcGlTZXJ2aWNlLCBFZGl0YWJsZVNraWxsQmFja2VuZEFwaVNlcnZpY2UsIFRvcGljc0FuZFNraWxsc0Rhc2hib2FyZEJhY2tlbmRBcGlTZXJ2aWNlLCBFVkVOVF9UT1BJQ1NfQU5EX1NLSUxMU19EQVNIQk9BUkRfUkVJTklUSUFMSVpFRCkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuU0tJTExfSEVBRElOR1MgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAnZGVzY3JpcHRpb24nLCAnd29ya2VkX2V4YW1wbGVzX2NvdW50JywgJ21pc2NvbmNlcHRpb25fY291bnQnXG4gICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5oaWdobGlnaHRlZEluZGV4ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmhpZ2hsaWdodENvbHVtbnMgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5oaWdobGlnaHRlZEluZGV4ID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS51bmhpZ2hsaWdodENvbHVtbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaGlnaGxpZ2h0ZWRJbmRleCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5nZXRTa2lsbEVkaXRvclVybCA9IGZ1bmN0aW9uIChza2lsbElkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJy9za2lsbF9lZGl0b3IvJyArIHNraWxsSWQ7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5kZWxldGVTa2lsbCA9IGZ1bmN0aW9uIChza2lsbElkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbW9kYWxJbnN0YW5jZSA9ICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLXRlbXBsYXRlcy8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2RlbGV0ZS1za2lsbC1tb2RhbC50ZW1wbGF0ZS5odG1sJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2Ryb3A6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyR1aWJNb2RhbEluc3RhbmNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJHVpYk1vZGFsSW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jb25maXJtRGVsZXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbW9kYWxJbnN0YW5jZS5yZXN1bHQudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRWRpdGFibGVTa2lsbEJhY2tlbmRBcGlTZXJ2aWNlLmRlbGV0ZVNraWxsKHNraWxsSWQpLnRoZW4oZnVuY3Rpb24gKHN0YXR1cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoRVZFTlRfVE9QSUNTX0FORF9TS0lMTFNfREFTSEJPQVJEX1JFSU5JVElBTElaRUQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN1Y2Nlc3NUb2FzdCA9ICdUaGUgc2tpbGwgaGFzIGJlZW4gZGVsZXRlZC4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkU3VjY2Vzc01lc3NhZ2Uoc3VjY2Vzc1RvYXN0LCAxMDAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYXNzaWduU2tpbGxUb1RvcGljID0gZnVuY3Rpb24gKHNraWxsSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0b3BpY1N1bW1hcmllcyA9ICRzY29wZS5nZXRFZGl0YWJsZVRvcGljU3VtbWFyaWVzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbW9kYWxJbnN0YW5jZSA9ICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLXRlbXBsYXRlcy8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2Fzc2lnbi1za2lsbC10by10b3BpYy1tb2RhbC50ZW1wbGF0ZS5odG1sJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2Ryb3A6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyR1aWJNb2RhbEluc3RhbmNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJHVpYk1vZGFsSW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS50b3BpY1N1bW1hcmllcyA9IHRvcGljU3VtbWFyaWVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkVG9waWNJZHMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5kb25lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmNsb3NlKCRzY29wZS5zZWxlY3RlZFRvcGljSWRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbW9kYWxJbnN0YW5jZS5yZXN1bHQudGhlbihmdW5jdGlvbiAodG9waWNJZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2hhbmdlTGlzdCA9IFt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbWQ6ICdhZGRfdW5jYXRlZ29yaXplZF9za2lsbF9pZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdfdW5jYXRlZ29yaXplZF9za2lsbF9pZDogc2tpbGxJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZV9hZmZlY3RzX3N1YnRvcGljX3BhZ2U6IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0b3BpY1N1bW1hcmllcyA9ICRzY29wZS5nZXRFZGl0YWJsZVRvcGljU3VtbWFyaWVzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b3BpY0lkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmVyc2lvbiA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdG9waWNTdW1tYXJpZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0b3BpY1N1bW1hcmllc1tqXS5pZCA9PT0gdG9waWNJZHNbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFZGl0YWJsZVRvcGljQmFja2VuZEFwaVNlcnZpY2UudXBkYXRlVG9waWModG9waWNJZHNbaV0sIHRvcGljU3VtbWFyaWVzW2pdLnZlcnNpb24sICdBZGRlZCBza2lsbCB3aXRoIGlkICcgKyBza2lsbElkICsgJyB0byB0b3BpYy4nLCBjaGFuZ2VMaXN0KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEVWRU5UX1RPUElDU19BTkRfU0tJTExTX0RBU0hCT0FSRF9SRUlOSVRJQUxJWkVEKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN1Y2Nlc3NUb2FzdCA9ICgnVGhlIHNraWxsIGhhcyBiZWVuIGFzc2lnbmVkIHRvIHRoZSB0b3BpYy4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRTdWNjZXNzTWVzc2FnZShzdWNjZXNzVG9hc3QsIDEwMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RTa2lsbCA9IGZ1bmN0aW9uIChza2lsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkU2tpbGwgPSBza2lsbDtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm1lcmdlU2tpbGwgPSBmdW5jdGlvbiAoc2tpbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBza2lsbFN1bW1hcmllcyA9ICRzY29wZS5nZXRNZXJnZWFibGVTa2lsbFN1bW1hcmllcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1vZGFsSW5zdGFuY2UgPSAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd0b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS10ZW1wbGF0ZXMvJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdtZXJnZS1za2lsbC1tb2RhbC50ZW1wbGF0ZS5odG1sJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2Ryb3A6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyR1aWJNb2RhbEluc3RhbmNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJHVpYk1vZGFsSW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5za2lsbFN1bW1hcmllcyA9IHNraWxsU3VtbWFyaWVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkU2tpbGwgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5kb25lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmNsb3NlKHsgc2tpbGw6IHNraWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdXBlcnNlZGluZ1NraWxsSWQ6ICRzY29wZS5zZWxlY3RlZFNraWxsLmlkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNhbmNlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5kaXNtaXNzKCdjYW5jZWwnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGFsSW5zdGFuY2UucmVzdWx0LnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBza2lsbCA9IHJlc3VsdC5za2lsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3VwZXJzZWRpbmdTa2lsbElkID0gcmVzdWx0LnN1cGVyc2VkaW5nU2tpbGxJZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUcmFuc2ZlciBxdWVzdGlvbnMgZnJvbSB0aGUgb2xkIHNraWxsIHRvIHRoZSBuZXcgc2tpbGwuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgVG9waWNzQW5kU2tpbGxzRGFzaGJvYXJkQmFja2VuZEFwaVNlcnZpY2UubWVyZ2VTa2lsbHMoc2tpbGwuaWQsIHN1cGVyc2VkaW5nU2tpbGxJZCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJyb2FkY2FzdCB3aWxsIHVwZGF0ZSB0aGUgc2tpbGxzIGxpc3QgaW4gdGhlIGRhc2hib2FyZCBzb1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGF0IHRoZSBtZXJnZWQgc2tpbGxzIGFyZSBub3Qgc2hvd24gYW55bW9yZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEVWRU5UX1RPUElDU19BTkRfU0tJTExTX0RBU0hCT0FSRF9SRUlOSVRJQUxJWkVEKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29udHJvbGxlciBmb3IgdGhlIG5hdmJhciBicmVhZGNydW1iIG9mIHRoZSBjb2xsZWN0aW9uIGVkaXRvci5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ3RvcGljc0FuZFNraWxsc0Rhc2hib2FyZE5hdmJhckJyZWFkY3J1bWJNb2R1bGUnKS5kaXJlY3RpdmUoJ3RvcGljc0FuZFNraWxsc0Rhc2hib2FyZE5hdmJhckJyZWFkY3J1bWInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvJyArXG4gICAgICAgICAgICAgICAgJ3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLW5hdmJhci1icmVhZGNydW1iLycgK1xuICAgICAgICAgICAgICAgICd0b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS1uYXZiYXItYnJlYWRjcnVtYi5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHsgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBuYXZiYXIgb2YgdGhlIGNvbGxlY3Rpb24gZWRpdG9yLlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL2VudGl0eS1jcmVhdGlvbi1zZXJ2aWNlcy9za2lsbC1jcmVhdGlvbi8nICtcbiAgICAnc2tpbGwtY3JlYXRpb24uc2VydmljZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9lbnRpdHktY3JlYXRpb24tc2VydmljZXMvdG9waWMtY3JlYXRpb24vJyArXG4gICAgJ3RvcGljLWNyZWF0aW9uLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi90b3BpYy9FZGl0YWJsZVRvcGljQmFja2VuZEFwaVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCd0b3BpY3NBbmRTa2lsbHNEYXNoYm9hcmROYXZiYXJNb2R1bGUnKS5kaXJlY3RpdmUoJ3RvcGljc0FuZFNraWxsc0Rhc2hib2FyZE5hdmJhcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS8nICtcbiAgICAgICAgICAgICAgICAndG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UtbmF2YmFyLycgK1xuICAgICAgICAgICAgICAgICd0b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS1uYXZiYXIuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyRyb290U2NvcGUnLCAnJHVpYk1vZGFsJywgJ1RvcGljQ3JlYXRpb25TZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnU2tpbGxDcmVhdGlvblNlcnZpY2UnLCAnRVZFTlRfVFlQRV9UT1BJQ19DUkVBVElPTl9FTkFCTEVEJyxcbiAgICAgICAgICAgICAgICAnRVZFTlRfVFlQRV9TS0lMTF9DUkVBVElPTl9FTkFCTEVEJywgJ0VkaXRhYmxlVG9waWNCYWNrZW5kQXBpU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ0VWRU5UX1RPUElDU19BTkRfU0tJTExTX0RBU0hCT0FSRF9SRUlOSVRJQUxJWkVEJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkcm9vdFNjb3BlLCAkdWliTW9kYWwsIFRvcGljQ3JlYXRpb25TZXJ2aWNlLCBTa2lsbENyZWF0aW9uU2VydmljZSwgRVZFTlRfVFlQRV9UT1BJQ19DUkVBVElPTl9FTkFCTEVELCBFVkVOVF9UWVBFX1NLSUxMX0NSRUFUSU9OX0VOQUJMRUQsIEVkaXRhYmxlVG9waWNCYWNrZW5kQXBpU2VydmljZSwgRVZFTlRfVE9QSUNTX0FORF9TS0lMTFNfREFTSEJPQVJEX1JFSU5JVElBTElaRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNyZWF0ZVRvcGljID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgVG9waWNDcmVhdGlvblNlcnZpY2UuY3JlYXRlTmV3VG9waWMoKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNyZWF0ZVNraWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UtdGVtcGxhdGVzLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnY3JlYXRlLW5ldy1za2lsbC1tb2RhbC50ZW1wbGF0ZS5odG1sJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2Ryb3A6ICdzdGF0aWMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubmV3U2tpbGxEZXNjcmlwdGlvbiA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNyZWF0ZU5ld1NraWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmNsb3NlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICRzY29wZS5uZXdTa2lsbERlc2NyaXB0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNhbmNlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5kaXNtaXNzKCdjYW5jZWwnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5yZXN1bHQudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgU2tpbGxDcmVhdGlvblNlcnZpY2UuY3JlYXRlTmV3U2tpbGwocmVzdWx0LmRlc2NyaXB0aW9uLCBbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oRVZFTlRfVFlQRV9UT1BJQ19DUkVBVElPTl9FTkFCTEVELCBmdW5jdGlvbiAoZXZ0LCBjYW5DcmVhdGVUb3BpYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnVzZXJDYW5DcmVhdGVUb3BpYyA9IGNhbkNyZWF0ZVRvcGljO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oRVZFTlRfVFlQRV9TS0lMTF9DUkVBVElPTl9FTkFCTEVELCBmdW5jdGlvbiAoZXZ0LCBjYW5DcmVhdGVTa2lsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnVzZXJDYW5DcmVhdGVTa2lsbCA9IGNhbkNyZWF0ZVNraWxsO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnRyb2xsZXJzIGZvciB0aGUgdG9waWNzIGFuZCBza2lsbHMgZGFzaGJvYXJkLlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9iYWNrZ3JvdW5kLWJhbm5lci8nICtcbiAgICAnYmFja2dyb3VuZC1iYW5uZXIuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS9za2lsbHMtbGlzdC8nICtcbiAgICAnc2tpbGxzLWxpc3QuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS8nICtcbiAgICAndG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UtbmF2YmFyLWJyZWFkY3J1bWIvJyArXG4gICAgJ3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLW5hdmJhci1icmVhZGNydW1iLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvJyArXG4gICAgJ3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLW5hdmJhci8nICtcbiAgICAndG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UtbmF2YmFyLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvdG9waWNzLWxpc3QvJyArXG4gICAgJ3RvcGljcy1saXN0LmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9lbnRpdHktY3JlYXRpb24tc2VydmljZXMvc2tpbGwtY3JlYXRpb24vJyArXG4gICAgJ3NraWxsLWNyZWF0aW9uLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZW50aXR5LWNyZWF0aW9uLXNlcnZpY2VzL3RvcGljLWNyZWF0aW9uLycgK1xuICAgICd0b3BpYy1jcmVhdGlvbi5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdG9waWNzX2FuZF9za2lsbHNfZGFzaGJvYXJkLycgK1xuICAgICdUb3BpY3NBbmRTa2lsbHNEYXNoYm9hcmRCYWNrZW5kQXBpU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ3RvcGljc0FuZFNraWxsc0Rhc2hib2FyZE1vZHVsZScpLmNvbnRyb2xsZXIoJ1RvcGljc0FuZFNraWxsc0Rhc2hib2FyZCcsIFtcbiAgICAnJGh0dHAnLCAnJHJvb3RTY29wZScsICckc2NvcGUnLCAnJHVpYk1vZGFsJywgJyR3aW5kb3cnLFxuICAgICdBbGVydHNTZXJ2aWNlJywgJ1NraWxsQ3JlYXRpb25TZXJ2aWNlJyxcbiAgICAnVG9waWNDcmVhdGlvblNlcnZpY2UnLCAnVG9waWNzQW5kU2tpbGxzRGFzaGJvYXJkQmFja2VuZEFwaVNlcnZpY2UnLFxuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgJ0VWRU5UX1RPUElDU19BTkRfU0tJTExTX0RBU0hCT0FSRF9SRUlOSVRJQUxJWkVEJyxcbiAgICAnRVZFTlRfVFlQRV9TS0lMTF9DUkVBVElPTl9FTkFCTEVEJyxcbiAgICAnRVZFTlRfVFlQRV9UT1BJQ19DUkVBVElPTl9FTkFCTEVEJyxcbiAgICAnRkFUQUxfRVJST1JfQ09ERVMnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJHJvb3RTY29wZSwgJHNjb3BlLCAkdWliTW9kYWwsICR3aW5kb3csIEFsZXJ0c1NlcnZpY2UsIFNraWxsQ3JlYXRpb25TZXJ2aWNlLCBUb3BpY0NyZWF0aW9uU2VydmljZSwgVG9waWNzQW5kU2tpbGxzRGFzaGJvYXJkQmFja2VuZEFwaVNlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlLCBFVkVOVF9UT1BJQ1NfQU5EX1NLSUxMU19EQVNIQk9BUkRfUkVJTklUSUFMSVpFRCwgRVZFTlRfVFlQRV9TS0lMTF9DUkVBVElPTl9FTkFCTEVELCBFVkVOVF9UWVBFX1RPUElDX0NSRUFUSU9OX0VOQUJMRUQsIEZBVEFMX0VSUk9SX0NPREVTKSB7XG4gICAgICAgICRzY29wZS5UQUJfTkFNRV9UT1BJQ1MgPSAndG9waWNzJztcbiAgICAgICAgJHNjb3BlLlRBQl9OQU1FX1VOVFJJQUdFRF9TS0lMTFMgPSAndW50cmlhZ2VkU2tpbGxzJztcbiAgICAgICAgJHNjb3BlLlRBQl9OQU1FX1VOUFVCTElTSEVEX1NLSUxMUyA9ICd1bnB1Ymxpc2hlZFNraWxscyc7XG4gICAgICAgIHZhciBfaW5pdERhc2hib2FyZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIFRvcGljc0FuZFNraWxsc0Rhc2hib2FyZEJhY2tlbmRBcGlTZXJ2aWNlLmZldGNoRGFzaGJvYXJkRGF0YSgpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnRvcGljU3VtbWFyaWVzID0gcmVzcG9uc2UuZGF0YS50b3BpY19zdW1tYXJ5X2RpY3RzO1xuICAgICAgICAgICAgICAgICRzY29wZS5lZGl0YWJsZVRvcGljU3VtbWFyaWVzID0gJHNjb3BlLnRvcGljU3VtbWFyaWVzLmZpbHRlcihmdW5jdGlvbiAoc3VtbWFyeSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3VtbWFyeS5jYW5fZWRpdF90b3BpYyA9PT0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAkc2NvcGUudW50cmlhZ2VkU2tpbGxTdW1tYXJpZXMgPVxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnVudHJpYWdlZF9za2lsbF9zdW1tYXJ5X2RpY3RzO1xuICAgICAgICAgICAgICAgICRzY29wZS5tZXJnZWFibGVTa2lsbFN1bW1hcmllcyA9XG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEubWVyZ2VhYmxlX3NraWxsX3N1bW1hcnlfZGljdHM7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnVucHVibGlzaGVkU2tpbGxTdW1tYXJpZXMgPVxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZS5kYXRhLnVucHVibGlzaGVkX3NraWxsX3N1bW1hcnlfZGljdHM7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmFjdGl2ZVRhYiA9ICRzY29wZS5UQUJfTkFNRV9UT1BJQ1M7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnVzZXJDYW5DcmVhdGVUb3BpYyA9IHJlc3BvbnNlLmRhdGEuY2FuX2NyZWF0ZV90b3BpYztcbiAgICAgICAgICAgICAgICAkc2NvcGUudXNlckNhbkNyZWF0ZVNraWxsID0gcmVzcG9uc2UuZGF0YS5jYW5fY3JlYXRlX3NraWxsO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChFVkVOVF9UWVBFX1RPUElDX0NSRUFUSU9OX0VOQUJMRUQsICRzY29wZS51c2VyQ2FuQ3JlYXRlVG9waWMpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChFVkVOVF9UWVBFX1NLSUxMX0NSRUFUSU9OX0VOQUJMRUQsICRzY29wZS51c2VyQ2FuQ3JlYXRlU2tpbGwpO1xuICAgICAgICAgICAgICAgICRzY29wZS51c2VyQ2FuRGVsZXRlVG9waWMgPSByZXNwb25zZS5kYXRhLmNhbl9kZWxldGVfdG9waWM7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnVzZXJDYW5EZWxldGVTa2lsbCA9IHJlc3BvbnNlLmRhdGEuY2FuX2RlbGV0ZV9za2lsbDtcbiAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLnRvcGljU3VtbWFyaWVzLmxlbmd0aCA9PT0gMCAmJlxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudW50cmlhZ2VkU2tpbGxTdW1tYXJpZXMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5hY3RpdmVUYWIgPSAkc2NvcGUuVEFCX05BTUVfVU5UUklBR0VEX1NLSUxMUztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoJHNjb3BlLnRvcGljU3VtbWFyaWVzLmxlbmd0aCA9PT0gMCAmJlxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudW5wdWJsaXNoZWRTa2lsbFN1bW1hcmllcy5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmFjdGl2ZVRhYiA9ICRzY29wZS5UQUJfTkFNRV9VTlBVQkxJU0hFRF9TS0lMTFM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoRkFUQUxfRVJST1JfQ09ERVMuaW5kZXhPZihlcnJvclJlc3BvbnNlLnN0YXR1cykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZygnRmFpbGVkIHRvIGdldCBkYXNoYm9hcmQgZGF0YScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKCdVbmV4cGVjdGVkIGVycm9yIGNvZGUgZnJvbSB0aGUgc2VydmVyLicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuaXNUb3BpY1RhYkhlbHBUZXh0VmlzaWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAoKCRzY29wZS50b3BpY1N1bW1hcmllcy5sZW5ndGggPT09IDApICYmXG4gICAgICAgICAgICAgICAgKCRzY29wZS51bnRyaWFnZWRTa2lsbFN1bW1hcmllcy5sZW5ndGggPiAwIHx8XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS51bnB1Ymxpc2hlZFNraWxsU3VtbWFyaWVzLmxlbmd0aCA+IDApKTtcbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLmlzU2tpbGxzVGFiSGVscFRleHRWaXNpYmxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICgoJHNjb3BlLnVudHJpYWdlZFNraWxsU3VtbWFyaWVzLmxlbmd0aCA9PT0gMCkgJiZcbiAgICAgICAgICAgICAgICAoJHNjb3BlLnRvcGljU3VtbWFyaWVzLmxlbmd0aCA+IDApICYmXG4gICAgICAgICAgICAgICAgKCRzY29wZS51bnB1Ymxpc2hlZFNraWxsU3VtbWFyaWVzLmxlbmd0aCA9PT0gMCkpO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuc2V0QWN0aXZlVGFiID0gZnVuY3Rpb24gKHRhYk5hbWUpIHtcbiAgICAgICAgICAgICRzY29wZS5hY3RpdmVUYWIgPSB0YWJOYW1lO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuY3JlYXRlVG9waWMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBUb3BpY0NyZWF0aW9uU2VydmljZS5jcmVhdGVOZXdUb3BpYygpO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuY3JlYXRlU2tpbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvJyArXG4gICAgICAgICAgICAgICAgICAgICd0b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS10ZW1wbGF0ZXMvJyArXG4gICAgICAgICAgICAgICAgICAgICdjcmVhdGUtbmV3LXNraWxsLW1vZGFsLnRlbXBsYXRlLmh0bWwnKSxcbiAgICAgICAgICAgICAgICBiYWNrZHJvcDogJ3N0YXRpYycsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyR1aWJNb2RhbEluc3RhbmNlJyxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJHVpYk1vZGFsSW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5uZXdTa2lsbERlc2NyaXB0aW9uID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY3JlYXRlTmV3U2tpbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuY2xvc2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJHNjb3BlLm5ld1NraWxsRGVzY3JpcHRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0pLnJlc3VsdC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICBTa2lsbENyZWF0aW9uU2VydmljZS5jcmVhdGVOZXdTa2lsbChyZXN1bHQuZGVzY3JpcHRpb24pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIF9pbml0RGFzaGJvYXJkKCk7XG4gICAgICAgICRzY29wZS4kb24oRVZFTlRfVE9QSUNTX0FORF9TS0lMTFNfREFTSEJPQVJEX1JFSU5JVElBTElaRUQsIF9pbml0RGFzaGJvYXJkKTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgdG9waWNzIGxpc3Qgdmlld2VyLlxuICovXG5yZXF1aXJlKCdkb21haW4vdG9waWMvRWRpdGFibGVUb3BpY0JhY2tlbmRBcGlTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgndG9waWNzTGlzdE1vZHVsZScpLmRpcmVjdGl2ZSgndG9waWNzTGlzdCcsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIGdldFRvcGljU3VtbWFyaWVzOiAnJnRvcGljU3VtbWFyaWVzJyxcbiAgICAgICAgICAgICAgICBjYW5EZWxldGVUb3BpYzogJyZ1c2VyQ2FuRGVsZXRlVG9waWMnLFxuICAgICAgICAgICAgICAgIHNlbGVjdGVkVG9waWNJZHM6ICc9J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlL3RvcGljcy1saXN0LycgK1xuICAgICAgICAgICAgICAgICd0b3BpY3MtbGlzdC5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJHVpYk1vZGFsJywgJyRyb290U2NvcGUnLCAnRWRpdGFibGVUb3BpY0JhY2tlbmRBcGlTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnQWxlcnRzU2VydmljZScsICdFVkVOVF9UT1BJQ1NfQU5EX1NLSUxMU19EQVNIQk9BUkRfUkVJTklUSUFMSVpFRCcsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJHVpYk1vZGFsLCAkcm9vdFNjb3BlLCBFZGl0YWJsZVRvcGljQmFja2VuZEFwaVNlcnZpY2UsIEFsZXJ0c1NlcnZpY2UsIEVWRU5UX1RPUElDU19BTkRfU0tJTExTX0RBU0hCT0FSRF9SRUlOSVRJQUxJWkVEKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFzIGFkZGl0aW9uYWwgc3RvcmllcyBhcmUgbm90IHN1cHBvcnRlZCBpbml0aWFsbHksIGl0J3Mgbm90XG4gICAgICAgICAgICAgICAgICAgIC8vIGJlaW5nIHNob3duLCBmb3Igbm93LlxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuVE9QSUNfSEVBRElOR1MgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAnbmFtZScsICdzdWJ0b3BpY19jb3VudCcsICdza2lsbF9jb3VudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAnY2Fub25pY2FsX3N0b3J5X2NvdW50JywgJ3RvcGljX3N0YXR1cydcbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmdldFRvcGljRWRpdG9yVXJsID0gZnVuY3Rpb24gKHRvcGljSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnL3RvcGljX2VkaXRvci8nICsgdG9waWNJZDtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdFRvcGljID0gZnVuY3Rpb24gKHRvcGljSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuc2VsZWN0ZWRUb3BpY0lkcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuc2VsZWN0ZWRUb3BpY0lkcy5pbmRleE9mKHRvcGljSWQpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0ZWRUb3BpY0lkcy5wdXNoKHRvcGljSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRlbGV0ZVRvcGljID0gZnVuY3Rpb24gKHRvcGljSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtb2RhbEluc3RhbmNlID0gJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UtdGVtcGxhdGVzLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGVsZXRlLXRvcGljLW1vZGFsLnRlbXBsYXRlLmh0bWwnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJHVpYk1vZGFsSW5zdGFuY2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkdWliTW9kYWxJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbmZpcm1EZWxldGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RhbEluc3RhbmNlLnJlc3VsdC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBFZGl0YWJsZVRvcGljQmFja2VuZEFwaVNlcnZpY2UuZGVsZXRlVG9waWModG9waWNJZCkudGhlbihmdW5jdGlvbiAoc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChFVkVOVF9UT1BJQ1NfQU5EX1NLSUxMU19EQVNIQk9BUkRfUkVJTklUSUFMSVpFRCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZyhlcnJvciB8fCAnVGhlcmUgd2FzIGFuIGVycm9yIHdoZW4gZGVsZXRpbmcgdGhlIHRvcGljLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==