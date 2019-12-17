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
import $ from 'jquery';

@Injectable({
  providedIn: 'root'
})
export class CsrfTokenService {
  tokenPromise = null;

  initializeToken() {
    if (this.tokenPromise !== null) {
      throw new Error('Token request has already been made');
    }
    // TODO(#8035): Remove the use of $.ajax and hence the ts-ignore
    // in csrf-token.service.spec.ts once all the services are migrated
    // We use jQuery here instead of Angular's $http, since the latter creates
    // a circular dependency.
    this.tokenPromise = $.ajax({
      url: '/csrfhandler',
      type: 'GET',
      dataType: 'text',
      dataFilter: function(data: any) {
        // Remove the protective XSSI (cross-site scripting inclusion) prefix.
        let actualData = data.substring(5);
        return JSON.parse(actualData);
      },
    }).then(function(response: any) {
      return response.token;
    });
  }

  getTokenAsync() {
    if (this.tokenPromise === null) {
      throw new Error('Token needs to be initialized');
    }
    return this.tokenPromise;
  }
}

angular.module('oppia').factory(
  'CsrfTokenService', downgradeInjectable(CsrfTokenService));
