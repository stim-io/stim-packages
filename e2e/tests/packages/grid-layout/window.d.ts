export {};

declare global {
  interface Window {
    __gridLayoutFixture: {
      events: unknown[];
      layoutRequests: unknown[];
      dragRequests: unknown[];
      rejectedLayoutRequests: unknown[];
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
      applyFocus(): void;
      exerciseStaleRegistration(): boolean;
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
    };
  }
}
