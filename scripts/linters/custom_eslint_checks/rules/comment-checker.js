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
 * @fileoverview Lint check to ensure that comments follow correct style.
 */

'use strict';

module.exports = {
  meta: {
    type: 'layout',
    docs: {
      description: (
        'Lint check to ensure that comments follow correct style.'),
      category: 'Stylistic Issues',
      recommended: true
    },
    fixable: null,
    schema: [],
    messages: {
      invalidPunctuation: 'Use correct punctuation at the end of comment.'
    }
  },

  create: function(context) {
    const sourceCode = context.getSourceCode();

    var checkPunctuation = function(comment) {
      const allowedTerminatingPunctuations = [
        '.', '?', ';', ',', '{', '^', ')', '}', '>'];

      // We allow comments to not have a terminating punctuation if any of the
      // below phrases appears at the beginning of the comment.
      // Example: // eslint - disable max-len
      // This comment will be excluded from this check.
      const allowedStartPhrases = [
        '@ts-expect-error', '@ts-ignore', '--params', 'eslint-disable',
        'eslint-enable'];

      // We allow comments to not have a terminating punctuation if any of the
      // below phrases appears in the last word of a comment.
      // Example: // Ref: https://some.link.com
      // This comment will be excluded from this check.
      const allowedEndPhrases = ['http://', 'https://'];

      // Check if any of the allowed starting phrase is present in
      // comment and exclude that line from check.
      var allowedStartPhrasePresent = false;
      allowedStartPhrases.forEach((phrase) => {
        if (comment.value.split(' ')[1].startsWith(phrase)) {
          allowedStartPhrasePresent = true;
        }
      });

      if (allowedStartPhrasePresent) {
        return true;
      }

      // Check if any of the allowed ending phrase is present
      // in comment and exclude that line from check. Used 'includes'
      // instead of 'startsWith' because we have some comments
      // with urls inside the quotes.
      // Example: 'https://oppia.org'
      var allowedEndPhrasePresent = false;
      allowedEndPhrases.forEach((phrase) => {
        var splittedComment = comment.value.split(' ');
        if (splittedComment[splittedComment.length - 1].includes(phrase)) {
          allowedEndPhrasePresent = true;
        }
      });

      if (allowedEndPhrasePresent) {
        return true;
      }

      // Check that the comments end with the proper punctuation.
      if (comment.type === 'Block') {
        var lastCharIsInvalid = !(allowedTerminatingPunctuations.includes(
          comment.value[comment.value.length - 3]));
      } else {
        var lastCharIsInvalid = !(allowedTerminatingPunctuations.includes(
          comment.value[comment.value.length - 1]));
      }
      if (lastCharIsInvalid) {
        context.report({
          comment,
          loc: comment.loc,
          messageId: 'invalidPunctuation'
        });
      }
    };

    return {
      Program() {
        var comments = [];
        const commentTokens = sourceCode.getAllComments();
        commentTokens.forEach((token) => {
          if (token.type !== 'Shebang') {
            comments.push(token);
          }
        });

        for (var i = 1; i < comments.length - 1; i++) {
          var prevComment = comments[i - 1];
          var comment = comments[i];
          var nextComment = comments[i + 1];

          if (comment.value.endsWith('-') &&
            !(nextComment.loc.start.line - 1 === comment.loc.start.line &&
              prevComment.loc.start.line + 1 === comment.loc.start.line)) {
            return true;
          }

          if (comment.loc.start.line + 1 !== nextComment.loc.start.line) {
            checkPunctuation(comment);
          }
        }
        checkPunctuation(comments[comments.length - 1]);
      }
    };
  }
};
