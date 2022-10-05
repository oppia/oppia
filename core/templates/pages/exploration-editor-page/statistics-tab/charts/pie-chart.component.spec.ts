// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for pieChart.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { PieChartComponent } from './pie-chart.component';

describe('Pie Chart component', () => {
  let component: PieChartComponent;
  let fixture: ComponentFixture<PieChartComponent>;
  let resizeEvent = new EventEmitter();
  let mockedChart = null;

  class MockWindowDimensionsService {
    getResizeEvent() {
      return resizeEvent;
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule,
      ],
      declarations: [
        PieChartComponent
      ],
      providers: [
        {
          provide: WindowDimensionsService,
          useClass: MockWindowDimensionsService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      PieChartComponent);
    component = fixture.componentInstance;

    mockedChart = {
      draw: () => {},
      data: 1
    };

    // This approach was choosen because spyOnProperty() doesn't work on
    // properties that doesn't have a get access type.
    // Without this approach the test will fail because it'll throw
    // 'Property google does not have access type get' error.
    // eslint-disable-next-line max-len
    // ref: https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
    // ref: https://github.com/jasmine/jasmine/issues/1415
    Object.defineProperty(window, 'google', {
      get: () => ({})
    });
    component.data = [];
    component.chart = mockedChart;
    component.options = {
      title: 'Pie title',
      legendPosition: null,
      pieHole: null,
      pieSliceTextStyleColor: '#fff',
      pieSliceBorderColor: '#fff',
      left: 0,
      chartAreaWidth: 0,
      colors: [],
      height: 0,
      width: 0
    };
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialize component', fakeAsync(() => {
    spyOnProperty(window, 'google').and.returnValue({
      visualization: {
        arrayToDataTable: () => {},
        PieChart: () => {
          return mockedChart;
        }
      },
      charts: {
        setOnLoadCallback: (callback) => {
          callback();
        }
      }
    });
    component.redrawChart();
    tick();
    component.ngAfterViewInit();
    tick();
    component.ngOnInit();
    tick();
  }));

  it('should initialize afterview init', fakeAsync(() => {
    spyOn(component, 'redrawChart').and.stub();
    spyOnProperty(window, 'google').and.returnValue({
      visualization: {
        PieChart: class Mockdraw {
          constructor(value) {}
          draw() {}
        }
      },
      charts: {
        setOnLoadCallback: (callback) => {
          callback();
        }
      }
    });
    component.pieChart = {
      nativeElement: null
    };
    component.chart = null;
    component.ngAfterViewInit();
    tick();

    expect(component.redrawChart).toHaveBeenCalled();
  }));

  it('should not redraw chart', fakeAsync(() => {
    spyOnProperty(window, 'google').and.returnValue({
      visualization: {
        PieChart: class Mockdraw {
          constructor(value) {}
          draw() {}
        }
      },
      charts: {
        setOnLoadCallback: (callback) => {
          callback();
        }
      }
    });
    spyOn(component, 'redrawChart').and.stub();
    component.chart = mockedChart;

    component.ngAfterViewInit();
    tick();

    expect(component.redrawChart).not.toHaveBeenCalled();
  }));

  it('should redraw chart', fakeAsync(() => {
    spyOnProperty(window, 'google').and.returnValue({
      visualization: {
        PieChart: class Mockdraw {
          constructor(value) {}
          draw() {}
        }
      },
      charts: {
        setOnLoadCallback: (callback) => {
          callback();
        }
      }
    });
    spyOn(component, 'redrawChart').and.stub();

    component.ngOnInit();
    tick();
    resizeEvent.emit();
    tick();

    expect(component.redrawChart).toHaveBeenCalled();
  }));
});
