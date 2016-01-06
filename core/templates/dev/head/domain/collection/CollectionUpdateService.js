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
 * collection in the backend.
 *
 * @author henning.benmax@gmail.com (Ben Henning)
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
oppia.constant(
  'COLLECTION_NODE_PROPERTY_PREREQUISITE_SKILLS', 'prerequisite_skills');
oppia.constant('COLLECTION_NODE_PROPERTY_ACQUIRED_SKILLS', 'acquired_skills');

oppia.factory('CollectionUpdateService', [
    'CMD_ADD_COLLECTION_NODE', 'CMD_DELETE_COLLECTION_NODE',
    'CMD_EDIT_COLLECTION_PROPERTY', 'CMD_EDIT_COLLECTION_NODE_PROPERTY',
    'COLLECTION_PROPERTY_TITLE', 'COLLECTION_PROPERTY_CATEGORY',
    'COLLECTION_PROPERTY_OBJECTIVE',
    'COLLECTION_NODE_PROPERTY_PREREQUISITE_SKILLS',
    'COLLECTION_NODE_PROPERTY_ACQUIRED_SKILLS', function(
      CMD_ADD_COLLECTION_NODE, CMD_DELETE_COLLECTION_NODE,
      CMD_EDIT_COLLECTION_PROPERTY, CMD_EDIT_COLLECTION_NODE_PROPERTY,
      COLLECTION_PROPERTY_TITLE, COLLECTION_PROPERTY_CATEGORY,
      COLLECTION_PROPERTY_OBJECTIVE,
      COLLECTION_NODE_PROPERTY_PREREQUISITE_SKILLS,
      COLLECTION_NODE_PROPERTY_ACQUIRED_SKILLS) {

  var _buildUpdate = function(command, params) {
    var update = angular.copy(params);
    update.cmd = command;
    return update;
  };

  var _buildPropertyUpdate = function(propertyName, newValue) {
    return _buildUpdate(CMD_EDIT_COLLECTION_PROPERTY, {
      property_name: propertyName,
      new_value: newValue
    });
  };

  var _buildNodePropertyUpdate = function(
      propertyName, explorationId, newValue) {
    return _buildUpdate(CMD_EDIT_COLLECTION_NODE_PROPERTY, {
      property_name: propertyName,
      exploration_id: explorationId,
      new_value: newValue
    });
  };

  // These functions are associated with updates available in
  // core.domain.collection_services.apply_change_list.
  return {
    /**
     * Builds a change object to a collection representing adding a new
     * exploration to a collection which, in turn, creates a new collection node
     * to represent the referenced exploration.
     */
    buildAddCollectionNodeUpdate: function(explorationId) {
      return _buildUpdate(CMD_ADD_COLLECTION_NODE, {
        exploration_id: explorationId
      });
    },

    /**
     * Builds a change object to remove an exploration from a collection.
     */
    buildDeleteCollectionNodeUpdate: function(explorationId) {
      return _buildUpdate(CMD_DELETE_COLLECTION_NODE, {
        exploration_id: explorationId
      });
    },

    /**
     * Builds a change object to change the title of a collection.
     */
    buildCollectionTitleUpdate: function(title) {
      return _buildPropertyUpdate(COLLECTION_PROPERTY_TITLE, title);
    },

    /**
     * Builds a change object to change the title of a category.
     */
    buildCollectionCategoryUpdate: function(category) {
      return _buildPropertyUpdate(COLLECTION_PROPERTY_CATEGORY, category);
    },

    /**
     * Builds a change object to change the title of an objective.
     */
    buildCollectionObjectiveUpdate: function(objective) {
      return _buildPropertyUpdate(COLLECTION_PROPERTY_OBJECTIVE, objective);
    },

    /**
     * Builds a change object to change the prerequisite skills of an
     * exploration within a collection.
     */
    buildPrerequisiteSkillsUpdate: function(explorationId, prerequisiteSkills) {
      return _buildNodePropertyUpdate(
        COLLECTION_NODE_PROPERTY_PREREQUISITE_SKILLS, explorationId,
        prerequisiteSkills);
    },

    /**
     * Builds a change object to change the acquired skills of an exploration
     * within a collection.
     */
    buildAcquiredSkillsUpdate: function(explorationId, acquiredSkills) {
      return _buildNodePropertyUpdate(
        COLLECTION_NODE_PROPERTY_ACQUIRED_SKILLS, explorationId,
        acquiredSkills);
    },
  };
}]);
