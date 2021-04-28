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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter, Pipe } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StoryEditorNavigationService } from
  'pages/story-editor-page/services/story-editor-navigation.service';
import { Story, StoryObjectFactory } from 'domain/story/StoryObjectFactory';
import { StoryPreviewTabComponent } from './story-preview-tab.component';
import { StoryEditorStateService } from '../services/story-editor-state.service';

@Pipe({name: 'translate'})
class MockTranslatePipe {
  transform(value: string): string {
    return value;
  }
}


class MockStoryEditorNavigationService {
  activeTab: 'story_preview';
  getActiveTab: () => string;
  getChapterId: () => 'node_1';
  getChapterIndex: () => null;
  navigateToStoryEditor: () => {
    return;
  };
}
describe('Story Preview tab', () => {
  let component: StoryPreviewTabComponent;
  let fixture: ComponentFixture<StoryPreviewTabComponent>;
  let story: Story = null;
  let storyInitializedEventEmitter: EventEmitter<void> = null;
  let storyReinitializedEventEmitter: EventEmitter<void> = null;
  let storyObjectFactory = null;
  let storyEditorStateService: StoryEditorStateService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [StoryPreviewTabComponent, MockTranslatePipe],
      providers: [{
        StoryObjectFactory,
        StoryEditorNavigationService,
        provide: [
          {
            provide: StoryEditorNavigationService,
            UseClass: MockStoryEditorNavigationService
          }
        ]
      }]
    }).compileComponents();
  });
  beforeEach(() => {
    fixture = TestBed.createComponent(StoryPreviewTabComponent);
    component = fixture.componentInstance;
    storyObjectFactory = TestBed.get(StoryObjectFactory);
    storyEditorStateService = TestBed.get(StoryEditorStateService);
    story = storyObjectFactory.createFromBackendDict({
      id: 'storyId_0',
      title: 'Story title',
      description: 'Story Description',
      notes: '<p>Notes/p>',
      story_contents: {
        initial_node_id: 'node_1',
        next_node_id: 'node_3',
        nodes: [{
          id: 'node_1',
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          destination_node_ids: [],
          outline: 'Outline',
          exploration_id: 'exp_1',
          outline_is_finalized: false,
          thumbnail_filename: 'img.png',
          thumbnail_bg_color: '#a33f40'
        }, {
          id: 'node_2',
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          destination_node_ids: [],
          outline: 'Outline',
          exploration_id: 'exp_2',
          outline_is_finalized: false,
          thumbnail_filename: 'img2.png',
          thumbnail_bg_color: '#a33f40'
        }],
      },
      language_code: 'en',
      story_contents_schema_version: '1',
      version: '1',
      corresponding_topic_id: 'topic_id'
    });

    storyInitializedEventEmitter = new EventEmitter();
    storyReinitializedEventEmitter = new EventEmitter();

    spyOn(storyEditorStateService, 'getStory').and.returnValue(story);
    spyOnProperty(storyEditorStateService, 'onStoryInitialized').and.callFake(
      () => {
        return storyInitializedEventEmitter;
      });
    spyOnProperty(storyEditorStateService, 'onStoryReinitialized').and.callFake(
      () => {
        return storyReinitializedEventEmitter;
      });
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
      '/explore/exp_1?story_id=storyId_0&node_id=node_1');
    node = story.getStoryContents().getNodes()[1];
    expect(component.getExplorationUrl(node)).toEqual(
      '/explore/exp_2?story_id=storyId_0&node_id=node_2');
  });

  it('should called initEditor on calls from story being initialized',
    () => {
      spyOn(component, 'initEditor').and.callThrough();
      component.ngOnInit();
      storyInitializedEventEmitter.emit();
      storyReinitializedEventEmitter.emit();
      expect(component.initEditor).toHaveBeenCalledTimes(3);
    });
});
