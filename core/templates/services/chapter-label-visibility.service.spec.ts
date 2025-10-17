// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
  let storySummary: StorySummary;
  let storyNode: StoryNode;

  const RECENT_PUB_DATE = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const CHAPTER_TITLE = 'The Chapter Title for Testing';

  const chapterDetails = {
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
    storySummary = jasmine.createSpyObj<StorySummary>('StorySummary', [
      'getVisitedChapterTitles',
      'isNodeCompleted',
    ]);
    Object.setPrototypeOf(storySummary, StorySummary.prototype);
    storyNode = StoryNode.createFromBackendDict(chapterDetails);
    (storySummary.getVisitedChapterTitles as jasmine.Spy).and.returnValue([
      'Other Chapter Title',
      CHAPTER_TITLE,
    ]);
  });

  it('should return true if chapter is new and not visited', () => {
    const node = jasmine.createSpyObj<StoryNode>('StoryNode', [
      'getFirstPublicationDateMsecs',
      'getTitle',
    ]);
    node.getFirstPublicationDateMsecs.and.returnValue(
      Date.now() - 5 * 24 * 60 * 60 * 1000
    );
    node.getTitle.and.returnValue('Intro');

    const summary = jasmine.createSpyObj<StorySummary>('StorySummary', [
      'getVisitedChapterTitles',
    ]);
    summary.getVisitedChapterTitles.and.returnValue([]);

    expect(service.isNewChapterLabelVisible(node, summary)).toBeTrue();
  });

  it('should return false if chapter is older than 28 days', () => {
    const node = jasmine.createSpyObj<StoryNode>('StoryNode', [
      'getFirstPublicationDateMsecs',
      'getTitle',
    ]);
    node.getFirstPublicationDateMsecs.and.returnValue(
      Date.now() - 40 * 24 * 60 * 60 * 1000
    );
    node.getTitle.and.returnValue('Intro');

    const summary = jasmine.createSpyObj<StorySummary>('StorySummary', [
      'getVisitedChapterTitles',
    ]);
    summary.getVisitedChapterTitles.and.returnValue([]);

    expect(service.isNewChapterLabelVisible(node, summary)).toBeFalse();
  });

  it('should return false if chapter is visited', () => {
    const node = jasmine.createSpyObj<StoryNode>('StoryNode', [
      'getFirstPublicationDateMsecs',
      'getTitle',
    ]);
    node.getFirstPublicationDateMsecs.and.returnValue(
      Date.now() - 5 * 24 * 60 * 60 * 1000
    );
    node.getTitle.and.returnValue('Intro');

    const summary = jasmine.createSpyObj<StorySummary>('StorySummary', [
      'getVisitedChapterTitles',
    ]);
    summary.getVisitedChapterTitles.and.returnValue(['Intro']);

    expect(service.isNewChapterLabelVisible(node, summary)).toBeFalse();
  });

  it('should return false if publication date is missing', () => {
    const node = jasmine.createSpyObj<StoryNode>('StoryNode', [
      'getFirstPublicationDateMsecs',
      'getTitle',
    ]);
    node.getFirstPublicationDateMsecs.and.returnValue(null);
    node.getTitle.and.returnValue('Intro');

    const summary = jasmine.createSpyObj<StorySummary>('StorySummary', [
      'getVisitedChapterTitles',
    ]);
    summary.getVisitedChapterTitles.and.returnValue([]);

    expect(service.isNewChapterLabelVisible(node, summary)).toBeFalse();
  });
});
