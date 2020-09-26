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

import { hexbin, HexbinBin } from 'd3-hexbin';
import { max, sum } from 'd3-array';
import { RGBColor, rgb } from 'd3-color';
import { scaleLinear } from 'd3-scale';

interface ClickOnImageAnswer {
  answer: {
    clickPosition: [number, number];
    clickedRegions: string[];
  };
  frequency: number;
}

type Hexbin = HexbinBin<ClickOnImageAnswer>;

angular.module('oppia').directive('oppiaVisualizationClickHexbins', () => ({
  restrict: 'E',
  scope: {
    data: '<',
    interactionArgs: '<',
  },
  template: require('./oppia-visualization-click-hexbins.directive.html'),
  style: require('./oppia-visualization-click-hexbins.directive.css'),
  controller: [
    '$scope', 'AssetsBackendApiService', 'ContextService',
    'ImagePreloaderService',
    function(
        $scope, AssetsBackendApiService, ContextService,
        ImagePreloaderService) {
      const imagePath = $scope.interactionArgs.imageAndRegions.value.imagePath;
      const imageSize = ImagePreloaderService.getDimensionsOfImage(imagePath);
      const imageUrl = AssetsBackendApiService.getImageUrlForPreview(
        ContextService.getEntityType(), ContextService.getEntityId(),
        imagePath);

      let tooltipTarget: Hexbin = null;

      const showTooltip = function(bin: Hexbin) {
        if (tooltipTarget === null && bin.length > 0) {
          tooltipTarget = bin;
        }
      };

      const hideTooltip = function(bin: Hexbin) {
        if (tooltipTarget === bin) {
          tooltipTarget = null;
        }
      };

      this.$onInit = () => {
        const wrapperWidth = $('.click-hexbin-wrapper').width() || 300;
        const wrapperHeight = imageSize.width === 0 ?
          imageSize.height :
          Math.round(wrapperWidth * imageSize.height / imageSize.width);

        const getNumClicks = (bin: Hexbin) => sum(bin, a => a.frequency);

        const hexbinGenerator = hexbin<ClickOnImageAnswer>()
          .x(a => a.answer.clickPosition[0] * wrapperWidth)
          .y(a => a.answer.clickPosition[1] * wrapperHeight)
          .size([wrapperWidth, wrapperHeight])
          .radius(16);
        const hexbins = hexbinGenerator($scope.data);
        const colorScale = scaleLinear<RGBColor>()
          .domain([0, max(hexbins, getNumClicks)])
          .range([rgb(255, 255, 255, 0.25), rgb(255, 255, 255, 0.75)]);

        $scope.imageUrl = imageUrl;
        $scope.wrapperWidth = wrapperWidth;
        $scope.wrapperHeight = wrapperHeight;

        $scope.hexbins = hexbins;
        $scope.hexagon = hexbinGenerator.hexagon();
        $scope.hexagonMesh = hexbinGenerator.mesh();
        $scope.getFillColor = (b: Hexbin) => colorScale(getNumClicks(b));

        $scope.isTooltipVisible = () => tooltipTarget !== null;
        $scope.getTooltipNumClicks = () => getNumClicks(tooltipTarget);
        $scope.getTooltipStyle = () => (
          { left: tooltipTarget.x + 'px', top: tooltipTarget.y + 'px' });
        $scope.showTooltip = showTooltip;
        $scope.hideTooltip = hideTooltip;
      };
    }
  ]
}));
