import { useCallback, useEffect, useMemo, useState } from "react";
import { withBase } from "../../lib/basePath";
import { downloadTextFile } from "../../lib/downloadFile";
import {
  getModelField,
  getSectionRoot,
  parseModel,
  serializeModel,
  setModelField,
  setSectionRoot,
  type DesignerModel,
} from "../lib/modelCodec";
import { validateModel, type ValidationResult } from "../lib/validator";
import type { FieldSchema, SectionSchema } from "../schema/types";
import type { XmlElement } from "../lib/xmlTree";

const DEFAULT_MODEL_URL = "/scenario/hobby-rocket/aircraft/hobby_rocket/hobby_rocket.xml";
const DEFAULT_FILENAME = "hobby_rocket.xml";

/** Matches manifest.json's `files[].runtimePath` for hobby_rocket.xml — the
 * VFS path "Run this model" writes to so Mission Control picks it up. */
export const MODEL_RUNTIME_PATH = "aircraft/hobby_rocket/hobby_rocket.xml";

export interface DesignerModelState {
  model: DesignerModel | null;
  filename: string;
  isLoading: boolean;
  error: string | null;
  validation: ValidationResult;
}

export interface DesignerModelActions {
  importFile: (file: File) => Promise<void>;
  downloadFile: () => void;
  getField: (section: SectionSchema, field: FieldSchema) => string;
  setField: (section: SectionSchema, field: FieldSchema, value: string) => void;
  getSectionRootOf: (section: SectionSchema) => XmlElement | undefined;
  setSection: (section: SectionSchema, newSectionRoot: XmlElement) => void;
}

export function useDesignerModel(): DesignerModelState & DesignerModelActions {
  const [model, setModel] = useState<DesignerModel | null>(null);
  const [filename, setFilename] = useState(DEFAULT_FILENAME);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(withBase(DEFAULT_MODEL_URL));
        if (!response.ok) throw new Error(`Failed to fetch ${DEFAULT_MODEL_URL}: ${response.status}`);
        const text = await response.text();
        if (cancelled) return;
        setModel(parseModel(text));
        setFilename(DEFAULT_FILENAME);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const importFile = useCallback(async (file: File): Promise<void> => {
    setError(null);
    try {
      const text = await file.text();
      setModel(parseModel(text));
      setFilename(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const downloadFile = useCallback((): void => {
    if (!model) return;
    downloadTextFile(serializeModel(model), filename, "application/xml");
  }, [model, filename]);

  const getField = useCallback(
    (section: SectionSchema, field: FieldSchema): string => getModelField(model, section, field),
    [model]
  );

  const setField = useCallback((section: SectionSchema, field: FieldSchema, value: string): void => {
    setModel((prev) => (prev ? setModelField(prev, section, field, value) : prev));
  }, []);

  const getSectionRootOf = useCallback(
    (section: SectionSchema): XmlElement | undefined => getSectionRoot(model, section),
    [model]
  );

  const setSection = useCallback((section: SectionSchema, newSectionRoot: XmlElement): void => {
    setModel((prev) => (prev ? setSectionRoot(prev, section, newSectionRoot) : prev));
  }, []);

  const validation = useMemo(() => validateModel(model), [model]);

  return {
    model,
    filename,
    isLoading,
    error,
    validation,
    importFile,
    downloadFile,
    getField,
    setField,
    getSectionRootOf,
    setSection,
  };
}
