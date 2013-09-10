// Main file for main operations, settings and all

var ace3 = null
var players = [] //associative array for players
var humanPlayer = null
var test_logic = null
var gameManager = null // shortcut to ace3.defaultActorManager
var hudManager = null
var menuManager = null // shortcut to another ActorManager for menus
var chooseMapMenuManager = null 
var aboutManager = null
var tutorialManager = null
//var hlSelect = null //actor used to show selected items
//var hlEnemy = null //actor used to show current selected enemy
//var hlSector = null // actor used to show current selected sector
//var selectedUnit = null // currently selected unit in the game
//var unitSelector = null

var mainThemeSound = null

var testShader = null

//useful actor shortcuts
var terrain = null

var game_started = false

var shakeCameraLogic = null

var selectManager = null

var optimizer = null // optimizer is a memory used throughout the entire game to store useful calculations like
                     // special sectors and other stuff in order to avoid long loops through all the objects.

// var displayInfo = null //actor that shows dynamic info on screen during game.


function game_init() {
    ace3 = new ACE3(false)
    ace3.setBGColor(0x000000)
    ace3.addPostProcessing("dots")
    //ace3.setFog(0.02)
    mainThemeSound = $("#main_theme").get(0)
    mainThemeSound.play()
    // optimizer = new Optimizer()
    gameManager = ace3.defaultActorManager
    //Adjust the pitch of the camera
    camera_reset_position()
    menu_define()
    game_pause()
    //game_play()

}

function camera_reset_position() {
    ace3.camera.cameraObj.rotation.y = 0
    ace3.camera.cameraObj.rotation.z = 0
    ace3.camera.cameraObj.rotation.x = - Math.PI/3
    ace3.camera.pivot.position.set(0, 28, 16)
    ace3.camera.speed = 0.7
}

