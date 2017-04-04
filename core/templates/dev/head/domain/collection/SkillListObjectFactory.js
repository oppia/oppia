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
 * @fileoverview Factory for creating and mutating frontend instances of skill
 * lists used in frontend collection domain objects.
 */

// TODO(bhenning): Implement validation functions and related tests.
oppia.factory('SkillListObjectFactory', [function() {
    var SkillList = function(initialSkills) {
      this._skillList = [];
      this.addSkills(initialSkills);
    };

    // Instance methods

    // Returns whether the given skill is contained in this list, where skill
    // names are case-insensitive.
    SkillList.prototype.containsSkill = function(skillName) {
      var lowercaseSkillName = skillName.toLowerCase();
      return this._skillList.some(function(arrayItem) {
        return arrayItem.toLowerCase() === lowercaseSkillName;
      });
    };

    // Adds a new skill, by name. This returns whether the skill was
    // successfully added, where the add will fail if the name is already
    // contained in the list.
    SkillList.prototype.addSkill = function(skillName) {
      if (this.containsSkill(skillName)) {
        return false;
      }
      this._skillList.push(skillName);
      return true;
    };

    // Adds many skills. Returns false if not every skill was successfully
    // added. See addSkill() for criteria on why individual skill adds may fail.
    SkillList.prototype.addSkills = function(skillNames) {
      var succeeded = true;
      for (var i = 0; i < skillNames.length; i++) {
        succeeded &= this.addSkill(skillNames[i]);
      }
      return succeeded;
    };

    // Resets the list to the given array of skill names. This is equivalent to
    // clearing the list and then adding all of the skills again.
    SkillList.prototype.setSkills = function(skillNames) {
      this.clearSkills();
      this.addSkills(skillNames);
    };

    // Returns the skill at the given index, or null if the index is out of
    // bounds.
    SkillList.prototype.getSkillByIndex = function(skillIndex) {
      if (skillIndex < 0 || skillIndex >= this._skillList.length) {
        return null;
      }
      return this._skillList[skillIndex];
    };

    // Returns all of the skill names in the list. The changes to the returned
    // list will not be reflected in this domain object.
    SkillList.prototype.getSkills = function() {
      return this._skillList.slice();
    };

    // Returns the same result as getSkills(), except changes to the returned
    // list are reflected in this class. This should only be used for angular
    // bindings. Please note this reference is never invalidated; the internal
    // SkillList domain object guarantees this reference will not change for the
    // lifetime of the SkillList object.
    SkillList.prototype.getBindableSkills = function() {
      return this._skillList;
    };

    // Returns the index for the given skill, based on a case-insensitive search
    // of the SkillList, or -1 if the skill name is not contained within the
    // list.
    SkillList.prototype.indexOfSkill = function(skillName) {
      var lowercaseSkillName = skillName.toLowerCase();
      for (var i = 0; i < this._skillList.length; i++) {
        if (this._skillList[i] === lowercaseSkillName) {
          return i;
        }
      }
      return -1;
    };

    // Removes a skill by index from this list. Returns whether the skill was
    // successfully removed, where the removal will fail if the index is out of
    // bounds of the list.
    SkillList.prototype.removeSkillByIndex = function(skillIndex) {
      if (skillIndex < 0 || skillIndex >= this._skillList.length) {
        return false;
      }
      this._skillList.splice(skillIndex, 1);
      return true;
    };

    // Removes a skill based on a search name. Returns whether or not this was
    // successful, which depends on whether the given skill name is actually in
    // the skills list.
    SkillList.prototype.removeSkillByName = function(skillName) {
      var index = this.indexOfSkill(skillName);
      return (index >= 0) && this.removeSkillByIndex(index);
    };

    // Returns whether this list contains any skills.
    SkillList.prototype.isEmpty = function() {
      return this._skillList.length === 0;
    };

    // Returns the number of skills contained in this list.
    SkillList.prototype.getSkillCount = function() {
      return this._skillList.length;
    };

    // Adds the skills from another SkillList domain object to this one, where
    // duplicate skills are ignored.
    SkillList.prototype.addSkillsFromSkillList = function(otherSkillList) {
      if (this === otherSkillList) {
        return;
      }
      for (var i = 0; i < otherSkillList.getSkillCount(); i++) {
        this.addSkill(otherSkillList.getSkillByIndex(i));
      }
    };

    // Returns whether the given skill list is a subset of this skill list.
    SkillList.prototype.isSupersetOfSkillList = function(otherSkillList) {
      var that = this;
      return otherSkillList._skillList.filter(function(skill) {
        return !that.containsSkill(skill);
      }).length === 0;
    };

    // Empties this list of all skill names. This will not invalidate previous
    // references to the underlying skills list returned by getBindableSkills().
    SkillList.prototype.clearSkills = function() {
      // Clears the existing array in-place, since there may be Angular bindings
      // to this array and they can't be reset to empty arrays.See for context:
      // http://stackoverflow.com/a/1232046
      this._skillList.length = 0;
    };

    // Sorts the SkillList lexicographically.
    SkillList.prototype.sortSkills = function() {
      this._skillList.sort();
    };

    // Static class methods. Note that "this" is not available in static
    // contexts.
    SkillList.create = function(initialSkills) {
      return new SkillList(initialSkills);
    };

    return SkillList;
  }
]);
