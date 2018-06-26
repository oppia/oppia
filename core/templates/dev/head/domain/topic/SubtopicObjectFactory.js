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

/**
 * @fileoverview Factory for creating and mutating instances of frontend
 * subtopic domain objects.
 */

oppia.factory('SubtopicObjectFactory', [
  function() {
    var Subtopic = function(subtopicBackendObject) {
      this._id = subtopicBackendObject.id;
      this._title = subtopicBackendObject.title;
      this._skillIds = subtopicBackendObject.skill_ids;
    };

    // Instance methods

    // Returns the id of the subtopic.
    Subtopic.prototype.getId = function() {
      return this._id;
    };

    Subtopic.prototype.decrementId = function() {
      return --this._id;
    };

    Subtopic.prototype.incrementId = function() {
      return ++this._id;
    };

    // Returns the title of the subtopic.
    Subtopic.prototype.getTitle = function() {
      return this._title;
    };

    Subtopic.prototype.setTitle = function(title) {
      this._title = title;
    };

    // Returns the skill ids in the subtopic.
    Subtopic.prototype.getSkillIds = function() {
      return this._skillIds;
    };

    Subtopic.prototype.addSkillId = function(skillId) {
      if (this._skillIds.indexOf(skillId) === -1) {
        this._skillIds.push(skillId);
        return true;
      }
      return false;
    };

    Subtopic.prototype.removeSkillId = function(skillId) {
      var index = this._skillIds.indexOf(skillId);
      if (index > -1) {
        this._skillIds.splice(index, 1);
      }
    };

    Subtopic.create = function(subtopicBackendObject) {
      return new Subtopic(subtopicBackendObject);
    };

    Subtopic.createFromTitle = function(subtopicId, title) {
      return Subtopic.create({
        id: subtopicId,
        title: title,
        skill_ids: []
      });
    };

    return Subtopic;
  }
]);
