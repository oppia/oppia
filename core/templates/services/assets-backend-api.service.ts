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
 * @fileoverview Service to serve as the interface for fetching and uploading
 * assets from Google Cloud Storage.
 */

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { AppConstants } from 'app.constants';
import { AudioFile } from 'domain/utilities/audio-file.model';
import { FileDownloadRequest } from 'domain/utilities/file-download-request.model';
import { ImageFile } from 'domain/utilities/image-file.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Observable } from 'rxjs';
import { CsrfTokenService } from 'services/csrf-token.service';

interface SaveAudioResponse {
  'filename': string;
  'duration_secs': number;
}

interface SaveImageResponse {
  'filename': string;
}

@Injectable({
  providedIn: 'root'
})
export class AssetsBackendApiService {
  public readonly profileImagePngUrlTemplate: string;
  public readonly profileImageWebpUrlTemplate: string;
  private readonly downloadUrlTemplate: string;

  /** List of audio files that have been requested but have not returned. */
  private audioFileDownloadRequests: FileDownloadRequest[] = [];
  /** List of image files that have been requested but have not returned. */
  private imageFileDownloadRequests: FileDownloadRequest[] = [];
  /** Map from asset filename to asset blob. */
  private assetsCache: Map<string, Blob> = new Map();

  constructor(
      private csrfTokenService: CsrfTokenService,
      private http: HttpClient,
      private urlInterpolationService: UrlInterpolationService) {
    let urlPrefix = '/assetsdevhandler';
    if (!AssetsBackendApiService.EMULATOR_MODE) {
      urlPrefix = (
        'https://storage.googleapis.com/' +
        AssetsBackendApiService.GCS_RESOURCE_BUCKET_NAME
      );
    }
    this.downloadUrlTemplate = (
      urlPrefix + '/<entity_type>/<entity_id>/assets/<asset_type>/<filename>');
    this.profileImagePngUrlTemplate = (
      urlPrefix + '/user/<username>/assets/profile_picture.png');
    this.profileImageWebpUrlTemplate = (
      urlPrefix + '/user/<username>/assets/profile_picture.webp');
  }

  static get EMULATOR_MODE(): boolean {
    return AppConstants.EMULATOR_MODE;
  }

  static get GCS_RESOURCE_BUCKET_NAME(): string {
    return AppConstants.GCS_RESOURCE_BUCKET_NAME;
  }

  async loadAudio(explorationId: string, filename: string): Promise<AudioFile> {
    let data = this.assetsCache.get(filename);
    if (this.isCached(filename) && data !== undefined) {
      return new AudioFile(filename, data);
    }
    return this.fetchFile(
      AppConstants.ENTITY_TYPE.EXPLORATION, explorationId, filename,
      AppConstants.ASSET_TYPE_AUDIO);
  }

  async loadImage(
      entityType: string, entityId: string,
      filename: string): Promise<ImageFile> {
    let data = this.assetsCache.get(filename);
    if (this.isCached(filename) && data !== undefined) {
      return new ImageFile(filename, data);
    }
    return this.fetchFile(
      entityType, entityId, filename, AppConstants.ASSET_TYPE_IMAGE);
  }

