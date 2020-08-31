// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview HTTP Service for exclusively build HTTP Requests.
 */

import { HttpHeaders, HttpParams, HttpClient } from
  '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

interface HttpOptions { params: HttpParams, headers: HttpHeaders };

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  constructor(private httpClient: HttpClient) {}

  /* Used when we want to exclusively read data; no modifications.*/
  get<T>(url: string, options?: HttpOptions): Promise<T> {
    return this.httpClient.get<T>(url, options).toPromise();
  }

  /* Used when we want to fully replace the value of a resource.*/
  put<T>(url: string, options?: HttpOptions): Promise<T> {
    return this.httpClient.put<T>(url, options).toPromise();
  }

  /**
   *Used when, instead of providing a completely new version of a resource,
   *what we want to do is to just update a single property.
   */
  patch<T>(url: string, options?: HttpOptions): Promise<T> {
    return this.httpClient.patch<T>(url, options).toPromise();
  }

  /* Used when we want to trigger a logical delete of some data.*/
  delete<T>(url: string, options?: HttpOptions): Promise<T> {
    return this.httpClient.delete<T>(url, options).toPromise();
  }

  /**
   * Used when the operation that we are trying to do does not fit the
   * description of any of the methods above (GET, PUT, PATCH, DELETE), then we
   * can use this HTTP wildcard modification operation.
   */
  post<T>(url: string, options?: HttpOptions): Promise<T> {
    return this.httpClient.post<T>(url, options).toPromise();
  }
}

angular.module('oppia').factory(
  'HttpService', downgradeInjectable(HttpService));
