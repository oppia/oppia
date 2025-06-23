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

import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {SubtopicPreviewTab} from './subtopic-preview-tab.component';
import {Topic} from 'domain/topic/topic-object.model';
import {Subtopic} from 'domain/topic/subtopic.model';
import {TopicEditorRoutingService} from '../services/topic-editor-routing.service';
import {TopicEditorStateService} from '../services/topic-editor-state.service';
import {SubtopicPage} from 'domain/topic/subtopic-page.model';
import {SubtopicPageContents} from 'domain/topic/subtopic-page-contents.model';
import {StudyGuide} from 'domain/topic/study-guide.model';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {EventEmitter} from '@angular/core';
import {NO_ERRORS_SCHEMA} from '@angular/core';

class MockPlatformFeatureService {
  status = {
    ShowRestructuredStudyGuides: {
      isEnabled: false,
    },
  };
}

describe('SubtopicPreviewTab', () => {
  let component: SubtopicPreviewTab;
  let fixture: ComponentFixture<SubtopicPreviewTab>;
  let topicEditorStateService: TopicEditorStateService;
  let topicEditorRoutingService: TopicEditorRoutingService;
  let windowDimensionsService: WindowDimensionsService;
  let platformFeatureService: PlatformFeatureService;
  let subtopicPage: SubtopicPage;
  let subtopic: Subtopic;
  let topic: Topic;
  let studyGuide: StudyGuide;

  let subtopicPageContentsDict = SubtopicPageContents.createFromBackendDict({
    subtitled_html: {
      html: 'test content',
      content_id: 'content',
    },
    recorded_voiceovers: {
      voiceovers_mapping: {
        content: {
          en: {
            filename: 'test.mp3',
            file_size_bytes: 100,
            needs_update: false,
            duration_secs: 10,
          },
        },
      },
    },
  });
  let topicInitializedEventEmitter = new EventEmitter();
  let topicReinitializedEventEmitter = new EventEmitter();
  let subtopicPageLoadedEventEmitter = new EventEmitter();
  let studyGuideLoadedEventEmitter = new EventEmitter();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [SubtopicPreviewTab],
      providers: [
        TopicEditorStateService,
        TopicEditorRoutingService,
        WindowDimensionsService,
        {
          provide: PlatformFeatureService,
          useClass: MockPlatformFeatureService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  afterEach(() => {
    component.ngOnDestroy();
  });

  beforeEach(() => {
    topicEditorStateService = TestBed.get(TopicEditorStateService);
    topicEditorRoutingService = TestBed.get(TopicEditorRoutingService);
    windowDimensionsService = TestBed.get(WindowDimensionsService);
    platformFeatureService = TestBed.get(PlatformFeatureService);

    fixture = TestBed.createComponent(SubtopicPreviewTab);
    component = fixture.componentInstance;

    topic = new Topic(
      'id',
      'Topic name loading',
      'Abbrev. name loading',
      'Url Fragment loading',
      'Topic description loading',
      'en',
      [],
      [],
      [],
      1,
      1,
      [],
      'str',
      '',
      {},
      false,
      '',
      '',
      []
    );

    subtopic = Subtopic.createFromTitle(1, 'Subtopic1');
    subtopic.setThumbnailFilename('thumbnailFilename.svg');
    subtopic.setThumbnailBgColor('#FFFFFF');

    topic.getSubtopics = function () {
      return [subtopic];
    };
    topic.getId = () => {
      return '1';
    };
    topic.getSubtopicById = function (id) {
      return id === 99 ? null : subtopic;
    };

    subtopicPage = SubtopicPage.createDefault('topicId', 1);
    subtopicPage.setPageContents(subtopicPageContentsDict);

    studyGuide = StudyGuide.createFromBackendDict({
      id: 'topic_id-1',
      topic_id: 'topic_id',
      sections: [
        {
          heading: {
            content_id: 'section_heading_0',
            unicode_str: 'section heading',
          },
          content: {
            content_id: 'section_content_1',
            html: '<p>section content</p>',
          },
        },
      ],
      next_content_id_index: 2,
      language_code: 'en',
    });

    spyOn(topicEditorStateService, 'getTopic').and.returnValue(topic);
    spyOn(topicEditorStateService, 'getSubtopicPage').and.returnValue(
      subtopicPage
    );
    spyOn(topicEditorStateService, 'getStudyGuide').and.returnValue(studyGuide);
    spyOn(topicEditorRoutingService, 'getSubtopicIdFromUrl').and.returnValue(1);
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);

    // Default to feature flag disabled.
    platformFeatureService.status = {
      ShowRestructuredStudyGuides: {
        isEnabled: false,
      },
    };
  });

  describe('when ShowRestructuredStudyGuides feature is disabled', () => {
    beforeEach(() => {
      platformFeatureService.status.ShowRestructuredStudyGuides.isEnabled =
        false;
    });

    it('should initialize when subtopic preview tab is opened', () => {
      spyOn(topicEditorStateService, 'loadSubtopicPage');
      component.ngOnInit();

      expect(component.topic).toEqual(topic);
      expect(component.subtopicId).toBe(1);
      expect(component.subtopic).toEqual(subtopic);
      expect(topicEditorStateService.loadSubtopicPage).toHaveBeenCalledWith(
        '1',
        1
      );
      expect(component.editableTitle).toBe('Subtopic1');
      expect(component.editableThumbnailFilename).toBe('thumbnailFilename.svg');
      expect(component.editableThumbnailBgColor).toBe('#FFFFFF');
      expect(component.subtopicPage).toEqual(subtopicPage);
      expect(component.pageContents).toEqual(subtopicPageContentsDict);
      expect(component.htmlData).toEqual('test content');
      expect(component.thumbnailIsShown).toBe(true);
    });

    it('should get subtopic contents when subtopic preview page is loaded', () => {
      spyOnProperty(
        topicEditorStateService,
        'onSubtopicPageLoaded'
      ).and.returnValue(subtopicPageLoadedEventEmitter);

      component.ngOnInit();
      component.htmlData = '';

      subtopicPageLoadedEventEmitter.emit();

      expect(component.subtopicPage).toEqual(subtopicPage);
      expect(component.pageContents).toEqual(subtopicPageContentsDict);
      expect(component.htmlData).toEqual('test content');
    });

    it('should call initEditor when topic is initialized', () => {
      spyOnProperty(
        topicEditorStateService,
        'onTopicInitialized'
      ).and.returnValue(topicInitializedEventEmitter);

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
      spyOnProperty(
        topicEditorStateService,
        'onTopicInitialized'
      ).and.returnValue(topicInitializedEventEmitter);
      spyOnProperty(
        topicEditorStateService,
        'onTopicReinitialized'
      ).and.returnValue(topicReinitializedEventEmitter);

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
  });

  describe('when ShowRestructuredStudyGuides feature is enabled', () => {
    beforeEach(() => {
      platformFeatureService.status.ShowRestructuredStudyGuides.isEnabled =
        true;
    });

    it('should initialize with study guide when subtopic preview tab is opened', () => {
      spyOn(topicEditorStateService, 'loadStudyGuide');
      component.ngOnInit();

      expect(component.topic).toEqual(topic);
      expect(component.subtopicId).toBe(1);
      expect(component.subtopic).toEqual(subtopic);
      expect(topicEditorStateService.loadStudyGuide).toHaveBeenCalledWith(
        '1',
        1
      );
      expect(component.editableTitle).toBe('Subtopic1');
      expect(component.editableThumbnailFilename).toBe('thumbnailFilename.svg');
      expect(component.editableThumbnailBgColor).toBe('#FFFFFF');
      expect(component.studyGuide).toEqual(studyGuide);
      expect(component.thumbnailIsShown).toBe(true);
    });

    it('should get study guide contents when study guide is loaded', () => {
      spyOnProperty(
        topicEditorStateService,
        'onStudyGuideLoaded'
      ).and.returnValue(studyGuideLoadedEventEmitter);

      component.ngOnInit();
      component.sections = [];

      studyGuideLoadedEventEmitter.emit();

      expect(component.studyGuide).toEqual(studyGuide);
    });

    it('should call initEditor when topic is initialized with study guide', () => {
      spyOnProperty(
        topicEditorStateService,
        'onTopicInitialized'
      ).and.returnValue(topicInitializedEventEmitter);

      component.ngOnInit();
      component.subtopicId = 2;
      component.editableTitle = 'random title';
      component.editableThumbnailFilename = 'random_file_name.svg';

      topicInitializedEventEmitter.emit();

      expect(component.subtopicId).toBe(1);
      expect(component.editableTitle).toBe('Subtopic1');
      expect(component.editableThumbnailFilename).toBe('thumbnailFilename.svg');
      expect(component.studyGuide).toEqual(studyGuide);
    });
  });

  it('should navigate to subtopic editor when subtopic is clicked', () => {
    spyOn(topicEditorRoutingService, 'navigateToSubtopicEditorWithId');

    // Pre-check.
    expect(component.subtopicId).not.toBeDefined();

    component.ngOnInit();
    component.navigateToSubtopic();

    expect(component.subtopicId).toBe(1);
    expect(
      topicEditorRoutingService.navigateToSubtopicEditorWithId
    ).toHaveBeenCalledWith(1);
  });

  it('should set thumbnailIsShown based on window dimensions', () => {
    windowDimensionsService.isWindowNarrow = jasmine
      .createSpy()
      .and.returnValue(true);

    component.ngOnInit();

    expect(component.thumbnailIsShown).toBe(false);
    expect(windowDimensionsService.isWindowNarrow).toHaveBeenCalled();
  });

  it('should return correct value for isShowRestructuredStudyGuidesFeatureEnabled', () => {
    platformFeatureService.status.ShowRestructuredStudyGuides.isEnabled = true;
    expect(component.isShowRestructuredStudyGuidesFeatureEnabled()).toBe(true);

    platformFeatureService.status.ShowRestructuredStudyGuides.isEnabled = false;
    expect(component.isShowRestructuredStudyGuidesFeatureEnabled()).toBe(false);
  });

  it('should handle case when subtopic does not exist', () => {
    topic.getSubtopicById = jasmine.createSpy().and.returnValue(null);
    spyOn(topicEditorStateService, 'loadSubtopicPage');
    spyOn(topicEditorStateService, 'loadStudyGuide');

    component.ngOnInit();

    expect(component.subtopic).toBe(null);
    expect(topicEditorStateService.loadSubtopicPage).not.toHaveBeenCalled();
    expect(topicEditorStateService.loadStudyGuide).not.toHaveBeenCalled();
  });

  it('should handle case when topic ID is empty', () => {
    topic.getId = jasmine.createSpy().and.returnValue('');
    spyOn(topicEditorStateService, 'loadSubtopicPage');
    spyOn(topicEditorStateService, 'loadStudyGuide');

    component.ngOnInit();

    expect(topicEditorStateService.loadSubtopicPage).not.toHaveBeenCalled();
    expect(topicEditorStateService.loadStudyGuide).not.toHaveBeenCalled();
  });
});
