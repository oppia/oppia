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
/******/ 		"library": 0
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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/library-page/library-page.controller.ts","about~admin~app~collection_editor~collection_player~contact~creator_dashboard~donate~email_dashboard~c1e50cc0","collection_player~creator_dashboard~exploration_editor~exploration_player~learner_dashboard~library~~88caa5df","collection_player~learner_dashboard~library~profile"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

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

/***/ "./core/templates/dev/head/components/summary-tile-directives/collection-summary-tile/collection-summary-tile.directive.ts":
/*!*********************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/summary-tile-directives/collection-summary-tile/collection-summary-tile.directive.ts ***!
  \*********************************************************************************************************************************/
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
 * @fileoverview Summary tile for collections.
 */
__webpack_require__(/*! domain/learner_dashboard/LearnerDashboardIconsDirective.ts */ "./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardIconsDirective.ts");
__webpack_require__(/*! filters/string-utility-filters/truncate-and-capitalize.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/truncate-and-capitalize.filter.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/DateTimeFormatService.ts */ "./core/templates/dev/head/services/DateTimeFormatService.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
angular.module('collectionSummaryTileModule').directive('collectionSummaryTile', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                getCollectionId: '&collectionId',
                getCollectionTitle: '&collectionTitle',
                getObjective: '&objective',
                getNodeCount: '&nodeCount',
                getLastUpdatedMsec: '&lastUpdatedMsec',
                getThumbnailIconUrl: '&thumbnailIconUrl',
                getThumbnailBgColor: '&thumbnailBgColor',
                isLinkedToEditorPage: '=?isLinkedToEditorPage',
                getCategory: '&category',
                isPlaylistTile: '&isPlaylistTile',
                showLearnerDashboardIconsIfPossible: ('&showLearnerDashboardIconsIfPossible'),
                isContainerNarrow: '&containerIsNarrow',
                isOwnedByCurrentUser: '&activityIsOwnedByCurrentUser',
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/summary-tile-directives/collection-summary-tile/' +
                'collection-summary-tile.directive.html'),
            controller: [
                'DateTimeFormatService', 'UserService',
                'COLLECTION_VIEWER_URL', 'COLLECTION_EDITOR_URL', function (DateTimeFormatService, UserService, COLLECTION_VIEWER_URL, COLLECTION_EDITOR_URL) {
                    var ctrl = this;
                    ctrl.userIsLoggedIn = null;
                    UserService.getUserInfoAsync().then(function (userInfo) {
                        ctrl.userIsLoggedIn = userInfo.isLoggedIn();
                    });
                    ctrl.DEFAULT_EMPTY_TITLE = 'Untitled';
                    ctrl.ACTIVITY_TYPE_COLLECTION = constants.ACTIVITY_TYPE_COLLECTION;
                    ctrl.getLastUpdatedDatetime = function () {
                        return DateTimeFormatService.getLocaleAbbreviatedDatetimeString(ctrl.getLastUpdatedMsec());
                    };
                    ctrl.getCollectionLink = function () {
                        var targetUrl = (ctrl.isLinkedToEditorPage ?
                            COLLECTION_EDITOR_URL : COLLECTION_VIEWER_URL);
                        return UrlInterpolationService.interpolateUrl(targetUrl, {
                            collection_id: ctrl.getCollectionId()
                        });
                    };
                    ctrl.getCompleteThumbnailIconUrl = function () {
                        return UrlInterpolationService.getStaticImageUrl(ctrl.getThumbnailIconUrl());
                    };
                    ctrl.getStaticImageUrl = function (url) {
                        return UrlInterpolationService.getStaticImageUrl(url);
                    };
                    ctrl.setHoverState = function (hoverState) {
                        ctrl.collectionIsCurrentlyHoveredOver = hoverState;
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardActivityIdsObjectFactory.ts":
/*!******************************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardActivityIdsObjectFactory.ts ***!
  \******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Factory for creating new frontend instances of learner
   dashboard activity ids domain object.
 */
oppia.factory('LearnerDashboardActivityIdsObjectFactory', [function () {
        var LearnerDashboardActivityIds = function (incompleteExplorationIds, incompleteCollectionIds, completedExplorationIds, completedCollectionIds, explorationPlaylistIds, collectionPlaylistIds) {
            this.incompleteExplorationIds = incompleteExplorationIds;
            this.incompleteCollectionIds = incompleteCollectionIds;
            this.completedExplorationIds = completedExplorationIds;
            this.completedCollectionIds = completedCollectionIds;
            this.explorationPlaylistIds = explorationPlaylistIds;
            this.collectionPlaylistIds = collectionPlaylistIds;
        };
        LearnerDashboardActivityIds.prototype.includesActivity = (function (activityId) {
            if (this.incompleteCollectionIds.indexOf(activityId) !== -1 ||
                this.completedCollectionIds.indexOf(activityId) !== -1 ||
                this.collectionPlaylistIds.indexOf(activityId) !== -1 ||
                this.incompleteExplorationIds.indexOf(activityId) !== -1 ||
                this.completedExplorationIds.indexOf(activityId) !== -1 ||
                this.explorationPlaylistIds.indexOf(activityId) !== -1) {
                return true;
            }
            else {
                return false;
            }
        });
        LearnerDashboardActivityIds.prototype.belongsToExplorationPlaylist = (function (explorationId) {
            if (this.explorationPlaylistIds.indexOf(explorationId) !== -1) {
                return true;
            }
            else {
                return false;
            }
        });
        LearnerDashboardActivityIds.prototype.belongsToCollectionPlaylist = (function (collectionId) {
            if (this.collectionPlaylistIds.indexOf(collectionId) !== -1) {
                return true;
            }
            else {
                return false;
            }
        });
        LearnerDashboardActivityIds.prototype.belongsToCompletedExplorations = (function (explorationId) {
            if (this.completedExplorationIds.indexOf(explorationId) !== -1) {
                return true;
            }
            else {
                return false;
            }
        });
        LearnerDashboardActivityIds.prototype.belongsToCompletedCollections = (function (collectionId) {
            if (this.completedCollectionIds.indexOf(collectionId) !== -1) {
                return true;
            }
            else {
                return false;
            }
        });
        LearnerDashboardActivityIds.prototype.belongsToIncompleteExplorations = (function (explorationId) {
            if (this.incompleteExplorationIds.indexOf(explorationId) !== -1) {
                return true;
            }
            else {
                return false;
            }
        });
        LearnerDashboardActivityIds.prototype.belongsToIncompleteCollections = (function (collectionId) {
            if (this.incompleteCollectionIds.indexOf(collectionId) !== -1) {
                return true;
            }
            else {
                return false;
            }
        });
        LearnerDashboardActivityIds.prototype.addToExplorationLearnerPlaylist = (function (explorationId) {
            this.explorationPlaylistIds.push(explorationId);
        });
        LearnerDashboardActivityIds.prototype.removeFromExplorationLearnerPlaylist = (function (explorationId) {
            var index = this.explorationPlaylistIds.indexOf(explorationId);
            if (index !== -1) {
                this.explorationPlaylistIds.splice(index, 1);
            }
        });
        LearnerDashboardActivityIds.prototype.addToCollectionLearnerPlaylist = (function (collectionId) {
            this.collectionPlaylistIds.push(collectionId);
        });
        LearnerDashboardActivityIds.prototype.removeFromCollectionLearnerPlaylist = (function (collectionId) {
            var index = this.collectionPlaylistIds.indexOf(collectionId);
            if (index !== -1) {
                this.collectionPlaylistIds.splice(index, 1);
            }
        });
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        LearnerDashboardActivityIds['createFromBackendDict'] = function (
        /* eslint-enable dot-notation */
        learnerDashboardActivityIdsDict) {
            return new LearnerDashboardActivityIds(learnerDashboardActivityIdsDict.incomplete_exploration_ids, learnerDashboardActivityIdsDict.incomplete_collection_ids, learnerDashboardActivityIdsDict.completed_exploration_ids, learnerDashboardActivityIdsDict.completed_collection_ids, learnerDashboardActivityIdsDict.exploration_playlist_ids, learnerDashboardActivityIdsDict.collection_playlist_ids);
        };
        return LearnerDashboardActivityIds;
    }]);


/***/ }),

/***/ "./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardIdsBackendApiService.ts":
/*!**************************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardIdsBackendApiService.ts ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Backend services related to fetching the ids of the
 * activities present in the learner dashboard.
 */
oppia.factory('LearnerDashboardIdsBackendApiService', [
    '$http', function ($http) {
        var _fetchLearnerDashboardIds = function () {
            return $http.get('/learnerdashboardidshandler/data');
        };
        return {
            fetchLearnerDashboardIds: _fetchLearnerDashboardIds
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/learner_dashboard/LearnerPlaylistService.ts":
/*!************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/learner_dashboard/LearnerPlaylistService.ts ***!
  \************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Service related to the learner playlist.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
oppia.factory('LearnerPlaylistService', [
    '$http', '$uibModal', 'AlertsService', 'UrlInterpolationService',
    function ($http, $uibModal, AlertsService, UrlInterpolationService) {
        var _addToLearnerPlaylist = function (activityId, activityType) {
            var successfullyAdded = true;
            var addToLearnerPlaylistUrl = (UrlInterpolationService.interpolateUrl('/learnerplaylistactivityhandler/<activityType>/<activityId>', {
                activityType: activityType,
                activityId: activityId
            }));
            $http.post(addToLearnerPlaylistUrl, {})
                .then(function (response) {
                if (response.data.belongs_to_completed_or_incomplete_list) {
                    successfullyAdded = false;
                    AlertsService.addInfoMessage('You have already completed or are completing this ' +
                        'activity.');
                }
                if (response.data.belongs_to_subscribed_activities) {
                    successfullyAdded = false;
                    AlertsService.addInfoMessage('This is present in your creator dashboard');
                }
                if (response.data.playlist_limit_exceeded) {
                    successfullyAdded = false;
                    AlertsService.addInfoMessage('Your \'Play Later\' list is full!  Either you can ' +
                        'complete some or you can head to the learner dashboard ' +
                        'and remove some.');
                }
                if (successfullyAdded) {
                    AlertsService.addSuccessMessage('Successfully added to your \'Play Later\' list.');
                }
            });
            return successfullyAdded;
        };
        var _removeFromLearnerPlaylist = function (activityId, activityTitle, activityType, learnerDashboardActivityIds) {
            $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/learner-dashboard-page' +
                    '/remove-activity-from-learner-dashbaord-page' +
                    '/remove-activity-from-learner-dashboard-modal.template.html'),
                backdrop: true,
                resolve: {
                    activityId: function () {
                        return activityId;
                    },
                    activityTitle: function () {
                        return activityTitle;
                    }
                },
                controller: [
                    '$scope', '$uibModalInstance', '$http', 'UrlInterpolationService',
                    function ($scope, $uibModalInstance, $http, UrlInterpolationService) {
                        $scope.sectionNameI18nId = ('I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION');
                        $scope.activityTitle = activityTitle;
                        var removeFromLearnerPlaylistUrl = (UrlInterpolationService.interpolateUrl('/learnerplaylistactivityhandler/' +
                            '<activityType>/<activityId>', {
                            activityType: activityType,
                            activityId: activityId
                        }));
                        $scope.remove = function () {
                            $http['delete'](removeFromLearnerPlaylistUrl);
                            $uibModalInstance.close();
                        };
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss('cancel');
                        };
                    }
                ]
            }).result.then(function () {
                if (activityType === constants.ACTIVITY_TYPE_EXPLORATION) {
                    learnerDashboardActivityIds.removeFromExplorationLearnerPlaylist(activityId);
                }
                else if (activityType === constants.ACTIVITY_TYPE_COLLECTION) {
                    learnerDashboardActivityIds.removeFromCollectionLearnerPlaylist(activityId);
                }
            });
        };
        return {
            addToLearnerPlaylist: _addToLearnerPlaylist,
            removeFromLearnerPlaylist: _removeFromLearnerPlaylist
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

/***/ "./core/templates/dev/head/pages/library-page/activity-tiles-infinity-grid/activity-tiles-infinity-grid.directive.ts":
/*!***************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/library-page/activity-tiles-infinity-grid/activity-tiles-infinity-grid.directive.ts ***!
  \***************************************************************************************************************************/
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
 * @fileoverview Directive for an infinitely-scrollable view of activity tiles
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/SearchService.ts */ "./core/templates/dev/head/services/SearchService.ts");
__webpack_require__(/*! services/contextual/WindowDimensionsService.ts */ "./core/templates/dev/head/services/contextual/WindowDimensionsService.ts");
angular.module('activityTilesInfinityGridModule').directive('activityTilesInfinityGrid', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/library-page/activity-tiles-infinity-grid/' +
                'activity-tiles-infinity-grid.directive.html'),
            controller: [
                '$scope', '$rootScope', 'SearchService', 'WindowDimensionsService',
                function ($scope, $rootScope, SearchService, WindowDimensionsService) {
                    $scope.endOfPageIsReached = false;
                    $scope.allActivitiesInOrder = [];
                    // Called when the first batch of search results is retrieved from
                    // the server.
                    $scope.$on('initialSearchResultsLoaded', function (evt, activityList) {
                        $scope.allActivitiesInOrder = activityList;
                        $scope.endOfPageIsReached = false;
                    });
                    $scope.showMoreActivities = function () {
                        if (!$rootScope.loadingMessage && !$scope.endOfPageIsReached) {
                            $scope.searchResultsAreLoading = true;
                            SearchService.loadMoreData(function (data, endOfPageIsReached) {
                                $scope.allActivitiesInOrder =
                                    $scope.allActivitiesInOrder.concat(data.activity_list);
                                $scope.endOfPageIsReached = endOfPageIsReached;
                                $scope.searchResultsAreLoading = false;
                            }, function (endOfPageIsReached) {
                                $scope.endOfPageIsReached = endOfPageIsReached;
                                $scope.searchResultsAreLoading = false;
                            });
                        }
                    };
                    var libraryWindowCutoffPx = 530;
                    $scope.libraryWindowIsNarrow = (WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);
                    WindowDimensionsService.registerOnResizeHook(function () {
                        $scope.libraryWindowIsNarrow = (WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);
                        $scope.$apply();
                    });
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/library-page/library-footer/library-footer.controller.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/library-page/library-footer/library-footer.controller.ts ***!
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
 * @fileoverview Data and controllers for the Oppia library footer.
 */
angular.module('libraryFooterModule').controller('LibraryFooter', [
    '$scope', '$window', 'LIBRARY_PAGE_MODES', 'LIBRARY_PATHS_TO_MODES',
    function ($scope, $window, LIBRARY_PAGE_MODES, LIBRARY_PATHS_TO_MODES) {
        var pageMode = LIBRARY_PATHS_TO_MODES[$window.location.pathname];
        $scope.footerIsDisplayed = (pageMode !== LIBRARY_PAGE_MODES.SEARCH);
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/library-page/library-page.controller.ts":
/*!*******************************************************************************!*\
  !*** ./core/templates/dev/head/pages/library-page/library-page.controller.ts ***!
  \*******************************************************************************/
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
 * @fileoverview Data and controllers for the Oppia contributors' library page.
 */
__webpack_require__(/*! components/common-layout-directives/loading-dots/loading-dots.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/loading-dots/loading-dots.directive.ts");
__webpack_require__(/*! components/summary-tile-directives/exploration-summary-tile/exploration-summary-tile.directive.ts */ "./core/templates/dev/head/components/summary-tile-directives/exploration-summary-tile/exploration-summary-tile.directive.ts");
__webpack_require__(/*! components/summary-tile-directives/collection-summary-tile/collection-summary-tile.directive.ts */ "./core/templates/dev/head/components/summary-tile-directives/collection-summary-tile/collection-summary-tile.directive.ts");
__webpack_require__(/*! pages/library-page/library-footer/library-footer.controller.ts */ "./core/templates/dev/head/pages/library-page/library-footer/library-footer.controller.ts");
__webpack_require__(/*! pages/library-page/search-bar/search-bar.directive.ts */ "./core/templates/dev/head/pages/library-page/search-bar/search-bar.directive.ts");
__webpack_require__(/*! pages/library-page/search-results/search-results.directives.ts */ "./core/templates/dev/head/pages/library-page/search-results/search-results.directives.ts");
__webpack_require__(/*! domain/learner_dashboard/LearnerDashboardActivityIdsObjectFactory.ts */ "./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardActivityIdsObjectFactory.ts");
__webpack_require__(/*! domain/learner_dashboard/LearnerDashboardIdsBackendApiService.ts */ "./core/templates/dev/head/domain/learner_dashboard/LearnerDashboardIdsBackendApiService.ts");
__webpack_require__(/*! domain/learner_dashboard/LearnerPlaylistService.ts */ "./core/templates/dev/head/domain/learner_dashboard/LearnerPlaylistService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/ConstructTranslationIdsService.ts */ "./core/templates/dev/head/services/ConstructTranslationIdsService.ts");
__webpack_require__(/*! services/PageTitleService.ts */ "./core/templates/dev/head/services/PageTitleService.ts");
__webpack_require__(/*! services/SearchService.ts */ "./core/templates/dev/head/services/SearchService.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
__webpack_require__(/*! services/contextual/WindowDimensionsService.ts */ "./core/templates/dev/head/services/contextual/WindowDimensionsService.ts");
angular.module('libraryPageModule').controller('Library', [
    '$http', '$log', '$rootScope', '$scope', '$timeout', '$uibModal', '$window',
    'AlertsService', 'ConstructTranslationIdsService',
    'LearnerDashboardActivityIdsObjectFactory',
    'LearnerDashboardIdsBackendApiService', 'LearnerPlaylistService',
    'PageTitleService', 'SearchService',
    'UrlInterpolationService', 'UrlService', 'UserService',
    'WindowDimensionsService', 'ALL_CATEGORIES',
    'LIBRARY_PAGE_MODES', 'LIBRARY_PATHS_TO_MODES', 'LIBRARY_TILE_WIDTH_PX',
    function ($http, $log, $rootScope, $scope, $timeout, $uibModal, $window, AlertsService, ConstructTranslationIdsService, LearnerDashboardActivityIdsObjectFactory, LearnerDashboardIdsBackendApiService, LearnerPlaylistService, PageTitleService, SearchService, UrlInterpolationService, UrlService, UserService, WindowDimensionsService, ALL_CATEGORIES, LIBRARY_PAGE_MODES, LIBRARY_PATHS_TO_MODES, LIBRARY_TILE_WIDTH_PX) {
        $rootScope.loadingMessage = 'I18N_LIBRARY_LOADING';
        var possibleBannerFilenames = [
            'banner1.svg', 'banner2.svg', 'banner3.svg', 'banner4.svg'
        ];
        $scope.bannerImageFilename = possibleBannerFilenames[Math.floor(Math.random() * possibleBannerFilenames.length)];
        $scope.bannerImageFileUrl = UrlInterpolationService.getStaticImageUrl('/library/' + $scope.bannerImageFilename);
        $scope.activeGroupIndex = null;
        var currentPath = $window.location.pathname;
        if (!LIBRARY_PATHS_TO_MODES.hasOwnProperty(currentPath)) {
            $log.error('INVALID URL PATH: ' + currentPath);
        }
        $scope.pageMode = LIBRARY_PATHS_TO_MODES[currentPath];
        $scope.LIBRARY_PAGE_MODES = LIBRARY_PAGE_MODES;
        var title = 'Exploration Library - Oppia';
        if ($scope.pageMode === LIBRARY_PAGE_MODES.GROUP ||
            $scope.pageMode === LIBRARY_PAGE_MODES.SEARCH) {
            title = 'Find explorations to learn from - Oppia';
        }
        PageTitleService.setPageTitle(title);
        // Keeps track of the index of the left-most visible card of each group.
        $scope.leftmostCardIndices = [];
        if ($scope.pageMode === LIBRARY_PAGE_MODES.GROUP) {
            var pathnameArray = $window.location.pathname.split('/');
            $scope.groupName = pathnameArray[2];
            $http.get('/librarygrouphandler', {
                params: {
                    group_name: $scope.groupName
                }
            }).success(function (data) {
                $scope.activityList = data.activity_list;
                $scope.groupHeaderI18nId = data.header_i18n_id;
                $rootScope.$broadcast('preferredLanguageCodesLoaded', data.preferred_language_codes);
                $rootScope.loadingMessage = '';
            });
        }
        else {
            $http.get('/libraryindexhandler').success(function (data) {
                $scope.libraryGroups = data.activity_summary_dicts_by_category;
                UserService.getUserInfoAsync().then(function (userInfo) {
                    $scope.activitiesOwned = { explorations: {}, collections: {} };
                    if (userInfo.isLoggedIn()) {
                        $http.get('/creatordashboardhandler/data')
                            .then(function (response) {
                            $scope.libraryGroups.forEach(function (libraryGroup) {
                                var activitySummaryDicts = (libraryGroup.activity_summary_dicts);
                                var ACTIVITY_TYPE_EXPLORATION = 'exploration';
                                var ACTIVITY_TYPE_COLLECTION = 'collection';
                                activitySummaryDicts.forEach(function (activitySummaryDict) {
                                    if (activitySummaryDict.activity_type === (ACTIVITY_TYPE_EXPLORATION)) {
                                        $scope.activitiesOwned.explorations[activitySummaryDict.id] = false;
                                    }
                                    else if (activitySummaryDict.activity_type === (ACTIVITY_TYPE_COLLECTION)) {
                                        $scope.activitiesOwned.collections[activitySummaryDict.id] = false;
                                    }
                                    else {
                                        $log.error('INVALID ACTIVITY TYPE: Activity' +
                                            '(id: ' + activitySummaryDict.id +
                                            ', name: ' + activitySummaryDict.title +
                                            ', type: ' + activitySummaryDict.activity_type +
                                            ') has an invalid activity type, which could ' +
                                            'not be recorded as an exploration or a collection.');
                                    }
                                });
                                response.data.explorations_list
                                    .forEach(function (ownedExplorations) {
                                    $scope.activitiesOwned.explorations[ownedExplorations.id] = true;
                                });
                                response.data.collections_list
                                    .forEach(function (ownedCollections) {
                                    $scope.activitiesOwned.collections[ownedCollections.id] = true;
                                });
                            });
                            $rootScope.loadingMessage = '';
                        });
                    }
                    else {
                        $rootScope.loadingMessage = '';
                    }
                });
                $rootScope.$broadcast('preferredLanguageCodesLoaded', data.preferred_language_codes);
                // Initialize the carousel(s) on the library index page.
                // Pause is necessary to ensure all elements have loaded.
                $timeout(initCarousels, 390);
                // Check if actual and expected widths are the same.
                // If not produce an error that would be caught by e2e tests.
                $timeout(function () {
                    var actualWidth = $('exploration-summary-tile').width();
                    if (actualWidth && actualWidth !== LIBRARY_TILE_WIDTH_PX) {
                        console.error('The actual width of tile is different than the expected width.' +
                            ' Actual size: ' + actualWidth + ', Expected size: ' +
                            LIBRARY_TILE_WIDTH_PX);
                    }
                }, 3000);
                // The following initializes the tracker to have all
                // elements flush left.
                // Transforms the group names into translation ids
                $scope.leftmostCardIndices = [];
                for (var i = 0; i < $scope.libraryGroups.length; i++) {
                    $scope.leftmostCardIndices.push(0);
                }
            });
        }
        $scope.setActiveGroup = function (groupIndex) {
            $scope.activeGroupIndex = groupIndex;
        };
        $scope.clearActiveGroup = function () {
            $scope.activeGroupIndex = null;
        };
        // If the value below is changed, the following CSS values in oppia.css
        // must be changed:
        // - .oppia-exp-summary-tiles-container: max-width
        // - .oppia-library-carousel: max-width
        var MAX_NUM_TILES_PER_ROW = 4;
        $scope.tileDisplayCount = 0;
        var initCarousels = function () {
            // This prevents unnecessary execution of this method immediately after
            // a window resize event is fired.
            if (!$scope.libraryGroups) {
                return;
            }
            var windowWidth = $(window).width() * 0.85;
            // The number 20 is added to LIBRARY_TILE_WIDTH_PX in order to compensate
            // for padding and margins. 20 is just an arbitrary number.
            $scope.tileDisplayCount = Math.min(Math.floor(windowWidth / (LIBRARY_TILE_WIDTH_PX + 20)), MAX_NUM_TILES_PER_ROW);
            $('.oppia-library-carousel').css({
                width: ($scope.tileDisplayCount * LIBRARY_TILE_WIDTH_PX) + 'px'
            });
            // The following determines whether to enable left scroll after resize.
            for (var i = 0; i < $scope.libraryGroups.length; i++) {
                var carouselJQuerySelector = ('.oppia-library-carousel-tiles:eq(n)'.replace('n', i));
                var carouselScrollPositionPx = $(carouselJQuerySelector).scrollLeft();
                var index = Math.ceil(carouselScrollPositionPx / LIBRARY_TILE_WIDTH_PX);
                $scope.leftmostCardIndices[i] = index;
            }
        };
        var isAnyCarouselCurrentlyScrolling = false;
        $scope.scroll = function (ind, isLeftScroll) {
            if (isAnyCarouselCurrentlyScrolling) {
                return;
            }
            var carouselJQuerySelector = ('.oppia-library-carousel-tiles:eq(n)'.replace('n', ind));
            var direction = isLeftScroll ? -1 : 1;
            var carouselScrollPositionPx = $(carouselJQuerySelector).scrollLeft();
            // Prevent scrolling if there more carousel pixed widths than
            // there are tile widths.
            if ($scope.libraryGroups[ind].activity_summary_dicts.length <=
                $scope.tileDisplayCount) {
                return;
            }
            carouselScrollPositionPx = Math.max(0, carouselScrollPositionPx);
            if (isLeftScroll) {
                $scope.leftmostCardIndices[ind] = Math.max(0, $scope.leftmostCardIndices[ind] - $scope.tileDisplayCount);
            }
            else {
                $scope.leftmostCardIndices[ind] = Math.min($scope.libraryGroups[ind].activity_summary_dicts.length -
                    $scope.tileDisplayCount + 1, $scope.leftmostCardIndices[ind] + $scope.tileDisplayCount);
            }
            var newScrollPositionPx = carouselScrollPositionPx +
                ($scope.tileDisplayCount * LIBRARY_TILE_WIDTH_PX * direction);
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
        // The carousels do not work when the width is 1 card long, so we need to
        // handle this case discretely and also prevent swiping past the first
        // and last card.
        $scope.incrementLeftmostCardIndex = function (ind) {
            var lastItem = (($scope.libraryGroups[ind].activity_summary_dicts.length -
                $scope.tileDisplayCount) <= $scope.leftmostCardIndices[ind]);
            if (!lastItem) {
                $scope.leftmostCardIndices[ind]++;
            }
        };
        $scope.decrementLeftmostCardIndex = function (ind) {
            $scope.leftmostCardIndices[ind] = (Math.max($scope.leftmostCardIndices[ind] - 1, 0));
        };
        $(window).resize(function () {
            initCarousels();
            // This is needed, otherwise $scope.tileDisplayCount takes a long time
            // (several seconds) to update.
            $scope.$apply();
        });
        var activateSearchMode = function () {
            if ($scope.pageMode !== LIBRARY_PAGE_MODES.SEARCH) {
                $('.oppia-library-container').fadeOut(function () {
                    $scope.pageMode = LIBRARY_PAGE_MODES.SEARCH;
                    $timeout(function () {
                        $('.oppia-library-container').fadeIn();
                    }, 50);
                });
            }
        };
        // The following loads explorations belonging to a particular group. If
        // fullResultsUrl is given it loads the page corresponding to the url.
        // Otherwise, it will initiate a search query for the given list of
        // categories.
        $scope.showFullResultsPage = function (categories, fullResultsUrl) {
            if (fullResultsUrl) {
                $window.location.href = fullResultsUrl;
            }
            else {
                var selectedCategories = {};
                for (var i = 0; i < categories.length; i++) {
                    selectedCategories[categories[i]] = true;
                }
                var targetSearchQueryUrl = SearchService.getSearchUrlQueryString('', selectedCategories, {});
                $window.location.href = '/search/find?q=' + targetSearchQueryUrl;
            }
        };
        var libraryWindowCutoffPx = 530;
        $scope.libraryWindowIsNarrow = (WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);
        WindowDimensionsService.registerOnResizeHook(function () {
            $scope.libraryWindowIsNarrow = (WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);
            $scope.$apply();
        });
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/library-page/search-bar/search-bar.directive.ts":
/*!***************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/library-page/search-bar/search-bar.directive.ts ***!
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
 * @fileoverview Directive for the Search Bar.
 */
__webpack_require__(/*! filters/string-utility-filters/truncate.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/truncate.filter.ts");
__webpack_require__(/*! domain/utilities/LanguageUtilService.ts */ "./core/templates/dev/head/domain/utilities/LanguageUtilService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/ConstructTranslationIdsService.ts */ "./core/templates/dev/head/services/ConstructTranslationIdsService.ts");
__webpack_require__(/*! services/DebouncerService.ts */ "./core/templates/dev/head/services/DebouncerService.ts");
__webpack_require__(/*! services/HtmlEscaperService.ts */ "./core/templates/dev/head/services/HtmlEscaperService.ts");
__webpack_require__(/*! services/NavigationService.ts */ "./core/templates/dev/head/services/NavigationService.ts");
__webpack_require__(/*! services/SearchService.ts */ "./core/templates/dev/head/services/SearchService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
angular.module('searchBarModule').directive('searchBar', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/library-page/search-bar/' +
                'search-bar.directive.html'),
            controller: [
                '$location', '$rootScope', '$scope', '$timeout', '$translate',
                '$window', 'ConstructTranslationIdsService', 'DebouncerService',
                'HtmlEscaperService', 'LanguageUtilService', 'NavigationService',
                'SearchService', 'UrlService', 'SEARCH_DROPDOWN_CATEGORIES',
                function ($location, $rootScope, $scope, $timeout, $translate, $window, ConstructTranslationIdsService, DebouncerService, HtmlEscaperService, LanguageUtilService, NavigationService, SearchService, UrlService, SEARCH_DROPDOWN_CATEGORIES) {
                    $scope.isSearchInProgress = SearchService.isSearchInProgress;
                    $scope.SEARCH_DROPDOWN_CATEGORIES = (SEARCH_DROPDOWN_CATEGORIES.map(function (categoryName) {
                        return {
                            id: categoryName,
                            text: ConstructTranslationIdsService.getLibraryId('categories', categoryName)
                        };
                    }));
                    $scope.ACTION_OPEN = NavigationService.ACTION_OPEN;
                    $scope.ACTION_CLOSE = NavigationService.ACTION_CLOSE;
                    $scope.KEYBOARD_EVENT_TO_KEY_CODES =
                        NavigationService.KEYBOARD_EVENT_TO_KEY_CODES;
                    /**
                     * Opens the submenu.
                     * @param {object} evt
                     * @param {String} menuName - name of menu, on which
                     * open/close action to be performed (category,language).
                     */
                    $scope.openSubmenu = function (evt, menuName) {
                        NavigationService.openSubmenu(evt, menuName);
                    };
                    /**
                     * Handles keydown events on menus.
                     * @param {object} evt
                     * @param {String} menuName - name of menu to perform action
                     * on(category/language)
                     * @param {object} eventsTobeHandled - Map keyboard events('Enter') to
                     * corresponding actions to be performed(open/close).
                     *
                     * @example
                     *  onMenuKeypress($event, 'category', {enter: 'open'})
                     */
                    $scope.onMenuKeypress = function (evt, menuName, eventsTobeHandled) {
                        NavigationService.onMenuKeypress(evt, menuName, eventsTobeHandled);
                        $scope.activeMenuName = NavigationService.activeMenuName;
                    };
                    $scope.ALL_LANGUAGE_CODES = (LanguageUtilService.getLanguageIdsAndTexts());
                    $scope.searchQuery = '';
                    $scope.selectionDetails = {
                        categories: {
                            description: '',
                            itemsName: 'categories',
                            masterList: $scope.SEARCH_DROPDOWN_CATEGORIES,
                            numSelections: 0,
                            selections: {},
                            summary: ''
                        },
                        languageCodes: {
                            description: '',
                            itemsName: 'languages',
                            masterList: $scope.ALL_LANGUAGE_CODES,
                            numSelections: 0,
                            selections: {},
                            summary: ''
                        }
                    };
                    // Non-translatable parts of the html strings, like numbers or user
                    // names.
                    $scope.translationData = {};
                    // Update the description, numSelections and summary fields of the
                    // relevant entry of $scope.selectionDetails.
                    var updateSelectionDetails = function (itemsType) {
                        var itemsName = $scope.selectionDetails[itemsType].itemsName;
                        var masterList = $scope.selectionDetails[itemsType].masterList;
                        var selectedItems = [];
                        for (var i = 0; i < masterList.length; i++) {
                            if ($scope.selectionDetails[itemsType]
                                .selections[masterList[i].id]) {
                                selectedItems.push(masterList[i].text);
                            }
                        }
                        var totalCount = selectedItems.length;
                        $scope.selectionDetails[itemsType].numSelections = totalCount;
                        $scope.selectionDetails[itemsType].summary = (totalCount === 0 ? 'I18N_LIBRARY_ALL_' + itemsName.toUpperCase() :
                            totalCount === 1 ? selectedItems[0] :
                                'I18N_LIBRARY_N_' + itemsName.toUpperCase());
                        $scope.translationData[itemsName + 'Count'] = totalCount;
                        // TODO(milit): When the language changes, the translations won't
                        // change until the user changes the selection and this function is
                        // re-executed.
                        if (selectedItems.length > 0) {
                            var translatedItems = [];
                            for (var i = 0; i < selectedItems.length; i++) {
                                translatedItems.push($translate.instant(selectedItems[i]));
                            }
                            $scope.selectionDetails[itemsType].description = (translatedItems.join(', '));
                        }
                        else {
                            $scope.selectionDetails[itemsType].description = ('I18N_LIBRARY_ALL_' + itemsName.toUpperCase() + '_SELECTED');
                        }
                    };
                    $scope.toggleSelection = function (itemsType, optionName) {
                        var selections = $scope.selectionDetails[itemsType].selections;
                        if (!selections.hasOwnProperty(optionName)) {
                            selections[optionName] = true;
                        }
                        else {
                            selections[optionName] = !selections[optionName];
                        }
                        updateSelectionDetails(itemsType);
                        onSearchQueryChangeExec();
                    };
                    $scope.deselectAll = function (itemsType) {
                        $scope.selectionDetails[itemsType].selections = {};
                        updateSelectionDetails(itemsType);
                        onSearchQueryChangeExec();
                    };
                    $scope.$watch('searchQuery', function (newQuery, oldQuery) {
                        // Run only if the query has changed.
                        if (newQuery !== oldQuery) {
                            onSearchQueryChangeExec();
                        }
                    });
                    var onSearchQueryChangeExec = function () {
                        SearchService.executeSearchQuery($scope.searchQuery, $scope.selectionDetails.categories.selections, $scope.selectionDetails.languageCodes.selections);
                        var searchUrlQueryString = SearchService.getSearchUrlQueryString($scope.searchQuery, $scope.selectionDetails.categories.selections, $scope.selectionDetails.languageCodes.selections);
                        if ($window.location.pathname === '/search/find') {
                            $location.url('/find?q=' + searchUrlQueryString);
                        }
                        else {
                            $window.location.href = '/search/find?q=' + searchUrlQueryString;
                        }
                    };
                    // Initialize the selection descriptions and summaries.
                    for (var itemsType in $scope.selectionDetails) {
                        updateSelectionDetails(itemsType);
                    }
                    var updateSearchFieldsBasedOnUrlQuery = function () {
                        var oldQueryString = SearchService.getCurrentUrlQueryString();
                        $scope.selectionDetails.categories.selections = {};
                        $scope.selectionDetails.languageCodes.selections = {};
                        $scope.searchQuery =
                            SearchService.updateSearchFieldsBasedOnUrlQuery($window.location.search, $scope.selectionDetails);
                        updateSelectionDetails('categories');
                        updateSelectionDetails('languageCodes');
                        var newQueryString = SearchService.getCurrentUrlQueryString();
                        if (oldQueryString !== newQueryString) {
                            onSearchQueryChangeExec();
                        }
                    };
                    $scope.$on('$locationChangeSuccess', function () {
                        if (UrlService.getUrlParams().hasOwnProperty('q')) {
                            updateSearchFieldsBasedOnUrlQuery();
                        }
                    });
                    $scope.$on('preferredLanguageCodesLoaded', function (evt, preferredLanguageCodesList) {
                        preferredLanguageCodesList.forEach(function (languageCode) {
                            var selections = $scope.selectionDetails.languageCodes.selections;
                            if (!selections.hasOwnProperty(languageCode)) {
                                selections[languageCode] = true;
                            }
                            else {
                                selections[languageCode] = !selections[languageCode];
                            }
                        });
                        updateSelectionDetails('languageCodes');
                        if (UrlService.getUrlParams().hasOwnProperty('q')) {
                            updateSearchFieldsBasedOnUrlQuery();
                        }
                        if ($window.location.pathname === '/search/find') {
                            onSearchQueryChangeExec();
                        }
                        refreshSearchBarLabels();
                        // Notify the function that handles overflow in case the search
                        // elements load after it has already been run.
                        $rootScope.$broadcast('searchBarLoaded', true);
                    });
                    var refreshSearchBarLabels = function () {
                        // If you translate these strings in the html, then you must use a
                        // filter because only the first 14 characters are displayed. That
                        // would generate FOUC for languages other than English. As an
                        // exception, we translate them here and update the translation
                        // every time the language is changed.
                        $scope.searchBarPlaceholder = $translate.instant('I18N_LIBRARY_SEARCH_PLACEHOLDER');
                        // 'messageformat' is the interpolation method for plural forms.
                        // http://angular-translate.github.io/docs/#/guide/14_pluralization.
                        $scope.categoryButtonText = $translate.instant($scope.selectionDetails.categories.summary, $scope.translationData, 'messageformat');
                        $scope.languageButtonText = $translate.instant($scope.selectionDetails.languageCodes.summary, $scope.translationData, 'messageformat');
                    };
                    $rootScope.$on('$translateChangeSuccess', refreshSearchBarLabels);
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/library-page/search-results/search-results.directives.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/library-page/search-results/search-results.directives.ts ***!
  \************************************************************************************************/
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
 * @fileoverview Directive for showing search results.
 */
__webpack_require__(/*! pages/library-page/activity-tiles-infinity-grid/activity-tiles-infinity-grid.directive.ts */ "./core/templates/dev/head/pages/library-page/activity-tiles-infinity-grid/activity-tiles-infinity-grid.directive.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/SiteAnalyticsService.ts */ "./core/templates/dev/head/services/SiteAnalyticsService.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
angular.module('searchResultsModule').directive('searchResults', [
    '$q', 'UrlInterpolationService', function ($q, UrlInterpolationService) {
        return {
            restrict: 'E',
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/library/search_results_directive.html'),
            controller: [
                '$scope', '$rootScope', '$q', '$timeout', '$window',
                'SiteAnalyticsService', 'UserService',
                function ($scope, $rootScope, $q, $timeout, $window, SiteAnalyticsService, UserService) {
                    $scope.someResultsExist = true;
                    $scope.userIsLoggedIn = null;
                    $rootScope.loadingMessage = 'Loading';
                    var userInfoPromise = UserService.getUserInfoAsync();
                    userInfoPromise.then(function (userInfo) {
                        $scope.userIsLoggedIn = userInfo.isLoggedIn();
                    });
                    // Called when the first batch of search results is retrieved from the
                    // server.
                    var searchResultsPromise = $scope.$on('initialSearchResultsLoaded', function (evt, activityList) {
                        $scope.someResultsExist = activityList.length > 0;
                    });
                    $q.all([userInfoPromise, searchResultsPromise]).then(function () {
                        $rootScope.loadingMessage = '';
                    });
                    $scope.onRedirectToLogin = function (destinationUrl) {
                        SiteAnalyticsService.registerStartLoginEvent('noSearchResults');
                        $timeout(function () {
                            $window.location = destinationUrl;
                        }, 150);
                        return false;
                    };
                    $scope.noExplorationsImgUrl =
                        UrlInterpolationService.getStaticImageUrl('/general/no_explorations_found.png');
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/ConstructTranslationIdsService.ts":
/*!****************************************************************************!*\
  !*** ./core/templates/dev/head/services/ConstructTranslationIdsService.ts ***!
  \****************************************************************************/
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
 * @fileoverview Service to dynamically construct translation ids for i18n.
 */
oppia.factory('ConstructTranslationIdsService', [
    function () {
        return {
            // Construct a translation id for library from name and a prefix.
            // Ex: 'categories', 'art' -> 'I18N_LIBRARY_CATEGORIES_ART'
            getLibraryId: function (prefix, name) {
                return ('I18N_LIBRARY_' + prefix.toUpperCase() + '_' +
                    name.toUpperCase().split(' ').join('_'));
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/DebouncerService.ts":
/*!**************************************************************!*\
  !*** ./core/templates/dev/head/services/DebouncerService.ts ***!
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
 * @fileoverview Service for debouncing function calls.
 */
oppia.factory('DebouncerService', [function () {
        return {
            // Returns a function that will not be triggered as long as it continues to
            // be invoked. The function only gets executed after it stops being called
            // for `wait` milliseconds.
            debounce: function (func, millisecsToWait) {
                var timeout;
                var context = this;
                var args = arguments;
                var timestamp;
                var result;
                var later = function () {
                    var last = new Date().getTime() - timestamp;
                    if (last < millisecsToWait) {
                        timeout = setTimeout(later, millisecsToWait - last);
                    }
                    else {
                        timeout = null;
                        result = func.apply(context, args);
                        if (!timeout) {
                            context = null;
                            args = null;
                        }
                    }
                };
                return function () {
                    context = this;
                    args = arguments;
                    timestamp = new Date().getTime();
                    if (!timeout) {
                        timeout = setTimeout(later, millisecsToWait);
                    }
                    return result;
                };
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

/***/ "./core/templates/dev/head/services/NavigationService.ts":
/*!***************************************************************!*\
  !*** ./core/templates/dev/head/services/NavigationService.ts ***!
  \***************************************************************/
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
 * @fileoverview Factory for navigating the top navigation bar with
 * tab and shift-tab.
 */
oppia.factory('NavigationService', [function () {
        var navigation = {
            activeMenuName: '',
            ACTION_OPEN: 'open',
            ACTION_CLOSE: 'close',
            KEYBOARD_EVENT_TO_KEY_CODES: {
                enter: {
                    shiftKeyIsPressed: false,
                    keyCode: 13
                },
                tab: {
                    shiftKeyIsPressed: false,
                    keyCode: 9
                },
                shiftTab: {
                    shiftKeyIsPressed: true,
                    keyCode: 9
                }
            },
            openSubmenu: null,
            closeSubmenu: null,
            onMenuKeypress: null
        };
        /**
        * Opens the submenu.
        * @param {object} evt
        * @param {String} menuName - name of menu, on which
        * open/close action to be performed (category,language).
        */
        navigation.openSubmenu = function (evt, menuName) {
            // Focus on the current target before opening its submenu.
            navigation.activeMenuName = menuName;
            angular.element(evt.currentTarget).focus();
        };
        navigation.closeSubmenu = function (evt) {
            navigation.activeMenuName = '';
            angular.element(evt.currentTarget).closest('li')
                .find('a').blur();
        };
        /**
         * Handles keydown events on menus.
         * @param {object} evt
         * @param {String} menuName - name of menu to perform action
         * on(category/language)
         * @param {object} eventsTobeHandled - Map keyboard events('Enter') to
         * corresponding actions to be performed(open/close).
         *
         * @example
         *  onMenuKeypress($event, 'category', {enter: 'open'})
         */
        navigation.onMenuKeypress = function (evt, menuName, eventsTobeHandled) {
            var targetEvents = Object.keys(eventsTobeHandled);
            for (var i = 0; i < targetEvents.length; i++) {
                var keyCodeSpec = navigation.KEYBOARD_EVENT_TO_KEY_CODES[targetEvents[i]];
                if (keyCodeSpec.keyCode === evt.keyCode &&
                    evt.shiftKey === keyCodeSpec.shiftKeyIsPressed) {
                    if (eventsTobeHandled[targetEvents[i]] === navigation.ACTION_OPEN) {
                        navigation.openSubmenu(evt, menuName);
                    }
                    else if (eventsTobeHandled[targetEvents[i]] ===
                        navigation.ACTION_CLOSE) {
                        navigation.closeSubmenu(evt);
                    }
                    else {
                        throw Error('Invalid action type.');
                    }
                }
            }
        };
        return navigation;
    }]);


/***/ }),

/***/ "./core/templates/dev/head/services/PageTitleService.ts":
/*!**************************************************************!*\
  !*** ./core/templates/dev/head/services/PageTitleService.ts ***!
  \**************************************************************/
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
 * @fileoverview Service to set the title of the page.
 */
oppia.factory('PageTitleService', ['$document', function ($document) {
        var _setPageTitle = function (title) {
            $document[0].title = title;
        };
        return {
            setPageTitle: function (title) {
                _setPageTitle(title);
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/services/SearchService.ts":
/*!***********************************************************!*\
  !*** ./core/templates/dev/head/services/SearchService.ts ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview search service for activityTilesInfinityGrid
 */
oppia.constant('SEARCH_DATA_URL', '/searchhandler/data');
oppia.factory('SearchService', [
    '$http', '$log', '$rootScope', '$translate', 'SEARCH_DATA_URL',
    function ($http, $log, $rootScope, $translate, SEARCH_DATA_URL) {
        var _lastQuery = null;
        var _lastSelectedCategories = {};
        var _lastSelectedLanguageCodes = {};
        var _searchCursor = null;
        // Appends a suffix to the query describing allowed category and language
        // codes to filter on.
        var _getSuffixForQuery = function (selectedCategories, selectedLanguageCodes) {
            var querySuffix = '';
            var _categories = '';
            for (var key in selectedCategories) {
                if (selectedCategories[key]) {
                    if (_categories) {
                        _categories += '" OR "';
                    }
                    _categories += key;
                }
            }
            if (_categories) {
                querySuffix += '&category=("' + _categories + '")';
            }
            var _languageCodes = '';
            for (var key in selectedLanguageCodes) {
                if (selectedLanguageCodes[key]) {
                    if (_languageCodes) {
                        _languageCodes += '" OR "';
                    }
                    _languageCodes += key;
                }
            }
            if (_languageCodes) {
                querySuffix += '&language_code=("' + _languageCodes + '")';
            }
            return querySuffix;
        };
        var hasReachedEndOfPage = function () {
            return _searchCursor === null;
        };
        var updateSearchFields = function (itemsType, urlComponent, selectionDetails) {
            var itemCodeGroup = urlComponent.match(/=\("[A-Za-z%20" ]+"\)/);
            var itemCodes = itemCodeGroup ? itemCodeGroup[0] : null;
            var EXPECTED_PREFIX = '=("';
            var EXPECTED_SUFFIX = '")';
            if (!itemCodes ||
                itemCodes.indexOf(EXPECTED_PREFIX) !== 0 ||
                itemCodes.lastIndexOf(EXPECTED_SUFFIX) !==
                    itemCodes.length - EXPECTED_SUFFIX.length) {
                throw Error('Invalid search query url fragment for ' +
                    itemsType + ': ' + urlComponent);
            }
            var items = itemCodes.substring(EXPECTED_PREFIX.length, itemCodes.length - EXPECTED_SUFFIX.length).split('" OR "');
            var selections = selectionDetails[itemsType].selections;
            for (var i = 0; i < items.length; i++) {
                selections[items[i]] = true;
            }
        };
        var _isCurrentlyFetchingResults = false;
        var numSearchesInProgress = 0;
        var getQueryUrl = function (searchUrlQueryString) {
            return SEARCH_DATA_URL + '?q=' + searchUrlQueryString;
        };
        return {
            getSearchUrlQueryString: function (searchQuery, selectedCategories, selectedLanguageCodes) {
                return encodeURIComponent(searchQuery) +
                    _getSuffixForQuery(selectedCategories, selectedLanguageCodes);
            },
            // Note that an empty query results in all activities being shown.
            executeSearchQuery: function (searchQuery, selectedCategories, selectedLanguageCodes, successCallback) {
                var queryUrl = getQueryUrl(this.getSearchUrlQueryString(searchQuery, selectedCategories, selectedLanguageCodes));
                _isCurrentlyFetchingResults = true;
                numSearchesInProgress++;
                $http.get(queryUrl).then(function (response) {
                    var data = response.data;
                    _lastQuery = searchQuery;
                    _lastSelectedCategories = angular.copy(selectedCategories);
                    _lastSelectedLanguageCodes = angular.copy(selectedLanguageCodes);
                    _searchCursor = data.search_cursor;
                    numSearchesInProgress--;
                    $rootScope.$broadcast('initialSearchResultsLoaded', data.activity_list);
                    _isCurrentlyFetchingResults = false;
                    var checkMismatch = function (searchQuery) {
                        var isMismatch = true;
                        $('.oppia-search-bar-input').each(function (index) {
                            if ($(this).val().trim() === searchQuery) {
                                isMismatch = false;
                            }
                        });
                        return isMismatch;
                    };
                    if (checkMismatch(searchQuery)) {
                        $log.error('Mismatch');
                        $log.error('SearchQuery: ' + searchQuery);
                        $log.error('Input: ' + $('.oppia-search-bar-input').val().trim());
                    }
                }, function () {
                    numSearchesInProgress--;
                });
                // Translate the new explorations loaded.
                $translate.refresh();
                if (successCallback) {
                    successCallback();
                }
            },
            isSearchInProgress: function () {
                return numSearchesInProgress > 0;
            },
            // The following takes in the url search component as an argument and the
            // selectionDetails. It will update selectionDetails with the relevant
            // fields that were extracted from the url. It returns the unencoded
            // search query string.
            updateSearchFieldsBasedOnUrlQuery: function (urlComponent, selectionDetails) {
                var urlQuery = urlComponent.substring('?q='.length);
                // The following will split the urlQuery into 3 components:
                // 1. query
                // 2. categories (optional)
                // 3. language codes (default to 'en')
                var querySegments = urlQuery.split('&');
                if (querySegments.length > 3) {
                    throw Error('Invalid search query url: ' + urlQuery);
                }
                for (var i = 1; i < querySegments.length; i++) {
                    urlComponent = decodeURIComponent(querySegments[i]);
                    var itemsType = null;
                    if (urlComponent.indexOf('category') === 0) {
                        itemsType = 'categories';
                    }
                    else if (urlComponent.indexOf('language_code') === 0) {
                        itemsType = 'languageCodes';
                    }
                    else {
                        console.error('Invalid search query component: ' + urlComponent);
                        continue;
                    }
                    try {
                        updateSearchFields(itemsType, urlComponent, selectionDetails);
                    }
                    catch (error) {
                        selectionDetails[itemsType].selections = {};
                        throw error;
                    }
                }
                return decodeURIComponent(querySegments[0]);
            },
            getCurrentUrlQueryString: function () {
                return this.getSearchUrlQueryString(_lastQuery, _lastSelectedCategories, _lastSelectedLanguageCodes);
            },
            loadMoreData: function (successCallback, failureCallback) {
                // If a new query is still being sent, or the end of the page has been
                // reached, do not fetch more results.
                if (_isCurrentlyFetchingResults || hasReachedEndOfPage()) {
                    failureCallback(hasReachedEndOfPage());
                    return;
                }
                var queryUrl = getQueryUrl(this.getCurrentUrlQueryString());
                if (_searchCursor) {
                    queryUrl += '&cursor=' + _searchCursor;
                }
                _isCurrentlyFetchingResults = true;
                $http.get(queryUrl).then(function (response) {
                    _searchCursor = response.data.search_cursor;
                    _isCurrentlyFetchingResults = false;
                    if (successCallback) {
                        successCallback(response.data, hasReachedEndOfPage());
                    }
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/SiteAnalyticsService.ts":
/*!******************************************************************!*\
  !*** ./core/templates/dev/head/services/SiteAnalyticsService.ts ***!
  \******************************************************************/
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
 * @fileoverview Utility services for explorations which may be shared by both
 * the learner and editor views.
 */
// Service for sending events to Google Analytics.
//
// Note that events are only sent if the CAN_SEND_ANALYTICS_EVENTS flag is
// turned on. This flag must be turned on explicitly by the application
// owner in feconf.py.
oppia.factory('SiteAnalyticsService', ['$window', function ($window) {
        var CAN_SEND_ANALYTICS_EVENTS = constants.CAN_SEND_ANALYTICS_EVENTS;
        // For definitions of the various arguments, please see:
        // developers.google.com/analytics/devguides/collection/analyticsjs/events
        var _sendEventToGoogleAnalytics = function (eventCategory, eventAction, eventLabel) {
            if ($window.ga && CAN_SEND_ANALYTICS_EVENTS) {
                $window.ga('send', 'event', eventCategory, eventAction, eventLabel);
            }
        };
        // For definitions of the various arguments, please see:
        // developers.google.com/analytics/devguides/collection/analyticsjs/
        //   social-interactions
        var _sendSocialEventToGoogleAnalytics = function (network, action, targetUrl) {
            if ($window.ga && CAN_SEND_ANALYTICS_EVENTS) {
                $window.ga('send', 'social', network, action, targetUrl);
            }
        };
        return {
            // The srcElement refers to the element on the page that is clicked.
            registerStartLoginEvent: function (srcElement) {
                _sendEventToGoogleAnalytics('LoginButton', 'click', $window.location.pathname + ' ' + srcElement);
            },
            registerNewSignupEvent: function () {
                _sendEventToGoogleAnalytics('SignupButton', 'click', '');
            },
            registerClickBrowseLibraryButtonEvent: function () {
                _sendEventToGoogleAnalytics('BrowseLibraryButton', 'click', $window.location.pathname);
            },
            registerGoToDonationSiteEvent: function (donationSiteName) {
                _sendEventToGoogleAnalytics('GoToDonationSite', 'click', donationSiteName);
            },
            registerApplyToTeachWithOppiaEvent: function () {
                _sendEventToGoogleAnalytics('ApplyToTeachWithOppia', 'click', '');
            },
            registerClickCreateExplorationButtonEvent: function () {
                _sendEventToGoogleAnalytics('CreateExplorationButton', 'click', $window.location.pathname);
            },
            registerCreateNewExplorationEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('NewExploration', 'create', explorationId);
            },
            registerCreateNewExplorationInCollectionEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('NewExplorationFromCollection', 'create', explorationId);
            },
            registerCreateNewCollectionEvent: function (collectionId) {
                _sendEventToGoogleAnalytics('NewCollection', 'create', collectionId);
            },
            registerCommitChangesToPrivateExplorationEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('CommitToPrivateExploration', 'click', explorationId);
            },
            registerShareExplorationEvent: function (network) {
                _sendSocialEventToGoogleAnalytics(network, 'share', $window.location.pathname);
            },
            registerShareCollectionEvent: function (network) {
                _sendSocialEventToGoogleAnalytics(network, 'share', $window.location.pathname);
            },
            registerOpenEmbedInfoEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('EmbedInfoModal', 'open', explorationId);
            },
            registerCommitChangesToPublicExplorationEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('CommitToPublicExploration', 'click', explorationId);
            },
            // Metrics for tutorial on first creating exploration
            registerTutorialModalOpenEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('TutorialModalOpen', 'open', explorationId);
            },
            registerDeclineTutorialModalEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('DeclineTutorialModal', 'click', explorationId);
            },
            registerAcceptTutorialModalEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('AcceptTutorialModal', 'click', explorationId);
            },
            // Metrics for visiting the help center
            registerClickHelpButtonEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('ClickHelpButton', 'click', explorationId);
            },
            registerVisitHelpCenterEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('VisitHelpCenter', 'click', explorationId);
            },
            registerOpenTutorialFromHelpCenterEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('OpenTutorialFromHelpCenter', 'click', explorationId);
            },
            // Metrics for exiting the tutorial
            registerSkipTutorialEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('SkipTutorial', 'click', explorationId);
            },
            registerFinishTutorialEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FinishTutorial', 'click', explorationId);
            },
            // Metrics for first time editor use
            registerEditorFirstEntryEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstEnterEditor', 'open', explorationId);
            },
            registerFirstOpenContentBoxEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstOpenContentBox', 'open', explorationId);
            },
            registerFirstSaveContentEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstSaveContent', 'click', explorationId);
            },
            registerFirstClickAddInteractionEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstClickAddInteraction', 'click', explorationId);
            },
            registerFirstSelectInteractionTypeEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstSelectInteractionType', 'click', explorationId);
            },
            registerFirstSaveInteractionEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstSaveInteraction', 'click', explorationId);
            },
            registerFirstSaveRuleEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstSaveRule', 'click', explorationId);
            },
            registerFirstCreateSecondStateEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstCreateSecondState', 'create', explorationId);
            },
            // Metrics for publishing explorations
            registerSavePlayableExplorationEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('SavePlayableExploration', 'save', explorationId);
            },
            registerOpenPublishExplorationModalEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('PublishExplorationModal', 'open', explorationId);
            },
            registerPublishExplorationEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('PublishExploration', 'click', explorationId);
            },
            registerVisitOppiaFromIframeEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('VisitOppiaFromIframe', 'click', explorationId);
            },
            registerNewCard: function (cardNum) {
                if (cardNum <= 10 || cardNum % 10 === 0) {
                    _sendEventToGoogleAnalytics('PlayerNewCard', 'click', cardNum);
                }
            },
            registerFinishExploration: function () {
                _sendEventToGoogleAnalytics('PlayerFinishExploration', 'click', '');
            },
            registerOpenCollectionFromLandingPageEvent: function (collectionId) {
                _sendEventToGoogleAnalytics('OpenFractionsFromLandingPage', 'click', collectionId);
            },
            registerStewardsLandingPageEvent: function (viewerType, buttonText) {
                _sendEventToGoogleAnalytics('ClickButtonOnStewardsPage', 'click', viewerType + ':' + buttonText);
            },
            registerSaveRecordedAudioEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('SaveRecordedAudio', 'click', explorationId);
            },
            registerStartAudioRecordingEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('StartAudioRecording', 'click', explorationId);
            },
            registerUploadAudioEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('UploadRecordedAudio', 'click', explorationId);
            },
        };
    }]);


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvbG9hZGluZy1kb3RzL2xvYWRpbmctZG90cy5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9zdW1tYXJ5LXRpbGUtZGlyZWN0aXZlcy9jb2xsZWN0aW9uLXN1bW1hcnktdGlsZS9jb2xsZWN0aW9uLXN1bW1hcnktdGlsZS5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2xlYXJuZXJfZGFzaGJvYXJkL0xlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkc09iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2xlYXJuZXJfZGFzaGJvYXJkL0xlYXJuZXJEYXNoYm9hcmRJZHNCYWNrZW5kQXBpU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vbGVhcm5lcl9kYXNoYm9hcmQvTGVhcm5lclBsYXlsaXN0U2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vdXRpbGl0aWVzL0F1ZGlvTGFuZ3VhZ2VPYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi91dGlsaXRpZXMvQXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VPYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi91dGlsaXRpZXMvQnJvd3NlckNoZWNrZXJTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi91dGlsaXRpZXMvTGFuZ3VhZ2VVdGlsU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9maWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvY29udmVydC10by1wbGFpbi10ZXh0LmZpbHRlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9saWJyYXJ5LXBhZ2UvYWN0aXZpdHktdGlsZXMtaW5maW5pdHktZ3JpZC9hY3Rpdml0eS10aWxlcy1pbmZpbml0eS1ncmlkLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9saWJyYXJ5LXBhZ2UvbGlicmFyeS1mb290ZXIvbGlicmFyeS1mb290ZXIuY29udHJvbGxlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9saWJyYXJ5LXBhZ2UvbGlicmFyeS1wYWdlLmNvbnRyb2xsZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvbGlicmFyeS1wYWdlL3NlYXJjaC1iYXIvc2VhcmNoLWJhci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvbGlicmFyeS1wYWdlL3NlYXJjaC1yZXN1bHRzL3NlYXJjaC1yZXN1bHRzLmRpcmVjdGl2ZXMudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvQ29uc3RydWN0VHJhbnNsYXRpb25JZHNTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL0RlYm91bmNlclNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvSHRtbEVzY2FwZXJTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL05hdmlnYXRpb25TZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL1BhZ2VUaXRsZVNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvU2VhcmNoU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9TaXRlQW5hbHl0aWNzU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0JBQVEsb0JBQW9CO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQWlCLDRCQUE0QjtBQUM3QztBQUNBO0FBQ0EsMEJBQWtCLDJCQUEyQjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxrREFBMEMsZ0NBQWdDO0FBQzFFO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0VBQXdELGtCQUFrQjtBQUMxRTtBQUNBLHlEQUFpRCxjQUFjO0FBQy9EOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpREFBeUMsaUNBQWlDO0FBQzFFLHdIQUFnSCxtQkFBbUIsRUFBRTtBQUNySTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1DQUEyQiwwQkFBMEIsRUFBRTtBQUN2RCx5Q0FBaUMsZUFBZTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4REFBc0QsK0RBQStEOztBQUVySDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQWdCLHVCQUF1QjtBQUN2Qzs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQSxzQ0FBc0MsRUFBRTtBQUN4QztBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsd0pBQTREO0FBQ3BFLG1CQUFPLENBQUMsb0tBQWtFO0FBQzFFLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JELG1CQUFPLENBQUMsc0dBQW1DO0FBQzNDLG1CQUFPLENBQUMsa0ZBQXlCO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDakhMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSxLQUFLOzs7Ozs7Ozs7Ozs7QUM1S0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUVBQW1FLEdBQUc7QUFDdEU7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsNERBQTRELEdBQUcsRUFBRSxFQUFFO0FBQ25FO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0Esb0RBQW9ELEdBQUc7QUFDdkQ7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUMsdUJBQXVCO0FBQzFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUsiLCJmaWxlIjoibGlicmFyeS5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBpbnN0YWxsIGEgSlNPTlAgY2FsbGJhY2sgZm9yIGNodW5rIGxvYWRpbmdcbiBcdGZ1bmN0aW9uIHdlYnBhY2tKc29ucENhbGxiYWNrKGRhdGEpIHtcbiBcdFx0dmFyIGNodW5rSWRzID0gZGF0YVswXTtcbiBcdFx0dmFyIG1vcmVNb2R1bGVzID0gZGF0YVsxXTtcbiBcdFx0dmFyIGV4ZWN1dGVNb2R1bGVzID0gZGF0YVsyXTtcblxuIFx0XHQvLyBhZGQgXCJtb3JlTW9kdWxlc1wiIHRvIHRoZSBtb2R1bGVzIG9iamVjdCxcbiBcdFx0Ly8gdGhlbiBmbGFnIGFsbCBcImNodW5rSWRzXCIgYXMgbG9hZGVkIGFuZCBmaXJlIGNhbGxiYWNrXG4gXHRcdHZhciBtb2R1bGVJZCwgY2h1bmtJZCwgaSA9IDAsIHJlc29sdmVzID0gW107XG4gXHRcdGZvcig7aSA8IGNodW5rSWRzLmxlbmd0aDsgaSsrKSB7XG4gXHRcdFx0Y2h1bmtJZCA9IGNodW5rSWRzW2ldO1xuIFx0XHRcdGlmKGluc3RhbGxlZENodW5rc1tjaHVua0lkXSkge1xuIFx0XHRcdFx0cmVzb2x2ZXMucHVzaChpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF1bMF0pO1xuIFx0XHRcdH1cbiBcdFx0XHRpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0gPSAwO1xuIFx0XHR9XG4gXHRcdGZvcihtb2R1bGVJZCBpbiBtb3JlTW9kdWxlcykge1xuIFx0XHRcdGlmKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtb3JlTW9kdWxlcywgbW9kdWxlSWQpKSB7XG4gXHRcdFx0XHRtb2R1bGVzW21vZHVsZUlkXSA9IG1vcmVNb2R1bGVzW21vZHVsZUlkXTtcbiBcdFx0XHR9XG4gXHRcdH1cbiBcdFx0aWYocGFyZW50SnNvbnBGdW5jdGlvbikgcGFyZW50SnNvbnBGdW5jdGlvbihkYXRhKTtcblxuIFx0XHR3aGlsZShyZXNvbHZlcy5sZW5ndGgpIHtcbiBcdFx0XHRyZXNvbHZlcy5zaGlmdCgpKCk7XG4gXHRcdH1cblxuIFx0XHQvLyBhZGQgZW50cnkgbW9kdWxlcyBmcm9tIGxvYWRlZCBjaHVuayB0byBkZWZlcnJlZCBsaXN0XG4gXHRcdGRlZmVycmVkTW9kdWxlcy5wdXNoLmFwcGx5KGRlZmVycmVkTW9kdWxlcywgZXhlY3V0ZU1vZHVsZXMgfHwgW10pO1xuXG4gXHRcdC8vIHJ1biBkZWZlcnJlZCBtb2R1bGVzIHdoZW4gYWxsIGNodW5rcyByZWFkeVxuIFx0XHRyZXR1cm4gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKTtcbiBcdH07XG4gXHRmdW5jdGlvbiBjaGVja0RlZmVycmVkTW9kdWxlcygpIHtcbiBcdFx0dmFyIHJlc3VsdDtcbiBcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGRlZmVycmVkTW9kdWxlcy5sZW5ndGg7IGkrKykge1xuIFx0XHRcdHZhciBkZWZlcnJlZE1vZHVsZSA9IGRlZmVycmVkTW9kdWxlc1tpXTtcbiBcdFx0XHR2YXIgZnVsZmlsbGVkID0gdHJ1ZTtcbiBcdFx0XHRmb3IodmFyIGogPSAxOyBqIDwgZGVmZXJyZWRNb2R1bGUubGVuZ3RoOyBqKyspIHtcbiBcdFx0XHRcdHZhciBkZXBJZCA9IGRlZmVycmVkTW9kdWxlW2pdO1xuIFx0XHRcdFx0aWYoaW5zdGFsbGVkQ2h1bmtzW2RlcElkXSAhPT0gMCkgZnVsZmlsbGVkID0gZmFsc2U7XG4gXHRcdFx0fVxuIFx0XHRcdGlmKGZ1bGZpbGxlZCkge1xuIFx0XHRcdFx0ZGVmZXJyZWRNb2R1bGVzLnNwbGljZShpLS0sIDEpO1xuIFx0XHRcdFx0cmVzdWx0ID0gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSBkZWZlcnJlZE1vZHVsZVswXSk7XG4gXHRcdFx0fVxuIFx0XHR9XG4gXHRcdHJldHVybiByZXN1bHQ7XG4gXHR9XG5cbiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIG9iamVjdCB0byBzdG9yZSBsb2FkZWQgYW5kIGxvYWRpbmcgY2h1bmtzXG4gXHQvLyB1bmRlZmluZWQgPSBjaHVuayBub3QgbG9hZGVkLCBudWxsID0gY2h1bmsgcHJlbG9hZGVkL3ByZWZldGNoZWRcbiBcdC8vIFByb21pc2UgPSBjaHVuayBsb2FkaW5nLCAwID0gY2h1bmsgbG9hZGVkXG4gXHR2YXIgaW5zdGFsbGVkQ2h1bmtzID0ge1xuIFx0XHRcImxpYnJhcnlcIjogMFxuIFx0fTtcblxuIFx0dmFyIGRlZmVycmVkTW9kdWxlcyA9IFtdO1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHR2YXIganNvbnBBcnJheSA9IHdpbmRvd1tcIndlYnBhY2tKc29ucFwiXSA9IHdpbmRvd1tcIndlYnBhY2tKc29ucFwiXSB8fCBbXTtcbiBcdHZhciBvbGRKc29ucEZ1bmN0aW9uID0ganNvbnBBcnJheS5wdXNoLmJpbmQoanNvbnBBcnJheSk7XG4gXHRqc29ucEFycmF5LnB1c2ggPSB3ZWJwYWNrSnNvbnBDYWxsYmFjaztcbiBcdGpzb25wQXJyYXkgPSBqc29ucEFycmF5LnNsaWNlKCk7XG4gXHRmb3IodmFyIGkgPSAwOyBpIDwganNvbnBBcnJheS5sZW5ndGg7IGkrKykgd2VicGFja0pzb25wQ2FsbGJhY2soanNvbnBBcnJheVtpXSk7XG4gXHR2YXIgcGFyZW50SnNvbnBGdW5jdGlvbiA9IG9sZEpzb25wRnVuY3Rpb247XG5cblxuIFx0Ly8gYWRkIGVudHJ5IG1vZHVsZSB0byBkZWZlcnJlZCBsaXN0XG4gXHRkZWZlcnJlZE1vZHVsZXMucHVzaChbXCIuL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2xpYnJhcnktcGFnZS9saWJyYXJ5LXBhZ2UuY29udHJvbGxlci50c1wiLFwiYWJvdXR+YWRtaW5+YXBwfmNvbGxlY3Rpb25fZWRpdG9yfmNvbGxlY3Rpb25fcGxheWVyfmNvbnRhY3R+Y3JlYXRvcl9kYXNoYm9hcmR+ZG9uYXRlfmVtYWlsX2Rhc2hib2FyZH5jMWU1MGNjMFwiLFwiY29sbGVjdGlvbl9wbGF5ZXJ+Y3JlYXRvcl9kYXNoYm9hcmR+ZXhwbG9yYXRpb25fZWRpdG9yfmV4cGxvcmF0aW9uX3BsYXllcn5sZWFybmVyX2Rhc2hib2FyZH5saWJyYXJ5fn44OGNhYTVkZlwiLFwiY29sbGVjdGlvbl9wbGF5ZXJ+bGVhcm5lcl9kYXNoYm9hcmR+bGlicmFyeX5wcm9maWxlXCJdKTtcbiBcdC8vIHJ1biBkZWZlcnJlZCBtb2R1bGVzIHdoZW4gcmVhZHlcbiBcdHJldHVybiBjaGVja0RlZmVycmVkTW9kdWxlcygpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIGRpc3BsYXlpbmcgYW5pbWF0ZWQgbG9hZGluZyBkb3RzLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnbG9hZGluZ0RvdHNNb2R1bGUnKS5kaXJlY3RpdmUoJ2xvYWRpbmdEb3RzJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvbG9hZGluZy1kb3RzLycgK1xuICAgICAgICAgICAgICAgICdsb2FkaW5nLWRvdHMuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtmdW5jdGlvbiAoKSB7IH1dXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFN1bW1hcnkgdGlsZSBmb3IgY29sbGVjdGlvbnMuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9sZWFybmVyX2Rhc2hib2FyZC9MZWFybmVyRGFzaGJvYXJkSWNvbnNEaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2ZpbHRlcnMvc3RyaW5nLXV0aWxpdHktZmlsdGVycy90cnVuY2F0ZS1hbmQtY2FwaXRhbGl6ZS5maWx0ZXIudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0RhdGVUaW1lRm9ybWF0U2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvVXNlclNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdjb2xsZWN0aW9uU3VtbWFyeVRpbGVNb2R1bGUnKS5kaXJlY3RpdmUoJ2NvbGxlY3Rpb25TdW1tYXJ5VGlsZScsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7XG4gICAgICAgICAgICAgICAgZ2V0Q29sbGVjdGlvbklkOiAnJmNvbGxlY3Rpb25JZCcsXG4gICAgICAgICAgICAgICAgZ2V0Q29sbGVjdGlvblRpdGxlOiAnJmNvbGxlY3Rpb25UaXRsZScsXG4gICAgICAgICAgICAgICAgZ2V0T2JqZWN0aXZlOiAnJm9iamVjdGl2ZScsXG4gICAgICAgICAgICAgICAgZ2V0Tm9kZUNvdW50OiAnJm5vZGVDb3VudCcsXG4gICAgICAgICAgICAgICAgZ2V0TGFzdFVwZGF0ZWRNc2VjOiAnJmxhc3RVcGRhdGVkTXNlYycsXG4gICAgICAgICAgICAgICAgZ2V0VGh1bWJuYWlsSWNvblVybDogJyZ0aHVtYm5haWxJY29uVXJsJyxcbiAgICAgICAgICAgICAgICBnZXRUaHVtYm5haWxCZ0NvbG9yOiAnJnRodW1ibmFpbEJnQ29sb3InLFxuICAgICAgICAgICAgICAgIGlzTGlua2VkVG9FZGl0b3JQYWdlOiAnPT9pc0xpbmtlZFRvRWRpdG9yUGFnZScsXG4gICAgICAgICAgICAgICAgZ2V0Q2F0ZWdvcnk6ICcmY2F0ZWdvcnknLFxuICAgICAgICAgICAgICAgIGlzUGxheWxpc3RUaWxlOiAnJmlzUGxheWxpc3RUaWxlJyxcbiAgICAgICAgICAgICAgICBzaG93TGVhcm5lckRhc2hib2FyZEljb25zSWZQb3NzaWJsZTogKCcmc2hvd0xlYXJuZXJEYXNoYm9hcmRJY29uc0lmUG9zc2libGUnKSxcbiAgICAgICAgICAgICAgICBpc0NvbnRhaW5lck5hcnJvdzogJyZjb250YWluZXJJc05hcnJvdycsXG4gICAgICAgICAgICAgICAgaXNPd25lZEJ5Q3VycmVudFVzZXI6ICcmYWN0aXZpdHlJc093bmVkQnlDdXJyZW50VXNlcicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9zdW1tYXJ5LXRpbGUtZGlyZWN0aXZlcy9jb2xsZWN0aW9uLXN1bW1hcnktdGlsZS8nICtcbiAgICAgICAgICAgICAgICAnY29sbGVjdGlvbi1zdW1tYXJ5LXRpbGUuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnRGF0ZVRpbWVGb3JtYXRTZXJ2aWNlJywgJ1VzZXJTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnQ09MTEVDVElPTl9WSUVXRVJfVVJMJywgJ0NPTExFQ1RJT05fRURJVE9SX1VSTCcsIGZ1bmN0aW9uIChEYXRlVGltZUZvcm1hdFNlcnZpY2UsIFVzZXJTZXJ2aWNlLCBDT0xMRUNUSU9OX1ZJRVdFUl9VUkwsIENPTExFQ1RJT05fRURJVE9SX1VSTCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwudXNlcklzTG9nZ2VkSW4gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBVc2VyU2VydmljZS5nZXRVc2VySW5mb0FzeW5jKCkudGhlbihmdW5jdGlvbiAodXNlckluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudXNlcklzTG9nZ2VkSW4gPSB1c2VySW5mby5pc0xvZ2dlZEluKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLkRFRkFVTFRfRU1QVFlfVElUTEUgPSAnVW50aXRsZWQnO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLkFDVElWSVRZX1RZUEVfQ09MTEVDVElPTiA9IGNvbnN0YW50cy5BQ1RJVklUWV9UWVBFX0NPTExFQ1RJT047XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0TGFzdFVwZGF0ZWREYXRldGltZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBEYXRlVGltZUZvcm1hdFNlcnZpY2UuZ2V0TG9jYWxlQWJicmV2aWF0ZWREYXRldGltZVN0cmluZyhjdHJsLmdldExhc3RVcGRhdGVkTXNlYygpKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRDb2xsZWN0aW9uTGluayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXRVcmwgPSAoY3RybC5pc0xpbmtlZFRvRWRpdG9yUGFnZSA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQ09MTEVDVElPTl9FRElUT1JfVVJMIDogQ09MTEVDVElPTl9WSUVXRVJfVVJMKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybCh0YXJnZXRVcmwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uX2lkOiBjdHJsLmdldENvbGxlY3Rpb25JZCgpXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRDb21wbGV0ZVRodW1ibmFpbEljb25VcmwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmwoY3RybC5nZXRUaHVtYm5haWxJY29uVXJsKCkpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldFN0YXRpY0ltYWdlVXJsID0gZnVuY3Rpb24gKHVybCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldFN0YXRpY0ltYWdlVXJsKHVybCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2V0SG92ZXJTdGF0ZSA9IGZ1bmN0aW9uIChob3ZlclN0YXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmNvbGxlY3Rpb25Jc0N1cnJlbnRseUhvdmVyZWRPdmVyID0gaG92ZXJTdGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIG5ldyBmcm9udGVuZCBpbnN0YW5jZXMgb2YgbGVhcm5lclxuICAgZGFzaGJvYXJkIGFjdGl2aXR5IGlkcyBkb21haW4gb2JqZWN0LlxuICovXG5vcHBpYS5mYWN0b3J5KCdMZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHNPYmplY3RGYWN0b3J5JywgW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIExlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcyA9IGZ1bmN0aW9uIChpbmNvbXBsZXRlRXhwbG9yYXRpb25JZHMsIGluY29tcGxldGVDb2xsZWN0aW9uSWRzLCBjb21wbGV0ZWRFeHBsb3JhdGlvbklkcywgY29tcGxldGVkQ29sbGVjdGlvbklkcywgZXhwbG9yYXRpb25QbGF5bGlzdElkcywgY29sbGVjdGlvblBsYXlsaXN0SWRzKSB7XG4gICAgICAgICAgICB0aGlzLmluY29tcGxldGVFeHBsb3JhdGlvbklkcyA9IGluY29tcGxldGVFeHBsb3JhdGlvbklkcztcbiAgICAgICAgICAgIHRoaXMuaW5jb21wbGV0ZUNvbGxlY3Rpb25JZHMgPSBpbmNvbXBsZXRlQ29sbGVjdGlvbklkcztcbiAgICAgICAgICAgIHRoaXMuY29tcGxldGVkRXhwbG9yYXRpb25JZHMgPSBjb21wbGV0ZWRFeHBsb3JhdGlvbklkcztcbiAgICAgICAgICAgIHRoaXMuY29tcGxldGVkQ29sbGVjdGlvbklkcyA9IGNvbXBsZXRlZENvbGxlY3Rpb25JZHM7XG4gICAgICAgICAgICB0aGlzLmV4cGxvcmF0aW9uUGxheWxpc3RJZHMgPSBleHBsb3JhdGlvblBsYXlsaXN0SWRzO1xuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uUGxheWxpc3RJZHMgPSBjb2xsZWN0aW9uUGxheWxpc3RJZHM7XG4gICAgICAgIH07XG4gICAgICAgIExlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcy5wcm90b3R5cGUuaW5jbHVkZXNBY3Rpdml0eSA9IChmdW5jdGlvbiAoYWN0aXZpdHlJZCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuaW5jb21wbGV0ZUNvbGxlY3Rpb25JZHMuaW5kZXhPZihhY3Rpdml0eUlkKSAhPT0gLTEgfHxcbiAgICAgICAgICAgICAgICB0aGlzLmNvbXBsZXRlZENvbGxlY3Rpb25JZHMuaW5kZXhPZihhY3Rpdml0eUlkKSAhPT0gLTEgfHxcbiAgICAgICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb25QbGF5bGlzdElkcy5pbmRleE9mKGFjdGl2aXR5SWQpICE9PSAtMSB8fFxuICAgICAgICAgICAgICAgIHRoaXMuaW5jb21wbGV0ZUV4cGxvcmF0aW9uSWRzLmluZGV4T2YoYWN0aXZpdHlJZCkgIT09IC0xIHx8XG4gICAgICAgICAgICAgICAgdGhpcy5jb21wbGV0ZWRFeHBsb3JhdGlvbklkcy5pbmRleE9mKGFjdGl2aXR5SWQpICE9PSAtMSB8fFxuICAgICAgICAgICAgICAgIHRoaXMuZXhwbG9yYXRpb25QbGF5bGlzdElkcy5pbmRleE9mKGFjdGl2aXR5SWQpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgTGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzLnByb3RvdHlwZS5iZWxvbmdzVG9FeHBsb3JhdGlvblBsYXlsaXN0ID0gKGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5leHBsb3JhdGlvblBsYXlsaXN0SWRzLmluZGV4T2YoZXhwbG9yYXRpb25JZCkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBMZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMucHJvdG90eXBlLmJlbG9uZ3NUb0NvbGxlY3Rpb25QbGF5bGlzdCA9IChmdW5jdGlvbiAoY29sbGVjdGlvbklkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jb2xsZWN0aW9uUGxheWxpc3RJZHMuaW5kZXhPZihjb2xsZWN0aW9uSWQpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgTGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzLnByb3RvdHlwZS5iZWxvbmdzVG9Db21wbGV0ZWRFeHBsb3JhdGlvbnMgPSAoZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbXBsZXRlZEV4cGxvcmF0aW9uSWRzLmluZGV4T2YoZXhwbG9yYXRpb25JZCkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBMZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMucHJvdG90eXBlLmJlbG9uZ3NUb0NvbXBsZXRlZENvbGxlY3Rpb25zID0gKGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbXBsZXRlZENvbGxlY3Rpb25JZHMuaW5kZXhPZihjb2xsZWN0aW9uSWQpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgTGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzLnByb3RvdHlwZS5iZWxvbmdzVG9JbmNvbXBsZXRlRXhwbG9yYXRpb25zID0gKGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5pbmNvbXBsZXRlRXhwbG9yYXRpb25JZHMuaW5kZXhPZihleHBsb3JhdGlvbklkKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIExlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcy5wcm90b3R5cGUuYmVsb25nc1RvSW5jb21wbGV0ZUNvbGxlY3Rpb25zID0gKGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmluY29tcGxldGVDb2xsZWN0aW9uSWRzLmluZGV4T2YoY29sbGVjdGlvbklkKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIExlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkcy5wcm90b3R5cGUuYWRkVG9FeHBsb3JhdGlvbkxlYXJuZXJQbGF5bGlzdCA9IChmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgdGhpcy5leHBsb3JhdGlvblBsYXlsaXN0SWRzLnB1c2goZXhwbG9yYXRpb25JZCk7XG4gICAgICAgIH0pO1xuICAgICAgICBMZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMucHJvdG90eXBlLnJlbW92ZUZyb21FeHBsb3JhdGlvbkxlYXJuZXJQbGF5bGlzdCA9IChmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5leHBsb3JhdGlvblBsYXlsaXN0SWRzLmluZGV4T2YoZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5leHBsb3JhdGlvblBsYXlsaXN0SWRzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBMZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMucHJvdG90eXBlLmFkZFRvQ29sbGVjdGlvbkxlYXJuZXJQbGF5bGlzdCA9IChmdW5jdGlvbiAoY29sbGVjdGlvbklkKSB7XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb25QbGF5bGlzdElkcy5wdXNoKGNvbGxlY3Rpb25JZCk7XG4gICAgICAgIH0pO1xuICAgICAgICBMZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMucHJvdG90eXBlLnJlbW92ZUZyb21Db2xsZWN0aW9uTGVhcm5lclBsYXlsaXN0ID0gKGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQpIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuY29sbGVjdGlvblBsYXlsaXN0SWRzLmluZGV4T2YoY29sbGVjdGlvbklkKTtcbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb25QbGF5bGlzdElkcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgTGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzWydjcmVhdGVGcm9tQmFja2VuZERpY3QnXSA9IGZ1bmN0aW9uIChcbiAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgbGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzRGljdCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBMZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMobGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzRGljdC5pbmNvbXBsZXRlX2V4cGxvcmF0aW9uX2lkcywgbGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzRGljdC5pbmNvbXBsZXRlX2NvbGxlY3Rpb25faWRzLCBsZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHNEaWN0LmNvbXBsZXRlZF9leHBsb3JhdGlvbl9pZHMsIGxlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkc0RpY3QuY29tcGxldGVkX2NvbGxlY3Rpb25faWRzLCBsZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHNEaWN0LmV4cGxvcmF0aW9uX3BsYXlsaXN0X2lkcywgbGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzRGljdC5jb2xsZWN0aW9uX3BsYXlsaXN0X2lkcyk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBMZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHM7XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBCYWNrZW5kIHNlcnZpY2VzIHJlbGF0ZWQgdG8gZmV0Y2hpbmcgdGhlIGlkcyBvZiB0aGVcbiAqIGFjdGl2aXRpZXMgcHJlc2VudCBpbiB0aGUgbGVhcm5lciBkYXNoYm9hcmQuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ0xlYXJuZXJEYXNoYm9hcmRJZHNCYWNrZW5kQXBpU2VydmljZScsIFtcbiAgICAnJGh0dHAnLCBmdW5jdGlvbiAoJGh0dHApIHtcbiAgICAgICAgdmFyIF9mZXRjaExlYXJuZXJEYXNoYm9hcmRJZHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbGVhcm5lcmRhc2hib2FyZGlkc2hhbmRsZXIvZGF0YScpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmV0Y2hMZWFybmVyRGFzaGJvYXJkSWRzOiBfZmV0Y2hMZWFybmVyRGFzaGJvYXJkSWRzXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgcmVsYXRlZCB0byB0aGUgbGVhcm5lciBwbGF5bGlzdC5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xub3BwaWEuZmFjdG9yeSgnTGVhcm5lclBsYXlsaXN0U2VydmljZScsIFtcbiAgICAnJGh0dHAnLCAnJHVpYk1vZGFsJywgJ0FsZXJ0c1NlcnZpY2UnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJHVpYk1vZGFsLCBBbGVydHNTZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICB2YXIgX2FkZFRvTGVhcm5lclBsYXlsaXN0ID0gZnVuY3Rpb24gKGFjdGl2aXR5SWQsIGFjdGl2aXR5VHlwZSkge1xuICAgICAgICAgICAgdmFyIHN1Y2Nlc3NmdWxseUFkZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhciBhZGRUb0xlYXJuZXJQbGF5bGlzdFVybCA9IChVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybCgnL2xlYXJuZXJwbGF5bGlzdGFjdGl2aXR5aGFuZGxlci88YWN0aXZpdHlUeXBlPi88YWN0aXZpdHlJZD4nLCB7XG4gICAgICAgICAgICAgICAgYWN0aXZpdHlUeXBlOiBhY3Rpdml0eVR5cGUsXG4gICAgICAgICAgICAgICAgYWN0aXZpdHlJZDogYWN0aXZpdHlJZFxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgJGh0dHAucG9zdChhZGRUb0xlYXJuZXJQbGF5bGlzdFVybCwge30pXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmRhdGEuYmVsb25nc190b19jb21wbGV0ZWRfb3JfaW5jb21wbGV0ZV9saXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NmdWxseUFkZGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkSW5mb01lc3NhZ2UoJ1lvdSBoYXZlIGFscmVhZHkgY29tcGxldGVkIG9yIGFyZSBjb21wbGV0aW5nIHRoaXMgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnYWN0aXZpdHkuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5kYXRhLmJlbG9uZ3NfdG9fc3Vic2NyaWJlZF9hY3Rpdml0aWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NmdWxseUFkZGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkSW5mb01lc3NhZ2UoJ1RoaXMgaXMgcHJlc2VudCBpbiB5b3VyIGNyZWF0b3IgZGFzaGJvYXJkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5kYXRhLnBsYXlsaXN0X2xpbWl0X2V4Y2VlZGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NmdWxseUFkZGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkSW5mb01lc3NhZ2UoJ1lvdXIgXFwnUGxheSBMYXRlclxcJyBsaXN0IGlzIGZ1bGwhICBFaXRoZXIgeW91IGNhbiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdjb21wbGV0ZSBzb21lIG9yIHlvdSBjYW4gaGVhZCB0byB0aGUgbGVhcm5lciBkYXNoYm9hcmQgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnYW5kIHJlbW92ZSBzb21lLicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc2Z1bGx5QWRkZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRTdWNjZXNzTWVzc2FnZSgnU3VjY2Vzc2Z1bGx5IGFkZGVkIHRvIHlvdXIgXFwnUGxheSBMYXRlclxcJyBsaXN0LicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3NmdWxseUFkZGVkO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX3JlbW92ZUZyb21MZWFybmVyUGxheWxpc3QgPSBmdW5jdGlvbiAoYWN0aXZpdHlJZCwgYWN0aXZpdHlUaXRsZSwgYWN0aXZpdHlUeXBlLCBsZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMpIHtcbiAgICAgICAgICAgICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9sZWFybmVyLWRhc2hib2FyZC1wYWdlJyArXG4gICAgICAgICAgICAgICAgICAgICcvcmVtb3ZlLWFjdGl2aXR5LWZyb20tbGVhcm5lci1kYXNoYmFvcmQtcGFnZScgK1xuICAgICAgICAgICAgICAgICAgICAnL3JlbW92ZS1hY3Rpdml0eS1mcm9tLWxlYXJuZXItZGFzaGJvYXJkLW1vZGFsLnRlbXBsYXRlLmh0bWwnKSxcbiAgICAgICAgICAgICAgICBiYWNrZHJvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGl2aXR5SWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhY3Rpdml0eUlkO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBhY3Rpdml0eVRpdGxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWN0aXZpdHlUaXRsZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyR1aWJNb2RhbEluc3RhbmNlJywgJyRodHRwJywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJHVpYk1vZGFsSW5zdGFuY2UsICRodHRwLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlY3Rpb25OYW1lSTE4bklkID0gKCdJMThOX0xFQVJORVJfREFTSEJPQVJEX1BMQVlMSVNUX1NFQ1RJT04nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5hY3Rpdml0eVRpdGxlID0gYWN0aXZpdHlUaXRsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZW1vdmVGcm9tTGVhcm5lclBsYXlsaXN0VXJsID0gKFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKCcvbGVhcm5lcnBsYXlsaXN0YWN0aXZpdHloYW5kbGVyLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8YWN0aXZpdHlUeXBlPi88YWN0aXZpdHlJZD4nLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZpdHlUeXBlOiBhY3Rpdml0eVR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZpdHlJZDogYWN0aXZpdHlJZFxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkaHR0cFsnZGVsZXRlJ10ocmVtb3ZlRnJvbUxlYXJuZXJQbGF5bGlzdFVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0pLnJlc3VsdC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aXZpdHlUeXBlID09PSBjb25zdGFudHMuQUNUSVZJVFlfVFlQRV9FWFBMT1JBVElPTikge1xuICAgICAgICAgICAgICAgICAgICBsZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHMucmVtb3ZlRnJvbUV4cGxvcmF0aW9uTGVhcm5lclBsYXlsaXN0KGFjdGl2aXR5SWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChhY3Rpdml0eVR5cGUgPT09IGNvbnN0YW50cy5BQ1RJVklUWV9UWVBFX0NPTExFQ1RJT04pIHtcbiAgICAgICAgICAgICAgICAgICAgbGVhcm5lckRhc2hib2FyZEFjdGl2aXR5SWRzLnJlbW92ZUZyb21Db2xsZWN0aW9uTGVhcm5lclBsYXlsaXN0KGFjdGl2aXR5SWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYWRkVG9MZWFybmVyUGxheWxpc3Q6IF9hZGRUb0xlYXJuZXJQbGF5bGlzdCxcbiAgICAgICAgICAgIHJlbW92ZUZyb21MZWFybmVyUGxheWxpc3Q6IF9yZW1vdmVGcm9tTGVhcm5lclBsYXlsaXN0XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE9iamVjdCBmYWN0b3J5IGZvciBjcmVhdGluZyBhdWRpbyBsYW5ndWFnZXMuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ0F1ZGlvTGFuZ3VhZ2VPYmplY3RGYWN0b3J5JywgW1xuICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIEF1ZGlvTGFuZ3VhZ2UgPSBmdW5jdGlvbiAoaWQsIGRlc2NyaXB0aW9uLCByZWxhdGVkTGFuZ3VhZ2VzKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gZGVzY3JpcHRpb247XG4gICAgICAgICAgICB0aGlzLnJlbGF0ZWRMYW5ndWFnZXMgPSByZWxhdGVkTGFuZ3VhZ2VzO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBBdWRpb0xhbmd1YWdlWydjcmVhdGVGcm9tRGljdCddID0gZnVuY3Rpb24gKGF1ZGlvTGFuZ3VhZ2VEaWN0KSB7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBBdWRpb0xhbmd1YWdlKGF1ZGlvTGFuZ3VhZ2VEaWN0LmlkLCBhdWRpb0xhbmd1YWdlRGljdC5kZXNjcmlwdGlvbiwgYXVkaW9MYW5ndWFnZURpY3QucmVsYXRlZF9sYW5ndWFnZXMpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gQXVkaW9MYW5ndWFnZTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgT2JqZWN0IGZhY3RvcnkgZm9yIGNyZWF0aW5nIGF1dG9nZW5lcmF0ZWQgYXVkaW8gbGFuZ3VhZ2VzLlxuICovXG5vcHBpYS5mYWN0b3J5KCdBdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZU9iamVjdEZhY3RvcnknLCBbXG4gICAgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgQXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2UgPSBmdW5jdGlvbiAoaWQsIGRlc2NyaXB0aW9uLCBleHBsb3JhdGlvbkxhbmd1YWdlLCBzcGVlY2hTeW50aGVzaXNDb2RlLCBzcGVlY2hTeW50aGVzaXNDb2RlTW9iaWxlKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gZGVzY3JpcHRpb247XG4gICAgICAgICAgICB0aGlzLmV4cGxvcmF0aW9uTGFuZ3VhZ2UgPSBleHBsb3JhdGlvbkxhbmd1YWdlO1xuICAgICAgICAgICAgdGhpcy5zcGVlY2hTeW50aGVzaXNDb2RlID0gc3BlZWNoU3ludGhlc2lzQ29kZTtcbiAgICAgICAgICAgIHRoaXMuc3BlZWNoU3ludGhlc2lzQ29kZU1vYmlsZSA9IHNwZWVjaFN5bnRoZXNpc0NvZGVNb2JpbGU7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIEF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlWydjcmVhdGVGcm9tRGljdCddID0gKFxuICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBmdW5jdGlvbiAoYXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VEaWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlKGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlRGljdC5pZCwgYXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VEaWN0LmRlc2NyaXB0aW9uLCBhdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZURpY3QuZXhwbG9yYXRpb25fbGFuZ3VhZ2UsIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlRGljdC5zcGVlY2hfc3ludGhlc2lzX2NvZGUsIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlRGljdC5zcGVlY2hfc3ludGhlc2lzX2NvZGVfbW9iaWxlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBBdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVXRpbGl0eSBzZXJ2aWNlIGZvciBjaGVja2luZyB3ZWIgYnJvd3NlciB0eXBlLlxuICovXG5vcHBpYS5mYWN0b3J5KCdCcm93c2VyQ2hlY2tlclNlcnZpY2UnLCBbXG4gICAgJ0FVVE9HRU5FUkFURURfQVVESU9fTEFOR1VBR0VTJyxcbiAgICBmdW5jdGlvbiAoQVVUT0dFTkVSQVRFRF9BVURJT19MQU5HVUFHRVMpIHtcbiAgICAgICAgLy8gRm9yIGRldGFpbHMgb24gdGhlIHJlbGlhYmlsaXR5IG9mIHRoaXMgY2hlY2ssIHNlZVxuICAgICAgICAvLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy85ODQ3NTgwL1xuICAgICAgICAvLyBob3ctdG8tZGV0ZWN0LXNhZmFyaS1jaHJvbWUtaWUtZmlyZWZveC1hbmQtb3BlcmEtYnJvd3NlciNhbnN3ZXItOTg1MTc2OVxuICAgICAgICB2YXIgaXNTYWZhcmkgPSAvY29uc3RydWN0b3IvaS50ZXN0KHdpbmRvdy5IVE1MRWxlbWVudCkgfHwgKGZ1bmN0aW9uIChwKSB7XG4gICAgICAgICAgICByZXR1cm4gcC50b1N0cmluZygpID09PSAnW29iamVjdCBTYWZhcmlSZW1vdGVOb3RpZmljYXRpb25dJztcbiAgICAgICAgfSkoIXdpbmRvdy5zYWZhcmkgfHxcbiAgICAgICAgICAgICh0eXBlb2Ygd2luZG93LnNhZmFyaSAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LnNhZmFyaS5wdXNoTm90aWZpY2F0aW9uKSk7XG4gICAgICAgIHZhciBfc3VwcG9ydHNTcGVlY2hTeW50aGVzaXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgc3VwcG9ydExhbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmICh3aW5kb3cuaGFzT3duUHJvcGVydHkoJ3NwZWVjaFN5bnRoZXNpcycpKSB7XG4gICAgICAgICAgICAgICAgc3BlZWNoU3ludGhlc2lzLmdldFZvaWNlcygpLmZvckVhY2goZnVuY3Rpb24gKHZvaWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIEFVVE9HRU5FUkFURURfQVVESU9fTEFOR1VBR0VTLmZvckVhY2goZnVuY3Rpb24gKGF1ZGlvTGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2b2ljZS5sYW5nID09PSBhdWRpb0xhbmd1YWdlLnNwZWVjaF9zeW50aGVzaXNfY29kZSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChfaXNNb2JpbGVEZXZpY2UoKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2b2ljZS5sYW5nID09PSBhdWRpb0xhbmd1YWdlLnNwZWVjaF9zeW50aGVzaXNfY29kZV9tb2JpbGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VwcG9ydExhbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdXBwb3J0TGFuZztcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9pc01vYmlsZURldmljZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB1c2VyQWdlbnQgPSBuYXZpZ2F0b3IudXNlckFnZW50IHx8IG5hdmlnYXRvci52ZW5kb3IgfHwgd2luZG93Lm9wZXJhO1xuICAgICAgICAgICAgcmV0dXJuIHVzZXJBZ2VudC5tYXRjaCgvaVBob25lL2kpIHx8IHVzZXJBZ2VudC5tYXRjaCgvQW5kcm9pZC9pKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1cHBvcnRzU3BlZWNoU3ludGhlc2lzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9zdXBwb3J0c1NwZWVjaFN5bnRoZXNpcygpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzTW9iaWxlRGV2aWNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9pc01vYmlsZURldmljZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBVdGlsaXR5IHNlcnZpY2UgZm9yIGxhbmd1YWdlIG9wZXJhdGlvbnMuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvQXVkaW9MYW5ndWFnZU9iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvQXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VPYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL0Jyb3dzZXJDaGVja2VyU2VydmljZS50cycpO1xub3BwaWEuZmFjdG9yeSgnTGFuZ3VhZ2VVdGlsU2VydmljZScsIFtcbiAgICAnQXVkaW9MYW5ndWFnZU9iamVjdEZhY3RvcnknLCAnQXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VPYmplY3RGYWN0b3J5JyxcbiAgICAnQnJvd3NlckNoZWNrZXJTZXJ2aWNlJywgJ0FMTF9MQU5HVUFHRV9DT0RFUycsXG4gICAgJ0FVVE9HRU5FUkFURURfQVVESU9fTEFOR1VBR0VTJywgJ1NVUFBPUlRFRF9BVURJT19MQU5HVUFHRVMnLFxuICAgIGZ1bmN0aW9uIChBdWRpb0xhbmd1YWdlT2JqZWN0RmFjdG9yeSwgQXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VPYmplY3RGYWN0b3J5LCBCcm93c2VyQ2hlY2tlclNlcnZpY2UsIEFMTF9MQU5HVUFHRV9DT0RFUywgQVVUT0dFTkVSQVRFRF9BVURJT19MQU5HVUFHRVMsIFNVUFBPUlRFRF9BVURJT19MQU5HVUFHRVMpIHtcbiAgICAgICAgdmFyIHN1cHBvcnRlZEF1ZGlvTGFuZ3VhZ2VMaXN0ID0gU1VQUE9SVEVEX0FVRElPX0xBTkdVQUdFUztcbiAgICAgICAgdmFyIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlTGlzdCA9IEFVVE9HRU5FUkFURURfQVVESU9fTEFOR1VBR0VTO1xuICAgICAgICB2YXIgc3VwcG9ydGVkQXVkaW9MYW5ndWFnZXMgPSB7fTtcbiAgICAgICAgdmFyIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlc0J5RXhwbG9yYXRpb25MYW5ndWFnZUNvZGUgPSB7fTtcbiAgICAgICAgdmFyIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlc0J5QXV0b2dlbmVyYXRlZExhbmd1YWdlQ29kZSA9IHt9O1xuICAgICAgICB2YXIgZ2V0U2hvcnRMYW5ndWFnZURlc2NyaXB0aW9uID0gZnVuY3Rpb24gKGZ1bGxMYW5ndWFnZURlc2NyaXB0aW9uKSB7XG4gICAgICAgICAgICB2YXIgaW5kID0gZnVsbExhbmd1YWdlRGVzY3JpcHRpb24uaW5kZXhPZignICgnKTtcbiAgICAgICAgICAgIGlmIChpbmQgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bGxMYW5ndWFnZURlc2NyaXB0aW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bGxMYW5ndWFnZURlc2NyaXB0aW9uLnN1YnN0cmluZygwLCBpbmQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgbGFuZ3VhZ2VJZHNBbmRUZXh0cyA9IEFMTF9MQU5HVUFHRV9DT0RFUy5tYXAoZnVuY3Rpb24gKGxhbmd1YWdlSXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpZDogbGFuZ3VhZ2VJdGVtLmNvZGUsXG4gICAgICAgICAgICAgICAgdGV4dDogZ2V0U2hvcnRMYW5ndWFnZURlc2NyaXB0aW9uKGxhbmd1YWdlSXRlbS5kZXNjcmlwdGlvbilcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgYWxsQXVkaW9MYW5ndWFnZUNvZGVzID0gKHN1cHBvcnRlZEF1ZGlvTGFuZ3VhZ2VMaXN0Lm1hcChmdW5jdGlvbiAoYXVkaW9MYW5ndWFnZSkge1xuICAgICAgICAgICAgcmV0dXJuIGF1ZGlvTGFuZ3VhZ2UuaWQ7XG4gICAgICAgIH0pKTtcbiAgICAgICAgc3VwcG9ydGVkQXVkaW9MYW5ndWFnZUxpc3QuZm9yRWFjaChmdW5jdGlvbiAoYXVkaW9MYW5ndWFnZURpY3QpIHtcbiAgICAgICAgICAgIHN1cHBvcnRlZEF1ZGlvTGFuZ3VhZ2VzW2F1ZGlvTGFuZ3VhZ2VEaWN0LmlkXSA9XG4gICAgICAgICAgICAgICAgQXVkaW9MYW5ndWFnZU9iamVjdEZhY3RvcnkuY3JlYXRlRnJvbURpY3QoYXVkaW9MYW5ndWFnZURpY3QpO1xuICAgICAgICB9KTtcbiAgICAgICAgYXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VMaXN0LmZvckVhY2goZnVuY3Rpb24gKGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlRGljdCkge1xuICAgICAgICAgICAgdmFyIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlID0gQXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VPYmplY3RGYWN0b3J5LmNyZWF0ZUZyb21EaWN0KGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlRGljdCk7XG4gICAgICAgICAgICBhdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZXNCeUV4cGxvcmF0aW9uTGFuZ3VhZ2VDb2RlW2F1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlLmV4cGxvcmF0aW9uTGFuZ3VhZ2VdID1cbiAgICAgICAgICAgICAgICBhdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZTtcbiAgICAgICAgICAgIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlc0J5QXV0b2dlbmVyYXRlZExhbmd1YWdlQ29kZVthdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZS5pZF0gPVxuICAgICAgICAgICAgICAgIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlO1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIGF1ZGlvTGFuZ3VhZ2VzQ291bnQgPSBhbGxBdWRpb0xhbmd1YWdlQ29kZXMubGVuZ3RoO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ2V0TGFuZ3VhZ2VJZHNBbmRUZXh0czogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsYW5ndWFnZUlkc0FuZFRleHRzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEF1ZGlvTGFuZ3VhZ2VzQ291bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXVkaW9MYW5ndWFnZXNDb3VudDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRBbGxWb2ljZW92ZXJMYW5ndWFnZUNvZGVzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFuZ3VsYXIuY29weShhbGxBdWRpb0xhbmd1YWdlQ29kZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEF1ZGlvTGFuZ3VhZ2VEZXNjcmlwdGlvbjogZnVuY3Rpb24gKGF1ZGlvTGFuZ3VhZ2VDb2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1cHBvcnRlZEF1ZGlvTGFuZ3VhZ2VzW2F1ZGlvTGFuZ3VhZ2VDb2RlXS5kZXNjcmlwdGlvbjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBHaXZlbiBhIGxpc3Qgb2YgYXVkaW8gbGFuZ3VhZ2UgY29kZXMsIHJldHVybnMgdGhlIGNvbXBsZW1lbnQgbGlzdCwgaS5lLlxuICAgICAgICAgICAgLy8gdGhlIGxpc3Qgb2YgYXVkaW8gbGFuZ3VhZ2UgY29kZXMgbm90IGluIHRoZSBpbnB1dCBsaXN0LlxuICAgICAgICAgICAgZ2V0Q29tcGxlbWVudEF1ZGlvTGFuZ3VhZ2VDb2RlczogZnVuY3Rpb24gKGF1ZGlvTGFuZ3VhZ2VDb2Rlcykge1xuICAgICAgICAgICAgICAgIHJldHVybiBhbGxBdWRpb0xhbmd1YWdlQ29kZXMuZmlsdGVyKGZ1bmN0aW9uIChsYW5ndWFnZUNvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGF1ZGlvTGFuZ3VhZ2VDb2Rlcy5pbmRleE9mKGxhbmd1YWdlQ29kZSkgPT09IC0xO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldExhbmd1YWdlQ29kZXNSZWxhdGVkVG9BdWRpb0xhbmd1YWdlQ29kZTogZnVuY3Rpb24gKGF1ZGlvTGFuZ3VhZ2VDb2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1cHBvcnRlZEF1ZGlvTGFuZ3VhZ2VzW2F1ZGlvTGFuZ3VhZ2VDb2RlXS5yZWxhdGVkTGFuZ3VhZ2VzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN1cHBvcnRzQXV0b2dlbmVyYXRlZEF1ZGlvOiBmdW5jdGlvbiAoZXhwbG9yYXRpb25MYW5ndWFnZUNvZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKEJyb3dzZXJDaGVja2VyU2VydmljZS5zdXBwb3J0c1NwZWVjaFN5bnRoZXNpcygpICYmXG4gICAgICAgICAgICAgICAgICAgIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlc0J5RXhwbG9yYXRpb25MYW5ndWFnZUNvZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC5oYXNPd25Qcm9wZXJ0eShleHBsb3JhdGlvbkxhbmd1YWdlQ29kZSkpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzQXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2U6IGZ1bmN0aW9uIChhdWRpb0xhbmd1YWdlQ29kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZXNCeUF1dG9nZW5lcmF0ZWRMYW5ndWFnZUNvZGVcbiAgICAgICAgICAgICAgICAgICAgLmhhc093blByb3BlcnR5KGF1ZGlvTGFuZ3VhZ2VDb2RlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRBdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZTogZnVuY3Rpb24gKGV4cGxvcmF0aW9uTGFuZ3VhZ2VDb2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlc0J5RXhwbG9yYXRpb25MYW5ndWFnZUNvZGVbZXhwbG9yYXRpb25MYW5ndWFnZUNvZGVdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb252ZXJ0VG9QbGFpblRleHQgZmlsdGVyIGZvciBPcHBpYS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3N0cmluZ1V0aWxpdHlGaWx0ZXJzTW9kdWxlJykuZmlsdGVyKCdjb252ZXJ0VG9QbGFpblRleHQnLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgc3RyaXBwZWRUZXh0ID0gaW5wdXQucmVwbGFjZSgvKDwoW14+XSspPikvaWcsICcnKTtcbiAgICAgICAgICAgIHN0cmlwcGVkVGV4dCA9IHN0cmlwcGVkVGV4dC5yZXBsYWNlKC8mbmJzcDsvaWcsICcgJyk7XG4gICAgICAgICAgICBzdHJpcHBlZFRleHQgPSBzdHJpcHBlZFRleHQucmVwbGFjZSgvJnF1b3Q7L2lnLCAnJyk7XG4gICAgICAgICAgICB2YXIgdHJpbW1lZFRleHQgPSBzdHJpcHBlZFRleHQudHJpbSgpO1xuICAgICAgICAgICAgaWYgKHRyaW1tZWRUZXh0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdHJpcHBlZFRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJpbW1lZFRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgYW4gaW5maW5pdGVseS1zY3JvbGxhYmxlIHZpZXcgb2YgYWN0aXZpdHkgdGlsZXNcbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvU2VhcmNoU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvY29udGV4dHVhbC9XaW5kb3dEaW1lbnNpb25zU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ2FjdGl2aXR5VGlsZXNJbmZpbml0eUdyaWRNb2R1bGUnKS5kaXJlY3RpdmUoJ2FjdGl2aXR5VGlsZXNJbmZpbml0eUdyaWQnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvbGlicmFyeS1wYWdlL2FjdGl2aXR5LXRpbGVzLWluZmluaXR5LWdyaWQvJyArXG4gICAgICAgICAgICAgICAgJ2FjdGl2aXR5LXRpbGVzLWluZmluaXR5LWdyaWQuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyRyb290U2NvcGUnLCAnU2VhcmNoU2VydmljZScsICdXaW5kb3dEaW1lbnNpb25zU2VydmljZScsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJHJvb3RTY29wZSwgU2VhcmNoU2VydmljZSwgV2luZG93RGltZW5zaW9uc1NlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmVuZE9mUGFnZUlzUmVhY2hlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYWxsQWN0aXZpdGllc0luT3JkZXIgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2FsbGVkIHdoZW4gdGhlIGZpcnN0IGJhdGNoIG9mIHNlYXJjaCByZXN1bHRzIGlzIHJldHJpZXZlZCBmcm9tXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ2luaXRpYWxTZWFyY2hSZXN1bHRzTG9hZGVkJywgZnVuY3Rpb24gKGV2dCwgYWN0aXZpdHlMaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYWxsQWN0aXZpdGllc0luT3JkZXIgPSBhY3Rpdml0eUxpc3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZW5kT2ZQYWdlSXNSZWFjaGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2hvd01vcmVBY3Rpdml0aWVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkcm9vdFNjb3BlLmxvYWRpbmdNZXNzYWdlICYmICEkc2NvcGUuZW5kT2ZQYWdlSXNSZWFjaGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlYXJjaFJlc3VsdHNBcmVMb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTZWFyY2hTZXJ2aWNlLmxvYWRNb3JlRGF0YShmdW5jdGlvbiAoZGF0YSwgZW5kT2ZQYWdlSXNSZWFjaGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5hbGxBY3Rpdml0aWVzSW5PcmRlciA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYWxsQWN0aXZpdGllc0luT3JkZXIuY29uY2F0KGRhdGEuYWN0aXZpdHlfbGlzdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5lbmRPZlBhZ2VJc1JlYWNoZWQgPSBlbmRPZlBhZ2VJc1JlYWNoZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zZWFyY2hSZXN1bHRzQXJlTG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlbmRPZlBhZ2VJc1JlYWNoZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmVuZE9mUGFnZUlzUmVhY2hlZCA9IGVuZE9mUGFnZUlzUmVhY2hlZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlYXJjaFJlc3VsdHNBcmVMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHZhciBsaWJyYXJ5V2luZG93Q3V0b2ZmUHggPSA1MzA7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5saWJyYXJ5V2luZG93SXNOYXJyb3cgPSAoV2luZG93RGltZW5zaW9uc1NlcnZpY2UuZ2V0V2lkdGgoKSA8PSBsaWJyYXJ5V2luZG93Q3V0b2ZmUHgpO1xuICAgICAgICAgICAgICAgICAgICBXaW5kb3dEaW1lbnNpb25zU2VydmljZS5yZWdpc3Rlck9uUmVzaXplSG9vayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubGlicmFyeVdpbmRvd0lzTmFycm93ID0gKFdpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLmdldFdpZHRoKCkgPD0gbGlicmFyeVdpbmRvd0N1dG9mZlB4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEYXRhIGFuZCBjb250cm9sbGVycyBmb3IgdGhlIE9wcGlhIGxpYnJhcnkgZm9vdGVyLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnbGlicmFyeUZvb3Rlck1vZHVsZScpLmNvbnRyb2xsZXIoJ0xpYnJhcnlGb290ZXInLCBbXG4gICAgJyRzY29wZScsICckd2luZG93JywgJ0xJQlJBUllfUEFHRV9NT0RFUycsICdMSUJSQVJZX1BBVEhTX1RPX01PREVTJyxcbiAgICBmdW5jdGlvbiAoJHNjb3BlLCAkd2luZG93LCBMSUJSQVJZX1BBR0VfTU9ERVMsIExJQlJBUllfUEFUSFNfVE9fTU9ERVMpIHtcbiAgICAgICAgdmFyIHBhZ2VNb2RlID0gTElCUkFSWV9QQVRIU19UT19NT0RFU1skd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lXTtcbiAgICAgICAgJHNjb3BlLmZvb3RlcklzRGlzcGxheWVkID0gKHBhZ2VNb2RlICE9PSBMSUJSQVJZX1BBR0VfTU9ERVMuU0VBUkNIKTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGF0YSBhbmQgY29udHJvbGxlcnMgZm9yIHRoZSBPcHBpYSBjb250cmlidXRvcnMnIGxpYnJhcnkgcGFnZS5cbiAqL1xucmVxdWlyZSgnY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvbG9hZGluZy1kb3RzL2xvYWRpbmctZG90cy5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvc3VtbWFyeS10aWxlLWRpcmVjdGl2ZXMvZXhwbG9yYXRpb24tc3VtbWFyeS10aWxlLycgK1xuICAgICdleHBsb3JhdGlvbi1zdW1tYXJ5LXRpbGUuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL3N1bW1hcnktdGlsZS1kaXJlY3RpdmVzL2NvbGxlY3Rpb24tc3VtbWFyeS10aWxlLycgK1xuICAgICdjb2xsZWN0aW9uLXN1bW1hcnktdGlsZS5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2xpYnJhcnktcGFnZS9saWJyYXJ5LWZvb3Rlci9saWJyYXJ5LWZvb3Rlci5jb250cm9sbGVyLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9saWJyYXJ5LXBhZ2Uvc2VhcmNoLWJhci9zZWFyY2gtYmFyLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvbGlicmFyeS1wYWdlL3NlYXJjaC1yZXN1bHRzL3NlYXJjaC1yZXN1bHRzLmRpcmVjdGl2ZXMudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9sZWFybmVyX2Rhc2hib2FyZC9MZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHNPYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdkb21haW4vbGVhcm5lcl9kYXNoYm9hcmQvTGVhcm5lckRhc2hib2FyZElkc0JhY2tlbmRBcGlTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vbGVhcm5lcl9kYXNoYm9hcmQvTGVhcm5lclBsYXlsaXN0U2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQ29uc3RydWN0VHJhbnNsYXRpb25JZHNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9QYWdlVGl0bGVTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9TZWFyY2hTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Vc2VyU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvY29udGV4dHVhbC9VcmxTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1dpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnbGlicmFyeVBhZ2VNb2R1bGUnKS5jb250cm9sbGVyKCdMaWJyYXJ5JywgW1xuICAgICckaHR0cCcsICckbG9nJywgJyRyb290U2NvcGUnLCAnJHNjb3BlJywgJyR0aW1lb3V0JywgJyR1aWJNb2RhbCcsICckd2luZG93JyxcbiAgICAnQWxlcnRzU2VydmljZScsICdDb25zdHJ1Y3RUcmFuc2xhdGlvbklkc1NlcnZpY2UnLFxuICAgICdMZWFybmVyRGFzaGJvYXJkQWN0aXZpdHlJZHNPYmplY3RGYWN0b3J5JyxcbiAgICAnTGVhcm5lckRhc2hib2FyZElkc0JhY2tlbmRBcGlTZXJ2aWNlJywgJ0xlYXJuZXJQbGF5bGlzdFNlcnZpY2UnLFxuICAgICdQYWdlVGl0bGVTZXJ2aWNlJywgJ1NlYXJjaFNlcnZpY2UnLFxuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsICdVcmxTZXJ2aWNlJywgJ1VzZXJTZXJ2aWNlJyxcbiAgICAnV2luZG93RGltZW5zaW9uc1NlcnZpY2UnLCAnQUxMX0NBVEVHT1JJRVMnLFxuICAgICdMSUJSQVJZX1BBR0VfTU9ERVMnLCAnTElCUkFSWV9QQVRIU19UT19NT0RFUycsICdMSUJSQVJZX1RJTEVfV0lEVEhfUFgnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJGxvZywgJHJvb3RTY29wZSwgJHNjb3BlLCAkdGltZW91dCwgJHVpYk1vZGFsLCAkd2luZG93LCBBbGVydHNTZXJ2aWNlLCBDb25zdHJ1Y3RUcmFuc2xhdGlvbklkc1NlcnZpY2UsIExlYXJuZXJEYXNoYm9hcmRBY3Rpdml0eUlkc09iamVjdEZhY3RvcnksIExlYXJuZXJEYXNoYm9hcmRJZHNCYWNrZW5kQXBpU2VydmljZSwgTGVhcm5lclBsYXlsaXN0U2VydmljZSwgUGFnZVRpdGxlU2VydmljZSwgU2VhcmNoU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIFVybFNlcnZpY2UsIFVzZXJTZXJ2aWNlLCBXaW5kb3dEaW1lbnNpb25zU2VydmljZSwgQUxMX0NBVEVHT1JJRVMsIExJQlJBUllfUEFHRV9NT0RFUywgTElCUkFSWV9QQVRIU19UT19NT0RFUywgTElCUkFSWV9USUxFX1dJRFRIX1BYKSB7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ01lc3NhZ2UgPSAnSTE4Tl9MSUJSQVJZX0xPQURJTkcnO1xuICAgICAgICB2YXIgcG9zc2libGVCYW5uZXJGaWxlbmFtZXMgPSBbXG4gICAgICAgICAgICAnYmFubmVyMS5zdmcnLCAnYmFubmVyMi5zdmcnLCAnYmFubmVyMy5zdmcnLCAnYmFubmVyNC5zdmcnXG4gICAgICAgIF07XG4gICAgICAgICRzY29wZS5iYW5uZXJJbWFnZUZpbGVuYW1lID0gcG9zc2libGVCYW5uZXJGaWxlbmFtZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcG9zc2libGVCYW5uZXJGaWxlbmFtZXMubGVuZ3RoKV07XG4gICAgICAgICRzY29wZS5iYW5uZXJJbWFnZUZpbGVVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRTdGF0aWNJbWFnZVVybCgnL2xpYnJhcnkvJyArICRzY29wZS5iYW5uZXJJbWFnZUZpbGVuYW1lKTtcbiAgICAgICAgJHNjb3BlLmFjdGl2ZUdyb3VwSW5kZXggPSBudWxsO1xuICAgICAgICB2YXIgY3VycmVudFBhdGggPSAkd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuICAgICAgICBpZiAoIUxJQlJBUllfUEFUSFNfVE9fTU9ERVMuaGFzT3duUHJvcGVydHkoY3VycmVudFBhdGgpKSB7XG4gICAgICAgICAgICAkbG9nLmVycm9yKCdJTlZBTElEIFVSTCBQQVRIOiAnICsgY3VycmVudFBhdGgpO1xuICAgICAgICB9XG4gICAgICAgICRzY29wZS5wYWdlTW9kZSA9IExJQlJBUllfUEFUSFNfVE9fTU9ERVNbY3VycmVudFBhdGhdO1xuICAgICAgICAkc2NvcGUuTElCUkFSWV9QQUdFX01PREVTID0gTElCUkFSWV9QQUdFX01PREVTO1xuICAgICAgICB2YXIgdGl0bGUgPSAnRXhwbG9yYXRpb24gTGlicmFyeSAtIE9wcGlhJztcbiAgICAgICAgaWYgKCRzY29wZS5wYWdlTW9kZSA9PT0gTElCUkFSWV9QQUdFX01PREVTLkdST1VQIHx8XG4gICAgICAgICAgICAkc2NvcGUucGFnZU1vZGUgPT09IExJQlJBUllfUEFHRV9NT0RFUy5TRUFSQ0gpIHtcbiAgICAgICAgICAgIHRpdGxlID0gJ0ZpbmQgZXhwbG9yYXRpb25zIHRvIGxlYXJuIGZyb20gLSBPcHBpYSc7XG4gICAgICAgIH1cbiAgICAgICAgUGFnZVRpdGxlU2VydmljZS5zZXRQYWdlVGl0bGUodGl0bGUpO1xuICAgICAgICAvLyBLZWVwcyB0cmFjayBvZiB0aGUgaW5kZXggb2YgdGhlIGxlZnQtbW9zdCB2aXNpYmxlIGNhcmQgb2YgZWFjaCBncm91cC5cbiAgICAgICAgJHNjb3BlLmxlZnRtb3N0Q2FyZEluZGljZXMgPSBbXTtcbiAgICAgICAgaWYgKCRzY29wZS5wYWdlTW9kZSA9PT0gTElCUkFSWV9QQUdFX01PREVTLkdST1VQKSB7XG4gICAgICAgICAgICB2YXIgcGF0aG5hbWVBcnJheSA9ICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUuc3BsaXQoJy8nKTtcbiAgICAgICAgICAgICRzY29wZS5ncm91cE5hbWUgPSBwYXRobmFtZUFycmF5WzJdO1xuICAgICAgICAgICAgJGh0dHAuZ2V0KCcvbGlicmFyeWdyb3VwaGFuZGxlcicsIHtcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBfbmFtZTogJHNjb3BlLmdyb3VwTmFtZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuYWN0aXZpdHlMaXN0ID0gZGF0YS5hY3Rpdml0eV9saXN0O1xuICAgICAgICAgICAgICAgICRzY29wZS5ncm91cEhlYWRlckkxOG5JZCA9IGRhdGEuaGVhZGVyX2kxOG5faWQ7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdwcmVmZXJyZWRMYW5ndWFnZUNvZGVzTG9hZGVkJywgZGF0YS5wcmVmZXJyZWRfbGFuZ3VhZ2VfY29kZXMpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ01lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgJGh0dHAuZ2V0KCcvbGlicmFyeWluZGV4aGFuZGxlcicpLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUubGlicmFyeUdyb3VwcyA9IGRhdGEuYWN0aXZpdHlfc3VtbWFyeV9kaWN0c19ieV9jYXRlZ29yeTtcbiAgICAgICAgICAgICAgICBVc2VyU2VydmljZS5nZXRVc2VySW5mb0FzeW5jKCkudGhlbihmdW5jdGlvbiAodXNlckluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmFjdGl2aXRpZXNPd25lZCA9IHsgZXhwbG9yYXRpb25zOiB7fSwgY29sbGVjdGlvbnM6IHt9IH07XG4gICAgICAgICAgICAgICAgICAgIGlmICh1c2VySW5mby5pc0xvZ2dlZEluKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRodHRwLmdldCgnL2NyZWF0b3JkYXNoYm9hcmRoYW5kbGVyL2RhdGEnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5saWJyYXJ5R3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGxpYnJhcnlHcm91cCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWN0aXZpdHlTdW1tYXJ5RGljdHMgPSAobGlicmFyeUdyb3VwLmFjdGl2aXR5X3N1bW1hcnlfZGljdHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgQUNUSVZJVFlfVFlQRV9FWFBMT1JBVElPTiA9ICdleHBsb3JhdGlvbic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBBQ1RJVklUWV9UWVBFX0NPTExFQ1RJT04gPSAnY29sbGVjdGlvbic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2aXR5U3VtbWFyeURpY3RzLmZvckVhY2goZnVuY3Rpb24gKGFjdGl2aXR5U3VtbWFyeURpY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3Rpdml0eVN1bW1hcnlEaWN0LmFjdGl2aXR5X3R5cGUgPT09IChBQ1RJVklUWV9UWVBFX0VYUExPUkFUSU9OKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5hY3Rpdml0aWVzT3duZWQuZXhwbG9yYXRpb25zW2FjdGl2aXR5U3VtbWFyeURpY3QuaWRdID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChhY3Rpdml0eVN1bW1hcnlEaWN0LmFjdGl2aXR5X3R5cGUgPT09IChBQ1RJVklUWV9UWVBFX0NPTExFQ1RJT04pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmFjdGl2aXRpZXNPd25lZC5jb2xsZWN0aW9uc1thY3Rpdml0eVN1bW1hcnlEaWN0LmlkXSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGxvZy5lcnJvcignSU5WQUxJRCBBQ1RJVklUWSBUWVBFOiBBY3Rpdml0eScgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnKGlkOiAnICsgYWN0aXZpdHlTdW1tYXJ5RGljdC5pZCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcsIG5hbWU6ICcgKyBhY3Rpdml0eVN1bW1hcnlEaWN0LnRpdGxlICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJywgdHlwZTogJyArIGFjdGl2aXR5U3VtbWFyeURpY3QuYWN0aXZpdHlfdHlwZSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcpIGhhcyBhbiBpbnZhbGlkIGFjdGl2aXR5IHR5cGUsIHdoaWNoIGNvdWxkICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbm90IGJlIHJlY29yZGVkIGFzIGFuIGV4cGxvcmF0aW9uIG9yIGEgY29sbGVjdGlvbi4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEuZXhwbG9yYXRpb25zX2xpc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uIChvd25lZEV4cGxvcmF0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmFjdGl2aXRpZXNPd25lZC5leHBsb3JhdGlvbnNbb3duZWRFeHBsb3JhdGlvbnMuaWRdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEuY29sbGVjdGlvbnNfbGlzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZvckVhY2goZnVuY3Rpb24gKG93bmVkQ29sbGVjdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5hY3Rpdml0aWVzT3duZWQuY29sbGVjdGlvbnNbb3duZWRDb2xsZWN0aW9ucy5pZF0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdNZXNzYWdlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ01lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgncHJlZmVycmVkTGFuZ3VhZ2VDb2Rlc0xvYWRlZCcsIGRhdGEucHJlZmVycmVkX2xhbmd1YWdlX2NvZGVzKTtcbiAgICAgICAgICAgICAgICAvLyBJbml0aWFsaXplIHRoZSBjYXJvdXNlbChzKSBvbiB0aGUgbGlicmFyeSBpbmRleCBwYWdlLlxuICAgICAgICAgICAgICAgIC8vIFBhdXNlIGlzIG5lY2Vzc2FyeSB0byBlbnN1cmUgYWxsIGVsZW1lbnRzIGhhdmUgbG9hZGVkLlxuICAgICAgICAgICAgICAgICR0aW1lb3V0KGluaXRDYXJvdXNlbHMsIDM5MCk7XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgYWN0dWFsIGFuZCBleHBlY3RlZCB3aWR0aHMgYXJlIHRoZSBzYW1lLlxuICAgICAgICAgICAgICAgIC8vIElmIG5vdCBwcm9kdWNlIGFuIGVycm9yIHRoYXQgd291bGQgYmUgY2F1Z2h0IGJ5IGUyZSB0ZXN0cy5cbiAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhY3R1YWxXaWR0aCA9ICQoJ2V4cGxvcmF0aW9uLXN1bW1hcnktdGlsZScpLndpZHRoKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhY3R1YWxXaWR0aCAmJiBhY3R1YWxXaWR0aCAhPT0gTElCUkFSWV9USUxFX1dJRFRIX1BYKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdUaGUgYWN0dWFsIHdpZHRoIG9mIHRpbGUgaXMgZGlmZmVyZW50IHRoYW4gdGhlIGV4cGVjdGVkIHdpZHRoLicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgQWN0dWFsIHNpemU6ICcgKyBhY3R1YWxXaWR0aCArICcsIEV4cGVjdGVkIHNpemU6ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQlJBUllfVElMRV9XSURUSF9QWCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LCAzMDAwKTtcbiAgICAgICAgICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGluaXRpYWxpemVzIHRoZSB0cmFja2VyIHRvIGhhdmUgYWxsXG4gICAgICAgICAgICAgICAgLy8gZWxlbWVudHMgZmx1c2ggbGVmdC5cbiAgICAgICAgICAgICAgICAvLyBUcmFuc2Zvcm1zIHRoZSBncm91cCBuYW1lcyBpbnRvIHRyYW5zbGF0aW9uIGlkc1xuICAgICAgICAgICAgICAgICRzY29wZS5sZWZ0bW9zdENhcmRJbmRpY2VzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkc2NvcGUubGlicmFyeUdyb3Vwcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUubGVmdG1vc3RDYXJkSW5kaWNlcy5wdXNoKDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgICRzY29wZS5zZXRBY3RpdmVHcm91cCA9IGZ1bmN0aW9uIChncm91cEluZGV4KSB7XG4gICAgICAgICAgICAkc2NvcGUuYWN0aXZlR3JvdXBJbmRleCA9IGdyb3VwSW5kZXg7XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5jbGVhckFjdGl2ZUdyb3VwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmFjdGl2ZUdyb3VwSW5kZXggPSBudWxsO1xuICAgICAgICB9O1xuICAgICAgICAvLyBJZiB0aGUgdmFsdWUgYmVsb3cgaXMgY2hhbmdlZCwgdGhlIGZvbGxvd2luZyBDU1MgdmFsdWVzIGluIG9wcGlhLmNzc1xuICAgICAgICAvLyBtdXN0IGJlIGNoYW5nZWQ6XG4gICAgICAgIC8vIC0gLm9wcGlhLWV4cC1zdW1tYXJ5LXRpbGVzLWNvbnRhaW5lcjogbWF4LXdpZHRoXG4gICAgICAgIC8vIC0gLm9wcGlhLWxpYnJhcnktY2Fyb3VzZWw6IG1heC13aWR0aFxuICAgICAgICB2YXIgTUFYX05VTV9USUxFU19QRVJfUk9XID0gNDtcbiAgICAgICAgJHNjb3BlLnRpbGVEaXNwbGF5Q291bnQgPSAwO1xuICAgICAgICB2YXIgaW5pdENhcm91c2VscyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgcHJldmVudHMgdW5uZWNlc3NhcnkgZXhlY3V0aW9uIG9mIHRoaXMgbWV0aG9kIGltbWVkaWF0ZWx5IGFmdGVyXG4gICAgICAgICAgICAvLyBhIHdpbmRvdyByZXNpemUgZXZlbnQgaXMgZmlyZWQuXG4gICAgICAgICAgICBpZiAoISRzY29wZS5saWJyYXJ5R3JvdXBzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHdpbmRvd1dpZHRoID0gJCh3aW5kb3cpLndpZHRoKCkgKiAwLjg1O1xuICAgICAgICAgICAgLy8gVGhlIG51bWJlciAyMCBpcyBhZGRlZCB0byBMSUJSQVJZX1RJTEVfV0lEVEhfUFggaW4gb3JkZXIgdG8gY29tcGVuc2F0ZVxuICAgICAgICAgICAgLy8gZm9yIHBhZGRpbmcgYW5kIG1hcmdpbnMuIDIwIGlzIGp1c3QgYW4gYXJiaXRyYXJ5IG51bWJlci5cbiAgICAgICAgICAgICRzY29wZS50aWxlRGlzcGxheUNvdW50ID0gTWF0aC5taW4oTWF0aC5mbG9vcih3aW5kb3dXaWR0aCAvIChMSUJSQVJZX1RJTEVfV0lEVEhfUFggKyAyMCkpLCBNQVhfTlVNX1RJTEVTX1BFUl9ST1cpO1xuICAgICAgICAgICAgJCgnLm9wcGlhLWxpYnJhcnktY2Fyb3VzZWwnKS5jc3Moe1xuICAgICAgICAgICAgICAgIHdpZHRoOiAoJHNjb3BlLnRpbGVEaXNwbGF5Q291bnQgKiBMSUJSQVJZX1RJTEVfV0lEVEhfUFgpICsgJ3B4J1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGRldGVybWluZXMgd2hldGhlciB0byBlbmFibGUgbGVmdCBzY3JvbGwgYWZ0ZXIgcmVzaXplLlxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkc2NvcGUubGlicmFyeUdyb3Vwcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjYXJvdXNlbEpRdWVyeVNlbGVjdG9yID0gKCcub3BwaWEtbGlicmFyeS1jYXJvdXNlbC10aWxlczplcShuKScucmVwbGFjZSgnbicsIGkpKTtcbiAgICAgICAgICAgICAgICB2YXIgY2Fyb3VzZWxTY3JvbGxQb3NpdGlvblB4ID0gJChjYXJvdXNlbEpRdWVyeVNlbGVjdG9yKS5zY3JvbGxMZWZ0KCk7XG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gTWF0aC5jZWlsKGNhcm91c2VsU2Nyb2xsUG9zaXRpb25QeCAvIExJQlJBUllfVElMRV9XSURUSF9QWCk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmxlZnRtb3N0Q2FyZEluZGljZXNbaV0gPSBpbmRleDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGlzQW55Q2Fyb3VzZWxDdXJyZW50bHlTY3JvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgJHNjb3BlLnNjcm9sbCA9IGZ1bmN0aW9uIChpbmQsIGlzTGVmdFNjcm9sbCkge1xuICAgICAgICAgICAgaWYgKGlzQW55Q2Fyb3VzZWxDdXJyZW50bHlTY3JvbGxpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgY2Fyb3VzZWxKUXVlcnlTZWxlY3RvciA9ICgnLm9wcGlhLWxpYnJhcnktY2Fyb3VzZWwtdGlsZXM6ZXEobiknLnJlcGxhY2UoJ24nLCBpbmQpKTtcbiAgICAgICAgICAgIHZhciBkaXJlY3Rpb24gPSBpc0xlZnRTY3JvbGwgPyAtMSA6IDE7XG4gICAgICAgICAgICB2YXIgY2Fyb3VzZWxTY3JvbGxQb3NpdGlvblB4ID0gJChjYXJvdXNlbEpRdWVyeVNlbGVjdG9yKS5zY3JvbGxMZWZ0KCk7XG4gICAgICAgICAgICAvLyBQcmV2ZW50IHNjcm9sbGluZyBpZiB0aGVyZSBtb3JlIGNhcm91c2VsIHBpeGVkIHdpZHRocyB0aGFuXG4gICAgICAgICAgICAvLyB0aGVyZSBhcmUgdGlsZSB3aWR0aHMuXG4gICAgICAgICAgICBpZiAoJHNjb3BlLmxpYnJhcnlHcm91cHNbaW5kXS5hY3Rpdml0eV9zdW1tYXJ5X2RpY3RzLmxlbmd0aCA8PVxuICAgICAgICAgICAgICAgICRzY29wZS50aWxlRGlzcGxheUNvdW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2Fyb3VzZWxTY3JvbGxQb3NpdGlvblB4ID0gTWF0aC5tYXgoMCwgY2Fyb3VzZWxTY3JvbGxQb3NpdGlvblB4KTtcbiAgICAgICAgICAgIGlmIChpc0xlZnRTY3JvbGwpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUubGVmdG1vc3RDYXJkSW5kaWNlc1tpbmRdID0gTWF0aC5tYXgoMCwgJHNjb3BlLmxlZnRtb3N0Q2FyZEluZGljZXNbaW5kXSAtICRzY29wZS50aWxlRGlzcGxheUNvdW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICRzY29wZS5sZWZ0bW9zdENhcmRJbmRpY2VzW2luZF0gPSBNYXRoLm1pbigkc2NvcGUubGlicmFyeUdyb3Vwc1tpbmRdLmFjdGl2aXR5X3N1bW1hcnlfZGljdHMubGVuZ3RoIC1cbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnRpbGVEaXNwbGF5Q291bnQgKyAxLCAkc2NvcGUubGVmdG1vc3RDYXJkSW5kaWNlc1tpbmRdICsgJHNjb3BlLnRpbGVEaXNwbGF5Q291bnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG5ld1Njcm9sbFBvc2l0aW9uUHggPSBjYXJvdXNlbFNjcm9sbFBvc2l0aW9uUHggK1xuICAgICAgICAgICAgICAgICgkc2NvcGUudGlsZURpc3BsYXlDb3VudCAqIExJQlJBUllfVElMRV9XSURUSF9QWCAqIGRpcmVjdGlvbik7XG4gICAgICAgICAgICAkKGNhcm91c2VsSlF1ZXJ5U2VsZWN0b3IpLmFuaW1hdGUoe1xuICAgICAgICAgICAgICAgIHNjcm9sbExlZnQ6IG5ld1Njcm9sbFBvc2l0aW9uUHhcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogODAwLFxuICAgICAgICAgICAgICAgIHF1ZXVlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBzdGFydDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpc0FueUNhcm91c2VsQ3VycmVudGx5U2Nyb2xsaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzQW55Q2Fyb3VzZWxDdXJyZW50bHlTY3JvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVGhlIGNhcm91c2VscyBkbyBub3Qgd29yayB3aGVuIHRoZSB3aWR0aCBpcyAxIGNhcmQgbG9uZywgc28gd2UgbmVlZCB0b1xuICAgICAgICAvLyBoYW5kbGUgdGhpcyBjYXNlIGRpc2NyZXRlbHkgYW5kIGFsc28gcHJldmVudCBzd2lwaW5nIHBhc3QgdGhlIGZpcnN0XG4gICAgICAgIC8vIGFuZCBsYXN0IGNhcmQuXG4gICAgICAgICRzY29wZS5pbmNyZW1lbnRMZWZ0bW9zdENhcmRJbmRleCA9IGZ1bmN0aW9uIChpbmQpIHtcbiAgICAgICAgICAgIHZhciBsYXN0SXRlbSA9ICgoJHNjb3BlLmxpYnJhcnlHcm91cHNbaW5kXS5hY3Rpdml0eV9zdW1tYXJ5X2RpY3RzLmxlbmd0aCAtXG4gICAgICAgICAgICAgICAgJHNjb3BlLnRpbGVEaXNwbGF5Q291bnQpIDw9ICRzY29wZS5sZWZ0bW9zdENhcmRJbmRpY2VzW2luZF0pO1xuICAgICAgICAgICAgaWYgKCFsYXN0SXRlbSkge1xuICAgICAgICAgICAgICAgICRzY29wZS5sZWZ0bW9zdENhcmRJbmRpY2VzW2luZF0rKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLmRlY3JlbWVudExlZnRtb3N0Q2FyZEluZGV4ID0gZnVuY3Rpb24gKGluZCkge1xuICAgICAgICAgICAgJHNjb3BlLmxlZnRtb3N0Q2FyZEluZGljZXNbaW5kXSA9IChNYXRoLm1heCgkc2NvcGUubGVmdG1vc3RDYXJkSW5kaWNlc1tpbmRdIC0gMSwgMCkpO1xuICAgICAgICB9O1xuICAgICAgICAkKHdpbmRvdykucmVzaXplKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGluaXRDYXJvdXNlbHMoKTtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgbmVlZGVkLCBvdGhlcndpc2UgJHNjb3BlLnRpbGVEaXNwbGF5Q291bnQgdGFrZXMgYSBsb25nIHRpbWVcbiAgICAgICAgICAgIC8vIChzZXZlcmFsIHNlY29uZHMpIHRvIHVwZGF0ZS5cbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBhY3RpdmF0ZVNlYXJjaE1vZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoJHNjb3BlLnBhZ2VNb2RlICE9PSBMSUJSQVJZX1BBR0VfTU9ERVMuU0VBUkNIKSB7XG4gICAgICAgICAgICAgICAgJCgnLm9wcGlhLWxpYnJhcnktY29udGFpbmVyJykuZmFkZU91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5wYWdlTW9kZSA9IExJQlJBUllfUEFHRV9NT0RFUy5TRUFSQ0g7XG4gICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJy5vcHBpYS1saWJyYXJ5LWNvbnRhaW5lcicpLmZhZGVJbigpO1xuICAgICAgICAgICAgICAgICAgICB9LCA1MCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgbG9hZHMgZXhwbG9yYXRpb25zIGJlbG9uZ2luZyB0byBhIHBhcnRpY3VsYXIgZ3JvdXAuIElmXG4gICAgICAgIC8vIGZ1bGxSZXN1bHRzVXJsIGlzIGdpdmVuIGl0IGxvYWRzIHRoZSBwYWdlIGNvcnJlc3BvbmRpbmcgdG8gdGhlIHVybC5cbiAgICAgICAgLy8gT3RoZXJ3aXNlLCBpdCB3aWxsIGluaXRpYXRlIGEgc2VhcmNoIHF1ZXJ5IGZvciB0aGUgZ2l2ZW4gbGlzdCBvZlxuICAgICAgICAvLyBjYXRlZ29yaWVzLlxuICAgICAgICAkc2NvcGUuc2hvd0Z1bGxSZXN1bHRzUGFnZSA9IGZ1bmN0aW9uIChjYXRlZ29yaWVzLCBmdWxsUmVzdWx0c1VybCkge1xuICAgICAgICAgICAgaWYgKGZ1bGxSZXN1bHRzVXJsKSB7XG4gICAgICAgICAgICAgICAgJHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gZnVsbFJlc3VsdHNVcmw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgc2VsZWN0ZWRDYXRlZ29yaWVzID0ge307XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYXRlZ29yaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkQ2F0ZWdvcmllc1tjYXRlZ29yaWVzW2ldXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciB0YXJnZXRTZWFyY2hRdWVyeVVybCA9IFNlYXJjaFNlcnZpY2UuZ2V0U2VhcmNoVXJsUXVlcnlTdHJpbmcoJycsIHNlbGVjdGVkQ2F0ZWdvcmllcywge30pO1xuICAgICAgICAgICAgICAgICR3aW5kb3cubG9jYXRpb24uaHJlZiA9ICcvc2VhcmNoL2ZpbmQ/cT0nICsgdGFyZ2V0U2VhcmNoUXVlcnlVcmw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciBsaWJyYXJ5V2luZG93Q3V0b2ZmUHggPSA1MzA7XG4gICAgICAgICRzY29wZS5saWJyYXJ5V2luZG93SXNOYXJyb3cgPSAoV2luZG93RGltZW5zaW9uc1NlcnZpY2UuZ2V0V2lkdGgoKSA8PSBsaWJyYXJ5V2luZG93Q3V0b2ZmUHgpO1xuICAgICAgICBXaW5kb3dEaW1lbnNpb25zU2VydmljZS5yZWdpc3Rlck9uUmVzaXplSG9vayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUubGlicmFyeVdpbmRvd0lzTmFycm93ID0gKFdpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLmdldFdpZHRoKCkgPD0gbGlicmFyeVdpbmRvd0N1dG9mZlB4KTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIFNlYXJjaCBCYXIuXG4gKi9cbnJlcXVpcmUoJ2ZpbHRlcnMvc3RyaW5nLXV0aWxpdHktZmlsdGVycy90cnVuY2F0ZS5maWx0ZXIudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvTGFuZ3VhZ2VVdGlsU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQ29uc3RydWN0VHJhbnNsYXRpb25JZHNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9EZWJvdW5jZXJTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9IdG1sRXNjYXBlclNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL05hdmlnYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9TZWFyY2hTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdzZWFyY2hCYXJNb2R1bGUnKS5kaXJlY3RpdmUoJ3NlYXJjaEJhcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9saWJyYXJ5LXBhZ2Uvc2VhcmNoLWJhci8nICtcbiAgICAgICAgICAgICAgICAnc2VhcmNoLWJhci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckbG9jYXRpb24nLCAnJHJvb3RTY29wZScsICckc2NvcGUnLCAnJHRpbWVvdXQnLCAnJHRyYW5zbGF0ZScsXG4gICAgICAgICAgICAgICAgJyR3aW5kb3cnLCAnQ29uc3RydWN0VHJhbnNsYXRpb25JZHNTZXJ2aWNlJywgJ0RlYm91bmNlclNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdIdG1sRXNjYXBlclNlcnZpY2UnLCAnTGFuZ3VhZ2VVdGlsU2VydmljZScsICdOYXZpZ2F0aW9uU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ1NlYXJjaFNlcnZpY2UnLCAnVXJsU2VydmljZScsICdTRUFSQ0hfRFJPUERPV05fQ0FURUdPUklFUycsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRsb2NhdGlvbiwgJHJvb3RTY29wZSwgJHNjb3BlLCAkdGltZW91dCwgJHRyYW5zbGF0ZSwgJHdpbmRvdywgQ29uc3RydWN0VHJhbnNsYXRpb25JZHNTZXJ2aWNlLCBEZWJvdW5jZXJTZXJ2aWNlLCBIdG1sRXNjYXBlclNlcnZpY2UsIExhbmd1YWdlVXRpbFNlcnZpY2UsIE5hdmlnYXRpb25TZXJ2aWNlLCBTZWFyY2hTZXJ2aWNlLCBVcmxTZXJ2aWNlLCBTRUFSQ0hfRFJPUERPV05fQ0FURUdPUklFUykge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNTZWFyY2hJblByb2dyZXNzID0gU2VhcmNoU2VydmljZS5pc1NlYXJjaEluUHJvZ3Jlc3M7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5TRUFSQ0hfRFJPUERPV05fQ0FURUdPUklFUyA9IChTRUFSQ0hfRFJPUERPV05fQ0FURUdPUklFUy5tYXAoZnVuY3Rpb24gKGNhdGVnb3J5TmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogY2F0ZWdvcnlOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IENvbnN0cnVjdFRyYW5zbGF0aW9uSWRzU2VydmljZS5nZXRMaWJyYXJ5SWQoJ2NhdGVnb3JpZXMnLCBjYXRlZ29yeU5hbWUpXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5BQ1RJT05fT1BFTiA9IE5hdmlnYXRpb25TZXJ2aWNlLkFDVElPTl9PUEVOO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuQUNUSU9OX0NMT1NFID0gTmF2aWdhdGlvblNlcnZpY2UuQUNUSU9OX0NMT1NFO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuS0VZQk9BUkRfRVZFTlRfVE9fS0VZX0NPREVTID1cbiAgICAgICAgICAgICAgICAgICAgICAgIE5hdmlnYXRpb25TZXJ2aWNlLktFWUJPQVJEX0VWRU5UX1RPX0tFWV9DT0RFUztcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIE9wZW5zIHRoZSBzdWJtZW51LlxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZ0XG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtZW51TmFtZSAtIG5hbWUgb2YgbWVudSwgb24gd2hpY2hcbiAgICAgICAgICAgICAgICAgICAgICogb3Blbi9jbG9zZSBhY3Rpb24gdG8gYmUgcGVyZm9ybWVkIChjYXRlZ29yeSxsYW5ndWFnZSkuXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUub3BlblN1Ym1lbnUgPSBmdW5jdGlvbiAoZXZ0LCBtZW51TmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgTmF2aWdhdGlvblNlcnZpY2Uub3BlblN1Ym1lbnUoZXZ0LCBtZW51TmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBIYW5kbGVzIGtleWRvd24gZXZlbnRzIG9uIG1lbnVzLlxuICAgICAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZ0XG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtZW51TmFtZSAtIG5hbWUgb2YgbWVudSB0byBwZXJmb3JtIGFjdGlvblxuICAgICAgICAgICAgICAgICAgICAgKiBvbihjYXRlZ29yeS9sYW5ndWFnZSlcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IGV2ZW50c1RvYmVIYW5kbGVkIC0gTWFwIGtleWJvYXJkIGV2ZW50cygnRW50ZXInKSB0b1xuICAgICAgICAgICAgICAgICAgICAgKiBjb3JyZXNwb25kaW5nIGFjdGlvbnMgdG8gYmUgcGVyZm9ybWVkKG9wZW4vY2xvc2UpLlxuICAgICAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICAgICAgICAgKiAgb25NZW51S2V5cHJlc3MoJGV2ZW50LCAnY2F0ZWdvcnknLCB7ZW50ZXI6ICdvcGVuJ30pXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUub25NZW51S2V5cHJlc3MgPSBmdW5jdGlvbiAoZXZ0LCBtZW51TmFtZSwgZXZlbnRzVG9iZUhhbmRsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE5hdmlnYXRpb25TZXJ2aWNlLm9uTWVudUtleXByZXNzKGV2dCwgbWVudU5hbWUsIGV2ZW50c1RvYmVIYW5kbGVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5hY3RpdmVNZW51TmFtZSA9IE5hdmlnYXRpb25TZXJ2aWNlLmFjdGl2ZU1lbnVOYW1lO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuQUxMX0xBTkdVQUdFX0NPREVTID0gKExhbmd1YWdlVXRpbFNlcnZpY2UuZ2V0TGFuZ3VhZ2VJZHNBbmRUZXh0cygpKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlYXJjaFF1ZXJ5ID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3Rpb25EZXRhaWxzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcmllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtc05hbWU6ICdjYXRlZ29yaWVzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXN0ZXJMaXN0OiAkc2NvcGUuU0VBUkNIX0RST1BET1dOX0NBVEVHT1JJRVMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtU2VsZWN0aW9uczogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb25zOiB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5OiAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhbmd1YWdlQ29kZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXNOYW1lOiAnbGFuZ3VhZ2VzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXN0ZXJMaXN0OiAkc2NvcGUuQUxMX0xBTkdVQUdFX0NPREVTLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bVNlbGVjdGlvbnM6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uczoge30sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VtbWFyeTogJydcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgLy8gTm9uLXRyYW5zbGF0YWJsZSBwYXJ0cyBvZiB0aGUgaHRtbCBzdHJpbmdzLCBsaWtlIG51bWJlcnMgb3IgdXNlclxuICAgICAgICAgICAgICAgICAgICAvLyBuYW1lcy5cbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnRyYW5zbGF0aW9uRGF0YSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGRlc2NyaXB0aW9uLCBudW1TZWxlY3Rpb25zIGFuZCBzdW1tYXJ5IGZpZWxkcyBvZiB0aGVcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVsZXZhbnQgZW50cnkgb2YgJHNjb3BlLnNlbGVjdGlvbkRldGFpbHMuXG4gICAgICAgICAgICAgICAgICAgIHZhciB1cGRhdGVTZWxlY3Rpb25EZXRhaWxzID0gZnVuY3Rpb24gKGl0ZW1zVHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZW1zTmFtZSA9ICRzY29wZS5zZWxlY3Rpb25EZXRhaWxzW2l0ZW1zVHlwZV0uaXRlbXNOYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1hc3Rlckxpc3QgPSAkc2NvcGUuc2VsZWN0aW9uRGV0YWlsc1tpdGVtc1R5cGVdLm1hc3Rlckxpc3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZWN0ZWRJdGVtcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtYXN0ZXJMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5zZWxlY3Rpb25EZXRhaWxzW2l0ZW1zVHlwZV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNlbGVjdGlvbnNbbWFzdGVyTGlzdFtpXS5pZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRJdGVtcy5wdXNoKG1hc3Rlckxpc3RbaV0udGV4dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRvdGFsQ291bnQgPSBzZWxlY3RlZEl0ZW1zLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3Rpb25EZXRhaWxzW2l0ZW1zVHlwZV0ubnVtU2VsZWN0aW9ucyA9IHRvdGFsQ291bnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0aW9uRGV0YWlsc1tpdGVtc1R5cGVdLnN1bW1hcnkgPSAodG90YWxDb3VudCA9PT0gMCA/ICdJMThOX0xJQlJBUllfQUxMXycgKyBpdGVtc05hbWUudG9VcHBlckNhc2UoKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxDb3VudCA9PT0gMSA/IHNlbGVjdGVkSXRlbXNbMF0gOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnSTE4Tl9MSUJSQVJZX05fJyArIGl0ZW1zTmFtZS50b1VwcGVyQ2FzZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS50cmFuc2xhdGlvbkRhdGFbaXRlbXNOYW1lICsgJ0NvdW50J10gPSB0b3RhbENvdW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyhtaWxpdCk6IFdoZW4gdGhlIGxhbmd1YWdlIGNoYW5nZXMsIHRoZSB0cmFuc2xhdGlvbnMgd29uJ3RcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoYW5nZSB1bnRpbCB0aGUgdXNlciBjaGFuZ2VzIHRoZSBzZWxlY3Rpb24gYW5kIHRoaXMgZnVuY3Rpb24gaXNcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlLWV4ZWN1dGVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGVjdGVkSXRlbXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0cmFuc2xhdGVkSXRlbXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNlbGVjdGVkSXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNsYXRlZEl0ZW1zLnB1c2goJHRyYW5zbGF0ZS5pbnN0YW50KHNlbGVjdGVkSXRlbXNbaV0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGlvbkRldGFpbHNbaXRlbXNUeXBlXS5kZXNjcmlwdGlvbiA9ICh0cmFuc2xhdGVkSXRlbXMuam9pbignLCAnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0aW9uRGV0YWlsc1tpdGVtc1R5cGVdLmRlc2NyaXB0aW9uID0gKCdJMThOX0xJQlJBUllfQUxMXycgKyBpdGVtc05hbWUudG9VcHBlckNhc2UoKSArICdfU0VMRUNURUQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnRvZ2dsZVNlbGVjdGlvbiA9IGZ1bmN0aW9uIChpdGVtc1R5cGUsIG9wdGlvbk5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzZWxlY3Rpb25zID0gJHNjb3BlLnNlbGVjdGlvbkRldGFpbHNbaXRlbXNUeXBlXS5zZWxlY3Rpb25zO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzZWxlY3Rpb25zLmhhc093blByb3BlcnR5KG9wdGlvbk5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uc1tvcHRpb25OYW1lXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb25zW29wdGlvbk5hbWVdID0gIXNlbGVjdGlvbnNbb3B0aW9uTmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVTZWxlY3Rpb25EZXRhaWxzKGl0ZW1zVHlwZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvblNlYXJjaFF1ZXJ5Q2hhbmdlRXhlYygpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZGVzZWxlY3RBbGwgPSBmdW5jdGlvbiAoaXRlbXNUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0aW9uRGV0YWlsc1tpdGVtc1R5cGVdLnNlbGVjdGlvbnMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZVNlbGVjdGlvbkRldGFpbHMoaXRlbXNUeXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uU2VhcmNoUXVlcnlDaGFuZ2VFeGVjKCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kd2F0Y2goJ3NlYXJjaFF1ZXJ5JywgZnVuY3Rpb24gKG5ld1F1ZXJ5LCBvbGRRdWVyeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUnVuIG9ubHkgaWYgdGhlIHF1ZXJ5IGhhcyBjaGFuZ2VkLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5ld1F1ZXJ5ICE9PSBvbGRRdWVyeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uU2VhcmNoUXVlcnlDaGFuZ2VFeGVjKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB2YXIgb25TZWFyY2hRdWVyeUNoYW5nZUV4ZWMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTZWFyY2hTZXJ2aWNlLmV4ZWN1dGVTZWFyY2hRdWVyeSgkc2NvcGUuc2VhcmNoUXVlcnksICRzY29wZS5zZWxlY3Rpb25EZXRhaWxzLmNhdGVnb3JpZXMuc2VsZWN0aW9ucywgJHNjb3BlLnNlbGVjdGlvbkRldGFpbHMubGFuZ3VhZ2VDb2Rlcy5zZWxlY3Rpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzZWFyY2hVcmxRdWVyeVN0cmluZyA9IFNlYXJjaFNlcnZpY2UuZ2V0U2VhcmNoVXJsUXVlcnlTdHJpbmcoJHNjb3BlLnNlYXJjaFF1ZXJ5LCAkc2NvcGUuc2VsZWN0aW9uRGV0YWlscy5jYXRlZ29yaWVzLnNlbGVjdGlvbnMsICRzY29wZS5zZWxlY3Rpb25EZXRhaWxzLmxhbmd1YWdlQ29kZXMuc2VsZWN0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSA9PT0gJy9zZWFyY2gvZmluZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkbG9jYXRpb24udXJsKCcvZmluZD9xPScgKyBzZWFyY2hVcmxRdWVyeVN0cmluZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnL3NlYXJjaC9maW5kP3E9JyArIHNlYXJjaFVybFF1ZXJ5U3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBJbml0aWFsaXplIHRoZSBzZWxlY3Rpb24gZGVzY3JpcHRpb25zIGFuZCBzdW1tYXJpZXMuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGl0ZW1zVHlwZSBpbiAkc2NvcGUuc2VsZWN0aW9uRGV0YWlscykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlU2VsZWN0aW9uRGV0YWlscyhpdGVtc1R5cGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciB1cGRhdGVTZWFyY2hGaWVsZHNCYXNlZE9uVXJsUXVlcnkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgb2xkUXVlcnlTdHJpbmcgPSBTZWFyY2hTZXJ2aWNlLmdldEN1cnJlbnRVcmxRdWVyeVN0cmluZygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGlvbkRldGFpbHMuY2F0ZWdvcmllcy5zZWxlY3Rpb25zID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0aW9uRGV0YWlscy5sYW5ndWFnZUNvZGVzLnNlbGVjdGlvbnMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zZWFyY2hRdWVyeSA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgU2VhcmNoU2VydmljZS51cGRhdGVTZWFyY2hGaWVsZHNCYXNlZE9uVXJsUXVlcnkoJHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gsICRzY29wZS5zZWxlY3Rpb25EZXRhaWxzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZVNlbGVjdGlvbkRldGFpbHMoJ2NhdGVnb3JpZXMnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZVNlbGVjdGlvbkRldGFpbHMoJ2xhbmd1YWdlQ29kZXMnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdRdWVyeVN0cmluZyA9IFNlYXJjaFNlcnZpY2UuZ2V0Q3VycmVudFVybFF1ZXJ5U3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob2xkUXVlcnlTdHJpbmcgIT09IG5ld1F1ZXJ5U3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25TZWFyY2hRdWVyeUNoYW5nZUV4ZWMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRvbignJGxvY2F0aW9uQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChVcmxTZXJ2aWNlLmdldFVybFBhcmFtcygpLmhhc093blByb3BlcnR5KCdxJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVTZWFyY2hGaWVsZHNCYXNlZE9uVXJsUXVlcnkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ3ByZWZlcnJlZExhbmd1YWdlQ29kZXNMb2FkZWQnLCBmdW5jdGlvbiAoZXZ0LCBwcmVmZXJyZWRMYW5ndWFnZUNvZGVzTGlzdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmVycmVkTGFuZ3VhZ2VDb2Rlc0xpc3QuZm9yRWFjaChmdW5jdGlvbiAobGFuZ3VhZ2VDb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGVjdGlvbnMgPSAkc2NvcGUuc2VsZWN0aW9uRGV0YWlscy5sYW5ndWFnZUNvZGVzLnNlbGVjdGlvbnM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzZWxlY3Rpb25zLmhhc093blByb3BlcnR5KGxhbmd1YWdlQ29kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uc1tsYW5ndWFnZUNvZGVdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbnNbbGFuZ3VhZ2VDb2RlXSA9ICFzZWxlY3Rpb25zW2xhbmd1YWdlQ29kZV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVTZWxlY3Rpb25EZXRhaWxzKCdsYW5ndWFnZUNvZGVzJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoVXJsU2VydmljZS5nZXRVcmxQYXJhbXMoKS5oYXNPd25Qcm9wZXJ0eSgncScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlU2VhcmNoRmllbGRzQmFzZWRPblVybFF1ZXJ5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSA9PT0gJy9zZWFyY2gvZmluZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvblNlYXJjaFF1ZXJ5Q2hhbmdlRXhlYygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmcmVzaFNlYXJjaEJhckxhYmVscygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm90aWZ5IHRoZSBmdW5jdGlvbiB0aGF0IGhhbmRsZXMgb3ZlcmZsb3cgaW4gY2FzZSB0aGUgc2VhcmNoXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBlbGVtZW50cyBsb2FkIGFmdGVyIGl0IGhhcyBhbHJlYWR5IGJlZW4gcnVuLlxuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzZWFyY2hCYXJMb2FkZWQnLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZWZyZXNoU2VhcmNoQmFyTGFiZWxzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgeW91IHRyYW5zbGF0ZSB0aGVzZSBzdHJpbmdzIGluIHRoZSBodG1sLCB0aGVuIHlvdSBtdXN0IHVzZSBhXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmaWx0ZXIgYmVjYXVzZSBvbmx5IHRoZSBmaXJzdCAxNCBjaGFyYWN0ZXJzIGFyZSBkaXNwbGF5ZWQuIFRoYXRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdvdWxkIGdlbmVyYXRlIEZPVUMgZm9yIGxhbmd1YWdlcyBvdGhlciB0aGFuIEVuZ2xpc2guIEFzIGFuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBleGNlcHRpb24sIHdlIHRyYW5zbGF0ZSB0aGVtIGhlcmUgYW5kIHVwZGF0ZSB0aGUgdHJhbnNsYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGV2ZXJ5IHRpbWUgdGhlIGxhbmd1YWdlIGlzIGNoYW5nZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2VhcmNoQmFyUGxhY2Vob2xkZXIgPSAkdHJhbnNsYXRlLmluc3RhbnQoJ0kxOE5fTElCUkFSWV9TRUFSQ0hfUExBQ0VIT0xERVInKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICdtZXNzYWdlZm9ybWF0JyBpcyB0aGUgaW50ZXJwb2xhdGlvbiBtZXRob2QgZm9yIHBsdXJhbCBmb3Jtcy5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGh0dHA6Ly9hbmd1bGFyLXRyYW5zbGF0ZS5naXRodWIuaW8vZG9jcy8jL2d1aWRlLzE0X3BsdXJhbGl6YXRpb24uXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2F0ZWdvcnlCdXR0b25UZXh0ID0gJHRyYW5zbGF0ZS5pbnN0YW50KCRzY29wZS5zZWxlY3Rpb25EZXRhaWxzLmNhdGVnb3JpZXMuc3VtbWFyeSwgJHNjb3BlLnRyYW5zbGF0aW9uRGF0YSwgJ21lc3NhZ2Vmb3JtYXQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5sYW5ndWFnZUJ1dHRvblRleHQgPSAkdHJhbnNsYXRlLmluc3RhbnQoJHNjb3BlLnNlbGVjdGlvbkRldGFpbHMubGFuZ3VhZ2VDb2Rlcy5zdW1tYXJ5LCAkc2NvcGUudHJhbnNsYXRpb25EYXRhLCAnbWVzc2FnZWZvcm1hdCcpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRvbignJHRyYW5zbGF0ZUNoYW5nZVN1Y2Nlc3MnLCByZWZyZXNoU2VhcmNoQmFyTGFiZWxzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3Igc2hvd2luZyBzZWFyY2ggcmVzdWx0cy5cbiAqL1xucmVxdWlyZSgncGFnZXMvbGlicmFyeS1wYWdlL2FjdGl2aXR5LXRpbGVzLWluZmluaXR5LWdyaWQvJyArXG4gICAgJ2FjdGl2aXR5LXRpbGVzLWluZmluaXR5LWdyaWQuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9TaXRlQW5hbHl0aWNzU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvVXNlclNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdzZWFyY2hSZXN1bHRzTW9kdWxlJykuZGlyZWN0aXZlKCdzZWFyY2hSZXN1bHRzJywgW1xuICAgICckcScsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uICgkcSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9saWJyYXJ5L3NlYXJjaF9yZXN1bHRzX2RpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRzY29wZScsICckcm9vdFNjb3BlJywgJyRxJywgJyR0aW1lb3V0JywgJyR3aW5kb3cnLFxuICAgICAgICAgICAgICAgICdTaXRlQW5hbHl0aWNzU2VydmljZScsICdVc2VyU2VydmljZScsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJHJvb3RTY29wZSwgJHEsICR0aW1lb3V0LCAkd2luZG93LCBTaXRlQW5hbHl0aWNzU2VydmljZSwgVXNlclNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNvbWVSZXN1bHRzRXhpc3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudXNlcklzTG9nZ2VkSW4gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdNZXNzYWdlID0gJ0xvYWRpbmcnO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdXNlckluZm9Qcm9taXNlID0gVXNlclNlcnZpY2UuZ2V0VXNlckluZm9Bc3luYygpO1xuICAgICAgICAgICAgICAgICAgICB1c2VySW5mb1Byb21pc2UudGhlbihmdW5jdGlvbiAodXNlckluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS51c2VySXNMb2dnZWRJbiA9IHVzZXJJbmZvLmlzTG9nZ2VkSW4oKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIENhbGxlZCB3aGVuIHRoZSBmaXJzdCBiYXRjaCBvZiBzZWFyY2ggcmVzdWx0cyBpcyByZXRyaWV2ZWQgZnJvbSB0aGVcbiAgICAgICAgICAgICAgICAgICAgLy8gc2VydmVyLlxuICAgICAgICAgICAgICAgICAgICB2YXIgc2VhcmNoUmVzdWx0c1Byb21pc2UgPSAkc2NvcGUuJG9uKCdpbml0aWFsU2VhcmNoUmVzdWx0c0xvYWRlZCcsIGZ1bmN0aW9uIChldnQsIGFjdGl2aXR5TGlzdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNvbWVSZXN1bHRzRXhpc3QgPSBhY3Rpdml0eUxpc3QubGVuZ3RoID4gMDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICRxLmFsbChbdXNlckluZm9Qcm9taXNlLCBzZWFyY2hSZXN1bHRzUHJvbWlzZV0pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm9uUmVkaXJlY3RUb0xvZ2luID0gZnVuY3Rpb24gKGRlc3RpbmF0aW9uVXJsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTaXRlQW5hbHl0aWNzU2VydmljZS5yZWdpc3RlclN0YXJ0TG9naW5FdmVudCgnbm9TZWFyY2hSZXN1bHRzJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHdpbmRvdy5sb2NhdGlvbiA9IGRlc3RpbmF0aW9uVXJsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgMTUwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm5vRXhwbG9yYXRpb25zSW1nVXJsID1cbiAgICAgICAgICAgICAgICAgICAgICAgIFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldFN0YXRpY0ltYWdlVXJsKCcvZ2VuZXJhbC9ub19leHBsb3JhdGlvbnNfZm91bmQucG5nJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIGR5bmFtaWNhbGx5IGNvbnN0cnVjdCB0cmFuc2xhdGlvbiBpZHMgZm9yIGkxOG4uXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ0NvbnN0cnVjdFRyYW5zbGF0aW9uSWRzU2VydmljZScsIFtcbiAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvLyBDb25zdHJ1Y3QgYSB0cmFuc2xhdGlvbiBpZCBmb3IgbGlicmFyeSBmcm9tIG5hbWUgYW5kIGEgcHJlZml4LlxuICAgICAgICAgICAgLy8gRXg6ICdjYXRlZ29yaWVzJywgJ2FydCcgLT4gJ0kxOE5fTElCUkFSWV9DQVRFR09SSUVTX0FSVCdcbiAgICAgICAgICAgIGdldExpYnJhcnlJZDogZnVuY3Rpb24gKHByZWZpeCwgbmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoJ0kxOE5fTElCUkFSWV8nICsgcHJlZml4LnRvVXBwZXJDYXNlKCkgKyAnXycgK1xuICAgICAgICAgICAgICAgICAgICBuYW1lLnRvVXBwZXJDYXNlKCkuc3BsaXQoJyAnKS5qb2luKCdfJykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBkZWJvdW5jaW5nIGZ1bmN0aW9uIGNhbGxzLlxuICovXG5vcHBpYS5mYWN0b3J5KCdEZWJvdW5jZXJTZXJ2aWNlJywgW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgbm90IGJlIHRyaWdnZXJlZCBhcyBsb25nIGFzIGl0IGNvbnRpbnVlcyB0b1xuICAgICAgICAgICAgLy8gYmUgaW52b2tlZC4gVGhlIGZ1bmN0aW9uIG9ubHkgZ2V0cyBleGVjdXRlZCBhZnRlciBpdCBzdG9wcyBiZWluZyBjYWxsZWRcbiAgICAgICAgICAgIC8vIGZvciBgd2FpdGAgbWlsbGlzZWNvbmRzLlxuICAgICAgICAgICAgZGVib3VuY2U6IGZ1bmN0aW9uIChmdW5jLCBtaWxsaXNlY3NUb1dhaXQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGltZW91dDtcbiAgICAgICAgICAgICAgICB2YXIgY29udGV4dCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICAgICAgdmFyIHRpbWVzdGFtcDtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICAgICAgICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3QgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHRpbWVzdGFtcDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3QgPCBtaWxsaXNlY3NUb1dhaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCBtaWxsaXNlY3NUb1dhaXQgLSBsYXN0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGltZW91dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICAgICAgdGltZXN0YW1wID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGltZW91dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIG1pbGxpc2Vjc1RvV2FpdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgSFRNTCBzZXJpYWxpemF0aW9uIGFuZCBlc2NhcGluZy5cbiAqL1xub3BwaWEuZmFjdG9yeSgnSHRtbEVzY2FwZXJTZXJ2aWNlJywgWyckbG9nJywgZnVuY3Rpb24gKCRsb2cpIHtcbiAgICAgICAgdmFyIGh0bWxFc2NhcGVyID0ge1xuICAgICAgICAgICAgb2JqVG9Fc2NhcGVkSnNvbjogZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnVuZXNjYXBlZFN0clRvRXNjYXBlZFN0cihKU09OLnN0cmluZ2lmeShvYmopKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlc2NhcGVkSnNvblRvT2JqOiBmdW5jdGlvbiAoanNvbikge1xuICAgICAgICAgICAgICAgIGlmICghanNvbikge1xuICAgICAgICAgICAgICAgICAgICAkbG9nLmVycm9yKCdFbXB0eSBzdHJpbmcgd2FzIHBhc3NlZCB0byBKU09OIGRlY29kZXIuJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UodGhpcy5lc2NhcGVkU3RyVG9VbmVzY2FwZWRTdHIoanNvbikpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVuZXNjYXBlZFN0clRvRXNjYXBlZFN0cjogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcoc3RyKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJi9nLCAnJmFtcDsnKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXCIvZywgJyZxdW90OycpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csICcmIzM5OycpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC88L2csICcmbHQ7JylcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlc2NhcGVkU3RyVG9VbmVzY2FwZWRTdHI6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcodmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mcXVvdDsvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyYjMzk7L2csICdcXCcnKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJmx0Oy9nLCAnPCcpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mZ3Q7L2csICc+JylcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyZhbXA7L2csICcmJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBodG1sRXNjYXBlcjtcbiAgICB9XSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIG5hdmlnYXRpbmcgdGhlIHRvcCBuYXZpZ2F0aW9uIGJhciB3aXRoXG4gKiB0YWIgYW5kIHNoaWZ0LXRhYi5cbiAqL1xub3BwaWEuZmFjdG9yeSgnTmF2aWdhdGlvblNlcnZpY2UnLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbmF2aWdhdGlvbiA9IHtcbiAgICAgICAgICAgIGFjdGl2ZU1lbnVOYW1lOiAnJyxcbiAgICAgICAgICAgIEFDVElPTl9PUEVOOiAnb3BlbicsXG4gICAgICAgICAgICBBQ1RJT05fQ0xPU0U6ICdjbG9zZScsXG4gICAgICAgICAgICBLRVlCT0FSRF9FVkVOVF9UT19LRVlfQ09ERVM6IHtcbiAgICAgICAgICAgICAgICBlbnRlcjoge1xuICAgICAgICAgICAgICAgICAgICBzaGlmdEtleUlzUHJlc3NlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGtleUNvZGU6IDEzXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0YWI6IHtcbiAgICAgICAgICAgICAgICAgICAgc2hpZnRLZXlJc1ByZXNzZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBrZXlDb2RlOiA5XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzaGlmdFRhYjoge1xuICAgICAgICAgICAgICAgICAgICBzaGlmdEtleUlzUHJlc3NlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAga2V5Q29kZTogOVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvcGVuU3VibWVudTogbnVsbCxcbiAgICAgICAgICAgIGNsb3NlU3VibWVudTogbnVsbCxcbiAgICAgICAgICAgIG9uTWVudUtleXByZXNzOiBudWxsXG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAqIE9wZW5zIHRoZSBzdWJtZW51LlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBldnRcbiAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gbWVudU5hbWUgLSBuYW1lIG9mIG1lbnUsIG9uIHdoaWNoXG4gICAgICAgICogb3Blbi9jbG9zZSBhY3Rpb24gdG8gYmUgcGVyZm9ybWVkIChjYXRlZ29yeSxsYW5ndWFnZSkuXG4gICAgICAgICovXG4gICAgICAgIG5hdmlnYXRpb24ub3BlblN1Ym1lbnUgPSBmdW5jdGlvbiAoZXZ0LCBtZW51TmFtZSkge1xuICAgICAgICAgICAgLy8gRm9jdXMgb24gdGhlIGN1cnJlbnQgdGFyZ2V0IGJlZm9yZSBvcGVuaW5nIGl0cyBzdWJtZW51LlxuICAgICAgICAgICAgbmF2aWdhdGlvbi5hY3RpdmVNZW51TmFtZSA9IG1lbnVOYW1lO1xuICAgICAgICAgICAgYW5ndWxhci5lbGVtZW50KGV2dC5jdXJyZW50VGFyZ2V0KS5mb2N1cygpO1xuICAgICAgICB9O1xuICAgICAgICBuYXZpZ2F0aW9uLmNsb3NlU3VibWVudSA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgIG5hdmlnYXRpb24uYWN0aXZlTWVudU5hbWUgPSAnJztcbiAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudChldnQuY3VycmVudFRhcmdldCkuY2xvc2VzdCgnbGknKVxuICAgICAgICAgICAgICAgIC5maW5kKCdhJykuYmx1cigpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogSGFuZGxlcyBrZXlkb3duIGV2ZW50cyBvbiBtZW51cy5cbiAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IGV2dFxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gbWVudU5hbWUgLSBuYW1lIG9mIG1lbnUgdG8gcGVyZm9ybSBhY3Rpb25cbiAgICAgICAgICogb24oY2F0ZWdvcnkvbGFuZ3VhZ2UpXG4gICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBldmVudHNUb2JlSGFuZGxlZCAtIE1hcCBrZXlib2FyZCBldmVudHMoJ0VudGVyJykgdG9cbiAgICAgICAgICogY29ycmVzcG9uZGluZyBhY3Rpb25zIHRvIGJlIHBlcmZvcm1lZChvcGVuL2Nsb3NlKS5cbiAgICAgICAgICpcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogIG9uTWVudUtleXByZXNzKCRldmVudCwgJ2NhdGVnb3J5Jywge2VudGVyOiAnb3Blbid9KVxuICAgICAgICAgKi9cbiAgICAgICAgbmF2aWdhdGlvbi5vbk1lbnVLZXlwcmVzcyA9IGZ1bmN0aW9uIChldnQsIG1lbnVOYW1lLCBldmVudHNUb2JlSGFuZGxlZCkge1xuICAgICAgICAgICAgdmFyIHRhcmdldEV2ZW50cyA9IE9iamVjdC5rZXlzKGV2ZW50c1RvYmVIYW5kbGVkKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGFyZ2V0RXZlbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGtleUNvZGVTcGVjID0gbmF2aWdhdGlvbi5LRVlCT0FSRF9FVkVOVF9UT19LRVlfQ09ERVNbdGFyZ2V0RXZlbnRzW2ldXTtcbiAgICAgICAgICAgICAgICBpZiAoa2V5Q29kZVNwZWMua2V5Q29kZSA9PT0gZXZ0LmtleUNvZGUgJiZcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnNoaWZ0S2V5ID09PSBrZXlDb2RlU3BlYy5zaGlmdEtleUlzUHJlc3NlZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnRzVG9iZUhhbmRsZWRbdGFyZ2V0RXZlbnRzW2ldXSA9PT0gbmF2aWdhdGlvbi5BQ1RJT05fT1BFTikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmF2aWdhdGlvbi5vcGVuU3VibWVudShldnQsIG1lbnVOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChldmVudHNUb2JlSGFuZGxlZFt0YXJnZXRFdmVudHNbaV1dID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgbmF2aWdhdGlvbi5BQ1RJT05fQ0xPU0UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hdmlnYXRpb24uY2xvc2VTdWJtZW51KGV2dCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBhY3Rpb24gdHlwZS4nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIG5hdmlnYXRpb247XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIHNldCB0aGUgdGl0bGUgb2YgdGhlIHBhZ2UuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ1BhZ2VUaXRsZVNlcnZpY2UnLCBbJyRkb2N1bWVudCcsIGZ1bmN0aW9uICgkZG9jdW1lbnQpIHtcbiAgICAgICAgdmFyIF9zZXRQYWdlVGl0bGUgPSBmdW5jdGlvbiAodGl0bGUpIHtcbiAgICAgICAgICAgICRkb2N1bWVudFswXS50aXRsZSA9IHRpdGxlO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2V0UGFnZVRpdGxlOiBmdW5jdGlvbiAodGl0bGUpIHtcbiAgICAgICAgICAgICAgICBfc2V0UGFnZVRpdGxlKHRpdGxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IHNlYXJjaCBzZXJ2aWNlIGZvciBhY3Rpdml0eVRpbGVzSW5maW5pdHlHcmlkXG4gKi9cbm9wcGlhLmNvbnN0YW50KCdTRUFSQ0hfREFUQV9VUkwnLCAnL3NlYXJjaGhhbmRsZXIvZGF0YScpO1xub3BwaWEuZmFjdG9yeSgnU2VhcmNoU2VydmljZScsIFtcbiAgICAnJGh0dHAnLCAnJGxvZycsICckcm9vdFNjb3BlJywgJyR0cmFuc2xhdGUnLCAnU0VBUkNIX0RBVEFfVVJMJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsICRsb2csICRyb290U2NvcGUsICR0cmFuc2xhdGUsIFNFQVJDSF9EQVRBX1VSTCkge1xuICAgICAgICB2YXIgX2xhc3RRdWVyeSA9IG51bGw7XG4gICAgICAgIHZhciBfbGFzdFNlbGVjdGVkQ2F0ZWdvcmllcyA9IHt9O1xuICAgICAgICB2YXIgX2xhc3RTZWxlY3RlZExhbmd1YWdlQ29kZXMgPSB7fTtcbiAgICAgICAgdmFyIF9zZWFyY2hDdXJzb3IgPSBudWxsO1xuICAgICAgICAvLyBBcHBlbmRzIGEgc3VmZml4IHRvIHRoZSBxdWVyeSBkZXNjcmliaW5nIGFsbG93ZWQgY2F0ZWdvcnkgYW5kIGxhbmd1YWdlXG4gICAgICAgIC8vIGNvZGVzIHRvIGZpbHRlciBvbi5cbiAgICAgICAgdmFyIF9nZXRTdWZmaXhGb3JRdWVyeSA9IGZ1bmN0aW9uIChzZWxlY3RlZENhdGVnb3JpZXMsIHNlbGVjdGVkTGFuZ3VhZ2VDb2Rlcykge1xuICAgICAgICAgICAgdmFyIHF1ZXJ5U3VmZml4ID0gJyc7XG4gICAgICAgICAgICB2YXIgX2NhdGVnb3JpZXMgPSAnJztcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBzZWxlY3RlZENhdGVnb3JpZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0ZWRDYXRlZ29yaWVzW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF9jYXRlZ29yaWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfY2F0ZWdvcmllcyArPSAnXCIgT1IgXCInO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIF9jYXRlZ29yaWVzICs9IGtleTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoX2NhdGVnb3JpZXMpIHtcbiAgICAgICAgICAgICAgICBxdWVyeVN1ZmZpeCArPSAnJmNhdGVnb3J5PShcIicgKyBfY2F0ZWdvcmllcyArICdcIiknO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIF9sYW5ndWFnZUNvZGVzID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gc2VsZWN0ZWRMYW5ndWFnZUNvZGVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdGVkTGFuZ3VhZ2VDb2Rlc1trZXldKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfbGFuZ3VhZ2VDb2Rlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgX2xhbmd1YWdlQ29kZXMgKz0gJ1wiIE9SIFwiJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBfbGFuZ3VhZ2VDb2RlcyArPSBrZXk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKF9sYW5ndWFnZUNvZGVzKSB7XG4gICAgICAgICAgICAgICAgcXVlcnlTdWZmaXggKz0gJyZsYW5ndWFnZV9jb2RlPShcIicgKyBfbGFuZ3VhZ2VDb2RlcyArICdcIiknO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHF1ZXJ5U3VmZml4O1xuICAgICAgICB9O1xuICAgICAgICB2YXIgaGFzUmVhY2hlZEVuZE9mUGFnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBfc2VhcmNoQ3Vyc29yID09PSBudWxsO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgdXBkYXRlU2VhcmNoRmllbGRzID0gZnVuY3Rpb24gKGl0ZW1zVHlwZSwgdXJsQ29tcG9uZW50LCBzZWxlY3Rpb25EZXRhaWxzKSB7XG4gICAgICAgICAgICB2YXIgaXRlbUNvZGVHcm91cCA9IHVybENvbXBvbmVudC5tYXRjaCgvPVxcKFwiW0EtWmEteiUyMFwiIF0rXCJcXCkvKTtcbiAgICAgICAgICAgIHZhciBpdGVtQ29kZXMgPSBpdGVtQ29kZUdyb3VwID8gaXRlbUNvZGVHcm91cFswXSA6IG51bGw7XG4gICAgICAgICAgICB2YXIgRVhQRUNURURfUFJFRklYID0gJz0oXCInO1xuICAgICAgICAgICAgdmFyIEVYUEVDVEVEX1NVRkZJWCA9ICdcIiknO1xuICAgICAgICAgICAgaWYgKCFpdGVtQ29kZXMgfHxcbiAgICAgICAgICAgICAgICBpdGVtQ29kZXMuaW5kZXhPZihFWFBFQ1RFRF9QUkVGSVgpICE9PSAwIHx8XG4gICAgICAgICAgICAgICAgaXRlbUNvZGVzLmxhc3RJbmRleE9mKEVYUEVDVEVEX1NVRkZJWCkgIT09XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1Db2Rlcy5sZW5ndGggLSBFWFBFQ1RFRF9TVUZGSVgubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgc2VhcmNoIHF1ZXJ5IHVybCBmcmFnbWVudCBmb3IgJyArXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zVHlwZSArICc6ICcgKyB1cmxDb21wb25lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGl0ZW1zID0gaXRlbUNvZGVzLnN1YnN0cmluZyhFWFBFQ1RFRF9QUkVGSVgubGVuZ3RoLCBpdGVtQ29kZXMubGVuZ3RoIC0gRVhQRUNURURfU1VGRklYLmxlbmd0aCkuc3BsaXQoJ1wiIE9SIFwiJyk7XG4gICAgICAgICAgICB2YXIgc2VsZWN0aW9ucyA9IHNlbGVjdGlvbkRldGFpbHNbaXRlbXNUeXBlXS5zZWxlY3Rpb25zO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHNlbGVjdGlvbnNbaXRlbXNbaV1dID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9pc0N1cnJlbnRseUZldGNoaW5nUmVzdWx0cyA9IGZhbHNlO1xuICAgICAgICB2YXIgbnVtU2VhcmNoZXNJblByb2dyZXNzID0gMDtcbiAgICAgICAgdmFyIGdldFF1ZXJ5VXJsID0gZnVuY3Rpb24gKHNlYXJjaFVybFF1ZXJ5U3RyaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gU0VBUkNIX0RBVEFfVVJMICsgJz9xPScgKyBzZWFyY2hVcmxRdWVyeVN0cmluZztcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGdldFNlYXJjaFVybFF1ZXJ5U3RyaW5nOiBmdW5jdGlvbiAoc2VhcmNoUXVlcnksIHNlbGVjdGVkQ2F0ZWdvcmllcywgc2VsZWN0ZWRMYW5ndWFnZUNvZGVzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudChzZWFyY2hRdWVyeSkgK1xuICAgICAgICAgICAgICAgICAgICBfZ2V0U3VmZml4Rm9yUXVlcnkoc2VsZWN0ZWRDYXRlZ29yaWVzLCBzZWxlY3RlZExhbmd1YWdlQ29kZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIE5vdGUgdGhhdCBhbiBlbXB0eSBxdWVyeSByZXN1bHRzIGluIGFsbCBhY3Rpdml0aWVzIGJlaW5nIHNob3duLlxuICAgICAgICAgICAgZXhlY3V0ZVNlYXJjaFF1ZXJ5OiBmdW5jdGlvbiAoc2VhcmNoUXVlcnksIHNlbGVjdGVkQ2F0ZWdvcmllcywgc2VsZWN0ZWRMYW5ndWFnZUNvZGVzLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICB2YXIgcXVlcnlVcmwgPSBnZXRRdWVyeVVybCh0aGlzLmdldFNlYXJjaFVybFF1ZXJ5U3RyaW5nKHNlYXJjaFF1ZXJ5LCBzZWxlY3RlZENhdGVnb3JpZXMsIHNlbGVjdGVkTGFuZ3VhZ2VDb2RlcykpO1xuICAgICAgICAgICAgICAgIF9pc0N1cnJlbnRseUZldGNoaW5nUmVzdWx0cyA9IHRydWU7XG4gICAgICAgICAgICAgICAgbnVtU2VhcmNoZXNJblByb2dyZXNzKys7XG4gICAgICAgICAgICAgICAgJGh0dHAuZ2V0KHF1ZXJ5VXJsKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAgICAgICAgIF9sYXN0UXVlcnkgPSBzZWFyY2hRdWVyeTtcbiAgICAgICAgICAgICAgICAgICAgX2xhc3RTZWxlY3RlZENhdGVnb3JpZXMgPSBhbmd1bGFyLmNvcHkoc2VsZWN0ZWRDYXRlZ29yaWVzKTtcbiAgICAgICAgICAgICAgICAgICAgX2xhc3RTZWxlY3RlZExhbmd1YWdlQ29kZXMgPSBhbmd1bGFyLmNvcHkoc2VsZWN0ZWRMYW5ndWFnZUNvZGVzKTtcbiAgICAgICAgICAgICAgICAgICAgX3NlYXJjaEN1cnNvciA9IGRhdGEuc2VhcmNoX2N1cnNvcjtcbiAgICAgICAgICAgICAgICAgICAgbnVtU2VhcmNoZXNJblByb2dyZXNzLS07XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnaW5pdGlhbFNlYXJjaFJlc3VsdHNMb2FkZWQnLCBkYXRhLmFjdGl2aXR5X2xpc3QpO1xuICAgICAgICAgICAgICAgICAgICBfaXNDdXJyZW50bHlGZXRjaGluZ1Jlc3VsdHMgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoZWNrTWlzbWF0Y2ggPSBmdW5jdGlvbiAoc2VhcmNoUXVlcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpc01pc21hdGNoID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJy5vcHBpYS1zZWFyY2gtYmFyLWlucHV0JykuZWFjaChmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS52YWwoKS50cmltKCkgPT09IHNlYXJjaFF1ZXJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzTWlzbWF0Y2ggPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpc01pc21hdGNoO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2hlY2tNaXNtYXRjaChzZWFyY2hRdWVyeSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRsb2cuZXJyb3IoJ01pc21hdGNoJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkbG9nLmVycm9yKCdTZWFyY2hRdWVyeTogJyArIHNlYXJjaFF1ZXJ5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRsb2cuZXJyb3IoJ0lucHV0OiAnICsgJCgnLm9wcGlhLXNlYXJjaC1iYXItaW5wdXQnKS52YWwoKS50cmltKCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBudW1TZWFyY2hlc0luUHJvZ3Jlc3MtLTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAvLyBUcmFuc2xhdGUgdGhlIG5ldyBleHBsb3JhdGlvbnMgbG9hZGVkLlxuICAgICAgICAgICAgICAgICR0cmFuc2xhdGUucmVmcmVzaCgpO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzU2VhcmNoSW5Qcm9ncmVzczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudW1TZWFyY2hlc0luUHJvZ3Jlc3MgPiAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgdGFrZXMgaW4gdGhlIHVybCBzZWFyY2ggY29tcG9uZW50IGFzIGFuIGFyZ3VtZW50IGFuZCB0aGVcbiAgICAgICAgICAgIC8vIHNlbGVjdGlvbkRldGFpbHMuIEl0IHdpbGwgdXBkYXRlIHNlbGVjdGlvbkRldGFpbHMgd2l0aCB0aGUgcmVsZXZhbnRcbiAgICAgICAgICAgIC8vIGZpZWxkcyB0aGF0IHdlcmUgZXh0cmFjdGVkIGZyb20gdGhlIHVybC4gSXQgcmV0dXJucyB0aGUgdW5lbmNvZGVkXG4gICAgICAgICAgICAvLyBzZWFyY2ggcXVlcnkgc3RyaW5nLlxuICAgICAgICAgICAgdXBkYXRlU2VhcmNoRmllbGRzQmFzZWRPblVybFF1ZXJ5OiBmdW5jdGlvbiAodXJsQ29tcG9uZW50LCBzZWxlY3Rpb25EZXRhaWxzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHVybFF1ZXJ5ID0gdXJsQ29tcG9uZW50LnN1YnN0cmluZygnP3E9Jy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgd2lsbCBzcGxpdCB0aGUgdXJsUXVlcnkgaW50byAzIGNvbXBvbmVudHM6XG4gICAgICAgICAgICAgICAgLy8gMS4gcXVlcnlcbiAgICAgICAgICAgICAgICAvLyAyLiBjYXRlZ29yaWVzIChvcHRpb25hbClcbiAgICAgICAgICAgICAgICAvLyAzLiBsYW5ndWFnZSBjb2RlcyAoZGVmYXVsdCB0byAnZW4nKVxuICAgICAgICAgICAgICAgIHZhciBxdWVyeVNlZ21lbnRzID0gdXJsUXVlcnkuc3BsaXQoJyYnKTtcbiAgICAgICAgICAgICAgICBpZiAocXVlcnlTZWdtZW50cy5sZW5ndGggPiAzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIHNlYXJjaCBxdWVyeSB1cmw6ICcgKyB1cmxRdWVyeSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgcXVlcnlTZWdtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB1cmxDb21wb25lbnQgPSBkZWNvZGVVUklDb21wb25lbnQocXVlcnlTZWdtZW50c1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpdGVtc1R5cGUgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBpZiAodXJsQ29tcG9uZW50LmluZGV4T2YoJ2NhdGVnb3J5JykgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zVHlwZSA9ICdjYXRlZ29yaWVzJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh1cmxDb21wb25lbnQuaW5kZXhPZignbGFuZ3VhZ2VfY29kZScpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtc1R5cGUgPSAnbGFuZ3VhZ2VDb2Rlcyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdJbnZhbGlkIHNlYXJjaCBxdWVyeSBjb21wb25lbnQ6ICcgKyB1cmxDb21wb25lbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZVNlYXJjaEZpZWxkcyhpdGVtc1R5cGUsIHVybENvbXBvbmVudCwgc2VsZWN0aW9uRGV0YWlscyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb25EZXRhaWxzW2l0ZW1zVHlwZV0uc2VsZWN0aW9ucyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChxdWVyeVNlZ21lbnRzWzBdKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRDdXJyZW50VXJsUXVlcnlTdHJpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRTZWFyY2hVcmxRdWVyeVN0cmluZyhfbGFzdFF1ZXJ5LCBfbGFzdFNlbGVjdGVkQ2F0ZWdvcmllcywgX2xhc3RTZWxlY3RlZExhbmd1YWdlQ29kZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxvYWRNb3JlRGF0YTogZnVuY3Rpb24gKHN1Y2Nlc3NDYWxsYmFjaywgZmFpbHVyZUNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgYSBuZXcgcXVlcnkgaXMgc3RpbGwgYmVpbmcgc2VudCwgb3IgdGhlIGVuZCBvZiB0aGUgcGFnZSBoYXMgYmVlblxuICAgICAgICAgICAgICAgIC8vIHJlYWNoZWQsIGRvIG5vdCBmZXRjaCBtb3JlIHJlc3VsdHMuXG4gICAgICAgICAgICAgICAgaWYgKF9pc0N1cnJlbnRseUZldGNoaW5nUmVzdWx0cyB8fCBoYXNSZWFjaGVkRW5kT2ZQYWdlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZmFpbHVyZUNhbGxiYWNrKGhhc1JlYWNoZWRFbmRPZlBhZ2UoKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHF1ZXJ5VXJsID0gZ2V0UXVlcnlVcmwodGhpcy5nZXRDdXJyZW50VXJsUXVlcnlTdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgaWYgKF9zZWFyY2hDdXJzb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcXVlcnlVcmwgKz0gJyZjdXJzb3I9JyArIF9zZWFyY2hDdXJzb3I7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF9pc0N1cnJlbnRseUZldGNoaW5nUmVzdWx0cyA9IHRydWU7XG4gICAgICAgICAgICAgICAgJGh0dHAuZ2V0KHF1ZXJ5VXJsKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICBfc2VhcmNoQ3Vyc29yID0gcmVzcG9uc2UuZGF0YS5zZWFyY2hfY3Vyc29yO1xuICAgICAgICAgICAgICAgICAgICBfaXNDdXJyZW50bHlGZXRjaGluZ1Jlc3VsdHMgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3BvbnNlLmRhdGEsIGhhc1JlYWNoZWRFbmRPZlBhZ2UoKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVXRpbGl0eSBzZXJ2aWNlcyBmb3IgZXhwbG9yYXRpb25zIHdoaWNoIG1heSBiZSBzaGFyZWQgYnkgYm90aFxuICogdGhlIGxlYXJuZXIgYW5kIGVkaXRvciB2aWV3cy5cbiAqL1xuLy8gU2VydmljZSBmb3Igc2VuZGluZyBldmVudHMgdG8gR29vZ2xlIEFuYWx5dGljcy5cbi8vXG4vLyBOb3RlIHRoYXQgZXZlbnRzIGFyZSBvbmx5IHNlbnQgaWYgdGhlIENBTl9TRU5EX0FOQUxZVElDU19FVkVOVFMgZmxhZyBpc1xuLy8gdHVybmVkIG9uLiBUaGlzIGZsYWcgbXVzdCBiZSB0dXJuZWQgb24gZXhwbGljaXRseSBieSB0aGUgYXBwbGljYXRpb25cbi8vIG93bmVyIGluIGZlY29uZi5weS5cbm9wcGlhLmZhY3RvcnkoJ1NpdGVBbmFseXRpY3NTZXJ2aWNlJywgWyckd2luZG93JywgZnVuY3Rpb24gKCR3aW5kb3cpIHtcbiAgICAgICAgdmFyIENBTl9TRU5EX0FOQUxZVElDU19FVkVOVFMgPSBjb25zdGFudHMuQ0FOX1NFTkRfQU5BTFlUSUNTX0VWRU5UUztcbiAgICAgICAgLy8gRm9yIGRlZmluaXRpb25zIG9mIHRoZSB2YXJpb3VzIGFyZ3VtZW50cywgcGxlYXNlIHNlZTpcbiAgICAgICAgLy8gZGV2ZWxvcGVycy5nb29nbGUuY29tL2FuYWx5dGljcy9kZXZndWlkZXMvY29sbGVjdGlvbi9hbmFseXRpY3Nqcy9ldmVudHNcbiAgICAgICAgdmFyIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcyA9IGZ1bmN0aW9uIChldmVudENhdGVnb3J5LCBldmVudEFjdGlvbiwgZXZlbnRMYWJlbCkge1xuICAgICAgICAgICAgaWYgKCR3aW5kb3cuZ2EgJiYgQ0FOX1NFTkRfQU5BTFlUSUNTX0VWRU5UUykge1xuICAgICAgICAgICAgICAgICR3aW5kb3cuZ2EoJ3NlbmQnLCAnZXZlbnQnLCBldmVudENhdGVnb3J5LCBldmVudEFjdGlvbiwgZXZlbnRMYWJlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8vIEZvciBkZWZpbml0aW9ucyBvZiB0aGUgdmFyaW91cyBhcmd1bWVudHMsIHBsZWFzZSBzZWU6XG4gICAgICAgIC8vIGRldmVsb3BlcnMuZ29vZ2xlLmNvbS9hbmFseXRpY3MvZGV2Z3VpZGVzL2NvbGxlY3Rpb24vYW5hbHl0aWNzanMvXG4gICAgICAgIC8vICAgc29jaWFsLWludGVyYWN0aW9uc1xuICAgICAgICB2YXIgX3NlbmRTb2NpYWxFdmVudFRvR29vZ2xlQW5hbHl0aWNzID0gZnVuY3Rpb24gKG5ldHdvcmssIGFjdGlvbiwgdGFyZ2V0VXJsKSB7XG4gICAgICAgICAgICBpZiAoJHdpbmRvdy5nYSAmJiBDQU5fU0VORF9BTkFMWVRJQ1NfRVZFTlRTKSB7XG4gICAgICAgICAgICAgICAgJHdpbmRvdy5nYSgnc2VuZCcsICdzb2NpYWwnLCBuZXR3b3JrLCBhY3Rpb24sIHRhcmdldFVybCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvLyBUaGUgc3JjRWxlbWVudCByZWZlcnMgdG8gdGhlIGVsZW1lbnQgb24gdGhlIHBhZ2UgdGhhdCBpcyBjbGlja2VkLlxuICAgICAgICAgICAgcmVnaXN0ZXJTdGFydExvZ2luRXZlbnQ6IGZ1bmN0aW9uIChzcmNFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdMb2dpbkJ1dHRvbicsICdjbGljaycsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyAnICcgKyBzcmNFbGVtZW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck5ld1NpZ251cEV2ZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTaWdudXBCdXR0b24nLCAnY2xpY2snLCAnJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJDbGlja0Jyb3dzZUxpYnJhcnlCdXR0b25FdmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQnJvd3NlTGlicmFyeUJ1dHRvbicsICdjbGljaycsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyR29Ub0RvbmF0aW9uU2l0ZUV2ZW50OiBmdW5jdGlvbiAoZG9uYXRpb25TaXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnR29Ub0RvbmF0aW9uU2l0ZScsICdjbGljaycsIGRvbmF0aW9uU2l0ZU5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQXBwbHlUb1RlYWNoV2l0aE9wcGlhRXZlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0FwcGx5VG9UZWFjaFdpdGhPcHBpYScsICdjbGljaycsICcnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckNsaWNrQ3JlYXRlRXhwbG9yYXRpb25CdXR0b25FdmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQ3JlYXRlRXhwbG9yYXRpb25CdXR0b24nLCAnY2xpY2snLCAkd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckNyZWF0ZU5ld0V4cGxvcmF0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdOZXdFeHBsb3JhdGlvbicsICdjcmVhdGUnLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckNyZWF0ZU5ld0V4cGxvcmF0aW9uSW5Db2xsZWN0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdOZXdFeHBsb3JhdGlvbkZyb21Db2xsZWN0aW9uJywgJ2NyZWF0ZScsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQ3JlYXRlTmV3Q29sbGVjdGlvbkV2ZW50OiBmdW5jdGlvbiAoY29sbGVjdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdOZXdDb2xsZWN0aW9uJywgJ2NyZWF0ZScsIGNvbGxlY3Rpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJDb21taXRDaGFuZ2VzVG9Qcml2YXRlRXhwbG9yYXRpb25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0NvbW1pdFRvUHJpdmF0ZUV4cGxvcmF0aW9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJTaGFyZUV4cGxvcmF0aW9uRXZlbnQ6IGZ1bmN0aW9uIChuZXR3b3JrKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRTb2NpYWxFdmVudFRvR29vZ2xlQW5hbHl0aWNzKG5ldHdvcmssICdzaGFyZScsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyU2hhcmVDb2xsZWN0aW9uRXZlbnQ6IGZ1bmN0aW9uIChuZXR3b3JrKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRTb2NpYWxFdmVudFRvR29vZ2xlQW5hbHl0aWNzKG5ldHdvcmssICdzaGFyZScsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyT3BlbkVtYmVkSW5mb0V2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnRW1iZWRJbmZvTW9kYWwnLCAnb3BlbicsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQ29tbWl0Q2hhbmdlc1RvUHVibGljRXhwbG9yYXRpb25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0NvbW1pdFRvUHVibGljRXhwbG9yYXRpb24nLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBNZXRyaWNzIGZvciB0dXRvcmlhbCBvbiBmaXJzdCBjcmVhdGluZyBleHBsb3JhdGlvblxuICAgICAgICAgICAgcmVnaXN0ZXJUdXRvcmlhbE1vZGFsT3BlbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnVHV0b3JpYWxNb2RhbE9wZW4nLCAnb3BlbicsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRGVjbGluZVR1dG9yaWFsTW9kYWxFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0RlY2xpbmVUdXRvcmlhbE1vZGFsJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJBY2NlcHRUdXRvcmlhbE1vZGFsRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdBY2NlcHRUdXRvcmlhbE1vZGFsJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gTWV0cmljcyBmb3IgdmlzaXRpbmcgdGhlIGhlbHAgY2VudGVyXG4gICAgICAgICAgICByZWdpc3RlckNsaWNrSGVscEJ1dHRvbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQ2xpY2tIZWxwQnV0dG9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJWaXNpdEhlbHBDZW50ZXJFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1Zpc2l0SGVscENlbnRlcicsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyT3BlblR1dG9yaWFsRnJvbUhlbHBDZW50ZXJFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ09wZW5UdXRvcmlhbEZyb21IZWxwQ2VudGVyJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gTWV0cmljcyBmb3IgZXhpdGluZyB0aGUgdHV0b3JpYWxcbiAgICAgICAgICAgIHJlZ2lzdGVyU2tpcFR1dG9yaWFsRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTa2lwVHV0b3JpYWwnLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpbmlzaFR1dG9yaWFsRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaW5pc2hUdXRvcmlhbCcsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIE1ldHJpY3MgZm9yIGZpcnN0IHRpbWUgZWRpdG9yIHVzZVxuICAgICAgICAgICAgcmVnaXN0ZXJFZGl0b3JGaXJzdEVudHJ5RXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdEVudGVyRWRpdG9yJywgJ29wZW4nLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpcnN0T3BlbkNvbnRlbnRCb3hFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0ZpcnN0T3BlbkNvbnRlbnRCb3gnLCAnb3BlbicsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlyc3RTYXZlQ29udGVudEV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnRmlyc3RTYXZlQ29udGVudCcsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlyc3RDbGlja0FkZEludGVyYWN0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdENsaWNrQWRkSW50ZXJhY3Rpb24nLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpcnN0U2VsZWN0SW50ZXJhY3Rpb25UeXBlRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdFNlbGVjdEludGVyYWN0aW9uVHlwZScsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlyc3RTYXZlSW50ZXJhY3Rpb25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0ZpcnN0U2F2ZUludGVyYWN0aW9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJGaXJzdFNhdmVSdWxlRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdFNhdmVSdWxlJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJGaXJzdENyZWF0ZVNlY29uZFN0YXRlRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdENyZWF0ZVNlY29uZFN0YXRlJywgJ2NyZWF0ZScsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIE1ldHJpY3MgZm9yIHB1Ymxpc2hpbmcgZXhwbG9yYXRpb25zXG4gICAgICAgICAgICByZWdpc3RlclNhdmVQbGF5YWJsZUV4cGxvcmF0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTYXZlUGxheWFibGVFeHBsb3JhdGlvbicsICdzYXZlJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJPcGVuUHVibGlzaEV4cGxvcmF0aW9uTW9kYWxFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1B1Ymxpc2hFeHBsb3JhdGlvbk1vZGFsJywgJ29wZW4nLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlclB1Ymxpc2hFeHBsb3JhdGlvbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnUHVibGlzaEV4cGxvcmF0aW9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJWaXNpdE9wcGlhRnJvbUlmcmFtZUV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnVmlzaXRPcHBpYUZyb21JZnJhbWUnLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck5ld0NhcmQ6IGZ1bmN0aW9uIChjYXJkTnVtKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNhcmROdW0gPD0gMTAgfHwgY2FyZE51bSAlIDEwID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnUGxheWVyTmV3Q2FyZCcsICdjbGljaycsIGNhcmROdW0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpbmlzaEV4cGxvcmF0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdQbGF5ZXJGaW5pc2hFeHBsb3JhdGlvbicsICdjbGljaycsICcnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck9wZW5Db2xsZWN0aW9uRnJvbUxhbmRpbmdQYWdlRXZlbnQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ09wZW5GcmFjdGlvbnNGcm9tTGFuZGluZ1BhZ2UnLCAnY2xpY2snLCBjb2xsZWN0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyU3Rld2FyZHNMYW5kaW5nUGFnZUV2ZW50OiBmdW5jdGlvbiAodmlld2VyVHlwZSwgYnV0dG9uVGV4dCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQ2xpY2tCdXR0b25PblN0ZXdhcmRzUGFnZScsICdjbGljaycsIHZpZXdlclR5cGUgKyAnOicgKyBidXR0b25UZXh0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlclNhdmVSZWNvcmRlZEF1ZGlvRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTYXZlUmVjb3JkZWRBdWRpbycsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyU3RhcnRBdWRpb1JlY29yZGluZ0V2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnU3RhcnRBdWRpb1JlY29yZGluZycsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyVXBsb2FkQXVkaW9FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1VwbG9hZFJlY29yZGVkQXVkaW8nLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBtYW5pcHVsYXRpbmcgdGhlIHBhZ2UgVVJMLiBBbHNvIGFsbG93c1xuICogZnVuY3Rpb25zIG9uICR3aW5kb3cgdG8gYmUgbW9ja2VkIGluIHVuaXQgdGVzdHMuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ1VybFNlcnZpY2UnLCBbJyR3aW5kb3cnLCBmdW5jdGlvbiAoJHdpbmRvdykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBmb3IgdGVzdGluZyBwdXJwb3NlcyAodG8gbW9jayAkd2luZG93LmxvY2F0aW9uKVxuICAgICAgICAgICAgZ2V0Q3VycmVudExvY2F0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICR3aW5kb3cubG9jYXRpb247XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q3VycmVudExvY2F0aW9uKCkuc2VhcmNoO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qIEFzIHBhcmFtc1trZXldIGlzIG92ZXJ3cml0dGVuLCBpZiBxdWVyeSBzdHJpbmcgaGFzIG11bHRpcGxlIGZpZWxkVmFsdWVzXG4gICAgICAgICAgICAgICBmb3Igc2FtZSBmaWVsZE5hbWUsIHVzZSBnZXRRdWVyeUZpZWxkVmFsdWVzQXNMaXN0KGZpZWxkTmFtZSkgdG8gZ2V0IGl0XG4gICAgICAgICAgICAgICBpbiBhcnJheSBmb3JtLiAqL1xuICAgICAgICAgICAgZ2V0VXJsUGFyYW1zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHt9O1xuICAgICAgICAgICAgICAgIHZhciBwYXJ0cyA9IHRoaXMuZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nKCkucmVwbGFjZSgvWz8mXSsoW149Jl0rKT0oW14mXSopL2dpLCBmdW5jdGlvbiAobSwga2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJhbXNbZGVjb2RlVVJJQ29tcG9uZW50KGtleSldID0gZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzSWZyYW1lZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICB2YXIgdXJsUGFydHMgPSBwYXRobmFtZS5zcGxpdCgnLycpO1xuICAgICAgICAgICAgICAgIHJldHVybiB1cmxQYXJ0c1sxXSA9PT0gJ2VtYmVkJztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRQYXRobmFtZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEN1cnJlbnRMb2NhdGlvbigpLnBhdGhuYW1lO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFRvcGljIGlkIHNob3VsZCBiZSBjb3JyZWN0bHkgcmV0dXJuZWQgZnJvbSB0b3BpYyBlZGl0b3IgYXMgd2VsbCBhc1xuICAgICAgICAgICAgLy8gc3RvcnkgZWRpdG9yLCBzaW5jZSBib3RoIGhhdmUgdG9waWMgaWQgaW4gdGhlaXIgdXJsLlxuICAgICAgICAgICAgZ2V0VG9waWNJZEZyb21Vcmw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWUgPSB0aGlzLmdldFBhdGhuYW1lKCk7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGhuYW1lLm1hdGNoKC9cXC8oc3Rvcnl8dG9waWMpX2VkaXRvclxcLyhcXHd8LSl7MTJ9L2cpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXRobmFtZS5zcGxpdCgnLycpWzJdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCB0b3BpYyBpZCB1cmwnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRUb3BpY05hbWVGcm9tTGVhcm5lclVybDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWUubWF0Y2goL1xcLyhzdG9yeXx0b3BpY3xwcmFjdGljZV9zZXNzaW9uKS9nKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHBhdGhuYW1lLnNwbGl0KCcvJylbMl0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBVUkwgZm9yIHRvcGljJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0U3RvcnlJZEZyb21Vcmw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWUgPSB0aGlzLmdldFBhdGhuYW1lKCk7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGhuYW1lLm1hdGNoKC9cXC9zdG9yeV9lZGl0b3IoXFwvKFxcd3wtKXsxMn0pezJ9L2cpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXRobmFtZS5zcGxpdCgnLycpWzNdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBzdG9yeSBpZCB1cmwnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRTdG9yeUlkSW5QbGF5ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcXVlcnkgPSB0aGlzLmdldEN1cnJlbnRRdWVyeVN0cmluZygpO1xuICAgICAgICAgICAgICAgIGlmIChxdWVyeS5tYXRjaCgvXFw/c3RvcnlfaWQ9KChcXHd8LSl7MTJ9KS9nKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcXVlcnkuc3BsaXQoJz0nKVsxXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0U2tpbGxJZEZyb21Vcmw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWUgPSB0aGlzLmdldFBhdGhuYW1lKCk7XG4gICAgICAgICAgICAgICAgdmFyIHNraWxsSWQgPSBwYXRobmFtZS5zcGxpdCgnLycpWzJdO1xuICAgICAgICAgICAgICAgIGlmIChza2lsbElkLmxlbmd0aCAhPT0gMTIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgU2tpbGwgSWQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNraWxsSWQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0UXVlcnlGaWVsZFZhbHVlc0FzTGlzdDogZnVuY3Rpb24gKGZpZWxkTmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciBmaWVsZFZhbHVlcyA9IFtdO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmdldEN1cnJlbnRRdWVyeVN0cmluZygpLmluZGV4T2YoJz8nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEVhY2ggcXVlcnlJdGVtIHJldHVybiBvbmUgZmllbGQtdmFsdWUgcGFpciBpbiB0aGUgdXJsLlxuICAgICAgICAgICAgICAgICAgICB2YXIgcXVlcnlJdGVtcyA9IHRoaXMuZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nKCkuc2xpY2UodGhpcy5nZXRDdXJyZW50UXVlcnlTdHJpbmcoKS5pbmRleE9mKCc/JykgKyAxKS5zcGxpdCgnJicpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHF1ZXJ5SXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50RmllbGROYW1lID0gZGVjb2RlVVJJQ29tcG9uZW50KHF1ZXJ5SXRlbXNbaV0uc3BsaXQoJz0nKVswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudEZpZWxkVmFsdWUgPSBkZWNvZGVVUklDb21wb25lbnQocXVlcnlJdGVtc1tpXS5zcGxpdCgnPScpWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50RmllbGROYW1lID09PSBmaWVsZE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZFZhbHVlcy5wdXNoKGN1cnJlbnRGaWVsZFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmllbGRWYWx1ZXM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWRkRmllbGQ6IGZ1bmN0aW9uICh1cmwsIGZpZWxkTmFtZSwgZmllbGRWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciBlbmNvZGVkRmllbGRWYWx1ZSA9IGVuY29kZVVSSUNvbXBvbmVudChmaWVsZFZhbHVlKTtcbiAgICAgICAgICAgICAgICB2YXIgZW5jb2RlZEZpZWxkTmFtZSA9IGVuY29kZVVSSUNvbXBvbmVudChmaWVsZE5hbWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiB1cmwgKyAodXJsLmluZGV4T2YoJz8nKSAhPT0gLTEgPyAnJicgOiAnPycpICsgZW5jb2RlZEZpZWxkTmFtZSArXG4gICAgICAgICAgICAgICAgICAgICc9JyArIGVuY29kZWRGaWVsZFZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEhhc2g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDdXJyZW50TG9jYXRpb24oKS5oYXNoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1dKTtcbiJdLCJzb3VyY2VSb290IjoiIn0=