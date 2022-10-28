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
 * @fileoverview Unit tests for Review Material Editor Component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { ReviewMaterialEditorComponent } from './review-material-editor.component';

describe('Review Material Editor Component', () => {
  let component: ReviewMaterialEditorComponent;
  let fixture: ComponentFixture<ReviewMaterialEditorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        ReviewMaterialEditorComponent
      ],
      providers: [
        ChangeDetectorRef
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewMaterialEditorComponent);
    component = fixture.componentInstance;

    component.bindableDict = {
      displayedConceptCardExplanation: 'Explanation',
      displayedWorkedExamples: 'Examples'
    };
    fixture.detectChanges();
  });

  it('should set component properties on initialization', () => {
    expect(component.HTML_SCHEMA).toEqual({
      type: 'html'
    });
    expect(component.editableExplanation).toBe('Explanation');
    expect(component.conceptCardExplanationEditorIsShown).toBe(false);
  });

  it('should open concept card explanation editor when user' +
    ' clicks to edit concept card', () => {
    component.conceptCardExplanationEditorIsShown = false;

    component.openConceptCardExplanationEditor();

    expect(component.conceptCardExplanationEditorIsShown).toBe(true);
  });

  it('should close concept card explanation editor when user' +
    ' clicks on close', () => {
    component.conceptCardExplanationEditorIsShown = true;

    component.closeConceptCardExplanationEditor();

    expect(component.conceptCardExplanationEditorIsShown).toBe(false);
  });

  it('should save concept card explanation when user clicks on save', () => {
    spyOn(component.onSaveExplanation, 'emit');
    component.editableExplanation = 'explanation';

    component.saveConceptCardExplanation();

    expect(component.onSaveExplanation.emit)
      .toHaveBeenCalledWith(SubtitledHtml.createDefault(
        component.editableExplanation, 'explanation'));
  });

  it('should get schema', () => {
    expect(component.getSchema())
      .toEqual(component.HTML_SCHEMA);
  });

  it('should update editableExplanation', () => {
    component.editableExplanation = 'Old Explanation';

    let exp = 'New Explanation';
    component.updateLocalExp(exp);

    expect(component.editableExplanation).toEqual(exp);
  });
});
