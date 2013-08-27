/**
 * Base object for units
 */
Unit = function(owner) {
    ACE3.Actor3D.call(this)
    this.obj = null
    this.owner = owner
    this.targetPosition = null // Vector2 x, y (in this case we are going to use .y for z coord.)
    this.targetUnit = null
    this.targetSector = null
    this.range = 5
    this.life = 50
    this.maxLife = 100
    this.damage = 5
    this.cooldown = 50
    this.currentCooldown = 0
    this.speed = 0.02 //defaul 0.02
    this.level = 1
    this.maxLevel = 3
    this.nextUpgradeCost = 20
    this.selected = false
    this.hlSelect = new HLSelect() //the actor hilighter for this unit
    this.hlEnemy = new HLEnemy()  // the actor to hilight this enemy as a target
}
Unit.extends(ACE3.Actor3D, "Unit")

/**
* Before calling this function it is better to deselect the previous actors,
* Until multiselection is not enabled.
*/
Unit.prototype.select = function() {
    selectedUnit = this
    this.selected = true
    this.hlSelect.select(this)
    //if the unit has a targetSector, Position or Unit, these will be re-hilighted
    if (this.targetUnit != null) {
        this.targetUnit.selectAsTarget()   
    }
    if (this.targetSector != null) {
        this.targetSector.selectAsTarget()
    }
    if (this.targetPosition != null) {
        terrain.selectAsTarget(this.targetPosition)
    }

}

Unit.prototype.selectAsTarget = function() {
    this.hlEnemy.select(this)
}

Unit.prototype.unselect = function() {
    if (!this.selected) {
        return;
    }
    selectedUnit = null
    this.selected = false
    this.hlSelect.unselect()
    this.hlEnemy.unselect()
    if (this.targetSector != null) this.targetSector.unselect() 
    if (this.targetPosition != null) terrain.hlPoint.unselect()     
}

Unit.prototype.resetAllTargets = function() {
    if (this.targetUnit != null) {
        this.targetUnit.unselect()
        this.targetUnit = null
    }
    if (this.targetSector != null) {
        this.targetSector.unselect()
        this.targetSector = null
    }
    if (this.targetPosition != null) {
        terrain.unselect()
        this.targetPosition = null
    }
}


Unit.prototype.run = function() {

    // if (this.alive && this.life <= 0) {
    //     this.setForRemoval()
    //     return
    // }

    //this.obj.rotation.y += 0.01
    var tu = this.targetUnit
    var tp = this.targetPosition
    var ts = this.targetSector
    var pos = this.obj.position
    // I give precedence to the sector/position if targeted. In any case if I'm engaged by
    // an enemy the actor also have a target Unit. So the actor continue moving toward the sector/position
    // but he returns fire to the enemy.
    if (tu != null) {
        if (!tu.alive) {
            tu = null
        }else {
            this.attack()  // this will happen in any case
        }
    }
    if (tu == null) {
        this.targetUnit = this.findNearestTarget()
    }
    if (tp != null) {
        // note tp is a Vector2
        var tv = new THREE.Vector3(tp.x, pos.y, tp.y)
        if (pos.distanceTo(tv) < 0.4) {
            //target reached
            this.targetPosition = null
            if (this.selected) {
                terrain.unselect()
            }
        }else {
            //console.log(pos.distanceTo(tv))
            this.moveToward(tv)
        }
    }
    if (ts != null) {
        // move toward the targeted sector
        // y coord does not count
            var targetPos = ts.obj.position
            var tv = new THREE.Vector3(targetPos.x, pos.y, targetPos.z)
            if (pos.distanceTo(tv) < 0.4) {
                // own the sector
                ts.setOwner(this.owner)
                if (this.selected) { 
                    this.targetSector.unselect()
                }
                this.targetSector = null
            }else {
                // move toward the sector centre.
                this.moveToward(tv)
            }
    }
    if (tu != null && ts == null && tp == null) {
        //keep following the target unit.
        if (tu.obj.position.distanceTo(this.obj.position) >= this.range) {
            this.followActor(tu)
        }
    }
    this.refreshCooldown()


    this.runPlayerAI()



}

Unit.prototype.upgrade = function() {
    this.level += 1
    this.speed *= (1 + this.level / 10)
    this.damage *= (1 + this.level/10)
    this.life = 50 + this.level * 8
    this.cooldown = THREE.Math.clamp(this.cooldown - this.level * 3, 25)
    //console.log("The unit has reached level " + this.level)

    this.owner.resources -= this.nextUpgradeCost

    this.nextUpgradeCost = this.calcUpgradeCost()

    if (this.uniform.unitLevel) {
        this.uniform.unitLevel.value = this.level
    }
    // console.log("Unit Upgraded : level:" + this.level + ", speed:" + this.speed +
    //             ",damage:" + this.damage + ",life:" + this.life + ",cooldown:" + this.cooldown)
}

