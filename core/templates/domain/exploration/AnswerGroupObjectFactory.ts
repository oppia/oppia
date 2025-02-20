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

import {Injectable} from '@angular/core';

import {InteractionAnswer} from 'interactions/answer-defs';
import {
  Outcome,
  OutcomeBackendDict,
  OutcomeObjectFactory,
} from 'domain/exploration/OutcomeObjectFactory';
import {Rule, RuleBackendDict} from 'domain/exploration/rule.model';
import {BaseTranslatableObject} from 'domain/objects/BaseTranslatableObject.model';

export interface AnswerGroupBackendDict {
  rule_specs: RuleBackendDict[];
  outcome: OutcomeBackendDict;
  training_data: readonly InteractionAnswer[];
  // Note: Here the type 'null' comes from file
  // 'add-answer-group-modal.controller.ts'. Property
  // 'tmpTaggedSkillMisconceptionId' has been initialized
  // as 'null' there.
  tagged_skill_misconception_id: string | null;
}

export class AnswerGroup extends BaseTranslatableObject {
  rules: Rule[];
  outcome: Outcome;
  trainingData: readonly InteractionAnswer[];
  taggedSkillMisconceptionId: string | null;
  constructor(
    rules: Rule[],
    outcome: Outcome,
    trainingData: readonly InteractionAnswer[],
    taggedSkillMisconceptionId: string | null
  ) {
    super();
    this.rules = rules;
    this.outcome = outcome;
    this.trainingData = trainingData;
    this.taggedSkillMisconceptionId = taggedSkillMisconceptionId;
  }

  getTranslatableObjects(): BaseTranslatableObject[] {
    return [this.outcome, ...this.rules];
  }

  getContentIdToHtml(): {[contentId: string]: string} {
    return this.outcome.getContentIdToHtml();
  }

  toBackendDict(): AnswerGroupBackendDict {
    return {
      rule_specs: this.rules.map(rule => rule.toBackendDict()),
      outcome: this.outcome.toBackendDict(),
      training_data: this.trainingData,
      tagged_skill_misconception_id: this.taggedSkillMisconceptionId,
    };
  }
}

@Injectable({
  providedIn: 'root',
})
export class AnswerGroupObjectFactory {
  constructor(private outcomeObjectFactory: OutcomeObjectFactory) {}

  generateRulesFromBackendDict(
    ruleBackendDicts: RuleBackendDict[],
    interactionId: string
  ): Rule[] {
    return ruleBackendDicts.map(ruleBackendDict =>
      Rule.createFromBackendDict(ruleBackendDict, interactionId)
    );
  }

  createNew(
    rules: Rule[],
    outcome: Outcome,
    trainingData: readonly InteractionAnswer[],
    taggedSkillMisconceptionId: string | null
  ): AnswerGroup {
    return new AnswerGroup(
      rules,
      outcome,
      trainingData,
      taggedSkillMisconceptionId
    );
  }

  createFromBackendDict(
    answerGroupBackendDict: AnswerGroupBackendDict,
    interactionId: string
  ): AnswerGroup {
    return new AnswerGroup(
      this.generateRulesFromBackendDict(
        answerGroupBackendDict.rule_specs,
        interactionId
      ),
      this.outcomeObjectFactory.createFromBackendDict(
        answerGroupBackendDict.outcome
      ),
      answerGroupBackendDict.training_data,
      answerGroupBackendDict.tagged_skill_misconception_id
    );
  }
}
