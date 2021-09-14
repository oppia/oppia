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
 * @fileoverview Backend api service for fetching the data signup page.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface SignupPageBackendDict {
  'can_send_emails': boolean;
  'has_agreed_to_latest_terms': boolean;
  'has_ever_registered': boolean;
  'username': string;
}

export interface UsernameAvailabilityResponse {
  'username_is_taken': boolean;
}

export interface UpdateUsernameResponseAsync {
  'bulk_email_signup_message_should_be_shown': boolean;
}

export interface UpdateUsernameRequestParams {
  'agreed_to_terms': boolean;
  'can_receive_email_updates': boolean;
  'default_dashboard': string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class SignupPageBackendApiService {
  SIGNUP_DATA_URL = '/signuphandler/data';
  USERNAME_HANDLER = '/usernamehandler/data';

  constructor(private http: HttpClient) {}

  async fetchSignupPageDataAsync(): Promise<SignupPageBackendDict> {
    return this.http.get<SignupPageBackendDict>(
      this.SIGNUP_DATA_URL).toPromise();
  }

  async checkUsernameAvailableAsync(
      username: string
  ): Promise<UsernameAvailabilityResponse> {
    return this.http.post<UsernameAvailabilityResponse>(
      this.USERNAME_HANDLER, {
        username: username
      }).toPromise();
  }

  async updateUsernameAsync(
      requestParams: UpdateUsernameRequestParams
  ): Promise<UpdateUsernameResponseAsync> {
    return this.http.post<UpdateUsernameResponseAsync>(
      this.SIGNUP_DATA_URL, requestParams).toPromise();
  }
}
