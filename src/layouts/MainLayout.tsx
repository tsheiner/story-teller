import { ReactNode } from 'react';
import { Container } from 'react-bootstrap';
import { ProjectContext } from '../config/projectContext';
import styles from './MainLayout.module.css';

interface LayoutProps {
  children: ReactNode;
  context: ProjectContext;
}

export function CenteredChatLayout({ children }: LayoutProps) {
  return (
    <Container fluid className={`d-flex align-items-center justify-content-center p-0 ${styles.centeredContainer}`}>
      <div className={styles.centeredContent}>
        {children}
      </div>
    </Container>
  );
}

export function SplitViewLayout({ children }: LayoutProps) {
  return (
    <Container fluid className={`d-flex p-0 ${styles.splitContainer}`}>
      <div className={`d-flex ${styles.splitContent}`}>
        <div className={styles.chatPanel}>
          {Array.isArray(children) ? children[0] : children}
        </div>
        <div className={styles.workspacePanel}>
          {Array.isArray(children) ? children[1] : null}
        </div>
      </div>
    </Container>
  );
}