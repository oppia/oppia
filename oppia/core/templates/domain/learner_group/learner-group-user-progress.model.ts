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

import {
  StorySummary,
  StorySummaryBackendDict,
} from 'domain/story/story-summary.model';
import {
  LearnerGroupSubtopicSummary,
  LearnerGroupSubtopicSummaryBackendDict,
} from './learner-group-subtopic-summary.model';

/**
 * @fileoverview Model for displaying instances of frontend learner group
 * user progress domain objects.
 */

export interface LearnerGroupUserProgressBackendDict {
  username: string;
  progress_sharing_is_turned_on: boolean;
  stories_progress: StorySummaryBackendDict[];
  subtopic_pages_progress: LearnerGroupSubtopicSummaryBackendDict[];
}

export class LearnerGroupUserProgress {
  _username: string;
  _progressSharingIsTurnedOn: boolean;
  _storiesProgress: StorySummary[];
  _subtopicsProgress: LearnerGroupSubtopicSummary[];

  constructor(
    username: string,
    progressSharingIsTurnedOn: boolean,
    storiesProgress: StorySummary[],
    subtopicsProgress: LearnerGroupSubtopicSummary[]
  ) {
    this._username = username;
    this._progressSharingIsTurnedOn = progressSharingIsTurnedOn;
    this._storiesProgress = storiesProgress;
    this._subtopicsProgress = subtopicsProgress;
  }

  get username(): string {
    return this._username;
  }

  get isProgressSharingTurnedOn(): boolean {
    return this._progressSharingIsTurnedOn;
  }

  get storiesProgress(): StorySummary[] {
    return this._storiesProgress;
  }

  get subtopicsProgress(): LearnerGroupSubtopicSummary[] {
    return this._subtopicsProgress;
  }

  static createFromBackendDict(
    progBackendDict: LearnerGroupUserProgressBackendDict
  ): LearnerGroupUserProgress {
    let storiesProgress: StorySummary[] = [];
    if (progBackendDict.stories_progress.length > 0) {
      storiesProgress = progBackendDict.stories_progress.map(
        storySummaryBackendDict =>
          StorySummary.createFromBackendDict(storySummaryBackendDict)
      );
    }

    let subtopicsProgress: LearnerGroupSubtopicSummary[] = [];
    if (progBackendDict.subtopic_pages_progress.length > 0) {
      subtopicsProgress = progBackendDict.subtopic_pages_progress.map(
        subtopicProgressBackendDict =>
          LearnerGroupSubtopicSummary.createFromBackendDict(
            subtopicProgressBackendDict
          )
      );
    }

    return new LearnerGroupUserProgress(
      progBackendDict.username,
      progBackendDict.progress_sharing_is_turned_on,
      storiesProgress,
      subtopicsProgress
    );
  }
}
