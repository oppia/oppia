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

import { async, TestBed, ComponentFixture, fakeAsync }
  from '@angular/core/testing';
import { EventEmitter, ChangeDetectorRef, Component } from '@angular/core';

import { TranslateService } from 'services/translate.service';
import { TranslatePipe } from './translate.pipe';
import { UtilsService } from 'services/utils.service';


class MockChangeDetectorRef {
  markForCheck() {
    return true;
  }
}

class MockTranslateService {
  langChangeEventEmitter = new EventEmitter();
  get onLangChange() {
    return this.langChangeEventEmitter;
  }
  translations = {
    I18n_t_1: 'Hello',
    I18n_t_2: 'Hello <[val]>',
    I18n_rogue_1: '<script>alert(\'Oppia\');</script>Hello',
    I18n_rogue_2: '<oppia-img>Me</oppia-img>Hola'
  };

  getInterpolatedString(key: string,
      interpolateParams?: Object) {
    const str = this.translations[key];
    if (!str) {
      return key;
    }

    if (interpolateParams) {
      return str.replace(/\<\[\s?([^{}\s]*)\s?\]\>/g,
        (substring: string, interpolateParamsKey: string) => {
          return interpolateParams[interpolateParamsKey];
        });
    }

    return str;
  }
}

describe('TranslatePipe', () => {
  let pipe: TranslatePipe;
  let translateService: TranslateService;
  let changeDectorRef: ChangeDetectorRef;

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
    translateService = TestBed.get(TranslateService);
    changeDectorRef = TestBed.get(ChangeDetectorRef);
    pipe = new TranslatePipe(
      translateService, changeDectorRef, new UtilsService());
  }));

  it('should translate', () => {
    expect(pipe.transform('I18n_t_1')).toBe('Hello');
    expect(pipe.transform('I18n_t_2', {val: 'World'})).toBe('Hello World');
    expect(pipe.transform('I18n_t_2', {val: 'World'})).toBe('Hello World');
    // The pipe should return the interpolated value with the rogue params, as
    // santization happens when the interpolated value is sent to the view
    // using innerHTM"L".
    expect(pipe.transform('I18n_t_2', {val: '<script>World</script>'})).toBe(
      'Hello <script>World</script>');
    expect(pipe.transform('I18n_t_3')).toBe('I18n_t_3');
    expect(pipe.transform('')).toBe('');
    translateService.onLangChange.emit({newLanguageCode: 'en'});
  });

  // The sole purpose of this test is to cover ngOnDestroy.
  it('should destroy subscriptions', () => {
    expect(pipe).toBeDefined;
    pipe.ngOnDestroy();
    expect(pipe).not.toBeDefined;
    // Reintializing the pipe because jasmine tries to destroy the pipe.
    // But since ngOnDestroy method has been called and the pipe is destroyed.
    // And if the pipe is not reinitialized karma will raise an error saying
    // "cannot call ngOnDestroy of undefined".
    pipe = new TranslatePipe(
      translateService, changeDectorRef, new UtilsService());
    expect(pipe).toBeDefined;
  });
});

// Adding the following three lines for reference.
// I18n_t_2: 'Hello <[val]>',
// I18n_rogue_1: '<script>alert(\'Oppia\');</script>Hello',
// I18n_rogue_2: '<oppia-img>Me</oppia-img>Hola'
@Component({
  /* eslint-disable max-len */
  // eslint-disable-next-line no-multi-str, angular/no-inline-template
  template: '<h1 [innerHTML] = "\'I18n_rogue_1\' | translate"></h1>\
    <h2 [innerHTML] = "\'I18n_rogue_2\' | translate"></h2>\
    <h3 [innerHTML] = "\'I18n_t_2\' | translate: {val: \'<script>alert(\\\'Hello\\\');</script>\' }"></h3>\
    <h4 [innerHTML] = "\'I18n_t_2\' | translate: {val: \'<oppia-img>O</oppia-img>\' }"></h4>'
})
class MockComponent { }
/* eslint-enable max-len */
describe('Angular', () => {
  let component: MockComponent;
  let fixture: ComponentFixture<MockComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TranslatePipe,
        MockComponent
      ],
      providers: [
        { provide: TranslateService, useClass: MockTranslateService },
        { provide: ChangeDetectorRef, useClass: MockChangeDetectorRef}
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(MockComponent);
    component = fixture.componentInstance;
  }));

  it('should sanitize translations', fakeAsync(() => {
    const compiledComponent = fixture.debugElement.nativeElement;
    // The DOM should be empty for now since the translations haven't
    // been rendered yet.
    expect(compiledComponent.querySelector('h1').textContent).toEqual('');
    expect(compiledComponent.querySelector('h2').textContent).toEqual('');
    expect(compiledComponent.querySelector('h3').textContent).toEqual('');
    expect(compiledComponent.querySelector('h4').textContent).toEqual('');
    fixture.detectChanges();

    // The text content in h1 should be stripped of <script>...</script>.
    expect(compiledComponent.querySelector('h1').textContent).toEqual('Hello');

    // The text content in h2 shouldn't have oppia-img tags but it should
    // contain the safe text within the tag.
    expect(compiledComponent.querySelector('h2').textContent).toEqual('MeHola');

    // The interpolation params sent to translate in h3 should be stripped of
    // <script>...</script>.
    expect(compiledComponent.querySelector('h3').textContent).toEqual('Hello ');

    // The interpolation params sent to translate in h3 should be stripped of
    //  oppia-img tags but should contain the safe content inside the tag.
    expect(
      compiledComponent.querySelector('h4').textContent).toEqual('Hello O');
  }));
});
