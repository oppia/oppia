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
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { boolean } from 'mathjs';

export interface SplashPageValidatorResponse {
  valid: boolean;
  'default_dashboard': string;
}

interface ClassroomPageValidatorResponse {
  valid: boolean;
  'redirect_url': string;
}

interface ValidatorResponse {
  valid: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AccessValidationBackendApiService {
  SPLASH_PAGE_ACCESS_VALIDATOR = '/acl_validator/can_access_splash_page';
  CLASSROOM_PAGE_ACCESS_VALIDATOR = '/acl_validator/can_access_classroom_page';
  CAN_MANAGE_OWN_ACCOUNT_VALIDATOR = '/acl_validator/can_manage_own_account';
  DOES_PROFILE_EXIST = '/acl_validator/does_profile_exist/<username>';

  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

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

  validateCanManageOwnAccount(): Promise<ValidatorResponse> {
    return this.http.get<ValidatorResponse>(
      this.CAN_MANAGE_OWN_ACCOUNT_VALIDATOR).toPromise();
  }

  doesProfileExist(username: string): Promise<ValidatorResponse> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.DOES_PROFILE_EXIST, {
        username: username
      });

    return this.http.get<ValidatorResponse>(url).toPromise();
  }
}
