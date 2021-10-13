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
 * @fileoverview Unit tests for off screen preview component.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { OffScreenPreviewComponent } from './off-screen-preview.component';

describe('Off screen preview component', () => {
  let fixture: ComponentFixture<OffScreenPreviewComponent>;
  let componentInstance: OffScreenPreviewComponent;
  let windowDimensionsService: WindowDimensionsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [OffScreenPreviewComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OffScreenPreviewComponent);
    componentInstance = fixture.componentInstance;
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should tell if window can show two cards', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(1000);

    expect(componentInstance.canWindowShowTwoCards()).toBeTrue();
    expect(windowDimensionsService.getWidth).toHaveBeenCalled();
  });
});
