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
 * @fileoverview Unit tests for TopicStorySectionComponent.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

import {TopicLessonCardComponent} from './topic-lesson-card/topic-lesson-card.component';
import {TopicStorySectionComponent} from './topic-story-section.component';

describe('TopicStorySectionComponent', () => {
  let component: TopicStorySectionComponent;
  let fixture: ComponentFixture<TopicStorySectionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TopicStorySectionComponent, TopicLessonCardComponent],
      providers: [UrlInterpolationService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicStorySectionComponent);
    component = fixture.componentInstance;

    component.storyTitle = 'Help Jaime win the Arcade Game';
    component.storyDescription =
      "In this story, we'll follow Jaime and his sister Nic as they learn.";

    fixture.detectChanges();
  });

  it('should render the callout and lesson card', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(
      el.querySelector('.story-description-bubble')?.textContent
    ).toContain(
      "In this story, we'll follow Jaime and his sister Nic as they learn."
    );
    expect(el.querySelector('.topic-lesson-card-title')?.textContent).toContain(
      'Lesson 1: Help Jaime win the Arcade Game'
    );
  });

  it('should use the default thumbnail image for the lesson card', () => {
    component.ngOnInit();

    expect(component.lessonThumbnailUrl).toContain(
      '/assets/images/splash/student_desk1x.webp'
    );
  });
});
