import { Container } from 'react-bootstrap';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-vh-100 bg-light">
      <Sidebar />
      <div style={{ marginLeft: '250px' }}>
        <Header />
        <main className="p-4">
          <Container fluid>
            {children}
          </Container>
        </main>
      </div>
    </div>
  );
};

export default Layout;
