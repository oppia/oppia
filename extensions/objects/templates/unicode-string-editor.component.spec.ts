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

import { FormsModule } from '@angular/forms';
import { EventEmitter, SimpleChanges } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { UnicodeStringEditorComponent } from './unicode-string-editor.component';
import { importAllAngularServices } from 'tests/unit-test-utils';
import { ExternalSaveService } from 'services/external-save.service';

describe('UnicodeStringEditorComponent', () => {
  let component: UnicodeStringEditorComponent;
  let fixture: ComponentFixture<UnicodeStringEditorComponent>;
  let externalSaveService: ExternalSaveService;

  var externalSaveEventEmitter = new EventEmitter();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [UnicodeStringEditorComponent]
    }).compileComponents();
  }));

  importAllAngularServices();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(() => {
    fixture = TestBed.createComponent(UnicodeStringEditorComponent);
    component = fixture.componentInstance;
    externalSaveService = TestBed.get(ExternalSaveService);
    spyOnProperty(externalSaveService, 'onExternalSave').and.returnValue(
      externalSaveEventEmitter);
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

    expect(component.active).toBe(true);

    component.ngOnInit();

    // We cannot test what componentSubscriptions.add has been called with since
    // externalSaveService is a private variable and inside it is an anonymous
    // fucntion.
    expect(component.componentSubscriptions.add).toHaveBeenCalled();
    expect(component.componentSubscriptions.closed).toBe(false);
    expect(component.alwaysEditable).toBe(false);
    expect(component.closeEditor).toHaveBeenCalled();
    expect(component.active).toBe(false);
  });

  it('should replace value when External Save is emitted', () => {
    component.active = true;
    component.ngOnInit();
    spyOn(component, 'closeEditor').and.callThrough();
    spyOn(component, 'replaceValue').and.callThrough();
    component.active = true;

    expect(component.active).toBe(true);

    externalSaveEventEmitter.emit();

    // The this.value cannot be tested for changes since it set before the
    // emit and will reamin the same after the emit.
    expect(component.replaceValue).toHaveBeenCalledWith('random value');
    expect(component.value).toBe('random value');
    expect(component.closeEditor).toHaveBeenCalled();
    expect(component.active).toBe(false);
  });

  it('should replace old value when new value is entered in' +
  'the text box', () => {
    expect(component.value).toBe('random value');

    component.updateLocalValue('new random value');

    expect(component.value).toBe('new random value');
  });

  it('should change active when editor is opened', () => {
    component.active = false;

    expect(component.active).toBe(false);

    component.openEditor();

    expect(component.active).toBe(true);
  });

  it('should change active when editor is closed', () => {
    component.active = true;

    expect(component.active).toBe(true);

    component.closeEditor();

    expect(component.active).toBe(false);
  });

  it('should replace old value when new value is entered' +
  'in the input field', () => {
    expect(component.value).toBe('random value');

    component.replaceValue('new random value');

    expect(component.value).toBe('new random value');
    expect(component.active).toBe(false);
  });

  it('should make largeInput true when large input is entered', () => {
    const changes: SimpleChanges = {
      initArgs: {
        previousValue: {
          largeInput: false
        },
        currentValue: {
          largeInput: true
        },
        firstChange: false,
        isFirstChange: () => false
      }
    };
    component.largeInput = false;

    component.ngOnChanges(changes);

    expect(component.largeInput).toBe(true);
  });

  it('should unsubscribe when component is destroyed', () => {
    spyOn(component.componentSubscriptions, 'unsubscribe').and.callThrough();

    expect(component.componentSubscriptions.closed).toBe(false);

    component.ngOnDestroy();

    expect(component.componentSubscriptions.unsubscribe).toHaveBeenCalled();
    expect(component.componentSubscriptions.closed).toBe(true);
  });
});
