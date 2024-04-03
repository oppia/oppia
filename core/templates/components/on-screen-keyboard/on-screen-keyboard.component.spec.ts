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

import {DeviceInfoService} from 'services/contextual/device-info.service';
import {
  GuppyInitializationService,
  GuppyObject,
} from 'services/guppy-initialization.service';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {OnScreenKeyboardComponent} from './on-screen-keyboard.component';

describe('On Screen Keyboard', () => {
  let guppyInitializationService: GuppyInitializationService;
  let deviceInfoService: DeviceInfoService;
  let fixture: ComponentFixture<OnScreenKeyboardComponent>;
  let componentInstance: OnScreenKeyboardComponent;
  let guppy: {isActive: boolean} = {
    isActive: false,
  };

  class MockGuppy implements Guppy {
    asciimath!: () => string;
    configure!: () => void;
    deactivate!: () => void;
    doc!: () => Object;
    equations!: () => Object[];
    evaluate!: (evaluators?: Object) => Object;
    event!: (name: string, handler: Function) => void;
    func!: (evaluators?: Object) => Function;
    'import_latex': (text: string) => void;
    'import_syntax_tree': (tree: Object) => void;
    'import_text': (text: string) => void;
    'import_xml': (xml: string) => void;
    'is_changed': () => boolean;
    latex!: () => string;
    'recompute_locations_paths': () => void;
    render!: (updated?: boolean) => void;
    'render_node': (t: string) => string;
    'select_to': (x: number, y: number, mouse: Object) => void;
    'symbols_used': (groups?: string[]) => string[];
    'syntax_tree': () => Object;
    text!: () => string;
    vars!: () => string[];
    xml!: () => string;
    engine = {
      insert_string: (_: string) => {},
      insert_symbol: (_: string) => {},
      backspace: () => {},
      left: () => {},
      right: () => {},
      end: () => {},
    };

    activate(): void {
      guppy.isActive = true;
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [OnScreenKeyboardComponent],
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnScreenKeyboardComponent);
    componentInstance = fixture.componentInstance;
    guppyInitializationService = TestBed.inject(GuppyInitializationService);
    deviceInfoService = TestBed.inject(DeviceInfoService);
    guppyInitializationService.setShowOSK(true);
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should only show the OSK for mobile devices', () => {
    spyOn(deviceInfoService, 'isMobileUserAgent').and.returnValue(false);
    spyOn(deviceInfoService, 'hasTouchEvents').and.returnValue(false);
    expect(componentInstance.showOSK()).toBeFalse();
  });

  it('should only show the OSK if there is an active guppy object', () => {
    spyOn(deviceInfoService, 'isMobileUserAgent').and.returnValue(true);
    spyOn(deviceInfoService, 'hasTouchEvents').and.returnValue(true);
    spyOn(guppyInitializationService, 'findActiveGuppyObject').and.returnValue(
      undefined
    );
    expect(componentInstance.showOSK()).toBeFalse();
  });

  it('should set showOSK value to false upon hiding the OSK', () => {
    spyOn(deviceInfoService, 'isMobileUserAgent').and.returnValue(true);
    spyOn(deviceInfoService, 'hasTouchEvents').and.returnValue(true);
    spyOn(guppyInitializationService, 'findActiveGuppyObject').and.returnValue(
      new GuppyObject('divId', new MockGuppy())
    );
    expect(guppyInitializationService.getShowOSK()).toBeTrue();
    componentInstance.hideOSK();
    expect(guppyInitializationService.getShowOSK()).toBeFalse();
  });

  it('should activate the instance upon each key press function call', () => {
    spyOn(deviceInfoService, 'isMobileUserAgent').and.returnValue(true);
    spyOn(deviceInfoService, 'hasTouchEvents').and.returnValue(true);
    spyOn(guppyInitializationService, 'findActiveGuppyObject').and.returnValue(
      new GuppyObject('divId', new MockGuppy())
    );
    expect(componentInstance.showOSK()).toBeTrue();

    expect(guppy.isActive).toBeFalse();
    componentInstance.activateGuppy();
    expect(guppy.isActive).toBeTrue();

    guppy.isActive = false;

    expect(guppy.isActive).toBeFalse();
    componentInstance.changeTab('newTab');
    expect(guppy.isActive).toBeTrue();

    guppy.isActive = false;

    expect(guppy.isActive).toBeFalse();
    componentInstance.insertString('x');
    componentInstance.insertString('α');
    expect(guppy.isActive).toBeTrue();

    guppy.isActive = false;

    expect(guppy.isActive).toBeFalse();
    componentInstance.insertSymbol('x');
    expect(guppy.isActive).toBeTrue();

    guppy.isActive = false;

    expect(guppy.isActive).toBeFalse();
    componentInstance.backspace();
    expect(guppy.isActive).toBeTrue();

    guppy.isActive = false;

    expect(guppy.isActive).toBeFalse();
    componentInstance.left();
    expect(guppy.isActive).toBeTrue();

    guppy.isActive = false;

    expect(guppy.isActive).toBeFalse();
    componentInstance.right();
    expect(guppy.isActive).toBeTrue();

    guppy.isActive = false;

    expect(guppy.isActive).toBeFalse();
    componentInstance.exponent('2');
    expect(guppy.isActive).toBeTrue();
  });

  it('should get static image url', () => {
    let imagePath = '/path/to/image.png';
    expect(componentInstance.getStaticImageUrl(imagePath)).toBe(
      '/assets/images/path/to/image.png'
    );
  });
});
