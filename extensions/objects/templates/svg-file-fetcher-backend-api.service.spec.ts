// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for fetching svg file.
 */

import { HttpClient } from '@angular/common/http';
import { fakeAsync, TestBed, waitForAsync } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { SvgFileFetcherBackendApiService } from './svg-file-fetcher-backend-api.service';

describe('SvgFileFetcherBackendApiService', () => {
  let svgFileFetcherBackendApiService: SvgFileFetcherBackendApiService;

  class MockHttpClient {
    get<T>(url: string, options): Observable<T | string> {
      return of('<svg></svg>');
    }
    post<T>(url: string, body: unknown): Observable<T> {
      return of({filename: 'file.name'} as unknown as T);
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: HttpClient,
          useClass: MockHttpClient
        }
      ]
    });
    svgFileFetcherBackendApiService = TestBed.inject(
      SvgFileFetcherBackendApiService);
  }));

  it('should send request for svg files', waitForAsync(fakeAsync(() => {
    svgFileFetcherBackendApiService.fetchSvg('abc').subscribe(
      res => expect(res).toBe('<svg></svg>')
    );
  })));

  it('should send request for svg files', waitForAsync(fakeAsync(() => {
    svgFileFetcherBackendApiService.postSvgFile(
      new Blob(['abc']),
      {height: 1, width: 1},
      'abc',
      'def'
    ).subscribe(
      res => expect(res.filename).toBe('file.name')
    );
  })));
});
