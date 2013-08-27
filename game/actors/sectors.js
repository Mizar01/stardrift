Terrain = function(mapProps, sizex, sizez) {
    ACE3.Actor3D.call(this)
    this.sectors = ACE3.Math.matrix(mapProps.mx, mapProps.mz)
    this.flagSectors = [] // this is the array for flag sectors. They are separate because they are not part of animation
    this.obj = new THREE.Object3D() //pivot
    //this.obj.rotation.x = -Math.PI/2
    //this.obj.position.y = -2
    this.logicSizeX = mapProps.mx
    this.logicSizeZ = mapProps.mz
    this.totalSizeX = sizex * this.logicSizeX
    this.totalSizeZ = sizez * this.logicSizeZ  //i call it Z because the terrain is rotated along xz plane
    this.sizeX = sizex // size of a single sector
    this.sizeZ = sizez
    this.startX = - (this.totalSizeX / 2) + sizex/2; 
    this.startZ = - (this.totalSizeZ / 2) + sizez/2;
    initMapObjects(this, mapProps)

    //storing the single intersection object. This is a completely transparent plane
    //needed for every intersection with terrain.
    this.addActor(new PickPlane(this))

    this.hlPoint = new HLPoint() // the highlighted point in the map currently targeted
}

Terrain.extends(ACE3.Actor3D, "Terrain")

Terrain.prototype.getSectorByWorldPosition = function(object) {
        // y position is not important
        var px = object.position.x
        var pz = object.position.z
        //based on the inversion of the function
        // px = startx + x * sizex  ---> x = (px - startx)/ sizeX
        var x = Math.round((px - this.startX) / this.sizeX) 
        var z = Math.round((pz - this.startZ) / this.sizeZ) 
        return this.getSector(x, z)
    }

Terrain.prototype.getSectorByXZCoords = function(x, z) {
        var x = Math.round((x - this.startX) / this.sizeX) 
        var z = Math.round((z - this.startZ) / this.sizeZ) 
        return this.getSector(x, z)       
    }

    /**
    * Get the sector (if exists), given the logic coords
    */
Terrain.prototype.getSector = function(x, z) {
        //console.log(x + ", " + z)
        if (x >= 0 && x < this.sectors.length && 
            z >= 0 && z < this.sectors[0].length) {
            return this.sectors[x][z]
        }
        return null
    }

Terrain.prototype.selectAsTarget = function(vec2Pos) {
        this.hlPoint.select(vec2Pos)
    }
Terrain.prototype.unselect = function() {
    this.hlPoint.unselect()
}

PickPlane = function(terrainActor) {
    ACE3.Actor3D.call(this)
    // this plane is in the same position (a little lower) of the terrain but it's a little greater
    this.sx = terrainActor.totalSizeX + 5 
    this.sz = terrainActor.totalSizeZ + 5
    this.obj = ACE3.Builder.squareXZ(this.sx, this.sz, 0x000000)
    this.obj.material.transparent = false
    this.obj.material.opacity = 1
    this.setPickable()
    this.obj.position.y = terrainActor.obj.position.y - 0.4
}
PickPlane.extends(ACE3.Actor3D, "PickPlane")



/**
* Note : posx e posz
*/
Sector = function(logicPosx, logicPosz, sizex, sizez) {
    ACE3.Actor3D.call(this)
    this.logicPosX = logicPosx  //logic position x
    this.logicPosZ = logicPosz  //logic position y
    this.sizex = sizex
    this.sizez = sizez
    this.innerActor = null 
    this.owner = null //owner player
    this.targetedBy = null // actor that is targeting this sector
    //building square
    //this.obj = ACE3.Builder.squareXZWireFrame(sizex - 0.1, sizez - 0.1, 0xaaaaaa)
    //this.obj.material.transparent = true
    //this.obj.material.opacity = 0.7
    //this.objChild1 = ACE3.Builder.squareXZWireFrame(sizex - 0.2, sizez - 0.2, 0xaaaaaa)
    //this.objChild1.rotation.x = 0
    //this.obj.add(this.objChild1)

    this.uniform = {
        cycles: { type: "f", value: Math.round(THREE.Math.randFloat(0,500)) },
        resolution: { type: "v2", value: new THREE.Vector2() },
        color: { type: "v3", value: new THREE.Vector3(1.0, 1.0, 1.0) },

    };
    var m = new THREE.ShaderMaterial( {
        uniforms: this.uniform,
        vertexShader: ACE3.Utils.getShader('vertexShaderGeneric'),
        fragmentShader: ACE3.Utils.getShader('fragmentShader_DefaultSector'),
    });
    //m.transparent = true
    //m.opacity = 0.1
    var g = new THREE.PlaneGeometry(sizex, sizez)
    //var m = new THREE.MeshBasicMaterial({'color':0xff00ff})
    this.obj = new THREE.Mesh(g, m) 
    this.obj.rotation.x = -Math.PI/2

    this.hlSector = new HLSector() // the hilight actor of the current targeted sector


    //this.angleAnimation = THREE.Math.random16() * Math.PI
}

