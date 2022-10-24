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

import { Question } from "domain/question/QuestionObjectFactory";

export class DiagnosticTestTopicStateData {
  _numberOfAttemptedQuestion: number;
  _skillIdToQuestionsList: {[skillId: string]: Question[]};
  _currentSkill: string;
  _lifeLineIsConsumed: boolean;
  _topicIsPassed: boolean;
  _diagnosticTestSkills: string[];
  _currenSkillIndex: number;
  _testedSkillIds: string[];
  _currentQuestion: Question;

  constructor(skillIdToQuestions) {
    this._numberOfAttemptedQuestion = 0;
    this._currenSkillIndex = 0;
    this._lifeLineIsConsumed = false;
    this._testedSkillIds = [];
    this._diagnosticTestSkills = Object.keys(this._skillIdToQuestionsList);
    this._skillIdToQuestionsList = skillIdToQuestions;
  }

  recordCorrectAttemptForCurrentQuestion(): void {
    this._testedSkillIds.push(this._currentSkill);
    this._numberOfAttemptedQuestion += 1;
    this._currenSkillIndex += 1;
    if (this._currenSkillIndex >= this._diagnosticTestSkills.length) {
      this._topicIsPassed = true;
    }
    this._currentSkill = this._diagnosticTestSkills[this._currenSkillIndex];
  }

  recordIncorrectAttemptForCurrentQuestion(): void {
    this._numberOfAttemptedQuestion += 1;
    if (this._lifeLineIsConsumed) {
      this._testedSkillIds.push(this._currentSkill);
      this._topicIsPassed = false;
    } else {
      this._lifeLineIsConsumed = true;
    }
  }

  getNextQuestion(): Question {
    if (this._lifeLineIsConsumed) {
      this._currentQuestion = (
        this._skillIdToQuestionsList[this._currentSkill][1]);
    } else {
      this._currentQuestion = (
        this._skillIdToQuestionsList[this._currentSkill][0]);
    }
    return this._currentQuestion;
  }

  isTopicPassed(): boolean {
    return this._topicIsPassed;
  }

  isTopicCompletelyTested(): boolean {
    return (
      JSON.stringify(this._testedSkillIds) ===
      JSON.stringify(this._diagnosticTestSkills)
    );
  }

  getTotalNumberOfAttemptedQuestions(): number {
    return this._numberOfAttemptedQuestion;
  }
}
