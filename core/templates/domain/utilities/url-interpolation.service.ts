// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to construct URLs by inserting variables within them as
 * necessary to have a fully-qualified URL.
 */

import {Injectable} from '@angular/core';

import {AlertsService} from 'services/alerts.service';
import {UrlService} from 'services/contextual/url.service';
import {UtilsService} from 'services/utils.service';

import {AppConstants} from 'app.constants';
import resourceHashes from 'utility/hashes';

// This makes the InterpolationValuesType like a dict whose keys and values both
// are string.
export interface InterpolationValuesType {
  [param: string]: string;
}

@Injectable({
  providedIn: 'root',
})
export class UrlInterpolationService {
  constructor(
    private alertsService: AlertsService,
    private urlService: UrlService,
    private utilsService: UtilsService
  ) {}

  get DEV_MODE(): boolean {
    return AppConstants.DEV_MODE;
  }

  /**
   * @param {string} resourcePath - A resource path relative to a subfolder
   * in /.
   */
  validateResourcePath(resourcePath: string): void {
    if (!resourcePath) {
      this.alertsService.fatalWarning('Empty path passed in method.');
    }

    const RESOURCE_PATH_STARTS_WITH_FORWARD_SLASH = /^\//;
    // Ensure that resourcePath starts with a forward slash.
    if (!resourcePath.match(RESOURCE_PATH_STARTS_WITH_FORWARD_SLASH)) {
      this.alertsService.fatalWarning(
        "Path must start with '/': '" + resourcePath + "'."
      );
    }
  }

  /**
   * @param {string} resourcePath - A resource path relative to a subfolder
   * in /.
   * @return {string} The resource path with cache slug.
   */
  _getUrlWithSlug(resourcePath: string): string {
    const hashes = resourceHashes.hashes;
    if (!this.DEV_MODE) {
      if (hashes[resourcePath]) {
        let index = resourcePath.lastIndexOf('.');
        return (
          resourcePath.slice(0, index) +
          '.' +
          hashes[resourcePath] +
          resourcePath.slice(index)
        );
      }
    }
    return resourcePath;
  }

  /**
   * @param {string} prefix - The url prefix.
   * @param {string} path - A resource path relative to a subfolder.
   * @return {string} The complete url path with cache slug and prefix
   * depending on dev/prod mode.
   */
  _getCompleteUrl(prefix: string, path: string): string {
    if (this.DEV_MODE) {
      return prefix + this._getUrlWithSlug(path);
    } else {
      return '/build' + prefix + this._getUrlWithSlug(path);
    }
  }

  /**
   * @param {string} resourcePath - A resource path relative to extensions
   * folder.
   * @return {string} The complete url path to that resource.
   */
  getExtensionResourceUrl(resourcePath: string): string {
    this.validateResourcePath(resourcePath);
    return this._getCompleteUrl('/extensions', resourcePath);
  }

