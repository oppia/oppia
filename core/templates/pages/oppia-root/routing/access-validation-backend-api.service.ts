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
 * @fileoverview Backend Api Service for access validation.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface SplashPageValidatorResponse {
  valid: boolean;
  'default_dashboard': string;
}

interface ClassroomPageValidatorResponse {
  valid: boolean;
  'redirect_url': string;
}

@Injectable({
  providedIn: 'root'
})
export class AccessValidationBackendApiService {
  SPLASH_PAGE_ACCESS_VALIDATOR = '/acl_validator/can_access_splash_page';
  CLASSROOM_PAGE_ACCESS_VALIDATOR = '/acl_validator/can_access_classroom_page';

  constructor(private http: HttpClient) {}

  validateAccessToSplashPage(): Promise<SplashPageValidatorResponse> {
    return this.http.get<SplashPageValidatorResponse>(
      this.SPLASH_PAGE_ACCESS_VALIDATOR).toPromise();
  }

  validateAccessToClassroomPage(
      classroomUrlFragment: string
  ): Promise<ClassroomPageValidatorResponse> {
    return this.http.get<ClassroomPageValidatorResponse>(
      this.CLASSROOM_PAGE_ACCESS_VALIDATOR, {
        params: {
          classroom_url_fragment: classroomUrlFragment
        }
      }).toPromise();
  }
}
