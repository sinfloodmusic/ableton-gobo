inlets = 1;

//	Out 1 should go to UDP
//	Out 2 should go to the Screen for the friendly
//	song displayname
outlets = 2;

//	Default for Axiom Air 61
var Define_Prev_Button_CC_Number = 114;
var Define_Next_Button_CC_Number = 115;
var Define_Stop_Button_CC_Number = 116;
var Define_Play_Button_CC_Number = 117;

var Define_UDP_Outlet = 0;

var Define_Display_Outlet = 1;

//	If you are using arrangement view, this is currently
//	not the plugin for you - todo.
var Define_Using_Scenes_For_Setlist = true

//	When in scene mode, this is the track that
//	that should have clips for every song you'll
//	be playing.  If a clip is playing in this track
//	we'll assume you are playing your song
var Define_Scene_Used_For_Is_Playing = 0

//	This will tell us where which song we will launch if we were to hit play.
var current_nav_scene_index = 0;

//	When you setup a callback, you need to keep those objects
//	alive.  They are pretty much a client connection to Ableton.
//	During the "bang" function we'll set them all up and push them
//	to this array.  Then, as things happen, the callback is called
//	for each path that you are watching (like a scene, or a volume control)
var LiveAPIObjects = new Array();

var Last_Playing_Song = "None";

var API_Version = "1.0"

//	Given a live path (from a callback normally) try to figure
//	out which scene it's from
function GetSceneFromLivePath(path){

	// todo
}

//	Sends OSC out to the world to notify that a song is playing
//	or stopped
function OSCNotifyStatusSongPlaying(song_name, is_playing, song_index){

	log("OSCNotifyStatusSongPlaying called.  Song is: " + song_name);
	
	var out_data = GetStatusStruct();
		
	if (is_playing){
		out_data.data.playing = true;
		out_data.data.song = song_name;
		out_data.data.index = song_index;
	}
	else {
		out_data.data.playing = false;
		out_data.data.song = "";
		out_data.data.index = song_index;
	}

	var json_string = JSON.stringify(out_data);

	outlet(Define_UDP_Outlet,json_string);
}

function OSCNotifySongList(){

	log("OSCNotifySongList called");
	
	var out_data = GetSceneListStruct();

	var json_string = JSON.stringify(out_data);

	log(json_string);

	outlet(Define_UDP_Outlet,json_string);
}

function UpdateDisplay(name){
	outlet(Define_Display_Outlet,name);
}

//	Find which track is playing.
function TrackGetPlayingIndex(){

	var l = new LiveAPI("live_set tracks "+ Define_Scene_Used_For_Is_Playing);
	var index =  l.get("playing_slot_index");

	Last_Playing_Song = GetSongNameByIndex(index);
	return index;
}

//	Callback when our playing track changes the playing clip
function CallbackTrackClipPlaying(args){

	log("CallbackTrackPlaying called with args:", args, "\n");

	//log("CallbackTrackPlaying id is "+ this.id)
	//log("CallbackTrackPlaying path is " + this.path)

	if (args[0] == "playing_slot_index"){

		//	-2	No clip at all???
		//	-1 	No clip playing
		//	0+ clip that is active
		if (args[1] >= 0){
			songName = GetSongNameByIndex(args[1]);
			log("playing_slot_index is " + args[1]);

			log('CallbackTrackPlaying Notifying OSC listeners that song ' + songName + ' is playing');
			Last_Playing_Song = songName;
			OSCNotifyStatusSongPlaying(Last_Playing_Song, true, args[1]);
			UpdateDisplay(Last_Playing_Song);
			return;
		}
		else {
			log('CallbackTrackPlaying only negative clips.  Nothing playing');
			OSCNotifyStatusSongPlaying(Last_Playing_Song, false, -1);
			UpdateDisplay(Last_Playing_Song);
		}
	}
}




function GetStatusStruct(){

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

	var jsonData = new Object();
	
	jsonData.info = new Object();
	jsonData.info.api_version = API_Version;
	jsonData.info.ableton_version = "9.0";

	jsonData.payload = "status";

	jsonData.data = new Object();

	jsonData.data.playing = false;
	jsonData.data.song = "";
	jsonData.data.index = -1;
	jsonData.data.time = "";
	jsonData.data.left = "";
	
	return jsonData;
}

function GetSceneListStruct(){

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

	var jsonData = new Object();
	
	jsonData.info = new Object();
	jsonData.info.api_version = API_Version;
	jsonData.info.ableton_version = "9.0";

	jsonData.payload = "scene_list";

	jsonData.data = new Object();

	jsonData.data.songs = GetAllSongs();

	return jsonData;
}

