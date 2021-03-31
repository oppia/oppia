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
 * @fileoverview PNG related checks and sanitization service.
 */

import { Injectable } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { downgradeInjectable } from '@angular/upgrade/static';

import constants from 'assets/constants';

@Injectable({
  providedIn: 'root'
})
export class PngSanitizerService {
  constructor(private sanitizer: DomSanitizer) {}

  /**
   * Checks the input for malicious or invalid PNG code.
   * The checks:
   * 1. Is base64 encoded.
   *
   * @returns {boolean} True if all the checks pass. False Otherwise.
   */
  isValidBase64Png(base64ImageData: string): boolean {
    // eslint-disable-next-line max-len
    const DATA_URL_PATTERN = /^data:image\/png\;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/i;
    // Check if data passed is a valid bse64 PNG.
    if (!base64ImageData.match(DATA_URL_PATTERN)) {
      return false;
    }

    // The PNG is safe and valid.
    return true;
  }

  /**
   * Checks the input for malicious or invalid PNG code.
   * Angular by default treats svg+xml data as unsafe. In order to show the PNG
   * we need to check the PNG data for possible XSS attacks. The spec file for
   * this component showcases some scenarios where XSS attacks are possible if
   * the PNG is not checked for such attacks. The following function checks the
   * PNG data for possible XSS vulnerabilities.
   *
   * @returns {SafeResourceUrl | null} SafeResourceUrl if the PNG is valid and
   * trusted. Otherwise returns null.
   */
  getTrustedPngResourceUrl(base64ImageData: string): SafeResourceUrl | null {
    if (this.isValidBase64Png(base64ImageData)) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(base64ImageData);
    }
    return null;
  }
}

angular.module('oppia').factory(
  'PngSanitizerService', downgradeInjectable(PngSanitizerService));
