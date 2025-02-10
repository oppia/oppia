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
 * @fileoverview Unit tests for the component of the library page.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA, EventEmitter} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';

import {AppConstants} from 'app.constants';
import {CollectionSummaryBackendDict} from 'domain/collection/collection-summary.model';
import {CreatorExplorationSummaryBackendDict} from 'domain/summary/creator-exploration-summary.model';
import {UserInfo} from 'domain/user/user-info.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {LoggerService} from 'services/contextual/logger.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {KeyboardShortcutService} from 'services/keyboard-shortcut.service';
import {LoaderService} from 'services/loader.service';
import {PageTitleService} from 'services/page-title.service';
import {SearchService} from 'services/search.service';
import {UserService} from 'services/user.service';
import {MockTranslateModule} from 'tests/unit-test-utils';
import {LibraryPageComponent} from './library-page.component';
import {
  ActivityDict,
  LibraryIndexData,
  LibraryPageBackendApiService,
} from './services/library-page-backend-api.service';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: '/community-library/top-rated',
      href: '',
    },
    gtag: jasmine.createSpy('gtag'),
  };
}

class MockWindowDimensionsService {
  getResizeEvent() {
    return {
      subscribe: (callb: () => void) => {
        callb();
        return {
          unsubscribe() {},
        };
      },
    };
  }

  getWidth(): number {
    return 700;
  }
}

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

