// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Lint check to disallow ViewEncapsulation.None unless it has an
 * allowlist entry or an explanatory comment.
 */

'use strict';

var path = require('path');

var allowlistPath = path.resolve(
  __dirname,
  '..',
  '..',
  'view_encapsulation_none_allowlist.js'
);
var allowlistedFilepaths = require(allowlistPath);
var commentPattern = /^We need ViewEncapsulation\.None because .+/;

var getRelativeFilename = function (filename) {
  return path.relative(process.cwd(), filename).replace(/\\/g, '/');
};

var getNormalizedComment = function (comment) {
  return comment.value
    .split('\n')
    .map(line => line.replace(/^\s*\*?\s?/, '').trim())
    .join(' ')
    .trim();
};

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Lint check to disallow ViewEncapsulation.None without an allowlist ' +
        'entry or explanatory comment.',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      disallowViewEncapsulationNone:
        'Avoid ViewEncapsulation.None. Add the file to the legacy allowlist ' +
        'or add a comment immediately above this usage in the format ' +
        '"We need ViewEncapsulation.None because ...".',
    },
  },

  create: function (context) {
    var sourceCode = context.getSourceCode();
    var filename = getRelativeFilename(context.getFilename());

    var isAllowlistedFile = function () {
      return allowlistedFilepaths.includes(filename);
    };

    var hasValidExplanationComment = function (node) {
      var commentsBeforeNode = sourceCode.getCommentsBefore(node.parent);
      if (commentsBeforeNode.length === 0) {
        return false;
      }

      var nearestComment = commentsBeforeNode[commentsBeforeNode.length - 1];
      if (nearestComment.loc.end.line !== node.loc.start.line - 1) {
        return false;
      }

      return commentPattern.test(getNormalizedComment(nearestComment));
    };

    return {
      'Property[key.name="encapsulation"] > MemberExpression': function (node) {
        if (
          node.object.type !== 'Identifier' ||
          node.object.name !== 'ViewEncapsulation' ||
          node.property.type !== 'Identifier' ||
          node.property.name !== 'None'
        ) {
          return;
        }

        if (isAllowlistedFile() || hasValidExplanationComment(node)) {
          return;
        }

        context.report({
          node: node.property,
          messageId: 'disallowViewEncapsulationNone',
        });
      },
    };
  },
};
