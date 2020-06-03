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
 * @fileoverview Unit tests for the translate pipe.
 */

import { async, TestBed } from '@angular/core/testing';
import { EventEmitter, ChangeDetectorRef } from '@angular/core';

import { TranslateService } from 'services/translate.service';
import { TranslatePipe } from './translate.pipe';
import { UtilsService } from 'services/utils.service';


class MockChangeDetectorRef {
  markForCheck() {
    return true;
  }
}

class MockTranslateService {
    langChange = new EventEmitter();
    templateMatcher: RegExp = /\<\[\s?([^{}\s]*)\s?\]\>/g;
    get onLangChange() {
      return this.langChange;
    }
    translations = {
      I18n_t_1: 'Hello',
      I18n_t_2: 'Hello <[val]>'
    };
    private interpolateString(expr: string, params?: Object | undefined) {
      if (!params) {
        return expr;
      }
      return expr.replace(this.templateMatcher,
        (substring: string, b: string) => {
          return params[b];
        });
    }

    getInterpolatedString(key: string,
        interpolateParams?: Object) {
      const str = this.translations[key];
      if (!interpolateParams) {
        return str;
      }

      return this.interpolateString(str, interpolateParams);
    }
}

describe('TranslatePipe', () => {
  let pipe: TranslatePipe;
  let translate: TranslateService;
  let changeDecRef: ChangeDetectorRef;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TranslatePipe
      ],
      providers: [
        { provide: TranslateService, useClass: MockTranslateService },
        { provide: ChangeDetectorRef, useClass: MockChangeDetectorRef}
      ]
    }).compileComponents();
    translate = TestBed.get(TranslateService);
    changeDecRef = TestBed.get(ChangeDetectorRef);
    pipe = new TranslatePipe(translate, changeDecRef, new UtilsService());
  }));


  it('should translate', () => {
    expect(pipe.transform('I18n_t_1')).toBe('Hello');
    expect(pipe.transform('I18n_t_2', {val: 'World'})).toBe('Hello World');
    expect(pipe.transform('I18n_t_3')).toBe('I18n_t_3');
    expect(pipe.transform('')).toBe('');
    translate.onLangChange.emit({lang: 'en'});
  });

  // The sole purpose of this test is to cover ngOnDestroy.
  it('should destroy subscriptions', () => {
    pipe.ngOnDestroy();

    // Reintializing the pipe because jasmine tries to destroy the pipe.
    // But since I have called the ngOnDestroy method and the pipe is destroyed.
    // And if the pipe is not reinitialized it will raise an error saying cannot
    // call ngOnDestroy of undefined.
    pipe = new TranslatePipe(translate, changeDecRef, new UtilsService());
  });
});
