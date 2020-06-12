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
  'ImageUploadHelperService', function(ImageUploadHelperService) {
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

    var _isSvgTagValid = function(svgString) {
      // This function validates an svg tag.
      var dataURI = 'data:image/svg+xml;base64,' + btoa(svgString);
      var invalidTagsAndAttr = (
        ImageUploadHelperService.getInvalidSvgTagsAndAttrs(dataURI));
      if (invalidTagsAndAttr.tags.length !== 0) {
        var errorText = (
          'Invalid tags in svg:' + invalidTagsAndAttr.tags.join());
        throw new Error(errorText);
      } else if (invalidTagsAndAttr.attrs.length !== 0) {
        var errorText = (
          'Invalid attributes in svg:' + invalidTagsAndAttr.attrs.join());
        throw new Error(errorText);
      }
      return true;
    };

    var convertSvgToShapeObject = function(node) {
      // This function converts an svg tag into an object.
      var id = node.attributes.id.value.split('-');
      var shape = {
        className: '',
        data: {
          x: null,
          y: null,
          x1: null,
          y1: null,
          x2: null,
          y2: null,
          color: null,
          width: null,
          height: null,
          strokeWidth: null,
          strokeColor: null,
          fillColor: null,
          capString: null,
          dash: null,
          endCapShapes: null,
          order: null,
          tailSize: null,
          pointCoordinatePairs: null,
          smoothedPointCoordinatePairs: null,
          pointSize: null,
          pointColor: null,
          smooth: null,
          isClosed: null,
          text: null,
          font: null,
          forcedWidth: null,
          forcedHeight: null
        },
        id: ''
      };
      if (id[0] === 'ellipse') {
        shape.className = 'Ellipse';
        shape.data.x = node.attributes.cx.value - node.attributes.rx.value;
        shape.data.y = node.attributes.cy.value - node.attributes.ry.value;
        shape.data.width = 2 * node.attributes.rx.value;
        shape.data.height = 2 * node.attributes.ry.value;
        shape.data.strokeWidth = parseInt(
          node.attributes['stroke-width'].value);
        shape.data.strokeColor = node.attributes.stroke.value;
        shape.data.fillColor = node.attributes.fill.value;
        shape.id = id.slice(1).join('-');
      } else if (id[0] === 'rectangle') {
        shape.className = 'Rectangle';
        var strokeWidth = node.attributes['stroke-width'].value;
        var shift = strokeWidth % 2 !== 0 ? 0.5 : 0;
        shape.data.x = node.attributes.x.value - shift;
        shape.data.y = node.attributes.y.value - shift;
        shape.data.width = parseInt(node.attributes.width.value);
        shape.data.height = parseInt(node.attributes.height.value);
        shape.data.strokeWidth = parseInt(strokeWidth);
        shape.data.strokeColor = node.attributes.stroke.value;
        shape.data.fillColor = node.attributes.fill.value;
        shape.id = id.slice(1).join('-');
      } else if (id[0] === 'line') {
        shape.className = 'Line';
        var innerTags = node.querySelectorAll('*');
        var lineTag = innerTags[0];
        var strokeWidth = lineTag.attributes['stroke-width'].value;
        var shift = strokeWidth % 2 !== 0 ? 0.5 : 0;
        shape.data.x1 = lineTag.attributes.x1.value - shift;
        shape.data.y1 = lineTag.attributes.y1.value - shift;
        shape.data.x2 = lineTag.attributes.x2.value - shift;
        shape.data.y2 = lineTag.attributes.y2.value - shift;
        shape.data.strokeWidth = parseInt(strokeWidth);
        shape.data.color = lineTag.attributes.stroke.value;
        shape.data.capString = lineTag.attributes['stroke-linecap'].value;
        shape.data.dash = null;
        shape.id = id.slice(1).join('-');
        if (lineTag.attributes['stroke-dasharray'] !== undefined) {
          var dash = lineTag.attributes['stroke-dasharray'].value;
          shape.data.dash = dash.split(', ').map(a => parseInt(a));
        }
        shape.data.endCapShapes = [null, null];
        if (innerTags.length > 1) {
          for (var i = 1; i < innerTags.length; i++) {
            var position = innerTags[i].attributes.id.value.slice(-1);
            var endCapShapeIndex = (position === '0') ? 0 : 1;
            shape.data.endCapShapes[endCapShapeIndex] = 'arrow';
          }
        }
      } else if (id[0] === 'linepath') {
        shape.className = 'LinePath';
        shape.data.order = 3;
        shape.data.tailSize = 3;
        shape.data.smooth = true;
        var smoothedPoints = node.attributes.points.value.split(' ').map(
          a => a.split(',').map(b => parseFloat(b)));
        var points = [];
        for (var i = 0; i < smoothedPoints.length; i += 8) {
          points.push(smoothedPoints[i]);
        }
        shape.data.pointCoordinatePairs = points;
        shape.data.smoothedPointCoordinatePairs = smoothedPoints;
        shape.data.pointSize = parseInt(node.attributes['stroke-width'].value);
        shape.data.pointColor = node.attributes.stroke.value;
        shape.id = id.slice(1).join('-');
      } else if (id[0] === 'polygon') {
        shape.className = 'Polygon';
        if (id[1] === 'closed') {
          var strokeWidth = node.attributes['stroke-width'].value;
          shape.data.strokeWidth = parseInt(strokeWidth);
          shape.data.fillColor = node.attributes.fill.value;
          shape.data.strokeColor = node.attributes.stroke.value;
          shape.data.dash = null;
          if (node.attributes['stroke-dasharray'] !== undefined) {
            var dash = node.attributes['stroke-dasharray'].value;
            shape.data.dash = dash.split(', ').map(a => parseInt(a));
          }
          shape.data.isClosed = true;
          var shift = strokeWidth % 2 !== 0 ? 0.5 : 0;
          shape.data.pointCoordinatePairs = (
            node.attributes.points.value.split(' ').map(
              a => a.split(',').map(b => parseFloat(b) - shift)));
        } else {
          var innerPolygon = node.querySelectorAll('*')[0];
          var outerPolygon = node.querySelectorAll('*')[1];
          var strokeWidth = outerPolygon.attributes['stroke-width'].value;
          var strokeDash = outerPolygon.attributes['stroke-dasharray'];
          shape.data.strokeWidth = parseInt(strokeWidth);
          shape.data.fillColor = innerPolygon.attributes.fill.value;
          shape.data.strokeColor = outerPolygon.attributes.stroke.value;
          shape.data.dash = null;
          if (strokeDash !== undefined) {
            shape.data.dash = strokeDash.value.split(', ').map(
              a => parseInt(a));
          }
          shape.data.isClosed = false;
          var shift = strokeWidth % 2 !== 0 ? 0.5 : 0;
          shape.data.pointCoordinatePairs = (
            innerPolygon.attributes.points.value.split(' ').map(
              a => a.split(',').map(b => parseFloat(b) - shift)));
        }
        shape.id = id.slice(2).join('-');
      } else if (id[0] === 'text') {
        shape.className = 'Text';
        shape.data.x = parseFloat(node.attributes.x.value);
        shape.data.y = parseFloat(node.attributes.y.value);
        var text = '';
        node.querySelectorAll('*').forEach(a=>{
          text += a.textContent + '\n';
        });
        shape.data.text = text.slice(0, -1);
        shape.data.color = node.attributes.fill.value;
        shape.data.font = node.attributes.style.value.slice(6, -1);
        shape.data.forcedWidth = (
          node.attributes.width !== undefined ? (
            parseFloat(node.attributes.width.value)) : 0);
        shape.data.forcedHeight = (
          node.attributes.height !== undefined ? (
            parseFloat(node.attributes.height.value)) : 0);
        shape.id = id.slice(1).join('-');
      }
      return shape;
    };

    return {
      parseSvg: function(svgString, lc) {
        // This function is used to convert an svg to a snapshot object which
        // is used by literallyCanvas to load the svg into canvas.
        var domParser = new DOMParser();
        var doc = domParser.parseFromString(svgString, 'text/xml');
        var snapshot = {
          colors: {
            primary: '',
            secondary: '',
            background: ''
          },
          position: '',
          scale: 1,
          shapes: [],
          backgroundShapes: [],
          imageSize: {
            width: '',
            height: ''
          }
        };
        var rect = doc.querySelector('svg > rect');
        snapshot.colors.primary = lc.colors.primary;
        snapshot.colors.secondary = lc.colors.secondary;
        snapshot.colors.background = (
          (<CustomNamedNodeMap> rect.attributes).fill.value);
        snapshot.position = lc.position;
        snapshot.backgroundShapes = lc.backgroundShapes;
        snapshot.imageSize.width = (
          (<CustomNamedNodeMap> rect.attributes).width.value);
        snapshot.imageSize.height = (
          (<CustomNamedNodeMap> rect.attributes).height.value);

        doc.querySelectorAll('svg > g > *').forEach((node) => {
          snapshot.shapes.push(convertSvgToShapeObject(node));
        });
        return snapshot;
      },

      isSvgTagValid: _isSvgTagValid,

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
        if (_isSvgTagValid(rectTag)) {
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
        if (_isSvgTagValid(ellipseTag)) {
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
        if (_isSvgTagValid(gTag)) {
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
        if (_isSvgTagValid(linepathTag)) {
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
          if (_isSvgTagValid(polygonTag)) {
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
          if (_isSvgTagValid(gTag)) {
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
        if (_isSvgTagValid(textTag)) {
          return textTag;
        }
      }
    };
  }
]);
