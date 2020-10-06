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

import { Change } from 'domain/editor/undo_redo/change.model';

require('domain/collection/collection-node-object.factory.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');

require('domain/collection/collection-domain.constants.ajs.ts');

angular.module('oppia').factory('CollectionUpdateService', [
  'CollectionNodeObjectFactory', 'UndoRedoService',
  'CMD_ADD_COLLECTION_NODE',
  'CMD_DELETE_COLLECTION_NODE',
  'CMD_EDIT_COLLECTION_PROPERTY', 'CMD_SWAP_COLLECTION_NODES',
  'COLLECTION_PROPERTY_CATEGORY', 'COLLECTION_PROPERTY_LANGUAGE_CODE',
  'COLLECTION_PROPERTY_OBJECTIVE',
  'COLLECTION_PROPERTY_TAGS', 'COLLECTION_PROPERTY_TITLE', function(
      CollectionNodeObjectFactory, UndoRedoService,
      CMD_ADD_COLLECTION_NODE,
      CMD_DELETE_COLLECTION_NODE,
      CMD_EDIT_COLLECTION_PROPERTY, CMD_SWAP_COLLECTION_NODES,
      COLLECTION_PROPERTY_CATEGORY, COLLECTION_PROPERTY_LANGUAGE_CODE,
      COLLECTION_PROPERTY_OBJECTIVE,
      COLLECTION_PROPERTY_TAGS, COLLECTION_PROPERTY_TITLE) {
    // Creates a change using an apply function, reverse function, a change
    // command and related parameters. The change is applied to a given
    // collection.
    var _applyChange = function(collection, command, params, apply, reverse) {
      var changeDict = angular.copy(params);
      changeDict.cmd = command;
      var changeObj = new Change(changeDict, apply, reverse);
      UndoRedoService.applyChange(changeObj, collection);
    };

    var _getParameterFromChangeDict = function(changeDict, paramName) {
      return changeDict[paramName];
    };

    // Applies a collection property change, specifically. See _applyChange()
    // for details on the other behavior of this function.
    var _applyPropertyChange = function(
        collection, propertyName, newValue, oldValue, apply, reverse) {
      _applyChange(collection, CMD_EDIT_COLLECTION_PROPERTY, {
        property_name: propertyName,
        new_value: angular.copy(newValue),
        old_value: angular.copy(oldValue)
      }, apply, reverse);
    };

    var _getNewPropertyValueFromChangeDict = function(changeDict) {
      return _getParameterFromChangeDict(changeDict, 'new_value');
    };

    var _getExplorationIdFromChangeDict = function(changeDict) {
      return _getParameterFromChangeDict(changeDict, 'exploration_id');
    };

    var _getFirstIndexFromChangeDict = function(changeDict) {
      return _getParameterFromChangeDict(changeDict, 'first_index');
    };

    var _getSecondIndexFromChangeDict = function(changeDict) {
      return _getParameterFromChangeDict(changeDict, 'second_index');
    };

    // These functions are associated with updates available in
    // core.domain.collection_services.apply_change_list.
    return {
      /**
       * Adds a new exploration to a collection and records the change in the
       * undo/redo service.
       */
      addCollectionNode: function(
          collection, explorationId, explorationSummaryBackendObject) {
        var oldSummaryBackendObject = angular.copy(
          explorationSummaryBackendObject);
        _applyChange(collection, CMD_ADD_COLLECTION_NODE, {
          exploration_id: explorationId
        }, function(changeDict, collection) {
          // Apply.
          var explorationId = _getExplorationIdFromChangeDict(changeDict);
          var collectionNode = (
            CollectionNodeObjectFactory.createFromExplorationId(
              explorationId));
          collectionNode.setExplorationSummaryObject(oldSummaryBackendObject);
          collection.addCollectionNode(collectionNode);
        }, function(changeDict, collection) {
          // Undo.
          var explorationId = _getExplorationIdFromChangeDict(changeDict);
          collection.deleteCollectionNode(explorationId);
        });
      },

      swapNodes: function(collection, firstIndex, secondIndex) {
        _applyChange(collection, CMD_SWAP_COLLECTION_NODES, {
          first_index: firstIndex,
          second_index: secondIndex
        }, function(changeDict, collection) {
          // Apply.
          var firstIndex = _getFirstIndexFromChangeDict(changeDict);
          var secondIndex = _getSecondIndexFromChangeDict(changeDict);

          collection.swapCollectionNodes(firstIndex, secondIndex);
        }, function(changeDict, collection) {
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
      deleteCollectionNode: function(collection, explorationId) {
        var oldCollectionNode = angular.copy(
          collection.getCollectionNodeByExplorationId(explorationId));
        _applyChange(collection, CMD_DELETE_COLLECTION_NODE, {
          exploration_id: explorationId
        }, function(changeDict, collection) {
          // Apply.
          var explorationId = _getExplorationIdFromChangeDict(changeDict);
          collection.deleteCollectionNode(explorationId);
        }, function(changeDict, collection) {
          // Undo.
          collection.addCollectionNode(oldCollectionNode);
        });
      },

      /**
       * Changes the title of a collection and records the change in the
       * undo/redo service.
       */
      setCollectionTitle: function(collection, title) {
        var oldTitle = angular.copy(collection.getTitle());
        _applyPropertyChange(
          collection, COLLECTION_PROPERTY_TITLE, title, oldTitle,
          function(changeDict, collection) {
            // ---- Apply ----
            var title = _getNewPropertyValueFromChangeDict(changeDict);
            collection.setTitle(title);
          }, function(changeDict, collection) {
            // ---- Undo ----
            collection.setTitle(oldTitle);
          });
      },

      /**
       * Changes the category of a collection and records the change in the
       * undo/redo service.
       */
      setCollectionCategory: function(collection, category) {
        var oldCategory = angular.copy(collection.getCategory());
        _applyPropertyChange(
          collection, COLLECTION_PROPERTY_CATEGORY, category, oldCategory,
          function(changeDict, collection) {
            // Apply.
            var category = _getNewPropertyValueFromChangeDict(changeDict);
            collection.setCategory(category);
          }, function(changeDict, collection) {
            // Undo.
            collection.setCategory(oldCategory);
          });
      },

      /**
       * Changes the objective of a collection and records the change in the
       * undo/redo service.
       */
      setCollectionObjective: function(collection, objective) {
        var oldObjective = angular.copy(collection.getObjective());
        _applyPropertyChange(
          collection, COLLECTION_PROPERTY_OBJECTIVE, objective, oldObjective,
          function(changeDict, collection) {
            // Apply.
            var objective = _getNewPropertyValueFromChangeDict(changeDict);
            collection.setObjective(objective);
          }, function(changeDict, collection) {
            // Undo.
            collection.setObjective(oldObjective);
          });
      },

      /**
       * Changes the language code of a collection and records the change in
       * the undo/redo service.
       */
      setCollectionLanguageCode: function(collection, languageCode) {
        var oldLanguageCode = angular.copy(collection.getLanguageCode());
        _applyPropertyChange(
          collection, COLLECTION_PROPERTY_LANGUAGE_CODE, languageCode,
          oldLanguageCode,
          function(changeDict, collection) {
            // Apply.
            var languageCode = _getNewPropertyValueFromChangeDict(changeDict);
            collection.setLanguageCode(languageCode);
          }, function(changeDict, collection) {
            // Undo.
            collection.setLanguageCode(oldLanguageCode);
          });
      },

      /**
       * Changes the tags of a collection and records the change in
       * the undo/redo service.
       */
      setCollectionTags: function(collection, tags) {
        var oldTags = angular.copy(collection.getTags());
        _applyPropertyChange(
          collection, COLLECTION_PROPERTY_TAGS, tags, oldTags,
          function(changeDict, collection) {
            // Apply.
            var tags = _getNewPropertyValueFromChangeDict(changeDict);
            collection.setTags(tags);
          }, function(changeDict, collection) {
            // Undo.
            collection.setTags(oldTags);
          });
      },

      /**
       * Returns whether the given change object constructed by this service
       * is adding a new collection node to a collection.
       */
      isAddingCollectionNode: function(changeObject) {
        var backendChangeObject = changeObject.getBackendChangeObject();
        return backendChangeObject.cmd === CMD_ADD_COLLECTION_NODE;
      },

      /**
       * Returns the exploration ID referenced by the specified change object,
       * or undefined if the given changeObject does not reference an
       * exploration ID. The change object is expected to be one constructed
       * by this service.
       */
      getExplorationIdFromChangeObject: function(changeObject) {
        return _getExplorationIdFromChangeDict(
          changeObject.getBackendChangeObject());
      }
    };
  }]);
