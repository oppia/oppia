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
 * @fileoverview Http Interceptor.
 */

import { from, Observable } from 'rxjs';
import { HttpClient, HttpParams, HttpRequest,
  HttpInterceptor, HttpEvent, HttpHandler } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MockCsrfTokenService {
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

@Injectable({
  providedIn: 'root'
})
export class RequestInterceptor implements HttpInterceptor {
  constructor(private csrf: MockCsrfTokenService) {}
  intercept(
      request: HttpRequest<any>, next: HttpHandler
  ): Observable<HttpEvent<any>> {
    var csrf = this.csrf;
    try {
      csrf.initializeToken();
    } catch (e) {
      if (e.message !== 'Token request has already been made') {
        throw e;
      }
    }

    if (request.body) {
      return from(this.csrf.getTokenAsync())
        .pipe(
          switchMap(token => {
            if (request.method === 'POST' || request.method === 'PUT') {
              var body = new HttpParams()
                // @ts-ignore
                .set('csrf_token', token)
                .set('source', document.URL)
                .set('payload', JSON.stringify(request.body));
              // @ts-ignore
              request.body = body;
            } else {
              // @ts-ignore
              request.body = {
                csrf_token: token,
                source: document.URL,
                payload: JSON.stringify(request.body)
              };
            }
            return next.handle(request);
          })
        );
    } else {
      return next.handle(request);
    }
  }
}
