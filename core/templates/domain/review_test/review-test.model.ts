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
 * @fileoverview Frontend model for review test.
 */

interface SkillDescriptions {
  [skillId: string]: string;
}

export interface ReviewTestBackendDict {
  story_name: string;
  skill_descriptions: SkillDescriptions;
}

export class ReviewTest {
  constructor(
    public storyName: string,
    public skillDescriptions: SkillDescriptions
  ) {}

  static createFromBackendDict(backendDict: ReviewTestBackendDict): ReviewTest {
    return new ReviewTest(
      backendDict.story_name,
      backendDict.skill_descriptions
    );
  }
}
