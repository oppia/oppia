// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for ReadOnlyStoryNodeObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import { ReadOnlyFeaturedTranslationLanguageObjectFactory } from
  './ReadOnlyFeaturedTranslationLanguageObjectFactory';

describe('Read only Featured Translation Language factory', () => {
  let readOnlyFTLFactory:
    ReadOnlyFeaturedTranslationLanguageObjectFactory = null;
  var _sampleFTL = null;

  beforeEach(() => {
    readOnlyFTLFactory = TestBed.get(
      ReadOnlyFeaturedTranslationLanguageObjectFactory);

    let sampleFRLDict = {
      language_code: 'en',
      description: 'English'
    };
    _sampleFTL = readOnlyFTLFactory.createFromBackendDict(sampleFRLDict);
  });

  it('should correctly return all the values', function() {
    expect(_sampleFTL.getLanguageCode()).toEqual('en');
    expect(_sampleFTL.getDescription()).toEqual('English');
  });
});
