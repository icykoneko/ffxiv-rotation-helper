class GamepadButtonState {
  constructor() {
    this.reset();
  }

  reset() {
    this.gamepad = null;
    this.lastTimestamp = 0;
    this.du = false;
    this.dr = false;
    this.dd = false;
    this.al = false;
    this.au = false;
    this.ar = false;
    this.ad = false;
    this.l1 = false;
    this.l2 = false;
    this.r1 = false;
    this.r2 = false;
    this.last_l2 = 0;
    this.last_r2 = 0;
    this.since_last_l2 = 0;
    this.since_last_r2 = 0;
  }

  updateButton(button_name, button) {
    var oldValue = this[button_name];
    var newValue = button.value > 0.1;
    if (newValue != oldValue) {
      this[button_name] = newValue;
      return true;
    }
    return false;
  }

  updateButtons(gamepad) {
    if (gamepad.timestamp > this.lastTimestamp) {
      var updated = [];
      this.lastTimestamp = gamepad.timestamp;
      /*
       * The buttons that we care about:
       *       [6] L2                R2 [7]
       *       [4] L1                R1 [5]
       *        [12]                  [3]
       *         DU                    AU
       * [14] DL    DR [15]     [2] AL    AR [1]
       *         DD                    AD
       *        [13]                   [0]
       */
      this.updateButton('dl', gamepad.buttons[14]) && updated.push('dl');
      this.updateButton('du', gamepad.buttons[12]) && updated.push('du');
      this.updateButton('dr', gamepad.buttons[15]) && updated.push('dr');
      this.updateButton('dd', gamepad.buttons[13]) && updated.push('dd');
      this.updateButton('al', gamepad.buttons[2]) && updated.push('al');
      this.updateButton('au', gamepad.buttons[3]) && updated.push('au');
      this.updateButton('ar', gamepad.buttons[1]) && updated.push('ar');
      this.updateButton('ad', gamepad.buttons[0]) && updated.push('ad');
      this.updateButton('l1', gamepad.buttons[4]) && updated.push('l1');
      if (this.updateButton('l2', gamepad.buttons[6])) {
        updated.push('l2');
        if (this.l2) {
          var time = performance.now();
          this.since_last_l2 = time - this.last_l2;
          this.last_l2 = time;
        }
      }
      this.updateButton('r1', gamepad.buttons[5]) && updated.push('r1');
      if (this.updateButton('r2', gamepad.buttons[7])) {
        updated.push('r2');
        if (this.r2) {
          var time = performance.now();
          this.since_last_r2 = time - this.last_r2;
          this.last_r2 = time;
        }
      }
      return updated;
    }
    return [];
  }
}

class CrossHotbarController {
  constructor() {
    this.buttonStates = new GamepadButtonState();
    this.selectedGamepad = null;
    this.activeHotbar = null;
    this.activeHotbarObserver = new Rx.BehaviorSubject(null);
    this.buttonPressedObserver = new Rx.BehaviorSubject([]);
  }

  setGamepad(gamepadId) {
    if (gamepadId === '' || gamepadId === null) {
      this.selectedGamepad = null;
      this.buttonStates.reset()
      /* TODO: Notify listeners the state was reset? */
    } else {
      this.selectedGamepad = gamepadId;
      this.buttonStates.reset();
      this.updateLoop();
    }
    console.log("Gamepad set to: ", this.selectedGamepad)
  }

  updateLoop() {
    /* Request update loop continue to be called! */
    if (this.selectedGamepad != null) {
      window.requestAnimationFrame(_(this.updateLoop).bind(this));
    }
    /* Poll connected gamepads */
    var gamepads = navigator.getGamepads();
    for (var i = 0; i < gamepads.length; ++i) {
      var pad = gamepads[i];
      if (pad === null || !pad.connected) continue;
      /* Is this the gamepad we're monitoring? */
      if (pad.id == this.selectedGamepad) {
        this.handleButtonUpdate(this.buttonStates.updateButtons(pad));
        return;
      }
    }
    /* If we got this far, something's wrong... */
    console.error("Selected gamepad wasn't found...");
    this.setGamepad(null);
  }

