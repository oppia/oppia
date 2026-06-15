// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for TopicLessonCardComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA, SimpleChange} from '@angular/core';

import {TopicLessonCardComponent} from './topic-lesson-card.component';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';

class MockWindowRef {
  nativeWindow = {
    location: {
      assign: (url: string) => {},
    },
  };
}

describe('TopicLessonCardComponent', () => {
  let component: TopicLessonCardComponent;
  let fixture: ComponentFixture<TopicLessonCardComponent>;
  let urlInterpolationService: jasmine.SpyObj<UrlInterpolationService>;
  let windowRef: WindowRef;

  beforeEach(waitForAsync(() => {
    const urlInterpolationServiceSpy = jasmine.createSpyObj(
      'UrlInterpolationService',
      ['getStaticImageUrl']
    );

    TestBed.configureTestingModule({
      declarations: [TopicLessonCardComponent, MockTranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: UrlInterpolationService,
          useValue: urlInterpolationServiceSpy,
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TopicLessonCardComponent);
    component = fixture.componentInstance;
    urlInterpolationService = TestBed.inject(
      UrlInterpolationService
    ) as jasmine.SpyObj<UrlInterpolationService>;
    windowRef = TestBed.inject(WindowRef);
  }));

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should use provided thumbnail url on initialization', () => {
    component.thumbnailUrl = '/assets/lesson-thumbnail.png';

    component.ngOnInit();

    expect(component.resolvedThumbnailUrl).toBe('/assets/lesson-thumbnail.png');
  });

  it('should use fallback thumbnail url when thumbnail url is empty', () => {
    urlInterpolationService.getStaticImageUrl.and.returnValue(
      '/assets/fallback-thumbnail.webp'
    );

    component.thumbnailUrl = '';

    component.ngOnInit();

    expect(urlInterpolationService.getStaticImageUrl).toHaveBeenCalledWith(
      '/splash/student_desk1x.webp'
    );
    expect(component.resolvedThumbnailUrl).toBe(
      '/assets/fallback-thumbnail.webp'
    );
  });

  it('should generate fallback thumbnail url through UrlInterpolationService', () => {
    urlInterpolationService.getStaticImageUrl.and.returnValue(
      '/assets/generated-fallback.webp'
    );

    component.thumbnailUrl = '';

    component.ngOnInit();

    expect(urlInterpolationService.getStaticImageUrl).toHaveBeenCalledTimes(1);
    expect(component.resolvedThumbnailUrl).toBe(
      '/assets/generated-fallback.webp'
    );
  });

  it('should not call UrlInterpolationService when thumbnail url is provided', () => {
    component.thumbnailUrl = '/assets/custom-thumbnail.png';

    component.ngOnInit();

    expect(urlInterpolationService.getStaticImageUrl).not.toHaveBeenCalled();
    expect(component.resolvedThumbnailUrl).toBe('/assets/custom-thumbnail.png');
  });

  it('should execute navigateTo when url is provided', () => {
    spyOn(windowRef.nativeWindow.location, 'assign');

    component.navigateTo('/explore/123');

    expect(windowRef.nativeWindow.location.assign).toHaveBeenCalledWith(
      '/explore/123'
    );
  });

  it('should execute navigateTo when url is empty', () => {
    expect(() => {
      component.navigateTo('');
    }).not.toThrowError();
  });

  it('should return thumbnail alt text with lesson title', () => {
    component.lessonTitle = 'Introduction to Fractions';

    expect(component.getThumbnailAltText()).toBe(
      'Lesson thumbnail for Introduction to Fractions'
    );
  });

  it('should return default thumbnail alt text when lesson title is empty', () => {
    component.lessonTitle = '';

    expect(component.getThumbnailAltText()).toBe('Lesson thumbnail');
  });

  describe('checkpoint progress', () => {
    function setInputs(
      status: 'not_started' | 'in_progress' | 'completed' | 'coming_soon',
      total: number,
      visited: number
    ): void {
      component.lessonProgressStatus = status;
      component.totalCheckpointsCount = total;
      component.visitedCheckpointsCount = visited;
      component.ngOnChanges({
        lessonProgressStatus: new SimpleChange(undefined, status, false),
        totalCheckpointsCount: new SimpleChange(undefined, total, false),
        visitedCheckpointsCount: new SimpleChange(undefined, visited, false),
      });
    }

    it('should show correct statuses for not_started lesson', () => {
      setInputs('not_started', 5, 0);

      const statuses = component.checkpointStatuses;
      expect(statuses.length).toBe(6);
      expect(statuses[0]).toBe('in-progress');
      expect(statuses.slice(1).every(s => s === 'incomplete')).toBeTrue();
    });

    it('should show correct statuses for in_progress lesson', () => {
      setInputs('in_progress', 5, 2);

      const statuses = component.checkpointStatuses;
      expect(statuses.length).toBe(6);
      expect(statuses[0]).toBe('completed');
      expect(statuses[1]).toBe('in-progress');
      expect(statuses[2]).toBe('incomplete');
      expect(statuses[3]).toBe('incomplete');
      expect(statuses[4]).toBe('incomplete');
      expect(statuses[5]).toBe('incomplete');
    });

    it('should show all completed for completed lesson', () => {
      setInputs('completed', 5, 5);

      const statuses = component.checkpointStatuses;
      expect(statuses.length).toBe(6);
      expect(statuses.every(s => s === 'completed')).toBeTrue();
    });

    it('should show all completed if completed status is set even if checkpoint count is stale', () => {
      setInputs('completed', 5, 0);

      const statuses = component.checkpointStatuses;
      expect(statuses.length).toBe(6);
      expect(statuses.every(s => s === 'completed')).toBeTrue();
    });

    it('should return empty for coming_soon lesson', () => {
      setInputs('coming_soon', 5, 0);

      const statuses = component.checkpointStatuses;
      expect(statuses.length).toBe(0);
    });

    it('should return empty when totalCheckpointsCount is 0', () => {
      setInputs('not_started', 0, 0);

      const statuses = component.checkpointStatuses;
      expect(statuses.length).toBe(0);
    });

    it('should return 0 for not_started', () => {
      component.lessonProgressStatus = 'not_started';
      component.totalCheckpointsCount = 5;

      expect(component.progressPercent).toBe(0);
    });

    it('should return 100 for completed', () => {
      component.lessonProgressStatus = 'completed';
      component.totalCheckpointsCount = 5;
      component.visitedCheckpointsCount = 5;

      expect(component.progressPercent).toBe(100);
    });

    it('should return 100 when status is completed even if checkpoint count is stale', () => {
      component.lessonProgressStatus = 'completed';
      component.totalCheckpointsCount = 10;
      component.visitedCheckpointsCount = 3;

      expect(component.progressPercent).toBe(100);
    });

    it('should return 0 for coming_soon', () => {
      component.lessonProgressStatus = 'coming_soon';

      expect(component.progressPercent).toBe(0);
    });

    it('should return correct progressPercent for in_progress', () => {
      component.lessonProgressStatus = 'in_progress';
      component.totalCheckpointsCount = 10;
      component.visitedCheckpointsCount = 3;

      expect(component.progressPercent).toBe(20);
    });

    it('should mark all nodes complete when visited checkpoint count reaches total checkpoints', () => {
      setInputs('in_progress', 5, 5);

      const statuses = component.checkpointStatuses;
      expect(statuses.length).toBe(6);
      expect(statuses.every(s => s === 'completed')).toBeTrue();
    });

    it('should return correct showCheckpointBar value', () => {
      component.lessonProgressStatus = 'not_started';
      component.totalCheckpointsCount = 5;
      expect(component.showCheckpointBar).toBeTrue();

      component.lessonProgressStatus = 'coming_soon';
      component.totalCheckpointsCount = 5;
      expect(component.showCheckpointBar).toBeFalse();

      component.lessonProgressStatus = 'not_started';
      component.totalCheckpointsCount = 0;
      expect(component.showCheckpointBar).toBeFalse();
    });
  });
});
