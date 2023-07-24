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
import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AppConstants } from 'app.constants';
import { PlatformFeatureService } from 'services/platform-feature.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { MailingListBackendApiService } from 'domain/mailing-list/mailing-list-backend-api.service';
import { AlertsService } from 'services/alerts.service';
import { OppiaFooterComponent } from './oppia-footer.component';

class MockPlatformFeatureService {
  status = {
    BlogPages: {
      isEnabled: false
    }
  };
}

class MockRouter {
  url = '/about';
}

describe('OppiaFooterComponent', () => {
  let component: OppiaFooterComponent;
  let fixture: ComponentFixture<OppiaFooterComponent>;
  let mockPlatformFeatureService = new MockPlatformFeatureService();
  let mailingListBackendApiService: MailingListBackendApiService;
  let alertsService: AlertsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        OppiaFooterComponent,
        MockTranslatePipe
      ],
      providers: [
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService
        }, {
          provide: Router,
          useClass: MockRouter,
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OppiaFooterComponent);
    component = fixture.componentInstance;
  });

  it('should get the siteFeedbackFormURL', () => {
    expect(component.siteFeedbackFormUrl)
      .toBe(AppConstants.SITE_FEEDBACK_FORM_URL);
  });

  it('should get the pages registered with frontend', () => {
    expect(component.PAGES_REGISTERED_WITH_FRONTEND)
      .toBe(AppConstants.PAGES_REGISTERED_WITH_FRONTEND);
  });

  it('should return correct blog url if the blog homepage feature is enabled',
    () => {
      mockPlatformFeatureService.status.BlogPages.isEnabled = true;

      expect(component.getOppiaBlogUrl()).toEqual('/blog');
    });

  it('should return correct blog url if the blog homepage feature is disabled',
    () => {
      mockPlatformFeatureService.status.BlogPages.isEnabled = false;

      expect(component.getOppiaBlogUrl()).toEqual(
        'https://medium.com/oppia-org');
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
});
