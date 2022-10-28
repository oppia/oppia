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
 * @fileoverview Unit tests for the UserEmailPreferencesBackendApiService.
 */

import { UserEmailPreferencesBackendApiService } from './user-email-preferences-backend-api.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, TestBed, flushMicrotasks } from '@angular/core/testing';
import { EmailPreferencesData } from './user-email-preferences.service';
import { ExplorationDataService } from './exploration-data.service';

describe('User Email Preferences Backend Api Service', () => {
  const expId = '12345';
  let sampleResponse = {
    email_preferences: {
      mute_feedback_notifications: false,
      mute_suggestion_notifications: false
    }
  };

  class MockExplorationDataService {
    explorationId: string = expId;
  }

  let userEmailPreferencesBackendApiService:
  UserEmailPreferencesBackendApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: ExplorationDataService,
        useClass: MockExplorationDataService }]
    });
    userEmailPreferencesBackendApiService =
    TestBed.inject(UserEmailPreferencesBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully send http request and get a valid response',
    fakeAsync(() => {
      let result: Promise<EmailPreferencesData> =
      userEmailPreferencesBackendApiService
        .saveChangeToBackendAsync({
          message_type: 'feedback',
          mute: false
        });
      let req = httpTestingController.expectOne(
        '/createhandler/notificationpreferences/' + expId
      );
      expect(req.request.method).toEqual('PUT');
      req.flush(sampleResponse);
      flushMicrotasks();
      result.then((data: EmailPreferencesData) => {
        expect(data).toEqual(sampleResponse);
      });
    }));
});
