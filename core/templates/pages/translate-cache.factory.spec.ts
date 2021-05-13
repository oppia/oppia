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

import { TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateCacheModule, TranslateCacheService } from 'ngx-translate-cache';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateCacheFactory } from './translate-cache.factory';

// eslint-disable-next-line oppia/no-test-blockers
fdescribe('Translate Cache Factory', () => {
  let translateService: TranslateService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          useDefaultLang: true,
          isolate: false,
          extend: false,
          defaultLanguage: 'en'
        }),
        TranslateCacheModule.forRoot({
          cacheService: TranslateCacheService,
          cacheName: 'test',
          cacheMechanism: 'Cookie',
          cookieExpiry: 1
        })
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    translateService = TestBed.inject(TranslateService);
  });

  it('should create translate cache service', () => {
    expect(TranslateCacheFactory.createTranslateCacheService(
      translateService, {
        cacheName: 'test',
        cacheMechanism: 'Cookie',
        cookieExpiry: 1
      })).toBeDefined();
  });
});
