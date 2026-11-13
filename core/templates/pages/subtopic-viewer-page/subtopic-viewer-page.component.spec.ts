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
import {PageContextService} from 'services/page-context.service';
import {LoaderService} from 'services/loader.service';
import {SubtopicViewerBackendApiService} from 'domain/subtopic_viewer/subtopic-viewer-backend-api.service';
import {TopicViewerBackendApiService} from 'domain/topic_viewer/topic-viewer-backend-api.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {ReadOnlyTopic} from 'domain/topic_viewer/read-only-topic.model';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {AppConstants} from 'app.constants';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {Subtopic} from 'domain/topic/subtopic.model';

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

class MockPlatformFeatureService {
  status = {
    ShowRestructuredStudyGuides: {
      isEnabled: false,
    },
  };
}

class MockWindowRef {
  nativeWindow = {
    open: jasmine.createSpy('open'),
    location: {
      href: '',
    },
  };
}

class MockSiteAnalyticsService {
  registerPracticeSessionStartEvent = jasmine.createSpy(
    'registerPracticeSessionStartEvent'
  );
}

describe('Subtopic viewer page', function () {
  let component: SubtopicViewerPageComponent;
  let fixture: ComponentFixture<SubtopicViewerPageComponent>;
  let pageTitleService: PageTitleService;
  let pageContextService: PageContextService;
  let alertsService: AlertsService;
  let windowDimensionsService: WindowDimensionsService;
  let subtopicViewerBackendApiService: SubtopicViewerBackendApiService;
  let topicViewerBackendApiService: TopicViewerBackendApiService;
  let urlService: UrlService;
  let loaderService: LoaderService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let translateService: TranslateService;
  let platformFeatureService: PlatformFeatureService;
  let windowRef: WindowRef;
  let urlInterpolationService: UrlInterpolationService;
  let siteAnalyticsService: SiteAnalyticsService;

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
    '',
    null
  );

  let subtopicTitle = 'Subtopic Title';
  let subtopicUrlFragment = 'subtopic-title';
  let subtopicDataObject: ReadOnlySubtopicPageData =
    ReadOnlySubtopicPageData.createFromBackendDict({
      topic_id: topicId,
      topic_name: topicName,
      subtopic_title: subtopicTitle,
      current_subtopic_id: 1,
      page_contents: {
        subtitled_html: {
          content_id: '',
          html: 'This is a html',
        },
        recorded_voiceovers: {
          voiceovers_mapping: {},
        },
      },
      sections: [
        {
          heading: {
            content_id: 'sections_heading_0',
            unicode_str: 'Test Heading',
          },
          content: {
            content_id: 'sections_content_1',
            html: 'Test content',
          },
        },
      ],
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
      current_subtopic_id: 1,
      page_contents: {
        subtitled_html: {
          content_id: '',
          html: 'This is a html',
        },
        recorded_voiceovers: {
          voiceovers_mapping: {},
        },
      },
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
        PageContextService,
        LoaderService,
        PageTitleService,
        SubtopicViewerBackendApiService,
        TopicViewerBackendApiService,
        UrlService,
        WindowDimensionsService,
        I18nLanguageCodeService,
        UrlInterpolationService,
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
        {
          provide: PlatformFeatureService,
          useClass: MockPlatformFeatureService,
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
        {
          provide: SiteAnalyticsService,
          useClass: MockSiteAnalyticsService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubtopicViewerPageComponent);
    component = fixture.componentInstance;
    pageTitleService = TestBed.inject(PageTitleService);
    pageContextService = TestBed.inject(PageContextService);
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
    platformFeatureService = TestBed.inject(PlatformFeatureService);
    windowRef = TestBed.inject(WindowRef);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true
    );
    spyOn(loaderService, 'hideLoadingScreen');
    spyOn(pageTitleService, 'updateMetaTag');
  });

  it(
    'should successfully get topic/subtopic data and set context with ' +
      'next subtopic card',
    fakeAsync(() => {
      spyOn(component, 'subscribeToOnLangChange');
      spyOn(pageContextService, 'setCustomEntityContext');
      spyOn(pageContextService, 'removeCustomEntityContext');
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
        topicDataObject.getTopicName()
      );
      expect(component.nextSubtopic).toEqual(
        subtopicDataObject.getNextSubtopic()
      );
      expect(component.prevSubtopic).toBeUndefined();
      expect(component.subtopicSummaryIsShown).toBe(true);

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
      expect(pageContextService.setCustomEntityContext).toHaveBeenCalledWith(
        AppConstants.ENTITY_TYPE.TOPIC,
        subtopicDataObject.getParentTopicId()
      );
      expect(component.subscribeToOnLangChange).toHaveBeenCalled();
      expect(pageTitleService.updateMetaTag).toHaveBeenCalledWith(
        `Review the skill of ${subtopicTitle.toLowerCase()}.`
      );
      expect(loaderService.hideLoadingScreen).toHaveBeenCalled();

      component.ngOnDestroy();
      expect(pageContextService.removeCustomEntityContext).toHaveBeenCalled();
    })
  );

  it('should successfully get topic/subtopic data with restructured study guides enabled', fakeAsync(() => {
    platformFeatureService.status.ShowRestructuredStudyGuides.isEnabled = true;
    spyOn(component, 'subscribeToOnLangChange');
    spyOn(pageContextService, 'setCustomEntityContext');
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
    spyOn(urlService, 'getUrlParams').and.returnValue({});

    spyOn(
      subtopicViewerBackendApiService,
      'fetchSubtopicDataAsync'
    ).and.returnValue(Promise.resolve(subtopicDataObject));
    spyOn(topicViewerBackendApiService, 'fetchTopicDataAsync').and.returnValue(
      Promise.resolve(topicDataObject)
    );

    component.ngOnInit();
    tick();

    expect(component.sections).toEqual(subtopicDataObject.getSections());
    expect(component.pageContents).toBeNull();
    expect(component.isSectionExpanded(0)).toBe(true);
    expect(component.highlightedSectionIndex).toBeNull();
  }));

  describe('when the study guide has multiple sections', () => {
    const sectionsBackendDicts = [1, 2, 3].map(sectionNumber => ({
      heading: {
        content_id: `section_heading_${sectionNumber}`,
        unicode_str: `Heading ${sectionNumber}`,
      },
      content: {
        content_id: `section_content_${sectionNumber}`,
        html: `<p>Content ${sectionNumber}</p>`,
      },
    }));
    const subtopicDataObjectWithMultipleSections =
      ReadOnlySubtopicPageData.createFromBackendDict({
        topic_id: topicId,
        topic_name: topicName,
        subtopic_title: subtopicTitle,
        current_subtopic_id: 1,
        page_contents: {
          subtitled_html: {
            content_id: '',
            html: 'This is a html',
          },
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
        },
        sections: sectionsBackendDicts,
        next_subtopic_dict: null,
        prev_subtopic_dict: null,
      });

    const getSectionHeaderButtons = (): HTMLButtonElement[] =>
      Array.from(
        fixture.nativeElement.querySelectorAll(
          '.e2e-test-study-guide-section-header'
        )
      );

    // Returns the titles of the sections whose content is rendered.
    const getDisplayedSectionContents = (): string[] =>
      Array.from(
        fixture.nativeElement.querySelectorAll(
          '.e2e-test-study-guide-section'
        ) as NodeListOf<HTMLElement>
      )
        .filter(
          section =>
            section.querySelector('.e2e-test-study-guide-section-content') !==
            null
        )
        .map(
          section => section.querySelector('.card-title')?.textContent ?? ''
        );

    const loadStudyGuideWithUrlParams = (params: {
      [param: string]: string;
    }): void => {
      platformFeatureService.status.ShowRestructuredStudyGuides.isEnabled =
        true;
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
      spyOn(urlService, 'getUrlParams').and.returnValue(params);
      spyOn(loaderService, 'showLoadingScreen');
      spyOn(
        subtopicViewerBackendApiService,
        'fetchSubtopicDataAsync'
      ).and.returnValue(
        Promise.resolve(subtopicDataObjectWithMultipleSections)
      );
      spyOn(
        topicViewerBackendApiService,
        'fetchTopicDataAsync'
      ).and.returnValue(Promise.resolve(topicDataObject));

      // The first change detection calls ngOnInit(), which loads the data.
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    };

    it('should show only the first section expanded by default', fakeAsync(() => {
      loadStudyGuideWithUrlParams({});

      expect(component.isSectionExpanded(0)).toBe(true);
      expect(component.isSectionExpanded(1)).toBe(false);
      expect(component.isSectionExpanded(2)).toBe(false);
      expect(component.highlightedSectionIndex).toBeNull();

      // All the section titles are shown, but only the content of the first
      // section is rendered.
      const headerButtons = getSectionHeaderButtons();
      expect(
        headerButtons.map(
          button => button.querySelector('.card-title')?.textContent
        )
      ).toEqual(['Heading 1', 'Heading 2', 'Heading 3']);
      expect(
        headerButtons.map(button => button.getAttribute('aria-expanded'))
      ).toEqual(['true', 'false', 'false']);
      expect(getDisplayedSectionContents()).toEqual(['Heading 1']);
      expect(
        fixture.nativeElement.querySelector(
          '.e2e-test-highlighted-study-guide-section'
        )
      ).toBeNull();
    }));

    it(
      'should expand a section when its title is clicked without changing ' +
        'the state of the other sections',
      fakeAsync(() => {
        loadStudyGuideWithUrlParams({});

        getSectionHeaderButtons()[2].click();
        fixture.detectChanges();

        expect(
          getSectionHeaderButtons().map(button =>
            button.getAttribute('aria-expanded')
          )
        ).toEqual(['true', 'false', 'true']);
        expect(getDisplayedSectionContents()).toEqual([
          'Heading 1',
          'Heading 3',
        ]);

        getSectionHeaderButtons()[1].click();
        fixture.detectChanges();

        expect(getDisplayedSectionContents()).toEqual([
          'Heading 1',
          'Heading 2',
          'Heading 3',
        ]);
      })
    );

    it(
      'should collapse an expanded section when its title is clicked ' +
        'without changing the state of the other sections',
      fakeAsync(() => {
        loadStudyGuideWithUrlParams({});
        getSectionHeaderButtons()[1].click();
        fixture.detectChanges();

        getSectionHeaderButtons()[0].click();
        fixture.detectChanges();

        expect(
          getSectionHeaderButtons().map(button =>
            button.getAttribute('aria-expanded')
          )
        ).toEqual(['false', 'true', 'false']);
        expect(getDisplayedSectionContents()).toEqual(['Heading 2']);
      })
    );

    it(
      'should expand and highlight only the section given in the URL ' +
        'when the page is opened through a link to that section',
      fakeAsync(() => {
        loadStudyGuideWithUrlParams({section: '2'});

        expect(component.highlightedSectionIndex).toBe(1);
        expect(component.isSectionHighlighted(1)).toBe(true);
        expect(component.isSectionHighlighted(0)).toBe(false);
        expect(
          getSectionHeaderButtons().map(button =>
            button.getAttribute('aria-expanded')
          )
        ).toEqual(['false', 'true', 'false']);
        expect(getDisplayedSectionContents()).toEqual(['Heading 2']);

        const highlightedSections = fixture.nativeElement.querySelectorAll(
          '.e2e-test-highlighted-study-guide-section'
        );
        expect(highlightedSections.length).toBe(1);
        expect(highlightedSections[0].textContent).toContain('Heading 2');
      })
    );

    it('should support a link to the last section', fakeAsync(() => {
      loadStudyGuideWithUrlParams({section: '3'});

      expect(component.highlightedSectionIndex).toBe(2);
      expect(getDisplayedSectionContents()).toEqual(['Heading 3']);
    }));

    for (const invalidSection of ['0', '4', '-1', '1.5', 'abc', '']) {
      it(
        'should fall back to the default state when the section in the ' +
          `URL is invalid: '${invalidSection}'`,
        fakeAsync(() => {
          loadStudyGuideWithUrlParams({section: invalidSection});

          expect(component.highlightedSectionIndex).toBeNull();
          expect(getDisplayedSectionContents()).toEqual(['Heading 1']);
        })
      );
    }
  });

  it('should not expand any section when the study guide has no sections', () => {
    component.sections = [];
    component.expandedSectionIndices = new Set([0]);
    component.highlightedSectionIndex = 0;

    component.initializeSectionExpansionState();

    expect(component.expandedSectionIndices.size).toBe(0);
    expect(component.highlightedSectionIndex).toBeNull();
  });

  it('should not expand any section when the sections are not loaded', () => {
    component.sections = null;

    component.initializeSectionExpansionState();

    expect(component.expandedSectionIndices.size).toBe(0);
    expect(component.highlightedSectionIndex).toBeNull();
  });

  it(
    'should obtain translated title and set it whenever the ' +
      'selected language changes',
    () => {
      component.subscribeToOnLangChange();
      spyOn(component, 'setPageTitle');
      translateService.onLangChange.next();

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
    spyOn(component, 'subscribeToOnLangChange');
    spyOn(pageContextService, 'setCustomEntityContext');

    expect(component.subtopicSummaryIsShown).toBe(false);
    spyOn(
      subtopicViewerBackendApiService,
      'fetchSubtopicDataAsync'
    ).and.returnValue(Promise.resolve(subtopicDataObjectWithPrevSubtopic));
    spyOn(topicViewerBackendApiService, 'fetchTopicDataAsync').and.returnValue(
      Promise.resolve(topicDataObject)
    );

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
    expect(component.subtopicSummaryIsShown).toBe(true);

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

  it('should check if restructured study guides feature is enabled', () => {
    expect(component.isShowRestructuredStudyGuidesFeatureEnabled()).toBe(false);

    platformFeatureService.status.ShowRestructuredStudyGuides.isEnabled = true;
    expect(component.isShowRestructuredStudyGuidesFeatureEnabled()).toBe(true);
  });

  it('should open study guide when openStudyGuide is called', () => {
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'algebra';
    const mockSubtopic = jasmine.createSpyObj<Subtopic>('Subtopic', [
      'getUrlFragment',
    ]);
    mockSubtopic.getUrlFragment.and.returnValue('linear-equations');
    component.nextSubtopic = mockSubtopic;

    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(
      '/test-url'
    );

    component.openStudyGuide();

    expect(windowRef.nativeWindow.open).toHaveBeenCalledWith(
      '/test-url',
      '_self'
    );
  });

  it('should open study guide when openStudyGuide is called with Ctrl+click event', () => {
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'algebra';
    const mockSubtopic = jasmine.createSpyObj<Subtopic>('Subtopic', [
      'getUrlFragment',
    ]);
    mockSubtopic.getUrlFragment.and.returnValue('linear-equations');

    component.nextSubtopic = mockSubtopic;
    const mockEvent = new MouseEvent('click', {ctrlKey: true});

    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(
      '/test-url'
    );

    component.openStudyGuide(mockEvent);

    expect(windowRef.nativeWindow.open).toHaveBeenCalledWith(
      '/test-url',
      '_blank'
    );
  });

  it('should not open study guide when required fragments are missing', () => {
    component.classroomUrlFragment = '';
    component.topicUrlFragment = 'algebra';
    const mockSubtopic = jasmine.createSpyObj<Subtopic>('Subtopic', [
      'getUrlFragment',
    ]);
    mockSubtopic.getUrlFragment.and.returnValue('linear-equations');
    component.nextSubtopic = mockSubtopic;

    component.openStudyGuide();

    expect(windowRef.nativeWindow.open).not.toHaveBeenCalled();
  });

  it('should open study guide menu when openStudyGuideMenu is called', () => {
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'algebra';

    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(
      '/study-guide-menu'
    );

    component.openStudyGuideMenu();

    expect(windowRef.nativeWindow.open).toHaveBeenCalledWith(
      '/study-guide-menu',
      '_self'
    );
  });

  it('should open study guide menu when openStudyGuideMenu is called with Ctrl+click event', () => {
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'algebra';
    const mockEvent = new MouseEvent('click', {ctrlKey: true});

    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(
      '/study-guide-menu'
    );

    component.openStudyGuideMenu(mockEvent);

    expect(windowRef.nativeWindow.open).toHaveBeenCalledWith(
      '/study-guide-menu',
      '_blank'
    );
  });

  it('should not open study guide menu when required fragments are missing', () => {
    component.classroomUrlFragment = '';
    component.topicUrlFragment = 'algebra';

    component.openStudyGuideMenu();

    expect(windowRef.nativeWindow.open).not.toHaveBeenCalled();
  });

  it('should open practice menu when openPracticeMenu is called', () => {
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'algebra';
    component.currentSubtopicId = 1;
    component.parentTopicTitle = 'Test Topic';

    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(
      '/practice-menu'
    );
    spyOn(loaderService, 'showLoadingScreen');

    component.openPracticeMenu();

    expect(
      siteAnalyticsService.registerPracticeSessionStartEvent
    ).toHaveBeenCalledWith('math', 'Test Topic', '1');
    expect(windowRef.nativeWindow.location.href).toBe('/practice-menu');
    expect(loaderService.showLoadingScreen).toHaveBeenCalledWith('Loading');
  });

  it('should open practice menu when openPracticeMenu is called with Ctrl+click', () => {
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'algebra';
    component.currentSubtopicId = 1;
    component.parentTopicTitle = 'Test Topic';
    const mockEvent = new MouseEvent('click', {ctrlKey: true});

    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(
      '/practice-menu'
    );
    spyOn(loaderService, 'showLoadingScreen');

    component.openPracticeMenu(mockEvent);

    expect(
      siteAnalyticsService.registerPracticeSessionStartEvent
    ).toHaveBeenCalledWith('math', 'Test Topic', '1');
    expect(windowRef.nativeWindow.open).toHaveBeenCalledWith(
      '/practice-menu',
      '_blank'
    );
  });

  it('should navigate back to topic when backToTopic is called', () => {
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'algebra';

    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(
      '/topic-viewer'
    );

    component.backToTopic();

    expect(windowRef.nativeWindow.open).toHaveBeenCalledWith(
      '/topic-viewer',
      '_self'
    );
  });

  it('should navigate back to topic when backToTopic is called with Ctrl+click event', () => {
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'algebra';
    const mockEvent = new MouseEvent('click', {ctrlKey: true});

    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(
      '/topic-viewer'
    );

    component.backToTopic(mockEvent);

    expect(windowRef.nativeWindow.open).toHaveBeenCalledWith(
      '/topic-viewer',
      '_blank'
    );
  });

  it('should not navigate back to topic when required fragments are missing', () => {
    component.classroomUrlFragment = '';
    component.topicUrlFragment = 'algebra';

    component.backToTopic();

    expect(windowRef.nativeWindow.open).not.toHaveBeenCalled();
  });

  it('should get static image URL', () => {
    const imagePath = '/path/to/image.png';
    const expectedUrl = 'https://example.com/static/image.png';

    spyOn(urlInterpolationService, 'getStaticImageUrl').and.returnValue(
      expectedUrl
    );

    const result = component.getStaticImageUrl(imagePath);

    expect(result).toBe(expectedUrl);
    expect(urlInterpolationService.getStaticImageUrl).toHaveBeenCalledWith(
      imagePath
    );
  });

  it('should modify next subtopic title based on length', () => {
    const longTitle =
      'This is a very long subtopic title that exceeds twenty characters';

    // Test desktop view (default behavior).
    spyOn(component, 'checkMobileView').and.returnValue(false);
    const mockSubtopic = jasmine.createSpyObj<Subtopic>('Subtopic', [
      'getTitle',
      'getUrlFragment',
    ]);
    mockSubtopic.getTitle.and.returnValue(longTitle);
    mockSubtopic.getUrlFragment.and.returnValue('test-fragment');
    component.nextSubtopic = mockSubtopic;

    const desktopResult = component.checkNextSubtopicTitleLengthAndModify();
    // 20 chars + '...'.
    expect(desktopResult).toBe('This is a very long ...');
    // 20 + 3 for '...'.
    expect(desktopResult.length).toBe(23);

    // Test mobile view.
    (component.checkMobileView as jasmine.Spy).and.returnValue(true);
    const mobileResult = component.checkNextSubtopicTitleLengthAndModify();
    // 15 chars + '...'.
    expect(mobileResult).toBe('This is a very ...');
    // 15 + 3 for '...'.
    expect(mobileResult.length).toBe(18);

    // Test short title (should not be truncated).
    const shortTitle = 'Short title';
    mockSubtopic.getTitle.and.returnValue(shortTitle);
    component.nextSubtopic = mockSubtopic;

    const shortResult = component.checkNextSubtopicTitleLengthAndModify();
    expect(shortResult).toBe(shortTitle);
    expect(shortResult).toBe('Short title');
  });
});
