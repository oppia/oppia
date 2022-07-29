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
// eslint-disable-next-line oppia/disallow-httpclient
import { HttpClient, HttpBackend } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CsrfTokenService {
  tokenPromise: PromiseLike<string> | null = null;
  http: HttpClient;

  constructor(httpBackend: HttpBackend) {
    this.http = new HttpClient(httpBackend);
  }

  initializeToken(): void {
    if (this.tokenPromise !== null) {
      throw new Error('Token request has already been made');
    }

    this.tokenPromise = this.http.get('/csrfhandler').toPromise()
      .then((response: {token: string}) => {
        return response.token;
      }, (err) => {
        console.error(
          'The following error is thrown while trying to get csrf token.');
        console.error(err);
        throw err;
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
