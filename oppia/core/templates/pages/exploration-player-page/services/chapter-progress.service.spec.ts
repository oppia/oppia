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
 * @fileoverview Unit tests for the ChapterProgressService.
 */

import {TestBed, waitForAsync, fakeAsync, tick} from '@angular/core/testing';
import {ChapterProgressService} from './chapter-progress.service';
import {LearnerDashboardBackendApiService} from '../../../domain/learner_dashboard/learner-dashboard-backend-api.service';

describe('ChapterProgressService', () => {
  let chapterProgressService: ChapterProgressService;
  let learnerDashboardBackendApiService: jasmine.SpyObj<LearnerDashboardBackendApiService>;

  beforeEach(waitForAsync(() => {
    const learnerDashboardBackendApiServiceSpy = jasmine.createSpyObj(
      'LearnerDashboardBackendApiService',
      ['fetchLearnerCompletedChaptersCountDataAsync']
    );

    TestBed.configureTestingModule({
      providers: [
        ChapterProgressService,
        {
          provide: LearnerDashboardBackendApiService,
          useValue: learnerDashboardBackendApiServiceSpy,
        },
      ],
    }).compileComponents();

    chapterProgressService = TestBed.inject(ChapterProgressService);
    learnerDashboardBackendApiService = TestBed.inject(
      LearnerDashboardBackendApiService
    ) as jasmine.SpyObj<LearnerDashboardBackendApiService>;
  }));

  it('should be created', () => {
    expect(chapterProgressService).toBeTruthy();
  });

  it('should update completed chapters count correctly', fakeAsync(() => {
    learnerDashboardBackendApiService.fetchLearnerCompletedChaptersCountDataAsync.and.returnValue(
      Promise.resolve({completedChaptersCount: 5})
    );

    chapterProgressService.updateCompletedChaptersCount();
    tick();
    expect(chapterProgressService.getCompletedChaptersCount()).toBe(5);
  }));

  it('should check for first time chapter completion', fakeAsync(() => {
    learnerDashboardBackendApiService.fetchLearnerCompletedChaptersCountDataAsync.and.returnValue(
      Promise.resolve({completedChaptersCount: 5})
    );

    chapterProgressService.updateCompletedChaptersCount(true);
    tick();
    expect(chapterProgressService.getChapterCompletedForTheFirstTime()).toBe(
      true
    );
  }));

  it('should emit the new count via completedChaptersCount$ when update is called', fakeAsync(() => {
    let receivedValue: number = -1;

    learnerDashboardBackendApiService.fetchLearnerCompletedChaptersCountDataAsync.and.returnValue(
      Promise.resolve({completedChaptersCount: 10})
    );

    chapterProgressService.completedChaptersCount$.subscribe(count => {
      receivedValue = count;
    });

    chapterProgressService.updateCompletedChaptersCount();

    tick();

    expect(receivedValue).toBe(10);
    expect(chapterProgressService.getCompletedChaptersCount()).toBe(10);
  }));

  it('should set the completed chapters count', () => {
    chapterProgressService.setCompletedChaptersCount(15);

    expect(chapterProgressService.getCompletedChaptersCount()).toBe(15);
  });

  it('should set whether a chapter is completed for the first time', () => {
    chapterProgressService.setChapterCompletedForTheFirstTime(true);
    expect(chapterProgressService.getChapterCompletedForTheFirstTime()).toBe(
      true
    );

    chapterProgressService.setChapterCompletedForTheFirstTime(false);
    expect(chapterProgressService.getChapterCompletedForTheFirstTime()).toBe(
      false
    );
  });

  it('should return the completed chapters count', fakeAsync(() => {
    learnerDashboardBackendApiService.fetchLearnerCompletedChaptersCountDataAsync.and.returnValue(
      Promise.resolve({completedChaptersCount: 3})
    );

    chapterProgressService.updateCompletedChaptersCount();
    tick();
    expect(chapterProgressService.getCompletedChaptersCount()).toBe(3);
  }));
});
