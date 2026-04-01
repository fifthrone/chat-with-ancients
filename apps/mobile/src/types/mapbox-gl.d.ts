/**
 * Narrow typings for the subset of mapbox-gl used in Expo web (dynamic import).
 * The stock `mapbox-gl` v2 package ships without bundled TypeScript declarations.
 */
declare module "mapbox-gl" {
  export class LngLatBounds {
    constructor();
    extend(coord: [number, number]): void;
    isEmpty(): boolean;
  }

  export class Marker {
    constructor(options?: { element?: HTMLElement });
    setLngLat(lnglat: [number, number]): this;
    addTo(map: Map): this;
  }

  export class Map {
    constructor(options: {
      container: HTMLElement;
      style: string;
      center: [number, number];
      zoom: number;
    });
    remove(): void;
    fitBounds(
      bounds: LngLatBounds,
      options?: { padding?: number; duration?: number; maxZoom?: number },
    ): void;
    flyTo(options: {
      center: [number, number];
      zoom: number;
      padding?: unknown;
      duration?: number;
    }): void;
    easeTo(options: { padding?: unknown; duration?: number }): void;
    getZoom(): number;
    getContainer(): HTMLElement;
  }

  const mapboxgl: {
    accessToken: string;
    Map: typeof Map;
    Marker: typeof Marker;
    LngLatBounds: typeof LngLatBounds;
  };

  export default mapboxgl;
}
