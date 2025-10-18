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
 * @fileoverview Unit tests for Chapter Label Visibility Service.
 */

import {ChapterLabelVisibilityService} from './chapter-label-visibility.service';
import {StoryNode} from 'domain/story/story-node.model';
import {StorySummary} from 'domain/story/story-summary.model';

describe('ChapterLabelVisibilityService', () => {
  let service: ChapterLabelVisibilityService;
  let storySummary: jasmine.SpyObj<StorySummary>;

  const RECENT_PUB_DATE = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const OLD_PUB_DATE = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const CHAPTER_TITLE = 'The Chapter Title for Testing';

  const baseChapterDetails = {
    id: 'node_1',
    title: CHAPTER_TITLE,
    description: 'desc',
    destination_node_ids: [],
    prerequisite_skill_ids: [],
    acquired_skill_ids: [],
    outline: '',
    exploration_id: 'exp_1',
    outline_is_finalized: true,
    thumbnail_filename: '',
    thumbnail_bg_color: '',
    status: 'Published',
    planned_publication_date_msecs: null,
    last_modified_msecs: null,
    first_publication_date_msecs: RECENT_PUB_DATE,
    unpublishing_reason: null,
  };

  beforeEach(() => {
    service = new ChapterLabelVisibilityService();
    storySummary = jasmine.createSpyObj('StorySummary', [
      'getVisitedChapterTitles',
      'isNodeCompleted',
    ]);
    Object.setPrototypeOf(storySummary, StorySummary.prototype);
  });

  it('should return false if chapter is new (<28 days) and visited', () => {
    const storyNode = StoryNode.createFromBackendDict({
      ...baseChapterDetails,
      first_publication_date_msecs: RECENT_PUB_DATE,
      title: CHAPTER_TITLE,
    });
    storySummary.getVisitedChapterTitles.and.returnValue([CHAPTER_TITLE]);

    const isVisible = service.isNewChapterLabelVisible(storyNode, storySummary);
    expect(isVisible).toBeFalse();
  });

  it('should return false if chapter is old (>=28 days) and visited', () => {
    const storyNode = StoryNode.createFromBackendDict({
      ...baseChapterDetails,
      first_publication_date_msecs: OLD_PUB_DATE,
      title: CHAPTER_TITLE,
    });
    storySummary.getVisitedChapterTitles.and.returnValue([CHAPTER_TITLE]);

    const isVisible = service.isNewChapterLabelVisible(storyNode, storySummary);
    expect(isVisible).toBeFalse();
  });

  it('should return false if chapter is old (>=28 days) and not visited', () => {
    const storyNode = StoryNode.createFromBackendDict({
      ...baseChapterDetails,
      first_publication_date_msecs: OLD_PUB_DATE,
      title: 'Unvisited Old Chapter',
    });
    storySummary.getVisitedChapterTitles.and.returnValue([]);

    const isVisible = service.isNewChapterLabelVisible(storyNode, storySummary);
    expect(isVisible).toBeFalse();
  });

  it('should return true if chapter is new (<28 days) and not visited', () => {
    const storyNode = StoryNode.createFromBackendDict({
      ...baseChapterDetails,
      first_publication_date_msecs: RECENT_PUB_DATE,
      title: 'A New, Unvisited Chapter',
    });
    storySummary.getVisitedChapterTitles.and.returnValue([]);

    const isVisible = service.isNewChapterLabelVisible(storyNode, storySummary);
    expect(isVisible).toBeTrue();
  });

  it('should return false if publication date is null', () => {
    const storyNode = StoryNode.createFromBackendDict({
      ...baseChapterDetails,
      first_publication_date_msecs: null,
      title: 'Some Chapter',
    });
    storySummary.getVisitedChapterTitles.and.returnValue([]);

    const isVisible = service.isNewChapterLabelVisible(storyNode, storySummary);
    expect(isVisible).toBeFalse();
  });
});
