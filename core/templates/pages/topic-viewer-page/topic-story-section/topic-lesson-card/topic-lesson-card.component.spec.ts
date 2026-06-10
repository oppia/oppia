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

import {TopicLessonCardComponent} from './topic-lesson-card.component';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

describe('TopicLessonCardComponent', () => {
  let component: TopicLessonCardComponent;
  let fixture: ComponentFixture<TopicLessonCardComponent>;
  let urlInterpolationService: jasmine.SpyObj<UrlInterpolationService>;

  beforeEach(waitForAsync(() => {
    const urlInterpolationServiceSpy = jasmine.createSpyObj(
      'UrlInterpolationService',
      ['getStaticImageUrl']
    );

    TestBed.configureTestingModule({
      declarations: [TopicLessonCardComponent],
      providers: [
        {
          provide: UrlInterpolationService,
          useValue: urlInterpolationServiceSpy,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TopicLessonCardComponent);
    component = fixture.componentInstance;
    urlInterpolationService = TestBed.inject(
      UrlInterpolationService
    ) as jasmine.SpyObj<UrlInterpolationService>;
  }));

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render the card as a div element without article role', () => {
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('div.topic-lesson-card')
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('.topic-lesson-card[role="article"]')
    ).toBeNull();
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
    const previousHash = window.location.hash;

    component.navigateTo('#lesson-card');

    expect(window.location.hash).toBe('#lesson-card');
    window.location.hash = previousHash;
  });

  it('should execute navigateTo when url is null', () => {
    expect(() => {
      component.navigateTo(null);
    }).not.toThrowError();
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

  it('should return default thumbnail alt text when lesson title is undefined', () => {
    component.lessonTitle = undefined as unknown as string;

    expect(component.getThumbnailAltText()).toBe('Lesson thumbnail');
  });
});
