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

require('domain/skill/ConceptCardObjectFactory.ts');
require('domain/skill/MisconceptionObjectFactory.ts');
require('domain/skill/RubricObjectFactory.ts');
require('services/ValidatorsService.ts');

angular.module('oppia').factory('SkillObjectFactory', [
  'ConceptCardObjectFactory', 'MisconceptionObjectFactory',
  'RubricObjectFactory', 'ValidatorsService', 'SKILL_DIFFICULTIES',
  function(
      ConceptCardObjectFactory, MisconceptionObjectFactory,
      RubricObjectFactory, ValidatorsService, SKILL_DIFFICULTIES) {
    var Skill = function(
        id, description, misconceptions, rubrics, conceptCard, languageCode,
        version, nextMisconceptionId, supersedingSkillId, allQuestionsMerged) {
      this._id = id;
      this._description = description;
      this._misconceptions = misconceptions;
      this._rubrics = rubrics;
      this._conceptCard = conceptCard;
      this._languageCode = languageCode;
      this._version = version;
      this._nextMisconceptionId = nextMisconceptionId;
      this._supersedingSkillId = supersedingSkillId;
      this._allQuestionsMerged = allQuestionsMerged;
    };

    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    Skill['hasValidDescription'] = function(description) {
    /* eslint-enable dot-notation */
      var allowDescriptionToBeBlank = false;
      var showWarnings = true;
      return ValidatorsService.isValidEntityName(
        description, showWarnings, allowDescriptionToBeBlank);
    };

    Skill.prototype.getValidationIssues = function() {
      var issues = [];
      if (this.getConceptCard().getExplanation() === '') {
        issues.push(
          'There should be review material in the concept card.');
      }
      if (this.getRubrics().length !== 3) {
        issues.push(
          'All 3 difficulties (Easy, Medium and Hard) should be addressed ' +
          'in rubrics.');
      }
      return issues;
    };

    Skill.prototype.toBackendDict = function() {
      return {
        id: this._id,
        description: this._description,
        misconceptions: this._misconceptions.map(function(misconception) {
          return misconception.toBackendDict();
        }),
        rubrics: this._rubrics.map(function(rubric) {
          return rubric.toBackendDict();
        }),
        skill_contents: this._conceptCard.toBackendDict(),
        language_code: this._languageCode,
        version: this._version,
        next_misconception_id: this._nextMisconceptionId,
        superseding_skill_id: this._supersedingSkillId,
        all_questions_merged: this._allQuestionsMerged
      };
    };

    Skill.prototype.copyFromSkill = function(skill) {
      this._id = skill.getId();
      this._description = skill.getDescription();
      this._misconceptions = skill.getMisconceptions();
      this._rubrics = skill.getRubrics();
      this._conceptCard = skill.getConceptCard();
      this._languageCode = skill.getLanguageCode();
      this._version = skill.getVersion();
      this._nextMisconceptionId = skill.getNextMisconceptionId();
      this._supersedingSkillId = skill.getSupersedingSkillId();
      this._allQuestionsMerged = skill.getAllQuestionsMerged();
    };

    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    Skill['createFromBackendDict'] = function(skillBackendDict) {
    /* eslint-enable dot-notation */
      return new Skill(
        skillBackendDict.id,
        skillBackendDict.description,
        generateMisconceptionsFromBackendDict(skillBackendDict.misconceptions),
        generateRubricsFromBackendDict(skillBackendDict.rubrics),
        ConceptCardObjectFactory.createFromBackendDict(
          skillBackendDict.skill_contents),
        skillBackendDict.language_code,
        skillBackendDict.version,
        skillBackendDict.next_misconception_id,
        skillBackendDict.superseding_skill_id,
        skillBackendDict.all_questions_merged);
    };


    // Create an interstitial skill that would be displayed in the editor until
    // the actual skill is fetched from the backend.
    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    Skill['createInterstitialSkill'] = function() {
    /* eslint-enable dot-notation */
      return new Skill(null, 'Skill description loading',
        [], [], ConceptCardObjectFactory.createInterstitialConceptCard(), 'en',
        1, 0, null, false);
    };

    var generateMisconceptionsFromBackendDict = function(
        misconceptionsBackendDicts) {
      return misconceptionsBackendDicts.map(function(
          misconceptionsBackendDict) {
        return MisconceptionObjectFactory.createFromBackendDict(
          misconceptionsBackendDict);
      });
    };

    var generateRubricsFromBackendDict = function(rubricBackendDicts) {
      return rubricBackendDicts.map(function(rubricBackendDict) {
        return RubricObjectFactory.createFromBackendDict(rubricBackendDict);
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

    Skill.prototype.getRubrics = function() {
      return this._rubrics.slice();
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

    Skill.prototype.getSupersedingSkillId = function() {
      return this._supersedingSkillId;
    };

    Skill.prototype.getAllQuestionsMerged = function() {
      return this._allQuestionsMerged;
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

    Skill.prototype.getRubricExplanation = function(difficulty) {
      for (var idx in this._rubrics) {
        if (this._rubrics[idx].getDifficulty() === difficulty) {
          return this._rubrics[idx].getExplanation();
        }
      }
      return null;
    };

    Skill.prototype.updateRubricForDifficulty = function(
        difficulty, explanation) {
      if (SKILL_DIFFICULTIES.indexOf(difficulty) === -1) {
        throw Error('Invalid difficulty value passed');
      }
      for (var idx in this._rubrics) {
        if (this._rubrics[idx].getDifficulty() === difficulty) {
          this._rubrics[idx].setExplanation(explanation);
          return;
        }
      }
      this._rubrics.push(RubricObjectFactory.create(difficulty, explanation));
    };

    return Skill;
  }
]);
