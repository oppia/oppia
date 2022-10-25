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
 * @fileoverview Diagnostic test topic state model.
 */

import { Question } from 'domain/question/QuestionObjectFactory';

export interface SkillIdToQuestions {
  [skillId: string]: Question[];
}

export class DiagnosticTestTopicStateData {
  // The field keeps track of the number of attempted questions on a topic.
  _numberOfAttemptedQuestion: number;

  // A dict with topic ID as key and Question list as value.
  _skillIdToQuestionsList: SkillIdToQuestions;

  // Current topic ID from which the questions were presented in the
  // diagnostic test.
  _currentSkillId: string;

  // A boolean variable that keeps track of whether a wrong attempt has
  // already been made in any previous questions. This lifeline option
  // provides learners to attempt another question from the same skill if the
  // earlier one has been attempted incorrectly. Attempting a question
  // incorrectly after the lifeline has been used, then the topic is
  // marked as failed.
  _lifeLineIsConsumed: boolean;

  // A boolean variable to keep track of whether the topic is passed or failed.
  _topicIsPassed: boolean;

  // A list of diagnostic test skill IDs associated with a topic.
  _diagnosticTestSkillIds: string[];

  // An integer recording the index for current skill Id.
  _currenSkillIndex: number;

  // A list of skill IDs that are passed by the learner. Passing a skill means
  // the learner has answered the question correctly, which is associated with
  // the given skill ID.
  _testedSkillIds: string[];

  // A field that keeps track of the current question that the learner
  // is facing.
  _currentQuestion!: Question;

  constructor(skillIdToQuestions: SkillIdToQuestions) {
    this._numberOfAttemptedQuestion = 0;
    this._currenSkillIndex = 0;
    this._lifeLineIsConsumed = false;
    this._testedSkillIds = [];
    this._topicIsPassed = false;
    this._skillIdToQuestionsList = skillIdToQuestions;
    this._diagnosticTestSkillIds = Object.keys(this._skillIdToQuestionsList);
    this._currentSkillId = this._diagnosticTestSkillIds[this._currenSkillIndex];
  }

  recordCorrectAttemptForCurrentQuestion(): void {
    this._testedSkillIds.push(this._currentSkillId);
    this._numberOfAttemptedQuestion += 1;
    this._currenSkillIndex += 1;
    if (this._currenSkillIndex >= this._diagnosticTestSkillIds.length) {
      this._topicIsPassed = true;
    }
    this._currentSkillId = this._diagnosticTestSkillIds[this._currenSkillIndex];
  }

  recordIncorrectAttemptForCurrentQuestion(): void {
    this._numberOfAttemptedQuestion += 1;
    if (this._lifeLineIsConsumed) {
      this._testedSkillIds.push(this._currentSkillId);
      this._topicIsPassed = false;
    } else {
      this._lifeLineIsConsumed = true;
    }
  }

  getNextQuestion(): Question {
    if (this._lifeLineIsConsumed) {
      this._currentQuestion = (
        this._skillIdToQuestionsList[this._currentSkillId][1]);
    } else {
      this._currentQuestion = (
        this._skillIdToQuestionsList[this._currentSkillId][0]);
    }
    return this._currentQuestion;
  }

  isTopicPassed(): boolean {
    return this._topicIsPassed;
  }

  isTopicCompletelyTested(): boolean {
    return (
      JSON.stringify(this._testedSkillIds) ===
      JSON.stringify(this._diagnosticTestSkillIds)
    );
  }

  getTotalNumberOfAttemptedQuestions(): number {
    return this._numberOfAttemptedQuestion;
  }
}
