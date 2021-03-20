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
import { HttpRequest, HttpInterceptor,
  HttpEvent, HttpHandler } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { CsrfTokenService } from './csrf-token.service';

@Injectable({
  providedIn: 'root'
})
export class RequestInterceptor implements HttpInterceptor {
  constructor(private csrf: CsrfTokenService) {}
  intercept(
      request: HttpRequest<FormData>, next: HttpHandler
  ): Observable<HttpEvent<FormData>> {
    try {
      this.csrf.initializeToken();
    } catch (e) {
      if (e.message !== 'Token request has already been made') {
        throw e;
      }
    }
    if (request.body) {
      return from(this.csrf.getTokenAsync())
        .pipe(
          switchMap((token: string) => {
            let newRequest;
            if (request.method === 'POST' || request.method === 'PUT') {
              // If the body of the http request created is already in FormData
              // form, no need to create the FormData object here.
              let body = new FormData();
              if (!(request.body instanceof FormData)) {
                body.append('payload', JSON.stringify(request.body));
              }
              body.append('csrf_token', token);
              body.append('source', document.URL);
              newRequest = request.clone({
                body: body
              });
            } else {
              newRequest = request.clone({
                body: {
                  csrf_token: token,
                  source: document.URL,
                  payload: JSON.stringify(request.body)
                }
              });
            }
            return next.handle(newRequest);
          })
        );
    } else {
      return next.handle(request);
    }
  }
}
