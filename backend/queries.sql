Create table users(
    id serial primary key,
    email varchar(100) not null unique,
    password varchar(100),
    role varchar(20) default 'user'
);

Create table jobs(
    id serial primary key,
    user_id integer references users(id) on delete cascade,
    title varchar(255) not null,
    description text not null,
    image_data text,
    created_at timestamp default current_timestamp
);