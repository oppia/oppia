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
 * @fileoverview Unit tests for topicLandingPage.
 */

import { TopicLandingPageComponent } from './topic-landing-page.component';
import { ComponentFixture, TestBed, async, tick, fakeAsync } from '@angular/core/testing';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';

import { WindowRef } from 'services/contextual/window-ref.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PageTitleService } from 'services/page-title.service';

require(
  'pages/landing-pages/topic-landing-page/topic-landing-page.component.ts');

class MockWindowRef {
  _window = {
    location: {
      _pathname: ''
    }
  };
  get nativeWindow() {
    return this._window;
  }
}

class MockSiteAnalyticsService {
  registerOpenCollectionFromLandingPageEvent(collectionId: string): void {
    return;
  }
}

let component: TopicLandingPageComponent;
let fixture: ComponentFixture<TopicLandingPageComponent>;

fdescribe('Topic Landing Page', () => {
  let siteAnalyticsService = null;
  let windowRef: MockWindowRef = null;
  let pageTitleService = null;

  // BeforeEach(angular.mock.module('oppia'));
  // beforeEach(angular.mock.module('oppia', function($provide) {
  //   $provide.value('WindowRef', windowRef);
  //   $provide.value('PageTitleService', {
  //     setPageTitle: function() {}
  //   });
  // }));
  // beforeEach(angular.mock.inject(function($injector, $componentController) {
  //   $timeout = $injector.get('$timeout');
  //   $window = $injector.get('$window');
  //   SiteAnalyticsService = $injector.get('SiteAnalyticsService');

  //   ctrl = $componentController('topicLandingPage');
  // }));

  beforeEach(async(() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      declarations: [TopicLandingPageComponent],
      providers: [
        PageTitleService,
        { provide: SiteAnalyticsService, useClass: MockSiteAnalyticsService },
        UrlInterpolationService,
        { provide: WindowRef, useValue: windowRef }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    pageTitleService = TestBed.get(PageTitleService);
    siteAnalyticsService = TestBed.get(SiteAnalyticsService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicLandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should get information from topic identified at pathname', () => {
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        pathname: '/math/ratios'
      }
    });
    component.ngOnInit();
    expect(component.topicTitle).toBe('Ratios');
  });

  it('should click get started button', fakeAsync(() => {
    var nativeWindowSpy = spyOnProperty(windowRef, 'nativeWindow');
    nativeWindowSpy.and.returnValue({
      location: {
        pathname: '/math/ratios'
      }
    });
    var analyticsSpy = spyOn(
      siteAnalyticsService, 'registerOpenCollectionFromLandingPageEvent')
      .and.callThrough();
    // Get collection id from ratios.
    component.ngOnInit();

    nativeWindowSpy.and.returnValue({
      location: ''
    });
    component.onClickGetStartedButton();

    var ratiosCollectionId = '53gXGLIR044l';
    expect(analyticsSpy).toHaveBeenCalledWith(ratiosCollectionId);
    tick(150);
    fixture.detectChanges();

    expect(windowRef.nativeWindow.location).toBe(
      '/collection/' + ratiosCollectionId);
  }));

  it('should click learn more button', fakeAsync(() => {
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: ''
    });
    component.onClickLearnMoreButton();
    tick(150);
    fixture.detectChanges();

    expect(windowRef.nativeWindow.location).toBe('/community-library');
  }));

  it('should have a tagline in the page title', fakeAsync(() => {
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        pathname: '/math/fractions'
      }
    });
    component.ngOnInit();
    tick(150);
    fixture.detectChanges();
    // Expect($window.document.title).toBe('Fractions | ' +
    //   'Add, Subtract, Multiply and Divide | Oppia');
  }));

  it('should return correct lesson quality image src', function() {
    var imageSrc = component.getLessonQualityImageSrc('someImage.png');
    expect(imageSrc).toBe('/assets/images/landing/someImage.png');

    imageSrc = component.getLessonQualityImageSrc('someOtherImage.png');
    expect(imageSrc).toBe('/assets/images/landing/someOtherImage.png');
  });
});
