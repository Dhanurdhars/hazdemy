import { Link } from 'react-router-dom';
import { PageHead } from '../components/UI';

export default function NotFound() {
  return (
    <PageHead title="Page not found" lead="The page you are looking for doesn’t exist.">
      <div className="hero-actions"><Link className="btn btn-primary" to="/">Go home</Link><Link className="btn btn-light" to="/training">Browse courses</Link></div>
    </PageHead>
  );
}
