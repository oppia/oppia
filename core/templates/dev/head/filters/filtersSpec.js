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
 * @fileoverview Unit tests for custom filters.
 */

describe('Testing filters', function() {
  var filterNames = [
    'underscoresToCamelCase',
    'camelCaseToHyphens',
    'truncate',
    'truncateAtFirstLine',
    'replaceInputsWithEllipses',
    'truncateAtFirstEllipsis',
    'wrapTextWithEllipsis',
    'parameterizeRuleDescription',
    'normalizeWhitespace',
    'convertToPlainText',
    'summarizeNonnegativeNumber',
    'truncateAndCapitalize',
    'capitalize',
    'getAbbreviatedText'
  ];

  beforeEach(angular.mock.module('oppia'));

  it('should have all expected filters', inject(function($filter) {
    angular.forEach(filterNames, function(filterName) {
      expect($filter(filterName)).not.toEqual(null);
    });
  }));

  it('should convert underscores to camelCase properly', inject(
    function($filter) {
      var filter = $filter('underscoresToCamelCase');
      expect(filter('Test')).toEqual('Test');
      expect(filter('test')).toEqual('test');
      expect(filter('test_app')).toEqual('testApp');
      expect(filter('Test_App_Two')).toEqual('TestAppTwo');
      expect(filter('test_App_Two')).toEqual('testAppTwo');
      expect(filter('test_app_two')).toEqual('testAppTwo');
      expect(filter('test__App')).toEqual('testApp');
      // Trailing underscores at the beginning and end should never happen --
      // they will give weird results.
      expect(filter('_test_App')).toEqual('TestApp');
      expect(filter('__Test_ App_')).toEqual('Test App_');
    }
  ));

  it('should convert camelCase to hyphens properly', inject(function($filter) {
    var filter = $filter('camelCaseToHyphens');
    expect(filter('test')).toEqual('test');
    expect(filter('testTest')).toEqual('test-test');
    expect(filter('testTestTest')).toEqual('test-test-test');
    expect(filter('aBaBCa')).toEqual('a-ba-b-ca');
    expect(filter('AbcDefGhi')).toEqual('abc-def-ghi');
  }));

  it('should convert {{...}} tags to ...', inject(function($filter) {
    var filter = $filter('replaceInputsWithEllipses');

    expect(filter('')).toEqual('');
    expect(filter(null)).toEqual('');
    expect(filter(undefined)).toEqual('');

    expect(filter('hello')).toEqual('hello');
    expect(filter('{{hello}}')).toEqual('...');
    expect(filter('{{hello}} and {{goodbye}}')).toEqual('... and ...');
    expect(filter('{{}}{{hello}}')).toEqual('{{}}...');
  }));

  it('should truncate a string when it first sees a \'...\'', inject(
    function($filter) {
      var filter = $filter('truncateAtFirstEllipsis');

      expect(filter('')).toEqual('');
      expect(filter(null)).toEqual('');
      expect(filter(undefined)).toEqual('');

      expect(filter('hello')).toEqual('hello');
      expect(filter('...')).toEqual('');
      expect(filter('say ... and ...')).toEqual('say ');
      expect(filter('... and ...')).toEqual('');
      expect(filter('{{}}...')).toEqual('{{}}');
    }
  ));

  it('should wrap text with ellipses based on its length', inject(
    function($filter) {
      var filter = $filter('wrapTextWithEllipsis');

      expect(filter('', 0)).toEqual('');
      expect(filter(null, 0)).toEqual(null);
      expect(filter(undefined, 0)).toEqual(undefined);

      expect(filter('testing', 0)).toEqual('testing');
      expect(filter('testing', 1)).toEqual('testing');
      expect(filter('testing', 2)).toEqual('testing');
      expect(filter('testing', 3)).toEqual('...');
      expect(filter('testing', 4)).toEqual('t...');
      expect(filter('testing', 7)).toEqual('testing');
      expect(filter('Long sentence which goes on and on.', 80)).toEqual(
        'Long sentence which goes on and on.');
      expect(filter('Long sentence which goes on and on.', 20)).toEqual(
        'Long sentence whi...');
      expect(filter('Sentence     with     long     spacing.', 20)).toEqual(
        'Sentence with lon...');
      expect(filter('With space before ellipsis.', 21)).toEqual(
        'With space before...');
    }
  ));

  it('should correctly normalize whitespace', inject(function($filter) {
    var filter = $filter('normalizeWhitespace');

    expect(filter('')).toEqual('');
    expect(filter(null)).toEqual(null);
    expect(filter(undefined)).toEqual(undefined);

    expect(filter('a')).toEqual('a');
    expect(filter('a  ')).toEqual('a');
    expect(filter('  a')).toEqual('a');
    expect(filter('  a  ')).toEqual('a');

    expect(filter('a  b ')).toEqual('a b');
    expect(filter('  a  b ')).toEqual('a b');
    expect(filter('  ab c ')).toEqual('ab c');
  }));

  it('should truncate multi-line text to the first non-empty line', inject(
    function($filter) {
      var filter = $filter('truncateAtFirstLine');

      expect(filter('')).toEqual('');
      expect(filter(null)).toEqual(null);
      expect(filter(undefined)).toEqual(undefined);

      expect(filter(' A   single line with spaces at either end. ')).toEqual(
        ' A   single line with spaces at either end. ');
      expect(filter('a\nb\nc')).toEqual('a...');
      expect(filter('Removes newline at end\n')).toEqual(
        'Removes newline at end');
      expect(filter('\nRemoves newline at beginning.')).toEqual(
        'Removes newline at beginning.');

      expect(filter('\n')).toEqual('');
      expect(filter('\n\n\n')).toEqual('');

      // Windows
      expect(filter('Single line\r\nWindows EOL')).toEqual('Single line...');
      expect(filter('Single line\u000D\u000AEOL')).toEqual('Single line...');
      expect(filter('Single line\x0D\x0AEOL')).toEqual('Single line...');
      expect(filter('Single line\u000D\x0AEOL')).toEqual('Single line...');
      expect(filter('Single line\x0D\u000AEOL')).toEqual('Single line...');

      // Mac
      expect(filter('Single line\rEOL')).toEqual('Single line...');
      expect(filter('Single line\u000DEOL')).toEqual('Single line...');
      expect(filter('Single line\x0DEOL')).toEqual('Single line...');

      // Linux
      expect(filter('Single line\nEOL')).toEqual('Single line...');
      expect(filter('Single line\u000AEOL')).toEqual('Single line...');
      expect(filter('Single line\x0AEOL')).toEqual('Single line...');

      // Vertical Tab
      expect(filter('Vertical Tab\vEOL')).toEqual('Vertical Tab...');
      expect(filter('Vertical Tab\u000BEOL')).toEqual('Vertical Tab...');
      expect(filter('Vertical Tab\x0BEOL')).toEqual('Vertical Tab...');

      // Form Feed
      expect(filter('Form Feed\fEOL')).toEqual('Form Feed...');
      expect(filter('Form Feed\u000CEOL')).toEqual('Form Feed...');
      expect(filter('Form Feed\x0CEOL')).toEqual('Form Feed...');

      // Next Line
      expect(filter('Next Line\u0085EOL')).toEqual('Next Line...');
      expect(filter('Next Line\x85EOL')).toEqual('Next Line...');

      // Line Separator
      expect(filter('Line Separator\u2028EOL')).toEqual('Line Separator...');

      // Paragraph Separator
      expect(filter('Paragraph Separator\u2029EOL')).toEqual(
        'Paragraph Separator...');
    }
  ));

  it(
    'should summarize large number to at most 4 s.f. and append metric prefix',
    inject(function($filter) {
      var filter = $filter('summarizeNonnegativeNumber');

      expect(filter(100)).toEqual(100);
      expect(filter(1720)).toEqual('1.7K');
      expect(filter(2306200)).toEqual('2.3M');

      expect(filter(12389654281)).toEqual('12.4B');
      expect(filter(897978581123)).toEqual('898.0B');
      expect(filter(476678)).toEqual('476.7K');
    })
  );

  it(
    'should capitalize first letter and truncate string at a word break',
    inject(function($filter) {
      var filter = $filter('truncateAndCapitalize');

      // The first word always appears in the result.
      expect(filter('  remove new Line', 4)).toEqual('Remove...');
      expect(filter('remove New line', 4)).toEqual('Remove...');

      expect(filter('remove New line', 6)).toEqual('Remove...');

      expect(filter('  remove new Line', 10)).toEqual('Remove new...');
      expect(filter('remove New line', 10)).toEqual('Remove New...');

      expect(filter('  remove new Line', 15)).toEqual('Remove new Line');
      expect(filter('remove New line', 15)).toEqual('Remove New line');

      // Strings starting with digits are not affected by the capitalization.
      expect(filter(' 123456 a bc d', 12)).toEqual('123456 a bc...');

      // If the maximum number of characters is not specified, return
      // the whole input string with the first letter capitalized.
      expect(filter('capitalize first letter and truncate')).toEqual(
        'Capitalize first letter and truncate');
      expect(filter(
        'a single sentence with more than twenty one characters', 21
      )).toEqual('A single sentence...');

      expect(filter(
        'a single sentence with more than 21 characters and all will be shown'
      )).toEqual(
        'A single sentence with more than 21 characters and all will be shown');

      // If maximum characters is greater than objective length
      // return whole objective.
      expect(filter('please do not test empty string', 100)).toEqual(
        'Please do not test empty string');
    })
  );

  it('should correctly capitalize strings', inject(function($filter) {
    var filter = $filter('capitalize');

    expect(filter('')).toEqual('');
    expect(filter(null)).toEqual(null);
    expect(filter(undefined)).toEqual(undefined);

    expect(filter('a')).toEqual('A');
    expect(filter('a  ')).toEqual('A');
    expect(filter('  a')).toEqual('A');
    expect(filter('  a  ')).toEqual('A');

    expect(filter('a  b ')).toEqual('A  b');
    expect(filter('  a  b ')).toEqual('A  b');
    expect(filter('  ab c ')).toEqual('Ab c');
    expect(filter('  only First lettEr is  Affected ')).toEqual(
      'Only First lettEr is  Affected');
  }));

  it('should not shorten the length of text', inject(function($filter) {
    expect($filter('getAbbreviatedText')('It will remain unchanged.', 50))
      .toBe('It will remain unchanged.');
    expect($filter('getAbbreviatedText')(
      'Itisjustaverylongsinglewordfortesting',
      50)).toBe('Itisjustaverylongsinglewordfortesting');
  }));

  it('should shorten the length of text', inject(function($filter) {
    expect($filter('getAbbreviatedText')(
      'It has to convert to a substring as it exceeds the character limit.',
      50)).toBe('It has to convert to a substring as it exceeds...');
    expect($filter('getAbbreviatedText')(
      'ItisjustaverylongsinglewordfortestinggetAbbreviatedText',
      50)).toBe('ItisjustaverylongsinglewordfortestinggetAbbreviate...');
    expect($filter('getAbbreviatedText')(
      'â, ??î or ôu🕧� n☁i✑💴++$-💯 ♓!🇪🚑🌚‼⁉4⃣od; /⏬®;😁☕😁:☝)😁😁😍1!@#',
      50)).toBe('â, ??î or ôu🕧� n☁i✑💴++$-💯 ♓!🇪🚑🌚‼⁉4⃣od;...');
    expect($filter('getAbbreviatedText')(
      'It is just a very long singlewordfortestinggetAbbreviatedText',
      50)).toBe('It is just a very long...');
  }));



  it('should get correct list of RTE components from HTML input',
    inject(function($filter) {
      var filter = $filter('formatRtePreview');
      expect(
        filter('<p>Text input</p>')
      ).toEqual('Text input');
      expect(
        filter('<p><oppia-noninteractive-math attr1=value1></oppia-' +
        'noninteractive-math>Text input</p>')
      ).toEqual('[Math] Text input');
      expect(
        filter('<p><oppia-noninteractive-math></oppia-noninteractive-math>' +
        'Text input<oppia-noninteractive-collapsible></oppia-noninteractive' +
        '-collapsible>Text input 2</p>')
      ).toEqual('[Math] Text input [Collapsible] Text input 2');
      expect(
        filter('<p><oppia-noninteractive-math></oppia-noninteractive-math>' +
        'Text&nbsp;input<sample_tag><oppia-noninteractive-collapsible>' +
        '</oppia-noninteractive-collapsible><a><sample_tag>Text input 2' +
        '</sample_tag></a></p>')
      ).toEqual('[Math] Text input [Collapsible] Text input 2');
      expect(
        filter('<oppia-noninteractive-math></oppia-noninteractive-math>' +
        'Text input<oppia-noninteractive-collapsible></oppia-noninteractive' +
        '-collapsible>Text input 2<oppia-noninteractive-image>' +
        '</oppia-noninteractive-image> Text Input 3 ')
      ).toEqual('[Math] Text input [Collapsible] Text input 2 [Image]  ' +
      'Text Input 3');
    }));

  it('should correctly display RTE components in Answer Group Header',
    inject(function($filter) {
      var ruleMath = {
        type: 'Equals',
        inputs: {
          x: 2
        }
      };
      var interactionIdMath = 'TextInput';
      var choicesMath = [
        {
          label: '<oppia-noninteractive-math raw_latex-with-value="&amp;quot;' +
            'x^3 - a x^2 - b x - c&amp;quot;"></oppia-noninteractive-math>',
          val: 0
        }, {
          label: '<oppia-noninteractive-math raw_latex-with-value="&amp;quot;' +
            'x^3 + (a+b+c)x^2 + (ab+bc+ca)x + abc&amp;quot;">' +
            '</oppia-noninteractive-math>',
          val: 1
        }, {
          label: '<oppia-noninteractive-math raw_latex-with-value="&amp;quot;' +
            'x^3 - (a+b+c)x^2 + (ab+bc+ca)x - abc&amp;quot;">' +
            '</oppia-noninteractive-math>',
          val: 2
        }, {
          label: '<oppia-noninteractive-math raw_latex-with-value="&amp;quot;' +
            'x^3 + (a+b+c)x^2 - (ab+bc+ca)x + abc&amp;quot;">' +
            '</oppia-noninteractive-math>',
          val: 3
        },
      ];

      var ruleMixed = {
        type: 'Equals',
        inputs: {
          x: 0
        }
      };
      var interactionIdMixed = 'TextInput';
      var choicesMixed = [
        {
          label: '<p><oppia-noninteractive-image alt-with-value="&amp;' +
            'quot;f&amp;quot;" caption-with-value="&amp;quot;&amp;quot;"' +
            'filepath-with-value="&amp;quot;img_20180112_170413_5jxq15ngmd' +
            '.png&amp;quot;"></oppia-noninteractive-image>This is a text ' +
            'input.</p><p><oppia-noninteractive-image alt-with-value="&amp;' +
            'quot;f&amp;quot;" caption-with-value="&amp;quot;&amp;quot;"' +
            'filepath-with-value="&amp;quot;img_20180112_170436_k7sz3xtvyy.' +
            'png&amp;quot;"></oppia-noninteractive-image></p><p><oppia-' +
            'noninteractive-link text-with-value="&amp;quot;&amp;quot;"' +
            'url-with-value="&amp;quot;https://www.example.com&amp;quot;">' +
            '</oppia-noninteractive-link><br><br></p>',
          val: 0
        }, {
          label: '<p><oppia-noninteractive-image alt-with-value="&amp;quot;' +
            'g&amp;quot;" caption-with-value="&amp;quot;&amp;quot;" filepath-' +
            'with-value="&amp;quot;img_20180112_170500_926cssn398.png&amp;' +
            'quot;"></oppia-noninteractive-image><br></p>',
          val: 1
        }
      ];

      expect($filter('convertToPlainText')($filter('formatRtePreview')(
        $filter('parameterizeRuleDescription')(ruleMath, interactionIdMath,
          choicesMath)))
      ).toEqual('is ' + 'equal to \'[Math]\'');

      expect($filter('convertToPlainText')($filter('formatRtePreview')(
        $filter('parameterizeRuleDescription')(ruleMixed, interactionIdMixed,
          choicesMixed)))
      ).toEqual('is ' + 'equal to \'[Image] This is a text ' +
        'input. [Image]  [Link]\'');
    })
  );

  it('should correctly parameterize rule description filter',
    inject(function($filter) {
      var ruleMultipleChoice = {
        type: 'Equals',
        inputs: {
          x: 0
        }
      };
      var interactionIdMultipleChoice = 'TextInput';
      var choicesMultipleChoice = [
        {
          label: '$10 should not become $$10',
          val: 0
        }
      ];
      expect($filter('parameterizeRuleDescription')(ruleMultipleChoice,
        interactionIdMultipleChoice, choicesMultipleChoice)
      ).toEqual('is equal to \'$10 should not become $$10\'');

      choicesMultipleChoice = [
        {
          label: '$xyz should not become $$xyz',
          val: 0
        }
      ];
      expect($filter('parameterizeRuleDescription')(ruleMultipleChoice,
        interactionIdMultipleChoice, choicesMultipleChoice)
      ).toEqual('is equal to \'$xyz should not become $$xyz\'');
    }));
});
