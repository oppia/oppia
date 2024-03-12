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
 * @fileoverview Unit tests for the Translate Cache Factory.
 */

import {TestBed, waitForAsync} from '@angular/core/testing';
import {
  TranslateCacheService,
  TranslateCacheSettings,
} from 'ngx-translate-cache';
import {TranslateService} from '@ngx-translate/core';
import {TranslateCacheFactory} from './translate-cache.factory';

describe('Translate Cache Factory', () => {
  class MockTranslateCacheService {
    constructor(
      private translateService: TranslateService,
      private translateCacheSettings: TranslateCacheSettings
    ) {}
  }
  let mockTranslateCacheService = new MockTranslateCacheService(
    {} as TranslateService,
    {} as TranslateCacheSettings
  );

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TranslateCacheService,
          useValue: mockTranslateCacheService,
        },
      ],
    }).compileComponents();
  }));

  it('should create translate cache service', () => {
    expect(
      TranslateCacheFactory.createTranslateCacheService(
        {} as TranslateService,
        {} as TranslateCacheSettings
      )
    ).toBeDefined();
  });
});
