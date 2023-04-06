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
 * @fileoverview Unit tests for chapter editor tab component.
 */

import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { StoryEditorStateService } from '../services/story-editor-state.service';
import { StoryBackendDict, Story } from 'domain/story/story.model';
import { StoryEditorNavigationService } from '../services/story-editor-navigation.service';
import { EditableStoryBackendApiService } from '../../../domain/story/editable-story-backend-api.service';
import { ChapterEditorTabComponent } from './chapter-editor-tab.component';

describe('Chapter Editor Tab Component', () => {
  let component: ChapterEditorTabComponent;
  let fixture: ComponentFixture<ChapterEditorTabComponent>;
  let storyInitializedEventEmitter;
  let storyReinitializedEventEmitter;
  let storyEditorStateService: StoryEditorStateService;

  class MockStoryEditorNavigationService {
    activeTab: string = 'chapter';
    getActiveTab(): string {
      return this.activeTab;
    }

    getChapterId = () => 'node_1';
    getChapterIndex = () => null;
    navigateToStoryEditor(): void {
      this.activeTab = 'story';
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ChapterEditorTabComponent],
      providers: [
        StoryEditorNavigationService,
        EditableStoryBackendApiService,
        {
          provide: StoryEditorNavigationService,
          useClass: MockStoryEditorNavigationService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    storyEditorStateService = TestBed.inject(StoryEditorStateService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChapterEditorTabComponent);
    component = fixture.componentInstance;
    let newStory = Story.createFromBackendDict({
      id: 'storyId_0',
      title: 'Story title',
      description: 'Story Description',
      notes: '<p>Notes/p>',
      story_contents: {
        initial_node_id: 'node_1',
        next_node_id: 'node_2',
        nodes: [{
          id: 'node_1',
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          destination_node_ids: [],
          outline: 'Outline',
          exploration_id: null,
          outline_is_finalized: false
        }],
      },
      language_code: 'en',
      story_contents_schema_version: 1,
      version: 1,
      corresponding_topic_id: 'topic_id'
    } as unknown as StoryBackendDict);

    storyInitializedEventEmitter = new EventEmitter();
    storyReinitializedEventEmitter = new EventEmitter();

    spyOnProperty(storyEditorStateService, 'onStoryInitialized').and.callFake(
      () => {
        return storyInitializedEventEmitter;
      });
    spyOnProperty(storyEditorStateService, 'onStoryReinitialized').and.callFake(
      () => {
        return storyReinitializedEventEmitter;
      });

    storyEditorStateService.setStory(newStory);
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should set initialize chapter index from the story', () => {
    component.ngOnInit();
    expect(component.chapterId).toEqual('node_1');
    expect(component.chapterIndex).toEqual(0);
  });

  it('should call StoryEditorNavigationService to navigate to story editor',
    () => {
      component.ngOnInit();
      component.navigateToStoryEditor();
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
