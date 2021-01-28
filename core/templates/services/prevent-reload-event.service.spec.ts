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
 * @fileoverview Unit tests for the PreventReloadEvent Service.
 */
import { TestBed } from '@angular/core/testing';
import { PreventReloadEvent } from 'services/prevent-reload-event.service.ts';
import { WindowRef } from 'services/contextual/window-ref.service';

describe ('prevent reload event service', function() {
  let preventReloadEvent: PreventReloadEvent = null;
  let windowRef: WindowRef = null;

  var reloadEvt = document.createEvent('Event');
  reloadEvt.initEvent('mockbeforeunload', true, true);
  reloadEvt.returnValue = null;
  reloadEvt.preventDefault = () => {};

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PreventReloadEvent]
    });
    preventReloadEvent = TestBed.get(PreventReloadEvent);
    windowRef = TestBed.get(WindowRef);
  });

  var mockWindow = {
    addEventListener: function(eventname: string, callback: (e) => {}) {
      document.addEventListener('mock' + eventname, function(e) {
        callback(e);
      });
    },
    location: {
      reload: () => {
        document.dispatchEvent(reloadEvt);
      }
    }
  };

  it('should add and remove listener', () => {
    preventReloadEvent.addListener();
    expect(preventReloadEvent.listenerActive).toBe(true);
    preventReloadEvent.removeListener();
    expect(preventReloadEvent.listenerActive).toBe(false);
  });

  it('should test if Alert is displayed', () => {
    spyOnProperty(windowRef, 'nativeWindow', 'get').and.returnValue(mockWindow);
    preventReloadEvent.addListener();
    spyOn(reloadEvt, 'preventDefault');
    mockWindow.location.reload();
    windowRef.nativeWindow.location.reload();
    expect(reloadEvt.preventDefault).toHaveBeenCalled();
    expect(preventReloadEvent.listenerActive).toBe(true);
  });

  it('should prevent multiple listeners', () => {
    preventReloadEvent.addListener();
    expect(preventReloadEvent.listenerActive).toBe(true);
    expect(preventReloadEvent.addListener()).toBeUndefined();
    expect(preventReloadEvent.listenerActive).toBe(true);
  });

  it('should remove listener on ngondestroy', () => {
    spyOn(preventReloadEvent, 'removeListener');
    preventReloadEvent.ngOnDestroy();
    expect(preventReloadEvent.removeListener).toHaveBeenCalled();
  });
});
