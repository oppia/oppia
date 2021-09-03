// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Lint check to ensure that comments follow valid style.
 */

'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: (
        'Lint check to ensure that comments follow valid style'),
      category: 'Stylistic Issues',
      recommended: true
    },
    fixable: null,
    schema: [],
    messages: {
      invalidPunctuation: 'Invalid punctuation used at the end of the comment',
      tsIgnoreFormat: (
        'Please add a comment above the @ts-ignore explaining the @ts-ignore.' +
        ' The format of comment should be -> This throws "...".' +
        ' We need to suppress this error because ...'),
      tsExpectErrorFormat: (
        'Please add a comment above the @ts-expect-error explaining the' +
        ' @ts-expect-error. The format of comment should be ->' +
        ' This throws "...". We need to suppress this error because ...')
    }
  },

  create: function(context) {
    var allowedTerminatingPunctuations = ['.', '?', ';', ',', '{', '^', ')',
      '}', '>', '/>'];
    var allowedPhrases = [
      '@ts-expect-error', '@ts-ignore', '--params', 'eslint-disable',
      'eslint-enable', 'http://', 'https://', 'disable', '----'];

    var getGroupComments = function() {
      var sourceCode = context.getSourceCode();
      var comments = sourceCode.getAllComments();
      comments = comments.filter(token => token.type === 'Line');
      if (comments.length === 0) {
        return 0;
      }
      var commentLine = comments[0].loc.start.line;
      var groupComments = [];
      var listComments = [comments[0]];
      for (var i = 1; i < comments.length; i++) {
        if (comments[i].loc.start.line - commentLine === 1) {
          listComments.push(comments[i]);
        } else {
          groupComments.push(listComments);
          listComments = [comments[i]];
        }
        commentLine = comments[i].loc.start.line;
      }
      groupComments.push(listComments);
      return groupComments;
    };

    var checkPunctuation = function(comment) {
      var validComment = false;
      for (var i = 0; i < allowedTerminatingPunctuations.length - 1; i++) {
        if (comment.value.endsWith(allowedTerminatingPunctuations[i])) {
          validComment = true;
        }
      }
      if (!validComment) {
        context.report({
          comment: comment,
          loc: comment.loc,
          messageId: 'invalidPunctuation'
        });
      }
    };

    var checkTsIgnore = function(multiLineComment) {
      var expectedFormatRegex = (
        /^ This throws .* We need to suppress this error because .*\.$/);
      var comment = '';
      for (var i = 0; i < multiLineComment.length - 1; i++) {
        comment += multiLineComment[i].value;
      }
      if (!expectedFormatRegex.test(comment)) {
        context.report({
          comment: multiLineComment[0],
          loc: multiLineComment[0].loc,
          messageId: 'tsIgnoreFormat'
        });
      }
    };

    var checkTsExpectError = function(multiLineComment) {
      var expectedFormatRegex = (
        /^ This throws .* We need to suppress this error because .*\.$/);
      var comment = '';
      for (var i = 0; i < multiLineComment.length - 1; i++) {
        comment += multiLineComment[i].value;
      }
      if (!expectedFormatRegex.test(comment)) {
        context.report({
          comment: multiLineComment[0],
          loc: multiLineComment[0].loc,
          messageId: 'tsExpectErrorFormat'
        });
      }
    };

    var checkComment = function(multLineComment) {
      var allowedPhrasesPresent = false;
      var lastLineComment = multLineComment[multLineComment.length - 1];
      for (var i = 0; i < allowedPhrases.length; i++) {
        if (lastLineComment.value.includes(allowedPhrases[i])) {
          allowedPhrasesPresent = true;
        }
      }
      if (!allowedPhrasesPresent) {
        checkPunctuation(lastLineComment);
        return;
      }

      if (lastLineComment.value.startsWith(' @ts-ignore')) {
        checkTsIgnore(multLineComment);
      }

      if (lastLineComment.value.startsWith(' @ts-expect-error')) {
        checkTsExpectError(multLineComment);
      }
    };

    return {
      Program: function(node) {
        var groupedComments = getGroupComments();
        for (var i = 0; i < groupedComments.length; i++) {
          checkComment(groupedComments[i]);
        }
      }
    };
  }
};
