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

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import cloneDeep from 'lodash/cloneDeep';

import { AppConstants } from 'app.constants';
import { TopicDomainConstants } from 'domain/topic/topic-domain.constants';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

@Injectable({
  providedIn: 'root'
})
export class EditableTopicBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolation: UrlInterpolationService) {}

  private _fetchTopic(topicId: string,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?) => void): void {
    let topicDataUrl = this.urlInterpolation.interpolateUrl(
      AppConstants.EDITABLE_TOPIC_DATA_URL_TEMPLATE, {
        topic_id: topicId
      });

    this.http.get(topicDataUrl).toPromise().then(
      (response: {[key: string]: Object}) => {
        if (successCallback) {
          // The response is passed as a dict with 2 fields and not as 2
          // parameters, because the successCallback is called as the resolve
          // callback function in $q in fetchTopic(), and according to its
          // documentation (https://docs.angularjs.org/api/ng/service/$q),
          // resolve or reject can have only a single parameter.

          successCallback({
            topicDict: cloneDeep(response.topic_dict),
            groupedSkillSummaries: cloneDeep(
              response.grouped_skill_summary_dicts),
            skillIdToDescriptionDict: cloneDeep(
              response.skill_id_to_description_dict),
            skillIdToRubricsDict: cloneDeep(response.skill_id_to_rubrics_dict)
          });
        }
      }, (errorResponse) => {
        if (errorCallback) {
          errorCallback(errorResponse.error);
        }
      });
  }

  private _fetchStories(topicId: string,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?) => void): void {
    let storiesDataUrl = this.urlInterpolation.interpolateUrl(
      TopicDomainConstants.TOPIC_EDITOR_STORY_URL_TEMPLATE, {
        topic_id: topicId
      });

    this.http.get(storiesDataUrl).toPromise().then(
      (response: {[key: string]: Object}) => {
        let canonicalStorySummaries = cloneDeep(
          response.canonical_story_summary_dicts);
        if (successCallback) {
          successCallback(canonicalStorySummaries);
        }
      }, (errorResponse) => {
        if (errorCallback) {
          errorCallback(errorResponse.error);
        }
      });
  }

  private _fetchSubtopicPage(
      topicId: string, subtopicId: number,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?) => void): void {
    let subtopicPageDataUrl = this.urlInterpolation.interpolateUrl(
      AppConstants.SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE, {
        topic_id: topicId,
        subtopic_id: subtopicId.toString()
      });

    this.http.get(subtopicPageDataUrl).toPromise().then(
      (response: {[key: string]: Object}) => {
        let topic = cloneDeep(response.subtopic_page);
        if (successCallback) {
          successCallback(topic);
        }
      }, (errorResponse) => {
        if (errorCallback) {
          errorCallback(errorResponse.error);
        }
      });
  }

  private _deleteTopic(topicId: string,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?) => void): void {
    let topicDataUrl = this.urlInterpolation.interpolateUrl(
      AppConstants.EDITABLE_TOPIC_DATA_URL_TEMPLATE, {
        topic_id: topicId
      });
    this.http['delete'](topicDataUrl).toPromise().then((response) => {
      if (successCallback) {
        successCallback(200);
      }
    }, (errorResponse) => {
      if (errorCallback) {
        errorCallback(errorResponse.error);
      }
    });
  }

  private _updateTopic(
      topicId: string, topicVersion: string, commitMessage: string,
      changeList: Array<Object>,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?) => void): void {
    let editableTopicDataUrl = this.urlInterpolation.interpolateUrl(
      AppConstants.EDITABLE_TOPIC_DATA_URL_TEMPLATE, {
        topic_id: topicId
      });

    let putData = {
      version: topicVersion,
      commit_message: commitMessage,
      topic_and_subtopic_page_change_dicts: changeList
    };
    this.http.put(editableTopicDataUrl, putData).toPromise().then(
      (response: {[key: string]: Object}) => {
        if (successCallback) {
        // Here also, a dict with 2 fields are passed instead of just 2
        // parameters, due to the same reason as written for _fetchTopic().
          successCallback({
            topicDict: cloneDeep(response.topic_dict),
            skillIdToDescriptionDict: cloneDeep(
              response.skill_id_to_description_dict),
            skillIdToRubricsDict: cloneDeep(response.skill_id_to_rubrics_dict)
          });
        }
      }, (errorResponse) => {
        if (errorCallback) {
          errorCallback(errorResponse.error);
        }
      });
  }

  fetchTopic(topicId: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._fetchTopic(topicId, resolve, reject);
    });
  }

  fetchStories(topicId: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._fetchStories(topicId, resolve, reject);
    });
  }

  fetchSubtopicPage(topicId: string, subtopicId: number): Promise<Object> {
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
  updateTopic(topicId: string, topicVersion: string, commitMessage: string,
      changeList: Array<Object>): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._updateTopic(topicId, topicVersion, commitMessage,
        changeList, resolve, reject);
    });
  }

  deleteTopic(topicId: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._deleteTopic(topicId, resolve, reject);
    });
  }
}

angular.module('oppia').factory('EditableTopicBackendApiService',
  downgradeInjectable(EditableTopicBackendApiService));
