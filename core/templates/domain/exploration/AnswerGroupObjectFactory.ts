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

import { Outcome, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { Rule, RuleObjectFactory } from
  'domain/exploration/RuleObjectFactory';

export class AnswerGroup {
  rules: Rule[];
  outcome: Outcome;
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'trainingData' is an array of dicts with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  trainingData: any;
  taggedSkillMisconceptionId: string;
  constructor(
      rules: Rule[], outcome: Outcome, trainingData: any,
      taggedSkillMisconceptionId: string) {
    this.rules = rules;
    this.outcome = outcome;
    this.trainingData = trainingData;
    this.taggedSkillMisconceptionId = taggedSkillMisconceptionId;
  }

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because the return type is a dict with underscore_cased keys
  // which give tslint errors against underscore_casing in favor of camelCasing.
  toBackendDict(): any {
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

  // TODO(#7165): Replace 'any' with the exact type. This has been typed
  // as 'any' since 'ruleBackendDicts' is a complex object with elements as keys
  // having varying types. An exact type needs tobe found.
  generateRulesFromBackend(ruleBackendDicts: any) {
    return ruleBackendDicts.map((ruleBackendDict: any) => {
      return this.ruleObjectFactory.createFromBackendDict(ruleBackendDict);
    });
  }

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'trainingData' is an array of dicts with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  createNew(
      rules: Rule[], outcome: Outcome, trainingData: any,
      taggedSkillMisconceptionId: string): AnswerGroup {
    return new AnswerGroup(
      rules, outcome, trainingData, taggedSkillMisconceptionId);
  }

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'answerGroupBackendDict' is a dict with underscore_cased keys
  // which give tslint errors against underscore_casing in favor of camelCasing.
  createFromBackendDict(answerGroupBackendDict: any): AnswerGroup {
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
