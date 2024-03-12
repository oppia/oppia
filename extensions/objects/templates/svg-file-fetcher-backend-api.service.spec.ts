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

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {fakeAsync, TestBed, waitForAsync} from '@angular/core/testing';
import {SvgFileFetcherBackendApiService} from './svg-file-fetcher-backend-api.service';

describe('SvgFileFetcherBackendApiService', () => {
  let svgFileFetcherBackendApiService: SvgFileFetcherBackendApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    svgFileFetcherBackendApiService = TestBed.inject(
      SvgFileFetcherBackendApiService
    );
    httpTestingController = TestBed.inject(HttpTestingController);
  }));

  it('should send request for svg files', waitForAsync(
    fakeAsync(() => {
      let svg = '';
      svgFileFetcherBackendApiService
        .fetchSvg('/abc')
        .subscribe(x => (svg = x));
      let req = httpTestingController.expectOne('/abc');
      expect(req.request.method).toBe('GET');
      req.flush('<svg><svg>');
      expect(svg).toBe('<svg><svg>');
    })
  ));

  it('should send request for svg files', waitForAsync(
    fakeAsync(() => {
      let filename = '';
      svgFileFetcherBackendApiService
        .postSvgFile(new Blob(['abc']), {height: 1, width: 1}, 'abc', 'def')
        .subscribe(res => (filename = res.filename));
      let req = httpTestingController.expectOne(
        '/createhandler/imageupload/abc/def'
      );
      expect(req.request.method).toBe('POST');
      req.flush({filename: 'file.name'});
      expect(filename).toBe('file.name');
    })
  ));

  afterEach(() => {
    httpTestingController.verify();
  });
});
