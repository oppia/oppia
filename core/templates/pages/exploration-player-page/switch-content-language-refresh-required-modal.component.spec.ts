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
 * @fileoverview Unit tests for
 * SwitchContentLanguageRefreshRequiredModalComponent.
 */

import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import {
  SwitchContentLanguageRefreshRequiredModalComponent,
  // eslint-disable-next-line max-len
} from 'pages/exploration-player-page/switch-content-language-refresh-required-modal.component';
import {WindowRef} from 'services/contextual/window-ref.service';

class MockActiveModal {
  dismiss(): void {
    return;
  }
}

// Mocking window object here because changing location.href causes the
// full page to reload. Page reloads raise an error in karma.
class MockWindowRef {
  _window = {
    location: {
      href: 'host.name:1234/explore/0',
    },
  };

  get nativeWindow() {
    return this._window;
  }
}

describe('SwitchContentLanguageRefreshRequiredModalComponent', function () {
  let component: SwitchContentLanguageRefreshRequiredModalComponent;
  let fixture: ComponentFixture<SwitchContentLanguageRefreshRequiredModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let windowRef: MockWindowRef;

  beforeEach(async(() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      declarations: [SwitchContentLanguageRefreshRequiredModalComponent],
      providers: [
        {provide: NgbActiveModal, useClass: MockActiveModal},
        {provide: WindowRef, useValue: windowRef},
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      SwitchContentLanguageRefreshRequiredModalComponent
    );
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.get(NgbActiveModal);
    windowRef = TestBed.get(WindowRef);
  });

  it('should dismiss modal', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    component.cancel();
    expect(dismissSpy).toHaveBeenCalled();
  });

  it('should set the href with the correct URL parameters on confirm', () => {
    expect(windowRef.nativeWindow.location.href).toBe(
      'host.name:1234/explore/0'
    );

    component.languageCode = 'fr';
    component.confirm();
    expect(windowRef.nativeWindow.location.href).toBe(
      'host.name:1234/explore/0?initialContentLanguageCode=fr'
    );

    component.languageCode = 'en';
    component.confirm();
    expect(windowRef.nativeWindow.location.href).toBe(
      'host.name:1234/explore/0?initialContentLanguageCode=en'
    );
  });
});
