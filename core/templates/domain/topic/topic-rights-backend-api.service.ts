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
 * @fileoverview Service to change the rights of topic in the backend.
 */

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {TopicDomainConstants} from 'domain/topic/topic-domain.constants';
import {
  TopicRights,
  TopicRightsBackendDict,
} from 'domain/topic/topic-rights.model';

type TopicRightsCache = Record<string, TopicRights>;

@Injectable({
  providedIn: 'root',
})
export class TopicRightsBackendApiService {
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private httpClient: HttpClient
  ) {}

  topicRightsCache: TopicRightsCache = {};

  private _fetchTopicRights(
    topicId: string,
    successCallback: (value: TopicRights) => void,
    errorCallback: (reason?: string) => void
  ): void {
    let topicRightsUrl = this.urlInterpolationService.interpolateUrl(
      TopicDomainConstants.TOPIC_RIGHTS_URL_TEMPLATE,
      {
        topic_id: topicId,
      }
    );

    this.httpClient
      .get<TopicRightsBackendDict>(topicRightsUrl)
      .toPromise()
      .then(
        response => {
          let topicRights = TopicRights.createFromBackendDict(
            response as TopicRightsBackendDict
          );
          if (successCallback) {
            successCallback(topicRights);
          }
        },
        errorResponse => {
          if (errorCallback) {
            errorCallback(errorResponse.error.error);
          }
        }
      );
  }

  private _setTopicStatus(
    topicId: string,
    publishStatus: boolean,
    successCallback: () => void,
    errorCallback: (reason?: string) => void
  ): void {
    let changeTopicStatusUrl = this.urlInterpolationService.interpolateUrl(
      '/rightshandler/change_topic_status/<topic_id>',
      {
        topic_id: topicId,
      }
    );

    let putParams = {
      publish_status: publishStatus,
    };

    this.httpClient
      .put(changeTopicStatusUrl, putParams)
      .toPromise()
      .then(
        () => {
          if (this._isCached(topicId)) {
            if (publishStatus) {
              this.topicRightsCache[topicId].markTopicAsPublished();
            } else {
              this.topicRightsCache[topicId].markTopicAsUnpublished();
            }
          }
          if (successCallback) {
            successCallback();
          }
        },
        errorResponse => {
          if (errorCallback) {
            errorCallback(errorResponse.error.error);
          }
        }
      );
  }

  private _sendMail(
    topicId: string,
    topicName: string,
    successCallback: (value?: void) => void,
    errorCallback: (reason?: string) => void
  ): void {
    let sendMailUrl = this.urlInterpolationService.interpolateUrl(
      '/rightshandler/send_topic_publish_mail/<topic_id>',
      {
        topic_id: topicId,
      }
    );

    let putParams = {
      topic_name: topicName,
    };

    this.httpClient
      .put(sendMailUrl, putParams)
      .toPromise()
      .then(
        response => {
          if (successCallback) {
            successCallback();
          }
        },
        errorResponse => {
          if (errorCallback) {
            errorCallback(errorResponse.error.error);
          }
        }
      );
  }

  private _isCached(topicId: string): boolean {
    return this.topicRightsCache.hasOwnProperty(topicId);
  }

  async fetchTopicRightsAsync(topicId: string): Promise<TopicRights> {
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
  async loadTopicRightsAsync(topicId: string): Promise<TopicRights> {
    return new Promise((resolve, reject) => {
      if (this._isCached(topicId)) {
        if (resolve) {
          resolve(this.topicRightsCache[topicId]);
        }
      } else {
        this._fetchTopicRights(
          topicId,
          topicRights => {
            // Save the fetched topic rights to avoid future fetches.
            this.topicRightsCache[topicId] = topicRights;
            if (resolve) {
              resolve(this.topicRightsCache[topicId]);
            }
          },
          reject
        );
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
  cacheTopicRights(topicId: string, topicRights: TopicRights): void {
    this.topicRightsCache[topicId] = topicRights;
  }

  /**
   * Publishes a topic.
   */
  async publishTopicAsync(topicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this._setTopicStatus(topicId, true, resolve, reject);
    });
  }

  async sendMailAsync(topicId: string, topicName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this._sendMail(topicId, topicName, resolve, reject);
    });
  }

  /**
   * Unpublishes a topic.
   */
  async unpublishTopicAsync(topicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this._setTopicStatus(topicId, false, resolve, reject);
    });
  }
}
