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
        '$attrs', '$scope', 'AssetsBackendApiService', 'ContextService',
        'HtmlEscaperService', 'ImagePreloaderService',
        function(
            $attrs, $scope, AssetsBackendApiService, ContextService,
            HtmlEscaperService, ImagePreloaderService) {
          var ctrl = this;
          const data = HtmlEscaperService.escapedJsonToObj(
            $attrs.escapedData);
          const options = HtmlEscaperService.escapedJsonToObj(
            $attrs.escapedOptions);
          const imageAndRegions = HtmlEscaperService.escapedJsonToObj(
            $attrs.imageAndRegionsWithValue);

          const imageUrl = AssetsBackendApiService.getImageUrlForPreview(
            ContextService.getEntityType(), ContextService.getEntityId(),
            imageAndRegions.imagePath);
          const imageDimensions = ImagePreloaderService.getDimensionsOfImage(
            imageAndRegions.imagePath);

          ctrl.$onInit = function() {
            const hexbin = d3Hexbin.hexbin()
              .x(d => d.answer.clickPosition[0])
              .y(d => d.answer.clickPosition[1]);
            const bins = hexbin(data);
            const svg = d3.create('svg').attr(
              'viewBox',
              [0, 0, imageDimensions.width, imageDimensions.height].join(' '));

            svg.append('img')
              .attr('xlink:href', imageUrl);
            svg.append('g')
                .attr('stroke', '#000')
                .attr('stroke-opacity', 0.06)
              .selectAll('path')
              .data(bins)
              .join('path')
                .attr('d', hexbin.hexagon())
                .attr('transform', d => `translate(${d.x}, ${d.y})`)
                .attr('fill', '#eee')

            $scope.chart = svg.node();
          };
        }
      ]
    };
}]);
