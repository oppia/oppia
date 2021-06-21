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
 * @fileoverview Model class for creating image files.
 */

export class ImageFile {
  filename: string;
  // 'get' method from a 'Map' interface can return an undefined value
  // for a data.
  // get(key: K): V | undefined; in line 77 assets-backend-api.service.ts .
  data: Blob | undefined;

  constructor(filename: string, data: Blob | undefined) {
    this.filename = filename;
    this.data = data;
  }
}