Sector.extends(ACE3.Actor3D, "Sector")

/**
* Return true if the owner name is equal to the given player name
* In any other case (owner null etc.) it will return false
*/
Sector.prototype.isOwnedByPlayer = function(player) {
    if (this.owner == null)
        return false
    if (this.owner.name == player.name)
        return true
}

/**
* The setOwner can be used also to set to Null the owner.
*/
Sector.prototype.setOwner = function(player) {
    if (this.owner != null) {
        this.owner.sectorCount--
        this.owner = null
    }
    if (player) {
        this.owner = player
        this.owner.sectorCount++
        this.setColor(player.color)
    }else {
        //setting to neutral
        this.setColor(0xaaaaaa)
    }
    if (this.innerActor != undefined && this.innerActor.setOwner != undefined) {
        this.innerActor.setOwner(player)
    }
}

Sector.prototype.setColor = function(color) {
    this.uniform.color.value = ACE3.Utils.getVec3Color(color)
    //this.obj.material.color = c
    //this.objChild1.material.color = c
    if (this.innerActor != undefined) {
        this.innerActor.setColor(color)
    }
}


Sector.prototype.setPosition = function(x, y, z) {
    this.obj.position.set(x, y, z)
}

Sector.prototype.run = function() {
    //console.log(this.uniform.cycles.value)
    this.uniform.cycles.value += 1.0
}

Sector.prototype.selectAsTarget = function() {
    this.hlSector.select(this)
}

Sector.prototype.unselect = function() {
    this.hlSector.unselect()
}




TowerSector = function(terrain, posx, posy, sizex, sizey) {
    Sector.call(this,posx, posy, sizex, sizey)
    this.tower = new Tower(this)
    this.innerActor = this.tower
    // The innerActor of TowerSector is not a direct children of the sector, because
    // we are going to use it with some rotations and we don't want them messed up
    // The tower will be an actor children of terrain
    terrain.addActor(this.tower)
}
TowerSector.extends(Sector, "TowerSector")
TowerSector.prototype.setPosition = function(x, y, z) {
    this.obj.position.set(x, y, z)
    this.tower.adjustPosition(this)
}

FlagSector = function(posx, posy, sizex, sizey) {
    Sector.call(this,posx, posy, sizex, sizey)
    //overwrite properties of the default sector
    this.uniform = ACE3.Utils.getStandardUniform()
    var g = new THREE.PlaneGeometry(sizex, sizey)
    this.obj = ACE3.Utils.getStandardShaderMesh(this.uniform, "vertexShaderGeneric", "fragmentShader_NewFlagSector", g)
    this.obj.rotation.x = -Math.PI/2
    //this.flag = new Flag()
    //this.innerActor = this.flag
    //this.addActor(this.flag)
}
FlagSector.extends(Sector, "FlagSector")

SpawnSector = function(terrain, posx, posy, sizex, sizey) {
    Sector.call(this,posx, posy, sizex, sizey)
    this.spawner = new Spawner(sizex, sizey)
    this.innerActor = this.spawner
    this.addActor(this.spawner)
    this.spawner.sector = this

    // Ascension particle effect
    this.ascEffect = new ACE3.Ascension()
    // Again (as with the tower) , we add the ascension effect to the tarrain
    // to avoid messing with rotation relatives to parent.
    terrain.addActor(this.ascEffect)
}
SpawnSector.extends(Sector, "SpawnSector")

SpawnSector.prototype.setPosition = function(x, y, z) {
    this.obj.position.set(x, y, z)
    this.ascEffect.obj.position.set(x, y, z)
    this.ascEffect.obj.position.y += 1
}


// 
MagneticSector = function(posx, posy, sizex, sizey) {
    Sector.call(this,posx, posy, sizex, sizey)
    //Override default sector object
    this.obj = new THREE.Object3D()
    this.obj.rotation.x = - Math.PI/2
    this.magnet = new Magnet(sizex, sizey)
    this.innerActor = this.magnet
    this.addActor(this.magnet)
}
MagneticSector.extends(Sector, "MagneticSector")

