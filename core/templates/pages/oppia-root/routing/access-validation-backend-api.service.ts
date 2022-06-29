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

@Injectable({
  providedIn: 'root'
})
export class AccessValidationBackendApiService {
  CLASSROOM_PAGE_ACCESS_VALIDATOR = (
    '/access_validation_handler/can_access_classroom_page');

  CAN_MANAGE_OWN_ACCOUNT_VALIDATOR = (
    '/access_validation_handler/can_manage_own_account');

  DOES_PROFILE_EXIST = (
    '/access_validation_handler/does_profile_exist/<username>');

  RELEASE_COORDINATOR_PAGE_ACCESS_VALIDATOR = (
    '/access_validation_handler/can_access_release_coordinator_page');

  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  validateAccessToClassroomPage(
      classroomUrlFragment: string
  ): Promise<void> {
    return this.http.get<void>(this.CLASSROOM_PAGE_ACCESS_VALIDATOR, {
      params: {
        classroom_url_fragment: classroomUrlFragment
      }
    }).toPromise();
  }

  validateCanManageOwnAccount(): Promise<void> {
    return this.http.get<void>(
      this.CAN_MANAGE_OWN_ACCOUNT_VALIDATOR).toPromise();
  }

  doesProfileExist(username: string): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.DOES_PROFILE_EXIST, {
        username: username
      });

    return this.http.get<void>(url).toPromise();
  }

  validateAccessToReleaseCoordinatorPage():
  Promise<void> {
    return this.http.get<void>(
      this.RELEASE_COORDINATOR_PAGE_ACCESS_VALIDATOR).toPromise();
  }
}
