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
 * @fileoverview Factory for creating frontend 
 * instances of Skill objects.
 */

oppia.factory('SkillObjectFactory', [
  'ConceptCardObjectFactory', 'MisconceptionObjectFactory',
  function(
      ConceptCardObjectFactory, MisconceptionObjectFactory) {
    var Skill = function(
        id, description, misconceptions, conceptCard, languageCode, version) {
      this._id = id
      this._description = description;
      this._misconceptions = misconceptions;
      this._conceptCard = conceptCard;
      this._languageCode = languageCode;
      this._version = version;
    };

    Skill.prototype.toBackendDict = function() {
      return {
        id: this._id,
        description: this._description,
        misconceptions: this._misconceptions.map(function(misconception) {
          return misconception.toBackendDict();
        }),
        skill_contents: this._conceptCard.toBackendDict(),
        language_code: this._languageCode,
        version: this._version
      };
    };

    Skill.prototype.copyFromSkill = function(skill) {
      this._id = skill._id;
      this._description = skill._description;
      this._misconceptions = skill._misconceptions;
      this._conceptCard = skill._conceptCard;
      this._languageCode = skill._languageCode;
      this._version = skill._version;
    };

    Skill.createFromBackendDict = function(skillBackendDict) {
      return new Skill(
        skillBackendDict.id,
        skillBackendDict.description,
        generateMisconceptionsFromBackendDict(skillBackendDict.misconceptions),
        ConceptCardObjectFactory.createFromBackendDict(skillBackendDict.skill_contents),
        skillBackendDict.language_code,
        skillBackendDict.version);
    };

    Skill.createEmptySkill = function() {
      return new Skill(null, null, [], null, null);
    };

    var generateMisconceptionsFromBackendDict = function(
      misconceptionsBackendDicts) {
      return misconceptionsBackendDicts.map(function(
        misconceptionsBackendDict) {
        return MisconceptionObjectFactory.createFromBackendDict(
          misconceptionsBackendDict);
      });
    };

    Skill.prototype.setDescription = function(description) {
      this._description = description;
    };

    Skill.prototype.getDescription = function() {
      return this._description;
    };

    Skill.prototype.getId = function() {
      return this._id;
    };

    Skill.prototype.getConceptCard = function() {
      return this._conceptCard;
    };

    Skill.prototype.getMisconceptions = function() {
      return this._misconceptions;
    };

    Skill.prototype.appendMisconception = function(newMisconception) {
      this._misconceptions.push(newMisconception);
    };

    Skill.prototype.removeLastMisconception = function() {
      this._misconceptions.pop();
    };

    Skill.prototype.getLanguageCode = function() {
      return this._languageCode;
    };

    Skill.prototype.getVersion = function() {
      return this._version;
    };

    Skill.prototype.getNextMisconceptionId = function() {
      var maxId = 0;
      this._misconceptions.forEach(function(misconception) {
        var parsedIdAsInt = parseInt(misconception.getId(), 10);
        maxId = Math.max(maxId, parsedIdAsInt);        
      });
      var nextIdAsInt = maxId + 1;
      return nextIdAsInt.toString();
    };

    Skill.prototype.findMisconceptionById = function(id) {
      for (var idx in this._misconceptions) {
        if (this._misconceptions[idx].getId() === id) {
          return this._misconceptions[idx];
        }
      }
      return null;
    };

    Skill.prototype.deleteMisconception = function(id) {
      for (var idx in this._misconceptions) {
        if (this._misconceptions[idx].getId() === id) {
          this._misconceptions.splice(idx, 1);
        }
      }
    };

    Skill.prototype.getMisconceptionAtIndex = function(idx) {
      return this._misconceptions[idx];
    };

    return Skill;
  }
]);
