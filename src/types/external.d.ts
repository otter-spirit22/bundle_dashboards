declare module "clsx" {
  export default function clsx(
    ...inputs: Array<string | number | boolean | undefined | null | Record<string, boolean>>
  ): string;
}

declare module "html2canvas" {
  interface Html2CanvasOptions {
    scale?: number;
    backgroundColor?: string | null;
    [key: string]: unknown;
  }

  export default function html2canvas(
    element: HTMLElement,
    options?: Html2CanvasOptions
  ): Promise<HTMLCanvasElement>;
}

declare module "jspdf" {
  interface JsPdfOptions {
    orientation?: "portrait" | "landscape" | string;
    unit?: string;
    format?: string | number[];
  }

  class jsPDF {
    constructor(options?: JsPdfOptions);
    addImage(
      imageData: string | HTMLImageElement | HTMLCanvasElement,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number
    ): void;
    addPage(): jsPDF;
    save(filename?: string): void;
    internal: {
      pageSize: {
        getWidth(): number;
        getHeight(): number;
      };
    };
  }

  export default jsPDF;
}

declare module "xlsx" {
  type WorkBook = {
    SheetNames: string[];
    Sheets: Record<string, WorkSheet>;
  };

  type WorkSheet = Record<string, unknown>;

  interface SheetToJsonOptions {
    defval?: unknown;
    header?: number | string[];
  }

  export function read(data: ArrayBuffer, opts: { type: "array" }): WorkBook;
  export const utils: {
    sheet_to_json(sheet: WorkSheet, opts?: SheetToJsonOptions): unknown[];
  };
}
