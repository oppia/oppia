describe('taRegisterTool Adding tools to taTools', function(){
	'use strict';
	beforeEach(module('textAngular'));
	
	it('should require a unique name', inject(function(taRegisterTool){
		expect(taRegisterTool).toThrow("textAngular Error: A unique name is required for a Tool Definition");
		expect(function(){taRegisterTool('');}).toThrow("textAngular Error: A unique name is required for a Tool Definition");
		expect(function(){
			taRegisterTool('test', {iconclass: 'test'});
			taRegisterTool('test', {iconclass: 'test'});
		}).toThrow("textAngular Error: A unique name is required for a Tool Definition");
	}));
	it('should require a display element/iconclass/buttontext', inject(function(taRegisterTool){
		expect(function(){taRegisterTool('test1', {});}).toThrow('textAngular Error: Tool Definition for "test1" does not have a valid display/iconclass/buttontext value');
		expect(function(){taRegisterTool('test2', {display: 'testbad'});}).toThrow('textAngular Error: Tool Definition for "test2" does not have a valid display/iconclass/buttontext value');
		expect(function(){taRegisterTool('test3', {iconclass: 'test'});}).not.toThrow('textAngular Error: Tool Definition for "test3" does not have a valid display/iconclass/buttontext value');
		expect(function(){taRegisterTool('test4', {buttontext: 'test'});}).not.toThrow('textAngular Error: Tool Definition for "test4" does not have a valid display/iconclass/buttontext value');
	}));
	it('should add a valid tool to taTools', inject(function(taRegisterTool, taTools){
		var toolDef = {iconclass: 'test'};
		taRegisterTool('test5', toolDef);
		expect(taTools['test5']).toBe(toolDef);
	}));
});