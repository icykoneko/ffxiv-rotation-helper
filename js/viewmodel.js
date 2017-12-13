class CrossHotbarConfig {
  constructor() {
    this.dpad = {left: null, up: null, right: null, down: null};
    this.analog = {left: null, up: null, right: null, down: null};
  }
}

class ViewModel {
  constructor() {
    this.hotbarConfiguration = {
      L: new CrossHotbarConfig(),
      R: new CrossHotbarConfig(),
      XL: new CrossHotbarConfig(),
      XR: new CrossHotbarConfig(),
      WXL: new CrossHotbarConfig(),
      WXR: new CrossHotbarConfig(),
    };
    this.hotbarConfigurationObserver = new Rx.Subject();
  }

  assignSlot(bar, side, slot, action) {
    this.hotbarConfiguration[bar][side][slot] = action;
    /* This is probably inefficient... */
    this.hotbarConfigurationObserver.next({
      bar: bar, side: side, slot: slot, action: action
    });
  }

  getIconForAction(action) {
    return _(ACTIONS).chain()
      .values()
      .flatten()
      .findWhere({_id: Number(action)})
      .propertyOf()
      .value()('icon');
  }
}

let viewModel = new ViewModel;
