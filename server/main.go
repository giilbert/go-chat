package main

import (
	"fmt"
	"net/http"
	"sync"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/mitchellh/mapstructure"
)

type State struct {
	m           sync.Mutex
	connections map[uuid.UUID]*websocket.Conn
}

func (s *State) BroadcastAll(msg any) error {
	for _, c := range s.connections {
		err := c.WriteJSON(msg)
		if err != nil {
			return err
		}
	}

	return nil
}

var wsupgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true }, // allow any origin
}

func wsHandler(w http.ResponseWriter, r *http.Request, s *State) {
	conn, err := wsupgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Printf("Failed to set websocket upgrade: %+v\n", err)
		return
	}

	var handshake In[InHandshake]
	err = conn.ReadJSON(&handshake)
	if err != nil {
		fmt.Printf("Failed to read websocket handshake: %+v\n", err)
		return
	}

	id := uuid.New()

	fmt.Println("websocket connected. id:", id, "name:", handshake.Data.Name)

	err = conn.WriteJSON(Out{
		Type: "Id",
		Data: OutId{
			Id: id,
		},
	})

	if err != nil {
		fmt.Printf("Failed to send websocket id: %+v\n", err)
	}

	s.m.Lock()
	s.connections[id] = conn
	s.m.Unlock()

	for {
		var data In[any]
		err = conn.ReadJSON(&data)
		if err != nil {
			fmt.Printf("Failed to unmarshall websocket data: %+v\n", err)
			break
		}

		switch data.Type {
		case "Send":
			var d InSend
			err = mapstructure.Decode(data.Data, &d)
			if err != nil {
				fmt.Printf("Failed to decode Data field: %+v\n", err)
				break
			}
			s.BroadcastAll(Out{
				Type: "Message",
				Data: OutMessage{
					From: Author{
						Id:   id,
						Name: handshake.Data.Name,
					},
					Message: d.Message,
				},
			})

		default:
			fmt.Println("user sent unknown message type")
			break
		}
	}

	s.connections[id].Close()
	s.m.Lock()
	delete(s.connections, id)
	s.m.Unlock()
}

func main() {
	s := State{
		connections: make(map[uuid.UUID]*websocket.Conn),
	}
	r := gin.Default()

	r.GET("/", func(c *gin.Context) {
		c.String(200, "hello!!")
	})
	r.GET("/ws", func(c *gin.Context) {
		wsHandler(c.Writer, c.Request, &s)
	})

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"*"},
		AllowCredentials: true,
	}))

	r.Run()
}
