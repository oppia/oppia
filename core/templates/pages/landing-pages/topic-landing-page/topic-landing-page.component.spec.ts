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

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, async, tick, fakeAsync }
  from '@angular/core/testing';

import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { TopicLandingPageComponent } from
  'pages/landing-pages/topic-landing-page/topic-landing-page.component';
import { PageTitleService } from 'services/page-title.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { WindowRef } from 'services/contextual/window-ref.service';

import constants from 'assets/constants';

class MockWindowRef {
  _window = {
    location: {
      _pathname: '/math/ratios',
      _href: '',
      get pathname(): string {
        return this._pathname;
      },
      set pathname(val: string) {
        this._pathname = val;
      },
      get href(): string {
        return this._href;
      },
      set href(val) {
        this._href = val;
      }
    },
    gtag: () => {}
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

describe('Topic Landing Page', () => {
  let siteAnalyticsService = null;
  let windowRef: MockWindowRef;
  let pageTitleService = null;

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

  it('should get topic title from topic id in pathname when component' +
    ' is initialized', () => {
    windowRef.nativeWindow.location.pathname = '/math/ratios';
    component.ngOnInit();
    expect(component.topicTitle).toBe('Ratios');
  });

  it('should click get started button', fakeAsync(() => {
    windowRef.nativeWindow.location.pathname = '/math/ratios';
    let analyticsSpy = spyOn(
      siteAnalyticsService, 'registerOpenCollectionFromLandingPageEvent')
      .and.callThrough();
    // Get collection id from ratios.
    component.ngOnInit();

    windowRef.nativeWindow.location.href = '';
    component.onClickGetStartedButton();

    let ratiosCollectionId = '53gXGLIR044l';
    expect(analyticsSpy).toHaveBeenCalledWith(ratiosCollectionId);
    tick(150);
    fixture.detectChanges();

    expect(windowRef.nativeWindow.location.href).toBe(
      '/learn/math/ratios');
  }));

  it('should click learn more button', fakeAsync(() => {
    windowRef.nativeWindow.location.href = '';
    component.goToClassroom();
    tick(150);
    fixture.detectChanges();

    expect(windowRef.nativeWindow.location.href).toBe(
      `/learn/${constants.DEFAULT_CLASSROOM_URL_FRAGMENT}`);
  }));

  it('should have a tagline in the page title', fakeAsync(() => {
    windowRef.nativeWindow.location.pathname = '/math/fractions';
    component.ngOnInit();
    tick(150);
    fixture.detectChanges();
    expect(pageTitleService.getDocumentTitle()).toBe(
      'Fractions | Add, Subtract, Multiply and Divide | Oppia');
  }));

  it('should return correct lesson quality image src', function() {
    let imageSrc = component.getLessonQualityImageSrc('someImage.png');
    expect(imageSrc).toBe('/assets/images/landing/someImage.png');

    imageSrc = component.getLessonQualityImageSrc('someOtherImage.png');
    expect(imageSrc).toBe('/assets/images/landing/someOtherImage.png');
  });
});
