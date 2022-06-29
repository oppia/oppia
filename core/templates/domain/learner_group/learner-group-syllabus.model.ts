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

import { StorySummary, StorySummaryBackendDict }
  from 'domain/story/story-summary.model';
import { SubtopicPageSummary, SubtopicPageSummaryBackendDict }
  from './subtopic-page-summary.model';

/**
 * @fileoverview Model for displaying short summaries of learner group
 * domain objects.
 */

export interface LearnerGroupSyllabusBackendDict {
  'learner_group_id': string;
  'stories_summaries': StorySummaryBackendDict[];
  'subtopic_page_summaries': SubtopicPageSummaryBackendDict[];
}

export class LearnerGroupSyllabus {
  _learnerGroupId: string;
  _storySummaries: StorySummary[];
  _subtopicPageSummaries: SubtopicPageSummary[];

  constructor(
      learnerGroupId: string,
      storySummaries: StorySummary[],
      subtopicPageSummaries: SubtopicPageSummary[]) {
    this._learnerGroupId = learnerGroupId;
    this._storySummaries = storySummaries;
    this._subtopicPageSummaries = subtopicPageSummaries;
  }

  get learnerGroupId(): string {
    return this._learnerGroupId;
  }

  get storySummaries(): StorySummary[] {
    return this._storySummaries;
  }

  get subtopicPageSummaries(): SubtopicPageSummary[] {
    return this._subtopicPageSummaries;
  }

  static createFromBackendDict(
      backendDict: LearnerGroupSyllabusBackendDict
  ): LearnerGroupSyllabus {
    return new LearnerGroupSyllabus(
      backendDict.learner_group_id,
      backendDict.stories_summaries.map(
        (storySummary) => StorySummary.createFromBackendDict(storySummary)),
      backendDict.subtopic_page_summaries.map(
        (subtopicPageSummary) => SubtopicPageSummary.createFromBackendDict(
          subtopicPageSummary)
      )
    );
  }
}
