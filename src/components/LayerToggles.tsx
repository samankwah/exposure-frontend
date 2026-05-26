"use client";

import { Flame, Layers, UsersRound, Wind } from "lucide-react";
import type { LayerKey } from "@/types/exposure";

const layerMeta: Record<LayerKey, { label: string; icon: typeof Wind }> = {
  no2: { label: "NO₂", icon: Wind },
  fire: { label: "Fire", icon: Flame },
  population: { label: "Population", icon: UsersRound }
};

export function LayerToggles({
  activeLayers,
  onChange
}: {
  activeLayers: Record<LayerKey, boolean>;
  onChange: (layers: Record<LayerKey, boolean>) => void;
}) {
  return (
    <div className="layer-toggles" aria-label="Map layers">
      <span className="layer-title">
        <Layers size={15} aria-hidden />
        Layers
      </span>
      {Object.entries(layerMeta).map(([key, meta]) => {
        const layerKey = key as LayerKey;
        const Icon = meta.icon;
        return (
          <button
            className={activeLayers[layerKey] ? "toggle active" : "toggle"}
            key={layerKey}
            type="button"
            title={`${meta.label} layer`}
            onClick={() => onChange({ ...activeLayers, [layerKey]: !activeLayers[layerKey] })}
          >
            <Icon size={15} aria-hidden />
            <span>{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}
