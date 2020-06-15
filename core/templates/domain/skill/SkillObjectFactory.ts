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
 * @fileoverview Factory for creating frontend skills
 */

export interface ISkillBackendDict {
  'all_questions_merged': boolean;
  description: string;
  id: string;
  'language_code': string;
  misconceptions: IMisconceptionBackendDict[];
  'next_misconception_id': number;
  'prerequisite_skill_ids': string[];
  rubrics: IRubricBackendDict[];
  'skill_contents': IConceptCardBackendDict;
  'superseding_skill_id': string;
  version: number;
}

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { ConceptCardObjectFactory, ConceptCard, IConceptCardBackendDict } from
  'domain/skill/ConceptCardObjectFactory';
import { MisconceptionObjectFactory, Misconception, IMisconceptionBackendDict }
  from 'domain/skill/MisconceptionObjectFactory';
import { RubricObjectFactory, Rubric, IRubricBackendDict } from
  'domain/skill/RubricObjectFactory';
import { ValidatorsService } from 'services/validators.service.ts';
const constants = require('constants.ts');

export class Skill {
  _id: string;
  _description: string;
  _misconceptions: Misconception[];
  _rubrics: Rubric[];
  _conceptCard: ConceptCard;
  _languageCode: string;
  _version: number;
  _nextMisconceptionId: number;
  _supersedingSkillId: string | null;
  _allQuestionsMerged: boolean;
  _prerequisiteSkillIds: string[];
  SKILL_DIFFICULTIES: string[] = constants.SKILL_DIFFICULTIES;

  constructor(id: string, description: string, misconceptions: Misconception[],
      rubrics: Rubric[], conceptCard: ConceptCard, languageCode: string,
      version: number, nextMisconceptionId: number, supersedingSkillId: string,
      allQuestionsMerged: boolean, prerequisiteSkillIds: string[]) {
    this._id = id;
    this._allQuestionsMerged = allQuestionsMerged;
    this._conceptCard = conceptCard;
    this._rubrics = rubrics;
    this._misconceptions = misconceptions;
    this._languageCode = languageCode;
    this._version = version;
    this._description = description;
    this._nextMisconceptionId = nextMisconceptionId;
    this._supersedingSkillId = supersedingSkillId;
    this._prerequisiteSkillIds = prerequisiteSkillIds;
  }
  copyFromSkill(skill: Skill): void {
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
    this._prerequisiteSkillIds = skill.getPrerequisiteSkillIds();
  }
  getId(): string {
    return this._id;
  }

  setDescription(description: string): void {
    this._description = description;
  }

  getDescription(): string {
    return this._description;
  }

  getPrerequisiteSkillIds(): string[] {
    return this._prerequisiteSkillIds.slice();
  }

  addPrerequisiteSkill(skillId: string): void {
    this._prerequisiteSkillIds.push(skillId);
  }

  deletePrerequisiteSkill(skillId: string): void {
    this._prerequisiteSkillIds.forEach((preReq: string, index) => {
      if (preReq === skillId) {
        this._prerequisiteSkillIds.splice(index, 1);
      }
    });
  }

  getConceptCard(): ConceptCard {
    return this._conceptCard;
  }

  getMisconceptions(): Array<Misconception> {
    return this._misconceptions.slice();
  }

  getRubrics(): Array<Rubric> {
    return this._rubrics.slice();
  }

  appendMisconception(newMisconception: Misconception): void {
    this._misconceptions.push(newMisconception);
    this._nextMisconceptionId = this.getIncrementedMisconceptionId(
      newMisconception.getId());
  }

  getLanguageCode(): string {
    return this._languageCode;
  }

  getVersion(): number {
    return this._version;
  }

  getNextMisconceptionId(): number {
    return this._nextMisconceptionId;
  }

  getIncrementedMisconceptionId(id: string) {
    return (parseInt(id) + 1);
  }

  getSupersedingSkillId(): string {
    return this._supersedingSkillId;
  }

  getAllQuestionsMerged(): boolean {
    return this._allQuestionsMerged;
  }

  findMisconceptionById(id: string) {
    for (var idx in this._misconceptions) {
      if (this._misconceptions[idx].getId() === id) {
        return this._misconceptions[idx];
      }
    }
    throw new Error('Could not find misconception with ID: ' + id);
  }

