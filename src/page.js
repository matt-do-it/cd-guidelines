import { MicroEvent } from "./micro_event";

class PageMetrics {
  constructor() {
    this.viewportHeight = 0;
    this.scrollY = 0;
  }

  updateMetrics() {
    this.viewportHeight = window.innerHeight;
    this.scrollY = window.scrollY;
  }

  updateScrollPosition() {
    this.scrollY = window.scrollY;
  }
}

class ScrollGroup {
  constructor(element) {
    this.element = element;
    this.name = this.element.dataset.animationGroup;

    this.boundsMin = 0;
    this.boundsMax = 0;

    this.tValue = 0;
    this.coverPage = 0; // From -1 to 1
  }

  updatePositionOnPage(pageMetrics) {
    var rect = this.element.getBoundingClientRect();

    this.boundsMin = rect.y + pageMetrics.scrollY;
    this.boundsMax = rect.y + rect.height + pageMetrics.scrollY;
  }

  hasDuration() {
    return this.viewableRange.min != this.viewableRange.max;
  }

  updateTValue(pageMetrics) {
    let newValue =
      (pageMetrics.scrollY + pageMetrics.viewportHeight - this.boundsMin) /
      (this.boundsMax - this.boundsMin + pageMetrics.viewportHeight);

    if (newValue < 0) {
      newValue = 0;
    }

    if (newValue > 1.0) {
      newValue = 1.0;
    }

    let newCoverPage = undefined;

    if (pageMetrics.scrollY + pageMetrics.viewportHeight < this.boundsMin) {
      newCoverPage = -1;
    }

    if (
      pageMetrics.scrollY < this.boundsMin &&
      pageMetrics.scrollY + pageMetrics.viewportHeight > this.boundsMin
    ) {
      newCoverPage =
        (pageMetrics.scrollY - this.boundsMin) / pageMetrics.viewportHeight;
    }

    if (
      pageMetrics.scrollY > this.boundsMin &&
      pageMetrics.scrollY + pageMetrics.viewportHeight < this.boundsMax
    ) {
      newCoverPage = 0;
    }

    if (pageMetrics.scrollY + pageMetrics.viewportHeight > this.boundsMax) {
      newCoverPage =
        -(this.boundsMax - pageMetrics.scrollY) / pageMetrics.viewportHeight +
        1;
    }
    if (pageMetrics.scrollY > this.boundsMax) {
      newCoverPage = 1;
    }

    let elementScrollPosition =
      this.tValue *
      (this.boundsMax - this.boundsMin + pageMetrics.viewportHeight);
    elementScrollPosition = elementScrollPosition - pageMetrics.viewportHeight;
    elementScrollPosition =
      elementScrollPosition / (this.boundsMax - this.boundsMin);
    if (elementScrollPosition < 0) {
      elementScrollPosition = 0;
    }
    if (elementScrollPosition > 1) {
      elementScrollPosition = 1;
    }

    if (newValue != this.value) {
      this.tValue = newValue;
      this.coverPage = newCoverPage;
      this.elementScrollPosition = elementScrollPosition;
      this.trigger("change", this);
    }
  }
}

MicroEvent.mixin(ScrollGroup);

class Keyframe {
  constructor(time, value) {
    this.time = time;
    this.value = value;
  }
}

class Timeline {
  constructor(scrollGroupName, keyframes) {
    this.scrollGroupName = scrollGroupName;

    this.keyframes = keyframes;

    this.currentKeyframe = undefined;
    this.currentTValue = 0;

    this.cachedScaledValue = undefined;
  }

  setup(scrollGroup) {
    scrollGroup.on("change", this.execute.bind(this));
    this.execute(scrollGroup);
  }

