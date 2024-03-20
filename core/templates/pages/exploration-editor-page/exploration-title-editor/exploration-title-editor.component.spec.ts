// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for explorationTitleEditor component.
 */

import {NO_ERRORS_SCHEMA, EventEmitter} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ExplorationTitleEditorComponent} from './exploration-title-editor.component';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {RouterService} from '../services/router.service';
import {ExplorationTitleService} from '../services/exploration-title.service';

describe('Exploration Title Editor Component', () => {
  let component: ExplorationTitleEditorComponent;
  let fixture: ComponentFixture<ExplorationTitleEditorComponent>;
  let focusManagerService: FocusManagerService;
  let mockEventEmitter = new EventEmitter();
  let explorationTitleService: ExplorationTitleService;

  class MockRouterService {
    onRefreshSettingsTab = mockEventEmitter;
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule],
      declarations: [ExplorationTitleEditorComponent],
      providers: [
        {
          provide: RouterService,
          useClass: MockRouterService,
        },
        ExplorationTitleService,
        FocusManagerService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExplorationTitleEditorComponent);
    component = fixture.componentInstance;

    focusManagerService = TestBed.inject(FocusManagerService);

    explorationTitleService = TestBed.inject(ExplorationTitleService);
    explorationTitleService.displayed = '';

    component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it(
    'should set focus on settings tab when refreshSettingsTab flag is ' +
      'emit',
    fakeAsync(() => {
      spyOn(focusManagerService, 'setFocus').and.stub();

      component.focusLabel = 'xyzz';

      mockEventEmitter.emit();
      component.inputFieldBlur();
      tick();

      flush();

      expect(focusManagerService.setFocus).toHaveBeenCalledWith('xyzz');
    })
  );

  it('should unsubscribe when component is destroyed', () => {
    const unsubscribeSpy = spyOn(
      component.directiveSubscriptions,
      'unsubscribe'
    );

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
