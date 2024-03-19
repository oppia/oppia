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

import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  waitForAsync,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {HintEditorComponent} from './hint-editor.component';
import {ContextService} from 'services/context.service';
import {EditabilityService} from 'services/editability.service';
import {ExternalSaveService} from 'services/external-save.service';
import {Hint} from 'domain/exploration/hint-object.model';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';

describe('HintEditorComponent', () => {
  let component: HintEditorComponent;
  let fixture: ComponentFixture<HintEditorComponent>;
  let editabilityService: EditabilityService;
  let externalSaveService: ExternalSaveService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HintEditorComponent],
      providers: [ContextService, EditabilityService, ExternalSaveService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HintEditorComponent);
    component = fixture.componentInstance;

    editabilityService = TestBed.inject(EditabilityService);
    externalSaveService = TestBed.inject(ExternalSaveService);

    component.hint = new Hint(
      SubtitledHtml.createDefault('html text', 'contentID')
    );

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
    spyOnProperty(externalSaveService, 'onExternalSave').and.returnValue(
      onExternalSaveEmitter
    );
    component.ngOnInit();

    component.hintEditorIsOpen = true;
    component.hint = new Hint(SubtitledHtml.createDefault('change', 'data'));
    component.hintMemento = new Hint(
      SubtitledHtml.createDefault('html text', 'contentID')
    );

    onExternalSaveEmitter.emit();
    tick();
  }));

  it("should open hint editor when user clicks on 'Edit hint'", () => {
    component.isEditable = true;
    component.hintMemento = new Hint(
      SubtitledHtml.createDefault('html text', 'contentID')
    );
    component.hint = new Hint(
      SubtitledHtml.createDefault('html text edited', 'contentID')
    );
    component.hintEditorIsOpen = false;

    component.openHintEditor();

    expect(component.hintMemento).toEqual(component.hint);
    expect(component.hintEditorIsOpen).toBe(true);
  });

  it("should cancel hint edit if user clicks on 'Cancel'", () => {
    jasmine.createSpy('valid').and.returnValue(true);

    component.hintEditorIsOpen = true;
    const earlierHint = (component.hintMemento = new Hint(
      SubtitledHtml.createDefault('html text', 'contentID')
    ));
    component.hint = new Hint(
      SubtitledHtml.createDefault('html text edited', 'contentID')
    );

    component.cancelThisHintEdit();

    expect(component.hint.hintContent).toEqual(earlierHint.hintContent);
    expect(component.hintEditorIsOpen).toBe(false);
  });

  it('should check if hint HTML length exceeds 500 characters', () => {
    component.hint = new Hint(
      SubtitledHtml.createDefault(`<p>${'a'.repeat(500)}</p>`, 'contentID')
    );
    expect(component.isHintLengthExceeded()).toBe(false);

    component.hint = new Hint(
      SubtitledHtml.createDefault(`<p>${'a'.repeat(501)}</p>`, 'contentID')
    );
    expect(component.isHintLengthExceeded()).toBe(true);
  });

  it('should check if hint HTML is updating', () => {
    const schema = (component.HINT_FORM_SCHEMA = {
      type: 'html',
      ui_config: {
        hide_complex_extensions: true,
      },
    });

    expect(component.getSchema()).toBe(schema);

    component.hint.hintContent._html = 'html';
    expect(component.hint.hintContent._html).toBe('html');

    component.updateHintContentHtml('html update');
    expect(component.hint.hintContent._html).toBe('html update');
  });
});
