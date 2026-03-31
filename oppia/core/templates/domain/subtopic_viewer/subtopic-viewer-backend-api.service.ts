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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {
  ReadOnlySubtopicPageData,
  SubtopicDataBackendDict,
} from 'domain/subtopic_viewer/read-only-subtopic-page-data.model';
import {SubtopicViewerDomainConstants} from 'domain/subtopic_viewer/subtopic-viewer-domain.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

@Injectable({
  providedIn: 'root',
})
export class SubtopicViewerBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolation: UrlInterpolationService
  ) {}

  private _fetchSubtopicData(
    topicUrlFragment: string,
    classroomUrlFragment: string,
    subtopicUrlFragment: string,
    successCallback: (value: ReadOnlySubtopicPageData) => void,
    errorCallback: (reason: string) => void
  ): void {
    var subtopicDataUrl = this.urlInterpolation.interpolateUrl(
      SubtopicViewerDomainConstants.SUBTOPIC_DATA_URL_TEMPLATE,
      {
        topic_url_fragment: topicUrlFragment,
        classroom_url_fragment: classroomUrlFragment,
        subtopic_url_fragment: subtopicUrlFragment,
      }
    );

    this.http
      .get<SubtopicDataBackendDict>(subtopicDataUrl)
      .toPromise()
      .then(
        response => {
          let subtopicDataObject =
            ReadOnlySubtopicPageData.createFromBackendDict(response);
          if (successCallback) {
            successCallback(subtopicDataObject);
          }
        },
        errorResponse => {
          if (errorCallback) {
            errorCallback(errorResponse.error.error);
          }
        }
      );
  }

  async fetchSubtopicDataAsync(
    topicUrlFragment: string,
    classroomUrlFragment: string,
    subtopicUrlFragment: string
  ): Promise<ReadOnlySubtopicPageData> {
    return new Promise((resolve, reject) => {
      this._fetchSubtopicData(
        topicUrlFragment,
        classroomUrlFragment,
        subtopicUrlFragment,
        resolve,
        reject
      );
    });
  }
}
