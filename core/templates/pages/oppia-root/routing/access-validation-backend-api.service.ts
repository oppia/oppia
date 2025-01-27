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

import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

@Injectable({
  providedIn: 'root',
})
export class AccessValidationBackendApiService {
  STORY_EDITOR_PAGE_ACCESS_VALIDATOR =
    '/access_validation_handler/can_access_story_editor_page/<story_id>';

  SUBTOPIC_VIEWER_PAGE_ACCESS_VALIDATOR =
    '/access_validation_handler/can_access_subtopic_viewer_page/<classroom_url_fragment>/<topic_url_fragment>/revision/<subtopic_url_fragment>';

  CLASSROOM_PAGE_ACCESS_VALIDATOR =
    '/access_validation_handler/can_access_classroom_page';

  CAN_MANAGE_OWN_ACCOUNT_VALIDATOR =
    '/access_validation_handler/can_manage_own_account';

  DOES_PROFILE_EXIST =
    '/access_validation_handler/does_profile_exist/<username>';

  RELEASE_COORDINATOR_PAGE_ACCESS_VALIDATOR =
    '/access_validation_handler/can_access_release_coordinator_page';

  LEARNER_GROUP_EDITOR_PAGE_ACCESS_VALIDATOR =
    '/access_validation_handler/can_access_edit_learner_group_page/' +
    '<learner_group_id>';

  LEARNER_GROUP_CREATOR_PAGE_ACCESS_VALIDATOR =
    '/access_validation_handler/can_access_create_learner_group_page';

  DIAGNOSTIC_TEST_PLAYER_PAGE_ACCESS_VALIDATOR =
    '/access_validation_handler/can_access_diagnostic_test_player_page';

  FACILITATOR_DASHBOARD_PAGE_ACCESS_VALIDATOR =
    '/access_validation_handler/can_access_facilitator_dashboard_page';

  DOES_LEARNER_GROUP_EXIST =
    '/access_validation_handler/does_learner_group_exist/<learner_group_id>';

  TOPIC_VIEWER_PAGE_ACCESS_VALIDATOR =
    '/access_validation_handler/can_access_topic_viewer_page/' +
    '<classroom_url_fragment>/<topic_url_fragment>';

  PRACTICE_SESSION_PAGE_ACCESS_VALIDATOR =
    '/access_validation_handler/can_access_practice_session_page/' +
    '<classroom_url_fragment>/<topic_url_fragment>/practice/session';

  BLOG_HOME_PAGE_ACCESS_VALIDATOR =
    '/access_validation_handler/can_access_blog_home_page';

  BLOG_POST_PAGE_ACCESS_VALIDATOR =
    '/access_validation_handler/can_access_blog_post_page';

  BLOG_AUTHOR_PROFILE_PAGE_ACCESS_VALIDATOR =
    '/access_validation_handler/can_access_blog_author_profile_page/<author_username>'; // eslint-disable-line max-len

  TOPIC_EDITOR_ACCESS_VALIDATOR_URL =
    '/access_validation_handler/can_access_topic_editor/<topic_id>';

  COLLECTION_PLAYER_PAGE_ACCESS_VALIDATOR_URL_TEMPLATE =
    '/access_validation_handler/can_access_collection_player_page/<collection_id>'; // eslint-disable-line max-len

  SKILL_EDITOR_ACCESS_VALIDATION_URL =
    '/access_validation_handler/can_access_skill_editor/<skill_id>';

  COLLECTION_EDITOR_PAGE_ACCESS_VALIDATOR =
    '/access_validation_handler/' +
    'can_access_collection_editor_page/<collection_id>';

  EXPLORATION_EDITOR_PAGE_ACCESS_VALIDATOR =
    '/access_validation_handler/can_access_exploration_editor_page/<exploration_id>';

  CLASSROOMS_PAGE_ACCESS_VALIDATION =
    '/access_validation_handler/can_access_classrooms_page';

  EXPLORATION_PLAYER_PAGE_ACCESS_VALIDATOR =
    '/access_validation_handler/can_access_exploration_player_page/<exploration_id>';

