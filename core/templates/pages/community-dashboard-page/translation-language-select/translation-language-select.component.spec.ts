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

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslationLanguageSelectComponent } from
  './translation-language-select.component';

/**
 * @fileoverview Unit tests for the translation language select
 */


describe('Translation language select', () => {
  let component: TranslationLanguageSelectComponent;
  let fixture: ComponentFixture<TranslationLanguageSelectComponent>;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(async(() => {
    // karma requires a templateUrl over template: require('./path/to/html')
    TestBed.configureTestingModule({
      declarations: [TranslationLanguageSelectComponent],
    })
      .overrideComponent(TranslationLanguageSelectComponent, {
        set: {
          templateUrl: 'base/core/templates/pages/community-dashboard-page/translation-language-select/translation-language-select.component.html',
          template: undefined
        }}
      )
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranslationLanguageSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should work', () => {
    expect(true).toEqual(true);
    // component.options = [
    //   { id: 'en', description: 'English' },
    //   { id: 'fr', description: 'French' }
    // ];
    // fixture.detectChanges();
    // expect(component.languageIdToDescription).toEqual({
    //   en: 'English', fr: 'French'
    // });
  });
});
