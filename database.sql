create table if not exists users
(
    user_id       bigserial primary key,
    first_name    text not null,
    is_premium    boolean,
    language_code text,
    username      text,
    timezone      text
);

create table if not exists reminders
(
    id                          bigserial primary key,
    user_id                     bigint      not null,
    reminder_text               text        not null,
    reminder_timestamp          timestamptz not null,
    reminder_creation_timestamp timestamptz not null,
    foreign key (user_id) references users (user_id) on delete cascade
);

