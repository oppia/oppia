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
 * @fileoverview Unit tests for classroom page component.
 */

import { TestBed, ComponentFixture, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UrlService } from 'services/contextual/url.service';
import { TopicViewerBackendApiService } from
  'domain/topic_viewer/topic-viewer-backend-api.service';
import { ReadOnlyTopicBackendDict, ReadOnlyTopicObjectFactory } from
  'domain/topic_viewer/read-only-topic-object.factory';
import { TopicViewerNavbarBreadcrumbComponent } from 'pages/topic-viewer-page/navbar-breadcrumb/topic-viewer-navbar-breadcrumb.component';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';

describe('Topic viewer navbar breadcrumb component', () => {
  let component: TopicViewerNavbarBreadcrumbComponent;
  let fixture: ComponentFixture<TopicViewerNavbarBreadcrumbComponent>;
  let readOnlyTopicObjectFactory = null;
  let topicViewerBackendApiService = null;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let urlService = null;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        MockTranslatePipe,
        TopicViewerNavbarBreadcrumbComponent
      ],
    }).compileComponents();

    readOnlyTopicObjectFactory = TestBed.inject(ReadOnlyTopicObjectFactory);
    topicViewerBackendApiService = TestBed.inject(TopicViewerBackendApiService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    urlService = TestBed.inject(UrlService);

    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'topic1');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'classroom1');

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
      } as ReadOnlyTopicBackendDict));
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicViewerNavbarBreadcrumbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should set topic name using the data retrieved from the backend',
    waitForAsync(() => {
      component.ngOnInit();
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        expect(component.topicName).toBe('Topic Name 1');
      });
    }));

  it('should set topic name translation key and check whether hacky ' +
    'translations are displayed or not correctly', waitForAsync(() => {
    component.ngOnInit();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(component.topicNameTranslationKey)
        .toBe('I18N_TOPIC_topic1_TITLE');

      spyOn(i18nLanguageCodeService, 'isHackyTranslationAvailable')
        .and.returnValue(true);
      spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish')
        .and.returnValue(false);

      let hackyTopicNameTranslationIsDisplayed =
        component.isHackyTopicNameTranslationDisplayed();
      expect(hackyTopicNameTranslationIsDisplayed).toBe(true);
    });
  }));
});
