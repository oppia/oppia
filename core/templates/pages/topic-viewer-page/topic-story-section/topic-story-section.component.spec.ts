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
import {UrlService} from 'services/contextual/url.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';

import {TopicStorySectionComponent} from './topic-story-section.component';

describe('TopicStorySectionComponent', () => {
  let component: TopicStorySectionComponent;
  let fixture: ComponentFixture<TopicStorySectionComponent>;
  let urlService: jasmine.SpyObj<UrlService>;

  beforeEach(waitForAsync(() => {
    urlService = jasmine.createSpyObj('UrlService', [
      'getLearnerTopicStudyGuideUrl',
    ]);
    TestBed.configureTestingModule({
      declarations: [TopicStorySectionComponent, MockTranslatePipe],
      providers: [
        UrlInterpolationService,
        {provide: UrlService, useValue: urlService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicStorySectionComponent);
    component = fixture.componentInstance;
    urlService = TestBed.inject(UrlService) as jasmine.SpyObj<UrlService>;

    component.storyTitle = 'Help Jaime win the Arcade Game';
    component.storyDescription =
      "In this story, we'll follow Jaime and his sister Nic as they learn.";
    component.lessonCount = 2;
    component.practiceCount = 1;

    urlService.getLearnerTopicStudyGuideUrl.and.returnValue(
      '/learn/math/place-values/studyguide'
    );

    fixture.detectChanges();
  });

  it('should return story title and meta text helpers', () => {
    expect(component.storyTitle).toBe('Help Jaime win the Arcade Game');
    expect(component.getStoryMetaText()).toBe('2 lessons, 1 practice');
    expect(component.getStoryMetaAriaLabel()).toBe(
      '2 lessons and 1 practice available'
    );
  });

  it('should set the study guide url on init', () => {
    expect(component.studyGuideUrl).toBe('/learn/math/place-values/studyguide');
  });

  it('should derive study guide url from UrlService on init', () => {
    expect(urlService.getLearnerTopicStudyGuideUrl).toHaveBeenCalledWith();
  });

  it('should switch to fallback avatar URL when image load fails', () => {
    const primaryUrl = component.oppiaAvatarImageUrl;

    component.onAvatarImageError();

    expect(component.oppiaAvatarImageUrl).not.toBe(primaryUrl);
    expect(component.oppiaAvatarImageUrl).toContain(
      '/assets/copyrighted-images/general/collection_mascot.svg'
    );
  });

  it('should not modify avatar URL when already on fallback image', () => {
    component.onAvatarImageError();
    const fallbackUrl = component.oppiaAvatarImageUrl;

    component.onAvatarImageError();

    expect(component.oppiaAvatarImageUrl).toBe(fallbackUrl);
  });

  it('should return singular and plural story meta strings correctly', () => {
    component.lessonCount = 1;
    component.practiceCount = 2;

    expect(component.getLessonCountText()).toBe('1 lesson');
    expect(component.getPracticeCountText()).toBe('2 practices');
    expect(component.getStoryMetaText()).toBe('1 lesson, 2 practices');
    expect(component.getStoryMetaAriaLabel()).toBe(
      '1 lesson and 2 practices available'
    );
  });

  it('should keep study guide URL as # when URL fragments are unavailable', () => {
    urlService.getLearnerTopicStudyGuideUrl.and.returnValue('#');
    component.ngOnInit();

    expect(component.studyGuideUrl).toBe('#');
    expect(urlService.getLearnerTopicStudyGuideUrl).toHaveBeenCalledTimes(2);
  });
});
