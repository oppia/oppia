// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for MasteryChallengeCardComponent.
 */

import {TestBed, waitForAsync} from '@angular/core/testing';

import {MockTranslateModule} from 'tests/unit-test-utils';
import {MasteryChallengeCardComponent} from './mastery-challenge-card.component';
import {WindowRef} from 'services/contextual/window-ref.service';

class MockWindowRef {
  nativeWindow = {
    location: {
      assign: (url: string) => {},
    },
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

  it('should return the translated display title', () => {
    expect(component.displayTitle).toBe('Mastery Challenge');
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

  it('should not navigate when clicked while locked', () => {
    spyOn(windowRef.nativeWindow.location, 'assign');
    spyOn(component.masteryClicked, 'emit');
    component.actionUrl = '/practice/session/1';
    component.isUnlocked = false;

    component.onChallengeButtonClick();

    expect(windowRef.nativeWindow.location.assign).not.toHaveBeenCalled();
    expect(component.masteryClicked.emit).toHaveBeenCalled();
  });

  it('should emit masteryClicked when clicked while locked', () => {
    spyOn(component.masteryClicked, 'emit');
    component.actionUrl = '/practice/session/1';
    component.isUnlocked = false;

    component.onChallengeButtonClick();

    expect(component.masteryClicked.emit).toHaveBeenCalled();
  });

  it('should not emit masteryClicked when clicked while unlocked', () => {
    spyOn(component.masteryClicked, 'emit');
    component.actionUrl = '/practice/session/1';
    component.isUnlocked = true;

    component.onChallengeButtonClick();

    expect(component.masteryClicked.emit).not.toHaveBeenCalled();
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
});
