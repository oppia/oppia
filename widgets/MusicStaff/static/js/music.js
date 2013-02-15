var staff;
var note01;

notes_dictionary={ 
    //MIDI names and frequencies 
    //derived from http://www.phys.unsw.edu.au/jw/notes.html
     "C4":["60", "261.63"], 
     "D4":["62","293.67"], 
     "E4":["64","329.63"],
     "F4":["65","349.23"],
     "G4":["67","392.00"],
     "A4":["69","440.00"],
     "B4":["71","493.88"],
     "C5":["72","523.25"],
     "D5":["74","587.33"],
     "E5":["76","659.26"],
     "F5":["77","698.46"]
};

$(window).load(function() {
	var staff = document.getElementsByTagName("line");
	note01 = document.getElementById("note01");
		
    MIDI.loadPlugin({
        soundfontUrl: "./soundfont/",
		instrument: "acoustic_grand_piano",
		callback: function() {
			$('#playNote').removeAttr("disabled");  //enable the button
            playRandomNote();  //The note for the user to match
		}
	});
    
	note01.onclick = function(event){ //If the note is clicked
        var isSelected = changeColor(); //boolean if it is selected or deselected
        document.onkeydown = function(event){
            var notePosition = note01.getAttribute("cy"); //The ellipse y pos
            if (isSelected) {
                if (event.keyCode == 38) {  //Up arrow key
                    moveNote(notePosition, -10);
                    } //end if keyCode == 38
                if (event.keyCode == 40) {  //Down arrow key
                    moveNote(notePosition, 10);
                    } //if keyCode == 40
                else {
                    return false;
                    } //end else	
                } //end if(isSelected)
             };  //end onkeydown function
          }; //end onclick
}); //end load function

function countNumberOfNotes(){
    var countNotes = 0;
    for(var note in notes_dictionary) {
        if (notes_dictionary.hasOwnProperty(note)) {
            countNotes++;
        } //end if
    } //end for
    return countNotes;
} //end countNumberOfNotes

function playUserNote(){
    increaseAttemptNumber();
    var note = whichLineIsNoteOn(); // return a string
    playNote(note);
}

function playNote(noteString){
    var delay = 0;  // play one note every quarter second
    var velocity = 127;  //how hard the note hits
    var MIDInote = notes_dictionary[noteString][0]; //get the MIDI value
    MIDI.setVolume(0,127);
    MIDI.noteOn(0, MIDInote, velocity, delay);
    MIDI.noteOff(0, MIDInote, delay + 3);
}

function playRandomNote(){
    var numberOfNotes = countNumberOfNotes();
    var randomNote = Math.floor(Math.random() * numberOfNotes);
    var noteArray = Object.keys(notes_dictionary);
    playNote(noteArray[randomNote]);
    
}

function increaseAttemptNumber(){
    var attempts = $('#numAttempts').text();
    attempts = parseInt(attempts, 10) + 1;
    $('#numAttempts').text(attempts);
}

function changeColor() {
    //Changes the color and returns with true if red (note is selected)
    if (note01.getAttribute("fill") == "black"){
        note01.setAttribute("fill","red");	
        return true; 
    }
    else {
        note01.setAttribute("fill","black");
        return false;
    }
}

function whichLineIsNoteOn(){
    //Return a string with the note name
    note01.setAttribute("display", "none");
    var noteXPos = document.getElementById("note01").getAttribute("cx");
    var noteYPos = note01.getAttribute("cy");
	var notePitch = document.elementFromPoint(noteXPos,noteYPos).id;
	notePitch = notePitch.substring(9,11);
    note01.setAttribute("display", "inline");
    return notePitch;
}

function moveNote(notePosition, moveVector) {
    //moves the note if it is within the defined range
    //changes the text on index.html currentNote
    var minNotePos = document.getElementById("staffLineC4").getAttribute("y1");
	var maxNotePos = document.getElementById("staffLineF5").getAttribute("y1");
	var newPosition = parseInt(notePosition, 10);
	var moveAmount = parseInt(moveVector, 10);
	newPosition += moveAmount;
		
	//Confusing because positions decrease down the page
	//If the newPosition > minNotePos it is further down the page than the staff
	if (newPosition <= minNotePos && newPosition >= maxNotePos) {
		note01.setAttribute("cy",newPosition);
        var currentNote = whichLineIsNoteOn();
        $("#currentNote").text(currentNote + ' ' + notes_dictionary[currentNote][1]);
	}
	else {
		return;
	}
}
