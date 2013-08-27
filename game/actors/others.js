/**
* Notes : the position is really necessary if the owner position is not
* really the starting of the projectiles.
*/
Shot = function(owner, target, position) {
    ACE3.Actor3D.call(this)
    this.owner = owner
    this.ownerType = owner.getType() //I store now the type , because when the bullet collides the owner could be dead
    this.damage = owner.damage
    this.target = target
    this.obj = ACE3.Builder.cube2(.1, .1, .3, 0xffff00)
    this.obj.position = position || owner.obj.position.clone()
    //console.log(this.obj)
    this.lookAtXZFixed(target.obj.position)
    this.collisionDistance = 0.5
    this.speed = 0.5
}
Shot.extends(ACE3.Actor3D, "Shot")

Shot.prototype.run = function() {
    if (this.target == null || this.target.alive == false) {
        this.setForRemoval()
        return
    }
    var d = this.XZDistanceTo(this.target)
    if (d < this.collisionDistance) {
        this.damageTarget()
        this.target = null
        this.setForRemoval()
    }else {
        this.followActor(this.target)
    }
}

Shot.prototype.damageTarget = function() {
    var d = this.damage
    var dinc = d * 0.5
    var t1 = this.ownerType
    var t2 = this.target.getType()
    if (t1 == t2) {
        dinc = 0
    }else if ((t1 == "Rock" && t2 == "Paper") ||
        (t1 == "Paper" && t2 == "Scissors") ||
        (t1 == "Scissors" && t2 == "Rock")) {
        dinc = - dinc
    }
    this.target.getDamage(this.damage + dinc)
    // this.target.life -= (this.damage + dinc)       
}

Shot.prototype.followActor = function(actor) {
    this.lookAtXZFixed(actor.obj.position)
    this.obj.translateZ(this.speed)
}

/**
* The satellite shot is directly owned by player.
*/
SatelliteShot = function(owner, target) {
    ACE3.ParticleActor.call(this, {
            texture: 'media/particle2.png',
            size: 5,
            spread: 0,
            particleCount: 5,
        });
    this.owner = owner
    this.ownerName = owner.name 
    this.target = target

    var tp = terrain.obj.position
    this.origin = new THREE.Vector3(tp.x, tp.y + 50, tp.z)
    this.obj.lookAt(target.obj.position)
    this.collisionDistance = 0.5
    this.speed = 0.2
    this.needReset = true
}
SatelliteShot.extends(ACE3.ParticleActor, "SatelliteShot")

SatelliteShot.prototype.run = function() {
    if (this.needReset) {
        this.reset()
    }
    if (this.target == null || this.target.alive == false) {
        this.setForRemoval()
        return
    }
    if (this.target.owner != null && this.target.owner.name == this.owner.name) {
        this.setForRemoval()
        return
    }

    var d = this.obj.position.distanceTo(this.target.obj.position)
    if (d < this.collisionDistance) {
        this.damageTarget()
        this.target = null
        this.setForRemoval()
    }else {
        this.followActor(this.target)
    }
}

SatelliteShot.prototype.damageTarget = function() {
    if (this.target.getType() == 'TowerSector') {
        this.manager.registerActor(new ACE3.Explosion(this.obj.position.clone()))
        shakeCameraLogic.activate()
        this.target.setOwner(null)
    }  
}
SatelliteShot.prototype.followActor = function(actor) {
    this.obj.lookAt(actor.obj.position)
    this.obj.translateZ(this.speed)
}

SatelliteShot.prototype.reset = function(vec3Pos) {
    //this.duration = 0.3
    this.hide()
    var vec3Pos = vec3Pos || this.origin
    this.obj.position.copy(vec3Pos)
    for (var pi = 0; pi < this.particleCount; pi++) {
        var p = this.obj.geometry.vertices[pi]
        p.copy(new THREE.Vector3(0, 0 , pi * 6))
    }
    this.origin.copy(vec3Pos)
    this.refresh()
    this.show()
    this.needReset = false
}


