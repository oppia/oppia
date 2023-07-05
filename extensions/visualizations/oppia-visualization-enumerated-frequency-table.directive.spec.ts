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
 * @fileoverview Unit tests for "enumerated frequency table" visualization.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AnswerStats } from 'domain/exploration/answer-stats.model';
// This throws "TS2307". We need to
// suppress this error because rte-text-components are not strictly typed yet.
// @ts-ignore
import { RichTextComponentsModule } from 'rich_text_components/rich-text-components.module';
import { OppiaVisualizationEnumeratedFrequencyTableComponent } from './oppia-visualization-enumerated-frequency-table.directive';

describe('oppiaVisualizationEnumeratedFrequencyTable', () => {
  let component: OppiaVisualizationEnumeratedFrequencyTableComponent;
  let fixture: ComponentFixture<
  OppiaVisualizationEnumeratedFrequencyTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RichTextComponentsModule
      ],
      declarations: [
        OppiaVisualizationEnumeratedFrequencyTableComponent,
      ],
      providers: [
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      OppiaVisualizationEnumeratedFrequencyTableComponent);
    component = fixture.componentInstance;
    component.answerVisible = [true, false];
    let data = [
      {answer: ['foo'], frequency: 3},
      {answer: ['bar'], frequency: 1}];
    component.options = {
      title: 'title',
      column_headers: 'column_headers',
    };
    component.addressedInfoIsSupported = ['addressedInfoIsSupported'];
    component.data = (data.map(d => AnswerStats.createFromBackendDict(d)));
    fixture.detectChanges();
  });

  it('should display first answer and hide the second answer', fakeAsync(() => {
    const bannerDe = fixture.debugElement;
    const bannerEl = bannerDe.nativeElement;
    const answersList: string[] = [];
    bannerEl.querySelectorAll('.answer-rank').forEach(
      (el: { textContent: string }) => {
        answersList.push(el.textContent);
      }
    );

    tick();
    expect(answersList).toEqual(['Answer Set #1', 'Answer Set #2']);

    let values = bannerEl.querySelectorAll('.answers');

    expect(values[0].textContent).toBe('foo');
    expect(values[1].textContent).toBe('3');
    expect(values[2].textContent).toBe('bar');
    expect(values[3].textContent).toBe('1');

    component.toggleAnswerVisibility(2);

    const hiddenRows: boolean[] = [];
    bannerEl.querySelectorAll(
      '.item-table'
    ).forEach(
      (el: { hidden: boolean }) => hiddenRows.push(el.hidden)
    );
    tick();

    expect(hiddenRows).toEqual([false, true]);
  }));

  it('should display second answer and hide the first answer', fakeAsync(() => {
    const bannerDe = fixture.debugElement;
    const bannerEl = bannerDe.nativeElement;

    component.toggleAnswerVisibility(1);
    fixture.detectChanges();
    tick();

    const hiddenRows: boolean[] = [];
    bannerEl.querySelectorAll(
      '.item-table'
    ).forEach(
      (el: { hidden: boolean }) => hiddenRows.push(el.hidden)
    );
    tick();

    expect(hiddenRows).toEqual([false, false]);
  }));

  it('should intialize component properly', fakeAsync(() => {
    tick();
    component.ngOnInit();

    component.toggleAnswerVisibility(0);

    expect(component.answerVisible[0]).toEqual(false);
  }));
});
