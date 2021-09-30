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
import { TranslateCacheService } from 'ngx-translate-cache';

import { ComponentFixture, TestBed, async, fakeAsync, tick} from
  '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AngularFireAuth } from '@angular/fire/auth';

import { OppiaAngularRootComponent } from './oppia-angular-root.component';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RichTextComponentsModule } from 'rich_text_components/rich-text-components.module';
import { CkEditorInitializerService } from './ck-editor-helpers/ck-editor-4-widgets.initializer';
import { WindowRef } from 'services/contextual/window-ref.service';

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: '/',
      href: '',
      toString() {
        return 'http://localhost/community';
      }
    },
    history: {
      pushState(data: {}, title: string, url?: string | null) {}
    }
  };
}

let component: OppiaAngularRootComponent;
let fixture: ComponentFixture<OppiaAngularRootComponent>;

describe('OppiaAngularRootComponent', function() {
  let emitSpy: jasmine.Spy;
  let windowRef: MockWindowRef;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RichTextComponentsModule],
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
          provide: WindowRef,
          useClass: MockWindowRef
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(OppiaAngularRootComponent);
    component = fixture.componentInstance;

    emitSpy = spyOn(component.initialized, 'emit');
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

  it('should set site language according to URL', fakeAsync(() => {
    let i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    windowRef = TestBed.inject(WindowRef);
    windowRef.nativeWindow.location = new URL('http://localhost/search/find?lang=es');
    spyOn(i18nLanguageCodeService, 'setI18nLanguageCode');
    component.ngAfterViewInit();
    tick(151);

    expect(i18nLanguageCodeService.setI18nLanguageCode)
      .toHaveBeenCalledWith('es');
  }));
});
