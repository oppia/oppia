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
 * @fileoverview Unit tests for unicode string editor.
 */

import {EventEmitter, SimpleChanges} from '@angular/core';
import {ExternalSaveService} from 'services/external-save.service';
import {FormsModule} from '@angular/forms';
import {NormalizedStringEditorComponent} from './normalized-string-editor.component';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';

describe('NormalizedStringEditorComponent', () => {
  let component: NormalizedStringEditorComponent;
  let fixture: ComponentFixture<NormalizedStringEditorComponent>;
  let externalSaveService: ExternalSaveService;

  var externalSaveEventEmitter = new EventEmitter();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [NormalizedStringEditorComponent],
    }).compileComponents();
  }));

  beforeEach(angular.mock.module('oppia'));
  beforeEach(() => {
    fixture = TestBed.createComponent(NormalizedStringEditorComponent);
    component = fixture.componentInstance;
    externalSaveService = TestBed.get(ExternalSaveService);
    spyOnProperty(externalSaveService, 'onExternalSave').and.returnValue(
      externalSaveEventEmitter
    );
    component.alwaysEditable = false;
    component.value = 'random value';
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialize component when interaction rule is selected', () => {
    spyOn(component, 'closeEditor').and.callThrough();
    spyOn(component.componentSubscriptions, 'add');
    component.active = true;
    component.alwaysEditable = false;

    // Pre-check.
    expect(component.active).toBe(true);

    component.ngOnInit();

    expect(component.componentSubscriptions.add).toHaveBeenCalled();
    expect(externalSaveService.onExternalSave).toEqual(
      externalSaveEventEmitter
    );
    // Subscription.add is called only if the text input is not always editable.
    // Therefore, we verify that the value of alwaysEditable is false before
    // checking subscription.add.
    expect(component.alwaysEditable).toBe(false);
    expect(component.closeEditor).toHaveBeenCalled();
    expect(component.active).toBe(false);
  });

  it('should not add subscription when alwaysEditable is true', () => {
    spyOn(component, 'closeEditor').and.callThrough();
    spyOn(component.componentSubscriptions, 'add');
    component.alwaysEditable = true;
    component.active = true;

    // Pre-check.
    expect(component.active).toBe(true);
    expect(component.alwaysEditable).toBe(true);

    component.ngOnInit();

    // We cannot test what componentSubscriptions.add has been called with since
    // externalSaveService is a private variable and inside it is an anonymous
    // function.
    expect(component.componentSubscriptions.add).not.toHaveBeenCalled();
    expect(component.alwaysEditable).toBe(true);
    expect(component.closeEditor).not.toHaveBeenCalled();
    expect(component.active).toBe(true);
  });

  it(
    'should update value after broadcasting ' +
      'externalSave event when closing modal',
    () => {
      component.active = true;
      component.ngOnInit();
      spyOn(component, 'closeEditor').and.callThrough();
      // After execution of component.ngOnInit();, component.active is set to
      // false. To test the subscribed observable, it needs to be set to true
      // to call the closeEditor function.
      component.active = true;

      // Pre-check.
      expect(component.active).toBe(true);

      externalSaveEventEmitter.emit();

      expect(component.closeEditor).toHaveBeenCalled();
      expect(component.active).toBe(false);
    }
  );

  it(
    'should replace old value when new value is entered in' + 'the text box',
    () => {
      expect(component.value).toBe('random value');

      component.updateLocalValue('new random value');

      expect(component.value).toBe('new random value');
    }
  );

  it('should become active when editor is opened', () => {
    component.active = false;

    expect(component.active).toBe(false);

    component.openEditor();

    expect(component.active).toBe(true);
  });

  it('should become inactive when editor is closed', () => {
    component.active = true;

    expect(component.active).toBe(true);

    component.closeEditor();

    expect(component.active).toBe(false);
  });

  it(
    'should replace old value when new value is entered' +
      ' in the input field',
    () => {
      component.active = true;

      // Pre-Check.
      expect(component.value).toBe('random value');
      expect(component.active).toBe(true);

      component.replaceValue('new random value');

      expect(component.value).toBe('new random value');
      expect(component.active).toBe(false);
    }
  );

  it('should make largeInput true when large input is entered', () => {
    const changes: SimpleChanges = {
      initArgs: {
        previousValue: {
          largeInput: false,
        },
        currentValue: {
          largeInput: true,
        },
        firstChange: false,
        isFirstChange: () => false,
      },
    };
    component.largeInput = false;

    // Pre-check.
    expect(component.largeInput).toBe(false);

    component.ngOnChanges(changes);

    expect(component.largeInput).toBe(true);
  });

  it('should not make largeInput true when large input is not entered', () => {
    const changes: SimpleChanges = {
      initArgs: {
        previousValue: {
          largeInput: true,
        },
        currentValue: {
          largeInput: true,
        },
        firstChange: false,
        isFirstChange: () => false,
      },
    };
    component.largeInput = false;

    // Pre-check.
    expect(component.largeInput).toBe(false);

    component.ngOnChanges(changes);

    expect(component.largeInput).toBe(false);
  });

  it('should unsubscribe when component is destroyed', () => {
    spyOn(component.componentSubscriptions, 'unsubscribe').and.callThrough();

    expect(component.componentSubscriptions.closed).toBe(false);

    component.ngOnDestroy();

    expect(component.componentSubscriptions.unsubscribe).toHaveBeenCalled();
    expect(component.componentSubscriptions.closed).toBe(true);
  });
});