//	oscsend localhost 9999 behavior s "awesome333"
function RawUdpMessage(command, arg1){

	log("RawUdpReciever function called with arg " + arg1);

	switch (command) {
		case '/play':
			log("RawUdpMessage: Play with argument " + arg1);
			//	This will trigger playback and our callback will update our web server
			PlayScene(arg1);
			break;
		case '/stop':
			log("RawUdpMessage: Stop");
			var liveObject = new LiveAPI("live_set");
			liveObject.call("stop_playing");
			OSCNotifyStatusSongPlaying(Last_Playing_Song, false, -1);
			break;

		case '/status':
			log("RawUdpMessage: Status Request");
			OSCNotifyStatusSongPlaying(Last_Playing_Song, GetIsPlaying())
			break;

		case '/list':
			log("RawUdpMessage: List Scenes");
			OSCNotifySongList();
			break;
		default:
			log("command " + command + " was not recognized.  Try /start, /stop, or /list");
      }

	log("get was called via udp");
}

function SceneNameToDisplayName(sceneName){
	return sceneName.toString().split(";")[0];
}

function bang() {
	
  	log("Launching Sinflood OSC Transport Control");

	log("Setting up listener for which track is playing")

	//	This particular path seems to freak out the live watcher window
	//	with a bunch of orange errors - but it does work.
	var l = new LiveAPI(CallbackTrackClipPlaying);
	l.path = "live_set tracks "+ Define_Scene_Used_For_Is_Playing;
	l.property = "playing_slot_index"
	LiveAPIObjects.push(l);

	//var l = new LiveAPI(CallbackTrackClipPlaying);
	//l.path = "live_set tracks "+ Define_Scene_Used_For_Is_Playing;
	//l.property = "playing_slot_index"
	//LiveAPIObjects.push(l);

	//	Watch the overall "song is playing"
	//	If it swtiches to false, we know we've stopped (most likley
	//	from an API call rather than with the spacebar.  spacebard
	//	just stops scenes, but the stop playing kills the transport.
	//var l = new LiveAPI(CallbackTrackClipPlaying);
	//l.path = "live_set song";
	//l.property = "is_playing"
	//LiveAPIObjects.push(l);

	//	For the keyboard transport control
	current_nav_scene_index = 0;
	
	//	Print out the selected scene (zero on start)
	//outlet(0,GetCurrentSceneNameForDisplay());
	outlet(0,"Loaded");
}




function log() {
  for(var i=0,len=arguments.length; i<len; i++) {
    var message = arguments[i];
    if(message && message.toString) {
      var s = message.toString();
      if(s.indexOf("[object ") >= 0) {
        s = JSON.stringify(message);
      }
      post(s);
    }
    else if(message === null) {
      post("<null>");
    }
    else {
      post(message);
    }
  }
  post("\n");
}




function GetIsPlaying(){

	var liveObject = new LiveAPI("live_set");
	//log(liveObject.info);

	//	Live will say "is playing" once you trigger a scene
	//	even if you hit the stop all scenese button.  The "play"
	//	is still occurring on the song mode
	//	So for us, we need to look at all scenes and see if any are
	//	listed as triggered.
	if (Define_Using_Scenes_For_Setlist){

		log("Set list is based on scenes.  Checking all scenes to see if any are playing");

		var sceneCount = liveObject.getcount("scenes");	

		var playing = false;
	
		for (var i = 0; i < sceneCount; i++) {
			
			liveObject.path = "live_set scenes " + i;
			var clipCount = liveObject.getcount("clip_slots");
			
			//log("Scene has " + clipCount + " clips");

			liveObject.path = "live_set scenes " + i + " clip_slots 0";

			//log(liveObject.info)

			//	is_laying on the scene doesn't seem to work.  Look at all clips within the scene
			for (var j = 0; j < clipCount; j++){
		
				liveObject.path = "live_set scenes " + i + " clip_slots " + j;

				//log("Clip is_playing: " + liveObject.get("is_playing"));

				if (liveObject.get("is_playing") == 1){
					log("Clip  " + j + " in scene " + i + " is playing.");
					return true;
				}
			}
		}
		log("GetIsPlaying determined nothing is playing");
		return false;
	}
	else {
		log("Is playing is : " + liveObject.get("is_playing"))
		return (liveObject.get("is_playing") == 1)
	}
}

