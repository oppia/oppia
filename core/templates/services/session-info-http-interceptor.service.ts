// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Http interceptor for session information.
 */

// eslint-disable-next-line oppia/disallow-httpclient
import {
  HttpRequest,
  HttpInterceptor,
  HttpEvent,
  HttpHandler,
  HttpErrorResponse,
} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {FeedbackSessionInfoService} from 'services/feedback-session-info.service';

import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SessionInfoHttpInterceptorService implements HttpInterceptor {
  constructor(private feedbackSessionInfoService: FeedbackSessionInfoService) {}

  intercept(
    req: HttpRequest<object>,
    next: HttpHandler
  ): Observable<HttpEvent<object>> {
    return next.handle(req).pipe(
      tap({
        error: (errorResponse: Error | HttpErrorResponse) => {
          if (errorResponse instanceof HttpErrorResponse) {
            const statusCode = errorResponse.status;
            this.feedbackSessionInfoService.recordFailedRequest(
              errorResponse.url ?? req.urlWithParams,
              req.method,
              statusCode,
              Date.now(),
              errorResponse.statusText || undefined,
              errorResponse.message || undefined
            );
          }
        },
      })
    );
  }
}