  activateHotbar(bar) {
    console.log("Activating hotbar: ", bar);
    this.activeHotbar = bar;
    this.activeHotbarObserver.next(this.activeHotbar);
  }

  handleButtonUpdate(updatedButtons) {
    if (updatedButtons.length == 0) return;
    console.log("Buttons Updated: ", updatedButtons)
    if (this.activeHotbar == null) {
      if (this.buttonStates.l2) {
        if (this.buttonStates.since_last_l2 < 250) {
          this.activateHotbar('WXL'); /* L2 -> L2 */
        } else {
          this.activateHotbar('L');
        }
      } else if (this.buttonStates.r2) {
        if (this.buttonStates.since_last_r2 < 250) {
          this.activateHotbar('WXR'); /* R2 -> R2 */
        } else {
          this.activateHotbar('R');
        }
      }
    } else if (this.activeHotbar == 'L') {
      if (!this.buttonStates.l2) {
        this.activateHotbar(null);
      } else if (this.buttonStates.r2) {
        this.activateHotbar('XL'); /* L2 -> R2 */
      }
    } else if (this.activeHotbar == 'R') {
      if (!this.buttonStates.r2) {
        this.activateHotbar(null);
      } else if (this.buttonStates.l2) {
        this.activateHotbar('XR'); /* R2 -> L2 */
      }
    } else if (this.activeHotbar == 'XL') {
      if (!this.buttonStates.r2) {
        if (!this.buttonStates.l2) {
          this.activateHotbar(null);
        } else {
          this.activateHotbar('L');
        }
      } else if (!this.buttonStates.l2) {
        this.activateHotbar('R');
      }
    } else if (this.activeHotbar == 'XR') {
      if (!this.buttonStates.l2) {
        if (!this.buttonStates.r2) {
          this.activateHotbar(null);
        } else {
          this.activateHotbar('R');
        }
      } else if (!this.buttonStates.r2) {
        this.activateHotbar('L');
      }
    } else if (this.activeHotbar == 'WXL') {
      if (!this.buttonStates.l2) {
        if (this.buttonStates.r2) {
          this.activateHotbar('R');
        } else {
          this.activateHotbar(null);
        }
      } else if (this.buttonStates.r2) {
        /* Special case -- remember we WERE in WXL */
        this.activateHotbar('R-WXL');
      }
    } else if (this.activeHotbar == 'WXR') {
      if (!this.buttonStates.r2) {
        if (this.buttonStates.l2) {
          this.activateHotbar('L');
        } else {
          this.activateHotbar(null);
        }
      } else if (this.buttonStates.l2) {
        /* Special case -- remember we WERE in WXR */
        this.activateHotbar('L-WXR');
      }
    } else if (this.activeHotbar == 'R-WXL') {
      if (!this.buttonStates.r2) {
        if (this.buttonStates.l2) {
          this.activateHotbar('WXL');
        } else {
          this.activateHotbar(null);
        }
      } else if (!this.buttonStates.l2) {
        /* Plain R2 mode now */
        this.activateHotbar('R');
      }
    } else if (this.activeHotbar == 'L-WXR') {
      if (!this.buttonStates.l2) {
        if (this.buttonStates.r2) {
          this.activateHotbar('WXR');
        } else {
          this.activateHotbar(null);
        }
      } else if (!this.buttonStates.r2) {
        /* Plain L2 mode now */
        this.activateHotbar('L');
      }
    }

    if (_.intersection(['dl','du','dr','dd','al','au','ar','ad'],
                       updatedButtons).length > 0) {
      var pressedButtons = [];
      this.buttonStates.dl && pressedButtons.push('dl');
      this.buttonStates.du && pressedButtons.push('du');
      this.buttonStates.dr && pressedButtons.push('dr');
      this.buttonStates.dd && pressedButtons.push('dd');
      this.buttonStates.al && pressedButtons.push('al');
      this.buttonStates.au && pressedButtons.push('au');
      this.buttonStates.ar && pressedButtons.push('ar');
      this.buttonStates.ad && pressedButtons.push('ad');
      this.buttonPressedObserver.next(pressedButtons);
    }
  }
}




let crossHotbarController = new CrossHotbarController;
//crossHotbarController.updateLoop();
