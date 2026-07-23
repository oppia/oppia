// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for AdventureNavigationComponent.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {AdventureNavigationComponent} from './adventure-navigation.component';

describe('AdventureNavigationComponent', () => {
  let component: AdventureNavigationComponent;
  let fixture: ComponentFixture<AdventureNavigationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AdventureNavigationComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AdventureNavigationComponent);
    component = fixture.componentInstance;
  }));

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should mark first lesson as active when no explicit active lesson exists', () => {
    component.activeLessonNumber = null;

    expect(component.isActiveLesson(1)).toBeTrue();
    expect(component.isActiveLesson(2)).toBeFalse();
  });

  it('should mark matching lesson as active when active lesson is provided', () => {
    component.activeLessonNumber = 3;

    expect(component.isActiveLesson(3)).toBeTrue();
    expect(component.isActiveLesson(2)).toBeFalse();
  });
});
