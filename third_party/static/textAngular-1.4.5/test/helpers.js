var triggerEvent = function(event, element, options){
	var event;
	if(angular.element === jQuery){
		event = jQuery.Event(event);
		angular.extend(event, options);
		element.triggerHandler(event);
	}else{
		element.triggerHandler(event, options);
	}
};