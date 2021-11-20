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

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SmoothHeightComponent } from './smooth-height-animation.component';

describe('Smooth height animation component', () => {
  let componentInstance: SmoothHeightComponent;
  let fixture: ComponentFixture<SmoothHeightComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SmoothHeightComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SmoothHeightComponent);
    componentInstance = fixture.componentInstance;
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should trigger animation when trigger changes', () => {
    componentInstance.ngOnChanges();

    expect(componentInstance.startHeight).toBeDefined();
    expect(componentInstance.grow).toBeDefined();
  });
});
