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
		Prefix string
	}
	ICE struct {
		Prefix string
	}
	WS struct {
		Prefix string
	}
}

// DefaultConfig returns a configuration with the default values filled out.
func DefaultConfig() Config {
	config := Config{}
	config.SSL.Cert = "cert.pem"
	config.SSL.Key = "key.pem"
	config.Server.Addr = ":3000"
	config.HTTP.Prefix = "/http"
	config.ICE.Prefix = "/ice"
	config.WS.Prefix = "/ws"

	return conf
}
