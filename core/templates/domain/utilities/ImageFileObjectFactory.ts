// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Object factory for creating image files.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export class ImageFile {
  filename: string;
  data: Blob;

  constructor(filename: string, data: Blob) {
    this.filename = filename;
    this.data = data;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ImageFileObjectFactory {
  createNew(filename: string, data: Blob): ImageFile {
    return new ImageFile(filename, data);
  }
}

angular.module('oppia').factory(
  'ImageFileObjectFactory',
  downgradeInjectable(ImageFileObjectFactory));
