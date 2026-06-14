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
 * @fileoverview Unit tests for topic viewer page component.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA, EventEmitter} from '@angular/core';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {TranslateService} from '@ngx-translate/core';

import {TopicViewerPageComponent} from './topic-viewer-page.component';
import {AlertsService} from 'services/alerts.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {PageTitleService} from 'services/page-title.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {PlatformFeatureService} from 'services/platform-feature.service';

class MockPlatformFeatureService {
  status = {
    RedesignedTopicViewerPage: {
      isEnabled: false,
    },
  };
}

class MockWindowRef {
  _window = {
    location: {
      pathname: '/learn/math',
      _hash: '',
      toString() {
        return 'http://localhost/test_path';
      },
    },
    history: {
      pushState(title: string, url: string | null) {},
    },
  };

  get nativeWindow() {
    return this._window;
  }
}

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

describe('Topic viewer page', () => {
  let httpTestingController: HttpTestingController;
  let alertsService: AlertsService;
  let pageTitleService: PageTitleService;
  let urlService: UrlService;
  let windowDimensionsService: WindowDimensionsService;
  let topicViewerPageComponent: TopicViewerPageComponent;
  let windowRef: MockWindowRef;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let translateService: TranslateService;
  let mockPlatformFeatureService = new MockPlatformFeatureService();

  let topicName = 'Topic Name';
  let topicUrlFragment = 'topic-frag';
  let topicDict = {
    topic_id: '1',
    topic_name: 'Topic Name',
    topic_description: 'Topic Description',
    canonical_story_dicts: [
      {
        id: '2',
        title: 'Story Title',
        node_titles: ['Node title 1', 'Node title 2'],
        thumbnail_filename: '',
        thumbnail_bg_color: '',
        description: 'Story Description',
        story_is_published: true,
        all_node_dicts: [],
      },
    ],
    additional_story_dicts: [],
    uncategorized_skill_ids: [],
    subtopics: [],
    degrees_of_mastery: {},
    skill_descriptions: {},
    practice_tab_is_displayed: true,
    meta_tag_content: 'Topic Meta Tag',
    page_title_fragment_for_web: 'Topic page title',
  };
  let topicDictWithPractice = {
    topic_id: '1',
    topic_name: 'Topic Name',
    topic_description: 'Topic Description',
    canonical_story_dicts: [
      {
        id: '2',
        title: 'Story Title',
        node_titles: ['Node title 1', 'Node title 2'],
        thumbnail_filename: '',
        thumbnail_bg_color: '',
        description: '',
        story_is_published: true,
        all_node_dicts: [],
      },
    ],
    additional_story_dicts: [],
    uncategorized_skill_ids: [],
    subtopics: [
      {
        id: 1,
        title: 'Subtopic Title',
        skill_ids: ['skill_1'],
        thumbnail_filename: 'thumb.png',
        thumbnail_bg_color: '#ffffff',
        url_fragment: 'subtopic-frag',
      },
    ],
    degrees_of_mastery: {},
    skill_descriptions: {
      skill_1: 'Skill description',
    },
    practice_tab_is_displayed: true,
    meta_tag_content: 'Topic Meta Tag',
    page_title_fragment_for_web: 'Topic page title',
  };

  beforeEach(() => {
    mockPlatformFeatureService.status.RedesignedTopicViewerPage.isEnabled =
      false;
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      declarations: [TopicViewerPageComponent, MockTranslatePipe],
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: WindowRef,
          useValue: windowRef,
        },
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService,
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    httpTestingController = TestBed.inject(HttpTestingController);
    alertsService = TestBed.inject(AlertsService);
    pageTitleService = TestBed.inject(PageTitleService);
    urlService = TestBed.inject(UrlService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    translateService = TestBed.inject(TranslateService);
    let fixture = TestBed.createComponent(TopicViewerPageComponent);
    topicViewerPageComponent = fixture.componentInstance;

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true
    );
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully get topic data', fakeAsync(() => {
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      topicUrlFragment
    );
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'math'
    );
    spyOn(topicViewerPageComponent, 'subscribeToOnLangChange');
    spyOn(windowRef.nativeWindow.history, 'pushState');

    topicViewerPageComponent.ngOnInit();
    expect(topicViewerPageComponent.canonicalStorySummaries).toEqual([]);
    expect(topicViewerPageComponent.activeView).toBe(
      topicViewerPageComponent.VIEW_NAMES.STORY
    );
    expect(windowRef.nativeWindow.history.pushState).toHaveBeenCalledWith(
      {},
      '',
      'http://localhost/test_path/story'
    );
    var req = httpTestingController.expectOne(
      `/topic_data_handler/math/${topicUrlFragment}`
    );
    req.flush(topicDict);
    flushMicrotasks();

    expect(topicViewerPageComponent.topicId).toBe('1');
    expect(topicViewerPageComponent.topicName).toBe('Topic Name');
    expect(topicViewerPageComponent.subscribeToOnLangChange);
    expect(topicViewerPageComponent.topicDescription).toBe('Topic Description');
    expect(topicViewerPageComponent.canonicalStorySummaries.length).toBe(1);
    expect(topicViewerPageComponent.chapterCount).toBe(2);
    expect(topicViewerPageComponent.degreesOfMastery).toEqual({});
    expect(topicViewerPageComponent.subtopics).toEqual([]);
    expect(topicViewerPageComponent.skillDescriptions).toEqual({});
    expect(topicViewerPageComponent.topicIsLoading).toBe(false);
    expect(topicViewerPageComponent.practiceTabIsDisplayed).toBe(true);
    expect(topicViewerPageComponent.canonicalStorySectionData).toEqual([
      {
        storyId: '2',
        storyTitle: 'Story Title',
        storyDescription: 'Story Description',
        lessonCount: 2,
        practiceCount: 0,
      },
    ]);
  }));

  it(
    'should build canonical story section data with practice count when ' +
      'subtopics contain skills',
    fakeAsync(() => {
      spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
        topicUrlFragment
      );
      spyOn(
        urlService,
        'getClassroomUrlFragmentFromLearnerUrl'
      ).and.returnValue('math');
      spyOn(topicViewerPageComponent, 'subscribeToOnLangChange');
      spyOn(windowRef.nativeWindow.history, 'pushState');

      topicViewerPageComponent.ngOnInit();
      const req = httpTestingController.expectOne(
        `/topic_data_handler/math/${topicUrlFragment}`
      );
      req.flush(topicDictWithPractice);
      flushMicrotasks();

      expect(topicViewerPageComponent.canonicalStorySectionData).toEqual([
        {
          storyId: '2',
          storyTitle: 'Story Title',
          storyDescription: '',
          lessonCount: 2,
          practiceCount: 1,
        },
      ]);
    })
  );

  it(
    'should obtain translated title and set it whenever the ' +
      'selected language changes',
    () => {
      topicViewerPageComponent.subscribeToOnLangChange();
      spyOn(topicViewerPageComponent, 'setPageTitle');
      translateService.onLangChange.emit();

      expect(topicViewerPageComponent.setPageTitle).toHaveBeenCalled();
    }
  );

  it('should set page title', () => {
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(pageTitleService, 'setDocumentTitle');
    topicViewerPageComponent.topicName = topicName;
    topicViewerPageComponent.pageTitleFragment =
      topicDict.page_title_fragment_for_web;
    topicViewerPageComponent.setPageTitle();

    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_TOPIC_VIEWER_PAGE_TITLE',
      {
        topicName: 'Topic Name',
        pageTitleFragment: 'Topic page title',
      }
    );
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'I18N_TOPIC_VIEWER_PAGE_TITLE'
    );
  });

  it('should unsubscribe upon component destruction', () => {
    topicViewerPageComponent.subscribeToOnLangChange();
    expect(topicViewerPageComponent.directiveSubscriptions.closed).toBe(false);
    topicViewerPageComponent.ngOnDestroy();

    expect(topicViewerPageComponent.directiveSubscriptions.closed).toBe(true);
  });

  it('should set story tab correctly', fakeAsync(() => {
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      topicUrlFragment
    );
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'math'
    );
    spyOn(urlService, 'getPathname').and.returnValue(
      `/learn/math/${topicUrlFragment}/story`
    );
    topicViewerPageComponent.ngOnInit();
    var req = httpTestingController.expectOne(
      `/topic_data_handler/math/${topicUrlFragment}`
    );
    req.flush(topicDict);
    flushMicrotasks();
    expect(topicViewerPageComponent.activeView).toBe(
      topicViewerPageComponent.VIEW_NAMES.STORY
    );
  }));

  it('should set study tab correctly', fakeAsync(() => {
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      topicUrlFragment
    );
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'math'
    );
    spyOn(urlService, 'getPathname').and.returnValue(
      `/learn/math/${topicUrlFragment}/studyguide`
    );
    topicViewerPageComponent.ngOnInit();
    var req = httpTestingController.expectOne(
      `/topic_data_handler/math/${topicUrlFragment}`
    );
    req.flush(topicDict);
    expect(topicViewerPageComponent.activeView).toBe(
      topicViewerPageComponent.VIEW_NAMES.STUDYGUIDE
    );
  }));

  it('should set practice tab correctly', fakeAsync(() => {
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      topicUrlFragment
    );
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'math'
    );
    spyOn(urlService, 'getPathname').and.returnValue(
      `/learn/math/${topicUrlFragment}/practice`
    );
    topicViewerPageComponent.ngOnInit();
    var req = httpTestingController.expectOne(
      `/topic_data_handler/math/${topicUrlFragment}`
    );
    req.flush(topicDict);
    expect(topicViewerPageComponent.activeView).toBe(
      topicViewerPageComponent.VIEW_NAMES.PRACTICE
    );
  }));

  it('should set story tab when practice url is opened in redesigned mode', fakeAsync(() => {
    mockPlatformFeatureService.status.RedesignedTopicViewerPage.isEnabled =
      true;
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      topicUrlFragment
    );
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'math'
    );
    spyOn(urlService, 'getPathname').and.returnValue(
      `/learn/math/${topicUrlFragment}/practice`
    );

    topicViewerPageComponent.ngOnInit();
    const req = httpTestingController.expectOne(
      `/topic_data_handler/math/${topicUrlFragment}`
    );
    req.flush(topicDict);
    flushMicrotasks();

    expect(topicViewerPageComponent.activeView).toBe(
      topicViewerPageComponent.VIEW_NAMES.STORY
    );
  }));

  it('should use reject handler when fetching subtopic data fails', fakeAsync(() => {
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      topicUrlFragment
    );
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'math'
    );
    spyOn(alertsService, 'addWarning').and.callThrough();

    topicViewerPageComponent.ngOnInit();
    let req = httpTestingController.expectOne(
      `/topic_data_handler/math/${topicUrlFragment}`
    );
    let errorObject = {status: 404, statusText: 'Not Found'};
    req.flush({error: errorObject}, errorObject);
    flushMicrotasks();

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Failed to get dashboard data'
    );
  }));

  it('should not show warning for non-fatal fetch errors', fakeAsync(() => {
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      topicUrlFragment
    );
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'math'
    );
    spyOn(alertsService, 'addWarning').and.callThrough();

    topicViewerPageComponent.ngOnInit();
    let req = httpTestingController.expectOne(
      `/topic_data_handler/math/${topicUrlFragment}`
    );
    let errorObject = {status: 403, statusText: 'Forbidden'};
    req.flush({error: errorObject}, errorObject);
    flushMicrotasks();

    expect(alertsService.addWarning).not.toHaveBeenCalled();
  }));

  it('should track story data by story id', () => {
    expect(
      topicViewerPageComponent.trackStoryDataById(0, {
        storyId: 'story_1',
        storyTitle: 'Story 1',
        storyDescription: 'Description',
        lessonCount: 3,
        practiceCount: 2,
      })
    ).toBe('story_1');
  });

  it('should get static image url', () => {
    var imagePath = '/path/to/image.png';
    var staticImageUrl = topicViewerPageComponent.getStaticImageUrl(imagePath);

    expect(staticImageUrl).toBe('/assets/images/path/to/image.png');
  });

  it('should check if the view is mobile or not', () => {
    var widthSpy = spyOn(windowDimensionsService, 'getWidth');
    widthSpy.and.returnValue(400);
    expect(topicViewerPageComponent.checkMobileView()).toBe(true);

    widthSpy.and.returnValue(700);
    expect(topicViewerPageComponent.checkMobileView()).toBe(false);
  });

  it('should check if the view is tablet or not', () => {
    var widthSpy = spyOn(windowDimensionsService, 'getWidth');
    widthSpy.and.returnValue(700);
    expect(topicViewerPageComponent.checkTabletView()).toBe(true);

    widthSpy.and.returnValue(800);
    expect(topicViewerPageComponent.checkTabletView()).toBe(false);
  });

  it(
    'should set url accordingly when user changes active tab to' + ' story tab',
    () => {
      spyOn(windowRef.nativeWindow.history, 'pushState');
      topicViewerPageComponent.activeView =
        topicViewerPageComponent.VIEW_NAMES.STUDYGUIDE;
      spyOn(windowRef.nativeWindow.location, 'toString').and.returnValue(
        'http://localhost/test_path/studyguide'
      );

      topicViewerPageComponent.setActiveView(
        topicViewerPageComponent.VIEW_NAMES.STORY
      );

      expect(windowRef.nativeWindow.history.pushState).toHaveBeenCalledWith(
        {},
        '',
        'http://localhost/test_path/story'
      );
      expect(topicViewerPageComponent.activeView).toBe(
        topicViewerPageComponent.VIEW_NAMES.STORY
      );
    }
  );

  it(
    'should set url hash accordingly when user changes active tab to' +
      ' practice tab',
    () => {
      spyOn(windowRef.nativeWindow.history, 'pushState');
      topicViewerPageComponent.activeView =
        topicViewerPageComponent.VIEW_NAMES.STUDYGUIDE;
      spyOn(windowRef.nativeWindow.location, 'toString').and.returnValue(
        'http://localhost/test_path/studyguide'
      );

      topicViewerPageComponent.setActiveView(
        topicViewerPageComponent.VIEW_NAMES.PRACTICE
      );

      expect(windowRef.nativeWindow.history.pushState).toHaveBeenCalledWith(
        {},
        '',
        'http://localhost/test_path/practice'
      );
      expect(topicViewerPageComponent.activeView).toBe(
        topicViewerPageComponent.VIEW_NAMES.PRACTICE
      );
    }
  );

  it('should map practice tab to story tab in redesigned mode', () => {
    mockPlatformFeatureService.status.RedesignedTopicViewerPage.isEnabled =
      true;
    spyOn(windowRef.nativeWindow.history, 'pushState');
    topicViewerPageComponent.activeView =
      topicViewerPageComponent.VIEW_NAMES.STUDYGUIDE;
    spyOn(windowRef.nativeWindow.location, 'toString').and.returnValue(
      'http://localhost/test_path/studyguide'
    );

    topicViewerPageComponent.setActiveView(
      topicViewerPageComponent.VIEW_NAMES.PRACTICE
    );

    expect(windowRef.nativeWindow.history.pushState).toHaveBeenCalledWith(
      {},
      '',
      'http://localhost/test_path/story'
    );
    expect(topicViewerPageComponent.activeView).toBe(
      topicViewerPageComponent.VIEW_NAMES.STORY
    );
  });

  it(
    'should set url hash accordingly when user changes active tab to' +
      ' studyguide tab',
    () => {
      spyOn(windowRef.nativeWindow.history, 'pushState');
      topicViewerPageComponent.activeView =
        topicViewerPageComponent.VIEW_NAMES.STORY;
      spyOn(windowRef.nativeWindow.location, 'toString').and.returnValue(
        'http://localhost/test_path/story'
      );

      topicViewerPageComponent.setActiveView(
        topicViewerPageComponent.VIEW_NAMES.STUDYGUIDE
      );

      expect(windowRef.nativeWindow.history.pushState).toHaveBeenCalledWith(
        {},
        '',
        'http://localhost/test_path/studyguide'
      );
      expect(topicViewerPageComponent.activeView).toBe(
        topicViewerPageComponent.VIEW_NAMES.STUDYGUIDE
      );
    }
  );

  it('should return true when practice tab is enabled', () => {
    topicViewerPageComponent.practiceTabIsDisplayed = true;
    expect(topicViewerPageComponent.isPracticeTabEnabled()).toBe(true);
  });

  it('should return false when practice tab is disabled', () => {
    topicViewerPageComponent.practiceTabIsDisplayed = false;
    expect(topicViewerPageComponent.isPracticeTabEnabled()).toBe(false);
  });

  it('should return false when redesigned topic viewer page feature is off', () => {
    mockPlatformFeatureService.status.RedesignedTopicViewerPage.isEnabled =
      false;

    expect(
      topicViewerPageComponent.isRedesignedTopicViewerPageFeatureEnabled()
    ).toBe(false);
  });

  it('should return true when redesigned topic viewer page feature is on', () => {
    mockPlatformFeatureService.status.RedesignedTopicViewerPage.isEnabled =
      true;

    expect(
      topicViewerPageComponent.isRedesignedTopicViewerPageFeatureEnabled()
    ).toBe(true);
  });
});
