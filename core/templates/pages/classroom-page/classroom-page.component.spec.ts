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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { ClassroomBackendApiService } from 'domain/classroom/classroom-backend-api.service';
import { ClassroomData } from 'domain/classroom/classroom-data.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { CapitalizePipe } from 'filters/string-utility-filters/capitalize.pipe';
import { AlertsService } from 'services/alerts.service';
import { UrlService } from 'services/contextual/url.service';
import { LoaderService } from 'services/loader.service';
import { PageTitleService } from 'services/page-title.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { ClassroomPageComponent } from './classroom-page.component';

class MockCapitalizePipe {
  transform(input: string): string {
    return input;
  }
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

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        ClassroomPageComponent,
        MockTranslatePipe
      ],
      providers: [
        AlertsService,
        {
          provide: CapitalizePipe,
          useClass: MockCapitalizePipe
        },
        ClassroomBackendApiService,
        LoaderService,
        PageTitleService,
        SiteAnalyticsService,
        UrlInterpolationService,
        UrlService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
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
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should provide static image url', () => {
    let imageUrl = 'image_url';
    spyOn(urlInterpolationService, 'getStaticImageUrl')
      .and.returnValue(imageUrl);
    expect(component.getStaticImageUrl('test')).toEqual(imageUrl);
  });

  it('should initialize', fakeAsync(() => {
    let classroomUrlFragment = 'test_fragment';
    let bannerImageUrl = 'banner_image_url';
    spyOn(urlService, 'getClassroomUrlFragmentFromUrl')
      .and.returnValue(classroomUrlFragment);
    spyOn(urlInterpolationService, 'getStaticImageUrl')
      .and.returnValue(bannerImageUrl);
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(pageTitleService, 'setPageTitle');
    spyOn(loaderService, 'hideLoadingScreen');
    spyOn(classroomBackendApiService.onInitializeTranslation, 'emit');
    spyOn(siteAnalyticsService, 'registerClassroomPageViewed');
    let classroomData = ClassroomData.createFromBackendData(
      'Math', [], 'Course details', 'Topics covered');
    spyOn(classroomBackendApiService, 'fetchClassroomDataAsync')
      .and.returnValue(Promise.resolve(classroomData));

    component.ngOnInit();
    tick();
    expect(component.classroomUrlFragment).toEqual(classroomUrlFragment);
    expect(component.bannerImageFileUrl).toEqual(bannerImageUrl);
    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(classroomBackendApiService.fetchClassroomDataAsync)
      .toHaveBeenCalled();
    expect(component.classroomData).toEqual(classroomData);
    expect(component.classroomDisplayName).toEqual(classroomData.getName());
    expect(pageTitleService.setPageTitle).toHaveBeenCalled();
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    expect(classroomBackendApiService.onInitializeTranslation.emit)
      .toHaveBeenCalled();
    expect(siteAnalyticsService.registerClassroomPageViewed).toHaveBeenCalled();
  }));

  it('should display alert when unable to fetch classroom data',
    fakeAsync(() => {
      let classroomUrlFragment = 'test_fragment';
      let bannerImageUrl = 'banner_image_url';
      spyOn(urlService, 'getClassroomUrlFragmentFromUrl')
        .and.returnValue(classroomUrlFragment);
      spyOn(urlInterpolationService, 'getStaticImageUrl')
        .and.returnValue(bannerImageUrl);
      spyOn(loaderService, 'showLoadingScreen');
      spyOn(classroomBackendApiService, 'fetchClassroomDataAsync')
        .and.returnValue(Promise.reject({ status: 500 }));
      spyOn(alertsService, 'addWarning');
      component.ngOnInit();
      tick();
      expect(component.classroomUrlFragment).toEqual(classroomUrlFragment);
      expect(component.bannerImageFileUrl).toEqual(bannerImageUrl);
      expect(loaderService.showLoadingScreen).toHaveBeenCalled();
      expect(classroomBackendApiService.fetchClassroomDataAsync)
        .toHaveBeenCalled();
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Failed to get dashboard data');
    }));
});
