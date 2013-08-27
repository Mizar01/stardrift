// Various objects for the game other than actors and logics

function Player(name,controller) {
    this.controller = controller
    this.name = name
    this.color = 0xff0000 //red default
    players[this.name] = this
    this.unitCount = 0
    this.maxUnits = 6
    this.maxUnitsLimit = 12
    this.increaseMaxUnitsLimitCost = this.maxUnits * 60 
    this.sectorCount = 0
    this.resources = 1000
    this.satelliteShotLastTime = -10
    this.satelliteShotCooldown = 100
    this.satelliteShotCost = 50
    //this.units = new Array()
    /**
     * Adds a unit actor to the player and register it to the gameManager
     */
    this.addUnit = function(unit, x, y, z) {
        //console.log(unit)
        unit.obj.position.set(x,y,z)
        unit.setColor(this.color)
        unit.owner = this
        //this.units.push(unit)
        //console.log(unit)
        gameManager.registerActor(unit)
        this.unitCount++
    }

    this.getSpawnCooldown = function() {
        return 500 + this.unitCount * 50 + this.sectorCount * 20
    }

    this.getInfoSatelliteShot = function() {
        return "Neutralizes random enemy tower. Cost: " + this.satelliteShotCost
    }

    this.canSatelliteShoot = function() {
        var tt = ace3.time.frameTime
        // console.log (tt - this.satelliteShotLastTime)
        if (tt - this.satelliteShotLastTime < this.satelliteShotCooldown) {
            return false
        }
        if (this.resources < this.satelliteShotCost) {
            return false
        }
        return true
    }

    this.satelliteLaunch = function() {
        var tsArray = []
        //find enemy tower sectors
        for (var i in terrain.actorChildren) {
            var s = terrain.actorChildren[i]
            if (s.getType() == 'TowerSector' && GameUtils.isEnemySector(this, s)) {
                tsArray.push(s)
            }
        }
        if (tsArray.length < 1) {
            // no enemy towers. No shooting.
            return false
        }else {
            //choose a random enemyTower
            var rti = THREE.Math.randInt(0, tsArray.length - 1)
            var target = tsArray[rti]
            var ss = new SatelliteShot(this, target)
            gameManager.registerActor(ss)
            this.resources -= this.satelliteShotCost
            this.satelliteShotLastTime = ace3.time.frameTime
        }
    }

    this.increaseMaxUnits = function() {
        if (this.maxUnits < this.maxUnitsLimit) {
            this.maxUnits++
        }
        this.resources -= this.increaseMaxUnitsLimitCost
        this.increaseMaxUnitsLimitCost += this.maxUnits * 60
    }
    this.canIncreaseMaxUnits = function() {
        return (this.maxUnits < this.maxUnitsLimit) && this.resources >= this.increaseMaxUnitsLimitCost
    }
    this.getInfoIncreaseMaxUnits = function() {
        if (this.maxUnits < this.maxUnitsLimit) {
            return "Increase max units to " + (this.maxUnits + 1) + ". Cost: " + this.increaseMaxUnitsLimitCost
        }else {
            return "Max units reached."
        }
    }
}


function UnitSelector() {
    this.selectedUnits = new Array()
    this.multiSelector = new AreaSelector()

    /**
    * Select a signe unit deselecting every other unit
    */
    this.selectSingleUnit = function(unit) {
        this.unselect()
        this.selectUnit(unit)
    }

    /**
    * Select the unit without deselecting the other selected units
    */
    this.selectUnit = function(unit) {
        unit.select()
        this.selectedUnits.push(unit)        
    }

    /**
    * The selection of an area. 
    * If an area has some units these will be selected and returns true
    * If an area has no unit, the previous selection is maintained and returns false.
    */
    this.selectUnits = function(selStart, selEnd) {
        var units = this.findUnits(selStart, selEnd)
        if (units.length > 0) {
            this.unselect()
            for (var i in units) {
                this.selectUnit(units[i])
            }
            return true
        }
        return false
    }
    this.reset = function() {
        this.unselect()
    }
    this.unselect = function() {
        for (var i in this.selectedUnits) {
            var u = this.selectedUnits[i]
            u.unselect()
        }
        this.selectedUnits = new Array()
    }

    this.findUnits = function(selStart, selEnd) {
        var sorting = ACE3.Math.getSortedCoords(selStart, selEnd)
        var units = new Array()        
        for (var ui in gameManager.actors) {
            var u = gameManager.actors[ui]
            if (GameUtils.isUnit(u) && GameUtils.isHuman(u) && u.isBetweenCoords(sorting.v2Start, sorting.v2End)) {
                units.push(u)
            } 
        }
        return units
    }

    this.selectionActive = function() {
        return this.selectedUnits.length > 0
    }

    /**
    * Set the enemy as a target for all selected units
    */
    this.selectEnemyForUnits = function(enemy) {
        for (var i in this.selectedUnits) {
            var u = this.selectedUnits[i]
            this.selectEnemyForUnit(u, enemy)
        }        
    }
    /**
    * this is going to set target and hilight it
    */
    this.selectEnemyForUnit = function(unit, enemy) {
        unit.resetAllTargets()
        unit.targetUnit = enemy
        enemy.selectAsTarget()
    }



    this.selectSectorForUnits = function(sector) {
        for (var i in this.selectedUnits) {
            var u = this.selectedUnits[i]
            this.selectSectorForUnit(u, sector)
        }       
    }
    /**
    * this is going to set target and hilight it
    */
    this.selectSectorForUnit = function(unit, sector) {
        unit.resetAllTargets()
        unit.targetSector = sector
        sector.selectAsTarget()
    }




    this.selectPointForUnits = function(point) {
        for (var i in this.selectedUnits) {
            var u = this.selectedUnits[i]
            this.selectPointForUnit(u, point)
        }       
    }
    /**
    * this is going to set target and hilight it
    */
    this.selectPointForUnit = function(unit, point) {
        unit.resetAllTargets()
        unit.targetPosition = point
        terrain.selectAsTarget(point)
    } 

}