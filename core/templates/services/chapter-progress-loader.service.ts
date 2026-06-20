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
 * @fileoverview Service for managing and computing progress per chapter
 * (exploration) in the learner dashboard.
 */

import {Injectable} from '@angular/core';
import {StoryViewerBackendApiService} from 'domain/story_viewer/story-viewer-backend-api.service';
import {ChapterProgressSummary} from 'domain/exploration/chapter-progress-summary.model';
import {UserService} from 'services/user.service';

export interface LessonProgressData {
  [lessonId: string]: number;
}

@Injectable({
  providedIn: 'root',
})
export class ChapterProgressLoaderService {
  lessonProgress: LessonProgressData = {};
  chapterProgressByExpId: Map<string, ChapterProgressSummary> = new Map();
  loadedStoryIds: Set<string> = new Set();

  constructor(
    private storyViewerBackendApiService: StoryViewerBackendApiService,
    private userService: UserService
  ) {}

  /**
   * Fetch and cache chapter progress for a story's chapters.
   * This loads the checkpoint progress data from the backend.
   * @param storyId - The story ID
   * @param explorationIds - Array of exploration IDs in this story (chapters)
   */
  async loadChapterProgressForStory(
    storyId: string,
    explorationIds: string[]
  ): Promise<void> {
    try {
      if (this.loadedStoryIds.has(storyId)) {
        return;
      }

      const userInfo = await this.userService.getUserInfoAsync();
      const username = userInfo.getUsername();

      if (!username) {
        console.error('Cannot load chapter progress: user not logged in');
        return;
      }

      const progressSummaries =
        await this.storyViewerBackendApiService.fetchProgressInStoriesChapters(
          username,
          [storyId]
        );

      progressSummaries.forEach((summary, index) => {
        if (index < explorationIds.length) {
          const explorationId = explorationIds[index];
          this.chapterProgressByExpId.set(explorationId, summary);
        }
      });

      this.loadedStoryIds.add(storyId);
    } catch (err) {
      console.error('Error loading chapter progress for story:', storyId, err);
    }
  }

  /**
   * Get chapter progress summary for a specific exploration.
   */
  getChapterProgressSummary(
    explorationId: string
  ): ChapterProgressSummary | null {
    return this.chapterProgressByExpId.get(explorationId) || null;
  }

  /**
   * Calculates the progress percentage for a given exploration.
   * Returns cached value if available, otherwise computes from chapter progress data.
   */
  computeLessonProgress(explorationId: string): number {
    if (this.lessonProgress[explorationId] !== undefined) {
      return this.lessonProgress[explorationId];
    }

    const chapterProgress = this.chapterProgressByExpId.get(explorationId);
    if (!chapterProgress) {
      this.lessonProgress[explorationId] = 0;
      return 0;
    }

    const totalCheckpoints = chapterProgress.totalCheckpoints;
    const visitedCheckpoints = chapterProgress.visitedCheckpoints - 1;
    if (chapterProgress.isChapterComplete) {
      this.lessonProgress[explorationId] = 100;
      return 100;
    }

    const progress =
      totalCheckpoints > 0
        ? Math.floor((visitedCheckpoints / totalCheckpoints) * 100)
        : 0;

    this.lessonProgress[explorationId] = progress;
    return progress;
  }

  /**
   * Returns already computed progress (if cached).
   */
  getLessonProgress(explorationId: string): number {
    return this.lessonProgress[explorationId] ?? 0;
  }

  /**
   * Expose all progress data.
   */
  getAllProgress(): LessonProgressData {
    return this.lessonProgress;
  }

  isChapterCompleted(explorationId: string): boolean {
    const chapterProgress = this.chapterProgressByExpId.get(explorationId);
    return chapterProgress?.isChapterComplete ?? false;
  }
}
