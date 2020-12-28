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
import { map, switchMap, take } from 'rxjs/operators';

import { AuthService } from 'services/auth.service';


@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  /**
   * Given an HTTP request, adds a new Authorization header (if and only if a
   * user is currently signed in) and passes it along to the next handler of
   * HTTP requests.
   */
  intercept<T>(
      request: HttpRequest<T>, next: HttpHandler): Observable<HttpEvent<T>> {
    // From AuthService's `Observable` stream of ID Tokens, prepare to apply a
    // sequence of transformations with a pipe.
    return this.authService.idToken$.pipe(
      // Take the first token emitted.
      take(1),
      // Map the token to the passed-in HTTP request, modifying it to include an
      // Authorization header if and only if the token is not null.
      map(token => token === null ? request : request.clone({
        setHeaders: {Authorization: `Bearer ${token}`}
      })),
      // Finally, forward the request to the next HttpHandler, switching the
      // type of Observable we return into the stream of events emitted by the
      // next handler.
      //
      // Note the different signatures between map and switchMap:
      //    Observable<T> | map(T => U)                   => Observable<U>
      //    Observable<T> | switchMap(T => Observable<U>) => Observable<U>
      switchMap(request => next.handle(request)));
  }
}
