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
 * @fileoverview Unit tests for OutcomeFeedbackEditorComponent.
 */

import {ChangeDetectorRef, NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {Outcome} from 'domain/exploration/OutcomeObjectFactory';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {ContextService} from 'services/context.service';
import {OutcomeFeedbackEditorComponent} from './outcome-feedback-editor.component';

describe('Outcome Feedback Editor Component', () => {
  let fixture: ComponentFixture<OutcomeFeedbackEditorComponent>;
  let component: OutcomeFeedbackEditorComponent;
  let contextService: ContextService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [OutcomeFeedbackEditorComponent],
      providers: [ChangeDetectorRef, ContextService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OutcomeFeedbackEditorComponent);
    component = fixture.componentInstance;
    contextService = TestBed.inject(ContextService);
  });

  it('should set outcome feedback schema on initialization', () => {
    expect(component.OUTCOME_FEEDBACK_SCHEMA).toBe(undefined);

    spyOn(contextService, 'getEntityType').and.returnValue('notQuestion');
    component.ngOnInit();

    expect(component.OUTCOME_FEEDBACK_SCHEMA).toEqual({
      type: 'html',
      ui_config: {
        hide_complex_extensions: false,
      },
    });
  });

  it('should update html', () => {
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy = spyOn(
      changeDetectorRef.constructor.prototype,
      'detectChanges'
    );
    component.outcome = new Outcome(
      'default',
      null,
      new SubtitledHtml('<p> Previous HTML string </p>', 'Id'),
      false,
      [],
      null,
      null
    );

    expect(component.outcome.feedback.html).toBe(
      '<p> Previous HTML string </p>'
    );

    component.updateHtml('<p> New HTML string </p>');

    expect(component.outcome.feedback.html).toBe('<p> New HTML string </p>');
    expect(detectChangesSpy).toHaveBeenCalled();
  });

  it(
    'should not update html if the new and old html' + ' strings are the same',
    () => {
      const changeDetectorRef =
        fixture.debugElement.injector.get(ChangeDetectorRef);
      const detectChangesSpy = spyOn(
        changeDetectorRef.constructor.prototype,
        'detectChanges'
      );
      component.outcome = new Outcome(
        'default',
        null,
        new SubtitledHtml('<p> Previous HTML string </p>', 'Id'),
        false,
        [],
        null,
        null
      );

      expect(component.outcome.feedback.html).toBe(
        '<p> Previous HTML string </p>'
      );

      component.updateHtml('<p> Previous HTML string </p>');
      expect(detectChangesSpy).not.toHaveBeenCalled();
    }
  );
});
