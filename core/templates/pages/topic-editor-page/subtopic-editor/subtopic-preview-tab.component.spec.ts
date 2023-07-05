// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the subtopic preview tab directive.
 */

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SubtopicPreviewTab } from './subtopic-preview-tab.component';
import { Topic } from 'domain/topic/topic-object.model';
import { Subtopic } from 'domain/topic/subtopic.model';
import { TopicEditorRoutingService } from '../services/topic-editor-routing.service';
import { TopicEditorStateService } from '../services/topic-editor-state.service';
import { SubtopicPage } from 'domain/topic/subtopic-page.model';
import { SubtopicPageContents } from 'domain/topic/subtopic-page-contents.model';
import { EventEmitter } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('SubtopicPreviewTab', () => {
  let component: SubtopicPreviewTab;
  let fixture: ComponentFixture<SubtopicPreviewTab>;
  let topicEditorStateService: TopicEditorStateService;
  let topicEditorRoutingService: TopicEditorRoutingService;
  let subtopicPage: SubtopicPage;
  let subtopic: Subtopic;
  let topic: Topic;
  let subtopicPageContentsDict = SubtopicPageContents.createFromBackendDict({
    subtitled_html: {
      html: 'test content',
      content_id: 'content'
    },
    recorded_voiceovers: {
      voiceovers_mapping: {
        content: {
          en: {
            filename: 'test.mp3',
            file_size_bytes: 100,
            needs_update: false,
            duration_secs: 10
          }
        }
      }
    }
  });
  let topicInitializedEventEmitter = new EventEmitter();
  let topicReinitializedEventEmitter = new EventEmitter();
  let subtopicPageLoadedEventEmitter = new EventEmitter();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [SubtopicPreviewTab],
      providers: [TopicEditorStateService, TopicEditorRoutingService],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  afterEach(() => {
    component.ngOnDestroy();
  });

  beforeEach(() => {
    topicEditorStateService = TestBed.get(TopicEditorStateService);
    topicEditorRoutingService = TestBed.get(TopicEditorRoutingService);

    fixture = TestBed.createComponent(SubtopicPreviewTab);
    component = fixture.componentInstance;

    topic = new Topic(
      'id', 'Topic name loading', 'Abbrev. name loading',
      'Url Fragment loading', 'Topic description loading', 'en',
      [], [], [], 1, 1, [], 'str', '', {}, false, '', '', []
    );
    subtopic = Subtopic.createFromTitle(1, 'Subtopic1');
    subtopic.setThumbnailFilename('thumbnailFilename.svg');
    subtopic.setThumbnailBgColor('#FFFFFF');
    topic.getSubtopics = function() {
      return [subtopic];
    };
    topic.getId = () => {
      return '1';
    };
    topic.getSubtopicById = function(id) {
      return id === 99 ? null : subtopic;
    };

    subtopicPage = SubtopicPage.createDefault('topicId', 1);
    subtopicPage.setPageContents(subtopicPageContentsDict);

    spyOn(topicEditorStateService, 'getTopic').and.returnValue(topic);
    spyOn(topicEditorStateService, 'getSubtopicPage').and
      .returnValue(subtopicPage);
    spyOn(topicEditorRoutingService, 'getSubtopicIdFromUrl').and
      .returnValue(1);
  });

  it('should initialize when subtopic preview tab is opened', () => {
    spyOn(topicEditorStateService, 'loadSubtopicPage');
    component.ngOnInit();

    expect(component.topic).toEqual(topic);
    expect(component.subtopicId).toBe(1);
    expect(component.subtopic).toEqual(subtopic);
    expect(topicEditorStateService.loadSubtopicPage)
      .toHaveBeenCalledWith('1', 1);
    expect(component.editableTitle).toBe('Subtopic1');
    expect(component.editableThumbnailFilename).toBe('thumbnailFilename.svg');
    expect(component.editableThumbnailBgColor).toBe('#FFFFFF');
    expect(component.subtopicPage).toEqual(subtopicPage);
    expect(component.pageContents).toEqual(subtopicPageContentsDict);
    expect(component.htmlData).toEqual('test content');
  });

  it('should get subtopic contents when subtopic preview page is' +
  ' loaded', () => {
    spyOnProperty(topicEditorStateService, 'onSubtopicPageLoaded').and
      .returnValue(subtopicPageLoadedEventEmitter);
    // The ngOnInit is called to add the directiveSubscriptions.
    component.ngOnInit();
    component.htmlData = '';

    subtopicPageLoadedEventEmitter.emit();

    expect(component.subtopicPage).toEqual(subtopicPage);
    expect(component.pageContents).toEqual(subtopicPageContentsDict);
    expect(component.htmlData).toEqual('test content');
  });

  it('should call initEditor when topic is initialized', () => {
    spyOnProperty(topicEditorStateService, 'onTopicInitialized').and
      .returnValue(topicInitializedEventEmitter);
    // The ngOnInit is called to add the directiveSubscriptions.
    component.ngOnInit();
    component.subtopicId = 2;
    component.editableTitle = 'random title';
    component.editableThumbnailFilename = 'random_file_name.svg';

    topicInitializedEventEmitter.emit();

    expect(component.subtopicId).toBe(1);
    expect(component.editableTitle).toBe('Subtopic1');
    expect(component.editableThumbnailFilename).toBe('thumbnailFilename.svg');
  });

  it('should call initEditor when topic is reinitialized', () => {
    spyOnProperty(topicEditorStateService, 'onTopicInitialized').and
      .returnValue(topicInitializedEventEmitter);
    spyOnProperty(topicEditorStateService, 'onTopicReinitialized').and
      .returnValue(topicReinitializedEventEmitter);
    // The ngOnInit is called to add the directiveSubscriptions.
    component.ngOnInit();

    topicInitializedEventEmitter.emit();
    // Change values.
    component.subtopicId = 2;
    component.editableTitle = 'random title';
    component.editableThumbnailFilename = 'random_file_name.svg';
    topicReinitializedEventEmitter.emit();

    expect(component.subtopicId).toBe(1);
    expect(component.editableTitle).toBe('Subtopic1');
    expect(component.editableThumbnailFilename).toBe('thumbnailFilename.svg');
  });

  it('should navigate to subtopic editor when subtopic is clicked', () => {
    spyOn(topicEditorRoutingService, 'navigateToSubtopicEditorWithId');

    // Pre-check.
    expect(component.subtopicId).not.toBeDefined();

    component.ngOnInit();
    component.navigateToSubtopic();

    expect(component.subtopicId).toBe(1);
    expect(topicEditorRoutingService.navigateToSubtopicEditorWithId)
      .toHaveBeenCalledWith(1);
  });
});
