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
 * @fileoverview Unit tests for TopicViewerContentComponent.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {StorySummary} from 'domain/story/story-summary.model';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {
  TopicViewerContentComponent,
  TopicViewerStorySectionData,
} from './topic-viewer-content.component';

describe('TopicViewerContentComponent', () => {
  let component: TopicViewerContentComponent;
  let fixture: ComponentFixture<TopicViewerContentComponent>;
  let storySectionData: TopicViewerStorySectionData;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TopicViewerContentComponent, MockTranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicViewerContentComponent);
    component = fixture.componentInstance;
    storySectionData = {
      storyId: 'story_1',
      storyTitle: 'Story 1',
      storyDescription: 'Description',
      lessonCount: 3,
      practiceCount: 2,
      storySummary: new StorySummary(
        'story_1',
        'Story 1',
        [],
        '',
        '',
        'Description',
        true,
        [],
        'story-1',
        [],
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        [],
        undefined,
        [],
        []
      ),
      practiceSubtopicIds: [],
      classroomUrlFragment: '',
      topicUrlFragment: '',
    };
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should track story section data by story id', () => {
    expect(component.trackStoryDataById(0, storySectionData)).toBe('story_1');
  });

  it('should render story sections when story data is present in story view', () => {
    component.canonicalStorySectionData = [storySectionData];
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('topic-story-section').length
    ).toBe(1);
    expect(
      fixture.nativeElement.querySelector('.redesigned-stories-list')
    ).not.toBeNull();
    expect(fixture.nativeElement.querySelector('mat-card')).toBeNull();
  });

  it('should render coming soon card when story data is empty in story view', () => {
    component.canonicalStorySectionData = [];
    fixture.detectChanges();

    const comingSoonCard = fixture.nativeElement.querySelector('mat-card');
    expect(comingSoonCard).not.toBeNull();
    expect(comingSoonCard.textContent).toContain(
      'I18N_TOPIC_VIEWER_COMING_SOON'
    );
    expect(
      fixture.nativeElement.querySelectorAll('topic-story-section').length
    ).toBe(0);
  });

  it('should render studyguide section when studyguide view is active', () => {
    component.activeView = component.VIEW_NAMES.STUDYGUIDE;
    component.topicIsLoading = false;
    component.subtopics = [];
    fixture.detectChanges();

    expect(
      fixture.nativeElement
        .querySelector('.oppia-redesigned-topic-viewer-container')
        .classList.contains('studyguide-view-active')
    ).toBeTrue();
    expect(
      fixture.nativeElement.querySelector('subtopics-list')
    ).not.toBeNull();
  });

  it('should not render studyguide section while topic is loading', () => {
    component.activeView = component.VIEW_NAMES.STUDYGUIDE;
    component.topicIsLoading = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('subtopics-list')).toBeNull();
  });
});
