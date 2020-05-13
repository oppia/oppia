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
 * @fileoverview unit test for FileDownloadRequestObjectFactory.
 */

import { TestBed } from '@angular/core/testing';


import { FileDownloadRequestObjectFactory, FileDownloadRequest } from
'domain/utilities/FileDownloadRequestObjectFactory.ts';

describe('File Download Request Object Factory', () => {
  let fileDownloadRequestObjectFactory: FileDownloadRequestObjectFactory = null;

  beforeEach(() => {
    fileDownloadRequestObjectFactory = TestBed.get(FileDownloadRequestObjectFactory);
  });

  it('should test the createNew function', inject(($q) => {
      let deffered = $q.defer();
      let fileDownloadDict = fileDownloadRequestObjectFactory.createNew('content-en-l6bx06mguk.mp3',deffered);
      expect(fileDownloadDict).toEqual(new FileDownloadRequest('content-en-l6bx06mguk.mp3',deffered));
  }));
});
