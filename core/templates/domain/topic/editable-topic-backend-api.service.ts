// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to send changes to a topic to the backend.
 */

import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {AppConstants} from 'app.constants';
import {BackendChangeObject} from 'domain/editor/undo_redo/change.model';
import {RubricBackendDict} from 'domain/skill/rubric.model';
import {SkillSummaryBackendDict} from 'domain/skill/skill-summary.model';
import {StorySummaryBackendDict} from 'domain/story/story-summary.model';
import {SkillIdToDescriptionMap} from 'domain/topic/subtopic.model';
import {SubtopicPageBackendDict} from 'domain/topic/subtopic-page.model';
import {TopicBackendDict} from 'domain/topic/topic-object.model';
import {TopicDomainConstants} from 'domain/topic/topic-domain.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

interface FetchTopicBackendResponse {
  topic_dict: TopicBackendDict;
  grouped_skill_summary_dicts: {
    [topicName: string]: SkillSummaryBackendDict[];
  };
  skill_id_to_description_dict: SkillIdToDescriptionMap;
  skill_question_count_dict: {
    [skillId: string]: number;
  };
  skill_id_to_rubrics_dict: {
    [skillId: string]: RubricBackendDict[];
  };
  classroom_url_fragment: string | null;
  classroom_name: string | null;
  skill_creation_is_allowed: boolean;
  curriculum_admin_usernames: string[];
}

export interface FetchTopicResponse {
  topicDict: TopicBackendDict;
  groupedSkillSummaries: {
    [topicName: string]: SkillSummaryBackendDict[];
  };
  skillIdToDescriptionDict: SkillIdToDescriptionMap;
  skillQuestionCountDict: {
    [skillId: string]: number;
  };
  skillIdToRubricsDict: {
    [skillId: string]: RubricBackendDict[];
  };
  classroomUrlFragment: string | null;
  classroomName: string | null;
  skillCreationIsAllowed: boolean;
  curriculumAdminUsernames: string[];
}

interface FetchStoriesBackendResponse {
  canonical_story_summary_dicts: StorySummaryBackendDict[];
}

interface FetchSubtopicPageBackendResponse {
  subtopic_page: SubtopicPageBackendDict;
}

interface DeleteTopicBackendResponse {
  status: number;
}

interface UpdateTopicBackendResponse {
  topic_dict: TopicBackendDict;
  skill_id_to_description_dict: SkillIdToDescriptionMap;
  skill_id_to_rubrics_dict: {
    [skillId: string]: RubricBackendDict[];
  };
}

export interface UpdateTopicResponse {
  topicDict: TopicBackendDict;
  skillIdToDescriptionDict: SkillIdToDescriptionMap;
  skillIdToRubricsDict: {
    [skillId: string]: RubricBackendDict[];
  };
}

interface DoesTopicWithUrlFragmentExistBackendResponse {
  topic_url_fragment_exists: boolean;
}

interface DoesTopicWithNameExistBackendResponse {
  topic_name_exists: boolean;
}

interface TopicIdToTopicNameBackendResponse {
  topic_id_to_topic_name: {
    [topicId: string]: string;
  };
}

export interface TopicIdToTopicNameResponse {
  [topicId: string]: string;
}

