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
 * @fileoverview Unit tests for the OppiaAngularRootComponent.
 */

import { TranslateService } from '@ngx-translate/core';
import { TranslateCacheService, TranslateCacheSettings } from 'ngx-translate-cache';
import { ComponentFixture, TestBed, async } from
  '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AngularFireAuth } from '@angular/fire/auth';
import { CookieModule, CookieService } from 'ngx-cookie';
import { OppiaAngularRootComponent } from './oppia-angular-root.component';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RichTextComponentsModule } from 'rich_text_components/rich-text-components.module';
import { CkEditorInitializerService } from './ck-editor-helpers/ck-editor-4-widgets.initializer';
import { MetaTagCustomizationService } from 'services/contextual/meta-tag-customization.service';
import { DocumentAttributeCustomizationService } from 'services/contextual/document-attribute-customization.service';
import { WindowRef } from 'services/contextual/window-ref.service';

let component: OppiaAngularRootComponent;
let fixture: ComponentFixture<OppiaAngularRootComponent>;
const CACHE_KEY_FOR_TESTS: string = 'CACHED_LANG_KEY';

class MockWindowRef {
  nativeWindow = {
    location: {
      reload: () => {},
      toString: () => {
        return 'http://localhost:8181/?lang=es';
      }
    },
    history: {
      pushState(data, title: string, url?: string | null) {}
    }
  };
}

describe('OppiaAngularRootComponent', function() {
  let emitSpy: jasmine.Spy;
  let windowRef: WindowRef;
  let cookieService: CookieService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule,
        RichTextComponentsModule,
        CookieModule.forRoot()],
      declarations: [OppiaAngularRootComponent],
      providers: [
        {
          provide: AngularFireAuth,
          useValue: null
        },
        {
          provide: TranslateCacheService,
          useValue: {
            init: () => {},
            getCachedLanguage: () => {
              return 'en';
            }
          }
        },
        {
          provide: TranslateService,
          useValue: {
            use: () => {}
          }
        },
        {
          provide: TranslateCacheSettings,
          useValue: {
            // We directly return name of cache in which language key code
            // will be stored, mocking TranslateCacheSettings where a cache name
            // is generated using injection token which comes from angular.
            cacheName: CACHE_KEY_FOR_TESTS
          }
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
        MetaTagCustomizationService,
        {
          provide: DocumentAttributeCustomizationService,
          useValue: {
            addAttribute: (attr, code) => {}
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(OppiaAngularRootComponent);
    component = fixture.componentInstance;
    windowRef = TestBed.inject(WindowRef);
    cookieService = TestBed.inject(CookieService);
    let metaTagCustomizationService = (
      TestBed.inject(MetaTagCustomizationService));
    emitSpy = spyOn(component.initialized, 'emit');
    spyOn(metaTagCustomizationService, 'addOrReplaceMetaTags')
      .and.returnValue();
  }));

  it('should only intialize rteElements once', () => {
    expect(OppiaAngularRootComponent.rteElementsAreInitialized).toBeTrue();
    expect(TestBed.createComponent(
      OppiaAngularRootComponent).componentInstance).toBeDefined();
  });

  it('should emit once ngAfterViewInit is called', () => {
    spyOn(CkEditorInitializerService, 'ckEditorInitializer').and.callFake(
      () => {});
    component.ngAfterViewInit();
    TestBed.inject(I18nLanguageCodeService).setI18nLanguageCode('en');

    expect(emitSpy).toHaveBeenCalled();
  });

  it('should set cache language according to URL lang param', () => {
    // Setting 'en' as cache language code.
    cookieService.put(CACHE_KEY_FOR_TESTS, 'en');
    // This sets the url to 'http://localhost:8181/?lang=es'
    // when initialized.
    spyOn(windowRef.nativeWindow.location, 'toString')
      .and.returnValue('http://localhost:8181/?lang=es');
    expect(cookieService.get(CACHE_KEY_FOR_TESTS)).toBe('en');

    component.ngAfterViewInit();

    expect(cookieService.get(CACHE_KEY_FOR_TESTS)).toBe('es');
    expect(component.url.toString()).toBe('http://localhost:8181/?lang=es');
  });

  it('should remove language param from URL if it is invalid', () => {
    cookieService.put(CACHE_KEY_FOR_TESTS, 'en');
    spyOn(cookieService, 'put');
    // This sets the url to 'http://localhost:8181/?lang=invalid'
    // when initialized.
    spyOn(windowRef.nativeWindow.location, 'toString')
      .and.returnValue('http://localhost:8181/?lang=invalid');

    component.ngAfterViewInit();

    // Translation cache should not be updated as the language param
    // is invalid.
    expect(cookieService.put).not.toHaveBeenCalledWith();
    expect(cookieService.get(CACHE_KEY_FOR_TESTS)).toBe('en');
    expect(component.url.toString()).toBe('http://localhost:8181/');
  });

  it('should not update translation cache if no language param is present in' +
  ' URL', () => {
    cookieService.put(CACHE_KEY_FOR_TESTS, 'en');
    // This sets the url to 'http://localhost:8181/' when initialized.
    spyOn(windowRef.nativeWindow.location, 'toString')
      .and.returnValue('http://localhost:8181');
    spyOn(cookieService, 'put');

    component.ngAfterViewInit();

    expect(cookieService.put).not.toHaveBeenCalledWith();
    expect(component.url.toString()).toBe('http://localhost:8181/');
    expect(cookieService.get(CACHE_KEY_FOR_TESTS)).toBe('en');
  });
});
