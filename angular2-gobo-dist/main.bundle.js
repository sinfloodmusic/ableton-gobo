webpackJsonp(["main"],{

/***/ "../../../../../src/$$_gendir lazy recursive":
/***/ (function(module, exports) {

function webpackEmptyAsyncContext(req) {
	return new Promise(function(resolve, reject) { reject(new Error("Cannot find module '" + req + "'.")); });
}
webpackEmptyAsyncContext.keys = function() { return []; };
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
module.exports = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = "../../../../../src/$$_gendir lazy recursive";

/***/ }),

/***/ "../../../../../src/app/app.component.css":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/app.component.html":
/***/ (function(module, exports) {

module.exports = "<!--The content below is only a placeholder and can be replaced.-->\n<!--Mask-->\n<div class=\"view\">\n    <!--Intro content-->\n    <div class=\"full-bg-img flex-center\">\n        <section>\n            <div class=\"container\">\n\n                <div class=\"row\" style=\"padding-top: 15px;\">\n                    <div class=\"col-md-12\">\n                        <div style=\"text-align:center\" [ngClass]=\"playing == true ? 'alert alert-success' : 'alert alert-danger'\">\n                            {{current_song}}\n                        </div>\n                    </div>\n                </div>\n\n                <div class=\"row\">\n                    <div class=\"col-md-12\">\n                        <div class=\"text-center\">\n                            <button type=\"button\" class=\"btn btn-danger\" (click)=\"stopPlaying()\">Stop</button>\n                        </div>\n                    </div>\n                </div>\n\n                <div class=\"card-deck\" style=\"padding-top: 15px;\">\n                    <div class=\"card\" style=\"text-align:center\" *ngFor=\"let song of song_list\">\n                        <div class=\"card-block\">\n                            <p class=\"card-text\">{{song.title}}</p>\n                        </div>\n                        <div class=\"card-footer\">\n                            <button class=\"btn btn-primary\" (click)=\"triggerScene(song)\">Play</button>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        </section>\n     </div>\n</div>\n"

/***/ }),

/***/ "../../../../../src/app/app.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__socket_service__ = __webpack_require__("../../../../../src/app/socket.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var AppComponent = (function () {
    function AppComponent(socket) {
        this.socket = socket;
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
    AppComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.socket.getEventListener().subscribe(function (event) {
            if (event.type == "message") {
                //this.messages.push(JSON.stringify(event.data));
                var ableton_message = event.data;
                console.log(ableton_message);
                if (ableton_message.payload == "status") {
                    _this.playing = ableton_message.data.playing;
                    _this.current_song = ableton_message.data.song;
                    if (_this.playing) {
                        console.log("Now Playing" + ": " + _this.current_song);
                    }
                    else {
                        _this.current_song = "Stopped";
                        console.log("Stopped");
                    }
                }
                if (ableton_message.payload == "scene_list") {
                    _this.song_list = ableton_message.data.songs;
                    console.log("Got scene_list");
                }
            }
            if (event.type == "close") {
                _this.messages.push("Disconnected from Ableton goBetween");
            }
            if (event.type == "open") {
                _this.messages.push("Connected to Ableton goBetween");
                //  Get song list
                _this.socket.send('{"payload":"list_scenes"}');
            }
        });
    };
    AppComponent.prototype.ngOnDestroy = function () {
        this.socket.close();
    };
    AppComponent.prototype.send = function () {
        if (this.chatBox) {
            this.socket.send(this.chatBox);
            this.chatBox = "";
        }
    };
    AppComponent.prototype.triggerScene = function ($sceneObj) {
        console.log("triggerScene() called with index " + $sceneObj.index);
        console.log("this will trigger song " + $sceneObj.title);
        var ableton_command = new Object();
        ableton_command["payload"] = "trigger_scene";
        ableton_command["index"] = $sceneObj.index;
        this.socket.send(JSON.stringify(ableton_command));
    };
    AppComponent.prototype.stopPlaying = function () {
        console.log("stopPlaying() called");
        var ableton_command = new Object();
        ableton_command["payload"] = "stop";
        this.socket.send(JSON.stringify(ableton_command));
    };
    AppComponent.prototype.isSystemMessage = function (message) {
        return message.startsWith("/") ? "<strong>" + message.substring(1) + "</strong>" : message;
    };
    return AppComponent;
}());
AppComponent = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["n" /* Component */])({
        selector: 'app-root',
        template: __webpack_require__("../../../../../src/app/app.component.html"),
        styles: [__webpack_require__("../../../../../src/app/app.component.css")]
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_1__socket_service__["a" /* SocketService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__socket_service__["a" /* SocketService */]) === "function" && _a || Object])
], AppComponent);