  REVIEW_TESTS_PAGE_ACCESS_VALIDATOR =
    '/access_validation_handler/can_access_review_tests_page/<classroom_url_fragment>/<topic_url_fragment>/<story_url_fragment>'; // eslint-disable-line max-len

  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  validateAccessToExplorationEditorPage(explorationId: string): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.EXPLORATION_EDITOR_PAGE_ACCESS_VALIDATOR,
      {
        exploration_id: explorationId,
      }
    );
    return this.http.get<void>(url).toPromise();
  }

  validateAccessToStoryEditorPage(storyId: string): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.STORY_EDITOR_PAGE_ACCESS_VALIDATOR,
      {
        story_id: storyId,
      }
    );
    return this.http.get<void>(url).toPromise();
  }

  validateAccessToExplorationPlayerPage(
    explorationId: string,
    version: string | null
  ): Promise<void> {
    const url = this.urlInterpolationService.interpolateUrl(
      this.EXPLORATION_PLAYER_PAGE_ACCESS_VALIDATOR,
      {
        exploration_id: explorationId,
      }
    );

    const params = version ? new HttpParams().set('v', version) : undefined;

    return this.http.get<void>(url, {params}).toPromise();
  }

  validateAccessToReviewTestPage(
    classroomUrlFragment: string,
    topicUrlFragment: string,
    storyUrlFragment: string
  ): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.REVIEW_TESTS_PAGE_ACCESS_VALIDATOR,
      {
        classroom_url_fragment: classroomUrlFragment,
        topic_url_fragment: topicUrlFragment,
        story_url_fragment: storyUrlFragment,
      }
    );
    return this.http.get<void>(url).toPromise();
  }

  validateAccessToSubtopicViewerPage(
    classroomUrlFragment: string,
    topicUrlFragment: string,
    subtopicUrlFragment: string
  ): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.SUBTOPIC_VIEWER_PAGE_ACCESS_VALIDATOR,
      {
        classroom_url_fragment: classroomUrlFragment,
        topic_url_fragment: topicUrlFragment,
        subtopic_url_fragment: subtopicUrlFragment,
      }
    );

    return this.http.get<void>(url).toPromise();
  }

  validateAccessToTopicViewerPage(
    classroomUrlFragment: string,
    topicUrlFragment: string
  ): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.TOPIC_VIEWER_PAGE_ACCESS_VALIDATOR,
      {
        classroom_url_fragment: classroomUrlFragment,
        topic_url_fragment: topicUrlFragment,
      }
    );
    return this.http.get<void>(url).toPromise();
  }

  validateAccessToPracticeSessionPage(
    classroomUrlFragment: string,
    topicUrlFragment: string,
    selectedSubtopicIds: string
  ): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.PRACTICE_SESSION_PAGE_ACCESS_VALIDATOR,
      {
        classroom_url_fragment: classroomUrlFragment,
        topic_url_fragment: topicUrlFragment,
      }
    );
    const params = new HttpParams().set(
      'selected_subtopic_ids',
      selectedSubtopicIds
    );
    return this.http.get<void>(url, {params}).toPromise();
  }

  validateAccessToClassroomPage(classroomUrlFragment: string): Promise<void> {
    return this.http
      .get<void>(this.CLASSROOM_PAGE_ACCESS_VALIDATOR, {
        params: {
          classroom_url_fragment: classroomUrlFragment,
        },
      })
      .toPromise();
  }

  validateAccessToClassroomsPage(): Promise<void> {
    return this.http
      .get<void>(this.CLASSROOMS_PAGE_ACCESS_VALIDATION)
      .toPromise();
  }

  validateAccessToBlogHomePage(): Promise<void> {
    return this.http
      .get<void>(this.BLOG_HOME_PAGE_ACCESS_VALIDATOR)
      .toPromise();
  }

  validateAccessToBlogPostPage(blogPostPageUrlFragment: string): Promise<void> {
    return this.http
      .get<void>(this.BLOG_POST_PAGE_ACCESS_VALIDATOR, {
        params: {
          blog_post_url_fragment: blogPostPageUrlFragment,
        },
      })
      .toPromise();
  }

  validateAccessToBlogAuthorProfilePage(authorUsername: string): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.BLOG_AUTHOR_PROFILE_PAGE_ACCESS_VALIDATOR,
      {
        author_username: authorUsername,
      }
    );
    return this.http.get<void>(url).toPromise();
  }

  validateCanManageOwnAccount(): Promise<void> {
    return this.http
      .get<void>(this.CAN_MANAGE_OWN_ACCOUNT_VALIDATOR)
      .toPromise();
  }

  validateAccessToCollectionPlayerPage(collectionId: string): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.COLLECTION_PLAYER_PAGE_ACCESS_VALIDATOR_URL_TEMPLATE,
      {
        collection_id: collectionId,
      }
    );

    return this.http.get<void>(url).toPromise();
  }

  validateAccessToTopicEditorPage(topicId: string): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.TOPIC_EDITOR_ACCESS_VALIDATOR_URL,
      {
        topic_id: topicId,
      }
    );

    return this.http.get<void>(url).toPromise();
  }

  doesProfileExist(username: string): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.DOES_PROFILE_EXIST,
      {
        username: username,
      }
    );

    return this.http.get<void>(url).toPromise();
  }

  validateAccessToReleaseCoordinatorPage(): Promise<void> {
    return this.http
      .get<void>(this.RELEASE_COORDINATOR_PAGE_ACCESS_VALIDATOR)
      .toPromise();
  }

  validateAccessToLearnerGroupEditorPage(
    learnerGroupId: string
  ): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.LEARNER_GROUP_EDITOR_PAGE_ACCESS_VALIDATOR,
      {
        learner_group_id: learnerGroupId,
      }
    );

    return this.http.get<void>(url).toPromise();
  }

  validateAccessToLearnerGroupCreatorPage(): Promise<void> {
    return this.http
      .get<void>(this.LEARNER_GROUP_CREATOR_PAGE_ACCESS_VALIDATOR)
      .toPromise();
  }

  validateAccessToSkillEditorPage(skillId: string): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.SKILL_EDITOR_ACCESS_VALIDATION_URL,
      {
        skill_id: skillId,
      }
    );

    return this.http.get<void>(url).toPromise();
  }

  validateAccessToDiagnosticTestPlayerPage(): Promise<void> {
    return this.http
      .get<void>(this.DIAGNOSTIC_TEST_PLAYER_PAGE_ACCESS_VALIDATOR)
      .toPromise();
  }

  validateAccessToFacilitatorDashboardPage(): Promise<void> {
    return this.http
      .get<void>(this.FACILITATOR_DASHBOARD_PAGE_ACCESS_VALIDATOR)
      .toPromise();
  }

  doesLearnerGroupExist(learnerGroupId: string): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.DOES_LEARNER_GROUP_EXIST,
      {
        learner_group_id: learnerGroupId,
      }
    );

    return this.http.get<void>(url).toPromise();
  }

  validateAccessCollectionEditorPage(collectionId: string): Promise<void> {
    let url = this.urlInterpolationService.interpolateUrl(
      this.COLLECTION_EDITOR_PAGE_ACCESS_VALIDATOR,
      {
        collection_id: collectionId,
      }
    );

    return this.http.get<void>(url).toPromise();
  }
}
