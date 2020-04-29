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
 * @fileoverview Unit tests for ExtensionTagAssemblerService.
 */

import { TestBed } from '@angular/core/testing';
import {FilterService} from 'services/filter.service';

describe('Filter Service', () => {
  let fs: FilterService = null;

  beforeEach(() => {
    fs = TestBed.get(FilterService);
  });

  it('should filter array', () => {
    let originalArray = [
      {category: 'maths', language: 'en', name: 'rishabh'},
      {category: 'english', language: 'en', name: 'arshul'},
      {category: 'maths', language: 'en', name: 'hemant'},
      {category: 'maths', language: 'en', name: 'rishabh'},
    ];
  });
});
