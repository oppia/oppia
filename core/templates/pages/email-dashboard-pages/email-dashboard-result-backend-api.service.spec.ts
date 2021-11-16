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
 * @fileoverview Tests that the email dashboard result backend api service.
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed, waitForAsync } from '@angular/core/testing';
import { EmailDashboardBackendApiService } from 'domain/email-dashboard/email-dashboard-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { EmailDashboardResultBackendApiService } from './email-dashboard-result-backend-api.service';
import { EmailData } from './email-dashboard-result.component';

describe('Email dashboard result backend api service', () => {
  let edrbas: EmailDashboardResultBackendApiService;
  let httpTestingController: HttpTestingController;
  let successSpy: jasmine.Spy;
  let failSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        EmailDashboardBackendApiService,
        UrlInterpolationService
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    edrbas = TestBed.inject(EmailDashboardResultBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
    successSpy = jasmine.createSpy('success');
    failSpy = jasmine.createSpy('fail');
  });

  it('should submit email', fakeAsync(() => {
    let emailData: EmailData = {
      email_subject: '',
      email_body: '',
      email_intent: '',
      max_recipients: 0
    };
    edrbas.submitEmailAsync(emailData, '').then(successSpy, failSpy);

    const req = httpTestingController.expectOne('/emaildashboardresult/');
    expect(req.request.method).toEqual('POST');
    req.flush({});

    flushMicrotasks();
    expect(successSpy).toHaveBeenCalled();
    expect(failSpy).not.toHaveBeenCalled();
  }));

  it('should cancel email', fakeAsync(() => {
    edrbas.cancelEmailAsync('').then(successSpy, failSpy);

    const req = httpTestingController.expectOne('/emaildashboardcancelresult/');
    expect(req.request.method).toEqual('POST');
    req.flush({});

    flushMicrotasks();
    expect(successSpy).toHaveBeenCalled();
    expect(failSpy).not.toHaveBeenCalled();
  }));

  it('should send test email', fakeAsync(() => {
    edrbas.sendTestEmailAsync('', '', '').then(successSpy, failSpy);

    const req = httpTestingController.expectOne(
      '/emaildashboardtestbulkemailhandler/');
    expect(req.request.method).toEqual('POST');
    req.flush({});

    flushMicrotasks();
    expect(successSpy).toHaveBeenCalled();
    expect(failSpy).not.toHaveBeenCalled();
  }));
});
