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
 * @fileoverview Unit tests for the Translate Custom Parser.
 */

import {TestBed, waitForAsync} from '@angular/core/testing';
import {
  TranslateDefaultParser,
  TranslateModule,
  TranslateParser,
} from '@ngx-translate/core';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {TranslateCustomParser} from './translate-custom-parser';

describe('Translate Custom Parser', () => {
  let translateCustomParser: TranslateCustomParser;
  let translateDefaultParser: TranslateDefaultParser;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          useDefaultLang: true,
          isolate: false,
          extend: false,
          defaultLanguage: 'en',
        }),
      ],
      providers: [
        I18nLanguageCodeService,
        TranslateDefaultParser,
        TranslateParser,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    translateDefaultParser = TestBed.inject(TranslateDefaultParser);
    translateCustomParser = new TranslateCustomParser(translateDefaultParser);
  });

  it('should interpolate with preferred language', () => {
    expect(
      translateCustomParser.interpolate(
        '{minChoiceNumber, plural, one{Please select one or more choices.}' +
          'other{Please select # or more choices.}}',
        {
          minChoiceNumber: 1,
          messageFormat: true,
        }
      )
    ).toEqual('Please select one or more choices.');
    let params = {text: 'text'};
    expect(
      translateCustomParser.interpolate(`<[${params.text}]>`, params)
    ).toEqual(params.text);
  });

  it('should handle cases when params is not defined', () => {
    expect(translateCustomParser.interpolate('<[ KEY ]>')).toEqual('<[ KEY ]>');
    expect(translateCustomParser.interpolate('<[ KEY ]>', {})).toEqual(
      '<[ KEY ]>'
    );
  });

  it('should handle cases where messageFormat has value other than true', () => {
    expect(
      translateCustomParser.interpolate('<[ testName ]>', {
        testName: 'test_name',
        messageFormat: 2,
      })
    ).toEqual('test_name');
  });

  it('should test getters', () => {
    expect(translateCustomParser.messageFormat).toBeDefined();
  });

  it('should get value', () => {
    let testValue = 'test_value';
    spyOn(translateDefaultParser, 'getValue').and.returnValue(testValue);
    expect(translateCustomParser.getValue({}, '')).toEqual(testValue);
  });
});
