"use strict";

import { Page, Timeline, Keyframe } from "./page";
import "./scss/styles-base.scss";

let page = new Page();

window.addEventListener("load", function (event) {
  page.setup();
});
