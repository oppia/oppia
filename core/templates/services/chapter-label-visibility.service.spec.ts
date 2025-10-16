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

  beforeEach(() => {
    service = new ChapterLabelVisibilityService();
  });

  it('should return true if chapter is new and not visited', () => {
    const now = Date.now();
    const storyNode = {
      getFirstPublicationDateMsecs: () => now - 5 * 24 * 60 * 60 * 1000,
      getTitle: () => 'Intro',
    } as StoryNode;
    const storySummary = {getVisitedChapterTitles: () => []} as StorySummary;

    expect(
      service.isNewChapterLabelVisible(storyNode, storySummary)
    ).toBeTrue();
  });

  it('should return false if older than 28 days', () => {
    const storyNode = {
      getFirstPublicationDateMsecs: () => Date.now() - 40 * 24 * 60 * 60 * 1000,
      getTitle: () => 'Intro',
    } as StoryNode;
    const storySummary = {getVisitedChapterTitles: () => []} as StorySummary;

    expect(
      service.isNewChapterLabelVisible(storyNode, storySummary)
    ).toBeFalse();
  });

  it('should return false if chapter is visited', () => {
    const now = Date.now();
    const storyNode = {
      getFirstPublicationDateMsecs: () => now - 5 * 24 * 60 * 60 * 1000,
      getTitle: () => 'Intro',
    } as StoryNode;
    const storySummary = {
      getVisitedChapterTitles: () => ['Intro'],
    } as StorySummary;

    expect(
      service.isNewChapterLabelVisible(storyNode, storySummary)
    ).toBeFalse();
  });

  it('should return false if first publication date is not available', () => {
    const storyNode = {
      getFirstPublicationDateMsecs: () => null,
      getTitle: () => 'Intro',
    } as StoryNode;
    const storySummary = {getVisitedChapterTitles: () => []} as StorySummary;

    expect(
      service.isNewChapterLabelVisible(storyNode, storySummary)
    ).toBeFalse();
  });
});
