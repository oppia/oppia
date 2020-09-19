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

import {
  SubtitledHtmlBackendDict,
  SubtitledHtml
} from 'domain/exploration/SubtitledHtml.model';
import { ParamChangeBackendDict } from 'domain/exploration/ParamChange.model';

export interface OutcomeBackendDict {
  'dest': string;
  'feedback': SubtitledHtmlBackendDict;
  'labelled_as_correct': boolean;
  'param_changes': ParamChangeBackendDict[];
  'refresher_exploration_id': string;
  'missing_prerequisite_skill_id': string;
}

export class Outcome {
  dest: string;
  feedback: SubtitledHtml;
  labelledAsCorrect: boolean;
  paramChanges: ParamChangeBackendDict[];
  refresherExplorationId: string;
  missingPrerequisiteSkillId: string;
  constructor(
      dest: string, feedback: SubtitledHtml, labelledAsCorrect: boolean,
      paramChanges: ParamChangeBackendDict[], refresherExplorationId: string,
      missingPrerequisiteSkillId: string) {
    this.dest = dest;
    this.feedback = feedback;
    this.labelledAsCorrect = labelledAsCorrect;
    this.paramChanges = paramChanges;
    this.refresherExplorationId = refresherExplorationId;
    this.missingPrerequisiteSkillId = missingPrerequisiteSkillId;
  }

  setDestination(newValue: string): void {
    this.dest = newValue;
  }

  toBackendDict(): OutcomeBackendDict {
    return {
      dest: this.dest,
      feedback: this.feedback.toBackendDict(),
      labelled_as_correct: this.labelledAsCorrect,
      param_changes: this.paramChanges,
      refresher_exploration_id: this.refresherExplorationId,
      missing_prerequisite_skill_id: this.missingPrerequisiteSkillId
    };
  }

  hasNonemptyFeedback(): boolean {
    return this.feedback.getHtml().trim() !== '';
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

  static createNew(
      dest: string, feedbackTextId: string, feedbackText: string,
      paramChanges: ParamChangeBackendDict[]): Outcome {
    return new Outcome(
      dest,
      SubtitledHtml.createDefault(
        feedbackText, feedbackTextId),
      false,
      paramChanges,
      null,
      null);
  }

  static createFromBackendDict(outcomeDict: OutcomeBackendDict): Outcome {
    return new Outcome(
      outcomeDict.dest,
      SubtitledHtml.createFromBackendDict(
        outcomeDict.feedback),
      outcomeDict.labelled_as_correct,
      outcomeDict.param_changes,
      outcomeDict.refresher_exploration_id,
      outcomeDict.missing_prerequisite_skill_id);
  }
}
