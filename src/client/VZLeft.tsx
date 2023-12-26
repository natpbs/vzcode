import { useContext } from 'react';
import { VZSettings } from './VZSettings';
import { VZSidebar } from './VZSidebar';
import { VZCodeContext } from './VZCodeContext';
import { SplitPaneResizeContext } from './SplitPaneResizeContext';

// The middle portion of the VZCode environment, containing:
// * The sidebar
// * The settings modal
export const VZLeft = ({ enableUsernameField = true }) => {
  // TODO leverage this context in deeper levels of the component tree.
  const {
    files,
    createFile,
    renameFile,
    deleteFile,
    deleteDirectory,
    activeFileId,
    openTab,
    closeTabs,
    isSettingsOpen,
    setIsSettingsOpen,
    closeSettings,
    theme,
    setTheme,
    username,
    setUsername,
    isDirectoryOpen,
    toggleDirectory,
  } = useContext(VZCodeContext);

  const { sidebarWidth } = useContext(
    SplitPaneResizeContext,
  );

  return (
    <div
      className="left"
      style={{ width: sidebarWidth + 'px' }}
    >
      <VZSidebar
        files={files}
        createFile={createFile}
        renameFile={renameFile}
        deleteFile={deleteFile}
        deleteDirectory={deleteDirectory}
        openTab={openTab}
        closeTabs={closeTabs}
        setIsSettingsOpen={setIsSettingsOpen}
        isDirectoryOpen={isDirectoryOpen}
        toggleDirectory={toggleDirectory}
        activeFileId={activeFileId}
      />
      <VZSettings
        show={isSettingsOpen}
        onClose={closeSettings}
        theme={theme}
        setTheme={setTheme}
        username={username}
        setUsername={setUsername}
        enableUsernameField={enableUsernameField}
      />
    </div>
  );
};