  async saveAudio(
      explorationId: string, filename: string,
      rawAssetData: Blob): Promise<SaveAudioResponse> {
    const form = new FormData();
    form.append('raw_audio_file', rawAssetData);
    form.append('payload', JSON.stringify({filename}));
    form.append('csrf_token', await this.csrfTokenService.getTokenAsync());
    try {
      return await this.http.post<SaveAudioResponse>(
        this.getAudioUploadUrl(explorationId), form).toPromise();
    // We use unknown type because we are unsure of the type of error
    // that was thrown. Since the catch block cannot identify the
    // specific type of error, we are unable to further optimise the
    // code by introducing more types of errors.
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse) {
        return Promise.reject(error.error);
      }
      throw error;
    }
  }

  async saveMathExpressionImage(
      resampledFile: Blob, filename: string, entityType: string,
      entityId: string): Promise<SaveImageResponse> {
    const form = new FormData();
    form.append('image', resampledFile);
    form.append(
      'payload', JSON.stringify({filename, filename_prefix: 'image'}));
    form.append('csrf_token', await this.csrfTokenService.getTokenAsync());
    try {
      return await this.http.post<SaveImageResponse>(
        this.getImageUploadUrl(entityType, entityId), form).toPromise();
    // We use unknown type because we are unsure of the type of error
    // that was thrown. Since the catch block cannot identify the
    // specific type of error, we are unable to further optimise the
    // code by introducing more types of errors.
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse) {
        return Promise.reject(error.error);
      }
      throw error;
    }
  }

  postThumbnailFile(
      resampledFile: Blob, filename: string,
      entityType: string, entityId: string): Observable<{filename: string}> {
    let form = new FormData();
    form.append('image', resampledFile);
    form.append('payload', JSON.stringify({
      filename: filename,
      filename_prefix: 'thumbnail'
    }));
    let imageUploadUrlTemplate = '/createhandler/imageupload/' +
    '<entity_type>/<entity_id>';
    let thumbnailFileUrl = this.urlInterpolationService.interpolateUrl(
      imageUploadUrlTemplate, {
        entity_type: entityType,
        entity_id: entityId
      });
    return this.http.post<{filename: string}>(thumbnailFileUrl, form);
  }

  isCached(filename: string): boolean {
    return this.assetsCache.has(filename);
  }

  abortAllCurrentAudioDownloads(): void {
    this.abortAllCurrentDownloads(AppConstants.ASSET_TYPE_AUDIO);
  }

  abortAllCurrentImageDownloads(): void {
    this.abortAllCurrentDownloads(AppConstants.ASSET_TYPE_IMAGE);
  }

  getAssetsFilesCurrentlyBeingRequested(): (
    {[assetType: string]: readonly FileDownloadRequest[]}) {
    return {
      [AppConstants.ASSET_TYPE_AUDIO]: this.audioFileDownloadRequests,
      [AppConstants.ASSET_TYPE_IMAGE]: this.imageFileDownloadRequests,
    };
  }

  getAudioDownloadUrl(
      entityType: string, entityId: string, filename: string): string {
    return this.getDownloadUrl(
      entityType, entityId, filename, AppConstants.ASSET_TYPE_AUDIO);
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

  private getDownloadUrl(
      entityType: string, entityId: string, filename: string,
      assetType: string): string {
    let downloadUrl = this.urlInterpolationService.interpolateUrl(
      this.downloadUrlTemplate, {
        entity_type: entityType,
        entity_id: entityId,
        asset_type: assetType,
        filename: filename,
      });
    return downloadUrl;
  }

  private getFileDownloadRequestsByAssetType(
      assetType: string): FileDownloadRequest[] {
    if (assetType === AppConstants.ASSET_TYPE_AUDIO) {
      return this.audioFileDownloadRequests;
    } else {
      return this.imageFileDownloadRequests;
    }
  }

  private async fetchFile(
      entityType: string, entityId: string, filename: string,
      assetType: string): Promise<AudioFile | ImageFile> {
    let onResolve!: (_: Blob) => void;
    let onReject!: () => void;
    const blobPromise = new Promise<Blob>((resolve, reject) => {
      onResolve = resolve;
      onReject = reject;
    });

    const subscription = this.http.get(
      this.getDownloadUrl(entityType, entityId, filename, assetType), {
        responseType: 'blob'
      }).subscribe(onResolve, onReject);

    const fileDownloadRequests = (
      this.getFileDownloadRequestsByAssetType(assetType));
    fileDownloadRequests.push(new FileDownloadRequest(filename, subscription));

    try {
      const blob = await blobPromise;
      this.assetsCache.set(filename, blob);
      if (assetType === AppConstants.ASSET_TYPE_AUDIO) {
        return new AudioFile(filename, blob);
      } else {
        return new ImageFile(filename, blob);
      }
    } catch {
      return Promise.reject(filename);
    } finally {
      const i = fileDownloadRequests.findIndex(r => r.filename === filename);
      if (i !== -1) {
        fileDownloadRequests.splice(i, 1);
      }
    }
  }

  private abortAllCurrentDownloads(assetType: string): void {
    const fileDownloadRequests = (
      this.getFileDownloadRequestsByAssetType(assetType));
    fileDownloadRequests.forEach(r => r.subscription.unsubscribe());
    fileDownloadRequests.length = 0;
  }

  private getAudioUploadUrl(explorationId: string): string {
    let audioUploadUrl = this.urlInterpolationService.interpolateUrl(
      AppConstants.AUDIO_UPLOAD_URL_TEMPLATE, {
        exploration_id: explorationId
      });
    return audioUploadUrl;
  }

  private getImageUploadUrl(
      entityType: string, entityId: string): string {
    let imageUploadUrl = this.urlInterpolationService.interpolateUrl(
      AppConstants.IMAGE_UPLOAD_URL_TEMPLATE,
      { entity_type: entityType, entity_id: entityId });
    return imageUploadUrl;
  }
}

angular.module('oppia').factory(
  'AssetsBackendApiService', downgradeInjectable(AssetsBackendApiService));
