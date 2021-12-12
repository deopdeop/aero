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
	// Server contains the server configuration information.
	Server struct {
		// Addr is the address the proxy will listen on.
		Addr string
		// Path is the path that should be used to access the proxy.
		Path string
	}
}

// DefaultConfig returns a configuration with the default values filled out.
func DefaultConfig() Config {
	conf := Config{}
	conf.SSL.Cert = "cert.pem"
	conf.SSL.Key = "key.pem"
	conf.Server.Addr = ":80"
	conf.Server.Path = "static/"
	return conf
}
