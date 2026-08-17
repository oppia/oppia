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
      storySummary: StorySummary.createFromBackendDict({
        id: 'story_1',
        title: 'Story 1',
        node_titles: [],
        thumbnail_filename: '',
        thumbnail_bg_color: '',
        description: 'Description',
        story_is_published: true,
        completed_node_titles: [],
        url_fragment: 'story-1',
        all_node_dicts: [],
      }),
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

  it('should initialize with story view defaults', () => {
    expect(component.activeView).toBe(component.VIEW_NAMES.STORY);
    expect(component.canonicalStorySectionData).toEqual([]);
    expect(component.topicIsLoading).toBeFalse();
    expect(component.isInTopicEditorPreview).toBeFalse();
  });
});
