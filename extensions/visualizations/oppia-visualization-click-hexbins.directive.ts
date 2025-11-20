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
import maxBy from 'lodash/maxBy';
import sumBy from 'lodash/sumBy';
import {RGBColor, rgb} from 'd3-color';
import {
  ImageDimensions,
  ImagePreloaderService,
} from 'pages/exploration-player-page/services/image-preloader.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {PageContextService} from 'services/page-context.service';

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
  maxClicks: number;
  wrapperWidth: number;
  wrapperHeight: number;
  hexbins: HexbinBin<ClickOnImageAnswer>[];
  hexagon: string;
  hexagonMesh: string;

  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private pageContextService: PageContextService,
    private imagePreloaderService: ImagePreloaderService
  ) {}

  getTooltipStyle(): object {
    return {
      left: this.tooltipTarget.x + 'px',
      top: this.tooltipTarget.y + 'px',
    };
  }

  showTooltip(bin: Hexbin): void {
    if (bin && bin.length > 0) {
      this.tooltipTarget = bin;
    }
  }

  hideTooltip(bin: Hexbin): void {
    if (this.tooltipTarget === bin) {
      this.tooltipTarget = null;
    }
  }

  getFillColor(b: Hexbin): RGBColor {
    const numClicks = this.getNumClicks(b);
    const minOpacity = 0.25;
    const maxOpacity = 0.75;

    if (this.maxClicks === 0) {
      return rgb(255, 255, 255, minOpacity);
    }

    // Normalize the input value (find t: 0 to 1)
    const t = numClicks / this.maxClicks;

    // Use t to set the opacity to the scaled value.
    return rgb(255, 255, 255, minOpacity + t * (maxOpacity - minOpacity));
  }

  isTooltipVisible(): boolean {
    return this.tooltipTarget !== null;
  }

  getTooltipNumClicks(): number {
    return this.getNumClicks(this.tooltipTarget);
  }

  getNumClicks(bin: Hexbin): number {
    return sumBy(bin, (a: ClickOnImageAnswer) => a.frequency);
  }

  ngOnInit(): void {
    this.imagePath = this.interactionArgs.imageAndRegions.value.imagePath;
    this.imageSize = this.imagePreloaderService.getDimensionsOfImage(
      this.imagePath
    );
    const imageUrl = this.assetsBackendApiService.getImageUrlForPreview(
      this.pageContextService.getEntityType(),
      this.pageContextService.getEntityId(),
      this.imagePath
    );

    const wrapperEl = document.querySelector(
      '.click-hexbin-wrapper'
    ) as HTMLElement;
    const wrapperWidth = wrapperEl?.offsetWidth || 300;
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
    const maxBin = maxBy(this.hexbins, this.getNumClicks);
    this.maxClicks = maxBin ? this.getNumClicks(maxBin) : 0;
    this.imageUrl = imageUrl;
    this.wrapperWidth = wrapperWidth;
    this.wrapperHeight = wrapperHeight;
    this.hexagon = hexbinGenerator.hexagon();
    this.hexagonMesh = hexbinGenerator.mesh();
  }
}
