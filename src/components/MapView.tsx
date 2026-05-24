import { useEffect, useState } from "react";
import L from "leaflet";

// Fix default marker icons under bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  color?: string;
  emoji?: string;
};

type Props = {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  height?: string;
  className?: string;
};

export default function MapView({ center, zoom = 13, markers = [], height = "400px", className = "" }: Props) {
  const [Comp, setComp] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    import("react-leaflet").then((m) => {
      if (mounted) setComp(() => m);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!Comp) {
    return (
      <div
        className={`rounded-2xl bg-muted animate-pulse ${className}`}
        style={{ height }}
      />
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, CircleMarker } = Comp;
  return (
    <div className={`rounded-2xl overflow-hidden ${className}`} style={{ height }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m) =>
          m.color ? (
            <CircleMarker
              key={m.id}
              center={[m.lat, m.lng]}
              radius={10}
              pathOptions={{ color: m.color, fillColor: m.color, fillOpacity: 0.7 }}
            >
              {m.label && <Popup>{m.label}</Popup>}
            </CircleMarker>
          ) : (
            <Marker key={m.id} position={[m.lat, m.lng]}>
              {m.label && <Popup>{m.label}</Popup>}
            </Marker>
          ),
        )}
      </MapContainer>
    </div>
  );
}
