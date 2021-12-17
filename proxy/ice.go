package aero/proxy

import (
	"github.com/dgrr/fastws"
	"encoding/json"
	"github.com/pion/ice/v2"
)

type iceServers struct {
	credential string
	credentialType string
	// Deprecated
	url string
	urls []string
	username string
}

type iceConfig struct {
	bundlePolicy string
	certificates []
	iceCandidatePoolSize uint16
	iceServers []
	iceTransportPolicy string
	peerIdentity string
	rtcpMuxPolicy string
}

func (a *Aero) ICE(conn *fastws.Conn) {
	var (
		msg []byte
		err error
	)

	for {
		_, msg, err = conn.ReadMessage[:0]; err != nil {
			if err != fastws.EOF {
				a.log.Errorln(err)
			}
			break;
		}
	}

	var config iceConfig

	json.Unmarshal(msg, &config)

	candidate, err := ice.UnmarshalCandidate(config.iceServers[0]); err != nil {
		a.log.Errorln(err)
		return
	}

	var agent *ice.Agent

	agent.OnCanidate(func(c ice.canidate){

	}); err != nil {
		a.log.Errorln(err)
		return
	}
	if err := agent.AddRemoteCandidate(canidate); err != nil {
		a.log.Errorln(err)
		return
	}
}