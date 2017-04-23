describe('taBind.wordPaste', function () {
	'use strict';
	beforeEach(module('textAngular'));
	afterEach(inject(function($document){
		$document.find('body').html('');
	}));
	var $rootScope;
	
	
	describe('should sanitize word based content on paste', function () {
		var element, pasted = '';
		beforeEach(function(){
			pasted = '';
			module(function($provide){
				$provide.value('taSelection', {
					insertHtml: function(html){ pasted = html; }
				});
			});
		});
		beforeEach(inject(function (_$compile_, _$rootScope_, $document) {
			$rootScope = _$rootScope_;
			$rootScope.html = '<p>Test Contents</p>';
			element = _$compile_('<div ta-bind contenteditable="contenteditable" ng-model="html"></div>')($rootScope);
			$document.find('body').append(element);
			$rootScope.$digest();
		}));
		// in fragment
		it('in fragment', inject(function($timeout, taSelection){
			element.triggerHandler('paste', {clipboardData: {types: ['text/html'], getData: function(){
				return '<div><!--StartFragment--><p class=MsoNormal>Test Content Stripping<o:p></o:p></p><!--EndFragment--></div>';// jshint ignore:line
			}}});
			$timeout.flush();
			$rootScope.$digest();
			expect(pasted).toBe('<p>Test Content Stripping</p>');
		}));
		// out fragment
		it('outside fragment', inject(function($timeout, taSelection){
			element.triggerHandler('paste', {clipboardData: {types: ['text/html'], getData: function(){
				return '<p class="MsoNormal"><span lang="EN-US">Body</span><o:p></o:p></p>';// jshint ignore:line
			}}});
			$timeout.flush();
			$rootScope.$digest();
			expect(pasted).toBe('<p>Body</p>');
		}));
		
		it('remove blank list tag', inject(function($timeout, taSelection){
			element.triggerHandler('paste', {clipboardData: {types: ['text/html'], getData: function(){
				return '<p class="MsoListBulletCxSpLast"><span lang="EN-US">&nbsp;</span></p>';// jshint ignore:line
			}}});
			$timeout.flush();
			$rootScope.$digest();
			expect(pasted).toBe('');
		}));
		
		// header
		it('Header Element', inject(function($timeout, taSelection){
			element.triggerHandler('paste', {clipboardData: {types: ['text/html'], getData: function(){
				return '<h1>Header 1<o:p></o:p></h1>';// jshint ignore:line
			}}});
			$timeout.flush();
			$rootScope.$digest();
			expect(pasted).toBe('<h1>Header 1</h1>');
		}));
		// bold/italics
		it('handle bold/italics/underline', inject(function($timeout, taSelection){
			element.triggerHandler('paste', {clipboardData: {types: ['text/html'], getData: function(){
				return '<p><b>Header</b> <u>1</u> <i>Test</i><o:p></o:p></p>';// jshint ignore:line
			}}});
			$timeout.flush();
			$rootScope.$digest();
			expect(pasted).toBe('<p><b>Header</b> <u>1</u> <i>Test</i></p>');
		}));
		// lists, ul/ol
		it('ol list, format 1', inject(function($timeout, taSelection){
			element.triggerHandler('paste', {clipboardData: {types: ['text/html'], getData: function(){
				return '<p class=MsoListParagraphCxSpFirst style="text-indent:-18.0pt;mso-list:l0 level1 lfo1"><![if !supportLists]><span style="mso-fareast-font-family:Cambria;mso-fareast-theme-font:minor-latin;mso-bidi-font-family:Cambria;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore">1.<span style="font:7.0pt \'Times New Roman\'">&nbsp;&nbsp;&nbsp;&nbsp;</span></span></span><![endif]>Test1<o:p></o:p></p>';// jshint ignore:line
			}}});
			$timeout.flush();
			$rootScope.$digest();
			expect(pasted).toBe('<ol><li>Test1</li></ol>');
		}));
		it('ol list, format 2', inject(function($timeout, taSelection){
			element.triggerHandler('paste', {clipboardData: {types: ['text/html'], getData: function(){
				return '<p class="MsoListNumberCxSpFirst"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">1.<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>';// jshint ignore:line
			}}});
			$timeout.flush();
			$rootScope.$digest();
			expect(pasted).toBe('<ol><li>Test1</li></ol>');
		}));
		/* Phantom JS issue with childNodes
		it('ul list, format 1', inject(function($timeout, taSelection){
			element.triggerHandler('paste', {clipboardData: {types: ['text/html'], getData: function(){
				return '<p class=MsoListParagraphCxSpFirst style="text-indent:-18.0pt;mso-list:l0 level1 lfo1"><![if !supportLists]><span style="mso-fareast-font-family:Cambria;mso-fareast-theme-font:minor-latin;mso-bidi-font-family:Cambria;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore">.<span style="font:7.0pt \'Times New Roman\'">&nbsp;&nbsp;&nbsp;&nbsp;</span></span></span><![endif]>Test1<o:p></o:p></p><p class=MsoListParagraphCxSpLast style="text-indent:-18.0pt;mso-list:l0 level1 lfo1"><![if !supportLists]><span style="mso-fareast-font-family:Cambria;mso-fareast-theme-font:minor-latin;mso-bidi-font-family:Cambria;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore">.<span style="font:7.0pt \'Times New Roman\'">&nbsp;&nbsp;&nbsp;&nbsp;</span></span></span><![endif]>Test1<o:p></o:p></p>';// jshint ignore:line
			}}});
			$timeout.flush();
			$rootScope.$digest();
			expect(pasted).toBe('<ul><li>Test1</li><li>Test1</li></ul>');
		}));
		it('ul list, format 2', inject(function($timeout, taSelection){
			element.triggerHandler('paste', {clipboardData: {types: ['text/html'], getData: function(){
				return '<p class="MsoListBulletCxSpFirst"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">·<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p><p class="MsoListBulletCxSpLast"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">·<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>';// jshint ignore:line
			}}});
			$timeout.flush();
			$rootScope.$digest();
			expect(pasted).toBe('<ul><li>Test1</li><li>Test1</li></ul>');
		}));
		
		it('subsequent list', inject(function($timeout, taSelection){
			element.triggerHandler('paste', {clipboardData: {types: ['text/html'], getData: function(){
				return '<p class="MsoListParagraphCxSpFirst" style="text-indent:-18.0pt;mso-list:l1 level1 lfo1"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol"><span style="mso-list:Ignore">·<span style="font:7.0pt &quot;Times New Roman&quot;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span></span><!--[endif]--><span lang="EN-US">no vidisse partiendocomplectitur has. </span></p><p class="MsoListParagraphCxSpLast" style="text-indent:-18.0pt;mso-list:l1 level1 lfo1"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol"><span style="mso-list:Ignore">·<span style="font:7.0pt &quot;Times New Roman&quot;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span></span><!--[endif]--><span lang="EN-US">Te sit iusto viris tibique, nevoluptaria philosophia cum, cum ad vivendum mediocritatem. </span></p><p  style="text-indent:18.0pt"><span lang="EN-US"></span></p><p  style="text-indent:18.0pt"><span lang="EN-US">Alii mazimsoleat ne sed, dicta putant ad qui. </span></p><p class="MsoListParagraphCxSpFirst" style="margin-left:18.0pt;mso-add-space:auto;text-indent:-18.0pt;mso-list:l0 level1 lfo2"><!--[if !supportLists]--><span lang="EN-US" style="mso-fareast-font-family:Cambria;mso-fareast-theme-font:minor-latin;mso-bidi-font-family:Cambria;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore">1.<span style="font:7.0pt &quot;Times New Roman&quot;">&nbsp;&nbsp;&nbsp;&nbsp;</span></span></span><!--[endif]--><span lang="EN-US">Has accusam scriptorem cu, </span></p><p class="MsoListParagraphCxSpLast" style="margin-left:39.6pt;mso-add-space:auto;text-indent:-21.6pt;mso-list:l0 level2 lfo2"><!--[if !supportLists]--><span lang="EN-US" style="mso-fareast-font-family:Cambria;mso-fareast-theme-font:minor-latin;mso-bidi-font-family:Cambria;mso-bidi-theme-font:minor-latin"><span style="mso-list:Ignore">1.1.<span style="font:7.0pt &quot;Times New Roman&quot;">&nbsp; </span></span></span><!--[endif]--><span lang="EN-US">aliquam complectitur vim ne.</span></p>';// jshint ignore:line
			}}});
			$timeout.flush();
			$rootScope.$digest();
			expect(pasted).toBe('<ul><li>no vidisse partiendocomplectitur has. </li><li>Te sit iusto viris tibique, nevoluptaria philosophia cum, cum ad vivendum mediocritatem. </li></ul><p></p><p>Alii mazimsoleat ne sed, dicta putant ad qui. </p><ol><li>Has accusam scriptorem cu, <ol><li>aliquam complectitur vim ne.</li></ol></li></ol>');
		}));
		
		// indents - ul > ul, ul > ol, ol > ol, ol > ul
		
		it('ul > ul nested list', inject(function($timeout, taSelection){
			element.triggerHandler('paste', {clipboardData: {types: ['text/html'], getData: function(){
				return '<p class="MsoListBulletCxSpFirst"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">·<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>' + // jshint ignore:line
					'<p class="MsoListBulletCxSpLast" style="margin-left:39.6pt"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">·<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>';// jshint ignore:line
			}}});
			$timeout.flush();
			$rootScope.$digest();
			expect(pasted).toBe('<ul><li>Test1<ul><li>Test1</li></ul></li></ul>');
		}));
		it('ul > ol nested list', inject(function($timeout, taSelection){
			element.triggerHandler('paste', {clipboardData: {types: ['text/html'], getData: function(){
				return '<p class="MsoListBulletCxSpFirst"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">·<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>' + // jshint ignore:line
					'<p class="MsoListNumberCxSpLast" style="margin-left:39.6pt"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">1.<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>';// jshint ignore:line
			}}});
			$timeout.flush();
			$rootScope.$digest();
			expect(pasted).toBe('<ul><li>Test1<ol><li>Test1</li></ol></li></ul>');
		}));
		it('ol > ol nested list', inject(function($timeout, taSelection){
			element.triggerHandler('paste', {clipboardData: {types: ['text/html'], getData: function(){
				return '<p class="MsoListNumberCxSpFirst"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">1.<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>' + // jshint ignore:line
					'<p class="MsoListNumberCxSpLast" style="margin-left:39.6pt"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">2.<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>';// jshint ignore:line
			}}});
			$timeout.flush();
			$rootScope.$digest();
			expect(pasted).toBe('<ol><li>Test1<ol><li>Test1</li></ol></li></ol>');
		}));
		it('ol > ul nested list', inject(function($timeout, taSelection){
			element.triggerHandler('paste', {clipboardData: {types: ['text/html'], getData: function(){
				return '<p class="MsoListNumberCxSpFirst"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">1.<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>' + // jshint ignore:line
					'<p class="MsoListBulletCxSpLast" style="margin-left:39.6pt"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">·<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>';// jshint ignore:line
			}}});
			$timeout.flush();
			$rootScope.$digest();
			expect(pasted).toBe('<ol><li>Test1<ul><li>Test1</li></ul></li></ol>');
		}));
		*/
		
		// outdents - ul < ul, ul < ol, ol < ol, ol < ul
		/* These Break on Phantom JS for some reason. */
		it('ul > ul < ul nested list', inject(function($timeout, taSelection){
			element.triggerHandler('paste', {clipboardData: {types: ['text/html'], getData: function(){
				return '<p class="MsoListBulletCxSpFirst"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">·<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>' + // jshint ignore:line
					'<p class="MsoListBulletCxSpMiddle" style="margin-left:39.6pt"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">·<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>' + // jshint ignore:line
					'<p class="MsoListBulletCxSpLast"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">·<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>';// jshint ignore:line
			}}});
			/*
			$timeout.flush();
			$rootScope.$digest();
			expect(pasted).toBe('<ul><li>Test1<ul><li>Test1</li></ul></li><li>Test1</li></ul>');*/
		}));
		it('ul > ul < ol nested list', inject(function($timeout, taSelection){
			element.triggerHandler('paste', {clipboardData: {types: ['text/html'], getData: function(){
				return '<p class="MsoListBulletCxSpFirst"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">·<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>' + // jshint ignore:line
					'<p class="MsoListBulletCxSpMiddle" style="margin-left:39.6pt"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">·<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>' + // jshint ignore:line
					'<p class="MsoListNumberCxSpLast"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">1.<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>';// jshint ignore:line
			}}});
			/*
			$timeout.flush();
			$rootScope.$digest();
			expect(pasted).toBe('<ul><li>Test1<ul><li>Test1</li></ul></li></ul><ol><li>Test1</li></ol>');*/
		}));
		it('ol > ul < ol nested list', inject(function($timeout, taSelection){
			element.triggerHandler('paste', {clipboardData: {types: ['text/html'], getData: function(){
				return '<p class="MsoListNumberCxSpFirst"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">1.<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>' + // jshint ignore:line
					'<p class="MsoListBulletCxSpMiddle" style="margin-left:39.6pt"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">·<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>' + // jshint ignore:line
					'<p class="MsoListNumberCxSpLast"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">1.<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>';// jshint ignore:line
			}}});
			/*
			$timeout.flush();
			$rootScope.$digest();
			expect(pasted).toBe('<ol><li>Test1<ul><li>Test1</li></ul></li><li>Test1</li></ol>');*/
		}));
		it('ol > ol < ol nested list', inject(function($timeout, taSelection){
			element.triggerHandler('paste', {clipboardData: {types: ['text/html'], getData: function(){
				return '<p class="MsoListNumberCxSpFirst"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">1.<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>' + // jshint ignore:line
					'<p class="MsoListNumberCxSpMiddle" style="margin-left:39.6pt"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">1.<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>' + // jshint ignore:line
					'<p class="MsoListNumberCxSpLast"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">1.<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>';// jshint ignore:line
			}}});
			/*
			$timeout.flush();
			$rootScope.$digest();
			expect(pasted).toBe('<ol><li>Test1<ol><li>Test1</li></ol></li><li>Test1</li></ol>');*/
		}));
		it('ol > ol < ul nested list', inject(function($timeout, taSelection){
			element.triggerHandler('paste', {clipboardData: {types: ['text/html'], getData: function(){
				return '<p class="MsoListNumberCxSpFirst"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">1.<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>' + // jshint ignore:line
					'<p class="MsoListNumberCxSpMiddle" style="margin-left:39.6pt"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">1.<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>' + // jshint ignore:line
					'<p class="MsoListBulletCxSpLast"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">·<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>';// jshint ignore:line
			}}});
			/*
			$timeout.flush();
			$rootScope.$digest();
			expect(pasted).toBe('<ol><li>Test1<ol><li>Test1</li></ol></li></ol><ul><li>Test1</li></ul>');*/
		}));
		it('ul > ol < ul nested list', inject(function($timeout, taSelection){
			element.triggerHandler('paste', {clipboardData: {types: ['text/html'], getData: function(){
				return '<p class="MsoListBulletCxSpFirst"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">1.<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>' + // jshint ignore:line
					'<p class="MsoListNumberCxSpMiddle" style="margin-left:39.6pt"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">1.<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>' + // jshint ignore:line
					'<p class="MsoListBulletCxSpLast"><!--[if !supportLists]--><span lang="EN-US" style="font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-ansi-language:EN-US">·<span style="font-stretch: normal; font-size: 7pt; font-family: \'Times New Roman\';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Test1<o:p></o:p></p>';// jshint ignore:line
			}}});
			/*
			$timeout.flush();
			$rootScope.$digest();
			expect(pasted).toBe('<ul><li>Test1<ol><li>Test1</li></ol></li><li>Test1</li></ul>');*/
		}));
	});
});