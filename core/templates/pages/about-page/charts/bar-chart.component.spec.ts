// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the bar chart component.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BarChartComponent} from './bar-chart.component';
import {MockTranslatePipe} from 'tests/unit-test-utils';

describe('BarChartComponent', () => {
  let component: BarChartComponent;
  let fixture: ComponentFixture<BarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BarChartComponent, MockTranslatePipe],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BarChartComponent);
    component = fixture.componentInstance;
    component.chartId = 'chartId';
    component.rawData = [
      {country: 'Country1', userCount: 100, annotationText: 'Annotation1'},
      {country: 'Country2', userCount: 200},
    ];
    component.ticks = [
      {value: '1K', width: '50%'},
      {value: '2K', width: '50%'},
    ];
    component.barsColor = 'red';
    component.annotationTextColor = 'black';
    component.labelsColor = 'black';
    fixture.detectChanges();
  });

  it('should successfully instantiate the component', () => {
    expect(component).toBeDefined();
  });

  it('should normalize data on init', () => {
    component.ngOnInit();

    expect(component.normalizedData).toEqual([
      {country: 'Country1', userCount: 0.5, annotationText: 'Annotation1'},
      {country: 'Country2', userCount: 1},
    ]);
  });

  it('should set bar elements size after view init', () => {
    component.ngOnInit();
    component.ngAfterViewInit();

    const chartBarElements = fixture.nativeElement.getElementsByClassName(
      'oppia-chart-bar-element'
    );
    expect(chartBarElements.length).toBe(component.normalizedData.length);
    for (let i = 0; i < chartBarElements.length; i++) {
      expect(chartBarElements[i].style.getPropertyValue('--size')).toBe(
        `${component.normalizedData[i].userCount}`
      );
    }
  });

  it('should set table element color after view init', () => {
    component.ngOnInit();
    component.ngAfterViewInit();

    const tableElement = fixture.nativeElement.getElementsByClassName('bar')[0];
    expect(tableElement.style.getPropertyValue('--color')).toBe('red');
  });
});
