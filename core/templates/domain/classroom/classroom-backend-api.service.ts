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
import { EventEmitter, Injectable } from '@angular/core';

import { ClassroomDomainConstants } from
  'domain/classroom/classroom-domain.constants';
import {
  ClassroomData
} from 'domain/classroom/classroom-data.model';
import { CreatorTopicSummaryBackendDict } from
  'domain/topic/creator-topic-summary.model';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

interface ClassroomPromosStatusBackendDict {
  'classroom_promos_are_enabled': boolean;
}

interface ClassroomDataBackendDict {
  'name': string;
  'topic_summary_dicts': CreatorTopicSummaryBackendDict[];
  'course_details': string;
  'topic_list_intro': string;
}

@Injectable({
  providedIn: 'root'
})
export class ClassroomBackendApiService {
  // This property is initialized using ClassroomData model and can be undefined
  // but not null so we need to do non-undefined assertion, for more
  // information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  classroomData!: ClassroomData;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private http: HttpClient
  ) {}

  private _initializeTranslationEventEmitter = new EventEmitter<void>();

  _fetchClassroomData(
      classroomUrlFragment: string,
      successCallback: (value: ClassroomData) => void,
      errorCallback: (reason: string) => void): void {
    let classroomDataUrl = this.urlInterpolationService.interpolateUrl(
      ClassroomDomainConstants.CLASSROOOM_DATA_URL_TEMPLATE, {
        classroom_url_fragment: classroomUrlFragment
      });
    this.http.get<ClassroomDataBackendDict>(
      classroomDataUrl).toPromise().then(response => {
      this.classroomData = (
        ClassroomData.createFromBackendData(
          response.name,
          response.topic_summary_dicts,
          response.course_details,
          response.topic_list_intro));
      if (successCallback) {
        successCallback(this.classroomData);
      }
    }, errorResponse => {
      if (errorCallback) {
        errorCallback(errorResponse.error.error);
      }
    });
  }

  _fetchClassroomPromosAreEnabledStatus(
      successCallback: (value: boolean) => void,
      errorCallback: (reason: string) => void): void {
    const classroomPromosAreEnabledStatusHandlerUrl = (
      '/classroom_promos_status_handler');

    this.http.get<ClassroomPromosStatusBackendDict>(
      classroomPromosAreEnabledStatusHandlerUrl).toPromise().then(data => {
      if (successCallback) {
        successCallback(data.classroom_promos_are_enabled);
      }
    }, errorResponse => {
      if (errorCallback) {
        errorCallback(errorResponse.error.error);
      }
    });
  }

  async fetchClassroomDataAsync(
      classroomUrlFragment: string
  ): Promise<ClassroomData> {
    return new Promise((resolve, reject) => {
      this._fetchClassroomData(classroomUrlFragment, resolve, reject);
    });
  }

  async fetchClassroomPromosAreEnabledStatusAsync(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this._fetchClassroomPromosAreEnabledStatus(resolve, reject);
    });
  }

  get onInitializeTranslation(): EventEmitter<void> {
    return this._initializeTranslationEventEmitter;
  }
}

angular.module('oppia').factory(
  'ClassroomBackendApiService',
  downgradeInjectable(ClassroomBackendApiService));
