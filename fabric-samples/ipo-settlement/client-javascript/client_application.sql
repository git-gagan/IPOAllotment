/*
    Sql scripts for data models created on the client side
*/

create table tbl_role(
    role_id int primary key,
    role_name varchar
);

create table tbl_userrole(
    userrole_id int primary key,
    role_id int foreign key references tbl_role(role_id),
    user_id int foreign key references tbl_user(user_id)
);

create table tbl_userrole(
    userrole_id int primary key,
    role_id int,
    user_id int,
    foreign key (role_id) references tbl_role(role_id),
    foreign key (user_id) references tbl_user(user_id)
);