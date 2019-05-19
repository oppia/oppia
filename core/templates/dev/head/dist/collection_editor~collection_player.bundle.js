(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["collection_editor~collection_player"],{

/***/ "./core/templates/dev/head/domain/collection/CollectionNodeObjectFactory.ts":
/*!**********************************************************************************!*\
  !*** ./core/templates/dev/head/domain/collection/CollectionNodeObjectFactory.ts ***!
  \**********************************************************************************/
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
 * collection node domain objects.
 */
oppia.factory('CollectionNodeObjectFactory', [
    'ACTIVITY_STATUS_PRIVATE',
    function (ACTIVITY_STATUS_PRIVATE) {
        var CollectionNode = function (collectionNodeBackendObject) {
            this._explorationId = collectionNodeBackendObject.exploration_id;
            this._explorationSummaryObject = angular.copy(collectionNodeBackendObject.exploration_summary);
        };
        // Instance methods
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
                return this._explorationSummaryObject.status === (ACTIVITY_STATUS_PRIVATE);
            }
            else {
                return undefined;
            }
        };
        // Returns a raw exploration summary object, as supplied by the backend for
        // frontend exploration summary tile displaying. Changes to the returned
        // object are not reflected in this domain object. The value returned by
        // this function is null if doesExplorationExist() returns false.
        CollectionNode.prototype.getExplorationSummaryObject = function () {
            // TODO(bhenning): This should be represented by a frontend summary domain
            // object that is also shared with the search result and profile pages.
            return angular.copy(this._explorationSummaryObject);
        };
        // Sets the raw exploration summary object stored within this node.
        CollectionNode.prototype.setExplorationSummaryObject = function (explorationSummaryBackendObject) {
            this._explorationSummaryObject = angular.copy(explorationSummaryBackendObject);
        };
        CollectionNode.prototype.getCapitalizedObjective = function () {
            return (this._explorationSummaryObject.objective.charAt(0).toUpperCase() +
                this._explorationSummaryObject.objective.slice(1));
        };
        // Static class methods. Note that "this" is not available in static
        // contexts. This function takes a JSON object which represents a backend
        // collection node python dict.
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        CollectionNode['create'] = function (collectionNodeBackendObject) {
            /* eslint-enable dot-notation */
            return new CollectionNode(collectionNodeBackendObject);
        };
        // TODO(bhenning): Ensure this matches the backend dict elements for
        // collection nodes.
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        CollectionNode['createFromExplorationId'] = function (explorationId) {
            /* eslint-enable dot-notation */
            // TODO (ankita240796) Remove the bracket notation once Angular2
            // gets in.
            /* eslint-disable dot-notation */
            return CollectionNode['create']({
                /* eslint-enable dot-notation */
                exploration_id: explorationId,
                exploration_summary: null
            });
        };
        return CollectionNode;
    }
]);


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
/**
 * @fileoverview Factory for creating and mutating instances of frontend
 * collection domain objects.
 */
