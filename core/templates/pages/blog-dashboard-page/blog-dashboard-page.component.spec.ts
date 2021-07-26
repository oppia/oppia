// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Blog Dashboard page component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CapitalizePipe } from 'filters/string-utility-filters/capitalize.pipe';
import { MockTranslatePipe, MockCapitalizePipe } from 'tests/unit-test-utils';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { LoaderService } from 'services/loader.service';
import { AlertsService } from 'services/alerts.service';
import { BlogDashboardPageComponent } from './blog-dashboard-page.component';
import { BlogDashboardBackendApiService } from 'domain/blog/blog-dashboard-backend-api.service';
import { MatTabsModule } from '@angular/material/tabs';

describe('Blog Dashboard Page Component', () => {
  let component: BlogDashboardPageComponent;
  let fixture: ComponentFixture<BlogDashboardPageComponent>;
  let urlInterpolationService: UrlInterpolationService;
  let loaderService: LoaderService;
  let blogDashboardBackendApiService: BlogDashboardBackendApiService;
  let alertsService: AlertsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MatTabsModule
      ],
      declarations: [
        BlogDashboardPageComponent,
        MockTranslatePipe
      ],
      providers: [
        AlertsService,
        {
          provide: CapitalizePipe,
          useClass: MockCapitalizePipe
        },
        BlogDashboardBackendApiService,
        LoaderService,
        UrlInterpolationService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlogDashboardPageComponent);
    component = fixture.componentInstance;
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    loaderService = TestBed.inject(LoaderService);
    blogDashboardBackendApiService = TestBed.inject(
      BlogDashboardBackendApiService);
    alertsService = TestBed.inject(AlertsService);
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should initialize', fakeAsync(() => {
    let defaultImageUrl = 'banner_image_url';
    let blogDashboardData = {
      username: 'test_user',
      profilePictureDataUrl: 'sample_url',
      numOfPublishedBlogPosts: 0,
      numOfDraftBlogPosts: 0,
      publishedBlogPostSummaryDicts: [],
      draftBlogPostSummaryDicts: [],
    };
    spyOn(urlInterpolationService, 'getStaticImageUrl')
      .and.returnValue(defaultImageUrl);
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(loaderService, 'hideLoadingScreen');
    spyOn(blogDashboardBackendApiService, 'fetchBlogDashboardDataAsync')
      .and.returnValue(Promise.resolve(blogDashboardData));

    component.ngOnInit();
    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    tick();

    expect(component.blogDashboardData).toEqual(blogDashboardData);
    expect(component.DEFAULT_PROFILE_PICTURE_URL).toEqual(defaultImageUrl);
    expect(blogDashboardBackendApiService.fetchBlogDashboardDataAsync)
      .toHaveBeenCalled();
    expect(component.authorProfilePictureUrl).toEqual('sample_url');
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
  }));

  it('should display alert when unable to fetch blog dashboard data',
    fakeAsync(() => {
      let defaultImageUrl = 'banner_image_url';
      spyOn(urlInterpolationService, 'getStaticImageUrl')
        .and.returnValue(defaultImageUrl);
      spyOn(loaderService, 'showLoadingScreen');
      spyOn(blogDashboardBackendApiService, 'fetchBlogDashboardDataAsync')
        .and.returnValue(Promise.reject({ status: 500 }));
      spyOn(alertsService, 'addWarning');

      component.ngOnInit();
      tick();

      expect(component.DEFAULT_PROFILE_PICTURE_URL).toEqual(defaultImageUrl);
      expect(loaderService.showLoadingScreen).toHaveBeenCalled();
      expect(blogDashboardBackendApiService.fetchBlogDashboardDataAsync)
        .toHaveBeenCalled();
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Failed to get blog dashboard data');
    }));
});
