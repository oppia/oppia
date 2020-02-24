$(document).ready(function() {

$('#myform').submit(function() {
    $('#message').text('Form submited');
    return false;
});

});
