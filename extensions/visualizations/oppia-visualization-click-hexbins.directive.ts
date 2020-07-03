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

import * as d3 from 'd3';
import { scaleLinear } from 'd3-scale';
import { hexbin, HexbinBin } from 'd3-hexbin';

interface ClickOnImageAnswer {
  answer: {
    clickPosition: [number, number];
    clickedRegions: string[];
  };
  frequency: number;
}

/**
 * @fileoverview Visualization to group image-clicks into hexagonal bins.
 */

angular.module('oppia').directive('oppiaVisualizationClickHexbins', () => ({
  restrict: 'E',
  scope: { data: '<', interactionArgs: '<' },
  template: require('./oppia-visualization-click-hexbins.directive.html'),
  style: require('./oppia-visualization-click-hexbins.directive.css'),
  controller: [
    '$scope', 'AssetsBackendApiService', 'ContextService',
    'ImagePreloaderService',
    function(
        $scope, AssetsBackendApiService, ContextService,
        ImagePreloaderService) {
      const imagePath = $scope.interactionArgs.imageAndRegions.value.imagePath;
      const imageDimensions = (
        ImagePreloaderService.getDimensionsOfImage(imagePath));
      const imageUrl = AssetsBackendApiService.getImageUrlForPreview(
        ContextService.getEntityType(), ContextService.getEntityId(),
        imagePath);

      let tooltipTarget: HexbinBin<ClickOnImageAnswer> = null;

      const showTooltip = function(bin: HexbinBin<ClickOnImageAnswer>) {
        if (tooltipTarget === null && bin.length > 0) {
          tooltipTarget = bin;
        }
      };

      const hideTooltip = function(bin: HexbinBin<ClickOnImageAnswer>) {
        if (tooltipTarget === bin) {
          tooltipTarget = null;
        }
      };

      this.$onInit = () => {
        const wrapperWidth = $('.click-hexbin-wrapper').width() || 300;
        const wrapperHeight = Math.round(
          wrapperWidth * imageDimensions.height / imageDimensions.width);

        const getNumClicks = function(bin: HexbinBin<ClickOnImageAnswer>) {
          return d3.sum(bin, a => a.frequency);
        };

        const hexbinGenerator = hexbin<ClickOnImageAnswer>()
          .x(d => d.answer.clickPosition[0] * wrapperWidth)
          .y(d => d.answer.clickPosition[1] * wrapperHeight)
          .size([wrapperWidth, wrapperHeight])
          .radius(16);
        const bins = hexbinGenerator($scope.data);
        const colorScale = d3.scaleLinear<string>()
          .domain([0, d3.max(bins, getNumClicks)])
          .range(['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.75)']);

        $scope.imageUrl = imageUrl;
        $scope.wrapperWidth = wrapperWidth;
        $scope.wrapperHeight = wrapperHeight;

        $scope.bins = bins;
        $scope.hexagon = hexbinGenerator.hexagon();
        $scope.hexagonMesh = hexbinGenerator.mesh();
        $scope.getFillColor = (
          (b: HexbinBin<ClickOnImageAnswer>) => colorScale(getNumClicks(b)));

        $scope.isTooltipVisible = () => tooltipTarget !== null;
        $scope.getTooltipNumClicks = () => getNumClicks(tooltipTarget);
        $scope.getTooltipStyle = () => ({
          top: `${tooltipTarget.y}px`,
          left: `${tooltipTarget.x}px`,
        });
        $scope.showTooltip = showTooltip;
        $scope.hideTooltip = hideTooltip;
      };
    }
  ]
}));
