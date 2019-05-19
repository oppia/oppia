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
/******/ 		"email_dashboard_result": 0
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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/email-dashboard-page/email-dashboard-result/email-dashboard-result.controller.ts","about~admin~app~collection_editor~collection_player~contact~creator_dashboard~donate~email_dashboard~c1e50cc0"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./core/templates/dev/head/pages/email-dashboard-page/email-dashboard-result/email-dashboard-result.controller.ts":
/*!************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/email-dashboard-page/email-dashboard-result/email-dashboard-result.controller.ts ***!
  \************************************************************************************************************************/
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
 * @fileoverview Controller for oppia email dashboard page.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('emailDashboardResultModule').controller('EmailDashboardResult', [
    '$http', '$scope', '$timeout', '$window', 'UrlInterpolationService',
    function ($http, $scope, $timeout, $window, UrlInterpolationService) {
        var RESULT_HANDLER_URL = '/emaildashboardresult/<query_id>';
        var CANCEL_EMAIL_HANDLER_URL = '/emaildashboardcancelresult/<query_id>';
        var EMAIL_DASHBOARD_PAGE = '/emaildashboard';
        var TEST_BULK_EMAIL_URL = '/emaildashboardtestbulkemailhandler/' +
            '<query_id>';
        var getQueryId = function () {
            return $window.location.pathname.split('/').slice(-1)[0];
        };
        var validateEmailSubjectAndBody = function () {
            var dataIsValid = true;
            if ($scope.emailSubject.length === 0) {
                $scope.invalid.subject = true;
                dataIsValid = false;
            }
            if ($scope.emailBody.length === 0) {
                $scope.invalid.body = true;
                dataIsValid = false;
            }
            return dataIsValid;
        };
        $scope.submitEmail = function () {
            var resultHandlerUrl = UrlInterpolationService.interpolateUrl(RESULT_HANDLER_URL, {
                query_id: getQueryId()
            });
            var dataIsValid = validateEmailSubjectAndBody();
            if ($scope.emailOption === 'custom' &&
                $scope.maxRecipients === null) {
                $scope.invalid.maxRecipients = true;
                dataIsValid = false;
            }
            if (dataIsValid) {
                $scope.submitIsInProgress = true;
                var data = {
                    email_subject: $scope.emailSubject,
                    email_body: $scope.emailBody,
                    email_intent: $scope.emailIntent,
                    max_recipients: ($scope.emailOption !== 'all' ? $scope.max_recipients : null)
                };
                $http.post(resultHandlerUrl, {
                    data: data
                }).success(function () {
                    $scope.emailSubmitted = true;
                    $timeout(function () {
                        $window.location.href = EMAIL_DASHBOARD_PAGE;
                    }, 4000);
                }).error(function () {
                    $scope.errorHasOccurred = true;
                    $scope.submitIsInProgress = false;
                });
                $scope.invalid.subject = false;
                $scope.invalid.body = false;
                $scope.invalid.maxRecipients = false;
            }
        };
        $scope.resetForm = function () {
            $scope.emailSubject = '';
            $scope.emailBody = '';
            $scope.emailOption = 'all';
        };
        $scope.cancelEmail = function () {
            $scope.submitIsInProgress = true;
            var cancelUrlHandler = UrlInterpolationService.interpolateUrl(CANCEL_EMAIL_HANDLER_URL, {
                query_id: getQueryId()
            });
            $http.post(cancelUrlHandler).success(function () {
                $scope.emailCancelled = true;
                $timeout(function () {
                    $window.location.href = EMAIL_DASHBOARD_PAGE;
                }, 4000);
            }).error(function () {
                $scope.errorHasOccurred = true;
                $scope.submitIsInProgress = false;
            });
        };
        $scope.sendTestEmail = function () {
            var testEmailHandlerUrl = UrlInterpolationService.interpolateUrl(TEST_BULK_EMAIL_URL, {
                query_id: getQueryId()
            });
            var dataIsValid = validateEmailSubjectAndBody();
            if (dataIsValid) {
                $http.post(testEmailHandlerUrl, {
                    email_subject: $scope.emailSubject,
                    email_body: $scope.emailBody
                }).success(function () {
                    $scope.testEmailSentSuccesfully = true;
                });
                $scope.invalid.subject = false;
                $scope.invalid.body = false;
                $scope.invalid.maxRecipients = false;
            }
        };
        $scope.emailOption = 'all';
        $scope.emailSubject = '';
        $scope.emailBody = '';
        $scope.invalid = {
            subject: false,
            body: false,
            maxRecipients: false
        };
        $scope.maxRecipients = null;
        $scope.POSSIBLE_EMAIL_INTENTS = [
            'bulk_email_marketing', 'bulk_email_improve_exploration',
            'bulk_email_create_exploration', 'bulk_email_creator_reengagement',
            'bulk_email_learner_reengagement'
        ];
        $scope.emailIntent = $scope.POSSIBLE_EMAIL_INTENTS[0];
        $scope.emailSubmitted = false;
        $scope.submitIsInProgress = false;
        $scope.errorHasOccurred = false;
        $scope.testEmailSentSuccesfully = false;
    }
]);


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZW1haWwtZGFzaGJvYXJkLXBhZ2UvZW1haWwtZGFzaGJvYXJkLXJlc3VsdC9lbWFpbC1kYXNoYm9hcmQtcmVzdWx0LmNvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0JBQVEsb0JBQW9CO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQWlCLDRCQUE0QjtBQUM3QztBQUNBO0FBQ0EsMEJBQWtCLDJCQUEyQjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxrREFBMEMsZ0NBQWdDO0FBQzFFO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0VBQXdELGtCQUFrQjtBQUMxRTtBQUNBLHlEQUFpRCxjQUFjO0FBQy9EOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpREFBeUMsaUNBQWlDO0FBQzFFLHdIQUFnSCxtQkFBbUIsRUFBRTtBQUNySTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1DQUEyQiwwQkFBMEIsRUFBRTtBQUN2RCx5Q0FBaUMsZUFBZTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4REFBc0QsK0RBQStEOztBQUVySDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQWdCLHVCQUF1QjtBQUN2Qzs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImVtYWlsX2Rhc2hib2FyZF9yZXN1bHQuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gaW5zdGFsbCBhIEpTT05QIGNhbGxiYWNrIGZvciBjaHVuayBsb2FkaW5nXG4gXHRmdW5jdGlvbiB3ZWJwYWNrSnNvbnBDYWxsYmFjayhkYXRhKSB7XG4gXHRcdHZhciBjaHVua0lkcyA9IGRhdGFbMF07XG4gXHRcdHZhciBtb3JlTW9kdWxlcyA9IGRhdGFbMV07XG4gXHRcdHZhciBleGVjdXRlTW9kdWxlcyA9IGRhdGFbMl07XG5cbiBcdFx0Ly8gYWRkIFwibW9yZU1vZHVsZXNcIiB0byB0aGUgbW9kdWxlcyBvYmplY3QsXG4gXHRcdC8vIHRoZW4gZmxhZyBhbGwgXCJjaHVua0lkc1wiIGFzIGxvYWRlZCBhbmQgZmlyZSBjYWxsYmFja1xuIFx0XHR2YXIgbW9kdWxlSWQsIGNodW5rSWQsIGkgPSAwLCByZXNvbHZlcyA9IFtdO1xuIFx0XHRmb3IoO2kgPCBjaHVua0lkcy5sZW5ndGg7IGkrKykge1xuIFx0XHRcdGNodW5rSWQgPSBjaHVua0lkc1tpXTtcbiBcdFx0XHRpZihpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0pIHtcbiBcdFx0XHRcdHJlc29sdmVzLnB1c2goaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdWzBdKTtcbiBcdFx0XHR9XG4gXHRcdFx0aW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdID0gMDtcbiBcdFx0fVxuIFx0XHRmb3IobW9kdWxlSWQgaW4gbW9yZU1vZHVsZXMpIHtcbiBcdFx0XHRpZihPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobW9yZU1vZHVsZXMsIG1vZHVsZUlkKSkge1xuIFx0XHRcdFx0bW9kdWxlc1ttb2R1bGVJZF0gPSBtb3JlTW9kdWxlc1ttb2R1bGVJZF07XG4gXHRcdFx0fVxuIFx0XHR9XG4gXHRcdGlmKHBhcmVudEpzb25wRnVuY3Rpb24pIHBhcmVudEpzb25wRnVuY3Rpb24oZGF0YSk7XG5cbiBcdFx0d2hpbGUocmVzb2x2ZXMubGVuZ3RoKSB7XG4gXHRcdFx0cmVzb2x2ZXMuc2hpZnQoKSgpO1xuIFx0XHR9XG5cbiBcdFx0Ly8gYWRkIGVudHJ5IG1vZHVsZXMgZnJvbSBsb2FkZWQgY2h1bmsgdG8gZGVmZXJyZWQgbGlzdFxuIFx0XHRkZWZlcnJlZE1vZHVsZXMucHVzaC5hcHBseShkZWZlcnJlZE1vZHVsZXMsIGV4ZWN1dGVNb2R1bGVzIHx8IFtdKTtcblxuIFx0XHQvLyBydW4gZGVmZXJyZWQgbW9kdWxlcyB3aGVuIGFsbCBjaHVua3MgcmVhZHlcbiBcdFx0cmV0dXJuIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCk7XG4gXHR9O1xuIFx0ZnVuY3Rpb24gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKSB7XG4gXHRcdHZhciByZXN1bHQ7XG4gXHRcdGZvcih2YXIgaSA9IDA7IGkgPCBkZWZlcnJlZE1vZHVsZXMubGVuZ3RoOyBpKyspIHtcbiBcdFx0XHR2YXIgZGVmZXJyZWRNb2R1bGUgPSBkZWZlcnJlZE1vZHVsZXNbaV07XG4gXHRcdFx0dmFyIGZ1bGZpbGxlZCA9IHRydWU7XG4gXHRcdFx0Zm9yKHZhciBqID0gMTsgaiA8IGRlZmVycmVkTW9kdWxlLmxlbmd0aDsgaisrKSB7XG4gXHRcdFx0XHR2YXIgZGVwSWQgPSBkZWZlcnJlZE1vZHVsZVtqXTtcbiBcdFx0XHRcdGlmKGluc3RhbGxlZENodW5rc1tkZXBJZF0gIT09IDApIGZ1bGZpbGxlZCA9IGZhbHNlO1xuIFx0XHRcdH1cbiBcdFx0XHRpZihmdWxmaWxsZWQpIHtcbiBcdFx0XHRcdGRlZmVycmVkTW9kdWxlcy5zcGxpY2UoaS0tLCAxKTtcbiBcdFx0XHRcdHJlc3VsdCA9IF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gZGVmZXJyZWRNb2R1bGVbMF0pO1xuIFx0XHRcdH1cbiBcdFx0fVxuIFx0XHRyZXR1cm4gcmVzdWx0O1xuIFx0fVxuXG4gXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBvYmplY3QgdG8gc3RvcmUgbG9hZGVkIGFuZCBsb2FkaW5nIGNodW5rc1xuIFx0Ly8gdW5kZWZpbmVkID0gY2h1bmsgbm90IGxvYWRlZCwgbnVsbCA9IGNodW5rIHByZWxvYWRlZC9wcmVmZXRjaGVkXG4gXHQvLyBQcm9taXNlID0gY2h1bmsgbG9hZGluZywgMCA9IGNodW5rIGxvYWRlZFxuIFx0dmFyIGluc3RhbGxlZENodW5rcyA9IHtcbiBcdFx0XCJlbWFpbF9kYXNoYm9hcmRfcmVzdWx0XCI6IDBcbiBcdH07XG5cbiBcdHZhciBkZWZlcnJlZE1vZHVsZXMgPSBbXTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0dmFyIGpzb25wQXJyYXkgPSB3aW5kb3dbXCJ3ZWJwYWNrSnNvbnBcIl0gPSB3aW5kb3dbXCJ3ZWJwYWNrSnNvbnBcIl0gfHwgW107XG4gXHR2YXIgb2xkSnNvbnBGdW5jdGlvbiA9IGpzb25wQXJyYXkucHVzaC5iaW5kKGpzb25wQXJyYXkpO1xuIFx0anNvbnBBcnJheS5wdXNoID0gd2VicGFja0pzb25wQ2FsbGJhY2s7XG4gXHRqc29ucEFycmF5ID0ganNvbnBBcnJheS5zbGljZSgpO1xuIFx0Zm9yKHZhciBpID0gMDsgaSA8IGpzb25wQXJyYXkubGVuZ3RoOyBpKyspIHdlYnBhY2tKc29ucENhbGxiYWNrKGpzb25wQXJyYXlbaV0pO1xuIFx0dmFyIHBhcmVudEpzb25wRnVuY3Rpb24gPSBvbGRKc29ucEZ1bmN0aW9uO1xuXG5cbiBcdC8vIGFkZCBlbnRyeSBtb2R1bGUgdG8gZGVmZXJyZWQgbGlzdFxuIFx0ZGVmZXJyZWRNb2R1bGVzLnB1c2goW1wiLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9lbWFpbC1kYXNoYm9hcmQtcGFnZS9lbWFpbC1kYXNoYm9hcmQtcmVzdWx0L2VtYWlsLWRhc2hib2FyZC1yZXN1bHQuY29udHJvbGxlci50c1wiLFwiYWJvdXR+YWRtaW5+YXBwfmNvbGxlY3Rpb25fZWRpdG9yfmNvbGxlY3Rpb25fcGxheWVyfmNvbnRhY3R+Y3JlYXRvcl9kYXNoYm9hcmR+ZG9uYXRlfmVtYWlsX2Rhc2hib2FyZH5jMWU1MGNjMFwiXSk7XG4gXHQvLyBydW4gZGVmZXJyZWQgbW9kdWxlcyB3aGVuIHJlYWR5XG4gXHRyZXR1cm4gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29udHJvbGxlciBmb3Igb3BwaWEgZW1haWwgZGFzaGJvYXJkIHBhZ2UuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdlbWFpbERhc2hib2FyZFJlc3VsdE1vZHVsZScpLmNvbnRyb2xsZXIoJ0VtYWlsRGFzaGJvYXJkUmVzdWx0JywgW1xuICAgICckaHR0cCcsICckc2NvcGUnLCAnJHRpbWVvdXQnLCAnJHdpbmRvdycsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkc2NvcGUsICR0aW1lb3V0LCAkd2luZG93LCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICB2YXIgUkVTVUxUX0hBTkRMRVJfVVJMID0gJy9lbWFpbGRhc2hib2FyZHJlc3VsdC88cXVlcnlfaWQ+JztcbiAgICAgICAgdmFyIENBTkNFTF9FTUFJTF9IQU5ETEVSX1VSTCA9ICcvZW1haWxkYXNoYm9hcmRjYW5jZWxyZXN1bHQvPHF1ZXJ5X2lkPic7XG4gICAgICAgIHZhciBFTUFJTF9EQVNIQk9BUkRfUEFHRSA9ICcvZW1haWxkYXNoYm9hcmQnO1xuICAgICAgICB2YXIgVEVTVF9CVUxLX0VNQUlMX1VSTCA9ICcvZW1haWxkYXNoYm9hcmR0ZXN0YnVsa2VtYWlsaGFuZGxlci8nICtcbiAgICAgICAgICAgICc8cXVlcnlfaWQ+JztcbiAgICAgICAgdmFyIGdldFF1ZXJ5SWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zcGxpdCgnLycpLnNsaWNlKC0xKVswXTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHZhbGlkYXRlRW1haWxTdWJqZWN0QW5kQm9keSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBkYXRhSXNWYWxpZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoJHNjb3BlLmVtYWlsU3ViamVjdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuaW52YWxpZC5zdWJqZWN0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBkYXRhSXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCRzY29wZS5lbWFpbEJvZHkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmludmFsaWQuYm9keSA9IHRydWU7XG4gICAgICAgICAgICAgICAgZGF0YUlzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkYXRhSXNWYWxpZDtcbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLnN1Ym1pdEVtYWlsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdEhhbmRsZXJVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChSRVNVTFRfSEFORExFUl9VUkwsIHtcbiAgICAgICAgICAgICAgICBxdWVyeV9pZDogZ2V0UXVlcnlJZCgpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBkYXRhSXNWYWxpZCA9IHZhbGlkYXRlRW1haWxTdWJqZWN0QW5kQm9keSgpO1xuICAgICAgICAgICAgaWYgKCRzY29wZS5lbWFpbE9wdGlvbiA9PT0gJ2N1c3RvbScgJiZcbiAgICAgICAgICAgICAgICAkc2NvcGUubWF4UmVjaXBpZW50cyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5pbnZhbGlkLm1heFJlY2lwaWVudHMgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGRhdGFJc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZGF0YUlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3VibWl0SXNJblByb2dyZXNzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZW1haWxfc3ViamVjdDogJHNjb3BlLmVtYWlsU3ViamVjdCxcbiAgICAgICAgICAgICAgICAgICAgZW1haWxfYm9keTogJHNjb3BlLmVtYWlsQm9keSxcbiAgICAgICAgICAgICAgICAgICAgZW1haWxfaW50ZW50OiAkc2NvcGUuZW1haWxJbnRlbnQsXG4gICAgICAgICAgICAgICAgICAgIG1heF9yZWNpcGllbnRzOiAoJHNjb3BlLmVtYWlsT3B0aW9uICE9PSAnYWxsJyA/ICRzY29wZS5tYXhfcmVjaXBpZW50cyA6IG51bGwpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAkaHR0cC5wb3N0KHJlc3VsdEhhbmRsZXJVcmwsIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogZGF0YVxuICAgICAgICAgICAgICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZW1haWxTdWJtaXR0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkd2luZG93LmxvY2F0aW9uLmhyZWYgPSBFTUFJTF9EQVNIQk9BUkRfUEFHRTtcbiAgICAgICAgICAgICAgICAgICAgfSwgNDAwMCk7XG4gICAgICAgICAgICAgICAgfSkuZXJyb3IoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZXJyb3JIYXNPY2N1cnJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zdWJtaXRJc0luUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAkc2NvcGUuaW52YWxpZC5zdWJqZWN0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmludmFsaWQuYm9keSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICRzY29wZS5pbnZhbGlkLm1heFJlY2lwaWVudHMgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLnJlc2V0Rm9ybSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lbWFpbFN1YmplY3QgPSAnJztcbiAgICAgICAgICAgICRzY29wZS5lbWFpbEJvZHkgPSAnJztcbiAgICAgICAgICAgICRzY29wZS5lbWFpbE9wdGlvbiA9ICdhbGwnO1xuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuY2FuY2VsRW1haWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuc3VibWl0SXNJblByb2dyZXNzID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhciBjYW5jZWxVcmxIYW5kbGVyID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoQ0FOQ0VMX0VNQUlMX0hBTkRMRVJfVVJMLCB7XG4gICAgICAgICAgICAgICAgcXVlcnlfaWQ6IGdldFF1ZXJ5SWQoKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkaHR0cC5wb3N0KGNhbmNlbFVybEhhbmRsZXIpLnN1Y2Nlc3MoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5lbWFpbENhbmNlbGxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAkd2luZG93LmxvY2F0aW9uLmhyZWYgPSBFTUFJTF9EQVNIQk9BUkRfUEFHRTtcbiAgICAgICAgICAgICAgICB9LCA0MDAwKTtcbiAgICAgICAgICAgIH0pLmVycm9yKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZXJyb3JIYXNPY2N1cnJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnN1Ym1pdElzSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5zZW5kVGVzdEVtYWlsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHRlc3RFbWFpbEhhbmRsZXJVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChURVNUX0JVTEtfRU1BSUxfVVJMLCB7XG4gICAgICAgICAgICAgICAgcXVlcnlfaWQ6IGdldFF1ZXJ5SWQoKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgZGF0YUlzVmFsaWQgPSB2YWxpZGF0ZUVtYWlsU3ViamVjdEFuZEJvZHkoKTtcbiAgICAgICAgICAgIGlmIChkYXRhSXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICRodHRwLnBvc3QodGVzdEVtYWlsSGFuZGxlclVybCwge1xuICAgICAgICAgICAgICAgICAgICBlbWFpbF9zdWJqZWN0OiAkc2NvcGUuZW1haWxTdWJqZWN0LFxuICAgICAgICAgICAgICAgICAgICBlbWFpbF9ib2R5OiAkc2NvcGUuZW1haWxCb2R5XG4gICAgICAgICAgICAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS50ZXN0RW1haWxTZW50U3VjY2VzZnVsbHkgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICRzY29wZS5pbnZhbGlkLnN1YmplY3QgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAkc2NvcGUuaW52YWxpZC5ib2R5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmludmFsaWQubWF4UmVjaXBpZW50cyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuZW1haWxPcHRpb24gPSAnYWxsJztcbiAgICAgICAgJHNjb3BlLmVtYWlsU3ViamVjdCA9ICcnO1xuICAgICAgICAkc2NvcGUuZW1haWxCb2R5ID0gJyc7XG4gICAgICAgICRzY29wZS5pbnZhbGlkID0ge1xuICAgICAgICAgICAgc3ViamVjdDogZmFsc2UsXG4gICAgICAgICAgICBib2R5OiBmYWxzZSxcbiAgICAgICAgICAgIG1heFJlY2lwaWVudHM6IGZhbHNlXG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5tYXhSZWNpcGllbnRzID0gbnVsbDtcbiAgICAgICAgJHNjb3BlLlBPU1NJQkxFX0VNQUlMX0lOVEVOVFMgPSBbXG4gICAgICAgICAgICAnYnVsa19lbWFpbF9tYXJrZXRpbmcnLCAnYnVsa19lbWFpbF9pbXByb3ZlX2V4cGxvcmF0aW9uJyxcbiAgICAgICAgICAgICdidWxrX2VtYWlsX2NyZWF0ZV9leHBsb3JhdGlvbicsICdidWxrX2VtYWlsX2NyZWF0b3JfcmVlbmdhZ2VtZW50JyxcbiAgICAgICAgICAgICdidWxrX2VtYWlsX2xlYXJuZXJfcmVlbmdhZ2VtZW50J1xuICAgICAgICBdO1xuICAgICAgICAkc2NvcGUuZW1haWxJbnRlbnQgPSAkc2NvcGUuUE9TU0lCTEVfRU1BSUxfSU5URU5UU1swXTtcbiAgICAgICAgJHNjb3BlLmVtYWlsU3VibWl0dGVkID0gZmFsc2U7XG4gICAgICAgICRzY29wZS5zdWJtaXRJc0luUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgICAgICAgJHNjb3BlLmVycm9ySGFzT2NjdXJyZWQgPSBmYWxzZTtcbiAgICAgICAgJHNjb3BlLnRlc3RFbWFpbFNlbnRTdWNjZXNmdWxseSA9IGZhbHNlO1xuICAgIH1cbl0pO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==