FROM ubuntu:18.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PGVER 12

RUN apt-get update && apt-get install -y wget gnupg && \
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
RUN echo "deb http://apt.postgresql.org/pub/repos/apt bionic-pgdg main" > /etc/apt/sources.list.d/PostgreSQL.list

RUN apt -y update && apt install -y postgresql-$PGVER

WORKDIR DB
COPY . .

USER postgres
RUN /etc/init.d/postgresql start &&\
    psql --command "CREATE USER docker WITH SUPERUSER PASSWORD 'docker';" &&\
    createdb -O docker docker &&\
    psql -d docker -c "CREATE EXTENSION IF NOT EXISTS citext;" &&\
    psql docker -a -f config/init.sql &&\
    /etc/init.d/postgresql stop

RUN echo "host all  all    0.0.0.0/0  md5" >> /etc/postgresql/$PGVER/main/pg_hba.conf
RUN cat postgres_config.conf >> /etc/postgresql/$PGVER/main/postgresql.conf

EXPOSE 5432
VOLUME  ["/etc/postgresql", "/var/log/postgresql", "/var/lib/postgresql"]


USER root
WORKDIR /home/app
COPY ./package.json /home/app/package.json
RUN apt-get update
RUN apt-get -y install curl gnupg
RUN curl -sL https://deb.nodesource.com/setup_14.x  | bash -
RUN apt-get -y install nodejs
RUN apt-get install -y build-essential
RUN cd /DB && npm install

EXPOSE 5000

CMD service postgresql start && node --experimental-modules /DB/server.js