__webpack_require__(/*! domain/collection/CollectionNodeObjectFactory.ts */ "./core/templates/dev/head/domain/collection/CollectionNodeObjectFactory.ts");
oppia.factory('CollectionObjectFactory', [
    'CollectionNodeObjectFactory',
    function (CollectionNodeObjectFactory) {
        var Collection = function (collectionBackendObject) {
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
                this._nodes[i] = CollectionNodeObjectFactory.create(collectionBackendObject.nodes[i]);
                var explorationId = this._nodes[i].getExplorationId();
                this._explorationIdToNodeIndexMap[explorationId] = i;
            }
        };
        // Instance methods
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
            return angular.copy(Object.keys(this._explorationIdToNodeIndexMap));
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
                this.addCollectionNode(angular.copy(nodes[i]));
            }
        };
        // Static class methods. Note that "this" is not available in static
        // contexts. This function takes a JSON object which represents a backend
        // collection python dict.
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Collection['create'] = function (collectionBackendObject) {
            /* eslint-enable dot-notation */
            return new Collection(collectionBackendObject);
        };
        // Create a new, empty collection. This is not guaranteed to pass validation
        // tests.
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Collection['createEmptyCollection'] = function () {
            /* eslint-enable dot-notation */
            return new Collection({
                nodes: [],
            });
        };
        return Collection;
    }
]);


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
oppia.factory('ReadOnlyCollectionBackendApiService', [
    '$http', '$q', 'UrlInterpolationService', 'COLLECTION_DATA_URL_TEMPLATE',
    function ($http, $q, UrlInterpolationService, COLLECTION_DATA_URL_TEMPLATE) {
        // Maps previously loaded collections to their IDs.
        var _collectionCache = [];
        var _fetchCollection = function (collectionId, successCallback, errorCallback) {
            var collectionDataUrl = UrlInterpolationService.interpolateUrl(COLLECTION_DATA_URL_TEMPLATE, {
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


/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vY29sbGVjdGlvbi9Db2xsZWN0aW9uTm9kZU9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2NvbGxlY3Rpb24vQ29sbGVjdGlvbk9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2NvbGxlY3Rpb24vUmVhZE9ubHlDb2xsZWN0aW9uQmFja2VuZEFwaVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsb0lBQWtEO0FBQzFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQiwwQ0FBMEM7QUFDckU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVDQUF1Qyx3QkFBd0I7QUFDL0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZEQUE2RDtBQUM3RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLGtCQUFrQjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUMvTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJjb2xsZWN0aW9uX2VkaXRvcn5jb2xsZWN0aW9uX3BsYXllci5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIGFuZCBtdXRhdGluZyBpbnN0YW5jZXMgb2YgZnJvbnRlbmRcbiAqIGNvbGxlY3Rpb24gbm9kZSBkb21haW4gb2JqZWN0cy5cbiAqL1xub3BwaWEuZmFjdG9yeSgnQ29sbGVjdGlvbk5vZGVPYmplY3RGYWN0b3J5JywgW1xuICAgICdBQ1RJVklUWV9TVEFUVVNfUFJJVkFURScsXG4gICAgZnVuY3Rpb24gKEFDVElWSVRZX1NUQVRVU19QUklWQVRFKSB7XG4gICAgICAgIHZhciBDb2xsZWN0aW9uTm9kZSA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uTm9kZUJhY2tlbmRPYmplY3QpIHtcbiAgICAgICAgICAgIHRoaXMuX2V4cGxvcmF0aW9uSWQgPSBjb2xsZWN0aW9uTm9kZUJhY2tlbmRPYmplY3QuZXhwbG9yYXRpb25faWQ7XG4gICAgICAgICAgICB0aGlzLl9leHBsb3JhdGlvblN1bW1hcnlPYmplY3QgPSBhbmd1bGFyLmNvcHkoY29sbGVjdGlvbk5vZGVCYWNrZW5kT2JqZWN0LmV4cGxvcmF0aW9uX3N1bW1hcnkpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBJbnN0YW5jZSBtZXRob2RzXG4gICAgICAgIC8vIFJldHVybnMgdGhlIElEIG9mIHRoZSBleHBsb3JhdGlvbiByZXByZXNlbnRlZCBieSB0aGlzIGNvbGxlY3Rpb24gbm9kZS5cbiAgICAgICAgLy8gVGhpcyBwcm9wZXJ0eSBpcyBpbW11dGFibGUuXG4gICAgICAgIENvbGxlY3Rpb25Ob2RlLnByb3RvdHlwZS5nZXRFeHBsb3JhdGlvbklkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2V4cGxvcmF0aW9uSWQ7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFJldHVybnMgdGhlIHRpdGxlIG9mIHRoZSBleHBsb3JhdGlvbiByZXByZXNlbnRlZCBieSB0aGlzIGNvbGxlY3Rpb24gbm9kZS5cbiAgICAgICAgLy8gVGhpcyBwcm9wZXJ0eSBpcyBpbW11dGFibGUuIFRoZSB2YWx1ZSByZXR1cm5lZCBieSB0aGlzIGZ1bmN0aW9uIGlzXG4gICAgICAgIC8vIG51bGwgaWYgZG9lc0V4cGxvcmF0aW9uRXhpc3QoKSByZXR1cm5zIGZhbHNlLlxuICAgICAgICBDb2xsZWN0aW9uTm9kZS5wcm90b3R5cGUuZ2V0RXhwbG9yYXRpb25UaXRsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9leHBsb3JhdGlvblN1bW1hcnlPYmplY3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZXhwbG9yYXRpb25TdW1tYXJ5T2JqZWN0LnRpdGxlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8vIFJldHVybnMgd2hldGhlciB0aGUgZXhwbG9yYXRpb24gcmVmZXJlbmNlZCBieSB0aGlzIG5vZGUgaXMga25vd24gdG8gZXhpc3RcbiAgICAgICAgLy8gaW4gdGhlIGJhY2tlbmQuIFRoaXMgcHJvcGVydHkgaXMgaW1tdXRhYmxlLlxuICAgICAgICBDb2xsZWN0aW9uTm9kZS5wcm90b3R5cGUuZG9lc0V4cGxvcmF0aW9uRXhpc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZXhwbG9yYXRpb25TdW1tYXJ5T2JqZWN0ICE9PSBudWxsO1xuICAgICAgICB9O1xuICAgICAgICAvLyBSZXR1cm5zIHdoZXRoZXIgdGhlIGV4cGxvcmF0aW9uIHJlZmVyZW5jZWQgYnkgdGhpcyBub2RlIGlzIHByaXZhdGUgYW5kXG4gICAgICAgIC8vIG5vdCBwdWJsaXNoZWQuIFRoaXMgcHJvcGVydHkgaXMgaW1tdXRhYmxlLiBUaGUgdmFsdWUgcmV0dXJuZWQgYnkgdGhpc1xuICAgICAgICAvLyBmdW5jdGlvbiBpcyB1bmRlZmluZWQgaWYgZG9lc0V4cGxvcmF0aW9uRXhpc3QoKSByZXR1cm5zIGZhbHNlLlxuICAgICAgICBDb2xsZWN0aW9uTm9kZS5wcm90b3R5cGUuaXNFeHBsb3JhdGlvblByaXZhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fZXhwbG9yYXRpb25TdW1tYXJ5T2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2V4cGxvcmF0aW9uU3VtbWFyeU9iamVjdC5zdGF0dXMgPT09IChBQ1RJVklUWV9TVEFUVVNfUFJJVkFURSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvLyBSZXR1cm5zIGEgcmF3IGV4cGxvcmF0aW9uIHN1bW1hcnkgb2JqZWN0LCBhcyBzdXBwbGllZCBieSB0aGUgYmFja2VuZCBmb3JcbiAgICAgICAgLy8gZnJvbnRlbmQgZXhwbG9yYXRpb24gc3VtbWFyeSB0aWxlIGRpc3BsYXlpbmcuIENoYW5nZXMgdG8gdGhlIHJldHVybmVkXG4gICAgICAgIC8vIG9iamVjdCBhcmUgbm90IHJlZmxlY3RlZCBpbiB0aGlzIGRvbWFpbiBvYmplY3QuIFRoZSB2YWx1ZSByZXR1cm5lZCBieVxuICAgICAgICAvLyB0aGlzIGZ1bmN0aW9uIGlzIG51bGwgaWYgZG9lc0V4cGxvcmF0aW9uRXhpc3QoKSByZXR1cm5zIGZhbHNlLlxuICAgICAgICBDb2xsZWN0aW9uTm9kZS5wcm90b3R5cGUuZ2V0RXhwbG9yYXRpb25TdW1tYXJ5T2JqZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gVE9ETyhiaGVubmluZyk6IFRoaXMgc2hvdWxkIGJlIHJlcHJlc2VudGVkIGJ5IGEgZnJvbnRlbmQgc3VtbWFyeSBkb21haW5cbiAgICAgICAgICAgIC8vIG9iamVjdCB0aGF0IGlzIGFsc28gc2hhcmVkIHdpdGggdGhlIHNlYXJjaCByZXN1bHQgYW5kIHByb2ZpbGUgcGFnZXMuXG4gICAgICAgICAgICByZXR1cm4gYW5ndWxhci5jb3B5KHRoaXMuX2V4cGxvcmF0aW9uU3VtbWFyeU9iamVjdCk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFNldHMgdGhlIHJhdyBleHBsb3JhdGlvbiBzdW1tYXJ5IG9iamVjdCBzdG9yZWQgd2l0aGluIHRoaXMgbm9kZS5cbiAgICAgICAgQ29sbGVjdGlvbk5vZGUucHJvdG90eXBlLnNldEV4cGxvcmF0aW9uU3VtbWFyeU9iamVjdCA9IGZ1bmN0aW9uIChleHBsb3JhdGlvblN1bW1hcnlCYWNrZW5kT2JqZWN0KSB7XG4gICAgICAgICAgICB0aGlzLl9leHBsb3JhdGlvblN1bW1hcnlPYmplY3QgPSBhbmd1bGFyLmNvcHkoZXhwbG9yYXRpb25TdW1tYXJ5QmFja2VuZE9iamVjdCk7XG4gICAgICAgIH07XG4gICAgICAgIENvbGxlY3Rpb25Ob2RlLnByb3RvdHlwZS5nZXRDYXBpdGFsaXplZE9iamVjdGl2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAodGhpcy5fZXhwbG9yYXRpb25TdW1tYXJ5T2JqZWN0Lm9iamVjdGl2ZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArXG4gICAgICAgICAgICAgICAgdGhpcy5fZXhwbG9yYXRpb25TdW1tYXJ5T2JqZWN0Lm9iamVjdGl2ZS5zbGljZSgxKSk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFN0YXRpYyBjbGFzcyBtZXRob2RzLiBOb3RlIHRoYXQgXCJ0aGlzXCIgaXMgbm90IGF2YWlsYWJsZSBpbiBzdGF0aWNcbiAgICAgICAgLy8gY29udGV4dHMuIFRoaXMgZnVuY3Rpb24gdGFrZXMgYSBKU09OIG9iamVjdCB3aGljaCByZXByZXNlbnRzIGEgYmFja2VuZFxuICAgICAgICAvLyBjb2xsZWN0aW9uIG5vZGUgcHl0aG9uIGRpY3QuXG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIENvbGxlY3Rpb25Ob2RlWydjcmVhdGUnXSA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uTm9kZUJhY2tlbmRPYmplY3QpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICByZXR1cm4gbmV3IENvbGxlY3Rpb25Ob2RlKGNvbGxlY3Rpb25Ob2RlQmFja2VuZE9iamVjdCk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8oYmhlbm5pbmcpOiBFbnN1cmUgdGhpcyBtYXRjaGVzIHRoZSBiYWNrZW5kIGRpY3QgZWxlbWVudHMgZm9yXG4gICAgICAgIC8vIGNvbGxlY3Rpb24gbm9kZXMuXG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIENvbGxlY3Rpb25Ob2RlWydjcmVhdGVGcm9tRXhwbG9yYXRpb25JZCddID0gZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyXG4gICAgICAgICAgICAvLyBnZXRzIGluLlxuICAgICAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICByZXR1cm4gQ29sbGVjdGlvbk5vZGVbJ2NyZWF0ZSddKHtcbiAgICAgICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgICAgIGV4cGxvcmF0aW9uX2lkOiBleHBsb3JhdGlvbklkLFxuICAgICAgICAgICAgICAgIGV4cGxvcmF0aW9uX3N1bW1hcnk6IG51bGxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gQ29sbGVjdGlvbk5vZGU7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIGFuZCBtdXRhdGluZyBpbnN0YW5jZXMgb2YgZnJvbnRlbmRcbiAqIGNvbGxlY3Rpb24gZG9tYWluIG9iamVjdHMuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9jb2xsZWN0aW9uL0NvbGxlY3Rpb25Ob2RlT2JqZWN0RmFjdG9yeS50cycpO1xub3BwaWEuZmFjdG9yeSgnQ29sbGVjdGlvbk9iamVjdEZhY3RvcnknLCBbXG4gICAgJ0NvbGxlY3Rpb25Ob2RlT2JqZWN0RmFjdG9yeScsXG4gICAgZnVuY3Rpb24gKENvbGxlY3Rpb25Ob2RlT2JqZWN0RmFjdG9yeSkge1xuICAgICAgICB2YXIgQ29sbGVjdGlvbiA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uQmFja2VuZE9iamVjdCkge1xuICAgICAgICAgICAgdGhpcy5faWQgPSBjb2xsZWN0aW9uQmFja2VuZE9iamVjdC5pZDtcbiAgICAgICAgICAgIHRoaXMuX3RpdGxlID0gY29sbGVjdGlvbkJhY2tlbmRPYmplY3QudGl0bGU7XG4gICAgICAgICAgICB0aGlzLl9vYmplY3RpdmUgPSBjb2xsZWN0aW9uQmFja2VuZE9iamVjdC5vYmplY3RpdmU7XG4gICAgICAgICAgICB0aGlzLl9sYW5ndWFnZUNvZGUgPSBjb2xsZWN0aW9uQmFja2VuZE9iamVjdC5sYW5ndWFnZV9jb2RlO1xuICAgICAgICAgICAgdGhpcy5fdGFncyA9IGNvbGxlY3Rpb25CYWNrZW5kT2JqZWN0LnRhZ3M7XG4gICAgICAgICAgICB0aGlzLl9jYXRlZ29yeSA9IGNvbGxlY3Rpb25CYWNrZW5kT2JqZWN0LmNhdGVnb3J5O1xuICAgICAgICAgICAgdGhpcy5fdmVyc2lvbiA9IGNvbGxlY3Rpb25CYWNrZW5kT2JqZWN0LnZlcnNpb247XG4gICAgICAgICAgICB0aGlzLl9ub2RlcyA9IFtdO1xuICAgICAgICAgICAgLy8gVGhpcyBtYXAgYWN0cyBhcyBhIGZhc3Qgd2F5IG9mIGxvb2tpbmcgdXAgYSBjb2xsZWN0aW9uIG5vZGUgZm9yIGEgZ2l2ZW5cbiAgICAgICAgICAgIC8vIGV4cGxvcmF0aW9uIElELlxuICAgICAgICAgICAgdGhpcy5fZXhwbG9yYXRpb25JZFRvTm9kZUluZGV4TWFwID0ge307XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbGxlY3Rpb25CYWNrZW5kT2JqZWN0Lm5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbm9kZXNbaV0gPSBDb2xsZWN0aW9uTm9kZU9iamVjdEZhY3RvcnkuY3JlYXRlKGNvbGxlY3Rpb25CYWNrZW5kT2JqZWN0Lm5vZGVzW2ldKTtcbiAgICAgICAgICAgICAgICB2YXIgZXhwbG9yYXRpb25JZCA9IHRoaXMuX25vZGVzW2ldLmdldEV4cGxvcmF0aW9uSWQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9leHBsb3JhdGlvbklkVG9Ob2RlSW5kZXhNYXBbZXhwbG9yYXRpb25JZF0gPSBpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvLyBJbnN0YW5jZSBtZXRob2RzXG4gICAgICAgIENvbGxlY3Rpb24ucHJvdG90eXBlLmdldElkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lkO1xuICAgICAgICB9O1xuICAgICAgICBDb2xsZWN0aW9uLnByb3RvdHlwZS5nZXRUaXRsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl90aXRsZTtcbiAgICAgICAgfTtcbiAgICAgICAgQ29sbGVjdGlvbi5wcm90b3R5cGUuc2V0VGl0bGUgPSBmdW5jdGlvbiAodGl0bGUpIHtcbiAgICAgICAgICAgIHRoaXMuX3RpdGxlID0gdGl0bGU7XG4gICAgICAgIH07XG4gICAgICAgIENvbGxlY3Rpb24ucHJvdG90eXBlLmdldENhdGVnb3J5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NhdGVnb3J5O1xuICAgICAgICB9O1xuICAgICAgICBDb2xsZWN0aW9uLnByb3RvdHlwZS5zZXRDYXRlZ29yeSA9IGZ1bmN0aW9uIChjYXRlZ29yeSkge1xuICAgICAgICAgICAgdGhpcy5fY2F0ZWdvcnkgPSBjYXRlZ29yeTtcbiAgICAgICAgfTtcbiAgICAgICAgQ29sbGVjdGlvbi5wcm90b3R5cGUuZ2V0T2JqZWN0aXZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX29iamVjdGl2ZTtcbiAgICAgICAgfTtcbiAgICAgICAgQ29sbGVjdGlvbi5wcm90b3R5cGUuc2V0T2JqZWN0aXZlID0gZnVuY3Rpb24gKG9iamVjdGl2ZSkge1xuICAgICAgICAgICAgdGhpcy5fb2JqZWN0aXZlID0gb2JqZWN0aXZlO1xuICAgICAgICB9O1xuICAgICAgICBDb2xsZWN0aW9uLnByb3RvdHlwZS5nZXRMYW5ndWFnZUNvZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbGFuZ3VhZ2VDb2RlO1xuICAgICAgICB9O1xuICAgICAgICBDb2xsZWN0aW9uLnByb3RvdHlwZS5zZXRMYW5ndWFnZUNvZGUgPSBmdW5jdGlvbiAobGFuZ3VhZ2VDb2RlKSB7XG4gICAgICAgICAgICB0aGlzLl9sYW5ndWFnZUNvZGUgPSBsYW5ndWFnZUNvZGU7XG4gICAgICAgIH07XG4gICAgICAgIENvbGxlY3Rpb24ucHJvdG90eXBlLmdldFRhZ3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdGFncztcbiAgICAgICAgfTtcbiAgICAgICAgQ29sbGVjdGlvbi5wcm90b3R5cGUuc2V0VGFncyA9IGZ1bmN0aW9uICh0YWdzKSB7XG4gICAgICAgICAgICB0aGlzLl90YWdzID0gdGFncztcbiAgICAgICAgfTtcbiAgICAgICAgQ29sbGVjdGlvbi5wcm90b3R5cGUuZ2V0VmVyc2lvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl92ZXJzaW9uO1xuICAgICAgICB9O1xuICAgICAgICAvLyBBZGRzIGEgbmV3IGZyb250ZW5kIGNvbGxlY3Rpb24gbm9kZSBkb21haW4gb2JqZWN0IHRvIHRoaXMgY29sbGVjdGlvbi5cbiAgICAgICAgLy8gVGhpcyB3aWxsIHJldHVybiB0cnVlIGlmIHRoZSBub2RlIHdhcyBzdWNjZXNzZnVsbHkgYWRkZWQsIG9yIGZhbHNlIGlmIHRoZVxuICAgICAgICAvLyBnaXZlbiBjb2xsZWN0aW9uIG5vZGUgcmVmZXJlbmNlcyBhbiBleHBsb3JhdGlvbiBJRCBhbHJlYWR5IHJlZmVyZW5jZWQgYnlcbiAgICAgICAgLy8gYW5vdGhlciBub2RlIHdpdGhpbiB0aGlzIGNvbGxlY3Rpb24uIENoYW5nZXMgdG8gdGhlIHByb3ZpZGVkIG9iamVjdCB3aWxsXG4gICAgICAgIC8vIGJlIHJlZmxlY3RlZCBpbiB0aGlzIGNvbGxlY3Rpb24uXG4gICAgICAgIENvbGxlY3Rpb24ucHJvdG90eXBlLmFkZENvbGxlY3Rpb25Ob2RlID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25Ob2RlT2JqZWN0KSB7XG4gICAgICAgICAgICB2YXIgZXhwbG9yYXRpb25JZCA9IGNvbGxlY3Rpb25Ob2RlT2JqZWN0LmdldEV4cGxvcmF0aW9uSWQoKTtcbiAgICAgICAgICAgIGlmICghdGhpcy5fZXhwbG9yYXRpb25JZFRvTm9kZUluZGV4TWFwLmhhc093blByb3BlcnR5KGV4cGxvcmF0aW9uSWQpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZXhwbG9yYXRpb25JZFRvTm9kZUluZGV4TWFwW2V4cGxvcmF0aW9uSWRdID0gdGhpcy5fbm9kZXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHRoaXMuX25vZGVzLnB1c2goY29sbGVjdGlvbk5vZGVPYmplY3QpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUaGlzIHdpbGwgc3dhcCAyIG5vZGVzIG9mIHRoZSBjb2xsZWN0aW9uIGFuZCB1cGRhdGUgdGhlIGV4cGxvcmF0aW9uIGlkXG4gICAgICAgIC8vIHRvIG5vZGUgaW5kZXggbWFwIGFjY29yZGluZ2x5LlxuICAgICAgICBDb2xsZWN0aW9uLnByb3RvdHlwZS5zd2FwQ29sbGVjdGlvbk5vZGVzID0gZnVuY3Rpb24gKGZpcnN0SW5kZXgsIHNlY29uZEluZGV4KSB7XG4gICAgICAgICAgICBpZiAoZmlyc3RJbmRleCA+PSB0aGlzLl9ub2Rlcy5sZW5ndGggfHxcbiAgICAgICAgICAgICAgICBzZWNvbmRJbmRleCA+PSB0aGlzLl9ub2Rlcy5sZW5ndGggfHxcbiAgICAgICAgICAgICAgICBmaXJzdEluZGV4IDwgMCB8fFxuICAgICAgICAgICAgICAgIHNlY29uZEluZGV4IDwgMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBmaXJzdEluZGV4SWQgPSB0aGlzLl9ub2Rlc1tmaXJzdEluZGV4XS5nZXRFeHBsb3JhdGlvbklkKCk7XG4gICAgICAgICAgICB2YXIgc2Vjb25kSW5kZXhJZCA9IHRoaXMuX25vZGVzW3NlY29uZEluZGV4XS5nZXRFeHBsb3JhdGlvbklkKCk7XG4gICAgICAgICAgICB2YXIgdGVtcCA9IHRoaXMuX25vZGVzW2ZpcnN0SW5kZXhdO1xuICAgICAgICAgICAgdGhpcy5fbm9kZXNbZmlyc3RJbmRleF0gPSB0aGlzLl9ub2Rlc1tzZWNvbmRJbmRleF07XG4gICAgICAgICAgICB0aGlzLl9ub2Rlc1tzZWNvbmRJbmRleF0gPSB0ZW1wO1xuICAgICAgICAgICAgdGhpcy5fZXhwbG9yYXRpb25JZFRvTm9kZUluZGV4TWFwW2ZpcnN0SW5kZXhJZF0gPSBzZWNvbmRJbmRleDtcbiAgICAgICAgICAgIHRoaXMuX2V4cGxvcmF0aW9uSWRUb05vZGVJbmRleE1hcFtzZWNvbmRJbmRleElkXSA9IGZpcnN0SW5kZXg7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gQXR0ZW1wdHMgdG8gcmVtb3ZlIGEgY29sbGVjdGlvbiBub2RlIGZyb20gdGhpcyBjb2xsZWN0aW9uIGdpdmVuIHRoZVxuICAgICAgICAvLyBzcGVjaWZpZWQgZXhwbG9yYXRpb24gSUQuIFJldHVybnMgd2hldGhlciB0aGUgY29sbGVjdGlvbiBub2RlIHdhc1xuICAgICAgICAvLyByZW1vdmVkLCB3aGljaCBkZXBlbmRzIG9uIHdoZXRoZXIgYW55IGNvbGxlY3Rpb24gbm9kZXMgcmVmZXJlbmNlIHRoZVxuICAgICAgICAvLyBnaXZlbiBleHBsb3JhdGlvbiBJRC5cbiAgICAgICAgQ29sbGVjdGlvbi5wcm90b3R5cGUuZGVsZXRlQ29sbGVjdGlvbk5vZGUgPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgLy8gVE9ETyhiaGVubmluZyk6IENvbnNpZGVyIHdoZXRoZXIgdGhlIHJlbW92ZWQgY29sbGVjdGlvbiBub2RlIHNob3VsZCBiZVxuICAgICAgICAgICAgLy8gaW52YWxpZGF0ZWQsIGxlYWRpbmcgdG8gZXJyb3JzIGlmIGl0cyBtdXRhdGVkIGluIHRoZSBmdXR1cmUuIFRoaXMgbWlnaHRcbiAgICAgICAgICAgIC8vIGhlbHAgcHJldmVudCBidWdzIHdoZXJlIGNvbGxlY3Rpb24gbm9kZXMgYXJlIHN0b3JlZCBhbmQgY2hhbmdlZCBhZnRlclxuICAgICAgICAgICAgLy8gYmVpbmcgcmVtb3ZlZCBmcm9tIGEgY29sbGVjdGlvbi5cbiAgICAgICAgICAgIGlmICh0aGlzLl9leHBsb3JhdGlvbklkVG9Ob2RlSW5kZXhNYXAuaGFzT3duUHJvcGVydHkoZXhwbG9yYXRpb25JZCkpIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZUluZGV4ID0gdGhpcy5fZXhwbG9yYXRpb25JZFRvTm9kZUluZGV4TWFwW2V4cGxvcmF0aW9uSWRdO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9leHBsb3JhdGlvbklkVG9Ob2RlSW5kZXhNYXBbZXhwbG9yYXRpb25JZF07XG4gICAgICAgICAgICAgICAgdGhpcy5fbm9kZXMuc3BsaWNlKG5vZGVJbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgLy8gVXBkYXRlIGFsbCBub2RlIGV4cGxvcmF0aW9uIElEIG1hcCByZWZlcmVuY2VzIHBhc3QgdGhlIHJlbW92ZWQgaW5kZXhcbiAgICAgICAgICAgICAgICAvLyB0byBlbnN1cmUgdGhleSBhcmUgc3RpbGwgcG9pbnRpbmcgdG8gY29ycmVjdCBpbmRleGVzLlxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBub2RlSW5kZXg7IGkgPCB0aGlzLl9ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbm9kZUV4cElkID0gdGhpcy5fbm9kZXNbaV0uZ2V0RXhwbG9yYXRpb25JZCgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9leHBsb3JhdGlvbklkVG9Ob2RlSW5kZXhNYXBbbm9kZUV4cElkXSA9IGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuICAgICAgICAvLyBEZWxldGVzIGFsbCBjb2xsZWN0aW9uIG5vZGVzIHdpdGhpbiB0aGlzIGNvbGxlY3Rpb24uXG4gICAgICAgIENvbGxlY3Rpb24ucHJvdG90eXBlLmNsZWFyQ29sbGVjdGlvbk5vZGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gQ2xlYXJzIHRoZSBleGlzdGluZyBhcnJheSBpbi1wbGFjZSwgc2luY2UgdGhlcmUgbWF5IGJlIEFuZ3VsYXIgYmluZGluZ3NcbiAgICAgICAgICAgIC8vIHRvIHRoaXMgYXJyYXkgYW5kIHRoZXkgY2FuJ3QgYmUgcmVzZXQgdG8gZW1wdHkgYXJyYXlzLlNlZSBmb3IgY29udGV4dDpcbiAgICAgICAgICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEyMzIwNDZcbiAgICAgICAgICAgIHRoaXMuX25vZGVzLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICB0aGlzLl9leHBsb3JhdGlvbklkVG9Ob2RlSW5kZXhNYXAgPSB7fTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gUmV0dXJucyB3aGV0aGVyIGFueSBjb2xsZWN0aW9uIG5vZGVzIGluIHRoaXMgY29sbGVjdGlvbiByZWZlcmVuY2UgdGhlXG4gICAgICAgIC8vIHByb3ZpZGVkIGV4cGxvcmF0aW9uIElELlxuICAgICAgICBDb2xsZWN0aW9uLnByb3RvdHlwZS5jb250YWluc0NvbGxlY3Rpb25Ob2RlID0gZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9leHBsb3JhdGlvbklkVG9Ob2RlSW5kZXhNYXAuaGFzT3duUHJvcGVydHkoZXhwbG9yYXRpb25JZCk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFJldHVybnMgYSBjb2xsZWN0aW9uIG5vZGUgZ2l2ZW4gYW4gZXhwbG9yYXRpb24gSUQsIG9yIHVuZGVmaW5lZCBpZiBub1xuICAgICAgICAvLyBjb2xsZWN0aW9uIG5vZGUgd2l0aGluIHRoaXMgY29sbGVjdGlvbiByZWZlcmVuY2VzIHRoZSBwcm92aWRlZFxuICAgICAgICAvLyBleHBsb3JhdGlvbiBJRC5cbiAgICAgICAgQ29sbGVjdGlvbi5wcm90b3R5cGUuZ2V0Q29sbGVjdGlvbk5vZGVCeUV4cGxvcmF0aW9uSWQgPSBmdW5jdGlvbiAoZXhwSWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9ub2Rlc1t0aGlzLl9leHBsb3JhdGlvbklkVG9Ob2RlSW5kZXhNYXBbZXhwSWRdXTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gUmV0dXJucyBhIGxpc3Qgb2YgY29sbGVjdGlvbiBub2RlIG9iamVjdHMgZm9yIHRoaXMgY29sbGVjdGlvbi4gQ2hhbmdlcyB0b1xuICAgICAgICAvLyBub2RlcyByZXR1cm5lZCBieSB0aGlzIGZ1bmN0aW9uIHdpbGwgYmUgcmVmbGVjdGVkIGluIHRoZSBjb2xsZWN0aW9uLlxuICAgICAgICAvLyBDaGFuZ2VzIHRvIHRoZSBsaXN0IGl0c2VsZiB3aWxsIG5vdCBiZSByZWZsZWN0ZWQgaW4gdGhpcyBjb2xsZWN0aW9uLlxuICAgICAgICBDb2xsZWN0aW9uLnByb3RvdHlwZS5nZXRDb2xsZWN0aW9uTm9kZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbm9kZXMuc2xpY2UoKTtcbiAgICAgICAgfTtcbiAgICAgICAgQ29sbGVjdGlvbi5wcm90b3R5cGUuZ2V0Q29sbGVjdGlvbk5vZGVDb3VudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9ub2Rlcy5sZW5ndGg7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFJldHVybnMgdGhlIHJlZmVyZW5jZSB0byB0aGUgaW50ZXJuYWwgbm9kZXMgYXJyYXk7IHRoaXMgZnVuY3Rpb24gaXMgb25seVxuICAgICAgICAvLyBtZWFudCB0byBiZSB1c2VkIGZvciBBbmd1bGFyIGJpbmRpbmdzIGFuZCBzaG91bGQgbmV2ZXIgYmUgdXNlZCBpbiBjb2RlLlxuICAgICAgICAvLyBQbGVhc2UgdXNlIGdldENvbGxlY3Rpb25Ob2RlcygpIGFuZCByZWxhdGVkIGZ1bmN0aW9ucywgaW5zdGVhZC4gUGxlYXNlXG4gICAgICAgIC8vIGFsc28gYmUgYXdhcmUgdGhpcyBleHBvc2VzIGludGVybmFsIHN0YXRlIG9mIHRoZSBjb2xsZWN0aW9uIGRvbWFpblxuICAgICAgICAvLyBvYmplY3QsIHNvIGNoYW5nZXMgdG8gdGhlIGFycmF5IGl0c2VsZiBtYXkgaW50ZXJuYWxseSBicmVhayB0aGUgZG9tYWluXG4gICAgICAgIC8vIG9iamVjdC5cbiAgICAgICAgQ29sbGVjdGlvbi5wcm90b3R5cGUuZ2V0QmluZGFibGVDb2xsZWN0aW9uTm9kZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbm9kZXM7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFJldHVybnMgdGhlIGNvbGxlY3Rpb24gbm9kZSB3aGljaCBpcyBpbml0aWFsbHkgYXZhaWxhYmxlIHRvIHBsYXlcbiAgICAgICAgLy8gYnkgdGhlIHBsYXllci5cbiAgICAgICAgQ29sbGVjdGlvbi5wcm90b3R5cGUuZ2V0U3RhcnRpbmdDb2xsZWN0aW9uTm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9ub2Rlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9ub2Rlc1swXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLy8gUmV0dXJucyBhIGxpc3Qgb2YgYWxsIGV4cGxvcmF0aW9uIElEcyByZWZlcmVuY2VkIGJ5IHRoaXMgY29sbGVjdGlvbi5cbiAgICAgICAgLy8gQ2hhbmdlcyB0byB0aGUgbGlzdCBpdHNlbGYgd2lsbCBub3QgYmUgcmVmbGVjdGVkIGluIHRoaXMgY29sbGVjdGlvbi5cbiAgICAgICAgQ29sbGVjdGlvbi5wcm90b3R5cGUuZ2V0RXhwbG9yYXRpb25JZHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gYW5ndWxhci5jb3B5KE9iamVjdC5rZXlzKHRoaXMuX2V4cGxvcmF0aW9uSWRUb05vZGVJbmRleE1hcCkpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBSZWFzc2lnbnMgYWxsIHZhbHVlcyB3aXRoaW4gdGhpcyBjb2xsZWN0aW9uIHRvIG1hdGNoIHRoZSBleGlzdGluZ1xuICAgICAgICAvLyBjb2xsZWN0aW9uLiBUaGlzIGlzIHBlcmZvcm1lZCBhcyBhIGRlZXAgY29weSBzdWNoIHRoYXQgbm9uZSBvZiB0aGVcbiAgICAgICAgLy8gaW50ZXJuYWwsIGJpbmRhYmxlIG9iamVjdHMgYXJlIGNoYW5nZWQgd2l0aGluIHRoaXMgY29sbGVjdGlvbi4gTm90ZSB0aGF0XG4gICAgICAgIC8vIHRoZSBjb2xsZWN0aW9uIG5vZGVzIHdpdGhpbiB0aGlzIGNvbGxlY3Rpb24gd2lsbCBiZSBjb21wbGV0ZWx5IHJlZGVmaW5lZFxuICAgICAgICAvLyBhcyBjb3BpZXMgZnJvbSB0aGUgc3BlY2lmaWVkIGNvbGxlY3Rpb24uXG4gICAgICAgIENvbGxlY3Rpb24ucHJvdG90eXBlLmNvcHlGcm9tQ29sbGVjdGlvbiA9IGZ1bmN0aW9uIChvdGhlckNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuX2lkID0gb3RoZXJDb2xsZWN0aW9uLmdldElkKCk7XG4gICAgICAgICAgICB0aGlzLnNldFRpdGxlKG90aGVyQ29sbGVjdGlvbi5nZXRUaXRsZSgpKTtcbiAgICAgICAgICAgIHRoaXMuc2V0Q2F0ZWdvcnkob3RoZXJDb2xsZWN0aW9uLmdldENhdGVnb3J5KCkpO1xuICAgICAgICAgICAgdGhpcy5zZXRPYmplY3RpdmUob3RoZXJDb2xsZWN0aW9uLmdldE9iamVjdGl2ZSgpKTtcbiAgICAgICAgICAgIHRoaXMuc2V0TGFuZ3VhZ2VDb2RlKG90aGVyQ29sbGVjdGlvbi5nZXRMYW5ndWFnZUNvZGUoKSk7XG4gICAgICAgICAgICB0aGlzLnNldFRhZ3Mob3RoZXJDb2xsZWN0aW9uLmdldFRhZ3MoKSk7XG4gICAgICAgICAgICB0aGlzLl92ZXJzaW9uID0gb3RoZXJDb2xsZWN0aW9uLmdldFZlcnNpb24oKTtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJDb2xsZWN0aW9uTm9kZXMoKTtcbiAgICAgICAgICAgIHZhciBub2RlcyA9IG90aGVyQ29sbGVjdGlvbi5nZXRDb2xsZWN0aW9uTm9kZXMoKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZENvbGxlY3Rpb25Ob2RlKGFuZ3VsYXIuY29weShub2Rlc1tpXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvLyBTdGF0aWMgY2xhc3MgbWV0aG9kcy4gTm90ZSB0aGF0IFwidGhpc1wiIGlzIG5vdCBhdmFpbGFibGUgaW4gc3RhdGljXG4gICAgICAgIC8vIGNvbnRleHRzLiBUaGlzIGZ1bmN0aW9uIHRha2VzIGEgSlNPTiBvYmplY3Qgd2hpY2ggcmVwcmVzZW50cyBhIGJhY2tlbmRcbiAgICAgICAgLy8gY29sbGVjdGlvbiBweXRob24gZGljdC5cbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgQ29sbGVjdGlvblsnY3JlYXRlJ10gPSBmdW5jdGlvbiAoY29sbGVjdGlvbkJhY2tlbmRPYmplY3QpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICByZXR1cm4gbmV3IENvbGxlY3Rpb24oY29sbGVjdGlvbkJhY2tlbmRPYmplY3QpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBDcmVhdGUgYSBuZXcsIGVtcHR5IGNvbGxlY3Rpb24uIFRoaXMgaXMgbm90IGd1YXJhbnRlZWQgdG8gcGFzcyB2YWxpZGF0aW9uXG4gICAgICAgIC8vIHRlc3RzLlxuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBDb2xsZWN0aW9uWydjcmVhdGVFbXB0eUNvbGxlY3Rpb24nXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICByZXR1cm4gbmV3IENvbGxlY3Rpb24oe1xuICAgICAgICAgICAgICAgIG5vZGVzOiBbXSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gQ29sbGVjdGlvbjtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0byByZXRyaWV2ZSByZWFkIG9ubHkgaW5mb3JtYXRpb25cbiAqIGFib3V0IGNvbGxlY3Rpb25zIGZyb20gdGhlIGJhY2tlbmQuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbi8vIFRPRE8oYmhlbm5pbmcpOiBGb3IgcHJldmlldyBtb2RlLCB0aGlzIHNlcnZpY2Ugc2hvdWxkIGJlIHJlcGxhY2VkIGJ5IGFcbi8vIHNlcGFyYXRlIENvbGxlY3Rpb25EYXRhU2VydmljZSBpbXBsZW1lbnRhdGlvbiB3aGljaCByZXR1cm5zIGEgbG9jYWwgY29weSBvZlxuLy8gdGhlIGNvbGxlY3Rpb24gaW5zdGVhZC4gVGhpcyBmaWxlIHNob3VsZCBub3QgYmUgaW5jbHVkZWQgb24gdGhlIHBhZ2UgaW4gdGhhdFxuLy8gc2NlbmFyaW8uXG5vcHBpYS5mYWN0b3J5KCdSZWFkT25seUNvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZScsIFtcbiAgICAnJGh0dHAnLCAnJHEnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCAnQ09MTEVDVElPTl9EQVRBX1VSTF9URU1QTEFURScsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkcSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIENPTExFQ1RJT05fREFUQV9VUkxfVEVNUExBVEUpIHtcbiAgICAgICAgLy8gTWFwcyBwcmV2aW91c2x5IGxvYWRlZCBjb2xsZWN0aW9ucyB0byB0aGVpciBJRHMuXG4gICAgICAgIHZhciBfY29sbGVjdGlvbkNhY2hlID0gW107XG4gICAgICAgIHZhciBfZmV0Y2hDb2xsZWN0aW9uID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgY29sbGVjdGlvbkRhdGFVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChDT0xMRUNUSU9OX0RBVEFfVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgY29sbGVjdGlvbl9pZDogY29sbGVjdGlvbklkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICRodHRwLmdldChjb2xsZWN0aW9uRGF0YVVybCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29sbGVjdGlvbiA9IGFuZ3VsYXIuY29weShyZXNwb25zZS5kYXRhLmNvbGxlY3Rpb24pO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKGNvbGxlY3Rpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvclJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2lzQ2FjaGVkID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCkge1xuICAgICAgICAgICAgcmV0dXJuIF9jb2xsZWN0aW9uQ2FjaGUuaGFzT3duUHJvcGVydHkoY29sbGVjdGlvbklkKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0cmlldmVzIGEgY29sbGVjdGlvbiBmcm9tIHRoZSBiYWNrZW5kIGdpdmVuIGEgY29sbGVjdGlvbiBJRC4gVGhpc1xuICAgICAgICAgICAgICogcmV0dXJucyBhIHByb21pc2Ugb2JqZWN0IHRoYXQgYWxsb3dzIGEgc3VjY2VzcyBhbmQgcmVqZWN0aW9uIGNhbGxiYWNrc1xuICAgICAgICAgICAgICogdG8gYmUgcmVnaXN0ZXJlZC4gSWYgdGhlIGNvbGxlY3Rpb24gaXMgc3VjY2Vzc2Z1bGx5IGxvYWRlZCBhbmQgYVxuICAgICAgICAgICAgICogc3VjY2VzcyBjYWxsYmFjayBmdW5jdGlvbiBpcyBwcm92aWRlZCB0byB0aGUgcHJvbWlzZSBvYmplY3QsIHRoZVxuICAgICAgICAgICAgICogc3VjY2VzcyBjYWxsYmFjayBpcyBjYWxsZWQgd2l0aCB0aGUgY29sbGVjdGlvbiBwYXNzZWQgaW4gYXMgYVxuICAgICAgICAgICAgICogcGFyYW1ldGVyLiBJZiBzb21ldGhpbmcgZ29lcyB3cm9uZyB3aGlsZSB0cnlpbmcgdG8gZmV0Y2ggdGhlXG4gICAgICAgICAgICAgKiBjb2xsZWN0aW9uLCB0aGUgcmVqZWN0aW9uIGNhbGxiYWNrIGlzIGNhbGxlZCBpbnN0ZWFkLCBpZiBwcmVzZW50LiBUaGVcbiAgICAgICAgICAgICAqIHJlamVjdGlvbiBjYWxsYmFjayBmdW5jdGlvbiBpcyBwYXNzZWQgdGhlIGVycm9yIHRoYXQgb2NjdXJyZWQgYW5kIHRoZVxuICAgICAgICAgICAgICogY29sbGVjdGlvbiBJRC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZmV0Y2hDb2xsZWN0aW9uOiBmdW5jdGlvbiAoY29sbGVjdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgX2ZldGNoQ29sbGVjdGlvbihjb2xsZWN0aW9uSWQsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBCZWhhdmVzIGluIHRoZSBleGFjdCBzYW1lIHdheSBhcyBmZXRjaENvbGxlY3Rpb24gKGluY2x1ZGluZyBjYWxsYmFja1xuICAgICAgICAgICAgICogYmVoYXZpb3IgYW5kIHJldHVybmluZyBhIHByb21pc2Ugb2JqZWN0KSwgZXhjZXB0IHRoaXMgZnVuY3Rpb24gd2lsbFxuICAgICAgICAgICAgICogYXR0ZW1wdCB0byBzZWUgd2hldGhlciB0aGUgZ2l2ZW4gY29sbGVjdGlvbiBoYXMgYWxyZWFkeSBiZWVuIGxvYWRlZC4gSWZcbiAgICAgICAgICAgICAqIGl0IGhhcyBub3QgeWV0IGJlZW4gbG9hZGVkLCBpdCB3aWxsIGZldGNoIHRoZSBjb2xsZWN0aW9uIGZyb20gdGhlXG4gICAgICAgICAgICAgKiBiYWNrZW5kLiBJZiBpdCBzdWNjZXNzZnVsbHkgcmV0cmlldmVzIHRoZSBjb2xsZWN0aW9uIGZyb20gdGhlIGJhY2tlbmQsXG4gICAgICAgICAgICAgKiBpdCB3aWxsIHN0b3JlIGl0IGluIHRoZSBjYWNoZSB0byBhdm9pZCByZXF1ZXN0cyBmcm9tIHRoZSBiYWNrZW5kIGluXG4gICAgICAgICAgICAgKiBmdXJ0aGVyIGZ1bmN0aW9uIGNhbGxzLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBsb2FkQ29sbGVjdGlvbjogZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfaXNDYWNoZWQoY29sbGVjdGlvbklkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc29sdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGFuZ3VsYXIuY29weShfY29sbGVjdGlvbkNhY2hlW2NvbGxlY3Rpb25JZF0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9mZXRjaENvbGxlY3Rpb24oY29sbGVjdGlvbklkLCBmdW5jdGlvbiAoY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNhdmUgdGhlIGZldGNoZWQgY29sbGVjdGlvbiB0byBhdm9pZCBmdXR1cmUgZmV0Y2hlcy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfY29sbGVjdGlvbkNhY2hlW2NvbGxlY3Rpb25JZF0gPSBjb2xsZWN0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNvbHZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYW5ndWxhci5jb3B5KGNvbGxlY3Rpb24pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIGNvbGxlY3Rpb24gaXMgc3RvcmVkIHdpdGhpbiB0aGUgbG9jYWwgZGF0YVxuICAgICAgICAgICAgICogY2FjaGUgb3IgaWYgaXQgbmVlZHMgdG8gYmUgcmV0cmlldmVkIGZyb20gdGhlIGJhY2tlbmQgdXBvbiBhIGxhb2QuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGlzQ2FjaGVkOiBmdW5jdGlvbiAoY29sbGVjdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9pc0NhY2hlZChjb2xsZWN0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmVwbGFjZXMgdGhlIGN1cnJlbnQgY29sbGVjdGlvbiBpbiB0aGUgY2FjaGUgZ2l2ZW4gYnkgdGhlIHNwZWNpZmllZFxuICAgICAgICAgICAgICogY29sbGVjdGlvbiBJRCB3aXRoIGEgbmV3IGNvbGxlY3Rpb24gb2JqZWN0LlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjYWNoZUNvbGxlY3Rpb246IGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBfY29sbGVjdGlvbkNhY2hlW2NvbGxlY3Rpb25JZF0gPSBhbmd1bGFyLmNvcHkoY29sbGVjdGlvbik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDbGVhcnMgdGhlIGxvY2FsIGNvbGxlY3Rpb24gZGF0YSBjYWNoZSwgZm9yY2luZyBhbGwgZnV0dXJlIGxvYWRzIHRvXG4gICAgICAgICAgICAgKiByZS1yZXF1ZXN0IHRoZSBwcmV2aW91c2x5IGxvYWRlZCBjb2xsZWN0aW9ucyBmcm9tIHRoZSBiYWNrZW5kLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjbGVhckNvbGxlY3Rpb25DYWNoZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF9jb2xsZWN0aW9uQ2FjaGUgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiJdLCJzb3VyY2VSb290IjoiIn0=