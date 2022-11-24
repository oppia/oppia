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

import { ComponentFixture, TestBed, async } from
  '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AngularFireAuth } from '@angular/fire/auth';
import { CookieModule } from 'ngx-cookie';
import { OppiaAngularRootComponent, registerCustomElements } from './oppia-angular-root.component';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { Injector, NO_ERRORS_SCHEMA } from '@angular/core';
// This throws "TS2307". We need to
// suppress this error because rte-text-components are not strictly typed yet.
// @ts-ignore
import { RichTextComponentsModule } from 'rich_text_components/rich-text-components.module';
import { CkEditorInitializerService } from './ck-editor-helpers/ck-editor-4-widgets.initializer';
import { MetaTagCustomizationService } from 'services/contextual/meta-tag-customization.service';
import { DocumentAttributeCustomizationService } from 'services/contextual/document-attribute-customization.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { I18nService } from 'i18n/i18n.service';
import { MockI18nService } from 'tests/unit-test-utils';

let component: OppiaAngularRootComponent;
let fixture: ComponentFixture<OppiaAngularRootComponent>;

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

class WordCount extends HTMLParagraphElement {
  constructor() {
    super();
  }
}

describe('OppiaAngularRootComponent', function() {
  let i18nService: I18nService;
  let emitSpy: jasmine.Spy;

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
          provide: WindowRef,
          useClass: MockWindowRef
        },
        MetaTagCustomizationService,
        {
          provide: DocumentAttributeCustomizationService,
          useValue: {
            addAttribute: (attr, code) => {}
          }
        },
        {
          provide: I18nService,
          useClass: MockI18nService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(OppiaAngularRootComponent);
    component = fixture.componentInstance;
    let metaTagCustomizationService = (
      TestBed.inject(MetaTagCustomizationService));
    emitSpy = spyOn(component.initialized, 'emit');
    spyOn(metaTagCustomizationService, 'addOrReplaceMetaTags')
      .and.returnValue();
    i18nService = TestBed.inject(I18nService);
  }));

  it('should only intialize rteElements once', () => {
    expect(OppiaAngularRootComponent.rteElementsAreInitialized).toBeTrue();
    const componentInstance = TestBed.createComponent(
      OppiaAngularRootComponent).componentInstance;
    expect(componentInstance).toBeDefined();
    spyOn(customElements, 'get').and.callFake(() => WordCount);
    registerCustomElements(TestBed.inject(Injector));
  });

  it('should emit once ngAfterViewInit is called', () => {
    spyOn(CkEditorInitializerService, 'ckEditorInitializer').and.callFake(
      () => {});
    component.ngAfterViewInit();
    TestBed.inject(I18nLanguageCodeService).setI18nLanguageCode('en');

    expect(emitSpy).toHaveBeenCalled();
  });

  it('should detect change in direction', () => {
    let newDirection = 'rtl';

    component.ngAfterViewInit();
    i18nService.directionChangeEventEmitter.emit(newDirection);
    fixture.detectChanges();
    expect(component.direction).toEqual(newDirection);
  });
});