  deleteMisconception(id: string) {
    this._misconceptions.forEach((misc: Misconception) => {
      if (misc.getId() === id) {
        this._misconceptions.splice(this._misconceptions.indexOf(misc), 1);
      }
    });
  }

  getMisconceptionAtIndex(idx: number) {
    return this._misconceptions[idx];
  }

  getRubricExplanations(difficulty: string) {
    for (var idx in this._rubrics) {
      if (this._rubrics[idx].getDifficulty() === difficulty) {
        return this._rubrics[idx].getExplanations();
      }
    }
    return null;
  }

  getMisconceptionId(index: number) {
    return this._misconceptions[index].getId();
  }

  updateRubricForDifficulty(difficulty: string, explanations: Array<string>) {
    if (this.SKILL_DIFFICULTIES.indexOf(difficulty) === -1) {
      throw new Error('Invalid difficulty value passed');
    }
    for (var idx in this._rubrics) {
      if (this._rubrics[idx].getDifficulty() === difficulty) {
        this._rubrics[idx].setExplanations(explanations);
        return;
      }
    }
    const rubricObjectFactory = new RubricObjectFactory();
    this._rubrics.push(rubricObjectFactory.create(difficulty, explanations));
  }

  toBackendDict(): ISkillBackendDict {
    return {
      id: this._id,
      description: this._description,
      misconceptions: this._misconceptions.map(
        (misconception: Misconception) => {
          return misconception.toBackendDict();
        }),
      rubrics: this._rubrics.map((rubric: Rubric) => {
        return rubric.toBackendDict();
      }),
      skill_contents: this._conceptCard.toBackendDict(),
      language_code: this._languageCode,
      version: this._version,
      next_misconception_id: this._nextMisconceptionId,
      superseding_skill_id: this._supersedingSkillId,
      all_questions_merged: this._allQuestionsMerged,
      prerequisite_skill_ids: this._prerequisiteSkillIds
    };
  }
  getValidationIssues(): string[] {
    var issues = [];
    if (this.getConceptCard().getExplanation().getHtml() === '') {
      issues.push(
        'There should be review material in the concept card.');
    }
    if (this.getRubrics().length !== 3) {
      issues.push(
        'All 3 difficulties (Easy, Medium and Hard) should be addressed ' +
        'in rubrics.');
    }
    return issues;
  }
}

@Injectable({
  providedIn: 'root'
})
export class SkillObjectFactory {
  constructor(private conceptCardObjectFactory: ConceptCardObjectFactory,
    private misconceptionObjectFactory: MisconceptionObjectFactory,
    private rubricObjectFactory: RubricObjectFactory,
    private validatorService: ValidatorsService) {
  }
  createInterstitialSkill(): Skill {
    return new Skill(null, 'Skill description loading',
      [], [], this.conceptCardObjectFactory.createInterstitialConceptCard(),
      'en', 1, 0, null, false, []);
  }

  hasValidDescription(description: string) {
    var allowDescriptionToBeBlank = false;
    return this.validatorService.isValidEntityName(
      description, false, allowDescriptionToBeBlank);
  }

  createFromBackendDict(skillBackendDict: ISkillBackendDict): Skill {
    return new Skill(
      skillBackendDict.id,
      skillBackendDict.description,
      this.generateMisconceptionsFromBackendDict(
        skillBackendDict.misconceptions),
      this.generateRubricsFromBackendDict(skillBackendDict.rubrics),
      this.conceptCardObjectFactory.createFromBackendDict(
        skillBackendDict.skill_contents),
      skillBackendDict.language_code,
      skillBackendDict.version,
      skillBackendDict.next_misconception_id,
      skillBackendDict.superseding_skill_id,
      skillBackendDict.all_questions_merged,
      skillBackendDict.prerequisite_skill_ids);
  }

  generateMisconceptionsFromBackendDict(
      misconceptionsBackendDicts: IMisconceptionBackendDict[]) {
    return misconceptionsBackendDicts.map(misconceptionsBackendDict => {
      return this.misconceptionObjectFactory.createFromBackendDict(
        misconceptionsBackendDict);
    });
  }

  generateRubricsFromBackendDict(
      rubricBackendDicts: IRubricBackendDict[]) {
    return rubricBackendDicts.map((rubricBackendDict) => {
      return this.rubricObjectFactory.createFromBackendDict(rubricBackendDict);
    });
  }
}
angular.module('oppia').factory('SkillObjectFactory',
  downgradeInjectable(SkillObjectFactory));
