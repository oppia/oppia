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
 * @fileoverview Unit tests for Chapter-progress-loader Service.
 */

import {TestBed} from '@angular/core/testing';
import {
  ChapterProgressLoaderService,
  LessonProgressData,
} from './chapter-progress-loader.service';
import {StoryViewerBackendApiService} from 'domain/story_viewer/story-viewer-backend-api.service';
import {UserService} from 'services/user.service';
import {ChapterProgressSummary} from 'domain/exploration/chapter-progress-summary.model';

describe('ChapterProgressLoaderService', () => {
  let service: ChapterProgressLoaderService;
  let storyViewerBackendApiService: jasmine.SpyObj<StoryViewerBackendApiService>;
  let userService: jasmine.SpyObj<UserService>;

  const mockChapterProgress = new ChapterProgressSummary(5, 3, false);

  beforeEach(() => {
    const storyViewerSpy = jasmine.createSpyObj(
      'StoryViewerBackendApiService',
      ['fetchProgressInStoriesChapters']
    );
    const userServiceSpy = jasmine.createSpyObj('UserService', [
      'getUserInfoAsync',
    ]);

    TestBed.configureTestingModule({
      providers: [
        ChapterProgressLoaderService,
        {provide: StoryViewerBackendApiService, useValue: storyViewerSpy},
        {provide: UserService, useValue: userServiceSpy},
      ],
    });

    service = TestBed.inject(ChapterProgressLoaderService);
    storyViewerBackendApiService = TestBed.inject(
      StoryViewerBackendApiService
    ) as jasmine.SpyObj<StoryViewerBackendApiService>;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadChapterProgressForStory', () => {
    it('should fetch and cache chapter progress for a story', async () => {
      userService.getUserInfoAsync.and.returnValue(
        Promise.resolve({getUsername: () => 'test_user'})
      );
      storyViewerBackendApiService.fetchProgressInStoriesChapters.and.returnValue(
        Promise.resolve([mockChapterProgress])
      );

      await service.loadChapterProgressForStory('story1', ['exp1']);

      expect(
        storyViewerBackendApiService.fetchProgressInStoriesChapters
      ).toHaveBeenCalledWith('test_user', ['story1']);
      expect(service.getChapterProgressSummary('exp1')).toEqual(
        mockChapterProgress
      );
    });

    it('should not fetch progress if story already loaded', async () => {
      service.loadedStoryIds.add('story1');
      await service.loadChapterProgressForStory('story1', ['exp1']);
      expect(
        storyViewerBackendApiService.fetchProgressInStoriesChapters
      ).not.toHaveBeenCalled();
    });

    it('should handle missing username', async () => {
      userService.getUserInfoAsync.and.returnValue(
        Promise.resolve({getUsername: () => null})
      );
      await service.loadChapterProgressForStory('story1', ['exp1']);
      expect(service.getChapterProgressSummary('exp1')).toBeNull();
    });
  });

  describe('computeLessonProgress', () => {
    it('should compute progress correctly', () => {
      service.chapterProgressByExpId.set('exp1', mockChapterProgress);
      const progress = service.computeLessonProgress('exp1');
      expect(progress).toBe(40);
      expect(service.getLessonProgress('exp1')).toBe(40);
    });

    it('should return 100 if chapter complete', () => {
      service.chapterProgressByExpId.set(
        'exp2',
        new ChapterProgressSummary(5, 3, true)
      );
      const progress = service.computeLessonProgress('exp2');
      expect(progress).toBe(100);
    });

    it('should return 0 if chapter progress missing', () => {
      const progress = service.computeLessonProgress('unknownExp');
      expect(progress).toBe(0);
    });
  });

  describe('getLessonProgress', () => {
    it('should return cached progress', () => {
      service.lessonProgress.exp1 = 75;
      expect(service.getLessonProgress('exp1')).toBe(75);
    });

    it('should return 0 if no cached progress', () => {
      expect(service.getLessonProgress('expUnknown')).toBe(0);
    });
  });

  describe('isChapterCompleted', () => {
    it('should return true if chapter is complete', () => {
      service.chapterProgressByExpId.set(
        'exp1',
        new ChapterProgressSummary(5, 5, true)
      );
      expect(service.isChapterCompleted('exp1')).toBeTrue();
    });

    it('should return false if chapter is not complete', () => {
      service.chapterProgressByExpId.set(
        'exp1',
        new ChapterProgressSummary(5, 3, false)
      );
      expect(service.isChapterCompleted('exp1')).toBeFalse();
    });

    it('should return false if chapter progress missing', () => {
      expect(service.isChapterCompleted('expUnknown')).toBeFalse();
    });
  });

  describe('getAllProgress', () => {
    it('should return all cached lesson progress', () => {
      service.lessonProgress = {exp1: 20, exp2: 50};
      const allProgress: LessonProgressData = service.getAllProgress();
      expect(allProgress).toEqual({exp1: 20, exp2: 50});
    });
  });

  it('should return cached lesson progress if available', () => {
    service.lessonProgress.exp1 = 50;

    const progress = service.computeLessonProgress('exp1');

    expect(progress).toBe(50);
  });

  it('should log an error if fetchProgressInStoriesChapters fails', async () => {
    userService.getUserInfoAsync.and.returnValue(
      Promise.resolve({getUsername: () => 'test_user'})
    );
    storyViewerBackendApiService.fetchProgressInStoriesChapters.and.returnValue(
      Promise.reject('API error')
    );

    spyOn(console, 'error');

    await service.loadChapterProgressForStory('story1', ['exp1']);

    expect(console.error).toHaveBeenCalledWith(
      'Error loading chapter progress for story:',
      'story1',
      'API error'
    );
  });
});
