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
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { async, TestBed, ComponentFixture } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';

import { Error404PageComponent } from './error-404-page.component';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { PageTitleService } from 'services/page-title.service';
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

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

let component: Error404PageComponent;
let fixture: ComponentFixture<Error404PageComponent>;

describe('Error page', () => {
  let pageTitleService: PageTitleService;
  let translateService: TranslateService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [Error404PageComponent, MockTranslatePipe],
      providers: [
        {
          provide: I18nLanguageCodeService,
          useClass: MockI18nLanguageCodeService
        },
        UrlInterpolationService,
        PageTitleService,
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Error404PageComponent);
    component = fixture.componentInstance;
    translateService = TestBed.inject(TranslateService);
    pageTitleService = TestBed.inject(PageTitleService);
    fixture.detectChanges();
  });

  it('should set images and subscribe to onLangChange upon initialization',
    () => {
      spyOn(translateService.onLangChange, 'subscribe');
      component.ngOnInit();
      expect(component.getStaticImageUrl('/general/oops_mint.webp'))
        .toBe('/assets/images/general/oops_mint.webp');
      expect(translateService.onLangChange.subscribe).toHaveBeenCalled();
    });

  it('should obtain translated page title whenever the selected' +
  'language changes', () => {
    component.ngOnInit();
    spyOn(component, 'setPageTitle');
    translateService.onLangChange.emit();

    expect(component.setPageTitle).toHaveBeenCalled();
  });

  it('should set new page title', () => {
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(pageTitleService, 'setDocumentTitle');
    component.setPageTitle();

    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_ERROR_PAGE_TITLE_404');
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'I18N_ERROR_PAGE_TITLE_404');
  });

  it('should unsubscribe on component destruction', () => {
    component.directiveSubscriptions.add(
      translateService.onLangChange.subscribe(() => {
        component.setPageTitle();
      })
    );
    component.ngOnDestroy();

    expect(component.directiveSubscriptions.closed).toBe(true);
  });
});
