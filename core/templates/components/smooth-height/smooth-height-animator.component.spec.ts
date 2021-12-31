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
 * @fileoverview Unit tests for Smooth Height animation component.
 */

import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { SmoothHeightAnimatorComponent } from './smooth-height-animator.component';

describe('Smooth height animator component', () => {
  let componentInstance: SmoothHeightAnimatorComponent;
  let fixture: ComponentFixture<SmoothHeightAnimatorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SmoothHeightAnimatorComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SmoothHeightAnimatorComponent);
    componentInstance = fixture.componentInstance;
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should trigger animation when trigger changes', fakeAsync(() => {
    componentInstance.ngOnChanges();

    tick(200);

    expect(componentInstance.startHeight).toBeDefined();
    expect(componentInstance.grow).toBeDefined();
  }));
});
