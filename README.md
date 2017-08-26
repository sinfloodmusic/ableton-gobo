#   GoBo for Ableton
GoBo is a "go-between" for managing playback and full scene triggering within Ableton Live via HTTP clients and websockets.

GoBo allows anyone with an iPad, iPhone, or web client to trigger songs and see the basic status of playback.  Sinflood uses this to drive the band's live show while keeping the main rig off-stage or in a back corner of the stage, freeing up more space to perform.

##   Why?
For live DJ's and performers that need immediate access to Live, this may not be a good fit for you.  This tool is designed for a live band that needs to trigger backing tracks but wants to save valueable stage space by keeping a the gear off stage our out of the way.  Before this tool, we (Sinflood) were forced to keep the laptop and rack close to the drummer or keyboardist.  With our rig being quite sizeable, this led to cramped stage layouts in smaller venues.  

##  How does it work?
Ableton can communicate over the network via UDP, however these connections are all asynchronous and when you ask Ableton for something on one UDP port, you will eventually get a reply on another UDP port connection.  It's not like a TCP connection where you ask and get a reply in the same session.  This makes it difficult to connect a web browser directly to Ableton.  GoBo handles this async communication for you, by relaying websocket calls to/from your Web Clients (Angular 2/Websockets) and sending/listening to/from Ableton.  GoBo truly sits between your browser and Ableton, making everything smooth and as snappy as possible.

Both Ableton and your device will see the currently playing song and a status of playing or stopped.  You can trigger scenes from either Ableton or your mobile device and status will be updated.

### Ableton View
![alt text](http://epk.sinflood.com/images/dev/gobo-example1.png)

### iPhone View
<div style="text-align:center">
    <img src="http://epk.sinflood.com/images/dev/gobo-iphone.png" alt="iPhone View" width="400">
</div>

##   How do I set this up?
You'll need the following:

First, this is designed with a full band in mind, and with backing tracks setup as scenes.  Some bands may have their show setup in the "Arrangement Mode".  This tool has not yet been adapted to handle that.  To use this tool, you'll want to organize your backing tracks in the "Session Mode" with multiple scenes, one scene per song.  See above example screenshot.

### You'll need
* A network within your rig so that phones/ipads/clients can connect to GoBo.  In our case, we have the Ableton system wired into a wireless router and the clients (iPad, iPhone, Android) connect on WiFi.  A router like TP-LINK TL-WR810N is small and stays out of your way.
* A computer to run GoBo on.  Normally, this is the Ableton machine itself, but it doesn't have to be.  You can put it on a Raspberry Pi or another machine that is on the same network as your Ableton host as long as it can compile golang.
* A mobile device on or off stage to drive the show.

###  Ableton Component
You'll need to install the GoBo Max 4 Live device which is comprised of two parts, GoBo.axmd, GoBo.js.  Essentially, GoBo.axmd is a wrapper for the GoBo.js, which does all the heavy lift.  GoBo.js is pure javascript.  This makes it easy for anyone with a traditional programming background to modify as necessary to extend the functionality beyond what's currently implemented.

The defaults of the script that execute within Ableton are as follows:

* Listens on localhost UDP Port 9999
* Sents messages out to localhost, UDP port 8080

If there are no conflicts there, you shouldn't need to touch the main script (gobo.js)

###  GoBo component
GoBo is written in GoLang and will compile down to an executable on Mac, Windows, and Linux.  Precompiled binaries are available for Mac OSX 10.11 and Windows 10.  If you have trouble launching these, download "go" and compile gobo.go.

The defaults of GoBo are:

* Listens on UDP port 8080 for messages from Ableton Live (the gobo javascript)
* Listens on TCP/IP port 8001 for serving up the Angular 2 web application
* Listens on TCP/IP port 12345 for WebSocket connections (From the Angular 2 Web App)

###  Angular 2 Component
The UI is nothing special at the moment.  If there are any skilled front-end web developers, would love to hear from you.

###  Credit
Nic Raboy did a great tutorial on Golang, Web Sockets, and an Angular App here:
https://www.thepolyglotdeveloper.com/2016/12/create-real-time-chat-app-golang-angular-2-websockets/

Almost all of the Angular App code is lifted from Nic.  Almost all of the golang client manager code as well.

At the moment, my original contirubtion is in the Max 4 Live plugin, the accompanying Javascript for said plugin, as well as the UDP server component of the GoLang server that listens to and relays messages from, Ableton.

### Get up and Running

Get the repo:

`git clone https://github.com/sinfloodmusic/ableton-gobo.git`

#### GoBo
You'll need to download Go from google to compile the GoBo golang portion.  It's not as complicated as you think.  

* [Download Go](https://golang.org/dl/)
* In the root of the project, `go build`
* That will output an executable called ableton-gobo (Mac) or ableton-gobo.exe (Windows)
* Launch GoBo with the path to your angular app.  We'll create this folder in the Angular Section
* You can pass the optional `debug` flag to see output going back and forth to your clients and Ableton.
* `ableton-gobo -webapp "/Users/me/Downloads/ableton-gobo/angular2-gobo-dist/" -debug`

#### Angular Static App

You do not need to do this if you are ok with the default "angular2-gobo-dist" "UI" that is provided.  You can simply have GoBo use that and avoid any of the nodejs/npm/angular hassle.

In Angular 2, you "build" your web app and can deploy a condensed version to a folder.  It's this folder that we'll be serving up with the GoBo web server above.  Here's how to build the Angular component.

* Download `nodejs` as we'll need to use `npm` to get the `angular-cli` toolset.
* Note that you don't need to do this on your Ableton machine if you aren't comfortable.  You can build the Angular app on any machine and then just copy the contents to the machine where GoBo is residing.
* Download and install `nodejs` [here](https://nodejs.org/en/download/)
* Open a fresh shell and install the Angular 2 cli
...`npm install -g @angular/cli`
* cd into the angular2-gobo folder
* build to a distribution folder.  This is the folder GoBo will need to have access to.
...`ng build --env=prod --output-path=/Users/me/Downloads/ableton-gobo/angular2-gobo-dist/`

#### Launch the web app
When GoBo lanuches, it will provide the URL where your clients (iPhone, iPad) can connect

`Web client connect URL: http://myip:8100`

Replace 'ip' with the ip address of your machine.