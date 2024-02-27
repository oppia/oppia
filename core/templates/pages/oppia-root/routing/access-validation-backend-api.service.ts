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

  LEARNER_GROUP_EDITOR_PAGE_ACCESS_VALIDATOR = (
    '/access_validation_handler/can_access_edit_learner_group_page/' +
    '<learner_group_id>'
  );

  LEARNER_GROUP_CREATOR_PAGE_ACCESS_VALIDATOR = (
    '/access_validation_handler/can_access_create_learner_group_page'
  );

  DOES_LEARNER_GROUP_EXIST = (
    '/access_validation_handler/does_learner_group_exist/<learner_group_id>');

  BLOG_HOME_PAGE_ACCESS_VALIDATOR = (
    '/access_validation_handler/can_access_blog_home_page');

  BLOG_POST_PAGE_ACCESS_VALIDATOR = (
    '/access_validation_handler/can_access_blog_post_page');

  BLOG_AUTHOR_PROFILE_PAGE_ACCESS_VALIDATOR = (
    '/access_validation_handler/can_access_blog_author_profile_page/<author_username>'); // eslint-disable-line max-len

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

  validateAccessToBlogHomePage(): Promise<void> {
    return this.http.get<void>(
      this.BLOG_HOME_PAGE_ACCESS_VALIDATOR).toPromise();
  }

  validateAccessToBlogPostPage(
      blogPostPageUrlFragment: string
  ): Promise<void> {
    return this.http.get<void>(this.BLOG_POST_PAGE_ACCESS_VALIDATOR, {
      params: {
        blog_post_url_fragment: blogPostPageUrlFragment
      }
    }).toPromise();
  }

  validateAccessToBlogAuthorProfilePage(
      authorUsername: string
  ): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.BLOG_AUTHOR_PROFILE_PAGE_ACCESS_VALIDATOR, {
        author_username: authorUsername
      });
    return this.http.get<void>(url).toPromise();
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

  validateAccessToLearnerGroupEditorPage(
      learnerGroupId: string): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.LEARNER_GROUP_EDITOR_PAGE_ACCESS_VALIDATOR, {
        learner_group_id: learnerGroupId
      });

    return this.http.get<void>(url).toPromise();
  }

  validateAccessToLearnerGroupCreatorPage(): Promise<void> {
    return this.http.get<void>(
      this.LEARNER_GROUP_CREATOR_PAGE_ACCESS_VALIDATOR).toPromise();
  }

  doesLearnerGroupExist(learnerGroupId: string): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.DOES_LEARNER_GROUP_EXIST, {
        learner_group_id: learnerGroupId
      });

    return this.http.get<void>(url).toPromise();
  }
}
