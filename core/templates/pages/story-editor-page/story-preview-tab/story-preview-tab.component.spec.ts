// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for story preview tab component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {EventEmitter} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {StoryEditorNavigationService} from 'pages/story-editor-page/services/story-editor-navigation.service';
import {Story} from 'domain/story/story.model';
import {StoryPreviewTabComponent} from './story-preview-tab.component';
import {StoryEditorStateService} from '../services/story-editor-state.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';

class MockStoryEditorNavigationService {
  activeTab!: 'story_preview';
  getActiveTab!: () => string;
  getChapterId!: () => 'node_1';
  getChapterIndex!: () => null;
  navigateToStoryEditor!: () => {};
}
describe('Story Preview tab', () => {
  let component: StoryPreviewTabComponent;
  let fixture: ComponentFixture<StoryPreviewTabComponent>;
  let story: Story;
  let storyInitializedEventEmitter: EventEmitter<string>;
  let storyReinitializedEventEmitter: EventEmitter<string>;
  let storyEditorStateService: StoryEditorStateService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [StoryPreviewTabComponent, MockTranslatePipe],
      providers: [
        {
          StoryEditorNavigationService,
          provide: [
            {
              provide: StoryEditorNavigationService,
              UseClass: MockStoryEditorNavigationService,
            },
          ],
        },
      ],
    }).compileComponents();
  });
  beforeEach(() => {
    fixture = TestBed.createComponent(StoryPreviewTabComponent);
    component = fixture.componentInstance;
    storyEditorStateService = TestBed.get(StoryEditorStateService);
    story = Story.createFromBackendDict({
      id: 'storyId_0',
      title: 'Story title',
      description: 'Story Description',
      notes: '<p>Notes/p>',
      version: 1,
      corresponding_topic_id: 'topic_id',
      story_contents: {
        initial_node_id: 'node_1',
        nodes: [
          {
            id: 'node_1',
            title: 'Title 1',
            description: 'Description 1',
            prerequisite_skill_ids: [],
            acquired_skill_ids: [],
            destination_node_ids: [],
            outline: 'Outline',
            exploration_id: 'exp_1',
            outline_is_finalized: false,
            thumbnail_filename: 'img.png',
            thumbnail_bg_color: '#a33f40',
            status: 'Published',
            planned_publication_date_msecs: 10.0,
            last_modified_msecs: 20.0,
            first_publication_date_msecs: 10.0,
            unpublishing_reason: null,
          },
          {
            id: 'node_2',
            title: 'Title 2',
            description: 'Description 2',
            prerequisite_skill_ids: [],
            acquired_skill_ids: [],
            destination_node_ids: [],
            outline: 'Outline',
            exploration_id: 'exp_2',
            outline_is_finalized: false,
            thumbnail_filename: 'img2.png',
            thumbnail_bg_color: '#a33f40',
            status: 'Published',
            planned_publication_date_msecs: 10.0,
            last_modified_msecs: 20.0,
            first_publication_date_msecs: 10.0,
            unpublishing_reason: null,
          },
        ],
        next_node_id: 'node_3',
      },
      language_code: 'en',
      thumbnail_filename: 'fileName',
      thumbnail_bg_color: 'blue',
      url_fragment: 'url',
      meta_tag_content: 'meta',
    });

    storyInitializedEventEmitter = new EventEmitter();
    storyReinitializedEventEmitter = new EventEmitter();

    spyOn(storyEditorStateService, 'getStory').and.returnValue(story);
    spyOnProperty(storyEditorStateService, 'onStoryInitialized').and.callFake(
      () => {
        return storyInitializedEventEmitter;
      }
    );
    spyOnProperty(storyEditorStateService, 'onStoryReinitialized').and.callFake(
      () => {
        return storyReinitializedEventEmitter;
      }
    );
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should set initialize the variables', () => {
    component.ngOnInit();
    expect(component.story).toEqual(story);
    expect(component.storyId).toEqual('storyId_0');
  });

  it('should return the exploration url for the story node', () => {
    component.ngOnInit();
    let node = story.getStoryContents().getNodes()[0];
    expect(component.getExplorationUrl(node)).toEqual(
      '/explore/exp_1?story_id=storyId_0&node_id=node_1'
    );
    node = story.getStoryContents().getNodes()[1];
    expect(component.getExplorationUrl(node)).toEqual(
      '/explore/exp_2?story_id=storyId_0&node_id=node_2'
    );
  });

  it('should called initEditor on calls from story being initialized', () => {
    spyOn(component, 'initEditor').and.callThrough();
    component.ngOnInit();
    storyInitializedEventEmitter.emit();
    storyReinitializedEventEmitter.emit();
    expect(component.initEditor).toHaveBeenCalledTimes(3);
  });
});
