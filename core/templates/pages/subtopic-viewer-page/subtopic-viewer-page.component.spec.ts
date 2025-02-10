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
 * @fileoverview Unit tests for subtopic viewer page component.
 */

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA, EventEmitter} from '@angular/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TranslateService} from '@ngx-translate/core';

import {PageTitleService} from 'services/page-title.service';
import {ReadOnlySubtopicPageData} from 'domain/subtopic_viewer/read-only-subtopic-page-data.model';
import {SubtopicViewerPageComponent} from './subtopic-viewer-page.component';
import {AlertsService} from 'services/alerts.service';
import {ContextService} from 'services/context.service';
import {LoaderService} from 'services/loader.service';
import {SubtopicViewerBackendApiService} from 'domain/subtopic_viewer/subtopic-viewer-backend-api.service';
import {TopicViewerBackendApiService} from 'domain/topic_viewer/topic-viewer-backend-api.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {ReadOnlyTopic} from 'domain/topic_viewer/read-only-topic-object.factory';

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

describe('Subtopic viewer page', function () {
  let component: SubtopicViewerPageComponent;
  let fixture: ComponentFixture<SubtopicViewerPageComponent>;
  let pageTitleService: PageTitleService;
  let contextService: ContextService;
  let alertsService: AlertsService;
  let windowDimensionsService: WindowDimensionsService;
  let subtopicViewerBackendApiService: SubtopicViewerBackendApiService;
  let topicViewerBackendApiService: TopicViewerBackendApiService;
  let urlService: UrlService;
  let loaderService: LoaderService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let translateService: TranslateService;

  let topicName = 'Topic Name';
  let topicId = '123abcd';
  let topicDataObject: ReadOnlyTopic = new ReadOnlyTopic(
    topicName,
    topicId,
    'Topic Description',
    [],
    [],
    [],
    [],
    {},
    {},
    true,
    '',
    ''
  );

  let subtopicTitle = 'Subtopic Title';
  let subtopicUrlFragment = 'subtopic-title';
  let subtopicDataObject: ReadOnlySubtopicPageData =
    ReadOnlySubtopicPageData.createFromBackendDict({
      topic_id: topicId,
      topic_name: topicName,
      subtopic_title: subtopicTitle,
      page_contents: {
        subtitled_html: {
          content_id: '',
          html: 'This is a html',
        },
        recorded_voiceovers: {
          voiceovers_mapping: {},
        },
      },
      next_subtopic_dict: {
        id: 2,
        title: '',
        skill_ids: [],
        thumbnail_filename: '',
        thumbnail_bg_color: '',
        url_fragment: subtopicUrlFragment,
      },
      prev_subtopic_dict: null,
    });

  let subtopicDataObjectWithPrevSubtopic: ReadOnlySubtopicPageData =
    ReadOnlySubtopicPageData.createFromBackendDict({
      topic_id: topicId,
      topic_name: topicName,
      subtopic_title: subtopicTitle,
      page_contents: {
        subtitled_html: {
          content_id: '',
          html: 'This is a html',
        },
        recorded_voiceovers: {
          voiceovers_mapping: {},
        },
      },
      next_subtopic_dict: null,
      prev_subtopic_dict: {
        id: 1,
        title: '',
        skill_ids: [],
        thumbnail_filename: '',
        thumbnail_bg_color: '',
        url_fragment: subtopicUrlFragment,
      },
    });

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [SubtopicViewerPageComponent, MockTranslatePipe],
      providers: [
        AlertsService,
        ContextService,
        LoaderService,
        PageTitleService,
        SubtopicViewerBackendApiService,
        UrlService,
        WindowDimensionsService,
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubtopicViewerPageComponent);
    component = fixture.componentInstance;
    pageTitleService = TestBed.inject(PageTitleService);
    contextService = TestBed.inject(ContextService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    alertsService = TestBed.inject(AlertsService);
    subtopicViewerBackendApiService = TestBed.inject(
      SubtopicViewerBackendApiService
    );
    topicViewerBackendApiService = TestBed.inject(TopicViewerBackendApiService);
    urlService = TestBed.inject(UrlService);
    loaderService = TestBed.inject(LoaderService);
    translateService = TestBed.inject(TranslateService);

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true
    );
  });

  it(
    'should successfully get topic/subtopic data and set context with ' +
      'next subtopic card',
    fakeAsync(() => {
      spyOn(component, 'subscribeToOnLangChange');
      spyOn(contextService, 'setCustomEntityContext');
      spyOn(contextService, 'removeCustomEntityContext');
      spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
        'topic-url'
      );
      spyOn(
        urlService,
        'getClassroomUrlFragmentFromLearnerUrl'
      ).and.returnValue('classroom-url');
      spyOn(urlService, 'getSubtopicUrlFragmentFromLearnerUrl').and.returnValue(
        'subtopic-url'
      );
      spyOn(loaderService, 'showLoadingScreen');

      expect(component.subtopicSummaryIsShown).toBe(false);
      spyOn(
        subtopicViewerBackendApiService,
        'fetchSubtopicDataAsync'
      ).and.returnValue(Promise.resolve(subtopicDataObject));
      spyOn(
        topicViewerBackendApiService,
        'fetchTopicDataAsync'
      ).and.returnValue(Promise.resolve(topicDataObject));
      spyOn(
        i18nLanguageCodeService,
        'getSubtopicTranslationKey'
      ).and.returnValue('I18N_SUBTOPIC_123abcd_test_TITLE');
      spyOn(i18nLanguageCodeService, 'getTopicTranslationKey').and.returnValue(
        'I18N_SUBTOPIC_123abcd_test_TITLE'
      );
      spyOn(
        i18nLanguageCodeService,
        'isCurrentLanguageEnglish'
      ).and.returnValue(false);
      spyOn(
        i18nLanguageCodeService,
        'isHackyTranslationAvailable'
      ).and.returnValue(true);

      component.ngOnInit();
      tick();

      expect(component.pageContents).toEqual(
        subtopicDataObject.getPageContents()
      );
      expect(component.subtopicTitle).toEqual(
        subtopicDataObject.getSubtopicTitle()
      );
      expect(component.parentTopicId).toEqual(
        subtopicDataObject.getParentTopicId()
      );
      expect(component.parentTopicTitle).toEqual(
        subtopicDataObject.getParentTopicName()
      );
      expect(component.nextSubtopic).toEqual(
        subtopicDataObject.getNextSubtopic()
      );
      expect(component.prevSubtopic).toBeUndefined();
      expect(component.subtopicSummaryIsShown).toBeTrue();

      expect(component.subtopicTitleTranslationKey).toEqual(
        'I18N_SUBTOPIC_123abcd_test_TITLE'
      );
      expect(component.parentTopicTitleTranslationKey).toEqual(
        'I18N_SUBTOPIC_123abcd_test_TITLE'
      );
      let hackySubtopicTitleTranslationIsDisplayed =
        component.isHackySubtopicTitleTranslationDisplayed();
      let hackyTopicTitleTranslationIsDisplayed =
        component.isHackyTopicTitleTranslationDisplayed();
      expect(hackySubtopicTitleTranslationIsDisplayed).toBe(true);
      expect(hackyTopicTitleTranslationIsDisplayed).toBe(true);
      expect(contextService.setCustomEntityContext).toHaveBeenCalled();
      expect(component.subscribeToOnLangChange).toHaveBeenCalled();

      component.ngOnDestroy();
      expect(contextService.removeCustomEntityContext).toHaveBeenCalled();
    })
  );

  it(
    'should obtain translated title and set it whenever the ' +
      'selected language changes',
    () => {
      component.subscribeToOnLangChange();
      spyOn(component, 'setPageTitle');
      translateService.onLangChange.emit();

      expect(component.setPageTitle).toHaveBeenCalled();
    }
  );

  it('should set page title', () => {
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(pageTitleService, 'setDocumentTitle');
    component.subtopicTitle = subtopicTitle;
    component.setPageTitle();

    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_SUBTOPIC_VIEWER_PAGE_TITLE',
      {
        subtopicTitle: 'Subtopic Title',
      }
    );
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'I18N_SUBTOPIC_VIEWER_PAGE_TITLE'
    );
  });

  it('should unsubscribe upon component destruction', () => {
    component.subscribeToOnLangChange();
    expect(component.directiveSubscriptions.closed).toBe(false);
    component.ngOnDestroy();

    expect(component.directiveSubscriptions.closed).toBe(true);
  });

  it('should successfully get subtopic data with prev subtopic card', fakeAsync(() => {
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'topic-url'
    );
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'classroom-url'
    );
    spyOn(urlService, 'getSubtopicUrlFragmentFromLearnerUrl').and.returnValue(
      'subtopic-url'
    );
    spyOn(loaderService, 'showLoadingScreen');

    expect(component.subtopicSummaryIsShown).toBe(false);
    spyOn(
      subtopicViewerBackendApiService,
      'fetchSubtopicDataAsync'
    ).and.returnValue(Promise.resolve(subtopicDataObjectWithPrevSubtopic));

    component.ngOnInit();
    tick();

    expect(component.pageContents).toEqual(
      subtopicDataObjectWithPrevSubtopic.getPageContents()
    );
    expect(component.subtopicTitle).toEqual(
      subtopicDataObjectWithPrevSubtopic.getSubtopicTitle()
    );
    expect(component.parentTopicId).toEqual(
      subtopicDataObjectWithPrevSubtopic.getParentTopicId()
    );
    expect(component.prevSubtopic).toEqual(
      subtopicDataObjectWithPrevSubtopic.getPrevSubtopic()
    );
    expect(component.nextSubtopic).toBeUndefined();
    expect(component.subtopicSummaryIsShown).toBeTrue();

    component.ngOnDestroy();
  }));

  it('should use reject handler when fetching subtopic data fails', fakeAsync(() => {
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'topic-url'
    );
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'classroom-url'
    );
    spyOn(urlService, 'getSubtopicUrlFragmentFromLearnerUrl').and.returnValue(
      'subtopic-url'
    );
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(
      subtopicViewerBackendApiService,
      'fetchSubtopicDataAsync'
    ).and.returnValue(
      Promise.reject({
        status: 404,
      })
    );
    spyOn(alertsService, 'addWarning');
    component.ngOnInit();
    tick();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Failed to get subtopic data'
    );
  }));

  it('should check if the view is mobile or not', function () {
    let widthSpy = spyOn(windowDimensionsService, 'getWidth');
    widthSpy.and.returnValue(400);
    expect(component.checkMobileView()).toBe(true);

    widthSpy.and.returnValue(700);
    expect(component.checkMobileView()).toBe(false);
  });
});
