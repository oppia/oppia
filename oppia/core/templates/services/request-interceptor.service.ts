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

import {from, Observable} from 'rxjs';
// eslint-disable-next-line oppia/disallow-httpclient
import {
  HttpRequest,
  HttpInterceptor,
  HttpEvent,
  HttpHandler,
} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {switchMap} from 'rxjs/operators';
import {CsrfTokenService} from './csrf-token.service';

@Injectable({
  providedIn: 'root',
})
export class RequestInterceptor implements HttpInterceptor {
  constructor(private csrf: CsrfTokenService) {}
  intercept(
    request: HttpRequest<FormData>,
    next: HttpHandler
  ): Observable<HttpEvent<FormData>> {
    var csrf = this.csrf;
    try {
      csrf.initializeToken();
      // We use unknown type because we are unsure of the type of error
      // that was thrown. Since the catch block cannot identify the
      // specific type of error, we are unable to further optimise the
      // code by introducing more types of errors.
    } catch (e: unknown) {
      if (
        e instanceof Error &&
        e.message !== 'Token request has already been made'
      ) {
        throw e;
      }
    }

    RequestInterceptor.checkForNullParams(request);

    if (request.body) {
      return from(this.csrf.getTokenAsync()).pipe(
        switchMap((token: string) => {
          if (request.method === 'POST' || request.method === 'PUT') {
            // If the body of the http request created is already in FormData
            // form, no need to create the FormData object here.
            if (!(request.body instanceof FormData)) {
              var body = new FormData();
              body.append('payload', JSON.stringify(request.body));
              // This throws "Cannot assign to 'body' because it is a
              // read-only property". We need to suppress this error because
              // this is a request interceptor and we need to modify the
              // contents of the request.
              // @ts-ignore
              request.body = body;
            }
            request.body.append('csrf_token', token);
            request.body.append('source', document.URL);
          } else {
            // This throws "Cannot assign to 'body' because it is a
            // read-only property". We need to suppress this error because
            // this is a request interceptor and we need to modify the
            // contents of the request.
            // @ts-ignore
            request.body = {
              csrf_token: token,
              source: document.URL,
              payload: JSON.stringify(request.body),
            };
          }
          return next.handle(request);
        })
      );
    } else {
      return next.handle(request);
    }
  }

  private static checkForNullParams(request: HttpRequest<FormData>): void {
    // We only disallow null params for GET and DELETE requests.
    if (request.method !== 'GET' && request.method !== 'DELETE') {
      return;
    }
    request.params.keys().forEach((key: string) => {
      request.params.getAll(key)?.forEach((value: string) => {
        if (value === 'null' || value === 'None') {
          throw new Error('Cannot supply params with value "None" or "null".');
        }
      });
    });
  }
}
