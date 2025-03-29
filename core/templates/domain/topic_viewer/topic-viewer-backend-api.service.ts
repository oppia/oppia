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

import {} from '@angular/upgrade/static';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {
  ReadOnlyTopic,
  ReadOnlyTopicBackendDict,
  ReadOnlyTopicObjectFactory,
} from 'domain/topic_viewer/read-only-topic-object.factory';
import {TopicViewerDomainConstants} from 'domain/topic_viewer/topic-viewer-domain.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

@Injectable({
  providedIn: 'root',
})
export class TopicViewerBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolation: UrlInterpolationService
  ) {}

  private _fetchTopicData(
    topicUrlFragment: string,
    classroomUrlFragment: string,
    successCallback: (value: ReadOnlyTopic) => void,
    errorCallback: (reason: string) => void
  ): void {
    const topicDataUrl = this.urlInterpolation.interpolateUrl(
      TopicViewerDomainConstants.TOPIC_DATA_URL_TEMPLATE,
      {
        topic_url_fragment: topicUrlFragment,
        classroom_url_fragment: classroomUrlFragment,
      }
    );
    var readOnlyTopicObjectFactory = new ReadOnlyTopicObjectFactory();
    this.http
      .get<ReadOnlyTopicBackendDict>(topicDataUrl)
      .toPromise()
      .then(
        response => {
          let readOnlyTopic =
            readOnlyTopicObjectFactory.createFromBackendDict(response);
          if (successCallback) {
            successCallback(readOnlyTopic);
          }
        },
        errorResponse => {
          if (errorCallback) {
            errorCallback(errorResponse.error.error);
          }
        }
      );
  }

  async fetchTopicDataAsync(
    topicUrlFragment: string,
    classroomUrlFragment: string
  ): Promise<ReadOnlyTopic> {
    return new Promise((resolve, reject) => {
      this._fetchTopicData(
        topicUrlFragment,
        classroomUrlFragment,
        resolve,
        reject
      );
    });
  }
}
