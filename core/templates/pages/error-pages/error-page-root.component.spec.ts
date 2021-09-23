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

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
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

describe('Error page root component', () => {
  let fixture: ComponentFixture<ErrorPageRootComponent>;
  let componentInstance: ErrorPageRootComponent;
  let pageTitleService: PageTitleService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ErrorPageRootComponent],
      providers: [
        PageTitleService,
        {
          provide: WindowRef,
          useClass: MockWindowRef
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ErrorPageRootComponent);
    componentInstance = fixture.componentInstance;
    pageTitleService = TestBed.inject(PageTitleService);
    fixture.detectChanges();
  });

  it('should initialize', () => {
    spyOn(pageTitleService, 'setDocumentTitle');
    componentInstance.ngOnInit();
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalled();
    expect(componentInstance.statusCode).toEqual('401');
  });
});