function game_init_map(map, demoMode) {
    var demoMode = demoMode || false
    var mapProps = loadMap(map)
    //initMapObjects(mapProps)
    // Build the terrain
    terrain = new Terrain(mapProps,5,5)
    //unitSelector = new UnitSelector()
    gameManager.registerActor(terrain)
  
    //Player init
    players = []
    if (!demoMode) {
        var p1 = new Player("mizar", ACE3.Constants.CONTROLLER_HUMAN)
        humanPlayer = p1
    }else {
        var p1 = new Player("mizar", ACE3.Constants.CONTROLLER_CPU)
        humanPlayer = null
    }

    p1.color = 0x0000ff
    p2 = new Player ("cpu", ACE3.Constants.CONTROLLER_CPU)
    p2.color = 0xff0000
    players.push(p1)
    players.push(p2)
    
    //build random units for p and p2
    var totalUnits = 4
    if (demoMode) {
        totalUnits = 50
    }

    var posy = terrain.obj.position.y + 1
    var tsx = terrain.totalSizeX
    var tsz = terrain.totalSizeZ
    var tcx = terrain.obj.position.x
    var tcz = terrain.obj.position.z
    if (demoMode) {
        for (var i = 0;i < totalUnits; i++) {
            var cp = p1
            if (i % 2 != 0) {
                cp = p2
            }
            var type = THREE.Math.randInt(0, 2)
            var rx = THREE.Math.randInt(0, tsx) - (tsx / 2) - tcx
            var rz = THREE.Math.randInt(0, tsz) - (tsz / 2) - tcz
            rx = THREE.Math.clamp(rx, -tsx/2 + 0.5, tsx/2 - 0.5)
            rz = THREE.Math.clamp(rz, -tsz/2 + 0.5, tsz/2 - 0.5)
            obj = null
            if (type == 0) obj = new Paper()
            else if (type == 1) obj = new Rock()
            else obj = new Scissors()
            cp.addUnit(obj, rx, posy, rz)
        }
    }else {
        // console.log(mapProps)
        for (var i = 0;i < mapProps.spawns.length; i++) {
            var values = mapProps.spawns[i].split(",")
            // console.log(values)
            var cp = p1
            if (values[0] == "p2") {
                cp = p2
            }
            var type = values[1]
            var rx = parseInt(values[2])
            var rz = parseInt(values[3])
            var sector = terrain.getSector(rx, rz)
            rx = sector.obj.position.x
            rz = sector.obj.position.z
            //rx = THREE.Math.clamp(rx, -tsx/2 + 0.5, tsx/2 - 0.5)
            //rz = THREE.Math.clamp(rz, -tsz/2 + 0.5, tsz/2 - 0.5)
            obj = null
            if (type == "paper") obj = new Paper()
            else if (type == "rock") obj = new Rock()
            else obj = new Scissors()
            cp.addUnit(obj, rx, posy, rz)
            //make every unit pickable
            if (!demoMode) {
                obj.setPickable()
            }
        }     
    }

    if (mapProps.cameraPos) {
        ace3.camera.pivot.position.copy(mapProps.cameraPos)
    }
    


    if (!demoMode) {
        gameManager.registerLogic(new CameraLogic())
        selectManager = new MultiSelectTarget_NoSectors()
        gameManager.registerLogic(selectManager)
        //gameManager.registerLogic(new ControlPlayerVictoryLogic())
    }else {
        selectManager = null
        gameManager.registerLogic(new CameraDemoLogic())
    }

    shakeCameraLogic = new ShakeCameraLogic()
    gameManager.registerLogic(shakeCameraLogic)
    gameManager.registerLogic(new ESCPauseGameLogic())
    gameManager.registerLogic(new HUDAndResourcesLogic())

    //Adding eventual ai players logics 
    for (var ip in players) {
        if (players[ip].controller == ACE3.Constants.CONTROLLER_CPU) {
            gameManager.registerLogic(new AIPlayerLogic(players[ip]))
        }
    }


    //TEST SKYBOX
    //var skyBox = new ACE3.SkyBox("media/sb1-")
    //gameManager.registerActor(skyBox)

    var stars = new ACE3.StellarSky()
    gameManager.registerActor(stars)

    //Adding some display values
    var t1units = new ACE3.DisplayValue("Team " + players[0].name, 0, ace3.getFromRatio(70, 95))
    t1units.baseCss.color = "black"
    t1units.valueFunction = function() { return players[0].unitCount; }
    gameManager.registerActor(t1units)
    var t2units = new ACE3.DisplayValue("Team " + players[1].name, 0, ace3.getFromRatio(85, 95))
    t2units.baseCss.color = "black"
    t2units.valueFunction = function() { return players[1].unitCount; }    
    gameManager.registerActor(t2units)

    //esc button
    var escButton = new DefaultGameButton("PAUSE", ace3.getFromRatio(2, 2),
                            new THREE.Vector2(60, 25), null)
    escButton.onClickFunction = function() {game_pause()}
    gameManager.registerActor(escButton)

    if (humanPlayer) {
        define_player_HUD()
        ace3.actorManagerSet.push(hudManager)
    }

    // test light 
    // var directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    // directionalLight.position = ace3.camera.pivot.position;
    // directionalLight.rotation.copy(ace3.camera.cameraObj.rotation)
    // ace3.scene.add(directionalLight);

    // ace3.scene.add( new THREE.AmbientLight( 0xffffff ) );



    // var t1

    // var tbpos = ace3.getFromRatio(50, 50);
    // var testInGameButton = new ACE3.HTMLButton("TEST BTN", tbpos.x, tbpos.y, 
    //     40, 40, function() {console.log('Hellooooo!!!!');}, 10, "orange", "green");
    // gameManager.registerActor(testInGameButton)
    






}


/**
* Complete reset of the playing game.
*/
function game_destroy_map() {
    
    if (terrain == null)  //I assume that if the terrain was not initialized, there's nothing to reset.
        return

    //cleanFlagSectors
    //TODO : the flag sectors will have to be simply managed by another manager.
    var fsa = terrain.flagSectors
    for (var i = 0; i < fsa.length; i++) {
        var fs = fsa[i]
        if (fs != null) {
            ace3.scene.remove(fs.obj)
        }
    }  

    gameManager.reset()
    if (hudManager) {
        hudManager.reset()
    }
    camera_reset_position()
    delete hlSelect
    delete hlEnemy
    delete hlSector

}


function game_run() {
    ace3.run()
}

function game_choose() {
    menuManager.pause()
    chooseMapMenuManager.play()
}

function game_about() {
    menuManager.pause()
    aboutManager.play()
}

function game_tutorial() {
    menuManager.pause()
    tutorialManager.play()
}

function game_play(map, demoMode) {
    var demoMode = demoMode || false;
    if (map != undefined) {
        game_destroy_map()
        game_init_map(map, demoMode)
    }
    menuManager.pause()
    chooseMapMenuManager.pause()
    aboutManager.pause()
    tutorialManager.pause()   
    gameManager.play()
    if (hudManager) {
        hudManager.play()
    }
    game_started = true
}

function game_demo() {
    game_play("Flatlandia", true)
}


