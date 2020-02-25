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
 * @fileoverview Service to get subtopic data.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import cloneDeep from 'lodash/cloneDeep';

import { ReadOnlySubtopicPageObjectFactory } from
  'domain/subtopic_viewer/ReadOnlySubtopicPageObjectFactory';
import { SubtopicViewerDomainConstants } from
  'domain/subtopic_viewer/subtopic-viewer-domain.constants';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

@Injectable({
  providedIn: 'root'
})
export class SubtopicViewerBackendApiService {
  constructor(
    private http: HttpClient,
    private readOnlySubtopicPageFactory: ReadOnlySubtopicPageObjectFactory,
    private urlInterpolation: UrlInterpolationService) {}

  private _fetchSubtopicData(
      topicName: string, subtopicId: string,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: any) => void): void {
    var subtopicDataUrl = this.urlInterpolation.interpolateUrl(
      SubtopicViewerDomainConstants.SUBTOPIC_DATA_URL_TEMPLATE, {
        topic_name: topicName,
        subtopic_id: subtopicId
      });

    this.http.get(subtopicDataUrl).toPromise().then((response) => {
      let subtopicDataObject =
      this.readOnlySubtopicPageFactory.createFromBackendDict(
        cloneDeep(response)
      );
      if (successCallback) {
        successCallback(subtopicDataObject);
      }
    }, (errorResponse) => {
      if (errorCallback) {
        errorCallback(errorResponse);
      }
    });
  }

  fetchSubtopicData(topicName: string, subtopicId: string): Promise<object> {
    return new Promise((resolve, reject) => {
      this._fetchSubtopicData(topicName, subtopicId, resolve, reject);
    });
  }
}

angular.module('oppia').factory(
  'SubtopicViewerBackendApiService',
  downgradeInjectable(SubtopicViewerBackendApiService));
