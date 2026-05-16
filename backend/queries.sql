Create table users(
    id serial primary key,
    email varchar(100) not null unique,
    password Varchar(100);
)