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
 * @fileoverview Visualization which groups image clicks into hexagonal bins.
 *
 * > Why hexagons? There are many reasons for using hexagons, at least over
 *   squares. Hexagons have symmetry of nearest neighbors which is lacking in
 *   square bins. Hexagons are the maximum number of sides a polygon can have
 *   for a regular tesselation of the plane, so in terms of packing a hexagon
 *   is 13% more efficient for covering the plane than squares. This property
 *   translates into better sampling efficiency at least for elliptical shapes.
 *   Lastly hexagons are visually less biased for displaying densities than
 *   other regular tesselations. For instance with squares our eyes are drawn
 *   to the horizontal and vertical lines of the grid.
 * https://cran.r-project.org/web/packages/hexbin/vignettes/hexagon_binning.pdf
 */

import {Component, Input, OnInit} from '@angular/core';
import {hexbin, HexbinBin} from 'd3-hexbin';
import {max, sum} from 'd3-array';
import {RGBColor, rgb} from 'd3-color';
import {ScaleLinear, scaleLinear} from 'd3-scale';
import {
  ImageDimensions,
  ImagePreloaderService,
} from 'pages/exploration-player-page/services/image-preloader.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {ContextService} from 'services/context.service';

import './oppia-visualization-click-hexbins.directive.css';

export interface ClickOnImageAnswer {
  answer: {
    clickPosition: [number, number];
    clickedRegions: string[];
  };
  frequency: number;
}

interface InteractionArgs {
  imageAndRegions: {
    value: {
      imagePath: string;
    };
  };
}

export type Hexbin = HexbinBin<ClickOnImageAnswer>;

@Component({
  selector: 'oppia-visualization-click-hexbins',
  templateUrl: './oppia-visualization-click-hexbins.directive.html',
})
export class OppiaVisualizationClickHexbinsComponent implements OnInit {
  @Input() data: ClickOnImageAnswer[];
  @Input() interactionArgs: InteractionArgs;

  tooltipTarget: Hexbin = null;

  imagePath: string;
  imageSize: ImageDimensions;
  imageUrl: string;
  wrapperWidth: number;
  wrapperHeight: number;
  hexbins: HexbinBin<ClickOnImageAnswer>[];
  hexagon: string;
  hexagonMesh: string;
  colorScale: ScaleLinear<RGBColor, RGBColor>;

  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private contextService: ContextService,
    private imagePreloaderService: ImagePreloaderService
  ) {}

  getTooltipStyle(): object {
    return {
      left: this.tooltipTarget.x + 'px',
      top: this.tooltipTarget.y + 'px',
    };
  }

  showTooltip(bin: Hexbin): void {
    if (this.tooltipTarget && bin.length > 0) {
      this.tooltipTarget = bin;
    }
  }

  hideTooltip(bin: Hexbin): void {
    if (this.tooltipTarget === bin) {
      this.tooltipTarget = null;
    }
  }

  getFillColor(b: Hexbin): RGBColor {
    return this.colorScale(this.getNumClicks(b));
  }

  isTooltipVisible(): void {
    this.tooltipTarget !== null;
  }

  getTooltipNumClicks(): number {
    return this.getNumClicks(this.tooltipTarget);
  }

  getNumClicks(bin: Hexbin): number {
    return sum(bin, a => a.frequency);
  }

  ngOnInit(): void {
    this.imagePath = this.interactionArgs.imageAndRegions.value.imagePath;
    this.imageSize = this.imagePreloaderService.getDimensionsOfImage(
      this.imagePath
    );
    const imageUrl = this.assetsBackendApiService.getImageUrlForPreview(
      this.contextService.getEntityType(),
      this.contextService.getEntityId(),
      this.imagePath
    );

    const wrapperWidth = $('.click-hexbin-wrapper').width() || 300;
    const wrapperHeight =
      this.imageSize.width === 0
        ? this.imageSize.height
        : Math.round(
            (wrapperWidth * this.imageSize.height) / this.imageSize.width
          );

    const hexbinGenerator = hexbin<ClickOnImageAnswer>()
      .x(a => a.answer.clickPosition[0] * wrapperWidth)
      .y(a => a.answer.clickPosition[1] * wrapperHeight)
      .size([wrapperWidth, wrapperHeight])
      .radius(16);

    this.hexbins = hexbinGenerator(this.data);
    this.colorScale = scaleLinear<RGBColor>()
      .domain([0, max(this.hexbins, this.getNumClicks)])
      .range([rgb(255, 255, 255, 0.25), rgb(255, 255, 255, 0.75)]);
    this.imageUrl = imageUrl;
    this.wrapperWidth = wrapperWidth;
    this.wrapperHeight = wrapperHeight;
    this.hexagon = hexbinGenerator.hexagon();
    this.hexagonMesh = hexbinGenerator.mesh();
  }
}
