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
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {
  TestBed,
  ComponentFixture,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';

import {ErrorPageComponent} from './error-page.component';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowRef} from 'services/contextual/window-ref.service';

describe('ErrorPageComponent', () => {
  let component: ErrorPageComponent;
  let fixture: ComponentFixture<ErrorPageComponent>;
  let windowRef: WindowRef;

  beforeEach(() => {
    try {
      if (window && window.sessionStorage) {
        window.sessionStorage.clear();
      }
    } catch (error) {
      // SessionStorage can throw in restricted environments; ignore safely.
    }

    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      declarations: [ErrorPageComponent],
      providers: [UrlInterpolationService, WindowRef],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorPageComponent);
    component = fixture.componentInstance;
    windowRef = TestBed.inject(WindowRef);
  });

  afterEach(() => {
    // Clean up sessionStorage after each test.
    windowRef.nativeWindow.sessionStorage.clear();
  });

  it('should check if status code is a number', () => {
    component.statusCode = '404';
    expect(component.getStatusCode()).toBe(404);
    expect(component.getStatusCode()).toBeInstanceOf(Number);
  });

  it('should get the static image url', () => {
    component.statusCode = '404';
    expect(component.getStaticImageUrl('/general/oops_mint.webp')).toBe(
      '/assets/images/general/oops_mint.webp'
    );
  });

  it('should extract custom error message from sessionStorage', fakeAsync(() => {
    component.statusCode = '401';
    windowRef.nativeWindow.sessionStorage.setItem(
      'oppia_401_error_message',
      'You must be an admin to access this page.'
    );

    component.ngOnInit();
    tick();

    expect(component.customErrorMessage).toBe(
      'You must be an admin to access this page.'
    );
  }));

  it('should clear sessionStorage after reading error message', fakeAsync(() => {
    component.statusCode = '401';
    windowRef.nativeWindow.sessionStorage.setItem(
      'oppia_401_error_message',
      'You must be an admin to access this page.'
    );

    component.ngOnInit();
    tick();

    expect(
      windowRef.nativeWindow.sessionStorage.getItem('oppia_401_error_message')
    ).toBeNull();
  }));

  it('should not set custom error message if sessionStorage is empty', fakeAsync(() => {
    component.statusCode = '401';

    component.ngOnInit();
    tick();

    expect(component.customErrorMessage).toBeNull();
  }));
});
