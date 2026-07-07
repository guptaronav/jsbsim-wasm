import { useState } from "react";
import { useDesignerModel, MODEL_RUNTIME_PATH } from "./hooks/useDesignerModel";
import { SIMPLE_SECTIONS } from "./schema/sections";
import { AERODYNAMICS_SECTION } from "./schema/aerodynamics";
import { serializeModel } from "./lib/modelCodec";
import { setModelOverride } from "../lib/modelOverrideStore";
import { navigate } from "../lib/router";
import DesignerHeader from "./components/DesignerHeader";
import TabBar from "./components/TabBar";
import SchemaSectionForm from "./components/SchemaSectionForm";
import AerodynamicsTab from "./components/AerodynamicsTab";

const TABS = [...SIMPLE_SECTIONS, AERODYNAMICS_SECTION].map((s) => ({ id: s.id, label: s.label }));

export default function DesignerPage(): JSX.Element {
  const designer = useDesignerModel();
  const [activeTab, setActiveTab] = useState<string>(TABS[0].id);

  if (designer.isLoading) {
    return (
      <div className="dz-boot-screen" role="status">
        <p>Loading model…</p>
      </div>
    );
  }

  if (designer.error && !designer.model) {
    return (
      <div className="dz-boot-screen dz-boot-screen--error" role="alert">
        <p>{designer.error}</p>
      </div>
    );
  }

  const activeSection = [...SIMPLE_SECTIONS, AERODYNAMICS_SECTION].find((s) => s.id === activeTab)!;
  const sectionErrors = designer.validation.errors.filter((e) => e.sectionId === activeSection.id);

  const handleRunModel = (): void => {
    if (!designer.model) return;
    setModelOverride(MODEL_RUNTIME_PATH, serializeModel(designer.model));
    navigate("mission-control");
  };

  return (
    <div className="dz-shell">
      <DesignerHeader
        filename={designer.filename}
        validation={designer.validation}
        onImportFile={(file) => void designer.importFile(file)}
        onDownload={designer.downloadFile}
        onRunModel={handleRunModel}
      />

      {designer.error && <p className="dz-inline-error">{designer.error}</p>}

      <TabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      <main className="dz-tab-content">
        {activeSection.id === "aerodynamics" ? (
          <AerodynamicsTab
            aeroRoot={designer.getSectionRootOf(AERODYNAMICS_SECTION)}
            getValue={(fieldId) =>
              designer.getField(AERODYNAMICS_SECTION, AERODYNAMICS_SECTION.fields.find((f) => f.id === fieldId)!)
            }
            onChange={(fieldId, value) =>
              designer.setField(AERODYNAMICS_SECTION, AERODYNAMICS_SECTION.fields.find((f) => f.id === fieldId)!, value)
            }
            onAeroRootChange={(newRoot) => designer.setSection(AERODYNAMICS_SECTION, newRoot)}
            errors={sectionErrors}
          />
        ) : (
          <SchemaSectionForm
            section={activeSection}
            getValue={(fieldId) => designer.getField(activeSection, activeSection.fields.find((f) => f.id === fieldId)!)}
            onChange={(fieldId, value) =>
              designer.setField(activeSection, activeSection.fields.find((f) => f.id === fieldId)!, value)
            }
            errors={sectionErrors}
          />
        )}
      </main>
    </div>
  );
}
