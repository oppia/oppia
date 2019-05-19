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
/******/ 		"practice_session": 0
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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/practice-session-page/practice-session-page.controller.ts","about~admin~app~collection_editor~collection_player~contact~creator_dashboard~donate~email_dashboard~c1e50cc0"]);
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

/***/ "./core/templates/dev/head/domain/question/QuestionPlayerBackendApiService.ts":
/*!************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/question/QuestionPlayerBackendApiService.ts ***!
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
 * @fileoverview Service to receive questions for practice given a set of
 * skill_ids.
 */
oppia.constant('QUESTION_PLAYER_URL_TEMPLATE', '/question_player_handler?skill_ids=<skill_ids>&question_count' +
    '=<question_count>&start_cursor=<start_cursor>');
oppia.factory('QuestionPlayerBackendApiService', [
    '$http', '$q', 'UrlInterpolationService', 'QUESTION_PLAYER_URL_TEMPLATE',
    function ($http, $q, UrlInterpolationService, QUESTION_PLAYER_URL_TEMPLATE) {
        var _startCursor = '';
        var _fetchQuestions = function (skillIds, questionCount, resetHistory, successCallback, errorCallback) {
            if (!validateRequestParameters(skillIds, questionCount, errorCallback)) {
                return;
            }
            if (resetHistory) {
                _startCursor = '';
            }
            var questionDataUrl = UrlInterpolationService.interpolateUrl(QUESTION_PLAYER_URL_TEMPLATE, {
                skill_ids: skillIds.join(','),
                question_count: questionCount.toString(),
                start_cursor: _startCursor
            });
            $http.get(questionDataUrl).then(function (response) {
                var questionDicts = angular.copy(response.data.question_dicts);
                _startCursor = response.data.next_start_cursor;
                if (successCallback) {
                    successCallback(questionDicts);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        /**
         * Does basic validation on input.
         */
        var validateRequestParameters = function (skillIds, questionCount, errorCallback) {
            if (!isListOfStrings(skillIds)) {
                errorCallback('Skill ids should be a list of strings');
                return false;
            }
            if (!isInt(questionCount) || questionCount <= 0) {
                errorCallback('Question count has to be a positive integer');
                return false;
            }
            return true;
        };
        /**
         * Checks if given input is a list and has all strings
         */
        var isListOfStrings = function (list) {
            if (!angular.isArray(list)) {
                return false;
            }
            return list.every(function (obj) {
                return angular.isString(obj);
            });
        };
        /**
         * Checks if given input is an integer
         */
        var isInt = function (n) {
            return angular.isNumber(n) && n % 1 === 0;
        };
        /**
         * Returns a list of questions based on the list of skill ids and number
         * of questions requested.
         */
        return {
            fetchQuestions: function (skillIds, questionCount, resetHistory) {
                return $q(function (resolve, reject) {
                    _fetchQuestions(skillIds, questionCount, resetHistory, resolve, reject);
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/practice-session-page/practice-session-page.controller.ts":
/*!*************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/practice-session-page/practice-session-page.controller.ts ***!
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
 * @fileoverview Controllers for the practice session.
 */
__webpack_require__(/*! components/common-layout-directives/background-banner/background-banner.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/background-banner/background-banner.directive.ts");
__webpack_require__(/*! pages/question-player-page/question-player-page.directive.ts */ "./core/templates/dev/head/pages/question-player-page/question-player-page.directive.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
angular.module('practiceSessionPageModule').controller('PracticeSession', [
    '$http', '$rootScope', '$scope', 'AlertsService',
    'UrlInterpolationService', 'UrlService',
    'FATAL_ERROR_CODES', 'PRACTICE_SESSIONS_DATA_URL', 'TOTAL_QUESTIONS',
    function ($http, $rootScope, $scope, AlertsService, UrlInterpolationService, UrlService, FATAL_ERROR_CODES, PRACTICE_SESSIONS_DATA_URL, TOTAL_QUESTIONS) {
        $scope.topicName = UrlService.getTopicNameFromLearnerUrl();
        var _fetchSkillDetails = function () {
            var practiceSessionsDataUrl = UrlInterpolationService.interpolateUrl(PRACTICE_SESSIONS_DATA_URL, {
                topic_name: $scope.topicName
            });
            $http.get(practiceSessionsDataUrl).then(function (result) {
                var questionPlayerConfig = {
                    skillList: result.data.skill_list,
                    questionCount: TOTAL_QUESTIONS
                };
                $scope.questionPlayerConfig = questionPlayerConfig;
            });
        };
        _fetchSkillDetails();
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/question-player-page/question-player-page.directive.ts":
/*!**********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/question-player-page/question-player-page.directive.ts ***!
  \**********************************************************************************************/
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
 * @fileoverview Directive for the questions player directive.
 */
__webpack_require__(/*! domain/question/QuestionPlayerBackendApiService.ts */ "./core/templates/dev/head/domain/question/QuestionPlayerBackendApiService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('questionPlayerPageModule').directive('questionPlayer', [
    '$http', 'UrlInterpolationService',
    function ($http, UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {
                getQuestionPlayerConfig: '&playerConfig',
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/question-player-page/question-player-page.directive.html'),
            controller: [
                '$scope', '$rootScope', 'QuestionPlayerBackendApiService',
                function ($scope, $rootScope, QuestionPlayerBackendApiService) {
                    var questionPlayerConfig = $scope.getQuestionPlayerConfig();
                    QuestionPlayerBackendApiService.fetchQuestions(questionPlayerConfig.skillList, questionPlayerConfig.questionCount, true).then(function (result) {
                        $scope.currentQuestion = 1;
                        $scope.totalQuestions = result.length;
                        $scope.currentProgress = ($scope.currentQuestion * 100 / $scope.totalQuestions);
                    });
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/contextual/UrlService.ts":
/*!*******************************************************************!*\
  !*** ./core/templates/dev/head/services/contextual/UrlService.ts ***!
  \*******************************************************************/
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
 * @fileoverview Service for manipulating the page URL. Also allows
 * functions on $window to be mocked in unit tests.
 */
oppia.factory('UrlService', ['$window', function ($window) {
        return {
            // This function is for testing purposes (to mock $window.location)
            getCurrentLocation: function () {
                return $window.location;
            },
            getCurrentQueryString: function () {
                return this.getCurrentLocation().search;
            },
            /* As params[key] is overwritten, if query string has multiple fieldValues
               for same fieldName, use getQueryFieldValuesAsList(fieldName) to get it
               in array form. */
            getUrlParams: function () {
                var params = {};
                var parts = this.getCurrentQueryString().replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
                    params[decodeURIComponent(key)] = decodeURIComponent(value);
                });
                return params;
            },
            isIframed: function () {
                var pathname = this.getPathname();
                var urlParts = pathname.split('/');
                return urlParts[1] === 'embed';
            },
            getPathname: function () {
                return this.getCurrentLocation().pathname;
            },
            // Topic id should be correctly returned from topic editor as well as
            // story editor, since both have topic id in their url.
            getTopicIdFromUrl: function () {
                var pathname = this.getPathname();
                if (pathname.match(/\/(story|topic)_editor\/(\w|-){12}/g)) {
                    return pathname.split('/')[2];
                }
                throw Error('Invalid topic id url');
            },
            getTopicNameFromLearnerUrl: function () {
                var pathname = this.getPathname();
                if (pathname.match(/\/(story|topic|practice_session)/g)) {
                    return decodeURIComponent(pathname.split('/')[2]);
                }
                throw Error('Invalid URL for topic');
            },
            getStoryIdFromUrl: function () {
                var pathname = this.getPathname();
                if (pathname.match(/\/story_editor(\/(\w|-){12}){2}/g)) {
                    return pathname.split('/')[3];
                }
                throw Error('Invalid story id url');
            },
            getStoryIdInPlayer: function () {
                var query = this.getCurrentQueryString();
                if (query.match(/\?story_id=((\w|-){12})/g)) {
                    return query.split('=')[1];
                }
                return null;
            },
            getSkillIdFromUrl: function () {
                var pathname = this.getPathname();
                var skillId = pathname.split('/')[2];
                if (skillId.length !== 12) {
                    throw Error('Invalid Skill Id');
                }
                return skillId;
            },
            getQueryFieldValuesAsList: function (fieldName) {
                var fieldValues = [];
                if (this.getCurrentQueryString().indexOf('?') > -1) {
                    // Each queryItem return one field-value pair in the url.
                    var queryItems = this.getCurrentQueryString().slice(this.getCurrentQueryString().indexOf('?') + 1).split('&');
                    for (var i = 0; i < queryItems.length; i++) {
                        var currentFieldName = decodeURIComponent(queryItems[i].split('=')[0]);
                        var currentFieldValue = decodeURIComponent(queryItems[i].split('=')[1]);
                        if (currentFieldName === fieldName) {
                            fieldValues.push(currentFieldValue);
                        }
                    }
                }
                return fieldValues;
            },
            addField: function (url, fieldName, fieldValue) {
                var encodedFieldValue = encodeURIComponent(fieldValue);
                var encodedFieldName = encodeURIComponent(fieldName);
                return url + (url.indexOf('?') !== -1 ? '&' : '?') + encodedFieldName +
                    '=' + encodedFieldValue;
            },
            getHash: function () {
                return this.getCurrentLocation().hash;
            }
        };
    }]);


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvYmFja2dyb3VuZC1iYW5uZXIvYmFja2dyb3VuZC1iYW5uZXIuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9xdWVzdGlvbi9RdWVzdGlvblBsYXllckJhY2tlbmRBcGlTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3ByYWN0aWNlLXNlc3Npb24tcGFnZS9wcmFjdGljZS1zZXNzaW9uLXBhZ2UuY29udHJvbGxlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9xdWVzdGlvbi1wbGF5ZXItcGFnZS9xdWVzdGlvbi1wbGF5ZXItcGFnZS5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvY29udGV4dHVhbC9VcmxTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGdCQUFRLG9CQUFvQjtBQUM1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUFpQiw0QkFBNEI7QUFDN0M7QUFDQTtBQUNBLDBCQUFrQiwyQkFBMkI7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFD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QjtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUVBQW1FLEdBQUc7QUFDdEU7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsNERBQTRELEdBQUcsRUFBRSxFQUFFO0FBQ25FO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0Esb0RBQW9ELEdBQUc7QUFDdkQ7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUMsdUJBQXVCO0FBQzFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUsiLCJmaWxlIjoicHJhY3RpY2Vfc2Vzc2lvbi5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBpbnN0YWxsIGEgSlNPTlAgY2FsbGJhY2sgZm9yIGNodW5rIGxvYWRpbmdcbiBcdGZ1bmN0aW9uIHdlYnBhY2tKc29ucENhbGxiYWNrKGRhdGEpIHtcbiBcdFx0dmFyIGNodW5rSWRzID0gZGF0YVswXTtcbiBcdFx0dmFyIG1vcmVNb2R1bGVzID0gZGF0YVsxXTtcbiBcdFx0dmFyIGV4ZWN1dGVNb2R1bGVzID0gZGF0YVsyXTtcblxuIFx0XHQvLyBhZGQgXCJtb3JlTW9kdWxlc1wiIHRvIHRoZSBtb2R1bGVzIG9iamVjdCxcbiBcdFx0Ly8gdGhlbiBmbGFnIGFsbCBcImNodW5rSWRzXCIgYXMgbG9hZGVkIGFuZCBmaXJlIGNhbGxiYWNrXG4gXHRcdHZhciBtb2R1bGVJZCwgY2h1bmtJZCwgaSA9IDAsIHJlc29sdmVzID0gW107XG4gXHRcdGZvcig7aSA8IGNodW5rSWRzLmxlbmd0aDsgaSsrKSB7XG4gXHRcdFx0Y2h1bmtJZCA9IGNodW5rSWRzW2ldO1xuIFx0XHRcdGlmKGluc3RhbGxlZENodW5rc1tjaHVua0lkXSkge1xuIFx0XHRcdFx0cmVzb2x2ZXMucHVzaChpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF1bMF0pO1xuIFx0XHRcdH1cbiBcdFx0XHRpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0gPSAwO1xuIFx0XHR9XG4gXHRcdGZvcihtb2R1bGVJZCBpbiBtb3JlTW9kdWxlcykge1xuIFx0XHRcdGlmKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtb3JlTW9kdWxlcywgbW9kdWxlSWQpKSB7XG4gXHRcdFx0XHRtb2R1bGVzW21vZHVsZUlkXSA9IG1vcmVNb2R1bGVzW21vZHVsZUlkXTtcbiBcdFx0XHR9XG4gXHRcdH1cbiBcdFx0aWYocGFyZW50SnNvbnBGdW5jdGlvbikgcGFyZW50SnNvbnBGdW5jdGlvbihkYXRhKTtcblxuIFx0XHR3aGlsZShyZXNvbHZlcy5sZW5ndGgpIHtcbiBcdFx0XHRyZXNvbHZlcy5zaGlmdCgpKCk7XG4gXHRcdH1cblxuIFx0XHQvLyBhZGQgZW50cnkgbW9kdWxlcyBmcm9tIGxvYWRlZCBjaHVuayB0byBkZWZlcnJlZCBsaXN0XG4gXHRcdGRlZmVycmVkTW9kdWxlcy5wdXNoLmFwcGx5KGRlZmVycmVkTW9kdWxlcywgZXhlY3V0ZU1vZHVsZXMgfHwgW10pO1xuXG4gXHRcdC8vIHJ1biBkZWZlcnJlZCBtb2R1bGVzIHdoZW4gYWxsIGNodW5rcyByZWFkeVxuIFx0XHRyZXR1cm4gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKTtcbiBcdH07XG4gXHRmdW5jdGlvbiBjaGVja0RlZmVycmVkTW9kdWxlcygpIHtcbiBcdFx0dmFyIHJlc3VsdDtcbiBcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGRlZmVycmVkTW9kdWxlcy5sZW5ndGg7IGkrKykge1xuIFx0XHRcdHZhciBkZWZlcnJlZE1vZHVsZSA9IGRlZmVycmVkTW9kdWxlc1tpXTtcbiBcdFx0XHR2YXIgZnVsZmlsbGVkID0gdHJ1ZTtcbiBcdFx0XHRmb3IodmFyIGogPSAxOyBqIDwgZGVmZXJyZWRNb2R1bGUubGVuZ3RoOyBqKyspIHtcbiBcdFx0XHRcdHZhciBkZXBJZCA9IGRlZmVycmVkTW9kdWxlW2pdO1xuIFx0XHRcdFx0aWYoaW5zdGFsbGVkQ2h1bmtzW2RlcElkXSAhPT0gMCkgZnVsZmlsbGVkID0gZmFsc2U7XG4gXHRcdFx0fVxuIFx0XHRcdGlmKGZ1bGZpbGxlZCkge1xuIFx0XHRcdFx0ZGVmZXJyZWRNb2R1bGVzLnNwbGljZShpLS0sIDEpO1xuIFx0XHRcdFx0cmVzdWx0ID0gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSBkZWZlcnJlZE1vZHVsZVswXSk7XG4gXHRcdFx0fVxuIFx0XHR9XG4gXHRcdHJldHVybiByZXN1bHQ7XG4gXHR9XG5cbiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIG9iamVjdCB0byBzdG9yZSBsb2FkZWQgYW5kIGxvYWRpbmcgY2h1bmtzXG4gXHQvLyB1bmRlZmluZWQgPSBjaHVuayBub3QgbG9hZGVkLCBudWxsID0gY2h1bmsgcHJlbG9hZGVkL3ByZWZldGNoZWRcbiBcdC8vIFByb21pc2UgPSBjaHVuayBsb2FkaW5nLCAwID0gY2h1bmsgbG9hZGVkXG4gXHR2YXIgaW5zdGFsbGVkQ2h1bmtzID0ge1xuIFx0XHRcInByYWN0aWNlX3Nlc3Npb25cIjogMFxuIFx0fTtcblxuIFx0dmFyIGRlZmVycmVkTW9kdWxlcyA9IFtdO1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHR2YXIganNvbnBBcnJheSA9IHdpbmRvd1tcIndlYnBhY2tKc29ucFwiXSA9IHdpbmRvd1tcIndlYnBhY2tKc29ucFwiXSB8fCBbXTtcbiBcdHZhciBvbGRKc29ucEZ1bmN0aW9uID0ganNvbnBBcnJheS5wdXNoLmJpbmQoanNvbnBBcnJheSk7XG4gXHRqc29ucEFycmF5LnB1c2ggPSB3ZWJwYWNrSnNvbnBDYWxsYmFjaztcbiBcdGpzb25wQXJyYXkgPSBqc29ucEFycmF5LnNsaWNlKCk7XG4gXHRmb3IodmFyIGkgPSAwOyBpIDwganNvbnBBcnJheS5sZW5ndGg7IGkrKykgd2VicGFja0pzb25wQ2FsbGJhY2soanNvbnBBcnJheVtpXSk7XG4gXHR2YXIgcGFyZW50SnNvbnBGdW5jdGlvbiA9IG9sZEpzb25wRnVuY3Rpb247XG5cblxuIFx0Ly8gYWRkIGVudHJ5IG1vZHVsZSB0byBkZWZlcnJlZCBsaXN0XG4gXHRkZWZlcnJlZE1vZHVsZXMucHVzaChbXCIuL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3ByYWN0aWNlLXNlc3Npb24tcGFnZS9wcmFjdGljZS1zZXNzaW9uLXBhZ2UuY29udHJvbGxlci50c1wiLFwiYWJvdXR+YWRtaW5+YXBwfmNvbGxlY3Rpb25fZWRpdG9yfmNvbGxlY3Rpb25fcGxheWVyfmNvbnRhY3R+Y3JlYXRvcl9kYXNoYm9hcmR+ZG9uYXRlfmVtYWlsX2Rhc2hib2FyZH5jMWU1MGNjMFwiXSk7XG4gXHQvLyBydW4gZGVmZXJyZWQgbW9kdWxlcyB3aGVuIHJlYWR5XG4gXHRyZXR1cm4gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKTtcbiIsIi8vIENvcHlyaWdodCAyMDE1IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgYmFja2dyb3VuZCBiYW5uZXIuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdiYWNrZ3JvdW5kQmFubmVyTW9kdWxlJykuZGlyZWN0aXZlKCdiYWNrZ3JvdW5kQmFubmVyJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvYmFja2dyb3VuZC1iYW5uZXIvJyArXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtYmFubmVyLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3NzaWJsZUJhbm5lckZpbGVuYW1lcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICdiYW5uZXJBLnN2ZycsICdiYW5uZXJCLnN2ZycsICdiYW5uZXJDLnN2ZycsICdiYW5uZXJELnN2ZydcbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJhbm5lckltYWdlRmlsZW5hbWUgPSBwb3NzaWJsZUJhbm5lckZpbGVuYW1lc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBwb3NzaWJsZUJhbm5lckZpbGVuYW1lcy5sZW5ndGgpXTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5iYW5uZXJJbWFnZUZpbGVVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRTdGF0aWNJbWFnZVVybCgnL2JhY2tncm91bmQvJyArIGJhbm5lckltYWdlRmlsZW5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0byByZWNlaXZlIHF1ZXN0aW9ucyBmb3IgcHJhY3RpY2UgZ2l2ZW4gYSBzZXQgb2ZcbiAqIHNraWxsX2lkcy5cbiAqL1xub3BwaWEuY29uc3RhbnQoJ1FVRVNUSU9OX1BMQVlFUl9VUkxfVEVNUExBVEUnLCAnL3F1ZXN0aW9uX3BsYXllcl9oYW5kbGVyP3NraWxsX2lkcz08c2tpbGxfaWRzPiZxdWVzdGlvbl9jb3VudCcgK1xuICAgICc9PHF1ZXN0aW9uX2NvdW50PiZzdGFydF9jdXJzb3I9PHN0YXJ0X2N1cnNvcj4nKTtcbm9wcGlhLmZhY3RvcnkoJ1F1ZXN0aW9uUGxheWVyQmFja2VuZEFwaVNlcnZpY2UnLCBbXG4gICAgJyRodHRwJywgJyRxJywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgJ1FVRVNUSU9OX1BMQVlFUl9VUkxfVEVNUExBVEUnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJHEsIFVybEludGVycG9sYXRpb25TZXJ2aWNlLCBRVUVTVElPTl9QTEFZRVJfVVJMX1RFTVBMQVRFKSB7XG4gICAgICAgIHZhciBfc3RhcnRDdXJzb3IgPSAnJztcbiAgICAgICAgdmFyIF9mZXRjaFF1ZXN0aW9ucyA9IGZ1bmN0aW9uIChza2lsbElkcywgcXVlc3Rpb25Db3VudCwgcmVzZXRIaXN0b3J5LCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmICghdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVycyhza2lsbElkcywgcXVlc3Rpb25Db3VudCwgZXJyb3JDYWxsYmFjaykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVzZXRIaXN0b3J5KSB7XG4gICAgICAgICAgICAgICAgX3N0YXJ0Q3Vyc29yID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcXVlc3Rpb25EYXRhVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoUVVFU1RJT05fUExBWUVSX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgIHNraWxsX2lkczogc2tpbGxJZHMuam9pbignLCcpLFxuICAgICAgICAgICAgICAgIHF1ZXN0aW9uX2NvdW50OiBxdWVzdGlvbkNvdW50LnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgc3RhcnRfY3Vyc29yOiBfc3RhcnRDdXJzb3JcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGh0dHAuZ2V0KHF1ZXN0aW9uRGF0YVVybCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgcXVlc3Rpb25EaWN0cyA9IGFuZ3VsYXIuY29weShyZXNwb25zZS5kYXRhLnF1ZXN0aW9uX2RpY3RzKTtcbiAgICAgICAgICAgICAgICBfc3RhcnRDdXJzb3IgPSByZXNwb25zZS5kYXRhLm5leHRfc3RhcnRfY3Vyc29yO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHF1ZXN0aW9uRGljdHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvclJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogRG9lcyBiYXNpYyB2YWxpZGF0aW9uIG9uIGlucHV0LlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnMgPSBmdW5jdGlvbiAoc2tpbGxJZHMsIHF1ZXN0aW9uQ291bnQsIGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmICghaXNMaXN0T2ZTdHJpbmdzKHNraWxsSWRzKSkge1xuICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soJ1NraWxsIGlkcyBzaG91bGQgYmUgYSBsaXN0IG9mIHN0cmluZ3MnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWlzSW50KHF1ZXN0aW9uQ291bnQpIHx8IHF1ZXN0aW9uQ291bnQgPD0gMCkge1xuICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soJ1F1ZXN0aW9uIGNvdW50IGhhcyB0byBiZSBhIHBvc2l0aXZlIGludGVnZXInKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENoZWNrcyBpZiBnaXZlbiBpbnB1dCBpcyBhIGxpc3QgYW5kIGhhcyBhbGwgc3RyaW5nc1xuICAgICAgICAgKi9cbiAgICAgICAgdmFyIGlzTGlzdE9mU3RyaW5ncyA9IGZ1bmN0aW9uIChsaXN0KSB7XG4gICAgICAgICAgICBpZiAoIWFuZ3VsYXIuaXNBcnJheShsaXN0KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBsaXN0LmV2ZXJ5KGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYW5ndWxhci5pc1N0cmluZyhvYmopO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDaGVja3MgaWYgZ2l2ZW4gaW5wdXQgaXMgYW4gaW50ZWdlclxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIGlzSW50ID0gZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmlzTnVtYmVyKG4pICYmIG4gJSAxID09PSAwO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyBhIGxpc3Qgb2YgcXVlc3Rpb25zIGJhc2VkIG9uIHRoZSBsaXN0IG9mIHNraWxsIGlkcyBhbmQgbnVtYmVyXG4gICAgICAgICAqIG9mIHF1ZXN0aW9ucyByZXF1ZXN0ZWQuXG4gICAgICAgICAqL1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmV0Y2hRdWVzdGlvbnM6IGZ1bmN0aW9uIChza2lsbElkcywgcXVlc3Rpb25Db3VudCwgcmVzZXRIaXN0b3J5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgX2ZldGNoUXVlc3Rpb25zKHNraWxsSWRzLCBxdWVzdGlvbkNvdW50LCByZXNldEhpc3RvcnksIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnRyb2xsZXJzIGZvciB0aGUgcHJhY3RpY2Ugc2Vzc2lvbi5cbiAqL1xucmVxdWlyZSgnY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvYmFja2dyb3VuZC1iYW5uZXIvJyArXG4gICAgJ2JhY2tncm91bmQtYmFubmVyLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvcXVlc3Rpb24tcGxheWVyLXBhZ2UvcXVlc3Rpb24tcGxheWVyLXBhZ2UuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdwcmFjdGljZVNlc3Npb25QYWdlTW9kdWxlJykuY29udHJvbGxlcignUHJhY3RpY2VTZXNzaW9uJywgW1xuICAgICckaHR0cCcsICckcm9vdFNjb3BlJywgJyRzY29wZScsICdBbGVydHNTZXJ2aWNlJyxcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCAnVXJsU2VydmljZScsXG4gICAgJ0ZBVEFMX0VSUk9SX0NPREVTJywgJ1BSQUNUSUNFX1NFU1NJT05TX0RBVEFfVVJMJywgJ1RPVEFMX1FVRVNUSU9OUycsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkcm9vdFNjb3BlLCAkc2NvcGUsIEFsZXJ0c1NlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlLCBVcmxTZXJ2aWNlLCBGQVRBTF9FUlJPUl9DT0RFUywgUFJBQ1RJQ0VfU0VTU0lPTlNfREFUQV9VUkwsIFRPVEFMX1FVRVNUSU9OUykge1xuICAgICAgICAkc2NvcGUudG9waWNOYW1lID0gVXJsU2VydmljZS5nZXRUb3BpY05hbWVGcm9tTGVhcm5lclVybCgpO1xuICAgICAgICB2YXIgX2ZldGNoU2tpbGxEZXRhaWxzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHByYWN0aWNlU2Vzc2lvbnNEYXRhVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoUFJBQ1RJQ0VfU0VTU0lPTlNfREFUQV9VUkwsIHtcbiAgICAgICAgICAgICAgICB0b3BpY19uYW1lOiAkc2NvcGUudG9waWNOYW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICRodHRwLmdldChwcmFjdGljZVNlc3Npb25zRGF0YVVybCkudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHF1ZXN0aW9uUGxheWVyQ29uZmlnID0ge1xuICAgICAgICAgICAgICAgICAgICBza2lsbExpc3Q6IHJlc3VsdC5kYXRhLnNraWxsX2xpc3QsXG4gICAgICAgICAgICAgICAgICAgIHF1ZXN0aW9uQ291bnQ6IFRPVEFMX1FVRVNUSU9OU1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgJHNjb3BlLnF1ZXN0aW9uUGxheWVyQ29uZmlnID0gcXVlc3Rpb25QbGF5ZXJDb25maWc7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgX2ZldGNoU2tpbGxEZXRhaWxzKCk7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIHF1ZXN0aW9ucyBwbGF5ZXIgZGlyZWN0aXZlLlxuICovXG5yZXF1aXJlKCdkb21haW4vcXVlc3Rpb24vUXVlc3Rpb25QbGF5ZXJCYWNrZW5kQXBpU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ3F1ZXN0aW9uUGxheWVyUGFnZU1vZHVsZScpLmRpcmVjdGl2ZSgncXVlc3Rpb25QbGF5ZXInLCBbXG4gICAgJyRodHRwJywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsIFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBnZXRRdWVzdGlvblBsYXllckNvbmZpZzogJyZwbGF5ZXJDb25maWcnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL3F1ZXN0aW9uLXBsYXllci1wYWdlL3F1ZXN0aW9uLXBsYXllci1wYWdlLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRzY29wZScsICckcm9vdFNjb3BlJywgJ1F1ZXN0aW9uUGxheWVyQmFja2VuZEFwaVNlcnZpY2UnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICRyb290U2NvcGUsIFF1ZXN0aW9uUGxheWVyQmFja2VuZEFwaVNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHF1ZXN0aW9uUGxheWVyQ29uZmlnID0gJHNjb3BlLmdldFF1ZXN0aW9uUGxheWVyQ29uZmlnKCk7XG4gICAgICAgICAgICAgICAgICAgIFF1ZXN0aW9uUGxheWVyQmFja2VuZEFwaVNlcnZpY2UuZmV0Y2hRdWVzdGlvbnMocXVlc3Rpb25QbGF5ZXJDb25maWcuc2tpbGxMaXN0LCBxdWVzdGlvblBsYXllckNvbmZpZy5xdWVzdGlvbkNvdW50LCB0cnVlKS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jdXJyZW50UXVlc3Rpb24gPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnRvdGFsUXVlc3Rpb25zID0gcmVzdWx0Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jdXJyZW50UHJvZ3Jlc3MgPSAoJHNjb3BlLmN1cnJlbnRRdWVzdGlvbiAqIDEwMCAvICRzY29wZS50b3RhbFF1ZXN0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgbWFuaXB1bGF0aW5nIHRoZSBwYWdlIFVSTC4gQWxzbyBhbGxvd3NcbiAqIGZ1bmN0aW9ucyBvbiAkd2luZG93IHRvIGJlIG1vY2tlZCBpbiB1bml0IHRlc3RzLlxuICovXG5vcHBpYS5mYWN0b3J5KCdVcmxTZXJ2aWNlJywgWyckd2luZG93JywgZnVuY3Rpb24gKCR3aW5kb3cpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgZm9yIHRlc3RpbmcgcHVycG9zZXMgKHRvIG1vY2sgJHdpbmRvdy5sb2NhdGlvbilcbiAgICAgICAgICAgIGdldEN1cnJlbnRMb2NhdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkd2luZG93LmxvY2F0aW9uO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEN1cnJlbnRRdWVyeVN0cmluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEN1cnJlbnRMb2NhdGlvbigpLnNlYXJjaDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKiBBcyBwYXJhbXNba2V5XSBpcyBvdmVyd3JpdHRlbiwgaWYgcXVlcnkgc3RyaW5nIGhhcyBtdWx0aXBsZSBmaWVsZFZhbHVlc1xuICAgICAgICAgICAgICAgZm9yIHNhbWUgZmllbGROYW1lLCB1c2UgZ2V0UXVlcnlGaWVsZFZhbHVlc0FzTGlzdChmaWVsZE5hbWUpIHRvIGdldCBpdFxuICAgICAgICAgICAgICAgaW4gYXJyYXkgZm9ybS4gKi9cbiAgICAgICAgICAgIGdldFVybFBhcmFtczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXJhbXMgPSB7fTtcbiAgICAgICAgICAgICAgICB2YXIgcGFydHMgPSB0aGlzLmdldEN1cnJlbnRRdWVyeVN0cmluZygpLnJlcGxhY2UoL1s/Jl0rKFtePSZdKyk9KFteJl0qKS9naSwgZnVuY3Rpb24gKG0sIGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zW2RlY29kZVVSSUNvbXBvbmVudChrZXkpXSA9IGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmFtcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc0lmcmFtZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWUgPSB0aGlzLmdldFBhdGhuYW1lKCk7XG4gICAgICAgICAgICAgICAgdmFyIHVybFBhcnRzID0gcGF0aG5hbWUuc3BsaXQoJy8nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdXJsUGFydHNbMV0gPT09ICdlbWJlZCc7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0UGF0aG5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDdXJyZW50TG9jYXRpb24oKS5wYXRobmFtZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBUb3BpYyBpZCBzaG91bGQgYmUgY29ycmVjdGx5IHJldHVybmVkIGZyb20gdG9waWMgZWRpdG9yIGFzIHdlbGwgYXNcbiAgICAgICAgICAgIC8vIHN0b3J5IGVkaXRvciwgc2luY2UgYm90aCBoYXZlIHRvcGljIGlkIGluIHRoZWlyIHVybC5cbiAgICAgICAgICAgIGdldFRvcGljSWRGcm9tVXJsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGhuYW1lID0gdGhpcy5nZXRQYXRobmFtZSgpO1xuICAgICAgICAgICAgICAgIGlmIChwYXRobmFtZS5tYXRjaCgvXFwvKHN0b3J5fHRvcGljKV9lZGl0b3JcXC8oXFx3fC0pezEyfS9nKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGF0aG5hbWUuc3BsaXQoJy8nKVsyXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgdG9waWMgaWQgdXJsJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0VG9waWNOYW1lRnJvbUxlYXJuZXJVcmw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWUgPSB0aGlzLmdldFBhdGhuYW1lKCk7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGhuYW1lLm1hdGNoKC9cXC8oc3Rvcnl8dG9waWN8cHJhY3RpY2Vfc2Vzc2lvbikvZykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChwYXRobmFtZS5zcGxpdCgnLycpWzJdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgVVJMIGZvciB0b3BpYycpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFN0b3J5SWRGcm9tVXJsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGhuYW1lID0gdGhpcy5nZXRQYXRobmFtZSgpO1xuICAgICAgICAgICAgICAgIGlmIChwYXRobmFtZS5tYXRjaCgvXFwvc3RvcnlfZWRpdG9yKFxcLyhcXHd8LSl7MTJ9KXsyfS9nKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGF0aG5hbWUuc3BsaXQoJy8nKVszXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgc3RvcnkgaWQgdXJsJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0U3RvcnlJZEluUGxheWVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHF1ZXJ5ID0gdGhpcy5nZXRDdXJyZW50UXVlcnlTdHJpbmcoKTtcbiAgICAgICAgICAgICAgICBpZiAocXVlcnkubWF0Y2goL1xcP3N0b3J5X2lkPSgoXFx3fC0pezEyfSkvZykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHF1ZXJ5LnNwbGl0KCc9JylbMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFNraWxsSWRGcm9tVXJsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGhuYW1lID0gdGhpcy5nZXRQYXRobmFtZSgpO1xuICAgICAgICAgICAgICAgIHZhciBza2lsbElkID0gcGF0aG5hbWUuc3BsaXQoJy8nKVsyXTtcbiAgICAgICAgICAgICAgICBpZiAoc2tpbGxJZC5sZW5ndGggIT09IDEyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIFNraWxsIElkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBza2lsbElkO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFF1ZXJ5RmllbGRWYWx1ZXNBc0xpc3Q6IGZ1bmN0aW9uIChmaWVsZE5hbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgZmllbGRWYWx1ZXMgPSBbXTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5nZXRDdXJyZW50UXVlcnlTdHJpbmcoKS5pbmRleE9mKCc/JykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBFYWNoIHF1ZXJ5SXRlbSByZXR1cm4gb25lIGZpZWxkLXZhbHVlIHBhaXIgaW4gdGhlIHVybC5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHF1ZXJ5SXRlbXMgPSB0aGlzLmdldEN1cnJlbnRRdWVyeVN0cmluZygpLnNsaWNlKHRoaXMuZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nKCkuaW5kZXhPZignPycpICsgMSkuc3BsaXQoJyYnKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBxdWVyeUl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudEZpZWxkTmFtZSA9IGRlY29kZVVSSUNvbXBvbmVudChxdWVyeUl0ZW1zW2ldLnNwbGl0KCc9JylbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRGaWVsZFZhbHVlID0gZGVjb2RlVVJJQ29tcG9uZW50KHF1ZXJ5SXRlbXNbaV0uc3BsaXQoJz0nKVsxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudEZpZWxkTmFtZSA9PT0gZmllbGROYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRWYWx1ZXMucHVzaChjdXJyZW50RmllbGRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVmFsdWVzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFkZEZpZWxkOiBmdW5jdGlvbiAodXJsLCBmaWVsZE5hbWUsIGZpZWxkVmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgZW5jb2RlZEZpZWxkVmFsdWUgPSBlbmNvZGVVUklDb21wb25lbnQoZmllbGRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgdmFyIGVuY29kZWRGaWVsZE5hbWUgPSBlbmNvZGVVUklDb21wb25lbnQoZmllbGROYW1lKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdXJsICsgKHVybC5pbmRleE9mKCc/JykgIT09IC0xID8gJyYnIDogJz8nKSArIGVuY29kZWRGaWVsZE5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnPScgKyBlbmNvZGVkRmllbGRWYWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRIYXNoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q3VycmVudExvY2F0aW9uKCkuaGFzaDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XSk7XG4iXSwic291cmNlUm9vdCI6IiJ9