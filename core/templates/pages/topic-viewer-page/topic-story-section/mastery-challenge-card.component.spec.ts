// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for MasteryChallengeCardComponent.
 */

import {fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';

import {MockTranslateModule} from 'tests/unit-test-utils';
import {MasteryChallengeCardComponent} from './mastery-challenge-card.component';
import {WindowRef} from 'services/contextual/window-ref.service';

const _setTimeout = setTimeout;
const _clearTimeout = clearTimeout;

class MockWindowRef {
  nativeWindow = {
    location: {
      assign: (url: string) => {},
    },
    setTimeout: jasmine
      .createSpy('setTimeout')
      .and.callFake((callback: () => void, timeout: number): number => {
        return _setTimeout(callback, timeout) as unknown as number;
      }),
    clearTimeout: jasmine
      .createSpy('clearTimeout')
      .and.callFake((timeoutId: number): void => {
        _clearTimeout(timeoutId);
      }),
  };
}

describe('MasteryChallengeCardComponent', () => {
  let component: MasteryChallengeCardComponent;
  let windowRef: WindowRef;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MasteryChallengeCardComponent],
      imports: [MockTranslateModule],
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(MasteryChallengeCardComponent);
    component = fixture.componentInstance;
    windowRef = TestBed.inject(WindowRef);
  }));

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate when action URL is provided', () => {
    spyOn(windowRef.nativeWindow.location, 'assign');
    component.actionUrl = '/practice/session/1';
    component.isUnlocked = true;

    component.onChallengeButtonClick();

    expect(windowRef.nativeWindow.location.assign).toHaveBeenCalledWith(
      '/practice/session/1'
    );
  });

  it('should not navigate when action URL is empty', () => {
    spyOn(windowRef.nativeWindow.location, 'assign');
    component.actionUrl = '';
    component.isUnlocked = true;

    component.onChallengeButtonClick();

    expect(windowRef.nativeWindow.location.assign).not.toHaveBeenCalled();
  });

  it('should not navigate when the default action URL placeholder is used', () => {
    spyOn(windowRef.nativeWindow.location, 'assign');
    component.actionUrl = '#';
    component.isUnlocked = true;

    component.onChallengeButtonClick();

    expect(windowRef.nativeWindow.location.assign).not.toHaveBeenCalled();
  });

  it('should report that the default placeholder is not an action URL', () => {
    expect(component.actionUrl).toBe('#');
    expect(component.hasActionUrl()).toBeFalsy();
    component.actionUrl = '';
    expect(component.hasActionUrl()).toBeFalsy();
    component.actionUrl = '/practice/session/1';
    expect(component.hasActionUrl()).toBeTruthy();
  });

  it('should report the action button as disabled for an unlocked placeholder URL', () => {
    component.isUnlocked = true;
    component.actionUrl = '#';

    expect(component.isActionDisabled()).toBeTruthy();

    component.actionUrl = '/practice/session/1';
    expect(component.isActionDisabled()).toBeFalsy();
  });

  it('should show helper tooltip for 5 seconds for a locked challenge', fakeAsync(() => {
    spyOn(windowRef.nativeWindow.location, 'assign');
    component.actionUrl = '/practice/session/1';
    component.isUnlocked = false;

    component.onChallengeButtonClick();

    expect(component.showLockedTooltip).toBeTruthy();
    expect(windowRef.nativeWindow.location.assign).not.toHaveBeenCalled();

    tick(4999);
    expect(component.showLockedTooltip).toBeTruthy();

    tick(1);
    expect(component.showLockedTooltip).toBeFalsy();
  }));

  it('should reset helper tooltip timer when clicked again while locked', fakeAsync(() => {
    component.isUnlocked = false;

    component.onChallengeButtonClick();
    tick(3000);

    component.onChallengeButtonClick();
    tick(3000);
    expect(component.showLockedTooltip).toBeTruthy();

    tick(2000);
    expect(component.showLockedTooltip).toBeFalsy();
  }));

  it('should keep tooltip visible after destroy clears the timer', fakeAsync(() => {
    component.isUnlocked = false;

    component.onChallengeButtonClick();
    expect(component.showLockedTooltip).toBeTruthy();

    component.ngOnDestroy();
    tick(5000);

    expect(component.showLockedTooltip).toBeTruthy();
  }));
});
