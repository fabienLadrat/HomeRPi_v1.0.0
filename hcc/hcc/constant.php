<?php

	//Numéro WiringPi du pin raspberry branché a l'emetteur radio
	define('PIN',0);
	//Code télécommande du raspberry (ne dois pas exceder les 2^26)
	define('SENDER',666);
	//Identifiant admin
	define('EMAIL','admin');
	//Mot de passe admin
	define('PASSWORD','admin');
	//Répertoire de stockage des images
	define('PICTURE_FOLDER','pictures');

	
//========= A partir d'ici, ne pas changer sous peine de causer  ========
//========= la mort de nombreux chattons ================================
	
	//Theme graphique
	define('DEFAULT_THEME','hcc');
	//Numéro de version
	define('VERSION_NUMBER','1.0');
	
	//Je ne vous ferais pas l'affront de vous dire ce que c'est
	define('ON','on');
	define('OFF','off');
	
	//Nom de la base
	define('PATH_BDD','db.json');
	

	?>