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
 * @fileoverview Component for the bar chart.
 */

import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
} from '@angular/core';
import './bar-chart.component.css';

interface DataPoint {
  country: string;
  userCount: number;
  annotationText?: string;
}

interface ChartTick {
  value: string;
  width: string;
}

@Component({
  selector: 'oppia-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css'],
})
export class BarChartComponent implements OnInit, AfterViewInit {
  @Input() chartId!: string;
  @Input() rawData!: DataPoint[];
  @Input() ticks!: ChartTick[];
  @Input() barsColor!: string;
  @Input() annotationTextColor!: string;
  @Input() labelsColor!: string;

  normalizedData!: DataPoint[];

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    const maxUserCount = Math.max(
      ...this.rawData.map(dataPoint => dataPoint.userCount)
    );
    this.normalizedData = this.rawData.map(dataPoint => {
      const normalizedUserCount = (dataPoint.userCount / maxUserCount).toFixed(
        2
      );
      return {
        ...dataPoint,
        userCount: parseFloat(normalizedUserCount),
      };
    });
  }

  ngAfterViewInit(): void {
    this.setBarElementsSize();
  }

  private setBarElementsSize(): void {
    const chartBarElements =
      this.elementRef.nativeElement.getElementsByClassName(
        'oppia-chart-bar-element'
      ) as HTMLCollectionOf<HTMLElement>;
    for (let i = 0; i < chartBarElements.length; i++) {
      const size = this.normalizedData[i].userCount;
      chartBarElements[i].setAttribute('style', `--size: ${size};`);
    }
    const tableElement = this.elementRef.nativeElement.getElementsByClassName(
      'bar'
    )[0] as HTMLElement;
    tableElement.setAttribute('style', `--color: ${this.barsColor};`);
  }
}
