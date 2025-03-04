// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ClassroomNavigationLinksComponent.
 */

import {HttpClientModule} from '@angular/common/http';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {ClassroomNavigationLinksComponent} from './classroom-navigation-links.component';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {WindowRef} from 'services/contextual/window-ref.service';

describe('ClassroomNavigationLinksComponent', () => {
  let component: ClassroomNavigationLinksComponent;
  let fixture: ComponentFixture<ClassroomNavigationLinksComponent>;
  let classroomBackendApiService: ClassroomBackendApiService;
  let assetsBackendApiService: AssetsBackendApiService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let siteAnalyticsService: SiteAnalyticsService;

  const dummyClassroomSummaries = [
    {
      classroom_id: 'math',
      name: 'math',
      url_fragment: 'math',
      teaser_text: 'Learn math',
      is_published: true,
      thumbnail_filename: 'thumbnail.svg',
      thumbnail_bg_color: 'transparent',
    },
    {
      classroom_id: 'science',
      name: 'science',
      url_fragment: 'science',
      teaser_text: 'Learn science',
      is_published: true,
      thumbnail_filename: 'thumbnail.svg',
      thumbnail_bg_color: 'transparent',
    },
    {
      classroom_id: 'histroy',
      name: 'histroy',
      url_fragment: 'history',
      teaser_text: 'Learn histroy',
      is_published: true,
      thumbnail_filename: 'thumbnail.svg',
      thumbnail_bg_color: 'transparent',
    },
  ];

  beforeEach(async () => {
    const classroomBackendApiServiceSpy = jasmine.createSpyObj(
      'ClassroomBackendApiService',
      ['getAllClassroomsSummaryAsync']
    );
    const assetsBackendApiServiceSpy = jasmine.createSpyObj(
      'AssetsBackendApiService',
      ['getThumbnailUrlForPreview']
    );

    await TestBed.configureTestingModule({
      imports: [HttpClientModule, HttpClientTestingModule],
      declarations: [ClassroomNavigationLinksComponent, MockTranslatePipe],
      providers: [
        {
          provide: ClassroomBackendApiService,
          useValue: classroomBackendApiServiceSpy,
        },
        {
          provide: AssetsBackendApiService,
          useValue: assetsBackendApiServiceSpy,
        },
        {
          provide: WindowRef,
          useValue: {
            nativeWindow: {
              location: {pathname: '/learn'},
              gtag: jasmine.createSpy('gtag'),
            },
          },
        },
      ],
    }).compileComponents();

    classroomBackendApiService = TestBed.inject(ClassroomBackendApiService);
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassroomNavigationLinksComponent);
    component = fixture.componentInstance;
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
  });

  it('should set component properties on initialization', fakeAsync(() => {
    classroomBackendApiService.getAllClassroomsSummaryAsync.and.returnValue(
      Promise.resolve(dummyClassroomSummaries)
    );

    expect(component.classroomSummaries.length).toEqual(0);
    expect(component.isLoading).toBeTrue();

    component.ngOnInit();
    tick();

    // It should store top 2 public classrooms.
    expect(component.classroomSummaries.length).toEqual(2);
    expect(component.isLoading).toBeFalse();
  }));

  it('should get classroom thumbnail', () => {
    const classroomId = 'math';
    const thumbnailFilename = 'thumbnail.svg';

    assetsBackendApiService.getThumbnailUrlForPreview.and.returnValue(
      '/thumbnail/thumbnail.svg'
    );

    const result = component.getClassroomThumbnail(
      classroomId,
      thumbnailFilename
    );

    expect(result).toContain('thumbnail.svg');
    expect(
      assetsBackendApiService.getThumbnailUrlForPreview
    ).toHaveBeenCalledWith(jasmine.any(String), classroomId, thumbnailFilename);
  });

  it('should get classroom name translation key', () => {
    const classroomName = 'math';
    spyOn(
      i18nLanguageCodeService,
      'getClassroomTranslationKeys'
    ).and.returnValue({name: 'I18N_CLASROOM_MATH_NAME'});

    const result = component.getClassroomNameTranslationkey(classroomName);

    expect(result).toBe('I18N_CLASROOM_MATH_NAME');
    expect(
      i18nLanguageCodeService.getClassroomTranslationKeys
    ).toHaveBeenCalledWith(classroomName);
  });

  it('should check if hacky classroom name translation is displayed', () => {
    const classroomName = 'science';
    spyOn(
      i18nLanguageCodeService,
      'isClassroomnNameTranslationAvailable'
    ).and.returnValue(true);

    const result =
      component.isHackyClassroomNameTranslationDisplayed(classroomName);

    expect(result).toBeTrue();
    expect(
      i18nLanguageCodeService.isClassroomnNameTranslationAvailable
    ).toHaveBeenCalledWith(classroomName);
  });

  it('should record analytics when classroom card is clicked', () => {
    spyOn(
      siteAnalyticsService,
      'registerClickClassroomCardEvent'
    ).and.callThrough();
    component.registerClassroomCardClickEvent('Math');
    expect(
      siteAnalyticsService.registerClickClassroomCardEvent
    ).toHaveBeenCalled();
  });

  it('should not load classroom summaries if currentUrl is signup', fakeAsync(() => {
    const windowRef = TestBed.inject(WindowRef) as WindowRef;
    windowRef.nativeWindow.location.pathname = '/signup';

    component.ngOnInit();
    tick();

    expect(component.currentUrl).toEqual('signup');
    expect(
      classroomBackendApiService.getAllClassroomsSummaryAsync
    ).not.toHaveBeenCalled();
    expect(component.classroomSummaries).toEqual([]);
    expect(component.isLoading).toBeTrue();
  }));
});
