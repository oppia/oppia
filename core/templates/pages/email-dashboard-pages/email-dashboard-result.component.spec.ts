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

import { WindowRef } from 'services/contextual/window-ref.service';

require('pages/email-dashboard-pages/email-dashboard-result.component.ts');

describe('Email Dashboard Result Page', function() {
  var ctrl = null;
  var $httpBackend = null;
  var CsrfService = null;
  var $timeout = null;
  var windowRef = new WindowRef();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('WindowRef', windowRef);
  }));
  beforeEach(angular.mock.inject(function($injector, $q, $componentController) {
    $httpBackend = $injector.get('$httpBackend');
    $timeout = $injector.get('$timeout');
    CsrfService = $injector.get('CsrfTokenService');

    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve('sample-csrf-token');
      return deferred.promise;
    });

    ctrl = $componentController('emailDashboardResultPage');

    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        href: '',
        pathname: '/0'
      }
    });
  }));

  it('should initialize correctly ctrl properties after controller' +
    ' initialization', function() {
    ctrl.$onInit();

    expect(ctrl.emailOption).toBe('all');
    expect(ctrl.emailSubject).toBe('');
    expect(ctrl.emailBody).toBe('');
    expect(ctrl.invalid).toEqual({
      subject: false,
      body: false,
      maxRecipients: false
    });
    expect(ctrl.maxRecipients).toBe(null);
    expect(ctrl.POSSIBLE_EMAIL_INTENTS).toEqual([
      'bulk_email_marketing', 'bulk_email_improve_exploration',
      'bulk_email_create_exploration',
      'bulk_email_creator_reengagement',
      'bulk_email_learner_reengagement']);
    expect(ctrl.emailIntent).toBe('bulk_email_marketing');
    expect(ctrl.emailSubmitted).toBe(false);
    expect(ctrl.submitIsInProgress).toBe(false);
    expect(ctrl.errorHasOccurred).toBe(false);
    expect(ctrl.testEmailSentSuccesfully).toBe(false);
  });

  it('should submit an email when fields are populated with valid values.',
    function() {
      ctrl.$onInit();
      ctrl.emailSubject = 'Subject';
      ctrl.emailBody = 'Body';
      ctrl.emailOption = 'custom';
      ctrl.maxRecipients = 10;

      $httpBackend.expect('POST', '/emaildashboardresult/0').respond(200);
      ctrl.submitEmail();

      expect(ctrl.submitIsInProgress).toBe(true);
      expect(ctrl.emailSubmitted).toBe(false);

      $httpBackend.flush();

      expect(ctrl.emailSubmitted).toBe(true);
      $timeout.flush(4000);

      expect(windowRef.nativeWindow.location.href).toBe('/emaildashboard');
      expect(ctrl.invalid.subject).toBe(false);
      expect(ctrl.invalid.body).toBe(false);
      expect(ctrl.invalid.maxRecipients).toBe(false);
    });

  it('should use reject handler when submit email fails', function() {
    ctrl.$onInit();
    ctrl.emailSubject = 'Subject';
    ctrl.emailBody = 'Body';

    $httpBackend.expectPOST('/emaildashboardresult/0').respond(500);
    ctrl.submitEmail();

    expect(ctrl.submitIsInProgress).toBe(true);

    $httpBackend.flush();

    expect(ctrl.submitIsInProgress).toBe(false);
    expect(ctrl.errorHasOccurred).toBe(true);
    expect(windowRef.nativeWindow.location.href).toBe('');
    expect(ctrl.invalid.subject).toBe(false);
    expect(ctrl.invalid.body).toBe(false);
    expect(ctrl.invalid.maxRecipients).toBe(false);
  });

  it('should not submit email when subject email and body email are empty',
    function() {
      ctrl.$onInit();
      ctrl.emailSubject = '';
      ctrl.emailBody = '';
      ctrl.submitEmail();

      expect(ctrl.invalid.subject).toBe(true);
      expect(ctrl.invalid.body).toBe(true);
      expect(ctrl.invalid.maxRecipients).toBe(false);
    });

  it('should not submit email when email option is custom and there is' +
    ' no recipient', function() {
    ctrl.$onInit();
    ctrl.emailSubject = 'Subject';
    ctrl.emailBody = 'Body';
    ctrl.emailOption = 'custom';
    ctrl.maxRecipients = null;
    ctrl.submitEmail();

    expect(ctrl.invalid.subject).toBe(false);
    expect(ctrl.invalid.body).toBe(false);
    expect(ctrl.invalid.maxRecipients).toBe(true);
  });

  it('should clear form when resetting form', function() {
    ctrl.emailSubject = 'Subject';
    ctrl.emailBody = 'Body';
    ctrl.emailOption = 'custom';

    ctrl.resetForm();

    expect(ctrl.emailSubject).toBe('');
    expect(ctrl.emailBody).toBe('');
    expect(ctrl.emailOption).toBe('all');
  });

  it('should discard email when canceling email', function() {
    ctrl.$onInit();

    $httpBackend.expectPOST('/emaildashboardcancelresult/0').respond(200);
    ctrl.cancelEmail();
    $httpBackend.flush();

    expect(ctrl.emailCancelled).toBe(true);
    $timeout.flush(4000);

    expect(windowRef.nativeWindow.location.href).toBe('/emaildashboard');
  });

  it('should use reject handler when canceling email fails', function() {
    ctrl.$onInit();

    $httpBackend.expectPOST('/emaildashboardcancelresult/0').respond(
      500);
    ctrl.cancelEmail();
    $httpBackend.flush();

    expect(ctrl.submitIsInProgress).toBe(false);
    expect(ctrl.errorHasOccurred).toBe(true);
    expect(windowRef.nativeWindow.location.href).toBe('');
  });

  it('should send test email to backend when testing submissions', function() {
    ctrl.$onInit();
    ctrl.emailSubject = 'Subject';
    ctrl.emailBody = 'Body';

    $httpBackend.expectPOST('/emaildashboardtestbulkemailhandler/0').respond(
      200);
    ctrl.sendTestEmail();
    $httpBackend.flush();

    expect(ctrl.testEmailSentSuccesfully).toBe(true);
    expect(ctrl.invalid.subject).toBe(false);
    expect(ctrl.invalid.body).toBe(false);
    expect(ctrl.invalid.maxRecipients).toBe(false);
  });

  it('should not send test email when response is rejected', function() {
    ctrl.$onInit();
    ctrl.emailSubject = 'Subject';
    ctrl.emailBody = 'Body';

    $httpBackend.expectPOST('/emaildashboardtestbulkemailhandler/0').respond(
      500);
    ctrl.sendTestEmail();
    $httpBackend.flush();

    expect(ctrl.testEmailSentSuccesfully).toBe(false);
    expect(ctrl.invalid.subject).toBe(false);
    expect(ctrl.invalid.body).toBe(false);
    expect(ctrl.invalid.maxRecipients).toBe(false);
  });
});
