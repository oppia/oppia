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

import { InteractionAnswer } from 'interactions/answer-defs';
import { Outcome, OutcomeBackendDict, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { InteractionRuleInputs } from 'interactions/rule-input-defs';
import { RuleObjectFactory, Rule } from 'domain/exploration/RuleObjectFactory';

export interface RuleInputs {
  [ruleType: string]: InteractionRuleInputs[];
}

interface RuleInputTranslations {
  [ruleType: string]: {
    [languageCode: string]: InteractionRuleInputs[]
  }
}

export interface AnswerGroupBackendDict {
  'rule_inputs': RuleInputs;
  'rule_input_translations_mapping': RuleInputTranslations,
  'outcome': OutcomeBackendDict;
  'training_data': InteractionAnswer;
  'tagged_skill_misconception_id': string;
}

export class AnswerGroup {
  private ruleObjectFactory;

  ruleInputs: RuleInputs;
  ruleInputTranslations: RuleInputTranslations;
  outcome: Outcome;
  trainingData: InteractionAnswer;
  taggedSkillMisconceptionId: string;
  constructor(
      ruleInputs: RuleInputs, ruleInputTranslations: RuleInputTranslations,
      outcome: Outcome, trainingData: InteractionAnswer,
      taggedSkillMisconceptionId: string,
      ruleObjectFactory: RuleObjectFactory) {
    this.ruleInputs = ruleInputs;
    this.ruleInputTranslations = ruleInputTranslations;
    this.outcome = outcome;
    this.trainingData = trainingData;
    this.taggedSkillMisconceptionId = taggedSkillMisconceptionId;
    this.ruleObjectFactory = ruleObjectFactory;
  }

  toBackendDict(): AnswerGroupBackendDict {
    return {
      rule_inputs: this.ruleInputs,
      rule_input_translations_mapping: this.ruleInputTranslations,
      outcome: this.outcome.toBackendDict(),
      training_data: this.trainingData,
      tagged_skill_misconception_id: this.taggedSkillMisconceptionId
    };
  }

  addRule(rule: Rule) {
    if (!this.ruleInputs.hasOwnProperty(rule.type)) {
      this.ruleInputs[rule.type] = [];
    }
    this.ruleInputs[rule.type].push(rule.inputs);
  }

  updateRuleInputs(rules: Rule[]) {
    this.ruleInputs = {};
    rules.forEach(this.addRule.bind(this));
  }

  getRulesAsList(): Rule[] {
    const rules = [];

    // Sort rule types so that Equals always is first, followed by all other
    // rule types sorted alphabetically.
    const sortedRuleTypes = Object.keys(this.ruleInputs).sort(
      (x, y) => {
        if (x === 'Equals') {
          return -1;
        }
        return x < y ? -1 : 1;
      }
    );
    sortedRuleTypes.forEach(ruleType => {
      this.ruleInputs[ruleType].forEach(ruleInput => {
        rules.push(this.ruleObjectFactory.createNew(ruleType, ruleInput));
      });
    });

    return rules;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AnswerGroupObjectFactory {
  constructor(
    private outcomeObjectFactory: OutcomeObjectFactory,
    private ruleObjectFactory: RuleObjectFactory) {}

  createNew(
      ruleInputs: RuleInputs, outcome: Outcome, trainingData: InteractionAnswer,
      taggedSkillMisconceptionId: string): AnswerGroup {
    return new AnswerGroup(
      ruleInputs, {}, outcome, trainingData, taggedSkillMisconceptionId,
      this.ruleObjectFactory);
  }

  createFromBackendDict(
      answerGroupBackendDict: AnswerGroupBackendDict): AnswerGroup {
    return new AnswerGroup(
      answerGroupBackendDict.rule_inputs,
      answerGroupBackendDict.rule_input_translations_mapping,
      this.outcomeObjectFactory.createFromBackendDict(
        answerGroupBackendDict.outcome),
      answerGroupBackendDict.training_data,
      answerGroupBackendDict.tagged_skill_misconception_id,
      this.ruleObjectFactory);
  }
}

angular.module('oppia').factory(
  'AnswerGroupObjectFactory', downgradeInjectable(AnswerGroupObjectFactory));