  /**
   * Interpolate a URL by inserting values the URL needs using an object. If a
   * URL requires a value which is not keyed within the object, the function
   * execution will stop after throwing an error.
   * @param {string} urlTemplate - A formatted URL. For example, urlTemplate
   * might be:
   *    /createhandler/resolved_answers/<exploration_id>/<escaped_state_name>
   * @param {InterpolationValuesType} interpolationValues - An object whose keys
   * are variables within the URL. For the above example, interpolationValues
   * may look something like:
   *    { 'exploration_id': '0', 'escaped_state_name': 'InputBinaryNumber' }
   * @return {string} The URL interpolated with the interpolationValues object.
   */
  interpolateUrl(
    urlTemplate: string,
    interpolationValues: InterpolationValuesType
  ): string {
    if (!urlTemplate) {
      this.alertsService.fatalWarning(
        "Invalid or empty URL template passed in: '" + urlTemplate + "'"
      );
    }

    // http://stackoverflow.com/questions/4775722
    if (
      !(interpolationValues instanceof Object) ||
      Object.prototype.toString.call(interpolationValues) === '[object Array]'
    ) {
      this.alertsService.fatalWarning(
        'Expected an object of interpolation values to be passed into ' +
          'interpolateUrl.'
      );
    }

    // Valid pattern: <alphanum>
    let INTERPOLATION_VARIABLE_REGEX = /<(\w+)>/;

    // Invalid patterns: <<stuff>>, <stuff>>>, <>
    let EMPTY_VARIABLE_REGEX = /<>/;
    let INVALID_VARIABLE_REGEX = /(<{2,})(\w*)(>{2,})/;

    if (
      urlTemplate.match(INVALID_VARIABLE_REGEX) ||
      urlTemplate.match(EMPTY_VARIABLE_REGEX)
    ) {
      this.alertsService.fatalWarning(
        "Invalid URL template received: '" + urlTemplate + "'"
      );
    }

    let nonStringParams = Object.entries(interpolationValues).filter(
      ([key, val]) => !this.utilsService.isString(val)
    );
    if (nonStringParams.length > 0) {
      this.alertsService.fatalWarning(
        'Every parameter passed into interpolateUrl must have string values, ' +
          'but received: {' +
          nonStringParams
            .map(([key, val]) => key + ': ' + angular.toJson(val))
            .join(', ') +
          '}'
      );
    }

    let escapedInterpolationValues: Record<string, string> = {};
    for (let varName in interpolationValues) {
      let value = interpolationValues[varName];
      escapedInterpolationValues[varName] = encodeURIComponent(value);
    }

    // Ensure the URL has no nested brackets (which would lead to
    // indirection in the interpolated variables).
    let filledUrl = urlTemplate;
    let match = filledUrl.match(INTERPOLATION_VARIABLE_REGEX);
    while (match) {
      let currentVarName = match[1];
      if (!escapedInterpolationValues.hasOwnProperty(currentVarName)) {
        this.alertsService.fatalWarning(
          "Expected variable '" + currentVarName + "' when interpolating URL."
        );
      }
      filledUrl = filledUrl.replace(
        INTERPOLATION_VARIABLE_REGEX,
        escapedInterpolationValues[currentVarName]
      );
      match = filledUrl.match(INTERPOLATION_VARIABLE_REGEX);
    }
    return filledUrl;
  }

  /**
   * @param {string} imagePath - An image path relative to /assets/images
   * folder.
   * @return {string} The complete url path to that image.
   */
  getStaticImageUrl(imagePath: string): string {
    this.validateResourcePath(imagePath);
    return this._getCompleteUrl('/assets', '/images' + imagePath);
  }

  /**
   * @param {string} imagePath - An image path relative to /assets/images
   * folder.
   * @return {string} The complete url path to that image.
   */
  getStaticCopyrightedImageUrl(imagePath: string): string {
    this.validateResourcePath(imagePath);
    return '/assets' + '/copyrighted-images' + imagePath;
  }

  /**
   * @param {string} audioPath - An audio path relative to /assets/audio folder.
   * @return {string} The complete url path to that audio.
   */
  getStaticAudioUrl(audioPath: string): string {
    this.validateResourcePath(audioPath);
    return this._getCompleteUrl('/assets', '/audio' + audioPath);
  }

  /**
   * @param {string} assetPath - A asset path relative to /assets folder.
   * @return {string} The complete url path to that asset.
   */
  getStaticAssetUrl(assetPath: string): string {
    this.validateResourcePath(assetPath);
    return this._getCompleteUrl('/assets', assetPath);
  }

  /**
   * @param {string} interactionId - An interaction id.
   * @return {string} The complete url path to the thumbnail image for the
   * interaction.
   */
  getInteractionThumbnailImageUrl(interactionId: string): string {
    if (!interactionId) {
      this.alertsService.fatalWarning(
        'Empty interactionId passed in getInteractionThumbnailImageUrl.'
      );
    }
    return this.getExtensionResourceUrl(
      '/interactions/' + interactionId + '/static/' + interactionId + '.png'
    );
  }
}
