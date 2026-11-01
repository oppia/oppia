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
      origin: 'http://localhost:8181',
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

  it('should not call UrlInterpolationService when thumbnail url is provided', () => {
    component.thumbnailUrl = '/assets/custom-thumbnail.png';

    component.ngOnInit();

    expect(urlInterpolationService.getStaticImageUrl).not.toHaveBeenCalled();
    expect(component.resolvedThumbnailUrl).toBe('/assets/custom-thumbnail.png');
  });

  it('should return the static image url for the provided image path', () => {
    urlInterpolationService.getStaticImageUrl.and.returnValue(
      '/assets/icons/practice-pencil-icon.svg'
    );

    expect(component.getStaticImageUrl('/icons/practice-pencil-icon.svg')).toBe(
      '/assets/icons/practice-pencil-icon.svg'
    );
    expect(urlInterpolationService.getStaticImageUrl).toHaveBeenCalledWith(
      '/icons/practice-pencil-icon.svg'
    );
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

  it('should expose isComingSoonLesson based on lesson progress status', () => {
    component.lessonProgressStatus = 'coming_soon';
    expect(component.isComingSoonLesson).toBeTrue();

    component.lessonProgressStatus = 'not_started';
    expect(component.isComingSoonLesson).toBeFalse();
  });

  it('should emit startLessonClick with lesson number and startUrl on start button click', () => {
    spyOn(component.startLessonClick, 'emit');
    component.startUrl = '/explore/123';
    component.lessonNumber = 3;

    component.onStartButtonClick();

    expect(component.startLessonClick.emit).toHaveBeenCalledWith({
      lessonNumber: 3,
      startUrl: '/explore/123',
    });
  });

  it('should expose isCompletedLesson based on lesson progress status', () => {
    component.lessonProgressStatus = 'completed';
    expect(component.isCompletedLesson).toBeTrue();

    component.lessonProgressStatus = 'in_progress';
    expect(component.isCompletedLesson).toBeFalse();
  });

  it('should navigate to startUrl directly when no fallback is needed', () => {
    spyOn(component.startLessonClick, 'emit');
    component.startUrl = '/explore/123';

    component.onStartButtonClick();

    expect(component.startLessonClick.emit).toHaveBeenCalledWith({
      lessonNumber: 1,
      startUrl: '/explore/123',
    });
  });

  it('should not emit startLessonClick when startUrl is empty', () => {
    spyOn(component.startLessonClick, 'emit');
    component.startUrl = '';

    component.onStartButtonClick();

    expect(component.startLessonClick.emit).not.toHaveBeenCalled();
  });

  it('should not emit startLessonClick when lesson is coming soon', () => {
    spyOn(component.startLessonClick, 'emit');
    component.startUrl = '/explore/123';
    component.lessonProgressStatus = 'coming_soon';

    component.onStartButtonClick();

    expect(component.startLessonClick.emit).not.toHaveBeenCalled();
  });

  it('should toggle isExpanded in both directions', () => {
    component.isExpanded = false;

    component.toggleExpanded();
    expect(component.isExpanded).toBeTrue();

    component.toggleExpanded();
    expect(component.isExpanded).toBeFalse();
  });

  it('should not toggle when isComingSoonSectionCard is true', () => {
    component.isExpanded = false;
    component.isComingSoonSectionCard = true;

    component.toggleExpanded();

    expect(component.isExpanded).toBeFalse();
  });

  it('should navigate to practiceUrl when provided', () => {
    spyOn(component, 'navigateTo');
    component.practiceUrl = '/practice/123';
    component.hasPracticeQuestions = true;

    component.onPracticeButtonClick();

    expect(component.navigateTo).toHaveBeenCalledWith('/practice/123');
  });

  it('should not navigate when practice questions are unavailable', () => {
    spyOn(component, 'navigateTo');
    component.practiceUrl = '/practice/123';
    component.hasPracticeQuestions = false;

    component.onPracticeButtonClick();

    expect(component.navigateTo).not.toHaveBeenCalled();
  });

  it('should navigate to studyUrl when provided', () => {
    spyOn(component, 'navigateTo');
    component.studyUrl = '/study/123';
    component.startUrl = '/explore/123';

    component.onStudyButtonClick();

    expect(component.navigateTo).toHaveBeenCalledWith('/study/123');
  });

  it('should fallback to startUrl when studyUrl is empty', () => {
    spyOn(component, 'navigateTo');
    component.studyUrl = '';
    component.startUrl = '/explore/123';

    component.onStudyButtonClick();

    expect(component.navigateTo).toHaveBeenCalledWith('/explore/123');
  });

  it('should not navigate when lesson is coming soon', () => {
    spyOn(component, 'navigateTo');
    component.lessonProgressStatus = 'coming_soon';
    component.studyUrl = '/study/123';
    component.startUrl = '/explore/123';

    component.onStudyButtonClick();

    expect(component.navigateTo).not.toHaveBeenCalled();
  });

  it('should start the lesson again from the beginning on play again click', () => {
    spyOn(component.startLessonClick, 'emit');
    component.startUrl = '/explore/123';
    component.lessonNumber = 3;
    component.isExpanded = true;

    component.onPlayAgainClick();

    expect(component.startLessonClick.emit).toHaveBeenCalledWith({
      lessonNumber: 3,
      startUrl: '/explore/123?restart=1',
    });
    expect(component.isExpanded).toBeTrue();
  });

  it('should append restart param to an existing query string on play again click', () => {
    spyOn(component.startLessonClick, 'emit');
    component.startUrl = '/explore/123?node_id=x&lang=en';

    component.onPlayAgainClick();

    expect(component.startLessonClick.emit).toHaveBeenCalledWith({
      lessonNumber: 1,
      startUrl: '/explore/123?node_id=x&lang=en&restart=1',
    });
  });

  it('should not start the lesson again when startUrl is empty on play again click', () => {
    spyOn(component.startLessonClick, 'emit');
    component.startUrl = '';

    component.onPlayAgainClick();

    expect(component.startLessonClick.emit).not.toHaveBeenCalled();
  });

  it('should not start the lesson again for a coming soon lesson on play again click', () => {
    spyOn(component.startLessonClick, 'emit');
    component.startUrl = '/explore/123';
    component.lessonProgressStatus = 'coming_soon';

    component.onPlayAgainClick();

    expect(component.startLessonClick.emit).not.toHaveBeenCalled();
  });

  it('should auto-expand when navigatedLessonNumber matches lessonNumber', () => {
    component.lessonNumber = 3;
    component.navigatedLessonNumber = 3;
    component.isExpanded = false;

    component.ngOnChanges({
      navigatedLessonNumber: new SimpleChange(null, 3, false),
    });

    expect(component.isExpanded).toBeTrue();
  });

  it('should not expand when navigatedLessonNumber does not match', () => {
    component.lessonNumber = 3;
    component.navigatedLessonNumber = 5;
    component.isExpanded = false;

    component.ngOnChanges({
      navigatedLessonNumber: new SimpleChange(null, 5, false),
    });

    expect(component.isExpanded).toBeFalse();
  });

  it('should not expand navigated lesson when isComingSoonSectionCard is true', () => {
    component.lessonNumber = 3;
    component.navigatedLessonNumber = 3;
    component.isExpanded = false;
    component.isComingSoonSectionCard = true;

    component.ngOnChanges({
      navigatedLessonNumber: new SimpleChange(null, 3, false),
    });

    expect(component.isExpanded).toBeFalse();
  });

  it('should collapse expanded lesson when progress becomes completed', () => {
    component.lessonNumber = 2;
    component.isExpanded = true;

    component.ngOnChanges({
      lessonProgressStatus: new SimpleChange('in_progress', 'completed', false),
    });

    expect(component.isExpanded).toBeFalse();
  });

  it('should not collapse when lesson is already completed', () => {
    component.lessonNumber = 2;
    component.isExpanded = true;

    component.ngOnChanges({
      lessonProgressStatus: new SimpleChange('not_started', 'completed', false),
    });
    expect(component.isExpanded).toBeFalse();

    component.isExpanded = true;

    component.ngOnChanges({
      lessonProgressStatus: new SimpleChange('completed', 'completed', false),
    });

    expect(component.isExpanded).toBeTrue();
  });

  it('should not collapse completed lesson when isComingSoonSectionCard is true', () => {
    component.lessonNumber = 2;
    component.isExpanded = true;
    component.isComingSoonSectionCard = true;

    component.ngOnChanges({
      lessonProgressStatus: new SimpleChange('not_started', 'completed', false),
    });

    expect(component.isExpanded).toBeTrue();
  });

  it('should not collapse when progress changes to a non-completed status', () => {
    component.lessonNumber = 2;
    component.isExpanded = true;

    component.ngOnChanges({
      lessonProgressStatus: new SimpleChange(
        'not_started',
        'in_progress',
        false
      ),
    });

    expect(component.isExpanded).toBeTrue();
  });

  it('should expand first lesson by default', () => {
    component.lessonNumber = 1;

    component.ngOnInit();

    expect(component.isExpanded).toBeTrue();
  });

  it('should not expand non-first lessons by default', () => {
    component.lessonNumber = 2;

    component.ngOnInit();

    expect(component.isExpanded).toBeFalse();
  });

  it('should not expand first lesson when isComingSoonSectionCard is true', () => {
    component.lessonNumber = 1;
    component.isComingSoonSectionCard = true;

    component.ngOnInit();

    expect(component.isExpanded).toBeFalse();
  });

  it('should expand navigated non-first lesson', () => {
    component.lessonNumber = 3;
    component.navigatedLessonNumber = 3;

    component.ngOnInit();

    expect(component.isExpanded).toBeTrue();
  });

  it('should expand the active lesson so its actions are visible', () => {
    component.lessonNumber = 2;
    component.isActiveLesson = true;

    component.ngOnInit();

    expect(component.isExpanded).toBeTrue();
  });

  it('should not expand the active lesson when it is completed', () => {
    component.lessonNumber = 2;
    component.isActiveLesson = true;
    component.lessonProgressStatus = 'completed';

    component.ngOnInit();

    expect(component.isExpanded).toBeFalse();
  });

  it('should not expand first lesson by default when it is completed', () => {
    component.lessonNumber = 1;
    component.lessonProgressStatus = 'completed';

    component.ngOnInit();

    expect(component.isExpanded).toBeFalse();
  });

  it('should expand first lesson when it is not completed', () => {
    component.lessonNumber = 1;
    component.lessonProgressStatus = 'in_progress';

    component.ngOnInit();

    expect(component.isExpanded).toBeTrue();
  });
});
