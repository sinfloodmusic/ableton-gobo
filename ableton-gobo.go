package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"github.com/gorilla/websocket"
	"github.com/satori/go.uuid"
	"net"
	"net/http"
	"github.com/antonholmquist/jason"
	"github.com/hypebeast/go-osc/osc"
	"github.com/gorilla/mux"
	"flag"
)

var DebugMode bool

const GoBoHTTPListeningPort = "8100"
const GoBoUDPListeningPort = ":8080"
const AbletonListeningPort = 9999
const AbletonListeningHost = "localhost"

func SendUDPMessageToAbleton(abletonCommand string, index string) {
	client := osc.NewClient(AbletonListeningHost, AbletonListeningPort)
	msg := osc.NewMessage(abletonCommand)
	msg.Append(index)
	client.Send(msg)
}

func AbletonTriggerScene(sceneIndex string) {
	SendUDPMessageToAbleton("/play", sceneIndex)
}
func AbletonStopAllScenes() {
	SendUDPMessageToAbleton("/stop", "");
}
func AbletonListAllScenes() {
	SendUDPMessageToAbleton("/list", "");
}

func AbletonGetStatus() {
	SendUDPMessageToAbleton("/status", "");
}

//	Manages conections from WebSocket clients
type ClientManager struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	abletonCommands chan []byte
}

//	WebSocket client
type Client struct {
	id     string
	socket *websocket.Conn
	send   chan []byte
}

//	Messages to/from WebSocket clients
type Message struct {
	Sender    string `json:"sender,omitempty"`
	Recipient string `json:"recipient,omitempty"`
	Content   string `json:"content,omitempty"`
	Payload   string `json:"payload,omitempty"`
}

//	Global instantiation of our 
//	WebSocket client manager
var manager = ClientManager{
	broadcast:  		make(chan []byte),
	register:   		make(chan *Client),
	unregister: 		make(chan *Client),
	clients:    		make(map[*Client]bool),
	abletonCommands:  	make(chan []byte),
}

func logger(msg string) {

	if DebugMode {
		fmt.Println(msg)
	}
}


func (manager *ClientManager) start() {
	for {
		select {

		case conn := <-manager.register:
			manager.clients[conn] = true
			jsonMessage, _ := json.Marshal(&Message{Content: "/A new socket has connected."})

			//	On new client connect, refresh everyone's status.
			AbletonGetStatus()

			manager.send(jsonMessage, conn)

		case conn := <-manager.unregister:
			if _, ok := manager.clients[conn]; ok {
				close(conn.send)
				delete(manager.clients, conn)
				jsonMessage, _ := json.Marshal(&Message{Content: "/A socket has disconnected."})
				manager.send(jsonMessage, conn)
			}
		case message := <-manager.broadcast:
			s := string(message[:])
			dbg := fmt.Sprintf("Client Manager: Sending to all clients %s", s)
			logger(dbg)
			for conn := range manager.clients {
				select {
					case conn.send <- message:

					default:
						close(conn.send)
						delete(manager.clients, conn)
				}
			}

		case message := <-manager.abletonCommands:

			logger("Client Manager: WebSocket client sent in Ableton Command " + string(message))

			clientJSON, err := jason.NewObjectFromBytes(message)

			if err != nil {
				logger("Client Manager: Could not parse incoming json.  Nothing to do")	
			} else {
				
				logger("Client Manager: Message was valid JSON")

				payload, _ := clientJSON.GetString("payload")

				if payload == "trigger_scene" {

					index, _ := clientJSON.GetInt64("index")

					sIndex := strconv.FormatInt(index, 10)

					logger("Client Manager: Triggering Ableton scene " + sIndex)

					AbletonTriggerScene(sIndex)				
				}

				if payload == "get_status" {
					logger("Client Manager: Requesting Current Status")
					AbletonGetStatus()
				}

				if payload == "stop" {
					logger("Client Manager: Stopping all Ableton scenes")
					AbletonStopAllScenes()
				}

				if payload == "list_scenes" {
					logger("Client Manager: Requesting list of all Ableton scenes")
					AbletonListAllScenes()
				}
			}		
		}
	}
}

/*	
{
  "info": {
    "api_version": "1.0",
    "ableton_version": "7.7"
  },
  
  "payload": "status",
  
  "data": {
    
    "playing": true,
    "song": "My Song 1",
    "index": 10,
    "time": "3:02",
    "left": "0:22"
  }
}
*/

//	We will send status changes to all clients.
func (manager *ClientManager) send(message []byte, ignore *Client) {
	for conn := range manager.clients {
		conn.send <- message
	}
}

