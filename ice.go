import (
	"github.com/dgrr/fastws"
	"encoding/json"
	"github.com/pion/ice/v2"
)

type Config struct {
	bundlePolicy string
}

func (a *Aero) Handler(conn *fastws.Conn) {
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

	var config Config[]

	json.Unmarshal(msg, &config)

	canidate, err := ice.UnmarshalCandidate(config.iceServers); err != nil {
		a.log.Errorln(err)
		return
	}

	var agent *ice.Agent

	if err := agent.AddRemoteCandidate(canidate); err != nil {
		a.log.Errorln(err)
		return
	}
}