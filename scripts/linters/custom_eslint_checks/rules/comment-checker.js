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
    const allowedTerminatingPunctuations = [
      '.', '?', ';', ',', '{', '^', ')', '}', '>'];
    const allowedStartPhrases = [
      '@ts-expect-error', '@ts-ignore', '--params', 'eslint-disable',
      'eslint-enable'];
    const allowedEndPhrases = ['http://', 'https://'];

    var raiseLintError = function(comment) {
      context.report({
        comment,
        loc: comment.loc,
        messageId: 'invalidPunctuation'
      });
    };

    var checkComment = function(comment) {
      var splittedComment = comment.value.split(' ');
      var allowedStartPhrasePresent = false;
      allowedStartPhrases.forEach((phrase) => {
        if (splittedComment[1].startsWith(phrase)) {
          allowedStartPhrasePresent = true;
        }
      });
      if (allowedStartPhrasePresent) {
        return true;
      }

      var allowedEndPhrasePresent = false;
      allowedEndPhrases.forEach((phrase) => {
        if (splittedComment[splittedComment.length - 1].includes(phrase)) {
          allowedEndPhrasePresent = true;
        }
      });
      if (allowedEndPhrasePresent) {
        return true;
      }

      var lastWord = splittedComment[splittedComment.length - 1];
      var lastCharIsInvalid = !(allowedTerminatingPunctuations.includes(
        lastWord[lastWord.length - 1]));

      if (lastCharIsInvalid) {
        raiseLintError(comment);
      }
    };

    var checkSingleLineComments = function(comments) {
      for (var i = 0; i < comments.length - 1; i++) {
        var currentComment = comments[i];
        var nextComment = comments[i + 1];
        if (currentComment.loc.start.line + 1 !== nextComment.loc.start.line) {
          checkComment(currentComment);
        }
      }
      var lastComment = comments[comments.length - 1];
      checkComment(lastComment);
    };

    var checkSingleLineBlockComments = function(comments) {
      for (var i = 0; i < comments.length; i++) {
        var comment = comments[i];
        var splittedComment = comment.value.split(' ');

        var allowedStartPhrasePresent = false;
        allowedStartPhrases.forEach((phrase) => {
          if (splittedComment[1].startsWith(phrase)) {
            allowedStartPhrasePresent = true;
          }
        });
        if (allowedStartPhrasePresent) {
          return true;
        }

        var allowedEndPhrasePresent = false;
        allowedEndPhrases.forEach((phrase) => {
          if (splittedComment[splittedComment.length - 2].includes(phrase)) {
            allowedEndPhrasePresent = true;
          }
        });
        if (allowedEndPhrasePresent) {
          return true;
        }

        var lastWord = splittedComment[splittedComment.length - 2];
        var lastCharIsInvalid = !(allowedTerminatingPunctuations.includes(
          lastWord[lastWord.length - 1]));

        if (lastCharIsInvalid) {
          raiseLintError(comment);
        }
      }
    };

    var checkMultiLineBlockComments = function(comments) {
      for (var i = 0; i < comments.length; i++) {
        var comment = comments[i];
        var splittedComment = comment.value.split(' ');

        var allowedEndPhrasePresent = false;
        allowedEndPhrases.forEach((phrase) => {
          if (splittedComment[splittedComment.length - 2].includes(phrase)) {
            allowedEndPhrasePresent = true;
          }
        });
        if (allowedEndPhrasePresent) {
          return true;
        }

        var lastWord = splittedComment[splittedComment.length - 2];
        var lastCharIsInvalid = !(allowedTerminatingPunctuations.includes(
          lastWord[lastWord.length - 2]));

        if (lastCharIsInvalid) {
          raiseLintError(comment);
        }
      }
    };

    var checkBlockComments = function(comments) {
      var singleLineComments = [];
      var multiLineComments = [];
      for (var i = 0; i < comments.length; i++) {
        var comment = comments[i];
        if (comment.loc.start.line === comment.loc.end.line) {
          singleLineComments.push(comment);
        } else {
          multiLineComments.push(comment);
        }
      }
      checkSingleLineBlockComments(singleLineComments);
      checkMultiLineBlockComments(multiLineComments);
    };

    return {
      Program() {
        var lineComments = [];
        var blockComments = [];
        const commentTokens = sourceCode.getAllComments();
        commentTokens.forEach((token) => {
          if (token.type === 'Block') {
            blockComments.push(token);
          } else if (token.type === 'Line') {
            lineComments.push(token);
          } else {
            return true;
          }
        });
        checkSingleLineComments(lineComments);
        checkBlockComments(blockComments);
      }
    };
  }
};
