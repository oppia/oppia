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
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { WindowRef } from 'services/contextual/window-ref.service';

describe('Window Dimensions Service', () => {
  let wds: WindowDimensionsService;
  let wr: WindowRef;

  beforeEach(() => {
    wds = TestBed.inject(WindowDimensionsService);
    wr = TestBed.inject(WindowRef);

    // This approach was choosen because spyOn() doesn't work on properties
    // that doesn't have a get access type.
    // Without this approach the test will fail because it'll throw
    // 'Property innerWidth does not have access type get' error.
    // eslint-disable-next-line max-len
    // ref: https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
    // ref: https://github.com/jasmine/jasmine/issues/1415
    Object.defineProperty(wr.nativeWindow, 'innerWidth', {
      get: () => undefined
    });
    Object.defineProperty(wr.nativeWindow, 'innerHeight', {
      get: () => undefined
    });
  });

  describe('getWidth', () => {
    it('should get window width by innerWidth', () => {
      spyOnProperty(wr.nativeWindow, 'innerWidth').and.returnValue(1000);
      expect(wds.getWidth()).toEqual(1000);
    });

    it('should get window width by clientWidth', () => {
      spyOnProperty(wr.nativeWindow, 'innerWidth').and.returnValue(0);
      spyOnProperty(wr.nativeWindow.document.documentElement, 'clientWidth')
        .and.returnValue(1000);
      expect(wds.getWidth()).toEqual(1000);
    });

    it('should get window width by document clientWidth', () => {
      spyOnProperty(wr.nativeWindow, 'innerWidth').and.returnValue(0);
      spyOnProperty(wr.nativeWindow.document.documentElement, 'clientWidth')
        .and.returnValue(0);
      spyOnProperty(wr.nativeWindow.document.body, 'clientWidth')
        .and.returnValue(1000);
      expect(wds.getWidth()).toEqual(1000);
    });
  });

  describe('getHeight', () => {
    it('should get window Height by innerHeight', () => {
      spyOnProperty(wr.nativeWindow, 'innerHeight').and.returnValue(1000);
      expect(wds.getHeight()).toEqual(1000);
    });

    it('should get window Height by clientHeight', () => {
      spyOnProperty(wr.nativeWindow, 'innerHeight').and.returnValue(0);
      spyOnProperty(wr.nativeWindow.document.documentElement, 'clientHeight')
        .and.returnValue(1000);
      expect(wds.getHeight()).toEqual(1000);
    });

    it('should get window Height by document clientHeight', () => {
      spyOnProperty(wr.nativeWindow, 'innerHeight').and.returnValue(0);
      spyOnProperty(wr.nativeWindow.document.documentElement, 'clientHeight')
        .and.returnValue(0);
      spyOnProperty(wr.nativeWindow.document.body, 'clientHeight')
        .and.returnValue(1000);
      expect(wds.getHeight()).toEqual(1000);
    });
  });

  it('should check if window is narrow', () => {
    spyOnProperty(wr.nativeWindow, 'innerWidth').and.returnValue(668);

    expect(wds.isWindowNarrow()).toBe(true);
  });

  it('should return observable on window resize', () => {
    let mockWidth = 668;
    spyOnProperty(wr.nativeWindow, 'innerWidth').and.returnValue(mockWidth);

    let subscription = wds.getResizeEvent().subscribe(evt => {
      expect(wds.getWidth()).toEqual(668);
    });
    window.dispatchEvent(new Event('resize'));
    subscription.unsubscribe();
  });
});
