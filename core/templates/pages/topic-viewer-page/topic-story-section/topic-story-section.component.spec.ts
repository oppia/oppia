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

import {TopicStorySectionComponent} from './topic-story-section.component';

describe('TopicStorySectionComponent', () => {
  let component: TopicStorySectionComponent;
  let fixture: ComponentFixture<TopicStorySectionComponent>;
  let urlService: UrlService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TopicStorySectionComponent],
      providers: [UrlInterpolationService, UrlService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicStorySectionComponent);
    component = fixture.componentInstance;
    urlService = TestBed.inject(UrlService);

    component.storyTitle = 'Help Jaime win the Arcade Game';
    component.storyDescription =
      "In this story, we'll follow Jaime and his sister Nic as they learn.";
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'place-values';
    component.lessonCount = 2;
    component.practiceCount = 1;

    fixture.detectChanges();
  });

  it('should render story title and story meta text', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.story-title')?.textContent).toContain(
      'Help Jaime win the Arcade Game'
    );
    expect(el.querySelector('.story-meta')?.textContent).toContain(
      '2 lessons, 1 practice'
    );
  });

  it('should build the study guide URL for Study Skills CTA', () => {
    const el: HTMLElement = fixture.nativeElement;
    const link = el.querySelector<HTMLAnchorElement>('.study-skills-cta');

    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toContain(
      '/learn/math/place-values/studyguide'
    );
  });

  it('should read URL fragments from URL service when inputs are absent', () => {
    component.classroomUrlFragment = '';
    component.topicUrlFragment = '';

    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'science'
    );
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'matter'
    );

    component.ngOnInit();

    expect(component.studyGuideUrl).toContain(
      '/learn/science/matter/studyguide'
    );
  });

  it('should switch to fallback avatar URL when image load fails', () => {
    const primaryUrl = component.oppiaAvatarImageUrl;

    component.onAvatarImageError();

    expect(component.oppiaAvatarImageUrl).not.toBe(primaryUrl);
    expect(component.oppiaAvatarImageUrl).toContain(
      '/assets/copyrighted-images/general/collection_mascot.svg'
    );
  });
});
