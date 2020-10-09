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
 * @fileoverview Service to send changes to a story to the backend.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { StoryDomainConstants } from 'domain/story/story-domain.constants';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';

export interface PublishedStoryModel {
    'story': {
      'id': string,
      'title': string,
      'description': string,
      'notes': string,
      'version': number,
      'story_contents': {
        'initial_node_id': string,
        'nodes': [{
          'id': string,
          'prerequisite_skill_ids': string[],
          'acquired_skill_ids': string[],
          'destination_node_ids': string[],
          'outline': string,
          'exploration_id': string,
          'outline_is_finalized': boolean
        }],
        'next_node_id': string
      },
      'language_code': string
    },
    'topic_name': string,
    'story_is_published': boolean,
    'skill_summaries': [{
      'id': string,
      'description': string
    }],
    'topic_url_fragment': string,
    'classroom_url_fragment': string
  }

@Injectable({
  providedIn: 'root'
})
export class EditableStoryBackendApiService {
  constructor(
    private httpClient: HttpClient,
    private urlInterpolationService: UrlInterpolationService) {}

  private _fetchStory = (storyId, successCallback, errorCallback) => {
    let storyDataUrl = this.urlInterpolationService.interpolateUrl(
      StoryDomainConstants.EDITABLE_STORY_DATA_URL_TEMPLATE, {
        story_id: storyId
      });

    this.httpClient.get(storyDataUrl).toPromise().then(
      (response: PublishedStoryModel) => {
        let story = response.story;
        let topicName = response.topic_name;
        let storyIsPublished = response.story_is_published;
        let skillSummaries = response.skill_summaries;
        let topicUrlFragment = response.topic_url_fragment;
        let classroomUrlFragment = response.classroom_url_fragment;
        if (successCallback) {
          successCallback({
            story: story,
            topicName: topicName,
            storyIsPublished: storyIsPublished,
            skillSummaries: skillSummaries,
            topicUrlFragment: topicUrlFragment,
            classroomUrlFragment: classroomUrlFragment
          });
        }
      }, (errorResponse) => {
        if (errorCallback) {
          errorCallback(errorResponse.error.error);
        }
      });
  };

  private _updateStory = (
      storyId, storyVersion, commitMessage, changeList,
      successCallback, errorCallback) => {
    let editableStoryDataUrl = this.urlInterpolationService.interpolateUrl(
      StoryDomainConstants.EDITABLE_STORY_DATA_URL_TEMPLATE, {
        story_id: storyId
      });

    let putData = {
      version: storyVersion,
      commit_message: commitMessage,
      change_dicts: changeList
    };
    this.httpClient.put(
      editableStoryDataUrl, putData).toPromise().then(
      (response: PublishedStoryModel) => {
        // The returned data is an updated story dict.
        if (successCallback) {
          successCallback(response.story);
        }
      }, (errorResponse) => {
        if (errorCallback) {
          errorCallback(errorResponse.error.error);
        }
      });
  };

  private _changeStoryPublicationStatus = (
      storyId, newStoryStatusIsPublic, successCallback, errorCallback) => {
    let storyPublishUrl = this.urlInterpolationService.interpolateUrl(
      StoryDomainConstants.STORY_PUBLISH_URL_TEMPLATE, {
        story_id: storyId
      });

    let putData = {
      new_story_status_is_public: newStoryStatusIsPublic
    };
    this.httpClient.put(
      storyPublishUrl, putData).toPromise().then((response) => {
      if (successCallback) {
        successCallback();
      }
    }, (errorResponse) => {
      if (errorCallback) {
        errorCallback(errorResponse.error.error);
      }
    });
  };

  private _validateExplorations = (
      storyId, expIds, successCallback, errorCallback) => {
    let validateExplorationsUrl = this.urlInterpolationService.interpolateUrl(
      StoryDomainConstants.VALIDATE_EXPLORATIONS_URL_TEMPLATE, {
        story_id: storyId
      });

    this.httpClient.get(validateExplorationsUrl, {
      params: {
        comma_separated_exp_ids: expIds.join(',')
      }
    }).toPromise().then((response) => {
      if (successCallback) {
        successCallback(response);
      }
    }, (errorResponse) => {
      if (errorCallback) {
        errorCallback(errorResponse.error.error);
      }
    });
  };

  private _deleteStory = (
      storyId, successCallback, errorCallback) => {
    let storyDataUrl = this.urlInterpolationService.interpolateUrl(
      StoryDomainConstants.EDITABLE_STORY_DATA_URL_TEMPLATE, {
        story_id: storyId
      });
    this.httpClient['delete'](
      storyDataUrl).toPromise().then((response) => {
      if (successCallback) {
        successCallback(response);
      }
    }, (errorResponse) => {
      if (errorCallback) {
        errorCallback(errorResponse.error.error);
      }
    });
  };

  private _doesStoryWithUrlFragmentExist = (
      storyUrlFragment, successCallback, errorCallback) => {
    var storyUrlFragmentUrl = this.urlInterpolationService.interpolateUrl(
      StoryDomainConstants.STORY_URL_FRAGMENT_HANDLER_URL_TEMPLATE, {
        story_url_fragment: storyUrlFragment
      });
    this.httpClient.get(
      storyUrlFragmentUrl).toPromise().then((response) => {
      if (successCallback) {
        successCallback(response);
      }
    }, (errorResponse) => {
      if (errorCallback) {
        errorCallback(errorResponse.error.error);
      }
    });
  };

  fetchStory(storyId:string): Promise<PublishedStoryModel> {
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
  updateStory(
      storyId: string, storyVersion: number,
      commitMessage: string, changeList: string[]):
      Promise<PublishedStoryModel> {
    return new Promise ((resolve, reject) => {
      this._updateStory(
        storyId, storyVersion, commitMessage, changeList,
        resolve, reject);
    });
  }

  validateExplorations(storyId: string, expIds: string[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this._validateExplorations(storyId, expIds, resolve, reject);
    });
  }

  changeStoryPublicationStatus(
      storyId: string, newStoryStatusIsPublic: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      this._changeStoryPublicationStatus(
        storyId, newStoryStatusIsPublic, resolve, reject);
    });
  }

  deleteStory(storyId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this._deleteStory(storyId, resolve, reject);
    });
  }

  doesStoryWithUrlFragmentExistAsync(
      storyUrlFragment: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this._doesStoryWithUrlFragmentExist(storyUrlFragment, resolve, reject);
    });
  }
}

angular.module('oppia').factory(
  'EditableStoryBackendApiService',
  downgradeInjectable(EditableStoryBackendApiService)
);
