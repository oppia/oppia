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
  ClassroomData,
  ClassroomDataObjectFactory
} from 'domain/classroom/ClassroomDataObjectFactory';
import { TopicSummaryBackendDict } from
  'domain/topic/TopicSummaryObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

interface ClassroomStatusBackendDict {
  'classroom_page_is_shown': boolean;
}

interface ClassroomDataBackendDict {
  name: string,
  'topic_summary_dicts': TopicSummaryBackendDict[],
  'course_details': string,
  'topic_list_intro': string
}

@Injectable({
  providedIn: 'root'
})
export class ClassroomBackendApiService {
  classroomData: ClassroomData = null;
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private http: HttpClient,
    private classroomDataObjectFactory: ClassroomDataObjectFactory
  ) {}

  private _initializeTranslationEventEmitter = new EventEmitter();

  _fetchClassroomData(classroomName: string,
      successCallback: (value: ClassroomData) => void,
      errorCallback: (reason: string) => void): void {
    let classroomDataUrl = this.urlInterpolationService.interpolateUrl(
      ClassroomDomainConstants.CLASSROOOM_DATA_URL_TEMPLATE, {
        classroom_name: classroomName
      });

    this.http.get<ClassroomDataBackendDict>(
      classroomDataUrl).toPromise().then(response => {
      this.classroomData = (
        this.classroomDataObjectFactory.createFromBackendData(
          response.name, response.topic_summary_dicts, response.course_details,
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

  _fetchClassroomPageIsShownStatus(
      successCallback: (value: boolean) => void,
      errorCallback: (reason: string) => void): void {
    const classroomStatusHandlerUrl = '/classroom_page_status_handler';

    this.http.get<ClassroomStatusBackendDict>(
      classroomStatusHandlerUrl).toPromise().then(data => {
      if (successCallback) {
        successCallback(data.classroom_page_is_shown);
      }
    }, errorResponse => {
      if (errorCallback) {
        errorCallback(errorResponse.error.error);
      }
    });
  }

  fetchClassroomData(classroomName: string): Promise<ClassroomData> {
    return new Promise((resolve, reject) => {
      this._fetchClassroomData(classroomName, resolve, reject);
    });
  }

  fetchClassroomPageIsShownStatus(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this._fetchClassroomPageIsShownStatus(resolve, reject);
    });
  }

  get onInitializeTranslation() {
    return this._initializeTranslationEventEmitter;
  }
}

angular.module('oppia').factory(
  'ClassroomBackendApiService',
  downgradeInjectable(ClassroomBackendApiService));
