package aero

import (
	_ "embed"
	"github.com/aero/http.go"
	"github.com/aero/ice.go"
	"github.com/dgrr/http2"
	"github.com/fasthttp/router"
	"github.com/sirupsen/logrus"
	"github.com/valyala/fasthttp"
)

// Aero represents an instance of the Aero proxy.
type Aero struct {
	log    *logrus.Logger
	client *fasthttp.Client
	config Config
}

// Creates and starts a new Aero instance.
func New(log *logrus.Logger, client *fasthttp.Client, config Config) (*Aero, error) {
	a := &Aero{log: log, client: client, config: config}

	r := router.New()
	r.GET(config.HTTP.Prefix + "{filepath:*}", a.http)
	r.GET("/ice" + "{filepath:*}", fastws.Upgrade())
	// TODO: Don't serve ts files
	r.ServeFiles("/{filepath:*}", config.HTTP.Prefix)

	srv := &fasthttp.Server{Handler: r.Handler}
	if config.SSL.Enabled {
		http2.ConfigureServer(srv)
		return a, srv.ListenAndServeTLS(config.HTTP.Port, config.SSL.Cert, config.SSL.Key)
	}
	return a, srv.ListenAndServe(config.HTTP.Port)
}
