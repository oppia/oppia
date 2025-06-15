// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ClassroomButtonComponent
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FormsModule} from '@angular/forms';
import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {ClassroomButtonComponent} from './classroom-button.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';

describe('ClassroomButtonComponent', () => {
  let component: ClassroomButtonComponent;
  let fixture: ComponentFixture<ClassroomButtonComponent>;
  let urlInterpolationService: UrlInterpolationService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule],
      providers: [UrlInterpolationService],
      declarations: [ClassroomButtonComponent, MockTranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassroomButtonComponent);
    component = fixture.componentInstance;
    urlInterpolationService = TestBed.inject(UrlInterpolationService);

    component.variant = 'blue';
    component.classroom = 'math';
  });

  it('should set classoomUrl correctly', () => {
    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(
      '/learn/math'
    );

    component.ngOnInit();

    expect(component.classroomUrl).toEqual('/learn/math');
  });
});
