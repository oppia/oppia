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

// These should match the constants defined in core.domain.collection_domain.
// TODO(bhenning): The values of these constants should be provided by the
// backend.
oppia.constant('CMD_ADD_COLLECTION_NODE', 'add_collection_node');
oppia.constant('CMD_DELETE_COLLECTION_NODE', 'delete_collection_node');
oppia.constant('CMD_EDIT_COLLECTION_PROPERTY', 'edit_collection_property');
oppia.constant(
  'CMD_EDIT_COLLECTION_NODE_PROPERTY', 'edit_collection_node_property');
oppia.constant('COLLECTION_PROPERTY_TITLE', 'title');
oppia.constant('COLLECTION_PROPERTY_CATEGORY', 'category');
oppia.constant('COLLECTION_PROPERTY_OBJECTIVE', 'objective');
oppia.constant('COLLECTION_PROPERTY_LANGUAGE_CODE', 'language_code');
oppia.constant('COLLECTION_PROPERTY_TAGS', 'tags');
oppia.constant(
  'COLLECTION_NODE_PROPERTY_PREREQUISITE_SKILLS', 'prerequisite_skills');
oppia.constant('COLLECTION_NODE_PROPERTY_ACQUIRED_SKILLS', 'acquired_skills');

oppia.factory('CollectionUpdateService', [
  'CollectionNodeObjectFactory', 'ChangeObjectFactory', 'UndoRedoService',
  'CMD_ADD_COLLECTION_NODE', 'CMD_DELETE_COLLECTION_NODE',
  'CMD_EDIT_COLLECTION_PROPERTY', 'CMD_EDIT_COLLECTION_NODE_PROPERTY',
  'COLLECTION_PROPERTY_TITLE', 'COLLECTION_PROPERTY_CATEGORY',
  'COLLECTION_PROPERTY_OBJECTIVE',
  'COLLECTION_PROPERTY_LANGUAGE_CODE', 'COLLECTION_PROPERTY_TAGS',
  'COLLECTION_NODE_PROPERTY_PREREQUISITE_SKILLS',
  'COLLECTION_NODE_PROPERTY_ACQUIRED_SKILLS', function(
    CollectionNodeObjectFactory, ChangeObjectFactory, UndoRedoService,
    CMD_ADD_COLLECTION_NODE, CMD_DELETE_COLLECTION_NODE,
    CMD_EDIT_COLLECTION_PROPERTY, CMD_EDIT_COLLECTION_NODE_PROPERTY,
    COLLECTION_PROPERTY_TITLE, COLLECTION_PROPERTY_CATEGORY,
    COLLECTION_PROPERTY_OBJECTIVE,
    COLLECTION_PROPERTY_LANGUAGE_CODE, COLLECTION_PROPERTY_TAGS,
    COLLECTION_NODE_PROPERTY_PREREQUISITE_SKILLS,
    COLLECTION_NODE_PROPERTY_ACQUIRED_SKILLS) {
    // Creates a change using an apply function, reverse function, a change
    // command and related parameters. The change is applied to a given
    // collection.
    var _applyChange = function(collection, command, params, apply, reverse) {
      var changeDict = angular.copy(params);
      changeDict.cmd = command;
      var changeObj = ChangeObjectFactory.create(changeDict, apply, reverse);
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

    // Applies a property change to a collection node. See _applyChanges() for
    // details on the other behavior of this function.
    var _applyNodePropertyChange = function(
        collection, propertyName, explorationId, newValue, oldValue, apply,
        reverse) {
      _applyChange(collection, CMD_EDIT_COLLECTION_NODE_PROPERTY, {
        property_name: propertyName,
        exploration_id: explorationId,
        new_value: angular.copy(newValue),
        old_value: angular.copy(oldValue)
      }, apply, reverse);
    };

    var _getExplorationIdFromChangeDict = function(changeDict) {
      return _getParameterFromChangeDict(changeDict, 'exploration_id');
    };

    // A mutator object which provides generic apply() and reverse() functions
    // for changing the skills of a collection. The skillListGetterCallback()
    // takes a CollectionNode domain object and needs to return a SkillList
    // domain object whose skills can be updated. The oldSkills parameter must
    // be a copy of the current skills stored in the SkillList domain object.
    var SetSkillsMutator = function(oldSkills, skillListGetterCallback) {
      var _getCollectionNode = function(changeDict, collection) {
        var explorationId = _getExplorationIdFromChangeDict(changeDict);
        return collection.getCollectionNodeByExplorationId(explorationId);
      };
      this.apply = function(changeDict, collection) {
        var skills = _getNewPropertyValueFromChangeDict(changeDict);
        var collectionNode = _getCollectionNode(changeDict, collection);
        skillListGetterCallback(collectionNode).setSkills(skills);
      };
      this.reverse = function(changeDict, collection) {
        var collectionNode = _getCollectionNode(changeDict, collection);
        skillListGetterCallback(collectionNode).setSkills(oldSkills);
      };
    };

    // An instance of SetSkillsMutator with apply() and reverse() functions
    // which affect the prerequisite skills of a collecton node.
    var SetPrerequisiteSkillsMutator = function(oldSkills) {
      return new SetSkillsMutator(oldSkills, function(collectionNode) {
        return collectionNode.getPrerequisiteSkillList();
      });
    };

    // An instance of SetSkillsMutator with apply() and reverse() functions
    // which affect the acquired skills of a collecton node.
    var SetAcquiredSkillsMutator = function(oldSkills) {
      return new SetSkillsMutator(oldSkills, function(collectionNode) {
        return collectionNode.getAcquiredSkillList();
      });
    };

    // These functions are associated with updates available in
    // core.domain.collection_services.apply_change_list.
    return {
      /**
       * Adds a new exploration to a collection and records the change in the
       * undo/redo service.
       */
      addCollectionNode: function(collection, explorationId,
          explorationSummaryBackendObject) {
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
            // Apply
            var title = _getNewPropertyValueFromChangeDict(changeDict);
            collection.setTitle(title);
          }, function(changeDict, collection) {
            // Undo.
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
       * Changes the prerequisite skills of an exploration within a collection
       * and records the change in the undo/redo service.
       */
      setPrerequisiteSkills: function(collection, explorationId, skills) {
        var collectionNode = collection.getCollectionNodeByExplorationId(
          explorationId);
        var oldSkills = collectionNode.getPrerequisiteSkillList().getSkills();
        var mutator = new SetPrerequisiteSkillsMutator(oldSkills);
        _applyNodePropertyChange(
          collection, COLLECTION_NODE_PROPERTY_PREREQUISITE_SKILLS,
          explorationId, skills, oldSkills, mutator.apply, mutator.reverse);
      },

      /**
       * Changes the acquired skills of an exploration within a collection and
       * records the change in the undo/redo service.
       */
      setAcquiredSkills: function(collection, explorationId, skills) {
        var collectionNode = collection.getCollectionNodeByExplorationId(
          explorationId);
        var oldSkills = collectionNode.getAcquiredSkillList().getSkills();
        var mutator = new SetAcquiredSkillsMutator(oldSkills);
        _applyNodePropertyChange(
          collection, COLLECTION_NODE_PROPERTY_ACQUIRED_SKILLS,
          explorationId, skills, oldSkills, mutator.apply, mutator.reverse);
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
