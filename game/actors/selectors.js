// File to collect the standard actors for rpsz game

AreaSelector = function() {
    ACE3.Actor3D.call(this)
    this.obj = ACE3.Builder.squareXZ(1, 1, 0x999900)
    this.obj.material.transparent = true
    this.obj.material.opacity = 0.2
    //this.obj.material.wireframe = true
    this.attached = false
}
AreaSelector.extends(ACE3.Actor3D, "AreaSelector")

AreaSelector.prototype.startSelection = function(vec2Start) {
    this.updateArea(vec2Start, vec2Start)
    terrain.addActor(this)
    this.obj.position.y = terrain.obj.position.y + 1
    this.attached = true
}
AreaSelector.prototype.endSelection = function() {
    if (!this.attached) {
        return
    }
    this.updateArea(0,0)
    terrain.removeActor(this)
    this.attached = false
}
/**
* Modify the properties of the area
*/
AreaSelector.prototype.updateArea = function(vec2Start, vec2End) {
    //console.log(vec2Start)
    //console.log(vec2End)
    var sorted = ACE3.Math.getSortedCoords(vec2Start, vec2End)
    var w = sorted.v2End.x - sorted.v2Start.x
    var h = sorted.v2End.y - sorted.v2Start.y
    //console.log (w + " ---- " + h)
    this.obj.scale.x = w + 0.1
    this.obj.scale.y = h + 0.1
    this.obj.position.x = sorted.v2Start.x + w/2
    this.obj.position.z = sorted.v2Start.y + h/2
}




HLBase = function() {
    ACE3.Actor3D.call(this)
    this.size = 3.0
    this.uniform = {
        cycles: { type: "f", value: Math.round(THREE.Math.randFloat(0,500)) },
        thickness: { type: "f", value: this.size / 100 },
        resolution: { type: "v2", value: new THREE.Vector2() },
        color: { type: "v3", value: new THREE.Vector3(1.0, 1.0, 1.0) },


    };
    var m = new THREE.ShaderMaterial( {
        uniforms: this.uniform,
        vertexShader: ACE3.Utils.getShader('vertexShaderGeneric'),
        fragmentShader: ACE3.Utils.getShader('fragmentShader_hilight'),
    });
    m.transparent = true
    m.opacity = 0.0
    var g = new THREE.PlaneGeometry(this.size, this.size)
    //var m = new THREE.MeshBasicMaterial({'color':0xff00ff})
    this.obj = new THREE.Mesh(g, m) 
    this.obj.rotation.x = -Math.PI/2
    this.selectedObj = null   
}
HLBase.extends(ACE3.Actor3D, "HLBase")

HLBase.prototype.init = function() {
    // do nothing. The hilight object is not added to scene
}
HLBase.prototype.remove = function() {
    this.alive = false
}
HLBase.prototype.run = function() {
    this.uniform.cycles.value += 10
}

HLBase.prototype.unselect = function() {
    if (this.selectedObj != null) {
        this.selectedObj.removeActor(this)
    }
    this.selectedObj = null
}

/**
* This places the hl actor as children of the specified actor
*/
HLBase.prototype.select = function(actor) {
    this.unselect()
    actor.addActor(this)
    this.selectedObj = actor
}

HLBase.prototype.setColor = function(color) {
    this.uniform.color.value = ACE3.Utils.getVec3Color(color)
}



HLSelect = function() {
    HLBase.call(this)
    this.setColor(0xffff00)
    //this.obj.material.transparent = true
    //this.obj.material.opacity = 0.4
}
HLSelect.extends(HLBase, "HLSelect")

HLEnemy = function() {
    HLBase.call(this)
    this.setColor(0xff0000)
}
HLEnemy.extends(HLBase, "HLEnemy")

HLPoint = function() {
    HLBase.call(this)
    this.setColor(0xff11ff)
    //this.obj = ACE3.Builder.radialSquares(0.8, 10, 0x55aaff, 0.7)
}
HLPoint.extends(HLBase, "HLPoint")  
HLPoint.prototype.select = function(vec2) {
    HLPoint.superClass.select.call(this, terrain)
    this.obj.position.set(vec2.x, terrain.obj.position.y + 1, vec2.y)
}


HLSector = function() {
    HLBase.call(this)
    this.setColor(0x00ff00)
    //this.obj = ACE3.Builder.sphere(2,0xff0000)
}
HLSector.extends(HLBase, "HLSector")
HLSector.prototype.select = function(actor) {
    //select the centered innerActor if exists
    if (actor.innerActor == undefined) {
        HLSector.superClass.select.call(this, actor)
        return
    }
    
    HLSector.superClass.select.call(this, actor.innerActor)
    if (actor.getType() == 'SpawnSector') {
        this.obj.rotation.x = 0
        this.obj.position.z = 0.1
    }else {
        this.obj.rotation.x = -Math.PI/2
        this.obj.position.set(0, 0, 0)
    }
}