import type { Dir, RoadCfg, SceneCfg, VehicleCfg } from '../types';

// Небольшие помощники для описания дорожных ситуаций.

export const road = (o: Partial<RoadCfg> = {}): RoadCfg => ({ lanes: 1, ...o });

/** Перекрёсток четырёх дорог. */
export function cross(
  o: { lanes?: number; s?: Partial<RoadCfg>; w?: Partial<RoadCfg>; n?: Partial<RoadCfg>; e?: Partial<RoadCfg> } = {},
  vehicles: VehicleCfg[] = [],
  extra: Partial<SceneCfg> = {},
): SceneCfg {
  const l = o.lanes ?? 1;
  return {
    roads: {
      0: road({ lanes: l, ...o.s }),
      1: road({ lanes: l, ...o.w }),
      2: road({ lanes: l, ...o.n }),
      3: road({ lanes: l, ...o.e }),
    },
    vehicles,
    ...extra,
  };
}

/** Т-образный перекрёсток без северной дороги. */
export function tee(
  o: { lanes?: number; s?: Partial<RoadCfg>; w?: Partial<RoadCfg>; e?: Partial<RoadCfg> } = {},
  vehicles: VehicleCfg[] = [],
  extra: Partial<SceneCfg> = {},
): SceneCfg {
  const l = o.lanes ?? 1;
  return {
    roads: { 0: road({ lanes: l, ...o.s }), 1: road({ lanes: l, ...o.w }), 3: road({ lanes: l, ...o.e }) },
    vehicles,
    ...extra,
  };
}

/** Прямой участок дороги (юг — север). Знаки стоят справа от нас, переход — впереди. */
export function straight(o: Partial<RoadCfg> = {}, vehicles: VehicleCfg[] = [], extra: Partial<SceneCfg> = {}): SceneCfg {
  const { signs, crosswalk, ...common } = o;
  return { roads: { 0: road({ ...common, signs }), 2: road({ ...common, crosswalk }) }, vehicles, ...extra };
}

export const me = (o: Partial<VehicleCfg> = {}): VehicleCfg => ({ id: 'player', road: 0, lane: 0, ...o });

export const car = (id: string, roadDir: Dir, o: Partial<VehicleCfg> = {}): VehicleCfg => ({
  id,
  label: id,
  road: roadDir,
  lane: 0,
  ...o,
});
