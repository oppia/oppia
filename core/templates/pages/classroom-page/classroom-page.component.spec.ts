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

import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {ClassroomData} from 'domain/classroom/classroom-data.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {CapitalizePipe} from 'filters/string-utility-filters/capitalize.pipe';
import {AccessValidationBackendApiService} from 'pages/oppia-root/routing/access-validation-backend-api.service';
import {AlertsService} from 'services/alerts.service';
import {UrlService} from 'services/contextual/url.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {LoaderService} from 'services/loader.service';
import {PageTitleService} from 'services/page-title.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {ClassroomPageComponent} from './classroom-page.component';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {UserService} from 'services/user.service';
import {UserInfo} from 'domain/user/user-info.model';

class MockCapitalizePipe {
  transform(input: string): string {
    return input;
  }
}

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

class MockPlatformFeatureService {
  status = {
    DiagnosticTest: {
      isEnabled: false,
    },
  };
}

describe('Classroom Page Component', () => {
  let component: ClassroomPageComponent;
  let fixture: ComponentFixture<ClassroomPageComponent>;
  let urlInterpolationService: UrlInterpolationService;
  let urlService: UrlService;
  let loaderService: LoaderService;
  let classroomBackendApiService: ClassroomBackendApiService;
  let pageTitleService: PageTitleService;
  let siteAnalyticsService: SiteAnalyticsService;
  let alertsService: AlertsService;
  let accessValidationBackendApiService: AccessValidationBackendApiService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let translateService: TranslateService;
  let mockPlatformFeatureService = new MockPlatformFeatureService();
  let userService: UserService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ClassroomPageComponent, MockTranslatePipe],
      providers: [
        AlertsService,
        {
          provide: CapitalizePipe,
          useClass: MockCapitalizePipe,
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
        UserService,
        {
          provide: UrlService,
        },
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService,
        },
        ClassroomBackendApiService,
        LoaderService,
        PageTitleService,
        SiteAnalyticsService,
        UrlInterpolationService,
        UrlService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassroomPageComponent);
    component = fixture.componentInstance;
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    urlService = TestBed.inject(UrlService);
    loaderService = TestBed.inject(LoaderService);
    classroomBackendApiService = TestBed.inject(ClassroomBackendApiService);
    pageTitleService = TestBed.inject(PageTitleService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    alertsService = TestBed.inject(AlertsService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    accessValidationBackendApiService = TestBed.inject(
      AccessValidationBackendApiService
    );
    translateService = TestBed.inject(TranslateService);
    userService = TestBed.inject(UserService);
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should provide static image url', () => {
    let imageUrl = 'image_url';
    spyOn(urlInterpolationService, 'getStaticImageUrl').and.returnValue(
      imageUrl
    );
    expect(component.getStaticImageUrl('test')).toEqual(imageUrl);
  });

  it('should initialize', fakeAsync(() => {
    let classroomUrlFragment = 'math';
    let bannerImageUrl = 'banner_image_url';
    spyOn(urlService, 'getClassroomUrlFragmentFromUrl').and.returnValue(
      classroomUrlFragment
    );
    spyOn(urlInterpolationService, 'getStaticImageUrl').and.returnValue(
      bannerImageUrl
    );
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(component, 'setPageTitle');
    spyOn(component, 'subscribeToOnLangChange');
    spyOn(loaderService, 'hideLoadingScreen');
    spyOn(classroomBackendApiService.onInitializeTranslation, 'emit');
    spyOn(siteAnalyticsService, 'registerClassroomPageViewed');
    let topicSummaryDicts = [
      {
        id: 'topic1',
        name: 'Topic name',
        description: 'Topic description',
        canonical_story_count: 4,
        subtopic_count: 5,
        total_skill_count: 20,
        uncategorized_skill_count: 5,
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#C6DCDA',
        language_code: 'en',
        version: 1,
        additional_story_count: 0,
        total_published_node_count: 4,
        topic_model_created_on: 20160101,
        topic_model_last_updated: 20160110,
        can_edit_topic: true,
        is_published: true,
        url_fragment: 'some-url-fragment',
        classroom: 'math',
        total_upcoming_chapters_count: 1,
        total_overdue_chapters_count: 1,
        total_chapter_counts_for_each_story: [5, 4],
        published_chapter_counts_for_each_story: [3, 4],
      },
    ];

    let classroomData = ClassroomData.createFromBackendData(
      'mathid',
      'Math',
      'math',
      topicSummaryDicts,
      'Course details',
      'Topics covered',
      'Learn math',
      true,
      false,
      {filename: 'thumbnail.svg', size_in_bytes: 100, bg_color: 'transparent'},
      {filename: 'banner.png', size_in_bytes: 100, bg_color: 'transparent'},
      1
    );
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToClassroomPage'
    ).and.returnValue(Promise.resolve());
    spyOn(
      classroomBackendApiService,
      'fetchClassroomDataAsync'
    ).and.returnValue(Promise.resolve(classroomData));
    spyOn(
      i18nLanguageCodeService,
      'getClassroomTranslationKeys'
    ).and.returnValue({
      name: 'I18N_CLASSROOM_MATH_NAME',
      courseDetails: 'I18N_CLASSROOM_MATH_COURSE_DETAILS',
      teaserText: 'I18N_CLASSROOM_MATH_TEASER_TEXT',
      topicListIntro: 'I18N_CLASSROOM_MATH_TOPICS_LIST_INTRO',
    });
    spyOn(
      i18nLanguageCodeService,
      'isHackyTranslationAvailable'
    ).and.returnValue(true);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish').and.returnValue(
      false
    );
    component.ngOnInit();
    tick();
    tick();
    expect(component.classroomUrlFragment).toEqual(classroomUrlFragment);
    expect(component.bannerImageFileUrl).toEqual(bannerImageUrl);
    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(
      classroomBackendApiService.fetchClassroomDataAsync
    ).toHaveBeenCalled();
    expect(component.classroomData).toEqual(classroomData);
    expect(component.classroomDisplayName).toEqual(classroomData.getName());
    expect(component.isHackyClassroomTranslationDisplayed('name')).toBe(true);
    expect(component.setPageTitle).toHaveBeenCalled();
    expect(component.subscribeToOnLangChange).toHaveBeenCalled();
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    expect(
      classroomBackendApiService.onInitializeTranslation.emit
    ).toHaveBeenCalled();
    expect(siteAnalyticsService.registerClassroomPageViewed).toHaveBeenCalled();
  }));

  it('should display alert when unable to fetch classroom data', fakeAsync(() => {
    let classroomUrlFragment = 'test_fragment';
    let bannerImageUrl = 'banner_image_url';
    spyOn(urlService, 'getClassroomUrlFragmentFromUrl').and.returnValue(
      classroomUrlFragment
    );
    spyOn(urlInterpolationService, 'getStaticImageUrl').and.returnValue(
      bannerImageUrl
    );
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToClassroomPage'
    ).and.returnValue(Promise.resolve());
    spyOn(
      classroomBackendApiService,
      'fetchClassroomDataAsync'
    ).and.returnValue(Promise.reject({status: 500}));
    spyOn(alertsService, 'addWarning');
    component.ngOnInit();
    tick();
    expect(component.classroomUrlFragment).toEqual(classroomUrlFragment);
    expect(component.bannerImageFileUrl).toEqual(bannerImageUrl);
    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(
      classroomBackendApiService.fetchClassroomDataAsync
    ).toHaveBeenCalled();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Failed to get classroom data'
    );
  }));

  it(
    'should obtain translated page title whenever the selected' +
      'language changes',
    () => {
      component.subscribeToOnLangChange();
      spyOn(component, 'setPageTitle');
      translateService.onLangChange.emit();

      expect(component.directiveSubscriptions.closed).toBe(false);
      expect(component.setPageTitle).toHaveBeenCalled();
    }
  );
  it('should set classroom name as page title if translation is not available', () => {
    component.classroomDisplayName = 'Science';
    component.classroomTranslationKeys = {
      name: 'I18N_CLASSROOM_SCIENCE_NAME',
      courseDetails: 'I18N_CLASSROOM_SCIENCE_COURSE_DETAILS',
      teaserText: 'I18N_CLASSROOM_SCIENCE_TEASER_TEXT',
      topicListIntro: 'I18N_CLASSROOM_SCIENCE_TOPICS_LIST_INTRO',
    };
    spyOn(
      i18nLanguageCodeService,
      'isHackyTranslationAvailable'
    ).and.returnValue(false);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish').and.returnValue(
      true
    );
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(pageTitleService, 'setDocumentTitle');
    component.setPageTitle();

    expect(translateService.instant).not.toHaveBeenCalledWith(
      'I18N_CLASSROOM_SCIENCE_NAME'
    );
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith('Science');
  });

  it('should set classroom name according to the language', () => {
    component.classroomDisplayName = 'Math';
    spyOn(pageTitleService, 'setDocumentTitle');
    component.classroomTranslationKeys = {
      name: 'I18N_CLASSROOM_MATH_NAME',
      courseDetails: 'I18N_CLASSROOM_MATH_COURSE_DETAILS',
      teaserText: 'I18N_CLASSROOM_MATH_TEASER_TEXT',
      topicListIntro: 'I18N_CLASSROOM_MATH_TOPICS_LIST_INTRO',
    };
    spyOn(
      i18nLanguageCodeService,
      'isHackyTranslationAvailable'
    ).and.returnValue(true);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish').and.returnValue(
      false
    );
    spyOn(translateService, 'instant').and.callThrough();
    component.setPageTitle();

    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_CLASSROOM_MATH_NAME'
    );
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      translateService.instant('I18N_CLASSROOM_MATH_NAME')
    );
  });

  it('should unsubscribe on component destruction', () => {
    component.subscribeToOnLangChange();
    expect(component.directiveSubscriptions.closed).toBe(false);
    component.ngOnDestroy();

    expect(component.directiveSubscriptions.closed).toBe(true);
  });

  it('should return correct value for diagnostic test feature flag', () => {
    expect(component.isDiagnosticTestFeatureFlagEnabled()).toBeFalse();

    mockPlatformFeatureService.status.DiagnosticTest.isEnabled = true;

    expect(component.isDiagnosticTestFeatureFlagEnabled()).toBeTrue();
  });

  it('should return false if diagnostic test is not enabled for the classroom', () => {
    let classroomData = ClassroomData.createFromBackendData(
      'mathid',
      'Math',
      'math',
      [],
      'Course details',
      'Topics covered',
      'Learn math',
      true,
      false,
      {filename: 'thumbnail.svg', size_in_bytes: 100, bg_color: 'transparent'},
      {filename: 'banner.png', size_in_bytes: 100, bg_color: 'transparent'},
      1
    );
    component.classroomData = classroomData;
    expect(component.isDiagnosticTestEnabled()).toBeFalse();
  });

  it('should show private classroom banner to curriculum admins', fakeAsync(() => {
    let userInfo = {
      isCurriculumAdmin: () => true,
      isModerator: () => false,
    } as UserInfo;
    expect(component.showPrivateClassroomBanner).toBeFalse();
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(userInfo)
    );
    spyOn(urlService, 'getClassroomUrlFragmentFromUrl').and.returnValue(
      'classroomUrlFragment'
    );
    let classroomData = ClassroomData.createFromBackendData(
      'mathid',
      'Math',
      'math',
      [],
      'Course details',
      'Topics covered',
      'Learn math',
      false,
      false,
      {filename: 'thumbnail.svg', size_in_bytes: 100, bg_color: 'transparent'},
      {filename: 'banner.png', size_in_bytes: 100, bg_color: 'transparent'},
      1
    );

    spyOn(
      classroomBackendApiService,
      'fetchClassroomDataAsync'
    ).and.returnValue(Promise.resolve(classroomData));
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToClassroomPage'
    ).and.returnValue(Promise.resolve());

    component.ngOnInit();
    tick();

    expect(component.showPrivateClassroomBanner).toBeTrue();
  }));

  it(
    'should not get classroom translation keys if classroomTranslationKeys ' +
      'if key is not present',
    () => {
      component.classroomTranslationKeys = {
        name: 'I18N_CLASSROOM_MATH_NAME',
        courseDetails: 'I18N_CLASSROOM_MATH_COURSE_DETAILS',
        teaserText: 'I18N_CLASSROOM_MATH_TEASER_TEXT',
        topicListIntro: 'I18N_CLASSROOM_MATH_TOPICS_LIST_INTRO',
      };
      expect(
        component.isHackyClassroomTranslationDisplayed('tags')
      ).toBeFalse();
    }
  );

  it('should get RTL language status correctly', () => {
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true
    );
    expect(component.isLanguageRTL()).toBeTrue();
  });
});
