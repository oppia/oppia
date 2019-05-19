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
/******/ 		"collection_editor": 0
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
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/collection_editor/CollectionEditor.ts","about~admin~app~collection_editor~collection_player~contact~creator_dashboard~donate~email_dashboard~c1e50cc0","admin~app~collection_editor~creator_dashboard~exploration_editor~exploration_player~skill_editor~sto~7c5e036a","admin~app~collection_editor~creator_dashboard~exploration_editor~exploration_player~skill_editor~top~61bb2de1","admin~collection_editor~creator_dashboard~exploration_editor~exploration_player~skill_editor~topic_e~3a7281d0","collection_editor~creator_dashboard~exploration_editor~exploration_player~skill_editor~topic_editor","collection_editor~skill_editor~story_editor~topic_editor","collection_editor~collection_player"]);
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

/***/ "./core/templates/dev/head/domain/collection/CollectionRightsBackendApiService.ts":
/*!****************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/collection/CollectionRightsBackendApiService.ts ***!
  \****************************************************************************************/
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
 * @fileoverview Service to change the rights of collections in the backend.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
oppia.factory('CollectionRightsBackendApiService', [
    '$http', '$log', '$q', 'UrlInterpolationService',
    'COLLECTION_RIGHTS_URL_TEMPLATE',
    function ($http, $log, $q, UrlInterpolationService, COLLECTION_RIGHTS_URL_TEMPLATE) {
        // Maps previously loaded collection rights to their IDs.
        var collectionRightsCache = {};
        var _fetchCollectionRights = function (collectionId, successCallback, errorCallback) {
            var collectionRightsUrl = UrlInterpolationService.interpolateUrl(COLLECTION_RIGHTS_URL_TEMPLATE, {
                collection_id: collectionId
            });
            $http.get(collectionRightsUrl).then(function (response) {
                if (successCallback) {
                    successCallback(response.data);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _setCollectionStatus = function (collectionId, collectionVersion, isPublic, successCallback, errorCallback) {
            var collectionPublishUrl = UrlInterpolationService.interpolateUrl('/collection_editor_handler/publish/<collection_id>', {
                collection_id: collectionId
            });
            var collectionUnpublishUrl = UrlInterpolationService.interpolateUrl('/collection_editor_handler/unpublish/<collection_id>', {
                collection_id: collectionId
            });
            var putParams = {
                version: collectionVersion
            };
            var requestUrl = (isPublic ? collectionPublishUrl : collectionUnpublishUrl);
            $http.put(requestUrl, putParams).then(function (response) {
                collectionRightsCache[collectionId] = response.data;
                if (successCallback) {
                    successCallback(response.data);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _isCached = function (collectionId) {
            return collectionRightsCache.hasOwnProperty(collectionId);
        };
        return {
            /**
             * Gets a collection's rights, given its ID.
             */
            fetchCollectionRights: function (collectionId) {
                return $q(function (resolve, reject) {
                    _fetchCollectionRights(collectionId, resolve, reject);
                });
            },
            /**
             * Behaves exactly as fetchCollectionRights (including callback
             * behavior and returning a promise object), except this function will
             * attempt to see whether the given collection rights has been
             * cached. If it has not yet been cached, it will fetch the collection
             * rights from the backend. If it successfully retrieves the collection
             * rights from the backend, it will store it in the cache to avoid
             * requests from the backend in further function calls.
             */
            loadCollectionRights: function (collectionId) {
                return $q(function (resolve, reject) {
                    if (_isCached(collectionId)) {
                        if (resolve) {
                            resolve(collectionRightsCache[collectionId]);
                        }
                    }
                    else {
                        _fetchCollectionRights(collectionId, function (collectionRights) {
                            // Save the fetched collection rights to avoid future fetches.
                            collectionRightsCache[collectionId] = collectionRights;
                            if (resolve) {
                                resolve(collectionRightsCache[collectionId]);
                            }
                        }, reject);
                    }
                });
            },
            /**
             * Returns whether the given collection rights is stored within the
             * local data cache or if it needs to be retrieved from the backend
             * upon a laod.
             */
            isCached: function (collectionId) {
                return _isCached(collectionId);
            },
            /**
             * Replaces the current collection rights in the cache given by the
             * specified collection ID with a new collection rights object.
             */
            cacheCollectionRights: function (collectionId, collectionRights) {
                collectionRightsCache[collectionId] = angular.copy(collectionRights);
            },
            /**
             * Updates a collection's rights to be have public learner access, given
             * its ID and version.
             */
            setCollectionPublic: function (collectionId, collectionVersion) {
                return $q(function (resolve, reject) {
                    _setCollectionStatus(collectionId, collectionVersion, true, resolve, reject);
                });
            },
            /**
             * Updates a collection's rights to be have private learner access,
             * given its ID and version.
             */
            setCollectionPrivate: function (collectionId, collectionVersion) {
                return $q(function (resolve, reject) {
                    _setCollectionStatus(collectionId, collectionVersion, false, resolve, reject);
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/collection/CollectionRightsObjectFactory.ts":
/*!************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/collection/CollectionRightsObjectFactory.ts ***!
  \************************************************************************************/
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
 * @fileoverview Factory for creating and mutating instances of frontend
 * collection rights domain objects.
 */
oppia.factory('CollectionRightsObjectFactory', [
    function () {
        var CollectionRights = function (collectionRightsObject) {
            this._collectionId = collectionRightsObject.collection_id;
            this._canEdit = collectionRightsObject.can_edit;
            this._canUnpublish = collectionRightsObject.can_unpublish;
            this._isPrivate = collectionRightsObject.is_private;
            this._ownerNames = collectionRightsObject.owner_names;
        };
        // Instance methods
        CollectionRights.prototype.getCollectionId = function () {
            return this._collectionId;
        };
        // Returns true if the the user can edit the collection. This property is
        // immutable.
        CollectionRights.prototype.canEdit = function () {
            return this._canEdit;
        };
        // Returns true if the user can unpublish the collection.
        CollectionRights.prototype.canUnpublish = function () {
            return this._canUnpublish;
        };
        // Returns true if the collection is private.
        CollectionRights.prototype.isPrivate = function () {
            return this._isPrivate;
        };
        // Returns true if the collection is public.
        CollectionRights.prototype.isPublic = function () {
            return !this._isPrivate;
        };
        // Sets isPrivate to false only if the user can edit the corresponding
        // collection.
        CollectionRights.prototype.setPublic = function () {
            if (this.canEdit()) {
                this._isPrivate = false;
            }
            else {
                throw new Error('User is not allowed to edit this collection.');
            }
        };
        // Sets isPrivate to true only if canUnpublish and canEdit are both true.
        CollectionRights.prototype.setPrivate = function () {
            if (this.canEdit() && this.canUnpublish()) {
                this._isPrivate = true;
            }
            else {
                throw new Error('User is not allowed to unpublish this collection.');
            }
        };
        // Returns the owner names of the collection. This property is immutable.
        CollectionRights.prototype.getOwnerNames = function () {
            return angular.copy(this._ownerNames);
        };
        // Returns the reference to the internal ownerNames array; this function is
        // only meant to be used for Angular bindings and should never be used in
        // code. Please use getOwnerNames() and related functions, instead. Please
        // also be aware this exposes internal state of the collection rights domain
        // object, so changes to the array itself may internally break the domain
        // object.
        CollectionRights.prototype.getBindableOwnerNames = function () {
            return this._ownerNames;
        };
        // Static class methods. Note that "this" is not available in static
        // contexts. This function takes a JSON object which represents a backend
        // collection python dict.
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        CollectionRights['create'] = function (collectionRightsBackendObject) {
            /* eslint-enable dot-notation */
            return new CollectionRights(angular.copy(collectionRightsBackendObject));
        };
        // Reassigns all values within this collection to match the existing
        // collection rights. This is performed as a deep copy such that none of the
        // internal, bindable objects are changed within this collection rights.
        // Note that the collection nodes within this collection will be completely
        // redefined as copies from the specified collection rights
        CollectionRights.prototype.copyFromCollectionRights = function (otherCollectionRights) {
            this._collectionId = otherCollectionRights.getCollectionId();
            this._canEdit = otherCollectionRights.canEdit();
            this._isPrivate = otherCollectionRights.isPrivate();
            this._canUnpublish = otherCollectionRights.canUnpublish();
            this._ownerNames = otherCollectionRights.getOwnerNames();
        };
        // Create a new, empty collection rights object. This is not guaranteed to
        // pass validation tests.
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        CollectionRights['createEmptyCollectionRights'] = function () {
            /* eslint-enable dot-notation */
            return new CollectionRights({
                owner_names: []
            });
        };
        return CollectionRights;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/collection/CollectionUpdateService.ts":
/*!******************************************************************************!*\
  !*** ./core/templates/dev/head/domain/collection/CollectionUpdateService.ts ***!
  \******************************************************************************/
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
 * @fileoverview Service to build changes to a collection. These changes may
 * then be used by other services, such as a backend API service to update the
 * collection in the backend. This service also registers all changes with the
 * undo/redo service.
 */
__webpack_require__(/*! domain/collection/CollectionNodeObjectFactory.ts */ "./core/templates/dev/head/domain/collection/CollectionNodeObjectFactory.ts");
__webpack_require__(/*! domain/editor/undo_redo/ChangeObjectFactory.ts */ "./core/templates/dev/head/domain/editor/undo_redo/ChangeObjectFactory.ts");
__webpack_require__(/*! domain/editor/undo_redo/UndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts");
// These should match the constants defined in core.domain.collection_domain.
// TODO(bhenning): The values of these constants should be provided by the
// backend.
// NOTE TO DEVELOPERS: the properties 'prerequisite_skills' and
// 'acquired_skills' are deprecated. Do not use them.
oppia.constant('CMD_ADD_COLLECTION_NODE', 'add_collection_node');
oppia.constant('CMD_SWAP_COLLECTION_NODES', 'swap_nodes');
oppia.constant('CMD_DELETE_COLLECTION_NODE', 'delete_collection_node');
oppia.constant('CMD_EDIT_COLLECTION_PROPERTY', 'edit_collection_property');
oppia.constant('CMD_EDIT_COLLECTION_NODE_PROPERTY', 'edit_collection_node_property');
oppia.constant('COLLECTION_PROPERTY_TITLE', 'title');
oppia.constant('COLLECTION_PROPERTY_CATEGORY', 'category');
oppia.constant('COLLECTION_PROPERTY_OBJECTIVE', 'objective');
oppia.constant('COLLECTION_PROPERTY_LANGUAGE_CODE', 'language_code');
oppia.constant('COLLECTION_PROPERTY_TAGS', 'tags');
oppia.constant('CMD_ADD_COLLECTION_SKILL', 'add_collection_skill');
oppia.constant('CMD_DELETE_COLLECTION_SKILL', 'delete_collection_skill');
oppia.constant('COLLECTION_NODE_PROPERTY_PREREQUISITE_SKILL_IDS', 'prerequisite_skill_ids');
oppia.constant('COLLECTION_NODE_PROPERTY_ACQUIRED_SKILL_IDS', 'acquired_skill_ids');
oppia.factory('CollectionUpdateService', [
    'ChangeObjectFactory',
    'CollectionNodeObjectFactory', 'UndoRedoService',
    'CMD_ADD_COLLECTION_NODE', 'CMD_ADD_COLLECTION_SKILL',
    'CMD_DELETE_COLLECTION_NODE', 'CMD_DELETE_COLLECTION_SKILL',
    'CMD_EDIT_COLLECTION_NODE_PROPERTY', 'CMD_EDIT_COLLECTION_PROPERTY',
    'CMD_SWAP_COLLECTION_NODES', 'COLLECTION_NODE_PROPERTY_ACQUIRED_SKILL_IDS',
    'COLLECTION_NODE_PROPERTY_PREREQUISITE_SKILL_IDS',
    'COLLECTION_PROPERTY_CATEGORY', 'COLLECTION_PROPERTY_LANGUAGE_CODE',
    'COLLECTION_PROPERTY_OBJECTIVE',
    'COLLECTION_PROPERTY_TAGS', 'COLLECTION_PROPERTY_TITLE', function (ChangeObjectFactory, CollectionNodeObjectFactory, UndoRedoService, CMD_ADD_COLLECTION_NODE, CMD_ADD_COLLECTION_SKILL, CMD_DELETE_COLLECTION_NODE, CMD_DELETE_COLLECTION_SKILL, CMD_EDIT_COLLECTION_NODE_PROPERTY, CMD_EDIT_COLLECTION_PROPERTY, CMD_SWAP_COLLECTION_NODES, COLLECTION_NODE_PROPERTY_ACQUIRED_SKILL_IDS, COLLECTION_NODE_PROPERTY_PREREQUISITE_SKILL_IDS, COLLECTION_PROPERTY_CATEGORY, COLLECTION_PROPERTY_LANGUAGE_CODE, COLLECTION_PROPERTY_OBJECTIVE, COLLECTION_PROPERTY_TAGS, COLLECTION_PROPERTY_TITLE) {
        // Creates a change using an apply function, reverse function, a change
        // command and related parameters. The change is applied to a given
        // collection.
        var _applyChange = function (collection, command, params, apply, reverse) {
            var changeDict = angular.copy(params);
            changeDict.cmd = command;
            var changeObj = ChangeObjectFactory.create(changeDict, apply, reverse);
            UndoRedoService.applyChange(changeObj, collection);
        };
        var _getParameterFromChangeDict = function (changeDict, paramName) {
            return changeDict[paramName];
        };
        // Applies a collection property change, specifically. See _applyChange()
        // for details on the other behavior of this function.
        var _applyPropertyChange = function (collection, propertyName, newValue, oldValue, apply, reverse) {
            _applyChange(collection, CMD_EDIT_COLLECTION_PROPERTY, {
                property_name: propertyName,
                new_value: angular.copy(newValue),
                old_value: angular.copy(oldValue)
            }, apply, reverse);
        };
        var _getNewPropertyValueFromChangeDict = function (changeDict) {
            return _getParameterFromChangeDict(changeDict, 'new_value');
        };
        // Applies a property change to a collection node. See _applyChanges() for
        // details on the other behavior of this function.
        var _applyNodePropertyChange = function (collection, propertyName, explorationId, newValue, oldValue, apply, reverse) {
            _applyChange(collection, CMD_EDIT_COLLECTION_NODE_PROPERTY, {
                property_name: propertyName,
                exploration_id: explorationId,
                new_value: angular.copy(newValue),
                old_value: angular.copy(oldValue)
            }, apply, reverse);
        };
        var _getExplorationIdFromChangeDict = function (changeDict) {
            return _getParameterFromChangeDict(changeDict, 'exploration_id');
        };
        var _getFirstIndexFromChangeDict = function (changeDict) {
            return _getParameterFromChangeDict(changeDict, 'first_index');
        };
        var _getSecondIndexFromChangeDict = function (changeDict) {
            return _getParameterFromChangeDict(changeDict, 'second_index');
        };
        // These functions are associated with updates available in
        // core.domain.collection_services.apply_change_list.
        return {
            /**
             * Adds a new exploration to a collection and records the change in the
             * undo/redo service.
             */
            addCollectionNode: function (collection, explorationId, explorationSummaryBackendObject) {
                var oldSummaryBackendObject = angular.copy(explorationSummaryBackendObject);
                _applyChange(collection, CMD_ADD_COLLECTION_NODE, {
                    exploration_id: explorationId
                }, function (changeDict, collection) {
                    // Apply.
                    var explorationId = _getExplorationIdFromChangeDict(changeDict);
                    var collectionNode = (CollectionNodeObjectFactory.createFromExplorationId(explorationId));
                    collectionNode.setExplorationSummaryObject(oldSummaryBackendObject);
                    collection.addCollectionNode(collectionNode);
                }, function (changeDict, collection) {
                    // Undo.
                    var explorationId = _getExplorationIdFromChangeDict(changeDict);
                    collection.deleteCollectionNode(explorationId);
                });
            },
            swapNodes: function (collection, firstIndex, secondIndex) {
                _applyChange(collection, CMD_SWAP_COLLECTION_NODES, {
                    first_index: firstIndex,
                    second_index: secondIndex
                }, function (changeDict, collection) {
                    // Apply.
                    var firstIndex = _getFirstIndexFromChangeDict(changeDict);
                    var secondIndex = _getSecondIndexFromChangeDict(changeDict);
                    collection.swapCollectionNodes(firstIndex, secondIndex);
                }, function (changeDict, collection) {
                    // Undo.
                    var firstIndex = _getFirstIndexFromChangeDict(changeDict);
                    var secondIndex = _getSecondIndexFromChangeDict(changeDict);
                    collection.swapCollectionNodes(firstIndex, secondIndex);
                });
            },
            /**
             * Removes an exploration from a collection and records the change in
             * the undo/redo service.
             */
            deleteCollectionNode: function (collection, explorationId) {
                var oldCollectionNode = angular.copy(collection.getCollectionNodeByExplorationId(explorationId));
                _applyChange(collection, CMD_DELETE_COLLECTION_NODE, {
                    exploration_id: explorationId
                }, function (changeDict, collection) {
                    // Apply.
                    var explorationId = _getExplorationIdFromChangeDict(changeDict);
                    collection.deleteCollectionNode(explorationId);
                }, function (changeDict, collection) {
                    // Undo.
                    collection.addCollectionNode(oldCollectionNode);
                });
            },
            /**
             * Changes the title of a collection and records the change in the
             * undo/redo service.
             */
            setCollectionTitle: function (collection, title) {
                var oldTitle = angular.copy(collection.getTitle());
                _applyPropertyChange(collection, COLLECTION_PROPERTY_TITLE, title, oldTitle, function (changeDict, collection) {
                    // Apply
                    var title = _getNewPropertyValueFromChangeDict(changeDict);
                    collection.setTitle(title);
                }, function (changeDict, collection) {
                    // Undo.
                    collection.setTitle(oldTitle);
                });
            },
            /**
             * Changes the category of a collection and records the change in the
             * undo/redo service.
             */
            setCollectionCategory: function (collection, category) {
                var oldCategory = angular.copy(collection.getCategory());
                _applyPropertyChange(collection, COLLECTION_PROPERTY_CATEGORY, category, oldCategory, function (changeDict, collection) {
                    // Apply.
                    var category = _getNewPropertyValueFromChangeDict(changeDict);
                    collection.setCategory(category);
                }, function (changeDict, collection) {
                    // Undo.
                    collection.setCategory(oldCategory);
                });
            },
            /**
             * Changes the objective of a collection and records the change in the
             * undo/redo service.
             */
            setCollectionObjective: function (collection, objective) {
                var oldObjective = angular.copy(collection.getObjective());
                _applyPropertyChange(collection, COLLECTION_PROPERTY_OBJECTIVE, objective, oldObjective, function (changeDict, collection) {
                    // Apply.
                    var objective = _getNewPropertyValueFromChangeDict(changeDict);
                    collection.setObjective(objective);
                }, function (changeDict, collection) {
                    // Undo.
                    collection.setObjective(oldObjective);
                });
            },
            /**
             * Changes the language code of a collection and records the change in
             * the undo/redo service.
             */
            setCollectionLanguageCode: function (collection, languageCode) {
                var oldLanguageCode = angular.copy(collection.getLanguageCode());
                _applyPropertyChange(collection, COLLECTION_PROPERTY_LANGUAGE_CODE, languageCode, oldLanguageCode, function (changeDict, collection) {
                    // Apply.
                    var languageCode = _getNewPropertyValueFromChangeDict(changeDict);
                    collection.setLanguageCode(languageCode);
                }, function (changeDict, collection) {
                    // Undo.
                    collection.setLanguageCode(oldLanguageCode);
                });
            },
            /**
             * Changes the tags of a collection and records the change in
             * the undo/redo service.
             */
            setCollectionTags: function (collection, tags) {
                var oldTags = angular.copy(collection.getTags());
                _applyPropertyChange(collection, COLLECTION_PROPERTY_TAGS, tags, oldTags, function (changeDict, collection) {
                    // Apply.
                    var tags = _getNewPropertyValueFromChangeDict(changeDict);
                    collection.setTags(tags);
                }, function (changeDict, collection) {
                    // Undo.
                    collection.setTags(oldTags);
                });
            },
            /**
             * Returns whether the given change object constructed by this service
             * is adding a new collection node to a collection.
             */
            isAddingCollectionNode: function (changeObject) {
                var backendChangeObject = changeObject.getBackendChangeObject();
                return backendChangeObject.cmd === CMD_ADD_COLLECTION_NODE;
            },
            /**
             * Returns the exploration ID referenced by the specified change object,
             * or undefined if the given changeObject does not reference an
             * exploration ID. The change object is expected to be one constructed
             * by this service.
             */
            getExplorationIdFromChangeObject: function (changeObject) {
                return _getExplorationIdFromChangeDict(changeObject.getBackendChangeObject());
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/collection/CollectionValidationService.ts":
/*!**********************************************************************************!*\
  !*** ./core/templates/dev/head/domain/collection/CollectionValidationService.ts ***!
  \**********************************************************************************/
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
 * @fileoverview Service to validate the consistency of a collection. These
 * checks are performable in the frontend to avoid sending a potentially invalid
 * collection to the backend, which performs similar validation checks to these
 * in collection_domain.Collection and subsequent domain objects.
 */
__webpack_require__(/*! pages/collection_editor/editor_tab/CollectionLinearizerService.ts */ "./core/templates/dev/head/pages/collection_editor/editor_tab/CollectionLinearizerService.ts");
oppia.factory('CollectionValidationService', [
    'CollectionLinearizerService',
    function (CollectionLinearizerService) {
        var _getNonexistentExplorationIds = function (collection) {
            return collection.getCollectionNodes().filter(function (collectionNode) {
                return !collectionNode.doesExplorationExist();
            }).map(function (collectionNode) {
                return collectionNode.getExplorationId();
            });
        };
        var _getPrivateExplorationIds = function (collection) {
            return collection.getCollectionNodes().filter(function (collectionNode) {
                return collectionNode.isExplorationPrivate();
            }).map(function (collectionNode) {
                return collectionNode.getExplorationId();
            });
        };
        // Validates that the tags for the collection are in the proper format,
        // returns true if all tags are in the correct format.
        var validateTagFormat = function (tags) {
            // Check to ensure that all tags follow the format specified in
            // TAG_REGEX.
            var tagRegex = new RegExp(GLOBALS.TAG_REGEX);
            return tags.every(function (tag) {
                return tag.match(tagRegex);
            });
        };
        // Validates that the tags for the collection do not have duplicates,
        // returns true if there are no duplicates.
        var validateDuplicateTags = function (tags) {
            return tags.every(function (tag, idx) {
                return tags.indexOf(tag, idx + 1) === -1;
            });
        };
        // Validates that the tags for the collection are normalized,
        // returns true if all tags were normalized.
        var validateTagsNormalized = function (tags) {
            return tags.every(function (tag) {
                return tag === tag.trim().replace(/\s+/g, ' ');
            });
        };
        var _validateCollection = function (collection, isPublic) {
            // NOTE TO DEVELOPERS: Please ensure that this validation logic is the
            // same as that in core.domain.collection_domain.Collection.validate().
            var issues = [];
            var collectionHasNodes = collection.getCollectionNodeCount() > 0;
            if (!collectionHasNodes) {
                issues.push('There should be at least 1 exploration in the collection.');
            }
            var nonexistentExpIds = _getNonexistentExplorationIds(collection);
            if (nonexistentExpIds.length !== 0) {
                issues.push('The following exploration(s) either do not exist, or you do not ' +
                    'have edit access to add them to this collection: ' +
                    nonexistentExpIds.join(', '));
            }
            if (isPublic) {
                var privateExpIds = _getPrivateExplorationIds(collection);
                if (privateExpIds.length !== 0) {
                    issues.push('Private explorations cannot be added to a public collection: ' +
                        privateExpIds.join(', '));
                }
            }
            return issues;
        };
        return {
            /**
             * Returns a list of error strings found when validating the provided
             * collection. The validation methods used in this function are written to
             * match the validations performed in the backend. This function is
             * expensive, so it should be called sparingly.
             */
            findValidationIssuesForPrivateCollection: function (collection) {
                return _validateCollection(collection, false);
            },
            /**
             * Behaves in the same way as findValidationIssuesForPrivateCollection(),
             * except additional validation checks are performed which are specific to
             * public collections. This function is expensive, so it should be called
             * sparingly.
             */
            findValidationIssuesForPublicCollection: function (collection) {
                return _validateCollection(collection, true);
            },
            /**
             * Returns false if the tags are not validate.
             */
            isTagValid: function (tags) {
                return validateTagFormat(tags) && validateDuplicateTags(tags) &&
                    validateTagsNormalized(tags);
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/collection/EditableCollectionBackendApiService.ts":
/*!******************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/collection/EditableCollectionBackendApiService.ts ***!
  \******************************************************************************************/
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
 * @fileoverview Service to send changes to a collection to the backend.
 */
__webpack_require__(/*! domain/collection/ReadOnlyCollectionBackendApiService.ts */ "./core/templates/dev/head/domain/collection/ReadOnlyCollectionBackendApiService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
// TODO(bhenning): I think that this might be better merged with the
// CollectionBackendApiService. However, that violates the principle of a
// backend API service being available for exactly one URL. To fix this, the
// backend controller could support both get and put and be pulled out of the
// collection learner and moved into its own controller. This is a new pattern
// for the backend, but it makes sense based on the usage of the get HTTP
// request by both the learner and editor views. This would result in one
// backend controller (file and class) for handling retrieving and changing
// collection data, as well as one frontend service for interfacing with it.
// Discuss and decide whether this is a good approach and then remove this TODO
// after deciding and acting upon the decision (which would mean implementing
// it if it's agreed upon).
oppia.factory('EditableCollectionBackendApiService', [
    '$http', '$q', 'ReadOnlyCollectionBackendApiService',
    'UrlInterpolationService', 'COLLECTION_DATA_URL_TEMPLATE',
    'EDITABLE_COLLECTION_DATA_URL_TEMPLATE',
    function ($http, $q, ReadOnlyCollectionBackendApiService, UrlInterpolationService, COLLECTION_DATA_URL_TEMPLATE, EDITABLE_COLLECTION_DATA_URL_TEMPLATE) {
        var _fetchCollection = function (collectionId, successCallback, errorCallback) {
            var collectionDataUrl = UrlInterpolationService.interpolateUrl(EDITABLE_COLLECTION_DATA_URL_TEMPLATE, {
                collection_id: collectionId
            });
            $http.get(collectionDataUrl).then(function (response) {
                var collection = angular.copy(response.data.collection);
                if (successCallback) {
                    successCallback(collection);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _updateCollection = function (collectionId, collectionVersion, commitMessage, changeList, successCallback, errorCallback) {
            var editableCollectionDataUrl = UrlInterpolationService.interpolateUrl(EDITABLE_COLLECTION_DATA_URL_TEMPLATE, {
                collection_id: collectionId
            });
            var putData = {
                version: collectionVersion,
                commit_message: commitMessage,
                change_list: changeList
            };
            $http.put(editableCollectionDataUrl, putData).then(function (response) {
                // The returned data is an updated collection dict.
                var collection = angular.copy(response.data.collection);
                // Update the ReadOnlyCollectionBackendApiService's cache with the new
                // collection.
                ReadOnlyCollectionBackendApiService.cacheCollection(collectionId, collection);
                if (successCallback) {
                    successCallback(collection);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        return {
            fetchCollection: function (collectionId) {
                return $q(function (resolve, reject) {
                    _fetchCollection(collectionId, resolve, reject);
                });
            },
            /**
             * Updates a collection in the backend with the provided collection ID.
             * The changes only apply to the collection of the given version and the
             * request to update the collection will fail if the provided collection
             * version is older than the current version stored in the backend. Both
             * the changes and the message to associate with those changes are used
             * to commit a change to the collection. The new collection is passed to
             * the success callback, if one is provided to the returned promise
             * object. Errors are passed to the error callback, if one is provided.
             * Finally, if the update is successful, the returned collection will be
             * cached within the CollectionBackendApiService to ensure the cache is
             * not out-of-date with any updates made by this backend API service.
             */
            updateCollection: function (collectionId, collectionVersion, commitMessage, changeList) {
                return $q(function (resolve, reject) {
                    _updateCollection(collectionId, collectionVersion, commitMessage, changeList, resolve, reject);
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/collection/SearchExplorationsBackendApiService.ts":
/*!******************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/collection/SearchExplorationsBackendApiService.ts ***!
  \******************************************************************************************/
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
 * @fileoverview Service to search explorations metadata.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
oppia.factory('SearchExplorationsBackendApiService', [
    '$http', '$q', 'AlertsService', 'UrlInterpolationService',
    'SEARCH_EXPLORATION_URL_TEMPLATE',
    function ($http, $q, AlertsService, UrlInterpolationService, SEARCH_EXPLORATION_URL_TEMPLATE) {
        var _fetchExplorations = function (searchQuery, successCallback, errorCallback) {
            var queryUrl = UrlInterpolationService.interpolateUrl(SEARCH_EXPLORATION_URL_TEMPLATE, {
                query: btoa(searchQuery)
            });
            $http.get(queryUrl).then(function (response) {
                successCallback(response.data);
            }, function (errorResponse) {
                errorCallback(errorResponse.data);
            });
        };
        return {
            /**
             * Returns exploration's metadata dict, given a search query. Search
             * queries are tokens that will be matched against exploration's title
             * and objective.
             */
            fetchExplorations: function (searchQuery) {
                return $q(function (resolve, reject) {
                    _fetchExplorations(searchQuery, resolve, reject);
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/exploration/ExplorationDraftObjectFactory.ts":
/*!*************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/ExplorationDraftObjectFactory.ts ***!
  \*************************************************************************************/
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
 * @fileoverview Factory for creating instances of ExplorationDraft
 * domain objects.
 */
oppia.factory('ExplorationDraftObjectFactory', [
    function () {
        var ExplorationDraft = function (draftChanges, draftChangeListId) {
            this.draftChanges = draftChanges;
            this.draftChangeListId = draftChangeListId;
        };
        /**
         * Checks whether the draft object has been overwritten by another
         * draft which has been committed to the back-end. If the supplied draft id
         * has a different value then a newer changeList must have been committed
         * to the back-end.
         * @param {Integer} - currentDraftId. The id of the draft changes whch was
         *  retrieved from the back-end.
         * @returns {Boolean} - True iff the currentDraftId is the same as the
         * draftChangeListId corresponding to this draft.
         */
        ExplorationDraft.prototype.isValid = function (currentDraftId) {
            return (currentDraftId === this.draftChangeListId);
        };
        ExplorationDraft.prototype.getChanges = function () {
            return this.draftChanges;
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        ExplorationDraft['createFromLocalStorageDict'] = function (
        /* eslint-enable dot-notation */
        explorationDraftDict) {
            return new ExplorationDraft(explorationDraftDict.draftChanges, explorationDraftDict.draftChangeListId);
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        ExplorationDraft['toLocalStorageDict'] = function (
        /* eslint-enable dot-notation */
        changeList, draftChangeListId) {
            return {
                draftChanges: changeList,
                draftChangeListId: draftChangeListId
            };
        };
        return ExplorationDraft;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/summary/ExplorationSummaryBackendApiService.ts":
/*!***************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/summary/ExplorationSummaryBackendApiService.ts ***!
  \***************************************************************************************/
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
 * @fileoverview Service to retrieve information about exploration summaries
 * from the backend.
 */
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/ValidatorsService.ts */ "./core/templates/dev/head/services/ValidatorsService.ts");
oppia.factory('ExplorationSummaryBackendApiService', [
    '$http', '$q', 'AlertsService',
    'ValidatorsService', 'EXPLORATION_SUMMARY_DATA_URL_TEMPLATE',
    function ($http, $q, AlertsService, ValidatorsService, EXPLORATION_SUMMARY_DATA_URL_TEMPLATE) {
        var _fetchExpSummaries = function (explorationIds, includePrivateExplorations, successCallback, errorCallback) {
            if (!explorationIds.every(ValidatorsService.isValidExplorationId)) {
                AlertsService.addWarning('Please enter a valid exploration ID.');
                var returnValue = [];
                for (var i = 0; i < explorationIds.length; i++) {
                    returnValue.push(null);
                }
                return $q.resolve(returnValue);
            }
            var explorationSummaryDataUrl = EXPLORATION_SUMMARY_DATA_URL_TEMPLATE;
            $http.get(explorationSummaryDataUrl, {
                params: {
                    stringified_exp_ids: JSON.stringify(explorationIds),
                    include_private_explorations: JSON.stringify(includePrivateExplorations)
                }
            }).then(function (response) {
                var summaries = angular.copy(response.data.summaries);
                if (successCallback) {
                    successCallback(summaries);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        return {
            /**
             * Fetches a list of public exploration summaries and private
             * exploration summaries for which the current user has access from the
             * backend for each exploration ID provided. The provided list of
             * exploration summaries are in the same order as input exploration IDs
             * list, though some may be missing (if the exploration doesn't exist or
             * or the user does not have access to it).
             */
            loadPublicAndPrivateExplorationSummaries: function (explorationIds) {
                return $q(function (resolve, reject) {
                    _fetchExpSummaries(explorationIds, true, resolve, reject);
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection_editor/CollectionEditor.ts":
/*!*****************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection_editor/CollectionEditor.ts ***!
  \*****************************************************************************/
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
 * @fileoverview Primary controller for the collection editor page.
 */
__webpack_require__(/*! pages/collection_editor/CollectionEditorNavbarBreadcrumbDirective.ts */ "./core/templates/dev/head/pages/collection_editor/CollectionEditorNavbarBreadcrumbDirective.ts");
__webpack_require__(/*! pages/collection_editor/CollectionEditorNavbarDirective.ts */ "./core/templates/dev/head/pages/collection_editor/CollectionEditorNavbarDirective.ts");
__webpack_require__(/*! pages/collection_editor/editor_tab/CollectionEditorTabDirective.ts */ "./core/templates/dev/head/pages/collection_editor/editor_tab/CollectionEditorTabDirective.ts");
__webpack_require__(/*! pages/collection_editor/history_tab/CollectionHistoryTabDirective.ts */ "./core/templates/dev/head/pages/collection_editor/history_tab/CollectionHistoryTabDirective.ts");
__webpack_require__(/*! pages/collection_editor/settings_tab/CollectionSettingsTabDirective.ts */ "./core/templates/dev/head/pages/collection_editor/settings_tab/CollectionSettingsTabDirective.ts");
__webpack_require__(/*! pages/collection_editor/statistics_tab/CollectionStatisticsTabDirective.ts */ "./core/templates/dev/head/pages/collection_editor/statistics_tab/CollectionStatisticsTabDirective.ts");
// TODO(bhenning): These constants should be provided by the backend.
oppia.constant('COLLECTION_DATA_URL_TEMPLATE', '/collection_handler/data/<collection_id>');
oppia.constant('EDITABLE_COLLECTION_DATA_URL_TEMPLATE', '/collection_editor_handler/data/<collection_id>');
oppia.constant('COLLECTION_RIGHTS_URL_TEMPLATE', '/collection_editor_handler/rights/<collection_id>');
oppia.constant('COLLECTION_TITLE_INPUT_FOCUS_LABEL', 'collectionTitleInputFocusLabel');
oppia.constant('SEARCH_EXPLORATION_URL_TEMPLATE', '/exploration/metadata_search?q=<query>');
oppia.constant('INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);
oppia.controller('CollectionEditor', [
    'CollectionEditorStateService',
    function (CollectionEditorStateService) {
        // Load the collection to be edited.
        CollectionEditorStateService.loadCollection(GLOBALS.collectionId);
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection_editor/CollectionEditorNavbarBreadcrumbDirective.ts":
/*!******************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection_editor/CollectionEditorNavbarBreadcrumbDirective.ts ***!
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
 * @fileoverview Controller for the navbar breadcrumb of the collection editor.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/collection_editor/CollectionEditorStateService.ts */ "./core/templates/dev/head/pages/collection_editor/CollectionEditorStateService.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-page-services/router.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/router.service.ts");
__webpack_require__(/*! services/stateful/FocusManagerService.ts */ "./core/templates/dev/head/services/stateful/FocusManagerService.ts");
// TODO(bhenning): After the navbar is moved to a directive, this directive
// should be updated to say 'Loading...' if the collection editor's controller
// is not yet finished loading the collection. Also, this directive should
// support both displaying the current title of the collection (or untitled if
// it does not yet have one) or setting a new title in the case of an untitled
// collection.
oppia.directive('collectionEditorNavbarBreadcrumb', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection_editor/' +
                'collection_editor_navbar_breadcrumb_directive.html'),
            controller: [
                '$scope', 'RouterService', 'CollectionEditorStateService',
                'FocusManagerService', 'COLLECTION_TITLE_INPUT_FOCUS_LABEL',
                function ($scope, RouterService, CollectionEditorStateService, FocusManagerService, COLLECTION_TITLE_INPUT_FOCUS_LABEL) {
                    var _TAB_NAMES_TO_HUMAN_READABLE_NAMES = {
                        main: 'Edit',
                        preview: 'Preview',
                        settings: 'Settings',
                        stats: 'Statistics',
                        improvements: 'Improvements',
                        history: 'History',
                    };
                    $scope.collection = CollectionEditorStateService.getCollection();
                    $scope.getCurrentTabName = function () {
                        return _TAB_NAMES_TO_HUMAN_READABLE_NAMES[RouterService.getActiveTabName()];
                    };
                    $scope.editCollectionTitle = function () {
                        RouterService.navigateToSettingsTab();
                        FocusManagerService.setFocus(COLLECTION_TITLE_INPUT_FOCUS_LABEL);
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection_editor/CollectionEditorNavbarDirective.ts":
/*!********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection_editor/CollectionEditorNavbarDirective.ts ***!
  \********************************************************************************************/
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
__webpack_require__(/*! components/forms/forms-directives/select2-dropdown/select2-dropdown.directive.ts */ "./core/templates/dev/head/components/forms/forms-directives/select2-dropdown/select2-dropdown.directive.ts");
__webpack_require__(/*! components/common-layout-directives/loading-dots/loading-dots.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/loading-dots/loading-dots.directive.ts");
__webpack_require__(/*! domain/collection/CollectionRightsBackendApiService.ts */ "./core/templates/dev/head/domain/collection/CollectionRightsBackendApiService.ts");
__webpack_require__(/*! domain/collection/CollectionUpdateService.ts */ "./core/templates/dev/head/domain/collection/CollectionUpdateService.ts");
__webpack_require__(/*! domain/collection/CollectionValidationService.ts */ "./core/templates/dev/head/domain/collection/CollectionValidationService.ts");
__webpack_require__(/*! domain/collection/EditableCollectionBackendApiService.ts */ "./core/templates/dev/head/domain/collection/EditableCollectionBackendApiService.ts");
__webpack_require__(/*! domain/editor/undo_redo/UndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/collection_editor/CollectionEditorStateService.ts */ "./core/templates/dev/head/pages/collection_editor/CollectionEditorStateService.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-page-services/router.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/router.service.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
oppia.directive('collectionEditorNavbar', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection_editor/collection_editor_navbar_directive.html'),
            controller: [
                '$scope', '$uibModal', 'AlertsService', 'RouterService',
                'UndoRedoService', 'CollectionEditorStateService',
                'CollectionValidationService',
                'CollectionRightsBackendApiService',
                'EditableCollectionBackendApiService',
                'EVENT_COLLECTION_INITIALIZED', 'EVENT_COLLECTION_REINITIALIZED',
                'EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED',
                function ($scope, $uibModal, AlertsService, RouterService, UndoRedoService, CollectionEditorStateService, CollectionValidationService, CollectionRightsBackendApiService, EditableCollectionBackendApiService, EVENT_COLLECTION_INITIALIZED, EVENT_COLLECTION_REINITIALIZED, EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED) {
                    $scope.collectionId = GLOBALS.collectionId;
                    $scope.collection = CollectionEditorStateService.getCollection();
                    $scope.collectionRights = (CollectionEditorStateService.getCollectionRights());
                    $scope.isLoadingCollection = (CollectionEditorStateService.isLoadingCollection);
                    $scope.validationIssues = [];
                    $scope.isSaveInProgress = (CollectionEditorStateService.isSavingCollection);
                    $scope.getActiveTabName = RouterService.getActiveTabName;
                    $scope.selectMainTab = RouterService.navigateToMainTab;
                    $scope.selectPreviewTab = RouterService.navigateToPreviewTab;
                    $scope.selectSettingsTab = RouterService.navigateToSettingsTab;
                    $scope.selectStatsTab = RouterService.navigateToStatsTab;
                    $scope.selectHistoryTab = RouterService.navigateToHistoryTab;
                    var _validateCollection = function () {
                        if ($scope.collectionRights.isPrivate()) {
                            $scope.validationIssues = (CollectionValidationService
                                .findValidationIssuesForPrivateCollection($scope.collection));
                        }
                        else {
                            $scope.validationIssues = (CollectionValidationService
                                .findValidationIssuesForPublicCollection($scope.collection));
                        }
                    };
                    var _publishCollection = function () {
                        // TODO(bhenning): This also needs a confirmation of destructive
                        // action since it is not reversible.
                        CollectionRightsBackendApiService.setCollectionPublic($scope.collectionId, $scope.collection.getVersion()).then(function () {
                            $scope.collectionRights.setPublic();
                            CollectionEditorStateService.setCollectionRights($scope.collectionRights);
                        });
                    };
                    $scope.$on(EVENT_COLLECTION_INITIALIZED, _validateCollection);
                    $scope.$on(EVENT_COLLECTION_REINITIALIZED, _validateCollection);
                    $scope.$on(EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED, _validateCollection);
                    $scope.getWarningsCount = function () {
                        return $scope.validationIssues.length;
                    };
                    $scope.getChangeListCount = function () {
                        return UndoRedoService.getChangeCount();
                    };
                    $scope.isCollectionSaveable = function () {
                        return ($scope.getChangeListCount() > 0 &&
                            $scope.validationIssues.length === 0);
                    };
                    $scope.isCollectionPublishable = function () {
                        return ($scope.collectionRights.isPrivate() &&
                            $scope.getChangeListCount() === 0 &&
                            $scope.validationIssues.length === 0);
                    };
                    $scope.saveChanges = function () {
                        var isPrivate = $scope.collectionRights.isPrivate();
                        var modalInstance = $uibModal.open({
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection_editor/' +
                                'collection_editor_save_modal_directive.html'),
                            backdrop: true,
                            controller: [
                                '$scope', '$uibModalInstance',
                                function ($scope, $uibModalInstance) {
                                    $scope.isCollectionPrivate = isPrivate;
                                    $scope.save = function (commitMessage) {
                                        $uibModalInstance.close(commitMessage);
                                    };
                                    $scope.cancel = function () {
                                        $uibModalInstance.dismiss('cancel');
                                    };
                                }
                            ]
                        });
                        modalInstance.result.then(function (commitMessage) {
                            CollectionEditorStateService.saveCollection(commitMessage);
                        });
                    };
                    $scope.publishCollection = function () {
                        var additionalMetadataNeeded = (!$scope.collection.getTitle() ||
                            !$scope.collection.getObjective() ||
                            !$scope.collection.getCategory());
                        if (additionalMetadataNeeded) {
                            $uibModal.open({
                                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection_editor/' +
                                    'collection_editor_pre_publish_modal_directive.html'),
                                backdrop: true,
                                controller: [
                                    '$scope', '$uibModalInstance', 'CollectionEditorStateService',
                                    'CollectionUpdateService', 'ALL_CATEGORIES',
                                    function ($scope, $uibModalInstance, CollectionEditorStateService, CollectionUpdateService, ALL_CATEGORIES) {
                                        var collection = (CollectionEditorStateService.getCollection());
                                        $scope.requireTitleToBeSpecified = !collection.getTitle();
                                        $scope.requireObjectiveToBeSpecified = (!collection.getObjective());
                                        $scope.requireCategoryToBeSpecified = (!collection.getCategory());
                                        $scope.newTitle = collection.getTitle();
                                        $scope.newObjective = collection.getObjective();
                                        $scope.newCategory = collection.getCategory();
                                        $scope.CATEGORY_LIST_FOR_SELECT2 = [];
                                        for (var i = 0; i < ALL_CATEGORIES.length; i++) {
                                            $scope.CATEGORY_LIST_FOR_SELECT2.push({
                                                id: ALL_CATEGORIES[i],
                                                text: ALL_CATEGORIES[i]
                                            });
                                        }
                                        $scope.isSavingAllowed = function () {
                                            return Boolean($scope.newTitle && $scope.newObjective &&
                                                $scope.newCategory);
                                        };
                                        $scope.save = function () {
                                            if (!$scope.newTitle) {
                                                AlertsService.addWarning('Please specify a title');
                                                return;
                                            }
                                            if (!$scope.newObjective) {
                                                AlertsService.addWarning('Please specify an objective');
                                                return;
                                            }
                                            if (!$scope.newCategory) {
                                                AlertsService.addWarning('Please specify a category');
                                                return;
                                            }
                                            // Record any fields that have changed.
                                            var metadataList = [];
                                            if ($scope.newTitle !== collection.getTitle()) {
                                                metadataList.push('title');
                                                CollectionUpdateService.setCollectionTitle(collection, $scope.newTitle);
                                            }
                                            if ($scope.newObjective !== collection.getObjective()) {
                                                metadataList.push('objective');
                                                CollectionUpdateService.setCollectionObjective(collection, $scope.newObjective);
                                            }
                                            if ($scope.newCategory !== collection.getCategory()) {
                                                metadataList.push('category');
                                                CollectionUpdateService.setCollectionCategory(collection, $scope.newCategory);
                                            }
                                            $uibModalInstance.close(metadataList);
                                        };
                                        $scope.cancel = function () {
                                            $uibModalInstance.dismiss('cancel');
                                        };
                                    }
                                ]
                            }).result.then(function (metadataList) {
                                var commitMessage = ('Add metadata: ' + metadataList.join(', ') + '.');
                                CollectionEditorStateService.saveCollection(commitMessage, _publishCollection);
                            });
                        }
                        else {
                            _publishCollection();
                        }
                    };
                    // Unpublish the collection. Will only show up if the collection is
                    // public and the user has access to the collection.
                    $scope.unpublishCollection = function () {
                        CollectionRightsBackendApiService.setCollectionPrivate($scope.collectionId, $scope.collection.getVersion()).then(function () {
                            $scope.collectionRights.setPrivate();
                            CollectionEditorStateService.setCollectionRights($scope.collectionRights);
                        }, function () {
                            AlertsService.addWarning('There was an error when unpublishing the collection.');
                        });
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection_editor/CollectionEditorStateService.ts":
/*!*****************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection_editor/CollectionEditorStateService.ts ***!
  \*****************************************************************************************/
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
 * @fileoverview Service to maintain the state of a single collection shared
 * throughout the collection editor. This service provides functionality for
 * retrieving the collection, saving it, and listening for changes.
 */
__webpack_require__(/*! domain/collection/CollectionObjectFactory.ts */ "./core/templates/dev/head/domain/collection/CollectionObjectFactory.ts");
__webpack_require__(/*! domain/collection/CollectionRightsBackendApiService.ts */ "./core/templates/dev/head/domain/collection/CollectionRightsBackendApiService.ts");
__webpack_require__(/*! domain/collection/CollectionRightsObjectFactory.ts */ "./core/templates/dev/head/domain/collection/CollectionRightsObjectFactory.ts");
__webpack_require__(/*! domain/collection/EditableCollectionBackendApiService.ts */ "./core/templates/dev/head/domain/collection/EditableCollectionBackendApiService.ts");
__webpack_require__(/*! domain/editor/undo_redo/UndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
oppia.constant('EVENT_COLLECTION_INITIALIZED', 'collectionInitialized');
oppia.constant('EVENT_COLLECTION_REINITIALIZED', 'collectionReinitialized');
oppia.factory('CollectionEditorStateService', [
    '$rootScope', 'AlertsService', 'CollectionObjectFactory',
    'CollectionRightsBackendApiService', 'CollectionRightsObjectFactory',
    'EditableCollectionBackendApiService', 'UndoRedoService',
    'EVENT_COLLECTION_INITIALIZED', 'EVENT_COLLECTION_REINITIALIZED',
    function ($rootScope, AlertsService, CollectionObjectFactory, CollectionRightsBackendApiService, CollectionRightsObjectFactory, EditableCollectionBackendApiService, UndoRedoService, EVENT_COLLECTION_INITIALIZED, EVENT_COLLECTION_REINITIALIZED) {
        var _collection = CollectionObjectFactory.createEmptyCollection();
        var _collectionRights = (CollectionRightsObjectFactory.createEmptyCollectionRights());
        var _collectionIsInitialized = false;
        var _collectionIsLoading = false;
        var _collectionIsBeingSaved = false;
        var _setCollection = function (collection) {
            _collection.copyFromCollection(collection);
            if (_collectionIsInitialized) {
                $rootScope.$broadcast(EVENT_COLLECTION_REINITIALIZED);
            }
            else {
                $rootScope.$broadcast(EVENT_COLLECTION_INITIALIZED);
                _collectionIsInitialized = true;
            }
        };
        var _updateCollection = function (newBackendCollectionObject) {
            _setCollection(CollectionObjectFactory.create(newBackendCollectionObject));
        };
        var _setCollectionRights = function (collectionRights) {
            _collectionRights.copyFromCollectionRights(collectionRights);
        };
        var _updateCollectionRights = function (newBackendCollectionRightsObject) {
            _setCollectionRights(CollectionRightsObjectFactory.create(newBackendCollectionRightsObject));
        };
        return {
            /**
             * Loads, or reloads, the collection stored by this service given a
             * specified collection ID. See setCollection() for more information on
             * additional behavior of this function.
             */
            loadCollection: function (collectionId) {
                _collectionIsLoading = true;
                EditableCollectionBackendApiService.fetchCollection(collectionId).then(function (newBackendCollectionObject) {
                    _updateCollection(newBackendCollectionObject);
                }, function (error) {
                    AlertsService.addWarning(error || 'There was an error when loading the collection.');
                    _collectionIsLoading = false;
                });
                CollectionRightsBackendApiService.fetchCollectionRights(collectionId).then(function (newBackendCollectionRightsObject) {
                    _updateCollectionRights(newBackendCollectionRightsObject);
                    _collectionIsLoading = false;
                }, function (error) {
                    AlertsService.addWarning(error ||
                        'There was an error when loading the collection rights.');
                    _collectionIsLoading = false;
                });
            },
            /**
             * Returns whether this service is currently attempting to load the
             * collection maintained by this service.
             */
            isLoadingCollection: function () {
                return _collectionIsLoading;
            },
            /**
             * Returns whether a collection has yet been loaded using either
             * loadCollection() or setCollection().
             */
            hasLoadedCollection: function () {
                return _collectionIsInitialized;
            },
            /**
             * Returns the current collection to be shared among the collection
             * editor. Please note any changes to this collection will be propogated
             * to all bindings to it. This collection object will be retained for the
             * lifetime of the editor. This function never returns null, though it may
             * return an empty collection object if the collection has not yet been
             * loaded for this editor instance.
             */
            getCollection: function () {
                return _collection;
            },
            /**
             * Returns the current collection rights to be shared among the collection
             * editor. Please note any changes to this collection rights will be
             * propogated to all bindings to it. This collection rights object will
             * be retained for the lifetime of the editor. This function never returns
             * null, though it may return an empty collection rights object if the
             * collection rights has not yet been loaded for this editor instance.
             */
            getCollectionRights: function () {
                return _collectionRights;
            },
            /**
             * Sets the collection stored within this service, propogating changes to
             * all bindings to the collection returned by getCollection(). The first
             * time this is called it will fire a global event based on the
             * EVENT_COLLECTION_INITIALIZED constant. All subsequent
             * calls will similarly fire a EVENT_COLLECTION_REINITIALIZED event.
             */
            setCollection: function (collection) {
                _setCollection(collection);
            },
            /**
             * Sets the collection rights stored within this service, propogating
             * changes to all bindings to the collection returned by
             * getCollectionRights(). The first time this is called it will fire a
             * global event based on the EVENT_COLLECTION_INITIALIZED constant. All
             * subsequent calls will similarly fire a EVENT_COLLECTION_REINITIALIZED
             * event.
             */
            setCollectionRights: function (collectionRights) {
                _setCollectionRights(collectionRights);
            },
            /**
             * Attempts to save the current collection given a commit message. This
             * function cannot be called until after a collection has been initialized
             * in this service. Returns false if a save is not performed due to no
             * changes pending, or true if otherwise. This function, upon success,
             * will clear the UndoRedoService of pending changes. This function also
             * shares behavior with setCollection(), when it succeeds.
             */
            saveCollection: function (commitMessage, successCallback) {
                if (!_collectionIsInitialized) {
                    AlertsService.fatalWarning('Cannot save a collection before one is loaded.');
                }
                // Don't attempt to save the collection if there are no changes pending.
                if (!UndoRedoService.hasChanges()) {
                    return false;
                }
                _collectionIsBeingSaved = true;
                EditableCollectionBackendApiService.updateCollection(_collection.getId(), _collection.getVersion(), commitMessage, UndoRedoService.getCommittableChangeList()).then(function (collectionBackendObject) {
                    _updateCollection(collectionBackendObject);
                    UndoRedoService.clearChanges();
                    _collectionIsBeingSaved = false;
                    if (successCallback) {
                        successCallback();
                    }
                }, function (error) {
                    AlertsService.addWarning(error || 'There was an error when saving the collection.');
                    _collectionIsBeingSaved = false;
                });
                return true;
            },
            /**
             * Returns whether this service is currently attempting to save the
             * collection maintained by this service.
             */
            isSavingCollection: function () {
                return _collectionIsBeingSaved;
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection_editor/editor_tab/CollectionEditorTabDirective.ts":
/*!****************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection_editor/editor_tab/CollectionEditorTabDirective.ts ***!
  \****************************************************************************************************/
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
 * @fileoverview Controller for the main tab of the collection editor.
 */
__webpack_require__(/*! pages/collection_editor/editor_tab/CollectionNodeCreatorDirective.ts */ "./core/templates/dev/head/pages/collection_editor/editor_tab/CollectionNodeCreatorDirective.ts");
__webpack_require__(/*! pages/collection_editor/editor_tab/CollectionNodeEditorDirective.ts */ "./core/templates/dev/head/pages/collection_editor/editor_tab/CollectionNodeEditorDirective.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/collection_editor/CollectionEditorStateService.ts */ "./core/templates/dev/head/pages/collection_editor/CollectionEditorStateService.ts");
__webpack_require__(/*! pages/collection_editor/editor_tab/CollectionLinearizerService.ts */ "./core/templates/dev/head/pages/collection_editor/editor_tab/CollectionLinearizerService.ts");
oppia.directive('collectionEditorTab', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection_editor/editor_tab/' +
                'collection_editor_tab_directive.html'),
            controller: [
                '$scope', 'CollectionEditorStateService', 'CollectionLinearizerService',
                function ($scope, CollectionEditorStateService, CollectionLinearizerService) {
                    $scope.hasLoadedCollection = (CollectionEditorStateService.hasLoadedCollection);
                    $scope.collection = CollectionEditorStateService.getCollection();
                    // Returns a list of collection nodes which represents a valid linear
                    // path through the collection.
                    $scope.getLinearlySortedNodes = function () {
                        return (CollectionLinearizerService.getCollectionNodesInPlayableOrder($scope.collection));
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection_editor/editor_tab/CollectionLinearizerService.ts":
/*!***************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection_editor/editor_tab/CollectionLinearizerService.ts ***!
  \***************************************************************************************************/
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
 * @fileoverview Service to maintain the state of a single collection shared
 * throughout the collection editor. This service provides functionality for
 * retrieving the collection, saving it, and listening for changes.
 */
__webpack_require__(/*! domain/collection/CollectionUpdateService.ts */ "./core/templates/dev/head/domain/collection/CollectionUpdateService.ts");
oppia.factory('CollectionLinearizerService', [
    'CollectionUpdateService',
    function (CollectionUpdateService) {
        var _getNextExplorationId = function (collection, completedExpIds) {
            var explorationIds = collection.getExplorationIds();
            for (var i = 0; i < explorationIds.length; i++) {
                if (completedExpIds.indexOf(explorationIds[i]) === -1) {
                    return explorationIds[i];
                }
            }
            return null;
        };
        // Given a non linear collection input, the function will linearize it by
        // picking the first node it encounters on the branch and ignore the others.
        var _getCollectionNodesInPlayableOrder = function (collection) {
            return collection.getCollectionNodes();
        };
        var addAfter = function (collection, curExplorationId, newExplorationId) {
            var curCollectionNode = collection.getCollectionNodeByExplorationId(curExplorationId);
        };
        var findNodeIndex = function (linearNodeList, explorationId) {
            var index = -1;
            for (var i = 0; i < linearNodeList.length; i++) {
                if (linearNodeList[i].getExplorationId() === explorationId) {
                    index = i;
                    break;
                }
            }
            return index;
        };
        // Swap the node at the specified index with the node immediately to the
        // left of it.
        var swapLeft = function (collection, linearNodeList, nodeIndex) {
            var node = linearNodeList[nodeIndex];
            var leftNodeIndex = nodeIndex > 0 ? nodeIndex - 1 : null;
            if (leftNodeIndex === null) {
                return;
            }
            CollectionUpdateService.swapNodes(collection, leftNodeIndex, nodeIndex);
        };
        var swapRight = function (collection, linearNodeList, nodeIndex) {
            // Swapping right is the same as swapping the node one to the right
            // leftward.
            if (nodeIndex < linearNodeList.length - 1) {
                swapLeft(collection, linearNodeList, nodeIndex + 1);
            }
            // Otherwise it is a no-op (cannot swap the last node right).
        };
        var shiftNode = function (collection, explorationId, swapFunction) {
            // There is nothing to shift if the collection has only 1 node.
            if (collection.getCollectionNodeCount() > 1) {
                var linearNodeList = _getCollectionNodesInPlayableOrder(collection);
                var nodeIndex = findNodeIndex(linearNodeList, explorationId);
                if (nodeIndex === -1) {
                    return false;
                }
                swapFunction(collection, linearNodeList, nodeIndex);
            }
            return true;
        };
        return {
            /**
             * Given a collection and a list of completed exploration IDs within the
             * context of that collection, returns a list of which explorations in the
             * collection is immediately playable by the user. NOTE: This function
             * does not assume that the collection is linear.
             */
            getNextExplorationId: function (collection, completedExpIds) {
                return _getNextExplorationId(collection, completedExpIds);
            },
            /**
             * Given a collection, returns a linear list of collection nodes which
             * represents a valid path for playing through this collection.
             */
            getCollectionNodesInPlayableOrder: function (collection) {
                return _getCollectionNodesInPlayableOrder(collection);
            },
            /**
             * Inserts a new collection node at the end of the collection's playable
             * list of explorations, based on the specified exploration ID and
             * exploration summary backend object.
             */
            appendCollectionNode: function (collection, explorationId, summaryBackendObject) {
                var linearNodeList = _getCollectionNodesInPlayableOrder(collection);
                CollectionUpdateService.addCollectionNode(collection, explorationId, summaryBackendObject);
                if (linearNodeList.length > 0) {
                    var lastNode = linearNodeList[linearNodeList.length - 1];
                    addAfter(collection, lastNode.getExplorationId(), explorationId);
                }
            },
            /**
             * Remove a collection node from a given collection which maps to the
             * specified exploration ID. This function ensures the linear structure of
             * the collection is maintained. Returns whether the provided exploration
             * ID is contained within the linearly playable path of the specified
             * collection.
             */
            removeCollectionNode: function (collection, explorationId) {
                if (!collection.containsCollectionNode(explorationId)) {
                    return false;
                }
                // Delete the node
                CollectionUpdateService.deleteCollectionNode(collection, explorationId);
                return true;
            },
            /**
             * Looks up a collection node given an exploration ID in the specified
             * collection and attempts to shift it left in the linear ordering of the
             * collection. If the node is the first exploration played by the player,
             * then this function is a no-op. Returns false if the specified
             * exploration ID does not associate to any nodes in the collection.
             */
            shiftNodeLeft: function (collection, explorationId) {
                return shiftNode(collection, explorationId, swapLeft);
            },
            /**
             * Looks up a collection node given an exploration ID in the specified
             * collection and attempts to shift it right in the linear ordering of the
             * collection. If the node is the last exploration played by the player,
             * then this function is a no-op. Returns false if the specified
             * exploration ID does not associate to any nodes in the collection.
             */
            shiftNodeRight: function (collection, explorationId) {
                return shiftNode(collection, explorationId, swapRight);
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection_editor/editor_tab/CollectionNodeCreatorDirective.ts":
/*!******************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection_editor/editor_tab/CollectionNodeCreatorDirective.ts ***!
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
 * @fileoverview Directive for creating a new collection node.
 */
__webpack_require__(/*! domain/collection/CollectionNodeObjectFactory.ts */ "./core/templates/dev/head/domain/collection/CollectionNodeObjectFactory.ts");
__webpack_require__(/*! domain/collection/CollectionUpdateService.ts */ "./core/templates/dev/head/domain/collection/CollectionUpdateService.ts");
__webpack_require__(/*! domain/collection/SearchExplorationsBackendApiService.ts */ "./core/templates/dev/head/domain/collection/SearchExplorationsBackendApiService.ts");
__webpack_require__(/*! domain/summary/ExplorationSummaryBackendApiService.ts */ "./core/templates/dev/head/domain/summary/ExplorationSummaryBackendApiService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! filters/string-utility-filters/normalize-whitespace.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/normalize-whitespace.filter.ts");
__webpack_require__(/*! pages/collection_editor/CollectionEditorStateService.ts */ "./core/templates/dev/head/pages/collection_editor/CollectionEditorStateService.ts");
__webpack_require__(/*! pages/collection_editor/editor_tab/CollectionLinearizerService.ts */ "./core/templates/dev/head/pages/collection_editor/editor_tab/CollectionLinearizerService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/SiteAnalyticsService.ts */ "./core/templates/dev/head/services/SiteAnalyticsService.ts");
__webpack_require__(/*! services/ValidatorsService.ts */ "./core/templates/dev/head/services/ValidatorsService.ts");
oppia.directive('collectionNodeCreator', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection_editor/editor_tab/' +
                'collection_node_creator_directive.html'),
            controller: [
                '$scope', '$http', '$window', '$filter', 'AlertsService',
                'ValidatorsService', 'CollectionEditorStateService',
                'CollectionLinearizerService', 'CollectionUpdateService',
                'CollectionNodeObjectFactory', 'ExplorationSummaryBackendApiService',
                'SearchExplorationsBackendApiService', 'SiteAnalyticsService',
                'INVALID_NAME_CHARS',
                function ($scope, $http, $window, $filter, AlertsService, ValidatorsService, CollectionEditorStateService, CollectionLinearizerService, CollectionUpdateService, CollectionNodeObjectFactory, ExplorationSummaryBackendApiService, SearchExplorationsBackendApiService, SiteAnalyticsService, INVALID_NAME_CHARS) {
                    $scope.collection = CollectionEditorStateService.getCollection();
                    $scope.newExplorationId = '';
                    $scope.newExplorationTitle = '';
                    $scope.searchQueryHasError = false;
                    var CREATE_NEW_EXPLORATION_URL_TEMPLATE = '/create/<exploration_id>';
                    /**
                     * Fetches a list of exploration metadata dicts from backend, given
                     * a search query. It then extracts the title and id of the
                     * exploration to prepare typeahead options.
                     */
                    $scope.fetchTypeaheadResults = function (searchQuery) {
                        if (isValidSearchQuery(searchQuery)) {
                            $scope.searchQueryHasError = false;
                            return SearchExplorationsBackendApiService.fetchExplorations(searchQuery).then(function (explorationMetadataBackendDict) {
                                var options = [];
                                explorationMetadataBackendDict.collection_node_metadata_list.
                                    map(function (item) {
                                    if (!$scope.collection.containsCollectionNode(item.id)) {
                                        options.push(item.title + ' (' + item.id + ')');
                                    }
                                });
                                return options;
                            }, function () {
                                AlertsService.addWarning('There was an error when searching for matching ' +
                                    'explorations.');
                            });
                        }
                        else {
                            $scope.searchQueryHasError = true;
                        }
                    };
                    var isValidSearchQuery = function (searchQuery) {
                        // Allow underscores because they are allowed in exploration IDs.
                        var INVALID_SEARCH_CHARS = (INVALID_NAME_CHARS.filter(function (item) {
                            return item !== '_';
                        }));
                        for (var i = 0; i < INVALID_SEARCH_CHARS.length; i++) {
                            if (searchQuery.indexOf(INVALID_SEARCH_CHARS[i]) !== -1) {
                                return false;
                            }
                        }
                        return true;
                    };
                    var addExplorationToCollection = function (newExplorationId) {
                        if (!newExplorationId) {
                            AlertsService.addWarning('Cannot add an empty exploration ID.');
                            return;
                        }
                        if ($scope.collection.containsCollectionNode(newExplorationId)) {
                            AlertsService.addWarning('There is already an exploration in this collection ' +
                                'with that id.');
                            return;
                        }
                        ExplorationSummaryBackendApiService
                            .loadPublicAndPrivateExplorationSummaries([newExplorationId])
                            .then(function (summaries) {
                            var summaryBackendObject = null;
                            if (summaries.length !== 0 &&
                                summaries[0].id === newExplorationId) {
                                summaryBackendObject = summaries[0];
                            }
                            if (summaryBackendObject) {
                                CollectionLinearizerService.appendCollectionNode($scope.collection, newExplorationId, summaryBackendObject);
                            }
                            else {
                                AlertsService.addWarning('That exploration does not exist or you do not have edit ' +
                                    'access to it.');
                            }
                        }, function () {
                            AlertsService.addWarning('There was an error while adding an exploration to the ' +
                                'collection.');
                        });
                    };
                    var convertTypeaheadToExplorationId = function (typeaheadOption) {
                        var matchResults = typeaheadOption.match(/\((.*?)\)$/);
                        if (matchResults === null) {
                            return typeaheadOption;
                        }
                        return matchResults[1];
                    };
                    // Creates a new exploration, then adds it to the collection.
                    $scope.createNewExploration = function () {
                        var title = $filter('normalizeWhitespace')($scope.newExplorationTitle);
                        if (!ValidatorsService.isValidExplorationTitle(title, true)) {
                            return;
                        }
                        // Create a new exploration with the given title.
                        $http.post('/contributehandler/create_new', {
                            title: title
                        }).then(function (response) {
                            $scope.newExplorationTitle = '';
                            var newExplorationId = response.data.explorationId;
                            SiteAnalyticsService
                                .registerCreateNewExplorationInCollectionEvent(newExplorationId);
                            addExplorationToCollection(newExplorationId);
                        });
                    };
                    // Checks whether the user has left a '#' at the end of their ID
                    // by accident (which can happen if it's being copy/pasted from the
                    // editor page.
                    $scope.isMalformedId = function (typedExplorationId) {
                        return (typedExplorationId &&
                            typedExplorationId.lastIndexOf('#') ===
                                typedExplorationId.length - 1);
                    };
                    $scope.addExploration = function () {
                        addExplorationToCollection(convertTypeaheadToExplorationId($scope.newExplorationId));
                        $scope.newExplorationId = '';
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection_editor/editor_tab/CollectionNodeEditorDirective.ts":
/*!*****************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection_editor/editor_tab/CollectionNodeEditorDirective.ts ***!
  \*****************************************************************************************************/
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
 * @fileoverview Directive for displaying and editing a collection node. This
 * directive allows creators to shift nodes to left or right
 * and also delete the collection node represented by this directive.
 */
__webpack_require__(/*! domain/collection/CollectionUpdateService.ts */ "./core/templates/dev/head/domain/collection/CollectionUpdateService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/collection_editor/CollectionEditorStateService.ts */ "./core/templates/dev/head/pages/collection_editor/CollectionEditorStateService.ts");
__webpack_require__(/*! pages/collection_editor/editor_tab/CollectionLinearizerService.ts */ "./core/templates/dev/head/pages/collection_editor/editor_tab/CollectionLinearizerService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
oppia.directive('collectionNodeEditor', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {
                getCollectionNode: '&collectionNode',
                getLinearIndex: '&linearIndex'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection_editor/editor_tab/' +
                'collection_node_editor_directive.html'),
            controller: [
                '$scope', 'CollectionEditorStateService', 'CollectionLinearizerService',
                'CollectionUpdateService', 'AlertsService',
                function ($scope, CollectionEditorStateService, CollectionLinearizerService, CollectionUpdateService, AlertsService) {
                    $scope.collection = CollectionEditorStateService.getCollection();
                    // Deletes this collection node from the frontend collection
                    // object and also updates the changelist.
                    $scope.deleteNode = function () {
                        var explorationId = $scope.getCollectionNode().getExplorationId();
                        if (!CollectionLinearizerService.removeCollectionNode($scope.collection, explorationId)) {
                            AlertsService.fatalWarning('Internal collection editor error. Could not delete ' +
                                'exploration by ID: ' + explorationId);
                        }
                    };
                    // Shifts this collection node left in the linearized list of the
                    // collection, if possible.
                    $scope.shiftNodeLeft = function () {
                        var explorationId = $scope.getCollectionNode().getExplorationId();
                        if (!CollectionLinearizerService.shiftNodeLeft($scope.collection, explorationId)) {
                            AlertsService.fatalWarning('Internal collection editor error. Could not shift node left ' +
                                'with ID: ' + explorationId);
                        }
                    };
                    // Shifts this collection node right in the linearized list of the
                    // collection, if possible.
                    $scope.shiftNodeRight = function () {
                        var explorationId = $scope.getCollectionNode().getExplorationId();
                        if (!CollectionLinearizerService.shiftNodeRight($scope.collection, explorationId)) {
                            AlertsService.fatalWarning('Internal collection editor error. Could not shift node ' +
                                'right with ID: ' + explorationId);
                        }
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection_editor/history_tab/CollectionHistoryTabDirective.ts":
/*!******************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection_editor/history_tab/CollectionHistoryTabDirective.ts ***!
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
 * @fileoverview Controller for the history tab of the collection editor.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
oppia.directive('collectionHistoryTab', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection_editor/history_tab/' +
                'collection_history_tab_directive.html'),
            controller: [function () { }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection_editor/settings_tab/CollectionDetailsEditorDirective.ts":
/*!**********************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection_editor/settings_tab/CollectionDetailsEditorDirective.ts ***!
  \**********************************************************************************************************/
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
 * @fileoverview Directive for displaying and editing a collection details.
 * Edit options include: changing the title, objective, and category, and also
 * adding a new exploration.
 */
__webpack_require__(/*! components/forms/forms-directives/select2-dropdown/select2-dropdown.directive.ts */ "./core/templates/dev/head/components/forms/forms-directives/select2-dropdown/select2-dropdown.directive.ts");
__webpack_require__(/*! domain/collection/CollectionUpdateService.ts */ "./core/templates/dev/head/domain/collection/CollectionUpdateService.ts");
__webpack_require__(/*! domain/collection/CollectionValidationService.ts */ "./core/templates/dev/head/domain/collection/CollectionValidationService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/collection_editor/CollectionEditor.ts */ "./core/templates/dev/head/pages/collection_editor/CollectionEditor.ts");
__webpack_require__(/*! pages/collection_editor/CollectionEditorStateService.ts */ "./core/templates/dev/head/pages/collection_editor/CollectionEditorStateService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
oppia.directive('collectionDetailsEditor', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection_editor/settings_tab/' +
                'collection_details_editor_directive.html'),
            controller: [
                '$scope', 'CollectionEditorStateService', 'CollectionUpdateService',
                'CollectionValidationService', 'AlertsService', 'ALL_CATEGORIES',
                'EVENT_COLLECTION_INITIALIZED', 'EVENT_COLLECTION_REINITIALIZED',
                'COLLECTION_TITLE_INPUT_FOCUS_LABEL',
                function ($scope, CollectionEditorStateService, CollectionUpdateService, CollectionValidationService, AlertsService, ALL_CATEGORIES, EVENT_COLLECTION_INITIALIZED, EVENT_COLLECTION_REINITIALIZED, COLLECTION_TITLE_INPUT_FOCUS_LABEL) {
                    $scope.collection = CollectionEditorStateService.getCollection();
                    $scope.COLLECTION_TITLE_INPUT_FOCUS_LABEL = (COLLECTION_TITLE_INPUT_FOCUS_LABEL);
                    $scope.hasPageLoaded = (CollectionEditorStateService.hasLoadedCollection);
                    $scope.CATEGORY_LIST_FOR_SELECT2 = ALL_CATEGORIES.map(function (category) {
                        return {
                            id: category,
                            text: category
                        };
                    });
                    $scope.languageListForSelect = constants.ALL_LANGUAGE_CODES;
                    $scope.TAG_REGEX = GLOBALS.TAG_REGEX;
                    var refreshSettingsTab = function () {
                        $scope.displayedCollectionTitle = $scope.collection.getTitle();
                        $scope.displayedCollectionObjective = ($scope.collection.getObjective());
                        $scope.displayedCollectionCategory = ($scope.collection.getCategory());
                        $scope.displayedCollectionLanguage = ($scope.collection.getLanguageCode());
                        $scope.displayedCollectionTags = ($scope.collection.getTags());
                        var categoryIsInSelect2 = $scope.CATEGORY_LIST_FOR_SELECT2.some(function (categoryItem) {
                            return categoryItem.id === $scope.collection.getCategory();
                        });
                        // If the current category is not in the dropdown, add it
                        // as the first option.
                        if (!categoryIsInSelect2 && $scope.collection.getCategory()) {
                            $scope.CATEGORY_LIST_FOR_SELECT2.unshift({
                                id: $scope.collection.getCategory(),
                                text: $scope.collection.getCategory()
                            });
                        }
                    };
                    $scope.$on(EVENT_COLLECTION_INITIALIZED, refreshSettingsTab);
                    $scope.$on(EVENT_COLLECTION_REINITIALIZED, refreshSettingsTab);
                    $scope.updateCollectionTitle = function () {
                        CollectionUpdateService.setCollectionTitle($scope.collection, $scope.displayedCollectionTitle);
                    };
                    $scope.updateCollectionObjective = function () {
                        CollectionUpdateService.setCollectionObjective($scope.collection, $scope.displayedCollectionObjective);
                    };
                    $scope.updateCollectionCategory = function () {
                        CollectionUpdateService.setCollectionCategory($scope.collection, $scope.displayedCollectionCategory);
                    };
                    $scope.updateCollectionLanguageCode = function () {
                        CollectionUpdateService.setCollectionLanguageCode($scope.collection, $scope.displayedCollectionLanguage);
                    };
                    // Normalize the tags for the collection
                    var normalizeTags = function (tags) {
                        for (var i = 0; i < tags.length; i++) {
                            tags[i] = tags[i].trim().replace(/\s+/g, ' ');
                        }
                        return tags;
                    };
                    $scope.updateCollectionTags = function () {
                        $scope.displayedCollectionTags = normalizeTags($scope.displayedCollectionTags);
                        if (!CollectionValidationService.isTagValid($scope.displayedCollectionTags)) {
                            AlertsService.addWarning('Please ensure that there are no duplicate tags and that all ' +
                                'tags contain only lower case and spaces.');
                            return;
                        }
                        CollectionUpdateService.setCollectionTags($scope.collection, $scope.displayedCollectionTags);
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection_editor/settings_tab/CollectionPermissionsCardDirective.ts":
/*!************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection_editor/settings_tab/CollectionPermissionsCardDirective.ts ***!
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
 * @fileoverview Directive for displaying the collection's owner name and
 * permissions.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/collection_editor/CollectionEditorStateService.ts */ "./core/templates/dev/head/pages/collection_editor/CollectionEditorStateService.ts");
oppia.directive('collectionPermissionsCard', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection_editor/settings_tab/' +
                'collection_permissions_card_directive.html'),
            controller: [
                '$scope', 'CollectionEditorStateService',
                function ($scope, CollectionEditorStateService) {
                    $scope.collectionRights =
                        CollectionEditorStateService.getCollectionRights();
                    $scope.hasPageLoaded =
                        CollectionEditorStateService.hasLoadedCollection;
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection_editor/settings_tab/CollectionSettingsTabDirective.ts":
/*!********************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection_editor/settings_tab/CollectionSettingsTabDirective.ts ***!
  \********************************************************************************************************/
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
 * @fileoverview Controller for the settings tab of the collection editor.
 */
__webpack_require__(/*! pages/collection_editor/settings_tab/CollectionDetailsEditorDirective.ts */ "./core/templates/dev/head/pages/collection_editor/settings_tab/CollectionDetailsEditorDirective.ts");
__webpack_require__(/*! pages/collection_editor/settings_tab/CollectionPermissionsCardDirective.ts */ "./core/templates/dev/head/pages/collection_editor/settings_tab/CollectionPermissionsCardDirective.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
oppia.directive('collectionSettingsTab', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection_editor/settings_tab/' +
                'collection_settings_tab_directive.html'),
            controller: [function () { }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection_editor/statistics_tab/CollectionStatisticsTabDirective.ts":
/*!************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection_editor/statistics_tab/CollectionStatisticsTabDirective.ts ***!
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
 * @fileoverview Controller for the statistics tab of the collection editor.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
oppia.directive('collectionStatisticsTab', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection_editor/statistics_tab/' +
                'collection_statistics_tab_directive.html'),
            controller: [function () { }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/angular-name/angular-name.service.ts":
/*!*************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/angular-name/angular-name.service.ts ***!
  \*************************************************************************************************************************************/
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
 * @fileoverview A service that maps IDs to Angular names.
 */
angular.module('explorationEditorPageModule').factory('AngularNameService', [function () {
        var angularName = null;
        return {
            getNameOfInteractionRulesService: function (interactionId) {
                angularName = interactionId.charAt(0) +
                    interactionId.slice(1) + 'RulesService';
                return angularName;
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/autosave-info-modals.service.ts":
/*!********************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/autosave-info-modals.service.ts ***!
  \********************************************************************************************************************************/
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
 * @fileoverview Service for displaying different types of modals depending
 * on the type of response received as a result of the autosaving request.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-page-services/changes-in-human-readable-form.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/changes-in-human-readable-form.service.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-page-services/exploration-data/exploration-data.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/exploration-data/exploration-data.service.ts");
__webpack_require__(/*! services/LocalStorageService.ts */ "./core/templates/dev/head/services/LocalStorageService.ts");
angular.module('explorationEditorPageModule').factory('AutosaveInfoModalsService', [
    '$log', '$timeout', '$uibModal', '$window',
    'ChangesInHumanReadableFormService', 'ExplorationDataService',
    'LocalStorageService', 'UrlInterpolationService',
    function ($log, $timeout, $uibModal, $window, ChangesInHumanReadableFormService, ExplorationDataService, LocalStorageService, UrlInterpolationService) {
        var _isModalOpen = false;
        var _refreshPage = function (delay) {
            $timeout(function () {
                $window.location.reload();
            }, delay);
        };
        return {
            showNonStrictValidationFailModal: function () {
                $uibModal.open({
                    templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/exploration-editor-page/' +
                        'exploration-editor-page-templates/' +
                        'save-validation-fail-modal.template.html'),
                    // Prevent modal from closing when the user clicks outside it.
                    backdrop: 'static',
                    controller: [
                        '$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.closeAndRefresh = function () {
                                $uibModalInstance.dismiss('cancel');
                                _refreshPage(20);
                            };
                        }
                    ]
                }).result.then(function () {
                    _isModalOpen = false;
                }, function () {
                    _isModalOpen = false;
                });
                _isModalOpen = true;
            },
            isModalOpen: function () {
                return _isModalOpen;
            },
            showVersionMismatchModal: function (lostChanges) {
                $uibModal.open({
                    templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/exploration-editor-page/' +
                        'exploration-editor-page-templates/' +
                        'save-version-mismatch-modal.template.html'),
                    // Prevent modal from closing when the user clicks outside it.
                    backdrop: 'static',
                    controller: ['$scope', function ($scope) {
                            // When the user clicks on discard changes button, signal backend
                            // to discard the draft and reload the page thereafter.
                            $scope.discardChanges = function () {
                                ExplorationDataService.discardDraft(function () {
                                    _refreshPage(20);
                                });
                            };
                            $scope.hasLostChanges = (lostChanges && lostChanges.length > 0);
                            if ($scope.hasLostChanges) {
                                // TODO(sll): This should also include changes to exploration
                                // properties (such as the exploration title, category, etc.).
                                $scope.lostChangesHtml = (ChangesInHumanReadableFormService.makeHumanReadable(lostChanges).html());
                                $log.error('Lost changes: ' + JSON.stringify(lostChanges));
                            }
                        }],
                    windowClass: 'oppia-autosave-version-mismatch-modal'
                }).result.then(function () {
                    _isModalOpen = false;
                }, function () {
                    _isModalOpen = false;
                });
                _isModalOpen = true;
            },
            showLostChangesModal: function (lostChanges, explorationId) {
                $uibModal.open({
                    templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/exploration-editor-page/' +
                        'exploration-editor-page-templates/' +
                        'lost-changes-modal.template.html'),
                    // Prevent modal from closing when the user clicks outside it.
                    backdrop: 'static',
                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            // When the user clicks on discard changes button, signal backend
                            // to discard the draft and reload the page thereafter.
                            $scope.close = function () {
                                LocalStorageService.removeExplorationDraft(explorationId);
                                $uibModalInstance.dismiss('cancel');
                            };
                            $scope.lostChangesHtml = (ChangesInHumanReadableFormService.makeHumanReadable(lostChanges).html());
                            $log.error('Lost changes: ' + JSON.stringify(lostChanges));
                        }],
                    windowClass: 'oppia-lost-changes-modal'
                }).result.then(function () {
                    _isModalOpen = false;
                }, function () {
                    _isModalOpen = false;
                });
                _isModalOpen = true;
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/change-list.service.ts":
/*!***********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/change-list.service.ts ***!
  \***********************************************************************************************************************/
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
 * @fileoverview A service that maintains a provisional list of changes to be
 * committed to the server.
 */
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-page-services/autosave-info-modals.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/autosave-info-modals.service.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-page-services/exploration-data/exploration-data.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/exploration-data/exploration-data.service.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('explorationEditorPageModule').factory('ChangeListService', [
    '$log', '$rootScope', 'AlertsService', 'AutosaveInfoModalsService',
    'ExplorationDataService',
    function ($log, $rootScope, AlertsService, AutosaveInfoModalsService, ExplorationDataService) {
        // TODO(sll): Implement undo, redo functionality. Show a message on each
        // step saying what the step is doing.
        // TODO(sll): Allow the user to view the list of changes made so far, as
        // well as the list of changes in the undo stack.
        // Temporary buffer for changes made to the exploration.
        var explorationChangeList = [];
        // Stack for storing undone changes. The last element is the most recently
        // undone change.
        var undoneChangeStack = [];
        // All these constants should correspond to those in exp_domain.py.
        // TODO(sll): Enforce this in code.
        var CMD_ADD_STATE = 'add_state';
        var CMD_RENAME_STATE = 'rename_state';
        var CMD_DELETE_STATE = 'delete_state';
        var CMD_EDIT_STATE_PROPERTY = 'edit_state_property';
        var CMD_EDIT_EXPLORATION_PROPERTY = 'edit_exploration_property';
        var ALLOWED_EXPLORATION_BACKEND_NAMES = {
            category: true,
            init_state_name: true,
            language_code: true,
            objective: true,
            param_changes: true,
            param_specs: true,
            tags: true,
            title: true,
            auto_tts_enabled: true,
            correctness_feedback_enabled: true
        };
        var ALLOWED_STATE_BACKEND_NAMES = {
            answer_groups: true,
            confirmed_unclassified_answers: true,
            content: true,
            recorded_voiceovers: true,
            default_outcome: true,
            hints: true,
            param_changes: true,
            param_specs: true,
            solution: true,
            state_name: true,
            widget_customization_args: true,
            widget_id: true,
            written_translations: true
        };
        var autosaveChangeListOnChange = function (explorationChangeList) {
            // Asynchronously send an autosave request, and check for errors in the
            // response:
            // If error is present -> Check for the type of error occurred
            // (Display the corresponding modals in both cases, if not already
            // opened):
            // - Version Mismatch.
            // - Non-strict Validation Fail.
            ExplorationDataService.autosaveChangeList(explorationChangeList, function (response) {
                if (!response.data.is_version_of_draft_valid) {
                    if (!AutosaveInfoModalsService.isModalOpen()) {
                        AutosaveInfoModalsService.showVersionMismatchModal(explorationChangeList);
                    }
                }
            }, function () {
                AlertsService.clearWarnings();
                $log.error('nonStrictValidationFailure: ' +
                    JSON.stringify(explorationChangeList));
                if (!AutosaveInfoModalsService.isModalOpen()) {
                    AutosaveInfoModalsService.showNonStrictValidationFailModal();
                }
            });
        };
        var addChange = function (changeDict) {
            if ($rootScope.loadingMessage) {
                return;
            }
            explorationChangeList.push(changeDict);
            undoneChangeStack = [];
            autosaveChangeListOnChange(explorationChangeList);
        };
        return {
            /**
             * Saves a change dict that represents adding a new state. It is the
             * responsbility of the caller to check that the new state name is valid.
             *
             * @param {string} stateName - The name of the newly-added state
             */
            addState: function (stateName) {
                addChange({
                    cmd: CMD_ADD_STATE,
                    state_name: stateName
                });
            },
            /**
             * Saves a change dict that represents deleting a new state. It is the
             * responsbility of the caller to check that the deleted state name
             * corresponds to an existing state.
             *
             * @param {string} stateName - The name of the deleted state.
             */
            deleteState: function (stateName) {
                addChange({
                    cmd: CMD_DELETE_STATE,
                    state_name: stateName
                });
            },
            discardAllChanges: function () {
                explorationChangeList = [];
                undoneChangeStack = [];
                ExplorationDataService.discardDraft();
            },
            /**
             * Saves a change dict that represents a change to an exploration
             * property (such as its title, category, ...). It is the responsibility
             * of the caller to check that the old and new values are not equal.
             *
             * @param {string} backendName - The backend name of the property
             *   (e.g. title, category)
             * @param {string} newValue - The new value of the property
             * @param {string} oldValue - The previous value of the property
             */
            editExplorationProperty: function (backendName, newValue, oldValue) {
                if (!ALLOWED_EXPLORATION_BACKEND_NAMES.hasOwnProperty(backendName)) {
                    AlertsService.addWarning('Invalid exploration property: ' + backendName);
                    return;
                }
                addChange({
                    cmd: CMD_EDIT_EXPLORATION_PROPERTY,
                    new_value: angular.copy(newValue),
                    old_value: angular.copy(oldValue),
                    property_name: backendName
                });
            },
            /**
             * Saves a change dict that represents a change to a state property. It
             * is the responsibility of the caller to check that the old and new
             * values are not equal.
             *
             * @param {string} stateName - The name of the state that is being edited
             * @param {string} backendName - The backend name of the edited property
             * @param {string} newValue - The new value of the property
             * @param {string} oldValue - The previous value of the property
             */
            editStateProperty: function (stateName, backendName, newValue, oldValue) {
                if (!ALLOWED_STATE_BACKEND_NAMES.hasOwnProperty(backendName)) {
                    AlertsService.addWarning('Invalid state property: ' + backendName);
                    return;
                }
                addChange({
                    cmd: CMD_EDIT_STATE_PROPERTY,
                    new_value: angular.copy(newValue),
                    old_value: angular.copy(oldValue),
                    property_name: backendName,
                    state_name: stateName
                });
            },
            getChangeList: function () {
                return angular.copy(explorationChangeList);
            },
            isExplorationLockedForEditing: function () {
                return explorationChangeList.length > 0;
            },
            /**
             * Initializes the current changeList with the one received from backend.
             * This behavior exists only in case of an autosave.
             *
             * @param {object} changeList - Autosaved changeList data
             */
            loadAutosavedChangeList: function (changeList) {
                explorationChangeList = changeList;
            },
            /**
             * Saves a change dict that represents the renaming of a state. This
             * is also intended to change the initial state name if necessary
             * (that is, the latter change is implied and does not have to be
             * recorded separately in another change dict). It is the responsibility
             * of the caller to check that the two names are not equal.
             *
             * @param {string} newStateName - The new name of the state
             * @param {string} oldStateName - The previous name of the state
             */
            renameState: function (newStateName, oldStateName) {
                addChange({
                    cmd: CMD_RENAME_STATE,
                    new_state_name: newStateName,
                    old_state_name: oldStateName
                });
            },
            undoLastChange: function () {
                if (explorationChangeList.length === 0) {
                    AlertsService.addWarning('There are no changes to undo.');
                    return;
                }
                var lastChange = explorationChangeList.pop();
                undoneChangeStack.push(lastChange);
                autosaveChangeListOnChange(explorationChangeList);
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/changes-in-human-readable-form.service.ts":
/*!******************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/changes-in-human-readable-form.service.ts ***!
  \******************************************************************************************************************************************/
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
 * @fileoverview Service to get changes in human readable form.
 */
__webpack_require__(/*! services/UtilsService.ts */ "./core/templates/dev/head/services/UtilsService.ts");
angular.module('explorationEditorPageModule').factory('ChangesInHumanReadableFormService', [
    'UtilsService', function (UtilsService) {
        var CMD_ADD_STATE = 'add_state';
        var CMD_RENAME_STATE = 'rename_state';
        var CMD_DELETE_STATE = 'delete_state';
        var CMD_EDIT_STATE_PROPERTY = 'edit_state_property';
        var makeRulesListHumanReadable = function (answerGroupValue) {
            var rulesList = [];
            answerGroupValue.rules.forEach(function (rule) {
                var ruleElm = angular.element('<li></li>');
                ruleElm.html('<p>Type: ' + rule.type + '</p>');
                ruleElm.append('<p>Value: ' + (Object.keys(rule.inputs).map(function (input) {
                    return rule.inputs[input];
                })).toString() + '</p>');
                rulesList.push(ruleElm);
            });
            return rulesList;
        };
        // An edit is represented either as an object or an array. If it's an
        // object, then simply return that object. In case of an array, return
        // the last item.
        var getStatePropertyValue = function (statePropertyValue) {
            return angular.isArray(statePropertyValue) ?
                statePropertyValue[statePropertyValue.length - 1] : statePropertyValue;
        };
        // Detects whether an object of the type 'answer_group' or
        // 'default_outcome' has been added, edited or deleted.
        // Returns - 'addded', 'edited' or 'deleted' accordingly.
        var getRelativeChangeToGroups = function (changeObject) {
            var newValue = changeObject.new_value;
            var oldValue = changeObject.old_value;
            var result = '';
            if (angular.isArray(newValue) && angular.isArray(oldValue)) {
                result = (newValue.length > oldValue.length) ?
                    'added' : (newValue.length === oldValue.length) ?
                    'edited' : 'deleted';
            }
            else {
                if (!UtilsService.isEmpty(oldValue)) {
                    if (!UtilsService.isEmpty(newValue)) {
                        result = 'edited';
                    }
                    else {
                        result = 'deleted';
                    }
                }
                else if (!UtilsService.isEmpty(newValue)) {
                    result = 'added';
                }
            }
            return result;
        };
        var makeHumanReadable = function (lostChanges) {
            var outerHtml = angular.element('<ul></ul>');
            var stateWiseEditsMapping = {};
            // The variable stateWiseEditsMapping stores the edits grouped by state.
            // For instance, you made the following edits:
            // 1. Changed content to 'Welcome!' instead of '' in 'Introduction'.
            // 2. Added an interaction in this state.
            // 2. Added a new state 'End'.
            // 3. Ended Exporation from state 'End'.
            // stateWiseEditsMapping will look something like this:
            // - 'Introduction': [
            //   - 'Edited Content: Welcome!',:
            //   - 'Added Interaction: Continue',
            //   - 'Added interaction customizations']
            // - 'End': ['Ended exploration']
            lostChanges.forEach(function (lostChange) {
                switch (lostChange.cmd) {
                    case CMD_ADD_STATE:
                        outerHtml.append(angular.element('<li></li>').html('Added state: ' + lostChange.state_name));
                        break;
                    case CMD_RENAME_STATE:
                        outerHtml.append(angular.element('<li></li>').html('Renamed state: ' + lostChange.old_state_name + ' to ' +
                            lostChange.new_state_name));
                        break;
                    case CMD_DELETE_STATE:
                        outerHtml.append(angular.element('<li></li>').html('Deleted state: ' + lostChange.state_name));
                        break;
                    case CMD_EDIT_STATE_PROPERTY:
                        var newValue = getStatePropertyValue(lostChange.new_value);
                        var oldValue = getStatePropertyValue(lostChange.old_value);
                        var stateName = lostChange.state_name;
                        if (!stateWiseEditsMapping[stateName]) {
                            stateWiseEditsMapping[stateName] = [];
                        }
                        switch (lostChange.property_name) {
                            case 'content':
                                if (newValue !== null) {
                                    // TODO(sll): Also add display of audio translations here.
                                    stateWiseEditsMapping[stateName].push(angular.element('<div></div>').html('<strong>Edited content: ' +
                                        '</strong><div class="content">' + newValue.html +
                                        '</div>')
                                        .addClass('state-edit-desc'));
                                }
                                break;
                            case 'widget_id':
                                var lostChangeValue = '';
                                if (oldValue === null) {
                                    if (newValue !== 'EndExploration') {
                                        lostChangeValue = ('<strong>Added Interaction: ' +
                                            '</strong>' + newValue);
                                    }
                                    else {
                                        lostChangeValue = 'Ended Exploration';
                                    }
                                }
                                else {
                                    lostChangeValue = ('<strong>Deleted Interaction: ' +
                                        '</strong>' + oldValue);
                                }
                                stateWiseEditsMapping[stateName].push(angular.element('<div></div>').html(lostChangeValue)
                                    .addClass('state-edit-desc'));
                                break;
                            case 'widget_customization_args':
                                var lostChangeValue = '';
                                if (UtilsService.isEmpty(oldValue)) {
                                    lostChangeValue = 'Added Interaction Customizations';
                                }
                                else if (UtilsService.isEmpty(newValue)) {
                                    lostChangeValue = 'Removed Interaction Customizations';
                                }
                                else {
                                    lostChangeValue = 'Edited Interaction Customizations';
                                }
                                stateWiseEditsMapping[stateName].push(angular.element('<div></div>').html(lostChangeValue)
                                    .addClass('state-edit-desc'));
                                break;
                            case 'answer_groups':
                                var answerGroupChanges = getRelativeChangeToGroups(lostChange);
                                var answerGroupHtml = '';
                                if (answerGroupChanges === 'added') {
                                    answerGroupHtml += ('<p class="sub-edit"><i>Destination: </i>' +
                                        newValue.outcome.dest + '</p>');
                                    answerGroupHtml += ('<div class="sub-edit"><i>Feedback: </i>' +
                                        '<div class="feedback">' +
                                        newValue.outcome.feedback.getHtml() + '</div></div>');
                                    var rulesList = makeRulesListHumanReadable(newValue);
                                    if (rulesList.length > 0) {
                                        answerGroupHtml += ('<p class="sub-edit"><i>Rules: </i></p>');
                                        var rulesListHtml = (angular.element('<ol></ol>').addClass('rules-list'));
                                        for (var rule in rulesList) {
                                            rulesListHtml.html(rulesList[rule][0].outerHTML);
                                        }
                                        answerGroupHtml += rulesListHtml[0].outerHTML;
                                    }
                                    stateWiseEditsMapping[stateName].push(angular.element('<div><strong>Added answer group: ' +
                                        '</strong></div>')
                                        .append(answerGroupHtml)
                                        .addClass('state-edit-desc answer-group'));
                                }
                                else if (answerGroupChanges === 'edited') {
                                    if (newValue.outcome.dest !== oldValue.outcome.dest) {
                                        answerGroupHtml += ('<p class="sub-edit"><i>Destination: </i>' +
                                            newValue.outcome.dest + '</p>');
                                    }
                                    if (!angular.equals(newValue.outcome.feedback.getHtml(), oldValue.outcome.feedback.getHtml())) {
                                        answerGroupHtml += ('<div class="sub-edit"><i>Feedback: </i>' +
                                            '<div class="feedback">' +
                                            newValue.outcome.feedback.getHtml() +
                                            '</div></div>');
                                    }
                                    if (!angular.equals(newValue.rules, oldValue.rules)) {
                                        var rulesList = makeRulesListHumanReadable(newValue);
                                        if (rulesList.length > 0) {
                                            answerGroupHtml += ('<p class="sub-edit"><i>Rules: </i></p>');
                                            var rulesListHtml = (angular.element('<ol></ol>')
                                                .addClass('rules-list'));
                                            for (var rule in rulesList) {
                                                rulesListHtml.html(rulesList[rule][0].outerHTML);
                                            }
                                            answerGroupChanges = rulesListHtml[0].outerHTML;
                                        }
                                    }
                                    stateWiseEditsMapping[stateName].push(angular.element('<div><strong>Edited answer group: <strong>' +
                                        '</div>')
                                        .append(answerGroupHtml)
                                        .addClass('state-edit-desc answer-group'));
                                }
                                else if (answerGroupChanges === 'deleted') {
                                    stateWiseEditsMapping[stateName].push(angular.element('<div>Deleted answer group</div>')
                                        .addClass('state-edit-desc'));
                                }
                                break;
                            case 'default_outcome':
                                var defaultOutcomeChanges = getRelativeChangeToGroups(lostChange);
                                var defaultOutcomeHtml = '';
                                if (defaultOutcomeChanges === 'added') {
                                    defaultOutcomeHtml += ('<p class="sub-edit"><i>Destination: </i>' +
                                        newValue.dest + '</p>');
                                    defaultOutcomeHtml += ('<div class="sub-edit"><i>Feedback: </i>' +
                                        '<div class="feedback">' + newValue.feedback.getHtml() +
                                        '</div></div>');
                                    stateWiseEditsMapping[stateName].push(angular.element('<div>Added default outcome: </div>')
                                        .append(defaultOutcomeHtml)
                                        .addClass('state-edit-desc default-outcome'));
                                }
                                else if (defaultOutcomeChanges === 'edited') {
                                    if (newValue.dest !== oldValue.dest) {
                                        defaultOutcomeHtml += ('<p class="sub-edit"><i>Destination: </i>' +
                                            newValue.dest +
                                            '</p>');
                                    }
                                    if (!angular.equals(newValue.feedback.getHtml(), oldValue.feedback.getHtml())) {
                                        defaultOutcomeHtml += ('<div class="sub-edit"><i>Feedback: </i>' +
                                            '<div class="feedback">' + newValue.feedback +
                                            '</div></div>');
                                    }
                                    stateWiseEditsMapping[stateName].push(angular.element('<div>Edited default outcome: </div>')
                                        .append(defaultOutcomeHtml)
                                        .addClass('state-edit-desc default-outcome'));
                                }
                                else if (defaultOutcomeChanges === 'deleted') {
                                    stateWiseEditsMapping[stateName].push(angular.element('<div>Deleted default outcome</div>')
                                        .addClass('state-edit-desc'));
                                }
                        }
                }
            });
            for (var stateName in stateWiseEditsMapping) {
                var stateChangesEl = angular.element('<li>Edits to state: ' + stateName + '</li>');
                for (var stateEdit in stateWiseEditsMapping[stateName]) {
                    stateChangesEl.append(stateWiseEditsMapping[stateName][stateEdit]);
                }
                outerHtml.append(stateChangesEl);
            }
            return outerHtml;
        };
        return {
            makeHumanReadable: function (lostChanges) {
                try {
                    return makeHumanReadable(lostChanges);
                }
                catch (e) {
                    return angular.element('<div>Error: Could not recover lost changes.</div>');
                }
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/exploration-data/exploration-data.service.ts":
/*!*********************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/exploration-data/exploration-data.service.ts ***!
  \*********************************************************************************************************************************************/
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
 *  @fileoverview Service for handling all interactions
 *  with the exploration editor backend.
 */
__webpack_require__(/*! domain/exploration/EditableExplorationBackendApiService.ts */ "./core/templates/dev/head/domain/exploration/EditableExplorationBackendApiService.ts");
__webpack_require__(/*! domain/exploration/ReadOnlyExplorationBackendApiService.ts */ "./core/templates/dev/head/domain/exploration/ReadOnlyExplorationBackendApiService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/LocalStorageService.ts */ "./core/templates/dev/head/services/LocalStorageService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
angular.module('explorationEditorPageModule').factory('ExplorationDataService', [
    '$http', '$log', '$q', '$window', 'AlertsService',
    'EditableExplorationBackendApiService', 'LocalStorageService',
    'ReadOnlyExplorationBackendApiService', 'UrlService',
    function ($http, $log, $q, $window, AlertsService, EditableExplorationBackendApiService, LocalStorageService, ReadOnlyExplorationBackendApiService, UrlService) {
        // The pathname (without the hash) should be: .../create/{exploration_id}
        var explorationId = '';
        var draftChangeListId = null;
        var pathnameArray = UrlService.getPathname().split('/');
        for (var i = 0; i < pathnameArray.length; i++) {
            if (pathnameArray[i] === 'create') {
                explorationId = pathnameArray[i + 1];
                break;
            }
        }
        if (!explorationId) {
            $log.error('Unexpected call to ExplorationDataService for pathname ', pathnameArray[i]);
            // Note: if we do not return anything, Karma unit tests fail.
            return {};
        }
        var resolvedAnswersUrlPrefix = ('/createhandler/resolved_answers/' + explorationId);
        var explorationDraftAutosaveUrl = '';
        if (GLOBALS.can_edit) {
            explorationDraftAutosaveUrl = ('/createhandler/autosave_draft/' + explorationId);
        }
        else if (GLOBALS.can_translate) {
            explorationDraftAutosaveUrl = ('/createhandler/autosave_translation_draft/' + explorationId);
        }
        // Put exploration variables here.
        var explorationData = {
            explorationId: explorationId,
            data: null,
            // Note that the changeList is the full changeList since the last
            // committed version (as opposed to the most recent autosave).
            autosaveChangeList: function (changeList, successCallback, errorCallback) {
                if (successCallback === void 0) { successCallback = function (response) { }; }
                if (errorCallback === void 0) { errorCallback = function () { }; }
                // First save locally to be retrieved later if save is unsuccessful.
                LocalStorageService.saveExplorationDraft(explorationId, changeList, draftChangeListId);
                $http.put(explorationDraftAutosaveUrl, {
                    change_list: changeList,
                    version: explorationData.data.version
                }).then(function (response) {
                    draftChangeListId = response.data.draft_change_list_id;
                    // We can safely remove the locally saved draft copy if it was saved
                    // to the backend.
                    LocalStorageService.removeExplorationDraft(explorationId);
                    if (successCallback) {
                        successCallback(response);
                    }
                }, function () {
                    if (errorCallback) {
                        errorCallback();
                    }
                });
            },
            discardDraft: function (successCallback, errorCallback) {
                $http.post(explorationDraftAutosaveUrl, {}).then(function () {
                    LocalStorageService.removeExplorationDraft(explorationId);
                    if (successCallback) {
                        successCallback();
                    }
                }, function () {
                    if (errorCallback) {
                        errorCallback();
                    }
                });
            },
            // Returns a promise that supplies the data for the current exploration.
            getData: function (errorCallback) {
                if (explorationData.data) {
                    $log.info('Found exploration data in cache.');
                    return $q.resolve(explorationData.data);
                }
                else {
                    // Retrieve data from the server.
                    // WARNING: Note that this is a version of the exploration with
                    // draft changes applied. This makes a force-refresh necessary when
                    // changes are discarded, otherwise the
                    // exploration-with-draft-changes (which is cached here) will be
                    // reused.
                    return (EditableExplorationBackendApiService.fetchApplyDraftExploration(explorationId).then(function (response) {
                        $log.info('Retrieved exploration data.');
                        $log.info(response);
                        draftChangeListId = response.draft_change_list_id;
                        explorationData.data = response;
                        var draft = LocalStorageService.getExplorationDraft(explorationId);
                        if (draft) {
                            if (draft.isValid(draftChangeListId)) {
                                var changeList = draft.getChanges();
                                explorationData.autosaveChangeList(changeList, function () {
                                    // A reload is needed so that the changelist just saved is
                                    // loaded as opposed to the exploration returned by this
                                    // response.
                                    $window.location.reload();
                                });
                            }
                            else {
                                errorCallback(explorationId, draft.getChanges());
                            }
                        }
                        return response;
                    }));
                }
            },
            // Returns a promise supplying the last saved version for the current
            // exploration.
            getLastSavedData: function () {
                return ReadOnlyExplorationBackendApiService.loadLatestExploration(explorationId).then(function (response) {
                    $log.info('Retrieved saved exploration data.');
                    $log.info(response);
                    return response.exploration;
                });
            },
            resolveAnswers: function (stateName, resolvedAnswersList) {
                AlertsService.clearWarnings();
                $http.put(resolvedAnswersUrlPrefix + '/' + encodeURIComponent(stateName), {
                    resolved_answers: resolvedAnswersList
                });
            },
            /**
             * Saves the exploration to the backend, and, on a success callback,
             * updates the local copy of the exploration data.
             * @param {object} changeList - Represents the change list for
             *   this save. Each element of the list is a command representing an
             *   editing action (such as add state, delete state, etc.). See the
             *  _'Change' class in exp_services.py for full documentation.
             * @param {string} commitMessage - The user-entered commit message for
             *   this save operation.
             */
            save: function (changeList, commitMessage, successCallback, errorCallback) {
                EditableExplorationBackendApiService.updateExploration(explorationId, explorationData.data.version, commitMessage, changeList).then(function (response) {
                    AlertsService.clearWarnings();
                    explorationData.data = response;
                    if (successCallback) {
                        successCallback(response.is_version_of_draft_valid, response.draft_changes);
                    }
                }, function () {
                    if (errorCallback) {
                        errorCallback();
                    }
                });
            }
        };
        return explorationData;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/exploration-init-state-name.service.ts":
/*!***************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/exploration-init-state-name.service.ts ***!
  \***************************************************************************************************************************************/
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
 * @fileoverview A data service that stores the name of the exploration's
 * initial state. NOTE: This service does not perform validation. Users of this
 * service should ensure that new initial state names passed to the service are
 * valid.
 */
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-page-services/exploration-property.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/exploration-property.service.ts");
angular.module('explorationEditorPageModule').factory('ExplorationInitStateNameService', [
    'ExplorationPropertyService', function (ExplorationPropertyService) {
        var child = Object.create(ExplorationPropertyService);
        child.propertyName = 'init_state_name';
        return child;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/exploration-property.service.ts":
/*!********************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/exploration-property.service.ts ***!
  \********************************************************************************************************************************/
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
 * @fileoverview Services for storing exploration properties for
 * displaying and editing them in multiple places in the UI,
 * with base class as ExplorationPropertyService.
 */
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-page-services/change-list.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/change-list.service.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('explorationEditorPageModule').factory('ExplorationPropertyService', [
    '$log', '$rootScope', 'AlertsService', 'ChangeListService',
    function ($log, $rootScope, AlertsService, ChangeListService) {
        // Public base API for data services corresponding to exploration
        // properties (title, category, etc.)
        var BACKEND_CONVERSIONS = {
            param_changes: function (paramChanges) {
                return paramChanges.map(function (paramChange) {
                    return paramChange.toBackendDict();
                });
            },
            param_specs: function (paramSpecs) {
                return paramSpecs.toBackendDict();
            },
        };
        return {
            init: function (value) {
                if (this.propertyName === null) {
                    throw 'Exploration property name cannot be null.';
                }
                $log.info('Initializing exploration ' + this.propertyName + ':', value);
                // The current value of the property (which may not have been saved to
                // the frontend yet). In general, this will be bound directly to the
                // UI.
                this.displayed = angular.copy(value);
                // The previous (saved-in-the-frontend) value of the property. Here,
                // 'saved' means that this is the latest value of the property as
                // determined by the frontend change list.
                this.savedMemento = angular.copy(value);
                $rootScope.$broadcast('explorationPropertyChanged');
            },
            // Returns whether the current value has changed from the memento.
            hasChanged: function () {
                return !angular.equals(this.savedMemento, this.displayed);
            },
            // The backend name for this property. THIS MUST BE SPECIFIED BY
            // SUBCLASSES.
            propertyName: null,
            // Transforms the given value into a normalized form. THIS CAN BE
            // OVERRIDDEN BY SUBCLASSES. The default behavior is to do nothing.
            _normalize: function (value) {
                return value;
            },
            // Validates the given value and returns a boolean stating whether it
            // is valid or not. THIS CAN BE OVERRIDDEN BY SUBCLASSES. The default
            // behavior is to always return true.
            _isValid: function (value) {
                return true;
            },
            // Normalizes the displayed value. Then, if the memento and the
            // displayed value are the same, does nothing. Otherwise, creates a new
            // entry in the change list, and updates the memento to the displayed
            // value.
            saveDisplayedValue: function () {
                if (this.propertyName === null) {
                    throw 'Exploration property name cannot be null.';
                }
                this.displayed = this._normalize(this.displayed);
                if (!this._isValid(this.displayed) || !this.hasChanged()) {
                    this.restoreFromMemento();
                    return;
                }
                if (angular.equals(this.displayed, this.savedMemento)) {
                    return;
                }
                AlertsService.clearWarnings();
                var newBackendValue = angular.copy(this.displayed);
                var oldBackendValue = angular.copy(this.savedMemento);
                if (BACKEND_CONVERSIONS.hasOwnProperty(this.propertyName)) {
                    newBackendValue =
                        BACKEND_CONVERSIONS[this.propertyName](this.displayed);
                    oldBackendValue =
                        BACKEND_CONVERSIONS[this.propertyName](this.savedMemento);
                }
                ChangeListService.editExplorationProperty(this.propertyName, newBackendValue, oldBackendValue);
                this.savedMemento = angular.copy(this.displayed);
                $rootScope.$broadcast('explorationPropertyChanged');
            },
            // Reverts the displayed value to the saved memento.
            restoreFromMemento: function () {
                this.displayed = angular.copy(this.savedMemento);
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/exploration-states/exploration-states.service.ts":
/*!*************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/exploration-states/exploration-states.service.ts ***!
  \*************************************************************************************************************************************************/
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
 * @fileoverview Data service for keeping track of the exploration's states.
 * Note that this is unlike the other exploration property services, in that it
 * keeps no mementos.
 */
__webpack_require__(/*! domain/exploration/StatesObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/StatesObjectFactory.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! filters/string-utility-filters/normalize-whitespace.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/normalize-whitespace.filter.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-page-services/angular-name/angular-name.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/angular-name/angular-name.service.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-page-services/change-list.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/change-list.service.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-page-services/exploration-init-state-name.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/exploration-init-state-name.service.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/solution-validity/solution-validity.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/solution-validity/solution-validity.service.ts");
__webpack_require__(/*! pages/exploration_player/AnswerClassificationService.ts */ "./core/templates/dev/head/pages/exploration_player/AnswerClassificationService.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/responses.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/responses.service.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/ContextService.ts */ "./core/templates/dev/head/services/ContextService.ts");
__webpack_require__(/*! services/ValidatorsService.ts */ "./core/templates/dev/head/services/ValidatorsService.ts");
angular.module('explorationEditorPageModule').factory('ExplorationStatesService', [
    '$filter', '$injector', '$location', '$log', '$q', '$rootScope',
    '$uibModal', 'AlertsService', 'AngularNameService',
    'AnswerClassificationService', 'ChangeListService', 'ContextService',
    'ExplorationInitStateNameService', 'SolutionValidityService',
    'StateEditorService', 'StatesObjectFactory', 'UrlInterpolationService',
    'ValidatorsService',
    function ($filter, $injector, $location, $log, $q, $rootScope, $uibModal, AlertsService, AngularNameService, AnswerClassificationService, ChangeListService, ContextService, ExplorationInitStateNameService, SolutionValidityService, StateEditorService, StatesObjectFactory, UrlInterpolationService, ValidatorsService) {
        var _states = null;
        var stateAddedCallbacks = [];
        var stateDeletedCallbacks = [];
        var stateRenamedCallbacks = [];
        var stateAnswerGroupsSavedCallbacks = [];
        // Properties that have a different backend representation from the
        // frontend and must be converted.
        var BACKEND_CONVERSIONS = {
            answer_groups: function (answerGroups) {
                return answerGroups.map(function (answerGroup) {
                    return answerGroup.toBackendDict();
                });
            },
            content: function (content) {
                return content.toBackendDict();
            },
            recorded_voiceovers: function (recordedVoiceovers) {
                return recordedVoiceovers.toBackendDict();
            },
            default_outcome: function (defaultOutcome) {
                if (defaultOutcome) {
                    return defaultOutcome.toBackendDict();
                }
                else {
                    return null;
                }
            },
            hints: function (hints) {
                return hints.map(function (hint) {
                    return hint.toBackendDict();
                });
            },
            param_changes: function (paramChanges) {
                return paramChanges.map(function (paramChange) {
                    return paramChange.toBackendDict();
                });
            },
            param_specs: function (paramSpecs) {
                return paramSpecs.toBackendDict();
            },
            solution: function (solution) {
                if (solution) {
                    return solution.toBackendDict();
                }
                else {
                    return null;
                }
            },
            written_translations: function (writtenTranslations) {
                return writtenTranslations.toBackendDict();
            }
        };
        // Maps backend names to the corresponding frontend dict accessor lists.
        var PROPERTY_REF_DATA = {
            answer_groups: ['interaction', 'answerGroups'],
            confirmed_unclassified_answers: [
                'interaction', 'confirmedUnclassifiedAnswers'
            ],
            content: ['content'],
            recorded_voiceovers: ['recordedVoiceovers'],
            default_outcome: ['interaction', 'defaultOutcome'],
            param_changes: ['paramChanges'],
            param_specs: ['paramSpecs'],
            hints: ['interaction', 'hints'],
            solution: ['interaction', 'solution'],
            widget_id: ['interaction', 'id'],
            widget_customization_args: ['interaction', 'customizationArgs'],
            written_translations: ['writtenTranslations']
        };
        var CONTENT_ID_EXTRACTORS = {
            answer_groups: function (answerGroups) {
                var contentIds = new Set();
                answerGroups.forEach(function (answerGroup) {
                    contentIds.add(answerGroup.outcome.feedback.getContentId());
                });
                return contentIds;
            },
            default_outcome: function (defaultOutcome) {
                var contentIds = new Set();
                if (defaultOutcome) {
                    contentIds.add(defaultOutcome.feedback.getContentId());
                }
                return contentIds;
            },
            hints: function (hints) {
                var contentIds = new Set();
                hints.forEach(function (hint) {
                    contentIds.add(hint.hintContent.getContentId());
                });
                return contentIds;
            },
            solution: function (solution) {
                var contentIds = new Set();
                if (solution) {
                    contentIds.add(solution.explanation.getContentId());
                }
                return contentIds;
            }
        };
        var _getElementsInFirstSetButNotInSecond = function (setA, setB) {
            var diffList = Array.from(setA).filter(function (element) {
                return !setB.has(element);
            });
            return diffList;
        };
        var _setState = function (stateName, stateData, refreshGraph) {
            _states.setState(stateName, angular.copy(stateData));
            if (refreshGraph) {
                $rootScope.$broadcast('refreshGraph');
            }
        };
        var getStatePropertyMemento = function (stateName, backendName) {
            var accessorList = PROPERTY_REF_DATA[backendName];
            var propertyRef = _states.getState(stateName);
            try {
                accessorList.forEach(function (key) {
                    propertyRef = propertyRef[key];
                });
            }
            catch (e) {
                var additionalInfo = ('\nUndefined states error debug logs:' +
                    '\nRequested state name: ' + stateName +
                    '\nExploration ID: ' + ContextService.getExplorationId() +
                    '\nChange list: ' + JSON.stringify(ChangeListService.getChangeList()) +
                    '\nAll states names: ' + _states.getStateNames());
                e.message += additionalInfo;
                throw e;
            }
            return angular.copy(propertyRef);
        };
        var saveStateProperty = function (stateName, backendName, newValue) {
            var oldValue = getStatePropertyMemento(stateName, backendName);
            var newBackendValue = angular.copy(newValue);
            var oldBackendValue = angular.copy(oldValue);
            if (BACKEND_CONVERSIONS.hasOwnProperty(backendName)) {
                newBackendValue = convertToBackendRepresentation(newValue, backendName);
                oldBackendValue = convertToBackendRepresentation(oldValue, backendName);
            }
            if (!angular.equals(oldValue, newValue)) {
                ChangeListService.editStateProperty(stateName, backendName, newBackendValue, oldBackendValue);
                var newStateData = _states.getState(stateName);
                var accessorList = PROPERTY_REF_DATA[backendName];
                if (CONTENT_ID_EXTRACTORS.hasOwnProperty(backendName)) {
                    var oldContentIds = CONTENT_ID_EXTRACTORS[backendName](oldValue);
                    var newContentIds = CONTENT_ID_EXTRACTORS[backendName](newValue);
                    var contentIdsToDelete = _getElementsInFirstSetButNotInSecond(oldContentIds, newContentIds);
                    var contentIdsToAdd = _getElementsInFirstSetButNotInSecond(newContentIds, oldContentIds);
                    contentIdsToDelete.forEach(function (contentId) {
                        newStateData.recordedVoiceovers.deleteContentId(contentId);
                        newStateData.writtenTranslations.deleteContentId(contentId);
                    });
                    contentIdsToAdd.forEach(function (contentId) {
                        newStateData.recordedVoiceovers.addContentId(contentId);
                        newStateData.writtenTranslations.addContentId(contentId);
                    });
                }
                var propertyRef = newStateData;
                for (var i = 0; i < accessorList.length - 1; i++) {
                    propertyRef = propertyRef[accessorList[i]];
                }
                propertyRef[accessorList[accessorList.length - 1]] = angular.copy(newValue);
                // We do not refresh the state editor immediately after the
                // interaction id alone is saved, because the customization args dict
                // will be temporarily invalid. A change in interaction id will always
                // entail a change in the customization args dict anyway, so the graph
                // will get refreshed after both properties have been updated.
                var refreshGraph = (backendName !== 'widget_id');
                _setState(stateName, newStateData, refreshGraph);
            }
        };
        var convertToBackendRepresentation = function (frontendValue, backendName) {
            var conversionFunction = BACKEND_CONVERSIONS[backendName];
            return conversionFunction(frontendValue);
        };
        // TODO(sll): Add unit tests for all get/save methods.
        return {
            init: function (statesBackendDict) {
                _states = StatesObjectFactory.createFromBackendDict(statesBackendDict);
                // Initialize the solutionValidityService.
                SolutionValidityService.init(_states.getStateNames());
                _states.getStateNames().forEach(function (stateName) {
                    var solution = _states.getState(stateName).interaction.solution;
                    if (solution) {
                        var result = (AnswerClassificationService.getMatchingClassificationResult(stateName, _states.getState(stateName).interaction, solution.correctAnswer, $injector.get(AngularNameService.getNameOfInteractionRulesService(_states.getState(stateName).interaction.id))));
                        var solutionIsValid = stateName !== result.outcome.dest;
                        SolutionValidityService.updateValidity(stateName, solutionIsValid);
                    }
                });
            },
            getStates: function () {
                return angular.copy(_states);
            },
            getStateNames: function () {
                return _states.getStateNames();
            },
            hasState: function (stateName) {
                return _states.hasState(stateName);
            },
            getState: function (stateName) {
                return angular.copy(_states.getState(stateName));
            },
            setState: function (stateName, stateData) {
                _setState(stateName, stateData, true);
            },
            isNewStateNameValid: function (newStateName, showWarnings) {
                if (_states.hasState(newStateName)) {
                    if (showWarnings) {
                        AlertsService.addWarning('A state with this name already exists.');
                    }
                    return false;
                }
                return (ValidatorsService.isValidStateName(newStateName, showWarnings));
            },
            getStateContentMemento: function (stateName) {
                return getStatePropertyMemento(stateName, 'content');
            },
            saveStateContent: function (stateName, newContent) {
                saveStateProperty(stateName, 'content', newContent);
            },
            getStateParamChangesMemento: function (stateName) {
                return getStatePropertyMemento(stateName, 'param_changes');
            },
            saveStateParamChanges: function (stateName, newParamChanges) {
                saveStateProperty(stateName, 'param_changes', newParamChanges);
            },
            getInteractionIdMemento: function (stateName) {
                return getStatePropertyMemento(stateName, 'widget_id');
            },
            saveInteractionId: function (stateName, newInteractionId) {
                saveStateProperty(stateName, 'widget_id', newInteractionId);
            },
            getInteractionCustomizationArgsMemento: function (stateName) {
                return getStatePropertyMemento(stateName, 'widget_customization_args');
            },
            saveInteractionCustomizationArgs: function (stateName, newCustomizationArgs) {
                saveStateProperty(stateName, 'widget_customization_args', newCustomizationArgs);
            },
            getInteractionAnswerGroupsMemento: function (stateName) {
                return getStatePropertyMemento(stateName, 'answer_groups');
            },
            saveInteractionAnswerGroups: function (stateName, newAnswerGroups) {
                saveStateProperty(stateName, 'answer_groups', newAnswerGroups);
                stateAnswerGroupsSavedCallbacks.forEach(function (callback) {
                    callback(stateName);
                });
            },
            getConfirmedUnclassifiedAnswersMemento: function (stateName) {
                return getStatePropertyMemento(stateName, 'confirmed_unclassified_answers');
            },
            saveConfirmedUnclassifiedAnswers: function (stateName, newAnswers) {
                saveStateProperty(stateName, 'confirmed_unclassified_answers', newAnswers);
            },
            getInteractionDefaultOutcomeMemento: function (stateName) {
                return getStatePropertyMemento(stateName, 'default_outcome');
            },
            saveInteractionDefaultOutcome: function (stateName, newDefaultOutcome) {
                saveStateProperty(stateName, 'default_outcome', newDefaultOutcome);
            },
            getHintsMemento: function (stateName) {
                return getStatePropertyMemento(stateName, 'hints');
            },
            saveHints: function (stateName, newHints) {
                saveStateProperty(stateName, 'hints', newHints);
            },
            getSolutionMemento: function (stateName) {
                return getStatePropertyMemento(stateName, 'solution');
            },
            saveSolution: function (stateName, newSolution) {
                saveStateProperty(stateName, 'solution', newSolution);
            },
            getRecordedVoiceoversMemento: function (stateName) {
                return getStatePropertyMemento(stateName, 'recorded_voiceovers');
            },
            saveRecordedVoiceovers: function (stateName, newRecordedVoiceovers) {
                saveStateProperty(stateName, 'recorded_voiceovers', newRecordedVoiceovers);
            },
            getWrittenTranslationsMemento: function (stateName) {
                return getStatePropertyMemento(stateName, 'written_translations');
            },
            saveWrittenTranslations: function (stateName, newWrittenTranslations) {
                saveStateProperty(stateName, 'written_translations', newWrittenTranslations);
            },
            isInitialized: function () {
                return _states !== null;
            },
            addState: function (newStateName, successCallback) {
                newStateName = $filter('normalizeWhitespace')(newStateName);
                if (!ValidatorsService.isValidStateName(newStateName, true)) {
                    return;
                }
                if (_states.hasState(newStateName)) {
                    AlertsService.addWarning('A state with this name already exists.');
                    return;
                }
                AlertsService.clearWarnings();
                _states.addState(newStateName);
                ChangeListService.addState(newStateName);
                stateAddedCallbacks.forEach(function (callback) {
                    callback(newStateName);
                });
                $rootScope.$broadcast('refreshGraph');
                if (successCallback) {
                    successCallback(newStateName);
                }
            },
            deleteState: function (deleteStateName) {
                AlertsService.clearWarnings();
                var initStateName = ExplorationInitStateNameService.displayed;
                if (deleteStateName === initStateName) {
                    return;
                }
                if (!_states.hasState(deleteStateName)) {
                    AlertsService.addWarning('No state with name ' + deleteStateName + ' exists.');
                    return;
                }
                return $uibModal.open({
                    templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/exploration-editor-page/exploration-editor-tab/' +
                        'exploration-editor-tab-templates/' +
                        'confirm-delete-state-modal.template.html'),
                    backdrop: true,
                    resolve: {
                        deleteStateName: function () {
                            return deleteStateName;
                        }
                    },
                    controller: [
                        '$scope', '$uibModalInstance', 'deleteStateName',
                        function ($scope, $uibModalInstance, deleteStateName) {
                            $scope.deleteStateWarningText = ('Are you sure you want to delete the card "' +
                                deleteStateName + '"?');
                            $scope.reallyDelete = function () {
                                $uibModalInstance.close(deleteStateName);
                            };
                            $scope.cancel = function () {
                                $uibModalInstance.dismiss('cancel');
                                AlertsService.clearWarnings();
                            };
                        }
                    ]
                }).result.then(function (deleteStateName) {
                    _states.deleteState(deleteStateName);
                    ChangeListService.deleteState(deleteStateName);
                    if (StateEditorService.getActiveStateName() === deleteStateName) {
                        StateEditorService.setActiveStateName(ExplorationInitStateNameService.savedMemento);
                    }
                    $location.path('/gui/' + StateEditorService.getActiveStateName());
                    stateDeletedCallbacks.forEach(function (callback) {
                        callback(deleteStateName);
                    });
                    $rootScope.$broadcast('refreshGraph');
                    // This ensures that if the deletion changes rules in the current
                    // state, they get updated in the view.
                    $rootScope.$broadcast('refreshStateEditor');
                });
            },
            renameState: function (oldStateName, newStateName) {
                newStateName = $filter('normalizeWhitespace')(newStateName);
                if (!ValidatorsService.isValidStateName(newStateName, true)) {
                    return;
                }
                if (_states.hasState(newStateName)) {
                    AlertsService.addWarning('A state with this name already exists.');
                    return;
                }
                AlertsService.clearWarnings();
                _states.renameState(oldStateName, newStateName);
                StateEditorService.setActiveStateName(newStateName);
                // The 'rename state' command must come before the 'change
                // init_state_name' command in the change list, otherwise the backend
                // will raise an error because the new initial state name does not
                // exist.
                ChangeListService.renameState(newStateName, oldStateName);
                SolutionValidityService.onRenameState(newStateName, oldStateName);
                // Amend initStateName appropriately, if necessary. Note that this
                // must come after the state renaming, otherwise saving will lead to
                // a complaint that the new name is not a valid state name.
                if (ExplorationInitStateNameService.displayed === oldStateName) {
                    ExplorationInitStateNameService.displayed = newStateName;
                    ExplorationInitStateNameService.saveDisplayedValue(newStateName);
                }
                stateRenamedCallbacks.forEach(function (callback) {
                    callback(oldStateName, newStateName);
                });
                $rootScope.$broadcast('refreshGraph');
            },
            registerOnStateAddedCallback: function (callback) {
                stateAddedCallbacks.push(callback);
            },
            registerOnStateDeletedCallback: function (callback) {
                stateDeletedCallbacks.push(callback);
            },
            registerOnStateRenamedCallback: function (callback) {
                stateRenamedCallbacks.push(callback);
            },
            registerOnStateAnswerGroupsSavedCallback: function (callback) {
                stateAnswerGroupsSavedCallbacks.push(callback);
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/router.service.ts":
/*!******************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/router.service.ts ***!
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
 * @fileoverview Service that handles routing for the exploration editor page.
 */
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-page-services/exploration-init-state-name.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/exploration-init-state-name.service.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-page-services/exploration-states/exploration-states.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/exploration-states/exploration-states.service.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/responses.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/responses.service.ts");
__webpack_require__(/*! services/ExplorationFeaturesService.ts */ "./core/templates/dev/head/services/ExplorationFeaturesService.ts");
angular.module('explorationEditorPageModule').factory('RouterService', [
    '$interval', '$location', '$rootScope', '$timeout', '$window',
    'ExplorationFeaturesService', 'ExplorationInitStateNameService',
    'ExplorationStatesService', 'StateEditorService',
    function ($interval, $location, $rootScope, $timeout, $window, ExplorationFeaturesService, ExplorationInitStateNameService, ExplorationStatesService, StateEditorService) {
        var TABS = {
            MAIN: { name: 'main', path: '/main' },
            TRANSLATION: { name: 'translation', path: '/translation' },
            PREVIEW: { name: 'preview', path: '/preview' },
            SETTINGS: { name: 'settings', path: '/settings' },
            STATS: { name: 'stats', path: '/stats' },
            IMPROVEMENTS: { name: 'improvements', path: '/improvements' },
            HISTORY: { name: 'history', path: '/history' },
            FEEDBACK: { name: 'feedback', path: '/feedback' },
        };
        var SLUG_GUI = 'gui';
        var SLUG_PREVIEW = 'preview';
        var activeTabName = TABS.MAIN.name;
        var isImprovementsTabEnabled = ExplorationFeaturesService.isImprovementsTabEnabled;
        // When the URL path changes, reroute to the appropriate tab in the
        // exploration editor page.
        $rootScope.$watch(function () {
            return $location.path();
        }, function (newPath, oldPath) {
            if (newPath === '') {
                $location.path(oldPath);
                return;
            }
            if (!oldPath) {
                // This can happen when clicking on links whose href is "#".
                return;
            }
            // TODO(oparry): Determine whether this is necessary, since
            // _savePendingChanges() is called by each of the navigateTo... functions
            $rootScope.$broadcast('externalSave');
            if (newPath.indexOf(TABS.TRANSLATION.path) === 0) {
                activeTabName = TABS.TRANSLATION.name;
                var waitForStatesToLoad = $interval(function () {
                    if (ExplorationStatesService.isInitialized()) {
                        $interval.cancel(waitForStatesToLoad);
                        if (!StateEditorService.getActiveStateName()) {
                            StateEditorService.setActiveStateName(ExplorationInitStateNameService.savedMemento);
                        }
                        $rootScope.$broadcast('refreshTranslationTab');
                    }
                }, 300);
            }
            else if (newPath.indexOf(TABS.PREVIEW.path) === 0) {
                activeTabName = TABS.PREVIEW.name;
                _doNavigationWithState(newPath, SLUG_PREVIEW);
            }
            else if (newPath === TABS.SETTINGS.path) {
                activeTabName = TABS.SETTINGS.name;
                $rootScope.$broadcast('refreshSettingsTab');
            }
            else if (newPath === TABS.STATS.path) {
                activeTabName = TABS.STATS.name;
                $rootScope.$broadcast('refreshStatisticsTab');
            }
            else if (newPath === TABS.IMPROVEMENTS.path &&
                isImprovementsTabEnabled()) {
                activeTabName = TABS.IMPROVEMENTS.name;
            }
            else if (newPath === TABS.HISTORY.path) {
                // TODO(sll): Do this on-hover rather than on-click.
                $rootScope.$broadcast('refreshVersionHistory', {
                    forceRefresh: false
                });
                activeTabName = TABS.HISTORY.name;
            }
            else if (newPath === TABS.FEEDBACK.path) {
                activeTabName = TABS.FEEDBACK.name;
            }
            else if (newPath.indexOf('/gui/') === 0) {
                activeTabName = TABS.MAIN.name;
                _doNavigationWithState(newPath, SLUG_GUI);
            }
            else {
                if (ExplorationInitStateNameService.savedMemento) {
                    $location.path('/gui/' + ExplorationInitStateNameService.savedMemento);
                }
            }
        });
        var _doNavigationWithState = function (path, pathType) {
            var pathBase = '/' + pathType + '/';
            var putativeStateName = path.substring(pathBase.length);
            var waitForStatesToLoad = $interval(function () {
                if (ExplorationStatesService.isInitialized()) {
                    $interval.cancel(waitForStatesToLoad);
                    if (ExplorationStatesService.hasState(putativeStateName)) {
                        StateEditorService.setActiveStateName(putativeStateName);
                        if (pathType === SLUG_GUI) {
                            $rootScope.$broadcast('refreshStateEditor');
                        }
                        // TODO(sll): Fire an event to center the graph, in the case
                        // where another tab is loaded first and then the user switches
                        // to the editor tab. We used to redraw the graph completely but
                        // this is taking lots of time and is probably not worth it.
                    }
                    else {
                        $location.path(pathBase +
                            ExplorationInitStateNameService.savedMemento);
                    }
                }
            }, 300);
        };
        var _savePendingChanges = function () {
            try {
                $rootScope.$broadcast('externalSave');
            }
            catch (e) {
                // Sometimes, AngularJS throws a "Cannot read property $$nextSibling of
                // null" error. To get around this we must use $apply().
                $rootScope.$apply(function () {
                    $rootScope.$broadcast('externalSave');
                });
            }
        };
        var _getCurrentStateFromLocationPath = function () {
            if ($location.path().indexOf('/gui/') !== -1) {
                return $location.path().substring('/gui/'.length);
            }
            else {
                return null;
            }
        };
        var _actuallyNavigate = function (pathType, newStateName) {
            if (pathType !== SLUG_GUI && pathType !== SLUG_PREVIEW) {
                return;
            }
            if (newStateName) {
                StateEditorService.setActiveStateName(newStateName);
            }
            $location.path('/' + pathType + '/' +
                StateEditorService.getActiveStateName());
            $window.scrollTo(0, 0);
        };
        var RouterService = {
            savePendingChanges: function () {
                _savePendingChanges();
            },
            getActiveTabName: function () {
                return activeTabName;
            },
            isLocationSetToNonStateEditorTab: function () {
                var currentPath = $location.path();
                return (currentPath === TABS.TRANSLATION.path ||
                    currentPath === TABS.PREVIEW.path ||
                    currentPath === TABS.STATS.path ||
                    (isImprovementsTabEnabled() &&
                        currentPath === TABS.IMPROVEMENTS.path) ||
                    currentPath === TABS.SETTINGS.path ||
                    currentPath === TABS.HISTORY.path ||
                    currentPath === TABS.FEEDBACK.path);
            },
            getCurrentStateFromLocationPath: function () {
                return _getCurrentStateFromLocationPath();
            },
            navigateToMainTab: function (stateName) {
                _savePendingChanges();
                if (_getCurrentStateFromLocationPath() === stateName) {
                    return;
                }
                if (activeTabName === TABS.MAIN.name) {
                    $('.oppia-editor-cards-container').fadeOut(function () {
                        _actuallyNavigate(SLUG_GUI, stateName);
                        // We need to use $apply to update all our bindings. However we
                        // can't directly use $apply, as there is already another $apply in
                        // progress, the one which angular itself has called at the start.
                        // So we use $applyAsync to ensure that this $apply is called just
                        // after the previous $apply is finished executing. Refer to this
                        // link for more information -
                        // http://blog.theodybrothers.com/2015/08/getting-inside-angular-scopeapplyasync.html
                        $rootScope.$applyAsync();
                        $timeout(function () {
                            $('.oppia-editor-cards-container').fadeIn();
                        }, 150);
                    });
                }
                else {
                    _actuallyNavigate(SLUG_GUI, stateName);
                }
            },
            navigateToTranslationTab: function () {
                _savePendingChanges();
                $location.path(TABS.TRANSLATION.path);
            },
            navigateToPreviewTab: function () {
                if (activeTabName !== TABS.PREVIEW.name) {
                    _savePendingChanges();
                    _actuallyNavigate(SLUG_PREVIEW, null);
                }
            },
            navigateToStatsTab: function () {
                _savePendingChanges();
                $location.path(TABS.STATS.path);
            },
            navigateToImprovementsTab: function () {
                _savePendingChanges();
                $location.path(TABS.IMPROVEMENTS.path);
            },
            navigateToSettingsTab: function () {
                _savePendingChanges();
                $location.path(TABS.SETTINGS.path);
            },
            navigateToHistoryTab: function () {
                _savePendingChanges();
                $location.path(TABS.HISTORY.path);
            },
            navigateToFeedbackTab: function () {
                _savePendingChanges();
                $location.path(TABS.FEEDBACK.path);
            },
        };
        return RouterService;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/answer-groups-cache/answer-groups-cache.service.ts":
/*!*************************************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/answer-groups-cache/answer-groups-cache.service.ts ***!
  \*************************************************************************************************************************************************************************/
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
* @fileoverview A state-specific cache for interaction handlers. It stores
* handlers corresponding to an interaction id so that they can be restored if
* the interaction is changed back while the user is still in this state.
* This cache should be reset each time the state editor is initialized.
*/
angular.module('explorationEditorTabModule').factory('AnswerGroupsCacheService', [function () {
        var _cache = {};
        return {
            reset: function () {
                _cache = {};
            },
            contains: function (interactionId) {
                return _cache.hasOwnProperty(interactionId);
            },
            set: function (interactionId, answerGroups) {
                _cache[interactionId] = angular.copy(answerGroups);
            },
            get: function (interactionId) {
                if (!_cache.hasOwnProperty(interactionId)) {
                    return null;
                }
                return angular.copy(_cache[interactionId]);
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/responses.service.ts":
/*!*******************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/responses.service.ts ***!
  \*******************************************************************************************************************************************/
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
 * @fileoverview Service responses corresponding to a state's interaction and
 * answer groups.
 */
__webpack_require__(/*! domain/exploration/OutcomeObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/OutcomeObjectFactory.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/answer-groups-cache/answer-groups-cache.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/answer-groups-cache/answer-groups-cache.service.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/solution-validity/solution-validity.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/solution-validity/solution-validity.service.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/solution-verification/solution-verification.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/solution-verification/solution-verification.service.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/responses.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/responses.service.ts");
__webpack_require__(/*! pages/state-editor/state-editor-properties-services/state-property/state-property.service.ts */ "./core/templates/dev/head/pages/state-editor/state-editor-properties-services/state-property/state-property.service.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/ContextService.ts */ "./core/templates/dev/head/services/ContextService.ts");
angular.module('explorationEditorTabModule').factory('ResponsesService', [
    '$rootScope', 'AlertsService', 'AnswerGroupsCacheService',
    'ContextService', 'OutcomeObjectFactory',
    'SolutionValidityService', 'SolutionVerificationService',
    'StateEditorService', 'StateInteractionIdService',
    'StateSolutionService', 'COMPONENT_NAME_DEFAULT_OUTCOME',
    'INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_CURRENT_RULE',
    'INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION',
    'INFO_MESSAGE_SOLUTION_IS_VALID', 'INTERACTION_SPECS',
    function ($rootScope, AlertsService, AnswerGroupsCacheService, ContextService, OutcomeObjectFactory, SolutionValidityService, SolutionVerificationService, StateEditorService, StateInteractionIdService, StateSolutionService, COMPONENT_NAME_DEFAULT_OUTCOME, INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_CURRENT_RULE, INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION, INFO_MESSAGE_SOLUTION_IS_VALID, INTERACTION_SPECS) {
        var _answerGroupsMemento = null;
        var _defaultOutcomeMemento = null;
        var _confirmedUnclassifiedAnswersMemento = null;
        // Represents the current selected answer group, starting at index 0. If the
        // index equal to the number of answer groups (answerGroups.length), then it
        // is referring to the default outcome.
        var _activeAnswerGroupIndex = null;
        var _activeRuleIndex = -1;
        var _answerGroups = null;
        var _defaultOutcome = null;
        var _confirmedUnclassifiedAnswers = null;
        var _answerChoices = null;
        var _verifySolution = function () {
            // This checks if the solution is valid once a rule has been changed or
            // added.
            var currentInteractionId = StateInteractionIdService.savedMemento;
            var interactionCanHaveSolution = (currentInteractionId &&
                INTERACTION_SPECS[currentInteractionId].can_have_solution);
            var solutionExists = (StateSolutionService.savedMemento &&
                StateSolutionService.savedMemento.correctAnswer !== null);
            if (interactionCanHaveSolution && solutionExists) {
                var interaction = StateEditorService.getInteraction();
                interaction.answerGroups = angular.copy(_answerGroups);
                interaction.defaultOutcome = angular.copy(_defaultOutcome);
                var solutionIsValid = SolutionVerificationService.verifySolution(StateEditorService.getActiveStateName(), interaction, StateSolutionService.savedMemento.correctAnswer);
                SolutionValidityService.updateValidity(StateEditorService.getActiveStateName(), solutionIsValid);
                var solutionWasPreviouslyValid = (SolutionValidityService.isSolutionValid(StateEditorService.getActiveStateName()));
                if (solutionIsValid && !solutionWasPreviouslyValid) {
                    AlertsService.addInfoMessage(INFO_MESSAGE_SOLUTION_IS_VALID);
                }
                else if (!solutionIsValid && solutionWasPreviouslyValid) {
                    AlertsService.addInfoMessage(INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_CURRENT_RULE);
                }
                else if (!solutionIsValid && !solutionWasPreviouslyValid) {
                    AlertsService.addInfoMessage(INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION);
                }
            }
        };
        var _saveAnswerGroups = function (newAnswerGroups) {
            var oldAnswerGroups = _answerGroupsMemento;
            if (newAnswerGroups && oldAnswerGroups &&
                !angular.equals(newAnswerGroups, oldAnswerGroups)) {
                _answerGroups = newAnswerGroups;
                $rootScope.$broadcast('answerGroupChanged', newAnswerGroups);
                _verifySolution();
                _answerGroupsMemento = angular.copy(newAnswerGroups);
            }
        };
        var _updateAnswerGroup = function (index, updates, callback) {
            var answerGroup = _answerGroups[index];
            if (updates.hasOwnProperty('rules')) {
                answerGroup.rules = updates.rules;
            }
            if (updates.hasOwnProperty('taggedMisconceptionId')) {
                answerGroup.taggedMisconceptionId = updates.taggedMisconceptionId;
            }
            if (updates.hasOwnProperty('feedback')) {
                answerGroup.outcome.feedback = updates.feedback;
            }
            if (updates.hasOwnProperty('dest')) {
                answerGroup.outcome.dest = updates.dest;
            }
            if (updates.hasOwnProperty('refresherExplorationId')) {
                answerGroup.outcome.refresherExplorationId = (updates.refresherExplorationId);
            }
            if (updates.hasOwnProperty('missingPrerequisiteSkillId')) {
                answerGroup.outcome.missingPrerequisiteSkillId = (updates.missingPrerequisiteSkillId);
            }
            if (updates.hasOwnProperty('labelledAsCorrect')) {
                answerGroup.outcome.labelledAsCorrect = updates.labelledAsCorrect;
            }
            if (updates.hasOwnProperty('trainingData')) {
                answerGroup.trainingData = updates.trainingData;
            }
            _saveAnswerGroups(_answerGroups);
            callback(_answerGroupsMemento);
        };
        var _saveDefaultOutcome = function (newDefaultOutcome) {
            var oldDefaultOutcome = _defaultOutcomeMemento;
            if (!angular.equals(newDefaultOutcome, oldDefaultOutcome)) {
                _defaultOutcome = newDefaultOutcome;
                _verifySolution();
                _defaultOutcomeMemento = angular.copy(newDefaultOutcome);
            }
        };
        var _saveConfirmedUnclassifiedAnswers = function (newConfirmedUnclassifiedAnswers) {
            var oldConfirmedUnclassifiedAnswers = (_confirmedUnclassifiedAnswersMemento);
            if (!angular.equals(newConfirmedUnclassifiedAnswers, oldConfirmedUnclassifiedAnswers)) {
                _confirmedUnclassifiedAnswers = newConfirmedUnclassifiedAnswers;
                _confirmedUnclassifiedAnswersMemento = angular.copy(newConfirmedUnclassifiedAnswers);
            }
        };
        return {
            // The 'data' arg is a list of interaction handlers for the
            // currently-active state.
            init: function (data) {
                AnswerGroupsCacheService.reset();
                _answerGroups = angular.copy(data.answerGroups);
                _defaultOutcome = angular.copy(data.defaultOutcome);
                _confirmedUnclassifiedAnswers = angular.copy(data.confirmedUnclassifiedAnswers);
                if (StateInteractionIdService.savedMemento !== null) {
                    AnswerGroupsCacheService.set(StateInteractionIdService.savedMemento, _answerGroups);
                }
                _answerGroupsMemento = angular.copy(_answerGroups);
                _defaultOutcomeMemento = angular.copy(_defaultOutcome);
                _confirmedUnclassifiedAnswersMemento = angular.copy(_confirmedUnclassifiedAnswers);
                _activeAnswerGroupIndex = -1;
                _activeRuleIndex = 0;
            },
            onInteractionIdChanged: function (newInteractionId, callback) {
                if (AnswerGroupsCacheService.contains(newInteractionId)) {
                    _answerGroups = AnswerGroupsCacheService.get(newInteractionId);
                }
                else {
                    _answerGroups = [];
                }
                // Preserve the default outcome unless the interaction is terminal.
                // Recreate the default outcome if switching away from a terminal
                // interaction.
                if (newInteractionId) {
                    if (INTERACTION_SPECS[newInteractionId].is_terminal) {
                        _defaultOutcome = null;
                    }
                    else if (!_defaultOutcome) {
                        _defaultOutcome = OutcomeObjectFactory.createNew(StateEditorService.getActiveStateName(), COMPONENT_NAME_DEFAULT_OUTCOME, '', []);
                    }
                }
                _confirmedUnclassifiedAnswers = [];
                _saveAnswerGroups(_answerGroups);
                _saveDefaultOutcome(_defaultOutcome);
                _saveConfirmedUnclassifiedAnswers(_confirmedUnclassifiedAnswers);
                if (newInteractionId) {
                    AnswerGroupsCacheService.set(newInteractionId, _answerGroups);
                }
                _answerGroupsMemento = angular.copy(_answerGroups);
                _defaultOutcomeMemento = angular.copy(_defaultOutcome);
                _confirmedUnclassifiedAnswersMemento = angular.copy(_confirmedUnclassifiedAnswers);
                _activeAnswerGroupIndex = -1;
                _activeRuleIndex = 0;
                if (callback) {
                    callback(_answerGroupsMemento, _defaultOutcomeMemento);
                }
            },
            getActiveAnswerGroupIndex: function () {
                return _activeAnswerGroupIndex;
            },
            changeActiveAnswerGroupIndex: function (newIndex) {
                // If the current group is being clicked on again, close it.
                if (newIndex === _activeAnswerGroupIndex) {
                    _activeAnswerGroupIndex = -1;
                }
                else {
                    _activeAnswerGroupIndex = newIndex;
                }
                _activeRuleIndex = -1;
            },
            getActiveRuleIndex: function () {
                return _activeRuleIndex;
            },
            changeActiveRuleIndex: function (newIndex) {
                _activeRuleIndex = newIndex;
            },
            getAnswerChoices: function () {
                return angular.copy(_answerChoices);
            },
            updateAnswerGroup: function (index, updates, callback) {
                _updateAnswerGroup(index, updates, callback);
            },
            deleteAnswerGroup: function (index, callback) {
                _answerGroupsMemento = angular.copy(_answerGroups);
                _answerGroups.splice(index, 1);
                _activeAnswerGroupIndex = -1;
                _saveAnswerGroups(_answerGroups);
                callback(_answerGroupsMemento);
            },
            updateActiveAnswerGroup: function (updates, callback) {
                _updateAnswerGroup(_activeAnswerGroupIndex, updates, callback);
            },
            updateDefaultOutcome: function (updates, callback) {
                var outcome = _defaultOutcome;
                if (updates.hasOwnProperty('feedback')) {
                    outcome.feedback = updates.feedback;
                }
                if (updates.hasOwnProperty('dest')) {
                    outcome.dest = updates.dest;
                }
                if (updates.hasOwnProperty('refresherExplorationId')) {
                    outcome.refresherExplorationId = updates.refresherExplorationId;
                }
                if (updates.hasOwnProperty('missingPrerequisiteSkillId')) {
                    outcome.missingPrerequisiteSkillId =
                        updates.missingPrerequisiteSkillId;
                }
                if (updates.hasOwnProperty('labelledAsCorrect')) {
                    outcome.labelledAsCorrect = updates.labelledAsCorrect;
                }
                _saveDefaultOutcome(outcome);
                callback(_defaultOutcomeMemento);
            },
            updateConfirmedUnclassifiedAnswers: function (confirmedUnclassifiedAnswers) {
                _saveConfirmedUnclassifiedAnswers(confirmedUnclassifiedAnswers);
            },
            // Updates answer choices when the interaction requires it -- for
            // example, the rules for multiple choice need to refer to the multiple
            // choice interaction's customization arguments.
            updateAnswerChoices: function (newAnswerChoices, callback) {
                var oldAnswerChoices = angular.copy(_answerChoices);
                _answerChoices = newAnswerChoices;
                // If the interaction is ItemSelectionInput, update the answer groups
                // to refer to the new answer options.
                if (StateInteractionIdService.savedMemento === 'ItemSelectionInput' &&
                    oldAnswerChoices) {
                    // We use an approximate algorithm here. If the length of the answer
                    // choices array remains the same, and no choice is replicated at
                    // different indices in both arrays (which indicates that some
                    // moving-around happened), then replace any old choice with its
                    // corresponding new choice. Otherwise, we simply remove any answer
                    // that has not been changed. This is not foolproof, but it should
                    // cover most cases.
                    //
                    // TODO(sll): Find a way to make this fully deterministic. This can
                    // probably only occur after we support custom editors for
                    // interactions.
                    var onlyEditsHappened = false;
                    if (oldAnswerChoices.length === newAnswerChoices.length) {
                        onlyEditsHappened = true;
                        // Check that no answer choice appears to have been moved.
                        var numAnswerChoices = oldAnswerChoices.length;
                        for (var i = 0; i < numAnswerChoices; i++) {
                            for (var j = 0; j < numAnswerChoices; j++) {
                                if (i !== j &&
                                    oldAnswerChoices[i].val === newAnswerChoices[j].val) {
                                    onlyEditsHappened = false;
                                    break;
                                }
                            }
                        }
                    }
                    var oldChoiceStrings = oldAnswerChoices.map(function (choice) {
                        return choice.val;
                    });
                    var newChoiceStrings = newAnswerChoices.map(function (choice) {
                        return choice.val;
                    });
                    var key, newInputValue;
                    _answerGroups.forEach(function (answerGroup, answerGroupIndex) {
                        var newRules = angular.copy(answerGroup.rules);
                        newRules.forEach(function (rule) {
                            for (key in rule.inputs) {
                                newInputValue = [];
                                rule.inputs[key].forEach(function (item) {
                                    var newIndex = newChoiceStrings.indexOf(item);
                                    if (newIndex !== -1) {
                                        newInputValue.push(item);
                                    }
                                    else if (onlyEditsHappened) {
                                        var oldIndex = oldChoiceStrings.indexOf(item);
                                        if (oldIndex !== -1) {
                                            newInputValue.push(newAnswerChoices[oldIndex].val);
                                        }
                                    }
                                });
                                rule.inputs[key] = newInputValue;
                            }
                        });
                        _updateAnswerGroup(answerGroupIndex, {
                            rules: newRules
                        }, callback);
                    });
                }
                // If the interaction is DragAndDropSortInput, update the answer groups
                // to refer to the new answer options.
                if (StateInteractionIdService.savedMemento === 'DragAndDropSortInput' &&
                    oldAnswerChoices) {
                    // If the length of the answer choices array changes, then there is
                    // surely any deletion or modification or addition in the array. We
                    // simply set answer groups to refer to default value. If the length
                    // of the answer choices array remains the same and all the choices in
                    // the previous array are present, then no change is required.
                    // However, if any of the choices is not present, we set answer groups
                    // to refer to the default value containing new answer choices.
                    var anyChangesHappened = false;
                    if (oldAnswerChoices.length !== newAnswerChoices.length) {
                        anyChangesHappened = true;
                    }
                    else {
                        // Check if any modification happened in answer choices.
                        var numAnswerChoices = oldAnswerChoices.length;
                        for (var i = 0; i < numAnswerChoices; i++) {
                            var choiceIsPresent = false;
                            for (var j = 0; j < numAnswerChoices; j++) {
                                if (oldAnswerChoices[i].val === newAnswerChoices[j].val) {
                                    choiceIsPresent = true;
                                    break;
                                }
                            }
                            if (choiceIsPresent === false) {
                                anyChangesHappened = true;
                                break;
                            }
                        }
                    }
                    if (anyChangesHappened) {
                        _answerGroups.forEach(function (answerGroup, answerGroupIndex) {
                            var newRules = angular.copy(answerGroup.rules);
                            newRules.forEach(function (rule) {
                                if (rule.type === 'HasElementXAtPositionY') {
                                    for (key in rule.inputs) {
                                        newInputValue = '';
                                        if (key === 'y') {
                                            newInputValue = 1;
                                        }
                                        rule.inputs[key] = newInputValue;
                                    }
                                }
                                else if (rule.type === 'HasElementXBeforeElementY') {
                                    for (key in rule.inputs) {
                                        newInputValue = '';
                                        rule.inputs[key] = newInputValue;
                                    }
                                }
                                else {
                                    for (key in rule.inputs) {
                                        newInputValue = [];
                                        rule.inputs[key] = newInputValue;
                                    }
                                }
                            });
                            _updateAnswerGroup(answerGroupIndex, {
                                rules: newRules
                            }, callback);
                        });
                    }
                }
            },
            getAnswerGroups: function () {
                return angular.copy(_answerGroups);
            },
            getAnswerGroup: function (index) {
                return angular.copy(_answerGroups[index]);
            },
            getAnswerGroupCount: function () {
                return _answerGroups.length;
            },
            getDefaultOutcome: function () {
                return angular.copy(_defaultOutcome);
            },
            getConfirmedUnclassifiedAnswers: function () {
                return angular.copy(_confirmedUnclassifiedAnswers);
            },
            // This registers the change to the handlers in the list of changes.
            save: function (newAnswerGroups, defaultOutcome, callback) {
                _saveAnswerGroups(newAnswerGroups);
                _saveDefaultOutcome(defaultOutcome);
                callback(_answerGroupsMemento, _defaultOutcomeMemento);
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/solution-validity/solution-validity.service.ts":
/*!*********************************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/solution-validity/solution-validity.service.ts ***!
  \*********************************************************************************************************************************************************************/
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
// Service for keeping track of solution validity.
angular.module('explorationEditorTabModule').factory('SolutionValidityService', [
    function () {
        return {
            init: function (stateNames) {
                this.solutionValidities = {};
                var self = this;
                stateNames.forEach(function (stateName) {
                    self.solutionValidities[stateName] = true;
                });
            },
            onRenameState: function (newStateName, oldStateName) {
                this.solutionValidities[newStateName] =
                    this.solutionValidities[oldStateName];
                this.deleteSolutionValidity(oldStateName);
            },
            updateValidity: function (stateName, solutionIsValid) {
                this.solutionValidities[stateName] = solutionIsValid;
            },
            isSolutionValid: function (stateName) {
                if (this.solutionValidities.hasOwnProperty(stateName)) {
                    return this.solutionValidities[stateName];
                }
            },
            deleteSolutionValidity: function (stateName) {
                delete this.solutionValidities[stateName];
            },
            getAllValidities: function () {
                return this.solutionValidities;
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/solution-verification/solution-verification.service.ts":
/*!*****************************************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/solution-verification/solution-verification.service.ts ***!
  \*****************************************************************************************************************************************************************************/
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
 * @fileoverview Service for solution verification.
 */
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-page-services/angular-name/angular-name.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/angular-name/angular-name.service.ts");
__webpack_require__(/*! pages/exploration_player/AnswerClassificationService.ts */ "./core/templates/dev/head/pages/exploration_player/AnswerClassificationService.ts");
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/responses.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab-services/responses.service.ts");
angular.module('explorationEditorTabModule').factory('SolutionVerificationService', [
    '$injector', 'AngularNameService', 'AnswerClassificationService',
    'StateEditorService',
    function ($injector, AngularNameService, AnswerClassificationService, StateEditorService) {
        return {
            verifySolution: function (stateName, interaction, correctAnswer) {
                var interactionId = interaction.id;
                var rulesServiceName = (AngularNameService.getNameOfInteractionRulesService(interactionId));
                var rulesService = $injector.get(rulesServiceName);
                var result = (AnswerClassificationService.getMatchingClassificationResult(stateName, interaction, correctAnswer, rulesService));
                if (StateEditorService.isInQuestionMode()) {
                    return result.outcome.labelledAsCorrect;
                }
                return stateName !== result.outcome.dest;
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/state-editor/state-editor-properties-services/state-property/state-property.service.ts":
/*!******************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/state-editor/state-editor-properties-services/state-property/state-property.service.ts ***!
  \******************************************************************************************************************************/
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
 * @fileoverview Standalone services for the general state editor page.
 */
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('stateEditorModule').factory('StatePropertyService', [
    '$log', 'AlertsService',
    function ($log, AlertsService) {
        // Public base API for data services corresponding to state properties
        // (interaction id, content, etc.)
        // WARNING: This should be initialized only in the context of the state
        // editor, and every time the state is loaded, so that proper behavior is
        // maintained if e.g. the state is renamed.
        return {
            init: function (stateName, value) {
                if (this.setterMethodKey === null) {
                    throw 'State property setter method key cannot be null.';
                }
                // The name of the state.
                this.stateName = stateName;
                // The current value of the property (which may not have been saved to
                // the frontend yet). In general, this will be bound directly to the UI.
                this.displayed = angular.copy(value);
                // The previous (saved-in-the-frontend) value of the property. Here,
                // 'saved' means that this is the latest value of the property as
                // determined by the frontend change list.
                this.savedMemento = angular.copy(value);
            },
            // Returns whether the current value has changed from the memento.
            hasChanged: function () {
                return !angular.equals(this.savedMemento, this.displayed);
            },
            // The name of the setter method in ExplorationStatesService for this
            // property. THIS MUST BE SPECIFIED BY SUBCLASSES.
            setterMethodKey: null,
            // Transforms the given value into a normalized form. THIS CAN BE
            // OVERRIDDEN BY SUBCLASSES. The default behavior is to do nothing.
            _normalize: function (value) {
                return value;
            },
            // Validates the given value and returns a boolean stating whether it
            // is valid or not. THIS CAN BE OVERRIDDEN BY SUBCLASSES. The default
            // behavior is to always return true.
            _isValid: function (value) {
                return true;
            },
            // Updates the memento to the displayed value.
            saveDisplayedValue: function () {
                if (this.setterMethodKey === null) {
                    throw 'State property setter method key cannot be null.';
                }
                this.displayed = this._normalize(this.displayed);
                if (!this._isValid(this.displayed) || !this.hasChanged()) {
                    this.restoreFromMemento();
                    return;
                }
                if (angular.equals(this.displayed, this.savedMemento)) {
                    return;
                }
                AlertsService.clearWarnings();
                this.savedMemento = angular.copy(this.displayed);
            },
            // Reverts the displayed value to the saved memento.
            restoreFromMemento: function () {
                this.displayed = angular.copy(this.savedMemento);
            }
        };
    }
]);
oppia.constant('WARNING_TYPES', {
    // These must be fixed before the exploration can be saved.
    CRITICAL: 'critical',
    // These must be fixed before publishing an exploration to the public
    // library.
    ERROR: 'error'
});
oppia.constant('STATE_ERROR_MESSAGES', {
    ADD_INTERACTION: 'Please add an interaction to this card.',
    STATE_UNREACHABLE: 'This card is unreachable.',
    UNABLE_TO_END_EXPLORATION: ('There\'s no way to complete the exploration starting from this card. ' +
        'To fix this, make sure that the last card in the chain starting from ' +
        'this one has an \'End Exploration\' question type.'),
    INCORRECT_SOLUTION: ('The current solution does not lead to another card.'),
    UNRESOLVED_ANSWER: ('There is an answer among the top 10 which has no explicit feedback.')
});


/***/ }),

/***/ "./core/templates/dev/head/services/ExplorationFeaturesService.ts":
/*!************************************************************************!*\
  !*** ./core/templates/dev/head/services/ExplorationFeaturesService.ts ***!
  \************************************************************************/
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
 * @fileoverview Service for determining the visibility of advanced features in
 *               the exploration editor.
 */
oppia.factory('ExplorationFeaturesService', [function () {
        var settings = {
            areParametersEnabled: false,
            isImprovementsTabEnabled: false,
            isPlaythroughRecordingEnabled: false,
        };
        return {
            init: function (explorationData, featuresData) {
                settings.isImprovementsTabEnabled =
                    featuresData.is_improvements_tab_enabled;
                settings.isPlaythroughRecordingEnabled =
                    featuresData.is_exploration_whitelisted;
                if (explorationData.param_changes &&
                    explorationData.param_changes.length > 0) {
                    this.enableParameters();
                }
                else {
                    for (var state in explorationData.states) {
                        if (explorationData.states[state].param_changes.length > 0) {
                            this.enableParameters();
                            break;
                        }
                    }
                }
            },
            areParametersEnabled: function () {
                return settings.areParametersEnabled;
            },
            isImprovementsTabEnabled: function () {
                return settings.isImprovementsTabEnabled;
            },
            isPlaythroughRecordingEnabled: function () {
                return settings.isPlaythroughRecordingEnabled;
            },
            enableParameters: function () {
                settings.areParametersEnabled = true;
            },
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/services/LocalStorageService.ts":
/*!*****************************************************************!*\
  !*** ./core/templates/dev/head/services/LocalStorageService.ts ***!
  \*****************************************************************/
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
 * @fileoverview Utility service for saving data locally on the client machine.
 */
__webpack_require__(/*! domain/exploration/ExplorationDraftObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/ExplorationDraftObjectFactory.ts");
// Service for saving exploration draft changes to local storage.
//
// Note that the draft is only saved if localStorage exists and works
// (i.e. has storage capacity).
oppia.factory('LocalStorageService', [
    'ExplorationDraftObjectFactory',
    function (ExplorationDraftObjectFactory) {
        // Check that local storage exists and works as expected.
        // If it does storage stores the localStorage object,
        // else storage is undefined or false.
        var storage = (function () {
            var test = 'test';
            var result;
            try {
                localStorage.setItem(test, test);
                result = localStorage.getItem(test) === test;
                localStorage.removeItem(test);
                return result && localStorage;
            }
            catch (exception) { }
        }());
        /**
         * Create the key to access the changeList in localStorage
         * @param {String} explorationId - The exploration id of the changeList
         *   to be accessed.
         */
        var _createExplorationDraftKey = function (explorationId) {
            return 'draft_' + explorationId;
        };
        return {
            /**
             * Check that localStorage is available to the client.
             * @returns {boolean} true iff the client has access to localStorage.
             */
            isStorageAvailable: function () {
                return Boolean(storage);
            },
            /**
             * Save the given changeList to localStorage along with its
             * draftChangeListId
             * @param {String} explorationId - The id of the exploration
             *   associated with the changeList to be saved.
             * @param {List} changeList - The exploration change list to be saved.
             * @param {Integer} draftChangeListId - The id of the draft to be saved.
             */
            saveExplorationDraft: function (explorationId, changeList, draftChangeListId) {
                var localSaveKey = _createExplorationDraftKey(explorationId);
                if (storage) {
                    var draftDict = ExplorationDraftObjectFactory.toLocalStorageDict(changeList, draftChangeListId);
                    storage.setItem(localSaveKey, JSON.stringify(draftDict));
                }
            },
            /**
             * Retrieve the local save of the changeList associated with the given
             * exploration id.
             * @param {String} explorationId - The exploration id of the change list
             *   to be retrieved.
             * @returns {Object} The local save draft object if it exists,
             *   else null.
             */
            getExplorationDraft: function (explorationId) {
                if (storage) {
                    var draftDict = JSON.parse(storage.getItem(_createExplorationDraftKey(explorationId)));
                    if (draftDict) {
                        return ExplorationDraftObjectFactory.createFromLocalStorageDict(draftDict);
                    }
                }
                return null;
            },
            /**
             * Remove the local save of the changeList associated with the given
             * exploration id.
             * @param {String} explorationId - The exploration id of the change list
             *   to be removed.
             */
            removeExplorationDraft: function (explorationId) {
                if (storage) {
                    storage.removeItem(_createExplorationDraftKey(explorationId));
                }
            }
        };
    }
]);


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvbG9hZGluZy1kb3RzL2xvYWRpbmctZG90cy5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1kaXJlY3RpdmVzL3NlbGVjdDItZHJvcGRvd24vc2VsZWN0Mi1kcm9wZG93bi5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2NvbGxlY3Rpb24vQ29sbGVjdGlvblJpZ2h0c0JhY2tlbmRBcGlTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9jb2xsZWN0aW9uL0NvbGxlY3Rpb25SaWdodHNPYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9jb2xsZWN0aW9uL0NvbGxlY3Rpb25VcGRhdGVTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9jb2xsZWN0aW9uL0NvbGxlY3Rpb25WYWxpZGF0aW9uU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vY29sbGVjdGlvbi9FZGl0YWJsZUNvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vY29sbGVjdGlvbi9TZWFyY2hFeHBsb3JhdGlvbnNCYWNrZW5kQXBpU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vZXhwbG9yYXRpb24vRXhwbG9yYXRpb25EcmFmdE9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3N1bW1hcnkvRXhwbG9yYXRpb25TdW1tYXJ5QmFja2VuZEFwaVNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvY29sbGVjdGlvbl9lZGl0b3IvQ29sbGVjdGlvbkVkaXRvci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9jb2xsZWN0aW9uX2VkaXRvci9Db2xsZWN0aW9uRWRpdG9yTmF2YmFyQnJlYWRjcnVtYkRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9jb2xsZWN0aW9uX2VkaXRvci9Db2xsZWN0aW9uRWRpdG9yTmF2YmFyRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2NvbGxlY3Rpb25fZWRpdG9yL0NvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvY29sbGVjdGlvbl9lZGl0b3IvZWRpdG9yX3RhYi9Db2xsZWN0aW9uRWRpdG9yVGFiRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2NvbGxlY3Rpb25fZWRpdG9yL2VkaXRvcl90YWIvQ29sbGVjdGlvbkxpbmVhcml6ZXJTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2NvbGxlY3Rpb25fZWRpdG9yL2VkaXRvcl90YWIvQ29sbGVjdGlvbk5vZGVDcmVhdG9yRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2NvbGxlY3Rpb25fZWRpdG9yL2VkaXRvcl90YWIvQ29sbGVjdGlvbk5vZGVFZGl0b3JEaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvY29sbGVjdGlvbl9lZGl0b3IvaGlzdG9yeV90YWIvQ29sbGVjdGlvbkhpc3RvcnlUYWJEaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvY29sbGVjdGlvbl9lZGl0b3Ivc2V0dGluZ3NfdGFiL0NvbGxlY3Rpb25EZXRhaWxzRWRpdG9yRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2NvbGxlY3Rpb25fZWRpdG9yL3NldHRpbmdzX3RhYi9Db2xsZWN0aW9uUGVybWlzc2lvbnNDYXJkRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2NvbGxlY3Rpb25fZWRpdG9yL3NldHRpbmdzX3RhYi9Db2xsZWN0aW9uU2V0dGluZ3NUYWJEaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvY29sbGVjdGlvbl9lZGl0b3Ivc3RhdGlzdGljc190YWIvQ29sbGVjdGlvblN0YXRpc3RpY3NUYWJEaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2Utc2VydmljZXMvYW5ndWxhci1uYW1lL2FuZ3VsYXItbmFtZS5zZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlLXNlcnZpY2VzL2F1dG9zYXZlLWluZm8tbW9kYWxzLnNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2Utc2VydmljZXMvY2hhbmdlLWxpc3Quc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS1zZXJ2aWNlcy9jaGFuZ2VzLWluLWh1bWFuLXJlYWRhYmxlLWZvcm0uc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS1zZXJ2aWNlcy9leHBsb3JhdGlvbi1kYXRhL2V4cGxvcmF0aW9uLWRhdGEuc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS1zZXJ2aWNlcy9leHBsb3JhdGlvbi1pbml0LXN0YXRlLW5hbWUuc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS1zZXJ2aWNlcy9leHBsb3JhdGlvbi1wcm9wZXJ0eS5zZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlLXNlcnZpY2VzL2V4cGxvcmF0aW9uLXN0YXRlcy9leHBsb3JhdGlvbi1zdGF0ZXMuc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS1zZXJ2aWNlcy9yb3V0ZXIuc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9leHBsb3JhdGlvbi1lZGl0b3ItdGFiL2V4cGxvcmF0aW9uLWVkaXRvci10YWItc2VydmljZXMvYW5zd2VyLWdyb3Vwcy1jYWNoZS9hbnN3ZXItZ3JvdXBzLWNhY2hlLnNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZXhwbG9yYXRpb24tZWRpdG9yLXRhYi9leHBsb3JhdGlvbi1lZGl0b3ItdGFiLXNlcnZpY2VzL3Jlc3BvbnNlcy5zZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLWVkaXRvci10YWIvZXhwbG9yYXRpb24tZWRpdG9yLXRhYi1zZXJ2aWNlcy9zb2x1dGlvbi12YWxpZGl0eS9zb2x1dGlvbi12YWxpZGl0eS5zZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLWVkaXRvci10YWIvZXhwbG9yYXRpb24tZWRpdG9yLXRhYi1zZXJ2aWNlcy9zb2x1dGlvbi12ZXJpZmljYXRpb24vc29sdXRpb24tdmVyaWZpY2F0aW9uLnNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvc3RhdGUtZWRpdG9yL3N0YXRlLWVkaXRvci1wcm9wZXJ0aWVzLXNlcnZpY2VzL3N0YXRlLXByb3BlcnR5L3N0YXRlLXByb3BlcnR5LnNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvRXhwbG9yYXRpb25GZWF0dXJlc1NlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvTG9jYWxTdG9yYWdlU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxnQkFBUSxvQkFBb0I7QUFDNUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBaUIsNEJBQTRCO0FBQzdDO0FBQ0E7QUFDQSwwQkFBa0IsMkJBQTJCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGtEQUEwQyxnQ0FBZ0M7QUFDMUU7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxnRUFBd0Qsa0JBQWtCO0FBQzFFO0FBQ0EseURBQWlELGNBQWM7QUFDL0Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlEQUF5QyxpQ0FBaUM7QUFDMUUsd0hBQWdILG1CQUFtQixFQUFFO0FBQ3JJO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUNBQTJCLDBCQUEwQixFQUFFO0FBQ3ZELHlDQUFpQyxlQUFlO0FBQ2hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhEQUFzRCwrREFBK0Q7O0FBRXJIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBZ0IsdUJBQXVCO0FBQ3ZDOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDdEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckIsZ0NBQWdDO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBLHNDQUFzQyxFQUFFO0FBQ3hDO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0IseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQixpQkFBaUI7QUFDakI7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNySUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrRUFBa0U7QUFDbEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsb0lBQWtEO0FBQzFELG1CQUFPLENBQUMsZ0lBQWdEO0FBQ3hELG1CQUFPLENBQUMsd0hBQTRDO0FBQ3BEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3JQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsc0tBQW1FO0FBQzNFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxvSkFBMEQ7QUFDbEUsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQsbUJBQU8sQ0FBQyxzRkFBMkI7QUFDbkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLFFBQVE7QUFDM0I7QUFDQSxxQkFBcUIsUUFBUTtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLHNGQUEyQjtBQUNuQyxtQkFBTyxDQUFDLDhGQUErQjtBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0JBQStCLDJCQUEyQjtBQUMxRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsNEtBQXNFO0FBQzlFLG1CQUFPLENBQUMsd0pBQTREO0FBQ3BFLG1CQUFPLENBQUMsd0tBQW9FO0FBQzVFLG1CQUFPLENBQUMsNEtBQXNFO0FBQzlFLG1CQUFPLENBQUMsZ0xBQXdFO0FBQ2hGLG1CQUFPLENBQUMsd0xBQTRFO0FBQ3BGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JELG1CQUFPLENBQUMsa0pBQXlEO0FBQ2pFLG1CQUFPLENBQUMsb01BQ2U7QUFDdkIsbUJBQU8sQ0FBQyxvSEFBMEM7QUFDbEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLG9NQUMyQjtBQUNuQyxtQkFBTyxDQUFDLHdMQUN1QjtBQUMvQixtQkFBTyxDQUFDLGdKQUF3RDtBQUNoRSxtQkFBTyxDQUFDLDRIQUE4QztBQUN0RCxtQkFBTyxDQUFDLG9JQUFrRDtBQUMxRCxtQkFBTyxDQUFDLG9KQUEwRDtBQUNsRSxtQkFBTyxDQUFDLHdIQUE0QztBQUNwRCxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRCxtQkFBTyxDQUFDLGtKQUF5RDtBQUNqRSxtQkFBTyxDQUFDLG9NQUNlO0FBQ3ZCLG1CQUFPLENBQUMsc0ZBQTJCO0FBQ25DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdURBQXVELDJCQUEyQjtBQUNsRjtBQUNBO0FBQ0E7QUFDQSw2Q0FBNkM7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQzNNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDRIQUE4QztBQUN0RCxtQkFBTyxDQUFDLGdKQUF3RDtBQUNoRSxtQkFBTyxDQUFDLHdJQUFvRDtBQUM1RCxtQkFBTyxDQUFDLG9KQUEwRDtBQUNsRSxtQkFBTyxDQUFDLHdIQUE0QztBQUNwRCxtQkFBTyxDQUFDLHNGQUEyQjtBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDL0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyw0S0FBc0U7QUFDOUUsbUJBQU8sQ0FBQywwS0FBcUU7QUFDN0UsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQsbUJBQU8sQ0FBQyxrSkFBeUQ7QUFDakUsbUJBQU8sQ0FBQyxzS0FBbUU7QUFDM0U7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsNEhBQThDO0FBQ3REO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkIsMkJBQTJCO0FBQ3REO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLDJCQUEyQjtBQUN0RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNsSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLG9JQUFrRDtBQUMxRCxtQkFBTyxDQUFDLDRIQUE4QztBQUN0RCxtQkFBTyxDQUFDLG9KQUEwRDtBQUNsRSxtQkFBTyxDQUFDLDhJQUF1RDtBQUMvRCxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRCxtQkFBTyxDQUFDLDhKQUErRDtBQUN2RSxtQkFBTyxDQUFDLGtKQUF5RDtBQUNqRSxtQkFBTyxDQUFDLHNLQUFtRTtBQUMzRSxtQkFBTyxDQUFDLHNGQUEyQjtBQUNuQyxtQkFBTyxDQUFDLG9HQUFrQztBQUMxQyxtQkFBTyxDQUFDLDhGQUErQjtBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlDQUFpQztBQUNqQztBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6Qix1Q0FBdUMsaUNBQWlDO0FBQ3hFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDMUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsNEhBQThDO0FBQ3RELG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JELG1CQUFPLENBQUMsa0pBQXlEO0FBQ2pFLG1CQUFPLENBQUMsc0tBQW1FO0FBQzNFLG1CQUFPLENBQUMsc0ZBQTJCO0FBQ25DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0NBQXNDLEVBQUU7QUFDeEM7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxvTUFDMkI7QUFDbkMsbUJBQU8sQ0FBQyw0SEFBOEM7QUFDdEQsbUJBQU8sQ0FBQyxvSUFBa0Q7QUFDMUQsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQsbUJBQU8sQ0FBQyxrSkFBeUQ7QUFDakUsbUJBQU8sQ0FBQyxzRkFBMkI7QUFDbkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUNBQXVDLGlCQUFpQjtBQUN4RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQsbUJBQU8sQ0FBQyxrSkFBeUQ7QUFDakU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLG9MQUEwRTtBQUNsRixtQkFBTyxDQUFDLHdMQUE0RTtBQUNwRixtQkFBTyxDQUFDLDBIQUE2QztBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQ0FBc0MsRUFBRTtBQUN4QztBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNDQUFzQyxFQUFFO0FBQ3hDO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDekJMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRCxtQkFBTyxDQUFDLG9QQUN1QztBQUMvQyxtQkFBTyxDQUFDLDBQQUMwQztBQUNsRCxtQkFBTyxDQUFDLGtHQUFpQztBQUN6QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUNBQWlDO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQSxpQkFBaUI7QUFDakI7QUFDQSxpQkFBaUI7QUFDakI7QUFDQSxpQkFBaUI7QUFDakI7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQSxpQkFBaUI7QUFDakI7QUFDQSxpQkFBaUI7QUFDakI7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLGdPQUM2QjtBQUNyQyxtQkFBTyxDQUFDLDBQQUMwQztBQUNsRCxtQkFBTyxDQUFDLHNGQUEyQjtBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QixPQUFPO0FBQzlCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsT0FBTztBQUM5QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLE9BQU87QUFDOUI7QUFDQSx1QkFBdUIsT0FBTztBQUM5Qix1QkFBdUIsT0FBTztBQUM5QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLE9BQU87QUFDOUIsdUJBQXVCLE9BQU87QUFDOUIsdUJBQXVCLE9BQU87QUFDOUIsdUJBQXVCLE9BQU87QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsT0FBTztBQUM5QjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsT0FBTztBQUM5Qix1QkFBdUIsT0FBTztBQUM5QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDM05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxvRkFBMEI7QUFDbEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsd0pBQTREO0FBQ3BFLG1CQUFPLENBQUMsd0pBQTREO0FBQ3BFLG1CQUFPLENBQUMsc0ZBQTJCO0FBQ25DLG1CQUFPLENBQUMsa0dBQWlDO0FBQ3pDLG1CQUFPLENBQUMsc0dBQW1DO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrRUFBa0U7QUFDbEU7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLDBCQUEwQjtBQUNqRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlEQUFpRCx3Q0FBd0MsR0FBRztBQUM1RiwrQ0FBK0MsOEJBQThCLEdBQUc7QUFDaEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0EsMERBQTBEO0FBQzFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUNBQWlDO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QixPQUFPO0FBQzlCO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QixPQUFPO0FBQzlCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDeEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxnT0FDNkI7QUFDckM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDhNQUNvQjtBQUM1QixtQkFBTyxDQUFDLHNGQUEyQjtBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLHNIQUEyQztBQUNuRCxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRCxtQkFBTyxDQUFDLDhKQUErRDtBQUN2RSxtQkFBTyxDQUFDLDBPQUFxRztBQUM3RyxtQkFBTyxDQUFDLDhNQUF1RjtBQUMvRixtQkFBTyxDQUFDLDhPQUF1RztBQUMvRyxtQkFBTyxDQUFDLDBTQUFxSTtBQUM3SSxtQkFBTyxDQUFDLGtKQUF5RDtBQUNqRSxtQkFBTyxDQUFDLHNQQUNrRDtBQUMxRCxtQkFBTyxDQUFDLHNGQUEyQjtBQUNuQyxtQkFBTyxDQUFDLHdGQUE0QjtBQUNwQyxtQkFBTyxDQUFDLDhGQUErQjtBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0EsK0JBQStCLDZCQUE2QjtBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDdGJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyw4T0FDb0M7QUFDNUMsbUJBQU8sQ0FBQyxrUUFDOEM7QUFDdEQsbUJBQU8sQ0FBQyxzUEFDa0Q7QUFDMUQsbUJBQU8sQ0FBQyxnSEFBd0M7QUFDaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLDhCQUE4QjtBQUNqRCwwQkFBMEIsNENBQTRDO0FBQ3RFLHNCQUFzQixvQ0FBb0M7QUFDMUQsdUJBQXVCLHNDQUFzQztBQUM3RCxvQkFBb0IsZ0NBQWdDO0FBQ3BELDJCQUEyQiw4Q0FBOEM7QUFDekUsc0JBQXNCLG9DQUFvQztBQUMxRCx1QkFBdUIsc0NBQXNDO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUMvT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7Ozs7Ozs7Ozs7OztBQ3RDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyx3SEFBNEM7QUFDcEQsbUJBQU8sQ0FBQyxrVEFFNEI7QUFDcEMsbUJBQU8sQ0FBQywwU0FFMEI7QUFDbEMsbUJBQU8sQ0FBQywwVEFFOEI7QUFDdEMsbUJBQU8sQ0FBQyxzUEFDa0Q7QUFDMUQsbUJBQU8sQ0FBQyw0TkFDdUI7QUFDL0IsbUJBQU8sQ0FBQyxzRkFBMkI7QUFDbkMsbUJBQU8sQ0FBQyx3RkFBNEI7QUFDcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBdUMsc0JBQXNCO0FBQzdELDJDQUEyQyxzQkFBc0I7QUFDakU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUNBQWlDO0FBQ2pDO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QixxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBdUMsc0JBQXNCO0FBQzdEO0FBQ0EsMkNBQTJDLHNCQUFzQjtBQUNqRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQTtBQUNBLDZCQUE2QjtBQUM3Qix5QkFBeUI7QUFDekI7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNqWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsME9BQ2tDO0FBQzFDLG1CQUFPLENBQUMsa0pBQXlEO0FBQ2pFLG1CQUFPLENBQUMsc1BBQ2tEO0FBQzFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxzRkFBMkI7QUFDbkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDOzs7Ozs7Ozs7Ozs7QUNoR0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDdkRMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwSUFBcUQ7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0I7QUFDL0IsU0FBUztBQUNUO0FBQ0E7QUFDQSxtQkFBbUIsT0FBTztBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCLFFBQVE7QUFDakM7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QixPQUFPO0FBQzlCO0FBQ0EsdUJBQXVCLEtBQUs7QUFDNUIsdUJBQXVCLFFBQVE7QUFDL0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLE9BQU87QUFDOUI7QUFDQSx5QkFBeUIsT0FBTztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsT0FBTztBQUM5QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJjb2xsZWN0aW9uX2VkaXRvci5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBpbnN0YWxsIGEgSlNPTlAgY2FsbGJhY2sgZm9yIGNodW5rIGxvYWRpbmdcbiBcdGZ1bmN0aW9uIHdlYnBhY2tKc29ucENhbGxiYWNrKGRhdGEpIHtcbiBcdFx0dmFyIGNodW5rSWRzID0gZGF0YVswXTtcbiBcdFx0dmFyIG1vcmVNb2R1bGVzID0gZGF0YVsxXTtcbiBcdFx0dmFyIGV4ZWN1dGVNb2R1bGVzID0gZGF0YVsyXTtcblxuIFx0XHQvLyBhZGQgXCJtb3JlTW9kdWxlc1wiIHRvIHRoZSBtb2R1bGVzIG9iamVjdCxcbiBcdFx0Ly8gdGhlbiBmbGFnIGFsbCBcImNodW5rSWRzXCIgYXMgbG9hZGVkIGFuZCBmaXJlIGNhbGxiYWNrXG4gXHRcdHZhciBtb2R1bGVJZCwgY2h1bmtJZCwgaSA9IDAsIHJlc29sdmVzID0gW107XG4gXHRcdGZvcig7aSA8IGNodW5rSWRzLmxlbmd0aDsgaSsrKSB7XG4gXHRcdFx0Y2h1bmtJZCA9IGNodW5rSWRzW2ldO1xuIFx0XHRcdGlmKGluc3RhbGxlZENodW5rc1tjaHVua0lkXSkge1xuIFx0XHRcdFx0cmVzb2x2ZXMucHVzaChpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF1bMF0pO1xuIFx0XHRcdH1cbiBcdFx0XHRpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0gPSAwO1xuIFx0XHR9XG4gXHRcdGZvcihtb2R1bGVJZCBpbiBtb3JlTW9kdWxlcykge1xuIFx0XHRcdGlmKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtb3JlTW9kdWxlcywgbW9kdWxlSWQpKSB7XG4gXHRcdFx0XHRtb2R1bGVzW21vZHVsZUlkXSA9IG1vcmVNb2R1bGVzW21vZHVsZUlkXTtcbiBcdFx0XHR9XG4gXHRcdH1cbiBcdFx0aWYocGFyZW50SnNvbnBGdW5jdGlvbikgcGFyZW50SnNvbnBGdW5jdGlvbihkYXRhKTtcblxuIFx0XHR3aGlsZShyZXNvbHZlcy5sZW5ndGgpIHtcbiBcdFx0XHRyZXNvbHZlcy5zaGlmdCgpKCk7XG4gXHRcdH1cblxuIFx0XHQvLyBhZGQgZW50cnkgbW9kdWxlcyBmcm9tIGxvYWRlZCBjaHVuayB0byBkZWZlcnJlZCBsaXN0XG4gXHRcdGRlZmVycmVkTW9kdWxlcy5wdXNoLmFwcGx5KGRlZmVycmVkTW9kdWxlcywgZXhlY3V0ZU1vZHVsZXMgfHwgW10pO1xuXG4gXHRcdC8vIHJ1biBkZWZlcnJlZCBtb2R1bGVzIHdoZW4gYWxsIGNodW5rcyByZWFkeVxuIFx0XHRyZXR1cm4gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKTtcbiBcdH07XG4gXHRmdW5jdGlvbiBjaGVja0RlZmVycmVkTW9kdWxlcygpIHtcbiBcdFx0dmFyIHJlc3VsdDtcbiBcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGRlZmVycmVkTW9kdWxlcy5sZW5ndGg7IGkrKykge1xuIFx0XHRcdHZhciBkZWZlcnJlZE1vZHVsZSA9IGRlZmVycmVkTW9kdWxlc1tpXTtcbiBcdFx0XHR2YXIgZnVsZmlsbGVkID0gdHJ1ZTtcbiBcdFx0XHRmb3IodmFyIGogPSAxOyBqIDwgZGVmZXJyZWRNb2R1bGUubGVuZ3RoOyBqKyspIHtcbiBcdFx0XHRcdHZhciBkZXBJZCA9IGRlZmVycmVkTW9kdWxlW2pdO1xuIFx0XHRcdFx0aWYoaW5zdGFsbGVkQ2h1bmtzW2RlcElkXSAhPT0gMCkgZnVsZmlsbGVkID0gZmFsc2U7XG4gXHRcdFx0fVxuIFx0XHRcdGlmKGZ1bGZpbGxlZCkge1xuIFx0XHRcdFx0ZGVmZXJyZWRNb2R1bGVzLnNwbGljZShpLS0sIDEpO1xuIFx0XHRcdFx0cmVzdWx0ID0gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSBkZWZlcnJlZE1vZHVsZVswXSk7XG4gXHRcdFx0fVxuIFx0XHR9XG4gXHRcdHJldHVybiByZXN1bHQ7XG4gXHR9XG5cbiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIG9iamVjdCB0byBzdG9yZSBsb2FkZWQgYW5kIGxvYWRpbmcgY2h1bmtzXG4gXHQvLyB1bmRlZmluZWQgPSBjaHVuayBub3QgbG9hZGVkLCBudWxsID0gY2h1bmsgcHJlbG9hZGVkL3ByZWZldGNoZWRcbiBcdC8vIFByb21pc2UgPSBjaHVuayBsb2FkaW5nLCAwID0gY2h1bmsgbG9hZGVkXG4gXHR2YXIgaW5zdGFsbGVkQ2h1bmtzID0ge1xuIFx0XHRcImNvbGxlY3Rpb25fZWRpdG9yXCI6IDBcbiBcdH07XG5cbiBcdHZhciBkZWZlcnJlZE1vZHVsZXMgPSBbXTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0dmFyIGpzb25wQXJyYXkgPSB3aW5kb3dbXCJ3ZWJwYWNrSnNvbnBcIl0gPSB3aW5kb3dbXCJ3ZWJwYWNrSnNvbnBcIl0gfHwgW107XG4gXHR2YXIgb2xkSnNvbnBGdW5jdGlvbiA9IGpzb25wQXJyYXkucHVzaC5iaW5kKGpzb25wQXJyYXkpO1xuIFx0anNvbnBBcnJheS5wdXNoID0gd2VicGFja0pzb25wQ2FsbGJhY2s7XG4gXHRqc29ucEFycmF5ID0ganNvbnBBcnJheS5zbGljZSgpO1xuIFx0Zm9yKHZhciBpID0gMDsgaSA8IGpzb25wQXJyYXkubGVuZ3RoOyBpKyspIHdlYnBhY2tKc29ucENhbGxiYWNrKGpzb25wQXJyYXlbaV0pO1xuIFx0dmFyIHBhcmVudEpzb25wRnVuY3Rpb24gPSBvbGRKc29ucEZ1bmN0aW9uO1xuXG5cbiBcdC8vIGFkZCBlbnRyeSBtb2R1bGUgdG8gZGVmZXJyZWQgbGlzdFxuIFx0ZGVmZXJyZWRNb2R1bGVzLnB1c2goW1wiLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9jb2xsZWN0aW9uX2VkaXRvci9Db2xsZWN0aW9uRWRpdG9yLnRzXCIsXCJhYm91dH5hZG1pbn5hcHB+Y29sbGVjdGlvbl9lZGl0b3J+Y29sbGVjdGlvbl9wbGF5ZXJ+Y29udGFjdH5jcmVhdG9yX2Rhc2hib2FyZH5kb25hdGV+ZW1haWxfZGFzaGJvYXJkfmMxZTUwY2MwXCIsXCJhZG1pbn5hcHB+Y29sbGVjdGlvbl9lZGl0b3J+Y3JlYXRvcl9kYXNoYm9hcmR+ZXhwbG9yYXRpb25fZWRpdG9yfmV4cGxvcmF0aW9uX3BsYXllcn5za2lsbF9lZGl0b3J+c3RvfjdjNWUwMzZhXCIsXCJhZG1pbn5hcHB+Y29sbGVjdGlvbl9lZGl0b3J+Y3JlYXRvcl9kYXNoYm9hcmR+ZXhwbG9yYXRpb25fZWRpdG9yfmV4cGxvcmF0aW9uX3BsYXllcn5za2lsbF9lZGl0b3J+dG9wfjYxYmIyZGUxXCIsXCJhZG1pbn5jb2xsZWN0aW9uX2VkaXRvcn5jcmVhdG9yX2Rhc2hib2FyZH5leHBsb3JhdGlvbl9lZGl0b3J+ZXhwbG9yYXRpb25fcGxheWVyfnNraWxsX2VkaXRvcn50b3BpY19lfjNhNzI4MWQwXCIsXCJjb2xsZWN0aW9uX2VkaXRvcn5jcmVhdG9yX2Rhc2hib2FyZH5leHBsb3JhdGlvbl9lZGl0b3J+ZXhwbG9yYXRpb25fcGxheWVyfnNraWxsX2VkaXRvcn50b3BpY19lZGl0b3JcIixcImNvbGxlY3Rpb25fZWRpdG9yfnNraWxsX2VkaXRvcn5zdG9yeV9lZGl0b3J+dG9waWNfZWRpdG9yXCIsXCJjb2xsZWN0aW9uX2VkaXRvcn5jb2xsZWN0aW9uX3BsYXllclwiXSk7XG4gXHQvLyBydW4gZGVmZXJyZWQgbW9kdWxlcyB3aGVuIHJlYWR5XG4gXHRyZXR1cm4gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBkaXNwbGF5aW5nIGFuaW1hdGVkIGxvYWRpbmcgZG90cy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ2xvYWRpbmdEb3RzTW9kdWxlJykuZGlyZWN0aXZlKCdsb2FkaW5nRG90cycsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2xvYWRpbmctZG90cy8nICtcbiAgICAgICAgICAgICAgICAnbG9hZGluZy1kb3RzLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbZnVuY3Rpb24gKCkgeyB9XVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBzZWxlY3QyIGF1dG9jb21wbGV0ZSBjb21wb25lbnQuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdzZWxlY3QyRHJvcGRvd25Nb2R1bGUnKS5kaXJlY3RpdmUoJ3NlbGVjdDJEcm9wZG93bicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgLy8gRGlyZWN0aXZlIGZvciBpbmNvcnBvcmF0aW5nIHNlbGVjdDIgZHJvcGRvd25zLlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgLy8gV2hldGhlciB0byBhbGxvdyBtdWx0aXBsZSBjaG9pY2VzLiBJbiBvcmRlciB0byBkbyBzbywgdGhlIHZhbHVlIG9mXG4gICAgICAgICAgICAgICAgLy8gdGhpcyBhdHRyaWJ1dGUgbXVzdCBiZSB0aGUgZXhhY3Qgc3RyaW5nICd0cnVlJy5cbiAgICAgICAgICAgICAgICBhbGxvd011bHRpcGxlQ2hvaWNlczogJ0AnLFxuICAgICAgICAgICAgICAgIGNob2ljZXM6ICc9JyxcbiAgICAgICAgICAgICAgICAvLyBBbiBhZGRpdGlvbmFsIENTUyBjbGFzcyB0byBhZGQgdG8gdGhlIHNlbGVjdDIgZHJvcGRvd24uIE1heSBiZVxuICAgICAgICAgICAgICAgIC8vIHVuZGVmaW5lZC5cbiAgICAgICAgICAgICAgICBkcm9wZG93bkNzc0NsYXNzOiAnQCcsXG4gICAgICAgICAgICAgICAgLy8gQSBmdW5jdGlvbiB0aGF0IGZvcm1hdHMgYSBuZXcgc2VsZWN0aW9uLiBNYXkgYmUgdW5kZWZpbmVkLlxuICAgICAgICAgICAgICAgIGZvcm1hdE5ld1NlbGVjdGlvbjogJz0nLFxuICAgICAgICAgICAgICAgIC8vIFRoZSBtZXNzYWdlIHNob3duIHdoZW4gYW4gaW52YWxpZCBzZWFyY2ggdGVybSBpcyBlbnRlcmVkLiBNYXkgYmVcbiAgICAgICAgICAgICAgICAvLyB1bmRlZmluZWQsIGluIHdoaWNoIGNhc2UgdGhpcyBkZWZhdWx0cyB0byAnTm8gbWF0Y2hlcyBmb3VuZCcuXG4gICAgICAgICAgICAgICAgaW52YWxpZFNlYXJjaFRlcm1NZXNzYWdlOiAnQCcsXG4gICAgICAgICAgICAgICAgaXRlbTogJz0nLFxuICAgICAgICAgICAgICAgIC8vIFRoZSByZWdleCB1c2VkIHRvIHZhbGlkYXRlIG5ld2x5LWVudGVyZWQgY2hvaWNlcyB0aGF0IGRvIG5vdFxuICAgICAgICAgICAgICAgIC8vIGFscmVhZHkgZXhpc3QuIElmIGl0IGlzIHVuZGVmaW5lZCB0aGVuIGFsbCBuZXcgY2hvaWNlcyBhcmUgcmVqZWN0ZWQuXG4gICAgICAgICAgICAgICAgbmV3Q2hvaWNlUmVnZXg6ICdAJyxcbiAgICAgICAgICAgICAgICBvblNlbGVjdGlvbkNoYW5nZTogJyYnLFxuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyOiAnQCcsXG4gICAgICAgICAgICAgICAgd2lkdGg6ICdAJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtZGlyZWN0aXZlcy9zZWxlY3QyLWRyb3Bkb3duLycgK1xuICAgICAgICAgICAgICAgICdzZWxlY3QyLWRyb3Bkb3duLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsICckZWxlbWVudCcsIGZ1bmN0aW9uICgkc2NvcGUsICRlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5uZXdDaG9pY2VWYWxpZGF0b3IgPSBuZXcgUmVnRXhwKCRzY29wZS5uZXdDaG9pY2VSZWdleCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxlY3QyT3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93Q2xlYXI6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogJHNjb3BlLmNob2ljZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXBsZTogJHNjb3BlLmFsbG93TXVsdGlwbGVDaG9pY2VzID09PSAndHJ1ZScsXG4gICAgICAgICAgICAgICAgICAgICAgICB0YWdzOiAkc2NvcGUubmV3Q2hvaWNlUmVnZXggIT09IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyOiAkc2NvcGUucGxhY2Vob2xkZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogJHNjb3BlLndpZHRoIHx8ICcyNTBweCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBkcm9wZG93bkNzc0NsYXNzOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlVGFnOiBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcmFtcy50ZXJtLm1hdGNoKCRzY29wZS5uZXdDaG9pY2VWYWxpZGF0b3IpID8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogcGFyYW1zLnRlcm0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IHBhcmFtcy50ZXJtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSA6IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVSZXN1bHQ6IGZ1bmN0aW9uIChxdWVyeVJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkb2VzQ2hvaWNlTWF0Y2hUZXh0ID0gZnVuY3Rpb24gKGNob2ljZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2hvaWNlLmlkID09PSBxdWVyeVJlc3VsdC50ZXh0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5jaG9pY2VzICYmICRzY29wZS5jaG9pY2VzLnNvbWUoZG9lc0Nob2ljZU1hdGNoVGV4dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHF1ZXJ5UmVzdWx0LnRleHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmZvcm1hdE5ld1NlbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRzY29wZS5mb3JtYXROZXdTZWxlY3Rpb24ocXVlcnlSZXN1bHQudGV4dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcXVlcnlSZXN1bHQudGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBsYW5ndWFnZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vUmVzdWx0czogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmludmFsaWRTZWFyY2hUZXJtTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRzY29wZS5pbnZhbGlkU2VhcmNoVGVybU1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ05vIG1hdGNoZXMgZm91bmQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmRyb3Bkb3duQ3NzQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdDJPcHRpb25zLmRyb3Bkb3duQ3NzQ2xhc3MgPSAkc2NvcGUuZHJvcGRvd25Dc3NDbGFzcztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZWN0Mk5vZGUgPSAkZWxlbWVudFswXS5maXJzdENoaWxkO1xuICAgICAgICAgICAgICAgICAgICAvLyBJbml0aWFsaXplIHRoZSBkcm9wZG93bi5cbiAgICAgICAgICAgICAgICAgICAgJChzZWxlY3QyTm9kZSkuc2VsZWN0MihzZWxlY3QyT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgICQoc2VsZWN0Mk5vZGUpLnZhbCgkc2NvcGUuaXRlbSkudHJpZ2dlcignY2hhbmdlJyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSAkc2NvcGUuaXRlbSB3aGVuIHRoZSBzZWxlY3Rpb24gY2hhbmdlcy5cbiAgICAgICAgICAgICAgICAgICAgJChzZWxlY3QyTm9kZSkub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pdGVtID0gJChzZWxlY3QyTm9kZSkudmFsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUub25TZWxlY3Rpb25DaGFuZ2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIFJlc3BvbmQgdG8gZXh0ZXJuYWwgY2hhbmdlcyBpbiAkc2NvcGUuaXRlbVxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJHdhdGNoKCdpdGVtJywgZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKHNlbGVjdDJOb2RlKS52YWwobmV3VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIGNoYW5nZSB0aGUgcmlnaHRzIG9mIGNvbGxlY3Rpb25zIGluIHRoZSBiYWNrZW5kLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5vcHBpYS5mYWN0b3J5KCdDb2xsZWN0aW9uUmlnaHRzQmFja2VuZEFwaVNlcnZpY2UnLCBbXG4gICAgJyRodHRwJywgJyRsb2cnLCAnJHEnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgICdDT0xMRUNUSU9OX1JJR0hUU19VUkxfVEVNUExBVEUnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJGxvZywgJHEsIFVybEludGVycG9sYXRpb25TZXJ2aWNlLCBDT0xMRUNUSU9OX1JJR0hUU19VUkxfVEVNUExBVEUpIHtcbiAgICAgICAgLy8gTWFwcyBwcmV2aW91c2x5IGxvYWRlZCBjb2xsZWN0aW9uIHJpZ2h0cyB0byB0aGVpciBJRHMuXG4gICAgICAgIHZhciBjb2xsZWN0aW9uUmlnaHRzQ2FjaGUgPSB7fTtcbiAgICAgICAgdmFyIF9mZXRjaENvbGxlY3Rpb25SaWdodHMgPSBmdW5jdGlvbiAoY29sbGVjdGlvbklkLCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBjb2xsZWN0aW9uUmlnaHRzVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoQ09MTEVDVElPTl9SSUdIVFNfVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgY29sbGVjdGlvbl9pZDogY29sbGVjdGlvbklkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICRodHRwLmdldChjb2xsZWN0aW9uUmlnaHRzVXJsKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvclJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX3NldENvbGxlY3Rpb25TdGF0dXMgPSBmdW5jdGlvbiAoY29sbGVjdGlvbklkLCBjb2xsZWN0aW9uVmVyc2lvbiwgaXNQdWJsaWMsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIGNvbGxlY3Rpb25QdWJsaXNoVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoJy9jb2xsZWN0aW9uX2VkaXRvcl9oYW5kbGVyL3B1Ymxpc2gvPGNvbGxlY3Rpb25faWQ+Jywge1xuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25faWQ6IGNvbGxlY3Rpb25JZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgY29sbGVjdGlvblVucHVibGlzaFVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKCcvY29sbGVjdGlvbl9lZGl0b3JfaGFuZGxlci91bnB1Ymxpc2gvPGNvbGxlY3Rpb25faWQ+Jywge1xuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25faWQ6IGNvbGxlY3Rpb25JZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgcHV0UGFyYW1zID0ge1xuICAgICAgICAgICAgICAgIHZlcnNpb246IGNvbGxlY3Rpb25WZXJzaW9uXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIHJlcXVlc3RVcmwgPSAoaXNQdWJsaWMgPyBjb2xsZWN0aW9uUHVibGlzaFVybCA6IGNvbGxlY3Rpb25VbnB1Ymxpc2hVcmwpO1xuICAgICAgICAgICAgJGh0dHAucHV0KHJlcXVlc3RVcmwsIHB1dFBhcmFtcykudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBjb2xsZWN0aW9uUmlnaHRzQ2FjaGVbY29sbGVjdGlvbklkXSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrKGVycm9yUmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfaXNDYWNoZWQgPSBmdW5jdGlvbiAoY29sbGVjdGlvbklkKSB7XG4gICAgICAgICAgICByZXR1cm4gY29sbGVjdGlvblJpZ2h0c0NhY2hlLmhhc093blByb3BlcnR5KGNvbGxlY3Rpb25JZCk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEdldHMgYSBjb2xsZWN0aW9uJ3MgcmlnaHRzLCBnaXZlbiBpdHMgSUQuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZldGNoQ29sbGVjdGlvblJpZ2h0czogZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF9mZXRjaENvbGxlY3Rpb25SaWdodHMoY29sbGVjdGlvbklkLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQmVoYXZlcyBleGFjdGx5IGFzIGZldGNoQ29sbGVjdGlvblJpZ2h0cyAoaW5jbHVkaW5nIGNhbGxiYWNrXG4gICAgICAgICAgICAgKiBiZWhhdmlvciBhbmQgcmV0dXJuaW5nIGEgcHJvbWlzZSBvYmplY3QpLCBleGNlcHQgdGhpcyBmdW5jdGlvbiB3aWxsXG4gICAgICAgICAgICAgKiBhdHRlbXB0IHRvIHNlZSB3aGV0aGVyIHRoZSBnaXZlbiBjb2xsZWN0aW9uIHJpZ2h0cyBoYXMgYmVlblxuICAgICAgICAgICAgICogY2FjaGVkLiBJZiBpdCBoYXMgbm90IHlldCBiZWVuIGNhY2hlZCwgaXQgd2lsbCBmZXRjaCB0aGUgY29sbGVjdGlvblxuICAgICAgICAgICAgICogcmlnaHRzIGZyb20gdGhlIGJhY2tlbmQuIElmIGl0IHN1Y2Nlc3NmdWxseSByZXRyaWV2ZXMgdGhlIGNvbGxlY3Rpb25cbiAgICAgICAgICAgICAqIHJpZ2h0cyBmcm9tIHRoZSBiYWNrZW5kLCBpdCB3aWxsIHN0b3JlIGl0IGluIHRoZSBjYWNoZSB0byBhdm9pZFxuICAgICAgICAgICAgICogcmVxdWVzdHMgZnJvbSB0aGUgYmFja2VuZCBpbiBmdXJ0aGVyIGZ1bmN0aW9uIGNhbGxzLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBsb2FkQ29sbGVjdGlvblJpZ2h0czogZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfaXNDYWNoZWQoY29sbGVjdGlvbklkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc29sdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGNvbGxlY3Rpb25SaWdodHNDYWNoZVtjb2xsZWN0aW9uSWRdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9mZXRjaENvbGxlY3Rpb25SaWdodHMoY29sbGVjdGlvbklkLCBmdW5jdGlvbiAoY29sbGVjdGlvblJpZ2h0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNhdmUgdGhlIGZldGNoZWQgY29sbGVjdGlvbiByaWdodHMgdG8gYXZvaWQgZnV0dXJlIGZldGNoZXMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvblJpZ2h0c0NhY2hlW2NvbGxlY3Rpb25JZF0gPSBjb2xsZWN0aW9uUmlnaHRzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNvbHZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoY29sbGVjdGlvblJpZ2h0c0NhY2hlW2NvbGxlY3Rpb25JZF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gY29sbGVjdGlvbiByaWdodHMgaXMgc3RvcmVkIHdpdGhpbiB0aGVcbiAgICAgICAgICAgICAqIGxvY2FsIGRhdGEgY2FjaGUgb3IgaWYgaXQgbmVlZHMgdG8gYmUgcmV0cmlldmVkIGZyb20gdGhlIGJhY2tlbmRcbiAgICAgICAgICAgICAqIHVwb24gYSBsYW9kLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpc0NhY2hlZDogZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfaXNDYWNoZWQoY29sbGVjdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJlcGxhY2VzIHRoZSBjdXJyZW50IGNvbGxlY3Rpb24gcmlnaHRzIGluIHRoZSBjYWNoZSBnaXZlbiBieSB0aGVcbiAgICAgICAgICAgICAqIHNwZWNpZmllZCBjb2xsZWN0aW9uIElEIHdpdGggYSBuZXcgY29sbGVjdGlvbiByaWdodHMgb2JqZWN0LlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjYWNoZUNvbGxlY3Rpb25SaWdodHM6IGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQsIGNvbGxlY3Rpb25SaWdodHMpIHtcbiAgICAgICAgICAgICAgICBjb2xsZWN0aW9uUmlnaHRzQ2FjaGVbY29sbGVjdGlvbklkXSA9IGFuZ3VsYXIuY29weShjb2xsZWN0aW9uUmlnaHRzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFVwZGF0ZXMgYSBjb2xsZWN0aW9uJ3MgcmlnaHRzIHRvIGJlIGhhdmUgcHVibGljIGxlYXJuZXIgYWNjZXNzLCBnaXZlblxuICAgICAgICAgICAgICogaXRzIElEIGFuZCB2ZXJzaW9uLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzZXRDb2xsZWN0aW9uUHVibGljOiBmdW5jdGlvbiAoY29sbGVjdGlvbklkLCBjb2xsZWN0aW9uVmVyc2lvbikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF9zZXRDb2xsZWN0aW9uU3RhdHVzKGNvbGxlY3Rpb25JZCwgY29sbGVjdGlvblZlcnNpb24sIHRydWUsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBVcGRhdGVzIGEgY29sbGVjdGlvbidzIHJpZ2h0cyB0byBiZSBoYXZlIHByaXZhdGUgbGVhcm5lciBhY2Nlc3MsXG4gICAgICAgICAgICAgKiBnaXZlbiBpdHMgSUQgYW5kIHZlcnNpb24uXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNldENvbGxlY3Rpb25Qcml2YXRlOiBmdW5jdGlvbiAoY29sbGVjdGlvbklkLCBjb2xsZWN0aW9uVmVyc2lvbikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF9zZXRDb2xsZWN0aW9uU3RhdHVzKGNvbGxlY3Rpb25JZCwgY29sbGVjdGlvblZlcnNpb24sIGZhbHNlLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBjcmVhdGluZyBhbmQgbXV0YXRpbmcgaW5zdGFuY2VzIG9mIGZyb250ZW5kXG4gKiBjb2xsZWN0aW9uIHJpZ2h0cyBkb21haW4gb2JqZWN0cy5cbiAqL1xub3BwaWEuZmFjdG9yeSgnQ29sbGVjdGlvblJpZ2h0c09iamVjdEZhY3RvcnknLCBbXG4gICAgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgQ29sbGVjdGlvblJpZ2h0cyA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uUmlnaHRzT2JqZWN0KSB7XG4gICAgICAgICAgICB0aGlzLl9jb2xsZWN0aW9uSWQgPSBjb2xsZWN0aW9uUmlnaHRzT2JqZWN0LmNvbGxlY3Rpb25faWQ7XG4gICAgICAgICAgICB0aGlzLl9jYW5FZGl0ID0gY29sbGVjdGlvblJpZ2h0c09iamVjdC5jYW5fZWRpdDtcbiAgICAgICAgICAgIHRoaXMuX2NhblVucHVibGlzaCA9IGNvbGxlY3Rpb25SaWdodHNPYmplY3QuY2FuX3VucHVibGlzaDtcbiAgICAgICAgICAgIHRoaXMuX2lzUHJpdmF0ZSA9IGNvbGxlY3Rpb25SaWdodHNPYmplY3QuaXNfcHJpdmF0ZTtcbiAgICAgICAgICAgIHRoaXMuX293bmVyTmFtZXMgPSBjb2xsZWN0aW9uUmlnaHRzT2JqZWN0Lm93bmVyX25hbWVzO1xuICAgICAgICB9O1xuICAgICAgICAvLyBJbnN0YW5jZSBtZXRob2RzXG4gICAgICAgIENvbGxlY3Rpb25SaWdodHMucHJvdG90eXBlLmdldENvbGxlY3Rpb25JZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb2xsZWN0aW9uSWQ7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFJldHVybnMgdHJ1ZSBpZiB0aGUgdGhlIHVzZXIgY2FuIGVkaXQgdGhlIGNvbGxlY3Rpb24uIFRoaXMgcHJvcGVydHkgaXNcbiAgICAgICAgLy8gaW1tdXRhYmxlLlxuICAgICAgICBDb2xsZWN0aW9uUmlnaHRzLnByb3RvdHlwZS5jYW5FZGl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NhbkVkaXQ7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFJldHVybnMgdHJ1ZSBpZiB0aGUgdXNlciBjYW4gdW5wdWJsaXNoIHRoZSBjb2xsZWN0aW9uLlxuICAgICAgICBDb2xsZWN0aW9uUmlnaHRzLnByb3RvdHlwZS5jYW5VbnB1Ymxpc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY2FuVW5wdWJsaXNoO1xuICAgICAgICB9O1xuICAgICAgICAvLyBSZXR1cm5zIHRydWUgaWYgdGhlIGNvbGxlY3Rpb24gaXMgcHJpdmF0ZS5cbiAgICAgICAgQ29sbGVjdGlvblJpZ2h0cy5wcm90b3R5cGUuaXNQcml2YXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzUHJpdmF0ZTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gUmV0dXJucyB0cnVlIGlmIHRoZSBjb2xsZWN0aW9uIGlzIHB1YmxpYy5cbiAgICAgICAgQ29sbGVjdGlvblJpZ2h0cy5wcm90b3R5cGUuaXNQdWJsaWMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gIXRoaXMuX2lzUHJpdmF0ZTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gU2V0cyBpc1ByaXZhdGUgdG8gZmFsc2Ugb25seSBpZiB0aGUgdXNlciBjYW4gZWRpdCB0aGUgY29ycmVzcG9uZGluZ1xuICAgICAgICAvLyBjb2xsZWN0aW9uLlxuICAgICAgICBDb2xsZWN0aW9uUmlnaHRzLnByb3RvdHlwZS5zZXRQdWJsaWMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jYW5FZGl0KCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9pc1ByaXZhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVXNlciBpcyBub3QgYWxsb3dlZCB0byBlZGl0IHRoaXMgY29sbGVjdGlvbi4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLy8gU2V0cyBpc1ByaXZhdGUgdG8gdHJ1ZSBvbmx5IGlmIGNhblVucHVibGlzaCBhbmQgY2FuRWRpdCBhcmUgYm90aCB0cnVlLlxuICAgICAgICBDb2xsZWN0aW9uUmlnaHRzLnByb3RvdHlwZS5zZXRQcml2YXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuY2FuRWRpdCgpICYmIHRoaXMuY2FuVW5wdWJsaXNoKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9pc1ByaXZhdGUgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVc2VyIGlzIG5vdCBhbGxvd2VkIHRvIHVucHVibGlzaCB0aGlzIGNvbGxlY3Rpb24uJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8vIFJldHVybnMgdGhlIG93bmVyIG5hbWVzIG9mIHRoZSBjb2xsZWN0aW9uLiBUaGlzIHByb3BlcnR5IGlzIGltbXV0YWJsZS5cbiAgICAgICAgQ29sbGVjdGlvblJpZ2h0cy5wcm90b3R5cGUuZ2V0T3duZXJOYW1lcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmNvcHkodGhpcy5fb3duZXJOYW1lcyk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFJldHVybnMgdGhlIHJlZmVyZW5jZSB0byB0aGUgaW50ZXJuYWwgb3duZXJOYW1lcyBhcnJheTsgdGhpcyBmdW5jdGlvbiBpc1xuICAgICAgICAvLyBvbmx5IG1lYW50IHRvIGJlIHVzZWQgZm9yIEFuZ3VsYXIgYmluZGluZ3MgYW5kIHNob3VsZCBuZXZlciBiZSB1c2VkIGluXG4gICAgICAgIC8vIGNvZGUuIFBsZWFzZSB1c2UgZ2V0T3duZXJOYW1lcygpIGFuZCByZWxhdGVkIGZ1bmN0aW9ucywgaW5zdGVhZC4gUGxlYXNlXG4gICAgICAgIC8vIGFsc28gYmUgYXdhcmUgdGhpcyBleHBvc2VzIGludGVybmFsIHN0YXRlIG9mIHRoZSBjb2xsZWN0aW9uIHJpZ2h0cyBkb21haW5cbiAgICAgICAgLy8gb2JqZWN0LCBzbyBjaGFuZ2VzIHRvIHRoZSBhcnJheSBpdHNlbGYgbWF5IGludGVybmFsbHkgYnJlYWsgdGhlIGRvbWFpblxuICAgICAgICAvLyBvYmplY3QuXG4gICAgICAgIENvbGxlY3Rpb25SaWdodHMucHJvdG90eXBlLmdldEJpbmRhYmxlT3duZXJOYW1lcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9vd25lck5hbWVzO1xuICAgICAgICB9O1xuICAgICAgICAvLyBTdGF0aWMgY2xhc3MgbWV0aG9kcy4gTm90ZSB0aGF0IFwidGhpc1wiIGlzIG5vdCBhdmFpbGFibGUgaW4gc3RhdGljXG4gICAgICAgIC8vIGNvbnRleHRzLiBUaGlzIGZ1bmN0aW9uIHRha2VzIGEgSlNPTiBvYmplY3Qgd2hpY2ggcmVwcmVzZW50cyBhIGJhY2tlbmRcbiAgICAgICAgLy8gY29sbGVjdGlvbiBweXRob24gZGljdC5cbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgQ29sbGVjdGlvblJpZ2h0c1snY3JlYXRlJ10gPSBmdW5jdGlvbiAoY29sbGVjdGlvblJpZ2h0c0JhY2tlbmRPYmplY3QpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICByZXR1cm4gbmV3IENvbGxlY3Rpb25SaWdodHMoYW5ndWxhci5jb3B5KGNvbGxlY3Rpb25SaWdodHNCYWNrZW5kT2JqZWN0KSk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFJlYXNzaWducyBhbGwgdmFsdWVzIHdpdGhpbiB0aGlzIGNvbGxlY3Rpb24gdG8gbWF0Y2ggdGhlIGV4aXN0aW5nXG4gICAgICAgIC8vIGNvbGxlY3Rpb24gcmlnaHRzLiBUaGlzIGlzIHBlcmZvcm1lZCBhcyBhIGRlZXAgY29weSBzdWNoIHRoYXQgbm9uZSBvZiB0aGVcbiAgICAgICAgLy8gaW50ZXJuYWwsIGJpbmRhYmxlIG9iamVjdHMgYXJlIGNoYW5nZWQgd2l0aGluIHRoaXMgY29sbGVjdGlvbiByaWdodHMuXG4gICAgICAgIC8vIE5vdGUgdGhhdCB0aGUgY29sbGVjdGlvbiBub2RlcyB3aXRoaW4gdGhpcyBjb2xsZWN0aW9uIHdpbGwgYmUgY29tcGxldGVseVxuICAgICAgICAvLyByZWRlZmluZWQgYXMgY29waWVzIGZyb20gdGhlIHNwZWNpZmllZCBjb2xsZWN0aW9uIHJpZ2h0c1xuICAgICAgICBDb2xsZWN0aW9uUmlnaHRzLnByb3RvdHlwZS5jb3B5RnJvbUNvbGxlY3Rpb25SaWdodHMgPSBmdW5jdGlvbiAob3RoZXJDb2xsZWN0aW9uUmlnaHRzKSB7XG4gICAgICAgICAgICB0aGlzLl9jb2xsZWN0aW9uSWQgPSBvdGhlckNvbGxlY3Rpb25SaWdodHMuZ2V0Q29sbGVjdGlvbklkKCk7XG4gICAgICAgICAgICB0aGlzLl9jYW5FZGl0ID0gb3RoZXJDb2xsZWN0aW9uUmlnaHRzLmNhbkVkaXQoKTtcbiAgICAgICAgICAgIHRoaXMuX2lzUHJpdmF0ZSA9IG90aGVyQ29sbGVjdGlvblJpZ2h0cy5pc1ByaXZhdGUoKTtcbiAgICAgICAgICAgIHRoaXMuX2NhblVucHVibGlzaCA9IG90aGVyQ29sbGVjdGlvblJpZ2h0cy5jYW5VbnB1Ymxpc2goKTtcbiAgICAgICAgICAgIHRoaXMuX293bmVyTmFtZXMgPSBvdGhlckNvbGxlY3Rpb25SaWdodHMuZ2V0T3duZXJOYW1lcygpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBDcmVhdGUgYSBuZXcsIGVtcHR5IGNvbGxlY3Rpb24gcmlnaHRzIG9iamVjdC4gVGhpcyBpcyBub3QgZ3VhcmFudGVlZCB0b1xuICAgICAgICAvLyBwYXNzIHZhbGlkYXRpb24gdGVzdHMuXG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIENvbGxlY3Rpb25SaWdodHNbJ2NyZWF0ZUVtcHR5Q29sbGVjdGlvblJpZ2h0cyddID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIHJldHVybiBuZXcgQ29sbGVjdGlvblJpZ2h0cyh7XG4gICAgICAgICAgICAgICAgb3duZXJfbmFtZXM6IFtdXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIENvbGxlY3Rpb25SaWdodHM7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdG8gYnVpbGQgY2hhbmdlcyB0byBhIGNvbGxlY3Rpb24uIFRoZXNlIGNoYW5nZXMgbWF5XG4gKiB0aGVuIGJlIHVzZWQgYnkgb3RoZXIgc2VydmljZXMsIHN1Y2ggYXMgYSBiYWNrZW5kIEFQSSBzZXJ2aWNlIHRvIHVwZGF0ZSB0aGVcbiAqIGNvbGxlY3Rpb24gaW4gdGhlIGJhY2tlbmQuIFRoaXMgc2VydmljZSBhbHNvIHJlZ2lzdGVycyBhbGwgY2hhbmdlcyB3aXRoIHRoZVxuICogdW5kby9yZWRvIHNlcnZpY2UuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9jb2xsZWN0aW9uL0NvbGxlY3Rpb25Ob2RlT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL2VkaXRvci91bmRvX3JlZG8vQ2hhbmdlT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL2VkaXRvci91bmRvX3JlZG8vVW5kb1JlZG9TZXJ2aWNlLnRzJyk7XG4vLyBUaGVzZSBzaG91bGQgbWF0Y2ggdGhlIGNvbnN0YW50cyBkZWZpbmVkIGluIGNvcmUuZG9tYWluLmNvbGxlY3Rpb25fZG9tYWluLlxuLy8gVE9ETyhiaGVubmluZyk6IFRoZSB2YWx1ZXMgb2YgdGhlc2UgY29uc3RhbnRzIHNob3VsZCBiZSBwcm92aWRlZCBieSB0aGVcbi8vIGJhY2tlbmQuXG4vLyBOT1RFIFRPIERFVkVMT1BFUlM6IHRoZSBwcm9wZXJ0aWVzICdwcmVyZXF1aXNpdGVfc2tpbGxzJyBhbmRcbi8vICdhY3F1aXJlZF9za2lsbHMnIGFyZSBkZXByZWNhdGVkLiBEbyBub3QgdXNlIHRoZW0uXG5vcHBpYS5jb25zdGFudCgnQ01EX0FERF9DT0xMRUNUSU9OX05PREUnLCAnYWRkX2NvbGxlY3Rpb25fbm9kZScpO1xub3BwaWEuY29uc3RhbnQoJ0NNRF9TV0FQX0NPTExFQ1RJT05fTk9ERVMnLCAnc3dhcF9ub2RlcycpO1xub3BwaWEuY29uc3RhbnQoJ0NNRF9ERUxFVEVfQ09MTEVDVElPTl9OT0RFJywgJ2RlbGV0ZV9jb2xsZWN0aW9uX25vZGUnKTtcbm9wcGlhLmNvbnN0YW50KCdDTURfRURJVF9DT0xMRUNUSU9OX1BST1BFUlRZJywgJ2VkaXRfY29sbGVjdGlvbl9wcm9wZXJ0eScpO1xub3BwaWEuY29uc3RhbnQoJ0NNRF9FRElUX0NPTExFQ1RJT05fTk9ERV9QUk9QRVJUWScsICdlZGl0X2NvbGxlY3Rpb25fbm9kZV9wcm9wZXJ0eScpO1xub3BwaWEuY29uc3RhbnQoJ0NPTExFQ1RJT05fUFJPUEVSVFlfVElUTEUnLCAndGl0bGUnKTtcbm9wcGlhLmNvbnN0YW50KCdDT0xMRUNUSU9OX1BST1BFUlRZX0NBVEVHT1JZJywgJ2NhdGVnb3J5Jyk7XG5vcHBpYS5jb25zdGFudCgnQ09MTEVDVElPTl9QUk9QRVJUWV9PQkpFQ1RJVkUnLCAnb2JqZWN0aXZlJyk7XG5vcHBpYS5jb25zdGFudCgnQ09MTEVDVElPTl9QUk9QRVJUWV9MQU5HVUFHRV9DT0RFJywgJ2xhbmd1YWdlX2NvZGUnKTtcbm9wcGlhLmNvbnN0YW50KCdDT0xMRUNUSU9OX1BST1BFUlRZX1RBR1MnLCAndGFncycpO1xub3BwaWEuY29uc3RhbnQoJ0NNRF9BRERfQ09MTEVDVElPTl9TS0lMTCcsICdhZGRfY29sbGVjdGlvbl9za2lsbCcpO1xub3BwaWEuY29uc3RhbnQoJ0NNRF9ERUxFVEVfQ09MTEVDVElPTl9TS0lMTCcsICdkZWxldGVfY29sbGVjdGlvbl9za2lsbCcpO1xub3BwaWEuY29uc3RhbnQoJ0NPTExFQ1RJT05fTk9ERV9QUk9QRVJUWV9QUkVSRVFVSVNJVEVfU0tJTExfSURTJywgJ3ByZXJlcXVpc2l0ZV9za2lsbF9pZHMnKTtcbm9wcGlhLmNvbnN0YW50KCdDT0xMRUNUSU9OX05PREVfUFJPUEVSVFlfQUNRVUlSRURfU0tJTExfSURTJywgJ2FjcXVpcmVkX3NraWxsX2lkcycpO1xub3BwaWEuZmFjdG9yeSgnQ29sbGVjdGlvblVwZGF0ZVNlcnZpY2UnLCBbXG4gICAgJ0NoYW5nZU9iamVjdEZhY3RvcnknLFxuICAgICdDb2xsZWN0aW9uTm9kZU9iamVjdEZhY3RvcnknLCAnVW5kb1JlZG9TZXJ2aWNlJyxcbiAgICAnQ01EX0FERF9DT0xMRUNUSU9OX05PREUnLCAnQ01EX0FERF9DT0xMRUNUSU9OX1NLSUxMJyxcbiAgICAnQ01EX0RFTEVURV9DT0xMRUNUSU9OX05PREUnLCAnQ01EX0RFTEVURV9DT0xMRUNUSU9OX1NLSUxMJyxcbiAgICAnQ01EX0VESVRfQ09MTEVDVElPTl9OT0RFX1BST1BFUlRZJywgJ0NNRF9FRElUX0NPTExFQ1RJT05fUFJPUEVSVFknLFxuICAgICdDTURfU1dBUF9DT0xMRUNUSU9OX05PREVTJywgJ0NPTExFQ1RJT05fTk9ERV9QUk9QRVJUWV9BQ1FVSVJFRF9TS0lMTF9JRFMnLFxuICAgICdDT0xMRUNUSU9OX05PREVfUFJPUEVSVFlfUFJFUkVRVUlTSVRFX1NLSUxMX0lEUycsXG4gICAgJ0NPTExFQ1RJT05fUFJPUEVSVFlfQ0FURUdPUlknLCAnQ09MTEVDVElPTl9QUk9QRVJUWV9MQU5HVUFHRV9DT0RFJyxcbiAgICAnQ09MTEVDVElPTl9QUk9QRVJUWV9PQkpFQ1RJVkUnLFxuICAgICdDT0xMRUNUSU9OX1BST1BFUlRZX1RBR1MnLCAnQ09MTEVDVElPTl9QUk9QRVJUWV9USVRMRScsIGZ1bmN0aW9uIChDaGFuZ2VPYmplY3RGYWN0b3J5LCBDb2xsZWN0aW9uTm9kZU9iamVjdEZhY3RvcnksIFVuZG9SZWRvU2VydmljZSwgQ01EX0FERF9DT0xMRUNUSU9OX05PREUsIENNRF9BRERfQ09MTEVDVElPTl9TS0lMTCwgQ01EX0RFTEVURV9DT0xMRUNUSU9OX05PREUsIENNRF9ERUxFVEVfQ09MTEVDVElPTl9TS0lMTCwgQ01EX0VESVRfQ09MTEVDVElPTl9OT0RFX1BST1BFUlRZLCBDTURfRURJVF9DT0xMRUNUSU9OX1BST1BFUlRZLCBDTURfU1dBUF9DT0xMRUNUSU9OX05PREVTLCBDT0xMRUNUSU9OX05PREVfUFJPUEVSVFlfQUNRVUlSRURfU0tJTExfSURTLCBDT0xMRUNUSU9OX05PREVfUFJPUEVSVFlfUFJFUkVRVUlTSVRFX1NLSUxMX0lEUywgQ09MTEVDVElPTl9QUk9QRVJUWV9DQVRFR09SWSwgQ09MTEVDVElPTl9QUk9QRVJUWV9MQU5HVUFHRV9DT0RFLCBDT0xMRUNUSU9OX1BST1BFUlRZX09CSkVDVElWRSwgQ09MTEVDVElPTl9QUk9QRVJUWV9UQUdTLCBDT0xMRUNUSU9OX1BST1BFUlRZX1RJVExFKSB7XG4gICAgICAgIC8vIENyZWF0ZXMgYSBjaGFuZ2UgdXNpbmcgYW4gYXBwbHkgZnVuY3Rpb24sIHJldmVyc2UgZnVuY3Rpb24sIGEgY2hhbmdlXG4gICAgICAgIC8vIGNvbW1hbmQgYW5kIHJlbGF0ZWQgcGFyYW1ldGVycy4gVGhlIGNoYW5nZSBpcyBhcHBsaWVkIHRvIGEgZ2l2ZW5cbiAgICAgICAgLy8gY29sbGVjdGlvbi5cbiAgICAgICAgdmFyIF9hcHBseUNoYW5nZSA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBjb21tYW5kLCBwYXJhbXMsIGFwcGx5LCByZXZlcnNlKSB7XG4gICAgICAgICAgICB2YXIgY2hhbmdlRGljdCA9IGFuZ3VsYXIuY29weShwYXJhbXMpO1xuICAgICAgICAgICAgY2hhbmdlRGljdC5jbWQgPSBjb21tYW5kO1xuICAgICAgICAgICAgdmFyIGNoYW5nZU9iaiA9IENoYW5nZU9iamVjdEZhY3RvcnkuY3JlYXRlKGNoYW5nZURpY3QsIGFwcGx5LCByZXZlcnNlKTtcbiAgICAgICAgICAgIFVuZG9SZWRvU2VydmljZS5hcHBseUNoYW5nZShjaGFuZ2VPYmosIGNvbGxlY3Rpb24pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2dldFBhcmFtZXRlckZyb21DaGFuZ2VEaWN0ID0gZnVuY3Rpb24gKGNoYW5nZURpY3QsIHBhcmFtTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIGNoYW5nZURpY3RbcGFyYW1OYW1lXTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gQXBwbGllcyBhIGNvbGxlY3Rpb24gcHJvcGVydHkgY2hhbmdlLCBzcGVjaWZpY2FsbHkuIFNlZSBfYXBwbHlDaGFuZ2UoKVxuICAgICAgICAvLyBmb3IgZGV0YWlscyBvbiB0aGUgb3RoZXIgYmVoYXZpb3Igb2YgdGhpcyBmdW5jdGlvbi5cbiAgICAgICAgdmFyIF9hcHBseVByb3BlcnR5Q2hhbmdlID0gZnVuY3Rpb24gKGNvbGxlY3Rpb24sIHByb3BlcnR5TmFtZSwgbmV3VmFsdWUsIG9sZFZhbHVlLCBhcHBseSwgcmV2ZXJzZSkge1xuICAgICAgICAgICAgX2FwcGx5Q2hhbmdlKGNvbGxlY3Rpb24sIENNRF9FRElUX0NPTExFQ1RJT05fUFJPUEVSVFksIHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eV9uYW1lOiBwcm9wZXJ0eU5hbWUsXG4gICAgICAgICAgICAgICAgbmV3X3ZhbHVlOiBhbmd1bGFyLmNvcHkobmV3VmFsdWUpLFxuICAgICAgICAgICAgICAgIG9sZF92YWx1ZTogYW5ndWxhci5jb3B5KG9sZFZhbHVlKVxuICAgICAgICAgICAgfSwgYXBwbHksIHJldmVyc2UpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2dldE5ld1Byb3BlcnR5VmFsdWVGcm9tQ2hhbmdlRGljdCA9IGZ1bmN0aW9uIChjaGFuZ2VEaWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gX2dldFBhcmFtZXRlckZyb21DaGFuZ2VEaWN0KGNoYW5nZURpY3QsICduZXdfdmFsdWUnKTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gQXBwbGllcyBhIHByb3BlcnR5IGNoYW5nZSB0byBhIGNvbGxlY3Rpb24gbm9kZS4gU2VlIF9hcHBseUNoYW5nZXMoKSBmb3JcbiAgICAgICAgLy8gZGV0YWlscyBvbiB0aGUgb3RoZXIgYmVoYXZpb3Igb2YgdGhpcyBmdW5jdGlvbi5cbiAgICAgICAgdmFyIF9hcHBseU5vZGVQcm9wZXJ0eUNoYW5nZSA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBwcm9wZXJ0eU5hbWUsIGV4cGxvcmF0aW9uSWQsIG5ld1ZhbHVlLCBvbGRWYWx1ZSwgYXBwbHksIHJldmVyc2UpIHtcbiAgICAgICAgICAgIF9hcHBseUNoYW5nZShjb2xsZWN0aW9uLCBDTURfRURJVF9DT0xMRUNUSU9OX05PREVfUFJPUEVSVFksIHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eV9uYW1lOiBwcm9wZXJ0eU5hbWUsXG4gICAgICAgICAgICAgICAgZXhwbG9yYXRpb25faWQ6IGV4cGxvcmF0aW9uSWQsXG4gICAgICAgICAgICAgICAgbmV3X3ZhbHVlOiBhbmd1bGFyLmNvcHkobmV3VmFsdWUpLFxuICAgICAgICAgICAgICAgIG9sZF92YWx1ZTogYW5ndWxhci5jb3B5KG9sZFZhbHVlKVxuICAgICAgICAgICAgfSwgYXBwbHksIHJldmVyc2UpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2dldEV4cGxvcmF0aW9uSWRGcm9tQ2hhbmdlRGljdCA9IGZ1bmN0aW9uIChjaGFuZ2VEaWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gX2dldFBhcmFtZXRlckZyb21DaGFuZ2VEaWN0KGNoYW5nZURpY3QsICdleHBsb3JhdGlvbl9pZCcpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2dldEZpcnN0SW5kZXhGcm9tQ2hhbmdlRGljdCA9IGZ1bmN0aW9uIChjaGFuZ2VEaWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gX2dldFBhcmFtZXRlckZyb21DaGFuZ2VEaWN0KGNoYW5nZURpY3QsICdmaXJzdF9pbmRleCcpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2dldFNlY29uZEluZGV4RnJvbUNoYW5nZURpY3QgPSBmdW5jdGlvbiAoY2hhbmdlRGljdCkge1xuICAgICAgICAgICAgcmV0dXJuIF9nZXRQYXJhbWV0ZXJGcm9tQ2hhbmdlRGljdChjaGFuZ2VEaWN0LCAnc2Vjb25kX2luZGV4Jyk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRoZXNlIGZ1bmN0aW9ucyBhcmUgYXNzb2NpYXRlZCB3aXRoIHVwZGF0ZXMgYXZhaWxhYmxlIGluXG4gICAgICAgIC8vIGNvcmUuZG9tYWluLmNvbGxlY3Rpb25fc2VydmljZXMuYXBwbHlfY2hhbmdlX2xpc3QuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEFkZHMgYSBuZXcgZXhwbG9yYXRpb24gdG8gYSBjb2xsZWN0aW9uIGFuZCByZWNvcmRzIHRoZSBjaGFuZ2UgaW4gdGhlXG4gICAgICAgICAgICAgKiB1bmRvL3JlZG8gc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgYWRkQ29sbGVjdGlvbk5vZGU6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBleHBsb3JhdGlvbklkLCBleHBsb3JhdGlvblN1bW1hcnlCYWNrZW5kT2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgdmFyIG9sZFN1bW1hcnlCYWNrZW5kT2JqZWN0ID0gYW5ndWxhci5jb3B5KGV4cGxvcmF0aW9uU3VtbWFyeUJhY2tlbmRPYmplY3QpO1xuICAgICAgICAgICAgICAgIF9hcHBseUNoYW5nZShjb2xsZWN0aW9uLCBDTURfQUREX0NPTExFQ1RJT05fTk9ERSwge1xuICAgICAgICAgICAgICAgICAgICBleHBsb3JhdGlvbl9pZDogZXhwbG9yYXRpb25JZFxuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFwcGx5LlxuICAgICAgICAgICAgICAgICAgICB2YXIgZXhwbG9yYXRpb25JZCA9IF9nZXRFeHBsb3JhdGlvbklkRnJvbUNoYW5nZURpY3QoY2hhbmdlRGljdCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2xsZWN0aW9uTm9kZSA9IChDb2xsZWN0aW9uTm9kZU9iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUV4cGxvcmF0aW9uSWQoZXhwbG9yYXRpb25JZCkpO1xuICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uTm9kZS5zZXRFeHBsb3JhdGlvblN1bW1hcnlPYmplY3Qob2xkU3VtbWFyeUJhY2tlbmRPYmplY3QpO1xuICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uLmFkZENvbGxlY3Rpb25Ob2RlKGNvbGxlY3Rpb25Ob2RlKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAvLyBVbmRvLlxuICAgICAgICAgICAgICAgICAgICB2YXIgZXhwbG9yYXRpb25JZCA9IF9nZXRFeHBsb3JhdGlvbklkRnJvbUNoYW5nZURpY3QoY2hhbmdlRGljdCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24uZGVsZXRlQ29sbGVjdGlvbk5vZGUoZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3dhcE5vZGVzOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZmlyc3RJbmRleCwgc2Vjb25kSW5kZXgpIHtcbiAgICAgICAgICAgICAgICBfYXBwbHlDaGFuZ2UoY29sbGVjdGlvbiwgQ01EX1NXQVBfQ09MTEVDVElPTl9OT0RFUywge1xuICAgICAgICAgICAgICAgICAgICBmaXJzdF9pbmRleDogZmlyc3RJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgc2Vjb25kX2luZGV4OiBzZWNvbmRJbmRleFxuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFwcGx5LlxuICAgICAgICAgICAgICAgICAgICB2YXIgZmlyc3RJbmRleCA9IF9nZXRGaXJzdEluZGV4RnJvbUNoYW5nZURpY3QoY2hhbmdlRGljdCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWNvbmRJbmRleCA9IF9nZXRTZWNvbmRJbmRleEZyb21DaGFuZ2VEaWN0KGNoYW5nZURpY3QpO1xuICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uLnN3YXBDb2xsZWN0aW9uTm9kZXMoZmlyc3RJbmRleCwgc2Vjb25kSW5kZXgpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZG8uXG4gICAgICAgICAgICAgICAgICAgIHZhciBmaXJzdEluZGV4ID0gX2dldEZpcnN0SW5kZXhGcm9tQ2hhbmdlRGljdChjaGFuZ2VEaWN0KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlY29uZEluZGV4ID0gX2dldFNlY29uZEluZGV4RnJvbUNoYW5nZURpY3QoY2hhbmdlRGljdCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24uc3dhcENvbGxlY3Rpb25Ob2RlcyhmaXJzdEluZGV4LCBzZWNvbmRJbmRleCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZW1vdmVzIGFuIGV4cGxvcmF0aW9uIGZyb20gYSBjb2xsZWN0aW9uIGFuZCByZWNvcmRzIHRoZSBjaGFuZ2UgaW5cbiAgICAgICAgICAgICAqIHRoZSB1bmRvL3JlZG8gc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZGVsZXRlQ29sbGVjdGlvbk5vZGU6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9sZENvbGxlY3Rpb25Ob2RlID0gYW5ndWxhci5jb3B5KGNvbGxlY3Rpb24uZ2V0Q29sbGVjdGlvbk5vZGVCeUV4cGxvcmF0aW9uSWQoZXhwbG9yYXRpb25JZCkpO1xuICAgICAgICAgICAgICAgIF9hcHBseUNoYW5nZShjb2xsZWN0aW9uLCBDTURfREVMRVRFX0NPTExFQ1RJT05fTk9ERSwge1xuICAgICAgICAgICAgICAgICAgICBleHBsb3JhdGlvbl9pZDogZXhwbG9yYXRpb25JZFxuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFwcGx5LlxuICAgICAgICAgICAgICAgICAgICB2YXIgZXhwbG9yYXRpb25JZCA9IF9nZXRFeHBsb3JhdGlvbklkRnJvbUNoYW5nZURpY3QoY2hhbmdlRGljdCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24uZGVsZXRlQ29sbGVjdGlvbk5vZGUoZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5kby5cbiAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbi5hZGRDb2xsZWN0aW9uTm9kZShvbGRDb2xsZWN0aW9uTm9kZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDaGFuZ2VzIHRoZSB0aXRsZSBvZiBhIGNvbGxlY3Rpb24gYW5kIHJlY29yZHMgdGhlIGNoYW5nZSBpbiB0aGVcbiAgICAgICAgICAgICAqIHVuZG8vcmVkbyBzZXJ2aWNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzZXRDb2xsZWN0aW9uVGl0bGU6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCB0aXRsZSkge1xuICAgICAgICAgICAgICAgIHZhciBvbGRUaXRsZSA9IGFuZ3VsYXIuY29weShjb2xsZWN0aW9uLmdldFRpdGxlKCkpO1xuICAgICAgICAgICAgICAgIF9hcHBseVByb3BlcnR5Q2hhbmdlKGNvbGxlY3Rpb24sIENPTExFQ1RJT05fUFJPUEVSVFlfVElUTEUsIHRpdGxlLCBvbGRUaXRsZSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwbHlcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRpdGxlID0gX2dldE5ld1Byb3BlcnR5VmFsdWVGcm9tQ2hhbmdlRGljdChjaGFuZ2VEaWN0KTtcbiAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbi5zZXRUaXRsZSh0aXRsZSk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5kby5cbiAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbi5zZXRUaXRsZShvbGRUaXRsZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDaGFuZ2VzIHRoZSBjYXRlZ29yeSBvZiBhIGNvbGxlY3Rpb24gYW5kIHJlY29yZHMgdGhlIGNoYW5nZSBpbiB0aGVcbiAgICAgICAgICAgICAqIHVuZG8vcmVkbyBzZXJ2aWNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzZXRDb2xsZWN0aW9uQ2F0ZWdvcnk6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBjYXRlZ29yeSkge1xuICAgICAgICAgICAgICAgIHZhciBvbGRDYXRlZ29yeSA9IGFuZ3VsYXIuY29weShjb2xsZWN0aW9uLmdldENhdGVnb3J5KCkpO1xuICAgICAgICAgICAgICAgIF9hcHBseVByb3BlcnR5Q2hhbmdlKGNvbGxlY3Rpb24sIENPTExFQ1RJT05fUFJPUEVSVFlfQ0FURUdPUlksIGNhdGVnb3J5LCBvbGRDYXRlZ29yeSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwbHkuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjYXRlZ29yeSA9IF9nZXROZXdQcm9wZXJ0eVZhbHVlRnJvbUNoYW5nZURpY3QoY2hhbmdlRGljdCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24uc2V0Q2F0ZWdvcnkoY2F0ZWdvcnkpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZG8uXG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24uc2V0Q2F0ZWdvcnkob2xkQ2F0ZWdvcnkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2hhbmdlcyB0aGUgb2JqZWN0aXZlIG9mIGEgY29sbGVjdGlvbiBhbmQgcmVjb3JkcyB0aGUgY2hhbmdlIGluIHRoZVxuICAgICAgICAgICAgICogdW5kby9yZWRvIHNlcnZpY2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNldENvbGxlY3Rpb25PYmplY3RpdmU6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBvYmplY3RpdmUpIHtcbiAgICAgICAgICAgICAgICB2YXIgb2xkT2JqZWN0aXZlID0gYW5ndWxhci5jb3B5KGNvbGxlY3Rpb24uZ2V0T2JqZWN0aXZlKCkpO1xuICAgICAgICAgICAgICAgIF9hcHBseVByb3BlcnR5Q2hhbmdlKGNvbGxlY3Rpb24sIENPTExFQ1RJT05fUFJPUEVSVFlfT0JKRUNUSVZFLCBvYmplY3RpdmUsIG9sZE9iamVjdGl2ZSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwbHkuXG4gICAgICAgICAgICAgICAgICAgIHZhciBvYmplY3RpdmUgPSBfZ2V0TmV3UHJvcGVydHlWYWx1ZUZyb21DaGFuZ2VEaWN0KGNoYW5nZURpY3QpO1xuICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uLnNldE9iamVjdGl2ZShvYmplY3RpdmUpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZG8uXG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24uc2V0T2JqZWN0aXZlKG9sZE9iamVjdGl2ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDaGFuZ2VzIHRoZSBsYW5ndWFnZSBjb2RlIG9mIGEgY29sbGVjdGlvbiBhbmQgcmVjb3JkcyB0aGUgY2hhbmdlIGluXG4gICAgICAgICAgICAgKiB0aGUgdW5kby9yZWRvIHNlcnZpY2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNldENvbGxlY3Rpb25MYW5ndWFnZUNvZGU6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBsYW5ndWFnZUNvZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgb2xkTGFuZ3VhZ2VDb2RlID0gYW5ndWxhci5jb3B5KGNvbGxlY3Rpb24uZ2V0TGFuZ3VhZ2VDb2RlKCkpO1xuICAgICAgICAgICAgICAgIF9hcHBseVByb3BlcnR5Q2hhbmdlKGNvbGxlY3Rpb24sIENPTExFQ1RJT05fUFJPUEVSVFlfTEFOR1VBR0VfQ09ERSwgbGFuZ3VhZ2VDb2RlLCBvbGRMYW5ndWFnZUNvZGUsIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFwcGx5LlxuICAgICAgICAgICAgICAgICAgICB2YXIgbGFuZ3VhZ2VDb2RlID0gX2dldE5ld1Byb3BlcnR5VmFsdWVGcm9tQ2hhbmdlRGljdChjaGFuZ2VEaWN0KTtcbiAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbi5zZXRMYW5ndWFnZUNvZGUobGFuZ3VhZ2VDb2RlKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAvLyBVbmRvLlxuICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uLnNldExhbmd1YWdlQ29kZShvbGRMYW5ndWFnZUNvZGUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2hhbmdlcyB0aGUgdGFncyBvZiBhIGNvbGxlY3Rpb24gYW5kIHJlY29yZHMgdGhlIGNoYW5nZSBpblxuICAgICAgICAgICAgICogdGhlIHVuZG8vcmVkbyBzZXJ2aWNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzZXRDb2xsZWN0aW9uVGFnczogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIHRhZ3MpIHtcbiAgICAgICAgICAgICAgICB2YXIgb2xkVGFncyA9IGFuZ3VsYXIuY29weShjb2xsZWN0aW9uLmdldFRhZ3MoKSk7XG4gICAgICAgICAgICAgICAgX2FwcGx5UHJvcGVydHlDaGFuZ2UoY29sbGVjdGlvbiwgQ09MTEVDVElPTl9QUk9QRVJUWV9UQUdTLCB0YWdzLCBvbGRUYWdzLCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAvLyBBcHBseS5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhZ3MgPSBfZ2V0TmV3UHJvcGVydHlWYWx1ZUZyb21DaGFuZ2VEaWN0KGNoYW5nZURpY3QpO1xuICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uLnNldFRhZ3ModGFncyk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5kby5cbiAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbi5zZXRUYWdzKG9sZFRhZ3MpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBjaGFuZ2Ugb2JqZWN0IGNvbnN0cnVjdGVkIGJ5IHRoaXMgc2VydmljZVxuICAgICAgICAgICAgICogaXMgYWRkaW5nIGEgbmV3IGNvbGxlY3Rpb24gbm9kZSB0byBhIGNvbGxlY3Rpb24uXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGlzQWRkaW5nQ29sbGVjdGlvbk5vZGU6IGZ1bmN0aW9uIChjaGFuZ2VPYmplY3QpIHtcbiAgICAgICAgICAgICAgICB2YXIgYmFja2VuZENoYW5nZU9iamVjdCA9IGNoYW5nZU9iamVjdC5nZXRCYWNrZW5kQ2hhbmdlT2JqZWN0KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJhY2tlbmRDaGFuZ2VPYmplY3QuY21kID09PSBDTURfQUREX0NPTExFQ1RJT05fTk9ERTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHVybnMgdGhlIGV4cGxvcmF0aW9uIElEIHJlZmVyZW5jZWQgYnkgdGhlIHNwZWNpZmllZCBjaGFuZ2Ugb2JqZWN0LFxuICAgICAgICAgICAgICogb3IgdW5kZWZpbmVkIGlmIHRoZSBnaXZlbiBjaGFuZ2VPYmplY3QgZG9lcyBub3QgcmVmZXJlbmNlIGFuXG4gICAgICAgICAgICAgKiBleHBsb3JhdGlvbiBJRC4gVGhlIGNoYW5nZSBvYmplY3QgaXMgZXhwZWN0ZWQgdG8gYmUgb25lIGNvbnN0cnVjdGVkXG4gICAgICAgICAgICAgKiBieSB0aGlzIHNlcnZpY2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGdldEV4cGxvcmF0aW9uSWRGcm9tQ2hhbmdlT2JqZWN0OiBmdW5jdGlvbiAoY2hhbmdlT2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9nZXRFeHBsb3JhdGlvbklkRnJvbUNoYW5nZURpY3QoY2hhbmdlT2JqZWN0LmdldEJhY2tlbmRDaGFuZ2VPYmplY3QoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdG8gdmFsaWRhdGUgdGhlIGNvbnNpc3RlbmN5IG9mIGEgY29sbGVjdGlvbi4gVGhlc2VcbiAqIGNoZWNrcyBhcmUgcGVyZm9ybWFibGUgaW4gdGhlIGZyb250ZW5kIHRvIGF2b2lkIHNlbmRpbmcgYSBwb3RlbnRpYWxseSBpbnZhbGlkXG4gKiBjb2xsZWN0aW9uIHRvIHRoZSBiYWNrZW5kLCB3aGljaCBwZXJmb3JtcyBzaW1pbGFyIHZhbGlkYXRpb24gY2hlY2tzIHRvIHRoZXNlXG4gKiBpbiBjb2xsZWN0aW9uX2RvbWFpbi5Db2xsZWN0aW9uIGFuZCBzdWJzZXF1ZW50IGRvbWFpbiBvYmplY3RzLlxuICovXG5yZXF1aXJlKCdwYWdlcy9jb2xsZWN0aW9uX2VkaXRvci9lZGl0b3JfdGFiL0NvbGxlY3Rpb25MaW5lYXJpemVyU2VydmljZS50cycpO1xub3BwaWEuZmFjdG9yeSgnQ29sbGVjdGlvblZhbGlkYXRpb25TZXJ2aWNlJywgW1xuICAgICdDb2xsZWN0aW9uTGluZWFyaXplclNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChDb2xsZWN0aW9uTGluZWFyaXplclNlcnZpY2UpIHtcbiAgICAgICAgdmFyIF9nZXROb25leGlzdGVudEV4cGxvcmF0aW9uSWRzID0gZnVuY3Rpb24gKGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBjb2xsZWN0aW9uLmdldENvbGxlY3Rpb25Ob2RlcygpLmZpbHRlcihmdW5jdGlvbiAoY29sbGVjdGlvbk5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gIWNvbGxlY3Rpb25Ob2RlLmRvZXNFeHBsb3JhdGlvbkV4aXN0KCk7XG4gICAgICAgICAgICB9KS5tYXAoZnVuY3Rpb24gKGNvbGxlY3Rpb25Ob2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb25Ob2RlLmdldEV4cGxvcmF0aW9uSWQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2dldFByaXZhdGVFeHBsb3JhdGlvbklkcyA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gY29sbGVjdGlvbi5nZXRDb2xsZWN0aW9uTm9kZXMoKS5maWx0ZXIoZnVuY3Rpb24gKGNvbGxlY3Rpb25Ob2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb25Ob2RlLmlzRXhwbG9yYXRpb25Qcml2YXRlKCk7XG4gICAgICAgICAgICB9KS5tYXAoZnVuY3Rpb24gKGNvbGxlY3Rpb25Ob2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb25Ob2RlLmdldEV4cGxvcmF0aW9uSWQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICAvLyBWYWxpZGF0ZXMgdGhhdCB0aGUgdGFncyBmb3IgdGhlIGNvbGxlY3Rpb24gYXJlIGluIHRoZSBwcm9wZXIgZm9ybWF0LFxuICAgICAgICAvLyByZXR1cm5zIHRydWUgaWYgYWxsIHRhZ3MgYXJlIGluIHRoZSBjb3JyZWN0IGZvcm1hdC5cbiAgICAgICAgdmFyIHZhbGlkYXRlVGFnRm9ybWF0ID0gZnVuY3Rpb24gKHRhZ3MpIHtcbiAgICAgICAgICAgIC8vIENoZWNrIHRvIGVuc3VyZSB0aGF0IGFsbCB0YWdzIGZvbGxvdyB0aGUgZm9ybWF0IHNwZWNpZmllZCBpblxuICAgICAgICAgICAgLy8gVEFHX1JFR0VYLlxuICAgICAgICAgICAgdmFyIHRhZ1JlZ2V4ID0gbmV3IFJlZ0V4cChHTE9CQUxTLlRBR19SRUdFWCk7XG4gICAgICAgICAgICByZXR1cm4gdGFncy5ldmVyeShmdW5jdGlvbiAodGFnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRhZy5tYXRjaCh0YWdSZWdleCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVmFsaWRhdGVzIHRoYXQgdGhlIHRhZ3MgZm9yIHRoZSBjb2xsZWN0aW9uIGRvIG5vdCBoYXZlIGR1cGxpY2F0ZXMsXG4gICAgICAgIC8vIHJldHVybnMgdHJ1ZSBpZiB0aGVyZSBhcmUgbm8gZHVwbGljYXRlcy5cbiAgICAgICAgdmFyIHZhbGlkYXRlRHVwbGljYXRlVGFncyA9IGZ1bmN0aW9uICh0YWdzKSB7XG4gICAgICAgICAgICByZXR1cm4gdGFncy5ldmVyeShmdW5jdGlvbiAodGFnLCBpZHgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGFncy5pbmRleE9mKHRhZywgaWR4ICsgMSkgPT09IC0xO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFZhbGlkYXRlcyB0aGF0IHRoZSB0YWdzIGZvciB0aGUgY29sbGVjdGlvbiBhcmUgbm9ybWFsaXplZCxcbiAgICAgICAgLy8gcmV0dXJucyB0cnVlIGlmIGFsbCB0YWdzIHdlcmUgbm9ybWFsaXplZC5cbiAgICAgICAgdmFyIHZhbGlkYXRlVGFnc05vcm1hbGl6ZWQgPSBmdW5jdGlvbiAodGFncykge1xuICAgICAgICAgICAgcmV0dXJuIHRhZ3MuZXZlcnkoZnVuY3Rpb24gKHRhZykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0YWcgPT09IHRhZy50cmltKCkucmVwbGFjZSgvXFxzKy9nLCAnICcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfdmFsaWRhdGVDb2xsZWN0aW9uID0gZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGlzUHVibGljKSB7XG4gICAgICAgICAgICAvLyBOT1RFIFRPIERFVkVMT1BFUlM6IFBsZWFzZSBlbnN1cmUgdGhhdCB0aGlzIHZhbGlkYXRpb24gbG9naWMgaXMgdGhlXG4gICAgICAgICAgICAvLyBzYW1lIGFzIHRoYXQgaW4gY29yZS5kb21haW4uY29sbGVjdGlvbl9kb21haW4uQ29sbGVjdGlvbi52YWxpZGF0ZSgpLlxuICAgICAgICAgICAgdmFyIGlzc3VlcyA9IFtdO1xuICAgICAgICAgICAgdmFyIGNvbGxlY3Rpb25IYXNOb2RlcyA9IGNvbGxlY3Rpb24uZ2V0Q29sbGVjdGlvbk5vZGVDb3VudCgpID4gMDtcbiAgICAgICAgICAgIGlmICghY29sbGVjdGlvbkhhc05vZGVzKSB7XG4gICAgICAgICAgICAgICAgaXNzdWVzLnB1c2goJ1RoZXJlIHNob3VsZCBiZSBhdCBsZWFzdCAxIGV4cGxvcmF0aW9uIGluIHRoZSBjb2xsZWN0aW9uLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG5vbmV4aXN0ZW50RXhwSWRzID0gX2dldE5vbmV4aXN0ZW50RXhwbG9yYXRpb25JZHMoY29sbGVjdGlvbik7XG4gICAgICAgICAgICBpZiAobm9uZXhpc3RlbnRFeHBJZHMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgaXNzdWVzLnB1c2goJ1RoZSBmb2xsb3dpbmcgZXhwbG9yYXRpb24ocykgZWl0aGVyIGRvIG5vdCBleGlzdCwgb3IgeW91IGRvIG5vdCAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2hhdmUgZWRpdCBhY2Nlc3MgdG8gYWRkIHRoZW0gdG8gdGhpcyBjb2xsZWN0aW9uOiAnICtcbiAgICAgICAgICAgICAgICAgICAgbm9uZXhpc3RlbnRFeHBJZHMuam9pbignLCAnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNQdWJsaWMpIHtcbiAgICAgICAgICAgICAgICB2YXIgcHJpdmF0ZUV4cElkcyA9IF9nZXRQcml2YXRlRXhwbG9yYXRpb25JZHMoY29sbGVjdGlvbik7XG4gICAgICAgICAgICAgICAgaWYgKHByaXZhdGVFeHBJZHMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzc3Vlcy5wdXNoKCdQcml2YXRlIGV4cGxvcmF0aW9ucyBjYW5ub3QgYmUgYWRkZWQgdG8gYSBwdWJsaWMgY29sbGVjdGlvbjogJyArXG4gICAgICAgICAgICAgICAgICAgICAgICBwcml2YXRlRXhwSWRzLmpvaW4oJywgJykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBpc3N1ZXM7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHVybnMgYSBsaXN0IG9mIGVycm9yIHN0cmluZ3MgZm91bmQgd2hlbiB2YWxpZGF0aW5nIHRoZSBwcm92aWRlZFxuICAgICAgICAgICAgICogY29sbGVjdGlvbi4gVGhlIHZhbGlkYXRpb24gbWV0aG9kcyB1c2VkIGluIHRoaXMgZnVuY3Rpb24gYXJlIHdyaXR0ZW4gdG9cbiAgICAgICAgICAgICAqIG1hdGNoIHRoZSB2YWxpZGF0aW9ucyBwZXJmb3JtZWQgaW4gdGhlIGJhY2tlbmQuIFRoaXMgZnVuY3Rpb24gaXNcbiAgICAgICAgICAgICAqIGV4cGVuc2l2ZSwgc28gaXQgc2hvdWxkIGJlIGNhbGxlZCBzcGFyaW5nbHkuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZpbmRWYWxpZGF0aW9uSXNzdWVzRm9yUHJpdmF0ZUNvbGxlY3Rpb246IGZ1bmN0aW9uIChjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF92YWxpZGF0ZUNvbGxlY3Rpb24oY29sbGVjdGlvbiwgZmFsc2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQmVoYXZlcyBpbiB0aGUgc2FtZSB3YXkgYXMgZmluZFZhbGlkYXRpb25Jc3N1ZXNGb3JQcml2YXRlQ29sbGVjdGlvbigpLFxuICAgICAgICAgICAgICogZXhjZXB0IGFkZGl0aW9uYWwgdmFsaWRhdGlvbiBjaGVja3MgYXJlIHBlcmZvcm1lZCB3aGljaCBhcmUgc3BlY2lmaWMgdG9cbiAgICAgICAgICAgICAqIHB1YmxpYyBjb2xsZWN0aW9ucy4gVGhpcyBmdW5jdGlvbiBpcyBleHBlbnNpdmUsIHNvIGl0IHNob3VsZCBiZSBjYWxsZWRcbiAgICAgICAgICAgICAqIHNwYXJpbmdseS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZmluZFZhbGlkYXRpb25Jc3N1ZXNGb3JQdWJsaWNDb2xsZWN0aW9uOiBmdW5jdGlvbiAoY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgIHJldHVybiBfdmFsaWRhdGVDb2xsZWN0aW9uKGNvbGxlY3Rpb24sIHRydWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0dXJucyBmYWxzZSBpZiB0aGUgdGFncyBhcmUgbm90IHZhbGlkYXRlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpc1RhZ1ZhbGlkOiBmdW5jdGlvbiAodGFncykge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWxpZGF0ZVRhZ0Zvcm1hdCh0YWdzKSAmJiB2YWxpZGF0ZUR1cGxpY2F0ZVRhZ3ModGFncykgJiZcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGVUYWdzTm9ybWFsaXplZCh0YWdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE1IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0byBzZW5kIGNoYW5nZXMgdG8gYSBjb2xsZWN0aW9uIHRvIHRoZSBiYWNrZW5kLlxuICovXG5yZXF1aXJlKCdkb21haW4vY29sbGVjdGlvbi9SZWFkT25seUNvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuLy8gVE9ETyhiaGVubmluZyk6IEkgdGhpbmsgdGhhdCB0aGlzIG1pZ2h0IGJlIGJldHRlciBtZXJnZWQgd2l0aCB0aGVcbi8vIENvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZS4gSG93ZXZlciwgdGhhdCB2aW9sYXRlcyB0aGUgcHJpbmNpcGxlIG9mIGFcbi8vIGJhY2tlbmQgQVBJIHNlcnZpY2UgYmVpbmcgYXZhaWxhYmxlIGZvciBleGFjdGx5IG9uZSBVUkwuIFRvIGZpeCB0aGlzLCB0aGVcbi8vIGJhY2tlbmQgY29udHJvbGxlciBjb3VsZCBzdXBwb3J0IGJvdGggZ2V0IGFuZCBwdXQgYW5kIGJlIHB1bGxlZCBvdXQgb2YgdGhlXG4vLyBjb2xsZWN0aW9uIGxlYXJuZXIgYW5kIG1vdmVkIGludG8gaXRzIG93biBjb250cm9sbGVyLiBUaGlzIGlzIGEgbmV3IHBhdHRlcm5cbi8vIGZvciB0aGUgYmFja2VuZCwgYnV0IGl0IG1ha2VzIHNlbnNlIGJhc2VkIG9uIHRoZSB1c2FnZSBvZiB0aGUgZ2V0IEhUVFBcbi8vIHJlcXVlc3QgYnkgYm90aCB0aGUgbGVhcm5lciBhbmQgZWRpdG9yIHZpZXdzLiBUaGlzIHdvdWxkIHJlc3VsdCBpbiBvbmVcbi8vIGJhY2tlbmQgY29udHJvbGxlciAoZmlsZSBhbmQgY2xhc3MpIGZvciBoYW5kbGluZyByZXRyaWV2aW5nIGFuZCBjaGFuZ2luZ1xuLy8gY29sbGVjdGlvbiBkYXRhLCBhcyB3ZWxsIGFzIG9uZSBmcm9udGVuZCBzZXJ2aWNlIGZvciBpbnRlcmZhY2luZyB3aXRoIGl0LlxuLy8gRGlzY3VzcyBhbmQgZGVjaWRlIHdoZXRoZXIgdGhpcyBpcyBhIGdvb2QgYXBwcm9hY2ggYW5kIHRoZW4gcmVtb3ZlIHRoaXMgVE9ET1xuLy8gYWZ0ZXIgZGVjaWRpbmcgYW5kIGFjdGluZyB1cG9uIHRoZSBkZWNpc2lvbiAod2hpY2ggd291bGQgbWVhbiBpbXBsZW1lbnRpbmdcbi8vIGl0IGlmIGl0J3MgYWdyZWVkIHVwb24pLlxub3BwaWEuZmFjdG9yeSgnRWRpdGFibGVDb2xsZWN0aW9uQmFja2VuZEFwaVNlcnZpY2UnLCBbXG4gICAgJyRodHRwJywgJyRxJywgJ1JlYWRPbmx5Q29sbGVjdGlvbkJhY2tlbmRBcGlTZXJ2aWNlJyxcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCAnQ09MTEVDVElPTl9EQVRBX1VSTF9URU1QTEFURScsXG4gICAgJ0VESVRBQkxFX0NPTExFQ1RJT05fREFUQV9VUkxfVEVNUExBVEUnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJHEsIFJlYWRPbmx5Q29sbGVjdGlvbkJhY2tlbmRBcGlTZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgQ09MTEVDVElPTl9EQVRBX1VSTF9URU1QTEFURSwgRURJVEFCTEVfQ09MTEVDVElPTl9EQVRBX1VSTF9URU1QTEFURSkge1xuICAgICAgICB2YXIgX2ZldGNoQ29sbGVjdGlvbiA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIGNvbGxlY3Rpb25EYXRhVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoRURJVEFCTEVfQ09MTEVDVElPTl9EQVRBX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25faWQ6IGNvbGxlY3Rpb25JZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkaHR0cC5nZXQoY29sbGVjdGlvbkRhdGFVcmwpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbGxlY3Rpb24gPSBhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YS5jb2xsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhjb2xsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3JSZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF91cGRhdGVDb2xsZWN0aW9uID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCwgY29sbGVjdGlvblZlcnNpb24sIGNvbW1pdE1lc3NhZ2UsIGNoYW5nZUxpc3QsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIGVkaXRhYmxlQ29sbGVjdGlvbkRhdGFVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChFRElUQUJMRV9DT0xMRUNUSU9OX0RBVEFfVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgY29sbGVjdGlvbl9pZDogY29sbGVjdGlvbklkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBwdXREYXRhID0ge1xuICAgICAgICAgICAgICAgIHZlcnNpb246IGNvbGxlY3Rpb25WZXJzaW9uLFxuICAgICAgICAgICAgICAgIGNvbW1pdF9tZXNzYWdlOiBjb21taXRNZXNzYWdlLFxuICAgICAgICAgICAgICAgIGNoYW5nZV9saXN0OiBjaGFuZ2VMaXN0XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgJGh0dHAucHV0KGVkaXRhYmxlQ29sbGVjdGlvbkRhdGFVcmwsIHB1dERhdGEpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgLy8gVGhlIHJldHVybmVkIGRhdGEgaXMgYW4gdXBkYXRlZCBjb2xsZWN0aW9uIGRpY3QuXG4gICAgICAgICAgICAgICAgdmFyIGNvbGxlY3Rpb24gPSBhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YS5jb2xsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIFJlYWRPbmx5Q29sbGVjdGlvbkJhY2tlbmRBcGlTZXJ2aWNlJ3MgY2FjaGUgd2l0aCB0aGUgbmV3XG4gICAgICAgICAgICAgICAgLy8gY29sbGVjdGlvbi5cbiAgICAgICAgICAgICAgICBSZWFkT25seUNvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZS5jYWNoZUNvbGxlY3Rpb24oY29sbGVjdGlvbklkLCBjb2xsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhjb2xsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3JSZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZldGNoQ29sbGVjdGlvbjogZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF9mZXRjaENvbGxlY3Rpb24oY29sbGVjdGlvbklkLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogVXBkYXRlcyBhIGNvbGxlY3Rpb24gaW4gdGhlIGJhY2tlbmQgd2l0aCB0aGUgcHJvdmlkZWQgY29sbGVjdGlvbiBJRC5cbiAgICAgICAgICAgICAqIFRoZSBjaGFuZ2VzIG9ubHkgYXBwbHkgdG8gdGhlIGNvbGxlY3Rpb24gb2YgdGhlIGdpdmVuIHZlcnNpb24gYW5kIHRoZVxuICAgICAgICAgICAgICogcmVxdWVzdCB0byB1cGRhdGUgdGhlIGNvbGxlY3Rpb24gd2lsbCBmYWlsIGlmIHRoZSBwcm92aWRlZCBjb2xsZWN0aW9uXG4gICAgICAgICAgICAgKiB2ZXJzaW9uIGlzIG9sZGVyIHRoYW4gdGhlIGN1cnJlbnQgdmVyc2lvbiBzdG9yZWQgaW4gdGhlIGJhY2tlbmQuIEJvdGhcbiAgICAgICAgICAgICAqIHRoZSBjaGFuZ2VzIGFuZCB0aGUgbWVzc2FnZSB0byBhc3NvY2lhdGUgd2l0aCB0aG9zZSBjaGFuZ2VzIGFyZSB1c2VkXG4gICAgICAgICAgICAgKiB0byBjb21taXQgYSBjaGFuZ2UgdG8gdGhlIGNvbGxlY3Rpb24uIFRoZSBuZXcgY29sbGVjdGlvbiBpcyBwYXNzZWQgdG9cbiAgICAgICAgICAgICAqIHRoZSBzdWNjZXNzIGNhbGxiYWNrLCBpZiBvbmUgaXMgcHJvdmlkZWQgdG8gdGhlIHJldHVybmVkIHByb21pc2VcbiAgICAgICAgICAgICAqIG9iamVjdC4gRXJyb3JzIGFyZSBwYXNzZWQgdG8gdGhlIGVycm9yIGNhbGxiYWNrLCBpZiBvbmUgaXMgcHJvdmlkZWQuXG4gICAgICAgICAgICAgKiBGaW5hbGx5LCBpZiB0aGUgdXBkYXRlIGlzIHN1Y2Nlc3NmdWwsIHRoZSByZXR1cm5lZCBjb2xsZWN0aW9uIHdpbGwgYmVcbiAgICAgICAgICAgICAqIGNhY2hlZCB3aXRoaW4gdGhlIENvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZSB0byBlbnN1cmUgdGhlIGNhY2hlIGlzXG4gICAgICAgICAgICAgKiBub3Qgb3V0LW9mLWRhdGUgd2l0aCBhbnkgdXBkYXRlcyBtYWRlIGJ5IHRoaXMgYmFja2VuZCBBUEkgc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdXBkYXRlQ29sbGVjdGlvbjogZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCwgY29sbGVjdGlvblZlcnNpb24sIGNvbW1pdE1lc3NhZ2UsIGNoYW5nZUxpc3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfdXBkYXRlQ29sbGVjdGlvbihjb2xsZWN0aW9uSWQsIGNvbGxlY3Rpb25WZXJzaW9uLCBjb21taXRNZXNzYWdlLCBjaGFuZ2VMaXN0LCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIHNlYXJjaCBleHBsb3JhdGlvbnMgbWV0YWRhdGEuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbm9wcGlhLmZhY3RvcnkoJ1NlYXJjaEV4cGxvcmF0aW9uc0JhY2tlbmRBcGlTZXJ2aWNlJywgW1xuICAgICckaHR0cCcsICckcScsICdBbGVydHNTZXJ2aWNlJywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICAnU0VBUkNIX0VYUExPUkFUSU9OX1VSTF9URU1QTEFURScsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkcSwgQWxlcnRzU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIFNFQVJDSF9FWFBMT1JBVElPTl9VUkxfVEVNUExBVEUpIHtcbiAgICAgICAgdmFyIF9mZXRjaEV4cGxvcmF0aW9ucyA9IGZ1bmN0aW9uIChzZWFyY2hRdWVyeSwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgcXVlcnlVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChTRUFSQ0hfRVhQTE9SQVRJT05fVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgcXVlcnk6IGJ0b2Eoc2VhcmNoUXVlcnkpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICRodHRwLmdldChxdWVyeVVybCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3JSZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXR1cm5zIGV4cGxvcmF0aW9uJ3MgbWV0YWRhdGEgZGljdCwgZ2l2ZW4gYSBzZWFyY2ggcXVlcnkuIFNlYXJjaFxuICAgICAgICAgICAgICogcXVlcmllcyBhcmUgdG9rZW5zIHRoYXQgd2lsbCBiZSBtYXRjaGVkIGFnYWluc3QgZXhwbG9yYXRpb24ncyB0aXRsZVxuICAgICAgICAgICAgICogYW5kIG9iamVjdGl2ZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZmV0Y2hFeHBsb3JhdGlvbnM6IGZ1bmN0aW9uIChzZWFyY2hRdWVyeSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF9mZXRjaEV4cGxvcmF0aW9ucyhzZWFyY2hRdWVyeSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmFjdG9yeSBmb3IgY3JlYXRpbmcgaW5zdGFuY2VzIG9mIEV4cGxvcmF0aW9uRHJhZnRcbiAqIGRvbWFpbiBvYmplY3RzLlxuICovXG5vcHBpYS5mYWN0b3J5KCdFeHBsb3JhdGlvbkRyYWZ0T2JqZWN0RmFjdG9yeScsIFtcbiAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBFeHBsb3JhdGlvbkRyYWZ0ID0gZnVuY3Rpb24gKGRyYWZ0Q2hhbmdlcywgZHJhZnRDaGFuZ2VMaXN0SWQpIHtcbiAgICAgICAgICAgIHRoaXMuZHJhZnRDaGFuZ2VzID0gZHJhZnRDaGFuZ2VzO1xuICAgICAgICAgICAgdGhpcy5kcmFmdENoYW5nZUxpc3RJZCA9IGRyYWZ0Q2hhbmdlTGlzdElkO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGRyYWZ0IG9iamVjdCBoYXMgYmVlbiBvdmVyd3JpdHRlbiBieSBhbm90aGVyXG4gICAgICAgICAqIGRyYWZ0IHdoaWNoIGhhcyBiZWVuIGNvbW1pdHRlZCB0byB0aGUgYmFjay1lbmQuIElmIHRoZSBzdXBwbGllZCBkcmFmdCBpZFxuICAgICAgICAgKiBoYXMgYSBkaWZmZXJlbnQgdmFsdWUgdGhlbiBhIG5ld2VyIGNoYW5nZUxpc3QgbXVzdCBoYXZlIGJlZW4gY29tbWl0dGVkXG4gICAgICAgICAqIHRvIHRoZSBiYWNrLWVuZC5cbiAgICAgICAgICogQHBhcmFtIHtJbnRlZ2VyfSAtIGN1cnJlbnREcmFmdElkLiBUaGUgaWQgb2YgdGhlIGRyYWZ0IGNoYW5nZXMgd2hjaCB3YXNcbiAgICAgICAgICogIHJldHJpZXZlZCBmcm9tIHRoZSBiYWNrLWVuZC5cbiAgICAgICAgICogQHJldHVybnMge0Jvb2xlYW59IC0gVHJ1ZSBpZmYgdGhlIGN1cnJlbnREcmFmdElkIGlzIHRoZSBzYW1lIGFzIHRoZVxuICAgICAgICAgKiBkcmFmdENoYW5nZUxpc3RJZCBjb3JyZXNwb25kaW5nIHRvIHRoaXMgZHJhZnQuXG4gICAgICAgICAqL1xuICAgICAgICBFeHBsb3JhdGlvbkRyYWZ0LnByb3RvdHlwZS5pc1ZhbGlkID0gZnVuY3Rpb24gKGN1cnJlbnREcmFmdElkKSB7XG4gICAgICAgICAgICByZXR1cm4gKGN1cnJlbnREcmFmdElkID09PSB0aGlzLmRyYWZ0Q2hhbmdlTGlzdElkKTtcbiAgICAgICAgfTtcbiAgICAgICAgRXhwbG9yYXRpb25EcmFmdC5wcm90b3R5cGUuZ2V0Q2hhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRyYWZ0Q2hhbmdlcztcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgRXhwbG9yYXRpb25EcmFmdFsnY3JlYXRlRnJvbUxvY2FsU3RvcmFnZURpY3QnXSA9IGZ1bmN0aW9uIChcbiAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgZXhwbG9yYXRpb25EcmFmdERpY3QpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwbG9yYXRpb25EcmFmdChleHBsb3JhdGlvbkRyYWZ0RGljdC5kcmFmdENoYW5nZXMsIGV4cGxvcmF0aW9uRHJhZnREaWN0LmRyYWZ0Q2hhbmdlTGlzdElkKTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgRXhwbG9yYXRpb25EcmFmdFsndG9Mb2NhbFN0b3JhZ2VEaWN0J10gPSBmdW5jdGlvbiAoXG4gICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIGNoYW5nZUxpc3QsIGRyYWZ0Q2hhbmdlTGlzdElkKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGRyYWZ0Q2hhbmdlczogY2hhbmdlTGlzdCxcbiAgICAgICAgICAgICAgICBkcmFmdENoYW5nZUxpc3RJZDogZHJhZnRDaGFuZ2VMaXN0SWRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBFeHBsb3JhdGlvbkRyYWZ0O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIHJldHJpZXZlIGluZm9ybWF0aW9uIGFib3V0IGV4cGxvcmF0aW9uIHN1bW1hcmllc1xuICogZnJvbSB0aGUgYmFja2VuZC5cbiAqL1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvVmFsaWRhdG9yc1NlcnZpY2UudHMnKTtcbm9wcGlhLmZhY3RvcnkoJ0V4cGxvcmF0aW9uU3VtbWFyeUJhY2tlbmRBcGlTZXJ2aWNlJywgW1xuICAgICckaHR0cCcsICckcScsICdBbGVydHNTZXJ2aWNlJyxcbiAgICAnVmFsaWRhdG9yc1NlcnZpY2UnLCAnRVhQTE9SQVRJT05fU1VNTUFSWV9EQVRBX1VSTF9URU1QTEFURScsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkcSwgQWxlcnRzU2VydmljZSwgVmFsaWRhdG9yc1NlcnZpY2UsIEVYUExPUkFUSU9OX1NVTU1BUllfREFUQV9VUkxfVEVNUExBVEUpIHtcbiAgICAgICAgdmFyIF9mZXRjaEV4cFN1bW1hcmllcyA9IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkcywgaW5jbHVkZVByaXZhdGVFeHBsb3JhdGlvbnMsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKCFleHBsb3JhdGlvbklkcy5ldmVyeShWYWxpZGF0b3JzU2VydmljZS5pc1ZhbGlkRXhwbG9yYXRpb25JZCkpIHtcbiAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ1BsZWFzZSBlbnRlciBhIHZhbGlkIGV4cGxvcmF0aW9uIElELicpO1xuICAgICAgICAgICAgICAgIHZhciByZXR1cm5WYWx1ZSA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXhwbG9yYXRpb25JZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuVmFsdWUucHVzaChudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlc29sdmUocmV0dXJuVmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGV4cGxvcmF0aW9uU3VtbWFyeURhdGFVcmwgPSBFWFBMT1JBVElPTl9TVU1NQVJZX0RBVEFfVVJMX1RFTVBMQVRFO1xuICAgICAgICAgICAgJGh0dHAuZ2V0KGV4cGxvcmF0aW9uU3VtbWFyeURhdGFVcmwsIHtcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgICAgICAgICAgc3RyaW5naWZpZWRfZXhwX2lkczogSlNPTi5zdHJpbmdpZnkoZXhwbG9yYXRpb25JZHMpLFxuICAgICAgICAgICAgICAgICAgICBpbmNsdWRlX3ByaXZhdGVfZXhwbG9yYXRpb25zOiBKU09OLnN0cmluZ2lmeShpbmNsdWRlUHJpdmF0ZUV4cGxvcmF0aW9ucylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHZhciBzdW1tYXJpZXMgPSBhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YS5zdW1tYXJpZXMpO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHN1bW1hcmllcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrKGVycm9yUmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEZldGNoZXMgYSBsaXN0IG9mIHB1YmxpYyBleHBsb3JhdGlvbiBzdW1tYXJpZXMgYW5kIHByaXZhdGVcbiAgICAgICAgICAgICAqIGV4cGxvcmF0aW9uIHN1bW1hcmllcyBmb3Igd2hpY2ggdGhlIGN1cnJlbnQgdXNlciBoYXMgYWNjZXNzIGZyb20gdGhlXG4gICAgICAgICAgICAgKiBiYWNrZW5kIGZvciBlYWNoIGV4cGxvcmF0aW9uIElEIHByb3ZpZGVkLiBUaGUgcHJvdmlkZWQgbGlzdCBvZlxuICAgICAgICAgICAgICogZXhwbG9yYXRpb24gc3VtbWFyaWVzIGFyZSBpbiB0aGUgc2FtZSBvcmRlciBhcyBpbnB1dCBleHBsb3JhdGlvbiBJRHNcbiAgICAgICAgICAgICAqIGxpc3QsIHRob3VnaCBzb21lIG1heSBiZSBtaXNzaW5nIChpZiB0aGUgZXhwbG9yYXRpb24gZG9lc24ndCBleGlzdCBvclxuICAgICAgICAgICAgICogb3IgdGhlIHVzZXIgZG9lcyBub3QgaGF2ZSBhY2Nlc3MgdG8gaXQpLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBsb2FkUHVibGljQW5kUHJpdmF0ZUV4cGxvcmF0aW9uU3VtbWFyaWVzOiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfZmV0Y2hFeHBTdW1tYXJpZXMoZXhwbG9yYXRpb25JZHMsIHRydWUsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFByaW1hcnkgY29udHJvbGxlciBmb3IgdGhlIGNvbGxlY3Rpb24gZWRpdG9yIHBhZ2UuXG4gKi9cbnJlcXVpcmUoJ3BhZ2VzL2NvbGxlY3Rpb25fZWRpdG9yL0NvbGxlY3Rpb25FZGl0b3JOYXZiYXJCcmVhZGNydW1iRGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9jb2xsZWN0aW9uX2VkaXRvci9Db2xsZWN0aW9uRWRpdG9yTmF2YmFyRGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9jb2xsZWN0aW9uX2VkaXRvci9lZGl0b3JfdGFiL0NvbGxlY3Rpb25FZGl0b3JUYWJEaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2NvbGxlY3Rpb25fZWRpdG9yL2hpc3RvcnlfdGFiL0NvbGxlY3Rpb25IaXN0b3J5VGFiRGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9jb2xsZWN0aW9uX2VkaXRvci9zZXR0aW5nc190YWIvQ29sbGVjdGlvblNldHRpbmdzVGFiRGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9jb2xsZWN0aW9uX2VkaXRvci9zdGF0aXN0aWNzX3RhYi9Db2xsZWN0aW9uU3RhdGlzdGljc1RhYkRpcmVjdGl2ZS50cycpO1xuLy8gVE9ETyhiaGVubmluZyk6IFRoZXNlIGNvbnN0YW50cyBzaG91bGQgYmUgcHJvdmlkZWQgYnkgdGhlIGJhY2tlbmQuXG5vcHBpYS5jb25zdGFudCgnQ09MTEVDVElPTl9EQVRBX1VSTF9URU1QTEFURScsICcvY29sbGVjdGlvbl9oYW5kbGVyL2RhdGEvPGNvbGxlY3Rpb25faWQ+Jyk7XG5vcHBpYS5jb25zdGFudCgnRURJVEFCTEVfQ09MTEVDVElPTl9EQVRBX1VSTF9URU1QTEFURScsICcvY29sbGVjdGlvbl9lZGl0b3JfaGFuZGxlci9kYXRhLzxjb2xsZWN0aW9uX2lkPicpO1xub3BwaWEuY29uc3RhbnQoJ0NPTExFQ1RJT05fUklHSFRTX1VSTF9URU1QTEFURScsICcvY29sbGVjdGlvbl9lZGl0b3JfaGFuZGxlci9yaWdodHMvPGNvbGxlY3Rpb25faWQ+Jyk7XG5vcHBpYS5jb25zdGFudCgnQ09MTEVDVElPTl9USVRMRV9JTlBVVF9GT0NVU19MQUJFTCcsICdjb2xsZWN0aW9uVGl0bGVJbnB1dEZvY3VzTGFiZWwnKTtcbm9wcGlhLmNvbnN0YW50KCdTRUFSQ0hfRVhQTE9SQVRJT05fVVJMX1RFTVBMQVRFJywgJy9leHBsb3JhdGlvbi9tZXRhZGF0YV9zZWFyY2g/cT08cXVlcnk+Jyk7XG5vcHBpYS5jb25zdGFudCgnSU5URVJBQ1RJT05fU1BFQ1MnLCBHTE9CQUxTLklOVEVSQUNUSU9OX1NQRUNTKTtcbm9wcGlhLmNvbnRyb2xsZXIoJ0NvbGxlY3Rpb25FZGl0b3InLCBbXG4gICAgJ0NvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlKSB7XG4gICAgICAgIC8vIExvYWQgdGhlIGNvbGxlY3Rpb24gdG8gYmUgZWRpdGVkLlxuICAgICAgICBDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlLmxvYWRDb2xsZWN0aW9uKEdMT0JBTFMuY29sbGVjdGlvbklkKTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29udHJvbGxlciBmb3IgdGhlIG5hdmJhciBicmVhZGNydW1iIG9mIHRoZSBjb2xsZWN0aW9uIGVkaXRvci5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvY29sbGVjdGlvbl9lZGl0b3IvQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2Utc2VydmljZXMvJyArXG4gICAgJ3JvdXRlci5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9zdGF0ZWZ1bC9Gb2N1c01hbmFnZXJTZXJ2aWNlLnRzJyk7XG4vLyBUT0RPKGJoZW5uaW5nKTogQWZ0ZXIgdGhlIG5hdmJhciBpcyBtb3ZlZCB0byBhIGRpcmVjdGl2ZSwgdGhpcyBkaXJlY3RpdmVcbi8vIHNob3VsZCBiZSB1cGRhdGVkIHRvIHNheSAnTG9hZGluZy4uLicgaWYgdGhlIGNvbGxlY3Rpb24gZWRpdG9yJ3MgY29udHJvbGxlclxuLy8gaXMgbm90IHlldCBmaW5pc2hlZCBsb2FkaW5nIHRoZSBjb2xsZWN0aW9uLiBBbHNvLCB0aGlzIGRpcmVjdGl2ZSBzaG91bGRcbi8vIHN1cHBvcnQgYm90aCBkaXNwbGF5aW5nIHRoZSBjdXJyZW50IHRpdGxlIG9mIHRoZSBjb2xsZWN0aW9uIChvciB1bnRpdGxlZCBpZlxuLy8gaXQgZG9lcyBub3QgeWV0IGhhdmUgb25lKSBvciBzZXR0aW5nIGEgbmV3IHRpdGxlIGluIHRoZSBjYXNlIG9mIGFuIHVudGl0bGVkXG4vLyBjb2xsZWN0aW9uLlxub3BwaWEuZGlyZWN0aXZlKCdjb2xsZWN0aW9uRWRpdG9yTmF2YmFyQnJlYWRjcnVtYicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9jb2xsZWN0aW9uX2VkaXRvci8nICtcbiAgICAgICAgICAgICAgICAnY29sbGVjdGlvbl9lZGl0b3JfbmF2YmFyX2JyZWFkY3J1bWJfZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJ1JvdXRlclNlcnZpY2UnLCAnQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ0ZvY3VzTWFuYWdlclNlcnZpY2UnLCAnQ09MTEVDVElPTl9USVRMRV9JTlBVVF9GT0NVU19MQUJFTCcsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgUm91dGVyU2VydmljZSwgQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZSwgRm9jdXNNYW5hZ2VyU2VydmljZSwgQ09MTEVDVElPTl9USVRMRV9JTlBVVF9GT0NVU19MQUJFTCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgX1RBQl9OQU1FU19UT19IVU1BTl9SRUFEQUJMRV9OQU1FUyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1haW46ICdFZGl0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpZXc6ICdQcmV2aWV3JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldHRpbmdzOiAnU2V0dGluZ3MnLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHM6ICdTdGF0aXN0aWNzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcHJvdmVtZW50czogJ0ltcHJvdmVtZW50cycsXG4gICAgICAgICAgICAgICAgICAgICAgICBoaXN0b3J5OiAnSGlzdG9yeScsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5jb2xsZWN0aW9uID0gQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZS5nZXRDb2xsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5nZXRDdXJyZW50VGFiTmFtZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfVEFCX05BTUVTX1RPX0hVTUFOX1JFQURBQkxFX05BTUVTW1JvdXRlclNlcnZpY2UuZ2V0QWN0aXZlVGFiTmFtZSgpXTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmVkaXRDb2xsZWN0aW9uVGl0bGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBSb3V0ZXJTZXJ2aWNlLm5hdmlnYXRlVG9TZXR0aW5nc1RhYigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgRm9jdXNNYW5hZ2VyU2VydmljZS5zZXRGb2N1cyhDT0xMRUNUSU9OX1RJVExFX0lOUFVUX0ZPQ1VTX0xBQkVMKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIG5hdmJhciBvZiB0aGUgY29sbGVjdGlvbiBlZGl0b3IuXG4gKi9cbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtZGlyZWN0aXZlcy9zZWxlY3QyLWRyb3Bkb3duLycgK1xuICAgICdzZWxlY3QyLWRyb3Bkb3duLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvbG9hZGluZy1kb3RzLycgK1xuICAgICdsb2FkaW5nLWRvdHMuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vY29sbGVjdGlvbi9Db2xsZWN0aW9uUmlnaHRzQmFja2VuZEFwaVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9jb2xsZWN0aW9uL0NvbGxlY3Rpb25VcGRhdGVTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vY29sbGVjdGlvbi9Db2xsZWN0aW9uVmFsaWRhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9jb2xsZWN0aW9uL0VkaXRhYmxlQ29sbGVjdGlvbkJhY2tlbmRBcGlTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vZWRpdG9yL3VuZG9fcmVkby9VbmRvUmVkb1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2NvbGxlY3Rpb25fZWRpdG9yL0NvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlLXNlcnZpY2VzLycgK1xuICAgICdyb3V0ZXIuc2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xub3BwaWEuZGlyZWN0aXZlKCdjb2xsZWN0aW9uRWRpdG9yTmF2YmFyJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL2NvbGxlY3Rpb25fZWRpdG9yL2NvbGxlY3Rpb25fZWRpdG9yX25hdmJhcl9kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJHVpYk1vZGFsJywgJ0FsZXJ0c1NlcnZpY2UnLCAnUm91dGVyU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ1VuZG9SZWRvU2VydmljZScsICdDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnQ29sbGVjdGlvblZhbGlkYXRpb25TZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnQ29sbGVjdGlvblJpZ2h0c0JhY2tlbmRBcGlTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnRWRpdGFibGVDb2xsZWN0aW9uQmFja2VuZEFwaVNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdFVkVOVF9DT0xMRUNUSU9OX0lOSVRJQUxJWkVEJywgJ0VWRU5UX0NPTExFQ1RJT05fUkVJTklUSUFMSVpFRCcsXG4gICAgICAgICAgICAgICAgJ0VWRU5UX1VORE9fUkVET19TRVJWSUNFX0NIQU5HRV9BUFBMSUVEJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkdWliTW9kYWwsIEFsZXJ0c1NlcnZpY2UsIFJvdXRlclNlcnZpY2UsIFVuZG9SZWRvU2VydmljZSwgQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZSwgQ29sbGVjdGlvblZhbGlkYXRpb25TZXJ2aWNlLCBDb2xsZWN0aW9uUmlnaHRzQmFja2VuZEFwaVNlcnZpY2UsIEVkaXRhYmxlQ29sbGVjdGlvbkJhY2tlbmRBcGlTZXJ2aWNlLCBFVkVOVF9DT0xMRUNUSU9OX0lOSVRJQUxJWkVELCBFVkVOVF9DT0xMRUNUSU9OX1JFSU5JVElBTElaRUQsIEVWRU5UX1VORE9fUkVET19TRVJWSUNFX0NIQU5HRV9BUFBMSUVEKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5jb2xsZWN0aW9uSWQgPSBHTE9CQUxTLmNvbGxlY3Rpb25JZDtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbGxlY3Rpb24gPSBDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlLmdldENvbGxlY3Rpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbGxlY3Rpb25SaWdodHMgPSAoQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZS5nZXRDb2xsZWN0aW9uUmlnaHRzKCkpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNMb2FkaW5nQ29sbGVjdGlvbiA9IChDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlLmlzTG9hZGluZ0NvbGxlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudmFsaWRhdGlvbklzc3VlcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNTYXZlSW5Qcm9ncmVzcyA9IChDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlLmlzU2F2aW5nQ29sbGVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5nZXRBY3RpdmVUYWJOYW1lID0gUm91dGVyU2VydmljZS5nZXRBY3RpdmVUYWJOYW1lO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0TWFpblRhYiA9IFJvdXRlclNlcnZpY2UubmF2aWdhdGVUb01haW5UYWI7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RQcmV2aWV3VGFiID0gUm91dGVyU2VydmljZS5uYXZpZ2F0ZVRvUHJldmlld1RhYjtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdFNldHRpbmdzVGFiID0gUm91dGVyU2VydmljZS5uYXZpZ2F0ZVRvU2V0dGluZ3NUYWI7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RTdGF0c1RhYiA9IFJvdXRlclNlcnZpY2UubmF2aWdhdGVUb1N0YXRzVGFiO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0SGlzdG9yeVRhYiA9IFJvdXRlclNlcnZpY2UubmF2aWdhdGVUb0hpc3RvcnlUYWI7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfdmFsaWRhdGVDb2xsZWN0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5jb2xsZWN0aW9uUmlnaHRzLmlzUHJpdmF0ZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnZhbGlkYXRpb25Jc3N1ZXMgPSAoQ29sbGVjdGlvblZhbGlkYXRpb25TZXJ2aWNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kVmFsaWRhdGlvbklzc3Vlc0ZvclByaXZhdGVDb2xsZWN0aW9uKCRzY29wZS5jb2xsZWN0aW9uKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUudmFsaWRhdGlvbklzc3VlcyA9IChDb2xsZWN0aW9uVmFsaWRhdGlvblNlcnZpY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZpbmRWYWxpZGF0aW9uSXNzdWVzRm9yUHVibGljQ29sbGVjdGlvbigkc2NvcGUuY29sbGVjdGlvbikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB2YXIgX3B1Ymxpc2hDb2xsZWN0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyhiaGVubmluZyk6IFRoaXMgYWxzbyBuZWVkcyBhIGNvbmZpcm1hdGlvbiBvZiBkZXN0cnVjdGl2ZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWN0aW9uIHNpbmNlIGl0IGlzIG5vdCByZXZlcnNpYmxlLlxuICAgICAgICAgICAgICAgICAgICAgICAgQ29sbGVjdGlvblJpZ2h0c0JhY2tlbmRBcGlTZXJ2aWNlLnNldENvbGxlY3Rpb25QdWJsaWMoJHNjb3BlLmNvbGxlY3Rpb25JZCwgJHNjb3BlLmNvbGxlY3Rpb24uZ2V0VmVyc2lvbigpKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29sbGVjdGlvblJpZ2h0cy5zZXRQdWJsaWMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlLnNldENvbGxlY3Rpb25SaWdodHMoJHNjb3BlLmNvbGxlY3Rpb25SaWdodHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kb24oRVZFTlRfQ09MTEVDVElPTl9JTklUSUFMSVpFRCwgX3ZhbGlkYXRlQ29sbGVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kb24oRVZFTlRfQ09MTEVDVElPTl9SRUlOSVRJQUxJWkVELCBfdmFsaWRhdGVDb2xsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRvbihFVkVOVF9VTkRPX1JFRE9fU0VSVklDRV9DSEFOR0VfQVBQTElFRCwgX3ZhbGlkYXRlQ29sbGVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5nZXRXYXJuaW5nc0NvdW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRzY29wZS52YWxpZGF0aW9uSXNzdWVzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmdldENoYW5nZUxpc3RDb3VudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBVbmRvUmVkb1NlcnZpY2UuZ2V0Q2hhbmdlQ291bnQoKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzQ29sbGVjdGlvblNhdmVhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICgkc2NvcGUuZ2V0Q2hhbmdlTGlzdENvdW50KCkgPiAwICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnZhbGlkYXRpb25Jc3N1ZXMubGVuZ3RoID09PSAwKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzQ29sbGVjdGlvblB1Ymxpc2hhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICgkc2NvcGUuY29sbGVjdGlvblJpZ2h0cy5pc1ByaXZhdGUoKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5nZXRDaGFuZ2VMaXN0Q291bnQoKSA9PT0gMCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS52YWxpZGF0aW9uSXNzdWVzLmxlbmd0aCA9PT0gMCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zYXZlQ2hhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpc1ByaXZhdGUgPSAkc2NvcGUuY29sbGVjdGlvblJpZ2h0cy5pc1ByaXZhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtb2RhbEluc3RhbmNlID0gJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL2NvbGxlY3Rpb25fZWRpdG9yLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnY29sbGVjdGlvbl9lZGl0b3Jfc2F2ZV9tb2RhbF9kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tkcm9wOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNDb2xsZWN0aW9uUHJpdmF0ZSA9IGlzUHJpdmF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zYXZlID0gZnVuY3Rpb24gKGNvbW1pdE1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5jbG9zZShjb21taXRNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbW9kYWxJbnN0YW5jZS5yZXN1bHQudGhlbihmdW5jdGlvbiAoY29tbWl0TWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIENvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2Uuc2F2ZUNvbGxlY3Rpb24oY29tbWl0TWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnB1Ymxpc2hDb2xsZWN0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFkZGl0aW9uYWxNZXRhZGF0YU5lZWRlZCA9ICghJHNjb3BlLmNvbGxlY3Rpb24uZ2V0VGl0bGUoKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICEkc2NvcGUuY29sbGVjdGlvbi5nZXRPYmplY3RpdmUoKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICEkc2NvcGUuY29sbGVjdGlvbi5nZXRDYXRlZ29yeSgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhZGRpdGlvbmFsTWV0YWRhdGFOZWVkZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL2NvbGxlY3Rpb25fZWRpdG9yLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2NvbGxlY3Rpb25fZWRpdG9yX3ByZV9wdWJsaXNoX21vZGFsX2RpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tkcm9wOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyR1aWJNb2RhbEluc3RhbmNlJywgJ0NvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0NvbGxlY3Rpb25VcGRhdGVTZXJ2aWNlJywgJ0FMTF9DQVRFR09SSUVTJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlLCBDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlLCBDb2xsZWN0aW9uVXBkYXRlU2VydmljZSwgQUxMX0NBVEVHT1JJRVMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29sbGVjdGlvbiA9IChDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlLmdldENvbGxlY3Rpb24oKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlcXVpcmVUaXRsZVRvQmVTcGVjaWZpZWQgPSAhY29sbGVjdGlvbi5nZXRUaXRsZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5yZXF1aXJlT2JqZWN0aXZlVG9CZVNwZWNpZmllZCA9ICghY29sbGVjdGlvbi5nZXRPYmplY3RpdmUoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlcXVpcmVDYXRlZ29yeVRvQmVTcGVjaWZpZWQgPSAoIWNvbGxlY3Rpb24uZ2V0Q2F0ZWdvcnkoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm5ld1RpdGxlID0gY29sbGVjdGlvbi5nZXRUaXRsZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5uZXdPYmplY3RpdmUgPSBjb2xsZWN0aW9uLmdldE9iamVjdGl2ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5uZXdDYXRlZ29yeSA9IGNvbGxlY3Rpb24uZ2V0Q2F0ZWdvcnkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuQ0FURUdPUllfTElTVF9GT1JfU0VMRUNUMiA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgQUxMX0NBVEVHT1JJRVMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLkNBVEVHT1JZX0xJU1RfRk9SX1NFTEVDVDIucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogQUxMX0NBVEVHT1JJRVNbaV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBBTExfQ0FURUdPUklFU1tpXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzU2F2aW5nQWxsb3dlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEJvb2xlYW4oJHNjb3BlLm5ld1RpdGxlICYmICRzY29wZS5uZXdPYmplY3RpdmUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5uZXdDYXRlZ29yeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkc2NvcGUubmV3VGl0bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZygnUGxlYXNlIHNwZWNpZnkgYSB0aXRsZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghJHNjb3BlLm5ld09iamVjdGl2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKCdQbGVhc2Ugc3BlY2lmeSBhbiBvYmplY3RpdmUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoISRzY29wZS5uZXdDYXRlZ29yeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKCdQbGVhc2Ugc3BlY2lmeSBhIGNhdGVnb3J5Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVjb3JkIGFueSBmaWVsZHMgdGhhdCBoYXZlIGNoYW5nZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtZXRhZGF0YUxpc3QgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5uZXdUaXRsZSAhPT0gY29sbGVjdGlvbi5nZXRUaXRsZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhZGF0YUxpc3QucHVzaCgndGl0bGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIENvbGxlY3Rpb25VcGRhdGVTZXJ2aWNlLnNldENvbGxlY3Rpb25UaXRsZShjb2xsZWN0aW9uLCAkc2NvcGUubmV3VGl0bGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUubmV3T2JqZWN0aXZlICE9PSBjb2xsZWN0aW9uLmdldE9iamVjdGl2ZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhZGF0YUxpc3QucHVzaCgnb2JqZWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDb2xsZWN0aW9uVXBkYXRlU2VydmljZS5zZXRDb2xsZWN0aW9uT2JqZWN0aXZlKGNvbGxlY3Rpb24sICRzY29wZS5uZXdPYmplY3RpdmUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUubmV3Q2F0ZWdvcnkgIT09IGNvbGxlY3Rpb24uZ2V0Q2F0ZWdvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGFMaXN0LnB1c2goJ2NhdGVnb3J5Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDb2xsZWN0aW9uVXBkYXRlU2VydmljZS5zZXRDb2xsZWN0aW9uQ2F0ZWdvcnkoY29sbGVjdGlvbiwgJHNjb3BlLm5ld0NhdGVnb3J5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5jbG9zZShtZXRhZGF0YUxpc3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNhbmNlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLnJlc3VsdC50aGVuKGZ1bmN0aW9uIChtZXRhZGF0YUxpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbW1pdE1lc3NhZ2UgPSAoJ0FkZCBtZXRhZGF0YTogJyArIG1ldGFkYXRhTGlzdC5qb2luKCcsICcpICsgJy4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZS5zYXZlQ29sbGVjdGlvbihjb21taXRNZXNzYWdlLCBfcHVibGlzaENvbGxlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3B1Ymxpc2hDb2xsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIC8vIFVucHVibGlzaCB0aGUgY29sbGVjdGlvbi4gV2lsbCBvbmx5IHNob3cgdXAgaWYgdGhlIGNvbGxlY3Rpb24gaXNcbiAgICAgICAgICAgICAgICAgICAgLy8gcHVibGljIGFuZCB0aGUgdXNlciBoYXMgYWNjZXNzIHRvIHRoZSBjb2xsZWN0aW9uLlxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudW5wdWJsaXNoQ29sbGVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIENvbGxlY3Rpb25SaWdodHNCYWNrZW5kQXBpU2VydmljZS5zZXRDb2xsZWN0aW9uUHJpdmF0ZSgkc2NvcGUuY29sbGVjdGlvbklkLCAkc2NvcGUuY29sbGVjdGlvbi5nZXRWZXJzaW9uKCkpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jb2xsZWN0aW9uUmlnaHRzLnNldFByaXZhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlLnNldENvbGxlY3Rpb25SaWdodHMoJHNjb3BlLmNvbGxlY3Rpb25SaWdodHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZygnVGhlcmUgd2FzIGFuIGVycm9yIHdoZW4gdW5wdWJsaXNoaW5nIHRoZSBjb2xsZWN0aW9uLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIG1haW50YWluIHRoZSBzdGF0ZSBvZiBhIHNpbmdsZSBjb2xsZWN0aW9uIHNoYXJlZFxuICogdGhyb3VnaG91dCB0aGUgY29sbGVjdGlvbiBlZGl0b3IuIFRoaXMgc2VydmljZSBwcm92aWRlcyBmdW5jdGlvbmFsaXR5IGZvclxuICogcmV0cmlldmluZyB0aGUgY29sbGVjdGlvbiwgc2F2aW5nIGl0LCBhbmQgbGlzdGVuaW5nIGZvciBjaGFuZ2VzLlxuICovXG5yZXF1aXJlKCdkb21haW4vY29sbGVjdGlvbi9Db2xsZWN0aW9uT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL2NvbGxlY3Rpb24vQ29sbGVjdGlvblJpZ2h0c0JhY2tlbmRBcGlTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vY29sbGVjdGlvbi9Db2xsZWN0aW9uUmlnaHRzT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL2NvbGxlY3Rpb24vRWRpdGFibGVDb2xsZWN0aW9uQmFja2VuZEFwaVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9lZGl0b3IvdW5kb19yZWRvL1VuZG9SZWRvU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xub3BwaWEuY29uc3RhbnQoJ0VWRU5UX0NPTExFQ1RJT05fSU5JVElBTElaRUQnLCAnY29sbGVjdGlvbkluaXRpYWxpemVkJyk7XG5vcHBpYS5jb25zdGFudCgnRVZFTlRfQ09MTEVDVElPTl9SRUlOSVRJQUxJWkVEJywgJ2NvbGxlY3Rpb25SZWluaXRpYWxpemVkJyk7XG5vcHBpYS5mYWN0b3J5KCdDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlJywgW1xuICAgICckcm9vdFNjb3BlJywgJ0FsZXJ0c1NlcnZpY2UnLCAnQ29sbGVjdGlvbk9iamVjdEZhY3RvcnknLFxuICAgICdDb2xsZWN0aW9uUmlnaHRzQmFja2VuZEFwaVNlcnZpY2UnLCAnQ29sbGVjdGlvblJpZ2h0c09iamVjdEZhY3RvcnknLFxuICAgICdFZGl0YWJsZUNvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZScsICdVbmRvUmVkb1NlcnZpY2UnLFxuICAgICdFVkVOVF9DT0xMRUNUSU9OX0lOSVRJQUxJWkVEJywgJ0VWRU5UX0NPTExFQ1RJT05fUkVJTklUSUFMSVpFRCcsXG4gICAgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFsZXJ0c1NlcnZpY2UsIENvbGxlY3Rpb25PYmplY3RGYWN0b3J5LCBDb2xsZWN0aW9uUmlnaHRzQmFja2VuZEFwaVNlcnZpY2UsIENvbGxlY3Rpb25SaWdodHNPYmplY3RGYWN0b3J5LCBFZGl0YWJsZUNvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZSwgVW5kb1JlZG9TZXJ2aWNlLCBFVkVOVF9DT0xMRUNUSU9OX0lOSVRJQUxJWkVELCBFVkVOVF9DT0xMRUNUSU9OX1JFSU5JVElBTElaRUQpIHtcbiAgICAgICAgdmFyIF9jb2xsZWN0aW9uID0gQ29sbGVjdGlvbk9iamVjdEZhY3RvcnkuY3JlYXRlRW1wdHlDb2xsZWN0aW9uKCk7XG4gICAgICAgIHZhciBfY29sbGVjdGlvblJpZ2h0cyA9IChDb2xsZWN0aW9uUmlnaHRzT2JqZWN0RmFjdG9yeS5jcmVhdGVFbXB0eUNvbGxlY3Rpb25SaWdodHMoKSk7XG4gICAgICAgIHZhciBfY29sbGVjdGlvbklzSW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgICAgICAgdmFyIF9jb2xsZWN0aW9uSXNMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIHZhciBfY29sbGVjdGlvbklzQmVpbmdTYXZlZCA9IGZhbHNlO1xuICAgICAgICB2YXIgX3NldENvbGxlY3Rpb24gPSBmdW5jdGlvbiAoY29sbGVjdGlvbikge1xuICAgICAgICAgICAgX2NvbGxlY3Rpb24uY29weUZyb21Db2xsZWN0aW9uKGNvbGxlY3Rpb24pO1xuICAgICAgICAgICAgaWYgKF9jb2xsZWN0aW9uSXNJbml0aWFsaXplZCkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChFVkVOVF9DT0xMRUNUSU9OX1JFSU5JVElBTElaRUQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEVWRU5UX0NPTExFQ1RJT05fSU5JVElBTElaRUQpO1xuICAgICAgICAgICAgICAgIF9jb2xsZWN0aW9uSXNJbml0aWFsaXplZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfdXBkYXRlQ29sbGVjdGlvbiA9IGZ1bmN0aW9uIChuZXdCYWNrZW5kQ29sbGVjdGlvbk9iamVjdCkge1xuICAgICAgICAgICAgX3NldENvbGxlY3Rpb24oQ29sbGVjdGlvbk9iamVjdEZhY3RvcnkuY3JlYXRlKG5ld0JhY2tlbmRDb2xsZWN0aW9uT2JqZWN0KSk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfc2V0Q29sbGVjdGlvblJpZ2h0cyA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uUmlnaHRzKSB7XG4gICAgICAgICAgICBfY29sbGVjdGlvblJpZ2h0cy5jb3B5RnJvbUNvbGxlY3Rpb25SaWdodHMoY29sbGVjdGlvblJpZ2h0cyk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfdXBkYXRlQ29sbGVjdGlvblJpZ2h0cyA9IGZ1bmN0aW9uIChuZXdCYWNrZW5kQ29sbGVjdGlvblJpZ2h0c09iamVjdCkge1xuICAgICAgICAgICAgX3NldENvbGxlY3Rpb25SaWdodHMoQ29sbGVjdGlvblJpZ2h0c09iamVjdEZhY3RvcnkuY3JlYXRlKG5ld0JhY2tlbmRDb2xsZWN0aW9uUmlnaHRzT2JqZWN0KSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIExvYWRzLCBvciByZWxvYWRzLCB0aGUgY29sbGVjdGlvbiBzdG9yZWQgYnkgdGhpcyBzZXJ2aWNlIGdpdmVuIGFcbiAgICAgICAgICAgICAqIHNwZWNpZmllZCBjb2xsZWN0aW9uIElELiBTZWUgc2V0Q29sbGVjdGlvbigpIGZvciBtb3JlIGluZm9ybWF0aW9uIG9uXG4gICAgICAgICAgICAgKiBhZGRpdGlvbmFsIGJlaGF2aW9yIG9mIHRoaXMgZnVuY3Rpb24uXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGxvYWRDb2xsZWN0aW9uOiBmdW5jdGlvbiAoY29sbGVjdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX2NvbGxlY3Rpb25Jc0xvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIEVkaXRhYmxlQ29sbGVjdGlvbkJhY2tlbmRBcGlTZXJ2aWNlLmZldGNoQ29sbGVjdGlvbihjb2xsZWN0aW9uSWQpLnRoZW4oZnVuY3Rpb24gKG5ld0JhY2tlbmRDb2xsZWN0aW9uT2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF91cGRhdGVDb2xsZWN0aW9uKG5ld0JhY2tlbmRDb2xsZWN0aW9uT2JqZWN0KTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKGVycm9yIHx8ICdUaGVyZSB3YXMgYW4gZXJyb3Igd2hlbiBsb2FkaW5nIHRoZSBjb2xsZWN0aW9uLicpO1xuICAgICAgICAgICAgICAgICAgICBfY29sbGVjdGlvbklzTG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIENvbGxlY3Rpb25SaWdodHNCYWNrZW5kQXBpU2VydmljZS5mZXRjaENvbGxlY3Rpb25SaWdodHMoY29sbGVjdGlvbklkKS50aGVuKGZ1bmN0aW9uIChuZXdCYWNrZW5kQ29sbGVjdGlvblJpZ2h0c09iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfdXBkYXRlQ29sbGVjdGlvblJpZ2h0cyhuZXdCYWNrZW5kQ29sbGVjdGlvblJpZ2h0c09iamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIF9jb2xsZWN0aW9uSXNMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZyhlcnJvciB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJ1RoZXJlIHdhcyBhbiBlcnJvciB3aGVuIGxvYWRpbmcgdGhlIGNvbGxlY3Rpb24gcmlnaHRzLicpO1xuICAgICAgICAgICAgICAgICAgICBfY29sbGVjdGlvbklzTG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0dXJucyB3aGV0aGVyIHRoaXMgc2VydmljZSBpcyBjdXJyZW50bHkgYXR0ZW1wdGluZyB0byBsb2FkIHRoZVxuICAgICAgICAgICAgICogY29sbGVjdGlvbiBtYWludGFpbmVkIGJ5IHRoaXMgc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaXNMb2FkaW5nQ29sbGVjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfY29sbGVjdGlvbklzTG9hZGluZztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHVybnMgd2hldGhlciBhIGNvbGxlY3Rpb24gaGFzIHlldCBiZWVuIGxvYWRlZCB1c2luZyBlaXRoZXJcbiAgICAgICAgICAgICAqIGxvYWRDb2xsZWN0aW9uKCkgb3Igc2V0Q29sbGVjdGlvbigpLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBoYXNMb2FkZWRDb2xsZWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9jb2xsZWN0aW9uSXNJbml0aWFsaXplZDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgY29sbGVjdGlvbiB0byBiZSBzaGFyZWQgYW1vbmcgdGhlIGNvbGxlY3Rpb25cbiAgICAgICAgICAgICAqIGVkaXRvci4gUGxlYXNlIG5vdGUgYW55IGNoYW5nZXMgdG8gdGhpcyBjb2xsZWN0aW9uIHdpbGwgYmUgcHJvcG9nYXRlZFxuICAgICAgICAgICAgICogdG8gYWxsIGJpbmRpbmdzIHRvIGl0LiBUaGlzIGNvbGxlY3Rpb24gb2JqZWN0IHdpbGwgYmUgcmV0YWluZWQgZm9yIHRoZVxuICAgICAgICAgICAgICogbGlmZXRpbWUgb2YgdGhlIGVkaXRvci4gVGhpcyBmdW5jdGlvbiBuZXZlciByZXR1cm5zIG51bGwsIHRob3VnaCBpdCBtYXlcbiAgICAgICAgICAgICAqIHJldHVybiBhbiBlbXB0eSBjb2xsZWN0aW9uIG9iamVjdCBpZiB0aGUgY29sbGVjdGlvbiBoYXMgbm90IHlldCBiZWVuXG4gICAgICAgICAgICAgKiBsb2FkZWQgZm9yIHRoaXMgZWRpdG9yIGluc3RhbmNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRDb2xsZWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9jb2xsZWN0aW9uO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0dXJucyB0aGUgY3VycmVudCBjb2xsZWN0aW9uIHJpZ2h0cyB0byBiZSBzaGFyZWQgYW1vbmcgdGhlIGNvbGxlY3Rpb25cbiAgICAgICAgICAgICAqIGVkaXRvci4gUGxlYXNlIG5vdGUgYW55IGNoYW5nZXMgdG8gdGhpcyBjb2xsZWN0aW9uIHJpZ2h0cyB3aWxsIGJlXG4gICAgICAgICAgICAgKiBwcm9wb2dhdGVkIHRvIGFsbCBiaW5kaW5ncyB0byBpdC4gVGhpcyBjb2xsZWN0aW9uIHJpZ2h0cyBvYmplY3Qgd2lsbFxuICAgICAgICAgICAgICogYmUgcmV0YWluZWQgZm9yIHRoZSBsaWZldGltZSBvZiB0aGUgZWRpdG9yLiBUaGlzIGZ1bmN0aW9uIG5ldmVyIHJldHVybnNcbiAgICAgICAgICAgICAqIG51bGwsIHRob3VnaCBpdCBtYXkgcmV0dXJuIGFuIGVtcHR5IGNvbGxlY3Rpb24gcmlnaHRzIG9iamVjdCBpZiB0aGVcbiAgICAgICAgICAgICAqIGNvbGxlY3Rpb24gcmlnaHRzIGhhcyBub3QgeWV0IGJlZW4gbG9hZGVkIGZvciB0aGlzIGVkaXRvciBpbnN0YW5jZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0Q29sbGVjdGlvblJpZ2h0czogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfY29sbGVjdGlvblJpZ2h0cztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNldHMgdGhlIGNvbGxlY3Rpb24gc3RvcmVkIHdpdGhpbiB0aGlzIHNlcnZpY2UsIHByb3BvZ2F0aW5nIGNoYW5nZXMgdG9cbiAgICAgICAgICAgICAqIGFsbCBiaW5kaW5ncyB0byB0aGUgY29sbGVjdGlvbiByZXR1cm5lZCBieSBnZXRDb2xsZWN0aW9uKCkuIFRoZSBmaXJzdFxuICAgICAgICAgICAgICogdGltZSB0aGlzIGlzIGNhbGxlZCBpdCB3aWxsIGZpcmUgYSBnbG9iYWwgZXZlbnQgYmFzZWQgb24gdGhlXG4gICAgICAgICAgICAgKiBFVkVOVF9DT0xMRUNUSU9OX0lOSVRJQUxJWkVEIGNvbnN0YW50LiBBbGwgc3Vic2VxdWVudFxuICAgICAgICAgICAgICogY2FsbHMgd2lsbCBzaW1pbGFybHkgZmlyZSBhIEVWRU5UX0NPTExFQ1RJT05fUkVJTklUSUFMSVpFRCBldmVudC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2V0Q29sbGVjdGlvbjogZnVuY3Rpb24gKGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBfc2V0Q29sbGVjdGlvbihjb2xsZWN0aW9uKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNldHMgdGhlIGNvbGxlY3Rpb24gcmlnaHRzIHN0b3JlZCB3aXRoaW4gdGhpcyBzZXJ2aWNlLCBwcm9wb2dhdGluZ1xuICAgICAgICAgICAgICogY2hhbmdlcyB0byBhbGwgYmluZGluZ3MgdG8gdGhlIGNvbGxlY3Rpb24gcmV0dXJuZWQgYnlcbiAgICAgICAgICAgICAqIGdldENvbGxlY3Rpb25SaWdodHMoKS4gVGhlIGZpcnN0IHRpbWUgdGhpcyBpcyBjYWxsZWQgaXQgd2lsbCBmaXJlIGFcbiAgICAgICAgICAgICAqIGdsb2JhbCBldmVudCBiYXNlZCBvbiB0aGUgRVZFTlRfQ09MTEVDVElPTl9JTklUSUFMSVpFRCBjb25zdGFudC4gQWxsXG4gICAgICAgICAgICAgKiBzdWJzZXF1ZW50IGNhbGxzIHdpbGwgc2ltaWxhcmx5IGZpcmUgYSBFVkVOVF9DT0xMRUNUSU9OX1JFSU5JVElBTElaRURcbiAgICAgICAgICAgICAqIGV2ZW50LlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzZXRDb2xsZWN0aW9uUmlnaHRzOiBmdW5jdGlvbiAoY29sbGVjdGlvblJpZ2h0cykge1xuICAgICAgICAgICAgICAgIF9zZXRDb2xsZWN0aW9uUmlnaHRzKGNvbGxlY3Rpb25SaWdodHMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQXR0ZW1wdHMgdG8gc2F2ZSB0aGUgY3VycmVudCBjb2xsZWN0aW9uIGdpdmVuIGEgY29tbWl0IG1lc3NhZ2UuIFRoaXNcbiAgICAgICAgICAgICAqIGZ1bmN0aW9uIGNhbm5vdCBiZSBjYWxsZWQgdW50aWwgYWZ0ZXIgYSBjb2xsZWN0aW9uIGhhcyBiZWVuIGluaXRpYWxpemVkXG4gICAgICAgICAgICAgKiBpbiB0aGlzIHNlcnZpY2UuIFJldHVybnMgZmFsc2UgaWYgYSBzYXZlIGlzIG5vdCBwZXJmb3JtZWQgZHVlIHRvIG5vXG4gICAgICAgICAgICAgKiBjaGFuZ2VzIHBlbmRpbmcsIG9yIHRydWUgaWYgb3RoZXJ3aXNlLiBUaGlzIGZ1bmN0aW9uLCB1cG9uIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgKiB3aWxsIGNsZWFyIHRoZSBVbmRvUmVkb1NlcnZpY2Ugb2YgcGVuZGluZyBjaGFuZ2VzLiBUaGlzIGZ1bmN0aW9uIGFsc29cbiAgICAgICAgICAgICAqIHNoYXJlcyBiZWhhdmlvciB3aXRoIHNldENvbGxlY3Rpb24oKSwgd2hlbiBpdCBzdWNjZWVkcy5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2F2ZUNvbGxlY3Rpb246IGZ1bmN0aW9uIChjb21taXRNZXNzYWdlLCBzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoIV9jb2xsZWN0aW9uSXNJbml0aWFsaXplZCkge1xuICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmZhdGFsV2FybmluZygnQ2Fubm90IHNhdmUgYSBjb2xsZWN0aW9uIGJlZm9yZSBvbmUgaXMgbG9hZGVkLicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBEb24ndCBhdHRlbXB0IHRvIHNhdmUgdGhlIGNvbGxlY3Rpb24gaWYgdGhlcmUgYXJlIG5vIGNoYW5nZXMgcGVuZGluZy5cbiAgICAgICAgICAgICAgICBpZiAoIVVuZG9SZWRvU2VydmljZS5oYXNDaGFuZ2VzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfY29sbGVjdGlvbklzQmVpbmdTYXZlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgRWRpdGFibGVDb2xsZWN0aW9uQmFja2VuZEFwaVNlcnZpY2UudXBkYXRlQ29sbGVjdGlvbihfY29sbGVjdGlvbi5nZXRJZCgpLCBfY29sbGVjdGlvbi5nZXRWZXJzaW9uKCksIGNvbW1pdE1lc3NhZ2UsIFVuZG9SZWRvU2VydmljZS5nZXRDb21taXR0YWJsZUNoYW5nZUxpc3QoKSkudGhlbihmdW5jdGlvbiAoY29sbGVjdGlvbkJhY2tlbmRPYmplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgX3VwZGF0ZUNvbGxlY3Rpb24oY29sbGVjdGlvbkJhY2tlbmRPYmplY3QpO1xuICAgICAgICAgICAgICAgICAgICBVbmRvUmVkb1NlcnZpY2UuY2xlYXJDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgICAgIF9jb2xsZWN0aW9uSXNCZWluZ1NhdmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZyhlcnJvciB8fCAnVGhlcmUgd2FzIGFuIGVycm9yIHdoZW4gc2F2aW5nIHRoZSBjb2xsZWN0aW9uLicpO1xuICAgICAgICAgICAgICAgICAgICBfY29sbGVjdGlvbklzQmVpbmdTYXZlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0dXJucyB3aGV0aGVyIHRoaXMgc2VydmljZSBpcyBjdXJyZW50bHkgYXR0ZW1wdGluZyB0byBzYXZlIHRoZVxuICAgICAgICAgICAgICogY29sbGVjdGlvbiBtYWludGFpbmVkIGJ5IHRoaXMgc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaXNTYXZpbmdDb2xsZWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9jb2xsZWN0aW9uSXNCZWluZ1NhdmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb250cm9sbGVyIGZvciB0aGUgbWFpbiB0YWIgb2YgdGhlIGNvbGxlY3Rpb24gZWRpdG9yLlxuICovXG5yZXF1aXJlKCdwYWdlcy9jb2xsZWN0aW9uX2VkaXRvci9lZGl0b3JfdGFiL0NvbGxlY3Rpb25Ob2RlQ3JlYXRvckRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvY29sbGVjdGlvbl9lZGl0b3IvZWRpdG9yX3RhYi9Db2xsZWN0aW9uTm9kZUVkaXRvckRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvY29sbGVjdGlvbl9lZGl0b3IvQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvY29sbGVjdGlvbl9lZGl0b3IvZWRpdG9yX3RhYi9Db2xsZWN0aW9uTGluZWFyaXplclNlcnZpY2UudHMnKTtcbm9wcGlhLmRpcmVjdGl2ZSgnY29sbGVjdGlvbkVkaXRvclRhYicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9jb2xsZWN0aW9uX2VkaXRvci9lZGl0b3JfdGFiLycgK1xuICAgICAgICAgICAgICAgICdjb2xsZWN0aW9uX2VkaXRvcl90YWJfZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJ0NvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2UnLCAnQ29sbGVjdGlvbkxpbmVhcml6ZXJTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCBDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlLCBDb2xsZWN0aW9uTGluZWFyaXplclNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmhhc0xvYWRlZENvbGxlY3Rpb24gPSAoQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZS5oYXNMb2FkZWRDb2xsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbGxlY3Rpb24gPSBDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlLmdldENvbGxlY3Rpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmV0dXJucyBhIGxpc3Qgb2YgY29sbGVjdGlvbiBub2RlcyB3aGljaCByZXByZXNlbnRzIGEgdmFsaWQgbGluZWFyXG4gICAgICAgICAgICAgICAgICAgIC8vIHBhdGggdGhyb3VnaCB0aGUgY29sbGVjdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmdldExpbmVhcmx5U29ydGVkTm9kZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKENvbGxlY3Rpb25MaW5lYXJpemVyU2VydmljZS5nZXRDb2xsZWN0aW9uTm9kZXNJblBsYXlhYmxlT3JkZXIoJHNjb3BlLmNvbGxlY3Rpb24pKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdG8gbWFpbnRhaW4gdGhlIHN0YXRlIG9mIGEgc2luZ2xlIGNvbGxlY3Rpb24gc2hhcmVkXG4gKiB0aHJvdWdob3V0IHRoZSBjb2xsZWN0aW9uIGVkaXRvci4gVGhpcyBzZXJ2aWNlIHByb3ZpZGVzIGZ1bmN0aW9uYWxpdHkgZm9yXG4gKiByZXRyaWV2aW5nIHRoZSBjb2xsZWN0aW9uLCBzYXZpbmcgaXQsIGFuZCBsaXN0ZW5pbmcgZm9yIGNoYW5nZXMuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9jb2xsZWN0aW9uL0NvbGxlY3Rpb25VcGRhdGVTZXJ2aWNlLnRzJyk7XG5vcHBpYS5mYWN0b3J5KCdDb2xsZWN0aW9uTGluZWFyaXplclNlcnZpY2UnLCBbXG4gICAgJ0NvbGxlY3Rpb25VcGRhdGVTZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoQ29sbGVjdGlvblVwZGF0ZVNlcnZpY2UpIHtcbiAgICAgICAgdmFyIF9nZXROZXh0RXhwbG9yYXRpb25JZCA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBjb21wbGV0ZWRFeHBJZHMpIHtcbiAgICAgICAgICAgIHZhciBleHBsb3JhdGlvbklkcyA9IGNvbGxlY3Rpb24uZ2V0RXhwbG9yYXRpb25JZHMoKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXhwbG9yYXRpb25JZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoY29tcGxldGVkRXhwSWRzLmluZGV4T2YoZXhwbG9yYXRpb25JZHNbaV0pID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXhwbG9yYXRpb25JZHNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH07XG4gICAgICAgIC8vIEdpdmVuIGEgbm9uIGxpbmVhciBjb2xsZWN0aW9uIGlucHV0LCB0aGUgZnVuY3Rpb24gd2lsbCBsaW5lYXJpemUgaXQgYnlcbiAgICAgICAgLy8gcGlja2luZyB0aGUgZmlyc3Qgbm9kZSBpdCBlbmNvdW50ZXJzIG9uIHRoZSBicmFuY2ggYW5kIGlnbm9yZSB0aGUgb3RoZXJzLlxuICAgICAgICB2YXIgX2dldENvbGxlY3Rpb25Ob2Rlc0luUGxheWFibGVPcmRlciA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gY29sbGVjdGlvbi5nZXRDb2xsZWN0aW9uTm9kZXMoKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGFkZEFmdGVyID0gZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGN1ckV4cGxvcmF0aW9uSWQsIG5ld0V4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgIHZhciBjdXJDb2xsZWN0aW9uTm9kZSA9IGNvbGxlY3Rpb24uZ2V0Q29sbGVjdGlvbk5vZGVCeUV4cGxvcmF0aW9uSWQoY3VyRXhwbG9yYXRpb25JZCk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBmaW5kTm9kZUluZGV4ID0gZnVuY3Rpb24gKGxpbmVhck5vZGVMaXN0LCBleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSAtMTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZWFyTm9kZUxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAobGluZWFyTm9kZUxpc3RbaV0uZ2V0RXhwbG9yYXRpb25JZCgpID09PSBleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgICAgICB9O1xuICAgICAgICAvLyBTd2FwIHRoZSBub2RlIGF0IHRoZSBzcGVjaWZpZWQgaW5kZXggd2l0aCB0aGUgbm9kZSBpbW1lZGlhdGVseSB0byB0aGVcbiAgICAgICAgLy8gbGVmdCBvZiBpdC5cbiAgICAgICAgdmFyIHN3YXBMZWZ0ID0gZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGxpbmVhck5vZGVMaXN0LCBub2RlSW5kZXgpIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gbGluZWFyTm9kZUxpc3Rbbm9kZUluZGV4XTtcbiAgICAgICAgICAgIHZhciBsZWZ0Tm9kZUluZGV4ID0gbm9kZUluZGV4ID4gMCA/IG5vZGVJbmRleCAtIDEgOiBudWxsO1xuICAgICAgICAgICAgaWYgKGxlZnROb2RlSW5kZXggPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBDb2xsZWN0aW9uVXBkYXRlU2VydmljZS5zd2FwTm9kZXMoY29sbGVjdGlvbiwgbGVmdE5vZGVJbmRleCwgbm9kZUluZGV4KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHN3YXBSaWdodCA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBsaW5lYXJOb2RlTGlzdCwgbm9kZUluZGV4KSB7XG4gICAgICAgICAgICAvLyBTd2FwcGluZyByaWdodCBpcyB0aGUgc2FtZSBhcyBzd2FwcGluZyB0aGUgbm9kZSBvbmUgdG8gdGhlIHJpZ2h0XG4gICAgICAgICAgICAvLyBsZWZ0d2FyZC5cbiAgICAgICAgICAgIGlmIChub2RlSW5kZXggPCBsaW5lYXJOb2RlTGlzdC5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgc3dhcExlZnQoY29sbGVjdGlvbiwgbGluZWFyTm9kZUxpc3QsIG5vZGVJbmRleCArIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIGl0IGlzIGEgbm8tb3AgKGNhbm5vdCBzd2FwIHRoZSBsYXN0IG5vZGUgcmlnaHQpLlxuICAgICAgICB9O1xuICAgICAgICB2YXIgc2hpZnROb2RlID0gZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGV4cGxvcmF0aW9uSWQsIHN3YXBGdW5jdGlvbikge1xuICAgICAgICAgICAgLy8gVGhlcmUgaXMgbm90aGluZyB0byBzaGlmdCBpZiB0aGUgY29sbGVjdGlvbiBoYXMgb25seSAxIG5vZGUuXG4gICAgICAgICAgICBpZiAoY29sbGVjdGlvbi5nZXRDb2xsZWN0aW9uTm9kZUNvdW50KCkgPiAxKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpbmVhck5vZGVMaXN0ID0gX2dldENvbGxlY3Rpb25Ob2Rlc0luUGxheWFibGVPcmRlcihjb2xsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZUluZGV4ID0gZmluZE5vZGVJbmRleChsaW5lYXJOb2RlTGlzdCwgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGVJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzd2FwRnVuY3Rpb24oY29sbGVjdGlvbiwgbGluZWFyTm9kZUxpc3QsIG5vZGVJbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogR2l2ZW4gYSBjb2xsZWN0aW9uIGFuZCBhIGxpc3Qgb2YgY29tcGxldGVkIGV4cGxvcmF0aW9uIElEcyB3aXRoaW4gdGhlXG4gICAgICAgICAgICAgKiBjb250ZXh0IG9mIHRoYXQgY29sbGVjdGlvbiwgcmV0dXJucyBhIGxpc3Qgb2Ygd2hpY2ggZXhwbG9yYXRpb25zIGluIHRoZVxuICAgICAgICAgICAgICogY29sbGVjdGlvbiBpcyBpbW1lZGlhdGVseSBwbGF5YWJsZSBieSB0aGUgdXNlci4gTk9URTogVGhpcyBmdW5jdGlvblxuICAgICAgICAgICAgICogZG9lcyBub3QgYXNzdW1lIHRoYXQgdGhlIGNvbGxlY3Rpb24gaXMgbGluZWFyLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXROZXh0RXhwbG9yYXRpb25JZDogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGNvbXBsZXRlZEV4cElkcykge1xuICAgICAgICAgICAgICAgIHJldHVybiBfZ2V0TmV4dEV4cGxvcmF0aW9uSWQoY29sbGVjdGlvbiwgY29tcGxldGVkRXhwSWRzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEdpdmVuIGEgY29sbGVjdGlvbiwgcmV0dXJucyBhIGxpbmVhciBsaXN0IG9mIGNvbGxlY3Rpb24gbm9kZXMgd2hpY2hcbiAgICAgICAgICAgICAqIHJlcHJlc2VudHMgYSB2YWxpZCBwYXRoIGZvciBwbGF5aW5nIHRocm91Z2ggdGhpcyBjb2xsZWN0aW9uLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRDb2xsZWN0aW9uTm9kZXNJblBsYXlhYmxlT3JkZXI6IGZ1bmN0aW9uIChjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9nZXRDb2xsZWN0aW9uTm9kZXNJblBsYXlhYmxlT3JkZXIoY29sbGVjdGlvbik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBJbnNlcnRzIGEgbmV3IGNvbGxlY3Rpb24gbm9kZSBhdCB0aGUgZW5kIG9mIHRoZSBjb2xsZWN0aW9uJ3MgcGxheWFibGVcbiAgICAgICAgICAgICAqIGxpc3Qgb2YgZXhwbG9yYXRpb25zLCBiYXNlZCBvbiB0aGUgc3BlY2lmaWVkIGV4cGxvcmF0aW9uIElEIGFuZFxuICAgICAgICAgICAgICogZXhwbG9yYXRpb24gc3VtbWFyeSBiYWNrZW5kIG9iamVjdC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgYXBwZW5kQ29sbGVjdGlvbk5vZGU6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBleHBsb3JhdGlvbklkLCBzdW1tYXJ5QmFja2VuZE9iamVjdCkge1xuICAgICAgICAgICAgICAgIHZhciBsaW5lYXJOb2RlTGlzdCA9IF9nZXRDb2xsZWN0aW9uTm9kZXNJblBsYXlhYmxlT3JkZXIoY29sbGVjdGlvbik7XG4gICAgICAgICAgICAgICAgQ29sbGVjdGlvblVwZGF0ZVNlcnZpY2UuYWRkQ29sbGVjdGlvbk5vZGUoY29sbGVjdGlvbiwgZXhwbG9yYXRpb25JZCwgc3VtbWFyeUJhY2tlbmRPYmplY3QpO1xuICAgICAgICAgICAgICAgIGlmIChsaW5lYXJOb2RlTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsYXN0Tm9kZSA9IGxpbmVhck5vZGVMaXN0W2xpbmVhck5vZGVMaXN0Lmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgICAgICBhZGRBZnRlcihjb2xsZWN0aW9uLCBsYXN0Tm9kZS5nZXRFeHBsb3JhdGlvbklkKCksIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJlbW92ZSBhIGNvbGxlY3Rpb24gbm9kZSBmcm9tIGEgZ2l2ZW4gY29sbGVjdGlvbiB3aGljaCBtYXBzIHRvIHRoZVxuICAgICAgICAgICAgICogc3BlY2lmaWVkIGV4cGxvcmF0aW9uIElELiBUaGlzIGZ1bmN0aW9uIGVuc3VyZXMgdGhlIGxpbmVhciBzdHJ1Y3R1cmUgb2ZcbiAgICAgICAgICAgICAqIHRoZSBjb2xsZWN0aW9uIGlzIG1haW50YWluZWQuIFJldHVybnMgd2hldGhlciB0aGUgcHJvdmlkZWQgZXhwbG9yYXRpb25cbiAgICAgICAgICAgICAqIElEIGlzIGNvbnRhaW5lZCB3aXRoaW4gdGhlIGxpbmVhcmx5IHBsYXlhYmxlIHBhdGggb2YgdGhlIHNwZWNpZmllZFxuICAgICAgICAgICAgICogY29sbGVjdGlvbi5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcmVtb3ZlQ29sbGVjdGlvbk5vZGU6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjb2xsZWN0aW9uLmNvbnRhaW5zQ29sbGVjdGlvbk5vZGUoZXhwbG9yYXRpb25JZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBEZWxldGUgdGhlIG5vZGVcbiAgICAgICAgICAgICAgICBDb2xsZWN0aW9uVXBkYXRlU2VydmljZS5kZWxldGVDb2xsZWN0aW9uTm9kZShjb2xsZWN0aW9uLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIExvb2tzIHVwIGEgY29sbGVjdGlvbiBub2RlIGdpdmVuIGFuIGV4cGxvcmF0aW9uIElEIGluIHRoZSBzcGVjaWZpZWRcbiAgICAgICAgICAgICAqIGNvbGxlY3Rpb24gYW5kIGF0dGVtcHRzIHRvIHNoaWZ0IGl0IGxlZnQgaW4gdGhlIGxpbmVhciBvcmRlcmluZyBvZiB0aGVcbiAgICAgICAgICAgICAqIGNvbGxlY3Rpb24uIElmIHRoZSBub2RlIGlzIHRoZSBmaXJzdCBleHBsb3JhdGlvbiBwbGF5ZWQgYnkgdGhlIHBsYXllcixcbiAgICAgICAgICAgICAqIHRoZW4gdGhpcyBmdW5jdGlvbiBpcyBhIG5vLW9wLiBSZXR1cm5zIGZhbHNlIGlmIHRoZSBzcGVjaWZpZWRcbiAgICAgICAgICAgICAqIGV4cGxvcmF0aW9uIElEIGRvZXMgbm90IGFzc29jaWF0ZSB0byBhbnkgbm9kZXMgaW4gdGhlIGNvbGxlY3Rpb24uXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNoaWZ0Tm9kZUxlZnQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNoaWZ0Tm9kZShjb2xsZWN0aW9uLCBleHBsb3JhdGlvbklkLCBzd2FwTGVmdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBMb29rcyB1cCBhIGNvbGxlY3Rpb24gbm9kZSBnaXZlbiBhbiBleHBsb3JhdGlvbiBJRCBpbiB0aGUgc3BlY2lmaWVkXG4gICAgICAgICAgICAgKiBjb2xsZWN0aW9uIGFuZCBhdHRlbXB0cyB0byBzaGlmdCBpdCByaWdodCBpbiB0aGUgbGluZWFyIG9yZGVyaW5nIG9mIHRoZVxuICAgICAgICAgICAgICogY29sbGVjdGlvbi4gSWYgdGhlIG5vZGUgaXMgdGhlIGxhc3QgZXhwbG9yYXRpb24gcGxheWVkIGJ5IHRoZSBwbGF5ZXIsXG4gICAgICAgICAgICAgKiB0aGVuIHRoaXMgZnVuY3Rpb24gaXMgYSBuby1vcC4gUmV0dXJucyBmYWxzZSBpZiB0aGUgc3BlY2lmaWVkXG4gICAgICAgICAgICAgKiBleHBsb3JhdGlvbiBJRCBkb2VzIG5vdCBhc3NvY2lhdGUgdG8gYW55IG5vZGVzIGluIHRoZSBjb2xsZWN0aW9uLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzaGlmdE5vZGVSaWdodDogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2hpZnROb2RlKGNvbGxlY3Rpb24sIGV4cGxvcmF0aW9uSWQsIHN3YXBSaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgY3JlYXRpbmcgYSBuZXcgY29sbGVjdGlvbiBub2RlLlxuICovXG5yZXF1aXJlKCdkb21haW4vY29sbGVjdGlvbi9Db2xsZWN0aW9uTm9kZU9iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9jb2xsZWN0aW9uL0NvbGxlY3Rpb25VcGRhdGVTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vY29sbGVjdGlvbi9TZWFyY2hFeHBsb3JhdGlvbnNCYWNrZW5kQXBpU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3N1bW1hcnkvRXhwbG9yYXRpb25TdW1tYXJ5QmFja2VuZEFwaVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2ZpbHRlcnMvc3RyaW5nLXV0aWxpdHktZmlsdGVycy9ub3JtYWxpemUtd2hpdGVzcGFjZS5maWx0ZXIudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2NvbGxlY3Rpb25fZWRpdG9yL0NvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2NvbGxlY3Rpb25fZWRpdG9yL2VkaXRvcl90YWIvQ29sbGVjdGlvbkxpbmVhcml6ZXJTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9TaXRlQW5hbHl0aWNzU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvVmFsaWRhdG9yc1NlcnZpY2UudHMnKTtcbm9wcGlhLmRpcmVjdGl2ZSgnY29sbGVjdGlvbk5vZGVDcmVhdG9yJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL2NvbGxlY3Rpb25fZWRpdG9yL2VkaXRvcl90YWIvJyArXG4gICAgICAgICAgICAgICAgJ2NvbGxlY3Rpb25fbm9kZV9jcmVhdG9yX2RpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRzY29wZScsICckaHR0cCcsICckd2luZG93JywgJyRmaWx0ZXInLCAnQWxlcnRzU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ1ZhbGlkYXRvcnNTZXJ2aWNlJywgJ0NvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdDb2xsZWN0aW9uTGluZWFyaXplclNlcnZpY2UnLCAnQ29sbGVjdGlvblVwZGF0ZVNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdDb2xsZWN0aW9uTm9kZU9iamVjdEZhY3RvcnknLCAnRXhwbG9yYXRpb25TdW1tYXJ5QmFja2VuZEFwaVNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdTZWFyY2hFeHBsb3JhdGlvbnNCYWNrZW5kQXBpU2VydmljZScsICdTaXRlQW5hbHl0aWNzU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ0lOVkFMSURfTkFNRV9DSEFSUycsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJGh0dHAsICR3aW5kb3csICRmaWx0ZXIsIEFsZXJ0c1NlcnZpY2UsIFZhbGlkYXRvcnNTZXJ2aWNlLCBDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlLCBDb2xsZWN0aW9uTGluZWFyaXplclNlcnZpY2UsIENvbGxlY3Rpb25VcGRhdGVTZXJ2aWNlLCBDb2xsZWN0aW9uTm9kZU9iamVjdEZhY3RvcnksIEV4cGxvcmF0aW9uU3VtbWFyeUJhY2tlbmRBcGlTZXJ2aWNlLCBTZWFyY2hFeHBsb3JhdGlvbnNCYWNrZW5kQXBpU2VydmljZSwgU2l0ZUFuYWx5dGljc1NlcnZpY2UsIElOVkFMSURfTkFNRV9DSEFSUykge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29sbGVjdGlvbiA9IENvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2UuZ2V0Q29sbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUubmV3RXhwbG9yYXRpb25JZCA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUubmV3RXhwbG9yYXRpb25UaXRsZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2VhcmNoUXVlcnlIYXNFcnJvciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB2YXIgQ1JFQVRFX05FV19FWFBMT1JBVElPTl9VUkxfVEVNUExBVEUgPSAnL2NyZWF0ZS88ZXhwbG9yYXRpb25faWQ+JztcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIEZldGNoZXMgYSBsaXN0IG9mIGV4cGxvcmF0aW9uIG1ldGFkYXRhIGRpY3RzIGZyb20gYmFja2VuZCwgZ2l2ZW5cbiAgICAgICAgICAgICAgICAgICAgICogYSBzZWFyY2ggcXVlcnkuIEl0IHRoZW4gZXh0cmFjdHMgdGhlIHRpdGxlIGFuZCBpZCBvZiB0aGVcbiAgICAgICAgICAgICAgICAgICAgICogZXhwbG9yYXRpb24gdG8gcHJlcGFyZSB0eXBlYWhlYWQgb3B0aW9ucy5cbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5mZXRjaFR5cGVhaGVhZFJlc3VsdHMgPSBmdW5jdGlvbiAoc2VhcmNoUXVlcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1ZhbGlkU2VhcmNoUXVlcnkoc2VhcmNoUXVlcnkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlYXJjaFF1ZXJ5SGFzRXJyb3IgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gU2VhcmNoRXhwbG9yYXRpb25zQmFja2VuZEFwaVNlcnZpY2UuZmV0Y2hFeHBsb3JhdGlvbnMoc2VhcmNoUXVlcnkpLnRoZW4oZnVuY3Rpb24gKGV4cGxvcmF0aW9uTWV0YWRhdGFCYWNrZW5kRGljdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgb3B0aW9ucyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBsb3JhdGlvbk1ldGFkYXRhQmFja2VuZERpY3QuY29sbGVjdGlvbl9ub2RlX21ldGFkYXRhX2xpc3QuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghJHNjb3BlLmNvbGxlY3Rpb24uY29udGFpbnNDb2xsZWN0aW9uTm9kZShpdGVtLmlkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMucHVzaChpdGVtLnRpdGxlICsgJyAoJyArIGl0ZW0uaWQgKyAnKScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ1RoZXJlIHdhcyBhbiBlcnJvciB3aGVuIHNlYXJjaGluZyBmb3IgbWF0Y2hpbmcgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZXhwbG9yYXRpb25zLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNlYXJjaFF1ZXJ5SGFzRXJyb3IgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB2YXIgaXNWYWxpZFNlYXJjaFF1ZXJ5ID0gZnVuY3Rpb24gKHNlYXJjaFF1ZXJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBbGxvdyB1bmRlcnNjb3JlcyBiZWNhdXNlIHRoZXkgYXJlIGFsbG93ZWQgaW4gZXhwbG9yYXRpb24gSURzLlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIElOVkFMSURfU0VBUkNIX0NIQVJTID0gKElOVkFMSURfTkFNRV9DSEFSUy5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlbSAhPT0gJ18nO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBJTlZBTElEX1NFQVJDSF9DSEFSUy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWFyY2hRdWVyeS5pbmRleE9mKElOVkFMSURfU0VBUkNIX0NIQVJTW2ldKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB2YXIgYWRkRXhwbG9yYXRpb25Ub0NvbGxlY3Rpb24gPSBmdW5jdGlvbiAobmV3RXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFuZXdFeHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKCdDYW5ub3QgYWRkIGFuIGVtcHR5IGV4cGxvcmF0aW9uIElELicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuY29sbGVjdGlvbi5jb250YWluc0NvbGxlY3Rpb25Ob2RlKG5ld0V4cGxvcmF0aW9uSWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKCdUaGVyZSBpcyBhbHJlYWR5IGFuIGV4cGxvcmF0aW9uIGluIHRoaXMgY29sbGVjdGlvbiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3dpdGggdGhhdCBpZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBFeHBsb3JhdGlvblN1bW1hcnlCYWNrZW5kQXBpU2VydmljZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5sb2FkUHVibGljQW5kUHJpdmF0ZUV4cGxvcmF0aW9uU3VtbWFyaWVzKFtuZXdFeHBsb3JhdGlvbklkXSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoc3VtbWFyaWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN1bW1hcnlCYWNrZW5kT2JqZWN0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3VtbWFyaWVzLmxlbmd0aCAhPT0gMCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdW1tYXJpZXNbMF0uaWQgPT09IG5ld0V4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VtbWFyeUJhY2tlbmRPYmplY3QgPSBzdW1tYXJpZXNbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdW1tYXJ5QmFja2VuZE9iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDb2xsZWN0aW9uTGluZWFyaXplclNlcnZpY2UuYXBwZW5kQ29sbGVjdGlvbk5vZGUoJHNjb3BlLmNvbGxlY3Rpb24sIG5ld0V4cGxvcmF0aW9uSWQsIHN1bW1hcnlCYWNrZW5kT2JqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZygnVGhhdCBleHBsb3JhdGlvbiBkb2VzIG5vdCBleGlzdCBvciB5b3UgZG8gbm90IGhhdmUgZWRpdCAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdhY2Nlc3MgdG8gaXQuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZygnVGhlcmUgd2FzIGFuIGVycm9yIHdoaWxlIGFkZGluZyBhbiBleHBsb3JhdGlvbiB0byB0aGUgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdjb2xsZWN0aW9uLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb252ZXJ0VHlwZWFoZWFkVG9FeHBsb3JhdGlvbklkID0gZnVuY3Rpb24gKHR5cGVhaGVhZE9wdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1hdGNoUmVzdWx0cyA9IHR5cGVhaGVhZE9wdGlvbi5tYXRjaCgvXFwoKC4qPylcXCkkLyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2hSZXN1bHRzID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHR5cGVhaGVhZE9wdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaFJlc3VsdHNbMV07XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZXMgYSBuZXcgZXhwbG9yYXRpb24sIHRoZW4gYWRkcyBpdCB0byB0aGUgY29sbGVjdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNyZWF0ZU5ld0V4cGxvcmF0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRpdGxlID0gJGZpbHRlcignbm9ybWFsaXplV2hpdGVzcGFjZScpKCRzY29wZS5uZXdFeHBsb3JhdGlvblRpdGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghVmFsaWRhdG9yc1NlcnZpY2UuaXNWYWxpZEV4cGxvcmF0aW9uVGl0bGUodGl0bGUsIHRydWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGEgbmV3IGV4cGxvcmF0aW9uIHdpdGggdGhlIGdpdmVuIHRpdGxlLlxuICAgICAgICAgICAgICAgICAgICAgICAgJGh0dHAucG9zdCgnL2NvbnRyaWJ1dGVoYW5kbGVyL2NyZWF0ZV9uZXcnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IHRpdGxlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5uZXdFeHBsb3JhdGlvblRpdGxlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0V4cGxvcmF0aW9uSWQgPSByZXNwb25zZS5kYXRhLmV4cGxvcmF0aW9uSWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgU2l0ZUFuYWx5dGljc1NlcnZpY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlZ2lzdGVyQ3JlYXRlTmV3RXhwbG9yYXRpb25JbkNvbGxlY3Rpb25FdmVudChuZXdFeHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRFeHBsb3JhdGlvblRvQ29sbGVjdGlvbihuZXdFeHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBDaGVja3Mgd2hldGhlciB0aGUgdXNlciBoYXMgbGVmdCBhICcjJyBhdCB0aGUgZW5kIG9mIHRoZWlyIElEXG4gICAgICAgICAgICAgICAgICAgIC8vIGJ5IGFjY2lkZW50ICh3aGljaCBjYW4gaGFwcGVuIGlmIGl0J3MgYmVpbmcgY29weS9wYXN0ZWQgZnJvbSB0aGVcbiAgICAgICAgICAgICAgICAgICAgLy8gZWRpdG9yIHBhZ2UuXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pc01hbGZvcm1lZElkID0gZnVuY3Rpb24gKHR5cGVkRXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICh0eXBlZEV4cGxvcmF0aW9uSWQgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlZEV4cGxvcmF0aW9uSWQubGFzdEluZGV4T2YoJyMnKSA9PT1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZWRFeHBsb3JhdGlvbklkLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYWRkRXhwbG9yYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRFeHBsb3JhdGlvblRvQ29sbGVjdGlvbihjb252ZXJ0VHlwZWFoZWFkVG9FeHBsb3JhdGlvbklkKCRzY29wZS5uZXdFeHBsb3JhdGlvbklkKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubmV3RXhwbG9yYXRpb25JZCA9ICcnO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBkaXNwbGF5aW5nIGFuZCBlZGl0aW5nIGEgY29sbGVjdGlvbiBub2RlLiBUaGlzXG4gKiBkaXJlY3RpdmUgYWxsb3dzIGNyZWF0b3JzIHRvIHNoaWZ0IG5vZGVzIHRvIGxlZnQgb3IgcmlnaHRcbiAqIGFuZCBhbHNvIGRlbGV0ZSB0aGUgY29sbGVjdGlvbiBub2RlIHJlcHJlc2VudGVkIGJ5IHRoaXMgZGlyZWN0aXZlLlxuICovXG5yZXF1aXJlKCdkb21haW4vY29sbGVjdGlvbi9Db2xsZWN0aW9uVXBkYXRlU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvY29sbGVjdGlvbl9lZGl0b3IvQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvY29sbGVjdGlvbl9lZGl0b3IvZWRpdG9yX3RhYi9Db2xsZWN0aW9uTGluZWFyaXplclNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbm9wcGlhLmRpcmVjdGl2ZSgnY29sbGVjdGlvbk5vZGVFZGl0b3InLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBnZXRDb2xsZWN0aW9uTm9kZTogJyZjb2xsZWN0aW9uTm9kZScsXG4gICAgICAgICAgICAgICAgZ2V0TGluZWFySW5kZXg6ICcmbGluZWFySW5kZXgnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvY29sbGVjdGlvbl9lZGl0b3IvZWRpdG9yX3RhYi8nICtcbiAgICAgICAgICAgICAgICAnY29sbGVjdGlvbl9ub2RlX2VkaXRvcl9kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckc2NvcGUnLCAnQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZScsICdDb2xsZWN0aW9uTGluZWFyaXplclNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdDb2xsZWN0aW9uVXBkYXRlU2VydmljZScsICdBbGVydHNTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCBDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlLCBDb2xsZWN0aW9uTGluZWFyaXplclNlcnZpY2UsIENvbGxlY3Rpb25VcGRhdGVTZXJ2aWNlLCBBbGVydHNTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5jb2xsZWN0aW9uID0gQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZS5nZXRDb2xsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIERlbGV0ZXMgdGhpcyBjb2xsZWN0aW9uIG5vZGUgZnJvbSB0aGUgZnJvbnRlbmQgY29sbGVjdGlvblxuICAgICAgICAgICAgICAgICAgICAvLyBvYmplY3QgYW5kIGFsc28gdXBkYXRlcyB0aGUgY2hhbmdlbGlzdC5cbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRlbGV0ZU5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXhwbG9yYXRpb25JZCA9ICRzY29wZS5nZXRDb2xsZWN0aW9uTm9kZSgpLmdldEV4cGxvcmF0aW9uSWQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghQ29sbGVjdGlvbkxpbmVhcml6ZXJTZXJ2aWNlLnJlbW92ZUNvbGxlY3Rpb25Ob2RlKCRzY29wZS5jb2xsZWN0aW9uLCBleHBsb3JhdGlvbklkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuZmF0YWxXYXJuaW5nKCdJbnRlcm5hbCBjb2xsZWN0aW9uIGVkaXRvciBlcnJvci4gQ291bGQgbm90IGRlbGV0ZSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2V4cGxvcmF0aW9uIGJ5IElEOiAnICsgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIC8vIFNoaWZ0cyB0aGlzIGNvbGxlY3Rpb24gbm9kZSBsZWZ0IGluIHRoZSBsaW5lYXJpemVkIGxpc3Qgb2YgdGhlXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbGxlY3Rpb24sIGlmIHBvc3NpYmxlLlxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2hpZnROb2RlTGVmdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBleHBsb3JhdGlvbklkID0gJHNjb3BlLmdldENvbGxlY3Rpb25Ob2RlKCkuZ2V0RXhwbG9yYXRpb25JZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFDb2xsZWN0aW9uTGluZWFyaXplclNlcnZpY2Uuc2hpZnROb2RlTGVmdCgkc2NvcGUuY29sbGVjdGlvbiwgZXhwbG9yYXRpb25JZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmZhdGFsV2FybmluZygnSW50ZXJuYWwgY29sbGVjdGlvbiBlZGl0b3IgZXJyb3IuIENvdWxkIG5vdCBzaGlmdCBub2RlIGxlZnQgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd3aXRoIElEOiAnICsgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIC8vIFNoaWZ0cyB0aGlzIGNvbGxlY3Rpb24gbm9kZSByaWdodCBpbiB0aGUgbGluZWFyaXplZCBsaXN0IG9mIHRoZVxuICAgICAgICAgICAgICAgICAgICAvLyBjb2xsZWN0aW9uLCBpZiBwb3NzaWJsZS5cbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNoaWZ0Tm9kZVJpZ2h0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4cGxvcmF0aW9uSWQgPSAkc2NvcGUuZ2V0Q29sbGVjdGlvbk5vZGUoKS5nZXRFeHBsb3JhdGlvbklkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIUNvbGxlY3Rpb25MaW5lYXJpemVyU2VydmljZS5zaGlmdE5vZGVSaWdodCgkc2NvcGUuY29sbGVjdGlvbiwgZXhwbG9yYXRpb25JZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmZhdGFsV2FybmluZygnSW50ZXJuYWwgY29sbGVjdGlvbiBlZGl0b3IgZXJyb3IuIENvdWxkIG5vdCBzaGlmdCBub2RlICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAncmlnaHQgd2l0aCBJRDogJyArIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29udHJvbGxlciBmb3IgdGhlIGhpc3RvcnkgdGFiIG9mIHRoZSBjb2xsZWN0aW9uIGVkaXRvci5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xub3BwaWEuZGlyZWN0aXZlKCdjb2xsZWN0aW9uSGlzdG9yeVRhYicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9jb2xsZWN0aW9uX2VkaXRvci9oaXN0b3J5X3RhYi8nICtcbiAgICAgICAgICAgICAgICAnY29sbGVjdGlvbl9oaXN0b3J5X3RhYl9kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW2Z1bmN0aW9uICgpIHsgfV1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBkaXNwbGF5aW5nIGFuZCBlZGl0aW5nIGEgY29sbGVjdGlvbiBkZXRhaWxzLlxuICogRWRpdCBvcHRpb25zIGluY2x1ZGU6IGNoYW5naW5nIHRoZSB0aXRsZSwgb2JqZWN0aXZlLCBhbmQgY2F0ZWdvcnksIGFuZCBhbHNvXG4gKiBhZGRpbmcgYSBuZXcgZXhwbG9yYXRpb24uXG4gKi9cbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtZGlyZWN0aXZlcy9zZWxlY3QyLWRyb3Bkb3duLycgK1xuICAgICdzZWxlY3QyLWRyb3Bkb3duLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL2NvbGxlY3Rpb24vQ29sbGVjdGlvblVwZGF0ZVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9jb2xsZWN0aW9uL0NvbGxlY3Rpb25WYWxpZGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvY29sbGVjdGlvbl9lZGl0b3IvQ29sbGVjdGlvbkVkaXRvci50cycpO1xucmVxdWlyZSgncGFnZXMvY29sbGVjdGlvbl9lZGl0b3IvQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xub3BwaWEuZGlyZWN0aXZlKCdjb2xsZWN0aW9uRGV0YWlsc0VkaXRvcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9jb2xsZWN0aW9uX2VkaXRvci9zZXR0aW5nc190YWIvJyArXG4gICAgICAgICAgICAgICAgJ2NvbGxlY3Rpb25fZGV0YWlsc19lZGl0b3JfZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJ0NvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2UnLCAnQ29sbGVjdGlvblVwZGF0ZVNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdDb2xsZWN0aW9uVmFsaWRhdGlvblNlcnZpY2UnLCAnQWxlcnRzU2VydmljZScsICdBTExfQ0FURUdPUklFUycsXG4gICAgICAgICAgICAgICAgJ0VWRU5UX0NPTExFQ1RJT05fSU5JVElBTElaRUQnLCAnRVZFTlRfQ09MTEVDVElPTl9SRUlOSVRJQUxJWkVEJyxcbiAgICAgICAgICAgICAgICAnQ09MTEVDVElPTl9USVRMRV9JTlBVVF9GT0NVU19MQUJFTCcsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZSwgQ29sbGVjdGlvblVwZGF0ZVNlcnZpY2UsIENvbGxlY3Rpb25WYWxpZGF0aW9uU2VydmljZSwgQWxlcnRzU2VydmljZSwgQUxMX0NBVEVHT1JJRVMsIEVWRU5UX0NPTExFQ1RJT05fSU5JVElBTElaRUQsIEVWRU5UX0NPTExFQ1RJT05fUkVJTklUSUFMSVpFRCwgQ09MTEVDVElPTl9USVRMRV9JTlBVVF9GT0NVU19MQUJFTCkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY29sbGVjdGlvbiA9IENvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2UuZ2V0Q29sbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuQ09MTEVDVElPTl9USVRMRV9JTlBVVF9GT0NVU19MQUJFTCA9IChDT0xMRUNUSU9OX1RJVExFX0lOUFVUX0ZPQ1VTX0xBQkVMKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmhhc1BhZ2VMb2FkZWQgPSAoQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZS5oYXNMb2FkZWRDb2xsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLkNBVEVHT1JZX0xJU1RfRk9SX1NFTEVDVDIgPSBBTExfQ0FURUdPUklFUy5tYXAoZnVuY3Rpb24gKGNhdGVnb3J5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBjYXRlZ29yeSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBjYXRlZ29yeVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5sYW5ndWFnZUxpc3RGb3JTZWxlY3QgPSBjb25zdGFudHMuQUxMX0xBTkdVQUdFX0NPREVTO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuVEFHX1JFR0VYID0gR0xPQkFMUy5UQUdfUkVHRVg7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZWZyZXNoU2V0dGluZ3NUYWIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZGlzcGxheWVkQ29sbGVjdGlvblRpdGxlID0gJHNjb3BlLmNvbGxlY3Rpb24uZ2V0VGl0bGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5kaXNwbGF5ZWRDb2xsZWN0aW9uT2JqZWN0aXZlID0gKCRzY29wZS5jb2xsZWN0aW9uLmdldE9iamVjdGl2ZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5kaXNwbGF5ZWRDb2xsZWN0aW9uQ2F0ZWdvcnkgPSAoJHNjb3BlLmNvbGxlY3Rpb24uZ2V0Q2F0ZWdvcnkoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZGlzcGxheWVkQ29sbGVjdGlvbkxhbmd1YWdlID0gKCRzY29wZS5jb2xsZWN0aW9uLmdldExhbmd1YWdlQ29kZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5kaXNwbGF5ZWRDb2xsZWN0aW9uVGFncyA9ICgkc2NvcGUuY29sbGVjdGlvbi5nZXRUYWdzKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNhdGVnb3J5SXNJblNlbGVjdDIgPSAkc2NvcGUuQ0FURUdPUllfTElTVF9GT1JfU0VMRUNUMi5zb21lKGZ1bmN0aW9uIChjYXRlZ29yeUl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2F0ZWdvcnlJdGVtLmlkID09PSAkc2NvcGUuY29sbGVjdGlvbi5nZXRDYXRlZ29yeSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgY3VycmVudCBjYXRlZ29yeSBpcyBub3QgaW4gdGhlIGRyb3Bkb3duLCBhZGQgaXRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFzIHRoZSBmaXJzdCBvcHRpb24uXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWNhdGVnb3J5SXNJblNlbGVjdDIgJiYgJHNjb3BlLmNvbGxlY3Rpb24uZ2V0Q2F0ZWdvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5DQVRFR09SWV9MSVNUX0ZPUl9TRUxFQ1QyLnVuc2hpZnQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogJHNjb3BlLmNvbGxlY3Rpb24uZ2V0Q2F0ZWdvcnkoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJHNjb3BlLmNvbGxlY3Rpb24uZ2V0Q2F0ZWdvcnkoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKEVWRU5UX0NPTExFQ1RJT05fSU5JVElBTElaRUQsIHJlZnJlc2hTZXR0aW5nc1RhYik7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kb24oRVZFTlRfQ09MTEVDVElPTl9SRUlOSVRJQUxJWkVELCByZWZyZXNoU2V0dGluZ3NUYWIpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudXBkYXRlQ29sbGVjdGlvblRpdGxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgQ29sbGVjdGlvblVwZGF0ZVNlcnZpY2Uuc2V0Q29sbGVjdGlvblRpdGxlKCRzY29wZS5jb2xsZWN0aW9uLCAkc2NvcGUuZGlzcGxheWVkQ29sbGVjdGlvblRpdGxlKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZUNvbGxlY3Rpb25PYmplY3RpdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBDb2xsZWN0aW9uVXBkYXRlU2VydmljZS5zZXRDb2xsZWN0aW9uT2JqZWN0aXZlKCRzY29wZS5jb2xsZWN0aW9uLCAkc2NvcGUuZGlzcGxheWVkQ29sbGVjdGlvbk9iamVjdGl2ZSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS51cGRhdGVDb2xsZWN0aW9uQ2F0ZWdvcnkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBDb2xsZWN0aW9uVXBkYXRlU2VydmljZS5zZXRDb2xsZWN0aW9uQ2F0ZWdvcnkoJHNjb3BlLmNvbGxlY3Rpb24sICRzY29wZS5kaXNwbGF5ZWRDb2xsZWN0aW9uQ2F0ZWdvcnkpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudXBkYXRlQ29sbGVjdGlvbkxhbmd1YWdlQ29kZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIENvbGxlY3Rpb25VcGRhdGVTZXJ2aWNlLnNldENvbGxlY3Rpb25MYW5ndWFnZUNvZGUoJHNjb3BlLmNvbGxlY3Rpb24sICRzY29wZS5kaXNwbGF5ZWRDb2xsZWN0aW9uTGFuZ3VhZ2UpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBOb3JtYWxpemUgdGhlIHRhZ3MgZm9yIHRoZSBjb2xsZWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIHZhciBub3JtYWxpemVUYWdzID0gZnVuY3Rpb24gKHRhZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGFncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ3NbaV0gPSB0YWdzW2ldLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICcgJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFncztcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnVwZGF0ZUNvbGxlY3Rpb25UYWdzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRpc3BsYXllZENvbGxlY3Rpb25UYWdzID0gbm9ybWFsaXplVGFncygkc2NvcGUuZGlzcGxheWVkQ29sbGVjdGlvblRhZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFDb2xsZWN0aW9uVmFsaWRhdGlvblNlcnZpY2UuaXNUYWdWYWxpZCgkc2NvcGUuZGlzcGxheWVkQ29sbGVjdGlvblRhZ3MpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKCdQbGVhc2UgZW5zdXJlIHRoYXQgdGhlcmUgYXJlIG5vIGR1cGxpY2F0ZSB0YWdzIGFuZCB0aGF0IGFsbCAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3RhZ3MgY29udGFpbiBvbmx5IGxvd2VyIGNhc2UgYW5kIHNwYWNlcy4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBDb2xsZWN0aW9uVXBkYXRlU2VydmljZS5zZXRDb2xsZWN0aW9uVGFncygkc2NvcGUuY29sbGVjdGlvbiwgJHNjb3BlLmRpc3BsYXllZENvbGxlY3Rpb25UYWdzKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgZGlzcGxheWluZyB0aGUgY29sbGVjdGlvbidzIG93bmVyIG5hbWUgYW5kXG4gKiBwZXJtaXNzaW9ucy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvY29sbGVjdGlvbl9lZGl0b3IvQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZS50cycpO1xub3BwaWEuZGlyZWN0aXZlKCdjb2xsZWN0aW9uUGVybWlzc2lvbnNDYXJkJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL2NvbGxlY3Rpb25fZWRpdG9yL3NldHRpbmdzX3RhYi8nICtcbiAgICAgICAgICAgICAgICAnY29sbGVjdGlvbl9wZXJtaXNzaW9uc19jYXJkX2RpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRzY29wZScsICdDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCBDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5jb2xsZWN0aW9uUmlnaHRzID1cbiAgICAgICAgICAgICAgICAgICAgICAgIENvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2UuZ2V0Q29sbGVjdGlvblJpZ2h0cygpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaGFzUGFnZUxvYWRlZCA9XG4gICAgICAgICAgICAgICAgICAgICAgICBDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlLmhhc0xvYWRlZENvbGxlY3Rpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb250cm9sbGVyIGZvciB0aGUgc2V0dGluZ3MgdGFiIG9mIHRoZSBjb2xsZWN0aW9uIGVkaXRvci5cbiAqL1xucmVxdWlyZSgncGFnZXMvY29sbGVjdGlvbl9lZGl0b3Ivc2V0dGluZ3NfdGFiL0NvbGxlY3Rpb25EZXRhaWxzRWRpdG9yRGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9jb2xsZWN0aW9uX2VkaXRvci9zZXR0aW5nc190YWIvQ29sbGVjdGlvblBlcm1pc3Npb25zQ2FyZERpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xub3BwaWEuZGlyZWN0aXZlKCdjb2xsZWN0aW9uU2V0dGluZ3NUYWInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvY29sbGVjdGlvbl9lZGl0b3Ivc2V0dGluZ3NfdGFiLycgK1xuICAgICAgICAgICAgICAgICdjb2xsZWN0aW9uX3NldHRpbmdzX3RhYl9kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW2Z1bmN0aW9uICgpIHsgfV1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29udHJvbGxlciBmb3IgdGhlIHN0YXRpc3RpY3MgdGFiIG9mIHRoZSBjb2xsZWN0aW9uIGVkaXRvci5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xub3BwaWEuZGlyZWN0aXZlKCdjb2xsZWN0aW9uU3RhdGlzdGljc1RhYicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9jb2xsZWN0aW9uX2VkaXRvci9zdGF0aXN0aWNzX3RhYi8nICtcbiAgICAgICAgICAgICAgICAnY29sbGVjdGlvbl9zdGF0aXN0aWNzX3RhYl9kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW2Z1bmN0aW9uICgpIHsgfV1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQSBzZXJ2aWNlIHRoYXQgbWFwcyBJRHMgdG8gQW5ndWxhciBuYW1lcy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2V4cGxvcmF0aW9uRWRpdG9yUGFnZU1vZHVsZScpLmZhY3RvcnkoJ0FuZ3VsYXJOYW1lU2VydmljZScsIFtmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhbmd1bGFyTmFtZSA9IG51bGw7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBnZXROYW1lT2ZJbnRlcmFjdGlvblJ1bGVzU2VydmljZTogZnVuY3Rpb24gKGludGVyYWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBhbmd1bGFyTmFtZSA9IGludGVyYWN0aW9uSWQuY2hhckF0KDApICtcbiAgICAgICAgICAgICAgICAgICAgaW50ZXJhY3Rpb25JZC5zbGljZSgxKSArICdSdWxlc1NlcnZpY2UnO1xuICAgICAgICAgICAgICAgIHJldHVybiBhbmd1bGFyTmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgZm9yIGRpc3BsYXlpbmcgZGlmZmVyZW50IHR5cGVzIG9mIG1vZGFscyBkZXBlbmRpbmdcbiAqIG9uIHRoZSB0eXBlIG9mIHJlc3BvbnNlIHJlY2VpdmVkIGFzIGEgcmVzdWx0IG9mIHRoZSBhdXRvc2F2aW5nIHJlcXVlc3QuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlLXNlcnZpY2VzLycgK1xuICAgICdjaGFuZ2VzLWluLWh1bWFuLXJlYWRhYmxlLWZvcm0uc2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2Utc2VydmljZXMvJyArXG4gICAgJ2V4cGxvcmF0aW9uLWRhdGEvZXhwbG9yYXRpb24tZGF0YS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Mb2NhbFN0b3JhZ2VTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnZXhwbG9yYXRpb25FZGl0b3JQYWdlTW9kdWxlJykuZmFjdG9yeSgnQXV0b3NhdmVJbmZvTW9kYWxzU2VydmljZScsIFtcbiAgICAnJGxvZycsICckdGltZW91dCcsICckdWliTW9kYWwnLCAnJHdpbmRvdycsXG4gICAgJ0NoYW5nZXNJbkh1bWFuUmVhZGFibGVGb3JtU2VydmljZScsICdFeHBsb3JhdGlvbkRhdGFTZXJ2aWNlJyxcbiAgICAnTG9jYWxTdG9yYWdlU2VydmljZScsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKCRsb2csICR0aW1lb3V0LCAkdWliTW9kYWwsICR3aW5kb3csIENoYW5nZXNJbkh1bWFuUmVhZGFibGVGb3JtU2VydmljZSwgRXhwbG9yYXRpb25EYXRhU2VydmljZSwgTG9jYWxTdG9yYWdlU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgdmFyIF9pc01vZGFsT3BlbiA9IGZhbHNlO1xuICAgICAgICB2YXIgX3JlZnJlc2hQYWdlID0gZnVuY3Rpb24gKGRlbGF5KSB7XG4gICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICAgICAgICAgIH0sIGRlbGF5KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNob3dOb25TdHJpY3RWYWxpZGF0aW9uRmFpbE1vZGFsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdleHBsb3JhdGlvbi1lZGl0b3ItcGFnZS10ZW1wbGF0ZXMvJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnc2F2ZS12YWxpZGF0aW9uLWZhaWwtbW9kYWwudGVtcGxhdGUuaHRtbCcpLFxuICAgICAgICAgICAgICAgICAgICAvLyBQcmV2ZW50IG1vZGFsIGZyb20gY2xvc2luZyB3aGVuIHRoZSB1c2VyIGNsaWNrcyBvdXRzaWRlIGl0LlxuICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcDogJ3N0YXRpYycsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJHVpYk1vZGFsSW5zdGFuY2UnLCBmdW5jdGlvbiAoJHNjb3BlLCAkdWliTW9kYWxJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jbG9zZUFuZFJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfcmVmcmVzaFBhZ2UoMjApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICB9KS5yZXN1bHQudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIF9pc01vZGFsT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgX2lzTW9kYWxPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgX2lzTW9kYWxPcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc01vZGFsT3BlbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfaXNNb2RhbE9wZW47XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2hvd1ZlcnNpb25NaXNtYXRjaE1vZGFsOiBmdW5jdGlvbiAobG9zdENoYW5nZXMpIHtcbiAgICAgICAgICAgICAgICAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlLXRlbXBsYXRlcy8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdzYXZlLXZlcnNpb24tbWlzbWF0Y2gtbW9kYWwudGVtcGxhdGUuaHRtbCcpLFxuICAgICAgICAgICAgICAgICAgICAvLyBQcmV2ZW50IG1vZGFsIGZyb20gY2xvc2luZyB3aGVuIHRoZSB1c2VyIGNsaWNrcyBvdXRzaWRlIGl0LlxuICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcDogJ3N0YXRpYycsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgZnVuY3Rpb24gKCRzY29wZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdoZW4gdGhlIHVzZXIgY2xpY2tzIG9uIGRpc2NhcmQgY2hhbmdlcyBidXR0b24sIHNpZ25hbCBiYWNrZW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdG8gZGlzY2FyZCB0aGUgZHJhZnQgYW5kIHJlbG9hZCB0aGUgcGFnZSB0aGVyZWFmdGVyLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5kaXNjYXJkQ2hhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRXhwbG9yYXRpb25EYXRhU2VydmljZS5kaXNjYXJkRHJhZnQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3JlZnJlc2hQYWdlKDIwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaGFzTG9zdENoYW5nZXMgPSAobG9zdENoYW5nZXMgJiYgbG9zdENoYW5nZXMubGVuZ3RoID4gMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5oYXNMb3N0Q2hhbmdlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPKHNsbCk6IFRoaXMgc2hvdWxkIGFsc28gaW5jbHVkZSBjaGFuZ2VzIHRvIGV4cGxvcmF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHByb3BlcnRpZXMgKHN1Y2ggYXMgdGhlIGV4cGxvcmF0aW9uIHRpdGxlLCBjYXRlZ29yeSwgZXRjLikuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5sb3N0Q2hhbmdlc0h0bWwgPSAoQ2hhbmdlc0luSHVtYW5SZWFkYWJsZUZvcm1TZXJ2aWNlLm1ha2VIdW1hblJlYWRhYmxlKGxvc3RDaGFuZ2VzKS5odG1sKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkbG9nLmVycm9yKCdMb3N0IGNoYW5nZXM6ICcgKyBKU09OLnN0cmluZ2lmeShsb3N0Q2hhbmdlcykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgICAgICB3aW5kb3dDbGFzczogJ29wcGlhLWF1dG9zYXZlLXZlcnNpb24tbWlzbWF0Y2gtbW9kYWwnXG4gICAgICAgICAgICAgICAgfSkucmVzdWx0LnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBfaXNNb2RhbE9wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIF9pc01vZGFsT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIF9pc01vZGFsT3BlbiA9IHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2hvd0xvc3RDaGFuZ2VzTW9kYWw6IGZ1bmN0aW9uIChsb3N0Q2hhbmdlcywgZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UtdGVtcGxhdGVzLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2xvc3QtY2hhbmdlcy1tb2RhbC50ZW1wbGF0ZS5odG1sJyksXG4gICAgICAgICAgICAgICAgICAgIC8vIFByZXZlbnQgbW9kYWwgZnJvbSBjbG9zaW5nIHdoZW4gdGhlIHVzZXIgY2xpY2tzIG91dHNpZGUgaXQuXG4gICAgICAgICAgICAgICAgICAgIGJhY2tkcm9wOiAnc3RhdGljJyxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLCAnJHVpYk1vZGFsSW5zdGFuY2UnLCBmdW5jdGlvbiAoJHNjb3BlLCAkdWliTW9kYWxJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdoZW4gdGhlIHVzZXIgY2xpY2tzIG9uIGRpc2NhcmQgY2hhbmdlcyBidXR0b24sIHNpZ25hbCBiYWNrZW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdG8gZGlzY2FyZCB0aGUgZHJhZnQgYW5kIHJlbG9hZCB0aGUgcGFnZSB0aGVyZWFmdGVyLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTG9jYWxTdG9yYWdlU2VydmljZS5yZW1vdmVFeHBsb3JhdGlvbkRyYWZ0KGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5kaXNtaXNzKCdjYW5jZWwnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5sb3N0Q2hhbmdlc0h0bWwgPSAoQ2hhbmdlc0luSHVtYW5SZWFkYWJsZUZvcm1TZXJ2aWNlLm1ha2VIdW1hblJlYWRhYmxlKGxvc3RDaGFuZ2VzKS5odG1sKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRsb2cuZXJyb3IoJ0xvc3QgY2hhbmdlczogJyArIEpTT04uc3RyaW5naWZ5KGxvc3RDaGFuZ2VzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Q2xhc3M6ICdvcHBpYS1sb3N0LWNoYW5nZXMtbW9kYWwnXG4gICAgICAgICAgICAgICAgfSkucmVzdWx0LnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBfaXNNb2RhbE9wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIF9pc01vZGFsT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIF9pc01vZGFsT3BlbiA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEEgc2VydmljZSB0aGF0IG1haW50YWlucyBhIHByb3Zpc2lvbmFsIGxpc3Qgb2YgY2hhbmdlcyB0byBiZVxuICogY29tbWl0dGVkIHRvIHRoZSBzZXJ2ZXIuXG4gKi9cbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlLXNlcnZpY2VzLycgK1xuICAgICdhdXRvc2F2ZS1pbmZvLW1vZGFscy5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS1zZXJ2aWNlcy8nICtcbiAgICAnZXhwbG9yYXRpb24tZGF0YS9leHBsb3JhdGlvbi1kYXRhLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdleHBsb3JhdGlvbkVkaXRvclBhZ2VNb2R1bGUnKS5mYWN0b3J5KCdDaGFuZ2VMaXN0U2VydmljZScsIFtcbiAgICAnJGxvZycsICckcm9vdFNjb3BlJywgJ0FsZXJ0c1NlcnZpY2UnLCAnQXV0b3NhdmVJbmZvTW9kYWxzU2VydmljZScsXG4gICAgJ0V4cGxvcmF0aW9uRGF0YVNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkbG9nLCAkcm9vdFNjb3BlLCBBbGVydHNTZXJ2aWNlLCBBdXRvc2F2ZUluZm9Nb2RhbHNTZXJ2aWNlLCBFeHBsb3JhdGlvbkRhdGFTZXJ2aWNlKSB7XG4gICAgICAgIC8vIFRPRE8oc2xsKTogSW1wbGVtZW50IHVuZG8sIHJlZG8gZnVuY3Rpb25hbGl0eS4gU2hvdyBhIG1lc3NhZ2Ugb24gZWFjaFxuICAgICAgICAvLyBzdGVwIHNheWluZyB3aGF0IHRoZSBzdGVwIGlzIGRvaW5nLlxuICAgICAgICAvLyBUT0RPKHNsbCk6IEFsbG93IHRoZSB1c2VyIHRvIHZpZXcgdGhlIGxpc3Qgb2YgY2hhbmdlcyBtYWRlIHNvIGZhciwgYXNcbiAgICAgICAgLy8gd2VsbCBhcyB0aGUgbGlzdCBvZiBjaGFuZ2VzIGluIHRoZSB1bmRvIHN0YWNrLlxuICAgICAgICAvLyBUZW1wb3JhcnkgYnVmZmVyIGZvciBjaGFuZ2VzIG1hZGUgdG8gdGhlIGV4cGxvcmF0aW9uLlxuICAgICAgICB2YXIgZXhwbG9yYXRpb25DaGFuZ2VMaXN0ID0gW107XG4gICAgICAgIC8vIFN0YWNrIGZvciBzdG9yaW5nIHVuZG9uZSBjaGFuZ2VzLiBUaGUgbGFzdCBlbGVtZW50IGlzIHRoZSBtb3N0IHJlY2VudGx5XG4gICAgICAgIC8vIHVuZG9uZSBjaGFuZ2UuXG4gICAgICAgIHZhciB1bmRvbmVDaGFuZ2VTdGFjayA9IFtdO1xuICAgICAgICAvLyBBbGwgdGhlc2UgY29uc3RhbnRzIHNob3VsZCBjb3JyZXNwb25kIHRvIHRob3NlIGluIGV4cF9kb21haW4ucHkuXG4gICAgICAgIC8vIFRPRE8oc2xsKTogRW5mb3JjZSB0aGlzIGluIGNvZGUuXG4gICAgICAgIHZhciBDTURfQUREX1NUQVRFID0gJ2FkZF9zdGF0ZSc7XG4gICAgICAgIHZhciBDTURfUkVOQU1FX1NUQVRFID0gJ3JlbmFtZV9zdGF0ZSc7XG4gICAgICAgIHZhciBDTURfREVMRVRFX1NUQVRFID0gJ2RlbGV0ZV9zdGF0ZSc7XG4gICAgICAgIHZhciBDTURfRURJVF9TVEFURV9QUk9QRVJUWSA9ICdlZGl0X3N0YXRlX3Byb3BlcnR5JztcbiAgICAgICAgdmFyIENNRF9FRElUX0VYUExPUkFUSU9OX1BST1BFUlRZID0gJ2VkaXRfZXhwbG9yYXRpb25fcHJvcGVydHknO1xuICAgICAgICB2YXIgQUxMT1dFRF9FWFBMT1JBVElPTl9CQUNLRU5EX05BTUVTID0ge1xuICAgICAgICAgICAgY2F0ZWdvcnk6IHRydWUsXG4gICAgICAgICAgICBpbml0X3N0YXRlX25hbWU6IHRydWUsXG4gICAgICAgICAgICBsYW5ndWFnZV9jb2RlOiB0cnVlLFxuICAgICAgICAgICAgb2JqZWN0aXZlOiB0cnVlLFxuICAgICAgICAgICAgcGFyYW1fY2hhbmdlczogdHJ1ZSxcbiAgICAgICAgICAgIHBhcmFtX3NwZWNzOiB0cnVlLFxuICAgICAgICAgICAgdGFnczogdHJ1ZSxcbiAgICAgICAgICAgIHRpdGxlOiB0cnVlLFxuICAgICAgICAgICAgYXV0b190dHNfZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgIGNvcnJlY3RuZXNzX2ZlZWRiYWNrX2VuYWJsZWQ6IHRydWVcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIEFMTE9XRURfU1RBVEVfQkFDS0VORF9OQU1FUyA9IHtcbiAgICAgICAgICAgIGFuc3dlcl9ncm91cHM6IHRydWUsXG4gICAgICAgICAgICBjb25maXJtZWRfdW5jbGFzc2lmaWVkX2Fuc3dlcnM6IHRydWUsXG4gICAgICAgICAgICBjb250ZW50OiB0cnVlLFxuICAgICAgICAgICAgcmVjb3JkZWRfdm9pY2VvdmVyczogdHJ1ZSxcbiAgICAgICAgICAgIGRlZmF1bHRfb3V0Y29tZTogdHJ1ZSxcbiAgICAgICAgICAgIGhpbnRzOiB0cnVlLFxuICAgICAgICAgICAgcGFyYW1fY2hhbmdlczogdHJ1ZSxcbiAgICAgICAgICAgIHBhcmFtX3NwZWNzOiB0cnVlLFxuICAgICAgICAgICAgc29sdXRpb246IHRydWUsXG4gICAgICAgICAgICBzdGF0ZV9uYW1lOiB0cnVlLFxuICAgICAgICAgICAgd2lkZ2V0X2N1c3RvbWl6YXRpb25fYXJnczogdHJ1ZSxcbiAgICAgICAgICAgIHdpZGdldF9pZDogdHJ1ZSxcbiAgICAgICAgICAgIHdyaXR0ZW5fdHJhbnNsYXRpb25zOiB0cnVlXG4gICAgICAgIH07XG4gICAgICAgIHZhciBhdXRvc2F2ZUNoYW5nZUxpc3RPbkNoYW5nZSA9IGZ1bmN0aW9uIChleHBsb3JhdGlvbkNoYW5nZUxpc3QpIHtcbiAgICAgICAgICAgIC8vIEFzeW5jaHJvbm91c2x5IHNlbmQgYW4gYXV0b3NhdmUgcmVxdWVzdCwgYW5kIGNoZWNrIGZvciBlcnJvcnMgaW4gdGhlXG4gICAgICAgICAgICAvLyByZXNwb25zZTpcbiAgICAgICAgICAgIC8vIElmIGVycm9yIGlzIHByZXNlbnQgLT4gQ2hlY2sgZm9yIHRoZSB0eXBlIG9mIGVycm9yIG9jY3VycmVkXG4gICAgICAgICAgICAvLyAoRGlzcGxheSB0aGUgY29ycmVzcG9uZGluZyBtb2RhbHMgaW4gYm90aCBjYXNlcywgaWYgbm90IGFscmVhZHlcbiAgICAgICAgICAgIC8vIG9wZW5lZCk6XG4gICAgICAgICAgICAvLyAtIFZlcnNpb24gTWlzbWF0Y2guXG4gICAgICAgICAgICAvLyAtIE5vbi1zdHJpY3QgVmFsaWRhdGlvbiBGYWlsLlxuICAgICAgICAgICAgRXhwbG9yYXRpb25EYXRhU2VydmljZS5hdXRvc2F2ZUNoYW5nZUxpc3QoZXhwbG9yYXRpb25DaGFuZ2VMaXN0LCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXJlc3BvbnNlLmRhdGEuaXNfdmVyc2lvbl9vZl9kcmFmdF92YWxpZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIUF1dG9zYXZlSW5mb01vZGFsc1NlcnZpY2UuaXNNb2RhbE9wZW4oKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgQXV0b3NhdmVJbmZvTW9kYWxzU2VydmljZS5zaG93VmVyc2lvbk1pc21hdGNoTW9kYWwoZXhwbG9yYXRpb25DaGFuZ2VMaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmNsZWFyV2FybmluZ3MoKTtcbiAgICAgICAgICAgICAgICAkbG9nLmVycm9yKCdub25TdHJpY3RWYWxpZGF0aW9uRmFpbHVyZTogJyArXG4gICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KGV4cGxvcmF0aW9uQ2hhbmdlTGlzdCkpO1xuICAgICAgICAgICAgICAgIGlmICghQXV0b3NhdmVJbmZvTW9kYWxzU2VydmljZS5pc01vZGFsT3BlbigpKSB7XG4gICAgICAgICAgICAgICAgICAgIEF1dG9zYXZlSW5mb01vZGFsc1NlcnZpY2Uuc2hvd05vblN0cmljdFZhbGlkYXRpb25GYWlsTW9kYWwoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGFkZENoYW5nZSA9IGZ1bmN0aW9uIChjaGFuZ2VEaWN0KSB7XG4gICAgICAgICAgICBpZiAoJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGV4cGxvcmF0aW9uQ2hhbmdlTGlzdC5wdXNoKGNoYW5nZURpY3QpO1xuICAgICAgICAgICAgdW5kb25lQ2hhbmdlU3RhY2sgPSBbXTtcbiAgICAgICAgICAgIGF1dG9zYXZlQ2hhbmdlTGlzdE9uQ2hhbmdlKGV4cGxvcmF0aW9uQ2hhbmdlTGlzdCk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNhdmVzIGEgY2hhbmdlIGRpY3QgdGhhdCByZXByZXNlbnRzIGFkZGluZyBhIG5ldyBzdGF0ZS4gSXQgaXMgdGhlXG4gICAgICAgICAgICAgKiByZXNwb25zYmlsaXR5IG9mIHRoZSBjYWxsZXIgdG8gY2hlY2sgdGhhdCB0aGUgbmV3IHN0YXRlIG5hbWUgaXMgdmFsaWQuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBuZXdseS1hZGRlZCBzdGF0ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhZGRTdGF0ZTogZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIGFkZENoYW5nZSh7XG4gICAgICAgICAgICAgICAgICAgIGNtZDogQ01EX0FERF9TVEFURSxcbiAgICAgICAgICAgICAgICAgICAgc3RhdGVfbmFtZTogc3RhdGVOYW1lXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTYXZlcyBhIGNoYW5nZSBkaWN0IHRoYXQgcmVwcmVzZW50cyBkZWxldGluZyBhIG5ldyBzdGF0ZS4gSXQgaXMgdGhlXG4gICAgICAgICAgICAgKiByZXNwb25zYmlsaXR5IG9mIHRoZSBjYWxsZXIgdG8gY2hlY2sgdGhhdCB0aGUgZGVsZXRlZCBzdGF0ZSBuYW1lXG4gICAgICAgICAgICAgKiBjb3JyZXNwb25kcyB0byBhbiBleGlzdGluZyBzdGF0ZS5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdGVOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGRlbGV0ZWQgc3RhdGUuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGRlbGV0ZVN0YXRlOiBmdW5jdGlvbiAoc3RhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgYWRkQ2hhbmdlKHtcbiAgICAgICAgICAgICAgICAgICAgY21kOiBDTURfREVMRVRFX1NUQVRFLFxuICAgICAgICAgICAgICAgICAgICBzdGF0ZV9uYW1lOiBzdGF0ZU5hbWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkaXNjYXJkQWxsQ2hhbmdlczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGV4cGxvcmF0aW9uQ2hhbmdlTGlzdCA9IFtdO1xuICAgICAgICAgICAgICAgIHVuZG9uZUNoYW5nZVN0YWNrID0gW107XG4gICAgICAgICAgICAgICAgRXhwbG9yYXRpb25EYXRhU2VydmljZS5kaXNjYXJkRHJhZnQoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNhdmVzIGEgY2hhbmdlIGRpY3QgdGhhdCByZXByZXNlbnRzIGEgY2hhbmdlIHRvIGFuIGV4cGxvcmF0aW9uXG4gICAgICAgICAgICAgKiBwcm9wZXJ0eSAoc3VjaCBhcyBpdHMgdGl0bGUsIGNhdGVnb3J5LCAuLi4pLiBJdCBpcyB0aGUgcmVzcG9uc2liaWxpdHlcbiAgICAgICAgICAgICAqIG9mIHRoZSBjYWxsZXIgdG8gY2hlY2sgdGhhdCB0aGUgb2xkIGFuZCBuZXcgdmFsdWVzIGFyZSBub3QgZXF1YWwuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGJhY2tlbmROYW1lIC0gVGhlIGJhY2tlbmQgbmFtZSBvZiB0aGUgcHJvcGVydHlcbiAgICAgICAgICAgICAqICAgKGUuZy4gdGl0bGUsIGNhdGVnb3J5KVxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5ld1ZhbHVlIC0gVGhlIG5ldyB2YWx1ZSBvZiB0aGUgcHJvcGVydHlcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBvbGRWYWx1ZSAtIFRoZSBwcmV2aW91cyB2YWx1ZSBvZiB0aGUgcHJvcGVydHlcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZWRpdEV4cGxvcmF0aW9uUHJvcGVydHk6IGZ1bmN0aW9uIChiYWNrZW5kTmFtZSwgbmV3VmFsdWUsIG9sZFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFBTExPV0VEX0VYUExPUkFUSU9OX0JBQ0tFTkRfTkFNRVMuaGFzT3duUHJvcGVydHkoYmFja2VuZE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZygnSW52YWxpZCBleHBsb3JhdGlvbiBwcm9wZXJ0eTogJyArIGJhY2tlbmROYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhZGRDaGFuZ2Uoe1xuICAgICAgICAgICAgICAgICAgICBjbWQ6IENNRF9FRElUX0VYUExPUkFUSU9OX1BST1BFUlRZLFxuICAgICAgICAgICAgICAgICAgICBuZXdfdmFsdWU6IGFuZ3VsYXIuY29weShuZXdWYWx1ZSksXG4gICAgICAgICAgICAgICAgICAgIG9sZF92YWx1ZTogYW5ndWxhci5jb3B5KG9sZFZhbHVlKSxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlfbmFtZTogYmFja2VuZE5hbWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNhdmVzIGEgY2hhbmdlIGRpY3QgdGhhdCByZXByZXNlbnRzIGEgY2hhbmdlIHRvIGEgc3RhdGUgcHJvcGVydHkuIEl0XG4gICAgICAgICAgICAgKiBpcyB0aGUgcmVzcG9uc2liaWxpdHkgb2YgdGhlIGNhbGxlciB0byBjaGVjayB0aGF0IHRoZSBvbGQgYW5kIG5ld1xuICAgICAgICAgICAgICogdmFsdWVzIGFyZSBub3QgZXF1YWwuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBzdGF0ZSB0aGF0IGlzIGJlaW5nIGVkaXRlZFxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGJhY2tlbmROYW1lIC0gVGhlIGJhY2tlbmQgbmFtZSBvZiB0aGUgZWRpdGVkIHByb3BlcnR5XG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmV3VmFsdWUgLSBUaGUgbmV3IHZhbHVlIG9mIHRoZSBwcm9wZXJ0eVxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG9sZFZhbHVlIC0gVGhlIHByZXZpb3VzIHZhbHVlIG9mIHRoZSBwcm9wZXJ0eVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBlZGl0U3RhdGVQcm9wZXJ0eTogZnVuY3Rpb24gKHN0YXRlTmFtZSwgYmFja2VuZE5hbWUsIG5ld1ZhbHVlLCBvbGRWYWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICghQUxMT1dFRF9TVEFURV9CQUNLRU5EX05BTUVTLmhhc093blByb3BlcnR5KGJhY2tlbmROYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ0ludmFsaWQgc3RhdGUgcHJvcGVydHk6ICcgKyBiYWNrZW5kTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYWRkQ2hhbmdlKHtcbiAgICAgICAgICAgICAgICAgICAgY21kOiBDTURfRURJVF9TVEFURV9QUk9QRVJUWSxcbiAgICAgICAgICAgICAgICAgICAgbmV3X3ZhbHVlOiBhbmd1bGFyLmNvcHkobmV3VmFsdWUpLFxuICAgICAgICAgICAgICAgICAgICBvbGRfdmFsdWU6IGFuZ3VsYXIuY29weShvbGRWYWx1ZSksXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5X25hbWU6IGJhY2tlbmROYW1lLFxuICAgICAgICAgICAgICAgICAgICBzdGF0ZV9uYW1lOiBzdGF0ZU5hbWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRDaGFuZ2VMaXN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFuZ3VsYXIuY29weShleHBsb3JhdGlvbkNoYW5nZUxpc3QpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzRXhwbG9yYXRpb25Mb2NrZWRGb3JFZGl0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4cGxvcmF0aW9uQ2hhbmdlTGlzdC5sZW5ndGggPiAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogSW5pdGlhbGl6ZXMgdGhlIGN1cnJlbnQgY2hhbmdlTGlzdCB3aXRoIHRoZSBvbmUgcmVjZWl2ZWQgZnJvbSBiYWNrZW5kLlxuICAgICAgICAgICAgICogVGhpcyBiZWhhdmlvciBleGlzdHMgb25seSBpbiBjYXNlIG9mIGFuIGF1dG9zYXZlLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBjaGFuZ2VMaXN0IC0gQXV0b3NhdmVkIGNoYW5nZUxpc3QgZGF0YVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBsb2FkQXV0b3NhdmVkQ2hhbmdlTGlzdDogZnVuY3Rpb24gKGNoYW5nZUxpc3QpIHtcbiAgICAgICAgICAgICAgICBleHBsb3JhdGlvbkNoYW5nZUxpc3QgPSBjaGFuZ2VMaXN0O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2F2ZXMgYSBjaGFuZ2UgZGljdCB0aGF0IHJlcHJlc2VudHMgdGhlIHJlbmFtaW5nIG9mIGEgc3RhdGUuIFRoaXNcbiAgICAgICAgICAgICAqIGlzIGFsc28gaW50ZW5kZWQgdG8gY2hhbmdlIHRoZSBpbml0aWFsIHN0YXRlIG5hbWUgaWYgbmVjZXNzYXJ5XG4gICAgICAgICAgICAgKiAodGhhdCBpcywgdGhlIGxhdHRlciBjaGFuZ2UgaXMgaW1wbGllZCBhbmQgZG9lcyBub3QgaGF2ZSB0byBiZVxuICAgICAgICAgICAgICogcmVjb3JkZWQgc2VwYXJhdGVseSBpbiBhbm90aGVyIGNoYW5nZSBkaWN0KS4gSXQgaXMgdGhlIHJlc3BvbnNpYmlsaXR5XG4gICAgICAgICAgICAgKiBvZiB0aGUgY2FsbGVyIHRvIGNoZWNrIHRoYXQgdGhlIHR3byBuYW1lcyBhcmUgbm90IGVxdWFsLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuZXdTdGF0ZU5hbWUgLSBUaGUgbmV3IG5hbWUgb2YgdGhlIHN0YXRlXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gb2xkU3RhdGVOYW1lIC0gVGhlIHByZXZpb3VzIG5hbWUgb2YgdGhlIHN0YXRlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHJlbmFtZVN0YXRlOiBmdW5jdGlvbiAobmV3U3RhdGVOYW1lLCBvbGRTdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICBhZGRDaGFuZ2Uoe1xuICAgICAgICAgICAgICAgICAgICBjbWQ6IENNRF9SRU5BTUVfU1RBVEUsXG4gICAgICAgICAgICAgICAgICAgIG5ld19zdGF0ZV9uYW1lOiBuZXdTdGF0ZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgIG9sZF9zdGF0ZV9uYW1lOiBvbGRTdGF0ZU5hbWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1bmRvTGFzdENoYW5nZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChleHBsb3JhdGlvbkNoYW5nZUxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZygnVGhlcmUgYXJlIG5vIGNoYW5nZXMgdG8gdW5kby4nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgbGFzdENoYW5nZSA9IGV4cGxvcmF0aW9uQ2hhbmdlTGlzdC5wb3AoKTtcbiAgICAgICAgICAgICAgICB1bmRvbmVDaGFuZ2VTdGFjay5wdXNoKGxhc3RDaGFuZ2UpO1xuICAgICAgICAgICAgICAgIGF1dG9zYXZlQ2hhbmdlTGlzdE9uQ2hhbmdlKGV4cGxvcmF0aW9uQ2hhbmdlTGlzdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdG8gZ2V0IGNoYW5nZXMgaW4gaHVtYW4gcmVhZGFibGUgZm9ybS5cbiAqL1xucmVxdWlyZSgnc2VydmljZXMvVXRpbHNTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnZXhwbG9yYXRpb25FZGl0b3JQYWdlTW9kdWxlJykuZmFjdG9yeSgnQ2hhbmdlc0luSHVtYW5SZWFkYWJsZUZvcm1TZXJ2aWNlJywgW1xuICAgICdVdGlsc1NlcnZpY2UnLCBmdW5jdGlvbiAoVXRpbHNTZXJ2aWNlKSB7XG4gICAgICAgIHZhciBDTURfQUREX1NUQVRFID0gJ2FkZF9zdGF0ZSc7XG4gICAgICAgIHZhciBDTURfUkVOQU1FX1NUQVRFID0gJ3JlbmFtZV9zdGF0ZSc7XG4gICAgICAgIHZhciBDTURfREVMRVRFX1NUQVRFID0gJ2RlbGV0ZV9zdGF0ZSc7XG4gICAgICAgIHZhciBDTURfRURJVF9TVEFURV9QUk9QRVJUWSA9ICdlZGl0X3N0YXRlX3Byb3BlcnR5JztcbiAgICAgICAgdmFyIG1ha2VSdWxlc0xpc3RIdW1hblJlYWRhYmxlID0gZnVuY3Rpb24gKGFuc3dlckdyb3VwVmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBydWxlc0xpc3QgPSBbXTtcbiAgICAgICAgICAgIGFuc3dlckdyb3VwVmFsdWUucnVsZXMuZm9yRWFjaChmdW5jdGlvbiAocnVsZSkge1xuICAgICAgICAgICAgICAgIHZhciBydWxlRWxtID0gYW5ndWxhci5lbGVtZW50KCc8bGk+PC9saT4nKTtcbiAgICAgICAgICAgICAgICBydWxlRWxtLmh0bWwoJzxwPlR5cGU6ICcgKyBydWxlLnR5cGUgKyAnPC9wPicpO1xuICAgICAgICAgICAgICAgIHJ1bGVFbG0uYXBwZW5kKCc8cD5WYWx1ZTogJyArIChPYmplY3Qua2V5cyhydWxlLmlucHV0cykubWFwKGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnVsZS5pbnB1dHNbaW5wdXRdO1xuICAgICAgICAgICAgICAgIH0pKS50b1N0cmluZygpICsgJzwvcD4nKTtcbiAgICAgICAgICAgICAgICBydWxlc0xpc3QucHVzaChydWxlRWxtKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHJ1bGVzTGlzdDtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gQW4gZWRpdCBpcyByZXByZXNlbnRlZCBlaXRoZXIgYXMgYW4gb2JqZWN0IG9yIGFuIGFycmF5LiBJZiBpdCdzIGFuXG4gICAgICAgIC8vIG9iamVjdCwgdGhlbiBzaW1wbHkgcmV0dXJuIHRoYXQgb2JqZWN0LiBJbiBjYXNlIG9mIGFuIGFycmF5LCByZXR1cm5cbiAgICAgICAgLy8gdGhlIGxhc3QgaXRlbS5cbiAgICAgICAgdmFyIGdldFN0YXRlUHJvcGVydHlWYWx1ZSA9IGZ1bmN0aW9uIChzdGF0ZVByb3BlcnR5VmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmlzQXJyYXkoc3RhdGVQcm9wZXJ0eVZhbHVlKSA/XG4gICAgICAgICAgICAgICAgc3RhdGVQcm9wZXJ0eVZhbHVlW3N0YXRlUHJvcGVydHlWYWx1ZS5sZW5ndGggLSAxXSA6IHN0YXRlUHJvcGVydHlWYWx1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gRGV0ZWN0cyB3aGV0aGVyIGFuIG9iamVjdCBvZiB0aGUgdHlwZSAnYW5zd2VyX2dyb3VwJyBvclxuICAgICAgICAvLyAnZGVmYXVsdF9vdXRjb21lJyBoYXMgYmVlbiBhZGRlZCwgZWRpdGVkIG9yIGRlbGV0ZWQuXG4gICAgICAgIC8vIFJldHVybnMgLSAnYWRkZGVkJywgJ2VkaXRlZCcgb3IgJ2RlbGV0ZWQnIGFjY29yZGluZ2x5LlxuICAgICAgICB2YXIgZ2V0UmVsYXRpdmVDaGFuZ2VUb0dyb3VwcyA9IGZ1bmN0aW9uIChjaGFuZ2VPYmplY3QpIHtcbiAgICAgICAgICAgIHZhciBuZXdWYWx1ZSA9IGNoYW5nZU9iamVjdC5uZXdfdmFsdWU7XG4gICAgICAgICAgICB2YXIgb2xkVmFsdWUgPSBjaGFuZ2VPYmplY3Qub2xkX3ZhbHVlO1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9ICcnO1xuICAgICAgICAgICAgaWYgKGFuZ3VsYXIuaXNBcnJheShuZXdWYWx1ZSkgJiYgYW5ndWxhci5pc0FycmF5KG9sZFZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IChuZXdWYWx1ZS5sZW5ndGggPiBvbGRWYWx1ZS5sZW5ndGgpID9cbiAgICAgICAgICAgICAgICAgICAgJ2FkZGVkJyA6IChuZXdWYWx1ZS5sZW5ndGggPT09IG9sZFZhbHVlLmxlbmd0aCkgP1xuICAgICAgICAgICAgICAgICAgICAnZWRpdGVkJyA6ICdkZWxldGVkJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghVXRpbHNTZXJ2aWNlLmlzRW1wdHkob2xkVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghVXRpbHNTZXJ2aWNlLmlzRW1wdHkobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAnZWRpdGVkJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9ICdkZWxldGVkJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICghVXRpbHNTZXJ2aWNlLmlzRW1wdHkobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9ICdhZGRlZCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIG1ha2VIdW1hblJlYWRhYmxlID0gZnVuY3Rpb24gKGxvc3RDaGFuZ2VzKSB7XG4gICAgICAgICAgICB2YXIgb3V0ZXJIdG1sID0gYW5ndWxhci5lbGVtZW50KCc8dWw+PC91bD4nKTtcbiAgICAgICAgICAgIHZhciBzdGF0ZVdpc2VFZGl0c01hcHBpbmcgPSB7fTtcbiAgICAgICAgICAgIC8vIFRoZSB2YXJpYWJsZSBzdGF0ZVdpc2VFZGl0c01hcHBpbmcgc3RvcmVzIHRoZSBlZGl0cyBncm91cGVkIGJ5IHN0YXRlLlxuICAgICAgICAgICAgLy8gRm9yIGluc3RhbmNlLCB5b3UgbWFkZSB0aGUgZm9sbG93aW5nIGVkaXRzOlxuICAgICAgICAgICAgLy8gMS4gQ2hhbmdlZCBjb250ZW50IHRvICdXZWxjb21lIScgaW5zdGVhZCBvZiAnJyBpbiAnSW50cm9kdWN0aW9uJy5cbiAgICAgICAgICAgIC8vIDIuIEFkZGVkIGFuIGludGVyYWN0aW9uIGluIHRoaXMgc3RhdGUuXG4gICAgICAgICAgICAvLyAyLiBBZGRlZCBhIG5ldyBzdGF0ZSAnRW5kJy5cbiAgICAgICAgICAgIC8vIDMuIEVuZGVkIEV4cG9yYXRpb24gZnJvbSBzdGF0ZSAnRW5kJy5cbiAgICAgICAgICAgIC8vIHN0YXRlV2lzZUVkaXRzTWFwcGluZyB3aWxsIGxvb2sgc29tZXRoaW5nIGxpa2UgdGhpczpcbiAgICAgICAgICAgIC8vIC0gJ0ludHJvZHVjdGlvbic6IFtcbiAgICAgICAgICAgIC8vICAgLSAnRWRpdGVkIENvbnRlbnQ6IFdlbGNvbWUhJyw6XG4gICAgICAgICAgICAvLyAgIC0gJ0FkZGVkIEludGVyYWN0aW9uOiBDb250aW51ZScsXG4gICAgICAgICAgICAvLyAgIC0gJ0FkZGVkIGludGVyYWN0aW9uIGN1c3RvbWl6YXRpb25zJ11cbiAgICAgICAgICAgIC8vIC0gJ0VuZCc6IFsnRW5kZWQgZXhwbG9yYXRpb24nXVxuICAgICAgICAgICAgbG9zdENoYW5nZXMuZm9yRWFjaChmdW5jdGlvbiAobG9zdENoYW5nZSkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAobG9zdENoYW5nZS5jbWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBDTURfQUREX1NUQVRFOlxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0ZXJIdG1sLmFwcGVuZChhbmd1bGFyLmVsZW1lbnQoJzxsaT48L2xpPicpLmh0bWwoJ0FkZGVkIHN0YXRlOiAnICsgbG9zdENoYW5nZS5zdGF0ZV9uYW1lKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBDTURfUkVOQU1FX1NUQVRFOlxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0ZXJIdG1sLmFwcGVuZChhbmd1bGFyLmVsZW1lbnQoJzxsaT48L2xpPicpLmh0bWwoJ1JlbmFtZWQgc3RhdGU6ICcgKyBsb3N0Q2hhbmdlLm9sZF9zdGF0ZV9uYW1lICsgJyB0byAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3N0Q2hhbmdlLm5ld19zdGF0ZV9uYW1lKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBDTURfREVMRVRFX1NUQVRFOlxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0ZXJIdG1sLmFwcGVuZChhbmd1bGFyLmVsZW1lbnQoJzxsaT48L2xpPicpLmh0bWwoJ0RlbGV0ZWQgc3RhdGU6ICcgKyBsb3N0Q2hhbmdlLnN0YXRlX25hbWUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIENNRF9FRElUX1NUQVRFX1BST1BFUlRZOlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5ld1ZhbHVlID0gZ2V0U3RhdGVQcm9wZXJ0eVZhbHVlKGxvc3RDaGFuZ2UubmV3X3ZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvbGRWYWx1ZSA9IGdldFN0YXRlUHJvcGVydHlWYWx1ZShsb3N0Q2hhbmdlLm9sZF92YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3RhdGVOYW1lID0gbG9zdENoYW5nZS5zdGF0ZV9uYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzdGF0ZVdpc2VFZGl0c01hcHBpbmdbc3RhdGVOYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlV2lzZUVkaXRzTWFwcGluZ1tzdGF0ZU5hbWVdID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGxvc3RDaGFuZ2UucHJvcGVydHlfbmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NvbnRlbnQnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV3VmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE8oc2xsKTogQWxzbyBhZGQgZGlzcGxheSBvZiBhdWRpbyB0cmFuc2xhdGlvbnMgaGVyZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlV2lzZUVkaXRzTWFwcGluZ1tzdGF0ZU5hbWVdLnB1c2goYW5ndWxhci5lbGVtZW50KCc8ZGl2PjwvZGl2PicpLmh0bWwoJzxzdHJvbmc+RWRpdGVkIGNvbnRlbnQ6ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L3N0cm9uZz48ZGl2IGNsYXNzPVwiY29udGVudFwiPicgKyBuZXdWYWx1ZS5odG1sICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3N0YXRlLWVkaXQtZGVzYycpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICd3aWRnZXRfaWQnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbG9zdENoYW5nZVZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvbGRWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5ld1ZhbHVlICE9PSAnRW5kRXhwbG9yYXRpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9zdENoYW5nZVZhbHVlID0gKCc8c3Ryb25nPkFkZGVkIEludGVyYWN0aW9uOiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvc3Ryb25nPicgKyBuZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3N0Q2hhbmdlVmFsdWUgPSAnRW5kZWQgRXhwbG9yYXRpb24nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9zdENoYW5nZVZhbHVlID0gKCc8c3Ryb25nPkRlbGV0ZWQgSW50ZXJhY3Rpb246ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L3N0cm9uZz4nICsgb2xkVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlV2lzZUVkaXRzTWFwcGluZ1tzdGF0ZU5hbWVdLnB1c2goYW5ndWxhci5lbGVtZW50KCc8ZGl2PjwvZGl2PicpLmh0bWwobG9zdENoYW5nZVZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdzdGF0ZS1lZGl0LWRlc2MnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3dpZGdldF9jdXN0b21pemF0aW9uX2FyZ3MnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbG9zdENoYW5nZVZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChVdGlsc1NlcnZpY2UuaXNFbXB0eShvbGRWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvc3RDaGFuZ2VWYWx1ZSA9ICdBZGRlZCBJbnRlcmFjdGlvbiBDdXN0b21pemF0aW9ucyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoVXRpbHNTZXJ2aWNlLmlzRW1wdHkobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3N0Q2hhbmdlVmFsdWUgPSAnUmVtb3ZlZCBJbnRlcmFjdGlvbiBDdXN0b21pemF0aW9ucyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3N0Q2hhbmdlVmFsdWUgPSAnRWRpdGVkIEludGVyYWN0aW9uIEN1c3RvbWl6YXRpb25zJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZVdpc2VFZGl0c01hcHBpbmdbc3RhdGVOYW1lXS5wdXNoKGFuZ3VsYXIuZWxlbWVudCgnPGRpdj48L2Rpdj4nKS5odG1sKGxvc3RDaGFuZ2VWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnc3RhdGUtZWRpdC1kZXNjJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdhbnN3ZXJfZ3JvdXBzJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFuc3dlckdyb3VwQ2hhbmdlcyA9IGdldFJlbGF0aXZlQ2hhbmdlVG9Hcm91cHMobG9zdENoYW5nZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhbnN3ZXJHcm91cEh0bWwgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFuc3dlckdyb3VwQ2hhbmdlcyA9PT0gJ2FkZGVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5zd2VyR3JvdXBIdG1sICs9ICgnPHAgY2xhc3M9XCJzdWItZWRpdFwiPjxpPkRlc3RpbmF0aW9uOiA8L2k+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3VmFsdWUub3V0Y29tZS5kZXN0ICsgJzwvcD4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuc3dlckdyb3VwSHRtbCArPSAoJzxkaXYgY2xhc3M9XCJzdWItZWRpdFwiPjxpPkZlZWRiYWNrOiA8L2k+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJmZWVkYmFja1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlLm91dGNvbWUuZmVlZGJhY2suZ2V0SHRtbCgpICsgJzwvZGl2PjwvZGl2PicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJ1bGVzTGlzdCA9IG1ha2VSdWxlc0xpc3RIdW1hblJlYWRhYmxlKG5ld1ZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChydWxlc0xpc3QubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuc3dlckdyb3VwSHRtbCArPSAoJzxwIGNsYXNzPVwic3ViLWVkaXRcIj48aT5SdWxlczogPC9pPjwvcD4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcnVsZXNMaXN0SHRtbCA9IChhbmd1bGFyLmVsZW1lbnQoJzxvbD48L29sPicpLmFkZENsYXNzKCdydWxlcy1saXN0JykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHJ1bGUgaW4gcnVsZXNMaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bGVzTGlzdEh0bWwuaHRtbChydWxlc0xpc3RbcnVsZV1bMF0ub3V0ZXJIVE1MKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5zd2VyR3JvdXBIdG1sICs9IHJ1bGVzTGlzdEh0bWxbMF0ub3V0ZXJIVE1MO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGVXaXNlRWRpdHNNYXBwaW5nW3N0YXRlTmFtZV0ucHVzaChhbmd1bGFyLmVsZW1lbnQoJzxkaXY+PHN0cm9uZz5BZGRlZCBhbnN3ZXIgZ3JvdXA6ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L3N0cm9uZz48L2Rpdj4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoYW5zd2VyR3JvdXBIdG1sKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnc3RhdGUtZWRpdC1kZXNjIGFuc3dlci1ncm91cCcpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChhbnN3ZXJHcm91cENoYW5nZXMgPT09ICdlZGl0ZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV3VmFsdWUub3V0Y29tZS5kZXN0ICE9PSBvbGRWYWx1ZS5vdXRjb21lLmRlc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbnN3ZXJHcm91cEh0bWwgKz0gKCc8cCBjbGFzcz1cInN1Yi1lZGl0XCI+PGk+RGVzdGluYXRpb246IDwvaT4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3VmFsdWUub3V0Y29tZS5kZXN0ICsgJzwvcD4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYW5ndWxhci5lcXVhbHMobmV3VmFsdWUub3V0Y29tZS5mZWVkYmFjay5nZXRIdG1sKCksIG9sZFZhbHVlLm91dGNvbWUuZmVlZGJhY2suZ2V0SHRtbCgpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuc3dlckdyb3VwSHRtbCArPSAoJzxkaXYgY2xhc3M9XCJzdWItZWRpdFwiPjxpPkZlZWRiYWNrOiA8L2k+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZmVlZGJhY2tcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3VmFsdWUub3V0Y29tZS5mZWVkYmFjay5nZXRIdG1sKCkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+PC9kaXY+Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWFuZ3VsYXIuZXF1YWxzKG5ld1ZhbHVlLnJ1bGVzLCBvbGRWYWx1ZS5ydWxlcykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcnVsZXNMaXN0ID0gbWFrZVJ1bGVzTGlzdEh1bWFuUmVhZGFibGUobmV3VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChydWxlc0xpc3QubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbnN3ZXJHcm91cEh0bWwgKz0gKCc8cCBjbGFzcz1cInN1Yi1lZGl0XCI+PGk+UnVsZXM6IDwvaT48L3A+Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBydWxlc0xpc3RIdG1sID0gKGFuZ3VsYXIuZWxlbWVudCgnPG9sPjwvb2w+JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygncnVsZXMtbGlzdCcpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcnVsZSBpbiBydWxlc0xpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bGVzTGlzdEh0bWwuaHRtbChydWxlc0xpc3RbcnVsZV1bMF0ub3V0ZXJIVE1MKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbnN3ZXJHcm91cENoYW5nZXMgPSBydWxlc0xpc3RIdG1sWzBdLm91dGVySFRNTDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZVdpc2VFZGl0c01hcHBpbmdbc3RhdGVOYW1lXS5wdXNoKGFuZ3VsYXIuZWxlbWVudCgnPGRpdj48c3Ryb25nPkVkaXRlZCBhbnN3ZXIgZ3JvdXA6IDxzdHJvbmc+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFwcGVuZChhbnN3ZXJHcm91cEh0bWwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdzdGF0ZS1lZGl0LWRlc2MgYW5zd2VyLWdyb3VwJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGFuc3dlckdyb3VwQ2hhbmdlcyA9PT0gJ2RlbGV0ZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZVdpc2VFZGl0c01hcHBpbmdbc3RhdGVOYW1lXS5wdXNoKGFuZ3VsYXIuZWxlbWVudCgnPGRpdj5EZWxldGVkIGFuc3dlciBncm91cDwvZGl2PicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdzdGF0ZS1lZGl0LWRlc2MnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnZGVmYXVsdF9vdXRjb21lJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRlZmF1bHRPdXRjb21lQ2hhbmdlcyA9IGdldFJlbGF0aXZlQ2hhbmdlVG9Hcm91cHMobG9zdENoYW5nZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkZWZhdWx0T3V0Y29tZUh0bWwgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRlZmF1bHRPdXRjb21lQ2hhbmdlcyA9PT0gJ2FkZGVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdE91dGNvbWVIdG1sICs9ICgnPHAgY2xhc3M9XCJzdWItZWRpdFwiPjxpPkRlc3RpbmF0aW9uOiA8L2k+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3VmFsdWUuZGVzdCArICc8L3A+Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0T3V0Y29tZUh0bWwgKz0gKCc8ZGl2IGNsYXNzPVwic3ViLWVkaXRcIj48aT5GZWVkYmFjazogPC9pPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZmVlZGJhY2tcIj4nICsgbmV3VmFsdWUuZmVlZGJhY2suZ2V0SHRtbCgpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+PC9kaXY+Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZVdpc2VFZGl0c01hcHBpbmdbc3RhdGVOYW1lXS5wdXNoKGFuZ3VsYXIuZWxlbWVudCgnPGRpdj5BZGRlZCBkZWZhdWx0IG91dGNvbWU6IDwvZGl2PicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFwcGVuZChkZWZhdWx0T3V0Y29tZUh0bWwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdzdGF0ZS1lZGl0LWRlc2MgZGVmYXVsdC1vdXRjb21lJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGRlZmF1bHRPdXRjb21lQ2hhbmdlcyA9PT0gJ2VkaXRlZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXdWYWx1ZS5kZXN0ICE9PSBvbGRWYWx1ZS5kZXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdE91dGNvbWVIdG1sICs9ICgnPHAgY2xhc3M9XCJzdWItZWRpdFwiPjxpPkRlc3RpbmF0aW9uOiA8L2k+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlLmRlc3QgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC9wPicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFhbmd1bGFyLmVxdWFscyhuZXdWYWx1ZS5mZWVkYmFjay5nZXRIdG1sKCksIG9sZFZhbHVlLmZlZWRiYWNrLmdldEh0bWwoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0T3V0Y29tZUh0bWwgKz0gKCc8ZGl2IGNsYXNzPVwic3ViLWVkaXRcIj48aT5GZWVkYmFjazogPC9pPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImZlZWRiYWNrXCI+JyArIG5ld1ZhbHVlLmZlZWRiYWNrICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PjwvZGl2PicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGVXaXNlRWRpdHNNYXBwaW5nW3N0YXRlTmFtZV0ucHVzaChhbmd1bGFyLmVsZW1lbnQoJzxkaXY+RWRpdGVkIGRlZmF1bHQgb3V0Y29tZTogPC9kaXY+JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKGRlZmF1bHRPdXRjb21lSHRtbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3N0YXRlLWVkaXQtZGVzYyBkZWZhdWx0LW91dGNvbWUnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZGVmYXVsdE91dGNvbWVDaGFuZ2VzID09PSAnZGVsZXRlZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlV2lzZUVkaXRzTWFwcGluZ1tzdGF0ZU5hbWVdLnB1c2goYW5ndWxhci5lbGVtZW50KCc8ZGl2PkRlbGV0ZWQgZGVmYXVsdCBvdXRjb21lPC9kaXY+JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3N0YXRlLWVkaXQtZGVzYycpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZm9yICh2YXIgc3RhdGVOYW1lIGluIHN0YXRlV2lzZUVkaXRzTWFwcGluZykge1xuICAgICAgICAgICAgICAgIHZhciBzdGF0ZUNoYW5nZXNFbCA9IGFuZ3VsYXIuZWxlbWVudCgnPGxpPkVkaXRzIHRvIHN0YXRlOiAnICsgc3RhdGVOYW1lICsgJzwvbGk+Jyk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgc3RhdGVFZGl0IGluIHN0YXRlV2lzZUVkaXRzTWFwcGluZ1tzdGF0ZU5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlQ2hhbmdlc0VsLmFwcGVuZChzdGF0ZVdpc2VFZGl0c01hcHBpbmdbc3RhdGVOYW1lXVtzdGF0ZUVkaXRdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb3V0ZXJIdG1sLmFwcGVuZChzdGF0ZUNoYW5nZXNFbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3V0ZXJIdG1sO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWFrZUh1bWFuUmVhZGFibGU6IGZ1bmN0aW9uIChsb3N0Q2hhbmdlcykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtYWtlSHVtYW5SZWFkYWJsZShsb3N0Q2hhbmdlcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmVsZW1lbnQoJzxkaXY+RXJyb3I6IENvdWxkIG5vdCByZWNvdmVyIGxvc3QgY2hhbmdlcy48L2Rpdj4nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiAgQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBoYW5kbGluZyBhbGwgaW50ZXJhY3Rpb25zXG4gKiAgd2l0aCB0aGUgZXhwbG9yYXRpb24gZWRpdG9yIGJhY2tlbmQuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9leHBsb3JhdGlvbi9FZGl0YWJsZUV4cGxvcmF0aW9uQmFja2VuZEFwaVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9leHBsb3JhdGlvbi9SZWFkT25seUV4cGxvcmF0aW9uQmFja2VuZEFwaVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0xvY2FsU3RvcmFnZVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvVXJsU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ2V4cGxvcmF0aW9uRWRpdG9yUGFnZU1vZHVsZScpLmZhY3RvcnkoJ0V4cGxvcmF0aW9uRGF0YVNlcnZpY2UnLCBbXG4gICAgJyRodHRwJywgJyRsb2cnLCAnJHEnLCAnJHdpbmRvdycsICdBbGVydHNTZXJ2aWNlJyxcbiAgICAnRWRpdGFibGVFeHBsb3JhdGlvbkJhY2tlbmRBcGlTZXJ2aWNlJywgJ0xvY2FsU3RvcmFnZVNlcnZpY2UnLFxuICAgICdSZWFkT25seUV4cGxvcmF0aW9uQmFja2VuZEFwaVNlcnZpY2UnLCAnVXJsU2VydmljZScsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkbG9nLCAkcSwgJHdpbmRvdywgQWxlcnRzU2VydmljZSwgRWRpdGFibGVFeHBsb3JhdGlvbkJhY2tlbmRBcGlTZXJ2aWNlLCBMb2NhbFN0b3JhZ2VTZXJ2aWNlLCBSZWFkT25seUV4cGxvcmF0aW9uQmFja2VuZEFwaVNlcnZpY2UsIFVybFNlcnZpY2UpIHtcbiAgICAgICAgLy8gVGhlIHBhdGhuYW1lICh3aXRob3V0IHRoZSBoYXNoKSBzaG91bGQgYmU6IC4uLi9jcmVhdGUve2V4cGxvcmF0aW9uX2lkfVxuICAgICAgICB2YXIgZXhwbG9yYXRpb25JZCA9ICcnO1xuICAgICAgICB2YXIgZHJhZnRDaGFuZ2VMaXN0SWQgPSBudWxsO1xuICAgICAgICB2YXIgcGF0aG5hbWVBcnJheSA9IFVybFNlcnZpY2UuZ2V0UGF0aG5hbWUoKS5zcGxpdCgnLycpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGhuYW1lQXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChwYXRobmFtZUFycmF5W2ldID09PSAnY3JlYXRlJykge1xuICAgICAgICAgICAgICAgIGV4cGxvcmF0aW9uSWQgPSBwYXRobmFtZUFycmF5W2kgKyAxXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICRsb2cuZXJyb3IoJ1VuZXhwZWN0ZWQgY2FsbCB0byBFeHBsb3JhdGlvbkRhdGFTZXJ2aWNlIGZvciBwYXRobmFtZSAnLCBwYXRobmFtZUFycmF5W2ldKTtcbiAgICAgICAgICAgIC8vIE5vdGU6IGlmIHdlIGRvIG5vdCByZXR1cm4gYW55dGhpbmcsIEthcm1hIHVuaXQgdGVzdHMgZmFpbC5cbiAgICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzb2x2ZWRBbnN3ZXJzVXJsUHJlZml4ID0gKCcvY3JlYXRlaGFuZGxlci9yZXNvbHZlZF9hbnN3ZXJzLycgKyBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgdmFyIGV4cGxvcmF0aW9uRHJhZnRBdXRvc2F2ZVVybCA9ICcnO1xuICAgICAgICBpZiAoR0xPQkFMUy5jYW5fZWRpdCkge1xuICAgICAgICAgICAgZXhwbG9yYXRpb25EcmFmdEF1dG9zYXZlVXJsID0gKCcvY3JlYXRlaGFuZGxlci9hdXRvc2F2ZV9kcmFmdC8nICsgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoR0xPQkFMUy5jYW5fdHJhbnNsYXRlKSB7XG4gICAgICAgICAgICBleHBsb3JhdGlvbkRyYWZ0QXV0b3NhdmVVcmwgPSAoJy9jcmVhdGVoYW5kbGVyL2F1dG9zYXZlX3RyYW5zbGF0aW9uX2RyYWZ0LycgKyBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBQdXQgZXhwbG9yYXRpb24gdmFyaWFibGVzIGhlcmUuXG4gICAgICAgIHZhciBleHBsb3JhdGlvbkRhdGEgPSB7XG4gICAgICAgICAgICBleHBsb3JhdGlvbklkOiBleHBsb3JhdGlvbklkLFxuICAgICAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgICAgIC8vIE5vdGUgdGhhdCB0aGUgY2hhbmdlTGlzdCBpcyB0aGUgZnVsbCBjaGFuZ2VMaXN0IHNpbmNlIHRoZSBsYXN0XG4gICAgICAgICAgICAvLyBjb21taXR0ZWQgdmVyc2lvbiAoYXMgb3Bwb3NlZCB0byB0aGUgbW9zdCByZWNlbnQgYXV0b3NhdmUpLlxuICAgICAgICAgICAgYXV0b3NhdmVDaGFuZ2VMaXN0OiBmdW5jdGlvbiAoY2hhbmdlTGlzdCwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjayA9PT0gdm9pZCAwKSB7IHN1Y2Nlc3NDYWxsYmFjayA9IGZ1bmN0aW9uIChyZXNwb25zZSkgeyB9OyB9XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2sgPT09IHZvaWQgMCkgeyBlcnJvckNhbGxiYWNrID0gZnVuY3Rpb24gKCkgeyB9OyB9XG4gICAgICAgICAgICAgICAgLy8gRmlyc3Qgc2F2ZSBsb2NhbGx5IHRvIGJlIHJldHJpZXZlZCBsYXRlciBpZiBzYXZlIGlzIHVuc3VjY2Vzc2Z1bC5cbiAgICAgICAgICAgICAgICBMb2NhbFN0b3JhZ2VTZXJ2aWNlLnNhdmVFeHBsb3JhdGlvbkRyYWZ0KGV4cGxvcmF0aW9uSWQsIGNoYW5nZUxpc3QsIGRyYWZ0Q2hhbmdlTGlzdElkKTtcbiAgICAgICAgICAgICAgICAkaHR0cC5wdXQoZXhwbG9yYXRpb25EcmFmdEF1dG9zYXZlVXJsLCB7XG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZV9saXN0OiBjaGFuZ2VMaXN0LFxuICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiBleHBsb3JhdGlvbkRhdGEuZGF0YS52ZXJzaW9uXG4gICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgZHJhZnRDaGFuZ2VMaXN0SWQgPSByZXNwb25zZS5kYXRhLmRyYWZ0X2NoYW5nZV9saXN0X2lkO1xuICAgICAgICAgICAgICAgICAgICAvLyBXZSBjYW4gc2FmZWx5IHJlbW92ZSB0aGUgbG9jYWxseSBzYXZlZCBkcmFmdCBjb3B5IGlmIGl0IHdhcyBzYXZlZFxuICAgICAgICAgICAgICAgICAgICAvLyB0byB0aGUgYmFja2VuZC5cbiAgICAgICAgICAgICAgICAgICAgTG9jYWxTdG9yYWdlU2VydmljZS5yZW1vdmVFeHBsb3JhdGlvbkRyYWZ0KGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGlzY2FyZERyYWZ0OiBmdW5jdGlvbiAoc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgJGh0dHAucG9zdChleHBsb3JhdGlvbkRyYWZ0QXV0b3NhdmVVcmwsIHt9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgTG9jYWxTdG9yYWdlU2VydmljZS5yZW1vdmVFeHBsb3JhdGlvbkRyYWZ0KGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFJldHVybnMgYSBwcm9taXNlIHRoYXQgc3VwcGxpZXMgdGhlIGRhdGEgZm9yIHRoZSBjdXJyZW50IGV4cGxvcmF0aW9uLlxuICAgICAgICAgICAgZ2V0RGF0YTogZnVuY3Rpb24gKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoZXhwbG9yYXRpb25EYXRhLmRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgJGxvZy5pbmZvKCdGb3VuZCBleHBsb3JhdGlvbiBkYXRhIGluIGNhY2hlLicpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVzb2x2ZShleHBsb3JhdGlvbkRhdGEuZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBSZXRyaWV2ZSBkYXRhIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgICAgICAgICAgICAgLy8gV0FSTklORzogTm90ZSB0aGF0IHRoaXMgaXMgYSB2ZXJzaW9uIG9mIHRoZSBleHBsb3JhdGlvbiB3aXRoXG4gICAgICAgICAgICAgICAgICAgIC8vIGRyYWZ0IGNoYW5nZXMgYXBwbGllZC4gVGhpcyBtYWtlcyBhIGZvcmNlLXJlZnJlc2ggbmVjZXNzYXJ5IHdoZW5cbiAgICAgICAgICAgICAgICAgICAgLy8gY2hhbmdlcyBhcmUgZGlzY2FyZGVkLCBvdGhlcndpc2UgdGhlXG4gICAgICAgICAgICAgICAgICAgIC8vIGV4cGxvcmF0aW9uLXdpdGgtZHJhZnQtY2hhbmdlcyAod2hpY2ggaXMgY2FjaGVkIGhlcmUpIHdpbGwgYmVcbiAgICAgICAgICAgICAgICAgICAgLy8gcmV1c2VkLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKEVkaXRhYmxlRXhwbG9yYXRpb25CYWNrZW5kQXBpU2VydmljZS5mZXRjaEFwcGx5RHJhZnRFeHBsb3JhdGlvbihleHBsb3JhdGlvbklkKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJGxvZy5pbmZvKCdSZXRyaWV2ZWQgZXhwbG9yYXRpb24gZGF0YS4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRsb2cuaW5mbyhyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkcmFmdENoYW5nZUxpc3RJZCA9IHJlc3BvbnNlLmRyYWZ0X2NoYW5nZV9saXN0X2lkO1xuICAgICAgICAgICAgICAgICAgICAgICAgZXhwbG9yYXRpb25EYXRhLmRhdGEgPSByZXNwb25zZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkcmFmdCA9IExvY2FsU3RvcmFnZVNlcnZpY2UuZ2V0RXhwbG9yYXRpb25EcmFmdChleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkcmFmdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkcmFmdC5pc1ZhbGlkKGRyYWZ0Q2hhbmdlTGlzdElkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2hhbmdlTGlzdCA9IGRyYWZ0LmdldENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwbG9yYXRpb25EYXRhLmF1dG9zYXZlQ2hhbmdlTGlzdChjaGFuZ2VMaXN0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBIHJlbG9hZCBpcyBuZWVkZWQgc28gdGhhdCB0aGUgY2hhbmdlbGlzdCBqdXN0IHNhdmVkIGlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBsb2FkZWQgYXMgb3Bwb3NlZCB0byB0aGUgZXhwbG9yYXRpb24gcmV0dXJuZWQgYnkgdGhpc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVzcG9uc2UuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXhwbG9yYXRpb25JZCwgZHJhZnQuZ2V0Q2hhbmdlcygpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gUmV0dXJucyBhIHByb21pc2Ugc3VwcGx5aW5nIHRoZSBsYXN0IHNhdmVkIHZlcnNpb24gZm9yIHRoZSBjdXJyZW50XG4gICAgICAgICAgICAvLyBleHBsb3JhdGlvbi5cbiAgICAgICAgICAgIGdldExhc3RTYXZlZERhdGE6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gUmVhZE9ubHlFeHBsb3JhdGlvbkJhY2tlbmRBcGlTZXJ2aWNlLmxvYWRMYXRlc3RFeHBsb3JhdGlvbihleHBsb3JhdGlvbklkKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAkbG9nLmluZm8oJ1JldHJpZXZlZCBzYXZlZCBleHBsb3JhdGlvbiBkYXRhLicpO1xuICAgICAgICAgICAgICAgICAgICAkbG9nLmluZm8ocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZXhwbG9yYXRpb247XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzb2x2ZUFuc3dlcnM6IGZ1bmN0aW9uIChzdGF0ZU5hbWUsIHJlc29sdmVkQW5zd2Vyc0xpc3QpIHtcbiAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmNsZWFyV2FybmluZ3MoKTtcbiAgICAgICAgICAgICAgICAkaHR0cC5wdXQocmVzb2x2ZWRBbnN3ZXJzVXJsUHJlZml4ICsgJy8nICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0YXRlTmFtZSksIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRfYW5zd2VyczogcmVzb2x2ZWRBbnN3ZXJzTGlzdFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2F2ZXMgdGhlIGV4cGxvcmF0aW9uIHRvIHRoZSBiYWNrZW5kLCBhbmQsIG9uIGEgc3VjY2VzcyBjYWxsYmFjayxcbiAgICAgICAgICAgICAqIHVwZGF0ZXMgdGhlIGxvY2FsIGNvcHkgb2YgdGhlIGV4cGxvcmF0aW9uIGRhdGEuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gY2hhbmdlTGlzdCAtIFJlcHJlc2VudHMgdGhlIGNoYW5nZSBsaXN0IGZvclxuICAgICAgICAgICAgICogICB0aGlzIHNhdmUuIEVhY2ggZWxlbWVudCBvZiB0aGUgbGlzdCBpcyBhIGNvbW1hbmQgcmVwcmVzZW50aW5nIGFuXG4gICAgICAgICAgICAgKiAgIGVkaXRpbmcgYWN0aW9uIChzdWNoIGFzIGFkZCBzdGF0ZSwgZGVsZXRlIHN0YXRlLCBldGMuKS4gU2VlIHRoZVxuICAgICAgICAgICAgICogIF8nQ2hhbmdlJyBjbGFzcyBpbiBleHBfc2VydmljZXMucHkgZm9yIGZ1bGwgZG9jdW1lbnRhdGlvbi5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb21taXRNZXNzYWdlIC0gVGhlIHVzZXItZW50ZXJlZCBjb21taXQgbWVzc2FnZSBmb3JcbiAgICAgICAgICAgICAqICAgdGhpcyBzYXZlIG9wZXJhdGlvbi5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2F2ZTogZnVuY3Rpb24gKGNoYW5nZUxpc3QsIGNvbW1pdE1lc3NhZ2UsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIEVkaXRhYmxlRXhwbG9yYXRpb25CYWNrZW5kQXBpU2VydmljZS51cGRhdGVFeHBsb3JhdGlvbihleHBsb3JhdGlvbklkLCBleHBsb3JhdGlvbkRhdGEuZGF0YS52ZXJzaW9uLCBjb21taXRNZXNzYWdlLCBjaGFuZ2VMaXN0KS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmNsZWFyV2FybmluZ3MoKTtcbiAgICAgICAgICAgICAgICAgICAgZXhwbG9yYXRpb25EYXRhLmRhdGEgPSByZXNwb25zZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3BvbnNlLmlzX3ZlcnNpb25fb2ZfZHJhZnRfdmFsaWQsIHJlc3BvbnNlLmRyYWZ0X2NoYW5nZXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBleHBsb3JhdGlvbkRhdGE7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEEgZGF0YSBzZXJ2aWNlIHRoYXQgc3RvcmVzIHRoZSBuYW1lIG9mIHRoZSBleHBsb3JhdGlvbidzXG4gKiBpbml0aWFsIHN0YXRlLiBOT1RFOiBUaGlzIHNlcnZpY2UgZG9lcyBub3QgcGVyZm9ybSB2YWxpZGF0aW9uLiBVc2VycyBvZiB0aGlzXG4gKiBzZXJ2aWNlIHNob3VsZCBlbnN1cmUgdGhhdCBuZXcgaW5pdGlhbCBzdGF0ZSBuYW1lcyBwYXNzZWQgdG8gdGhlIHNlcnZpY2UgYXJlXG4gKiB2YWxpZC5cbiAqL1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2Utc2VydmljZXMvJyArXG4gICAgJ2V4cGxvcmF0aW9uLXByb3BlcnR5LnNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdleHBsb3JhdGlvbkVkaXRvclBhZ2VNb2R1bGUnKS5mYWN0b3J5KCdFeHBsb3JhdGlvbkluaXRTdGF0ZU5hbWVTZXJ2aWNlJywgW1xuICAgICdFeHBsb3JhdGlvblByb3BlcnR5U2VydmljZScsIGZ1bmN0aW9uIChFeHBsb3JhdGlvblByb3BlcnR5U2VydmljZSkge1xuICAgICAgICB2YXIgY2hpbGQgPSBPYmplY3QuY3JlYXRlKEV4cGxvcmF0aW9uUHJvcGVydHlTZXJ2aWNlKTtcbiAgICAgICAgY2hpbGQucHJvcGVydHlOYW1lID0gJ2luaXRfc3RhdGVfbmFtZSc7XG4gICAgICAgIHJldHVybiBjaGlsZDtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZXMgZm9yIHN0b3JpbmcgZXhwbG9yYXRpb24gcHJvcGVydGllcyBmb3JcbiAqIGRpc3BsYXlpbmcgYW5kIGVkaXRpbmcgdGhlbSBpbiBtdWx0aXBsZSBwbGFjZXMgaW4gdGhlIFVJLFxuICogd2l0aCBiYXNlIGNsYXNzIGFzIEV4cGxvcmF0aW9uUHJvcGVydHlTZXJ2aWNlLlxuICovXG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS1zZXJ2aWNlcy8nICtcbiAgICAnY2hhbmdlLWxpc3Quc2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ2V4cGxvcmF0aW9uRWRpdG9yUGFnZU1vZHVsZScpLmZhY3RvcnkoJ0V4cGxvcmF0aW9uUHJvcGVydHlTZXJ2aWNlJywgW1xuICAgICckbG9nJywgJyRyb290U2NvcGUnLCAnQWxlcnRzU2VydmljZScsICdDaGFuZ2VMaXN0U2VydmljZScsXG4gICAgZnVuY3Rpb24gKCRsb2csICRyb290U2NvcGUsIEFsZXJ0c1NlcnZpY2UsIENoYW5nZUxpc3RTZXJ2aWNlKSB7XG4gICAgICAgIC8vIFB1YmxpYyBiYXNlIEFQSSBmb3IgZGF0YSBzZXJ2aWNlcyBjb3JyZXNwb25kaW5nIHRvIGV4cGxvcmF0aW9uXG4gICAgICAgIC8vIHByb3BlcnRpZXMgKHRpdGxlLCBjYXRlZ29yeSwgZXRjLilcbiAgICAgICAgdmFyIEJBQ0tFTkRfQ09OVkVSU0lPTlMgPSB7XG4gICAgICAgICAgICBwYXJhbV9jaGFuZ2VzOiBmdW5jdGlvbiAocGFyYW1DaGFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmFtQ2hhbmdlcy5tYXAoZnVuY3Rpb24gKHBhcmFtQ2hhbmdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJhbUNoYW5nZS50b0JhY2tlbmREaWN0KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcGFyYW1fc3BlY3M6IGZ1bmN0aW9uIChwYXJhbVNwZWNzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmFtU3BlY3MudG9CYWNrZW5kRGljdCgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnByb3BlcnR5TmFtZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyAnRXhwbG9yYXRpb24gcHJvcGVydHkgbmFtZSBjYW5ub3QgYmUgbnVsbC4nO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkbG9nLmluZm8oJ0luaXRpYWxpemluZyBleHBsb3JhdGlvbiAnICsgdGhpcy5wcm9wZXJ0eU5hbWUgKyAnOicsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAvLyBUaGUgY3VycmVudCB2YWx1ZSBvZiB0aGUgcHJvcGVydHkgKHdoaWNoIG1heSBub3QgaGF2ZSBiZWVuIHNhdmVkIHRvXG4gICAgICAgICAgICAgICAgLy8gdGhlIGZyb250ZW5kIHlldCkuIEluIGdlbmVyYWwsIHRoaXMgd2lsbCBiZSBib3VuZCBkaXJlY3RseSB0byB0aGVcbiAgICAgICAgICAgICAgICAvLyBVSS5cbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXllZCA9IGFuZ3VsYXIuY29weSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgLy8gVGhlIHByZXZpb3VzIChzYXZlZC1pbi10aGUtZnJvbnRlbmQpIHZhbHVlIG9mIHRoZSBwcm9wZXJ0eS4gSGVyZSxcbiAgICAgICAgICAgICAgICAvLyAnc2F2ZWQnIG1lYW5zIHRoYXQgdGhpcyBpcyB0aGUgbGF0ZXN0IHZhbHVlIG9mIHRoZSBwcm9wZXJ0eSBhc1xuICAgICAgICAgICAgICAgIC8vIGRldGVybWluZWQgYnkgdGhlIGZyb250ZW5kIGNoYW5nZSBsaXN0LlxuICAgICAgICAgICAgICAgIHRoaXMuc2F2ZWRNZW1lbnRvID0gYW5ndWxhci5jb3B5KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2V4cGxvcmF0aW9uUHJvcGVydHlDaGFuZ2VkJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gUmV0dXJucyB3aGV0aGVyIHRoZSBjdXJyZW50IHZhbHVlIGhhcyBjaGFuZ2VkIGZyb20gdGhlIG1lbWVudG8uXG4gICAgICAgICAgICBoYXNDaGFuZ2VkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFhbmd1bGFyLmVxdWFscyh0aGlzLnNhdmVkTWVtZW50bywgdGhpcy5kaXNwbGF5ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFRoZSBiYWNrZW5kIG5hbWUgZm9yIHRoaXMgcHJvcGVydHkuIFRISVMgTVVTVCBCRSBTUEVDSUZJRUQgQllcbiAgICAgICAgICAgIC8vIFNVQkNMQVNTRVMuXG4gICAgICAgICAgICBwcm9wZXJ0eU5hbWU6IG51bGwsXG4gICAgICAgICAgICAvLyBUcmFuc2Zvcm1zIHRoZSBnaXZlbiB2YWx1ZSBpbnRvIGEgbm9ybWFsaXplZCBmb3JtLiBUSElTIENBTiBCRVxuICAgICAgICAgICAgLy8gT1ZFUlJJRERFTiBCWSBTVUJDTEFTU0VTLiBUaGUgZGVmYXVsdCBiZWhhdmlvciBpcyB0byBkbyBub3RoaW5nLlxuICAgICAgICAgICAgX25vcm1hbGl6ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFZhbGlkYXRlcyB0aGUgZ2l2ZW4gdmFsdWUgYW5kIHJldHVybnMgYSBib29sZWFuIHN0YXRpbmcgd2hldGhlciBpdFxuICAgICAgICAgICAgLy8gaXMgdmFsaWQgb3Igbm90LiBUSElTIENBTiBCRSBPVkVSUklEREVOIEJZIFNVQkNMQVNTRVMuIFRoZSBkZWZhdWx0XG4gICAgICAgICAgICAvLyBiZWhhdmlvciBpcyB0byBhbHdheXMgcmV0dXJuIHRydWUuXG4gICAgICAgICAgICBfaXNWYWxpZDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gTm9ybWFsaXplcyB0aGUgZGlzcGxheWVkIHZhbHVlLiBUaGVuLCBpZiB0aGUgbWVtZW50byBhbmQgdGhlXG4gICAgICAgICAgICAvLyBkaXNwbGF5ZWQgdmFsdWUgYXJlIHRoZSBzYW1lLCBkb2VzIG5vdGhpbmcuIE90aGVyd2lzZSwgY3JlYXRlcyBhIG5ld1xuICAgICAgICAgICAgLy8gZW50cnkgaW4gdGhlIGNoYW5nZSBsaXN0LCBhbmQgdXBkYXRlcyB0aGUgbWVtZW50byB0byB0aGUgZGlzcGxheWVkXG4gICAgICAgICAgICAvLyB2YWx1ZS5cbiAgICAgICAgICAgIHNhdmVEaXNwbGF5ZWRWYWx1ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnByb3BlcnR5TmFtZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyAnRXhwbG9yYXRpb24gcHJvcGVydHkgbmFtZSBjYW5ub3QgYmUgbnVsbC4nO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXllZCA9IHRoaXMuX25vcm1hbGl6ZSh0aGlzLmRpc3BsYXllZCk7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9pc1ZhbGlkKHRoaXMuZGlzcGxheWVkKSB8fCAhdGhpcy5oYXNDaGFuZ2VkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXN0b3JlRnJvbU1lbWVudG8oKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYW5ndWxhci5lcXVhbHModGhpcy5kaXNwbGF5ZWQsIHRoaXMuc2F2ZWRNZW1lbnRvKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuY2xlYXJXYXJuaW5ncygpO1xuICAgICAgICAgICAgICAgIHZhciBuZXdCYWNrZW5kVmFsdWUgPSBhbmd1bGFyLmNvcHkodGhpcy5kaXNwbGF5ZWQpO1xuICAgICAgICAgICAgICAgIHZhciBvbGRCYWNrZW5kVmFsdWUgPSBhbmd1bGFyLmNvcHkodGhpcy5zYXZlZE1lbWVudG8pO1xuICAgICAgICAgICAgICAgIGlmIChCQUNLRU5EX0NPTlZFUlNJT05TLmhhc093blByb3BlcnR5KHRoaXMucHJvcGVydHlOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBuZXdCYWNrZW5kVmFsdWUgPVxuICAgICAgICAgICAgICAgICAgICAgICAgQkFDS0VORF9DT05WRVJTSU9OU1t0aGlzLnByb3BlcnR5TmFtZV0odGhpcy5kaXNwbGF5ZWQpO1xuICAgICAgICAgICAgICAgICAgICBvbGRCYWNrZW5kVmFsdWUgPVxuICAgICAgICAgICAgICAgICAgICAgICAgQkFDS0VORF9DT05WRVJTSU9OU1t0aGlzLnByb3BlcnR5TmFtZV0odGhpcy5zYXZlZE1lbWVudG8pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBDaGFuZ2VMaXN0U2VydmljZS5lZGl0RXhwbG9yYXRpb25Qcm9wZXJ0eSh0aGlzLnByb3BlcnR5TmFtZSwgbmV3QmFja2VuZFZhbHVlLCBvbGRCYWNrZW5kVmFsdWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2F2ZWRNZW1lbnRvID0gYW5ndWxhci5jb3B5KHRoaXMuZGlzcGxheWVkKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2V4cGxvcmF0aW9uUHJvcGVydHlDaGFuZ2VkJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gUmV2ZXJ0cyB0aGUgZGlzcGxheWVkIHZhbHVlIHRvIHRoZSBzYXZlZCBtZW1lbnRvLlxuICAgICAgICAgICAgcmVzdG9yZUZyb21NZW1lbnRvOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5ZWQgPSBhbmd1bGFyLmNvcHkodGhpcy5zYXZlZE1lbWVudG8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEYXRhIHNlcnZpY2UgZm9yIGtlZXBpbmcgdHJhY2sgb2YgdGhlIGV4cGxvcmF0aW9uJ3Mgc3RhdGVzLlxuICogTm90ZSB0aGF0IHRoaXMgaXMgdW5saWtlIHRoZSBvdGhlciBleHBsb3JhdGlvbiBwcm9wZXJ0eSBzZXJ2aWNlcywgaW4gdGhhdCBpdFxuICoga2VlcHMgbm8gbWVtZW50b3MuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9leHBsb3JhdGlvbi9TdGF0ZXNPYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdmaWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvbm9ybWFsaXplLXdoaXRlc3BhY2UuZmlsdGVyLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS1zZXJ2aWNlcy9hbmd1bGFyLW5hbWUvYW5ndWxhci1uYW1lLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlLXNlcnZpY2VzL2NoYW5nZS1saXN0LnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlLXNlcnZpY2VzL2V4cGxvcmF0aW9uLWluaXQtc3RhdGUtbmFtZS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9leHBsb3JhdGlvbi1lZGl0b3ItdGFiL2V4cGxvcmF0aW9uLWVkaXRvci10YWItc2VydmljZXMvc29sdXRpb24tdmFsaWRpdHkvc29sdXRpb24tdmFsaWRpdHkuc2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb25fcGxheWVyL0Fuc3dlckNsYXNzaWZpY2F0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZXhwbG9yYXRpb24tZWRpdG9yLXRhYi8nICtcbiAgICAnZXhwbG9yYXRpb24tZWRpdG9yLXRhYi1zZXJ2aWNlcy9yZXNwb25zZXMuc2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQ29udGV4dFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1ZhbGlkYXRvcnNTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnZXhwbG9yYXRpb25FZGl0b3JQYWdlTW9kdWxlJykuZmFjdG9yeSgnRXhwbG9yYXRpb25TdGF0ZXNTZXJ2aWNlJywgW1xuICAgICckZmlsdGVyJywgJyRpbmplY3RvcicsICckbG9jYXRpb24nLCAnJGxvZycsICckcScsICckcm9vdFNjb3BlJyxcbiAgICAnJHVpYk1vZGFsJywgJ0FsZXJ0c1NlcnZpY2UnLCAnQW5ndWxhck5hbWVTZXJ2aWNlJyxcbiAgICAnQW5zd2VyQ2xhc3NpZmljYXRpb25TZXJ2aWNlJywgJ0NoYW5nZUxpc3RTZXJ2aWNlJywgJ0NvbnRleHRTZXJ2aWNlJyxcbiAgICAnRXhwbG9yYXRpb25Jbml0U3RhdGVOYW1lU2VydmljZScsICdTb2x1dGlvblZhbGlkaXR5U2VydmljZScsXG4gICAgJ1N0YXRlRWRpdG9yU2VydmljZScsICdTdGF0ZXNPYmplY3RGYWN0b3J5JywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICAnVmFsaWRhdG9yc1NlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkZmlsdGVyLCAkaW5qZWN0b3IsICRsb2NhdGlvbiwgJGxvZywgJHEsICRyb290U2NvcGUsICR1aWJNb2RhbCwgQWxlcnRzU2VydmljZSwgQW5ndWxhck5hbWVTZXJ2aWNlLCBBbnN3ZXJDbGFzc2lmaWNhdGlvblNlcnZpY2UsIENoYW5nZUxpc3RTZXJ2aWNlLCBDb250ZXh0U2VydmljZSwgRXhwbG9yYXRpb25Jbml0U3RhdGVOYW1lU2VydmljZSwgU29sdXRpb25WYWxpZGl0eVNlcnZpY2UsIFN0YXRlRWRpdG9yU2VydmljZSwgU3RhdGVzT2JqZWN0RmFjdG9yeSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIFZhbGlkYXRvcnNTZXJ2aWNlKSB7XG4gICAgICAgIHZhciBfc3RhdGVzID0gbnVsbDtcbiAgICAgICAgdmFyIHN0YXRlQWRkZWRDYWxsYmFja3MgPSBbXTtcbiAgICAgICAgdmFyIHN0YXRlRGVsZXRlZENhbGxiYWNrcyA9IFtdO1xuICAgICAgICB2YXIgc3RhdGVSZW5hbWVkQ2FsbGJhY2tzID0gW107XG4gICAgICAgIHZhciBzdGF0ZUFuc3dlckdyb3Vwc1NhdmVkQ2FsbGJhY2tzID0gW107XG4gICAgICAgIC8vIFByb3BlcnRpZXMgdGhhdCBoYXZlIGEgZGlmZmVyZW50IGJhY2tlbmQgcmVwcmVzZW50YXRpb24gZnJvbSB0aGVcbiAgICAgICAgLy8gZnJvbnRlbmQgYW5kIG11c3QgYmUgY29udmVydGVkLlxuICAgICAgICB2YXIgQkFDS0VORF9DT05WRVJTSU9OUyA9IHtcbiAgICAgICAgICAgIGFuc3dlcl9ncm91cHM6IGZ1bmN0aW9uIChhbnN3ZXJHcm91cHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYW5zd2VyR3JvdXBzLm1hcChmdW5jdGlvbiAoYW5zd2VyR3JvdXApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFuc3dlckdyb3VwLnRvQmFja2VuZERpY3QoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb250ZW50OiBmdW5jdGlvbiAoY29udGVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZW50LnRvQmFja2VuZERpY3QoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWNvcmRlZF92b2ljZW92ZXJzOiBmdW5jdGlvbiAocmVjb3JkZWRWb2ljZW92ZXJzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlY29yZGVkVm9pY2VvdmVycy50b0JhY2tlbmREaWN0KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVmYXVsdF9vdXRjb21lOiBmdW5jdGlvbiAoZGVmYXVsdE91dGNvbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGVmYXVsdE91dGNvbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRPdXRjb21lLnRvQmFja2VuZERpY3QoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoaW50czogZnVuY3Rpb24gKGhpbnRzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhpbnRzLm1hcChmdW5jdGlvbiAoaGludCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaGludC50b0JhY2tlbmREaWN0KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcGFyYW1fY2hhbmdlczogZnVuY3Rpb24gKHBhcmFtQ2hhbmdlcykge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJhbUNoYW5nZXMubWFwKGZ1bmN0aW9uIChwYXJhbUNoYW5nZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyYW1DaGFuZ2UudG9CYWNrZW5kRGljdCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBhcmFtX3NwZWNzOiBmdW5jdGlvbiAocGFyYW1TcGVjcykge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJhbVNwZWNzLnRvQmFja2VuZERpY3QoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzb2x1dGlvbjogZnVuY3Rpb24gKHNvbHV0aW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNvbHV0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzb2x1dGlvbi50b0JhY2tlbmREaWN0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgd3JpdHRlbl90cmFuc2xhdGlvbnM6IGZ1bmN0aW9uICh3cml0dGVuVHJhbnNsYXRpb25zKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdyaXR0ZW5UcmFuc2xhdGlvbnMudG9CYWNrZW5kRGljdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvLyBNYXBzIGJhY2tlbmQgbmFtZXMgdG8gdGhlIGNvcnJlc3BvbmRpbmcgZnJvbnRlbmQgZGljdCBhY2Nlc3NvciBsaXN0cy5cbiAgICAgICAgdmFyIFBST1BFUlRZX1JFRl9EQVRBID0ge1xuICAgICAgICAgICAgYW5zd2VyX2dyb3VwczogWydpbnRlcmFjdGlvbicsICdhbnN3ZXJHcm91cHMnXSxcbiAgICAgICAgICAgIGNvbmZpcm1lZF91bmNsYXNzaWZpZWRfYW5zd2VyczogW1xuICAgICAgICAgICAgICAgICdpbnRlcmFjdGlvbicsICdjb25maXJtZWRVbmNsYXNzaWZpZWRBbnN3ZXJzJ1xuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGNvbnRlbnQ6IFsnY29udGVudCddLFxuICAgICAgICAgICAgcmVjb3JkZWRfdm9pY2VvdmVyczogWydyZWNvcmRlZFZvaWNlb3ZlcnMnXSxcbiAgICAgICAgICAgIGRlZmF1bHRfb3V0Y29tZTogWydpbnRlcmFjdGlvbicsICdkZWZhdWx0T3V0Y29tZSddLFxuICAgICAgICAgICAgcGFyYW1fY2hhbmdlczogWydwYXJhbUNoYW5nZXMnXSxcbiAgICAgICAgICAgIHBhcmFtX3NwZWNzOiBbJ3BhcmFtU3BlY3MnXSxcbiAgICAgICAgICAgIGhpbnRzOiBbJ2ludGVyYWN0aW9uJywgJ2hpbnRzJ10sXG4gICAgICAgICAgICBzb2x1dGlvbjogWydpbnRlcmFjdGlvbicsICdzb2x1dGlvbiddLFxuICAgICAgICAgICAgd2lkZ2V0X2lkOiBbJ2ludGVyYWN0aW9uJywgJ2lkJ10sXG4gICAgICAgICAgICB3aWRnZXRfY3VzdG9taXphdGlvbl9hcmdzOiBbJ2ludGVyYWN0aW9uJywgJ2N1c3RvbWl6YXRpb25BcmdzJ10sXG4gICAgICAgICAgICB3cml0dGVuX3RyYW5zbGF0aW9uczogWyd3cml0dGVuVHJhbnNsYXRpb25zJ11cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIENPTlRFTlRfSURfRVhUUkFDVE9SUyA9IHtcbiAgICAgICAgICAgIGFuc3dlcl9ncm91cHM6IGZ1bmN0aW9uIChhbnN3ZXJHcm91cHMpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudElkcyA9IG5ldyBTZXQoKTtcbiAgICAgICAgICAgICAgICBhbnN3ZXJHcm91cHMuZm9yRWFjaChmdW5jdGlvbiAoYW5zd2VyR3JvdXApIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudElkcy5hZGQoYW5zd2VyR3JvdXAub3V0Y29tZS5mZWVkYmFjay5nZXRDb250ZW50SWQoKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnRJZHM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVmYXVsdF9vdXRjb21lOiBmdW5jdGlvbiAoZGVmYXVsdE91dGNvbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudElkcyA9IG5ldyBTZXQoKTtcbiAgICAgICAgICAgICAgICBpZiAoZGVmYXVsdE91dGNvbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudElkcy5hZGQoZGVmYXVsdE91dGNvbWUuZmVlZGJhY2suZ2V0Q29udGVudElkKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudElkcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoaW50czogZnVuY3Rpb24gKGhpbnRzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRJZHMgPSBuZXcgU2V0KCk7XG4gICAgICAgICAgICAgICAgaGludHMuZm9yRWFjaChmdW5jdGlvbiAoaGludCkge1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50SWRzLmFkZChoaW50LmhpbnRDb250ZW50LmdldENvbnRlbnRJZCgpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudElkcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzb2x1dGlvbjogZnVuY3Rpb24gKHNvbHV0aW9uKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRJZHMgPSBuZXcgU2V0KCk7XG4gICAgICAgICAgICAgICAgaWYgKHNvbHV0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRJZHMuYWRkKHNvbHV0aW9uLmV4cGxhbmF0aW9uLmdldENvbnRlbnRJZCgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnRJZHM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfZ2V0RWxlbWVudHNJbkZpcnN0U2V0QnV0Tm90SW5TZWNvbmQgPSBmdW5jdGlvbiAoc2V0QSwgc2V0Qikge1xuICAgICAgICAgICAgdmFyIGRpZmZMaXN0ID0gQXJyYXkuZnJvbShzZXRBKS5maWx0ZXIoZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gIXNldEIuaGFzKGVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gZGlmZkxpc3Q7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfc2V0U3RhdGUgPSBmdW5jdGlvbiAoc3RhdGVOYW1lLCBzdGF0ZURhdGEsIHJlZnJlc2hHcmFwaCkge1xuICAgICAgICAgICAgX3N0YXRlcy5zZXRTdGF0ZShzdGF0ZU5hbWUsIGFuZ3VsYXIuY29weShzdGF0ZURhdGEpKTtcbiAgICAgICAgICAgIGlmIChyZWZyZXNoR3JhcGgpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3JlZnJlc2hHcmFwaCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgZ2V0U3RhdGVQcm9wZXJ0eU1lbWVudG8gPSBmdW5jdGlvbiAoc3RhdGVOYW1lLCBiYWNrZW5kTmFtZSkge1xuICAgICAgICAgICAgdmFyIGFjY2Vzc29yTGlzdCA9IFBST1BFUlRZX1JFRl9EQVRBW2JhY2tlbmROYW1lXTtcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0eVJlZiA9IF9zdGF0ZXMuZ2V0U3RhdGUoc3RhdGVOYW1lKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYWNjZXNzb3JMaXN0LmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVJlZiA9IHByb3BlcnR5UmVmW2tleV07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHZhciBhZGRpdGlvbmFsSW5mbyA9ICgnXFxuVW5kZWZpbmVkIHN0YXRlcyBlcnJvciBkZWJ1ZyBsb2dzOicgK1xuICAgICAgICAgICAgICAgICAgICAnXFxuUmVxdWVzdGVkIHN0YXRlIG5hbWU6ICcgKyBzdGF0ZU5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnXFxuRXhwbG9yYXRpb24gSUQ6ICcgKyBDb250ZXh0U2VydmljZS5nZXRFeHBsb3JhdGlvbklkKCkgK1xuICAgICAgICAgICAgICAgICAgICAnXFxuQ2hhbmdlIGxpc3Q6ICcgKyBKU09OLnN0cmluZ2lmeShDaGFuZ2VMaXN0U2VydmljZS5nZXRDaGFuZ2VMaXN0KCkpICtcbiAgICAgICAgICAgICAgICAgICAgJ1xcbkFsbCBzdGF0ZXMgbmFtZXM6ICcgKyBfc3RhdGVzLmdldFN0YXRlTmFtZXMoKSk7XG4gICAgICAgICAgICAgICAgZS5tZXNzYWdlICs9IGFkZGl0aW9uYWxJbmZvO1xuICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYW5ndWxhci5jb3B5KHByb3BlcnR5UmVmKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHNhdmVTdGF0ZVByb3BlcnR5ID0gZnVuY3Rpb24gKHN0YXRlTmFtZSwgYmFja2VuZE5hbWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgb2xkVmFsdWUgPSBnZXRTdGF0ZVByb3BlcnR5TWVtZW50byhzdGF0ZU5hbWUsIGJhY2tlbmROYW1lKTtcbiAgICAgICAgICAgIHZhciBuZXdCYWNrZW5kVmFsdWUgPSBhbmd1bGFyLmNvcHkobmV3VmFsdWUpO1xuICAgICAgICAgICAgdmFyIG9sZEJhY2tlbmRWYWx1ZSA9IGFuZ3VsYXIuY29weShvbGRWYWx1ZSk7XG4gICAgICAgICAgICBpZiAoQkFDS0VORF9DT05WRVJTSU9OUy5oYXNPd25Qcm9wZXJ0eShiYWNrZW5kTmFtZSkpIHtcbiAgICAgICAgICAgICAgICBuZXdCYWNrZW5kVmFsdWUgPSBjb252ZXJ0VG9CYWNrZW5kUmVwcmVzZW50YXRpb24obmV3VmFsdWUsIGJhY2tlbmROYW1lKTtcbiAgICAgICAgICAgICAgICBvbGRCYWNrZW5kVmFsdWUgPSBjb252ZXJ0VG9CYWNrZW5kUmVwcmVzZW50YXRpb24ob2xkVmFsdWUsIGJhY2tlbmROYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghYW5ndWxhci5lcXVhbHMob2xkVmFsdWUsIG5ld1ZhbHVlKSkge1xuICAgICAgICAgICAgICAgIENoYW5nZUxpc3RTZXJ2aWNlLmVkaXRTdGF0ZVByb3BlcnR5KHN0YXRlTmFtZSwgYmFja2VuZE5hbWUsIG5ld0JhY2tlbmRWYWx1ZSwgb2xkQmFja2VuZFZhbHVlKTtcbiAgICAgICAgICAgICAgICB2YXIgbmV3U3RhdGVEYXRhID0gX3N0YXRlcy5nZXRTdGF0ZShzdGF0ZU5hbWUpO1xuICAgICAgICAgICAgICAgIHZhciBhY2Nlc3Nvckxpc3QgPSBQUk9QRVJUWV9SRUZfREFUQVtiYWNrZW5kTmFtZV07XG4gICAgICAgICAgICAgICAgaWYgKENPTlRFTlRfSURfRVhUUkFDVE9SUy5oYXNPd25Qcm9wZXJ0eShiYWNrZW5kTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9sZENvbnRlbnRJZHMgPSBDT05URU5UX0lEX0VYVFJBQ1RPUlNbYmFja2VuZE5hbWVdKG9sZFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0NvbnRlbnRJZHMgPSBDT05URU5UX0lEX0VYVFJBQ1RPUlNbYmFja2VuZE5hbWVdKG5ld1ZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRJZHNUb0RlbGV0ZSA9IF9nZXRFbGVtZW50c0luRmlyc3RTZXRCdXROb3RJblNlY29uZChvbGRDb250ZW50SWRzLCBuZXdDb250ZW50SWRzKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRJZHNUb0FkZCA9IF9nZXRFbGVtZW50c0luRmlyc3RTZXRCdXROb3RJblNlY29uZChuZXdDb250ZW50SWRzLCBvbGRDb250ZW50SWRzKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudElkc1RvRGVsZXRlLmZvckVhY2goZnVuY3Rpb24gKGNvbnRlbnRJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3U3RhdGVEYXRhLnJlY29yZGVkVm9pY2VvdmVycy5kZWxldGVDb250ZW50SWQoY29udGVudElkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1N0YXRlRGF0YS53cml0dGVuVHJhbnNsYXRpb25zLmRlbGV0ZUNvbnRlbnRJZChjb250ZW50SWQpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudElkc1RvQWRkLmZvckVhY2goZnVuY3Rpb24gKGNvbnRlbnRJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3U3RhdGVEYXRhLnJlY29yZGVkVm9pY2VvdmVycy5hZGRDb250ZW50SWQoY29udGVudElkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1N0YXRlRGF0YS53cml0dGVuVHJhbnNsYXRpb25zLmFkZENvbnRlbnRJZChjb250ZW50SWQpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHByb3BlcnR5UmVmID0gbmV3U3RhdGVEYXRhO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWNjZXNzb3JMaXN0Lmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVJlZiA9IHByb3BlcnR5UmVmW2FjY2Vzc29yTGlzdFtpXV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHByb3BlcnR5UmVmW2FjY2Vzc29yTGlzdFthY2Nlc3Nvckxpc3QubGVuZ3RoIC0gMV1dID0gYW5ndWxhci5jb3B5KG5ld1ZhbHVlKTtcbiAgICAgICAgICAgICAgICAvLyBXZSBkbyBub3QgcmVmcmVzaCB0aGUgc3RhdGUgZWRpdG9yIGltbWVkaWF0ZWx5IGFmdGVyIHRoZVxuICAgICAgICAgICAgICAgIC8vIGludGVyYWN0aW9uIGlkIGFsb25lIGlzIHNhdmVkLCBiZWNhdXNlIHRoZSBjdXN0b21pemF0aW9uIGFyZ3MgZGljdFxuICAgICAgICAgICAgICAgIC8vIHdpbGwgYmUgdGVtcG9yYXJpbHkgaW52YWxpZC4gQSBjaGFuZ2UgaW4gaW50ZXJhY3Rpb24gaWQgd2lsbCBhbHdheXNcbiAgICAgICAgICAgICAgICAvLyBlbnRhaWwgYSBjaGFuZ2UgaW4gdGhlIGN1c3RvbWl6YXRpb24gYXJncyBkaWN0IGFueXdheSwgc28gdGhlIGdyYXBoXG4gICAgICAgICAgICAgICAgLy8gd2lsbCBnZXQgcmVmcmVzaGVkIGFmdGVyIGJvdGggcHJvcGVydGllcyBoYXZlIGJlZW4gdXBkYXRlZC5cbiAgICAgICAgICAgICAgICB2YXIgcmVmcmVzaEdyYXBoID0gKGJhY2tlbmROYW1lICE9PSAnd2lkZ2V0X2lkJyk7XG4gICAgICAgICAgICAgICAgX3NldFN0YXRlKHN0YXRlTmFtZSwgbmV3U3RhdGVEYXRhLCByZWZyZXNoR3JhcGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgY29udmVydFRvQmFja2VuZFJlcHJlc2VudGF0aW9uID0gZnVuY3Rpb24gKGZyb250ZW5kVmFsdWUsIGJhY2tlbmROYW1lKSB7XG4gICAgICAgICAgICB2YXIgY29udmVyc2lvbkZ1bmN0aW9uID0gQkFDS0VORF9DT05WRVJTSU9OU1tiYWNrZW5kTmFtZV07XG4gICAgICAgICAgICByZXR1cm4gY29udmVyc2lvbkZ1bmN0aW9uKGZyb250ZW5kVmFsdWUpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPKHNsbCk6IEFkZCB1bml0IHRlc3RzIGZvciBhbGwgZ2V0L3NhdmUgbWV0aG9kcy5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uIChzdGF0ZXNCYWNrZW5kRGljdCkge1xuICAgICAgICAgICAgICAgIF9zdGF0ZXMgPSBTdGF0ZXNPYmplY3RGYWN0b3J5LmNyZWF0ZUZyb21CYWNrZW5kRGljdChzdGF0ZXNCYWNrZW5kRGljdCk7XG4gICAgICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSB0aGUgc29sdXRpb25WYWxpZGl0eVNlcnZpY2UuXG4gICAgICAgICAgICAgICAgU29sdXRpb25WYWxpZGl0eVNlcnZpY2UuaW5pdChfc3RhdGVzLmdldFN0YXRlTmFtZXMoKSk7XG4gICAgICAgICAgICAgICAgX3N0YXRlcy5nZXRTdGF0ZU5hbWVzKCkuZm9yRWFjaChmdW5jdGlvbiAoc3RhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzb2x1dGlvbiA9IF9zdGF0ZXMuZ2V0U3RhdGUoc3RhdGVOYW1lKS5pbnRlcmFjdGlvbi5zb2x1dGlvbjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNvbHV0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gKEFuc3dlckNsYXNzaWZpY2F0aW9uU2VydmljZS5nZXRNYXRjaGluZ0NsYXNzaWZpY2F0aW9uUmVzdWx0KHN0YXRlTmFtZSwgX3N0YXRlcy5nZXRTdGF0ZShzdGF0ZU5hbWUpLmludGVyYWN0aW9uLCBzb2x1dGlvbi5jb3JyZWN0QW5zd2VyLCAkaW5qZWN0b3IuZ2V0KEFuZ3VsYXJOYW1lU2VydmljZS5nZXROYW1lT2ZJbnRlcmFjdGlvblJ1bGVzU2VydmljZShfc3RhdGVzLmdldFN0YXRlKHN0YXRlTmFtZSkuaW50ZXJhY3Rpb24uaWQpKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNvbHV0aW9uSXNWYWxpZCA9IHN0YXRlTmFtZSAhPT0gcmVzdWx0Lm91dGNvbWUuZGVzdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIFNvbHV0aW9uVmFsaWRpdHlTZXJ2aWNlLnVwZGF0ZVZhbGlkaXR5KHN0YXRlTmFtZSwgc29sdXRpb25Jc1ZhbGlkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFN0YXRlczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmNvcHkoX3N0YXRlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0U3RhdGVOYW1lczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfc3RhdGVzLmdldFN0YXRlTmFtZXMoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoYXNTdGF0ZTogZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfc3RhdGVzLmhhc1N0YXRlKHN0YXRlTmFtZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0U3RhdGU6IGZ1bmN0aW9uIChzdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYW5ndWxhci5jb3B5KF9zdGF0ZXMuZ2V0U3RhdGUoc3RhdGVOYW1lKSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0U3RhdGU6IGZ1bmN0aW9uIChzdGF0ZU5hbWUsIHN0YXRlRGF0YSkge1xuICAgICAgICAgICAgICAgIF9zZXRTdGF0ZShzdGF0ZU5hbWUsIHN0YXRlRGF0YSwgdHJ1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNOZXdTdGF0ZU5hbWVWYWxpZDogZnVuY3Rpb24gKG5ld1N0YXRlTmFtZSwgc2hvd1dhcm5pbmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKF9zdGF0ZXMuaGFzU3RhdGUobmV3U3RhdGVOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2hvd1dhcm5pbmdzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ0Egc3RhdGUgd2l0aCB0aGlzIG5hbWUgYWxyZWFkeSBleGlzdHMuJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gKFZhbGlkYXRvcnNTZXJ2aWNlLmlzVmFsaWRTdGF0ZU5hbWUobmV3U3RhdGVOYW1lLCBzaG93V2FybmluZ3MpKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRTdGF0ZUNvbnRlbnRNZW1lbnRvOiBmdW5jdGlvbiAoc3RhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldFN0YXRlUHJvcGVydHlNZW1lbnRvKHN0YXRlTmFtZSwgJ2NvbnRlbnQnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzYXZlU3RhdGVDb250ZW50OiBmdW5jdGlvbiAoc3RhdGVOYW1lLCBuZXdDb250ZW50KSB7XG4gICAgICAgICAgICAgICAgc2F2ZVN0YXRlUHJvcGVydHkoc3RhdGVOYW1lLCAnY29udGVudCcsIG5ld0NvbnRlbnQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFN0YXRlUGFyYW1DaGFuZ2VzTWVtZW50bzogZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBnZXRTdGF0ZVByb3BlcnR5TWVtZW50byhzdGF0ZU5hbWUsICdwYXJhbV9jaGFuZ2VzJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2F2ZVN0YXRlUGFyYW1DaGFuZ2VzOiBmdW5jdGlvbiAoc3RhdGVOYW1lLCBuZXdQYXJhbUNoYW5nZXMpIHtcbiAgICAgICAgICAgICAgICBzYXZlU3RhdGVQcm9wZXJ0eShzdGF0ZU5hbWUsICdwYXJhbV9jaGFuZ2VzJywgbmV3UGFyYW1DaGFuZ2VzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRJbnRlcmFjdGlvbklkTWVtZW50bzogZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBnZXRTdGF0ZVByb3BlcnR5TWVtZW50byhzdGF0ZU5hbWUsICd3aWRnZXRfaWQnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzYXZlSW50ZXJhY3Rpb25JZDogZnVuY3Rpb24gKHN0YXRlTmFtZSwgbmV3SW50ZXJhY3Rpb25JZCkge1xuICAgICAgICAgICAgICAgIHNhdmVTdGF0ZVByb3BlcnR5KHN0YXRlTmFtZSwgJ3dpZGdldF9pZCcsIG5ld0ludGVyYWN0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEludGVyYWN0aW9uQ3VzdG9taXphdGlvbkFyZ3NNZW1lbnRvOiBmdW5jdGlvbiAoc3RhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldFN0YXRlUHJvcGVydHlNZW1lbnRvKHN0YXRlTmFtZSwgJ3dpZGdldF9jdXN0b21pemF0aW9uX2FyZ3MnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzYXZlSW50ZXJhY3Rpb25DdXN0b21pemF0aW9uQXJnczogZnVuY3Rpb24gKHN0YXRlTmFtZSwgbmV3Q3VzdG9taXphdGlvbkFyZ3MpIHtcbiAgICAgICAgICAgICAgICBzYXZlU3RhdGVQcm9wZXJ0eShzdGF0ZU5hbWUsICd3aWRnZXRfY3VzdG9taXphdGlvbl9hcmdzJywgbmV3Q3VzdG9taXphdGlvbkFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEludGVyYWN0aW9uQW5zd2VyR3JvdXBzTWVtZW50bzogZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBnZXRTdGF0ZVByb3BlcnR5TWVtZW50byhzdGF0ZU5hbWUsICdhbnN3ZXJfZ3JvdXBzJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2F2ZUludGVyYWN0aW9uQW5zd2VyR3JvdXBzOiBmdW5jdGlvbiAoc3RhdGVOYW1lLCBuZXdBbnN3ZXJHcm91cHMpIHtcbiAgICAgICAgICAgICAgICBzYXZlU3RhdGVQcm9wZXJ0eShzdGF0ZU5hbWUsICdhbnN3ZXJfZ3JvdXBzJywgbmV3QW5zd2VyR3JvdXBzKTtcbiAgICAgICAgICAgICAgICBzdGF0ZUFuc3dlckdyb3Vwc1NhdmVkQ2FsbGJhY2tzLmZvckVhY2goZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKHN0YXRlTmFtZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0Q29uZmlybWVkVW5jbGFzc2lmaWVkQW5zd2Vyc01lbWVudG86IGZ1bmN0aW9uIChzdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0U3RhdGVQcm9wZXJ0eU1lbWVudG8oc3RhdGVOYW1lLCAnY29uZmlybWVkX3VuY2xhc3NpZmllZF9hbnN3ZXJzJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2F2ZUNvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnM6IGZ1bmN0aW9uIChzdGF0ZU5hbWUsIG5ld0Fuc3dlcnMpIHtcbiAgICAgICAgICAgICAgICBzYXZlU3RhdGVQcm9wZXJ0eShzdGF0ZU5hbWUsICdjb25maXJtZWRfdW5jbGFzc2lmaWVkX2Fuc3dlcnMnLCBuZXdBbnN3ZXJzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRJbnRlcmFjdGlvbkRlZmF1bHRPdXRjb21lTWVtZW50bzogZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBnZXRTdGF0ZVByb3BlcnR5TWVtZW50byhzdGF0ZU5hbWUsICdkZWZhdWx0X291dGNvbWUnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzYXZlSW50ZXJhY3Rpb25EZWZhdWx0T3V0Y29tZTogZnVuY3Rpb24gKHN0YXRlTmFtZSwgbmV3RGVmYXVsdE91dGNvbWUpIHtcbiAgICAgICAgICAgICAgICBzYXZlU3RhdGVQcm9wZXJ0eShzdGF0ZU5hbWUsICdkZWZhdWx0X291dGNvbWUnLCBuZXdEZWZhdWx0T3V0Y29tZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0SGludHNNZW1lbnRvOiBmdW5jdGlvbiAoc3RhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldFN0YXRlUHJvcGVydHlNZW1lbnRvKHN0YXRlTmFtZSwgJ2hpbnRzJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2F2ZUhpbnRzOiBmdW5jdGlvbiAoc3RhdGVOYW1lLCBuZXdIaW50cykge1xuICAgICAgICAgICAgICAgIHNhdmVTdGF0ZVByb3BlcnR5KHN0YXRlTmFtZSwgJ2hpbnRzJywgbmV3SGludHMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFNvbHV0aW9uTWVtZW50bzogZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBnZXRTdGF0ZVByb3BlcnR5TWVtZW50byhzdGF0ZU5hbWUsICdzb2x1dGlvbicpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNhdmVTb2x1dGlvbjogZnVuY3Rpb24gKHN0YXRlTmFtZSwgbmV3U29sdXRpb24pIHtcbiAgICAgICAgICAgICAgICBzYXZlU3RhdGVQcm9wZXJ0eShzdGF0ZU5hbWUsICdzb2x1dGlvbicsIG5ld1NvbHV0aW9uKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRSZWNvcmRlZFZvaWNlb3ZlcnNNZW1lbnRvOiBmdW5jdGlvbiAoc3RhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldFN0YXRlUHJvcGVydHlNZW1lbnRvKHN0YXRlTmFtZSwgJ3JlY29yZGVkX3ZvaWNlb3ZlcnMnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzYXZlUmVjb3JkZWRWb2ljZW92ZXJzOiBmdW5jdGlvbiAoc3RhdGVOYW1lLCBuZXdSZWNvcmRlZFZvaWNlb3ZlcnMpIHtcbiAgICAgICAgICAgICAgICBzYXZlU3RhdGVQcm9wZXJ0eShzdGF0ZU5hbWUsICdyZWNvcmRlZF92b2ljZW92ZXJzJywgbmV3UmVjb3JkZWRWb2ljZW92ZXJzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRXcml0dGVuVHJhbnNsYXRpb25zTWVtZW50bzogZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBnZXRTdGF0ZVByb3BlcnR5TWVtZW50byhzdGF0ZU5hbWUsICd3cml0dGVuX3RyYW5zbGF0aW9ucycpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNhdmVXcml0dGVuVHJhbnNsYXRpb25zOiBmdW5jdGlvbiAoc3RhdGVOYW1lLCBuZXdXcml0dGVuVHJhbnNsYXRpb25zKSB7XG4gICAgICAgICAgICAgICAgc2F2ZVN0YXRlUHJvcGVydHkoc3RhdGVOYW1lLCAnd3JpdHRlbl90cmFuc2xhdGlvbnMnLCBuZXdXcml0dGVuVHJhbnNsYXRpb25zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc0luaXRpYWxpemVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9zdGF0ZXMgIT09IG51bGw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWRkU3RhdGU6IGZ1bmN0aW9uIChuZXdTdGF0ZU5hbWUsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIG5ld1N0YXRlTmFtZSA9ICRmaWx0ZXIoJ25vcm1hbGl6ZVdoaXRlc3BhY2UnKShuZXdTdGF0ZU5hbWUpO1xuICAgICAgICAgICAgICAgIGlmICghVmFsaWRhdG9yc1NlcnZpY2UuaXNWYWxpZFN0YXRlTmFtZShuZXdTdGF0ZU5hbWUsIHRydWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKF9zdGF0ZXMuaGFzU3RhdGUobmV3U3RhdGVOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ0Egc3RhdGUgd2l0aCB0aGlzIG5hbWUgYWxyZWFkeSBleGlzdHMuJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5jbGVhcldhcm5pbmdzKCk7XG4gICAgICAgICAgICAgICAgX3N0YXRlcy5hZGRTdGF0ZShuZXdTdGF0ZU5hbWUpO1xuICAgICAgICAgICAgICAgIENoYW5nZUxpc3RTZXJ2aWNlLmFkZFN0YXRlKG5ld1N0YXRlTmFtZSk7XG4gICAgICAgICAgICAgICAgc3RhdGVBZGRlZENhbGxiYWNrcy5mb3JFYWNoKGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhuZXdTdGF0ZU5hbWUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgncmVmcmVzaEdyYXBoJyk7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2sobmV3U3RhdGVOYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVsZXRlU3RhdGU6IGZ1bmN0aW9uIChkZWxldGVTdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmNsZWFyV2FybmluZ3MoKTtcbiAgICAgICAgICAgICAgICB2YXIgaW5pdFN0YXRlTmFtZSA9IEV4cGxvcmF0aW9uSW5pdFN0YXRlTmFtZVNlcnZpY2UuZGlzcGxheWVkO1xuICAgICAgICAgICAgICAgIGlmIChkZWxldGVTdGF0ZU5hbWUgPT09IGluaXRTdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIV9zdGF0ZXMuaGFzU3RhdGUoZGVsZXRlU3RhdGVOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ05vIHN0YXRlIHdpdGggbmFtZSAnICsgZGVsZXRlU3RhdGVOYW1lICsgJyBleGlzdHMuJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZXhwbG9yYXRpb24tZWRpdG9yLXRhYi8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdleHBsb3JhdGlvbi1lZGl0b3ItdGFiLXRlbXBsYXRlcy8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdjb25maXJtLWRlbGV0ZS1zdGF0ZS1tb2RhbC50ZW1wbGF0ZS5odG1sJyksXG4gICAgICAgICAgICAgICAgICAgIGJhY2tkcm9wOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGVTdGF0ZU5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVsZXRlU3RhdGVOYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyR1aWJNb2RhbEluc3RhbmNlJywgJ2RlbGV0ZVN0YXRlTmFtZScsXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkdWliTW9kYWxJbnN0YW5jZSwgZGVsZXRlU3RhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRlbGV0ZVN0YXRlV2FybmluZ1RleHQgPSAoJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBkZWxldGUgdGhlIGNhcmQgXCInICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlU3RhdGVOYW1lICsgJ1wiPycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5yZWFsbHlEZWxldGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmNsb3NlKGRlbGV0ZVN0YXRlTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5kaXNtaXNzKCdjYW5jZWwnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5jbGVhcldhcm5pbmdzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIH0pLnJlc3VsdC50aGVuKGZ1bmN0aW9uIChkZWxldGVTdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgX3N0YXRlcy5kZWxldGVTdGF0ZShkZWxldGVTdGF0ZU5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBDaGFuZ2VMaXN0U2VydmljZS5kZWxldGVTdGF0ZShkZWxldGVTdGF0ZU5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoU3RhdGVFZGl0b3JTZXJ2aWNlLmdldEFjdGl2ZVN0YXRlTmFtZSgpID09PSBkZWxldGVTdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFN0YXRlRWRpdG9yU2VydmljZS5zZXRBY3RpdmVTdGF0ZU5hbWUoRXhwbG9yYXRpb25Jbml0U3RhdGVOYW1lU2VydmljZS5zYXZlZE1lbWVudG8pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKCcvZ3VpLycgKyBTdGF0ZUVkaXRvclNlcnZpY2UuZ2V0QWN0aXZlU3RhdGVOYW1lKCkpO1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZURlbGV0ZWRDYWxsYmFja3MuZm9yRWFjaChmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGRlbGV0ZVN0YXRlTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3JlZnJlc2hHcmFwaCcpO1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGVuc3VyZXMgdGhhdCBpZiB0aGUgZGVsZXRpb24gY2hhbmdlcyBydWxlcyBpbiB0aGUgY3VycmVudFxuICAgICAgICAgICAgICAgICAgICAvLyBzdGF0ZSwgdGhleSBnZXQgdXBkYXRlZCBpbiB0aGUgdmlldy5cbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdyZWZyZXNoU3RhdGVFZGl0b3InKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZW5hbWVTdGF0ZTogZnVuY3Rpb24gKG9sZFN0YXRlTmFtZSwgbmV3U3RhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgbmV3U3RhdGVOYW1lID0gJGZpbHRlcignbm9ybWFsaXplV2hpdGVzcGFjZScpKG5ld1N0YXRlTmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKCFWYWxpZGF0b3JzU2VydmljZS5pc1ZhbGlkU3RhdGVOYW1lKG5ld1N0YXRlTmFtZSwgdHJ1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoX3N0YXRlcy5oYXNTdGF0ZShuZXdTdGF0ZU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZygnQSBzdGF0ZSB3aXRoIHRoaXMgbmFtZSBhbHJlYWR5IGV4aXN0cy4nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmNsZWFyV2FybmluZ3MoKTtcbiAgICAgICAgICAgICAgICBfc3RhdGVzLnJlbmFtZVN0YXRlKG9sZFN0YXRlTmFtZSwgbmV3U3RhdGVOYW1lKTtcbiAgICAgICAgICAgICAgICBTdGF0ZUVkaXRvclNlcnZpY2Uuc2V0QWN0aXZlU3RhdGVOYW1lKG5ld1N0YXRlTmFtZSk7XG4gICAgICAgICAgICAgICAgLy8gVGhlICdyZW5hbWUgc3RhdGUnIGNvbW1hbmQgbXVzdCBjb21lIGJlZm9yZSB0aGUgJ2NoYW5nZVxuICAgICAgICAgICAgICAgIC8vIGluaXRfc3RhdGVfbmFtZScgY29tbWFuZCBpbiB0aGUgY2hhbmdlIGxpc3QsIG90aGVyd2lzZSB0aGUgYmFja2VuZFxuICAgICAgICAgICAgICAgIC8vIHdpbGwgcmFpc2UgYW4gZXJyb3IgYmVjYXVzZSB0aGUgbmV3IGluaXRpYWwgc3RhdGUgbmFtZSBkb2VzIG5vdFxuICAgICAgICAgICAgICAgIC8vIGV4aXN0LlxuICAgICAgICAgICAgICAgIENoYW5nZUxpc3RTZXJ2aWNlLnJlbmFtZVN0YXRlKG5ld1N0YXRlTmFtZSwgb2xkU3RhdGVOYW1lKTtcbiAgICAgICAgICAgICAgICBTb2x1dGlvblZhbGlkaXR5U2VydmljZS5vblJlbmFtZVN0YXRlKG5ld1N0YXRlTmFtZSwgb2xkU3RhdGVOYW1lKTtcbiAgICAgICAgICAgICAgICAvLyBBbWVuZCBpbml0U3RhdGVOYW1lIGFwcHJvcHJpYXRlbHksIGlmIG5lY2Vzc2FyeS4gTm90ZSB0aGF0IHRoaXNcbiAgICAgICAgICAgICAgICAvLyBtdXN0IGNvbWUgYWZ0ZXIgdGhlIHN0YXRlIHJlbmFtaW5nLCBvdGhlcndpc2Ugc2F2aW5nIHdpbGwgbGVhZCB0b1xuICAgICAgICAgICAgICAgIC8vIGEgY29tcGxhaW50IHRoYXQgdGhlIG5ldyBuYW1lIGlzIG5vdCBhIHZhbGlkIHN0YXRlIG5hbWUuXG4gICAgICAgICAgICAgICAgaWYgKEV4cGxvcmF0aW9uSW5pdFN0YXRlTmFtZVNlcnZpY2UuZGlzcGxheWVkID09PSBvbGRTdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgRXhwbG9yYXRpb25Jbml0U3RhdGVOYW1lU2VydmljZS5kaXNwbGF5ZWQgPSBuZXdTdGF0ZU5hbWU7XG4gICAgICAgICAgICAgICAgICAgIEV4cGxvcmF0aW9uSW5pdFN0YXRlTmFtZVNlcnZpY2Uuc2F2ZURpc3BsYXllZFZhbHVlKG5ld1N0YXRlTmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN0YXRlUmVuYW1lZENhbGxiYWNrcy5mb3JFYWNoKGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhvbGRTdGF0ZU5hbWUsIG5ld1N0YXRlTmFtZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdyZWZyZXNoR3JhcGgnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck9uU3RhdGVBZGRlZENhbGxiYWNrOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBzdGF0ZUFkZGVkQ2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyT25TdGF0ZURlbGV0ZWRDYWxsYmFjazogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgc3RhdGVEZWxldGVkQ2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyT25TdGF0ZVJlbmFtZWRDYWxsYmFjazogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgc3RhdGVSZW5hbWVkQ2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyT25TdGF0ZUFuc3dlckdyb3Vwc1NhdmVkQ2FsbGJhY2s6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHN0YXRlQW5zd2VyR3JvdXBzU2F2ZWRDYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdGhhdCBoYW5kbGVzIHJvdXRpbmcgZm9yIHRoZSBleHBsb3JhdGlvbiBlZGl0b3IgcGFnZS5cbiAqL1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2Utc2VydmljZXMvJyArXG4gICAgJ2V4cGxvcmF0aW9uLWluaXQtc3RhdGUtbmFtZS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS1zZXJ2aWNlcy8nICtcbiAgICAnZXhwbG9yYXRpb24tc3RhdGVzL2V4cGxvcmF0aW9uLXN0YXRlcy5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9leHBsb3JhdGlvbi1lZGl0b3ItdGFiLycgK1xuICAgICdleHBsb3JhdGlvbi1lZGl0b3ItdGFiLXNlcnZpY2VzL3Jlc3BvbnNlcy5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9FeHBsb3JhdGlvbkZlYXR1cmVzU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ2V4cGxvcmF0aW9uRWRpdG9yUGFnZU1vZHVsZScpLmZhY3RvcnkoJ1JvdXRlclNlcnZpY2UnLCBbXG4gICAgJyRpbnRlcnZhbCcsICckbG9jYXRpb24nLCAnJHJvb3RTY29wZScsICckdGltZW91dCcsICckd2luZG93JyxcbiAgICAnRXhwbG9yYXRpb25GZWF0dXJlc1NlcnZpY2UnLCAnRXhwbG9yYXRpb25Jbml0U3RhdGVOYW1lU2VydmljZScsXG4gICAgJ0V4cGxvcmF0aW9uU3RhdGVzU2VydmljZScsICdTdGF0ZUVkaXRvclNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkaW50ZXJ2YWwsICRsb2NhdGlvbiwgJHJvb3RTY29wZSwgJHRpbWVvdXQsICR3aW5kb3csIEV4cGxvcmF0aW9uRmVhdHVyZXNTZXJ2aWNlLCBFeHBsb3JhdGlvbkluaXRTdGF0ZU5hbWVTZXJ2aWNlLCBFeHBsb3JhdGlvblN0YXRlc1NlcnZpY2UsIFN0YXRlRWRpdG9yU2VydmljZSkge1xuICAgICAgICB2YXIgVEFCUyA9IHtcbiAgICAgICAgICAgIE1BSU46IHsgbmFtZTogJ21haW4nLCBwYXRoOiAnL21haW4nIH0sXG4gICAgICAgICAgICBUUkFOU0xBVElPTjogeyBuYW1lOiAndHJhbnNsYXRpb24nLCBwYXRoOiAnL3RyYW5zbGF0aW9uJyB9LFxuICAgICAgICAgICAgUFJFVklFVzogeyBuYW1lOiAncHJldmlldycsIHBhdGg6ICcvcHJldmlldycgfSxcbiAgICAgICAgICAgIFNFVFRJTkdTOiB7IG5hbWU6ICdzZXR0aW5ncycsIHBhdGg6ICcvc2V0dGluZ3MnIH0sXG4gICAgICAgICAgICBTVEFUUzogeyBuYW1lOiAnc3RhdHMnLCBwYXRoOiAnL3N0YXRzJyB9LFxuICAgICAgICAgICAgSU1QUk9WRU1FTlRTOiB7IG5hbWU6ICdpbXByb3ZlbWVudHMnLCBwYXRoOiAnL2ltcHJvdmVtZW50cycgfSxcbiAgICAgICAgICAgIEhJU1RPUlk6IHsgbmFtZTogJ2hpc3RvcnknLCBwYXRoOiAnL2hpc3RvcnknIH0sXG4gICAgICAgICAgICBGRUVEQkFDSzogeyBuYW1lOiAnZmVlZGJhY2snLCBwYXRoOiAnL2ZlZWRiYWNrJyB9LFxuICAgICAgICB9O1xuICAgICAgICB2YXIgU0xVR19HVUkgPSAnZ3VpJztcbiAgICAgICAgdmFyIFNMVUdfUFJFVklFVyA9ICdwcmV2aWV3JztcbiAgICAgICAgdmFyIGFjdGl2ZVRhYk5hbWUgPSBUQUJTLk1BSU4ubmFtZTtcbiAgICAgICAgdmFyIGlzSW1wcm92ZW1lbnRzVGFiRW5hYmxlZCA9IEV4cGxvcmF0aW9uRmVhdHVyZXNTZXJ2aWNlLmlzSW1wcm92ZW1lbnRzVGFiRW5hYmxlZDtcbiAgICAgICAgLy8gV2hlbiB0aGUgVVJMIHBhdGggY2hhbmdlcywgcmVyb3V0ZSB0byB0aGUgYXBwcm9wcmlhdGUgdGFiIGluIHRoZVxuICAgICAgICAvLyBleHBsb3JhdGlvbiBlZGl0b3IgcGFnZS5cbiAgICAgICAgJHJvb3RTY29wZS4kd2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRsb2NhdGlvbi5wYXRoKCk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChuZXdQYXRoLCBvbGRQYXRoKSB7XG4gICAgICAgICAgICBpZiAobmV3UGF0aCA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAkbG9jYXRpb24ucGF0aChvbGRQYXRoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIW9sZFBhdGgpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGNhbiBoYXBwZW4gd2hlbiBjbGlja2luZyBvbiBsaW5rcyB3aG9zZSBocmVmIGlzIFwiI1wiLlxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFRPRE8ob3BhcnJ5KTogRGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyBpcyBuZWNlc3NhcnksIHNpbmNlXG4gICAgICAgICAgICAvLyBfc2F2ZVBlbmRpbmdDaGFuZ2VzKCkgaXMgY2FsbGVkIGJ5IGVhY2ggb2YgdGhlIG5hdmlnYXRlVG8uLi4gZnVuY3Rpb25zXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2V4dGVybmFsU2F2ZScpO1xuICAgICAgICAgICAgaWYgKG5ld1BhdGguaW5kZXhPZihUQUJTLlRSQU5TTEFUSU9OLnBhdGgpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgYWN0aXZlVGFiTmFtZSA9IFRBQlMuVFJBTlNMQVRJT04ubmFtZTtcbiAgICAgICAgICAgICAgICB2YXIgd2FpdEZvclN0YXRlc1RvTG9hZCA9ICRpbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChFeHBsb3JhdGlvblN0YXRlc1NlcnZpY2UuaXNJbml0aWFsaXplZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkaW50ZXJ2YWwuY2FuY2VsKHdhaXRGb3JTdGF0ZXNUb0xvYWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFTdGF0ZUVkaXRvclNlcnZpY2UuZ2V0QWN0aXZlU3RhdGVOYW1lKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdGF0ZUVkaXRvclNlcnZpY2Uuc2V0QWN0aXZlU3RhdGVOYW1lKEV4cGxvcmF0aW9uSW5pdFN0YXRlTmFtZVNlcnZpY2Uuc2F2ZWRNZW1lbnRvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgncmVmcmVzaFRyYW5zbGF0aW9uVGFiJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LCAzMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobmV3UGF0aC5pbmRleE9mKFRBQlMuUFJFVklFVy5wYXRoKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGFjdGl2ZVRhYk5hbWUgPSBUQUJTLlBSRVZJRVcubmFtZTtcbiAgICAgICAgICAgICAgICBfZG9OYXZpZ2F0aW9uV2l0aFN0YXRlKG5ld1BhdGgsIFNMVUdfUFJFVklFVyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChuZXdQYXRoID09PSBUQUJTLlNFVFRJTkdTLnBhdGgpIHtcbiAgICAgICAgICAgICAgICBhY3RpdmVUYWJOYW1lID0gVEFCUy5TRVRUSU5HUy5uYW1lO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgncmVmcmVzaFNldHRpbmdzVGFiJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChuZXdQYXRoID09PSBUQUJTLlNUQVRTLnBhdGgpIHtcbiAgICAgICAgICAgICAgICBhY3RpdmVUYWJOYW1lID0gVEFCUy5TVEFUUy5uYW1lO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgncmVmcmVzaFN0YXRpc3RpY3NUYWInKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG5ld1BhdGggPT09IFRBQlMuSU1QUk9WRU1FTlRTLnBhdGggJiZcbiAgICAgICAgICAgICAgICBpc0ltcHJvdmVtZW50c1RhYkVuYWJsZWQoKSkge1xuICAgICAgICAgICAgICAgIGFjdGl2ZVRhYk5hbWUgPSBUQUJTLklNUFJPVkVNRU5UUy5uYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobmV3UGF0aCA9PT0gVEFCUy5ISVNUT1JZLnBhdGgpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPKHNsbCk6IERvIHRoaXMgb24taG92ZXIgcmF0aGVyIHRoYW4gb24tY2xpY2suXG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdyZWZyZXNoVmVyc2lvbkhpc3RvcnknLCB7XG4gICAgICAgICAgICAgICAgICAgIGZvcmNlUmVmcmVzaDogZmFsc2VcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBhY3RpdmVUYWJOYW1lID0gVEFCUy5ISVNUT1JZLm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChuZXdQYXRoID09PSBUQUJTLkZFRURCQUNLLnBhdGgpIHtcbiAgICAgICAgICAgICAgICBhY3RpdmVUYWJOYW1lID0gVEFCUy5GRUVEQkFDSy5uYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobmV3UGF0aC5pbmRleE9mKCcvZ3VpLycpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgYWN0aXZlVGFiTmFtZSA9IFRBQlMuTUFJTi5uYW1lO1xuICAgICAgICAgICAgICAgIF9kb05hdmlnYXRpb25XaXRoU3RhdGUobmV3UGF0aCwgU0xVR19HVUkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKEV4cGxvcmF0aW9uSW5pdFN0YXRlTmFtZVNlcnZpY2Uuc2F2ZWRNZW1lbnRvKSB7XG4gICAgICAgICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKCcvZ3VpLycgKyBFeHBsb3JhdGlvbkluaXRTdGF0ZU5hbWVTZXJ2aWNlLnNhdmVkTWVtZW50byk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdmFyIF9kb05hdmlnYXRpb25XaXRoU3RhdGUgPSBmdW5jdGlvbiAocGF0aCwgcGF0aFR5cGUpIHtcbiAgICAgICAgICAgIHZhciBwYXRoQmFzZSA9ICcvJyArIHBhdGhUeXBlICsgJy8nO1xuICAgICAgICAgICAgdmFyIHB1dGF0aXZlU3RhdGVOYW1lID0gcGF0aC5zdWJzdHJpbmcocGF0aEJhc2UubGVuZ3RoKTtcbiAgICAgICAgICAgIHZhciB3YWl0Rm9yU3RhdGVzVG9Mb2FkID0gJGludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoRXhwbG9yYXRpb25TdGF0ZXNTZXJ2aWNlLmlzSW5pdGlhbGl6ZWQoKSkge1xuICAgICAgICAgICAgICAgICAgICAkaW50ZXJ2YWwuY2FuY2VsKHdhaXRGb3JTdGF0ZXNUb0xvYWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoRXhwbG9yYXRpb25TdGF0ZXNTZXJ2aWNlLmhhc1N0YXRlKHB1dGF0aXZlU3RhdGVOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgU3RhdGVFZGl0b3JTZXJ2aWNlLnNldEFjdGl2ZVN0YXRlTmFtZShwdXRhdGl2ZVN0YXRlTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGF0aFR5cGUgPT09IFNMVUdfR1VJKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdyZWZyZXNoU3RhdGVFZGl0b3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE8oc2xsKTogRmlyZSBhbiBldmVudCB0byBjZW50ZXIgdGhlIGdyYXBoLCBpbiB0aGUgY2FzZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2hlcmUgYW5vdGhlciB0YWIgaXMgbG9hZGVkIGZpcnN0IGFuZCB0aGVuIHRoZSB1c2VyIHN3aXRjaGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0byB0aGUgZWRpdG9yIHRhYi4gV2UgdXNlZCB0byByZWRyYXcgdGhlIGdyYXBoIGNvbXBsZXRlbHkgYnV0XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIHRha2luZyBsb3RzIG9mIHRpbWUgYW5kIGlzIHByb2JhYmx5IG5vdCB3b3J0aCBpdC5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKHBhdGhCYXNlICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBFeHBsb3JhdGlvbkluaXRTdGF0ZU5hbWVTZXJ2aWNlLnNhdmVkTWVtZW50byk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAzMDApO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX3NhdmVQZW5kaW5nQ2hhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdleHRlcm5hbFNhdmUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gU29tZXRpbWVzLCBBbmd1bGFySlMgdGhyb3dzIGEgXCJDYW5ub3QgcmVhZCBwcm9wZXJ0eSAkJG5leHRTaWJsaW5nIG9mXG4gICAgICAgICAgICAgICAgLy8gbnVsbFwiIGVycm9yLiBUbyBnZXQgYXJvdW5kIHRoaXMgd2UgbXVzdCB1c2UgJGFwcGx5KCkuXG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYXBwbHkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2V4dGVybmFsU2F2ZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgX2dldEN1cnJlbnRTdGF0ZUZyb21Mb2NhdGlvblBhdGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoJGxvY2F0aW9uLnBhdGgoKS5pbmRleE9mKCcvZ3VpLycpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkbG9jYXRpb24ucGF0aCgpLnN1YnN0cmluZygnL2d1aS8nLmxlbmd0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9hY3R1YWxseU5hdmlnYXRlID0gZnVuY3Rpb24gKHBhdGhUeXBlLCBuZXdTdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgIGlmIChwYXRoVHlwZSAhPT0gU0xVR19HVUkgJiYgcGF0aFR5cGUgIT09IFNMVUdfUFJFVklFVykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuZXdTdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICBTdGF0ZUVkaXRvclNlcnZpY2Uuc2V0QWN0aXZlU3RhdGVOYW1lKG5ld1N0YXRlTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkbG9jYXRpb24ucGF0aCgnLycgKyBwYXRoVHlwZSArICcvJyArXG4gICAgICAgICAgICAgICAgU3RhdGVFZGl0b3JTZXJ2aWNlLmdldEFjdGl2ZVN0YXRlTmFtZSgpKTtcbiAgICAgICAgICAgICR3aW5kb3cuc2Nyb2xsVG8oMCwgMCk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBSb3V0ZXJTZXJ2aWNlID0ge1xuICAgICAgICAgICAgc2F2ZVBlbmRpbmdDaGFuZ2VzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3NhdmVQZW5kaW5nQ2hhbmdlcygpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEFjdGl2ZVRhYk5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYWN0aXZlVGFiTmFtZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc0xvY2F0aW9uU2V0VG9Ob25TdGF0ZUVkaXRvclRhYjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50UGF0aCA9ICRsb2NhdGlvbi5wYXRoKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChjdXJyZW50UGF0aCA9PT0gVEFCUy5UUkFOU0xBVElPTi5wYXRoIHx8XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQYXRoID09PSBUQUJTLlBSRVZJRVcucGF0aCB8fFxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50UGF0aCA9PT0gVEFCUy5TVEFUUy5wYXRoIHx8XG4gICAgICAgICAgICAgICAgICAgIChpc0ltcHJvdmVtZW50c1RhYkVuYWJsZWQoKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFBhdGggPT09IFRBQlMuSU1QUk9WRU1FTlRTLnBhdGgpIHx8XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQYXRoID09PSBUQUJTLlNFVFRJTkdTLnBhdGggfHxcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFBhdGggPT09IFRBQlMuSElTVE9SWS5wYXRoIHx8XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQYXRoID09PSBUQUJTLkZFRURCQUNLLnBhdGgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEN1cnJlbnRTdGF0ZUZyb21Mb2NhdGlvblBhdGg6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2dldEN1cnJlbnRTdGF0ZUZyb21Mb2NhdGlvblBhdGgoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuYXZpZ2F0ZVRvTWFpblRhYjogZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIF9zYXZlUGVuZGluZ0NoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICBpZiAoX2dldEN1cnJlbnRTdGF0ZUZyb21Mb2NhdGlvblBhdGgoKSA9PT0gc3RhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGFjdGl2ZVRhYk5hbWUgPT09IFRBQlMuTUFJTi5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICQoJy5vcHBpYS1lZGl0b3ItY2FyZHMtY29udGFpbmVyJykuZmFkZU91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfYWN0dWFsbHlOYXZpZ2F0ZShTTFVHX0dVSSwgc3RhdGVOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIG5lZWQgdG8gdXNlICRhcHBseSB0byB1cGRhdGUgYWxsIG91ciBiaW5kaW5ncy4gSG93ZXZlciB3ZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2FuJ3QgZGlyZWN0bHkgdXNlICRhcHBseSwgYXMgdGhlcmUgaXMgYWxyZWFkeSBhbm90aGVyICRhcHBseSBpblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcHJvZ3Jlc3MsIHRoZSBvbmUgd2hpY2ggYW5ndWxhciBpdHNlbGYgaGFzIGNhbGxlZCBhdCB0aGUgc3RhcnQuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTbyB3ZSB1c2UgJGFwcGx5QXN5bmMgdG8gZW5zdXJlIHRoYXQgdGhpcyAkYXBwbHkgaXMgY2FsbGVkIGp1c3RcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFmdGVyIHRoZSBwcmV2aW91cyAkYXBwbHkgaXMgZmluaXNoZWQgZXhlY3V0aW5nLiBSZWZlciB0byB0aGlzXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBsaW5rIGZvciBtb3JlIGluZm9ybWF0aW9uIC1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGh0dHA6Ly9ibG9nLnRoZW9keWJyb3RoZXJzLmNvbS8yMDE1LzA4L2dldHRpbmctaW5zaWRlLWFuZ3VsYXItc2NvcGVhcHBseWFzeW5jLmh0bWxcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGFwcGx5QXN5bmMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKCcub3BwaWEtZWRpdG9yLWNhcmRzLWNvbnRhaW5lcicpLmZhZGVJbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgMTUwKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBfYWN0dWFsbHlOYXZpZ2F0ZShTTFVHX0dVSSwgc3RhdGVOYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbmF2aWdhdGVUb1RyYW5zbGF0aW9uVGFiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3NhdmVQZW5kaW5nQ2hhbmdlcygpO1xuICAgICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKFRBQlMuVFJBTlNMQVRJT04ucGF0aCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbmF2aWdhdGVUb1ByZXZpZXdUYWI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aXZlVGFiTmFtZSAhPT0gVEFCUy5QUkVWSUVXLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgX3NhdmVQZW5kaW5nQ2hhbmdlcygpO1xuICAgICAgICAgICAgICAgICAgICBfYWN0dWFsbHlOYXZpZ2F0ZShTTFVHX1BSRVZJRVcsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuYXZpZ2F0ZVRvU3RhdHNUYWI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfc2F2ZVBlbmRpbmdDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgoVEFCUy5TVEFUUy5wYXRoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuYXZpZ2F0ZVRvSW1wcm92ZW1lbnRzVGFiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3NhdmVQZW5kaW5nQ2hhbmdlcygpO1xuICAgICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKFRBQlMuSU1QUk9WRU1FTlRTLnBhdGgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG5hdmlnYXRlVG9TZXR0aW5nc1RhYjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF9zYXZlUGVuZGluZ0NoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICAkbG9jYXRpb24ucGF0aChUQUJTLlNFVFRJTkdTLnBhdGgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG5hdmlnYXRlVG9IaXN0b3J5VGFiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3NhdmVQZW5kaW5nQ2hhbmdlcygpO1xuICAgICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKFRBQlMuSElTVE9SWS5wYXRoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuYXZpZ2F0ZVRvRmVlZGJhY2tUYWI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfc2F2ZVBlbmRpbmdDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgoVEFCUy5GRUVEQkFDSy5wYXRoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBSb3V0ZXJTZXJ2aWNlO1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuKiBAZmlsZW92ZXJ2aWV3IEEgc3RhdGUtc3BlY2lmaWMgY2FjaGUgZm9yIGludGVyYWN0aW9uIGhhbmRsZXJzLiBJdCBzdG9yZXNcbiogaGFuZGxlcnMgY29ycmVzcG9uZGluZyB0byBhbiBpbnRlcmFjdGlvbiBpZCBzbyB0aGF0IHRoZXkgY2FuIGJlIHJlc3RvcmVkIGlmXG4qIHRoZSBpbnRlcmFjdGlvbiBpcyBjaGFuZ2VkIGJhY2sgd2hpbGUgdGhlIHVzZXIgaXMgc3RpbGwgaW4gdGhpcyBzdGF0ZS5cbiogVGhpcyBjYWNoZSBzaG91bGQgYmUgcmVzZXQgZWFjaCB0aW1lIHRoZSBzdGF0ZSBlZGl0b3IgaXMgaW5pdGlhbGl6ZWQuXG4qL1xuYW5ndWxhci5tb2R1bGUoJ2V4cGxvcmF0aW9uRWRpdG9yVGFiTW9kdWxlJykuZmFjdG9yeSgnQW5zd2VyR3JvdXBzQ2FjaGVTZXJ2aWNlJywgW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF9jYWNoZSA9IHt9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfY2FjaGUgPSB7fTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb250YWluczogZnVuY3Rpb24gKGludGVyYWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2NhY2hlLmhhc093blByb3BlcnR5KGludGVyYWN0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24gKGludGVyYWN0aW9uSWQsIGFuc3dlckdyb3Vwcykge1xuICAgICAgICAgICAgICAgIF9jYWNoZVtpbnRlcmFjdGlvbklkXSA9IGFuZ3VsYXIuY29weShhbnN3ZXJHcm91cHMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKGludGVyYWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIV9jYWNoZS5oYXNPd25Qcm9wZXJ0eShpbnRlcmFjdGlvbklkKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFuZ3VsYXIuY29weShfY2FjaGVbaW50ZXJhY3Rpb25JZF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSByZXNwb25zZXMgY29ycmVzcG9uZGluZyB0byBhIHN0YXRlJ3MgaW50ZXJhY3Rpb24gYW5kXG4gKiBhbnN3ZXIgZ3JvdXBzLlxuICovXG5yZXF1aXJlKCdkb21haW4vZXhwbG9yYXRpb24vT3V0Y29tZU9iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLWVkaXRvci10YWIvJyArXG4gICAgJ2V4cGxvcmF0aW9uLWVkaXRvci10YWItc2VydmljZXMvYW5zd2VyLWdyb3Vwcy1jYWNoZS8nICtcbiAgICAnYW5zd2VyLWdyb3Vwcy1jYWNoZS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9leHBsb3JhdGlvbi1lZGl0b3ItdGFiLycgK1xuICAgICdleHBsb3JhdGlvbi1lZGl0b3ItdGFiLXNlcnZpY2VzL3NvbHV0aW9uLXZhbGlkaXR5LycgK1xuICAgICdzb2x1dGlvbi12YWxpZGl0eS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9leHBsb3JhdGlvbi1lZGl0b3ItdGFiLycgK1xuICAgICdleHBsb3JhdGlvbi1lZGl0b3ItdGFiLXNlcnZpY2VzL3NvbHV0aW9uLXZlcmlmaWNhdGlvbi8nICtcbiAgICAnc29sdXRpb24tdmVyaWZpY2F0aW9uLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLWVkaXRvci10YWIvJyArXG4gICAgJ2V4cGxvcmF0aW9uLWVkaXRvci10YWItc2VydmljZXMvcmVzcG9uc2VzLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL3N0YXRlLWVkaXRvci9zdGF0ZS1lZGl0b3ItcHJvcGVydGllcy1zZXJ2aWNlcy9zdGF0ZS1wcm9wZXJ0eS8nICtcbiAgICAnc3RhdGUtcHJvcGVydHkuc2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQ29udGV4dFNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdleHBsb3JhdGlvbkVkaXRvclRhYk1vZHVsZScpLmZhY3RvcnkoJ1Jlc3BvbnNlc1NlcnZpY2UnLCBbXG4gICAgJyRyb290U2NvcGUnLCAnQWxlcnRzU2VydmljZScsICdBbnN3ZXJHcm91cHNDYWNoZVNlcnZpY2UnLFxuICAgICdDb250ZXh0U2VydmljZScsICdPdXRjb21lT2JqZWN0RmFjdG9yeScsXG4gICAgJ1NvbHV0aW9uVmFsaWRpdHlTZXJ2aWNlJywgJ1NvbHV0aW9uVmVyaWZpY2F0aW9uU2VydmljZScsXG4gICAgJ1N0YXRlRWRpdG9yU2VydmljZScsICdTdGF0ZUludGVyYWN0aW9uSWRTZXJ2aWNlJyxcbiAgICAnU3RhdGVTb2x1dGlvblNlcnZpY2UnLCAnQ09NUE9ORU5UX05BTUVfREVGQVVMVF9PVVRDT01FJyxcbiAgICAnSU5GT19NRVNTQUdFX1NPTFVUSU9OX0lTX0lOVkFMSURfRk9SX0NVUlJFTlRfUlVMRScsXG4gICAgJ0lORk9fTUVTU0FHRV9TT0xVVElPTl9JU19JTlZBTElEX0ZPUl9FWFBMT1JBVElPTicsXG4gICAgJ0lORk9fTUVTU0FHRV9TT0xVVElPTl9JU19WQUxJRCcsICdJTlRFUkFDVElPTl9TUEVDUycsXG4gICAgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFsZXJ0c1NlcnZpY2UsIEFuc3dlckdyb3Vwc0NhY2hlU2VydmljZSwgQ29udGV4dFNlcnZpY2UsIE91dGNvbWVPYmplY3RGYWN0b3J5LCBTb2x1dGlvblZhbGlkaXR5U2VydmljZSwgU29sdXRpb25WZXJpZmljYXRpb25TZXJ2aWNlLCBTdGF0ZUVkaXRvclNlcnZpY2UsIFN0YXRlSW50ZXJhY3Rpb25JZFNlcnZpY2UsIFN0YXRlU29sdXRpb25TZXJ2aWNlLCBDT01QT05FTlRfTkFNRV9ERUZBVUxUX09VVENPTUUsIElORk9fTUVTU0FHRV9TT0xVVElPTl9JU19JTlZBTElEX0ZPUl9DVVJSRU5UX1JVTEUsIElORk9fTUVTU0FHRV9TT0xVVElPTl9JU19JTlZBTElEX0ZPUl9FWFBMT1JBVElPTiwgSU5GT19NRVNTQUdFX1NPTFVUSU9OX0lTX1ZBTElELCBJTlRFUkFDVElPTl9TUEVDUykge1xuICAgICAgICB2YXIgX2Fuc3dlckdyb3Vwc01lbWVudG8gPSBudWxsO1xuICAgICAgICB2YXIgX2RlZmF1bHRPdXRjb21lTWVtZW50byA9IG51bGw7XG4gICAgICAgIHZhciBfY29uZmlybWVkVW5jbGFzc2lmaWVkQW5zd2Vyc01lbWVudG8gPSBudWxsO1xuICAgICAgICAvLyBSZXByZXNlbnRzIHRoZSBjdXJyZW50IHNlbGVjdGVkIGFuc3dlciBncm91cCwgc3RhcnRpbmcgYXQgaW5kZXggMC4gSWYgdGhlXG4gICAgICAgIC8vIGluZGV4IGVxdWFsIHRvIHRoZSBudW1iZXIgb2YgYW5zd2VyIGdyb3VwcyAoYW5zd2VyR3JvdXBzLmxlbmd0aCksIHRoZW4gaXRcbiAgICAgICAgLy8gaXMgcmVmZXJyaW5nIHRvIHRoZSBkZWZhdWx0IG91dGNvbWUuXG4gICAgICAgIHZhciBfYWN0aXZlQW5zd2VyR3JvdXBJbmRleCA9IG51bGw7XG4gICAgICAgIHZhciBfYWN0aXZlUnVsZUluZGV4ID0gLTE7XG4gICAgICAgIHZhciBfYW5zd2VyR3JvdXBzID0gbnVsbDtcbiAgICAgICAgdmFyIF9kZWZhdWx0T3V0Y29tZSA9IG51bGw7XG4gICAgICAgIHZhciBfY29uZmlybWVkVW5jbGFzc2lmaWVkQW5zd2VycyA9IG51bGw7XG4gICAgICAgIHZhciBfYW5zd2VyQ2hvaWNlcyA9IG51bGw7XG4gICAgICAgIHZhciBfdmVyaWZ5U29sdXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBUaGlzIGNoZWNrcyBpZiB0aGUgc29sdXRpb24gaXMgdmFsaWQgb25jZSBhIHJ1bGUgaGFzIGJlZW4gY2hhbmdlZCBvclxuICAgICAgICAgICAgLy8gYWRkZWQuXG4gICAgICAgICAgICB2YXIgY3VycmVudEludGVyYWN0aW9uSWQgPSBTdGF0ZUludGVyYWN0aW9uSWRTZXJ2aWNlLnNhdmVkTWVtZW50bztcbiAgICAgICAgICAgIHZhciBpbnRlcmFjdGlvbkNhbkhhdmVTb2x1dGlvbiA9IChjdXJyZW50SW50ZXJhY3Rpb25JZCAmJlxuICAgICAgICAgICAgICAgIElOVEVSQUNUSU9OX1NQRUNTW2N1cnJlbnRJbnRlcmFjdGlvbklkXS5jYW5faGF2ZV9zb2x1dGlvbik7XG4gICAgICAgICAgICB2YXIgc29sdXRpb25FeGlzdHMgPSAoU3RhdGVTb2x1dGlvblNlcnZpY2Uuc2F2ZWRNZW1lbnRvICYmXG4gICAgICAgICAgICAgICAgU3RhdGVTb2x1dGlvblNlcnZpY2Uuc2F2ZWRNZW1lbnRvLmNvcnJlY3RBbnN3ZXIgIT09IG51bGwpO1xuICAgICAgICAgICAgaWYgKGludGVyYWN0aW9uQ2FuSGF2ZVNvbHV0aW9uICYmIHNvbHV0aW9uRXhpc3RzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGludGVyYWN0aW9uID0gU3RhdGVFZGl0b3JTZXJ2aWNlLmdldEludGVyYWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24uYW5zd2VyR3JvdXBzID0gYW5ndWxhci5jb3B5KF9hbnN3ZXJHcm91cHMpO1xuICAgICAgICAgICAgICAgIGludGVyYWN0aW9uLmRlZmF1bHRPdXRjb21lID0gYW5ndWxhci5jb3B5KF9kZWZhdWx0T3V0Y29tZSk7XG4gICAgICAgICAgICAgICAgdmFyIHNvbHV0aW9uSXNWYWxpZCA9IFNvbHV0aW9uVmVyaWZpY2F0aW9uU2VydmljZS52ZXJpZnlTb2x1dGlvbihTdGF0ZUVkaXRvclNlcnZpY2UuZ2V0QWN0aXZlU3RhdGVOYW1lKCksIGludGVyYWN0aW9uLCBTdGF0ZVNvbHV0aW9uU2VydmljZS5zYXZlZE1lbWVudG8uY29ycmVjdEFuc3dlcik7XG4gICAgICAgICAgICAgICAgU29sdXRpb25WYWxpZGl0eVNlcnZpY2UudXBkYXRlVmFsaWRpdHkoU3RhdGVFZGl0b3JTZXJ2aWNlLmdldEFjdGl2ZVN0YXRlTmFtZSgpLCBzb2x1dGlvbklzVmFsaWQpO1xuICAgICAgICAgICAgICAgIHZhciBzb2x1dGlvbldhc1ByZXZpb3VzbHlWYWxpZCA9IChTb2x1dGlvblZhbGlkaXR5U2VydmljZS5pc1NvbHV0aW9uVmFsaWQoU3RhdGVFZGl0b3JTZXJ2aWNlLmdldEFjdGl2ZVN0YXRlTmFtZSgpKSk7XG4gICAgICAgICAgICAgICAgaWYgKHNvbHV0aW9uSXNWYWxpZCAmJiAhc29sdXRpb25XYXNQcmV2aW91c2x5VmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRJbmZvTWVzc2FnZShJTkZPX01FU1NBR0VfU09MVVRJT05fSVNfVkFMSUQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICghc29sdXRpb25Jc1ZhbGlkICYmIHNvbHV0aW9uV2FzUHJldmlvdXNseVZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkSW5mb01lc3NhZ2UoSU5GT19NRVNTQUdFX1NPTFVUSU9OX0lTX0lOVkFMSURfRk9SX0NVUlJFTlRfUlVMRSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCFzb2x1dGlvbklzVmFsaWQgJiYgIXNvbHV0aW9uV2FzUHJldmlvdXNseVZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkSW5mb01lc3NhZ2UoSU5GT19NRVNTQUdFX1NPTFVUSU9OX0lTX0lOVkFMSURfRk9SX0VYUExPUkFUSU9OKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfc2F2ZUFuc3dlckdyb3VwcyA9IGZ1bmN0aW9uIChuZXdBbnN3ZXJHcm91cHMpIHtcbiAgICAgICAgICAgIHZhciBvbGRBbnN3ZXJHcm91cHMgPSBfYW5zd2VyR3JvdXBzTWVtZW50bztcbiAgICAgICAgICAgIGlmIChuZXdBbnN3ZXJHcm91cHMgJiYgb2xkQW5zd2VyR3JvdXBzICYmXG4gICAgICAgICAgICAgICAgIWFuZ3VsYXIuZXF1YWxzKG5ld0Fuc3dlckdyb3Vwcywgb2xkQW5zd2VyR3JvdXBzKSkge1xuICAgICAgICAgICAgICAgIF9hbnN3ZXJHcm91cHMgPSBuZXdBbnN3ZXJHcm91cHM7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdhbnN3ZXJHcm91cENoYW5nZWQnLCBuZXdBbnN3ZXJHcm91cHMpO1xuICAgICAgICAgICAgICAgIF92ZXJpZnlTb2x1dGlvbigpO1xuICAgICAgICAgICAgICAgIF9hbnN3ZXJHcm91cHNNZW1lbnRvID0gYW5ndWxhci5jb3B5KG5ld0Fuc3dlckdyb3Vwcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfdXBkYXRlQW5zd2VyR3JvdXAgPSBmdW5jdGlvbiAoaW5kZXgsIHVwZGF0ZXMsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgYW5zd2VyR3JvdXAgPSBfYW5zd2VyR3JvdXBzW2luZGV4XTtcbiAgICAgICAgICAgIGlmICh1cGRhdGVzLmhhc093blByb3BlcnR5KCdydWxlcycpKSB7XG4gICAgICAgICAgICAgICAgYW5zd2VyR3JvdXAucnVsZXMgPSB1cGRhdGVzLnJ1bGVzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHVwZGF0ZXMuaGFzT3duUHJvcGVydHkoJ3RhZ2dlZE1pc2NvbmNlcHRpb25JZCcpKSB7XG4gICAgICAgICAgICAgICAgYW5zd2VyR3JvdXAudGFnZ2VkTWlzY29uY2VwdGlvbklkID0gdXBkYXRlcy50YWdnZWRNaXNjb25jZXB0aW9uSWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodXBkYXRlcy5oYXNPd25Qcm9wZXJ0eSgnZmVlZGJhY2snKSkge1xuICAgICAgICAgICAgICAgIGFuc3dlckdyb3VwLm91dGNvbWUuZmVlZGJhY2sgPSB1cGRhdGVzLmZlZWRiYWNrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHVwZGF0ZXMuaGFzT3duUHJvcGVydHkoJ2Rlc3QnKSkge1xuICAgICAgICAgICAgICAgIGFuc3dlckdyb3VwLm91dGNvbWUuZGVzdCA9IHVwZGF0ZXMuZGVzdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh1cGRhdGVzLmhhc093blByb3BlcnR5KCdyZWZyZXNoZXJFeHBsb3JhdGlvbklkJykpIHtcbiAgICAgICAgICAgICAgICBhbnN3ZXJHcm91cC5vdXRjb21lLnJlZnJlc2hlckV4cGxvcmF0aW9uSWQgPSAodXBkYXRlcy5yZWZyZXNoZXJFeHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh1cGRhdGVzLmhhc093blByb3BlcnR5KCdtaXNzaW5nUHJlcmVxdWlzaXRlU2tpbGxJZCcpKSB7XG4gICAgICAgICAgICAgICAgYW5zd2VyR3JvdXAub3V0Y29tZS5taXNzaW5nUHJlcmVxdWlzaXRlU2tpbGxJZCA9ICh1cGRhdGVzLm1pc3NpbmdQcmVyZXF1aXNpdGVTa2lsbElkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh1cGRhdGVzLmhhc093blByb3BlcnR5KCdsYWJlbGxlZEFzQ29ycmVjdCcpKSB7XG4gICAgICAgICAgICAgICAgYW5zd2VyR3JvdXAub3V0Y29tZS5sYWJlbGxlZEFzQ29ycmVjdCA9IHVwZGF0ZXMubGFiZWxsZWRBc0NvcnJlY3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodXBkYXRlcy5oYXNPd25Qcm9wZXJ0eSgndHJhaW5pbmdEYXRhJykpIHtcbiAgICAgICAgICAgICAgICBhbnN3ZXJHcm91cC50cmFpbmluZ0RhdGEgPSB1cGRhdGVzLnRyYWluaW5nRGF0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9zYXZlQW5zd2VyR3JvdXBzKF9hbnN3ZXJHcm91cHMpO1xuICAgICAgICAgICAgY2FsbGJhY2soX2Fuc3dlckdyb3Vwc01lbWVudG8pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX3NhdmVEZWZhdWx0T3V0Y29tZSA9IGZ1bmN0aW9uIChuZXdEZWZhdWx0T3V0Y29tZSkge1xuICAgICAgICAgICAgdmFyIG9sZERlZmF1bHRPdXRjb21lID0gX2RlZmF1bHRPdXRjb21lTWVtZW50bztcbiAgICAgICAgICAgIGlmICghYW5ndWxhci5lcXVhbHMobmV3RGVmYXVsdE91dGNvbWUsIG9sZERlZmF1bHRPdXRjb21lKSkge1xuICAgICAgICAgICAgICAgIF9kZWZhdWx0T3V0Y29tZSA9IG5ld0RlZmF1bHRPdXRjb21lO1xuICAgICAgICAgICAgICAgIF92ZXJpZnlTb2x1dGlvbigpO1xuICAgICAgICAgICAgICAgIF9kZWZhdWx0T3V0Y29tZU1lbWVudG8gPSBhbmd1bGFyLmNvcHkobmV3RGVmYXVsdE91dGNvbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgX3NhdmVDb25maXJtZWRVbmNsYXNzaWZpZWRBbnN3ZXJzID0gZnVuY3Rpb24gKG5ld0NvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnMpIHtcbiAgICAgICAgICAgIHZhciBvbGRDb25maXJtZWRVbmNsYXNzaWZpZWRBbnN3ZXJzID0gKF9jb25maXJtZWRVbmNsYXNzaWZpZWRBbnN3ZXJzTWVtZW50byk7XG4gICAgICAgICAgICBpZiAoIWFuZ3VsYXIuZXF1YWxzKG5ld0NvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnMsIG9sZENvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnMpKSB7XG4gICAgICAgICAgICAgICAgX2NvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnMgPSBuZXdDb25maXJtZWRVbmNsYXNzaWZpZWRBbnN3ZXJzO1xuICAgICAgICAgICAgICAgIF9jb25maXJtZWRVbmNsYXNzaWZpZWRBbnN3ZXJzTWVtZW50byA9IGFuZ3VsYXIuY29weShuZXdDb25maXJtZWRVbmNsYXNzaWZpZWRBbnN3ZXJzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vIFRoZSAnZGF0YScgYXJnIGlzIGEgbGlzdCBvZiBpbnRlcmFjdGlvbiBoYW5kbGVycyBmb3IgdGhlXG4gICAgICAgICAgICAvLyBjdXJyZW50bHktYWN0aXZlIHN0YXRlLlxuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBBbnN3ZXJHcm91cHNDYWNoZVNlcnZpY2UucmVzZXQoKTtcbiAgICAgICAgICAgICAgICBfYW5zd2VyR3JvdXBzID0gYW5ndWxhci5jb3B5KGRhdGEuYW5zd2VyR3JvdXBzKTtcbiAgICAgICAgICAgICAgICBfZGVmYXVsdE91dGNvbWUgPSBhbmd1bGFyLmNvcHkoZGF0YS5kZWZhdWx0T3V0Y29tZSk7XG4gICAgICAgICAgICAgICAgX2NvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnMgPSBhbmd1bGFyLmNvcHkoZGF0YS5jb25maXJtZWRVbmNsYXNzaWZpZWRBbnN3ZXJzKTtcbiAgICAgICAgICAgICAgICBpZiAoU3RhdGVJbnRlcmFjdGlvbklkU2VydmljZS5zYXZlZE1lbWVudG8gIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgQW5zd2VyR3JvdXBzQ2FjaGVTZXJ2aWNlLnNldChTdGF0ZUludGVyYWN0aW9uSWRTZXJ2aWNlLnNhdmVkTWVtZW50bywgX2Fuc3dlckdyb3Vwcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF9hbnN3ZXJHcm91cHNNZW1lbnRvID0gYW5ndWxhci5jb3B5KF9hbnN3ZXJHcm91cHMpO1xuICAgICAgICAgICAgICAgIF9kZWZhdWx0T3V0Y29tZU1lbWVudG8gPSBhbmd1bGFyLmNvcHkoX2RlZmF1bHRPdXRjb21lKTtcbiAgICAgICAgICAgICAgICBfY29uZmlybWVkVW5jbGFzc2lmaWVkQW5zd2Vyc01lbWVudG8gPSBhbmd1bGFyLmNvcHkoX2NvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnMpO1xuICAgICAgICAgICAgICAgIF9hY3RpdmVBbnN3ZXJHcm91cEluZGV4ID0gLTE7XG4gICAgICAgICAgICAgICAgX2FjdGl2ZVJ1bGVJbmRleCA9IDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25JbnRlcmFjdGlvbklkQ2hhbmdlZDogZnVuY3Rpb24gKG5ld0ludGVyYWN0aW9uSWQsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKEFuc3dlckdyb3Vwc0NhY2hlU2VydmljZS5jb250YWlucyhuZXdJbnRlcmFjdGlvbklkKSkge1xuICAgICAgICAgICAgICAgICAgICBfYW5zd2VyR3JvdXBzID0gQW5zd2VyR3JvdXBzQ2FjaGVTZXJ2aWNlLmdldChuZXdJbnRlcmFjdGlvbklkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIF9hbnN3ZXJHcm91cHMgPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gUHJlc2VydmUgdGhlIGRlZmF1bHQgb3V0Y29tZSB1bmxlc3MgdGhlIGludGVyYWN0aW9uIGlzIHRlcm1pbmFsLlxuICAgICAgICAgICAgICAgIC8vIFJlY3JlYXRlIHRoZSBkZWZhdWx0IG91dGNvbWUgaWYgc3dpdGNoaW5nIGF3YXkgZnJvbSBhIHRlcm1pbmFsXG4gICAgICAgICAgICAgICAgLy8gaW50ZXJhY3Rpb24uXG4gICAgICAgICAgICAgICAgaWYgKG5ld0ludGVyYWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKElOVEVSQUNUSU9OX1NQRUNTW25ld0ludGVyYWN0aW9uSWRdLmlzX3Rlcm1pbmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfZGVmYXVsdE91dGNvbWUgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCFfZGVmYXVsdE91dGNvbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9kZWZhdWx0T3V0Y29tZSA9IE91dGNvbWVPYmplY3RGYWN0b3J5LmNyZWF0ZU5ldyhTdGF0ZUVkaXRvclNlcnZpY2UuZ2V0QWN0aXZlU3RhdGVOYW1lKCksIENPTVBPTkVOVF9OQU1FX0RFRkFVTFRfT1VUQ09NRSwgJycsIFtdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfY29uZmlybWVkVW5jbGFzc2lmaWVkQW5zd2VycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9zYXZlQW5zd2VyR3JvdXBzKF9hbnN3ZXJHcm91cHMpO1xuICAgICAgICAgICAgICAgIF9zYXZlRGVmYXVsdE91dGNvbWUoX2RlZmF1bHRPdXRjb21lKTtcbiAgICAgICAgICAgICAgICBfc2F2ZUNvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnMoX2NvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnMpO1xuICAgICAgICAgICAgICAgIGlmIChuZXdJbnRlcmFjdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgICAgIEFuc3dlckdyb3Vwc0NhY2hlU2VydmljZS5zZXQobmV3SW50ZXJhY3Rpb25JZCwgX2Fuc3dlckdyb3Vwcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF9hbnN3ZXJHcm91cHNNZW1lbnRvID0gYW5ndWxhci5jb3B5KF9hbnN3ZXJHcm91cHMpO1xuICAgICAgICAgICAgICAgIF9kZWZhdWx0T3V0Y29tZU1lbWVudG8gPSBhbmd1bGFyLmNvcHkoX2RlZmF1bHRPdXRjb21lKTtcbiAgICAgICAgICAgICAgICBfY29uZmlybWVkVW5jbGFzc2lmaWVkQW5zd2Vyc01lbWVudG8gPSBhbmd1bGFyLmNvcHkoX2NvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnMpO1xuICAgICAgICAgICAgICAgIF9hY3RpdmVBbnN3ZXJHcm91cEluZGV4ID0gLTE7XG4gICAgICAgICAgICAgICAgX2FjdGl2ZVJ1bGVJbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKF9hbnN3ZXJHcm91cHNNZW1lbnRvLCBfZGVmYXVsdE91dGNvbWVNZW1lbnRvKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0QWN0aXZlQW5zd2VyR3JvdXBJbmRleDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfYWN0aXZlQW5zd2VyR3JvdXBJbmRleDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjaGFuZ2VBY3RpdmVBbnN3ZXJHcm91cEluZGV4OiBmdW5jdGlvbiAobmV3SW5kZXgpIHtcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgY3VycmVudCBncm91cCBpcyBiZWluZyBjbGlja2VkIG9uIGFnYWluLCBjbG9zZSBpdC5cbiAgICAgICAgICAgICAgICBpZiAobmV3SW5kZXggPT09IF9hY3RpdmVBbnN3ZXJHcm91cEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIF9hY3RpdmVBbnN3ZXJHcm91cEluZGV4ID0gLTE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBfYWN0aXZlQW5zd2VyR3JvdXBJbmRleCA9IG5ld0luZGV4O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfYWN0aXZlUnVsZUluZGV4ID0gLTE7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0QWN0aXZlUnVsZUluZGV4OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9hY3RpdmVSdWxlSW5kZXg7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2hhbmdlQWN0aXZlUnVsZUluZGV4OiBmdW5jdGlvbiAobmV3SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBfYWN0aXZlUnVsZUluZGV4ID0gbmV3SW5kZXg7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0QW5zd2VyQ2hvaWNlczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmNvcHkoX2Fuc3dlckNob2ljZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVwZGF0ZUFuc3dlckdyb3VwOiBmdW5jdGlvbiAoaW5kZXgsIHVwZGF0ZXMsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgX3VwZGF0ZUFuc3dlckdyb3VwKGluZGV4LCB1cGRhdGVzLCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVsZXRlQW5zd2VyR3JvdXA6IGZ1bmN0aW9uIChpbmRleCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBfYW5zd2VyR3JvdXBzTWVtZW50byA9IGFuZ3VsYXIuY29weShfYW5zd2VyR3JvdXBzKTtcbiAgICAgICAgICAgICAgICBfYW5zd2VyR3JvdXBzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgX2FjdGl2ZUFuc3dlckdyb3VwSW5kZXggPSAtMTtcbiAgICAgICAgICAgICAgICBfc2F2ZUFuc3dlckdyb3VwcyhfYW5zd2VyR3JvdXBzKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhfYW5zd2VyR3JvdXBzTWVtZW50byk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXBkYXRlQWN0aXZlQW5zd2VyR3JvdXA6IGZ1bmN0aW9uICh1cGRhdGVzLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIF91cGRhdGVBbnN3ZXJHcm91cChfYWN0aXZlQW5zd2VyR3JvdXBJbmRleCwgdXBkYXRlcywgY2FsbGJhY2spO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVwZGF0ZURlZmF1bHRPdXRjb21lOiBmdW5jdGlvbiAodXBkYXRlcywgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICB2YXIgb3V0Y29tZSA9IF9kZWZhdWx0T3V0Y29tZTtcbiAgICAgICAgICAgICAgICBpZiAodXBkYXRlcy5oYXNPd25Qcm9wZXJ0eSgnZmVlZGJhY2snKSkge1xuICAgICAgICAgICAgICAgICAgICBvdXRjb21lLmZlZWRiYWNrID0gdXBkYXRlcy5mZWVkYmFjaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHVwZGF0ZXMuaGFzT3duUHJvcGVydHkoJ2Rlc3QnKSkge1xuICAgICAgICAgICAgICAgICAgICBvdXRjb21lLmRlc3QgPSB1cGRhdGVzLmRlc3Q7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh1cGRhdGVzLmhhc093blByb3BlcnR5KCdyZWZyZXNoZXJFeHBsb3JhdGlvbklkJykpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0Y29tZS5yZWZyZXNoZXJFeHBsb3JhdGlvbklkID0gdXBkYXRlcy5yZWZyZXNoZXJFeHBsb3JhdGlvbklkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodXBkYXRlcy5oYXNPd25Qcm9wZXJ0eSgnbWlzc2luZ1ByZXJlcXVpc2l0ZVNraWxsSWQnKSkge1xuICAgICAgICAgICAgICAgICAgICBvdXRjb21lLm1pc3NpbmdQcmVyZXF1aXNpdGVTa2lsbElkID1cbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZXMubWlzc2luZ1ByZXJlcXVpc2l0ZVNraWxsSWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh1cGRhdGVzLmhhc093blByb3BlcnR5KCdsYWJlbGxlZEFzQ29ycmVjdCcpKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dGNvbWUubGFiZWxsZWRBc0NvcnJlY3QgPSB1cGRhdGVzLmxhYmVsbGVkQXNDb3JyZWN0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfc2F2ZURlZmF1bHRPdXRjb21lKG91dGNvbWUpO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKF9kZWZhdWx0T3V0Y29tZU1lbWVudG8pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVwZGF0ZUNvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnM6IGZ1bmN0aW9uIChjb25maXJtZWRVbmNsYXNzaWZpZWRBbnN3ZXJzKSB7XG4gICAgICAgICAgICAgICAgX3NhdmVDb25maXJtZWRVbmNsYXNzaWZpZWRBbnN3ZXJzKGNvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFVwZGF0ZXMgYW5zd2VyIGNob2ljZXMgd2hlbiB0aGUgaW50ZXJhY3Rpb24gcmVxdWlyZXMgaXQgLS0gZm9yXG4gICAgICAgICAgICAvLyBleGFtcGxlLCB0aGUgcnVsZXMgZm9yIG11bHRpcGxlIGNob2ljZSBuZWVkIHRvIHJlZmVyIHRvIHRoZSBtdWx0aXBsZVxuICAgICAgICAgICAgLy8gY2hvaWNlIGludGVyYWN0aW9uJ3MgY3VzdG9taXphdGlvbiBhcmd1bWVudHMuXG4gICAgICAgICAgICB1cGRhdGVBbnN3ZXJDaG9pY2VzOiBmdW5jdGlvbiAobmV3QW5zd2VyQ2hvaWNlcywgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICB2YXIgb2xkQW5zd2VyQ2hvaWNlcyA9IGFuZ3VsYXIuY29weShfYW5zd2VyQ2hvaWNlcyk7XG4gICAgICAgICAgICAgICAgX2Fuc3dlckNob2ljZXMgPSBuZXdBbnN3ZXJDaG9pY2VzO1xuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBpbnRlcmFjdGlvbiBpcyBJdGVtU2VsZWN0aW9uSW5wdXQsIHVwZGF0ZSB0aGUgYW5zd2VyIGdyb3Vwc1xuICAgICAgICAgICAgICAgIC8vIHRvIHJlZmVyIHRvIHRoZSBuZXcgYW5zd2VyIG9wdGlvbnMuXG4gICAgICAgICAgICAgICAgaWYgKFN0YXRlSW50ZXJhY3Rpb25JZFNlcnZpY2Uuc2F2ZWRNZW1lbnRvID09PSAnSXRlbVNlbGVjdGlvbklucHV0JyAmJlxuICAgICAgICAgICAgICAgICAgICBvbGRBbnN3ZXJDaG9pY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIHVzZSBhbiBhcHByb3hpbWF0ZSBhbGdvcml0aG0gaGVyZS4gSWYgdGhlIGxlbmd0aCBvZiB0aGUgYW5zd2VyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNob2ljZXMgYXJyYXkgcmVtYWlucyB0aGUgc2FtZSwgYW5kIG5vIGNob2ljZSBpcyByZXBsaWNhdGVkIGF0XG4gICAgICAgICAgICAgICAgICAgIC8vIGRpZmZlcmVudCBpbmRpY2VzIGluIGJvdGggYXJyYXlzICh3aGljaCBpbmRpY2F0ZXMgdGhhdCBzb21lXG4gICAgICAgICAgICAgICAgICAgIC8vIG1vdmluZy1hcm91bmQgaGFwcGVuZWQpLCB0aGVuIHJlcGxhY2UgYW55IG9sZCBjaG9pY2Ugd2l0aCBpdHNcbiAgICAgICAgICAgICAgICAgICAgLy8gY29ycmVzcG9uZGluZyBuZXcgY2hvaWNlLiBPdGhlcndpc2UsIHdlIHNpbXBseSByZW1vdmUgYW55IGFuc3dlclxuICAgICAgICAgICAgICAgICAgICAvLyB0aGF0IGhhcyBub3QgYmVlbiBjaGFuZ2VkLiBUaGlzIGlzIG5vdCBmb29scHJvb2YsIGJ1dCBpdCBzaG91bGRcbiAgICAgICAgICAgICAgICAgICAgLy8gY292ZXIgbW9zdCBjYXNlcy5cbiAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyhzbGwpOiBGaW5kIGEgd2F5IHRvIG1ha2UgdGhpcyBmdWxseSBkZXRlcm1pbmlzdGljLiBUaGlzIGNhblxuICAgICAgICAgICAgICAgICAgICAvLyBwcm9iYWJseSBvbmx5IG9jY3VyIGFmdGVyIHdlIHN1cHBvcnQgY3VzdG9tIGVkaXRvcnMgZm9yXG4gICAgICAgICAgICAgICAgICAgIC8vIGludGVyYWN0aW9ucy5cbiAgICAgICAgICAgICAgICAgICAgdmFyIG9ubHlFZGl0c0hhcHBlbmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvbGRBbnN3ZXJDaG9pY2VzLmxlbmd0aCA9PT0gbmV3QW5zd2VyQ2hvaWNlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ubHlFZGl0c0hhcHBlbmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIHRoYXQgbm8gYW5zd2VyIGNob2ljZSBhcHBlYXJzIHRvIGhhdmUgYmVlbiBtb3ZlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBudW1BbnN3ZXJDaG9pY2VzID0gb2xkQW5zd2VyQ2hvaWNlcy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bUFuc3dlckNob2ljZXM7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbnVtQW5zd2VyQ2hvaWNlczsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpICE9PSBqICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRBbnN3ZXJDaG9pY2VzW2ldLnZhbCA9PT0gbmV3QW5zd2VyQ2hvaWNlc1tqXS52YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ubHlFZGl0c0hhcHBlbmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgb2xkQ2hvaWNlU3RyaW5ncyA9IG9sZEFuc3dlckNob2ljZXMubWFwKGZ1bmN0aW9uIChjaG9pY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjaG9pY2UudmFsO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0Nob2ljZVN0cmluZ3MgPSBuZXdBbnN3ZXJDaG9pY2VzLm1hcChmdW5jdGlvbiAoY2hvaWNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2hvaWNlLnZhbDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBrZXksIG5ld0lucHV0VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIF9hbnN3ZXJHcm91cHMuZm9yRWFjaChmdW5jdGlvbiAoYW5zd2VyR3JvdXAsIGFuc3dlckdyb3VwSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdSdWxlcyA9IGFuZ3VsYXIuY29weShhbnN3ZXJHcm91cC5ydWxlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdSdWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChydWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gcnVsZS5pbnB1dHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3SW5wdXRWYWx1ZSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBydWxlLmlucHV0c1trZXldLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdJbmRleCA9IG5ld0Nob2ljZVN0cmluZ3MuaW5kZXhPZihpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXdJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdJbnB1dFZhbHVlLnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChvbmx5RWRpdHNIYXBwZW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvbGRJbmRleCA9IG9sZENob2ljZVN0cmluZ3MuaW5kZXhPZihpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob2xkSW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0lucHV0VmFsdWUucHVzaChuZXdBbnN3ZXJDaG9pY2VzW29sZEluZGV4XS52YWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bGUuaW5wdXRzW2tleV0gPSBuZXdJbnB1dFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgX3VwZGF0ZUFuc3dlckdyb3VwKGFuc3dlckdyb3VwSW5kZXgsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBydWxlczogbmV3UnVsZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBpbnRlcmFjdGlvbiBpcyBEcmFnQW5kRHJvcFNvcnRJbnB1dCwgdXBkYXRlIHRoZSBhbnN3ZXIgZ3JvdXBzXG4gICAgICAgICAgICAgICAgLy8gdG8gcmVmZXIgdG8gdGhlIG5ldyBhbnN3ZXIgb3B0aW9ucy5cbiAgICAgICAgICAgICAgICBpZiAoU3RhdGVJbnRlcmFjdGlvbklkU2VydmljZS5zYXZlZE1lbWVudG8gPT09ICdEcmFnQW5kRHJvcFNvcnRJbnB1dCcgJiZcbiAgICAgICAgICAgICAgICAgICAgb2xkQW5zd2VyQ2hvaWNlcykge1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgbGVuZ3RoIG9mIHRoZSBhbnN3ZXIgY2hvaWNlcyBhcnJheSBjaGFuZ2VzLCB0aGVuIHRoZXJlIGlzXG4gICAgICAgICAgICAgICAgICAgIC8vIHN1cmVseSBhbnkgZGVsZXRpb24gb3IgbW9kaWZpY2F0aW9uIG9yIGFkZGl0aW9uIGluIHRoZSBhcnJheS4gV2VcbiAgICAgICAgICAgICAgICAgICAgLy8gc2ltcGx5IHNldCBhbnN3ZXIgZ3JvdXBzIHRvIHJlZmVyIHRvIGRlZmF1bHQgdmFsdWUuIElmIHRoZSBsZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgLy8gb2YgdGhlIGFuc3dlciBjaG9pY2VzIGFycmF5IHJlbWFpbnMgdGhlIHNhbWUgYW5kIGFsbCB0aGUgY2hvaWNlcyBpblxuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgcHJldmlvdXMgYXJyYXkgYXJlIHByZXNlbnQsIHRoZW4gbm8gY2hhbmdlIGlzIHJlcXVpcmVkLlxuICAgICAgICAgICAgICAgICAgICAvLyBIb3dldmVyLCBpZiBhbnkgb2YgdGhlIGNob2ljZXMgaXMgbm90IHByZXNlbnQsIHdlIHNldCBhbnN3ZXIgZ3JvdXBzXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvIHJlZmVyIHRvIHRoZSBkZWZhdWx0IHZhbHVlIGNvbnRhaW5pbmcgbmV3IGFuc3dlciBjaG9pY2VzLlxuICAgICAgICAgICAgICAgICAgICB2YXIgYW55Q2hhbmdlc0hhcHBlbmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvbGRBbnN3ZXJDaG9pY2VzLmxlbmd0aCAhPT0gbmV3QW5zd2VyQ2hvaWNlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFueUNoYW5nZXNIYXBwZW5lZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiBhbnkgbW9kaWZpY2F0aW9uIGhhcHBlbmVkIGluIGFuc3dlciBjaG9pY2VzLlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG51bUFuc3dlckNob2ljZXMgPSBvbGRBbnN3ZXJDaG9pY2VzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtQW5zd2VyQ2hvaWNlczsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNob2ljZUlzUHJlc2VudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbnVtQW5zd2VyQ2hvaWNlczsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvbGRBbnN3ZXJDaG9pY2VzW2ldLnZhbCA9PT0gbmV3QW5zd2VyQ2hvaWNlc1tqXS52YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNob2ljZUlzUHJlc2VudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hvaWNlSXNQcmVzZW50ID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbnlDaGFuZ2VzSGFwcGVuZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFueUNoYW5nZXNIYXBwZW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX2Fuc3dlckdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChhbnN3ZXJHcm91cCwgYW5zd2VyR3JvdXBJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdSdWxlcyA9IGFuZ3VsYXIuY29weShhbnN3ZXJHcm91cC5ydWxlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3UnVsZXMuZm9yRWFjaChmdW5jdGlvbiAocnVsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocnVsZS50eXBlID09PSAnSGFzRWxlbWVudFhBdFBvc2l0aW9uWScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIHJ1bGUuaW5wdXRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3SW5wdXRWYWx1ZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPT09ICd5Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdJbnB1dFZhbHVlID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnVsZS5pbnB1dHNba2V5XSA9IG5ld0lucHV0VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAocnVsZS50eXBlID09PSAnSGFzRWxlbWVudFhCZWZvcmVFbGVtZW50WScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIHJ1bGUuaW5wdXRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3SW5wdXRWYWx1ZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bGUuaW5wdXRzW2tleV0gPSBuZXdJbnB1dFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gcnVsZS5pbnB1dHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdJbnB1dFZhbHVlID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnVsZS5pbnB1dHNba2V5XSA9IG5ld0lucHV0VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdXBkYXRlQW5zd2VyR3JvdXAoYW5zd2VyR3JvdXBJbmRleCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBydWxlczogbmV3UnVsZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRBbnN3ZXJHcm91cHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYW5ndWxhci5jb3B5KF9hbnN3ZXJHcm91cHMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEFuc3dlckdyb3VwOiBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYW5ndWxhci5jb3B5KF9hbnN3ZXJHcm91cHNbaW5kZXhdKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRBbnN3ZXJHcm91cENvdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9hbnN3ZXJHcm91cHMubGVuZ3RoO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldERlZmF1bHRPdXRjb21lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFuZ3VsYXIuY29weShfZGVmYXVsdE91dGNvbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldENvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYW5ndWxhci5jb3B5KF9jb25maXJtZWRVbmNsYXNzaWZpZWRBbnN3ZXJzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBUaGlzIHJlZ2lzdGVycyB0aGUgY2hhbmdlIHRvIHRoZSBoYW5kbGVycyBpbiB0aGUgbGlzdCBvZiBjaGFuZ2VzLlxuICAgICAgICAgICAgc2F2ZTogZnVuY3Rpb24gKG5ld0Fuc3dlckdyb3VwcywgZGVmYXVsdE91dGNvbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgX3NhdmVBbnN3ZXJHcm91cHMobmV3QW5zd2VyR3JvdXBzKTtcbiAgICAgICAgICAgICAgICBfc2F2ZURlZmF1bHRPdXRjb21lKGRlZmF1bHRPdXRjb21lKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhfYW5zd2VyR3JvdXBzTWVtZW50bywgX2RlZmF1bHRPdXRjb21lTWVtZW50byk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLy8gU2VydmljZSBmb3Iga2VlcGluZyB0cmFjayBvZiBzb2x1dGlvbiB2YWxpZGl0eS5cbmFuZ3VsYXIubW9kdWxlKCdleHBsb3JhdGlvbkVkaXRvclRhYk1vZHVsZScpLmZhY3RvcnkoJ1NvbHV0aW9uVmFsaWRpdHlTZXJ2aWNlJywgW1xuICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uIChzdGF0ZU5hbWVzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zb2x1dGlvblZhbGlkaXRpZXMgPSB7fTtcbiAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgc3RhdGVOYW1lcy5mb3JFYWNoKGZ1bmN0aW9uIChzdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zb2x1dGlvblZhbGlkaXRpZXNbc3RhdGVOYW1lXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25SZW5hbWVTdGF0ZTogZnVuY3Rpb24gKG5ld1N0YXRlTmFtZSwgb2xkU3RhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zb2x1dGlvblZhbGlkaXRpZXNbbmV3U3RhdGVOYW1lXSA9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc29sdXRpb25WYWxpZGl0aWVzW29sZFN0YXRlTmFtZV07XG4gICAgICAgICAgICAgICAgdGhpcy5kZWxldGVTb2x1dGlvblZhbGlkaXR5KG9sZFN0YXRlTmFtZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXBkYXRlVmFsaWRpdHk6IGZ1bmN0aW9uIChzdGF0ZU5hbWUsIHNvbHV0aW9uSXNWYWxpZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc29sdXRpb25WYWxpZGl0aWVzW3N0YXRlTmFtZV0gPSBzb2x1dGlvbklzVmFsaWQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNTb2x1dGlvblZhbGlkOiBmdW5jdGlvbiAoc3RhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc29sdXRpb25WYWxpZGl0aWVzLmhhc093blByb3BlcnR5KHN0YXRlTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc29sdXRpb25WYWxpZGl0aWVzW3N0YXRlTmFtZV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRlbGV0ZVNvbHV0aW9uVmFsaWRpdHk6IGZ1bmN0aW9uIChzdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5zb2x1dGlvblZhbGlkaXRpZXNbc3RhdGVOYW1lXTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRBbGxWYWxpZGl0aWVzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc29sdXRpb25WYWxpZGl0aWVzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBzb2x1dGlvbiB2ZXJpZmljYXRpb24uXG4gKi9cbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlLXNlcnZpY2VzLycgK1xuICAgICdhbmd1bGFyLW5hbWUvYW5ndWxhci1uYW1lLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uX3BsYXllci9BbnN3ZXJDbGFzc2lmaWNhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLWVkaXRvci10YWIvJyArXG4gICAgJ2V4cGxvcmF0aW9uLWVkaXRvci10YWItc2VydmljZXMvcmVzcG9uc2VzLnNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdleHBsb3JhdGlvbkVkaXRvclRhYk1vZHVsZScpLmZhY3RvcnkoJ1NvbHV0aW9uVmVyaWZpY2F0aW9uU2VydmljZScsIFtcbiAgICAnJGluamVjdG9yJywgJ0FuZ3VsYXJOYW1lU2VydmljZScsICdBbnN3ZXJDbGFzc2lmaWNhdGlvblNlcnZpY2UnLFxuICAgICdTdGF0ZUVkaXRvclNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IsIEFuZ3VsYXJOYW1lU2VydmljZSwgQW5zd2VyQ2xhc3NpZmljYXRpb25TZXJ2aWNlLCBTdGF0ZUVkaXRvclNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHZlcmlmeVNvbHV0aW9uOiBmdW5jdGlvbiAoc3RhdGVOYW1lLCBpbnRlcmFjdGlvbiwgY29ycmVjdEFuc3dlcikge1xuICAgICAgICAgICAgICAgIHZhciBpbnRlcmFjdGlvbklkID0gaW50ZXJhY3Rpb24uaWQ7XG4gICAgICAgICAgICAgICAgdmFyIHJ1bGVzU2VydmljZU5hbWUgPSAoQW5ndWxhck5hbWVTZXJ2aWNlLmdldE5hbWVPZkludGVyYWN0aW9uUnVsZXNTZXJ2aWNlKGludGVyYWN0aW9uSWQpKTtcbiAgICAgICAgICAgICAgICB2YXIgcnVsZXNTZXJ2aWNlID0gJGluamVjdG9yLmdldChydWxlc1NlcnZpY2VOYW1lKTtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gKEFuc3dlckNsYXNzaWZpY2F0aW9uU2VydmljZS5nZXRNYXRjaGluZ0NsYXNzaWZpY2F0aW9uUmVzdWx0KHN0YXRlTmFtZSwgaW50ZXJhY3Rpb24sIGNvcnJlY3RBbnN3ZXIsIHJ1bGVzU2VydmljZSkpO1xuICAgICAgICAgICAgICAgIGlmIChTdGF0ZUVkaXRvclNlcnZpY2UuaXNJblF1ZXN0aW9uTW9kZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQub3V0Y29tZS5sYWJlbGxlZEFzQ29ycmVjdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlTmFtZSAhPT0gcmVzdWx0Lm91dGNvbWUuZGVzdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU3RhbmRhbG9uZSBzZXJ2aWNlcyBmb3IgdGhlIGdlbmVyYWwgc3RhdGUgZWRpdG9yIHBhZ2UuXG4gKi9cbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdzdGF0ZUVkaXRvck1vZHVsZScpLmZhY3RvcnkoJ1N0YXRlUHJvcGVydHlTZXJ2aWNlJywgW1xuICAgICckbG9nJywgJ0FsZXJ0c1NlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkbG9nLCBBbGVydHNTZXJ2aWNlKSB7XG4gICAgICAgIC8vIFB1YmxpYyBiYXNlIEFQSSBmb3IgZGF0YSBzZXJ2aWNlcyBjb3JyZXNwb25kaW5nIHRvIHN0YXRlIHByb3BlcnRpZXNcbiAgICAgICAgLy8gKGludGVyYWN0aW9uIGlkLCBjb250ZW50LCBldGMuKVxuICAgICAgICAvLyBXQVJOSU5HOiBUaGlzIHNob3VsZCBiZSBpbml0aWFsaXplZCBvbmx5IGluIHRoZSBjb250ZXh0IG9mIHRoZSBzdGF0ZVxuICAgICAgICAvLyBlZGl0b3IsIGFuZCBldmVyeSB0aW1lIHRoZSBzdGF0ZSBpcyBsb2FkZWQsIHNvIHRoYXQgcHJvcGVyIGJlaGF2aW9yIGlzXG4gICAgICAgIC8vIG1haW50YWluZWQgaWYgZS5nLiB0aGUgc3RhdGUgaXMgcmVuYW1lZC5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGluaXQ6IGZ1bmN0aW9uIChzdGF0ZU5hbWUsIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc2V0dGVyTWV0aG9kS2V5ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93ICdTdGF0ZSBwcm9wZXJ0eSBzZXR0ZXIgbWV0aG9kIGtleSBjYW5ub3QgYmUgbnVsbC4nO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBUaGUgbmFtZSBvZiB0aGUgc3RhdGUuXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZU5hbWUgPSBzdGF0ZU5hbWU7XG4gICAgICAgICAgICAgICAgLy8gVGhlIGN1cnJlbnQgdmFsdWUgb2YgdGhlIHByb3BlcnR5ICh3aGljaCBtYXkgbm90IGhhdmUgYmVlbiBzYXZlZCB0b1xuICAgICAgICAgICAgICAgIC8vIHRoZSBmcm9udGVuZCB5ZXQpLiBJbiBnZW5lcmFsLCB0aGlzIHdpbGwgYmUgYm91bmQgZGlyZWN0bHkgdG8gdGhlIFVJLlxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheWVkID0gYW5ndWxhci5jb3B5KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAvLyBUaGUgcHJldmlvdXMgKHNhdmVkLWluLXRoZS1mcm9udGVuZCkgdmFsdWUgb2YgdGhlIHByb3BlcnR5LiBIZXJlLFxuICAgICAgICAgICAgICAgIC8vICdzYXZlZCcgbWVhbnMgdGhhdCB0aGlzIGlzIHRoZSBsYXRlc3QgdmFsdWUgb2YgdGhlIHByb3BlcnR5IGFzXG4gICAgICAgICAgICAgICAgLy8gZGV0ZXJtaW5lZCBieSB0aGUgZnJvbnRlbmQgY2hhbmdlIGxpc3QuXG4gICAgICAgICAgICAgICAgdGhpcy5zYXZlZE1lbWVudG8gPSBhbmd1bGFyLmNvcHkodmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFJldHVybnMgd2hldGhlciB0aGUgY3VycmVudCB2YWx1ZSBoYXMgY2hhbmdlZCBmcm9tIHRoZSBtZW1lbnRvLlxuICAgICAgICAgICAgaGFzQ2hhbmdlZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAhYW5ndWxhci5lcXVhbHModGhpcy5zYXZlZE1lbWVudG8sIHRoaXMuZGlzcGxheWVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBUaGUgbmFtZSBvZiB0aGUgc2V0dGVyIG1ldGhvZCBpbiBFeHBsb3JhdGlvblN0YXRlc1NlcnZpY2UgZm9yIHRoaXNcbiAgICAgICAgICAgIC8vIHByb3BlcnR5LiBUSElTIE1VU1QgQkUgU1BFQ0lGSUVEIEJZIFNVQkNMQVNTRVMuXG4gICAgICAgICAgICBzZXR0ZXJNZXRob2RLZXk6IG51bGwsXG4gICAgICAgICAgICAvLyBUcmFuc2Zvcm1zIHRoZSBnaXZlbiB2YWx1ZSBpbnRvIGEgbm9ybWFsaXplZCBmb3JtLiBUSElTIENBTiBCRVxuICAgICAgICAgICAgLy8gT1ZFUlJJRERFTiBCWSBTVUJDTEFTU0VTLiBUaGUgZGVmYXVsdCBiZWhhdmlvciBpcyB0byBkbyBub3RoaW5nLlxuICAgICAgICAgICAgX25vcm1hbGl6ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFZhbGlkYXRlcyB0aGUgZ2l2ZW4gdmFsdWUgYW5kIHJldHVybnMgYSBib29sZWFuIHN0YXRpbmcgd2hldGhlciBpdFxuICAgICAgICAgICAgLy8gaXMgdmFsaWQgb3Igbm90LiBUSElTIENBTiBCRSBPVkVSUklEREVOIEJZIFNVQkNMQVNTRVMuIFRoZSBkZWZhdWx0XG4gICAgICAgICAgICAvLyBiZWhhdmlvciBpcyB0byBhbHdheXMgcmV0dXJuIHRydWUuXG4gICAgICAgICAgICBfaXNWYWxpZDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gVXBkYXRlcyB0aGUgbWVtZW50byB0byB0aGUgZGlzcGxheWVkIHZhbHVlLlxuICAgICAgICAgICAgc2F2ZURpc3BsYXllZFZhbHVlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc2V0dGVyTWV0aG9kS2V5ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93ICdTdGF0ZSBwcm9wZXJ0eSBzZXR0ZXIgbWV0aG9kIGtleSBjYW5ub3QgYmUgbnVsbC4nO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXllZCA9IHRoaXMuX25vcm1hbGl6ZSh0aGlzLmRpc3BsYXllZCk7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9pc1ZhbGlkKHRoaXMuZGlzcGxheWVkKSB8fCAhdGhpcy5oYXNDaGFuZ2VkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXN0b3JlRnJvbU1lbWVudG8oKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYW5ndWxhci5lcXVhbHModGhpcy5kaXNwbGF5ZWQsIHRoaXMuc2F2ZWRNZW1lbnRvKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuY2xlYXJXYXJuaW5ncygpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2F2ZWRNZW1lbnRvID0gYW5ndWxhci5jb3B5KHRoaXMuZGlzcGxheWVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBSZXZlcnRzIHRoZSBkaXNwbGF5ZWQgdmFsdWUgdG8gdGhlIHNhdmVkIG1lbWVudG8uXG4gICAgICAgICAgICByZXN0b3JlRnJvbU1lbWVudG86IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXllZCA9IGFuZ3VsYXIuY29weSh0aGlzLnNhdmVkTWVtZW50byk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG5vcHBpYS5jb25zdGFudCgnV0FSTklOR19UWVBFUycsIHtcbiAgICAvLyBUaGVzZSBtdXN0IGJlIGZpeGVkIGJlZm9yZSB0aGUgZXhwbG9yYXRpb24gY2FuIGJlIHNhdmVkLlxuICAgIENSSVRJQ0FMOiAnY3JpdGljYWwnLFxuICAgIC8vIFRoZXNlIG11c3QgYmUgZml4ZWQgYmVmb3JlIHB1Ymxpc2hpbmcgYW4gZXhwbG9yYXRpb24gdG8gdGhlIHB1YmxpY1xuICAgIC8vIGxpYnJhcnkuXG4gICAgRVJST1I6ICdlcnJvcidcbn0pO1xub3BwaWEuY29uc3RhbnQoJ1NUQVRFX0VSUk9SX01FU1NBR0VTJywge1xuICAgIEFERF9JTlRFUkFDVElPTjogJ1BsZWFzZSBhZGQgYW4gaW50ZXJhY3Rpb24gdG8gdGhpcyBjYXJkLicsXG4gICAgU1RBVEVfVU5SRUFDSEFCTEU6ICdUaGlzIGNhcmQgaXMgdW5yZWFjaGFibGUuJyxcbiAgICBVTkFCTEVfVE9fRU5EX0VYUExPUkFUSU9OOiAoJ1RoZXJlXFwncyBubyB3YXkgdG8gY29tcGxldGUgdGhlIGV4cGxvcmF0aW9uIHN0YXJ0aW5nIGZyb20gdGhpcyBjYXJkLiAnICtcbiAgICAgICAgJ1RvIGZpeCB0aGlzLCBtYWtlIHN1cmUgdGhhdCB0aGUgbGFzdCBjYXJkIGluIHRoZSBjaGFpbiBzdGFydGluZyBmcm9tICcgK1xuICAgICAgICAndGhpcyBvbmUgaGFzIGFuIFxcJ0VuZCBFeHBsb3JhdGlvblxcJyBxdWVzdGlvbiB0eXBlLicpLFxuICAgIElOQ09SUkVDVF9TT0xVVElPTjogKCdUaGUgY3VycmVudCBzb2x1dGlvbiBkb2VzIG5vdCBsZWFkIHRvIGFub3RoZXIgY2FyZC4nKSxcbiAgICBVTlJFU09MVkVEX0FOU1dFUjogKCdUaGVyZSBpcyBhbiBhbnN3ZXIgYW1vbmcgdGhlIHRvcCAxMCB3aGljaCBoYXMgbm8gZXhwbGljaXQgZmVlZGJhY2suJylcbn0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBkZXRlcm1pbmluZyB0aGUgdmlzaWJpbGl0eSBvZiBhZHZhbmNlZCBmZWF0dXJlcyBpblxuICogICAgICAgICAgICAgICB0aGUgZXhwbG9yYXRpb24gZWRpdG9yLlxuICovXG5vcHBpYS5mYWN0b3J5KCdFeHBsb3JhdGlvbkZlYXR1cmVzU2VydmljZScsIFtmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzZXR0aW5ncyA9IHtcbiAgICAgICAgICAgIGFyZVBhcmFtZXRlcnNFbmFibGVkOiBmYWxzZSxcbiAgICAgICAgICAgIGlzSW1wcm92ZW1lbnRzVGFiRW5hYmxlZDogZmFsc2UsXG4gICAgICAgICAgICBpc1BsYXl0aHJvdWdoUmVjb3JkaW5nRW5hYmxlZDogZmFsc2UsXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25EYXRhLCBmZWF0dXJlc0RhdGEpIHtcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5pc0ltcHJvdmVtZW50c1RhYkVuYWJsZWQgPVxuICAgICAgICAgICAgICAgICAgICBmZWF0dXJlc0RhdGEuaXNfaW1wcm92ZW1lbnRzX3RhYl9lbmFibGVkO1xuICAgICAgICAgICAgICAgIHNldHRpbmdzLmlzUGxheXRocm91Z2hSZWNvcmRpbmdFbmFibGVkID1cbiAgICAgICAgICAgICAgICAgICAgZmVhdHVyZXNEYXRhLmlzX2V4cGxvcmF0aW9uX3doaXRlbGlzdGVkO1xuICAgICAgICAgICAgICAgIGlmIChleHBsb3JhdGlvbkRhdGEucGFyYW1fY2hhbmdlcyAmJlxuICAgICAgICAgICAgICAgICAgICBleHBsb3JhdGlvbkRhdGEucGFyYW1fY2hhbmdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW5hYmxlUGFyYW1ldGVycygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgc3RhdGUgaW4gZXhwbG9yYXRpb25EYXRhLnN0YXRlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV4cGxvcmF0aW9uRGF0YS5zdGF0ZXNbc3RhdGVdLnBhcmFtX2NoYW5nZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW5hYmxlUGFyYW1ldGVycygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFyZVBhcmFtZXRlcnNFbmFibGVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldHRpbmdzLmFyZVBhcmFtZXRlcnNFbmFibGVkO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzSW1wcm92ZW1lbnRzVGFiRW5hYmxlZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZXR0aW5ncy5pc0ltcHJvdmVtZW50c1RhYkVuYWJsZWQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNQbGF5dGhyb3VnaFJlY29yZGluZ0VuYWJsZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0dGluZ3MuaXNQbGF5dGhyb3VnaFJlY29yZGluZ0VuYWJsZWQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5hYmxlUGFyYW1ldGVyczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNldHRpbmdzLmFyZVBhcmFtZXRlcnNFbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBVdGlsaXR5IHNlcnZpY2UgZm9yIHNhdmluZyBkYXRhIGxvY2FsbHkgb24gdGhlIGNsaWVudCBtYWNoaW5lLlxuICovXG5yZXF1aXJlKCdkb21haW4vZXhwbG9yYXRpb24vRXhwbG9yYXRpb25EcmFmdE9iamVjdEZhY3RvcnkudHMnKTtcbi8vIFNlcnZpY2UgZm9yIHNhdmluZyBleHBsb3JhdGlvbiBkcmFmdCBjaGFuZ2VzIHRvIGxvY2FsIHN0b3JhZ2UuXG4vL1xuLy8gTm90ZSB0aGF0IHRoZSBkcmFmdCBpcyBvbmx5IHNhdmVkIGlmIGxvY2FsU3RvcmFnZSBleGlzdHMgYW5kIHdvcmtzXG4vLyAoaS5lLiBoYXMgc3RvcmFnZSBjYXBhY2l0eSkuXG5vcHBpYS5mYWN0b3J5KCdMb2NhbFN0b3JhZ2VTZXJ2aWNlJywgW1xuICAgICdFeHBsb3JhdGlvbkRyYWZ0T2JqZWN0RmFjdG9yeScsXG4gICAgZnVuY3Rpb24gKEV4cGxvcmF0aW9uRHJhZnRPYmplY3RGYWN0b3J5KSB7XG4gICAgICAgIC8vIENoZWNrIHRoYXQgbG9jYWwgc3RvcmFnZSBleGlzdHMgYW5kIHdvcmtzIGFzIGV4cGVjdGVkLlxuICAgICAgICAvLyBJZiBpdCBkb2VzIHN0b3JhZ2Ugc3RvcmVzIHRoZSBsb2NhbFN0b3JhZ2Ugb2JqZWN0LFxuICAgICAgICAvLyBlbHNlIHN0b3JhZ2UgaXMgdW5kZWZpbmVkIG9yIGZhbHNlLlxuICAgICAgICB2YXIgc3RvcmFnZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdGVzdCA9ICd0ZXN0JztcbiAgICAgICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKHRlc3QsIHRlc3QpO1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKHRlc3QpID09PSB0ZXN0O1xuICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKHRlc3QpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQgJiYgbG9jYWxTdG9yYWdlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGV4Y2VwdGlvbikgeyB9XG4gICAgICAgIH0oKSk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGUgdGhlIGtleSB0byBhY2Nlc3MgdGhlIGNoYW5nZUxpc3QgaW4gbG9jYWxTdG9yYWdlXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBleHBsb3JhdGlvbklkIC0gVGhlIGV4cGxvcmF0aW9uIGlkIG9mIHRoZSBjaGFuZ2VMaXN0XG4gICAgICAgICAqICAgdG8gYmUgYWNjZXNzZWQuXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgX2NyZWF0ZUV4cGxvcmF0aW9uRHJhZnRLZXkgPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgcmV0dXJuICdkcmFmdF8nICsgZXhwbG9yYXRpb25JZDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2hlY2sgdGhhdCBsb2NhbFN0b3JhZ2UgaXMgYXZhaWxhYmxlIHRvIHRoZSBjbGllbnQuXG4gICAgICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgdGhlIGNsaWVudCBoYXMgYWNjZXNzIHRvIGxvY2FsU3RvcmFnZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaXNTdG9yYWdlQXZhaWxhYmxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEJvb2xlYW4oc3RvcmFnZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTYXZlIHRoZSBnaXZlbiBjaGFuZ2VMaXN0IHRvIGxvY2FsU3RvcmFnZSBhbG9uZyB3aXRoIGl0c1xuICAgICAgICAgICAgICogZHJhZnRDaGFuZ2VMaXN0SWRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBleHBsb3JhdGlvbklkIC0gVGhlIGlkIG9mIHRoZSBleHBsb3JhdGlvblxuICAgICAgICAgICAgICogICBhc3NvY2lhdGVkIHdpdGggdGhlIGNoYW5nZUxpc3QgdG8gYmUgc2F2ZWQuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0xpc3R9IGNoYW5nZUxpc3QgLSBUaGUgZXhwbG9yYXRpb24gY2hhbmdlIGxpc3QgdG8gYmUgc2F2ZWQuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0ludGVnZXJ9IGRyYWZ0Q2hhbmdlTGlzdElkIC0gVGhlIGlkIG9mIHRoZSBkcmFmdCB0byBiZSBzYXZlZC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2F2ZUV4cGxvcmF0aW9uRHJhZnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkLCBjaGFuZ2VMaXN0LCBkcmFmdENoYW5nZUxpc3RJZCkge1xuICAgICAgICAgICAgICAgIHZhciBsb2NhbFNhdmVLZXkgPSBfY3JlYXRlRXhwbG9yYXRpb25EcmFmdEtleShleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgICAgICBpZiAoc3RvcmFnZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZHJhZnREaWN0ID0gRXhwbG9yYXRpb25EcmFmdE9iamVjdEZhY3RvcnkudG9Mb2NhbFN0b3JhZ2VEaWN0KGNoYW5nZUxpc3QsIGRyYWZ0Q2hhbmdlTGlzdElkKTtcbiAgICAgICAgICAgICAgICAgICAgc3RvcmFnZS5zZXRJdGVtKGxvY2FsU2F2ZUtleSwgSlNPTi5zdHJpbmdpZnkoZHJhZnREaWN0KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0cmlldmUgdGhlIGxvY2FsIHNhdmUgb2YgdGhlIGNoYW5nZUxpc3QgYXNzb2NpYXRlZCB3aXRoIHRoZSBnaXZlblxuICAgICAgICAgICAgICogZXhwbG9yYXRpb24gaWQuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXhwbG9yYXRpb25JZCAtIFRoZSBleHBsb3JhdGlvbiBpZCBvZiB0aGUgY2hhbmdlIGxpc3RcbiAgICAgICAgICAgICAqICAgdG8gYmUgcmV0cmlldmVkLlxuICAgICAgICAgICAgICogQHJldHVybnMge09iamVjdH0gVGhlIGxvY2FsIHNhdmUgZHJhZnQgb2JqZWN0IGlmIGl0IGV4aXN0cyxcbiAgICAgICAgICAgICAqICAgZWxzZSBudWxsLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRFeHBsb3JhdGlvbkRyYWZ0OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIGlmIChzdG9yYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkcmFmdERpY3QgPSBKU09OLnBhcnNlKHN0b3JhZ2UuZ2V0SXRlbShfY3JlYXRlRXhwbG9yYXRpb25EcmFmdEtleShleHBsb3JhdGlvbklkKSkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZHJhZnREaWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwbG9yYXRpb25EcmFmdE9iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUxvY2FsU3RvcmFnZURpY3QoZHJhZnREaWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJlbW92ZSB0aGUgbG9jYWwgc2F2ZSBvZiB0aGUgY2hhbmdlTGlzdCBhc3NvY2lhdGVkIHdpdGggdGhlIGdpdmVuXG4gICAgICAgICAgICAgKiBleHBsb3JhdGlvbiBpZC5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBleHBsb3JhdGlvbklkIC0gVGhlIGV4cGxvcmF0aW9uIGlkIG9mIHRoZSBjaGFuZ2UgbGlzdFxuICAgICAgICAgICAgICogICB0byBiZSByZW1vdmVkLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICByZW1vdmVFeHBsb3JhdGlvbkRyYWZ0OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIGlmIChzdG9yYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3JhZ2UucmVtb3ZlSXRlbShfY3JlYXRlRXhwbG9yYXRpb25EcmFmdEtleShleHBsb3JhdGlvbklkKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==