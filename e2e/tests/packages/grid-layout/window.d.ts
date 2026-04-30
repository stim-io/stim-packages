export {};

declare global {
  interface Window {
    __gridLayoutFixture: {
      events: unknown[];
      layoutRequests: unknown[];
      dragRequests: unknown[];
      rejectedLayoutRequests: unknown[];
      pushLayoutRequests: unknown[];
      rejectedResizePlans: Array<{
        panels: Array<{
          id: string;
          columnStart: number;
          columnSpan: number;
          rowStart: number;
          rowSpan: number;
        }>;
      }>;
      rejectedDragPlans: Array<{
        panels: Array<{
          id: string;
          columnStart: number;
          columnSpan: number;
          rowStart: number;
          rowSpan: number;
        }>;
      }>;
      pushDragPlans: Array<{
        panels: Array<{
          id: string;
          columnStart: number;
          columnSpan: number;
          rowStart: number;
          rowSpan: number;
        }>;
      }>;
      pushSkipDragPlans: Array<{
        panels: Array<{
          id: string;
          columnStart: number;
          columnSpan: number;
          rowStart: number;
          rowSpan: number;
        }>;
      }>;
      reflowDragPlans: Array<{
        rows: number;
        panels: Array<{
          id: string;
          columnStart: number;
          columnSpan: number;
          rowStart: number;
          rowSpan: number;
        }>;
      }>;
      reflowFixedDragPlans: Array<{
        panels: Array<{
          id: string;
          columnStart: number;
          columnSpan: number;
          rowStart: number;
          rowSpan: number;
        }>;
      }>;
      triggerDragRequests: Array<{
        dragTriggerId: string;
        dragHandleId: string;
        panelId: string;
        plan: {
          panels: Array<{
            id: string;
            columnStart: number;
            columnSpan: number;
            rowStart: number;
            rowSpan: number;
          }>;
        };
      }>;
      triggerDragPlans: Array<{
        panels: Array<{
          id: string;
          columnStart: number;
          columnSpan: number;
          rowStart: number;
          rowSpan: number;
        }>;
      }>;
      unregisterReflowActive(): void;
      unregisterExternalDragTrigger(): void;
      getExternalDragTriggerCount(): number;
      getExternalDragHandleCount(): number;
      setAcceptPushRequests(accept: boolean): void;
      applyFocus(): void;
      exerciseStaleRegistration(): boolean;
      getDefaultDragStrategy(): string | undefined;
      getDragHandleLifecycleKinds(): string[];
      getPlanMode(name: "a" | "b"): string | undefined;
      getPanelSpan(id: string): { columnSpan: number; rowSpan: number } | null;
      getPanelStart(
        id: string,
      ): { columnStart: number; rowStart: number } | null;
      getRejectedPanelSpan(): { columnSpan: number; rowSpan: number } | null;
      getRejectedAdjacentPanelSpan(): {
        columnSpan: number;
        rowSpan: number;
      } | null;
      getNamespace(selector: string): string | undefined;
      getGridTemplate(selector: string): string;
      getPanelPlacement(selector: string): {
        hidden: boolean;
        visible: string | undefined;
        columnStart: string;
        columnEnd: string;
        rowStart: string;
        rowEnd: string;
      };
      getPanelSnapshot(selector: string): {
        active: string | undefined;
        transform: string;
        x: number;
        y: number;
      };
      getDragTriggerDataset(selector: string): {
        trigger: string | undefined;
        handle: string | undefined;
        panel: string | undefined;
        strategy: string | undefined;
        dragging: string | undefined;
      };
      getPreviewPlacement(): {
        hidden: boolean;
        panel: string | undefined;
        interaction: string | undefined;
        columnStart: string;
        columnEnd: string;
        rowStart: string;
        rowEnd: string;
      };
      getRejectedPreviewPlacement(): {
        hidden: boolean;
        panel: string | undefined;
        interaction: string | undefined;
        columnStart: string;
        columnEnd: string;
        rowStart: string;
        rowEnd: string;
      };
      getPushPreviewPlacement(): {
        hidden: boolean;
        panel: string | undefined;
        interaction: string | undefined;
        columnStart: string;
        columnEnd: string;
        rowStart: string;
        rowEnd: string;
      };
    };
  }
}
