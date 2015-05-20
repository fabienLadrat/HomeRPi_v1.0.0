sqlite3 homeRPi.db
create table history_action(id INTEGER, command_executed VARCHAR(255), date_last_execution DATE, device VARCHAR(255), state_device VARCHAR(10), text_action VARCHAR(255), vocal_action VARCHAR(255));

-- liste des champs
-- id INT
-- command_executed VARCHAR(255)
-- date_last_execution DATE
-- device VARCHAR(255)
-- state_device VARCHAR(10)
-- text_action VARCHAR(255)
-- vocal_action VARCHAR(255)

insert into history_action(id, command_executed, date_last_execution, device, state_device, text_action, vocal_action) values (1,'./hcc/hcc/radioEmission 7 16801622 3 off', new Date(), 'volet roulant', 'off', 'ferme le volet', 'ferme le volet !');

insert into history_action(id, command_executed, date_last_execution, device, state_device, text_action, vocal_action) values (1,'./hcc/hcc/radioEmission 7 16801622 3 off', date('now'), 'volet roulant', 'off', 'ferme le volet', 'ferme le volet !');

