// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to serve as the interface for fetching and uploading
 * assets from Google Cloud Storage.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { AppConstants } from 'app.constants';
import { AudioFile, AudioFileObjectFactory } from
  'domain/utilities/AudioFileObjectFactory';
import { FileDownloadRequest, FileDownloadRequestObjectFactory } from
  'domain/utilities/FileDownloadRequestObjectFactory';
import { ImageFile, ImageFileObjectFactory } from
  'domain/utilities/ImageFileObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { CsrfTokenService } from 'services/csrf-token.service';

import { share } from 'rxjs/operators';

const Constants = require('constants.ts');

interface PendingRequestsType {
  audio: FileDownloadRequest[];
  image: FileDownloadRequest[];
}

@Injectable({
  providedIn: 'root'
})
export class AssetsBackendApiService {
  private readonly assetTypeToDownloadUrlTemplate: ReadonlyMap<string, string>;
  private audioFilesCurrentlyBeingRequested: FileDownloadRequest[];
  private imageFilesCurrentlyBeingRequested: FileDownloadRequest[];
  private assetsCache: Map<string, Blob>;

  constructor(
      private http: HttpClient,
      private audioFileObjectFactory: AudioFileObjectFactory,
      private csrfTokenService: CsrfTokenService,
      private fileDownloadRequestObjectFactory:
        FileDownloadRequestObjectFactory,
      private imageFileObjectFactory: ImageFileObjectFactory,
      private urlInterpolationService: UrlInterpolationService) {
    if (!Constants.DEV_MODE && !Constants.GCS_RESOURCE_BUCKET_NAME) {
      throw new Error('GCS_RESOURCE_BUCKET_NAME is not set in prod.');
    }

    const gcsPrefix = Constants.DEV_MODE ? '/assetsdevhandler' : (
      'https://storage.googleapis.com/' + Constants.GCS_RESOURCE_BUCKET_NAME);
    const audioDownloadUrlTemplate = (
      gcsPrefix + '/<entity_type>/<entity_id>/assets/audio/<filename>');
    const imageDownloadUrlTemplate = (
      gcsPrefix + '/<entity_type>/<entity_id>/assets/image/<filename>');
    const thumbnailDownloadUrlTemplate = (
      gcsPrefix + '/<entity_type>/<entity_id>/assets/thumbnail/<filename>');

    this.assetTypeToDownloadUrlTemplate = new Map([
      [AppConstants.ASSET_TYPE_AUDIO, audioDownloadUrlTemplate],
      [AppConstants.ASSET_TYPE_IMAGE, imageDownloadUrlTemplate],
      [AppConstants.ASSET_TYPE_THUMBNAIL, thumbnailDownloadUrlTemplate],
    ]);

    // List of filenames that have been requested but haven't completed yet.
    this.audioFilesCurrentlyBeingRequested = [];
    this.imageFilesCurrentlyBeingRequested = [];

    // Map from asset filename to asset blob.
    this.assetsCache = new Map();
  }

  private fetchFile(
      entityType: string, entityId: string, filename: string,
      assetType: string): Promise<AudioFile | ImageFile> {
    const coldObservable = this.http.get(
      this.getDownloadUrl(entityType, entityId, filename, assetType), {
        responseType: 'blob', observe: 'body'
      });
    // To avoid duplicating HTTP requests when creating the subscription and
    // promise, we need to use this pipe to ensure they both "share" the value
    // by making the observable "hot".
    // To learn more, see: https://stackoverflow.com/a/49208686/4859885.
    const hotObservable = coldObservable.pipe(share());

    this.getAssetsFilesCurrentlyBeingRequestedByType(assetType).push(
      this.fileDownloadRequestObjectFactory.createNew(
        filename, hotObservable.subscribe(
          data => {
            const assetBlob = new Blob([data], {type: data.type});
            this.assetsCache.set(filename, assetBlob);
            this.removeFromFilesCurrentlyBeingRequested(filename, assetType);
          },
          (_) => {
            this.removeFromFilesCurrentlyBeingRequested(filename, assetType);
          },
          () => {
            this.removeFromFilesCurrentlyBeingRequested(filename, assetType);
          })));

    return hotObservable.toPromise().then(
      blob => {
        const objectFactory = assetType === AppConstants.ASSET_TYPE_AUDIO ?
          this.audioFileObjectFactory : this.imageFileObjectFactory;
        return objectFactory.createNew(filename, blob);
      },
      () => Promise.reject(filename));
  }

  private getAssetsFilesCurrentlyBeingRequestedByType(
      assetType: string): FileDownloadRequest[] {
    return assetType === AppConstants.ASSET_TYPE_AUDIO ?
      this.audioFilesCurrentlyBeingRequested :
      this.imageFilesCurrentlyBeingRequested;
  }

