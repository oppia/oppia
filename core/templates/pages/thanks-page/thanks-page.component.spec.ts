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
 * @fileoverview Unit tests for thanks page component.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ThanksPageComponent} from './thanks-page.component';

describe('Thanks page', function () {
  let component: ThanksPageComponent;
  let fixture: ComponentFixture<ThanksPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ThanksPageComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ThanksPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should set thanks image url when getStaticImageUrl is called', () => {
    expect(component.getStaticCopyrightedImageUrl('/general/donate.png')).toBe(
      '/assets/copyrighted-images/general/donate.png'
    );
  });
});