  execute(scrollGroup) {
    if (this.currentKeyframe == undefined) {
      this.currentTValue = 0;
      this.currentKeyframe = 0;
    }

    var newTValue = scrollGroup.tValue;

    if (newTValue > this.currentTValue) {
      while (
        this.currentKeyframe < this.keyframes.length - 2 &&
        newTValue >= this.keyframes[this.currentKeyframe + 1].time
      ) {
        this.currentKeyframe = this.currentKeyframe + 1;
      }
    } else {
      while (
        this.currentKeyframe > 0 &&
        newTValue < this.keyframes[this.currentKeyframe].time
      ) {
        this.currentKeyframe = this.currentKeyframe - 1;
      }
    }

    var startTime = this.keyframes[this.currentKeyframe].time;
    var endTime = this.keyframes[this.currentKeyframe + 1].time;

    var startValue = this.keyframes[this.currentKeyframe].value;
    var endValue = this.keyframes[this.currentKeyframe + 1].value;

    var relativeTime = undefined;

    if (newTValue < startTime) {
      relativeTime = 0;
    } else if (newTValue >= endTime) {
      relativeTime = 1;
    } else {
      relativeTime = (newTValue - startTime) / (endTime - startTime);
    }

    var scaledValue = relativeTime * (endValue - startValue) + startValue;

    this.currentTValue = newTValue;

    if (this.cachedScaledValue != scaledValue) {
      this.trigger("change", this, scrollGroup, scaledValue);

      this.cachedScaledValue = scaledValue;
    }
  }

  addKeyframe(keyframe) {
    this.keyframes.push(keyframe);
  }
}

MicroEvent.mixin(Timeline);

class Page {
  constructor() {
    this.pageMetrics = new PageMetrics();
    this.scrollGroups = [];
    this.scrollGroupsByName = {};

    this.timelines = [];

    this.canvasAnimationsByName = {};
  }

  addTimeline(scrollGroupName, keyframes) {
    let timeline = new Timeline(scrollGroupName, keyframes);
    this.timelines.push(timeline);

    let scrollGroup = this.scrollGroupsByName[timeline.scrollGroupName];
    if (!scrollGroup) {
      return;
    }
    timeline.setup(scrollGroup);

    return timeline;
  }

  addCanvasAnimation(name, draw_callback) {
    this.canvasAnimationsByName[name] = draw_callback;
    draw_callback();
  }

  menuBackHandler(event) {
    event.preventDefault();

    var menu = document.querySelector("nav .flyout-menu");
    menu.classList.remove("level-2");

    if (menu.children.length > 1) {
      menu.children[1].remove();
    }
    return false;
  }