//	Block and read from a client
//	If there is a socket error,
//	unregister the client.
//	Any message they send will be send to the 
//	ableton command channel
func (c *Client) read() {
	defer func() {
		manager.unregister <- c
		c.socket.Close()
	}()

	for {
		_, message, err := c.socket.ReadMessage()
		if err != nil {
			manager.unregister <- c
			c.socket.Close()
			break
		}
		//	Send the raw bytes to the manager for now.
		//	We should probably do the parsing here 
		//	instead of wasting the client manager's time
		manager.abletonCommands <- message
	}
}

//	Send data to a client.  Triggered by something in the manager.broadcast
//	channel showing up.  We send the message to all connected clients
func (c *Client) write() {
	defer func() {
		c.socket.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				c.socket.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			c.socket.WriteMessage(websocket.TextMessage, message)
		}
	}
}

func wsPage(res http.ResponseWriter, req *http.Request) {
	conn, error := (&websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}).Upgrade(res, req, nil)
	if error != nil {
		http.NotFound(res, req)
		return
	}
	client := &Client{id: uuid.NewV4().String(), socket: conn, send: make(chan []byte)}

	manager.register <- client

	go client.read()
	go client.write()
}

func main() {

	var AngularAppDirectory string
	
	boolPtr := flag.Bool("debug", false, "Show all messages on the console")
	flag.StringVar(&AngularAppDirectory, "webapp", "/home/angular/dist", "Path to angular or web directory")

	flag.Parse()

	DebugMode = *boolPtr

	if AngularAppDirectory == "/home/angular/dist" {
		fmt.Println("-webapp is a required parameter.  For help, try ableton-gobo -h")
		return
	}

	//	Async UDP listening server for data postbacks from Ableton
	go UdpListeningServer(GoBoUDPListeningPort)

	if !DebugMode {
		fmt.Println("Starting GoBo")
	} else {
		fmt.Println("Starting GoBo (Debug Mode)")
	}

	//	Start the Web Socket Client Manager
	go manager.start()

	//	Start the Web Socket listener
	go func() {
		logger("Websocket listening on port :12345")
		http.HandleFunc("/ws", wsPage)
		http.ListenAndServe(":12345", nil)
	}()

	//	Start the HTTP Server for our Angular 2 Web App
	r := mux.NewRouter()

	//	Serve static content from the -webapp folder
	logger("AngularAppDirectory is " + AngularAppDirectory)
	r.PathPrefix("/").Handler(http.FileServer(http.Dir(AngularAppDirectory)))
    http.Handle("/", r)
	fmt.Println("HTTP server listening on port " + GoBoHTTPListeningPort)
	fmt.Println("Web client connect URL: http://<your-ip-address>:" + GoBoHTTPListeningPort)
    http.ListenAndServe(":" + GoBoHTTPListeningPort, nil)
}

func UdpListeningServer(port string) {

	//Build the address
	udpAddr, err := net.ResolveUDPAddr("udp", port)

	if err != nil {
		fmt.Println("GoBo could not bind to port " + udpAddr.String())
		return
	}

	fmt.Println("GoBo is listening for Ableton messages on UDP port " + udpAddr.String())

	//Create the connection
	udpConn, err := net.ListenUDP("udp", udpAddr)

	if err != nil {
		fmt.Println(err)
	}

	//	Handle data
	for {
		HandleUDPData(udpConn)
	}
}

func HandleUDPData(conn *net.UDPConn) {

	var buf []byte
	buf = make([]byte, 20000)

	n, err := conn.Read(buf[0:])

	dbg := fmt.Sprintf("HandleUDPData: Read %d bytes\n", n)
	logger(dbg)

	if err != nil {
		logger("HandleUDPData: Error Reading")
		return
	} else {

		//	Decode bytes to string
		s := string(buf[0 : n-4])

		logger(s)
	
		abletonData, err := jason.NewObjectFromBytes(buf[0 : n-4])

		if err != nil {
			logger("HandleUDPData: Ableton sent a msg we could not parse.  Ignoring")
			return
		}

		payload, _ := abletonData.GetString("payload")

		if payload == "status" {
			logger("HandleUDPData: status update msg from Ableton sent to all clients")
			byteArray := []byte(abletonData.String())
			manager.broadcast <- byteArray
			return;
		}

		if payload == "scene_list" {
			logger("HandleUDPData: scene_list msg from Ableton sent to all clients")
			byteArray := []byte(abletonData.String())
			manager.broadcast <- byteArray
			return;
		}
	}
}
