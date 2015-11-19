var audioContext = null;
var isPlaying = false;      // Are we currently playing?
var startTime;              // The start time of the entire sequence.
var current16thNote;        // What note is currently last scheduled?
var current12thNote;        // What note is currently last scheduled?
var NOTES_SIZE = 12;  
var TABLERO_SIZE = 6;  
var tempo = 60.0;          // tempo (in beats per minute)
var lookahead = 25.0;       // How frequently to call scheduling function 
                            //(in milliseconds)
var scheduleAheadTime = 0.1;    // How far ahead to schedule audio (sec)
                            // This is calculated from lookahead, and overlaps 
                            // with next interval (in case the timer is late)
var nextNoteTime = 0.0;     // when the next note is due.
var noteResolution = 0;     // 0 == 16th, 1 == 8th, 2 == quarter note
var noteLength = 0.05;      // length of "beep" (in seconds)
var canvas,                 // the canvas element
    canvasContext;          // canvasContext is the canvas' context 2D
var last16thNoteDrawn = -1; // the last "box" we drew on the screen
var notesInQueue = [];      // the notes that have been put into the web audio,
                            // and may or may not have played yet. {note, time}
var timerWorker = null;     // The Web Worker used to fire timer messages

var sequence1 = '001001010101';
var posCosas = [];

var matrix = [];

// First, let's shim the requestAnimationFrame API, with a setTimeout fallback
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function( callback ){
        window.setTimeout(callback, 1000 / 60);
    };
})();


function loadSoundObj(obj, callback) {
    var request = new XMLHttpRequest();
    //request.open('GET', "sonidos/" + obj.src + "." + window.elektroWhale.audioFormat, true);
    request.open('GET', "sonidos/" + obj.src , true);
    request.responseType = 'arraybuffer';
    request.onload = function() {
        // request.response is encoded... so decode it now
        window.elektroWhale.audioContext.decodeAudioData(request.response, function(buffer) {
            obj.buffer = buffer;
            }, function() {
                message.call($wrapper, 'error', 'Error loading ' + obj.src);
            });
    };

    request.send();
}

function loadSounds() {
    // iterate over sounds obj
    for (var i in window.elektroWhale.sonidos) {
        if (window.elektroWhale.sonidos.hasOwnProperty(i)) {
            // load sound
            loadSoundObj(window.elektroWhale.sonidos[i]);
        }
    }
}

function playSound(name, start, vol) {
// If vol is null, use the sound's default volume
    if (vol === null) {
        vol = window.elektroWhale.sonidos[name].volume;
    }
    // Lazy-load the master gain node
    if (window.elektroWhale.masterGainNode === null) {
        window.elektroWhale.masterGainNode = window.elektroWhale.audioContext.createGain();
        window.elektroWhale.masterGainNode.connect( window.elektroWhale.audioContext.destination );
    }
    // Create a gainNode
    var gainNode = window.elektroWhale.audioContext.createGain();
    // Set gain values
    window.elektroWhale.masterGainNode.gain.value = window.elektroWhale.masterVolume / 100;
    gainNode.gain.value = vol;
    // Create bufferSource
    var bufferSource = window.elektroWhale.audioContext.createBufferSource();
    bufferSource.buffer = window.elektroWhale.sonidos[name].buffer;
    // Connect everything
    bufferSource.connect(gainNode);
    gainNode.connect(window.elektroWhale.masterGainNode);
    // Play
    bufferSource.start(start);
}

function nextNote() {
    // Advance current note and time by a 16th note...
    var secondsPerBeat = 60.0 / tempo;    // Notice this picks up the CURRENT 
                                          // tempo value to calculate beat length.
    nextNoteTime += 0.25 * secondsPerBeat;    // Add beat length to last beat time

    current16thNote++;    // Advance the beat number, wrap to zero
    if (current16thNote == NOTES_SIZE) {
        current16thNote = 0;
    }
    //avanzamos los bichos bichejos
	
	var posCosa = posCosas[0];
	var step = sequence1.charAt(current16thNote);
	//console.log(sequence1 + ' '+step+" "+current16thNote); 
	if(step == '1'){
		//tenemos golpe
		
		//	console.log('golpe'); 
		posCosa.z = 1;	
		var vectorPos = matrix[posCosa.x][posCosa.y];
		if(vectorPos.x == 1){
			posCosa.y--;
		}else if(vectorPos.x == -1){
			posCosa.y++;
		}else if(vectorPos.y == 1){
			posCosa.x--;
		}else if(vectorPos.y == -1){
			posCosa.x++;
		} 
		
		
		if(posCosa.x >= TABLERO_SIZE){
			posCosa.x = 0;	
			
		}
		if(posCosa.x < 0){
			posCosa.x = TABLERO_SIZE - 1;
		}
		if(posCosa.y >= TABLERO_SIZE){
			posCosa.y = 0;	
			
		}
		if(posCosa.y < 0){
			posCosa.y =	TABLERO_SIZE -1;
		}

	}
}

