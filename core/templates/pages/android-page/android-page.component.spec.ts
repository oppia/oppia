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
 * @fileoverview Unit tests for Android page.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA, EventEmitter, ElementRef } from '@angular/core';
import { TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { AndroidUpdatesBackendApiService } from 'domain/android-updates/android-updates-backend-api.service';

import { AndroidPageComponent } from './android-page.component';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { PageTitleService } from 'services/page-title.service';
import { AlertsService } from 'services/alerts.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';


class MockIntersectionObserver {
  observe: () => void;
  unobserve: () => void;

  constructor(
    public callback: (entries: IntersectionObserverEntry[]) => void
  ) {
    this.observe = () => {
      callback([{
        isIntersecting: true,
        boundingClientRect: new DOMRectReadOnly(),
        intersectionRatio: 1,
        intersectionRect: new DOMRectReadOnly(),
        rootBounds: null,
        target: document.createElement('div'),
        time: 1
      }]);
    };
    this.unobserve = jasmine.createSpy('unobserve');
  }
}

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

describe('Android page', () => {
  let translateService: TranslateService;
  let pageTitleService: PageTitleService;
  let androidUpdatesBackendApiService: AndroidUpdatesBackendApiService;
  let alertsService: AlertsService;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [AndroidPageComponent, MockTranslatePipe],
      providers: [
        AlertsService,
        AndroidUpdatesBackendApiService,
        UrlInterpolationService,
        PageTitleService,
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  let component: AndroidPageComponent;

  beforeEach(() => {
    const androidPageComponent = TestBed.createComponent(
      AndroidPageComponent);
    component = androidPageComponent.componentInstance;
    alertsService = TestBed.inject(AlertsService);
    androidUpdatesBackendApiService = TestBed.inject(
      AndroidUpdatesBackendApiService);
    translateService = TestBed.inject(TranslateService);
    pageTitleService = TestBed.inject(PageTitleService);
  });

  it('should successfully instantiate the component from beforeEach block',
    () => {
      expect(component).toBeDefined();
    });

  it('should set component properties when ngOnInit() is called', () => {
    spyOn(translateService.onLangChange, 'subscribe');

    component.ngOnInit();

    expect(translateService.onLangChange.subscribe).toHaveBeenCalled();
  });

  it('should obtain translated page title whenever the selected' +
  'language changes', () => {
    component.ngOnInit();
    spyOn(component, 'setPageTitle');

    translateService.onLangChange.emit();

    expect(component.setPageTitle).toHaveBeenCalled();
  });

  it('should set new page title', () => {
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(pageTitleService, 'setDocumentTitle');

    component.setPageTitle();

    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_ANDROID_PAGE_TITLE');
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'I18N_ANDROID_PAGE_TITLE');
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

  it('should change feature selection', () => {
    component.ngOnInit();
    expect(component.featuresShown).toBe(1);

    component.changeFeaturesShown(3);

    expect(component.featuresShown).toBe(3);
  });

  it('should validate email address correctly', () => {
    component.emailAddress = 'invalidEmail';
    expect(component.validateEmailAddress()).toBeFalse();

    component.emailAddress = 'validEmail@example.com';
    expect(component.validateEmailAddress()).toBeTrue();
  });

  it('should add user to android mailing list and return status',
    fakeAsync(() => {
      spyOn(alertsService, 'addInfoMessage');
      component.ngOnInit();
      tick();
      component.emailAddress = 'validEmail@example.com';
      component.name = 'validName';
      spyOn(androidUpdatesBackendApiService, 'subscribeUserToAndroidList')
        .and.returnValue(Promise.resolve(true));

      component.subscribeToAndroidList();

      flushMicrotasks();

      expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
        'Done!', 1000);
    }));

  it('should fail to add user to android mailing list and return status',
    fakeAsync(() => {
      spyOn(alertsService, 'addInfoMessage');
      component.ngOnInit();
      tick();
      component.emailAddress = 'validEmail@example.com';
      component.name = 'validName';
      spyOn(androidUpdatesBackendApiService, 'subscribeUserToAndroidList')
        .and.returnValue(Promise.resolve(false));

      component.subscribeToAndroidList();

      flushMicrotasks();

      expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
        'Sorry, an unexpected error occurred. Please email admin@oppia.org ' +
        'to be added to the mailing list.', 10000);
    }));

  it('should reject request to the android mailing list correctly',
    fakeAsync(() => {
      spyOn(alertsService, 'addInfoMessage');
      component.ngOnInit();
      tick();
      component.emailAddress = 'validEmail@example.com';
      component.name = 'validName';
      spyOn(androidUpdatesBackendApiService, 'subscribeUserToAndroidList')
        .and.returnValue(Promise.reject(false));

      component.subscribeToAndroidList();

      flushMicrotasks();

      expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
        'Sorry, an unexpected error occurred. Please email admin@oppia.org ' +
        'to be added to the mailing list.', 10000);
    }));

  it('should attach intersection observers', () => {
    // eslint-disable-next-line
    (window as any).IntersectionObserver = MockIntersectionObserver;
    component.androidUpdatesSectionRef = new ElementRef(
      document.createElement('div'));
    component.featuresMainTextRef = new ElementRef(
      document.createElement('div'));
    component.featureRef1 = new ElementRef(document.createElement('div'));
    component.featureRef2 = new ElementRef(document.createElement('div'));
    component.featureRef3 = new ElementRef(document.createElement('div'));
    component.featureRef4 = new ElementRef(document.createElement('div'));
    component.androidUpdatesSectionIsSeen = false;
    component.featuresMainTextIsSeen = false;
    spyOn(component, 'setPageTitle');

    component.ngAfterViewInit();

    expect(component.setPageTitle).toHaveBeenCalled();
    expect(component.androidUpdatesSectionIsSeen).toBe(true);
    expect(component.featuresMainTextIsSeen).toBe(true);
  });
});
