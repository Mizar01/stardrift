/**
* Define the buttons and HUD for the human player.
**/
function define_player_HUD() {
	var displayInfo = new ACE3.DisplayValue("", "", ace3.getFromRatio(15, 7))
	displayInfo.separator = ""


	var upgradeButton = new DefaultGameButton("UP", ace3.getFromRatio(18, 2),
		                        new THREE.Vector2(25, 25), null)
	upgradeButton.currentUnit = null
	upgradeButton.displayInfo = displayInfo
	upgradeButton.initLoopLogic = function() {
		// store the current unit
		this.currentUnit = null
		var us = selectManager.unitSelector.selectedUnits
		if (us.length == 1) {
			var u = us[0]
	        if (GameUtils.isUnit(u)  && GameUtils.isHuman(u)) {
				this.currentUnit = u
			}
		}

	}

	upgradeButton.getInfoMessage = function() {
		if (this.currentUnit) {
			return this.currentUnit.getInfoForUpgrade()
		}
	}

	upgradeButton.hiddenLogic = function() {
		if (this.currentUnit == null) {
			return true
		}
		return false
	} 
	upgradeButton.disableLogic = function() {
		var u = this.currentUnit
		if (u.canUpgrade()) {
			return false
		}
		return true
	}

	upgradeButton.onClickFunction = function() {
			this.currentUnit.upgrade()
	}

	var satelliteShotButton = new DefaultGameButton("SS", ace3.getFromRatio(21, 2),
		                        new THREE.Vector2(25, 25), null)
	satelliteShotButton.displayInfo = displayInfo
	satelliteShotButton.initLoopLogic = function() {
		// store the current unit
		var us = selectManager.unitSelector.selectedUnits
		if (us.length == 1) {
			var u = us[0]
	        if (GameUtils.isUnit(u)  && GameUtils.isHuman(u)) {
				this.currentUnit = u
			}
		}

	}

	satelliteShotButton.getInfoMessage = function() {
		return humanPlayer.getInfoSatelliteShot()
	}

	satelliteShotButton.disableLogic = function() {
		if (!humanPlayer.canSatelliteShoot()) {
			return true
		}else {
			return false
		}
	}

	satelliteShotButton.onClickFunction = function() {
			humanPlayer.satelliteLaunch()
	}


	var increaseMaxUnits = new DefaultGameButton("+1", ace3.getFromRatio(24, 2),
		                        new THREE.Vector2(25, 25), null)
	increaseMaxUnits.displayInfo = displayInfo
	increaseMaxUnits.getInfoMessage = function() {
		return humanPlayer.getInfoIncreaseMaxUnits()
	}
	increaseMaxUnits.disableLogic = function() {
		if (!humanPlayer.canIncreaseMaxUnits()) {
			return true
		}else {
			return false
		}
	}
	increaseMaxUnits.onClickFunction = function() {
			humanPlayer.increaseMaxUnits()
	}

    // human player resource info
    var resourceInfo = new ACE3.DisplayValue("<img src='media/particle.png' style='vertical-align: middle;'/>",
                                         0, ace3.getFromRatio(10, 2))
    resourceInfo.separator = ""
    resourceInfo.baseCss.backgroundColor = "transparent"
    resourceInfo.baseCss.color = "white"
    resourceInfo.valueFunction = function() {return humanPlayer.resources}
    
	hudManager = new ACE3.PureHTMLActorManager()
	hudManager.registerActor(displayInfo)
    hudManager.registerActor(resourceInfo)
	hudManager.registerActor(upgradeButton)
	hudManager.registerActor(satelliteShotButton)
	hudManager.registerActor(increaseMaxUnits)

}