function GetSongNameByIndex(index){

	songs = GetAllSongs();

	for (i = 0; i < songs.length; i++){
		if (index == songs[i].index){
			return songs[i].title
		}
	}
	
	return "None"
}

function GetAllSongs(){
		
	var liveObject = new LiveAPI("live_set");
	
	var sceneCount = liveObject.getcount("scenes");

	var songObjects = new Array();
	
	for (var sceneIndex = 0; sceneIndex < sceneCount; sceneIndex++) {
		
		liveObject.path = "live_set scenes " + sceneIndex;

		var sceneName = String(liveObject.get("name"));
		
		//	Skip over scenes that have no name.
		if (sceneName == ""){
			continue;
		}

		var song = new Object();
		song.index = sceneIndex;
		song.title = SceneNameToDisplayName(sceneName);
		song.bpm = 98.5;
		song.length = -1;

		
		songObjects.push(song);
	}
	
	return songObjects;
	
}

function GetAllSceneIndexes(){
		
	songs = GetAllSongs()

	indices = new Array();

	for (var i = 0; i < songs.length; i++){
		indices.push(songs[i].name);
	}
	
	return indices;
	
}

function GetAllSceneNames(){
		
	songs = GetAllSongs()

	indices = new Array();

	for (var i = 0; i < songs.length; i++){
		indices.push(songs[i].index);
	}
	
	return indices;
	
}

function GetPreviousSceneIndex(){
	
	var currIndex = GetCurrentSceneIndex();
	var prevIndex = -1;
	
	if (currIndex == allScenesIndexArray[0]){
		return allScenesIndexArray[allScenesIndexArray.length -1];
	}
		
	for (var i = 0; i < allScenesIndexArray.length; i++){
		
		//log("scene live id is " + allScenesIndexArray[i]);
		
		if (allScenesIndexArray[i] != currIndex){
			prevIndex = allScenesIndexArray[i];
		}
		else {
			return prevIndex;
		}	
	}
	
	return prevIndex;
}


function GetNextSceneIndex(){
	
	var currIndex = GetCurrentSceneIndex();
	var nextIndex = -1;
	
	if (currIndex == allScenesIndexArray[allScenesIndexArray.length -1]){
		return allScenesIndexArray[0];
	}
	
	for (var i = 0; i < allScenesIndexArray.length; i++){
				
		if (allScenesIndexArray[i] == currIndex){
			return allScenesIndexArray[i+1];
		}
	}
	
	return nextIndex;
}



function PlayScene(index){
	var liveObject = new LiveAPI("live_set");
	liveObject.goto("scenes live_set scenes " + index);
	liveObject.call("fire");
}


function TransportMessage(ccNumber, ccValue){
	
	//	Do nothing.  The transport sends a 127, then a zero right after.  Ignore the zero.
	if (ccValue == 0){
		return;
	}
	
	var liveObject = new LiveAPI("live_set");
		
	//	Stop Button
	if (ccNumber == Define_Stop_Button_CC_Number){
		
		log ("stop message received");
		
		//	stop immediately
		liveObject.call("stop_playing");
		
		//	stop gracefully (at end of next bar)
		//liveObject.call("stop_all_clips");
		return;
	}
	
	//	Play Button
	if (ccNumber == Define_Play_Button_CC_Number){
		
		log ("play message received");
		
		//	Get from our last navigation value
		liveObject.goto("scenes live_set scenes " + current_nav_scene_index);
		
		liveObject.call("fire");
		
		//	play currently selected scene
		//liveObject.call("start_playing");
	}
	

	//	Prev Button
	if (ccNumber == Define_Prev_Button_CC_Number){
		
		//log ("prev message received");
		
		//	play currently selected scene
		var prevIndex = GetPreviousSceneIndex();
		
		current_nav_scene_index = prevIndex;
		
		//log("nav index is " + current_nav_scene_index);
		
		log(GetCurrentSceneNameForDisplay());
		
		outlet(0,GetCurrentSceneNameForDisplay());
		
		//log ("Previous scene Index is " + current_nav_scene_index);
	
		return;
	}
	
	
	//	Next Button
	if (ccNumber == Define_Next_Button_CC_Number){
		
		//log ("next message received");
		
		//	play currently selected scene
		var nextIndex = GetNextSceneIndex();
		
		current_nav_scene_index = nextIndex;
		
		//log("nav index is " + current_nav_scene_index);
		
		log(GetCurrentSceneNameForDisplay());
		
		outlet(0,GetCurrentSceneNameForDisplay());
	
		return;
	}
}