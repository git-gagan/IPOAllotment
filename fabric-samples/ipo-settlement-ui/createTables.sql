-- sqlite
.open ./ipo.db
--- Create table commands
CREATE table tbl_user(
	user_id varchar(50) PRIMARY KEY,
	user_name varchar(50),
	user_pwd varchar(50)
);

CREATE table tbl_role(
	role_id varchar(50) PRIMARY KEY,
	role_name varchar(50)
);

CREATE TABLE tbl_userrole(
	user_id varchar(50) PRIMARY KEY,
	role_id varchar(50),
	FOREIGN Key (user_id) REFERENCES tbl_user(user_id),
	FOREIGN KEY (role_id) REFERENCES tbl_role(role_id)
);


CREATE TABLE tbl_investor_type (
    investor_type_id int PRIMARY KEY,
    investor_type varchar(50),
    description varchar(100)
);

CREATE TABLE tbl_investor_info (
    investor_id varchar(50) PRIMARY KEY,
    dp_id int,
    investor_name varchar(50),
    investor_type int,
    country_domicile varchar(50),
    demat_ac_no int,
    custodian_id int,
    bank_account_no int,
    ifsc_code varchar(50),
    lei varchar(50),
    swift_address varchar(50),
    FOREIGN KEY (investor_type) REFERENCES tbl_investor_type(investor_type_id)
);

CREATE TABLE tbl_ipo_info (
	ipo_id varchar(50) PRIMARY KEY,
	issuer_name varchar(50),
	ISIN varchar(50),
	CUSIP varchar(50),
	ticker varchar(50),
	bid_time integer,
	is_complete integer,
	has_bidding_started INTEGER,
	bid_start_date datetime,
	ipo_announcement_date datetime,
	allotment_principle INT,
	foreign key (ipo_id) references tbl_user(user_id),
	FOREIGN KEY (allotment_principle) REFERENCES tbl_allotment_principle(id)
);

CREATE TABLE tbl_investor_transactions (
	id integer primary key AUTOINCREMENT,
	investor_id varchar(50),
	ipo_id varchar(50),
	lots_bid integer,
	bid_amount integer,
	time_of_bid datetime,
	foreign key (investor_id) references tbl_investor_info(investor_id)
);

CREATE TABLE tbl_allotment_principle(
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name varchar(50),
	description varchar(50)
);


CREATE TABLE tbl_investor_ipo_eligibility(
	id INTEGER PRIMARY Key AUTOINCREMENT,
	ipo_id varchar(50),
	investor_type_id INT,
	min_lot_size INT,
	FOREIGN KEY (ipo_id) REFERENCES tbl_ipo_info(ipo_id),
	FOREIGN KEY (investor_type_id) REFERENCES tbl_investor_type(investor_type_id)
);

CREATE TABLE tbl_ipo_bucket(
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	ipo_id varchar(50),
	investor_type_id INT,
	no_of_shares INT,
	priority INT,
	FOREIGN KEY (ipo_id) REFERENCES tbl_ipo_info(ipo_id),
	FOREIGN KEY (investor_type_id) REFERENCES tbl_investor_type(investor_type_id)
);




