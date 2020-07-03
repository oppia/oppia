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
import { hexbin, HexbinBin } from 'd3-hexbin';

interface ClickOnImageAnswer {
  answer: {
    clickPosition: [number, number];
    clickedRegions: string[];
  }
}

/**
 * @fileoverview Visualization for image clicks as a hexagonal heat-map.
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
      this.$onInit = () => {
        const imagePath = (
          $scope.interactionArgs.imageAndRegions.value.imagePath);
        const imageDimensions = (
          ImagePreloaderService.getDimensionsOfImage(imagePath));

        const wrapperWidth = $('.click-hexbin-wrapper').width() || 300;
        const wrapperHeight = Math.round(
          wrapperWidth * imageDimensions.height / imageDimensions.width);

        const hexbinGenerator = hexbin<ClickOnImageAnswer>()
          .x(d => d.answer.clickPosition[0] * wrapperWidth)
          .y(d => d.answer.clickPosition[1] * wrapperHeight)
          .size([wrapperWidth, wrapperHeight])
          .radius(16);
        const binData = $scope.data.map(d => Array(d.frequency).fill(d)).flat();
        const bins = hexbinGenerator(binData);

        $scope.bins = bins;
        $scope.hexagon = hexbinGenerator.hexagon();
        $scope.hexagonMesh = hexbinGenerator.mesh();
        $scope.fillColor = d3.scaleLinear()
          .domain([0, d3.max(bins, b => b.length)])
          // @ts-ignore the type of .range is wrong, rgba strings are accepted.
          .range(['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.75)']);
        $scope.imagePath = AssetsBackendApiService.getImageUrlForPreview(
          ContextService.getEntityType(), ContextService.getEntityId(),
          imagePath);
        $scope.wrapperWidth = wrapperWidth;
        $scope.wrapperHeight = wrapperHeight;

        $scope.binTooltipTarget = null;
        $scope.showBinTooltip = (bin: HexbinBin<ClickOnImageAnswer>) => {
          if ($scope.binTooltipTarget === null && bin.length > 0) {
            $scope.binTooltipTarget = bin;
          }
        };
        $scope.hideBinTooltip = (bin: HexbinBin<ClickOnImageAnswer>) => {
          if ($scope.binTooltipTarget === bin) {
            $scope.binTooltipTarget = null;
          }
        };
      };
    }
  ]
}));
