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
 * @fileoverview Unit tests for the about page.
 */

import { ComponentFixture, fakeAsync, TestBed} from '@angular/core/testing';
import { EventEmitter, NO_ERRORS_SCHEMA, Pipe, PipeTransform }
  from '@angular/core';

import { AboutPageComponent } from './about-page.component';
import { AboutPageConstants } from './about-page.constants';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { TranslateService } from 'services/translate.service';
import { UtilsService } from 'services/utils.service';

@Pipe({name: 'translate'})
class MockTranslatePipe {
  transform(value: string, params: Object | undefined):string {
    return value;
  }
}

class MockTranslateService {
  languageCode = 'es';
  use(newLanguageCode: string): string {
    this.languageCode = newLanguageCode;
    return this.languageCode;
  }
}

class MockI18nLanguageCodeService {
  codeChangeEventEmiiter = new EventEmitter<string>();
  getCurrentI18nLanguageCode() {
    return 'en';
  }

  get onI18nLanguageCodeChange() {
    return this.codeChangeEventEmiiter;
  }
}

// Mocking window object here because changing location.href causes the
// full page to reload. Page reloads raise an error in karma.
class MockWindowRef {
  _window = {
    location: {
      _hash: '',
      _hashChange: null,
      get hash() {
        return this._hash;
      },
      set hash(val) {
        this._hash = val;
        if (this._hashChange === null) {
          return;
        }
        this._hashChange();
      },
      reload: (val) => val
    },
    get onhashchange() {
      return this.location._hashChange;
    },

    set onhashchange(val) {
      this.location._hashChange = val;
    }
  };
  get nativeWindow() {
    return this._window;
  }
}

let component: AboutPageComponent;
let fixture: ComponentFixture<AboutPageComponent>;

describe('About Page', function() {
  let i18n = null;
  let translate = null;
  let windowRef: MockWindowRef;

  beforeEach(() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      declarations: [AboutPageComponent, MockTranslatePipe],
      providers: [
        {
          provide: I18nLanguageCodeService,
          useClass: MockI18nLanguageCodeService
        },
        { provide: TranslateService, useClass: MockTranslateService },
        UtilsService,
        UrlInterpolationService,
        { provide: WindowRef, useValue: windowRef }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    translate = TestBed.get(TranslateService);
    i18n = TestBed.get(I18nLanguageCodeService);
    fixture = TestBed.createComponent(AboutPageComponent);
    component = fixture.componentInstance;
  });

  it('should click on about tab', () => {
    component.ngOnInit();
    expect(component.activeTabName).toBe('about');

    component.onTabClick('about');

    expect(windowRef.nativeWindow.location.hash).toBe('#about');
    expect(component.activeTabName).toBe('about');
  });

  it('should click on license tab', fakeAsync(() => {
    component.ngOnInit();
    expect(component.activeTabName).toBe('about');

    component.onTabClick('license');
    fixture.detectChanges();
    expect(windowRef.nativeWindow.location.hash).toBe('#license');
    expect(component.activeTabName).toBe('foundation');
  }));

  it('should click on foundation tab', () => {
    component.ngOnInit();
    expect(component.activeTabName).toBe('about');

    component.onTabClick('foundation');

    expect(windowRef.nativeWindow.location.hash).toBe('#foundation');
    expect(component.activeTabName).toBe('foundation');
  });

  it('should click on credits tab', () => {
    component.ngOnInit();
    expect(component.activeTabName).toBe('about');

    component.onTabClick('credits');


    expect(windowRef.nativeWindow.location.hash).toBe('#credits');
    expect(component.activeTabName).toBe('credits');
  });

  it('should activate about tab on init', () => {
    windowRef.nativeWindow.location.hash = '#about';

    component.ngOnInit();

    expect(windowRef.nativeWindow.location.hash).toBe('#about');
    expect(component.activeTabName).toBe('about');
  });

  it('should activate about license on init', () => {
    windowRef.nativeWindow.location.hash = '#license';

    component.ngOnInit();

    expect(windowRef.nativeWindow.location.hash).toBe('#license');
    expect(component.activeTabName).toBe('foundation');
  });

  it('should activate foundation tab on init', () => {
    windowRef.nativeWindow.location.hash = '#foundation';

    component.ngOnInit();

    expect(windowRef.nativeWindow.location.hash).toBe('#foundation');
    expect(component.activeTabName).toBe('foundation');
  });

  it('should activate credits tab on init', () => {
    windowRef.nativeWindow.location.hash = '#credits';

    component.ngOnInit();

    expect(windowRef.nativeWindow.location.hash).toBe('#credits');
    expect(component.activeTabName).toBe('credits');
  });

  it('should get static image url', () => {
    expect(component.getStaticImageUrl('/path/to/image')).toBe(
      '/assets/images/path/to/image');
  });

  it('should initialize listOfNames and aboutPageMascotImgUrl variables' +
    ' when onInit is called', () => {
    component.ngOnInit();

    expect(component.listOfNames).toBe(
      'Alex Kauffmann, Allison Barros, Amy Latten, Brett Barros,' +
      ' Crystal Kwok, Daniel Hernandez, Divya Siddarth, Ilwon Yoon,' +
      ' Jennifer Chen, John Cox, John Orr, Katie Berlent, Michael Wawszczak,' +
      ' Mike Gainer, Neil Fraser, Noah Falstein, Nupur Jain, Peter Norvig,' +
      ' Philip Guo, Piotr Mitros, Rachel Chen, Rahim Nathwani, Robyn Choo,' +
      ' Tricia Ngoon, Vikrant Nanda, Vinamrata Singal & Yarin Feigenbaum');
    expect(component.aboutPageMascotImgUrl).toBe(
      '/assets/images/general/about_page_mascot.webp');
  });


  it ('should receive code changes from I18n-language-code-service', fakeAsync(
    () => {
      component.ngOnInit();

      i18n.codeChangeEventEmiiter.emit('en');
      fixture.detectChanges();
      expect(translate.languageCode).toBe('en');
    }));

  it('should obtain developer names with a letter', () => {
    const namesWithV = AboutPageConstants.CREDITS_CONSTANTS.filter(
      (credit) => credit.startsWith('V')).sort();
    expect(component.getCredits('V')).toEqual(namesWithV);
    expect(component.getCredits('8')).toEqual([]);
  });
});
