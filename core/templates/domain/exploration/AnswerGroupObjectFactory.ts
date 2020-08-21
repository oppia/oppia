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
import { RuleObjectFactory, Rule } from 'domain/exploration/RuleObjectFactory';
import {
  SubtitledVariableLengthListOfRuleInputsObjectFactory,
  SubtitledVariableLengthListOfRuleInputs,
  SubtitledVariableLengthListOfRuleInputsBackendDict
} from
  'domain/exploration/SubtitledVariableLengthListOfRuleInputsObjectFactory';

export interface RuleInputs {
  [ruleType: string]: SubtitledVariableLengthListOfRuleInputs;
}

interface RuleInputsBackendDict {
  [ruleType: string]: SubtitledVariableLengthListOfRuleInputsBackendDict;
}

export interface AnswerGroupBackendDict {
  'rule_types_to_inputs': RuleInputsBackendDict;
  'outcome': OutcomeBackendDict;
  'training_data': InteractionAnswer;
  'tagged_skill_misconception_id': string;
}

export class AnswerGroup {
  private _ruleObjectFactory;

  ruleTypesToInputs: RuleInputs;
  outcome: Outcome;
  trainingData: InteractionAnswer;
  taggedSkillMisconceptionId: string;
  constructor(
      ruleTypesToInputs: RuleInputs,
      outcome: Outcome, trainingData: InteractionAnswer,
      taggedSkillMisconceptionId: string,
      _ruleObjectFactory: RuleObjectFactory) {
    this.ruleTypesToInputs = ruleTypesToInputs;
    this.outcome = outcome;
    this.trainingData = trainingData;
    this.taggedSkillMisconceptionId = taggedSkillMisconceptionId;
    this._ruleObjectFactory = _ruleObjectFactory;
  }

  toBackendDict(): AnswerGroupBackendDict {
    const ruleTypesToInputsBackendDict = {};

    Object.keys(this.ruleTypesToInputs).forEach(
      ruleType => {
        ruleTypesToInputsBackendDict[ruleType] = (
          this.ruleTypesToInputs[ruleType].toBackendDict()
        );
      }
    );

    return {
      rule_types_to_inputs: ruleTypesToInputsBackendDict,
      outcome: this.outcome.toBackendDict(),
      training_data: this.trainingData,
      tagged_skill_misconception_id: this.taggedSkillMisconceptionId
    };
  }

  addRule(rule: Rule) {
    if (!this.ruleTypesToInputs.hasOwnProperty(rule.type)) {
      this.ruleTypesToInputs[rule.type] = (
        new SubtitledVariableLengthListOfRuleInputs([], null));
    }
    this.ruleTypesToInputs[rule.type].ruleInputs.push(rule.inputs);
  }

  updateRuleTypesToInputs(rules: Rule[]) {
    this.ruleTypesToInputs = {};
    rules.forEach(this.addRule.bind(this));
  }

  static getRuleTypesInDisplayOrder(ruleTypesToInputs: RuleInputs) {
    // Sort rule types so that Equals always is first, followed by all other
    // rule types sorted alphabetically.
    return Object.keys(ruleTypesToInputs).sort(
      (x, y) => {
        if (x === 'Equals') {
          return -1;
        } else if (y === 'Equals') {
          return 1;
        }
        return x < y ? -1 : 1;
      }
    );
  }

  /**
   * This method should be used to iterate through all rules encoded by the
   * ruleTypesToInputs field. To update the ruleTypesToInputs, the
   * updateRuleTypesToInputs() methods takes in a list of Rules.
   */
  getRulesAsList(): Rule[] {
    const rules = [];

    AnswerGroup.getRuleTypesInDisplayOrder(this.ruleTypesToInputs).forEach(
      ruleType => {
        this.ruleTypesToInputs[ruleType].ruleInputs.forEach(ruleInput => {
          rules.push(this._ruleObjectFactory.createNew(ruleType, ruleInput));
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
    private ruleObjectFactory: RuleObjectFactory,
    private subtitledVariableLengthListOfRuleInputsObjectFactory:
      SubtitledVariableLengthListOfRuleInputsObjectFactory) {}
  /**
   * Creates a AnswerGroup object, with empty ruleTypesToInputs. The
   * updateRuleTypesToInputs() should be subsequently used to populate the
   * rules.
   * @param outcome The AnswerGroup outcome.
   * @param trainingData The AnswerGroup training data.
   * @param taggedSkillMisconceptionId The AnswerGroup tagged skill
   *  misconception id.
   */
  createNew(
      outcome: Outcome, trainingData: InteractionAnswer,
      taggedSkillMisconceptionId: string): AnswerGroup {
    return new AnswerGroup(
      {}, outcome, trainingData, taggedSkillMisconceptionId,
      this.ruleObjectFactory);
  }

  createFromBackendDict(
      answerGroupBackendDict: AnswerGroupBackendDict): AnswerGroup {
    const ruleTypesToInputs = {};
    Object.keys(answerGroupBackendDict.rule_types_to_inputs).forEach(
      ruleType => {
        ruleTypesToInputs[ruleType] = (
          this.subtitledVariableLengthListOfRuleInputsObjectFactory
            .createFromBackendDict(
              answerGroupBackendDict.rule_types_to_inputs[ruleType])
        );
      }
    );

    return new AnswerGroup(
      ruleTypesToInputs,
      this.outcomeObjectFactory.createFromBackendDict(
        answerGroupBackendDict.outcome),
      answerGroupBackendDict.training_data,
      answerGroupBackendDict.tagged_skill_misconception_id,
      this.ruleObjectFactory);
  }
}

angular.module('oppia').factory(
  'AnswerGroupObjectFactory', downgradeInjectable(AnswerGroupObjectFactory));
