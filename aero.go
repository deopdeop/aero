package aero

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"strings"

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

// New creates and starts a new Aero instance.
func New(log *logrus.Logger, client *fasthttp.Client, config Config) (*Aero, error) {
	a := &Aero{log: log, client: client, config: config}

	r := router.New()
	r.GET(config.HTTP.Prefix+"{filepath:*}", a.http)
	r.ServeFiles("/{filepath:*}", config.HTTP.Static)
	// Websocket support.

	srv := &fasthttp.Server{Handler: r.Handler}
	if config.SSL.Enabled {
		http2.ConfigureServer(srv)
		return a, srv.ListenAndServeTLS(config.HTTP.Addr, config.SSL.Cert, config.SSL.Key)
	}
	return a, srv.ListenAndServe(config.HTTP.Addr)
}

// http handles the HTTP proxy requests.
func (a *Aero) http(ctx *fasthttp.RequestCtx) {
	uri := strings.TrimPrefix(string(ctx.URI().PathOriginal()), a.config.HTTP.Prefix)

	req := &fasthttp.Request{}
	req.SetRequestURI(uri)

	ctx.Request.Header.VisitAll(func(k, v []byte) {
		switch string(k) {
		// Only delete the Service-Worker if the service worker isn't the interceptor.
		case "Accept-Encoding", "Cache-Control", "Sec-Gpc", "Sec-Fetch-Site", "Sec-Fetch-Mode", "Sec-Fetch-Dest", "Service-Worker", "X-Forwarded-For", "X-Forwarded-Host":
			// Do nothing, so these headers aren't added.
		case "Host":
			//req.Header.SetBytesKV(k, req.URI().Host())
		case "Referer":
			//req.Header.SetBytesKV(k, ctx.Request.Header.Peek("_referrer"))
		default:
			req.Header.SetBytesKV(k, v)
		}
	})

	var resp fasthttp.Response
	err := a.client.Do(req, &resp)
	if err != nil {
		a.log.Errorln(err)
		return
	}

	delHeaders := make(map[string]string)
	resp.Header.VisitAll(func(k, v []byte) {
		sk := string(k)
		switch sk {
		case "Access-Control-Allow-Origin", "Alt-Svc", "Cache-Control", "Content-Encoding", "Content-Length", "Content-Security-Policy", "Cross-Origin-Resource-Policy", "Permissions-Policy", "Set-Cookie", "Set-Cookie2", "Service-Worker-Allowed", "Strict-Transport-Security", "Timing-Allow-Origin", "X-Frame-Options", "X-Xss-Protection":
			delHeaders[sk] = string(v)
		case "Location":
			ctx.Response.Header.SetBytesKV(k, append([]byte(a.config.HTTP.Prefix), v...))
		default:
			ctx.Response.Header.SetBytesKV(k, v)
		}
	})

	// Don't let any requests escape origin.
	ctx.Response.Header.Set("Cross-Origin-Opener-Policy", "same-origin-allow-popups")
	ctx.Response.Header.Set("Cross-Origin-Embedder-Policy", "require-corp")
	ctx.Response.Header.Set("Cross-Origin-Resource-Policy", "same-origin")
	// Allow service worker to be registered at the root
	ctx.Response.Header.Set("Service-Worker-Allowed", "/")

	ctx.Response.SetStatusCode(resp.StatusCode())

	body := resp.Body()
	cors, err := json.Marshal(delHeaders)
	if err != nil {
		a.log.Errorln(err)
		return
	}

	switch strings.Split(string(resp.Header.Peek("Content-Type")), ";")[0] {
	case "text/html", "text/x-html":
		script, err := ioutil.ReadFile("index.js")
		if err != nil {
			fmt.Print(err)
		}

		body = []byte(`
		<!DOCTYPE html>
		<html>
			<head>
				<meta charset=utf-8>

				<!--Reset favicon-->
				<link href=data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABmJLR0T///////8JWPfcAAAACXBIWXMAAABIAAAASABGyWs+AAAAF0lEQVRIx2NgGAWjYBSMglEwCkbBSAcACBAAAeaR9cIAAAAASUVORK5CYII= rel="icon" type="image/x-icon"/>
			</head>
			<body>
				<script type=module>
					'use strict';

					const ctx = {
						cors: ` + string(cors) + `,
						prefix: '` + a.config.HTTP.Prefix + `',
						url: new URL('` + uri + `')
					};

					` + string(script) + `
				</script>
				</body>
		</html>
		`)
	}
	ctx.SetBody(body)
}
