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
 * @fileoverview Unit tests for donate page.
 */

import { TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { DonatePageComponent } from './donate-page.component';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { MailingListBackendApiService } from 'domain/mailing-list/mailing-list-backend-api.service';
import { AlertsService } from 'services/alerts.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

class MockWindowRef {
  _window = {
    location: {
      _href: '',
      search: '',
      get href() {
        return this._href;
      },
      set href(val) {
        this._href = val;
      },
      replace: (val: string) => {}
    },
    gtag: () => {},
    onhashchange: () => {}
  };

  get nativeWindow() {
    return this._window;
  }
}

describe('Donate page', () => {
  const siteAnalyticsServiceStub = new SiteAnalyticsService(
    new WindowRef());
  let windowRef: MockWindowRef;
  let mailingListBackendApiService: MailingListBackendApiService;
  let alertsService: AlertsService;
  let ngbModal: NgbModal;

  beforeEach(async() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        HttpClientTestingModule
      ],
      declarations: [
        DonatePageComponent,
        MockTranslatePipe
      ],
      providers: [
        {provide: SiteAnalyticsService, useValue: siteAnalyticsServiceStub},
        UrlInterpolationService,
        {
          provide: WindowDimensionsService,
          useValue: {
            isWindowNarrow: () => true
          }
        },
        { provide: WindowRef, useValue: windowRef },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  });

  let component: DonatePageComponent;

  beforeEach(() => {
    const donatePageComponent = TestBed.createComponent(DonatePageComponent);
    component = donatePageComponent.componentInstance;
    alertsService = TestBed.inject(AlertsService);
    mailingListBackendApiService = TestBed.inject(
      MailingListBackendApiService);
    ngbModal = TestBed.inject(NgbModal);
    spyOn(ngbModal, 'open');
  });

  it('should set component properties when ngOnInit() is called', () => {
    component.ngOnInit();

    expect(component.windowIsNarrow).toBe(true);
    expect(component.donateImgUrl).toBe(
      '/assets/images/general/opp_donate_text.svg');
  });

  it('should validate email address correctly', () => {
    component.emailAddress = 'invalidEmail';
    expect(component.validateEmailAddress()).toBeFalse();

    component.emailAddress = 'validEmail@example.com';
    expect(component.validateEmailAddress()).toBeTrue();
  });

  it('should add user to mailing list and return status',
    fakeAsync(() => {
      spyOn(alertsService, 'addInfoMessage');
      component.ngOnInit();
      tick();
      component.emailAddress = 'validEmail@example.com';
      component.name = 'validName';
      spyOn(mailingListBackendApiService, 'subscribeUserToMailingList')
        .and.returnValue(Promise.resolve(true));

      component.subscribeToMailingList();

      flushMicrotasks();

      expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
        'Done!', 1000);
    }));

  it('should fail to add user to mailing list and return status',
    fakeAsync(() => {
      spyOn(alertsService, 'addInfoMessage');
      component.ngOnInit();
      tick();
      component.emailAddress = 'validEmail@example.com';
      component.name = 'validName';
      spyOn(mailingListBackendApiService, 'subscribeUserToMailingList')
        .and.returnValue(Promise.resolve(false));

      component.subscribeToMailingList();

      flushMicrotasks();

      expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
        'Sorry, an unexpected error occurred. Please email admin@oppia.org ' +
        'to be added to the mailing list.', 10000);
    }));

  it('should reject request to the mailing list correctly',
    fakeAsync(() => {
      spyOn(alertsService, 'addInfoMessage');
      component.ngOnInit();
      tick();
      component.emailAddress = 'validEmail@example.com';
      component.name = 'validName';
      spyOn(mailingListBackendApiService, 'subscribeUserToMailingList')
        .and.returnValue(Promise.reject(false));

      component.subscribeToMailingList();

      flushMicrotasks();

      expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
        'Sorry, an unexpected error occurred. Please email admin@oppia.org ' +
        'to be added to the mailing list.', 10000);
    }));

  it('should get image set', () => {
    spyOn(component, 'getStaticImageUrl');

    component.getImageSet('abc', 'png');

    expect(component.getStaticImageUrl).toHaveBeenCalled();
  });

  it('should show thank you modal on query parameters change', () => {
    windowRef.nativeWindow.location.search = '';
    component.ngOnInit();
    expect(ngbModal.open).not.toHaveBeenCalled();

    windowRef.nativeWindow.location.search = '?random';
    component.ngOnInit();
    expect(ngbModal.open).not.toHaveBeenCalled();

    windowRef.nativeWindow.location.search = '?thanks';
    component.ngOnInit();
    expect(ngbModal.open).toHaveBeenCalled();
  });
});
