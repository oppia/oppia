// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Frontend Model for skill opportunity.
 */

export interface SkillOpportunityBackendDict {
  'id': string;
  'skill_description': string;
  'topic_name': string;
  'question_count': number;
}

export class SkillOpportunity {
  id: string;
  skillDescription: string;
  topicName: string;
  questionCount: number;

  constructor(
      skillId: string, skillDescription: string, topicName: string,
      questionCount: number) {
    this.id = skillId;
    this.skillDescription = skillDescription;
    this.topicName = topicName;
    this.questionCount = questionCount;
  }

  static createFromBackendDict(
      backendDict: SkillOpportunityBackendDict): SkillOpportunity {
    return new SkillOpportunity(
      backendDict.id, backendDict.skill_description, backendDict.topic_name,
      backendDict.question_count);
  }

  getSkillId(): string {
    return this.id;
  }

  getOpportunityHeading(): string {
    return this.skillDescription;
  }

  getOpportunitySubheading(): string {
    return this.topicName;
  }

  getQuestionCount(): number {
    return this.questionCount;
  }
}
