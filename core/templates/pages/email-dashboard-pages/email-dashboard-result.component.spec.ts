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
 * @fileoverview Unit tests for emailDashboardResultPage.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { WindowRef } from 'services/contextual/window-ref.service';
import { EmailDashboardResultBackendApiService } from './email-dashboard-result-backend-api.service';
import { EmailDashboardResultComponent } from './email-dashboard-result.component';

describe('Email Dashboard Result Component', () => {
  let fixture: ComponentFixture<EmailDashboardResultComponent>;
  let componentInstance: EmailDashboardResultComponent;
  let emailDashboardResultBackendApiService:
  EmailDashboardResultBackendApiService;

  class MockWindowRef {
    nativeWindow = {
      location: {
        pathname: ''
      }
    };
  }

  let windowRef = new MockWindowRef();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        EmailDashboardResultComponent
      ],
      providers: [
        EmailDashboardResultBackendApiService,
        {
          provide: WindowRef,
          useValue: windowRef
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmailDashboardResultComponent);
    componentInstance = fixture.componentInstance;
    emailDashboardResultBackendApiService = TestBed.inject(
      EmailDashboardResultBackendApiService);
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should get query id', () => {
    let queryId = 'query_id';
    windowRef.nativeWindow.location.pathname = '/' + queryId;
    fixture.detectChanges();
    expect(componentInstance.getQueryId()).toEqual(queryId);
  });

  it('should validate email subject and body', () => {
    componentInstance.emailSubject = '';
    componentInstance.emailBody = '';
    expect(componentInstance.validateEmailSubjectAndBody()).toBeFalse();
  });

  it('should submit email', fakeAsync(() => {
    spyOn(componentInstance, 'validateEmailSubjectAndBody').and.returnValue(
      true);
    componentInstance.emailOption = 'not_custom';
    spyOn(emailDashboardResultBackendApiService, 'submitEmailAsync')
      .and.returnValue(Promise.resolve({}));
    componentInstance.submitEmail();
    tick();
    tick(4500);
    expect(emailDashboardResultBackendApiService.submitEmailAsync)
      .toHaveBeenCalled();
    expect(componentInstance.invalid.subject).toBeFalse();
    expect(componentInstance.invalid.body).toBeFalse();
    expect(componentInstance.invalid.maxRecipients).toBeFalse();
  }));

  it('should not submit email when max recipents are null', () => {
    componentInstance.emailOption = 'custom';
    componentInstance.maxRecipients = 0;
    spyOn(componentInstance, 'validateEmailSubjectAndBody').and.returnValue(
      true);
    componentInstance.submitEmail();
    expect(componentInstance.invalid.maxRecipients).toBeTrue();
  });

  it('should acknowledge error when request fails while submitting email',
    fakeAsync(() => {
      spyOn(componentInstance, 'validateEmailSubjectAndBody').and.returnValue(
        true);
      componentInstance.emailOption = 'not_custom';
      spyOn(emailDashboardResultBackendApiService, 'submitEmailAsync')
        .and.returnValue(Promise.reject({}));
      componentInstance.submitEmail();
      tick();
      expect(componentInstance.errorHasOccurred).toBeTrue();
      expect(componentInstance.submitIsInProgress).toBeFalse();
    }));

  it('should reset form', () => {
    componentInstance.resetForm();
    expect(componentInstance.emailSubject).toEqual('');
    expect(componentInstance.emailBody).toEqual('');
    expect(componentInstance.emailOption).toEqual('all');
  });

  it('should cancel email', fakeAsync(() => {
    spyOn(emailDashboardResultBackendApiService, 'cancelEmailAsync')
      .and.returnValue(Promise.resolve({}));
    componentInstance.cancelEmail();
    tick();
    tick(4500);
    expect(componentInstance.emailCancelled).toBeTrue();
  }));

  it('should handler error when http call to cancel email fails',
    fakeAsync(() => {
      spyOn(emailDashboardResultBackendApiService, 'cancelEmailAsync')
        .and.returnValue(Promise.reject({}));
      componentInstance.cancelEmail();
      tick();
      expect(componentInstance.errorHasOccurred).toBeTrue();
      expect(componentInstance.submitIsInProgress).toBeFalse();
    }));

  it('should send test email', fakeAsync(() => {
    spyOn(componentInstance, 'validateEmailSubjectAndBody').and.returnValue(
      true);
    spyOn(emailDashboardResultBackendApiService, 'sendTestEmailAsync')
      .and.returnValue(Promise.resolve({}));
    componentInstance.sendTestEmail();
    tick();
    expect(componentInstance.testEmailSentSuccesfully).toBeTrue();
    expect(componentInstance.invalid.subject).toBeFalse();
    expect(componentInstance.invalid.body).toBeFalse();
    expect(componentInstance.invalid.maxRecipients).toBeFalse();
  }));
});
