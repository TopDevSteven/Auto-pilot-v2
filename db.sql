create table stocktb(
	id varchar(20) primary key unique,
	name varchar(30),
	lastsale varchar(30),
	netchange varchar(20),
	pctchange varchar(20),
	volume varchar(20),
	marketcap varchar(20),
	country varchar(20),
	ipoyear varchar(20),
	industry varchar(20),
	sector varchar(20),
	url varchar(30)
)