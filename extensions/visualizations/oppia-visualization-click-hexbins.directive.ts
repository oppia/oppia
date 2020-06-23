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
import * as d3Hexbin from 'd3-hexbin';
import { HexbinBin } from 'd3-hexbin';

interface ClickOnImageAnswer {
  answer: {
    clickPosition: [number, number];
    clickedRegions: string[];
  }
}

/**
 * @fileoverview Visualization for click statistics providing a hexbin-heatmap.
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
      const imageAndRegions = $scope.interactionArgs.imageAndRegions.value;

      const showTooltip = (hexBin: HexbinBin<ClickOnImageAnswer>) => {
        if (hexBin.length === 0) {
          return;
        }
        d3.select('.click-hexbin-chart-tooltip')
          .style('visibility', 'visible')
          .style('left', `${hexBin.x}px`)
          .style('top', `${hexBin.y + 16}px`)
          .text(`${hexBin.length} click${hexBin.length > 1 ? 's' : ''}`);
      };

      const moveTooltip = (hexBin: HexbinBin<ClickOnImageAnswer>) => {
        if (hexBin.length === 0) {
          return;
        }
        d3.select('.click-hexbin-chart-tooltip')
          .style('visibility', 'visible');
      };

      const hideTooltip = (_: HexbinBin<ClickOnImageAnswer>) => {
        d3.select('.click-hexbin-chart-tooltip')
          .style('visibility', 'hidden');
      };

      const imageUrl = AssetsBackendApiService.getImageUrlForPreview(
        ContextService.getEntityType(), ContextService.getEntityId(),
        imageAndRegions.imagePath);
      const imageDimensions = ImagePreloaderService.getDimensionsOfImage(
        imageAndRegions.imagePath);
      const imageAspectRatio = (
        imageDimensions.height / imageDimensions.width);

      const containerWidth = $('.click-hexbin-chart').width();
      const containerHeight = Math.round(containerWidth * imageAspectRatio);

      this.$onInit = function() {
        d3.select('.click-hexbin-chart-tooltip')
          .style('visibility', 'hidden');

        // Define the data for the hexbins.
        const hexbin = d3Hexbin.hexbin<ClickOnImageAnswer>()
          .x(d => (d.answer.clickPosition[0] * containerWidth))
          .y(d => (d.answer.clickPosition[1] * containerHeight))
          .radius(16)
          .size([containerWidth, containerHeight]);
        const bins = hexbin($scope.data);

        // Define the color of hexbins, using the number of grouped clicks
        // to change their opacity.
        const rgbaScaleEndPoints = [
          'rgba(255,255,255,0.25)',
          'rgba(255,255,255,0.75)'
        ];
        const color = d3.scaleLinear()
          .domain([0, d3.max(bins, b => b.length)])
        // NOTE TO DEVELOPERS: the range type is wrong; rgba string-values
        // are supported.
        // @ts-ignore
          .range(rgbaScaleEndPoints);

        // Construct and add the SVG element for holding the hexbin graph.
        const svg = d3.select('.click-hexbin-chart').append('svg')
          .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`);

        // Draw the image in which the clicks happened.
        svg.append('image')
          .attr('xlink:href', imageUrl)
          .attr('width', `${containerWidth}px`)
          .attr('height', `${containerHeight}px`);

        // Draw an overlay over the image to help distinguish the hexagons.
        svg.append('rect')
          .attr('x', 0).attr('y', 0)
          .attr('width', containerWidth).attr('height', containerHeight)
          .style('fill', 'rgba(0,0,0,0.35)');

        // Draw the mesh of hexagons to help distinguish each group.
        const clipPath = svg.append('clipPath').attr('id', 'clip');
        clipPath.append('rect')
          .attr('class', 'mesh')
          .attr('width', containerWidth)
          .attr('height', containerHeight);

        svg.append('svg:path')
          .attr('clip-path', 'url(#clip)')
          .attr('d', hexbin.mesh())
          .style('stroke-width', .5)
          .style('stroke', '#FFF')
          .style('stroke-opacity', 0.12)
          .style('fill', 'none');

        // Draw the individual hexbins with non-zero points.
        const graph = svg.append('g')
          .selectAll('path')
          .data(bins).enter();
        graph.append('path')
          .attr('transform', b => `translate(${b.x}, ${b.y})`)
          .attr('fill', b => color(b.length))
          .attr('d', hexbin.hexagon())
          .on('mouseover', showTooltip)
          .on('mousemove', moveTooltip)
          .on('mouseout', hideTooltip);
      };
    }
  ]
}));