describe('Library Page Component', () => {
  let fixture: ComponentFixture<LibraryPageComponent>;
  let componentInstance: LibraryPageComponent;
  let loaderService: LoaderService;
  let urlInterpolationService: UrlInterpolationService;
  let pageTitleService: PageTitleService;
  let libraryPageBackendApiService: LibraryPageBackendApiService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let windowDimensionsService: WindowDimensionsService;
  let windowRef: MockWindowRef;
  let userService: UserService;
  let keyboardShortcutService: KeyboardShortcutService;
  let loggerService: LoggerService;
  let searchService: SearchService;
  let translateService: TranslateService;
  let classroomBackendApiService: ClassroomBackendApiService;
  let siteAnalyticsService: SiteAnalyticsService;

  const dummyClassroomSummary = {
    classroom_id: 'mathclassroom',
    name: 'math',
    url_fragment: 'math',
    teaser_text: 'Learn math',
    is_published: true,
    thumbnail_filename: 'thumbnail.svg',
    thumbnail_bg_color: 'transparent',
  };

  let explorationList: CreatorExplorationSummaryBackendDict[] = [
    {
      category: '',
      community_owned: true,
      activity_type: AppConstants.ACTIVITY_TYPE_EXPLORATION,
      last_updated_msec: 1,
      ratings: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
      id: 'id1',
      created_on_msec: 12,
      human_readable_contributors_summary: {},
      language_code: '',
      num_views: 2,
      objective: '',
      status: '',
      tags: [],
      thumbnail_bg_color: '',
      thumbnail_icon_url: '',
      title: '',
      num_total_threads: 3,
      num_open_threads: 3,
    },
  ];

  let collectionList: CollectionSummaryBackendDict[] = [
    {
      category: '',
      community_owned: true,
      last_updated_msec: 2,
      id: '',
      created_on: 2,
      language_code: '',
      objective: '',
      status: '',
      thumbnail_bg_color: '',
      thumbnail_icon_url: '',
      title: '',
      node_count: 2,
    },
  ];

  let libraryIndexData: LibraryIndexData = {
    activity_summary_dicts_by_category: [
      {
        activity_summary_dicts: [
          {
            activity_type: AppConstants.ACTIVITY_TYPE_EXPLORATION,
            category: '',
            community_owned: true,
            id: 'id1',
            language_code: '',
            num_views: 5,
            objective: '',
            status: '',
            tags: [],
            thumbnail_bg_color: '',
            thumbnail_icon_url: '',
            title: '',
          },
          {
            activity_type: AppConstants.ACTIVITY_TYPE_COLLECTION,
            category: '',
            community_owned: true,
            id: 'id2',
            language_code: '',
            num_views: 5,
            objective: '',
            status: '',
            tags: [],
            thumbnail_bg_color: '',
            thumbnail_icon_url: '',
            title: '',
          },
          {
            activity_type: '',
            category: '',
            community_owned: true,
            id: 'id1',
            language_code: '',
            num_views: 5,
            objective: '',
            status: '',
            tags: [],
            thumbnail_bg_color: '',
            thumbnail_icon_url: '',
            title: '',
          },
        ],
        categories: [],
        header_i18n_id: 'id',
        has_full_results_page: true,
        full_results_url: '',
        protractor_id: '',
      },
    ],
    preferred_language_codes: [],
  };

  beforeEach(waitForAsync(() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MockTranslateModule],
      declarations: [LibraryPageComponent],
      providers: [
        LoggerService,
        {
          provide: WindowRef,
          useValue: windowRef,
        },
        I18nLanguageCodeService,
        KeyboardShortcutService,
        LibraryPageBackendApiService,
        LoaderService,
        SearchService,
        UrlInterpolationService,
        UserService,
        {
          provide: WindowDimensionsService,
          useClass: MockWindowDimensionsService,
        },
        PageTitleService,
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
        ClassroomBackendApiService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LibraryPageComponent);
    componentInstance = fixture.componentInstance;
    loaderService = TestBed.inject(LoaderService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    pageTitleService = TestBed.inject(PageTitleService);
    translateService = TestBed.inject(TranslateService);
    libraryPageBackendApiService = TestBed.inject(LibraryPageBackendApiService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    userService = TestBed.inject(UserService);
    keyboardShortcutService = TestBed.inject(KeyboardShortcutService);
    loggerService = TestBed.inject(LoggerService);
    searchService = TestBed.inject(SearchService);
    classroomBackendApiService = TestBed.inject(ClassroomBackendApiService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
  });

  afterEach(() => {
    componentInstance.ngOnDestroy();
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize', fakeAsync(() => {
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(urlInterpolationService, 'getStaticImageUrl');
    spyOn(translateService.onLangChange, 'subscribe');
    spyOn(
      libraryPageBackendApiService,
      'fetchLibraryGroupDataAsync'
    ).and.returnValue(
      Promise.resolve({
        activity_list: [],
        header_i18n_id: '',
        preferred_language_codes: [],
      })
    );
    spyOn(i18nLanguageCodeService.onPreferredLanguageCodesLoaded, 'emit');
    spyOn(loaderService, 'hideLoadingScreen');
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(900);
    componentInstance.ngOnInit();
    spyOn(componentInstance, 'initCarousels');
    tick();
    tick();
    expect(loaderService.showLoadingScreen).toHaveBeenCalledWith(
      'I18N_LIBRARY_LOADING'
    );
    expect(translateService.onLangChange.subscribe).toHaveBeenCalled();
    expect(
      libraryPageBackendApiService.fetchLibraryGroupDataAsync
    ).toHaveBeenCalled();
    expect(
      i18nLanguageCodeService.onPreferredLanguageCodesLoaded.emit
    ).toHaveBeenCalled();
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    expect(windowDimensionsService.getWidth).toHaveBeenCalled();
  }));

  it('should initialize for non group pages', fakeAsync(() => {
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(urlInterpolationService, 'getStaticImageUrl');
    spyOn(translateService.onLangChange, 'subscribe');
    windowRef.nativeWindow.location.pathname = '/community-library';
    fixture.detectChanges();
    spyOn(
      libraryPageBackendApiService,
      'fetchLibraryIndexDataAsync'
    ).and.returnValue(Promise.resolve(libraryIndexData));
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(
        new UserInfo(
          ['role'],
          true,
          true,
          true,
          true,
          true,
          'en',
          'user',
          'user@user.com',
          true
        )
      )
    );
    spyOn(
      libraryPageBackendApiService,
      'fetchCreatorDashboardDataAsync'
    ).and.returnValue(
      Promise.resolve({
        explorations_list: explorationList,
        collections_list: collectionList,
      })
    );
    spyOn(loaderService, 'hideLoadingScreen');
    spyOn(i18nLanguageCodeService.onPreferredLanguageCodesLoaded, 'emit');
    spyOn(keyboardShortcutService, 'bindLibraryPageShortcuts');
    spyOn(componentInstance, 'initCarousels');
    spyOn(loggerService, 'error');
    componentInstance.ngOnInit();
    tick();
    tick();
    tick();
    tick();
    tick(4000);
    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(urlInterpolationService.getStaticImageUrl).toHaveBeenCalled();
    expect(translateService.onLangChange.subscribe).toHaveBeenCalled();
    expect(
      libraryPageBackendApiService.fetchLibraryIndexDataAsync
    ).toHaveBeenCalled();
    expect(userService.getUserInfoAsync).toHaveBeenCalled();
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    expect(componentInstance.initCarousels).toHaveBeenCalled();
  }));

  it('should initialize for non group pages and user is not logged in', fakeAsync(() => {
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(urlInterpolationService, 'getStaticImageUrl');
    spyOn(translateService.onLangChange, 'subscribe');
    windowRef.nativeWindow.location.pathname = '/community-library';
    fixture.detectChanges();
    spyOn(
      libraryPageBackendApiService,
      'fetchLibraryIndexDataAsync'
    ).and.returnValue(Promise.resolve(libraryIndexData));
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve({isLoggedIn: () => false} as UserInfo)
    );
    spyOn(loaderService, 'hideLoadingScreen');
    spyOn(i18nLanguageCodeService.onPreferredLanguageCodesLoaded, 'emit');
    spyOn(keyboardShortcutService, 'bindLibraryPageShortcuts');
    spyOn(componentInstance, 'initCarousels');
    spyOn(loggerService, 'error');
    let actualWidth = 200;
    spyOn(window, '$').and.returnValue({
      width: () => {
        return actualWidth;
      },
    } as JQLite);
    componentInstance.ngOnInit();
    tick();
    tick();
    tick();
    tick();
    tick(4000);
    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(urlInterpolationService.getStaticImageUrl).toHaveBeenCalled();
    expect(translateService.onLangChange.subscribe).toHaveBeenCalled();
    expect(userService.getUserInfoAsync).toHaveBeenCalled();
    expect(loggerService.error).toHaveBeenCalledWith(
      'The actual width of tile is different than either of the ' +
        'expected widths. Actual size: ' +
        actualWidth +
        ', Expected sizes: ' +
        AppConstants.LIBRARY_TILE_WIDTH_PX +
        '/' +
        AppConstants.LIBRARY_MOBILE_TILE_WIDTH_PX
    );
  }));

  it('should log when invalid path is used', fakeAsync(() => {
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(urlInterpolationService, 'getStaticImageUrl');
    spyOn(translateService.onLangChange, 'subscribe');
    windowRef.nativeWindow.location.pathname = '/not-valid';
    fixture.detectChanges();
    spyOn(
      libraryPageBackendApiService,
      'fetchLibraryIndexDataAsync'
    ).and.returnValue(Promise.resolve(libraryIndexData));
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve({isLoggedIn: () => false} as UserInfo)
    );
    spyOn(loaderService, 'hideLoadingScreen');
    spyOn(loggerService, 'error');
    spyOn(i18nLanguageCodeService.onPreferredLanguageCodesLoaded, 'emit');
    spyOn(keyboardShortcutService, 'bindLibraryPageShortcuts');
    spyOn(componentInstance, 'initCarousels');
    componentInstance.ngOnInit();
    tick();
    tick();
    tick();
    tick();
    tick(4000);
    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(urlInterpolationService.getStaticImageUrl).toHaveBeenCalled();
    expect(translateService.onLangChange.subscribe).toHaveBeenCalled();
    expect(userService.getUserInfoAsync).toHaveBeenCalled();
    expect(loggerService.error).toHaveBeenCalled();
  }));

  it(
    'should obtain translated page title whenever the selected' +
      'language changes',
    fakeAsync(() => {
      componentInstance.ngOnInit();
      tick();
      spyOn(componentInstance, 'setPageTitle');
      translateService.onLangChange.emit();
      tick();
      tick(4000);

      expect(componentInstance.setPageTitle).toHaveBeenCalled();
    })
  );

  it('should set appropriate new page title when not in browse mode', () => {
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(pageTitleService, 'setDocumentTitle');
    componentInstance.pageMode = 'not_search';
    componentInstance.setPageTitle();

    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_LIBRARY_PAGE_TITLE'
    );
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'I18N_LIBRARY_PAGE_TITLE'
    );
  });

  it('should set appropriate new page title when in browse mode', () => {
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(pageTitleService, 'setDocumentTitle');
    componentInstance.pageMode = 'search';
    componentInstance.setPageTitle();

    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_LIBRARY_PAGE_BROWSE_MODE_TITLE'
    );
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'I18N_LIBRARY_PAGE_BROWSE_MODE_TITLE'
    );
  });

  it('should not initiate carousels if in mobile view', () => {
    componentInstance.libraryWindowIsNarrow = true;
    componentInstance.initCarousels();
    expect(componentInstance.leftmostCardIndices.length).toEqual(0);
  });

  it("should toggle the correct button's text when clicked", () => {
    componentInstance.mobileLibraryGroupsProperties = [
      {
        inCollapsedState: true,
        buttonText: 'See More',
      },
      {
        inCollapsedState: false,
        buttonText: 'Collapse Section',
      },
    ];
    componentInstance.toggleButtonText(0);

    // Correct button text should be toggled.
    expect(componentInstance.mobileLibraryGroupsProperties[0].buttonText).toBe(
      'Collapse Section'
    );
    // Other button's text should remain unchanged.
    expect(componentInstance.mobileLibraryGroupsProperties[1].buttonText).toBe(
      'Collapse Section'
    );

    componentInstance.toggleButtonText(1);

    expect(componentInstance.mobileLibraryGroupsProperties[1].buttonText).toBe(
      'See More'
    );
    expect(componentInstance.mobileLibraryGroupsProperties[0].buttonText).toBe(
      'Collapse Section'
    );
  });

  it(
    "should toggle the corresponding container's max-height" +
      "and toggle the corresponding button's text",
    () => {
      let buttonTextToggleSpy = spyOn(componentInstance, 'toggleButtonText');
      componentInstance.mobileLibraryGroupsProperties = [
        {
          inCollapsedState: true,
          buttonText: 'See More',
        },
        {
          inCollapsedState: false,
          buttonText: 'Collapse Section',
        },
      ];

      componentInstance.toggleCardContainerHeightInMobileView(0);

      // Correct container's height should be toggled.
      expect(
        componentInstance.mobileLibraryGroupsProperties[0].inCollapsedState
      ).toBe(false);
      // Other container's height should remain unchanged.
      expect(
        componentInstance.mobileLibraryGroupsProperties[1].inCollapsedState
      ).toBe(false);
      expect(buttonTextToggleSpy).toHaveBeenCalledWith(0);
    }
  );

  it('should show full results page when full results url is available', () => {
    let fullResultsUrl = 'full_results_url';
    componentInstance.showFullResultsPage([], fullResultsUrl);
    expect(windowRef.nativeWindow.location.href).toEqual(fullResultsUrl);
  });

  it('should show full results page when results url is not available', () => {
    let urlQueryString = 'urlQueryString';
    spyOn(searchService, 'getSearchUrlQueryString').and.returnValue(
      urlQueryString
    );
    componentInstance.showFullResultsPage(['id'], '');
    expect(windowRef.nativeWindow.location.href).toEqual(
      '/search/find?q=' + urlQueryString
    );
  });

  it('should increment and decrement carousel', () => {
    componentInstance.libraryGroups = [
      {
        activity_summary_dicts: [
          {
            activity_type: '',
            category: '',
            community_owned: true,
            id: '',
            language_code: '',
            num_views: 2,
            objective: '',
            status: '',
            tags: [],
            thumbnail_bg_color: '',
            thumbnail_icon_url: '',
            title: '',
          },
        ],
        categories: [],
        header_i18n_id: '',
        has_full_results_page: true,
        full_results_url: '',
        protractor_id: '',
      },
    ];
    componentInstance.tileDisplayCount = 0;
    componentInstance.leftmostCardIndices = [0];
    componentInstance.incrementLeftmostCardIndex(0);
    expect(componentInstance.leftmostCardIndices).toEqual([1]);
    componentInstance.decrementLeftmostCardIndex(0);
    expect(componentInstance.leftmostCardIndices).toEqual([0]);
  });

  it('should get static image url', () => {
    let url = 'url';
    spyOn(urlInterpolationService, 'getStaticImageUrl').and.returnValue(url);
    expect(componentInstance.getStaticImageUrl('')).toEqual(url);
  });

  it('should set active group', () => {
    let groupIndex = 20;
    componentInstance.setActiveGroup(groupIndex);
    expect(componentInstance.activeGroupIndex).toEqual(groupIndex);
  });

  it('should clear active group', () => {
    componentInstance.setActiveGroup(10);
    componentInstance.clearActiveGroup();
    expect(componentInstance.activeGroupIndex).toBeNull();
  });

  it('should intialize carousels', () => {
    componentInstance.libraryGroups = [
      {
        activity_summary_dicts: [],
        categories: [],
        header_i18n_id: '',
        has_full_results_page: true,
        full_results_url: '',
        protractor_id: '',
      },
    ];
    componentInstance.initCarousels();
    expect(componentInstance.leftmostCardIndices.length).toEqual(1);
  });

  it('should not initialize carousels if there are no library groups', () => {
    componentInstance.initCarousels();
    expect(componentInstance.leftmostCardIndices.length).toEqual(0);
  });

  it('should scroll carousel', () => {
    componentInstance.libraryGroups = [];
    let activityDicts: ActivityDict[] = [];

    for (let i = 0; i < 5; i++) {
      activityDicts.push({
        activity_type: '',
        category: '',
        community_owned: true,
        id: '',
        language_code: '',
        num_views: 10,
        objective: '',
        status: '',
        tags: [],
        thumbnail_bg_color: '',
        thumbnail_icon_url: '',
        title: '',
      });
    }

    for (let i = 0; i < 10; i++) {
      componentInstance.libraryGroups.push({
        activity_summary_dicts: activityDicts,
        categories: [],
        header_i18n_id: '',
        has_full_results_page: true,
        full_results_url: '',
        protractor_id: '',
      });
    }

    spyOn(window, '$').and.returnValue({
      animate: (
        options: string[],
        arg2: {
          duration: number;
          queue: boolean;
          start: () => void;
          complete: () => void;
        }
      ) => {
        arg2.start();
        arg2.complete();
      },
      scrollLeft: () => {},
    } as JQLite);

    componentInstance.scroll(3, false);
    componentInstance.scroll(3, true);
    expect(componentInstance.isAnyCarouselCurrentlyScrolling).toEqual(false);
  });

  it('should not scroll if other carousel is currently scrolling', () => {
    componentInstance.isAnyCarouselCurrentlyScrolling = true;
    componentInstance.leftmostCardIndices = [];
    componentInstance.scroll(0, true);
    expect(componentInstance.leftmostCardIndices).toEqual([]);
  });

  it('should not scroll if all tiles are already showing', () => {
    componentInstance.libraryGroups = [];
    let activityDicts = [];
    let summaryDicts: ActivityDict[] = [];

    for (let i = 0; i < 3; i++) {
      activityDicts.push({
        activity_type: '',
        category: '',
        community_owned: true,
        id: '',
        language_code: '',
        num_views: 10,
        objective: '',
        status: '',
        tags: [],
        thumbnail_bg_color: '',
        thumbnail_icon_url: '',
        title: '',
      });
    }

    for (let i = 0; i < 2; i++) {
      componentInstance.libraryGroups.push({
        activity_summary_dicts: summaryDicts,
        categories: [],
        header_i18n_id: '',
        has_full_results_page: true,
        full_results_url: '',
        protractor_id: '',
      });
    }

    spyOn(window, '$').and.returnValue({
      animate: (
        options: string[],
        arg2: {
          duration: number;
          queue: boolean;
          start: () => void;
          complete: () => void;
        }
      ) => {
        arg2.start();
        arg2.complete();
      },
      scrollLeft: () => {},
    } as JQLite);

    componentInstance.tileDisplayCount = 5;
    componentInstance.scroll(1, false);
    expect(componentInstance.leftmostCardIndices).toEqual([]);
  });

  it('should unsubscribe on component destruction', () => {
    componentInstance.translateSubscription = new Subscription();
    componentInstance.resizeSubscription = new Subscription();
    spyOn(componentInstance.translateSubscription, 'unsubscribe');
    spyOn(componentInstance.resizeSubscription, 'unsubscribe');
    componentInstance.ngOnDestroy();

    expect(
      componentInstance.translateSubscription.unsubscribe
    ).toHaveBeenCalled();
    expect(componentInstance.resizeSubscription.unsubscribe).toHaveBeenCalled();
  });

  it('should get all classrooms data', fakeAsync(() => {
    let response = [
      {
        classroom_id: 'mathclassroom',
        name: 'math',
        url_fragment: 'math',
        teaser_text: 'Learn math',
        is_published: true,
        thumbnail_filename: 'thumbnail.svg',
        thumbnail_bg_color: 'transparent',
      },
    ];
    spyOn(
      classroomBackendApiService,
      'getAllClassroomsSummaryAsync'
    ).and.returnValue(Promise.resolve(response));

    componentInstance.ngOnInit();
    tick();

    expect(
      classroomBackendApiService.getAllClassroomsSummaryAsync
    ).toHaveBeenCalled();
    expect(componentInstance.classroomSummaries).toEqual(response);
    expect(componentInstance.publicClassroomsCount).toEqual(1);
  }));

  it('should handle carousel navigation correctly', () => {
    componentInstance.cardsToShow = 3;
    componentInstance.translateX = 0;
    componentInstance.currentCardIndex = 0;
    componentInstance.dots = [];
    componentInstance.classroomSummaries = Array(5).fill(dummyClassroomSummary);
    componentInstance.updateActiveDot();

    componentInstance.moveClassroomCarouselToNextSlide();
    expect(componentInstance.currentCardIndex).toBe(1);
    expect(componentInstance.translateX).toBe(
      -componentInstance.getCardWidth()
    );
    expect(componentInstance.dots).toEqual([0, 1, 0]);

    componentInstance.moveClassroomCarouselToPreviousSlide();
    expect(componentInstance.currentCardIndex).toBe(0);
    expect(componentInstance.translateX).toBe(0);
    expect(componentInstance.dots).toEqual([1, 0, 0]);

    const middleIndex = 2;
    componentInstance.moveToSlide(middleIndex);
    expect(componentInstance.currentCardIndex).toBe(middleIndex);
    expect(componentInstance.translateX).toBe(
      -middleIndex * componentInstance.getCardWidth()
    );
    expect(componentInstance.dots).toEqual([0, 0, 1]);

    componentInstance.currentCardIndex = 0;
    expect(
      componentInstance.shouldShowPreviousClassroomChunkButton()
    ).toBeFalse();
    expect(componentInstance.shouldShowNextClassroomChunkButton()).toBeTrue();

    componentInstance.currentCardIndex = 2;
    expect(
      componentInstance.shouldShowPreviousClassroomChunkButton()
    ).toBeTrue();
    expect(componentInstance.shouldShowNextClassroomChunkButton()).toBeFalse();
  });

  it('should record analytics when classroom card is clicked', () => {
    spyOn(
      siteAnalyticsService,
      'registerClickClassroomCardEvent'
    ).and.callThrough();
    componentInstance.registerClassroomCardClickEvent('Math');
    expect(
      siteAnalyticsService.registerClickClassroomCardEvent
    ).toHaveBeenCalled();
  });
});