function game_pause() {
    if (hudManager) {
        hudManager.pause()
    }
    gameManager.pause()
    chooseMapMenuManager.pause()
    aboutManager.pause()
    tutorialManager.pause()
    menuManager.play()
}

function menu_define() {

    var cel = $("#" + ace3.container.id)
    var x = cel.offset().left
    var y = cel.offset().top
    var w = cel.width()
    var h = cel.height()
    var center = { x: (w + x) / 2, y: (h + y) / 2}

    // TODO : those two following variables are not effective. Apply them
    // to the object after init() or use button.baseCss.prop = value  to set them.
    standardBoxStyle = "padding: 5px; border: 5px solid white;"
    standardButtonStyle = {
                            padding: "2px",
                            border: "3px solid red",
                          }
    bgColor = "black"
    fgColor = "white"
    // Main menu definition
    menuManager = new ACE3.PureHTMLActorManager()
    //console.log(menuManager)
    var zIndex = 10
    var bw = 170
    var bh = 300
    var butW = 130
    var butX = center.x - butW / 2
    var mOffset = { x: center.x - bw / 2, y: center.y - bh / 2}
    var box = new ACE3.HTMLBox("Star Drift <br/> drones gone mad", "", mOffset.x, mOffset.y, bw, bh, zIndex, fgColor, bgColor)
    box.addStyle(standardBoxStyle);
    var initY = box.y + 45
    var playButton = new ACE3.HTMLButton("NEW GAME", butX, initY + 40, butW, 20, function(){game_choose()}, zIndex + 1, fgColor, bgColor)
    playButton.css(standardButtonStyle)
    var demoButton = new ACE3.HTMLButton("DEMO", butX, initY + 80, butW, 20, function(){game_demo()}, zIndex + 1, fgColor, bgColor)
    demoButton.css(standardButtonStyle)
    var tutorialButton = new ACE3.HTMLButton("Tutorial", butX, initY + 120, butW, 20, function(){game_tutorial()}, zIndex + 1, fgColor, bgColor)
    tutorialButton.css(standardButtonStyle)
    var optionButton = new ACE3.HTMLButton("OPTIONS(TODO)", butX, initY + 160, butW, 20, "", zIndex + 1, fgColor, bgColor)
    optionButton.css(standardButtonStyle)
    var  aboutButton= new ACE3.HTMLButton("About", butX, initY + 200, butW, 20, function(){game_about()}, zIndex + 1, fgColor, bgColor)
    aboutButton.css(standardButtonStyle)    
    var resumeButton = new ACE3.HTMLButton("RESUME", butX, initY + 240, butW, 20, function(){game_play()}, zIndex + 1, "black", "yellow")
    resumeButton.css(standardButtonStyle)
    menuManager.registerActor(box)
    menuManager.registerActor(playButton)
    menuManager.registerActor(demoButton)
    menuManager.registerActor(optionButton)
    menuManager.registerActor(tutorialButton)
    menuManager.registerActor(aboutButton) 
    menuManager.registerActor(resumeButton)

    var mainLogic = new ACE3.Logic()
    mainLogic.resumeButton = resumeButton
    mainLogic.run = function() {
        if (game_started) {
            this.resumeButton.show()
        }else {
            this.resumeButton.hide()
        }
    }
    menuManager.registerLogic(mainLogic)
    ace3.actorManagerSet.push(menuManager)

    // Choose Map Menu
    chooseMapMenuManager = new ACE3.PureHTMLActorManager()
    box = new ACE3.HTMLBox("Choose Map", "", mOffset.x, mOffset.y, bw, bh, zIndex, fgColor, bgColor)
    box.addStyle(standardBoxStyle);
    chooseMapMenuManager.registerActor(box)
    var mappedMaps = ["tick-tack-toe", "Flatlandia", "longway", "deepRoad","River"]
    var varY = 0
    for (var i in mappedMaps) {
        varY = box.y + 40 + i * 40
        var m = mappedMaps[i]
        var mButton = new ACE3.HTMLButton(m, butX, varY, butW, 20, null, zIndex + 1, fgColor, bgColor)
        mButton.addStyle(standardButtonStyle)
        mButton.mapLink = m
        var link = function(){game_play(this.mapLink)}
        mButton.onClickFunction = link
        // console.log(mButton)
        chooseMapMenuManager.registerActor(mButton)
    }
    var  returnButton= new ACE3.HTMLButton("Cancel", butX, varY + 40, butW, 20, function(){game_pause()}, zIndex + 1, fgColor, "red")
    returnButton.addStyle(standardButtonStyle)    
    chooseMapMenuManager.registerActor(returnButton)    
    ace3.actorManagerSet.push(chooseMapMenuManager)  



    // About Menu
    var mgr = new ACE3.PureHTMLActorManager()
    aboutManager = mgr
    ace3.actorManagerSet.push(mgr)    
    var htmlText = "StarDrift<br/>Drones gone Mad<br/>by Mizar (2013)<br/>" +
                   "<a href='http://www.linkedin.com/pub/michele-zanarotti/37/a50/658'>Linkedin Profile</a>"+
                   "<!--<a href=''>Facebook Profile</a>-->"+
                   "<br/><br/>powered by<br/><a href='https://github.com/Mizar01/ACE3'>ACE3 engine</a>"

    box = new ACE3.HTMLBox("About", htmlText, mOffset.x, mOffset.y, bw, bh, zIndex, fgColor, bgColor)
    box.addStyle(standardBoxStyle);
    mgr.registerActor(box)
    returnButton= new ACE3.HTMLButton("Cancel", butX, box.y + 230, butW, 20, function(){game_pause()}, zIndex + 1, fgColor, "red")
    returnButton.addStyle(standardButtonStyle)    
    mgr.registerActor(returnButton)

    // Tutorial Menu
    mgr = new ACE3.PureHTMLActorManager()
    tutorialManager = mgr
    ace3.actorManagerSet.push(mgr)
    var htmlStyle = "style='font-size:0.8em;font-family:Arial;'"
    var br = "<br/>"
    var htmlText =  "<div " + htmlStyle + ">" +
                    "Welcome to StarDrift, as for now no real tutorial and story here... " + 
                    " The game is a fast paced RTS where you have blue drones against red drones." + 
                    "Here you have to conquer factories (rippling circles) and towers to vanquish your enemy" + 
                    " paying attention to resources to spend in upgrades for your drones." + br +
                    "Drones are of three types based on shape of Rock, Paper and Scissors. When in combat, at " +
                    " the same upgrade level, life and firepower they will lose or win based on the classic game rule" +
                    br + br + " INTERFACE " + br +
                    "Arrow keys / SHIFT / CTRL : move/zoom on the map" + br +
                    "Click or Drag area on blue units: select your units" + br + 
                    "Click on terrain : move selected units" + br +
                    "Click on enemy : attack with selected units" + br + 
                    "Click on towers or factories : conquer the sector with selected units" + br + br + 
                    "You can upgrade units by selecting and press [UP] button. " + br +
                    "At some time you can neutralize enemy random tower with a satellite shot [SS]" + br +
                    "Increase the maximum number of drones you can have with [+1] button" + br +
                    br + "HINTS" + br +
                    "Lava like tiles will slow you down. " + br +
                    "Factories will produce random units of the owning team, as fast as you have less units. " +
                    "</div>"

    box = new ACE3.HTMLBox("Tutorial", htmlText, mOffset.x - bw * 2, mOffset.y, bw * 4, bh + 70, zIndex, fgColor, bgColor)
    box.addStyle(standardBoxStyle);
    mgr.registerActor(box)
    returnButton= new ACE3.HTMLButton("Cancel", butX + bw, box.y + bh + 50, butW, 20, function(){game_pause()}, zIndex + 1, fgColor, "red")
    returnButton.addStyle(standardButtonStyle)    
    mgr.registerActor(returnButton) 

}