Flag = function(posx, posy) {
    ACE3.Actor3D.call(this)
    this.height = 0.3
    this.obj = ACE3.Builder.cube2(0.1, this.height, 0.1, 0xffffff)
    this.obj.rotation.x = Math.PI/2
    this.obj.updateMatrix()
    this.obj.translateY(this.height/2)
}
Flag.extends(ACE3.Actor3D, "Flag")
Flag.prototype.setColor = function(color) {
    this.obj.material.color = new THREE.Color(color)
}


Spawner = function(sizex, sizey) {
    ACE3.Actor3D.call(this)
    this.currentCooldown = 500 //TODO : for now in cycles, but should be time
    this.sector = null
    this.uniform = {
        time: { type: "f", value: 1.0 },
        dist: { type: "f", value: 8 },
        tickness: { type: "f", value: 1.2 },
        resolution: { type: "v2", value: new THREE.Vector2() },
        color: { type: "v3", value: new THREE.Vector3(1.0, 1.0, 1.0) },

    };
    var m = new THREE.ShaderMaterial( {
        uniforms: this.uniform,
        vertexShader: ACE3.Utils.getShader('generic'),
        fragmentShader: ACE3.Utils.getShader('fragmentShaderSpawner'),
    });
    m.transparent = true
    m.opacity = 0.1
    var g = new THREE.PlaneGeometry(sizex, sizey)
    //var m = new THREE.MeshBasicMaterial({'color':0xff00ff})
    this.obj = new THREE.Mesh(g, m)
}
Spawner.extends(ACE3.Actor3D, "Spawner")

Spawner.prototype.run = function() {
    var s = this.sector
    if (s.owner != null && s.owner.unitCount < s.owner.maxUnits) {
        this.refreshCooldown()
        if (this.currentCooldown == 0) {
            this.spawnUnit()
            this.currentCooldown = s.owner.getSpawnCooldown()
        }
    }
    this.uniform.time.value = ace3.time.frameTime
} 
Spawner.prototype.setColor = function(color) {
    var c = new THREE.Color( color );
    this.uniform.color.value = new THREE.Vector3(c.r, c.g, c.b);
} 
Spawner.prototype.refreshCooldown = function() {
    this.currentCooldown = THREE.Math.clampBottom(this.currentCooldown - 1, 0)
}  
Spawner.prototype.spawnUnit = function() {
    var s = this.sector
    var p = this.sector.obj.position.clone()
    p.y = terrain.obj.position.y + 1
    var type = THREE.Math.randInt(0, 2)
    var rx = p.x + THREE.Math.randInt(0, 2)
    var rz = p.z + THREE.Math.randInt(0, 2)
    var obj = null
    if (type == 0) obj = new Paper()
    else if (type == 1) obj = new Rock()
    else obj = new Scissors()
    s.owner.addUnit(obj, rx, p.y, rz)
    //make every unit pickable
    obj.setPickable()
}


Magnet = function(sizex, sizey) {
    ACE3.Actor3D.call(this)
    this.lastTime = ace3.time.frameTime

    this.uniform = {
        time: { type: "f", value: 1.0 },
        resolution: { type: "v2", value: new THREE.Vector2() },
        randPos: {type: "v2", value: new THREE.Vector2(THREE.Math.randFloatSpread(2), THREE.Math.randFloatSpread(2)) },
        randPos2: {type: "v2", value: new THREE.Vector2(THREE.Math.randFloatSpread(2), THREE.Math.randFloatSpread(2)) },
        animTime: {type: "f", value: THREE.Math.randFloat(0, 25) },
        animTimeMax: {type: "f", value: 40.0 },
        rgbMult: {type: "v3", value: ACE3.Math.randVector3(2.0)}
    };

    var m = new THREE.ShaderMaterial( {
        uniforms: this.uniform,
        vertexShader: ACE3.Utils.getShader('vertexShaderGeneric'),
        fragmentShader: ACE3.Utils.getShader('fragmentShaderElectric'),  //fragmentShader2
    });
    m.transparent = true
    m.opacity = 0.4
    var g = new THREE.PlaneGeometry(sizex, sizey)
    //var m = new THREE.MeshBasicMaterial({'color':0xff00ff})
    this.obj = new THREE.Mesh(g, m)
}
Magnet.extends(ACE3.Actor3D, "Magnet")
Magnet.prototype.run = function() {
    //this.uniform.animTime.value += 1.0;
    this.uniform.time.value = ace3.time.frameTime - this.uniform.animTime.value
    // var t = this.uniform.animTime.value
    // var tmax = this.uniform.animTimeMax.value
    // if (t == Math.floor(tmax/2)) {
    //     this.uniform.randPos2.value = ACE3.Math.randVector2(2)
    // } 
    // if (t > tmax) {
    //     this.uniform.randPos.value = ACE3.Math.randVector2(2)
    //     this.uniform.animTime.value = 0.0;
    // }
}

