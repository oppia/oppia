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
 * @fileoverview Model for displaying short summaries of learner group
 * domain objects.
 */

export interface ShortLearnerGroupSummaryBackendDict {
  id: string;
  title: string;
  description: string;
  facilitator_usernames: string[];
  learners_count: number;
}

export class ShortLearnerGroupSummary {
  _id: string;
  _title: string;
  _description: string;
  _facilitatorUsernames: string[];
  _learnersCount: number;

  constructor(
    id: string,
    title: string,
    description: string,
    facilitatorUsernames: string[],
    learnersCount: number
  ) {
    this._id = id;
    this._title = title;
    this._description = description;
    this._facilitatorUsernames = facilitatorUsernames;
    this._learnersCount = learnersCount;
  }

  get id(): string {
    return this._id;
  }

  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get facilitatorUsernames(): string[] {
    return this._facilitatorUsernames;
  }

  get learnersCount(): number {
    return this._learnersCount;
  }

  static createFromBackendDict(
    shortLearnerGroupBackendDict: ShortLearnerGroupSummaryBackendDict
  ): ShortLearnerGroupSummary {
    return new ShortLearnerGroupSummary(
      shortLearnerGroupBackendDict.id,
      shortLearnerGroupBackendDict.title,
      shortLearnerGroupBackendDict.description,
      shortLearnerGroupBackendDict.facilitator_usernames,
      shortLearnerGroupBackendDict.learners_count
    );
  }
}
