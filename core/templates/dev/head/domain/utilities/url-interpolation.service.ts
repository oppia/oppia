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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AlertsService } from 'services/alerts.service';
import { UrlService } from 'services/contextual/url.service';
import { UtilsService } from 'services/utils.service';
import { LoggerService } from 'services/contextual/logger.service';


const Constants = require('constants.ts');
const hashes = require('hashes.json');

@Injectable({
  providedIn: 'root'
})
export class UrlInterpolationService {
  constructor(private alertsService: AlertsService,
              private urlService: UrlService,
              private utilsService: UtilsService) {}

  validateResourcePath(resourcePath: string): void {
    if (!resourcePath) {
      this.alertsService.fatalWarning('Empty path passed in method.');
    }

    const RESOURCE_PATH_STARTS_WITH_FORWARD_SLASH = /^\//;
    // Ensure that resourcePath starts with a forward slash.
    if (!resourcePath.match(RESOURCE_PATH_STARTS_WITH_FORWARD_SLASH)) {
      this.alertsService.fatalWarning(
        'Path must start with \'\/\': \'' + resourcePath + '\'.');
    }
  }

  /**
   * Given a resource path relative to subfolder in /,
   * returns resource path with cache slug.
   */
  _getUrlWithSlug(resourcePath: string): string {
    if (!Constants.DEV_MODE) {
      if (hashes[resourcePath]) {
        let index = resourcePath.lastIndexOf('.');
        return (resourcePath.slice(0, index) + '.' + hashes[resourcePath] +
            resourcePath.slice(index));
      }
    }
    return resourcePath;
  }

  /**
   * Given a resource path relative to subfolder in /,
   * returns complete resource path with cache slug and prefixed with url
   * depending on dev/prod mode.
   */
  _getCompleteUrl(prefix: string, path: string): string {
    if (Constants.DEV_MODE) {
      return prefix + this._getUrlWithSlug(path);
    } else {
      return '/build' + prefix + this._getUrlWithSlug(path);
    }
  }

  /**
   * Given a resource path relative to extensions folder,
   * returns the complete url path to that resource.
   */
  getExtensionResourceUrl(resourcePath: string): string {
    this.validateResourcePath(resourcePath);
    return this._getCompleteUrl('/extensions', resourcePath);
  }

  /**
   * Given a formatted URL, interpolates the URL by inserting values the URL
   * needs using the interpolationValues object. For example, urlTemplate
   * might be:
   *
   *   /createhandler/resolved_answers/<exploration_id>/<escaped_state_name>
   *
   * interpolationValues is an object whose keys are variables within the
   * URL. For the above example, interpolationValues may look something
   * like:
   *
   *   { 'exploration_id': '0', 'escaped_state_name': 'InputBinaryNumber' }
   *
   * If a URL requires a value which is not keyed within the
   * interpolationValues object, this will return null.
   */
  interpolateUrl(urlTemplate: string, interpolationValues: any): string {
    if (!urlTemplate) {
      this.alertsService.fatalWarning(
        'Invalid or empty URL template passed in: \'' + urlTemplate + '\'');
      return null;
    }

    // http://stackoverflow.com/questions/4775722
    if (!(interpolationValues instanceof Object) || (
      Object.prototype.toString.call(
        interpolationValues) === '[object Array]')) {
      this.alertsService.fatalWarning(
        'Expected an object of interpolation values to be passed into ' +
          'interpolateUrl.');
      return null;
    }

    // Valid pattern: <alphanum>
    let INTERPOLATION_VARIABLE_REGEX = /<(\w+)>/;

    // Invalid patterns: <<stuff>>, <stuff>>>, <>
    let EMPTY_VARIABLE_REGEX = /<>/;
    let INVALID_VARIABLE_REGEX = /(<{2,})(\w*)(>{2,})/;

    if (urlTemplate.match(INVALID_VARIABLE_REGEX) ||
        urlTemplate.match(EMPTY_VARIABLE_REGEX)) {
      this.alertsService.fatalWarning(
        'Invalid URL template received: \'' + urlTemplate + '\'');
      return null;
    }

    let escapedInterpolationValues = {};
    for (let varName in interpolationValues) {
      let value = interpolationValues[varName];
      if (!this.utilsService.isString(value)) {
        this.alertsService.fatalWarning(
          'Parameters passed into interpolateUrl must be strings.');
        return null;
      }

      escapedInterpolationValues[varName] = encodeURIComponent(value);
    }

    // Ensure the URL has no nested brackets (which would lead to
    // indirection in the interpolated variables).
    let filledUrl = urlTemplate;
    let match = filledUrl.match(INTERPOLATION_VARIABLE_REGEX);
    while (match) {
      let currentVarName = match[1];
      if (!escapedInterpolationValues.hasOwnProperty(currentVarName)) {
        this.alertsService.fatalWarning('Expected variable \'' +
            currentVarName + '\' when interpolating URL.');
        return null;
      }
      filledUrl = filledUrl.replace(
        INTERPOLATION_VARIABLE_REGEX,
        escapedInterpolationValues[currentVarName]);
      match = filledUrl.match(INTERPOLATION_VARIABLE_REGEX);
    }
    return filledUrl;
  }

  /**
   * Given an image path relative to /assets/images folder,
   * returns the complete url path to that image.
   */
  getStaticImageUrl(imagePath: string): string {
    this.validateResourcePath(imagePath);
    return this._getCompleteUrl('/assets', '/images' + imagePath);
  }

  /**
   * Given a video path relative to /assets/videos folder,
   * returns the complete url path to that image.
   */
  getStaticVideoUrl(videoPath: string): string {
    this.validateResourcePath(videoPath);
    return this._getCompleteUrl('/assets', '/videos' + videoPath);
  }

  /**
   * Given a path relative to /assets folder, returns the complete url path
   * to that asset.
   */
  getStaticAssetUrl(assetPath: string): string {
    this.validateResourcePath(assetPath);
    return this._getCompleteUrl('/assets', assetPath);
  }

  getFullStaticAssetUrl(path: string): string {
    this.validateResourcePath(path);
    if (Constants.DEV_MODE) {
      return this.urlService.getOrigin() + path;
    } else {
      return this.urlService.getOrigin() + '/build' + path;
    }
  }

  /**
   * Given an interaction id, returns the complete url path to
   * the thumbnail image for the interaction.
   */
  getInteractionThumbnailImageUrl(interactionId: string): string {
    if (!interactionId) {
      this.alertsService.fatalWarning(
        'Empty interactionId passed in getInteractionThumbnailImageUrl.');
    }
    return this.getExtensionResourceUrl('/interactions/' + interactionId +
        '/static/' + interactionId + '.png');
  }

  /**
   * Given a directive path relative to head folder,
   * returns the complete url path to that directive.
   */
  getDirectiveTemplateUrl(path: string): string {
    this.validateResourcePath(path);
    if (Constants.DEV_MODE) {
      return '/templates/dev/head' + this._getUrlWithSlug(path);
    } else {
      return '/build/templates/head' + this._getUrlWithSlug(path);
    }
  }
}

angular.module('oppia').factory(
  'UrlInterpolationService',
  downgradeInjectable(UrlInterpolationService));