  private abortAllCurrentDownloads(assetType: string): void {
    const array = this.getAssetsFilesCurrentlyBeingRequestedByType(assetType);
    array.forEach(request => request.subscription.unsubscribe());
    array.length = 0;
  }

  private removeFromFilesCurrentlyBeingRequested(
      filename: string, assetType: string): void {
    const array = this.getAssetsFilesCurrentlyBeingRequestedByType(assetType);
    const index = array.findIndex(r => r.filename === filename);
    if (index !== -1) {
      array.splice(index, 1);
    }
  }

  private getDownloadUrl(
      entityType: string, entityId: string, filename: string,
      assetType: string): string {
    const urlTemplate: string = (
      this.assetTypeToDownloadUrlTemplate.get(assetType));
    return this.urlInterpolationService.interpolateUrl(urlTemplate, {
      entity_id: entityId,
      entity_type: entityType,
      filename: filename
    });
  }

  private getAudioUploadUrl(explorationId: string): string {
    return this.urlInterpolationService.interpolateUrl(
      AppConstants.AUDIO_UPLOAD_URL_TEMPLATE, {exploration_id: explorationId});
  }

  loadAudio(explorationId: string, filename: string): Promise<AudioFile> {
    return new Promise((resolve, reject) => {
      if (this.isCached(filename)) {
        resolve(this.audioFileObjectFactory.createNew(
          filename, this.assetsCache.get(filename)));
      } else {
        this.fetchFile(
          AppConstants.ENTITY_TYPE.EXPLORATION, explorationId, filename,
          AppConstants.ASSET_TYPE_AUDIO
        ).then(resolve, reject);
      }
    });
  }

  loadImage(
      entityType: string, entityId: string,
      filename: string): Promise<ImageFile> {
    return new Promise((resolve, reject) => {
      if (this.isCached(filename)) {
        resolve(this.imageFileObjectFactory.createNew(
          filename, this.assetsCache.get(filename)));
      } else {
        this.fetchFile(
          entityType, entityId, filename, AppConstants.ASSET_TYPE_IMAGE
        ).then(resolve, reject);
      }
    });
  }

  async saveAudio(
      explorationId: string, filename: string,
      rawAssetData: Blob): Promise<string> {
    const form = new FormData();
    form.append('raw_audio_file', rawAssetData);
    form.append('payload', JSON.stringify({filename}));
    form.append('csrf_token', await this.csrfTokenService.getTokenAsync());
    return this.http.post<string>(this.getAudioUploadUrl(explorationId), form)
      .toPromise();
  }

  async saveMathExpresionImage(
      resampledFile: Blob, filename: string, entityType: string,
      entityId: string): Promise<string> {
    const form = new FormData();
    form.append('image', resampledFile);
    form.append(
      'payload', JSON.stringify({filename, filename_prefix: 'image'}));
    form.append('csrf_token', await this.csrfTokenService.getTokenAsync());
    return this.http.post<string>(
      this.urlInterpolationService.interpolateUrl(
        '/createhandler/imageupload/<entity_type>/<entity_id>', {
          entity_type: entityType,
          entity_id: entityId
        }), form).toPromise();
  }

  isCached(filename: string): boolean {
    return this.assetsCache.has(filename);
  }

  getAudioDownloadUrl(
      entityType: string, entityId: string, filename: string): string {
    return this.getDownloadUrl(
      entityType, entityId, filename, AppConstants.ASSET_TYPE_AUDIO);
  }

  abortAllCurrentAudioDownloads(): void {
    this.abortAllCurrentDownloads(AppConstants.ASSET_TYPE_AUDIO);
  }

  abortAllCurrentImageDownloads(): void {
    this.abortAllCurrentDownloads(AppConstants.ASSET_TYPE_IMAGE);
  }

  getAssetsFilesCurrentlyBeingRequested(): PendingRequestsType {
    return {
      audio: this.audioFilesCurrentlyBeingRequested,
      image: this.imageFilesCurrentlyBeingRequested
    };
  }

  getImageUrlForPreview(
      entityType: string, entityId: string, filename: string): string {
    return this.getDownloadUrl(
      entityType, entityId, filename, AppConstants.ASSET_TYPE_IMAGE);
  }

  getThumbnailUrlForPreview(
      entityType: string, entityId: string, filename: string): string {
    return this.getDownloadUrl(
      entityType, entityId, filename, AppConstants.ASSET_TYPE_THUMBNAIL);
  }
}

angular.module('oppia').factory(
  'AssetsBackendApiService', downgradeInjectable(AssetsBackendApiService));
