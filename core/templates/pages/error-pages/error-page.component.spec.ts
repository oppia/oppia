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
 * @fileoverview Unit tests for error page.
 */
import { Pipe, EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { async, TestBed, ComponentFixture } from '@angular/core/testing';

import { ErrorPageComponent } from './error-page.component';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { PageTitleService } from 'services/page-title.service';
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

let component: ErrorPageComponent;
let fixture: ComponentFixture<ErrorPageComponent>;

describe('Error page', () => {
  let pageTitle = null;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ErrorPageComponent, MockTranslatePipe],
      providers: [
        {
          provide: I18nLanguageCodeService,
          useClass: MockI18nLanguageCodeService
        },
        { provide: TranslateService, useClass: MockTranslateService },
        UrlInterpolationService,
        PageTitleService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    pageTitle = TestBed.get(PageTitleService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ErrorPageComponent);
    component = fixture.componentInstance;
    component.statusCode = '404';
    fixture.detectChanges();
  });

  it('should check if status code is a number', () => {
    expect(component.getStatusCode()).toBe(404);
    expect(component.getStatusCode()).toBeInstanceOf(Number);
  });

  it('should set images and page title when $onInit triggers', () => {
    component.ngOnInit();
    expect(component.getStaticImageUrl('/general/oops_mint.webp'))
      .toBe('/assets/images/general/oops_mint.webp');
    expect(pageTitle.getPageTitle()).toBe('Error 404 - Oppia');
  });
});
