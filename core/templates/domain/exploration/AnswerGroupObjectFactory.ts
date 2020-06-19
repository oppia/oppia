// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of AnswerGroup
 * domain objects.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { Answer } from 'domain/exploration/AnswerStatsObjectFactory';
import { IOutcomeBackendDict, Outcome, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { IBackendRuleDict, Rule, RuleObjectFactory } from
  'domain/exploration/RuleObjectFactory';

export interface IAnswerGroupBackendDict {
  'rule_specs': IBackendRuleDict[];
  'outcome': IOutcomeBackendDict;
  'training_data': Answer;
  'tagged_skill_misconception_id': string;
}

export class AnswerGroup {
  rules: Rule[];
  outcome: Outcome;
  trainingData: Answer;
  taggedSkillMisconceptionId: string;
  constructor(
      rules: Rule[], outcome: Outcome, trainingData: Answer,
      taggedSkillMisconceptionId: string) {
    this.rules = rules;
    this.outcome = outcome;
    this.trainingData = trainingData;
    this.taggedSkillMisconceptionId = taggedSkillMisconceptionId;
  }

  toBackendDict(): IAnswerGroupBackendDict {
    return {
      rule_specs: this.rules.map((rule: Rule) => {
        return rule.toBackendDict();
      }),
      outcome: this.outcome.toBackendDict(),
      training_data: this.trainingData,
      tagged_skill_misconception_id: this.taggedSkillMisconceptionId
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class AnswerGroupObjectFactory {
  constructor(
    private outcomeObjectFactory: OutcomeObjectFactory,
    private ruleObjectFactory: RuleObjectFactory) {}

  generateRulesFromBackend(ruleBackendDicts: IBackendRuleDict[]): Rule[] {
    return ruleBackendDicts.map(this.ruleObjectFactory.createFromBackendDict);
  }

  createNew(
      rules: Rule[], outcome: Outcome, trainingData: Answer,
      taggedSkillMisconceptionId: string): AnswerGroup {
    return new AnswerGroup(
      rules, outcome, trainingData, taggedSkillMisconceptionId);
  }

  createFromBackendDict(
      answerGroupBackendDict: IAnswerGroupBackendDict): AnswerGroup {
    return new AnswerGroup(
      this.generateRulesFromBackend(answerGroupBackendDict.rule_specs),
      this.outcomeObjectFactory.createFromBackendDict(
        answerGroupBackendDict.outcome),
      answerGroupBackendDict.training_data,
      answerGroupBackendDict.tagged_skill_misconception_id);
  }
}

angular.module('oppia').factory(
  'AnswerGroupObjectFactory', downgradeInjectable(AnswerGroupObjectFactory));
