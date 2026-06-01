import { useCallback, useMemo, useState } from "react";
import { ScenarioManifest } from "../types";

interface FileTreeProps {
  manifest: ScenarioManifest | null;
  activeFile: string | null;
  onFileSelect: (filePath: string) => void;
}

interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
}

function buildFileTree(files: { runtimePath: string }[]): FileTreeNode[] {
  const nodes: Map<string, FileTreeNode> = new Map();
  const rootChildren: FileTreeNode[] = [];

  files.forEach((file) => {
    const parts = file.runtimePath.split("/").filter(Boolean);
    let currentPath = "";

    parts.forEach((part, index) => {
      const prevPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = index === parts.length - 1;

      if (!nodes.has(currentPath)) {
        const node: FileTreeNode = {
          name: part,
          path: currentPath,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
        };
        nodes.set(currentPath, node);

        if (!prevPath) {
          rootChildren.push(node);
        } else {
          const parent = nodes.get(prevPath);
          if (parent && parent.children) {
            parent.children.push(node);
          }
        }
      }
    });
  });

  return rootChildren;
}

function FileTreeItem({
  node,
  expanded,
  onToggle,
  onSelect,
  activeFile,
}: {
  node: FileTreeNode;
  expanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  activeFile: string | null;
}): JSX.Element {
  const isFolder = node.type === "folder";
  const isActive = activeFile === node.path;
  const hasChildren = isFolder && node.children && node.children.length > 0;

  return (
    <div>
      <div
        className={`file-tree-item ${isActive ? "active" : ""} ${
          isFolder ? "folder" : "file"
        }`}
        onClick={() => {
          if (isFolder) {
            onToggle();
          } else {
            onSelect();
          }
        }}
      >
        {isFolder && (
          <span className="file-tree-chevron">
            {hasChildren ? (expanded ? "▼" : "▶") : ""}
          </span>
        )}
        <span className="file-tree-icon">
          {isFolder ? "▪" : "▫"}
        </span>
        <span className="file-tree-label">{node.name}</span>
      </div>

      {isFolder && expanded && hasChildren && (
        <div className="file-tree-children">
          {node.children!.map((child) => (
            <FileTreeItemWrapper
              key={child.path}
              node={child}
              onSelect={onSelect}
              activeFile={activeFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FileTreeItemWrapper({
  node,
  onSelect,
  activeFile,
}: {
  node: FileTreeNode;
  onSelect: () => void;
  activeFile: string | null;
}): JSX.Element {
  const [expanded, setExpanded] = useState(false);

  return (
    <FileTreeItem
      node={node}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      onSelect={onSelect}
      activeFile={activeFile}
    />
  );
}

export default function FileTree({
  manifest,
  activeFile,
  onFileSelect,
}: FileTreeProps): JSX.Element {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["aircraft"])
  );

  const tree = useMemo(() => {
    if (!manifest) return [];
    return buildFileTree(manifest.files);
  }, [manifest]);

  const toggleFolder = useCallback((folderPath: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  }, []);

  const renderNode = (node: FileTreeNode): JSX.Element => {
    const isFolder = node.type === "folder";
    const isActive = activeFile === node.path;
    const expanded = expandedFolders.has(node.path);
    const hasChildren = isFolder && node.children && node.children.length > 0;

    return (
      <div key={node.path}>
        <div
          className={`file-tree-item ${isActive ? "active" : ""} ${
            isFolder ? "folder" : "file"
          }`}
          onClick={() => {
            if (isFolder) {
              toggleFolder(node.path);
            } else {
              onFileSelect(node.path);
            }
          }}
        >
          {isFolder && (
            <span className="file-tree-chevron">
              {hasChildren ? (expanded ? "▼" : "▶") : ""}
            </span>
          )}
          <span className="file-tree-icon">
            {isFolder ? "▪" : "▫"}
          </span>
          <span className="file-tree-label">{node.name}</span>
        </div>

        {isFolder && expanded && hasChildren && (
          <div className="file-tree-children">
            {node.children!.map((child) => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  if (!manifest) {
    return <div className="file-tree">No manifest loaded</div>;
  }

  return (
    <div className="file-tree">
      <div className="file-tree-header">Files</div>
      {tree.map((node) => renderNode(node))}
    </div>
  );
}
