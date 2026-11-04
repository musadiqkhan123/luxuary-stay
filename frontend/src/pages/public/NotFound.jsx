import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container page narrow not-found">
      <p className="not-found-code">404</p>
      <h1>This page is not on any floor</h1>
      <p className="lead">The link may be old or mistyped.</p>
      <Link to="/" className="btn btn-primary">Back to the homepage</Link>
    </div>
  );
}
