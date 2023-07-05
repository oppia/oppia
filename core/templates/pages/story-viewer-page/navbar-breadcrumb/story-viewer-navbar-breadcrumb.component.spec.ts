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
 * @fileoverview Unit tests for storyViewerNavbarBreadcrumb.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { StoryViewerNavbarBreadcrumbComponent } from './story-viewer-navbar-breadcrumb.component';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { StoryViewerBackendApiService } from 'domain/story_viewer/story-viewer-backend-api.service';
import { UrlService } from 'services/contextual/url.service';
import { StoryPlaythrough } from 'domain/story_viewer/story-playthrough.model';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { TopicViewerBackendApiService } from 'domain/topic_viewer/topic-viewer-backend-api.service';
import { ReadOnlyTopicBackendDict, ReadOnlyTopicObjectFactory } from 'domain/topic_viewer/read-only-topic-object.factory';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

class MockUrlService {
  getTopicUrlFragmentFromLearnerUrl() {
    return 'topic_1';
  }

  getClassroomUrlFragmentFromLearnerUrl() {
    return 'classroom_1';
  }

  getStoryUrlFragmentFromLearnerUrl() {
    return 'story';
  }
}

let component: StoryViewerNavbarBreadcrumbComponent;
let fixture: ComponentFixture<StoryViewerNavbarBreadcrumbComponent>;
let readOnlyTopicObjectFactory: ReadOnlyTopicObjectFactory;
let topicViewerBackendApiService: TopicViewerBackendApiService;
let i18nLanguageCodeService: I18nLanguageCodeService;
let urlService: UrlService;

describe('Subtopic viewer navbar breadcrumb component', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        StoryViewerNavbarBreadcrumbComponent,
        MockTranslatePipe
      ],
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: StoryViewerBackendApiService,
          useValue: {
            fetchStoryDataAsync: async() => (
              new Promise((resolve) => {
                resolve(
                  StoryPlaythrough.createFromBackendDict({
                    story_id: 'id',
                    story_nodes: [],
                    story_title: 'title',
                    story_description: 'description',
                    topic_name: 'topic_1',
                    meta_tag_content: 'this is a meta tag content'
                  }));
              })
            )
          }
        },
        { provide: UrlService, useClass: MockUrlService },
        UrlInterpolationService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    readOnlyTopicObjectFactory = TestBed.inject(ReadOnlyTopicObjectFactory);
    topicViewerBackendApiService = TestBed.inject(TopicViewerBackendApiService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    urlService = TestBed.inject(UrlService);
    fixture = TestBed.createComponent(StoryViewerNavbarBreadcrumbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    spyOn(topicViewerBackendApiService, 'fetchTopicDataAsync').and.resolveTo(
      readOnlyTopicObjectFactory.createFromBackendDict({
        subtopics: [],
        skill_descriptions: {},
        uncategorized_skill_ids: [],
        degrees_of_mastery: {},
        canonical_story_dicts: [],
        additional_story_dicts: [],
        topic_name: 'Topic Name 1',
        topic_id: 'topic1',
        topic_description: 'Description',
        practice_tab_is_displayed: false,
        meta_tag_content: 'content',
        page_title_fragment_for_web: 'title',
      } as ReadOnlyTopicBackendDict)
    );
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should set story title when component is initialized',
    waitForAsync(() => {
      component.ngOnInit();
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        expect(component.topicName).toBe('topic_1');
        expect(component.storyTitle).toBe('title');
      });
    })
  );

  it('should get topic url after component is initialized', () => {
    component.ngOnInit();
    expect(component.getTopicUrl()).toBe(
      '/learn/classroom_1/topic_1/story');
  });

  it('should throw error if story url fragment is not present', () => {
    spyOn(
      urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(null);

    expect(() => {
      component.ngOnInit();
    }).toThrowError('Story url fragment is null');
  });

  it('should set topic name and story title translation key and ' +
  'check whether hacky translations are displayed or not correctly',
  waitForAsync(() => {
    component.ngOnInit();
    fixture.whenStable().then(() => {
      fixture.detectChanges();

      expect(component.topicNameTranslationKey)
        .toBe('I18N_TOPIC_topic1_TITLE');
      expect(component.storyTitleTranslationKey)
        .toBe('I18N_STORY_id_TITLE');

      spyOn(i18nLanguageCodeService, 'isHackyTranslationAvailable')
        .and.returnValues(true, false);
      spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish')
        .and.returnValues(false, false);

      let hackyTopicNameTranslationIsDisplayed =
        component.isHackyTopicNameTranslationDisplayed();
      expect(hackyTopicNameTranslationIsDisplayed).toBe(true);

      let hackyStoryTitleTranslationIsDisplayed =
        component.isHackyStoryTitleTranslationDisplayed();
      expect(hackyStoryTitleTranslationIsDisplayed).toBe(false);
    });
  }));
});
