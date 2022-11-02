// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview The model keeps track of the current topic that is being
 * tested in any instance of the diagnostic test. This model maintains the
 * skill IDs associated with which the next question should be presented
 * in the diagnostic test.
 */

import { Question } from 'domain/question/QuestionObjectFactory';

export interface SkillIdToQuestionsDict {
  [skillId: string]: {
    mainQuestion: Question;
    backupQuestion: Question;
  };
}

export class DiagnosticTestCurrentTopicStatusModel {
  // A dict with skill ID as key and a nested dict as value. The nested dict
  // contains the main question and back question as two keys and the Question
  // object as the values of each. The main question is the first question
  // that the learner encounters in the diagnostic test and if they attempt
  // the main question incorrectly the backup question will be presented.
  // Otherwise, the backup question will not be presented. The difficulty level
  // for both the main question and the backup question are the same.
  _skillIdToQuestionsDict: SkillIdToQuestionsDict;

  // A list of diagnostic test skill IDs from which questions will be presented
  // to the learners. The pending skill IDs are the ones which have not yet
  // been tested in the diagnostic test.
  _pendingSkillIdsToTest: string[];

  // A boolean variable that keeps track of whether a wrong attempt has
  // already been made in any previous questions. This lifeline option
  // allows learners to attempt another question from the same skill
  // (backup question) if the earlier one has been attempted incorrectly.
  // Attempting a question incorrectly after the lifeline has been used results
  // in the topic being marked as failed.
  _lifelineIsConsumed: boolean;

  // A dict with skill ID as key and a boolean as value. The boolean value
  // represents whether the given skill passed or failed in the diagnostic test.
  // Passing a skill means the learner has attempted the linked question
  // correctly, otherwise the skill is marked as failed. Initially, all the
  // skill ID keys map to false values, which represent that the skills are
  // not yet passed.
  _skillIdToTestStatus: {[skillId: string]: boolean} = {};

  constructor(skillIdToQuestionsDict: SkillIdToQuestionsDict) {
    this._pendingSkillIdsToTest = Object.keys(skillIdToQuestionsDict);
    this._skillIdToQuestionsDict = skillIdToQuestionsDict;

    this._lifelineIsConsumed = false;
    for (let skillId of this._pendingSkillIdsToTest) {
      this._skillIdToTestStatus[skillId] = false;
    }
  }

  recordCorrectAttempt(skillId: string): void {
    this._skillIdToTestStatus[skillId] = true;
  }

  recordIncorrectAttempt(skillId: string): void {
    if (this._lifelineIsConsumed) {
      this._skillIdToTestStatus[skillId] = false;
      // Attempting two incorrect answers should mark the topic as failed so
      // there are no eligible skill IDs left for testing.
      this._pendingSkillIdsToTest = [];
    } else {
      this._lifelineIsConsumed = true;
    }
  }

  getNextSkill(): string {
    return this._pendingSkillIdsToTest.shift() || '';
  }

  getNextQuestion(skillId: string): Question {
    if (this._lifelineIsConsumed) {
      return this._skillIdToQuestionsDict[skillId].backupQuestion;
    } else {
      return this._skillIdToQuestionsDict[skillId].mainQuestion;
    }
  }

  isTopicPassed(): boolean {
    for (let skillID in this._skillIdToTestStatus) {
      if (!this._skillIdToTestStatus[skillID]) {
        return false;
      }
    }
    return true;
  }

  isTopicCompletelyTested(): boolean {
    return this._pendingSkillIdsToTest.length === 0;
  }
}
