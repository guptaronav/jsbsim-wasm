interface Tab {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export default function TabBar({ tabs, activeTab, onChange }: TabBarProps): JSX.Element {
  return (
    <nav className="dz-tab-bar" aria-label="Model sections">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`dz-tab ${activeTab === tab.id ? "dz-tab--active" : ""}`}
          aria-current={activeTab === tab.id ? "page" : undefined}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
