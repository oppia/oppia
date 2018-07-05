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
        id, description, misconceptions, conceptCard, languageCode, version,
        nextMisconceptionId) {
      this._id = id;
      this._description = description;
      this._misconceptions = misconceptions;
      this._conceptCard = conceptCard;
      this._languageCode = languageCode;
      this._version = version;
      this._nextMisconceptionId = nextMisconceptionId;
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
        version: this._version,
        next_misconception_id: this._nextMisconceptionId
      };
    };

    Skill.prototype.copyFromSkill = function(skill) {
      this._id = skill.getId();
      this._description = skill.getDescription();
      this._misconceptions = skill.getMisconceptions();
      this._conceptCard = skill.getConceptCard();
      this._languageCode = skill.getLanguageCode();
      this._version = skill.getVersion();
      this._nextMisconceptionId = skill.getNextMisconceptionId();
    };

    Skill.createFromBackendDict = function(skillBackendDict) {
      return new Skill(
        skillBackendDict.id,
        skillBackendDict.description,
        generateMisconceptionsFromBackendDict(skillBackendDict.misconceptions),
        ConceptCardObjectFactory.createFromBackendDict(
          skillBackendDict.skill_contents),
        skillBackendDict.language_code,
        skillBackendDict.version,
        skillBackendDict.next_misconception_id);
    };


    // Create an interstitial skill that would be displayed in the editor until
    // the actual skill is fetched from the backend.
    Skill.createInterstitialSkill = function() {
      return new Skill(null, 'Skill description loading',
        [], ConceptCardObjectFactory.createInterstitialConceptCard(), 'en', 1,
        0);
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
      return this._misconceptions.slice();
    };

    Skill.prototype.appendMisconception = function(newMisconception) {
      this._misconceptions.push(newMisconception);
      this._nextMisconceptionId = this.getIncrementedMisconceptionId(
        newMisconception.getId());
    };

    Skill.prototype.getLanguageCode = function() {
      return this._languageCode;
    };

    Skill.prototype.getVersion = function() {
      return this._version;
    };

    Skill.prototype.getNextMisconceptionId = function() {
      return this._nextMisconceptionId;
    };

    Skill.prototype.getIncrementedMisconceptionId = function(id) {
      return id + 1;
    };

    Skill.prototype.findMisconceptionById = function(id) {
      for (var idx in this._misconceptions) {
        if (this._misconceptions[idx].getId() === id) {
          return this._misconceptions[idx];
        }
      }
      throw Error('Could not find misconception with ID: ' + id);
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
