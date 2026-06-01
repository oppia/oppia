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

import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

import {TopicLessonCardComponent} from './topic-lesson-card.component';

describe('TopicLessonCardComponent', () => {
  let component: TopicLessonCardComponent;
  let fixture: ComponentFixture<TopicLessonCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TopicLessonCardComponent],
      providers: [UrlInterpolationService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicLessonCardComponent);
    component = fixture.componentInstance;
    component.lessonTitle = 'Lesson 1: What are place values?';
    component.lessonDescription =
      'Jaime learns the place value of each digit in a big number.';
  });

  it('should render lesson title, description, and start button', () => {
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(
      element.querySelector('.topic-lesson-card-title')?.textContent
    ).toContain('Lesson 1: What are place values?');
    expect(
      element.querySelector('.topic-lesson-card-description')?.textContent
    ).toContain('Jaime learns the place value of each digit in a big number.');
    expect(
      element.querySelector('.topic-lesson-card-start-button')?.textContent
    ).toContain('Start');
  });

  it('should use the fallback thumbnail when none is provided', () => {
    fixture.detectChanges();

    expect(component.resolvedThumbnailUrl).toContain(
      '/assets/images/splash/student_desk1x.webp'
    );
  });
});
