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
 * @fileoverview Unit tests for the on screen keyboard component.
 */

import { DeviceInfoService } from 'services/contextual/device-info.service.ts';
import { GuppyInitializationService } from
  'services/guppy-initialization.service.ts';
import { WindowRef } from 'services/contextual/window-ref.service.ts';


describe('OnScreenKeyboard', function() {
  var ctrl = null;

  var guppyInitializationService = null;
  let deviceInfoService = null;

  class MockGuppy {
    engine = {
      insert_string: function(_) {},
      insert_symbol: function(_) {},
      backspace: function() {},
      left: function() {},
      right: function() {},
    };

    activate() {
      ctrl.isActive = true;
    }
  }

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    guppyInitializationService = new GuppyInitializationService();
    deviceInfoService = new DeviceInfoService(new WindowRef());

    $provide.value('GuppyInitializationService', guppyInitializationService);
    $provide.value('DeviceInfoService', deviceInfoService);
  }));
  beforeEach(angular.mock.inject(function($componentController) {
    ctrl = $componentController('onScreenKeyboard');
    guppyInitializationService.setShowOSK(true);
    ctrl.isActive = false;
  }));

  it('should only show the OSK for mobile devices', function() {
    spyOn(deviceInfoService, 'isMobileUserAgent').and.returnValue(false);
    spyOn(deviceInfoService, 'hasTouchEvents').and.returnValue(false);
    expect(ctrl.showOSK()).toBeFalse();
  });

  it('should only show the OSK if there is an active guppy object', function() {
    spyOn(deviceInfoService, 'isMobileUserAgent').and.returnValue(true);
    spyOn(deviceInfoService, 'hasTouchEvents').and.returnValue(true);
    spyOn(guppyInitializationService, 'findActiveGuppyObject').and.returnValue(
      undefined);
    expect(ctrl.showOSK()).toBeFalse();
  });

  it('should set showOSK value to false upon hiding the OSK', function() {
    spyOn(deviceInfoService, 'isMobileUserAgent').and.returnValue(true);
    spyOn(deviceInfoService, 'hasTouchEvents').and.returnValue(true);
    spyOn(guppyInitializationService, 'findActiveGuppyObject').and.returnValue(
      {guppyInstance: new MockGuppy()});
    expect(guppyInitializationService.getShowOSK()).toBeTrue();
    ctrl.hideOSK();
    expect(guppyInitializationService.getShowOSK()).toBeFalse();
  });

  it('should activate the instance upon each key press function call',
    function() {
      spyOn(deviceInfoService, 'isMobileUserAgent').and.returnValue(true);
      spyOn(deviceInfoService, 'hasTouchEvents').and.returnValue(true);
      spyOn(
        guppyInitializationService, 'findActiveGuppyObject').and.returnValue(
        {guppyInstance: new MockGuppy()});
      expect(ctrl.showOSK()).toBeTrue();

      expect(ctrl.isActive).toBeFalse();
      ctrl.activateGuppy();
      expect(ctrl.isActive).toBeTrue();

      ctrl.isActive = false;

      expect(ctrl.isActive).toBeFalse();
      ctrl.changeTab('newTab');
      expect(ctrl.isActive).toBeTrue();

      ctrl.isActive = false;

      expect(ctrl.isActive).toBeFalse();
      ctrl.insertString('x');
      expect(ctrl.isActive).toBeTrue();

      ctrl.isActive = false;

      expect(ctrl.isActive).toBeFalse();
      ctrl.insertSymbol('x');
      expect(ctrl.isActive).toBeTrue();

      ctrl.isActive = false;

      expect(ctrl.isActive).toBeFalse();
      ctrl.backspace();
      expect(ctrl.isActive).toBeTrue();

      ctrl.isActive = false;

      expect(ctrl.isActive).toBeFalse();
      ctrl.left();
      expect(ctrl.isActive).toBeTrue();

      ctrl.isActive = false;

      expect(ctrl.isActive).toBeFalse();
      ctrl.right();
      expect(ctrl.isActive).toBeTrue();

      ctrl.isActive = false;

      expect(ctrl.isActive).toBeFalse();
      ctrl.exponent('2');
      expect(ctrl.isActive).toBeTrue();
    }
  );

  it('should get static image url', function() {
    var imagePath = '/path/to/image.png';
    expect(ctrl.getStaticImageUrl(imagePath)).toBe(
      '/assets/images/path/to/image.png');
  });
});
