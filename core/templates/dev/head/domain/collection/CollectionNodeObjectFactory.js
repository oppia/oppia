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

// This constant must match the corresponding constant defined in
// core.domain.rights_manager.ACTIVITY_STATUS_PRIVATE.
// TODO(bhenning): This should be provided by the backend.
oppia.constant('ACTIVITY_STATUS_PRIVATE', 'private');

oppia.factory('CollectionNodeObjectFactory', [
  'ACTIVITY_STATUS_PRIVATE',
  function(ACTIVITY_STATUS_PRIVATE) {
    var CollectionNode = function(collectionNodeBackendObject) {
      this._explorationId = collectionNodeBackendObject.exploration_id;
      this._prerequisiteSkillIds = angular.copy(
        collectionNodeBackendObject.prerequisite_skill_ids);
      this._acquiredSkillIds = angular.copy(
        collectionNodeBackendObject.acquired_skill_ids);
      this._explorationSummaryObject = angular.copy(
        collectionNodeBackendObject.exploration_summary);
    };

    // Instance methods

    // Returns the ID of the exploration represented by this collection node.
    // This property is immutable.
    CollectionNode.prototype.getExplorationId = function() {
      return this._explorationId;
    };

    // Returns the title of the exploration represented by this collection node.
    // This property is immutable. The value returned by this function is
    // null if doesExplorationExist() returns false.
    CollectionNode.prototype.getExplorationTitle = function() {
      if (this._explorationSummaryObject) {
        return this._explorationSummaryObject.title;
      } else {
        return null;
      }
    };

    // Returns whether the exploration referenced by this node is known to exist
    // in the backend. This property is immutable.
    CollectionNode.prototype.doesExplorationExist = function() {
      return this._explorationSummaryObject !== null;
    };

    // Returns whether the exploration referenced by this node is private and
    // not published. This property is immutable. The value returned by this
    // function is undefined if doesExplorationExist() returns false.
    CollectionNode.prototype.isExplorationPrivate = function() {
      if (this._explorationSummaryObject) {
        return this._explorationSummaryObject.status === (
          ACTIVITY_STATUS_PRIVATE);
      } else {
        return undefined;
      }
    };

    // Returns a list of the prerequisite skill ids of this collection node.
    // Changes to the returned list will be reflected in this collection node
    // object.
    CollectionNode.prototype.getPrerequisiteSkillIds = function() {
      return this._prerequisiteSkillIds;
    };

    // Returns a list of the acquired skill ids of this collection node.
    // Changes to the returned list will be reflected in this collection node
    // object.
    CollectionNode.prototype.getAcquiredSkillIds = function() {
      return this._acquiredSkillIds;
    };

    // Returns whether the node contains the given skill ID as a prerequisite.
    CollectionNode.prototype.containsPrerequisiteSkillId = function(skillId) {
      return this._prerequisiteSkillIds.indexOf(skillId) !== -1;
    };

    // Returns whether the node allows the learner to acquire the given skill
    // ID.
    CollectionNode.prototype.containsAcquiredSkillId = function(skillId) {
      return this._acquiredSkillIds.indexOf(skillId) !== -1;
    };

    // Adds a new prerequisite skill id to the collection node. This returns
    // whether the skill ID was successfully added, where the add will fail if
    // the ID is already contained within the list.
    CollectionNode.prototype.addPrerequisiteSkillId = function(newSkillId) {
      if (this.containsPrerequisiteSkillId(newSkillId)) {
        return false;
      }
      this._prerequisiteSkillIds.push(newSkillId);
      return true;
    };

    // Adds a new acquired skill id to the collection node. This returns
    // whether the skill ID was successfully added, where the add will fail if
    // the ID is already contained within the list.
    CollectionNode.prototype.addAcquiredSkillId = function(newSkillId) {
      if (this.containsAcquiredSkillId(newSkillId)) {
        return false;
      }
      this._acquiredSkillIds.push(newSkillId);
      return true;
    };

    // Removes a prerequisite skill ID. Returns whether or not this was
    // successful, which depends on whether the given skill ID is actually in
    // the skills list.
    CollectionNode.prototype.removePrerequisiteSkillId = function(skillId) {
      var index = this._prerequisiteSkillIds.indexOf(skillId);
      if (index === -1) {
        return false;
      }
      this._prerequisiteSkillIds.splice(index, 1);
      return true;
    };

    // Removes an acquired skill ID. Returns whether or not this was
    // successful, which depends on whether the given skill ID is actually in
    // the skills list.
    CollectionNode.prototype.removeAcquiredSkillId = function(skillId) {
      var index = this._acquiredSkillIds.indexOf(skillId);
      if (index === -1) {
        return false;
      }
      this._acquiredSkillIds.splice(index, 1);
      return true;
    };

    // Clears all prerequisite skill IDs, preserving the binding of the list.
    CollectionNode.prototype.clearPrerequisiteSkillIds = function() {
      this._prerequisiteSkillIds.length = 0;
    };

    // Clears all acquired skill IDs, preserving the binding of the list.
    CollectionNode.prototype.clearAcquiredSkillIds = function() {
      this._acquiredSkillIds.length = 0;
    };

    // Returns a raw exploration summary object, as supplied by the backend for
    // frontend exploration summary tile displaying. Changes to the returned
    // object are not reflected in this domain object. The value returned by
    // this function is null if doesExplorationExist() returns false.
    CollectionNode.prototype.getExplorationSummaryObject = function() {
      // TODO(bhenning): This should be represented by a frontend summary domain
      // object that is also shared with the search result and profile pages.
      return angular.copy(this._explorationSummaryObject);
    };

    // Sets the raw exploration summary object stored within this node.
    CollectionNode.prototype.setExplorationSummaryObject = function(
        explorationSummaryBackendObject) {
      this._explorationSummaryObject = angular.copy(
        explorationSummaryBackendObject);
    };

    CollectionNode.prototype.getCapitalizedObjective = function() {
      return (
        this._explorationSummaryObject.objective.charAt(0).toUpperCase() +
        this._explorationSummaryObject.objective.slice(1));
    };

    // Static class methods. Note that "this" is not available in static
    // contexts. This function takes a JSON object which represents a backend
    // collection node python dict.
    CollectionNode.create = function(collectionNodeBackendObject) {
      return new CollectionNode(collectionNodeBackendObject);
    };

    // TODO(bhenning): Ensure this matches the backend dict elements for
    // collection nodes.
    CollectionNode.createFromExplorationId = function(explorationId) {
      return CollectionNode.create({
        exploration_id: explorationId,
        acquired_skill_ids: [],
        prerequisite_skill_ids: [],
        exploration_summary: null
      });
    };

    return CollectionNode;
  }
]);
