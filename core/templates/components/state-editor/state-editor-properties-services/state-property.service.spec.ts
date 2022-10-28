// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the services and controllers of the exploration
 *   editor page.
 */

import { TestBed } from '@angular/core/testing';
import { AlertsService } from 'services/alerts.service';
import { UtilsService } from 'services/utils.service';
import { StatePropertyService } from './state-property.service';

class MockStatePropertyService extends
  StatePropertyService<string> {
  restoreFromMomento() {
    return;
  }
}

describe('State Property Service', () => {
  let sps: MockStatePropertyService;
  let alertsService: AlertsService;
  let utilsService: UtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockStatePropertyService]
    });

    sps = TestBed.inject(MockStatePropertyService);
    alertsService = TestBed.inject(AlertsService);
    utilsService = TestBed.inject(UtilsService);
  });

  it('should initialize class properties', () =>{
    sps.setterMethodKey = 'Some setter method key';
    spyOn(sps.statePropertyInitializedEmitter, 'emit');
    sps.init('stateName', 'stateProperty');
    expect(sps.stateName).toEqual('stateName');
    expect(sps.displayed).toEqual('stateProperty');
    expect(sps.savedMemento).toEqual('stateProperty');
    expect(sps.statePropertyInitializedEmitter.emit).toHaveBeenCalled();
  });

  it('should throw error at init method if setter key is null', () => {
    sps.setterMethodKey = null;
    expect(() => {
      sps.init('stateName', 'stateProperty');
    }).toThrowError('State property setter method key cannot be null.');
  });

  it('should not save displayed value if not valid', () => {
    spyOn(sps, 'hasChanged').and.returnValue(false);
    spyOn(sps, 'restoreFromMomento').and.callFake(() => {});
    sps.setterMethodKey = 'Some setter method key';
    sps.init('stateName', 'stateProperty');
    sps.saveDisplayedValue();
    expect(sps.savedMemento).toEqual('stateProperty');
    expect(sps.displayed).toEqual('stateProperty');
  });

  it('should not save displayed value if not equivalent', () => {
    spyOn(sps, 'hasChanged').and.returnValue(true);
    spyOn(sps, 'restoreFromMomento').and.callFake(() => {});
    sps.setterMethodKey = 'Some setter method key';
    sps.init('stateName', 'stateProperty');
    sps.saveDisplayedValue();
    expect(sps.savedMemento).toEqual('stateProperty');
    expect(sps.displayed).toEqual('stateProperty');
  });

  it('should save displayed value', () => {
    spyOn(sps, 'hasChanged').and.returnValue(true);
    spyOn(utilsService, 'isEquivalent').and.returnValue(false);
    spyOn(alertsService, 'clearWarnings').and.callThrough();
    spyOn(sps, 'restoreFromMomento').and.callFake(() => {});
    sps.setterMethodKey = 'Some setter method key';
    sps.init('stateName', 'stateProperty');
    sps.saveDisplayedValue();
    expect(sps.savedMemento).toEqual('stateProperty');
    expect(sps.displayed).toEqual('stateProperty');
  });

  it('should throw error at saveDisplayedValue if setter key is null', () => {
    spyOn(utilsService, 'isEquivalent').and.returnValue(true);
    sps.setterMethodKey = null;
    expect(() => {
      sps.saveDisplayedValue();
    }).toThrowError('State property setter method key cannot be null.');
  });

  it('should revert the displayed value to saved momento', () => {
    sps.savedMemento = 'saved momento';
    sps.restoreFromMemento();
    expect(sps.displayed).toEqual('saved momento');
  });

  it('should return whether current value has changed from momento', () => {
    sps.displayed = 'stateProperty';
    sps.savedMemento = 'changedStateProperty';
    let result = sps.hasChanged();
    expect(result).toBeTrue();
  });
});
