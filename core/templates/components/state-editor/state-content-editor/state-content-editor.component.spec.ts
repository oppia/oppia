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
    var contentBeforeEdit = angular.copy(stateContentService.savedMemento);

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
});
