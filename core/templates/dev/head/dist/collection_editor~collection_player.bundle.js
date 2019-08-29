(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["collection_editor~collection_player"],{

/***/ "./core/templates/dev/head/domain/collection/CollectionNodeObjectFactory.ts":
/*!**********************************************************************************!*\
  !*** ./core/templates/dev/head/domain/collection/CollectionNodeObjectFactory.ts ***!
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Factory for creating and mutating instances of frontend
 * collection node domain objects.
 */
var cloneDeep_1 = __importDefault(__webpack_require__(/*! lodash/cloneDeep */ "./node_modules/lodash/cloneDeep.js"));
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var app_constants_1 = __webpack_require__(/*! app.constants */ "./core/templates/dev/head/app.constants.ts");
var CollectionNode = /** @class */ (function () {
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'collectionNodeBackendObject' is a dict with underscore_cased
    // keys which give tslint errors against underscore_casing in favor of
    // camelCasing.
    function CollectionNode(collectionNodeBackendObject) {
        this._explorationId = collectionNodeBackendObject.exploration_id;
        this._explorationSummaryObject = cloneDeep_1.default(collectionNodeBackendObject.exploration_summary);
    }
    // Returns the ID of the exploration represented by this collection node.
    // This property is immutable.
    CollectionNode.prototype.getExplorationId = function () {
        return this._explorationId;
    };
    // Returns the title of the exploration represented by this collection node.
    // This property is immutable. The value returned by this function is
    // null if doesExplorationExist() returns false.
    CollectionNode.prototype.getExplorationTitle = function () {
        if (this._explorationSummaryObject) {
            return this._explorationSummaryObject.title;
        }
        else {
            return null;
        }
    };
    // Returns whether the exploration referenced by this node is known to exist
    // in the backend. This property is immutable.
    CollectionNode.prototype.doesExplorationExist = function () {
        return this._explorationSummaryObject !== null;
    };
    // Returns whether the exploration referenced by this node is private and
    // not published. This property is immutable. The value returned by this
    // function is undefined if doesExplorationExist() returns false.
    CollectionNode.prototype.isExplorationPrivate = function () {
        if (this._explorationSummaryObject) {
            return this._explorationSummaryObject.status === (app_constants_1.AppConstants.ACTIVITY_STATUS_PRIVATE);
        }
        else {
            return undefined;
        }
    };
    // Returns a raw exploration summary object, as supplied by the backend for
    // frontend exploration summary tile displaying. Changes to the returned
    // object are not reflected in this domain object. The value returned by
    // this function is null if doesExplorationExist() returns false.
    // TODO(#7165): Replace 'any' with the exact type. This has been typed
    // as 'any' since '_explorationSummaryObject' is a dict of varying keys.
    CollectionNode.prototype.getExplorationSummaryObject = function () {
        // TODO(bhenning): This should be represented by a
        // frontend summary domain object that is also shared with
        // the search result and profile pages.
        return cloneDeep_1.default(this._explorationSummaryObject);
    };
    // Sets the raw exploration summary object stored within this node.
    // TODO(#7165): Replace 'any' with the exact type. This has been typed
    // as 'any' since '_explorationSummaryObject' is a dict of varying keys.
    CollectionNode.prototype.setExplorationSummaryObject = function (explorationSummaryBackendObject) {
        this._explorationSummaryObject = cloneDeep_1.default(explorationSummaryBackendObject);
    };
    CollectionNode.prototype.getCapitalizedObjective = function () {
        return (this._explorationSummaryObject.objective.charAt(0).toUpperCase() +
            this._explorationSummaryObject.objective.slice(1));
    };
    return CollectionNode;
}());
exports.CollectionNode = CollectionNode;
var CollectionNodeObjectFactory = /** @class */ (function () {
    function CollectionNodeObjectFactory() {
    }
    // Static class methods. Note that "this" is not available in static
    // contexts. This function takes a JSON object which represents a backend
    // collection node python dict.
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'collectionNodeBackendObject' is a dict with underscore_cased
    // keys which give tslint errors against underscore_casing in favor of
    // camelCasing.
    CollectionNodeObjectFactory.prototype.create = function (collectionNodeBackendObject) {
        return new CollectionNode(collectionNodeBackendObject);
    };
    CollectionNodeObjectFactory.prototype.createFromExplorationId = function (explorationId) {
        return this.create({
            exploration_id: explorationId,
            exploration_summary: null
        });
    };
    CollectionNodeObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], CollectionNodeObjectFactory);
    return CollectionNodeObjectFactory;
}());
exports.CollectionNodeObjectFactory = CollectionNodeObjectFactory;
angular.module('oppia').factory('CollectionNodeObjectFactory', static_1.downgradeInjectable(CollectionNodeObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/collection/CollectionObjectFactory.ts":
/*!******************************************************************************!*\
  !*** ./core/templates/dev/head/domain/collection/CollectionObjectFactory.ts ***!
  \******************************************************************************/
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Factory for creating and mutating instances of frontend
 * collection domain objects.
 */
var cloneDeep_1 = __importDefault(__webpack_require__(/*! lodash/cloneDeep */ "./node_modules/lodash/cloneDeep.js"));
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var CollectionNodeObjectFactory_1 = __webpack_require__(/*! domain/collection/CollectionNodeObjectFactory */ "./core/templates/dev/head/domain/collection/CollectionNodeObjectFactory.ts");
var Collection = /** @class */ (function () {
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'collectionBackendObject' is a dict with underscore_cased
    // keys which give tslint errors against underscore_casing in favor of
    // camelCasing.
    function Collection(collectionBackendObject, collectionNodeObjectFactory) {
        this._id = collectionBackendObject.id;
        this._title = collectionBackendObject.title;
        this._objective = collectionBackendObject.objective;
        this._languageCode = collectionBackendObject.language_code;
        this._tags = collectionBackendObject.tags;
        this._category = collectionBackendObject.category;
        this._version = collectionBackendObject.version;
        this._nodes = [];
        // This map acts as a fast way of looking up a collection node for a given
        // exploration ID.
        this._explorationIdToNodeIndexMap = {};
        for (var i = 0; i < collectionBackendObject.nodes.length; i++) {
            this._nodes[i] = collectionNodeObjectFactory.create(collectionBackendObject.nodes[i]);
            var explorationId = this._nodes[i].getExplorationId();
            this._explorationIdToNodeIndexMap[explorationId] = i;
        }
    }
    Collection.prototype.getId = function () {
        return this._id;
    };
    Collection.prototype.getTitle = function () {
        return this._title;
    };
    Collection.prototype.setTitle = function (title) {
        this._title = title;
    };
    Collection.prototype.getCategory = function () {
        return this._category;
    };
    Collection.prototype.setCategory = function (category) {
        this._category = category;
    };
    Collection.prototype.getObjective = function () {
        return this._objective;
    };
    Collection.prototype.setObjective = function (objective) {
        this._objective = objective;
    };
    Collection.prototype.getLanguageCode = function () {
        return this._languageCode;
    };
    Collection.prototype.setLanguageCode = function (languageCode) {
        this._languageCode = languageCode;
    };
    Collection.prototype.getTags = function () {
        return this._tags;
    };
    Collection.prototype.setTags = function (tags) {
        this._tags = tags;
    };
    Collection.prototype.getVersion = function () {
        return this._version;
    };
    // Adds a new frontend collection node domain object to this collection.
    // This will return true if the node was successfully added, or false if the
    // given collection node references an exploration ID already referenced by
    // another node within this collection. Changes to the provided object will
    // be reflected in this collection.
    Collection.prototype.addCollectionNode = function (collectionNodeObject) {
        var explorationId = collectionNodeObject.getExplorationId();
        if (!this._explorationIdToNodeIndexMap.hasOwnProperty(explorationId)) {
            this._explorationIdToNodeIndexMap[explorationId] = this._nodes.length;
            this._nodes.push(collectionNodeObject);
            return true;
        }
        return false;
    };
    // This will swap 2 nodes of the collection and update the exploration id
    // to node index map accordingly.
    Collection.prototype.swapCollectionNodes = function (firstIndex, secondIndex) {
        if (firstIndex >= this._nodes.length ||
            secondIndex >= this._nodes.length ||
            firstIndex < 0 ||
            secondIndex < 0) {
            return false;
        }
        var firstIndexId = this._nodes[firstIndex].getExplorationId();
        var secondIndexId = this._nodes[secondIndex].getExplorationId();
        var temp = this._nodes[firstIndex];
        this._nodes[firstIndex] = this._nodes[secondIndex];
        this._nodes[secondIndex] = temp;
        this._explorationIdToNodeIndexMap[firstIndexId] = secondIndex;
        this._explorationIdToNodeIndexMap[secondIndexId] = firstIndex;
        return true;
    };
    // Attempts to remove a collection node from this collection given the
    // specified exploration ID. Returns whether the collection node was
    // removed, which depends on whether any collection nodes reference the
    // given exploration ID.
    Collection.prototype.deleteCollectionNode = function (explorationId) {
        // TODO(bhenning): Consider whether the removed collection node should be
        // invalidated, leading to errors if its mutated in the future. This might
        // help prevent bugs where collection nodes are stored and changed after
        // being removed from a collection.
        if (this._explorationIdToNodeIndexMap.hasOwnProperty(explorationId)) {
            var nodeIndex = this._explorationIdToNodeIndexMap[explorationId];
            delete this._explorationIdToNodeIndexMap[explorationId];
            this._nodes.splice(nodeIndex, 1);
            // Update all node exploration ID map references past the removed index
            // to ensure they are still pointing to correct indexes.
            for (var i = nodeIndex; i < this._nodes.length; i++) {
                var nodeExpId = this._nodes[i].getExplorationId();
                this._explorationIdToNodeIndexMap[nodeExpId] = i;
            }
            return true;
        }
        return false;
    };
    // Deletes all collection nodes within this collection.
    Collection.prototype.clearCollectionNodes = function () {
        // Clears the existing array in-place, since there may be Angular bindings
        // to this array and they can't be reset to empty arrays.See for context:
        // http://stackoverflow.com/a/1232046
        this._nodes.length = 0;
        this._explorationIdToNodeIndexMap = {};
    };
    // Returns whether any collection nodes in this collection reference the
    // provided exploration ID.
    Collection.prototype.containsCollectionNode = function (explorationId) {
        return this._explorationIdToNodeIndexMap.hasOwnProperty(explorationId);
    };
    // Returns a collection node given an exploration ID, or undefined if no
    // collection node within this collection references the provided
    // exploration ID.
    Collection.prototype.getCollectionNodeByExplorationId = function (expId) {
        return this._nodes[this._explorationIdToNodeIndexMap[expId]];
    };
    // Returns a list of collection node objects for this collection. Changes to
    // nodes returned by this function will be reflected in the collection.
    // Changes to the list itself will not be reflected in this collection.
    Collection.prototype.getCollectionNodes = function () {
        return this._nodes.slice();
    };
    Collection.prototype.getCollectionNodeCount = function () {
        return this._nodes.length;
    };
    // Returns the reference to the internal nodes array; this function is only
    // meant to be used for Angular bindings and should never be used in code.
    // Please use getCollectionNodes() and related functions, instead. Please
    // also be aware this exposes internal state of the collection domain
    // object, so changes to the array itself may internally break the domain
    // object.
    Collection.prototype.getBindableCollectionNodes = function () {
        return this._nodes;
    };
    // Returns the collection node which is initially available to play
    // by the player.
    Collection.prototype.getStartingCollectionNode = function () {
        if (this._nodes.length === 0) {
            return null;
        }
        else {
            return this._nodes[0];
        }
    };
    // Returns a list of all exploration IDs referenced by this collection.
    // Changes to the list itself will not be reflected in this collection.
    Collection.prototype.getExplorationIds = function () {
        return cloneDeep_1.default(Object.keys(this._explorationIdToNodeIndexMap));
    };
    // Reassigns all values within this collection to match the existing
    // collection. This is performed as a deep copy such that none of the
    // internal, bindable objects are changed within this collection. Note that
    // the collection nodes within this collection will be completely redefined
    // as copies from the specified collection.
    Collection.prototype.copyFromCollection = function (otherCollection) {
        this._id = otherCollection.getId();
        this.setTitle(otherCollection.getTitle());
        this.setCategory(otherCollection.getCategory());
        this.setObjective(otherCollection.getObjective());
        this.setLanguageCode(otherCollection.getLanguageCode());
        this.setTags(otherCollection.getTags());
        this._version = otherCollection.getVersion();
        this.clearCollectionNodes();
        var nodes = otherCollection.getCollectionNodes();
        for (var i = 0; i < nodes.length; i++) {
            this.addCollectionNode(cloneDeep_1.default(nodes[i]));
        }
    };
    return Collection;
}());
exports.Collection = Collection;
var CollectionObjectFactory = /** @class */ (function () {
    function CollectionObjectFactory(collectionNodeObjectFactory) {
        this.collectionNodeObjectFactory = collectionNodeObjectFactory;
    }
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'collectionBackendObject' is a dict with underscore_cased
    // keys which give tslint errors against underscore_casing in favor of
    // camelCasing.
    CollectionObjectFactory.prototype.create = function (collectionBackendObject) {
        return new Collection(collectionBackendObject, this.collectionNodeObjectFactory);
    };
    // Create a new, empty collection. This is not guaranteed to pass validation
    // tests.
    CollectionObjectFactory.prototype.createEmptyCollection = function () {
        return new Collection({
            nodes: [],
        }, this.collectionNodeObjectFactory);
    };
    var _a;
    CollectionObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        }),
        __metadata("design:paramtypes", [typeof (_a = typeof CollectionNodeObjectFactory_1.CollectionNodeObjectFactory !== "undefined" && CollectionNodeObjectFactory_1.CollectionNodeObjectFactory) === "function" ? _a : Object])
    ], CollectionObjectFactory);
    return CollectionObjectFactory;
}());
exports.CollectionObjectFactory = CollectionObjectFactory;
angular.module('oppia').factory('CollectionObjectFactory', static_1.downgradeInjectable(CollectionObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/collection/ReadOnlyCollectionBackendApiService.ts":
/*!******************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/collection/ReadOnlyCollectionBackendApiService.ts ***!
  \******************************************************************************************/
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
 * @fileoverview Service to retrieve read only information
 * about collections from the backend.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
// TODO(bhenning): For preview mode, this service should be replaced by a
// separate CollectionDataService implementation which returns a local copy of
// the collection instead. This file should not be included on the page in that
// scenario.
angular.module('oppia').factory('ReadOnlyCollectionBackendApiService', [
    '$http', '$q', 'UrlInterpolationService',
    'COLLECTION_DATA_URL_TEMPLATE',
    function ($http, $q, UrlInterpolationService, COLLECTION_DATA_URL_TEMPLATE) {
        // Maps previously loaded collections to their IDs.
        var _collectionCache = [];
        var _collectionDetailsCache = [];
        var _fetchCollection = function (collectionId, successCallback, errorCallback) {
            var collectionDataUrl = UrlInterpolationService.interpolateUrl(COLLECTION_DATA_URL_TEMPLATE, {
                collection_id: collectionId
            });
            $http.get(collectionDataUrl).then(function (response) {
                var collection = angular.copy(response.data.collection);
                _cacheCollectionDetails(response.data);
                if (successCallback) {
                    successCallback(collection);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _cacheCollectionDetails = function (details) {
            _collectionDetailsCache[details.collection.id] = {
                canEdit: details.can_edit,
                title: details.collection.title,
            };
        };
        var _isCached = function (collectionId) {
            return _collectionCache.hasOwnProperty(collectionId);
        };
        return {
            /**
             * Retrieves a collection from the backend given a collection ID. This
             * returns a promise object that allows a success and rejection callbacks
             * to be registered. If the collection is successfully loaded and a
             * success callback function is provided to the promise object, the
             * success callback is called with the collection passed in as a
             * parameter. If something goes wrong while trying to fetch the
             * collection, the rejection callback is called instead, if present. The
             * rejection callback function is passed the error that occurred and the
             * collection ID.
             */
            fetchCollection: function (collectionId) {
                return $q(function (resolve, reject) {
                    _fetchCollection(collectionId, resolve, reject);
                });
            },
            /**
             * Behaves in the exact same way as fetchCollection (including callback
             * behavior and returning a promise object), except this function will
             * attempt to see whether the given collection has already been loaded. If
             * it has not yet been loaded, it will fetch the collection from the
             * backend. If it successfully retrieves the collection from the backend,
             * it will store it in the cache to avoid requests from the backend in
             * further function calls.
             */
            loadCollection: function (collectionId) {
                return $q(function (resolve, reject) {
                    if (_isCached(collectionId)) {
                        if (resolve) {
                            resolve(angular.copy(_collectionCache[collectionId]));
                        }
                    }
                    else {
                        _fetchCollection(collectionId, function (collection) {
                            // Save the fetched collection to avoid future fetches.
                            _collectionCache[collectionId] = collection;
                            if (resolve) {
                                resolve(angular.copy(collection));
                            }
                        }, reject);
                    }
                });
            },
            getCollectionDetails: function (collectionId) {
                if (_collectionDetailsCache[collectionId]) {
                    return _collectionDetailsCache[collectionId];
                }
                else {
                    throw Error('collection has not been fetched');
                }
            },
            /**
             * Returns whether the given collection is stored within the local data
             * cache or if it needs to be retrieved from the backend upon a laod.
             */
            isCached: function (collectionId) {
                return _isCached(collectionId);
            },
            /**
             * Replaces the current collection in the cache given by the specified
             * collection ID with a new collection object.
             */
            cacheCollection: function (collectionId, collection) {
                _collectionCache[collectionId] = angular.copy(collection);
            },
            /**
             * Clears the local collection data cache, forcing all future loads to
             * re-request the previously loaded collections from the backend.
             */
            clearCollectionCache: function () {
                _collectionCache = [];
            }
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

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vY29sbGVjdGlvbi9Db2xsZWN0aW9uTm9kZU9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2NvbGxlY3Rpb24vQ29sbGVjdGlvbk9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2NvbGxlY3Rpb24vUmVhZE9ubHlDb2xsZWN0aW9uQmFja2VuZEFwaVNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL29iamVjdHMvb2JqZWN0cy1kb21haW4uY29uc3RhbnRzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL1BhZ2VUaXRsZVNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vZXh0ZW5zaW9ucy9pbnRlcmFjdGlvbnMvaW50ZXJhY3Rpb25zLWV4dGVuc2lvbi5jb25zdGFudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0Q0FBNEMsUUFBUTtBQUNwRDtBQUNBO0FBQ0E7QUFDQSw0Q0FBNEM7QUFDNUM7QUFDQSw4Q0FBOEMsY0FBYztBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtDQUFrQyxtQkFBTyxDQUFDLDREQUFrQjtBQUM1RCxlQUFlLG1CQUFPLENBQUMsOEZBQXlCO0FBQ2hELGFBQWEsbUJBQU8sQ0FBQyxpRUFBZTtBQUNwQyxzQkFBc0IsbUJBQU8sQ0FBQyxpRUFBZTtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBOzs7Ozs7Ozs7Ozs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0Q0FBNEMsUUFBUTtBQUNwRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0Q0FBNEM7QUFDNUM7QUFDQSw4Q0FBOEMsY0FBYztBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtDQUFrQyxtQkFBTyxDQUFDLDREQUFrQjtBQUM1RCxlQUFlLG1CQUFPLENBQUMsOEZBQXlCO0FBQ2hELGFBQWEsbUJBQU8sQ0FBQyxpRUFBZTtBQUNwQyxvQ0FBb0MsbUJBQU8sQ0FBQyxpSUFBK0M7QUFDM0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QiwwQ0FBMEM7QUFDakU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUMsd0JBQXdCO0FBQzNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5REFBeUQ7QUFDekQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QixrQkFBa0I7QUFDekM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBOzs7Ozs7Ozs7Ozs7QUMxUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQThDLGNBQWM7QUFDNUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEOzs7Ozs7Ozs7Ozs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0Q0FBNEMsUUFBUTtBQUNwRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQThDLGNBQWM7QUFDNUQ7QUFDQTtBQUNBO0FBQ0EsZUFBZSxtQkFBTyxDQUFDLDhGQUF5QjtBQUNoRCxhQUFhLG1CQUFPLENBQUMsaUVBQWU7QUFDcEMseUJBQXlCLG1CQUFPLENBQUMscUdBQTJCO0FBQzVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7Ozs7Ozs7Ozs7OztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhDQUE4QyxjQUFjO0FBQzVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0QiLCJmaWxlIjoiY29sbGVjdGlvbl9lZGl0b3J+Y29sbGVjdGlvbl9wbGF5ZXIuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBjcmVhdGluZyBhbmQgbXV0YXRpbmcgaW5zdGFuY2VzIG9mIGZyb250ZW5kXG4gKiBjb2xsZWN0aW9uIG5vZGUgZG9tYWluIG9iamVjdHMuXG4gKi9cbnZhciBjbG9uZURlZXBfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwibG9kYXNoL2Nsb25lRGVlcFwiKSk7XG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgYXBwX2NvbnN0YW50c18xID0gcmVxdWlyZShcImFwcC5jb25zdGFudHNcIik7XG52YXIgQ29sbGVjdGlvbk5vZGUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgLy8gVE9ETygjNzE3Nik6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiBrZXB0IGFzXG4gICAgLy8gJ2FueScgYmVjYXVzZSAnY29sbGVjdGlvbk5vZGVCYWNrZW5kT2JqZWN0JyBpcyBhIGRpY3Qgd2l0aCB1bmRlcnNjb3JlX2Nhc2VkXG4gICAgLy8ga2V5cyB3aGljaCBnaXZlIHRzbGludCBlcnJvcnMgYWdhaW5zdCB1bmRlcnNjb3JlX2Nhc2luZyBpbiBmYXZvciBvZlxuICAgIC8vIGNhbWVsQ2FzaW5nLlxuICAgIGZ1bmN0aW9uIENvbGxlY3Rpb25Ob2RlKGNvbGxlY3Rpb25Ob2RlQmFja2VuZE9iamVjdCkge1xuICAgICAgICB0aGlzLl9leHBsb3JhdGlvbklkID0gY29sbGVjdGlvbk5vZGVCYWNrZW5kT2JqZWN0LmV4cGxvcmF0aW9uX2lkO1xuICAgICAgICB0aGlzLl9leHBsb3JhdGlvblN1bW1hcnlPYmplY3QgPSBjbG9uZURlZXBfMS5kZWZhdWx0KGNvbGxlY3Rpb25Ob2RlQmFja2VuZE9iamVjdC5leHBsb3JhdGlvbl9zdW1tYXJ5KTtcbiAgICB9XG4gICAgLy8gUmV0dXJucyB0aGUgSUQgb2YgdGhlIGV4cGxvcmF0aW9uIHJlcHJlc2VudGVkIGJ5IHRoaXMgY29sbGVjdGlvbiBub2RlLlxuICAgIC8vIFRoaXMgcHJvcGVydHkgaXMgaW1tdXRhYmxlLlxuICAgIENvbGxlY3Rpb25Ob2RlLnByb3RvdHlwZS5nZXRFeHBsb3JhdGlvbklkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZXhwbG9yYXRpb25JZDtcbiAgICB9O1xuICAgIC8vIFJldHVybnMgdGhlIHRpdGxlIG9mIHRoZSBleHBsb3JhdGlvbiByZXByZXNlbnRlZCBieSB0aGlzIGNvbGxlY3Rpb24gbm9kZS5cbiAgICAvLyBUaGlzIHByb3BlcnR5IGlzIGltbXV0YWJsZS4gVGhlIHZhbHVlIHJldHVybmVkIGJ5IHRoaXMgZnVuY3Rpb24gaXNcbiAgICAvLyBudWxsIGlmIGRvZXNFeHBsb3JhdGlvbkV4aXN0KCkgcmV0dXJucyBmYWxzZS5cbiAgICBDb2xsZWN0aW9uTm9kZS5wcm90b3R5cGUuZ2V0RXhwbG9yYXRpb25UaXRsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2V4cGxvcmF0aW9uU3VtbWFyeU9iamVjdCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2V4cGxvcmF0aW9uU3VtbWFyeU9iamVjdC50aXRsZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvLyBSZXR1cm5zIHdoZXRoZXIgdGhlIGV4cGxvcmF0aW9uIHJlZmVyZW5jZWQgYnkgdGhpcyBub2RlIGlzIGtub3duIHRvIGV4aXN0XG4gICAgLy8gaW4gdGhlIGJhY2tlbmQuIFRoaXMgcHJvcGVydHkgaXMgaW1tdXRhYmxlLlxuICAgIENvbGxlY3Rpb25Ob2RlLnByb3RvdHlwZS5kb2VzRXhwbG9yYXRpb25FeGlzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2V4cGxvcmF0aW9uU3VtbWFyeU9iamVjdCAhPT0gbnVsbDtcbiAgICB9O1xuICAgIC8vIFJldHVybnMgd2hldGhlciB0aGUgZXhwbG9yYXRpb24gcmVmZXJlbmNlZCBieSB0aGlzIG5vZGUgaXMgcHJpdmF0ZSBhbmRcbiAgICAvLyBub3QgcHVibGlzaGVkLiBUaGlzIHByb3BlcnR5IGlzIGltbXV0YWJsZS4gVGhlIHZhbHVlIHJldHVybmVkIGJ5IHRoaXNcbiAgICAvLyBmdW5jdGlvbiBpcyB1bmRlZmluZWQgaWYgZG9lc0V4cGxvcmF0aW9uRXhpc3QoKSByZXR1cm5zIGZhbHNlLlxuICAgIENvbGxlY3Rpb25Ob2RlLnByb3RvdHlwZS5pc0V4cGxvcmF0aW9uUHJpdmF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2V4cGxvcmF0aW9uU3VtbWFyeU9iamVjdCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2V4cGxvcmF0aW9uU3VtbWFyeU9iamVjdC5zdGF0dXMgPT09IChhcHBfY29uc3RhbnRzXzEuQXBwQ29uc3RhbnRzLkFDVElWSVRZX1NUQVRVU19QUklWQVRFKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8vIFJldHVybnMgYSByYXcgZXhwbG9yYXRpb24gc3VtbWFyeSBvYmplY3QsIGFzIHN1cHBsaWVkIGJ5IHRoZSBiYWNrZW5kIGZvclxuICAgIC8vIGZyb250ZW5kIGV4cGxvcmF0aW9uIHN1bW1hcnkgdGlsZSBkaXNwbGF5aW5nLiBDaGFuZ2VzIHRvIHRoZSByZXR1cm5lZFxuICAgIC8vIG9iamVjdCBhcmUgbm90IHJlZmxlY3RlZCBpbiB0aGlzIGRvbWFpbiBvYmplY3QuIFRoZSB2YWx1ZSByZXR1cm5lZCBieVxuICAgIC8vIHRoaXMgZnVuY3Rpb24gaXMgbnVsbCBpZiBkb2VzRXhwbG9yYXRpb25FeGlzdCgpIHJldHVybnMgZmFsc2UuXG4gICAgLy8gVE9ETygjNzE2NSk6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiB0eXBlZFxuICAgIC8vIGFzICdhbnknIHNpbmNlICdfZXhwbG9yYXRpb25TdW1tYXJ5T2JqZWN0JyBpcyBhIGRpY3Qgb2YgdmFyeWluZyBrZXlzLlxuICAgIENvbGxlY3Rpb25Ob2RlLnByb3RvdHlwZS5nZXRFeHBsb3JhdGlvblN1bW1hcnlPYmplY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIFRPRE8oYmhlbm5pbmcpOiBUaGlzIHNob3VsZCBiZSByZXByZXNlbnRlZCBieSBhXG4gICAgICAgIC8vIGZyb250ZW5kIHN1bW1hcnkgZG9tYWluIG9iamVjdCB0aGF0IGlzIGFsc28gc2hhcmVkIHdpdGhcbiAgICAgICAgLy8gdGhlIHNlYXJjaCByZXN1bHQgYW5kIHByb2ZpbGUgcGFnZXMuXG4gICAgICAgIHJldHVybiBjbG9uZURlZXBfMS5kZWZhdWx0KHRoaXMuX2V4cGxvcmF0aW9uU3VtbWFyeU9iamVjdCk7XG4gICAgfTtcbiAgICAvLyBTZXRzIHRoZSByYXcgZXhwbG9yYXRpb24gc3VtbWFyeSBvYmplY3Qgc3RvcmVkIHdpdGhpbiB0aGlzIG5vZGUuXG4gICAgLy8gVE9ETygjNzE2NSk6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiB0eXBlZFxuICAgIC8vIGFzICdhbnknIHNpbmNlICdfZXhwbG9yYXRpb25TdW1tYXJ5T2JqZWN0JyBpcyBhIGRpY3Qgb2YgdmFyeWluZyBrZXlzLlxuICAgIENvbGxlY3Rpb25Ob2RlLnByb3RvdHlwZS5zZXRFeHBsb3JhdGlvblN1bW1hcnlPYmplY3QgPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25TdW1tYXJ5QmFja2VuZE9iamVjdCkge1xuICAgICAgICB0aGlzLl9leHBsb3JhdGlvblN1bW1hcnlPYmplY3QgPSBjbG9uZURlZXBfMS5kZWZhdWx0KGV4cGxvcmF0aW9uU3VtbWFyeUJhY2tlbmRPYmplY3QpO1xuICAgIH07XG4gICAgQ29sbGVjdGlvbk5vZGUucHJvdG90eXBlLmdldENhcGl0YWxpemVkT2JqZWN0aXZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gKHRoaXMuX2V4cGxvcmF0aW9uU3VtbWFyeU9iamVjdC5vYmplY3RpdmUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgK1xuICAgICAgICAgICAgdGhpcy5fZXhwbG9yYXRpb25TdW1tYXJ5T2JqZWN0Lm9iamVjdGl2ZS5zbGljZSgxKSk7XG4gICAgfTtcbiAgICByZXR1cm4gQ29sbGVjdGlvbk5vZGU7XG59KCkpO1xuZXhwb3J0cy5Db2xsZWN0aW9uTm9kZSA9IENvbGxlY3Rpb25Ob2RlO1xudmFyIENvbGxlY3Rpb25Ob2RlT2JqZWN0RmFjdG9yeSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBDb2xsZWN0aW9uTm9kZU9iamVjdEZhY3RvcnkoKSB7XG4gICAgfVxuICAgIC8vIFN0YXRpYyBjbGFzcyBtZXRob2RzLiBOb3RlIHRoYXQgXCJ0aGlzXCIgaXMgbm90IGF2YWlsYWJsZSBpbiBzdGF0aWNcbiAgICAvLyBjb250ZXh0cy4gVGhpcyBmdW5jdGlvbiB0YWtlcyBhIEpTT04gb2JqZWN0IHdoaWNoIHJlcHJlc2VudHMgYSBiYWNrZW5kXG4gICAgLy8gY29sbGVjdGlvbiBub2RlIHB5dGhvbiBkaWN0LlxuICAgIC8vIFRPRE8oIzcxNzYpOiBSZXBsYWNlICdhbnknIHdpdGggdGhlIGV4YWN0IHR5cGUuIFRoaXMgaGFzIGJlZW4ga2VwdCBhc1xuICAgIC8vICdhbnknIGJlY2F1c2UgJ2NvbGxlY3Rpb25Ob2RlQmFja2VuZE9iamVjdCcgaXMgYSBkaWN0IHdpdGggdW5kZXJzY29yZV9jYXNlZFxuICAgIC8vIGtleXMgd2hpY2ggZ2l2ZSB0c2xpbnQgZXJyb3JzIGFnYWluc3QgdW5kZXJzY29yZV9jYXNpbmcgaW4gZmF2b3Igb2ZcbiAgICAvLyBjYW1lbENhc2luZy5cbiAgICBDb2xsZWN0aW9uTm9kZU9iamVjdEZhY3RvcnkucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uTm9kZUJhY2tlbmRPYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb2xsZWN0aW9uTm9kZShjb2xsZWN0aW9uTm9kZUJhY2tlbmRPYmplY3QpO1xuICAgIH07XG4gICAgQ29sbGVjdGlvbk5vZGVPYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGVGcm9tRXhwbG9yYXRpb25JZCA9IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZSh7XG4gICAgICAgICAgICBleHBsb3JhdGlvbl9pZDogZXhwbG9yYXRpb25JZCxcbiAgICAgICAgICAgIGV4cGxvcmF0aW9uX3N1bW1hcnk6IG51bGxcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBDb2xsZWN0aW9uTm9kZU9iamVjdEZhY3RvcnkgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLkluamVjdGFibGUoe1xuICAgICAgICAgICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG4gICAgICAgIH0pXG4gICAgXSwgQ29sbGVjdGlvbk5vZGVPYmplY3RGYWN0b3J5KTtcbiAgICByZXR1cm4gQ29sbGVjdGlvbk5vZGVPYmplY3RGYWN0b3J5O1xufSgpKTtcbmV4cG9ydHMuQ29sbGVjdGlvbk5vZGVPYmplY3RGYWN0b3J5ID0gQ29sbGVjdGlvbk5vZGVPYmplY3RGYWN0b3J5O1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnQ29sbGVjdGlvbk5vZGVPYmplY3RGYWN0b3J5Jywgc3RhdGljXzEuZG93bmdyYWRlSW5qZWN0YWJsZShDb2xsZWN0aW9uTm9kZU9iamVjdEZhY3RvcnkpKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG52YXIgX19tZXRhZGF0YSA9ICh0aGlzICYmIHRoaXMuX19tZXRhZGF0YSkgfHwgZnVuY3Rpb24gKGssIHYpIHtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QubWV0YWRhdGEgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QubWV0YWRhdGEoaywgdik7XG59O1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIGFuZCBtdXRhdGluZyBpbnN0YW5jZXMgb2YgZnJvbnRlbmRcbiAqIGNvbGxlY3Rpb24gZG9tYWluIG9iamVjdHMuXG4gKi9cbnZhciBjbG9uZURlZXBfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwibG9kYXNoL2Nsb25lRGVlcFwiKSk7XG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgQ29sbGVjdGlvbk5vZGVPYmplY3RGYWN0b3J5XzEgPSByZXF1aXJlKFwiZG9tYWluL2NvbGxlY3Rpb24vQ29sbGVjdGlvbk5vZGVPYmplY3RGYWN0b3J5XCIpO1xudmFyIENvbGxlY3Rpb24gPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgLy8gVE9ETygjNzE3Nik6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiBrZXB0IGFzXG4gICAgLy8gJ2FueScgYmVjYXVzZSAnY29sbGVjdGlvbkJhY2tlbmRPYmplY3QnIGlzIGEgZGljdCB3aXRoIHVuZGVyc2NvcmVfY2FzZWRcbiAgICAvLyBrZXlzIHdoaWNoIGdpdmUgdHNsaW50IGVycm9ycyBhZ2FpbnN0IHVuZGVyc2NvcmVfY2FzaW5nIGluIGZhdm9yIG9mXG4gICAgLy8gY2FtZWxDYXNpbmcuXG4gICAgZnVuY3Rpb24gQ29sbGVjdGlvbihjb2xsZWN0aW9uQmFja2VuZE9iamVjdCwgY29sbGVjdGlvbk5vZGVPYmplY3RGYWN0b3J5KSB7XG4gICAgICAgIHRoaXMuX2lkID0gY29sbGVjdGlvbkJhY2tlbmRPYmplY3QuaWQ7XG4gICAgICAgIHRoaXMuX3RpdGxlID0gY29sbGVjdGlvbkJhY2tlbmRPYmplY3QudGl0bGU7XG4gICAgICAgIHRoaXMuX29iamVjdGl2ZSA9IGNvbGxlY3Rpb25CYWNrZW5kT2JqZWN0Lm9iamVjdGl2ZTtcbiAgICAgICAgdGhpcy5fbGFuZ3VhZ2VDb2RlID0gY29sbGVjdGlvbkJhY2tlbmRPYmplY3QubGFuZ3VhZ2VfY29kZTtcbiAgICAgICAgdGhpcy5fdGFncyA9IGNvbGxlY3Rpb25CYWNrZW5kT2JqZWN0LnRhZ3M7XG4gICAgICAgIHRoaXMuX2NhdGVnb3J5ID0gY29sbGVjdGlvbkJhY2tlbmRPYmplY3QuY2F0ZWdvcnk7XG4gICAgICAgIHRoaXMuX3ZlcnNpb24gPSBjb2xsZWN0aW9uQmFja2VuZE9iamVjdC52ZXJzaW9uO1xuICAgICAgICB0aGlzLl9ub2RlcyA9IFtdO1xuICAgICAgICAvLyBUaGlzIG1hcCBhY3RzIGFzIGEgZmFzdCB3YXkgb2YgbG9va2luZyB1cCBhIGNvbGxlY3Rpb24gbm9kZSBmb3IgYSBnaXZlblxuICAgICAgICAvLyBleHBsb3JhdGlvbiBJRC5cbiAgICAgICAgdGhpcy5fZXhwbG9yYXRpb25JZFRvTm9kZUluZGV4TWFwID0ge307XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29sbGVjdGlvbkJhY2tlbmRPYmplY3Qubm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuX25vZGVzW2ldID0gY29sbGVjdGlvbk5vZGVPYmplY3RGYWN0b3J5LmNyZWF0ZShjb2xsZWN0aW9uQmFja2VuZE9iamVjdC5ub2Rlc1tpXSk7XG4gICAgICAgICAgICB2YXIgZXhwbG9yYXRpb25JZCA9IHRoaXMuX25vZGVzW2ldLmdldEV4cGxvcmF0aW9uSWQoKTtcbiAgICAgICAgICAgIHRoaXMuX2V4cGxvcmF0aW9uSWRUb05vZGVJbmRleE1hcFtleHBsb3JhdGlvbklkXSA9IGk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgQ29sbGVjdGlvbi5wcm90b3R5cGUuZ2V0SWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pZDtcbiAgICB9O1xuICAgIENvbGxlY3Rpb24ucHJvdG90eXBlLmdldFRpdGxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdGl0bGU7XG4gICAgfTtcbiAgICBDb2xsZWN0aW9uLnByb3RvdHlwZS5zZXRUaXRsZSA9IGZ1bmN0aW9uICh0aXRsZSkge1xuICAgICAgICB0aGlzLl90aXRsZSA9IHRpdGxlO1xuICAgIH07XG4gICAgQ29sbGVjdGlvbi5wcm90b3R5cGUuZ2V0Q2F0ZWdvcnkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jYXRlZ29yeTtcbiAgICB9O1xuICAgIENvbGxlY3Rpb24ucHJvdG90eXBlLnNldENhdGVnb3J5ID0gZnVuY3Rpb24gKGNhdGVnb3J5KSB7XG4gICAgICAgIHRoaXMuX2NhdGVnb3J5ID0gY2F0ZWdvcnk7XG4gICAgfTtcbiAgICBDb2xsZWN0aW9uLnByb3RvdHlwZS5nZXRPYmplY3RpdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9vYmplY3RpdmU7XG4gICAgfTtcbiAgICBDb2xsZWN0aW9uLnByb3RvdHlwZS5zZXRPYmplY3RpdmUgPSBmdW5jdGlvbiAob2JqZWN0aXZlKSB7XG4gICAgICAgIHRoaXMuX29iamVjdGl2ZSA9IG9iamVjdGl2ZTtcbiAgICB9O1xuICAgIENvbGxlY3Rpb24ucHJvdG90eXBlLmdldExhbmd1YWdlQ29kZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xhbmd1YWdlQ29kZTtcbiAgICB9O1xuICAgIENvbGxlY3Rpb24ucHJvdG90eXBlLnNldExhbmd1YWdlQ29kZSA9IGZ1bmN0aW9uIChsYW5ndWFnZUNvZGUpIHtcbiAgICAgICAgdGhpcy5fbGFuZ3VhZ2VDb2RlID0gbGFuZ3VhZ2VDb2RlO1xuICAgIH07XG4gICAgQ29sbGVjdGlvbi5wcm90b3R5cGUuZ2V0VGFncyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3RhZ3M7XG4gICAgfTtcbiAgICBDb2xsZWN0aW9uLnByb3RvdHlwZS5zZXRUYWdzID0gZnVuY3Rpb24gKHRhZ3MpIHtcbiAgICAgICAgdGhpcy5fdGFncyA9IHRhZ3M7XG4gICAgfTtcbiAgICBDb2xsZWN0aW9uLnByb3RvdHlwZS5nZXRWZXJzaW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdmVyc2lvbjtcbiAgICB9O1xuICAgIC8vIEFkZHMgYSBuZXcgZnJvbnRlbmQgY29sbGVjdGlvbiBub2RlIGRvbWFpbiBvYmplY3QgdG8gdGhpcyBjb2xsZWN0aW9uLlxuICAgIC8vIFRoaXMgd2lsbCByZXR1cm4gdHJ1ZSBpZiB0aGUgbm9kZSB3YXMgc3VjY2Vzc2Z1bGx5IGFkZGVkLCBvciBmYWxzZSBpZiB0aGVcbiAgICAvLyBnaXZlbiBjb2xsZWN0aW9uIG5vZGUgcmVmZXJlbmNlcyBhbiBleHBsb3JhdGlvbiBJRCBhbHJlYWR5IHJlZmVyZW5jZWQgYnlcbiAgICAvLyBhbm90aGVyIG5vZGUgd2l0aGluIHRoaXMgY29sbGVjdGlvbi4gQ2hhbmdlcyB0byB0aGUgcHJvdmlkZWQgb2JqZWN0IHdpbGxcbiAgICAvLyBiZSByZWZsZWN0ZWQgaW4gdGhpcyBjb2xsZWN0aW9uLlxuICAgIENvbGxlY3Rpb24ucHJvdG90eXBlLmFkZENvbGxlY3Rpb25Ob2RlID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25Ob2RlT2JqZWN0KSB7XG4gICAgICAgIHZhciBleHBsb3JhdGlvbklkID0gY29sbGVjdGlvbk5vZGVPYmplY3QuZ2V0RXhwbG9yYXRpb25JZCgpO1xuICAgICAgICBpZiAoIXRoaXMuX2V4cGxvcmF0aW9uSWRUb05vZGVJbmRleE1hcC5oYXNPd25Qcm9wZXJ0eShleHBsb3JhdGlvbklkKSkge1xuICAgICAgICAgICAgdGhpcy5fZXhwbG9yYXRpb25JZFRvTm9kZUluZGV4TWFwW2V4cGxvcmF0aW9uSWRdID0gdGhpcy5fbm9kZXMubGVuZ3RoO1xuICAgICAgICAgICAgdGhpcy5fbm9kZXMucHVzaChjb2xsZWN0aW9uTm9kZU9iamVjdCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICAvLyBUaGlzIHdpbGwgc3dhcCAyIG5vZGVzIG9mIHRoZSBjb2xsZWN0aW9uIGFuZCB1cGRhdGUgdGhlIGV4cGxvcmF0aW9uIGlkXG4gICAgLy8gdG8gbm9kZSBpbmRleCBtYXAgYWNjb3JkaW5nbHkuXG4gICAgQ29sbGVjdGlvbi5wcm90b3R5cGUuc3dhcENvbGxlY3Rpb25Ob2RlcyA9IGZ1bmN0aW9uIChmaXJzdEluZGV4LCBzZWNvbmRJbmRleCkge1xuICAgICAgICBpZiAoZmlyc3RJbmRleCA+PSB0aGlzLl9ub2Rlcy5sZW5ndGggfHxcbiAgICAgICAgICAgIHNlY29uZEluZGV4ID49IHRoaXMuX25vZGVzLmxlbmd0aCB8fFxuICAgICAgICAgICAgZmlyc3RJbmRleCA8IDAgfHxcbiAgICAgICAgICAgIHNlY29uZEluZGV4IDwgMCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBmaXJzdEluZGV4SWQgPSB0aGlzLl9ub2Rlc1tmaXJzdEluZGV4XS5nZXRFeHBsb3JhdGlvbklkKCk7XG4gICAgICAgIHZhciBzZWNvbmRJbmRleElkID0gdGhpcy5fbm9kZXNbc2Vjb25kSW5kZXhdLmdldEV4cGxvcmF0aW9uSWQoKTtcbiAgICAgICAgdmFyIHRlbXAgPSB0aGlzLl9ub2Rlc1tmaXJzdEluZGV4XTtcbiAgICAgICAgdGhpcy5fbm9kZXNbZmlyc3RJbmRleF0gPSB0aGlzLl9ub2Rlc1tzZWNvbmRJbmRleF07XG4gICAgICAgIHRoaXMuX25vZGVzW3NlY29uZEluZGV4XSA9IHRlbXA7XG4gICAgICAgIHRoaXMuX2V4cGxvcmF0aW9uSWRUb05vZGVJbmRleE1hcFtmaXJzdEluZGV4SWRdID0gc2Vjb25kSW5kZXg7XG4gICAgICAgIHRoaXMuX2V4cGxvcmF0aW9uSWRUb05vZGVJbmRleE1hcFtzZWNvbmRJbmRleElkXSA9IGZpcnN0SW5kZXg7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgLy8gQXR0ZW1wdHMgdG8gcmVtb3ZlIGEgY29sbGVjdGlvbiBub2RlIGZyb20gdGhpcyBjb2xsZWN0aW9uIGdpdmVuIHRoZVxuICAgIC8vIHNwZWNpZmllZCBleHBsb3JhdGlvbiBJRC4gUmV0dXJucyB3aGV0aGVyIHRoZSBjb2xsZWN0aW9uIG5vZGUgd2FzXG4gICAgLy8gcmVtb3ZlZCwgd2hpY2ggZGVwZW5kcyBvbiB3aGV0aGVyIGFueSBjb2xsZWN0aW9uIG5vZGVzIHJlZmVyZW5jZSB0aGVcbiAgICAvLyBnaXZlbiBleHBsb3JhdGlvbiBJRC5cbiAgICBDb2xsZWN0aW9uLnByb3RvdHlwZS5kZWxldGVDb2xsZWN0aW9uTm9kZSA9IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgIC8vIFRPRE8oYmhlbm5pbmcpOiBDb25zaWRlciB3aGV0aGVyIHRoZSByZW1vdmVkIGNvbGxlY3Rpb24gbm9kZSBzaG91bGQgYmVcbiAgICAgICAgLy8gaW52YWxpZGF0ZWQsIGxlYWRpbmcgdG8gZXJyb3JzIGlmIGl0cyBtdXRhdGVkIGluIHRoZSBmdXR1cmUuIFRoaXMgbWlnaHRcbiAgICAgICAgLy8gaGVscCBwcmV2ZW50IGJ1Z3Mgd2hlcmUgY29sbGVjdGlvbiBub2RlcyBhcmUgc3RvcmVkIGFuZCBjaGFuZ2VkIGFmdGVyXG4gICAgICAgIC8vIGJlaW5nIHJlbW92ZWQgZnJvbSBhIGNvbGxlY3Rpb24uXG4gICAgICAgIGlmICh0aGlzLl9leHBsb3JhdGlvbklkVG9Ob2RlSW5kZXhNYXAuaGFzT3duUHJvcGVydHkoZXhwbG9yYXRpb25JZCkpIHtcbiAgICAgICAgICAgIHZhciBub2RlSW5kZXggPSB0aGlzLl9leHBsb3JhdGlvbklkVG9Ob2RlSW5kZXhNYXBbZXhwbG9yYXRpb25JZF07XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fZXhwbG9yYXRpb25JZFRvTm9kZUluZGV4TWFwW2V4cGxvcmF0aW9uSWRdO1xuICAgICAgICAgICAgdGhpcy5fbm9kZXMuc3BsaWNlKG5vZGVJbmRleCwgMSk7XG4gICAgICAgICAgICAvLyBVcGRhdGUgYWxsIG5vZGUgZXhwbG9yYXRpb24gSUQgbWFwIHJlZmVyZW5jZXMgcGFzdCB0aGUgcmVtb3ZlZCBpbmRleFxuICAgICAgICAgICAgLy8gdG8gZW5zdXJlIHRoZXkgYXJlIHN0aWxsIHBvaW50aW5nIHRvIGNvcnJlY3QgaW5kZXhlcy5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBub2RlSW5kZXg7IGkgPCB0aGlzLl9ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBub2RlRXhwSWQgPSB0aGlzLl9ub2Rlc1tpXS5nZXRFeHBsb3JhdGlvbklkKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZXhwbG9yYXRpb25JZFRvTm9kZUluZGV4TWFwW25vZGVFeHBJZF0gPSBpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgLy8gRGVsZXRlcyBhbGwgY29sbGVjdGlvbiBub2RlcyB3aXRoaW4gdGhpcyBjb2xsZWN0aW9uLlxuICAgIENvbGxlY3Rpb24ucHJvdG90eXBlLmNsZWFyQ29sbGVjdGlvbk5vZGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBDbGVhcnMgdGhlIGV4aXN0aW5nIGFycmF5IGluLXBsYWNlLCBzaW5jZSB0aGVyZSBtYXkgYmUgQW5ndWxhciBiaW5kaW5nc1xuICAgICAgICAvLyB0byB0aGlzIGFycmF5IGFuZCB0aGV5IGNhbid0IGJlIHJlc2V0IHRvIGVtcHR5IGFycmF5cy5TZWUgZm9yIGNvbnRleHQ6XG4gICAgICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEyMzIwNDZcbiAgICAgICAgdGhpcy5fbm9kZXMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5fZXhwbG9yYXRpb25JZFRvTm9kZUluZGV4TWFwID0ge307XG4gICAgfTtcbiAgICAvLyBSZXR1cm5zIHdoZXRoZXIgYW55IGNvbGxlY3Rpb24gbm9kZXMgaW4gdGhpcyBjb2xsZWN0aW9uIHJlZmVyZW5jZSB0aGVcbiAgICAvLyBwcm92aWRlZCBleHBsb3JhdGlvbiBJRC5cbiAgICBDb2xsZWN0aW9uLnByb3RvdHlwZS5jb250YWluc0NvbGxlY3Rpb25Ob2RlID0gZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2V4cGxvcmF0aW9uSWRUb05vZGVJbmRleE1hcC5oYXNPd25Qcm9wZXJ0eShleHBsb3JhdGlvbklkKTtcbiAgICB9O1xuICAgIC8vIFJldHVybnMgYSBjb2xsZWN0aW9uIG5vZGUgZ2l2ZW4gYW4gZXhwbG9yYXRpb24gSUQsIG9yIHVuZGVmaW5lZCBpZiBub1xuICAgIC8vIGNvbGxlY3Rpb24gbm9kZSB3aXRoaW4gdGhpcyBjb2xsZWN0aW9uIHJlZmVyZW5jZXMgdGhlIHByb3ZpZGVkXG4gICAgLy8gZXhwbG9yYXRpb24gSUQuXG4gICAgQ29sbGVjdGlvbi5wcm90b3R5cGUuZ2V0Q29sbGVjdGlvbk5vZGVCeUV4cGxvcmF0aW9uSWQgPSBmdW5jdGlvbiAoZXhwSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX25vZGVzW3RoaXMuX2V4cGxvcmF0aW9uSWRUb05vZGVJbmRleE1hcFtleHBJZF1dO1xuICAgIH07XG4gICAgLy8gUmV0dXJucyBhIGxpc3Qgb2YgY29sbGVjdGlvbiBub2RlIG9iamVjdHMgZm9yIHRoaXMgY29sbGVjdGlvbi4gQ2hhbmdlcyB0b1xuICAgIC8vIG5vZGVzIHJldHVybmVkIGJ5IHRoaXMgZnVuY3Rpb24gd2lsbCBiZSByZWZsZWN0ZWQgaW4gdGhlIGNvbGxlY3Rpb24uXG4gICAgLy8gQ2hhbmdlcyB0byB0aGUgbGlzdCBpdHNlbGYgd2lsbCBub3QgYmUgcmVmbGVjdGVkIGluIHRoaXMgY29sbGVjdGlvbi5cbiAgICBDb2xsZWN0aW9uLnByb3RvdHlwZS5nZXRDb2xsZWN0aW9uTm9kZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ub2Rlcy5zbGljZSgpO1xuICAgIH07XG4gICAgQ29sbGVjdGlvbi5wcm90b3R5cGUuZ2V0Q29sbGVjdGlvbk5vZGVDb3VudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX25vZGVzLmxlbmd0aDtcbiAgICB9O1xuICAgIC8vIFJldHVybnMgdGhlIHJlZmVyZW5jZSB0byB0aGUgaW50ZXJuYWwgbm9kZXMgYXJyYXk7IHRoaXMgZnVuY3Rpb24gaXMgb25seVxuICAgIC8vIG1lYW50IHRvIGJlIHVzZWQgZm9yIEFuZ3VsYXIgYmluZGluZ3MgYW5kIHNob3VsZCBuZXZlciBiZSB1c2VkIGluIGNvZGUuXG4gICAgLy8gUGxlYXNlIHVzZSBnZXRDb2xsZWN0aW9uTm9kZXMoKSBhbmQgcmVsYXRlZCBmdW5jdGlvbnMsIGluc3RlYWQuIFBsZWFzZVxuICAgIC8vIGFsc28gYmUgYXdhcmUgdGhpcyBleHBvc2VzIGludGVybmFsIHN0YXRlIG9mIHRoZSBjb2xsZWN0aW9uIGRvbWFpblxuICAgIC8vIG9iamVjdCwgc28gY2hhbmdlcyB0byB0aGUgYXJyYXkgaXRzZWxmIG1heSBpbnRlcm5hbGx5IGJyZWFrIHRoZSBkb21haW5cbiAgICAvLyBvYmplY3QuXG4gICAgQ29sbGVjdGlvbi5wcm90b3R5cGUuZ2V0QmluZGFibGVDb2xsZWN0aW9uTm9kZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ub2RlcztcbiAgICB9O1xuICAgIC8vIFJldHVybnMgdGhlIGNvbGxlY3Rpb24gbm9kZSB3aGljaCBpcyBpbml0aWFsbHkgYXZhaWxhYmxlIHRvIHBsYXlcbiAgICAvLyBieSB0aGUgcGxheWVyLlxuICAgIENvbGxlY3Rpb24ucHJvdG90eXBlLmdldFN0YXJ0aW5nQ29sbGVjdGlvbk5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLl9ub2Rlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX25vZGVzWzBdO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvLyBSZXR1cm5zIGEgbGlzdCBvZiBhbGwgZXhwbG9yYXRpb24gSURzIHJlZmVyZW5jZWQgYnkgdGhpcyBjb2xsZWN0aW9uLlxuICAgIC8vIENoYW5nZXMgdG8gdGhlIGxpc3QgaXRzZWxmIHdpbGwgbm90IGJlIHJlZmxlY3RlZCBpbiB0aGlzIGNvbGxlY3Rpb24uXG4gICAgQ29sbGVjdGlvbi5wcm90b3R5cGUuZ2V0RXhwbG9yYXRpb25JZHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBjbG9uZURlZXBfMS5kZWZhdWx0KE9iamVjdC5rZXlzKHRoaXMuX2V4cGxvcmF0aW9uSWRUb05vZGVJbmRleE1hcCkpO1xuICAgIH07XG4gICAgLy8gUmVhc3NpZ25zIGFsbCB2YWx1ZXMgd2l0aGluIHRoaXMgY29sbGVjdGlvbiB0byBtYXRjaCB0aGUgZXhpc3RpbmdcbiAgICAvLyBjb2xsZWN0aW9uLiBUaGlzIGlzIHBlcmZvcm1lZCBhcyBhIGRlZXAgY29weSBzdWNoIHRoYXQgbm9uZSBvZiB0aGVcbiAgICAvLyBpbnRlcm5hbCwgYmluZGFibGUgb2JqZWN0cyBhcmUgY2hhbmdlZCB3aXRoaW4gdGhpcyBjb2xsZWN0aW9uLiBOb3RlIHRoYXRcbiAgICAvLyB0aGUgY29sbGVjdGlvbiBub2RlcyB3aXRoaW4gdGhpcyBjb2xsZWN0aW9uIHdpbGwgYmUgY29tcGxldGVseSByZWRlZmluZWRcbiAgICAvLyBhcyBjb3BpZXMgZnJvbSB0aGUgc3BlY2lmaWVkIGNvbGxlY3Rpb24uXG4gICAgQ29sbGVjdGlvbi5wcm90b3R5cGUuY29weUZyb21Db2xsZWN0aW9uID0gZnVuY3Rpb24gKG90aGVyQ29sbGVjdGlvbikge1xuICAgICAgICB0aGlzLl9pZCA9IG90aGVyQ29sbGVjdGlvbi5nZXRJZCgpO1xuICAgICAgICB0aGlzLnNldFRpdGxlKG90aGVyQ29sbGVjdGlvbi5nZXRUaXRsZSgpKTtcbiAgICAgICAgdGhpcy5zZXRDYXRlZ29yeShvdGhlckNvbGxlY3Rpb24uZ2V0Q2F0ZWdvcnkoKSk7XG4gICAgICAgIHRoaXMuc2V0T2JqZWN0aXZlKG90aGVyQ29sbGVjdGlvbi5nZXRPYmplY3RpdmUoKSk7XG4gICAgICAgIHRoaXMuc2V0TGFuZ3VhZ2VDb2RlKG90aGVyQ29sbGVjdGlvbi5nZXRMYW5ndWFnZUNvZGUoKSk7XG4gICAgICAgIHRoaXMuc2V0VGFncyhvdGhlckNvbGxlY3Rpb24uZ2V0VGFncygpKTtcbiAgICAgICAgdGhpcy5fdmVyc2lvbiA9IG90aGVyQ29sbGVjdGlvbi5nZXRWZXJzaW9uKCk7XG4gICAgICAgIHRoaXMuY2xlYXJDb2xsZWN0aW9uTm9kZXMoKTtcbiAgICAgICAgdmFyIG5vZGVzID0gb3RoZXJDb2xsZWN0aW9uLmdldENvbGxlY3Rpb25Ob2RlcygpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmFkZENvbGxlY3Rpb25Ob2RlKGNsb25lRGVlcF8xLmRlZmF1bHQobm9kZXNbaV0pKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIENvbGxlY3Rpb247XG59KCkpO1xuZXhwb3J0cy5Db2xsZWN0aW9uID0gQ29sbGVjdGlvbjtcbnZhciBDb2xsZWN0aW9uT2JqZWN0RmFjdG9yeSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBDb2xsZWN0aW9uT2JqZWN0RmFjdG9yeShjb2xsZWN0aW9uTm9kZU9iamVjdEZhY3RvcnkpIHtcbiAgICAgICAgdGhpcy5jb2xsZWN0aW9uTm9kZU9iamVjdEZhY3RvcnkgPSBjb2xsZWN0aW9uTm9kZU9iamVjdEZhY3Rvcnk7XG4gICAgfVxuICAgIC8vIFRPRE8oIzcxNzYpOiBSZXBsYWNlICdhbnknIHdpdGggdGhlIGV4YWN0IHR5cGUuIFRoaXMgaGFzIGJlZW4ga2VwdCBhc1xuICAgIC8vICdhbnknIGJlY2F1c2UgJ2NvbGxlY3Rpb25CYWNrZW5kT2JqZWN0JyBpcyBhIGRpY3Qgd2l0aCB1bmRlcnNjb3JlX2Nhc2VkXG4gICAgLy8ga2V5cyB3aGljaCBnaXZlIHRzbGludCBlcnJvcnMgYWdhaW5zdCB1bmRlcnNjb3JlX2Nhc2luZyBpbiBmYXZvciBvZlxuICAgIC8vIGNhbWVsQ2FzaW5nLlxuICAgIENvbGxlY3Rpb25PYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiAoY29sbGVjdGlvbkJhY2tlbmRPYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb2xsZWN0aW9uKGNvbGxlY3Rpb25CYWNrZW5kT2JqZWN0LCB0aGlzLmNvbGxlY3Rpb25Ob2RlT2JqZWN0RmFjdG9yeSk7XG4gICAgfTtcbiAgICAvLyBDcmVhdGUgYSBuZXcsIGVtcHR5IGNvbGxlY3Rpb24uIFRoaXMgaXMgbm90IGd1YXJhbnRlZWQgdG8gcGFzcyB2YWxpZGF0aW9uXG4gICAgLy8gdGVzdHMuXG4gICAgQ29sbGVjdGlvbk9iamVjdEZhY3RvcnkucHJvdG90eXBlLmNyZWF0ZUVtcHR5Q29sbGVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb2xsZWN0aW9uKHtcbiAgICAgICAgICAgIG5vZGVzOiBbXSxcbiAgICAgICAgfSwgdGhpcy5jb2xsZWN0aW9uTm9kZU9iamVjdEZhY3RvcnkpO1xuICAgIH07XG4gICAgdmFyIF9hO1xuICAgIENvbGxlY3Rpb25PYmplY3RGYWN0b3J5ID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5JbmplY3RhYmxlKHtcbiAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290J1xuICAgICAgICB9KSxcbiAgICAgICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFt0eXBlb2YgKF9hID0gdHlwZW9mIENvbGxlY3Rpb25Ob2RlT2JqZWN0RmFjdG9yeV8xLkNvbGxlY3Rpb25Ob2RlT2JqZWN0RmFjdG9yeSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBDb2xsZWN0aW9uTm9kZU9iamVjdEZhY3RvcnlfMS5Db2xsZWN0aW9uTm9kZU9iamVjdEZhY3RvcnkpID09PSBcImZ1bmN0aW9uXCIgPyBfYSA6IE9iamVjdF0pXG4gICAgXSwgQ29sbGVjdGlvbk9iamVjdEZhY3RvcnkpO1xuICAgIHJldHVybiBDb2xsZWN0aW9uT2JqZWN0RmFjdG9yeTtcbn0oKSk7XG5leHBvcnRzLkNvbGxlY3Rpb25PYmplY3RGYWN0b3J5ID0gQ29sbGVjdGlvbk9iamVjdEZhY3Rvcnk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdDb2xsZWN0aW9uT2JqZWN0RmFjdG9yeScsIHN0YXRpY18xLmRvd25ncmFkZUluamVjdGFibGUoQ29sbGVjdGlvbk9iamVjdEZhY3RvcnkpKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0byByZXRyaWV2ZSByZWFkIG9ubHkgaW5mb3JtYXRpb25cbiAqIGFib3V0IGNvbGxlY3Rpb25zIGZyb20gdGhlIGJhY2tlbmQuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbi8vIFRPRE8oYmhlbm5pbmcpOiBGb3IgcHJldmlldyBtb2RlLCB0aGlzIHNlcnZpY2Ugc2hvdWxkIGJlIHJlcGxhY2VkIGJ5IGFcbi8vIHNlcGFyYXRlIENvbGxlY3Rpb25EYXRhU2VydmljZSBpbXBsZW1lbnRhdGlvbiB3aGljaCByZXR1cm5zIGEgbG9jYWwgY29weSBvZlxuLy8gdGhlIGNvbGxlY3Rpb24gaW5zdGVhZC4gVGhpcyBmaWxlIHNob3VsZCBub3QgYmUgaW5jbHVkZWQgb24gdGhlIHBhZ2UgaW4gdGhhdFxuLy8gc2NlbmFyaW8uXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdSZWFkT25seUNvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZScsIFtcbiAgICAnJGh0dHAnLCAnJHEnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgICdDT0xMRUNUSU9OX0RBVEFfVVJMX1RFTVBMQVRFJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsICRxLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgQ09MTEVDVElPTl9EQVRBX1VSTF9URU1QTEFURSkge1xuICAgICAgICAvLyBNYXBzIHByZXZpb3VzbHkgbG9hZGVkIGNvbGxlY3Rpb25zIHRvIHRoZWlyIElEcy5cbiAgICAgICAgdmFyIF9jb2xsZWN0aW9uQ2FjaGUgPSBbXTtcbiAgICAgICAgdmFyIF9jb2xsZWN0aW9uRGV0YWlsc0NhY2hlID0gW107XG4gICAgICAgIHZhciBfZmV0Y2hDb2xsZWN0aW9uID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgY29sbGVjdGlvbkRhdGFVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChDT0xMRUNUSU9OX0RBVEFfVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgY29sbGVjdGlvbl9pZDogY29sbGVjdGlvbklkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICRodHRwLmdldChjb2xsZWN0aW9uRGF0YVVybCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29sbGVjdGlvbiA9IGFuZ3VsYXIuY29weShyZXNwb25zZS5kYXRhLmNvbGxlY3Rpb24pO1xuICAgICAgICAgICAgICAgIF9jYWNoZUNvbGxlY3Rpb25EZXRhaWxzKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKGNvbGxlY3Rpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvclJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2NhY2hlQ29sbGVjdGlvbkRldGFpbHMgPSBmdW5jdGlvbiAoZGV0YWlscykge1xuICAgICAgICAgICAgX2NvbGxlY3Rpb25EZXRhaWxzQ2FjaGVbZGV0YWlscy5jb2xsZWN0aW9uLmlkXSA9IHtcbiAgICAgICAgICAgICAgICBjYW5FZGl0OiBkZXRhaWxzLmNhbl9lZGl0LFxuICAgICAgICAgICAgICAgIHRpdGxlOiBkZXRhaWxzLmNvbGxlY3Rpb24udGl0bGUsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2lzQ2FjaGVkID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCkge1xuICAgICAgICAgICAgcmV0dXJuIF9jb2xsZWN0aW9uQ2FjaGUuaGFzT3duUHJvcGVydHkoY29sbGVjdGlvbklkKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0cmlldmVzIGEgY29sbGVjdGlvbiBmcm9tIHRoZSBiYWNrZW5kIGdpdmVuIGEgY29sbGVjdGlvbiBJRC4gVGhpc1xuICAgICAgICAgICAgICogcmV0dXJucyBhIHByb21pc2Ugb2JqZWN0IHRoYXQgYWxsb3dzIGEgc3VjY2VzcyBhbmQgcmVqZWN0aW9uIGNhbGxiYWNrc1xuICAgICAgICAgICAgICogdG8gYmUgcmVnaXN0ZXJlZC4gSWYgdGhlIGNvbGxlY3Rpb24gaXMgc3VjY2Vzc2Z1bGx5IGxvYWRlZCBhbmQgYVxuICAgICAgICAgICAgICogc3VjY2VzcyBjYWxsYmFjayBmdW5jdGlvbiBpcyBwcm92aWRlZCB0byB0aGUgcHJvbWlzZSBvYmplY3QsIHRoZVxuICAgICAgICAgICAgICogc3VjY2VzcyBjYWxsYmFjayBpcyBjYWxsZWQgd2l0aCB0aGUgY29sbGVjdGlvbiBwYXNzZWQgaW4gYXMgYVxuICAgICAgICAgICAgICogcGFyYW1ldGVyLiBJZiBzb21ldGhpbmcgZ29lcyB3cm9uZyB3aGlsZSB0cnlpbmcgdG8gZmV0Y2ggdGhlXG4gICAgICAgICAgICAgKiBjb2xsZWN0aW9uLCB0aGUgcmVqZWN0aW9uIGNhbGxiYWNrIGlzIGNhbGxlZCBpbnN0ZWFkLCBpZiBwcmVzZW50LiBUaGVcbiAgICAgICAgICAgICAqIHJlamVjdGlvbiBjYWxsYmFjayBmdW5jdGlvbiBpcyBwYXNzZWQgdGhlIGVycm9yIHRoYXQgb2NjdXJyZWQgYW5kIHRoZVxuICAgICAgICAgICAgICogY29sbGVjdGlvbiBJRC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZmV0Y2hDb2xsZWN0aW9uOiBmdW5jdGlvbiAoY29sbGVjdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgX2ZldGNoQ29sbGVjdGlvbihjb2xsZWN0aW9uSWQsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBCZWhhdmVzIGluIHRoZSBleGFjdCBzYW1lIHdheSBhcyBmZXRjaENvbGxlY3Rpb24gKGluY2x1ZGluZyBjYWxsYmFja1xuICAgICAgICAgICAgICogYmVoYXZpb3IgYW5kIHJldHVybmluZyBhIHByb21pc2Ugb2JqZWN0KSwgZXhjZXB0IHRoaXMgZnVuY3Rpb24gd2lsbFxuICAgICAgICAgICAgICogYXR0ZW1wdCB0byBzZWUgd2hldGhlciB0aGUgZ2l2ZW4gY29sbGVjdGlvbiBoYXMgYWxyZWFkeSBiZWVuIGxvYWRlZC4gSWZcbiAgICAgICAgICAgICAqIGl0IGhhcyBub3QgeWV0IGJlZW4gbG9hZGVkLCBpdCB3aWxsIGZldGNoIHRoZSBjb2xsZWN0aW9uIGZyb20gdGhlXG4gICAgICAgICAgICAgKiBiYWNrZW5kLiBJZiBpdCBzdWNjZXNzZnVsbHkgcmV0cmlldmVzIHRoZSBjb2xsZWN0aW9uIGZyb20gdGhlIGJhY2tlbmQsXG4gICAgICAgICAgICAgKiBpdCB3aWxsIHN0b3JlIGl0IGluIHRoZSBjYWNoZSB0byBhdm9pZCByZXF1ZXN0cyBmcm9tIHRoZSBiYWNrZW5kIGluXG4gICAgICAgICAgICAgKiBmdXJ0aGVyIGZ1bmN0aW9uIGNhbGxzLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBsb2FkQ29sbGVjdGlvbjogZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfaXNDYWNoZWQoY29sbGVjdGlvbklkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc29sdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGFuZ3VsYXIuY29weShfY29sbGVjdGlvbkNhY2hlW2NvbGxlY3Rpb25JZF0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9mZXRjaENvbGxlY3Rpb24oY29sbGVjdGlvbklkLCBmdW5jdGlvbiAoY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNhdmUgdGhlIGZldGNoZWQgY29sbGVjdGlvbiB0byBhdm9pZCBmdXR1cmUgZmV0Y2hlcy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfY29sbGVjdGlvbkNhY2hlW2NvbGxlY3Rpb25JZF0gPSBjb2xsZWN0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNvbHZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYW5ndWxhci5jb3B5KGNvbGxlY3Rpb24pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0Q29sbGVjdGlvbkRldGFpbHM6IGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoX2NvbGxlY3Rpb25EZXRhaWxzQ2FjaGVbY29sbGVjdGlvbklkXSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX2NvbGxlY3Rpb25EZXRhaWxzQ2FjaGVbY29sbGVjdGlvbklkXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdjb2xsZWN0aW9uIGhhcyBub3QgYmVlbiBmZXRjaGVkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBjb2xsZWN0aW9uIGlzIHN0b3JlZCB3aXRoaW4gdGhlIGxvY2FsIGRhdGFcbiAgICAgICAgICAgICAqIGNhY2hlIG9yIGlmIGl0IG5lZWRzIHRvIGJlIHJldHJpZXZlZCBmcm9tIHRoZSBiYWNrZW5kIHVwb24gYSBsYW9kLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpc0NhY2hlZDogZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfaXNDYWNoZWQoY29sbGVjdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJlcGxhY2VzIHRoZSBjdXJyZW50IGNvbGxlY3Rpb24gaW4gdGhlIGNhY2hlIGdpdmVuIGJ5IHRoZSBzcGVjaWZpZWRcbiAgICAgICAgICAgICAqIGNvbGxlY3Rpb24gSUQgd2l0aCBhIG5ldyBjb2xsZWN0aW9uIG9iamVjdC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY2FjaGVDb2xsZWN0aW9uOiBmdW5jdGlvbiAoY29sbGVjdGlvbklkLCBjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgX2NvbGxlY3Rpb25DYWNoZVtjb2xsZWN0aW9uSWRdID0gYW5ndWxhci5jb3B5KGNvbGxlY3Rpb24pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2xlYXJzIHRoZSBsb2NhbCBjb2xsZWN0aW9uIGRhdGEgY2FjaGUsIGZvcmNpbmcgYWxsIGZ1dHVyZSBsb2FkcyB0b1xuICAgICAgICAgICAgICogcmUtcmVxdWVzdCB0aGUgcHJldmlvdXNseSBsb2FkZWQgY29sbGVjdGlvbnMgZnJvbSB0aGUgYmFja2VuZC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY2xlYXJDb2xsZWN0aW9uQ2FjaGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfY29sbGVjdGlvbkNhY2hlID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnN0YW50cyBmb3Igb2JqZWN0cyBkb21haW4uXG4gKi9cbnZhciBPYmplY3RzRG9tYWluQ29uc3RhbnRzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE9iamVjdHNEb21haW5Db25zdGFudHMoKSB7XG4gICAgfVxuICAgIE9iamVjdHNEb21haW5Db25zdGFudHMuRlJBQ1RJT05fUEFSU0lOR19FUlJPUlMgPSB7XG4gICAgICAgIElOVkFMSURfQ0hBUlM6ICdQbGVhc2Ugb25seSB1c2UgbnVtZXJpY2FsIGRpZ2l0cywgc3BhY2VzIG9yIGZvcndhcmQgc2xhc2hlcyAoLyknLFxuICAgICAgICBJTlZBTElEX0ZPUk1BVDogJ1BsZWFzZSBlbnRlciBhIHZhbGlkIGZyYWN0aW9uIChlLmcuLCA1LzMgb3IgMSAyLzMpJyxcbiAgICAgICAgRElWSVNJT05fQllfWkVSTzogJ1BsZWFzZSBkbyBub3QgcHV0IDAgaW4gdGhlIGRlbm9taW5hdG9yJ1xuICAgIH07XG4gICAgT2JqZWN0c0RvbWFpbkNvbnN0YW50cy5OVU1CRVJfV0lUSF9VTklUU19QQVJTSU5HX0VSUk9SUyA9IHtcbiAgICAgICAgSU5WQUxJRF9WQUxVRTogJ1BsZWFzZSBlbnN1cmUgdGhhdCB2YWx1ZSBpcyBlaXRoZXIgYSBmcmFjdGlvbiBvciBhIG51bWJlcicsXG4gICAgICAgIElOVkFMSURfQ1VSUkVOQ1k6ICdQbGVhc2UgZW50ZXIgYSB2YWxpZCBjdXJyZW5jeSAoZS5nLiwgJDUgb3IgUnMgNSknLFxuICAgICAgICBJTlZBTElEX0NVUlJFTkNZX0ZPUk1BVDogJ1BsZWFzZSB3cml0ZSBjdXJyZW5jeSB1bml0cyBhdCB0aGUgYmVnaW5uaW5nJyxcbiAgICAgICAgSU5WQUxJRF9VTklUX0NIQVJTOiAnUGxlYXNlIGVuc3VyZSB0aGF0IHVuaXQgb25seSBjb250YWlucyBudW1iZXJzLCBhbHBoYWJldHMsICgsICksICosIF4sICcgK1xuICAgICAgICAgICAgJy8sIC0nXG4gICAgfTtcbiAgICBPYmplY3RzRG9tYWluQ29uc3RhbnRzLkNVUlJFTkNZX1VOSVRTID0ge1xuICAgICAgICBkb2xsYXI6IHtcbiAgICAgICAgICAgIG5hbWU6ICdkb2xsYXInLFxuICAgICAgICAgICAgYWxpYXNlczogWyckJywgJ2RvbGxhcnMnLCAnRG9sbGFycycsICdEb2xsYXInLCAnVVNEJ10sXG4gICAgICAgICAgICBmcm9udF91bml0czogWyckJ10sXG4gICAgICAgICAgICBiYXNlX3VuaXQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgcnVwZWU6IHtcbiAgICAgICAgICAgIG5hbWU6ICdydXBlZScsXG4gICAgICAgICAgICBhbGlhc2VzOiBbJ1JzJywgJ3J1cGVlcycsICfigrknLCAnUnVwZWVzJywgJ1J1cGVlJ10sXG4gICAgICAgICAgICBmcm9udF91bml0czogWydScyAnLCAn4oK5J10sXG4gICAgICAgICAgICBiYXNlX3VuaXQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgY2VudDoge1xuICAgICAgICAgICAgbmFtZTogJ2NlbnQnLFxuICAgICAgICAgICAgYWxpYXNlczogWydjZW50cycsICdDZW50cycsICdDZW50J10sXG4gICAgICAgICAgICBmcm9udF91bml0czogW10sXG4gICAgICAgICAgICBiYXNlX3VuaXQ6ICcwLjAxIGRvbGxhcidcbiAgICAgICAgfSxcbiAgICAgICAgcGFpc2U6IHtcbiAgICAgICAgICAgIG5hbWU6ICdwYWlzZScsXG4gICAgICAgICAgICBhbGlhc2VzOiBbJ3BhaXNhJywgJ1BhaXNlJywgJ1BhaXNhJ10sXG4gICAgICAgICAgICBmcm9udF91bml0czogW10sXG4gICAgICAgICAgICBiYXNlX3VuaXQ6ICcwLjAxIHJ1cGVlJ1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gT2JqZWN0c0RvbWFpbkNvbnN0YW50cztcbn0oKSk7XG5leHBvcnRzLk9iamVjdHNEb21haW5Db25zdGFudHMgPSBPYmplY3RzRG9tYWluQ29uc3RhbnRzO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbnZhciBfX21ldGFkYXRhID0gKHRoaXMgJiYgdGhpcy5fX21ldGFkYXRhKSB8fCBmdW5jdGlvbiAoaywgdikge1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShrLCB2KTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0byBzZXQgdGhlIHRpdGxlIG9mIHRoZSBwYWdlLlxuICovXG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgcGxhdGZvcm1fYnJvd3Nlcl8xID0gcmVxdWlyZShcIkBhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXJcIik7XG52YXIgUGFnZVRpdGxlU2VydmljZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQYWdlVGl0bGVTZXJ2aWNlKHRpdGxlU2VydmljZSkge1xuICAgICAgICB0aGlzLnRpdGxlU2VydmljZSA9IHRpdGxlU2VydmljZTtcbiAgICB9XG4gICAgUGFnZVRpdGxlU2VydmljZS5wcm90b3R5cGUuc2V0UGFnZVRpdGxlID0gZnVuY3Rpb24gKHRpdGxlKSB7XG4gICAgICAgIHRoaXMudGl0bGVTZXJ2aWNlLnNldFRpdGxlKHRpdGxlKTtcbiAgICB9O1xuICAgIHZhciBfYTtcbiAgICBQYWdlVGl0bGVTZXJ2aWNlID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5JbmplY3RhYmxlKHtcbiAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290J1xuICAgICAgICB9KSxcbiAgICAgICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFt0eXBlb2YgKF9hID0gdHlwZW9mIHBsYXRmb3JtX2Jyb3dzZXJfMS5UaXRsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBwbGF0Zm9ybV9icm93c2VyXzEuVGl0bGUpID09PSBcImZ1bmN0aW9uXCIgPyBfYSA6IE9iamVjdF0pXG4gICAgXSwgUGFnZVRpdGxlU2VydmljZSk7XG4gICAgcmV0dXJuIFBhZ2VUaXRsZVNlcnZpY2U7XG59KCkpO1xuZXhwb3J0cy5QYWdlVGl0bGVTZXJ2aWNlID0gUGFnZVRpdGxlU2VydmljZTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1BhZ2VUaXRsZVNlcnZpY2UnLCBzdGF0aWNfMS5kb3duZ3JhZGVJbmplY3RhYmxlKFBhZ2VUaXRsZVNlcnZpY2UpKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uc3RhbnRzIGZvciBpbnRlcmFjdGlvbnMgZXh0ZW5zaW9ucy5cbiAqL1xudmFyIEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cygpIHtcbiAgICB9XG4gICAgLy8gTWluaW11bSBjb25maWRlbmNlIHJlcXVpcmVkIGZvciBhIHByZWRpY3RlZCBhbnN3ZXIgZ3JvdXAgdG8gYmUgc2hvd24gdG9cbiAgICAvLyB1c2VyLiBHZW5lcmFsbHkgYSB0aHJlc2hvbGQgb2YgMC43LTAuOCBpcyBhc3N1bWVkIHRvIGJlIGEgZ29vZCBvbmUgaW5cbiAgICAvLyBwcmFjdGljZSwgaG93ZXZlciB2YWx1ZSBuZWVkIG5vdCBiZSBpbiB0aG9zZSBib3VuZHMuXG4gICAgSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cy5DT0RFX1JFUExfUFJFRElDVElPTl9TRVJWSUNFX1RIUkVTSE9MRCA9IDAuNztcbiAgICBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzLkdSQVBIX0lOUFVUX0xFRlRfTUFSR0lOID0gMTIwO1xuICAgIC8vIEdpdmVzIHRoZSBzdGFmZi1saW5lcyBodW1hbiByZWFkYWJsZSB2YWx1ZXMuXG4gICAgSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cy5OT1RFX05BTUVTX1RPX01JRElfVkFMVUVTID0ge1xuICAgICAgICBBNTogODEsXG4gICAgICAgIEc1OiA3OSxcbiAgICAgICAgRjU6IDc3LFxuICAgICAgICBFNTogNzYsXG4gICAgICAgIEQ1OiA3NCxcbiAgICAgICAgQzU6IDcyLFxuICAgICAgICBCNDogNzEsXG4gICAgICAgIEE0OiA2OSxcbiAgICAgICAgRzQ6IDY3LFxuICAgICAgICBGNDogNjUsXG4gICAgICAgIEU0OiA2NCxcbiAgICAgICAgRDQ6IDYyLFxuICAgICAgICBDNDogNjBcbiAgICB9O1xuICAgIC8vIE1pbmltdW0gY29uZmlkZW5jZSByZXF1aXJlZCBmb3IgYSBwcmVkaWN0ZWQgYW5zd2VyIGdyb3VwIHRvIGJlIHNob3duIHRvXG4gICAgLy8gdXNlci4gR2VuZXJhbGx5IGEgdGhyZXNob2xkIG9mIDAuNy0wLjggaXMgYXNzdW1lZCB0byBiZSBhIGdvb2Qgb25lIGluXG4gICAgLy8gcHJhY3RpY2UsIGhvd2V2ZXIgdmFsdWUgbmVlZCBub3QgYmUgaW4gdGhvc2UgYm91bmRzLlxuICAgIEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHMuVEVYVF9JTlBVVF9QUkVESUNUSU9OX1NFUlZJQ0VfVEhSRVNIT0xEID0gMC43O1xuICAgIHJldHVybiBJbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzO1xufSgpKTtcbmV4cG9ydHMuSW50ZXJhY3Rpb25zRXh0ZW5zaW9uc0NvbnN0YW50cyA9IEludGVyYWN0aW9uc0V4dGVuc2lvbnNDb25zdGFudHM7XG4iXSwic291cmNlUm9vdCI6IiJ9