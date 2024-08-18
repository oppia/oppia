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
 * @fileoverview Unit tests for classrooms page component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {AlertsService} from 'services/alerts.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {ClassroomsPageComponent} from './classrooms-page.component';
import {CapitalizePipe} from 'filters/string-utility-filters/capitalize.pipe';
import {Router} from '@angular/router';
import {SiteAnalyticsService} from 'services/site-analytics.service';

class MockCapitalizePipe {
  transform(input: string): string {
    return input;
  }
}

class MockI18nLanguageCodeService {
  isCurrentLanguageRTL() {
    return true;
  }
}

class MockRouter {
  navigate(commands: string[]): Promise<boolean> {
    return Promise.resolve(true);
  }
}

describe('Classrooms Page Component', () => {
  let component: ClassroomsPageComponent;
  let fixture: ComponentFixture<ClassroomsPageComponent>;
  let classroomBackendApiService: ClassroomBackendApiService;
  let alertsService: AlertsService;
  let router: Router;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let siteAnalyticsService: SiteAnalyticsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ClassroomsPageComponent, MockTranslatePipe],
      providers: [
        AlertsService,
        {
          provide: CapitalizePipe,
          useClass: MockCapitalizePipe,
        },
        ClassroomBackendApiService,
        {provide: Router, useClass: MockRouter},
        {
          provide: I18nLanguageCodeService,
          useClass: MockI18nLanguageCodeService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    router = TestBed.inject(Router);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassroomsPageComponent);
    component = fixture.componentInstance;
    classroomBackendApiService = TestBed.inject(ClassroomBackendApiService);
    alertsService = TestBed.inject(AlertsService);
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should display alert when unable to fetch classrooms data', fakeAsync(() => {
    spyOn(
      classroomBackendApiService,
      'getAllClassroomsSummaryAsync'
    ).and.returnValue(Promise.reject(400));
    spyOn(alertsService, 'addWarning');

    component.ngOnInit();
    tick();

    expect(
      classroomBackendApiService.getAllClassroomsSummaryAsync
    ).toHaveBeenCalled();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Failed to get classrooms data.'
    );
  }));

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

    component.ngOnInit();
    tick();

    expect(
      classroomBackendApiService.getAllClassroomsSummaryAsync
    ).toHaveBeenCalled();
    expect(component.classroomSummaries).toEqual(response);
  }));

  it(
    'should set hasPublicClassrooms to true if we' + 'have a private classroom',
    fakeAsync(() => {
      let response = [
        {
          classroom_id: 'mathclassroom',
          name: 'math',
          url_fragment: 'math',
          teaser_text: 'Learn math',
          is_published: false,
          thumbnail_filename: 'thumbnail.svg',
          thumbnail_bg_color: 'transparent',
        },
      ];
      spyOn(
        classroomBackendApiService,
        'getAllClassroomsSummaryAsync'
      ).and.returnValue(Promise.resolve(response));

      component.ngOnInit();
      tick();

      expect(
        classroomBackendApiService.getAllClassroomsSummaryAsync
      ).toHaveBeenCalled();
      expect(component.hasPublicClassrooms).toBeTrue();
    })
  );

  it(
    'should set redirect to classroom page if we just have ' +
      'one public classroom',
    fakeAsync(() => {
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
      const navigateSpy = spyOn(router, 'navigate').and.returnValue(
        Promise.resolve(true)
      );
      component.ngOnInit();
      tick();

      expect(
        classroomBackendApiService.getAllClassroomsSummaryAsync
      ).toHaveBeenCalled();
      expect(component.hasPublicClassrooms).toBeFalse();
      expect(navigateSpy).toHaveBeenCalledWith(['/learn/math']);
    })
  );

  it('should get RTL language status correctly', () => {
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true
    );
    expect(component.isLanguageRTL()).toBeTrue();
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
});