Unit.prototype.canUpgrade = function() {
    if (this.level < this.maxLevel && this.owner.resources > this.nextUpgradeCost) {
        return true
    }
}

Unit.prototype.getInfoForUpgrade = function() {
    if (this.level >= this.maxLevel) {
        return "lvl " + this.level + "(MAX)"
    }
    var s = "lvl " + this.level + ". Upgrade Cost: " + this.nextUpgradeCost
    return s
}

Unit.prototype.calcUpgradeCost = function() {
    return Math.round(Math.pow(this.level, 2) * 10) 
}


Unit.prototype.runPlayerAI = function() {
    if (GameUtils.isCPU(this)) {
        // Find continuosly a new sector to conquer
        if (this.targetSector == null) {
            // find the nearest sector
            this.targetSector = this.findNearestSector()
        }
        // If there are enough resources i'm going to upgrade.
        if (this.canUpgrade()) {
            var r = this.owner.resources;
            if (r > this.nextUpgradeCost * 3) {
                this.upgrade()
            }
        }
    }

}

Unit.prototype.refreshCooldown = function() {
    this.currentCooldown = THREE.Math.clampBottom(this.currentCooldown - 1, 0)
}


/**
* This function try to understand if the distance of the targeted Unit is enough 
* for shooting at it.
*
*/
Unit.prototype.attack = function() {
    var tup = this.targetUnit.obj.position
    if (tup.distanceTo(this.obj.position) < this.range) {
        this.engage()
        this.shoot()
    }
}

/**
* if the targeted unit has no other targets, this actor will become the target
* so this actor and its target are mutually linked as targets.
*/
Unit.prototype.engage = function() {
    enemy = this.targetUnit
    enemyTarget = enemy.targetUnit
    if (enemyTarget == null) {
        enemy.targetUnit = this
    }
}

Unit.prototype.shoot = function() {
    if (this.currentCooldown <= 0) {
        var s = new Shot(this, this.targetUnit)
        gameManager.registerActor(s)
        this.currentCooldown = this.cooldown
    }
}

Unit.prototype.followActor = function(actor) {
    this.lookAtXZFixed(actor.obj.position)
    this.obj.translateZ(this.getSpeed())
}

Unit.prototype.moveToward = function(position) {
    this.lookAtXZFixed(position)
    this.obj.translateZ(this.getSpeed())   
}

Unit.prototype.getSpeed = function() {
    var s = terrain.getSectorByWorldPosition(this.obj)
    if (s.getType() == "MagneticSector") {
        return this.speed * 0.5
    }
    return this.speed
}

Unit.prototype.getDamage = function(damage) {
    this.life -= damage
    if (this.life < 0) {
        this.alive = false
        this.manager.registerActor(new ACE3.Explosion(this.obj.position.clone()))
        shakeCameraLogic.activate()
    }
}

/**
* Find the nearest sector that is not already owned by the player
* The best algorithm should start from the actor position and go to
* detect nearest coords for sectors.
*/
Unit.prototype.findNearestSector = function() {
    var p = this.owner
    // calculate the sector of the current actor.
    var currentSector = terrain.getSectorByWorldPosition(this.obj)
    if (GameUtils.isValidSector(currentSector) && !currentSector.isOwnedByPlayer(p)) {
        return currentSector
    }
    // we search in the nearest sectors with increasingly ray of scan
    // the ray will serve as greatness of the square border of sectors to scan
    var cx = currentSector.logicPosX
    var cz = currentSector.logicPosZ
    for (var ray = 1; ray <= 10; ray++) {
        //do horizontal lines of the square
        for (var x = cx - ray; x <= cx + ray; x++) {
            for (var z = cz - ray; z <= cz + ray; z++) {
                // do the search only on the boundaries
                var dz = Math.abs(z - cz)
                var dx = Math.abs(x - cx)
                if (dz == ray || dx == ray) {
                    var csec = terrain.getSector(x, z)
                    if (GameUtils.isSectorToConquer(p, csec)) {
                        return csec
                    }
                }
            }
        }
    }
}

Unit.prototype.findNearestTarget = function() {
    for (ia in gameManager.actors) {
        var a = gameManager.actors[ia]
        if (a.typeIn(['Rock', 'Paper', 'Scissors']) && a.isEnemyOf(this) 
            && a.alive && this.XZDistanceTo(a) < this.range) {
            return a
        }
    }
}

Unit.prototype.isEnemyOf = function(unit) {
    if (!this.alive || !unit.alive) {
        return false
    }
    if (this.owner == null || unit.owner == null)  {
        return false
    }
    return this.owner.name != unit.owner.name
}

/**
* This method is called at the end of main loop by gameManager
*/
Unit.prototype.remove = function() {
    if (this.selected) {
        this.unselect()
    }
    this.owner.unitCount--
    Unit.superClass.remove.call(this)
}

