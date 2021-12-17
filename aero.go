package aero

import (
	_ "embed"
	"aero/proxy"
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
	r.GET(config.HTTP.Prefix + "{filepath:*}", proxy.http)
	r.GET(config.ICE.Prefix + "{filepath:*}", fastws.Upgrade(proxy.ice))
	// TODO: Don't serve ts files
	r.ServeFiles("/{filepath:*}", config.HTTP.Prefix)

	s := &fasthttp.Server{Handler: r.Handler}
	if config.SSL.Enabled {
		http2.ConfigureServer(s)
		return a, s.ListenAndServeTLS(conf.HTTP.Port, config.SSL.Cert, config.SSL.Key)
	}
	return a, s.ListenAndServe(conf.HTTP.Port)
}
