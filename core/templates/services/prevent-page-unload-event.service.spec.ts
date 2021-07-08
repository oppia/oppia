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
 * @fileoverview Unit tests for the preventPageUnloadEventService.
 */

import { TestBed } from '@angular/core/testing';
import { PreventPageUnloadEventService }
  from 'services/prevent-page-unload-event.service';
import { WindowRef } from 'services/contextual/window-ref.service';

describe ('Prevent page unload event service', function() {
  let preventPageUnloadEventService: PreventPageUnloadEventService = null;
  let windowRef: WindowRef = null;

  var reloadEvt = document.createEvent('Event');
  reloadEvt.initEvent('mockbeforeunload', true, true);
  reloadEvt.returnValue = null;
  reloadEvt.preventDefault = () => {};

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PreventPageUnloadEventService]
    });
    preventPageUnloadEventService = TestBed.get(PreventPageUnloadEventService);
    windowRef = TestBed.get(WindowRef);
  });


  // Mocking window object here because beforeunload requres the
  // full page to reload. Page reloads raise an error in karma.
  var mockWindow = {
    addEventListener: function(eventname: string, callback: () => {}) {
      document.addEventListener('mock' + eventname, callback);
    },
    location: {
      reload: (val = true) => {
        if (val) {
          document.dispatchEvent(reloadEvt);
        }
      }
    }
  };

  it('should adding listener', () => {
    expect(preventPageUnloadEventService.isListenerActive()).toBe(false);

    preventPageUnloadEventService.addListener();

    expect(preventPageUnloadEventService.isListenerActive()).toBe(true);
  });

  it('should removing listener', () => {
    spyOn(preventPageUnloadEventService, 'removeListener').and.callThrough();
    preventPageUnloadEventService.addListener();
    expect(preventPageUnloadEventService.isListenerActive()).toBe(true);

    preventPageUnloadEventService.removeListener();

    expect(preventPageUnloadEventService.removeListener).toHaveBeenCalled();
    expect(preventPageUnloadEventService.isListenerActive()).toBe(false);
  });

  it('should test if Alert is displayed', () => {
    spyOnProperty(windowRef, 'nativeWindow', 'get').and.returnValue(mockWindow);
    preventPageUnloadEventService.addListener();
    spyOn(reloadEvt, 'preventDefault');

    windowRef.nativeWindow.location.reload();

    expect(reloadEvt.preventDefault).toHaveBeenCalled();
    expect(preventPageUnloadEventService.isListenerActive()).toBe(true);
  });

  it('should prevent multiple listeners', () => {
    spyOn(windowRef.nativeWindow, 'addEventListener');

    expect(windowRef.nativeWindow.addEventListener).toHaveBeenCalledTimes(0);
    preventPageUnloadEventService.addListener();
    expect(windowRef.nativeWindow.addEventListener).toHaveBeenCalledTimes(1);
    expect(preventPageUnloadEventService.isListenerActive()).toBe(true);

    preventPageUnloadEventService.addListener();

    expect(windowRef.nativeWindow.addEventListener).toHaveBeenCalledTimes(1);
  });

  it('should remove listener on ngondestroy', () => {
    spyOn(preventPageUnloadEventService, 'removeListener');
    preventPageUnloadEventService.ngOnDestroy();

    expect(preventPageUnloadEventService.removeListener).toHaveBeenCalled();
  });

  it('should test if Alert is displayed when a condition is passed', () => {
    spyOnProperty(windowRef, 'nativeWindow', 'get').and.returnValue(mockWindow);
    preventPageUnloadEventService.addListener(() => {
      return true;
    });
    spyOn(reloadEvt, 'preventDefault');

    windowRef.nativeWindow.location.reload();

    expect(reloadEvt.preventDefault).toHaveBeenCalled();
    expect(preventPageUnloadEventService.isListenerActive()).toBe(true);
  });

  it('should test if Alert is not displayed when a condition is passed', () => {
    spyOnProperty(windowRef, 'nativeWindow', 'get').and.returnValue(mockWindow);
    var validationCallback = () => {
      return false;
    };
    preventPageUnloadEventService.addListener(validationCallback);
    spyOn(reloadEvt, 'preventDefault');

    windowRef.nativeWindow.location.reload(validationCallback());

    expect(reloadEvt.preventDefault).not.toHaveBeenCalled();
    expect(preventPageUnloadEventService.isListenerActive()).toBe(true);
  });
});
