import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketService } from "./socket.service";
 
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
 
    public messages: Array<any>;
    public song_list: Array<any>;
    public playing: Boolean;
    public current_song: String;

    public chatBox: string;
 
    public constructor(private socket: SocketService) {
        this.messages = [];
        this.chatBox = "";
        this.current_song = "Stopped";
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
                "song": "Request Denied",
                "index": 10,
                "time": "3:02",
                "left": "0:22"
            }
        }
    */

    /*

	{
		"info": {
			"api_version": "1.0",
			"ableton_version": "7.7"
		},
		
		"payload": "songlist",
		
		"data": {
			
			"songs": [
			
			{
				"title": "Burn Away",
				"index": 0,
				"length": 300,
				"bpm": 102.4,
				"timing": "4/4"
			},
			{
				"title": "Request Denied",
				"index": 10,
				"length": 288,
				"bpm": 95.0,
				"timing": "4/4"
			}
			]
		}
	}

	*/

    public ngOnInit() {

        this.socket.getEventListener().subscribe(event => {

            if(event.type == "message") {

                //this.messages.push(JSON.stringify(event.data));

                var ableton_message = event.data;

                console.log(ableton_message);

                if (ableton_message.payload == "status") {

                    this.playing = ableton_message.data.playing;

                    this.current_song = ableton_message.data.song;

                    if (this.playing){
                        console.log("Now Playing" + ": " + this.current_song);
                    }
                    else {
                        this.current_song = "Stopped";

                        console.log("Stopped");
                    }
                }

                if (ableton_message.payload == "scene_list") {

                    this.song_list = ableton_message.data.songs;

                    console.log("Got scene_list");
                }
            }

            if(event.type == "close") {
                this.messages.push("Disconnected from Ableton goBetween");
            }
            if(event.type == "open") {
                this.messages.push("Connected to Ableton goBetween");

                //  Get song list
                this.socket.send('{"payload":"list_scenes"}');
            }
        });
    }
 
    public ngOnDestroy() {
        this.socket.close();
    }
 
    public send() {
        if(this.chatBox) {
            this.socket.send(this.chatBox);
            this.chatBox = "";
        }
    }

    public triggerScene($sceneObj){

        console.log("triggerScene() called with index " + $sceneObj.index);
        console.log("this will trigger song " + $sceneObj.title);

        var ableton_command = new Object();

        ableton_command["payload"] = "trigger_scene";
        ableton_command["index"] = $sceneObj.index;

        this.socket.send(JSON.stringify(ableton_command));
    }

    public stopPlaying(){

        console.log("stopPlaying() called");

        var ableton_command = new Object();

        ableton_command["payload"] = "stop";

        this.socket.send(JSON.stringify(ableton_command));
    }
 
    public isSystemMessage(message: string) {
        return message.startsWith("/") ? "<strong>" + message.substring(1) + "</strong>" : message;
    }
 
}