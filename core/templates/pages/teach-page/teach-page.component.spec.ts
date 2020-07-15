// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the teach page.
 */

import { ComponentFixture, TestBed} from
  '@angular/core/testing';
import { NO_ERRORS_SCHEMA, Pipe, EventEmitter } from '@angular/core';

import { TeachPageComponent } from './teach-page.component';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { TranslateService } from 'services/translate.service';

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
      _href: '',
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
      get href() {
        return this._href;
      },
      set href(val) {
        this._href = val;
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

class MockSiteAnalyticsService {
  registerApplyToTeachWithOppiaEvent(): void {
    return;
  }
}

let component: TeachPageComponent;
let fixture: ComponentFixture<TeachPageComponent>;

describe('Teach Page', function() {
  let windowRef: MockWindowRef;
  let siteAnalyticsService = null;
  let i18n = null;
  let translate = null;

  beforeEach(async() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      declarations: [TeachPageComponent, MockTranslatePipe],
      providers: [
        {
          provide: I18nLanguageCodeService,
          useClass: MockI18nLanguageCodeService
        },
        { provide: SiteAnalyticsService, useClass: MockSiteAnalyticsService },
        { provide: TranslateService, useClass: MockTranslateService },
        UrlInterpolationService,
        { provide: WindowRef, useValue: windowRef }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    i18n = TestBed.get(I18nLanguageCodeService);
    translate = TestBed.get(TranslateService);
    siteAnalyticsService = TestBed.get(SiteAnalyticsService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TeachPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Property onhashchange and location.hash are reassigned because it shares
    // same memory reference to all test blocks and the controller itself
    // because $provide.value of WindowRef refers to windowRef as well.
    // Once location.hash or onhashchange is setted in the controller,
    // the value will be only available in the test block itself, not affecting
    // others test block.
    windowRef.nativeWindow.location.href = '';
    windowRef.nativeWindow.onhashchange = null;
    windowRef.nativeWindow.location.hash = '';
  });

  it('should click on teach tab', () => {
    component.ngOnInit();
    expect(component.activeTabName).toBe('teach');

    component.onTabClick('teach');

    expect(windowRef.nativeWindow.location.hash).toBe('#teach');
    expect(component.activeTabName).toBe('teach');
  });

  it('should click on participation tab', (() => {
    component.ngOnInit();
    expect(component.activeTabName).toBe('teach');

    component.onTabClick('participation');
    expect(windowRef.nativeWindow.location.hash).toBe('#participation');
    expect(component.activeTabName).toBe('participation');
  }));

  it('should activate teach tab on init', () => {
    windowRef.nativeWindow.location.hash = '#teach';

    component.ngOnInit();

    expect(windowRef.nativeWindow.location.hash).toBe('#teach');
    expect(component.activeTabName).toBe('teach');
  });

  it('should activate participation tab on init', () => {
    windowRef.nativeWindow.location.hash = '#participation';

    component.ngOnInit();

    expect(windowRef.nativeWindow.location.hash).toBe('#participation');
    expect(component.activeTabName).toBe('participation');
  });

  it('should get static image url', () => {
    expect(component.getStaticImageUrl('/path/to/image')).toBe(
      '/assets/images/path/to/image');
  });

  it('should apply to teach with oppia', (done) => {
    const applyToTeachWithOppiaEventSpy = spyOn(
      siteAnalyticsService, 'registerApplyToTeachWithOppiaEvent')
      .and.callThrough();

    component.ngOnInit();
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        href: ''
      }
    });
    component.onApplyToTeachWithOppia();
    setTimeout(() => {
      expect(windowRef.nativeWindow.location.href).toBe(
        'https://goo.gl/forms/0p3Axuw5tLjTfiri1');
      expect(applyToTeachWithOppiaEventSpy).toHaveBeenCalled();
      done();
    }, 150);
  });
});
