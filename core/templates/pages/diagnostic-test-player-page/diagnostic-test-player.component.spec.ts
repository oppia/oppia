// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for the diagnostic test player component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DiagnosticTestPlayerComponent } from './diagnostic-test-player.component';
import { WindowRef } from 'services/contextual/window-ref.service';
import { PreventPageUnloadEventService } from 'services/prevent-page-unload-event.service';


class MockWindowRef {
  _window = {
    location: {
      href: '',
      reload: (val: boolean) => val
    },
  };

  get nativeWindow() {
    return this._window;
  }
}

describe('Diagnostic test player component', () => {
  let component: DiagnosticTestPlayerComponent;
  let fixture: ComponentFixture<DiagnosticTestPlayerComponent>;
  let windowRef: MockWindowRef;
  let preventPageUnloadEventService: PreventPageUnloadEventService;

  beforeEach(() => {
    windowRef = new MockWindowRef();

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      declarations: [
        DiagnosticTestPlayerComponent,
      ],
      providers: [
        PreventPageUnloadEventService,
        { provide: WindowRef, useValue: windowRef },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DiagnosticTestPlayerComponent);
    component = fixture.componentInstance;
    preventPageUnloadEventService = TestBed.inject(
      PreventPageUnloadEventService);
  });

  it('should listen to page unload events after initialization', () => {
    spyOn(preventPageUnloadEventService, 'addListener').and.stub();

    component.ngOnInit();

    expect(preventPageUnloadEventService.addListener).toHaveBeenCalled();
  });

  it(
    'should be able to get Oppia\'s avatar image URL after initialization',
    () => {
      spyOn(preventPageUnloadEventService, 'addListener');

      expect(component.OPPIA_AVATAR_IMAGE_URL).toEqual('');

      const avatarImageLocation = (
        '/assets/images/avatar/oppia_avatar_100px.svg');

      component.ngOnInit();

      expect(component.OPPIA_AVATAR_IMAGE_URL).toEqual(avatarImageLocation);
    });
});
