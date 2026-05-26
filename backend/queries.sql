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

Create table applications(
    id serial primary key,
    job_id integer references jobs(id) on delete cascade,
    user_id integer references users(id) on delete cascade,
    created_at timestamp default current_timestamp,
    unique(job_id, user_id)
);

-- Note: The following columns are automatically migrated/added to the 'users' table on backend server startup:
-- ALTER TABLE users ADD COLUMN resume_text TEXT;
-- ALTER TABLE users ADD COLUMN resume_skills TEXT; -- Stores JSON array of parsed skills (e.g. ["react", "node.js"])
-- ALTER TABLE users ADD COLUMN resume_filename VARCHAR(255);