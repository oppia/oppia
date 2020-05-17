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

/**
 * @fileoverview Visualization for click statistics providing a hexbin-heatmap.
 */

angular.module('oppia').directive('oppiaVisualizationClickHexbins', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/visualizations/oppia-visualization-click-hexbins.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$attrs', '$element', 'AssetsBackendApiService', 'ContextService',
        'HtmlEscaperService', 'ImagePreloaderService',
        function(
            $attrs, $element, AssetsBackendApiService, ContextService,
            HtmlEscaperService, ImagePreloaderService) {
          var ctrl = this;
          const data = HtmlEscaperService.escapedJsonToObj(
            $attrs.escapedData);
          const options = HtmlEscaperService.escapedJsonToObj(
            $attrs.escapedOptions);
          const imageAndRegions = HtmlEscaperService.escapedJsonToObj(
            $attrs.imageAndRegionsWithValue);

          const showTooltip = datum => {
            if (datum.length === 0) {
              return;
            }
            d3.select('#click-hexbin-chart-tooltip')
              .style('visibility', 'visible')
              .style('left', `${datum.x}px`)
              .style('top', `${datum.y + 16}px`)
              .text(`${datum.length} click${datum.length > 1 ? 's' : ''}`);
          };

          const moveTooltip = datum => {
            if (datum.length === 0) {
              return;
            }
            d3.select('#click-hexbin-chart-tooltip')
              .style('visibility', 'visible');
          };

          const hideTooltip = datum => {
            d3.select('#click-hexbin-chart-tooltip')
              .style('visibility', 'hidden');
          };

          const imageUrl = AssetsBackendApiService.getImageUrlForPreview(
            ContextService.getEntityType(), ContextService.getEntityId(),
            imageAndRegions.imagePath);
          const imageDimensions = ImagePreloaderService.getDimensionsOfImage(
            imageAndRegions.imagePath);

          const containerWidth = $('#click-hexbin-chart').width();

          const widthScale = imageDimensions.width / containerWidth;
          const heightScale = imageDimensions.height / imageDimensions.width;

          const containerHeight = Math.round(containerWidth * heightScale);

          ctrl.$onInit = function() {
            d3.select('#click-hexbin-chart-tooltip')
              .style('visibility', 'hidden');

            // Define the data for the hexbins.
            const hexbin = d3Hexbin.hexbin()
              .x(d => (d.answer.clickPosition[0] * containerWidth))
              .y(d => (d.answer.clickPosition[1] * containerHeight))
              .radius(16)
              .size([containerWidth, containerHeight]);
            const bins = hexbin(data);

            // Define the color of hexbins, using the number of grouped clicks
            // to change their opacity.
            const color = d3.scaleLinear()
              .domain([0, d3.max(bins, d => d.length)])
              .range(['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.65)']);

            // Construct and add the SVG element for holding the hexbin graph.
            const svg =
              d3.select('#click-hexbin-chart').append('svg')
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

            // Draw the mesh of hexagons to help distinguish groups of hexbins.
            const clipPath = svg.append('clipPath');
            clipPath.attr('id', 'clip');
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

            // Draw each individual hexbin with non-zero points.
            const graph = svg.append('g')
              .selectAll('path')
              .data(bins).enter();
            graph.append('path')
              .attr('transform', d => `translate(${d.x}, ${d.y})`)
              .attr('fill', d => color(d.length))
              .attr('d', hexbin.hexagon())
              .on('mouseover', showTooltip)
              .on('mousemove', moveTooltip)
              .on('mouseout', hideTooltip);
          };
        }
      ]
    };
}]);
