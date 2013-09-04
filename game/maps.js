function loadMap(mapName) {

	map_sectorsX = null
	map_sectorsY = null
	map_string = null
	game_spawn_units_array = null
	camera_pos = null

	switch (mapName) {
	case "tutorial_map":
		map_sectorsX=14;
		map_sectorsY=15;
		map_string= "------mm------"+
		            "-m------------"+
		            "--------m-----"+
		            "---mmm--mm----"+
		            "-------mmm----"+
		            "----mm----mm--"+
		            "-------mmmm---"+
		            "--------mmmm--"+
		            "-----------mm-"+
		            "----mm--------"+
		            "--mm-mm---mm--"+
		            "----mmm-------"+
		            "----mmm-------"+
		            "--------------";
		break;

	case "longway":
		map_sectorsX = 10;
		map_sectorsY = 4;
		map_string = "------m---" + 
		             "FT-TmFT-TF" + 
		             "FT-TFmT-TF" + 
		             "---m------"
		game_spawn_units_array=new Array("p1,rock,0,0","p1,paper,0,1","p2,rock,9,2","p2,scissors,9,1");
		break

	case "deepRoad":
		map_sectorsX = 4;
		map_sectorsY = 20;
		map_string = "-FF-" +
		             "----" +
		             "T--T" +
		             "mTTm" +
		             "----" +
		             "m--m" +
		             "----" +
		             "----" +
		             "mFFm" +
		             "TmmT" +
		             "TmmT" +
		             "mFFm" +
		             "----" +
		             "----" +
		             "m--m" +
		             "----" +
		             "mTTm" +
		             "T--T" +
		             "----" +
		             "-FF-";
		game_spawn_units_array=new Array("p2,rock,0,0","p2,paper,1,0","p1,rock,0,19","p1,scissors,1,19");
		camera_pos = new THREE.Vector3(0,20, 50)
		break		   


	case "tick-tack-toe":
		map_sectorsX=3;
		map_sectorsY=3;
		map_string= "fm-"+
		            "-t-"+
		            "--f";
		game_spawn_units_array=new Array("p1,rock,0,0","p1,paper,0,0","p2,rock,2,2","p2,scissors,2,2");
		break;
	case "mini-map":
		map_sectorsX=10;
		map_sectorsY=8;
		map_string="----------"+
				   "-m-T--T---"+
				   "----------"+
				   "--FT--TF--"+
				   "--FT--TF--"+
				   "----------"+
				   "---T--T-m-"+
				   "----------";
		game_spawn_units_array=new Array("p1,rock,0,0","p1,paper,0,0","p2,rock,9,7","p2,scissors,9,7");
		break;
	case "Land Of Destruction":
		map_sectorsX=18;
		map_sectorsY=13;
		map_string= "----tm------------"+
					"-f--tm------ttt---"+
					"-f--tm--t---tft---"+
					"----tm------ttt---"+
					"tttttm--m---------"+
					"mmmmmm-mfm--------"+
					"--t---mfmfm---t---"+
					"-------mfm--mmmmmm"+
					"--ttt---m---mttttt"+
					"--tft-------mt----"+
					"--ttt-------mt--f-"+
					"---------t--mt--f-"+
					"------------mt----";
		game_spawn_units_array=new Array(	"p1,rock,3,3","p1,paper,3,3","p1,rock,3,3","p1,scissors,3,3",
											"p2,rock,14,10","p2,scissors,14,10");
		break;
	case "Full Armored":
		map_sectorsX=10;
		map_sectorsY=10;
		map_string= "tt------tt"+
					"---ffff---"+
					"tttttttttt"+
					"tttttttttt"+
					"mmmmmmmmfm"+
					"mfmmmmmmmm"+
					"tttttttttt"+
					"tttttttttt"+
					"---ffff---"+
					"tt------tt";
		game_spawn_units_array=new Array(	"p1,rock,2,2","p1,paper,8,2","p2,rock,2,8","p2,scissors,8,8");
		break;
	case "River" :
		map_sectorsX=22;
		map_sectorsY=15;
		map_string= "tttt------------mmmmmm"+
					"tfftt-------t-mmmmmmmm"+
					"tttt---------mmmmmmmm-"+
					"--t----t--mmmmmmmmmmt-"+
					"m------mmmmmmmmmmm----"+
					"mm----mmmmmmmmmmm-----"+
					"mmm-t-mmmmmmmmm-t----m"+
					"mmmm--mmmmmmmmmm--mmmm"+
					"mm-t-mmmmmmmmmmmm--mmm"+
					"m---mmmmmmmmmmm-----mm"+
					"--tmmmmmmmmmm-t------m"+
					"--mmmmmmm----------t--"+
					"-mmmmmmmt---------tttt"+
					"mmmmmmm----------ttfft"+
					"mmmmmm------------tttt";
		game_spawn_units_array=new Array(	"p1,rock,3,3","p1,paper,3,3","p1,rock,3,3","p1,scissors,3,3",
											"p2,rock,17,13","p2,scissors,17,13");
		break;
	case "Flatlandia" :
		map_sectorsX=22;
		map_sectorsY=13;
		map_string= "f--------------------f"+
					"---------mmmmm--------"+
					"t----mmmmm---mmmmm---t"+
					"----mm-----------mm---"+
					"---mm----mmmmm---mm---"+
					"--mm-----mftfm----mm--"+
					"--mm-----mmmmm-----mm-"+
					"---mm----mftfm----mm--"+
					"---mm----mmmmm----mm--"+
					"----mm-----------mm---"+
					"t----mmmmm----mmmm---t"+
					"----------mmmm--------"+
					"f--------------------f";
		game_spawn_units_array=new Array(	"p1,rock,3,3","p1,paper,3,3","p1,rock,3,3","p1,scissors,3,3",
											"p2,rock,17,12","p2,scissors,17,12");
		break;	
	default:
		//none
	}

	return {mx: map_sectorsX, mz: map_sectorsY, map: map_string, spawns: game_spawn_units_array, cameraPos: camera_pos,}

	
	
	
}

function initMapObjects(terrainActor, mapProps) {
	// TODO : reset procedures from previously loaded map (???? maybe not here)	
	//place flags and factories
	//var sstest="";
	var mx = mapProps.mx;
	var mz = mapProps.mz;
	var ms = mapProps.map;
	var ssx = terrainActor.sizeX
	var ssz = terrainActor.sizeZ

	for (var x = 0; x < mx; x++) {
		for (var z = 0; z < mz; z++) {
			var strpos = x + z * mx;
			//sstest+=","+strpos;
			var t = ms.substring(strpos, strpos+1).toUpperCase();
			var isFlag = false
			if (t == "M") {
				var s = new MagneticSector(x, z, ssx, ssz)
			}else if (t == "F") {
				var s = new SpawnSector(terrainActor, x, z, ssx, ssz)
			}else if (t == "T") {
				var s = new TowerSector(terrainActor, x, z, ssx, ssz)
			}else {
				var s = new FlagSector(x, z, ssx, ssz)
				isFlag = true
				//continue
			}
			if (isFlag) {
				//because flag sector are not animated anymore, but
				// i have to add their object to scene
            	terrainActor.flagSectors.push(s)
            	ace3.scene.add(s.obj)
            }else {
            	terrainActor.addActor(s)
            }
            px = terrainActor.startX + x * ssx
            pz = terrainActor.startZ + z * ssz
            s.setPosition(px, 0, pz)
            terrainActor.sectors[x][z] = s

		}
	}
}