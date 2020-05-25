// Copyright 2019 The Oppia Authors. All Rights Reserved.
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


angular.module('oppia').factory('LiterallyCanvasHelperService', [
  function() {
    const getPoints = (x, y, angle, width, length) => [
      {
        x: x + (Math.cos(angle + Math.PI / 2) * width) / 2,
        y: y + (Math.sin(angle + Math.PI / 2) * width) / 2,
      },
      {
        x: x + Math.cos(angle) * length,
        y: y + Math.sin(angle) * length,
      },
      {
        x: x + (Math.cos(angle - Math.PI / 2) * width) / 2,
        y: y + (Math.sin(angle - Math.PI / 2) * width) / 2,
      },
    ];
    const arrow = {
      svg(x, y, angle, width, color, position, length = null) {
        if (length === null) {
          length = 0;
        }
        length = length || width;
        const points = getPoints(x, y, angle, width, length);

        return ('<polygon id="' + position + '" fill="' + color + '" ' +
        'stroke="none" points="' + (points.map(function(p) {
          return p.x + ',' + p.y;
        }).join(' ')) + '" />');
      }
    };
    return {
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
        return ('<rect id="' + id + '" x="' + x + '" y="' + y + '" width="' +
        width + '" height="' + height + '" stroke="' + shape.strokeColor +
        '" fill="' + shape.fillColor + '" stroke-width="' + shape.strokeWidth +
        '" />');
      },

      ellipseSVGRenderer: function(shape) {
        // This function converts a ellipse shape object to the ellipse tag.
        var centerX, centerY, halfHeight, halfWidth, id;
        halfWidth = Math.floor(shape.width / 2);
        halfHeight = Math.floor(shape.height / 2);
        centerX = shape.x + halfWidth;
        centerY = shape.y + halfHeight;
        id = 'ellipse-' + shape.id;
        return ('<ellipse id="' + id + '" cx="' + centerX + '" cy="' +
        centerY + '" rx="' + (Math.abs(halfWidth)) + '" ry="' +
        (Math.abs(halfHeight)) + '" stroke="' + shape.strokeColor +
        '" fill="' + shape.fillColor + '" stroke-width="' + shape.strokeWidth +
        '" />');
      },

      lineSVGRenderer: function(shape) {
        // This function converts a line shape object to the line tag.
        var arrowWidth, capString, dashString, x1, x2, y1, y2, id;
        dashString = shape.dash ? ('stroke-dasharray="' +
        (shape.dash.join(', ')) + '"') : '';
        capString = '';
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
        if (shape.endCapShapes[0]) {
          capString += arrow.svg(
            x1, y1, Math.atan2(y1 - y2, x1 - x2),
            arrowWidth, shape.color, 'position0');
        }
        if (shape.endCapShapes[1]) {
          capString += arrow.svg(
            x2, y2, Math.atan2(y2 - y1, x2 - x1),
            arrowWidth, shape.color, 'position1');
        }
        id = 'line-' + shape.id;
        return ('<g id="' + id + '" > <line x1="' + x1 + '" y1="' + y1 +
        '" x2="' + x2 + '" y2="' + y2 + '" ' + dashString +
        ' stroke-linecap="' + shape.capStyle + '" stroke="' + shape.color +
        '" stroke-width="' + shape.strokeWidth + '" /> ' +
        capString + ' </g>');
      },

      linepathSVGRenderer: function(shape) {
        // This function converts a linepath shape object to the polyline tag.
        var id = 'linepath-' + shape.id;
        return ('<polyline id="' + id + '" fill="none" points="' +
        (shape.smoothedPoints.map(function(p) {
          var offset;
          offset = p.size % 2 === 0 ? 0.0 : 0.5;
          return (p.x + offset) + ',' + (p.y + offset);
        }).join(' ')) + '" stroke="' + shape.points[0].color +
        '" stroke-linecap="round" stroke-width="' + shape.points[0].size +
        '" />');
      },

      polygonSVGRenderer: function(shape) {
        // This function converts a polygon shape object to the polygon tag.
        if (shape.isClosed) {
          var id = 'polygon-closed-' + shape.id;
          return ('<polygon id="' + id + '" fill="' + shape.fillColor +
          '" points="' + (shape.points.map(function(p) {
            var offset;
            offset = p.size % 2 === 0 ? 0.0 : 0.5;
            return (p.x + offset) + ',' + (p.y + offset);
          }).join(' ')) + '" stroke="' + shape.strokeColor +
          '" stroke-width="' + shape.strokeWidth + '" />');
        } else {
          var id = 'polygon-open-' + shape.id;
          return ('<g id="' + id + '" > <polyline fill="' + shape.fillColor +
          '" points="' + (shape.points.map(function(p) {
            var offset;
            offset = p.size % 2 === 0 ? 0.0 : 0.5;
            return (p.x + offset) + ',' + (p.y + offset);
          }).join(' ')) + '" stroke="none" /> <polyline fill="none" points="' +
          (shape.points.map(function(p) {
            var offset;
            offset = p.size % 2 === 0 ? 0.0 : 0.5;
            return (p.x + offset) + ',' + (p.y + offset);
          }).join(' ')) + '" stroke="' + shape.strokeColor +
          '" stroke-width="' + shape.strokeWidth + '" /> </g>');
        }
      },

      textSVGRenderer: function(shape) {
        // This function converts a text shape object to the text tag.
        var heightString, textSplitOnLines, widthString, id;
        widthString = shape.forcedWidth ? ('width="' + shape.forcedWidth +
        'px"') : '';
        heightString = shape.forcedHeight ? ('height="' + shape.forcedHeight +
        'px"') : '';
        textSplitOnLines = shape.text.split(/\r\n|\r|\n/g);
        if (shape.renderer) {
          textSplitOnLines = shape.renderer.lines;
        }
        id = 'text-' + shape.id;
        return ('<text id="' + id + '" x="' + shape.x + '" y="' + shape.y +
        '" ' + widthString + ' ' + heightString + ' fill="' + shape.color +
        '" style="font: ' + shape.font + ';"> ' +
        (textSplitOnLines.map((function(_this) {
          return function(line, i) {
            var dy;
            dy = i === 0 ? 0 : '1.2em';
            return ('<tspan x="' + shape.x + '" dy="' + dy +
            '" alignment-baseline="text-before-edge"> ' + line + ' </tspan>');
          };
        })(this)).join(' ')) + ' </text>');
      }
    };
  }
]);
