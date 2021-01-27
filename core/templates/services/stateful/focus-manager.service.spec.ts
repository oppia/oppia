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
 * @fileoverview Unit tests for the FocusManagerService.
 */

import { fakeAsync, flush, TestBed } from '@angular/core/testing';

import { Subscription } from 'rxjs';

import { AppConstants } from 'app.constants';
import { IdGenerationService } from 'services/id-generation.service';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';

describe('Focus Manager Service', () => {
  let focusManagerService: FocusManagerService;
  let deviceInfoService: DeviceInfoService;
  let idGenerationService: IdGenerationService;

  const clearLabel = AppConstants.LABEL_FOR_CLEARING_FOCUS;
  const focusLabel = 'FocusLabel';
  const focusLabelTwo = 'FocusLabelTwo';

  let focusOnSpy: jasmine.Spy;
  let testSubscriptions: Subscription;

  beforeEach(() => {
    focusManagerService = TestBed.get(FocusManagerService);
    deviceInfoService = TestBed.get(DeviceInfoService);
    idGenerationService = TestBed.get(IdGenerationService);

    focusOnSpy = jasmine.createSpy('focusOn');
    testSubscriptions = new Subscription();
    testSubscriptions.add(focusManagerService.onFocus.subscribe(focusOnSpy));
  });

  it('should generate a random string for focus label', () => {
    spyOn(idGenerationService, 'generateNewId');
    focusManagerService.generateFocusLabel();
    expect(idGenerationService.generateNewId).toHaveBeenCalled();
  });

  it('should set focus label and broadcast it', fakeAsync(() => {
    focusManagerService.setFocus(focusLabel);
    flush();
    expect(focusOnSpy).toHaveBeenCalledWith(focusLabel);
  }));

  it('should not be able to reset focus label', fakeAsync(() => {
    focusManagerService.setFocus(focusLabel);
    expect(focusManagerService.setFocus(focusLabelTwo)).toEqual(undefined);
    flush();
    expect(focusOnSpy).toHaveBeenCalledWith(focusLabel);
  }));

  it('should set label to clear focus and broadcast it', fakeAsync(() => {
    focusManagerService.clearFocus();
    flush();
    expect(focusOnSpy).toHaveBeenCalledWith(clearLabel);
  }));

  it('should set focus label if on desktop and broadcast it', fakeAsync(() => {
    focusManagerService.setFocusIfOnDesktop(focusLabel);
    if (!deviceInfoService.isMobileDevice()) {
      flush();
      expect(focusOnSpy).toHaveBeenCalledWith(focusLabel);
    }
  }));
});