function scheduleNote( beatNumber, time ) {
    // push the note on the queue, even if we're not playing.
    notesInQueue.push( { note: beatNumber, time: time } );

    if ( (noteResolution==1) && (beatNumber%2))
        return; // we're not playing non-8th 16th notes
    if ( (noteResolution==2) && (beatNumber%4))
        return; // we're not playing non-quarter 8th notes

    // create an oscillator
    
	var osc = audioContext.createOscillator();
	var posCosa = posCosas[0];
	
	if(posCosa.z > 0){
		//aquí sí hacemos eschedule
		posCosa.z = 0;	
		osc.connect( audioContext.destination );
	                // other 16th notes = high pitch
		osc.frequency.value = 280.0;
	    
	   // osc.start( time );
	   // osc.stop( time + noteLength );
	    playSound('cajon_1',time,1);
		
	}else{
		osc.connect( audioContext.destination );
		osc.frequency.value = 820.0;
	    
	   // osc.start( time );
	   // osc.stop( time + noteLength );
	    playSound('cajon_3',time,1);
	}

}

function scheduler() {
    // while there are notes that will need to play before the next interval, 
    // schedule them and advance the pointer.
    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime ) {
        scheduleNote( current16thNote, nextNoteTime );
        nextNote();
    }
}

function play() {
    isPlaying = !isPlaying;

    if (isPlaying) { // start playing
        current16thNote = 0;
        nextNoteTime = audioContext.currentTime;
        timerWorker.postMessage("start");
        return "stop";
    } else {
        timerWorker.postMessage("stop");
        return "play";
    }
}

function resetCanvas (e) {
    // resize the canvas - but remember - this clears the canvas too.
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    //make sure we scroll to the top left.
    window.scrollTo(0,0); 
}
/*
function draw() {
    var currentNote = last16thNoteDrawn;
    var currentTime = audioContext.currentTime;

    while (notesInQueue.length && notesInQueue[0].time < currentTime) {
        currentNote = notesInQueue[0].note;
        notesInQueue.splice(0,1);   // remove note from queue
    }

	var x = Math.floor( canvas.width / (NOTES_SIZE + 2) );
    var y = Math.floor( canvas.height / (NOTES_SIZE + 2) );
    // We only need to draw if the note has moved.
    if (last16thNoteDrawn != currentNote) {
        
        canvasContext.clearRect(0,0,canvas.width, canvas.height); 
        for (var i=0; i<NOTES_SIZE; i++) {
        	for (var j=0; j<NOTES_SIZE; j++) {
	            canvasContext.fillStyle = ( currentNote == i ) ? 
	                ((currentNote%4 === 0)?"red":"blue") : "black";
	            console.log('soy x '+matrix[i][j].x    );
	          
			
				canvasContext.save();
		//		context.setTransform();
				canvasContext.translate(x * (i + 1), y* (j+1));
				var rot = matrix[i][j];
				if(rot.y == 1)
					canvasContext.rotate(Math.PI/2);
				else if(rot.y == -1)
					canvasContext.rotate(-Math.PI/2);
				else if(rot.x == 1)
					canvasContext.rotate(0);
				else if(rot.x == -1)
					canvasContext.rotate(Math.PI/2);
					
				canvasContext.fillRect( 0,0, x/2, y/8 );
				canvasContext.fillRect( x/2+2,0, 5, 5 );
				
				canvasContext.restore();
	            
	           /*  canvasContext.beginPath();
				    canvasContext.moveTo(x * (i + 1), y* (j+1));
				    canvasContext.lineTo(0,0);
				    canvasContext.lineTo(100,25);
				    canvasContext.fill();
				    canvasContext.endPath();*/
				    
			/*}
        }
        last16thNoteDrawn = currentNote;
    }
    
    //renderizamos las cosas sonoras

    canvasContext.fillStyle = "red";
    canvasContext.fillRect( x * (posCosa.x + 1), y * (posCosa.y+1), x/8, y/8 );

    // set up to draw again
    requestAnimFrame(draw);
}*/

function initMetronome(){
    var container = document.createElement( 'div' );

    container.className = "container";
    canvas = document.createElement( 'canvas' );
    canvasContext = canvas.getContext( '2d' );
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight; 
    document.body.appendChild( container );
    //container.appendChild(canvas);    
    canvasContext.strokeStyle = "#ffffff";
    canvasContext.lineWidth = 2;

    // NOTE: THIS RELIES ON THE MONKEYPATCH LIBRARY BEING LOADED FROM
    // Http://cwilso.github.io/AudioContext-MonkeyPatch/AudioContextMonkeyPatch.js
    // TO WORK ON CURRENT CHROME!!  But this means our code can be properly
    // spec-compliant, and work on Chrome, Safari and Firefox.

    audioContext = new AudioContext();

    // if we wanted to load audio files, etc., this is where we should do it.

    window.onorientationchange = resetCanvas;
    window.onresize = resetCanvas;

   // requestAnimFrame(draw);    // start the drawing loop.

    timerWorker = new Worker("js/metronomeworker.js");

    timerWorker.onmessage = function(e) {
        if (e.data == "tick") {
            // console.log("tick!");
            scheduler();
        }
        else
            console.log("message: " + e.data);
    };
    
    timerWorker.postMessage({"interval":lookahead});
    
    posCosas[0] = new THREE.Vector2( 0, 0 );
    
    //init new stuff
    for(var i=0; i<NOTES_SIZE; i++) {
	   matrix[i] = new Array(NOTES_SIZE);
	    for(var j=0; j<NOTES_SIZE; j++) {
	    	if(j <NOTES_SIZE / 3)
	    		matrix[i][j] =   new THREE.Vector2( 0, 1 );
	    	else if(j <NOTES_SIZE / 2)
	    		matrix[i][j] =   new THREE.Vector2( 1, 0 );
    		else 
	    		matrix[i][j] =   new THREE.Vector2( -1, 0 );
	    }
    }
    
    window.elektroWhale.audioContext = new AudioContext();
    loadSounds();
	
}


