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
 * @fileoverview Directive for pie chart visualization.
 */

import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {Subscription} from 'rxjs';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';

export type ChartLegendPosition =
  | 'bottom'
  | 'left'
  | 'in'
  | 'none'
  | 'right'
  | 'top';

@Component({
  selector: 'oppia-pie-chart',
  templateUrl: './pie-chart.component.html',
})
export class PieChartComponent implements OnInit, OnDestroy, AfterViewInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @ViewChild('pieChart') pieChart!: ElementRef;

  // A read-only array representing the table of chart data.
  @Input() data!: string[];
  // A read-only object containing several chart options. This object
  // should have the following keys: pieHole, pieSliceTextStyleColor,
  // chartAreaWidth, colors, height, legendPosition, width.
  @Input() options!: {
    chartAreaWidth: number;
    colors: string[];
    height: number;
    left: number;
    legendPosition: string;
    pieHole: number;
    pieSliceBorderColor: string;
    pieSliceTextStyleColor: string;
    title: string;
    width: number;
  };

  chart!: google.visualization.PieChart;
  directiveSubscriptions = new Subscription();

  constructor(private windowDimensionsService: WindowDimensionsService) {}

  redrawChart(): void {
    if (this.chart !== null) {
      this.chart.draw(google.visualization.arrayToDataTable(this.data), {
        title: this.options.title,
        pieHole: this.options.pieHole,
        pieSliceTextStyle: {
          color: this.options.pieSliceTextStyleColor,
        },
        pieSliceBorderColor: this.options.pieSliceBorderColor,
        pieSliceText: 'none',
        chartArea: {
          left: this.options.left,
          width: this.options.chartAreaWidth,
        },
        colors: this.options.colors,
        height: this.options.height,
        legend: {
          position: (this.options.legendPosition ||
            'none') as ChartLegendPosition,
        },
        width: this.options.width,
      });
    }
  }

  ngAfterViewInit(): void {
    // Need to wait for load statement in editor template to finish.
    // https://stackoverflow.com/questions/42714876/
    google.charts.setOnLoadCallback(() => {
      if (!this.chart) {
        setTimeout(() => {
          this.chart = new google.visualization.PieChart(
            this.pieChart.nativeElement
          );
          this.redrawChart();
        });
      }
    });
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.windowDimensionsService.getResizeEvent().subscribe(() => {
        setTimeout(() => {
          this.redrawChart();
        });
      })
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
