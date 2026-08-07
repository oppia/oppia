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
 * @fileoverview Unit tests for topic preview tab.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MaterialModule} from 'modules/material.module';
import {StorySummary} from 'domain/story/story-summary.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {TopicEditorStateService} from '../services/topic-editor-state.service';
import {TopicPreviewTabComponent} from './topic-preview-tab.component';
import {Subject} from 'rxjs';

describe('Topic Preview Tab Component', () => {
  let fixture: ComponentFixture<TopicPreviewTabComponent>;
  let componentInstance: TopicPreviewTabComponent;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let mockPlatformFeatureService: MockPlatformFeatureService;
  let topicEditorStateService: MockTopicEditorStateService;
  let testName = 'test_name';
  let topicUrl = 'topic_1';
  let mockUrl = 'mock_url';
  let storySummaries = [
    new StorySummary(
      'id',
      'title',
      [],
      'thumbnailFilename',
      'thumbnailBgColor',
      'description',
      false,
      [],
      'url',
      [],
      '',
      '',
      '',
      '',
      0,
      0,
      0,
      [],
      0,
      [],
      undefined
    ),
  ];

  class MockTopicEditorStateService {
    private practiceTabDisplayed = false;
    setPracticeTabDisplayed(value: boolean) {
      this.practiceTabDisplayed = value;
    }
    getSavedTopic() {
      return this.getTopic();
    }
    getTopic() {
      return {
        getName(): string {
          return testName;
        },
        getId(): string {
          return 'topic_id';
        },
        getDescription(): string {
          return 'topic_description';
        },
        getSubtopics() {
          return [];
        },
        getUrlFragment() {
          return topicUrl;
        },
        getPracticeTabIsDisplayed: () => this.practiceTabDisplayed,
      };
    }

    getClassroomName() {
      return 'classroom_name';
    }

    getClassroomUrlFragment() {
      return 'classroom_1';
    }

    getCanonicalStorySummaries() {
      return storySummaries;
    }
  }

  class MockUrlInterpolationService {
    getStaticImageUrl(imagePath: string): string {
      return mockUrl;
    }
  }

  class MockPlatformFeatureService {
    status = {
      RedesignedTopicViewerPage: {
        isEnabled: false,
      },
    };
  }

  beforeEach(waitForAsync(() => {
    mockTranslateService = jasmine.createSpyObj(
      'TranslateService',
      ['instant'],
      {
        onLangChange: new Subject(),
      }
    );
    mockPlatformFeatureService = new MockPlatformFeatureService();

    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MaterialModule,
        TranslateModule.forRoot(),
      ],
      declarations: [TopicPreviewTabComponent],
      providers: [
        MockTopicEditorStateService,
        {
          provide: TopicEditorStateService,
          useExisting: MockTopicEditorStateService,
        },
        {
          provide: UrlInterpolationService,
          useClass: MockUrlInterpolationService,
        },
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService,
        },
        {
          provide: TranslateService,
          useValue: mockTranslateService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicPreviewTabComponent);
    componentInstance = fixture.componentInstance;

    topicEditorStateService = TestBed.inject(MockTopicEditorStateService);

    componentInstance.ngOnInit();
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize', () => {
    componentInstance.ngOnInit();
    expect(componentInstance.classroomUrlFragment).toEqual('classroom_1');
    expect(componentInstance.topicUrlFragment).toEqual('topic_1');
    expect(componentInstance.topicName).toEqual(testName);
    expect(componentInstance.subtopics).toEqual([]);
    expect(componentInstance.canonicalStorySummaries).toEqual(storySummaries);
    expect(componentInstance.chapterCount).toEqual(0);
    expect(componentInstance.canonicalStorySectionData.length).toEqual(1);
    expect(componentInstance.canonicalStorySectionData[0].storyId).toEqual(
      'id'
    );
    expect(componentInstance.canonicalStorySectionData[0].storyTitle).toEqual(
      'title'
    );
    expect(
      componentInstance.canonicalStorySectionData[0].storyDescription
    ).toEqual('description');
    expect(
      componentInstance.canonicalStorySectionData[0].practiceSubtopicIds
    ).toEqual([]);
    expect(
      componentInstance.canonicalStorySectionData[0].practiceCount
    ).toEqual(0);
    expect(componentInstance.canonicalStorySectionData[0].lessonCount).toEqual(
      0
    );
    expect(
      componentInstance.canonicalStorySectionData[0].classroomUrlFragment
    ).toEqual('classroom_1');
    expect(
      componentInstance.canonicalStorySectionData[0].topicUrlFragment
    ).toEqual('topic_1');
  });

  it('should build practice subtopic ids from subtopics with skill summaries', () => {
    const subtopicSpy = jasmine.createSpyObj('Subtopic', [
      'getId',
      'getSkillSummaries',
    ]);
    subtopicSpy.getId.and.returnValue(2);
    subtopicSpy.getSkillSummaries.and.returnValue(['skill_summary']);
    const emptySubtopicSpy = jasmine.createSpyObj('Subtopic', [
      'getId',
      'getSkillSummaries',
    ]);
    emptySubtopicSpy.getId.and.returnValue(3);
    emptySubtopicSpy.getSkillSummaries.and.returnValue([]);
    const topicSpy = jasmine.createSpyObj('Topic', [
      'getName',
      'getId',
      'getDescription',
      'getUrlFragment',
      'getSubtopics',
      'getPracticeTabIsDisplayed',
    ]);
    topicSpy.getName.and.returnValue(testName);
    topicSpy.getId.and.returnValue('topic_id');
    topicSpy.getDescription.and.returnValue('topic_description');
    topicSpy.getUrlFragment.and.returnValue(topicUrl);
    topicSpy.getSubtopics.and.returnValue([subtopicSpy, emptySubtopicSpy]);
    spyOn(topicEditorStateService, 'getTopic').and.returnValue(topicSpy);

    componentInstance.ngOnInit();

    expect(
      componentInstance.canonicalStorySectionData[0].practiceSubtopicIds
    ).toEqual([2]);
    expect(
      componentInstance.canonicalStorySectionData[0].practiceCount
    ).toEqual(1);
  });

  it('should track story section data by story id', () => {
    expect(
      componentInstance.trackStoryDataById(
        0,
        componentInstance.canonicalStorySectionData[0]
      )
    ).toEqual('id');
  });

  it('should get static image url', () => {
    expect(componentInstance.getStaticImageUrl('image_path')).toEqual(mockUrl);
  });

  it('should navigate among preview tabs', () => {
    componentInstance.changePreviewTab('story');
    expect(componentInstance.activeTab).toEqual('story');
    componentInstance.changePreviewTab('subtopic');
    expect(componentInstance.activeTab).toEqual('subtopic');
    componentInstance.changePreviewTab('practice');
    expect(componentInstance.activeTab).toEqual('practice');
  });

  it('should return true when practiceTabIsDisplayed is true', () => {
    topicEditorStateService.setPracticeTabDisplayed(true);
    componentInstance.ngOnInit();
    expect(componentInstance.isPracticeTabEnabled()).toBe(true);
  });

  it('should return false when practiceTabIsDisplayed is false', () => {
    topicEditorStateService.setPracticeTabDisplayed(false);
    componentInstance.ngOnInit();
    expect(componentInstance.isPracticeTabEnabled()).toBe(false);
  });

  it('should return true when redesigned topic viewer page feature is enabled', () => {
    mockPlatformFeatureService.status.RedesignedTopicViewerPage.isEnabled =
      true;
    expect(componentInstance.isRedesignedTopicViewerPageFeatureEnabled()).toBe(
      true
    );
  });

  it('should return false when redesigned topic viewer page feature is disabled', () => {
    mockPlatformFeatureService.status.RedesignedTopicViewerPage.isEnabled =
      false;
    expect(componentInstance.isRedesignedTopicViewerPageFeatureEnabled()).toBe(
      false
    );
  });

  it('should default story description to an empty string when absent', () => {
    const storySummarySpy = jasmine.createSpyObj('StorySummary', [
      'getId',
      'getTitle',
      'getDescription',
      'getNodeTitles',
    ]);
    storySummarySpy.getId.and.returnValue('id');
    storySummarySpy.getTitle.and.returnValue('title');
    storySummarySpy.getDescription.and.returnValue('');
    storySummarySpy.getNodeTitles.and.returnValue([]);
    componentInstance.canonicalStorySummaries = [storySummarySpy];

    componentInstance.ngOnInit();

    expect(
      componentInstance.canonicalStorySectionData[0].storyDescription
    ).toBe('');
  });

  it('should update page title on language change', () => {
    spyOn(componentInstance, 'setPageTitle');
    componentInstance.subscribeToOnLangChange();
    mockTranslateService.onLangChange.next();
    expect(componentInstance.setPageTitle).toHaveBeenCalled();
  });
});
