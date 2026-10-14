// Shared RuneScape 3 map setup. Both the guessing screen and the pack creator's
// coordinate picker MUST use the exact same CRS / tile layer / initial view,
// otherwise the lat/lng a creator saves won't line up with the coordinate a
// player clicks.
//
// Tiles come from the official RuneScape Wiki map server (the same source the
// gazlloyd / wiki map viewers use) which renders the nicer "3D" maps and, unlike
// the old mejrs GitHub mirror, serves instanced maps such as the Underworld /
// City of Um (mapId 742). Bump MAP_VERSION when the wiki publishes a new render.
export const MAP_VERSION = '2026-06-15';

import { getMapInfo } from '$lib/mapList';

function tileUrl(mapId: number | string) {
	return `https://maps.runescape.wiki/rs/versions/${MAP_VERSION}/map_squares/${mapId}/{z}/0_{x}_{y}.png`;
}

const DEFAULT_ZOOM = 2;

export interface GameMapOptions {
	/** RuneScape mapID. -1 is the overworld; instanced areas use their own id. */
	mapId?: number;
	zoom?: number;
}

/**
 * Creates a Leaflet map on the given element using the RS3 wiki tiles, centred
 * on the requested map. `L` is the global Leaflet object loaded in app.html.
 */
export function createGameMap(L: any, element: string | HTMLElement, opts: GameMapOptions = {}) {
	const mapId = opts.mapId ?? -1;
	const zoom = opts.zoom ?? DEFAULT_ZOOM;
	const info = getMapInfo(mapId);

	const map = L.map(element, {
		crs: L.CRS.Simple,
		minZoom: 0,
		maxZoom: 3,
		attributionControl: false
	}).setView([info.lat, info.lng], zoom);

	const GameTileLayer = L.TileLayer.extend({
		getTileUrl: function (coords: any) {
			return L.Util.template(tileUrl(mapId), {
				z: coords.z,
				x: coords.x,
				y: -(1 + coords.y)
			});
		}
	});

	new GameTileLayer({ minZoom: 0, maxNativeZoom: 3, maxZoom: 3, noWrap: true })
		.addTo(map)
		.bringToBack();

	return map;
}

export function gameMarkerIcon(L: any) {
	return L.icon({
		iconUrl: '/marker.png',
		iconSize: [41, 50],
		iconAnchor: [20, 50]
	});
}
