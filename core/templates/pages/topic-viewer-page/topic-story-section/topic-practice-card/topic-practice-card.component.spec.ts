// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for TopicPracticeCardComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

import {TopicPracticeCardComponent} from './topic-practice-card.component';

describe('TopicPracticeCardComponent', () => {
  let component: TopicPracticeCardComponent;
  let fixture: ComponentFixture<TopicPracticeCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TopicPracticeCardComponent],
      providers: [UrlInterpolationService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicPracticeCardComponent);
    component = fixture.componentInstance;
    component.practiceTitle = 'Practice 1: Comparing numbers';
    component.relatedLessonNumber = 1;
    component.studyUrl = '/learn/math/place-values/lesson-1';
    component.practiceUrl = '/practice_session/create/math/place-values';
  });

  it('should render title, generated description, and CTAs', () => {
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(
      element.querySelector('.topic-practice-card-title')?.textContent
    ).toContain('Practice 1: Comparing numbers');
    expect(
      element.querySelector('.topic-practice-card-description')?.textContent
    ).toContain("Practice the skills you've learned in lesson 1.");
    expect(
      element.querySelector('.topic-practice-card-study-link')?.textContent
    ).toContain('Study');
    expect(
      element.querySelector('.topic-practice-card-practice-button')?.textContent
    ).toContain('Practice');
    expect(
      element
        .querySelector('.topic-practice-card-practice-button')
        ?.getAttribute('href')
    ).toBe('/practice_session/create/math/place-values');
  });

  it('should use fallback thumbnail when none is provided', () => {
    fixture.detectChanges();

    expect(component.resolvedThumbnailUrl).toContain(
      '/assets/images/splash/student_desk1x.webp'
    );
  });

  it('should fall back to # when no practice url is provided', () => {
    component.practiceUrl = null;

    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '.topic-practice-card-practice-button'
    ) as HTMLAnchorElement;
    expect(button.textContent).toContain('Practice');
    expect(button.getAttribute('href')).toBe('#');
  });

  it('should use provided thumbnail when available', () => {
    component.thumbnailUrl = '/images/custom.png';
    fixture.detectChanges();
    expect(component.resolvedThumbnailUrl).toBe('/images/custom.png');
  });

  it('should use provided description when available', () => {
    component.practiceDescription = 'A custom practice description';
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(
      element.querySelector('.topic-practice-card-description')?.textContent
    ).toContain('A custom practice description');
  });

  it('should provide generic alt text when title is empty', () => {
    component.practiceTitle = '';
    fixture.detectChanges();
    expect(component.getThumbnailAltText()).toBe('Practice thumbnail');
  });
});
