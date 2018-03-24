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
 * retrieving the collection, saving it, and listening for changes. The service
 * also maintains a list of all skills stored within the collection.
 */

oppia.constant('EVENT_COLLECTION_INITIALIZED', 'collectionInitialized');
oppia.constant('EVENT_COLLECTION_REINITIALIZED', 'collectionReinitialized');

oppia.factory('CollectionEditorStateService', [
  '$rootScope', 'AlertsService', 'CollectionObjectFactory',
  'CollectionRightsBackendApiService', 'CollectionRightsObjectFactory',
  'UndoRedoService', 'EditableCollectionBackendApiService',
  'EVENT_COLLECTION_INITIALIZED', 'EVENT_COLLECTION_REINITIALIZED',
  function(
      $rootScope, AlertsService, CollectionObjectFactory,
      CollectionRightsBackendApiService, CollectionRightsObjectFactory,
      UndoRedoService, EditableCollectionBackendApiService,
      EVENT_COLLECTION_INITIALIZED, EVENT_COLLECTION_REINITIALIZED) {
    var _collection = CollectionObjectFactory.createEmptyCollection();
    var _collectionRights = (
      CollectionRightsObjectFactory.createEmptyCollectionRights());
    var _collectionIsInitialized = false;
    var _isLoadingCollection = false;
    var _isSavingCollection = false;

    var _setCollection = function(collection) {
      _collection.copyFromCollection(collection);
      if (_collectionIsInitialized) {
        $rootScope.$broadcast(EVENT_COLLECTION_REINITIALIZED);
      } else {
        $rootScope.$broadcast(EVENT_COLLECTION_INITIALIZED);
        _collectionIsInitialized = true;
      }
    };
    var _updateCollection = function(newBackendCollectionObject) {
      _setCollection(CollectionObjectFactory.create(
        newBackendCollectionObject));
    };
    var _setCollectionRights = function(collectionRights) {
      _collectionRights.copyFromCollectionRights(collectionRights);
    };
    var _updateCollectionRights = function(newBackendCollectionRightsObject) {
      _setCollectionRights(CollectionRightsObjectFactory.create(
        newBackendCollectionRightsObject));
    };

    return {
      /**
       * Loads, or reloads, the collection stored by this service given a
       * specified collection ID. See setCollection() for more information on
       * additional behavior of this function.
       */
      loadCollection: function(collectionId) {
        _isLoadingCollection = true;
        EditableCollectionBackendApiService.fetchCollection(
          collectionId).then(
          function(newBackendCollectionObject) {
            _updateCollection(newBackendCollectionObject);
          },
          function(error) {
            AlertsService.addWarning(
              error || 'There was an error when loading the collection.');
            _isLoadingCollection = false;
          });
        CollectionRightsBackendApiService.fetchCollectionRights(
          collectionId).then(function(newBackendCollectionRightsObject) {
          _updateCollectionRights(newBackendCollectionRightsObject);
          _isLoadingCollection = false;
        }, function(error) {
          AlertsService.addWarning(
            error ||
            'There was an error when loading the collection rights.');
          _isLoadingCollection = false;
        });
      },

      /**
       * Returns whether this service is currently attempting to load the
       * collection maintained by this service.
       */
      isLoadingCollection: function() {
        return _isLoadingCollection;
      },

      /**
       * Returns whether a collection has yet been loaded using either
       * loadCollection() or setCollection().
       */
      hasLoadedCollection: function() {
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
      getCollection: function() {
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
      getCollectionRights: function() {
        return _collectionRights;
      },

      /**
       * Sets the collection stored within this service, propogating changes to
       * all bindings to the collection returned by getCollection(). The first
       * time this is called it will fire a global event based on the
       * EVENT_COLLECTION_INITIALIZED constant. All subsequent
       * calls will similarly fire a EVENT_COLLECTION_REINITIALIZED event.
       */
      setCollection: function(collection) {
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
      setCollectionRights: function(collectionRights) {
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
      saveCollection: function(commitMessage, successCallback) {
        if (!_collectionIsInitialized) {
          AlertsService.fatalWarning(
            'Cannot save a collection before one is loaded.');
        }

        // Don't attempt to save the collection if there are no changes pending.
        if (!UndoRedoService.hasChanges()) {
          return false;
        }
        _isSavingCollection = true;
        EditableCollectionBackendApiService.updateCollection(
          _collection.getId(), _collection.getVersion(),
          commitMessage, UndoRedoService.getCommittableChangeList()).then(
          function(collectionBackendObject) {
            _updateCollection(collectionBackendObject);
            UndoRedoService.clearChanges();
            _isSavingCollection = false;
            if (successCallback) {
              successCallback();
            }
          }, function(error) {
            AlertsService.addWarning(
              error || 'There was an error when saving the collection.');
            _isSavingCollection = false;
          });
        return true;
      },

      /**
       * Returns whether this service is currently attempting to save the
       * collection maintained by this service.
       */
      isSavingCollection: function() {
        return _isSavingCollection;
      }
    };
  }
]);