  setup() {
    this.pageMetrics.updateMetrics();
    window.addEventListener(
      "resize",
      this.debounce(this.onResize.bind(this), 30),
    );
    window.addEventListener("scroll", this.onScroll.bind(this));

    document.addEventListener(
      "fullscreenchange",
      this.debounce(this.onResize.bind(this), 30),
      false,
    );

    document.querySelectorAll("[data-animation-group]").forEach(
      function (element) {
        let scrollGroup = new ScrollGroup(element);
        scrollGroup.updatePositionOnPage(this.pageMetrics);
        scrollGroup.updateTValue(this.pageMetrics);
        this.scrollGroups.push(scrollGroup);
        this.scrollGroupsByName[element.dataset.animationGroup] = scrollGroup;
      }.bind(this),
    );

    document
      .querySelectorAll("[data-trigger-nav-toggle]")
      .forEach(function (element) {
        element.addEventListener("click", function (event) {
          event.preventDefault();
          element.classList.toggle("expanded");
          document.querySelectorAll("nav").forEach(function (element) {
            if (element.classList.contains("visible")) {
              element.classList.remove("visible");
            } else {
              element.classList.add("visible");
              element.classList.remove("search-visible");
              element.classList.remove("search-results-visible");
            }
          });
        });
      });
    document
      .querySelectorAll("[data-trigger-search-toggle]")
      .forEach(function (element) {
        element.addEventListener("click", function (event) {
          event.preventDefault();
          element.classList.toggle("expanded");
          document.querySelectorAll("nav").forEach(function (element) {
            if (element.classList.contains("search-visible")) {
              element.classList.remove("search-visible");
              element.classList.remove("search-results-visible");
            } else {
              element.classList.add("search-visible");
              element.classList.remove("visible");

              var searchField = document.querySelector("[data-global-search]");
              if (searchField) {
                searchField.focus();
              }
            }
          });
        });
      });
    document
      .querySelectorAll("[data-trigger-search-execute]")
      .forEach(function (element) {
        element.addEventListener("click", function (event) {
          event.preventDefault();
          document.querySelectorAll("nav").forEach(function (element) {
            if (!element.classList.contains("search-results-visible")) {
              element.classList.add("search-results-visible");
            }
          });
        });
      });
    var searchField = document.querySelector("[data-global-search]");
    if (searchField) {
      searchField.addEventListener("input", function (event) {
        if (searchField.value != "") {
          document.querySelectorAll("nav").forEach(function (element) {
            if (!element.classList.contains("search-results-visible")) {
              element.classList.add("search-results-visible");
            }
          });
        } else {
          document.querySelectorAll("nav").forEach(function (element) {
            if (element.classList.contains("search-results-visible")) {
              element.classList.remove("search-results-visible");
            }
          });
        }
      });
    }
    document.querySelectorAll(".dropdown").forEach(function (element) {
      element.addEventListener("click", function (event) {
        event.preventDefault();
        element.classList.toggle("expanded");

        var menu = element.nextElementSibling;
        if (menu.classList.contains("visible")) {
          menu.classList.add("invisible");
          menu.classList.remove("visible");
        } else {
          menu.classList.remove("invisible");
          menu.classList.add("visible");
        }

        document.querySelectorAll(".dropdown").forEach(function (otherElement) {
          if (otherElement != element) {
            otherElement.classList.remove("expanded");
            otherElement.nextElementSibling.classList.add("invisible");
            otherElement.nextElementSibling.classList.remove("visible");
          }
        });
      });
    });

    document.querySelectorAll("[data-menu-toggle]").forEach(
      function (element) {
        element.addEventListener(
          "click",
          function (event) {
            event.preventDefault();

            var newSecondLevel = element.nextElementSibling;
            var menu = document.querySelector("nav .flyout-menu");

            if (menu.children.length > 1) {
              menu.children[1].remove();
            }

            menu.classList.add("level-2");

            var clonedSecondLevel = newSecondLevel.cloneNode(true);
            menu.appendChild(clonedSecondLevel);

            clonedSecondLevel.querySelectorAll("[data-menu-back]").forEach(
              function (element) {
                element.addEventListener("click", this.menuBackHandler);
              }.bind(this),
            );

            return false;
          }.bind(this),
        );
      }.bind(this),
    );

    document.querySelectorAll("[data-menu-back]").forEach(
      function (element) {
        element.addEventListener("click", this.menuBackHandler);
      }.bind(this),
    );

    document.querySelectorAll(".tab-content").forEach(function (element) {
      element.style.display = "none";
    });

    document.querySelectorAll(".tab-menu").forEach(function (element) {
      var links = element.querySelectorAll("a");

      if (links.length > 0) {
        document.querySelector(links[0].getAttribute("href")).style.display =
          "block";
      }

      element.addEventListener("click", function (event) {
        event.preventDefault();

        var tabMenu = event.target.closest(".tab-menu");

        var oldTab = tabMenu.querySelector("li.active");

        var newTab = event.target.closest("li");
        var newTabLink = newTab.querySelector("a");

        document.querySelector(newTabLink.getAttribute("href")).style.display =
          "block";
        newTab.classList.add("active");

        if (oldTab) {
          var oldTabLink = oldTab.querySelector("a");
          if (oldTabLink) {
            document.querySelector(
              oldTabLink.getAttribute("href"),
            ).style.display = "none";
          }
          oldTab.classList.remove("active");
        }
      });
    });

    this.onResize();
  }

  onResize() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.pageMetrics.updateMetrics();

        this.scrollGroups.forEach(
          function (group) {
            group.updatePositionOnPage(this.pageMetrics);
            group.updateTValue(this.pageMetrics);
          }.bind(this),
        );

        document.querySelectorAll("[data-canvas-resize]").forEach(
          function (element) {
            var scaleFactor = element.dataset.canvasResize;
            if (!scaleFactor) {
              scaleFactor = 1;
            }
            let container = element.parentElement;
            let boundingRect = container.getBoundingClientRect();
            element.width = boundingRect.width * scaleFactor;
            element.height = boundingRect.height * scaleFactor;
          }.bind(this),
        );

        for (let id in this.canvasAnimationsByName) {
          this.canvasAnimationsByName[id]();
        }
      });
    });
  }

  debounce(func, time) {
    var time = time || 100; // 100 by default if no param
    var timer;
    return function (event) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(func, time, event);
    };
  }

  onScroll(event) {
    this.pageMetrics.updateScrollPosition();
    this.scrollGroups.forEach(
      function (group) {
        group.updateTValue(this.pageMetrics);
      }.bind(this),
    );
  }
}

MicroEvent.mixin(Page);

export { Page, Timeline, Keyframe };
