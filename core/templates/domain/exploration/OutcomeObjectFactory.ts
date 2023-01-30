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
 * @fileoverview Factory for creating new frontend instances of Outcome
 * domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import {
  SubtitledHtmlBackendDict,
  SubtitledHtml
} from 'domain/exploration/subtitled-html.model';
import { ParamChangeBackendDict } from
  'domain/exploration/ParamChangeObjectFactory';
import { BaseTranslatableObject } from 'domain/objects/BaseTranslatableObject.model';

export interface OutcomeBackendDict {
  'dest': string;
  'dest_if_really_stuck': string | null;
  'feedback': SubtitledHtmlBackendDict;
  'labelled_as_correct': boolean;
  'param_changes': readonly ParamChangeBackendDict[];
  'refresher_exploration_id': string | null;
  'missing_prerequisite_skill_id': string | null;
}

export class Outcome extends BaseTranslatableObject {
  dest: string;
  destIfReallyStuck: string | null;
  feedback: SubtitledHtml;
  labelledAsCorrect: boolean;
  paramChanges: readonly ParamChangeBackendDict[];
  refresherExplorationId: string | null;
  missingPrerequisiteSkillId: string | null;
  constructor(
      dest: string, destIfReallyStuck: string | null, feedback: SubtitledHtml,
      labelledAsCorrect: boolean,
      paramChanges: readonly ParamChangeBackendDict[],
      refresherExplorationId: string | null,
      missingPrerequisiteSkillId: string | null) {
    super();

    this.dest = dest;
    this.destIfReallyStuck = destIfReallyStuck;
    this.feedback = feedback;
    this.labelledAsCorrect = labelledAsCorrect;
    this.paramChanges = paramChanges;
    this.refresherExplorationId = refresherExplorationId;
    this.missingPrerequisiteSkillId = missingPrerequisiteSkillId;
  }

  getTranslatableFields(): SubtitledHtml[] {
    return [this.feedback];
  }

  setDestination(newValue: string): void {
    this.dest = newValue;
  }

  toBackendDict(): OutcomeBackendDict {
    return {
      dest: this.dest,
      dest_if_really_stuck: this.destIfReallyStuck,
      feedback: this.feedback.toBackendDict(),
      labelled_as_correct: this.labelledAsCorrect,
      param_changes: this.paramChanges,
      refresher_exploration_id: this.refresherExplorationId,
      missing_prerequisite_skill_id: this.missingPrerequisiteSkillId
    };
  }

  hasNonemptyFeedback(): boolean {
    return this.feedback.html.trim() !== '';
  }

  /**
   * Returns true iff an outcome has a self-loop, no feedback, and no
   * refresher exploration.
   */
  isConfusing(currentStateName: string): boolean {
    return (
      this.dest === currentStateName &&
      !this.hasNonemptyFeedback() &&
      this.refresherExplorationId === null
    );
  }
}

@Injectable({
  providedIn: 'root'
})
export class OutcomeObjectFactory {
  constructor() {}

  createNew(
      dest: string, feedbackTextId: string, feedbackText: string,
      paramChanges: readonly ParamChangeBackendDict[]
  ): Outcome {
    return new Outcome(
      dest,
      null,
      SubtitledHtml.createDefault(
        feedbackText, feedbackTextId),
      false,
      paramChanges,
      null,
      null);
  }

  createFromBackendDict(outcomeDict: OutcomeBackendDict): Outcome {
    return new Outcome(
      outcomeDict.dest,
      outcomeDict.dest_if_really_stuck,
      SubtitledHtml.createFromBackendDict(
        outcomeDict.feedback),
      outcomeDict.labelled_as_correct,
      outcomeDict.param_changes,
      outcomeDict.refresher_exploration_id,
      outcomeDict.missing_prerequisite_skill_id);
  }
}

angular.module('oppia').factory(
  'OutcomeObjectFactory', downgradeInjectable(OutcomeObjectFactory));
