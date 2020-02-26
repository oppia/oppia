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
 * @fileoverview Service to get classroom data.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ClassroomDomainConstants } from
  'domain/classroom/classroom-domain.constants';
import { TopicSummaryObjectFactory } from
  'domain/topic/TopicSummaryObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

@Injectable({
  providedIn: 'root'
})
export class ClassroomBackendApiService {
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'subtopicDataBackendDict' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  topicSummaryObjects: any = null;
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private http: HttpClient,
    private topicSummaryObjectFactory: TopicSummaryObjectFactory
  ) {}

  _fetchClassroomData(classroomName: string,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: any) => void): void {
    let classroomDataUrl = this.urlInterpolationService.interpolateUrl(
      ClassroomDomainConstants.CLASSROOOM_DATA_URL_TEMPLATE, {
        classroom_name: classroomName
      });

    this.http.get(classroomDataUrl).toPromise().then((data: any) => {
      this.topicSummaryObjects = data.topic_summary_dicts.map(
        (summaryDict) => {
          return this.topicSummaryObjectFactory.createFromBackendDict(
            summaryDict);
        }
      );
      if (successCallback) {
        successCallback(this.topicSummaryObjects);
      }
    }, (error: any) => {
      if (errorCallback) {
        errorCallback(error);
      }
    });
  }

  fetchClassroomData(classroomName: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._fetchClassroomData(classroomName, resolve, reject);
    });
  }
}

angular.module('oppia').factory(
  'ClassroomBackendApiService',
  downgradeInjectable(ClassroomBackendApiService));
