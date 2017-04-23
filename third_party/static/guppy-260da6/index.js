$('document').ready(function() {
    $('#xml_btn').on('click', function() {
        createText('xml');
    });
    $('#text_btn').on('click', function() {
        createText('text');
    });
    $('#latex_btn').on('click', function() {
        createText('latex');
    });
    $('#clear_btn').on('click', function() {
        $('#stuff')[0].innerHTML = '';
    });

    Guppy.get_symbols(["builtins","sym/symbols.json","sym/extra_symbols.json"]);
    var g1 = new Guppy("guppy1", {
	//'debug':10,
        'right_callback': function() {},
        'left_callback': function() {},
        'done_callback': function() { createText('text'); },
        //'blank_caret': "[?]",
        'empty_content': "\\color{gray}{\\text{Click here to start typing a mathematical expression}}"
    });
});

function flash_help(){
    $("#help_card").fadeIn(100).fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);
}

function createText(texttype) {
    //clear screen
    $('#stuff')[0].innerHTML = texttype.toUpperCase() + ": ";
    //display text
    $('#stuff')[0].appendChild(document.createElement('br'));
    $('#stuff')[0].appendChild(document.createTextNode(Guppy.instances.guppy1.get_content(texttype)));
}
