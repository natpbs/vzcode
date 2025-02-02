import { useCallback, useMemo } from 'react';
import type { FileId } from '../../types';
import type { TabState } from '../vzReducer';

// Supports adding the file's containing folder to the tab name
const fileNameSplit = (fileName: string) => {
  const split = fileName.split('/');
  if (split.length === 1) return split[split.length - 1];
  return (
    split[split.length - 2] + '/' + split[split.length - 1]
  );
};

export const Tab = ({
  fileId,
  isTransient,
  isActive,
  setActiveFileId,
  openTab,
  closeTabs,
  fileName,
}: {
  fileId: FileId;
  isTransient: boolean;
  isActive: boolean;
  setActiveFileId: (fileId: FileId) => void;
  openTab: (tabState: TabState) => void;
  closeTabs: (fileIds: FileId[]) => void;
  fileName: string;
}) => {
  const handleCloseClick = useCallback(
    (event: React.MouseEvent) => {
      // Stop propagation so that the outer listener doesn't fire.
      event.stopPropagation();

      closeTabs([fileId]);
    },
    [closeTabs, fileId],
  );

  const tabName = useMemo(
    () => fileNameSplit(fileName),
    [fileName],
  );

  const handleClick = useCallback(() => {
    setActiveFileId(fileId);
  }, [fileId, setActiveFileId]);

  // Double-clicking a transient tab makes it a persistent tab.
  const handleDoubleClick = useCallback(() => {
    openTab({ fileId, isTransient: false });
  }, [fileId, openTab]);

  return (
    <div
      className={`tab user-select-none ${
        isActive ? 'active' : ''
      } ${isTransient ? 'transient' : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {tabName}
      <div
        className={'bx bx-x tab-close'}
        onClick={handleCloseClick}
      ></div>
    </div>
  );
};
