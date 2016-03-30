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

// TODO(bhenning): This should be provided by the backend.
oppia.constant('ACTIVITY_STATUS_PRIVATE', 'private');

oppia.factory('CollectionNodeObjectFactory', [
      'SkillListObjectFactory', 'ACTIVITY_STATUS_PRIVATE',
      function(SkillListObjectFactory, ACTIVITY_STATUS_PRIVATE) {
    var _initializeExplorationDetails = function(
        node, explorationSummaryBackendObject) {
      node._explorationTitle = explorationSummaryBackendObject.title;
      node._explorationExists = explorationSummaryBackendObject.exists;
      node._explorationIsPrivate = (
        explorationSummaryBackendObject.status == ACTIVITY_STATUS_PRIVATE);
      node._explorationSummaryObject = angular.copy(
        explorationSummaryBackendObject);
    };

    var CollectionNode = function(collectionNodeBackendObject) {
      this._explorationId = collectionNodeBackendObject.exploration_id;
      this._prerequisiteSkillList = SkillListObjectFactory.create(
        collectionNodeBackendObject.prerequisite_skills);
      this._acquiredSkillList = SkillListObjectFactory.create(
        collectionNodeBackendObject.acquired_skills);
      _initializeExplorationDetails(
        this, collectionNodeBackendObject.exploration);
    };

    // Instance methods

    // Returns the ID of the exploration represented by this collection node.
    // This property is immutable.
    CollectionNode.prototype.getExplorationId = function() {
      return this._explorationId;
    };

    // Returns the title of the exploration represented by this collection node.
    // This property is immutable.
    CollectionNode.prototype.getExplorationTitle = function() {
      return this._explorationTitle;
    };

    // Returns whether the exploration referenced by this node is known to exist
    // in the backend. This property is immutable.
    CollectionNode.prototype.doesExplorationExist = function() {
      return this._explorationExists;
    };

    // Returns whether the exploration referenced by this node is private and
    // not published. This property is immutable.
    CollectionNode.prototype.isExplorationPrivate = function() {
      return this._explorationIsPrivate;
    };

    // Returns a SkillsList object of the prerequisite skills of this collection
    // node. Changes to the return SkillList object will be reflected in this
    // collection node object.
    CollectionNode.prototype.getPrerequisiteSkillList = function() {
      return this._prerequisiteSkillList;
    };

    // Returns a SkillsList object of the acquired skills of this collection
    // node. Changes to the return SkillList object will be reflected in this
    // collection node object.
    CollectionNode.prototype.getAcquiredSkillList = function() {
      return this._acquiredSkillList;
    };

    // Returns a raw exploration summary object, as supplied by the backend for
    // frontend exploration summary tile displaying. Changes to the returned
    // object are not reflected in this domain object.
    CollectionNode.prototype.getExplorationSummaryObject = function() {
      // TODO(bhenning): This should be represented by a frontend summary domain
      // object that is also shared with the exploration editor/viewer.
      return angular.copy(this._explorationSummaryObject);
    };

    // Sets the raw exploration summary object stored within this node.
    CollectionNode.prototype.setExplorationSummaryObject = function(
        explorationSummaryBackendObject) {
      // TODO(bhenning): This function should be removed once the exploration
      // summary object is represented by a frontend summary domain object.
      _initializeExplorationDetails(this, explorationSummaryBackendObject);
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
        acquired_skills: [],
        prerequisite_skills: [],
        exploration: {
          exists: true
        }
      });
    };

    return CollectionNode;
  }
]);
