<?php 

/*
 @nom: settings
 @auteur: Idleman (idleman@idleman.fr)
 @description: Page de gestion de toutes les préférences/configurations administrateur
 */

require_once('header.php'); 

$db = (file_exists(PATH_BDD)?Functions::unstore():array());
$tpl->assign('places', $db['places']);
$tpl->assign('engines', $db['engines']);




$view = "settings";
require_once('footer.php'); ?>
