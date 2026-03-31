// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for copy exploration URL component.
 */

import {Clipboard} from '@angular/cdk/clipboard';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {ComponentOverviewComponent} from './copy-url.component';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';

class MockI18nLanguageCodeService {
  isCurrentLanguageRTL(): boolean {
    return true;
  }
}

describe('Copy Exploration URL component', () => {
  let clipboard: Clipboard;
  let component: ComponentOverviewComponent;
  let fixture: ComponentFixture<ComponentOverviewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ComponentOverviewComponent, MockTranslatePipe],
      providers: [
        {
          provide: I18nLanguageCodeService,
          useClass: MockI18nLanguageCodeService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ComponentOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    clipboard = TestBed.inject(Clipboard);
  });

  it('should correctly copy progress URL', fakeAsync(() => {
    spyOn(clipboard, 'copy').and.callThrough();
    let explorationURL = 'https://oppia.org/progress/abcdef';
    component.urlToCopy = explorationURL;

    component.copyUrlButton();
    tick(1000);

    expect(clipboard.copy).toHaveBeenCalledWith(explorationURL);
  }));
});