Tower = function(sector) {
    ACE3.Actor3D.call(this)
    this.range = 6
    this.damage = 6
    this.cooldown = 90
    this.currentCooldown = 0
    this.height = 1.8
    this.uniform = ACE3.Utils.getStandardUniform()
    //this.uniform.color = { type: "v3", value: new THREE.Vector3(1.0, 0.0, 1.0) }
    this.uniform.texture1 = {type: 't', value: THREE.ImageUtils.loadTexture( "media/tower.jpg" )}
    var g = new THREE.CylinderGeometry(0.4, 0.5, this.height)    
    this.obj = ACE3.Utils.getStandardShaderMesh(this.uniform, "vertexShaderGeneric", "fragmentShaderTower", g)
    //this.obj.rotation.x = -Math.PI/2
    //this.obj = ACE3.Builder.cylinder(0.4, this.height, 0xaaaaaa)

    //Alternate mesh
    // this.uniform = {
    //     time: { type: "f", value: 1.0 },
    //     dist: { type: "f", value: 8 },
    //     tickness: { type: "f", value: 1.2 },
    //     resolution: { type: "v2", value: new THREE.Vector2() },
    //     color: { type: "v3", value: new THREE.Vector3(1.0, 1.0, 1.0) },

    // };
    // var m = new THREE.ShaderMaterial( {
    //     uniforms: this.uniform,
    //     vertexShader: ACE3.Utils.getShader('vertexShaderGeneric'),
    //     fragmentShader: ACE3.Utils.getShader('fragmentShaderSpawner'),
    // });
    // m.transparent = true
    // m.opacity = 0.5
    // var g = new THREE.CylinderGeometry(0.4, 0.4, this.height)
    // //var m = new THREE.MeshBasicMaterial({'color':0xff00ff})
    // this.obj = new THREE.Mesh(g, m)  

    this.cannon = ACE3.Builder.cube2(0.1, 0.1, 0.8, 0x333333)
    this.obj.add(this.cannon)
    this.cannon.position.y = this.height / 2 * 0.8
    this.cannon.position.z = 0.2
    this.sector = sector
    //console.log(this.sector.obj.position)
    this.targetEnemy = null
    this.owner = null
}
Tower.extends(ACE3.Actor3D, "Tower")

Tower.prototype.adjustPosition = function(sector) {
        this.obj.position = this.sector.obj.position.clone()
        this.obj.updateMatrix()
        this.obj.translateY(this.height/2)
    }

Tower.prototype.setColor = function(color) {
        //this.obj.material.color = new THREE.Color(color)
        this.uniform.color.value = ACE3.Utils.getVec3Color(color)
    }
Tower.prototype.run = function() {
    this.refreshCooldown()
    var te = this.targetEnemy
    if (te != null && this.XZDistanceTo(te) < this.range && te.alive) {
        this.shoot()
        return
    }

    this.targetEnemy = null

    if (this.owner != null) {
        this.targetEnemy = this.findNearestTarget()
    }

    // normal behaviour
    this.obj.rotation.y += 0.003

}
Tower.prototype.findNearestTarget = function() {
    for (ia in gameManager.actors) {
        var a = gameManager.actors[ia]
        if (a.typeIn(['Rock', 'Paper', 'Scissors']) && a.isEnemyOf(this) 
            && a.alive && this.XZDistanceTo(a) < this.range) {
            return a
        }
    }
}

Tower.prototype.setOwner = function(player) {
    this.owner = player
    this.targetEnemy = null        
}

Tower.prototype.shoot = function() {
    this.lookAtXZFixed(this.targetEnemy.obj.position) 
    if (this.currentCooldown <= 0) {
        var s = new Shot(this, this.targetEnemy, this.cannon.matrixWorld.getPosition().clone())
        gameManager.registerActor(s)
        this.currentCooldown = this.cooldown
    }
      
}
Tower.prototype.refreshCooldown = function() {
    this.currentCooldown = THREE.Math.clampBottom(this.currentCooldown - 1, 0)
}
