// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the subtopic viewer navbar breadcrumb.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SubtopicViewerNavbarBreadcrumbComponent } from
  './subtopic-viewer-navbar-breadcrumb.component';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { SubtopicViewerBackendApiService } from
  'domain/subtopic_viewer/subtopic-viewer-backend-api.service';
import { UrlService } from 'services/contextual/url.service';
import { ReadOnlySubtopicPageData } from
  'domain/subtopic_viewer/read-only-subtopic-page-data.model';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

class MockUrlService {
  getTopicUrlFragmentFromLearnerUrl() {
    return 'topic_1';
  }

  getClassroomUrlFragmentFromLearnerUrl() {
    return 'classroom_1';
  }

  getSubtopicUrlFragmentFromLearnerUrl() {
    return 'subtopic_1';
  }
}

let component: SubtopicViewerNavbarBreadcrumbComponent;
let fixture: ComponentFixture<SubtopicViewerNavbarBreadcrumbComponent>;
let i18nLanguageCodeService: I18nLanguageCodeService;

describe('Subtopic viewer navbar breadcrumb component', function() {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        SubtopicViewerNavbarBreadcrumbComponent,
        MockTranslatePipe
      ],
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        {
          provide: SubtopicViewerBackendApiService,
          useValue: {
            fetchSubtopicDataAsync: async() => (
              new Promise((resolve) => {
                resolve(
                  ReadOnlySubtopicPageData.createFromBackendDict({
                    subtopic_title: 'Subtopic Title',
                    page_contents: {
                      subtitled_html: {
                        content_id: 'content_1',
                        html: 'This is a html'
                      },
                      recorded_voiceovers: {
                        voiceovers_mapping: {}
                      }
                    },
                    next_subtopic_dict: null,
                    prev_subtopic_dict: null,
                    topic_id: 'topic_1',
                    topic_name: 'topic_1'
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
    fixture = TestBed.createComponent(SubtopicViewerNavbarBreadcrumbComponent);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should set subtopic title when component is initialized',
    waitForAsync(() => {
      component.ngOnInit();
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        expect(component.topicName).toBe('topic_1');
        expect(component.subtopicTitle).toBe('Subtopic Title');
      });
    })
  );

  it('should get topic url after component is initialized', () => {
    component.ngOnInit();
    expect(component.getTopicUrl()).toBe('/learn/classroom_1/topic_1/revision');
  });

  it('should set topic name and subtopic title translation key and ' +
  'check whether hacky translations are displayed or not correctly',
  waitForAsync(() => {
    component.ngOnInit();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(component.topicNameTranslationKey)
        .toBe('I18N_TOPIC_topic_1_TITLE');
      expect(component.subtopicTitleTranslationKey)
        .toBe('I18N_SUBTOPIC_topic_1_subtopic_1_TITLE');

      spyOn(i18nLanguageCodeService, 'isHackyTranslationAvailable')
        .and.returnValues(true, false);
      spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish')
        .and.returnValues(false, false);

      let hackyTopicNameTranslationIsDisplayed =
        component.isHackyTopicNameTranslationDisplayed();
      expect(hackyTopicNameTranslationIsDisplayed).toBe(true);

      let hackySubtopicTitleTranslationIsDisplayed =
        component.isHackySubtopicTitleTranslationDisplayed();
      expect(hackySubtopicTitleTranslationIsDisplayed).toBe(false);
    });
  }));
});
