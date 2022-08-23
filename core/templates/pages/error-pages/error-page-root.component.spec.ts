// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for error page root.
 */

import { NO_ERRORS_SCHEMA, EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';

import { WindowRef } from 'services/contextual/window-ref.service';
import { PageTitleService } from 'services/page-title.service';
import { ErrorPageRootComponent } from './error-page-root.component';

class MockWindowRef {
  nativeWindow = {
    document: {
      getElementsByTagName(tagName: string) {
        return [{
          getAttribute(attr: string) {
            return '401';
          }
        }];
      }
    }
  };
}

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

describe('Error page root component', () => {
  let fixture: ComponentFixture<ErrorPageRootComponent>;
  let componentInstance: ErrorPageRootComponent;
  let pageTitleService: PageTitleService;
  let translateService: TranslateService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ErrorPageRootComponent],
      providers: [
        PageTitleService,
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ErrorPageRootComponent);
    componentInstance = fixture.componentInstance;
    pageTitleService = TestBed.inject(PageTitleService);
    translateService = TestBed.inject(TranslateService);
    fixture.detectChanges();
  });

  it('should initialize', () => {
    spyOn(translateService.onLangChange, 'subscribe');
    componentInstance.ngOnInit();
    expect(translateService.onLangChange.subscribe).toHaveBeenCalled();
    expect(componentInstance.statusCode).toEqual('401');
  });

  it('should obtain translated page title whenever the selected' +
  'language changes', () => {
    componentInstance.ngOnInit();
    spyOn(componentInstance, 'setPageTitle');
    translateService.onLangChange.emit();

    expect(componentInstance.setPageTitle).toHaveBeenCalled();
  });

  it('should set new page title', () => {
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(pageTitleService, 'setDocumentTitle');
    componentInstance.statusCode = '404';
    componentInstance.setPageTitle();

    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_ERROR_PAGE_ROOT_BROWSER_TAB_TITLE', {
        statusCode: '404',
      });
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'I18N_ERROR_PAGE_ROOT_BROWSER_TAB_TITLE');
  });

  it('should unsubscribe on component destruction', () => {
    componentInstance.directiveSubscriptions.add(
      translateService.onLangChange.subscribe(() => {
        componentInstance.setPageTitle();
      })
    );
    componentInstance.ngOnDestroy();

    expect(componentInstance.directiveSubscriptions.closed).toBe(true);
  });
});
