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
 * collection skill domain objects.
 */

oppia.factory('CollectionSkillObjectFactory', [
  function() {
    var CollectionSkill = function(skillId, collectionSkillBackendObject) {
      this._id = skillId;
      this._name = collectionSkillBackendObject.name;
      this._questionIds = angular.copy(
        collectionSkillBackendObject.question_ids);
    };

    // Instance methods

    // Returns the ID of this skill. This property is immutable.
    CollectionSkill.prototype.getId = function() {
      return this._id;
    };

    // Returns the name of the skill.
    CollectionSkill.prototype.getName = function() {
      return this._name;
    };

    // Returns the question IDs part of the skill.
    CollectionSkill.prototype.getQuestionIds = function() {
      return this._questionIds;
    };

    // Static class methods. Note that "this" is not available in static
    // contexts. This function takes a JSON object which represents a backend
    // collection skill python dict.
    CollectionSkill.create = function(skillId, collectionSkillBackendObject) {
      return new CollectionSkill(skillId, collectionSkillBackendObject);
    };

    // Note to developers: Ensure this matches the backend dict elements for
    // collection skills (in collection_domain.CollectionSkill).
    CollectionSkill.createFromIdAndName = function(skillId, skillName) {
      return CollectionSkill.create(skillId, {
        name: skillName,
        question_ids: []
      });
    };

    return CollectionSkill;
  }
]);
