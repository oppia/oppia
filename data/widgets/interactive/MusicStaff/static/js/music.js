var staff;
var note01;
var noteToGuess = GLOBALS.noteToGuess;
var numberOfNotes = 0;

var pitches = {
  200: 'C4', 190: 'D4', 180: 'E4', 170: 'F4', 160: 'G4',
  150: 'A4', 140: 'B4', 130: 'C5', 120: 'D5', 110: 'E5',
  100: 'F5'
};

var notes_dictionary={
    //MIDI names and frequencies 
    //derived from http://www.phys.unsw.edu.au/jw/notes.html
    "C4":["60","261.63"],
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
    soundfontUrl: "/data/widgets/interactive/MusicStaff/static/soundfont/",
    instrument: "acoustic_grand_piano",
    callback: function() {
      $('#playNote').removeAttr("disabled");  //enable the button
      $('#playCurrent').removeAttr("disabled");  //enable the button
    }
  });

  numberOfNotes = 0;
  for(var note in notes_dictionary) {
    if (notes_dictionary.hasOwnProperty(note)) {
      numberOfNotes++;
    }
  }

  note01.onclick = function(event) {
    var isSelected = changeColor(); //boolean if it is selected or deselected
    document.onkeydown = function(event){
      var notePosition = note01.getAttribute("cy");
      if (isSelected) {
        if (event.keyCode == 38) {  //Up arrow key
          moveNote(notePosition, -10);
        } else if (event.keyCode == 40) {  //Down arrow key
          moveNote(notePosition, 10);
        } else {
          return false;
        }
      }
    };
  };
});

function playCorrectNote() {
  playNote(noteToGuess);
}

function playCurrentNote() {
  playNote(whichLineIsNoteOn());
}

function submitAnswer() {
  var note = whichLineIsNoteOn();

  // Post an event message to the parent iframe.
  if (parent.location.pathname.indexOf('/learn') === 0) {
    window.parent.postMessage(
      JSON.stringify({'submit': note}),
      window.location.protocol + '//' + window.location.host);
  }
}

function playNote(noteString) {
  var delay = 0;  // play one note every quarter second
  var velocity = 127;  //how hard the note hits
  var MIDInote = notes_dictionary[noteString][0]; //get the MIDI value
  MIDI.setVolume(0,127);
  MIDI.noteOn(0, MIDInote, velocity, delay);
  MIDI.noteOff(0, MIDInote, delay + 3);
}

function changeColor() {
  //Changes the color and returns with true if red (note is selected)
  if (note01.getAttribute("fill") == "black") {
    note01.setAttribute("fill", "red");
    return true;
  } else {
    note01.setAttribute("fill", "black");
    return false;
  }
}

function whichLineIsNoteOn(){
  //Return a string with the note name
  return pitches[note01.getAttribute("cy")];
}

function moveNote(notePosition, moveVector) {
  //moves the note if it is within the defined range
  //changes the text on index.html currentNote
  var minNotePos = document.getElementById("staffLineC4").getAttribute("y1");
  var maxNotePos = document.getElementById("staffLineF5").getAttribute("y1");
  var newPosition = parseInt(notePosition, 10);
  var moveAmount = parseInt(moveVector, 10);
  newPosition += moveAmount;

  // Confusing because positions decrease down the page
  // If the newPosition > minNotePos it is further down the page than the staff
  if (newPosition <= minNotePos && newPosition >= maxNotePos) {
    note01.setAttribute("cy",newPosition);
    var currentNote = whichLineIsNoteOn();
    $("#currentNote").text(currentNote + ' ' + notes_dictionary[currentNote][1]);
  }
  else {
    return;
  }
}

// Prevents scrolling of the parent window when the down arrow key
// is pressed. See
//   http://stackoverflow.com/questions/8916620/disable-arrow-key-scrolling-in-users-browser
var keys = {};
window.addEventListener("keydown",
    function(e){
        keys[e.keyCode] = true;
        switch(e.keyCode){
            case 37: case 39: case 38:  case 40: // Arrow keys
            case 32: e.preventDefault(); break; // Space
            default: break; // do not block other keys
        }
    },
false);
window.addEventListener('keyup',
    function(e){
        keys[e.keyCode] = false;
    },
false);
