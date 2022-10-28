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
 * @fileoverview Service to serve as the interface for fetching classifier
 * data file name from backend.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { Buffer } from 'buffer';
import { unzipSync } from 'zlib';

import { AppConstants } from 'app.constants';
import { Classifier } from 'domain/classifier/classifier.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';

interface ClassifierMetaDataBackendDict {
  'algorithm_id': string;
  'algorithm_version': number;
  'gcs_filename': string;
}

export interface ClassifierMetaData {
  algorithmId: string;
  algorithmVersion: number;
  filename: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClassifierDataBackendApiService {
  private readonly classifierDataDownloadUrlTemplate: string;

  constructor(
      private http: HttpClient,
      private urlInterpolationService: UrlInterpolationService) {
    if (
      !ClassifierDataBackendApiService.DEV_MODE &&
      !ClassifierDataBackendApiService.GCS_RESOURCE_BUCKET_NAME) {
      throw new Error('GCS_RESOURCE_BUCKET_NAME is not set in prod.');
    }

    const urlPrefix = ClassifierDataBackendApiService.DEV_MODE ?
      '/_ah/gcs/' : 'https://storage.googleapis.com/';
    this.classifierDataDownloadUrlTemplate = (
      urlPrefix + ClassifierDataBackendApiService.GCS_RESOURCE_BUCKET_NAME +
      '/<entity_type>/<entity_id>/assets/<filename>');
  }

  static get DEV_MODE(): boolean {
    return AppConstants.DEV_MODE;
  }

  static get GCS_RESOURCE_BUCKET_NAME(): string {
    return AppConstants.GCS_RESOURCE_BUCKET_NAME;
  }

  private _getDownloadUrl(
      entityType: string, entityId: string, filename: string): string {
    return this.urlInterpolationService.interpolateUrl(
      this.classifierDataDownloadUrlTemplate, {
        entity_type: entityType,
        entity_id: entityId,
        filename: filename,
      });
  }

  private async getClassifierMetadataAsync(
      explorationId: string, explorationVersion: number,
      stateName: string): Promise<ClassifierMetaData> {
    return new Promise((resolve, reject) => {
      this.http.get<ClassifierMetaDataBackendDict>(
        '/ml/trainedclassifierhandler', {
          params: {
            exploration_id: explorationId,
            exploration_version: explorationVersion.toString(),
            state_name: stateName
          },
          responseType: 'json'
        }).toPromise().then(response => {
        resolve({
          algorithmId: response.algorithm_id,
          algorithmVersion: response.algorithm_version,
          filename: response.gcs_filename
        });
      }, errorResponse => {
        reject(errorResponse);
      });
    });
  }

  async getClassifierDataAsync(
      explorationId: string, explorationVersion: number,
      stateName: string): Promise<Classifier> {
    return new Promise((resolve, reject) => {
      this.getClassifierMetadataAsync(
        explorationId, explorationVersion, stateName).then(
        response => {
          let classifierMetaData = response;
          this.http.get(
            this._getDownloadUrl(
              AppConstants.ENTITY_TYPE.EXPLORATION, explorationId,
              response.filename), {
              responseType: 'arraybuffer'
            }).toPromise().then(response => {
            resolve(new Classifier(
              classifierMetaData.algorithmId,
              unzipSync(Buffer.from(response)),
              classifierMetaData.algorithmVersion
            ));
          }, classifierErrorResponse => {
            reject(classifierErrorResponse);
          });
        }, classifierMetadataErrorResponse => {
          reject(classifierMetadataErrorResponse);
        });
    });
  }
}

angular.module('oppia').factory(
  'ClassifierDataBackendApiService',
  downgradeInjectable(ClassifierDataBackendApiService));
