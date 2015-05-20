<?php
/*
 @nom: index
 @auteur: Idleman (idleman@idleman.fr)
 @description:  Page d'accueil et de lecture des flux
*/

require_once('header.php'); 
$db = (file_exists(PATH_BDD)?Functions::unstore():array());
asort($db['engines']);
$tpl->assign('engines',$db['engines']);
$places = (isset($db['places'])?$db['places']:array());
asort($places);
$tpl->assign('places',$places);
$view = 'index';
require_once('footer.php'); 
?>