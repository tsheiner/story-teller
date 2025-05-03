import { ReactNode } from 'react';
import { Container } from 'react-bootstrap';
import styles from './UnifiedLayout.module.css';

interface UnifiedLayoutProps {
  chatPanel: ReactNode;
  workspacePanel: ReactNode;
  isWorkspaceVisible: boolean;
}

export function UnifiedLayout({ chatPanel, workspacePanel, isWorkspaceVisible }: UnifiedLayoutProps) {
  return (
    <Container fluid className={`d-flex p-0 ${styles.mainContainer}`}>
      <div className={`d-flex ${styles.contentWrapper}`}>
        <div className={`${styles.chatPanel} ${isWorkspaceVisible ? styles.chatPanelWithWorkspace : ''}`}>
          {chatPanel}
        </div>
        <div className={`${styles.workspacePanel} ${isWorkspaceVisible ? styles.visible : styles.hidden}`}>
          {workspacePanel}
        </div>
      </div>
    </Container>
  );
}