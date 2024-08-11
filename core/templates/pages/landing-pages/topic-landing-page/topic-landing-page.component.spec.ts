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

import {NO_ERRORS_SCHEMA, EventEmitter} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  async,
  tick,
  fakeAsync,
} from '@angular/core/testing';
import {TranslateService} from '@ngx-translate/core';

import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {TopicLandingPageComponent} from 'pages/landing-pages/topic-landing-page/topic-landing-page.component';
import {PageTitleService} from 'services/page-title.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {WindowRef} from 'services/contextual/window-ref.service';

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
      },
    },
    gtag: () => {},
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

class MockSiteAnalyticsService {
  registerOpenCollectionFromLandingPageEvent(collectionId: string): void {
    return;
  }
}

let component: TopicLandingPageComponent;
let fixture: ComponentFixture<TopicLandingPageComponent>;

describe('Topic Landing Page', () => {
  let siteAnalyticsService: SiteAnalyticsService;
  let windowRef: MockWindowRef;
  let pageTitleService: PageTitleService;
  let translateService: TranslateService;

  beforeEach(async(() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      declarations: [TopicLandingPageComponent],
      providers: [
        PageTitleService,
        {provide: SiteAnalyticsService, useClass: MockSiteAnalyticsService},
        UrlInterpolationService,
        {provide: WindowRef, useValue: windowRef},
        {provide: TranslateService, useClass: MockTranslateService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicLandingPageComponent);
    component = fixture.componentInstance;
    pageTitleService = TestBed.inject(PageTitleService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    translateService = TestBed.inject(TranslateService);
    fixture.detectChanges();
  });

  it(
    'should get topic title from topic id in pathname and subscribe to ' +
      'onLangChange emitterwhen component is initialized',
    () => {
      spyOn(translateService.onLangChange, 'subscribe');
      windowRef.nativeWindow.location.pathname = '/math/ratios';
      component.ngOnInit();
      expect(component.topicTitle).toBe('Ratios');
      expect(translateService.onLangChange.subscribe).toHaveBeenCalled();
    }
  );

  it('should click get started button', fakeAsync(() => {
    windowRef.nativeWindow.location.pathname = '/math/ratios';
    let analyticsSpy = spyOn(
      siteAnalyticsService,
      'registerOpenCollectionFromLandingPageEvent'
    ).and.callThrough();
    // Get collection id from ratios.
    component.ngOnInit();

    windowRef.nativeWindow.location.href = '';
    component.onClickGetStartedButton();

    let ratiosCollectionId = '53gXGLIR044l';
    expect(analyticsSpy).toHaveBeenCalledWith(ratiosCollectionId);
    tick(150);
    fixture.detectChanges();

    expect(windowRef.nativeWindow.location.href).toBe('/learn/math/ratios');
  }));

  it('should click learn more button', fakeAsync(() => {
    windowRef.nativeWindow.location.href = '';
    component.goToClassroom();
    tick(150);
    fixture.detectChanges();

    expect(windowRef.nativeWindow.location.href).toBe('/learn');
  }));

  it('should return correct lesson quality image src', function () {
    let imageSrc = component.getLessonQualityImageSrc('someImage.png');
    expect(imageSrc).toBe('/assets/images/landing/someImage.png');

    imageSrc = component.getLessonQualityImageSrc('someOtherImage.png');
    expect(imageSrc).toBe('/assets/images/landing/someOtherImage.png');
  });

  it(
    'should obtain translated page title whenever the selected' +
      'language changes',
    () => {
      component.ngOnInit();
      spyOn(component, 'setPageTitle');
      translateService.onLangChange.emit();

      expect(component.setPageTitle).toHaveBeenCalled();
    }
  );

  it('should set new page title', () => {
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(pageTitleService, 'setDocumentTitle');
    component.topicTitle = 'dummy_title';
    component.topicData = {
      topicTitle: 'dummy_title',
      topicTagline: 'dummy_tagline',
      collectionId: 'dummy_collectionId',
      chapters: ['chapter1', 'chapter2'],
    };
    component.setPageTitle();

    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_TOPIC_LANDING_PAGE_TITLE',
      {
        topicTitle: 'dummy_title',
        topicTagline: 'dummy_tagline',
      }
    );
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'I18N_TOPIC_LANDING_PAGE_TITLE'
    );
  });

  it('should unsubscribe on component destruction', () => {
    component.directiveSubscriptions.add(
      translateService.onLangChange.subscribe(() => {
        component.setPageTitle();
      })
    );
    component.ngOnDestroy();

    expect(component.directiveSubscriptions.closed).toBe(true);
  });
});
