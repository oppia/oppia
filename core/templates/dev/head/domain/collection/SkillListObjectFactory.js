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
 *
 * @author henning.benmax@gmail.com (Ben Henning)
 */

// TODO(bhenning): Add tests for this, especially before it's more critically
// used.
oppia.factory('SkillListObjectFactory', [function() {
    var SkillList = function(initialSkills) {
      this.clearSkills();
      this.addSkills(initialSkills);
    };

    // Instance methods

    // Returns whether the given skill is contained in this list, where skill
    // names are case-insensitive.
    SkillList.prototype.containsSkill = function(skillName) {
      var lowercaseSkillName = skillName.toLowerCase();
      return this.skillsList.some(function(arrayItem) {
        return arrayItem.toLowerCase() == lowercaseSkillName;
      });
    };

    // Adds a new skill, by name. This returns whether the skill was
    // successfully added, where the add will fail if the name is already
    // contained in the list.
    SkillList.prototype.addSkill = function(skillName) {
      if (this.containsSkill(skillName)) {
        return false;
      }
      this.skillsList.push(skillName);
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
      if (skillIndex < 0 || skillIndex >= this.skillsList.length) {
        return null;
      }
      return this.skillsList[skillIndex];
    };

    // Returns all of the skill names in the list.
    SkillList.prototype.getSkills = function() {
      return this.skillsList;
    };

    // Returns the index for the given skill, based on a case-insensitive search
    // of the skill list, or -1 if the skill name is not contained within the
    // list.
    SkillList.prototype.indexOfSkill = function(skillName) {
      var lowercaseSkillName = skillName.toLowerCase();
      for (var i = 0; i < this.skillsList.length; i++) {
        if (this.skillsList[i] == lowercaseSkillName) {
          return i;
        }
      }
      return -1;
    };

    // Removes a skill by index from this list. Returns whether the skill was
    // successfully removed, where the removal will fail if the index is out of
    // bounds of the list.
    SkillList.prototype.removeSkillByIndex = function(skillIndex) {
      if (skillIndex < 0 || skillIndex >= this.skillsList.length) {
        return false;
      }
      this.skillsList.splice(skillIndex, 1);
      return true;
    };

    // Removes a skill based on a search name. Returns whether or not this was
    // successful, which depends on whether the given skill name is actually in
    // the skills list.
    SkillList.prototype.removeSkillByName = function(skillName) {
      var index = this.indexOfSkill(skillName);
      return (index >= 0) && this.removeSkillByIndex(index);
    };

    // Returns the number of skills contained in this list.
    SkillList.prototype.getSkillCount = function() {
      return this.skillsList.length;
    };

    // Appends another skill list to this list, where duplicate skills are
    // ignored.
    SkillList.prototype.concatSkillList = function(otherSkillList) {
      for (var i = 0; i < otherSkillList.getSkillCount(); i++) {
        this.addSkill(otherSkillList.getSkillByIndex(i));
      }
    };

    // Empties this list of all skill names.
    SkillList.prototype.clearSkills = function() {
      this.skillsList = [];
    };

    // Sorts the skill list lexicographically.
    SkillList.prototype.sortSkills = function() {
      this.skillsList.sort();
    };

    // Static class methods. Note that "this" is not available in static
    // contexts.
    SkillList.create = function(initialSkills) {
      return new SkillList(initialSkills);
    };

    return SkillList;
  }
]);
