function findCommand(speakingText){
	// propertie a utiliser
	// https://www.npmjs.com/package/properties-reader

	// variable qui contiendra l'ordre a effectuer
	var commandToExecute = "";

	// on remplace les espaces par des points pour verifier si la commande existe telle quel :
	var concatSpeakingText = speakingText.replace(" ",".");
	// on cherche dans le propertie
	// si on trouve, on sort
	return commandToExecute;
	
	// on split la requete pour identifier des mots
	var splittedSpeakingText = speakingText.split(" ");
	
	for(var i= 0; i < splittedSpeakingText.length; i++){
		 console.log(splittedSpeakingText[i]);
		 // on recupere l'ensemble des commandes possibles pour chaque mot
	}
	
	// si aucune correspondance n'a été trouvé :
	// implementer l'apprentissage des commandes
	
	// pour le moment, on repond que la commande est inconnue.
	commandToExecute = "Désolé, je connais pas cet ordre :-(";
	return commandToExecute;
}

function readingPropertieFile(){
	var readline = require("/node-readline.js");

	var source="/scripts/node-readline/demosrc.htm";

	var r=readline.fopen(source,"r");
	if(r===false){
	   console.log("Error, can't open ", source);
	   process.exit(1);
	} 

	do{
	   var line=readline.fgets(r);
	   console.log(line);
	}while (!readline.eof(r));
	readline.fclose(r);
}

function findPossibleCommand(theWord){
	var tabCommand;
	return tabCommand;
}

function intersectPossibleCommand(){
	
}