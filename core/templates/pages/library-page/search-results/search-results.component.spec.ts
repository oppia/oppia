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
 * @fileoverview Unit tests for searchResults.
 */

import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { SearchResultsComponent } from './search-results.component';
import { WindowRef } from 'services/contextual/window-ref.service';
import { LoaderService } from 'services/loader.service';
import { SearchService } from 'services/search.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { UserService } from 'services/user.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UserInfo } from 'domain/user/user-info.model';
import { ExplorationSummaryDict } from 'domain/summary/exploration-summary-backend-api.service';

describe('Search Results component', () => {
  let fixture: ComponentFixture<SearchResultsComponent>;
  let componentInstance: SearchResultsComponent;
  let siteAnalyticsService: SiteAnalyticsService;
  let searchService: SearchService;
  let userService: UserService;
  let loaderService: LoaderService;
  let urlInterpolationService: UrlInterpolationService;
  let mockOnInitialSearchResultsLoaded = (
    new EventEmitter<ExplorationSummaryDict[]>());

  class MockWindowRef {
    nativeWindow = {
      location: {
        href: ''
      },
      gtag: () => {}
    };
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        SearchResultsComponent,
        MockTranslatePipe
      ],
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
        LoaderService,
        SearchService,
        SiteAnalyticsService,
        UrlInterpolationService,
        UserService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchResultsComponent);
    componentInstance = fixture.componentInstance;
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    searchService = TestBed.inject(SearchService);
    userService = TestBed.inject(UserService);
    loaderService = TestBed.inject(LoaderService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
  });

  afterEach(() => {
    componentInstance.ngOnDestroy();
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize', fakeAsync(() => {
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(loaderService, 'hideLoadingScreen');
    let userIsLoggedIn = true;
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(new UserInfo(
        ['admin'], true, true,
        true, true, true, 'en', 'test', null, userIsLoggedIn)));
    spyOnProperty(searchService, 'onInitialSearchResultsLoaded')
      .and.returnValue(mockOnInitialSearchResultsLoaded);
    componentInstance.ngOnInit();
    mockOnInitialSearchResultsLoaded.emit([]);
    tick();
    tick();
    expect(componentInstance.someResultsExist).toBeFalse();
    expect(componentInstance.userIsLoggedIn).toEqual(userIsLoggedIn);
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
  }));

  it('should redirect to login', fakeAsync(() => {
    spyOn(siteAnalyticsService, 'registerStartLoginEvent');
    componentInstance.onRedirectToLogin('login');
    tick(200);
    expect(siteAnalyticsService.registerStartLoginEvent).toHaveBeenCalled();
  }));

  it('should get static image url', () => {
    let staticUrl = 'test_url';
    spyOn(urlInterpolationService, 'getStaticAssetUrl')
      .and.returnValue(staticUrl);
    expect(componentInstance.getStaticImageUrl('path')).toEqual(staticUrl);
  });
});
