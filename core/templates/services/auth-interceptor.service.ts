// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for adding Authorization headers to HTTP requests.
 */

import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { mergeMap, take } from 'rxjs/operators';
import { AuthService } from 'services/auth.service';


@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept<T>(
      request: HttpRequest<T>, next: HttpHandler): Observable<HttpEvent<T>> {
    return this.authService.idToken$.pipe(take(1), mergeMap(idToken => {
      if (idToken !== null) {
        // Add the Authorization header to the request.
        request = request.clone({
          setHeaders: {Authorization: `Bearer ${idToken}`}
        });
      }
      // Hand over request responsibility to the next handler.
      return next.handle(request);
    }));
  }
}
