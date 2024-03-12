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
 * @fileoverview Unit tests for stateTranslationStatusGraph.
 */

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {Subscription} from 'rxjs';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {StateTranslationStatusGraphComponent} from './state-translation-status-graph.component';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ExplorationStatesService} from 'pages/exploration-editor-page/services/exploration-states.service';
import {TranslationStatusService} from '../services/translation-status.service';
import {State} from 'domain/state/StateObjectFactory';

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve(),
    };
  }
}

describe('State Translation Status Graph Component', () => {
  let component: StateTranslationStatusGraphComponent;
  let fixture: ComponentFixture<StateTranslationStatusGraphComponent>;
  let explorationStatesService: ExplorationStatesService;
  let stateEditorService: StateEditorService;
  let translationStatusService: TranslationStatusService;
  let testSubscriptions: Subscription;
  const refreshStateTranslationSpy = jasmine.createSpy(
    'refreshStateTranslationSpy'
  );

  let stateName: string = 'State1';
  let state = {
    recordedVoiceovers: {},
  } as State;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [StateTranslationStatusGraphComponent],
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateTranslationStatusGraphComponent);
    component = fixture.componentInstance;

    stateEditorService = TestBed.inject(StateEditorService);
    explorationStatesService = TestBed.inject(ExplorationStatesService);
    translationStatusService = TestBed.inject(TranslationStatusService);

    testSubscriptions = new Subscription();
    testSubscriptions.add(
      stateEditorService.onRefreshStateTranslation.subscribe(
        refreshStateTranslationSpy
      )
    );

    fixture.detectChanges();
  });

  afterEach(() => {
    testSubscriptions.unsubscribe();
  });

  describe('when translation tab is not busy', () => {
    beforeEach(() => {
      spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
        stateName
      );
      spyOn(explorationStatesService, 'getState').and.returnValue(state);
      component.isTranslationTabBusy = false;
    });

    it('should get node colors from translation status', () => {
      let nodeColors = {};
      spyOn(
        translationStatusService,
        'getAllStateStatusColors'
      ).and.returnValue(nodeColors);

      expect(component.nodeColors()).toEqual(nodeColors);
      expect(
        translationStatusService.getAllStateStatusColors
      ).toHaveBeenCalled();
    });

    it('should get active state name from state editor', () => {
      expect(component.getActiveStateName()).toBe(stateName);
    });

    it(
      'should set new active state name and refresh state when clicking' +
        ' on state in map',
      () => {
        spyOn(stateEditorService, 'setActiveStateName');
        component.onClickStateInMap('State2');

        expect(stateEditorService.setActiveStateName).toHaveBeenCalledWith(
          'State2'
        );
        expect(refreshStateTranslationSpy).toHaveBeenCalled();
      }
    );
  });

  describe('when translation tab is busy', () => {
    let showTranslationTabBusyModalspy: jasmine.Spy;
    let testSubscriptions: Subscription;

    beforeEach(() => {
      component.isTranslationTabBusy = true;

      showTranslationTabBusyModalspy = jasmine.createSpy(
        'showTranslationTabBusyModal'
      );
      testSubscriptions = new Subscription();
      testSubscriptions.add(
        stateEditorService.onShowTranslationTabBusyModal.subscribe(
          showTranslationTabBusyModalspy
        )
      );
    });

    afterEach(() => {
      testSubscriptions.unsubscribe();
    });

    it('should show translation tab busy modal when clicking on state in map', () => {
      spyOn(stateEditorService, 'setActiveStateName');
      component.onClickStateInMap('State2');

      expect(stateEditorService.setActiveStateName).not.toHaveBeenCalled();
      expect(showTranslationTabBusyModalspy).toHaveBeenCalled();
    });

    it('should throw error if state name is null', fakeAsync(() => {
      spyOn(stateEditorService, 'getActiveStateName').and.returnValue(null);
      component.isTranslationTabBusy = false;
      expect(() => {
        // This throws "Argument of type 'null' is not assignable to parameter
        // of type 'String'." We need to suppress this error
        // because of the need to test validations. This error is thrown
        // because the function is called with null value.
        // @ts-ignore
        component.onClickStateInMap(null);
        tick();
      }).toThrowError('Active state name cannot be null.');
    }));
  });
});
