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
import {TestBed, ComponentFixture} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';

import {ErrorPageComponent} from './error-page.component';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

describe('ErrorPageComponent', () => {
  let component: ErrorPageComponent;
  let fixture: ComponentFixture<ErrorPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      declarations: [ErrorPageComponent],
      providers: [UrlInterpolationService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorPageComponent);
    component = fixture.componentInstance;
    component.statusCode = '404';
  });

  it('should check if status code is a number', () => {
    expect(component.getStatusCode()).toBe(404);
    expect(component.getStatusCode()).toBeInstanceOf(Number);
  });

  it('should get the static image url', () => {
    expect(component.getStaticImageUrl('/general/oops_mint.webp')).toBe(
      '/assets/images/general/oops_mint.webp'
    );
  });
});
