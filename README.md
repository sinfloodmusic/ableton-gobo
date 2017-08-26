README

#   GoBo for Ableton
GoBo is a "go-between" for managing playback and full scene triggering within Ableton Live via HTTP clients and websockets.

#   Why?
For live DJ's and performers that need immediate access to Live, this may not be a good fit for you.  This tool is designed for a live band that needs to trigger backing tracks (organized using scenes) but don't want to waste valueable stage space on keeping a laptop close to the drummer or keyboardist.  In Sinflood's case, our rig is big enough that getting it off stage is a benefit.

GoBo allows anyone with an iPad, iPhone, or web client to trigger songs and see the basic status of playback.  Sinflood uses this to drive the band's live show while keeping the main "rig" off-stage or in a back corner of the stage, freeing up value space to perform.

#   How does it work?
Ableton can communicate over the network via UDP, however these connections are all asynchronous and when you ask Ableton for something on one UDP port, you will eventually get a reply on another UDP port connection.  It's not like a TCP connection where you ask and get a reply in the same session.  This makes it difficult to connect a web browser directly to Ableton.  GoBo handles this async communication for you, by relying websocket calls to/from your Web Clients (Angular 2/Websockets) and sending/listening to/from Ableton.  GoBo truly sits between your browser and Ableton, making everything smooth and as snappy as possible.

#   How do I set this up?
You'll need the following:

First, this is designed with a full band in mind, and with backing tracks setup as scenes.  Some bands may have their show setup in the "Arrangement Mode".  This tool has not yet been adapted to handle that.  To use this tool, you'll want to organize your backing tracks in the "Session Mode" with multiple scenes, one scene per song.  See example screenshot.

![alt text](http://http://epk.sinflood.com/images/dev/gobo-example1.png)

### You'll need
* A network within your rig so that phones/ipads/clients can connect to GoBo.  Normally you'd have Ableton wired into a wireless router, and the clients (iPad, iPhone, Android) connect on WiFi.
* A computer to run GoBo on.  Normally, this is the Ableton machine itself it doesn't have to be.  You can put it on a Raspberry Pi or another machine that is on the same network as your Ableton host.

##  Ableton Component
You'll need to install the GoBo Max 4 Live "device", which has a javascript component.  Essentially, we have a Max 4 Live "plugin", but at the core it's a javascript that doesn't all the heavey lifting.  The Max 4 Live component is just a bunch of wrapping this javascript to get it to execute.  This makes it "easy" for someone with a traditional programming background to modify as necessary to listen for (and react to) different events if they so choose.

The defaults of the script that execute within Ableton are as follows:

Listens on localhost UDP Port 9999
Sents messages out to localhost, UDP port 8080

If there are no conflicts there, you shouldn't need to touch the main script (gobo.js)

##  GoBo component
GoBo is written in GoLang and will compile down to an executable on Mac, Windows, and Linux.  Precompiled binaries are available for Mac OSX 10.11 and Windows 10.  If you have trouble launching these, download "go" and compile gobo.go.

The defaults of GoBo are:

Listens on UDP port 8080 for messages from Ableton Live (the gobo javascript)
Listens on TCP/IP port 8001 for serving up the Angular 2 web application
Listens on TCP/IP port 12345 for WebSocket connections (From the Angular 2 Web App)

##  Angular 2 Component
todo document

##  Credit
Nic Raboy did a great tutorial on Golang, Web Sockets, and an Angular App here:
https://www.thepolyglotdeveloper.com/2016/12/create-real-time-chat-app-golang-angular-2-websockets/

Almost all of the Angular App code is lifted from Nic.  Almost all of the golang client manager code as well.

At the moment, my original contirubtion is in the Max 4 Live plugin, the accompanying Javascript for said plugin, as well as the UDP server component of the GoLang server that listens to and relays messages from, Ableton.




