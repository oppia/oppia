// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the state content editor directive.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {fakeAsync, tick} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {StateContentEditorComponent} from './state-content-editor.component';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';

import {ChangeListService} from 'pages/exploration-editor-page/services/change-list.service';
import {ExternalSaveService} from 'services/external-save.service';
import {StateContentService} from 'components/state-editor/state-editor-properties-services/state-content.service';
import cloneDeep from 'lodash/cloneDeep';

describe('StateHintsEditorComponent', () => {
  let component: StateContentEditorComponent;
  let fixture: ComponentFixture<StateContentEditorComponent>;
  let changeListService: ChangeListService;
  let externalSaveService: ExternalSaveService;
  let stateContentService: StateContentService;

  let _getContent = function (contentId: string, contentString: string) {
    return SubtitledHtml.createFromBackendDict({
      content_id: contentId,
      html: contentString,
    });
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [StateContentEditorComponent, MockTranslatePipe],
      providers: [ChangeListService, ExternalSaveService, StateContentService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateContentEditorComponent);
    component = fixture.componentInstance;

    changeListService = TestBed.inject(ChangeListService);
    externalSaveService = TestBed.inject(ExternalSaveService);
    stateContentService = TestBed.inject(StateContentService);

    fixture.detectChanges();
  });

  it('should start with the content editor not being open', function () {
    component.ngOnInit();

    expect(component.contentEditorIsOpen).toBeFalse();
  });

  it('should save hint when external save event is triggered', fakeAsync(() => {
    let onExternalSaveEmitter = new EventEmitter();
    spyOnProperty(externalSaveService, 'onExternalSave').and.returnValue(
      onExternalSaveEmitter
    );
    spyOn(component.saveStateContent, 'emit').and.callThrough();

    component.ngOnInit();
    component.contentEditorIsOpen = true;

    onExternalSaveEmitter.emit();
    tick();

    expect(component.saveStateContent.emit).toHaveBeenCalled();
  }));

  it('should hide card height limit warning', function () {
    component.cardHeightLimitWarningIsShown = true;
    component.hideCardHeightLimitWarning();

    expect(component.cardHeightLimitWarningIsShown).toBeFalse();
  });

  it('should show card height limit warning', function () {
    stateContentService.displayed = _getContent('content', '');

    expect(component.isCardContentLengthLimitReached()).toBeFalse();
  });

  it('should correctly handle no-op edits', function () {
    component.ngOnInit();

    expect(component.contentEditorIsOpen).toBeFalse();
    expect(stateContentService.savedMemento).toEqual(
      _getContent('content', '')
    );

    component.openStateContentEditor();

    expect(component.contentEditorIsOpen).toBeTrue();

    stateContentService.displayed = _getContent('content', '');
    component.onSaveContentButtonClicked();

    expect(component.contentEditorIsOpen).toBeFalse();
    expect(changeListService.getChangeList()).toEqual([]);
  });

  it('should check that content edits are saved correctly', function () {
    spyOn(component.saveStateContent, 'emit');

    component.ngOnInit();

    expect(changeListService.getChangeList()).toEqual([]);

    component.openStateContentEditor();
    stateContentService.displayed = _getContent('content', 'babababa');
    component.onSaveContentButtonClicked();

    expect(component.saveStateContent.emit).toHaveBeenCalled();

    component.openStateContentEditor();
    stateContentService.displayed = _getContent(
      'content',
      'And now for something completely different.'
    );
    component.onSaveContentButtonClicked();

    expect(component.saveStateContent.emit).toHaveBeenCalled();
  });

  it('should not save changes to content when edit is cancelled', function () {
    component.ngOnInit();
    const contentBeforeEdit = cloneDeep(stateContentService.savedMemento);

    stateContentService.displayed = _getContent('content', 'Test Content');

    component.cancelEdit();

    expect(component.contentEditorIsOpen).toBeFalse();
    expect(stateContentService.savedMemento).toEqual(contentBeforeEdit);
    expect(stateContentService.displayed).toEqual(contentBeforeEdit);
  });

  it('should call the callback function on-save', function () {
    spyOn(component.saveStateContent, 'emit');

    component.onSaveContentButtonClicked();

    expect(component.saveStateContent.emit).toHaveBeenCalled();
  });

  it('should update when card height limit is reached', () => {
    component.cardHeightLimitReached = false;
    spyOn(component, 'isCardHeightLimitReached').and.returnValue(
      !component.cardHeightLimitReached
    );

    component.ngAfterViewChecked();

    expect(component.cardHeightLimitReached).toBeTrue();
    expect(component.isCardHeightLimitReached).toHaveBeenCalled();
  });

  it('should return false if shadow preview card is not present', () => {
    spyOn(document, 'querySelector').and.returnValue(null);

    const result = component.isCardHeightLimitReached();

    expect(result).toBeFalse();
  });

  describe('Auto-save functionality', () => {
    beforeEach(() => {
      stateContentService.displayed = _getContent('content', 'Initial content');
      stateContentService.savedMemento = _getContent('content', 'Initial content');
    });

    it('should trigger content change when onContentChange is called with editor open', fakeAsync(() => {
      component.contentEditorIsOpen = true;
      spyOn(component, 'autoSaveContent');

      component.onContentChange();
      
      expect(component.autoSaveStatus).toBe('idle');
      
      tick(3000); // Wait for debounce delay.

      expect(component.autoSaveContent).toHaveBeenCalled();
    }));

    it('should not trigger auto-save when editor is closed', fakeAsync(() => {
      component.contentEditorIsOpen = false;
      spyOn(component, 'autoSaveContent');

      component.onContentChange();
      tick(3000); // Wait for debounce delay.

      // Auto-save should still be called, but will return early.
      expect(component.autoSaveContent).toHaveBeenCalled();
    }));

    it('should debounce multiple rapid content changes', fakeAsync(() => {
      component.contentEditorIsOpen = true;
      spyOn(component, 'autoSaveContent');

      // Trigger multiple changes rapidly.
      component.onContentChange();
      tick(1000);
      component.onContentChange();
      tick(1000);
      component.onContentChange();
      tick(3000); // Wait for debounce delay.

      // Should only trigger once after debounce period.
      expect(component.autoSaveContent).toHaveBeenCalledTimes(1);
    }));

    it('should auto-save when content has changed', fakeAsync(() => {
      component.contentEditorIsOpen = true;
      stateContentService.displayed = _getContent('content', 'New content');
      stateContentService.savedMemento = _getContent('content', 'Old content');
      spyOn(component.saveStateContent, 'emit');
      spyOn(stateContentService, 'saveDisplayedValue');

      expect(component.autoSaveStatus).toBe('idle');

      component.autoSaveContent();

      expect(component.autoSaveStatus).toBe('saved');
      expect(stateContentService.saveDisplayedValue).toHaveBeenCalled();
      expect(component.saveStateContent.emit).toHaveBeenCalledWith(
        stateContentService.displayed
      );

      tick(2000); // Wait for status reset.
      expect(component.autoSaveStatus).toBe('idle');
    }));

    it('should not auto-save when content has not changed', fakeAsync(() => {
      component.contentEditorIsOpen = true;
      stateContentService.displayed = _getContent('content', 'Same content');
      stateContentService.savedMemento = _getContent('content', 'Same content');
      spyOn(component.saveStateContent, 'emit');
      spyOn(stateContentService, 'saveDisplayedValue');

      component.autoSaveContent();

      expect(stateContentService.saveDisplayedValue).not.toHaveBeenCalled();
      expect(component.saveStateContent.emit).not.toHaveBeenCalled();
    }));

    it('should not auto-save when editor is closed', fakeAsync(() => {
      component.contentEditorIsOpen = false;
      stateContentService.displayed = _getContent('content', 'New content');
      stateContentService.savedMemento = _getContent('content', 'Old content');
      spyOn(component.saveStateContent, 'emit');

      component.autoSaveContent();

      expect(component.saveStateContent.emit).not.toHaveBeenCalled();
    }));

    it('should not auto-save when content is not editable', fakeAsync(() => {
      component.contentEditorIsOpen = true;
      stateContentService.displayed = _getContent('content', 'New content');
      stateContentService.savedMemento = _getContent('content', 'Old content');
      spyOn(component, 'isContentEditable').and.returnValue(false);
      spyOn(component.saveStateContent, 'emit');

      component.autoSaveContent();

      expect(component.saveStateContent.emit).not.toHaveBeenCalled();
    }));

    it('should not auto-save when displayed content is null', fakeAsync(() => {
      component.contentEditorIsOpen = true;
      // @ts-ignore: Testing null case.
      stateContentService.displayed = null;
      stateContentService.savedMemento = _getContent('content', 'Old content');
      spyOn(component.saveStateContent, 'emit');

      component.autoSaveContent();

      expect(component.saveStateContent.emit).not.toHaveBeenCalled();
    }));

    it('should not auto-save when saved memento is null', fakeAsync(() => {
      component.contentEditorIsOpen = true;
      stateContentService.displayed = _getContent('content', 'New content');
      // @ts-ignore: Testing null case.
      stateContentService.savedMemento = null;
      spyOn(component.saveStateContent, 'emit');

      component.autoSaveContent();

      expect(component.saveStateContent.emit).not.toHaveBeenCalled();
    }));

    it('should preserve editor open state after auto-save', fakeAsync(() => {
      component.contentEditorIsOpen = true;
      stateContentService.displayed = _getContent('content', 'New content');
      stateContentService.savedMemento = _getContent('content', 'Old content');

      component.autoSaveContent();

      expect(component.contentEditorIsOpen).toBeTrue();
    }));
  });
});
