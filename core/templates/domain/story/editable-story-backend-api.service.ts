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
 * @fileoverview Service to send changes to a story to the backend.
 */

import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';

import {StoryChange} from 'domain/editor/undo_redo/change.model';
import {SkillSummaryBackendDict} from 'domain/skill/skill-summary.model';
import {StoryBackendDict} from 'domain/story/story.model';
import {StoryDomainConstants} from 'domain/story/story-domain.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

export interface FetchStoryBackendResponse {
  story: StoryBackendDict;
  topic_name: string;
  story_is_published: boolean;
  skill_summaries: SkillSummaryBackendDict[];
  topic_url_fragment: string;
  classroom_url_fragment: string;
}

interface FetchStoryResponse {
  story: StoryBackendDict;
  topicName: string;
  storyIsPublished: boolean;
  skillSummaries: SkillSummaryBackendDict[];
  topicUrlFragment: string;
  classroomUrlFragment: string;
}

interface UpdateStoryBackendResponse {
  story: StoryBackendDict;
}

interface StoryUrlFragmentExistsBackendResponse {
  story_url_fragment_exists: boolean;
}

interface ValidationExplorationBackendResponse {
  validation_error_messages: string[];
}

@Injectable({
  providedIn: 'root',
})
export class EditableStoryBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  private _fetchStory(
    storyId: string,
    successCallback: (value: FetchStoryResponse) => void,
    errorCallback: (reason: string) => void
  ): void {
    const editableStoryDataUrl = this.urlInterpolationService.interpolateUrl(
      StoryDomainConstants.EDITABLE_STORY_DATA_URL_TEMPLATE,
      {
        story_id: storyId,
      }
    );

    this.http
      .get<FetchStoryBackendResponse>(editableStoryDataUrl)
      .toPromise()
      .then(
        response => {
          if (successCallback) {
            successCallback({
              story: response.story,
              topicName: response.topic_name,
              storyIsPublished: response.story_is_published,
              skillSummaries: response.skill_summaries,
              topicUrlFragment: response.topic_url_fragment,
              classroomUrlFragment: response.classroom_url_fragment,
            });
          }
        },
        errorResponse => {
          if (errorCallback) {
            errorCallback(errorResponse.error.error);
          }
        }
      );
  }

  private _updateStory(
    storyId: string,
    storyVersion: number,
    commitMessage: string,
    changeList: StoryChange[],
    successCallback: (value: StoryBackendDict) => void,
    errorCallback: (reason: string) => void
  ): void {
    const editableStoryDataUrl = this.urlInterpolationService.interpolateUrl(
      StoryDomainConstants.EDITABLE_STORY_DATA_URL_TEMPLATE,
      {
        story_id: storyId,
      }
    );

    const putData = {
      version: storyVersion,
      commit_message: commitMessage,
      change_dicts: changeList,
    };

    this.http
      .put<UpdateStoryBackendResponse>(editableStoryDataUrl, putData)
      .toPromise()
      .then(
        response => successCallback(response.story),
        errorResponse => errorCallback(errorResponse.error.error)
      );
  }

  private _changeStoryPublicationStatus(
    storyId: string,
    newStoryStatusIsPublic: boolean,
    successCallback: (value: void) => void,
    errorCallback: (reason: string) => void
  ): void {
    const storyPublishUrl = this.urlInterpolationService.interpolateUrl(
      StoryDomainConstants.STORY_PUBLISH_URL_TEMPLATE,
      {
        story_id: storyId,
      }
    );
    const putData = {
      new_story_status_is_public: newStoryStatusIsPublic,
    };
    this.http
      .put(storyPublishUrl, putData)
      .toPromise()
      .then(
        response => successCallback(),
        errorResponse => errorCallback(errorResponse.error.error)
      );
  }

  private _validateExplorations(
    storyId: string,
    expIds: string[],
    successCallback: (value: string[]) => void,
    errorCallback: (reason: string) => void
  ): void {
    const validateExplorationsUrl = this.urlInterpolationService.interpolateUrl(
      StoryDomainConstants.VALIDATE_EXPLORATIONS_URL_TEMPLATE,
      {
        story_id: storyId,
      }
    );

    this.http
      .get<ValidationExplorationBackendResponse>(validateExplorationsUrl, {
        params: {
          comma_separated_exp_ids: expIds.join(','),
        },
      })
      .toPromise()
      .then(
        response => successCallback(response.validation_error_messages),
        errorResponse => errorCallback(errorResponse.error.error)
      );
  }

  private _deleteStory(
    storyId: string,
    successCallback: (value: number) => void,
    errorCallback: (reason: string) => void
  ): void {
    const storyDataUrl = this.urlInterpolationService.interpolateUrl(
      StoryDomainConstants.EDITABLE_STORY_DATA_URL_TEMPLATE,
      {
        story_id: storyId,
      }
    );

    this.http
      .delete(storyDataUrl, {observe: 'response'})
      .toPromise()
      .then(
        response => {
          if (successCallback) {
            successCallback(response.status);
          }
        },
        errorResponse => {
          if (errorCallback) {
            errorCallback(errorResponse.error.error);
          }
        }
      );
  }

  private _doesStoryWithUrlFragmentExist(
    storyUrlFragment: string,
    successCallback: (value: boolean) => void,
    errorCallback: (reason: HttpErrorResponse) => void
  ): void {
    const storyUrlFragmentUrl = this.urlInterpolationService.interpolateUrl(
      StoryDomainConstants.STORY_URL_FRAGMENT_HANDLER_URL_TEMPLATE,
      {
        story_url_fragment: storyUrlFragment,
      }
    );
    this.http
      .get<StoryUrlFragmentExistsBackendResponse>(storyUrlFragmentUrl)
      .toPromise()
      .then(
        response => {
          if (successCallback) {
            successCallback(response.story_url_fragment_exists);
          }
        },
        errorResponse => {
          if (errorCallback) {
            errorCallback(errorResponse);
          }
        }
      );
  }

  async fetchStoryAsync(storyId: string): Promise<FetchStoryResponse> {
    return new Promise((resolve, reject) => {
      this._fetchStory(storyId, resolve, reject);
    });
  }

  /**
   * Updates a story in the backend with the provided story ID.
   * The changes only apply to the story of the given version and the
   * request to update the story will fail if the provided story
   * version is older than the current version stored in the backend. Both
   * the changes and the message to associate with those changes are used
   * to commit a change to the story. The new story is passed to
   * the success callback, if one is provided to the returned promise
   * object. Errors are passed to the error callback, if one is provided.
   */
  async updateStoryAsync(
    storyId: string,
    storyVersion: number,
    commitMessage: string,
    changeList: StoryChange[]
  ): Promise<StoryBackendDict> {
    return new Promise((resolve, reject) => {
      this._updateStory(
        storyId,
        storyVersion,
        commitMessage,
        changeList,
        resolve,
        reject
      );
    });
  }

  async changeStoryPublicationStatusAsync(
    storyId: string,
    newStoryStatusIsPublic: boolean
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this._changeStoryPublicationStatus(
        storyId,
        newStoryStatusIsPublic,
        resolve,
        reject
      );
    });
  }

  async validateExplorationsAsync(
    storyId: string,
    expIds: string[]
  ): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this._validateExplorations(storyId, expIds, resolve, reject);
    });
  }

  async deleteStoryAsync(storyId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this._deleteStory(storyId, resolve, reject);
    });
  }

  async doesStoryWithUrlFragmentExistAsync(
    storyUrlFragment: string
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this._doesStoryWithUrlFragmentExist(storyUrlFragment, resolve, reject);
    });
  }
}
