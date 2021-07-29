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
 * @fileoverview Unit tests for logic question editor.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { LogicQuestionEditorComponent } from './logic-question-editor.component';

describe('LogicQuestionEditorComponent', () => {
  let component: LogicQuestionEditorComponent;
  let fixture: ComponentFixture<LogicQuestionEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LogicQuestionEditorComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogicQuestionEditorComponent);
    component = fixture.componentInstance;

    component.value = {
      assumptions: [
        {
          arguments: [],
          top_kind_name: 'variable',
          dummies: [],
          top_operator_name: 'p'
        }
      ],
      results: [
        {
          arguments: [],
          top_kind_name: 'variable',
          dummies: [],
          top_operator_name: 'p'
        }
      ],
      default_proof_string: ''
    };
  });

  it('should initialise component when interaction is added', () => {
    component.ngOnInit();

    expect(component.localValue).toEqual({
      assumptionsString: 'p',
      targetString: 'p',
      errorMessage: '',
      proofString: ''
    });
  });

  it('should update assumption when user edits assumption', fakeAsync(() => {
    spyOn(component, 'convertThenBuild').and.callThrough();
    spyOn(component.valueChanged, 'emit');
    component.localValue = {
      assumptionsString: 'p & p',
      targetString: 'p',
      errorMessage: '',
      proofString: ''
    };
    component.value = {
      assumptions: [
        {
          arguments: [],
          top_kind_name: 'variable',
          dummies: [],
          top_operator_name: 'p'
        }
      ],
      results: [
        {
          arguments: [],
          top_kind_name: 'variable',
          dummies: [],
          top_operator_name: 'p'
        }
      ],
      default_proof_string: ''
    };

    component.changeAssumptions();
    tick(2);

    expect(component.convertThenBuild)
      .toHaveBeenCalledWith('logicQuestionAssumptions', 'assumptionsString');
    expect(component.localValue).toEqual({
      assumptionsString: 'p \u2227 p',
      targetString: 'p',
      errorMessage: '',
      proofString: ''
    });
    expect(component.value).toEqual({
      assumptions: [
        {
          arguments: [{
            top_kind_name: 'variable',
            top_operator_name: 'p',
            arguments: [],
            dummies: []
          }, {
            top_kind_name: 'variable',
            top_operator_name: 'p',
            arguments: [],
            dummies: []
          }],
          top_kind_name: 'binary_connective',
          dummies: [],
          top_operator_name: 'and'
        }
      ],
      results: [
        {
          arguments: [],
          top_kind_name: 'variable',
          dummies: [],
          top_operator_name: 'p'
        }
      ],
      default_proof_string: ''
    });
    expect(component.valueChanged.emit).toHaveBeenCalledWith(component.value);
  }));

  it('should display error when user types an unknown character in' +
  ' the assumption text box', () => {
    component.localValue = {
      assumptionsString: 'p {',
      targetString: 'p',
      errorMessage: '',
      proofString: ''
    };

    component.changeAssumptions();

    expect(component.localValue).toEqual({
      assumptionsString: 'p {',
      targetString: 'p',
      errorMessage: 'The assumptions could not be parsed.',
      proofString: ''
    });
  });

  it('should update target when user edits the formula the student' +
  ' must prove', fakeAsync(() => {
    spyOn(component, 'convertThenBuild').and.callThrough();
    spyOn(component.valueChanged, 'emit');
    component.localValue = {
      assumptionsString: 'p',
      targetString: 'p & p',
      errorMessage: '',
      proofString: ''
    };
    component.value = {
      assumptions: [
        {
          arguments: [],
          top_kind_name: 'variable',
          dummies: [],
          top_operator_name: 'p'
        }
      ],
      results: [
        {
          arguments: [],
          top_kind_name: 'variable',
          dummies: [],
          top_operator_name: 'p'
        }
      ],
      default_proof_string: ''
    };

    component.changeTarget();
    tick(2);

    expect(component.convertThenBuild)
      .toHaveBeenCalledWith('logicQuestionTarget', 'targetString');
    expect(component.localValue).toEqual({
      assumptionsString: 'p',
      targetString: 'p \u2227 p',
      errorMessage: '',
      proofString: ''
    });
    expect(component.value).toEqual({
      assumptions: [
        {
          arguments: [],
          top_kind_name: 'variable',
          dummies: [],
          top_operator_name: 'p'
        }
      ],
      results: [
        {
          arguments: [{
            top_kind_name: 'variable',
            top_operator_name: 'p',
            arguments: [],
            dummies: []
          }, {
            top_kind_name: 'variable',
            top_operator_name: 'p',
            arguments: [],
            dummies: []
          }],
          top_kind_name: 'binary_connective',
          dummies: [],
          top_operator_name: 'and'
        }
      ],
      default_proof_string: ''
    });
    expect(component.valueChanged.emit).toHaveBeenCalledWith(component.value);
  }));

  it('should display error when user types an unknown character in' +
  ' the target text box', () => {
    component.localValue = {
      assumptionsString: 'p',
      targetString: 'p {',
      errorMessage: '',
      proofString: ''
    };

    component.changeTarget();

    expect(component.localValue).toEqual({
      assumptionsString: 'p',
      targetString: 'p {',
      errorMessage: 'The target could not be parsed.',
      proofString: ''
    });
  });

  it('should update proof when user edits default proof', fakeAsync(() => {
    spyOn(component, 'convertThenBuild').and.callThrough();
    spyOn(component.valueChanged, 'emit');
    component.localValue = {
      assumptionsString: 'p',
      targetString: 'p',
      errorMessage: '',
      proofString: 'p & p'
    };
    component.value = {
      assumptions: [
        {
          arguments: [],
          top_kind_name: 'variable',
          dummies: [],
          top_operator_name: 'p'
        }
      ],
      results: [
        {
          arguments: [],
          top_kind_name: 'variable',
          dummies: [],
          top_operator_name: 'p'
        }
      ],
      default_proof_string: ''
    };

    component.changeProof();
    tick(2);

    expect(component.convertThenBuild)
      .toHaveBeenCalledWith('logicQuestionProof', 'proofString');
    expect(component.localValue).toEqual({
      assumptionsString: 'p',
      targetString: 'p',
      errorMessage: '',
      proofString: 'p \u2227 p'
    });
    expect(component.value).toEqual({
      assumptions: [
        {
          arguments: [],
          top_kind_name: 'variable',
          dummies: [],
          top_operator_name: 'p'
        }
      ],
      results: [
        {
          arguments: [],
          top_kind_name: 'variable',
          dummies: [],
          top_operator_name: 'p'
        }
      ],
      default_proof_string: 'p \u2227 p'
    });
    expect(component.valueChanged.emit).toHaveBeenCalledWith(component.value);
  }));
});
