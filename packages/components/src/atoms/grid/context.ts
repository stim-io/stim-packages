import type { InjectionKey, ShallowRef } from "vue";
import type { GridNamespace } from "@stim-io/grid-layout";

export interface StimGridContext {
  ns: ShallowRef<GridNamespace | null>;
}

export const stimGridContextKey: InjectionKey<StimGridContext> =
  Symbol("stim-grid-context");
