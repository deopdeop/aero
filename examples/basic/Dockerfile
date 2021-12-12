FROM golang:1.16-alpine

WORKDIR /app

COPY config.toml ./

COPY *.go ./

RUN go build -o /aero

EXPOSE 8080

CMD [ "/aero" ]
