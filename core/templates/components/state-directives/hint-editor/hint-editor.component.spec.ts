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
 * @fileoverview Unit test for Hint Editor Component.
 */

import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HintEditorComponent } from './hint-editor.component';
import { ContextService } from 'services/context.service';
import { EditabilityService } from 'services/editability.service';
import { ExternalSaveService } from 'services/external-save.service';
import { HintBackendDict } from 'domain/exploration/HintObjectFactory';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';

describe('HintEditorComponent', () => {
  let component: HintEditorComponent;
  let fixture: ComponentFixture<HintEditorComponent>;
  let editabilityService: EditabilityService;
  let externalSaveService: ExternalSaveService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        HintEditorComponent
      ],
      providers: [
        ContextService,
        EditabilityService,
        ExternalSaveService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HintEditorComponent);
    component = fixture.componentInstance;

    editabilityService = TestBed.inject(EditabilityService);
    externalSaveService = TestBed.inject(ExternalSaveService);

    component.hint = {
      hintContent: SubtitledHtml.createDefault(
        'html text', 'contentID'),

      toBackendDict(): HintBackendDict {
        return {
          hint_content: this.hintContent.toBackendDict()
        };
      }
    };

    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should set component properties on initialization', () => {
    spyOn(editabilityService, 'isEditable').and.returnValue(true);

    component.ngOnInit();

    expect(component.isEditable).toBe(true);
    expect(component.hintEditorIsOpen).toBe(false);
  });

  it('should save hint when external save event is triggered', fakeAsync(() => {
    let onExternalSaveEmitter = new EventEmitter();
    spyOnProperty(externalSaveService, 'onExternalSave')
      .and.returnValue(onExternalSaveEmitter);
    spyOn(component.showMarkAllAudioAsNeedingUpdateModalIfRequired, 'emit')
      .and.callThrough();

    component.ngOnInit();

    component.hintEditorIsOpen = true;
    component.hint = {
      hintContent: SubtitledHtml.createDefault(
        'change', 'data'),

      toBackendDict(): HintBackendDict {
        return {
          hint_content: this.hintContent.toBackendDict()
        };
      }
    };
    component.hintMemento = {
      hintContent: SubtitledHtml.createDefault(
        'html text', 'contentID'),

      toBackendDict(): HintBackendDict {
        return {
          hint_content: this.hintContent.toBackendDict()
        };
      }
    };

    onExternalSaveEmitter.emit();
    tick();

    expect(component.showMarkAllAudioAsNeedingUpdateModalIfRequired.emit)
      .toHaveBeenCalled();
  }));

  it('should throw error if content id is invalid', () => {
    component.hint = {
      hintContent: new SubtitledHtml('<p>html text</p>', null),

      toBackendDict(): HintBackendDict {
        return {
          hint_content: this.hintContent.toBackendDict()
        };
      }
    };
    component.hintMemento = {
      hintContent: SubtitledHtml.createDefault(
        'html text', 'contentID'),

      toBackendDict(): HintBackendDict {
        return {
          hint_content: this.hintContent.toBackendDict()
        };
      }
    };

    expect(() => {
      component.saveThisHint();
    }).toThrowError('Expected content id to be non-null');
  });

  it('should open hint editor when user clicks on \'Edit hint\'', () => {
    component.isEditable = true;
    component.hintMemento = {
      hintContent: SubtitledHtml.createDefault(
        '<p> Hint Original</p>', 'contentID'),

      toBackendDict(): HintBackendDict {
        return {
          hint_content: this.hintContent.toBackendDict()
        };
      }
    };
    component.hint = {
      hintContent: SubtitledHtml.createDefault(
        '<p> Hint After Edit </p>', 'contentID'),

      toBackendDict(): HintBackendDict {
        return {
          hint_content: this.hintContent.toBackendDict()
        };
      }
    };
    component.hintEditorIsOpen = false;

    component.openHintEditor();

    expect(component.hintMemento).toEqual(component.hint);
    expect(component.hintEditorIsOpen).toBe(true);
  });

  it('should cancel hint edit if user clicks on \'Cancel\'', () => {
    jasmine.createSpy('valid').and.returnValue(true);

    component.hintEditorIsOpen = true;
    const earlierHint = component.hintMemento = {
      hintContent: SubtitledHtml.createDefault(
        '<p> Hint Original</p>', 'contentID'),

      toBackendDict(): HintBackendDict {
        return {
          hint_content: this.hintContent.toBackendDict()
        };
      }
    };
    component.hint = {
      hintContent: SubtitledHtml.createDefault(
        '<p> Hint After Edit </p>', 'contentID'),

      toBackendDict(): HintBackendDict {
        return {
          hint_content: this.hintContent.toBackendDict()
        };
      }
    };

    component.cancelThisHintEdit();

    expect(component.hint.hintContent).toEqual(earlierHint.hintContent);
    expect(component.hintEditorIsOpen).toBe(false);
  });

  it('should check if hint HTML length exceeds 10000 characters', () => {
    component.hint = {
      hintContent: SubtitledHtml.createDefault(
        'a'.repeat(10000), 'contentID'),

      toBackendDict(): HintBackendDict {
        return {
          hint_content: this.hintContent.toBackendDict()
        };
      }
    };
    expect(component.isHintLengthExceeded()).toBe(false);

    component.hint = {
      hintContent: SubtitledHtml.createDefault(
        'a'.repeat(10001), 'contentID'),

      toBackendDict(): HintBackendDict {
        return {
          hint_content: this.hintContent.toBackendDict()
        };
      }
    };
    expect(component.isHintLengthExceeded()).toBe(true);
  });

  it('should check if hint HTML is updating', () => {
    const schema = component.HINT_FORM_SCHEMA = {
      type: 'html',
      ui_config: {
        hide_complex_extensions: true
      }
    };

    expect(component.getSchema()).toBe(schema);

    component.hint.hintContent._html = 'html';
    expect(component.hint.hintContent._html).toBe('html');

    component.updateHintContentHtml('html update');
    expect(component.hint.hintContent._html).toBe('html update');
  });
});
