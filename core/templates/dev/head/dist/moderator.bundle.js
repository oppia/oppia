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
/******/ 		"moderator": 0
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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/moderator-page/moderator-page.controller.ts","about~admin~app~collection_editor~collection_player~contact~creator_dashboard~donate~email_dashboard~c1e50cc0","admin~creator_dashboard~exploration_editor~exploration_player~moderator~skill_editor~story_editor~to~3f6ef738"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./core/templates/dev/head/components/forms/forms-unicode-filters/convert-html-to-unicode.filter.ts":
/*!**********************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-unicode-filters/convert-html-to-unicode.filter.ts ***!
  \**********************************************************************************************************/
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
 * @fileoverview Converts HTML to unicode.
 */
angular.module('formsUnicodeFiltersModule').filter('convertHtmlToUnicode', [function () {
        return function (html) {
            return angular.element('<div>' + html + '</div>').text();
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/moderator-page/moderator-page.controller.ts":
/*!***********************************************************************************!*\
  !*** ./core/templates/dev/head/pages/moderator-page/moderator-page.controller.ts ***!
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
* @fileoverview Data and controllers for the Oppia moderator page.
*/
// TODO(vojtechjelinek): this block of requires should be removed after we
// introduce webpack for /extensions
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
__webpack_require__(/*! filters/string-utility-filters/underscores-to-camel-case.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/underscores-to-camel-case.filter.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-choices-editor/schema-based-choices-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-choices-editor/schema-based-choices-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-dict-editor/schema-based-dict-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-dict-editor/schema-based-dict-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-list-editor/schema-based-list-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-list-editor/schema-based-list-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-unicode-editor/schema-based-unicode-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-unicode-editor/schema-based-unicode-editor.directive.ts");
// ^^^ this block of requires should be removed ^^^
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/DateTimeFormatService.ts */ "./core/templates/dev/head/services/DateTimeFormatService.ts");
angular.module('moderatorPageModule').controller('Moderator', [
    '$http', '$rootScope', '$scope', 'AlertsService', 'DateTimeFormatService',
    function ($http, $rootScope, $scope, AlertsService, DateTimeFormatService) {
        $rootScope.loadingMessage = 'Loading';
        $scope.getDatetimeAsString = function (millisSinceEpoch) {
            return DateTimeFormatService.getLocaleAbbreviatedDatetimeString(millisSinceEpoch);
        };
        $scope.getExplorationCreateUrl = function (explorationId) {
            return '/create/' + explorationId;
        };
        $scope.getActivityCreateUrl = function (reference) {
            return ((reference.type === 'exploration' ? '/create' : '/create_collection') +
                '/' + reference.id);
        };
        $scope.allCommits = [];
        $scope.allFeedbackMessages = [];
        // Map of exploration ids to objects containing a single key: title.
        $scope.explorationData = {};
        $scope.displayedFeaturedActivityReferences = [];
        $scope.lastSavedFeaturedActivityReferences = [];
        $scope.FEATURED_ACTIVITY_REFERENCES_SCHEMA = {
            type: 'list',
            items: {
                type: 'dict',
                properties: [{
                        name: 'type',
                        schema: {
                            type: 'unicode',
                            choices: ['exploration', 'collection']
                        }
                    }, {
                        name: 'id',
                        schema: {
                            type: 'unicode'
                        }
                    }]
            }
        };
        var RECENT_COMMITS_URL = ('/recentcommitshandler/recent_commits' +
            '?query_type=all_non_private_commits');
        // TODO(sll): Update this to also support collections.
        $http.get(RECENT_COMMITS_URL).then(function (response) {
            // Update the explorationData object with information about newly-
            // discovered explorations.
            var data = response.data;
            var explorationIdsToExplorationData = data.exp_ids_to_exp_data;
            for (var expId in explorationIdsToExplorationData) {
                if (!$scope.explorationData.hasOwnProperty(expId)) {
                    $scope.explorationData[expId] = (explorationIdsToExplorationData[expId]);
                }
            }
            $scope.allCommits = data.results;
            $rootScope.loadingMessage = '';
        });
        $http.get('/recent_feedback_messages').then(function (response) {
            $scope.allFeedbackMessages = response.data.results;
        });
        $http.get('/moderatorhandler/featured').then(function (response) {
            $scope.displayedFeaturedActivityReferences = (response.data.featured_activity_references);
            $scope.lastSavedFeaturedActivityReferences = angular.copy($scope.displayedFeaturedActivityReferences);
        });
        $scope.isSaveFeaturedActivitiesButtonDisabled = function () {
            return angular.equals($scope.displayedFeaturedActivityReferences, $scope.lastSavedFeaturedActivityReferences);
        };
        $scope.saveFeaturedActivityReferences = function () {
            AlertsService.clearWarnings();
            var activityReferencesToSave = angular.copy($scope.displayedFeaturedActivityReferences);
            $http.post('/moderatorhandler/featured', {
                featured_activity_reference_dicts: activityReferencesToSave
            }).then(function () {
                $scope.lastSavedFeaturedActivityReferences = activityReferencesToSave;
                AlertsService.addSuccessMessage('Featured activities saved.');
            });
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/DateTimeFormatService.ts":
/*!*******************************************************************!*\
  !*** ./core/templates/dev/head/services/DateTimeFormatService.ts ***!
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
* @fileoverview Service for converting dates in milliseconds
* since the Epoch to human-readable dates.
*/
oppia.factory('DateTimeFormatService', ['$filter', function ($filter) {
        return {
            // Returns just the time if the local datetime representation has the
            // same date as the current date. Otherwise, returns just the date if the
            // local datetime representation has the same year as the current date.
            // Otherwise, returns the full date (with the year abbreviated).
            getLocaleAbbreviatedDatetimeString: function (millisSinceEpoch) {
                var date = new Date(millisSinceEpoch);
                if (date.toLocaleDateString() === new Date().toLocaleDateString()) {
                    return date.toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                    });
                }
                else if (date.getFullYear() === new Date().getFullYear()) {
                    return $filter('date')(date, 'MMM d');
                }
                else {
                    return $filter('date')(date, 'shortDate');
                }
            },
            // Returns just the date.
            getLocaleDateString: function (millisSinceEpoch) {
                var date = new Date(millisSinceEpoch);
                return date.toLocaleDateString();
            },
            // Returns whether the date is at most one week before the current date.
            isRecent: function (millisSinceEpoch) {
                var ONE_WEEK_IN_MILLIS = 7 * 24 * 60 * 60 * 1000;
                return new Date().getTime() - millisSinceEpoch < ONE_WEEK_IN_MILLIS;
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/services/HtmlEscaperService.ts":
/*!****************************************************************!*\
  !*** ./core/templates/dev/head/services/HtmlEscaperService.ts ***!
  \****************************************************************/
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
 * @fileoverview Service for HTML serialization and escaping.
 */
oppia.factory('HtmlEscaperService', ['$log', function ($log) {
        var htmlEscaper = {
            objToEscapedJson: function (obj) {
                return this.unescapedStrToEscapedStr(JSON.stringify(obj));
            },
            escapedJsonToObj: function (json) {
                if (!json) {
                    $log.error('Empty string was passed to JSON decoder.');
                    return '';
                }
                return JSON.parse(this.escapedStrToUnescapedStr(json));
            },
            unescapedStrToEscapedStr: function (str) {
                return String(str)
                    .replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
            },
            escapedStrToUnescapedStr: function (value) {
                return String(value)
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, '\'')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&');
            }
        };
        return htmlEscaper;
    }]);


/***/ }),

/***/ "./core/templates/dev/head/services/stateful/FocusManagerService.ts":
/*!**************************************************************************!*\
  !*** ./core/templates/dev/head/services/stateful/FocusManagerService.ts ***!
  \**************************************************************************/
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
 * @fileoverview Service for setting focus. This broadcasts a 'focusOn' event
 * which sets focus to the element in the page with the corresponding focusOn
 * attribute.
 * Note: This requires LABEL_FOR_CLEARING_FOCUS to exist somewhere in the HTML
 * page.
 */
oppia.factory('FocusManagerService', [
    '$rootScope', '$timeout', 'DeviceInfoService', 'IdGenerationService',
    'LABEL_FOR_CLEARING_FOCUS',
    function ($rootScope, $timeout, DeviceInfoService, IdGenerationService, LABEL_FOR_CLEARING_FOCUS) {
        var _nextLabelToFocusOn = null;
        return {
            clearFocus: function () {
                this.setFocus(LABEL_FOR_CLEARING_FOCUS);
            },
            setFocus: function (name) {
                if (_nextLabelToFocusOn) {
                    return;
                }
                _nextLabelToFocusOn = name;
                $timeout(function () {
                    $rootScope.$broadcast('focusOn', _nextLabelToFocusOn);
                    _nextLabelToFocusOn = null;
                });
            },
            setFocusIfOnDesktop: function (newFocusLabel) {
                if (!DeviceInfoService.isMobileDevice()) {
                    this.setFocus(newFocusLabel);
                }
            },
            // Generates a random string (to be used as a focus label).
            generateFocusLabel: function () {
                return IdGenerationService.generateNewId();
            }
        };
    }
]);


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy11bmljb2RlLWZpbHRlcnMvY29udmVydC1odG1sLXRvLXVuaWNvZGUuZmlsdGVyLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL21vZGVyYXRvci1wYWdlL21vZGVyYXRvci1wYWdlLmNvbnRyb2xsZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL0h0bWxFc2NhcGVyU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9zdGF0ZWZ1bC9Gb2N1c01hbmFnZXJTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGdCQUFRLG9CQUFvQjtBQUM1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUFpQiw0QkFBNEI7QUFDN0M7QUFDQTtBQUNBLDBCQUFrQiwyQkFBMkI7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztB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QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDbERMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSx5Q0FBeUM7QUFDekMsMENBQTBDO0FBQzFDLHlDQUF5QztBQUN6Qyx3Q0FBd0M7QUFDeEMsd0NBQXdDO0FBQ3hDLGFBQWE7QUFDYjtBQUNBO0FBQ0Esb0NBQW9DO0FBQ3BDLG1DQUFtQztBQUNuQyxrQ0FBa0M7QUFDbEMsa0NBQWtDO0FBQ2xDLG1DQUFtQztBQUNuQztBQUNBO0FBQ0E7QUFDQSxLQUFLOzs7Ozs7Ozs7Ozs7QUM5Q0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibW9kZXJhdG9yLmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIGluc3RhbGwgYSBKU09OUCBjYWxsYmFjayBmb3IgY2h1bmsgbG9hZGluZ1xuIFx0ZnVuY3Rpb24gd2VicGFja0pzb25wQ2FsbGJhY2soZGF0YSkge1xuIFx0XHR2YXIgY2h1bmtJZHMgPSBkYXRhWzBdO1xuIFx0XHR2YXIgbW9yZU1vZHVsZXMgPSBkYXRhWzFdO1xuIFx0XHR2YXIgZXhlY3V0ZU1vZHVsZXMgPSBkYXRhWzJdO1xuXG4gXHRcdC8vIGFkZCBcIm1vcmVNb2R1bGVzXCIgdG8gdGhlIG1vZHVsZXMgb2JqZWN0LFxuIFx0XHQvLyB0aGVuIGZsYWcgYWxsIFwiY2h1bmtJZHNcIiBhcyBsb2FkZWQgYW5kIGZpcmUgY2FsbGJhY2tcbiBcdFx0dmFyIG1vZHVsZUlkLCBjaHVua0lkLCBpID0gMCwgcmVzb2x2ZXMgPSBbXTtcbiBcdFx0Zm9yKDtpIDwgY2h1bmtJZHMubGVuZ3RoOyBpKyspIHtcbiBcdFx0XHRjaHVua0lkID0gY2h1bmtJZHNbaV07XG4gXHRcdFx0aWYoaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdKSB7XG4gXHRcdFx0XHRyZXNvbHZlcy5wdXNoKGluc3RhbGxlZENodW5rc1tjaHVua0lkXVswXSk7XG4gXHRcdFx0fVxuIFx0XHRcdGluc3RhbGxlZENodW5rc1tjaHVua0lkXSA9IDA7XG4gXHRcdH1cbiBcdFx0Zm9yKG1vZHVsZUlkIGluIG1vcmVNb2R1bGVzKSB7XG4gXHRcdFx0aWYoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vcmVNb2R1bGVzLCBtb2R1bGVJZCkpIHtcbiBcdFx0XHRcdG1vZHVsZXNbbW9kdWxlSWRdID0gbW9yZU1vZHVsZXNbbW9kdWxlSWRdO1xuIFx0XHRcdH1cbiBcdFx0fVxuIFx0XHRpZihwYXJlbnRKc29ucEZ1bmN0aW9uKSBwYXJlbnRKc29ucEZ1bmN0aW9uKGRhdGEpO1xuXG4gXHRcdHdoaWxlKHJlc29sdmVzLmxlbmd0aCkge1xuIFx0XHRcdHJlc29sdmVzLnNoaWZ0KCkoKTtcbiBcdFx0fVxuXG4gXHRcdC8vIGFkZCBlbnRyeSBtb2R1bGVzIGZyb20gbG9hZGVkIGNodW5rIHRvIGRlZmVycmVkIGxpc3RcbiBcdFx0ZGVmZXJyZWRNb2R1bGVzLnB1c2guYXBwbHkoZGVmZXJyZWRNb2R1bGVzLCBleGVjdXRlTW9kdWxlcyB8fCBbXSk7XG5cbiBcdFx0Ly8gcnVuIGRlZmVycmVkIG1vZHVsZXMgd2hlbiBhbGwgY2h1bmtzIHJlYWR5XG4gXHRcdHJldHVybiBjaGVja0RlZmVycmVkTW9kdWxlcygpO1xuIFx0fTtcbiBcdGZ1bmN0aW9uIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCkge1xuIFx0XHR2YXIgcmVzdWx0O1xuIFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgZGVmZXJyZWRNb2R1bGVzLmxlbmd0aDsgaSsrKSB7XG4gXHRcdFx0dmFyIGRlZmVycmVkTW9kdWxlID0gZGVmZXJyZWRNb2R1bGVzW2ldO1xuIFx0XHRcdHZhciBmdWxmaWxsZWQgPSB0cnVlO1xuIFx0XHRcdGZvcih2YXIgaiA9IDE7IGogPCBkZWZlcnJlZE1vZHVsZS5sZW5ndGg7IGorKykge1xuIFx0XHRcdFx0dmFyIGRlcElkID0gZGVmZXJyZWRNb2R1bGVbal07XG4gXHRcdFx0XHRpZihpbnN0YWxsZWRDaHVua3NbZGVwSWRdICE9PSAwKSBmdWxmaWxsZWQgPSBmYWxzZTtcbiBcdFx0XHR9XG4gXHRcdFx0aWYoZnVsZmlsbGVkKSB7XG4gXHRcdFx0XHRkZWZlcnJlZE1vZHVsZXMuc3BsaWNlKGktLSwgMSk7XG4gXHRcdFx0XHRyZXN1bHQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IGRlZmVycmVkTW9kdWxlWzBdKTtcbiBcdFx0XHR9XG4gXHRcdH1cbiBcdFx0cmV0dXJuIHJlc3VsdDtcbiBcdH1cblxuIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gb2JqZWN0IHRvIHN0b3JlIGxvYWRlZCBhbmQgbG9hZGluZyBjaHVua3NcbiBcdC8vIHVuZGVmaW5lZCA9IGNodW5rIG5vdCBsb2FkZWQsIG51bGwgPSBjaHVuayBwcmVsb2FkZWQvcHJlZmV0Y2hlZFxuIFx0Ly8gUHJvbWlzZSA9IGNodW5rIGxvYWRpbmcsIDAgPSBjaHVuayBsb2FkZWRcbiBcdHZhciBpbnN0YWxsZWRDaHVua3MgPSB7XG4gXHRcdFwibW9kZXJhdG9yXCI6IDBcbiBcdH07XG5cbiBcdHZhciBkZWZlcnJlZE1vZHVsZXMgPSBbXTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0dmFyIGpzb25wQXJyYXkgPSB3aW5kb3dbXCJ3ZWJwYWNrSnNvbnBcIl0gPSB3aW5kb3dbXCJ3ZWJwYWNrSnNvbnBcIl0gfHwgW107XG4gXHR2YXIgb2xkSnNvbnBGdW5jdGlvbiA9IGpzb25wQXJyYXkucHVzaC5iaW5kKGpzb25wQXJyYXkpO1xuIFx0anNvbnBBcnJheS5wdXNoID0gd2VicGFja0pzb25wQ2FsbGJhY2s7XG4gXHRqc29ucEFycmF5ID0ganNvbnBBcnJheS5zbGljZSgpO1xuIFx0Zm9yKHZhciBpID0gMDsgaSA8IGpzb25wQXJyYXkubGVuZ3RoOyBpKyspIHdlYnBhY2tKc29ucENhbGxiYWNrKGpzb25wQXJyYXlbaV0pO1xuIFx0dmFyIHBhcmVudEpzb25wRnVuY3Rpb24gPSBvbGRKc29ucEZ1bmN0aW9uO1xuXG5cbiBcdC8vIGFkZCBlbnRyeSBtb2R1bGUgdG8gZGVmZXJyZWQgbGlzdFxuIFx0ZGVmZXJyZWRNb2R1bGVzLnB1c2goW1wiLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9tb2RlcmF0b3ItcGFnZS9tb2RlcmF0b3ItcGFnZS5jb250cm9sbGVyLnRzXCIsXCJhYm91dH5hZG1pbn5hcHB+Y29sbGVjdGlvbl9lZGl0b3J+Y29sbGVjdGlvbl9wbGF5ZXJ+Y29udGFjdH5jcmVhdG9yX2Rhc2hib2FyZH5kb25hdGV+ZW1haWxfZGFzaGJvYXJkfmMxZTUwY2MwXCIsXCJhZG1pbn5jcmVhdG9yX2Rhc2hib2FyZH5leHBsb3JhdGlvbl9lZGl0b3J+ZXhwbG9yYXRpb25fcGxheWVyfm1vZGVyYXRvcn5za2lsbF9lZGl0b3J+c3RvcnlfZWRpdG9yfnRvfjNmNmVmNzM4XCJdKTtcbiBcdC8vIHJ1biBkZWZlcnJlZCBtb2R1bGVzIHdoZW4gcmVhZHlcbiBcdHJldHVybiBjaGVja0RlZmVycmVkTW9kdWxlcygpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb252ZXJ0cyBIVE1MIHRvIHVuaWNvZGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdmb3Jtc1VuaWNvZGVGaWx0ZXJzTW9kdWxlJykuZmlsdGVyKCdjb252ZXJ0SHRtbFRvVW5pY29kZScsIFtmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoaHRtbCkge1xuICAgICAgICAgICAgcmV0dXJuIGFuZ3VsYXIuZWxlbWVudCgnPGRpdj4nICsgaHRtbCArICc8L2Rpdj4nKS50ZXh0KCk7XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4qIEBmaWxlb3ZlcnZpZXcgRGF0YSBhbmQgY29udHJvbGxlcnMgZm9yIHRoZSBPcHBpYSBtb2RlcmF0b3IgcGFnZS5cbiovXG4vLyBUT0RPKHZvanRlY2hqZWxpbmVrKTogdGhpcyBibG9jayBvZiByZXF1aXJlcyBzaG91bGQgYmUgcmVtb3ZlZCBhZnRlciB3ZVxuLy8gaW50cm9kdWNlIHdlYnBhY2sgZm9yIC9leHRlbnNpb25zXG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXVuaWNvZGUtZmlsdGVycy8nICtcbiAgICAnY29udmVydC11bmljb2RlLXdpdGgtcGFyYW1zLXRvLWh0bWwuZmlsdGVyLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXVuaWNvZGUtZmlsdGVycy9jb252ZXJ0LWh0bWwtdG8tdW5pY29kZS5maWx0ZXIudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtdW5pY29kZS1maWx0ZXJzL2NvbnZlcnQtdW5pY29kZS10by1odG1sLmZpbHRlci50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy12YWxpZGF0b3JzL2lzLWF0LWxlYXN0LmZpbHRlci50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy12YWxpZGF0b3JzL2lzLWF0LW1vc3QuZmlsdGVyLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXZhbGlkYXRvcnMvaXMtZmxvYXQuZmlsdGVyLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXZhbGlkYXRvcnMvaXMtaW50ZWdlci5maWx0ZXIudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtdmFsaWRhdG9ycy9pcy1ub25lbXB0eS5maWx0ZXIudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtZGlyZWN0aXZlcy9hcHBseS12YWxpZGF0aW9uLycgK1xuICAgICdhcHBseS12YWxpZGF0aW9uLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1kaXJlY3RpdmVzL3JlcXVpcmUtaXMtZmxvYXQvJyArXG4gICAgJ3JlcXVpcmUtaXMtZmxvYXQuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdmaWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvdW5kZXJzY29yZXMtdG8tY2FtZWwtY2FzZS5maWx0ZXIudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci8nICtcbiAgICAnc2NoZW1hLWJhc2VkLWNob2ljZXMtZWRpdG9yL3NjaGVtYS1iYXNlZC1jaG9pY2VzLWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci8nICtcbiAgICAnc2NoZW1hLWJhc2VkLWRpY3QtZWRpdG9yL3NjaGVtYS1iYXNlZC1kaWN0LWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci8nICtcbiAgICAnc2NoZW1hLWJhc2VkLWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci8nICtcbiAgICAnc2NoZW1hLWJhc2VkLWxpc3QtZWRpdG9yL3NjaGVtYS1iYXNlZC1saXN0LWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci8nICtcbiAgICAnc2NoZW1hLWJhc2VkLXVuaWNvZGUtZWRpdG9yL3NjaGVtYS1iYXNlZC11bmljb2RlLWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbi8vIF5eXiB0aGlzIGJsb2NrIG9mIHJlcXVpcmVzIHNob3VsZCBiZSByZW1vdmVkIF5eXlxucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnbW9kZXJhdG9yUGFnZU1vZHVsZScpLmNvbnRyb2xsZXIoJ01vZGVyYXRvcicsIFtcbiAgICAnJGh0dHAnLCAnJHJvb3RTY29wZScsICckc2NvcGUnLCAnQWxlcnRzU2VydmljZScsICdEYXRlVGltZUZvcm1hdFNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJHJvb3RTY29wZSwgJHNjb3BlLCBBbGVydHNTZXJ2aWNlLCBEYXRlVGltZUZvcm1hdFNlcnZpY2UpIHtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICdMb2FkaW5nJztcbiAgICAgICAgJHNjb3BlLmdldERhdGV0aW1lQXNTdHJpbmcgPSBmdW5jdGlvbiAobWlsbGlzU2luY2VFcG9jaCkge1xuICAgICAgICAgICAgcmV0dXJuIERhdGVUaW1lRm9ybWF0U2VydmljZS5nZXRMb2NhbGVBYmJyZXZpYXRlZERhdGV0aW1lU3RyaW5nKG1pbGxpc1NpbmNlRXBvY2gpO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuZ2V0RXhwbG9yYXRpb25DcmVhdGVVcmwgPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgcmV0dXJuICcvY3JlYXRlLycgKyBleHBsb3JhdGlvbklkO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuZ2V0QWN0aXZpdHlDcmVhdGVVcmwgPSBmdW5jdGlvbiAocmVmZXJlbmNlKSB7XG4gICAgICAgICAgICByZXR1cm4gKChyZWZlcmVuY2UudHlwZSA9PT0gJ2V4cGxvcmF0aW9uJyA/ICcvY3JlYXRlJyA6ICcvY3JlYXRlX2NvbGxlY3Rpb24nKSArXG4gICAgICAgICAgICAgICAgJy8nICsgcmVmZXJlbmNlLmlkKTtcbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLmFsbENvbW1pdHMgPSBbXTtcbiAgICAgICAgJHNjb3BlLmFsbEZlZWRiYWNrTWVzc2FnZXMgPSBbXTtcbiAgICAgICAgLy8gTWFwIG9mIGV4cGxvcmF0aW9uIGlkcyB0byBvYmplY3RzIGNvbnRhaW5pbmcgYSBzaW5nbGUga2V5OiB0aXRsZS5cbiAgICAgICAgJHNjb3BlLmV4cGxvcmF0aW9uRGF0YSA9IHt9O1xuICAgICAgICAkc2NvcGUuZGlzcGxheWVkRmVhdHVyZWRBY3Rpdml0eVJlZmVyZW5jZXMgPSBbXTtcbiAgICAgICAgJHNjb3BlLmxhc3RTYXZlZEZlYXR1cmVkQWN0aXZpdHlSZWZlcmVuY2VzID0gW107XG4gICAgICAgICRzY29wZS5GRUFUVVJFRF9BQ1RJVklUWV9SRUZFUkVOQ0VTX1NDSEVNQSA9IHtcbiAgICAgICAgICAgIHR5cGU6ICdsaXN0JyxcbiAgICAgICAgICAgIGl0ZW1zOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2RpY3QnLFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IFt7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAndHlwZScsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndW5pY29kZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hvaWNlczogWydleHBsb3JhdGlvbicsICdjb2xsZWN0aW9uJ11cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2lkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd1bmljb2RlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgUkVDRU5UX0NPTU1JVFNfVVJMID0gKCcvcmVjZW50Y29tbWl0c2hhbmRsZXIvcmVjZW50X2NvbW1pdHMnICtcbiAgICAgICAgICAgICc/cXVlcnlfdHlwZT1hbGxfbm9uX3ByaXZhdGVfY29tbWl0cycpO1xuICAgICAgICAvLyBUT0RPKHNsbCk6IFVwZGF0ZSB0aGlzIHRvIGFsc28gc3VwcG9ydCBjb2xsZWN0aW9ucy5cbiAgICAgICAgJGh0dHAuZ2V0KFJFQ0VOVF9DT01NSVRTX1VSTCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgZXhwbG9yYXRpb25EYXRhIG9iamVjdCB3aXRoIGluZm9ybWF0aW9uIGFib3V0IG5ld2x5LVxuICAgICAgICAgICAgLy8gZGlzY292ZXJlZCBleHBsb3JhdGlvbnMuXG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICB2YXIgZXhwbG9yYXRpb25JZHNUb0V4cGxvcmF0aW9uRGF0YSA9IGRhdGEuZXhwX2lkc190b19leHBfZGF0YTtcbiAgICAgICAgICAgIGZvciAodmFyIGV4cElkIGluIGV4cGxvcmF0aW9uSWRzVG9FeHBsb3JhdGlvbkRhdGEpIHtcbiAgICAgICAgICAgICAgICBpZiAoISRzY29wZS5leHBsb3JhdGlvbkRhdGEuaGFzT3duUHJvcGVydHkoZXhwSWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5leHBsb3JhdGlvbkRhdGFbZXhwSWRdID0gKGV4cGxvcmF0aW9uSWRzVG9FeHBsb3JhdGlvbkRhdGFbZXhwSWRdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkc2NvcGUuYWxsQ29tbWl0cyA9IGRhdGEucmVzdWx0cztcbiAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ01lc3NhZ2UgPSAnJztcbiAgICAgICAgfSk7XG4gICAgICAgICRodHRwLmdldCgnL3JlY2VudF9mZWVkYmFja19tZXNzYWdlcycpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAkc2NvcGUuYWxsRmVlZGJhY2tNZXNzYWdlcyA9IHJlc3BvbnNlLmRhdGEucmVzdWx0cztcbiAgICAgICAgfSk7XG4gICAgICAgICRodHRwLmdldCgnL21vZGVyYXRvcmhhbmRsZXIvZmVhdHVyZWQnKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgJHNjb3BlLmRpc3BsYXllZEZlYXR1cmVkQWN0aXZpdHlSZWZlcmVuY2VzID0gKHJlc3BvbnNlLmRhdGEuZmVhdHVyZWRfYWN0aXZpdHlfcmVmZXJlbmNlcyk7XG4gICAgICAgICAgICAkc2NvcGUubGFzdFNhdmVkRmVhdHVyZWRBY3Rpdml0eVJlZmVyZW5jZXMgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLmRpc3BsYXllZEZlYXR1cmVkQWN0aXZpdHlSZWZlcmVuY2VzKTtcbiAgICAgICAgfSk7XG4gICAgICAgICRzY29wZS5pc1NhdmVGZWF0dXJlZEFjdGl2aXRpZXNCdXR0b25EaXNhYmxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmVxdWFscygkc2NvcGUuZGlzcGxheWVkRmVhdHVyZWRBY3Rpdml0eVJlZmVyZW5jZXMsICRzY29wZS5sYXN0U2F2ZWRGZWF0dXJlZEFjdGl2aXR5UmVmZXJlbmNlcyk7XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5zYXZlRmVhdHVyZWRBY3Rpdml0eVJlZmVyZW5jZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmNsZWFyV2FybmluZ3MoKTtcbiAgICAgICAgICAgIHZhciBhY3Rpdml0eVJlZmVyZW5jZXNUb1NhdmUgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLmRpc3BsYXllZEZlYXR1cmVkQWN0aXZpdHlSZWZlcmVuY2VzKTtcbiAgICAgICAgICAgICRodHRwLnBvc3QoJy9tb2RlcmF0b3JoYW5kbGVyL2ZlYXR1cmVkJywge1xuICAgICAgICAgICAgICAgIGZlYXR1cmVkX2FjdGl2aXR5X3JlZmVyZW5jZV9kaWN0czogYWN0aXZpdHlSZWZlcmVuY2VzVG9TYXZlXG4gICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUubGFzdFNhdmVkRmVhdHVyZWRBY3Rpdml0eVJlZmVyZW5jZXMgPSBhY3Rpdml0eVJlZmVyZW5jZXNUb1NhdmU7XG4gICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRTdWNjZXNzTWVzc2FnZSgnRmVhdHVyZWQgYWN0aXZpdGllcyBzYXZlZC4nKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgZm9yIGNvbnZlcnRpbmcgZGF0ZXMgaW4gbWlsbGlzZWNvbmRzXG4qIHNpbmNlIHRoZSBFcG9jaCB0byBodW1hbi1yZWFkYWJsZSBkYXRlcy5cbiovXG5vcHBpYS5mYWN0b3J5KCdEYXRlVGltZUZvcm1hdFNlcnZpY2UnLCBbJyRmaWx0ZXInLCBmdW5jdGlvbiAoJGZpbHRlcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gUmV0dXJucyBqdXN0IHRoZSB0aW1lIGlmIHRoZSBsb2NhbCBkYXRldGltZSByZXByZXNlbnRhdGlvbiBoYXMgdGhlXG4gICAgICAgICAgICAvLyBzYW1lIGRhdGUgYXMgdGhlIGN1cnJlbnQgZGF0ZS4gT3RoZXJ3aXNlLCByZXR1cm5zIGp1c3QgdGhlIGRhdGUgaWYgdGhlXG4gICAgICAgICAgICAvLyBsb2NhbCBkYXRldGltZSByZXByZXNlbnRhdGlvbiBoYXMgdGhlIHNhbWUgeWVhciBhcyB0aGUgY3VycmVudCBkYXRlLlxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlLCByZXR1cm5zIHRoZSBmdWxsIGRhdGUgKHdpdGggdGhlIHllYXIgYWJicmV2aWF0ZWQpLlxuICAgICAgICAgICAgZ2V0TG9jYWxlQWJicmV2aWF0ZWREYXRldGltZVN0cmluZzogZnVuY3Rpb24gKG1pbGxpc1NpbmNlRXBvY2gpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKG1pbGxpc1NpbmNlRXBvY2gpO1xuICAgICAgICAgICAgICAgIGlmIChkYXRlLnRvTG9jYWxlRGF0ZVN0cmluZygpID09PSBuZXcgRGF0ZSgpLnRvTG9jYWxlRGF0ZVN0cmluZygpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRlLnRvTG9jYWxlVGltZVN0cmluZyhbXSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgaG91cjogJ251bWVyaWMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWludXRlOiAnbnVtZXJpYycsXG4gICAgICAgICAgICAgICAgICAgICAgICBob3VyMTI6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGRhdGUuZ2V0RnVsbFllYXIoKSA9PT0gbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkZmlsdGVyKCdkYXRlJykoZGF0ZSwgJ01NTSBkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGZpbHRlcignZGF0ZScpKGRhdGUsICdzaG9ydERhdGUnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gUmV0dXJucyBqdXN0IHRoZSBkYXRlLlxuICAgICAgICAgICAgZ2V0TG9jYWxlRGF0ZVN0cmluZzogZnVuY3Rpb24gKG1pbGxpc1NpbmNlRXBvY2gpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKG1pbGxpc1NpbmNlRXBvY2gpO1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRlLnRvTG9jYWxlRGF0ZVN0cmluZygpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFJldHVybnMgd2hldGhlciB0aGUgZGF0ZSBpcyBhdCBtb3N0IG9uZSB3ZWVrIGJlZm9yZSB0aGUgY3VycmVudCBkYXRlLlxuICAgICAgICAgICAgaXNSZWNlbnQ6IGZ1bmN0aW9uIChtaWxsaXNTaW5jZUVwb2NoKSB7XG4gICAgICAgICAgICAgICAgdmFyIE9ORV9XRUVLX0lOX01JTExJUyA9IDcgKiAyNCAqIDYwICogNjAgKiAxMDAwO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIG1pbGxpc1NpbmNlRXBvY2ggPCBPTkVfV0VFS19JTl9NSUxMSVM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBIVE1MIHNlcmlhbGl6YXRpb24gYW5kIGVzY2FwaW5nLlxuICovXG5vcHBpYS5mYWN0b3J5KCdIdG1sRXNjYXBlclNlcnZpY2UnLCBbJyRsb2cnLCBmdW5jdGlvbiAoJGxvZykge1xuICAgICAgICB2YXIgaHRtbEVzY2FwZXIgPSB7XG4gICAgICAgICAgICBvYmpUb0VzY2FwZWRKc29uOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudW5lc2NhcGVkU3RyVG9Fc2NhcGVkU3RyKEpTT04uc3RyaW5naWZ5KG9iaikpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVzY2FwZWRKc29uVG9PYmo6IGZ1bmN0aW9uIChqc29uKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFqc29uKSB7XG4gICAgICAgICAgICAgICAgICAgICRsb2cuZXJyb3IoJ0VtcHR5IHN0cmluZyB3YXMgcGFzc2VkIHRvIEpTT04gZGVjb2Rlci4nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZSh0aGlzLmVzY2FwZWRTdHJUb1VuZXNjYXBlZFN0cihqc29uKSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdW5lc2NhcGVkU3RyVG9Fc2NhcGVkU3RyOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFN0cmluZyhzdHIpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mL2csICcmYW1wOycpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7JylcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgJyYjMzk7JylcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVzY2FwZWRTdHJUb1VuZXNjYXBlZFN0cjogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFN0cmluZyh2YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyZxdW90Oy9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJiMzOTsvZywgJ1xcJycpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mbHQ7L2csICc8JylcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyZndDsvZywgJz4nKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJmFtcDsvZywgJyYnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGh0bWxFc2NhcGVyO1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3Igc2V0dGluZyBmb2N1cy4gVGhpcyBicm9hZGNhc3RzIGEgJ2ZvY3VzT24nIGV2ZW50XG4gKiB3aGljaCBzZXRzIGZvY3VzIHRvIHRoZSBlbGVtZW50IGluIHRoZSBwYWdlIHdpdGggdGhlIGNvcnJlc3BvbmRpbmcgZm9jdXNPblxuICogYXR0cmlidXRlLlxuICogTm90ZTogVGhpcyByZXF1aXJlcyBMQUJFTF9GT1JfQ0xFQVJJTkdfRk9DVVMgdG8gZXhpc3Qgc29tZXdoZXJlIGluIHRoZSBIVE1MXG4gKiBwYWdlLlxuICovXG5vcHBpYS5mYWN0b3J5KCdGb2N1c01hbmFnZXJTZXJ2aWNlJywgW1xuICAgICckcm9vdFNjb3BlJywgJyR0aW1lb3V0JywgJ0RldmljZUluZm9TZXJ2aWNlJywgJ0lkR2VuZXJhdGlvblNlcnZpY2UnLFxuICAgICdMQUJFTF9GT1JfQ0xFQVJJTkdfRk9DVVMnLFxuICAgIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkdGltZW91dCwgRGV2aWNlSW5mb1NlcnZpY2UsIElkR2VuZXJhdGlvblNlcnZpY2UsIExBQkVMX0ZPUl9DTEVBUklOR19GT0NVUykge1xuICAgICAgICB2YXIgX25leHRMYWJlbFRvRm9jdXNPbiA9IG51bGw7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjbGVhckZvY3VzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRGb2N1cyhMQUJFTF9GT1JfQ0xFQVJJTkdfRk9DVVMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldEZvY3VzOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgICAgIGlmIChfbmV4dExhYmVsVG9Gb2N1c09uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX25leHRMYWJlbFRvRm9jdXNPbiA9IG5hbWU7XG4gICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2ZvY3VzT24nLCBfbmV4dExhYmVsVG9Gb2N1c09uKTtcbiAgICAgICAgICAgICAgICAgICAgX25leHRMYWJlbFRvRm9jdXNPbiA9IG51bGw7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0Rm9jdXNJZk9uRGVza3RvcDogZnVuY3Rpb24gKG5ld0ZvY3VzTGFiZWwpIHtcbiAgICAgICAgICAgICAgICBpZiAoIURldmljZUluZm9TZXJ2aWNlLmlzTW9iaWxlRGV2aWNlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRGb2N1cyhuZXdGb2N1c0xhYmVsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gR2VuZXJhdGVzIGEgcmFuZG9tIHN0cmluZyAodG8gYmUgdXNlZCBhcyBhIGZvY3VzIGxhYmVsKS5cbiAgICAgICAgICAgIGdlbmVyYXRlRm9jdXNMYWJlbDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBJZEdlbmVyYXRpb25TZXJ2aWNlLmdlbmVyYXRlTmV3SWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiJdLCJzb3VyY2VSb290IjoiIn0=