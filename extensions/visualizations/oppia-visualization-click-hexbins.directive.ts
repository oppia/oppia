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
      $scope.tooltipVisibility = 'hidden';
      $scope.tooltipLeft = 0;
      $scope.tooltipTop = 0;
      $scope.tooltipText = '';

      let binTarget = null;

      const showBinTooltip = (bin: HexbinBin<ClickOnImageAnswer>) => {
        if (binTarget !== null || bin.length === 0) {
          return;
        }
        binTarget = bin;
        $scope.$apply(() => {
          $scope.tooltipLeft = bin.x;
          $scope.tooltipTop = bin.y;
          $scope.tooltipText = (
            `${bin.length} click${bin.length > 1 ? 's' : ''}`);
          $scope.tooltipVisibility = 'visible';
        });
      };

      const hideBinTooltip = (bin: HexbinBin<ClickOnImageAnswer>) => {
        if (binTarget !== bin) {
          return;
        }
        binTarget = null;
        $scope.$apply(() => {
          $scope.tooltipVisibility = 'hidden';
        });
      };

      this.$onInit = () => {
        const imagePath = (
          $scope.interactionArgs.imageAndRegions.value.imagePath);
        const { height, width } = (
          ImagePreloaderService.getDimensionsOfImage(imagePath));
        const containerWidth = $('.click-hexbin-wrapper').width();
        const containerHeight = Math.round(containerWidth * height / width);

        const hexbinGenerator = hexbin<ClickOnImageAnswer>()
          .x(d => (d.answer.clickPosition[0] * containerWidth))
          .y(d => (d.answer.clickPosition[1] * containerHeight))
          .radius(16)
          .size([containerWidth, containerHeight]);
        const bins = hexbinGenerator($scope.data);

        const fillColor = d3.scaleLinear()
          .domain([0, d3.max(bins, b => b.length)])
          // @ts-ignore: range's type is wrong, rgba strings are supported.
          .range(['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.75)']);

        d3.select('g').selectAll('path').data(bins).enter()
          .append('path')
          .attr('transform', b => `translate(${b.x}, ${b.y})`)
          .attr('fill', b => fillColor(b.length))
          .attr('d', hexbinGenerator.hexagon())
          .on('mouseout', hideBinTooltip)
          .on('mouseover', showBinTooltip);

        $scope.imageUrl = AssetsBackendApiService.getImageUrlForPreview(
          ContextService.getEntityType(), ContextService.getEntityId(),
          imagePath);
        $scope.containerWidth = containerWidth;
        $scope.containerHeight = containerHeight;
        $scope.hexbinMesh = hexbinGenerator.mesh();
      };
    }
  ]
}));
