// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for tracking and updating the number of chapters
 * a learner has completed.
 *
 * This service encapsulates logic related to learner chapter completion
 * progress and exposes methods to access the current count and completion state.
 */

import {Injectable} from '@angular/core';
import {LearnerDashboardBackendApiService} from 'domain/learner_dashboard/learner-dashboard-backend-api.service';

@Injectable({
  providedIn: 'root',
})
export class ChapterProgressService {
  completedChaptersCount!: number;
  chapterIsCompletedForTheFirstTime: boolean = false;

  constructor(
    private learnerDashboardBackendApiService: LearnerDashboardBackendApiService
  ) {}

  updateCompletedChaptersCount(
    checkForFirstTimeCompletion: boolean = false
  ): void {
    this.learnerDashboardBackendApiService
      .fetchLearnerCompletedChaptersCountDataAsync()
      .then(data => {
        const newCount = data.completedChaptersCount;

        if (checkForFirstTimeCompletion) {
          if (newCount !== this.completedChaptersCount) {
            this.chapterIsCompletedForTheFirstTime = true;
          }
        }

        this.completedChaptersCount = newCount;
      });
  }

  getCompletedChaptersCount(): number {
    return this.completedChaptersCount;
  }

  setCompletedChaptersCount(count: number): void {
    this.completedChaptersCount = count;
  }

  getChapterCompletedForTheFirstTime(): boolean {
    return this.chapterIsCompletedForTheFirstTime;
  }

  setChapterCompletedForTheFirstTime(isCompleted: boolean): void {
    this.chapterIsCompletedForTheFirstTime = isCompleted;
  }
}
