// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for code normalization. Used by the code REPL
 * and pencil code interactions.
 */

oppia.factory('CodeNormalizerService', [function() {
  var removeLeadingWhitespace = function(str) {
    return str.replace(/^\s+/g, '');
  };
  var removeTrailingWhitespace = function(str) {
    return str.replace(/\s+$/g, '');
  };
  var removeIntermediateWhitespace = function(str) {
    return str.replace(/\s+/g, ' ');
  };
  return {
    getNormalizedCode: function(codeString) {
      /*
       * Normalizes a code string (which is assumed not to contain tab
       * characters). In particular:
       *
       * - Strips out lines that start with '#' (comments), possibly preceded by
       *     whitespace.
       * - Trims trailing whitespace on each line, and normalizes multiple
       *     whitespace characters within a single line into one space
       *     character.
       * - Removes blank newlines.
       * - Make the indentation level four spaces.
       */
      // TODO(sll): Augment this function to strip out comments that occur at
      // the end of a line. However, be careful with lines where '#' is
      // contained in quotes or the character is escaped.
      var FOUR_SPACES = '    ';
      // Maps the number of spaces at the beginning of a line to an int
      // specifying the desired indentation level.
      var numSpacesToDesiredIndentLevel = {
        0: 0
      };

      var codeLines = removeTrailingWhitespace(codeString).split('\n');
      var normalizedCodeLines = [];
      codeLines.forEach(function(line) {
        if (removeLeadingWhitespace(line).indexOf('#') === 0) {
          return;
        }
        line = removeTrailingWhitespace(line);
        if (!line) {
          return;
        }

        var numSpaces = line.length - removeLeadingWhitespace(line).length;

        var existingNumSpaces = Object.keys(numSpacesToDesiredIndentLevel);
        var maxNumSpaces = Math.max.apply(null, existingNumSpaces);
        if (numSpaces > maxNumSpaces) {
          // Add a new indentation level
          numSpacesToDesiredIndentLevel[numSpaces] = existingNumSpaces.length;
        }

        // This is set when the indentation level of the current line does not
        // start a new scope, and also does not match any previous indentation
        // level. This case is actually invalid, but for now, we take the
        // largest indentation level that is less than this one.
        // TODO(sll): Bad indentation should result in an error nearer the
        // source.
        var isShortfallLine =
          !numSpacesToDesiredIndentLevel.hasOwnProperty(numSpaces) &&
          numSpaces < maxNumSpaces;

        // Clear all existing indentation levels to the right of this one.
        for (var indentLength in numSpacesToDesiredIndentLevel) {
          if (Number(indentLength) > numSpaces) {
            delete numSpacesToDesiredIndentLevel[indentLength];
          }
        }

        if (isShortfallLine) {
          existingNumSpaces = Object.keys(numSpacesToDesiredIndentLevel);
          numSpaces = Math.max.apply(null, existingNumSpaces);
        }

        var normalizedLine = '';
        for (var i = 0; i < numSpacesToDesiredIndentLevel[numSpaces]; i++) {
          normalizedLine += FOUR_SPACES;
        }
        normalizedLine += removeIntermediateWhitespace(
          removeLeadingWhitespace(line));
        normalizedCodeLines.push(normalizedLine);
      });
      return normalizedCodeLines.join('\n');
    }
  };
}]);
