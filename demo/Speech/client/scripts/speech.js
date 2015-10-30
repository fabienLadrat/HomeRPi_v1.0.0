// Initialisation de la reconnaissance vocale en fonction du navigateur
// Pour l'instant, seul Google Chrome le supporte
var SpeechRecognition = SpeechRecognition ||
                          webkitSpeechRecognition ||
                          mozSpeechRecognition ||
                          msSpeechRecognition ||
                          oSpeechRecognition;
						  
var recognition;
var lastStartedAt;
						  
if (!SpeechRecognition) {
	console.log('Pas de reconnaissance vocale disponible');
	alert('Pas de reconnaissance vocale disponible');
} else {
	
	// Arr�t de l'ensemble des instances d�j� d�marr�es
    	if (recognition && recognition.abort) {
		recognition.abort();
    	}
	
	// Initialisation de la reconnaissance vocale
	recognition = new SpeechRecognition();
	// Reconnaissance en continue
	recognition.continuous = true;
	// Langue fran�aise
	recognition.lang = 'fr-FR';
	
	// Ev�nement de d�but de la reconnaissance vocale
	recognition.onstart = function() {
		console.log('D�marrage de la reconnaissance');
	};
	
	// Ev�nement de fin de la reconnaissance vocale
	// A la fin de la reconnaissance (timeout), il est n�cessaire de la red�marrer pour avoir une reconnaissance en continue
	// Ce code a �t� repris de annyang
	recognition.onend = function() {
		console.log('Fin de la reconnaissance');
		var timeSinceLastStart = new Date().getTime()-lastStartedAt;
		if (timeSinceLastStart < 1000) {
			setTimeout(demarrerReconnaissanceVocale, 1000-timeSinceLastStart);
		} else {
			// D�marrage de la reconnaissance vocale
			demarrerReconnaissanceVocale();
		}
	};

	// Ev�nement de r�sultat de la reconnaissance vocale
	recognition.onresult = function (event) {
		for (var i = event.resultIndex; i < event.results.length; ++i) {
			var texteReconnu = event.results[i][0].transcript;
			console.log('R�sultat = ' + texteReconnu);
			// Synth�se vocale de ce qui a �t� reconnu
			var u = new SpeechSynthesisUtterance();
			u.text = texteReconnu;
			u.lang = 'fr-FR';
			u.rate = 1.2;
			speechSynthesis.speak(u);
		}
	};
	
	// D�marrage de la reconnaissance vocale
	demarrerReconnaissanceVocale();
}

function demarrerReconnaissanceVocale() {
	// D�marrage de la reconnaissance vocale
	lastStartedAt = new Date().getTime();
    	recognition.start();
}
