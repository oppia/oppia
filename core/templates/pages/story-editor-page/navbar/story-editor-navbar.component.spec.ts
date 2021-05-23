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
 * @fileoverview Unit tests for the story editor navbar component.
 */

import { Story, StoryObjectFactory } from 'domain/story/StoryObjectFactory';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { StoryEditorStateService } from '../services/story-editor-state.service';
import { StoryEditorNavbarComponent } from './story-editor-navbar.component';
import { EditableStoryBackendApiService } from 'domain/story/editable-story-backend-api.service';
import { AlertsService } from 'services/alerts.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('Story editor navbar directive', () => {
  let component: StoryEditorNavbarComponent;
  let fixture: ComponentFixture<StoryEditorNavbarComponent>;
  let story: Story;
  let storyObjectFactory = null;
  let storyEditorStateService: StoryEditorStateService;
  let undoRedoService: UndoRedoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [StoryEditorNavbarComponent],
      providers: [
        StoryObjectFactory,
        StoryEditorStateService,
        UndoRedoService,
        EditableStoryBackendApiService,
        AlertsService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StoryEditorNavbarComponent);
    component = fixture.componentInstance;
    undoRedoService = TestBed.inject(UndoRedoService);
    storyEditorStateService = TestBed.inject(StoryEditorStateService);
    undoRedoService = TestBed.inject(UndoRedoService);
    storyObjectFactory = TestBed.inject(StoryObjectFactory);
    story = storyObjectFactory.createFromBackendDict({
      id: 'storyId_0',
      title: 'Story title',
      description: 'Story Description',
      notes: '<p>Notes/p>',
      story_contents: {
        initial_node_id: 'node_1',
        next_node_id: 'node_3',
        nodes: [{
          title: 'title_1',
          description: 'description_1',
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
          title: 'title_2',
          description: 'description_2',
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
      version: 1,
      corresponding_topic_id: 'topic_id'
    });
    spyOn(storyEditorStateService, 'getSkillSummaries').and.returnValue(
      [{
        id: 'abc',
        description: 'description',
        language_code: 'en',
        version: 1,
        misconception_count: 1,
        worked_examples_count: 1,
        skill_model_created_on: 1,
        skill_model_last_updated: 1,
      }]);
    spyOn(storyEditorStateService, 'getStory').and.returnValue(story);
    spyOn(storyEditorStateService, 'getClassroomUrlFragment').and.returnValue(
      'math');
    spyOn(storyEditorStateService, 'getTopicUrlFragment').and.returnValue(
      'fractions');
    spyOn(storyEditorStateService, 'getTopicName').and.returnValue('addition');
  });

  it('should init the controller', () => {
    component.ngOnInit();
    expect(component.warningsAreShown).toEqual(false);
    expect(component.forceValidateExplorations).toEqual(true);
    expect(component.showNavigationOptions).toEqual(false);
    expect(component.showStoryEditOptions).toEqual(false);
  });

  it('should return change list length', () => {
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(10);
    expect(component.getChangeListLength()).toEqual(10);
  });
});
