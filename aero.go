package aero

import (
	_ "embed"
	"encoding/base64"
	"encoding/json"
	"github.com/fasthttp/http2"
	"github.com/fasthttp/router"
	"github.com/sirupsen/logrus"
	"github.com/valyala/fasthttp"
	"strings"
)

//go:embed script.js
var script string

//go:embed middleware/*
var mw embed.FS

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
	r.GET(config.HTTP.Prefix + "{filepath:*}", a.handleRequest)
	// TODO: Don't serve ts files
	r.ServeFiles("/{filepath:*}", config.Server.Prefix)

	srv := &fasthttp.Server{Handler: r.Handler}
	if config.SSL.Enabled {
		http2.ConfigureServer(srv)
		return a, srv.ListenAndServeTLS(config.Server.Addr, config.SSL.Cert, config.SSL.Key)
	}
	return a, srv.ListenAndServe(config.Server.Addr)
}

// handleRequest handles a fasthttp request.
func (a *Aero) handleRequest(ctx *fasthttp.RequestCtx) {
	// Can this be done with bytes?
	uri := strings.TrimPrefix(string(ctx.URI().PathOriginal()), config.HTTP.Prefix)

	req := &fasthttp.Request{}

	req.SetRequestURI(uri)

	ctx.Request.Header.VisitAll(func(key, value []byte) {
		switch key {
		// Only delete the Service-Worker if the service worker isn't the interceptor
		case "Accept-Encoding", "Cache-Control", "Service-Worker", "X-Forwarded-For", "X-Forwarded-Host":
			// Do nothing, so these headers aren't added.
		case "Host":
			req.Header.SetBytesKV(key, req.URI().Host())
		case "Referrer":
			req.Header.SetBytesKV(key, ctx.Request.Header.Peek("_referer"))
		default:
			req.Header.SetBytesKV(key, value)
		}
	})

	var response fasthttp.Response
	err := a.client.Do(req, &response)
	if err != nil {
		a.log.Errorln(err)
		return
	}

	cors := make(map[string]string)
	response.Header.VisitAll(func(key, value []byte) {
		parsedKey := string(key)
		switch parsedKey {
		case "Access-Control-Allow-Origin", "Alt-Svc", "Cache-Control", "Content-Encoding", "Content-Length", "Content-Security-Policy", "Cross-Origin-Resource-Policy", "Permissions-Policy", "Set-Cookie", "Set-Cookie2", "Service-Worker-Allowed", "Strict-Transport-Security", "Timing-Allow-Origin", "X-Frame-Options", "X-Xss-Protection":
			cors[parsedKey] = string(value)
		case "Location":
			ctx.Response.Header.SetBytesKV(key, append(byte[](config.HTTP.Prefix), value))
		default:
			ctx.Response.Header.SetBytesKV(key, value)
		}
	})

	// Don't let any requests escape origin.
	ctx.Response.Header.Set("Cross-Origin-Opener-Policy", "same-origin-allow-popups")
	ctx.Response.Header.Set("Cross-Origin-Embedder-Policy", "require-corp")
	ctx.Response.Header.Set("Cross-Origin-Resource-Policy", "same-origin")
	ctx.Response.Header.Set("Service-Worker-Allowed", config.HTTP.Prefix)

	ctx.Response.SetStatusCode(response.StatusCode())

	resp := response.Body()
	corsJSON, err := json.Marshal(cors)
	if err != nil {
		a.log.Errorln(err)
		return
	}

	switch strings.Split(string(response.Header.Peek("Content-Type")), ";")[0] {
	case "text/html", "text/x-html":
		resp = []byte(`
        	<!DOCTYPE html>
        	<html>
        	  <head>
        	    <meta charset="utf-8">

        	    <!-- Reset favicon -->
        	    <link href="data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABmJLR0T///////8JWPfcAAAACXBIWXMAAABIAAAASABGyWs+AAAAF0lEQVRIx2NgGAWjYBSMglEwCkbBSAcACBAAAeaR9cIAAAAASUVORK5CYII=" rel="icon" type="image/x-icon"/>
        	  </head>
        	  <body>
        	    <script>
        	      	'use strict'

        	      	let ctx = {
						// TODO: Instead of using b64 use escape regex
        	        	body: atob('` + base64.StdEncoding.EncodeToString(resp) + `'),
        	        	cors: ` + string(corsJSON) + `,
        	        	url: new URL('` + uri + `')
        	      	};
		
        	      ` + script + `
        	    </script>
        	  </body>
        	</html>
		`)
	end
	ctx.SetBody(resp)
}