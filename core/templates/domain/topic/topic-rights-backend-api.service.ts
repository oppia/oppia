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
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { TopicRightsBackendDict, TopicRightsObjectFactory } from
  'domain/topic/TopicRightsObjectFactory';
import { TopicDomainConstants } from
  'domain/topic/topic-domain.constants';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

@Injectable({
  providedIn: 'root'
})
export class TopicRightsBackendApiService {
  constructor(
    private http: HttpClient,
    private topicRightsObjectFactory:
      TopicRightsObjectFactory,
    private urlInterpolation: UrlInterpolationService) {}

  private _fetchTopicRights(
      topicId: string,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: string) => void): void {
    var topicRightsUrl = this.urlInterpolation.interpolateUrl(
      TopicDomainConstants.TOPIC_RIGHTS_URL_TEMPLATE, {
        topic_id: topicId
      });
    this.http.get<TopicRightsBackendDict>(topicRightsUrl).toPromise().then(
      (response) => {
        let res =
          this.topicRightsObjectFactory.createFromBackendDict(response);
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

    this.http.put<number>(
      changeTopicStatusUrl, putParams).toPromise().then(
      (response) => {
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

    this.http.put<number>(sendMailUrl, putParams).toPromise().then(
      (response) => {
        if (successCallback) {
          successCallback();
        }
      }, (error) => {
        if (errorCallback) {
          errorCallback(error);
        }
      });
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
   * Publishes a topic.
   */
  publishTopic(topicId: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._setTopicStatus(topicId, true, resolve, reject);
    });
  }

  sendMail(topicId: string, topicName: string): Promise<Object> {
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
