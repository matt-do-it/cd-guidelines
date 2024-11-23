class MicroEvent {
  /**
   * MicroEvent - to make any js object an event emitter
   *
   * - pure javascript - server compatible, browser compatible
   * - dont rely on the browser doms
   * - super simple - you get it immediatly, no mistery, no magic involved
   *
   * Also see: https://javascript.info/mixins#eventmixin
   *
   * @author Jerome Etienne (https://github.com/jeromeetienne)
   */
  constructor() {}

  on(event, fn) {
    this._events = this._events || {};
    this._events[event] = this._events[event] || [];
    this._events[event].push(fn);
  }

  off(event, fn) {
    const argsLength = arguments.length;
    if (argsLength === 0) {
      return delete this._events;
    }
    if (argsLength === 1) {
      return delete this._events[event];
    }

    this._events = this._events || {};
    if ((!event) in this._events) {
      return;
    }
    this._events[event].splice(this._events[event].indexOf(fn), 1);
  }

  trigger(event /* , args... */) {
    this._events = this._events || {};
    if ((!event) in this._events || !this._events[event]) {
      return;
    }

    for (let i = 0; i < this._events[event].length; i++) {
      this._events[event][i].apply(
        this,
        Array.prototype.slice.call(arguments, 1),
      );
    }
  }

  static mixin(destObject) {
    const props = ["on", "off", "trigger"];
    for (let i = 0; i < props.length; i++) {
      destObject.prototype[props[i]] = MicroEvent.prototype[props[i]];
    }
  }
}

export { MicroEvent };
