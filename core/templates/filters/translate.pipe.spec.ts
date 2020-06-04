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
    I18n_rogue: '<script>alert(\'Oppia\');</script>Hello'
  };

  getInterpolatedString(key: string,
      interpolateParams?: Object) {
    const str = this.translations[key];
    if (!str) {
      return key;
    }
    return str;
  }
}

describe('TranslatePipe', () => {
  let pipe: TranslatePipe;
  let translateService: TranslateService;
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
    translateService = TestBed.get(TranslateService);
    changeDecRef = TestBed.get(ChangeDetectorRef);
    pipe = new TranslatePipe(
      translateService, changeDecRef, new UtilsService());
  }));

  it('should translate', () => {
    expect(pipe.transform('I18n_t_1')).toBe('Hello');
    expect(pipe.transform('I18n_t_2', {val: 'World'})).toBe('Hello <[val]>');
    expect(pipe.transform('I18n_t_2', {val: 'World'})).toBe('Hello <[val]>');
    expect(pipe.transform('I18n_t_3')).toBe('I18n_t_3');
    expect(pipe.transform('')).toBe('');
    translateService.onLangChange.emit({lang: 'en'});
  });

  // The sole purpose of this test is to cover ngOnDestroy.
  it('should destroy subscriptions', () => {
    pipe.ngOnDestroy();
    expect(pipe).not.toBeDefined;
    // Reintializing the pipe because jasmine tries to destroy the pipe.
    // But since ngOnDestroy method has been called and the pipe is destroyed.
    // And if the pipe is not reinitialized karma will raise an error saying
    // "cannot call ngOnDestroy of undefined".
    pipe = new TranslatePipe(
      translateService, changeDecRef, new UtilsService());
  });
});

@Component({
  // eslint-disable-next-line angular/no-inline-template
  template: '<h1 [innerHTML] = "\'I18n_rogue\' | translate"></h1>'
})
class MockComponent { }

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
    // been rendered yet
    expect(compiledComponent.querySelector('h1').textContent).toEqual('');
    fixture.detectChanges();
    // The content should be stripped of <script>...<script>
    expect(compiledComponent.querySelector('h1').textContent).toEqual('Hello');
  }));
});
