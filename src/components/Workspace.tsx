import { Container } from 'react-bootstrap';

export function Workspace() {
  return (
    <Container fluid className="h-100 bg-light p-3" style={{ minHeight: '100vh' }}>
      <div className="border rounded p-3 h-100 bg-white">
        <h4>Workspace</h4>
        <p className="text-muted">
          This area will display dynamic content, visualizations, and interactive elements
          based on the conversation context.
        </p>
      </div>
    </Container>
  );
}