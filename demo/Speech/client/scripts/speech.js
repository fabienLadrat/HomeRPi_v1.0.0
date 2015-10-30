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
	
	// Arrêt de l'ensemble des instances déjà démarrées
    	if (recognition && recognition.abort) {
		recognition.abort();
    	}
	
	// Initialisation de la reconnaissance vocale
	recognition = new SpeechRecognition();
	// Reconnaissance en continue
	recognition.continuous = true;
	// Langue française
	recognition.lang = 'fr-FR';
	
	// Evènement de début de la reconnaissance vocale
	recognition.onstart = function() {
		console.log('Démarrage de la reconnaissance');
	};
	
	// Evènement de fin de la reconnaissance vocale
	// A la fin de la reconnaissance (timeout), il est nécessaire de la redémarrer pour avoir une reconnaissance en continue
	// Ce code a été repris de annyang
	recognition.onend = function() {
		console.log('Fin de la reconnaissance');
		var timeSinceLastStart = new Date().getTime()-lastStartedAt;
		if (timeSinceLastStart < 1000) {
			setTimeout(demarrerReconnaissanceVocale, 1000-timeSinceLastStart);
		} else {
			// Démarrage de la reconnaissance vocale
			demarrerReconnaissanceVocale();
		}
	};

	// Evènement de résultat de la reconnaissance vocale
	recognition.onresult = function (event) {
		for (var i = event.resultIndex; i < event.results.length; ++i) {
			var texteReconnu = event.results[i][0].transcript;
			console.log('Résultat = ' + texteReconnu);
			// Synthèse vocale de ce qui a été reconnu
			var u = new SpeechSynthesisUtterance();
			u.text = texteReconnu;
			u.lang = 'fr-FR';
			u.rate = 1.2;
			speechSynthesis.speak(u);
		}
	};
	
	// Démarrage de la reconnaissance vocale
	demarrerReconnaissanceVocale();
}

function demarrerReconnaissanceVocale() {
	// Démarrage de la reconnaissance vocale
	lastStartedAt = new Date().getTime();
    	recognition.start();
}
