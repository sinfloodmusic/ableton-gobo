import { Injectable, EventEmitter } from '@angular/core';
 
@Injectable()
export class SocketService {
 
    private socket: WebSocket;
    private listener: EventEmitter<any> = new EventEmitter();
 
    public constructor() {

        var servername = window.location.hostname;

        console.log("GoBo Server Name " + servername);

        this.socket = new WebSocket("ws://" + servername + ":12345/ws");

        this.socket.onopen = event => {
            this.listener.emit({"type": "open", "data": event});
        }
        this.socket.onclose = event => {
            this.listener.emit({"type": "close", "data": event});
        }
        this.socket.onmessage = event => {
            this.listener.emit({"type": "message", "data": JSON.parse(event.data)});
        }
    }
 
    public send(data: string) {

        if (data == "1"){
            this.socket.send('{"payload":"trigger_scene"}');
            this.socket.send('{"payload":"get_status"}');
        }
        else {
            this.socket.send(data);
        }
    }
 
    public close() {
        this.socket.close();
    }
 
    public getEventListener() {
        return this.listener;
    } 
}