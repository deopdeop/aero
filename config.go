package aero

// Config is the configuration of an Aero instance.
type Config struct {
	// SSL contains the SSL configuration information.
	SSL struct {
		// Cert is the path to the SSL certificate file.
		Cert string
		// Key is the path to the SSL key file.
		Key string
		// Enabled indicates whether SSL is enabled.
		Enabled bool
	}
	HTTP struct {
		// Addr is the address the proxy will listen on.
		Addr string
		// Prefix is the prefix used to access the HTTP proxy.
		Prefix string
		// Static is the path to the static files.
		Static string
	}
	WS struct {
		// Prefix is the prefix used to access the WebSocket proxy.
		Prefix string
	}
}

// DefaultConfig returns a configuration with the default values filled out.
func DefaultConfig() Config {
	config := Config{}
	config.SSL.Cert = "cert.pem"
	config.SSL.Key = "key.pem"
	config.HTTP.Addr = ":3000"
	config.HTTP.Prefix = "/http/"
	config.WS.Prefix = "/ws/"
	config.HTTP.Static = "static"
	return config
}
