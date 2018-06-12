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
  function() {
    var Skill = function(id, description, misconceptions, conceptCard, languageCode) {
      this._id = id
      this._description = description;
      this._misconceptions = misconceptions;
      this._conceptCard = conceptCard;
      this._languageCode = languageCode;
    };

    Skill.prototype.toBackendDict = function() {

    };

    Skill.createFromBackendDict = function(skillBackendDict) {
      return new Skill(
        skillBackendDict.id,
        skillBackendDict.description,
        generateMisconceptionsFromBackendDict(skillBackendDict.misconceptions),
        ConceptCardObjectFactory.createFromBackendDict(skillBackendDict.skill_contents),
        skillBackendDict.language_code);
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
  }]);
