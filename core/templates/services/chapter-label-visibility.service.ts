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
 * @fileoverview Service for maintaining the visibility of the "New" chapter
 * label in the learner view when serialChapterLearnerFeatureFlag is turned on.
 */

import {Injectable} from '@angular/core';
import {StoryNode} from 'domain/story/story-node.model';
import {StorySummary} from 'domain/story/story-summary.model';

@Injectable({
  providedIn: 'root',
})
export class ChapterLabelVisibilityService {
  /**
   * Returns true if the chapter was published within 28 days and not yet visited.
   */
  isNewChapterLabelVisible(
    storyNode: StoryNode,
    storySummary: StorySummary
  ): boolean {
    const firstPublicationTimestampMsecs =
      storyNode?.getFirstPublicationDateMsecs();
    if (!firstPublicationTimestampMsecs) {
      return false;
    }

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const daysSinceFirstPublication =
      (Date.now() - Number(firstPublicationTimestampMsecs)) /
      millisecondsPerDay;

    const visitedChapterTitles = storySummary.getVisitedChapterTitles() || [];

    const isChapterRecentlyPublished = daysSinceFirstPublication < 28;
    const isChapterUnvisited = !visitedChapterTitles.includes(
      storyNode.getTitle()
    );

    return isChapterRecentlyPublished && isChapterUnvisited;
  }
}
