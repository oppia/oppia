// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Frontend model for skill summary domain objects.
 */

export interface AugmentedSkillSummaryBackendDict {
  'id': string;
  'description': string;
  'language_code': string;
  'version': number;
  'misconception_count': number;
  'worked_examples_count': number;
  'skill_model_created_on': number;
  'skill_model_last_updated': number;
  'topic_names': string[];
  'classroom_names': string[];
}

export class AugmentedSkillSummary {
  constructor(
    public id: string,
    public description: string,
    public languageCode: string,
    public version: number,
    public misconceptionCount: number,
    public workedExamplesCount: number,
    public skillModelCreatedOn: number,
    public skillModelLastUpdated: number,
    public topicNames: string[],
    public classroomNames: string[]) { }

  static createFromBackendDict(
      summaryDict: AugmentedSkillSummaryBackendDict): AugmentedSkillSummary {
    return new AugmentedSkillSummary(
      summaryDict.id,
      summaryDict.description,
      summaryDict.language_code,
      summaryDict.version,
      summaryDict.misconception_count,
      summaryDict.worked_examples_count,
      summaryDict.skill_model_created_on,
      summaryDict.skill_model_last_updated,
      summaryDict.topic_names,
      summaryDict.classroom_names);
  }
}