@Injectable({
  providedIn: 'root',
})
export class EditableTopicBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  private _fetchTopic(
    topicId: string,
    successCallback: (value: FetchTopicResponse) => void,
    errorCallback: (reason: string) => void
  ): void {
    let topicDataUrl = this.urlInterpolationService.interpolateUrl(
      AppConstants.EDITABLE_TOPIC_DATA_URL_TEMPLATE,
      {
        topic_id: topicId,
      }
    );

    this.http
      .get<FetchTopicBackendResponse>(topicDataUrl)
      .toPromise()
      .then(
        response => {
          if (successCallback) {
            // The response is passed as a dict with 2 fields and not as 2
            // parameters, because the successCallback is called as the resolve
            // callback function in $q in fetchTopic(), and according to its
            // documentation (https://docs.angularjs.org/api/ng/service/$q),
            // resolve or reject can have only a single parameter.
            successCallback({
              topicDict: response.topic_dict,
              groupedSkillSummaries: response.grouped_skill_summary_dicts,
              skillIdToDescriptionDict: response.skill_id_to_description_dict,
              skillQuestionCountDict: {
                ...response.skill_question_count_dict,
              },
              skillIdToRubricsDict: response.skill_id_to_rubrics_dict,
              classroomUrlFragment: response.classroom_url_fragment,
              classroomName: response.classroom_name,
              skillCreationIsAllowed: response.skill_creation_is_allowed,
              curriculumAdminUsernames: response.curriculum_admin_usernames,
            });
          }
        },
        errorResponse => {
          errorCallback(errorResponse.error);
        }
      );
  }

  private _fetchStories(
    topicId: string,
    successCallback: (value: StorySummaryBackendDict[]) => void,
    errorCallback: (reason: string) => void
  ): void {
    let storiesDataUrl = this.urlInterpolationService.interpolateUrl(
      TopicDomainConstants.TOPIC_EDITOR_STORY_URL_TEMPLATE,
      {
        topic_id: topicId,
      }
    );

    this.http
      .get<FetchStoriesBackendResponse>(storiesDataUrl)
      .toPromise()
      .then(
        response => {
          let canonicalStorySummaries = response.canonical_story_summary_dicts;
          if (successCallback) {
            successCallback(canonicalStorySummaries);
          }
        },
        errorResponse => {
          errorCallback(errorResponse.error);
        }
      );
  }

  private _fetchSubtopicPage(
    topicId: string,
    subtopicId: number,
    successCallback: (value: SubtopicPageBackendDict) => void,
    errorCallback: (reason: string) => void
  ): void {
    let subtopicPageDataUrl = this.urlInterpolationService.interpolateUrl(
      AppConstants.SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE,
      {
        topic_id: topicId,
        subtopic_id: subtopicId.toString(),
      }
    );

    this.http
      .get<FetchSubtopicPageBackendResponse>(subtopicPageDataUrl)
      .toPromise()
      .then(
        response => {
          let topic = response.subtopic_page;
          if (successCallback) {
            successCallback(topic);
          }
        },
        errorResponse => {
          errorCallback(errorResponse.error);
        }
      );
  }

  private _deleteTopic(
    topicId: string,
    successCallback: (value: number) => void,
    errorCallback: (reason: string) => void
  ): void {
    let topicDataUrl = this.urlInterpolationService.interpolateUrl(
      AppConstants.EDITABLE_TOPIC_DATA_URL_TEMPLATE,
      {
        topic_id: topicId,
      }
    );
    this.http
      .delete<DeleteTopicBackendResponse>(topicDataUrl)
      .toPromise()
      .then(
        response => {
          if (successCallback) {
            successCallback(response.status);
          }
        },
        errorResponse => {
          errorCallback(errorResponse.error);
        }
      );
  }

  private _updateTopic(
    topicId: string,
    topicVersion: number,
    commitMessage: string,
    changeList: BackendChangeObject[],
    successCallback: (value: UpdateTopicResponse) => void,
    errorCallback: (reason: string) => void
  ): void {
    let editableTopicDataUrl = this.urlInterpolationService.interpolateUrl(
      AppConstants.EDITABLE_TOPIC_DATA_URL_TEMPLATE,
      {
        topic_id: topicId,
      }
    );

    let putData = {
      version: topicVersion,
      commit_message: commitMessage,
      topic_and_subtopic_page_change_dicts: changeList,
    };
    this.http
      .put<UpdateTopicBackendResponse>(editableTopicDataUrl, putData)
      .toPromise()
      .then(
        response => {
          if (successCallback) {
            // Here also, a dict with 2 fields are passed instead of just 2
            // parameters, due to the same reason as written for _fetchTopic().
            successCallback({
              topicDict: response.topic_dict,
              skillIdToDescriptionDict: response.skill_id_to_description_dict,
              skillIdToRubricsDict: response.skill_id_to_rubrics_dict,
            });
          }
        },
        errorResponse => {
          errorCallback(errorResponse.error);
        }
      );
  }

  private _doesTopicWithUrlFragmentExist(
    topicUrlFragment: string,
    successCallback: (value: boolean) => void,
    errorCallback: (errorResponse: HttpErrorResponse) => void
  ): void {
    let topicUrlFragmentUrl = this.urlInterpolationService.interpolateUrl(
      TopicDomainConstants.TOPIC_URL_FRAGMENT_HANDLER_URL_TEMPLATE,
      {
        topic_url_fragment: topicUrlFragment,
      }
    );
    this.http
      .get<DoesTopicWithUrlFragmentExistBackendResponse>(topicUrlFragmentUrl)
      .toPromise()
      .then(
        response => {
          if (successCallback) {
            successCallback(response.topic_url_fragment_exists);
          }
        },
        errorResponse => {
          errorCallback(errorResponse);
        }
      );
  }

  private _doesTopicWithNameExist(
    topicName: string,
    successCallback: (value: boolean) => void,
    errorCallback: (reason: string) => void
  ): void {
    let topicNameUrl = this.urlInterpolationService.interpolateUrl(
      TopicDomainConstants.TOPIC_NAME_HANDLER_URL_TEMPLATE,
      {
        topic_name: topicName,
      }
    );
    this.http
      .get<DoesTopicWithNameExistBackendResponse>(topicNameUrl)
      .toPromise()
      .then(
        response => {
          if (successCallback) {
            successCallback(response.topic_name_exists);
          }
        },
        errorResponse => {
          errorCallback(errorResponse.error);
        }
      );
  }

  async fetchTopicAsync(topicId: string): Promise<FetchTopicResponse> {
    return new Promise((resolve, reject) => {
      this._fetchTopic(topicId, resolve, reject);
    });
  }

  async fetchStoriesAsync(topicId: string): Promise<StorySummaryBackendDict[]> {
    return new Promise((resolve, reject) => {
      this._fetchStories(topicId, resolve, reject);
    });
  }

  async fetchSubtopicPageAsync(
    topicId: string,
    subtopicId: number
  ): Promise<SubtopicPageBackendDict> {
    return new Promise((resolve, reject) => {
      this._fetchSubtopicPage(topicId, subtopicId, resolve, reject);
    });
  }

  /**
   * Updates a topic in the backend with the provided topic ID.
   * The changes only apply to the topic of the given version and the
   * request to update the topic will fail if the provided topic
   * version is older than the current version stored in the backend. Both
   * the changes and the message to associate with those changes are used
   * to commit a change to the topic. The new topic is passed to
   * the success callback, if one is provided to the returned promise
   * object. Errors are passed to the error callback, if one is provided.
   */
  async updateTopicAsync(
    topicId: string,
    topicVersion: number,
    commitMessage: string,
    changeList: BackendChangeObject[]
  ): Promise<UpdateTopicResponse> {
    return new Promise((resolve, reject) => {
      this._updateTopic(
        topicId,
        topicVersion,
        commitMessage,
        changeList,
        resolve,
        reject
      );
    });
  }

  async deleteTopicAsync(topicId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this._deleteTopic(topicId, resolve, reject);
    });
  }

  async doesTopicWithNameExistAsync(topicName: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this._doesTopicWithNameExist(topicName, resolve, reject);
    });
  }

  async doesTopicWithUrlFragmentExistAsync(
    topicUrlFragment: string
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this._doesTopicWithUrlFragmentExist(topicUrlFragment, resolve, reject);
    });
  }

  private _getTopicIdToTopicName(
    topicIds: string[],
    successCallback: (value: TopicIdToTopicNameResponse) => void,
    errorCallback: (reason: string) => void
  ): void {
    const topicIdToTopicNameUrl = this.urlInterpolationService.interpolateUrl(
      '/topic_id_to_topic_name_handler/?' +
        'comma_separated_topic_ids=<comma_separated_topic_ids>',
      {
        comma_separated_topic_ids: topicIds.join(','),
      }
    );

    this.http
      .get<TopicIdToTopicNameBackendResponse>(topicIdToTopicNameUrl)
      .toPromise()
      .then(
        response => {
          if (successCallback) {
            successCallback(response.topic_id_to_topic_name);
          }
        },
        errorResponse => {
          errorCallback(errorResponse.error.error);
        }
      );
  }

  async getTopicIdToTopicNameAsync(
    topicIds: string[]
  ): Promise<TopicIdToTopicNameResponse> {
    return new Promise((resolve, reject) => {
      this._getTopicIdToTopicName(topicIds, resolve, reject);
    });
  }
}
