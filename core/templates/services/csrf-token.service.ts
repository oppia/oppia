// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for managing CSRF tokens.
 */

// This needs to be imported first instead of using the global definition
// because Angular doesn't support global definitions and every library used
// needs to be imported explicitly.

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CsrfTokenService {
  tokenPromise: PromiseLike<string> | null = null;

  initializeToken(): void {
    if (this.tokenPromise !== null) {
      throw new Error('Token request has already been made');
    }
    this.tokenPromise = fetch(
      '/csrfhandler'
    ).then((response: Response) => {
      console.log(response);
      return response.text();
    }).then((responseText: string) => {
      console.log(responseText);
      return JSON.parse(responseText.substring(5)).token;
    });
  }

  getTokenAsync(): PromiseLike<string> {
    if (this.tokenPromise === null) {
      throw new Error('Token needs to be initialized');
    }
    return this.tokenPromise;
  }
}

angular.module('oppia').factory(
  'CsrfTokenService', downgradeInjectable(CsrfTokenService));
