function KeyboardInputManager() {
  this.events = {};
  this.eventTouchstart = window.navigator.msPointerEnabled ?
    "MSPointerDown" : "touchstart";
  this.eventTouchmove = window.navigator.msPointerEnabled ?
    "MSPointerMove" : "touchmove";
  this.eventTouchend = window.navigator.msPointerEnabled ?
    "MSPointerUp" : "touchend";
  this.listen();
}

KeyboardInputManager.prototype.on = function (event, callback) {
  if (!this.events[event]) this.events[event] = [];
  this.events[event].push(callback);
};

KeyboardInputManager.prototype.emit = function (event, data) {
  var callbacks = this.events[event];
  if (callbacks) callbacks.forEach(function (callback) { callback(data); });
};

KeyboardInputManager.prototype.listen = function () {
  var self = this;
  var map = {
    38: 0, 39: 1, 40: 2, 37: 3,
    75: 0, 76: 1, 74: 2, 72: 3,
    87: 0, 68: 1, 83: 2, 65: 3
  };

  document.addEventListener("keydown", function (event) {
    var target = event.target;
    var tagName = target && target.tagName ? target.tagName.toLowerCase() : "";
    var isControl = /^(input|textarea|select|button|a|summary)$/.test(tagName) ||
                    (target && target.isContentEditable);
    var modifiers = event.altKey || event.ctrlKey || event.metaKey ||
                    event.shiftKey;
    var mapped = map[event.which || event.keyCode];

    if (modifiers || isControl) return;
    if (mapped !== undefined) {
      event.preventDefault();
      self.emit("move", mapped);
    }
    if ((event.which || event.keyCode) === 82) self.restart.call(self, event);
  });

  this.bindButtonPress(".retry-button", this.restart);
  this.bindButtonPress(".restart-button", this.restart);
  this.bindButtonPress(".keep-playing-button", this.keepPlaying);

  var touchStartClientX, touchStartClientY;
  var gameContainer = document.getElementsByClassName("game-container")[0];

  gameContainer.addEventListener(this.eventTouchstart, function (event) {
    if (!window.navigator.msPointerEnabled && event.touches.length !== 1) {
      touchStartClientX = undefined;
      touchStartClientY = undefined;
      return;
    }
    if (event.targetTouches && event.targetTouches.length > 1) return;
    if (window.navigator.msPointerEnabled) {
      touchStartClientX = event.pageX;
      touchStartClientY = event.pageY;
    } else {
      touchStartClientX = event.touches[0].clientX;
      touchStartClientY = event.touches[0].clientY;
    }
  }, { passive: true });

  gameContainer.addEventListener(this.eventTouchmove, function (event) {
    if (event.cancelable) event.preventDefault();
  }, { passive: false });

  gameContainer.addEventListener(this.eventTouchend, function (event) {
    if (touchStartClientX === undefined || touchStartClientY === undefined) {
      return;
    }
    if (!window.navigator.msPointerEnabled && event.touches.length > 0) return;
    if (event.targetTouches && event.targetTouches.length > 0) return;

    var touch = window.navigator.msPointerEnabled ? null : event.changedTouches[0];
    var touchEndClientX = window.navigator.msPointerEnabled ?
      event.pageX : touch.clientX;
    var touchEndClientY = window.navigator.msPointerEnabled ?
      event.pageY : touch.clientY;
    var dx = touchEndClientX - touchStartClientX;
    var dy = touchEndClientY - touchStartClientY;
    var absDx = Math.abs(dx);
    var absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 18) {
      self.emit("move", absDx > absDy ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
    }
    touchStartClientX = undefined;
    touchStartClientY = undefined;
  }, { passive: true });

  gameContainer.addEventListener("touchcancel", function () {
    touchStartClientX = undefined;
    touchStartClientY = undefined;
  }, { passive: true });
};

KeyboardInputManager.prototype.restart = function (event) {
  if (event && event.preventDefault) event.preventDefault();
  this.emit("restart");
};

KeyboardInputManager.prototype.keepPlaying = function (event) {
  if (event && event.preventDefault) event.preventDefault();
  this.emit("keepPlaying");
};

KeyboardInputManager.prototype.bindButtonPress = function (selector, fn) {
  var button = document.querySelector(selector);
  button.addEventListener("click", fn.bind(this));
};
