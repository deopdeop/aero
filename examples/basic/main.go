package main

import (
	"fmt"
	"github.com/pelletier/go-toml"
	"github.com/sirupsen/logrus"
	"github.com/titaniumnetwork-dev/aero"
	"github.com/valyala/fasthttp"
	"io/ioutil"
	"os"
)

// This example demonstrates usage of a trivial Aero instance.
func main() {
	log := logrus.New()
	log.Formatter = &logrus.TextFormatter{ForceColors: true}
	log.Level = logrus.DebugLevel

	config, err := readConfig()
	if err != nil {
		log.Fatal(err)
	}

	_, err = aero.New(log, &fasthttp.Client{
		ReadBufferSize:  8196,
		WriteBufferSize: 8196,
	}, config)
	if err != nil {
		log.Fatal(err)
	}
}

// readConfig creates an Aero config if it doesn't exist already and then reads it.
func readConfig() (aero.Config, error) {
	if _, err := os.Stat("config.toml"); os.IsNotExist(err) {
		config := aero.DefaultConfig()
		data, err := toml.Marshal(config)
		if err != nil {
			return aero.Config{}, fmt.Errorf("failed marshalling default config: %v", err)
		}
		if err = ioutil.WriteFile("config.toml", data, 0644); err != nil {
			return aero.Config{}, fmt.Errorf("failed writing config: %v", err)
		}
		return config, nil
	}
	var config aero.Config
	data, err := ioutil.ReadFile("config.toml")
	if err != nil {
		return aero.Config{}, fmt.Errorf("error reading config: %v", err)
	}
	if err = toml.Unmarshal(data, &config); err != nil {
		return aero.Config{}, fmt.Errorf("error unmarshalling config: %v", err)
	}
	return config, nil
}
