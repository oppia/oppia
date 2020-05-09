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
 * @fileoverview Service to get topic data.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ReadOnlyTopicObjectFactory } from
  'domain/topic_viewer/read-only-topic-object.factory';
import { SkillSummaryObjectFactory } from
  'domain/skill/SkillSummaryObjectFactory';
import { SubtopicObjectFactory } from 'domain/topic/SubtopicObjectFactory';
import { TopicViewerDomainConstants } from
  'domain/topic_viewer/topic-viewer-domain.constants';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

@Injectable({
  providedIn: 'root'
})
export class TopicViewerBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolation: UrlInterpolationService) {}

  private readOnlyTopicObjectFactory = null;
  private readOnlyTopic = null;
  private topicDataDict = null;
  private _fetchTopicData(
      topicName: string,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: any) => void
  ): void {
    const topicDataUrl = this.urlInterpolation.interpolateUrl(
      TopicViewerDomainConstants.TOPIC_DATA_URL_TEMPLATE, {
        topic_name: topicName
      });
    var readOnlyTopicObjectFactory = new ReadOnlyTopicObjectFactory(
      new SubtopicObjectFactory(new SkillSummaryObjectFactory()),
      new SkillSummaryObjectFactory());
    this.http.get(
      topicDataUrl, { observe: 'response' }).toPromise().then(
      (response) => {
        this.topicDataDict = Object.assign({}, response.body);
        this.readOnlyTopic = readOnlyTopicObjectFactory.createFromBackendDict(
          this.topicDataDict);
        if (successCallback) {
          successCallback(this.readOnlyTopic);
        }
      }, (errorResponse) => {
        if (errorCallback) {
          errorCallback(errorResponse.error);
        }
      });
  }

  fetchTopicData(topicName: string): Promise<object> {
    return new Promise((resolve, reject) => {
      this._fetchTopicData(topicName, resolve, reject);
    });
  }
}

angular.module('oppia').factory(
  'TopicViewerBackendApiService', downgradeInjectable(
    TopicViewerBackendApiService));
