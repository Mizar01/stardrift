Unit2 = function(x, z) {
    ACE3.Actor3D.call(this)
    //console.log(this.superClass)
    this.obj = ACE3.Builder.cube(1, 65280)
    this.obj.position.set(x, 2, z)
    this.randStart = THREE.Math.randFloat(0, 6.28)
}

Unit2.extends(ACE3.Actor3D, "Unit2")

Unit2.prototype.run = function() {
        this.obj.position.y = 2 + Math.sin(clock.getElapsedTime()*2 + this.randStart)
}
Unit2.prototype.setColor = function(rgb) {
    Unit2.superClass.setColor.call(this,"" + rgb)
    this.obj.material.color = new THREE.Color(rgb)
}