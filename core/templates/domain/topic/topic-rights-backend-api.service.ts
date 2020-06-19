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
 * @fileoverview Service to change the rights of topic in the backend.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

import { TopicDomainConstants } from
  'domain/topic/topic-domain.constants';
import cloneDeep from 'lodash/cloneDeep';

import { ITopicRightsBackendDataDict, TopicRightsResponseObjectFactory } from
  'domain/topic/TopicRightsResponseObjectFactory';

@Injectable({
  providedIn: 'root'
})
export class TopicRightsBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolation: UrlInterpolationService,
    private topicRightsResponseObjectFactory: TopicRightsResponseObjectFactory) {}
  // Maps previously loaded topic rights to their IDs.
  private topicRightsCache = {};

  private _fetchTopicRights(
      topicId: string,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: string) => void): void {
    var topicRightsUrl = this.urlInterpolation.interpolateUrl(
      TopicDomainConstants.TOPIC_RIGHTS_URL_TEMPLATE, {
        topic_id: topicId
      });
    console.log(topicRightsUrl);

    this.http.get(topicRightsUrl).toPromise().then(
      (response: ITopicRightsBackendDataDict) => {
        console.log(typeof(response));
        console.log(response, "c2");
        console.log(successCallback);
        let res = this.topicRightsResponseObjectFactory.createFromBackendDict(response);
        if (successCallback) {
          successCallback(res);
        }
      }, (error) => {
        if (errorCallback) {
          errorCallback(error);
        }
      });
  }

  private _setTopicStatus(
      topicId: string,
      publishStatus: boolean,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: string) => void): void {
    var changeTopicStatusUrl = this.urlInterpolation.interpolateUrl(
      '/rightshandler/change_topic_status/<topic_id>', {
        topic_id: topicId
      });

    var putParams = {
      publish_status: publishStatus
    };

    this.http.put(
      changeTopicStatusUrl, putParams).toPromise().then(
      (response: number) => {
        this.topicRightsCache[topicId] = response;
        if (successCallback) {
          successCallback(response);
        }
      }, (error) => {
        if (errorCallback) {
          errorCallback(error);
        }
      });
  }

  private _sendMail(
      topicId: string,
      topicName: string,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: string) => void): void {
    var sendMailUrl = this.urlInterpolation.interpolateUrl(
      '/rightshandler/send_topic_publish_mail/<topic_id>', {
        topic_id: topicId
      });

    var putParams = {
      topic_name: topicName
    };

    this.http.put(sendMailUrl, putParams).toPromise().then(
      (response: number) => {
        if (successCallback) {
          successCallback();
        }
      }, (error) => {
        if (errorCallback) {
          errorCallback(error);
        }
      });
  }

  private _isCached(
      topicId: string): boolean {
    return this.topicRightsCache.hasOwnProperty(topicId);
  }

  /**
   * Gets a topic's rights, given its ID.
   */
  fetchTopicRights(topicId: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._fetchTopicRights(topicId, resolve, reject);
    });
  }

  /**
   * Behaves exactly as fetchTopicRights (including callback
   * behavior and returning a promise object), except this function will
   * attempt to see whether the given topic rights has been
   * cached. If it has not yet been cached, it will fetch the topic
   * rights from the backend. If it successfully retrieves the topic
   * rights from the backend, it will store it in the cache to avoid
   * requests from the backend in further function calls.
   */
  loadTopicRights(topicId: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      if (this._isCached(topicId)) {
        if (resolve) {
          resolve(this.topicRightsCache[topicId]);
        }
      } else {
        this._fetchTopicRights(topicId, (topicRights) => {
          // Save the fetched topic rights to avoid future fetches.
          this.topicRightsCache[topicId] = topicRights;
          if (resolve) {
            resolve(this.topicRightsCache[topicId]);
          }
        }, reject);
      }
    });
  }

  /**
   * Returns whether the given topic rights is stored within the
   * local data cache or if it needs to be retrieved from the backend
   * upon a laod.
   */
  isCached(topicId: string): boolean {
    return this._isCached(topicId);
  }

  /**
   * Replaces the current topic rights in the cache given by the
   * specified topic ID with a new topic rights object.
   */
  cacheTopicRights(topicId: string, topicRights: any): void {
    this.topicRightsCache[topicId] = cloneDeep(topicRights);
  }

  /**
   * Publishes a topic.
   */
  publishTopic(topicId: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._setTopicStatus(topicId, true, resolve, reject);
    });
  }

  sendMail(topicId: string, topicName): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._sendMail(topicId, topicName, resolve, reject);
    });
  }

  /**
   * Unpublishes a topic.
   */
  unpublishTopic(topicId: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._setTopicStatus(topicId, false, resolve, reject);
    });
  }
}

angular.module('oppia').factory(
  'TopicRightsBackendApiService',
  downgradeInjectable(TopicRightsBackendApiService));