var _a;
//# sourceMappingURL=app.component.js.map

/***/ }),

/***/ "../../../../../src/app/app.module.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser__ = __webpack_require__("../../../platform-browser/@angular/platform-browser.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_forms__ = __webpack_require__("../../../forms/@angular/forms.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__angular_http__ = __webpack_require__("../../../http/@angular/http.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__app_component__ = __webpack_require__("../../../../../src/app/app.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__socket_service__ = __webpack_require__("../../../../../src/app/socket.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};






var AppModule = (function () {
    function AppModule() {
    }
    return AppModule;
}());
AppModule = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_1__angular_core__["L" /* NgModule */])({
        declarations: [
            __WEBPACK_IMPORTED_MODULE_4__app_component__["a" /* AppComponent */]
        ],
        imports: [
            __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser__["a" /* BrowserModule */],
            __WEBPACK_IMPORTED_MODULE_2__angular_forms__["a" /* FormsModule */],
            __WEBPACK_IMPORTED_MODULE_3__angular_http__["a" /* HttpModule */]
        ],
        providers: [__WEBPACK_IMPORTED_MODULE_5__socket_service__["a" /* SocketService */]],
        bootstrap: [__WEBPACK_IMPORTED_MODULE_4__app_component__["a" /* AppComponent */]]
    })
], AppModule);

//# sourceMappingURL=app.module.js.map

/***/ }),

/***/ "../../../../../src/app/socket.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return SocketService; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};

var SocketService = (function () {
    function SocketService() {
        var _this = this;
        this.listener = new __WEBPACK_IMPORTED_MODULE_0__angular_core__["w" /* EventEmitter */]();
        var servername = window.location.hostname;
        console.log("GoBo Server Name " + servername);
        this.socket = new WebSocket("ws://" + servername + ":12345/ws");
        this.socket.onopen = function (event) {
            _this.listener.emit({ "type": "open", "data": event });
        };
        this.socket.onclose = function (event) {
            _this.listener.emit({ "type": "close", "data": event });
        };
        this.socket.onmessage = function (event) {
            _this.listener.emit({ "type": "message", "data": JSON.parse(event.data) });
        };
    }
    SocketService.prototype.send = function (data) {
        if (data == "1") {
            this.socket.send('{"payload":"trigger_scene"}');
            //this.socket.send('{"payload":"get_status"}');
        }
        else {
            this.socket.send(data);
        }
    };
    SocketService.prototype.close = function () {
        this.socket.close();
    };
    SocketService.prototype.getEventListener = function () {
        return this.listener;
    };
    return SocketService;
}());
SocketService = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["B" /* Injectable */])(),
    __metadata("design:paramtypes", [])
], SocketService);

//# sourceMappingURL=socket.service.js.map

/***/ }),

/***/ "../../../../../src/environments/environment.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return environment; });
var environment = {
    production: true
};
//# sourceMappingURL=environment.js.map

/***/ }),

/***/ "../../../../../src/main.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_platform_browser_dynamic__ = __webpack_require__("../../../platform-browser-dynamic/@angular/platform-browser-dynamic.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__app_app_module__ = __webpack_require__("../../../../../src/app/app.module.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__environments_environment__ = __webpack_require__("../../../../../src/environments/environment.ts");




if (__WEBPACK_IMPORTED_MODULE_3__environments_environment__["a" /* environment */].production) {
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_20" /* enableProdMode */])();
}
Object(__WEBPACK_IMPORTED_MODULE_1__angular_platform_browser_dynamic__["a" /* platformBrowserDynamic */])().bootstrapModule(__WEBPACK_IMPORTED_MODULE_2__app_app_module__["a" /* AppModule */]);
//# sourceMappingURL=main.js.map

/***/ }),

/***/ 0:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__("../../../../../src/main.ts");


/***/ })

},[0]);
//# sourceMappingURL=main.bundle.js.map