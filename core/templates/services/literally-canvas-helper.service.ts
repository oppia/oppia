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
 * @fileoverview LiterallyCanvas editor helper service.
 */

// TODO(#9186): Change variable name to 'constants' once this file
// is migrated to Angular.
const CONSTANTS = require('constants.ts');

angular.module('oppia').factory('LiterallyCanvasHelperService', [
  function() {
    const getPoints = (x, y, angle, width) => [
      {
        x: x + (Math.cos(angle + Math.PI / 2) * width) / 2,
        y: y + (Math.sin(angle + Math.PI / 2) * width) / 2,
      },
      {
        x: x + Math.cos(angle) * width,
        y: y + Math.sin(angle) * width,
      },
      {
        x: x + (Math.cos(angle - Math.PI / 2) * width) / 2,
        y: y + (Math.sin(angle - Math.PI / 2) * width) / 2,
      },
    ];

    const arrow = {
      svg(x, y, angle, width, color, position) {
        const points = getPoints(x, y, angle, width);

        var polygon = document.createElement('polygon');
        var pointsString = points.map(function(p) {
          return p.x + ',' + p.y;
        }).join(' ');
        var attributes = {
          id: position,
          stroke: 'node',
          fill: color,
          points: pointsString
        };
        for (var attrName in attributes) {
          polygon.setAttribute(attrName, attributes[attrName]);
        }
        return polygon;
      }
    };

    return {
      isSVGTagValid: function(svgString) {
        var domParser = new DOMParser();
        var doc = domParser.parseFromString(svgString, 'image/svg+xml');
        var allowedTags = Object.keys(CONSTANTS.SVG_ATTRS_WHITELIST);
        var nodeTagName = null;
        var valid = true;
        doc.querySelectorAll('*').forEach((node) => {
          nodeTagName = node.tagName.toLowerCase();
          if (allowedTags.indexOf(nodeTagName) !== -1) {
            for (var i = 0; i < node.attributes.length; i++) {
              if (CONSTANTS.SVG_ATTRS_WHITELIST[nodeTagName].indexOf(
                node.attributes[i].name.toLowerCase()) === -1) {
                valid = false;
              }
            }
          } else {
            valid = false;
          }
        });
        if (!valid) {
          throw new Error('Invalid tag or attribute in svg.');
        }
        return valid;
      },
      rectangleSVGRenderer: function(shape) {
        // This function converts a rectangle shape object to the rect tag.
        var height, width, x, x1, x2, y, y1, y2, id;
        x1 = shape.x;
        y1 = shape.y;
        x2 = shape.x + shape.width;
        y2 = shape.y + shape.height;
        x = Math.min(x1, x2);
        y = Math.min(y1, y2);
        width = Math.max(x1, x2) - x;
        height = Math.max(y1, y2) - y;
        if (shape.strokeWidth % 2 !== 0) {
          x += 0.5;
          y += 0.5;
        }
        id = 'rectangle-' + shape.id;
        var rect = document.createElement('rect');
        var attributes = {
          id: id,
          x: x,
          y: y,
          width: width,
          height: height,
          stroke: shape.strokeColor,
          fill: shape.fillColor,
        };
        for (var attrName in attributes) {
          rect.setAttribute(attrName, attributes[attrName]);
        }
        rect.setAttribute('stroke-width', shape.strokeWidth);
        var rectTag = rect.outerHTML;
        if (this.isSVGTagValid(rectTag)) {
          return rectTag;
        }
      },

      ellipseSVGRenderer: function(shape) {
        // This function converts a ellipse shape object to the ellipse tag.
        var centerX, centerY, halfHeight, halfWidth, id;
        halfWidth = Math.floor(shape.width / 2);
        halfHeight = Math.floor(shape.height / 2);
        centerX = shape.x + halfWidth;
        centerY = shape.y + halfHeight;
        id = 'ellipse-' + shape.id;
        var ellipse = document.createElement('ellipse');
        var attributes = {
          id: id,
          cx: centerX,
          cy: centerY,
          rx: Math.abs(halfWidth),
          ry: Math.abs(halfHeight),
          stroke: shape.strokeColor,
          fill: shape.fillColor,
        };
        for (var attrName in attributes) {
          ellipse.setAttribute(attrName, attributes[attrName]);
        }
        ellipse.setAttribute('stroke-width', shape.strokeWidth);
        var ellipseTag = ellipse.outerHTML;
        if (this.isSVGTagValid(ellipseTag)) {
          return ellipseTag;
        }
      },

      lineSVGRenderer: function(shape) {
        // This function converts a line shape object to the line tag.
        var arrowWidth, x1, x2, y1, y2, id;
        arrowWidth = Math.max(shape.strokeWidth * 2.2, 5);
        x1 = shape.x1;
        x2 = shape.x2;
        y1 = shape.y1;
        y2 = shape.y2;
        if (shape.strokeWidth % 2 !== 0) {
          x1 += 0.5;
          x2 += 0.5;
          y1 += 0.5;
          y2 += 0.5;
        }
        id = 'line-' + shape.id;
        var g = document.createElement('g');
        g.setAttribute('id', id);
        var line = document.createElement('line');
        var attributes = {
          x1: x1,
          y1: y1,
          x2: x2,
          y2: y2,
          stroke: shape.color,
          fill: shape.fillColor,
        };
        for (var attrName in attributes) {
          line.setAttribute(attrName, attributes[attrName]);
        }
        line.setAttribute('stroke-width', shape.strokeWidth);
        line.setAttribute('stroke-linecap', shape.capStyle);
        if (shape.dash) {
          line.setAttribute('stroke-dasharray', shape.dash.join(', '));
        }
        g.appendChild(line);
        if (shape.endCapShapes[0]) {
          g.appendChild(
            arrow.svg(
              x1, y1, Math.atan2(y1 - y2, x1 - x2),
              arrowWidth, shape.color, 'position0'));
        }
        if (shape.endCapShapes[1]) {
          g.appendChild(
            arrow.svg(
              x2, y2, Math.atan2(y2 - y1, x2 - x1),
              arrowWidth, shape.color, 'position1'));
        }
        var gTag = g.outerHTML;
        if (this.isSVGTagValid(gTag)) {
          return gTag;
        }
      },

      linepathSVGRenderer: function(shape) {
        // This function converts a linepath shape object to the polyline tag.
        var id = 'linepath-' + shape.id;
        var linepath = document.createElement('polyline');
        var pointsString = shape.smoothedPoints.map(function(p) {
          var offset;
          offset = p.size % 2 === 0 ? 0.0 : 0.5;
          return (p.x + offset) + ',' + (p.y + offset);
        }).join(' ');
        var attributes = {
          id: id,
          fill: 'none',
          points: pointsString,
          stroke: shape.points[0].color
        };
        for (var attrName in attributes) {
          linepath.setAttribute(attrName, attributes[attrName]);
        }
        linepath.setAttribute('stroke-linecap', 'round');
        linepath.setAttribute('stroke-width', shape.points[0].size);
        var linepathTag = linepath.outerHTML;
        if (this.isSVGTagValid(linepathTag)) {
          return linepathTag;
        }
      },

      polygonSVGRenderer: function(shape) {
        // This function converts a polygon shape object to the polygon tag.
        if (shape.isClosed) {
          var id = 'polygon-closed-' + shape.id;
          var polygon = document.createElement('polygon');
          var pointsString = shape.points.map(function(p) {
            var offset;
            offset = p.size % 2 === 0 ? 0.0 : 0.5;
            return (p.x + offset) + ',' + (p.y + offset);
          }).join(' ');
          var attributes = {
            id: id,
            fill: shape.fillColor,
            points: pointsString,
            stroke: shape.strokeColor,
          };
          for (var attrName in attributes) {
            polygon.setAttribute(attrName, attributes[attrName]);
          }
          polygon.setAttribute('stroke-width', shape.strokeWidth);
          var polygonTag = polygon.outerHTML;
          if (this.isSVGTagValid(polygonTag)) {
            return polygonTag;
          }
        } else {
          var id = 'polygon-open-' + shape.id;
          var g = document.createElement('g');
          g.setAttribute('id', id);
          var polyline1 = document.createElement('polyline');
          var polyline2 = document.createElement('polyline');
          var pointsString = shape.points.map(function(p) {
            var offset;
            offset = p.size % 2 === 0 ? 0.0 : 0.5;
            return (p.x + offset) + ',' + (p.y + offset);
          }).join(' ');
          var attributes1 = {
            fill: shape.fillColor,
            points: pointsString,
            stroke: 'none'
          };
          var attributes2 = {
            fill: 'none',
            points: pointsString,
            stroke: shape.strokeColor,
          };
          for (var attrName in attributes1) {
            polyline1.setAttribute(attrName, attributes1[attrName]);
          }
          for (var attrName in attributes2) {
            polyline2.setAttribute(attrName, attributes2[attrName]);
          }
          polyline2.setAttribute('stroke-width', shape.strokeWidth);
          g.appendChild(polyline1);
          g.appendChild(polyline2);
          var gTag = g.outerHTML;
          if (this.isSVGTagValid(gTag)) {
            return gTag;
          }
        }
      },

      textSVGRenderer: function(shape) {
        // This function converts a text shape object to the text tag.
        var textSplitOnLines, id;
        textSplitOnLines = shape.text.split(/\r\n|\r|\n/g);
        if (shape.renderer) {
          textSplitOnLines = shape.renderer.lines;
        }
        id = 'text-' + shape.id;
        var text = document.createElement('text');
        var attributes = {
          id: id,
          x: shape.x,
          y: shape.y,
          fill: shape.color
        };
        for (var attrName in attributes) {
          text.setAttribute(attrName, attributes[attrName]);
        }
        text.style.font = shape.font;
        for (var i = 0; i < textSplitOnLines.length; i++) {
          var tspan = document.createElement('tspan');
          var dy = i === 0 ? '0' : '1.2em';
          tspan.setAttribute('x', shape.x);
          tspan.setAttribute('dy', dy);
          tspan.setAttribute('alignment-baseline', 'text-before-edge');
          tspan.textContent = textSplitOnLines[i];
          text.appendChild(tspan);
        }
        var textTag = text.outerHTML;
        if (this.isSVGTagValid(textTag)) {
          return textTag;
        }
      }
    };
  }
]);
