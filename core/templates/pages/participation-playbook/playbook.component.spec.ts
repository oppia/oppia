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

import { NO_ERRORS_SCHEMA, EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed, async, fakeAsync, tick } from
  '@angular/core/testing';

import { PlaybookPageComponent } from './playbook.component';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';

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
      hash: '',
      hashChange: null,
      href: '',
      reload: (val: string) => val
    },
    get onhashchange() {
      return this.location.hashChange;
    },

    set onhashchange(val) {
      this.location.hashChange = val;
    },
    gtag: () => {}
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

let component: PlaybookPageComponent;
let fixture: ComponentFixture<PlaybookPageComponent>;

describe('Playbook Page', () => {
  let windowRef: MockWindowRef;
  let siteAnalyticsService: SiteAnalyticsService;
  let i18nLanguageCodeService: I18nLanguageCodeService;

  beforeEach(async(() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      declarations: [PlaybookPageComponent, MockTranslatePipe],
      providers: [
        {
          provide: I18nLanguageCodeService,
          useClass: MockI18nLanguageCodeService
        },
        {
          provide: SiteAnalyticsService,
          useClass: MockSiteAnalyticsService
        },
        UrlInterpolationService,
        {
          provide: WindowRef,
          useValue: windowRef
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    siteAnalyticsService = TestBed.get(SiteAnalyticsService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaybookPageComponent);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    component = fixture.componentInstance;
    fixture.detectChanges();

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);
  });

  it('should get static image url', () => {
    expect(component.getStaticImageUrl('/path/to/image')).toBe(
      '/assets/images/path/to/image');
  });

  it('should apply to teach with oppia', fakeAsync(() => {
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
    tick(150);
    fixture.detectChanges();
    expect(windowRef.nativeWindow.location.href).toBe(
      'https://goo.gl/forms/0p3Axuw5tLjTfiri1');
    expect(applyToTeachWithOppiaEventSpy).toHaveBeenCalled();
  }));

  it('should get RTL language status correctly', () => {
    expect(component.isLanguageRTL()).toEqual(true);
  });
});
