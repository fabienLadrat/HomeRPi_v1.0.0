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

--insert into history_action(id, command_executed, date_last_execution, device, state_device, text_action, vocal_action) values (1,'./hcc/hcc/radioEmission 7 16801622 3 off', new Date(), 'volet roulant', 'off', 'ferme le volet', 'ferme le volet !');

--insert into history_action(id, command_executed, date_last_execution, device, state_device, text_action, vocal_action) values (1,'./hcc/hcc/radioEmission 7 16801622 3 off', date('now'), 'volet roulant', 'off', 'ferme le volet', 'ferme le volet !');

create table device(id INTEGER, device_name VARCHAR(255), device_libelle VARCHAR(255), physical_id INTEGER, device_count INTEGER, device_type VARCHAR(255));

insert into device(id, device_name, device_libelle, physical_id, device_count, device_type) values (1, 'light_1', 'Lampe 1', 0, 1, 'light');
insert into device(id, device_name, device_libelle, physical_id, device_count, device_type) values (2, 'light_2', 'Lampe 2', 1, 2, 'light');
insert into device(id, device_name, device_libelle, physical_id, device_count, device_type) values (3, 'light_3', 'Lampe 3', -1, 3, 'light');
insert into device(id, device_name, device_libelle, physical_id, device_count, device_type) values (4, 'store_1', 'Volet Roulant', 2, 1, 'store');
insert into device(id, device_name, device_libelle, physical_id, device_count, device_type) values (5, 'clim_1', 'Climatisation', -1, 1, 'ventil');
insert into device(id, device_name, device_libelle, physical_id, device_count, device_type) values (6, 'ventilateur_1', 'Ventilateur 1', -1, 1, 'ventil');

create table params(param_name VARCHAR(255), param_value VARCHAR(255));
insert into params(param_name, param_value) values ('heure_reveil','7');
insert into params(param_name, param_value) values ('minute_reveil','0');
-- put this 5 params into global_state table
--insert into params(param_name, param_value) values ('etat_store','N/A');
--insert into params(param_name, param_value) values ('home_presence','true');
--insert into params(param_name, param_value) values ('job_presence','false');
-- TO INSERT 
--insert into params(param_name, param_value) values ('etat_lampe_salon','N/A');
--insert into params(param_name, param_value) values ('etat_lampe_chambre','N/A');
--
insert into params(param_name, param_value) values ('Lampe Chambre','0');--A1
insert into params(param_name, param_value) values ('Rpi Chambre','1');--A2
insert into params(param_name, param_value) values ('Volet Roulant','2');--A3

insert into params(param_name, param_value) values ('Volet Roulant','4');--B1
insert into params(param_name, param_value) values ('Lampe Baie Vitrée','5');--B2
insert into params(param_name, param_value) values ('Lampe Bar','6');--B3

insert into params(param_name, param_value) values ('Lampe Chambre Telecommande Chambre','1');
insert into params(param_name, param_value) values ('Rpi Chambre Telecommande Chambre','2');
insert into params(param_name, param_value) values ('Volet Roulant Telecommande Chambre','3');

-- 0 a 15
insert into params(param_name, param_value) values ('Code Telecommande 4 Canaux','16517546');
insert into params(param_name, param_value) values ('Code Telecommande Chambre','16801622');


create table global_state(etat_store VARCHAR(255), etat_lampe_salon VARCHAR(255), etat_lampe_chambre VARCHAR(255), home_presence VARCHAR(255), job_presence VARCHAR(255));

insert into global_state(etat_store,etat_lampe_salon,etat_lampe_chambre,home_presence,job_presence)values('on','off','off','true','false');

commit;