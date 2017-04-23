describe('taExecCommand', function(){
	'use strict';
	var $element;
	beforeEach(module('textAngular'));
	//mock for easier testing
	describe('handles lists correctly', function(){
		var taSelectionMock, $document, contents, insertedHtml;
		beforeEach(function(){
			insertedHtml = '';
			taSelectionMock = {
				element: undefined,
				getSelectionElement: function (){ return this.element; },
				getOnlySelectedElements: function(){ return this.element.childNodes; },
				setSelectionToElementStart: function (){ return; },
				setSelectionToElementEnd: function (){ return; },
				setSelectionAfterElement: function (){ return; },
				setSelectionBeforeElement: function (){ return; },
				insertHtml: function(html){ insertedHtml = html; }
			};
			
			module(function($provide){
				$provide.value('taSelection', taSelectionMock);
			});
		});
		describe('other to list', function(){
			var element;
			describe('fallthrough case', function(){
				it('calls execCommand', inject(function(taExecCommand, $document, taSelection){
					var _temp = $document[0].execCommand;
					$document[0].execCommand = function(){
						element.html('<b>Test Text</b>');
					};
					element = angular.element('<figment>To the List!</figment>');
					taSelection.element = element[0];
					taExecCommand()('insertorderedlist', false, null);
					expect(element.html()).toBe('<b>Test Text</b>');
					$document[0].execCommand = _temp;
				}));
			});
			describe('nothing selected', function(){
				beforeEach(inject(function(taSelection){
					element = angular.element('<div><p></p></div>');
					taSelection.element = element.children()[0];
				}));
				it('to ol', inject(function(taSelection, taExecCommand){
					taExecCommand()('insertorderedlist', false, null);
					expect(element.html()).toBe('<ol><li></li></ol>');
				}));
				
				it('to ul', inject(function(taSelection, taExecCommand){
					taExecCommand()('insertunorderedlist', false, null);
					expect(element.html()).toBe('<ul><li></li></ul>');
				}));
			});
			describe('br on line selected', function(){
				beforeEach(inject(function(taSelection){
					element = angular.element('<div><p><br></p></div>');
					taSelection.element = element.children()[0];
				}));
				it('to ol', inject(function(taSelection, taExecCommand){
					taExecCommand()('insertorderedlist', false, null);
					expect(element.html()).toBe('<ol><li><br></li></ol>');
				}));
				
				it('to ul', inject(function(taSelection, taExecCommand){
					taExecCommand()('insertunorderedlist', false, null);
					expect(element.html()).toBe('<ul><li><br></li></ul>');
				}));
			});
			describe('empty ta-bind', function(){
				beforeEach(inject(function(taSelection){
					element = angular.element('<div class="ta-bind"></div>');
					taSelection.element = element[0];
				}));
				it('to ol', inject(function(taSelection, taExecCommand){
					taExecCommand()('insertorderedlist', false, null);
					expect(insertedHtml).toBe('');
				}));
				
				it('to ul', inject(function(taSelection, taExecCommand){
					taExecCommand()('insertunorderedlist', false, null);
					expect(insertedHtml).toBe('');
				}));
			});
			describe('text-only ta-bind', function(){
				beforeEach(inject(function(taSelection){
					element = angular.element('<div class="ta-bind">testsomecontent</div>');
					taSelection.element = element[0];
					taSelection.getOnlySelectedElements = function(){ return []; };
				}));
				it('to ol', inject(function(taSelection, taExecCommand){
					taExecCommand()('insertorderedlist', false, null);
					expect(element.html()).toBe('<ol><li>testsomecontent</li></ol>');
				}));
				
				it('to ul', inject(function(taSelection, taExecCommand){
					taExecCommand()('insertunorderedlist', false, null);
					expect(element.html()).toBe('<ul><li>testsomecontent</li></ul>');
				}));
			});
			describe('single element selected', function(){
				beforeEach(inject(function(taSelection){
					element = angular.element('<div><p>To the List!</p></div>');
					taSelection.element = element.children()[0];
				}));
				it('to ol', inject(function(taSelection, taExecCommand){
					taExecCommand()('insertorderedlist', false, null);
					expect(element.html()).toBe('<ol><li>To the List!</li></ol>');
				}));
				
				it('to ul', inject(function(taSelection, taExecCommand){
					taExecCommand()('insertunorderedlist', false, null);
					expect(element.html()).toBe('<ul><li>To the List!</li></ul>');
				}));
			});
			describe('element with block tagname as text', function(){
				beforeEach(inject(function(taSelection){
					element = angular.element('<div><p>This is not a div</p></div>');
					taSelection.element = element.children()[0];
				}));
				it('to ol', inject(function(taSelection, taExecCommand){
					taExecCommand()('insertorderedlist', false, null);
					expect(element.html()).toBe('<ol><li>This is not a div</li></ol>');
				}));
				
				it('to ul', inject(function(taSelection, taExecCommand){
					taExecCommand()('insertunorderedlist', false, null);
					expect(element.html()).toBe('<ul><li>This is not a div</li></ul>');
				}));
			});
			describe('element containing span', function(){
				beforeEach(inject(function(taSelection){
					element = angular.element('<div><p>To the List!<span></span></p></div>');
					taSelection.element = element.children()[0];
				}));
				it('to ol', inject(function(taSelection, taExecCommand){
					taExecCommand()('insertorderedlist', false, null);
					expect(element.html()).toBe('<ol><li>To the List!<span></span></li></ol>');
				}));
				
				it('to ul', inject(function(taSelection, taExecCommand){
					taExecCommand()('insertunorderedlist', false, null);
					expect(element.html()).toBe('<ul><li>To the List!<span></span></li></ul>');
				}));
			});
			describe('multi element selected', function(){
				beforeEach(inject(function(taSelection){
					element = angular.element('<div class="ta-bind"><p>To the List!</p><p>To the List 2!</p></div>');
					taSelection.element = element[0];
				}));
				it('to ol', inject(function(taSelection, taExecCommand){
					taExecCommand()('insertorderedlist', false, null);
					expect(element.html()).toBe('<ol><li>To the List!</li><li>To the List 2!</li></ol>');
				}));
				
				it('to ul', inject(function(taSelection, taExecCommand){
					taExecCommand()('insertunorderedlist', false, null);
					expect(element.html()).toBe('<ul><li>To the List!</li><li>To the List 2!</li></ul>');
				}));
				
				it('multi list to ol', inject(function(taSelection, taExecCommand){
					element = angular.element('<div class="ta-bind"><ul><li>To the List!</li></ul><ul><li>To the List 2!</li></ul></div>');
					taSelection.element = element[0];
					taExecCommand()('insertorderedlist', false, null);
					expect(element.html()).toBe('<ol><li>To the List!</li><li>To the List 2!</li></ol>');
				}));
			});
			describe('multi element selected within block element', function(){
				beforeEach(inject(function(taSelection){
					element = angular.element('<div class="ta-bind"><blockquote><p>To the List!</p><p>To the List 2!</p></blockquote></div>');
					taSelection.element = element.find('blockquote')[0];
				}));
				it('to ol', inject(function(taSelection, taExecCommand){
					taExecCommand()('insertorderedlist', false, null);
					expect(element.html()).toBe('<ol><li>To the List!</li><li>To the List 2!</li></ol>');
				}));
				
				it('to ul', inject(function(taSelection, taExecCommand){
					taExecCommand()('insertunorderedlist', false, null);
					expect(element.html()).toBe('<ul><li>To the List!</li><li>To the List 2!</li></ul>');
				}));
			});
		});
		describe('list to other/list', function(){
			var element;
			describe('li selected', function(){
				it('from ol', inject(function(taSelection, taExecCommand){
					element = angular.element('<div><ol><li>To the List!</li></ol></div>');
					taSelection.element = element.children()[0].childNodes[0];
					taExecCommand()('insertorderedlist', false, null);
					expect(element.html()).toBe('<p>To the List!</p>');
				}));
				it('to ul', inject(function(taSelection, taExecCommand){
					element = angular.element('<div><ol><li>To the List!</li></ol></div>');
					taSelection.element = element.children()[0].childNodes[0];
					taExecCommand()('insertunorderedlist', false, null);
					expect(element.html()).toBe('<ul><li>To the List!</li></ul>');
				}));
			});
			describe('list selected', function(){
				describe('edge mixed case', function(){
					it('to ol', inject(function(taSelection, taExecCommand){
						element = angular.element('<div class="ta-bind"><ol><li>To the List!</li></ol><span><ul><li>To the List!</li></ul></span></div>');
						taSelection.element = element[0];
						taExecCommand()('insertorderedlist', false, null);
						expect(element.html()).toBe('<ol><li>To the List!</li><li>To the List!</li></ol>');
					}));
					it('to ul', inject(function(taSelection, taExecCommand){
						element = angular.element('<div class="ta-bind"><ol><li>To the List!</li></ol><span><ul><li>To the List!</li></ul></span></div>');
						taSelection.element = element[0];
						taExecCommand()('insertunorderedlist', false, null);
						expect(element.html()).toBe('<ul><li>To the List!</li><li>To the List!</li></ul>');
					}));
				});
				describe('mixed as child of ta-bind', function(){
					it('to ol', inject(function(taSelection, taExecCommand){
						element = angular.element('<div class="ta-bind"><ol><li>To the List!</li></ol><ul><li>To the List!</li></ul></div>');
						taSelection.element = element[0];
						taExecCommand()('insertorderedlist', false, null);
						expect(element.html()).toBe('<ol><li>To the List!</li><li>To the List!</li></ol>');
					}));
					it('to ul', inject(function(taSelection, taExecCommand){
						element = angular.element('<div class="ta-bind"><ol><li>To the List!</li></ol><ul><li>To the List!</li></ul></div>');
						taSelection.element = element[0];
						taExecCommand()('insertunorderedlist', false, null);
						expect(element.html()).toBe('<ul><li>To the List!</li><li>To the List!</li></ul>');
					}));
				});
				describe('from ol', function(){
					describe('as child of ta-bind', function(){
						it('to default', inject(function(taSelection, taExecCommand){
							element = angular.element('<div class="ta-bind"><ol><li>To the List!</li></ol></div>');
							taSelection.element = element[0];
							taExecCommand()('insertorderedlist', false, null);
							expect(element.html()).toBe('<p>To the List!</p>');
						}));
						it('to ul', inject(function(taSelection, taExecCommand){
							element = angular.element('<div class="ta-bind"><ol><li>To the List!</li></ol></div>');
							taSelection.element = element[0];
							taExecCommand()('insertunorderedlist', false, null);
							expect(element.html()).toBe('<ul><li>To the List!</li></ul>');
						}));
					});
					it('as list', inject(function(taSelection, taExecCommand){
						element = angular.element('<div><ol><li>To the List!</li></ol></div>');
					taSelection.element = element.children()[0];
						taExecCommand()('insertorderedlist', false, null);
						expect(element.html()).toBe('<p>To the List!</p>');
					}));
					it('to ul', inject(function(taSelection, taExecCommand){
						element = angular.element('<div><ol><li>To the List!</li></ol></div>');
						taSelection.element = element.children()[0];
						taExecCommand()('insertunorderedlist', false, null);
						expect(element.html()).toBe('<ul><li>To the List!</li></ul>');
					}));
				});
				describe('from ul', function(){
					describe('as child of ta-bind', function(){
						it('to default', inject(function(taSelection, taExecCommand){
							element = angular.element('<div class="ta-bind"><ul><li>To the List!</li></ul></div>');
							taSelection.element = element[0];
							taExecCommand()('insertunorderedlist', false, null);
							expect(element.html()).toBe('<p>To the List!</p>');
						}));
						it('to ol', inject(function(taSelection, taExecCommand){
							element = angular.element('<div class="ta-bind"><Ul><li>To the List!</li></ul></div>');
							taSelection.element = element[0];
							taExecCommand()('insertorderedlist', false, null);
							expect(element.html()).toBe('<ol><li>To the List!</li></ol>');
						}));
					});
					it('as child of ta-bind', inject(function(taSelection, taExecCommand){
						element = angular.element('<div class="ta-bind"><ul><li>To the List!</li></ul></div>');
						taSelection.element = element[0];
						taExecCommand()('insertunorderedlist', false, null);
						expect(element.html()).toBe('<p>To the List!</p>');
					}));
					it('as list', inject(function(taSelection, taExecCommand){
						element = angular.element('<div><ul><li>To the List!</li></ul></div>');
						taSelection.element = element.children()[0];
						taExecCommand()('insertunorderedlist', false, null);
						expect(element.html()).toBe('<p>To the List!</p>');
					}));
					it('to ol', inject(function(taSelection, taExecCommand){
						element = angular.element('<div><ul><li>To the List!</li></ul></div>');
						taSelection.element = element.children()[0];
						taExecCommand()('insertorderedlist', false, null);
						expect(element.html()).toBe('<ol><li>To the List!</li></ol>');
					}));
				});
			});
		});
	});
});