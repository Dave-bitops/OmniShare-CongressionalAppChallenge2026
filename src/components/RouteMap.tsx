import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, X, AlertCircle, Loader2, Clock, Route as RouteIcon } from 'lucide-react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface Props {
  pickupAddress: string;
  deliveryAddress: string;
  onClose: () => void;
}

interface RouteInfo {
  distance: string;
  duration: string;
}

// Decode a Google-encrypted polyline string into an array of LatLng points.
function decodePolyline(encoded: string): google.maps.LatLng[] {
  const coords: google.maps.LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dLat = (result & 1) ? ~(result >> 1) : result >> 1;
    lat += dLat;

    result = 0;
    shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dLng = (result & 1) ? ~(result >> 1) : result >> 1;
    lng += dLng;

    coords.push(new google.maps.LatLng(lat * 1e-5, lng * 1e-5));
  }

  return coords;
}

export function RouteMap({ pickupAddress, deliveryAddress, onClose }: Props) {
  const { status, error } = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);

  // Initialize the map once the script is ready.
  useEffect(() => {
    if (status !== 'ready' || !mapRef.current || mapInstance.current) return;

    mapInstance.current = new google.maps.Map(mapRef.current, {
      zoom: 12,
      center: { lat: 38.8974, lng: -77.0274 }, // Washington DC
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });
  }, [status]);

  // Compute route via Routes API v2 (computeRoutes) once map is initialized.
  useEffect(() => {
    if (status !== 'ready' || !mapInstance.current) return;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    const map = mapInstance.current;

    setCalculating(true);
    setRouteError(null);

    // Clear any previous polyline + markers.
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    fetch(`${supabaseUrl}/functions/v1/compute-routes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        origin: pickupAddress,
        destination: deliveryAddress,
        apiKey,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          let detail = '';
          try {
            const errBody = await res.json();
            detail = errBody?.error?.message ?? '';
          } catch {
            /* ignore parse errors */
          }
          throw new Error(detail || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setCalculating(false);

        const route = data?.routes?.[0];
        if (!route) {
          setRouteError('No route found between these addresses.');
          return;
        }

        // Assemble full polyline from leg steps.
        let encodedPolyline: string | undefined = route.polyline?.encodedPolyline;
        if (!encodedPolyline) {
          const steps = route?.legs?.[0]?.steps ?? [];
          if (steps.length > 0 && steps[0].polyline?.encodedPolyline) {
            encodedPolyline = steps.map((s: { polyline?: { encodedPolyline?: string } }) => s.polyline?.encodedPolyline ?? '').join('');
          }
        }

        if (!encodedPolyline) {
          setRouteError('Route returned without a usable polyline.');
          return;
        }

        const path = decodePolyline(encodedPolyline);

        // Draw the route polyline.
        polylineRef.current = new google.maps.Polyline({
          path,
          strokeColor: '#5a6141',
          strokeWeight: 5,
          map,
        });

        // Add pickup (A) and delivery (B) markers.
        const origin = path[0];
        const dest = path[path.length - 1];
        if (origin) {
          markersRef.current.push(
            new google.maps.Marker({
              position: origin,
              map,
              label: { text: 'A', color: '#ffffff', fontSize: '12px', fontWeight: 'bold' },
            })
          );
        }
        if (dest) {
          markersRef.current.push(
            new google.maps.Marker({
              position: dest,
              map,
              label: { text: 'B', color: '#ffffff', fontSize: '12px', fontWeight: 'bold' },
            })
          );
        }

        // Fit bounds to show the entire route.
        const bounds = new google.maps.LatLngBounds();
        path.forEach((p) => bounds.extend(p));
        map.fitBounds(bounds);

        // Extract distance + duration.
        const meters = route.distanceMeters;
        const durationSeconds = parseFloat(route.duration ?? '0');

        const distanceText = meters >= 1609.34
          ? `${(meters / 1609.34).toFixed(1)} mi`
          : `${Math.round(meters)} m`;

        const durationText = durationSeconds >= 3600
          ? `${Math.floor(durationSeconds / 3600)}h ${Math.round((durationSeconds % 3600) / 60)}m`
          : `${Math.round(durationSeconds / 60)} min`;

        setRouteInfo({ distance: distanceText, duration: durationText });
      })
      .catch((err: Error) => {
        setCalculating(false);
        setRouteError(`Route request failed: ${err.message}`);
      });
  }, [status, pickupAddress, deliveryAddress]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-olive-950/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-olive-200 bg-cream-50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-olive-100 bg-cream-100 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-olive-700" />
            <h3 className="text-base font-bold text-olive-950">Delivery Route Map</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-olive-400 transition hover:bg-olive-100 hover:text-olive-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Route summary */}
        <div className="flex flex-col gap-3 border-b border-olive-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1 text-xs">
            <p className="flex items-center gap-1.5 text-olive-600">
              <MapPin className="h-3.5 w-3.5 text-clay-500" />
              <span className="font-semibold text-olive-800">Pickup:</span> {pickupAddress}
            </p>
            <p className="flex items-center gap-1.5 text-olive-600">
              <MapPin className="h-3.5 w-3.5 text-olive-600" />
              <span className="font-semibold text-olive-800">Delivery:</span> {deliveryAddress}
            </p>
          </div>

          {routeInfo && (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 rounded-lg bg-olive-50 px-3 py-1.5 text-xs font-semibold text-olive-700">
                <RouteIcon className="h-3.5 w-3.5" /> {routeInfo.distance}
              </span>
              <span className="flex items-center gap-1.5 rounded-lg bg-cream-200 px-3 py-1.5 text-xs font-semibold text-clay-600">
                <Clock className="h-3.5 w-3.5" /> {routeInfo.duration}
              </span>
            </div>
          )}
        </div>

        {/* Map / status area */}
        <div className="relative h-[400px] w-full">
          {status === 'error' && (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <AlertCircle className="mb-2 h-10 w-10 text-red-400" />
              <p className="text-sm font-medium text-olive-700">{error}</p>
            </div>
          )}

          {status === 'loading' && (
            <div className="flex h-full flex-col items-center justify-center">
              <Loader2 className="mb-2 h-8 w-8 animate-spin text-olive-400" />
              <p className="text-sm text-olive-500">Loading Google Maps…</p>
            </div>
          )}

          {status === 'ready' && calculating && !routeInfo && !routeError && (
            <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-cream-50/90 px-4 py-2 text-xs font-medium text-olive-600 shadow-md">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Calculating route…
            </div>
          )}

          {status === 'ready' && routeError && (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <AlertCircle className="mb-2 h-10 w-10 text-amber-500" />
              <p className="text-sm font-medium text-olive-700">{routeError}</p>
            </div>
          )}

          <div ref={mapRef} className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
