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
 * @fileoverview Unit tests for WindowDimensionsService.
 */
import { TestBed } from '@angular/core/testing';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';

describe('Window Dimensions Service', () => {
  let wds;

  beforeEach(() => {
    wds = TestBed.get(WindowDimensionsService);
  });

  describe('getWidth', () => {
    it('should get window width by innerWidth', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(1000);
      expect(wds.getWidth()).toEqual(1000);
    });

    it('should get window width by clientWidth', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(null);
      spyOnProperty(window.document.documentElement, 'clientWidth').and
        .returnValue(1000);
      expect(wds.getWidth()).toEqual(1000);
    });

    it('should get window width by document clientWidth', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(null);
      spyOnProperty(window.document.documentElement, 'clientWidth').and
        .returnValue(null);
      spyOnProperty(document.body, 'clientWidth').and.returnValue(1000);
      expect(wds.getWidth()).toEqual(1000);
    });
  });

  it('should check if window is narrow', () => {
    spyOnProperty(window, 'innerWidth').and.returnValue(668);

    expect(wds.isWindowNarrow()).toBe(true);
  });

  it('should add and call resize function hook', () => {
    const resizeFnHookSpy = jasmine.createSpy('resizeFn');
    wds.registerOnResizeHook(resizeFnHookSpy);
    wds.onResize(Event);

    expect(resizeFnHookSpy).toHaveBeenCalled();
  });
});