/**
* Confrontation in the x,z plane against two bounding vector2
*/
Unit.prototype.isBetweenCoords= function(vec2Start, vec2End) {
    var px = this.obj.position.x
    var pz = this.obj.position.z
    if (px >= vec2Start.x && px <= vec2End.x &&
        pz >= vec2Start.y && pz <= vec2End.y) {
        return true
    }
    return false
}
    


Paper = function(owner) {
    Unit.call(this)
    this.obj = ACE3.Builder.cube2(1, 0.5, 1, 0xff0000)
    this.obj.material.transparent = true
    this.obj.material.opacity = 0.0
    this.pivot = new THREE.Object3D()
    this.obj.add(this.pivot)
    var g1 = new THREE.CubeGeometry(0.5, 0.2, 1)
    var g2 = new THREE.CubeGeometry(0.5, 0.2, 1)
    this.uniform = ACE3.Utils.getStandardUniform()
    this.uniform.unitLevel = { type: "i", value: this.level }
    this.r1 = ACE3.Utils.getStandardShaderMesh(this.uniform, 'vertexShaderGeneric', 'fragmentShaderRock', g1)
    this.r2 = ACE3.Utils.getStandardShaderMesh(this.uniform, 'vertexShaderGeneric', 'fragmentShaderRock', g2)
    this.pivot.add(this.r1)
    this.pivot.add(this.r2)
    this.r1.position.x = -0.3
    this.r2.position.x = 0.3
    this.r1.rotation.z = 0.3
    this.r2.rotation.z = -0.3
}
Paper.extends(Unit, "Paper")
Paper.prototype.setColor = function(color) {
    this.uniform.color.value = ACE3.Utils.getVec3Color(color)
}
Paper.prototype.run = function() {
    Paper.superClass.run.call(this) //executes the Unit run method on this object
    this.uniform.time.value = ace3.time.frameTime
}



Scissors = function(owner) {
    Unit.call(this)
    this.obj = ACE3.Builder.cube2(1, 0.5, 1,0xffffff) //bounding box
    this.obj.material.transparent = true
    this.obj.material.opacity = 0.0
    //console.log(this.run)
    this.pivotRot = ACE3.Builder.sphere(0.2,0xff0000)
    this.obj.add(this.pivotRot)
    this.legs = new Array()
    this.uniform = ACE3.Utils.getStandardUniform()
    this.uniform.unitLevel = { type: "i", value: this.level }
    for (var i = 0; i <= 3; i++) {
        var yAngle = i * Math.PI/2
        var g = new THREE.CubeGeometry(0.2, 0.4, 0.15)
        var l = ACE3.Utils.getStandardShaderMesh(this.uniform, 'vertexShaderGeneric', 'fragmentShaderRock', g)
        // var l = ACE3.Builder.cube2(0.2, 0.4, 0.15, 0xff0000)
        l.eulerOrder = 'YXZ'
        l.rotation.y = yAngle
        l.rotation.x = Math.PI/8*3
        l.updateMatrix()
        l.translateY(-0.5)
        this.pivotRot.add(l)
        this.legs[i] = l

    }
    //this.obj = ACE3.Builder.cube2(1, 0.5, 1,0xffffff) //bounding box
    //this.obj.material.transparent = true
    //this.obj.material.opacity = 0.0
}
Scissors.extends(Unit, "Scissors")
Scissors.prototype.setColor = function(color) {
    // ch = this.obj.children
    this.pivotRot.material.color = new THREE.Color(color)
    this.uniform.color.value = ACE3.Utils.getVec3Color(color)
    // for (cid in this.legs) {
    //     this.legs[cid].material.color = new THREE.Color(color)    
    // }
}

Scissors.prototype.run = function() {
    Scissors.superClass.run.call(this)
    this.uniform.time.value = ace3.time.frameTime
    var ty = THREE.Math.sign(Math.sin(this.uniform.time.value)) * 0.001
    for (cid in this.legs) {
        this.legs[cid].translateY(ty)
    }
    this.pivotRot.rotation.y += 0.02
}




Rock = function(owner) {
    Unit.call(this)
    //this.obj = ACE3.Builder.sphere(0.5,0xff0000)
    this.uniform = ACE3.Utils.getStandardUniform()
    this.uniform.unitLevel = { type: "i", value: this.level }
    var g = new THREE.SphereGeometry(0.5)
    this.obj = ACE3.Utils.getStandardShaderMesh(this.uniform, 'vertexShaderGeneric', 'fragmentShaderRock', g)
}
Rock.extends(Unit, "Scissors")
Rock.prototype.setColor = function(color) {
    this.uniform.color.value = ACE3.Utils.getVec3Color(color)
}
Rock.prototype.run = function() {
    Rock.superClass.run.call(this)
    this.uniform.time.value = ace3.time.frameTime
}
