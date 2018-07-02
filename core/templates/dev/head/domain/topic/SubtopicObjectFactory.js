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

oppia.factory('SubtopicObjectFactory', ['SkillSummaryObjectFactory',
  function(SkillSummaryObjectFactory) {
    var Subtopic = function(subtopicBackendObject, skillIdToDescriptionMap) {
      this._id = subtopicBackendObject.id;
      this._title = subtopicBackendObject.title;
      this._skillSummaries = subtopicBackendObject.skill_ids.map(
        function(skillId) {
          return SkillSummaryObjectFactory.create(
            skillId, skillIdToDescriptionMap[skillId]);
        });
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

    // Returns the summaries of the skills in the subtopic.
    Subtopic.prototype.getSkillSummaries = function() {
      return this._skillSummaries.slice();
    };

    Subtopic.prototype.hasSkill = function(skillId) {
      for (var i = 0; i < this._skillSummaries.length; i++) {
        if (this._skillSummaries[i].getId() === skillId) {
          return true;
        }
      }
      return false;
    };

    Subtopic.prototype.addSkill = function(skillId, skillDescription) {
      if (!this.hasSkill(skillId)) {
        this._skillSummaries.push(SkillSummaryObjectFactory.create(
          skillId, skillDescription));
        return true;
      }
      return false;
    };

    Subtopic.prototype.removeSkill = function(skillId) {
      var index = this._skillSummaries.map(function(skillSummary) {
        return skillSummary.getId();
      }).indexOf(skillId);
      if (index > -1) {
        this._skillSummaries.splice(index, 1);
      } else {
        throw Error('The given skill doesn\'t exist in the subtopic');
      }
    };

    Subtopic.create = function(subtopicBackendObject, skillIdToDescriptionMap) {
      return new Subtopic(subtopicBackendObject, skillIdToDescriptionMap);
    };

    Subtopic.createFromTitle = function(subtopicId, title) {
      return Subtopic.create({
        id: subtopicId,
        title: title,
        skill_ids: []
      }, {});
    };

    return Subtopic;
  }
]);
