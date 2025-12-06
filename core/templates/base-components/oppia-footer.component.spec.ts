// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for the Oppia Footer Component.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  waitForAsync,
  fakeAsync,
  tick,
  flushMicrotasks,
} from '@angular/core/testing';
import { Router } from '@angular/router';

import { AppConstants } from 'app.constants';
import { NavbarAndFooterGATrackingPages } from 'app.constants';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { MailingListBackendApiService } from 'domain/mailing-list/mailing-list-backend-api.service';
import { AlertsService } from 'services/alerts.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { OppiaFooterComponent } from './oppia-footer.component';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ThanksForSubscribingModalComponent } from './thanks-for-subscribing-modal.component';
import { FormsModule } from '@angular/forms';

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: '/learn/math',
      href: '',
    },
    gtag: () => { },
  };
}

class MockRouter {
  url = '/about';
}

class MockNgbModal {
  open = jasmine.createSpy('open').and.returnValue({ componentInstance: {} });
}

describe('OppiaFooterComponent', () => {
  let component: OppiaFooterComponent;
  let fixture: ComponentFixture<OppiaFooterComponent>;
  let mailingListBackendApiService: MailingListBackendApiService;
  let alertsService: AlertsService;
  let siteAnalyticsService: SiteAnalyticsService;
  let mockWindowRef: MockWindowRef;
  let ngbModal: MockNgbModal;

  beforeEach(waitForAsync(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule],
      declarations: [OppiaFooterComponent, MockTranslatePipe],
      providers: [
        {
          provide: Router,
          useClass: MockRouter,
        },
        {
          provide: WindowRef,
          useValue: mockWindowRef,
        },
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OppiaFooterComponent);
    alertsService = TestBed.inject(AlertsService);
    mailingListBackendApiService = TestBed.inject(MailingListBackendApiService);
    component = fixture.componentInstance;
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    ngbModal = TestBed.inject(NgbModal);
  });

  it('should get the siteFeedbackFormURL', () => {
    expect(component.siteFeedbackFormUrl).toBe(
      AppConstants.SITE_FEEDBACK_FORM_URL
    );
  });

  it('should get the pages registered with frontend', () => {
    expect(component.PAGES_REGISTERED_WITH_FRONTEND).toBe(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND
    );
  });

  it('should return correct blog url if the blog homepage feature is enabled', () => {
    expect(component.getOppiaBlogUrl()).toEqual('/blog');
  });

  it('should validate email address correctly', () => {
    component.emailAddress = 'invalidEmail';
    expect(component.validateEmailAddress()).toBeFalsy();

    component.emailAddress = 'validEmail@example.com';
    expect(component.validateEmailAddress()).toBe(true);
  });

  it('should return false when email address is null', () => {
    component.emailAddress = null;
    expect(component.validateEmailAddress()).toBeFalsy();
  });

  it('should return true if not processing subscription and email address is invalid', () => {
    component.subscriptionProcessing = false;
    component.emailAddress = 'invalidEmail';
    expect(component.disableNewsletterSubscription()).toBe(true);

    component.emailAddress = 'validEmail@example.com';
    expect(component.disableNewsletterSubscription()).toBeFalsy();
  });

  it('should return true if processing subscription regardless of email address validity', () => {
    component.subscriptionProcessing = true;
    component.emailAddress = 'invalidEmail';
    expect(component.disableNewsletterSubscription()).toBe(true);

    component.emailAddress = 'validEmail@example.com';
    expect(component.disableNewsletterSubscription()).toBe(true);
  });

  it('should return whether the email address is present or not in the set of subscribed emails', () => {
    expect(component.isAlreadySubscribed('validEmail@example.com')).toBeFalsy();

    component.emailsSubscribed.add('validEmail@example.com');
    expect(component.isAlreadySubscribed('validEmail@example.com')).toBe(true);
  });

  it('should clear newsletter warning when email address input changes', fakeAsync(() => {
    component.emailAddress = 'validEmail@example.com';
    component.name = 'validName';
    component.emailsSubscribed.add(component.emailAddress);
    fixture.detectChanges();

    expect(component.subscriptionProcessing).toBeFalsy();
    expect(component.emailDuplicated).toBeFalsy();

    component.subscribeToMailingList();

    expect(component.subscriptionProcessing).toBe(true);
    expect(component.emailDuplicated).toBe(true);

    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    input.value = 'anotherEmail@example.com';
    input.dispatchEvent(new Event('input'));
    tick();
    fixture.detectChanges();

    expect(component.emailDuplicated).toBeFalsy();
  }));

  it('should not subscribe when email is invalid', () => {
    component.emailAddress = 'invalidEmail';
    spyOn(mailingListBackendApiService, 'subscribeUserToMailingList');

    component.subscribeToMailingList();

    expect(component.newsletterTouched).toBe(true);
    expect(
      mailingListBackendApiService.subscribeUserToMailingList
    ).not.toHaveBeenCalled();
  });

  it('should subscribe with null name when name is not provided', fakeAsync(() => {
    component.emailAddress = 'valid@example.com';
    component.name = null;
    spyOn(alertsService, 'addInfoMessage');
    spyOn(
      mailingListBackendApiService,
      'subscribeUserToMailingList'
    ).and.returnValue(Promise.resolve(true));

    component.subscribeToMailingList();

    expect(component.subscriptionProcessing).toBe(true);

    flushMicrotasks();

    expect(
      mailingListBackendApiService.subscribeUserToMailingList
    ).toHaveBeenCalledWith(
      'valid@example.com',
      null,
      AppConstants.MAILING_LIST_WEB_TAG
    );
    expect(component.subscriptionProcessing).toBeFalsy();
  }));

  it('should add user to mailing list and return status', fakeAsync(() => {
    spyOn(alertsService, 'addInfoMessage');
    tick();
    component.emailAddress = 'validEmail@example.com';
    component.name = 'validName';
    spyOn(
      mailingListBackendApiService,
      'subscribeUserToMailingList'
    ).and.returnValue(Promise.resolve(true));

    expect(component.subscriptionProcessing).toBeFalsy();
    expect(component.emailDuplicated).toBeFalsy();

    component.subscribeToMailingList();

    expect(component.subscriptionProcessing).toBe(true);

    flushMicrotasks();

    expect(alertsService.addInfoMessage).toHaveBeenCalledWith('Done!', 1000);
    expect(ngbModal.open).toHaveBeenCalledWith(
      ThanksForSubscribingModalComponent,
      { backdrop: 'static', size: 'xl' }
    );
    expect(component.subscriptionProcessing).toBeFalsy();
    expect(component.isAlreadySubscribed(component.emailAddress)).toBe(true);
    expect(component.emailDuplicated).toBeFalsy();
  }));

  it('should fail to add user to mailing list and return status', fakeAsync(() => {
    spyOn(alertsService, 'addInfoMessage');
    tick();
    component.emailAddress = 'validEmail@example.com';
    component.name = 'validName';
    spyOn(
      mailingListBackendApiService,
      'subscribeUserToMailingList'
    ).and.returnValue(Promise.resolve(false));

    expect(component.subscriptionProcessing).toBeFalsy();
    expect(component.emailDuplicated).toBeFalsy();

    component.subscribeToMailingList();

    expect(component.subscriptionProcessing).toBe(true);

    flushMicrotasks();

    expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
      AppConstants.MAILING_LIST_UNEXPECTED_ERROR_MESSAGE,
      10000
    );
    expect(component.subscriptionProcessing).toBeFalsy();
    expect(component.isAlreadySubscribed(component.emailAddress)).toBe(true);
    expect(component.emailDuplicated).toBeFalsy();
  }));

  it('should reject request to the mailing list correctly', fakeAsync(() => {
    spyOn(alertsService, 'addInfoMessage');
    tick();
    component.emailAddress = 'validEmail@example.com';
    component.name = 'validName';
    spyOn(
      mailingListBackendApiService,
      'subscribeUserToMailingList'
    ).and.returnValue(Promise.reject(false));

    expect(component.subscriptionProcessing).toBeFalsy();
    expect(component.emailDuplicated).toBeFalsy();

    component.subscribeToMailingList();

    expect(component.subscriptionProcessing).toBe(true);

    flushMicrotasks();

    expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
      AppConstants.MAILING_LIST_UNEXPECTED_ERROR_MESSAGE,
      10000
    );
    expect(component.subscriptionProcessing).toBeFalsy();
    expect(component.isAlreadySubscribed(component.emailAddress)).toBe(true);
    expect(component.emailDuplicated).toBeFalsy();
  }));

  it('should show newsletter warning if user tries to subscribe to newsletter with already used email address', fakeAsync(() => {
    component.emailAddress = 'validEmail@example.com';
    component.name = 'validName';
    spyOn(
      mailingListBackendApiService,
      'subscribeUserToMailingList'
    ).and.returnValue(Promise.resolve(true));

    expect(component.subscriptionProcessing).toBeFalsy();
    expect(component.emailDuplicated).toBeFalsy();

    component.subscribeToMailingList();

    expect(component.subscriptionProcessing).toBe(true);

    flushMicrotasks();

    expect(component.subscriptionProcessing).toBeFalsy();
    expect(component.isAlreadySubscribed(component.emailAddress)).toBe(true);
    expect(component.emailDuplicated).toBeFalsy();

    component.subscribeToMailingList();

    expect(component.subscriptionProcessing).toBeFalsy();
    expect(component.emailDuplicated).toBe(true);
  }));

  it('should register About footer link click event', () => {
    spyOn(siteAnalyticsService, 'registerClickFooterButtonEvent');
    expect(mockWindowRef.nativeWindow.location.href).toBe('');

    component.navigateToAboutPage();

    expect(
      siteAnalyticsService.registerClickFooterButtonEvent
    ).toHaveBeenCalledWith(NavbarAndFooterGATrackingPages.ABOUT);

    expect(mockWindowRef.nativeWindow.location.href).toBe('/about');
  });

  it('should register Teach footer link click event', () => {
    spyOn(siteAnalyticsService, 'registerClickFooterButtonEvent');
    expect(mockWindowRef.nativeWindow.location.href).toBe('');

    component.navigateToTeachPage();

    expect(
      siteAnalyticsService.registerClickFooterButtonEvent
    ).toHaveBeenCalledWith(NavbarAndFooterGATrackingPages.TEACH);

    expect(mockWindowRef.nativeWindow.location.href).toBe('/teach');
  });
});