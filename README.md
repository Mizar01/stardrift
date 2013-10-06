stardrift
=========

* Solved FlatLandia Map problem.
- unregisterActor must be carefully tested. Try a lot of times to delete actors with simulated attacks.
- see why sometimes a unit is not taken as a target (must be in the gameLogic when selecting a unit)
- see the picking, because it's not really working sometimes, it picks the object behind.
* the player.getSpawnCooldown should be based both on units and sector conquered.
- spawnCooldown should be intended in seconds, but if so, everything should be based on that.
- implements menu (begun)
- implements unit positioning starting from map properties.
* The point targeting is implemented but the unit is not yet moving toward a simple point.   
*  The problem now is that when i changed selection and another actor reach its target point, my current hilight on the
  current destination disappears (Because the highlight is deselected from the other actor)
* Implement a single plane object for terrain intersections, add only this object to the picking Set and
  don't add each sector. This will be useful for multiple selections , and it'll be a performance improvement.
* Began logic for multiselection. 
* Do effectively implement the selectedUnitArray and find actors between multiSelectStart and multiSelectEnd points.
- In case of multiselection, calculate a decent position for each unit if a position is set. 
* In case of multiselection, avoid to show more than one sector or enemy hilight (probably this is difficult, I could 
  set a count of attached higlight to a sector or an enemy to avoid stacking lots of hilight in the same place)
* draw something when the mouse is dragged (a wire plane with changing size ?? maybe)
- There are so many 'undefined' in the terrain.actorChildren right from the start, why ?
- (NOT REPRODUCIBLE) After some time the hlPoint of new units are not rotating.
* After some time I'm unable to select enemy spawnSectors (due to unremoved actors standing in the way)
- After some time some hilight actor are remaining on screen.
* After some time I can't select some sectors (this.targetSector remains void)(due to unremoved actors standing in the way)
* this.pickables.splice(pi) // TODO : debug this. - The selection is compromised.
- The camera rotation by events with "," and "." is no more working because of the logic changed in ace3.camera. See
  if it can be solved easily. NOT IMPORTANT right now.

