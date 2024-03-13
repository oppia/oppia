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

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA, EventEmitter} from '@angular/core';
import {TestBed, fakeAsync, tick, flushMicrotasks} from '@angular/core/testing';
import {TranslateService} from '@ngx-translate/core';
import {MailingListBackendApiService} from 'domain/mailing-list/mailing-list-backend-api.service';

import {AndroidPageComponent} from './android-page.component';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {PageTitleService} from 'services/page-title.service';
import {AlertsService} from 'services/alerts.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

describe('Android page', () => {
  let translateService: TranslateService;
  let pageTitleService: PageTitleService;
  let mailingListBackendApiService: MailingListBackendApiService;
  let alertsService: AlertsService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [AndroidPageComponent, MockTranslatePipe],
      providers: [
        AlertsService,
        MailingListBackendApiService,
        UrlInterpolationService,
        PageTitleService,
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  let component: AndroidPageComponent;

  beforeEach(() => {
    const androidPageComponent = TestBed.createComponent(AndroidPageComponent);
    component = androidPageComponent.componentInstance;
    alertsService = TestBed.inject(AlertsService);
    mailingListBackendApiService = TestBed.inject(MailingListBackendApiService);
    translateService = TestBed.inject(TranslateService);
    pageTitleService = TestBed.inject(PageTitleService);
  });

  it('should successfully instantiate the component from beforeEach block', () => {
    expect(component).toBeDefined();
  });

  it('should set component properties when ngOnInit() is called', () => {
    spyOn(translateService.onLangChange, 'subscribe');

    component.ngOnInit();

    expect(translateService.onLangChange.subscribe).toHaveBeenCalled();
  });

  it('should set page title on init', () => {
    spyOn(component, 'setPageTitle');

    component.ngAfterViewInit();

    expect(component.setPageTitle).toHaveBeenCalled();
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

    component.setPageTitle();

    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_ANDROID_PAGE_TITLE'
    );
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'I18N_ANDROID_PAGE_TITLE'
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

  it('should change feature selection', () => {
    component.ngOnInit();
    expect(component.featuresShown).toBe(0);

    component.changeFeaturesShown(3);

    expect(component.featuresShown).toBe(3);
  });

  it('should validate email address correctly', () => {
    component.emailAddress = 'invalidEmail';
    expect(component.validateEmailAddress()).toBeFalse();

    component.emailAddress = 'validEmail@example.com';
    expect(component.validateEmailAddress()).toBeTrue();
  });

  it('should add user to android mailing list and return status', fakeAsync(() => {
    spyOn(alertsService, 'addInfoMessage');
    component.ngOnInit();
    tick();
    component.emailAddress = 'validEmail@example.com';
    component.name = 'validName';
    spyOn(
      mailingListBackendApiService,
      'subscribeUserToMailingList'
    ).and.returnValue(Promise.resolve(true));
    component.userHasSubscribed = false;

    component.subscribeToAndroidList();

    flushMicrotasks();

    expect(component.userHasSubscribed).toBeTrue();
  }));

  it('should fail to add user to android mailing list and return status', fakeAsync(() => {
    spyOn(alertsService, 'addInfoMessage');
    component.ngOnInit();
    tick();
    component.emailAddress = 'validEmail@example.com';
    component.name = 'validName';
    spyOn(
      mailingListBackendApiService,
      'subscribeUserToMailingList'
    ).and.returnValue(Promise.resolve(false));

    component.subscribeToAndroidList();

    flushMicrotasks();

    expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
      'Sorry, an unexpected error occurred. Please email admin@oppia.org ' +
        'to be added to the mailing list.',
      10000
    );
  }));

  it('should reject request to the android mailing list correctly', fakeAsync(() => {
    spyOn(alertsService, 'addInfoMessage');
    component.ngOnInit();
    tick();
    component.emailAddress = 'validEmail@example.com';
    component.name = 'validName';
    spyOn(
      mailingListBackendApiService,
      'subscribeUserToMailingList'
    ).and.returnValue(Promise.reject(false));

    component.subscribeToAndroidList();

    flushMicrotasks();

    expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
      'Sorry, an unexpected error occurred. Please email admin@oppia.org ' +
        'to be added to the mailing list.',
      10000
    );
  }));
});
