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
 * @fileoverview Unit tests for paramChangesEditor.
 */

import { CdkDragSortEvent } from '@angular/cdk/drag-drop';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { StateParamChangesService } from 'components/state-editor/state-editor-properties-services/state-param-changes.service';
import { ParamChange, ParamChangeObjectFactory } from 'domain/exploration/ParamChangeObjectFactory';
import { ParamSpecs, ParamSpecsObjectFactory } from 'domain/exploration/ParamSpecsObjectFactory';
import { AlertsService } from 'services/alerts.service';
import { EditabilityService } from 'services/editability.service';
import { ExternalSaveService } from 'services/external-save.service';
import { ExplorationDataService } from '../services/exploration-data.service';
import { ExplorationParamSpecsService } from '../services/exploration-param-specs.service';
import { ExplorationStatesService } from '../services/exploration-states.service';
import { ParamChangesEditorComponent } from './param-changes-editor.component';

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve()
    };
  }
}

describe('Param Changes Editor Component', () => {
  let component: ParamChangesEditorComponent;
  let fixture: ComponentFixture<ParamChangesEditorComponent>;
  let alertsService: AlertsService;
  let editabilityService: EditabilityService;
  let explorationParamSpecsService: ExplorationParamSpecsService;
  let explorationStatesService: ExplorationStatesService;
  let paramChangeObjectFactory: ParamChangeObjectFactory;
  let paramSpecsObjectFactory: ParamSpecsObjectFactory;
  let stateParamChangesService: StateParamChangesService;
  let postSaveHookSpy = jasmine.createSpy('postSaveHook', () => {});
  let mockExternalSaveEventEmitter = new EventEmitter();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        ParamChangesEditorComponent
      ],
      providers: [
        {
          provide: ExplorationDataService,
          useValue: {
            explorationId: 0,
            autosaveChangeListAsync() {
              return;
            }
          }
        },
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        {
          provide: ExternalSaveService,
          useValue: {
            onExternalSave: mockExternalSaveEventEmitter
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));


  beforeEach(() => {
    fixture = TestBed.createComponent(ParamChangesEditorComponent);
    component = fixture.componentInstance;

    alertsService = TestBed.inject(AlertsService);
    paramChangeObjectFactory = TestBed.inject(ParamChangeObjectFactory);
    paramSpecsObjectFactory = TestBed.inject(ParamSpecsObjectFactory);
    stateParamChangesService = TestBed.inject(StateParamChangesService);
    editabilityService = TestBed.inject(EditabilityService);
    explorationParamSpecsService = TestBed.inject(
      ExplorationParamSpecsService);
    explorationStatesService = TestBed.inject(ExplorationStatesService);
    explorationParamSpecsService.init(
      paramSpecsObjectFactory.createFromBackendDict({
        y: {
          obj_type: 'UnicodeString'
        },
        a: {
          obj_type: 'UnicodeString'
        }
      }) as ParamSpecs);

    stateParamChangesService.init('', []);

    component.paramChangesServiceName = 'explorationParamChangesService';
    component.postSaveHook = postSaveHookSpy;
    component.currentlyInSettingsTab = false;

    fixture.detectChanges();
    component.ngOnInit();

    component.paramChangesService.displayed = [];
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialize component properties after controller is initialized',
    () => {
      expect(component.isParamChangesEditorOpen).toBe(false);
      expect(component.warningText).toBe('');
      expect(component.paramNameChoices).toEqual([]);
    });

  it('should reset customization args from param change when changing' +
    ' generator type', () => {
    let paramChange = paramChangeObjectFactory.createFromBackendDict({
      customization_args: {
        list_of_values: ['first value', 'second value']
      },
      generator_id: 'RandomSelector',
      name: 'a'
    });

    component.onChangeGeneratorType(paramChange);

    expect(paramChange.customizationArgs).toEqual({
      list_of_values: ['sample value']
    });
  });

  it('should get complete image path corresponding to a given relative path',
    () => {
      expect(component.getStaticImageUrl('/path/to/image.png')).toBe(
        '/assets/images/path/to/image.png');
    });

  it('should save param changes when externalSave is broadcasted',
    fakeAsync(() => {
      component.paramChangesService.displayed = [];
      spyOn(component, 'generateParamNameChoices').and.stub();
      spyOn(component.paramChangesService, 'saveDisplayedValue').and.stub();
      spyOn(explorationParamSpecsService, 'saveDisplayedValue').and.stub();
      spyOn(editabilityService, 'isEditable').and.returnValue(true);
      let saveParamChangesSpy = spyOn(
        explorationStatesService, 'saveStateParamChanges')
        .and.callFake(() => {});
      component.addParamChange();
      component.openParamChangesEditor();

      mockExternalSaveEventEmitter.emit();
      tick();

      expect(saveParamChangesSpy).toHaveBeenCalled();
      expect(postSaveHookSpy).toHaveBeenCalled();
    }));

  it('should add a new param change when there are no param changes displayed',
    () => {
      expect((
        component.paramChangesService.displayed as ParamChange[]
      ).length).toBe(0);
      component.addParamChange();

      expect(component.paramNameChoices).toEqual([{
        id: 'a',
        text: 'a'
      }, {
        id: 'x',
        text: 'x'
      }, {
        id: 'y',
        text: 'y'
      }]);
      expect((
        component.paramChangesService.displayed as ParamChange[]
      ).length).toBe(1);
    });

  it('should not open param changes editor when it is not editable',
    () => {
      spyOn(editabilityService, 'isEditable').and.returnValue(false);

      expect((
        component.paramChangesService.displayed as ParamChange[]
      ).length).toBe(0);
      component.openParamChangesEditor();

      expect(component.isParamChangesEditorOpen).toBe(false);
      expect((
        component.paramChangesService.displayed as ParamChange[]
      ).length).toBe(0);
    });

  it('should open param changes editor and cancel edit', fakeAsync(() => {
    component.paramChangesService.displayed = [];
    spyOn(component, 'generateParamNameChoices').and.returnValue([]);
    spyOn(component.paramChangesService, 'restoreFromMemento').and.stub();
    spyOn(component.paramChangesService, 'saveDisplayedValue').and.stub();
    spyOn(explorationParamSpecsService, 'saveDisplayedValue').and.stub();
    spyOn(editabilityService, 'isEditable').and.returnValue(true);

    component.openParamChangesEditor();
    tick();

    expect(component.isParamChangesEditorOpen).toBe(true);
    expect((
      component.paramChangesService.displayed as ParamChange[]).length).toBe(1);

    component.cancelEdit();
    tick();

    expect(component.isParamChangesEditorOpen).toBe(false);
    expect((
      component.paramChangesService.displayed as ParamChange[]).length).toBe(1);
  }));

  it('should open param changes editor and add a param change', () => {
    spyOn(editabilityService, 'isEditable').and.returnValue(true);

    component.openParamChangesEditor();

    expect(component.isParamChangesEditorOpen).toBe(true);
    expect(component.paramNameChoices).toEqual([{
      id: 'a',
      text: 'a'
    }, {
      id: 'y',
      text: 'y'
    }]);
    expect((
      component.paramChangesService.displayed as ParamChange[]).length).toBe(1);
  });

  it('should check whenever param changes are valid', () => {
    component.addParamChange();

    expect(component.areDisplayedParamChangesValid()).toBe(true);
    expect(component.warningText).toBe('');
  });

  it('should check param changes as invalid when it has an empty parameter' +
    ' name', () => {
    component.paramChangesService.displayed = [
      paramChangeObjectFactory.createDefault('')];

    expect(component.areDisplayedParamChangesValid()).toBe(false);
    expect(component.warningText).toBe(
      'Please pick a non-empty parameter name.');
  });

  it('should check param changes as invalid when it has a reserved parameter' +
    ' name', () => {
    component.paramChangesService.displayed = [
      paramChangeObjectFactory.createDefault('answer')];

    expect(component.areDisplayedParamChangesValid()).toBe(false);
    expect(component.warningText).toBe(
      'The parameter name \'answer\' is reserved.');
  });

  it('should check param changes as invalid when it has non alphabetic' +
    ' characters in parameter name', () => {
    component.paramChangesService.displayed = [
      paramChangeObjectFactory.createDefault('123')];

    expect(component.areDisplayedParamChangesValid()).toBe(false);
    expect(component.warningText).toBe(
      'Parameter names should use only alphabetic characters.');
  });

  it('should check param changes as invalid when it has no default' +
    ' generator id', () => {
    component.paramChangesService.displayed = [
      paramChangeObjectFactory.createFromBackendDict({
        customization_args: {},
        generator_id: '',
        name: 'a'
      })];

    component.areDisplayedParamChangesValid();
    expect(component.areDisplayedParamChangesValid()).toBe(false);
    expect(component.warningText).toBe(
      'Each parameter should have a generator id.');
  });

  it('should check param changes as invalid when it has no values and its' +
    ' generator id is RandomSelector', () => {
    component.paramChangesService.displayed = [
      paramChangeObjectFactory.createFromBackendDict({
        customization_args: {
          list_of_values: []
        },
        generator_id: 'RandomSelector',
        name: 'a'
      })];

    component.areDisplayedParamChangesValid();
    expect(component.areDisplayedParamChangesValid()).toBe(false);
    expect(component.warningText).toBe(
      'Each parameter should have at least one possible value.');
  });

  it('should not save param changes when it is invalid', fakeAsync(() => {
    spyOn(alertsService, 'addWarning');
    component.paramChangesService.displayed = [
      paramChangeObjectFactory.createDefault('123')];

    component.postSaveHook = () => {
      let value = 'value';
      return value;
    };

    component.currentlyInSettingsTab = false;
    component.saveParamChanges();
    tick();

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Invalid parameter changes.');
  }));

  it('should save param changes when it is valid', fakeAsync(() => {
    spyOn(component, 'generateParamNameChoices').and.stub();
    spyOn(component.paramChangesService, 'saveDisplayedValue').and.stub();
    spyOn(explorationParamSpecsService, 'saveDisplayedValue').and.stub();

    let saveParamChangesSpy = spyOn(
      explorationStatesService, 'saveStateParamChanges').and.callFake(() => {});

    component.currentlyInSettingsTab = false;
    component.addParamChange();
    component.saveParamChanges();
    tick();

    expect(saveParamChangesSpy).toHaveBeenCalled();
    expect(postSaveHookSpy).toHaveBeenCalled();
  }));

  it('should not delete a param change when index is less than 0', () => {
    component.addParamChange();
    expect((
      component.paramChangesService.displayed as ParamChange[]).length).toBe(1);

    spyOn(alertsService, 'addWarning');
    component.deleteParamChange(-1);
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Cannot delete parameter change at position -1: index out of range');
  });

  it('should not delete a param change when index is greather than param' +
    ' changes length', () => {
    component.addParamChange();
    expect((
      component.paramChangesService.displayed as ParamChange[]).length).toBe(1);

    spyOn(alertsService, 'addWarning');
    component.deleteParamChange(5);
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Cannot delete parameter change at position 5: index out of range');
  });

  it('should delete a param change', () => {
    component.addParamChange();
    expect((
      component.paramChangesService.displayed as ParamChange[]
    ).length).toBe(1);

    component.deleteParamChange(0);
    expect((
      component.paramChangesService.displayed as ParamChange[]
    ).length).toBe(0);
  });

  it('should change customization args values to be human readable',
    () => {
      expect(component.HUMAN_READABLE_ARGS_RENDERERS.Copier({
        value: 'Copier value'
      })).toBe('to Copier value');

      expect(component.HUMAN_READABLE_ARGS_RENDERERS.RandomSelector({
        list_of_values: ['first value', 'second value']
      })).toBe('to one of [first value, second value] at random');
    });

  it('should change list order properly', () => {
    jasmine.createSpy('moveItemInArray').and.stub();

    component.paramChangesService.displayed = [
      new ParamChangeObjectFactory(),
      new ParamChangeObjectFactory()
    ];

    component.drop({
      previousIndex: 1,
      currentIndex: 2
    } as CdkDragSortEvent<ParamChange[]>);
  });
});