GameUtils = {
    /**
    * For many purposes i must control this very often in my code.
    */
    isValidActor: function(actor) {
        return actor != null && actor.alive
    },
    isUnit: function(actor) {
        return actor.typeIn(['Rock', 'Scissors', 'Paper'])    
    },
    isHuman: function(unit) {
        return (unit.owner != null && unit.owner.controller == ACE3.Constants.CONTROLLER_HUMAN)
    },
    isCPU: function(unit) {
        return (unit.owner != null && unit.owner.controller == ACE3.Constants.CONTROLLER_CPU)        
    },
    /**
    * A valid and selectable sector.
    */
    isValidSector: function(sector) {
        return sector.typeIn([/*'FlagSector',*/ 'TowerSector', 'SpawnSector'])
    },
    isAnySector: function(sector) {
        if (sector == null || sector.getSuperClass == undefined) {
            return false;
        }
        return sector.getSuperClass().getType() == 'Sector'  //no need to use 'call'
    },
    isSectorToConquer: function(player, sector) {
        return sector != null && this.isValidSector(sector) && !sector.isOwnedByPlayer(player)
    },
    isEnemySector: function(player, sector) {
        return sector != null && this.isValidSector(sector) && sector.owner != null &&
               sector.owner.name != player.name
    }
}

