// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for fetching svg.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dimensions } from './svg-editor.component';
import { ImageUploadHelperService } from 'services/image-upload-helper.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';

@Injectable({
  providedIn: 'root'
})
export class SvgFileFetcherBackendApiService {
  constructor(
    private httpClient: HttpClient,
    private imageUploadHelperService: ImageUploadHelperService,
    private urlInterpolationService: UrlInterpolationService) { }

  fetchSvg(savedSvgUrl: string): Observable<string> {
    return this.httpClient.get(savedSvgUrl, {
      responseType: 'text'
    });
  }

  postSvgFile(
      resampledFile: Blob,
      dimensions: Dimensions,
      entityType: string,
      entityId: string
  ): Observable<{filename: string}> {
    let form = new FormData();
    form.append('image', resampledFile);
    form.append('payload', JSON.stringify({
      filename: this.imageUploadHelperService.generateImageFilename(
        dimensions.height, dimensions.width, 'svg')})
    );
    var imageUploadUrlTemplate = (
      '/createhandler/imageupload/<entity_type>/<entity_id>');
    return this.httpClient.post<{filename: string}>(
      this.urlInterpolationService.interpolateUrl(
        imageUploadUrlTemplate, {
          entity_type: entityType,
          entity_id: entityId
        }
      ), form);
  }
}
