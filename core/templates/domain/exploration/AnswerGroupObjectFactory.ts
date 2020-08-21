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
  'rule_types_to_subtitled_inputs': RuleInputsBackendDict;
  'outcome': OutcomeBackendDict;
  'training_data': InteractionAnswer;
  'tagged_skill_misconception_id': string;
}

export class AnswerGroup {
  private _ruleObjectFactory;

  ruleTypesToSubtitledInputs: RuleInputs;
  outcome: Outcome;
  trainingData: InteractionAnswer;
  taggedSkillMisconceptionId: string;
  constructor(
      ruleTypesToSubtitledInputs: RuleInputs,
      outcome: Outcome, trainingData: InteractionAnswer,
      taggedSkillMisconceptionId: string,
      _ruleObjectFactory: RuleObjectFactory) {
    this.ruleTypesToSubtitledInputs = ruleTypesToSubtitledInputs;
    this.outcome = outcome;
    this.trainingData = trainingData;
    this.taggedSkillMisconceptionId = taggedSkillMisconceptionId;
    this._ruleObjectFactory = _ruleObjectFactory;
  }

  toBackendDict(): AnswerGroupBackendDict {
    const ruleTypesToSubtitledInputsBackendDict = {};

    Object.keys(this.ruleTypesToSubtitledInputs).forEach(
      ruleType => {
        ruleTypesToSubtitledInputsBackendDict[ruleType] = (
          this.ruleTypesToSubtitledInputs[ruleType].toBackendDict()
        );
      }
    );

    return {
      rule_types_to_subtitled_inputs: ruleTypesToSubtitledInputsBackendDict,
      outcome: this.outcome.toBackendDict(),
      training_data: this.trainingData,
      tagged_skill_misconception_id: this.taggedSkillMisconceptionId
    };
  }

  addRule(rule: Rule): void {
    if (!this.ruleTypesToSubtitledInputs.hasOwnProperty(rule.type)) {
      this.ruleTypesToSubtitledInputs[rule.type] = (
        new SubtitledVariableLengthListOfRuleInputs([], null));
    }
    this.ruleTypesToSubtitledInputs[rule.type].ruleInputs.push(rule.inputs);
  }

  updateRuleTypesToSubtitledInputs(rules: Rule[]): void {
    this.ruleTypesToSubtitledInputs = {};
    rules.forEach(this.addRule.bind(this));
  }

  static getRuleTypesInDisplayOrder(
      ruleTypesToSubtitledInputs: RuleInputs): string[] {
    // Sort rule types so that Equals always is first and tempRule is always
    // last, followed by all other rule types sorted alphabetically. tempRule
    // is used in answer-group-editor to create new rules.
    return Object.keys(ruleTypesToSubtitledInputs).sort(
      (x, y) => {
        if (x === 'Equals' || y === 'tempRule') {
          return -1;
        } else if (y === 'Equals' || x === 'tempRule') {
          return 1;
        }
        return x < y ? -1 : 1;
      }
    );
  }

  /**
   * This method should be used to iterate through all rules encoded by the
   * ruleTypesToSubtitledInputs field. To update the ruleTypesToSubtitledInputs,
   * the updateRuleTypesToSubtitledInputs() methods takes in a list of Rules.
   */
  getRulesAsList(): Rule[] {
    const rules = [];

    AnswerGroup.getRuleTypesInDisplayOrder(
      this.ruleTypesToSubtitledInputs
    ).forEach(
      ruleType => {
        this.ruleTypesToSubtitledInputs[ruleType].ruleInputs.forEach(
          ruleInput => {
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
   * Creates a AnswerGroup object, with empty ruleTypesToSubtitledInputs. The
   * updateRuleTypesToSubtitledInputs() should be subsequently used to populate
   * the rules.
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
    const ruleTypesToSubtitledInputs = {};
    Object.keys(answerGroupBackendDict.rule_types_to_subtitled_inputs).forEach(
      ruleType => {
        ruleTypesToSubtitledInputs[ruleType] = (
          this.subtitledVariableLengthListOfRuleInputsObjectFactory
            .createFromBackendDict(
              answerGroupBackendDict.rule_types_to_subtitled_inputs[ruleType])
        );
      }
    );

    return new AnswerGroup(
      ruleTypesToSubtitledInputs,
      this.outcomeObjectFactory.createFromBackendDict(
        answerGroupBackendDict.outcome),
      answerGroupBackendDict.training_data,
      answerGroupBackendDict.tagged_skill_misconception_id,
      this.ruleObjectFactory);
  }
}

angular.module('oppia').factory(
  'AnswerGroupObjectFactory', downgradeInjectable(AnswerGroupObjectFactory));
