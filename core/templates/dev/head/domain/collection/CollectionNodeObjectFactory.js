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
 *
 * @author henning.benmax@gmail.com (Ben Henning)
 */

// TODO(bhenning): Add tests for this.
oppia.factory('CollectionNodeObjectFactory', [
      'SkillListObjectFactory', function(SkillListObjectFactory) {
    var CollectionNode = function(collectionNodeBackendObject) {
      this._explorationId = collectionNodeBackendObject.exploration_id;
      this._explorationTitle = collectionNodeBackendObject.exploration.title;
      this._explorationExists = collectionNodeBackendObject.exploration.exists;
      this._newlyCreated = collectionNodeBackendObject.exploration.newlyCreated;
      this._prerequisiteSkillList = SkillListObjectFactory.create(
        collectionNodeBackendObject.prerequisite_skills);
      this._acquiredSkillList = SkillListObjectFactory.create(
        collectionNodeBackendObject.acquired_skills);
      this._explorationSummaryObject = angular.copy(
        collectionNodeBackendObject.exploration);
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

    // Returns whether this exploration is known to exist in the backend. This
    // property is immutable.
    CollectionNode.prototype.doesExplorationExist = function() {
      return this._explorationExists;
    };

    // Returns whether this collection node was created in the frontend. This
    // property is immutable.
    CollectionNode.prototype.isNewlyCreated = function() {
      return this._newlyCreated;
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
      // TODO(bhenning): This should be represented by a frontend summary tile
      // domain object that is also shared with the exploration editor/viewer.
      return angular.copy(this._explorationSummaryObject);
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
          exists: true,
          newlyCreated: true
        }
      });
    };

    return CollectionNode;
  }
]);
