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
import {TopicEditorStateService} from '../services/topic-editor-state.service';
import {TopicPreviewTabComponent} from './topic-preview-tab.component';
import {EventEmitter} from '@angular/core';

describe('Topic Preview Tab Component', () => {
  let fixture: ComponentFixture<TopicPreviewTabComponent>;
  let componentInstance: TopicPreviewTabComponent;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let testName = 'test_name';
  let mockUrl = 'mock_url';
  let topicUrl = 'topic_1';
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
      0,
      0,
      0,
      [],
      0,
      []
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

  beforeEach(waitForAsync(() => {
    mockTranslateService = jasmine.createSpyObj('TranslateService', [
      'instant',
    ]);
    mockTranslateService.onLangChange = new EventEmitter();

    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MaterialModule,
        TranslateModule.forRoot(),
      ],
      declarations: [TopicPreviewTabComponent],
      providers: [
        {
          provide: TopicEditorStateService,
          useClass: MockTopicEditorStateService,
        },
        {
          provide: UrlInterpolationService,
          useClass: MockUrlInterpolationService,
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
    (
      componentInstance.topicEditorStateService as MockTopicEditorStateService
    ).setPracticeTabDisplayed(true);
    componentInstance.ngOnInit();
    expect(componentInstance.isPracticeTabEnabled()).toBeTrue();
  });

  it('should return false when practiceTabIsDisplayed is false', () => {
    (
      componentInstance.topicEditorStateService as MockTopicEditorStateService
    ).setPracticeTabDisplayed(false);
    componentInstance.ngOnInit();
    expect(componentInstance.isPracticeTabEnabled()).toBeFalse();
  });

  it('should update page title on language change', () => {
    spyOn(componentInstance, 'setPageTitle');
    componentInstance.subscribeToOnLangChange();
    mockTranslateService.onLangChange.emit();
    expect(componentInstance.setPageTitle).toHaveBeenCalled();
  });
});
